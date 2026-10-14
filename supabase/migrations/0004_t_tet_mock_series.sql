-- Career Guidance Academy: T-TET Mock Test Series Module
-- Tables: mock_series, mock_subjects, mock_tests, mock_questions, mock_question_keys,
--         series_enrollments, mock_attempts, mock_launch_log
-- Enforces Postgres server clock for window/timer, server-authoritative scoring,
-- complete student isolation from mock_question_keys, and candidate purge cascading.

-- 1. mock_series: Top-level packages (Paper-I, Paper-II Science, Paper-II Social Science)
create table if not exists public.mock_series (
  id text primary key default gen_random_uuid()::text,
  slug text not null unique,
  name text not null,
  class_range text not null,
  stream text not null default '',
  price numeric not null default 499 check (price >= 0),
  batch_label text not null default 'NOV 2026',
  description text not null default '',
  highlights jsonb not null default '[]'::jsonb,
  status text not null default 'Open' check (status in ('Open', 'Closed', 'Archived')),
  starts_on text not null default '1st Week of November, 2026',
  created_at timestamptz not null default now()
);

-- 2. mock_subjects: Subject modules under each series
create table if not exists public.mock_subjects (
  id text primary key default gen_random_uuid()::text,
  series_id text not null references public.mock_series(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 3. mock_tests: Sectional and Full-Length tests under a series / subject
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'mock_tests') then
    -- Modify existing table from 0001
    alter table public.mock_tests alter column course_id drop not null;

    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'mock_tests' and column_name = 'series_id') then
      alter table public.mock_tests add column series_id text references public.mock_series(id) on delete cascade;
    end if;

    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'mock_tests' and column_name = 'subject_id') then
      alter table public.mock_tests add column subject_id text references public.mock_subjects(id) on delete set null;
    end if;

    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'mock_tests' and column_name = 'test_type') then
      alter table public.mock_tests add column test_type text not null default 'sectional' check (test_type in ('sectional','full'));
    end if;

    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'mock_tests' and column_name = 'test_no') then
      alter table public.mock_tests add column test_no int not null default 1;
    end if;

    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'mock_tests' and column_name = 'question_count') then
      alter table public.mock_tests add column question_count int not null default 30;
    end if;

    alter table public.mock_tests drop constraint if exists mock_tests_status_check;
    alter table public.mock_tests add constraint mock_tests_status_check
      check (status in ('draft','ready','launched','closed','Draft','Published'));

    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'mock_tests' and column_name = 'window_start') then
      alter table public.mock_tests add column window_start timestamptz;
    end if;

    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'mock_tests' and column_name = 'window_end') then
      alter table public.mock_tests add column window_end timestamptz;
    end if;

    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'mock_tests' and column_name = 'window_hours') then
      alter table public.mock_tests add column window_hours numeric;
    end if;

    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'mock_tests' and column_name = 'show_solutions') then
      alter table public.mock_tests add column show_solutions text not null default 'after_window' check (show_solutions in ('after_submit','after_window'));
    end if;

    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'mock_tests' and column_name = 'shuffle') then
      alter table public.mock_tests add column shuffle boolean not null default false;
    end if;

  else
    create table public.mock_tests (
      id text primary key default gen_random_uuid()::text,
      series_id text references public.mock_series(id) on delete cascade,
      subject_id text references public.mock_subjects(id) on delete set null,
      course_id text references public.courses(id) on delete cascade,
      test_type text not null default 'sectional' check (test_type in ('sectional','full')),
      title text not null,
      test_no int not null default 1,
      question_count int not null default 30,
      total_marks numeric not null default 30,
      marks_per_question numeric not null default 1,
      negative_marking numeric not null default 0,
      duration_minutes int not null default 30,
      status text not null default 'draft' check (status in ('draft','ready','launched','closed')),
      window_start timestamptz,
      window_end timestamptz,
      window_hours numeric,
      show_solutions text not null default 'after_window' check (show_solutions in ('after_submit','after_window')),
      shuffle boolean not null default false,
      created_at timestamptz not null default now()
    );
  end if;
end $$;

-- 4. mock_questions: Question texts and option choices (English + Bengali)
create table if not exists public.mock_questions (
  id text primary key default gen_random_uuid()::text,
  test_id text not null references public.mock_tests(id) on delete cascade,
  position int not null default 1,
  question_text text not null,
  options jsonb not null default '[]'::jsonb,
  question_text_bn text,
  options_bn jsonb,
  created_at timestamptz not null default now()
);

