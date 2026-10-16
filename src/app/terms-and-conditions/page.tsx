'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  Scale,
  ShieldAlert,
  GraduationCap,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Building2,
  CopyX,
} from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { PAYMENT_SETTINGS } from '@/config/paymentSettings';

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <PublicHeader />

      <main className="flex-1">
        {/* Header Hero */}
        <section className="cga-gradient-hero text-white py-16 px-4 sm:px-6 lg:px-8 border-b-4 border-[#0056b3]">
          <div className="max-w-4xl mx-auto space-y-4 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Scale className="w-4 h-4" /> Legal Terms of Service
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Terms and Conditions
            </h1>
            <p className="text-sm sm:text-base text-blue-100 max-w-2xl leading-relaxed">
              Please read these Terms and Conditions carefully before enrolling in any coaching programs,
              accessing our study materials, or using the Career Guidance Academy (C.G.A) digital platform.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-blue-200">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Last Updated: October 1, 2026
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Jurisdiction: Udaipur, Gomati Tripura, India
              </span>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-sm leading-relaxed">
          {/* Summary Box */}
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3.5">
            <FileText className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-base text-amber-900 mb-1">Contractual Relationship</h2>
              <p className="text-xs sm:text-sm text-amber-800">
                By registering on this portal, submitting an admission application, or making fee payments to Career Guidance Academy (C.G.A), you confirm that you have read, understood, and agreed to be legally bound by these Terms and Conditions, our Privacy Policy, and our Refund Policy under the Indian Contract Act, 1872.
              </p>
            </div>
          </div>

          {/* Section 1: Institutional Scope */}
          <div className="space-y-3 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-[#0056b3] text-xs font-black">
                1
              </span>
              Institutional Scope & Services
            </h2>
            <p className="text-slate-600">
              Career Guidance Academy (C.G.A), located in Chanban (Behind Youthclub), Udaipur, Gomati Tripura, is a private coaching and academic mentoring institute. We provide classroom and online preparatory guidance for:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>TRBT TET Paper I and TET Paper II examinations</li>
              <li>Tripura Junior Board / Joint Recruitment Examinations (JRBT)</li>
              <li>State School Board examinations (Classes VII, VIII, IX, and X)</li>
              <li>Specialized subject tuitions (Mathematics, Science, EVS, Social Studies)</li>
            </ul>
            <p className="text-slate-600 text-xs">
              C.G.A is an autonomous coaching institution and is <strong>not affiliated with, endorsed by, or a representative of TRBT, JRBT, TBSE, or any government body</strong>.
            </p>
          </div>

          {/* Section 2: Student Admission & Minor Enrollment */}
          <div className="space-y-3 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-[#0056b3] text-xs font-black">
                2
              </span>
              Eligibility & Enrollment of Minors
            </h2>
            <p className="text-slate-600">
              Students enrolling for adult competitive batches (TET/JRBT) must be at least 18 years of age or possess legal capacity under Indian law.
            </p>
            <p className="text-slate-600">
              For school foundation batches (Classes VII to X), admission must be submitted with verifiable parental/guardian consent in compliance with the Digital Personal Data Protection Act, 2023. Parents or guardians assume full legal responsibility for student conduct, fee submissions, and compliance.
            </p>
          </div>

          {/* Section 3: Intellectual Property & Anti-Piracy */}
          <div className="space-y-3 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-[#0056b3] text-xs font-black">
                3
              </span>
              Intellectual Property Rights & Anti-Piracy
            </h2>
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs leading-relaxed space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-red-800">
                <CopyX className="w-4 h-4 text-red-600" /> Strict Copyright Protection Notice
              </div>
              <p>
                All study modules, lecture notes, mock test questions, answer keys, digital PDFs, video recordings, diagrams, and website content provided by Career Guidance Academy are original works protected under the <strong>Indian Copyright Act, 1957</strong> and international copyright treaties.
              </p>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>
                <strong>Personal License Only:</strong> Enrolled students are granted a limited, personal, non-exclusive, non-transferable license to view educational materials solely for their own preparation.
              </li>
              <li>
                <strong>Zero Distribution Tolerance:</strong> You are strictly prohibited from copying, photocopying, scanning, screen recording, uploading to Telegram/WhatsApp/Google Drive, selling, or redistributing any academy material.
              </li>
              <li>
                <strong>Watermarking & Traceability:</strong> Digital files issued to students may contain visible and forensic digital watermarks linked to your registered student ID and phone number.
              </li>
              <li>
                <strong>Legal Action:</strong> Any infringement will result in immediate termination of academy enrollment without refund, plus civil copyright suits and criminal complaints under Section 63 of the Copyright Act, 1957.
              </li>
            </ul>
          </div>

          {/* Section 4: Fee Payments & Verification */}
          <div className="space-y-3 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-[#0056b3] text-xs font-black">
                4
              </span>
              Course Fees & Payment Verification
            </h2>
            <p className="text-slate-600">
              All fee transfers must be made solely to the official academy bank account or verified UPI handle (<code className="bg-slate-100 px-1 py-0.5 rounded text-[#0056b3] font-semibold">{PAYMENT_SETTINGS.upiId}</code>) as displayed on our official payment desk.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Payments are subject to manual verification by the C.G.A administrative team.</li>
              <li>Students must upload a valid Bank UTR / Transaction Reference number along with an authentic transaction screenshot.</li>
              <li>Providing counterfeit, edited, or forged payment receipts constitutes fraud under the Indian Penal Code / Bharatiya Nyaya Sanhita, leading to immediate expulsion and reporting to financial authorities.</li>
            </ul>
          </div>

          {/* Section 5: Refund Policy */}
          <div className="space-y-3 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-[#0056b3] text-xs font-black">
                5
              </span>
              Refund Policy (Direct Admin Escalation Only)
            </h2>
            <p className="text-slate-600">
              Due to the immediate provisioning of proprietary notes, syllabus modules, seat allocation, and teacher schedule locking:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Course fees are <strong>non-refundable</strong> once student access is activated or study materials are handed over.</li>
              <li>Any exceptional refund request (e.g., accidental duplicate payment for the same course) must be handled <strong>strictly by connecting with the Admin desk directly</strong>. No third-party or automated refund requests are entertained.</li>
              <li>For complete terms, criteria, and administrative contact channels, please review our comprehensive{' '}
                <Link href="/refund-policy" className="text-[#0056b3] underline font-semibold hover:text-blue-800">
                  Refund Policy
                </Link>.
              </li>
            </ul>
          </div>

          {/* Section 6: Academic Disclaimer & Non-Guarantee of Results */}
          <div className="space-y-3 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-[#0056b3] text-xs font-black">
                6
              </span>
              Academic Disclaimers & Non-Guarantee of Results
            </h2>
            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 space-y-2">
              <p>
                <strong>No Assurance of Selection:</strong> Career Guidance Academy delivers diligent tutoring, syllabus coverage, and practice materials. However, passing government exams such as TRBT TET-I, TET-II, JRBT, or achieving specific school marks depends entirely on the candidate’s individual dedication, examination performance, and recruitment criteria established by respective government commissions.
              </p>
              <p className="text-xs text-slate-500">
                C.G.A makes no representation, warranty, or guarantee that enrolling in any batch will guarantee employment, state government appointment, or specific test scores.
              </p>
            </div>
          </div>

          {/* Section 7: Code of Conduct & Disciplinary Termination */}
          <div className="space-y-3 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-[#0056b3] text-xs font-black">
                7
              </span>
              Code of Conduct & Account Termination
            </h2>
            <p className="text-slate-600">
              Students and guardians agree to maintain respect, decorum, and academic integrity. C.G.A reserves the unilateral right to suspend or terminate student enrollment and digital account access without refund if the student:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Disrupts classes or engages in abusive, defamatory, or threatening behavior towards teachers or peers.</li>
              <li>Shares portal login credentials with un-enrolled third parties.</li>
              <li>Engages in unauthorized scraping, automated extraction, or reverse-engineering of academy web assets.</li>
            </ul>
          </div>

          {/* Section 8: Limitation of Liability */}
          <div className="space-y-3 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-[#0056b3] text-xs font-black">
                8
              </span>
              Limitation of Liability
            </h2>
            <p className="text-slate-600">
              To the maximum extent permitted by applicable Indian law, Career Guidance Academy, its directors, instructors, and staff shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from the use of or inability to use our services.
            </p>
            <p className="text-slate-600">
              In any circumstance, C.G.A’s total cumulative liability to any registered student for any and all claims shall not exceed the actual fee amount paid by such student for the specific active academic term.
            </p>
          </div>

          {/* Section 9: Governing Law & Jurisdiction */}
          <div className="space-y-3 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-[#0056b3] text-xs font-black">
                9
              </span>
              Governing Law & Exclusive Jurisdiction
            </h2>
            <p className="text-slate-600">
              These Terms and Conditions shall be governed by, interpreted, and construed in accordance with the laws of the Republic of India.
            </p>
            <p className="text-slate-600">
              Any dispute, controversy, or claim arising out of or relating to these terms or institutional coaching services shall be subject to the exclusive jurisdiction of the competent courts located at <strong>Udaipur, Gomati District, Tripura, India</strong>.
            </p>
          </div>

          {/* Section 10: Official Contact & Grievance Redressal */}
          <div className="space-y-4 bg-slate-100 p-6 sm:p-8 rounded-2xl border border-slate-300">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#0056b3]" />
              Official Institutional Contact
            </h2>
            <p className="text-slate-600">
              For legal inquiries, dispute notices, or terms clarification, contact our administration:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-400 block font-medium">Academy Address</span>
                <p className="text-slate-800 font-semibold text-xs mt-1 flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-[#0056b3] shrink-0 mt-0.5" />
                  {PAYMENT_SETTINGS.instituteAddress}
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-400 block font-medium">Legal Inquiries Email</span>
                <a
                  href={`mailto:${PAYMENT_SETTINGS.supportEmail}`}
                  className="text-[#0056b3] font-semibold text-xs mt-1 flex items-center gap-1.5 hover:underline break-all"
                >
                  <Mail className="w-4 h-4 text-[#0056b3] shrink-0" />
                  {PAYMENT_SETTINGS.supportEmail}
                </a>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-400 block font-medium">Administrative Phone</span>
                <a
                  href={`tel:${PAYMENT_SETTINGS.supportPhoneWhatsapp}`}
                  className="text-slate-800 font-semibold text-xs mt-1 flex items-center gap-1.5 hover:text-[#0056b3]"
                >
                  <Phone className="w-4 h-4 text-[#0056b3] shrink-0" />
                  {PAYMENT_SETTINGS.supportPhoneWhatsapp}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
