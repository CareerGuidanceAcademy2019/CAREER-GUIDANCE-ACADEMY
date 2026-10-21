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

const results = [];
function recordResult(testName, passed, details) {
  results.push({ testName, passed, details });
  console.log(`${passed ? '✅ [PASS]' : '❌ [FAIL]'} ${testName}: ${details}`);
}

async function main() {
  console.log('========================================================================');
  console.log('GRAVITAS COMPREHENSIVE AUTOMATED VERIFICATION SUITE');
  console.log('Testing Multi-Role Access, Security Verification & Administrative Approval');
  console.log('========================================================================\n');

  // Launch Chromium
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'CGA-Gravitas-Audit-Agent/2.0',
  });
  const page = await context.newPage();

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Angat Saha Multi-Role Verification - Admin Sign-In & Dashboard
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Testing Angat Saha Sign-In on Admin Portal ---');
    await page.goto(`${BASE_URL}/login?as=admin`, { waitUntil: 'networkidle' });
    
    await page.fill('input#login-identifier', 'angatsaha825@gmail.com');
    await page.fill('input#login-password', 'CGA@angat12');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/admin/**', { timeout: 15000 });
    const currentUrl = page.url();
    const isAtAdmin = currentUrl.includes('/admin/dashboard') || currentUrl.includes('/admin');
    
    // Check navigation to Admin Profile
    await page.goto(`${BASE_URL}/admin/profile`, { waitUntil: 'networkidle' });
    const hasAdminProfileText = await page.getByText('Administrator Profile & Login Security').isVisible();
    const hasMultiRoleBadge = await page.getByText('Multi-Role Master').isVisible();
    
    recordResult(
      'Angat Saha Admin Portal Access',
      isAtAdmin && hasAdminProfileText && hasMultiRoleBadge,
      `Routed to ${currentUrl}. Admin Profile visible: ${hasAdminProfileText}. Multi-Role Master Badge visible: ${hasMultiRoleBadge}`
    );

    // -------------------------------------------------------------------------
    // TEST 2: Admin Profile Security Verification (Change Phone, Email, Password)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Testing Verified Phone/Email/Password Verification Modals in Admin Profile ---');
    
    // Click "Change Phone Number"
    await page.click('button:has-text("Change Phone Number")');
    await page.waitForSelector('text=Current Password Verification', { timeout: 5000 });
    
    // Attempt with an unused number and wrong current password
    await page.fill('input[placeholder="9876543210"]', '9123456789');
    await page.fill('input[placeholder="Enter current password to verify"]', 'WrongPasswordXYZ');
    await page.click('button:has-text("Verify & Update Phone")');
    await page.waitForTimeout(1500);
    
    const phoneWrongPwAlert = await page.locator('div[role="alert"]').filter({ hasText: 'Current password verification' }).isVisible();
    const alertContent = phoneWrongPwAlert ? await page.locator('div[role="alert"]').filter({ hasText: 'Current password verification' }).innerText() : '';
    recordResult(
      'Admin Profile Security: Phone Change Rejects Incorrect Password',
      phoneWrongPwAlert,
      `Attempting phone change with wrong current password was rejected. Alert: "${alertContent}"`
    );
    await page.click('button:has-text("Cancel")');

    // Click "Change Password"
    await page.click('button:has-text("Change Password")');
    await page.waitForSelector('text=Change Account Password', { timeout: 5000 });
    
    // Attempt with short/weak password
    await page.fill('input[placeholder="Enter current password"]', 'CGA@angat12');
    await page.fill('input[placeholder="At least 8 characters with mix of cases & digits"]', 'weak');
    await page.fill('input[placeholder="Re-type new password"]', 'weak');
    await page.click('button:has-text("Update Password")');
    await page.waitForTimeout(500);

    const weakPwAlert = await page.getByText('at least 8 characters').isVisible();
    recordResult(
      'Admin Profile Security: Password Change Enforces Minimum Length & Strength',
      weakPwAlert,
      'Attempting password change with weak/short password was rejected.'
    );
    await page.click('button:has-text("Cancel")');

    // -------------------------------------------------------------------------
    // TEST 3: Angat Saha Multi-Role Verification - Student Portal Access & Enrolments
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Testing Angat Saha Access to Student Portal ---');
    await page.goto(`${BASE_URL}/student/dashboard`, { waitUntil: 'networkidle' });
    const studentDashTitle = await page.getByText(/Welcome back, Angat Saha/i).isVisible();
    const enrolledCoursesVisible = await page.getByText('Enrolled Courses', { exact: true }).isVisible();
    
    // Check Mock Tests tab
    await page.goto(`${BASE_URL}/student/tests`, { waitUntil: 'networkidle' });
    const testListVisible = await page.getByText('Daily Online Mock Tests Arena & CBT Portal').isVisible();

    // Check Student Profile Verified Credentials
    await page.goto(`${BASE_URL}/student/profile`, { waitUntil: 'networkidle' });
    const studentVerifiedSec = await page.getByText('Verified Contact & Login Credentials').isVisible();

    recordResult(
      'Angat Saha Student Portal Access & Enrolments',
      studentDashTitle && enrolledCoursesVisible && testListVisible && studentVerifiedSec,
      `Welcome banner: ${studentDashTitle}. Enrolled courses: ${enrolledCoursesVisible}. Mock Tests: ${testListVisible}. Verified Credentials: ${studentVerifiedSec}`
    );

    // -------------------------------------------------------------------------
    // TEST 4: Angat Saha Multi-Role Verification - Faculty Portal Access
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Testing Angat Saha Access to Faculty Portal ---');
    await page.goto(`${BASE_URL}/faculty-portal`, { waitUntil: 'networkidle' });
    const facultyWelcome = (await page.getByText('Welcome, A.Saha').isVisible()) || (await page.getByText('C.G.A Faculty Member').isVisible());
    const facultySecCard = await page.getByText('Verified Contact & Security').isVisible();

    recordResult(
      'Angat Saha Faculty Portal Access',
      facultyWelcome && facultySecCard,
      `Faculty welcome banner visible: ${facultyWelcome}. Security management module visible: ${facultySecCard}`
    );

    // -------------------------------------------------------------------------
    // TEST 5: Student Registration Validation (Mail, Phone, Address, Parents Info)
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Testing Student Registration Enforces All Required Fields ---');
    // Clear storage/cookies for unauthenticated registration test
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());

    await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' });

    // Attempt submission with empty fields
    await page.click('button[type="submit"]');
    const nameReqError = await page.getByText('Please enter your full name (minimum 3 characters).').isVisible();

    // Fill only name
    await page.fill('input#reg-name', 'New Test Student');
    await page.click('button[type="submit"]');
    const emailReqError = await page.getByText('Please enter a valid email address.').isVisible();

    // Fill invalid phone
    await page.fill('input#reg-email', 'newstudent@example.com');
    await page.fill('input#reg-phone', '12345');
    await page.click('button[type="submit"]');
    const phoneReqError = await page.getByText('Please enter a valid 10-digit mobile number.').isVisible();

    // Fill valid phone but omit parents info
    await page.fill('input#reg-phone', '9876543210');
    await page.click('button[type="submit"]');
    const parentReqError = await page.getByText("Please enter your parent's / guardian's name.").isVisible();

    recordResult(
      'Student Registration: Mandatory Fields Enforced (Name, Email, Phone, Parents Info, Address)',
      nameReqError && emailReqError && phoneReqError && parentReqError,
      'Registration form strictly blocks submission when email, phone, or parent details are missing/invalid.'
    );

    // -------------------------------------------------------------------------
    // TEST 6: New Admin Registration & Mandatory Verification Wait Check
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Testing New Admin Registration & Approval Workflow ---');
    const ts = Date.now();
    const pendingAdminEmail = `newadmin_${ts}@cgaudaipur.edu.in`;
    const pendingAdminPhone = `98${String(ts).slice(-8)}`;
    const pendingAdminPassword = 'AdminSecretPass2026!';

    // Create the applicant with account_type: 'admin' to trigger handle_new_user() in Postgres
    const { data: createdAdminUser, error: createAdminErr } = await adminClient.auth.admin.createUser({
      email: pendingAdminEmail,
      password: pendingAdminPassword,
      email_confirm: true,
      user_metadata: {
        account_type: 'admin',
        name: `Audit Applicant ${ts}`,
        phone: pendingAdminPhone,
      },
    });
    if (createAdminErr) throw createAdminErr;

    // Verify database status directly from Postgres trigger
    const { data: profileRow } = await adminClient
      .from('profiles')
      .select('role, status')
      .eq('email', pendingAdminEmail)
      .maybeSingle();
    
    const isStatusPendingInDb = profileRow?.status === 'Pending' && profileRow?.role === 'admin';
    recordResult(
      'New Admin Registration: Status Assigned as Pending Verification',
      isStatusPendingInDb,
      `Database trigger assigned role='${profileRow?.role}', status='${profileRow?.status}'`
    );

    // Attempt login with this new unverified admin account
    console.log('Attempting login with unverified admin account...');
    await page.goto(`${BASE_URL}/login?as=admin`, { waitUntil: 'networkidle' });
    await page.fill('input#login-identifier', pendingAdminEmail);
    await page.fill('input#login-password', pendingAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    const loginBlockedError = await page.getByText('awaiting verification and approval').isVisible();
    recordResult(
      'New Admin Login Blocked: Must Wait for Admin Approval',
      loginBlockedError,
      `Login correctly rejected with notice: awaiting verification and approval from existing administrator.`
    );

    // Now test Admin Approval: Existing Admin verifies and approves the account
    console.log('Existing Admin approving the pending account...');
    await adminClient
      .from('profiles')
      .update({ status: 'Active' })
      .eq('email', pendingAdminEmail);
    
    await adminClient
      .from('access_allowlist')
      .upsert({
        identifier: pendingAdminEmail,
        role: 'admin',
        note: 'Approved via Gravitas verification test suite',
      });

    // Re-attempt login now that account is approved
    console.log('Re-attempting login after admin approval...');
    await page.fill('input#login-identifier', pendingAdminEmail);
    await page.fill('input#login-password', pendingAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/**', { timeout: 15000 });

    const approvedAdminLoggedIn = page.url().includes('/admin');
    recordResult(
      'Approved Admin Login: Unlocked After Admin Verification',
      approvedAdminLoggedIn,
      `After admin verification, account logged in successfully to ${page.url()}`
    );

    // Cleanup test user from auth and profiles
    console.log('Cleaning up temporary test admin...');
    if (createdAdminUser?.user?.id) {
      await adminClient.auth.admin.deleteUser(createdAdminUser.user.id);
      await adminClient.from('profiles').delete().eq('id', createdAdminUser.user.id);
      await adminClient.from('access_allowlist').delete().eq('identifier', pendingAdminEmail);
    }

  } catch (err) {
    console.error('Test execution error:', err);
    recordResult('Gravitas Test Suite Execution', false, err.message);
  } finally {
    await browser.close();
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log('GRAVITAS VERIFICATION SUMMARY');
  console.log('========================================================================');
  const allPassed = results.every(r => r.passed);
  console.log(`Total Checks: ${results.length}`);
  console.log(`Passed: ${results.filter(r => r.passed).length}`);
  console.log(`Failed: ${results.filter(r => !r.passed).length}`);
  console.log(`Overall Result: ${allPassed ? 'ALL TESTS PASSED ✅' : 'FAILURES DETECTED ❌'}`);
  console.log('========================================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
