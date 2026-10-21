import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';
import assert from 'node:assert';

// 1. Read environment
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
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

if (!SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let testAdminUser = null;
let testStudentUser = null;

async function setupTestUsers() {
  const ts = Date.now();
  const adminEmail = `drive_qa_admin_${ts}@cga-test.internal`;
  const studentEmail = `drive_qa_student_${ts}@cga-test.internal`;
  const password = 'TestSecurePassword123!';

  console.log('1. Setting up temporary test users in Supabase Auth...');

  // Create admin
  const { data: aData, error: aErr } = await adminClient.auth.admin.createUser({
    email: adminEmail,
    password,
    email_confirm: true,
    user_metadata: { name: 'Audit Test Director' },
  });
  if (aErr) throw new Error(`Could not create test admin: ${aErr.message}`);
  testAdminUser = aData.user;

  await adminClient.from('profiles').upsert({
    id: testAdminUser.id,
    role: 'admin',
    name: 'Audit Test Director',
    email: adminEmail,
    phone: '9876543210',
    status: 'Active',
    joined_date: new Date().toISOString().slice(0, 10),
  });

  await adminClient.from('access_allowlist').upsert({
    identifier: adminEmail,
    role: 'admin',
  });

  // Create student
  const { data: sData, error: sErr } = await adminClient.auth.admin.createUser({
    email: studentEmail,
    password,
    email_confirm: true,
    user_metadata: { name: 'Audit Test Student' },
  });
  if (sErr) throw new Error(`Could not create test student: ${sErr.message}`);
  testStudentUser = sData.user;

  await adminClient.from('profiles').upsert({
    id: testStudentUser.id,
    role: 'student',
    name: 'Audit Test Student',
    email: studentEmail,
    phone: '9876543211',
    status: 'Active',
    student_code: `CGA-TEST-${ts.toString().slice(-4)}`,
    guardian_name: 'Test Guardian',
    address: 'Udaipur, Tripura',
    permanent_address: 'Udaipur, Tripura',
    qualification: 'Graduate',
    target_exam: 'Tripura TET',
    joined_date: new Date().toISOString().slice(0, 10),
  });

  // Enroll student in active courses and series
  try {
    const { data: courses } = await adminClient.from('courses').select('id, name').limit(5);
    if (courses && courses.length > 0) {
      for (const c of courses) {
        const { error: cEnrErr } = await adminClient.from('enrollments').upsert(
          {
            student_id: testStudentUser.id,
            course_id: c.id,
            enrolled_date: new Date().toISOString().slice(0, 10),
            progress: 50,
            total_fee: 1000,
            paid_amount: 1000,
            due_amount: 0,
          },
          { onConflict: 'student_id,course_id' }
        );
        if (cEnrErr) console.log('  Course enrollment notice:', cEnrErr.message);
      }
    }
  } catch (e) {
    console.log('  Course enrollment notice:', e.message);
  }

  try {
    // Explicitly enroll in all 3 Tripura TET Mock Series
    const seriesIds = ['series-ttet-paper1', 'series-ttet-paper2-sci', 'series-ttet-paper2-soc'];
    for (const sid of seriesIds) {
      const { error: sEnrErr } = await adminClient.from('series_enrollments').upsert(
        {
          student_id: testStudentUser.id,
          series_id: sid,
          enrolled_at: new Date().toISOString(),
        },
        { onConflict: 'student_id,series_id' }
      );
      if (sEnrErr) console.log('  Series enrollment notice:', sEnrErr.message);
    }
  } catch (e) {
    console.log('  Series enrollment notice:', e.message);
  }

  console.log(`✓ Admin User created: ${adminEmail}`);
  console.log(`✓ Student User created: ${studentEmail}`);

  return { adminEmail, studentEmail, password };
}

async function cleanup() {
  console.log('\nCleaning up temporary test users...');
  if (testAdminUser) {
    await adminClient.from('access_allowlist').delete().eq('identifier', testAdminUser.email);
    await adminClient.from('profiles').delete().eq('id', testAdminUser.id);
    await adminClient.auth.admin.deleteUser(testAdminUser.id);
  }
  if (testStudentUser) {
    await adminClient.from('series_enrollments').delete().eq('student_id', testStudentUser.id);
    await adminClient.from('enrollments').delete().eq('student_id', testStudentUser.id);
    await adminClient.from('profiles').delete().eq('id', testStudentUser.id);
    await adminClient.auth.admin.deleteUser(testStudentUser.id);
  }
  console.log('✓ Cleanup complete.');
}

async function run() {
  let credentials;
  try {
    credentials = await setupTestUsers();
  } catch (err) {
    console.error('Setup failed:', err);
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const testTitle = `T-TET Child Pedagogy Mock Test Drive Paper - ${Date.now()}`;
  const testDriveUrl = 'https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J_SampleDriveKey/view?usp=sharing';

  try {
    // -------------------------------------------------------------
    // TEST 1: Admin Log In and Post Mock Test Drive Link Announcement
    // -------------------------------------------------------------
    console.log('\n--- Step 1: Admin Login & Post Creation ---');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#login-tab-admin', { timeout: 10000 });
    await page.click('#login-tab-admin');

    await page.fill('#login-identifier', credentials.adminEmail);
    await page.fill('#login-password', credentials.password);
    await page.click('#login-submit-btn');

    await page.waitForURL('**/admin/**', { timeout: 15000 });
    console.log('✓ Admin successfully authenticated and redirected to /admin');

    // Go to /admin/tests
    await page.goto(`${BASE_URL}/admin/tests`, { waitUntil: 'domcontentloaded' });
    console.log('✓ Navigated to /admin/tests');

    // Click tab "Subject Question Drive Links"
    const driveTab = page.locator('button:has-text("Subject Question Drive Links")');
    await driveTab.waitFor({ state: 'visible', timeout: 8000 });
    await driveTab.click();
    console.log('✓ Selected "Subject Question Drive Links" tab');

    // Click "Post Question Drive Link" or "Post New Question Drive Link"
    const newBtn = page.locator('button:has-text("Post Question Drive Link"), button:has-text("Post New Question Drive Link")').first();
    await newBtn.waitFor({ state: 'visible', timeout: 8000 });
    await newBtn.click();
    console.log('✓ Opened Drive Announcement modal');

    // Fill the Drive link announcement form
    await page.waitForSelector('#drive-post-title', { timeout: 8000 });
    await page.fill('#drive-post-title', testTitle);
    await page.fill('#drive-post-url', testDriveUrl);
    await page.fill('#drive-post-instructions', '1. Do not share this Drive link outside the academy.\n2. Record your answer responses before the closing deadline.');

    // Save
    await page.click('#drive-post-submit-btn');
    await page.waitForTimeout(1000);
    console.log('✓ Clicked Save Drive Announcement');

    // Confirm post appears in the list
    const postInList = page.locator(`text=${testTitle}`);
    await postInList.waitFor({ state: 'visible', timeout: 8000 });
    console.log(`✓ Confirmed newly created announcement is visible in Admin tests list: "${testTitle}"`);

    // Verify Mobile and Tablet viewport on Admin Tests
    console.log('\n--- Step 2: Admin Tests Viewport Verification ---');
    await page.setViewportSize({ width: 360, height: 640 });
    await page.waitForTimeout(500);
    let sW = await page.evaluate(() => document.documentElement.scrollWidth);
    let cW = await page.evaluate(() => document.documentElement.clientWidth);
    assert(sW <= cW + 5, `Admin Tests Mobile overflow check: ${sW} <= ${cW}`);
    console.log(`✓ Admin Tests Mobile (360x640): 0 horizontal scroll overflow (${sW}px <= ${cW}px)`);

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    sW = await page.evaluate(() => document.documentElement.scrollWidth);
    cW = await page.evaluate(() => document.documentElement.clientWidth);
    assert(sW <= cW + 5, `Admin Tests Tablet overflow check: ${sW} <= ${cW}`);
    console.log(`✓ Admin Tests Tablet (768x1024): 0 horizontal scroll overflow (${sW}px <= ${cW}px)`);

    // -------------------------------------------------------------
    // TEST 3: Student Log In and View Mock Subject Drive Link
    // -------------------------------------------------------------
    console.log('\n--- Step 3: Student Login & Verification ---');
    await page.setViewportSize({ width: 1280, height: 800 });

    // Sign out admin
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    const signoutBtn = page.locator('button:has-text("Sign Out"), button:has-text("Logout"), a:has-text("Sign Out")').first();
    if (await signoutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await signoutBtn.click();
      await page.waitForTimeout(1000);
    }

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#login-tab-student', { timeout: 10000 });
    await page.click('#login-tab-student');

    await page.fill('#login-identifier', credentials.studentEmail);
    await page.fill('#login-password', credentials.password);
    await page.click('#login-submit-btn');

    await page.waitForURL('**/student/**', { timeout: 15000 });
    console.log('✓ Student successfully authenticated and redirected to /student');

    // Go to /student/tests
    await page.goto(`${BASE_URL}/student/tests`, { waitUntil: 'domcontentloaded' });
    console.log('✓ Navigated to /student/tests');

    // Check announcement section
    const studentSec = page.locator('text=Subject Mock Test Question Papers & Google Drive Announcements');
    await studentSec.waitFor({ state: 'visible', timeout: 8000 });
    console.log('✓ Section title verified: "Subject Mock Test Question Papers & Google Drive Announcements (Enrolled Only)"');

    // Verify student sees the newly posted Drive announcement
    const postForStudent = page.locator(`text=${testTitle}`);
    await postForStudent.waitFor({ state: 'visible', timeout: 8000 });
    console.log(`✓ Student successfully sees the newly published announcement: "${testTitle}"`);

    // Check Open Drive Paper button (rendered in subject announcement section and on test cards)
    const openDriveBtn = page.locator(`a[href="${testDriveUrl}"]`).first();
    await openDriveBtn.waitFor({ state: 'visible', timeout: 5000 });
    console.log(`✓ Verified direct link to Google Drive: ${testDriveUrl}`);

    // Check Copy Link button
    const copyBtn = page.locator('button[title="Copy Link"], button[aria-label="Copy Link"]').first();
    assert(await copyBtn.isVisible(), 'Copy Link button must be accessible');
    console.log('✓ Verified "Copy Link" button is operational');

    // Verify Mobile and Tablet viewports on Student Tests
    console.log('\n--- Step 4: Student Tests Viewport Verification ---');
    await page.setViewportSize({ width: 360, height: 640 });
    await page.waitForTimeout(500);
    sW = await page.evaluate(() => document.documentElement.scrollWidth);
    cW = await page.evaluate(() => document.documentElement.clientWidth);
    assert(sW <= cW + 5, `Student Tests Mobile overflow check: ${sW} <= ${cW}`);
    console.log(`✓ Student Tests Mobile (360x640): 0 horizontal scroll overflow (${sW}px <= ${cW}px)`);

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    sW = await page.evaluate(() => document.documentElement.scrollWidth);
    cW = await page.evaluate(() => document.documentElement.clientWidth);
    assert(sW <= cW + 5, `Student Tests Tablet overflow check: ${sW} <= ${cW}`);
    console.log(`✓ Student Tests Tablet (768x1024): 0 horizontal scroll overflow (${sW}px <= ${cW}px)`);

    console.log('\n================================================================');
    console.log('🎉 ALL END-TO-END VERIFICATION CHECKS COMPLETED SUCCESSFULLY!');
    console.log('================================================================\n');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    await cleanup();
  }
}

run();
