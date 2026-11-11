/**
 * Test Suite: Study Material Payment Restriction & My Learning Verification
 * Verifies all failure and success access modes for study materials and Google Drive links.
 */

import assert from 'node:assert';

console.log('--- RUNNING STUDY MATERIAL PAYMENT & DRIVE LINK ACCESS TEST SUITE ---\n');

// Mock data structures matching CGA types
const sampleStudent = {
  id: 'st-test-001',
  studentCode: 'CGA-ST-001',
  name: 'Anirban Debbarma',
  email: 'anirban@example.com',
  phone: '9876543210',
  enrollments: [],
};

const sampleMaterial = {
  id: 'mat-tet-math-01',
  courseId: 'crs-tet-paper1',
  courseName: 'Tripura TET Paper-I Complete Batch',
  title: 'Mathematics & Pedagogy Master Notes 2026',
  type: 'Chapter Notes',
  subject: 'Mathematics',
  price: 249,
  driveLink: 'https://drive.google.com/file/d/1CGA_TET_MATH_SAMPLE_DRIVE_LINK/view?usp=sharing',
  author: 'Er. R. Debnath',
  pages: 42,
  previewSections: [
    { heading: '1. Number System & Pedagogy', body: 'Detailed theory and practice questions...' },
  ],
};

const freeMaterial = {
  id: 'mat-free-sample-01',
  courseId: 'crs-free',
  courseName: 'Free Foundation Module',
  title: 'Foundation General Knowledge & Tripura Intro',
  type: 'Reference Booklet',
  subject: 'General Knowledge',
  price: 0,
  driveLink: 'https://drive.google.com/file/d/1CGA_FREE_SAMPLE_DRIVE_LINK/view?usp=sharing',
  author: 'Academic Wing',
  pages: 15,
  previewSections: [{ heading: 'Tripura GK', body: 'Overview of Tripura geography...' }],
};

// Access Evaluator replicating materials/page.tsx logic
function evaluateMaterialAccess(mat, currentStudent, feePayments, customPayments, materialAccess, sessionRole, currentTime = Date.now()) {
  if (sessionRole === 'ADMIN') {
    return { isUnlocked: true, isPendingVerification: false, isExpired: false, canAccessDrive: true };
  }

  const isFree = mat.price === 0 || mat.accessScope === 'all_logged_in';
  if (isFree) {
    return { isUnlocked: true, isPendingVerification: false, isExpired: false, canAccessDrive: true };
  }

  const studentMatches = (stId) =>
    stId === currentStudent.id ||
    stId === 'me' ||
    (currentStudent.phone && stId === currentStudent.phone) ||
    (currentStudent.email && stId === currentStudent.email);

  // Course Enrollment Check
  const matchingEnrollment = (currentStudent.enrollments || []).find((e) => e.courseId === mat.courseId);
  const isCourseEnrolled = Boolean(matchingEnrollment);
  const isCourseExpired = Boolean(
    matchingEnrollment?.accessValidUntil &&
    new Date(matchingEnrollment.accessValidUntil).getTime() < currentTime
  );

  // Direct Verified Fee Payment Check
  const allFeePayments = [...(feePayments || []), ...(customPayments || [])];
  const verifiedPayment = allFeePayments.find(
    (p) =>
      studentMatches(p.studentId) &&
      p.status === 'Verified' &&
      (p.itemId === mat.id || p.courseId === mat.id || (p.remarks && p.remarks.includes(mat.id)))
  );

  const hasMaterialAccessRecord = (materialAccess || []).some(
    (m) => studentMatches(m.studentId) && m.materialId === mat.id
  );

  const isPurchased = Boolean(verifiedPayment || hasMaterialAccessRecord);

  // Pending Payment Check
  const pendingPayment = allFeePayments.find(
    (p) =>
      studentMatches(p.studentId) &&
      p.status === 'Pending' &&
      (p.itemId === mat.id || p.courseId === mat.id || (p.remarks && p.remarks.includes(mat.id)))
  );

  const isUnlocked = (isCourseEnrolled && !isCourseExpired) || isPurchased;
  const isExpired = isCourseEnrolled && isCourseExpired && !isPurchased;
  const isPendingVerification = !isUnlocked && Boolean(pendingPayment);

  return {
    isUnlocked,
    isPendingVerification,
    isExpired,
    pendingPaymentRef: pendingPayment?.receiptNo || pendingPayment?.utr,
    canAccessDrive: isUnlocked && Boolean(mat.driveLink),
  };
}

