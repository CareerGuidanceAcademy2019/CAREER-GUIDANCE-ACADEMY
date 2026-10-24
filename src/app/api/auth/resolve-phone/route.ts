import { NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';
import { normalizePhone } from '@/lib/names';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `phone_lookup_${ip}`,
    RATE_LIMIT_RULES.LOGIN_IP.limit * 2,
    RATE_LIMIT_RULES.LOGIN_IP.windowSeconds
  );
  if (!rateRes.allowed) {
    return createRateLimitResponse(rateRes);
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.phone) {
      return NextResponse.json({ error: 'Mobile number is required.' }, { status: 400 });
    }

    const cleanPhone = normalizePhone(String(body.phone));
    if (!cleanPhone || cleanPhone.length < 10) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit registered mobile number.' },
        { status: 400 }
      );
    }

    const admin = createAdminSupabase();

    // Query profiles for matching phone
    const { data: profile, error } = await admin
      .from('profiles')
      .select('id, email, phone, role, status')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (error || !profile?.email) {
      // Fallback: check if phone ends with 10 digits
      const { data: fallbackProfiles } = await admin
        .from('profiles')
        .select('id, email, phone, role, status')
        .ilike('phone', `%${cleanPhone}%`)
        .limit(2);

      if (fallbackProfiles && fallbackProfiles.length === 1 && fallbackProfiles[0].email) {
        return NextResponse.json({
          success: true,
          email: fallbackProfiles[0].email,
        });
      }

      return NextResponse.json(
        {
          error:
            'No registered account found with this mobile number. Please check the number or sign in with your email address.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      email: profile.email,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to resolve phone number.' },
      { status: 500 }
    );
  }
}
