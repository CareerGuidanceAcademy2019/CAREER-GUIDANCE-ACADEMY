-- Seed script for T-TET Mock Test Series (Batch: NOV 2026)
-- Generates 3 Series, 15 Subjects, and 166 Sectional and Full-Length Mock Tests

INSERT INTO public.mock_series (id, slug, name, class_range, stream, price, batch_label, description, highlights, status, starts_on)
VALUES ('series-ttet-paper1', 't-tet-paper-1', 'T-TET Paper-I (For Classes I to V – Primary Level)', 'Classes I to V (Primary Level)', 'Primary Education', 499, 'NOV 2026', 'Comprehensive online mock test package for Tripura TET Paper-I with 50 topic-wise sectional tests and 2 full-length simulated exam papers following strict TRBT guidelines.', '["Real Exam CBT Interface with Live Countdown Timer","Instant Analysis (Accuracy, Time per Question, Weak-Spot Identification)","100% Strict TRBT Syllabus & Question Standards","Bilingual Support (English and Bengali)","No Negative Marking (Standard 1 Mark per Question)","Topic-wise Sectionals (30 MCQs / 30 Mins) + 2 Full-Length Mocks (150 MCQs / 150 Mins)"]'::jsonb, 'Open', '1st Week of November, 2026')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  batch_label = EXCLUDED.batch_label,
  description = EXCLUDED.description,
  highlights = EXCLUDED.highlights;

