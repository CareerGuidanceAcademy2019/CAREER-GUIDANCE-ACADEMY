'use client';

import React from 'react';
import Link from 'next/link';
import {
  Cookie,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Settings,
  Mail,
  Calendar,
  Building2,
  Info,
} from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { PAYMENT_SETTINGS } from '@/config/paymentSettings';

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <PublicHeader />

      <main className="flex-1">
        {/* Header Hero */}
        <section className="cga-gradient-hero text-white py-16 px-4 sm:px-6 lg:px-8 border-b-4 border-[#0056b3]">
          <div className="max-w-4xl mx-auto space-y-4 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Cookie className="w-4 h-4" /> Transparency & Data Privacy
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Cookie Policy
            </h1>
            <p className="text-sm sm:text-base text-blue-100 max-w-2xl leading-relaxed">
              Learn how Career Guidance Academy (C.G.A) uses essential cookies and local browser storage to provide secure student authentication and seamless portal functionality without commercial tracking.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-blue-200">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Effective Date: October 1, 2026
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Career Guidance Academy, Udaipur, Tripura
              </span>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-sm leading-relaxed">
          {/* Executive Summary */}
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-3.5">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-base text-emerald-900 mb-1">Strict Zero-Tracking Guarantee</h2>
              <p className="text-xs sm:text-sm text-emerald-800">
                Career Guidance Academy <strong>does NOT use any cross-site tracking cookies, third-party advertising pixels (such as Meta Pixel or Google Ads), or data-broker trackers</strong>. We exclusively use strictly necessary technical session cookies and local storage tokens required for student/faculty portal authentication and security.
              </p>
            </div>
          </div>

          {/* Section 1: What Are Cookies */}
          <div className="space-y-3 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-[#0056b3] text-xs font-black">
                1
              </span>
              What Are Cookies & Browser Storage?
            </h2>
            <p className="text-slate-600">
              Cookies are small alphanumeric text files stored on your computer or mobile device when you visit a website. Browser storage (such as <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono text-xs">localStorage</code>) works similarly to preserve your session state across page refreshes.
            </p>
            <p className="text-slate-600">
              These files allow web applications to identify authenticated users, remember your login session, prevent repeated logins on every click, and ensure cross-site request security.
            </p>
          </div>

          {/* Section 2: Types of Cookies Used on CGA */}
          <div className="space-y-4 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-[#0056b3] text-xs font-black">
                2
              </span>
              Categories of Cookies & Local Storage We Use
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-3 border-b border-slate-200">Cookie / Storage Key</th>
                    <th className="p-3 border-b border-slate-200">Category</th>
                    <th className="p-3 border-b border-slate-200">Purpose</th>
                    <th className="p-3 border-b border-slate-200">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-semibold text-slate-900">sb-*-auth-token</td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-[#0056b3] font-medium text-[11px]">
                        Strictly Necessary
                      </span>
                    </td>
                    <td className="p-3">Stores encrypted Supabase authentication tokens so students and faculty can stay securely signed in.</td>
                    <td className="p-3">Session / Max 30 Days</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-semibold text-slate-900">cga_cookie_consent</td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-[#0056b3] font-medium text-[11px]">
                        Strictly Necessary
                      </span>
                    </td>
                    <td className="p-3">Remembers your acknowledgment and preference regarding our cookie policy banner.</td>
                    <td className="p-3">1 Year</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-semibold text-slate-900">cga_user_role</td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-[#0056b3] font-medium text-[11px]">
                        Functional
                      </span>
                    </td>
                    <td className="p-3">Caches the authenticated navigation state (student, faculty, admin) to prevent flicker during routing.</td>
                    <td className="p-3">Session</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Third-Party & Tracking Cookies (Explicit Disclaimer) */}
          <div className="space-y-3 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-[#0056b3] text-xs font-black">
                3
              </span>
              Third-Party Services & Analytics Tracking
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-slate-900">No Commercial Ad Trackers</h3>
                  <p className="text-xs text-slate-600">
                    We do not partner with third-party ad networks, behavioural profilers, or retargeting marketing services. We never monetize student data.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-slate-900">Privacy-Safe Embedded Content</h3>
                  <p className="text-xs text-slate-600">
                    The academy address map displayed on our contact page uses a sandboxed Google Maps iframe loaded with <code className="bg-slate-200 px-1 py-0.2 rounded font-mono text-[11px]">referrerPolicy=&quot;no-referrer-when-downgrade&quot;</code> and lazy loading to prevent intrusive tracking.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: How to Control and Manage Cookies */}
          <div className="space-y-3 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-[#0056b3] text-xs font-black">
                4
              </span>
              How to Manage or Clear Cookies in Your Browser
            </h2>
            <p className="text-slate-600">
              You can block or delete cookies at any time through your browser settings. However, please note that blocking strictly necessary cookies will prevent you from logging in to the Student or Faculty Dashboard.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-600">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="block text-slate-900 mb-1">Google Chrome</strong>
                Settings &gt; Privacy and Security &gt; Cookies and other site data &gt; See all site data and permissions.
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="block text-slate-900 mb-1">Mozilla Firefox</strong>
                Settings &gt; Privacy &amp; Security &gt; Cookies and Site Data &gt; Clear Data / Manage Data.
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="block text-slate-900 mb-1">Microsoft Edge</strong>
                Settings &gt; Cookies and site permissions &gt; Manage and delete cookies and site data.
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="block text-slate-900 mb-1">Apple Safari (iOS / macOS)</strong>
                Preferences &gt; Privacy &gt; Manage Website Data &gt; Remove All or select specific sites.
              </div>
            </div>
          </div>

          {/* Section 5: Questions & Privacy Contact */}
          <div className="space-y-3 bg-slate-100 p-6 sm:p-8 rounded-2xl border border-slate-300">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#0056b3]" />
              Questions About Our Cookie Practices?
            </h2>
            <p className="text-slate-600">
              If you have any questions regarding our use of cookies or technical storage, you may contact our administrative team at:
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-700 pt-1">
              <span>Email: <a href={`mailto:${PAYMENT_SETTINGS.supportEmail}`} className="text-[#0056b3] underline">{PAYMENT_SETTINGS.supportEmail}</a></span>
              <span>•</span>
              <span>Phone / WhatsApp: <a href={`tel:${PAYMENT_SETTINGS.supportPhoneWhatsapp}`} className="text-slate-900 font-semibold">{PAYMENT_SETTINGS.supportPhoneWhatsapp}</a></span>
              <span>•</span>
              <span>
                Read our full <Link href="/privacy-policy" className="text-[#0056b3] underline font-semibold">Privacy Policy</Link>
              </span>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
