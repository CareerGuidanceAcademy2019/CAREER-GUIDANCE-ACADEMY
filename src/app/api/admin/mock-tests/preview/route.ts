import { NextResponse } from 'next/server';
import { requireAdmin, createAdminSupabase } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

export async function GET(request: Request) {
  const adminId = await requireAdmin(request);
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized. Administrator access required.' }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `admin_prev_${adminId}_${ip}`,
    RATE_LIMIT_RULES.ADMIN_ACTION.limit,
    RATE_LIMIT_RULES.ADMIN_ACTION.windowSeconds
  );
  if (!rateRes.allowed) {
    return createRateLimitResponse(rateRes);
  }

  const { searchParams } = new URL(request.url);
  const testId = searchParams.get('testId');
  if (!testId) {
    return NextResponse.json({ error: 'Missing testId parameter.' }, { status: 400 });
  }

  try {
    const supabaseAdmin = createAdminSupabase();

    // 1. Fetch mock test record
    const { data: testRow } = await supabaseAdmin
      .from('mock_tests')
      .select('*')
      .eq('id', testId)
      .maybeSingle();

    if (testRow) {
      // 2. Fetch questions from mock_questions table if available
      const { data: dbQs } = await supabaseAdmin
        .from('mock_questions')
        .select('*')
        .eq('test_id', testId)
        .order('position', { ascending: true });

      const { data: dbGroups } = await supabaseAdmin
        .from('mock_question_groups')
        .select('*')
        .eq('test_id', testId)
        .order('position', { ascending: true });

      let finalQs: any[] = [];
      if (dbQs && dbQs.length > 0) {
        finalQs = dbQs.map((q: any) => ({
          id: q.id,
          position: q.position,
          questionText: q.question_text || q.question || '',
          options: q.options || [],
          questionTextBn: q.question_text_bn || null,
          optionsBn: q.options_bn || null,
          correctOption: q.correct_option ?? 0,
          explanation: q.explanation || '',
          explanationBn: q.explanation_bn || null,
          imagePath: q.image_path || null,
          imageAlt: q.image_alt || null,
          groupId: q.group_id || null,
        }));
      } else {
        const rawQs = Array.isArray(testRow.questions) ? testRow.questions : [];
        finalQs = rawQs.map((q: any, idx: number) => ({
          id: q.id || `q-${idx}`,
          position: idx + 1,
          questionText: q.question || q.questionText || '',
          options: q.options || [],
          questionTextBn: q.questionBn || null,
          optionsBn: q.optionsBn || null,
          correctOption: q.correctOptionIndex ?? q.correctOption ?? 0,
          explanation: q.explanation || '',
          explanationBn: q.explanationBn || null,
          imagePath: q.imagePath || null,
          imageAlt: q.imageAlt || null,
          groupId: q.groupId || null,
        }));
      }

      return NextResponse.json({
        success: true,
        test: {
          id: testRow.id,
          title: testRow.title,
          durationMinutes: testRow.duration_minutes,
          totalMarks: testRow.total_marks,
          marksPerQuestion: testRow.marks_per_question,
          negativeMarking: testRow.negative_marking,
          status: testRow.status,
          scheduledDate: testRow.scheduled_date,
        },
        questions: finalQs,
        questionGroups: dbGroups || [],
      });
    }

    // Fallback RPC if direct table fetch did not find the test
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('get_admin_preview_test', {
      p_test_id: testId,
    });

    if (!rpcError && rpcData) {
      return NextResponse.json({ success: true, ...rpcData });
    }

    return NextResponse.json({ error: 'Mock test not found' }, { status: 404 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load preview data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
