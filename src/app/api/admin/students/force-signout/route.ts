import { NextResponse } from 'next/server';
import { requireAdmin, createAdminSupabase } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `admin_forcesignout_${ip}`,
    RATE_LIMIT_RULES.ADMIN_ACTION.limit,
    RATE_LIMIT_RULES.ADMIN_ACTION.windowSeconds
  );
  if (!rateRes.allowed) {
    return createRateLimitResponse(rateRes);
  }

  // 1. Strictly verify admin privileges on every call
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json(
      { error: 'Unauthorized: Administrator privileges required.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    const targetUserId = body?.studentId || body?.userId;

    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json({ error: 'Target user ID is required.' }, { status: 400 });
    }

    const adminClient = createAdminSupabase();

    // 2. Terminate all active sessions for the target user via Supabase Auth Admin API
    const { error: signOutErr } = await adminClient.auth.admin.signOut(targetUserId, 'global');
    if (signOutErr) {
      console.error('[Force Signout] Error terminating user sessions:', signOutErr);
      return NextResponse.json(
        { error: signOutErr.message || 'Failed to sign out user sessions.' },
        { status: 500 }
      );
    }

    // 3. Audit log the administrative force sign out
    await adminClient.from('security_audit_log').insert({
      event: 'ADMIN_FORCE_SIGNOUT',
      user_id: adminId,
      details: {
        target_user_id: targetUserId,
        caller_admin_id: adminId,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'All active sessions for this student have been terminated successfully.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Unexpected error processing force sign out.' },
      { status: 500 }
    );
  }
}
