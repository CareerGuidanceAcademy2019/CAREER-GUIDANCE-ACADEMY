import { NextResponse } from 'next/server';
import { createAdminSupabase, requireAdmin } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

export async function DELETE(request: Request) {
  const adminId = await requireAdmin(request);
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `admin_mat_${adminId}_${ip}`,
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

  if (!id) return NextResponse.json({ error: 'Study Material ID is required' }, { status: 400 });

  const admin = createAdminSupabase();

  // 1. Delete any access records referencing this material
  await admin.from('material_access').delete().eq('material_id', id);

  // 2. Delete the study material record
  const { error: delErr } = await admin.from('study_materials').delete().eq('id', id);
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
    `admin_upsert_mat_${adminId}_${ip}`,
    RATE_LIMIT_RULES.ADMIN_ACTION.limit,
    RATE_LIMIT_RULES.ADMIN_ACTION.windowSeconds
  );
  if (!rateRes.allowed) return createRateLimitResponse(rateRes);

  try {
    const mat = await request.json().catch(() => null);
    if (!mat || !mat.title) {
      return NextResponse.json({ error: 'Material title is required.' }, { status: 400 });
    }

    const admin = createAdminSupabase();

    // Verify foreign key course_id safely
    let targetCourseId = mat.courseId || mat.course_id || '';
    if (targetCourseId) {
      const { data: matchedCourse } = await admin
        .from('courses')
        .select('id')
        .eq('id', targetCourseId)
        .maybeSingle();
      if (!matchedCourse) {
        // Fallback to first available course in DB if matched course is missing or legacy ID
        const { data: firstCourse } = await admin.from('courses').select('id').limit(1).maybeSingle();
        targetCourseId = firstCourse?.id || targetCourseId;
      }
    } else {
      const { data: firstCourse } = await admin.from('courses').select('id').limit(1).maybeSingle();
      targetCourseId = firstCourse?.id || 'crs-tet-1-online';
    }

    const materialId = mat.id || `mat-${Date.now()}`;

    const { error: upsertErr } = await admin.from('study_materials').upsert({
      id: materialId,
      title: mat.title,
      course_id: targetCourseId,
      type: mat.type || 'Paid Notes',
      author: mat.author || 'C.G.A Academic Wing, Udaipur',
      pages: Number(mat.pages) || 1,
      file_size: mat.fileSize || mat.file_size || '1.0 MB',
      uploaded_date: mat.uploadedDate || mat.uploaded_date || new Date().toISOString().split('T')[0],
      description: mat.description || '',
      preview_sections: mat.previewSections || mat.preview_sections || [],
      price: Number(mat.price) || 199,
    });

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, id: materialId });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to save material.' }, { status: 500 });
  }
}

