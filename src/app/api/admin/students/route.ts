import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { createAdminSupabase, requireAdmin } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

import { z } from 'zod';

const createStudentSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().toLowerCase().email('Invalid email address').max(200),
  phone: z.string().trim().max(20).optional().default(''),
  guardianName: z.string().trim().max(120).optional().default(''),
  address: z.string().trim().max(300).optional().default(''),
  permanentAddress: z.string().trim().max(300).optional(),
  qualification: z.string().trim().max(120).optional().default(''),
  targetExam: z.string().trim().max(120).optional().default(''),
}).strict();

/** Admin creates a student account. Returns a one-time temporary password. */
export async function POST(request: Request) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `admin_stu_${adminId}_${ip}`,
    RATE_LIMIT_RULES.ADMIN_ACTION.limit,
    RATE_LIMIT_RULES.ADMIN_ACTION.windowSeconds
  );
  if (!rateRes.allowed) {
    return createRateLimitResponse(rateRes);
  }

  const raw = await request.json().catch(() => null);
  const parseResult = createStudentSchema.safeParse(raw);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parseResult.error.format() },
      { status: 400 }
    );
  }

  const data = parseResult.data;
  const tempPassword = randomBytes(9).toString('base64url');
  const admin = createAdminSupabase();
  const { error } = await admin.auth.admin.createUser({
    email: data.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      name: data.name,
      phone: data.phone,
      guardian_name: data.guardianName,
      address: data.address,
      permanent_address: data.permanentAddress || data.address,
      qualification: data.qualification,
      target_exam: data.targetExam,
    },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ tempPassword });
}

/** Admin permanently removes any candidate with all associated information from the database. */
export async function DELETE(request: Request) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const id = new URL(request.url).searchParams.get('id') ?? '';
  if (!id) return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 });
  if (id === adminId) return NextResponse.json({ error: 'You cannot delete your own admin account.' }, { status: 400 });

  const admin = createAdminSupabase();
  const { data: target } = await admin.from('profiles').select('id, role, email').eq('id', id).maybeSingle();
  if (target?.role === 'admin') {
    return NextResponse.json({ error: 'Administrator accounts cannot be removed from this interface.' }, { status: 400 });
  }

  // Purge all associated information across tables (including T-TET mock test attempts & series enrollments)
  await admin.from('mock_attempts').delete().eq('student_id', id);
  await admin.from('series_enrollments').delete().eq('student_id', id);
  await admin.from('test_attempts').delete().eq('student_id', id);
  await admin.from('fee_payments').delete().eq('student_id', id);
  await admin.from('enrollments').delete().eq('student_id', id);
  await admin.from('waiting_list').delete().eq('student_id', id);
  await admin.from('profiles').delete().eq('id', id);

  // If a corresponding auth account exists, remove it so credentials/session are wiped completely
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) {
    await admin.auth.admin.deleteUser(id).catch(() => null);
  }

  return NextResponse.json({ ok: true, message: 'Candidate and all associated data permanently removed.' });
}
