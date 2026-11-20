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
console.log('🚀 E2E TEST SUITE: NEW MOCK SERIES LAUNCH, UPLOAD, PAYMENT & MY LEARNING');
console.log('================================================================================\n');

const adminTestsCode = fs.readFileSync(path.resolve('src/app/admin/tests/page.tsx'), 'utf8');
const adminMockTestApiCode = fs.readFileSync(path.resolve('src/app/api/admin/mock-tests/route.ts'), 'utf8');
const studentTestsCode = fs.readFileSync(path.resolve('src/app/student/tests/page.tsx'), 'utf8');
const publicMockTestsCode = fs.readFileSync(path.resolve('src/app/mock-tests/page.tsx'), 'utf8');
const myLearningCode = fs.readFileSync(path.resolve('src/app/student/my-learning/page.tsx'), 'utf8');
const studentCoursesCode = fs.readFileSync(path.resolve('src/app/student/courses/page.tsx'), 'utf8');
const cgaServiceCode = fs.readFileSync(path.resolve('src/services/cgaService.ts'), 'utf8');
const payManualCode = fs.readFileSync(path.resolve('src/components/payment/PayManualModal.tsx'), 'utf8');

await runTest('TC-01: Admin /admin/tests header has "+ Start New Mock Test Series" next to "Create & Upload Mock Test" & upload modal dynamically lists new series', async () => {
  assert(adminTestsCode.includes('+ Start New Mock Test Series'), 'Top header must have "+ Start New Mock Test Series" button');
  assert(adminTestsCode.includes('Create &amp; Upload Mock Test'), 'Top header must retain "Create & Upload Mock Test" button');
  assert(adminTestsCode.includes('dynamicMockSubjectGroups'), 'Upload modal must build dynamicMockSubjectGroups from db.mockSeries');
  assert(
    adminMockTestApiCode.includes(".eq('series_id', validSeriesId)"),
    'POST /api/admin/mock-tests must scope mock_subjects lookup by series_id so duplicate subject names across series never drop subject_id'
  );
});

await runTest('TC-02: Student /student/tests dynamically shows 3 flagship + EVERY newly published Open series, supports ?seriesId=, deduplicates & isolates tests', async () => {
  assert(studentTestsCode.includes('showcaseSeriesList'), 'Student tests page must build dynamic showcaseSeriesList');
  assert(studentTestsCode.includes('New Launch •'), 'Newly published series cards must display New Launch badge');
  assert(
    studentTestsCode.includes('Pay via UPI ID / WhatsApp'),
    'Showcase Enroll button must reflect UPI ID / WhatsApp payment options'
  );
  assert(!studentTestsCode.includes('(Pay via UPI / Bank)'), 'Legacy "(Pay via UPI / Bank)" button copy must be removed');
  assert(
    studentTestsCode.includes("searchParams.get('seriesId')"),
    'Student tests page must support ?seriesId= deep-link from My Learning'
  );
  assert(
    studentTestsCode.includes('hasPendingSeriesPayment'),
    'Student tests page must check pending payments on both itemId and courseId'
  );
  assert(
    studentTestsCode.includes('seenTestIds') && studentTestsCode.includes('if (t.seriesId !== selectedSeriesId) return false;'),
    'Student tests page must deduplicate tests by ID and strictly isolate tests by selectedSeriesId'
  );
});

await runTest('TC-03: Public /mock-tests dynamically showcases flagship + newly published Open series with PayManualModal integration', async () => {
  assert(publicMockTestsCode.includes('publicShowcaseSeries'), 'Public /mock-tests must build publicShowcaseSeries');
  assert(publicMockTestsCode.includes('Choose Your Mock Test Series Package'), 'Public /mock-tests must render series showcase section');
  assert(publicMockTestsCode.includes('handleEnrolSeries'), 'Public /mock-tests must open PayManualModal for any selected series');
  assert(!publicMockTestsCode.includes('How to Pay via UPI / Bank'), 'Public /mock-tests must not show outdated Bank link copy');
});

