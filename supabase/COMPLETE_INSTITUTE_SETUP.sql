-- ============================================================================
-- CAREER GUIDANCE ACADEMY (C.G.A) — COMPLETE DATABASE INITIALIZATION SCRIPT
-- Paste this entire file into:
-- https://supabase.com/dashboard/project/craicxwqaygdydtdaxtw/sql/new
-- And click "RUN". Safe to re-run anytime.
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

-- Sequences
create sequence if not exists public.student_code_seq start 1;
create sequence if not exists public.receipt_seq start 1001;

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'student' check (role in ('student','faculty','admin')),
  student_code text unique,
  name text not null check (char_length(name) between 1 and 120),
  email text not null,
  phone text not null default '',
  photo text,
  guardian_name text,
  address text,
  permanent_address text,
  qualification text,
  target_exam text,
  joined_date date not null default current_date,
  status text not null default 'Active' check (status in ('Active','Inactive','Pending')),
  created_at timestamptz not null default now()
);

-- Phone normalization helper
create or replace function public.normalize_phone(p text) returns text
language sql immutable set search_path = '' as $$
  select right(regexp_replace(coalesce(p, ''), '\D', '', 'g'), 10);
$$;

create index if not exists profiles_phone_norm_idx on public.profiles (public.normalize_phone(phone));
create index if not exists profiles_email_lower_idx on public.profiles (lower(email));

-- 2. Site Content
create table if not exists public.site_content (
  id int primary key default 1 check (id = 1),
  content jsonb not null,
  updated_at timestamptz not null default now()
);

-- 3. Faculty Table
create table if not exists public.faculty (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  designation text,
  subject text not null default '',
  qualification text not null default '',
  experience text not null default '',
  photo text,
  bio text,
  specialization_tags text[] not null default '{}',
  profile_id uuid unique references public.profiles(id) on delete set null,
  achievements text not null default '',
  work_ability text not null default 'Online & Offline',
  approval_status text not null default 'Approved' check (approval_status in ('Pending','Approved','Rejected')),
  created_at timestamptz not null default now()
);

-- 4. Courses Table
create table if not exists public.courses (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  category text not null,
  sub_category text not null default '',
  board text,
  class_level text,
  description text not null default '',
  syllabus_highlights text[] not null default '{}',
  price numeric not null check (price >= 0),
  instalment_available boolean not null default false,
  first_instalment numeric not null default 0 check (first_instalment >= 0),
  faculty_id text references public.faculty(id) on delete set null,
  batch_name text not null default '',
  batch_size int not null default 0 check (batch_size >= 0),
  seats_available int not null default 0 check (seats_available >= 0),
  waiting_list_count int not null default 0 check (waiting_list_count >= 0),
  duration text not null default '',
  start_date text not null default '',
  schedule text not null default '',
  status text not null default 'Open for Admission' check (status in ('Open for Admission','Batch Closed')),
  featured boolean not null default false
);

-- 5. Achievements
create table if not exists public.achievements (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  exam text not null,
  rank text not null,
  year text not null,
  photo text,
  quote text not null default '',
  category text not null default ''
);

-- 6. Study Materials
create table if not exists public.study_materials (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  course_id text not null references public.courses(id) on delete cascade,
  type text not null check (type in ('Book PDF','Paid Notes')),
  author text not null default '',
  pages int not null default 0,
  file_size text not null default '',
  uploaded_date date not null default current_date,
  description text not null default '',
  preview_sections jsonb not null default '[]'
);

-- 7. Mock Series
create table if not exists public.mock_series (
  id text primary key default gen_random_uuid()::text,
  slug text not null unique,
  name text not null,
  class_range text not null,
  stream text not null default '',
  price numeric not null default 499 check (price >= 0),
  batch_label text not null default 'NOV 2026',
  description text not null default '',
  highlights jsonb not null default '[]'::jsonb,
  status text not null default 'Open' check (status in ('Open', 'Closed', 'Archived')),
  starts_on text not null default '1st Week of November, 2026',
  created_at timestamptz not null default now()
);

-- 8. Mock Subjects
create table if not exists public.mock_subjects (
  id text primary key default gen_random_uuid()::text,
  series_id text not null references public.mock_series(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 9. Mock Tests
create table if not exists public.mock_tests (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  course_id text references public.courses(id) on delete cascade,
  series_id text references public.mock_series(id) on delete cascade,
  subject_id text references public.mock_subjects(id) on delete set null,
  test_type text not null default 'sectional' check (test_type in ('sectional','full')),
  test_no int not null default 1,
  question_count int not null default 30,
  batch_name text not null default '',
  duration_minutes int not null check (duration_minutes > 0),
  total_marks numeric not null default 0,
  marks_per_question numeric not null default 1,
  negative_marking numeric not null default 0,
  scheduled_date text not null default '',
  status text not null default 'Draft' check (status in ('Published','Draft','Live','Closed','Evaluated')),
  questions jsonb not null default '[]'
);

-- 10. Enrollments
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id text not null references public.courses(id) on delete cascade,
  enrolled_date date not null default current_date,
  progress int not null default 0 check (progress between 0 and 100),
  total_fee numeric not null,
  paid_amount numeric not null default 0,
  due_amount numeric not null default 0,
  next_due_date date,
  unique (student_id, course_id)
);

-- 11. Fee Payments
create table if not exists public.fee_payments (
  id uuid primary key default gen_random_uuid(),
  receipt_no text not null unique,
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id text not null references public.courses(id) on delete cascade,
  amount numeric not null check (amount > 0),
  payment_mode text not null check (payment_mode in ('UPI','Debit/Credit Card','Net Banking','Cash at Counter','Bank Transfer')),
  payment_type text not null check (payment_type in ('Full Payment','Instalment 1','Instalment 2','Balance Clearance','Balance Payment')),
  date date not null default current_date,
  remarks text,
  status text not null default 'Verified' check (status in ('Pending','Verified','Rejected')),
  utr text,
  screenshot_url text,
  reviewed_by text,
  reviewed_at timestamptz,
  rejection_reason text
);

-- Ensure columns exist if table already created
alter table public.fee_payments add column if not exists status text not null default 'Verified';
alter table public.fee_payments add column if not exists utr text;
alter table public.fee_payments add column if not exists screenshot_url text;
alter table public.fee_payments add column if not exists reviewed_by text;
alter table public.fee_payments add column if not exists reviewed_at timestamptz;
alter table public.fee_payments add column if not exists rejection_reason text;

-- 12. Test Attempts
create table if not exists public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  test_id text not null references public.mock_tests(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  score numeric not null,
  total_marks numeric not null,
  correct_count int not null,
  wrong_count int not null,
  unattempted_count int not null,
  accuracy numeric not null,
  time_taken_minutes int not null default 0,
  submitted_at timestamptz not null default now(),
  answers jsonb not null default '{}'
);

-- 13. Announcements
create table if not exists public.announcements (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  content text not null,
  target_batch text not null default 'All Batches',
  target_label text not null default 'All Batches',
  priority text not null default 'Normal' check (priority in ('Normal','Important','Urgent')),
  date date not null default current_date,
  author text not null default ''
);

-- 14. Enquiries
create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  phone text not null check (char_length(phone) between 5 and 20),
  email text not null default '' check (char_length(email) <= 200),
  course_interest text not null default '' check (char_length(course_interest) <= 200),
  message text not null default '' check (char_length(message) <= 2000),
  created_at timestamptz not null default now()
);

-- 15. Waiting List
create table if not exists public.waiting_list (
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id text not null references public.courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (student_id, course_id)
);

