'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  ClipboardCheck,
  Clock,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';

export default function StudentMyCoursesPage() {
  const { db, currentStudent } = useCga();
  const [currentTime] = useState(() => Date.now());

  if (!currentStudent) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a0e2a]">My Enrolled Courses & Batches</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Track your classroom schedule, assigned faculty, syllabus completion, and linked study
            materials.
          </p>
        </div>
        <Link
          href="/student/courses"
          className="px-4 py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold self-start sm:self-auto"
        >
          + Browse More Courses
        </Link>
      </div>

      {currentStudent.enrollments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <BookOpen className="w-10 h-10 text-[#0056b3] mx-auto mb-3" />
          <h2 className="text-lg font-extrabold text-slate-900">No Courses Purchased Yet</h2>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            Enrol in a course from the catalogue to access classroom batches, PDF books, and mock
            tests.
          </p>
          <Link
            href="/student/courses"
            className="inline-block px-5 py-2.5 rounded-xl bg-[#0056b3] text-white text-xs font-bold"
          >
            Explore Course Catalogue
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {currentStudent.enrollments.map((enr) => {
            const fullCourse = db.courses.find((c) => c.id === enr.courseId);
            const courseMaterials = db.studyMaterials.filter((m) => m.courseId === enr.courseId);
            const courseTests = db.mockTests.filter((t) => t.courseId === enr.courseId);

            return (
              <div
                key={enr.courseId}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between"
              >
                <div className="h-2 bg-gradient-to-r from-[#0056b3] to-[#ea580c]" />
                <div className="p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-[#0056b3] border border-blue-200 text-xs font-extrabold">
                      {enr.batchName}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full whitespace-nowrap shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Enrolled on {enr.enrolledDate}
                    </span>
                  </div>

                  <h2 className="text-lg font-extrabold text-[#0a0e2a]">{enr.courseName}</h2>

                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block">Assigned Faculty</span>
                      <span className="font-bold text-slate-900">{enr.facultyName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Class Schedule</span>
                      <span className="font-bold text-slate-900">
                        {fullCourse?.schedule || 'Mon–Sat Morning/Evening'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-slate-600">Batch Syllabus Progress</span>
                      <span className="text-[#0056b3]">{enr.progress}% Completed</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-[#0056b3] rounded-full"
                        style={{ width: `${enr.progress}%` }}
                      />
                    </div>
                  </div>
                  {/* Access Validity Badge */}
                  <div className="flex items-center justify-between text-xs p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#0056b3]" /> Access Validity:
                    </span>
                    {enr.accessValidUntil && new Date(enr.accessValidUntil).getTime() < currentTime ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold border border-red-200">
                        Expired on {new Date(enr.accessValidUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    ) : enr.accessValidUntil ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold border border-blue-200">
                        Active till {new Date(enr.accessValidUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                        Active
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80">
                  {enr.accessValidUntil && new Date(enr.accessValidUntil).getTime() < currentTime ? (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2 rounded-xl bg-red-50 border border-red-200 text-xs">
                      <span className="text-red-700 font-bold">
                        Batch duration expired. Contact Academy Admin to renew.
                      </span>
                      <a
                        href="tel:7005929189"
                        className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
                      >
                        Helpdesk
                      </a>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Link
                        href="/student/materials"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0056b3] text-white text-xs font-bold hover:bg-[#1e3a8a]"
                      >
                        <FileText className="w-3.5 h-3.5" /> Study PDFs ({courseMaterials.length})
                      </Link>
                      <Link
                        href="/student/tests"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 text-[#ea580c] border border-amber-200 text-xs font-bold hover:bg-amber-100"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" /> Mock Tests ({courseTests.length})
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
