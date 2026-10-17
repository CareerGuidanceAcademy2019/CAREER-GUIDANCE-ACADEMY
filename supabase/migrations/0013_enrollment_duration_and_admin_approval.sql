-- Migration 0013: Enrollment Duration, Batch Access Control & Admin Registration Verification
-- Career Guidance Academy (C.G.A) Udaipur

-- =====================================================================
-- 1. ENROLLMENT DURATION / ACCESS VALIDITY COLUMNS
-- =====================================================================

alter table public.enrollments
  add column if not exists access_valid_until timestamptz not null default (now() + interval '6 months');

alter table public.series_enrollments
  add column if not exists access_valid_until timestamptz not null default (now() + interval '6 months');

create index if not exists idx_enrollments_student_course_valid
  on public.enrollments (student_id, course_id, access_valid_until);

create index if not exists idx_series_enrollments_student_valid
  on public.series_enrollments (student_id, series_id, access_valid_until);

-- =====================================================================
-- 2. UPDATE ACCESS GATES (COURSE & TEST SERIES) TO ENFORCE DURATION
-- =====================================================================

create or replace function public.is_enrolled(p_course_id text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.enrollments e
    join public.profiles p on p.id = e.student_id
    where e.student_id = (select auth.uid())
      and e.course_id = p_course_id
      and p.status = 'Active'
      and e.access_valid_until > now());
$$;

create or replace function public.is_series_enrolled(p_series_id text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.series_enrollments
    where student_id = (select auth.uid())
      and series_id = p_series_id
      and access_valid_until > now());
$$;

-- =====================================================================
-- 3. ADMIN RPCs: BATCH & STUDENT DURATION CONTROLS
-- =====================================================================

-- Admin update of validity for an entire batch (all enrolled students)
create or replace function public.cga_update_batch_duration(
  p_course_id text,
  p_new_valid_until timestamptz
) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_count integer;
begin
  if not public.is_admin() then
    raise exception 'UNAUTHORIZED: Only institute administrators can manage batch access duration.';
  end if;

  if p_new_valid_until is null then
    raise exception 'INVALID_ARGUMENT: Expiration timestamp cannot be null.';
  end if;

  update public.enrollments
     set access_valid_until = p_new_valid_until
   where course_id = p_course_id;

  get diagnostics v_count = row_count;
  return v_count;
end $$;

-- Admin extension of batch duration by X months
create or replace function public.cga_extend_batch_duration_months(
  p_course_id text,
  p_months integer
) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_count integer;
begin
  if not public.is_admin() then
    raise exception 'UNAUTHORIZED: Only institute administrators can extend batch access duration.';
  end if;

  if p_months is null or p_months <= 0 then
    raise exception 'INVALID_ARGUMENT: Extension months must be a positive integer.';
  end if;

  update public.enrollments
     set access_valid_until = access_valid_until + (p_months || ' months')::interval
   where course_id = p_course_id;

  get diagnostics v_count = row_count;
  return v_count;
end $$;

-- Admin update for an individual student's course enrollment duration
create or replace function public.cga_update_student_enrollment_duration(
  p_enrollment_id uuid,
  p_new_valid_until timestamptz
) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'UNAUTHORIZED: Only institute administrators can manage enrollment duration.';
  end if;

  update public.enrollments
     set access_valid_until = p_new_valid_until
   where id = p_enrollment_id;

  return found;
end $$;

-- Admin update for an individual student's series enrollment duration
create or replace function public.cga_update_series_enrollment_duration(
  p_series_enrollment_id uuid,
  p_new_valid_until timestamptz
) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'UNAUTHORIZED: Only institute administrators can manage test series duration.';
  end if;

  update public.series_enrollments
     set access_valid_until = p_new_valid_until
   where id = p_series_enrollment_id;

  return found;
end $$;

-- =====================================================================
-- 4. UPDATE COURSE ENROLLMENT FUNCTION TO SET INITIAL ACCESS DURATION
-- =====================================================================

