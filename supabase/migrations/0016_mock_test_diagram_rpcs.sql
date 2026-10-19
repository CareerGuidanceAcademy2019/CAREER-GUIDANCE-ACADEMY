-- Migration 0016: Mock Test Diagrams and Groups RPCs
-- Updates get_test_questions, get_test_solutions, and adds get_admin_preview_test

-- 1. Update get_test_questions to return diagram paths, image dimensions, and shared passage groups
create or replace function public.get_test_questions(p_test_id text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_student uuid := (select auth.uid());
  v_test public.mock_tests%rowtype;
  v_now timestamptz := now();
  v_questions jsonb;
  v_groups jsonb;
  v_attempt public.mock_attempts%rowtype;
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

  -- Fetch shared passage groups
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', g.id,
      'position', g.position,
      'passageText', g.passage_text,
      'imagePath', g.image_path,
      'imageAlt', g.image_alt
    ) order by g.position
  ), '[]'::jsonb) into v_groups
  from public.mock_question_groups g
  where g.test_id = p_test_id;

  -- Fetch question text, options, and diagram fields (strictly strip keys and explanations)
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', q.id,
      'position', q.position,
      'groupId', q.group_id,
      'questionText', q.question_text,
      'options', q.options,
      'questionTextBn', q.question_text_bn,
      'optionsBn', q.options_bn,
      'imagePath', q.image_path,
      'imageAlt', q.image_alt,
      'imageWidth', q.image_width,
      'imageHeight', q.image_height
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
    'questionGroups', v_groups,
    'questions', v_questions
  );
end $$;

-- 2. Update get_test_solutions to return explanation diagrams and passages
create or replace function public.get_test_solutions(p_test_id text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_student uuid := (select auth.uid());
  v_test public.mock_tests%rowtype;
  v_attempt public.mock_attempts%rowtype;
  v_now timestamptz := now();
  v_solutions jsonb;
  v_groups jsonb;
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

    if v_test.show_solutions = 'after_window' and (v_test.window_end is not null and v_now < v_test.window_end) and v_test.status <> 'closed' then
      raise exception 'Solutions will unlock after the test window closes at %', v_test.window_end;
    end if;
  end if;

  -- Fetch shared passage groups
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', g.id,
      'position', g.position,
      'passageText', g.passage_text,
      'imagePath', g.image_path,
      'imageAlt', g.image_alt
    ) order by g.position
  ), '[]'::jsonb) into v_groups
  from public.mock_question_groups g
  where g.test_id = p_test_id;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', q.id,
      'position', q.position,
      'groupId', q.group_id,
      'questionText', q.question_text,
      'options', q.options,
      'questionTextBn', q.question_text_bn,
      'optionsBn', q.options_bn,
      'imagePath', q.image_path,
      'imageAlt', q.image_alt,
      'imageWidth', q.image_width,
      'imageHeight', q.image_height,
      'correctOption', k.correct_option,
      'explanation', k.explanation,
      'explanationBn', k.explanation_bn,
      'explanationImagePath', k.explanation_image_path,
      'explanationImageAlt', k.explanation_image_alt
    ) order by q.position
  ), '[]'::jsonb) into v_solutions
  from public.mock_questions q
  join public.mock_question_keys k on k.question_id = q.id
  where q.test_id = p_test_id;

  return jsonb_build_object(
    'questionGroups', v_groups,
    'questions', v_solutions
  );
end $$;

-- 3. Dedicated Admin-only preview RPC: returns complete test with answer keys and explanations
-- Works for Draft tests and before launch. Never creates an attempt or touches student tables.
create or replace function public.get_admin_preview_test(p_test_id text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_test public.mock_tests%rowtype;
  v_questions jsonb;
  v_groups jsonb;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized: Administrator access required for preview.';
  end if;

  select * into v_test from public.mock_tests where id = p_test_id;
  if not found then raise exception 'Test not found'; end if;

  -- Fetch shared passage groups
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', g.id,
      'position', g.position,
      'passageText', g.passage_text,
      'imagePath', g.image_path,
      'imageAlt', g.image_alt
    ) order by g.position
  ), '[]'::jsonb) into v_groups
  from public.mock_question_groups g
  where g.test_id = p_test_id;

  -- Fetch questions merged with keys
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', q.id,
      'position', q.position,
      'groupId', q.group_id,
      'questionText', q.question_text,
      'options', q.options,
      'questionTextBn', q.question_text_bn,
      'optionsBn', q.options_bn,
      'imagePath', q.image_path,
      'imageAlt', q.image_alt,
      'imageWidth', q.image_width,
      'imageHeight', q.image_height,
      'correctOption', coalesce(k.correct_option, -1),
      'explanation', coalesce(k.explanation, ''),
      'explanationBn', k.explanation_bn,
      'explanationImagePath', k.explanation_image_path,
      'explanationImageAlt', k.explanation_image_alt
    ) order by q.position
  ), '[]'::jsonb) into v_questions
  from public.mock_questions q
  left join public.mock_question_keys k on k.question_id = q.id
  where q.test_id = p_test_id;

  return jsonb_build_object(
    'test', jsonb_build_object(
      'id', v_test.id,
      'title', v_test.title,
      'seriesId', v_test.series_id,
      'subjectId', v_test.subject_id,
      'testType', v_test.test_type,
      'testNo', v_test.test_no,
      'questionCount', v_test.question_count,
      'totalMarks', v_test.total_marks,
      'marksPerQuestion', v_test.marks_per_question,
      'negativeMarking', v_test.negative_marking,
      'durationMinutes', v_test.duration_minutes,
      'status', v_test.status,
      'windowStart', v_test.window_start,
      'windowEnd', v_test.window_end,
      'windowHours', v_test.window_hours,
      'showSolutions', v_test.show_solutions,
      'shuffle', v_test.shuffle
    ),
    'questionGroups', v_groups,
    'questions', v_questions
  );
end $$;
