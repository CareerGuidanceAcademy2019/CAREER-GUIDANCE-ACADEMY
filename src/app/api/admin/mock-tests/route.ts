import { NextResponse } from 'next/server';
import { createAdminSupabase, requireAdmin } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const adminId = await requireAdmin(request);
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `admin_upsert_test_${adminId}_${ip}`,
    RATE_LIMIT_RULES.ADMIN_ACTION.limit,
    RATE_LIMIT_RULES.ADMIN_ACTION.windowSeconds
  );
  if (!rateRes.allowed) return createRateLimitResponse(rateRes);

  try {
    const t = await request.json().catch(() => null);
    if (!t || !t.id || !t.title) {
      return NextResponse.json({ error: 'Test ID and title are required.' }, { status: 400 });
    }

    const admin = createAdminSupabase();

    // Verify foreign key references safely
    let validCourseId: string | null = null;
    if (t.courseId && String(t.courseId).trim()) {
      const { data: matchedCourse } = await admin
        .from('courses')
        .select('id')
        .eq('id', String(t.courseId).trim())
        .maybeSingle();
      if (matchedCourse) validCourseId = matchedCourse.id;
    }

    let validSeriesId = t.seriesId || t.series_id || null;
    if (validSeriesId) {
      const { data: matchedSeries } = await admin
        .from('mock_series')
        .select('id')
        .eq('id', validSeriesId)
        .maybeSingle();
      if (!matchedSeries) {
        validSeriesId = 'series-ttet-paper1';
      }
    } else {
      validSeriesId = 'series-ttet-paper1';
    }

    let validSubjectId = t.subjectId || t.subject_id || null;
    if (validSubjectId) {
      const { data: matchedSubject } = await admin
        .from('mock_subjects')
        .select('id')
        .or(`id.eq.${validSubjectId},name.eq.${validSubjectId}`)
        .maybeSingle();
      validSubjectId = matchedSubject ? matchedSubject.id : null;
    }

    const qList = Array.isArray(t.questions) ? t.questions : [];
    const payload = {
      id: t.id,
      title: t.title,
      subject: t.subject ?? null,
      drive_link: t.driveLink || t.drive_link || null,
      course_id: validCourseId,
      series_id: validSeriesId,
      subject_id: validSubjectId,
      test_type: t.testType || t.test_type || 'sectional',
      test_no: Number(t.testNo || t.test_no || 1),
      question_count: qList.length,
      batch_name: t.batchName || t.batch_name || '',
      duration_minutes: Number(t.durationMinutes || t.duration_minutes || 60),
      total_marks: Number(t.totalMarks || (qList.length ? qList.length * (t.marksPerQuestion || 1) : 30)),
      marks_per_question: Number(t.marksPerQuestion || t.marks_per_question || 1),
      negative_marking: Number(t.negativeMarking || t.negative_marking || 0),
      scheduled_date: t.scheduledDate || t.scheduled_date || '',
      status: t.status || 'Draft',
      questions: qList,
      window_start: t.windowStart || t.window_start || null,
      window_end: t.windowEnd || t.window_end || null,
    };

    const { data: savedTest, error } = await admin
      .from('mock_tests')
      .upsert(payload)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, test: savedTest });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to save mock test.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const adminId = await requireAdmin(request);
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `admin_test_${adminId}_${ip}`,
    RATE_LIMIT_RULES.ADMIN_ACTION.limit,
    RATE_LIMIT_RULES.ADMIN_ACTION.windowSeconds
  );
  if (!rateRes.allowed) return createRateLimitResponse(rateRes);

  const id = new URL(request.url).searchParams.get('id') ?? '';
  if (!id) return NextResponse.json({ error: 'Mock Test ID is required' }, { status: 400 });

  const admin = createAdminSupabase();

  // Find test
  const { data: test } = await admin
    .from('mock_tests')
    .select('id, title')
    .eq('id', id)
    .maybeSingle();

  if (!test) {
    await admin.from('mock_attempts').delete().eq('test_id', id);
    await admin.from('test_attempts').delete().eq('test_id', id);
    await admin.from('mock_questions').delete().eq('test_id', id);
    await admin.from('mock_question_groups').delete().eq('test_id', id);
    await admin.from('mock_launch_log').delete().eq('test_id', id);
    await admin.from('mock_test_question_stats').delete().eq('test_id', id);
    return NextResponse.json({ ok: true, message: 'Mock test cleaned and removed.' });
  }

  // 1. Find and delete diagram images from storage bucket
  const { data: questions } = await admin
    .from('mock_questions')
    .select('image_path, options')
    .eq('test_id', id);

  const imagesToDelete: string[] = [];
  if (questions) {
    for (const q of questions) {
      if (q.image_path) imagesToDelete.push(q.image_path);
      if (Array.isArray(q.options)) {
        for (const opt of q.options) {
          if (typeof opt === 'object' && opt !== null && (opt as any).imagePath) {
            imagesToDelete.push((opt as any).imagePath);
          }
        }
      }
    }
  }

  const { data: groups } = await admin
    .from('mock_question_groups')
    .select('image_path')
    .eq('test_id', id);

  if (groups) {
    for (const g of groups) {
      if (g.image_path) imagesToDelete.push(g.image_path);
    }
  }

  if (imagesToDelete.length > 0) {
    await admin.storage.from('mock-question-images').remove(imagesToDelete).catch(() => null);
  }

  // 2. Cascade delete database tables
  await admin.from('mock_attempts').delete().eq('test_id', id);
  await admin.from('test_attempts').delete().eq('test_id', id);
  await admin.from('mock_questions').delete().eq('test_id', id);
  await admin.from('mock_question_groups').delete().eq('test_id', id);
  await admin.from('mock_launch_log').delete().eq('test_id', id);
  await admin.from('mock_test_question_stats').delete().eq('test_id', id);

  // 3. Delete mock test record
  const { error: delErr } = await admin.from('mock_tests').delete().eq('id', id);
  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    message: `Mock test "${test.title}" and all questions, attempts, and diagram assets permanently deleted from database.`,
  });
}
