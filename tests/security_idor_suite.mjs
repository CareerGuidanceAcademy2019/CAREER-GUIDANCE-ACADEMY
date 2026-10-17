import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_SERVICE_ROLE_KEY && fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const k = trimmed.slice(0, idx).trim();
      const v = trimmed.slice(idx + 1).trim();
      process.env[k] = v;
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://craicxwqaygdydtdaxtw.supabase.co';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

// Clients
const anonClient = createClient(SUPABASE_URL, ANON_KEY);
const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let studentAClient = null;
let studentBClient = null;
let userA = null;
let userB = null;

const results = [];

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  PASS: ${testName}`);
    results.push({ name: testName, status: 'PASS', details });
  } else {
    console.error(`  FAIL: ${testName} - ${details}`);
    results.push({ name: testName, status: 'FAIL', details });
  }
}

async function setupTestUsers() {
  console.log('\nSetting up isolated test users (Student A and Student B)...');
  const emailA = `audit_student_a_${Date.now()}@cga-audit.test`;
  const emailB = `audit_student_b_${Date.now()}@cga-audit.test`;
  const password = 'TestSecurePassword123!';

  // Create User A
  const { data: authA, error: errA } = await adminClient.auth.admin.createUser({
    email: emailA,
    password,
    email_confirm: true,
    user_metadata: { name: 'Audit Student A', phone: '9999900001' },
  });
  if (errA) throw new Error('Failed to create student A: ' + errA.message);
  userA = authA.user;

  // Insert profile A
  await adminClient.from('profiles').upsert({
    id: userA.id,
    role: 'student',
    name: 'Audit Student A',
    email: emailA,
    phone: '9999900001',
    status: 'Active',
  });

  // Create User B
  const { data: authB, error: errB } = await adminClient.auth.admin.createUser({
    email: emailB,
    password,
    email_confirm: true,
    user_metadata: { name: 'Audit Student B', phone: '9999900002' },
  });
  if (errB) throw new Error('Failed to create student B: ' + errB.message);
  userB = authB.user;

  // Insert profile B
  await adminClient.from('profiles').upsert({
    id: userB.id,
    role: 'student',
    name: 'Audit Student B',
    email: emailB,
    phone: '9999900002',
    status: 'Active',
  });

  // Create authenticated clients for A and B
  studentAClient = createClient(SUPABASE_URL, ANON_KEY);
  const { error: loginErrA } = await studentAClient.auth.signInWithPassword({ email: emailA, password });
  if (loginErrA) throw new Error('Student A signin failed: ' + loginErrA.message);

  studentBClient = createClient(SUPABASE_URL, ANON_KEY);
  const { error: loginErrB } = await studentBClient.auth.signInWithPassword({ email: emailB, password });
  if (loginErrB) throw new Error('Student B signin failed: ' + loginErrB.message);

  console.log(`  Created Student A (id: ${userA.id})`);
  console.log(`  Created Student B (id: ${userB.id})`);
}

async function cleanupTestUsers() {
  console.log('\nCleaning up test users...');
  if (userA) {
    await adminClient.from('payment_requests').delete().eq('student_id', userA.id);
    await adminClient.from('enrollments').delete().eq('student_id', userA.id);
    await adminClient.from('profiles').delete().eq('id', userA.id);
    await adminClient.auth.admin.deleteUser(userA.id);
  }
  if (userB) {
    await adminClient.from('payment_requests').delete().eq('student_id', userB.id);
    await adminClient.from('enrollments').delete().eq('student_id', userB.id);
    await adminClient.from('profiles').delete().eq('id', userB.id);
    await adminClient.auth.admin.deleteUser(userB.id);
  }
  console.log('  Cleanup complete.');
}

async function testAnonymousAccess() {
  console.log('\n--- 1. ANONYMOUS ACCESS RESTRICTIONS ---');

  // Anon must not read profiles
  const { data: profiles, error: errProf } = await anonClient.from('profiles').select('id, name, email');
  assert(!profiles || profiles.length === 0, 'Anonymous cannot read profiles table', `Rows returned: ${profiles?.length ?? 0}`);

  // Anon must not read enrollments
  const { data: enrollments } = await anonClient.from('enrollments').select('*');
  assert(!enrollments || enrollments.length === 0, 'Anonymous cannot read enrollments', `Rows: ${enrollments?.length ?? 0}`);

  // Anon must not read fee payments
  const { data: feePayments } = await anonClient.from('fee_payments').select('*');
  assert(!feePayments || feePayments.length === 0, 'Anonymous cannot read fee_payments', `Rows: ${feePayments?.length ?? 0}`);

  // Anon must not read payment requests
  const { data: paymentReqs } = await anonClient.from('payment_requests').select('*');
  assert(!paymentReqs || paymentReqs.length === 0, 'Anonymous cannot read payment_requests', `Rows: ${paymentReqs?.length ?? 0}`);

  // Anon must not read mock_question_keys
  const { data: keys, error: keyErr } = await anonClient.from('mock_question_keys').select('*');
  assert(!keys || keys.length === 0 || !!keyErr, 'Anonymous cannot read mock_question_keys', `Rows: ${keys?.length ?? 0}`);

  // Anon must not read access_allowlist
  const { data: allowlist } = await anonClient.from('access_allowlist').select('*');
  assert(!allowlist || allowlist.length === 0, 'Anonymous cannot read access_allowlist', `Rows: ${allowlist?.length ?? 0}`);

  // Anon must not read payment_settings
  const { data: paymentSettings } = await anonClient.from('payment_settings').select('*');
  assert(!paymentSettings || paymentSettings.length === 0, 'Anonymous cannot read payment_settings', `Rows: ${paymentSettings?.length ?? 0}`);

  // Intentionally public: courses, approved faculty, achievements
  const { data: courses } = await anonClient.from('courses').select('id, name');
  assert(courses && courses.length > 0, 'Anonymous can read public courses catalog', `Count: ${courses?.length ?? 0}`);

  const { data: faculty } = await anonClient.from('faculty').select('id, name');
  assert(faculty && faculty.length > 0, 'Anonymous can read public approved faculty', `Count: ${faculty?.length ?? 0}`);

  const { data: achievements } = await anonClient.from('achievements').select('id, name');
  assert(achievements && achievements.length > 0, 'Anonymous can read public achievements', `Count: ${achievements?.length ?? 0}`);
}

async function testStudentIdorIsolation() {
  console.log('\n--- 2. STUDENT IDOR & HORIZONTAL ISOLATION ---');

  // Insert test data for Student B using admin client
  await adminClient.from('payment_requests').insert({
    student_id: userB.id,
    item_type: 'course',
    item_id: 'test-course-id',
    payment_type: 'full',
    expected_amount: 5000,
    reference_code: 'CGA-BTEST1',
    payment_channel: 'upi',
    payment_method: 'upi_manual',
    status: 'pending_review',
    utr: 'UTRTEST999999',
    utr_normalized: 'UTRTEST999999',
  });

  // Test 2.1: Student A attempts to read Student B's profile
  const { data: profileBFromA } = await studentAClient
    .from('profiles')
    .select('id, name, email, phone')
    .eq('id', userB.id);
  assert(!profileBFromA || profileBFromA.length === 0, "Student A cannot read Student B's profile", `Rows: ${profileBFromA?.length ?? 0}`);

  // Test 2.2: Student A reads own profile
  const { data: profileAFromA } = await studentAClient
    .from('profiles')
    .select('id, name, email')
    .eq('id', userA.id)
    .single();
  assert(profileAFromA && profileAFromA.id === userA.id, "Student A can read their own profile", `Name: ${profileAFromA?.name}`);

  // Test 2.3: Student A attempts to modify Student B's profile (IDOR write)
  const { data: updateRes, error: updateErr } = await studentAClient
    .from('profiles')
    .update({ name: 'Hacked By Student A' })
    .eq('id', userB.id)
    .select();
  assert(!updateRes || updateRes.length === 0, "Student A cannot modify Student B's profile", `Modified count: ${updateRes?.length ?? 0}`);

  // Test 2.4: Student A attempts to read Student B's payment requests
  const { data: paymentBFromA } = await studentAClient
    .from('payment_requests')
    .select('*')
    .eq('student_id', userB.id);
  assert(!paymentBFromA || paymentBFromA.length === 0, "Student A cannot read Student B's payment requests (IDOR)", `Rows: ${paymentBFromA?.length ?? 0}`);

  // Test 2.5: Student A attempts to read mock_question_keys (Answers leak prevention)
  const { data: studentKeys, error: keyErr } = await studentAClient
    .from('mock_question_keys')
    .select('*');
  assert(!studentKeys || studentKeys.length === 0, "Student A cannot read mock_question_keys under any circumstances", `Rows: ${studentKeys?.length ?? 0}`);

  // Test 2.6: Student A attempts to elevate role to admin via profile update
  const { data: privEscRes } = await studentAClient
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', userA.id)
    .select();
  const { data: verifyRole } = await adminClient.from('profiles').select('role').eq('id', userA.id).single();
  assert(verifyRole?.role === 'student', "Student A cannot self-escalate role to admin", `Role is: ${verifyRole?.role}`);

  // Test 2.7: Student A attempts to call admin RPCs directly
  const { error: approveErr } = await studentAClient.rpc('approve_payment', {
    p_request_id: '00000000-0000-0000-0000-000000000000',
    p_amount_received: 1000,
  });
  assert(!!approveErr, "Student A cannot execute approve_payment RPC", `Blocked with error: ${approveErr?.message}`);

  const { error: purgeErr } = await studentAClient.rpc('purge_candidate', {
    p_student_id: userB.id,
  });
  assert(!!purgeErr, "Student A cannot execute purge_candidate RPC", `Blocked with error: ${purgeErr?.message}`);
}

async function run() {
  console.log('========================================================');
  console.log('CAREER GUIDANCE ACADEMY (C.G.A) — SECURITY & IDOR SUITE');
  console.log('========================================================');

  try {
    await setupTestUsers();
    await testAnonymousAccess();
    await testStudentIdorIsolation();
  } catch (err) {
    console.error('\nTest suite execution error:', err);
  } finally {
    await cleanupTestUsers();
  }

  console.log('\n========================================================');
  console.log('SUMMARY RESULTS:');
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  console.log(`Total Tests: ${results.length} | Passed: ${passCount} | Failed: ${failCount}`);
  console.log('========================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

run().catch(console.error);
