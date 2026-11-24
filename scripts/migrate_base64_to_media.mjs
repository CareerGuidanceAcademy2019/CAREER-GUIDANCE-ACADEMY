import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local without external deps
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = val;
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const MEDIA_BUCKET = 'media';

const MIME_TO_EXT = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

function isRasterDataUrl(v) {
  return typeof v === 'string' && /^data:image\/(webp|jpeg|jpg|png|gif|avif);base64,/i.test(v.trim());
}

async function uploadDataUrl(dataUrl, folder, baseName) {
  const match = dataUrl.trim().match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return dataUrl;
  const mimeType = match[1].toLowerCase();
  const ext = MIME_TO_EXT[mimeType] || 'webp';
  const buf = Buffer.from(match[2], 'base64');
  const safeName = String(baseName).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  const objectPath = `${folder}/${safeName}.${ext}`;

  const { error } = await sb.storage.from(MEDIA_BUCKET).upload(objectPath, buf, {
    contentType: mimeType,
    cacheControl: '31536000',
    upsert: true,
  });
  if (error) throw new Error(`Upload failed for ${objectPath}: ${error.message}`);

  const { data } = sb.storage.from(MEDIA_BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}

async function main() {
  // 1. Migrate site_content.content.campusImages
  const { data: siteRow, error: siteErr } = await sb
    .from('site_content')
    .select('content')
    .eq('id', 1)
    .maybeSingle();
  if (siteErr) throw siteErr;

  if (siteRow?.content && Array.isArray(siteRow.content.campusImages)) {
    let migratedCampus = 0;
    const nextImages = [];
    for (const img of siteRow.content.campusImages) {
      if (img && isRasterDataUrl(img.url)) {
        const publicUrl = await uploadDataUrl(img.url, 'campus', img.id || `campus-${Date.now()}`);
        nextImages.push({ ...img, url: publicUrl });
        migratedCampus++;
      } else {
        nextImages.push(img);
      }
    }
    if (migratedCampus > 0) {
      const nextContent = { ...siteRow.content, campusImages: nextImages };
      const { error: upErr } = await sb
        .from('site_content')
        .update({ content: nextContent, updated_at: new Date().toISOString() })
        .eq('id', 1);
      if (upErr) throw upErr;
    }
    console.log(`Migrated campusImages: ${migratedCampus}`);
  }

  // 2. Migrate achievements.photo
  const { data: achRows, error: achErr } = await sb.from('achievements').select('id, photo');
  if (achErr) throw achErr;

  let migratedAch = 0;
  for (const row of achRows || []) {
    if (isRasterDataUrl(row.photo)) {
      const publicUrl = await uploadDataUrl(row.photo, 'achievements', row.id);
      const { error: upErr } = await sb
        .from('achievements')
        .update({ photo: publicUrl })
        .eq('id', row.id);
      if (upErr) throw upErr;
      migratedAch++;
    }
  }
  console.log(`Migrated achievements photos: ${migratedAch}`);

  // 3. Migrate payment_settings.qr_image_url & qr_image_url_backup
  const { data: payRow, error: payErr } = await sb
    .from('payment_settings')
    .select('id, qr_image_url, qr_image_url_backup')
    .eq('id', 1)
    .maybeSingle();
  if (payErr) throw payErr;

  if (payRow) {
    const patch = {};
    let migratedQr = 0;
    if (isRasterDataUrl(payRow.qr_image_url)) {
      patch.qr_image_url = await uploadDataUrl(payRow.qr_image_url, 'payment-qr', 'primary-upi-qr');
      migratedQr++;
    }
    if (isRasterDataUrl(payRow.qr_image_url_backup)) {
      patch.qr_image_url_backup = await uploadDataUrl(payRow.qr_image_url_backup, 'payment-qr', 'backup-upi-qr');
      migratedQr++;
    }
    if (migratedQr > 0) {
      patch.updated_at = new Date().toISOString();
      const { error: upErr } = await sb.from('payment_settings').update(patch).eq('id', 1);
      if (upErr) throw upErr;
    }
    console.log(`Migrated payment_settings QR images: ${migratedQr}`);
  }

  console.log('Migration complete!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
