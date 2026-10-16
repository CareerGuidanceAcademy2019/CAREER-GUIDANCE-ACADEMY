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
