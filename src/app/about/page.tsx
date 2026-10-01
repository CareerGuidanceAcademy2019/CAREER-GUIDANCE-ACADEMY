'use client';

import React from 'react';
import Link from 'next/link';
import {
  Target,
  Eye,
  Award,
  BookOpen,
  MapPin,
  CheckCircle2,
  Users,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { useCga } from '@/context/CgaContext';

export default function AboutPage() {
  const { db } = useCga();
  const { siteContent } = db;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicHeader />

      <main className="flex-1">
        {/* Page Header Banner */}
        <section className="cga-gradient-hero text-white py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-2xl">
                <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
                  About Our Institution
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                  {siteContent.instituteName}
                </h1>
                <p className="text-blue-100 mt-3 text-base leading-relaxed">
                  {siteContent.tagline} — Located at {siteContent.contact.address}.
                </p>
              </div>
              <div className="bg-white p-4 rounded-3xl shadow-xl shrink-0">
                <img
                  src="/cga-logo.png"
                  alt="Career Guidance Academy (C.G.A) Udaipur"
                  className="w-28 h-28 object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Institute Story & Overview */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              <div className="lg:col-span-7 space-y-5">
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#0056b3]">
                  Our Heritage & Journey
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a0e2a]">
                  Empowering Aspirants Across Gomati District & Tripura
                </h2>
                <p className="text-slate-600 leading-relaxed text-base">
                  {siteContent.introText}
                </p>
                <p className="text-slate-600 leading-relaxed text-base">
                  {siteContent.aboutHistory}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                  {[
                    'Dedicated TRBT (TET, STGT, STPGT) Research Cell',
                    'Special TPSC & JRBT State Affairs Wing',
                    'Separate TBSE & CBSE Classroom Batches (Class VII–X)',
                    'Digital Study Library with Watermarked Paid Notes',
                    'Computer-Based & OMR Timed Mock Test Series',
                    'Transparent Fee Structure with Instalment Support',
                  ].map((point) => (
                    <div key={point} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-[#0056b3] shrink-0 mt-0.5" />
                      <span className="text-sm font-semibold text-slate-800">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats & Location Summary Card */}
              <div className="lg:col-span-5 bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-6">
                <h3 className="text-lg font-extrabold text-[#0a0e2a] border-b border-slate-200 pb-3">
                  C.G.A Udaipur At a Glance
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {siteContent.stats.map((st, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs"
                    >
                      <p className="text-2xl font-extrabold text-[#0056b3]">{st.value}</p>
                      <p className="text-xs font-medium text-slate-600 mt-1">{st.label}</p>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs space-y-2">
                  <p className="font-bold text-[#0a0e2a] flex items-center gap-1.5 text-sm">
                    <MapPin className="w-4 h-4 text-[#dc2626]" />
                    Official Campus Address
                  </p>
                  <p className="text-slate-700 leading-relaxed">{siteContent.contact.address}</p>
                  <p className="text-slate-600">
                    <strong>Office Hours:</strong> {siteContent.contact.officeHours}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision Cards */}
        <section className="py-16 bg-slate-50 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Mission */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs border-t-4 border-t-[#0056b3]">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0056b3] flex items-center justify-center mb-5">
                  <Target className="w-6 h-6" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#0056b3]">
                  Our Academic Mission
                </span>
                <h3 className="text-2xl font-extrabold text-[#0a0e2a] mt-1 mb-3">
                  Accessible, High-Impact Coaching for Every Student
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                  {siteContent.mission}
                </p>
              </div>

              {/* Vision */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs border-t-4 border-t-[#ea580c]">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#ea580c] flex items-center justify-center mb-5">
                  <Eye className="w-6 h-6" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#ea580c]">
                  Our Long-Term Vision
                </span>
                <h3 className="text-2xl font-extrabold text-[#0a0e2a] mt-1 mb-3">
                  Setting the Benchmark in North-East India
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                  {siteContent.vision}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-14 bg-white">
          <div className="max-w-5xl mx-auto px-4 text-center space-y-5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a0e2a]">
              Explore Our Courses or Meet Our Faculty
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base">
              Browse live batch availability across Teaching Exams, Banking/SSC/Railway, and TBSE &
              CBSE School Coaching.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0056b3] text-white font-bold text-sm hover:bg-[#1e3a8a]"
              >
                Browse Course Catalogue <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/faculty"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 text-slate-800 font-bold text-sm hover:bg-slate-200"
              >
                View Faculty Profiles
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
