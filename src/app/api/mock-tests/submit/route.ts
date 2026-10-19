import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const ip = getClientIp(request);
    const rateRes = await checkRateLimit(
      `submit_test_${user.id}_${ip}`,
      RATE_LIMIT_RULES.MOCK_SUBMIT.limit,
      RATE_LIMIT_RULES.MOCK_SUBMIT.windowSeconds
    );
    if (!rateRes.allowed) {
      return createRateLimitResponse(rateRes);
    }

    const body = await request.json();
    const { testId, answers = {}, timeTakenSeconds = 0 } = body;

    if (!testId) {
      return NextResponse.json({ error: 'Missing testId parameter.' }, { status: 400 });
    }

    // Call submit_mock_attempt RPC
    const { data, error } = await supabase.rpc('submit_mock_attempt', {
      p_test_id: testId,
      p_answers: answers,
      p_time_taken_seconds: timeTakenSeconds,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to submit test';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
