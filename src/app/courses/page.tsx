'use client';

import React, { Suspense } from 'react';
import {
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { CourseCardSkeleton } from '@/components/ui/PageSkeleton';
import { PublicOfferingsCatalog } from '@/components/public/PublicOfferingsCatalog';

export default function CoursesCataloguePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicHeader />

      <main className="flex-1">
        {/* Page Banner */}
        <section className="cga-gradient-hero text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
              2026–27 Academic &amp; Competitive Session • Udaipur Center
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Courses, Mock Test Series &amp; Study Material Catalogue
            </h1>
            <p className="text-blue-100 mt-2 max-w-3xl text-sm sm:text-base leading-relaxed">
              Explore comprehensive State and Central Government competitive programs offered in both
              <strong> Offline Classroom</strong> and <strong>Online Interactive</strong> modes, along with our
              <strong> Daily Online Mock Test Series</strong> and <strong>Digital Study Material &amp; Notes</strong>.
            </p>
          </div>
        </section>

        {/* Notes & Material Policy Banner */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 relative z-20">
          <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-[#1e3a8a] text-white rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/20 shrink-0">
                <Printer className="w-5 h-5 text-amber-200" />
              </div>
              <div className="text-xs sm:text-sm">
                <p className="font-extrabold text-white">
                  Offline Enrollment Benefit &amp; Softcopy Security
                </p>
                <p className="text-amber-100 text-xs mt-0.5">
                  Students enrolling for <strong>Offline Batches</strong> receive complete <strong>physical printed notes &amp; book handouts</strong> at our Udaipur academy. Softcopy PDFs for all batches are delivered in protected <strong>View-Only</strong> mode.
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 text-white text-xs font-bold shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-300" /> View-Only Softcopy Security
            </div>
          </div>
        </section>

        {/* Unified Switcher Tabs Catalogue: [Courses] | [Mock Test Series] | [Study Materials] */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Suspense
            fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <CourseCardSkeleton key={i} />
                ))}
              </div>
            }
          >
            <PublicOfferingsCatalog showHeaderTitle={false} />
          </Suspense>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
