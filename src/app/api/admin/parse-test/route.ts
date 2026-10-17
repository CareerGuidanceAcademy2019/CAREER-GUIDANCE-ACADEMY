import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/server';
import { PDFParse } from 'pdf-parse';
import { parseRawQuestionsText } from '@/lib/mcqParser';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized. Administrator access required.' }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `admin_parse_${adminId}_${ip}`,
    RATE_LIMIT_RULES.ADMIN_ACTION.limit,
    RATE_LIMIT_RULES.ADMIN_ACTION.windowSeconds
  );
  if (!rateRes.allowed) {
    return createRateLimitResponse(rateRes);
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    let extractedText = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const textParam = formData.get('text') as string | null;

      if (textParam && textParam.trim()) {
        extractedText = textParam;
      } else if (file) {
        if (file.size > 10 * 1024 * 1024) {
          return NextResponse.json({ error: 'Payload too large. Maximum file size is 10 MB.' }, { status: 413 });
        }
        const fileName = (file.name || '').toLowerCase();
        const allowedExtensions = ['.pdf', '.txt', '.csv'];
        if (!allowedExtensions.some(ext => fileName.endsWith(ext))) {
          return NextResponse.json({ error: 'Unsupported file type. Only PDF, TXT, or CSV files are permitted.' }, { status: 415 });
        }
        const buffer = Buffer.from(await file.arrayBuffer());

        if (fileName.endsWith('.pdf')) {
          const parser = new PDFParse({ data: buffer });
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const textResult: any = await parser.getText();
            if (typeof textResult === 'string') {
              extractedText = textResult;
            } else if (textResult && typeof textResult.text === 'string' && textResult.text.trim()) {
              extractedText = textResult.text;
            } else if (textResult && Array.isArray(textResult.pages)) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              extractedText = textResult.pages.map((p: any) => p.text || '').join('\n');
            } else {
              extractedText = String(textResult || '');
            }
          } finally {
            await parser.destroy().catch(() => null);
          }
        } else {
          extractedText = buffer.toString('utf-8');
        }
      }
    } else {
      const body = await request.json().catch(() => ({}));
      extractedText = body.text || '';
    }

    if (!extractedText || !extractedText.trim()) {
      return NextResponse.json(
        { error: 'No text or readable document could be extracted. Please upload a PDF/text file or paste question text.' },
        { status: 400 }
      );
    }

    const questions = parseRawQuestionsText(extractedText);

    if (questions.length === 0) {
      return NextResponse.json(
        {
          error:
            'Could not extract multiple-choice questions from the document. Please ensure questions are numbered (e.g. 1. or Q1.) with options (A, B, C, D).',
          extractedPreview: extractedText.slice(0, 400),
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      count: questions.length,
      questions,
      rawTextLength: extractedText.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to parse mock test file';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
