import { NextResponse } from 'next/server';
import { createAdminSupabase, requireActiveSession } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const active = await requireActiveSession(request);
    if (!active) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const { user } = active;

    const ip = getClientIp(request);
    const rateRes = await checkRateLimit(
      `save_progress_${user.id}_${ip}`,
      RATE_LIMIT_RULES.MOCK_SAVE_ANSWER.limit,
      RATE_LIMIT_RULES.MOCK_SAVE_ANSWER.windowSeconds
    );
    if (!rateRes.allowed) {
      return createRateLimitResponse(rateRes);
    }

    const body = await request.json().catch(() => ({}));
    const { testId, answers } = body;

    if (!testId || !answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'Missing testId or answers payload.' }, { status: 400 });
    }

    const admin = createAdminSupabase();

    // Find active in-progress attempt for this student and test
    const { data: inProgress } = await admin
      .from('mock_attempts')
      .select('id, answers')
      .eq('test_id', testId)
      .eq('student_id', user.id)
      .is('submitted_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (inProgress) {
      const mergedAnswers = {
        ...((inProgress.answers as Record<string, number>) || {}),
        ...answers,
      };
      await admin
        .from('mock_attempts')
        .update({ answers: mergedAnswers })
        .eq('id', inProgress.id);

      return NextResponse.json({
        success: true,
        attemptId: inProgress.id,
        savedCount: Object.keys(mergedAnswers).length,
        savedAt: new Date().toISOString(),
      });
    }

    // If no unsubmitted attempt exists yet, create one with the saved answers
    const { data: created } = await admin
      .from('mock_attempts')
      .insert({
        test_id: testId,
        student_id: user.id,
        started_at: new Date().toISOString(),
        attempt_number: 1,
        answers,
      })
      .select('id')
      .maybeSingle();

    return NextResponse.json({
      success: true,
      attemptId: created?.id ?? null,
      savedCount: Object.keys(answers).length,
      savedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save progress';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

