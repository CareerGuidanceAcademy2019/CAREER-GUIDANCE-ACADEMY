'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  Trophy,
  Users,
  FileCheck,
} from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { CourseCard } from '@/components/public/CourseCard';
import { useCga } from '@/context/CgaContext';
import { CustomAcademicEmblemSvg, CustomArrowRightSvg } from '@/components/ui/CustomIcons';

export default function HomePage() {
  const { db } = useCga();
  const { siteContent, courses, achievements, faculty } = db;

  const featuredCourses = courses.filter((c) => c.featured).slice(0, 6);
  const topAchievements = achievements.slice(0, 4);
  const topFaculty = faculty.slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicHeader />

      <main className="flex-1">
        {/* ==================== 1. HERO BANNER ==================== */}
        <section className="relative overflow-hidden cga-gradient-hero text-white py-16 lg:py-24">
          {/* Decorative background circles */}
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#ea580c]/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#dc2626]/15 blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Hero Copy */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-xs text-xs sm:text-sm font-semibold text-amber-300">
                  <CustomAcademicEmblemSvg className="w-4 h-4 text-[#ea580c]" />
                  <span>{siteContent.heroBadge}</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15]">
                  {siteContent.heroTitle}
                </h1>

                <p className="text-base sm:text-lg text-blue-100 leading-relaxed max-w-2xl">
                  {siteContent.heroSubtitle}
                </p>

                {/* Primary & Secondary CTAs */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    href="/courses"
                    id="hero-explore-courses-btn"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#ea580c] hover:bg-orange-600 text-white font-bold text-sm sm:text-base shadow-lg shadow-orange-950/30 transition-all"
                  >
                    {siteContent.heroCtaPrimary}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/login"
                    id="hero-portal-login-btn"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-[#0a0e2a] hover:bg-blue-50 font-bold text-sm sm:text-base shadow-md transition-all"
                  >
                    {siteContent.heroCtaSecondary}
                  </Link>
                </div>

                {/* Quick Category Pills */}
                <div className="pt-4 flex flex-wrap items-center gap-2 text-xs text-blue-100">
                  <span className="font-bold text-white mr-1">Popular Wings:</span>
                  {['TET Paper I & II', 'TRBT STGT / STPGT', 'TPSC & JRBT', 'IBPS & SSC', 'TBSE & CBSE (VII–X)'].map(
                    (tag) => (
                      <Link
                        key={tag}
                        href="/courses"
                        className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 transition-colors"
                      >
                        {tag}
                      </Link>
                    )
                  )}
                </div>
              </div>

              {/* Right Column: Emblem Showcase Card */}
              <div className="lg:col-span-5">
                <div className="bg-white/95 text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-white/30 relative">
                  <div className="flex items-center gap-4 pb-6 border-b border-slate-200">
                    <img
                      src="/cga-logo.png"
                      alt="Career Guidance Academy (C.G.A) Seal"
                      className="w-20 h-20 sm:w-24 sm:h-24 object-contain shrink-0 rounded-full shadow-md"
                    />
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded bg-red-50 text-[#dc2626] text-[11px] font-extrabold uppercase tracking-wider mb-1">
                        Gomati District’s #1 Institute
                      </span>
                      <h2 className="text-xl font-extrabold text-[#0a0e2a]">
                        Career Guidance Academy
                      </h2>
                      <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-[#0056b3] shrink-0" />
                        Chanban Youth Club Rd, Udaipur, Tripura
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 my-6">
                    {siteContent.stats.map((stat, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center"
                      >
                        <p className="text-2xl font-extrabold text-[#0056b3]">{stat.value}</p>
                        <p className="text-[11px] font-semibold text-slate-600 mt-0.5 leading-snug">
                          {stat.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-blue-50/90 border border-blue-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-[#0a0e2a]">
                        Try Interactive Demo Portals
                      </p>
                      <p className="text-[11px] text-slate-600">
                        One-click login for Student & Admin workflows
                      </p>
                    </div>
                    <Link
                      href="/login"
                      className="px-3.5 py-2 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold shrink-0 inline-flex items-center gap-1 whitespace-nowrap"
                    >
                      Demo Login <CustomArrowRightSvg className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== 2. INSTITUTE INTRODUCTION & HIGHLIGHTS ==================== */}
        <section className="py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#0056b3] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Academic Excellence in Udaipur
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a0e2a] mt-3">
                {siteContent.introHeading}
              </h2>
              <p className="text-slate-600 mt-3 leading-relaxed text-sm sm:text-base">
                {siteContent.introText}
              </p>
            </div>

            {/* 4 Core Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {siteContent.whyChooseUs.map((item, idx) => {
                const icons = [Users, BookOpen, FileCheck, GraduationCap];
                const IconComp = icons[idx % icons.length];
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/90 cga-card-hover"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#0056b3] text-white flex items-center justify-center mb-4 shadow-sm">
                      <IconComp className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-extrabold text-[#0a0e2a] mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==================== 3. FOUR COURSE CATEGORIES STRIP ==================== */}
        <section className="py-14 bg-slate-50 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#dc2626]">
                  Structured Coaching Wings
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a0e2a] mt-1">
                  Explore Our 4 Academic & Competitive Divisions
                </h2>
              </div>
              <Link
                href="/courses"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0056b3] hover:underline"
              >
                View All {courses.length} Active Courses <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  title: 'Teaching & Recruitment Exams',
                  subtitle: 'TET (I & II), STGT, STPGT, TPSC, JRBT',
                  badge: '5 Flagship Batches',
                  color: 'border-t-4 border-t-[#0056b3]',
                  href: '/courses?category=Teaching+and+Recruitment+Exams',
                },
                {
                  title: 'Banking, SSC & Railway',
                  subtitle: 'IBPS PO/Clerk, SBI, SSC CGL/CHSL/MTS, RRB NTPC',
                  badge: '3 Specialized Batches',
                  color: 'border-t-4 border-t-[#ea580c]',
                  href: '/courses?category=Banking,+SSC+and+Railway',
                },
                {
                  title: 'Other Competitive Exams',
                  subtitle: 'Tripura Police SI, TSR, Defence & CUET (UG)',
                  badge: '2 Target Batches',
                  color: 'border-t-4 border-t-[#dc2626]',
                  href: '/courses?category=Other+Competitive+Examinations',
                },
                {
                  title: 'School Coaching (Class VII–X)',
                  subtitle: 'Separate Batches for TBSE & CBSE Boards',
                  badge: '8 Board Batches (VII–X)',
                  color: 'border-t-4 border-t-emerald-600',
                  href: '/courses?category=School+Coaching',
                },
              ].map((cat) => (
                <Link
                  key={cat.title}
                  href={cat.href}
                  className={`bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs cga-card-hover flex flex-col justify-between ${cat.color}`}
                >
                  <div>
                    <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 mb-3">
                      {cat.badge}
                    </span>
                    <h3 className="text-base font-extrabold text-[#0a0e2a]">{cat.title}</h3>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{cat.subtitle}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0056b3]">
                    <span>Browse Batches</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== 4. FEATURED COURSES ==================== */}
        <section className="py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#0056b3]">
                  Admissions Open 2026–27
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a0e2a] mt-1">
                  Featured Courses & Upcoming Batches
                </h2>
              </div>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 text-[#0056b3] hover:bg-blue-100 text-sm font-bold transition-colors"
              >
                Explore Complete Course Catalogue
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </section>

        {/* ==================== 5. TOPPERS & ACHIEVEMENTS PREVIEW ==================== */}
        <section className="py-16 lg:py-20 bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#ea580c]">
                  <Trophy className="w-4 h-4" /> Hall of Fame
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a0e2a] mt-1">
                  Our State Rankers & Board Toppers
                </h2>
              </div>
              <Link
                href="/achievements"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#0056b3] hover:underline"
              >
                View All Toppers & Selections <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {topAchievements.map((topper) => (
                <div
                  key={topper.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs cga-card-hover flex flex-col"
                >
                  <div className="p-5 flex items-center gap-3.5 border-b border-slate-100">
                    <img
                      src={topper.photo}
                      alt={topper.name}
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-[#ea580c] shrink-0"
                    />
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded bg-amber-50 text-[#ea580c] border border-amber-200 text-[11px] font-extrabold">
                        {topper.rank}
                      </span>
                      <h3 className="text-base font-extrabold text-[#0a0e2a] mt-1">{topper.name}</h3>
                      <p className="text-xs font-semibold text-[#0056b3]">{topper.exam}</p>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between bg-slate-50/50">
                    <p className="text-xs text-slate-600 italic leading-relaxed">
                      “{topper.quote}”
                    </p>
                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2 text-[11px] font-bold text-slate-400">
                      <span className="whitespace-nowrap">Batch of {topper.year}</span>
                      <span className="text-emerald-600 flex items-center gap-1 whitespace-nowrap shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Verified Ranker
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== 6. FACULTY PREVIEW ==================== */}
        <section className="py-16 lg:py-20 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#0056b3]">
                  Mentors Behind the Ranks
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a0e2a] mt-1">
                  Learn from Tripura’s Most Experienced Educators
                </h2>
              </div>
              <Link
                href="/faculty"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#0056b3] hover:underline"
              >
                Meet All {faculty.length} Faculty Members <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {topFaculty.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs cga-card-hover flex flex-col"
                >
                  <div className="flex items-center gap-3.5 mb-4">
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-[#0056b3]/20 shrink-0"
                    />
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-[#0056b3] text-[11px] font-bold">
                        {member.experience}
                      </span>
                      <h3 className="text-base font-extrabold text-[#0a0e2a] mt-1">
                        {member.name}
                      </h3>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-[#0056b3] mb-1">{member.subject}</p>
                  <p className="text-xs text-slate-500 font-medium mb-3">{member.qualification}</p>
                  <p className="text-xs text-slate-600 leading-relaxed mt-auto line-clamp-3">
                    {member.bio}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== 7. STUDENT TESTIMONIALS ==================== */}
        <section className="py-16 bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#dc2626]">
                Student Voices
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a0e2a] mt-1">
                What Aspirants & Parents in Udaipur Say
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {siteContent.testimonials.map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1 text-amber-400 mb-3">
                      {Array.from({ length: t.rating }).map((_, idx) => (
                        <Star key={idx} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed italic">“{t.content}”</p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <p className="text-sm font-extrabold text-[#0a0e2a]">{t.name}</p>
                    <p className="text-xs font-semibold text-[#0056b3]">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== 8. REGISTRATION CALL-TO-ACTION ==================== */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="cga-gradient-hero rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="space-y-3 max-w-2xl text-center lg:text-left">
                <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-amber-300 text-xs font-bold uppercase tracking-wider">
                  Start Your Preparation Today
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold">
                  Ready to Join Career Guidance Academy (C.G.A), Udaipur?
                </h2>
                <p className="text-sm sm:text-base text-blue-100 leading-relaxed">
                  Register on our Student Portal to browse live seat availability, pay fees in full or
                  convenient instalments, unlock watermarked PDF study books, and attempt timed mock
                  tests.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 shrink-0">
                <Link
                  href="/register"
                  className="px-6 py-3.5 rounded-xl bg-[#ea580c] hover:bg-orange-600 text-white font-bold text-sm shadow-lg transition-all"
                >
                  Create Student Account
                </Link>
                <Link
                  href="/contact"
                  className="px-6 py-3.5 rounded-xl bg-white text-[#0a0e2a] hover:bg-blue-50 font-bold text-sm transition-all"
                >
                  Visit Udaipur Office
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