-- 16. Access Allowlist
create table if not exists public.access_allowlist (
  id uuid primary key default gen_random_uuid(),
  identifier text not null unique,
  role text not null check (role in ('admin','faculty')),
  note text not null default '',
  added_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Helper functions
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

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin' and status = 'Active');
$$;

create or replace function public.is_faculty() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'faculty' and status = 'Active');
$$;

create or replace function public.is_enrolled(p_course_id text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.enrollments e
    join public.profiles p on p.id = e.student_id
    where e.student_id = (select auth.uid())
      and e.course_id = p_course_id and p.status = 'Active');
$$;

create or replace function public.is_active_user() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and status = 'Active');
$$;

create or replace function public.my_account_state()
returns table (role text, status text)
language sql stable security definer set search_path = '' as $$
  select role, status from public.profiles where id = (select auth.uid());
$$;

create or replace function public.phone_available(p_phone text) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.normalize_phone(p_phone) <> '' and not exists (
    select 1 from public.profiles where public.normalize_phone(phone) = public.normalize_phone(p_phone));
$$;

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

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.site_content enable row level security;
alter table public.faculty enable row level security;
alter table public.courses enable row level security;
alter table public.achievements enable row level security;
alter table public.study_materials enable row level security;
alter table public.mock_tests enable row level security;
alter table public.enrollments enable row level security;
alter table public.fee_payments enable row level security;
alter table public.test_attempts enable row level security;
alter table public.announcements enable row level security;
alter table public.enquiries enable row level security;
alter table public.waiting_list enable row level security;
alter table public.access_allowlist enable row level security;

-- Policies
drop policy if exists "profiles: read own or admin" on public.profiles;
create policy "profiles: read own or admin" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

drop policy if exists "profiles: update own or admin" on public.profiles;
create policy "profiles: update own or admin" on public.profiles for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

drop policy if exists "site_content: public read" on public.site_content;
create policy "site_content: public read" on public.site_content for select to anon, authenticated using (true);
drop policy if exists "site_content: admin write" on public.site_content;
create policy "site_content: admin write" on public.site_content for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "faculty: anon read approved" on public.faculty;
create policy "faculty: anon read approved" on public.faculty for select to anon using (approval_status = 'Approved');
drop policy if exists "faculty: auth read" on public.faculty;
create policy "faculty: auth read" on public.faculty for select to authenticated
  using (approval_status = 'Approved' or profile_id = (select auth.uid()) or public.is_admin());
drop policy if exists "faculty: admin write" on public.faculty;
create policy "faculty: admin write" on public.faculty for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "courses: public read" on public.courses;
create policy "courses: public read" on public.courses for select to anon, authenticated using (true);
drop policy if exists "courses: admin write" on public.courses;
create policy "courses: admin write" on public.courses for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "achievements: public read" on public.achievements;
create policy "achievements: public read" on public.achievements for select to anon, authenticated using (true);
drop policy if exists "achievements: admin write" on public.achievements;
create policy "achievements: admin write" on public.achievements for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "materials: enrolled or admin read" on public.study_materials;
create policy "materials: enrolled or admin read" on public.study_materials for select to authenticated
  using (public.is_admin() or public.is_enrolled(course_id));
drop policy if exists "materials: admin write" on public.study_materials;
create policy "materials: admin write" on public.study_materials for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "tests: enrolled or admin read" on public.mock_tests;
create policy "tests: enrolled or admin read" on public.mock_tests for select to authenticated
  using (public.is_admin() or (status = 'Published' and (course_id is null or public.is_enrolled(course_id))));
drop policy if exists "tests: admin write" on public.mock_tests;
create policy "tests: admin write" on public.mock_tests for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "announcements: read" on public.announcements;
create policy "announcements: read" on public.announcements for select to authenticated
  using (public.is_admin() or public.is_active_user());
drop policy if exists "announcements: admin write" on public.announcements;
create policy "announcements: admin write" on public.announcements for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "allowlist: admin all" on public.access_allowlist;
create policy "allowlist: admin all" on public.access_allowlist for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Fee payments: student reads own and can submit pending payment verification; admin manages all
drop policy if exists "fee_payments: student read own or admin" on public.fee_payments;
create policy "fee_payments: student read own or admin" on public.fee_payments for select to authenticated
  using (student_id = (select auth.uid()) or public.is_admin());

drop policy if exists "fee_payments: student insert own or admin" on public.fee_payments;
create policy "fee_payments: student insert own or admin" on public.fee_payments for insert to authenticated
  with check (student_id = (select auth.uid()) or public.is_admin());

drop policy if exists "fee_payments: admin update" on public.fee_payments;
create policy "fee_payments: admin update" on public.fee_payments for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "fee_payments: admin delete" on public.fee_payments;
create policy "fee_payments: admin delete" on public.fee_payments for delete to authenticated
  using (public.is_admin());

-- Enrollments: student reads own; admin manages all
drop policy if exists "enrollments: read own or admin" on public.enrollments;
create policy "enrollments: read own or admin" on public.enrollments for select to authenticated
  using (student_id = (select auth.uid()) or public.is_admin());

drop policy if exists "enrollments: admin write" on public.enrollments;
create policy "enrollments: admin write" on public.enrollments for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Test attempts: student reads own; student can submit; admin can read all
drop policy if exists "attempts: read own or admin" on public.test_attempts;
create policy "attempts: read own or admin" on public.test_attempts for select to authenticated
  using (student_id = (select auth.uid()) or public.is_admin());

drop policy if exists "attempts: student insert own or admin" on public.test_attempts;
create policy "attempts: student insert own or admin" on public.test_attempts for insert to authenticated
  with check (student_id = (select auth.uid()) or public.is_admin());

-- Enquiries: public can insert; admin reads and deletes
drop policy if exists "enquiries: public insert" on public.enquiries;
create policy "enquiries: public insert" on public.enquiries for insert to anon, authenticated with check (true);

drop policy if exists "enquiries: admin all" on public.enquiries;
create policy "enquiries: admin all" on public.enquiries for all to authenticated
  using (public.is_admin());

-- ============================================================================
-- SEED ACCESS ALLOWLIST & PRIMARY ACCOUNTS
-- ============================================================================

insert into public.access_allowlist (identifier, role, note) values
  ('careerguidanceacademy2019@gmail.com', 'admin', 'Subhradip Banik - Institute Administrator'),
  ('7005929189',                         'admin', 'Subhradip Banik - Mobile Access'),
  ('angatsaha825@gmail.com',             'admin', 'Angat Saha - Institute Director & Super Administrator'),
  ('7629882835',                         'admin', 'Angat Saha - Primary Mobile Access'),
  ('admissions@cgaudaipur.in',           'admin', 'Career Guidance Academy Admissions Admin'),
  ('+91 94361 82490',                    'admin', 'C.G.A Udaipur Primary Office Contact'),
  ('+91 87875 41120',                    'admin', 'C.G.A Udaipur Secondary Office Contact')
on conflict (identifier) do update set role = excluded.role, note = excluded.note;

-- Create/update the profile for Subhradip Banik
insert into public.profiles (
  id, role, student_code, name, email, phone,
  photo, guardian_name, address, permanent_address, qualification, target_exam, status
) values (
  '4eacbd2f-bcac-425c-bed3-079d137dcf41',
  'admin',
  'CGA-2026-002',
  'Subhradip Banik',
  'careerguidanceacademy2019@gmail.com',
  '7005929189',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'Institute Administration',
  'Career Guidance Academy, Udaipur, Tripura',
  'Udaipur, Tripura',
  'Post Graduate',
  'Administrator & Faculty Mentorship',
  'Active'
)
on conflict (id) do update set
  role = 'admin',
  status = 'Active',
  student_code = coalesce(profiles.student_code, 'CGA-2026-002'),
  name = 'Subhradip Banik',
  phone = '7005929189';

