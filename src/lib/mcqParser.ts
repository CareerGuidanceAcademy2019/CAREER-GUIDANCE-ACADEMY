import type { MockQuestionOption } from '@/data/initialSeedData';

export interface ParsedMCQ {
  id: string;
  position: number;
  question: string;
  options: [MockQuestionOption, MockQuestionOption, MockQuestionOption, MockQuestionOption] | MockQuestionOption[];
  correctOptionIndex: number;
  explanation: string;
  explanationImagePath?: string | null;
  explanationImageAlt?: string | null;
  questionBn?: string;
  optionsBn?: [MockQuestionOption, MockQuestionOption, MockQuestionOption, MockQuestionOption] | MockQuestionOption[];
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

/**
 * Converts Unicode Mathematical Alphanumeric Symbols (U+1D400..U+1D7FF from MS Word Equation Editor)
 * to standard ASCII characters, converts stacked fraction lines (from Word/PDF copy-paste) and
 * inline algebraic fractions like (a+b)/c into LaTeX $\frac{a+b}{c}$ so exact formatting is preserved.
 */
export function normalizeMathAndWordPaste(rawInput: string): string {
  if (!rawInput) return '';

  // 1. Convert Unicode Mathematical Alphanumeric Symbols (e.g. 𝑎, 𝑏, 𝑐, 𝑘) to standard ASCII
  let text = Array.from(rawInput)
    .map((ch) => {
      const cp = ch.codePointAt(0) || 0;
      if (cp >= 0x1d400 && cp <= 0x1d6a3) {
        const offsets: [number, number, number][] = [
          [0x1d400, 0x1d419, 65],
          [0x1d41a, 0x1d433, 97],
          [0x1d434, 0x1d44d, 65],
          [0x1d44e, 0x1d467, 97],
          [0x1d468, 0x1d481, 65],
          [0x1d482, 0x1d49b, 97],
          [0x1d5a0, 0x1d5b9, 65],
          [0x1d5ba, 0x1d5d3, 97],
          [0x1d5d4, 0x1d5ed, 65],
          [0x1d5ee, 0x1d607, 97],
          [0x1d608, 0x1d621, 65],
          [0x1d622, 0x1d63b, 97],
        ];
        for (const [start, end, base] of offsets) {
          if (cp >= start && cp <= end) {
            return String.fromCharCode(base + (cp - start));
          }
        }
      }
      if (cp === 0x210e) return 'h';
      if (cp === 0x2212) return '-'; // Unicode minus sign to standard hyphen-minus
      return ch;
    })
    .join('');

  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\u00A0/g, ' ');

  // 2. Reconstruct vertically stacked fractions pasted across separate lines from Word/PDF
  // e.g.:
  // a+b
  // c
  // =
  // b+c
  // a
  text = text.replace(
    /(?:^|\n)[ \t]*([a-zA-Z0-9\^²³]+(?:[ \t]*[\+\-][ \t]*[a-zA-Z0-9\^²³]+)+)[ \t]*\n[ \t]*([a-zA-Z0-9\^²³]{1,6})[ \t]*(?=\n[ \t]*[\=\+\-]|\s*[\=\+\-])/g,
    (match, num, den) => {
      const leadingNewline = match.startsWith('\n') ? '\n' : '';
      return `${leadingNewline}$\\frac{${num.trim()}}{${den.trim()}}$`;
    }
  );

  // Merge isolated "=" line between stacked fractions onto the same equation line
  text = text.replace(/(\$\\frac\{[^{}]+\}\{[^{}]+\}\$)[ \t]*\n[ \t]*=[ \t]*\n[ \t]*/g, '$1 = ');

