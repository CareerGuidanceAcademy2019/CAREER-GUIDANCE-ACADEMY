import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

const envText = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx), l.slice(idx + 1).replace(/^["']|["']$/g, '')];
    })
);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const adminKey = env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !adminKey || !anonKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const adminSb = createClient(supabaseUrl, adminKey);
const anonSb = createClient(supabaseUrl, anonKey);

async function runVerification() {
  console.log('======================================================================');
  console.log('   CGA DATABASE READINESS & PERMANENT DELETION VERIFICATION SUITE    ');
  console.log('======================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      process.exitCode = 1;
    }
  }

  // ------------------------------------------------------------------
  // 1. COURSE PUBLISHING, EDITING & DELETION
  // ------------------------------------------------------------------
  console.log('--- 1. Course Publishing & Database Removal ---');
  const testCourseId = `v-crs-${Date.now()}`;
  
  // Publish Course
  const { error: insCourseErr } = await adminSb.from('courses').insert({
    id: testCourseId,
    name: 'Advanced Tripura TET 2026 Batch',
    mode: 'Online',
    category: 'Teaching and Recruitment Exams',
    sub_category: 'TET / STGT',
    description: 'High-yield course for government teaching recruitment.',
    syllabus_highlights: ['Mock Tests', 'OMR Practice', 'Faculty Doubt Clearing'],
    price: 4500,
    monthly_fee: 1200,
    instalment_available: true,
    first_instalment: 2500,
    batch_name: 'Super 30 TET Batch',
    batch_size: 30,
    seats_available: 30,
    waiting_list_count: 0,
    duration: '1 Year',
    start_date: '2026-11-01',
    schedule: 'Mon to Fri 10 AM',
    status: 'Open for Admission',
    featured: true,
    material_delivery: 'View-Only Softcopy',
  });
  assert(!insCourseErr, `Course published with mode, monthly_fee, and material_delivery (id: ${testCourseId})`);

  // Verify Course exists in DB
  const { data: fetchCourse } = await adminSb.from('courses').select('id, name, mode, monthly_fee').eq('id', testCourseId).single();
  assert(fetchCourse?.name === 'Advanced Tripura TET 2026 Batch' && fetchCourse?.mode === 'Online', 'Course retrieved with accurate database fields');

  // Edit Course
  const { error: updCourseErr } = await adminSb.from('courses').update({
    status: 'Batch Closed',
    seats_available: 0,
    price: 5000,
  }).eq('id', testCourseId);
  assert(!updCourseErr, 'Course edited/updated in database successfully');

  // Delete Course
  const { error: delCourseErr } = await adminSb.from('courses').delete().eq('id', testCourseId);
  assert(!delCourseErr, 'Course DELETE executed');

  const { data: postDelCourse } = await adminSb.from('courses').select('id').eq('id', testCourseId).maybeSingle();
  assert(postDelCourse === null, 'Course confirmed 100% permanently removed from database');


  // ------------------------------------------------------------------
  // 2. MOCK TEST PUBLISHING, EDITING & DELETION
  // ------------------------------------------------------------------
  console.log('\n--- 2. Mock Test Publishing & Database Removal ---');
  const testMockId = `v-mock-${Date.now()}`;

  // Publish Mock Test
  const { error: insMockErr } = await adminSb.from('mock_tests').insert({
    id: testMockId,
    title: 'TPSC Combined Prelims 2026 Grand Mock',
    subject: 'General Studies & Current Affairs',
    duration_minutes: 120,
    total_marks: 100,
    marks_per_question: 1,
    negative_marking: 0.25,
    scheduled_date: '2026-11-20',
    status: 'Published',
    content_status: 'active',
    questions: [
      {
        id: 'q1',
        question: 'Which district of Tripura is Udaipur located in?',
        options: ['West Tripura', 'Gomati', 'South Tripura', 'Dhalai'],
        correctOptionIndex: 1,
        explanation: 'Udaipur is the administrative headquarters of Gomati District.',
      }
    ],
  });
  assert(!insMockErr, `Mock test published in database (id: ${testMockId})`);

  // Verify Mock Test exists in DB
  const { data: fetchMock } = await adminSb.from('mock_tests').select('id, title, status').eq('id', testMockId).single();
  assert(fetchMock?.title === 'TPSC Combined Prelims 2026 Grand Mock' && fetchMock?.status === 'Published', 'Mock test retrieved with accurate database fields');

  // Edit Mock Test
  const { error: updMockErr } = await adminSb.from('mock_tests').update({
    status: 'Draft',
    title: 'TPSC Combined Prelims 2026 Grand Mock (Revised)',
  }).eq('id', testMockId);
  assert(!updMockErr, 'Mock test edited/updated in database successfully');

  // Delete Mock Test
  const { error: delMockErr } = await adminSb.from('mock_tests').delete().eq('id', testMockId);
  assert(!delMockErr, 'Mock test DELETE executed');

  const { data: postDelMock } = await adminSb.from('mock_tests').select('id').eq('id', testMockId).maybeSingle();
  assert(postDelMock === null, 'Mock test confirmed 100% permanently removed from database');


  // ------------------------------------------------------------------
  // 3. FACULTY PUBLISHING, EDITING & DELETION
  // ------------------------------------------------------------------
  console.log('\n--- 3. Faculty Publishing & Database Removal ---');
  const testFacId = `v-fac-${Date.now()}`;

  // Publish Faculty
  const { error: insFacErr } = await adminSb.from('faculty').insert({
    id: testFacId,
    name: 'Sri Animesh Chakraborty',
    designation: 'Senior TPSC Faculty',
    subject: 'Tripura GK & Current Affairs',
    qualification: 'M.A. (History), B.Ed.',
    experience: '10+ Years',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    bio: 'Renowned expert in Tripura state history and civil services exam preparation.',
    specialization_tags: ['Tripura GK', 'History of North-East'],
    achievements: 'Mentored 120+ selections in TPSC Combined and JRBT',
    work_ability: 'Online & Offline',
    approval_status: 'Approved',
  });
  assert(!insFacErr, `Faculty published in database (id: ${testFacId})`);

  // Edit Faculty
  const { error: updFacErr } = await adminSb.from('faculty').update({
    designation: 'Head of Civil Services Wing',
  }).eq('id', testFacId);
  assert(!updFacErr, 'Faculty updated in database successfully');

  // Delete Faculty
  const { error: delFacErr } = await adminSb.from('faculty').delete().eq('id', testFacId);
  assert(!delFacErr, 'Faculty DELETE executed');

  const { data: postDelFac } = await adminSb.from('faculty').select('id').eq('id', testFacId).maybeSingle();
  assert(postDelFac === null, 'Faculty confirmed 100% permanently removed from database');


  // ------------------------------------------------------------------
  // 4. ANNOUNCEMENT POSTING, PUBLIC HOME PAGE ACCESS & DELETION
  // ------------------------------------------------------------------
  console.log('\n--- 4. Announcements Bulletin & Public Read Access ---');
  const testAnnId = `v-ann-${Date.now()}`;

  // Admin posts Announcement
  const { error: insAnnErr } = await adminSb.from('announcements').insert({
    id: testAnnId,
    title: 'Admissions Open for Special Sunday TET Revision Batch',
    content: 'Registration is now open for intensive Sunday classroom batches at Chanban campus.',
    target_batch: 'All Batches',
    target_label: 'All Batches (Public Notice)',
    priority: 'Urgent',
    date: '2026-10-22',
    author: 'Director, C.G.A',
  });
  assert(!insAnnErr, `Announcement posted in database (id: ${testAnnId})`);

  // Verify anonymous visitor can read the announcement on the Home Page
  const { data: anonReadAnn, error: anonErr } = await anonSb.from('announcements').select('id, title, priority').eq('id', testAnnId).single();
  assert(!anonErr && anonReadAnn?.title?.includes('Special Sunday TET Revision'), 'Public anonymous read confirmed on Home Page bulletin');

  // Delete Announcement
  const { error: delAnnErr } = await adminSb.from('announcements').delete().eq('id', testAnnId);
  assert(!delAnnErr, 'Announcement DELETE executed');

  const { data: postDelAnn } = await adminSb.from('announcements').select('id').eq('id', testAnnId).maybeSingle();
  assert(postDelAnn === null, 'Announcement confirmed 100% permanently removed from database');


  // ------------------------------------------------------------------
  // 5. STUDENT PERMANENT DELETION CLEANUP
  // ------------------------------------------------------------------
  console.log('\n--- 5. Student Complete Database Removal ---');
  const uniqueSuffix = Date.now().toString().slice(-8);
  const testPhone = `91${uniqueSuffix}`;
  const testStudentEmail = `test_student_${Date.now()}@cga-test.internal`;
  const { data: authUser, error: createAuthErr } = await adminSb.auth.admin.createUser({
    email: testStudentEmail,
    password: 'TemporaryPassword123!',
    email_confirm: true,
    user_metadata: {
      name: 'Verification Candidate',
      phone: testPhone,
      guardian_name: 'Test Guardian',
      address: 'Udaipur, Tripura 799120',
      permanent_address: 'Udaipur, Tripura 799120',
      qualification: 'B.Ed Graduate',
      target_exam: 'T-TET Paper-II',
      role: 'student',
    },
  });
  if (createAuthErr) console.error('createAuthErr:', createAuthErr);
  assert(!createAuthErr && !!authUser?.user?.id, `Test student auth account created (email: ${testStudentEmail})`);
  const testStudentId = authUser?.user?.id;

  if (testStudentId) {
    const { data: createdProfile } = await adminSb.from('profiles').select('id, name, student_code').eq('id', testStudentId).maybeSingle();
    assert(createdProfile?.id === testStudentId, `Student profile auto-provisioned in database (code: ${createdProfile?.student_code})`);

    // Insert dummy enrollment
    const { error: insEnrollErr } = await adminSb.from('enrollments').insert({
      student_id: testStudentId,
      course_id: 'crs-tcs-tps-online',
      total_fee: 4000,
      paid_amount: 2000,
      due_amount: 2000,
    });
    if (insEnrollErr) console.error('insEnrollErr:', insEnrollErr);
    assert(!insEnrollErr, 'Associated student enrollment created');

    // Execute complete cascade deletion identical to /api/admin/students
    await adminSb.from('mock_attempts').delete().eq('student_id', testStudentId);
    await adminSb.from('series_enrollments').delete().eq('student_id', testStudentId);
    await adminSb.from('test_attempts').delete().eq('student_id', testStudentId);
    await adminSb.from('material_access').delete().eq('student_id', testStudentId);
    await adminSb.from('payment_requests').delete().eq('student_id', testStudentId);
    await adminSb.from('account_deletion_requests').delete().eq('student_id', testStudentId);
    await adminSb.from('fee_payments').delete().eq('student_id', testStudentId);
    await adminSb.from('enrollments').delete().eq('student_id', testStudentId);
    await adminSb.from('waiting_list').delete().eq('student_id', testStudentId);
    await adminSb.from('access_allowlist').delete().eq('identifier', testStudentEmail);
    await adminSb.from('access_allowlist').delete().eq('identifier', testPhone);
    const { error: delProfileErr } = await adminSb.from('profiles').delete().eq('id', testStudentId);
    assert(!delProfileErr, 'Student profile DELETE executed');

    // Delete auth user credentials
    const { error: delAuthErr } = await adminSb.auth.admin.deleteUser(testStudentId);
    assert(!delAuthErr, 'Student auth credentials permanently deleted from auth.users');

    // Confirm completely gone from database
    const { data: postDelProfile } = await adminSb.from('profiles').select('id').eq('id', testStudentId).maybeSingle();
    assert(postDelProfile === null, 'Student profile 100% permanently removed from database');

    const { data: postDelEnrollment } = await adminSb.from('enrollments').select('id').eq('student_id', testStudentId);
    assert((postDelEnrollment?.length ?? 0) === 0, 'Associated enrollments 100% permanently removed from database');
  }

  console.log('\n======================================================================');
  console.log(`VERIFICATION COMPLETE: ${passed} of ${total} assertions PASSED`);
  console.log('======================================================================');
}

runVerification();
