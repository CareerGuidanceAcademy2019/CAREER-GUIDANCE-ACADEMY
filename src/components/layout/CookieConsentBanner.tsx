'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, ShieldCheck, X } from 'lucide-react';

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already acknowledged cookie consent
    const consent = localStorage.getItem('cga_cookie_consent');
    if (!consent) {
      // Small timeout so banner doesn't flash jarringly on initial load
      const timer = setTimeout(() => setIsVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('cga_cookie_consent', 'accepted_all');
    setIsVisible(false);
  };

  const handleAcceptEssential = () => {
    localStorage.setItem('cga_cookie_consent', 'essential_only');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      role="region"
      aria-label="Cookie and Privacy Consent Notice"
      className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 bg-slate-900/95 backdrop-blur-md text-white border-t border-slate-700 shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Text and Icon */}
        <div className="flex items-start gap-3.5 max-w-3xl">
          <div className="p-2.5 bg-blue-600/30 rounded-xl text-amber-300 shrink-0 mt-0.5 border border-blue-400/20">
            <Cookie className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Your Privacy &amp; Essential Cookies</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                DPDP 2023 Compliant
              </span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Career Guidance Academy uses strictly necessary authentication cookies to keep your student session secure. We do <strong>not</strong> use commercial ad trackers, sell personal data, or deploy invasive tracking pixels. Read our{' '}
              <Link
                href="/cookie-policy"
                className="text-amber-300 underline font-semibold hover:text-amber-200 focus-visible:outline-2 focus-visible:outline-amber-300 rounded-xs"
              >
                Cookie Policy
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy-policy"
                className="text-amber-300 underline font-semibold hover:text-amber-200 focus-visible:outline-2 focus-visible:outline-amber-300 rounded-xs"
              >
                Privacy Policy
              </Link>.
            </p>
          </div>
        </div>

        {/* Buttons / Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0">
          <button
            type="button"
            onClick={handleAcceptEssential}
            className="flex-1 md:flex-initial px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors cursor-pointer"
            aria-label="Accept Essential Cookies Only"
          >
            Essential Only
          </button>
          <button
            type="button"
            onClick={handleAcceptAll}
            className="flex-1 md:flex-initial px-4 py-2 text-xs font-bold rounded-lg bg-[#0056b3] hover:bg-blue-600 text-white shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 transition-colors cursor-pointer"
            aria-label="Accept All Essential and Functional Cookies"
          >
            Accept &amp; Continue
          </button>
        </div>
      </div>
    </aside>
  );
}
