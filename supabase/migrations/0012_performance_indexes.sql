-- 0012_performance_indexes.sql
-- Optimizing query execution, reducing sequential scans, and mitigating lock contention
-- under heavy concurrent traffic (enrollment, payments, CBT mock tests, exports).

-- 1. Payment Requests indexes for student lookups and admin queue filtering
create index if not exists idx_payment_requests_student_status
  on public.payment_requests(student_id, status);

create index if not exists idx_payment_requests_status_created
  on public.payment_requests(status, created_at desc);

create index if not exists idx_payment_requests_utr_norm
  on public.payment_requests(utr_normalized)
  where utr_normalized is not null;

create index if not exists idx_payment_requests_ref_code
  on public.payment_requests(reference_code);

-- 2. Mock Test CBT Engine indexes
create index if not exists idx_mock_attempts_test_student
  on public.mock_attempts(test_id, student_id);

create index if not exists idx_mock_attempts_student_submitted
  on public.mock_attempts(student_id, submitted_at);

create index if not exists idx_mock_questions_test_pos
  on public.mock_questions(test_id, position);

create index if not exists idx_series_enrollments_student_series
  on public.series_enrollments(student_id, series_id);

-- 3. Core Enrolment & Batch Indexes
create index if not exists idx_enrollments_course_date
  on public.enrollments(course_id, enrolled_date desc);

create index if not exists idx_enrollments_student_course
  on public.enrollments(student_id, course_id);

-- 4. Audit & Rate Limiting Performance
create index if not exists idx_security_audit_created
  on public.security_audit_log(created_at desc);

create index if not exists idx_rate_limit_key_reset
  on public.rate_limit_entries(key, reset_at);
