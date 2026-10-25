import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const k = trimmed.slice(0, idx).trim();
      let v = trimmed.slice(idx + 1).trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      process.env[k] = v;
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://craicxwqaygdydtdaxtw.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SCREENSHOT_DIR = path.resolve('docs/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Artifact directory
const ARTIFACT_DIR = 'C:/Users/KIIT0001/.gemini/antigravity-ide/brain/11273040-7cfc-42d7-8051-df08ec932b37';

async function copyToArtifacts(filename) {
  const src = path.join(SCREENSHOT_DIR, filename);
  const dest = path.join(ARTIFACT_DIR, filename);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
}

async function run() {
  console.log('===============================================================');
  console.log('🎭 STARTING PLAYWRIGHT DUAL-CONTEXT SINGLE-SESSION E2E VERIFICATION');
  console.log('===============================================================\n');

  const testEmail = `playwright_${Date.now()}@cga-test.internal`;
  const testPassword = 'CgaPassword#2026';
  const testPhone = `96${Math.floor(10000000 + Math.random() * 90000000)}`;
  let testUserId = null;

  try {
    console.log(`[Setup] Creating test user: ${testEmail}...`);
    const { data: u, error: uErr } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        account_type: 'student',
        name: 'Playwright Test Student',
        phone: testPhone,
        guardian_name: 'Academy Parent',
        address: 'Chanban Youth Club Rd, Udaipur, Tripura',
        permanent_address: 'Chanban Youth Club Rd, Udaipur, Tripura',
        qualification: 'Graduate',
        target_exam: 'Tripura Combined',
      },
    });
    if (uErr) throw uErr;
    testUserId = u.user.id;
    console.log('[Setup] User created successfully.\n');

    const browser = await chromium.launch({ headless: true });

    // 1. Context 1: Desktop (Device 1)
    console.log('[Step 1] Launching Device 1 (Desktop 1280x800)...');
    const contextDesktop = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const pageDesktop = await contextDesktop.newPage();

    await pageDesktop.goto('http://localhost:3005/login');
    await pageDesktop.waitForSelector('#login-identifier');
    await pageDesktop.screenshot({ path: path.join(SCREENSHOT_DIR, '01_login_desktop.png') });
    await copyToArtifacts('01_login_desktop.png');
    console.log('  -> Saved 01_login_desktop.png');

    // Fill login on Desktop
    await pageDesktop.fill('#login-identifier', testEmail);
    await pageDesktop.fill('#login-password', testPassword);
    await pageDesktop.click('#login-submit-btn');

    // Wait for student portal
    await pageDesktop.waitForURL('**/student/**', { timeout: 15000 });
    console.log('  -> Device 1 (Desktop) logged in successfully to Student Portal.');

    // Visit profile on Desktop
    await pageDesktop.goto('http://localhost:3005/student/profile');
    await pageDesktop.waitForSelector('#student-logout-all-devices-btn');
    await pageDesktop.screenshot({ path: path.join(SCREENSHOT_DIR, '02_profile_desktop.png') });
    await copyToArtifacts('02_profile_desktop.png');
    console.log('  -> Saved 02_profile_desktop.png (showing Last Login & Log out from all devices)');

    // 2. Context 2: Mobile 360px (Device 2)
    console.log('\n[Step 2] Launching Device 2 (Mobile 360x780)...');
    const contextMobile = await browser.newContext({
      viewport: { width: 360, height: 780 },
      isMobile: true,
      hasTouch: true,
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    });
    const pageMobile = await contextMobile.newPage();

    await pageMobile.goto('http://localhost:3005/login');
    await pageMobile.waitForSelector('#login-identifier');
    await pageMobile.screenshot({ path: path.join(SCREENSHOT_DIR, '03_login_mobile_360px.png') });
    await copyToArtifacts('03_login_mobile_360px.png');
    console.log('  -> Saved 03_login_mobile_360px.png');

    // Log in on Device 2 (Mobile)
    await pageMobile.fill('#login-identifier', testEmail);
    await pageMobile.fill('#login-password', testPassword);
    await pageMobile.click('#login-submit-btn');

    await pageMobile.waitForURL('**/student/**', { timeout: 15000 });
    console.log('  -> Device 2 (Mobile) logged in successfully. Older session superseded!');
    await pageMobile.screenshot({ path: path.join(SCREENSHOT_DIR, '04_dashboard_mobile_360px.png') });
    await copyToArtifacts('04_dashboard_mobile_360px.png');
    console.log('  -> Saved 04_dashboard_mobile_360px.png');

    // 3. Device 1 (Desktop) detects session superseded!
    console.log('\n[Step 3] Device 1 (Desktop) tab check: Session supersession notice...');
    await pageDesktop.bringToFront();
    await pageDesktop.waitForTimeout(2000);
    await pageDesktop.evaluate(() => {
      window.dispatchEvent(new Event('focus'));
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Wait for the other-device modal to appear
    await pageDesktop.waitForSelector('#other-device-login-btn', { timeout: 25000 });
    console.log('  -> Modal appeared on Device 1: "You were signed out because your account was used on another device."');

    await pageDesktop.screenshot({ path: path.join(SCREENSHOT_DIR, '05_desktop_signed_out_modal.png') });
    await copyToArtifacts('05_desktop_signed_out_modal.png');
    console.log('  -> Saved 05_desktop_signed_out_modal.png');

    // Click "Log in again"
    console.log('\n[Step 4] Clicking "Log in again" on Device 1...');
    await pageDesktop.click('#other-device-login-btn');
    await pageDesktop.waitForURL('**/login?reason=other_device**', { timeout: 10000 });

    await pageDesktop.screenshot({ path: path.join(SCREENSHOT_DIR, '06_login_other_device_banner_desktop.png') });
    await copyToArtifacts('06_login_other_device_banner_desktop.png');
    console.log('  -> Saved 06_login_other_device_banner_desktop.png');

    // 4. Capture Mobile 360px modal view
    console.log('\n[Step 5] Triggering supersession on Mobile to capture 360px modal...');
    // Log in again on Desktop to supersede Mobile
    await pageDesktop.fill('#login-identifier', testEmail);
    await pageDesktop.fill('#login-password', testPassword);
    await pageDesktop.click('#login-submit-btn');
    await pageDesktop.waitForURL('**/student/**', { timeout: 15000 });

    // Focus Mobile to trigger heartbeat
    await pageMobile.bringToFront();
    await pageMobile.waitForTimeout(2000);
    await pageMobile.evaluate(() => {
      window.dispatchEvent(new Event('focus'));
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await pageMobile.waitForSelector('#other-device-login-btn', { timeout: 25000 });
    await pageMobile.screenshot({ path: path.join(SCREENSHOT_DIR, '07_mobile_360px_signed_out_modal.png') });
    await copyToArtifacts('07_mobile_360px_signed_out_modal.png');
    console.log('  -> Saved 07_mobile_360px_signed_out_modal.png');

    await browser.close();
    console.log('\n[Success] All Playwright browser verifications completed successfully!');
  } finally {
    if (testUserId) {
      console.log('\n[Cleanup] Removing temporary test user...');
      await adminClient.from('profiles').delete().eq('id', testUserId);
      await adminClient.auth.admin.deleteUser(testUserId);
      console.log('[Cleanup] Completed.');
    }
  }
}

run().catch((err) => {
  console.error('Fatal Playwright Error:', err);
  process.exit(1);
});
