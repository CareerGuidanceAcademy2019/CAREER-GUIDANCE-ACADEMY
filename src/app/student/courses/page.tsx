'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, CreditCard, ShieldCheck, X, CheckCircle2 } from 'lucide-react';
import { CourseCard } from '@/components/public/CourseCard';
import { ReceiptModal } from '@/components/student/ReceiptModal';
import { PayManualModal, type PayManualTarget } from '@/components/payment/PayManualModal';
import { useCga } from '@/context/CgaContext';
import { Course, CourseCategory, FeePayment } from '@/data/initialSeedData';

const CATEGORIES: ('All' | CourseCategory)[] = [
  'All',
  'Teaching and Recruitment Exams',
  'Banking, SSC and Railway',
  'Other Competitive Examinations',
  'School Coaching',
];

export default function StudentCourseCataloguePage() {
  const searchParams = useSearchParams();
  const { db, currentStudent, enrolInCourse, joinWaitingList, showToast, submitPaymentVerification } = useCga();
  const [category, setCategory] = useState<'All' | CourseCategory>('All');
  const [modeFilter, setModeFilter] = useState<'All' | 'Offline' | 'Online'>('All');
  const [search, setSearch] = useState('');

  // Enrolment Modal state
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [paymentPlan, setPaymentPlan] = useState<'Full Payment' | 'Instalment 1'>('Full Payment');
  const [payManualTarget, setPayManualTarget] = useState<PayManualTarget | null>(null);
  const [generatedReceipt, setGeneratedReceipt] = useState<FeePayment | null>(null);

  useEffect(() => {
    const enrolCourseId = searchParams.get('enrol');
    if (enrolCourseId && !selectedCourse && !payManualTarget) {
      const match = db.courses.find((c) => c.id === enrolCourseId);
      if (match) {
        setSelectedCourse(match);
        setPaymentPlan('Full Payment');
      }
    }
  }, [searchParams, db.courses, selectedCourse, payManualTarget]);

  if (!currentStudent) return null;

  const enrolledIds = currentStudent.enrollments.map((e) => e.courseId);

  const filteredCourses = db.courses.filter((c) => {
    const matchCat = category === 'All' || c.category === category;
    const matchMode = modeFilter === 'All' || c.mode === modeFilter;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.subCategory.toLowerCase().includes(q) ||
      c.facultyName.toLowerCase().includes(q);
    return matchCat && matchMode && matchSearch;
  });

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    setPayManualTarget({
      itemType: 'course',
      itemId: selectedCourse.id,
      title: selectedCourse.name,
      category: selectedCourse.category,
      fullAmount: selectedCourse.price,
      instalmentAmount: selectedCourse.firstInstalment,
      instalmentAvailable: selectedCourse.instalmentAvailable,
      paymentType: paymentPlan === 'Full Payment' ? 'full' : 'instalment_1',
    });
    setSelectedCourse(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0a0e2a]">
          Course Catalogue & Online Enrolment
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Enrol in offline classroom batches (at Udaipur center) or online interactive batches. Offline enrolments receive printed notes at the academy. Digital softcopies are strictly view-only.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
        {/* Mode Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Mode:
            </span>
            <div className="inline-flex p-1 rounded-xl bg-slate-100 gap-1">
              <button
                type="button"
                onClick={() => setModeFilter('All')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  modeFilter === 'All'
                    ? 'bg-[#0056b3] text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Modes
              </button>
              <button
                type="button"
                onClick={() => setModeFilter('Offline')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  modeFilter === 'Offline'
                    ? 'bg-[#0056b3] text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Offline Batches
              </button>
              <button
                type="button"
                onClick={() => setModeFilter('Online')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  modeFilter === 'Online'
                    ? 'bg-[#0056b3] text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Online Batches
              </button>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search course or board..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                category === cat
                  ? 'bg-[#0056b3] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            isEnrolled={enrolledIds.includes(course.id)}
            onSelectCourse={(c) => {
              setSelectedCourse(c);
              setPaymentPlan('Full Payment');
            }}
            onJoinWaitlist={(c) => joinWaitingList(c.id)}
          />
        ))}
      </div>

      {/* Simulated Payment & Enrolment Modal */}
      {selectedCourse && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/65 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="cga-gradient-hero text-white p-6 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  Simulated Enrolment Checkout
                </span>
                <h3 className="text-lg font-extrabold mt-0.5">{selectedCourse.name}</h3>
                <p className="text-xs text-blue-100">
                  Batch: {selectedCourse.batchName} • Faculty: {selectedCourse.facultyName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCourse(null)}
                className="p-1.5 rounded-xl bg-white/10 text-white hover:bg-white/20 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProceedToPayment} className="p-6 space-y-5">
              {/* Choose Payment Plan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  1. Select Fee Payment Plan
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentPlan('Full Payment')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      paymentPlan === 'Full Payment'
                        ? 'border-[#0056b3] bg-blue-50/70 ring-2 ring-[#0056b3]/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-extrabold text-[#0a0e2a] block">
                      Full One-Time Payment
                    </span>
                    <span className="text-lg font-extrabold text-[#0056b3] mt-1 block">
                      ₹{selectedCourse.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-emerald-600 font-semibold">
                      No pending dues
                    </span>
                  </button>

                  {selectedCourse.instalmentAvailable && (
                    <button
                      type="button"
                      onClick={() => setPaymentPlan('Instalment 1')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        paymentPlan === 'Instalment 1'
                          ? 'border-[#0056b3] bg-blue-50/70 ring-2 ring-[#0056b3]/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs font-extrabold text-[#0a0e2a] block">
                        2-Part Instalment Plan
                      </span>
                      <span className="text-lg font-extrabold text-[#ea580c] mt-1 block">
                        ₹{selectedCourse.firstInstalment.toLocaleString('en-IN')}{' '}
                        <span className="text-xs font-semibold text-slate-500">now</span>
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Balance ₹
                        {(selectedCourse.price - selectedCourse.firstInstalment).toLocaleString(
                          'en-IN'
                        )}{' '}
                        later
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Summary Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Payable Amount Now</span>
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Instant UPI / Bank Gateway
                  </span>
                </div>
                <span className="text-2xl font-extrabold text-[#0a0e2a]">
                  ₹
                  {(paymentPlan === 'Full Payment'
                    ? selectedCourse.price
                    : selectedCourse.firstInstalment
                  ).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCourse(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold shadow-md cursor-pointer transition-all"
                >
                  <CreditCard className="w-4 h-4" /> Pay via UPI / Bank & Verify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reusable Manual Payment (UPI / Bank) Flow */}
      {payManualTarget && (
        <PayManualModal
          target={payManualTarget}
          onClose={() => setPayManualTarget(null)}
          onSuccess={(refCode) => {
            showToast(
              'Payment Verification Submitted',
              `Your payment reference ${refCode} has been queued for verification.`,
              'success'
            );
            setPayManualTarget(null);
          }}
        />
      )}

      {/* Official Receipt Modal */}
      <ReceiptModal receipt={generatedReceipt} onClose={() => setGeneratedReceipt(null)} />
    </div>
  );
}
