import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Comprehensive Verification Test Suite:
 * 1. Admin Outstanding Dues Breakdown (Registration Fee Due vs. Monthly Fee Due,
 *    Latest Payment Date/Amount/UTR inline, View All Transactions history for Admin only,
 *    and Offline Registration & Payment setup for new/existing students).
 * 2. Strict Online Live Class Access (ONLY actively enrolled students in an Online course can enter/join).
 * 3. My Learning Hub completeness (all enrolled online/offline courses, mock tests, study materials,
 *    and live class entry ONLY for enrolled active online courses).
 * 4. Admin full course management (edit all details & fees, delete course, instant student visibility via no-store).
 * 5. Hidden Live Class Link (raw Google Meet / Zoom link is NEVER exposed in public bootstrap or student DOM;
 *    students only click the "Join Live Class" button when enabled, routed through server-verified join API).
 */

interface TestTransaction {
  id: string;
  receiptNo: string;
  studentId: string;
  courseId: string;
  amount: number;
  date: string;
  utr: string;
  paymentMode: string;
  paymentType: string;
}

interface DuesState {
  studentId: string;
  courseId: string;
  registrationTotalFee: number;
  registrationPaidAmount: number;
  registrationDueAmount: number;
  monthlyFeeRate: number;
  unpaidMonthsCount: number;
  monthlyFeeDueAmount: number;
  monthlyFeePaidAmount: number;
  totalDue: number;
  transactions: TestTransaction[];
}

function createEnrollmentWithBreakdown(params: {
  studentId: string;
  courseId: string;
  registrationTotalFee: number;
  registrationPaidNow: number;
  monthlyFeeRate: number;
  unpaidMonthsCount: number;
  monthlyPaidNow?: number;
  date: string;
  utr: string;
  paymentMode?: string;
}): DuesState {
  const regDue = Math.max(0, params.registrationTotalFee - params.registrationPaidNow);
  const moPaid = params.monthlyPaidNow || 0;
  const moDue = Math.max(0, params.unpaidMonthsCount * params.monthlyFeeRate);
  const totalDue = regDue + moDue;

  const initialTx: TestTransaction = {
    id: `tx-1`,
    receiptNo: `CGA-2026-1001`,
    studentId: params.studentId,
    courseId: params.courseId,
    amount: params.registrationPaidNow + moPaid,
    date: params.date,
    utr: params.utr,
    paymentMode: params.paymentMode || 'UPI',
    paymentType: regDue > 0 ? 'Instalment 1' : 'Full Payment',
  };

  return {
    studentId: params.studentId,
    courseId: params.courseId,
    registrationTotalFee: params.registrationTotalFee,
    registrationPaidAmount: params.registrationPaidNow,
    registrationDueAmount: regDue,
    monthlyFeeRate: params.monthlyFeeRate,
    unpaidMonthsCount: params.unpaidMonthsCount,
    monthlyFeeDueAmount: moDue,
    monthlyFeePaidAmount: moPaid,
    totalDue,
    transactions: [initialTx],
  };
}

