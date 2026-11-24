import { NextResponse } from 'next/server';
import { requireAdmin, createAdminSupabase } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

function slugifySeries(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48);
}

function normalizeSeriesName(name: string): string {
  return String(name || '')
    .toLowerCase()
    .replace(/\(\s*new\s*batch\s*\)/gi, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function POST(request: Request) {
  const adminId = await requireAdmin(request);
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized. Administrator access required.' }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `admin_create_series_${adminId}_${ip}`,
    RATE_LIMIT_RULES.ADMIN_ACTION.limit,
    RATE_LIMIT_RULES.ADMIN_ACTION.windowSeconds
  );
  if (!rateRes.allowed) {
    return createRateLimitResponse(rateRes);
  }

  try {
    const body = await request.json();
    const {
      name,
      classRange = 'All Competitive / Target Batch',
      stream = 'General',
      price = 499,
      batchLabel = 'New Batch 2026',
      description = '',
      highlights = [],
      status = 'Open',
      startsOn = 'Enrollment Open Now',
      cloneFromSeriesId,
      subjectNames = [],
      copyExistingTests = false,
    } = body || {};

    const cleanName = String(name || '').trim();
    if (!cleanName || cleanName.length < 3) {
      return NextResponse.json({ error: 'Series title must be at least 3 characters.' }, { status: 400 });
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return NextResponse.json({ error: 'Invalid price value.' }, { status: 400 });
    }

    const validStatus = status === 'Closed' || status === 'Archived' ? status : 'Open';
    const baseSlug = slugifySeries(cleanName) || 'mock-series';
    const uniqueSuffix = Date.now().toString().slice(-6);
    const seriesId = `series-${baseSlug}-${uniqueSuffix}`;
    const slug = `${baseSlug}-${uniqueSuffix}`;

    const cleanHighlights = Array.isArray(highlights)
      ? highlights.map((h: unknown) => String(h || '').trim()).filter(Boolean)
      : [];

    const supabaseAdmin = createAdminSupabase();

    // 0. Strict Duplicate Mock Test Series Check (case-insensitive, ignoring extra spaces & generic "(New Batch)")
    const normalizedIncoming = normalizeSeriesName(cleanName);
    const { data: existingSeriesRows } = await supabaseAdmin.from('mock_series').select('id, name');
    const duplicateSeries = (existingSeriesRows || []).find(
      (s: any) => normalizeSeriesName(s.name) === normalizedIncoming
    );
    if (duplicateSeries) {
      return NextResponse.json(
        {
          error: `Duplicate Mock Test Series: "${duplicateSeries.name}" already exists. Please edit the existing series or enter a distinct series title/batch name (e.g. "Batch 2" or "Dec 2026").`,
        },
        { status: 409 }
      );
    }

    // 1. Insert new mock_series row
    const { data: createdSeries, error: insErr } = await supabaseAdmin
      .from('mock_series')
      .insert({
        id: seriesId,
        slug,
        name: cleanName,
        class_range: String(classRange || 'All Competitive'),
        stream: String(stream || 'General'),
        price: numPrice,
        batch_label: String(batchLabel || 'New Batch 2026'),
        description: String(description || ''),
        highlights: cleanHighlights,
        status: validStatus,
        starts_on: String(startsOn || 'Enrollment Open Now'),
      })
      .select('*')
      .single();

    if (insErr || !createdSeries) {
      return NextResponse.json({ error: insErr?.message || 'Failed to publish mock test series.' }, { status: 500 });
    }

    // 2. Create subjects for the new series (from custom subjectNames or cloned from source series)
    const createdSubjects: any[] = [];
    const subjectIdMap = new Map<string, string>(); // oldSubjectId -> newSubjectId

    let templateSubjects: Array<{ oldId?: string; name: string; sortOrder: number }> = [];
    const customNames: string[] = Array.isArray(subjectNames)
      ? subjectNames.map((s: unknown) => String(s || '').trim()).filter(Boolean)
      : [];

    if (cloneFromSeriesId) {
      const { data: srcSubs } = await supabaseAdmin
        .from('mock_subjects')
        .select('*')
        .eq('series_id', String(cloneFromSeriesId))
        .order('sort_order', { ascending: true });

      if (srcSubs && srcSubs.length > 0 && customNames.length === 0) {
        templateSubjects = srcSubs.map((s: any, idx: number) => ({
          oldId: s.id,
          name: s.name,
          sortOrder: Number(s.sort_order ?? idx + 1),
        }));
      } else if (srcSubs && srcSubs.length > 0 && customNames.length > 0) {
        templateSubjects = customNames.map((nm, idx) => {
          const matchedOld = srcSubs.find((os: any) => os.name.toLowerCase() === nm.toLowerCase());
          return { oldId: matchedOld?.id, name: nm, sortOrder: idx + 1 };
        });
      }
    }

    if (templateSubjects.length === 0 && customNames.length > 0) {
      templateSubjects = customNames.map((nm, idx) => ({ name: nm, sortOrder: idx + 1 }));
    }

    if (templateSubjects.length > 0) {
      const subRows = templateSubjects.map((sub, idx) => {
        const newSubId = `sub-${baseSlug.slice(0, 20)}-${uniqueSuffix}-${idx + 1}`;
        if (sub.oldId) subjectIdMap.set(sub.oldId, newSubId);
        return {
          id: newSubId,
          series_id: seriesId,
          name: sub.name,
          sort_order: sub.sortOrder,
        };
      });
      const { data: insSubs } = await supabaseAdmin.from('mock_subjects').insert(subRows).select('*');
      if (insSubs) createdSubjects.push(...insSubs);
    }

    // 3. Optionally copy existing mock_tests (+ questions & keys) into the new series
    let copiedTestsCount = 0;
    if (cloneFromSeriesId && copyExistingTests) {
      const { data: srcTests } = await supabaseAdmin
        .from('mock_tests')
        .select('*')
        .eq('series_id', String(cloneFromSeriesId))
        .order('test_no', { ascending: true });

      for (let tIdx = 0; tIdx < (srcTests || []).length; tIdx++) {
        const st = srcTests![tIdx];
        const newTestId = `mock-${Date.now()}-${tIdx}`;
        const mappedSubjId = st.subject_id ? subjectIdMap.get(st.subject_id) || null : null;

        const { data: srcQs } = await supabaseAdmin
          .from('mock_questions')
          .select('*, mock_question_keys(*)')
          .eq('test_id', st.id)
          .order('position', { ascending: true });

        const oldToNewQId = new Map<string, string>();
        const clonedJsonQs = Array.isArray(st.questions)
          ? st.questions.map((jq: any, qIdx: number) => {
              const nId = `q-${newTestId}-${qIdx + 1}`;
              if (jq?.id) oldToNewQId.set(jq.id, nId);
              return { ...jq, id: nId };
            })
          : [];

        const { error: copyTestErr } = await supabaseAdmin.from('mock_tests').insert({
          id: newTestId,
          title: st.title,
          subject: st.subject,
          drive_link: st.drive_link,
          course_id: st.course_id,
          series_id: seriesId,
          subject_id: mappedSubjId,
          test_type: st.test_type,
          test_no: st.test_no,
          question_count: st.question_count,
          batch_name: String(batchLabel || st.batch_name || ''),
          duration_minutes: st.duration_minutes,
          total_marks: st.total_marks,
          marks_per_question: st.marks_per_question,
          negative_marking: st.negative_marking,
          scheduled_date: st.scheduled_date || '',
          status: st.status || 'Draft',
          attempts_allowed: st.attempts_allowed || 1,
          questions: clonedJsonQs,
        });

        if (!copyTestErr) {
          copiedTestsCount++;
          if (srcQs && srcQs.length > 0) {
            const newQRows = srcQs.map((sq: any, qIdx: number) => ({
              id: oldToNewQId.get(sq.id) || `q-${newTestId}-${qIdx + 1}`,
              test_id: newTestId,
              position: sq.position || qIdx + 1,
              question_text: sq.question_text,
              options: sq.options,
              question_text_bn: sq.question_text_bn,
              options_bn: sq.options_bn,
              image_path: sq.image_path,
              image_alt: sq.image_alt,
            }));
            await supabaseAdmin.from('mock_questions').insert(newQRows);

            const newKeyRows = srcQs.map((sq: any, qIdx: number) => {
              const relKey = Array.isArray(sq.mock_question_keys)
                ? sq.mock_question_keys[0]
                : sq.mock_question_keys;
              return {
                question_id: newQRows[qIdx].id,
                correct_option: relKey?.correct_option ?? 0,
                explanation: relKey?.explanation || '',
                explanation_bn: relKey?.explanation_bn || null,
                explanation_image_path: relKey?.explanation_image_path || null,
                explanation_image_alt: relKey?.explanation_image_alt || null,
              };
            });
            await supabaseAdmin.from('mock_question_keys').insert(newKeyRows);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      series: createdSeries,
      subjects: createdSubjects,
      copiedTestsCount,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create mock test series';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const adminId = await requireAdmin(request);
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized. Administrator access required.' }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `admin_series_${adminId}_${ip}`,
    RATE_LIMIT_RULES.ADMIN_ACTION.limit,
    RATE_LIMIT_RULES.ADMIN_ACTION.windowSeconds
  );
  if (!rateRes.allowed) {
    return createRateLimitResponse(rateRes);
  }

  try {
    const body = await request.json();
    const {
      id,
      price,
      startsOn,
      status,
      name,
      description,
      batchLabel,
      classRange,
      stream,
      highlights,
      subjectNames,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing series id.' }, { status: 400 });
    }

    const supabaseAdmin = createAdminSupabase();

    const updateData: Record<string, any> = {};
    if (price !== undefined) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) {
        return NextResponse.json({ error: 'Invalid price value.' }, { status: 400 });
      }
      updateData.price = numPrice;
    }
    if (startsOn !== undefined) updateData.starts_on = String(startsOn).trim();
    if (status !== undefined) updateData.status = status;
    if (name !== undefined) {
      const cleanName = String(name).trim();
      if (cleanName.length < 3) {
        return NextResponse.json({ error: 'Series title must be at least 3 characters.' }, { status: 400 });
      }
      const normName = normalizeSeriesName(cleanName);
      const { data: otherSeries } = await supabaseAdmin
        .from('mock_series')
        .select('id, name')
        .neq('id', id);
      const conflict = (otherSeries || []).find((s: any) => normalizeSeriesName(s.name) === normName);
      if (conflict) {
        return NextResponse.json(
          {
            error: `Duplicate Mock Test Series: "${conflict.name}" already exists. Please use a distinct series title/batch name.`,
          },
          { status: 409 }
        );
      }
      updateData.name = cleanName;
    }
    if (description !== undefined) updateData.description = String(description).trim();
    if (batchLabel !== undefined) updateData.batch_label = String(batchLabel).trim();
    if (classRange !== undefined) updateData.class_range = String(classRange).trim();
    if (stream !== undefined) updateData.stream = String(stream).trim();
    if (Array.isArray(highlights)) {
      updateData.highlights = highlights.map((h: unknown) => String(h || '').trim()).filter(Boolean);
    }

    if (Object.keys(updateData).length === 0 && !Array.isArray(subjectNames)) {
      return NextResponse.json({ error: 'No fields provided for update.' }, { status: 400 });
    }

    let updatedSeriesData: any = null;
    if (Object.keys(updateData).length > 0) {
      const { data, error } = await supabaseAdmin
        .from('mock_series')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      updatedSeriesData = data;
    } else {
      const { data } = await supabaseAdmin.from('mock_series').select('*').eq('id', id).maybeSingle();
      updatedSeriesData = data;
    }

    // Sync mock_subjects cleanly if subjectNames array was provided
    let updatedSubjects: any[] | undefined = undefined;
    if (Array.isArray(subjectNames)) {
      const cleanSubNames = Array.from(
        new Set(subjectNames.map((s: unknown) => String(s || '').trim()).filter(Boolean))
      );
      const { data: existingSubs } = await supabaseAdmin
        .from('mock_subjects')
        .select('*')
        .eq('series_id', id)
        .order('sort_order', { ascending: true });

      const existingByLower = new Map<string, any>();
      for (const es of existingSubs || []) {
        existingByLower.set(String(es.name || '').trim().toLowerCase(), es);
      }

      const keepIds = new Set<string>();
      const toInsert: any[] = [];
      const baseSlug = slugifySeries(updatedSeriesData?.name || id).slice(0, 20) || 'series';
      const stamp = Date.now().toString().slice(-6);

      for (let i = 0; i < cleanSubNames.length; i++) {
        const nm = cleanSubNames[i];
        const found = existingByLower.get(nm.toLowerCase());
        if (found) {
          keepIds.add(found.id);
          if (found.name !== nm || found.sort_order !== i + 1) {
            await supabaseAdmin
              .from('mock_subjects')
              .update({ name: nm, sort_order: i + 1 })
              .eq('id', found.id);
          }
        } else {
          toInsert.push({
            id: `sub-${baseSlug}-${stamp}-${i + 1}`,
            series_id: id,
            name: nm,
            sort_order: i + 1,
          });
        }
      }

      const toDeleteIds = (existingSubs || [])
        .filter((es: any) => !keepIds.has(es.id))
        .map((es: any) => es.id);
      if (toDeleteIds.length > 0) {
        await supabaseAdmin.from('mock_subjects').delete().in('id', toDeleteIds);
      }
      if (toInsert.length > 0) {
        await supabaseAdmin.from('mock_subjects').insert(toInsert);
      }

      const { data: refreshedSubs } = await supabaseAdmin
        .from('mock_subjects')
        .select('*')
        .eq('series_id', id)
        .order('sort_order', { ascending: true });
      updatedSubjects = refreshedSubs || [];
    }

    return NextResponse.json({
      success: true,
      series: updatedSeriesData,
      subjects: updatedSubjects,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update mock test series';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const adminId = await requireAdmin(request);
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized. Administrator access required.' }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `admin_delete_series_${adminId}_${ip}`,
    RATE_LIMIT_RULES.ADMIN_ACTION.limit,
    RATE_LIMIT_RULES.ADMIN_ACTION.windowSeconds
  );
  if (!rateRes.allowed) {
    return createRateLimitResponse(rateRes);
  }

  const seriesId = new URL(request.url).searchParams.get('id')?.trim() ?? '';
  if (!seriesId) {
    return NextResponse.json({ error: 'Mock Test Series ID is required.' }, { status: 400 });
  }

  try {
    const supabaseAdmin = createAdminSupabase();

    const { data: seriesRow } = await supabaseAdmin
      .from('mock_series')
      .select('id, name')
      .eq('id', seriesId)
      .maybeSingle();

    // 1. Collect all mock tests in this series to clean up storage assets and attempts
    const { data: seriesTests } = await supabaseAdmin
      .from('mock_tests')
      .select('id')
      .eq('series_id', seriesId);
    const testIds = (seriesTests || []).map((t: any) => t.id);

    if (testIds.length > 0) {
      const [{ data: qs }, { data: groups }] = await Promise.all([
        supabaseAdmin.from('mock_questions').select('image_path, options').in('test_id', testIds),
        supabaseAdmin.from('mock_question_groups').select('image_path').in('test_id', testIds),
      ]);

      const imagesToRemove: string[] = [];
      for (const q of qs || []) {
        if (q.image_path) imagesToRemove.push(q.image_path);
        if (Array.isArray(q.options)) {
          for (const opt of q.options) {
            if (typeof opt === 'object' && opt !== null && (opt as any).imagePath) {
              imagesToRemove.push((opt as any).imagePath);
            }
          }
        }
      }
      for (const g of groups || []) {
        if (g.image_path) imagesToRemove.push(g.image_path);
      }
      if (imagesToRemove.length > 0) {
        await supabaseAdmin.storage.from('mock-question-images').remove(imagesToRemove).catch(() => null);
      }

      await supabaseAdmin.from('mock_attempts').delete().in('test_id', testIds);
      await supabaseAdmin.from('test_attempts').delete().in('test_id', testIds);
      await supabaseAdmin.from('mock_questions').delete().in('test_id', testIds);
      await supabaseAdmin.from('mock_question_groups').delete().in('test_id', testIds);
      await supabaseAdmin.from('mock_launch_log').delete().in('test_id', testIds);
      await supabaseAdmin.from('mock_test_question_stats').delete().in('test_id', testIds);
    }

    // 2. Clean up question paper PDFs from storage and DB
    const { data: papers } = await supabaseAdmin
      .from('mock_question_papers')
      .select('id, file_path')
      .eq('series_id', seriesId);
    const paperPaths = (papers || []).map((p: any) => p.file_path).filter(Boolean);
    if (paperPaths.length > 0) {
      await supabaseAdmin.storage.from('mock-question-papers').remove(paperPaths).catch(() => null);
    }
    await supabaseAdmin.from('mock_question_papers').delete().eq('series_id', seriesId);

    // 3. Remove any reference from courses.bundled_test_ids
    const { data: allCourses } = await supabaseAdmin.from('courses').select('id, bundled_test_ids');
    for (const crs of allCourses || []) {
      const bundled: string[] = Array.isArray(crs.bundled_test_ids) ? crs.bundled_test_ids : [];
      const filtered = bundled.filter((bid) => bid !== seriesId && !testIds.includes(bid));
      if (filtered.length !== bundled.length) {
        await supabaseAdmin
          .from('courses')
          .update({ bundled_test_ids: filtered })
          .eq('id', crs.id);
      }
    }

    // 4. Delete mock_tests, mock_subjects, study_materials (Mock Test PDFs), series_enrollments, legacy enrollments, and mock_series
    await supabaseAdmin.from('study_materials').delete().eq('series_id', seriesId);
    await supabaseAdmin.from('mock_tests').delete().eq('series_id', seriesId);
    await supabaseAdmin.from('mock_subjects').delete().eq('series_id', seriesId);
    await supabaseAdmin.from('series_enrollments').delete().eq('series_id', seriesId);
    await supabaseAdmin.from('enrollments').delete().eq('course_id', seriesId);

    const { error: delSeriesErr } = await supabaseAdmin.from('mock_series').delete().eq('id', seriesId);
    if (delSeriesErr) {
      return NextResponse.json({ error: delSeriesErr.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      deletedSeriesId: seriesId,
      deletedTestsCount: testIds.length,
      message: `Mock test series "${seriesRow?.name || seriesId}" permanently deleted from the database.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete mock test series';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
