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

console.log('================================================================================');
console.log('💳 VERIFYING PAYMENT FLOW (UPI ID + WHATSAPP QR REQUEST + MANDATORY UTR)');
console.log('================================================================================\n');

const payManualCode = fs.readFileSync(path.resolve('src/components/payment/PayManualModal.tsx'), 'utf8');
const upiModalCode = fs.readFileSync(path.resolve('src/components/payment/UpiPaymentModal.tsx'), 'utf8');
const howToPayCode = fs.readFileSync(path.resolve('src/content/howToPayContent.ts'), 'utf8');

runTest('TC-01: QR Code display, upi:// deep-link, and Bank Transfer tab are completely removed from PayManualModal & UpiPaymentModal', () => {
  for (const [label, code] of [
    ['PayManualModal.tsx', payManualCode],
    ['UpiPaymentModal.tsx', upiModalCode],
  ]) {
    assert(!code.includes('getUpiQrCodeUrl'), `${label} must not use getUpiQrCodeUrl`);
    assert(!code.includes('getOfficialQrCodeAsset'), `${label} must not use getOfficialQrCodeAsset`);
    assert(!code.includes('buildUpiDeepLink'), `${label} must not use buildUpiDeepLink`);
    assert(!code.includes('CGA Official UPI QR Code'), `${label} must not render QR code image`);
    assert(!code.includes('Bank Transfer (NEFT / IMPS)'), `${label} must not render Bank Transfer tab`);
  }
});

runTest('TC-02: Only Option 1 (Pay via UPI ID) and Option 2 (Request QR on WhatsApp) are present', () => {
  assert(payManualCode.includes('Option 1: Pay via UPI ID'), 'PayManualModal must have Option 1: Pay via UPI ID');
  assert(
    payManualCode.includes('Option 2: Request QR on WhatsApp'),
    'PayManualModal must have Option 2: Request QR on WhatsApp'
  );
  assert(payManualCode.includes('https://wa.me/${whatsappNumber}?text='), 'PayManualModal must build wa.me redirect URL');
  assert(
    payManualCode.includes('Copy UPI ID'),
    'PayManualModal must provide Copy UPI ID action for Option 1'
  );
  assert(
    payManualCode.includes('Message Admin on WhatsApp for QR'),
    'PayManualModal must provide WhatsApp redirect button for Option 2'
  );

  assert(upiModalCode.includes('Option 1: Pay via UPI ID'), 'UpiPaymentModal must have Option 1: Pay via UPI ID');
  assert(
    upiModalCode.includes('Option 2: Request QR on WhatsApp'),
    'UpiPaymentModal must have Option 2: Request QR on WhatsApp'
  );
  assert(upiModalCode.includes('https://wa.me/${whatsappNumber}?text='), 'UpiPaymentModal must build wa.me redirect URL');
});

runTest('TC-03: 12-digit UTR number is mandatory and Screenshot upload is optional before Admin Verification', () => {
  assert(payManualCode.includes('!/^\\d{12}$/.test(utr)'), 'PayManualModal must enforce exact 12-digit numeric UTR');
  assert(
    payManualCode.includes('123456789012') && payManualCode.includes('000000000000'),
    'PayManualModal must block sample/dummy UTRs'
  );
  assert(
    payManualCode.includes('Payment Screenshot') && payManualCode.includes('(Optional)'),
    'PayManualModal must mark payment screenshot as optional'
  );
  assert(
    payManualCode.includes('submitPaymentVerification'),
    'PayManualModal must submit UTR for admin verification'
  );
});

runTest('TC-04: All Courses, Mock Tests, Study Materials, My Learning, Fees & Payments pages use PayManualModal', () => {
  const consumerPages = [
    'src/app/mock-tests/page.tsx',
    'src/app/student/courses/page.tsx',
    'src/app/student/fees/page.tsx',
    'src/app/student/materials/page.tsx',
    'src/app/student/my-learning/page.tsx',
    'src/app/student/payments/page.tsx',
    'src/app/student/tests/page.tsx',
  ];
  for (const rel of consumerPages) {
    const content = fs.readFileSync(path.resolve(rel), 'utf8');
    assert(content.includes('PayManualModal'), `${rel} must use PayManualModal`);
  }
  assert(
    howToPayCode.includes('Pay via UPI ID or Request QR on WhatsApp'),
    'howToPayContent.ts must reflect UPI ID or WhatsApp QR request instructions'
  );
});

console.log('\n================================================================================');
console.log(`📊 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('================================================================================');
if (failed > 0) process.exit(1);
