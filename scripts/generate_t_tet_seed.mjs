import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MOCK_SERIES_INITIAL,
  MOCK_SUBJECTS_INITIAL,
  MOCK_SERIES_TESTS_INITIAL,
} from '../src/data/mockSeriesSeedData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let sql = `-- Seed script for T-TET Mock Test Series (2026 Batch - Banners & Festival Offer)
-- Generated automatically from src/data/mockSeriesSeedData.ts

`;

for (const s of MOCK_SERIES_INITIAL) {
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
}

for (const subj of MOCK_SUBJECTS_INITIAL) {
  sql += `INSERT INTO public.mock_subjects (id, series_id, name, sort_order)
VALUES ('${subj.id}', '${subj.seriesId}', '${subj.name.replace(/'/g, "''")}', ${subj.sortOrder})
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

`;
}

for (const test of MOCK_SERIES_TESTS_INITIAL) {
  const subjVal = test.subjectId ? `'${test.subjectId}'` : 'NULL';
  sql += `INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('${test.id}', '${test.seriesId}', ${subjVal}, '${test.testType}', '${test.title.replace(/'/g, "''")}', ${test.testNo}, ${test.questionCount}, ${test.totalMarks}, ${test.marksPerQuestion}, ${test.negativeMarking}, ${test.durationMinutes}, '${test.status}', '${test.showSolutions}')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
`;
}

const outSqlPath = path.join(rootDir, 'supabase', 'seed_t_tet.sql');
fs.writeFileSync(outSqlPath, sql, 'utf-8');
console.log(`Generated ${outSqlPath} successfully.`);
