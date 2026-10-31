-- 0025_mock_test_attempts_allowed_and_retakes.sql
-- Enables administrators to configure multiple attempts allowed (e.g. 1, 2, 3, or unlimited) per mock test
-- and allows enrolled students to reattempt tests up to the configured limit.

alter table public.mock_tests
  add column if not exists attempts_allowed int not null default 1 check (attempts_allowed >= 1);

alter table public.mock_attempts
  drop constraint if exists mock_attempts_test_id_student_id_key;

alter table public.mock_attempts
  add column if not exists attempt_number int not null default 1;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'mock_attempts_test_student_attempt_key'
  ) then
    alter table public.mock_attempts
      add constraint mock_attempts_test_student_attempt_key
      unique (test_id, student_id, attempt_number);
  end if;
end $$;

CREATE OR REPLACE FUNCTION public.submit_mock_attempt(p_test_id text, p_answers jsonb, p_time_taken_seconds integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
declare
  v_student uuid := (select auth.uid());
  v_test public.mock_tests%rowtype;
  v_now timestamptz := now();
  v_attempt public.mock_attempts%rowtype;
  v_submitted_count int := 0;
  v_max_attempts int := 1;
  v_q record;
  v_q_json jsonb;
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
  if not public.is_current_session_active() then
    raise exception 'SESSION_REVOKED: Your account has been signed in on another device.';
  end if;

  -- Set trusted submission flag to satisfy guard trigger
  PERFORM set_config('cga.trusted_submit', 'true', true);

  select * into v_test from public.mock_tests where id = p_test_id;
  if not found then raise exception 'Test not found'; end if;

  v_max_attempts := coalesce(v_test.attempts_allowed, 1);

  -- Check existing submitted attempts count
  select count(*) into v_submitted_count
    from public.mock_attempts
   where test_id = p_test_id and student_id = v_student and submitted_at is not null;

  -- Find active in-progress attempt
  select * into v_attempt from public.mock_attempts
   where test_id = p_test_id and student_id = v_student and submitted_at is null
   order by started_at desc
   limit 1
   for update;

  if not found then
    if v_submitted_count >= v_max_attempts then
      raise exception 'Maximum attempts reached (% allowed).', v_max_attempts;
    end if;

    insert into public.mock_attempts (test_id, student_id, started_at, attempt_number)
    values (p_test_id, v_student, v_now - (greatest(1, coalesce(p_time_taken_seconds, 60)) * interval '1 second'), v_submitted_count + 1)
    returning * into v_attempt;
  end if;

  -- Evaluate each question against mock_question_keys if present, otherwise against mock_tests.questions
  if exists (select 1 from public.mock_questions where test_id = p_test_id) then
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
  elsif v_test.questions is not null and jsonb_typeof(v_test.questions) = 'array' then
    for v_q_json in select * from jsonb_array_elements(v_test.questions) loop
      v_chosen := p_answers -> (v_q_json ->> 'id');
      if v_chosen is null or jsonb_typeof(v_chosen) <> 'number' then
        v_unattempted := v_unattempted + 1;
      else
        v_chosen_idx := (v_chosen #>> '{}')::int;
        if v_chosen_idx = (v_q_json ->> 'correctOptionIndex')::int then
          v_correct := v_correct + 1;
        else
          v_wrong := v_wrong + 1;
        end if;
      end if;
    end loop;
  end if;

  -- Server score calculation
  v_score := greatest(0, (v_correct * coalesce(v_test.marks_per_question, 1)) - (v_wrong * coalesce(v_test.negative_marking, 0)));
  if (v_correct + v_wrong) > 0 then
    v_accuracy := round((v_correct::numeric / (v_correct + v_wrong)) * 100, 1);
  else
    v_accuracy := 0;
  end if;

  v_duration_secs := coalesce(v_test.duration_minutes, 60) * 60;
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

  -- Synchronize into test_attempts as well
  insert into public.test_attempts
    (id, test_id, student_id, score, total_marks, correct_count, wrong_count, unattempted_count,
     accuracy, time_taken_minutes, submitted_at, answers)
  values
    (v_attempt.id, p_test_id, v_student, v_score, coalesce(v_test.total_marks, 30), v_correct, v_wrong,
     v_unattempted, v_accuracy, greatest(1, round(v_actual_time::numeric / 60)), v_now,
     coalesce(p_answers, '{}'::jsonb))
  on conflict (id) do update set
    score = excluded.score,
    total_marks = excluded.total_marks,
    correct_count = excluded.correct_count,
    wrong_count = excluded.wrong_count,
    unattempted_count = excluded.unattempted_count,
    accuracy = excluded.accuracy,
    time_taken_minutes = excluded.time_taken_minutes,
    submitted_at = excluded.submitted_at,
    answers = excluded.answers;

  return jsonb_build_object(
    'attemptId', v_attempt.id,
    'testId', v_test.id,
    'testTitle', v_test.title,
    'attemptNumber', coalesce(v_attempt.attempt_number, 1),
    'attemptsAllowed', v_max_attempts,
    'score', v_attempt.score,
    'totalMarks', coalesce(v_test.total_marks, 30),
    'correctCount', v_attempt.correct_count,
    'wrongCount', v_attempt.wrong_count,
    'unattemptedCount', v_attempt.unattempted_count,
    'accuracy', v_attempt.accuracy,
    'timeTakenSeconds', v_attempt.time_taken_seconds,
    'submittedAt', v_attempt.submitted_at
  );
end $function$;