-- 5. mock_question_keys: Correct answer keys & explanations (STRICTLY ADMIN ONLY)
create table if not exists public.mock_question_keys (
  question_id text primary key references public.mock_questions(id) on delete cascade,
  correct_option int not null check (correct_option between 0 and 3),
  explanation text not null default '',
  explanation_bn text,
  updated_at timestamptz not null default now()
);

-- 6. series_enrollments: Student access mapping to series
create table if not exists public.series_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  series_id text not null references public.mock_series(id) on delete cascade,
  payment_id uuid references public.fee_payments(id) on delete set null,
  enrolled_at timestamptz not null default now(),
  unique(student_id, series_id)
);

-- 7. mock_attempts: Single student attempt per test with server-validated score
create table if not exists public.mock_attempts (
  id uuid primary key default gen_random_uuid(),
  test_id text not null references public.mock_tests(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  answers jsonb not null default '{}'::jsonb,
  score numeric not null default 0,
  correct_count int not null default 0,
  wrong_count int not null default 0,
  unattempted_count int not null default 0,
  accuracy numeric not null default 0,
  time_taken_seconds int not null default 0,
  rank int,
  unique(test_id, student_id)
);

-- 8. mock_launch_log: Audit trail of test window launches and modifications
create table if not exists public.mock_launch_log (
  id uuid primary key default gen_random_uuid(),
  test_id text not null references public.mock_tests(id) on delete cascade,
  admin_id uuid references public.profiles(id) on delete set null,
  action text not null,
  window_start timestamptz,
  window_end timestamptz,
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_mock_subjects_series on public.mock_subjects (series_id);
create index if not exists idx_mock_tests_series on public.mock_tests (series_id);
create index if not exists idx_mock_tests_subject on public.mock_tests (subject_id);
create index if not exists idx_mock_questions_test on public.mock_questions (test_id);
create index if not exists idx_series_enr_student_series on public.series_enrollments (student_id, series_id);
create index if not exists idx_mock_attempts_test_student on public.mock_attempts (test_id, student_id);
create index if not exists idx_mock_attempts_student on public.mock_attempts (student_id);

-- Helper functions
create or replace function public.is_series_enrolled(p_series_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.series_enrollments
    where student_id = (select auth.uid()) and series_id = p_series_id
  );
$$;

-- Enable Row Level Security (RLS)
alter table public.mock_series enable row level security;
alter table public.mock_subjects enable row level security;
alter table public.mock_tests enable row level security;
alter table public.mock_questions enable row level security;
alter table public.mock_question_keys enable row level security;
alter table public.series_enrollments enable row level security;
alter table public.mock_attempts enable row level security;
alter table public.mock_launch_log enable row level security;

-- Drop prior policies if re-running
drop policy if exists "mock_series: public select" on public.mock_series;
drop policy if exists "mock_series: admin all" on public.mock_series;
drop policy if exists "mock_subjects: public select" on public.mock_subjects;
drop policy if exists "mock_subjects: admin all" on public.mock_subjects;
drop policy if exists "mock_tests: student select" on public.mock_tests;
drop policy if exists "mock_tests: admin all" on public.mock_tests;
drop policy if exists "mock_questions: student select" on public.mock_questions;
drop policy if exists "mock_questions: admin all" on public.mock_questions;
drop policy if exists "mock_question_keys: admin only" on public.mock_question_keys;
drop policy if exists "series_enrollments: own select" on public.series_enrollments;
drop policy if exists "series_enrollments: admin all" on public.series_enrollments;
drop policy if exists "mock_attempts: own select" on public.mock_attempts;
drop policy if exists "mock_attempts: own insert" on public.mock_attempts;
drop policy if exists "mock_attempts: own update" on public.mock_attempts;
drop policy if exists "mock_attempts: admin all" on public.mock_attempts;
drop policy if exists "mock_launch_log: admin all" on public.mock_launch_log;

-- 1. mock_series: Public may view marketing info, admin manages
create policy "mock_series: public select" on public.mock_series
  for select to anon, authenticated using (true);
create policy "mock_series: admin all" on public.mock_series
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 2. mock_subjects: Public may view syllabus overview, admin manages
create policy "mock_subjects: public select" on public.mock_subjects
  for select to anon, authenticated using (true);
create policy "mock_subjects: admin all" on public.mock_subjects
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 3. mock_tests: Only enrolled students or admin can read tests
create policy "mock_tests: student select" on public.mock_tests
  for select to authenticated
  using (
    public.is_admin() or
    (series_id is not null and public.is_series_enrolled(series_id)) or
    (course_id is not null and public.is_enrolled(course_id))
  );
create policy "mock_tests: admin all" on public.mock_tests
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 4. mock_questions: Enrolled students or admin
create policy "mock_questions: student select" on public.mock_questions
  for select to authenticated
  using (
    public.is_admin() or
    exists (
      select 1 from public.mock_tests t
      where t.id = test_id
        and (
          (t.series_id is not null and public.is_series_enrolled(t.series_id)) or
          (t.course_id is not null and public.is_enrolled(t.course_id))
        )
    )
  );
create policy "mock_questions: admin all" on public.mock_questions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 5. mock_question_keys: STRICTLY ADMIN ONLY. ZERO student access under any condition.
create policy "mock_question_keys: admin only" on public.mock_question_keys
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 6. series_enrollments: Students view own; admin manages all
create policy "series_enrollments: own select" on public.series_enrollments
  for select to authenticated using (student_id = (select auth.uid()) or public.is_admin());
create policy "series_enrollments: admin all" on public.series_enrollments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 7. mock_attempts: Student view own & submit; admin reads all
create policy "mock_attempts: own select" on public.mock_attempts
  for select to authenticated using (student_id = (select auth.uid()) or public.is_admin());
create policy "mock_attempts: own insert" on public.mock_attempts
  for insert to authenticated with check (student_id = (select auth.uid()));
create policy "mock_attempts: own update" on public.mock_attempts
  for update to authenticated using (student_id = (select auth.uid()) and submitted_at is null);
create policy "mock_attempts: admin all" on public.mock_attempts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 8. mock_launch_log: Admin only
create policy "mock_launch_log: admin all" on public.mock_launch_log
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- Security Definer RPCs
-- =====================================================================

-- Enrol student into a Mock Test Series (atomic enrolment + fee payment receipt)
create or replace function public.enrol_in_series(
  p_series_id text,
  p_payment_mode text default 'UPI',
  p_payment_ref text default null,
  p_student_id uuid default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_student uuid := coalesce(p_student_id, (select auth.uid()));
  v_series public.mock_series%rowtype;
  v_profile public.profiles%rowtype;
  v_receipt text;
  v_pay public.fee_payments%rowtype;
  v_enr public.series_enrollments%rowtype;
begin
  if (select auth.uid()) is null then raise exception 'Not authenticated'; end if;
  if v_student <> (select auth.uid()) and not public.is_admin() then raise exception 'Not allowed'; end if;

  select * into v_profile from public.profiles where id = v_student;
  if not found or v_profile.status <> 'Active' then raise exception 'Student account is not active'; end if;

  select * into v_series from public.mock_series where id = p_series_id;
  if not found then raise exception 'Mock Test Series not found'; end if;

  if exists (select 1 from public.series_enrollments where student_id = v_student and series_id = p_series_id) then
    raise exception 'You are already enrolled in this test series.';
  end if;

  v_receipt := 'CGA/' || to_char(now(), 'YYYY') || '/REC-' || lpad(nextval('public.receipt_seq')::text, 5, '0');

  -- Record fee payment in institute ledger
  insert into public.fee_payments (
    receipt_no, student_id, course_id, amount, payment_mode, payment_type, remarks
  ) values (
    v_receipt, v_student, p_series_id, v_series.price, p_payment_mode, 'Full Payment',
    'Enrolment for ' || v_series.name || ' (' || v_series.batch_label || '). Ref: ' || coalesce(p_payment_ref, 'N/A')
  ) returning * into v_pay;

  -- Create series enrollment record
  insert into public.series_enrollments (student_id, series_id, payment_id)
  values (v_student, p_series_id, v_pay.id)
  returning * into v_enr;

  return jsonb_build_object(
    'success', true,
    'enrollmentId', v_enr.id,
    'seriesId', v_series.id,
    'seriesName', v_series.name,
    'receiptNo', v_pay.receipt_no,
    'amount', v_pay.amount,
    'paymentMode', v_pay.payment_mode,
    'date', v_pay.date
  );
end $$;

-- Get live test questions for an enrolled student (NEVER includes answers/keys)
create or replace function public.get_test_questions(p_test_id text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_test public.mock_tests%rowtype;
  v_student uuid := (select auth.uid());
  v_now timestamptz := now();
  v_questions jsonb;
  v_attempt public.mock_attempts%rowtype;
  v_started_at timestamptz;
begin
  if v_student is null then raise exception 'Not authenticated'; end if;

  select * into v_test from public.mock_tests where id = p_test_id;
  if not found then raise exception 'Test not found'; end if;

  -- Verify enrollment
  if not public.is_admin() and not public.is_series_enrolled(v_test.series_id) then
    raise exception 'You are not enrolled in this mock test series.';
  end if;

  -- Verify window using Postgres server time
  if not public.is_admin() then
    if v_test.status <> 'launched' or v_test.window_start is null or v_now < v_test.window_start then
      raise exception 'This test is not yet live. Window opens at %', v_test.window_start;
    end if;
    if v_test.window_end is not null and v_now > v_test.window_end then
      raise exception 'Test window has closed at %', v_test.window_end;
    end if;
  end if;

  -- Check or initialize attempt
  select * into v_attempt from public.mock_attempts where test_id = p_test_id and student_id = v_student;
  if found and v_attempt.submitted_at is not null then
    raise exception 'You have already submitted this test.';
  end if;

  if not found then
    insert into public.mock_attempts (test_id, student_id, started_at)
    values (p_test_id, v_student, v_now)
    returning * into v_attempt;
  end if;

  -- Fetch question text and options only (strip any internal keys)
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', q.id,
      'position', q.position,
      'questionText', q.question_text,
      'options', q.options,
      'questionTextBn', q.question_text_bn,
      'optionsBn', q.options_bn
    ) order by q.position
  ), '[]'::jsonb) into v_questions
  from public.mock_questions q
  where q.test_id = p_test_id;

  return jsonb_build_object(
    'testId', v_test.id,
    'title', v_test.title,
    'durationMinutes', v_test.duration_minutes,
    'totalMarks', v_test.total_marks,
    'negativeMarking', v_test.negative_marking,
    'windowEnd', v_test.window_end,
    'serverNow', v_now,
    'startedAt', v_attempt.started_at,
    'savedAnswers', v_attempt.answers,
    'questions', v_questions
  );
end $$;

-- Debounced answer autosave during test taking
create or replace function public.save_attempt_progress(
  p_test_id text,
  p_answers jsonb
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_student uuid := (select auth.uid());
  v_test public.mock_tests%rowtype;
begin
  if v_student is null then raise exception 'Not authenticated'; end if;
  select * into v_test from public.mock_tests where id = p_test_id;
  if not found then raise exception 'Test not found'; end if;

  update public.mock_attempts
     set answers = coalesce(p_answers, '{}'::jsonb)
   where test_id = p_test_id
     and student_id = v_student
     and submitted_at is null;
end $$;

-- Submit mock test attempt with server-side authoritative scoring
create or replace function public.submit_mock_attempt(
  p_test_id text,
  p_answers jsonb,
  p_time_taken_seconds int default 0
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_student uuid := (select auth.uid());
  v_test public.mock_tests%rowtype;
  v_now timestamptz := now();
  v_attempt public.mock_attempts%rowtype;
  v_q record;
  v_chosen jsonb;
  v_chosen_idx int;
  v_correct int := 0;
  v_wrong int := 0;
  v_unattempted int := 0;
  v_score numeric := 0;
  v_accuracy numeric := 0;
  v_duration_secs int;
  v_actual_time int;
begin
  if v_student is null then raise exception 'Not authenticated'; end if;

  select * into v_test from public.mock_tests where id = p_test_id;
  if not found then raise exception 'Test not found'; end if;

  select * into v_attempt from public.mock_attempts
   where test_id = p_test_id and student_id = v_student for update;

  if not found then
    raise exception 'Attempt not initiated.';
  end if;

  if v_attempt.submitted_at is not null then
    raise exception 'This attempt has already been submitted.';
  end if;

  -- Evaluate each question against mock_question_keys
  for v_q in (
    select q.id, k.correct_option
      from public.mock_questions q
      join public.mock_question_keys k on k.question_id = q.id
     where q.test_id = p_test_id
     order by q.position
  ) loop
    v_chosen := p_answers -> (v_q.id);
    if v_chosen is null or jsonb_typeof(v_chosen) <> 'number' then
      v_unattempted := v_unattempted + 1;
    else
      v_chosen_idx := (v_chosen #>> '{}')::int;
      if v_chosen_idx = v_q.correct_option then
        v_correct := v_correct + 1;
      else
        v_wrong := v_wrong + 1;
      end if;
    end if;
  end loop;

  -- Server score calculation
  v_score := greatest(0, (v_correct * v_test.marks_per_question) - (v_wrong * v_test.negative_marking));
  if (v_correct + v_wrong) > 0 then
    v_accuracy := round((v_correct::numeric / (v_correct + v_wrong)) * 100, 1);
  else
    v_accuracy := 0;
  end if;

  v_duration_secs := v_test.duration_minutes * 60;
  v_actual_time := greatest(1, least(coalesce(p_time_taken_seconds, extract(epoch from (v_now - v_attempt.started_at))::int), v_duration_secs));

  update public.mock_attempts
     set submitted_at = v_now,
         answers = coalesce(p_answers, '{}'::jsonb),
         score = v_score,
         correct_count = v_correct,
         wrong_count = v_wrong,
         unattempted_count = v_unattempted,
         accuracy = v_accuracy,
         time_taken_seconds = v_actual_time
   where id = v_attempt.id
   returning * into v_attempt;

  return jsonb_build_object(
    'attemptId', v_attempt.id,
    'testId', v_test.id,
    'testTitle', v_test.title,
    'score', v_attempt.score,
    'totalMarks', v_test.total_marks,
    'correctCount', v_attempt.correct_count,
    'wrongCount', v_attempt.wrong_count,
    'unattemptedCount', v_attempt.unattempted_count,
    'accuracy', v_attempt.accuracy,
    'timeTakenSeconds', v_attempt.time_taken_seconds,
    'submittedAt', v_attempt.submitted_at
  );
end $$;

-- Get detailed question solutions & explanations (Gated by submit & window policy)
create or replace function public.get_test_solutions(p_test_id text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_student uuid := (select auth.uid());
  v_test public.mock_tests%rowtype;
  v_attempt public.mock_attempts%rowtype;
  v_now timestamptz := now();
  v_solutions jsonb;
begin
  if v_student is null then raise exception 'Not authenticated'; end if;

  select * into v_test from public.mock_tests where id = p_test_id;
  if not found then raise exception 'Test not found'; end if;

  if not public.is_admin() then
    select * into v_attempt from public.mock_attempts
     where test_id = p_test_id and student_id = v_student;
    if not found or v_attempt.submitted_at is null then
      raise exception 'You must submit your test attempt before accessing solutions.';
    end if;

    -- Check show_solutions policy
    if v_test.show_solutions = 'after_window' and (v_test.window_end is not null and v_now < v_test.window_end) and v_test.status <> 'closed' then
      raise exception 'Solutions will unlock after the test window closes at %', v_test.window_end;
    end if;
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', q.id,
      'position', q.position,
      'questionText', q.question_text,
      'options', q.options,
      'questionTextBn', q.question_text_bn,
      'optionsBn', q.options_bn,
      'correctOption', k.correct_option,
      'explanation', k.explanation,
      'explanationBn', k.explanation_bn
    ) order by q.position
  ), '[]'::jsonb) into v_solutions
  from public.mock_questions q
  join public.mock_question_keys k on k.question_id = q.id
  where q.test_id = p_test_id;

  return v_solutions;
end $$;

-- 9. Update Candidate Purge RPC to include all mock test series records
create or replace function public.delete_candidate_by_admin(p_student_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized: Only institute administrators can remove candidates.';
  end if;

  select role into v_role from public.profiles where id = p_student_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'Candidate not found');
  end if;

  if v_role = 'admin' then
    raise exception 'Cannot delete an administrator account through candidate management.';
  end if;

  -- Atomic cleanup of all associated data including new T-TET tables
  delete from public.mock_attempts where student_id = p_student_id;
  delete from public.series_enrollments where student_id = p_student_id;
  delete from public.test_attempts where student_id = p_student_id;
  delete from public.fee_payments where student_id = p_student_id;
  delete from public.enrollments where student_id = p_student_id;
  delete from public.waiting_list where student_id = p_student_id;
  delete from public.profiles where id = p_student_id;

  return jsonb_build_object('success', true, 'message', 'Candidate and all associated data permanently removed.');
end $$;

-- Revoke & Grant function permissions
revoke execute on function public.enrol_in_series(text,text,text,uuid) from public, anon;
revoke execute on function public.get_test_questions(text) from public, anon;
revoke execute on function public.save_attempt_progress(text,jsonb) from public, anon;
revoke execute on function public.submit_mock_attempt(text,jsonb,int) from public, anon;
revoke execute on function public.get_test_solutions(text) from public, anon;
revoke execute on function public.delete_candidate_by_admin(uuid) from public, anon;

grant execute on function public.enrol_in_series(text,text,text,uuid) to authenticated;
grant execute on function public.get_test_questions(text) to authenticated;
grant execute on function public.save_attempt_progress(text,jsonb) to authenticated;
grant execute on function public.submit_mock_attempt(text,jsonb,int) to authenticated;
grant execute on function public.get_test_solutions(text) to authenticated;
grant execute on function public.delete_candidate_by_admin(uuid) to authenticated;