create or replace function public.enroll_in_course(
  p_course_id text, p_payment_type text, p_payment_mode text, p_student_id uuid default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_student uuid := coalesce(p_student_id, (select auth.uid()));
  v_course public.courses%rowtype;
  v_profile public.profiles%rowtype;
  v_paid numeric; v_due numeric; v_receipt text; v_pay public.fee_payments%rowtype;
  v_interval interval;
  v_valid_until timestamptz;
begin
  if (select auth.uid()) is null then raise exception 'Not authenticated'; end if;
  if v_student <> (select auth.uid()) and not public.is_admin() then
    raise exception 'Not allowed';
  end if;
  if p_payment_type not in ('Full Payment','Instalment 1') then
    raise exception 'Invalid payment type';
  end if;

  select * into v_profile from public.profiles where id = v_student;
  if not found or v_profile.status <> 'Active' then raise exception 'Student account is not active'; end if;

  select * into v_course from public.courses where id = p_course_id for update;
  if not found then raise exception 'Course not found'; end if;
  if v_course.status = 'Batch Closed' or v_course.seats_available <= 0 then
    raise exception 'This batch is currently closed for direct admission.';
  end if;
  if exists (select 1 from public.enrollments where student_id = v_student and course_id = p_course_id) then
    raise exception 'You are already enrolled in this course batch.';
  end if;
  if p_payment_type = 'Instalment 1' and not v_course.instalment_available then
    raise exception 'Instalments are not available for this course.';
  end if;

  v_paid := case when p_payment_type = 'Full Payment' then v_course.price else v_course.first_instalment end;
  v_due := greatest(0, v_course.price - v_paid);
  if v_paid <= 0 then raise exception 'Invalid fee amount'; end if;
  v_receipt := 'CGA/' || to_char(now(), 'YYYY') || '/RCP-' || lpad(nextval('public.receipt_seq')::text, 5, '0');

  -- Compute initial duration from course.duration or default to 6 months
  v_interval := case
    when v_course.duration ilike '%1 year%' or v_course.duration ilike '%12 month%' then interval '1 year'
    when v_course.duration ilike '%10 month%' then interval '10 months'
    when v_course.duration ilike '%9 month%' then interval '9 months'
    when v_course.duration ilike '%6 month%' then interval '6 months'
    when v_course.duration ilike '%3 month%' then interval '3 months'
    when v_course.duration ilike '%session%' then interval '1 year'
    else interval '6 months'
  end;
  v_valid_until := now() + v_interval;

  insert into public.enrollments (student_id, course_id, progress, total_fee, paid_amount, due_amount, next_due_date, access_valid_until)
  values (v_student, p_course_id, 5, v_course.price, v_paid, v_due,
          case when v_due > 0 then (current_date + 30) end,
          v_valid_until);

  insert into public.fee_payments (receipt_no, student_id, course_id, amount, payment_mode, payment_type, remarks)
  values (v_receipt, v_student, p_course_id, v_paid, p_payment_mode, p_payment_type,
          case when v_due = 0 then 'Full course fee paid. Access granted until ' || to_char(v_valid_until, 'YYYY-MM-DD') || '.'
               else '1st Instalment paid. Balance Rs. ' || v_due::text || ' due within 30 days.' end)
  returning * into v_pay;

  update public.courses
     set seats_available = seats_available - 1,
         status = case when seats_available - 1 <= 0 then 'Batch Closed' else status end
   where id = p_course_id;

  delete from public.waiting_list where student_id = v_student and course_id = p_course_id;

  return jsonb_build_object(
    'success', true,
    'receiptNo', v_pay.receipt_no,
    'courseId', p_course_id,
    'amount', v_pay.amount,
    'dueAmount', v_due,
    'accessValidUntil', v_valid_until
  );
end $$;

-- =====================================================================
-- 5. ADMIN REGISTRATION & VERIFICATION WORKFLOW
-- =====================================================================

-- Allow new admin applicants to register; if not pre-allowlisted, status is 'Pending'
-- Enforce mandatory student registration details
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
  v_guardian text := coalesce(nullif(left(v_meta->>'guardian_name', 120), ''), '');
  v_address text := coalesce(nullif(left(v_meta->>'address', 300), ''), '');
  v_perm_address text := coalesce(nullif(left(v_meta->>'permanent_address', 300), ''), '');
  v_qual text := coalesce(nullif(left(v_meta->>'qualification', 200), ''), '');
  v_target text := coalesce(nullif(left(v_meta->>'target_exam', 120), ''), '');
begin
  if v_type = 'admin' then
    v_role := 'admin';
    -- If already pre-approved on access_allowlist, activate immediately.
    -- Otherwise, set status to 'Pending' awaiting existing administrator verification.
    v_status := case when v_allowed = 'admin' then 'Active' else 'Pending' end;
  elsif v_type = 'faculty' then
    v_role := case when v_allowed = 'admin' then 'admin' else 'faculty' end;
    v_status := case when v_allowed in ('admin','faculty') then 'Active' else 'Pending' end;
  else
    -- Student registration: strictly require all mandatory fields
    v_role := case when v_allowed = 'admin' then 'admin' else 'student' end;
    if v_role = 'student' then
      if length(v_name) < 3 then
        raise exception 'STUDENT_NAME_REQUIRED: Full candidate name (minimum 3 characters) is required.';
      end if;
      if public.normalize_phone(v_phone) = '' or length(public.normalize_phone(v_phone)) <> 10 then
        raise exception 'STUDENT_PHONE_REQUIRED: Valid 10-digit mobile number is required.';
      end if;
      if length(v_guardian) < 3 then
        raise exception 'STUDENT_GUARDIAN_REQUIRED: Parent / Guardian name is mandatory for academy records.';
      end if;
      if length(v_address) < 5 then
        raise exception 'STUDENT_ADDRESS_REQUIRED: Present residential address is mandatory.';
      end if;
      if length(v_perm_address) < 5 then
        v_perm_address := v_address;
      end if;
      if length(v_qual) < 2 then
        raise exception 'STUDENT_QUALIFICATION_REQUIRED: Educational qualification is mandatory.';
      end if;
      if length(v_target) < 2 then
        raise exception 'STUDENT_TARGET_EXAM_REQUIRED: Target competitive examination is mandatory.';
      end if;
    end if;
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
    v_guardian,
    v_address,
    v_perm_address,
    v_qual,
    v_target,
    v_status
  );

  if v_role = 'faculty' then
    insert into public.faculty (profile_id, name, designation, qualification, experience, photo, subject, bio, achievements, work_ability, approval_status)
    values (
      new.id,
      v_name,
      coalesce(nullif(left(v_meta->>'designation', 120), ''), 'Faculty Member'),
      coalesce(nullif(left(v_meta->>'qualification', 200), ''), ''),
      coalesce(nullif(left(v_meta->>'experience', 80), ''), ''),
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      '',
      '',
      coalesce(nullif(left(v_meta->>'achievements', 500), ''), ''),
      coalesce(nullif(left(v_meta->>'work_ability', 80), ''), 'Online & Offline'),
      case when v_status = 'Active' then 'Approved' else 'Pending' end
    )
    on conflict (profile_id) do nothing;
  end if;

  return new;
