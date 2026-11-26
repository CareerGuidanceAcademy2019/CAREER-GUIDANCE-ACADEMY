'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Home,
  UserPlus,
  Sparkles,
  FileText,
  Maximize2,
  X,
} from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { useCga } from '@/context/CgaContext';
import { DailyCaMcqBanner } from '@/data/initialSeedData';

export default function DailyCurrentAffairsMcqPage() {
  const { db } = useCga();
  const banners: DailyCaMcqBanner[] = Array.isArray(db.siteContent.dailyCaMcqBanners)
    ? db.siteContent.dailyCaMcqBanners
    : [];

  const [zoomedBanner, setZoomedBanner] = useState<DailyCaMcqBanner | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicHeader />

      <main className="flex-1">
        {/* Page Header Banner */}
        <section className="cga-gradient-hero text-white py-10 sm:py-12 border-b border-slate-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Official Daily Practice Portal
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Daily Current Affair Quizzes &amp; MCQs
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-2xl mx-auto">
              Curated daily current affairs MCQ banners for Tripura TET, STGT, TPSC, TCS/TPS, JRBT, SSC, Banking &amp; Railway aspirants.
            </p>
          </div>
        </section>

        {/* View-Only Posted Banner(s) with Uploaded Date */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
          {banners.length === 0 ? (
            <div className="bg-white border-2 border-slate-200 p-10 sm:p-14 text-center space-y-3 shadow-xs">
              <div className="w-14 h-14 bg-blue-50 text-[#0056b3] border border-blue-200 flex items-center justify-center mx-auto">
                <FileText className="w-7 h-7" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#0a0e2a]">
                Today&apos;s Current Affair MCQ Banner Will Be Posted Shortly
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                Our academic faculty is preparing the latest Daily Current Affair MCQs. Please check back soon or sign in to the student portal.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {banners.map((banner, index) => {
                const formattedDate = banner.date
                  ? new Date(banner.date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : banner.date;

                return (
                  <article
                    key={banner.id || index}
                    className="bg-white border-2 border-slate-200 shadow-lg overflow-hidden"
                  >
                    {/* Date & Banner Top Bar */}
                    <div className="bg-[#0a0e2a] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 text-[11px] font-black uppercase tracking-wider">
                          Daily Current Affair MCQs
                        </span>
                        {banner.title && (
                          <h2 className="text-sm sm:text-base font-extrabold text-white">
                            {banner.title}
                          </h2>
                        )}
                      </div>

                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/20 text-amber-300 text-xs font-extrabold">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Uploaded Date: {formattedDate || banner.date}</span>
                      </div>
                    </div>

                    {/* Posted Banner Image (View-Only, Click to Zoom) */}
                    <div
                      onClick={() => setZoomedBanner(banner)}
                      className="relative bg-slate-900 cursor-zoom-in group flex items-center justify-center"
                      title="Click to view full screen"
                    >
                      <img
                        src={banner.imageUrl}
                        alt={banner.title || `Daily Current Affair MCQs - ${banner.date}`}
                        className="w-full max-h-[820px] object-contain mx-auto"
                      />
                      <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs font-bold px-3 py-1.5 inline-flex items-center gap-1.5 backdrop-blur-xs">
                        <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
                        <span>Click to Enlarge</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Bottom Navigation Buttons: Home Button & Register as New Student (Direct to Login Page) */}
          <div className="bg-white border-2 border-slate-200 p-6 sm:p-8 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-base sm:text-lg font-black text-[#0a0e2a]">
                Want Full Access to Daily CBT Mock Tests &amp; Study Notes?
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Return to the main portal or register as a new student to unlock full preparation batches.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto shrink-0">
              <Link
                href="/"
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all"
              >
                <Home className="w-4 h-4 text-[#0056b3]" />
                <span>Back to Home Page</span>
              </Link>

              <Link
                href="/login"
                className="px-6 py-3 bg-[#ea580c] hover:bg-orange-600 text-white font-black text-xs sm:text-sm shadow-md inline-flex items-center justify-center gap-2 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register as New Student</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Fullscreen Lightbox for Reading Banner Clearly */}
      {zoomedBanner && (
        <div
          onClick={() => setZoomedBanner(null)}
          className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setZoomedBanner(null)}
            className="absolute top-4 right-4 p-2.5 bg-white/15 hover:bg-white/25 text-white cursor-pointer"
            aria-label="Close full view"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={zoomedBanner.imageUrl}
            alt={zoomedBanner.title || 'Daily Current Affair Banner'}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[90vh] object-contain shadow-2xl"
          />
        </div>
      )}

      <PublicFooter />
    </div>
  );
}