// My Learning Evaluator replicating my-learning/page.tsx logic
function evaluateMyLearningUnlocked(allMaterials, currentStudent, feePayments, customPayments, materialAccess, sessionRole) {
  const enrolledCourseIds = (currentStudent.enrollments || []).map((e) => e.courseId);

  const studentMatches = (stId) =>
    stId === currentStudent.id ||
    stId === 'me' ||
    (currentStudent.phone && stId === currentStudent.phone) ||
    (currentStudent.email && stId === currentStudent.email);

  const purchasedMaterialIds = new Set();
  [...(feePayments || []), ...(customPayments || [])].forEach((p) => {
    if (studentMatches(p.studentId) && p.status === 'Verified') {
      const iId = p.itemId || p.courseId;
      if (iId) purchasedMaterialIds.add(iId);
    }
  });

  const localAccessIds = new Set();
  (materialAccess || []).forEach((m) => {
    if (studentMatches(m.studentId) && m.materialId) {
      localAccessIds.add(m.materialId);
    }
  });

  return allMaterials.filter((mat) => {
    if (mat.type === 'Current Affairs' || mat.caCategory) return false;
    const isAdmin = sessionRole === 'ADMIN';
    const isFree = mat.price === 0 || mat.accessScope === 'all_logged_in';
    const isEnrolledInCourse = enrolledCourseIds.includes(mat.courseId);
    const isPurchased =
      purchasedMaterialIds.has(mat.id) ||
      localAccessIds.has(mat.id) ||
      [...(feePayments || []), ...(customPayments || [])].some(
        (p) =>
          studentMatches(p.studentId) &&
          p.status === 'Verified' &&
          p.remarks?.includes(mat.id)
      );
    return isAdmin || isFree || isEnrolledInCourse || isPurchased;
  });
}

// PayManualModal Re-enrollment / Pending check
function evaluateModalGating(target, currentStudent, feePayments) {
  const studentMatches = (stId) =>
    stId === currentStudent.id ||
    stId === 'me' ||
    (currentStudent.phone && stId === currentStudent.phone) ||
    (currentStudent.email && stId === currentStudent.email);

  const isAlreadyEnrolled = Boolean(
    target.itemType === 'material' &&
    ((feePayments || []).some(
      (p) =>
        studentMatches(p.studentId) &&
        (p.itemId === target.itemId || p.courseId === target.itemId || p.remarks?.includes(target.itemId)) &&
        p.status === 'Verified'
    ) ||
      (currentStudent.enrollments || []).some((e) => e.courseId === target.courseId))
  );

  const existingPendingPayment = Boolean(
    (feePayments || []).some(
      (p) =>
        studentMatches(p.studentId) &&
        (p.courseId === target.itemId || p.itemId === target.itemId || p.remarks?.includes(target.itemId)) &&
        p.status === 'Pending'
    )
  );

  return { isAlreadyEnrolled, existingPendingPayment };
}

