'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Coins,
  ArrowLeft,
  Printer,
  ShieldCheck,
  Receipt,
  Users,
  BookOpen,
  ClipboardCheck,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import { CounterEnrollmentModal } from '@/components/admin/CounterEnrollmentModal';
import { useCga } from '@/context/CgaContext';
import { PAYMENT_SETTINGS } from '@/config/paymentSettings';

export default function CounterEnrollmentPage() {
  const { db } = useCga();
  const [showModal, setShowModal] = useState(true);

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold mb-1">
            <Coins className="w-3.5 h-3.5" /> Physical Desk Admission Terminal
          </div>
          <h1 className="text-2xl font-black text-[#0a0e2a]">
            Counter Cash Collection & Physical Enrolment
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Enrol walk-in candidates, collect cash payments across all sections (Courses, T-TET Mock Series, Study Materials), and immediately print official academy money receipts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/payments"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-2xs transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Online Queue
          </Link>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-extrabold shadow-md cursor-pointer transition-all"
          >
            <Coins className="w-4 h-4" /> Open Enrolment Terminal
          </button>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-2">
          <div className="p-3 rounded-2xl bg-blue-50 text-[#0056b3] w-fit">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-sm">Classroom Batches</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Directly register candidates into offline classroom batches at Udaipur. Decrements available seats and generates official enrolment cards.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-2">
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-700 w-fit">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-sm">T-TET 2026 Mock Series</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Collect ₹499 cash for the 15-Mock series package. Instantly activates the candidate's online test dashboard and offline paper review.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-2">
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 w-fit">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-sm">Study Materials & Notes</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Issue spiral-bound physical study materials at the admissions desk. Automatically marks notes as unlocked in the student's digital portal.
          </p>
        </div>
      </div>

      {/* Counter Modal */}
      {showModal && (
        <CounterEnrollmentModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            // Keep on page
          }}
        />
      )}
    </div>
  );
}