  // 3. Convert parenthesized algebraic fractions like (a+b)/c, (b+c)/a, (c+a)/b into $\frac{a+b}{c}$
  text = text.replace(
    /\(([a-zA-Z0-9\+\-\s\^²³]{1,18})\)\s*\/\s*\(([a-zA-Z0-9\+\-\s\^²³]{1,18})\)/g,
    '$\\frac{$1}{$2}$'
  );
  text = text.replace(
    /\(([a-zA-Z0-9\+\-\s\^²³]{1,18})\)\s*\/\s*([a-zA-Z0-9\^²³]{1,8})(?![a-zA-Z0-9\/])/g,
    '$\\frac{$1}{$2}$'
  );
  text = text.replace(
    /(?<![a-zA-Z0-9\/])([a-zA-Z0-9\^²³]{1,8})\s*\/\s*\(([a-zA-Z0-9\+\-\s\^²³]{1,18})\)/g,
    '$\\frac{$1}{$2}$'
  );

  // 4. Convert unparenthesized algebraic fractions in equations (e.g. a+b/c = b+c/a = c+a/b = k)
  text = text.replace(
    /(?<![a-zA-Z0-9\/\\$])([a-zA-Z0-9\^²³]{1,6}(?:[\+\-][a-zA-Z0-9\^²³]{1,6})+)\s*\/\s*([a-zA-Z0-9\^²³]{1,6})(?=\s*(?:[\=\+\-\,\)\?]|then|is|হয়|তবে|$))/gi,
    '$\\frac{$1}{$2}$'
  );

  // 5. Clean up mathematical ratios with spaces around colon: "3 : 1" -> "3:1", "1 : 1 : 2" -> "1:1:2"
  // Normalize Unicode ratio (U+2236) and full-width colon (U+FF1A) to standard ASCII ':'
  text = text.replace(/[\u2236\uFF1A]/g, ':');
  // Normalize numeric ratios with spaces: "3 : 1" -> "3:1"
  text = text.replace(/(?<=\d)[ \t]*:[ \t]*(?=\d)/g, ':');
  // Normalize Bengali numeric ratios: "৩ : ১" -> "৩:১"
  text = text.replace(/(?<=[\u09E6-\u09EF])[ \t]*:[ \t]*(?=[\u09E6-\u09EF])/g, ':');
  // Normalize algebraic ratios: "a : b : c" -> "a:b:c"
  text = text.replace(/(?<=\b[a-zA-Z])[ \t]*:[ \t]*(?=[a-zA-Z]\b)/g, ':');

  return text;
}

/**
 * Extracts rich mathematical formatting (fractions, superscripts, subscripts, line breaks)
 * from clipboard HTML (MS Word / Google Docs / Web) when available, falling back to normalized plain text.
 */
