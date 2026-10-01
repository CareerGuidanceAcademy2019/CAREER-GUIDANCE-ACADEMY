'use client';

import React, { useState } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Sliders,
  Lock,
  Unlock,
  X,
  Search,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { Course, CourseCategory } from '@/data/initialSeedData';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function AdminCoursesAndBatchesPage() {
  const { db, saveCourse, deleteCourse, updateBatchStatus } = useCga();
  const [search, setSearch] = useState('');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [batchModalCourse, setBatchModalCourse] = useState<Course | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);

  const filtered = db.courses.filter((c) => {
    const q = search.trim().toLowerCase();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.subCategory.toLowerCase().includes(q) ||
      c.batchName.toLowerCase().includes(q)
    );
  });

  const handleOpenAdd = () => {
    setIsNew(true);
    setEditingCourse({
      id: `crs-${Date.now()}`,
      name: '',
      category: 'Teaching and Recruitment Exams',
      subCategory: 'TET / STGT',
      board: 'Competitive',
      description: '',
      syllabusHighlights: ['Complete Syllabus Coverage', 'Weekly Mock Tests'],
      price: 7500,
      instalmentAvailable: true,
      firstInstalment: 4000,
      facultyId: db.faculty[0]?.id || 'fac-1',
      facultyName: db.faculty[0]?.name || 'Dr. Subrata Majumder',
      batchName: 'New 2026 Target Batch',
      batchSize: 35,
      seatsAvailable: 15,
      waitingListCount: 0,
      duration: '6 Months',
      startDate: '2026-11-01',
      schedule: 'Mon, Wed, Fri — 9:00 AM to 11:00 AM',
      status: 'Open for Admission',
      featured: true,
      linkedMaterialIds: [],
    });
  };

  const handleSaveCourseForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse || !editingCourse.name.trim()) return;
    saveCourse(editingCourse, isNew);
    setEditingCourse(null);
  };

  const handleQuickToggleStatus = (course: Course) => {
    if (course.status === 'Open for Admission') {
      updateBatchStatus(course.id, {
        status: 'Batch Closed',
        batchSize: course.batchSize,
        seatsAvailable: 0,
        waitingListCount: course.waitingListCount,
      });
    } else {
      // Reopen batch for new admissions
      updateBatchStatus(course.id, {
        status: 'Open for Admission',
        batchSize: course.batchSize,
        seatsAvailable: course.seatsAvailable > 0 ? course.seatsAvailable : 10,
        waitingListCount: 0,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a0e2a]">
            Course Catalogue & Live Batch Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Add, edit, or delete courses. Open or close batches, reopen for new admissions, and
            manage seat limits & waiting lists. Changes sync live to the Public Website.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold shadow-xs cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" /> Add New Course
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter courses by name, exam, board (TBSE/CBSE)..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
          />
        </div>
      </div>

      {/* Courses & Batch Control Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                <th className="py-3.5 px-4">Course & Sub-Category</th>
                <th className="py-3.5 px-4">Batch & Faculty</th>
                <th className="py-3.5 px-4">Fee</th>
                <th className="py-3.5 px-4">Seats / Waitlist</th>
                <th className="py-3.5 px-4">Admission Status</th>
                <th className="py-3.5 px-4 text-right">Batch & Course Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((course) => {
                const isOpen =
                  course.status === 'Open for Admission' && course.seatsAvailable > 0;
                return (
                  <tr key={course.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-[#0056b3] font-bold text-[10px] mb-1">
                        {course.subCategory}
                      </span>
                      <p className="font-extrabold text-slate-900 line-clamp-1">{course.name}</p>
                      <p className="text-[11px] text-slate-400">{course.category}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-800">{course.batchName}</p>
                      <p className="text-slate-500">{course.facultyName}</p>
                      <p className="text-[11px] text-slate-400 whitespace-nowrap">
                        {course.duration} • Starts {course.startDate}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 whitespace-nowrap">
                      ₹{course.price.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-[#0056b3] block">
                        {course.seatsAvailable} / {course.batchSize} Seats Free
                      </span>
                      <span className="text-slate-500">
                        Waitlist: <strong>{course.waitingListCount}</strong>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleQuickToggleStatus(course)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold cursor-pointer transition-all whitespace-nowrap ${
                          isOpen
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-red-50 text-[#dc2626] border border-red-200 hover:bg-red-100'
                        }`}
                        title="Click to toggle Open / Closed status"
                      >
                        {isOpen ? (
                          <>
                            <Unlock className="w-3.5 h-3.5 shrink-0" /> Open for Admission
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5 shrink-0" /> Batch Closed (Reopen)
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setBatchModalCourse({ ...course })}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-50 text-[#ea580c] border border-amber-200 font-bold inline-flex items-center gap-1 hover:bg-amber-100 cursor-pointer whitespace-nowrap"
                          title="Configure Batch Seats & Waiting List"
                        >
                          <Sliders className="w-3.5 h-3.5 shrink-0" /> Batch Control
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsNew(false);
                            setEditingCourse({ ...course });
                          }}
                          className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                          title="Edit Course Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(course)}
                          className="p-2 rounded-xl bg-red-50 text-[#dc2626] hover:bg-red-100 cursor-pointer"
                          title="Delete Course"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== BATCH CONTROL MODAL ==================== */}
      {batchModalCourse && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/65 p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateBatchStatus(batchModalCourse.id, {
                status: batchModalCourse.status,
                batchSize: batchModalCourse.batchSize,
                seatsAvailable: batchModalCourse.seatsAvailable,
                waitingListCount: batchModalCourse.waitingListCount,
              });
              setBatchModalCourse(null);
            }}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase text-[#ea580c]">
                  Batch Seat & Admission Control
                </span>
                <h3 className="text-base font-extrabold text-[#0a0e2a]">{batchModalCourse.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setBatchModalCourse(null)}
                className="p-1 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Admission Status (Updates Public Site Badge)
                </label>
                <select
                  value={batchModalCourse.status}
                  onChange={(e) =>
                    setBatchModalCourse({
                      ...batchModalCourse,
                      status: e.target.value as Course['status'],
                      seatsAvailable:
                        e.target.value === 'Batch Closed'
                          ? 0
                          : batchModalCourse.seatsAvailable || 10,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold bg-white"
                >
                  <option value="Open for Admission">Open for Admission</option>
                  <option value="Batch Closed">Batch Closed / Full</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Max Batch Size</label>
                  <input
                    type="number"
                    min={1}
                    value={batchModalCourse.batchSize}
                    onChange={(e) =>
                      setBatchModalCourse({
                        ...batchModalCourse,
                        batchSize: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Seats Available</label>
                  <input
                    type="number"
                    min={0}
                    value={batchModalCourse.seatsAvailable}
                    onChange={(e) =>
                      setBatchModalCourse({
                        ...batchModalCourse,
                        seatsAvailable: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Waiting List</label>
                  <input
                    type="number"
                    min={0}
                    value={batchModalCourse.waitingListCount}
                    onChange={(e) =>
                      setBatchModalCourse({
                        ...batchModalCourse,
                        waitingListCount: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBatchModalCourse(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#0056b3] text-white text-xs font-bold cursor-pointer"
              >
                Save Batch Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== ADD / EDIT COURSE MODAL ==================== */}
      {editingCourse && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/65 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveCourseForm}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 my-8"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-[#0a0e2a]">
                {isNew ? 'Add New Course to C.G.A Catalogue' : 'Edit Course Details'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingCourse(null)}
                className="p-1 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Course Title *</label>
                <input
                  type="text"
                  required
                  value={editingCourse.name}
                  onChange={(e) => setEditingCourse({ ...editingCourse, name: e.target.value })}
                  placeholder="e.g., Tripura TET Paper-I & II Evening Batch"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Category</label>
                <select
                  value={editingCourse.category}
                  onChange={(e) =>
                    setEditingCourse({
                      ...editingCourse,
                      category: e.target.value as CourseCategory,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Teaching and Recruitment Exams">
                    Teaching and Recruitment Exams
                  </option>
                  <option value="Banking, SSC and Railway">Banking, SSC and Railway</option>
                  <option value="Other Competitive Examinations">
                    Other Competitive Examinations
                  </option>
                  <option value="School Coaching">School Coaching</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Exam / Class & Board Tag
                </label>
                <input
                  type="text"
                  value={editingCourse.subCategory}
                  onChange={(e) =>
                    setEditingCourse({ ...editingCourse, subCategory: e.target.value })
                  }
                  placeholder="e.g., TET, STGT, Class X (TBSE Board)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assigned Faculty</label>
                <select
                  value={editingCourse.facultyId}
                  onChange={(e) => {
                    const fac = db.faculty.find((f) => f.id === e.target.value);
                    setEditingCourse({
                      ...editingCourse,
                      facultyId: e.target.value,
                      facultyName: fac?.name || editingCourse.facultyName,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  {db.faculty.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.subject})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Batch Name</label>
                <input
                  type="text"
                  value={editingCourse.batchName}
                  onChange={(e) =>
                    setEditingCourse({ ...editingCourse, batchName: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Course Fee (₹)</label>
                <input
                  type="number"
                  value={editingCourse.price}
                  onChange={(e) =>
                    setEditingCourse({
                      ...editingCourse,
                      price: Number(e.target.value),
                      firstInstalment: Math.round(Number(e.target.value) * 0.55),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Duration & Start Date</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={editingCourse.duration}
                    onChange={(e) =>
                      setEditingCourse({ ...editingCourse, duration: e.target.value })
                    }
                    placeholder="6 Months"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                  <input
                    type="date"
                    value={editingCourse.startDate}
                    onChange={(e) =>
                      setEditingCourse({ ...editingCourse, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Batch Size & Available Seats
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={editingCourse.batchSize}
                    onChange={(e) =>
                      setEditingCourse({ ...editingCourse, batchSize: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                  <input
                    type="number"
                    value={editingCourse.seatsAvailable}
                    onChange={(e) =>
                      setEditingCourse({
                        ...editingCourse,
                        seatsAvailable: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Admission Status</label>
                <select
                  value={editingCourse.status}
                  onChange={(e) =>
                    setEditingCourse({
                      ...editingCourse,
                      status: e.target.value as Course['status'],
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Open for Admission">Open for Admission</option>
                  <option value="Batch Closed">Batch Closed</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingCourse.description}
                  onChange={(e) =>
                    setEditingCourse({ ...editingCourse, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingCourse(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#0056b3] text-white text-xs font-bold cursor-pointer"
              >
                {isNew ? 'Create Course' : 'Save Course Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Course from Catalogue?"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will remove it from the Public Website and Student Catalogue.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteCourse(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