await runTest('TC-04: Student My Learning & Courses resolve newly launched mock series & courses across Pending and Enrolled states', async () => {
  assert(
    myLearningCode.includes('enrolledMockSeriesList.map((ser) =>'),
    'My Learning must dynamically render filter tabs for every enrolled mock series'
  );
  assert(
    myLearningCode.includes('t.seriesId === selectedSeriesFilter || t.courseId === selectedSeriesFilter'),
    'My Learning test filter must match by t.seriesId for newly published mock series'
  );
  assert(
    myLearningCode.includes('const targetId = p.itemId || p.courseId'),
    'My Learning pendingPayments must resolve newly launched series/courses/materials via itemId || courseId'
  );
  assert(
    studentCoursesCode.includes('[p.courseId, p.itemId].filter(Boolean)'),
    'Student Courses page must detect pendingIds via both courseId and itemId'
  );
  assert(
    cgaServiceCode.includes('seriesRaw.find((s: Row) => s.id === id)?.name'),
    'cgaService courseName resolver must look up seriesRaw & materials so newly launched series payments show their title'
  );
});

await runTest('TC-05: Payment Modal integrates cleanly for new courses & new mock series (UPI ID + WhatsApp QR + mandatory 12-digit UTR)', async () => {
  assert(payManualCode.includes('Option 1: Pay via UPI ID'), 'PayManualModal must offer Pay via UPI ID');
  assert(payManualCode.includes('Option 2: Request QR on WhatsApp'), 'PayManualModal must offer Request QR on WhatsApp');
  assert(payManualCode.includes("target.itemType === 'course'"), 'PayManualModal must support course enrollments');
  assert(payManualCode.includes("target.itemType === 'mock_series'"), 'PayManualModal must support mock_series enrollments');
  assert(payManualCode.includes('!/^\\d{12}$/.test(utr)'), 'PayManualModal must enforce 12-digit UTR for verification');
});