export function extractRichClipboardQuestionText(html: string, plainText: string): string {
  const normalizedPlain = normalizeMathAndWordPaste(plainText || '');
  if (!html || !html.trim()) return normalizedPlain;

  // Only use HTML transformation if HTML contains explicit superscripts, subscripts, or MathML/OMML tags
  const hasMathMarkup = /<(?:sup|sub|m:f|m:sSup|m:sSub|mfrac|msup|msub)\b/i.test(html);
  if (!hasMathMarkup) {
    return normalizedPlain;
  }

  try {
    let working = html;

    // Strip <head>, <style>, <script>, <xml>, and comments
    working = working
      .replace(/<head[\s\S]*?<\/head>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '');

    // Convert Office MathML fractions <m:f>...</m:f>
    working = working.replace(/<m:f\b[^>]*>([\s\S]*?)<\/m:f>/gi, (_, inner) => {
      const numMatch = inner.match(/<m:num\b[^>]*>([\s\S]*?)<\/m:num>/i);
      const denMatch = inner.match(/<m:den\b[^>]*>([\s\S]*?)<\/m:den>/i);
      const cleanTag = (s: string) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, '').trim();
      const num = numMatch ? cleanTag(numMatch[1]) : '';
      const den = denMatch ? cleanTag(denMatch[1]) : '';
      return num && den ? ` $\\frac{${num}}{${den}}$ ` : _;
    });

    // Convert standard MathML fractions <mfrac>...</mfrac>
    working = working.replace(/<mfrac\b[^>]*>([\s\S]*?)<\/mfrac>/gi, (_, inner) => {
      const parts = inner
        .replace(/<\/?(?:mrow|mi|mn|mo)\b[^>]*>/gi, ' ')
        .trim()
        .split(/\s{2,}/)
        .map((s: string) => s.replace(/<[^>]+>/g, '').trim())
        .filter(Boolean);
      if (parts.length >= 2) {
        return ` $\\frac{${parts[0]}}{${parts[1]}}$ `;
      }
      return _;
    });

    // Convert <sup>...</sup> to Unicode superscripts or ^
    const supMap: Record<string, string> = {
      '0': '⁰',
      '1': '¹',
      '2': '²',
      '3': '³',
      '4': '⁴',
      '5': '⁵',
      '6': '⁶',
      '7': '⁷',
      '8': '⁸',
      '9': '⁹',
      '+': '⁺',
      '-': '⁻',
      n: 'ⁿ',
    };
    working = working.replace(/<sup\b[^>]*>([\s\S]*?)<\/sup>/gi, (_, exp) => {
      const clean = exp.replace(/<[^>]+>/g, '').trim();
      if (!clean) return '';
      if (clean.length === 1 && supMap[clean]) return supMap[clean];
      return `^${clean}`;
    });

    // Convert <sub>...</sub>
    const subMap: Record<string, string> = {
      '0': '₀',
      '1': '₁',
      '2': '₂',
      '3': '₃',
      '4': '₄',
      '5': '₅',
      '6': '₆',
      '7': '₇',
      '8': '₈',
      '9': '₉',
    };
    working = working.replace(/<sub\b[^>]*>([\s\S]*?)<\/sub>/gi, (_, sub) => {
      const clean = sub.replace(/<[^>]+>/g, '').trim();
      if (!clean) return '';
      if (clean.length === 1 && subMap[clean]) return subMap[clean];
      return `_${clean}`;
    });

    // Preserve line breaks from block tags
    working = working
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(?:p|div|li|tr|h[1-6])>/gi, '\n')
      .replace(/<[^>]+>/g, '');

    // Decode common HTML entities
    working = working
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&ndash;/gi, '–')
      .replace(/&mdash;/gi, '—');

    const cleanedHtmlText = normalizeMathAndWordPaste(
      working
        .split('\n')
        .map((line) => line.replace(/[ \t]+/g, ' ').trim())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    );

    // Safety check: if Word exported equations as local file:// images in HTML so plainText has more content, prefer plainText
    const plainAlphaCount = (normalizedPlain.match(/[a-zA-Z0-9\u0980-\u09FF]/g) || []).length;
    const htmlAlphaCount = (cleanedHtmlText.match(/[a-zA-Z0-9\u0980-\u09FF]/g) || []).length;
    if (htmlAlphaCount < plainAlphaCount * 0.85) {
      return normalizedPlain;
    }

    return cleanedHtmlText || normalizedPlain;
  } catch {
    return normalizedPlain;
  }
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
  // Ensures numeric ratios like "3:1" or "1:1:2" in text notes are NEVER matched as question-answer keys!
  const regex = /(?:Q(?:uestion)?\.?\s*)?(\d+)[\.\:\-\|\)\s]+(?:\()?\[?(?:Option\s*)?([A-Da-d1-4])\]?(?:\))?/g;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(cleanText)) !== null) {
    const rawMatch = m[0];
    const qNum = parseInt(m[1], 10);
    const ansChar = m[2];

    // Mathematical Ratio Protection:
    // If the answer is a numeric digit (1-4) and the separator is a bare colon without whitespace (e.g. "3:1", "1:1"),
    // this is a mathematical ratio, NOT an answer key!
    if (/^[1-4]$/.test(ansChar)) {
      const isBareColon = rawMatch.includes(':') && !/q/i.test(rawMatch) && !/option/i.test(rawMatch) && !/\s+/.test(rawMatch);
      if (isBareColon) {
        continue;
      }
      // Also check if followed by another ratio term like ":2" in "1:1:2"
      const afterMatch = cleanText.slice(m.index + rawMatch.length);
      if (/^\s*:\s*\d+/.test(afterMatch)) {
        continue;
      }
    }

    const char = ansChar.toUpperCase();
    let idx = 0;
    if (char === 'A' || char === '1') idx = 0;
    else if (char === 'B' || char === '2') idx = 1;
    else if (char === 'C' || char === '3') idx = 2;
    else if (char === 'D' || char === '4') idx = 3;
    map[qNum] = idx;
  }

  return map;
}

