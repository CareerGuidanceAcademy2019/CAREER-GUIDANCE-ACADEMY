-- Migration 0023: Fix Verification Status Synchronization & Unpublish Test Visibility
-- Career Guidance Academy (C.G.A) Udaipur

-- =====================================================================
-- 1. FIX APPROVE_PAYMENT TO SYNCHRONIZE FEE_PAYMENTS PENDING RECORDS
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
    -- Ensure fee_payments status is synchronized to Verified
    update public.fee_payments
    set status = 'Verified',
        reviewed_by = coalesce(reviewed_by, v_admin_id::text),
        reviewed_at = coalesce(reviewed_at, now())
    where payment_request_id = p_request_id
       or receipt_no = v_req.reference_code;

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
        next_due_date,
        access_valid_until
      ) values (
        v_req.student_id,
        v_req.item_id,
        0,
        v_course.price,
        v_paid,
        v_due,
        v_next_due,
        now() + interval '6 months'
      ) on conflict (student_id, course_id) do update set
        paid_amount = excluded.paid_amount,
        due_amount = excluded.due_amount,
        next_due_date = excluded.next_due_date,
        access_valid_until = coalesce(public.enrollments.access_valid_until, now() + interval '6 months');

    elsif v_req.payment_type in ('instalment_2', 'balance') then
      update public.enrollments
      set
        paid_amount = paid_amount + p_amount_received,
        due_amount = greatest(0, due_amount - p_amount_received),
        next_due_date = null
      where student_id = v_req.student_id and course_id = v_req.item_id;
    end if;

  elsif v_req.item_type = 'material' then
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

  elsif v_req.item_type = 'mock_series' then
    insert into public.series_enrollments (
      student_id,
      series_id,
      payment_id,
      enrolled_at,
      access_valid_until
    ) values (
      v_req.student_id,
      v_req.item_id,
      v_req.id,
      now(),
      now() + interval '6 months'
    ) on conflict (student_id, series_id) do update set
      access_valid_until = coalesce(public.series_enrollments.access_valid_until, now() + interval '6 months');
  end if;

  -- 8. Synchronize or Insert into fee_payments
  -- Update any pre-existing pending payment row for this request
  update public.fee_payments
  set
    status = 'Verified',
    amount = p_amount_received,
    reviewed_by = v_admin_id::text,
    reviewed_at = now()
  where payment_request_id = p_request_id
     or receipt_no = v_req.reference_code
     or (student_id = v_req.student_id and (course_id = v_req.item_id or item_id = v_req.item_id) and status = 'Pending');

  -- If no row was updated, insert the verified payment
  if not found then
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
      status,
      reviewed_by,
      reviewed_at,
      payment_request_id,
      payment_method,
      utr
    ) values (
      v_receipt_no,
      v_req.student_id,
      case when v_req.item_type = 'course' then v_req.item_id else null end,
      v_req.item_type,
      v_req.item_id,
      p_amount_received,
      case when v_req.payment_channel = 'upi' then 'UPI' else 'Net Banking' end,
      case
        when v_req.payment_type = 'full' then 'Full Payment'
        when v_req.payment_type = 'instalment_1' then 'Instalment 1'
        when v_req.payment_type = 'instalment_2' then 'Instalment 2'
        else 'Full Payment'
      end,
      current_date,
      'Approved payment for ' || v_req.item_type || ' (' || v_req.item_id || ') Ref: ' || v_req.reference_code,
      'Verified',
      v_admin_id::text,
      now(),
      v_req.id,
      v_req.payment_method,
      v_req.utr_normalized
    );
  end if;

  -- 9. Update Payment Request status
  update public.payment_requests
  set
    status = 'approved',
    amount_received = p_amount_received,
    reviewed_by = v_admin_id,
    reviewed_at = now()
  where id = p_request_id;

  -- 10. Audit log
  insert into public.payment_audit_log (
    action, entity_type, entity_id, actor_id, actor_role, new_values
  ) values (
    'approve', 'payment_request', v_req.id::text, v_admin_id, 'admin',
    jsonb_build_object(
      'amount_received', p_amount_received,
      'reference_code', v_req.reference_code,
      'item_type', v_req.item_type,
      'item_id', v_req.item_id,
      'student_id', v_req.student_id
    )
  );

  return jsonb_build_object(
    'success', true,
    'receipt_no', v_receipt_no,
    'message', 'Payment approved and verified successfully.'
  );
