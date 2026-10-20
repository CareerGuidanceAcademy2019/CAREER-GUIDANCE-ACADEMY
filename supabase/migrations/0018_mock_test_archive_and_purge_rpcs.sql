-- Migration 0018: Mock Test Lifecycle, Archive, Storage Meter and Purge RPCs
-- Career Guidance Academy (C.G.A) Udaipur

-- 1. RPC: purge_mock_test
create or replace function public.purge_mock_test(p_test_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  v_img_paths text[];
  v_opt_paths text[];
  v_q record;
  v_key record;
  v_att_count int;
  v_corr_count int;
  v_wrg_count int;
  v_avg_sec numeric;
  v_total_test_sec numeric;
  v_total_attempts int;
  v_q_count int;
begin
  -- Authorization: admin or service_role only
  if not (public.is_admin() or auth.role() = 'service_role') then
    raise exception 'Unauthorized: Only administrators can purge mock tests';
  end if;

  -- Verify test exists
  if not exists (select 1 from public.mock_tests where id = p_test_id) then
    raise exception 'Test % not found', p_test_id;
  end if;

  -- Gather all diagram image paths from questions, groups, keys, and options
  select array_agg(image_path) into v_img_paths
  from (
    select image_path from public.mock_questions where test_id = p_test_id and image_path is not null
    union
    select image_path from public.mock_question_groups where test_id = p_test_id and image_path is not null
    union
    select k.explanation_image_path from public.mock_question_keys k
    join public.mock_questions q on q.id = k.question_id
    where q.test_id = p_test_id and k.explanation_image_path is not null
  ) as t;

  -- Also collect option images from options jsonb array
  select array_agg(opt->>'image_path') into v_opt_paths
  from public.mock_questions q,
  jsonb_array_elements(q.options) as opt
  where q.test_id = p_test_id and (opt->>'image_path') is not null;

  if v_opt_paths is not null then
    v_img_paths := array_cat(coalesce(v_img_paths, '{}'::text[]), v_opt_paths);
  end if;

  -- Calculate aggregated question-level statistics from mock_attempts
  select count(*), coalesce(avg(time_taken_seconds), 0)
  into v_total_attempts, v_total_test_sec
  from public.mock_attempts
  where test_id = p_test_id and submitted_at is not null;

  select count(*) into v_q_count
  from public.mock_questions
  where test_id = p_test_id;

  if v_q_count > 0 then
    v_avg_sec := round(v_total_test_sec / v_q_count, 1);
  else
    v_avg_sec := 0;
  end if;

  for v_q in (select id, position from public.mock_questions where test_id = p_test_id order by position) loop
    select correct_option into v_key
    from public.mock_question_keys
    where question_id = v_q.id;

    -- Count attempts for this question
    select
      count(*) filter (where (answers->>v_q.id) is not null or (answers->>(v_q.position - 1)::text) is not null),
      count(*) filter (where (answers->>v_q.id)::int = v_key.correct_option or (answers->>(v_q.position - 1)::text)::int = v_key.correct_option),
      count(*) filter (where ((answers->>v_q.id) is not null and (answers->>v_q.id)::int != v_key.correct_option) or
                             ((answers->>(v_q.position - 1)::text) is not null and (answers->>(v_q.position - 1)::text)::int != v_key.correct_option))
    into v_att_count, v_corr_count, v_wrg_count
    from public.mock_attempts
    where test_id = p_test_id and submitted_at is not null;

    insert into public.mock_test_question_stats (
      test_id,
      position,
      subject_tag,
      attempted_count,
      correct_count,
      wrong_count,
      average_time_seconds
    ) values (
      p_test_id,
      v_q.position,
      '',
      coalesce(v_att_count, 0),
      coalesce(v_corr_count, 0),
      coalesce(v_wrg_count, 0),
      v_avg_sec
    ) on conflict (test_id, position) do update set
      attempted_count = excluded.attempted_count,
      correct_count = excluded.correct_count,
      wrong_count = excluded.wrong_count,
      average_time_seconds = excluded.average_time_seconds;
  end loop;

  -- Delete mock_questions and mock_question_groups (keys cascade from questions)
  delete from public.mock_questions where test_id = p_test_id;
  delete from public.mock_question_groups where test_id = p_test_id;

  -- Update test status to 'purged'
  update public.mock_tests
  set content_status = 'purged'
  where id = p_test_id;

  return jsonb_build_object(
    'success', true,
    'testId', p_test_id,
    'deletedImages', coalesce(v_img_paths, '{}'::text[])
  );
end;
$$;

grant execute on function public.purge_mock_test to authenticated, service_role;

-- 2. RPC: get_storage_meter_stats
create or replace function public.get_storage_meter_stats()
returns jsonb
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  v_total_q bigint;
  v_draft_t bigint;
  v_active_t bigint;
  v_expired_t bigint;
  v_purged_t bigint;
  v_img_count bigint;
  v_img_bytes bigint;
  v_paper_count bigint;
  v_paper_bytes bigint;
  v_upcoming_purges jsonb;
begin
  if not (public.is_admin() or auth.role() = 'service_role') then
    raise exception 'Unauthorized: Only administrators can view storage meter stats';
  end if;

  select count(*) into v_total_q from public.mock_questions;

  select
    count(*) filter (where content_status = 'draft'),
    count(*) filter (where content_status = 'active'),
    count(*) filter (where content_status = 'expired'),
    count(*) filter (where content_status = 'purged')
  into v_draft_t, v_active_t, v_expired_t, v_purged_t
  from public.mock_tests;

  select count(*), coalesce(sum((metadata->>'size')::bigint), 0)
  into v_img_count, v_img_bytes
  from storage.objects
  where bucket_id = 'mock-question-images';

  select count(*), coalesce(sum(file_size_bytes), 0)
  into v_paper_count, v_paper_bytes
  from public.mock_question_papers;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', t.id,
    'title', t.title,
    'contentStatus', t.content_status,
    'purgeAfter', t.purge_after,
    'retentionDays', t.retention_days,
    'archiveDownloadedAt', t.archive_downloaded_at,
    'purgeRequiresArchive', t.purge_requires_archive
  ) order by t.purge_after asc), '[]'::jsonb)
  into v_upcoming_purges
  from public.mock_tests t
  where t.content_status != 'purged' and t.purge_after is not null
  limit 15;

  return jsonb_build_object(
    'totalQuestions', v_total_q,
    'tests', jsonb_build_object(
      'draft', v_draft_t,
      'active', v_active_t,
      'expired', v_expired_t,
      'purged', v_purged_t
    ),
    'images', jsonb_build_object(
      'count', v_img_count,
      'bytes', v_img_bytes
    ),
    'papers', jsonb_build_object(
      'count', v_paper_count,
      'bytes', v_paper_bytes
    ),
    'upcomingPurges', v_upcoming_purges
  );
end;
$$;

grant execute on function public.get_storage_meter_stats to authenticated, service_role;

-- 3. RPC: extend_mock_test_retention
create or replace function public.extend_mock_test_retention(p_test_id text, p_days int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_purge timestamptz;
begin
  if not (public.is_admin() or auth.role() = 'service_role') then
    raise exception 'Unauthorized';
  end if;

  update public.mock_tests
  set purge_after = coalesce(purge_after, now()) + (p_days || ' days')::interval,
      retention_days = retention_days + p_days
  where id = p_test_id
  returning purge_after into v_new_purge;

  return jsonb_build_object('success', true, 'purgeAfter', v_new_purge);
end;
$$;

grant execute on function public.extend_mock_test_retention to authenticated, service_role;
