-- Career Guidance Academy: three-portal login (Student / Faculty / Admin)
-- Run AFTER 0001-0004 in Supabase Dashboard > SQL Editor.
--
-- What this adds
--   * profiles.role  : 'student' | 'faculty' | 'admin'
--   * profiles.status: 'Active' | 'Inactive' | 'Pending'   (Pending = faculty awaiting approval)
--   * profiles.permanent_address (profiles.address = present address, guardian_name = parent's name)
--   * faculty: link to the faculty's login account, achievements, work ability, approval status
--   * access_allowlist: emails / phone numbers pre-approved as admin or faculty
--   * login with email OR phone + password (resolve_login_email verifies the password in SQL,
--     so phone numbers can never be used to discover someone's email)
--   * admin RPCs to approve / reject faculty
-- No service-role key is required for any of this.

create extension if not exists pgcrypto with schema extensions;

-- ===================================================================== profiles
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('student','faculty','admin'));

alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles
  add constraint profiles_status_check check (status in ('Active','Inactive','Pending'));

alter table public.profiles add column if not exists permanent_address text;

-- Normalised phone: digits only, last 10 digits (so "+91 70059-29189" == "7005929189").
create or replace function public.normalize_phone(p text) returns text
language sql immutable set search_path = '' as $$
  select right(regexp_replace(coalesce(p, ''), '\D', '', 'g'), 10);
$$;

create index if not exists profiles_phone_norm_idx on public.profiles (public.normalize_phone(phone));
create index if not exists profiles_email_lower_idx on public.profiles (lower(email));

-- One account per phone number (skipped silently if legacy duplicates already exist).
do $$
begin
  create unique index if not exists profiles_phone_norm_unique
    on public.profiles (public.normalize_phone(phone))
    where public.normalize_phone(phone) <> '';
exception when unique_violation then
  raise notice 'Duplicate phone numbers exist in profiles; unique index skipped. Clean them up and re-run.';
end $$;

-- ===================================================================== faculty
alter table public.faculty alter column subject set default '';
alter table public.faculty add column if not exists profile_id uuid unique
  references public.profiles(id) on delete set null;
alter table public.faculty add column if not exists achievements text not null default '';
alter table public.faculty add column if not exists work_ability text not null default 'Online & Offline';
alter table public.faculty add column if not exists approval_status text not null default 'Approved';
alter table public.faculty drop constraint if exists faculty_approval_status_check;
alter table public.faculty
  add constraint faculty_approval_status_check check (approval_status in ('Pending','Approved','Rejected'));
alter table public.faculty add column if not exists created_at timestamptz not null default now();

-- Public page shows only approved faculty. (Contact details live in profiles, never in faculty.)
drop policy if exists "faculty: public read" on public.faculty;
drop policy if exists "faculty: anon read approved" on public.faculty;
drop policy if exists "faculty: auth read" on public.faculty;
create policy "faculty: anon read approved" on public.faculty for select to anon
  using (approval_status = 'Approved');
create policy "faculty: auth read" on public.faculty for select to authenticated
  using (approval_status = 'Approved' or profile_id = (select auth.uid()) or public.is_admin());

-- ===================================================================== allowlist
create table if not exists public.access_allowlist (
  id uuid primary key default gen_random_uuid(),
  identifier text not null unique,           -- lower-case email OR 10-digit phone
  role text not null check (role in ('admin','faculty')),
  note text not null default '',
  added_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.access_allowlist enable row level security;
drop policy if exists "allowlist: admin all" on public.access_allowlist;
create policy "allowlist: admin all" on public.access_allowlist for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Store identifiers in canonical form so matching is reliable.
create or replace function public.canonical_identifier(p text) returns text
language sql immutable set search_path = '' as $$
  select case when position('@' in coalesce(p, '')) > 0
              then lower(trim(p))
              else public.normalize_phone(p) end;
$$;

create or replace function public.allowlist_role_for(p_email text, p_phone text) returns text
language sql stable security definer set search_path = '' as $$
  select a.role from public.access_allowlist a
  where a.identifier = lower(trim(coalesce(p_email, '')))
     or (public.normalize_phone(p_phone) <> '' and a.identifier = public.normalize_phone(p_phone))
  order by case a.role when 'admin' then 0 else 1 end
  limit 1;
$$;

-- ===================================================================== helpers
create or replace function public.is_faculty() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'faculty' and status = 'Active');
$$;

-- ===================================================================== signup trigger
-- raw_user_meta_data.account_type chooses the portal: 'student' (default) | 'faculty' | 'admin'.
-- The ROLE is always decided here, in the database, from the allowlist - never by the client.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_type text := lower(coalesce(v_meta->>'account_type', 'student'));
  v_phone text := coalesce(left(v_meta->>'phone', 20), '');
  v_allowed text := public.allowlist_role_for(new.email, v_phone);
  v_role text;
  v_status text := 'Active';
  v_name text := coalesce(nullif(left(v_meta->>'name', 120), ''), split_part(new.email, '@', 1));
begin
  if v_type = 'admin' then
    if v_allowed is distinct from 'admin' then
      raise exception 'ADMIN_NOT_ALLOWED: This email / phone is not on the C.G.A administrator access list.';
    end if;
    v_role := 'admin';
  elsif v_type = 'faculty' then
    v_role := case when v_allowed = 'admin' then 'admin' else 'faculty' end;
    v_status := case when v_allowed in ('admin','faculty') then 'Active' else 'Pending' end;
  else
    v_role := case when v_allowed = 'admin' then 'admin' else 'student' end;
  end if;

  if public.normalize_phone(v_phone) <> '' and exists (
    select 1 from public.profiles where public.normalize_phone(phone) = public.normalize_phone(v_phone)
  ) then
    raise exception 'PHONE_TAKEN: An account with this phone number already exists.';
  end if;

  insert into public.profiles
    (id, role, student_code, name, email, phone, photo,
     guardian_name, address, permanent_address, qualification, target_exam, status)
  values (
    new.id, v_role,
    case when v_role = 'student'
         then 'CGA-' || to_char(now(), 'YYYY') || '-'
              || lpad(nextval('public.student_code_seq')::text, 3, '0') end,
    v_name,
    new.email,
    v_phone,
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    left(v_meta->>'guardian_name', 120),
    left(v_meta->>'address', 300),
    left(v_meta->>'permanent_address', 300),
    left(v_meta->>'qualification', 200),
    left(v_meta->>'target_exam', 120),
    v_status
  );

  if v_role = 'faculty' then
    insert into public.faculty
      (name, designation, subject, qualification, experience, achievements, work_ability,
       photo, bio, profile_id, approval_status)
    values (
      v_name,
      left(v_meta->>'designation', 120),
      coalesce(left(v_meta->>'subject', 120), ''),
      coalesce(left(v_meta->>'qualification', 200), ''),
      coalesce(left(v_meta->>'experience', 500), ''),
      coalesce(left(v_meta->>'achievements', 1000), ''),
      'Online & Offline',
      '',
      '',
      new.id,
      case when v_status = 'Active' then 'Approved' else 'Pending' end
    );
  end if;
  return new;
end $$;

-- ===================================================================== login by phone
-- Returns the account email ONLY when the password is correct, so a phone number alone
-- reveals nothing. The browser then signs in normally with email + password.
create or replace function public.resolve_login_email(p_identifier text, p_password text)
returns text
language plpgsql stable security definer set search_path = '' as $$
declare
  v_email text;
  v_hash text;
begin
  if position('@' in coalesce(p_identifier, '')) > 0 then
    return lower(trim(p_identifier));
  end if;
  if public.normalize_phone(p_identifier) = '' or coalesce(p_password, '') = '' then
    return null;
  end if;

  select u.email, u.encrypted_password into v_email, v_hash
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.normalize_phone(p.phone) = public.normalize_phone(p_identifier)
  limit 1;

  if v_hash is null or extensions.crypt(p_password, v_hash) <> v_hash then
    return null;
  end if;
  return v_email;
end $$;

-- Lets the registration form show a friendly "phone already registered" message
-- (Supabase hides the text of errors raised inside the signup trigger).
create or replace function public.phone_available(p_phone text) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.normalize_phone(p_phone) <> '' and not exists (
    select 1 from public.profiles where public.normalize_phone(phone) = public.normalize_phone(p_phone));
$$;

-- Tells the login screen WHY a signed-in user can't proceed (pending / inactive / wrong portal).
create or replace function public.my_account_state()
returns table (role text, status text)
language sql stable security definer set search_path = '' as $$
  select role, status from public.profiles where id = (select auth.uid());
$$;

-- ===================================================================== admin: faculty approval
create or replace function public.set_faculty_approval(p_profile_id uuid, p_approve boolean)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  update public.profiles
     set status = case when p_approve then 'Active' else 'Inactive' end
   where id = p_profile_id and role = 'faculty';
  if not found then raise exception 'Faculty account not found'; end if;
  update public.faculty
     set approval_status = case when p_approve then 'Approved' else 'Rejected' end
   where profile_id = p_profile_id;
end $$;

-- Admin view of faculty accounts incl. private contact details.
create or replace function public.list_faculty_accounts()
returns table (
  profile_id uuid, faculty_id text, name text, email text, phone text, designation text,
  qualification text, experience text, achievements text, work_ability text,
  status text, approval_status text, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  return query
    select p.id, f.id, p.name, p.email, p.phone, f.designation, f.qualification, f.experience,
           f.achievements, f.work_ability, p.status, f.approval_status, p.created_at
    from public.profiles p
    left join public.faculty f on f.profile_id = p.id
    where p.role = 'faculty'
    order by (p.status = 'Pending') desc, p.created_at desc;
end $$;

-- ===================================================================== allowlist sync
-- Adding someone to the list upgrades an EXISTING account immediately;
-- removing an admin from the list downgrades that account to student.
create or replace function public.sync_allowlist_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op in ('INSERT','UPDATE') then
    new.identifier := public.canonical_identifier(new.identifier);
    if new.identifier = '' then raise exception 'Identifier must be an email or a phone number'; end if;
    if new.role = 'admin' then
      update public.profiles set role = 'admin', status = 'Active'
       where lower(email) = new.identifier
          or (position('@' in new.identifier) = 0 and public.normalize_phone(phone) = new.identifier);
    else
      update public.profiles set status = 'Active'
       where role = 'faculty'
         and (lower(email) = new.identifier
              or (position('@' in new.identifier) = 0 and public.normalize_phone(phone) = new.identifier));
      update public.faculty f set approval_status = 'Approved'
        from public.profiles p
       where f.profile_id = p.id and p.role = 'faculty'
         and (lower(p.email) = new.identifier
              or (position('@' in new.identifier) = 0 and public.normalize_phone(p.phone) = new.identifier));
    end if;
    return new;
  else
    if old.role = 'admin' then
      if exists (select 1 from public.profiles
                  where id = (select auth.uid())
                    and (lower(email) = old.identifier or public.normalize_phone(phone) = old.identifier)) then
        raise exception 'You cannot remove your own administrator access.';
      end if;
      update public.profiles set role = 'student'
       where role = 'admin'
         and public.allowlist_role_for(email, phone) is null
         and (lower(email) = old.identifier
              or (position('@' in old.identifier) = 0 and public.normalize_phone(phone) = old.identifier));
    end if;
    return old;
  end if;
end $$;

drop trigger if exists allowlist_sync_ins on public.access_allowlist;
create trigger allowlist_sync_ins before insert or update on public.access_allowlist
for each row execute function public.sync_allowlist_change();
drop trigger if exists allowlist_sync_del on public.access_allowlist;
create trigger allowlist_sync_del after delete on public.access_allowlist
for each row execute function public.sync_allowlist_change();

-- ===================================================================== grants
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.sync_allowlist_change() from public, anon, authenticated;
revoke execute on function public.allowlist_role_for(text, text) from public, anon, authenticated;
revoke execute on function public.is_faculty() from public, anon;
grant  execute on function public.is_faculty() to authenticated;
revoke execute on function public.resolve_login_email(text, text) from public;
grant  execute on function public.resolve_login_email(text, text) to anon, authenticated;
revoke execute on function public.phone_available(text) from public;
grant  execute on function public.phone_available(text) to anon, authenticated;
revoke execute on function public.my_account_state() from public, anon;
grant  execute on function public.my_account_state() to authenticated;
revoke execute on function public.set_faculty_approval(uuid, boolean) from public, anon;
grant  execute on function public.set_faculty_approval(uuid, boolean) to authenticated;
revoke execute on function public.list_faculty_accounts() from public, anon;
grant  execute on function public.list_faculty_accounts() to authenticated;
