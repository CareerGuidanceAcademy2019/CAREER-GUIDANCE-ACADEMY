import { NextResponse } from 'next/server';
import { requireActiveSession } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

export async function GET(request: Request) {
  try {
    const active = await requireActiveSession();
    if (!active) {
      return NextResponse.json({ error: 'Unauthorized or session revoked on another device.' }, { status: 401 });
    }
    const { user, supabase } = active;

    const ip = getClientIp(request);
    const rateRes = await checkRateLimit(
      `solutions_${user.id}_${ip}`,
      RATE_LIMIT_RULES.GENERAL_API.limit,
      RATE_LIMIT_RULES.GENERAL_API.windowSeconds
    );
    if (!rateRes.allowed) {
      return createRateLimitResponse(rateRes);
    }

    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');

    if (!testId) {
      return NextResponse.json({ error: 'Missing testId parameter.' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('get_test_solutions', {
      p_test_id: testId,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch solutions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
