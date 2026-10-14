'use client';

import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Download,
  Eye,
  Edit3,
  Power,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { StudentProfile } from '@/data/initialSeedData';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function AdminStudentsPage() {
  const { db, saveStudent, toggleStudentStatus, deleteStudent, showToast } = useCga();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [inspectingStudent, setInspectingStudent] = useState<StudentProfile | null>(null);
  const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(null);
  const [isNewStudent, setIsNewStudent] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StudentProfile | null>(null);

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
      address: 'Udaipur, Gomati Tripura 799114',
      qualification: 'B.A. / B.Ed.',
      targetExam: 'Tripura TET / STGT',
      joinedDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      enrollments: [],
    });
  };

  const handleSaveStudentForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !editingStudent.name.trim() || !editingStudent.email.trim()) return;
    const result = await saveStudent(editingStudent, isNewStudent);
    setEditingStudent(null);
    if (result.tempPassword) {
      window.prompt(
        `Account created for ${editingStudent.email}.\nShare this ONE-TIME temporary password securely (copy it now; it is not shown again). The student should change it via "Forgot Password".`,
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
                      <span className="text-slate-500">{stu.phone}</span>
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

            {/* Enrolled Courses & Fee Status */}
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                Enrolled Courses & Fee Breakdown
              </h3>
              {inspectingStudent.enrollments.length === 0 ? (
                <p className="text-xs text-slate-500">No courses enrolled.</p>
              ) : (
                <div className="space-y-2">
                  {inspectingStudent.enrollments.map((e) => (
                    <div
                      key={e.courseId}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <p className="font-extrabold text-slate-900">{e.courseName}</p>
                        <p className="text-slate-500">
                          Batch: {e.batchName} • Progress: {e.progress}%
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-700 font-bold block">
                          Paid: ₹{e.paidAmount.toLocaleString('en-IN')} / ₹
                          {e.totalFee.toLocaleString('en-IN')}
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
                  ))}
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
                <label className="font-bold text-slate-700 block mb-1">Phone</label>
                <input
                  type="text"
                  value={editingStudent.phone}
                  onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Guardian Name</label>
                <input
                  type="text"
                  value={editingStudent.guardianName}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, guardianName: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Qualification</label>
                <input
                  type="text"
                  value={editingStudent.qualification}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, qualification: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Exam</label>
                <input
                  type="text"
                  value={editingStudent.targetExam}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, targetExam: e.target.value })
                  }
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
