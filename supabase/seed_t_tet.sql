-- Seed script for T-TET Mock Test Series (2026 Batch - Banners & Festival Offer)
-- Generated automatically from src/data/mockSeriesSeedData.ts

INSERT INTO public.mock_series (id, slug, name, class_range, stream, price, batch_label, description, highlights, status, starts_on)
VALUES ('series-ttet-paper1', 't-tet-paper-1', 'Tripura TET: Paper-I 2026 Daily Online Mock Tests Series', 'Classes I to V (Primary Level)', 'Primary Education (CDP, English, Bengali, Math & EVS)', 399, '2026 Batch', 'Daily Online Mock Tests Series for Tripura TET: Paper-I 2026. Weekly 5 Days (Monday to Friday). Features 30+ Sectional Mock Tests (CDP, English, Bengali, Math & EVS) and 02 Full Length Mock Tests with 1200+ MCQs, OMR Sheet for practice, self performance analysis, expert guidance, and doubt clearance through discussion.', '["Weekly 5 Days (Monday to Friday) Online Practice","30+ Sectional Mock Tests (CDP, English, Bengali, Math & EVS)","02 Full Length Mock Tests (Covering Full Syllabus)","1200+ MCQs with OMR Sheet for Practice","Self Performance Analysis & Merit Ranking","Expert''s Guidance & Doubt Clearance through Discussion","Bilingual Questions in English & Bengali (except English & Bengali language papers)","Flexible Admin Scheduled Launch Dates"]'::jsonb, 'Open', 'Flexible / Admin Scheduled (Launch on Demand)')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  batch_label = EXCLUDED.batch_label,
  description = EXCLUDED.description,
  highlights = EXCLUDED.highlights;

INSERT INTO public.mock_series (id, slug, name, class_range, stream, price, batch_label, description, highlights, status, starts_on)
VALUES ('series-ttet-paper2-sci', 't-tet-paper-2-science', 'Tripura TET: Paper-II (Science) 2026 Daily Online Mock Tests Series', 'Classes VI to VIII (Upper Primary)', 'Science & Mathematics (CDP, English, Bengali, Maths & Science)', 499, '2026 Batch', 'Daily Online Mock Tests Series for Tripura TET: Paper-II (Science) 2026. Weekly 5 Days (Monday to Friday). Features 40+ Sectional Mock Tests (CDP, English, Bengali, Maths & Science) and 02 Full Length Mock Tests with 1500+ MCQs, OMR Sheet for practice, self performance analysis, expert guidance, and doubt clearance through discussion.', '["Weekly 5 Days (Monday to Friday) Online Practice","40+ Sectional Mock Tests (CDP, English, Bengali, Maths & Science)","02 Full Length Mock Tests (Covering Full Syllabus)","1500+ MCQs with OMR Sheet for Practice","Self Performance Analysis & Merit Ranking","Expert''s Guidance & Doubt Clearance through Discussion","Bilingual Questions in English & Bengali (except English & Bengali language papers)","Flexible Admin Scheduled Launch Dates"]'::jsonb, 'Open', 'Flexible / Admin Scheduled (Launch on Demand)')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  batch_label = EXCLUDED.batch_label,
  description = EXCLUDED.description,
  highlights = EXCLUDED.highlights;

