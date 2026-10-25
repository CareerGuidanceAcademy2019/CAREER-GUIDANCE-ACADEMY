import { NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase, requireActiveSession } from '@/lib/supabase/server';
import { watermarkPdf } from '@/lib/pdfWatermark';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

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

    const isAdmin = profile?.role === 'admin';

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

      // 4. Verify Enrolment in the specific series
      const [seriesEnrolRes, courseEnrolRes] = await Promise.all([
        supabaseAdmin
          .from('series_enrollments')
          .select('id')
          .eq('student_id', user.id)
          .eq('series_id', paper.series_id)
          .maybeSingle(),
        supabaseAdmin
          .from('enrollments')
          .select('id')
          .eq('student_id', user.id)
          .eq('course_id', paper.series_id)
          .maybeSingle(),
      ]);

      const isEnrolled = Boolean(seriesEnrolRes.data || courseEnrolRes.data);
      if (!isEnrolled) {
        return NextResponse.json(
          { error: 'Forbidden: You are not enrolled in the series containing this question paper.' },
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
