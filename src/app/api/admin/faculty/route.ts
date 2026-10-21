import { NextResponse } from 'next/server';
import { createAdminSupabase, requireAdmin } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

export async function DELETE(request: Request) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `admin_fac_${adminId}_${ip}`,
    RATE_LIMIT_RULES.ADMIN_ACTION.limit,
    RATE_LIMIT_RULES.ADMIN_ACTION.windowSeconds
  );
  if (!rateRes.allowed) return createRateLimitResponse(rateRes);

  const id = new URL(request.url).searchParams.get('id') ?? '';
  if (!id) return NextResponse.json({ error: 'Faculty ID is required' }, { status: 400 });

  const admin = createAdminSupabase();

  // Find faculty member
  const { data: fac } = await admin
    .from('faculty')
    .select('id, name, profile_id')
    .eq('id', id)
    .maybeSingle();

  if (!fac) {
    return NextResponse.json({ error: 'Faculty record not found' }, { status: 404 });
  }

  // Set any linked courses' faculty_id to null
  await admin.from('courses').update({ faculty_id: null }).eq('faculty_id', id);

  // Delete from faculty table
  const { error: delErr } = await admin.from('faculty').delete().eq('id', id);
  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 400 });
  }

  // If a profile_id was linked, clean up profile and auth user (unless superadmin)
  if (fac.profile_id) {
    const { data: prof } = await admin
      .from('profiles')
      .select('id, role, email, phone')
      .eq('id', fac.profile_id)
      .maybeSingle();

    if (prof && prof.role !== 'admin') {
      if (prof.email) await admin.from('access_allowlist').delete().eq('identifier', prof.email);
      if (prof.phone) await admin.from('access_allowlist').delete().eq('identifier', prof.phone);
      await admin.from('profiles').delete().eq('id', fac.profile_id);
      await admin.auth.admin.deleteUser(fac.profile_id).catch(() => null);
    }
  }

  return NextResponse.json({
    ok: true,
    message: `Faculty "${fac.name}" and associated records permanently deleted from database.`,
  });
}
