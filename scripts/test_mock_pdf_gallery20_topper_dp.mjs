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
console.log('🧪 VERIFYING MOCK TEST PDF HUB, 20-PHOTO GALLERY & 20-50KB TOPPER DP UPLOAD');
console.log('================================================================================\n');

const adminMaterialsCode = fs.readFileSync(path.resolve('src/app/admin/materials/page.tsx'), 'utf8');
const studentMaterialsCode = fs.readFileSync(path.resolve('src/app/student/materials/page.tsx'), 'utf8');
const myLearningCode = fs.readFileSync(path.resolve('src/app/student/my-learning/page.tsx'), 'utf8');
const materialsApiCode = fs.readFileSync(path.resolve('src/app/api/admin/materials/route.ts'), 'utf8');
const homePageCode = fs.readFileSync(path.resolve('src/app/page.tsx'), 'utf8');
const adminSiteContentCode = fs.readFileSync(path.resolve('src/app/admin/site-content/page.tsx'), 'utf8');
const siteContentApiCode = fs.readFileSync(path.resolve('src/app/api/admin/site-content/route.ts'), 'utf8');
const imageCompressorCode = fs.readFileSync(path.resolve('src/lib/imageCompressor.ts'), 'utf8');
const adminAchievementsCode = fs.readFileSync(path.resolve('src/app/admin/achievements/page.tsx'), 'utf8');
const achievementsApiCode = fs.readFileSync(path.resolve('src/app/api/admin/achievements/route.ts'), 'utf8');

await runTest('TC-01: Admin Study Materials has separate "Mock Test PDF" section targeting all ongoing & newly launched Mock Test Series', async () => {
  assert(
    adminMaterialsCode.includes("type ActiveSubsection = 'course_materials' | 'mock_test_pdf' | 'current_affairs'"),
    'Admin materials page must define mock_test_pdf subsection'
  );
  assert(adminMaterialsCode.includes('<span>Mock Test PDF</span>'), 'Admin materials page must have Mock Test PDF tab');
  assert(adminMaterialsCode.includes('Upload Mock Test PDF'), 'Admin materials page must have Upload Mock Test PDF button');
  assert(
    adminMaterialsCode.includes('ongoingMockSeriesList'),
    'Admin Mock Test PDF modal must dynamically list all ongoing & newly launched mock series from db.mockSeries'
  );
  assert(
    materialsApiCode.includes("const isMockTestPdf = mat.type === 'Mock Test PDF'") &&
      materialsApiCode.includes('series_id: targetSeriesId'),
    'POST /api/admin/materials must persist type="Mock Test PDF" and series_id'
  );
});

await runTest('TC-02: Student Study Materials & My Learning enforce strict series-enrollment lock on Mock Test PDFs', async () => {
  assert(
    studentMaterialsCode.includes("type StudentMaterialTab = 'course_materials' | 'mock_test_pdf' | 'current_affairs'"),
    'Student materials page must define mock_test_pdf tab'
  );
  assert(
    studentMaterialsCode.includes('isStudentEnrolledInMockSeries'),
    'Student materials page must verify enrollment in the specific target Mock Test Series'
  );
  assert(
    studentMaterialsCode.includes('Locked — Only for students enrolled in {mpdf.targetSeriesName}'),
    'Non-enrolled students must see the locked view for Mock Test PDFs'
  );
  assert(
    studentMaterialsCode.includes('Open Mock Test PDF (Drive)'),
    'Enrolled students must be able to view and open the Mock Test PDF Drive link'
  );
  assert(
    myLearningCode.includes("if (mat.type === 'Mock Test PDF' || mat.seriesId)"),
    'My Learning must check series enrollment before price===0 so Mock Test PDFs are never unlocked for non-enrolled students'
  );
});

await runTest('TC-03: Front-page main website gallery limit increased to 20 images with auto-compression before posting', async () => {
  assert(imageCompressorCode.includes('export const MAX_CAMPUS_IMAGES = 20;'), 'MAX_CAMPUS_IMAGES must be 20');
  assert(homePageCode.includes('MAX_CAMPUS_IMAGES'), 'Front page must use MAX_CAMPUS_IMAGES (20)');
  assert(
    homePageCode.includes('disabled={(!editingCampusPhoto && !compressedResult) || isSavingCampusPhoto}'),
    'Admin cannot post a new front-page image until auto-compression finishes'
  );
  assert(adminSiteContentCode.includes('MAX_CAMPUS_IMAGES'), 'Admin Site Content CMS must enforce MAX_CAMPUS_IMAGES (20)');
  assert(siteContentApiCode.includes('MAX_CAMPUS_IMAGES'), 'API /api/admin/site-content must enforce MAX_CAMPUS_IMAGES (20)');
});

