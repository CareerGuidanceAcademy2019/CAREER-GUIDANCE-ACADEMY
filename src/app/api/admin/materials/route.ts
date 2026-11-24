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

    // Verify foreign key course_id safely (study_materials.course_id has a NOT NULL FK to courses.id)
    let targetCourseId = mat.courseId || mat.course_id || '';
    if (targetCourseId) {
      const { data: matchedCourse } = await admin
        .from('courses')
        .select('id')
        .eq('id', targetCourseId)
        .maybeSingle();
      if (!matchedCourse) {
        const { data: firstCourse } = await admin.from('courses').select('id').limit(1).maybeSingle();
        targetCourseId = firstCourse?.id || 'crs-tet-1-online';
      }
    } else {
      const { data: firstCourse } = await admin.from('courses').select('id').limit(1).maybeSingle();
      targetCourseId = firstCourse?.id || 'crs-tet-1-online';
    }

    const isMockTestPdf = mat.type === 'Mock Test PDF';
    const isCurrentAffairs =
      !isMockTestPdf && (mat.type === 'Current Affairs' || Boolean(mat.caCategory || mat.ca_category));

    // Resolve and validate series_id when posting a Mock Test PDF
    let targetSeriesId: string | null = null;
    const rawSeriesId = mat.seriesId || mat.series_id || (isMockTestPdf ? mat.courseId : null);
    if (isMockTestPdf && rawSeriesId) {
      const { data: matchedSeries } = await admin
        .from('mock_series')
        .select('id')
        .eq('id', String(rawSeriesId))
        .maybeSingle();
      if (!matchedSeries) {
        return NextResponse.json(
          { error: 'Selected Mock Test Series does not exist in the database.' },
          { status: 400 }
        );
      }
      targetSeriesId = matchedSeries.id;
    }

    const materialId = mat.id || (isMockTestPdf ? `mpdf-${Date.now()}` : `mat-${Date.now()}`);
    const dbType = isMockTestPdf
      ? 'Mock Test PDF'
      : mat.type === 'Book PDF'
        ? 'Book PDF'
        : 'Paid Notes';

    const { error: upsertErr } = await admin.from('study_materials').upsert({
      id: materialId,
      title: mat.title,
      course_id: targetCourseId,
      series_id: targetSeriesId,
      type: dbType,
      ca_category: isCurrentAffairs ? (mat.caCategory || mat.ca_category || 'Domestic') : null,
      drive_link: mat.driveLink || mat.drive_link || null,
      access_scope: isMockTestPdf ? 'enrolled' : (mat.accessScope || mat.access_scope || 'enrolled'),
      subject: mat.subject || 'All Competitive Exams',
      author: mat.author || 'C.G.A Academic Wing, Udaipur',
      pages: Number(mat.pages) || 1,
      file_size: mat.fileSize || mat.file_size || 'PDF (Google Drive)',
      uploaded_date: mat.uploadedDate || mat.uploaded_date || new Date().toISOString().split('T')[0],
      description: mat.description || '',
      preview_sections: mat.previewSections || mat.preview_sections || [],
      price: isMockTestPdf ? 0 : (mat.price !== undefined && mat.price !== null ? Number(mat.price) : 0),
    });

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, id: materialId, seriesId: targetSeriesId });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to save material.' }, { status: 500 });
  }
}
