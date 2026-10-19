-- 0014_admin_edit_faculty.sql
-- Allow verified administrators to edit faculty details (designation, qualification, experience, work ability, achievements, subject, status)
-- and view/approve faculty accounts in the portal.

-- 1. Ensure is_admin supports service role as well as active admin profiles
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'),
    false
  ) or exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin' and status = 'Active'
  );
$$;

-- 2. Faculty approval toggle
create or replace function public.set_faculty_approval(p_profile_id uuid, p_approve boolean)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  update public.profiles
     set status = case when p_approve then 'Active' else 'Inactive' end
   where id = p_profile_id and (role = 'faculty' or exists (select 1 from public.faculty where profile_id = p_profile_id));
  if not found then raise exception 'Faculty account not found'; end if;
  update public.faculty
     set approval_status = case when p_approve then 'Approved' else 'Rejected' end
   where profile_id = p_profile_id;
end $$;

revoke execute on function public.set_faculty_approval(uuid, boolean) from public, anon;
grant execute on function public.set_faculty_approval(uuid, boolean) to authenticated;

-- 3. Comprehensive listing of faculty accounts
create or replace function public.list_faculty_accounts()
returns table (
  profile_id uuid, faculty_id text, name text, email text, phone text, designation text,
  qualification text, experience text, achievements text, work_ability text,
  status text, approval_status text, created_at timestamptz, subject text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  return query
    select distinct on (p.id)
           p.id as profile_id,
           f.id as faculty_id,
           coalesce(f.name, p.name) as name,
           p.email,
           p.phone,
           coalesce(f.designation, 'Faculty Member') as designation,
           coalesce(f.qualification, p.qualification, '') as qualification,
           coalesce(f.experience, '') as experience,
           coalesce(f.achievements, '') as achievements,
           coalesce(f.work_ability, 'Online & Offline') as work_ability,
           p.status,
           coalesce(f.approval_status, case when p.status = 'Active' then 'Approved' else 'Pending' end) as approval_status,
           p.created_at,
           coalesce(f.subject, '') as subject
    from public.profiles p
    left join public.faculty f on f.profile_id = p.id
    where p.role = 'faculty' or f.profile_id is not null
    order by p.id, (p.status = 'Pending') desc, p.created_at desc;
end $$;

revoke execute on function public.list_faculty_accounts() from public, anon;
grant execute on function public.list_faculty_accounts() to authenticated;

-- 4. Admin update faculty account details (Designation, Qualification, Experience, etc.)
create or replace function public.cga_admin_update_faculty_account(
  p_profile_id uuid,
  p_name text,
  p_phone text,
  p_designation text,
  p_qualification text,
  p_experience text,
  p_work_ability text,
  p_achievements text,
  p_subject text default '',
  p_status text default null
)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_faculty_id text;
begin
  if not public.is_admin() then
    raise exception 'UNAUTHORIZED: Administrator privileges required.';
  end if;

  -- Update profile
  update public.profiles
     set name = coalesce(nullif(trim(p_name), ''), name),
         phone = coalesce(nullif(trim(p_phone), ''), phone),
         qualification = coalesce(nullif(trim(p_qualification), ''), qualification),
         status = case when p_status in ('Active', 'Pending', 'Inactive') then p_status else status end
   where id = p_profile_id;

  -- Update or insert into public.faculty
  select id into v_faculty_id from public.faculty where profile_id = p_profile_id limit 1;

  if v_faculty_id is not null then
    update public.faculty
       set name = coalesce(nullif(trim(p_name), ''), name),
           designation = coalesce(nullif(trim(p_designation), ''), 'Faculty Member'),
           qualification = coalesce(nullif(trim(p_qualification), ''), qualification),
           experience = coalesce(nullif(trim(p_experience), ''), experience),
           work_ability = coalesce(nullif(trim(p_work_ability), ''), 'Online & Offline'),
           achievements = coalesce(trim(p_achievements), achievements),
           subject = case when nullif(trim(p_subject), '') is not null then trim(p_subject) else subject end,
           approval_status = case when p_status = 'Inactive' then 'Rejected' when p_status = 'Active' then 'Approved' else approval_status end
     where id = v_faculty_id;
  else
    insert into public.faculty (
      profile_id,
      name,
      designation,
      qualification,
      experience,
      work_ability,
      achievements,
      subject,
      approval_status
    ) values (
      p_profile_id,
      coalesce(nullif(trim(p_name), ''), 'Faculty Member'),
      coalesce(nullif(trim(p_designation), ''), 'Faculty Member'),
      coalesce(nullif(trim(p_qualification), ''), ''),
      coalesce(nullif(trim(p_experience), ''), ''),
      coalesce(nullif(trim(p_work_ability), ''), 'Online & Offline'),
      coalesce(trim(p_achievements), ''),
      coalesce(trim(p_subject), ''),
      case when p_status = 'Inactive' then 'Rejected' else 'Approved' end
    );
  end if;

  return jsonb_build_object('success', true);
end;
$$;

revoke execute on function public.cga_admin_update_faculty_account(uuid, text, text, text, text, text, text, text, text, text) from public, anon;
grant execute on function public.cga_admin_update_faculty_account(uuid, text, text, text, text, text, text, text, text, text) to authenticated;
