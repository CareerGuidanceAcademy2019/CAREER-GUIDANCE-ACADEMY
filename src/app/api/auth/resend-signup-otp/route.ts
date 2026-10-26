import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `resend_signup_otp_${ip}`,
    RATE_LIMIT_RULES.FORGOT_PW_IP.limit,
    RATE_LIMIT_RULES.FORGOT_PW_IP.windowSeconds
  );
  if (!rateRes.allowed) {
    return createRateLimitResponse(rateRes);
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.email || typeof body.email !== 'string') {
      return NextResponse.json({ error: 'Please enter a valid registered email address.' }, { status: 400 });
    }

    const cleanEmail = body.email.trim().toLowerCase();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://craicxwqaygdydtdaxtw.supabase.co';
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      'sb_publishable_jXl_a3vn0Q7rEa6ADqzuzg_iBxBEX5c';

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
    });

    if (error) {
      const msg = error.message || '';
      if (/rate limit/i.test(msg)) {
        return NextResponse.json(
          { error: 'Email rate limit reached. Please wait a minute before requesting a new code.' },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: msg || 'Could not resend confirmation email. Please verify the email address.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'New confirmation code sent to your email. Please check your inbox and spam folder.',
    });
  } catch {
    return NextResponse.json({ error: 'Network error resending confirmation code. Please try again.' }, { status: 500 });
  }
}
