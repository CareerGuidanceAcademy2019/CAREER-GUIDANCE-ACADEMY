import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let passed = 0;
let failed = 0;

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error('   Reason:', err?.message || err);
    failed++;
  }
}

console.log('================================================================================');
console.log('🧪 VERIFYING MOCK TEST SERIES PUBLISHER & NEW BATCH LAUNCH WORKFLOW');
console.log('================================================================================\n');

await runTest('TC-01: API /api/admin/mock-tests/series implements POST (create/clone) and PATCH (full edit)', async () => {
  const routeCode = fs.readFileSync(path.resolve('src/app/api/admin/mock-tests/series/route.ts'), 'utf8');
  assert(routeCode.includes('export async function POST(request: Request)'), 'Missing POST handler');
  assert(routeCode.includes('export async function PATCH(request: Request)'), 'Missing PATCH handler');
  assert(routeCode.includes('cloneFromSeriesId'), 'POST must support cloning an existing series');
  assert(routeCode.includes('copyExistingTests'), 'POST must support optionally copying tests from source series');
  assert(routeCode.includes("from('mock_subjects').insert"), 'POST must create subject sections for the new series');
});

await runTest('TC-02: Admin Tests page exposes Post/Publish New Series, full Edit Series Modal, and Permanent Delete controls', async () => {
  const adminTestsCode = fs.readFileSync(path.resolve('src/app/admin/tests/page.tsx'), 'utf8');
  assert(adminTestsCode.includes('Post / Publish New Series'), 'Missing Publish New Series button');
  assert(adminTestsCode.includes('Edit Mock Test Series Package'), 'Missing Full Edit Series modal');
  assert(adminTestsCode.includes('Permanently Delete Mock Test Series?'), 'Missing Delete Series confirmation modal');
  assert(adminTestsCode.includes('Publish New Mock Test Series Package'), 'Missing Publish Series modal');
  assert(adminTestsCode.includes('createMockSeries'), 'Admin UI must call createMockSeries');
  assert(adminTestsCode.includes('deleteMockSeries'), 'Admin UI must call deleteMockSeries');
});

await runTest('TC-03: Student Portal displays open newly published series, dynamic subjects, and Enroll button', async () => {
  const studentTestsCode = fs.readFileSync(path.resolve('src/app/student/tests/page.tsx'), 'utf8');
  assert(studentTestsCode.includes("status !== 'Archived'"), 'Student Portal must filter out archived series');
  assert(studentTestsCode.includes('activeSubjectsPool'), 'Student Portal must read dynamic db.mockSubjects');
  assert(
    studentTestsCode.includes("Enrol Now @ ₹{selectedSeriesObj?.price ?? 499}/-"),
    'Student Portal must allow enrolling in any newly published Open series'
  );
});

await runTest('TC-04: Live Supabase DB round-trip test for creating & cleaning up a cloned TET Paper-II Science series (₹499)', async () => {
  const testId = `series-test-verify-${Date.now()}`;
  const slug = `test-verify-${Date.now()}`;

  const { data: srcSubs } = await admin
    .from('mock_subjects')
    .select('*')
    .eq('series_id', 'series-ttet-paper2-sci')
    .order('sort_order', { ascending: true });
  assert(srcSubs && srcSubs.length === 5, `Expected 5 subjects on series-ttet-paper2-sci, got ${srcSubs?.length}`);

  const { data: created, error: insErr } = await admin
    .from('mock_series')
    .insert({
      id: testId,
      slug,
      name: 'Tripura TET: Paper-II (Science) 2026 (Verification Batch)',
      class_range: 'Classes VI to VIII',
      stream: 'Science',
      price: 499,
      batch_label: 'Verify Batch',
      description: 'Test verification batch',
      highlights: ['40+ Sectional Mock Tests'],
      status: 'Open',
      starts_on: 'Enrollment Open Now',
    })
    .select('*')
    .single();
  assert(!insErr && created, `Failed to insert test series: ${insErr?.message}`);

  const subRows = srcSubs.map((s, idx) => ({
    id: `sub-verify-${Date.now()}-${idx}`,
    series_id: testId,
    name: s.name,
    sort_order: s.sort_order,
  }));
  const { error: subErr } = await admin.from('mock_subjects').insert(subRows);
  assert(!subErr, `Failed to insert cloned subjects: ${subErr?.message}`);

  // Cleanup immediately so live catalog stays clean
  await admin.from('mock_subjects').delete().eq('series_id', testId);
  await admin.from('mock_series').delete().eq('id', testId);
});

console.log('\n================================================================================');
console.log(`📊 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('================================================================================');
if (failed > 0) process.exit(1);
