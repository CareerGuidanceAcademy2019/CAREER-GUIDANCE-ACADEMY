'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  CgaDatabase,
  INITIAL_SEED_DATA,
  Course,
  FacultyMember,
  Achievement,
  StudyMaterial,
  MockTest,
  TestAttempt,
  FeePayment,
  StudentProfile,
  Announcement,
  SiteContent,
  EnquiryItem,
} from '@/data/initialSeedData';
import { cgaService, AuthSession } from '@/services/cgaService';

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

  // Auth actions
  login: (email: string, password: string) => { success: boolean; session?: AuthSession; error?: string };
  registerStudent: (payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
    guardianName: string;
    address: string;
    qualification: string;
    targetExam: string;
  }) => { success: boolean; error?: string };
  logout: () => void;
  resetDemoData: () => void;

  // Public actions
  submitEnquiry: (enquiry: Omit<EnquiryItem, 'id' | 'createdAt'>) => void;

  // Student actions
  updateStudentProfile: (studentId: string, updates: Partial<StudentProfile>) => void;
  enrolInCourse: (params: {
    studentId: string;
    courseId: string;
    paymentType: 'Full Payment' | 'Instalment 1';
    paymentMode: FeePayment['paymentMode'];
  }) => { success: boolean; receipt?: FeePayment; error?: string };
  joinWaitingList: (courseId: string) => void;
  payCourseDue: (params: {
    studentId: string;
    courseId: string;
    amount: number;
    paymentMode: FeePayment['paymentMode'];
    remarks?: string;
  }) => { success: boolean; receipt?: FeePayment };
  submitMockTestAttempt: (attempt: Omit<TestAttempt, 'id' | 'submittedAt'>) => TestAttempt;

  // Admin actions
  saveCourse: (course: Course, isNew: boolean) => void;
  deleteCourse: (courseId: string) => void;
  updateBatchStatus: (
    courseId: string,
    updates: {
      status: 'Open for Admission' | 'Batch Closed';
      batchSize: number;
      seatsAvailable: number;
      waitingListCount: number;
    }
  ) => void;
  saveStudent: (student: StudentProfile, isNew: boolean) => void;
  toggleStudentStatus: (studentId: string) => void;
  deleteStudent: (studentId: string) => void;
  saveFaculty: (faculty: FacultyMember, isNew: boolean) => void;
  deleteFaculty: (facultyId: string) => void;
  saveMaterial: (material: StudyMaterial, isNew: boolean) => void;
  deleteMaterial: (materialId: string) => void;
  saveMockTest: (test: MockTest, isNew: boolean) => void;
  deleteMockTest: (testId: string) => void;
  saveAchievement: (achievement: Achievement, isNew: boolean) => void;
  deleteAchievement: (achievementId: string) => void;
  saveAnnouncement: (announcement: Announcement, isNew: boolean) => void;
  deleteAnnouncement: (announcementId: string) => void;
  updateSiteContent: (content: SiteContent) => void;
}

const CgaContext = createContext<CgaContextType | undefined>(undefined);

