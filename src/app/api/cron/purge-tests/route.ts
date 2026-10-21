import { NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';

export async function GET(request: Request) {
  // Verify authorization header: Vercel Cron or secret bearer
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized cron request.' }, { status: 401 });
  }

  try {
    const supabaseAdmin = createAdminSupabase();
    const now = new Date().toISOString();

    // 1. Find all tests where content_status IN ('active', 'expired') AND purge_after < NOW()
    const { data: expiredTests, error: fetchErr } = await supabaseAdmin
      .from('mock_tests')
      .select('id, title, content_status, purge_after, archive_downloaded_at, purge_requires_archive')
      .in('content_status', ['active', 'expired'])
      .lt('purge_after', now);

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    const tests = expiredTests || [];
    const results: { testId: string; title: string; action: 'purged' | 'flagged_expired'; reason?: string }[] = [];

    for (const test of tests) {
      // If purge_requires_archive is true on the test and no archive was downloaded:
      // Mark content_status = 'expired' and alert admin rather than auto-purging.
      if (test.purge_requires_archive && !test.archive_downloaded_at) {
        if (test.content_status !== 'expired') {
          await supabaseAdmin
            .from('mock_tests')
            .update({ content_status: 'expired' })
            .eq('id', test.id);
        }
        results.push({
          testId: test.id,
          title: test.title,
          action: 'flagged_expired',
          reason: 'Awaiting mandatory archive backup before purge.',
        });
        continue;
      }

      // Proceed to purge:
      // (a) Aggregate question stats from mock_attempts
      const [questionsRes, groupsRes, attemptsRes] = await Promise.all([
        supabaseAdmin.from('mock_questions').select('*').eq('test_id', test.id).order('position'),
        supabaseAdmin.from('mock_question_groups').select('*').eq('test_id', test.id),
        supabaseAdmin.from('mock_attempts').select('*').eq('test_id', test.id).not('submitted_at', 'is', null),
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

      const totalAttempts = attempts.length;
      const totalTimeTaken = attempts.reduce((acc, a) => acc + (a.time_taken_seconds || 0), 0);
      const avgTimePerQuestion =
        questions.length > 0 && totalAttempts > 0
          ? Math.round(totalTimeTaken / (totalAttempts * questions.length))
          : 0;

      const statsRows: any[] = [];
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
          test_id: test.id,
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

      // (b) Delete diagram images from bucket
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

      // (c) Delete questions & groups
      if (questions.length > 0) {
        await supabaseAdmin.from('mock_questions').delete().eq('test_id', test.id);
      }
      if (groups.length > 0) {
        await supabaseAdmin.from('mock_question_groups').delete().eq('test_id', test.id);
      }

      // (d) Set content_status = 'purged'
      await supabaseAdmin
        .from('mock_tests')
        .update({ content_status: 'purged' })
        .eq('id', test.id);

      results.push({
        testId: test.id,
        title: test.title,
        action: 'purged',
      });
    }

    return NextResponse.json({
      success: true,
      processed: tests.length,
      timestamp: now,
      results,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Cron purge error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
