import { NextResponse } from 'next/server';
import { createAdminSupabase, requireAdmin } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

export async function DELETE(request: Request) {
  const adminId = await requireAdmin(request);
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `admin_course_${adminId}_${ip}`,
    RATE_LIMIT_RULES.ADMIN_ACTION.limit,
    RATE_LIMIT_RULES.ADMIN_ACTION.windowSeconds
  );
  if (!rateRes.allowed) return createRateLimitResponse(rateRes);

  const url = new URL(request.url);
  let id = url.searchParams.get('id') ?? '';
  if (!id) {
    try {
      const body = await request.json().catch(() => null);
      if (body?.id) id = String(body.id);
    } catch {}
  }

  if (!id) return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });

  const admin = createAdminSupabase();

  const { error: delErr } = await admin.from('courses').delete().eq('id', id);
  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, id });
}

export async function POST(request: Request) {
  const adminId = await requireAdmin(request);
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `admin_upsert_course_${adminId}_${ip}`,
    RATE_LIMIT_RULES.ADMIN_ACTION.limit,
    RATE_LIMIT_RULES.ADMIN_ACTION.windowSeconds
  );
  if (!rateRes.allowed) return createRateLimitResponse(rateRes);

  try {
    const course = await request.json().catch(() => null);
    if (!course || !course.name) {
      return NextResponse.json({ error: 'Course title/name is required.' }, { status: 400 });
    }

    const admin = createAdminSupabase();

    let facultyId = course.facultyId || null;
    if (facultyId) {
      const { data: facRecord } = await admin.from('faculty').select('id').eq('id', facultyId).maybeSingle();
      if (!facRecord) {
        facultyId = null;
      }
    }

    const payload = {
      id: course.id || `crs-${Date.now()}`,
      name: course.name,
      mode: course.mode || 'Offline',
      category: course.category || 'Teaching and Recruitment Exams',
      sub_category: course.subCategory || 'General',
      board: course.board || null,
      class_level: course.classLevel || null,
      description: course.description || '',
      syllabus_highlights: Array.isArray(course.syllabusHighlights) ? course.syllabusHighlights : [],
      price: Number(course.price) || 0,
      monthly_fee: course.monthlyFee != null ? Number(course.monthlyFee) : null,
      instalment_available: Boolean(course.instalmentAvailable),
      first_instalment: Number(course.firstInstalment) || 0,
      faculty_id: facultyId,
      faculty_name: course.facultyName || null,
      batch_name: course.batchName || 'Regular Batch',
      batch_size: Number(course.batchSize) || 50,
      seats_available: Number(course.seatsAvailable) ?? 50,
      waiting_list_count: Number(course.waitingListCount) || 0,
      duration: course.duration || '1 Year',
      start_date: course.startDate || new Date().toISOString().slice(0, 10),
      schedule: course.schedule || 'Mon to Fri',
      status: course.status || 'Open for Admission',
      featured: Boolean(course.featured),
      material_delivery: course.materialDelivery || null,
      online_class_link: course.onlineClassLink ? course.onlineClassLink.trim() : null,
      bundled_material_ids: Array.isArray(course.bundledMaterialIds) ? course.bundledMaterialIds : [],
      bundled_test_ids: Array.isArray(course.bundledTestIds) ? course.bundledTestIds : [],
      is_package_bundle: Boolean(course.isPackageBundle),
    };

    const { data, error } = await admin.from('courses').upsert(payload).select().single();

    if (error) {
      console.error('[API /api/admin/courses] upsert error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, course: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error saving course';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const adminId = await requireAdmin(request);
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.id) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    const admin = createAdminSupabase();
    const updatePayload: Record<string, unknown> = {};

    if (body.onlineClassLink !== undefined) {
      updatePayload.online_class_link = body.onlineClassLink ? String(body.onlineClassLink).trim() : null;
    }
    if (body.status !== undefined) updatePayload.status = body.status;
    if (body.batchSize !== undefined) updatePayload.batch_size = Number(body.batchSize);
    if (body.seatsAvailable !== undefined) updatePayload.seats_available = Number(body.seatsAvailable);
    if (body.waitingListCount !== undefined) updatePayload.waiting_list_count = Number(body.waitingListCount);

    const { data, error } = await admin
      .from('courses')
      .update(updatePayload)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, course: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error updating course';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
