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
 * Converts KaTeX formulas ($...$ and $$...$$) and formats superscripts/subscripts.
 */
function renderMathAndFormatting(rawText: string): string {
  if (!rawText) return '';

  // 1. Process Markdown tables first
  let content = parseMarkdownTables(rawText);

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
