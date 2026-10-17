-- =====================================================================
-- Migration 0009: Security Audit Logging System
-- Career Guidance Academy (C.G.A)
-- =====================================================================

create table if not exists public.security_audit_log (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in (
    'failed_login',
    'permission_denial',
    'rate_limit_exceeded',
    'setting_changed',
    'suspicious_payload',
    'mfa_challenge',
    'idor_attempt'
  )),
  actor_id text,
  actor_email text,
  ip_address text,
  user_agent text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Indexes for quick audit filtering
create index if not exists idx_sec_audit_event on public.security_audit_log (event_type, created_at desc);
create index if not exists idx_sec_audit_actor on public.security_audit_log (actor_email, created_at desc);

-- RLS
alter table public.security_audit_log enable row level security;

drop policy if exists "security_audit_log: admin read" on public.security_audit_log;
create policy "security_audit_log: admin read" on public.security_audit_log
  for select to authenticated
  using (public.is_admin());

drop policy if exists "security_audit_log: insert" on public.security_audit_log;
create policy "security_audit_log: insert" on public.security_audit_log
  for insert to authenticated, anon
  with check (true);

-- Never allow anyone, even admins, to alter or delete security logs (immutable ledger)
drop policy if exists "security_audit_log: immutable" on public.security_audit_log;
create policy "security_audit_log: no update" on public.security_audit_log
  for update to authenticated, anon
  using (false);

create policy "security_audit_log: no delete" on public.security_audit_log
  for delete to authenticated, anon
  using (false);

-- Helper RPC for logging security events
create or replace function public.log_security_event(
  p_event_type text,
  p_details jsonb default '{}'::jsonb,
  p_actor_email text default null,
  p_ip_address text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_masked_email text := null;
begin
  if p_actor_email is not null and length(trim(p_actor_email)) > 0 then
    -- Mask actor email (e.g., a***t@gmail.com) for privacy minimization
    if position('@' in p_actor_email) > 2 then
      v_masked_email := substr(p_actor_email, 1, 1) || '***' || substr(p_actor_email, position('@' in p_actor_email) - 1);
    else
      v_masked_email := p_actor_email;
    end if;
  end if;

  insert into public.security_audit_log (
    event_type,
    actor_id,
    actor_email,
    ip_address,
    details
  ) values (
    p_event_type,
    auth.uid()::text,
    v_masked_email,
    p_ip_address,
    p_details
  ) returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.log_security_event(text, jsonb, text, text) from public;
grant execute on function public.log_security_event(text, jsonb, text, text) to authenticated, anon;