INSERT INTO public.mock_series (id, slug, name, class_range, stream, price, batch_label, description, highlights, status, starts_on)
VALUES ('series-ttet-paper2-soc', 't-tet-paper-2-social-science', 'Tripura TET: Paper-II (Social Studies) 2026 Daily Online Mock Tests Series', 'Classes VI to VIII (Upper Primary)', 'Social Studies (CDP, English, Bengali, History, Geography & Political Science)', 499, '2026 Batch', 'Daily Online Mock Tests Series for Tripura TET: Paper-II (Social Studies) 2026. Weekly 5 Days (Monday to Friday). Features 40+ Sectional Mock Tests (CDP, English, Bengali, History, Geography & Political Science) and 02 Full Length Mock Tests with 1500+ MCQs, OMR Sheet for practice, self performance analysis, expert guidance, and doubt clearance.', '["Weekly 5 Days (Monday to Friday) Online Practice","40+ Sectional Mock Tests (CDP, English, Bengali, History, Geography & Political Science)","02 Full Length Mock Tests (Covering Full Syllabus)","1500+ MCQs with OMR Sheet for Practice","Self Performance Analysis & Merit Ranking","Expert''s Guidance & Doubt Clearance through Discussion","Bilingual Questions in English & Bengali (except English & Bengali language papers)","Flexible Admin Scheduled Launch Dates"]'::jsonb, 'Open', 'Flexible / Admin Scheduled (Launch on Demand)')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  batch_label = EXCLUDED.batch_label,
  description = EXCLUDED.description,
  highlights = EXCLUDED.highlights;

