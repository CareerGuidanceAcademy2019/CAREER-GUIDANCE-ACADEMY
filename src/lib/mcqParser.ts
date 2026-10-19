export interface ParsedMCQ {
  id: string;
  position: number;
  question: string;
  options: [string, string, string, string] | string[];
  correctOptionIndex: number;
  explanation: string;
  questionBn?: string;
  optionsBn?: [string, string, string, string] | string[];
  explanationBn?: string;
  groupId?: string | null;
  imagePath?: string | null;
  imageAlt?: string | null;
  needsDiagram: boolean;
  confidence: 'high' | 'check' | 'low';
  warnings: string[];
}

export interface ParseValidationReport {
  totalParsed: number;
  expectedCount?: number;
  missingAnswersCount: number;
  invalidOptionsCount: number;
  duplicateCount: number;
  needsDiagramCount: number;
  hasErrors: boolean;
  warnings: string[];
}

/** Converts Bengali numerals (০-৯) to ASCII digits (0-9) */
export function normalizeBengaliDigits(text: string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  let res = text;
  for (let i = 0; i < 10; i++) {
    res = res.replaceAll(bnDigits[i], String(i));
  }
  return res;
}

/** Detects if question statement contains diagram indicators */
export function checkNeedsDiagram(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  const markers = [
    '[diagram]',
    '[figure]',
    '[image]',
    '[img:',
    'given figure',
    'following figure',
    'see the diagram',
    'study the table',
    'shown below',
    'refer to figure',
    'diagram below',
    'চিত্রটি দেখ',
    'নিচের চিত্র',
    'প্রদত্ত চিত্র',
    'সারণীটি লক্ষ্য',
  ];
  return markers.some((m) => lower.includes(m));
}

/** Parses a separate answer key box */
export function parseSeparateAnswerKey(keyText: string): Record<number, number> {
  if (!keyText || !keyText.trim()) return {};

  const cleanText = normalizeBengaliDigits(keyText);
  const map: Record<number, number> = {};

  // Matches formats: "1-B", "1:A", "1. (C)", "Q1: D", "1 | B"
  const regex = /(?:Q(?:uestion)?\.?\s*)?(\d+)[\.\:\-\|\)\s]+(?:\()?\[?(?:Option\s*)?([A-Da-d1-4])\]?(?:\))?/g;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(cleanText)) !== null) {
    const qNum = parseInt(m[1], 10);
    const char = m[2].toUpperCase();
    let idx = 0;
    if (char === 'A' || char === '1') idx = 0;
    else if (char === 'B' || char === '2') idx = 1;
    else if (char === 'C' || char === '3') idx = 2;
    else if (char === 'D' || char === '4') idx = 3;
    map[qNum] = idx;
  }

  return map;
}

/**
 * Parses unstructured question text and optional separate answer key.
 */
export function parseRawQuestionsText(rawText: string, separateKeyText?: string): ParsedMCQ[] {
  if (!rawText || !rawText.trim()) return [];

  // Normalize line endings and convert Bengali digits in numbering
  const text = normalizeBengaliDigits(
    rawText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\u00A0/g, ' ')
  ).trim();

  // 1. Separate answer key priority, then embedded global key
  const globalAnswerMap = separateKeyText ? parseSeparateAnswerKey(separateKeyText) : {};

  if (!separateKeyText) {
    const globalKeyMatch = text.match(
      /(?:Answer\s*Key|Answers|Solutions?\s*Key)[\s\:\-\n]+([\s\S]+?)(?=\n\s*(?:Note|Instructions|Notice|C\.G\.A|Page|$))/i
    );
    if (globalKeyMatch) {
      Object.assign(globalAnswerMap, parseSeparateAnswerKey(globalKeyMatch[1]));
    }
  }

  // 2. Identify question boundaries
  // Regex matches: "1. ", "Q1. ", "Question 1:", "Q.1 ", "(1) ", "1) "
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
    // If no explicit question numbers, split by double line breaks
    const paragraphs = text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 10);
    paragraphs.forEach((p, idx) => {
      rawChunks.push({ text: p, qNum: idx + 1 });
    });
  }

  const parsedQuestions: ParsedMCQ[] = [];

  for (let i = 0; i < rawChunks.length; i++) {
    const { text: chunk, qNum } = rawChunks[i];
    const warnings: string[] = [];
    let confidence: 'high' | 'check' | 'low' = 'high';

    // Check for inline answer key: Ans: B, Answer: Option C, etc.
    let correctIdx = globalAnswerMap[qNum] ?? -1;
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

    if (correctIdx === -1) {
      correctIdx = 0; // Default fallback to Option A
      warnings.push('No answer key found; defaulted to Option A.');
      confidence = 'check';
    }

    // Detect Explanation
    let explanation = 'Refer to C.G.A model solutions.';
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

    // Strip leading question number
    body = body.replace(/^(?:Q(?:uestion)?\.?\s*\d+[\.\:\)\-]?|(?:\()?(\d+)(?:\))?[\.\:\-]?\s+)/i, '').trim();

    // Find options (A), (B), (C), (D) or A), B), C), D) or A., B., C., D.
    const optionRegex = /(?:^|\n|\s+)(?:\(?\[?([A-D]|[a-d]|[1-4])(?:\)|\]|[\.\:\-\)])\s*)/g;
    const optionMatches = Array.from(body.matchAll(optionRegex));

    let extractedOptions: string[] = [];
    let questionStem = body;

    if (optionMatches.length >= 2) {
      const firstOptIndex = optionMatches[0].index ?? 0;
      questionStem = body.slice(0, firstOptIndex).trim();

      for (let j = 0; j < optionMatches.length; j++) {
        const start = (optionMatches[j].index ?? 0) + optionMatches[j][0].length;
        const end = j < optionMatches.length - 1 ? (optionMatches[j + 1].index ?? body.length) : body.length;
        const optText = body.slice(start, end).trim();
        if (optText) {
          extractedOptions.push(optText.replace(/\n+/g, ' '));
        }
      }
    } else {
      // Fallback by lines
      const lines = body
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length >= 3) {
        questionStem = lines[0];
        extractedOptions = lines.slice(1, 5);
      }
    }

    if (extractedOptions.length !== 4) {
      warnings.push(`Expected 4 options, parsed ${extractedOptions.length}.`);
      confidence = 'check';
      // Pad to 4
      while (extractedOptions.length < 4) {
        extractedOptions.push(`Option ${String.fromCharCode(65 + extractedOptions.length)}`);
      }
    }

    const needsDiagram = checkNeedsDiagram(questionStem);
    if (needsDiagram) {
      warnings.push('Diagram reference detected; requires diagram attachment.');
    }

    parsedQuestions.push({
      id: `q-bulk-${Date.now()}-${i + 1}`,
      position: i + 1,
      question: questionStem.replace(/\n+/g, ' ') || `Question ${i + 1}`,
      options: [
        extractedOptions[0] || 'Option A',
        extractedOptions[1] || 'Option B',
        extractedOptions[2] || 'Option C',
        extractedOptions[3] || 'Option D',
      ],
      correctOptionIndex: correctIdx,
      explanation,
      needsDiagram,
      confidence,
      warnings,
    });
  }

  return parsedQuestions;
}

