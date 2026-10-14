'use client';

import React, { useState } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, Eye, Receipt } from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { ReceiptModal } from '@/components/student/ReceiptModal';
import { FeePayment } from '@/data/initialSeedData';

export default function StudentFeesPage() {
  const { db, currentStudent, payCourseDue } = useCga();
  const [selectedReceipt, setSelectedReceipt] = useState<FeePayment | null>(null);
  const [payingCourseId, setPayingCourseId] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<FeePayment['paymentMode']>('UPI');

  if (!currentStudent) return null;

  const totalFee = currentStudent.enrollments.reduce((acc, e) => acc + e.totalFee, 0);
  const totalPaid = currentStudent.enrollments.reduce((acc, e) => acc + e.paidAmount, 0);
  const totalDue = currentStudent.enrollments.reduce((acc, e) => acc + e.dueAmount, 0);

  const myPayments = db.feePayments.filter((p) => p.studentId === currentStudent.id);
  const activePayEnrollment = currentStudent.enrollments.find((e) => e.courseId === payingCourseId);

  const handlePayBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePayEnrollment) return;
    const res = await payCourseDue({
      studentId: currentStudent.id,
      courseId: activePayEnrollment.courseId,
      amount: activePayEnrollment.dueAmount,
      paymentMode,
      remarks: 'Balance instalment paid via Student Portal.',
    });
    if (res.success && res.receipt) {
      setPayingCourseId(null);
      setSelectedReceipt(res.receipt);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0a0e2a]">
          Fee Ledger, Instalment Dues & Official Receipts
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Track your course-wise fee status, pay pending instalments online, and download official
          Career Guidance Academy receipts.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold uppercase text-slate-400">Total Enrolled Fees</span>
          <p className="text-2xl font-extrabold text-[#0a0e2a] mt-1">
            ₹{totalFee.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold uppercase text-slate-400">Total Amount Paid</span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
            ₹{totalPaid.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold uppercase text-slate-400">Pending Dues</span>
          <p
            className={`text-2xl font-extrabold mt-1 ${
              totalDue > 0 ? 'text-[#dc2626]' : 'text-emerald-600'
            }`}
          >
            ₹{totalDue.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Course-wise Fee Breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h2 className="text-lg font-extrabold text-[#0a0e2a]">Course-Wise Fee Status</h2>
        <div className="space-y-3">
          {currentStudent.enrollments.map((enr) => (
            <div
              key={enr.courseId}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <span className="text-[11px] font-bold text-[#0056b3] uppercase">
                  {enr.batchName}
                </span>
                <h3 className="text-sm font-extrabold text-slate-900">{enr.courseName}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Total Fee: <strong>₹{enr.totalFee.toLocaleString('en-IN')}</strong> • Paid:{' '}
                  <strong className="text-emerald-600">
                    ₹{enr.paidAmount.toLocaleString('en-IN')}
                  </strong>{' '}
                  • Due:{' '}
                  <strong className={enr.dueAmount > 0 ? 'text-[#dc2626]' : 'text-emerald-600'}>
                    ₹{enr.dueAmount.toLocaleString('en-IN')}
                  </strong>
                </p>
              </div>

              {enr.dueAmount > 0 ? (
                <button
                  type="button"
                  onClick={() => setPayingCourseId(enr.courseId)}
                  className="px-4 py-2.5 rounded-xl bg-[#dc2626] hover:bg-red-700 text-white text-xs font-extrabold shrink-0 cursor-pointer"
                >
                  Pay Balance ₹{enr.dueAmount.toLocaleString('en-IN')}
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Fully Paid
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Payment History Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h2 className="text-lg font-extrabold text-[#0a0e2a] flex items-center gap-2">
          <Receipt className="w-5 h-5 text-[#0056b3]" /> Payment History & Downloadable Receipts
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase">
                <th className="py-3 px-3">Receipt No.</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Course</th>
                <th className="py-3 px-3">Type / Mode</th>
                <th className="py-3 px-3">Amount Paid</th>
                <th className="py-3 px-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myPayments.map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-3 font-mono font-bold text-[#0056b3] whitespace-nowrap">
                    {pay.receiptNo}
                  </td>
                  <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">{pay.date}</td>
                  <td className="py-3.5 px-3 font-bold text-slate-900">{pay.courseName}</td>
                  <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">
                    {pay.paymentType} ({pay.paymentMode})
                  </td>
                  <td className="py-3.5 px-3 font-extrabold text-emerald-700 whitespace-nowrap">
                    ₹{pay.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setSelectedReceipt(pay)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0056b3] font-bold cursor-pointer whitespace-nowrap"
                    >
                      <Eye className="w-3.5 h-3.5" /> View / Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Due Modal */}
      {activePayEnrollment && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handlePayBalance}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200"
          >
            <h3 className="text-lg font-extrabold text-[#0a0e2a]">
              Pay Pending Instalment Balance
            </h3>
            <p className="text-xs text-slate-600">{activePayEnrollment.courseName}</p>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-600">Due Amount Payable:</span>
              <span className="text-xl font-extrabold text-[#dc2626]">
                ₹{activePayEnrollment.dueAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Select Simulated Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as FeePayment['paymentMode'])}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                <option value="Debit/Credit Card">Debit / Credit Card</option>
                <option value="Net Banking">Net Banking</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPayingCourseId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#0056b3] text-white text-xs font-bold cursor-pointer"
              >
                Confirm Payment & Get Receipt
              </button>
            </div>
          </form>
        </div>
      )}

      <ReceiptModal receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
    </div>
  );
}
