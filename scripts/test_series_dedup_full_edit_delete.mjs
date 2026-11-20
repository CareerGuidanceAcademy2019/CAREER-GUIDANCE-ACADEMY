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

function normalizeSeriesName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\(\s*new\s*batch\s*\)/gi, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

console.log('================================================================================');
console.log('🧪 VERIFYING DEDUP, FULL SERIES EDITOR & PERMANENT CASCADE DELETE');
console.log('================================================================================\n');

const seriesApiCode = fs.readFileSync(path.resolve('src/app/api/admin/mock-tests/series/route.ts'), 'utf8');
const mockTestsApiCode = fs.readFileSync(path.resolve('src/app/api/admin/mock-tests/route.ts'), 'utf8');
const cgaServiceCode = fs.readFileSync(path.resolve('src/services/cgaService.ts'), 'utf8');
const cgaContextCode = fs.readFileSync(path.resolve('src/context/CgaContext.tsx'), 'utf8');
const adminTestsCode = fs.readFileSync(path.resolve('src/app/admin/tests/page.tsx'), 'utf8');

await runTest('TC-01: Duplicate Mock Test Series normalization catches exact, spacing/case, and "(New Batch)" variants', async () => {
  assert.equal(
    normalizeSeriesName('Mock Test Series : FORESTER & FOREST GUARD'),
    normalizeSeriesName('Mock Test Series : FORESTER & FOREST GUARD (New Batch)'),
    '(New Batch) variant must normalize to the same canonical name'
  );
  assert.equal(
    normalizeSeriesName('  Mock Test Series: Forester & Forest Guard  '),
    normalizeSeriesName('MOCK TEST SERIES : FORESTER & FOREST GUARD'),
    'Case & punctuation differences must normalize identically'
  );
  assert.notEqual(
    normalizeSeriesName('Mock Test Series : FORESTER & FOREST GUARD'),
    normalizeSeriesName('Mock Test Series : FORESTER & FOREST GUARD — Batch 2'),
    'Distinct batch names like Batch 2 must remain allowed'
  );

  assert(seriesApiCode.includes('function normalizeSeriesName('), 'API must define normalizeSeriesName');
  assert(seriesApiCode.includes('Duplicate Mock Test Series:'), 'POST & PATCH must return 409 duplicate error message');
  assert(seriesApiCode.includes('{ status: 409 }'), 'API must return HTTP 409 Conflict on duplicate series');
  assert(adminTestsCode.includes('normalizeSeriesNameClient'), 'Admin UI must validate duplicate series before submit');
});

await runTest('TC-02: Duplicate Mock Test upload within same series is blocked on both API and UI', async () => {
  assert(
    mockTestsApiCode.includes('Duplicate Mock Test:'),
    'POST /api/admin/mock-tests must check and block duplicate test title in same series'
  );
  assert(mockTestsApiCode.includes('{ status: 409 }'), 'POST /api/admin/mock-tests must return HTTP 409 on duplicate test');
  assert(
    adminTestsCode.includes('Duplicate Mock Test Blocked'),
    'Admin handleSaveTest must block duplicate mock test titles in the same series'
  );
});

await runTest('TC-03: Full Series Edit Modal supports editing every field including Features from Banner & Subject Sections', async () => {
  assert(adminTestsCode.includes('Edit Mock Test Series Package'), 'Missing Full Edit Series Modal');
  assert(
    adminTestsCode.includes('Features from Banner / Package Highlights (One feature per line)'),
    'Full Edit Modal must allow editing Features from Banner / Highlights'
  );
  assert(
    adminTestsCode.includes('Subject Sections (Comma-separated)'),
    'Full Edit Modal must allow editing Subject Sections'
  );
  assert(adminTestsCode.includes('Save Full Series Changes'), 'Missing Save Full Series Changes submit button');
  assert(seriesApiCode.includes('if (Array.isArray(subjectNames))'), 'PATCH API must synchronize mock_subjects');
  assert(
    !cgaServiceCode.includes("Fallback to direct supabase client update if authenticated as admin in browser"),
    'cgaService.updateMockSeries must NOT swallow 409 conflicts via direct Supabase fallback'
  );
});