/**
 * Validates parsed questions and provides summary metrics
 */
export function validateParsedQuestions(
  questions: ParsedMCQ[],
  expectedCount?: number
): ParseValidationReport {
  let missingAnswersCount = 0;
  let invalidOptionsCount = 0;
  let needsDiagramCount = 0;
  const warnings: string[] = [];

  const seenStems = new Set<string>();
  let duplicateCount = 0;

  for (const q of questions) {
    if (q.options.length !== 4 || q.options.some((o) => !o || !o.trim())) {
      invalidOptionsCount++;
    }
    if (q.needsDiagram && !q.imagePath) {
      needsDiagramCount++;
    }

    const normStem = q.question.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normStem.length > 10) {
      if (seenStems.has(normStem)) {
        duplicateCount++;
        warnings.push(`Possible duplicate question: "${q.question.slice(0, 50)}..."`);
      } else {
        seenStems.add(normStem);
      }
    }
  }

  if (expectedCount && expectedCount > 0 && questions.length !== expectedCount) {
    warnings.push(`Question count mismatch: Parsed ${questions.length}, expected ${expectedCount}.`);
  }

  return {
    totalParsed: questions.length,
    expectedCount,
    missingAnswersCount,
    invalidOptionsCount,
    duplicateCount,
    needsDiagramCount,
    hasErrors: invalidOptionsCount > 0 || (expectedCount !== undefined && questions.length !== expectedCount),
    warnings,
  };
}

/**
 * Generates sample CSV template for questions with diagram and passage support
 */
export function generateMCQTemplateCsv(): string {
  const headers = [
    'question_text',
    'option_a',
    'option_b',
    'option_c',
    'option_d',
    'correct_option',
    'explanation',
    'question_image',
    'option_a_image',
    'option_b_image',
    'option_c_image',
    'option_d_image',
    'explanation_image',
    'passage_id',
    'passage_text',
    'passage_image',
  ];

  const sampleRow1 = [
    '"What is the unit of electric current?"',
    '"Ampere"',
    '"Volt"',
    '"Ohm"',
    '"Watt"',
    '"A"',
    '"Electric current is measured in Amperes (A)."',
    '""',
    '""',
    '""',
    '""',
    '""',
    '""',
    '""',
    '""',
    '""',
  ];

  const sampleRow2 = [
    '"In the circuit shown below, calculate the equivalent resistance:"',
    '"5 Ohm"',
    '"10 Ohm"',
    '"15 Ohm"',
    '"20 Ohm"',
    '"B"',
    '"Resistors are in parallel connection: 1/R = 1/20 + 1/20 = 1/10."',
    '"circuit_diagram_1.png"',
    '""',
    '""',
    '""',
    '""',
    '"solution_step_1.png"',
    '"passage_1"',
    '"Study the given circuit and answer questions 2 and 3:"',
    '"shared_circuit.png"',
  ];

  return `${headers.join(',')}\n${sampleRow1.join(',')}\n${sampleRow2.join(',')}\n`;
}
