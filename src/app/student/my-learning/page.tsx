'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  Video,
  MapPin,
  Clock,
  Calendar,
  CheckCircle2,
  Lock,
  Unlock,
  ExternalLink,
  Copy,
  Sparkles,
  ArrowRight,
  FileText,
  UserCheck,
  AlertCircle,
  HelpCircle,
  Eye,
  Globe,
  Landmark,
  ShieldCheck,
  CreditCard,
  Check,
  Tag,
  X,
  Layers,
  Award,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { MockTest, StudentEnrollment, FeePayment, StudyMaterial } from '@/data/initialSeedData';
import { PayManualModal, type PayManualTarget } from '@/components/payment/PayManualModal';

type LearningTab = 'all' | 'courses' | 'tests' | 'current_affairs' | 'materials';

export default function StudentMyLearningPage() {
  const router = useRouter();
  const { db, currentStudent, session, showToast } = useCga();

  const [activeTab, setActiveTab] = useState<LearningTab>('all');
  const [selectedSeriesFilter, setSelectedSeriesFilter] = useState<string>('all');
  const [caCategoryFilter, setCaCategoryFilter] = useState<'All' | 'Domestic' | 'International'>('All');
  const [copiedLinkTestId, setCopiedLinkTestId] = useState<string | null>(null);
  const [copiedCaId, setCopiedCaId] = useState<string | null>(null);
  const [viewingMaterial, setViewingMaterial] = useState<StudyMaterial | null>(null);
  const [payTarget, setPayTarget] = useState<PayManualTarget | null>(null);
  const [currentTime] = useState(() => Date.now());

  // Listen for ?tab= query parameter on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['all', 'courses', 'tests', 'current_affairs', 'materials'].includes(tabParam)) {
        setActiveTab(tabParam as LearningTab);
      }
    }
  }, []);

  if (!currentStudent) return null;

  // Student's raw enrollments
  const enrollments: StudentEnrollment[] = currentStudent.enrollments || [];

  // 1. Enrolled Courses (Classroom & Online Batches, excluding series identifiers)
  const enrolledCourses = useMemo(() => {
    return enrollments.filter((e) => !e.courseId.startsWith('series-'));
  }, [enrollments]);

  // 2. Student's enrolled mock test series IDs (checking db + localStorage + feePayments + course-derived)
  const enrolledSeriesIds: string[] = useMemo(() => {
    const fromDb = (db.seriesEnrollments || [])
      .filter((e) => e.studentId === currentStudent.id || e.studentId === 'me')
      .map((e) => e.seriesId);

    let fromLocal: string[] = [];
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cga_series_enrollments');
        if (stored) {
          const list = JSON.parse(stored);
          fromLocal = list
            .filter((e: any) => e.studentId === currentStudent.id || e.studentId === 'me')
            .map((e: any) => e.seriesId);
        }
      } catch {}
    }

    const fromVerifiedPayments = (db.feePayments || [])
      .filter(
        (p) =>
          (p.studentId === currentStudent.id || p.studentId === 'me') &&
          p.status === 'Verified' &&
          (p.itemType === 'mock_series' ||
            (p.itemId && p.itemId.startsWith('series-')) ||
            (p.courseId && p.courseId.startsWith('series-')))
      )
      .map((p) => p.itemId || p.courseId)
      .filter(Boolean) as string[];

    const courseDerivedSeries: string[] = [];
    enrollments.forEach((e) => {
      if (e.courseId.includes('tet-1') || e.courseId.includes('paper1')) {
        courseDerivedSeries.push('series-ttet-paper1');
      }
      if (e.courseId.includes('tet-2-sci') || e.courseId.includes('paper2-sci')) {
        courseDerivedSeries.push('series-ttet-paper2-sci');
      }
      if (
        e.courseId.includes('tet-2-soc') ||
        e.courseId.includes('tet-2-sst') ||
        e.courseId.includes('tet-2-arts') ||
        e.courseId.includes('paper2-soc')
      ) {
        courseDerivedSeries.push('series-ttet-paper2-soc');
      }
      if (e.courseId.startsWith('series-')) {
        courseDerivedSeries.push(e.courseId);
      }
      // Check if course has bundled test series
      const crs = db.courses.find((c) => c.id === e.courseId);
      if (crs?.bundledTestIds && Array.isArray(crs.bundledTestIds)) {
        crs.bundledTestIds.forEach((tId) => {
          if (tId.startsWith('series-') || db.mockSeries.some((ms) => ms.id === tId)) {
            courseDerivedSeries.push(tId);
          }
        });
      }
    });

    return Array.from(new Set([...fromDb, ...fromLocal, ...fromVerifiedPayments, ...courseDerivedSeries]));
  }, [db.seriesEnrollments, db.feePayments, currentStudent.id, enrollments, db.courses, db.mockSeries]);

  // Enrolled Mock Test Series Packages (excluding series-current-affairs)
  const enrolledMockSeriesList = useMemo(() => {
    return (db.mockSeries || []).filter(
      (ms) => ms.id !== 'series-current-affairs' && enrolledSeriesIds.includes(ms.id)
    );
  }, [db.mockSeries, enrolledSeriesIds]);

  // Special access flag
  const isSpecialAccess =
    currentStudent.email === 'angatsaha825@gmail.com' ||
    (currentStudent as { seriesEnrolled?: boolean }).seriesEnrolled === true;

  // 3. Enrolled Mock Tests (CBT + Drive Papers)
  const enrolledMockTests: MockTest[] = useMemo(() => {
    // Collect bundled test IDs from all enrolled courses
    const bundledTestIds = new Set<string>();
    enrollments.forEach((e) => {
      const crs = db.courses.find((c) => c.id === e.courseId);
      if (crs?.bundledTestIds && Array.isArray(crs.bundledTestIds)) {
        crs.bundledTestIds.forEach((id) => bundledTestIds.add(id));
      }
    });

    return db.mockTests.filter((t) => {
      if (isSpecialAccess) return true;
      if (bundledTestIds.has(t.id) || (t.seriesId && bundledTestIds.has(t.seriesId))) return true;
      if (t.courseId && enrollments.some((e) => e.courseId === t.courseId)) return true;
      if (t.seriesId && enrolledSeriesIds.includes(t.seriesId)) return true;
      if (t.courseId && enrolledSeriesIds.includes(t.courseId)) return true;
      const enrolledInSeries = enrolledSeriesIds.some((sId) => {
        const s = db.mockSeries.find((ms) => ms.id === sId);
        return (
          (s && t.title.toLowerCase().includes(s.name.toLowerCase())) ||
          (sId === 'series-ttet-paper1' &&
            (t.title.toLowerCase().includes('paper-i') ||
              t.title.toLowerCase().includes('paper 1') ||
              t.courseId?.includes('paper1') ||
              t.seriesId === 'series-ttet-paper1')) ||
          (sId === 'series-ttet-paper2-sci' &&
            (t.title.toLowerCase().includes('science') ||
              t.title.toLowerCase().includes('math') ||
              t.courseId?.includes('paper2-sci') ||
              t.seriesId === 'series-ttet-paper2-sci')) ||
          (sId === 'series-ttet-paper2-soc' &&
            (t.title.toLowerCase().includes('social') ||
              t.title.toLowerCase().includes('arts') ||
              t.title.toLowerCase().includes('sst') ||
              t.courseId?.includes('paper2-soc') ||
              t.seriesId === 'series-ttet-paper2-soc'))
        );
      });
      return enrolledInSeries;
    });
  }, [db.mockTests, db.mockSeries, enrollments, enrolledSeriesIds, isSpecialAccess, db.courses]);

  // Filtered mock tests by sub-filter
  const filteredTests = useMemo(() => {
    return enrolledMockTests.filter((t) => {
      if (selectedSeriesFilter === 'all') return true;
      if (selectedSeriesFilter === 'p1') {
        return (
          t.title.toLowerCase().includes('paper-i') ||
          t.title.toLowerCase().includes('paper 1') ||
          t.courseId.includes('paper1')
        );
      }
      if (selectedSeriesFilter === 'p2sci') {
        return (
          t.title.toLowerCase().includes('science') ||
          t.title.toLowerCase().includes('math') ||
          t.courseId.includes('paper2-sci')
        );
      }
      if (selectedSeriesFilter === 'p2soc') {
        return (
          t.title.toLowerCase().includes('social') ||
          t.title.toLowerCase().includes('history') ||
          t.courseId.includes('paper2-soc')
        );
      }
      return t.courseId === selectedSeriesFilter || t.subject === selectedSeriesFilter;
    });
  }, [enrolledMockTests, selectedSeriesFilter]);

  // Past test attempts by this student
  const studentAttempts = useMemo(() => {
    return db.testAttempts.filter((a) => a.studentId === currentStudent.id);
  }, [db.testAttempts, currentStudent.id]);

  // 4. Current Affairs Series Enrollment & Validity
  const caEnrollment = useMemo(() => {
    const fromSeries = (db.seriesEnrollments || []).find(
      (se) =>
        (se.studentId === currentStudent.id || se.studentId === 'me') &&
        se.seriesId === 'series-current-affairs'
    );
    if (fromSeries) return fromSeries;

    const fromCourse = (currentStudent.enrollments || []).find(
      (e) => e.courseId === 'series-current-affairs'
    );
    if (fromCourse) {
      return {
        id: `ca-enr-${currentStudent.id}`,
        studentId: currentStudent.id,
        seriesId: 'series-current-affairs',
        enrolledAt: fromCourse.enrolledDate,
        accessValidUntil: fromCourse.accessValidUntil,
      };
    }

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cga_series_enrollments');
        if (stored) {
          const list = JSON.parse(stored);
          const found = list.find(
            (se: any) =>
              (se.studentId === currentStudent.id || se.studentId === 'me') &&
              se.seriesId === 'series-current-affairs'
          );
          if (found) return found;
        }
      } catch {}
    }

    const verifiedPayment = (db.feePayments || []).find(
      (p) =>
        (p.studentId === currentStudent.id || p.studentId === 'me') &&
        p.status === 'Verified' &&
        (p.itemId === 'series-current-affairs' || p.courseId === 'series-current-affairs')
    );
    if (verifiedPayment) {
      return {
        id: `ca-pay-${verifiedPayment.id}`,
        studentId: currentStudent.id,
        seriesId: 'series-current-affairs',
        enrolledAt: verifiedPayment.date,
        accessValidUntil: (verifiedPayment as any).accessValidUntil,
      };
    }

    return null;
  }, [currentStudent, db.seriesEnrollments, db.feePayments]);

  const isCaExpired = Boolean(
    caEnrollment?.accessValidUntil &&
      new Date(caEnrollment.accessValidUntil).getTime() < currentTime
  );

  const hasActiveCaSubscription = Boolean(
    session?.role === 'ADMIN' ||
    (caEnrollment &&
      (!caEnrollment.accessValidUntil || new Date(caEnrollment.accessValidUntil).getTime() >= currentTime))
  );

  const currentAffairsList = useMemo(() => {
    return (db.studyMaterials || []).filter(
      (m) => m.type === 'Current Affairs' || Boolean(m.caCategory)
    );
  }, [db.studyMaterials]);

  const filteredCurrentAffairs = useMemo(() => {
    return currentAffairsList.filter((ca) => {
      if (caCategoryFilter === 'All') return true;
      return (ca.caCategory || 'Domestic') === caCategoryFilter;
    });
  }, [currentAffairsList, caCategoryFilter]);

  // 5. Unlocked Digital Study Materials & Notes (excluding Current Affairs)
  const unlockedStudyMaterials = useMemo(() => {
    const enrolledCourseIds = enrolledCourses.map((e) => e.courseId);

    // Collect bundled material IDs from any enrolled courses (combined packages)
    const bundledMaterialIds = new Set<string>();
    enrolledCourses.forEach((e) => {
      const crs = db.courses.find((c) => c.id === e.courseId);
      if (crs?.bundledMaterialIds && Array.isArray(crs.bundledMaterialIds)) {
        crs.bundledMaterialIds.forEach((mId) => bundledMaterialIds.add(mId));
      }
    });

    const studentMatches = (stId?: string) =>
      stId === currentStudent.id ||
      stId === 'me' ||
      (currentStudent.phone && stId === currentStudent.phone) ||
      (currentStudent.email && stId === currentStudent.email);

    const purchasedMaterialIds = new Set<string>();
    (db.feePayments || []).forEach((p) => {
      if (studentMatches(p.studentId) && p.status === 'Verified') {
        const iId = (p as any).itemId || p.courseId;
        if (iId) purchasedMaterialIds.add(iId);
      }
    });

    let localAccessIds = new Set<string>();
    if (typeof window !== 'undefined') {
      try {
        const maList = JSON.parse(localStorage.getItem('cga_material_access') || '[]');
        maList.forEach((m: any) => {
          if (studentMatches(m.studentId) && m.materialId) {
            localAccessIds.add(m.materialId);
          }
        });

        const customP = JSON.parse(localStorage.getItem('cga_custom_payments') || '[]');
        customP.forEach((p: any) => {
          if (studentMatches(p.studentId) && p.status === 'Verified') {
            const iId = p.itemId || p.courseId;
            if (iId) purchasedMaterialIds.add(iId);
          }
        });
      } catch {}
    }

    return (db.studyMaterials || []).filter((mat) => {
      if (mat.type === 'Current Affairs' || mat.caCategory) return false;
      const isAdmin = session?.role === 'ADMIN';
      const isFree = mat.price === 0 || mat.accessScope === 'all_logged_in';
      const isEnrolledInCourse = enrolledCourseIds.includes(mat.courseId) || bundledMaterialIds.has(mat.id);
      const isPurchased =
        purchasedMaterialIds.has(mat.id) ||
        localAccessIds.has(mat.id) ||
        (db.feePayments || []).some(
          (p) =>
            studentMatches(p.studentId) &&
            p.status === 'Verified' &&
            p.remarks?.includes(mat.id)
        );
      return isAdmin || isFree || isEnrolledInCourse || isPurchased;
    });
  }, [db.studyMaterials, db.courses, enrolledCourses, db.feePayments, currentStudent.id, currentStudent.phone, currentStudent.email, session?.role]);

  // 6. Pending Payments awaiting Admin verification
  const pendingPayments: FeePayment[] = useMemo(() => {
    const studentMatches = (stId?: string) =>
      stId === currentStudent.id ||
      stId === 'me' ||
      (currentStudent.phone && stId === currentStudent.phone) ||
      (currentStudent.email && stId === currentStudent.email);

    const isEnrolledInItem = (itemId?: string) => {
      if (!itemId) return false;
      return (
        enrolledSeriesIds.includes(itemId) ||
        enrollments.some((e) => e.courseId === itemId) ||
        unlockedStudyMaterials.some((m) => m.id === itemId)
      );
    };

    const listFromDb = (db.feePayments || []).filter(
      (p) =>
        studentMatches(p.studentId) &&
        p.status === 'Pending' &&
        !isEnrolledInItem(p.courseId || (p as any).itemId)
    );

    let localCustom: FeePayment[] = [];
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cga_custom_payments');
        if (stored) {
          const parsed = JSON.parse(stored) as FeePayment[];
          localCustom = parsed.filter(
            (p) =>
              studentMatches(p.studentId) &&
              p.status === 'Pending' &&
              !isEnrolledInItem(p.courseId || (p as any).itemId)
          );
        }
      } catch {}
    }

    const map = new Map<string, FeePayment>();
    listFromDb.forEach((p) => map.set(p.id, p));
    localCustom.forEach((p) => map.set(p.id, p));
    return Array.from(map.values());
  }, [db.feePayments, currentStudent.id, currentStudent.phone, currentStudent.email, enrolledSeriesIds, enrollments, unlockedStudyMaterials]);

  // Copy helpers
  const handleCopyLink = (test: MockTest) => {
    if (!test.driveLink) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(test.driveLink);
      setCopiedLinkTestId(test.id);
      showToast('Drive Link Copied', 'Question paper Google Drive link copied to clipboard.', 'success');
      setTimeout(() => setCopiedLinkTestId(null), 2500);
    }
  };

  const handleCopyCaLink = (id: string, link?: string) => {
    if (!link) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(link);
      setCopiedCaId(id);
      showToast('Drive Link Copied', 'Current Affairs Google Drive PDF link copied.', 'success');
      setTimeout(() => setCopiedCaId(null), 2500);
    }
  };

  // Total enrolled items count across all wings
  const totalEnrolledCount =
    enrolledCourses.length +
    enrolledMockSeriesList.length +
    (hasActiveCaSubscription ? 1 : 0) +
    unlockedStudyMaterials.length;

  return (
    <div className="space-y-8">
      {/* ==================== HEADER WITH METRICS ==================== */}
      <div className="bg-gradient-to-r from-[#0a0e2a] via-[#0056b3] to-[#1e3a8a] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Comprehensive Student Learning Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            My Learning &amp; Enrolled Programmes
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
            Welcome back, {currentStudent.name}. Access your enrolled classroom batches, online live lectures,
            timed CBT mock tests, domestic &amp; international Current Affairs Drive PDFs, and study materials.
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/15">
              <span className="text-[11px] text-blue-200 block font-medium">Courses &amp; Batches</span>
              <span className="text-xl font-black text-white">{enrolledCourses.length} Enrolled</span>
            </div>
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/15">
              <span className="text-[11px] text-blue-200 block font-medium">Mock Test Packages</span>
              <span className="text-xl font-black text-amber-300">
                {enrolledMockSeriesList.length} Series ({enrolledMockTests.length} Tests)
              </span>
            </div>
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/15">
              <span className="text-[11px] text-blue-200 block font-medium">Current Affairs Series</span>
              <span className="text-xl font-black text-emerald-300">
                {hasActiveCaSubscription ? 'Active Pass' : isCaExpired ? 'Expired' : 'Not Enrolled'}
              </span>
            </div>
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/15">
              <span className="text-[11px] text-blue-200 block font-medium">Study Notes (PDFs)</span>
              <span className="text-xl font-black text-sky-200">
                {unlockedStudyMaterials.length} Unlocked
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== PENDING ADMIN VERIFICATION ALERT ==================== */}
      {pendingPayments.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-amber-950">
                    Enrolment Application Awaiting Verification ({pendingPayments.length})
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                    Under Review
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-0.5">
                  Your payment reference (UTR) has been securely received. Once approved by the Academy administrator, your programme or series will automatically unlock right here.
                </p>
              </div>
            </div>
            <a
              href="tel:7005929189"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 self-start sm:self-auto transition-colors"
            >
              <span>Admissions Desk: +91 70059 29189</span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {pendingPayments.map((p) => {
              const courseObj = db.courses.find((c) => c.id === p.courseId);
              const seriesObj = db.mockSeries.find((s) => s.id === p.courseId);
              const itemName =
                p.courseName ||
                courseObj?.name ||
                seriesObj?.name ||
                (p.courseId === 'series-current-affairs'
                  ? 'Current Affairs Series (Monthly/Yearly Pass)'
                  : p.courseId);

              return (
                <div
                  key={p.id}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl border border-amber-200 p-4 space-y-2 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="text-xs font-extrabold text-slate-900 line-clamp-1">
                        {itemName}
                      </span>
                    </div>
                    <span className="text-xs font-black text-amber-700 shrink-0">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-amber-50/60 p-2.5 rounded-xl border border-amber-100">
                    <div>
                      <span className="text-slate-500 block">Bank Ref / UTR:</span>
                      <span className="font-mono font-bold text-slate-900">{p.utr || p.receiptNo}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Submitted On:</span>
                      <span className="font-medium text-slate-700">{p.date || 'Today'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== COMPREHENSIVE TAB NAVIGATION ==================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-center p-1 rounded-2xl bg-slate-100 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#0056b3] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Enrolled Items ({totalEnrolledCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'courses'
                ? 'bg-[#0056b3] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Courses &amp; Batches ({enrolledCourses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tests')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tests'
                ? 'bg-[#0056b3] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Mock Test Series ({enrolledMockSeriesList.length} Series • {enrolledMockTests.length} Tests)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('current_affairs')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'current_affairs'
                ? 'bg-[#ea580c] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Current Affairs Series {hasActiveCaSubscription ? '(Active)' : '(Locked)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('materials')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'materials'
                ? 'bg-[#0056b3] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Study Notes ({unlockedStudyMaterials.length})</span>
          </button>
        </div>

        <Link
          href="/student/courses"
          className="text-xs font-bold text-[#0056b3] hover:underline inline-flex items-center gap-1"
        >
          <span>+ Enrol in More Courses &amp; Tests</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* ==================== 1. ENROLLED COURSES & BATCHES ==================== */}
      {(activeTab === 'all' || activeTab === 'courses') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-[#0a0e2a] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#0056b3]" />
                <span>Enrolled Classroom &amp; Online Courses</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Join live online video classes or view offline classroom venue and batch timings.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {enrolledCourses.length} Course{enrolledCourses.length === 1 ? '' : 's'}
            </span>
          </div>

          {enrolledCourses.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center max-w-md mx-auto space-y-3">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900">No Courses Enrolled Yet</h3>
              <p className="text-xs text-slate-500">
                You have not enrolled in any classroom batches yet. Explore our course catalogue to join online or offline batches.
              </p>
              <Link
                href="/student/courses"
                className="inline-block px-4 py-2.5 rounded-xl bg-[#0056b3] text-white text-xs font-bold"
              >
                Browse Course Catalogue
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {enrolledCourses.map((enr) => {
                const fullCourse = db.courses.find((c) => c.id === enr.courseId);
                const isOnline = fullCourse?.mode === 'Online';
                const courseMaterials = (db.studyMaterials || []).filter((m) => m.courseId === enr.courseId);
                const courseTests = (db.mockTests || []).filter((t) => t.courseId === enr.courseId);
                const isExpired = Boolean(
                  enr.accessValidUntil && new Date(enr.accessValidUntil).getTime() < currentTime
                );

                return (
                  <div
                    key={enr.courseId}
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between"
                  >
                    <div className="h-2 bg-gradient-to-r from-[#0056b3] to-[#ea580c]" />
                    <div className="p-6 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-3 py-1 rounded-full bg-blue-50 text-[#0056b3] border border-blue-200 text-xs font-extrabold">
                            {fullCourse?.batchName || enr.batchName}
                          </span>
                          {fullCourse?.isPackageBundle && (
                            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold inline-flex items-center gap-1">
                              <Layers className="w-3 h-3" /> Combined Package
                            </span>
                          )}
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                            isOnline
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isOnline ? (
                            <>
                              <Video className="w-3.5 h-3.5" /> Online Live Class
                            </>
                          ) : (
                            <>
                              <MapPin className="w-3.5 h-3.5" /> Offline Center Batch
                            </>
                          )}
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-[#0a0e2a]">{fullCourse?.name || enr.courseName}</h3>

                      <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Assigned Faculty</span>
                          <span className="font-bold text-slate-900">{fullCourse?.facultyName || enr.facultyName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Class Timing</span>
                          <span className="font-bold text-slate-900">
                            {fullCourse?.schedule || 'Mon–Sat Regular'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className="text-slate-600">Syllabus Progress</span>
                          <span className="text-[#0056b3]">{enr.progress}% Completed</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-[#0056b3] rounded-full"
                            style={{ width: `${enr.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Access Validity Badge */}
                      <div className="flex items-center justify-between text-xs p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#0056b3]" /> Access Validity:
                        </span>
                        {isExpired ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold border border-red-200">
                            Expired on {new Date(enr.accessValidUntil!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        ) : enr.accessValidUntil ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold border border-blue-200">
                            Active till {new Date(enr.accessValidUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                            Active Full Batch Access
                          </span>
                        )}
                      </div>

                      {/* Combined Package Bundle Notice if applicable */}
                      {fullCourse?.isPackageBundle && ((fullCourse.bundledMaterialIds && fullCourse.bundledMaterialIds.length > 0) || (fullCourse.bundledTestIds && fullCourse.bundledTestIds.length > 0)) && (
                        <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200 text-xs space-y-1.5">
                          <div className="flex items-center justify-between font-extrabold text-purple-900">
                            <span className="flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-purple-600" />
                              <span>Combined Package Inclusions</span>
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-purple-200/80 text-purple-800 text-[10px]">
                              Unlocked
                            </span>
                          </div>
                          <p className="text-[11px] text-purple-800 leading-relaxed">
                            Your enrollment automatically unlocks {fullCourse.bundledMaterialIds?.length || 0} full study material booklets and {fullCourse.bundledTestIds?.length || 0} CBT mock tests in your learning library below.
                          </p>
                        </div>
                      )}

                      <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-[#0056b3]">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> Classroom Joining Notice
                          </span>
                          <span className="text-[11px] text-slate-500 font-normal">
                            Enrolled: {enr.enrolledDate}
                          </span>
                        </div>

                        {isOnline ? (
                          <div className="space-y-2">
                            {fullCourse?.onlineClassLink ? (
                              <>
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Live Lecture Link Available
                                  </span>
                                </div>
                                <p className="text-xs text-slate-700 leading-relaxed">
                                  Faculty has shared the live lecture meeting room. Click below to enter the live class:
                                </p>
                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                  <a
                                    href={fullCourse.onlineClassLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                                  >
                                    <Video className="w-3.5 h-3.5" />
                                    <span>Join Live Online Class</span>
                                    <ExternalLink className="w-3 h-3 ml-1" />
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(fullCourse.onlineClassLink!);
                                      showToast('Link Copied!', 'Live class meeting URL copied to clipboard.', 'success');
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                                    title="Copy meeting URL"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy Link</span>
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200/90 text-amber-900 text-xs space-y-1">
                                <p className="font-bold flex items-center gap-1.5 text-amber-900">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span>Live Class Link Pending</span>
                                </p>
                                <p className="text-[11px] text-amber-800 leading-relaxed">
                                  The academy faculty will share the Google Meet / Zoom meeting link before the scheduled class time. Please check back shortly before lecture time.
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-700 space-y-1">
                            <p className="font-semibold text-slate-900 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-[#ea580c]" />
                              <span>Venue: C.G.A Main Campus, Udaipur Center (Near Jagannath Dighi Road, Udaipur, Tripura 799120)</span>
                            </p>
                            <p className="text-slate-500 text-[11px]">
                              Batch: {fullCourse?.batchName || enr.batchName} • Timing: {fullCourse?.schedule || 'Mon–Sat Regular'} • Physical booklets can be collected at the administrative counter.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
                      <Link
                        href={`/student/materials?course=${enr.courseId}`}
                        className="text-[#0056b3] hover:underline flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" /> Batch Notes ({courseMaterials.length + (fullCourse?.bundledMaterialIds?.length || 0)})
                      </Link>
                      <Link
                        href={`/student/tests?courseId=${enr.courseId}`}
                        className="text-[#ea580c] hover:underline flex items-center gap-1.5"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" /> Mock Tests ({courseTests.length + (fullCourse?.bundledTestIds?.length || 0)}) →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ==================== 2. CURRENT AFFAIRS SERIES (DOMESTIC & INTERNATIONAL) ==================== */}
      {(activeTab === 'all' || activeTab === 'current_affairs') && (
        <section className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-[#0a0e2a] flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#ea580c]" />
                <span>Current Affairs Series (Domestic &amp; International)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Daily and weekly capsules for Tripura TET, STGT, TPSC, and Banking exams. Access to Google Drive PDFs requires an active series enrollment.
              </p>
            </div>

            {hasActiveCaSubscription && (
              <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Category:
                </span>
                {(['All', 'Domestic', 'International'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCaCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      caCategoryFilter === cat
                        ? 'bg-[#ea580c] text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active Subscription Banner or Subscription Required Blocker */}
          {hasActiveCaSubscription ? (
            <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider bg-emerald-200/80 text-emerald-900 px-2.5 py-0.5 rounded-full">
                      Active Series Pass
                    </span>
                    <span className="text-xs font-bold text-emerald-800">
                      All Domestic &amp; International PDFs Unlocked
                    </span>
                  </div>
                  <p className="text-xs text-emerald-900 font-semibold mt-0.5">
                    {caEnrollment?.accessValidUntil
                      ? `Access valid till ${new Date(caEnrollment.accessValidUntil).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })} (Auto-expiring upon completion)`
                      : 'Active Unlimited Access'}
                  </p>
                </div>
              </div>
              <Link
                href="/student/materials?tab=current_affairs"
                className="text-xs font-bold text-emerald-800 bg-white px-3 py-2 rounded-xl border border-emerald-200 shadow-2xs self-stretch sm:self-auto text-center hover:bg-emerald-50"
              >
                Open Full Desk →
              </Link>
            </div>
          ) : (
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-white border-2 border-orange-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider bg-[#ea580c] text-white px-2.5 py-0.5 rounded-full">
                      Enrolment Required
                    </span>
                    {isCaExpired && (
                      <span className="text-[11px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                        Previous Subscription Expired
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-[#0a0e2a] mt-1">
                    Subscribe to Current Affairs Series to Unlock Drive PDFs
                  </h3>
                  <p className="text-xs text-slate-600">
                    Students must be enrolled in Current Affairs to access the Google Drive links and PDF capsules. Choose your plan below:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="bg-white rounded-2xl border-2 border-orange-300 p-4.5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                        1-Month Series (30 Days)
                      </span>
                      <strong className="text-xl font-black text-[#ea580c]">₹49</strong>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed mb-3">
                      Get <strong>30 days access</strong> to all domestic &amp; international current affairs updates. Access auto-expires after 30 days.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPayTarget({
                        itemType: 'mock_series',
                        itemId: 'series-current-affairs',
                        title: 'Current Affairs Series (1-Month Pass)',
                        fullAmount: 49,
                        paymentType: 'full',
                        category: 'Current Affairs & GK Series',
                      })
                    }
                    className="w-full py-2.5 px-3 rounded-xl bg-[#ea580c] hover:bg-orange-700 text-white font-extrabold text-xs shadow-xs cursor-pointer inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Subscribe for ₹49 (1 Month)</span>
                  </button>
                </div>

                <div className="bg-white rounded-2xl border-2 border-blue-400 p-4.5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                          1-Year Series (365 Days)
                        </span>
                        <span className="text-[10px] font-black bg-blue-100 text-[#0056b3] px-2 py-0.5 rounded-full">
                          Best Value
                        </span>
                      </div>
                      <strong className="text-xl font-black text-[#0056b3]">₹499</strong>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed mb-3">
                      Complete <strong>365 days access</strong> for uninterrupted competitive exam preparation across all upcoming batches.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPayTarget({
                        itemType: 'mock_series',
                        itemId: 'series-current-affairs',
                        title: 'Current Affairs Series (1-Year Pass)',
                        fullAmount: 499,
                        paymentType: 'full',
                        category: 'Current Affairs & GK Series',
                      })
                    }
                    className="w-full py-2.5 px-3 rounded-xl bg-[#0056b3] hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs cursor-pointer inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Subscribe for ₹499 (1 Year)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Current Affairs Cards Grid */}
          {hasActiveCaSubscription && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-1">
              {filteredCurrentAffairs.map((ca) => {
                const category = ca.caCategory || 'Domestic';
                return (
                  <div
                    key={ca.id}
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between cga-card-hover"
                  >
                    <div>
                      <div
                        className={`h-1.5 w-full ${
                          category === 'Domestic' ? 'bg-emerald-600' : 'bg-indigo-600'
                        }`}
                      />
                      <div className="p-6 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                              category === 'Domestic'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}
                          >
                            {category === 'Domestic' ? (
                              <Landmark className="w-3 h-3" />
                            ) : (
                              <Globe className="w-3 h-3" />
                            )}
                            {category}
                          </span>

                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Unlock className="w-3 h-3" /> Unlocked
                          </span>
                        </div>

                        <div className="text-[11px] font-extrabold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100 line-clamp-1 inline-block">
                          {ca.subject || 'All Competitive Exams'}
                        </div>

                        <h3 className="text-base font-extrabold text-[#0a0e2a] leading-snug">
                          {ca.title}
                        </h3>

                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                          {ca.description}
                        </p>

                        <div className="pt-2 flex items-center justify-between text-[11px] font-semibold text-slate-400 border-t border-slate-100">
                          <span>{ca.author}</span>
                          <span>Published: {ca.uploadedDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80">
                      {ca.driveLink ? (
                        <div className="flex items-center gap-2">
                          <a
                            href={ca.driveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2.5 px-3 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Open Drive PDF
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopyCaLink(ca.id, ca.driveLink)}
                            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                            title="Copy Drive PDF Link"
                          >
                            {copiedCaId === ca.id ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic block text-center">
                          Drive link pending publication
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ==================== 3. ENROLLED MOCK TEST PACKAGES & CBT TESTS ==================== */}
      {(activeTab === 'all' || activeTab === 'tests') && (
        <section className="space-y-6 pt-2">
          {/* Subsection 3A: Enrolled Mock Test Packages / Series */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-[#0a0e2a] flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-[#ea580c]" />
                  <span>My Enrolled Mock Test Series Packages</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official mock test packages unlocked for your account. Sectional papers and full mock exams appear below.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {enrolledMockSeriesList.length} Series Package{enrolledMockSeriesList.length === 1 ? '' : 's'}
              </span>
            </div>

            {enrolledMockSeriesList.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {enrolledMockSeriesList.map((series) => (
                  <div
                    key={series.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-orange-50 text-[#ea580c] border border-orange-200">
                          {series.batchLabel || series.stream || 'Mock Series'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Enrolled &amp; Active
                        </span>
                      </div>
                      <h3 className="text-sm font-extrabold text-[#0a0e2a] mt-2 leading-snug">
                        {series.name}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                        {series.description || 'Complete online CBT test series with detailed solutions.'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-500">₹{series.price}/- Package</span>
                      <Link
                        href={`/student/tests?seriesId=${series.id}`}
                        className="text-[#0056b3] font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <span>Launch CBT Arena</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subsection 3B: Individual Mock Tests & Papers */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-[#0a0e2a]">
                  Scheduled CBT Exams &amp; Question Papers ({enrolledMockTests.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Appear for published computer-based tests or download question paper Drive links.
                </p>
              </div>

              {/* Sub-Filters */}
              <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Filter:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedSeriesFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedSeriesFilter === 'all'
                      ? 'bg-[#0056b3] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({enrolledMockTests.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSeriesFilter('p1')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedSeriesFilter === 'p1'
                      ? 'bg-[#0056b3] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Paper-I
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSeriesFilter('p2sci')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedSeriesFilter === 'p2sci'
                      ? 'bg-[#0056b3] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Paper-II (Sci)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSeriesFilter('p2soc')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedSeriesFilter === 'p2soc'
                      ? 'bg-[#0056b3] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Paper-II (Social)
                </button>
              </div>
            </div>

            {filteredTests.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center max-w-md mx-auto space-y-3">
                <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-extrabold text-slate-900">
                  No Mock Tests Found in This Category
                </h3>
                <p className="text-xs text-slate-500">
                  New question papers scheduled by the Academy will appear here. Enrol in a mock series package to get immediate access.
                </p>
                <Link
                  href="/student/tests"
                  className="inline-block px-4 py-2.5 rounded-xl bg-[#0056b3] text-white text-xs font-bold"
                >
                  Explore Mock Test Arena
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredTests.map((test) => {
                  const pastAttempts = studentAttempts.filter(
                    (a) => a.testId === test.id && Boolean(a.submittedAt || (a as any).submitted_at)
                  );
                  const attemptsUsed = pastAttempts.length;
                  const maxAttempts = Number(test.attemptsAllowed || (test as any).attempts_allowed || 1);
                  const canRetake = attemptsUsed > 0 && attemptsUsed < maxAttempts;
                  const latestAttempt =
                    pastAttempts[pastAttempts.length - 1] || studentAttempts.find((a) => a.testId === test.id);
                  const isPublished = ['published', 'launched', 'ready'].includes(
                    String(test.status || '').toLowerCase()
                  );
                  const hasDriveLink = !!test.driveLink && test.driveLink.trim().length > 0;

                  return (
                    <div
                      key={test.id}
                      className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between"
                    >
                      <div className="p-6 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-extrabold border border-slate-200">
                            {test.batchName}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {isPublished ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Published by Academy
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                                <Lock className="w-3.5 h-3.5" /> Not Published by Academy
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
                            <span>{test.subject || 'All Subjects'}</span>
                            <span>•</span>
                            <span>{test.courseName}</span>
                          </div>
                          <h3 className="text-base font-extrabold text-[#0a0e2a] leading-snug">
                            {test.title}
                          </h3>
                        </div>

                        <div className="grid grid-cols-4 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center text-xs">
                          <div>
                            <span className="text-slate-400 text-[10px] block">Duration</span>
                            <span className="font-extrabold text-slate-900">
                              {test.durationMinutes} Mins
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">Total Marks</span>
                            <span className="font-extrabold text-[#0056b3]">
                              {test.totalMarks} Marks
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">Questions</span>
                            <span className="font-extrabold text-slate-900">
                              {test.questions?.length || 0} MCQs
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">Attempts</span>
                            <span className="font-extrabold text-blue-700">
                              {maxAttempts} Allowed
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#0056b3]" />
                            <span>Exam Date: {test.scheduledDate || 'Flexible CBT'}</span>
                          </span>
                          <span className="text-[11px] font-medium text-slate-400">
                            Negative: -{test.negativeMarking} per wrong
                          </span>
                        </div>

                        {/* CBT Attempt Action */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                              <ClipboardCheck className="w-4 h-4 text-[#0056b3]" />
                              <span>1. Computer-Based Online Test (CBT)</span>
                            </span>
                            {latestAttempt && (
                              <span className="text-xs font-black text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                                Score: {latestAttempt.score}/{latestAttempt.totalMarks} ({latestAttempt.accuracy}%)
                              </span>
                            )}
                          </div>

                          {isPublished ? (
                            <div className="space-y-2">
                              {attemptsUsed === 0 && (
                                <>
                                  <p className="text-xs text-slate-600">
                                    This mock test is live. Enrolled students can begin now ({maxAttempts} attempt{maxAttempts > 1 ? 's' : ''} permitted).
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => router.push(`/student/tests?testId=${test.id}`)}
                                    className="w-full py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                    <span>Appear for Test Now</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              {canRetake && (
                                <>
                                  <p className="text-xs text-slate-600">
                                    You have used {attemptsUsed} of {maxAttempts} allowed attempt(s). You can retake this mock exam to improve your performance or review your previous scorecard.
                                  </p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <button
                                      type="button"
                                      onClick={() => router.push(`/student/tests?testId=${test.id}&retake=true`)}
                                      className="w-full py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                      <span>Retake ({attemptsUsed + 1}/{maxAttempts})</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => router.push(`/student/tests?testId=${test.id}`)}
                                      className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                                      <span>Scorecard &amp; Solutions</span>
                                    </button>
                                  </div>
                                </>
                              )}

                              {attemptsUsed >= maxAttempts && attemptsUsed > 0 && (
                                <>
                                  <p className="text-xs text-slate-600">
                                    All {maxAttempts} permitted attempt(s) completed. You can view your scorecard and solutions below.
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => router.push(`/student/tests?testId=${test.id}`)}
                                    className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>View Results &amp; Solutions ({attemptsUsed}/{maxAttempts} Used)</span>
                                  </button>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-xs text-slate-500">
                                The administrator has not launched this test yet. The attempt link will activate once published by the Academy.
                              </p>
                              <button
                                type="button"
                                disabled
                                className="w-full py-2.5 rounded-xl bg-slate-200 text-slate-400 text-xs font-bold cursor-not-allowed flex items-center justify-center gap-1.5"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span>Not Published by Academy</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Question Paper Drive Link */}
                        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                              <FileText className="w-4 h-4 text-[#ea580c]" />
                              <span>2. Question Paper (Google Drive Link)</span>
                            </span>
                            {hasDriveLink ? (
                              <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                Link Published
                              </span>
                            ) : (
                              <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                Pending Publish
                              </span>
                            )}
                          </div>

                          {hasDriveLink ? (
                            <div className="space-y-2">
                              <p className="text-xs text-amber-900">
                                Official question paper is available on Google Drive. Open or copy the link below:
                              </p>
                              <div className="flex items-center gap-2">
                                <a
                                  href={test.driveLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold text-center inline-flex items-center justify-center gap-1.5 shadow-2xs"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>View Question Paper</span>
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleCopyLink(test)}
                                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Copy className="w-3.5 h-3.5 text-[#0056b3]" />
                                  <span>{copiedLinkTestId === test.id ? 'Copied' : 'Copy'}</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-xs text-amber-900/80">
                                The administrator has not attached the Drive link for this question paper yet.
                              </p>
                              <button
                                type="button"
                                disabled
                                className="w-full py-2 rounded-xl bg-slate-200 text-slate-400 text-xs font-bold cursor-not-allowed inline-flex items-center justify-center gap-1.5"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span>Drive Paper (Pending Publication)</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>C.G.A Exam Engine • Udaipur, Tripura</span>
                        <span className="font-bold text-slate-700">{test.batchName}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ==================== 4. DIGITAL STUDY MATERIALS & CHAPTER NOTES ==================== */}
      {(activeTab === 'all' || activeTab === 'materials') && (
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-[#0a0e2a] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#0056b3]" />
                <span>My Unlocked Study Notes &amp; Softcopies</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Chapter notes and reference booklets unlocked for your enrolled batches and purchased modules.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {unlockedStudyMaterials.length} Note{unlockedStudyMaterials.length === 1 ? '' : 's'}
            </span>
          </div>

          {unlockedStudyMaterials.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center max-w-md mx-auto space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900">No Study Materials Unlocked Yet</h3>
              <p className="text-xs text-slate-500">
                You do not have any unlocked study materials yet. Enrol in a course or unlock individual notes in the Study Materials Library.
              </p>
              <Link
                href="/student/materials"
                className="inline-block px-4 py-2.5 rounded-xl bg-[#0056b3] text-white text-xs font-bold"
              >
                Go to Study Materials Desk
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {unlockedStudyMaterials.map((mat) => (
                <div
                  key={mat.id}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between cga-card-hover"
                >
                  <div>
                    <div className="h-1.5 w-full bg-[#0056b3]" />
                    <div className="p-6 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-[#0056b3] border border-blue-200">
                          {mat.type}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                          <Unlock className="w-3 h-3" /> Unlocked
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                        <span className="font-extrabold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100 line-clamp-1">
                          {mat.subject || 'All Competitive Exams'}
                        </span>
                        <span className="font-extrabold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {mat.price === 0 ? 'FREE' : `₹${mat.price || 199}/-`}
                        </span>
                      </div>

                      <p className="text-[11px] font-bold text-[#0056b3] uppercase tracking-wider line-clamp-1">
                        {mat.courseName}
                      </p>

                      <h3 className="text-base font-extrabold text-[#0a0e2a] leading-snug">
                        {mat.title}
                      </h3>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {mat.description}
                      </p>

                      <div className="pt-2 flex items-center justify-between text-[11px] font-semibold text-slate-400 border-t border-slate-100">
                        <span>By {mat.author}</span>
                        <span>{mat.pages} Pages</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80">
                    <div className="flex items-center gap-2">
                      {mat.driveLink && (
                        <a
                          href={mat.driveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2.5 px-3 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Open Drive PDF
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setViewingMaterial(mat)}
                        className={`${
                          mat.driveLink ? 'px-3' : 'w-full'
                        } py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors`}
                      >
                        <Eye className="w-3.5 h-3.5" /> Read Online
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ==================== IN-BROWSER VIEW-ONLY PDF VIEWER MODAL ==================== */}
      {viewingMaterial && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 select-none"
          role="dialog"
          aria-modal="true"
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#0a0e2a] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-amber-300 shrink-0" />
                <div>
                  <h3 className="text-sm font-extrabold line-clamp-1">{viewingMaterial.title}</h3>
                  <p className="text-[11px] text-blue-200">
                    {viewingMaterial.courseName} • By {viewingMaterial.author}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {viewingMaterial.driveLink && (
                  <a
                    href={viewingMaterial.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold inline-flex items-center gap-1"
                    title="Open in Google Drive"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="hidden sm:inline">Open Drive</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setViewingMaterial(null)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-slate-50">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Official C.G.A Course Material
                  </span>
                  <span className="text-xs font-black text-[#ea580c] bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    {viewingMaterial.pages} Pages
                  </span>
                </div>
                <h2 className="text-xl font-black text-[#0a0e2a]">{viewingMaterial.title}</h2>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {viewingMaterial.description}
                </p>

                {viewingMaterial.driveLink && (
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-xs text-blue-900 font-bold">
                      Complete PDF document is hosted on official Google Drive.
                    </span>
                    <a
                      href={viewingMaterial.driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-[#0056b3] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Document in New Tab</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingMaterial(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MANUAL PAYMENT MODAL FOR IN-APP SUBSCRIPTION ==================== */}
      {payTarget && (
        <PayManualModal
          target={payTarget}
          onClose={() => setPayTarget(null)}
          onSuccess={() => {
            setPayTarget(null);
            showToast('Application Submitted', 'Your payment reference was submitted for review.', 'success');
          }}
        />
      )}
    </div>
  );
}
