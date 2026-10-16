'use client';

import React, { useState } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, Eye, Receipt, Clock, Sparkles } from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { ReceiptModal } from '@/components/student/ReceiptModal';
import { PayManualModal, type PayManualTarget } from '@/components/payment/PayManualModal';
import { FeePayment } from '@/data/initialSeedData';

export default function StudentFeesPage() {
  const { db, currentStudent, showToast } = useCga();
  const [selectedReceipt, setSelectedReceipt] = useState<FeePayment | null>(null);
  const [payTarget, setPayTarget] = useState<PayManualTarget | null>(null);

  if (!currentStudent) return null;

  const totalFee = currentStudent.enrollments.reduce((acc, e) => acc + e.totalFee, 0);
  const totalPaid = currentStudent.enrollments.reduce((acc, e) => acc + e.paidAmount, 0);
  const totalDue = currentStudent.enrollments.reduce((acc, e) => acc + e.dueAmount, 0);

  const myPayments = db.feePayments.filter((p) => p.studentId === currentStudent.id);
  const pendingPayments = myPayments.filter((p) => p.status === 'Pending');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0a0e2a]">
          Fee Ledger, Instalment Dues & Official Receipts
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Track your course-wise fee status, pay pending instalments online via UPI / Bank transfer, and download official
          Career Guidance Academy receipts.
        </p>
      </div>

      {/* Pending Verifications Notice Banner */}
      {pendingPayments.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3.5 shadow-2xs">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
          <div className="text-xs space-y-1">
            <h3 className="font-extrabold text-amber-900 text-sm flex items-center gap-2">
              Payment Under Admin Verification ({pendingPayments.length})
            </h3>
            <p className="text-amber-800 leading-relaxed">
              You have submitted verification for your recent payment. Our admissions desk verifies bank UTRs within up to 6 hours (9:00 AM – 9:00 PM). Once verified, your cleared due balance and official download receipt will update automatically.
            </p>
            <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px] font-bold text-amber-900">
              {pendingPayments.map((p) => (
                <span key={p.id} className="bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-300">
                  Ref: {p.receiptNo} • UTR: {p.utr || 'Submitted'} • ₹{p.amount.toLocaleString('en-IN')}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

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
                  onClick={() =>
                    setPayTarget({
                      itemType: 'course',
                      itemId: enr.courseId,
                      title: enr.courseName,
                      fullAmount: enr.totalFee,
                      dueAmount: enr.dueAmount,
                      paymentType: 'balance',
                    })
                  }
                  className="px-4 py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-extrabold shrink-0 cursor-pointer shadow-xs inline-flex items-center gap-1.5 transition-all"
                >
                  <CreditCard className="w-3.5 h-3.5" /> Pay Due ₹{enr.dueAmount.toLocaleString('en-IN')} via UPI / Bank
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
                <th className="py-3 px-3">Receipt / Ref</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Course</th>
                <th className="py-3 px-3">Type / Mode</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Verification Status</th>
                <th className="py-3 px-3 text-right">Official Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No payment records found yet.
                  </td>
                </tr>
              ) : (
                myPayments.map((pay) => {
                  const status = pay.status ?? 'Verified';
                  return (
                    <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-bold text-[#0056b3] whitespace-nowrap">
                        <div>{pay.receiptNo}</div>
                        {pay.utr && (
                          <div className="text-[10px] text-slate-400 font-mono">UTR: {pay.utr}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">{pay.date}</td>
                      <td className="py-3.5 px-3 font-bold text-slate-900">{pay.courseName}</td>
                      <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">
                        {pay.paymentType} ({pay.paymentMode})
                      </td>
                      <td className="py-3.5 px-3 font-extrabold text-emerald-700 whitespace-nowrap">
                        ₹{pay.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {status === 'Verified' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[11px]">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        )}
                        {status === 'Pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-300 text-[11px] animate-pulse">
                            <Clock className="w-3 h-3" /> Under Verification
                          </span>
                        )}
                        {status === 'Rejected' && (
                          <span
                            title={pay.rejectionReason}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 font-bold border border-red-200 text-[11px]"
                          >
                            <AlertCircle className="w-3 h-3" /> Rejected
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        {status === 'Verified' ? (
                          <button
                            type="button"
                            onClick={() => setSelectedReceipt(pay)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0056b3] font-bold cursor-pointer whitespace-nowrap transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" /> View / Download
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Available after verify
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unified Manual Payment (UPI & Bank) Flow */}
      {payTarget && (
        <PayManualModal
          target={payTarget}
          onClose={() => setPayTarget(null)}
          onSuccess={(refCode) => {
            showToast(
              'Instalment Payment Submitted',
              `Verification reference ${refCode} received. Once approved by admin, your fee ledger will update automatically.`,
              'success'
            );
            setPayTarget(null);
          }}
        />
      )}

      {/* Official Receipt Modal */}
      <ReceiptModal receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
    </div>
  );
}
