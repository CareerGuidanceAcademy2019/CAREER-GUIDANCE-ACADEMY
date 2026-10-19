import { NextResponse } from 'next/server';
import { requireAdmin, createAdminSupabase } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

export async function GET(request: Request) {
  const adminId = await requireAdmin();
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
    const { data, error } = await supabaseAdmin.rpc('get_admin_preview_test', {
      p_test_id: testId,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch test questions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const adminId = await requireAdmin();
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
    if (questionGroups.length > 0) {
      const groupRows = questionGroups.map((g: any, idx: number) => {
        const generatedId = g.id && !g.id.startsWith('temp-') ? g.id : `grp-${Date.now()}-${idx}`;
        if (g.id) groupInsertMap.set(g.id, generatedId);
        return {
          id: generatedId,
          test_id: testId,
          position: idx + 1,
          passage_text: g.passageText || null,
          image_path: g.imagePath || null,
          image_alt: g.imageAlt || null,
        };
      });

      const { error: groupErr } = await supabaseAdmin.from('mock_question_groups').insert(groupRows);
      if (groupErr) {
        throw new Error(`Failed to save question groups: ${groupErr.message}`);
      }
    }

    // 5. Insert questions and their answer keys
    if (questions.length > 0) {
      const qRows = questions.map((q: any, idx: number) => {
        const qId = q.id && !q.id.startsWith('temp-') ? q.id : `q-${Date.now()}-${idx}`;
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

    // 6. Update question_count on mock_tests
    await supabaseAdmin
      .from('mock_tests')
      .update({
        question_count: questions.length,
      })
      .eq('id', testId);

    return NextResponse.json({
      success: true,
      savedQuestionsCount: questions.length,
      savedGroupsCount: questionGroups.length,
      deletedImagesCount: removedPaths.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save questions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
