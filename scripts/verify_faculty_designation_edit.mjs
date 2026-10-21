import { chromium } from 'playwright';

async function run() {
  console.log('🚀 Starting Faculty Designation Edit verification test...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const baseUrl = 'http://localhost:3000';

  try {
    // 1. Login as Admin
    console.log('1. Logging in as Admin...');
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    await page.click('#login-tab-admin');
    await page.waitForTimeout(300);
    await page.fill('#login-identifier', 'angatsaha825@gmail.com');
    await page.fill('#login-password', 'CGA@angat12');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/admin/**', { timeout: 15000 });
    console.log('✅ Admin login successful. Navigating to /admin/faculty...');

    // 2. Go to /admin/faculty
    await page.goto(`${baseUrl}/admin/faculty`, { waitUntil: 'networkidle' });
    await page.waitForSelector('h1:has-text("Faculty Management")', { timeout: 10000 });
    console.log('✅ Admin Faculty page loaded.');

    // 3. Verify Tab 1 "Faculty Accounts & Profiles"
    console.log('3. Checking Tab 1 Faculty Accounts & Profiles...');
    const editBtn = page.locator('button:has-text("Edit Details & Designation")').first();
    await editBtn.waitFor({ state: 'visible', timeout: 8000 });
    console.log('✅ Found "Edit Details & Designation" button in Tab 1.');

    // Click Edit Details & Designation
    await editBtn.click();
    await page.waitForSelector('h3:has-text("Edit Faculty Details")', { timeout: 5000 });
    console.log('✅ Faculty Account Details modal opened.');

    // Check designation input and preset pills
    const designationInput = page.locator('input[placeholder*="Senior Faculty"]');
    await designationInput.waitFor({ state: 'visible', timeout: 5000 });
    const currentDesig = await designationInput.inputValue();
    console.log(`Current designation value: "${currentDesig}"`);

    // Click preset pill "Director & Senior Faculty" or type custom designation
    const testDesignation = 'Director & Senior Faculty';
    const presetPill = page.locator(`button:has-text("${testDesignation}")`).first();
    if (await presetPill.isVisible()) {
      await presetPill.click();
      console.log(`Clicked preset pill "${testDesignation}"`);
    } else {
      await designationInput.fill(testDesignation);
    }

    // Submit modal
    await page.click('button:has-text("Save Faculty Details")');
    console.log('Clicked "Save Faculty Details" button.');

    // Wait for modal to close and check updated designation
    await page.waitForSelector('h3:has-text("Edit Faculty Details")', { state: 'hidden', timeout: 10000 });
    console.log('✅ Modal closed successfully.');

    // Verify updated designation in Tab 1 card
    await page.waitForTimeout(1500);
    const updatedBadge = page.locator(`span:has-text("${testDesignation}")`).first();
    await updatedBadge.waitFor({ state: 'visible', timeout: 8000 });
    console.log(`✅ Tab 1 successfully displays updated designation: "${testDesignation}"`);

    // 4. Test Tab 2 "Public Website Cards"
    console.log('4. Testing Tab 2 Public Website Cards...');
    await page.click('button:has-text("Public Website Cards")');
    await page.waitForTimeout(1000);

    const cardEditBtn = page.locator('button:has-text("Edit Details & Designation")').first();
    await cardEditBtn.waitFor({ state: 'visible', timeout: 8000 });
    await cardEditBtn.click();
    await page.waitForSelector('h3:has-text("Edit Faculty Profile Card")', { timeout: 5000 });
    console.log('✅ Tab 2 Faculty Card modal opened.');

    // Edit designation in card modal
    const cardDesigInput = page.locator('form input[placeholder*="Senior Faculty"]');
    await cardDesigInput.waitFor({ state: 'visible' });
    await cardDesigInput.fill('Senior Academic Director');
    await page.click('button:has-text("Save Faculty Card")');
    await page.waitForSelector('h3:has-text("Edit Faculty Profile Card")', { state: 'hidden', timeout: 10000 });
    console.log('✅ Saved Faculty Card in Tab 2.');

    await page.waitForTimeout(1500);
    const cardBadge = page.locator('span:has-text("Senior Academic Director")').first();
    await cardBadge.waitFor({ state: 'visible', timeout: 8000 });
    console.log('✅ Tab 2 successfully displays updated designation: "Senior Academic Director"');

    // 5. Verify Public Faculty Page
    console.log('5. Checking public /faculty page...');
    await page.goto(`${baseUrl}/faculty`, { waitUntil: 'networkidle' });
    const publicBadge = page.locator('span:has-text("Senior Academic Director")').first();
    await publicBadge.waitFor({ state: 'visible', timeout: 8000 });
    console.log('✅ Public /faculty page displays the updated designation!');

    console.log('\n🎉 ALL FACULTY DESIGNATION EDIT TESTS PASSED 100%!');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
