import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAdminSupabase } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `signup_otp_${ip}`,
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

    const { email, otp } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid registered email address.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = String(otp || '').replace(/\D/g, '').trim();

    if (!cleanOtp || cleanOtp.length < 6) {
      return NextResponse.json(
        { error: 'Please enter the 6-digit confirmation OTP code sent to your email.' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://craicxwqaygdydtdaxtw.supabase.co';
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      'sb_publishable_jXl_a3vn0Q7rEa6ADqzuzg_iBxBEX5c';

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Try type 'signup' first, and fallback to 'email'
    let { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanOtp,
      type: 'signup',
    });

    if (verifyError) {
      const fallback = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanOtp,
        type: 'email',
      });
      if (!fallback.error) {
        verifyData = fallback.data;
        verifyError = null;
      }
    }

    if (verifyError || !verifyData?.user) {
      // Check if user already confirmed via email link
      try {
        const admin = createAdminSupabase();
        const { data: userData } = await admin.auth.admin.listUsers();
        const foundUser = userData?.users?.find(
          (u) => u.email?.toLowerCase() === cleanEmail
        );
        if (foundUser && foundUser.email_confirmed_at) {
          await admin
            .from('profiles')
            .update({ status: 'Active' })
            .eq('id', foundUser.id);
          return NextResponse.json({
            success: true,
            message: 'Email is already confirmed! You can now log in.',
            userId: foundUser.id,
          });
        }
      } catch {}

      const msg = verifyError?.message || '';
      return NextResponse.json(
        {
          error:
            /expired/i.test(msg) || /invalid/i.test(msg)
              ? 'Invalid or expired confirmation OTP code. Please check your email or click resend.'
              : msg || 'Could not verify confirmation code.',
        },
        { status: 400 }
      );
    }

    // Ensure profile status is Active and user is confirmed
    try {
      const admin = createAdminSupabase();
      await admin
        .from('profiles')
        .update({ status: 'Active' })
        .eq('id', verifyData.user.id);
      await admin.auth.admin.updateUserById(verifyData.user.id, {
        email_confirm: true,
      });
    } catch (e) {
      console.warn('[verify-signup-otp] Profile activation notice:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Email confirmed successfully! You can now log in using your email or phone number.',
      userId: verifyData.user.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'An unexpected error occurred verifying confirmation code.' },
      { status: 500 }
    );
  }
}