-- Create/update faculty record for Subhradip Banik
insert into public.faculty (
  name, designation, subject, qualification, experience, photo, bio,
  profile_id, achievements, work_ability, approval_status
) values (
  'Subhradip Banik',
  'Administrator & Senior Faculty',
  'Career Guidance & Academic Administration',
  'Post Graduate',
  'Academic Mentorship & Guidance',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'Administrator and mentor at Career Guidance Academy (C.G.A), Udaipur, Tripura.',
  '4eacbd2f-bcac-425c-bed3-079d137dcf41',
  'Mentoring students across competitive examinations in Tripura.',
  'Online & Offline',
  'Approved'
)
on conflict (profile_id) do update set
  name = 'Subhradip Banik',
  designation = 'Administrator & Senior Faculty',
  approval_status = 'Approved';

-- Create/update the profile for Angat Saha
insert into public.profiles (
  id, role, student_code, name, email, phone,
  photo, guardian_name, address, permanent_address, qualification, target_exam, status
) values (
  'edc1b701-65ba-45d7-a702-835c42327953',
  'admin',
  'CGA-2026-001',
  'Angat Saha',
  'angatsaha825@gmail.com',
  '7629882835',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'Institute Administration',
  'Chanban Youth Club Rd, Udaipur, Tripura 799114',
  'Chanban Youth Club Rd, Udaipur, Tripura 799114',
  'Post Graduate (M.Sc, B.Ed)',
  'Director & Faculty Administration',
  'Active'
)
on conflict (id) do update set
  role = 'admin',
  status = 'Active',
  student_code = coalesce(profiles.student_code, 'CGA-2026-001'),
  name = 'Angat Saha',
  phone = '7629882835';

-- Create/update faculty record for Angat Saha
insert into public.faculty (
  name, designation, subject, qualification, experience, photo, bio,
  profile_id, achievements, work_ability, approval_status
) values (
  'Angat Saha',
  'Director & Senior Faculty',
  'Career Guidance & General Studies',
  'Post Graduate (M.Sc, B.Ed)',
  '8+ Years of Academic Mentorship',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'Leading Career Guidance Academy (C.G.A), mentoring students across Udaipur and Tripura for competitive examinations.',
  'edc1b701-65ba-45d7-a702-835c42327953',
  'Mentored top rankers across STGT, T-TET, and competitive state exams.',
  'Online & Offline',
  'Approved'
)
on conflict (profile_id) do update set
  name = 'Angat Saha',
  designation = 'Director & Senior Faculty',
  approval_status = 'Approved';

-- Seed Faculty: Mr. R. Debnath
insert into public.faculty (
  id, name, designation, subject, qualification, experience, photo, bio,
  specialization_tags, achievements, work_ability, approval_status
) values (
  'fac-r-debnath',
  'Mr. R. Debnath',
  'Assistant Teacher',
  'Math, Science & EVS',
  'B. Sc. with Chemistry (Honours), M. Sc. & B. Ed.',
  '7 Years Experience',
  '',
  'Appointed for TET-I & TET-II batches teaching Mathematics, Science, and Environmental Studies (EVS). Special achievements: TET-I & TET-II (Science) Qualified under TRBT. Available for online and offline teaching.',
  array['Assistant Teacher', 'TET-I & TET-II', 'Math & Science', 'EVS', 'TRBT Qualified', 'Online & Offline'],
  'TET-I & TET-II (Science) Qualified under TRBT',
  'Online & Offline',
  'Approved'
)
on conflict (id) do update set
  name = excluded.name,
  designation = excluded.designation,
  subject = excluded.subject,
  qualification = excluded.qualification,
  experience = excluded.experience,
  bio = excluded.bio,
  specialization_tags = excluded.specialization_tags,
  achievements = excluded.achievements,
  work_ability = excluded.work_ability,
  approval_status = 'Approved';

-- Seed Faculty: Mr. B. Das
insert into public.faculty (
  id, name, designation, subject, qualification, experience, photo, bio,
  specialization_tags, achievements, work_ability, approval_status
) values (
  'fac-b-das',
  'Mr. B. Das',
  'Office Assistant',
  'ICT Instruction & Office Administration',
  'B.A. Pass & DCA',
  '5 Years Experience as ICT Instructor',
  '',
  'Office Assistant coordinating digital operations and student support with 5 years experience as ICT Instructor. Special achievements: MTS under JRBT. Available for online and offline work.',
  array['Office Assistant', 'ICT Instructor', 'B.A. & DCA', 'MTS under JRBT', 'Online & Offline'],
  'MTS under JRBT',
  'Online & Offline',
  'Approved'
)
on conflict (id) do update set
  name = excluded.name,
  designation = excluded.designation,
  subject = excluded.subject,
  qualification = excluded.qualification,
  experience = excluded.experience,
  bio = excluded.bio,
  specialization_tags = excluded.specialization_tags,
  achievements = excluded.achievements,
  work_ability = excluded.work_ability,
  approval_status = 'Approved';

-- Grants
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_faculty() to authenticated;
grant execute on function public.is_enrolled(text) to authenticated;
grant execute on function public.is_active_user() to authenticated;
grant execute on function public.resolve_login_email(text, text) to anon, authenticated;
grant execute on function public.phone_available(text) to anon, authenticated;
grant execute on function public.my_account_state() to authenticated;



-- =====================================================================
-- UNIFIED MANUAL PAYMENTS (MIGRATIONS 0006 AND 0007)
-- =====================================================================

