import { NextResponse } from 'next/server';
import { createAdminSupabase, requireActiveSession } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

export async function GET(request: Request) {
  try {
    const active = await requireActiveSession(request);
    if (!active) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user, role } = active;

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
    const testId = searchParams.get('testId') || searchParams.get('id');

    if (!testId) {
      return NextResponse.json({ error: 'Missing testId parameter.' }, { status: 400 });
    }

    const admin = createAdminSupabase();
    const isAdmin =
      role === 'admin' ||
      role === 'ADMIN' ||
      user.email === 'angatsaha825@gmail.com' ||
      user.email === 'careerguidanceacademy2019@gmail.com';

    if (!isAdmin) {
      // Verify student has at least one submitted attempt in mock_attempts or test_attempts
      const [{ count: mCount }, { count: tCount }] = await Promise.all([
        admin
          .from('mock_attempts')
          .select('id', { count: 'exact', head: true })
          .eq('test_id', testId)
          .eq('student_id', user.id)
          .not('submitted_at', 'is', null),
        admin
          .from('test_attempts')
          .select('id', { count: 'exact', head: true })
          .eq('test_id', testId)
          .eq('student_id', user.id),
      ]);

      if ((mCount || 0) === 0 && (tCount || 0) === 0) {
        return NextResponse.json(
          { error: 'Solutions are unlocked only after submitting your mock test attempt.' },
          { status: 403 }
        );
      }
    }

    const [{ data: qRows }, { data: testRow }] = await Promise.all([
      admin
        .from('mock_questions')
        .select('id, position, question_text, question_text_bn, options, options_bn, group_id, image_path, image_alt, image_width, image_height, mock_question_keys(correct_option, explanation, explanation_bn)')
        .eq('test_id', testId)
        .order('position', { ascending: true }),
      admin.from('mock_tests').select('id, title, questions').eq('id', testId).maybeSingle(),
    ]);

    const jsonQs: any[] = Array.isArray(testRow?.questions) ? testRow.questions : [];
    const questions =
      qRows && qRows.length > 0
        ? qRows.map((q: any, idx: number) => {
            const keyRel = Array.isArray(q.mock_question_keys) ? q.mock_question_keys[0] : q.mock_question_keys;
            const correctOptionIndex = Number(
              keyRel?.correct_option ?? jsonQs[idx]?.correctOptionIndex ?? 0
            );
            return {
              id: q.id,
              position: q.position ?? idx + 1,
              question: q.question_text || jsonQs[idx]?.question || '',
              questionText: q.question_text || jsonQs[idx]?.question || '',
              questionBn: q.question_text_bn || jsonQs[idx]?.questionBn || '',
              options: q.options || jsonQs[idx]?.options || [],
              optionsBn: q.options_bn || jsonQs[idx]?.optionsBn || [],
              correctOptionIndex,
              correctOption: correctOptionIndex,
              explanation:
                keyRel?.explanation || jsonQs[idx]?.explanation || 'Refer to C.G.A model solutions.',
              explanationBn: keyRel?.explanation_bn || jsonQs[idx]?.explanationBn || '',
              groupId: q.group_id || jsonQs[idx]?.groupId || null,
              imagePath: q.image_path || jsonQs[idx]?.imagePath || null,
              imageAlt: q.image_alt || jsonQs[idx]?.imageAlt || null,
              imageWidth: q.image_width || jsonQs[idx]?.imageWidth || null,
              imageHeight: q.image_height || jsonQs[idx]?.imageHeight || null,
            };
          })
        : jsonQs.map((jq: any, idx: number) => ({
            ...jq,
            id: jq.id || `q-${idx + 1}`,
            position: idx + 1,
            correctOptionIndex: Number(jq.correctOptionIndex ?? 0),
            correctOption: Number(jq.correctOptionIndex ?? 0),
            explanation: jq.explanation || 'Refer to C.G.A model solutions.',
          }));

    return NextResponse.json({
      success: true,
      testId,
      questions,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch solutions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
