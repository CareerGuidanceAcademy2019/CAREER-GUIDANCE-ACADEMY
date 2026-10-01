'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Lock,
  Unlock,
  Eye,
  Download,
  BookOpen,
  ShieldAlert,
  X,
  ArrowRight,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { StudyMaterial } from '@/data/initialSeedData';

export default function StudentStudyMaterialsPage() {
  const { db, currentStudent, showToast } = useCga();
  const [filterType, setFilterType] = useState<'All' | 'Unlocked' | 'Locked'>('All');
  const [viewingMaterial, setViewingMaterial] = useState<StudyMaterial | null>(null);

  if (!currentStudent) return null;

  const enrolledCourseIds = currentStudent.enrollments.map((e) => e.courseId);

  const materialsWithAccess = db.studyMaterials.map((mat) => ({
    ...mat,
    isUnlocked: enrolledCourseIds.includes(mat.courseId),
  }));

  const filtered = materialsWithAccess.filter((m) => {
    if (filterType === 'Unlocked') return m.isUnlocked;
    if (filterType === 'Locked') return !m.isUnlocked;
    return true;
  });

  const handleDownloadWatermarked = (mat: StudyMaterial) => {
    const watermarkLine = `WATERMARK: Licensed Exclusively to ${currentStudent.name} (${currentStudent.studentCode}) — Career Guidance Academy (C.G.A), Udaipur`;
    const bodyText = mat.previewSections
      .map((s) => `\n--- ${s.heading} ---\n${s.body}\n`)
      .join('\n');

    const content = `======================================================================
${watermarkLine}
======================================================================
TITLE   : ${mat.title}
TYPE    : ${mat.type} (${mat.pages} Pages)
COURSE  : ${mat.courseName}
AUTHOR  : ${mat.author}
======================================================================
${bodyText}
======================================================================
${watermarkLine}
Unauthorized redistribution is strictly prohibited by C.G.A Udaipur.
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mat.title.slice(0, 38).replace(/[^a-zA-Z0-9]/g, '_')}_Watermarked.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(
      'Watermarked Study Material Downloaded',
      `Downloaded with ${currentStudent.name} (${currentStudent.studentCode}) digital watermark.`,
      'success'
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a0e2a]">
            Digital Study Materials & Paid Notes Library
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Soft-copy PDFs of books and classroom paid notes are unlocked automatically for courses
            you have purchased. All documents are protected with your personal student watermark.
          </p>
        </div>

        {/* Access Filter */}
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 self-start">
          {(['All', 'Unlocked', 'Locked'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilterType(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                filterType === tab
                  ? 'bg-[#0056b3] text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((mat) => (
          <div
            key={mat.id}
            className={`rounded-3xl border overflow-hidden flex flex-col justify-between transition-all ${
              mat.isUnlocked
                ? 'bg-white border-slate-200 shadow-xs cga-card-hover'
                : 'bg-slate-50/90 border-slate-200/80 opacity-95'
            }`}
          >
            <div>
              <div
                className={`h-1.5 w-full ${
                  mat.isUnlocked ? 'bg-[#0056b3]' : 'bg-slate-300'
                }`}
              />
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                      mat.type === 'Book PDF'
                        ? 'bg-blue-50 text-[#0056b3] border border-blue-200'
                        : 'bg-amber-50 text-[#ea580c] border border-amber-200'
                    }`}
                  >
                    {mat.type}
                  </span>

                  {mat.isUnlocked ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                      <Unlock className="w-3 h-3" /> Unlocked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-[#dc2626] border border-red-200 text-[11px] font-bold">
                      <Lock className="w-3 h-3" /> Enrol to Unlock
                    </span>
                  )}
                </div>

                <p className="text-[11px] font-bold text-[#0056b3] uppercase tracking-wider line-clamp-1">
                  {mat.courseName}
                </p>

                <h2 className="text-base font-extrabold text-[#0a0e2a] leading-snug">
                  {mat.title}
                </h2>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {mat.description}
                </p>

                <div className="pt-2 flex items-center justify-between text-[11px] font-semibold text-slate-400 border-t border-slate-100">
                  <span>By {mat.author}</span>
                  <span>
                    {mat.pages} Pages • {mat.fileSize}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80">
              {mat.isUnlocked ? (
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setViewingMaterial(mat)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Read in Browser
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadWatermarked(mat)}
                    className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Download Watermarked PDF Copy"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#dc2626] flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Enrol to unlock
                  </span>
                  <Link
                    href="/student/courses"
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#0a0e2a] hover:bg-slate-800 text-white text-xs font-bold"
                  >
                    Enrol Now <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ==================== IN-BROWSER WATERMARKED PDF VIEWER MODAL ==================== */}
      {viewingMaterial && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Viewer Toolbar */}
            <div className="bg-[#0a0e2a] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-amber-300 shrink-0" />
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold line-clamp-1">
                    {viewingMaterial.title}
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    Protected C.G.A Reader • Watermarked for:{' '}
                    <strong>
                      {currentStudent.name} ({currentStudent.studentCode})
                    </strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadWatermarked(viewingMaterial)}
                  className="px-3.5 py-2 rounded-xl bg-[#0056b3] hover:bg-blue-600 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => setViewingMaterial(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Watermarked Document Canvas */}
            <div className="flex-1 overflow-y-auto bg-slate-200 p-4 sm:p-8 space-y-6">
              {viewingMaterial.previewSections.map((sec, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl shadow-md border border-slate-300 p-8 sm:p-12 max-w-3xl mx-auto relative overflow-hidden"
                >
                  {/* Diagonal Repeating Student Name Watermark Overlay */}
                  <div className="cga-watermark-overlay absolute inset-0 flex flex-col items-center justify-around -rotate-18 opacity-[0.07] pointer-events-none select-none">
                    {Array.from({ length: 4 }).map((_, wIdx) => (
                      <p
                        key={wIdx}
                        className="text-lg sm:text-xl font-black uppercase tracking-widest text-[#0056b3] whitespace-nowrap"
                      >
                        {currentStudent.name} • {currentStudent.studentCode} • C.G.A UDAIPUR
                      </p>
                    ))}
                  </div>

                  {/* Page Header */}
                  <div className="relative z-10 flex items-center justify-between pb-4 mb-6 border-b border-slate-200 text-xs text-slate-400">
                    <span className="font-bold text-[#0056b3]">
                      Career Guidance Academy (C.G.A), Udaipur
                    </span>
                    <span>
                      Page {idx + 1} of {viewingMaterial.previewSections.length} (Preview Excerpt
                      from {viewingMaterial.pages} Pages)
                    </span>
                  </div>

                  {/* Section Content */}
                  <div className="relative z-10 space-y-4">
                    <h4 className="text-lg font-extrabold text-[#0a0e2a]">{sec.heading}</h4>
                    <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line font-normal">
                      {sec.body}
                    </div>
                  </div>

                  {/* Page Footer with Watermark */}
                  <div className="relative z-10 mt-10 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      Licensed Copy: <strong>{currentStudent.name}</strong> (
                      {currentStudent.studentCode})
                    </span>
                    <span>© C.G.A Publications, Udaipur</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
