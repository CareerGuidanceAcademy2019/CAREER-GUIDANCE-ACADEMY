import { NextResponse } from 'next/server';
import { requireAdmin, createAdminSupabase } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

export async function GET(request: Request) {
  const adminId = await requireAdmin(request);
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized. Administrator access required.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const testId = searchParams.get('testId');
  if (!testId) {
    return NextResponse.json({ error: 'Missing testId parameter.' }, { status: 400 });
  }

  try {
    const supabaseAdmin = createAdminSupabase();

    const { data: testRow } = await supabaseAdmin
      .from('mock_tests')
      .select('*')
      .eq('id', testId)
      .maybeSingle();

    if (!testRow) {
      return NextResponse.json({ error: 'Mock test not found.' }, { status: 404 });
    }

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

    const qIds = (dbQs || []).map((q: any) => q.id);
    let dbKeys: any[] = [];
    if (qIds.length > 0) {
      const { data: keysData } = await supabaseAdmin
        .from('mock_question_keys')
        .select('*')
        .in('question_id', qIds);
      dbKeys = keysData || [];
    }

    const keyMap = new Map<string, any>();
    for (const k of dbKeys) {
      keyMap.set(k.question_id, k);
    }

    const groupMap = new Map<string, any>();
    for (const g of dbGroups || []) {
      groupMap.set(g.id, {
        id: g.id,
        testId: g.test_id || testId,
        position: g.position || 1,
        passageText: g.passage_text || g.passageText || '',
        passage_text: g.passage_text || g.passageText || '',
        imagePath: g.image_path || g.imagePath || null,
        image_path: g.image_path || g.imagePath || null,
        imageAlt: g.image_alt || g.imageAlt || null,
        image_alt: g.image_alt || g.imageAlt || null,
      });
    }

    const rawJsonQs = Array.isArray(testRow.questions) ? testRow.questions : [];
    for (const jq of rawJsonQs) {
      if (jq && jq.groupId && jq.passageText && !groupMap.has(jq.groupId)) {
        groupMap.set(jq.groupId, {
          id: jq.groupId,
          testId,
          position: groupMap.size + 1,
          passageText: jq.passageText,
          passage_text: jq.passageText,
          imagePath: jq.passageImagePath || null,
          image_path: jq.passageImagePath || null,
          imageAlt: jq.passageTitle || 'Comprehension Passage',
          image_alt: jq.passageTitle || 'Comprehension Passage',
        });
      }
    }

    const mappedGroups = Array.from(groupMap.values());

    // Combine dbQs and rawJsonQs so no question from either source is ever lost
    const seenIds = new Set<string>();
    const seenStems = new Set<string>();
    const finalQs: any[] = [];

    if (dbQs && dbQs.length > 0) {
      for (const q of dbQs) {
        const k = keyMap.get(q.id);
        const qText = (q.question_text || q.question || '').trim();
        const grp = q.group_id ? groupMap.get(q.group_id) : null;
        seenIds.add(q.id);
        if (qText) seenStems.add(qText.toLowerCase());
        finalQs.push({
          id: q.id,
          position: finalQs.length + 1,
          questionText: qText,
          question: qText,
          options: q.options || [],
          questionTextBn: q.question_text_bn || null,
          questionBn: q.question_text_bn || null,
          optionsBn: q.options_bn || null,
          correctOption: k?.correct_option ?? 0,
          correctOptionIndex: k?.correct_option ?? 0,
          explanation: k?.explanation || '',
          explanationBn: k?.explanation_bn || null,
          explanationImagePath: k?.explanation_image_path || null,
          explanationImageAlt: k?.explanation_image_alt || null,
          imagePath: q.image_path || null,
          imageAlt: q.image_alt || null,
          groupId: q.group_id || null,
          passageText: grp?.passageText || null,
          passageTitle: grp?.imageAlt || null,
          passageImagePath: grp?.imagePath || null,
        });
      }
    }

    for (let idx = 0; idx < rawJsonQs.length; idx++) {
      const q = rawJsonQs[idx];
      const qId = q.id || `q-${idx}`;
      const qText = (q.question || q.questionText || '').trim();
      if (seenIds.has(qId) || (qText && seenStems.has(qText.toLowerCase()))) {
        continue;
      }
      seenIds.add(qId);
      if (qText) seenStems.add(qText.toLowerCase());
      const grp = q.groupId ? groupMap.get(q.groupId) : null;
      const corr = q.correctOptionIndex ?? q.correctOption ?? 0;
      finalQs.push({
        id: qId,
        position: finalQs.length + 1,
        questionText: qText,
        question: qText,
        options: q.options || [],
        questionTextBn: q.questionBn || q.questionTextBn || null,
        questionBn: q.questionBn || q.questionTextBn || null,
        optionsBn: q.optionsBn || null,
        correctOption: corr,
        correctOptionIndex: corr,
        explanation: q.explanation || '',
        explanationBn: q.explanationBn || null,
        explanationImagePath: q.explanationImagePath || null,
        explanationImageAlt: q.explanationImageAlt || null,
        imagePath: q.imagePath || null,
        imageAlt: q.imageAlt || null,
        groupId: q.groupId || null,
        passageText: grp?.passageText || q.passageText || null,
        passageTitle: grp?.imageAlt || q.passageTitle || null,
        passageImagePath: grp?.imagePath || q.passageImagePath || null,
      });
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
      questionGroups: mappedGroups,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch test questions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const adminId = await requireAdmin(request);
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized. Administrator access required.' }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `admin_save_q_${adminId}_${ip}`,
    RATE_LIMIT_RULES.ADMIN_ACTION.limit,
    RATE_LIMIT_RULES.ADMIN_ACTION.windowSeconds
  );
  if (!rateRes.allowed) {
    return createRateLimitResponse(rateRes);
  }

  try {
    const body = await request.json();
    const { testId, questionGroups = [], questions = [] } = body;

    if (!testId) {
      return NextResponse.json({ error: 'Missing testId.' }, { status: 400 });
    }

    const supabaseAdmin = createAdminSupabase();

    // 1. Fetch existing image paths to track any deletions
    const [existingQRes, existingGroupRes, existingKeyRes] = await Promise.all([
      supabaseAdmin.from('mock_questions').select('id, image_path, options, options_bn').eq('test_id', testId),
      supabaseAdmin.from('mock_question_groups').select('id, image_path').eq('test_id', testId),
      supabaseAdmin
        .from('mock_question_keys')
        .select('explanation_image_path')
        .in(
          'question_id',
          (
            await supabaseAdmin.from('mock_questions').select('id').eq('test_id', testId)
          ).data?.map((q) => q.id) || ['__none__']
        ),
    ]);

    const oldPaths = new Set<string>();
    for (const g of existingGroupRes.data || []) {
      if (g.image_path) oldPaths.add(g.image_path);
    }
    for (const q of existingQRes.data || []) {
      if (q.image_path) oldPaths.add(q.image_path);
      if (Array.isArray(q.options)) {
        for (const opt of q.options) {
          if (typeof opt === 'object' && opt !== null) {
            if (opt.image_path) oldPaths.add(opt.image_path);
            if (opt.imagePath) oldPaths.add(opt.imagePath);
          }
        }
      }
    }
    for (const k of existingKeyRes.data || []) {
      if (k.explanation_image_path) oldPaths.add(k.explanation_image_path);
    }

    // 2. Identify new paths in the updated payload
    const newPaths = new Set<string>();
    for (const g of questionGroups) {
      if (g.imagePath) newPaths.add(g.imagePath);
    }
    for (const q of questions) {
      if (q.imagePath) newPaths.add(q.imagePath);
      if (q.explanationImagePath) newPaths.add(q.explanationImagePath);
      if (Array.isArray(q.options)) {
        for (const opt of q.options) {
          if (typeof opt === 'object' && opt !== null) {
            if (opt.image_path) newPaths.add(opt.image_path);
            if (opt.imagePath) newPaths.add(opt.imagePath);
          }
        }
      }
    }

    // Determine removed paths
    const removedPaths: string[] = [];
    for (const p of oldPaths) {
      if (!newPaths.has(p)) {
        removedPaths.push(p);
      }
    }

    // Delete removed images from storage
    if (removedPaths.length > 0) {
      await supabaseAdmin.storage.from('mock-question-images').remove(removedPaths);
    }

    // 3. Delete existing questions and groups for clean replace
    await supabaseAdmin.from('mock_questions').delete().eq('test_id', testId);
    await supabaseAdmin.from('mock_question_groups').delete().eq('test_id', testId);

    // 4. Insert updated question groups
    const groupInsertMap = new Map<string, string>(); // oldId -> newId
    const groupById = new Map<string, any>();
    if (questionGroups.length > 0) {
      const groupRows = questionGroups.map((g: any, idx: number) => {
        const generatedId = g.id && !g.id.startsWith('temp-') ? g.id : `grp-${Date.now()}-${idx}`;
        if (g.id) groupInsertMap.set(g.id, generatedId);
        const row = {
          id: generatedId,
          test_id: testId,
          position: idx + 1,
          passage_text: g.passageText || g.passage_text || null,
          image_path: g.imagePath || g.image_path || null,
          image_alt: g.imageAlt || g.image_alt || null,
        };
        groupById.set(generatedId, row);
        return row;
      });

      const { error: groupErr } = await supabaseAdmin.from('mock_question_groups').insert(groupRows);
      if (groupErr) {
        throw new Error(`Failed to save question groups: ${groupErr.message}`);
      }
    }

    // 5. Insert questions and their answer keys
    let savedQIds: string[] = [];
    if (questions.length > 0) {
      const qRows = questions.map((q: any, idx: number) => {
        const qId = q.id && !q.id.startsWith('temp-') ? q.id : `q-${Date.now()}-${idx}`;
        savedQIds.push(qId);
        const mappedGroupId = q.groupId ? groupInsertMap.get(q.groupId) || q.groupId : null;

        return {
          id: qId,
          test_id: testId,
          position: idx + 1,
          group_id: mappedGroupId,
          question_text: q.questionText || q.question || '',
          options: q.options || [],
          question_text_bn: q.questionTextBn || q.questionBn || null,
          options_bn: q.optionsBn || null,
          image_path: q.imagePath || null,
          image_alt: q.imageAlt || null,
          image_width: q.imageWidth || null,
          image_height: q.imageHeight || null,
        };
      });

      const { error: qErr } = await supabaseAdmin.from('mock_questions').insert(qRows);
      if (qErr) {
        throw new Error(`Failed to save questions: ${qErr.message}`);
      }

      // Keys
      const keyRows = questions.map((q: any, idx: number) => {
        const qId = qRows[idx].id;
        const correct =
          typeof q.correctOption === 'number'
            ? q.correctOption
            : typeof q.correctOptionIndex === 'number'
            ? q.correctOptionIndex
            : 0;

        return {
          question_id: qId,
          correct_option: Math.max(0, Math.min(3, correct)),
          explanation: q.explanation || '',
          explanation_bn: q.explanationBn || null,
          explanation_image_path: q.explanationImagePath || null,
          explanation_image_alt: q.explanationImageAlt || null,
        };
      });

      const { error: keyErr } = await supabaseAdmin.from('mock_question_keys').insert(keyRows);
      if (keyErr) {
        throw new Error(`Failed to save question keys: ${keyErr.message}`);
      }
    }

    // 6. Update question_count, total_marks, and self-contained questions array on mock_tests
    const { data: currentTestRow } = await supabaseAdmin
      .from('mock_tests')
      .select('marks_per_question')
      .eq('id', testId)
      .maybeSingle();
    const marksPerQ = Number(currentTestRow?.marks_per_question || 1);

    const enrichedQuestionsForTest = questions.map((q: any, idx: number) => {
      const mappedGroupId = q.groupId ? groupInsertMap.get(q.groupId) || q.groupId : null;
      const grp = mappedGroupId ? groupById.get(mappedGroupId) : null;
      return {
        id: savedQIds[idx] || q.id || `q-${idx}`,
        position: idx + 1,
        question: q.questionText || q.question || '',
        questionBn: q.questionTextBn || q.questionBn || null,
        options: q.options || [],
        optionsBn: q.optionsBn || null,
        correctOptionIndex:
          typeof q.correctOption === 'number'
            ? q.correctOption
            : typeof q.correctOptionIndex === 'number'
            ? q.correctOptionIndex
            : 0,
        explanation: q.explanation || '',
        explanationBn: q.explanationBn || null,
        explanationImagePath: q.explanationImagePath || null,
        explanationImageAlt: q.explanationImageAlt || null,
        groupId: mappedGroupId,
        passageText: grp?.passage_text || q.passageText || null,
        passageTitle: grp?.image_alt || q.passageTitle || null,
        passageImagePath: grp?.image_path || q.passageImagePath || null,
        imagePath: q.imagePath || null,
        imageAlt: q.imageAlt || null,
      };
    });

    await supabaseAdmin
      .from('mock_tests')
      .update({
        question_count: enrichedQuestionsForTest.length,
        total_marks: enrichedQuestionsForTest.length > 0 ? enrichedQuestionsForTest.length * marksPerQ : 30,
        questions: enrichedQuestionsForTest,
      })
      .eq('id', testId);

    return NextResponse.json({
      success: true,
      savedQuestionsCount: questions.length,
      savedGroupsCount: questionGroups.length,
      deletedImagesCount: removedPaths.length,
      questions: enrichedQuestionsForTest,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save questions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const adminId = await requireAdmin(request);
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized. Administrator access required.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const testId = searchParams.get('testId');
  if (!testId) {
    return NextResponse.json({ error: 'Missing testId parameter.' }, { status: 400 });
  }

  try {
    const supabaseAdmin = createAdminSupabase();

    // 1. Fetch existing image paths to clean up storage
    const [existingQRes, existingGroupRes] = await Promise.all([
      supabaseAdmin.from('mock_questions').select('id, image_path, options').eq('test_id', testId),
      supabaseAdmin.from('mock_question_groups').select('id, image_path').eq('test_id', testId),
    ]);

    const pathsToDelete = new Set<string>();
    for (const g of existingGroupRes.data || []) {
      if (g.image_path) pathsToDelete.add(g.image_path);
    }
    for (const q of existingQRes.data || []) {
      if (q.image_path) pathsToDelete.add(q.image_path);
      if (Array.isArray(q.options)) {
        for (const opt of q.options) {
          if (typeof opt === 'object' && opt !== null) {
            if (opt.image_path) pathsToDelete.add(opt.image_path);
            if (opt.imagePath) pathsToDelete.add(opt.imagePath);
          }
        }
      }
    }

    if (pathsToDelete.size > 0) {
      await supabaseAdmin.storage.from('mock-question-images').remove(Array.from(pathsToDelete));
    }

    // 2. Delete all questions and question groups from database
    await supabaseAdmin.from('mock_questions').delete().eq('test_id', testId);
    await supabaseAdmin.from('mock_question_groups').delete().eq('test_id', testId);

    // 3. Reset question_count and questions array on mock_tests
    await supabaseAdmin
      .from('mock_tests')
      .update({
        question_count: 0,
        questions: [],
      })
      .eq('id', testId);

    return NextResponse.json({
      success: true,
      message: 'All questions and passages successfully deleted for this test.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete questions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

