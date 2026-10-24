-- Migration 0021: Unified Test & Series Enrollment Access Gate
-- Ensures both mock test series enrolled students and matching course enrolled students
-- have reciprocal, strictly authorized access to attempt launched mock tests, while
-- unenrolled students are strictly barred.

create or replace function public.get_series_course_ids(p_series_id text)
returns text[] language sql immutable as $$
  select case p_series_id
    when 'series-ttet-paper1' then array['crs-tet-1-online', 'crs-tet-1-offline', 'crs-tet-1', 'series-ttet-paper1']
    when 'series-ttet-paper2-sci' then array['crs-tet-2-sci-online', 'crs-tet-2-sci-offline', 'crs-tet-2-sci', 'series-ttet-paper2-sci']
    when 'series-ttet-paper2-soc' then array['crs-tet-2-sst-online', 'crs-tet-2-sst-offline', 'crs-tet-2-arts-online', 'crs-tet-2-arts-offline', 'crs-tet-2-arts', 'crs-tet-2-soc', 'crs-tet-2-sst', 'series-ttet-paper2-soc']
    when 'series-stgt-soc' then array['crs-stgt-sst-online', 'crs-stgt-sst-offline', 'crs-stgt-sst', 'series-stgt-soc']
    when 'series-stgt-pure-sci' then array['crs-stgt-pure-sci-online', 'crs-stgt-pure-sci-offline', 'crs-stgt-pure-sci', 'series-stgt-pure-sci']
    when 'series-stgt-bio-sci' then array['crs-stgt-bio-sci-online', 'crs-stgt-bio-sci-offline', 'crs-stgt-bio-sci', 'series-stgt-bio-sci']
    when 'series-tpsc-combined' then array['crs-tpsc-combined-online', 'crs-tpsc-combined-offline', 'crs-tpsc-combined', 'crs-jrbt-online', 'crs-jrbt-offline', 'crs-jrbt', 'series-tpsc-combined']
    when 'series-tcs-tps' then array['crs-tcs-tps-online', 'crs-tcs-tps-offline', 'crs-tcs-tps', 'series-tcs-tps']
    when 'series-banking-ssc' then array['crs-banking-online', 'crs-banking-offline', 'crs-banking', 'series-banking-ssc']
    when 'series-school-foundation' then array['crs-school-7', 'crs-school-8', 'crs-school-9', 'crs-school-10', 'series-school-foundation']
    else array[p_series_id]
  end;
$$;

create or replace function public.get_course_series_id(p_course_id text)
returns text language sql immutable as $$
  select case
    when p_course_id in ('crs-tet-1-online', 'crs-tet-1-offline', 'crs-tet-1', 'series-ttet-paper1') then 'series-ttet-paper1'
    when p_course_id in ('crs-tet-2-sci-online', 'crs-tet-2-sci-offline', 'crs-tet-2-sci', 'series-ttet-paper2-sci') then 'series-ttet-paper2-sci'
    when p_course_id in ('crs-tet-2-sst-online', 'crs-tet-2-sst-offline', 'crs-tet-2-arts-online', 'crs-tet-2-arts-offline', 'crs-tet-2-arts', 'crs-tet-2-soc', 'crs-tet-2-sst', 'series-ttet-paper2-soc') then 'series-ttet-paper2-soc'
    when p_course_id in ('crs-stgt-sst-online', 'crs-stgt-sst-offline', 'crs-stgt-sst', 'series-stgt-soc') then 'series-stgt-soc'
    when p_course_id in ('crs-stgt-pure-sci-online', 'crs-stgt-pure-sci-offline', 'crs-stgt-pure-sci', 'series-stgt-pure-sci') then 'series-stgt-pure-sci'
    when p_course_id in ('crs-stgt-bio-sci-online', 'crs-stgt-bio-sci-offline', 'crs-stgt-bio-sci', 'series-stgt-bio-sci') then 'series-stgt-bio-sci'
    when p_course_id in ('crs-tpsc-combined-online', 'crs-tpsc-combined-offline', 'crs-tpsc-combined', 'crs-jrbt-online', 'crs-jrbt-offline', 'crs-jrbt', 'series-tpsc-combined') then 'series-tpsc-combined'
    when p_course_id in ('crs-tcs-tps-online', 'crs-tcs-tps-offline', 'crs-tcs-tps', 'series-tcs-tps') then 'series-tcs-tps'
    when p_course_id in ('crs-banking-online', 'crs-banking-offline', 'crs-banking', 'series-banking-ssc') then 'series-banking-ssc'
    when p_course_id in ('crs-school-7', 'crs-school-8', 'crs-school-9', 'crs-school-10', 'series-school-foundation') then 'series-school-foundation'
    else null
  end;
