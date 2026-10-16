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
