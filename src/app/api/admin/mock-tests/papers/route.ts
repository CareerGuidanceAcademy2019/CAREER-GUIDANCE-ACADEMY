import { NextResponse } from 'next/server';
import { requireAdmin, createAdminSupabase } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';
import { PDFDocument } from 'pdf-lib';
import { randomUUID } from 'node:crypto';

export async function GET(request: Request) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const seriesId = searchParams.get('seriesId');
  const subjectId = searchParams.get('subjectId');

  try {
    const supabaseAdmin = createAdminSupabase();
    let query = supabaseAdmin.from('mock_question_papers').select('*').order('created_at', { ascending: false });

    if (seriesId) query = query.eq('series_id', seriesId);
    if (subjectId) query = query.eq('subject_id', subjectId);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, papers: data || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch papers';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `admin_paper_${adminId}_${ip}`,
    RATE_LIMIT_RULES.ADMIN_ACTION.limit,
    RATE_LIMIT_RULES.ADMIN_ACTION.windowSeconds
  );
  if (!rateRes.allowed) {
    return createRateLimitResponse(rateRes);
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const seriesId = formData.get('seriesId') as string;
    const subjectId = (formData.get('subjectId') as string) || null;
    const testId = (formData.get('testId') as string) || null;
    const title = formData.get('title') as string;
    const status = (formData.get('status') as string) || 'published';
    const allowDownload = formData.get('allowDownload') === 'true';
    const publishAt = (formData.get('publishAt') as string) || null;
    const expireAt = (formData.get('expireAt') as string) || null;

    if (!seriesId || !title) {
      return NextResponse.json({ error: 'Missing seriesId or title.' }, { status: 400 });
    }

    const supabaseAdmin = createAdminSupabase();

    let filePath = formData.get('filePath') as string | null;
    let fileSize = 0;
    let pageCount = 1;

    if (file) {
      // 25MB ceiling
      if (file.size > 25 * 1024 * 1024) {
        return NextResponse.json({ error: 'File size exceeds maximum 25 MB limit.' }, { status: 400 });
      }

      const fileBuffer = Buffer.from(await file.arrayBuffer());
      fileSize = fileBuffer.length;

      // Verify PDF magic bytes '%PDF'
      if (fileBuffer.slice(0, 4).toString('ascii') !== '%PDF') {
        return NextResponse.json({ error: 'Invalid file format: File must be a valid PDF document.' }, { status: 400 });
      }

      // Calculate page count using pdf-lib
      try {
        const doc = await PDFDocument.load(fileBuffer);
        pageCount = doc.getPageCount();
      } catch {
        pageCount = 1;
      }

      const storagePath = `${seriesId}/${subjectId || 'general'}/${Date.now()}_${randomUUID()}.pdf`;

      const { error: uploadErr } = await supabaseAdmin.storage
        .from('mock-question-papers')
        .upload(storagePath, fileBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadErr) {
        return NextResponse.json({ error: `Storage upload failed: ${uploadErr.message}` }, { status: 500 });
      }

      filePath = storagePath;
    }

    if (!filePath) {
      return NextResponse.json({ error: 'Please upload a PDF file.' }, { status: 400 });
    }

    const paperId = (formData.get('paperId') as string) || `paper-${Date.now()}`;

    const { data: savedPaper, error: dbErr } = await supabaseAdmin
      .from('mock_question_papers')
      .upsert({
        id: paperId,
        series_id: seriesId,
        subject_id: subjectId,
        test_id: testId,
        title,
        file_path: filePath,
        file_size_bytes: fileSize,
        page_count: pageCount,
        status,
        publish_at: publishAt,
        expire_at: expireAt,
        allow_download: allowDownload,
      })
      .select()
      .single();

    if (dbErr) {
      return NextResponse.json({ error: dbErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, paper: savedPaper });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save question paper';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const paperId = searchParams.get('paperId');

  if (!paperId) {
    return NextResponse.json({ error: 'Missing paperId' }, { status: 400 });
  }

  try {
    const supabaseAdmin = createAdminSupabase();

    const { data: paper } = await supabaseAdmin
      .from('mock_question_papers')
      .select('file_path')
      .eq('id', paperId)
      .single();

    if (paper?.file_path) {
      await supabaseAdmin.storage.from('mock-question-papers').remove([paper.file_path]);
    }

    const { error } = await supabaseAdmin.from('mock_question_papers').delete().eq('id', paperId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, deletedPaperId: paperId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Delete failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
