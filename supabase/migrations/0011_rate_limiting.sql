-- =====================================================================
-- Migration 0011: Serverless Atomic Rate Limiting System
-- Career Guidance Academy (C.G.A)
-- Works across serverless and edge nodes without requiring external Redis
-- =====================================================================

create table if not exists public.rate_limit_entries (
  key text primary key,
  count integer not null default 1,
  reset_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Index for expiration cleanup
create index if not exists idx_rate_limit_reset on public.rate_limit_entries (reset_at);

-- RLS
alter table public.rate_limit_entries enable row level security;

-- Only service role and internal functions can access raw table directly
drop policy if exists "rate_limit_entries: deny all direct client access" on public.rate_limit_entries;
create policy "rate_limit_entries: deny all direct client access" on public.rate_limit_entries
  for all to public
  using (false);

-- Atomic sliding window rate limiter function
create or replace function public.check_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := now();
  v_entry record;
  v_allowed boolean;
  v_remaining integer;
  v_reset_secs integer;
  v_retry_after integer := 0;
begin
  -- Validate inputs
  if p_key is null or length(trim(p_key)) = 0 then
    raise exception 'Rate limit key cannot be empty.';
  end if;
  if p_limit <= 0 then
    p_limit := 10;
  end if;
  if p_window_seconds <= 0 then
    p_window_seconds := 60;
  end if;

  -- Lock row for update or insert new
  select * into v_entry
  from public.rate_limit_entries
  where key = p_key
  for update;

  if not found or v_now >= v_entry.reset_at then
    -- Window expired or brand new key -> reset counter
    insert into public.rate_limit_entries (key, count, reset_at, created_at)
    values (
      p_key,
      1,
      v_now + (p_window_seconds || ' seconds')::interval,
      v_now
    )
    on conflict (key) do update
    set count = 1,
        reset_at = excluded.reset_at,
        created_at = excluded.created_at;

    v_allowed := true;
    v_remaining := p_limit - 1;
    v_reset_secs := p_window_seconds;
  else
    -- Inside existing active window
    v_reset_secs := greatest(1, ceil(extract(epoch from (v_entry.reset_at - v_now)))::integer);

    if v_entry.count < p_limit then
      update public.rate_limit_entries
      set count = count + 1
      where key = p_key;

      v_allowed := true;
      v_remaining := p_limit - (v_entry.count + 1);
    else
      -- Limit exceeded
      v_allowed := false;
      v_remaining := 0;
      v_retry_after := v_reset_secs;

      -- Log security audit event for rate limit violation
      perform public.log_security_event(
        'rate_limit_exceeded',
        jsonb_build_object(
          'key', p_key,
          'limit', p_limit,
          'window_seconds', p_window_seconds,
          'retry_after', v_retry_after
        )
      );
    end if;
  end if;

  return jsonb_build_object(
    'allowed', v_allowed,
    'limit', p_limit,
    'remaining', v_remaining,
    'resetSeconds', v_reset_secs,
    'retryAfter', v_retry_after
  );
end;
$$;

-- Grant execution to authenticated and anon so serverless edge handlers can enforce limits
grant execute on function public.check_rate_limit(text, integer, integer) to authenticated, anon;

-- Auto cleanup procedure for expired rate limit entries (callable by pg_cron or periodic jobs)
create or replace function public.prune_expired_rate_limits()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_pruned integer;
begin
  delete from public.rate_limit_entries
  where reset_at < (now() - interval '1 hour');
  get diagnostics v_pruned = row_count;
  return v_pruned;
end;
$$;
