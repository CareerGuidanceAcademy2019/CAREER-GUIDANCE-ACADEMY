import { NextResponse } from 'next/server';
import { requireAdmin, createAdminSupabase } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized. Administrator access required.' }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `admin_status_${adminId}_${ip}`,
    RATE_LIMIT_RULES.ADMIN_ACTION.limit,
    RATE_LIMIT_RULES.ADMIN_ACTION.windowSeconds
  );
  if (!rateRes.allowed) {
    return createRateLimitResponse(rateRes);
  }

  try {
    const { testId, status, overrideWarnings } = await request.json();

    if (!testId || !status) {
      return NextResponse.json({ error: 'Missing testId or status parameter.' }, { status: 400 });
    }

    if (!['draft', 'ready', 'launched', 'closed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
    }

    const supabaseAdmin = createAdminSupabase();

    // If setting to 'ready', run server-side validation check
    if (status === 'ready') {
      const { data: questions, error: qErr } = await supabaseAdmin
        .from('mock_questions')
        .select('id, question_text, options, group_id, image_path, image_alt')
        .eq('test_id', testId);

      if (qErr || !questions || questions.length === 0) {
        return NextResponse.json(
          { error: 'Cannot mark as ready: Test has no saved questions.' },
          { status: 400 }
        );
      }

      const { data: keys, error: kErr } = await supabaseAdmin
        .from('mock_question_keys')
        .select('question_id, correct_option')
        .in('question_id', questions.map((q) => q.id));

      if (kErr || !keys || keys.length !== questions.length) {
        return NextResponse.json(
          { error: 'Cannot mark as ready: One or more questions are missing answer keys.' },
          { status: 400 }
        );
      }

      // Check options length and correct option range
      const keyMap = new Map(keys.map((k) => [k.question_id, k.correct_option]));
      const redErrors: string[] = [];
      const amberWarnings: string[] = [];

      questions.forEach((q, idx) => {
        const correct = keyMap.get(q.id);
        if (typeof correct !== 'number' || correct < 0 || correct > 3) {
          redErrors.push(`Question ${idx + 1} has an invalid answer key.`);
        }
        if (!Array.isArray(q.options) || q.options.length !== 4) {
          redErrors.push(`Question ${idx + 1} does not have exactly 4 options.`);
        }
        if (!q.question_text || !q.question_text.trim()) {
          redErrors.push(`Question ${idx + 1} statement is empty.`);
        }
        if (q.image_path && (!q.image_alt || !q.image_alt.trim())) {
          amberWarnings.push(`Question ${idx + 1} diagram is missing alt text.`);
        }
      });

      if (redErrors.length > 0) {
        return NextResponse.json(
          { error: 'Cannot mark as ready: Blocking validation errors exist.', details: redErrors },
          { status: 400 }
        );
      }

      if (amberWarnings.length > 0 && !overrideWarnings) {
        return NextResponse.json(
          {
            error: 'Test has warnings that require acknowledgment before marking as ready.',
            warnings: amberWarnings,
            requiresOverride: true,
          },
          { status: 400 }
        );
      }
    }

    const { error: updateErr } = await supabaseAdmin
      .from('mock_tests')
      .update({ status })
      .eq('id', testId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Log status change
    await supabaseAdmin.from('mock_launch_log').insert({
      test_id: testId,
      admin_id: adminId,
      action: `STATUS_${status.toUpperCase()}`,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      status,
      message: `Test status successfully updated to ${status}.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update test status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
