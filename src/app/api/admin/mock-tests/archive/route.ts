import { NextResponse } from 'next/server';
import { requireAdmin, createAdminSupabase } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';
import JSZip from 'jszip';
import { createHash } from 'node:crypto';

export async function GET(request: Request) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `admin_archive_${adminId}_${ip}`,
    RATE_LIMIT_RULES.ADMIN_EXPORT.limit,
    RATE_LIMIT_RULES.ADMIN_EXPORT.windowSeconds
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

    // 1. Fetch test metadata
    const { data: test, error: testErr } = await supabaseAdmin
      .from('mock_tests')
      .select('*')
      .eq('id', testId)
      .single();

    if (testErr || !test) {
      return NextResponse.json({ error: 'Mock test not found.' }, { status: 404 });
    }

    // 2. Fetch groups, questions, keys, and attempts
    const [groupsRes, questionsRes, attemptsRes] = await Promise.all([
      supabaseAdmin.from('mock_question_groups').select('*').eq('test_id', testId).order('position'),
      supabaseAdmin.from('mock_questions').select('*').eq('test_id', testId).order('position'),
      supabaseAdmin.from('mock_attempts').select('*').eq('test_id', testId).order('submitted_at', { ascending: false }),
    ]);

    const groups = groupsRes.data || [];
    const questions = questionsRes.data || [];
    const attempts = attemptsRes.data || [];

    // Fetch keys for these questions
    let keys: any[] = [];
    if (questions.length > 0) {
      const qIds = questions.map((q) => q.id);
      const { data: keysData } = await supabaseAdmin
        .from('mock_question_keys')
        .select('*')
        .in('question_id', qIds);
      keys = keysData || [];
    }

    // Combine questions with their keys
    const fullQuestions = questions.map((q) => {
      const keyObj = keys.find((k) => k.question_id === q.id);
      return {
        ...q,
        correctOption: keyObj?.correct_option ?? 0,
        explanation: keyObj?.explanation ?? '',
        explanationBn: keyObj?.explanation_bn ?? '',
        explanationImagePath: keyObj?.explanation_image_path ?? null,
        explanationImageAlt: keyObj?.explanation_image_alt ?? null,
      };
    });

    // 3. Collect diagram image files from bucket 'mock-question-images'
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
    keys.forEach((k) => { if (k.explanation_image_path) imagePaths.add(k.explanation_image_path); });

    const zip = new JSZip();
    const imagesFolder = zip.folder('images');
    const fileChecksums: Record<string, string> = {};

    // Download each image from storage and add to zip
    for (const imgPath of imagePaths) {
      try {
        const { data: imgData } = await supabaseAdmin.storage
          .from('mock-question-images')
          .download(imgPath);
        if (imgData) {
          const buffer = Buffer.from(await imgData.arrayBuffer());
          const hash = createHash('sha256').update(buffer).digest('hex');
          imagesFolder?.file(imgPath, buffer);
          fileChecksums[`images/${imgPath}`] = hash;
        }
      } catch {}
    }

    // 4. Generate results_summary.csv
    const csvRows: string[] = [];
    csvRows.push('STUDENT ATTEMPTS SUMMARY');
    csvRows.push('Student ID,Score,Total Marks,Accuracy (%),Time Taken (s),Submitted At');
    attempts.forEach((att) => {
      csvRows.push(
        `"${att.student_id}",${att.score},${test.total_marks || 0},${att.accuracy || 0},${att.time_taken_seconds || 0},"${att.submitted_at || ''}"`
      );
    });

    csvRows.push('');
    csvRows.push('QUESTION STATISTICS SUMMARY');
    csvRows.push('Question Position,Subject Tag,Attempted Count,Correct Count,Wrong Count,Accuracy (%)');
    questions.forEach((q) => {
      const keyObj = keys.find((k) => k.question_id === q.id);
      const corrOpt = keyObj?.correct_option ?? 0;
      let attCount = 0;
      let corrCount = 0;
      let wrgCount = 0;
      attempts.forEach((a) => {
        if (!a.answers) return;
        const ans = a.answers[q.id] ?? a.answers[String(q.position - 1)];
        if (ans !== undefined) {
          attCount++;
          if (Number(ans) === corrOpt) corrCount++;
          else wrgCount++;
        }
      });
      const qAcc = attCount > 0 ? Math.round((corrCount / attCount) * 100) : 0;
      csvRows.push(`${q.position},"${q.subject || ''}",${attCount},${corrCount},${wrgCount},${qAcc}%`);
    });

    const csvContent = csvRows.join('\n');
    const csvBuffer = Buffer.from(csvContent, 'utf-8');
    zip.file('results_summary.csv', csvBuffer);
    fileChecksums['results_summary.csv'] = createHash('sha256').update(csvBuffer).digest('hex');

    // 5. Generate questions.json
    const questionsPayload = {
      testId: test.id,
      title: test.title,
      exportedAt: new Date().toISOString(),
      questionGroups: groups,
      questions: fullQuestions,
    };
    const questionsBuffer = Buffer.from(JSON.stringify(questionsPayload, null, 2), 'utf-8');
    zip.file('questions.json', questionsBuffer);
    fileChecksums['questions.json'] = createHash('sha256').update(questionsBuffer).digest('hex');

    // 6. Generate manifest.json
    const manifest = {
      version: '1.0',
      archiveType: 'cga_mock_test_archive',
      exportedAt: new Date().toISOString(),
      test: {
        id: test.id,
        title: test.title,
        durationMinutes: test.duration_minutes,
        totalMarks: test.total_marks,
        negativeMarking: test.negative_marking,
        seriesId: test.series_id,
        subjectId: test.subject_id,
        questionCount: questions.length,
        attemptCount: attempts.length,
      },
      fileChecksums,
    };
    const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 2), 'utf-8');
    zip.file('manifest.json', manifestBuffer);

    // 7. Update archive_downloaded_at on mock_tests
    await supabaseAdmin
      .from('mock_tests')
      .update({ archive_downloaded_at: new Date().toISOString() })
      .eq('id', testId);

    // 8. Generate ZIP buffer and return response
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    const cleanTitle = test.title.replace(/[^a-zA-Z0-9_-]/g, '_');

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${cleanTitle}_archive.zip"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create archive';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
