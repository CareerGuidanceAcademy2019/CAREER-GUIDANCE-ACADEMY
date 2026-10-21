import { chromium } from 'playwright';
import assert from 'node:assert';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function run() {
  console.log(`Starting Mock Subject Question Drive System Verification against ${BASE_URL}...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(`Console error: ${msg.text()}`);
    }
  });

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Student Views Mock Subject Drive Questions
    // -------------------------------------------------------------------------
    console.log('\n--- Step 1: Student Login & Verification of Mock Subject Question Papers ---');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#login-identifier', { timeout: 10000 });

    // Select Student tab
    await page.click('#login-tab-student');
    await page.fill('#login-identifier', 'student@cgaudaipur.in');
    await page.fill('#login-password', 'password123');
    await page.click('#login-submit-btn');

    await page.waitForURL('**/student/**', { timeout: 10000 });
    console.log('✓ Student logged in successfully');

    // Navigate to student mock tests page
    await page.goto(`${BASE_URL}/student/tests`, { waitUntil: 'domcontentloaded' });
    console.log('✓ Navigated to /student/tests');

    // Check for Section Header
    const sectionHeading = page.locator('text=Subject Mock Test Question Papers & Google Drive Announcements');
    assert(await sectionHeading.isVisible({ timeout: 5000 }), 'Subject Question Papers & Google Drive Announcements section should be visible');
    console.log('✓ Section title visible: "Subject Mock Test Question Papers & Google Drive Announcements (Enrolled Only)"');

    // Check for Subject Filter Tabs
    const cdpTab = page.locator('button:has-text("Child Development & Pedagogy")').first();
    assert(await cdpTab.isVisible({ timeout: 5000 }), 'Subject tab for Child Development & Pedagogy should be visible');
    console.log('✓ Subject filter tabs rendered properly');

    // Check post cards
    const driveCards = page.locator('div:has-text("Google Drive Question Paper")');
    const driveCardCount = await driveCards.count();
    console.log(`✓ Found ${driveCardCount} Drive Question Paper cards/elements`);
    assert(driveCardCount > 0, 'Should have at least one Drive Question paper announcement card');

    // Check "Open Google Drive Paper" button
    const openDriveLink = page.locator('a:has-text("Open Google Drive Paper")').first();
    assert(await openDriveLink.isVisible({ timeout: 5000 }), 'Enrolled students should see "Open Google Drive Paper" button');
    const href = await openDriveLink.getAttribute('href');
    console.log(`✓ Verified Google Drive Link href: ${href}`);
    assert(href && href.includes('drive.google.com'), 'Link should point to drive.google.com');

    // Check Copy Link button
    const copyBtn = page.locator('button:has-text("Copy Link")').first();
    assert(await copyBtn.isVisible({ timeout: 5000 }), 'Copy Link button should be visible');
    console.log('✓ Verified "Copy Link" button is present and accessible');

    // Check mobile viewport for student tests page
    await page.setViewportSize({ width: 360, height: 640 });
    await page.waitForTimeout(500);
    const scrollWidthMobile = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidthMobile = await page.evaluate(() => document.documentElement.clientWidth);
    assert(scrollWidthMobile <= clientWidthMobile + 5, `Student mock tests page should not horizontally overflow on mobile (360px): ${scrollWidthMobile} vs ${clientWidthMobile}`);
    console.log(`✓ Mobile viewport verified (360x640): no horizontal scroll overflow (${scrollWidthMobile} <= ${clientWidthMobile})`);

    // Check tablet viewport for student tests page
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    const scrollWidthTablet = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidthTablet = await page.evaluate(() => document.documentElement.clientWidth);
    assert(scrollWidthTablet <= clientWidthTablet + 5, `Student mock tests page should not horizontally overflow on tablet (768px): ${scrollWidthTablet} vs ${clientWidthTablet}`);
    console.log(`✓ Tablet viewport verified (768x1024): no horizontal scroll overflow (${scrollWidthTablet} <= ${clientWidthTablet})`);

    // Reset viewport to desktop
    await page.setViewportSize({ width: 1280, height: 800 });

    // -------------------------------------------------------------------------
    // TEST 2: Admin Login & Post Creation for Mock Test Subject
    // -------------------------------------------------------------------------
    console.log('\n--- Step 2: Admin Login & Creation of Subject Question Drive Links ---');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

    // Switch account / re-login as Admin
    await page.click('#login-tab-admin');
    await page.fill('#login-identifier', 'admin@cgaudaipur.in');
    await page.fill('#login-password', 'admin123');
    await page.click('#login-submit-btn');

    await page.waitForURL('**/admin/**', { timeout: 10000 });
    console.log('✓ Admin logged in successfully');

    // Navigate to /admin/tests
    await page.goto(`${BASE_URL}/admin/tests`, { waitUntil: 'domcontentloaded' });
    console.log('✓ Navigated to /admin/tests');

    // Click on 3rd Tab: "Subject Question Drive Links"
    const driveTab = page.locator('button:has-text("Subject Question Drive Links")').first();
    assert(await driveTab.isVisible({ timeout: 5000 }), '"Subject Question Drive Links" tab should be present');
    await driveTab.click();
    await page.waitForTimeout(500);
    console.log('✓ Clicked on "Subject Question Drive Links" tab');

    // Check "New Drive Link Announcement" button
    const createBtn = page.locator('button:has-text("New Drive Link Announcement")').first();
    assert(await createBtn.isVisible({ timeout: 5000 }), '"New Drive Link Announcement" button should be visible');
    await createBtn.click();
    await page.waitForTimeout(500);
    console.log('✓ Opened New Drive Link Announcement modal');

    // Fill form to create a new subject mock test question paper
    const testTitle = `QA Automated Test Drive Paper - ${Date.now()}`;
    await page.fill('#drive-post-title', testTitle);
    await page.fill('#drive-post-url', 'https://drive.google.com/file/d/1_QaTestAutomatedSampleKey987654321/view?usp=sharing');
    await page.fill('#drive-post-desc', 'Automated QA verified Google Drive mock test question paper announcement for enrolled students.');
    await page.fill('#drive-post-questions', '60');
    await page.fill('#drive-post-time', '60 mins');
    await page.fill('#drive-post-instructions', '1. Complete all 60 MCQs within 60 minutes.\n2. Submit answers via official student portal before 6:00 PM.');

    // Save Announcement
    const saveBtn = page.locator('button:has-text("Save Drive Announcement")').first();
    await saveBtn.click();
    await page.waitForTimeout(1000);
    console.log('✓ Submitted new mock test question drive post');

    // Verify it appears in the list
    const createdItem = page.locator(`text=${testTitle}`);
    assert(await createdItem.isVisible({ timeout: 5000 }), 'New Drive Announcement should be listed in the admin table');
    console.log(`✓ Verified new drive announcement appears in Admin table: "${testTitle}"`);

    // Verify mobile and tablet responsiveness on Admin Tests
    await page.setViewportSize({ width: 360, height: 640 });
    await page.waitForTimeout(500);
    const adminScrollMobile = await page.evaluate(() => document.documentElement.scrollWidth);
    const adminClientMobile = await page.evaluate(() => document.documentElement.clientWidth);
    assert(adminScrollMobile <= adminClientMobile + 5, `Admin tests page should not overflow horizontally on mobile (360px): ${adminScrollMobile} vs ${adminClientMobile}`);
    console.log(`✓ Admin tests page Mobile viewport (360x640) verified: no overflow (${adminScrollMobile} <= ${adminClientMobile})`);

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    const adminScrollTablet = await page.evaluate(() => document.documentElement.scrollWidth);
    const adminClientTablet = await page.evaluate(() => document.documentElement.clientWidth);
    assert(adminScrollTablet <= adminClientTablet + 5, `Admin tests page should not overflow horizontally on tablet (768px): ${adminScrollTablet} vs ${adminClientTablet}`);
    console.log(`✓ Admin tests page Tablet viewport (768x1024) verified: no overflow (${adminScrollTablet} <= ${adminClientTablet})`);

    // -------------------------------------------------------------------------
    // TEST 3: Student sees the newly created post immediately
    // -------------------------------------------------------------------------
    console.log('\n--- Step 3: Verify Enrolled Student Sees Admin\'s Newly Published Paper ---');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#login-identifier', { timeout: 10000 });

    await page.click('#login-tab-student');
    await page.fill('#login-identifier', 'student@cgaudaipur.in');
    await page.fill('#login-password', 'password123');
    await page.click('#login-submit-btn');
    await page.waitForURL('**/student/**', { timeout: 10000 });

    await page.goto(`${BASE_URL}/student/tests`, { waitUntil: 'domcontentloaded' });
    const studentSeesNewPost = page.locator(`text=${testTitle}`);
    assert(await studentSeesNewPost.isVisible({ timeout: 5000 }), 'Student should see the newly posted Google Drive mock test question paper');
    console.log(`✓ Confirmed: Enrolled student sees the admin's newly created drive announcement "${testTitle}" with active Drive link!`);

    console.log('\n======================================================');
    console.log('✅ ALL MOCK SUBJECT QUESTION DRIVE SYSTEM TESTS PASSED!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

run();
