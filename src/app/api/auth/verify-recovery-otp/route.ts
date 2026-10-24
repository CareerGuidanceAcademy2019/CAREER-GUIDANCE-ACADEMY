import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAdminSupabase } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';
import { evaluatePasswordStrength } from '@/lib/passwordPolicy';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `recovery_otp_${ip}`,
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

    const { email, otp, newPassword } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid registered email address.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = String(otp || '').replace(/\D/g, '').trim();

    if (!cleanOtp || cleanOtp.length < 6) {
      return NextResponse.json(
        { error: 'Please enter the 6-digit OTP code sent to your email.' },
        { status: 400 }
      );
    }

    if (newPassword) {
      if (typeof newPassword !== 'string' || newPassword.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters long.' },
          { status: 400 }
        );
      }

      const strength = evaluatePasswordStrength(newPassword);
      if (!strength.isValid && newPassword.length < 10) {
        return NextResponse.json(
          { error: strength.feedback[0] || 'Please create a stronger password.' },
          { status: 400 }
        );
      }
    }

    // Verify OTP using Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://craicxwqaygdydtdaxtw.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseAnonKey) {
      return NextResponse.json({ error: 'Server authentication configuration missing.' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanOtp,
      type: 'recovery',
    });

    if (verifyError || !verifyData?.user) {
      const msg = verifyError?.message || '';
      return NextResponse.json(
        {
          error:
            /expired/i.test(msg) || /invalid/i.test(msg)
              ? 'Invalid or expired OTP code. Please request a new recovery code.'
              : msg || 'Could not verify the OTP code. Please check and try again.',
        },
        { status: 400 }
      );
    }

    const verifiedUserId = verifyData.user.id;

    // Update password if newPassword provided
    if (newPassword) {
      const admin = createAdminSupabase();
      const { error: updateErr } = await admin.auth.admin.updateUserById(verifiedUserId, {
        password: newPassword,
      });

      if (updateErr) {
        return NextResponse.json(
          { error: updateErr.message || 'Could not update password in database.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Password successfully updated! You can now sign in with your new password.',
      userId: verifiedUserId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'An unexpected error occurred verifying OTP.' },
      { status: 500 }
    );
  }
}
