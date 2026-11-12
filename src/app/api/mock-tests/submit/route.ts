import { NextResponse } from 'next/server';
import { createAdminSupabase, requireActiveSession } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const active = await requireActiveSession(request);
    if (!active) {
      return NextResponse.json({ error: 'Please sign in again to submit your test.' }, { status: 401 });
    }
    const { user, supabase } = active;

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

    // 1. Primary: Call submit_mock_attempt RPC
    const { data, error } = await supabase.rpc('submit_mock_attempt', {
      p_test_id: testId,
      p_answers: answers,
      p_time_taken_seconds: timeTakenSeconds,
    });

    if (!error && data) {
      return NextResponse.json({
        success: true,
        ...data,
      });
    }

    // 2. Fallback: Server-side authoritative grading via service-role client if user RPC encountered a session/cookie edge case
    const admin = createAdminSupabase();
    const { data: testRow } = await admin
      .from('mock_tests')
      .select('*')
      .eq('id', testId)
      .maybeSingle();

    if (!testRow) {
      return NextResponse.json({ error: error?.message || 'Test not found.' }, { status: 404 });
    }

    const [{ data: qRows }, { data: inProgressAtt }] = await Promise.all([
      admin
        .from('mock_questions')
        .select('id, position, mock_question_keys(correct_option)')
        .eq('test_id', testId)
        .order('position', { ascending: true }),
      admin
        .from('mock_attempts')
        .select('*')
        .eq('test_id', testId)
        .eq('student_id', user.id)
        .is('submitted_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const mergedAnswers: Record<string, number> = {
      ...((inProgressAtt?.answers as Record<string, number>) || {}),
      ...(answers || {}),
    };

    const jsonQs: any[] = Array.isArray(testRow.questions) ? testRow.questions : [];
    let correctCount = 0;
    let wrongCount = 0;
    let unattemptedCount = 0;

    if (qRows && qRows.length > 0) {
      qRows.forEach((q: any, idx: number) => {
        const keyRel = Array.isArray(q.mock_question_keys) ? q.mock_question_keys[0] : q.mock_question_keys;
        const correctOpt = Number(keyRel?.correct_option ?? jsonQs[idx]?.correctOptionIndex ?? 0);
        let chosen = mergedAnswers[q.id];
        if (typeof chosen !== 'number' && jsonQs[idx]?.id) {
          chosen = mergedAnswers[jsonQs[idx].id];
          if (typeof chosen === 'number') mergedAnswers[q.id] = chosen;
        }
        if (typeof chosen !== 'number' || chosen < 0) {
          unattemptedCount++;
        } else if (chosen === correctOpt) {
          correctCount++;
        } else {
          wrongCount++;
        }
      });
    } else {
      jsonQs.forEach((jq: any) => {
        const chosen = mergedAnswers[jq.id];
        const correctOpt = Number(jq.correctOptionIndex ?? 0);
        if (typeof chosen !== 'number' || chosen < 0) {
          unattemptedCount++;
        } else if (chosen === correctOpt) {
          correctCount++;
        } else {
          wrongCount++;
        }
      });
    }

    const marksPerQ = Number(testRow.marks_per_question ?? 1);
    const negMark = Number(testRow.negative_marking ?? 0);
    const score = Math.max(0, correctCount * marksPerQ - wrongCount * negMark);
    const accuracy =
      correctCount + wrongCount > 0
        ? Math.round((correctCount / (correctCount + wrongCount)) * 1000) / 10
        : 0;
    const nowIso = new Date().toISOString();
    const actualSecs = Math.max(1, Number(timeTakenSeconds) || 60);

    let attemptId = inProgressAtt?.id;
    if (attemptId) {
      await admin
        .from('mock_attempts')
        .update({
          submitted_at: nowIso,
          answers: mergedAnswers,
          score,
          correct_count: correctCount,
          wrong_count: wrongCount,
          unattempted_count: unattemptedCount,
          accuracy,
          time_taken_seconds: actualSecs,
        })
        .eq('id', attemptId);
    } else {
      const { data: inserted } = await admin
        .from('mock_attempts')
        .insert({
          test_id: testId,
          student_id: user.id,
          started_at: new Date(Date.now() - actualSecs * 1000).toISOString(),
          submitted_at: nowIso,
          attempt_number: 1,
          answers: mergedAnswers,
          score,
          correct_count: correctCount,
          wrong_count: wrongCount,
          unattempted_count: unattemptedCount,
          accuracy,
          time_taken_seconds: actualSecs,
        })
        .select('id')
        .maybeSingle();
      attemptId = inserted?.id || `att-${Date.now()}`;
    }

    await admin.from('test_attempts').upsert({
      id: attemptId,
      test_id: testId,
      student_id: user.id,
      score,
      total_marks: Number(testRow.total_marks || 30),
      correct_count: correctCount,
      wrong_count: wrongCount,
      unattempted_count: unattemptedCount,
      accuracy,
      time_taken_minutes: Math.max(1, Math.round(actualSecs / 60)),
      submitted_at: nowIso,
      answers: mergedAnswers,
    });

    return NextResponse.json({
      success: true,
      attemptId,
      testId: testRow.id,
      testTitle: testRow.title,
      attemptNumber: inProgressAtt?.attempt_number || 1,
      attemptsAllowed: Number(testRow.attempts_allowed || 1),
      score,
      totalMarks: Number(testRow.total_marks || 30),
      correctCount,
      wrongCount,
      unattemptedCount,
      accuracy,
      timeTakenSeconds: actualSecs,
      submittedAt: nowIso,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to submit test';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