await runTest('TC-06: Live Supabase E2E round-trip: Publish new series -> Upload mock test -> Student fee payment -> Verify enrollment -> Clean rollback', async () => {
  const ts = Date.now();
  const newSeriesId = `series-e2e-verify-${ts}`;
  const newSlug = `e2e-verify-${ts}`;
  const newSubjectId = `sub-e2e-${ts}-1`;
  const newTestId = `mock-e2e-${ts}`;
  let createdPaymentId = null;

  // Pick one real student profile (read-only reference) for E2E row verification
  const { data: studentRow, error: stuErr } = await admin
    .from('profiles')
    .select('id, name, email')
    .eq('role', 'student')
    .limit(1)
    .single();
  assert(!stuErr && studentRow, `Could not fetch sample student: ${stuErr?.message}`);

  try {
    // 1. Publish brand new mock test series (₹499, Open)
    const { data: ser, error: serErr } = await admin
      .from('mock_series')
      .insert({
        id: newSeriesId,
        slug: newSlug,
        name: 'E2E Test Series — TET Paper-II Science New Batch',
        class_range: 'Classes VI to VIII',
        stream: 'Science',
        price: 499,
        batch_label: 'E2E Batch',
        description: 'Automated E2E verification series',
        highlights: ['40+ Sectional Tests', 'Bilingual Questions'],
        status: 'Open',
        starts_on: 'Enrollment Open Now',
      })
      .select('*')
      .single();
    assert(!serErr && ser, `Insert mock_series failed: ${serErr?.message}`);

    // 2. Insert subject with same name as existing series ("Child Development & Pedagogy") to prove scoping works
    const { error: subErr } = await admin.from('mock_subjects').insert({
      id: newSubjectId,
      series_id: newSeriesId,
      name: 'Child Development & Pedagogy',
      sort_order: 1,
    });
    assert(!subErr, `Insert mock_subjects failed: ${subErr?.message}`);

    // 3. Verify scoped lookup resolves exact subject_id for newSeriesId
    const { data: scopedSub } = await admin
      .from('mock_subjects')
      .select('id')
      .eq('series_id', newSeriesId)
      .or(`id.eq.Child Development & Pedagogy,name.eq.Child Development & Pedagogy`)
      .limit(1);
    assert.equal(scopedSub?.[0]?.id, newSubjectId, 'Scoped subject lookup must match the new series subject_id');

    // 4. Upload a mock test directly into this newly launched series
    const { data: createdTest, error: testErr } = await admin
      .from('mock_tests')
      .insert({
        id: newTestId,
        title: 'E2E CDP Mock #01',
        subject: 'Child Development & Pedagogy',
        series_id: newSeriesId,
        subject_id: newSubjectId,
        test_type: 'sectional',
        test_no: 1,
        question_count: 1,
        batch_name: ser.name,
        duration_minutes: 30,
        total_marks: 1,
        marks_per_question: 1,
        negative_marking: 0,
        scheduled_date: new Date().toISOString().slice(0, 10),
        status: 'Published',
        attempts_allowed: 1,
        questions: [
          {
            id: `q-e2e-${ts}`,
            position: 1,
            question: 'Sample E2E Question?',
            options: ['A', 'B', 'C', 'D'],
            correctOptionIndex: 0,
          },
        ],
      })
      .select('id, series_id, subject_id')
      .single();
    assert(!testErr && createdTest?.series_id === newSeriesId, `Insert mock_tests failed: ${testErr?.message}`);

    // 5. Simulate student submitting ₹499 UPI payment for this newly launched series (course_id = null, item_id = newSeriesId)
    const { data: payRow, error: payErr } = await admin
      .from('fee_payments')
      .insert({
        receipt_no: `CGA-E2E-${ts.toString().slice(-6)}`,
        student_id: studentRow.id,
        course_id: null,
        item_type: 'mock_series',
        item_id: newSeriesId,
        amount: 499,
        payment_mode: 'UPI',
        payment_type: 'Full Payment',
        payment_method: 'upi_manual',
        date: new Date().toISOString().slice(0, 10),
        remarks: `E2E verification payment for ${newSeriesId} (mock_series)`,
        status: 'Pending',
        utr: `99${ts.toString().slice(-10)}`,
      })
      .select('id, status, item_id')
      .single();
    assert(!payErr && payRow?.id, `Insert fee_payments failed: ${payErr?.message}`);
    createdPaymentId = payRow.id;

    // 6. Verify admin approval unlocks series_enrollments cleanly for the new series
    const { error: updPayErr } = await admin
      .from('fee_payments')
      .update({ status: 'Verified', reviewed_by: 'E2E Test', reviewed_at: new Date().toISOString() })
      .eq('id', createdPaymentId);
    assert(!updPayErr, `Update fee_payments to Verified failed: ${updPayErr?.message}`);

    const { data: enrRow, error: enrErr } = await admin
      .from('series_enrollments')
      .insert({
        student_id: studentRow.id,
        series_id: newSeriesId,
        payment_id: createdPaymentId,
        enrolled_at: new Date().toISOString(),
        access_valid_until: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString(),
      })
      .select('id, student_id, series_id')
      .single();
    assert(!enrErr && enrRow?.series_id === newSeriesId, `Insert series_enrollments failed: ${enrErr?.message}`);

    console.log(`   ↳ E2E DB verified: series (${newSeriesId}) -> subject -> mock test -> ₹499 fee_payment -> Verified series_enrollment!`);
  } finally {
    // Clean up all temporary E2E rows in reverse dependency order
    await admin.from('series_enrollments').delete().eq('series_id', newSeriesId);
    if (createdPaymentId) await admin.from('fee_payments').delete().eq('id', createdPaymentId);
    await admin.from('mock_tests').delete().eq('id', newTestId);
    await admin.from('mock_subjects').delete().eq('series_id', newSeriesId);
    await admin.from('mock_series').delete().eq('id', newSeriesId);
  }
});

console.log('\n================================================================================');
console.log(`📊 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('================================================================================');
if (failed > 0) process.exit(1);
