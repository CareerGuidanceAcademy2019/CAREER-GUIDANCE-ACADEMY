-- =====================================================================
-- Migration 0022: Database-Enforced Single Active Session & Auth Hardening
-- Career Guidance Academy (C.G.A)
-- =====================================================================

-- 1. Add last_login_at to public.profiles if not present
alter table public.profiles add column if not exists last_login_at timestamptz default now();

-- 2. Revoke execute on legacy phone resolution function from public and anon
revoke execute on function public.resolve_login_email(text, text) from public, anon;

-- 3. Core Session Validator: Check if the calling session is still active in auth.sessions
create or replace function public.is_current_session_active()
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_session_id uuid;
  v_user_id uuid;
  v_exists boolean;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return false;
  end if;

  begin
    v_session_id := ((auth.jwt())->>'session_id')::uuid;
  exception when others then
    v_session_id := null;
  end;

  -- If session_id is found in caller's JWT, confirm it exists in auth.sessions
  if v_session_id is not null then
    select exists(
      select 1 from auth.sessions
      where id = v_session_id and user_id = v_user_id
    ) into v_exists;
    return v_exists;
  end if;

  -- If no session_id is attached (e.g., service role / internal callers), permit
  return true;
end;
$$;

revoke execute on function public.is_current_session_active() from public;
grant execute on function public.is_current_session_active() to authenticated, anon;

-- 4. Session Enforcer: Invalidate older sessions on login and record login timestamp
create or replace function public.enforce_single_session(p_current_session_id uuid default null)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_session_id uuid;
  v_user_id uuid;
  v_surviving_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return false;
  end if;

  -- Acquire per-user advisory xact lock to serialize concurrent logins cleanly
  perform pg_advisory_xact_lock(hashtext(v_user_id::text));

  if p_current_session_id is not null then
    v_session_id := p_current_session_id;
  else
    begin
      v_session_id := ((auth.jwt())->>'session_id')::uuid;
    exception when others then
      v_session_id := null;
    end;
  end if;

  if v_session_id is not null then
    if exists (select 1 from auth.sessions where id = v_session_id and user_id = v_user_id) then
      delete from auth.sessions
      where user_id = v_user_id
        and id <> v_session_id;
    else
      select id into v_surviving_id
      from auth.sessions
      where user_id = v_user_id
      order by created_at desc
      limit 1;

      if v_surviving_id is not null then
        delete from auth.sessions
        where user_id = v_user_id
          and id <> v_surviving_id;
      end if;
    end if;
  end if;

  -- Update timestamp on profile
  update public.profiles
  set last_login_at = now()
  where id = v_user_id;

  return true;
end;
$$;

revoke execute on function public.enforce_single_session(uuid) from public;
grant execute on function public.enforce_single_session(uuid) to authenticated;

-- 5. Student self-service: Log out from all devices
create or replace function public.signout_all_devices()
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  return public.enforce_single_session('00000000-0000-0000-0000-000000000000'::uuid);
end;
$$;

revoke execute on function public.signout_all_devices() from public;
grant execute on function public.signout_all_devices() to authenticated;
