import { NextResponse } from 'next/server';
import { createAdminSupabase, requireActiveSession } from '@/lib/supabase/server';

const SERIES_TO_COURSES_MAP: Record<string, string[]> = {
  'series-ttet-paper1': ['crs-tet-1-online', 'crs-tet-1-offline', 'crs-tet-1', 'series-ttet-paper1'],
  'series-ttet-paper2-sci': ['crs-tet-2-sci-online', 'crs-tet-2-sci-offline', 'crs-tet-2-sci', 'series-ttet-paper2-sci'],
  'series-ttet-paper2-soc': [
    'crs-tet-2-sst-online',
    'crs-tet-2-sst-offline',
    'crs-tet-2-arts-online',
    'crs-tet-2-arts-offline',
    'crs-tet-2-arts',
    'crs-tet-2-soc',
    'crs-tet-2-sst',
    'series-ttet-paper2-soc',
  ],
  'series-stgt-soc': ['crs-stgt-sst-online', 'crs-stgt-sst-offline', 'crs-stgt-sst', 'series-stgt-soc'],
  'series-stgt-pure-sci': ['crs-stgt-pure-sci-online', 'crs-stgt-pure-sci-offline', 'crs-stgt-pure-sci', 'series-stgt-pure-sci'],
  'series-stgt-bio-sci': ['crs-stgt-bio-sci-online', 'crs-stgt-bio-sci-offline', 'crs-stgt-bio-sci', 'series-stgt-bio-sci'],
  'series-tpsc-combined': [
    'crs-tpsc-combined-online',
    'crs-tpsc-combined-offline',
    'crs-tpsc-combined',
    'crs-jrbt-online',
    'crs-jrbt-offline',
    'crs-jrbt',
    'series-tpsc-combined',
  ],
  'series-tcs-tps': ['crs-tcs-tps-online', 'crs-tcs-tps-offline', 'crs-tcs-tps', 'series-tcs-tps'],
  'series-banking-ssc': ['crs-banking-online', 'crs-banking-offline', 'crs-banking', 'series-banking-ssc'],
  'series-school-foundation': ['crs-school-7', 'crs-school-8', 'crs-school-9', 'crs-school-10', 'series-school-foundation'],
};

/**
 * Server-side Study Materials endpoint (/api/materials/list)
 *
 * Ensures locked Google Drive PDF links (`drive_link`) are NEVER sent over the network
 * to un-enrolled or unpaid students. Only materials unlocked via verified server enrollments,
 * verified fee payments, or free access scope include their `drive_link`.
 */
export async function GET(request: Request) {
  try {
    const active = await requireActiveSession(request);
    if (!active) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const { user, role } = active;
    const admin = createAdminSupabase();

    const isAdminOrFaculty =
      role === 'admin' ||
      role === 'ADMIN' ||
      role === 'faculty' ||
      role === 'FACULTY' ||
      user.email === 'angatsaha825@gmail.com' ||
      user.email === 'careerguidanceacademy2019@gmail.com';

    const { data: materials, error } = await admin
      .from('study_materials')
      .select('*')
      .order('uploaded_date', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (isAdminOrFaculty) {
      return NextResponse.json({ success: true, materials: materials || [] });
    }

    // Fetch student's active server-verified enrollments, series enrollments, verified payments, and material_access
    const [
      { data: courseEnrs },
      { data: seriesEnrs },
      { data: verifiedPayments },
      { data: matAccess },
      { data: coursesData },
    ] = await Promise.all([
      admin.from('enrollments').select('course_id, access_valid_until').eq('student_id', user.id),
      admin.from('series_enrollments').select('series_id, access_valid_until').eq('student_id', user.id),
      admin
        .from('fee_payments')
        .select('course_id, item_id, remarks, status')
        .eq('student_id', user.id)
        .in('status', ['Verified', 'Paid', 'Approved']),
      admin.from('material_access').select('material_id').eq('student_id', user.id),
      admin.from('courses').select('id, bundled_material_ids, bundled_test_ids'),
    ]);

    const now = Date.now();
    const activeCourseIds = new Set<string>();
    const activeSeriesIds = new Set<string>();
    const unlockedMatIds = new Set<string>();

    for (const ma of matAccess || []) {
      if (ma.material_id) unlockedMatIds.add(ma.material_id);
    }

    for (const ce of courseEnrs || []) {
      if (!ce.access_valid_until || new Date(ce.access_valid_until).getTime() >= now) {
        if (ce.course_id) activeCourseIds.add(ce.course_id);
      }
    }

    for (const se of seriesEnrs || []) {
      if (!se.access_valid_until || new Date(se.access_valid_until).getTime() >= now) {
        if (se.series_id) activeSeriesIds.add(se.series_id);
      }
    }

    for (const vp of verifiedPayments || []) {
      const cId = vp.course_id || vp.item_id;
      if (cId) {
        if (String(cId).startsWith('series-')) activeSeriesIds.add(cId);
        else if (String(cId).startsWith('mat-') || String(cId).startsWith('mpdf-')) unlockedMatIds.add(cId);
        else activeCourseIds.add(cId);
      }
      if (vp.item_id) {
        unlockedMatIds.add(vp.item_id);
        if (String(vp.item_id).startsWith('series-')) activeSeriesIds.add(vp.item_id);
      }
    }

    // Expand bundled materials and bundled series from active courses
    for (const crs of coursesData || []) {
      if (activeCourseIds.has(crs.id)) {
        if (Array.isArray(crs.bundled_material_ids)) {
          crs.bundled_material_ids.forEach((id: string) => unlockedMatIds.add(id));
        }
        if (Array.isArray(crs.bundled_test_ids)) {
          crs.bundled_test_ids.forEach((id: string) => activeSeriesIds.add(id));
        }
      }
    }

    // Also map active courses to their corresponding mock series
    for (const [seriesKey, mappedCourses] of Object.entries(SERIES_TO_COURSES_MAP)) {
      if (mappedCourses.some((cid) => activeCourseIds.has(cid))) {
        activeSeriesIds.add(seriesKey);
      }
    }

    const hasActiveCaSubscription =
      activeSeriesIds.has('series-current-affairs') || activeCourseIds.has('series-current-affairs');

    const sanitizedMaterials = (materials || []).map((m: any) => {
      const isMockTestPdf = m.type === 'Mock Test PDF' || Boolean(m.series_id);
      const isCurrentAffairs =
        !isMockTestPdf && (m.type === 'Current Affairs' || Boolean(m.ca_category));
      const isFree = !isMockTestPdf && !isCurrentAffairs && (Number(m.price) === 0 || m.access_scope === 'all_logged_in');

      let isUnlocked = false;
      if (isMockTestPdf) {
        const targetSeries = m.series_id || m.course_id;
        isUnlocked = Boolean(targetSeries && activeSeriesIds.has(targetSeries));
      } else if (isCurrentAffairs) {
        isUnlocked = hasActiveCaSubscription;
      } else {
        isUnlocked =
          isFree ||
          unlockedMatIds.has(m.id) ||
          Boolean(m.course_id && activeCourseIds.has(m.course_id)) ||
          (verifiedPayments || []).some(
            (vp: any) =>
              vp.item_id === m.id ||
              vp.course_id === m.id ||
              (vp.remarks && String(vp.remarks).includes(m.id))
          );
      }

      if (isUnlocked) {
        return m;
      }

      // Strip drive_link and preview_sections from locked materials before sending to client
      return {
        ...m,
        drive_link: null,
        driveLink: undefined,
        preview_sections: [],
      };
    });

    return NextResponse.json({
      success: true,
      materials: sanitizedMaterials,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load study materials';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
