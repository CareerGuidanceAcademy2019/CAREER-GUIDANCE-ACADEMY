'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ClipboardCheck,
  CheckCircle2,
  Clock,
  Award,
  Users,
  ShieldCheck,
  HelpCircle,
  ArrowRight,
  BookOpen,
  Sparkles,
  Zap,
  Target,
  Flame,
} from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { useCga } from '@/context/CgaContext';
import { PayManualModal, type PayManualTarget } from '@/components/payment/PayManualModal';
import { PAYMENT_SETTINGS } from '@/config/paymentSettings';

export default function MockTestsLandingPage() {
  const router = useRouter();
  const { session, currentStudent, db, showToast } = useCga();
  const [payTarget, setPayTarget] = useState<PayManualTarget | null>(null);

  // Check if student already enrolled in series
  const isEnrolled = Boolean(
    currentStudent &&
      (db.seriesEnrollments?.some(
        (se) => se.studentId === currentStudent.id && se.seriesId === 'ttet-2026'
      ) ||
        (currentStudent as any).seriesEnrolled)
  );

  const primarySeries = db.mockSeries?.[0];
  const displayPrice = primarySeries?.price || 499;
  const seriesTitle = primarySeries?.name || 'T-TET 2026 Mock Test Series (15 Full-Length Mocks)';

  const handleEnrolClick = () => {
    if (!session || !currentStudent) {
      router.push('/login?redirect=/mock-tests');
      return;
    }

    setPayTarget({
      itemType: 'mock_series',
      itemId: primarySeries?.id || 'ttet-2026',
      title: seriesTitle,
      fullAmount: displayPrice,
      paymentType: 'full',
      metadata: {
        exam: 'Tripura Teachers Eligibility Test (T-TET)',
        testsCount: 15,
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="cga-gradient-hero text-white py-16 sm:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(234,88,12,0.18),transparent_50%)]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 text-xs font-extrabold uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-amber-400" /> TRBT Tripura TET 2026 Special
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight">
              Master the T-TET Exam with 15 All-Tripura Standard Mock Tests
            </h1>

            <p className="text-base sm:text-lg text-slate-200 max-w-2xl mx-auto leading-relaxed">
              Curated by TRBT-qualified top rankers and expert science & arts faculty of Career Guidance Academy (C.G.A), Udaipur. Full syllabus simulation, detailed answer keys, and instant ranking.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              {isEnrolled ? (
                <Link
                  href="/student/tests"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-base shadow-xl inline-flex items-center justify-center gap-2 transition-all"
                >
                  <CheckCircle2 className="w-5 h-5" /> Enrolled & Active - Launch Tests
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleEnrolClick}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-black text-base shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 inline-flex items-center justify-center gap-3 transition-all cursor-pointer"
                >
                  <Zap className="w-5 h-5" /> Enrol Now for ₹{displayPrice} Only
                </button>
              )}

              <Link
                href="/how-to-pay"
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm backdrop-blur-sm border border-white/20 inline-flex items-center justify-center gap-2 transition-all"
              >
                <HelpCircle className="w-4 h-4" /> How to Pay via UPI / Bank
              </Link>
            </div>

            <div className="pt-6 flex flex-wrap justify-center gap-8 text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 15 Full Syllabus Tests
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> English & Bengali Solutions
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instant Score & State Percentile
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Official C.G.A Fee Receipt
              </span>
            </div>
          </div>
        </section>

        {/* Pricing & Value Proposition */}
        <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-3">
            {/* Left 2 Cols: Details */}
            <div className="p-8 md:p-10 md:col-span-2 space-y-6">
              <div>
                <span className="text-xs font-extrabold text-[#0056b3] uppercase tracking-wider block">
                  Complete Examination Package
                </span>
                <h2 className="text-2xl font-black text-[#0a0e2a] mt-1">
                  Tripura TET Paper-I & Paper-II Mock Series
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Strictly aligned with TRBT latest exam pattern and syllabus guidelines. Each mock is timed for 150 minutes with 150 marks coverage across Child Development & Pedagogy, Language I, Language II, Mathematics & Science, and Social Studies.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-blue-100 text-[#0056b3] shrink-0">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Exam-Room Simulation</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Section navigation, timer countdown, review flags</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Detailed Explanations</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Step-by-step solutions for pedagogy and math</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Comparative Ranking</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Benchmarking with top academy candidates</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Lifetime Attempt Review</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Re-read question papers & mistake analysis</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Price Box */}
            <div className="p-8 md:p-10 bg-slate-50 border-t md:border-t-0 md:border-l border-slate-200 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  Single Transparent Fee
                </span>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-[#0a0e2a]">₹{displayPrice}</span>
                    <span className="text-sm font-semibold text-slate-400 line-through">₹{Math.max(1499, displayPrice * 2)}</span>
                    <span className="text-xs font-bold text-emerald-600">Save 50%+</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">One-time payment for all 15 tests. No renewal fees.</p>
                </div>

                <ul className="text-xs text-slate-700 space-y-2.5 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Instant activation upon verification</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Pay with GPay, PhonePe, Paytm, BHIM or Bank</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Official academy receipt generated</span>
                  </li>
                </ul>
              </div>

              <div>
                {isEnrolled ? (
                  <Link
                    href="/student/tests"
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs inline-flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    Go to Mock Tests Dashboard <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={handleEnrolClick}
                    className="w-full py-3.5 rounded-2xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white font-extrabold text-xs inline-flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    Enrol for ₹{displayPrice} <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                <p className="text-[10px] text-slate-400 text-center mt-2">
                  Non-refundable once activated. See{' '}
                  <Link href="/refund-policy" className="underline hover:text-slate-600">
                    refund policy
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* PayManualModal for Mock Series */}
      {payTarget && (
        <PayManualModal
          target={payTarget}
          onClose={() => setPayTarget(null)}
          onSuccess={(refCode) => {
            showToast(
              'T-TET Series Payment Submitted',
              `Reference ${refCode} submitted. The test series will unlock automatically upon admin verification.`,
              'success'
            );
            setPayTarget(null);
          }}
        />
      )}

      <PublicFooter />
    </div>
  );
}
