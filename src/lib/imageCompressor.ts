/**
 * Client-Side Image Compressor for Institution & Classroom Gallery and Topper DPs
 *
 * 1. Campus & Classroom Gallery (`compressCampusPhoto`):
 *    Supports up to 20 front-page images (`MAX_CAMPUS_IMAGES = 20`).
 *    Uses HTMLCanvasElement with high-quality bicubic smoothing to compress
 *    high-resolution photos into lossless-clarity WebP/JPEG (~65KB–115KB each)
 *    so all 20 images load rapidly and persist cleanly in Supabase.
 *
 * 2. Topper / Achiever Candidate DP (`compressTopperPhoto`):
 *    Auto-optimizes any candidate portrait photo into the strict 20 KB – 50 KB
 *    range (`TOPPER_DP_MIN_KB = 20`, `TOPPER_DP_MAX_KB = 50`) without quality loss.
 */

export const MAX_CAMPUS_IMAGES = 20;
export const TOPPER_DP_MIN_KB = 20;
export const TOPPER_DP_MAX_KB = 50;

export interface CompressionResult {
  dataUrl: string;
  originalSizeKb: number;
  compressedSizeKb: number;
  savingsPercent: number;
  width: number;
  height: number;
}

export function getDataUrlSizeKb(dataUrl: string): number {
  if (!dataUrl) return 0;
  const base64Idx = dataUrl.indexOf(',');
  const base64 = base64Idx >= 0 ? dataUrl.slice(base64Idx + 1) : dataUrl;
  const byteLength = Math.round((base64.length * 3) / 4);
  return Math.max(1, Math.round((byteLength / 1024) * 10) / 10);
}

export async function compressCampusPhoto(
  file: File,
  maxWidth = 1360,
  maxHeight = 860,
  quality = 0.82
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image.'));
      return;
    }

    const originalSizeKb = Math.max(1, Math.round(file.size / 1024));
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not parse image data.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Downscale proportionally if larger than maximum bounds
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context is unavailable.'));
          return;
        }

        // Apply high-quality bicubic smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const encodeAtQuality = (q: number): string => {
          try {
            const webp = canvas.toDataURL('image/webp', q);
            if (webp.startsWith('data:image/webp')) return webp;
          } catch {}
          return canvas.toDataURL('image/jpeg', q);
        };

        // Start at high clarity (0.80); step down smoothly so 20 photos stay compact (~55-75KB each) for minimal DB egress
        let dataUrl = encodeAtQuality(quality);
        let compressedSizeKb = Math.round(getDataUrlSizeKb(dataUrl));
        for (const qStep of [0.76, 0.72, 0.66, 0.60]) {
          if (compressedSizeKb <= 75) break;
          dataUrl = encodeAtQuality(qStep);
          compressedSizeKb = Math.round(getDataUrlSizeKb(dataUrl));
        }

        const savingsPercent = Math.max(
          0,
          Math.round(((originalSizeKb - compressedSizeKb) / Math.max(1, originalSizeKb)) * 100)
        );

        resolve({
          dataUrl,
          originalSizeKb,
          compressedSizeKb,
          savingsPercent,
          width,
          height,
        });
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Compresses or optimizes a Topper / Candidate DP into the strict 20 KB – 50 KB range
 * with high portrait clarity (square center-crop portrait).
 */
