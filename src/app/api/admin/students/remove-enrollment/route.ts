import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminSupabase, requireAdmin } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

/**
 * Admin-only: remove / revoke a student's access to a specific course (batch) or mock test series.
 *
 * Used when a student enrolled in the wrong course/series by mistake, has a duplicate enrollment,
 * or needs their enrollment declined/revoked by an administrator.
 *
 * To ensure the revoked item cannot be re-synthesized or unlocked via payment fallbacks,
 * any associated Verified/Pending fee_payments and approved/open payment_requests for
 * that student + item are marked as Rejected/rejected, with full rollback safety if
 * deleting the enrollment record fails.
 */

const removeEnrollmentSchema = z
  .object({
    studentId: z.string().trim().min(1).max(100),
    kind: z.enum(['course', 'mock_series']),
    itemId: z.string().trim().min(1).max(200),
    reason: z.string().trim().min(3, 'Please provide a short reason (at least 3 characters).').max(500),
    resetAttempts: z.boolean().optional().default(false),
  })
  .strict();

type Row = Record<string, any>;

function fail(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

export async function POST(request: Request) {
  const adminId = await requireAdmin(request);
  if (!adminId) return fail('Unauthorized: Administrator privileges required.', 403);

  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `admin_remove_enr_${adminId}_${ip}`,
    RATE_LIMIT_RULES.ADMIN_ACTION.limit,
    RATE_LIMIT_RULES.ADMIN_ACTION.windowSeconds
  );
  if (!rateRes.allowed) return createRateLimitResponse(rateRes);

  const raw = await request.json().catch(() => null);
  const parsed = removeEnrollmentSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message || 'Invalid request.';
    return fail(first);
  }

  const { studentId, kind, itemId, reason, resetAttempts } = parsed.data;

  const admin = createAdminSupabase();
  const isSeries = kind === 'mock_series';
  const enrTable = isSeries ? 'series_enrollments' : 'enrollments';
  const itemCol = isSeries ? 'series_id' : 'course_id';
  const itemTable = isSeries ? 'mock_series' : 'courses';

  // ---------- 1. Validate student and fetch item metadata ----------
  const [{ data: student }, { data: item }] = await Promise.all([
    admin.from('profiles').select('id, name, role, email').eq('id', studentId).maybeSingle(),
    admin.from(itemTable).select('*').eq('id', itemId).maybeSingle(),
  ]);
  if (!student) return fail('Student not found.', 404);

  const itemName = item?.name ?? itemId;

  // ---------- 2. Read current enrollment, payments, and payment requests ----------
  const { data: sourceRows, error: srcErr } = await admin
    .from(enrTable)
    .select('*')
    .eq('student_id', studentId)
    .eq(itemCol, itemId);
  if (srcErr) return fail('Could not read the current enrollment. Please try again.', 500);

  const { data: studentPayments, error: payErr } = await admin
    .from('fee_payments')
    .select('id, status, item_id, course_id, item_type, amount, rejection_reason, reviewed_at')
    .eq('student_id', studentId);
  if (payErr) return fail('Could not read the student payments. Please try again.', 500);

  const payMatchesItem = (p: Row) =>
    String(p.item_id || '') === itemId || String(p.course_id || '') === itemId;
  const matchingPayments = (studentPayments ?? []).filter(payMatchesItem);
  const activePayments = matchingPayments.filter((p: Row) => p.status !== 'Rejected');

  const { data: matchingRequests, error: reqErr } = await admin
    .from('payment_requests')
    .select('id, status, item_id, reject_reason, reviewed_by, reviewed_at')
    .eq('student_id', studentId)
    .eq('item_id', itemId);
  if (reqErr) return fail('Could not read the student payment requests. Please try again.', 500);

  const activeRequests = (matchingRequests ?? []).filter((r: Row) =>
    ['approved', 'pending_review', 'awaiting_payment'].includes(r.status)
  );

  if ((!sourceRows || sourceRows.length === 0) && activePayments.length === 0 && activeRequests.length === 0) {
    return fail('The student does not have an active enrollment in this item.', 404);
  }

  // ---------- 3. Decline / revoke matching payments & requests (with rollback tracking) ----------
  const nowIso = new Date().toISOString();
  const declineNote = `Access removed by Admin: ${reason}`;
  const updatedPayments: { id: string; before: Row }[] = [];
  const updatedRequests: { id: string; before: Row }[] = [];

  const rollbackPaymentsAndRequests = async () => {
    for (const m of updatedPayments) {
      await admin.from('fee_payments').update(m.before).eq('id', m.id);
    }
    for (const r of updatedRequests) {
      await admin.from('payment_requests').update(r.before).eq('id', r.id);
    }
  };

  for (const p of activePayments) {
    const before: Row = {
      status: p.status,
      rejection_reason: p.rejection_reason ?? null,
      reviewed_at: p.reviewed_at ?? null,
    };
    const { error } = await admin
      .from('fee_payments')
      .update({
        status: 'Rejected',
        rejection_reason: declineNote,
        reviewed_at: nowIso,
      })
      .eq('id', p.id);
    if (error) {
      await rollbackPaymentsAndRequests();
      return fail(error.message || 'Could not update associated payment records.', 500);
    }
    updatedPayments.push({ id: p.id, before });
  }

  for (const r of activeRequests) {
    const before: Row = {
      status: r.status,
      reject_reason: r.reject_reason ?? null,
      reviewed_by: r.reviewed_by ?? null,
      reviewed_at: r.reviewed_at ?? null,
    };
    const { error } = await admin
      .from('payment_requests')
      .update({
        status: 'rejected',
        reject_reason: declineNote,
        reviewed_by: adminId,
        reviewed_at: nowIso,
      })
      .eq('id', r.id);
    if (error) {
      await rollbackPaymentsAndRequests();
      return fail(error.message || 'Could not update associated payment request records.', 500);
    }
    updatedRequests.push({ id: r.id, before });
  }

  // ---------- 4. Delete the enrollment row(s) ----------
  if (sourceRows && sourceRows.length > 0) {
    const { error: delErr } = await admin
      .from(enrTable)
      .delete()
      .eq('student_id', studentId)
      .eq(itemCol, itemId);
    if (delErr) {
      await rollbackPaymentsAndRequests();
      return fail(delErr.message || 'Could not remove the enrollment record.', 500);
    }
  }

  const warnings: string[] = [];

  // ---------- 5. Course seat bookkeeping (free up seat when a course enrollment is removed) ----------
  if (!isSeries && sourceRows && sourceRows.length > 0 && item) {
    try {
      const batchSize = Number(item.batch_size ?? 0);
      const currentSeats = Number(item.seats_available ?? 0);
      if (batchSize > 0) {
        const nextSeats = Math.min(batchSize, currentSeats + 1);
        await admin
          .from('courses')
          .update({
            seats_available: nextSeats,
            ...(item.status === 'Batch Closed' && nextSeats > 0 ? { status: 'Open for Admission' } : {}),
          })
          .eq('id', itemId);
      }
    } catch {
      warnings.push('Course seat count could not be updated automatically.');
    }
  }

  // ---------- 6. Optionally clear the student's attempts in the removed item ----------
  let removedAttempts = 0;
  const removedAttemptsSnapshot: Row[] = [];
  if (resetAttempts) {
    try {
      const testQuery = isSeries
        ? admin.from('mock_tests').select('id').eq('series_id', itemId)
        : admin.from('mock_tests').select('id').eq('course_id', itemId);
      const { data: itemTests } = await testQuery;
      const testIds = (itemTests ?? []).map((t: Row) => t.id);
      if (testIds.length > 0) {
        const attemptTable = isSeries ? 'mock_attempts' : 'test_attempts';
        const { data: attempts } = await admin
          .from(attemptTable)
          .select('id, test_id, score')
          .eq('student_id', studentId)
          .in('test_id', testIds);
        if (attempts && attempts.length > 0) {
          const { error: attDelErr } = await admin
            .from(attemptTable)
            .delete()
            .eq('student_id', studentId)
            .in('test_id', testIds);
          if (attDelErr) {
            warnings.push('Enrollment removed, but the test attempts could not be cleared.');
          } else {
            removedAttempts = attempts.length;
            removedAttemptsSnapshot.push(...attempts);
          }
        }
      }
    } catch {
      warnings.push('Enrollment removed, but the test attempts could not be cleared.');
    }
  }

  // ---------- 7. Immutable audit log ----------
  try {
    await admin.from('payment_audit_log').insert({
      action: 'ENROLLMENT_REMOVED',
      entity_type: isSeries ? 'series_enrollment' : 'course_enrollment',
      entity_id: String(sourceRows?.[0]?.id ?? itemId),
      actor_id: adminId,
      actor_role: 'admin',
      old_values: {
        student_id: studentId,
        student_name: student.name,
        kind,
        item_id: itemId,
        item_name: itemName,
        previous_enrollments: sourceRows ?? [],
      },
      new_values: {
        reason,
        revoked_payment_ids: updatedPayments.map((m) => m.id),
        revoked_request_ids: updatedRequests.map((r) => r.id),
        removed_attempts: removedAttemptsSnapshot,
      },
      ip_address: ip,
    });
  } catch {
    warnings.push('Access was removed, but the audit log entry could not be written.');
  }

  return NextResponse.json({
    success: true,
    message: `Removed ${student.name} from "${itemName}".`,
    revokedPayments: updatedPayments.length,
    removedAttempts,
    warnings,
  });
}

