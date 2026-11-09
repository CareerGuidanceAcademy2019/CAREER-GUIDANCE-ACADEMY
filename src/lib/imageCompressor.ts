/**
 * Client-Side Image Compressor for Institution & Classroom Gallery
 *
 * Uses HTMLCanvasElement to downscale high-resolution smartphone / DSLR camera photos
 * to a crisp 1400px max dimension and exports as WebP (or high-quality JPEG fallback)
 * at quality 0.82.
 *
 * Reduces image file weight from 5MB–10MB down to ~70KB–120KB with zero visible degradation,
 * preserving precious database storage and ensuring blazing-fast public page loading.
 */

export interface CompressionResult {
  dataUrl: string;
  originalSizeKb: number;
  compressedSizeKb: number;
  savingsPercent: number;
  width: number;
  height: number;
}

export async function compressCampusPhoto(
  file: File,
  maxWidth = 1400,
  maxHeight = 900,
  quality = 0.82
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image.'));
      return;
    }

    const originalSizeKb = Math.round(file.size / 1024);
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

        // Convert to WebP format first (falls back to JPEG if unsupported)
        let dataUrl = '';
        try {
          const webp = canvas.toDataURL('image/webp', quality);
          if (webp.startsWith('data:image/webp')) {
            dataUrl = webp;
          }
        } catch {}

        if (!dataUrl) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // Estimate compressed size in KB (base64 length * 0.75)
        const compressedSizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);
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

