import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const HIGHLIGHTS = [
  'Real Exam CBT Interface with Live Countdown Timer',
  'Instant Analysis (Accuracy, Time per Question, Weak-Spot Identification)',
  '100% Strict TRBT Syllabus & Question Standards',
  'Bilingual Support (English and Bengali)',
  'No Negative Marking (Standard 1 Mark per Question)',
  'Topic-wise Sectionals (30 MCQs / 30 Mins) + 2 Full-Length Mocks (150 MCQs / 150 Mins)'
];

export const MOCK_SERIES_DEFINITIONS = [
  {
    id: 'series-ttet-paper1',
    slug: 't-tet-paper-1',
    name: 'T-TET Paper-I (For Classes I to V – Primary Level)',
    classRange: 'Classes I to V (Primary Level)',
    stream: 'Primary Education',
    price: 499,
    batchLabel: 'NOV 2026',
    description: 'Comprehensive online mock test package for Tripura TET Paper-I with 50 topic-wise sectional tests and 2 full-length simulated exam papers following strict TRBT guidelines.',
    highlights: HIGHLIGHTS,
    status: 'Open',
    startsOn: '1st Week of November, 2026',
    subjects: [
      { id: 'subj-p1-cdp', name: 'Child Development & Pedagogy', sortOrder: 1, testCount: 10 },
      { id: 'subj-p1-lang1', name: 'Language – I (English)', sortOrder: 2, testCount: 10 },
      { id: 'subj-p1-lang2', name: 'Language – II (Bengali / Kokborok)', sortOrder: 3, testCount: 10 },
      { id: 'subj-p1-math', name: 'Mathematics (Content & Pedagogy)', sortOrder: 4, testCount: 10 },
      { id: 'subj-p1-evs', name: 'Environmental Studies (EVS)', sortOrder: 5, testCount: 10 },
    ],
    fullMockCount: 2
  },
  {
    id: 'series-ttet-paper2-sci',
    slug: 't-tet-paper-2-science',
    name: 'T-TET Paper-II: Science Stream (For Classes VI to VIII)',
    classRange: 'Classes VI to VIII (Upper Primary)',
    stream: 'Science & Mathematics',
    price: 499,
    batchLabel: 'NOV 2026',
    description: 'Targeted preparation for Tripura TET Paper-II Science Stream featuring 50 sectional tests covering Science, Math & Pedagogy, plus 2 complete full-length TRBT pattern mock tests.',
    highlights: HIGHLIGHTS,
    status: 'Open',
    startsOn: '1st Week of November, 2026',
    subjects: [
      { id: 'subj-p2s-cdp', name: 'Child Development & Pedagogy', sortOrder: 1, testCount: 10 },
      { id: 'subj-p2s-lang1', name: 'Language – I (English)', sortOrder: 2, testCount: 10 },
      { id: 'subj-p2s-lang2', name: 'Language – II (Bengali / Kokborok)', sortOrder: 3, testCount: 10 },
      { id: 'subj-p2s-math', name: 'Mathematics (Content & Pedagogy)', sortOrder: 4, testCount: 10 },
      { id: 'subj-p2s-sci', name: 'Science (Physics, Chemistry, Bio & Pedagogy)', sortOrder: 5, testCount: 10 },
    ],
    fullMockCount: 2
  },
  {
    id: 'series-ttet-paper2-soc',
    slug: 't-tet-paper-2-social-science',
    name: 'T-TET Paper-II: Social Science Stream (For Classes VI to VIII)',
    classRange: 'Classes VI to VIII (Upper Primary)',
    stream: 'Social Science & Studies',
    price: 499,
    batchLabel: 'NOV 2026',
    description: 'Specialized 60-sectional test package for Tripura TET Paper-II Social Studies including in-depth Tripura Geography, History, and Civics, plus 2 full-length 150-mark simulations.',
    highlights: HIGHLIGHTS,
    status: 'Open',
    startsOn: '1st Week of November, 2026',
    subjects: [
      { id: 'subj-p2ss-cdp', name: 'Child Development & Pedagogy', sortOrder: 1, testCount: 10 },
      { id: 'subj-p2ss-lang1', name: 'Language – I (English)', sortOrder: 2, testCount: 10 },
      { id: 'subj-p2ss-lang2', name: 'Language – II (Bengali / Kokborok)', sortOrder: 3, testCount: 10 },
      { id: 'subj-p2ss-hist', name: 'History, Political Science & Pedagogical Issues', sortOrder: 4, testCount: 20 },
      { id: 'subj-p2ss-geog', name: 'Geography & Environment (incl. Tripura Geography)', sortOrder: 5, testCount: 10 },
    ],
    fullMockCount: 2
  }
];

// Generate SQL statements
let sql = `-- Seed script for T-TET Mock Test Series (Batch: NOV 2026)
-- Generates 3 Series, 15 Subjects, and 166 Sectional and Full-Length Mock Tests

`;

for (const s of MOCK_SERIES_DEFINITIONS) {
  const hJson = JSON.stringify(s.highlights).replace(/'/g, "''");
  sql += `INSERT INTO public.mock_series (id, slug, name, class_range, stream, price, batch_label, description, highlights, status, starts_on)
VALUES ('${s.id}', '${s.slug}', '${s.name.replace(/'/g, "''")}', '${s.classRange.replace(/'/g, "''")}', '${s.stream.replace(/'/g, "''")}', ${s.price}, '${s.batchLabel}', '${s.description.replace(/'/g, "''")}', '${hJson}'::jsonb, '${s.status}', '${s.startsOn}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  batch_label = EXCLUDED.batch_label,
  description = EXCLUDED.description,
  highlights = EXCLUDED.highlights;

`;

  // Insert subjects
  for (const subj of s.subjects) {
    sql += `INSERT INTO public.mock_subjects (id, series_id, name, sort_order)
VALUES ('${subj.id}', '${s.id}', '${subj.name.replace(/'/g, "''")}', ${subj.sortOrder})
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

`;

    // Insert sectional tests for this subject
    for (let i = 1; i <= subj.testCount; i++) {
      const testId = `test-${subj.id}-${i}`;
      const title = `${subj.name} - Mock ${i}`;
      sql += `INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('${testId}', '${s.id}', '${subj.id}', 'sectional', '${title.replace(/'/g, "''")}', ${i}, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
`;
    }
  }

  // Insert full-length mocks for this series
  for (let f = 1; f <= s.fullMockCount; f++) {
    const fullTestId = `test-${s.id}-full-${f}`;
    const fullTitle = `${s.name} - Full-Length Mock ${f}`;
    sql += `INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('${fullTestId}', '${s.id}', NULL, 'full', '${fullTitle.replace(/'/g, "''")}', ${f}, 150, 150, 1, 0, 150, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
`;
  }
  sql += `\n`;
}

const outSqlPath = path.join(rootDir, 'supabase', 'seed_t_tet.sql');
fs.writeFileSync(outSqlPath, sql, 'utf-8');
console.log(`Generated ${outSqlPath} successfully.`);