export function CgaProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<CgaDatabase>(INITIAL_SEED_DATA);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [toasts, setToasts] = useState<ToastNotice[]>([]);

  useEffect(() => {
    const loadedDb = cgaService.getDatabase();
    const loadedSession = cgaService.getSession();
    setDb(loadedDb);
    setSession(loadedSession);
    setIsHydrated(true);
  }, []);

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

  const persist = useCallback((nextDb: CgaDatabase) => {
    setDb(nextDb);
    cgaService.saveDatabase(nextDb);
  }, []);

  // Auth methods
  const login = useCallback(
    (email: string, password: string) => {
      const res = cgaService.login(email, password);
      if (res.success && res.session) {
        setSession(res.session);
        showToast(
          `Welcome back, ${res.session.name}!`,
          `Logged into ${res.session.role === 'ADMIN' ? 'Admin Portal' : 'Student Portal'}.`,
          'success'
        );
      }
      return res;
    },
    [showToast]
  );

  const registerStudent = useCallback(
    (payload: {
      name: string;
      email: string;
      phone: string;
      password: string;
      guardianName: string;
      address: string;
      qualification: string;
      targetExam: string;
    }) => {
      const res = cgaService.registerStudent(payload);
      if (res.success && res.session && res.db) {
        setDb(res.db);
        setSession(res.session);
        showToast('Registration Successful!', `Welcome to Career Guidance Academy, ${payload.name}.`, 'success');
      }
      return { success: res.success, error: res.error };
    },
    [showToast]
  );

  const logout = useCallback(() => {
    cgaService.logout();
    setSession(null);
    showToast('Signed Out', 'You have been safely logged out of C.G.A Portal.', 'info');
  }, [showToast]);

  const resetDemoData = useCallback(() => {
    const fresh = cgaService.resetDatabase();
    setDb(fresh);
    showToast('Demo Data Reset', 'All courses, batches, students, and site settings restored to initial seed state.', 'info');
  }, [showToast]);

  // Public Enquiry
  const submitEnquiry = useCallback(
    (enquiry: Omit<EnquiryItem, 'id' | 'createdAt'>) => {
      const item: EnquiryItem = {
        ...enquiry,
        id: `enq-${Date.now()}`,
        createdAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      };
      persist({
        ...db,
        enquiries: [item, ...db.enquiries],
      });
      showToast(
        'Enquiry Submitted Successfully',
        'Our Udaipur admission counselor will contact you shortly.',
        'success'
      );
    },
    [db, persist, showToast]
  );

  // Student Profile update
  const updateStudentProfile = useCallback(
    (studentId: string, updates: Partial<StudentProfile>) => {
      const nextStudents = db.students.map((s) => (s.id === studentId ? { ...s, ...updates } : s));
      persist({ ...db, students: nextStudents });
      if (session && session.userId === studentId && updates.name) {
        const nextSession = { ...session, name: updates.name };
        setSession(nextSession);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('cga_udaipur_phase1_auth_v1', JSON.stringify(nextSession));
        }
      }
      showToast('Profile Updated', 'Your personal details have been saved.', 'success');
    },
    [db, persist, session, showToast]
  );

  // Course Enrolment & Simulated Payment
  const enrolInCourse = useCallback(
    ({
      studentId,
      courseId,
      paymentType,
      paymentMode,
    }: {
      studentId: string;
      courseId: string;
      paymentType: 'Full Payment' | 'Instalment 1';
      paymentMode: FeePayment['paymentMode'];
    }) => {
      const course = db.courses.find((c) => c.id === courseId);
      const student = db.students.find((s) => s.id === studentId);
      if (!course || !student) {
        return { success: false, error: 'Course or student record not found.' };
      }
      if (course.status === 'Batch Closed' || course.seatsAvailable <= 0) {
        return { success: false, error: 'This batch is currently closed for direct admission.' };
      }
      if (student.enrollments.some((e) => e.courseId === courseId)) {
        return { success: false, error: 'You are already enrolled in this course batch.' };
      }

      const paidNow = paymentType === 'Full Payment' ? course.price : course.firstInstalment;
      const dueNow = Math.max(0, course.price - paidNow);
      const today = new Date().toISOString().split('T')[0];

      const newEnrollment = {
        courseId: course.id,
        courseName: course.name,
        batchName: course.batchName,
        facultyName: course.facultyName,
        enrolledDate: today,
        progress: 5,
        totalFee: course.price,
        paidAmount: paidNow,
        dueAmount: dueNow,
        nextDueDate: dueNow > 0 ? '2026-11-15' : undefined,
      };

      const receipt: FeePayment = {
        id: `pay-${Date.now()}`,
        receiptNo: `CGA/2026/RCP-${Math.floor(1100 + Math.random() * 8900)}`,
        studentId: student.id,
        studentName: student.name,
        courseId: course.id,
        courseName: course.name,
        amount: paidNow,
        paymentMode,
        paymentType,
        date: today,
        remarks:
          dueNow === 0
            ? 'Full course fee paid online via Student Portal.'
            : `1st Instalment paid. Balance Rs. ${dueNow.toLocaleString('en-IN')} due by Nov 15.`,
      };

      const nextSeats = Math.max(0, course.seatsAvailable - 1);
      const nextCourses = db.courses.map((c) =>
        c.id === courseId
          ? {
              ...c,
              seatsAvailable: nextSeats,
              status: nextSeats === 0 ? ('Batch Closed' as const) : c.status,
            }
          : c
      );

      const nextStudents = db.students.map((s) =>
        s.id === studentId ? { ...s, enrollments: [newEnrollment, ...s.enrollments] } : s
      );

      persist({
        ...db,
        courses: nextCourses,
        students: nextStudents,
        feePayments: [receipt, ...db.feePayments],
      });

      showToast(
        'Enrolment Confirmed!',
        `You are now enrolled in ${course.name}. Study materials unlocked!`,
        'success'
      );

      return { success: true, receipt };
    },
    [db, persist, showToast]
  );

  const joinWaitingList = useCallback(
    (courseId: string) => {
      const nextCourses = db.courses.map((c) =>
        c.id === courseId ? { ...c, waitingListCount: c.waitingListCount + 1 } : c
      );
      persist({ ...db, courses: nextCourses });
      showToast(
        'Added to Batch Waiting List',
        'You will be notified immediately when the Administrator reopens seats for this batch.',
        'info'
      );
    },
    [db, persist, showToast]
  );

  // Pay pending fee or record fee from Admin/Student
  const payCourseDue = useCallback(
    ({
      studentId,
      courseId,
      amount,
      paymentMode,
      remarks,
    }: {
      studentId: string;
      courseId: string;
      amount: number;
      paymentMode: FeePayment['paymentMode'];
      remarks?: string;
    }) => {
      const student = db.students.find((s) => s.id === studentId);
      const enrollment = student?.enrollments.find((e) => e.courseId === courseId);
      if (!student || !enrollment) {
        return { success: false };
      }

      const today = new Date().toISOString().split('T')[0];
      const newPaid = enrollment.paidAmount + amount;
      const newDue = Math.max(0, enrollment.totalFee - newPaid);

      const receipt: FeePayment = {
        id: `pay-${Date.now()}`,
        receiptNo: `CGA/2026/RCP-${Math.floor(1100 + Math.random() * 8900)}`,
        studentId: student.id,
        studentName: student.name,
        courseId,
        courseName: enrollment.courseName,
        amount,
        paymentMode,
        paymentType: newDue === 0 ? 'Balance Clearance' : 'Instalment 2',
        date: today,
        remarks: remarks || (newDue === 0 ? 'Full balance cleared.' : `Partial instalment paid.`),
      };

      const nextStudents = db.students.map((s) =>
        s.id === studentId
          ? {
              ...s,
              enrollments: s.enrollments.map((e) =>
                e.courseId === courseId
                  ? {
                      ...e,
                      paidAmount: newPaid,
                      dueAmount: newDue,
                      nextDueDate: newDue === 0 ? undefined : e.nextDueDate,
                    }
                  : e
              ),
            }
          : s
      );

      persist({
        ...db,
        students: nextStudents,
        feePayments: [receipt, ...db.feePayments],
      });

      showToast(
        'Payment Recorded & Receipt Generated',
        `Receipt ${receipt.receiptNo} for ₹${amount.toLocaleString('en-IN')} created.`,
        'success'
      );

      return { success: true, receipt };
    },
    [db, persist, showToast]
  );

  // Submit Mock Test Attempt
  const submitMockTestAttempt = useCallback(
    (attemptData: Omit<TestAttempt, 'id' | 'submittedAt'>): TestAttempt => {
      const newAttempt: TestAttempt = {
        ...attemptData,
        id: `att-${Date.now()}`,
        submittedAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      };
      persist({
        ...db,
        testAttempts: [newAttempt, ...db.testAttempts],
      });
      showToast(
        'Mock Test Submitted!',
        `You scored ${newAttempt.score}/${newAttempt.totalMarks}. Check your Batch Rank & solutions below.`,
        'success'
      );
      return newAttempt;
    },
    [db, persist, showToast]
  );

  // ==================== ADMIN PORTAL ACTIONS ====================
  const saveCourse = useCallback(
    (course: Course, isNew: boolean) => {
      const nextCourses = isNew
        ? [course, ...db.courses]
        : db.courses.map((c) => (c.id === course.id ? course : c));
      persist({ ...db, courses: nextCourses });
      showToast(
        isNew ? 'Course Added to Catalogue' : 'Course Updated',
        `${course.name} is now live across the platform.`,
        'success'
      );
    },
    [db, persist, showToast]
  );

  const deleteCourse = useCallback(
    (courseId: string) => {
      persist({
        ...db,
        courses: db.courses.filter((c) => c.id !== courseId),
      });
      showToast('Course Deleted', 'The course has been removed from the catalogue.', 'info');
    },
    [db, persist, showToast]
  );

  const updateBatchStatus = useCallback(
    (
      courseId: string,
      updates: {
        status: 'Open for Admission' | 'Batch Closed';
        batchSize: number;
        seatsAvailable: number;
        waitingListCount: number;
      }
    ) => {
      const nextCourses = db.courses.map((c) => (c.id === courseId ? { ...c, ...updates } : c));
      persist({ ...db, courses: nextCourses });
      showToast(
        `Batch Status: ${updates.status}`,
        'Public website and student catalogue labels updated immediately.',
        'success'
      );
    },
    [db, persist, showToast]
  );

  const saveStudent = useCallback(
    (student: StudentProfile, isNew: boolean) => {
      const nextStudents = isNew
        ? [student, ...db.students]
        : db.students.map((s) => (s.id === student.id ? student : s));
      persist({ ...db, students: nextStudents });
      showToast(isNew ? 'Student Added' : 'Student Record Updated', `${student.name} saved.`, 'success');
    },
    [db, persist, showToast]
  );

  const toggleStudentStatus = useCallback(
    (studentId: string) => {
      const target = db.students.find((s) => s.id === studentId);
      const nextStatus = target?.status === 'Active' ? 'Inactive' : 'Active';
      const nextStudents = db.students.map((s) =>
        s.id === studentId ? { ...s, status: nextStatus as 'Active' | 'Inactive' } : s
      );
      persist({ ...db, students: nextStudents });
      showToast(
        `Student ${nextStatus === 'Active' ? 'Activated' : 'Deactivated'}`,
        `${target?.name} status changed to ${nextStatus}.`,
        'info'
      );
    },
    [db, persist, showToast]
  );

  const deleteStudent = useCallback(
    (studentId: string) => {
      persist({
        ...db,
        students: db.students.filter((s) => s.id !== studentId),
      });
      showToast('Student Removed', 'Student record deleted.', 'info');
    },
    [db, persist, showToast]
  );

  const saveFaculty = useCallback(
    (facultyMember: FacultyMember, isNew: boolean) => {
      const nextFaculty = isNew
        ? [facultyMember, ...db.faculty]
        : db.faculty.map((f) => (f.id === facultyMember.id ? facultyMember : f));
      persist({ ...db, faculty: nextFaculty });
      showToast(
        isNew ? 'Faculty Profile Added' : 'Faculty Profile Updated',
        `${facultyMember.name} is updated on the public website.`,
        'success'
      );
    },
    [db, persist, showToast]
  );

  const deleteFaculty = useCallback(
    (facultyId: string) => {
      persist({ ...db, faculty: db.faculty.filter((f) => f.id !== facultyId) });
      showToast('Faculty Removed', 'Faculty profile has been removed.', 'info');
    },
    [db, persist, showToast]
  );

  const saveMaterial = useCallback(
    (material: StudyMaterial, isNew: boolean) => {
      const nextMaterials = isNew
        ? [material, ...db.studyMaterials]
        : db.studyMaterials.map((m) => (m.id === material.id ? material : m));
      // Also ensure linkedMaterialIds on the mapped course includes this material
      const nextCourses = db.courses.map((c) => {
        if (c.id === material.courseId && !c.linkedMaterialIds.includes(material.id)) {
          return { ...c, linkedMaterialIds: [...c.linkedMaterialIds, material.id] };
        }
        return c;
      });
      persist({ ...db, studyMaterials: nextMaterials, courses: nextCourses });
      showToast(
        isNew ? 'Study Material Uploaded' : 'Study Material Updated',
        `"${material.title}" mapped to ${material.courseName}.`,
        'success'
      );
    },
    [db, persist, showToast]
  );

  const deleteMaterial = useCallback(
    (materialId: string) => {
      persist({
        ...db,
        studyMaterials: db.studyMaterials.filter((m) => m.id !== materialId),
      });
      showToast('Study Material Deleted', 'PDF resource removed from the library.', 'info');
    },
    [db, persist, showToast]
  );

  const saveMockTest = useCallback(
    (test: MockTest, isNew: boolean) => {
      const nextTests = isNew
        ? [test, ...db.mockTests]
        : db.mockTests.map((t) => (t.id === test.id ? test : t));
      persist({ ...db, mockTests: nextTests });
      showToast(
        isNew ? 'Mock Test Created' : 'Mock Test Updated',
        `"${test.title}" (${test.status}) saved for ${test.batchName}.`,
        'success'
      );
    },
    [db, persist, showToast]
  );

  const deleteMockTest = useCallback(
    (testId: string) => {
      persist({
        ...db,
        mockTests: db.mockTests.filter((t) => t.id !== testId),
      });
      showToast('Mock Test Deleted', 'Test removed from the portal.', 'info');
    },
    [db, persist, showToast]
  );

  const saveAchievement = useCallback(
    (achievement: Achievement, isNew: boolean) => {
      const nextAch = isNew
        ? [achievement, ...db.achievements]
        : db.achievements.map((a) => (a.id === achievement.id ? achievement : a));
      persist({ ...db, achievements: nextAch });
      showToast(
        isNew ? 'Topper Added to Hall of Fame' : 'Achievement Updated',
        `${achievement.name} (${achievement.rank}) saved.`,
        'success'
      );
    },
    [db, persist, showToast]
  );

  const deleteAchievement = useCallback(
    (achievementId: string) => {
      persist({
        ...db,
        achievements: db.achievements.filter((a) => a.id !== achievementId),
      });
      showToast('Achievement Removed', 'Topper entry removed from gallery.', 'info');
    },
    [db, persist, showToast]
  );

  const saveAnnouncement = useCallback(
    (announcement: Announcement, isNew: boolean) => {
      const nextAnn = isNew
        ? [announcement, ...db.announcements]
        : db.announcements.map((a) => (a.id === announcement.id ? announcement : a));
      persist({ ...db, announcements: nextAnn });
      showToast(
        isNew ? 'Announcement Published' : 'Announcement Updated',
        `Notice posted for ${announcement.targetLabel}.`,
        'success'
      );
    },
    [db, persist, showToast]
  );

  const deleteAnnouncement = useCallback(
    (announcementId: string) => {
      persist({
        ...db,
        announcements: db.announcements.filter((a) => a.id !== announcementId),
      });
      showToast('Announcement Deleted', 'Notice removed from bulletin.', 'info');
    },
    [db, persist, showToast]
  );

  const updateSiteContent = useCallback(
    (content: SiteContent) => {
      persist({ ...db, siteContent: content });
      showToast(
        'Public Website Content Saved!',
        'Homepage banners, About Us, and Contact details have been updated live.',
        'success'
      );
    },
    [db, persist, showToast]
  );

  const currentStudent =
    session?.role === 'STUDENT'
      ? db.students.find((s) => s.id === session.userId) || db.students[0] || null
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
        login,
        registerStudent,
        logout,
        resetDemoData,
        submitEnquiry,
        updateStudentProfile,
        enrolInCourse,
        joinWaitingList,
        payCourseDue,
        submitMockTestAttempt,
        saveCourse,
        deleteCourse,
        updateBatchStatus,
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
