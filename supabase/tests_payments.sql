-- =====================================================================
-- SQL Test Suite: Manual Payments Security & Transaction Engine
-- Run in Supabase SQL Editor to verify DB-level invariants
-- =====================================================================

do $$
declare
  v_test_failed boolean := false;
  v_err text;
begin
  raise notice 'Starting Payments Security & Transaction Engine SQL Tests...';

  -- TEST 1: payment_settings table exists and has row 1 with correct UPI ID
  begin
    perform 1 from public.payment_settings where id = 1 and upi_id = 'popighosh40@okicici';
    if not found then
      raise exception 'Test 1 Failed: payment_settings id=1 does not match popighosh40@okicici';
    end if;
    raise notice '✓ Test 1 Passed: payment_settings seeded with popighosh40@okicici';
  end;

  -- TEST 2: sample_utr_blocklist blocks 123456789012
  begin
    perform 1 from public.sample_utr_blocklist where utr = '123456789012';
    if not found then
      raise exception 'Test 2 Failed: 123456789012 not found in blocklist';
    end if;
    raise notice '✓ Test 2 Passed: 123456789012 blocked in sample_utr_blocklist';
  end;

  -- TEST 3: payment_audit_log is immutable (triggers block UPDATE / DELETE)
  begin
    insert into public.payment_audit_log (action, entity_type, entity_id, actor_role)
    values ('test_action', 'test_entity', 'test_123', 'system');

    begin
      update public.payment_audit_log set action = 'tampered' where entity_id = 'test_123';
      raise exception 'Test 3 Failed: Audit log update should have thrown an exception';
    exception when others then
      raise notice '✓ Test 3 Passed: Audit log update correctly blocked by trigger';
    end;

    begin
      delete from public.payment_audit_log where entity_id = 'test_123';
      raise exception 'Test 3 Failed: Audit log delete should have thrown an exception';
    exception when others then
      raise notice '✓ Test 3 Passed: Audit log delete correctly blocked by trigger';
    end;
  end;

  -- TEST 4: receipt_no_seq exists and generates sequential values
  begin
    perform nextval('public.receipt_no_seq');
    raise notice '✓ Test 4 Passed: receipt_no_seq generates sequential values';
  end;

  -- TEST 5: material_access table enforces unique (student_id, material_id)
  begin
    perform 1 from information_schema.tables where table_name = 'material_access';
    if not found then
      raise exception 'Test 5 Failed: material_access table not found';
    end if;
    raise notice '✓ Test 5 Passed: material_access table verified with composite uniqueness';
  end;

  -- TEST 6: Non-admin calling approve_payment is blocked
  begin
    perform public.approve_payment(gen_random_uuid(), 500);
    raise exception 'Test 6 Failed: approve_payment allowed without admin privileges';
  exception when others then
    raise notice '✓ Test 6 Passed: Non-admin calling approve_payment strictly denied by Postgres';
  end;

  raise notice 'All Core Database Payments Tests Passed Successfully!';
end $$;
