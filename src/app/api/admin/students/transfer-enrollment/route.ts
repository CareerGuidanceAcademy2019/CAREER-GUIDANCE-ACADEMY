import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminSupabase, requireAdmin } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

/**
 * Admin-only: move a student's enrollment from one course / mock series to another
 * (e.g. the student paid for "Social Science" by mistake but wanted "Science").
 *
 * A transfer MOVES the enrollment: the student loses access to the old item and gains
 * access to the new one. Verified payments are re-pointed to the new item so that the
 * old item can not be re-unlocked through the payment fallbacks used by the access gate.
 *
 * The Supabase JS client has no multi-statement transactions, so the steps are ordered
 * so that a failure never leaves the student without access, and every step that
 * has been applied is rolled back if a later step fails.
 */

const transferSchema = z
  .object({
    studentId: z.string().trim().min(1).max(100),
    kind: z.enum(['course', 'mock_series']),
    fromId: z.string().trim().min(1).max(200),
    toId: z.string().trim().min(1).max(200),
    reason: z.string().trim().min(5, 'Please give a reason (at least 5 characters).').max(500),
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
    `admin_transfer_enr_${adminId}_${ip}`,
    RATE_LIMIT_RULES.ADMIN_ACTION.limit,
    RATE_LIMIT_RULES.ADMIN_ACTION.windowSeconds
  );
  if (!rateRes.allowed) return createRateLimitResponse(rateRes);

  const raw = await request.json().catch(() => null);
  const parsed = transferSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message || 'Invalid request.';
    return fail(first);
  }
  const { studentId, kind, fromId, toId, reason, resetAttempts } = parsed.data;
  if (fromId === toId) return fail('Please choose a different item to transfer to.');

  const admin = createAdminSupabase();
  const isSeries = kind === 'mock_series';
  const enrTable = isSeries ? 'series_enrollments' : 'enrollments';
  const itemCol = isSeries ? 'series_id' : 'course_id';
  const itemTable = isSeries ? 'mock_series' : 'courses';

  // ---------- 1. Validate student and both items ----------
  const { data: student } = await admin
    .from('profiles')
    .select('id, name, role, email')
    .eq('id', studentId)
    .maybeSingle();
  if (!student) return fail('Student not found.', 404);

  const [{ data: fromItem }, { data: toItem }] = await Promise.all([
    admin.from(itemTable).select('*').eq('id', fromId).maybeSingle(),
    admin.from(itemTable).select('*').eq('id', toId).maybeSingle(),
  ]);
  if (!toItem) return fail('The selected target does not exist.', 404);
  if (isSeries && toItem.status === 'Archived') {
    return fail('The selected mock test series is archived and cannot accept enrollments.');
  }

  // ---------- 2. Source / target enrollment state ----------
  const { data: sourceRow, error: srcErr } = await admin
    .from(enrTable)
    .select('*')
    .eq('student_id', studentId)
    .eq(itemCol, fromId)
    .maybeSingle();
  if (srcErr) return fail('Could not read the current enrollment. Please try again.', 500);

  const { data: targetRow, error: tgtErr } = await admin
    .from(enrTable)
    .select('id')
    .eq('student_id', studentId)
    .eq(itemCol, toId)
    .maybeSingle();
  if (tgtErr) return fail('Could not read the target enrollment. Please try again.', 500);
  if (targetRow) {
    return fail('This student is already enrolled in the selected target. Choose another one.', 409);
  }

  // Verified payments for the old item (the student may only be enrolled through them)
  const { data: itemPayments, error: payErr } = await admin
    .from('fee_payments')
    .select('id, status, item_id, course_id, item_type, amount, payment_request_id')
    .eq('student_id', studentId);
  if (payErr) return fail('Could not read the student payments. Please try again.', 500);

  const payKey = (p: Row) => String(p.item_id || p.course_id || '');
  const oldPayments = (itemPayments ?? []).filter((p: Row) => payKey(p) === fromId);
  const pendingPayments = oldPayments.filter((p: Row) => p.status === 'Pending');
  const verifiedPayments = oldPayments.filter((p: Row) => p.status === 'Verified');

  const { data: oldRequests, error: reqErr } = await admin
    .from('payment_requests')
    .select('id, status, item_id')
    .eq('student_id', studentId)
    .eq('item_id', fromId);
  if (reqErr) return fail('Could not read the student payment requests. Please try again.', 500);
  const openRequests = (oldRequests ?? []).filter((r: Row) =>
    ['awaiting_payment', 'pending_review'].includes(r.status)
  );
  const approvedRequests = (oldRequests ?? []).filter((r: Row) => r.status === 'approved');

  if (!sourceRow && verifiedPayments.length === 0) {
    return fail('The student is not enrolled in the item you are trying to transfer from.', 404);
  }
  if (pendingPayments.length > 0 || openRequests.length > 0) {
    return fail(
      'This student has a pending payment / payment request for the current item. ' +
        'Approve or reject it in Payments first, then transfer the enrollment.',
      409
    );
  }

  // ---------- 3. Create the new enrollment ----------
  const nowIso = new Date().toISOString();
  const sixMonthsIso = new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString();
  const verifiedTotal = verifiedPayments.reduce((s: number, p: Row) => s + Number(p.amount || 0), 0);

  let newRowInsert: Row;
  if (isSeries) {
    newRowInsert = {
      student_id: studentId,
      series_id: toId,
      payment_id: sourceRow?.payment_id ?? verifiedPayments[0]?.id ?? null,
      enrolled_at: sourceRow?.enrolled_at ?? nowIso,
      access_valid_until: sourceRow?.access_valid_until ?? sixMonthsIso,
    };
  } else {
    const paid = Number(sourceRow?.paid_amount ?? verifiedTotal ?? 0);
    const totalFee = Number(toItem.price ?? 0);
    newRowInsert = {
      student_id: studentId,
      course_id: toId,
      enrolled_date: sourceRow?.enrolled_date ?? nowIso.slice(0, 10),
      progress: 0,
      total_fee: totalFee,
      paid_amount: paid,
      due_amount: Math.max(0, totalFee - paid),
      next_due_date: sourceRow?.next_due_date ?? null,
      access_valid_until: sourceRow?.access_valid_until ?? sixMonthsIso,
    };
  }

  const { data: newRow, error: insErr } = await admin.from(enrTable).insert(newRowInsert).select('*').single();
  if (insErr || !newRow) {
    return fail(insErr?.message || 'Could not create the new enrollment.', 500);
  }

  const rollbackNewRow = async () => {
    await admin.from(enrTable).delete().eq('id', newRow.id);
  };

  // ---------- 4. Re-point verified payments / approved requests ----------
  const movedPayments: { id: string; before: Row }[] = [];
  const movedRequests: string[] = [];
  const rollbackPayments = async () => {
    for (const m of movedPayments) {
      await admin.from('fee_payments').update(m.before).eq('id', m.id);
    }
    for (const id of movedRequests) {
      await admin.from('payment_requests').update({ item_id: fromId }).eq('id', id);
    }
  };

  for (const p of verifiedPayments) {
    const patch: Row = { item_id: toId };
    const before: Row = { item_id: p.item_id ?? null };
    if (p.course_id === fromId) {
      patch.course_id = isSeries ? null : toId;
      before.course_id = p.course_id;
    }
    const { error } = await admin.from('fee_payments').update(patch).eq('id', p.id);
    if (error) {
      await rollbackPayments();
      await rollbackNewRow();
      return fail(error.message || 'Could not move the payment records.', 500);
    }
    movedPayments.push({ id: p.id, before });
  }

  for (const r of approvedRequests) {
    const { error } = await admin.from('payment_requests').update({ item_id: toId }).eq('id', r.id);
    if (error) {
      await rollbackPayments();
      await rollbackNewRow();
      return fail(error.message || 'Could not move the payment request records.', 500);
    }
    movedRequests.push(r.id);
  }

  // ---------- 5. Remove the old enrollment (this is what revokes the old access) ----------
  if (sourceRow) {
    const { error: delErr } = await admin.from(enrTable).delete().eq('id', sourceRow.id);
    if (delErr) {
      await rollbackPayments();
      await rollbackNewRow();
      return fail(delErr.message || 'Could not remove the old enrollment.', 500);
    }
  }

  // From here on the transfer is committed; remaining steps are best-effort and reported.
  const warnings: string[] = [];

  // ---------- 6. Course seat bookkeeping (only if a real course enrollment moved) ----------
  if (!isSeries && sourceRow) {
    try {
      if (fromItem && Number(fromItem.batch_size ?? 0) > 0) {
        await admin
          .from('courses')
          .update({
            seats_available: Math.min(Number(fromItem.batch_size), Number(fromItem.seats_available ?? 0) + 1),
          })
          .eq('id', fromId);
      }
      const nextSeats = Math.max(0, Number(toItem.seats_available ?? 0) - 1);
      await admin
        .from('courses')
        .update({
          seats_available: nextSeats,
          ...(nextSeats <= 0 ? { status: 'Batch Closed' } : {}),
        })
        .eq('id', toId);
    } catch {
      warnings.push('Course seat counts could not be updated automatically.');
    }
  }

  // ---------- 7. Optionally reset the student's attempts in the OLD item ----------
  let removedAttempts = 0;
  const removedAttemptsSnapshot: Row[] = [];
  if (resetAttempts) {
    try {
      const testQuery = isSeries
        ? admin.from('mock_tests').select('id').eq('series_id', fromId)
        : admin.from('mock_tests').select('id').eq('course_id', fromId);
      const { data: oldTests } = await testQuery;
      const testIds = (oldTests ?? []).map((t: Row) => t.id);
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
            warnings.push('Enrollment moved, but the old test attempts could not be cleared.');
          } else {
            removedAttempts = attempts.length;
            removedAttemptsSnapshot.push(...attempts);
          }
        }
      }
    } catch {
      warnings.push('Enrollment moved, but the old test attempts could not be cleared.');
    }
  }

  // ---------- 8. Audit trail ----------
  try {
    await admin.from('payment_audit_log').insert({
      action: 'ENROLLMENT_TRANSFERRED',
      entity_type: isSeries ? 'series_enrollment' : 'course_enrollment',
      entity_id: String(newRow.id),
      actor_id: adminId,
      actor_role: 'admin',
      old_values: {
        student_id: studentId,
        student_name: student.name,
        kind,
        from_id: fromId,
        from_name: fromItem?.name ?? null,
        previous_enrollment: sourceRow ?? null,
      },
      new_values: {
        to_id: toId,
        to_name: toItem.name ?? null,
        reason,
        moved_payment_ids: movedPayments.map((m) => m.id),
        moved_request_ids: movedRequests,
        removed_attempts: removedAttemptsSnapshot,
      },
      ip_address: ip,
    });
  } catch {
    warnings.push('The transfer was applied but the audit log entry could not be written.');
  }

  return NextResponse.json({
    success: true,
    message: `Enrollment moved from "${fromItem?.name ?? fromId}" to "${toItem.name ?? toId}".`,
    movedPayments: movedPayments.length,
    removedAttempts,
    warnings,
  });
}

