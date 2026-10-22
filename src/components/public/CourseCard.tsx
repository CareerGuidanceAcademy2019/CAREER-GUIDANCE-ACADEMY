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
} from 'lucide-react';
import { Course } from '@/data/initialSeedData';
import { CustomWaitlistSvg } from '@/components/ui/CustomIcons';
import { formatFacultyName } from '@/lib/names';

interface CourseCardProps {
  course: Course;
  isEnrolled?: boolean;
  isPending?: boolean;
  onSelectCourse?: (course: Course) => void;
  onJoinWaitlist?: (course: Course) => void;
}

export function CourseCard({
  course,
  isEnrolled = false,
  isPending = false,
  onSelectCourse,
  onJoinWaitlist,
}: CourseCardProps) {
  const isOpen = course.status === 'Open for Admission' && course.seatsAvailable > 0;
  const seatsTaken = Math.max(0, course.batchSize - course.seatsAvailable);
  const fillPercent = Math.min(100, Math.round((seatsTaken / course.batchSize) * 100));

  const categoryColor =
    course.category === 'Teaching and Recruitment Exams'
      ? 'bg-blue-50 text-[#0056b3] border-blue-200'
      : course.category === 'Banking, SSC and Railway'
      ? 'bg-orange-50 text-[#ea580c] border-orange-200'
      : course.category === 'School Coaching'
      ? course.board === 'CBSE'
        ? 'bg-purple-50 text-purple-700 border-purple-200'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs cga-card-hover flex flex-col justify-between overflow-hidden relative">
      {/* Top accent stripe */}
      <div
        className={`h-1.5 w-full ${
          isOpen ? 'bg-gradient-to-r from-[#0056b3] via-[#1e3a8a] to-[#ea580c]' : 'bg-slate-300'
        }`}
      />

      <div className="p-6 flex-1 flex flex-col">
        {/* Category & Status Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${categoryColor}`}
            >
              {course.subCategory}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${
                course.mode === 'Online'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {course.mode === 'Online' ? 'Online Live' : 'Offline Classroom'}
            </span>
          </div>

          {isOpen ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              Open for Admission
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-[#dc2626] border border-red-200 whitespace-nowrap shrink-0">
              <Lock className="w-3 h-3 shrink-0" />
              Batch Closed
            </span>
          )}
        </div>

        {/* Course Category Sub-label */}
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
          {course.category}
        </p>

        {/* Course Title */}
        <h3 className="text-lg font-extrabold text-[#0a0e2a] leading-snug mb-2 line-clamp-2">
          {course.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-600 leading-relaxed mb-3 line-clamp-2">
          {course.description}
        </p>

        {/* Material Delivery Notice */}
        <div className="mb-3">
          {course.mode === 'Offline' ? (
            <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50/90 px-2.5 py-1.5 rounded-xl border border-emerald-200/80 flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>Physical printed booklets at Udaipur center + view-only softcopy</span>
            </div>
          ) : (
            <div className="text-[11px] font-semibold text-blue-800 bg-blue-50/90 px-2.5 py-1.5 rounded-xl border border-blue-200/80 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#0056b3] shrink-0" />
              <span>Digital study material in secure View-Only Reader mode</span>
            </div>
          )}
        </div>

        {/* Key Metadata Grid */}
        <div className="grid grid-cols-2 gap-2.5 bg-slate-50/90 rounded-xl p-3.5 border border-slate-100 text-xs mb-4 mt-auto">
          <div className="flex items-start gap-2 min-w-0">
            <GraduationCap className="w-4 h-4 text-[#0056b3] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-slate-400 block text-[11px]">Faculty</span>
              <span className="font-semibold text-slate-800 truncate block">
                {formatFacultyName(course.facultyName)}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 min-w-0">
            <Clock className="w-4 h-4 text-[#ea580c] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-slate-400 block text-[11px]">Duration</span>
              <span className="font-semibold text-slate-800 truncate block">{course.duration}</span>
            </div>
          </div>

          <div className="flex items-start gap-2 min-w-0">
            <Calendar className="w-4 h-4 text-[#0056b3] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-slate-400 block text-[11px]">Batch Starts</span>
              <span className="font-semibold text-slate-800 whitespace-nowrap block">
                {new Date(course.startDate).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 min-w-0">
            <Users className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-slate-400 block text-[11px]">Batch Size</span>
              <span className="font-semibold text-slate-800 whitespace-nowrap block">
                {course.batchSize} Seats ({course.seatsAvailable} left)
              </span>
            </div>
          </div>
        </div>

        {/* Seat availability progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
            <span className="font-medium text-slate-600 truncate">
              {isOpen ? (
                <>
                  <strong className="text-[#0056b3]">{course.seatsAvailable} seats</strong> available
                  out of {course.batchSize}
                </>
              ) : (
                <span className="text-[#dc2626] font-semibold">
                  All {course.batchSize} seats filled • Waitlist: {course.waitingListCount}
                </span>
              )}
            </span>
            <span className="text-slate-400 font-semibold whitespace-nowrap shrink-0">
              {fillPercent}% Full
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                !isOpen
                  ? 'bg-[#dc2626]'
                  : course.seatsAvailable <= 6
                  ? 'bg-[#ea580c]'
                  : 'bg-[#0056b3]'
              }`}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Price & CTA Footer */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
            Admission & Monthly Fee
          </span>
          <div className="flex flex-wrap items-baseline gap-x-1.5">
            <span className="text-lg font-extrabold text-[#0a0e2a] whitespace-nowrap">
              ₹{course.price.toLocaleString('en-IN')}
            </span>
            {course.monthlyFee ? (
              <span className="text-xs font-bold text-[#0056b3] whitespace-nowrap">
                + ₹{course.monthlyFee.toLocaleString('en-IN')}/mo
              </span>
            ) : null}
          </div>
        </div>

        {isEnrolled ? (
          <Link
            href="/student/my-learning"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs whitespace-nowrap shrink-0"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Enrolled
          </Link>
        ) : isPending ? (
          <Link
            href="/student/my-learning"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-colors shadow-xs whitespace-nowrap shrink-0"
          >
            <Clock className="w-4 h-4 shrink-0 text-amber-700 animate-pulse" />
            Verification Pending
          </Link>
        ) : onSelectCourse ? (
          isOpen ? (
            <button
              type="button"
              onClick={() => onSelectCourse(course)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0056b3] text-white hover:bg-[#1e3a8a] transition-colors shadow-sm cursor-pointer whitespace-nowrap shrink-0"
            >
              Enrol Now
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onJoinWaitlist && onJoinWaitlist(course)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-amber-50 text-[#ea580c] border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <CustomWaitlistSvg className="w-3.5 h-3.5" />
              Join Waitlist
            </button>
          )
        ) : isOpen ? (
          <Link
            href={`/student/courses?enrol=${course.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0056b3] text-white hover:bg-[#1e3a8a] transition-colors shadow-sm whitespace-nowrap shrink-0"
          >
            Enrol Now
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </Link>
        ) : (
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors whitespace-nowrap shrink-0"
          >
            Enquire Waitlist
          </Link>
        )}
      </div>
    </div>
  );
}