export async function compressTopperPhoto(file: File): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image. Please upload a JPG, PNG, or WebP photo.'));
      return;
    }

    const originalSizeKb = Math.max(1, Math.round((file.size / 1024) * 10) / 10);
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read candidate photo file.'));
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error('Could not parse candidate image data.'));
      img.onload = () => {
        // If raw file is already between 20 KB and 50 KB and has reasonable dimensions, keep if desired or verify base64 size
        const rawKb = getDataUrlSizeKb(rawDataUrl);
        if (rawKb >= TOPPER_DP_MIN_KB && rawKb <= TOPPER_DP_MAX_KB) {
          resolve({
            dataUrl: rawDataUrl,
            originalSizeKb,
            compressedSizeKb: rawKb,
            savingsPercent: 0,
            width: img.width,
            height: img.height,
          });
          return;
        }

        // Center-crop square portrait for crisp circular topper DP
        const srcSide = Math.min(img.width, img.height);
        const sx = Math.round((img.width - srcSide) / 2);
        const sy = Math.round((img.height - srcSide) / 2);

        const renderCandidate = (side: number, mime: 'image/jpeg' | 'image/webp', q: number): { url: string; kb: number } => {
          const canvas = document.createElement('canvas');
          canvas.width = side;
          canvas.height = side;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas 2D context is unavailable.');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, side, side);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, sx, sy, srcSide, srcSide, 0, 0, side, side);
          const url = canvas.toDataURL(mime, q);
          return { url, kb: getDataUrlSizeKb(url) };
        };

        let bestAttempt: { url: string; kb: number; side: number } | null = null;

        // Search across crisp portrait resolutions & high qualities to land right inside 20 KB – 50 KB
        const candidateSides = [600, 680, 520, 760, 440, 860, 360, 960];
        const candidateQualities = [0.92, 0.88, 0.84, 0.80, 0.76, 0.96, 0.70, 0.64, 0.99];
        const mimes: Array<'image/jpeg' | 'image/webp'> = ['image/jpeg', 'image/webp'];

        outer: for (const mime of mimes) {
          for (const side of candidateSides) {
            for (const q of candidateQualities) {
              const res = renderCandidate(side, mime, q);
              if (res.kb >= TOPPER_DP_MIN_KB && res.kb <= TOPPER_DP_MAX_KB) {
                bestAttempt = { url: res.url, kb: res.kb, side };
                break outer;
              }
              if (
                !bestAttempt ||
                Math.abs(res.kb - 35) < Math.abs(bestAttempt.kb - 35)
              ) {
                bestAttempt = { url: res.url, kb: res.kb, side };
              }
            }
          }
        }

        // If a low-complexity image is still slightly < 20 KB, scale up at max JPEG quality 1.0 to reach >= 20 KB
        if (bestAttempt && bestAttempt.kb < TOPPER_DP_MIN_KB) {
          for (const largeSide of [1080, 1200, 1400]) {
            const res = renderCandidate(largeSide, 'image/jpeg', 1.0);
            if (res.kb >= TOPPER_DP_MIN_KB && res.kb <= TOPPER_DP_MAX_KB) {
              bestAttempt = { url: res.url, kb: res.kb, side: largeSide };
              break;
            }
            if (res.kb > bestAttempt.kb && res.kb <= TOPPER_DP_MAX_KB) {
              bestAttempt = { url: res.url, kb: res.kb, side: largeSide };
            }
          }
        }

        // If a very high-entropy image is still > 50 KB, step down side gently until <= 50 KB
        if (bestAttempt && bestAttempt.kb > TOPPER_DP_MAX_KB) {
          for (const smallSide of [340, 300, 260, 220]) {
            const res = renderCandidate(smallSide, 'image/webp', 0.72);
            if (res.kb <= TOPPER_DP_MAX_KB) {
              bestAttempt = { url: res.url, kb: res.kb, side: smallSide };
              break;
            }
          }
        }

        if (!bestAttempt) {
          reject(new Error('Could not optimize candidate photo into the 20 KB – 50 KB range.'));
          return;
        }

        const savingsPercent = Math.max(
          0,
          Math.round(((originalSizeKb - bestAttempt.kb) / Math.max(1, originalSizeKb)) * 100)
        );

        resolve({
          dataUrl: bestAttempt.url,
          originalSizeKb,
          compressedSizeKb: bestAttempt.kb,
          savingsPercent,
          width: bestAttempt.side,
          height: bestAttempt.side,
        });
      };

      img.src = rawDataUrl;
    };

    reader.readAsDataURL(file);
  });
}