/** Maps an option label character (A-D, a-d, 1-4, ক-ঘ) to option index 0..3 */
function optionCharToIndex(ch: string): number {
  const c = ch.trim();
  if (c === 'A' || c === 'a' || c === 'ক' || c === '1') return 0;
  if (c === 'B' || c === 'b' || c === 'খ' || c === '2') return 1;
  if (c === 'C' || c === 'c' || c === 'গ' || c === '3') return 2;
  if (c === 'D' || c === 'd' || c === 'ঘ' || c === '4') return 3;
  return -1;
}

interface OptionToken {
  markerStart: number;
  contentStart: number;
  optIdx: number;
}

/**
 * Finds all valid option markers (a., b., c., d. / (A), (B), (C), (D) / a:, b:, c:, d: / ক., খ., গ., ঘ.)
 * without ever matching math ratios like a:b:c, 3:1, or 1:1:2.
 */
function findOptionTokens(text: string): OptionToken[] {
  // Option markers can be:
  // - Parenthesized or bracketed: (A), [A], (A):, [A]:, (a), (a):, (1), (2), (3), (4)
  // - Dotted/closed paren: A., A), a., a), ক., ক)
  // - Colon-separated: A:, B:, a:, b:, ক: ONLY when followed by whitespace and NOT part of a ratio (not followed by digit or variable:col)
  const optMarkerRegex =
    /(?:^|\n|[ \t]+)(?:\(\s*([A-Da-dক-ঘ1-4])\s*\)[:\.]?|\[\s*([A-Da-dক-ঘ1-4])\s*\][:\.]?|([A-Da-dক-ঘ])[\.\)]|([A-Da-dক-ঘ]):(?!\d)(?![a-zA-Z0-9]\s*:))(?:\s+|(?=[0-9\(\$\u0980-\u09FF]))/g;
  const tokens: OptionToken[] = [];
  let m: RegExpExecArray | null;
  while ((m = optMarkerRegex.exec(text)) !== null) {
    const rawChar = m[1] || m[2] || m[3] || m[4] || '';
    const optIdx = optionCharToIndex(rawChar);
    if (optIdx !== -1) {
      // If match started with \n or spaces, keep markerStart at the start of the delimiter (or \n)
      const leadingWsMatch = m[0].match(/^[\n \t]+/);
      const leadingLen = leadingWsMatch ? leadingWsMatch[0].length : 0;
      // Bare (non-parenthesized) markers like "a." or "a:" require being at line-start or preceded by >= 2 spaces/tabs
      // to avoid matching prose words like "is a." or equation ratios like "then a:b:c"
      const isNewlineStart = m.index === 0 || m[0].startsWith('\n');
      const isParenthesized = Boolean(m[1] || m[2]);
      if (!isNewlineStart && !isParenthesized) {
        const prevToken = tokens[tokens.length - 1];
        const isSequentialInline = prevToken && prevToken.optIdx === optIdx - 1 && m.index - prevToken.contentStart < 120;
        const hasWideSpace = leadingWsMatch && leadingWsMatch[0].length >= 2;
        if (!isSequentialInline && !hasWideSpace && optIdx === 0) {
          continue;
        }
      }
      tokens.push({
        markerStart: m.index + (m[0].startsWith('\n') ? 0 : leadingLen),
        contentStart: m.index + m[0].length,
        optIdx,
      });
    }
  }
  return tokens;
}

