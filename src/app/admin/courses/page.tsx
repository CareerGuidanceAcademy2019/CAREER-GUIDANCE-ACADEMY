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
  Eye,
  EyeOff,
  Award,
  Clock,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { Course, CourseCategory, CourseMode, StandalonePackage } from '@/data/initialSeedData';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function AdminCoursesAndBatchesPage() {
  const {
    db,
    saveCourse,
    deleteCourse,
    updateBatchStatus,
    updateBatchDuration,
    extendBatchDuration,
    updateSiteContent,
    showToast,
  } = useCga();
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState<'All' | CourseMode>('All');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [batchModalCourse, setBatchModalCourse] = useState<Course | null>(null);
  const [batchValidUntil, setBatchValidUntil] = useState('');
  const [busyDuration, setBusyDuration] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);

  // Standalone Package State
  const [editingPackage, setEditingPackage] = useState<StandalonePackage | null>(null);
  const [isNewPackage, setIsNewPackage] = useState(false);
  const [deletePackageTarget, setDeletePackageTarget] = useState<StandalonePackage | null>(null);

  const standalonePackages: StandalonePackage[] = db.siteContent?.standalonePackages || [];

  const filtered = db.courses.filter((c) => {
    const matchMode = modeFilter === 'All' || c.mode === modeFilter;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.subCategory.toLowerCase().includes(q) ||
      c.batchName.toLowerCase().includes(q);
    return matchMode && matchSearch;
  });

  const handleOpenBatchModal = (course: Course) => {
    setBatchModalCourse({ ...course });
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + 6);
    setBatchValidUntil(targetDate.toISOString().split('T')[0]);
  };

  const handleExtendBatchMonths = async (months: number) => {
    if (!batchModalCourse) return;
    setBusyDuration(true);
    await extendBatchDuration(batchModalCourse.id, months);
    setBusyDuration(false);
  };

  const handleSetBatchDate = async () => {
    if (!batchModalCourse || !batchValidUntil) return;
    setBusyDuration(true);
    await updateBatchDuration(batchModalCourse.id, new Date(batchValidUntil).toISOString());
    setBusyDuration(false);
  };

  const handleOpenAdd = () => {
    setIsNew(true);
    setEditingCourse({
      id: `crs-${Date.now()}`,
      name: '',
      category: 'Teaching and Recruitment Exams',
      subCategory: 'TET / STGT',
      board: 'Competitive',
      mode: 'Offline',
      description: '',
      syllabusHighlights: ['Complete Syllabus Coverage', 'Weekly Mock Tests', 'Special Doubt Clearing'],
      price: 4000,
      monthlyFee: 1000,
      materialDelivery: 'Physical printed booklets at Udaipur center + digital softcopies in view-only reader',
      instalmentAvailable: true,
      firstInstalment: 2500,
      facultyId: db.faculty[0]?.id || '',
      facultyName: db.faculty[0]?.name || '',
      batchName: 'Target 2026-27 Batch',
      batchSize: 50,
      seatsAvailable: 50,
      waitingListCount: 0,
      duration: '1 Year',
      startDate: '2026-11-01',
      schedule: 'Mon to Fri — 10:00 AM to 1:00 PM',
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
      updateBatchStatus(course.id, {
        status: 'Open for Admission',
        batchSize: course.batchSize,
        seatsAvailable: course.seatsAvailable > 0 ? course.seatsAvailable : 10,
        waitingListCount: 0,
      });
    }
  };

  // Standalone Package Actions
  const handleTogglePublishPackage = async (pkg: StandalonePackage) => {
    const updated = standalonePackages.map((p) =>
      p.id === pkg.id ? { ...p, isPublished: !p.isPublished } : p
    );
    await updateSiteContent({ ...db.siteContent, standalonePackages: updated });
  };

  const handleOpenAddPackage = () => {
    setIsNewPackage(true);
    setEditingPackage({
      id: `pkg-${Date.now()}`,
      type: 'mock_test',
      title: 'Full Session Test Series 2026',
      targetExam: 'Tripura Combined Competitive Exams',
      price: 1999,
      duration: 'Full Session (1 Year)',
      description: 'Comprehensive mock tests with detailed analytics, state ranking, and solutions.',
      features: ['25 Full Length Mock Tests', 'State-Level Percentile & Ranking', 'Immediate Score & Solutions'],
      isPublished: true,
    });
  };

  const handleSavePackageForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage || !editingPackage.title.trim()) return;
    let updated: StandalonePackage[];
    if (isNewPackage) {
      updated = [...standalonePackages, editingPackage];
    } else {
      updated = standalonePackages.map((p) =>
        p.id === editingPackage.id ? editingPackage : p
      );
    }
    await updateSiteContent({ ...db.siteContent, standalonePackages: updated });
    setEditingPackage(null);
  };

  const handleDeletePackage = async (id: string) => {
    const updated = standalonePackages.filter((p) => p.id !== id);
    await updateSiteContent({ ...db.siteContent, standalonePackages: updated });
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a0e2a]">
            Course Catalogue & Live Batch Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Manage Offline Classroom and Online Interactive batches. Seats automatically decrement upon student enrollment.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold shadow-xs cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" /> Add New Course Batch
        </button>
      </div>

      {/* Filter and Mode Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
              Mode:
            </span>
            {(['All', 'Offline', 'Online'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setModeFilter(m)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  modeFilter === m
                    ? 'bg-[#0056b3] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {m === 'All' ? 'All Batches' : m === 'Offline' ? 'Offline Batches' : 'Online Batches'}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter courses by name, exam, board..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
            />
          </div>
        </div>
      </div>

      {/* Courses & Batch Control Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                <th className="py-3.5 px-4">Course & Mode</th>
                <th className="py-3.5 px-4">Batch & Faculty</th>
                <th className="py-3.5 px-4">Fees (Adm + Mo)</th>
                <th className="py-3.5 px-4">Seats / Waitlist</th>
                <th className="py-3.5 px-4">Admission Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((course) => {
                const isOpen =
                  course.status === 'Open for Admission' && course.seatsAvailable > 0;
                return (
                  <tr key={course.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-[#0056b3] font-bold text-[10px]">
                          {course.subCategory}
                        </span>
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] ${
                            course.mode === 'Online'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {course.mode === 'Online' ? 'Online' : 'Offline'}
                        </span>
                      </div>
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
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-extrabold text-slate-900 block">
                        Adm: ₹{course.price.toLocaleString('en-IN')}
                      </span>
                      {course.monthlyFee ? (
                        <span className="text-[11px] font-semibold text-[#0056b3]">
                          Mo: ₹{course.monthlyFee.toLocaleString('en-IN')}/month
                        </span>
                      ) : null}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-[#0056b3] block">
                        {course.seatsAvailable} / {course.batchSize} Free
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
                            <Lock className="w-3.5 h-3.5 shrink-0" /> Batch Closed
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenBatchModal(course)}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-50 text-[#ea580c] border border-amber-200 font-bold inline-flex items-center gap-1 hover:bg-amber-100 cursor-pointer whitespace-nowrap"
                          title="Configure Batch Seats, Capacity & Access Duration"
                        >
                          <Sliders className="w-3.5 h-3.5 shrink-0" /> Batch &amp; Access
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

      {/* ==================== STANDALONE SUBSCRIPTIONS MANAGER ==================== */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-indigo-50 text-indigo-700">
                <Award className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-extrabold text-[#0a0e2a]">
                Standalone Mock Test Series & Study Material Packages
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Configure packages for students who only want to buy mock tests or full-session study notes without attending classes. Toggle Publish to make them visible on the public site and student portal.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddPackage}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer self-start"
          >
            <Plus className="w-4 h-4" /> Add Standalone Package
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {standalonePackages.map((pkg) => (
            <div
              key={pkg.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                pkg.isPublished
                  ? 'bg-white border-slate-200 shadow-xs'
                  : 'bg-slate-50 border-dashed border-slate-300 opacity-80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      pkg.type === 'mock_test'
                        ? 'bg-blue-50 text-[#0056b3] border border-blue-200'
                        : 'bg-orange-50 text-[#ea580c] border border-orange-200'
                    }`}
                  >
                    {pkg.type === 'mock_test' ? 'Mock Test Series' : 'Study Material Package'}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleTogglePublishPackage(pkg)}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                      pkg.isPublished
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                    title="Click to toggle publish status"
                  >
                    {pkg.isPublished ? (
                      <>
                        <Eye className="w-3 h-3" /> Published
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3" /> Draft (Unpublished)
                      </>
                    )}
                  </button>
                </div>

                <h3 className="text-sm font-extrabold text-[#0a0e2a]">{pkg.title}</h3>
                <p className="text-[11px] text-[#0056b3] font-semibold mt-0.5">{pkg.targetExam}</p>
                <p className="text-xs text-slate-600 mt-2 line-clamp-2">{pkg.description}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Price</span>
                  <span className="text-base font-black text-[#0a0e2a]">
                    ₹{pkg.price.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewPackage(false);
                      setEditingPackage({ ...pkg });
                    }}
                    className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                    title="Edit Package"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletePackageTarget(pkg)}
                    className="p-1.5 rounded-lg bg-red-50 text-[#dc2626] hover:bg-red-100 cursor-pointer"
                    title="Delete Package"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
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
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#0a0e2a]">Batch Capacity Control</h3>
                <p className="text-[11px] text-slate-500">{batchModalCourse.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setBatchModalCourse(null)}
                className="p-1 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Batch Admission Status</label>
                <select
                  value={batchModalCourse.status}
                  onChange={(e) =>
                    setBatchModalCourse({
                      ...batchModalCourse,
                      status: e.target.value as Course['status'],
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Open for Admission">Open for Admission</option>
                  <option value="Batch Closed">Batch Closed</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Seats</label>
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
                  <label className="font-bold text-slate-700 block mb-1">Seats Free</label>
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

            {/* Batch Access Validity & Duration Control */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#0056b3] flex items-center gap-1.5 text-xs">
                  <Clock className="w-4 h-4 text-[#0056b3]" /> Batch Access Duration Control
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#0056b3] font-bold text-[10px]">
                  {db.students.filter((s) => s.enrollments.some((e) => e.courseId === batchModalCourse.id)).length} Enrolled
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Only academy administrators can set and extend the active duration for this batch. Students can access class materials, CBT mock tests, and syllabus notes strictly until their active validity period.
              </p>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                  Quick Batch Extension (All Enrolled Students)
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyDuration}
                    onClick={() => handleExtendBatchMonths(1)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 hover:bg-blue-100 text-[#0056b3] font-bold text-[11px] cursor-pointer disabled:opacity-50"
                  >
                    +1 Month
                  </button>
                  <button
                    type="button"
                    disabled={busyDuration}
                    onClick={() => handleExtendBatchMonths(3)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 hover:bg-blue-100 text-[#0056b3] font-bold text-[11px] cursor-pointer disabled:opacity-50"
                  >
                    +3 Months
                  </button>
                  <button
                    type="button"
                    disabled={busyDuration}
                    onClick={() => handleExtendBatchMonths(6)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 hover:bg-blue-100 text-[#0056b3] font-bold text-[11px] cursor-pointer disabled:opacity-50"
                  >
                    +6 Months
                  </button>
                  <button
                    type="button"
                    disabled={busyDuration}
                    onClick={() => handleExtendBatchMonths(12)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 hover:bg-blue-100 text-[#0056b3] font-bold text-[11px] cursor-pointer disabled:opacity-50"
                  >
                    +1 Year
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-blue-200/60">
                <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                  Set Specific Batch Expiration Date
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={batchValidUntil}
                    onChange={(e) => setBatchValidUntil(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                  />
                  <button
                    type="button"
                    disabled={busyDuration || !batchValidUntil}
                    onClick={handleSetBatchDate}
                    className="px-3.5 py-1.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white font-bold text-xs cursor-pointer shadow-xs disabled:opacity-50 whitespace-nowrap"
                  >
                    {busyDuration ? 'Updating…' : 'Set Expiration'}
                  </button>
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
                {isNew ? 'Add New Course Batch' : 'Edit Course Details'}
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
                  placeholder="e.g., TCS/TPS Complete Preparation"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Class Delivery Mode</label>
                <select
                  value={editingCourse.mode}
                  onChange={(e) =>
                    setEditingCourse({
                      ...editingCourse,
                      mode: e.target.value as CourseMode,
                      materialDelivery:
                        e.target.value === 'Offline'
                          ? 'Physical printed booklets at Udaipur center + digital softcopies in view-only reader'
                          : 'Digital softcopies in view-only reader',
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                >
                  <option value="Offline">Offline Classroom (Udaipur)</option>
                  <option value="Online">Online Interactive</option>
                </select>
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
                  placeholder="e.g., TCS/TPS, TET-I, SSC-CGL"
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
                <label className="font-bold text-slate-700 block mb-1">Admission Fee (₹)</label>
                <input
                  type="number"
                  value={editingCourse.price}
                  onChange={(e) =>
                    setEditingCourse({
                      ...editingCourse,
                      price: Number(e.target.value),
                      firstInstalment: Math.round(Number(e.target.value) * 0.6),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Monthly Fee (₹)</label>
                <input
                  type="number"
                  value={editingCourse.monthlyFee ?? 1000}
                  onChange={(e) =>
                    setEditingCourse({
                      ...editingCourse,
                      monthlyFee: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                />
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
                <label className="font-bold text-slate-700 block mb-1">Duration & Start Date</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={editingCourse.duration}
                    onChange={(e) =>
                      setEditingCourse({ ...editingCourse, duration: e.target.value })
                    }
                    placeholder="1 Year"
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                >
                  <option value="Open for Admission">Open for Admission</option>
                  <option value="Batch Closed">Batch Closed</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Study Material Handout Note</label>
                <input
                  type="text"
                  value={editingCourse.materialDelivery ?? ''}
                  onChange={(e) =>
                    setEditingCourse({ ...editingCourse, materialDelivery: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  placeholder="e.g. Physical printed booklets at Udaipur center + digital softcopies in view-only reader"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Description & Highlights</label>
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
                {isNew ? 'Create Course Batch' : 'Save Batch Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== ADD / EDIT STANDALONE PACKAGE MODAL ==================== */}
      {editingPackage && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/65 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSavePackageForm}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs my-8"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-[#0a0e2a]">
                {isNewPackage ? 'Create Standalone Subscription Package' : 'Edit Package Details'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingPackage(null)}
                className="p-1 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Package Type</label>
                <select
                  value={editingPackage.type}
                  onChange={(e) =>
                    setEditingPackage({
                      ...editingPackage,
                      type: e.target.value as StandalonePackage['type'],
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                >
                  <option value="mock_test">Mock Test Series Only</option>
                  <option value="study_material">Study Material Notes Package Only</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Package Title *</label>
                <input
                  type="text"
                  required
                  value={editingPackage.title}
                  onChange={(e) => setEditingPackage({ ...editingPackage, title: e.target.value })}
                  placeholder="e.g. TCS/TPS Full Session Mock Test Series"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Exam</label>
                  <input
                    type="text"
                    value={editingPackage.targetExam}
                    onChange={(e) =>
                      setEditingPackage({ ...editingPackage, targetExam: e.target.value })
                    }
                    placeholder="e.g. TCS / TPS, STGT"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={editingPackage.price}
                    onChange={(e) =>
                      setEditingPackage({ ...editingPackage, price: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Validity / Duration</label>
                <input
                  type="text"
                  value={editingPackage.duration}
                  onChange={(e) =>
                    setEditingPackage({ ...editingPackage, duration: e.target.value })
                  }
                  placeholder="e.g. Full Session (1 Year)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingPackage.description}
                  onChange={(e) =>
                    setEditingPackage({ ...editingPackage, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Features (comma-separated)
                </label>
                <input
                  type="text"
                  value={editingPackage.features.join(', ')}
                  onChange={(e) =>
                    setEditingPackage({
                      ...editingPackage,
                      features: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="25 CBT Mock Tests, Instant Ranking, Full Solutions"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pkg-published-check"
                  checked={editingPackage.isPublished}
                  onChange={(e) =>
                    setEditingPackage({ ...editingPackage, isPublished: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-[#0056b3]"
                />
                <label htmlFor="pkg-published-check" className="font-bold text-slate-700">
                  Publish to Public Website & Student Portal immediately
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingPackage(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
              >
                Save Package
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Course Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Course Batch?"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This removes it from the catalogue.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteCourse(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />

      {/* Delete Package Dialog */}
      <ConfirmDialog
        isOpen={!!deletePackageTarget}
        title="Delete Standalone Package?"
        message={`Are you sure you want to delete "${deletePackageTarget?.title}"?`}
        onCancel={() => setDeletePackageTarget(null)}
        onConfirm={() => {
          if (deletePackageTarget) handleDeletePackage(deletePackageTarget.id);
          setDeletePackageTarget(null);
        }}
      />
    </div>
  );
}
