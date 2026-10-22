'use client';

import React from 'react';
import Link from 'next/link';
import {
  RotateCcw,
  ShieldAlert,
  UserCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  AlertCircle,
  MessageSquare,
  Clock,
} from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { PAYMENT_SETTINGS } from '@/config/paymentSettings';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <PublicHeader />

      <main className="flex-1">
        {/* Header Hero */}
        <section className="cga-gradient-hero text-white py-16 px-4 sm:px-6 lg:px-8 border-b-4 border-[#0056b3]">
          <div className="max-w-4xl mx-auto space-y-4 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <RotateCcw className="w-4 h-4" /> Official Fee & Refund Guidelines
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Fee Cancellation & Refund Policy
            </h1>
            <p className="text-sm sm:text-base text-blue-100 max-w-2xl leading-relaxed">
              At Career Guidance Academy (C.G.A), fee disputes, accidental duplicate payments, and special circumstance reviews are handled <strong>strictly through direct connection with the Academy Administration</strong>.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-blue-200">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Effective Date: October 1, 2026
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Career Guidance Academy (C.G.A), Udaipur, Tripura
              </span>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-sm leading-relaxed">
          {/* Important Highlight Notice */}
          <div className="p-6 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start gap-4">
            <div className="p-3 bg-amber-200/60 rounded-xl shrink-0">
              <UserCheck className="w-6 h-6 text-amber-800" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-extrabold text-base text-amber-950">
                Official Rule: Connect With Admin Only
              </h2>
              <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                Career Guidance Academy does not operate automated, instant refund gateways or robotic bot tickets. Every candidate’s enrollment involves personalized seat quota allocation, faculty scheduling, and distribution of intellectual property. Therefore, all payment investigations and refund applications must be processed <strong>exclusively by contacting the Academy Admin directly</strong> with authentic bank records.
              </p>
            </div>
          </div>

          {/* Section 1: Non-Refundable Standard Courses */}
          <div className="space-y-3 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-[#0056b3] text-xs font-black">
                1
              </span>
              General Non-Refundable Policy
            </h2>
            <p className="text-slate-600">
              Admission fees, monthly tuition, and competitive batch enrollment charges paid to Career Guidance Academy (C.G.A) are <strong>strictly non-refundable and non-transferable</strong> once:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>The student has been approved and granted login access to the C.G.A student portal or digital study repositories.</li>
              <li>Proprietary course modules, printed notes, or digital PDFs have been handed over or downloaded.</li>
              <li>Classroom lectures (online or offline) have commenced for the enrolled batch.</li>
              <li>A student voluntarily withdraws from the course due to personal commitments, change of mind, relocation, or selection elsewhere.</li>
            </ul>
          </div>

          {/* Section 2: Eligible Exceptions for Admin Review */}
          <div className="space-y-4 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-[#0056b3] text-xs font-black">
                2
              </span>
              Circumstances Eligible for Admin Review
            </h2>
            <p className="text-slate-600">
              The Academy Administration will evaluate and approve refunds only under the following specific, verified scenarios:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Accidental Duplicate Transaction
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  If the student or parent was debited more than once for the same course admission due to a bank server timeout or network glitch, the duplicate excess amount will be refunded directly to the original bank account after reconciliation with the academy bank statement.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Batch Cancellation by Institute
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  In the rare event that Career Guidance Academy cancels a planned batch before any class has taken place, and no suitable alternate timing or replacement batch can be provided, a 100% full refund will be disbursed by the Admin.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Step-by-Step Procedure to Connect With Admin */}
          <div className="space-y-4 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-[#0056b3] text-xs font-black">
                3
              </span>
              How to Connect with Admin for a Refund Request
            </h2>
            <p className="text-slate-600">
              To initiate an inquiry for duplicate payment or fee reconciliation, you must follow this mandatory administrative protocol:
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50/50 border border-blue-100">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0056b3] text-white text-xs font-bold shrink-0 mt-0.5">
                  1
                </span>
                <div className="text-xs text-slate-700">
                  <strong className="block text-slate-900 font-semibold mb-0.5">Prepare Proof of Payment:</strong>
                  Keep your Bank Reference / UTR Number, payment date &amp; exact time, original screenshot showing debit, and your student registration details ready.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50/50 border border-blue-100">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0056b3] text-white text-xs font-bold shrink-0 mt-0.5">
                  2
                </span>
                <div className="text-xs text-slate-700">
                  <strong className="block text-slate-900 font-semibold mb-0.5">Direct Message / Call the Admin Desk:</strong>
                  Send a WhatsApp message or reach out by calling <a href={`tel:${PAYMENT_SETTINGS.supportPhoneWhatsapp}`} className="text-[#0056b3] font-bold underline">{PAYMENT_SETTINGS.supportPhoneWhatsapp}</a> or email <a href={`mailto:${PAYMENT_SETTINGS.supportEmail}`} className="text-[#0056b3] font-bold underline">{PAYMENT_SETTINGS.supportEmail}</a> with the subject line <em>&quot;Fee Reconciliation Request - [Your Name] - [UTR Number]&quot;</em>.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50/50 border border-blue-100">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0056b3] text-white text-xs font-bold shrink-0 mt-0.5">
                  3
                </span>
                <div className="text-xs text-slate-700">
                  <strong className="block text-slate-900 font-semibold mb-0.5">Administrative Verification &amp; Turnaround Time:</strong>
                  Our finance officer reconciles transactions with State Bank of India (SBI, Udaipur Branch). Verified eligible refunds are disbursed via original UPI/NEFT within <strong>48 to 72 business hours</strong>.
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Direct Admin Contact Channels */}
          <div className="space-y-4 bg-slate-100 p-6 sm:p-8 rounded-2xl border border-slate-300">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Phone className="w-5 h-5 text-[#0056b3]" />
              Authorized Administrative Desks
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              Please connect directly with our designated management team:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-400 block font-medium">Head of Administration</span>
                <p className="text-slate-900 font-bold text-sm mt-1">S Banik</p>
                <p className="text-xs text-slate-500 mt-0.5">Director &amp; Chief Administrator</p>
                <a
                  href={`tel:${PAYMENT_SETTINGS.supportPhoneWhatsapp}`}
                  className="text-[#0056b3] font-semibold text-xs mt-2 inline-flex items-center gap-1 hover:underline"
                >
                  <Phone className="w-3.5 h-3.5" /> {PAYMENT_SETTINGS.supportPhoneWhatsapp}
                </a>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-400 block font-medium">Institutional Accounts Desk</span>
                <p className="text-slate-900 font-bold text-sm mt-1">{PAYMENT_SETTINGS.bankAccountHolder}</p>
                <p className="text-xs text-slate-500 mt-0.5">{PAYMENT_SETTINGS.bankName}</p>
                <a
                  href={`mailto:${PAYMENT_SETTINGS.supportEmail}`}
                  className="text-[#0056b3] font-semibold text-xs mt-2 inline-flex items-center gap-1 hover:underline break-all"
                >
                  <Mail className="w-3.5 h-3.5 shrink-0" /> {PAYMENT_SETTINGS.supportEmail}
                </a>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-400 block font-medium">Physical Center Desk</span>
                <p className="text-slate-900 font-bold text-sm mt-1">Career Guidance Academy</p>
                <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                  {PAYMENT_SETTINGS.instituteAddress}
                </p>
                <span className="text-[11px] text-slate-400 block mt-2">Visiting Hours: Mon–Sat, 10 AM – 5 PM</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
