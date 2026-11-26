import { NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase, requireActiveSession } from '@/lib/supabase/server';
import { watermarkPdf } from '@/lib/pdfWatermark';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ paperId: string }> }
) {
  try {
    const { paperId } = await params;
    if (!paperId) {
      return NextResponse.json({ error: 'Missing paperId' }, { status: 400 });
    }

    const active = await requireActiveSession();
    if (!active) {
      return NextResponse.json({ error: 'Unauthorized or session revoked on another device.' }, { status: 401 });
    }
    const { user, supabase } = active;

    const ip = getClientIp(request);
    const rateRes = await checkRateLimit(
      `paper_${user.id}_${ip}`,
      RATE_LIMIT_RULES.GENERAL_API.limit,
      RATE_LIMIT_RULES.GENERAL_API.windowSeconds
    );
    if (!rateRes.allowed) {
      return createRateLimitResponse(rateRes);
    }

    const supabaseAdmin = createAdminSupabase();

    // 1. Fetch user profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, name, student_code, role')
      .eq('id', user.id)
      .single();

    const isAdmin =
      profile?.role === 'admin' ||
      profile?.role === 'ADMIN' ||
      user.email === 'angatsaha825@gmail.com' ||
      user.email === 'careerguidanceacademy2019@gmail.com';

    // 2. Fetch paper record
    const { data: paper, error: paperErr } = await supabaseAdmin
      .from('mock_question_papers')
      .select('*')
      .eq('id', paperId)
      .single();

    if (paperErr || !paper) {
      return NextResponse.json({ error: 'Question paper not found.' }, { status: 404 });
    }

    // 3. Verify Publication status & Window
    const now = new Date();
    const nowMs = now.getTime();
    if (!isAdmin) {
      if (paper.status === 'draft' || paper.status === 'unpublished') {
        return NextResponse.json({ error: 'This question paper has not been published yet.' }, { status: 403 });
      }
      if (paper.publish_at && new Date(paper.publish_at) > now) {
        return NextResponse.json(
          { error: `Question paper unlocks on ${new Date(paper.publish_at).toLocaleString('en-IN')}` },
          { status: 403 }
        );
      }
      if (paper.expire_at && new Date(paper.expire_at) < now) {
        return NextResponse.json({ error: 'Access to this question paper has expired.' }, { status: 403 });
      }

      // 4. Verify Enrolment in the specific series, mapped course, course bundle, or verified payment (with expiry check)
      const targetSeriesId = String(paper.series_id || '');
      const allowedKeys = new Set<string>(
        (SERIES_TO_COURSES_MAP[targetSeriesId] || [targetSeriesId]).map((k) => k.toLowerCase())
      );

      const [{ data: seriesEnrs }, { data: courseEnrs }, { data: verifiedPayments }] = await Promise.all([
        supabaseAdmin.from('series_enrollments').select('series_id, access_valid_until').eq('student_id', user.id),
        supabaseAdmin.from('enrollments').select('course_id, access_valid_until').eq('student_id', user.id),
        supabaseAdmin
          .from('fee_payments')
          .select('item_id, course_id, status')
          .eq('student_id', user.id)
          .in('status', ['Verified', 'Paid', 'Approved']),
      ]);

      let isEnrolled = false;
      const activeCourseIds = new Set<string>();

      for (const se of seriesEnrs || []) {
        if (!se.access_valid_until || new Date(se.access_valid_until).getTime() >= nowMs) {
          if (se.series_id && allowedKeys.has(se.series_id.toLowerCase())) {
            isEnrolled = true;
            break;
          }
        }
      }

      if (!isEnrolled) {
        for (const ce of courseEnrs || []) {
          if (!ce.access_valid_until || new Date(ce.access_valid_until).getTime() >= nowMs) {
            if (ce.course_id) {
              activeCourseIds.add(ce.course_id);
              if (allowedKeys.has(ce.course_id.toLowerCase())) {
                isEnrolled = true;
                break;
              }
            }
          }
        }
      }

      if (!isEnrolled) {
        for (const vp of verifiedPayments || []) {
          const itemKey = (vp.item_id || '').toLowerCase();
          const courseKey = (vp.course_id || '').toLowerCase();
          if (vp.course_id) activeCourseIds.add(vp.course_id);
          if (vp.item_id) activeCourseIds.add(vp.item_id);
          if ((itemKey && allowedKeys.has(itemKey)) || (courseKey && allowedKeys.has(courseKey))) {
            isEnrolled = true;
            break;
          }
        }
      }

      if (!isEnrolled && activeCourseIds.size > 0) {
        const { data: bundledCourses } = await supabaseAdmin
          .from('courses')
          .select('id, bundled_test_ids')
          .in('id', Array.from(activeCourseIds));
        for (const bc of bundledCourses || []) {
          const bTests: string[] = Array.isArray(bc.bundled_test_ids) ? bc.bundled_test_ids : [];
          if (
            bTests.includes(targetSeriesId) ||
            (paper.test_id && bTests.includes(paper.test_id)) ||
            bTests.some((s) => allowedKeys.has(String(s).toLowerCase()))
          ) {
            isEnrolled = true;
            break;
          }
        }
      }

      if (!isEnrolled) {
        return NextResponse.json(
          { error: 'Forbidden: You are not enrolled in the series or course containing this question paper.' },
          { status: 403 }
        );
      }
    }

    // 5. Download original PDF from private bucket 'mock-question-papers'
    const { data: fileData, error: downloadErr } = await supabaseAdmin.storage
      .from('mock-question-papers')
      .download(paper.file_path);

    if (downloadErr || !fileData) {
      return NextResponse.json({ error: 'Failed to retrieve question paper file from storage.' }, { status: 500 });
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    // 6. Stamp dynamic student watermark
    const studentName = profile?.name || 'Enrolled Student';
    const studentCode = profile?.student_code || user.id.slice(0, 8).toUpperCase();
    const watermarkedBytes = await watermarkPdf(pdfBuffer, {
      studentName,
      studentCode,
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    });

    // Check if client requested download and if download is allowed
    const { searchParams } = new URL(request.url);
    const forceDownload = searchParams.get('download') === 'true';
    const disposition = forceDownload && paper.allow_download ? 'attachment' : 'inline';

    const safeTitle = (paper.title || 'Question_Paper').replace(/[^a-zA-Z0-9_-]/g, '_');

    return new Response(watermarkedBytes as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${safeTitle}.pdf"`,
        'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error streaming paper';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
