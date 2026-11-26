'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  Calendar,
  Clock,
  GraduationCap,
  CheckCircle2,
  Lock,
  ArrowRight,
  Printer,
  BookOpen,
  Layers,
  Sparkles,
  Check,
  ShoppingBag,
} from 'lucide-react';
import { Course } from '@/data/initialSeedData';
import { CustomWaitlistSvg } from '@/components/ui/CustomIcons';
import { formatFacultyName } from '@/lib/names';
import { useCga } from '@/context/CgaContext';

interface CourseCardProps {
  course: Course;
  isEnrolled?: boolean;
  isPending?: boolean;
  onSelectCourse?: (course: Course) => void;
  onJoinWaitlist?: (course: Course) => void;
  compact?: boolean;
  index?: number;
}

const SEED_COURSE_IDS = new Set([
  'crs-tcs-tps-offline',
  'crs-tcs-tps-online',
  'crs-tpsc-combined-offline',
  'crs-tpsc-combined-online',
  'crs-tet-1-offline',
  'crs-tet-1-online',
  'crs-tet-2-sci-offline',
  'crs-tet-2-sci-online',
  'crs-tet-2-sst-offline',
  'crs-tet-2-sst-online',
  'crs-stgt-sst-offline',
  'crs-stgt-sst-online',
  'crs-stgt-pure-sci-offline',
  'crs-stgt-pure-sci-online',
  'crs-stgt-bio-sci-offline',
  'crs-stgt-bio-sci-online',
  'crs-jrbt-offline',
  'crs-jrbt-online',
  'crs-banking-offline',
  'crs-banking-online',
  'crs-school-7',
  'crs-school-8',
  'crs-school-9',
  'crs-school-10',
]);

// Distinct rich academic card gradients for Courses (differentiated from the blue/indigo Mock Test cards)
const COURSE_CARD_GRADIENTS = [
  'from-[#052e2b] via-[#064e3b] to-[#0f172a]', // Deep Emerald & Midnight Slate
  'from-[#2e1026] via-[#4c1d3d] to-[#111827]', // Royal Burgundy & Plum Charcoal
  'from-[#311b08] via-[#5c3111] to-[#111827]', // Warm Bronze & Dark Umber
  'from-[#082f49] via-[#0e4f68] to-[#0f172a]', // Deep Teal & Ocean Slate
  'from-[#1e1038] via-[#341b5e] to-[#111827]', // Royal Mulberry & Deep Violet
];

