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
      // 2. Fetch questions, answer keys, and passage groups from tables
      const [{ data: dbQs }, { data: dbGroups }] = await Promise.all([
        supabaseAdmin.from('mock_questions').select('*').eq('test_id', testId).order('position', { ascending: true }),
        supabaseAdmin.from('mock_question_groups').select('*').eq('test_id', testId).order('position', { ascending: true }),
      ]);

      const qIds = (dbQs || []).map((q: any) => q.id);
      const keyMap = new Map<string, any>();
      if (qIds.length > 0) {
        const { data: keysData } = await supabaseAdmin
          .from('mock_question_keys')
          .select('*')
          .in('question_id', qIds);
        for (const k of keysData || []) {
          keyMap.set(k.question_id, k);
        }
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

      if (Array.isArray((testRow as any).questionGroups)) {
        for (const g of (testRow as any).questionGroups) {
          if (g && g.id && !groupMap.has(g.id)) {
            groupMap.set(g.id, {
              id: g.id,
              testId: g.testId || testId,
              position: g.position || groupMap.size + 1,
              passageText: g.passageText || g.passage_text || '',
              passage_text: g.passageText || g.passage_text || '',
              imagePath: g.imagePath || g.image_path || null,
              image_path: g.imagePath || g.image_path || null,
              imageAlt: g.imageAlt || g.image_alt || null,
              image_alt: g.imageAlt || g.image_alt || null,
            });
          }
        }
      }

      const rawQs = Array.isArray(testRow.questions) ? testRow.questions : [];
      for (const rq of rawQs) {
        if (rq && rq.groupId && rq.passageText && !groupMap.has(rq.groupId)) {
          groupMap.set(rq.groupId, {
            id: rq.groupId,
            testId,
            position: groupMap.size + 1,
            passageText: rq.passageText,
            passage_text: rq.passageText,
            imagePath: rq.passageImagePath || null,
            image_path: rq.passageImagePath || null,
            imageAlt: rq.passageTitle || 'Comprehension Passage',
            image_alt: rq.passageTitle || 'Comprehension Passage',
          });
        }
      }

      const mappedGroups = Array.from(groupMap.values());

      // Combine dbQs and rawQs so neither passage questions nor newly loaded modal questions are ever missing
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
          const corr = k?.correct_option ?? q.correct_option ?? 0;
          finalQs.push({
            id: q.id,
            position: finalQs.length + 1,
            questionText: qText,
            question: qText,
            options: q.options || [],
            questionTextBn: q.question_text_bn || null,
            questionBn: q.question_text_bn || null,
            optionsBn: q.options_bn || null,
            correctOption: corr,
            correctOptionIndex: corr,
            explanation: k?.explanation || q.explanation || '',
            explanationBn: k?.explanation_bn || q.explanation_bn || null,
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

      for (let idx = 0; idx < rawQs.length; idx++) {
        const q = rawQs[idx];
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
    }

    // Fallback RPC if direct table fetch did not find the test
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('get_admin_preview_test', {
      p_test_id: testId,
    });

    if (!rpcError && rpcData) {
      const qGroups = (rpcData.questionGroups || []).map((g: any) => ({
        ...g,
        passageText: g.passageText || g.passage_text || '',
        passage_text: g.passageText || g.passage_text || '',
        imagePath: g.imagePath || g.image_path || null,
        image_path: g.imagePath || g.image_path || null,
        imageAlt: g.imageAlt || g.image_alt || null,
        image_alt: g.imageAlt || g.image_alt || null,
      }));
      return NextResponse.json({ success: true, ...rpcData, questionGroups: qGroups });
    }

    return NextResponse.json({ error: 'Mock test not found' }, { status: 404 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load preview data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
