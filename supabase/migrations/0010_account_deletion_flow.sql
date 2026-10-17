-- =====================================================================
-- Migration 0010: Account Deletion Flow (DPDP Act 2023)
-- Career Guidance Academy (C.G.A)
-- Ties student account deletion requests to purge_candidate()
-- =====================================================================

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  student_name text not null,
  student_email text not null,
  student_code text,
  reason text,
  guardian_consent_verified boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'completed')),
  admin_notes text,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid references public.profiles(id)
);

-- Index
create index if not exists idx_del_req_status on public.account_deletion_requests (status, created_at desc);
create index if not exists idx_del_req_student on public.account_deletion_requests (student_id);

-- RLS
alter table public.account_deletion_requests enable row level security;

drop policy if exists "account_deletion_requests: student read own" on public.account_deletion_requests;
create policy "account_deletion_requests: student read own" on public.account_deletion_requests
  for select to authenticated
  using (student_id = auth.uid() or public.is_admin());

drop policy if exists "account_deletion_requests: student insert own" on public.account_deletion_requests;
create policy "account_deletion_requests: student insert own" on public.account_deletion_requests
  for insert to authenticated
  with check (student_id = auth.uid());

drop policy if exists "account_deletion_requests: admin update" on public.account_deletion_requests;
create policy "account_deletion_requests: admin update" on public.account_deletion_requests
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- RPC for students to request deletion
create or replace function public.request_account_deletion(
  p_reason text default null,
  p_guardian_consent boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid;
  v_prof record;
  v_req_id uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Authentication required to request account deletion.';
  end if;

  select name, email, student_code into v_prof
  from public.profiles
  where id = v_uid;

  if not found then
    raise exception 'Profile not found for current session.';
  end if;

  insert into public.account_deletion_requests (
    student_id,
    student_name,
    student_email,
    student_code,
    reason,
    guardian_consent_verified,
    status
  ) values (
    v_uid,
    v_prof.name,
    v_prof.email,
    v_prof.student_code,
    p_reason,
    coalesce(p_guardian_consent, false),
    'pending'
  )
  returning id into v_req_id;

  -- Log security event
  perform public.log_security_event(
    'setting_changed',
    jsonb_build_object(
      'action', 'account_deletion_requested',
      'request_id', v_req_id,
      'student_id', v_uid
    ),
    v_prof.email
  );

  return v_req_id;
end;
$$;

revoke execute on function public.request_account_deletion(text, boolean) from public, anon;
grant execute on function public.request_account_deletion(text, boolean) to authenticated;

-- RPC for admin to process and execute purge_candidate()
create or replace function public.process_account_deletion(
  p_request_id uuid,
  p_action text,
  p_admin_notes text default null
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_req record;
  v_admin_uid uuid;
begin
  if not public.is_admin() then
    raise exception 'Only administrators may process account deletion requests.';
  end if;

  v_admin_uid := auth.uid();

  select * into v_req
  from public.account_deletion_requests
  where id = p_request_id;

  if not found then
    raise exception 'Deletion request % not found.', p_request_id;
  end if;

  if p_action = 'approve' then
    -- Execute permanent purge of candidate data
    perform public.purge_candidate(v_req.student_id);

    update public.account_deletion_requests
    set status = 'completed',
        admin_notes = p_admin_notes,
        processed_at = now(),
        processed_by = v_admin_uid
    where id = p_request_id;

    return true;
  elsif p_action = 'reject' then
    update public.account_deletion_requests
    set status = 'rejected',
        admin_notes = p_admin_notes,
        processed_at = now(),
        processed_by = v_admin_uid
    where id = p_request_id;

    return true;
  else
    raise exception 'Invalid action: %. Must be approve or reject.', p_action;
  end if;
end;
$$;

revoke execute on function public.process_account_deletion(uuid, text, text) from public, anon;
grant execute on function public.process_account_deletion(uuid, text, text) to authenticated;