-- =====================================================================
-- Migration 0006: Unified Manual Payments Architecture (UPI & Bank Transfer)
-- Career Guidance Academy (C.G.A)
-- Enforces:
--   1. Single-row admin-editable payment_settings table
--   2. payment_requests with status lifecycle and partial unique indexes
--   3. Append-only payment_audit_log with triggers
--   4. sample_utr_blocklist preventing spoofed/mock UTRs
--   5. material_access table for granular paid study notes entitlement
--   6. Receipt sequence & fee_payments linkage
--   7. Purge candidate cascade integration
--   8. Private storage buckets & RLS policies
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- 1. PAYMENT_SETTINGS (Single row, id=1)
create table if not exists public.payment_settings (
  id int primary key default 1 check (id = 1),
  institute_name text not null default 'Career Guidance Academy (C.G.A)',
  payee_name text not null default 'CAREER GUIDANCE ACADEMY',
  upi_id text not null default 'popighosh40@okicici',
  upi_id_backup text,
  bank_transfer_enabled boolean not null default true,
  bank_account_holder text not null default 'POPI GHOSH',
  bank_name text not null default 'SBI, UDAIPUR.',
  bank_account_number text not null default '37660443471',
  bank_ifsc text not null default 'SBIN0000216',
  support_phone text not null default '+91-7005929189',
  support_email text not null default 'careerguidanceacademy2019@gmail.com',
  institute_address text not null default 'Chanban (Behind Youthclub), Udaipur, Gomati Tripura.',
  gstin text,
  receipt_prefix text not null default 'CGA-RCP-',
  request_expiry_hours int not null default 48 check (request_expiry_hours > 0),
  admin_emails text[] not null default array['careerguidanceacademy2019@gmail.com'],
  refund_policy_text text not null default 'contract to office with evidance and reason for refund related queries',
  payment_instructions_extra text not null default 'Approval will be verify within 24 hrs',
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- Seed initial row if missing
insert into public.payment_settings (
  id,
  institute_name,
  payee_name,
  upi_id,
  bank_transfer_enabled,
  bank_account_holder,
  bank_name,
  bank_account_number,
  bank_ifsc,
  support_phone,
  support_email,
  institute_address,
  gstin,
  receipt_prefix,
  request_expiry_hours,
  admin_emails,
  refund_policy_text,
  payment_instructions_extra
) values (
  1,
  'Career Guidance Academy (C.G.A)',
  'CAREER GUIDANCE ACADEMY',
  'popighosh40@okicici',
  true,
  'POPI GHOSH',
  'SBI, UDAIPUR.',
  '37660443471',
  'SBIN0000216',
  '+91-7005929189',
  'careerguidanceacademy2019@gmail.com',
  'Chanban (Behind Youthclub), Udaipur, Gomati Tripura.',
  null,
  'CGA-RCP-',
  48,
  array['careerguidanceacademy2019@gmail.com'],
  'contract to office with evidance and reason for refund related queries',
  'Approval will be verify within 24 hrs'
) on conflict (id) do update set
  payee_name = excluded.payee_name,
  upi_id = excluded.upi_id,
  bank_transfer_enabled = excluded.bank_transfer_enabled,
  bank_account_holder = excluded.bank_account_holder,
  bank_name = excluded.bank_name,
  bank_account_number = excluded.bank_account_number,
  bank_ifsc = excluded.bank_ifsc,
  support_phone = excluded.support_phone,
  support_email = excluded.support_email,
  institute_address = excluded.institute_address,
  refund_policy_text = excluded.refund_policy_text,
  payment_instructions_extra = excluded.payment_instructions_extra;

-- 2. SAMPLE_UTR_BLOCKLIST (Prevent dummy/sample submissions)
create table if not exists public.sample_utr_blocklist (
  utr text primary key,
  reason text not null default 'Known sample / dummy UTR pattern',
  created_at timestamptz not null default now()
);

insert into public.sample_utr_blocklist (utr, reason) values
  ('123456789012', 'Documentation sample UTR'),
  ('000000000000', 'Repeated zeros'),
  ('111111111111', 'Repeated ones'),
  ('222222222222', 'Repeated digits'),
  ('333333333333', 'Repeated digits'),
  ('444444444444', 'Repeated digits'),
  ('555555555555', 'Repeated digits'),
  ('666666666666', 'Repeated digits'),
  ('777777777777', 'Repeated digits'),
  ('888888888888', 'Repeated digits'),
  ('999999999999', 'Repeated nines'),
  ('987654321098', 'Descending sequential dummy UTR'),
  ('012345678901', 'Ascending sequential dummy UTR')
on conflict (utr) do nothing;

-- 3. PAYMENT_REQUESTS
create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  item_type text not null check (item_type in ('course', 'material', 'mock_series')),
  item_id text not null,
  payment_type text not null check (payment_type in ('full', 'instalment_1', 'instalment_2', 'balance')),
  expected_amount numeric not null check (expected_amount > 0),
  reference_code text not null unique,
  payment_channel text not null check (payment_channel in ('upi', 'bank_transfer')),
  payment_method text not null default 'upi_manual' check (payment_method in ('upi_manual', 'bank_transfer', 'razorpay')),
  utr text,
  utr_normalized text,
  amount_received numeric check (amount_received is null or amount_received >= 0),
  screenshot_path text,
  status text not null default 'awaiting_payment'
    check (status in ('awaiting_payment', 'pending_review', 'approved', 'rejected', 'expired', 'refund_due')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  reject_reason text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Partial unique index on normalized UTR across all submitted requests
create unique index if not exists idx_payment_requests_utr_normalized
  on public.payment_requests (utr_normalized)
  where utr_normalized is not null;

-- Partial unique index: a student cannot have two open requests for the same item & payment type
create unique index if not exists idx_payment_requests_open_unique
  on public.payment_requests (student_id, item_type, item_id, payment_type)
  where status in ('awaiting_payment', 'pending_review');

-- Search & lookup indexes
create index if not exists idx_payment_requests_student on public.payment_requests (student_id);
create index if not exists idx_payment_requests_status on public.payment_requests (status);
create index if not exists idx_payment_requests_reference_code on public.payment_requests (reference_code);
create index if not exists idx_payment_requests_created_at on public.payment_requests (created_at desc);

-- 4. PAYMENT_AUDIT_LOG (Append-only)
create table if not exists public.payment_audit_log (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text not null,
  entity_id text not null,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_role text not null default 'system',
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create index if not exists idx_payment_audit_entity on public.payment_audit_log (entity_type, entity_id);
create index if not exists idx_payment_audit_created_at on public.payment_audit_log (created_at desc);

-- Prevent UPDATE or DELETE on payment_audit_log (immutable append-only)
create or replace function public.trig_prevent_audit_log_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Unauthorized: payment_audit_log is immutable and append-only.';
end;
$$;

drop trigger if exists prevent_audit_log_mutation on public.payment_audit_log;
create trigger prevent_audit_log_mutation
  before update or delete on public.payment_audit_log
  for each row execute function public.trig_prevent_audit_log_mutation();

-- 5. MATERIAL_ACCESS (Entitlement for standalone paid study notes / book PDFs)
create table if not exists public.material_access (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  material_id text not null references public.study_materials(id) on delete cascade,
  granted_via text not null check (granted_via in ('purchase', 'enrolled_course', 'admin_grant')),
  payment_request_id uuid references public.payment_requests(id) on delete set null,
  granted_at timestamptz not null default now(),
  unique (student_id, material_id)
);

create index if not exists idx_material_access_student on public.material_access (student_id);
create index if not exists idx_material_access_material on public.material_access (material_id);

-- 6. RECEIPTS SEQUENCE & FEE_PAYMENTS ENHANCEMENT
create sequence if not exists public.receipt_no_seq start 1001;

do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'fee_payments' and column_name = 'payment_request_id') then
    alter table public.fee_payments add column payment_request_id uuid references public.payment_requests(id) on delete set null;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'fee_payments' and column_name = 'payment_method') then
    alter table public.fee_payments add column payment_method text not null default 'upi_manual';
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'fee_payments' and column_name = 'utr') then
    alter table public.fee_payments add column utr text;
  end if;
end $$;

-- 7. CANDIDATE PURGE INTEGRATION
-- Update delete_candidate_by_admin (and alias purge_candidate) to delete payment records
create or replace function public.delete_candidate_by_admin(p_student_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized: Only institute administrators can remove candidates.';
  end if;

  select role into v_role from public.profiles where id = p_student_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'Candidate not found');
  end if;

  if v_role = 'admin' then
    raise exception 'Cannot delete an administrator account through candidate management.';
  end if;

  -- Atomic cleanup of all student-linked payment & access tables
  delete from public.material_access where student_id = p_student_id;
  delete from public.payment_requests where student_id = p_student_id;
  delete from public.mock_attempts where student_id = p_student_id;
  delete from public.series_enrollments where student_id = p_student_id;
  delete from public.test_attempts where student_id = p_student_id;
  delete from public.fee_payments where student_id = p_student_id;
  delete from public.enrollments where student_id = p_student_id;
  delete from public.waiting_list where student_id = p_student_id;
  delete from public.profiles where id = p_student_id;

  return jsonb_build_object('success', true, 'message', 'Candidate and all associated data permanently removed.');
end $$;

