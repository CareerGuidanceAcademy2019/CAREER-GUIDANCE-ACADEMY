'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  Receipt,
  Eye,
  ExternalLink,
  Copy,
  Check,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  FileText,
  BookOpen,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { PayManualModal, type PayManualTarget } from '@/components/payment/PayManualModal';
import { ReceiptModal } from '@/components/student/ReceiptModal';
import { PaymentRequest, PaymentStatus } from '@/types/payments';
import { PAYMENT_SETTINGS } from '@/config/paymentSettings';
import { FeePayment } from '@/data/initialSeedData';

export default function StudentPaymentsPage() {
  const { currentStudent, session, showToast, db } = useCga();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'awaiting'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<FeePayment | null>(null);
  const [resubmitTarget, setResubmitTarget] = useState<PayManualTarget | null>(null);

  // Local state for payment requests
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayments = async () => {
    if (!currentStudent) return;
    setIsLoading(true);
    try {
      // 1. Try Supabase client if available
      const { createClient } = await import('@/lib/supabase/client');
      const sb = createClient();
      const { data, error } = await sb
        .from('payment_requests')
        .select('*')
        .eq('student_id', currentStudent.id)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: PaymentRequest[] = data.map((r: any) => ({
          id: r.id,
          studentId: r.student_id,
          itemType: r.item_type,
          itemId: r.item_id,
          paymentType: r.payment_type,
          expectedAmount: Number(r.expected_amount),
          referenceCode: r.reference_code,
          paymentChannel: r.payment_channel,
          paymentMethod: r.payment_method || 'upi_manual',
          utr: r.utr,
          utrNormalized: r.utr_normalized,
          amountReceived: r.amount_received ? Number(r.amount_received) : null,
          screenshotPath: r.screenshot_path,
          status: r.status,
          reviewedBy: r.reviewed_by,
          reviewedAt: r.reviewed_at,
          rejectReason: r.reject_reason,
          expiresAt: r.expires_at,
          createdAt: r.created_at,
        }));
        setRequests(mapped);
        setIsLoading(false);
        return;
      }
    } catch {
      // Supabase unavailable or table empty; fall back to local storage and db.feePayments
    }

    // 2. Fallback to localStorage + db.feePayments
    try {
      const localStored = localStorage.getItem('cga_payment_requests');
      let localList: PaymentRequest[] = localStored ? JSON.parse(localStored) : [];
      localList = localList.filter((r) => r.studentId === currentStudent.id);

      // Also synthesize from db.feePayments for the student if not already in localList
      const existingRefs = new Set(localList.map((r) => r.referenceCode));
      const studentFeePayments = db.feePayments.filter((p) => p.studentId === currentStudent.id);

      const feeMapped: PaymentRequest[] = studentFeePayments
        .filter((p) => !existingRefs.has(p.receiptNo))
        .map((p) => ({
          id: p.id,
          studentId: p.studentId,
          itemType: 'course',
          itemId: p.courseId,
          paymentType: p.paymentType === 'Instalment 1' ? 'instalment_1' : p.paymentType === 'Instalment 2' ? 'instalment_2' : 'full',
          expectedAmount: p.amount,
          referenceCode: p.receiptNo,
          paymentChannel: 'upi',
          paymentMethod: 'upi_manual',
          utr: p.utr,
          status: p.status === 'Verified' ? 'approved' : p.status === 'Rejected' ? 'rejected' : 'pending_review',
          reviewedBy: p.reviewedBy,
          reviewedAt: p.reviewedAt,
          rejectReason: p.rejectionReason,
          expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
          createdAt: p.date ? new Date(p.date).toISOString() : new Date().toISOString(),
        }));

      setRequests([...localList, ...feeMapped]);
    } catch {
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [currentStudent?.id]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    showToast('Copied Reference Code', text, 'info');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (activeTab === 'all') return true;
      if (activeTab === 'pending') return r.status === 'pending_review';
      if (activeTab === 'approved') return r.status === 'approved';
      if (activeTab === 'rejected') return r.status === 'rejected';
      if (activeTab === 'awaiting') return r.status === 'awaiting_payment';
      return true;
    });
  }, [requests, activeTab]);

  const stats = useMemo(() => {
    const pending = requests.filter((r) => r.status === 'pending_review').length;
    const approved = requests.filter((r) => r.status === 'approved').length;
    const rejected = requests.filter((r) => r.status === 'rejected').length;
    const awaiting = requests.filter((r) => r.status === 'awaiting_payment').length;
    const totalPaid = requests
      .filter((r) => r.status === 'approved')
      .reduce((sum, r) => sum + r.expectedAmount, 0);
    return { pending, approved, rejected, awaiting, totalPaid };
  }, [requests]);

  const getItemTitle = (itemType: string, itemId: string) => {
    if (itemType === 'course') {
      const course = db.courses.find((c) => c.id === itemId);
      return course ? course.name : 'Classroom / Online Course';
    }
    if (itemType === 'material') {
      const mat = db.studyMaterials.find((m) => m.id === itemId);
      return mat ? mat.title : 'Study Material & Notes';
    }
    if (itemType === 'mock_series') {
      return 'T-TET 2026 Test Series (15 Mocks)';
    }
    return itemId;
  };

  const handleOpenReceipt = (req: PaymentRequest) => {
    const receiptObj: FeePayment = {
      id: req.id,
      receiptNo: req.referenceCode,
      studentId: req.studentId,
      studentName: currentStudent?.name || 'Student',
      courseId: req.itemId,
      courseName: getItemTitle(req.itemType, req.itemId),
      amount: req.expectedAmount,
      paymentMode: req.paymentChannel === 'bank_transfer' ? 'Net Banking' : 'UPI',
      paymentType: req.paymentType === 'full' ? 'Full Payment' : req.paymentType === 'instalment_1' ? 'Instalment 1' : 'Instalment 2',
      date: req.reviewedAt ? req.reviewedAt.split('T')[0] : req.createdAt.split('T')[0],
      remarks: `Manual verification approved. UTR: ${req.utr || 'Verified'}`,
      status: 'Verified',
      reviewedBy: req.reviewedBy || 'Admissions Administrator',
      reviewedAt: req.reviewedAt || undefined,
      utr: req.utr || undefined,
    };
    setSelectedReceipt(receiptObj);
  };

  const handleResubmit = (req: PaymentRequest) => {
    setResubmitTarget({
      itemType: req.itemType,
      itemId: req.itemId,
      title: getItemTitle(req.itemType, req.itemId),
      fullAmount: req.expectedAmount,
      paymentType: req.paymentType,
    });
  };

  if (!currentStudent) return null;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a0e2a] flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-[#0056b3]" /> My Payments & Proofs
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Track your manual UPI and Bank transfer submissions, verify approval status, and download official receipts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/how-to-pay"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-[#0056b3] hover:bg-blue-100 text-xs font-bold transition-all border border-blue-200"
          >
            <HelpCircle className="w-4 h-4" /> How to Pay Guide
          </Link>
          <button
            type="button"
            onClick={fetchPayments}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-2xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Verification Notice Banner */}
      {stats.pending > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3.5 shadow-2xs">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
          <div className="text-xs space-y-1">
            <h3 className="font-extrabold text-amber-900 text-sm flex items-center gap-2">
              Payment Under Admin Verification ({stats.pending})
            </h3>
            <p className="text-amber-800 leading-relaxed">
              {PAYMENT_SETTINGS.paymentInstructionsExtra || 'Approval will be verified within 24 hrs'}. Our desk checks the UTR in the official bank statement. Once verified, your course or materials will unlock automatically.
            </p>
          </div>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-slate-400 block">Pending Review</span>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-slate-400 block">Approved</span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-slate-400 block">Rejected</span>
          <p className={`text-2xl font-extrabold mt-1 ${stats.rejected > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
            {stats.rejected}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-slate-400 block">Total Verified</span>
          <p className="text-2xl font-extrabold text-[#0a0e2a] mt-1">₹{stats.totalPaid.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { key: 'all', label: `All Requests (${requests.length})` },
          { key: 'pending', label: `Under Review (${stats.pending})` },
          { key: 'approved', label: `Approved (${stats.approved})` },
          { key: 'rejected', label: `Rejected (${stats.rejected})` },
          { key: 'awaiting', label: `Awaiting Proof (${stats.awaiting})` },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === t.key
                ? 'bg-[#0056b3] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <CreditCard className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#0a0e2a]">No Payment Requests Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You do not have any payment records matching this filter. Browse our courses, study materials, or mock test series to enrol.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link
              href="/student/courses"
              className="px-5 py-2.5 rounded-xl bg-[#0056b3] text-white text-xs font-bold hover:bg-[#1e3a8a] transition-all"
            >
              Explore Courses
            </Link>
            <Link
              href="/student/materials"
              className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-all"
            >
              Study Materials
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const isApproved = req.status === 'approved';
            const isPending = req.status === 'pending_review';
            const isRejected = req.status === 'rejected';
            const isAwaiting = req.status === 'awaiting_payment';
            const isExpired = req.status === 'expired';
            const isRefundDue = req.status === 'refund_due';

            return (
              <div
                key={req.id}
                className={`bg-white rounded-3xl border p-5 sm:p-6 transition-all shadow-2xs ${
                  isRejected
                    ? 'border-rose-200 bg-rose-50/20'
                    : isPending
                    ? 'border-amber-200 bg-amber-50/10'
                    : isApproved
                    ? 'border-emerald-200'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left Column: Item & Ref */}
                  <div className="space-y-2 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-extrabold uppercase tracking-wider">
                        {req.itemType === 'course' ? 'Course Enrolment' : req.itemType === 'material' ? 'Paid Notes' : 'Mock Test Series'}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {new Date(req.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-[#0a0e2a]">
                      {getItemTitle(req.itemType, req.itemId)}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1.5 font-mono bg-slate-100 px-2 py-0.5 rounded-md text-slate-800 font-bold">
                        Ref: {req.referenceCode}
                        <button
                          type="button"
                          onClick={() => copyToClipboard(req.referenceCode)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                          title="Copy reference code"
                        >
                          {copiedCode === req.referenceCode ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </span>

                      {req.utr && (
                        <span className="inline-flex items-center gap-1 font-mono text-slate-700">
                          UTR: <strong>{req.utr}</strong>
                        </span>
                      )}

                      <span className="capitalize">
                        Channel: <strong>{req.paymentChannel === 'bank_transfer' ? 'Bank Transfer' : 'UPI Manual'}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Middle Column: Status Badge */}
                  <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
                    <div className="text-xl font-extrabold text-[#0a0e2a]">
                      ₹{req.expectedAmount.toLocaleString('en-IN')}
                    </div>

                    {isPending && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold">
                        <Clock className="w-3.5 h-3.5 text-amber-700 animate-spin" /> Under Verification
                      </span>
                    )}

                    {isApproved && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Approved & Verified
                      </span>
                    )}

                    {isRejected && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-900 border border-rose-300 text-xs font-bold">
                        <XCircle className="w-3.5 h-3.5 text-rose-700" /> Payment Rejected
                      </span>
                    )}

                    {isAwaiting && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-300 text-xs font-bold">
                        <Clock className="w-3.5 h-3.5 text-blue-700" /> Awaiting Proof
                      </span>
                    )}

                    {isRefundDue && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-900 border border-orange-300 text-xs font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-700" /> Refund Due (Seats Full)
                      </span>
                    )}

                    {isExpired && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold">
                        Expired
                      </span>
                    )}
                  </div>
                </div>

                {/* Rejection Alert Box */}
                {isRejected && (
                  <div className="mt-4 p-3.5 rounded-2xl bg-rose-100/70 border border-rose-300 text-xs text-rose-950 space-y-1">
                    <p className="font-extrabold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" /> Reason for Rejection:
                    </p>
                    <p className="leading-relaxed pl-5">
                      {req.rejectReason || 'UTR not found in bank statement or amount mismatch. Please double check your UTR number and resubmit.'}
                    </p>
                  </div>
                )}

                {/* Refund Due Alert Box */}
                {isRefundDue && (
                  <div className="mt-4 p-3.5 rounded-2xl bg-orange-100/70 border border-orange-300 text-xs text-orange-950 space-y-1">
                    <p className="font-extrabold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-orange-700 shrink-0" /> Admission Seat Limit Reached
                    </p>
                    <p className="leading-relaxed pl-5">
                      All seats for this batch were filled before your verification was finalized. Your registration is priority-queued on the waiting list. Please contact the academy office with reference code <strong>{req.referenceCode}</strong> for a prompt refund or batch transfer.
                    </p>
                  </div>
                )}

                {/* Actions Footer */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="text-slate-500 text-[11px]">
                    {isPending && `Verification target: ${PAYMENT_SETTINGS.paymentInstructionsExtra}`}
                    {isApproved && req.reviewedBy && `Approved by ${req.reviewedBy}`}
                    {isAwaiting && `Expires: ${new Date(req.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  </div>

                  <div className="flex items-center gap-2">
                    {isApproved && (
                      <button
                        type="button"
                        onClick={() => handleOpenReceipt(req)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" /> Download Receipt
                      </button>
                    )}

                    {(isRejected || isAwaiting) && (
                      <button
                        type="button"
                        onClick={() => handleResubmit(req)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white font-bold transition-all shadow-xs cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Resubmit Proof
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PayManualModal for Resubmission */}
      {resubmitTarget && (
        <PayManualModal
          target={resubmitTarget}
          onClose={() => setResubmitTarget(null)}
          onSuccess={() => {
            setResubmitTarget(null);
            fetchPayments();
          }}
        />
      )}

      {/* Receipt Modal */}
      <ReceiptModal receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
    </div>
  );
}
