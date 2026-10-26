import { NextResponse } from 'next/server';
import { createAdminSupabase, requireAdmin } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `admin_setpw_${adminId}_${ip}`,
    RATE_LIMIT_RULES.ADMIN_ACTION.limit,
    RATE_LIMIT_RULES.ADMIN_ACTION.windowSeconds
  );
  if (!rateRes.allowed) return createRateLimitResponse(rateRes);

  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.studentId || !body.password) {
      return NextResponse.json({ error: 'Student ID and password are required.' }, { status: 400 });
    }

    const { studentId, password } = body;
    const cleanPw = String(password).trim();
    if (cleanPw.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const admin = createAdminSupabase();

    // 1. Update Auth user password
    const { error: authErr } = await admin.auth.admin.updateUserById(studentId, {
      password: cleanPw,
      user_metadata: {
        login_password: cleanPw,
      },
    });

    if (authErr) {
      console.warn('[set-password] Auth user update error:', authErr);
      // Fallback: Check if user exists in auth or only in profiles
    }

    // 2. Update profiles table login_password column
    const { error: profErr } = await admin
      .from('profiles')
      .update({ login_password: cleanPw })
      .eq('id', studentId);

    if (profErr) {
      return NextResponse.json({ error: profErr.message || 'Could not update student password.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Student login password updated successfully.',
      password: cleanPw,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error setting student password.' }, { status: 500 });
  }
}
