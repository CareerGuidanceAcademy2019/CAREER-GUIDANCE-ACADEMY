# Implementation Plan - T-TET Mock Test Series Module

**Project:** Career Guidance Academy (C.G.A), Udaipur, Tripura
**Author:** Antigravity Autonomous Agent (Senior Full-Stack Engineer)
**Date:** October 2026
**Target Syllabus:** Strict TRBT T-TET Syllabus (Batch: NOV 2026, Fee: Rs 499/- per course)

---

## 1. Objectives & Scope
Build the complete, production-grade **T-TET Mock Test Series** module end-to-end within the C.G.A platform according to the official flyer specifications:
- **3 Core Packages:**
  1. T-TET Paper-I (Classes I–V, Primary Level): 5 Subjects (10 sectionals each) + 2 Full-Length Mocks (Total: 50 Sectionals + 2 Full Mocks).
  2. T-TET Paper-II Science Stream (Classes VI–VIII): 5 Subjects (10 sectionals each) + 2 Full-Length Mocks (Total: 50 Sectionals + 2 Full Mocks).
  3. T-TET Paper-II Social Science Stream (Classes VI–VIII): 5 Subjects (10, 10, 10, 20, 10) + 2 Full-Length Mocks (Total: 60 Sectionals + 2 Full Mocks).
- **Test Dimensions:** Sectionals: 30 MCQs, 30 Marks, 30 Mins. Full-Length: 150 MCQs, 150 Marks, 150 Mins. No negative marking by default (`negative_marking = 0`).

---

## 2. Six-Phase Execution Roadmap

### Phase 1: Database Migrations, RLS, Purge Cascade & Seeding
1. **Migration (`supabase/migrations/0004_t_tet_mock_series.sql`):**
   - `mock_series`: id, slug, name, class_range, stream, price, batch_label, description, highlights, status, starts_on.
   - `mock_subjects`: id, series_id, name, sort_order.
   - `mock_tests`: id, series_id, subject_id, test_type ('sectional'|'full'), title, test_no, question_count, total_marks, marks_per_question, negative_marking (default 0), duration_minutes, status ('draft'|'ready'|'launched'|'closed'), window_start, window_end, window_hours, show_solutions ('after_submit'|'after_window'), shuffle.
   - `mock_questions`: id, test_id, position, question_text, options, question_text_bn, options_bn.
   - `mock_question_keys`: question_id (PK), correct_option, explanation, explanation_bn (strictly admin-only).
   - `series_enrollments`: id, student_id, series_id, payment_id, enrolled_at, UNIQUE(student_id, series_id).
   - `mock_attempts`: id, test_id, student_id, started_at, submitted_at, answers, score, correct_count, wrong_count, unattempted_count, accuracy, time_taken_seconds, rank, UNIQUE(test_id, student_id).
   - `mock_launch_log`: id, test_id, admin_id, action, window_start, window_end, created_at.
   - Update `delete_candidate_by_admin` to cascade across `mock_attempts` and `series_enrollments`.
   - Security Definer RPCs: `submit_mock_attempt`, `get_test_questions`, `get_test_solutions`, `enrol_in_series`.
2. **Seed Script (`scripts/seed_t_tet_series.mjs`):**
   - Idempotent seed script inserting the 3 series, all 15 subjects, and 166 test rows as draft placeholders.
3. **Phase Validation:**
   - Run typecheck, lint, and test scripts.
   - Commit Phase 1 with a clear message and log in `docs/BUILD_LOG.md`.

### Phase 2: Public Pages, Enrolment, Razorpay & Receipts
1. **Public Marketing Pages:**
   - `/mock-tests`: Series cards with pricing, highlights, subjects list, test count badges, and Enroll button.
   - `/mock-tests/[seriesSlug]`: Detailed syllabus overview without exposing test questions.
2. **Payment & Enrolment Flow:**
   - Feature flag `NEXT_PUBLIC_ENABLE_RAZORPAY`.
   - Razorpay server order creation (`/api/payments/razorpay/order`) and webhook signature verification (`/api/payments/razorpay/webhook`).
   - Fallback simulated payment checkout with server-side validation.
   - Official C.G.A receipt issuance (`REC-YYYY-XXXX`).
3. **Phase Validation:**
   - Typecheck, commit, and update `docs/BUILD_LOG.md`.

### Phase 3: Admin Management & Question Upload with Review Screen
1. **Admin CRUD:**
   - `/admin/mock-tests`: Series, Subject, and Test management (Draft -> Ready -> Launched -> Closed).
2. **Question Ingestion & Parser:**
   - At `/admin/mock-tests/[testId]/questions`: Upload PDF, DOCX, TXT, CSV, XLSX.
   - Downloadable strict CSV/Excel template with Bengali Unicode columns.
   - Mandatory Review screen with warnings (count mismatch, duplicates, missing answers).
   - Admin approval before saving to `mock_questions` and `mock_question_keys`.
3. **Phase Validation:**
   - Unit tests for parser (PDF, CSV, Bengali text). Typecheck and commit.

### Phase 4: Launch Windows, Student Views, CBT Engine & Scorecard
1. **Launch Window Management:**
   - Modal to set window (6h, 12h, 24h, custom) and start time (immediate or scheduled).
   - Log actions to `mock_launch_log`.
2. **Student Portal:**
   - `/student/mock-tests` & `/student/mock-tests/[seriesSlug]`: Protected by series enrollment checks.
   - Subject sections + Full-Length Mocks.
   - Test badges: Upcoming (countdown), Live (Start), Attempted (Score), Missed.
3. **CBT Engine:**
   - Full exam screen, timer capped at window_end, server-side start time persistence, auto-submit on timeout.
   - Security: Answers computed server-side via `submit_mock_attempt()`.
   - Scorecard with accuracy, topic weak spots, rank after window close.
4. **Phase Validation:**
   - Scoring unit tests (0 negative marking and non-zero). Typecheck and commit.

### Phase 5: Admin Results & Exports
1. `/admin/mock-tests/[testId]/results`: Results table, non-attempted student list, CSV/Excel export.
2. Consolidated series-level export.
3. Strict 403 authorization for non-admin callers.
4. Phase Validation, commit, and update `docs/BUILD_LOG.md`.

### Phase 6: Browser Verification, Testing & Final Report
1. Verify 7 non-negotiable acceptance checks with browser screenshots.
2. Generate `docs/FINAL_REPORT.md` and complete handoff.