/**
 * Extracts ordered sequence of options [A, B, C, D] from tokens in a single question body.
 */
function selectOrderedOptionSequence(tokens: OptionToken[]): OptionToken[] | null {
  if (tokens.length < 2) return null;

  // Try to find the last complete 0 -> 1 -> 2 -> 3 sequence
  for (let i3 = tokens.length - 1; i3 >= 0; i3--) {
    if (tokens[i3].optIdx !== 3) continue;
    for (let i2 = i3 - 1; i2 >= 0; i2--) {
      if (tokens[i2].optIdx !== 2) continue;
      for (let i1 = i2 - 1; i1 >= 0; i1--) {
        if (tokens[i1].optIdx !== 1) continue;
        for (let i0 = i1 - 1; i0 >= 0; i0--) {
          if (tokens[i0].optIdx === 0) {
            return [tokens[i0], tokens[i1], tokens[i2], tokens[i3]];
          }
        }
      }
    }
  }

  // Fallback: 0 -> 1 -> 2
  for (let i2 = tokens.length - 1; i2 >= 0; i2--) {
    if (tokens[i2].optIdx !== 2) continue;
    for (let i1 = i2 - 1; i1 >= 0; i1--) {
      if (tokens[i1].optIdx !== 1) continue;
      for (let i0 = i1 - 1; i0 >= 0; i0--) {
        if (tokens[i0].optIdx === 0) {
          return [tokens[i0], tokens[i1], tokens[i2]];
        }
      }
    }
  }

  // Fallback: 0 -> 1
  for (let i1 = tokens.length - 1; i1 >= 0; i1--) {
    if (tokens[i1].optIdx !== 1) continue;
    for (let i0 = i1 - 1; i0 >= 0; i0--) {
      if (tokens[i0].optIdx === 0) {
        return [tokens[i0], tokens[i1]];
      }
    }
  }

  return null;
}

/**
 * Splits a text block if it contains multiple back-to-back questions (multiple A-B-C-D option sets).
 */
function splitChunkWithMultipleOptionSets(chunkText: string, startQNum: number): { text: string; qNum: number }[] {
  const tokens = findOptionTokens(chunkText);
  // Find all complete 0 -> 1 -> 2 -> 3 sequences in forward order
  const sequences: OptionToken[][] = [];
  let cursor = 0;
  while (cursor < tokens.length) {
    let i0 = -1,
      i1 = -1,
      i2 = -1,
      i3 = -1;
    for (let i = cursor; i < tokens.length; i++) {
      if (i0 === -1 && tokens[i].optIdx === 0) i0 = i;
      else if (i0 !== -1 && i1 === -1 && tokens[i].optIdx === 1) i1 = i;
      else if (i1 !== -1 && i2 === -1 && tokens[i].optIdx === 2) i2 = i;
      else if (i2 !== -1 && i3 === -1 && tokens[i].optIdx === 3) {
        i3 = i;
        break;
      }
    }
    if (i0 !== -1 && i1 !== -1 && i2 !== -1 && i3 !== -1) {
      sequences.push([tokens[i0], tokens[i1], tokens[i2], tokens[i3]]);
      cursor = i3 + 1;
    } else {
      break;
    }
  }

  if (sequences.length <= 1) {
    return [{ text: chunkText, qNum: startQNum }];
  }

  const results: { text: string; qNum: number }[] = [];
  let sliceStart = 0;

  for (let s = 0; s < sequences.length; s++) {
    if (s === sequences.length - 1) {
      const rest = chunkText.slice(sliceStart).trim();
      if (rest) results.push({ text: rest, qNum: startQNum + s });
      break;
    }

    const dToken = sequences[s][3];
    const nextAToken = sequences[s + 1][0];
    // Find the end of the d. option (and any Ans: / Explanation: lines immediately following it) before nextAToken
    const betweenDAndNextA = chunkText.slice(dToken.contentStart, nextAToken.markerStart);
    const lines = betweenDAndNextA.split('\n');
    let consumedLength = lines[0].length;
    for (let l = 1; l < lines.length; l++) {
      const trimmedLine = lines[l].trim();
      if (/^(?:Ans(?:wer)?|Correct|Key|Explanation|Exp|Solution|Reason)\b/i.test(trimmedLine)) {
        consumedLength += 1 + lines[l].length;
      } else {
        break;
      }
    }

    const splitPoint = dToken.contentStart + consumedLength;
    const part = chunkText.slice(sliceStart, splitPoint).trim();
    if (part) {
      results.push({ text: part, qNum: startQNum + s });
    }
    sliceStart = splitPoint;
  }

  return results.length > 0 ? results : [{ text: chunkText, qNum: startQNum }];
}