$$;

-- Update is_series_enrolled to grant access to either series enrollment or matching course enrollment
create or replace function public.is_series_enrolled(p_series_id text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    -- Direct series enrollment
    select 1 from public.series_enrollments
    where student_id = (select auth.uid())
      and series_id = p_series_id
      and (access_valid_until is null or access_valid_until > now())
  ) or exists (
    -- Matching course enrollment that grants mock test series access
    select 1 from public.enrollments e
    join public.profiles p on p.id = e.student_id
    where e.student_id = (select auth.uid())
      and e.course_id = any(public.get_series_course_ids(p_series_id))
      and p.status = 'Active'
      and (e.access_valid_until is null or e.access_valid_until > now())
  );
$$;

-- Update is_enrolled to grant access to either direct course enrollment or matching series enrollment
create or replace function public.is_enrolled(p_course_id text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    -- Direct course enrollment
    select 1 from public.enrollments e
    join public.profiles p on p.id = e.student_id
    where e.student_id = (select auth.uid())
      and e.course_id = p_course_id
      and p.status = 'Active'
      and (e.access_valid_until is null or e.access_valid_until > now())
  ) or exists (
    -- Matching series enrollment
    select 1 from public.series_enrollments se
    where se.student_id = (select auth.uid())
      and se.series_id = public.get_course_series_id(p_course_id)
      and (se.access_valid_until is null or se.access_valid_until > now())
  );
$$;

-- Unified test-level access validator
create or replace function public.is_test_enrolled(p_test_id text) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare
  v_test public.mock_tests%rowtype;
begin
  if public.is_admin() then return true; end if;
  select * into v_test from public.mock_tests where id = p_test_id;
  if not found then return false; end if;

  if v_test.series_id is not null and public.is_series_enrolled(v_test.series_id) then
    return true;
  end if;

  if v_test.course_id is not null and public.is_enrolled(v_test.course_id) then
    return true;
  end if;

  return false;
end;
$$;

-- Update get_test_questions to use unified test enrollment check
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

  -- Verify enrollment using unified test gate
  if not public.is_admin() and not public.is_test_enrolled(p_test_id) then
    raise exception 'Access Restricted: You are not enrolled in this mock test series or matching course.';
  end if;

  -- Verify window using Postgres server time
  if not public.is_admin() then
    if v_test.status <> 'launched' and v_test.status <> 'published' then
      raise exception 'This test is not yet live.';
    end if;
    if v_test.window_start is not null and v_now < v_test.window_start then
      raise exception 'This test is not yet live. Window opens at %', v_test.window_start;
    end if;
    if v_test.window_end is not null and v_now > v_test.window_end then
      raise exception 'Test window has closed at %', v_test.window_end;
    end if;
  end if;

  -- Check or initialize attempt
  select * into v_attempt from public.mock_attempts where test_id = p_test_id and student_id = v_student;
  if found and v_attempt.submitted_at is not null then
    raise exception 'Single Attempt Policy: You have already submitted this mock test.';
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

grant execute on function public.get_series_course_ids(text) to authenticated;
grant execute on function public.get_course_series_id(text) to authenticated;
grant execute on function public.is_series_enrolled(text) to authenticated;
grant execute on function public.is_enrolled(text) to authenticated;
grant execute on function public.is_test_enrolled(text) to authenticated;
grant execute on function public.get_test_questions(text) to authenticated;