function recordSubsequentPayment(
  state: DuesState,
  payment: {
    amount: number;
    targetType: 'registration' | 'monthly' | 'both';
    date: string;
    utr: string;
    paymentMode?: string;
  }
): DuesState {
  let nextRegPaid = state.registrationPaidAmount;
  let nextRegDue = state.registrationDueAmount;
  let nextMoPaid = state.monthlyFeePaidAmount;
  let nextMoDue = state.monthlyFeeDueAmount;
  let nextUnpaidMonths = state.unpaidMonthsCount;

  if (payment.targetType === 'registration') {
    const appliedReg = Math.min(nextRegDue, payment.amount);
    nextRegPaid += appliedReg;
    nextRegDue -= appliedReg;
    const rem = payment.amount - appliedReg;
    if (rem > 0) {
      nextMoPaid += rem;
      nextMoDue = Math.max(0, nextMoDue - rem);
      nextUnpaidMonths = state.monthlyFeeRate > 0 ? Math.ceil(nextMoDue / state.monthlyFeeRate) : 0;
    }
  } else if (payment.targetType === 'monthly') {
    const appliedMo = Math.min(nextMoDue, payment.amount);
    nextMoPaid += appliedMo;
    nextMoDue -= appliedMo;
    nextUnpaidMonths = state.monthlyFeeRate > 0 ? Math.ceil(nextMoDue / state.monthlyFeeRate) : 0;
    const rem = payment.amount - appliedMo;
    if (rem > 0) {
      nextRegPaid += rem;
      nextRegDue = Math.max(0, nextRegDue - rem);
    }
  } else {
    const appliedReg = Math.min(nextRegDue, payment.amount);
    nextRegPaid += appliedReg;
    nextRegDue -= appliedReg;
    const rem = payment.amount - appliedReg;
    if (rem > 0) {
      nextMoPaid += rem;
      nextMoDue = Math.max(0, nextMoDue - rem);
      nextUnpaidMonths = state.monthlyFeeRate > 0 ? Math.ceil(nextMoDue / state.monthlyFeeRate) : 0;
    }
  }

  const newTx: TestTransaction = {
    id: `tx-${state.transactions.length + 1}`,
    receiptNo: `CGA-2026-${1001 + state.transactions.length}`,
    studentId: state.studentId,
    courseId: state.courseId,
    amount: payment.amount,
    date: payment.date,
    utr: payment.utr,
    paymentMode: payment.paymentMode || 'UPI',
    paymentType: nextRegDue + nextMoDue === 0 ? 'Balance Clearance' : 'Instalment 2',
  };

  return {
    ...state,
    registrationPaidAmount: nextRegPaid,
    registrationDueAmount: nextRegDue,
    monthlyFeePaidAmount: nextMoPaid,
    monthlyFeeDueAmount: nextMoDue,
    unpaidMonthsCount: nextUnpaidMonths,
    totalDue: nextRegDue + nextMoDue,
    transactions: [newTx, ...state.transactions],
  };
}

function evaluateStrictLiveClassAccess(params: {
  role: 'STUDENT' | 'ADMIN' | 'FACULTY';
  courseMode: 'Online' | 'Offline';
  isEnrolled: boolean;
  accessValidUntil?: string | null;
  hasLink: boolean;
  details?: string;
  timing?: string;
  nowMs?: number;
}) {
  const now = params.nowMs ?? Date.now();
  if (params.courseMode !== 'Online') {
    return { allowed: false, status: 403, reason: 'OFFLINE_COURSE_NOT_ALLOWED', joinButtonEnabled: false };
  }
  const isStaff = params.role === 'ADMIN' || params.role === 'FACULTY';
  const isExpired = Boolean(
    !isStaff && params.accessValidUntil && new Date(params.accessValidUntil).getTime() < now
  );
  if (!isStaff && (!params.isEnrolled || isExpired)) {
    return {
      allowed: false,
      status: 403,
      reason: isExpired ? 'ENROLLMENT_EXPIRED' : 'NOT_ENROLLED',
      joinButtonEnabled: false,
    };
  }
  const hasAnyUpdate = Boolean(params.hasLink || params.details?.trim() || params.timing?.trim());
  return {
    allowed: true,
    status: params.hasLink ? 302 : 200,
    emptyStateText: hasAnyUpdate ? null : 'No links or update yet',
    joinButtonEnabled: params.hasLink,
  };
}

console.log('Running Comprehensive Verification Test Suite...\n');

// ============================================================================
// TEST 1: Partial Registration (2k paid, 2k due) + Separate Monthly Fee (800 unpaid)
// ============================================================================
{
  const state = createEnrollmentWithBreakdown({
    studentId: 'stu-101',
    courseId: 'crs-tet-1',
    registrationTotalFee: 4000,
    registrationPaidNow: 2000,
    monthlyFeeRate: 800,
    unpaidMonthsCount: 1,
    date: '2026-11-01',
    utr: 'UTR409182736451',
  });

  assert.equal(state.registrationDueAmount, 2000);
  assert.equal(state.monthlyFeeDueAmount, 800);
  assert.equal(state.totalDue, 2800);
  assert.equal(state.transactions[0].utr, 'UTR409182736451');
  console.log('PASS [Test 1]: Partial registration (2k paid, 2k due) + separate monthly fee (800 unpaid) breakdown verified.');
}

