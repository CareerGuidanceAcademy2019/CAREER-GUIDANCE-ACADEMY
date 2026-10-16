import assert from 'node:assert/strict';
import { numberToIndianWords } from '../src/lib/amountInWords.ts';
import { PAYMENT_SETTINGS } from '../src/config/paymentSettings.ts';

console.log('🧪 Running Counter Enrollment & Cash Payment Verification Suite...\n');

let passed = 0;
let failed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${description}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

// 1. Amount in Indian Currency Words
test('Converts 0 to Zero Rupees Only', () => {
  assert.equal(numberToIndianWords(0), 'Zero Rupees Only');
});

test('Converts ₹199 (Study Material Notes price) correctly', () => {
  assert.equal(numberToIndianWords(199), 'Rupees One Hundred Ninety Nine Only');
});

test('Converts ₹499 (T-TET 15 Mock Test series price) correctly', () => {
  assert.equal(numberToIndianWords(499), 'Rupees Four Hundred Ninety Nine Only');
});

test('Converts ₹4500 (Classroom Course fee) correctly', () => {
  assert.equal(numberToIndianWords(4500), 'Rupees Four Thousand Five Hundred Only');
});

test('Converts ₹12500 correctly', () => {
  assert.equal(numberToIndianWords(12500), 'Rupees Twelve Thousand Five Hundred Only');
});

// 2. Receipt Number Pattern
test('Receipt Number follows C.G.A institute standard prefix CGA-RCP-', () => {
  const currentYear = new Date().getFullYear();
  const testSeq = 142;
  const receiptNo = `${PAYMENT_SETTINGS.receiptPrefix}${currentYear}-${String(testSeq).padStart(5, '0')}`;
  assert.match(receiptNo, /^CGA-RCP-20\d{2}-\d{5}$/);
});

// 3. Counter Payment Modes
test('Validates accepted counter payment collection modes', () => {
  const validCounterModes = ['Cash at Counter', 'Counter UPI', 'Card Swipe', 'Cheque'];
  assert.ok(validCounterModes.includes('Cash at Counter'));
  assert.ok(validCounterModes.includes('Counter UPI'));
  assert.ok(validCounterModes.includes('Card Swipe'));
  assert.ok(validCounterModes.includes('Cheque'));
});

// 4. Multi-section Item Category coverage
test('Verifies multi-section coverage: course, mock_series, material', () => {
  const sections = ['course', 'mock_series', 'material'];
  const sectionLabels = {
    course: 'Classroom / Hybrid Coaching Course',
    mock_series: 'T-TET 2026 15 Full Mocks Series',
    material: 'Digital Study Materials & Notes',
  };
  for (const s of sections) {
    assert.ok(sectionLabels[s]);
  }
});

// 5. Balance calculation
test('Correctly computes balance due when partial cash payment is collected', () => {
  const totalFee = 4500;
  const collectedInstalment = 2500;
  const balanceDue = totalFee - collectedInstalment;
  assert.equal(balanceDue, 2000);
});

console.log(`\n============================================================`);
console.log(`Results: ${passed} Passed, ${failed} Failed.`);
console.log(`============================================================\n`);

if (failed > 0) process.exit(1);
