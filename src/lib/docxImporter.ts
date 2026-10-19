import mammoth from 'mammoth';
import { parseRawQuestionsText, ParsedMCQ } from '@/lib/mcqParser';
import { processMockTestImage } from '@/lib/imageProcessor';
import { createAdminSupabase } from '@/lib/supabase/server';

export interface DocxExtractionResult {
  questions: ParsedMCQ[];
  extractedImagesCount: number;
  unplacedImagesCount: number;
}

/**
 * Extracts questions and embedded images from a Word .docx file using mammoth.
 * Matches embedded images to their respective questions based on document order.
 */
export async function extractQuestionsFromDocx(
  docxBuffer: Buffer,
  testId: string
): Promise<DocxExtractionResult> {
  const embeddedImages: { index: number; buffer: Buffer; contentType: string }[] = [];

  let imageCounter = 0;
  const customImageConverter = mammoth.images.imgElement((element: any) => {
    return element.read().then((imageBuffer: Buffer) => {
      embeddedImages.push({
        index: imageCounter++,
        buffer: imageBuffer,
        contentType: element.contentType,
      });
      return {
        src: `__DOCX_IMAGE_${imageCounter - 1}__`,
      };
    });
  });

  const { value: htmlContent } = await mammoth.convertToHtml(
    { buffer: docxBuffer },
    { convertImage: customImageConverter }
  );

  // Convert HTML placeholders into diagram markers and extract questions
  const textWithMarkers = htmlContent
    .replace(/<img[^>]*src="__DOCX_IMAGE_(\d+)__"[^>]*>/gi, (_, imgIdx) => `\n[diagram: docx_img_${imgIdx}]\n`)
    .replace(/<[^>]+>/g, '\n');

  const questions = parseRawQuestionsText(textWithMarkers);
  const supabaseAdmin = createAdminSupabase();

  let unplacedImagesCount = 0;
  let placedCount = 0;

  // Process images and attach them to questions
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const match = q.question.match(/\[diagram:\s*docx_img_(\d+)\]/i);

    if (match) {
      const imgIdx = parseInt(match[1], 10);
      const imgData = embeddedImages[imgIdx];

      if (imgData) {
        try {
          const processed = await processMockTestImage(imgData.buffer, {
            testId,
            slot: 'question',
          });

          await supabaseAdmin.storage
            .from('mock-question-images')
            .upload(processed.storagePath, processed.buffer, {
              contentType: 'image/webp',
              upsert: true,
            });

          q.imagePath = processed.storagePath;
          q.imageAlt = `Diagram for question ${q.position}`;
          q.needsDiagram = true;
          // Clean the marker from the text
          q.question = q.question.replace(match[0], '').trim();
          placedCount++;
        } catch {
          q.warnings.push('Embedded image failed image processing standards.');
        }
      }
    }
  }

  unplacedImagesCount = Math.max(0, embeddedImages.length - placedCount);

  return {
    questions,
    extractedImagesCount: embeddedImages.length,
    unplacedImagesCount,
  };
}