end $$;

-- Direct fee payment approval RPC for records in fee_payments table
create or replace function public.cga_direct_approve_fee_payment(
  p_payment_id text,
  p_reviewed_by text default 'CGA Administrator'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid := auth.uid();
  v_pay public.fee_payments%rowtype;
  v_item_id text;
  v_is_series boolean;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized: Only academy administrators can approve payments.';
  end if;

  select * into v_pay
  from public.fee_payments
  where id::text = p_payment_id
     or receipt_no = p_payment_id
     or payment_request_id::text = p_payment_id
  limit 1
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Payment record not found.');
  end if;

  -- Update fee_payments row to Verified
  update public.fee_payments
  set status = 'Verified',
      reviewed_by = p_reviewed_by,
      reviewed_at = now()
  where id = v_pay.id;

  -- Synchronize matching payment_requests if exists
  if v_pay.payment_request_id is not null then
    update public.payment_requests
    set status = 'approved',
        reviewed_at = now()
    where id = v_pay.payment_request_id;
  end if;

  v_item_id := coalesce(v_pay.item_id, v_pay.course_id);
  v_is_series := (v_pay.item_type = 'mock_series' or v_item_id like 'series-%' or v_pay.remarks like '%mock_series%');

  if v_is_series and v_item_id is not null then
    insert into public.series_enrollments (student_id, series_id, payment_id, enrolled_at, access_valid_until)
    values (v_pay.student_id, v_item_id, v_pay.id, now(), now() + interval '6 months')
    on conflict (student_id, series_id) do update set
      access_valid_until = coalesce(public.series_enrollments.access_valid_until, now() + interval '6 months');
  elsif v_item_id is not null then
    insert into public.enrollments (student_id, course_id, progress, total_fee, paid_amount, due_amount, access_valid_until)
    values (v_pay.student_id, v_item_id, 0, v_pay.amount, v_pay.amount, 0, now() + interval '6 months')
    on conflict (student_id, course_id) do update set
      paid_amount = excluded.paid_amount,
      due_amount = 0,
      access_valid_until = coalesce(public.enrollments.access_valid_until, now() + interval '6 months');
  end if;

  return jsonb_build_object('success', true, 'message', 'Payment verified and enrollment granted.');
end $$;

grant execute on function public.cga_direct_approve_fee_payment(text, text) to authenticated;
revoke execute on function public.cga_direct_approve_fee_payment(text, text) from anon, public;

-- =====================================================================
-- 2. DATA REPAIR FOR CURRENTLY PENDING VERIFIED PAYMENTS & USERS
-- =====================================================================

-- Mark fee_payments as Verified where payment_requests is approved
update public.fee_payments fp
set status = 'Verified',
    reviewed_at = coalesce(fp.reviewed_at, now())
from public.payment_requests pr
where fp.payment_request_id = pr.id
  and pr.status = 'approved'
  and fp.status = 'Pending';

-- Ensure students with approved payment_requests have series_enrollments
insert into public.series_enrollments (student_id, series_id, enrolled_at, access_valid_until)
select pr.student_id, pr.item_id, coalesce(pr.reviewed_at, now()), now() + interval '6 months'
from public.payment_requests pr
where pr.status = 'approved'
  and pr.item_type = 'mock_series'
on conflict (student_id, series_id) do nothing;

-- Fix specific pending payment for jewelchakraborty068@gmail.com
update public.fee_payments
set status = 'Verified',
    reviewed_at = now()
where id = '17c7060b-45b3-4046-9590-61a0d5cd4098';

insert into public.series_enrollments (student_id, series_id, enrolled_at, access_valid_until)
values ('4af4d09e-18c7-4b4e-94f1-8439016c8268', 'series-ttet-paper2-soc', now(), now() + interval '6 months')
on conflict (student_id, series_id) do nothing;

-- Confirm recent unconfirmed student email accounts
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where email in ('dipen3409@gmail.com', 'subhrabulti91@gmail.com', 'gayetridebnath9@gmail.com');
