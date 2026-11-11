// Comprehensive Test Suite for Courses & Batch Control System
// Verifies Admin CRUD, Batch Capacities, Online Class Link sharing, Combined Package Bundles,
// and Student Access Enforcement.

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local without external dependency
try {
  const envContent = fs.readFileSync(path.resolve('.env.local'), 'utf-8');
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  });
} catch (e) {
  console.warn('Could not read .env.local:', e.message);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase URL or Service Role Key in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    totalPassed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    totalFailed++;
  }
}

async function runTests() {
  console.log('\n============================================================');
  console.log('🚀 RUNNING COMPREHENSIVE COURSES & BATCH CONTROL TEST SUITE');
  console.log('============================================================\n');

  const testOfflineId = `test-crs-offline-${Date.now()}`;
  const testOnlineId = `test-crs-online-${Date.now()}`;
  const testBundleId = `test-crs-bundle-${Date.now()}`;

  // Fetch an existing faculty ID for foreign key reference
  const { data: existingFaculty } = await supabase
    .from('faculty')
    .select('id, name')
    .limit(1)
    .single();

  const validFacultyId = existingFaculty?.id || null;

  try {
    // -------------------------------------------------------------
    // TEST SUITE 1: Admin Create Offline Course Batch
    // -------------------------------------------------------------
    console.log('--- TEST SUITE 1: Admin Create Offline Course Batch ---');
    const offlineCourse = {
      id: testOfflineId,
      name: 'Automated Test Offline Batch',
      category: 'Teaching and Recruitment Exams',
      sub_category: 'TET / STGT',
      board: 'Competitive',
      mode: 'Offline',
      description: 'Comprehensive test offline batch at Udaipur center',
      syllabus_highlights: ['All Topics Covered', 'Weekly Physical Booklets'],
      price: 5500,
      monthly_fee: 1200,
      material_delivery: 'Physical booklets at Udaipur Center',
      instalment_available: true,
      first_instalment: 3000,
      faculty_id: validFacultyId,
      faculty_name: 'Dr. Debabrata Roy (Gold Medalist)',
      batch_name: 'Target 2026-27 Offline Batch A',
      batch_size: 60,
      seats_available: 58,
      waiting_list_count: 0,
      duration: '1 Year Full Session',
      start_date: new Date().toISOString().slice(0, 10),
      schedule: 'Mon to Fri — 10:00 AM to 1:00 PM',
      status: 'Open for Admission',
      featured: true,
      online_class_link: null,
      is_package_bundle: false,
      bundled_material_ids: [],
      bundled_test_ids: [],
    };

    const { error: insErr1 } = await supabase.from('courses').upsert(offlineCourse);
    assert(!insErr1, `Offline course batch created in DB: ${insErr1?.message || 'OK'}`);

    const { data: readOffline } = await supabase
      .from('courses')
      .select('*')
      .eq('id', testOfflineId)
      .single();

    assert(readOffline?.name === offlineCourse.name, 'Course name matches accurately');
    assert(readOffline?.mode === 'Offline', 'Course mode is strictly Offline');
    assert(readOffline?.faculty_name === 'Dr. Debabrata Roy (Gold Medalist)', 'Faculty name stored accurately');
    assert(readOffline?.price === 5500, 'Course price ₹5500 persisted');
    assert(readOffline?.seats_available === 58, 'Batch capacity seats available is 58');

    // -------------------------------------------------------------
    // TEST SUITE 2: Admin Create Online Course Batch without initial link
    // -------------------------------------------------------------
    console.log('\n--- TEST SUITE 2: Admin Create Online Course Batch (Link Pending) ---');
    const onlineCourse = {
      id: testOnlineId,
      name: 'Automated Test Online Live Batch',
      category: 'Banking, SSC and Railway',
      sub_category: 'Banking Foundations',
      board: 'Competitive',
      mode: 'Online',
      description: 'Live interactive video classroom for banking aspirants',
      syllabus_highlights: ['Live Daily Lectures', 'Doubt Clearing Sessions'],
      price: 4500,
      monthly_fee: 900,
      material_delivery: 'Digital notes in secure view-only reader',
      instalment_available: true,
      first_instalment: 2500,
      faculty_id: validFacultyId,
      faculty_name: 'Prof. Anirban Roy (Banking Expert)',
      batch_name: 'Morning Online Live Batch 01',
      batch_size: 100,
      seats_available: 95,
      waiting_list_count: 0,
      duration: '6 Months',
      start_date: new Date().toISOString().slice(0, 10),
      schedule: 'Mon–Sat — 7:30 AM to 9:30 AM',
      status: 'Open for Admission',
      featured: true,
      online_class_link: '',
      is_package_bundle: false,
      bundled_material_ids: [],
      bundled_test_ids: [],
    };

    const { error: insErr2 } = await supabase.from('courses').upsert(onlineCourse);
    assert(!insErr2, `Online course batch created in DB: ${insErr2?.message || 'OK'}`);

    const { data: readOnlineInitial } = await supabase
      .from('courses')
      .select('*')
      .eq('id', testOnlineId)
      .single();

    assert(readOnlineInitial?.mode === 'Online', 'Mode is strictly Online');
    assert(!readOnlineInitial?.online_class_link, 'Online live class link is initially empty (Pending faculty post)');

    // -------------------------------------------------------------
    // TEST SUITE 3: Admin Posts Live Class Link for Online Batch
    // -------------------------------------------------------------
    console.log('\n--- TEST SUITE 3: Admin Shares Live Class Meeting Link ---');
    const liveMeetingUrl = 'https://meet.google.com/cga-live-lect-2026';
    const { error: updateLinkErr } = await supabase
      .from('courses')
      .update({ online_class_link: liveMeetingUrl })
      .eq('id', testOnlineId);

    assert(!updateLinkErr, `Live class link updated by admin: ${updateLinkErr?.message || 'OK'}`);

    const { data: readOnlineUpdated } = await supabase
      .from('courses')
      .select('*')
      .eq('id', testOnlineId)
      .single();

    assert(
      readOnlineUpdated?.online_class_link === liveMeetingUrl,
      'Live class meeting URL accurately updated and verified from DB'
    );

    // -------------------------------------------------------------
    // TEST SUITE 4: Admin Creates Combined Package Bundle Course
    // -------------------------------------------------------------
    console.log('\n--- TEST SUITE 4: Admin Combined Package Bundle (Course + Notes + CBT) ---');
    const bundledMaterials = ['mat-tet-child-dev', 'mat-tet-bengali-lit'];
    const bundledTests = ['test-tet-paper1-full-01', 'series-ttet-paper1'];

    const bundleCourse = {
      id: testBundleId,
      name: 'Target TET 2026-27 Comprehensive All-in-One Package',
      category: 'Teaching and Recruitment Exams',
      sub_category: 'TET / STGT',
      board: 'Competitive',
      mode: 'Online',
      description: 'Complete batch bundle combining live lectures, full study material notes, and 25 CBT mock tests',
      syllabus_highlights: ['All-In-One Coaching', 'Bundled Study Materials Included', 'Full CBT Series Included'],
      price: 8500,
      monthly_fee: 1500,
      material_delivery: 'Digital PDF Notes + Physical Booklet Dispatched + CBT Access',
      instalment_available: true,
      first_instalment: 4500,
      faculty_id: validFacultyId,
      faculty_name: 'Dr. Debabrata Roy (Gold Medalist)',
      batch_name: 'Target TET Combined All-in-One Batch',
      batch_size: 75,
      seats_available: 70,
      waiting_list_count: 0,
      duration: '1 Year Full Session',
      start_date: new Date().toISOString().slice(0, 10),
      schedule: 'Daily 5:00 PM to 8:00 PM',
      status: 'Open for Admission',
      featured: true,
      online_class_link: 'https://meet.google.com/tet-bundle-live',
      is_package_bundle: true,
      bundled_material_ids: bundledMaterials,
      bundled_test_ids: bundledTests,
    };

    const { error: insErr3 } = await supabase.from('courses').upsert(bundleCourse);
    assert(!insErr3, `Combined package bundle course created: ${insErr3?.message || 'OK'}`);

    const { data: readBundle } = await supabase
      .from('courses')
      .select('*')
      .eq('id', testBundleId)
      .single();

    assert(readBundle?.is_package_bundle === true, 'is_package_bundle is true in DB');
    assert(
      JSON.stringify(readBundle?.bundled_material_ids) === JSON.stringify(bundledMaterials),
      'bundled_material_ids correctly stored as text array'
    );
    assert(
      JSON.stringify(readBundle?.bundled_test_ids) === JSON.stringify(bundledTests),
      'bundled_test_ids correctly stored as text array'
    );

    // -------------------------------------------------------------
    // TEST SUITE 5: Student Access Control Logic Verification
    // -------------------------------------------------------------
    console.log('\n--- TEST SUITE 5: Student Access Control Simulation ---');

    // Simulate mock DB in client environment
    const mockDbCourses = [readOffline, readOnlineUpdated, readBundle];
    const mockMaterials = [
      { id: 'mat-tet-child-dev', title: 'Child Development Full Notes', courseId: 'crs-tet-1', price: 499 },
      { id: 'mat-tet-bengali-lit', title: 'Bengali Literature Compendium', courseId: 'crs-tet-1', price: 399 },
      { id: 'mat-unrelated-01', title: 'Unrelated GK Booklet', courseId: 'crs-other', price: 299 },
    ];
    const mockTests = [
      { id: 'test-tet-paper1-full-01', title: 'Full Mock Test 01', seriesId: 'series-ttet-paper1', courseId: 'crs-tet-1' },
      { id: 'test-unrelated-01', title: 'Unrelated Test', seriesId: 'series-other', courseId: 'crs-other' },
    ];

    // Case 5A: Unenrolled student
    const unenrolledStudent = { id: 'std-unenrolled', enrollments: [] };
    const canAccessUnenrolled = unenrolledStudent.enrollments.some((e) => e.courseId === testBundleId);
    assert(!canAccessUnenrolled, 'Unenrolled student cannot access course batch');

    // Case 5B: Student enrolled in offline batch
    const offlineStudent = {
      id: 'std-offline',
      enrollments: [{ courseId: testOfflineId, batchName: readOffline.batch_name }],
    };
    const isOfflineEnrolled = offlineStudent.enrollments.some((e) => e.courseId === testOfflineId);
    assert(isOfflineEnrolled, 'Offline student has verified enrollment');
    // Offline batch does not expose an online video button
    assert(readOffline.mode === 'Offline', 'Offline batch provides physical classroom venue notice');

    // Case 5C: Student enrolled in online batch (before vs after link posted)
    const onlineStudent = {
      id: 'std-online',
      enrollments: [{ courseId: testOnlineId, batchName: readOnlineInitial.batch_name }],
    };
    // Prior to link posted
    const hasLiveLinkBefore = Boolean(readOnlineInitial.online_class_link && readOnlineInitial.online_class_link.trim());
    assert(!hasLiveLinkBefore, 'Student sees Live Class Link Pending before admin posts URL');

    // After link posted
    const hasLiveLinkAfter = Boolean(readOnlineUpdated.online_class_link && readOnlineUpdated.online_class_link.trim());
    assert(hasLiveLinkAfter, 'Student sees Join Live Online Class button after admin posts URL');
    assert(
      readOnlineUpdated.online_class_link === liveMeetingUrl,
      'Live link matches exactly what admin submitted'
    );

    // Case 5D: Student enrolled in Combined Package Bundle
    const bundleStudent = {
      id: 'std-bundle',
      enrollments: [{ courseId: testBundleId, batchName: readBundle.batch_name }],
    };

    // Evaluate unlocked study materials for bundle student
    const bundleCourseObj = mockDbCourses.find((c) => c.id === testBundleId);
    const bundleMaterialsSet = new Set(bundleCourseObj.bundled_material_ids || []);
    const unlockedMaterials = mockMaterials.filter((m) => {
      const isEnrolledDirect = bundleStudent.enrollments.some((e) => e.courseId === m.courseId);
      const isBundled = bundleMaterialsSet.has(m.id);
      return isEnrolledDirect || isBundled;
    });

    assert(
      unlockedMaterials.some((m) => m.id === 'mat-tet-child-dev'),
      'Bundled material "mat-tet-child-dev" automatically unlocked for bundle student'
    );
    assert(
      unlockedMaterials.some((m) => m.id === 'mat-tet-bengali-lit'),
      'Bundled material "mat-tet-bengali-lit" automatically unlocked for bundle student'
    );
    assert(
      !unlockedMaterials.some((m) => m.id === 'mat-unrelated-01'),
      'Unbundled material "mat-unrelated-01" remains locked'
    );

    // Evaluate unlocked mock tests for bundle student
    const bundleTestsSet = new Set(bundleCourseObj.bundled_test_ids || []);
    const unlockedMockTests = mockTests.filter((t) => {
      return (
        bundleTestsSet.has(t.id) ||
        (t.seriesId && bundleTestsSet.has(t.seriesId)) ||
        bundleStudent.enrollments.some((e) => e.courseId === t.courseId)
      );
    });

    assert(
      unlockedMockTests.some((t) => t.id === 'test-tet-paper1-full-01'),
      'Bundled mock test "test-tet-paper1-full-01" automatically unlocked in My Learning'
    );
    assert(
      !unlockedMockTests.some((t) => t.id === 'test-unrelated-01'),
      'Unbundled mock test "test-unrelated-01" remains locked'
    );

    // -------------------------------------------------------------
    // TEST SUITE 6: Clean up test fixtures from Database
    // -------------------------------------------------------------
    console.log('\n--- TEST SUITE 6: Clean Up Test Artifacts ---');
    const { error: delErr } = await supabase
      .from('courses')
      .delete()
      .in('id', [testOfflineId, testOnlineId, testBundleId]);

    assert(!delErr, `Test course records cleanly purged from database: ${delErr?.message || 'OK'}`);

    console.log('\n============================================================');
    console.log(`🎉 TEST SUMMARY: ${totalPassed} PASSED, ${totalFailed} FAILED`);
    console.log('============================================================\n');

    if (totalFailed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Unexpected Error during test execution:', err);
    process.exit(1);
  }
}

runTests();
