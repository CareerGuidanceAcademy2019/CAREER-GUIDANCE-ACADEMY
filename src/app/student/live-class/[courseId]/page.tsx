'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Video,
  ArrowLeft,
  Clock,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Calendar,
  BookOpen,
  User,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';

export default function StudentLiveClassUpdatesPage() {
  const params = useParams();
  const courseId = typeof params?.courseId === 'string' ? params.courseId : '';
  const { db, currentStudent, session, showToast } = useCga();
  const [copied, setCopied] = useState(false);

  const course = useMemo(
    () => db.courses.find((c) => c.id === courseId),
    [db.courses, courseId]
  );

  const isEnrolledOrAdmin = useMemo(() => {
    if (session?.role === 'ADMIN' || session?.role === 'FACULTY') return true;
    if (!currentStudent) return false;
    return currentStudent.enrollments.some((e) => e.courseId === courseId);
  }, [session, currentStudent, courseId]);

  const liveUpdate = useMemo(() => {
    const mapUpdate = db.siteContent?.onlineClassUpdates?.[courseId];
    if (mapUpdate) return mapUpdate;
    if (course?.onlineClassUpdate) return course.onlineClassUpdate;
    if (course?.onlineClassLink) {
      return {
        courseId,
        link: course.onlineClassLink,
        timing: course.schedule || '',
        details: 'Faculty has shared the live lecture meeting room. Click Join Live Class below to attend.',
        updatedAt: new Date().toISOString(),
      };
    }
    return null;
  }, [db.siteContent?.onlineClassUpdates, course, courseId]);

  const hasAnyUpdate = Boolean(
    liveUpdate && (liveUpdate.link?.trim() || liveUpdate.details?.trim() || liveUpdate.timing?.trim())
  );
  const activeLink = liveUpdate?.link?.trim() || '';
  const isJoinEnabled = Boolean(activeLink);

  const handleCopyLink = () => {
    if (!activeLink) return;
    navigator.clipboard.writeText(activeLink);
    setCopied(true);
    showToast('Link Copied!', 'Live class meeting URL copied to clipboard.', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!course) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-4">
        <Link
          href="/student/my-learning"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0056b3] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Learning Hub
        </Link>
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h2 className="text-lg font-extrabold text-[#0a0e2a]">Course Not Found</h2>
          <p className="text-xs text-slate-500">
            The requested online course could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/student/my-learning"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-2xs transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Enrolled Courses
        </Link>

        {session?.role === 'ADMIN' && (
          <Link
            href={`/admin/courses/${courseId}/live-class`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
          >
            <Video className="w-3.5 h-3.5" /> Edit / Share Class Link (Admin)
          </Link>
        )}
      </div>

      {/* Course Header Card */}
      <div className="cga-gradient-hero text-white rounded-3xl p-6 sm:p-8 shadow-lg space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider">
            <Video className="w-3.5 h-3.5" /> Online Live Class Updates Room
          </span>
          <span className="px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-300/30 text-white text-[11px] font-bold">
            {course.batchName}
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-white leading-snug">
          {course.name}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-200 pt-1">
          <span className="inline-flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-amber-300" />
            Faculty: <strong>{course.facultyName || 'C.G.A Expert Faculty'}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-300" />
            Batch Schedule: <strong>{course.schedule}</strong>
          </span>
        </div>
      </div>

      {/* Access Guard or Live Class Updates Content */}
      {!isEnrolledOrAdmin ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-extrabold text-[#0a0e2a]">
            Enrolment Required to Access Live Class Links
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Live class meeting links (Google Meet / Zoom) and batch timing updates are exclusively available to students enrolled in <strong>{course.name}</strong>.
          </p>
          <div className="pt-2">
            <Link
              href="/student/courses"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-extrabold shadow-xs"
            >
              <BookOpen className="w-4 h-4" /> View Course &amp; Enrol
            </Link>
          </div>
        </div>
      ) : !hasAnyUpdate ? (
        /* Empty State when Admin has not posted any link or update yet */
        <div
          data-testid="empty-live-class-state"
          className="bg-white rounded-3xl border border-slate-200 p-10 sm:p-14 text-center space-y-4 shadow-2xs"
        >
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Video className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg sm:text-xl font-black text-[#0a0e2a]">
              No links or update yet
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              The administrator or faculty has not posted a live class link or timing update for this batch yet. Please check back before your scheduled class time.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-200 text-slate-500 text-xs sm:text-sm font-extrabold cursor-not-allowed opacity-75"
            >
              <Video className="w-4 h-4" />
              <span>Join Live Class (Disabled)</span>
            </button>
          </div>
        </div>
      ) : (
        /* Active Live Class Update Card */
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              {isJoinEnabled ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-extrabold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Class Link Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-extrabold">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  Class Timing &amp; Update Posted (Link Pending)
                </span>
              )}
            </div>

            {liveUpdate?.updatedAt && (
              <span className="text-[11px] font-semibold text-slate-400">
                Updated:{' '}
                {new Date(liveUpdate.updatedAt).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            )}
          </div>

          {/* Class Timing Box */}
          {liveUpdate?.timing && (
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0056b3] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Scheduled Class Timing
              </span>
              <p className="text-sm sm:text-base font-black text-[#0a0e2a]">
                {liveUpdate.timing}
              </p>
            </div>
          )}

          {/* Class Details / Instructions Box */}
          {liveUpdate?.details && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                Class Update &amp; Faculty Instructions
              </span>
              <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed font-medium">
                {liveUpdate.details}
              </p>
            </div>
          )}

          {/* Join Live Class Action Area */}
          <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-indigo-950">
                {isJoinEnabled
                  ? 'Google Meet / Zoom Classroom is Ready'
                  : 'Meeting Link Not Shared Yet'}
              </h3>
              <p className="text-xs text-indigo-900/80 leading-relaxed">
                {isJoinEnabled
                  ? 'Click the Join Live Class button to enter the online lecture room immediately.'
                  : 'The administrator has posted the class timing/details above. The "Join Live Class" button will automatically enable once the meeting link is posted.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {isJoinEnabled ? (
                <>
                  <a
                    href={activeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="join-live-class-btn-enabled"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-extrabold shadow-md cursor-pointer transition-all"
                  >
                    <Video className="w-4 h-4" />
                    <span>Join Live Class</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 px-3.5 py-3 rounded-2xl bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-bold cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled
                  data-testid="join-live-class-btn-disabled"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-200 text-slate-500 border border-slate-300 text-xs sm:text-sm font-extrabold cursor-not-allowed opacity-80"
                >
                  <Video className="w-4 h-4" />
                  <span>Join Live Class</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
