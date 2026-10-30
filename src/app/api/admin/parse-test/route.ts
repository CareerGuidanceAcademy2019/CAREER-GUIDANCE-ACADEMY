import { NextResponse } from 'next/server';
import { requireAdmin, createAdminSupabase } from '@/lib/supabase/server';
import { parseRawQuestionsText, validateParsedQuestions, ParsedMCQ } from '@/lib/mcqParser';
import { safeExtractZipImages, processAndUploadZipImages } from '@/lib/zipImporter';
import { extractQuestionsFromDocx } from '@/lib/docxImporter';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const adminId = await requireAdmin(request);
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
    let extractedQuestions: ParsedMCQ[] = [];
    let method: 'paste' | 'pdf' | 'spreadsheet' | 'docx' = 'paste';
    const pageClassifications: { pageNumber: number; method: 'text' | 'ocr'; confidence: number }[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const zipFile = formData.get('zipFile') as File | null;
      const textParam = formData.get('text') as string | null;
      const answerKeyParam = formData.get('answerKey') as string | null;
      const testId = (formData.get('testId') as string) || 'temp-test';
      const expectedCount = formData.get('expectedCount') ? parseInt(formData.get('expectedCount') as string, 10) : undefined;

      if (textParam && textParam.trim()) {
        method = 'paste';
        extractedQuestions = parseRawQuestionsText(textParam, answerKeyParam || undefined);
      } else if (file) {
        if (file.size > 30 * 1024 * 1024) {
          return NextResponse.json({ error: 'Payload too large. Maximum file size is 30 MB.' }, { status: 413 });
        }

        const fileName = (file.name || '').toLowerCase();
        const buffer = Buffer.from(await file.arrayBuffer());

        if (fileName.endsWith('.docx') || fileName.endsWith('.pdf')) {
          return NextResponse.json({ error: 'PDF and DOCX imports are no longer supported. Use paste, CSV, or the manual passage/diagram builders.' }, { status: 415 });
        }

        if (fileName.endsWith('.docx')) {
          method = 'docx';
          const docxRes = await extractQuestionsFromDocx(buffer, testId);
          extractedQuestions = docxRes.questions;
        } else if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
          method = 'spreadsheet';
          const textContent = buffer.toString('utf-8');

          if (fileName.endsWith('.csv')) {
            // Check for CSV format
            const lines = textContent.split('\n').filter((l) => l.trim().length > 0);
            if (lines.length > 1 && lines[0].toLowerCase().includes('question_text')) {
              // Structured CSV template
              const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
              const qTextIdx = headers.indexOf('question_text');
              const optAIdx = headers.indexOf('option_a');
              const optBIdx = headers.indexOf('option_b');
              const optCIdx = headers.indexOf('option_c');
              const optDIdx = headers.indexOf('option_d');
              const ansIdx = headers.indexOf('correct_option');
              const expIdx = headers.indexOf('explanation');
              const qImgIdx = headers.indexOf('question_image');

              const imageRefs: string[] = [];

              for (let i = 1; i < lines.length; i++) {
                // Simple CSV row parser (handles quoted commas)
                const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map((val) => val.replace(/^"|"$/g, '').trim()) || [];
                if (row.length > qTextIdx && row[qTextIdx]) {
                  const qImg = qImgIdx >= 0 && row[qImgIdx] ? row[qImgIdx] : undefined;
                  if (qImg) imageRefs.push(qImg);

                  const correctChar = ansIdx >= 0 && row[ansIdx] ? row[ansIdx].toUpperCase() : 'A';
                  let correctIdx = 0;
                  if (correctChar === 'B' || correctChar === '2') correctIdx = 1;
                  else if (correctChar === 'C' || correctChar === '3') correctIdx = 2;
                  else if (correctChar === 'D' || correctChar === '4') correctIdx = 3;

                  extractedQuestions.push({
                    id: `q-csv-${Date.now()}-${i}`,
                    position: i,
                    question: row[qTextIdx],
                    options: [
                      row[optAIdx] || 'Option A',
                      row[optBIdx] || 'Option B',
                      row[optCIdx] || 'Option C',
                      row[optDIdx] || 'Option D',
                    ],
                    correctOptionIndex: correctIdx,
                    explanation: expIdx >= 0 && row[expIdx] ? row[expIdx] : 'Refer to model solutions.',
                    imagePath: qImg,
                    imageAlt: qImg ? `Diagram for question ${i}` : undefined,
                    needsDiagram: Boolean(qImg),
                    confidence: 'high',
                    warnings: [],
                  });
                }
              }

              // Process attached ZIP if provided
              if (zipFile && imageRefs.length > 0) {
                const zipBuffer = Buffer.from(await zipFile.arrayBuffer());
                const extractedZip = await safeExtractZipImages(zipBuffer);
                const uploadReport = await processAndUploadZipImages(testId, extractedZip.files, imageRefs);

                const storageMap = new Map<string, string>();
                for (const item of uploadReport.matchedImages) {
                  storageMap.set(item.fileName.toLowerCase(), item.storagePath);
                }

                for (const q of extractedQuestions) {
                  if (q.imagePath && storageMap.has(q.imagePath.toLowerCase())) {
                    q.imagePath = storageMap.get(q.imagePath.toLowerCase());
                  }
                }
              }
            } else {
              extractedQuestions = parseRawQuestionsText(textContent, answerKeyParam || undefined);
            }
          } else {
            extractedQuestions = parseRawQuestionsText(textContent, answerKeyParam || undefined);
          }
        }
      }

      const validationReport = validateParsedQuestions(extractedQuestions, expectedCount);

      return NextResponse.json({
        success: true,
        count: extractedQuestions.length,
        method,
        questions: extractedQuestions,
        validationReport,
        pageClassifications,
      });
    } else {
      const body = await request.json().catch(() => ({}));
      const questions = parseRawQuestionsText(body.text || '', body.answerKey || undefined);
      const validationReport = validateParsedQuestions(questions, body.expectedCount);

      return NextResponse.json({
        success: true,
        count: questions.length,
        method: 'paste',
        questions,
        validationReport,
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to parse mock test file';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
