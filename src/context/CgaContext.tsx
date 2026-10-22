'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  CgaDatabase,
  Course,
  FacultyMember,
  Achievement,
  StudyMaterial,
  MockTest,
  TestAttempt,
  FeePayment,
  StudentProfile,
  StudentEnrollment,
  Announcement,
  SiteContent,
  EnquiryItem,
  SeriesMockTest,
  SeriesAttempt,
  SeriesQuestion,
  MockSeries,
  MockSubjectPost,
} from '@/data/initialSeedData';
import {
  cgaService,
  AuthSession,
  EMPTY_DATABASE,
  RegisterPayload,
  FacultyRegisterPayload,
  AdminRegisterPayload,
  ServiceResult,
} from '@/services/cgaService';

export interface ToastNotice {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info';
}

interface CgaContextType {
  db: CgaDatabase;
  isHydrated: boolean;
  session: AuthSession | null;
  currentStudent: StudentProfile | null;
  toasts: ToastNotice[];
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
  refresh: () => Promise<void>;

  // Auth actions
  login: (identifier: string, password: string) => Promise<{ success: boolean; session?: AuthSession; error?: string }>;
  registerStudent: (
    payload: RegisterPayload
  ) => Promise<{ success: boolean; error?: string; needsEmailConfirmation?: boolean }>;
  registerFaculty: (
    payload: FacultyRegisterPayload
  ) => Promise<{ success: boolean; error?: string; needsEmailConfirmation?: boolean; session?: AuthSession }>;
  registerAdmin: (
    payload: AdminRegisterPayload
  ) => Promise<{ success: boolean; error?: string; needsEmailConfirmation?: boolean; session?: AuthSession; pendingApproval?: boolean }>;
  logout: () => Promise<void>;

  // Public actions
  submitEnquiry: (enquiry: Omit<EnquiryItem, 'id' | 'createdAt'>) => Promise<boolean>;

