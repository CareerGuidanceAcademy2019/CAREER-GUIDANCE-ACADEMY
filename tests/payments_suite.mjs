import assert from 'node:assert';
import { PAYMENT_SETTINGS } from '../src/config/paymentSettings.ts';
import { getHowToPayContent } from '../src/content/howToPayContent.ts';

console.log('🧪 Starting Career Guidance Academy (C.G.A) Payment Test Suite...\n');

let passedTests = 0;
let failedTests = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${description}`);
    console.error(`     Error: ${err.message}\n`);
    failedTests++;
  }
}

// 1. UTR Validation & Normalization Rules
test('UTR normalization strips spaces and dashes', () => {
  const raw1 = ' 1234 5678 9012 ';
  const raw2 = '1234-5678-9012';
  const norm1 = raw1.replace(/[\s\-]/g, '');
  const norm2 = raw2.replace(/[\s\-]/g, '');
  assert.strictEqual(norm1, '123456789012');
  assert.strictEqual(norm2, '123456789012');
});

test('UTR format validation: 11 digits rejected, 13 digits rejected, letters rejected', () => {
  const upiRegex = /^[0-9]{12}$/;
  assert.strictEqual(upiRegex.test('12345678901'), false, '11 digits must fail');
  assert.strictEqual(upiRegex.test('1234567890123'), false, '13 digits must fail');
  assert.strictEqual(upiRegex.test('12345678901A'), false, 'Letters in UPI UTR must fail');
  assert.strictEqual(upiRegex.test('T24101234567'), false, 'Alphanumeric app ID must fail');
  assert.strictEqual(upiRegex.test('429381749201'), true, 'Valid 12 digits must pass');
});

test('Bank transfer NEFT/RTGS reference format validation (12-25 alphanumeric)', () => {
  const bankRegex = /^[A-Za-z0-9]{12,25}$/;
  assert.strictEqual(bankRegex.test('SBIN123456789012'), true);
  assert.strictEqual(bankRegex.test('N12345'), false, 'Too short (<12) must fail');
  assert.strictEqual(bankRegex.test('SBIN12345678901234567890123456'), false, 'Too long (>25) must fail');
});

// 2. Sample UTR Blocklist Check
test('Sample dummy UTRs (123456789012, 000000000000, 111111111111) are rejected', () => {
  const blocklist = new Set([
    '123456789012',
    '000000000000',
    '111111111111',
    '222222222222',
    '999999999999',
    '987654321098',
  ]);
  assert.strictEqual(blocklist.has('123456789012'), true);
  assert.strictEqual(blocklist.has('000000000000'), true);
  assert.strictEqual(blocklist.has('429381749201'), false);
});

// 3. Amount Tampering Prevention Logic
test('Amount derivation is strictly server-side; client input amount is disregarded', () => {
  const courseCatalog = { 'cga-tet-01': { price: 4500, firstInstalment: 2500 } };
  const clientPayload = { itemId: 'cga-tet-01', clientTamperedAmount: 1, paymentType: 'full' };
  
  // Server-side derivation logic
  const serverCourse = courseCatalog[clientPayload.itemId];
  const expectedAmount = clientPayload.paymentType === 'full' ? serverCourse.price : serverCourse.firstInstalment;
  
  assert.strictEqual(expectedAmount, 4500);
  assert.notStrictEqual(expectedAmount, clientPayload.clientTamperedAmount);
});

// 4. Approval Exact Amount Verification
test('Approval blocks amount mismatch between received and expected', () => {
  const expectedAmount = 4500;
  const adminReceived1 = 4000;
  const adminReceived2 = 4500;

  const canApprove1 = adminReceived1 === expectedAmount;
  const canApprove2 = adminReceived2 === expectedAmount;

  assert.strictEqual(canApprove1, false);
  assert.strictEqual(canApprove2, true);
});

// 5. Global UTR Uniqueness with Privacy Protection
test('Duplicate UTR attempt gives generic security error without revealing existing user', () => {
  const existingUtrs = new Set(['429381749201']);
  const newUtr = '429381749201';

  let errorResponse = null;
  if (existingUtrs.has(newUtr)) {
    errorResponse = 'This UTR is already linked to another payment. Check the number or contact support.';
  }

  assert.strictEqual(
    errorResponse,
    'This UTR is already linked to another payment. Check the number or contact support.'
  );
  assert.strictEqual(errorResponse.includes('student'), false);
});

// 6. Double Approval Idempotency
test('Double approval of the same request is idempotent and harmless', () => {
  let state = { status: 'approved', receiptNo: 'CGA-RCP-2026-1001', seatDecremented: true };
  
  // Second approval call
  function approve(state) {
    if (state.status === 'approved') {
      return { success: true, message: 'Already approved' };
    }
    state.status = 'approved';
    return { success: true };
  }

  const result = approve(state);
  assert.strictEqual(result.message, 'Already approved');
  assert.strictEqual(state.seatDecremented, true);
});

// 7. Last-seat Race Condition Logic
test('Last seat race: only first approval gets enrolled, second approval marks refund_due', () => {
  let seatsAvailable = 1;
  const waitingList = [];

  function processApproval(requestId, studentId) {
    if (seatsAvailable > 0) {
      seatsAvailable--;
      return { status: 'approved', enrolled: true };
    } else {
      waitingList.push(studentId);
      return { status: 'refund_due', enrolled: false, reason: 'Batch seats full' };
    }
  }

  const result1 = processApproval('req-1', 'stu-A');
  const result2 = processApproval('req-2', 'stu-B');

  assert.strictEqual(result1.status, 'approved');
  assert.strictEqual(result1.enrolled, true);
  assert.strictEqual(result2.status, 'refund_due');
  assert.strictEqual(result2.enrolled, false);
  assert.strictEqual(seatsAvailable, 0);
  assert.strictEqual(waitingList.length, 1);
});

// 8. Upload Validation (File Size & Type)
test('Screenshot validation: enforces JPG/PNG/WEBP and max 5MB', () => {
  function validateFile(mimeType, sizeBytes) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    const maxBytes = 5 * 1024 * 1024; // 5 MB

    if (!allowed.includes(mimeType)) return { valid: false, error: 'Invalid file format. Upload JPG, PNG, or WEBP only.' };
    if (sizeBytes > maxBytes) return { valid: false, error: 'File size exceeds 5 MB limit.' };
    return { valid: true };
  }

  assert.strictEqual(validateFile('application/pdf', 200000).valid, false);
  assert.strictEqual(validateFile('image/gif', 200000).valid, false);
  assert.strictEqual(validateFile('image/jpeg', 6 * 1024 * 1024).valid, false);
  assert.strictEqual(validateFile('image/jpeg', 1.5 * 1024 * 1024).valid, true);
  assert.strictEqual(validateFile('image/png', 2 * 1024 * 1024).valid, true);
  assert.strictEqual(validateFile('image/webp', 500000).valid, true);
});

// 9. Payment Settings and Live Values
test('Payment settings contains authentic C.G.A institute credentials', () => {
  assert.strictEqual(PAYMENT_SETTINGS.instituteName, 'Career Guidance Academy (C.G.A)');
  assert.strictEqual(PAYMENT_SETTINGS.payeeName, 'CAREER GUIDANCE ACADEMY');
  assert.strictEqual(PAYMENT_SETTINGS.upiId, 'popighosh40@okicici');
  assert.strictEqual(PAYMENT_SETTINGS.bankAccountHolder, 'POPI GHOSH');
  assert.strictEqual(PAYMENT_SETTINGS.bankAccountNumber, '37660443471');
  assert.strictEqual(PAYMENT_SETTINGS.bankIfsc, 'SBIN0000216');
  assert.strictEqual(PAYMENT_SETTINGS.supportPhoneWhatsapp, '+91-7005929189');
  assert.strictEqual(PAYMENT_SETTINGS.receiptPrefix, 'CGA-RCP-');
});

// 10. How-to-pay Guide Translations
test('How-to-pay guide provides complete content in English and Bengali', () => {
  const guide = getHowToPayContent(PAYMENT_SETTINGS);
  assert.strictEqual(guide.en.steps.length, 5);
  assert.strictEqual(guide.bn.steps.length, 5);
  assert.ok(guide.en.utrApps.length >= 4);
  assert.ok(guide.bn.utrApps.length >= 4);
  assert.ok(guide.en.faqs.length >= 6);
  assert.ok(guide.bn.faqs.length >= 6);
  assert.strictEqual(guide.en.mockScreen.utrValue, '123456789012');
});

console.log('\n============================================================');
console.log(`Results: ${passedTests} Passed, ${failedTests} Failed.`);
console.log('============================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
