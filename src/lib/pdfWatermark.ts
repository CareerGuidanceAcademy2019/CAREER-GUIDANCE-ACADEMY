import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

export interface WatermarkOptions {
  studentName: string;
  studentCode: string;
  timestamp?: string;
  academyName?: string;
}

/**
 * Server-side PDF watermarker using pdf-lib.
 * Adds a diagonal semi-transparent watermark and bottom audit footer to every page.
 */
export async function watermarkPdf(
  pdfBuffer: Uint8Array | Buffer,
  options: WatermarkOptions
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pages = pdfDoc.getPages();
  const academy = options.academyName || 'CAREER GUIDANCE ACADEMY (C.G.A)';
  const dateStr = options.timestamp || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const watermarkText = `${academy} • ${options.studentName} (${options.studentCode})`;
  const footerText = `Licensed to: ${options.studentName} [${options.studentCode}] • Timestamp: ${dateStr} • Do not distribute`;

  for (const page of pages) {
    const { width, height } = page.getSize();

    // 1. Diagonal repeating center watermark
    const fontSize = Math.min(22, Math.max(14, width / 30));
    const textWidth = helveticaFont.widthOfTextAtSize(watermarkText, fontSize);

    // Center coordinates
    const centerX = width / 2;
    const centerY = height / 2;

    page.drawText(watermarkText, {
      x: centerX - textWidth / 2.8,
      y: centerY - 40,
      size: fontSize,
      font: helveticaFont,
      color: rgb(0.65, 0.65, 0.7),
      opacity: 0.18,
      rotate: degrees(-35),
    });

    // 2. Second diagonal watermark for larger pages
    if (height > 600) {
      page.drawText(watermarkText, {
        x: centerX - textWidth / 2.8,
        y: centerY + 180,
        size: fontSize * 0.85,
        font: helveticaFont,
        color: rgb(0.65, 0.65, 0.7),
        opacity: 0.15,
        rotate: degrees(-35),
      });

      page.drawText(watermarkText, {
        x: centerX - textWidth / 2.8,
        y: centerY - 240,
        size: fontSize * 0.85,
        font: helveticaFont,
        color: rgb(0.65, 0.65, 0.7),
        opacity: 0.15,
        rotate: degrees(-35),
      });
    }

    // 3. Compact Bottom Footer Bar
    page.drawRectangle({
      x: 0,
      y: 0,
      width: width,
      height: 18,
      color: rgb(0.96, 0.96, 0.98),
      opacity: 0.9,
    });

    page.drawText(footerText, {
      x: 14,
      y: 5,
      size: 8,
      font: helveticaRegular,
      color: rgb(0.3, 0.35, 0.4),
      opacity: 0.85,
    });
  }

  return await pdfDoc.save();
}