/**
 * Parses unstructured question text and optional separate answer key while preserving
 * exact multi-line formatting, mathematical fractions, and bilingual question structure.
 */
export function parseRawQuestionsText(rawText: string, separateKeyText?: string): ParsedMCQ[] {
  if (!rawText || !rawText.trim()) return [];

  // Normalize line endings, Unicode math symbols, fractions, and Bengali digits in numbering
  const text = normalizeBengaliDigits(normalizeMathAndWordPaste(rawText)).trim();

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
  // Matches: "24. If...", "Q24. ", "Question 24:", "Q.24 ", "(24) ", "24) " at start of line
  // Note: uses :(?!\d) so that a numeric ratio like "\n3:1, its number of sides..." is never mistaken for question 3!
  const questionPattern =
    /(?:^|\n)[ \t]*(?:Q(?:uestion)?\.?\s*(\d+)[\.\:\)\-]?\s*|\((\d+)\)\s*|(\d+)(?:[\.\)]|:(?!\d))(?:\s+|(?=[A-Za-z\u0980-\u09FF\(\$])))/gi;

  const indices: { start: number; qNum: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = questionPattern.exec(text)) !== null) {
    const num = parseInt(m[1] || m[2] || m[3], 10) || indices.length + 1;
    const actualStart = m.index + (m[0].startsWith('\n') ? 1 : 0);
    indices.push({ start: actualStart, qNum: num });
  }

  const rawChunks: { text: string; qNum: number }[] = [];

  if (indices.length > 0) {
    for (let i = 0; i < indices.length; i++) {
      const cur = indices[i];
      const nextStart = i < indices.length - 1 ? indices[i + 1].start : text.length;
      const chunkText = text.slice(cur.start, nextStart).trim();
      if (chunkText.length > 5) {
        const subChunks = splitChunkWithMultipleOptionSets(chunkText, cur.qNum);
        rawChunks.push(...subChunks);
      }
    }
  } else {
    // If no explicit question numbers, split by multi-option sets or double line breaks
    const multiSplit = splitChunkWithMultipleOptionSets(text, 1);
    if (multiSplit.length > 1) {
      rawChunks.push(...multiSplit);
    } else {
      const paragraphs = text
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 10);
      paragraphs.forEach((p, idx) => {
        rawChunks.push({ text: p, qNum: idx + 1 });
      });
    }
  }

  const parsedQuestions: ParsedMCQ[] = [];

  for (let i = 0; i < rawChunks.length; i++) {
    const { text: chunk, qNum } = rawChunks[i];
    const warnings: string[] = [];
    let confidence: 'high' | 'check' | 'low' = 'high';

    // Check for inline answer key: Ans: B, Answer: Option C, উত্তর: খ, etc.
    let correctIdx = globalAnswerMap[qNum] ?? -1;
    const ansMatch = chunk.match(
      /(?:Ans(?:wer)?|Correct(?:\s*Option)?|Key|উত্তর)[\s\:\-\.]+(?:Option\s*)?([A-Da-dক-ঘ1-4]|\([A-Da-dক-ঘ1-4]\)|\[[A-Da-dক-ঘ1-4]\])/i
    );
    if (ansMatch) {
      const char = ansMatch[1].replace(/[\(\)\[\]]/g, '').trim();
      const upper = char.toUpperCase();
      if (upper === 'A' || upper === '1' || char === 'ক') correctIdx = 0;
      else if (upper === 'B' || upper === '2' || char === 'খ') correctIdx = 1;
      else if (upper === 'C' || upper === '3' || char === 'গ') correctIdx = 2;
      else if (upper === 'D' || upper === '4' || char === 'ঘ') correctIdx = 3;
    }

    if (correctIdx === -1) {
      correctIdx = 0; // Default fallback to Option A
      warnings.push('No answer key found; defaulted to Option A.');
      confidence = 'check';
    }

    // Detect Explanation
    let explanation = 'Refer to C.G.A model solutions.';
    const expMatch = chunk.match(/(?:Explanation|Exp|Solution|Reason|ব্যাখ্যা)[\s\:\-]+([^\n]+(?:\n[^\n]+)*)/i);
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

    // Strip leading question number (e.g. "24. ", "Q24. ", "(24) ")
    body = body
      .replace(
        /^[ \t]*(?:Q(?:uestion)?\.?\s*\d+[\.\:\)\-]?\s*|\(\d+\)\s*|\d+(?:[\.\)]|:(?!\d))(?:\s+|(?=[A-Za-z\u0980-\u09FF\(\$])))/i,
        ''
      )
      .trim();

    // Find ordered options (A, B, C, D / a, b, c, d / ক, খ, গ, ঘ) without matching ratios like a:b:c or 1:1:2
    const tokens = findOptionTokens(body);
    const selectedTokens = selectOrderedOptionSequence(tokens);

    let extractedOptions: string[] = [];
    let questionStem = body;

    if (selectedTokens && selectedTokens.length >= 2) {
      questionStem = body.slice(0, selectedTokens[0].markerStart).trim();

      for (let j = 0; j < selectedTokens.length; j++) {
        const start = selectedTokens[j].contentStart;
        const end = j < selectedTokens.length - 1 ? selectedTokens[j + 1].markerStart : body.length;
        const optText = body
          .slice(start, end)
          .replace(/\n+/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim();
        if (optText) {
          extractedOptions.push(optText);
        }
      }
    } else {
      // Fallback by lines (taking last 4 lines as options if >= 5 lines, preserving multi-line stem)
      const lines = body
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length >= 5) {
        questionStem = lines.slice(0, lines.length - 4).join('\n');
        extractedOptions = lines.slice(lines.length - 4);
      } else if (lines.length >= 3) {
        questionStem = lines[0];
        extractedOptions = lines.slice(1, 5);
      }
    }

    if (extractedOptions.length !== 4) {
      warnings.push(`Expected 4 options, parsed ${extractedOptions.length}.`);
      confidence = 'check';
      while (extractedOptions.length < 4) {
        extractedOptions.push(`Option ${String.fromCharCode(65 + extractedOptions.length)}`);
      }
    }

    // Preserve exact multi-line structure of the question stem!
    const preservedQuestionStem = questionStem
      .split('\n')
      .map((line) => line.trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const needsDiagram = checkNeedsDiagram(preservedQuestionStem);
    if (needsDiagram) {
      warnings.push('Diagram reference detected; requires diagram attachment.');
    }

    parsedQuestions.push({
      id: `q-bulk-${Date.now()}-${i + 1}`,
      position: i + 1,
      question: preservedQuestionStem || `Question ${i + 1}`,
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
    if (
      q.options.length !== 4 ||
      q.options.some((o) => {
        const t = typeof o === 'string' ? o : o?.text;
        return !t || !t.trim();
      })
    ) {
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
