-- Migration 0015: Mock Test Diagrams, Shared Passages, and Question Groups
-- Adds support for diagrams, images, shared passage groups, option images, and explanation images

-- 1. mock_question_groups: Shared passage, map, table, or diagram used by multiple questions
create table if not exists public.mock_question_groups (
  id text primary key default gen_random_uuid()::text,
  test_id text not null references public.mock_tests(id) on delete cascade,
  position int not null default 1,
  passage_text text,
  image_path text,
  image_alt text,
  created_at timestamptz not null default now()
);

create index if not exists idx_mock_question_groups_test on public.mock_question_groups (test_id, position);

-- Enable RLS on mock_question_groups
alter table public.mock_question_groups enable row level security;

-- 2. Alter mock_questions: add group_id, diagram image fields
alter table public.mock_questions
  add column if not exists group_id text references public.mock_question_groups(id) on delete set null,
  add column if not exists image_path text,
  add column if not exists image_alt text,
  add column if not exists image_width int,
  add column if not exists image_height int;

create index if not exists idx_mock_questions_group on public.mock_questions (group_id);

-- 3. Alter mock_question_keys: add explanation diagram image fields
alter table public.mock_question_keys
  add column if not exists explanation_image_path text,
  add column if not exists explanation_image_alt text;

-- 4. RLS Policies for mock_question_groups
drop policy if exists "mock_question_groups: admin all" on public.mock_question_groups;
create policy "mock_question_groups: admin all" on public.mock_question_groups
  for all to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin' and status = 'Active'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin' and status = 'Active'
    )
  );

drop policy if exists "mock_question_groups: student select" on public.mock_question_groups;
create policy "mock_question_groups: student select" on public.mock_question_groups
  for select to authenticated
  using (
    exists (
      select 1 from public.mock_tests t
      join public.series_enrollments se on se.series_id = t.series_id
      where t.id = mock_question_groups.test_id
        and se.student_id = auth.uid()
        and t.status = 'launched'
        and now() between t.window_start and t.window_end
    )
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin' and status = 'Active'
    )
  );

-- 5. Storage: Private bucket for mock test question images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'mock-question-images',
  'mock-question-images',
  false,
  8388608,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 8388608,
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp'];

-- Storage RLS: Admin full access; no direct student read/write
drop policy if exists "mock_question_images: admin all" on storage.objects;
create policy "mock_question_images: admin all" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'mock-question-images' and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin' and status = 'Active'
    )
  )
  with check (
    bucket_id = 'mock-question-images' and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin' and status = 'Active'
    )
  );
