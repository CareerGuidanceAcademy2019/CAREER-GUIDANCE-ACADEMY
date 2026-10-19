import { NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in to appear for tests.' }, { status: 401 });
    }

    const ip = getClientIp(request);
    const rateRes = await checkRateLimit(
      `start_test_${user.id}_${ip}`,
      RATE_LIMIT_RULES.MOCK_START.limit,
      RATE_LIMIT_RULES.MOCK_START.windowSeconds
    );
    if (!rateRes.allowed) {
      return createRateLimitResponse(rateRes);
    }

    const body = await request.json();
    const { testId } = body;

    if (!testId) {
      return NextResponse.json({ error: 'Missing testId parameter.' }, { status: 400 });
    }

    // Call the database RPC get_test_questions
    const { data, error } = await supabase.rpc('get_test_questions', {
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
    const message = err instanceof Error ? err.message : 'Failed to start test';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