INSERT INTO public.mock_subjects (id, series_id, name, sort_order)
VALUES ('subj-p1-cdp', 'series-ttet-paper1', 'Child Development & Pedagogy', 1)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-cdp-1', 'series-ttet-paper1', 'subj-p1-cdp', 'sectional', 'Child Development & Pedagogy - Mock 1', 1, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-cdp-2', 'series-ttet-paper1', 'subj-p1-cdp', 'sectional', 'Child Development & Pedagogy - Mock 2', 2, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-cdp-3', 'series-ttet-paper1', 'subj-p1-cdp', 'sectional', 'Child Development & Pedagogy - Mock 3', 3, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-cdp-4', 'series-ttet-paper1', 'subj-p1-cdp', 'sectional', 'Child Development & Pedagogy - Mock 4', 4, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-cdp-5', 'series-ttet-paper1', 'subj-p1-cdp', 'sectional', 'Child Development & Pedagogy - Mock 5', 5, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-cdp-6', 'series-ttet-paper1', 'subj-p1-cdp', 'sectional', 'Child Development & Pedagogy - Mock 6', 6, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-cdp-7', 'series-ttet-paper1', 'subj-p1-cdp', 'sectional', 'Child Development & Pedagogy - Mock 7', 7, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-cdp-8', 'series-ttet-paper1', 'subj-p1-cdp', 'sectional', 'Child Development & Pedagogy - Mock 8', 8, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-cdp-9', 'series-ttet-paper1', 'subj-p1-cdp', 'sectional', 'Child Development & Pedagogy - Mock 9', 9, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-cdp-10', 'series-ttet-paper1', 'subj-p1-cdp', 'sectional', 'Child Development & Pedagogy - Mock 10', 10, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_subjects (id, series_id, name, sort_order)
VALUES ('subj-p1-lang1', 'series-ttet-paper1', 'Language – I (English)', 2)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-lang1-1', 'series-ttet-paper1', 'subj-p1-lang1', 'sectional', 'Language – I (English) - Mock 1', 1, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-lang1-2', 'series-ttet-paper1', 'subj-p1-lang1', 'sectional', 'Language – I (English) - Mock 2', 2, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-lang1-3', 'series-ttet-paper1', 'subj-p1-lang1', 'sectional', 'Language – I (English) - Mock 3', 3, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-lang1-4', 'series-ttet-paper1', 'subj-p1-lang1', 'sectional', 'Language – I (English) - Mock 4', 4, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-lang1-5', 'series-ttet-paper1', 'subj-p1-lang1', 'sectional', 'Language – I (English) - Mock 5', 5, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-lang1-6', 'series-ttet-paper1', 'subj-p1-lang1', 'sectional', 'Language – I (English) - Mock 6', 6, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-lang1-7', 'series-ttet-paper1', 'subj-p1-lang1', 'sectional', 'Language – I (English) - Mock 7', 7, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-lang1-8', 'series-ttet-paper1', 'subj-p1-lang1', 'sectional', 'Language – I (English) - Mock 8', 8, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-lang1-9', 'series-ttet-paper1', 'subj-p1-lang1', 'sectional', 'Language – I (English) - Mock 9', 9, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-lang1-10', 'series-ttet-paper1', 'subj-p1-lang1', 'sectional', 'Language – I (English) - Mock 10', 10, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_subjects (id, series_id, name, sort_order)
VALUES ('subj-p1-lang2', 'series-ttet-paper1', 'Language – II (Bengali / Kokborok)', 3)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-lang2-1', 'series-ttet-paper1', 'subj-p1-lang2', 'sectional', 'Language – II (Bengali / Kokborok) - Mock 1', 1, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-lang2-2', 'series-ttet-paper1', 'subj-p1-lang2', 'sectional', 'Language – II (Bengali / Kokborok) - Mock 2', 2, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-lang2-3', 'series-ttet-paper1', 'subj-p1-lang2', 'sectional', 'Language – II (Bengali / Kokborok) - Mock 3', 3, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-lang2-4', 'series-ttet-paper1', 'subj-p1-lang2', 'sectional', 'Language – II (Bengali / Kokborok) - Mock 4', 4, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-lang2-5', 'series-ttet-paper1', 'subj-p1-lang2', 'sectional', 'Language – II (Bengali / Kokborok) - Mock 5', 5, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-lang2-6', 'series-ttet-paper1', 'subj-p1-lang2', 'sectional', 'Language – II (Bengali / Kokborok) - Mock 6', 6, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-lang2-7', 'series-ttet-paper1', 'subj-p1-lang2', 'sectional', 'Language – II (Bengali / Kokborok) - Mock 7', 7, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-lang2-8', 'series-ttet-paper1', 'subj-p1-lang2', 'sectional', 'Language – II (Bengali / Kokborok) - Mock 8', 8, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-lang2-9', 'series-ttet-paper1', 'subj-p1-lang2', 'sectional', 'Language – II (Bengali / Kokborok) - Mock 9', 9, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-lang2-10', 'series-ttet-paper1', 'subj-p1-lang2', 'sectional', 'Language – II (Bengali / Kokborok) - Mock 10', 10, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_subjects (id, series_id, name, sort_order)
VALUES ('subj-p1-math', 'series-ttet-paper1', 'Mathematics (Content & Pedagogy)', 4)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-math-1', 'series-ttet-paper1', 'subj-p1-math', 'sectional', 'Mathematics (Content & Pedagogy) - Mock 1', 1, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-math-2', 'series-ttet-paper1', 'subj-p1-math', 'sectional', 'Mathematics (Content & Pedagogy) - Mock 2', 2, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-math-3', 'series-ttet-paper1', 'subj-p1-math', 'sectional', 'Mathematics (Content & Pedagogy) - Mock 3', 3, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-math-4', 'series-ttet-paper1', 'subj-p1-math', 'sectional', 'Mathematics (Content & Pedagogy) - Mock 4', 4, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-math-5', 'series-ttet-paper1', 'subj-p1-math', 'sectional', 'Mathematics (Content & Pedagogy) - Mock 5', 5, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-math-6', 'series-ttet-paper1', 'subj-p1-math', 'sectional', 'Mathematics (Content & Pedagogy) - Mock 6', 6, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-math-7', 'series-ttet-paper1', 'subj-p1-math', 'sectional', 'Mathematics (Content & Pedagogy) - Mock 7', 7, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-math-8', 'series-ttet-paper1', 'subj-p1-math', 'sectional', 'Mathematics (Content & Pedagogy) - Mock 8', 8, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-math-9', 'series-ttet-paper1', 'subj-p1-math', 'sectional', 'Mathematics (Content & Pedagogy) - Mock 9', 9, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-math-10', 'series-ttet-paper1', 'subj-p1-math', 'sectional', 'Mathematics (Content & Pedagogy) - Mock 10', 10, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_subjects (id, series_id, name, sort_order)
VALUES ('subj-p1-evs', 'series-ttet-paper1', 'Environmental Studies (EVS)', 5)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-evs-1', 'series-ttet-paper1', 'subj-p1-evs', 'sectional', 'Environmental Studies (EVS) - Mock 1', 1, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-evs-2', 'series-ttet-paper1', 'subj-p1-evs', 'sectional', 'Environmental Studies (EVS) - Mock 2', 2, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-evs-3', 'series-ttet-paper1', 'subj-p1-evs', 'sectional', 'Environmental Studies (EVS) - Mock 3', 3, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-evs-4', 'series-ttet-paper1', 'subj-p1-evs', 'sectional', 'Environmental Studies (EVS) - Mock 4', 4, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-evs-5', 'series-ttet-paper1', 'subj-p1-evs', 'sectional', 'Environmental Studies (EVS) - Mock 5', 5, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-evs-6', 'series-ttet-paper1', 'subj-p1-evs', 'sectional', 'Environmental Studies (EVS) - Mock 6', 6, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-evs-7', 'series-ttet-paper1', 'subj-p1-evs', 'sectional', 'Environmental Studies (EVS) - Mock 7', 7, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-evs-8', 'series-ttet-paper1', 'subj-p1-evs', 'sectional', 'Environmental Studies (EVS) - Mock 8', 8, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-evs-9', 'series-ttet-paper1', 'subj-p1-evs', 'sectional', 'Environmental Studies (EVS) - Mock 9', 9, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-evs-10', 'series-ttet-paper1', 'subj-p1-evs', 'sectional', 'Environmental Studies (EVS) - Mock 10', 10, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-series-ttet-paper1-full-1', 'series-ttet-paper1', NULL, 'full', 'T-TET Paper-I (For Classes I to V – Primary Level) - Full-Length Mock 1', 1, 150, 150, 1, 0, 150, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-series-ttet-paper1-full-2', 'series-ttet-paper1', NULL, 'full', 'T-TET Paper-I (For Classes I to V – Primary Level) - Full-Length Mock 2', 2, 150, 150, 1, 0, 150, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;