await runTest('TC-04: Toppers / Achievements section removes auto-avatar generator on save & enforces 20 KB – 50 KB Admin DP upload + re-upload', async () => {
  assert(imageCompressorCode.includes('export const TOPPER_DP_MIN_KB = 20;'), 'TOPPER_DP_MIN_KB must be 20');
  assert(imageCompressorCode.includes('export const TOPPER_DP_MAX_KB = 50;'), 'TOPPER_DP_MAX_KB must be 50');
  assert(imageCompressorCode.includes('export async function compressTopperPhoto('), 'compressTopperPhoto helper must exist');
  assert(
    !adminAchievementsCode.includes('const finalPhoto = generateInitialsAvatarSvgDataUrl(editing.name);'),
    'Admin Achievements handleSave must NOT overwrite photo with automatic initials avatar'
  );
  assert(
    adminAchievementsCode.includes('Change / Re-upload Candidate DP') &&
      adminAchievementsCode.includes('Upload Candidate DP'),
    'Admin Achievements modal must allow uploading and changing/re-uploading candidate DP'
  );
  assert(
    achievementsApiCode.includes('sizeKb < TOPPER_DP_MIN_KB || sizeKb > TOPPER_DP_MAX_KB'),
    'POST /api/admin/achievements must enforce 20 KB – 50 KB size range on uploaded candidate DPs'
  );
});

await runTest('TC-05: Live Supabase E2E round-trip: Upload Mock Test PDF for ongoing series + Upload Topper with 32 KB DP + Verify & Clean Rollback', async () => {
  const ts = Date.now();
  const mockPdfId = `mpdf-e2e-${ts}`;
  const topperId = `ach-e2e-${ts}`;

  // Fetch one real ongoing mock_series and one real course
  const [{ data: seriesRow }, { data: courseRow }] = await Promise.all([
    admin.from('mock_series').select('id, name').neq('id', 'series-current-affairs').limit(1).single(),
    admin.from('courses').select('id').limit(1).single(),
  ]);
  assert(seriesRow?.id && courseRow?.id, 'Expected at least 1 mock_series and 1 course in Supabase');

  try {
    // 1. Insert a Mock Test PDF targeted to seriesRow.id
    const { data: insertedPdf, error: pdfErr } = await admin
      .from('study_materials')
      .insert({
        id: mockPdfId,
        title: `E2E Mock Test PDF — ${seriesRow.name}`,
        course_id: courseRow.id,
        series_id: seriesRow.id,
        type: 'Mock Test PDF',
        ca_category: null,
        drive_link: 'https://drive.google.com/file/d/e2e-mock-test-pdf/view?usp=sharing',
        access_scope: 'enrolled',
        subject: seriesRow.name,
        author: 'C.G.A Examination Wing',
        pages: 20,
        file_size: 'PDF (Google Drive)',
        uploaded_date: new Date().toISOString().slice(0, 10),
        description: 'E2E verification Mock Test PDF',
        preview_sections: [{ heading: 'Mock Test PDF', body: 'Sample preview' }],
        price: 0,
      })
      .select('id, type, series_id, drive_link')
      .single();
    assert(!pdfErr && insertedPdf, `Insert Mock Test PDF failed: ${pdfErr?.message}`);
    assert.equal(insertedPdf.type, 'Mock Test PDF');
    assert.equal(insertedPdf.series_id, seriesRow.id);

    // 2. Insert a Topper Achievement with a ~32 KB base64 image dataUrl (within 20 KB – 50 KB) & re-upload update
    const dummyBytes32Kb = Buffer.alloc(32 * 1024, 0x41).toString('base64');
    const dpDataUrl32Kb = `data:image/jpeg;base64,${dummyBytes32Kb}`;
    const { data: insertedTopper, error: topErr } = await admin
      .from('achievements')
      .insert({
        id: topperId,
        name: 'E2E Verified Topper',
        exam: 'Tripura TET Paper-II',
        rank: 'State Rank 01',
        year: '2026',
        photo: dpDataUrl32Kb,
        quote: 'Verified topper DP upload between 20KB and 50KB.',
        category: 'Teaching and Recruitment Exams',
      })
      .select('id, name, rank, photo')
      .single();
    assert(!topErr && insertedTopper, `Insert Topper failed: ${topErr?.message}`);
    assert(insertedTopper.photo.startsWith('data:image/jpeg;base64,'), 'Topper DP must be stored in DB');

    // Simulate admin changing / re-uploading the candidate DP (e.g. 38 KB)
    const dummyBytes38Kb = Buffer.alloc(38 * 1024, 0x42).toString('base64');
    const dpDataUrl38Kb = `data:image/webp;base64,${dummyBytes38Kb}`;
    const { data: updatedTopper, error: updTopErr } = await admin
      .from('achievements')
      .update({ photo: dpDataUrl38Kb })
      .eq('id', topperId)
      .select('id, photo')
      .single();
    assert(!updTopErr && updatedTopper?.photo === dpDataUrl38Kb, 'Admin re-upload topper DP failed');

    console.log(
      `   ↳ Live DB verified: Mock Test PDF linked to series (${seriesRow.id}) + Topper DP upload (32 KB) & re-upload (38 KB)!`
    );
  } finally {
    await admin.from('study_materials').delete().eq('id', mockPdfId);
    await admin.from('achievements').delete().eq('id', topperId);
  }
});

console.log('\n================================================================================');
console.log(`📊 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('================================================================================');
if (failed > 0) process.exit(1);
