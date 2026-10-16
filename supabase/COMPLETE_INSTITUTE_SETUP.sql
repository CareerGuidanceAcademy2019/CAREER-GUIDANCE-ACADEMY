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
create policy "enquiries: admin all" on public.enquiries for select, delete to authenticated
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
