'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Eye,
  PlusCircle,
  Filter,
  Clock,
  Check,
  X,
  Copy,
  ImageIcon,
  ShieldCheck,
  ExternalLink,
  Coins,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { ReceiptModal } from '@/components/student/ReceiptModal';
import { FeePayment } from '@/data/initialSeedData';
import { MaskedData } from '@/components/ui/MaskedData';

export default function AdminFeesPage() {
  const { db, payCourseDue, approvePayment, rejectPayment, showToast } = useCga();
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('All');
  const [onlyDefaulters, setOnlyDefaulters] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<FeePayment | null>(null);

  // Verification modal states
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    studentName: string;
    utr: string;
    amount: number;
    courseName: string;
  } | null>(null);

  const [rejectTarget, setRejectTarget] = useState<{
    id: string;
    studentName: string;
    amount: number;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

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

  const pendingPayments = db.feePayments.filter((p) => p.status === 'Pending');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUtr(text);
    showToast('Copied to Clipboard', text, 'info');
    setTimeout(() => setCopiedUtr(null), 2500);
  };

  const handleApprove = async (id: string, name: string) => {
    if (!window.confirm(`Approve payment and unlock course access for ${name}?`)) return;
    await approvePayment(id);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTarget) return;
    await rejectPayment(rejectTarget.id, rejectReason || 'Payment details could not be verified in bank ledger.');
    setRejectTarget(null);
    setRejectReason('');
  };

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

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordTarget || payAmount <= 0) return;
    const res = await payCourseDue({
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a0e2a]">
            Fee Collection, Receipts & Defaulter Tracker
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Review student online UPI / Bank verifications, track cleared and pending balances, filter fee defaulters by
            course or batch, and generate official C.G.A receipts.
          </p>
        </div>
        <Link
          href="/admin/counter-enrollment"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all shrink-0 cursor-pointer"
        >
          <Coins className="w-4 h-4 text-emerald-200" />
          Physical Walk-in & Counter Cash
        </Link>
      </div>

      {/* ================= PENDING ONLINE PAYMENT VERIFICATIONS ================= */}
      <div className={`rounded-3xl border p-6 shadow-sm transition-all ${
        pendingPayments.length > 0
          ? 'bg-gradient-to-br from-amber-50/70 via-white to-amber-50/40 border-amber-300 ring-2 ring-amber-400/20'
          : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              pendingPayments.length > 0 ? 'bg-amber-500 text-white animate-bounce' : 'bg-slate-100 text-slate-400'
            }`}>
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#0a0e2a] flex items-center gap-2">
                Pending Online Payment Verifications
                {pendingPayments.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#dc2626] text-white text-[11px] font-extrabold tracking-wide">
                    {pendingPayments.length} ACTION REQUIRED
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">
                Students who initiated UPI app payment or SBI bank transfer and submitted their 12-digit UTR & screenshot.
              </p>
            </div>
          </div>
          {pendingPayments.length === 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> All payments verified
            </span>
          )}
        </div>

        {pendingPayments.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            No pending payments waiting for verification right now.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingPayments.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-2xl bg-white border border-amber-200 shadow-2xs hover:shadow-xs transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-sm text-[#0a0e2a]">{p.studentName}</span>
                    <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      Ref: {p.receiptNo}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {p.date}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">
                    Course: <strong className="text-slate-800">{p.courseName}</strong> • Type:{' '}
                    <strong>{p.paymentType}</strong> • Mode: <strong>{p.paymentMode}</strong>
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 font-mono text-xs font-bold text-slate-800 border border-slate-200">
                      <span>UTR: {p.utr || 'Not provided'}</span>
                      {p.utr && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(p.utr!)}
                          className="hover:text-blue-600 cursor-pointer ml-1"
                          title="Copy UTR"
                        >
                          {copiedUtr === p.utr ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>

                    {p.screenshot && (
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewImage({
                            url: p.screenshot!,
                            studentName: p.studentName,
                            utr: p.utr || 'N/A',
                            amount: p.amount,
                            courseName: p.courseName,
                          })
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 cursor-pointer transition-colors"
                      >
                        <ImageIcon className="w-3.5 h-3.5" /> View Payment Screenshot
                      </button>
                    )}

                    {p.remarks && (
                      <span className="text-[11px] text-slate-500 italic">
                        Note: &quot;{p.remarks}&quot;
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <div className="text-left lg:text-right pr-2">
                    <span className="text-[11px] text-slate-400 block font-bold uppercase">Amount Claimed</span>
                    <span className="text-xl font-extrabold text-[#0056b3]">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleApprove(p.id, p.studentName)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs cursor-pointer transition-all"
                    >
                      <Check className="w-4 h-4" /> Approve & Unlock
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setRejectTarget({
                          id: p.id,
                          studentName: p.studentName,
                          amount: p.amount,
                        })
                      }
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs cursor-pointer transition-all"
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <span>{row.studentCode} •</span>
                      <MaskedData value={row.phone} type="phone" subjectId={row.studentCode} className="text-[11px] text-slate-500" />
                    </div>
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
                <th className="py-3 px-3">Receipt / Ref</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Student</th>
                <th className="py-3 px-3">Course</th>
                <th className="py-3 px-3">Mode</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {db.feePayments.map((pay) => {
                const status = pay.status ?? 'Verified';
                return (
                  <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#0056b3] whitespace-nowrap">
                      <div>{pay.receiptNo}</div>
                      {pay.utr && (
                        <div className="text-[10px] text-slate-400 font-mono">UTR: {pay.utr}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{pay.date}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{pay.studentName}</td>
                    <td className="py-3 px-3 text-slate-700">{pay.courseName}</td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{pay.paymentMode}</td>
                    <td className="py-3 px-3 font-extrabold text-emerald-700 whitespace-nowrap">
                      ₹{pay.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {status === 'Verified' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[11px]">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      )}
                      {status === 'Pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-300 text-[11px]">
                          <Clock className="w-3 h-3 animate-spin" /> Pending
                        </span>
                      )}
                      {status === 'Rejected' && (
                        <span
                          title={pay.rejectionReason}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 font-bold border border-red-200 text-[11px]"
                        >
                          <AlertCircle className="w-3 h-3" /> Rejected
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setViewingReceipt(pay)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-[#0056b3] font-bold cursor-pointer whitespace-nowrap hover:bg-blue-100 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Receipt
                      </button>
                    </td>
                  </tr>
                );
              })}
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

      {/* Payment Screenshot Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Payment Proof Screenshot</h3>
                <p className="text-[11px] text-slate-300">
                  {previewImage.studentName} • ₹{previewImage.amount.toLocaleString('en-IN')} • UTR: {previewImage.utr}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage.url}
                alt="Payment Screenshot"
                className="max-h-[60vh] max-w-full object-contain rounded-xl border border-slate-300 shadow-xs"
              />
            </div>
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium font-mono">
                Course: {previewImage.courseName}
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Dialog */}
      {rejectTarget && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/70 p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleConfirmReject}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs"
          >
            <div className="flex items-center gap-2 text-red-600 font-extrabold text-sm">
              <AlertCircle className="w-4 h-4" /> Reject Payment Verification
            </div>
            <p className="text-slate-600">
              Rejecting payment for <strong>{rejectTarget.studentName}</strong> (₹{rejectTarget.amount.toLocaleString('en-IN')}).
              The student will see this reason in their portal.
            </p>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Reason for Rejection:
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., UTR not found in bank statement, or amount does not match."
                required
                className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectTarget(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        </div>
      )}

      <ReceiptModal receipt={viewingReceipt} onClose={() => setViewingReceipt(null)} />
    </div>
  );
}
