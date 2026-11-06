'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Trash2,
  ArrowRightLeft,
  Clock,
  BookOpen,
  ClipboardCheck,
  Users,
  CheckCircle2,
  AlertTriangle,
  X,
  UserPlus,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { MaskedData } from '@/components/ui/MaskedData';
import { StudentProfile } from '@/data/initialSeedData';
import { MOCK_SERIES_INITIAL } from '@/data/mockSeriesSeedData';

type SectionKind = 'mock_series' | 'course';

export default function AdminEnrollmentsPage() {
  const {
    db,
    enrollStudentAsAdmin,
    removeStudentEnrollment,
    transferStudentEnrollment,
    showToast,
  } = useCga();

  // Dynamic list of all mock test series (combines db and base catalogue)
  const allMockSeries = useMemo(() => {
    return db.mockSeries && db.mockSeries.length > 0 ? db.mockSeries : MOCK_SERIES_INITIAL;
  }, [db.mockSeries]);

  // Dynamic list of all courses and batches
  const allCourses = useMemo(() => {
    return db.courses || [];
  }, [db.courses]);

  // Active section tab: Mock Series or Courses
  const [sectionKind, setSectionKind] = useState<SectionKind>('mock_series');

  // Currently selected item id (default to first mock series or first course)
  const defaultSeriesId = allMockSeries[0]?.id || 'series-ttet-paper1';
  const defaultCourseId = allCourses[0]?.id || '';
  const [selectedItemId, setSelectedItemId] = useState<string>(defaultSeriesId);

  // Quick category filter for the single selection bar
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'mock_series' | 'course'>('all');

  // Search & Filter within enrolled students
  const [search, setSearch] = useState('');
  const [validityFilter, setValidityFilter] = useState<'All' | 'Active' | 'Expired'>('All');
  const [currentTime] = useState(() => Date.now());

  // Modal States
  // 1. Add Student Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addStudentSearch, setAddStudentSearch] = useState('');
  const [addSelectedStudentId, setAddSelectedStudentId] = useState('');
  const [addValidityMonths, setAddValidityMonths] = useState(6);
  const [addReason, setAddReason] = useState('Admin manual grant / batch enrollment');
  const [addBusy, setAddBusy] = useState(false);

  // 2. Remove Access Modal
  const [removeTarget, setRemoveTarget] = useState<{
    student: StudentProfile;
    itemId: string;
    itemName: string;
  } | null>(null);
  const [removeReason, setRemoveReason] = useState('Enrolled in wrong series/batch by mistake');
  const [removeResetAttempts, setRemoveResetAttempts] = useState(false);
  const [removeBusy, setRemoveBusy] = useState(false);

  // 3. Transfer Modal
  const [transferTarget, setTransferTarget] = useState<{
    student: StudentProfile;
    fromId: string;
    fromName: string;
  } | null>(null);
  const [transferToId, setTransferToId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferResetAttempts, setTransferResetAttempts] = useState(false);
  const [transferBusy, setTransferBusy] = useState(false);

  // Selected item record
  const selectedSeries = useMemo(
    () => allMockSeries.find((s) => s.id === selectedItemId) || allMockSeries[0],
    [allMockSeries, selectedItemId]
  );
  const selectedCourse = useMemo(
    () => allCourses.find((c) => c.id === selectedItemId) || allCourses[0],
    [allCourses, selectedItemId]
  );

  const activeItem = sectionKind === 'mock_series' ? selectedSeries : selectedCourse;
  const activeItemId = activeItem?.id || selectedItemId || allMockSeries[0]?.id || '';
  const activeItemName = activeItem?.name || '';

  // Calculate enrolled counts for all mock series
  const seriesEnrollmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allMockSeries.forEach((s) => {
      counts[s.id] = (db.seriesEnrollments || []).filter((se) => se.seriesId === s.id).length;
    });
    return counts;
  }, [allMockSeries, db.seriesEnrollments]);

  // Calculate enrolled counts for all courses
  const courseEnrollmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allCourses.forEach((c) => {
      let cnt = 0;
      (db.students || []).forEach((stu) => {
        if (stu.enrollments.some((e) => e.courseId === c.id)) cnt++;
      });
      counts[c.id] = cnt;
    });
    return counts;
  }, [allCourses, db.students]);

  // Find enrolled students for the ACTIVE item
  const enrolledStudentRecords = useMemo(() => {
    if (!activeItemId) return [];

    if (sectionKind === 'mock_series') {
      const enrRows = (db.seriesEnrollments || []).filter((se) => se.seriesId === activeItemId);
      return enrRows.map((se) => {
        const student = db.students.find((s) => s.id === se.studentId) || {
          id: se.studentId,
          name: 'Student',
          studentCode: 'CGA-2026',
          email: '',
          phone: '',
          photo: '',
          guardianName: '',
          address: '',
          qualification: '',
          targetExam: '',
          joinedDate: '',
          status: 'Active' as const,
          enrollments: [],
        };
        return {
          enrollmentId: se.id,
          student,
          enrolledAt: se.enrolledAt,
          accessValidUntil: se.accessValidUntil,
          paymentId: se.paymentId,
        };
      });
    } else {
      const records: {
        enrollmentId?: string;
        student: StudentProfile;
        enrolledAt: string;
        accessValidUntil?: string;
        paidAmount?: number;
        totalFee?: number;
        dueAmount?: number;
      }[] = [];

      (db.students || []).forEach((stu) => {
        const enr = stu.enrollments.find((e) => e.courseId === activeItemId);
        if (enr) {
          records.push({
            enrollmentId: enr.id,
            student: stu,
            enrolledAt: enr.enrolledDate,
            accessValidUntil: enr.accessValidUntil,
            paidAmount: enr.paidAmount,
            totalFee: enr.totalFee,
            dueAmount: enr.dueAmount,
          });
        }
      });
      return records;
    }
  }, [sectionKind, activeItemId, db.seriesEnrollments, db.students]);

  // Filter enrolled students by search & validity
  const filteredEnrolledStudents = useMemo(() => {
    return enrolledStudentRecords.filter((rec) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        rec.student.name.toLowerCase().includes(q) ||
        rec.student.studentCode.toLowerCase().includes(q) ||
        rec.student.email.toLowerCase().includes(q) ||
        rec.student.phone.includes(q);

      const isExpired = rec.accessValidUntil
        ? new Date(rec.accessValidUntil).getTime() < currentTime
        : false;

      const matchValidity =
        validityFilter === 'All' ||
        (validityFilter === 'Active' && !isExpired) ||
        (validityFilter === 'Expired' && isExpired);

      return matchSearch && matchValidity;
    });
  }, [enrolledStudentRecords, search, validityFilter, currentTime]);

  // Candidates available to add to this active item (not yet enrolled)
  const availableCandidatesToAdd = useMemo(() => {
    if (!activeItemId) return [];
    const alreadyEnrolledIds = new Set(enrolledStudentRecords.map((r) => r.student.id));

    return (db.students || [])
      .filter((s) => !alreadyEnrolledIds.has(s.id))
      .filter((s) => {
        const q = addStudentSearch.trim().toLowerCase();
        if (!q) return true;
        return (
          s.name.toLowerCase().includes(q) ||
          s.studentCode.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.phone.includes(q) ||
          s.targetExam.toLowerCase().includes(q)
        );
      });
  }, [db.students, enrolledStudentRecords, activeItemId, addStudentSearch]);

  // Handle single selection dropdown change
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    const [kind, id] = val.split(':') as [SectionKind, string];
    setSectionKind(kind);
    setSelectedItemId(id);
    setSearch('');
  };

  // Handle quick category filter switch
  const handleCategoryFilterChange = (filter: 'all' | 'mock_series' | 'course') => {
    setCategoryFilter(filter);
    if (filter === 'mock_series' && sectionKind !== 'mock_series') {
      setSectionKind('mock_series');
      setSelectedItemId(allMockSeries[0]?.id || defaultSeriesId);
      setSearch('');
    } else if (filter === 'course' && sectionKind !== 'course') {
      setSectionKind('course');
      setSelectedItemId(allCourses[0]?.id || defaultCourseId);
      setSearch('');
    }
  };

  // Submit Add Student to active item
  const handleConfirmAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addSelectedStudentId || !activeItemId || addBusy) return;

    setAddBusy(true);
    const ok = await enrollStudentAsAdmin({
      studentId: addSelectedStudentId,
      kind: sectionKind,
      itemId: activeItemId,
      accessValidMonths: addValidityMonths,
      reason: addReason.trim() || 'Admin manual grant',
    });
    setAddBusy(false);

    if (ok) {
      setIsAddModalOpen(false);
      setAddSelectedStudentId('');
      setAddStudentSearch('');
    }
  };

  // Submit Remove Student
  const handleConfirmRemove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!removeTarget || removeBusy) return;

    setRemoveBusy(true);
    const ok = await removeStudentEnrollment({
      studentId: removeTarget.student.id,
      kind: sectionKind,
      itemId: removeTarget.itemId,
      reason: removeReason.trim() || 'Enrolled in wrong series/batch by mistake',
      resetAttempts: removeResetAttempts,
    });
    setRemoveBusy(false);

    if (ok) {
      setRemoveTarget(null);
      setRemoveReason('Enrolled in wrong series/batch by mistake');
      setRemoveResetAttempts(false);
    }
  };

  // Submit Transfer Student
  const handleConfirmTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTarget || !transferToId || transferBusy) return;

    setTransferBusy(true);
    const ok = await transferStudentEnrollment({
      studentId: transferTarget.student.id,
      kind: sectionKind,
      fromId: transferTarget.fromId,
      toId: transferToId,
      reason: transferReason.trim() || 'Transferred by Admin',
      resetAttempts: transferResetAttempts,
    });
    setTransferBusy(false);

    if (ok) {
      setTransferTarget(null);
      setTransferToId('');
      setTransferReason('');
      setTransferResetAttempts(false);
    }
  };

  // CSV Export for active item
  const handleExportCsv = () => {
    const headers = [
      'Student Code',
      'Student Name',
      'Email',
      'Mobile Number',
      'Section Type',
      'Item Enrolled',
      'Enrolled Date',
      'Access Valid Until',
      'Validity Status',
    ];

    const rows = filteredEnrolledStudents.map((r) => {
      const isExpired = r.accessValidUntil
        ? new Date(r.accessValidUntil).getTime() < currentTime
        : false;
      return [
        r.student.studentCode,
        `"${r.student.name}"`,
        r.student.email,
        `"${r.student.phone}"`,
        sectionKind === 'mock_series' ? 'Mock Test Series' : 'Course Batch',
        `"${activeItemName}"`,
        r.enrolledAt,
        r.accessValidUntil ? r.accessValidUntil.slice(0, 10) : 'Standard (6M)',
        isExpired ? 'Expired' : 'Active',
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CGA_${activeItemId}_Enrolled_Students_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV Exported', `Exported ${filteredEnrolledStudents.length} student records for ${activeItemName}.`, 'success');
  };

  // Transfer options for destination
  const transferOptions = useMemo(() => {
    if (!transferTarget) return [];
    if (sectionKind === 'mock_series') {
      return allMockSeries
        .filter((s) => s.id !== transferTarget.fromId && s.status !== 'Archived')
        .map((s) => ({ id: s.id, name: s.name, price: s.price }));
    } else {
      return allCourses
        .filter((c) => c.id !== transferTarget.fromId)
        .map((c) => ({
          id: c.id,
          name: c.batchName ? `${c.name} — ${c.batchName}` : c.name,
          price: c.price,
        }));
    }
  }, [transferTarget, sectionKind, allMockSeries, allCourses]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Title & Global Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0056b3] text-xs font-bold uppercase tracking-wider">
              Admin Access Management
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#0a0e2a] mt-1">
            Course &amp; Mock Test Series Enrollments
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Select any mock test series (TET 1, TET 2 Science, TET 2 Social Studies) or course batch to view enrolled student counts, manage candidate access, add students, or remove accidental enrollments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredEnrolledStudents.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            type="button"
            onClick={() => {
              setAddSelectedStudentId('');
              setAddStudentSearch('');
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Add Student to this {sectionKind === 'mock_series' ? 'Series' : 'Batch'}
          </button>
        </div>
      </div>

      {/* ================= SINGLE SELECTION BAR (MOCKS & BATCHES) ================= */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <label
              htmlFor="enrollment-target-select"
              className="font-extrabold text-slate-800 text-sm sm:text-base flex items-center gap-1.5"
            >
              <span>Target Mock Test Series Package or Course Batch</span>
              <span className="text-[#dc2626] font-black">*</span>
            </label>
            <p className="text-xs text-slate-500 mt-0.5">
              Select from the scrollable list below to view all enrolled students and manage access permissions.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Type badge matching Image 2 */}
            <span
              className={`text-[11px] font-bold px-3 py-1 rounded-full border shadow-2xs ${
                sectionKind === 'mock_series'
                  ? 'bg-orange-50 text-[#ea580c] border-orange-200'
                  : 'bg-blue-50 text-[#0056b3] border-blue-200'
              }`}
            >
              {sectionKind === 'mock_series' ? 'Mock Test Section Only' : 'Course Batch Section Only'}
            </span>

            {/* Quick Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handleCategoryFilterChange('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  categoryFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({allMockSeries.length + allCourses.length})
              </button>
              <button
                type="button"
                onClick={() => handleCategoryFilterChange('mock_series')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  categoryFilter === 'mock_series'
                    ? 'bg-[#ea580c] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-[#ea580c]'
                }`}
              >
                Mocks ({allMockSeries.length})
              </button>
              <button
                type="button"
                onClick={() => handleCategoryFilterChange('course')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  categoryFilter === 'course'
                    ? 'bg-[#0056b3] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-[#0056b3]'
                }`}
              >
                Courses ({allCourses.length})
              </button>
            </div>
          </div>
        </div>

        {/* The single select with scrolling options matching Image 2 */}
        <div className="relative">
          <select
            id="enrollment-target-select"
            value={`${sectionKind}:${activeItemId}`}
            onChange={handleSelectChange}
            className="w-full px-4 py-3.5 pr-10 rounded-2xl border-2 border-blue-200 bg-white font-extrabold text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3] focus:border-[#0056b3] shadow-xs cursor-pointer appearance-none transition-all"
          >
            {(categoryFilter === 'all' || categoryFilter === 'mock_series') && (
              <optgroup label={`── 🎯 MOCK TEST SERIES PACKAGES (${allMockSeries.length}) ──`}>
                {allMockSeries.map((s) => {
                  const count = seriesEnrollmentCounts[s.id] || 0;
                  return (
                    <option key={`mock_series:${s.id}`} value={`mock_series:${s.id}`}>
                      {s.name} (₹{s.price}/-) — {s.classRange || s.stream || 'Test Series'} [{count} {count === 1 ? 'Student' : 'Students'} Enrolled]
                    </option>
                  );
                })}
              </optgroup>
            )}

            {(categoryFilter === 'all' || categoryFilter === 'course') && (
              <optgroup label={`── 📚 CLASSROOM & ONLINE COURSE BATCHES (${allCourses.length}) ──`}>
                {allCourses.map((c) => {
                  const count = courseEnrollmentCounts[c.id] || 0;
                  return (
                    <option key={`course:${c.id}`} value={`course:${c.id}`}>
                      {c.name} — ({c.batchName || 'Regular Batch'} • {c.mode || 'Classroom'} • ₹{c.price}/-) [{count} {count === 1 ? 'Student' : 'Students'} Enrolled]
                    </option>
                  );
                })}
              </optgroup>
            )}
          </select>
          <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <p className="text-[11px] text-slate-500">
          Strict access control: only students enrolled in this series package or course batch will appear in the list below. Any new batch or mock series launched in admin automatically shows up here.
        </p>
      </div>

      {/* Active Item Enrolled Header Card */}
      <div className="bg-gradient-to-r from-[#0a0e2a] via-[#1e2a5a] to-[#ea580c] text-white rounded-3xl p-6 sm:p-7 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
              {sectionKind === 'mock_series' ? 'Active Mock Test Series' : 'Active Course Batch'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold">{activeItemName}</h2>
          <p className="text-xs text-blue-100 mt-1 max-w-2xl leading-relaxed">
            {activeItem?.description || 'All registered candidates with active or previous access to this batch/series are listed below.'}
          </p>
        </div>

        <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 shrink-0 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
          <span className="text-xs font-bold text-amber-200 uppercase tracking-wider">
            Total Enrolled
          </span>
          <span className="text-3xl font-black">{enrolledStudentRecords.length}</span>
          <span className="text-[11px] text-blue-100">
            {filteredEnrolledStudents.length !== enrolledStudentRecords.length
              ? `Showing ${filteredEnrolledStudents.length} matching`
              : 'All active records'}
          </span>
        </div>
      </div>

      {/* Search and Filters for the Enrolled Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search enrolled students in ${activeItemName.slice(0, 24)}...`}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Status:</span>
          {(['All', 'Active', 'Expired'] as const).map((vf) => (
            <button
              key={vf}
              type="button"
              onClick={() => setValidityFilter(vf)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                validityFilter === vf
                  ? 'bg-[#0056b3] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {vf}
            </button>
          ))}
        </div>
      </div>

      {/* Enrolled Students Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
        {filteredEnrolledStudents.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-extrabold text-slate-800">
              {enrolledStudentRecords.length === 0
                ? `No students enrolled in "${activeItemName}" yet.`
                : 'No students match your search filter.'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {enrolledStudentRecords.length === 0
                ? 'You can add candidates directly from your registered student management directory using the button below.'
                : 'Try clearing the search text or changing the status filter.'}
            </p>
            {enrolledStudentRecords.length === 0 && (
              <button
                type="button"
                onClick={() => {
                  setAddSelectedStudentId('');
                  setAddStudentSearch('');
                  setIsAddModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold cursor-pointer mt-2"
              >
                <UserPlus className="w-4 h-4" /> Add Student to this {sectionKind === 'mock_series' ? 'Series' : 'Batch'}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Code &amp; Contact</th>
                  <th className="py-3.5 px-4">Enrolled On</th>
                  <th className="py-3.5 px-4">Access Validity</th>
                  <th className="py-3.5 px-4 text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEnrolledStudents.map((rec) => {
                  const isExp = rec.accessValidUntil
                    ? new Date(rec.accessValidUntil).getTime() < currentTime
                    : false;
                  const dateFormatted = rec.accessValidUntil
                    ? new Date(rec.accessValidUntil).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Standard (6 Months)';

                  return (
                    <tr key={rec.student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              rec.student.photo ||
                              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'
                            }
                            alt={rec.student.name}
                            className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
                          />
                          <div>
                            <p className="font-extrabold text-slate-900">{rec.student.name}</p>
                            <p className="text-[11px] text-slate-500">{rec.student.qualification || 'Student'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-[#0056b3] block">
                          {rec.student.studentCode}
                        </span>
                        <MaskedData
                          value={rec.student.phone}
                          type="phone"
                          subjectId={rec.student.studentCode}
                          className="text-slate-500 text-xs"
                        />
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        {rec.enrolledAt ? new Date(rec.enrolledAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        }) : '—'}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold ${
                            isExp
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {isExp ? `Expired on ${dateFormatted}` : `Active till ${dateFormatted}`}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Transfer button */}
                          <button
                            type="button"
                            onClick={() => {
                              setTransferTarget({
                                student: rec.student,
                                fromId: activeItemId,
                                fromName: activeItemName,
                              });
                              setTransferToId('');
                              setTransferReason('Transferred to another series/batch');
                              setTransferResetAttempts(false);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                            title={`Change or transfer ${rec.student.name} to another series or course`}
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600" />
                            <span>Change</span>
                          </button>

                          {/* Remove Access button */}
                          <button
                            type="button"
                            onClick={() => {
                              setRemoveTarget({
                                student: rec.student,
                                itemId: activeItemId,
                                itemName: activeItemName,
                              });
                              setRemoveReason('Enrolled in wrong series/batch by mistake');
                              setRemoveResetAttempts(false);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                            title={`Remove ${rec.student.name} from this ${sectionKind === 'mock_series' ? 'series' : 'batch'}`}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================== 1. ADD STUDENT TO ACTIVE ITEM MODAL ==================== */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/70 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-student-modal-title"
        >
          <form
            onSubmit={handleConfirmAddStudent}
            className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 p-6 space-y-4 text-xs"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="add-student-modal-title" className="text-base font-extrabold text-[#0a0e2a]">
                  Add Student to {sectionKind === 'mock_series' ? 'Mock Test Series' : 'Course Batch'}
                </h2>
                <p className="text-slate-500 mt-0.5">
                  Target: <strong className="text-slate-900">{activeItemName}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                disabled={addBusy}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer disabled:opacity-50"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Candidate Search Box */}
            <div>
              <label htmlFor="add-search" className="block text-[11px] font-bold text-slate-700 mb-1.5">
                Search Registered Candidate <span className="text-[#dc2626]">*</span>
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="add-search"
                  type="text"
                  value={addStudentSearch}
                  onChange={(e) => setAddStudentSearch(e.target.value)}
                  placeholder="Type candidate name, student ID, or mobile number..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>
            </div>

            {/* Candidate Selection List */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                Select Candidate ({availableCandidatesToAdd.length} available to enrol)
              </label>
              <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
                {availableCandidatesToAdd.length === 0 ? (
                  <p className="p-4 text-center text-slate-500 text-xs">
                    No registered candidates found matching your search.
                  </p>
                ) : (
                  availableCandidatesToAdd.map((stu) => {
                    const isSelected = addSelectedStudentId === stu.id;
                    return (
                      <div
                        key={stu.id}
                        onClick={() => setAddSelectedStudentId(stu.id)}
                        className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50 border-l-4 border-l-[#0056b3]'
                            : 'hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              stu.photo ||
                              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'
                            }
                            alt={stu.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{stu.name}</p>
                            <p className="text-[11px] text-slate-500">
                              {stu.studentCode} • {stu.phone}
                            </p>
                          </div>
                        </div>

                        {isSelected ? (
                          <span className="px-2 py-0.5 rounded-md bg-[#0056b3] text-white text-[10px] font-bold">
                            Selected
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Select</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Validity Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="add-validity" className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  Access Validity
                </label>
                <select
                  id="add-validity"
                  value={addValidityMonths}
                  onChange={(e) => setAddValidityMonths(Number(e.target.value))}
                  disabled={addBusy}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0056b3] bg-white"
                >
                  <option value={1}>1 Month</option>
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months (Standard Default)</option>
                  <option value={12}>12 Months (1 Year)</option>
                  <option value={24}>24 Months (2 Years)</option>
                </select>
              </div>

              <div>
                <label htmlFor="add-reason" className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  Admin Note / Reason
                </label>
                <input
                  id="add-reason"
                  type="text"
                  value={addReason}
                  onChange={(e) => setAddReason(e.target.value)}
                  disabled={addBusy}
                  placeholder="e.g. Transferred from TET 1 / Counter enrolment"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                disabled={addBusy}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addBusy || !addSelectedStudentId}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white font-bold cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {addBusy ? 'Enrolling…' : 'Confirm & Enrol Candidate'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== 2. REMOVE ENROLLMENT ACCESS MODAL ==================== */}
      {removeTarget && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/70 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="remove-modal-title"
        >
          <form
            onSubmit={handleConfirmRemove}
            className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-4 text-xs"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="remove-modal-title" className="text-base font-extrabold text-[#dc2626]">
                  Remove Candidate from {sectionKind === 'mock_series' ? 'Mock Test Series' : 'Course Batch'}
                </h2>
                <p className="text-slate-500 mt-0.5">
                  Student: <strong className="text-slate-800">{removeTarget.student.name}</strong> (
                  {removeTarget.student.studentCode})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRemoveTarget(null)}
                disabled={removeBusy}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer disabled:opacity-50"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-red-50/70 border border-red-200 rounded-xl p-3">
              <span className="text-[10px] uppercase font-bold text-red-600 block">
                Item to Remove Access From:
              </span>
              <p className="font-extrabold text-slate-900 text-sm mt-0.5">{removeTarget.itemName}</p>
            </div>

            <div>
              <label htmlFor="remove-reason-input" className="block text-[11px] font-bold text-slate-700 mb-1.5">
                Reason for Removal / Declining Access <span className="text-[#dc2626]">*</span>
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[
                  'Enrolled in wrong series/batch by mistake',
                  'Duplicate enrollment removed',
                  'Transferred to another series/batch',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRemoveReason(preset)}
                    disabled={removeBusy}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition-colors ${
                      removeReason === preset
                        ? 'bg-red-50 border-red-300 text-red-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <textarea
                id="remove-reason-input"
                value={removeReason}
                onChange={(e) => setRemoveReason(e.target.value)}
                disabled={removeBusy}
                rows={2}
                maxLength={500}
                placeholder="e.g. Student enrolled in TET 1 by mistake and needs TET 2 Science."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
              />
            </div>

            <label className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={removeResetAttempts}
                onChange={(e) => setRemoveResetAttempts(e.target.checked)}
                disabled={removeBusy}
                className="mt-0.5"
              />
              <span className="text-slate-700">
                Also clear any past mock test scores/attempts in <strong>{removeTarget.itemName}</strong>.
              </span>
            </label>

            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-950">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <p>
                The student will immediately <strong>lose access</strong> to {removeTarget.itemName}. Any other enrolled series or batches they have will remain active.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRemoveTarget(null)}
                disabled={removeBusy}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={removeBusy || removeReason.trim().length < 3}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#dc2626] hover:bg-red-700 text-white font-bold cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {removeBusy ? 'Removing…' : 'Confirm & Remove Access'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== 3. TRANSFER ENROLLMENT MODAL ==================== */}
      {transferTarget && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/70 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="transfer-modal-title"
        >
          <form
            onSubmit={handleConfirmTransfer}
            className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-4 text-xs"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="transfer-modal-title" className="text-base font-extrabold text-[#0a0e2a]">
                  Change / Transfer {sectionKind === 'mock_series' ? 'Mock Test Series' : 'Course'}
                </h2>
                <p className="text-slate-500 mt-0.5">
                  Student: <strong className="text-slate-800">{transferTarget.student.name}</strong> (
                  {transferTarget.student.studentCode})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTransferTarget(null)}
                disabled={transferBusy}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer disabled:opacity-50"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Moving From</span>
              <p className="font-extrabold text-slate-900 text-sm mt-0.5">{transferTarget.fromName}</p>
            </div>

            <div>
              <label htmlFor="transfer-dest-select" className="block text-[11px] font-bold text-slate-700 mb-1.5">
                Move Candidate To <span className="text-[#dc2626]">*</span>
              </label>
              <select
                id="transfer-dest-select"
                value={transferToId}
                onChange={(e) => setTransferToId(e.target.value)}
                disabled={transferBusy}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0056b3] bg-white"
              >
                <option value="">— Select destination {sectionKind === 'mock_series' ? 'series' : 'course'} —</option>
                {transferOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name} — ₹{opt.price.toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="transfer-reason-field" className="block text-[11px] font-bold text-slate-700 mb-1.5">
                Reason <span className="text-[#dc2626]">*</span>
              </label>
              <textarea
                id="transfer-reason-field"
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                disabled={transferBusy}
                rows={2}
                maxLength={500}
                placeholder="e.g. Student enrolled in TET 1 by mistake; moving to TET 2 Science."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
              />
            </div>

            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-900">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                This will <strong>move</strong> the candidate: access to <strong>{transferTarget.fromName}</strong> is revoked, and access to the new destination is activated.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTransferTarget(null)}
                disabled={transferBusy}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={transferBusy || !transferToId || transferReason.trim().length < 5}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white font-bold cursor-pointer disabled:opacity-50"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                {transferBusy ? 'Moving…' : 'Confirm & Transfer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
