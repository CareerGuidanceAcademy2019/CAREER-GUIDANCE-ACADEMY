'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  Video,
  MapPin,
  Clock,
  Calendar,
  CheckCircle2,
  Lock,
  ExternalLink,
  Copy,
  Sparkles,
  ArrowRight,
  FileText,
  UserCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { MockTest, StudentEnrollment } from '@/data/initialSeedData';

export default function StudentMyLearningPage() {
  const router = useRouter();
  const { db, currentStudent, showToast } = useCga();

  const [activeTab, setActiveTab] = useState<'all' | 'courses' | 'tests'>('all');
  const [selectedSeriesFilter, setSelectedSeriesFilter] = useState<string>('all');
  const [copiedLinkTestId, setCopiedLinkTestId] = useState<string | null>(null);

  if (!currentStudent) return null;

  // Student's enrolled courses
  const enrollments: StudentEnrollment[] = currentStudent.enrollments || [];

  // Student's enrolled mock test series IDs
  const enrolledSeriesIds: string[] = (db.seriesEnrollments || [])
    .filter((e) => e.studentId === currentStudent.id)
    .map((e) => e.seriesId);

  // Check if student has special access or specific series enrollment
  const isSpecialAccess =
    currentStudent.email === 'angatsaha825@gmail.com' ||
    (currentStudent as { seriesEnrolled?: boolean }).seriesEnrolled === true;

  // Determine which tests are enrolled for this student
  // A test belongs to the student if:
  // 1. Student is enrolled in the matching courseId
  // 2. Student is enrolled in the series containing this test
  // 3. Special admin test account
  const enrolledMockTests: MockTest[] = db.mockTests.filter((t) => {
    if (isSpecialAccess) return true;
    const enrolledInCourse = enrollments.some((e) => e.courseId === t.courseId);
    if (enrolledInCourse) return true;
    const enrolledInSeries = enrolledSeriesIds.some((sId) => {
      const s = db.mockSeries.find((ms) => ms.id === sId);
      if (!s) return false;
      return (
        t.courseId === sId ||
        t.title.toLowerCase().includes(s.name.toLowerCase()) ||
        (s.id === 'series-ttet-paper1' && t.title.toLowerCase().includes('paper-i')) ||
        (s.id === 'series-ttet-paper2-sci' && t.title.toLowerCase().includes('science')) ||
        (s.id === 'series-ttet-paper2-soc' && t.title.toLowerCase().includes('social'))
      );
    });
    return enrolledInSeries;
  });

  // Group mock tests by course/subject for clear separation
  const filteredTests = enrolledMockTests.filter((t) => {
    if (selectedSeriesFilter === 'all') return true;
    if (selectedSeriesFilter === 'p1') {
      return (
        t.title.toLowerCase().includes('paper-i') ||
        t.title.toLowerCase().includes('paper 1') ||
        t.courseId.includes('paper1')
      );
    }
    if (selectedSeriesFilter === 'p2sci') {
      return (
        t.title.toLowerCase().includes('science') ||
        t.title.toLowerCase().includes('math') ||
        t.courseId.includes('paper2-sci')
      );
    }
    if (selectedSeriesFilter === 'p2soc') {
      return (
        t.title.toLowerCase().includes('social') ||
        t.title.toLowerCase().includes('history') ||
        t.courseId.includes('paper2-soc')
      );
    }
    return t.courseId === selectedSeriesFilter || t.subject === selectedSeriesFilter;
  });

  // Past test attempts by this student
  const studentAttempts = db.testAttempts.filter((a) => a.studentId === currentStudent.id);

  const handleCopyLink = (test: MockTest) => {
    if (!test.driveLink) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(test.driveLink);
      setCopiedLinkTestId(test.id);
      showToast('Drive Link Copied', 'Question paper Google Drive link copied to clipboard.', 'success');
      setTimeout(() => setCopiedLinkTestId(null), 2500);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0a0e2a] via-[#0056b3] to-[#1e3a8a] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Student Learning Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            My Learning & Enrolled Courses
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
            Welcome back, {currentStudent.name}. Join scheduled live and offline classes, download
            published question paper Drive links, and appear in timed mock test examinations.
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/15">
              <span className="text-[11px] text-blue-200 block font-medium">Enrolled Courses</span>
              <span className="text-xl font-black text-white">{enrollments.length} Active</span>
            </div>
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/15">
              <span className="text-[11px] text-blue-200 block font-medium">Enrolled Mock Tests</span>
              <span className="text-xl font-black text-amber-300">
                {enrolledMockTests.length} Tests
              </span>
            </div>
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/15 col-span-2 sm:col-span-1">
              <span className="text-[11px] text-blue-200 block font-medium">Tests Attempted</span>
              <span className="text-xl font-black text-emerald-300">
                {studentAttempts.length} Completed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="inline-flex p-1 rounded-2xl bg-slate-100 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#0056b3] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Learning ({enrollments.length + enrolledMockTests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'courses'
                ? 'bg-[#0056b3] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Enrolled Courses & Classes ({enrollments.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tests')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tests'
                ? 'bg-[#0056b3] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Enrolled Mock Tests ({enrolledMockTests.length})</span>
          </button>
        </div>

        <Link
          href="/student/courses"
          className="text-xs font-bold text-[#0056b3] hover:underline inline-flex items-center gap-1"
        >
          <span>+ Enrol in More Courses & Tests</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* ==================== 1. ENROLLED COURSES & CLASSROOM SECTION ==================== */}
      {(activeTab === 'all' || activeTab === 'courses') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-[#0a0e2a] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#0056b3]" />
                <span>My Enrolled Courses & Class Schedules</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Join live video classes or check offline classroom venue and batch schedules.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {enrollments.length} Course{enrollments.length === 1 ? '' : 's'}
            </span>
          </div>

          {enrollments.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center max-w-md mx-auto space-y-3">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900">No Courses Enrolled Yet</h3>
              <p className="text-xs text-slate-500">
                You have not enrolled in any classroom batches yet. Explore our course catalogue to
                join online or offline classes.
              </p>
              <Link
                href="/student/courses"
                className="inline-block px-4 py-2.5 rounded-xl bg-[#0056b3] text-white text-xs font-bold"
              >
                Browse Course Catalogue
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {enrollments.map((enr) => {
                const fullCourse = db.courses.find((c) => c.id === enr.courseId);
                const isOnline = fullCourse?.mode === 'Online';

                return (
                  <div
                    key={enr.courseId}
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between"
                  >
                    <div className="h-2 bg-gradient-to-r from-[#0056b3] to-[#ea580c]" />
                    <div className="p-6 space-y-4">
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="px-3 py-1 rounded-full bg-blue-50 text-[#0056b3] border border-blue-200 text-xs font-extrabold">
                          {enr.batchName}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                            isOnline
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isOnline ? (
                            <>
                              <Video className="w-3.5 h-3.5" /> Online Live Class
                            </>
                          ) : (
                            <>
                              <MapPin className="w-3.5 h-3.5" /> Offline Center Batch
                            </>
                          )}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-extrabold text-[#0a0e2a]">{enr.courseName}</h3>

                      {/* Faculty & Schedule Info */}
                      <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Assigned Faculty</span>
                          <span className="font-bold text-slate-900">{enr.facultyName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Class Timing</span>
                          <span className="font-bold text-slate-900">
                            {fullCourse?.schedule || 'Mon–Sat Morning/Evening'}
                          </span>
                        </div>
                      </div>

                      {/* Progress */}
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className="text-slate-600">Syllabus Progress</span>
                          <span className="text-[#0056b3]">{enr.progress}% Completed</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-[#0056b3] rounded-full"
                            style={{ width: `${enr.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Class Joining Section */}
                      <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-[#0056b3]">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> Classroom Joining Notice
                          </span>
                          <span className="text-[11px] text-slate-500 font-normal">
                            Enrolled: {enr.enrolledDate}
                          </span>
                        </div>

                        {isOnline ? (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-700">
                              Live classes are conducted via Google Meet / Secure Class Room. Click
                              below to connect to today's active session.
                            </p>
                            <a
                              href="https://meet.google.com/new"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold shadow-xs cursor-pointer"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Join Live Video Class</span>
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-700 space-y-1">
                            <p className="font-semibold text-slate-900 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-[#ea580c]" />
                              <span>Venue: C.G.A Main Campus, Udaipur Center (Near Jagannath Dighi Road)</span>
                            </p>
                            <p className="text-slate-500 text-[11px]">
                              Room 102 • Please carry your C.G.A Student ID card to class. Spiral
                              booklets can be collected at the administrative counter.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 text-xs font-bold">
                      <Link
                        href={`/student/materials?course=${enr.courseId}`}
                        className="text-[#0056b3] hover:underline flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" /> Study Materials (PDFs)
                      </Link>
                      <Link
                        href="/student/my-courses"
                        className="text-slate-600 hover:text-slate-900"
                      >
                        View Full Details →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ==================== 2. ENROLLED MOCK TESTS & QUESTION PAPERS ==================== */}
      {(activeTab === 'all' || activeTab === 'tests') && (
        <section className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-[#0a0e2a] flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-[#ea580c]" />
                <span>My Enrolled Mock Tests & Question Papers</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every mock test is kept separate by course, batch, and subject. Appear for the CBT
                test when published, or view the published question paper Drive link.
              </p>
            </div>

            {/* Specific Series / Subject Separator Filters */}
            <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Filter:
              </span>
              <button
                type="button"
                onClick={() => setSelectedSeriesFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedSeriesFilter === 'all'
                    ? 'bg-[#0056b3] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Mocks ({enrolledMockTests.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedSeriesFilter('p1')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedSeriesFilter === 'p1'
                    ? 'bg-[#0056b3] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Paper-I Mocks
              </button>
              <button
                type="button"
                onClick={() => setSelectedSeriesFilter('p2sci')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedSeriesFilter === 'p2sci'
                    ? 'bg-[#0056b3] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Paper-II (Math & Sci)
              </button>
              <button
                type="button"
                onClick={() => setSelectedSeriesFilter('p2soc')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedSeriesFilter === 'p2soc'
                    ? 'bg-[#0056b3] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Paper-II (Social Studies)
              </button>
            </div>
          </div>

          {filteredTests.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center max-w-md mx-auto space-y-3">
              <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900">
                No Enrolled Mock Tests Found
              </h3>
              <p className="text-xs text-slate-500">
                You are not enrolled in this mock test category yet. Enrol in a mock series package
                to access all sectional tests, full papers, and question paper links.
              </p>
              <Link
                href="/student/tests"
                className="inline-block px-4 py-2.5 rounded-xl bg-[#0056b3] text-white text-xs font-bold"
              >
                Explore Mock Test Arena
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredTests.map((test) => {
                const pastAttempt = studentAttempts.find((a) => a.testId === test.id);
                const isPublished = test.status === 'Published';
                const hasDriveLink = !!test.driveLink && test.driveLink.trim().length > 0;

                return (
                  <div
                    key={test.id}
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between"
                  >
                    <div className="p-6 space-y-4">
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-extrabold border border-slate-200">
                          {test.batchName}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isPublished ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Published by Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                              <Lock className="w-3.5 h-3.5" /> Scheduled / Draft
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Test Title & Subject */}
                      <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
                          <span>{test.subject || 'All Subjects'}</span>
                          <span>•</span>
                          <span>{test.courseName}</span>
                        </div>
                        <h3 className="text-base font-extrabold text-[#0a0e2a] leading-snug">
                          {test.title}
                        </h3>
                      </div>

                      {/* Key Test Specs */}
                      <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center text-xs">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Duration</span>
                          <span className="font-extrabold text-slate-900">
                            {test.durationMinutes} Mins
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Total Marks</span>
                          <span className="font-extrabold text-[#0056b3]">
                            {test.totalMarks} Marks
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Questions</span>
                          <span className="font-extrabold text-slate-900">
                            {test.questions?.length || 0} MCQs
                          </span>
                        </div>
                      </div>

                      {/* Scheduled Date Notice */}
                      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#0056b3]" />
                          <span>Exam Date: {test.scheduledDate || 'Flexible CBT'}</span>
                        </span>
                        <span className="text-[11px] font-medium text-slate-400">
                          Negative: -{test.negativeMarking} per wrong
                        </span>
                      </div>

                      {/* Action Box 1: CBT Mock Exam Attempt */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                            <ClipboardCheck className="w-4 h-4 text-[#0056b3]" />
                            <span>1. Computer-Based Online Test (CBT)</span>
                          </span>
                          {pastAttempt && (
                            <span className="text-xs font-black text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                              Score: {pastAttempt.score}/{pastAttempt.totalMarks} ({pastAttempt.accuracy}%)
                            </span>
                          )}
                        </div>

                        {isPublished ? (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-600">
                              {pastAttempt
                                ? 'You have already attempted this mock test. You can re-attempt or review answer explanations in the arena.'
                                : 'This test is live and ready. The launch window is open for enrolled students.'}
                            </p>
                            <button
                              type="button"
                              onClick={() => router.push(`/student/tests?testId=${test.id}`)}
                              className="w-full py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                              <span>{pastAttempt ? 'Re-attempt Test in Arena' : 'Appear for Test Now'}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-500">
                              The administrator has not launched this test yet. The attempt test link
                              will be activated as soon as the test is officially published.
                            </p>
                            <button
                              type="button"
                              disabled
                              className="w-full py-2.5 rounded-xl bg-slate-200 text-slate-400 text-xs font-bold cursor-not-allowed flex items-center justify-center gap-1.5"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Attempt Test (Locked until Published)</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Action Box 2: Question Paper Google Drive Link */}
                      <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-[#ea580c]" />
                            <span>2. Question Paper (Google Drive Link)</span>
                          </span>
                          {hasDriveLink ? (
                            <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              Link Published
                            </span>
                          ) : (
                            <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                              Pending Publication
                            </span>
                          )}
                        </div>

                        {hasDriveLink ? (
                          <div className="space-y-2">
                            <p className="text-xs text-amber-900">
                              Official question paper has been published to Google Drive. Click below to
                              open or copy the link for viewing.
                            </p>
                            <div className="flex items-center gap-2">
                              <a
                                href={test.driveLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold text-center inline-flex items-center justify-center gap-1.5 shadow-2xs"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>View Question Paper</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => handleCopyLink(test)}
                                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer inline-flex items-center gap-1"
                              >
                                <Copy className="w-3.5 h-3.5 text-[#0056b3]" />
                                <span>{copiedLinkTestId === test.id ? 'Copied' : 'Copy'}</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs text-amber-900/80">
                              The administrator has not shared the Google Drive link for this question
                              paper yet. The 'View' link will become available once published.
                            </p>
                            <button
                              type="button"
                              disabled
                              className="w-full py-2 rounded-xl bg-slate-200 text-slate-400 text-xs font-bold cursor-not-allowed inline-flex items-center justify-center gap-1.5"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>View Question Paper (Pending Publish)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>C.G.A Exam Engine • Udaipur, Tripura</span>
                      <span className="font-bold text-slate-700">{test.batchName}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
