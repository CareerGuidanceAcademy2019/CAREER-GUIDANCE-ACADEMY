'use client';

import React, { useState } from 'react';
import { Upload, FileText, Trash2, Edit3, X } from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { StudyMaterial } from '@/data/initialSeedData';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function AdminStudyMaterialsPage() {
  const { db, saveMaterial, deleteMaterial } = useCga();
  const [editing, setEditing] = useState<StudyMaterial | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StudyMaterial | null>(null);
  const [sectionHeading, setSectionHeading] = useState('');
  const [sectionBody, setSectionBody] = useState('');

  const openUploadModal = () => {
    const firstCourse = db.courses[0];
    setIsNew(true);
    setSectionHeading('Unit 1: Key Examination Concepts & Notes');
    setSectionBody(
      'Exclusive Career Guidance Academy (C.G.A) Udaipur classroom study material prepared for enrolled batch students.'
    );
    setEditing({
      id: `mat-${Date.now()}`,
      title: '',
      courseId: firstCourse?.id || 'crs-tet-1',
      courseName: firstCourse?.name || 'Tripura TET Integrated Batch',
      type: 'Paid Notes',
      author: 'C.G.A Academic Wing, Udaipur',
      pages: 95,
      fileSize: '3.8 MB',
      uploadedDate: new Date().toISOString().split('T')[0],
      description: '',
      previewSections: [],
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.title.trim()) return;
    const finalMat: StudyMaterial = {
      ...editing,
      previewSections:
        editing.previewSections.length > 0
          ? editing.previewSections
          : [{ heading: sectionHeading || 'Chapter 1', body: sectionBody || editing.description }],
    };
    saveMaterial(finalMat, isNew);
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a0e2a]">
            Study Material Upload & Course Mapping
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Upload soft-copy PDFs (Books and Paid Notes) and map them to specific courses. Students
            enrolled in the mapped course receive automatic watermarked access.
          </p>
        </div>

        <button
          type="button"
          onClick={openUploadModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold cursor-pointer self-start"
        >
          <Upload className="w-4 h-4" /> Upload PDF Material
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {db.studyMaterials.map((mat) => (
          <div
            key={mat.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0056b3] text-[11px] font-extrabold whitespace-nowrap shrink-0">
                  {mat.type}
                </span>
                <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                  {mat.pages} Pages • {mat.fileSize} • {mat.uploadedDate}
                </span>
              </div>
              <p className="text-[11px] font-bold text-[#ea580c] uppercase line-clamp-1">
                Mapped to: {mat.courseName}
              </p>
              <h2 className="text-base font-extrabold text-[#0a0e2a]">{mat.title}</h2>
              <p className="text-xs text-slate-600 line-clamp-2">{mat.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 truncate max-w-[150px]">{mat.author}</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsNew(false);
                    setEditing({ ...mat });
                  }}
                  className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(mat)}
                  className="p-2 rounded-xl bg-red-50 text-[#dc2626] hover:bg-red-100 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/65 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSave}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs my-8"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-[#0a0e2a]">
                {isNew ? 'Upload & Map Study Material PDF' : 'Edit Study Material'}
              </h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-1 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Material Title *</label>
                <input
                  type="text"
                  required
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  placeholder="e.g., STGT History & Civics Complete Paid Notes"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Map to Course (Auto-Unlocks for Enrolled Students)
                </label>
                <select
                  value={editing.courseId}
                  onChange={(e) => {
                    const crs = db.courses.find((c) => c.id === e.target.value);
                    setEditing({
                      ...editing,
                      courseId: e.target.value,
                      courseName: crs?.name || editing.courseName,
                    });
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  {db.courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Material Type</label>
                  <select
                    value={editing.type}
                    onChange={(e) =>
                      setEditing({ ...editing, type: e.target.value as StudyMaterial['type'] })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Book PDF">Book PDF</option>
                    <option value="Paid Notes">Paid Notes</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Pages</label>
                  <input
                    type="number"
                    value={editing.pages}
                    onChange={(e) => setEditing({ ...editing, pages: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">File Size</label>
                  <input
                    type="text"
                    value={editing.fileSize}
                    onChange={(e) => setEditing({ ...editing, fileSize: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                />
              </div>

              {isNew && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    In-Browser Reader Sample Content
                  </label>
                  <textarea
                    rows={3}
                    value={sectionBody}
                    onChange={(e) => setSectionBody(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#0056b3] text-white font-bold cursor-pointer"
              >
                Save & Map Material
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Study Material?"
        message={`Are you sure you want to delete "${deleteTarget?.title}" from the Digital Library?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMaterial(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
