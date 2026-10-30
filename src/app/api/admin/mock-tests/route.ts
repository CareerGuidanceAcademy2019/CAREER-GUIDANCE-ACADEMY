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

    // Fetch existing DB questions & passage groups to ensure complete synchronization
    const [existingGroupsRes, existingQsRes] = await Promise.all([
      admin.from('mock_question_groups').select('*').eq('test_id', t.id).order('position', { ascending: true }),
      admin.from('mock_questions').select('*').eq('test_id', t.id).order('position', { ascending: true }),
    ]);

    const existingDbGroups = existingGroupsRes.data || [];
    const existingDbQs = existingQsRes.data || [];

    // Build unified questionGroups list
    const groupMap = new Map<string, any>();
    for (const eg of existingDbGroups) {
      groupMap.set(eg.id, {
        id: eg.id,
        testId: t.id,
        position: eg.position || 1,
        passageText: eg.passage_text || '',
        imagePath: eg.image_path || null,
        imageAlt: eg.image_alt || null,
      });
    }

    const incomingGroups = Array.isArray(t.questionGroups) ? t.questionGroups : [];
    if (t.syncQuestions && Array.isArray(t.questionGroups)) {
      groupMap.clear();
    }
    for (const ig of incomingGroups) {
      if (ig && ig.id) {
        groupMap.set(ig.id, {
          id: ig.id,
          testId: t.id,
          position: ig.position || groupMap.size + 1,
          passageText: ig.passageText || ig.passage_text || '',
          imagePath: ig.imagePath || ig.image_path || null,
          imageAlt: ig.imageAlt || ig.image_alt || null,
        });
      }
    }

    const rawQList = Array.isArray(t.questions) ? t.questions : [];
    for (const q of rawQList) {
      if (q && q.groupId && q.passageText && !groupMap.has(q.groupId)) {
        groupMap.set(q.groupId, {
          id: q.groupId,
          testId: t.id,
          position: groupMap.size + 1,
          passageText: q.passageText,
          imagePath: q.passageImagePath || null,
          imageAlt: q.passageTitle || 'Comprehension Passage',
        });
      }
    }

    // Reconcile questions: if this was a quick status/date toggle (not full modal question edit)
    // and DB has questions not in rawQList, preserve them; if modal edit (t.syncQuestions), use rawQList
    let unifiedQuestions = rawQList;
    if (!t.syncQuestions && existingDbQs.length > rawQList.length) {
      const existingIds = new Set(rawQList.map((q: any) => q.id));
      const keysRes = await admin
        .from('mock_question_keys')
        .select('*')
        .in('question_id', existingDbQs.map((q: any) => q.id));
      const keyById = new Map((keysRes.data || []).map((k: any) => [k.question_id, k]));

      const fromDb = existingDbQs
        .filter((dq: any) => !existingIds.has(dq.id))
        .map((dq: any) => {
          const k = keyById.get(dq.id);
          const grp = dq.group_id ? groupMap.get(dq.group_id) : null;
          return {
            id: dq.id,
            question: dq.question_text || '',
            questionBn: dq.question_text_bn || undefined,
            options: dq.options || [],
            optionsBn: dq.options_bn || undefined,
            correctOptionIndex: k?.correct_option ?? 0,
            explanation: k?.explanation || '',
            explanationBn: k?.explanation_bn || undefined,
            groupId: dq.group_id || null,
            passageText: grp?.passageText || null,
            passageTitle: grp?.imageAlt || null,
            passageImagePath: grp?.imagePath || null,
            imagePath: dq.image_path || null,
            imageAlt: dq.image_alt || null,
          };
        });
      unifiedQuestions = [...fromDb, ...rawQList];
    }

    // Enrich every question with its passage metadata so JSONB is 100% self-contained
    const qList = unifiedQuestions.map((q: any, idx: number) => {
      const grp = q.groupId ? groupMap.get(q.groupId) : null;
      return {
        ...q,
        id: q.id || `q-${Date.now()}-${idx}`,
        position: idx + 1,
        question: q.question || q.questionText || '',
        questionBn: q.questionBn || q.questionTextBn || undefined,
        options: Array.isArray(q.options) ? q.options : [],
        optionsBn: Array.isArray(q.optionsBn) ? q.optionsBn : undefined,
        correctOptionIndex:
          typeof q.correctOptionIndex === 'number'
            ? q.correctOptionIndex
            : typeof q.correctOption === 'number'
            ? q.correctOption
            : 0,
        explanation: q.explanation || '',
        explanationBn: q.explanationBn || undefined,
        groupId: q.groupId || null,
        passageText: grp?.passageText || q.passageText || null,
        passageTitle: grp?.imageAlt || q.passageTitle || null,
        passageImagePath: grp?.imagePath || q.passageImagePath || null,
        imagePath: q.imagePath || null,
        imageAlt: q.imageAlt || null,
      };
    });

    // Only keep groups that are either explicitly in groupMap and referenced or added
    const activeGroupIds = new Set(qList.map((q: any) => q.groupId).filter(Boolean));
    const finalGroups = Array.from(groupMap.values()).filter(
      (g: any) => activeGroupIds.has(g.id) || incomingGroups.some((ig: any) => ig?.id === g.id)
    );

    const marksPerQ = Number(t.marksPerQuestion || t.marks_per_question || 1);
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
      total_marks: Number(qList.length ? qList.length * marksPerQ : (t.totalMarks || 30)),
      marks_per_question: marksPerQ,
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

    // Synchronize mock_question_groups, mock_questions, and mock_question_keys tables
    // so Preview, Studio, and Student Exam are 100% identical to mock_tests.questions
    try {
      const oldImgPaths = new Set<string>();
      for (const eg of existingDbGroups) {
        if (eg.image_path) oldImgPaths.add(eg.image_path);
      }
      for (const eq of existingDbQs) {
        if (eq.image_path) oldImgPaths.add(eq.image_path);
      }

      const newImgPaths = new Set<string>();
      for (const fg of finalGroups) {
        if (fg.imagePath) newImgPaths.add(fg.imagePath);
      }
      for (const fq of qList) {
        if (fq.imagePath) newImgPaths.add(fq.imagePath);
      }

      const removedImgs = Array.from(oldImgPaths).filter((p) => !newImgPaths.has(p));
      if (removedImgs.length > 0) {
        await admin.storage.from('mock-question-images').remove(removedImgs).catch(() => null);
      }

      await admin.from('mock_questions').delete().eq('test_id', t.id);
      await admin.from('mock_question_groups').delete().eq('test_id', t.id);

      if (finalGroups.length > 0) {
        const groupRows = finalGroups.map((g: any, idx: number) => ({
          id: g.id,
          test_id: t.id,
          position: idx + 1,
          passage_text: g.passageText || null,
          image_path: g.imagePath || null,
          image_alt: g.imageAlt || null,
        }));
        await admin.from('mock_question_groups').insert(groupRows);
      }

      if (qList.length > 0) {
        const validGrpSet = new Set(finalGroups.map((g: any) => g.id));
        const qRows = qList.map((q: any, idx: number) => ({
          id: q.id,
          test_id: t.id,
          position: idx + 1,
          group_id: q.groupId && validGrpSet.has(q.groupId) ? q.groupId : null,
          question_text: q.question || '',
          options: q.options || [],
          question_text_bn: q.questionBn || null,
          options_bn: q.optionsBn || null,
          image_path: q.imagePath || null,
          image_alt: q.imageAlt || null,
        }));
        await admin.from('mock_questions').insert(qRows);

        const keyRows = qList.map((q: any) => ({
          question_id: q.id,
          correct_option: Math.max(0, Math.min(3, Number(q.correctOptionIndex ?? 0))),
          explanation: q.explanation || '',
          explanation_bn: q.explanationBn || null,
          explanation_image_path: q.explanationImagePath || null,
          explanation_image_alt: q.explanationImageAlt || null,
        }));
        await admin.from('mock_question_keys').insert(keyRows);
      }
    } catch {
      // Non-fatal if relational sync encounters constraint issue; mock_tests.questions is already saved
    }

    return NextResponse.json({ success: true, test: { ...savedTest, questionGroups: finalGroups } });
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
