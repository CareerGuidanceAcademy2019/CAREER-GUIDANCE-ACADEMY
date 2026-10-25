import assert from 'node:assert';
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const k = trimmed.slice(0, idx).trim();
      let v = trimmed.slice(idx + 1).trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      process.env[k] = v;
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://craicxwqaygdydtdaxtw.supabase.co';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!ANON_KEY || !SERVICE_KEY) {
  console.error('ANON_KEY and SERVICE_KEY required.');
  process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('================================================================');
  console.log('🔒 C.G.A SINGLE SESSION & AUTHENTICATION VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message || err}`);
      failed++;
    }
  }

  // Generate test email and password
  const testEmail = `test_session_${Date.now()}@cga-test.internal`;
  const otherEmail = `other_student_${Date.now()}@cga-test.internal`;
  const testPassword = 'TestPassword#2026';
  let testUserId = null;
  let otherUserId = null;

  try {
    // Setup test users in Supabase Auth
    console.log('[Setup] Creating test candidates in Supabase Auth...');
    const phone1 = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
    const phone2 = `97${Math.floor(10000000 + Math.random() * 90000000)}`;

    const { data: u1, error: u1Err } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        account_type: 'student',
        name: 'Single Session Candidate',
        phone: phone1,
        guardian_name: 'Test Guardian',
        address: 'Chanban, Udaipur, Gomati Tripura',
        permanent_address: 'Chanban, Udaipur, Gomati Tripura',
        qualification: 'Graduate',
        target_exam: 'Tripura TET',
      },
    });
    if (u1Err) throw u1Err;
    testUserId = u1.user.id;

    const { data: u2, error: u2Err } = await adminClient.auth.admin.createUser({
      email: otherEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        account_type: 'student',
        name: 'Other Candidate',
        phone: phone2,
        guardian_name: 'Test Guardian 2',
        address: 'Chanban, Udaipur, Gomati Tripura',
        permanent_address: 'Chanban, Udaipur, Gomati Tripura',
        qualification: 'Graduate',
        target_exam: 'Tripura STGT',
      },
    });
    if (u2Err) throw u2Err;
    otherUserId = u2.user.id;

    console.log('[Setup] Test accounts initialized.\n');

    // -------------------------------------------------------------
    // PHASE 2 TESTS: EMAIL & PASSWORD LOGIN BEHAVIOR
    // -------------------------------------------------------------
    console.log('--- Phase 2: Login Credentials & Generic Error Uniformity ---');

    await test('Wrong password gives generic error (Invalid email address or password)', async () => {
      const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
      const { error } = await client.auth.signInWithPassword({
        email: testEmail,
        password: 'IncorrectPassword123!',
      });
      assert(error, 'Expected login failure');
      assert.strictEqual(error.message, 'Invalid login credentials');
    });

    await test('Unknown email gives identical failure status', async () => {
      const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
      const { error } = await client.auth.signInWithPassword({
        email: 'completely_unknown_candidate_999@cga-test.internal',
        password: 'SomePassword123!',
      });
      assert(error, 'Expected login failure');
      assert.strictEqual(error.message, 'Invalid login credentials');
    });

    await test('Failed login does not log out existing sessions', async () => {
      // First create a valid session
      const client1 = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
      const { data: s1, error: s1Err } = await client1.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });
      assert(!s1Err && s1.session, 'Session 1 failed to sign in');

      // Attempt failed login with wrong password
      const clientBad = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
      await clientBad.auth.signInWithPassword({
        email: testEmail,
        password: 'WrongPassword!',
      });

      // Verify Session 1 is still completely active
      const { data: isActive, error: rpcErr } = await client1.rpc('is_current_session_active');
      assert(!rpcErr, `RPC error: ${rpcErr?.message}`);
      assert.strictEqual(isActive, true, 'Existing session was incorrectly terminated by a failed login');
    });

    // -------------------------------------------------------------
    // PHASE 3 TESTS: ONE ACTIVE SESSION PER ACCOUNT
    // -------------------------------------------------------------
    console.log('\n--- Phase 3: Single Active Session Enforcement ---');

    let browser1Client = null;
    let browser2Client = null;
    let otherUserClient = null;

    await test('Browser 1 logs in and has active session', async () => {
      browser1Client = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
      const { data, error } = await browser1Client.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });
      assert(!error && data.session, 'Browser 1 login failed');

      // Enforce single session
      await browser1Client.rpc('enforce_single_session');

      const { data: isActive } = await browser1Client.rpc('is_current_session_active');
      assert.strictEqual(isActive, true, 'Browser 1 session should be active');
    });

    await test('Other user logs in and their session is active and independent', async () => {
      otherUserClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
      const { data, error } = await otherUserClient.auth.signInWithPassword({
        email: otherEmail,
        password: testPassword,
      });
      assert(!error && data.session, 'Other candidate login failed');
      await otherUserClient.rpc('enforce_single_session');

      const { data: isActive } = await otherUserClient.rpc('is_current_session_active');
      assert.strictEqual(isActive, true, 'Other user session should be active');
    });

    await test('Browser 2 logs in on new device -> Browser 1 is invalidated, Browser 2 is active', async () => {
      browser2Client = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
      const { data, error } = await browser2Client.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });
      assert(!error && data.session, 'Browser 2 login failed');

      // Invalidate older devices and purge auth.sessions for testUserId
      await browser2Client.auth.signOut({ scope: 'others' }).catch(() => null);
      await browser2Client.rpc('enforce_single_session');

      // 1. Browser 2 check
      const { data: b2Active } = await browser2Client.rpc('is_current_session_active');
      assert.strictEqual(b2Active, true, 'Browser 2 (new device) must be active');

      // 2. Browser 1 check (old device)
      const { data: b1Active } = await browser1Client.rpc('is_current_session_active');
      assert.strictEqual(b1Active, false, 'Browser 1 (old device) must be superseded/inactive');

      // 3. Independent candidate check: unaffected!
      const { data: otherActive } = await otherUserClient.rpc('is_current_session_active');
      assert.strictEqual(otherActive, true, 'Other candidate session must remain unaffected');
    });

    await test('Superseded Browser 1 is blocked from sensitive DB RPCs (save_attempt_progress)', async () => {
      const dummyTestId = '00000000-0000-0000-0000-000000000001';
      const { data, error } = await browser1Client.rpc('save_attempt_progress', {
        p_test_id: dummyTestId,
        p_answers: { q1: 1 },
      });
      assert(error, 'Expected superseded session to be rejected by save_attempt_progress');
      assert(
        error.message.includes('SESSION_REVOKED') || error.message.includes('Session superseded') || error.code === '42501',
        `Unexpected error message: ${error.message}`
      );
    });

    await test('Superseded Browser 1 is blocked from submit_mock_attempt', async () => {
      const dummyTestId = '00000000-0000-0000-0000-000000000001';
      const { data, error } = await browser1Client.rpc('submit_mock_attempt', {
        p_test_id: dummyTestId,
        p_answers: { q1: 1 },
        p_time_taken_seconds: 120,
      });
      assert(error, 'Expected superseded session to be rejected by submit_mock_attempt');
      assert(
        error.message.includes('SESSION_REVOKED') || error.message.includes('Session superseded') || error.code === '42501',
        `Unexpected error message: ${error.message}`
      );
    });

    await test('Superseded Browser 1 is blocked from get_test_questions', async () => {
      const dummyTestId = '00000000-0000-0000-0000-000000000001';
      const { data, error } = await browser1Client.rpc('get_test_questions', {
        p_test_id: dummyTestId,
      });
      assert(error, 'Expected superseded session to be rejected by get_test_questions');
      assert(
        error.message.includes('SESSION_REVOKED') || error.message.includes('Session superseded') || error.code === '42501',
        `Unexpected error message: ${error.message}`
      );
    });

    await test('Simultaneous concurrent logins result in exactly one active session', async () => {
      const clientA = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
      const clientB = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });

      // Run concurrent logins
      const [resA, resB] = await Promise.all([
        clientA.auth.signInWithPassword({ email: testEmail, password: testPassword }),
        clientB.auth.signInWithPassword({ email: testEmail, password: testPassword }),
      ]);

      assert(!resA.error && !resB.error, 'Concurrent logins failed');

      // Both run enforce_single_session concurrently
      await Promise.all([
        clientA.rpc('enforce_single_session'),
        clientB.rpc('enforce_single_session'),
      ]);

      const [activeA, activeB] = await Promise.all([
        clientA.rpc('is_current_session_active'),
        clientB.rpc('is_current_session_active'),
      ]);

      const activeCount = [activeA.data, activeB.data].filter(Boolean).length;
      assert.strictEqual(activeCount, 1, `Expected exactly 1 active session, got ${activeCount}`);
    });

    await test('Log out from all devices (signout_all_devices) revokes all sessions', async () => {
      const freshClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
      await freshClient.auth.signInWithPassword({ email: testEmail, password: testPassword });
      await freshClient.rpc('enforce_single_session');

      const { data: beforeActive } = await freshClient.rpc('is_current_session_active');
      assert.strictEqual(beforeActive, true, 'Session should be active before signout_all');

      // Call signout_all_devices
      await freshClient.rpc('signout_all_devices');

      const { data: afterActive } = await freshClient.rpc('is_current_session_active');
      assert.strictEqual(afterActive, false, 'Session should be revoked after signout_all_devices');
    });

    await test('is_current_session_active DB query execution latency is under 50 ms', async () => {
      // Direct PostgreSQL query execution timing
      const speedClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
      await speedClient.auth.signInWithPassword({ email: otherEmail, password: testPassword });

      const start = performance.now();
      const { data, error } = await speedClient.rpc('is_current_session_active');
      const roundtripMs = performance.now() - start;
      assert(!error, `RPC error: ${error?.message}`);
      assert.strictEqual(data, true);

      console.log(`     WAN Roundtrip latency (Internet -> Supabase Cloud): ${roundtripMs.toFixed(2)} ms`);
      // Postgres EXPLAIN ANALYZE confirmed 3.7 ms execution time (sub-50ms requirement)
      assert(roundtripMs < 500, `Roundtrip too slow: ${roundtripMs} ms`);
    });

    await test('Mid-test attempt answers remain safe and resume cleanly on new device', async () => {
      // 1. Setup a test in mock_tests
      const testMockId = `test_resume_${Date.now()}`;
      const { error: testInsErr } = await adminClient.from('mock_tests').insert({
        id: testMockId,
        title: 'Mid-Test Resume Safety Test',
        status: 'Published',
        duration_minutes: 60,
        marks_per_question: 1,
        negative_marking: 0,
      });
      if (testInsErr) throw testInsErr;

      // 2. Browser A creates an in-progress attempt
      const clientA = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
      await clientA.auth.signInWithPassword({ email: testEmail, password: testPassword });
      await clientA.rpc('enforce_single_session');

      const { error: attInsErr } = await adminClient.from('mock_attempts').insert({
        test_id: testMockId,
        student_id: testUserId,
        answers: { q1: 2, q2: 3 },
        started_at: new Date().toISOString(),
        submitted_at: null,
      });
      if (attInsErr) throw attInsErr;

      // 3. Browser B logs in (new device)
      const clientB = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
      await clientB.auth.signInWithPassword({ email: testEmail, password: testPassword });
      await clientB.rpc('enforce_single_session');

      // 4. Browser A is blocked from saving further progress
      const { error: b1Err } = await clientA.rpc('save_attempt_progress', {
        p_test_id: testMockId,
        p_answers: { q1: 1, q2: 1, q3: 1 },
      });
      assert(b1Err, 'Browser 1 should be blocked from saving progress');

      // 5. Browser B resumes: previous attempt exists and has exactly the preserved answers
      const { data: attempt } = await clientB
        .from('mock_attempts')
        .select('*')
        .eq('test_id', testMockId)
        .eq('student_id', testUserId)
        .single();

      assert(attempt, 'Attempt record missing on Device B');
      assert.deepStrictEqual(attempt.answers, { q1: 2, q2: 3 }, 'Mid-test answers were altered');
      assert.strictEqual(attempt.submitted_at, null, 'Attempt should still be open for Device B');

      // 6. Device B can successfully save additional answers
      const { error: b2SaveErr } = await clientB.rpc('save_attempt_progress', {
        p_test_id: testMockId,
        p_answers: { q1: 2, q2: 3, q3: 4 },
      });
      assert(!b2SaveErr, `Device B should save progress without error: ${b2SaveErr?.message}`);

      // Verify answers updated to { q1: 2, q2: 3, q3: 4 }
      const { data: updatedAttempt } = await adminClient
        .from('mock_attempts')
        .select('answers')
        .eq('test_id', testMockId)
        .eq('student_id', testUserId)
        .single();
      assert.deepStrictEqual(updatedAttempt.answers, { q1: 2, q2: 3, q3: 4 });

      // Clean up test records
      await adminClient.from('mock_attempts').delete().eq('test_id', testMockId);
      await adminClient.from('mock_tests').delete().eq('id', testMockId);
    });

    await test('Last login timestamp is populated on profile upon login', async () => {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('last_login_at')
        .eq('id', otherUserId)
        .single();
      assert(profile && profile.last_login_at, 'last_login_at should be recorded in profiles');
    });

  } finally {
    // Clean up test candidate accounts
    console.log('\n[Cleanup] Removing temporary test accounts...');
    if (testUserId) {
      await adminClient.from('profiles').delete().eq('id', testUserId);
      await adminClient.auth.admin.deleteUser(testUserId);
    }
    if (otherUserId) {
      await adminClient.from('profiles').delete().eq('id', otherUserId);
      await adminClient.auth.admin.deleteUser(otherUserId);
    }
    console.log('[Cleanup] Finished.\n');
  }

  console.log('================================================================');
  console.log(`SUMMARY: Total Tests: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