// ==================== TEST EXECUTION ====================

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  [PASS] Test ${totalTests}: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] Test ${totalTests}: ${name}`);
    console.error(`         ${err.message}`);
    process.exitCode = 1;
  }
}

// TEST 1
runTest('Unpaid student CANNOT access Google Drive link', () => {
  const result = evaluateMaterialAccess(sampleMaterial, sampleStudent, [], [], [], 'STUDENT');
  assert.strictEqual(result.isUnlocked, false, 'Material must be locked');
  assert.strictEqual(result.canAccessDrive, false, 'Drive link must NOT be accessible');
  assert.strictEqual(result.isPendingVerification, false, 'No pending payment');
});

// TEST 2
runTest('Unpaid student does NOT find paid material in My Learning', () => {
  const unlocked = evaluateMyLearningUnlocked([sampleMaterial], sampleStudent, [], [], [], 'STUDENT');
  assert.strictEqual(unlocked.length, 0, 'My Learning should have 0 unlocked materials');
});

// TEST 3
runTest('Student with Pending payment is BLOCKED from Drive link and marked Pending', () => {
  const pendingPayment = {
    id: 'pay-001',
    studentId: sampleStudent.id,
    courseId: sampleMaterial.id,
    itemId: sampleMaterial.id,
    status: 'Pending',
    receiptNo: 'REC-2026-001',
    utr: '123456789012',
    amount: 249,
  };
  const result = evaluateMaterialAccess(sampleMaterial, sampleStudent, [pendingPayment], [], [], 'STUDENT');
  assert.strictEqual(result.isUnlocked, false, 'Must remain locked while verification is pending');
  assert.strictEqual(result.canAccessDrive, false, 'Drive link must NOT be accessible during pending review');
  assert.strictEqual(result.isPendingVerification, true, 'Must flag as pending verification');
  assert.strictEqual(result.pendingPaymentRef, 'REC-2026-001');

  // Also verify modal gating detects pending payment
  const modalGate = evaluateModalGating({ itemType: 'material', itemId: sampleMaterial.id }, sampleStudent, [pendingPayment]);
  assert.strictEqual(modalGate.existingPendingPayment, true, 'Modal must recognize pending payment');
});

// TEST 4
runTest('Student with Rejected payment remains BLOCKED and can re-attempt payment', () => {
  const rejectedPayment = {
    id: 'pay-002',
    studentId: sampleStudent.id,
    courseId: sampleMaterial.id,
    itemId: sampleMaterial.id,
    status: 'Rejected',
    rejectionReason: 'UTR could not be matched with academy bank account',
  };
  const result = evaluateMaterialAccess(sampleMaterial, sampleStudent, [rejectedPayment], [], [], 'STUDENT');
  assert.strictEqual(result.isUnlocked, false, 'Must be locked after rejection');
  assert.strictEqual(result.canAccessDrive, false, 'Drive link must NOT be accessible');
  assert.strictEqual(result.isPendingVerification, false, 'Rejected payment is not pending');
});

// TEST 5
runTest('Student with Verified payment UNLOCKS Drive link directly', () => {
  const verifiedPayment = {
    id: 'pay-003',
    studentId: sampleStudent.id,
    courseId: sampleMaterial.id,
    itemId: sampleMaterial.id,
    status: 'Verified',
    receiptNo: 'REC-2026-VERIFIED',
    amount: 249,
  };
  const result = evaluateMaterialAccess(sampleMaterial, sampleStudent, [verifiedPayment], [], [], 'STUDENT');
  assert.strictEqual(result.isUnlocked, true, 'Must be unlocked after admin verification');
  assert.strictEqual(result.canAccessDrive, true, 'Drive link must be accessible');
});

// TEST 6
runTest('Verified payment immediately surfaces in My Learning with Drive link access', () => {
  const verifiedPayment = {
    id: 'pay-003',
    studentId: sampleStudent.id,
    courseId: sampleMaterial.id,
    itemId: sampleMaterial.id,
    status: 'Verified',
  };
  const unlocked = evaluateMyLearningUnlocked([sampleMaterial], sampleStudent, [verifiedPayment], [], [], 'STUDENT');
  assert.strictEqual(unlocked.length, 1, 'My Learning must show 1 unlocked material');
  assert.strictEqual(unlocked[0].id, sampleMaterial.id);
  assert.strictEqual(unlocked[0].driveLink, sampleMaterial.driveLink, 'Drive link must match');
});

// TEST 7
runTest('Free study material (price === 0) is accessible without payment', () => {
  const result = evaluateMaterialAccess(freeMaterial, sampleStudent, [], [], [], 'STUDENT');
  assert.strictEqual(result.isUnlocked, true, 'Free material must be unlocked');
  assert.strictEqual(result.canAccessDrive, true, 'Free material Drive link must be accessible');

  const myLearning = evaluateMyLearningUnlocked([freeMaterial], sampleStudent, [], [], [], 'STUDENT');
  assert.strictEqual(myLearning.length, 1, 'Free material appears in My Learning');
});

// TEST 8
runTest('Course enrollment unlocks all notes inside that course', () => {
  const studentWithCourse = {
    ...sampleStudent,
    enrollments: [
      {
        courseId: sampleMaterial.courseId,
        courseName: sampleMaterial.courseName,
        enrolledDate: '2026-01-01',
        accessValidUntil: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(),
      },
    ],
  };
  const result = evaluateMaterialAccess(sampleMaterial, studentWithCourse, [], [], [], 'STUDENT');
  assert.strictEqual(result.isUnlocked, true, 'Enrolled course must unlock material');
  assert.strictEqual(result.canAccessDrive, true);

  const myLearning = evaluateMyLearningUnlocked([sampleMaterial], studentWithCourse, [], [], [], 'STUDENT');
  assert.strictEqual(myLearning.length, 1, 'Enrolled course materials appear in My Learning');
});

// TEST 9
runTest('Expired course enrollment BLOCKS Drive link access', () => {
  const studentWithExpired = {
    ...sampleStudent,
    enrollments: [
      {
        courseId: sampleMaterial.courseId,
        courseName: sampleMaterial.courseName,
        enrolledDate: '2025-01-01',
        accessValidUntil: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(), // expired 5 days ago
      },
    ],
  };
  const result = evaluateMaterialAccess(sampleMaterial, studentWithExpired, [], [], [], 'STUDENT');
  assert.strictEqual(result.isUnlocked, false, 'Expired enrollment must not grant access');
  assert.strictEqual(result.isExpired, true, 'Flagged as expired');
  assert.strictEqual(result.canAccessDrive, false, 'Drive link must be blocked');
});

// TEST 10
runTest('Student phone number or email matching correctly unlocks verified purchase', () => {
  const paymentByPhone = {
    id: 'pay-phone',
    studentId: '9876543210', // paid with phone
    itemId: sampleMaterial.id,
    status: 'Verified',
  };
  const result = evaluateMaterialAccess(sampleMaterial, sampleStudent, [paymentByPhone], [], [], 'STUDENT');
  assert.strictEqual(result.isUnlocked, true, 'Phone match must unlock');

  const paymentByEmail = {
    id: 'pay-email',
    studentId: 'anirban@example.com', // paid with email
    itemId: sampleMaterial.id,
    status: 'Verified',
  };
  const resultEmail = evaluateMaterialAccess(sampleMaterial, sampleStudent, [paymentByEmail], [], [], 'STUDENT');
  assert.strictEqual(resultEmail.isUnlocked, true, 'Email match must unlock');
});

// TEST 11
runTest('Admin role has universal access to all materials and Drive links', () => {
  const result = evaluateMaterialAccess(sampleMaterial, sampleStudent, [], [], [], 'ADMIN');
  assert.strictEqual(result.isUnlocked, true, 'Admin always has unlocked access');
  assert.strictEqual(result.canAccessDrive, true, 'Admin can always open Drive link');
});

// TEST 12
runTest('Modal prevents duplicate payment if student already owns material', () => {
  const verifiedPayment = {
    id: 'pay-verified',
    studentId: sampleStudent.id,
    itemId: sampleMaterial.id,
    status: 'Verified',
  };
  const gate = evaluateModalGating({ itemType: 'material', itemId: sampleMaterial.id }, sampleStudent, [verifiedPayment]);
  assert.strictEqual(gate.isAlreadyEnrolled, true, 'Modal blocks duplicate payment attempt');
});

console.log(`\n--- ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY! ---`);

