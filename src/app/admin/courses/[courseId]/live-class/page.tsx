'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Video,
  ArrowLeft,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Send,
  Edit3,
  Copy,
  Check,
  Sparkles,
  FileText,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';

export default function AdminCourseLiveClassPage() {
  const params = useParams();
  const courseId = typeof params?.courseId === 'string' ? params.courseId : '';
  const { db, saveOnlineClassUpdate, showToast } = useCga();

  const course = useMemo(
    () => db.courses.find((c) => c.id === courseId),
    [db.courses, courseId]
  );

  const existingUpdate = useMemo(() => {
    const mapUpdate = db.siteContent?.onlineClassUpdates?.[courseId];
    if (mapUpdate) return mapUpdate;
    if (course?.onlineClassUpdate) return course.onlineClassUpdate;
    if (course?.onlineClassLink) {
      return {
        courseId,
        link: course.onlineClassLink,
        timing: course.schedule || '',
        details: 'Join the scheduled online live lecture using the meeting room link.',
        updatedAt: new Date().toISOString(),
      };
    }
    return null;
  }, [db.siteContent?.onlineClassUpdates, course, courseId]);

  const [classLink, setClassLink] = useState('');
  const [classTiming, setClassTiming] = useState('');
  const [classDetails, setClassDetails] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (existingUpdate) {
      setClassLink(existingUpdate.link || '');
      setClassTiming(existingUpdate.timing || course?.schedule || '');
      setClassDetails(existingUpdate.details || '');
    } else if (course) {
      setClassLink('');
      setClassTiming(course.schedule || '');
      setClassDetails('');
    }
  }, [existingUpdate, course]);

  const handlePublishUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLink = classLink.trim();
    const cleanTiming = classTiming.trim();
    const cleanDetails = classDetails.trim();

    if (!cleanLink && !cleanTiming && !cleanDetails) {
      showToast(
        'Enter Update or Link',
        'Please enter class timing / text details or paste the live class link (Google Meet / Zoom) before posting.',
        'error'
      );
      return;
    }

    setIsSaving(true);
    await saveOnlineClassUpdate(courseId, {
      link: cleanLink || undefined,
      timing: cleanTiming || undefined,
      details: cleanDetails || undefined,
    });
    setIsSaving(false);
  };

  const handleClearUpdate = async () => {
    setIsSaving(true);
    await saveOnlineClassUpdate(courseId, null);
    setClassLink('');
    setClassDetails('');
    setIsSaving(false);
  };

  const handleCopyLink = () => {
    if (!classLink.trim()) return;
    navigator.clipboard.writeText(classLink.trim());
    setCopied(true);
    showToast('Link Copied', 'Live class URL copied to clipboard.', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!course) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-4">
        <Link
          href="/admin/courses"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0056b3] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Course Catalogue
        </Link>
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h2 className="text-lg font-extrabold text-[#0a0e2a]">Online Course Not Found</h2>
          <p className="text-xs text-slate-500">
            Could not locate the specified online course batch ({courseId}).
          </p>
        </div>
      </div>
    );
  }

  const hasActivePost = Boolean(
    existingUpdate && (existingUpdate.link || existingUpdate.details || existingUpdate.timing)
  );
  const hasActiveLink = Boolean(existingUpdate?.link?.trim());

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/courses"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-2xs transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Online Courses &amp; Batches
        </Link>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-extrabold">
            {course.mode === 'Online' ? 'Online Interactive Course' : course.mode || 'Course Batch'}
          </span>
          <span className="px-3 py-1 rounded-full bg-blue-50 text-[#0056b3] border border-blue-200 text-xs font-bold">
            {course.batchName}
          </span>
        </div>
      </div>

      {/* Course Header Banner */}
      <div className="cga-gradient-hero text-white rounded-3xl p-6 sm:p-8 shadow-lg space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider">
          <Video className="w-3.5 h-3.5" /> Live Class Link &amp; Schedule Publisher
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white leading-snug">
          {course.name}
        </h1>
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-2xl">
          Share the Google Meet or Zoom live class link and write class timing &amp; instructions for enrolled students. You can post an update <strong>without a link</strong> to inform students of class timings first (keeping their &ldquo;Join Live Class&rdquo; button disabled), and later <strong>edit &amp; repost with the meeting link</strong> to enable the button immediately.
        </p>
      </div>

      {/* Live Student Preview Status Banner */}
      <div
        className={`rounded-3xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          !hasActivePost
            ? 'bg-slate-50 border-slate-200'
            : hasActiveLink
            ? 'bg-emerald-50/80 border-emerald-200'
            : 'bg-amber-50/80 border-amber-200'
        }`}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Current Student Portal View:
            </span>
            {!hasActivePost ? (
              <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-extrabold">
                &ldquo;No links or update yet&rdquo;
              </span>
            ) : hasActiveLink ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-extrabold">
                <CheckCircle2 className="w-3 h-3" /> &ldquo;Join Live Class&rdquo; Button ENABLED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-extrabold">
                <Clock className="w-3 h-3" /> Timing &amp; Text Posted • &ldquo;Join Live Class&rdquo; Button DISABLED (No Link Yet)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600">
            {!hasActivePost
              ? 'No update or link has been published yet. Enrolled students currently see the empty state "No links or update yet".'
              : hasActiveLink
              ? `Link published (${existingUpdate?.link}). Enrolled students can see your class details and click "Join Live Class".`
              : 'Students can read your class timing and update text, while their "Join Live Class" button stays disabled until you paste a link below and repost.'}
          </p>
        </div>

        <Link
          href={`/student/live-class/${courseId}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-[#0056b3] hover:bg-blue-50 text-xs font-extrabold shrink-0 shadow-2xs"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Preview Student Page
        </Link>
      </div>

      {/* Main Editor Form */}
      <form
        onSubmit={handlePublishUpdate}
        className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-700">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#0a0e2a]">
                {hasActivePost ? 'Edit & Repost Live Class Update' : 'Post Live Class Update & Meeting Link'}
              </h2>
              <p className="text-xs text-slate-500">
                Faculty: {course.facultyName || 'Assigned Faculty'} • Default Schedule: {course.schedule}
              </p>
            </div>
          </div>

          {hasActivePost && (
            <button
              type="button"
              onClick={handleClearUpdate}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Post
            </button>
          )}
        </div>

        <div className="space-y-5 text-xs">
          {/* 1. Class Timing */}
          <div className="space-y-1.5">
            <label className="font-extrabold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#ea580c]" />
              <span>Class Timing / Schedule Notice</span>
            </label>
            <input
              type="text"
              value={classTiming}
              onChange={(e) => setClassTiming(e.target.value)}
              placeholder="e.g. Today at 6:30 PM – 8:30 PM IST (Topic: Child Development & Pedagogy)"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-500">
              Inform enrolled students about the exact date, time, and subject of the upcoming live class.
            </p>
          </div>

          {/* 2. Class Details / Instructions in Text */}
          <div className="space-y-1.5">
            <label className="font-extrabold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#0056b3]" />
              <span>Class Update &amp; Details (Text Message for Enrolled Students)</span>
            </label>
            <textarea
              rows={4}
              value={classDetails}
              onChange={(e) => setClassDetails(e.target.value)}
              placeholder="Write class instructions, topic syllabus, or timing notice here. You can post this text update without a meeting link first, and later edit & repost with the Google Meet / Zoom link when the class is ready to start."
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* 3. Online Class Link (Google Meet / Zoom) — Optional */}
          <div className="space-y-1.5 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80">
            <label className="font-extrabold text-indigo-950 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Video className="w-4 h-4 text-indigo-600" />
                <span>Online Live Class Meeting Link (Google Meet / Zoom) — Optional</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-indigo-700 border border-indigo-200">
                {classLink.trim() ? 'Join Button will be ENABLED' : 'Leave blank to keep Join Button DISABLED'}
              </span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={classLink}
                onChange={(e) => setClassLink(e.target.value)}
                placeholder="https://meet.google.com/abc-defg-hij or https://zoom.us/j/..."
                className="flex-1 px-4 py-3 rounded-xl border border-indigo-200 bg-white font-mono text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {classLink.trim() && (
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3.5 py-3 rounded-xl bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-bold inline-flex items-center gap-1 cursor-pointer"
                  title="Copy URL"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>Copy</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-indigo-900/80 leading-relaxed">
              • If you paste a Google Meet or Zoom link here and post, the <strong>&ldquo;Join Live Class&rdquo;</strong> button becomes <strong>enabled</strong> for all enrolled students.<br />
              • If you leave the link empty and post only class timing/details text, students will see your update while the <strong>&ldquo;Join Live Class&rdquo;</strong> button stays <strong>disabled</strong> until you edit and repost with the link.
            </p>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin/courses"
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs sm:text-sm font-extrabold shadow-md cursor-pointer transition-all"
          >
            <Send className="w-4 h-4" />
            <span>
              {isSaving
                ? 'Publishing Update...'
                : hasActivePost
                ? classLink.trim()
                  ? 'Update & Repost with Live Class Link (Enable Join)'
                  : 'Update & Repost Class Timing Only (Join Disabled)'
                : classLink.trim()
                ? 'Post Live Class Link & Details (Enable Join)'
                : 'Post Class Timing & Details Without Link'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