export function CourseCard({
  course,
  isEnrolled = false,
  isPending = false,
  onSelectCourse,
  onJoinWaitlist,
  compact = false,
  index = 0,
}: CourseCardProps) {
  const { session } = useCga();
  const isOpen = course.status === 'Open for Admission' && course.seatsAvailable > 0;
  const isNewLaunch = !SEED_COURSE_IDS.has(course.id);
  const seatsTaken = Math.max(0, course.batchSize - course.seatsAvailable);
  const fillPercent = Math.min(100, Math.round((seatsTaken / Math.max(1, course.batchSize)) * 100));

  // Pick a distinct gradient based on category/index so Courses have their own signature look
  const hashIndex =
    index > 0
      ? index
      : course.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const gradient = COURSE_CARD_GRADIENTS[hashIndex % COURSE_CARD_GRADIENTS.length];

  const mrpPrice = Math.max(course.price + 1500, Math.round(course.price * 1.25));
  const discountPercent = Math.max(10, Math.round(((mrpPrice - course.price) / mrpPrice) * 100));

  const highlights =
    Array.isArray(course.syllabusHighlights) && course.syllabusHighlights.length > 0
      ? course.syllabusHighlights.slice(0, compact ? 3 : 4)
      : [
          'Complete Official Syllabus Coverage',
          'Weekly OMR & Online CBT Mock Tests',
          'Printed & View-Only Digital Study Notes',
          'Personal Mentorship & Doubt Clearing',
        ].slice(0, compact ? 3 : 4);

  const targetEnrollPath = `/student/courses?enrol=${encodeURIComponent(course.id)}`;
  const buyHref = session
    ? targetEnrollPath
    : `/login?next=${encodeURIComponent(targetEnrollPath)}`;

  return (
    <div
      className={`bg-gradient-to-br ${gradient} text-white shadow-xl border border-white/15 cga-card-hover flex flex-col justify-between overflow-hidden relative ${
        compact ? 'p-5' : 'p-6'
      }`}
    >
      {/* Top decorative glow & accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400" />
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/[0.06] rounded-full blur-2xl pointer-events-none" />

      <div className="space-y-3 relative z-10 flex-1 flex flex-col">
        {/* Top Badges Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`px-2.5 py-0.5 font-black text-[10px] uppercase tracking-wider ${
                isNewLaunch
                  ? 'bg-lime-400 text-slate-950'
                  : isOpen
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-red-500/90 text-white'
              }`}
            >
              {isNewLaunch
                ? 'NEW COURSE LAUNCH!'
                : isOpen
                ? 'ADMISSIONS OPEN!'
                : 'BATCH CLOSED'}
            </span>

            <span
              className={`px-2.5 py-0.5 font-extrabold text-[10px] uppercase tracking-wider border ${
                course.mode === 'Online'
                  ? 'bg-cyan-400/20 text-cyan-200 border-cyan-400/40'
                  : 'bg-white/15 text-amber-200 border-white/25'
              }`}
            >
              {course.mode === 'Online' ? 'Online Live' : 'Offline Classroom'}
            </span>

            {course.isPackageBundle && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold bg-purple-400/25 text-purple-200 border border-purple-300/40">
                <Layers className="w-3 h-3" /> Bundle
              </span>
            )}
          </div>

          <span className="text-[11px] font-bold text-emerald-200 truncate max-w-[160px]">
            {course.subCategory}
          </span>
        </div>

        {/* Category & Title */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/65 mb-0.5">
            {course.category} {course.board ? `• ${course.board}` : ''}
          </p>
          <h3 className={`${compact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'} font-black text-white leading-snug line-clamp-2`}>
            {course.name}
          </h3>
        </div>

        {/* Single-Line Overview */}
        <p className="text-xs text-white/85 leading-relaxed line-clamp-1" title={course.description}>
          {course.description || `${course.name} — ${course.batchName} coached by ${formatFacultyName(course.facultyName)}.`}
        </p>

        {/* Distinct Framed Price & Schedule Panel */}
        <div className="p-3 bg-white/[0.08] border border-white/15 space-y-1.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className={`${compact ? 'text-2xl' : 'text-3xl'} font-black text-amber-300`}>
                ₹{course.price.toLocaleString('en-IN')}/-
              </span>
              <span className="text-[10px] text-white/80 font-bold uppercase">Only</span>
              <span className="text-xs text-white/50 line-through">
                ₹{mrpPrice.toLocaleString('en-IN')}
              </span>
              {course.monthlyFee ? (
                <span className="text-[11px] font-extrabold text-cyan-300 bg-cyan-950/60 border border-cyan-400/30 px-2 py-0.5">
                  + ₹{course.monthlyFee.toLocaleString('en-IN')}/mo
                </span>
              ) : null}
            </div>

            <span className="px-2 py-0.5 bg-emerald-500/25 border border-emerald-400/40 text-emerald-200 text-[10px] font-black uppercase">
              {discountPercent}% OFF
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/80 pt-1 border-t border-white/10">
            <span className="truncate">
              <strong className="text-white">Faculty:</strong> {formatFacultyName(course.facultyName)}
            </span>
            <span className="text-amber-200 font-semibold whitespace-nowrap">
              {course.duration} • {course.seatsAvailable} Seats Left
            </span>
          </div>
        </div>

        {/* Checkmarked Highlights (Image 1 reference style) */}
        <ul className="space-y-1.5 text-xs text-white/90 pt-1">
          {highlights.map((item, idx) => (
            <li key={idx} className="flex items-start gap-1.5 font-medium">
              <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0 mt-0.5" />
              <span className="line-clamp-1">{item}</span>
            </li>
          ))}
          <li className="flex items-start gap-1.5 font-medium text-amber-200">
            {course.mode === 'Offline' ? (
              <>
                <Printer className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
                <span className="line-clamp-1">Printed Notes at Udaipur Center + View-Only PDF</span>
              </>
            ) : (
              <>
                <BookOpen className="w-3.5 h-3.5 text-cyan-300 shrink-0 mt-0.5" />
                <span className="line-clamp-1">Interactive Live Classes + View-Only Softcopy Notes</span>
              </>
            )}
          </li>
        </ul>

        {/* Seat progress bar in detailed view */}
        {!compact && (
          <div className="pt-2 mt-auto">
            <div className="flex items-center justify-between gap-2 text-[11px] mb-1 text-white/80">
              <span className="truncate">
                {isOpen ? (
                  <>
                    <strong className="text-amber-300">{course.seatsAvailable} seats</strong> open out of{' '}
                    {course.batchSize}
                  </>
                ) : (
                  <span className="text-red-300 font-semibold">
                    All {course.batchSize} seats filled • Waitlist: {course.waitingListCount}
                  </span>
                )}
              </span>
              <span className="text-white/60 font-semibold shrink-0">{fillPercent}% Full</span>
            </div>
            <div className="w-full h-1.5 bg-white/15 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  !isOpen
                    ? 'bg-red-500'
                    : course.seatsAvailable <= 6
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Full-Width CTA Button (Image 1 style) */}
      <div className="pt-4 mt-4 border-t border-white/15 relative z-10">
        {isEnrolled ? (
          <Link
            href="/student/my-learning"
            className="w-full py-2.5 px-4 bg-emerald-500/25 hover:bg-emerald-500/35 border border-emerald-400/50 text-emerald-200 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>Enrolled &amp; Active — Open Classroom</span>
          </Link>
        ) : isPending ? (
          <Link
            href="/student/my-learning"
            className="w-full py-2.5 px-4 bg-amber-500/25 border border-amber-400/50 text-amber-200 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
          >
            <Clock className="w-4 h-4 shrink-0 text-amber-300 animate-pulse" />
            <span>Verification Pending (Admin Review)</span>
          </Link>
        ) : onSelectCourse ? (
          isOpen ? (
            <button
              type="button"
              onClick={() => onSelectCourse(course)}
              className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
              <span>Buy / Enrol Now @ ₹{course.price.toLocaleString('en-IN')}/-</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onJoinWaitlist && onJoinWaitlist(course)}
              className="w-full py-2.5 px-4 bg-white/15 hover:bg-white/25 border border-white/30 text-amber-200 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <CustomWaitlistSvg className="w-3.5 h-3.5" />
              <span>Batch Full — Join Waiting List</span>
            </button>
          )
        ) : isOpen ? (
          <Link
            href={buyHref}
            className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
          >
            <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
            <span>Buy / Enrol Now @ ₹{course.price.toLocaleString('en-IN')}/-</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </Link>
        ) : (
          <Link
            href="/contact"
            className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/20 border border-white/20 text-slate-200 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Admissions Closed — Enquire Waitlist</span>
          </Link>
        )}
      </div>
    </div>
  );
}
