import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { createAdminSupabase, requireAdmin } from '@/lib/supabase/server';

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Admin creates a student account. Returns a one-time temporary password. */
export async function POST(request: Request) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const email = str(body?.email, 200).toLowerCase();
  const name = str(body?.name, 120);
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid name and email are required.' }, { status: 400 });
  }

  const tempPassword = randomBytes(9).toString('base64url');
  const admin = createAdminSupabase();
  const { error } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      name,
      phone: str(body?.phone, 20),
      guardian_name: str(body?.guardianName, 120),
      address: str(body?.address, 300),
      permanent_address: str(body?.permanentAddress || body?.address, 300),
      qualification: str(body?.qualification, 120),
      target_exam: str(body?.targetExam, 120),
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
