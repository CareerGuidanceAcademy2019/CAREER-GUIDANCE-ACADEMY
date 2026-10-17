import assert from 'node:assert/strict';

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) {
  console.error('SUPABASE_ACCESS_TOKEN environment variable is required');
  process.exit(1);
}
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'craicxwqaygdydtdaxtw';

async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errText}`);
  }
  return await res.json();
}

async function main() {
  console.log('[VERIFY] Running Gravitas Live Supabase Database Verification Suite...\n');

  let passed = 0;
  let failed = 0;

  async function check(name, fn) {
    try {
      await fn();
      console.log(`  [SUCCESS] PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] FAIL: ${name}`);
      console.error(`     ${err.message}`);
      failed++;
    }
  }

  // 1. Check Tables in public schema
  await check('All 18 core application tables exist in public schema', async () => {
    const rows = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    const tables = rows.map((r) => r.table_name);
    console.log(`     Found ${tables.length} tables:`, tables.join(', '));
    const required = [
      'access_allowlist',
      'achievements',
      'announcements',
      'courses',
      'enquiries',
      'enrollments',
      'faculty',
      'fee_payments',
      'material_access',
      'mock_attempts',
      'mock_series',
      'mock_subjects',
      'mock_tests',
      'payment_audit_log',
      'payment_requests',
      'payment_settings',
      'profiles',
      'sample_utr_blocklist',
      'series_enrollments',
      'study_materials',
      'test_attempts',
      'waiting_list',
    ];
    for (const req of required) {
      assert.ok(tables.includes(req), `Missing expected table: ${req}`);
    }
  });

  // 2. Check Storage Buckets
  await check('Private storage bucket "payment-proofs" exists with 5MB limit', async () => {
    const rows = await query(`
      SELECT id, name, public, file_size_limit, allowed_mime_types 
      FROM storage.buckets 
      WHERE id = 'payment-proofs';
    `);
    assert.equal(rows.length, 1, 'Bucket payment-proofs not found in storage.buckets');
    assert.equal(rows[0].public, false, 'payment-proofs bucket should be private');
    assert.equal(rows[0].file_size_limit, 5242880, 'payment-proofs should have 5MB limit');
  });

  // 3. Check Payment Settings Row
  await check('payment_settings contains authentic C.G.A institute credentials', async () => {
    const rows = await query(`
      SELECT institute_name, payee_name, upi_id, bank_account_number, bank_ifsc, bank_name, support_phone
      FROM public.payment_settings
      WHERE id = 1;
    `);
    assert.equal(rows.length, 1, 'payment_settings row id=1 missing');
    const s = rows[0];
    assert.equal(s.upi_id, 'popighosh40@okicici');
    assert.equal(s.bank_account_number, '37660443471');
    assert.equal(s.bank_ifsc, 'SBIN0000216');
    assert.equal(s.bank_name, 'SBI, UDAIPUR.');
    assert.equal(s.support_phone, '+91-7005929189');
  });

  // 4. Check Stored Functions (RPCs)
  await check('Payment & security RPCs exist and are callable', async () => {
    const rows = await query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
        AND routine_name IN (
          'create_payment_request',
          'submit_payment_proof',
          'approve_payment',
          'reject_payment',
          'delete_candidate_by_admin',
          'resolve_login_email',
          'is_admin'
        );
    `);
    const funcs = rows.map((r) => r.routine_name);
    assert.ok(funcs.includes('create_payment_request'));
    assert.ok(funcs.includes('submit_payment_proof'));
    assert.ok(funcs.includes('approve_payment'));
    assert.ok(funcs.includes('reject_payment'));
    assert.ok(funcs.includes('delete_candidate_by_admin'));
    assert.ok(funcs.includes('resolve_login_email'));
    assert.ok(funcs.includes('is_admin'));
  });

  // 5. Check Sample UTR Blocklist
  await check('sample_utr_blocklist is seeded with dummy test UTRs', async () => {
    const rows = await query(`SELECT count(*) as count FROM public.sample_utr_blocklist;`);
    const count = Number(rows[0].count);
    assert.ok(count >= 10, `Expected at least 10 dummy UTRs blocked, found ${count}`);
  });

  // 6. Check Faculty Seeding
  await check('Mr. R. Debnath and Mr. B. Das are seeded into faculty table', async () => {
    const rows = await query(`
      SELECT name, designation, subject, qualification 
      FROM public.faculty 
      WHERE name IN ('Mr. R. Debnath', 'Mr. B. Das');
    `);
    const names = rows.map((r) => r.name);
    assert.ok(names.includes('Mr. R. Debnath'), 'Mr. R. Debnath missing from faculty');
    assert.ok(names.includes('Mr. B. Das'), 'Mr. B. Das missing from faculty');
  });

  // 7. Check Access Allowlist
  await check('Institute Admin emails & phone numbers are in access_allowlist', async () => {
    const rows = await query(`
      SELECT identifier, role 
      FROM public.access_allowlist 
      WHERE role = 'admin';
    `);
    const ids = rows.map((r) => r.identifier);
    assert.ok(ids.includes('careerguidanceacademy2019@gmail.com'));
    assert.ok(ids.includes('7005929189'));
    assert.ok(ids.includes('angatsaha825@gmail.com'));
    assert.ok(ids.includes('7629882835'));
  });

  console.log(`\n============================================================`);
  console.log(`Gravitas Database Verdict: ${passed} Passed, ${failed} Failed.`);
  console.log(`============================================================\n`);

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
