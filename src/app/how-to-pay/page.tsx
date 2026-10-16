'use client';

import React from 'react';
import Link from 'next/link';
import { HelpCircle, ArrowLeft, ShieldCheck, QrCode } from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { HowToPayGuide } from '@/components/payment/HowToPayGuide';
import { PAYMENT_SETTINGS } from '@/config/paymentSettings';

export default function HowToPayPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <PublicHeader />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Back link & Top Banner */}
          <div className="flex items-center justify-between">
            <Link
              href="/courses"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0056b3] hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Courses &amp; Mock Tests
            </Link>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>Payee:</span>
              <strong className="text-slate-900 font-mono">{PAYMENT_SETTINGS.payeeName}</strong>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8">
            <div className="border-b border-slate-100 pb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#0056b3] text-xs font-bold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-4 h-4" /> Official Bank &amp; UPI Payment Guide
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a0e2a]">
                How to Pay Your Fees &amp; Locate Your 12-Digit UTR
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
                Step-by-step instructions for paying course admissions, study notes, or mock test series to Career Guidance Academy (C.G.A).
              </p>
            </div>

            <HowToPayGuide compact={false} defaultOpen={true} />
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