end $$;

-- List pending administrator registration requests
create or replace function public.cga_list_pending_admins()
returns table (
  id uuid,
  name text,
  email text,
  phone text,
  status text,
  created_at timestamptz
)
language sql security definer stable set search_path = '' as $$
  select id, name, email, phone, status, created_at
  from public.profiles
  where role = 'admin' and status = 'Pending'
  order by created_at desc;
$$;

-- Verify and approve a pending administrator request
create or replace function public.cga_approve_admin(p_profile_id uuid)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_admin public.profiles%rowtype;
begin
  if not public.is_admin() then
    raise exception 'UNAUTHORIZED: Only verified institute administrators can approve admin requests.';
  end if;

  select * into v_admin from public.profiles
  where id = p_profile_id and role = 'admin';

  if not found then
    raise exception 'NOT_FOUND: Administrator profile not found.';
  end if;

  -- Activate the profile
  update public.profiles
     set status = 'Active'
   where id = p_profile_id;

  -- Add to allowlist for permanent authorization
  insert into public.access_allowlist (identifier, role, note, added_by)
  values (lower(v_admin.email), 'admin', 'Approved Administrator (' || v_admin.name || ')', (select auth.uid()))
  on conflict (identifier) do update set role = 'admin';

  if public.normalize_phone(v_admin.phone) <> '' then
    insert into public.access_allowlist (identifier, role, note, added_by)
    values (public.normalize_phone(v_admin.phone), 'admin', 'Approved Admin Phone (' || v_admin.name || ')', (select auth.uid()))
    on conflict (identifier) do update set role = 'admin';
  end if;

  return true;
end $$;

-- Reject a pending administrator request
create or replace function public.cga_reject_admin(p_profile_id uuid)
returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'UNAUTHORIZED: Only verified institute administrators can reject admin requests.';
  end if;

  update public.profiles
     set status = 'Inactive'
   where id = p_profile_id and role = 'admin';

  return found;
end $$;

-- =====================================================================
-- 6. PERMISSIONS & GRANTS
-- =====================================================================

revoke execute on function public.cga_update_batch_duration(text, timestamptz) from public, anon;
grant execute on function public.cga_update_batch_duration(text, timestamptz) to authenticated;

revoke execute on function public.cga_extend_batch_duration_months(text, integer) from public, anon;
grant execute on function public.cga_extend_batch_duration_months(text, integer) to authenticated;

revoke execute on function public.cga_update_student_enrollment_duration(uuid, timestamptz) from public, anon;
grant execute on function public.cga_update_student_enrollment_duration(uuid, timestamptz) to authenticated;

revoke execute on function public.cga_update_series_enrollment_duration(uuid, timestamptz) from public, anon;
grant execute on function public.cga_update_series_enrollment_duration(uuid, timestamptz) to authenticated;

revoke execute on function public.cga_list_pending_admins() from public, anon;
grant execute on function public.cga_list_pending_admins() to authenticated;

revoke execute on function public.cga_approve_admin(uuid) from public, anon;
grant execute on function public.cga_approve_admin(uuid) to authenticated;

revoke execute on function public.cga_reject_admin(uuid) from public, anon;
grant execute on function public.cga_reject_admin(uuid) to authenticated;
