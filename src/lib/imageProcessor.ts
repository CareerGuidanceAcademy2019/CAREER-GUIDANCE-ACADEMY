import sharp from 'sharp';
import { randomUUID } from 'node:crypto';

/**
 * Server-side image pipeline for mock test diagrams.
 *
 * Pure module (no Supabase / network) so it can be unit-tested directly.
 * Storage upload lives in src/lib/mockImageStorage.ts (the single module to change when
 * moving the bucket to another provider).
 */

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB
export const MAX_INPUT_PIXELS = 40_000_000; // ~40 MP: blocks decompression bombs
export const WIDTH_CAP = { question: 1200, passage: 1200, explanation: 1200, option: 900 } as const;
export const WEBP_LOSSY_QUALITY = 85; // never below 80 (requirement)
export const PREVIEW_SIZE_WARN_BYTES = 400 * 1024; // checklist warning threshold

export type ImageSlot = keyof typeof WIDTH_CAP;
export type DetectedImageType = 'png' | 'jpeg' | 'webp';

export interface ProcessedImageResult {
  buffer: Buffer;
  mimeType: 'image/webp';
  fileName: string;
  storagePath: string;
  width: number;
  height: number;
  originalSize: number;
  processedSize: number;
  lossless: boolean;
  sourceType: DetectedImageType;
}

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageValidationError';
  }
}

/**
 * Detects the real file type from magic bytes. File names and client-supplied MIME types
 * are never trusted. SVG / XML / HTML / GIF and anything unknown are rejected.
 */
export function detectImageType(buffer: Buffer): DetectedImageType {
  if (!buffer || buffer.length < 12) {
    throw new ImageValidationError('The file is empty or too small to be an image.');
  }
  const head = buffer.subarray(0, Math.min(buffer.length, 512)).toString('latin1').toLowerCase();
  if (head.includes('<svg') || head.includes('<?xml') || head.includes('<html') || head.includes('<script')) {
    throw new ImageValidationError('SVG, XML or HTML content is not allowed. Upload a PNG, JPG or WebP image.');
  }
  if (buffer.subarray(0, 6).toString('latin1') === 'GIF87a' || buffer.subarray(0, 6).toString('latin1') === 'GIF89a') {
    throw new ImageValidationError('GIF images are not allowed. Upload a PNG, JPG or WebP image.');
  }
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (png.every((b, i) => buffer[i] === b)) return 'png';
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpeg';
  if (buffer.subarray(0, 4).toString('latin1') === 'RIFF' && buffer.subarray(8, 12).toString('latin1') === 'WEBP') {
    return 'webp';
  }
  throw new ImageValidationError('Unsupported file type. Only PNG, JPG and WebP images are accepted.');
}

/** Builds a random, non-guessable storage path: {testId}/{uuid}.webp */
export function buildImagePath(testId: string): { fileName: string; storagePath: string } {
  const safeTest = String(testId || '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  if (!safeTest) throw new ImageValidationError('A valid test id is required for image storage.');
  const fileName = `${randomUUID()}.webp`;
  return { fileName, storagePath: `${safeTest}/${fileName}` };
}

export async function processMockTestImage(
  input: Buffer,
  opts: { testId: string; slot?: ImageSlot }
): Promise<ProcessedImageResult> {
  const originalSize = input?.length ?? 0;
  if (originalSize > MAX_UPLOAD_BYTES) {
    throw new ImageValidationError(
      `The image is ${(originalSize / 1048576).toFixed(1)} MB. The maximum size is 8 MB.`
    );
  }
  const sourceType = detectImageType(input);
  const cap = WIDTH_CAP[opts.slot ?? 'question'];

  try {
    const base = sharp(input, { failOn: 'error', limitInputPixels: MAX_INPUT_PIXELS });
    const meta = await base.metadata();
    if (!meta.format || !['png', 'jpeg', 'webp'].includes(meta.format)) {
      throw new ImageValidationError('Unsupported image format.');
    }
    if (meta.format !== sourceType) {
      throw new ImageValidationError('The file contents do not match a PNG, JPG or WebP image.');
    }

    // rotate() applies EXIF orientation; sharp strips all metadata unless keepMetadata() is called.
    const pipeline = sharp(input, { failOn: 'error', limitInputPixels: MAX_INPUT_PIXELS })
      .rotate()
      .resize({ width: cap, withoutEnlargement: true, fit: 'inside' });

    const [lossy, lossless] = await Promise.all([
      pipeline.clone().webp({ quality: WEBP_LOSSY_QUALITY, effort: 4 }).toBuffer({ resolveWithObject: true }),
      pipeline.clone().webp({ lossless: true, effort: 4 }).toBuffer({ resolveWithObject: true }),
    ]);
    const useLossless = lossless.data.length < lossy.data.length;
    const chosen = useLossless ? lossless : lossy;
    const { fileName, storagePath } = buildImagePath(opts.testId);

    return {
      buffer: chosen.data,
      mimeType: 'image/webp',
      fileName,
      storagePath,
      width: chosen.info.width,
      height: chosen.info.height,
      originalSize,
      processedSize: chosen.data.length,
      lossless: useLossless,
      sourceType,
    };
  } catch (err) {
    if (err instanceof ImageValidationError) throw err;
    const text = err instanceof Error ? err.message : '';
    if (/pixel limit/i.test(text)) {
      throw new ImageValidationError('The image dimensions are too large. Please resize it below 40 megapixels.');
    }
    throw new ImageValidationError('The image file is corrupted or incomplete and could not be read.');
  }
}
