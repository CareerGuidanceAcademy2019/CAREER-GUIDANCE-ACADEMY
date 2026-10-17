-- =====================================================================
-- Migration 0008: Comprehensive Security Hardening & IDOR Prevention
-- Career Guidance Academy (C.G.A)
-- =====================================================================

-- 1. PREVENT PRIVILEGE ESCALATION ON PROFILES
-- Prevent non-admins from changing role, student_code, or status
create or replace function public.prevent_self_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.role is distinct from old.role) and not public.is_admin() then
    raise exception 'Unauthorized: Only active administrators can modify account roles.';
  end if;

  if (new.student_code is distinct from old.student_code) and not public.is_admin() then
    raise exception 'Unauthorized: Student code cannot be modified.';
  end if;

  if (new.status is distinct from old.status) and not public.is_admin() then
    raise exception 'Unauthorized: Account status cannot be modified.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_self_role_escalation on public.profiles;
create trigger trg_prevent_self_role_escalation
  before update on public.profiles
  for each row
  execute function public.prevent_self_role_escalation();

-- Tighten profiles update policy
drop policy if exists "profiles: update own or admin" on public.profiles;
create policy "profiles: update own or admin" on public.profiles for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (
    public.is_admin() or (
      id = (select auth.uid()) and
      role = (select p.role from public.profiles p where p.id = (select auth.uid()))
    )
  );

-- 2. HARDEN PAYMENT_SETTINGS ACCESS
-- Disallow anonymous reading of payment_settings; require authenticated session
drop policy if exists "payment_settings: public read" on public.payment_settings;
create policy "payment_settings: authenticated read" on public.payment_settings
  for select to authenticated
  using (true);

-- Ensure admin write only
drop policy if exists "payment_settings: admin update" on public.payment_settings;
create policy "payment_settings: admin update" on public.payment_settings
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 3. REVOKE FUNCTION EXECUTION PRIVILEGES FROM PUBLIC & ANON
revoke execute on function public.purge_candidate(uuid) from public, anon;
grant execute on function public.purge_candidate(uuid) to authenticated;

revoke execute on function public.delete_candidate_by_admin(uuid) from public, anon;
grant execute on function public.delete_candidate_by_admin(uuid) to authenticated;

revoke execute on function public.approve_payment(uuid, numeric) from public, anon;
grant execute on function public.approve_payment(uuid, numeric) to authenticated;

revoke execute on function public.reject_payment(uuid, text) from public, anon;
grant execute on function public.reject_payment(uuid, text) to authenticated;

revoke execute on function public.update_payment_settings_secure(jsonb, text) from public, anon;
grant execute on function public.update_payment_settings_secure(jsonb, text) to authenticated;

revoke execute on function public.submit_mock_attempt(text, jsonb, int) from public, anon;
grant execute on function public.submit_mock_attempt(text, jsonb, int) to authenticated;

-- 4. HARDEN RLS_AUTO_ENABLE SEARCH_PATH
create or replace function public.rls_auto_enable()
returns event_trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
begin
  for r in
    select c.relname
    from pg_event_trigger_ddl_commands() d
    join pg_class c on c.oid = d.objid
    join pg_namespace n on n.oid = c.relnamespace
    where d.command_tag in ('CREATE TABLE', 'CREATE TABLE AS')
      and n.nspname = 'public'
      and c.relkind = 'r'
  loop
    execute format('alter table public.%I enable row level security', r.relname);
  end loop;
end;
$$;

revoke execute on function public.rls_auto_enable() from public, anon;