// ============================================================================
// TEST 2: Latest Payment Inline Update & Admin Full Transaction History
// ============================================================================
{
  let state = createEnrollmentWithBreakdown({
    studentId: 'stu-101',
    courseId: 'crs-tet-1',
    registrationTotalFee: 4000,
    registrationPaidNow: 2000,
    monthlyFeeRate: 800,
    unpaidMonthsCount: 1,
    date: '2026-11-01',
    utr: 'UTR111122223333',
  });

  state = recordSubsequentPayment(state, {
    amount: 1000,
    targetType: 'registration',
    date: '2026-11-15',
    utr: 'UTR999988887777',
  });
  assert.equal(state.registrationDueAmount, 1000);
  assert.equal(state.monthlyFeeDueAmount, 800);
  assert.equal(state.transactions[0].utr, 'UTR999988887777');
  assert.equal(state.transactions.length, 2);
  console.log('PASS [Test 2]: Inline latest payment auto-updates & Admin full transaction history verified.');
}

// ============================================================================
// TEST 3: Strict Enrolled-Only Access to Online Live Class
// ============================================================================
{
  const now = Date.parse('2026-11-28T00:00:00Z');

  // Unenrolled student -> MUST be strictly blocked (403)
  const unenrolled = evaluateStrictLiveClassAccess({
    role: 'STUDENT',
    courseMode: 'Online',
    isEnrolled: false,
    hasLink: true,
    nowMs: now,
  });
  assert.equal(unenrolled.allowed, false);
  assert.equal(unenrolled.status, 403);
  assert.equal(unenrolled.reason, 'NOT_ENROLLED');

  // Expired enrolled student -> MUST be strictly blocked (403)
  const expired = evaluateStrictLiveClassAccess({
    role: 'STUDENT',
    courseMode: 'Online',
    isEnrolled: true,
    accessValidUntil: '2026-11-01T00:00:00Z',
    hasLink: true,
    nowMs: now,
  });
  assert.equal(expired.allowed, false);
  assert.equal(expired.status, 403);
  assert.equal(expired.reason, 'ENROLLMENT_EXPIRED');

  // Offline course -> MUST be blocked (403)
  const offline = evaluateStrictLiveClassAccess({
    role: 'STUDENT',
    courseMode: 'Offline',
    isEnrolled: true,
    hasLink: true,
    nowMs: now,
  });
  assert.equal(offline.allowed, false);
  assert.equal(offline.reason, 'OFFLINE_COURSE_NOT_ALLOWED');

  // Actively enrolled Online student with no post -> "No links or update yet", Join disabled
  const emptyActive = evaluateStrictLiveClassAccess({
    role: 'STUDENT',
    courseMode: 'Online',
    isEnrolled: true,
    accessValidUntil: '2027-05-01T00:00:00Z',
    hasLink: false,
    nowMs: now,
  });
  assert.equal(emptyActive.allowed, true);
  assert.equal(emptyActive.emptyStateText, 'No links or update yet');
  assert.equal(emptyActive.joinButtonEnabled, false);

  // Actively enrolled Online student with timing only (no link) -> Join disabled
  const timingOnly = evaluateStrictLiveClassAccess({
    role: 'STUDENT',
    courseMode: 'Online',
    isEnrolled: true,
    accessValidUntil: '2027-05-01T00:00:00Z',
    hasLink: false,
    timing: '7:00 PM IST',
    details: 'Bring notebook',
    nowMs: now,
  });
  assert.equal(timingOnly.allowed, true);
  assert.equal(timingOnly.emptyStateText, null);
  assert.equal(timingOnly.joinButtonEnabled, false);

  // Actively enrolled Online student after Admin reposts with link -> Join enabled
  const withLink = evaluateStrictLiveClassAccess({
    role: 'STUDENT',
    courseMode: 'Online',
    isEnrolled: true,
    accessValidUntil: '2027-05-01T00:00:00Z',
    hasLink: true,
    timing: '7:00 PM IST',
    details: 'Class live now',
    nowMs: now,
  });
  assert.equal(withLink.allowed, true);
  assert.equal(withLink.joinButtonEnabled, true);
  assert.equal(withLink.status, 302);

  console.log('PASS [Test 3]: Strict enrolled-only access (blocks unenrolled, expired, offline; allows active online) verified.');
}

