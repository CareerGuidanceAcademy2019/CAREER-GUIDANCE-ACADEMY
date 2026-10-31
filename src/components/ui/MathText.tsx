'use client';

import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathTextProps {
  text?: string | null;
  className?: string;
  isOption?: boolean;
}

/**
 * Escapes raw HTML characters to prevent XSS.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Parses markdown-style tables into clean HTML table strings.
 */
function parseMarkdownTables(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];
  let isHeader = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      // Possible table row
      const cells = line
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());

      // Check if separator line (|---|---|)
      const isSeparator = cells.every((c) => /^:?-+:?$/.test(c));
      if (isSeparator) {
        isHeader = false;
        continue;
      }

      if (!inTable) {
        inTable = true;
        isHeader = true;
        tableRows = [];
      }

      tableRows.push(cells);
    } else {
      if (inTable) {
        // Close table
        result.push(renderTableHtml(tableRows));
        inTable = false;
        tableRows = [];
      }
      result.push(line);
    }
  }

  if (inTable) {
    result.push(renderTableHtml(tableRows));
  }

  return result.join('\n');
}

function renderTableHtml(rows: string[][]): string {
  if (rows.length === 0) return '';
  const [headerRow, ...bodyRows] = rows;

  let html = '<div class="my-3 overflow-x-auto rounded-xl border border-slate-200 shadow-xs"><table class="w-full text-left text-xs border-collapse">';
  if (headerRow) {
    html += '<thead class="bg-slate-100/90 text-slate-800 font-bold uppercase tracking-wider border-b border-slate-200"><tr>';
    for (const cell of headerRow) {
      html += `<th class="px-3.5 py-2.5 border-r border-slate-200 last:border-r-0">${escapeHtml(cell)}</th>`;
    }
    html += '</tr></thead>';
  }

  if (bodyRows.length > 0) {
    html += '<tbody class="divide-y divide-slate-100 bg-white">';
    for (const row of bodyRows) {
      html += '<tr class="hover:bg-slate-50/70 transition-colors">';
      for (const cell of row) {
        html += `<td class="px-3.5 py-2 border-r border-slate-100 last:border-r-0 text-slate-700">${escapeHtml(cell)}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody>';
  }

  html += '</table></div>';
  return html;
}

/**
 * Normalizes Unicode mathematical alphanumeric characters (from MS Word Equation Editor)
 * and converts algebraic fraction patterns like (a+b)/c or \frac{a+b}{c} into LaTeX $...$
 * so KaTeX renders real vertical stacked fractions.
 */
function preprocessMathExpressions(input: string): string {
  if (!input) return '';

  // 1. Convert Unicode Mathematical Alphanumeric Symbols (U+1D400..U+1D7FF) from Word equations to standard letters/digits
  let text = Array.from(input)
    .map((ch) => {
      const cp = ch.codePointAt(0) || 0;
      // Mathematical Bold/Italic/Sans/Monospace कैपिटल & small letters
      if (cp >= 0x1d400 && cp <= 0x1d6a3) {
        const offsets: [number, number, number][] = [
          [0x1d400, 0x1d419, 65], // Bold A-Z
          [0x1d41a, 0x1d433, 97], // Bold a-z
          [0x1d434, 0x1d44d, 65], // Italic A-Z
          [0x1d44e, 0x1d467, 97], // Italic a-z
          [0x1d468, 0x1d481, 65], // Bold Italic A-Z
          [0x1d482, 0x1d49b, 97], // Bold Italic a-z
          [0x1d5a0, 0x1d5b9, 65], // Sans A-Z
          [0x1d5ba, 0x1d5d3, 97], // Sans a-z
          [0x1d5d4, 0x1d5ed, 65], // Sans Bold A-Z
          [0x1d5ee, 0x1d607, 97], // Sans Bold a-z
          [0x1d608, 0x1d621, 65], // Sans Italic A-Z
          [0x1d622, 0x1d63b, 97], // Sans Italic a-z
        ];
        for (const [start, end, base] of offsets) {
          if (cp >= start && cp <= end) {
            return String.fromCharCode(base + (cp - start));
          }
        }
      }
      if (cp === 0x210e) return 'h'; // Planck constant italic h used by Word for italic 'h'
      return ch;
    })
    .join('');

  // 2. Wrap bare \frac{...}{...} not already inside $...$ into $\frac{...}{...}$
  text = text.replace(/(?<!\$)\\frac\{([^{}]+)\}\{([^{}]+)\}(?!\$)/g, '$\\frac{$1}{$2}$');

  // 3. Convert parenthesized algebraic fractions outside $...$:
  // e.g. (a+b)/c, (b+c)/a, (c+a)/b, (x+1)/(x-1), a/(b+c)
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

  return text;
}

/**
 * Converts KaTeX formulas ($...$ and $$...$$), formats superscripts/subscripts, and preserves line breaks.
 */
function renderMathAndFormatting(rawText: string): string {
  if (!rawText) return '';

  // 1. Preprocess Word Unicode math and algebraic fractions, then process Markdown tables
  let content = parseMarkdownTables(preprocessMathExpressions(rawText));

  // 2. Process block math: $$ formula $$
  content = content.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    try {
      return `<div class="my-2.5 overflow-x-auto text-center">${katex.renderToString(math.trim(), {
        displayMode: true,
        throwOnError: false,
      })}</div>`;
    } catch {
      return `<code>$$${escapeHtml(math)}$$</code>`;
    }
  });

  // 3. Process inline math: $ formula $ (ensuring not matched against currency like $100 or double $$)
  content = content.replace(/(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), {
        displayMode: false,
        throwOnError: false,
      });
    } catch {
      return `<code>$${escapeHtml(math)}$</code>`;
    }
  });

  // 4. Superscripts: e.g. x^2 or cm^3 (outside tags)
  content = content.replace(/\^([0-9a-zA-Z+-]+)/g, '<sup>$1</sup>');
  // 5. Subscripts: e.g. H_2O or x_1 (outside tags)
  content = content.replace(/_([0-9a-zA-Z+-]+)/g, '<sub>$1</sub>');

  // 6. Preserve exact line breaks (\n -> <br />) so multi-line questions never collapse into a single line
  content = content.replace(/\n/g, '<br />');

  return content;
}

export function MathText({ text, className = '', isOption = false }: MathTextProps) {
  const renderedHtml = useMemo(() => {
    if (!text) return '';
    return renderMathAndFormatting(text);
  }, [text]);

  if (!text) return null;

  return (
    <div
      className={`cga-math-content inline leading-relaxed break-words font-sans ${isOption ? 'text-xs sm:text-sm font-medium' : ''} ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}

export default MathText;
