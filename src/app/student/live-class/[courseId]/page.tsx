'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Video,
  ArrowLeft,
  Clock,
  ExternalLink,
  AlertCircle,
  Calendar,
  BookOpen,
  User,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';

export default function StudentLiveClassUpdatesPage() {
  const params = useParams();
  const courseId = typeof params?.courseId === 'string' ? params.courseId : '';
  const { db, currentStudent, session } = useCga();
  const [currentTime] = useState(() => Date.now());

  const course = useMemo(
    () => db.courses.find((c) => c.id === courseId),
    [db.courses, courseId]
  );

  const isAdminOrFaculty = session?.role === 'ADMIN' || session?.role === 'FACULTY';

  // Strict active enrollment lookup for this exact online course
  const studentEnrollment = useMemo(() => {
    if (!currentStudent) return null;
    return currentStudent.enrollments.find((e) => e.courseId === courseId) || null;
  }, [currentStudent, courseId]);

  const isEnrollmentExpired = Boolean(
    !isAdminOrFaculty &&
      studentEnrollment?.accessValidUntil &&
      new Date(studentEnrollment.accessValidUntil).getTime() < currentTime
  );

  const isStrictlyAuthorized = Boolean(
    isAdminOrFaculty || (studentEnrollment && !isEnrollmentExpired)
  );

  const isOnlineCourse = course?.mode === 'Online';

  const liveUpdate = useMemo(() => {
    const mapUpdate = db.siteContent?.onlineClassUpdates?.[courseId];
    if (mapUpdate) return mapUpdate;
    if (course?.onlineClassUpdate) return course.onlineClassUpdate;
    if (course?.hasOnlineClassLink || course?.onlineClassLink) {
      return {
        courseId,
        hasLink: true,
        timing: course.schedule || '',
        details: 'Faculty has shared the live lecture meeting room. Click Join Live Class below to attend.',
        updatedAt: new Date().toISOString(),
      };
    }
    return null;
  }, [db.siteContent?.onlineClassUpdates, course, courseId]);

  const isJoinEnabled = Boolean(
    liveUpdate?.hasLink ||
      (liveUpdate?.link && liveUpdate.link.trim().length > 0) ||
      course?.hasOnlineClassLink ||
      (course?.onlineClassLink && course.onlineClassLink.trim().length > 0)
  );

  const hasAnyUpdate = Boolean(
    isJoinEnabled || liveUpdate?.details?.trim() || liveUpdate?.timing?.trim()
  );

  // Opens the server-verified join redirect endpoint — raw Google Meet / Zoom URL is NEVER exposed in the DOM
  const handleJoinLiveClass = () => {
    if (!isJoinEnabled || !isStrictlyAuthorized || !isOnlineCourse) return;
    const joinUrl = `/api/student/live-class/join?courseId=${encodeURIComponent(courseId)}`;
    window.open(joinUrl, '_blank', 'noopener,noreferrer');
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

      {/* Strict Guards: 1) Must be Online Course, 2) Must be Actively Enrolled Student */}
      {!isOnlineCourse ? (
        <div
          data-testid="offline-course-blocked-state"
          className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-3 shadow-2xs"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-extrabold text-[#0a0e2a]">
            Offline Classroom Batch — No Online Live Class Room
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            <strong>{course.name}</strong> is an offline classroom batch conducted at the C.G.A Udaipur Center. Online live class rooms are only available for enrolled Online courses.
          </p>
          <div className="pt-2">
            <Link
              href="/student/my-learning"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-extrabold shadow-xs"
            >
              Return to My Learning
            </Link>
          </div>
        </div>
      ) : !isStrictlyAuthorized ? (
        <div
          data-testid="strict-enrollment-lock-state"
          className="bg-white rounded-3xl border border-rose-200 p-10 text-center space-y-3 shadow-2xs"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-extrabold text-[#0a0e2a]">
            {isEnrollmentExpired
              ? 'Course Access Expired — Live Class Locked'
              : 'Restricted: Enrolled Students Only'}
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {isEnrollmentExpired
              ? `Your enrollment validity for ${course.name} has expired. Please contact Career Guidance Academy administration to renew your batch access.`
              : `Strictly only students enrolled in ${course.name} can enter this online course room and join live classes.`}
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
              data-testid="join-live-class-btn-disabled"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-200 text-slate-500 text-xs sm:text-sm font-extrabold cursor-not-allowed opacity-75"
            >
              <Video className="w-4 h-4" />
              <span>Join Live Class</span>
            </button>
          </div>
        </div>
      ) : (
        /* Active Live Class Update Card (Raw meeting link is NEVER shown in text or DOM) */
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              {isJoinEnabled ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-extrabold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Class Ready to Join
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

          {/* Join Live Class Action Area — Button Only, Raw URL Hidden */}
          <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-indigo-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  {isJoinEnabled
                    ? 'Online Classroom Session is Active'
                    : 'Waiting for Administrator to Enable Class Link'}
                </span>
              </h3>
              <p className="text-xs text-indigo-900/80 leading-relaxed">
                {isJoinEnabled
                  ? 'Click the Join Live Class button to enter the live classroom securely. Direct meeting links are protected for enrolled students only.'
                  : 'The administrator has posted the class timing/details above. The "Join Live Class" button will enable automatically once the link is shared.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                disabled={!isJoinEnabled}
                onClick={handleJoinLiveClass}
                data-testid={isJoinEnabled ? 'join-live-class-btn-enabled' : 'join-live-class-btn-disabled'}
                className={
                  isJoinEnabled
                    ? 'inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-extrabold shadow-md cursor-pointer transition-all'
                    : 'inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-200 text-slate-500 border border-slate-300 text-xs sm:text-sm font-extrabold cursor-not-allowed opacity-80'
                }
              >
                <Video className="w-4 h-4" />
                <span>Join Live Class</span>
                {isJoinEnabled && <ExternalLink className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
