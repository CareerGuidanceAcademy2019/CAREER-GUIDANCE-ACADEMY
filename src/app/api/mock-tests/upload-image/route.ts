import { NextResponse } from 'next/server';
import { requireAdmin, createAdminSupabase } from '@/lib/supabase/server';
import { processMockTestImage } from '@/lib/imageProcessor';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

// Configurable storage limit: 1 GB in bytes
const DEFAULT_STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024; // 1 GB

export async function POST(request: Request) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized. Administrator access required.' }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `admin_img_upload_${adminId}_${ip}`,
    RATE_LIMIT_RULES.ADMIN_ACTION.limit,
    RATE_LIMIT_RULES.ADMIN_ACTION.windowSeconds
  );
  if (!rateRes.allowed) {
    return createRateLimitResponse(rateRes);
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
    }

    const formData = await request.formData();
    const action = formData.get('action') as string | null;

    const supabaseAdmin = createAdminSupabase();

    // 1. Orphan Cleanup Tool
    if (action === 'clean-orphans') {
      // List all files in the bucket
      const { data: fileList, error: listError } = await supabaseAdmin.storage
        .from('mock-question-images')
        .list('', { limit: 10000, sortBy: { column: 'name', order: 'asc' } });

      if (listError) {
        return NextResponse.json({ error: `Failed to list storage files: ${listError.message}` }, { status: 500 });
      }

      // Collect folder names (which correspond to testIds)
      const allFiles: string[] = [];
      for (const item of fileList || []) {
        if (!item.id && item.name) {
          // Folder
          const { data: subFiles } = await supabaseAdmin.storage
            .from('mock-question-images')
            .list(item.name, { limit: 10000 });
          for (const sub of subFiles || []) {
            if (sub.name) allFiles.push(`${item.name}/${sub.name}`);
          }
        } else if (item.name) {
          allFiles.push(item.name);
        }
      }

      // Query all used image paths from DB
      const [groupsRes, questionsRes, keysRes] = await Promise.all([
        supabaseAdmin.from('mock_question_groups').select('image_path'),
        supabaseAdmin.from('mock_questions').select('image_path, options, options_bn'),
        supabaseAdmin.from('mock_question_keys').select('explanation_image_path'),
      ]);

      const referencedPaths = new Set<string>();

      // Groups
      for (const g of groupsRes.data || []) {
        if (g.image_path) referencedPaths.add(g.image_path);
      }

      // Questions & Options
      for (const q of questionsRes.data || []) {
        if (q.image_path) referencedPaths.add(q.image_path);
        if (Array.isArray(q.options)) {
          for (const opt of q.options) {
            if (typeof opt === 'object' && opt !== null) {
              if (opt.image_path) referencedPaths.add(opt.image_path);
              if (opt.imagePath) referencedPaths.add(opt.imagePath);
            }
          }
        }
        if (Array.isArray(q.options_bn)) {
          for (const opt of q.options_bn) {
            if (typeof opt === 'object' && opt !== null) {
              if (opt.image_path) referencedPaths.add(opt.image_path);
              if (opt.imagePath) referencedPaths.add(opt.imagePath);
            }
          }
        }
      }

      // Question Keys
      for (const k of keysRes.data || []) {
        if (k.explanation_image_path) referencedPaths.add(k.explanation_image_path);
      }

      // Find orphaned files
      const orphanedFiles = allFiles.filter((filePath) => !referencedPaths.has(filePath));

      let deletedCount = 0;
      if (orphanedFiles.length > 0) {
        // Delete in batches of 100
        const batchSize = 100;
        for (let i = 0; i < orphanedFiles.length; i += batchSize) {
          const batch = orphanedFiles.slice(i, i + batchSize);
          const { error: delErr } = await supabaseAdmin.storage
            .from('mock-question-images')
            .remove(batch);
          if (!delErr) {
            deletedCount += batch.length;
          }
        }
      }

      return NextResponse.json({
        success: true,
        totalFilesScanned: allFiles.length,
        orphanedCount: orphanedFiles.length,
        deletedCount,
      });
    }

    // 2. Storage Usage Meter
    if (action === 'storage-usage') {
      const { data: fileList, error: listError } = await supabaseAdmin.storage
        .from('mock-question-images')
        .list('', { limit: 10000 });

      if (listError) {
        return NextResponse.json({ error: `Storage query error: ${listError.message}` }, { status: 500 });
      }

      let totalBytes = 0;
      let fileCount = 0;

      for (const item of fileList || []) {
        if (!item.id && item.name) {
          const { data: subFiles } = await supabaseAdmin.storage
            .from('mock-question-images')
            .list(item.name, { limit: 10000 });
          for (const sub of subFiles || []) {
            totalBytes += sub.metadata?.size || 0;
            fileCount++;
          }
        } else {
          totalBytes += item.metadata?.size || 0;
          fileCount++;
        }
      }

      const limitBytes = DEFAULT_STORAGE_LIMIT_BYTES;
      const percentageUsed = Number(((totalBytes / limitBytes) * 100).toFixed(1));
      const isWarning = percentageUsed >= 80;

      return NextResponse.json({
        success: true,
        totalBytes,
        limitBytes,
        fileCount,
        percentageUsed,
        isWarning,
        formattedUsed: `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`,
        formattedLimit: `${(limitBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`,
      });
    }

    // 3. Regular Image Upload
    const file = formData.get('file') as File | null;
    const testId = (formData.get('testId') as string) || 'global';
    const maxDimension = (formData.get('maxDimension') as 'question' | 'option' | 'passage' | 'explanation') || 'question';
    const altText = (formData.get('altText') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No image file provided.' }, { status: 400 });
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image exceeds maximum 8 MB limit.' }, { status: 413 });
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());

    // Process with sharp
    const processed = await processMockTestImage(inputBuffer, {
      testId,
      slot: maxDimension,
    });

    const compressionRatio =
      processed.originalSize > 0
        ? Math.round(((processed.originalSize - processed.processedSize) / processed.originalSize) * 100)
        : 0;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('mock-question-images')
      .upload(processed.storagePath, processed.buffer, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 500 });
    }

    // Generate short-lived signed URL for admin preview immediately
    const { data: signedData } = await supabaseAdmin.storage
      .from('mock-question-images')
      .createSignedUrl(processed.storagePath, 3600);

    return NextResponse.json({
      success: true,
      storagePath: processed.storagePath,
      previewUrl: signedData?.signedUrl || '',
      fileName: processed.fileName,
      width: processed.width,
      height: processed.height,
      originalSize: processed.originalSize,
      processedSize: processed.processedSize,
      compressionRatio,
      lossless: processed.lossless,
      altText,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Image processing failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