INSERT INTO public.mock_subjects (id, series_id, name, sort_order)
VALUES ('subj-p1-cdp', 'series-ttet-paper1', 'Child Development & Pedagogy', 1)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO public.mock_subjects (id, series_id, name, sort_order)
VALUES ('subj-p1-lang1', 'series-ttet-paper1', 'Language – I (English)', 2)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO public.mock_subjects (id, series_id, name, sort_order)
VALUES ('subj-p1-lang2', 'series-ttet-paper1', 'Language – II (Bengali)', 3)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO public.mock_subjects (id, series_id, name, sort_order)
VALUES ('subj-p1-math', 'series-ttet-paper1', 'Mathematics (Content & Pedagogy)', 4)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO public.mock_subjects (id, series_id, name, sort_order)
VALUES ('subj-p1-evs', 'series-ttet-paper1', 'Environmental Studies (EVS)', 5)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO public.mock_subjects (id, series_id, name, sort_order)
VALUES ('subj-p2s-cdp', 'series-ttet-paper2-sci', 'Child Development & Pedagogy', 1)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO public.mock_subjects (id, series_id, name, sort_order)
VALUES ('subj-p2s-lang1', 'series-ttet-paper2-sci', 'Language – I (English)', 2)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO public.mock_subjects (id, series_id, name, sort_order)
VALUES ('subj-p2s-lang2', 'series-ttet-paper2-sci', 'Language – II (Bengali)', 3)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO public.mock_subjects (id, series_id, name, sort_order)
VALUES ('subj-p2s-math', 'series-ttet-paper2-sci', 'Mathematics (Content & Pedagogy)', 4)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO public.mock_subjects (id, series_id, name, sort_order)
VALUES ('subj-p2s-sci', 'series-ttet-paper2-sci', 'Science (Physics, Chemistry & Biology)', 5)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO public.mock_subjects (id, series_id, name, sort_order)
VALUES ('subj-p2ss-cdp', 'series-ttet-paper2-soc', 'Child Development & Pedagogy', 1)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO public.mock_subjects (id, series_id, name, sort_order)
VALUES ('subj-p2ss-lang1', 'series-ttet-paper2-soc', 'Language – I (English)', 2)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO public.mock_subjects (id, series_id, name, sort_order)
VALUES ('subj-p2ss-lang2', 'series-ttet-paper2-soc', 'Language – II (Bengali)', 3)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO public.mock_subjects (id, series_id, name, sort_order)
VALUES ('subj-p2ss-hist', 'series-ttet-paper2-soc', 'History & Pedagogical Issues', 4)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO public.mock_subjects (id, series_id, name, sort_order)
VALUES ('subj-p2ss-geog', 'series-ttet-paper2-soc', 'Geography & Environment', 5)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO public.mock_subjects (id, series_id, name, sort_order)
VALUES ('subj-p2ss-pol', 'series-ttet-paper2-soc', 'Political Science & Civics', 6)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-cdp-1', 'series-ttet-paper1', 'subj-p1-cdp', 'sectional', 'Child Development & Pedagogy - Mock 1', 1, 30, 30, 1, 0, 30, 'ready', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-cdp-2', 'series-ttet-paper1', 'subj-p1-cdp', 'sectional', 'Child Development & Pedagogy - Mock 2', 2, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-cdp-3', 'series-ttet-paper1', 'subj-p1-cdp', 'sectional', 'Child Development & Pedagogy - Mock 3', 3, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-cdp-4', 'series-ttet-paper1', 'subj-p1-cdp', 'sectional', 'Child Development & Pedagogy - Mock 4', 4, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-cdp-5', 'series-ttet-paper1', 'subj-p1-cdp', 'sectional', 'Child Development & Pedagogy - Mock 5', 5, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-cdp-6', 'series-ttet-paper1', 'subj-p1-cdp', 'sectional', 'Child Development & Pedagogy - Mock 6', 6, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-lang1-1', 'series-ttet-paper1', 'subj-p1-lang1', 'sectional', 'Language – I (English) - Mock 1', 1, 30, 30, 1, 0, 30, 'ready', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-lang1-2', 'series-ttet-paper1', 'subj-p1-lang1', 'sectional', 'Language – I (English) - Mock 2', 2, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-lang1-3', 'series-ttet-paper1', 'subj-p1-lang1', 'sectional', 'Language – I (English) - Mock 3', 3, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-lang1-4', 'series-ttet-paper1', 'subj-p1-lang1', 'sectional', 'Language – I (English) - Mock 4', 4, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-lang1-5', 'series-ttet-paper1', 'subj-p1-lang1', 'sectional', 'Language – I (English) - Mock 5', 5, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-lang1-6', 'series-ttet-paper1', 'subj-p1-lang1', 'sectional', 'Language – I (English) - Mock 6', 6, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-lang2-1', 'series-ttet-paper1', 'subj-p1-lang2', 'sectional', 'Language – II (Bengali) - Mock 1', 1, 30, 30, 1, 0, 30, 'ready', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-lang2-2', 'series-ttet-paper1', 'subj-p1-lang2', 'sectional', 'Language – II (Bengali) - Mock 2', 2, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-lang2-3', 'series-ttet-paper1', 'subj-p1-lang2', 'sectional', 'Language – II (Bengali) - Mock 3', 3, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-lang2-4', 'series-ttet-paper1', 'subj-p1-lang2', 'sectional', 'Language – II (Bengali) - Mock 4', 4, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-lang2-5', 'series-ttet-paper1', 'subj-p1-lang2', 'sectional', 'Language – II (Bengali) - Mock 5', 5, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-lang2-6', 'series-ttet-paper1', 'subj-p1-lang2', 'sectional', 'Language – II (Bengali) - Mock 6', 6, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-math-1', 'series-ttet-paper1', 'subj-p1-math', 'sectional', 'Mathematics (Content & Pedagogy) - Mock 1', 1, 30, 30, 1, 0, 30, 'ready', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-math-2', 'series-ttet-paper1', 'subj-p1-math', 'sectional', 'Mathematics (Content & Pedagogy) - Mock 2', 2, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-math-3', 'series-ttet-paper1', 'subj-p1-math', 'sectional', 'Mathematics (Content & Pedagogy) - Mock 3', 3, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-math-4', 'series-ttet-paper1', 'subj-p1-math', 'sectional', 'Mathematics (Content & Pedagogy) - Mock 4', 4, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-math-5', 'series-ttet-paper1', 'subj-p1-math', 'sectional', 'Mathematics (Content & Pedagogy) - Mock 5', 5, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-math-6', 'series-ttet-paper1', 'subj-p1-math', 'sectional', 'Mathematics (Content & Pedagogy) - Mock 6', 6, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-evs-1', 'series-ttet-paper1', 'subj-p1-evs', 'sectional', 'Environmental Studies (EVS) - Mock 1', 1, 30, 30, 1, 0, 30, 'ready', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-evs-2', 'series-ttet-paper1', 'subj-p1-evs', 'sectional', 'Environmental Studies (EVS) - Mock 2', 2, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-evs-3', 'series-ttet-paper1', 'subj-p1-evs', 'sectional', 'Environmental Studies (EVS) - Mock 3', 3, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-evs-4', 'series-ttet-paper1', 'subj-p1-evs', 'sectional', 'Environmental Studies (EVS) - Mock 4', 4, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-evs-5', 'series-ttet-paper1', 'subj-p1-evs', 'sectional', 'Environmental Studies (EVS) - Mock 5', 5, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p1-evs-6', 'series-ttet-paper1', 'subj-p1-evs', 'sectional', 'Environmental Studies (EVS) - Mock 6', 6, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-series-ttet-paper1-full-1', 'series-ttet-paper1', NULL, 'full', 'Tripura TET Paper-I Full-Length Mock 1', 1, 150, 150, 1, 0, 150, 'ready', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-series-ttet-paper1-full-2', 'series-ttet-paper1', NULL, 'full', 'Tripura TET Paper-I Full-Length Mock 2', 2, 150, 150, 1, 0, 150, 'ready', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-cdp-1', 'series-ttet-paper2-sci', 'subj-p2s-cdp', 'sectional', 'Child Development & Pedagogy - Mock 1', 1, 30, 30, 1, 0, 30, 'ready', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-cdp-2', 'series-ttet-paper2-sci', 'subj-p2s-cdp', 'sectional', 'Child Development & Pedagogy - Mock 2', 2, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-cdp-3', 'series-ttet-paper2-sci', 'subj-p2s-cdp', 'sectional', 'Child Development & Pedagogy - Mock 3', 3, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-cdp-4', 'series-ttet-paper2-sci', 'subj-p2s-cdp', 'sectional', 'Child Development & Pedagogy - Mock 4', 4, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-cdp-5', 'series-ttet-paper2-sci', 'subj-p2s-cdp', 'sectional', 'Child Development & Pedagogy - Mock 5', 5, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-cdp-6', 'series-ttet-paper2-sci', 'subj-p2s-cdp', 'sectional', 'Child Development & Pedagogy - Mock 6', 6, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-cdp-7', 'series-ttet-paper2-sci', 'subj-p2s-cdp', 'sectional', 'Child Development & Pedagogy - Mock 7', 7, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-cdp-8', 'series-ttet-paper2-sci', 'subj-p2s-cdp', 'sectional', 'Child Development & Pedagogy - Mock 8', 8, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang1-1', 'series-ttet-paper2-sci', 'subj-p2s-lang1', 'sectional', 'Language – I (English) - Mock 1', 1, 30, 30, 1, 0, 30, 'ready', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang1-2', 'series-ttet-paper2-sci', 'subj-p2s-lang1', 'sectional', 'Language – I (English) - Mock 2', 2, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang1-3', 'series-ttet-paper2-sci', 'subj-p2s-lang1', 'sectional', 'Language – I (English) - Mock 3', 3, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang1-4', 'series-ttet-paper2-sci', 'subj-p2s-lang1', 'sectional', 'Language – I (English) - Mock 4', 4, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang1-5', 'series-ttet-paper2-sci', 'subj-p2s-lang1', 'sectional', 'Language – I (English) - Mock 5', 5, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang1-6', 'series-ttet-paper2-sci', 'subj-p2s-lang1', 'sectional', 'Language – I (English) - Mock 6', 6, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang1-7', 'series-ttet-paper2-sci', 'subj-p2s-lang1', 'sectional', 'Language – I (English) - Mock 7', 7, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang1-8', 'series-ttet-paper2-sci', 'subj-p2s-lang1', 'sectional', 'Language – I (English) - Mock 8', 8, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang2-1', 'series-ttet-paper2-sci', 'subj-p2s-lang2', 'sectional', 'Language – II (Bengali) - Mock 1', 1, 30, 30, 1, 0, 30, 'ready', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang2-2', 'series-ttet-paper2-sci', 'subj-p2s-lang2', 'sectional', 'Language – II (Bengali) - Mock 2', 2, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang2-3', 'series-ttet-paper2-sci', 'subj-p2s-lang2', 'sectional', 'Language – II (Bengali) - Mock 3', 3, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang2-4', 'series-ttet-paper2-sci', 'subj-p2s-lang2', 'sectional', 'Language – II (Bengali) - Mock 4', 4, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang2-5', 'series-ttet-paper2-sci', 'subj-p2s-lang2', 'sectional', 'Language – II (Bengali) - Mock 5', 5, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang2-6', 'series-ttet-paper2-sci', 'subj-p2s-lang2', 'sectional', 'Language – II (Bengali) - Mock 6', 6, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang2-7', 'series-ttet-paper2-sci', 'subj-p2s-lang2', 'sectional', 'Language – II (Bengali) - Mock 7', 7, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-lang2-8', 'series-ttet-paper2-sci', 'subj-p2s-lang2', 'sectional', 'Language – II (Bengali) - Mock 8', 8, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-math-1', 'series-ttet-paper2-sci', 'subj-p2s-math', 'sectional', 'Mathematics (Content & Pedagogy) - Mock 1', 1, 30, 30, 1, 0, 30, 'ready', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-math-2', 'series-ttet-paper2-sci', 'subj-p2s-math', 'sectional', 'Mathematics (Content & Pedagogy) - Mock 2', 2, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-math-3', 'series-ttet-paper2-sci', 'subj-p2s-math', 'sectional', 'Mathematics (Content & Pedagogy) - Mock 3', 3, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-math-4', 'series-ttet-paper2-sci', 'subj-p2s-math', 'sectional', 'Mathematics (Content & Pedagogy) - Mock 4', 4, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-math-5', 'series-ttet-paper2-sci', 'subj-p2s-math', 'sectional', 'Mathematics (Content & Pedagogy) - Mock 5', 5, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-math-6', 'series-ttet-paper2-sci', 'subj-p2s-math', 'sectional', 'Mathematics (Content & Pedagogy) - Mock 6', 6, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-math-7', 'series-ttet-paper2-sci', 'subj-p2s-math', 'sectional', 'Mathematics (Content & Pedagogy) - Mock 7', 7, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-math-8', 'series-ttet-paper2-sci', 'subj-p2s-math', 'sectional', 'Mathematics (Content & Pedagogy) - Mock 8', 8, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-sci-1', 'series-ttet-paper2-sci', 'subj-p2s-sci', 'sectional', 'Science (Physics, Chemistry & Biology) - Mock 1', 1, 30, 30, 1, 0, 30, 'ready', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-sci-2', 'series-ttet-paper2-sci', 'subj-p2s-sci', 'sectional', 'Science (Physics, Chemistry & Biology) - Mock 2', 2, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-sci-3', 'series-ttet-paper2-sci', 'subj-p2s-sci', 'sectional', 'Science (Physics, Chemistry & Biology) - Mock 3', 3, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-sci-4', 'series-ttet-paper2-sci', 'subj-p2s-sci', 'sectional', 'Science (Physics, Chemistry & Biology) - Mock 4', 4, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-sci-5', 'series-ttet-paper2-sci', 'subj-p2s-sci', 'sectional', 'Science (Physics, Chemistry & Biology) - Mock 5', 5, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-sci-6', 'series-ttet-paper2-sci', 'subj-p2s-sci', 'sectional', 'Science (Physics, Chemistry & Biology) - Mock 6', 6, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-sci-7', 'series-ttet-paper2-sci', 'subj-p2s-sci', 'sectional', 'Science (Physics, Chemistry & Biology) - Mock 7', 7, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2s-sci-8', 'series-ttet-paper2-sci', 'subj-p2s-sci', 'sectional', 'Science (Physics, Chemistry & Biology) - Mock 8', 8, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-series-ttet-paper2-sci-full-1', 'series-ttet-paper2-sci', NULL, 'full', 'Tripura TET Paper-II (Science) Full-Length Mock 1', 1, 150, 150, 1, 0, 150, 'ready', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-series-ttet-paper2-sci-full-2', 'series-ttet-paper2-sci', NULL, 'full', 'Tripura TET Paper-II (Science) Full-Length Mock 2', 2, 150, 150, 1, 0, 150, 'ready', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-cdp-1', 'series-ttet-paper2-soc', 'subj-p2ss-cdp', 'sectional', 'Child Development & Pedagogy - Mock 1', 1, 30, 30, 1, 0, 30, 'ready', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-cdp-2', 'series-ttet-paper2-soc', 'subj-p2ss-cdp', 'sectional', 'Child Development & Pedagogy - Mock 2', 2, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-cdp-3', 'series-ttet-paper2-soc', 'subj-p2ss-cdp', 'sectional', 'Child Development & Pedagogy - Mock 3', 3, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-cdp-4', 'series-ttet-paper2-soc', 'subj-p2ss-cdp', 'sectional', 'Child Development & Pedagogy - Mock 4', 4, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-cdp-5', 'series-ttet-paper2-soc', 'subj-p2ss-cdp', 'sectional', 'Child Development & Pedagogy - Mock 5', 5, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-cdp-6', 'series-ttet-paper2-soc', 'subj-p2ss-cdp', 'sectional', 'Child Development & Pedagogy - Mock 6', 6, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-cdp-7', 'series-ttet-paper2-soc', 'subj-p2ss-cdp', 'sectional', 'Child Development & Pedagogy - Mock 7', 7, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-lang1-1', 'series-ttet-paper2-soc', 'subj-p2ss-lang1', 'sectional', 'Language – I (English) - Mock 1', 1, 30, 30, 1, 0, 30, 'ready', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-lang1-2', 'series-ttet-paper2-soc', 'subj-p2ss-lang1', 'sectional', 'Language – I (English) - Mock 2', 2, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-lang1-3', 'series-ttet-paper2-soc', 'subj-p2ss-lang1', 'sectional', 'Language – I (English) - Mock 3', 3, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-lang1-4', 'series-ttet-paper2-soc', 'subj-p2ss-lang1', 'sectional', 'Language – I (English) - Mock 4', 4, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-lang1-5', 'series-ttet-paper2-soc', 'subj-p2ss-lang1', 'sectional', 'Language – I (English) - Mock 5', 5, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-lang1-6', 'series-ttet-paper2-soc', 'subj-p2ss-lang1', 'sectional', 'Language – I (English) - Mock 6', 6, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-lang1-7', 'series-ttet-paper2-soc', 'subj-p2ss-lang1', 'sectional', 'Language – I (English) - Mock 7', 7, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-lang2-1', 'series-ttet-paper2-soc', 'subj-p2ss-lang2', 'sectional', 'Language – II (Bengali) - Mock 1', 1, 30, 30, 1, 0, 30, 'ready', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-lang2-2', 'series-ttet-paper2-soc', 'subj-p2ss-lang2', 'sectional', 'Language – II (Bengali) - Mock 2', 2, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-lang2-3', 'series-ttet-paper2-soc', 'subj-p2ss-lang2', 'sectional', 'Language – II (Bengali) - Mock 3', 3, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-lang2-4', 'series-ttet-paper2-soc', 'subj-p2ss-lang2', 'sectional', 'Language – II (Bengali) - Mock 4', 4, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-lang2-5', 'series-ttet-paper2-soc', 'subj-p2ss-lang2', 'sectional', 'Language – II (Bengali) - Mock 5', 5, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-lang2-6', 'series-ttet-paper2-soc', 'subj-p2ss-lang2', 'sectional', 'Language – II (Bengali) - Mock 6', 6, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-lang2-7', 'series-ttet-paper2-soc', 'subj-p2ss-lang2', 'sectional', 'Language – II (Bengali) - Mock 7', 7, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-hist-1', 'series-ttet-paper2-soc', 'subj-p2ss-hist', 'sectional', 'History & Pedagogical Issues - Mock 1', 1, 30, 30, 1, 0, 30, 'ready', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-hist-2', 'series-ttet-paper2-soc', 'subj-p2ss-hist', 'sectional', 'History & Pedagogical Issues - Mock 2', 2, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-hist-3', 'series-ttet-paper2-soc', 'subj-p2ss-hist', 'sectional', 'History & Pedagogical Issues - Mock 3', 3, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-hist-4', 'series-ttet-paper2-soc', 'subj-p2ss-hist', 'sectional', 'History & Pedagogical Issues - Mock 4', 4, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-hist-5', 'series-ttet-paper2-soc', 'subj-p2ss-hist', 'sectional', 'History & Pedagogical Issues - Mock 5', 5, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-hist-6', 'series-ttet-paper2-soc', 'subj-p2ss-hist', 'sectional', 'History & Pedagogical Issues - Mock 6', 6, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-hist-7', 'series-ttet-paper2-soc', 'subj-p2ss-hist', 'sectional', 'History & Pedagogical Issues - Mock 7', 7, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-geog-1', 'series-ttet-paper2-soc', 'subj-p2ss-geog', 'sectional', 'Geography & Environment - Mock 1', 1, 30, 30, 1, 0, 30, 'ready', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-geog-2', 'series-ttet-paper2-soc', 'subj-p2ss-geog', 'sectional', 'Geography & Environment - Mock 2', 2, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-geog-3', 'series-ttet-paper2-soc', 'subj-p2ss-geog', 'sectional', 'Geography & Environment - Mock 3', 3, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-geog-4', 'series-ttet-paper2-soc', 'subj-p2ss-geog', 'sectional', 'Geography & Environment - Mock 4', 4, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-geog-5', 'series-ttet-paper2-soc', 'subj-p2ss-geog', 'sectional', 'Geography & Environment - Mock 5', 5, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-geog-6', 'series-ttet-paper2-soc', 'subj-p2ss-geog', 'sectional', 'Geography & Environment - Mock 6', 6, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-geog-7', 'series-ttet-paper2-soc', 'subj-p2ss-geog', 'sectional', 'Geography & Environment - Mock 7', 7, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-pol-1', 'series-ttet-paper2-soc', 'subj-p2ss-pol', 'sectional', 'Political Science & Civics - Mock 1', 1, 30, 30, 1, 0, 30, 'ready', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-pol-2', 'series-ttet-paper2-soc', 'subj-p2ss-pol', 'sectional', 'Political Science & Civics - Mock 2', 2, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-pol-3', 'series-ttet-paper2-soc', 'subj-p2ss-pol', 'sectional', 'Political Science & Civics - Mock 3', 3, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-pol-4', 'series-ttet-paper2-soc', 'subj-p2ss-pol', 'sectional', 'Political Science & Civics - Mock 4', 4, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-pol-5', 'series-ttet-paper2-soc', 'subj-p2ss-pol', 'sectional', 'Political Science & Civics - Mock 5', 5, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-pol-6', 'series-ttet-paper2-soc', 'subj-p2ss-pol', 'sectional', 'Political Science & Civics - Mock 6', 6, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-subj-p2ss-pol-7', 'series-ttet-paper2-soc', 'subj-p2ss-pol', 'sectional', 'Political Science & Civics - Mock 7', 7, 30, 30, 1, 0, 30, 'draft', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-series-ttet-paper2-soc-full-1', 'series-ttet-paper2-soc', NULL, 'full', 'Tripura TET Paper-II (Social Studies) Full-Length Mock 1', 1, 150, 150, 1, 0, 150, 'ready', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
INSERT INTO public.mock_tests (id, series_id, subject_id, test_type, title, test_no, question_count, total_marks, marks_per_question, negative_marking, duration_minutes, status, show_solutions)
VALUES ('test-series-ttet-paper2-soc-full-2', 'series-ttet-paper2-soc', NULL, 'full', 'Tripura TET Paper-II (Social Studies) Full-Length Mock 2', 2, 150, 150, 1, 0, 150, 'ready', 'after_submit')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  test_type = EXCLUDED.test_type,
  question_count = EXCLUDED.question_count,
  total_marks = EXCLUDED.total_marks,
  duration_minutes = EXCLUDED.duration_minutes;
