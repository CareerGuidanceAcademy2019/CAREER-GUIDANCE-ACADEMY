import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error('   Reason:', err?.message || err);
    failed++;
  }
}

function collectTsxFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectTsxFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
      out.push(full);
    }
  }
  return out;
}

console.log('================================================================================');
console.log('🔒 VERIFYING REVENUE SECTION REMOVAL & PORTAL REGRESSION CHECKS');
console.log('================================================================================\n');

const dashboardCode = fs.readFileSync(path.resolve('src/app/admin/dashboard/page.tsx'), 'utf8');
const paymentsCode = fs.readFileSync(path.resolve('src/app/admin/payments/page.tsx'), 'utf8');
const enrollmentsCode = fs.readFileSync(path.resolve('src/app/admin/enrollments/page.tsx'), 'utf8');

runTest('TC-01: Admin Dashboard removes Revenue Collected & IndianRupee and uses non-monetary Verified Enrollments card in 4-card grid', () => {
  assert(!dashboardCode.includes('Revenue Collected'), 'Dashboard must not contain "Revenue Collected"');
  assert(!dashboardCode.includes('totalRevenue'), 'Dashboard must not calculate totalRevenue');
  assert(!dashboardCode.includes('IndianRupee'), 'Dashboard must not import or render IndianRupee');
  assert(dashboardCode.includes('lg:grid-cols-4'), 'Dashboard must preserve the 4-card KPI grid');
  assert(dashboardCode.includes('Verified Enrollments'), 'Dashboard must render "Verified Enrollments"');
  assert(dashboardCode.includes('href="/admin/enrollments"'), 'Verified Enrollments card must link to /admin/enrollments');

  const cardStart = dashboardCode.indexOf('Verified Enrollments');
  const cardEnd = dashboardCode.indexOf('Pending Fee Dues');
  const cardSlice = dashboardCode.slice(cardStart, cardEnd);
  assert(!cardSlice.includes('₹'), 'Verified Enrollments card must not contain ₹ monetary symbol');
});

runTest('TC-02: Admin Payments/Fees removes Verified Revenue card & totalCollected and uses 4-card KPI grid', () => {
  assert(!paymentsCode.includes('Verified Revenue'), 'Payments page must not contain "Verified Revenue"');
  assert(!paymentsCode.includes('totalCollected'), 'Payments page must not calculate totalCollected');
  assert(paymentsCode.includes('grid-cols-2 lg:grid-cols-4 gap-4'), 'Payments page KPI row must use 4-card grid');
  assert(!paymentsCode.includes('lg:grid-cols-5'), 'Payments page must not use 5-column KPI grid');
});

runTest('TC-03: No .tsx file in src/app or src/components exposes Revenue Collected, Verified Revenue, or Total Revenue', () => {
  const tsxFiles = [
    ...collectTsxFiles(path.resolve('src/app')),
    ...collectTsxFiles(path.resolve('src/components')),
  ];
  const forbidden = ['Revenue Collected', 'Verified Revenue', 'Total Revenue'];
  for (const file of tsxFiles) {
    const content = fs.readFileSync(file, 'utf8');
    for (const phrase of forbidden) {
      assert(!content.includes(phrase), `${file} still contains "${phrase}"`);
    }
  }
  console.log(`   ↳ Scanned ${tsxFiles.length} .tsx files across src/app and src/components: 0 revenue KPIs found.`);
});

runTest('TC-04: Admin Enrollments excludes admin profiles from student enrollment lists & counts', () => {
  assert(
    enrollmentsCode.includes("stu.email !== 'angatsaha825@gmail.com'"),
    'Admin enrollments must exclude angatsaha825@gmail.com from series counts'
  );
  assert(
    enrollmentsCode.includes("stu.email === 'angatsaha825@gmail.com'"),
    'Admin enrollments must exclude angatsaha825@gmail.com from course lists'
  );
});

console.log('\n================================================================================');
console.log(`📊 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('================================================================================');
if (failed > 0) process.exit(1);