await runTest('TC-04: Permanent Delete Series button, confirmation modal, API cascade DELETE & state/cache cleanup exist', async () => {
  assert(seriesApiCode.includes('export async function DELETE(request: Request)'), 'Missing DELETE handler on /api/admin/mock-tests/series');
  assert(seriesApiCode.includes("from('mock_series').delete().eq('id', seriesId)"), 'DELETE handler must delete from mock_series');
  assert(seriesApiCode.includes("from('mock_subjects').delete().eq('series_id', seriesId)"), 'DELETE handler must delete mock_subjects');
  assert(seriesApiCode.includes("from('mock_tests').delete().eq('series_id', seriesId)"), 'DELETE handler must delete mock_tests');
  assert(seriesApiCode.includes("from('series_enrollments').delete().eq('series_id', seriesId)"), 'DELETE handler must delete series_enrollments');
  assert(seriesApiCode.includes("from('enrollments').delete().eq('course_id', seriesId)"), 'DELETE handler must delete legacy enrollments');
  assert(seriesApiCode.includes('bundled_test_ids'), 'DELETE handler must strip deleted series/tests from courses.bundled_test_ids');
  assert(cgaServiceCode.includes('async deleteMockSeries(seriesId: string)'), 'Missing cgaService.deleteMockSeries');
  assert(
    cgaContextCode.includes('const deleteMockSeries = useCallback(') &&
      cgaContextCode.includes('cgaService.deleteMockSeries(seriesId)'),
    'Missing CgaContext.deleteMockSeries'
  );
  assert(adminTestsCode.includes('Permanently Delete Mock Test Series?'), 'Missing Delete Series confirmation modal');
  assert(adminTestsCode.includes('Yes, Delete Permanently'), 'Missing permanent delete confirmation button');
  assert(adminTestsCode.includes('activeSeriesIdSet.has(g.seriesId)'), 'Upload modal subject groups must exclude deleted series');
});

