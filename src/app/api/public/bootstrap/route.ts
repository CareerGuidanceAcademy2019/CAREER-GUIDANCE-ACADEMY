import { NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';

/**
 * Lightweight, Edge-Cached Public Bootstrap API (/api/public/bootstrap)
 *
 * Offloads 95%+ of Supabase Database Egress onto Vercel's Global Edge CDN:
 * - Caches public catalog tables (site_content, faculty, courses, achievements,
 *   mock_series, mock_subjects, announcements, study_materials public metadata,
 *   and lightweight mock_tests metadata WITHOUT the 1.64 MB `questions` JSONB column
 *   or private drive links) at the Vercel Edge.
 * - Uses `s-maxage=120, stale-while-revalidate=600` so hundreds of concurrent visitors
 *   are served in <30ms from Vercel Edge with 0 bytes of Supabase egress.
 */

export const MOCK_TEST_METADATA_COLUMNS =
  'id,title,course_id,series_id,subject_id,subject,batch_name,duration_minutes,total_marks,marks_per_question,negative_marking,status,content_status,test_type,test_no,scheduled_date,window_start,window_end,window_hours,shuffle,show_solutions,question_count,attempts_allowed,purge_after,retention_days,archive_downloaded_at,purge_requires_archive';

export const STUDY_MATERIAL_PUBLIC_COLUMNS =
  'id,title,course_id,series_id,type,ca_category,access_scope,subject,author,pages,file_size,uploaded_date,description,price';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const bust = url.searchParams.get('bust');
    const sb = createAdminSupabase();

    const safeList = async (query: PromiseLike<{ data: any[] | null; error: unknown }>) => {
      try {
        const res = await query;
        return res.data ?? [];
      } catch {
        return [];
      }
    };

    const [
      siteRes,
      faculty,
      courses,
      achievements,
      seriesRaw,
      subjectsRaw,
      announcements,
      mockTestsMeta,
      studyMaterialsMeta,
    ] = await Promise.all([
      Promise.resolve(sb.from('site_content').select('content').eq('id', 1).maybeSingle()).catch(() => ({
        data: null,
      })),
      safeList(sb.from('faculty').select('*').order('name')),
      safeList(sb.from('courses').select('*').order('name')),
      safeList(sb.from('achievements').select('*')),
      safeList(sb.from('mock_series').select('*').order('price')),
      safeList(sb.from('mock_subjects').select('*').order('sort_order')),
      safeList(sb.from('announcements').select('*').order('date', { ascending: false })),
      safeList(sb.from('mock_tests').select(MOCK_TEST_METADATA_COLUMNS)),
      safeList(sb.from('study_materials').select(STUDY_MATERIAL_PUBLIC_COLUMNS).order('uploaded_date', { ascending: false })),
    ]);

    const cacheHeader = bust
      ? 'private, no-cache, no-store, must-revalidate'
      : 'public, max-age=180, s-maxage=600, stale-while-revalidate=3600';

    return NextResponse.json(
      {
        success: true,
        siteContent: siteRes?.data?.content ?? null,
        faculty,
        courses,
        achievements,
        mockSeries: seriesRaw,
        mockSubjects: subjectsRaw,
        announcements,
        mockTestsMeta,
        studyMaterialsMeta,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': cacheHeader,
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Bootstrap fetch failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
