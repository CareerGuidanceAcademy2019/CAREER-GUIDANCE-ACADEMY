-- Migration 0017: Mock Test Lifecycle, Question Stats, and Question Papers
-- Career Guidance Academy (C.G.A) Udaipur

-- 1. Lifecycle columns on mock_tests
alter table public.mock_tests
  add column if not exists content_status text not null default 'draft'
    check (content_status in ('draft', 'active', 'expired', 'purged')),
  add column if not exists purge_after timestamptz,
  add column if not exists retention_days int not null default 7,
  add column if not exists archive_downloaded_at timestamptz,
  add column if not exists purge_requires_archive boolean not null default true;

-- 2. mock_test_question_stats: Preserved difficulty and scorecard analytics after question purge
create table if not exists public.mock_test_question_stats (
  test_id text not null references public.mock_tests(id) on delete cascade,
  position int not null,
  subject_tag text not null default '',
  attempted_count int not null default 0,
  correct_count int not null default 0,
  wrong_count int not null default 0,
  average_time_seconds numeric not null default 0,
  primary key (test_id, position)
);

create index if not exists idx_mock_q_stats_test on public.mock_test_question_stats (test_id);

alter table public.mock_test_question_stats enable row level security;

drop policy if exists "mock_test_question_stats: admin all" on public.mock_test_question_stats;
create policy "mock_test_question_stats: admin all" on public.mock_test_question_stats
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "mock_test_question_stats: student select" on public.mock_test_question_stats;
create policy "mock_test_question_stats: student select" on public.mock_test_question_stats
  for select to authenticated
  using (
    public.is_admin() or
    exists (
      select 1 from public.mock_tests t
      where t.id = mock_test_question_stats.test_id
        and (
          (t.series_id is not null and public.is_series_enrolled(t.series_id)) or
          (t.course_id is not null and public.is_enrolled(t.course_id))
        )
    )
  );

-- 3. mock_question_papers: Soft-copy PDF question papers per subject or series
create table if not exists public.mock_question_papers (
  id text primary key default gen_random_uuid()::text,
  series_id text not null references public.mock_series(id) on delete cascade,
  subject_id text references public.mock_subjects(id) on delete set null,
  test_id text references public.mock_tests(id) on delete set null,
  title text not null,
  file_path text not null,
  file_size_bytes bigint not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'unpublished')),
  publish_at timestamptz,
  published_at timestamptz,
  expire_at timestamptz,
  allow_download boolean not null default true,
  watermark boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_mock_papers_series on public.mock_question_papers (series_id);
create index if not exists idx_mock_papers_subject on public.mock_question_papers (subject_id);
create index if not exists idx_mock_papers_status on public.mock_question_papers (status, publish_at);

alter table public.mock_question_papers enable row level security;

drop policy if exists "mock_question_papers: admin all" on public.mock_question_papers;
create policy "mock_question_papers: admin all" on public.mock_question_papers
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "mock_question_papers: student select" on public.mock_question_papers;
create policy "mock_question_papers: student select" on public.mock_question_papers
  for select to authenticated
  using (
    public.is_admin() or (
      public.is_series_enrolled(series_id) and
      status = 'published' and
      (publish_at is null or now() >= publish_at) and
      (expire_at is null or now() <= expire_at)
    )
  );

-- 4. Storage Bucket: mock-question-papers (Private, 25 MB max, PDF only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'mock-question-papers',
  'mock-question-papers',
  false,
  26214400,
  array['application/pdf']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 26214400,
  allowed_mime_types = array['application/pdf'];

drop policy if exists "mock_question_papers: storage admin all" on storage.objects;
create policy "mock_question_papers: storage admin all" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'mock-question-papers' and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin' and status = 'Active'
    )
  )
  with check (
    bucket_id = 'mock-question-papers' and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin' and status = 'Active'
    )
  );
