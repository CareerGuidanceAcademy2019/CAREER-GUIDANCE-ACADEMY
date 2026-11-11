'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Lock,
  Unlock,
  Eye,
  ShieldCheck,
  X,
  ArrowRight,
  Printer,
  CreditCard,
  Globe,
  Landmark,
  ExternalLink,
  Copy,
  Check,
  BookOpen,
  Bell,
  Tag,
  Sparkles,
  Clock,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { StudyMaterial } from '@/data/initialSeedData';
import { PayManualModal, type PayManualTarget } from '@/components/payment/PayManualModal';

type StudentMaterialTab = 'course_materials' | 'current_affairs';
type CaCategoryFilter = 'All' | 'Domestic' | 'International';

export default function StudentStudyMaterialsPage() {
  const { db, currentStudent, session, showToast } = useCga();
  const [activeTab, setActiveTab] = useState<StudentMaterialTab>('course_materials');
  const [filterType, setFilterType] = useState<'All' | 'Unlocked' | 'Locked'>('All');
  const [caCategoryFilter, setCaCategoryFilter] = useState<CaCategoryFilter>('All');
  const [viewingMaterial, setViewingMaterial] = useState<StudyMaterial | null>(null);
  const [payTarget, setPayTarget] = useState<PayManualTarget | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentTime] = useState(() => Date.now());

  // Separate Course Materials vs Current Affairs
  const rawCourseMaterials = useMemo(
    () =>
      (db.studyMaterials || []).filter(
        (m) => m.type !== 'Current Affairs' && !m.caCategory
      ),
    [db.studyMaterials]
  );

  const rawCurrentAffairs = useMemo(
    () =>
      (db.studyMaterials || []).filter(
        (m) => m.type === 'Current Affairs' || Boolean(m.caCategory)
      ),
    [db.studyMaterials]
  );

  // Dedicated Current Affairs Subscription check
  const caEnrollment = useMemo(() => {
    if (!currentStudent) return null;
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

  // Check if student is enrolled in ANY active course or mock test series
  const isStudentEnrolledAnywhere = useMemo(() => {
    if (!currentStudent) return false;
    const hasActiveCourse = (currentStudent.enrollments || []).some(
      (e) => !e.accessValidUntil || new Date(e.accessValidUntil).getTime() >= currentTime
    );
    const hasActiveSeries = (db.seriesEnrollments || []).some(
      (se) =>
        (se.studentId === currentStudent.id || se.studentId === 'me') &&
        se.seriesId !== 'series-current-affairs' &&
        (!se.accessValidUntil || new Date(se.accessValidUntil).getTime() >= currentTime)
    );
    const hasVerifiedPayment = (db.feePayments || []).some(
      (p) => (p.studentId === currentStudent.id || p.studentId === 'me') && p.status === 'Verified'
    );
    return hasActiveCourse || hasActiveSeries || hasVerifiedPayment;
  }, [currentStudent, db.seriesEnrollments, db.feePayments, currentTime]);

  if (!currentStudent) return null;

  const materialsWithAccess = rawCourseMaterials.map((mat) => {
    // 1. Admin always has full access
    if (session?.role === 'ADMIN') {
      return {
        ...mat,
        isEnrolled: true,
        isPurchased: false,
        isExpired: false,
        isUnlocked: true,
        isPendingVerification: false,
        pendingPaymentRef: undefined,
        validUntil: undefined,
      };
    }

    // 2. Free material check (price === 0 or accessScope === 'all_logged_in')
    const isFree = (mat as any).price === 0 || mat.accessScope === 'all_logged_in';
    if (isFree) {
      return {
        ...mat,
        isEnrolled: false,
        isPurchased: false,
        isExpired: false,
        isUnlocked: true,
        isPendingVerification: false,
        pendingPaymentRef: undefined,
        validUntil: undefined,
      };
    }

    // 3. Check enrollment in parent course batch or bundled package course
    const matchingEnrollment = currentStudent.enrollments.find((e) => {
      if (e.courseId === mat.courseId) return true;
      const crs = db.courses.find((c) => c.id === e.courseId);
      return crs?.bundledMaterialIds && Array.isArray(crs.bundledMaterialIds) && crs.bundledMaterialIds.includes(mat.id);
    });
    const isCourseEnrolled = Boolean(matchingEnrollment);
    const isCourseExpired = Boolean(
      matchingEnrollment?.accessValidUntil &&
        new Date(matchingEnrollment.accessValidUntil).getTime() < currentTime
    );

    // 4. Check direct purchase in verified fee payments
    const studentMatches = (stId?: string) =>
      stId === currentStudent.id ||
      stId === 'me' ||
      (currentStudent.phone && stId === currentStudent.phone) ||
      (currentStudent.email && stId === currentStudent.email);

    const verifiedPayment = (db.feePayments || []).find(
      (p) =>
        studentMatches(p.studentId) &&
        p.status === 'Verified' &&
        ((p as any).itemId === mat.id || p.courseId === mat.id || (p.remarks && p.remarks.includes(mat.id)))
    );

    let hasLocalAccess = false;
    let localVerified = false;
    let localPending = false;
    let localPendingRef = '';

    if (typeof window !== 'undefined') {
      try {
        const maList = JSON.parse(localStorage.getItem('cga_material_access') || '[]');
        hasLocalAccess = maList.some(
          (m: any) => studentMatches(m.studentId) && m.materialId === mat.id
        );

        const customP = JSON.parse(localStorage.getItem('cga_custom_payments') || '[]');
        const localP = customP.find(
          (p: any) =>
            studentMatches(p.studentId) &&
            (p.itemId === mat.id || p.courseId === mat.id || (p.remarks && p.remarks.includes(mat.id)))
        );
        if (localP) {
          if (localP.status === 'Verified') localVerified = true;
          if (localP.status === 'Pending') {
            localPending = true;
            localPendingRef = localP.receiptNo || localP.utr || 'Pending';
          }
        }
      } catch {}
    }

    const isPurchased = Boolean(verifiedPayment || hasLocalAccess || localVerified);

    // 5. Check pending payment awaiting admin verification
    const pendingPayment = (db.feePayments || []).find(
      (p) =>
        studentMatches(p.studentId) &&
        p.status === 'Pending' &&
        ((p as any).itemId === mat.id || p.courseId === mat.id || (p.remarks && p.remarks.includes(mat.id)))
    );

    const isUnlocked = (isCourseEnrolled && !isCourseExpired) || isPurchased;
    const isExpired = isCourseEnrolled && isCourseExpired && !isPurchased;
    const isPendingVerification = !isUnlocked && Boolean(pendingPayment || localPending);
    const pendingPaymentRef = pendingPayment?.receiptNo || pendingPayment?.utr || localPendingRef;

    return {
      ...mat,
      isEnrolled: isCourseEnrolled,
      isPurchased,
      isExpired,
      isUnlocked,
      isPendingVerification,
      pendingPaymentRef,
      validUntil: matchingEnrollment?.accessValidUntil,
    };
  });

  const filtered = materialsWithAccess.filter((m) => {
    if (filterType === 'Unlocked') return m.isUnlocked;
    if (filterType === 'Locked') return !m.isUnlocked;
    return true;
  });

  const filteredCurrentAffairs = rawCurrentAffairs.filter((ca) => {
    if (caCategoryFilter === 'All') return true;
    return (ca.caCategory || 'Domestic') === caCategoryFilter;
  });

  const handleCopyDriveLink = (id: string, link?: string) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    showToast('Drive Link Copied', 'Current Affairs PDF link copied to clipboard.', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a0e2a]">
            Digital Study Materials &amp; Current Affairs Library
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Access chapter notes for your enrolled batches and stay updated with Domestic &amp;
            International Current Affairs PDFs.
          </p>
        </div>

        {/* Access Filter (when on Course Materials tab) */}
        {activeTab === 'course_materials' && (
          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 self-start">
            {(['All', 'Unlocked', 'Locked'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterType(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  filterType === tab
                    ? 'bg-[#0056b3] text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Subsection Switcher Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 flex flex-wrap items-center gap-2 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('course_materials')}
          className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeTab === 'course_materials'
              ? 'bg-[#0056b3] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Course Study Materials &amp; Notes</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
              activeTab === 'course_materials'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {rawCourseMaterials.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('current_affairs')}
          className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeTab === 'current_affairs'
              ? 'bg-[#ea580c] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Current Affairs (Domestic &amp; International)</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
              activeTab === 'current_affairs'
                ? 'bg-white/20 text-white'
                : 'bg-orange-50 text-[#ea580c]'
            }`}
          >
            {rawCurrentAffairs.length}
          </span>
        </button>
      </div>

      {/* ==================== SUBSECTION 1: COURSE STUDY MATERIALS ==================== */}
      {activeTab === 'course_materials' && (
        <div className="space-y-6">
          {/* Strict Policy Banner */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-amber-50 border border-blue-200 rounded-2xl p-4.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#0056b3] text-white shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#0a0e2a] uppercase tracking-wider">
                  Study Material Delivery &amp; Usage Policy
                </h4>
                <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
                  <strong className="text-[#0056b3]">Offline Batches:</strong> Students receive
                  physical printed notes &amp; booklet handouts at the Udaipur center.{' '}
                  <span className="mx-1">•</span>
                  <strong className="text-slate-900">Digital Softcopies:</strong> Available in
                  secure <em>View-Only Reader</em> mode in the browser. Downloading, copying, or
                  exporting softcopies is strictly restricted to Academy Administrators.
                </p>
              </div>
            </div>
          </div>

          {/* Materials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((mat) => (
              <div
                key={mat.id}
                className={`rounded-3xl border overflow-hidden flex flex-col justify-between transition-all ${
                  mat.isUnlocked
                    ? 'bg-white border-slate-200 shadow-xs cga-card-hover'
                    : 'bg-slate-50/90 border-slate-200/80 opacity-95'
                }`}
              >
                <div>
                  <div
                    className={`h-1.5 w-full ${
                      mat.isUnlocked ? 'bg-[#0056b3]' : 'bg-slate-300'
                    }`}
                  />
                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                          mat.type === 'Book PDF'
                            ? 'bg-blue-50 text-[#0056b3] border border-blue-200'
                            : 'bg-amber-50 text-[#ea580c] border border-amber-200'
                        }`}
                      >
                        {mat.type}
                      </span>

                      {mat.isUnlocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                          <Unlock className="w-3 h-3" /> Unlocked
                        </span>
                      ) : mat.isPendingVerification ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-bold">
                          <Clock className="w-3 h-3 text-amber-600" /> Verification Pending
                        </span>
                      ) : mat.isExpired ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-[#dc2626] border border-red-200 text-[11px] font-bold">
                          <Lock className="w-3 h-3" /> Access Expired
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-[#ea580c] border border-amber-200 text-[11px] font-bold">
                          <Lock className="w-3 h-3" /> Pay to Unlock
                        </span>
                      )}
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

                    <h2 className="text-base font-extrabold text-[#0a0e2a] leading-snug">
                      {mat.title}
                    </h2>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {mat.description}
                    </p>

                    <div className="pt-2 flex items-center justify-between text-[11px] font-semibold text-slate-400 border-t border-slate-100">
                      <span>By {mat.author}</span>
                      <span>{mat.pages} Pages</span>
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80">
                  {mat.isUnlocked ? (
                    <div className="space-y-2">
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
                      {mat.validUntil ? (
                        <p className="text-[10px] text-center text-slate-500 font-medium">
                          Batch access active till{' '}
                          {new Date(mat.validUntil).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      ) : mat.isPurchased ? (
                        <p className="text-[10px] text-center text-emerald-700 font-bold">
                          ✓ Full Lifetime Access Unlocked (Paid &amp; Verified)
                        </p>
                      ) : null}
                    </div>
                  ) : mat.isPendingVerification ? (
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-[11px] text-amber-900 font-semibold text-center flex items-center justify-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" />
                        <span>Payment Verification Pending{mat.pendingPaymentRef ? ` (Ref: ${mat.pendingPaymentRef})` : ''}</span>
                      </div>
                      <p className="text-[10px] text-center text-slate-500 font-medium">
                        Our administrative desk is verifying your payment UTR. Drive PDF link will unlock immediately after admin approval.
                      </p>
                    </div>
                  ) : mat.isExpired ? (
                    <div className="space-y-2">
                      <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-[11px] text-red-700 font-semibold text-center">
                        Access expired on{' '}
                        {new Date(mat.validUntil!).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <a
                        href="tel:7005929189"
                        className="w-full py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
                      >
                        Contact Admin to Renew
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-700 font-semibold flex items-center justify-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Pay fee to unlock Google Drive PDF</span>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setPayTarget({
                              itemType: 'material',
                              itemId: mat.id,
                              title: `${mat.title} (${mat.courseName || 'Notes PDF'})`,
                              fullAmount: (mat as any).price || 199,
                              paymentType: 'full',
                              category: 'Study Material & Notes',
                            })
                          }
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold cursor-pointer transition-all shadow-2xs flex-1"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> Buy Notes (₹{(mat as any).price || 199})
                        </button>
                        <Link
                          href="/student/courses"
                          className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                        >
                          Enrol Course <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== SUBSECTION 2: CURRENT AFFAIRS ==================== */}
      {activeTab === 'current_affairs' && (
        <div className="space-y-6">
          {/* Current Affairs Banner */}
          <div className="bg-gradient-to-r from-[#0a0e2a] via-[#1e3a8a] to-[#0056b3] rounded-3xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider">
                <Bell className="w-3.5 h-3.5" /> C.G.A Current Affairs Desk
              </div>
              <h2 className="text-xl font-extrabold">
                Domestic &amp; International Current Affairs PDFs
              </h2>
              <p className="text-xs text-blue-100 max-w-2xl">
                Curated Current Affairs capsules for Tripura TET, STGT, TPSC, SSC, and Banking
                examinations. Open or download the shared Google Drive PDF links below.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {(['All', 'Domestic', 'International'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCaCategoryFilter(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                    caCategoryFilter === cat
                      ? 'bg-[#ea580c] text-white shadow-sm'
                      : 'bg-white/10 text-blue-100 hover:bg-white/20'
                  }`}
                >
                  {cat === 'Domestic' && <Landmark className="w-3.5 h-3.5" />}
                  {cat === 'International' && <Globe className="w-3.5 h-3.5" />}
                  <span>{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Current Affairs Subscription Status or Plan Selection */}
          {hasActiveCaSubscription ? (
            <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider bg-emerald-200/80 text-emerald-900 px-2.5 py-0.5 rounded-full">
                      Active Subscription
                    </span>
                    <span className="text-xs font-bold text-emerald-800">
                      Current Affairs Series
                    </span>
                  </div>
                  <p className="text-xs text-emerald-900 font-semibold mt-0.5">
                    {caEnrollment?.accessValidUntil
                      ? `Access valid till ${new Date(caEnrollment.accessValidUntil).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })} (Auto-expiring on completion)`
                      : 'Active Unlimited Access'}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs self-stretch sm:self-auto text-center">
                All PDFs Unlocked
              </span>
            </div>
          ) : (
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-white border-2 border-orange-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider bg-[#ea580c] text-white px-2.5 py-0.5 rounded-full">
                      Subscription Required
                    </span>
                    {isCaExpired && (
                      <span className="text-[11px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                        Previous Plan Expired
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-[#0a0e2a] mt-1">
                    Subscribe to Current Affairs Series (Domestic &amp; International)
                  </h3>
                  <p className="text-xs text-slate-600">
                    Choose your access plan below to unlock all regular Drive PDF capsules. Plans automatically expire upon duration completion.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* 1 Month Plan */}
                <div className="bg-white rounded-2xl border-2 border-orange-300 p-4.5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                        1-Month Series
                      </span>
                      <strong className="text-xl font-black text-[#ea580c]">₹49</strong>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed mb-3">
                      Get <strong>30 days access</strong> to all domestic &amp; international current affairs updates. Access expires automatically after 30 days.
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

                {/* 1 Year Plan */}
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
                      Complete <strong>365 days access</strong> for uninterrupted preparation across all 2026–27 competitive exams and board tests.
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

          {filteredCurrentAffairs.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0056b3] flex items-center justify-center mx-auto">
                <Globe className="w-7 h-7" />
              </div>
              <h3 className="text-base font-extrabold text-[#0a0e2a]">
                No Current Affairs Announcements Found
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                New Domestic and International Current Affairs PDFs announced by the Academy will
                appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCurrentAffairs.map((ca) => {
                const category = ca.caCategory || 'Domestic';
                // Strict rule: access to drive link / PDF requires active Current Affairs subscription or Admin role
                const isUnlockedForStudent = hasActiveCaSubscription || session?.role === 'ADMIN';

                return (
                  <div
                    key={ca.id}
                    className={`rounded-3xl border overflow-hidden flex flex-col justify-between transition-all ${
                      isUnlockedForStudent
                        ? 'bg-white border-slate-200 shadow-xs cga-card-hover'
                        : 'bg-slate-50/90 border-slate-200 opacity-95'
                    }`}
                  >
                    <div>
                      <div
                        className={`h-1.5 w-full ${
                          !isUnlockedForStudent
                            ? 'bg-slate-300'
                            : category === 'Domestic'
                              ? 'bg-emerald-600'
                              : 'bg-indigo-600'
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

                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-orange-100 text-[#ea580c]">
                            Current Affairs Series
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                          <span className="font-extrabold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100 line-clamp-1">
                            {ca.subject || 'All Competitive Exams'}
                          </span>
                          {isUnlockedForStudent ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                              <Unlock className="w-3 h-3" /> Unlocked (Subscribed)
                            </span>
                          ) : isCaExpired ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[11px] font-bold">
                              <Lock className="w-3 h-3" /> Access Expired
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-[#ea580c] border border-amber-200 text-[11px] font-bold">
                              <Lock className="w-3 h-3" /> Enrolment Required
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-extrabold text-[#0a0e2a] leading-snug">
                          {ca.title}
                        </h3>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          {ca.description}
                        </p>

                        <div className="pt-2 flex items-center justify-between text-[11px] font-semibold text-slate-400 border-t border-slate-100">
                          <span>{ca.author}</span>
                          <span>Announced: {ca.uploadedDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80">
                      {isUnlockedForStudent && ca.driveLink ? (
                        <div className="flex items-center gap-2">
                          <a
                            href={ca.driveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2.5 px-3 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Open Current Affairs PDF (Drive)
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopyDriveLink(ca.id, ca.driveLink)}
                            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                            title="Copy Google Drive PDF Link"
                          >
                            {copiedId === ca.id ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-[11px] text-slate-600 font-semibold text-center">
                            {isCaExpired
                              ? `Your subscription expired on ${new Date(caEnrollment!.accessValidUntil!).toLocaleDateString('en-IN')}. Renew to access Drive PDF capsules.`
                              : 'Students must be enrolled in Current Affairs Series to access Drive PDF capsules.'}
                          </p>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setPayTarget({
                                  itemType: 'mock_series',
                                  itemId: 'series-current-affairs',
                                  title: 'Current Affairs Series (Monthly ₹49 / 1-Year ₹499)',
                                  fullAmount: 49,
                                  paymentType: 'full',
                                  category: 'Current Affairs & GK Series',
                                })
                              }
                              className="flex-1 py-2.5 px-3 rounded-xl bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>{isCaExpired ? 'Renew Subscription (from ₹49)' : 'Subscribe to Unlock (from ₹49)'}</span>
                            </button>
                            <Link
                              href="/student/my-learning?tab=current_affairs"
                              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center justify-center gap-1 transition-all"
                            >
                              My Learning <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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
            {/* Viewer Toolbar */}
            <div className="bg-[#0a0e2a] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-amber-300 shrink-0" />
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold line-clamp-1">
                    {viewingMaterial.title}
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    Protected C.G.A Reader • Watermarked for:{' '}
                    <strong>
                      {currentStudent.name} ({currentStudent.studentCode})
                    </strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-slate-200 text-[11px] font-semibold border border-white/10">
                  <Lock className="w-3 h-3 text-amber-400" /> View-Only Mode (Downloads Restricted)
                </span>
                <button
                  type="button"
                  onClick={() => setViewingMaterial(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
                  title="Close Viewer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Offline Notes Guarantee Reminder Bar */}
            <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900">
              <span className="flex items-center gap-1.5 font-medium">
                <Printer className="w-3.5 h-3.5 text-[#ea580c]" />
                Enrolled in an offline batch? You receive printed physical copies of all syllabus
                notes at our Udaipur campus.
              </span>
              <span className="text-[11px] text-slate-500 font-semibold hidden md:inline">
                Right-click &amp; copy disabled
              </span>
            </div>

            {/* Watermarked Document Canvas or Access Barrier */}
            {!materialsWithAccess.find((m) => m.id === viewingMaterial.id)?.isUnlocked ? (
              <div className="flex-1 overflow-y-auto bg-slate-50 p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
                  <Lock className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-[#0a0e2a]">
                    Study Material Access Restricted
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                    This material requires fee payment of ₹{(viewingMaterial as any).price || 199}. Pay the fee to unlock both the in-browser reader and Google Drive PDF.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const mat = viewingMaterial;
                    setViewingMaterial(null);
                    setPayTarget({
                      itemType: 'material',
                      itemId: mat.id,
                      title: `${mat.title} (${mat.courseName || 'Notes PDF'})`,
                      fullAmount: (mat as any).price || 199,
                      paymentType: 'full',
                      category: 'Study Material & Notes',
                    });
                  }}
                  className="px-6 py-3 rounded-2xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-sm cursor-pointer transition-colors"
                >
                  <CreditCard className="w-4 h-4" /> Pay ₹{(viewingMaterial as any).price || 199} to Unlock Notes
                </button>
              </div>
            ) : (
              <div
                className="flex-1 overflow-y-auto bg-slate-200 p-4 sm:p-8 space-y-6 select-none"
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
              >
                {viewingMaterial.previewSections.map((sec, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl shadow-md border border-slate-300 p-8 sm:p-12 max-w-3xl mx-auto relative overflow-hidden"
                  >
                    {/* Diagonal Repeating Student Name Watermark Overlay */}
                    <div className="cga-watermark-overlay absolute inset-0 flex flex-col items-center justify-around -rotate-18 opacity-[0.07] pointer-events-none select-none">
                      {Array.from({ length: 4 }).map((_, wIdx) => (
                        <p
                          key={wIdx}
                          className="text-lg sm:text-xl font-black uppercase tracking-widest text-[#0056b3] whitespace-nowrap"
                        >
                          {currentStudent.name} • {currentStudent.studentCode} • C.G.A UDAIPUR •
                          VIEW-ONLY
                        </p>
                      ))}
                    </div>

                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0056b3]">
                          Career Guidance Academy (C.G.A) • Official Study Material
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">
                          Section {idx + 1} of {viewingMaterial.previewSections.length}
                        </span>
                      </div>

                      <h4 className="text-lg sm:text-xl font-extrabold text-[#0a0e2a]">
                        {sec.heading}
                      </h4>

                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        {sec.body}
                      </p>

                      <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Licensed to: {currentStudent.name}</span>
                        <span>© C.G.A Academic Wing, Udaipur</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {payTarget && (
        <PayManualModal
          onClose={() => setPayTarget(null)}
          target={payTarget}
        />
      )}
    </div>
  );
}
