export interface ParsedMCQ {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctOptionIndex: number;
  explanation: string;
}

/**
 * Intelligent MCQ Extractor:
 * Parses unstructured text from PDFs, past papers, or Word docs into structured MCQ questions.
 * Handles diverse formats:
 * - Numbering: 1., 1), Q1., Q1:, Question 1:, (1)
 * - Options: (A)/(B)/(C)/(D), A)/B)/C)/D), A./B./C./D., 1)/2)/3)/4)
 * - Embedded Answer Keys: Ans: B, Answer: Option C, Correct: A
 * - End-of-document Answer Keys: "Answers: 1-A, 2-C, 3-B" or "Key: 1.B 2.D"
 */
export function parseRawQuestionsText(rawText: string): ParsedMCQ[] {
  if (!rawText || !rawText.trim()) return [];

  // Normalize line endings and non-breaking spaces
  const text = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u00A0/g, ' ')
    .trim();

  // 1. Check for global Answer Key table/list at the bottom or top of document
  // e.g. "Answer Key: 1. A, 2. B, 3. C" or "Answers: 1-B 2-C" or "Key: 1(A), 2(C)"
  const globalAnswerMap: Record<number, number> = {};
  const globalKeyMatch = text.match(
    /(?:Answer\s*Key|Answers|Solutions?\s*Key)[\s\:\-\n]+([\s\S]+?)(?=\n\s*(?:Note|Instructions|Notice|C\.G\.A|Page|$))/i
  );
  if (globalKeyMatch) {
    const keySection = globalKeyMatch[1];
    const pairRegex = /(?:Q(?:uestion)?\.?\s*)?(\d+)[\.\:\-\)\s]+(?:\()?\[?(?:Option\s*)?([A-Da-d1-4])\]?(?:\))?/g;
    let match: RegExpExecArray | null;
    while ((match = pairRegex.exec(keySection)) !== null) {
      const qNum = parseInt(match[1], 10);
      const optLetter = match[2].toUpperCase();
      let optIdx = 0;
      if (optLetter === 'A' || optLetter === '1') optIdx = 0;
      else if (optLetter === 'B' || optLetter === '2') optIdx = 1;
      else if (optLetter === 'C' || optLetter === '3') optIdx = 2;
      else if (optLetter === 'D' || optLetter === '4') optIdx = 3;
      globalAnswerMap[qNum] = optIdx;
    }
  }

  // 2. Split text into individual questions
  // Match lines starting with "1. ", "Q1. ", "Question 1:", "Q.1 ", "(1) "
  const questionPattern = /(?:^|\n+)(?:Q(?:uestion)?\.?\s*(\d+)[\.\:\)\-]?|(?:\()?(\d+)(?:\))?[\.\:\-]?\s+)/gi;

  const indices: { start: number; qNum: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = questionPattern.exec(text)) !== null) {
    const num = parseInt(m[1] || m[2], 10) || indices.length + 1;
    indices.push({ start: m.index, qNum: num });
  }

  const rawChunks: { text: string; qNum: number }[] = [];

  if (indices.length > 0) {
    for (let i = 0; i < indices.length; i++) {
      const cur = indices[i];
      const nextStart = i < indices.length - 1 ? indices[i + 1].start : text.length;
      const chunkText = text.slice(cur.start, nextStart).trim();
      if (chunkText.length > 5) {
        rawChunks.push({ text: chunkText, qNum: cur.qNum });
      }
    }
  } else {
    // If no numbered pattern, split by double newlines
    const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.length > 10);
    paragraphs.forEach((p, idx) => {
      rawChunks.push({ text: p, qNum: idx + 1 });
    });
  }

  const parsedQuestions: ParsedMCQ[] = [];

  for (let i = 0; i < rawChunks.length; i++) {
    const { text: chunk, qNum } = rawChunks[i];

    // Detect Answer key inside this specific chunk
    // e.g. Ans: A, Answer: Option B, Ans: [C], Correct: (D), Ans - B
    let correctIdx = globalAnswerMap[qNum] ?? 0;
    const ansMatch = chunk.match(
      /(?:Ans(?:wer)?|Correct(?:\s*Option)?|Key)[\s\:\-\.]+(?:Option\s*)?([A-D]|[a-d]|[1-4]|\([A-D]\)|\([a-d]\)|\([1-4]\)|\[[A-D]\]|\[[a-d]\]|\[[1-4]\])/i
    );
    if (ansMatch) {
      const char = ansMatch[1].replace(/[\(\)\[\]]/g, '').trim().toUpperCase();
      if (char === 'A' || char === '1') correctIdx = 0;
      else if (char === 'B' || char === '2') correctIdx = 1;
      else if (char === 'C' || char === '3') correctIdx = 2;
      else if (char === 'D' || char === '4') correctIdx = 3;
    }

    // Detect Explanation
    let explanation = 'Refer to C.G.A classroom notes and model solutions.';
    const expMatch = chunk.match(/(?:Explanation|Exp|Solution|Reason)[\s\:\-]+([^\n]+(?:\n[^\n]+)*)/i);
    if (expMatch) {
      explanation = expMatch[1].trim();
    }

    // Clean body
    let body = chunk;
    if (ansMatch) {
      body = body.replace(ansMatch[0], '');
    }
    if (expMatch) {
      body = body.replace(expMatch[0], '');
    }

    // Strip leading question number (e.g. "1. " or "Q1: " or "(1) ")
    body = body.replace(/^(?:Q(?:uestion)?\.?\s*\d+[\.\:\)\-]?|(?:\()?(\d+)(?:\))?[\.\:\-]?\s+)/i, '').trim();

    // Find options (A), (B), (C), (D) or A), B), C), D) or A., B., C., D. or [A], [B], [C], [D]
    const optionRegex = /(?:^|\n|\s+)(?:\(?\[?([A-D]|[a-d]|[1-4])(?:\)|\]|[\.\:\-\)])\s*)/g;
    const optionMatches = Array.from(body.matchAll(optionRegex));

    if (optionMatches.length >= 2) {
      const firstOptIndex = optionMatches[0].index ?? 0;
      const questionStem = body.slice(0, firstOptIndex).trim();

      const extractedOptions: string[] = [];
      for (let j = 0; j < optionMatches.length; j++) {
        const start = (optionMatches[j].index ?? 0) + optionMatches[j][0].length;
        const end = j < optionMatches.length - 1 ? (optionMatches[j + 1].index ?? body.length) : body.length;
        const optText = body.slice(start, end).trim();
        if (optText) {
          extractedOptions.push(optText.replace(/\n+/g, ' '));
        }
      }

      parsedQuestions.push({
        id: `q-bulk-${Date.now()}-${i + 1}`,
        question: questionStem.replace(/\n+/g, ' ') || `Question ${i + 1}`,
        options: [
          extractedOptions[0] || 'Option A',
          extractedOptions[1] || 'Option B',
          extractedOptions[2] || 'Option C',
          extractedOptions[3] || 'Option D',
        ],
        correctOptionIndex: correctIdx,
        explanation,
      });
    } else {
      // Line fallback
      const lines = body.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length >= 3) {
        const questionStem = lines[0];
        const rawOpts = lines.slice(1, 5);
        parsedQuestions.push({
          id: `q-bulk-${Date.now()}-${i + 1}`,
          question: questionStem,
          options: [
            rawOpts[0] || 'Option A',
            rawOpts[1] || 'Option B',
            rawOpts[2] || 'Option C',
            rawOpts[3] || 'Option D',
          ],
          correctOptionIndex: correctIdx,
          explanation,
        });
      }
    }
  }

  return parsedQuestions;
}
