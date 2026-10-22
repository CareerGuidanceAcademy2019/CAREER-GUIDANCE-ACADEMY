import { NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';
import { evaluatePasswordStrength } from '@/lib/passwordPolicy';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `pwd_reset_${ip}`,
    RATE_LIMIT_RULES.FORGOT_PW_IP.limit,
    RATE_LIMIT_RULES.FORGOT_PW_IP.windowSeconds
  );
  if (!rateRes.allowed) {
    return createRateLimitResponse(rateRes);
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const { email, phoneOrCode, newPassword } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid registered email address.' }, { status: 400 });
    }

    if (!phoneOrCode || typeof phoneOrCode !== 'string' || phoneOrCode.trim().length < 3) {
      return NextResponse.json(
        { error: 'Please enter your registered 10-digit mobile number or Student ID code for security verification.' },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json({ error: 'Please enter a new password.' }, { status: 400 });
    }

    const strength = evaluatePasswordStrength(newPassword);
    if (!strength.isValid && newPassword.length < 8) {
      return NextResponse.json(
        { error: strength.feedback[0] || 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const admin = createAdminSupabase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanVerification = phoneOrCode.trim().toLowerCase();
    const digitsOnly = cleanVerification.replace(/\D/g, '');

    // Look up profile by email
    const { data: profile, error: profileErr } = await admin
      .from('profiles')
      .select('id, email, phone, student_code, status, role')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (profileErr || !profile) {
      return NextResponse.json(
        { error: 'No account matching this email was found. Please check your spelling or contact admissions.' },
        { status: 404 }
      );
    }

    // Security check: verification against phone or student_code
    const profilePhoneDigits = (profile.phone || '').replace(/\D/g, '');
    const profileCode = (profile.student_code || '').trim().toLowerCase();

    const phoneMatches =
      digitsOnly.length >= 6 &&
      (profilePhoneDigits.endsWith(digitsOnly) || digitsOnly.endsWith(profilePhoneDigits));

    const codeMatches =
      cleanVerification.length >= 3 &&
      (profileCode === cleanVerification || cleanVerification.includes(profileCode) || profileCode.includes(cleanVerification));

    if (!phoneMatches && !codeMatches) {
      return NextResponse.json(
        {
          error:
            'Security verification failed. The phone number or student ID code does not match the records for this email address.',
        },
        { status: 403 }
      );
    }

    // Update password via admin auth
    const { error: updateErr } = await admin.auth.admin.updateUserById(profile.id, {
      password: newPassword,
    });

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message || 'Could not update password.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Your password has been successfully updated. You can now sign in with your new password.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
