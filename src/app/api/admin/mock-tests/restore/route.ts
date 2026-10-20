import { NextResponse } from 'next/server';
import { requireAdmin, createAdminSupabase } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';
import JSZip from 'jszip';
import { createHash } from 'node:crypto';

export async function POST(request: Request) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `admin_restore_${adminId}_${ip}`,
    RATE_LIMIT_RULES.ADMIN_ACTION.limit,
    RATE_LIMIT_RULES.ADMIN_ACTION.windowSeconds
  );
  if (!rateRes.allowed) {
    return createRateLimitResponse(rateRes);
  }

  try {
    const formData = await request.formData();
    const file = formData.get('archiveZip') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Please provide an archive ZIP file.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // 1. Read and validate manifest.json
    const manifestFile = zip.file('manifest.json');
    if (!manifestFile) {
      return NextResponse.json({ error: 'Invalid archive: missing manifest.json' }, { status: 400 });
    }

    const manifestText = await manifestFile.async('text');
    const manifest = JSON.parse(manifestText);

    if (manifest.archiveType !== 'cga_mock_test_archive' || !manifest.fileChecksums) {
      return NextResponse.json({ error: 'Unrecognized archive format or missing checksums.' }, { status: 400 });
    }

    // 2. Validate SHA-256 Checksums
    for (const [relPath, expectedHash] of Object.entries(manifest.fileChecksums)) {
      const entry = zip.file(relPath);
      if (!entry) {
        return NextResponse.json({ error: `Archive integrity check failed: missing file ${relPath}` }, { status: 400 });
      }
      const entryBuffer = Buffer.from(await entry.async('nodebuffer'));
      const actualHash = createHash('sha256').update(entryBuffer).digest('hex');
      if (actualHash !== expectedHash) {
        return NextResponse.json(
          { error: `Integrity check failed: Checksum mismatch on ${relPath}. File may be tampered.` },
          { status: 400 }
        );
      }
    }

    // 3. Read questions.json
    const questionsFile = zip.file('questions.json');
    if (!questionsFile) {
      return NextResponse.json({ error: 'Invalid archive: missing questions.json' }, { status: 400 });
    }
    const questionsText = await questionsFile.async('text');
    const payload = JSON.parse(questionsText);

    const testId = manifest.test.id || payload.testId;
    const groups: any[] = payload.questionGroups || [];
    const questions: any[] = payload.questions || [];

    const supabaseAdmin = createAdminSupabase();

    // 4. Re-upload diagram images to bucket 'mock-question-images'
    const imagesFolder = zip.folder('images');
    if (imagesFolder) {
      const imageFiles: { path: string; buffer: Buffer }[] = [];
      imagesFolder.forEach((relPath, entry) => {
        if (!entry.dir) {
          imageFiles.push({ path: relPath, buffer: Buffer.alloc(0) });
        }
      });

      for (const img of imageFiles) {
        const fileEntry = imagesFolder.file(img.path);
        if (fileEntry) {
          const buf = await fileEntry.async('nodebuffer');
          const mimeType = img.path.endsWith('.webp')
            ? 'image/webp'
            : img.path.endsWith('.png')
            ? 'image/png'
            : 'image/jpeg';
          await supabaseAdmin.storage
            .from('mock-question-images')
            .upload(img.path, buf, { contentType: mimeType, upsert: true });
        }
      }
    }

    // 5. Update or recreate test record setting content_status = 'draft'
    await supabaseAdmin
      .from('mock_tests')
      .update({
        content_status: 'draft',
        status: 'draft',
      })
      .eq('id', testId);

    // 6. Restore groups
    if (groups.length > 0) {
      const groupRows = groups.map((g) => ({
        id: g.id,
        test_id: testId,
        position: g.position,
        passage_text: g.passage_text || g.passageText || null,
        image_path: g.image_path || g.imagePath || null,
        image_alt: g.image_alt || g.imageAlt || null,
      }));
      await supabaseAdmin.from('mock_question_groups').upsert(groupRows);
    }

    // 7. Restore questions and keys
    if (questions.length > 0) {
      const qRows = questions.map((q) => ({
        id: q.id,
        test_id: testId,
        position: q.position,
        question_text: q.question_text || q.questionText || q.question || '',
        question_text_bn: q.question_text_bn || q.questionTextBn || q.questionBn || null,
        options: q.options || [],
        options_bn: q.options_bn || q.optionsBn || null,
        group_id: q.group_id || q.groupId || null,
        image_path: q.image_path || q.imagePath || null,
        image_alt: q.image_alt || q.imageAlt || null,
        image_width: q.image_width || q.imageWidth || null,
        image_height: q.image_height || q.imageHeight || null,
      }));
      await supabaseAdmin.from('mock_questions').upsert(qRows);

      const keyRows = questions.map((q) => ({
        question_id: q.id,
        correct_option: q.correct_option ?? q.correctOption ?? q.correctOptionIndex ?? 0,
        explanation: q.explanation || '',
        explanation_bn: q.explanation_bn || q.explanationBn || null,
        explanation_image_path: q.explanation_image_path || q.explanationImagePath || null,
        explanation_image_alt: q.explanation_image_alt || q.explanationImageAlt || null,
      }));
      await supabaseAdmin.from('mock_question_keys').upsert(keyRows);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully restored test "${manifest.test.title}" with ${questions.length} questions. Status set to Draft for admin review.`,
      testId,
      restoredQuestions: questions.length,
      restoredGroups: groups.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to restore test from archive';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
