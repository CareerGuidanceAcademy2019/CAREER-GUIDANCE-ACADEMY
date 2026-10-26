'use client';

import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  ClipboardCheck,
  CreditCard,
  Bell,
  ArrowRight,
  GraduationCap,
  FileText,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { CustomCheckSvg, CustomArrowRightSvg } from '@/components/ui/CustomIcons';

export default function StudentDashboardPage() {
  const { db, currentStudent } = useCga();

  if (!currentStudent) return null;

  const enrolledCourseIds = currentStudent.enrollments.map((e) => e.courseId);
  const totalFee = currentStudent.enrollments.reduce((acc, e) => acc + e.totalFee, 0);
  const totalPaid = currentStudent.enrollments.reduce((acc, e) => acc + e.paidAmount, 0);
  const totalDue = currentStudent.enrollments.reduce((acc, e) => acc + e.dueAmount, 0);

  const enrolledSeriesIds = [
    ...(db.seriesEnrollments || [])
      .filter((se) => se.studentId === currentStudent.id || se.studentId === 'me')
      .map((se) => se.seriesId),
    ...(db.feePayments || [])
      .filter(
        (p) =>
          (p.studentId === currentStudent.id || p.studentId === 'me') &&
          p.status === 'Verified' &&
          (p.itemType === 'mock_series' || (p.itemId && p.itemId.startsWith('series-')) || (p.courseId && p.courseId.startsWith('series-')))
      )
      .map((p) => p.itemId || p.courseId)
      .filter(Boolean) as string[],
  ];

  const upcomingTests = db.mockTests.filter((t) => {
    const isPub = t.status === 'Published' || (t.status as any) === 'ready';
    if (!isPub) return false;
    if (t.courseId && enrolledCourseIds.includes(t.courseId)) return true;
    if (t.seriesId && enrolledSeriesIds.includes(t.seriesId)) return true;
    return false;
  });

  const relevantAnnouncements = db.announcements.filter(
    (a) => a.targetBatch === 'All Batches' || enrolledCourseIds.includes(a.targetBatch)
  );

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="cga-gradient-hero rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="inline-block px-3 py-0.5 rounded-full bg-white/15 text-amber-300 text-xs font-bold uppercase tracking-wider">
            Student ID: {currentStudent.studentCode} • {currentStudent.status}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            Welcome back, {currentStudent.name}!
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm max-w-2xl">
            Target Wing: <strong>{currentStudent.targetExam}</strong> • Track your classroom batches,
            watermarked study books, timed mock tests, and fee receipts below.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/student/courses"
            className="px-4 py-2.5 rounded-xl bg-[#ea580c] hover:bg-orange-600 text-white text-xs font-bold shadow-sm transition-all whitespace-nowrap"
          >
            + Enrol in New Course
          </Link>
          <Link
            href="/student/tests"
            className="px-4 py-2.5 rounded-xl bg-white text-[#0a0e2a] hover:bg-blue-50 text-xs font-bold shadow-sm transition-all whitespace-nowrap"
          >
            Attempt Mock Test
          </Link>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0056b3] flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">Enrolled Courses</span>
            <p className="text-2xl font-extrabold text-[#0a0e2a]">
              {currentStudent.enrollments.length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#ea580c] flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">Scheduled Mock Tests</span>
            <p className="text-2xl font-extrabold text-[#0a0e2a]">{upcomingTests.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">Total Fee Paid</span>
            <p className="text-2xl font-extrabold text-emerald-700 whitespace-nowrap">
              ₹{totalPaid.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              totalDue > 0 ? 'bg-red-50 text-[#dc2626]' : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            {totalDue > 0 ? (
              <AlertCircle className="w-6 h-6" />
            ) : (
              <CheckCircle2 className="w-6 h-6" />
            )}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">Pending Fee Dues</span>
            <p
              className={`text-2xl font-extrabold whitespace-nowrap ${
                totalDue > 0 ? 'text-[#dc2626]' : 'text-emerald-600'
              }`}
            >
              ₹{totalDue.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 7 Cols: Enrolled Courses & Upcoming Mock Tests */}
        <div className="lg:col-span-7 space-y-6">
          {/* Enrolled Courses Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex items-center justify-between gap-2 mb-5">
              <h2 className="text-lg font-extrabold text-[#0a0e2a] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#0056b3] shrink-0" /> My Enrolled Batches
              </h2>
              <Link
                href="/student/my-courses"
                className="text-xs font-bold text-[#0056b3] hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {currentStudent.enrollments.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-sm font-bold text-slate-700">No active courses enrolled yet.</p>
                <Link
                  href="/student/courses"
                  className="inline-block mt-3 px-4 py-2 rounded-xl bg-[#0056b3] text-white text-xs font-bold"
                >
                  Browse Catalogue & Enrol
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {currentStudent.enrollments.map((enr) => (
                  <div
                    key={enr.courseId}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded bg-blue-100 text-[#0056b3] text-[11px] font-bold">
                          {enr.batchName}
                        </span>
                        <h3 className="text-sm font-extrabold text-[#0a0e2a] mt-1">
                          {enr.courseName}
                        </h3>
                        <p className="text-xs text-slate-500">Faculty: {enr.facultyName}</p>
                      </div>
                      <span className="text-xs font-extrabold text-[#0056b3] whitespace-nowrap shrink-0">
                        {enr.progress}% Syllabus Done
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-[#0056b3] rounded-full"
                        style={{ width: `${enr.progress}%` }}
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                      <Link
                        href="/student/materials"
                        className="font-bold text-[#0056b3] hover:underline inline-flex items-center gap-1 whitespace-nowrap"
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" /> Open Study Materials
                      </Link>
                      {enr.dueAmount > 0 ? (
                        <Link
                          href="/student/fees"
                          className="font-bold text-[#dc2626] hover:underline inline-flex items-center gap-1 whitespace-nowrap"
                        >
                          Due: ₹{enr.dueAmount.toLocaleString('en-IN')} (Pay Now{' '}
                          <CustomArrowRightSvg className="w-3 h-3" />)
                        </Link>
                      ) : (
                        <span className="font-bold text-emerald-600 inline-flex items-center gap-1 whitespace-nowrap">
                          <CustomCheckSvg className="w-3.5 h-3.5" /> Fee Fully Paid
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Mock Tests */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex items-center justify-between gap-2 mb-5">
              <h2 className="text-lg font-extrabold text-[#0a0e2a] flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-[#ea580c] shrink-0" /> Upcoming & Live Mock
                Tests
              </h2>
              <Link
                href="/student/tests"
                className="text-xs font-bold text-[#0056b3] hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                Go to Test Arena <CustomArrowRightSvg className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingTests.map((test) => (
                <div
                  key={test.id}
                  className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#0056b3]/40 transition-colors"
                >
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-[#ea580c] uppercase block">
                      {test.batchName} • {test.durationMinutes} Mins • {test.totalMarks} Marks
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">{test.title}</h3>
                    <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                      <span className="inline-flex items-center gap-1 whitespace-nowrap font-medium text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-[#0056b3] shrink-0" /> Scheduled:{' '}
                        {test.scheduledDate}
                      </span>
                      <span className="whitespace-nowrap text-slate-400">
                        (Negative Marking: -{test.negativeMarking})
                      </span>
                    </p>
                  </div>
                  <Link
                    href={`/student/tests?attempt=${test.id}`}
                    className="px-4 py-2 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold shrink-0 text-center whitespace-nowrap"
                  >
                    Attempt Now
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Announcements & Fee Status Summary */}
        <div className="lg:col-span-5 space-y-6">
          {/* Announcements Bulletin */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs">
            <h2 className="text-lg font-extrabold text-[#0a0e2a] flex items-center gap-2 mb-5">
              <Bell className="w-5 h-5 text-[#dc2626] shrink-0" /> Institute & Batch Notices
            </h2>

            <div className="space-y-4">
              {relevantAnnouncements.map((ann) => (
                <div
                  key={ann.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase whitespace-nowrap shrink-0 ${
                          ann.priority === 'Urgent'
                            ? 'bg-red-100 text-[#dc2626]'
                            : ann.priority === 'Important'
                            ? 'bg-amber-100 text-[#ea580c]'
                            : 'bg-blue-100 text-[#0056b3]'
                        }`}
                      >
                        {ann.priority}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-200/70 text-slate-700 text-[10px] font-bold uppercase truncate max-w-[200px]">
                        {ann.targetLabel}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold whitespace-nowrap shrink-0 ml-auto">
                      {ann.date}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                    {ann.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Fee Status Summary */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h2 className="text-lg font-extrabold text-[#0a0e2a] flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#0056b3] shrink-0" /> Fee Summary
            </h2>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Total Enrolled Course Fees:</span>
                <span className="font-bold text-slate-900 whitespace-nowrap">
                  ₹{totalFee.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Amount Paid Till Date:</span>
                <span className="font-bold text-emerald-600 whitespace-nowrap">
                  ₹{totalPaid.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2 text-sm">
                <span className="font-bold text-slate-800">Balance Due:</span>
                <span className="font-extrabold text-[#dc2626] whitespace-nowrap">
                  ₹{totalDue.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <Link
              href="/student/fees"
              className="block w-full py-3 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold text-center"
            >
              View Payment History & Download Receipts
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
