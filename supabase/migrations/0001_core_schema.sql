-- Career Guidance Academy: core schema
-- Run in Supabase Dashboard > SQL Editor (or `supabase db push`).

create sequence if not exists public.student_code_seq start 1;
create sequence if not exists public.receipt_seq start 1001;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'student' check (role in ('student','admin')),
  student_code text unique,
  name text not null check (char_length(name) between 1 and 120),
  email text not null,
  phone text not null default '',
  photo text,
  guardian_name text,
  address text,
  qualification text,
  target_exam text,
  joined_date date not null default current_date,
  status text not null default 'Active' check (status in ('Active','Inactive')),
  created_at timestamptz not null default now()
);

create table public.site_content (
  id int primary key default 1 check (id = 1),
  content jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.faculty (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  designation text,
  subject text not null,
  qualification text not null default '',
  experience text not null default '',
  photo text,
  bio text,
  specialization_tags text[] not null default '{}'
);

create table public.courses (
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
  status text not null default 'Open for Admission'
    check (status in ('Open for Admission','Batch Closed')),
  featured boolean not null default false
);

create table public.achievements (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  exam text not null,
  rank text not null,
  year text not null,
  photo text,
  quote text not null default '',
  category text not null default ''
);

create table public.study_materials (
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

create table public.mock_tests (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  course_id text not null references public.courses(id) on delete cascade,
  batch_name text not null default '',
  duration_minutes int not null check (duration_minutes > 0),
  total_marks numeric not null default 0,
  marks_per_question numeric not null default 1,
  negative_marking numeric not null default 0,
  scheduled_date text not null default '',
  status text not null default 'Draft' check (status in ('Published','Draft')),
  questions jsonb not null default '[]'
);

create table public.enrollments (
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

create table public.fee_payments (
  id uuid primary key default gen_random_uuid(),
  receipt_no text not null unique,
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id text not null references public.courses(id) on delete cascade,
  amount numeric not null check (amount > 0),
  payment_mode text not null
    check (payment_mode in ('UPI','Debit/Credit Card','Net Banking','Cash at Counter')),
  payment_type text not null
    check (payment_type in ('Full Payment','Instalment 1','Instalment 2','Balance Clearance')),
  date date not null default current_date,
  remarks text
);

create table public.test_attempts (
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

create table public.announcements (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  content text not null,
  target_batch text not null default 'All Batches',
  target_label text not null default 'All Batches',
  priority text not null default 'Normal' check (priority in ('Normal','Important','Urgent')),
  date date not null default current_date,
  author text not null default ''
);

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  phone text not null check (char_length(phone) between 5 and 20),
  email text not null default '' check (char_length(email) <= 200),
  course_interest text not null default '' check (char_length(course_interest) <= 200),
  message text not null default '' check (char_length(message) <= 2000),
  created_at timestamptz not null default now()
);

create table public.waiting_list (
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id text not null references public.courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (student_id, course_id)
);

create index on public.enrollments (course_id);
create index on public.fee_payments (student_id);
create index on public.test_attempts (student_id);
create index on public.test_attempts (test_id);
create index on public.study_materials (course_id);
create index on public.mock_tests (course_id);
create index on public.courses (faculty_id);
create index on public.waiting_list (course_id);

-- ============ helper functions (used by RLS) ============
create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin' and status = 'Active');
$$;

create function public.is_enrolled(p_course_id text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.enrollments e
    join public.profiles p on p.id = e.student_id
    where e.student_id = (select auth.uid())
      and e.course_id = p_course_id and p.status = 'Active');
$$;

create function public.is_active_user() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and status = 'Active');
$$;

-- ============ new-user trigger: every signup becomes a *student* ============
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles
    (id, role, student_code, name, email, phone, photo,
     guardian_name, address, qualification, target_exam)
  values (
    new.id, 'student',
    'CGA-' || to_char(now(), 'YYYY') || '-'
      || lpad(nextval('public.student_code_seq')::text, 3, '0'),
    coalesce(nullif(left(new.raw_user_meta_data->>'name', 120), ''),
             split_part(new.email, '@', 1)),
    new.email,
    coalesce(left(new.raw_user_meta_data->>'phone', 20), ''),
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    left(new.raw_user_meta_data->>'guardian_name', 120),
    left(new.raw_user_meta_data->>'address', 300),
    left(new.raw_user_meta_data->>'qualification', 120),
    left(new.raw_user_meta_data->>'target_exam', 120)
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Non-admins can never change their own role/status/code/email via profile updates.
create function public.guard_profile_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is not null and not public.is_admin() then
    new.id := old.id;
    new.role := old.role;
    new.status := old.status;
    new.student_code := old.student_code;
    new.email := old.email;
    new.joined_date := old.joined_date;
  end if;
  return new;
end $$;

create trigger guard_profile_update before update on public.profiles
for each row execute function public.guard_profile_update();

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.guard_profile_update() from public, anon, authenticated;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_enrolled(text) from public, anon;
revoke execute on function public.is_active_user() from public, anon;
grant execute on function public.is_admin(), public.is_enrolled(text),
  public.is_active_user() to authenticated;
