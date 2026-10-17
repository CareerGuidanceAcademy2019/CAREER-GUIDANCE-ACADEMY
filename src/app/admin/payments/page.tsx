'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Eye,
  Search,
  Filter,
  Download,
  FileText,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  History,
  Settings,
  ExternalLink,
  ChevronDown,
  X,
  Lock,
  Coins,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { PaymentRequest, PaymentStatus, PaymentAuditLogEntry } from '@/types/payments';
import { PAYMENT_SETTINGS } from '@/config/paymentSettings';
import { ReceiptModal } from '@/components/student/ReceiptModal';
import { CounterEnrollmentModal } from '@/components/admin/CounterEnrollmentModal';
import { FeePayment } from '@/data/initialSeedData';
import { MaskedData } from '@/components/ui/MaskedData';

export default function AdminPaymentsPage() {
  const { db, session, showToast } = useCga();

  // State
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PaymentStatus | 'all'>('pending_review');
  const [searchQuery, setSearchQuery] = useState('');
  const [itemTypeFilter, setItemTypeFilter] = useState<'all' | 'course' | 'material' | 'mock_series'>('all');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Approval Modal State
  const [approvingRequest, setApprovingRequest] = useState<PaymentRequest | null>(null);
  const [enteredAmount, setEnteredAmount] = useState<string>('');
  const [bankVerifiedChecked, setBankVerifiedChecked] = useState(false);
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  // Rejection Modal State
  const [rejectingRequest, setRejectingRequest] = useState<PaymentRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessingReject, setIsProcessingReject] = useState(false);

  // Counter Cash Enrolment Modal State
  const [showCounterModal, setShowCounterModal] = useState(false);

  // Screenshot Proof Modal State
  const [previewScreenshot, setPreviewScreenshot] = useState<{
    url: string;
    refCode: string;
    studentName: string;
    utr?: string;
  } | null>(null);

  // Receipt Modal State
  const [viewingReceipt, setViewingReceipt] = useState<FeePayment | null>(null);

  // Audit Log Modal State
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState<PaymentAuditLogEntry[]>([]);
  const [isAuditLoading, setIsAuditLoading] = useState(false);

  // Export Date Range State
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Fetch payment requests
  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const sb = createClient();
      const { data, error } = await sb
        .from('payment_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        // Fetch profiles to augment student names
        const studentIds = Array.from(new Set(data.map((r: any) => r.student_id)));
        let profileMap: Record<string, any> = {};
        if (studentIds.length > 0) {
          const { data: profiles } = await sb
            .from('profiles')
            .select('id, name, student_code, phone, email')
            .in('id', studentIds);
          (profiles || []).forEach((p: any) => {
            profileMap[p.id] = p;
          });
        }

        const mapped: PaymentRequest[] = data.map((r: any) => {
          const prof = profileMap[r.student_id];
          return {
            id: r.id,
            studentId: r.student_id,
            studentName: prof?.name || 'Student',
            studentCode: prof?.student_code || r.student_id.slice(0, 8),
            studentPhone: prof?.phone || '',
            studentEmail: prof?.email || '',
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
          };
        });
        setRequests(mapped);
        setIsLoading(false);
        return;
      }
    } catch {
      // Fall back to localStorage + db.feePayments
    }

    try {
      const localStored = localStorage.getItem('cga_payment_requests');
      let localList: PaymentRequest[] = localStored ? JSON.parse(localStored) : [];

      // Combine with db.feePayments
      const existingRefs = new Set(localList.map((r) => r.referenceCode));
      const feeMapped: PaymentRequest[] = db.feePayments
        .filter((p) => !existingRefs.has(p.receiptNo))
        .map((p) => {
          const stu = db.students.find((s) => s.id === p.studentId);
          return {
            id: p.id,
            studentId: p.studentId,
            studentName: p.studentName || stu?.name || 'Student',
            studentCode: stu?.studentCode || p.studentId.slice(0, 8),
            studentPhone: stu?.phone || '',
            studentEmail: stu?.email || '',
            itemType: 'course',
            itemId: p.courseId,
            paymentType: p.paymentType === 'Instalment 1' ? 'instalment_1' : p.paymentType === 'Instalment 2' ? 'instalment_2' : 'full',
            expectedAmount: p.amount,
            amountReceived: p.status === 'Verified' ? p.amount : null,
            referenceCode: p.receiptNo,
            paymentChannel: 'upi',
            paymentMethod: 'upi_manual',
            utr: p.utr,
            screenshotPath: p.screenshot,
            status: p.status === 'Verified' ? 'approved' : p.status === 'Rejected' ? 'rejected' : 'pending_review',
            reviewedBy: p.reviewedBy,
            reviewedAt: p.reviewedAt,
            rejectReason: p.rejectionReason,
            expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
            createdAt: p.date ? new Date(p.date).toISOString() : new Date().toISOString(),
          };
        });

      setRequests([...localList, ...feeMapped]);
    } catch {
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [db.feePayments]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    showToast('Copied', text, 'info');
    setTimeout(() => setCopiedText(null), 2500);
  };

  // UTR counts to detect duplicate UTR submissions across different requests
  const utrOccurrenceMap = useMemo(() => {
    const counts = new Map<string, number>();
    requests.forEach((r) => {
      if (r.utr && r.utr.trim().length > 0) {
        const norm = r.utr.trim().toUpperCase();
        counts.set(norm, (counts.get(norm) || 0) + 1);
      }
    });
    return counts;
  }, [requests]);

  const getItemTitle = (itemType: string, itemId: string) => {
    if (itemType === 'course') {
      const course = db.courses.find((c) => c.id === itemId);
      return course ? course.name : 'Course';
    }
    if (itemType === 'material') {
      const mat = db.studyMaterials.find((m) => m.id === itemId);
      return mat ? mat.title : 'Study Material';
    }
    if (itemType === 'mock_series') {
      return 'T-TET 2026 Mock Test Series (15 Mocks)';
    }
    return itemId;
  };

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchTab = activeTab === 'all' || r.status === activeTab;
      const matchType = itemTypeFilter === 'all' || r.itemType === itemTypeFilter;

      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        r.referenceCode.toLowerCase().includes(q) ||
        (r.utr && r.utr.toLowerCase().includes(q)) ||
        (r.studentName && r.studentName.toLowerCase().includes(q)) ||
        (r.studentCode && r.studentCode.toLowerCase().includes(q)) ||
        (r.studentPhone && r.studentPhone.toLowerCase().includes(q));

      return matchTab && matchType && matchSearch;
    });
  }, [requests, activeTab, itemTypeFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const pending = requests.filter((r) => r.status === 'pending_review').length;
    const approved = requests.filter((r) => r.status === 'approved').length;
    const rejected = requests.filter((r) => r.status === 'rejected').length;
    const refundDue = requests.filter((r) => r.status === 'refund_due').length;
    const expired = requests.filter((r) => r.status === 'expired').length;
    const totalCollected = requests
      .filter((r) => r.status === 'approved')
      .reduce((sum, r) => sum + (r.amountReceived || r.expectedAmount), 0);

    return { pending, approved, rejected, refundDue, expired, totalCollected };
  }, [requests]);

  // Handle Screenshot View: fetches short-lived signed URL if in Supabase storage
  const handleOpenScreenshot = async (req: PaymentRequest) => {
    if (!req.screenshotPath) {
      showToast('No Screenshot', 'Student did not attach a payment screenshot.', 'info');
      return;
    }

    // Check if it's already a full URL or data URI
    if (req.screenshotPath.startsWith('http') || req.screenshotPath.startsWith('data:')) {
      setPreviewScreenshot({
        url: req.screenshotPath,
        refCode: req.referenceCode,
        studentName: req.studentName || 'Student',
        utr: req.utr || undefined,
      });
      return;
    }

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const sb = createClient();
      const { data, error } = await sb.storage
        .from('payment-proofs')
        .createSignedUrl(req.screenshotPath, 300); // 5 minutes signed url

      if (!error && data?.signedUrl) {
        setPreviewScreenshot({
          url: data.signedUrl,
          refCode: req.referenceCode,
          studentName: req.studentName || 'Student',
          utr: req.utr || undefined,
        });
      } else {
        // Fallback or preview
        setPreviewScreenshot({
          url: req.screenshotPath,
          refCode: req.referenceCode,
          studentName: req.studentName || 'Student',
          utr: req.utr || undefined,
        });
      }
    } catch {
      setPreviewScreenshot({
        url: req.screenshotPath,
        refCode: req.referenceCode,
        studentName: req.studentName || 'Student',
        utr: req.utr || undefined,
      });
    }
  };

  // Open Approval Dialog
  const handleInitiateApproval = (req: PaymentRequest) => {
    setApprovingRequest(req);
    setEnteredAmount('');
    setBankVerifiedChecked(false);
  };

  // Confirm Approval
  const handleConfirmApproval = async () => {
    if (!approvingRequest) return;
    const amountNum = parseFloat(enteredAmount);

    if (isNaN(amountNum) || amountNum <= 0) {
      showToast('Invalid Amount', 'Please type the actual amount received in INR.', 'error');
      return;
    }

    if (amountNum !== approvingRequest.expectedAmount) {
      showToast(
        'Amount Mismatch',
        `Entered amount (₹${amountNum}) must exactly match expected amount (₹${approvingRequest.expectedAmount}).`,
        'error'
      );
      return;
    }

    if (!bankVerifiedChecked) {
      showToast('Verification Required', 'Please confirm you verified this UTR in your bank/UPI statement.', 'error');
      return;
    }

    setIsProcessingApproval(true);

    try {
      // 1. Try Supabase RPC
      const { createClient } = await import('@/lib/supabase/client');
      const sb = createClient();
      const { data, error } = await sb.rpc('cga_approve_payment', {
        p_request_id: approvingRequest.id,
        p_amount_received: amountNum,
        p_admin_id: session?.userId || null,
      });

      if (!error) {
        showToast('Payment Approved', `Reference ${approvingRequest.referenceCode} approved & fulfilled successfully.`, 'success');
      } else {
        // Local fallback update
        updateLocalRequestStatus(approvingRequest.id, 'approved', amountNum);
        showToast('Payment Approved', `Payment marked approved locally.`, 'success');
      }
    } catch {
      updateLocalRequestStatus(approvingRequest.id, 'approved', amountNum);
      showToast('Payment Approved', `Payment marked approved.`, 'success');
    } finally {
      setIsProcessingApproval(false);
      setApprovingRequest(null);
      fetchRequests();
    }
  };

  // Open Rejection Dialog
  const handleInitiateReject = (req: PaymentRequest) => {
    setRejectingRequest(req);
    setRejectReason('UTR was not found in our bank statement. Please verify your reference number and resubmit.');
  };

  // Confirm Rejection
  const handleConfirmReject = async () => {
    if (!rejectingRequest) return;
    if (!rejectReason.trim()) {
      showToast('Reason Required', 'Please enter a clear reason for rejecting this payment.', 'error');
      return;
    }

    setIsProcessingReject(true);

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const sb = createClient();
      const { data, error } = await sb.rpc('cga_reject_payment', {
        p_request_id: rejectingRequest.id,
        p_reason: rejectReason.trim(),
        p_admin_id: session?.userId || null,
      });

      if (!error) {
        showToast('Payment Rejected', `Request marked as rejected. Student can resubmit proof.`, 'info');
      } else {
        updateLocalRequestStatus(rejectingRequest.id, 'rejected', null, rejectReason.trim());
        showToast('Payment Rejected', `Payment marked as rejected.`, 'info');
      }
    } catch {
      updateLocalRequestStatus(rejectingRequest.id, 'rejected', null, rejectReason.trim());
      showToast('Payment Rejected', `Payment marked as rejected.`, 'info');
    } finally {
      setIsProcessingReject(false);
      setRejectingRequest(null);
      fetchRequests();
    }
  };

  const updateLocalRequestStatus = (id: string, newStatus: PaymentStatus, amountReceived?: number | null, reason?: string) => {
    try {
      const localStored = localStorage.getItem('cga_payment_requests');
      if (localStored) {
        const list: PaymentRequest[] = JSON.parse(localStored);
        const req = list.find((r) => r.id === id);
        if (req) {
          req.status = newStatus;
          if (amountReceived !== undefined) req.amountReceived = amountReceived;
          if (reason) req.rejectReason = reason;
          req.reviewedBy = session?.name || 'Administrator';
          req.reviewedAt = new Date().toISOString();
          localStorage.setItem('cga_payment_requests', JSON.stringify(list));
        }
      }
    } catch {}
  };

  // View Receipt
  const handleOpenReceiptModal = (req: PaymentRequest) => {
    const receiptObj: FeePayment = {
      id: req.id,
      receiptNo: req.referenceCode,
      studentId: req.studentId,
      studentName: req.studentName || 'Student',
      courseId: req.itemId,
      courseName: getItemTitle(req.itemType, req.itemId),
      amount: req.amountReceived || req.expectedAmount,
      paymentMode: req.paymentChannel === 'bank_transfer' ? 'Net Banking' : 'UPI',
      paymentType: req.paymentType === 'full' ? 'Full Payment' : req.paymentType === 'instalment_1' ? 'Instalment 1' : 'Instalment 2',
      date: req.reviewedAt ? req.reviewedAt.split('T')[0] : req.createdAt.split('T')[0],
      remarks: `Manual verification approved by admin. UTR: ${req.utr || 'Verified'}`,
      status: 'Verified',
      reviewedBy: req.reviewedBy || 'Admissions Administrator',
      reviewedAt: req.reviewedAt || undefined,
      utr: req.utr || undefined,
    };
    setViewingReceipt(receiptObj);
  };

  // Fetch Audit Logs
  const handleOpenAuditLogs = async () => {
    setShowAuditModal(true);
    setIsAuditLoading(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const sb = createClient();
      const { data, error } = await sb
        .from('payment_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setAuditLogs(data as any);
      } else {
        setAuditLogs([]);
      }
    } catch {
      setAuditLogs([]);
    } finally {
      setIsAuditLoading(false);
    }
  };

  // Reconciliation Export Download
  const handleDownloadReconciliation = () => {
    setIsExporting(true);
    let url = '/api/admin/payments/export';
    const params = new URLSearchParams();
    if (exportStartDate) params.set('startDate', exportStartDate);
    if (exportEndDate) params.set('endDate', exportEndDate);
    if (params.toString()) url += `?${params.toString()}`;

    window.open(url, '_blank');
    setIsExporting(false);
    showToast('Export Started', 'Downloading reconciliation CSV report...', 'info');
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#0056b3] text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Admissions Desk & Bank Verification
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a0e2a] flex items-center gap-2.5">
            <CreditCard className="w-8 h-8 text-[#0056b3]" /> Payment Verifications Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Review manual student UPI and bank transfer submissions. Verify UTRs against the institute statement before approving course seats or digital materials.
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowCounterModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Coins className="w-4 h-4 text-emerald-200" /> Collect Cash & Enrol
          </button>

          <button
            type="button"
            onClick={handleOpenAuditLogs}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-2xs transition-all cursor-pointer"
          >
            <History className="w-4 h-4 text-slate-500" /> Audit Log
          </button>

          <Link
            href="/admin/payment-settings"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-2xs transition-all"
          >
            <Settings className="w-4 h-4 text-slate-500" /> Bank & UPI Settings
          </Link>

          <button
            type="button"
            onClick={fetchRequests}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Queue
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-slate-400 block">Pending Review</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-600">{stats.pending}</span>
            {stats.pending > 0 && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 animate-pulse">
                Action Needed
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-slate-400 block">Approved</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats.approved}</p>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-slate-400 block">Rejected / Expired</span>
          <p className="text-2xl font-black text-rose-600 mt-1">
            {stats.rejected + stats.expired}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-slate-400 block">Verified Revenue</span>
          <p className="text-2xl font-black text-[#0a0e2a] mt-1">
            ₹{stats.totalCollected.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Export & Reconciliation Bar */}
      <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50 border border-blue-200/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#0056b3] text-white shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#0a0e2a] uppercase tracking-wider">
              Daily Bank Reconciliation Export (.CSV)
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Export all verified admissions, fees, and material purchases with student codes, UTR numbers, and receipt numbers.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
          <input
            type="date"
            value={exportStartDate}
            onChange={(e) => setExportStartDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700"
            title="Start Date"
          />
          <span className="text-xs text-slate-400 font-bold">to</span>
          <input
            type="date"
            value={exportEndDate}
            onChange={(e) => setExportEndDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700"
            title="End Date"
          />
          <button
            type="button"
            onClick={handleDownloadReconciliation}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold shadow-xs inline-flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
          >
            <Download className="w-3.5 h-3.5" /> Download Report
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-2xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto">
          {[
            { key: 'pending_review', label: `Pending Review (${stats.pending})`, badge: stats.pending > 0 },
            { key: 'approved', label: `Approved (${stats.approved})` },
            { key: 'rejected', label: `Rejected (${stats.rejected})` },
            { key: 'refund_due', label: `Refund Due (${stats.refundDue})` },
            { key: 'expired', label: `Expired (${stats.expired})` },
            { key: 'all', label: `All Requests (${requests.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? 'bg-[#0056b3] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.label}
              {tab.badge && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>
          ))}
        </div>

        {/* Search & Item Type */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, code, phone, UTR or reference code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0056b3]/20 focus:border-[#0056b3]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={itemTypeFilter}
              onChange={(e) => setItemTypeFilter(e.target.value as any)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white cursor-pointer focus:outline-none"
            >
              <option value="all">All Item Types</option>
              <option value="course">Courses Only</option>
              <option value="material">Study Materials Only</option>
              <option value="mock_series">Mock Test Series</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payment Requests Table */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-slate-300" />
          </div>
          <h3 className="text-base font-extrabold text-[#0a0e2a]">No Payment Requests</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No payments matched your current filter criteria.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[11px]">
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Item & Plan</th>
                  <th className="py-3.5 px-4">Reference / UTR</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Proof</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req) => {
                  const normUtr = req.utr?.trim().toUpperCase();
                  const isDuplicateUtr = normUtr && (utrOccurrenceMap.get(normUtr) || 0) > 1;
                  const isAmountMismatch = req.amountReceived !== null && req.amountReceived !== req.expectedAmount;

                  return (
                    <tr
                      key={req.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isDuplicateUtr ? 'bg-red-50/30' : ''
                      }`}
                    >
                      {/* Student */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-extrabold text-slate-900">{req.studentName}</div>
                        <div className="text-[11px] font-mono text-[#0056b3] font-bold mt-0.5">
                          {req.studentCode}
                        </div>
                        {req.studentPhone && (
                          <div className="mt-0.5">
                            <MaskedData value={req.studentPhone} type="phone" subjectId={req.studentCode} className="text-[11px] text-slate-400" />
                          </div>
                        )}
                      </td>

                      {/* Item & Plan */}
                      <td className="py-4 px-4 align-top max-w-xs">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                          {req.itemType}
                        </span>
                        <div className="font-extrabold text-slate-900 mt-1 line-clamp-2">
                          {getItemTitle(req.itemType, req.itemId)}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 capitalize">
                          Plan: {req.paymentType.replace('_', ' ')} • {req.paymentChannel}
                        </div>
                      </td>

                      {/* Reference & UTR */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-center gap-1.5 font-mono text-slate-800 font-bold">
                          <span>{req.referenceCode}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(req.referenceCode)}
                            className="text-slate-400 hover:text-slate-700 cursor-pointer"
                            title="Copy Ref"
                          >
                            {copiedText === req.referenceCode ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>

                        {req.utr ? (
                          <div className="mt-1">
                            <span
                              className={`inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-md font-bold ${
                                isDuplicateUtr
                                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              UTR: {req.utr}
                              <button
                                type="button"
                                onClick={() => copyToClipboard(req.utr!)}
                                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                              >
                                {copiedText === req.utr ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </span>
                            {isDuplicateUtr && (
                              <div className="text-[10px] text-rose-600 font-extrabold flex items-center gap-1 mt-0.5">
                                <AlertTriangle className="w-3 h-3" /> Reused UTR ({utrOccurrenceMap.get(normUtr)} occurrences)
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic mt-1 block">
                            No UTR yet
                          </span>
                        )}

                        <div className="text-[10px] text-slate-400 mt-1">
                          {new Date(req.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        <div className="text-sm font-black text-[#0a0e2a]">
                          ₹{req.expectedAmount.toLocaleString('en-IN')}
                        </div>
                        {req.amountReceived !== null && req.amountReceived !== undefined && (
                          <div
                            className={`text-[11px] font-bold mt-0.5 ${
                              isAmountMismatch ? 'text-rose-600' : 'text-emerald-600'
                            }`}
                          >
                            Recv: ₹{req.amountReceived.toLocaleString('en-IN')}
                            {isAmountMismatch && ' (Mismatch!)'}
                          </div>
                        )}
                      </td>

                      {/* Proof */}
                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        {req.screenshotPath ? (
                          <button
                            type="button"
                            onClick={() => handleOpenScreenshot(req)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Proof
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No image</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        {req.status === 'pending_review' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-extrabold">
                            <Clock className="w-3 h-3 animate-spin text-amber-700" /> Pending Review
                          </span>
                        )}
                        {req.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-extrabold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Approved
                          </span>
                        )}
                        {req.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-900 border border-rose-300 text-[11px] font-extrabold">
                            <XCircle className="w-3 h-3 text-rose-700" /> Rejected
                          </span>
                        )}
                        {req.status === 'awaiting_payment' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-300 text-[11px] font-extrabold">
                            Awaiting Proof
                          </span>
                        )}
                        {req.status === 'refund_due' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 text-orange-900 border border-orange-300 text-[11px] font-extrabold">
                            Refund Due
                          </span>
                        )}
                        {req.status === 'expired' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-300 text-[11px] font-extrabold">
                            Expired
                          </span>
                        )}

                        {req.reviewedBy && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            By {req.reviewedBy}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                        {req.status === 'pending_review' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleInitiateApproval(req)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] shadow-xs cursor-pointer transition-all"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInitiateReject(req)}
                              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-[11px] border border-rose-200 cursor-pointer transition-all"
                            >
                              Reject
                            </button>
                          </div>
                        ) : req.status === 'approved' ? (
                          <button
                            type="button"
                            onClick={() => handleOpenReceiptModal(req)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0056b3] font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" /> Receipt
                          </button>
                        ) : req.status === 'rejected' && req.rejectReason ? (
                          <span className="text-[10px] text-rose-600 italic block max-w-xs truncate" title={req.rejectReason}>
                            {req.rejectReason}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== CONFIRM APPROVAL MODAL ==================== */}
      {approvingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Verify & Approve Payment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setApprovingRequest(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Item and Student details */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-800">
                  {approvingRequest.studentName} ({approvingRequest.studentCode})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Item:</span>
                <span className="font-bold text-slate-800">
                  {getItemTitle(approvingRequest.itemType, approvingRequest.itemId)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reference Code:</span>
                <span className="font-mono font-bold text-slate-800">{approvingRequest.referenceCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Student UTR:</span>
                <span className="font-mono font-bold text-slate-800">{approvingRequest.utr || 'N/A'}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="font-bold text-slate-700">Expected Amount:</span>
                <span className="font-black text-slate-900 text-sm">
                  ₹{approvingRequest.expectedAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Input Amount Actually Received */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Amount Actually Received in Bank / UPI Account (INR) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  placeholder={String(approvingRequest.expectedAmount)}
                  value={enteredAmount}
                  onChange={(e) => setEnteredAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
              {enteredAmount && parseFloat(enteredAmount) !== approvingRequest.expectedAmount && (
                <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Amount entered (₹{enteredAmount}) does not match expected (₹{approvingRequest.expectedAmount}).
                </p>
              )}
            </div>

            {/* Verification Checkbox */}
            <label className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 cursor-pointer">
              <input
                type="checkbox"
                checked={bankVerifiedChecked}
                onChange={(e) => setBankVerifiedChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-amber-300 focus:ring-emerald-500"
              />
              <span className="text-xs font-semibold text-amber-950 leading-relaxed">
                I confirm that I have cross-checked this UTR (<strong>{approvingRequest.utr}</strong>) in the official bank/UPI passbook, and the exact funds of ₹{approvingRequest.expectedAmount} have credited into Career Guidance Academy account.
              </span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setApprovingRequest(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                disabled={
                  isProcessingApproval ||
                  parseFloat(enteredAmount) !== approvingRequest.expectedAmount ||
                  !bankVerifiedChecked
                }
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-2"
              >
                {isProcessingApproval ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Confirm & Approve
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== REJECT PAYMENT MODAL ==================== */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <XCircle className="w-5 h-5" />
                <h3 className="text-lg font-extrabold text-slate-900">Reject Payment Proof</h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              State the reason for rejection. This reason will be displayed directly to <strong>{rejectingRequest.studentName}</strong>, allowing them to correct and resubmit their reference or screenshot.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Reason for Rejection *</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. UTR not matching our bank statement, wrong amount paid, or blurred screenshot."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isProcessingReject || !rejectReason.trim()}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
              >
                {isProcessingReject ? 'Rejecting...' : 'Reject & Notify Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SCREENSHOT PREVIEW MODAL ==================== */}
      {previewScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-[#0a0e2a] text-white flex items-center justify-between">
              <div>
                <h4 className="text-xs font-extrabold text-amber-300 uppercase tracking-wider">
                  Payment Screenshot Proof
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Ref: {previewScreenshot.refCode} • Student: {previewScreenshot.studentName} • UTR: {previewScreenshot.utr || 'N/A'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewScreenshot(null)}
                className="p-1 rounded-lg text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-auto bg-slate-100 flex items-center justify-center">
              <img
                src={previewScreenshot.url}
                alt="Payment proof screenshot"
                className="max-h-[70vh] w-auto object-contain rounded-xl shadow-md border border-slate-300"
              />
            </div>

            <div className="p-3 bg-white border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-500">Private signed image URL</span>
              <a
                href={previewScreenshot.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#0056b3] font-bold hover:underline"
              >
                Open in Full Tab <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ==================== AUDIT LOG MODAL ==================== */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#0056b3]" />
                <h3 className="text-lg font-extrabold text-[#0a0e2a]">
                  Payment Audit Log (Append-Only)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-auto space-y-3">
              {isAuditLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#0056b3] mx-auto" />
                  <p className="text-xs text-slate-500 mt-2">Loading audit trail...</p>
                </div>
              ) : auditLogs.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">
                  No audit log entries recorded yet.
                </p>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] bg-slate-200 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(log.createdAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-slate-700">
                      Entity: <strong>{log.entityType}</strong> ({log.entityId})
                    </div>
                    {log.oldValues && (
                      <div className="font-mono text-[10px] bg-white p-2 rounded border border-slate-200 text-slate-600 overflow-x-auto">
                        Old: {JSON.stringify(log.oldValues)}
                      </div>
                    )}
                    {log.newValues && (
                      <div className="font-mono text-[10px] bg-white p-2 rounded border border-slate-200 text-emerald-800 overflow-x-auto">
                        New: {JSON.stringify(log.newValues)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Counter Cash Enrolment Modal */}
      {showCounterModal && (
        <CounterEnrollmentModal
          onClose={() => setShowCounterModal(false)}
          onSuccess={() => {
            fetchRequests();
          }}
        />
      )}

      {/* Official Receipt Modal */}
      <ReceiptModal receipt={viewingReceipt} onClose={() => setViewingReceipt(null)} />
    </div>
  );
}