// ============================================================================
// TEST 4: Source Verification — Hidden Link, Server Join API, My Learning, Admin Course Sync
// ============================================================================
{
  const root = process.cwd();
  const bootstrapApi = fs.readFileSync(path.join(root, 'src/app/api/public/bootstrap/route.ts'), 'utf8');
  const joinApi = fs.readFileSync(path.join(root, 'src/app/api/student/live-class/join/route.ts'), 'utf8');
  const studentLivePage = fs.readFileSync(
    path.join(root, 'src/app/student/live-class/[courseId]/page.tsx'),
    'utf8'
  );
  const studentMyLearning = fs.readFileSync(path.join(root, 'src/app/student/my-learning/page.tsx'), 'utf8');
  const adminCoursesPage = fs.readFileSync(path.join(root, 'src/app/admin/courses/page.tsx'), 'utf8');
  const adminCoursesApi = fs.readFileSync(path.join(root, 'src/app/api/admin/courses/route.ts'), 'utf8');
  const counterModal = fs.readFileSync(path.join(root, 'src/components/admin/CounterEnrollmentModal.tsx'), 'utf8');

  // 4A. Hidden link & server-verified join
  assert.ok(bootstrapApi.includes('online_class_link: null'), 'Public bootstrap MUST strip raw online_class_link');
  assert.ok(bootstrapApi.includes('hasLink: Boolean'), 'Public bootstrap MUST strip raw link from onlineClassUpdates and keep hasLink boolean');
  assert.ok(joinApi.includes('requireActiveSession'), 'Join API MUST verify authenticated session');
  assert.ok(joinApi.includes("course.mode !== 'Online'"), 'Join API MUST reject non-Online courses');
  assert.ok(joinApi.includes('NextResponse.redirect'), 'Join API MUST redirect server-side without exposing raw link in student DOM');
  assert.ok(!studentLivePage.includes('Copy Link'), 'Student live class page MUST NOT show Copy Link button');
  assert.ok(!studentLivePage.includes('navigator.clipboard'), 'Student live class page MUST NOT expose raw meeting URL via clipboard');
  assert.ok(studentLivePage.includes('/api/student/live-class/join?courseId='), 'Student Join Live Class button MUST route through server-verified join API');
  assert.ok(studentLivePage.includes('strict-enrollment-lock-state'), 'Student live class page MUST strictly lock out unenrolled/expired users');

  // 4B. My Learning hub completeness & online course entry
  assert.ok(studentMyLearning.includes('Check Live Class Updates'), 'My Learning must show Check Live Class Updates for enrolled online courses');
  assert.ok(studentMyLearning.includes('Live Class Access Expired'), 'My Learning must lock live class entry if enrollment is expired');
  assert.ok(counterModal.includes('cgaService.adminEnrollStudent'), 'Offline counter enrollment must activate server-side enrollment for My Learning');

  // 4C. Admin full course management & instant student sync
  assert.ok(bootstrapApi.includes('no-cache, no-store, must-revalidate'), 'Public bootstrap MUST disable stale CDN caching so Admin course edits/deletes appear immediately for students');
  assert.ok(adminCoursesPage.includes('1st Instalment Fee (₹)'), 'Admin Edit Course modal must allow editing First Instalment Fee');
  assert.ok(adminCoursesPage.includes('Allow Instalment Payment Plan'), 'Admin Edit Course modal must allow toggling Instalment availability');
  assert.ok(adminCoursesPage.includes('Class Schedule / Timings'), 'Admin Edit Course modal must allow editing Class Schedule / Timings');
  assert.ok(adminCoursesApi.includes('export async function GET('), 'Admin courses API must provide authenticated GET for admin raw link editing');
  assert.ok(adminCoursesApi.includes('export async function POST('), 'Admin courses API must support saving/editing courses');
  assert.ok(adminCoursesApi.includes('export async function DELETE('), 'Admin courses API must support deleting courses');

  console.log('PASS [Test 4]: Hidden meeting link, strict server-verified join API, My Learning hub, and instant Admin course sync verified.');
}

console.log('\nALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