INSERT INTO public.mock_series (id, slug, name, class_range, stream, price, batch_label, description, highlights, status, starts_on)
VALUES ('series-ttet-paper2-sci', 't-tet-paper-2-science', 'T-TET Paper-II: Science Stream (For Classes VI to VIII)', 'Classes VI to VIII (Upper Primary)', 'Science & Mathematics', 499, 'NOV 2026', 'Targeted preparation for Tripura TET Paper-II Science Stream featuring 50 sectional tests covering Science, Math & Pedagogy, plus 2 complete full-length TRBT pattern mock tests.', '["Real Exam CBT Interface with Live Countdown Timer","Instant Analysis (Accuracy, Time per Question, Weak-Spot Identification)","100% Strict TRBT Syllabus & Question Standards","Bilingual Support (English and Bengali)","No Negative Marking (Standard 1 Mark per Question)","Topic-wise Sectionals (30 MCQs / 30 Mins) + 2 Full-Length Mocks (150 MCQs / 150 Mins)"]'::jsonb, 'Open', '1st Week of November, 2026')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  batch_label = EXCLUDED.batch_label,
  description = EXCLUDED.description,
  highlights = EXCLUDED.highlights;

INSERT INTO public.mock_subjects (id, series_id, name, sort_order)
VALUES ('subj-p2s-cdp', 'series-ttet-paper2-sci', 'Child Development & Pedagogy', 1)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-cdp-1', 'series-ttet-paper2-sci', 'subj-p2s-cdp', 'sectional', 'Child Development & Pedagogy - Mock 1', 1, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-cdp-2', 'series-ttet-paper2-sci', 'subj-p2s-cdp', 'sectional', 'Child Development & Pedagogy - Mock 2', 2, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-cdp-3', 'series-ttet-paper2-sci', 'subj-p2s-cdp', 'sectional', 'Child Development & Pedagogy - Mock 3', 3, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-cdp-4', 'series-ttet-paper2-sci', 'subj-p2s-cdp', 'sectional', 'Child Development & Pedagogy - Mock 4', 4, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-cdp-5', 'series-ttet-paper2-sci', 'subj-p2s-cdp', 'sectional', 'Child Development & Pedagogy - Mock 5', 5, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-cdp-6', 'series-ttet-paper2-sci', 'subj-p2s-cdp', 'sectional', 'Child Development & Pedagogy - Mock 6', 6, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-cdp-7', 'series-ttet-paper2-sci', 'subj-p2s-cdp', 'sectional', 'Child Development & Pedagogy - Mock 7', 7, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-cdp-8', 'series-ttet-paper2-sci', 'subj-p2s-cdp', 'sectional', 'Child Development & Pedagogy - Mock 8', 8, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-cdp-9', 'series-ttet-paper2-sci', 'subj-p2s-cdp', 'sectional', 'Child Development & Pedagogy - Mock 9', 9, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-cdp-10', 'series-ttet-paper2-sci', 'subj-p2s-cdp', 'sectional', 'Child Development & Pedagogy - Mock 10', 10, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_subjects (id, series_id, name, sort_order)
VALUES ('subj-p2s-lang1', 'series-ttet-paper2-sci', 'Language – I (English)', 2)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang1-1', 'series-ttet-paper2-sci', 'subj-p2s-lang1', 'sectional', 'Language – I (English) - Mock 1', 1, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang1-2', 'series-ttet-paper2-sci', 'subj-p2s-lang1', 'sectional', 'Language – I (English) - Mock 2', 2, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang1-3', 'series-ttet-paper2-sci', 'subj-p2s-lang1', 'sectional', 'Language – I (English) - Mock 3', 3, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang1-4', 'series-ttet-paper2-sci', 'subj-p2s-lang1', 'sectional', 'Language – I (English) - Mock 4', 4, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang1-5', 'series-ttet-paper2-sci', 'subj-p2s-lang1', 'sectional', 'Language – I (English) - Mock 5', 5, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang1-6', 'series-ttet-paper2-sci', 'subj-p2s-lang1', 'sectional', 'Language – I (English) - Mock 6', 6, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang1-7', 'series-ttet-paper2-sci', 'subj-p2s-lang1', 'sectional', 'Language – I (English) - Mock 7', 7, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang1-8', 'series-ttet-paper2-sci', 'subj-p2s-lang1', 'sectional', 'Language – I (English) - Mock 8', 8, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang1-9', 'series-ttet-paper2-sci', 'subj-p2s-lang1', 'sectional', 'Language – I (English) - Mock 9', 9, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang1-10', 'series-ttet-paper2-sci', 'subj-p2s-lang1', 'sectional', 'Language – I (English) - Mock 10', 10, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_subjects (id, series_id, name, sort_order)
VALUES ('subj-p2s-lang2', 'series-ttet-paper2-sci', 'Language – II (Bengali / Kokborok)', 3)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang2-1', 'series-ttet-paper2-sci', 'subj-p2s-lang2', 'sectional', 'Language – II (Bengali / Kokborok) - Mock 1', 1, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang2-2', 'series-ttet-paper2-sci', 'subj-p2s-lang2', 'sectional', 'Language – II (Bengali / Kokborok) - Mock 2', 2, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang2-3', 'series-ttet-paper2-sci', 'subj-p2s-lang2', 'sectional', 'Language – II (Bengali / Kokborok) - Mock 3', 3, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang2-4', 'series-ttet-paper2-sci', 'subj-p2s-lang2', 'sectional', 'Language – II (Bengali / Kokborok) - Mock 4', 4, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang2-5', 'series-ttet-paper2-sci', 'subj-p2s-lang2', 'sectional', 'Language – II (Bengali / Kokborok) - Mock 5', 5, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang2-6', 'series-ttet-paper2-sci', 'subj-p2s-lang2', 'sectional', 'Language – II (Bengali / Kokborok) - Mock 6', 6, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang2-7', 'series-ttet-paper2-sci', 'subj-p2s-lang2', 'sectional', 'Language – II (Bengali / Kokborok) - Mock 7', 7, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang2-8', 'series-ttet-paper2-sci', 'subj-p2s-lang2', 'sectional', 'Language – II (Bengali / Kokborok) - Mock 8', 8, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang2-9', 'series-ttet-paper2-sci', 'subj-p2s-lang2', 'sectional', 'Language – II (Bengali / Kokborok) - Mock 9', 9, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang2-10', 'series-ttet-paper2-sci', 'subj-p2s-lang2', 'sectional', 'Language – II (Bengali / Kokborok) - Mock 10', 10, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_subjects (id, series_id, name, sort_order)
VALUES ('subj-p2s-math', 'series-ttet-paper2-sci', 'Mathematics (Content & Pedagogy)', 4)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-math-1', 'series-ttet-paper2-sci', 'subj-p2s-math', 'sectional', 'Mathematics (Content & Pedagogy) - Mock 1', 1, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-math-2', 'series-ttet-paper2-sci', 'subj-p2s-math', 'sectional', 'Mathematics (Content & Pedagogy) - Mock 2', 2, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-math-3', 'series-ttet-paper2-sci', 'subj-p2s-math', 'sectional', 'Mathematics (Content & Pedagogy) - Mock 3', 3, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-math-4', 'series-ttet-paper2-sci', 'subj-p2s-math', 'sectional', 'Mathematics (Content & Pedagogy) - Mock 4', 4, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-math-5', 'series-ttet-paper2-sci', 'subj-p2s-math', 'sectional', 'Mathematics (Content & Pedagogy) - Mock 5', 5, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-math-6', 'series-ttet-paper2-sci', 'subj-p2s-math', 'sectional', 'Mathematics (Content & Pedagogy) - Mock 6', 6, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-math-7', 'series-ttet-paper2-sci', 'subj-p2s-math', 'sectional', 'Mathematics (Content & Pedagogy) - Mock 7', 7, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-math-8', 'series-ttet-paper2-sci', 'subj-p2s-math', 'sectional', 'Mathematics (Content & Pedagogy) - Mock 8', 8, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-math-9', 'series-ttet-paper2-sci', 'subj-p2s-math', 'sectional', 'Mathematics (Content & Pedagogy) - Mock 9', 9, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-math-10', 'series-ttet-paper2-sci', 'subj-p2s-math', 'sectional', 'Mathematics (Content & Pedagogy) - Mock 10', 10, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_subjects (id, series_id, name, sort_order)
VALUES ('subj-p2s-sci', 'series-ttet-paper2-sci', 'Science (Physics, Chemistry, Bio & Pedagogy)', 5)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-sci-1', 'series-ttet-paper2-sci', 'subj-p2s-sci', 'sectional', 'Science (Physics, Chemistry, Bio & Pedagogy) - Mock 1', 1, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-sci-2', 'series-ttet-paper2-sci', 'subj-p2s-sci', 'sectional', 'Science (Physics, Chemistry, Bio & Pedagogy) - Mock 2', 2, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-sci-3', 'series-ttet-paper2-sci', 'subj-p2s-sci', 'sectional', 'Science (Physics, Chemistry, Bio & Pedagogy) - Mock 3', 3, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-sci-4', 'series-ttet-paper2-sci', 'subj-p2s-sci', 'sectional', 'Science (Physics, Chemistry, Bio & Pedagogy) - Mock 4', 4, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-sci-5', 'series-ttet-paper2-sci', 'subj-p2s-sci', 'sectional', 'Science (Physics, Chemistry, Bio & Pedagogy) - Mock 5', 5, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-sci-6', 'series-ttet-paper2-sci', 'subj-p2s-sci', 'sectional', 'Science (Physics, Chemistry, Bio & Pedagogy) - Mock 6', 6, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-sci-7', 'series-ttet-paper2-sci', 'subj-p2s-sci', 'sectional', 'Science (Physics, Chemistry, Bio & Pedagogy) - Mock 7', 7, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-sci-8', 'series-ttet-paper2-sci', 'subj-p2s-sci', 'sectional', 'Science (Physics, Chemistry, Bio & Pedagogy) - Mock 8', 8, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-sci-9', 'series-ttet-paper2-sci', 'subj-p2s-sci', 'sectional', 'Science (Physics, Chemistry, Bio & Pedagogy) - Mock 9', 9, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-sci-10', 'series-ttet-paper2-sci', 'subj-p2s-sci', 'sectional', 'Science (Physics, Chemistry, Bio & Pedagogy) - Mock 10', 10, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-series-ttet-paper2-sci-full-1', 'series-ttet-paper2-sci', NULL, 'full', 'T-TET Paper-II: Science Stream (For Classes VI to VIII) - Full-Length Mock 1', 1, 150, 150, 1, 0, 150, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-series-ttet-paper2-sci-full-2', 'series-ttet-paper2-sci', NULL, 'full', 'T-TET Paper-II: Science Stream (For Classes VI to VIII) - Full-Length Mock 2', 2, 150, 150, 1, 0, 150, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;

