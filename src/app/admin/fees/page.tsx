'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Eye,
  PlusCircle,
  Filter,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { ReceiptModal } from '@/components/student/ReceiptModal';
import { FeePayment } from '@/data/initialSeedData';

export default function AdminFeesPage() {
  const { db, payCourseDue } = useCga();
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('All');
  const [onlyDefaulters, setOnlyDefaulters] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<FeePayment | null>(null);

  // Record payment modal state
  const [recordTarget, setRecordTarget] = useState<{
    studentId: string;
    studentName: string;
    courseId: string;
    courseName: string;
    dueAmount: number;
  } | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<FeePayment['paymentMode']>('Cash at Counter');

  // Flatten student enrollments for fee tracking & defaulter filtering
  const allFeeRows = db.students.flatMap((stu) =>
    stu.enrollments.map((enr) => ({
      studentId: stu.id,
      studentCode: stu.studentCode,
      studentName: stu.name,
      phone: stu.phone,
      ...enr,
    }))
  );

  const filteredFeeRows = allFeeRows.filter((row) => {
    const matchCourse = selectedCourseFilter === 'All' || row.courseId === selectedCourseFilter;
    const matchDefaulter = !onlyDefaulters || row.dueAmount > 0;
    return matchCourse && matchDefaulter;
  });

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordTarget || payAmount <= 0) return;
    const res = payCourseDue({
      studentId: recordTarget.studentId,
      courseId: recordTarget.courseId,
      amount: payAmount,
      paymentMode,
      remarks: 'Recorded by C.G.A Administrator at Udaipur Office.',
    });
    if (res.success && res.receipt) {
      setRecordTarget(null);
      setViewingReceipt(res.receipt);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0a0e2a]">
          Fee Collection, Receipts & Defaulter Tracker
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Record student fee payments, track paid and pending balances, filter fee defaulters by
          course or batch, and generate official C.G.A receipts.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#0056b3]" /> Filter by Course / Batch:
          </span>
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
          >
            <option value="All">All Courses & Batches</option>
            {db.courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.batchName})
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => setOnlyDefaulters(!onlyDefaulters)}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 border cursor-pointer transition-all ${
            onlyDefaulters
              ? 'bg-[#dc2626] text-white border-[#dc2626]'
              : 'bg-red-50 text-[#dc2626] border-red-200 hover:bg-red-100'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          {onlyDefaulters ? 'Showing Fee Defaulters Only (Click for All)' : 'Filter Fee Defaulters'}
        </button>
      </div>

      {/* Student Fee Ledger & Defaulters Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Course & Batch</th>
                <th className="py-3.5 px-4">Total Fee</th>
                <th className="py-3.5 px-4">Paid Amount</th>
                <th className="py-3.5 px-4">Due Balance</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFeeRows.map((row) => (
                <tr key={`${row.studentId}-${row.courseId}`} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4">
                    <p className="font-extrabold text-slate-900">{row.studentName}</p>
                    <p className="text-[11px] text-slate-500">
                      {row.studentCode} • {row.phone}
                    </p>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-800">{row.courseName}</p>
                    <span className="text-[11px] text-[#0056b3] font-semibold">
                      {row.batchName}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold whitespace-nowrap">
                    ₹{row.totalFee.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-emerald-700 whitespace-nowrap">
                    ₹{row.paidAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {row.dueAmount > 0 ? (
                      <span className="px-2.5 py-1 rounded-full bg-red-50 text-[#dc2626] border border-red-200 font-extrabold whitespace-nowrap">
                        Due: ₹{row.dueAmount.toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold whitespace-nowrap">
                        Cleared
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    {row.dueAmount > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setRecordTarget({
                            studentId: row.studentId,
                            studentName: row.studentName,
                            courseId: row.courseId,
                            courseName: row.courseName,
                            dueAmount: row.dueAmount,
                          });
                          setPayAmount(row.dueAmount);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white font-bold cursor-pointer whitespace-nowrap"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> Record Payment
                      </button>
                    ) : (
                      <span className="text-slate-400 font-semibold whitespace-nowrap">
                        Paid in Full
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Generated Fee Receipts */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h2 className="text-lg font-extrabold text-[#0a0e2a]">
          Official Fee Receipts Register ({db.feePayments.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase">
                <th className="py-3 px-3">Receipt No.</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Student</th>
                <th className="py-3 px-3">Course</th>
                <th className="py-3 px-3">Mode</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {db.feePayments.map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-mono font-bold text-[#0056b3] whitespace-nowrap">
                    {pay.receiptNo}
                  </td>
                  <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{pay.date}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">{pay.studentName}</td>
                  <td className="py-3 px-3 text-slate-700">{pay.courseName}</td>
                  <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{pay.paymentMode}</td>
                  <td className="py-3 px-3 font-extrabold text-emerald-700 whitespace-nowrap">
                    ₹{pay.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setViewingReceipt(pay)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-[#0056b3] font-bold cursor-pointer whitespace-nowrap"
                    >
                      <Eye className="w-3.5 h-3.5" /> Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {recordTarget && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/65 p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleRecordPayment}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs"
          >
            <h3 className="text-base font-extrabold text-[#0a0e2a]">
              Record Fee Payment & Generate Receipt
            </h3>
            <p className="text-slate-600">
              Student: <strong>{recordTarget.studentName}</strong> • {recordTarget.courseName}
            </p>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Amount Received (₹) — Max Due: ₹{recordTarget.dueAmount}
              </label>
              <input
                type="number"
                min={100}
                max={recordTarget.dueAmount}
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as FeePayment['paymentMode'])}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-bold"
              >
                <option value="Cash at Counter">Cash at Counter (Udaipur Office)</option>
                <option value="UPI">UPI</option>
                <option value="Debit/Credit Card">Debit/Credit Card</option>
                <option value="Net Banking">Net Banking</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRecordTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#0056b3] text-white font-bold cursor-pointer"
              >
                Record & Generate Receipt
              </button>
            </div>
          </form>
        </div>
      )}

      <ReceiptModal receipt={viewingReceipt} onClose={() => setViewingReceipt(null)} />
    </div>
  );
}
