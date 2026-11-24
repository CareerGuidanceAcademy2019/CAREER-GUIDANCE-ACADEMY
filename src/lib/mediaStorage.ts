import type { SupabaseClient } from '@supabase/supabase-js';

export const MEDIA_BUCKET = 'media';
const MEDIA_PUBLIC_PREFIX = `/storage/v1/object/public/${MEDIA_BUCKET}/`;

const MIME_TO_EXT: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

/**
 * Detects raster base64 data URLs (excludes tiny inline SVGs like data:image/svg+xml).
 */
export function isRasterDataUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return /^data:image\/(webp|jpeg|jpg|png|gif|avif);base64,/i.test(value.trim());
}

/**
 * Uploads a base64 raster data URL to the public Supabase `media` bucket
 * with 1-year immutable CDN/browser caching, and returns its public URL.
 * If the input is already a normal URL or inline SVG, returns it unchanged.
 */
export async function uploadDataUrlToMedia(
  adminSupabase: SupabaseClient,
  dataUrl: string,
  folder: 'campus' | 'achievements' | 'payment-qr' | 'faculty' | 'misc',
  baseName: string
): Promise<string> {
  const trimmed = dataUrl.trim();
  if (!isRasterDataUrl(trimmed)) {
    return trimmed;
  }

  const match = trimmed.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    return trimmed;
  }

  const mimeType = match[1].toLowerCase();
  const base64Payload = match[2];
  const ext = MIME_TO_EXT[mimeType] || 'webp';
  const buffer = Buffer.from(base64Payload, 'base64');

  const safeName = baseName
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 64);
  const objectPath = `${folder}/${safeName}-${Date.now()}.${ext}`;

  const { error } = await adminSupabase.storage
    .from(MEDIA_BUCKET)
    .upload(objectPath, buffer, {
      contentType: mimeType,
      cacheControl: '31536000',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload image to media bucket (${objectPath}): ${error.message}`);
  }

  const { data } = adminSupabase.storage.from(MEDIA_BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}

/**
 * Deletes an object from the `media` bucket if the URL points to it.
 */
export async function deleteMediaByPublicUrl(
  adminSupabase: SupabaseClient,
  url: unknown
): Promise<void> {
  if (typeof url !== 'string' || !url.includes(MEDIA_PUBLIC_PREFIX)) return;
  const idx = url.indexOf(MEDIA_PUBLIC_PREFIX);
  const rawPath = url.slice(idx + MEDIA_PUBLIC_PREFIX.length).split('?')[0];
  if (!rawPath) return;
  await adminSupabase.storage.from(MEDIA_BUCKET).remove([decodeURIComponent(rawPath)]).catch(() => null);
}