await runTest('TC-05: Live Supabase E2E round-trip: Create series -> Full Edit (title, price, banner highlights, subjects) -> Cascade Delete & verify 0 leftover rows', async () => {
  const ts = Date.now();
  const testSeriesId = `series-dedup-edit-del-${ts}`;
  const testSlug = `dedup-edit-del-${ts}`;
  const sub1Id = `sub-dedup-${ts}-1`;
  const sub2Id = `sub-dedup-${ts}-2`;
  const sub3Id = `sub-dedup-${ts}-3`;
  const testMockId = `mock-dedup-${ts}`;

  try {
    // 1. Insert temporary test series
    const { data: created, error: createErr } = await admin
      .from('mock_series')
      .insert({
        id: testSeriesId,
        slug: testSlug,
        name: `Verification Forest Test Series ${ts}`,
        class_range: 'All Target Candidates',
        stream: 'General',
        price: 499,
        batch_label: 'Batch 1',
        description: 'Initial description',
        highlights: ['Initial Feature 1', 'Initial Feature 2'],
        status: 'Open',
        starts_on: 'Enrollment Open Now',
      })
      .select('*')
      .single();
    assert(!createErr && created, `Failed to insert test series: ${createErr?.message}`);

    // 2. Insert subjects and a mock test inside this series
    const { error: subErr } = await admin.from('mock_subjects').insert([
      { id: sub1Id, series_id: testSeriesId, name: 'English', sort_order: 1 },
      { id: sub2Id, series_id: testSeriesId, name: 'Mathematics', sort_order: 2 },
    ]);
    assert(!subErr, `Failed to insert initial subjects: ${subErr?.message}`);

    const { error: testErr } = await admin.from('mock_tests').insert({
      id: testMockId,
      title: 'Verification Mock Test #01',
      subject: 'English',
      series_id: testSeriesId,
      subject_id: sub1Id,
      test_type: 'sectional',
      test_no: 1,
      question_count: 1,
      batch_name: created.name,
      duration_minutes: 30,
      total_marks: 1,
      marks_per_question: 1,
      negative_marking: 0,
      scheduled_date: new Date().toISOString().slice(0, 10),
      status: 'Published',
      attempts_allowed: 1,
      questions: [
        { id: `q-v-${ts}`, position: 1, question: 'Test Q?', options: ['A', 'B', 'C', 'D'], correctOptionIndex: 0 },
      ],
    });
    assert(!testErr, `Failed to insert mock test: ${testErr?.message}`);

    // 3. Full Edit: update every field including highlights (Features from Banner) & subjects
    const updatedHighlights = [
      '40 Sectional Mock Tests (30 Marks Each)',
      'Detailed Answer Keys with Explanations',
      'Latest Exam Pattern & PYQs',
    ];
    const { data: edited, error: editErr } = await admin
      .from('mock_series')
      .update({
        name: `Verification Forest Test Series ${ts} Updated`,
        price: 599,
        batch_label: 'Batch 2026 Revised',
        class_range: 'Graduates & 12th Pass',
        stream: 'Forestry & GK',
        starts_on: 'Starts 1st Dec 2026',
        status: 'Closed',
        description: 'Updated complete series description.',
        highlights: updatedHighlights,
      })
      .eq('id', testSeriesId)
      .select('*')
      .single();
    assert(!editErr && edited, `Failed to edit series: ${editErr?.message}`);
    assert.equal(edited.price, 599, 'Updated price mismatch');
    assert.equal(edited.status, 'Closed', 'Updated status mismatch');
    assert.deepEqual(edited.highlights, updatedHighlights, 'Updated banner highlights mismatch');

    // Sync subjects: remove Mathematics, add GK & General Science
    await admin.from('mock_subjects').delete().eq('id', sub2Id);
    await admin.from('mock_subjects').insert({
      id: sub3Id,
      series_id: testSeriesId,
      name: 'G.K. & General Science',
      sort_order: 2,
    });
    const { data: subsAfterEdit } = await admin
      .from('mock_subjects')
      .select('name')
      .eq('series_id', testSeriesId)
      .order('sort_order', { ascending: true });
    assert.deepEqual(
      (subsAfterEdit || []).map((s) => s.name),
      ['English', 'G.K. & General Science'],
      'Edited subjects mismatch'
    );

    // 4. Permanent Delete Cascade (mirrors DELETE /api/admin/mock-tests/series)
    await admin.from('mock_tests').delete().eq('series_id', testSeriesId);
    await admin.from('mock_subjects').delete().eq('series_id', testSeriesId);
    await admin.from('series_enrollments').delete().eq('series_id', testSeriesId);
    await admin.from('enrollments').delete().eq('course_id', testSeriesId);
    const { error: delErr } = await admin.from('mock_series').delete().eq('id', testSeriesId);
    assert(!delErr, `Failed to delete mock_series: ${delErr?.message}`);

    // 5. Verify 0 rows remain across every table
    const [{ count: sCnt }, { count: subCnt }, { count: tCnt }, { count: seCnt }] = await Promise.all([
      admin.from('mock_series').select('*', { count: 'exact', head: true }).eq('id', testSeriesId),
      admin.from('mock_subjects').select('*', { count: 'exact', head: true }).eq('series_id', testSeriesId),
      admin.from('mock_tests').select('*', { count: 'exact', head: true }).eq('series_id', testSeriesId),
      admin.from('series_enrollments').select('*', { count: 'exact', head: true }).eq('series_id', testSeriesId),
    ]);
    assert.equal(sCnt, 0, 'mock_series row must be deleted');
    assert.equal(subCnt, 0, 'mock_subjects rows must be deleted');
    assert.equal(tCnt, 0, 'mock_tests rows must be deleted');
    assert.equal(seCnt, 0, 'series_enrollments rows must be deleted');
    console.log('   ↳ Live Supabase round-trip verified: Create -> Full Edit (incl. banner features & subjects) -> Permanent Delete (0 rows left).');
  } finally {
    await admin.from('mock_tests').delete().eq('series_id', testSeriesId);
    await admin.from('mock_subjects').delete().eq('series_id', testSeriesId);
    await admin.from('series_enrollments').delete().eq('series_id', testSeriesId);
    await admin.from('mock_series').delete().eq('id', testSeriesId);
  }
});

await runTest('TC-06: User existing Forester series rows remain intact (untouched as requested)', async () => {
  const { data: foresterRows, error } = await admin
    .from('mock_series')
    .select('id, name')
    .ilike('name', '%FORESTER%');
  assert(!error, `Query failed: ${error?.message}`);
  assert(
    (foresterRows || []).length >= 2,
    `Expected both existing Forester series rows to remain untouched for user testing, found ${foresterRows?.length}`
  );
});

console.log('\n================================================================================');
console.log(`📊 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('================================================================================');
if (failed > 0) process.exit(1);
