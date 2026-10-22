import { NextResponse } from 'next/server';
import { requireAdmin, createAdminSupabase } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

export async function GET(request: Request) {
  const adminId = await requireAdmin();
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
    const { data, error } = await supabaseAdmin.rpc('get_admin_preview_test', {
      p_test_id: testId,
    });

    if (error) {
      const { data: testRow } = await supabaseAdmin
        .from('mock_tests')
        .select('*')
        .eq('id', testId)
        .maybeSingle();

      if (testRow) {
        const rawQs = Array.isArray(testRow.questions) ? testRow.questions : [];
        const mappedQs = rawQs.map((q: any, idx: number) => ({
          id: q.id || `q-${idx}`,
          position: idx + 1,
          questionText: q.question || '',
          options: q.options || [],
          questionTextBn: q.questionBn || null,
          optionsBn: q.optionsBn || null,
          correctOption: q.correctOptionIndex ?? 0,
          explanation: q.explanation || '',
          explanationBn: q.explanationBn || null,
        }));

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
          questions: mappedQs,
          questionGroups: [],
        });
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load preview data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