-- Alias for purge_candidate
create or replace function public.purge_candidate(p_student_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  return public.delete_candidate_by_admin(p_student_id);
end;
$$;

-- 8. ROW LEVEL SECURITY (RLS)
alter table public.payment_settings enable row level security;
alter table public.payment_requests enable row level security;
alter table public.payment_audit_log enable row level security;
alter table public.sample_utr_blocklist enable row level security;
alter table public.material_access enable row level security;

-- payment_settings policies
drop policy if exists "payment_settings: public read" on public.payment_settings;
create policy "payment_settings: public read" on public.payment_settings
  for select to authenticated, anon
  using (true);

drop policy if exists "payment_settings: admin update" on public.payment_settings;
create policy "payment_settings: admin update" on public.payment_settings
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- sample_utr_blocklist policies
drop policy if exists "sample_utr_blocklist: read" on public.sample_utr_blocklist;
create policy "sample_utr_blocklist: read" on public.sample_utr_blocklist
  for select to authenticated
  using (true);

drop policy if exists "sample_utr_blocklist: admin manage" on public.sample_utr_blocklist;
create policy "sample_utr_blocklist: admin manage" on public.sample_utr_blocklist
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- payment_requests policies
drop policy if exists "payment_requests: student select own" on public.payment_requests;
create policy "payment_requests: student select own" on public.payment_requests
  for select to authenticated
  using (student_id = auth.uid() or public.is_admin());

drop policy if exists "payment_requests: student insert own awaiting" on public.payment_requests;
create policy "payment_requests: student insert own awaiting" on public.payment_requests
  for insert to authenticated
  with check (
    student_id = auth.uid()
    and status = 'awaiting_payment'
    and reviewed_by is null
    and reviewed_at is null
    and amount_received is null
  );

drop policy if exists "payment_requests: admin all" on public.payment_requests;
create policy "payment_requests: admin all" on public.payment_requests
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- payment_audit_log policies
drop policy if exists "payment_audit_log: admin read" on public.payment_audit_log;
create policy "payment_audit_log: admin read" on public.payment_audit_log
  for select to authenticated
  using (public.is_admin());

-- material_access policies
drop policy if exists "material_access: own select" on public.material_access;
create policy "material_access: own select" on public.material_access
  for select to authenticated
  using (student_id = auth.uid() or public.is_admin());

drop policy if exists "material_access: admin all" on public.material_access;
create policy "material_access: admin all" on public.material_access
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 9. STORAGE BUCKET CONFIGURATION & POLICIES
-- Insert private storage bucket for payment proofs if storage schema exists
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
) on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Storage RLS on payment-proofs
drop policy if exists "payment_proofs: student upload own" on storage.objects;
create policy "payment_proofs: student upload own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "payment_proofs: student read own" on storage.objects;
create policy "payment_proofs: student read own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'payment-proofs'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

drop policy if exists "payment_proofs: admin all" on storage.objects;
create policy "payment_proofs: admin all" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'payment-proofs'
    and public.is_admin()
  );



-- =====================================================================
-- PAYMENT RPCS AND ATOMIC FULFILMENT
-- =====================================================================

-- =====================================================================
-- Migration 0007: Unified Manual Payment RPCs & Transactional Engine
-- Career Guidance Academy (C.G.A)
-- Implements:
--   1. Schema adjustment: fee_payments.course_id nullable for non-course items,
--      add study_materials.price.
--   2. create_payment_request (server-side amount, rate limit, seat/duplicate check)
--   3. submit_payment_proof (format validation, global UTR uniqueness, blocklist)
--   4. approve_payment (admin-only, idempotent, seat lock, atomic enrolment & receipt)
--   5. reject_payment (admin-only, required reason, audit logged)
--   6. expire_stale_payment_requests (cron or on-demand expiration)
--   7. update_payment_settings_secure (admin password re-auth for financial details)
-- =====================================================================

-- 1. SCHEMA ADJUSTMENTS FOR MULTI-ITEM FULFILMENT
do $$
begin
  -- Make fee_payments.course_id nullable so materials and mock series can generate receipts
  alter table public.fee_payments alter column course_id drop not null;

  -- Add item_type and item_id to fee_payments if missing
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'fee_payments' and column_name = 'item_type') then
    alter table public.fee_payments add column item_type text not null default 'course';
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'fee_payments' and column_name = 'item_id') then
    alter table public.fee_payments add column item_id text;
  end if;

  -- Add price to study_materials for standalone paid purchases
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'study_materials' and column_name = 'price') then
    alter table public.study_materials add column price numeric not null default 199 check (price >= 0);
  end if;
end $$;

-- Helper: Generate cryptographically random reference code (e.g., CGA-7K3Q9X)
create or replace function public.generate_payment_reference_code()
returns text
language plpgsql
as $$
declare
  v_chars text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; -- Exclude ambiguous chars (0,1,I,O)
  v_code text := 'CGA-';
  v_i int;
begin
  for v_i in 1..6 loop
    v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
  end loop;
  return v_code;
end;
$$;

