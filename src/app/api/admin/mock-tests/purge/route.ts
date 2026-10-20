import { NextResponse } from 'next/server';
import { requireAdmin, createAdminSupabase } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `admin_purge_${adminId}_${ip}`,
    RATE_LIMIT_RULES.ADMIN_ACTION.limit,
    RATE_LIMIT_RULES.ADMIN_ACTION.windowSeconds
  );
  if (!rateRes.allowed) {
    return createRateLimitResponse(rateRes);
  }

  try {
    const body = await request.json();
    const { testId, confirmTitle } = body;

    if (!testId) {
      return NextResponse.json({ error: 'Missing testId.' }, { status: 400 });
    }

    const supabaseAdmin = createAdminSupabase();

    // 1. Fetch test record
    const { data: test, error: testErr } = await supabaseAdmin
      .from('mock_tests')
      .select('*')
      .eq('id', testId)
      .single();

    if (testErr || !test) {
      return NextResponse.json({ error: 'Mock test not found.' }, { status: 404 });
    }

    if (test.content_status === 'purged') {
      return NextResponse.json({ error: 'This test has already been purged.' }, { status: 400 });
    }

    // 2. Validate Archive Gate: Downloaded in last 24h OR explicit typed confirmation
    const now = Date.now();
    const downloadedAt = test.archive_downloaded_at ? new Date(test.archive_downloaded_at).getTime() : 0;
    const isArchiveRecent = downloadedAt > 0 && now - downloadedAt < 24 * 60 * 60 * 1000;
    const isExplicitlyConfirmed = typeof confirmTitle === 'string' && confirmTitle.trim() === test.title.trim();

    if (!isArchiveRecent && !isExplicitlyConfirmed) {
      return NextResponse.json(
        {
          error:
            'Purge blocked: You must either download an archive backup first (within 24h), or type the exact test title to discard without archive.',
          needsConfirmation: true,
          requiredTitle: test.title,
        },
        { status: 403 }
      );
    }

    // 3. Fetch questions, groups, keys, and attempts to aggregate stats
    const [questionsRes, groupsRes, attemptsRes] = await Promise.all([
      supabaseAdmin.from('mock_questions').select('*').eq('test_id', testId).order('position'),
      supabaseAdmin.from('mock_question_groups').select('*').eq('test_id', testId),
      supabaseAdmin.from('mock_attempts').select('*').eq('test_id', testId).not('submitted_at', 'is', null),
    ]);

    const questions = questionsRes.data || [];
    const groups = groupsRes.data || [];
    const attempts = attemptsRes.data || [];

    let keys: any[] = [];
    if (questions.length > 0) {
      const qIds = questions.map((q) => q.id);
      const { data: keysData } = await supabaseAdmin
        .from('mock_question_keys')
        .select('*')
        .in('question_id', qIds);
      keys = keysData || [];
    }

    // 4. Calculate aggregated question statistics
    const statsRows: any[] = [];
    const totalAttempts = attempts.length;
    const totalTimeTaken = attempts.reduce((acc, a) => acc + (a.time_taken_seconds || 0), 0);
    const avgTimePerQuestion =
      questions.length > 0 && totalAttempts > 0
        ? Math.round(totalTimeTaken / (totalAttempts * questions.length))
        : 0;

    for (const q of questions) {
      const keyObj = keys.find((k) => k.question_id === q.id);
      const corrOpt = keyObj?.correct_option ?? 0;
      let attCount = 0;
      let corrCount = 0;
      let wrgCount = 0;

      for (const a of attempts) {
        if (!a.answers) continue;
        const ans = a.answers[q.id] ?? a.answers[String(q.position - 1)];
        if (ans !== undefined) {
          attCount++;
          if (Number(ans) === corrOpt) corrCount++;
          else wrgCount++;
        }
      }

      statsRows.push({
        test_id: testId,
        position: q.position,
        subject_tag: q.subject || '',
        attempted_count: attCount,
        correct_count: corrCount,
        wrong_count: wrgCount,
        average_time_seconds: avgTimePerQuestion,
      });
    }

    if (statsRows.length > 0) {
      await supabaseAdmin.from('mock_test_question_stats').upsert(statsRows, { onConflict: 'test_id,position' });
    }

    // 5. Collect diagram images and remove from bucket 'mock-question-images'
    const imagePaths = new Set<string>();
    groups.forEach((g) => { if (g.image_path) imagePaths.add(g.image_path); });
    questions.forEach((q) => {
      if (q.image_path) imagePaths.add(q.image_path);
      if (Array.isArray(q.options)) {
        q.options.forEach((opt: any) => {
          if (opt && typeof opt === 'object' && opt.image_path) imagePaths.add(opt.image_path);
        });
      }
    });
    keys.forEach((k) => {
      if (k.explanation_image_path) imagePaths.add(k.explanation_image_path);
    });

    if (imagePaths.size > 0) {
      await supabaseAdmin.storage.from('mock-question-images').remove(Array.from(imagePaths));
    }

    // 6. Delete question rows (keys cascade from questions) and groups
    if (questions.length > 0) {
      await supabaseAdmin.from('mock_questions').delete().eq('test_id', testId);
    }
    if (groups.length > 0) {
      await supabaseAdmin.from('mock_question_groups').delete().eq('test_id', testId);
    }

    // 7. Update mock_tests status to 'purged'
    await supabaseAdmin
      .from('mock_tests')
      .update({ content_status: 'purged' })
      .eq('id', testId);

    return NextResponse.json({
      success: true,
      message: 'Test question content and diagrams successfully purged. Summary statistics preserved.',
      purgedQuestions: questions.length,
      purgedImages: imagePaths.size,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to purge mock test';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
