import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminSupabase, requireAdmin } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

/**
 * Admin-only: Directly enroll an existing registered student into a specific
 * Course (Batch) or Mock Test Series.
 *
 * Used by administrators in the Batch & Series Enrollments management panel
 * to grant access, add a transferred student, or counter-enroll a student.
 */

const enrollSchema = z
  .object({
    studentId: z.string().trim().min(1).max(100),
    kind: z.enum(['course', 'mock_series']),
    itemId: z.string().trim().min(1).max(200),
    accessValidMonths: z.number().int().min(1).max(36).optional().default(6),
    reason: z.string().trim().max(500).optional().default('Admin manual grant / batch enrollment'),
  })
  .strict();

function fail(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

export async function POST(request: Request) {
  const adminId = await requireAdmin(request);
  if (!adminId) return fail('Unauthorized: Administrator privileges required.', 403);

  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `admin_enroll_${adminId}_${ip}`,
    RATE_LIMIT_RULES.ADMIN_ACTION.limit,
    RATE_LIMIT_RULES.ADMIN_ACTION.windowSeconds
  );
  if (!rateRes.allowed) return createRateLimitResponse(rateRes);

  const raw = await request.json().catch(() => null);
  const parsed = enrollSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message || 'Invalid request body.';
    return fail(first);
  }

  const { studentId, kind, itemId, accessValidMonths, reason } = parsed.data;

  const admin = createAdminSupabase();
  const isSeries = kind === 'mock_series';
  const enrTable = isSeries ? 'series_enrollments' : 'enrollments';
  const itemCol = isSeries ? 'series_id' : 'course_id';
  const itemTable = isSeries ? 'mock_series' : 'courses';

  // 1. Verify student exists
  const { data: student, error: stuErr } = await admin
    .from('profiles')
    .select('id, name, email, phone, student_code, status, role')
    .eq('id', studentId)
    .maybeSingle();

  if (stuErr || !student) {
    return fail('Student profile not found in database.', 404);
  }

  // 2. Verify target item exists
  const { data: item, error: itemErr } = await admin
    .from(itemTable)
    .select('*')
    .eq('id', itemId)
    .maybeSingle();

  if (itemErr || !item) {
    return fail(`Selected ${isSeries ? 'mock series' : 'course'} not found.`, 404);
  }

  if (isSeries && item.status === 'Archived') {
    return fail('This mock test series is archived and cannot accept new enrollments.');
  }

  // 3. Check if already enrolled in this item
  const { data: existingEnr, error: checkErr } = await admin
    .from(enrTable)
    .select('id')
    .eq('student_id', studentId)
    .eq(itemCol, itemId)
    .maybeSingle();

  if (checkErr) {
    return fail('Could not verify existing enrollment status.', 500);
  }
  if (existingEnr) {
    return fail(`Student is already enrolled in "${item.name}".`, 409);
  }

  // 4. Calculate validity timestamp
  const nowIso = new Date().toISOString();
  const validUntilDate = new Date();
  validUntilDate.setMonth(validUntilDate.getMonth() + accessValidMonths);
  const validUntilIso = validUntilDate.toISOString();

  // 5. Insert enrollment
  let insertedId: string | null = null;
  if (isSeries) {
    const { data: newRow, error: insErr } = await admin
      .from('series_enrollments')
      .insert({
        student_id: studentId,
        series_id: itemId,
        payment_id: null,
        enrolled_at: nowIso,
        access_valid_until: validUntilIso,
      })
      .select('id')
      .single();

    if (insErr || !newRow) {
      return fail(insErr?.message || 'Failed to create mock series enrollment.', 500);
    }
    insertedId = String(newRow.id);
  } else {
    const totalFee = Number(item.price ?? 0);
    const { data: newRow, error: insErr } = await admin
      .from('enrollments')
      .insert({
        student_id: studentId,
        course_id: itemId,
        enrolled_date: nowIso.slice(0, 10),
        progress: 0,
        total_fee: totalFee,
        paid_amount: totalFee,
        due_amount: 0,
        next_due_date: null,
        access_valid_until: validUntilIso,
      })
      .select('id')
      .single();

    if (insErr || !newRow) {
      return fail(insErr?.message || 'Failed to create course enrollment.', 500);
    }
    insertedId = String(newRow.id);

    // Bookkeeping: decrement available seats if course has limit
    try {
      if (typeof item.seats_available === 'number' && item.seats_available > 0) {
        const nextSeats = Math.max(0, item.seats_available - 1);
        await admin
          .from('courses')
          .update({
            seats_available: nextSeats,
            ...(nextSeats <= 0 ? { status: 'Batch Closed' } : {}),
          })
          .eq('id', itemId);
      }
    } catch {}
  }

  // 6. Audit log entry
  try {
    await admin.from('payment_audit_log').insert({
      action: 'ENROLLMENT_GRANTED',
      entity_type: isSeries ? 'series_enrollment' : 'course_enrollment',
      entity_id: insertedId || itemId,
      actor_id: adminId,
      actor_role: 'admin',
      old_values: null,
      new_values: {
        student_id: studentId,
        student_name: student.name,
        student_code: student.student_code,
        kind,
        item_id: itemId,
        item_name: item.name,
        access_valid_until: validUntilIso,
        valid_months: accessValidMonths,
        reason,
      },
      ip_address: ip,
    });
  } catch {}

  return NextResponse.json({
    success: true,
    message: `Enrolled ${student.name} in "${item.name}". Access is active till ${validUntilDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.`,
    enrollmentId: insertedId,
  });
}