INSERT INTO public.mock_series (id, slug, name, class_range, stream, price, batch_label, description, highlights, status, starts_on)
VALUES ('series-ttet-paper2-soc', 't-tet-paper-2-social-science', 'T-TET Paper-II: Social Science Stream (For Classes VI to VIII)', 'Classes VI to VIII (Upper Primary)', 'Social Science & Studies', 499, 'NOV 2026', 'Specialized 60-sectional test package for Tripura TET Paper-II Social Studies including in-depth Tripura Geography, History, and Civics, plus 2 full-length 150-mark simulations.', '["Real Exam CBT Interface with Live Countdown Timer","Instant Analysis (Accuracy, Time per Question, Weak-Spot Identification)","100% Strict TRBT Syllabus & Question Standards","Bilingual Support (English and Bengali)","No Negative Marking (Standard 1 Mark per Question)","Topic-wise Sectionals (30 MCQs / 30 Mins) + 2 Full-Length Mocks (150 MCQs / 150 Mins)"]'::jsonb, 'Open', '1st Week of November, 2026')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  batch_label = EXCLUDED.batch_label,
  description = EXCLUDED.description,
  highlights = EXCLUDED.highlights;

INSERT INTO public.mock_subjects (id, series_id, name, sort_order)
VALUES ('subj-p2ss-cdp', 'series-ttet-paper2-soc', 'Child Development & Pedagogy', 1)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-cdp-1', 'series-ttet-paper2-soc', 'subj-p2ss-cdp', 'sectional', 'Child Development & Pedagogy - Mock 1', 1, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-cdp-2', 'series-ttet-paper2-soc', 'subj-p2ss-cdp', 'sectional', 'Child Development & Pedagogy - Mock 2', 2, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-cdp-3', 'series-ttet-paper2-soc', 'subj-p2ss-cdp', 'sectional', 'Child Development & Pedagogy - Mock 3', 3, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-cdp-4', 'series-ttet-paper2-soc', 'subj-p2ss-cdp', 'sectional', 'Child Development & Pedagogy - Mock 4', 4, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-cdp-5', 'series-ttet-paper2-soc', 'subj-p2ss-cdp', 'sectional', 'Child Development & Pedagogy - Mock 5', 5, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-cdp-6', 'series-ttet-paper2-soc', 'subj-p2ss-cdp', 'sectional', 'Child Development & Pedagogy - Mock 6', 6, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-cdp-7', 'series-ttet-paper2-soc', 'subj-p2ss-cdp', 'sectional', 'Child Development & Pedagogy - Mock 7', 7, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-cdp-8', 'series-ttet-paper2-soc', 'subj-p2ss-cdp', 'sectional', 'Child Development & Pedagogy - Mock 8', 8, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-cdp-9', 'series-ttet-paper2-soc', 'subj-p2ss-cdp', 'sectional', 'Child Development & Pedagogy - Mock 9', 9, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-cdp-10', 'series-ttet-paper2-soc', 'subj-p2ss-cdp', 'sectional', 'Child Development & Pedagogy - Mock 10', 10, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_subjects (id, series_id, name, sort_order)
VALUES ('subj-p2ss-lang1', 'series-ttet-paper2-soc', 'Language – I (English)', 2)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-lang1-1', 'series-ttet-paper2-soc', 'subj-p2ss-lang1', 'sectional', 'Language – I (English) - Mock 1', 1, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-lang1-2', 'series-ttet-paper2-soc', 'subj-p2ss-lang1', 'sectional', 'Language – I (English) - Mock 2', 2, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-lang1-3', 'series-ttet-paper2-soc', 'subj-p2ss-lang1', 'sectional', 'Language – I (English) - Mock 3', 3, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-lang1-4', 'series-ttet-paper2-soc', 'subj-p2ss-lang1', 'sectional', 'Language – I (English) - Mock 4', 4, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-lang1-5', 'series-ttet-paper2-soc', 'subj-p2ss-lang1', 'sectional', 'Language – I (English) - Mock 5', 5, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-lang1-6', 'series-ttet-paper2-soc', 'subj-p2ss-lang1', 'sectional', 'Language – I (English) - Mock 6', 6, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-lang1-7', 'series-ttet-paper2-soc', 'subj-p2ss-lang1', 'sectional', 'Language – I (English) - Mock 7', 7, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-lang1-8', 'series-ttet-paper2-soc', 'subj-p2ss-lang1', 'sectional', 'Language – I (English) - Mock 8', 8, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-lang1-9', 'series-ttet-paper2-soc', 'subj-p2ss-lang1', 'sectional', 'Language – I (English) - Mock 9', 9, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-lang1-10', 'series-ttet-paper2-soc', 'subj-p2ss-lang1', 'sectional', 'Language – I (English) - Mock 10', 10, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_subjects (id, series_id, name, sort_order)
VALUES ('subj-p2ss-lang2', 'series-ttet-paper2-soc', 'Language – II (Bengali / Kokborok)', 3)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-lang2-1', 'series-ttet-paper2-soc', 'subj-p2ss-lang2', 'sectional', 'Language – II (Bengali / Kokborok) - Mock 1', 1, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-lang2-2', 'series-ttet-paper2-soc', 'subj-p2ss-lang2', 'sectional', 'Language – II (Bengali / Kokborok) - Mock 2', 2, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-lang2-3', 'series-ttet-paper2-soc', 'subj-p2ss-lang2', 'sectional', 'Language – II (Bengali / Kokborok) - Mock 3', 3, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-lang2-4', 'series-ttet-paper2-soc', 'subj-p2ss-lang2', 'sectional', 'Language – II (Bengali / Kokborok) - Mock 4', 4, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-lang2-5', 'series-ttet-paper2-soc', 'subj-p2ss-lang2', 'sectional', 'Language – II (Bengali / Kokborok) - Mock 5', 5, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-lang2-6', 'series-ttet-paper2-soc', 'subj-p2ss-lang2', 'sectional', 'Language – II (Bengali / Kokborok) - Mock 6', 6, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-lang2-7', 'series-ttet-paper2-soc', 'subj-p2ss-lang2', 'sectional', 'Language – II (Bengali / Kokborok) - Mock 7', 7, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-lang2-8', 'series-ttet-paper2-soc', 'subj-p2ss-lang2', 'sectional', 'Language – II (Bengali / Kokborok) - Mock 8', 8, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-lang2-9', 'series-ttet-paper2-soc', 'subj-p2ss-lang2', 'sectional', 'Language – II (Bengali / Kokborok) - Mock 9', 9, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-lang2-10', 'series-ttet-paper2-soc', 'subj-p2ss-lang2', 'sectional', 'Language – II (Bengali / Kokborok) - Mock 10', 10, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_subjects (id, series_id, name, sort_order)
VALUES ('subj-p2ss-hist', 'series-ttet-paper2-soc', 'History, Political Science & Pedagogical Issues', 4)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-hist-1', 'series-ttet-paper2-soc', 'subj-p2ss-hist', 'sectional', 'History, Political Science & Pedagogical Issues - Mock 1', 1, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-hist-2', 'series-ttet-paper2-soc', 'subj-p2ss-hist', 'sectional', 'History, Political Science & Pedagogical Issues - Mock 2', 2, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-hist-3', 'series-ttet-paper2-soc', 'subj-p2ss-hist', 'sectional', 'History, Political Science & Pedagogical Issues - Mock 3', 3, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-hist-4', 'series-ttet-paper2-soc', 'subj-p2ss-hist', 'sectional', 'History, Political Science & Pedagogical Issues - Mock 4', 4, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-hist-5', 'series-ttet-paper2-soc', 'subj-p2ss-hist', 'sectional', 'History, Political Science & Pedagogical Issues - Mock 5', 5, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-hist-6', 'series-ttet-paper2-soc', 'subj-p2ss-hist', 'sectional', 'History, Political Science & Pedagogical Issues - Mock 6', 6, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-hist-7', 'series-ttet-paper2-soc', 'subj-p2ss-hist', 'sectional', 'History, Political Science & Pedagogical Issues - Mock 7', 7, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-hist-8', 'series-ttet-paper2-soc', 'subj-p2ss-hist', 'sectional', 'History, Political Science & Pedagogical Issues - Mock 8', 8, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-hist-9', 'series-ttet-paper2-soc', 'subj-p2ss-hist', 'sectional', 'History, Political Science & Pedagogical Issues - Mock 9', 9, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-hist-10', 'series-ttet-paper2-soc', 'subj-p2ss-hist', 'sectional', 'History, Political Science & Pedagogical Issues - Mock 10', 10, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-hist-11', 'series-ttet-paper2-soc', 'subj-p2ss-hist', 'sectional', 'History, Political Science & Pedagogical Issues - Mock 11', 11, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-hist-12', 'series-ttet-paper2-soc', 'subj-p2ss-hist', 'sectional', 'History, Political Science & Pedagogical Issues - Mock 12', 12, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-hist-13', 'series-ttet-paper2-soc', 'subj-p2ss-hist', 'sectional', 'History, Political Science & Pedagogical Issues - Mock 13', 13, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-hist-14', 'series-ttet-paper2-soc', 'subj-p2ss-hist', 'sectional', 'History, Political Science & Pedagogical Issues - Mock 14', 14, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-hist-15', 'series-ttet-paper2-soc', 'subj-p2ss-hist', 'sectional', 'History, Political Science & Pedagogical Issues - Mock 15', 15, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-hist-16', 'series-ttet-paper2-soc', 'subj-p2ss-hist', 'sectional', 'History, Political Science & Pedagogical Issues - Mock 16', 16, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-hist-17', 'series-ttet-paper2-soc', 'subj-p2ss-hist', 'sectional', 'History, Political Science & Pedagogical Issues - Mock 17', 17, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-hist-18', 'series-ttet-paper2-soc', 'subj-p2ss-hist', 'sectional', 'History, Political Science & Pedagogical Issues - Mock 18', 18, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-hist-19', 'series-ttet-paper2-soc', 'subj-p2ss-hist', 'sectional', 'History, Political Science & Pedagogical Issues - Mock 19', 19, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-hist-20', 'series-ttet-paper2-soc', 'subj-p2ss-hist', 'sectional', 'History, Political Science & Pedagogical Issues - Mock 20', 20, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_subjects (id, series_id, name, sort_order)
VALUES ('subj-p2ss-geog', 'series-ttet-paper2-soc', 'Geography & Environment (incl. Tripura Geography)', 5)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-geog-1', 'series-ttet-paper2-soc', 'subj-p2ss-geog', 'sectional', 'Geography & Environment (incl. Tripura Geography) - Mock 1', 1, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-geog-2', 'series-ttet-paper2-soc', 'subj-p2ss-geog', 'sectional', 'Geography & Environment (incl. Tripura Geography) - Mock 2', 2, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-geog-3', 'series-ttet-paper2-soc', 'subj-p2ss-geog', 'sectional', 'Geography & Environment (incl. Tripura Geography) - Mock 3', 3, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-geog-4', 'series-ttet-paper2-soc', 'subj-p2ss-geog', 'sectional', 'Geography & Environment (incl. Tripura Geography) - Mock 4', 4, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-geog-5', 'series-ttet-paper2-soc', 'subj-p2ss-geog', 'sectional', 'Geography & Environment (incl. Tripura Geography) - Mock 5', 5, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-geog-6', 'series-ttet-paper2-soc', 'subj-p2ss-geog', 'sectional', 'Geography & Environment (incl. Tripura Geography) - Mock 6', 6, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-geog-7', 'series-ttet-paper2-soc', 'subj-p2ss-geog', 'sectional', 'Geography & Environment (incl. Tripura Geography) - Mock 7', 7, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-geog-8', 'series-ttet-paper2-soc', 'subj-p2ss-geog', 'sectional', 'Geography & Environment (incl. Tripura Geography) - Mock 8', 8, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-geog-9', 'series-ttet-paper2-soc', 'subj-p2ss-geog', 'sectional', 'Geography & Environment (incl. Tripura Geography) - Mock 9', 9, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-geog-10', 'series-ttet-paper2-soc', 'subj-p2ss-geog', 'sectional', 'Geography & Environment (incl. Tripura Geography) - Mock 10', 10, 30, 30, 1, 0, 30, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-series-ttet-paper2-soc-full-1', 'series-ttet-paper2-soc', NULL, 'full', 'T-TET Paper-II: Social Science Stream (For Classes VI to VIII) - Full-Length Mock 1', 1, 150, 150, 1, 0, 150, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-series-ttet-paper2-soc-full-2', 'series-ttet-paper2-soc', NULL, 'full', 'T-TET Paper-II: Social Science Stream (For Classes VI to VIII) - Full-Length Mock 2', 2, 150, 150, 1, 0, 150, 'draft', 'after_window')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;

