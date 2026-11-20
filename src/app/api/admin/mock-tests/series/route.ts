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
    const { id, price, startsOn, status, name, description, batchLabel, classRange, stream, highlights } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing series id.' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (price !== undefined) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) {
        return NextResponse.json({ error: 'Invalid price value.' }, { status: 400 });
      }
      updateData.price = numPrice;
    }
    if (startsOn !== undefined) updateData.starts_on = startsOn;
    if (status !== undefined) updateData.status = status;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (batchLabel !== undefined) updateData.batch_label = batchLabel;
    if (classRange !== undefined) updateData.class_range = classRange;
    if (stream !== undefined) updateData.stream = stream;
    if (Array.isArray(highlights)) updateData.highlights = highlights;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields provided for update.' }, { status: 400 });
    }

    const supabaseAdmin = createAdminSupabase();
    const { data, error } = await supabaseAdmin
      .from('mock_series')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, series: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update mock test series';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
