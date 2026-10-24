'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  FileText,
  UserCheck,
  Eye,
  AlertCircle,
  HelpCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { PAYMENT_SETTINGS } from '@/config/paymentSettings';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <PublicHeader />

      <main className="flex-1">
        {/* Header Hero */}
        <section className="cga-gradient-hero text-white py-16 px-4 sm:px-6 lg:px-8 border-b-4 border-[#0056b3]">
          <div className="max-w-4xl mx-auto space-y-4 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> Legal & Data Protection Compliance
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Privacy Policy & Personal Data Protection
            </h1>
            <p className="text-sm sm:text-base text-blue-100 max-w-2xl leading-relaxed">
              Compliant with the Digital Personal Data Protection Act, 2023 (DPDP Act, India) and the
              Information Technology Act, 2000. Learn how Career Guidance Academy (C.G.A) collects,
              uses, protects, and respects your academic and personal information.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-blue-200">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Effective Date: October 1, 2026
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Data Fiduciary: Career Guidance Academy, Udaipur
              </span>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-sm leading-relaxed">
          {/* Executive Notice */}
          <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 text-slate-700 flex items-start gap-3.5">
            <Lock className="w-5 h-5 text-[#0056b3] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="font-extrabold text-[#0a0e2a] text-sm">
                Commitment to Student Data Privacy & DPDP Act 2023 Compliance
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Career Guidance Academy (&quot;C.G.A&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;the Institute&quot;) values the trust you place in us when sharing your personal details. We act as a <strong>Data Fiduciary</strong> under India&apos;s Digital Personal Data Protection Act, 2023 (DPDP Act 2023). We never sell, lease, or monetize your personal data to third-party commercial marketing entities or data brokers.
              </p>
            </div>
          </div>

          {/* Section 1: Data Fiduciary Identity */}
          <div className="space-y-3">
            <h2 className="text-lg font-extrabold text-[#0a0e2a] flex items-center gap-2 border-b border-slate-200 pb-2">
              <span className="w-6 h-6 rounded-lg bg-[#0056b3] text-white text-xs font-bold inline-flex items-center justify-center">1</span>
              Identity of the Data Fiduciary
            </h2>
            <p className="text-slate-600">
              For all purposes under the DPDP Act 2023 and applicable Indian data protection laws, the Data Fiduciary is:
            </p>
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1 font-mono text-xs text-slate-700">
              <p><strong>Entity Name:</strong> {PAYMENT_SETTINGS.instituteName}</p>
              <p><strong>Head Office / Campus:</strong> {PAYMENT_SETTINGS.instituteAddress}</p>
              <p><strong>Grievance & Support Email:</strong> {PAYMENT_SETTINGS.supportEmail}</p>
              <p><strong>Official Portal:</strong> Career Guidance Academy Web Portal (https://careerguidanceacademy.in)</p>
            </div>
          </div>

          {/* Section 2: Data We Collect */}
          <div className="space-y-3">
            <h2 className="text-lg font-extrabold text-[#0a0e2a] flex items-center gap-2 border-b border-slate-200 pb-2">
              <span className="w-6 h-6 rounded-lg bg-[#0056b3] text-white text-xs font-bold inline-flex items-center justify-center">2</span>
              Personal Data Collected & Purpose of Processing
            </h2>
            <p className="text-slate-600">
              In accordance with the principle of <em>Data Minimization</em>, we collect strictly the personal data necessary to provide academic guidance, student portal services, classroom enrollment, and administrative operations:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <h3 className="font-extrabold text-slate-900 text-xs uppercase text-[#0056b3]">A. Identity & Contact Information</h3>
                <ul className="list-disc list-inside text-xs space-y-1 text-slate-600">
                  <li>Full Student Name</li>
                  <li>Mobile Phone Number & WhatsApp Number</li>
                  <li>Email Address (for portal access and notices)</li>
                  <li>Present & Permanent Postal Address (for physical printed note dispatch)</li>
                  <li>Guardian / Parent Name (mandatory for minors in school batches)</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <h3 className="font-extrabold text-slate-900 text-xs uppercase text-[#0056b3]">B. Academic & Performance Records</h3>
                <ul className="list-disc list-inside text-xs space-y-1 text-slate-600">
                  <li>Educational Qualification (B.A., B.Sc., B.Ed., D.El.Ed., etc.)</li>
                  <li>Target Examination Stream (T-TET Paper-I/II, TPSC, JRBT, TBSE, CBSE)</li>
                  <li>Mock Test Attempts, Marks, Percentile, and Batch Rank</li>
                  <li>Course completion status and digital library access logs</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <h3 className="font-extrabold text-slate-900 text-xs uppercase text-[#0056b3]">C. Payment & Transaction Verification</h3>
                <ul className="list-disc list-inside text-xs space-y-1 text-slate-600">
                  <li>12-digit UPI Reference Number / Bank UTR</li>
                  <li>Date and amount of course fee payment</li>
                  <li>Uploaded transaction confirmation screenshot proof</li>
                  <li>Official generated C.G.A receipt records (<code>CGA-RCP-</code>)</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <h3 className="font-extrabold text-slate-900 text-xs uppercase text-[#0056b3]">D. What We Never Collect</h3>
                <ul className="list-disc list-inside text-xs space-y-1 text-red-700">
                  <li>We <strong>NEVER</strong> store Credit or Debit Card numbers</li>
                  <li>We <strong>NEVER</strong> request or store ATM PINs or UPI MPINs</li>
                  <li>We <strong>NEVER</strong> collect biometric or sensitive personal health records</li>
                  <li>All payments occur outside via your bank app or at our office counter</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 3: Legal Basis & Consent */}
          <div className="space-y-3">
            <h2 className="text-lg font-extrabold text-[#0a0e2a] flex items-center gap-2 border-b border-slate-200 pb-2">
              <span className="w-6 h-6 rounded-lg bg-[#0056b3] text-white text-xs font-bold inline-flex items-center justify-center">3</span>
              Lawful Basis & Consent Mechanism
            </h2>
            <p className="text-slate-600">
              We process your digital personal data under Section 4 and Section 6 of the DPDP Act, 2023 based on your <strong>explicit, informed, affirmative consent</strong> provided at the time of account registration or enquiry submission. You have the right to withdraw this consent at any time, subject to legal obligations to retain fee and tax records.
            </p>
          </div>

          {/* Section 4: Data Principal Rights */}
          <div className="space-y-3">
            <h2 className="text-lg font-extrabold text-[#0a0e2a] flex items-center gap-2 border-b border-slate-200 pb-2">
              <span className="w-6 h-6 rounded-lg bg-[#0056b3] text-white text-xs font-bold inline-flex items-center justify-center">4</span>
              Your Statutory Rights under the DPDP Act 2023
            </h2>
            <p className="text-slate-600">
              As a Data Principal under Indian law, you are entitled to the following enforceable rights:
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <strong>1. Right to Access Information:</strong> You may request a summary of your personal data processed by C.G.A, along with the processing activities performed.
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <strong>2. Right to Correction and Erasure:</strong> You can update inaccurate data or request deletion of personal information once your coaching session has concluded.
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <strong>3. Right to Grievance Redressal:</strong> You have the right to readily available grievance redressal within 7 business days from our Grievance Officer.
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <strong>4. Right to Nominate:</strong> You may designate another person to exercise your rights in the event of unforeseen death or incapacity.
              </div>
            </div>
          </div>

          {/* Section 5: Children's Data */}
          <div className="space-y-3">
            <h2 className="text-lg font-extrabold text-[#0a0e2a] flex items-center gap-2 border-b border-slate-200 pb-2">
              <span className="w-6 h-6 rounded-lg bg-[#0056b3] text-white text-xs font-bold inline-flex items-center justify-center">5</span>
              Special Protection for Children (School Batches VII–X)
            </h2>
            <p className="text-slate-600">
              In accordance with Section 9 of the DPDP Act 2023, for students under 18 years of age enrolled in our TBSE and CBSE school coaching batches:
            </p>
            <ul className="list-disc list-inside text-xs space-y-1 text-slate-600 bg-white p-4 rounded-xl border border-slate-200">
              <li>Verifiable parental/guardian consent is mandatory during registration.</li>
              <li>We do not engage in behavioral tracking or targeted advertising directed at children.</li>
              <li>All academic correspondence and fee updates are routed to the registered parent/guardian.</li>
            </ul>
          </div>

          {/* Section 6: Grievance Officer */}
          <div className="space-y-3">
            <h2 className="text-lg font-extrabold text-[#0a0e2a] flex items-center gap-2 border-b border-slate-200 pb-2">
              <span className="w-6 h-6 rounded-lg bg-[#0056b3] text-white text-xs font-bold inline-flex items-center justify-center">6</span>
              Grievance Redressal Officer (Mandatory Notice)
            </h2>
            <p className="text-slate-600">
              If you have inquiries, complaints, or wish to exercise your data privacy rights, you may directly contact our designated Data Protection &amp; Grievance Redressal Officer:
            </p>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <h3 className="font-extrabold text-sm text-[#0a0e2a]">Mr. Tridip Sarkar</h3>
              <p className="text-xs text-slate-500">Designated Data Protection Officer (DPDP) &amp; Grievance Redressal Officer</p>
              <div className="pt-2 space-y-1 text-xs text-slate-700">
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#0056b3]" />
                  <span>Email: <strong>{PAYMENT_SETTINGS.supportEmail}</strong></span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#0056b3]" />
                  <span>Phone / WhatsApp: <strong>{PAYMENT_SETTINGS.supportPhoneWhatsapp}</strong></span>
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#0056b3]" />
                  <span>Office: {PAYMENT_SETTINGS.instituteAddress}</span>
                </p>
              </div>
              <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                Timeline: We acknowledge all privacy grievances within 24 hours and resolve them within 7 business days. If unresolved, you may lodge a complaint with the <strong>Data Protection Board of India</strong>.
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="pt-6 border-t border-slate-200 flex flex-wrap gap-4 text-xs font-bold text-[#0056b3]">
            <Link href="/terms-and-conditions" className="hover:underline flex items-center gap-1">
              Terms &amp; Conditions →
            </Link>
            <Link href="/cookie-policy" className="hover:underline flex items-center gap-1">
              Cookie Policy →
            </Link>
            <Link href="/refund-policy" className="hover:underline flex items-center gap-1">
              Refund Policy →
            </Link>
            <Link href="/contact" className="hover:underline flex items-center gap-1">
              Contact Udaipur Campus →
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