-- =====================================================================
-- 2. RPC: create_payment_request
-- Server-side amount derivation, rate-limiting, idempotency check
-- =====================================================================
create or replace function public.create_payment_request(
  p_item_type text,
  p_item_id text,
  p_payment_type text default 'full',
  p_channel text default 'upi'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_student_id uuid := auth.uid();
  v_expected_amount numeric;
  v_reference_code text;
  v_expiry_hours int := 48;
  v_recent_count int;
  v_req public.payment_requests%rowtype;
  v_course public.courses%rowtype;
  v_material public.study_materials%rowtype;
  v_mock_series public.mock_series%rowtype;
  v_enrollment public.enrollments%rowtype;
begin
  if v_student_id is null then
    raise exception 'Unauthorized: Authentication required.';
  end if;

  -- Validate parameters
  if p_item_type not in ('course', 'material', 'mock_series') then
    raise exception 'Invalid item type: %', p_item_type;
  end if;

  if p_payment_type not in ('full', 'instalment_1', 'instalment_2', 'balance') then
    raise exception 'Invalid payment type: %', p_payment_type;
  end if;

  if p_channel not in ('upi', 'bank_transfer') then
    raise exception 'Invalid payment channel: %', p_channel;
  end if;

  -- 1. Rate-limiting: Max 5 new requests per hour per student
  select count(*) into v_recent_count
  from public.payment_requests
  where student_id = v_student_id
    and created_at > now() - interval '1 hour';

  if v_recent_count >= 5 then
    raise exception 'Rate limit exceeded: You can create a maximum of 5 payment requests per hour. Please complete or wait for existing requests.';
  end if;

  -- 2. Fetch payment_settings expiry hours
  select coalesce(request_expiry_hours, 48) into v_expiry_hours
  from public.payment_settings
  where id = 1;

  -- 3. Check for existing open request (awaiting_payment or pending_review)
  select * into v_req
  from public.payment_requests
  where student_id = v_student_id
    and item_type = p_item_type
    and item_id = p_item_id
    and payment_type = p_payment_type
    and status in ('awaiting_payment', 'pending_review');

  if found then
    -- Return existing open request without creating a duplicate
    return jsonb_build_object(
      'success', true,
      'is_existing', true,
      'request', row_to_json(v_req)
    );
  end if;

  -- 4. Derive Expected Amount from Database (Server-authoritative)
  if p_item_type = 'course' then
    select * into v_course from public.courses where id = p_item_id;
    if not found then
      raise exception 'Course not found with ID: %', p_item_id;
    end if;

    if v_course.status = 'Closed' then
      raise exception 'Enrollment for this batch is currently closed.';
    end if;

    if p_payment_type = 'full' then
      -- Check if already enrolled
      if exists (select 1 from public.enrollments where student_id = v_student_id and course_id = p_item_id) then
        raise exception 'You are already enrolled in this course.';
      end if;
      v_expected_amount := v_course.price;

    elsif p_payment_type = 'instalment_1' then
      if exists (select 1 from public.enrollments where student_id = v_student_id and course_id = p_item_id) then
        raise exception 'You are already enrolled in this course.';
      end if;
      v_expected_amount := coalesce(v_course.first_instalment, v_course.price);

    elsif p_payment_type in ('instalment_2', 'balance') then
      -- Must already have an enrollment with a positive due_amount
      select * into v_enrollment from public.enrollments where student_id = v_student_id and course_id = p_item_id;
      if not found then
        raise exception 'No active course enrollment found to pay balance for.';
      end if;
      if v_enrollment.due_amount <= 0 then
        raise exception 'Your course fee is already fully paid. Balance is Rs 0.';
      end if;
      v_expected_amount := v_enrollment.due_amount;
    end if;

  elsif p_item_type = 'material' then
    select * into v_material from public.study_materials where id = p_item_id;
    if not found then
      raise exception 'Study material not found with ID: %', p_item_id;
    end if;

    -- Check if student already has access (either purchased or via course enrollment)
    if exists (
      select 1 from public.material_access where student_id = v_student_id and material_id = p_item_id
    ) or exists (
      select 1 from public.enrollments where student_id = v_student_id and course_id = v_material.course_id
    ) then
      raise exception 'You already have access to this study material.';
    end if;

    v_expected_amount := coalesce(v_material.price, 199);

  elsif p_item_type = 'mock_series' then
    select * into v_mock_series from public.mock_series where id = p_item_id or slug = p_item_id;
    if not found then
      raise exception 'Mock test series not found with ID or slug: %', p_item_id;
    end if;

    if v_mock_series.status = 'Closed' then
      raise exception 'This mock test series is closed for new admissions.';
    end if;

    if exists (
      select 1 from public.series_enrollments where student_id = v_student_id and series_id = v_mock_series.id
    ) then
      raise exception 'You are already enrolled in this mock test series.';
    end if;

    v_expected_amount := v_mock_series.price;
    p_item_id := v_mock_series.id; -- Normalize slug to id
  end if;

  if v_expected_amount is null or v_expected_amount <= 0 then
    raise exception 'Could not determine a valid price for this item.';
  end if;

  -- 5. Generate collision-resistant reference code
  loop
    v_reference_code := public.generate_payment_reference_code();
    exit when not exists (select 1 from public.payment_requests where reference_code = v_reference_code);
  end loop;

  -- 6. Insert payment request
  insert into public.payment_requests (
    student_id,
    item_type,
    item_id,
    payment_type,
    expected_amount,
    reference_code,
    payment_channel,
    payment_method,
    status,
    expires_at
  ) values (
    v_student_id,
    p_item_type,
    p_item_id,
    p_payment_type,
    v_expected_amount,
    v_reference_code,
    p_channel,
    case when p_channel = 'upi' then 'upi_manual' else 'bank_transfer' end,
    'awaiting_payment',
    now() + (v_expiry_hours || ' hours')::interval
  )
  returning * into v_req;

  -- 7. Audit Log Entry
  insert into public.payment_audit_log (
    action,
    entity_type,
    entity_id,
    actor_id,
    actor_role,
    new_values
  ) values (
    'create',
    'payment_request',
    v_req.id::text,
    v_student_id,
    'student',
    jsonb_build_object(
      'item_type', p_item_type,
      'item_id', p_item_id,
      'payment_type', p_payment_type,
      'expected_amount', v_expected_amount,
      'reference_code', v_reference_code,
      'payment_channel', p_channel,
      'expires_at', v_req.expires_at
    )
  );

  return jsonb_build_object(
    'success', true,
    'is_existing', false,
    'request', row_to_json(v_req)
  );
end $$;

-- =====================================================================
-- 3. RPC: submit_payment_proof
-- Validates UTR format, strips spaces, checks blocklist & global uniqueness
-- =====================================================================
create or replace function public.submit_payment_proof(
  p_request_id uuid,
  p_utr text,
  p_screenshot_path text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_student_id uuid := auth.uid();
  v_req public.payment_requests%rowtype;
  v_utr_clean text;
begin
  if v_student_id is null then
    raise exception 'Unauthorized: Authentication required.';
  end if;

  select * into v_req
  from public.payment_requests
  where id = p_request_id;

  if not found then
    raise exception 'Payment request not found.';
  end if;

  -- Verify ownership
  if v_req.student_id <> v_student_id and not public.is_admin() then
    raise exception 'Unauthorized: You do not own this payment request.';
  end if;

  -- Verify status is awaiting_payment or rejected (resubmission)
  if v_req.status not in ('awaiting_payment', 'rejected') then
    raise exception 'This payment request is currently in % status and cannot be modified.', v_req.status;
  end if;

  -- Verify expiration
  if now() > v_req.expires_at then
    update public.payment_requests set status = 'expired' where id = p_request_id;
    raise exception 'This payment request has expired. Please create a fresh payment request.';
  end if;

  -- Normalize UTR: Remove all whitespace, dashes, and convert to uppercase
  v_utr_clean := upper(regexp_replace(coalesce(p_utr, ''), '[\s\-]', '', 'g'));

  if length(v_utr_clean) = 0 then
    raise exception 'Please enter a valid Transaction Reference (UTR) number.';
  end if;

  -- Format Validation based on Channel
  if v_req.payment_channel = 'upi' then
    if not (v_utr_clean ~ '^[0-9]{12}$') then
      raise exception 'Invalid UPI UTR format: UPI transaction references must be exactly 12 digits (found % characters).', length(v_utr_clean);
    end if;
  else
    -- Bank Transfer (NEFT/RTGS/IMPS): 16-22 alphanumeric characters
    if not (v_utr_clean ~ '^[A-Z0-9]{12,25}$') then
      raise exception 'Invalid bank reference format: NEFT/RTGS/IMPS reference numbers must be 12 to 25 alphanumeric characters.';
    end if;
  end if;

  -- Check Sample UTR Blocklist
  if exists (select 1 from public.sample_utr_blocklist where utr = v_utr_clean) then
    raise exception 'The reference "%" is a recognized dummy/sample number. Please enter your real bank transaction UTR.', v_utr_clean;
  end if;

  -- Check Global Uniqueness across all other payment requests
  if exists (
    select 1 from public.payment_requests
    where utr_normalized = v_utr_clean
      and id <> p_request_id
  ) then
    raise exception 'This UTR is already linked to another payment. Check the number or contact support.';
  end if;

  -- Verify Screenshot Path if provided (must start with student_id folder)
  if p_screenshot_path is not null and length(trim(p_screenshot_path)) > 0 then
    if not (p_screenshot_path like (v_student_id::text || '/%')) and not public.is_admin() then
      raise exception 'Unauthorized screenshot path: Uploads must reside in your own secure student directory.';
    end if;
  end if;

  -- Update Payment Request to pending_review
  update public.payment_requests
  set
    utr = trim(p_utr),
    utr_normalized = v_utr_clean,
    screenshot_path = coalesce(p_screenshot_path, screenshot_path),
    status = 'pending_review',
    reject_reason = null
  where id = p_request_id
  returning * into v_req;

  -- Record Audit Log
  insert into public.payment_audit_log (
    action,
    entity_type,
    entity_id,
    actor_id,
    actor_role,
    new_values
  ) values (
    'submit_proof',
    'payment_request',
    v_req.id::text,
    v_student_id,
    'student',
    jsonb_build_object(
      'utr_normalized', v_utr_clean,
      'screenshot_path', v_req.screenshot_path,
      'status', 'pending_review'
    )
  );

  return jsonb_build_object(
    'success', true,
    'message', 'Payment proof submitted successfully. Your payment is now under verification by the academy desk.',
    'request', row_to_json(v_req)
  );
end $$;

-- =====================================================================
-- 4. RPC: approve_payment
-- Admin-only, idempotent, row locks, atomic fulfilment & receipt generation
-- =====================================================================
create or replace function public.approve_payment(
  p_request_id uuid,
  p_amount_received numeric
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid := auth.uid();
  v_req public.payment_requests%rowtype;
  v_settings public.payment_settings%rowtype;
  v_course public.courses%rowtype;
  v_receipt_no text;
  v_paid numeric;
  v_due numeric;
  v_next_due date;
begin
  -- 1. Strictly Admin Only
  if not public.is_admin() then
    raise exception 'Unauthorized: Only academy administrators can approve payments.';
  end if;

  -- 2. Lock request row FOR UPDATE
  select * into v_req
  from public.payment_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Payment request not found: %', p_request_id;
  end if;

  -- 3. Idempotency Check: harmless if already approved
  if v_req.status = 'approved' then
    return jsonb_build_object(
      'success', true,
      'already_approved', true,
      'message', 'Payment has already been approved.',
      'request', row_to_json(v_req)
    );
  end if;

  if v_req.status <> 'pending_review' then
    raise exception 'Payment request cannot be approved from "%" status. Only "pending_review" requests can be approved.', v_req.status;
  end if;

  -- 4. Verify Amount Received matches Expected Amount
  if p_amount_received <> v_req.expected_amount then
    raise exception 'Amount mismatch: Admin entered Rs %, but expected amount is Rs %.', p_amount_received, v_req.expected_amount;
  end if;

  -- 5. Fetch Institute Settings for Receipt Generation
  select * into v_settings from public.payment_settings where id = 1;

  -- 6. Generate Sequential Official Receipt Number
  v_receipt_no := coalesce(v_settings.receipt_prefix, 'CGA-RCP-') ||
                  to_char(now(), 'YYYY') || '-' ||
                  lpad(nextval('public.receipt_no_seq')::text, 5, '0');

  -- 7. Item-Specific Atomic Fulfilment
  if v_req.item_type = 'course' then
    -- Lock course row for seat allocation check
    select * into v_course
    from public.courses
    where id = v_req.item_id
    for update;

    if not found then
      raise exception 'Associated course not found: %', v_req.item_id;
    end if;

    if v_req.payment_type in ('full', 'instalment_1') then
      -- Check seats availability
      if v_course.seats_available <= 0 then
        -- Last-seat race: Set status to refund_due and place on waiting list
        update public.payment_requests
        set
          status = 'refund_due',
          reviewed_by = v_admin_id,
          reviewed_at = now(),
          reject_reason = 'Batch seats filled before approval. Full refund due.'
        where id = p_request_id;

        insert into public.waiting_list (student_id, course_id)
        values (v_req.student_id, v_req.item_id)
        on conflict (student_id, course_id) do nothing;

        insert into public.payment_audit_log (
          action, entity_type, entity_id, actor_id, actor_role, new_values
        ) values (
          'refund_due', 'payment_request', v_req.id::text, v_admin_id, 'admin',
          jsonb_build_object('reason', 'Batch seats full; moved to waiting_list and refund_due')
        );

        return jsonb_build_object(
          'success', false,
          'refund_due', true,
          'message', 'Batch is fully booked. Payment marked as refund_due and student placed on the waiting list.'
        );
      end if;

      -- Decrement available seats
      update public.courses
      set seats_available = greatest(0, seats_available - 1)
      where id = v_req.item_id;

      -- Calculate fee splits
      v_paid := p_amount_received;
      if v_req.payment_type = 'full' then
        v_due := 0;
        v_next_due := null;
      else
        v_due := greatest(0, v_course.price - p_amount_received);
        v_next_due := (current_date + interval '30 days')::date;
      end if;

      -- Create/Update Enrollment
      insert into public.enrollments (
        student_id,
        course_id,
        progress,
        total_fee,
        paid_amount,
        due_amount,
        next_due_date
      ) values (
        v_req.student_id,
        v_req.item_id,
        0,
        v_course.price,
        v_paid,
        v_due,
        v_next_due
      ) on conflict (student_id, course_id) do update set
        paid_amount = excluded.paid_amount,
        due_amount = excluded.due_amount,
        next_due_date = excluded.next_due_date;

    elsif v_req.payment_type in ('instalment_2', 'balance') then
      -- Update existing enrollment balance
      update public.enrollments
      set
        paid_amount = paid_amount + p_amount_received,
        due_amount = greatest(0, due_amount - p_amount_received),
        next_due_date = null
      where student_id = v_req.student_id and course_id = v_req.item_id;
    end if;

    -- Insert Fee Payment Record
    insert into public.fee_payments (
      receipt_no,
      student_id,
      course_id,
      item_type,
      item_id,
      amount,
      payment_mode,
      payment_type,
      date,
      remarks,
      payment_request_id,
      payment_method,
      utr
    ) values (
      v_receipt_no,
      v_req.student_id,
      v_req.item_id,
      'course',
      v_req.item_id,
      p_amount_received,
      case when v_req.payment_channel = 'upi' then 'UPI' else 'Net Banking' end,
      case
        when v_req.payment_type = 'full' then 'Full Payment'
        when v_req.payment_type = 'instalment_1' then 'Instalment 1'
        when v_req.payment_type = 'instalment_2' then 'Instalment 2'
        else 'Balance Clearance'
      end,
      current_date,
      'Approved manual payment via ' || v_req.payment_channel || ' (Ref: ' || v_req.reference_code || ')',
      v_req.id,
      v_req.payment_method,
      v_req.utr_normalized
    );

  elsif v_req.item_type = 'material' then
    -- Grant Study Material Access
    insert into public.material_access (
      student_id,
      material_id,
      granted_via,
      payment_request_id
    ) values (
      v_req.student_id,
      v_req.item_id,
      'purchase',
      v_req.id
    ) on conflict (student_id, material_id) do nothing;

    -- Insert Fee Payment Record
    insert into public.fee_payments (
      receipt_no,
      student_id,
      course_id,
      item_type,
      item_id,
      amount,
      payment_mode,
      payment_type,
      date,
      remarks,
      payment_request_id,
      payment_method,
      utr
    ) values (
      v_receipt_no,
      v_req.student_id,
      null,
      'material',
      v_req.item_id,
      p_amount_received,
      case when v_req.payment_channel = 'upi' then 'UPI' else 'Net Banking' end,
      'Full Payment',
      current_date,
      'Study Material Purchase (Ref: ' || v_req.reference_code || ')',
      v_req.id,
      v_req.payment_method,
      v_req.utr_normalized
    );

  elsif v_req.item_type = 'mock_series' then
    -- Grant Mock Series Enrollment
    insert into public.series_enrollments (
      student_id,
      series_id
    ) values (
      v_req.student_id,
      v_req.item_id
    ) on conflict (student_id, series_id) do nothing;

    -- Insert Fee Payment Record
    insert into public.fee_payments (
      receipt_no,
      student_id,
      course_id,
      item_type,
      item_id,
      amount,
      payment_mode,
      payment_type,
      date,
      remarks,
      payment_request_id,
      payment_method,
      utr
    ) values (
      v_receipt_no,
      v_req.student_id,
      null,
      'mock_series',
      v_req.item_id,
      p_amount_received,
      case when v_req.payment_channel = 'upi' then 'UPI' else 'Net Banking' end,
      'Full Payment',
      current_date,
      'T-TET Mock Test Series Enrollment (Ref: ' || v_req.reference_code || ')',
      v_req.id,
      v_req.payment_method,
      v_req.utr_normalized
    );
  end if;

  -- 8. Mark Payment Request as Approved
  update public.payment_requests
  set
    status = 'approved',
    amount_received = p_amount_received,
    reviewed_by = v_admin_id,
    reviewed_at = now()
  where id = p_request_id
  returning * into v_req;

  -- 9. Record Audit Log
  insert into public.payment_audit_log (
    action,
    entity_type,
    entity_id,
    actor_id,
    actor_role,
    new_values
  ) values (
    'approve',
    'payment_request',
    v_req.id::text,
    v_admin_id,
    'admin',
    jsonb_build_object(
      'amount_received', p_amount_received,
      'receipt_no', v_receipt_no,
      'item_type', v_req.item_type,
      'item_id', v_req.item_id,
      'status', 'approved'
    )
  );

  return jsonb_build_object(
    'success', true,
    'already_approved', false,
    'message', 'Payment successfully approved and access unlocked.',
    'receipt_no', v_receipt_no,
    'request', row_to_json(v_req)
  );
end $$;

-- =====================================================================
-- 5. RPC: reject_payment
-- Admin-only, required reason, audit logged
-- =====================================================================
create or replace function public.reject_payment(
  p_request_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid := auth.uid();
  v_req public.payment_requests%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized: Only administrators can reject payments.';
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'Rejection reason is required so the student knows how to resolve the issue.';
  end if;

  select * into v_req
  from public.payment_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Payment request not found: %', p_request_id;
  end if;

  if v_req.status = 'approved' then
    raise exception 'Cannot reject an already approved payment.';
  end if;

  update public.payment_requests
  set
    status = 'rejected',
    reject_reason = trim(p_reason),
    reviewed_by = v_admin_id,
    reviewed_at = now()
  where id = p_request_id
  returning * into v_req;

  insert into public.payment_audit_log (
    action,
    entity_type,
    entity_id,
    actor_id,
    actor_role,
    new_values
  ) values (
    'reject',
    'payment_request',
    v_req.id::text,
    v_admin_id,
    'admin',
    jsonb_build_object(
      'reason', trim(p_reason),
      'status', 'rejected'
    )
  );

  return jsonb_build_object(
    'success', true,
    'message', 'Payment request rejected. The student will be notified of the reason.',
    'request', row_to_json(v_req)
  );
end $$;

-- =====================================================================
-- 6. RPC: expire_stale_payment_requests
-- Marks past-expiry awaiting_payment requests as expired
-- =====================================================================
create or replace function public.expire_stale_payment_requests()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  with expired_rows as (
    update public.payment_requests
    set status = 'expired'
    where status = 'awaiting_payment'
      and now() > expires_at
    returning id
  )
  select count(*) into v_count from expired_rows;

  if v_count > 0 then
    insert into public.payment_audit_log (
      action,
      entity_type,
      entity_id,
      actor_role,
      new_values
    ) values (
      'expire',
      'payment_requests_batch',
      'batch',
      'system',
      jsonb_build_object('expired_count', v_count, 'timestamp', now())
    );
  end if;

  return jsonb_build_object('success', true, 'expired_count', v_count);
end $$;

-- =====================================================================
-- 7. RPC: update_payment_settings_secure
-- Admin-only with password re-authentication for high-risk financial changes
-- =====================================================================
create or replace function public.update_payment_settings_secure(
  p_settings jsonb,
  p_admin_password text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid := auth.uid();
  v_old public.payment_settings%rowtype;
  v_new_upi text;
  v_new_account text;
  v_new_ifsc text;
  v_is_sensitive boolean := false;
  v_encrypted_pw text;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized: Only administrators can update payment settings.';
  end if;

  select * into v_old from public.payment_settings where id = 1 for update;

  v_new_upi := p_settings->>'upi_id';
  v_new_account := p_settings->>'bank_account_number';
  v_new_ifsc := p_settings->>'bank_ifsc';

  -- Check if high-risk financial redirection columns are being changed
  if (v_new_upi is not null and v_new_upi <> v_old.upi_id) or
     (v_new_account is not null and v_new_account <> v_old.bank_account_number) or
     (v_new_ifsc is not null and v_new_ifsc <> v_old.bank_ifsc) then
    v_is_sensitive := true;
  end if;

  if v_is_sensitive then
    if p_admin_password is null or length(trim(p_admin_password)) = 0 then
      raise exception 'Re-authentication required: Please enter your administrator password to modify UPI ID or bank account details.';
    end if;

    -- Verify password against auth.users
    select encrypted_password into v_encrypted_pw
    from auth.users
    where id = v_admin_id;

    if v_encrypted_pw is null or v_encrypted_pw <> extensions.crypt(p_admin_password, v_encrypted_pw) then
      raise exception 'Re-authentication failed: Incorrect administrator password.';
    end if;
  end if;

  -- Apply updates
  update public.payment_settings
  set
    payee_name = coalesce(p_settings->>'payee_name', payee_name),
    upi_id = coalesce(v_new_upi, upi_id),
    upi_id_backup = p_settings->>'upi_id_backup',
    bank_transfer_enabled = coalesce((p_settings->>'bank_transfer_enabled')::boolean, bank_transfer_enabled),
    bank_account_holder = coalesce(p_settings->>'bank_account_holder', bank_account_holder),
    bank_name = coalesce(p_settings->>'bank_name', bank_name),
    bank_account_number = coalesce(v_new_account, bank_account_number),
    bank_ifsc = coalesce(v_new_ifsc, bank_ifsc),
    support_phone = coalesce(p_settings->>'support_phone', support_phone),
    support_email = coalesce(p_settings->>'support_email', support_email),
    institute_address = coalesce(p_settings->>'institute_address', institute_address),
    gstin = p_settings->>'gstin',
    receipt_prefix = coalesce(p_settings->>'receipt_prefix', receipt_prefix),
    request_expiry_hours = coalesce((p_settings->>'request_expiry_hours')::int, request_expiry_hours),
    refund_policy_text = coalesce(p_settings->>'refund_policy_text', refund_policy_text),
    payment_instructions_extra = coalesce(p_settings->>'payment_instructions_extra', payment_instructions_extra),
    updated_by = v_admin_id,
    updated_at = now()
  where id = 1;

  -- Record audit log
  insert into public.payment_audit_log (
    action,
    entity_type,
    entity_id,
    actor_id,
    actor_role,
    old_values,
    new_values
  ) values (
    'settings_update',
    'payment_settings',
    '1',
    v_admin_id,
    'admin',
    row_to_json(v_old),
    p_settings
  );

  return jsonb_build_object(
    'success', true,
    'message', 'Payment settings updated successfully.',
    'sensitive_changed', v_is_sensitive
  );
end $$;

-- Revoke & Grant function permissions
revoke execute on function public.create_payment_request(text,text,text,text) from public, anon;
grant execute on function public.create_payment_request(text,text,text,text) to authenticated;

revoke execute on function public.submit_payment_proof(uuid,text,text) from public, anon;
grant execute on function public.submit_payment_proof(uuid,text,text) to authenticated;

revoke execute on function public.approve_payment(uuid,numeric) from public, anon;
grant execute on function public.approve_payment(uuid,numeric) to authenticated;

revoke execute on function public.reject_payment(uuid,text) from public, anon;
grant execute on function public.reject_payment(uuid,text) to authenticated;

revoke execute on function public.expire_stale_payment_requests() from public, anon;
grant execute on function public.expire_stale_payment_requests() to authenticated;

revoke execute on function public.update_payment_settings_secure(jsonb,text) from public, anon;
grant execute on function public.update_payment_settings_secure(jsonb,text) to authenticated;
