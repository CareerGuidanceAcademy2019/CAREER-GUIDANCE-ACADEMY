'use client';

import React, { useState } from 'react';
import {
  Search,
  Plus,
  Download,
  Eye,
  Edit3,
  Power,
  Trash2,
  X,
  Clock,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { StudentProfile } from '@/data/initialSeedData';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { MaskedData } from '@/components/ui/MaskedData';

export default function AdminStudentsPage() {
  const {
    db,
    saveStudent,
    toggleStudentStatus,
    deleteStudent,
    updateStudentEnrollmentDuration,
    showToast,
  } = useCga();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [inspectingStudent, setInspectingStudent] = useState<StudentProfile | null>(null);
  const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(null);
  const [isNewStudent, setIsNewStudent] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StudentProfile | null>(null);
  const [updatingEnrollmentId, setUpdatingEnrollmentId] = useState<string | null>(null);
  const [customValidityDates, setCustomValidityDates] = useState<Record<string, string>>({});
  const [currentTime] = useState(() => Date.now());

  const filteredStudents = db.students.filter((s) => {
    const matchStatus = statusFilter === 'All' || s.status === statusFilter;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.studentCode.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      s.targetExam.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const handleExportCsv = () => {
    const headers = [
      'Student Code',
      'Full Name',
      'Email',
      'Phone',
      'Qualification',
      'Target Exam',
      'Status',
      'Enrolled Courses Count',
      'Total Fee (INR)',
      'Paid Amount (INR)',
      'Pending Due (INR)',
    ];

    const rows = filteredStudents.map((s) => {
      const total = s.enrollments.reduce((acc, e) => acc + e.totalFee, 0);
      const paid = s.enrollments.reduce((acc, e) => acc + e.paidAmount, 0);
      const due = s.enrollments.reduce((acc, e) => acc + e.dueAmount, 0);
      return [
        s.studentCode,
        `"${s.name}"`,
        s.email,
        `"${s.phone}"`,
        `"${s.qualification}"`,
        `"${s.targetExam}"`,
        s.status,
        s.enrollments.length,
        total,
        paid,
        due,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CGA_Udaipur_Students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV Export Downloaded', `Exported ${filteredStudents.length} student records.`, 'success');
  };

  const openAddModal = () => {
    setIsNewStudent(true);
    setEditingStudent({
      id: `stu-${Date.now()}`,
      studentCode: `CGA-2026-00${db.students.length + 1}`,
      name: '',
      email: '',
      phone: '+91 ',
      password: '',
      photo:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
      guardianName: '',
      address: 'Udaipur, Gomati Tripura 799120',
      qualification: 'B.A. / B.Ed.',
      targetExam: 'Tripura TET / STGT',
      joinedDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      enrollments: [],
    });
  };

  const handleExtendStudentEnrollment = async (enrollmentId: string, monthsToAdd: number) => {
    if (!enrollmentId) return;
    setUpdatingEnrollmentId(enrollmentId);
    try {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + monthsToAdd);
      const iso = targetDate.toISOString();
      const ok = await updateStudentEnrollmentDuration(enrollmentId, iso);
      if (ok && inspectingStudent) {
        setInspectingStudent({
          ...inspectingStudent,
          enrollments: inspectingStudent.enrollments.map((enr) =>
            enr.id === enrollmentId ? { ...enr, accessValidUntil: iso } : enr
          ),
        });
      }
    } finally {
      setUpdatingEnrollmentId(null);
    }
  };

  const handleSetCustomEnrollmentDate = async (enrollmentId: string) => {
    const customDate = customValidityDates[enrollmentId];
    if (!enrollmentId || !customDate) return;
    setUpdatingEnrollmentId(enrollmentId);
    try {
      const targetDate = new Date(customDate);
      const iso = targetDate.toISOString();
      const ok = await updateStudentEnrollmentDuration(enrollmentId, iso);
      if (ok && inspectingStudent) {
        setInspectingStudent({
          ...inspectingStudent,
          enrollments: inspectingStudent.enrollments.map((enr) =>
            enr.id === enrollmentId ? { ...enr, accessValidUntil: iso } : enr
          ),
        });
      }
    } finally {
      setUpdatingEnrollmentId(null);
    }
  };

  const handleSaveStudentForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    if (!editingStudent.name || editingStudent.name.trim().length < 3) {
      showToast('Validation Error', 'Full name must be at least 3 characters.', 'error');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editingStudent.email || !emailRegex.test(editingStudent.email.trim())) {
      showToast('Validation Error', 'A valid email address is required.', 'error');
      return;
    }
    const cleanPhone = (editingStudent.phone || '').replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      showToast('Validation Error', 'A valid 10-digit mobile number is required.', 'error');
      return;
    }
    if (!editingStudent.guardianName || editingStudent.guardianName.trim().length < 3) {
      showToast('Validation Error', "Parent's / Guardian's name is required (at least 3 characters).", 'error');
      return;
    }
    if (!editingStudent.qualification || editingStudent.qualification.trim().length < 2) {
      showToast('Validation Error', 'Educational qualification is required.', 'error');
      return;
    }
    if (!editingStudent.targetExam || editingStudent.targetExam.trim().length < 2) {
      showToast('Validation Error', 'Target examination is required.', 'error');
      return;
    }
    if (!editingStudent.address || editingStudent.address.trim().length < 5) {
      showToast('Validation Error', 'Present residential address must be at least 5 characters.', 'error');
      return;
    }

    const payload: StudentProfile = {
      ...editingStudent,
      name: editingStudent.name.trim(),
      email: editingStudent.email.trim().toLowerCase(),
      phone: editingStudent.phone.trim(),
      guardianName: editingStudent.guardianName.trim(),
      qualification: editingStudent.qualification.trim(),
      targetExam: editingStudent.targetExam.trim(),
      address: editingStudent.address.trim(),
      permanentAddress: (editingStudent.permanentAddress || editingStudent.address).trim(),
    };

    const result = await saveStudent(payload, isNewStudent);
    setEditingStudent(null);
    if (result.tempPassword) {
      window.prompt(
        `Account created for ${payload.email}.\nShare this ONE-TIME temporary password securely (copy it now; it is not shown again). The student should change it via "Forgot Password".`,
        result.tempPassword
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a0e2a]">
            Student Directory & 360° Performance Records
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            View, search, filter, add, edit, or deactivate students; inspect enrolled courses, fee
            status, and mock test ranks; or export to CSV/Excel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export CSV / Excel
          </button>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Student
          </button>
        </div>
      </div>

      {/* Search & Status Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, ID, phone, or target exam..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {(['All', 'Active', 'Inactive'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#0056b3] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Code & Contact</th>
                <th className="py-3.5 px-4">Target Wing</th>
                <th className="py-3.5 px-4">Batches</th>
                <th className="py-3.5 px-4">Fee Status</th>
                <th className="py-3.5 px-4">Account</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((stu) => {
                const due = stu.enrollments.reduce((acc, e) => acc + e.dueAmount, 0);
                const paid = stu.enrollments.reduce((acc, e) => acc + e.paidAmount, 0);
                return (
                  <tr key={stu.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={stu.photo}
                          alt={stu.name}
                          className="w-9 h-9 rounded-full object-cover shrink-0"
                        />
                        <div>
                          <p className="font-extrabold text-slate-900">{stu.name}</p>
                          <p className="text-[11px] text-slate-500">{stu.qualification}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-[#0056b3] block">
                        {stu.studentCode}
                      </span>
                      <MaskedData value={stu.phone} type="phone" subjectId={stu.studentCode} className="text-slate-500 text-xs" />
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{stu.targetExam}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#0056b3] font-bold whitespace-nowrap">
                        {stu.enrollments.length} Batches
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="block font-bold text-emerald-700">
                        Paid: ₹{paid.toLocaleString('en-IN')}
                      </span>
                      {due > 0 ? (
                        <span className="text-[#dc2626] font-extrabold">
                          Due: ₹{due.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-slate-400">No Dues</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-extrabold whitespace-nowrap ${
                          stu.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-[#dc2626] border border-red-200'
                        }`}
                      >
                        {stu.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setInspectingStudent(stu)}
                          className="p-2 rounded-xl bg-blue-50 text-[#0056b3] hover:bg-blue-100 cursor-pointer"
                          title="View 360° Student Detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewStudent(false);
                            setEditingStudent({ ...stu });
                          }}
                          className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                          title="Edit Student"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStudentStatus(stu.id)}
                          className="p-2 rounded-xl bg-amber-50 text-[#ea580c] hover:bg-amber-100 cursor-pointer"
                          title={stu.status === 'Active' ? 'Deactivate Student' : 'Activate Student'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(stu)}
                          className="p-2 rounded-xl bg-red-50 text-[#dc2626] hover:bg-red-100 cursor-pointer"
                          title="Delete Student"
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

      {/* ==================== STUDENT 360° DETAIL MODAL ==================== */}
      {inspectingStudent && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/65 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-4">
                <img
                  src={inspectingStudent.photo}
                  alt={inspectingStudent.name}
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-[#0056b3]"
                />
                <div>
                  <span className="text-xs font-mono font-bold text-[#0056b3]">
                    {inspectingStudent.studentCode} • {inspectingStudent.status}
                  </span>
                  <h2 className="text-xl font-extrabold text-[#0a0e2a]">
                    {inspectingStudent.name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {inspectingStudent.email} • {inspectingStudent.phone} • Guardian:{' '}
                    {inspectingStudent.guardianName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingStudent(null)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Full Candidate Profile Grid */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0056b3]">
                Candidate Profile Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Parent&apos;s / Guardian&apos;s Name
                  </span>
                  <span className="font-bold text-slate-800">
                    {inspectingStudent.guardianName || '—'}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Phone (WhatsApp)
                  </span>
                  <MaskedData value={inspectingStudent.phone || ''} type="phone" subjectId={inspectingStudent.studentCode} className="font-bold text-slate-800" />
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Registered Email
                  </span>
                  <MaskedData value={inspectingStudent.email} type="email" subjectId={inspectingStudent.studentCode} className="font-bold text-slate-800 truncate block" />
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Current Qualification
                  </span>
                  <span className="font-semibold text-slate-800">
                    {inspectingStudent.qualification || '—'}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Target Exam / Wing
                  </span>
                  <span className="font-bold text-[#ea580c]">
                    {inspectingStudent.targetExam || '—'}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Admission Date
                  </span>
                  <span className="font-semibold text-slate-800">
                    {inspectingStudent.joinedDate}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div className="bg-white p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Present Residential Address
                  </span>
                  <p className="font-medium text-slate-700 mt-0.5 leading-relaxed">
                    {inspectingStudent.address || '—'}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Permanent Address
                  </span>
                  <p className="font-medium text-slate-700 mt-0.5 leading-relaxed">
                    {inspectingStudent.permanentAddress || inspectingStudent.address || '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Enrolled Courses & Fee Status */}
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                Enrolled Courses &amp; Fee Breakdown
              </h3>
              {inspectingStudent.enrollments.length === 0 ? (
                <p className="text-xs text-slate-500">No courses enrolled.</p>
              ) : (
                <div className="space-y-3">
                  {inspectingStudent.enrollments.map((e) => {
                    const isExp = e.accessValidUntil
                      ? new Date(e.accessValidUntil).getTime() < currentTime
                      : false;
                    const dateFormatted = e.accessValidUntil
                      ? new Date(e.accessValidUntil).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Standard Default (6 Months)';

                    return (
                      <div
                        key={e.courseId}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-extrabold text-slate-900 text-sm">{e.courseName}</p>
                            <p className="text-slate-500">
                              Batch: <strong className="text-slate-800">{e.batchName}</strong> • Progress: {e.progress}%
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-emerald-700 font-bold block">
                              Paid: ₹{e.paidAmount.toLocaleString('en-IN')} / ₹{e.totalFee.toLocaleString('en-IN')}
                            </span>
                            <span
                              className={
                                e.dueAmount > 0 ? 'text-[#dc2626] font-extrabold' : 'text-slate-400'
                              }
                            >
                              Due: ₹{e.dueAmount.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>

                        {/* Admin Duration Access Controls */}
                        <div className="pt-2 border-t border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-white p-3 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[#0056b3]" />
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                Course & Mock Test Access Duration
                              </span>
                              <span
                                className={`font-bold ${
                                  isExp ? 'text-red-600' : 'text-emerald-700'
                                }`}
                              >
                                {isExp ? `Expired on ${dateFormatted}` : `Active till ${dateFormatted}`}
                              </span>
                            </div>
                          </div>

                          {e.id && (
                            <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">
                              <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">
                                Extend:
                              </span>
                              <button
                                type="button"
                                disabled={updatingEnrollmentId === e.id}
                                onClick={() => handleExtendStudentEnrollment(e.id!, 1)}
                                className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0056b3] font-bold text-[11px] cursor-pointer"
                              >
                                +1M
                              </button>
                              <button
                                type="button"
                                disabled={updatingEnrollmentId === e.id}
                                onClick={() => handleExtendStudentEnrollment(e.id!, 3)}
                                className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0056b3] font-bold text-[11px] cursor-pointer"
                              >
                                +3M
                              </button>
                              <button
                                type="button"
                                disabled={updatingEnrollmentId === e.id}
                                onClick={() => handleExtendStudentEnrollment(e.id!, 6)}
                                className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0056b3] font-bold text-[11px] cursor-pointer"
                              >
                                +6M
                              </button>
                              <button
                                type="button"
                                disabled={updatingEnrollmentId === e.id}
                                onClick={() => handleExtendStudentEnrollment(e.id!, 12)}
                                className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] cursor-pointer"
                              >
                                +1Y
                              </button>
                              <div className="flex items-center gap-1 ml-1">
                                <input
                                  type="date"
                                  value={customValidityDates[e.id] || ''}
                                  onChange={(evt) =>
                                    setCustomValidityDates({
                                      ...customValidityDates,
                                      [e.id!]: evt.target.value,
                                    })
                                  }
                                  className="px-2 py-1 border border-slate-200 rounded-lg text-[11px]"
                                />
                                <button
                                  type="button"
                                  disabled={
                                    updatingEnrollmentId === e.id || !customValidityDates[e.id]
                                  }
                                  onClick={() => handleSetCustomEnrollmentDate(e.id!)}
                                  className="px-2.5 py-1 rounded-lg bg-[#0056b3] text-white font-bold text-[11px] disabled:opacity-40 cursor-pointer"
                                >
                                  Set
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Mock Test Performance */}
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                Mock Test Attempts & Scores
              </h3>
              {db.testAttempts.filter((a) => a.studentId === inspectingStudent.id).length === 0 ? (
                <p className="text-xs text-slate-500">No mock test attempts recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {db.testAttempts
                    .filter((a) => a.studentId === inspectingStudent.id)
                    .map((att) => (
                      <div
                        key={att.id}
                        className="p-3 rounded-2xl bg-blue-50/50 border border-blue-200/80 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{att.testTitle}</p>
                          <p className="text-slate-500 whitespace-nowrap">
                            Submitted: {att.submittedAt}
                          </p>
                        </div>
                        <div className="text-right whitespace-nowrap shrink-0">
                          <span className="font-extrabold text-[#0056b3] text-sm block">
                            Score: {att.score}/{att.totalMarks}
                          </span>
                          <span className="text-emerald-700 font-bold">
                            Accuracy: {att.accuracy}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Permanent Candidate Purge Action */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-semibold">
                Permanent database removal
              </span>
              <button
                type="button"
                onClick={() => {
                  const target = inspectingStudent;
                  setInspectingStudent(null);
                  setDeleteTarget(target);
                }}
                className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-[#dc2626] font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove Candidate & All Information
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ADD / EDIT STUDENT MODAL ==================== */}
      {editingStudent && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/65 p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveStudentForm}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-[#0a0e2a]">
                {isNewStudent ? 'Add New Student' : 'Edit Student Profile'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editingStudent.name}
                  onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={editingStudent.email}
                  onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone (10-Digit Mobile) *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 9876543210"
                  value={editingStudent.phone}
                  onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Guardian Name *</label>
                <input
                  type="text"
                  required
                  value={editingStudent.guardianName}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, guardianName: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Qualification *</label>
                <input
                  type="text"
                  required
                  value={editingStudent.qualification}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, qualification: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Exam *</label>
                <input
                  type="text"
                  required
                  value={editingStudent.targetExam}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, targetExam: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Present Address *</label>
                <input
                  type="text"
                  required
                  value={editingStudent.address}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, address: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Permanent Address</label>
                <input
                  type="text"
                  value={editingStudent.permanentAddress || ''}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, permanentAddress: e.target.value })
                  }
                  placeholder="Leave empty if same as present"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#0056b3] text-white text-xs font-bold cursor-pointer"
              >
                Save Student
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Student Record?"
        message={`Are you sure you want to permanently remove ${deleteTarget?.name} (${deleteTarget?.studentCode}) from C.G.A records?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteStudent(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
