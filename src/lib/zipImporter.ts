import JSZip from 'jszip';
import path from 'node:path';
import { processMockTestImage } from '@/lib/imageProcessor';
import { createAdminSupabase } from '@/lib/supabase/server';

export interface ZipExtractionResult {
  files: Map<string, Buffer>; // lowercased basename -> Buffer
  fileCount: number;
  totalUncompressedBytes: number;
}

export interface ZipImportReport {
  matchedImages: { fileName: string; storagePath: string; width: number; height: number }[];
  missingImages: string[];
  unusedImages: string[];
}

const MAX_ZIP_FILES = 500;
const MAX_UNCOMPRESSED_BYTES = 100 * 1024 * 1024; // 100 MB

/**
 * Safely extracts images from a ZIP buffer with strict protection against:
 * - Zip-Slip (directory traversal with ../ or absolute paths)
 * - Zip-Bomb (huge uncompressed size or excessive file count)
 */
export async function safeExtractZipImages(zipBuffer: Buffer): Promise<ZipExtractionResult> {
  const zip = await JSZip.loadAsync(zipBuffer);
  const files = new Map<string, Buffer>();
  let totalBytes = 0;
  let count = 0;

  const entries = Object.keys(zip.files);
  if (entries.length > MAX_ZIP_FILES) {
    throw new Error(`ZIP contains ${entries.length} files, exceeding the limit of ${MAX_ZIP_FILES}.`);
  }

  for (const relativePath of entries) {
    const entry = zip.files[relativePath];
    if (entry.dir) continue;

    // 1. Zip-Slip Protection: Normalize and verify path doesn't escape root
    const cleanPath = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
    if (cleanPath.startsWith('..') || path.isAbsolute(cleanPath) || relativePath.includes('..')) {
      throw new Error(`Security Exception: Detected illegal path traversal attempt in ZIP entry "${relativePath}".`);
    }

    count++;
    if (count > MAX_ZIP_FILES) {
      throw new Error(`ZIP exceeds file limit of ${MAX_ZIP_FILES} entries.`);
    }

    const fileBuffer = await entry.async('nodebuffer');
    totalBytes += fileBuffer.length;

    // 2. Zip-Bomb Protection: Total uncompressed byte threshold
    if (totalBytes > MAX_UNCOMPRESSED_BYTES) {
      throw new Error(`ZIP uncompressed contents exceed safety threshold of 100 MB.`);
    }

    // Index by lowercased base filename (e.g. "figure1.png")
    const baseName = path.basename(relativePath).toLowerCase();
    files.set(baseName, fileBuffer);
  }

  return {
    files,
    fileCount: count,
    totalUncompressedBytes: totalBytes,
  };
}

/**
 * Processes and uploads matched images from the ZIP extraction map into Supabase storage.
 */
export async function processAndUploadZipImages(
  testId: string,
  imageFilesMap: Map<string, Buffer>,
  referencedFileNames: string[]
): Promise<ZipImportReport> {
  const supabaseAdmin = createAdminSupabase();
  const matchedImages: { fileName: string; storagePath: string; width: number; height: number }[] = [];
  const missingImages: string[] = [];
  const usedKeys = new Set<string>();

  for (const rawName of referencedFileNames) {
    if (!rawName || !rawName.trim()) continue;
    const cleanName = rawName.trim().toLowerCase();
    const buffer = imageFilesMap.get(cleanName);

    if (!buffer) {
      missingImages.push(rawName);
      continue;
    }

    usedKeys.add(cleanName);

    try {
      const processed = await processMockTestImage(buffer, {
        testId,
        slot: 'question',
      });

      await supabaseAdmin.storage
        .from('mock-question-images')
        .upload(processed.storagePath, processed.buffer, {
          contentType: 'image/webp',
          upsert: true,
        });

      matchedImages.push({
        fileName: rawName,
        storagePath: processed.storagePath,
        width: processed.width,
        height: processed.height,
      });
    } catch {
      missingImages.push(rawName);
    }
  }

  const unusedImages: string[] = [];
  for (const key of imageFilesMap.keys()) {
    if (!usedKeys.has(key)) {
      unusedImages.push(key);
    }
  }

  return {
    matchedImages,
    missingImages,
    unusedImages,
  };
}