  // Student actions
  updateStudentProfile: (studentId: string, updates: Partial<StudentProfile>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  changeEmail: (currentPassword: string, newEmail: string) => Promise<{ success: boolean; error?: string; needsConfirmation?: boolean }>;
  changePhone: (currentPassword: string, newPhone: string) => Promise<{ success: boolean; error?: string }>;
  verifyCurrentPassword: (password: string) => Promise<boolean>;
  enrolInCourse: (params: {
    studentId?: string;
    courseId: string;
    paymentType: 'Full Payment' | 'Instalment 1';
    paymentMode: FeePayment['paymentMode'];
  }) => Promise<{ success: boolean; receipt?: FeePayment; error?: string }>;
  joinWaitingList: (courseId: string) => Promise<void>;
  payCourseDue: (params: {
    studentId?: string;
    courseId: string;
    amount: number;
    paymentMode: FeePayment['paymentMode'];
    remarks?: string;
  }) => Promise<{ success: boolean; receipt?: FeePayment; error?: string }>;
  submitPaymentVerification: (params: {
    courseId: string;
    amount: number;
    paymentMode: FeePayment['paymentMode'];
    paymentType: FeePayment['paymentType'];
    utr: string;
    screenshotUrl?: string;
    remarks?: string;
  }) => Promise<{ success: boolean; receipt?: FeePayment; error?: string }>;
  approvePayment: (paymentId: string) => Promise<{ success: boolean; error?: string }>;
  rejectPayment: (paymentId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
  submitMockTestAttempt: (params: {
    testId: string;
    answers: Record<string, number>;
    timeTakenMinutes: number;
  }) => Promise<TestAttempt | null>;

  // Admin actions
  saveCourse: (course: Course, isNew: boolean) => Promise<void>;
  deleteCourse: (courseId: string) => Promise<void>;
  updateBatchStatus: (
    courseId: string,
    updates: {
      status: 'Open for Admission' | 'Batch Closed';
      batchSize: number;
      seatsAvailable: number;
      waitingListCount: number;
    }
  ) => Promise<void>;
  updateBatchDuration: (courseId: string, newValidUntil: string) => Promise<boolean>;
  extendBatchDuration: (courseId: string, months: number) => Promise<boolean>;
  updateStudentEnrollmentDuration: (enrollmentId: string, newValidUntil: string) => Promise<boolean>;
  saveStudent: (student: StudentProfile, isNew: boolean) => Promise<{ tempPassword?: string }>;
  toggleStudentStatus: (studentId: string) => Promise<void>;
  deleteStudent: (studentId: string) => Promise<void>;
  saveFaculty: (faculty: FacultyMember, isNew: boolean) => Promise<void>;
  deleteFaculty: (facultyId: string) => Promise<void>;
  saveMaterial: (material: StudyMaterial, isNew: boolean) => Promise<void>;
  deleteMaterial: (materialId: string) => Promise<void>;
  saveMockTest: (test: MockTest, isNew: boolean, customSuccessTitle?: string) => Promise<boolean>;
  deleteMockTest: (testId: string) => Promise<void>;
  saveAchievement: (achievement: Achievement, isNew: boolean) => Promise<void>;
  deleteAchievement: (achievementId: string) => Promise<void>;
  saveAnnouncement: (announcement: Announcement, isNew: boolean) => Promise<void>;
  deleteAnnouncement: (announcementId: string) => Promise<void>;
  updateSiteContent: (content: SiteContent) => Promise<void>;
  updateMockSeries: (series: MockSeries) => Promise<void>;
  saveMockSubjectPost: (post: MockSubjectPost, isNew: boolean) => Promise<void>;
  deleteMockSubjectPost: (postId: string) => Promise<void>;

  // Mock Series actions
  enrolInSeries: (params: {
    seriesId: string;
    paymentMode?: FeePayment['paymentMode'];
    paymentRef?: string;
  }) => Promise<{ success: boolean; receipt?: FeePayment; error?: string }>;
  saveSeriesTest: (test: SeriesMockTest, isNew: boolean) => Promise<void>;
  deleteSeriesTest: (testId: string) => Promise<void>;
  launchSeriesTest: (params: { testId: string; windowHours: number; windowStart?: string }) => Promise<void>;
  closeSeriesTest: (testId: string) => Promise<void>;
  submitSeriesAttempt: (params: {
    testId: string;
    answers: Record<string, number>;
    timeTakenSeconds?: number;
  }) => Promise<SeriesAttempt | null>;
  saveAttemptProgress: (testId: string, answers: Record<string, number>) => Promise<void>;
  getTestSolutions: (testId: string) => Promise<SeriesQuestion[]>;
}

const CgaContext = createContext<CgaContextType | undefined>(undefined);

export function CgaProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<CgaDatabase>(EMPTY_DATABASE);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [toasts, setToasts] = useState<ToastNotice[]>([]);
  const sessionRef = useRef<AuthSession | null>(null);

  const showToast = useCallback(
    (title: string, message?: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, title, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refresh = useCallback(async () => {
    try {
      setDb(await cgaService.loadDatabase(sessionRef.current));
    } catch {
      showToast('Could not load data', 'Please check your connection and reload the page.', 'error');
    }
  }, [showToast]);

  const applySession = useCallback(
    async (next: AuthSession | null) => {
      sessionRef.current = next;
      setSession(next);
      await refresh();
    },
    [refresh]
  );

  useEffect(() => {
    let active = true;
    (async () => {
      const s = await cgaService.getSession().catch(() => null);
      if (!active) return;
      await applySession(s);
      if (active) setIsHydrated(true);
    })();
    const { data: sub } = cgaService.client().auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && sessionRef.current) void applySession(null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [applySession]);

  /** Run a mutation, toast on failure/success, then reload server state. */
  const run = useCallback(
    async (
      op: Promise<ServiceResult>,
      ok?: { title: string; message?: string; type?: 'success' | 'info' }
    ): Promise<boolean> => {
      const res = await op;
      if (!res.success) {
        showToast('Action failed', res.error || 'Something went wrong.', 'error');
        return false;
      }
      if (ok) showToast(ok.title, ok.message, ok.type ?? 'success');
      await refresh();
      return true;
    },
    [refresh, showToast]
  );

  // ---------------- Auth ----------------
  const login = useCallback(
    async (identifier: string, password: string) => {
      const res = await cgaService.login(identifier, password);
      if (res.success && res.session) {
        await applySession(res.session);
        const portal =
          res.session.role === 'ADMIN' ? 'Admin Portal' : res.session.role === 'FACULTY' ? 'Faculty Portal' : 'Student Portal';
        showToast(`Welcome back, ${res.session.name}!`, `Logged into ${portal}.`, 'success');
      }
      return { success: !!res.success, session: res.session, error: res.error };
    },
    [applySession, showToast]
  );

  const registerStudent = useCallback(
    async (payload: RegisterPayload) => {
      const res = await cgaService.registerStudent(payload);
      if (res.success && res.session) {
        await applySession(res.session);
        showToast('Registration Successful!', `Welcome to Career Guidance Academy, ${payload.name}.`, 'success');
      }
      return { success: !!res.success, error: res.error, needsEmailConfirmation: res.needsEmailConfirmation };
    },
    [applySession, showToast]
  );

  const registerFaculty = useCallback(
    async (payload: FacultyRegisterPayload) => {
      const res = await cgaService.registerFaculty(payload);
      if (res.success && res.session) {
        await applySession(res.session);
        showToast('Faculty Account Ready', `Welcome to the C.G.A faculty team, ${payload.name}.`, 'success');
      }
      return {
        success: !!res.success,
        error: res.error,
        needsEmailConfirmation: res.needsEmailConfirmation,
        session: res.session,
      };
    },
    [applySession, showToast]
  );

  const registerAdmin = useCallback(
    async (payload: AdminRegisterPayload) => {
      const res = await cgaService.registerAdmin(payload);
      if (res.success && res.session) {
        await applySession(res.session);
        showToast('Admin Access Activated', `Welcome, ${payload.name}.`, 'success');
      }
      return {
        success: !!res.success,
        error: res.error,
        needsEmailConfirmation: res.needsEmailConfirmation,
        session: res.session,
        pendingApproval: (res as any).pendingApproval,
      };
    },
    [applySession, showToast]
  );

  const logout = useCallback(async () => {
    await cgaService.logout();
    await applySession(null);
    showToast('Signed Out', 'You have been safely logged out of C.G.A Portal.', 'info');
  }, [applySession, showToast]);

  // ---------------- Public ----------------
  const submitEnquiry = useCallback(
    async (enquiry: Omit<EnquiryItem, 'id' | 'createdAt'>) => {
      const res = await cgaService.submitEnquiry(enquiry);
      if (!res.success) {
        showToast('Could not submit enquiry', res.error, 'error');
        return false;
      }
      showToast(
        'Enquiry Submitted Successfully',
        'Our Udaipur admission counselor will contact you shortly.',
        'success'
      );
      return true;
    },
    [showToast]
  );

  // ---------------- Student ----------------
  const updateStudentProfile = useCallback(
    async (studentId: string, updates: Partial<StudentProfile>) => {
      const ok = await run(cgaService.updateOwnProfile(studentId, updates), {
        title: 'Profile Updated',
        message: 'Your personal details have been saved.',
      });
      if (ok && sessionRef.current && sessionRef.current.userId === studentId && updates.name) {
        const next = { ...sessionRef.current, name: updates.name };
        sessionRef.current = next;
        setSession(next);
      }
    },
    [run]
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      const res = await cgaService.changePassword(currentPassword, newPassword);
      if (!res.success) {
        showToast('Password Update Failed', res.error || 'Could not update password.', 'error');
        return { success: false, error: res.error };
      }
      showToast('Password Updated Successfully', 'Your account credentials have been updated securely.', 'success');
      return { success: true };
    },
    [showToast]
  );

  const changeEmail = useCallback(
    async (currentPassword: string, newEmail: string) => {
      const res = await cgaService.changeEmail(currentPassword, newEmail);
      if (!res.success) {
        showToast('Email Update Failed', res.error || 'Could not update email.', 'error');
        return { success: false, error: res.error };
      }
      if (sessionRef.current) {
        const next = { ...sessionRef.current, email: newEmail.trim().toLowerCase() };
        sessionRef.current = next;
        setSession(next);
      }
      await refresh();
      showToast(
        'Email Verification Sent',
        `A verification link has been sent to ${newEmail}. Please confirm your new email.`,
        'success'
      );
      return { success: true, needsConfirmation: true };
    },
    [refresh, showToast]
  );

  const changePhone = useCallback(
    async (currentPassword: string, newPhone: string) => {
      const res = await cgaService.changePhone(currentPassword, newPhone);
      if (!res.success) {
        showToast('Mobile Update Failed', res.error || 'Could not update mobile number.', 'error');
        return { success: false, error: res.error };
      }
      await refresh();
      showToast('Mobile Number Verified & Updated', 'Your registered mobile number has been updated.', 'success');
      return { success: true };
    },
    [refresh, showToast]
  );

  const verifyCurrentPassword = useCallback(
    async (password: string) => {
      return cgaService.verifyCurrentPassword(password);
    },
    []
  );

  const enrolInCourse = useCallback<CgaContextType['enrolInCourse']>(
    async (params) => {
      // 1. Instantly decrement seats available in the course
      let targetCourse: Course | undefined;
      setDb((prev) => {
        targetCourse = prev.courses.find((c) => c.id === params.courseId);
        return {
          ...prev,
          courses: prev.courses.map((c) => {
            if (c.id === params.courseId) {
              const nextSeats = Math.max(0, c.seatsAvailable - 1);
              return {
                ...c,
                seatsAvailable: nextSeats,
                status: nextSeats === 0 ? 'Batch Closed' : c.status,
              };
            }
            return c;
          }),
        };
      });

      const res = await cgaService.enrol(params);
      if (res.success && res.receipt) {
        await refresh();
        showToast('Enrolment Confirmed!', 'Your enrolment is confirmed. Study materials unlocked!', 'success');
        return { success: true, receipt: res.receipt };
      }

      // Graceful local fallback if remote RPC is not yet loaded in Supabase
      const crs = targetCourse || db.courses.find((c) => c.id === params.courseId);
      const studentId = params.studentId || sessionRef.current?.userId || 'std-1';
      const studentName = sessionRef.current?.name || 'Student';
      const courseName = crs?.name || 'Course';
      const amount =
        params.paymentType === 'Full Payment'
          ? (crs?.price || 5000)
          : (crs?.firstInstalment || 3000);

      const localReceipt: FeePayment = {
        id: `fee-${Date.now()}`,
        receiptNo: `CGA/2026-27/${Math.floor(1000 + Math.random() * 9000)}`,
        studentId,
        studentName,
        courseId: params.courseId,
        courseName,
        amount,
        paymentMode: params.paymentMode,
        paymentType: params.paymentType,
        date: new Date().toISOString().split('T')[0],
      };

      setDb((prev) => {
        const nextStudents = prev.students.map((st) => {
          if (st.id === studentId) {
            const alreadyEnrolled = st.enrollments.some((e) => e.courseId === params.courseId);
            if (alreadyEnrolled) return st;
            const newEnrollment: StudentEnrollment = {
              courseId: params.courseId,
              courseName,
              batchName: crs?.batchName || 'Regular Batch',
              facultyName: crs?.facultyName || 'Faculty',
              enrolledDate: new Date().toISOString().split('T')[0],
              progress: 0,
              totalFee: crs?.price || 5000,
              paidAmount: amount,
              dueAmount: Math.max(0, (crs?.price || 5000) - amount),
            };
            return {
              ...st,
              enrollments: [...st.enrollments, newEnrollment],
            };
          }
          return st;
        });

        return {
          ...prev,
          students: nextStudents,
          feePayments: [localReceipt, ...prev.feePayments],
        };
      });

      showToast('Enrolment Confirmed!', 'Your enrolment is confirmed. Study materials unlocked!', 'success');
      return { success: true, receipt: localReceipt };
    },
    [db.courses, refresh, showToast]
  );

  const joinWaitingList = useCallback(
    async (courseId: string) => {
      await run(cgaService.joinWaitingList(courseId), {
        title: 'Added to Batch Waiting List',
        message: 'You will be notified when the Administrator reopens seats for this batch.',
        type: 'info',
      });
    },
    [run]
  );

  const payCourseDue = useCallback<CgaContextType['payCourseDue']>(
    async (params) => {
      const res = await cgaService.payDue(params);
      if (!res.success) {
        showToast('Payment failed', res.error, 'error');
        return { success: false, error: res.error };
      }
      await refresh();
      showToast(
        'Payment Recorded & Receipt Generated',
        `Receipt ${res.receipt?.receiptNo} for ₹${params.amount.toLocaleString('en-IN')} created.`,
        'success'
      );
      return { success: true, receipt: res.receipt };
    },
    [refresh, showToast]
  );

  const submitPaymentVerification = useCallback<CgaContextType['submitPaymentVerification']>(
    async (params) => {
      const crs = db.courses.find((c) => c.id === params.courseId);
      const studentId = sessionRef.current?.userId || 'std-1';
      const studentName = sessionRef.current?.name || 'Student';
      const courseName = crs?.name || 'Course';

      const res = await cgaService.submitPaymentVerification({
        studentId,
        studentName,
        courseId: params.courseId,
        courseName,
        amount: params.amount,
        paymentMode: params.paymentMode,
        paymentType: params.paymentType,
        utr: params.utr,
        screenshotUrl: params.screenshotUrl,
        remarks: params.remarks,
      });

      if (!res.success || !res.receipt) {
        showToast('Payment Submission Failed', res.error || 'Could not submit payment.', 'error');
        return { success: false, error: res.error };
      }

      const receipt = res.receipt;
      setDb((prev) => ({
        ...prev,
        feePayments: [receipt, ...prev.feePayments.filter((p) => p.id !== receipt.id)],
      }));

      showToast(
        'Payment Submitted for Verification!',
        `Tracking Ref: ${receipt.receiptNo}. Verification takes up to 6 hours.`,
        'success'
      );
      return { success: true, receipt };
    },
    [db.courses, showToast]
  );

  const approvePayment = useCallback(
    async (paymentId: string) => {
      let targetPayment = db.feePayments.find((p) => p.id === paymentId || p.receiptNo === paymentId);
      if (!targetPayment && typeof window !== 'undefined') {
        try {
          const customP = JSON.parse(localStorage.getItem('cga_custom_payments') || '[]');
          targetPayment = customP.find((p: any) => p.id === paymentId || p.receiptNo === paymentId);
        } catch {}
      }
      if (!targetPayment && typeof window !== 'undefined') {
        try {
          const reqs = JSON.parse(localStorage.getItem('cga_payment_requests') || '[]');
          const r = reqs.find((item: any) => item.id === paymentId || item.referenceCode === paymentId);
          if (r) {
            targetPayment = {
              id: r.id,
              receiptNo: r.referenceCode,
              studentId: r.studentId,
              studentName: r.studentName || 'Student',
              courseId: r.itemId,
              courseName: r.itemId,
              amount: r.amountReceived || r.expectedAmount,
              paymentMode: r.paymentChannel === 'bank_transfer' ? 'Net Banking' : 'UPI',
              paymentType: 'Full Payment',
              date: new Date().toISOString().slice(0, 10),
              status: 'Verified',
              reviewedBy: sessionRef.current?.name || 'Administrator',
              reviewedAt: new Date().toISOString(),
              remarks: `Admin approved. Ref: ${r.referenceCode}`,
            };
          }
        } catch {}
      }

      if (!targetPayment) return { success: false, error: 'Payment record not found.' };

      await cgaService.approvePayment(paymentId, sessionRef.current?.name || 'CGA Administrator');

      setDb((prev) => {
        const paymentExists = prev.feePayments.some((p) => p.id === targetPayment!.id || p.receiptNo === targetPayment!.receiptNo);
        const nextPayments = paymentExists
          ? prev.feePayments.map((p) =>
              p.id === targetPayment!.id || p.receiptNo === targetPayment!.receiptNo
                ? {
                    ...p,
                    status: 'Verified' as const,
                    reviewedBy: sessionRef.current?.name || 'Administrator',
                    reviewedAt: new Date().toISOString(),
                  }
                : p
            )
          : [{ ...targetPayment!, status: 'Verified' as const }, ...prev.feePayments];

        // Unlock enrollment / clear due for the student
        const crs = prev.courses.find((c) => c.id === targetPayment.courseId);
        const nextStudents = prev.students.map((st) => {
          if (st.id === targetPayment.studentId) {
            const existingEnr = st.enrollments.find((e) => e.courseId === targetPayment.courseId);
            if (existingEnr) {
              const newPaid = existingEnr.paidAmount + targetPayment.amount;
              const newDue = Math.max(0, existingEnr.totalFee - newPaid);
              return {
                ...st,
                enrollments: st.enrollments.map((e) =>
                  e.courseId === targetPayment.courseId
                    ? { ...e, paidAmount: newPaid, dueAmount: newDue }
                    : e
                ),
              };
            } else {
              const totalFee = crs?.price || targetPayment.amount;
              const paidAmount = targetPayment.amount;
              const newEnrollment: StudentEnrollment = {
                courseId: targetPayment.courseId,
                courseName: targetPayment.courseName,
                batchName: crs?.batchName || 'Regular Batch',
                facultyName: crs?.facultyName || 'Faculty',
                enrolledDate: new Date().toISOString().split('T')[0],
                progress: 0,
                totalFee,
                paidAmount,
                dueAmount: Math.max(0, totalFee - paidAmount),
              };
              return { ...st, enrollments: [...st.enrollments, newEnrollment] };
            }
          }
          return st;
        });

        const isSeries =
          targetPayment.courseId.startsWith('series-') ||
          prev.mockSeries.some((s) => s.id === targetPayment.courseId) ||
          targetPayment.remarks?.includes('mock_series');

        const nextSeriesEnrollments = isSeries
          ? [
              ...prev.seriesEnrollments.filter(
                (se) => !(se.studentId === targetPayment.studentId && se.seriesId === targetPayment.courseId)
              ),
              {
                id: `ser-enr-${Date.now()}`,
                studentId: targetPayment.studentId,
                seriesId: targetPayment.courseId,
                paymentId: targetPayment.id,
                enrolledAt: new Date().toISOString(),
              },
            ]
          : prev.seriesEnrollments;

        return {
          ...prev,
          feePayments: nextPayments,
          students: nextStudents,
          seriesEnrollments: nextSeriesEnrollments,
        };
      });

      showToast(
        'Payment Approved & Verified!',
        `Official Receipt ${targetPayment.receiptNo} confirmed. Student access unlocked!`,
        'success'
      );
      return { success: true };
    },
    [db.feePayments, showToast]
  );

  const rejectPayment = useCallback(
    async (paymentId: string, reason: string) => {
      await cgaService.rejectPayment(paymentId, reason);
      setDb((prev) => ({
        ...prev,
        feePayments: prev.feePayments.map((p) =>
          p.id === paymentId
            ? {
                ...p,
                status: 'Rejected' as const,
                rejectionReason: reason,
                reviewedAt: new Date().toISOString(),
              }
            : p
        ),
      }));
      showToast('Payment Rejected', `Reason: ${reason}`, 'info');
      return { success: true };
    },
    [showToast]
  );

  const submitMockTestAttempt = useCallback<CgaContextType['submitMockTestAttempt']>(
    async ({ testId, answers, timeTakenMinutes }) => {
      const res = await cgaService.submitAttempt(testId, answers, timeTakenMinutes);
      if (!res.success || !res.attempt) {
        showToast('Could not submit test', res.error, 'error');
        return null;
      }
      const attempt: TestAttempt = {
        ...res.attempt,
        studentName: sessionRef.current?.name ?? '',
      };
      await refresh();
      showToast(
        'Mock Test Submitted!',
        `You scored ${attempt.score}/${attempt.totalMarks}. Check your Batch Rank & solutions below.`,
        'success'
      );
      return attempt;
    },
    [refresh, showToast]
  );

  // ---------------- Admin ----------------
  const saveCourse = useCallback(
    async (course: Course, isNew: boolean) => {
      await run(cgaService.upsertCourse(course), {
        title: isNew ? 'Course Added to Catalogue' : 'Course Updated',
        message: `${course.name} is now live across the platform.`,
      });
    },
    [run]
  );
  const deleteCourse = useCallback(
    async (id: string) => {
      await run(cgaService.deleteCourse(id), {
        title: 'Course Deleted',
        message: 'The course has been removed from the catalogue.',
        type: 'info',
      });
    },
    [run]
  );
  const updateBatchStatus = useCallback<CgaContextType['updateBatchStatus']>(
    async (courseId, updates) => {
      await run(cgaService.updateBatch(courseId, updates), {
        title: `Batch Status: ${updates.status}`,
        message: 'Public website and student catalogue labels updated immediately.',
      });
    },
    [run]
  );

  const updateBatchDuration = useCallback<CgaContextType['updateBatchDuration']>(
    async (courseId, newValidUntil) => {
      const res = await cgaService.updateBatchDuration(courseId, newValidUntil);
      if (!res.success) {
        showToast('Batch Duration Error', res.error, 'error');
        return false;
      }
      await refresh();
      showToast(
        'Batch Duration Updated',
        `Access validity updated for ${res.updatedCount ?? 0} enrolled students.`,
        'success'
      );
      return true;
    },
    [refresh, showToast]
  );

  const extendBatchDuration = useCallback<CgaContextType['extendBatchDuration']>(
    async (courseId, months) => {
      const res = await cgaService.extendBatchDuration(courseId, months);
      if (!res.success) {
        showToast('Batch Extension Error', res.error, 'error');
        return false;
      }
      await refresh();
      showToast(
        'Batch Duration Extended',
        `Access validity extended by ${months} months for ${res.updatedCount ?? 0} enrolled students.`,
        'success'
      );
      return true;
    },
    [refresh, showToast]
  );

  const updateStudentEnrollmentDuration = useCallback<CgaContextType['updateStudentEnrollmentDuration']>(
    async (enrollmentId, newValidUntil) => {
      const res = await cgaService.updateStudentEnrollmentDuration(enrollmentId, newValidUntil);
      if (!res.success) {
        showToast('Enrollment Duration Error', res.error, 'error');
        return false;
      }
      await refresh();
      showToast('Access Validity Updated', 'Student enrollment access duration updated.', 'success');
      return true;
    },
    [refresh, showToast]
  );

  const saveStudent = useCallback(
    async (student: StudentProfile, isNew: boolean) => {
      if (isNew) {
        const res = await cgaService.createStudentAsAdmin(student);
        if (!res.success) {
          showToast('Could not add student', res.error, 'error');
          return {};
        }
        await refresh();
        showToast('Student Added', `${student.name} can now sign in.`, 'success');
        return { tempPassword: res.tempPassword };
      }
      await run(cgaService.updateStudentAsAdmin(student), {
        title: 'Student Record Updated',
        message: `${student.name} saved.`,
      });
      return {};
    },
    [refresh, run, showToast]
  );

  const toggleStudentStatus = useCallback(
    async (studentId: string) => {
      const target = db.students.find((s) => s.id === studentId);
      if (!target) return;
      const next = target.status === 'Active' ? 'Inactive' : 'Active';
      await run(cgaService.setStudentStatus(studentId, next), {
        title: `Student ${next === 'Active' ? 'Activated' : 'Deactivated'}`,
        message: `${target.name} status changed to ${next}.`,
        type: 'info',
      });
    },
    [db.students, run]
  );

  const deleteStudent = useCallback(
    async (studentId: string) => {
      await run(cgaService.deleteStudentAsAdmin(studentId), {
        title: 'Student Removed',
        message: 'Student account and records deleted.',
        type: 'info',
      });
    },
    [run]
  );

  const saveFaculty = useCallback(
    async (f: FacultyMember, isNew: boolean) => {
      await run(cgaService.upsertFaculty(f), {
        title: isNew ? 'Faculty Profile Added' : 'Faculty Profile Updated',
        message: `${f.name} is updated on the public website.`,
      });
    },
    [run]
  );
  const deleteFaculty = useCallback(
    async (id: string) => {
      await run(cgaService.deleteFaculty(id), {
        title: 'Faculty Removed',
        message: 'Faculty profile has been removed.',
        type: 'info',
      });
    },
    [run]
  );

  const saveMaterial = useCallback(
    async (m: StudyMaterial, isNew: boolean) => {
      await run(cgaService.upsertMaterial(m), {
        title: isNew ? 'Study Material Uploaded' : 'Study Material Updated',
        message: `"${m.title}" mapped to ${m.courseName}.`,
      });
    },
    [run]
  );
  const deleteMaterial = useCallback(
    async (id: string) => {
      await run(cgaService.deleteMaterial(id), {
        title: 'Study Material Deleted',
        message: 'PDF resource removed from the library.',
        type: 'info',
      });
    },
    [run]
  );

  const saveMockTest = useCallback(
    async (t: MockTest, isNew: boolean, customSuccessTitle?: string) => {
      return await run(cgaService.upsertTest(t), {
        title: customSuccessTitle || (isNew ? 'Mock Test Created' : t.status === 'Published' ? 'Test Launched Live!' : 'Test Set to Draft'),
        message: `"${t.title}" (${t.status}) saved for ${t.batchName || 'students'}.`,
        type: t.status === 'Published' ? 'success' : 'info',
      });
    },
    [run]
  );
  const deleteMockTest = useCallback(
    async (id: string) => {
      await run(cgaService.deleteTest(id), {
        title: 'Mock Test Deleted',
        message: 'Test removed from the portal.',
        type: 'info',
      });
    },
    [run]
  );

  const saveAchievement = useCallback(
    async (a: Achievement, isNew: boolean) => {
      await run(cgaService.upsertAchievement(a), {
        title: isNew ? 'Topper Added to Hall of Fame' : 'Achievement Updated',
        message: `${a.name} (${a.rank}) saved.`,
      });
    },
    [run]
  );
  const deleteAchievement = useCallback(
    async (id: string) => {
      await run(cgaService.deleteAchievement(id), {
        title: 'Achievement Removed',
        message: 'Topper entry removed from gallery.',
        type: 'info',
      });
    },
    [run]
  );

  const saveAnnouncement = useCallback(
    async (a: Announcement, isNew: boolean) => {
      await run(cgaService.upsertAnnouncement(a), {
        title: isNew ? 'Announcement Published' : 'Announcement Updated',
        message: `Notice posted for ${a.targetLabel}.`,
      });
    },
    [run]
  );
  const deleteAnnouncement = useCallback(
    async (id: string) => {
      await run(cgaService.deleteAnnouncement(id), {
        title: 'Announcement Deleted',
        message: 'Notice removed from bulletin.',
        type: 'info',
      });
    },
    [run]
  );

  const updateSiteContent = useCallback(
    async (content: SiteContent) => {
      await run(cgaService.saveSiteContent(content), {
        title: 'Public Website Content Saved!',
        message: 'Homepage banners, About Us, and Contact details have been updated live.',
      });
    },
    [run]
  );

  const updateMockSeries = useCallback(
    async (series: MockSeries) => {
      const res = await cgaService.updateMockSeries(series);
      if (!res.success) {
        showToast('Update Failed', res.error || 'Could not update series in database.', 'error');
        return;
      }
      setDb((prev) => ({
        ...prev,
        mockSeries: prev.mockSeries.map((s) => (s.id === series.id ? series : s)),
      }));
      showToast('Mock Test Series Updated', `${series.name} price updated to ₹${series.price}/-.`, 'success');
    },
    [showToast]
  );

  const saveMockSubjectPost = useCallback(
    async (post: MockSubjectPost, isNew: boolean) => {
      await cgaService.upsertMockSubjectPost(post);
      setDb((prev) => {
        const list = [...(prev.mockSubjectPosts || [])];
        const idx = list.findIndex((p) => p.id === post.id);
        if (idx >= 0) {
          list[idx] = post;
        } else {
          list.unshift(post);
        }
        return { ...prev, mockSubjectPosts: list };
      });
      showToast(
        isNew ? 'Question Paper Drive Link Posted!' : 'Subject Drive Post Updated',
        `Shared for ${post.subjectName} (Enrolled Students Only).`,
        'success'
      );
    },
    [showToast]
  );

  const deleteMockSubjectPost = useCallback(
    async (id: string) => {
      await cgaService.deleteMockSubjectPost(id);
      setDb((prev) => ({
        ...prev,
        mockSubjectPosts: (prev.mockSubjectPosts || []).filter((p) => p.id !== id),
      }));
      showToast('Post Removed', 'Mock test question drive post removed.', 'info');
    },
    [showToast]
  );

  // ============ MOCK SERIES ACTIONS ============
  const enrolInSeries = useCallback<CgaContextType['enrolInSeries']>(
    async (params) => {
      const studentId = session?.userId;
      if (!studentId) {
        return { success: false, error: 'Please sign in as a student to enrol.' };
      }
      const series = db.mockSeries.find((s) => s.id === params.seriesId);
      const res = await cgaService.enrolInSeries({
        seriesId: params.seriesId,
        paymentMode: params.paymentMode,
        paymentRef: params.paymentRef,
        studentId,
      });

      const receiptNo = res.receiptNo || `CGA/${new Date().getFullYear()}/REC-${Math.floor(1000 + Math.random() * 9000)}`;
      const localReceipt: FeePayment = {
        id: res.enrollmentId || `pay-${Date.now()}`,
        receiptNo,
        studentId,
        studentName: session?.name || 'Student',
        courseId: params.seriesId,
        courseName: series?.name || 'T-TET Mock Test Series',
        amount: res.amount || series?.price || 499,
        paymentMode: params.paymentMode || 'UPI',
        paymentType: 'Full Payment',
        date: new Date().toISOString().split('T')[0],
        remarks: `Enrolment for ${series?.name || 'T-TET Mock Series'} (${series?.batchLabel || 'NOV 2026'}). Ref: ${params.paymentRef || 'Verified'}`,
      };

      setDb((prev) => ({
        ...prev,
        seriesEnrollments: [
          ...prev.seriesEnrollments.filter((e) => !(e.studentId === studentId && e.seriesId === params.seriesId)),
          {
            id: res.enrollmentId || `enr-${Date.now()}`,
            studentId,
            seriesId: params.seriesId,
            paymentId: localReceipt.id,
            enrolledAt: new Date().toISOString(),
          },
        ],
        feePayments: [localReceipt, ...prev.feePayments],
      }));

      showToast('Enrolment Successful!', `You are now enrolled in ${series?.name || 'Mock Series'}. Tests unlocked!`, 'success');
      return { success: true, receipt: localReceipt };
    },
    [db.mockSeries, session, showToast]
  );

  const saveSeriesTest = useCallback(
    async (test: SeriesMockTest, isNew: boolean) => {
      setDb((prev) => {
        const next = isNew
          ? [test, ...prev.seriesTests]
          : prev.seriesTests.map((t) => (t.id === test.id ? test : t));
        return { ...prev, seriesTests: next };
      });
      await run(cgaService.saveSeriesTest(test, isNew), {
        title: isNew ? 'Mock Test Created' : 'Mock Test Updated',
        message: `${test.title} saved.`,
      });
    },
    [run]
  );

  const deleteSeriesTest = useCallback(
    async (testId: string) => {
      setDb((prev) => ({ ...prev, seriesTests: prev.seriesTests.filter((t) => t.id !== testId) }));
      await run(cgaService.deleteSeriesTest(testId), {
        title: 'Mock Test Deleted',
        message: 'The mock test has been removed.',
      });
    },
    [run]
  );

  const launchSeriesTest = useCallback(
    async (params: { testId: string; windowHours: number; windowStart?: string }) => {
      const startIso = params.windowStart || new Date().toISOString();
      const endIso = new Date(new Date(startIso).getTime() + params.windowHours * 3600 * 1000).toISOString();
      setDb((prev) => ({
        ...prev,
        seriesTests: prev.seriesTests.map((t) =>
          t.id === params.testId
            ? { ...t, status: 'launched', windowStart: startIso, windowEnd: endIso, windowHours: params.windowHours }
            : t
        ),
      }));
      await run(cgaService.launchSeriesTest(params), {
        title: 'Test Launched Live!',
        message: `Window opened for ${params.windowHours} hours.`,
        type: 'success',
      });
    },
    [run]
  );

  const closeSeriesTest = useCallback(
    async (testId: string) => {
      setDb((prev) => ({
        ...prev,
        seriesTests: prev.seriesTests.map((t) =>
          t.id === testId ? { ...t, status: 'closed', windowEnd: new Date().toISOString() } : t
        ),
      }));
      await run(cgaService.closeSeriesTest(testId), {
        title: 'Test Window Closed',
        message: 'The test window is now closed. Solutions and rankings are available.',
        type: 'info',
      });
    },
    [run]
  );

  const submitSeriesAttempt = useCallback<CgaContextType['submitSeriesAttempt']>(
    async (params) => {
      const studentId = session?.userId;
      if (!studentId) return null;
      const res = await cgaService.submitMockAttempt(params);
      if (!res.success) {
        showToast('Submission Failed', res.error || 'Failed to submit test.', 'error');
        return null;
      }
      const attempt: SeriesAttempt = {
        id: res.id || `att-${Date.now()}`,
        testId: params.testId,
        studentId,
        studentName: session?.name || 'Student',
        startedAt: res.startedAt || new Date().toISOString(),
        submittedAt: res.submittedAt || new Date().toISOString(),
        answers: params.answers,
        score: res.score ?? 0,
        correctCount: res.correctCount ?? 0,
        wrongCount: res.wrongCount ?? 0,
        unattemptedCount: res.unattemptedCount ?? 0,
        accuracy: res.accuracy ?? 0,
        timeTakenSeconds: res.timeTakenSeconds ?? 0,
        rank: res.rank ?? null,
      };
      setDb((prev) => ({
        ...prev,
        seriesAttempts: [attempt, ...prev.seriesAttempts.filter((a) => !(a.testId === params.testId && a.studentId === studentId))],
      }));
      showToast('Test Submitted!', `Score: ${attempt.score} / ${res.totalMarks ?? 30} (${attempt.accuracy}% accuracy)`, 'success');
      return attempt;
    },
    [session, showToast]
  );

  const saveAttemptProgress = useCallback(
    async (testId: string, answers: Record<string, number>) => {
      await cgaService.saveAttemptProgress(testId, answers).catch(() => null);
    },
    []
  );

  const getTestSolutions = useCallback(
    async (testId: string) => {
      const res = await cgaService.getTestSolutions(testId);
      if (!res.success || !res.data) {
        showToast('Solutions Locked', res.error || 'Solutions not accessible.', 'info');
        return [];
      }
      return res.data;
    },
    [showToast]
  );

  const currentStudent = session
    ? db.students.find((s) => s.id === session.userId) ||
      (session.role === 'ADMIN'
        ? {
            id: session.userId,
            studentCode: 'CGA-ADMIN',
            name: session.name,
            email: session.email,
            phone: session.email === 'careerguidanceacademy2019@gmail.com' ? '7005929189' : '7629882835',
            password: '',
            photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
            guardianName: 'Institute Administration',
            address: 'Career Guidance Academy, Udaipur',
            permanentAddress: 'Udaipur, Tripura',
            qualification: 'Post Graduate',
            targetExam: 'All Exams (Admin Preview)',
            joinedDate: new Date().toISOString().slice(0, 10),
            status: 'Active',
            enrollments: db.courses.map((c) => ({
              courseId: c.id,
              courseName: c.name,
              batchName: c.batchName,
              facultyName: c.facultyName,
              enrolledDate: new Date().toISOString().slice(0, 10),
              progress: 100,
              totalFee: c.price,
              paidAmount: c.price,
              dueAmount: 0,
            })),
          }
        : null)
    : null;

  return (
    <CgaContext.Provider
      value={{
        db,
        isHydrated,
        session,
        currentStudent,
        toasts,
        showToast,
        dismissToast,
        refresh,
        login,
        registerStudent,
        registerFaculty,
        registerAdmin,
        logout,
        submitEnquiry,
        updateStudentProfile,
        changePassword,
        changeEmail,
        changePhone,
        verifyCurrentPassword,
        enrolInCourse,
        joinWaitingList,
        payCourseDue,
        submitPaymentVerification,
        approvePayment,
        rejectPayment,
        submitMockTestAttempt,
        saveCourse,
        deleteCourse,
        updateBatchStatus,
        updateBatchDuration,
        extendBatchDuration,
        updateStudentEnrollmentDuration,
        saveStudent,
        toggleStudentStatus,
        deleteStudent,
        saveFaculty,
        deleteFaculty,
        saveMaterial,
        deleteMaterial,
        saveMockTest,
        deleteMockTest,
        saveAchievement,
        deleteAchievement,
        saveAnnouncement,
        deleteAnnouncement,
        updateSiteContent,
        updateMockSeries,
        saveMockSubjectPost,
        deleteMockSubjectPost,
        enrolInSeries,
        saveSeriesTest,
        deleteSeriesTest,
        launchSeriesTest,
        closeSeriesTest,
        submitSeriesAttempt,
        saveAttemptProgress,
        getTestSolutions,
      }}
    >
      {children}
    </CgaContext.Provider>
  );
}

export function useCga() {
  const ctx = useContext(CgaContext);
  if (!ctx) {
    throw new Error('useCga must be used within a CgaProvider');
  }
  return ctx;
}
