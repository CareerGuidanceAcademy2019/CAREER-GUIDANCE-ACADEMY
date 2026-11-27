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
  PlusCircle,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { PaymentRequest, PaymentStatus, PaymentAuditLogEntry } from '@/types/payments';
import { PAYMENT_SETTINGS } from '@/config/paymentSettings';
import { ReceiptModal } from '@/components/student/ReceiptModal';
import { CounterEnrollmentModal } from '@/components/admin/CounterEnrollmentModal';
import { FeePayment } from '@/data/initialSeedData';
import { MaskedData } from '@/components/ui/MaskedData';
import { getSupabase } from '@/lib/supabase/client';

function buildInitialRequests(feePayments: FeePayment[], students: any[]): PaymentRequest[] {
  const result: PaymentRequest[] = [];
  const seenRefs = new Set<string>();
  const seenIds = new Set<string>();
  const seenSignatures = new Set<string>();

  const isDuplicate = (id?: string | null, ref?: string | null, studentId?: string | null, utr?: string | null): boolean => {
    if (id && seenIds.has(id)) return true;
    if (ref && seenRefs.has(ref.trim().toUpperCase())) return true;
    if (studentId && utr) {
      const sig = `${studentId}_${utr.trim().toUpperCase()}`;
      if (seenSignatures.has(sig)) return true;
    }
    return false;
  };

  const registerEntry = (req: PaymentRequest) => {
    if (req.id) seenIds.add(req.id);
    if (req.referenceCode) seenRefs.add(req.referenceCode.trim().toUpperCase());
    if (req.studentId && req.utr) seenSignatures.add(`${req.studentId}_${req.utr.trim().toUpperCase()}`);
  };

  if (typeof window !== 'undefined') {
    try {
      const localStored = localStorage.getItem('cga_payment_requests');
      const localList: PaymentRequest[] = localStored ? JSON.parse(localStored) : [];
      localList.forEach((r) => {
        if (!isDuplicate(r.id, r.referenceCode, r.studentId, r.utr)) {
          registerEntry(r);
          result.push(r);
        }
      });
    } catch {}
  }

  (feePayments || []).forEach((p) => {
    if (!isDuplicate(p.id, p.receiptNo, p.studentId, p.utr)) {
      const stu = students.find((s) => s.id === p.studentId);
      const item: PaymentRequest = {
        id: p.id,
        studentId: p.studentId,
        studentName: p.studentName || stu?.name || 'Student',
        studentCode: stu?.studentCode || p.studentId.slice(0, 8),
        studentPhone: stu?.phone || '',
        studentEmail: stu?.email || '',
        itemType: (p.itemType || (p.courseId?.startsWith('series-') ? 'mock_series' : 'course')) as any,
        itemId: p.itemId || p.courseId,
        paymentType: p.paymentType === 'Instalment 1' ? 'instalment_1' : p.paymentType === 'Instalment 2' ? 'instalment_2' : 'full',
        expectedAmount: p.amount,
        amountReceived: p.status === 'Verified' ? p.amount : null,
        referenceCode: p.receiptNo,
        paymentChannel: p.paymentMode === 'Net Banking' ? 'bank_transfer' : 'upi',
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
      registerEntry(item);
      result.push(item);
    }
  });

  return result;
}

export default function AdminPaymentsPage() {
  const { db, session, showToast, approvePayment, rejectPayment, payCourseDue, saveStudentDuesOverride, submitPaymentVerification } = useCga();

  // Combined Section View Mode
  const [sectionView, setSectionView] = useState<'unified' | 'verifications' | 'defaulters' | 'receipts'>('unified');

  // Fee & Outstanding Dues Tracker State
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('All');
  const [onlyDefaulters, setOnlyDefaulters] = useState(false);
  const [duesSearchQuery, setDuesSearchQuery] = useState('');
  const [recordTarget, setRecordTarget] = useState<{
    studentId: string;
    studentName: string;
    studentCode: string;
    courseId: string;
    courseName: string;
    registrationTotalFee: number;
    registrationPaidAmount: number;
    registrationDueAmount: number;
    monthlyFeeRate: number;
    unpaidMonthsCount: number;
    monthlyFeeDueAmount: number;
    monthlyFeePaidAmount: number;
    dueAmount: number;
  } | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<FeePayment['paymentMode']>('Cash at Counter');
  const [recordPaymentTargetType, setRecordPaymentTargetType] = useState<'registration' | 'monthly' | 'both'>('both');
  const [recordUtrNo, setRecordUtrNo] = useState('');
  const [recordAdjustUnpaidMonths, setRecordAdjustUnpaidMonths] = useState(0);

  // View All Past Transactions Modal State (Admin Only)
  const [historyStudentTarget, setHistoryStudentTarget] = useState<{
    studentId: string;
    studentName: string;
    studentCode: string;
    phone: string;
    courseId?: string;
    courseName?: string;
  } | null>(null);

  const allFeeRows = useMemo(() => {
    const overridesMap = db.siteContent?.studentDuesOverrides || {};
    return (db.students || []).flatMap((stu) =>
      (stu.enrollments || []).map((enr) => {
        const courseObj = db.courses.find((c) => c.id === enr.courseId);
        const overrideKey = `${stu.id}::${enr.courseId}`;
        const ov = overridesMap[overrideKey];

        const regTotal = ov?.registrationTotalFee ?? enr.registrationFeeTotal ?? courseObj?.price ?? enr.totalFee ?? 0;
        const regPaid = ov?.registrationPaidAmount ?? enr.registrationFeePaid ?? Math.min(regTotal, enr.paidAmount || 0);
        const regDue = ov?.registrationDueAmount ?? enr.registrationFeeDue ?? Math.max(0, regTotal - regPaid);

        const moRate = ov?.monthlyFeeRate ?? enr.monthlyFeeRate ?? courseObj?.monthlyFee ?? 800;
        const unpaidMo =
          ov?.unpaidMonthsCount ??
          enr.unpaidMonthsCount ??
          (moRate > 0 && Math.max(0, (enr.dueAmount || 0) - regDue) > 0
            ? Math.max(1, Math.round(Math.max(0, (enr.dueAmount || 0) - regDue) / moRate))
            : 0);
        const moDue = ov?.monthlyFeeDueAmount ?? enr.monthlyFeeDue ?? Math.max(0, unpaidMo * moRate);
        const moPaid = ov?.monthlyFeePaidAmount ?? enr.monthlyFeePaid ?? Math.max(0, (enr.paidAmount || 0) - regPaid);

        const totalDue = regDue + moDue;
        const totalPaid = regPaid + moPaid;
        const totalCombinedFee = totalPaid + totalDue;

        // Gather all transactions for this student (sorted newest first)
        const studentTransactions = (db.feePayments || [])
          .filter(
            (p) =>
              p.studentId === stu.id &&
              (!p.courseId || p.courseId === enr.courseId || p.itemId === enr.courseId || p.courseName === enr.courseName)
          )
          .sort((a, b) => {
            const da = a.reviewedAt || a.date || '';
            const dbDate = b.reviewedAt || b.date || '';
            return dbDate.localeCompare(da);
          });

        const allStudentTransactions = (db.feePayments || [])
          .filter((p) => p.studentId === stu.id)
          .sort((a, b) => {
            const da = a.reviewedAt || a.date || '';
            const dbDate = b.reviewedAt || b.date || '';
            return dbDate.localeCompare(da);
          });

        const lastTx = studentTransactions[0] || allStudentTransactions[0] || null;

        return {
          studentId: stu.id,
          studentCode: stu.studentCode,
          studentName: stu.name,
          phone: stu.phone,
          email: stu.email,
          guardianName: stu.guardianName,
          address: stu.address,
          ...enr,
          totalFee: totalCombinedFee,
          paidAmount: totalPaid,
          dueAmount: totalDue,
          registrationTotalFee: regTotal,
          registrationPaidAmount: regPaid,
          registrationDueAmount: regDue,
          monthlyFeeRate: moRate,
          unpaidMonthsCount: unpaidMo,
          monthlyFeeDueAmount: moDue,
          monthlyFeePaidAmount: moPaid,
          lastPayment: lastTx
            ? {
                id: lastTx.id,
                date: lastTx.date,
                amount: lastTx.amount,
                utr: lastTx.utr || lastTx.receiptNo || 'CASH-COUNTER',
                receiptNo: lastTx.receiptNo,
                paymentMode: lastTx.paymentMode,
                status: lastTx.status || 'Verified',
                raw: lastTx,
              }
            : null,
          transactionCount: allStudentTransactions.length,
        };
      })
    );
  }, [db.students, db.courses, db.feePayments, db.siteContent?.studentDuesOverrides]);

  const filteredFeeRows = useMemo(
    () =>
      allFeeRows.filter((row) => {
        const matchCourse = selectedCourseFilter === 'All' || row.courseId === selectedCourseFilter;
        const matchDefaulter = !onlyDefaulters || row.dueAmount > 0;
        const q = duesSearchQuery.trim().toLowerCase();
        const matchSearch =
          !q ||
          row.studentName.toLowerCase().includes(q) ||
          row.studentCode.toLowerCase().includes(q) ||
          (row.phone && row.phone.toLowerCase().includes(q)) ||
          (row.lastPayment?.utr && row.lastPayment.utr.toLowerCase().includes(q)) ||
          row.courseName.toLowerCase().includes(q);
        return matchCourse && matchDefaulter && matchSearch;
      }),
    [allFeeRows, selectedCourseFilter, onlyDefaulters, duesSearchQuery]
  );

  const defaultersCount = useMemo(
    () => allFeeRows.filter((r) => r.dueAmount > 0).length,
    [allFeeRows]
  );
  const totalPendingDues = useMemo(
    () => allFeeRows.reduce((acc, r) => acc + (r.dueAmount || 0), 0),
    [allFeeRows]
  );
  const totalPendingRegistrationDues = useMemo(
    () => allFeeRows.reduce((acc, r) => acc + (r.registrationDueAmount || 0), 0),
    [allFeeRows]
  );
  const totalPendingMonthlyDues = useMemo(
    () => allFeeRows.reduce((acc, r) => acc + (r.monthlyFeeDueAmount || 0), 0),
    [allFeeRows]
  );

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordTarget || payAmount < 0) return;

    const cleanUtr =
      recordUtrNo.trim() ||
      `${PAYMENT_SETTINGS.receiptPrefix}${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let nextRegPaid = recordTarget.registrationPaidAmount;
    let nextRegDue = recordTarget.registrationDueAmount;
    let nextMoPaid = recordTarget.monthlyFeePaidAmount;
    let nextUnpaidMonths = recordAdjustUnpaidMonths;
    let nextMoDue = Math.max(0, nextUnpaidMonths * recordTarget.monthlyFeeRate);

    if (payAmount > 0) {
      if (recordPaymentTargetType === 'registration') {
        const appliedToReg = Math.min(nextRegDue, payAmount);
        nextRegPaid += appliedToReg;
        nextRegDue = Math.max(0, nextRegDue - appliedToReg);
        const leftover = payAmount - appliedToReg;
        if (leftover > 0) {
          nextMoPaid += leftover;
          nextMoDue = Math.max(0, nextMoDue - leftover);
          nextUnpaidMonths =
            recordTarget.monthlyFeeRate > 0 ? Math.ceil(nextMoDue / recordTarget.monthlyFeeRate) : 0;
        }
      } else if (recordPaymentTargetType === 'monthly') {
        const appliedToMo = Math.min(nextMoDue, payAmount);
        nextMoPaid += appliedToMo;
        nextMoDue = Math.max(0, nextMoDue - appliedToMo);
        nextUnpaidMonths =
          recordTarget.monthlyFeeRate > 0 ? Math.ceil(nextMoDue / recordTarget.monthlyFeeRate) : 0;
        const leftover = payAmount - appliedToMo;
        if (leftover > 0) {
          nextRegPaid += leftover;
          nextRegDue = Math.max(0, nextRegDue - leftover);
        }
      } else {
        // Both: clear Registration Due first, then Monthly Fee Due
        const appliedToReg = Math.min(nextRegDue, payAmount);
        nextRegPaid += appliedToReg;
        nextRegDue = Math.max(0, nextRegDue - appliedToReg);
        const leftover = payAmount - appliedToReg;
        if (leftover > 0) {
          nextMoPaid += leftover;
          nextMoDue = Math.max(0, nextMoDue - leftover);
          nextUnpaidMonths =
            recordTarget.monthlyFeeRate > 0 ? Math.ceil(nextMoDue / recordTarget.monthlyFeeRate) : 0;
        }
      }
    }

    await saveStudentDuesOverride({
      studentId: recordTarget.studentId,
      courseId: recordTarget.courseId,
      registrationTotalFee: recordTarget.registrationTotalFee,
      registrationPaidAmount: nextRegPaid,
      registrationDueAmount: nextRegDue,
      monthlyFeeRate: recordTarget.monthlyFeeRate,
      unpaidMonthsCount: nextUnpaidMonths,
      monthlyFeeDueAmount: nextMoDue,
      monthlyFeePaidAmount: nextMoPaid,
      updatedAt: new Date().toISOString(),
    });

    if (payAmount > 0) {
      const receiptNo = `${PAYMENT_SETTINGS.receiptPrefix}${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      const todayIso = new Date().toISOString().split('T')[0];
      const newReceipt: FeePayment = {
        id: `pay-${Date.now()}`,
        receiptNo,
        studentId: recordTarget.studentId,
        studentName: recordTarget.studentName,
        courseId: recordTarget.courseId,
        courseName: recordTarget.courseName,
        amount: payAmount,
        paymentMode,
        paymentType: nextRegDue + nextMoDue === 0 ? 'Balance Clearance' : 'Instalment 2',
        date: todayIso,
        utr: cleanUtr,
        status: 'Verified',
        reviewedBy: session?.name || 'C.G.A Administrator',
        reviewedAt: new Date().toISOString(),
        remarks: `Dues Payment (${recordPaymentTargetType.toUpperCase()}) • UTR: ${cleanUtr} • Reg Due Left: ₹${nextRegDue}, Monthly Due Left: ₹${nextMoDue}`,
      };

      try {
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('cga_custom_payments');
          const list: FeePayment[] = stored ? JSON.parse(stored) : [];
          list.unshift(newReceipt);
          localStorage.setItem('cga_custom_payments', JSON.stringify(list));
        }
      } catch {}

      await payCourseDue({
        studentId: recordTarget.studentId,
        courseId: recordTarget.courseId,
        amount: payAmount,
        paymentMode,
        remarks: newReceipt.remarks,
      }).catch(() => null);

      setRecordTarget(null);
      setViewingReceipt(newReceipt);
      void fetchRequests();
    } else {
      showToast('Dues Breakdown Updated', `Updated pending dues for ${recordTarget.studentName}.`, 'success');
      setRecordTarget(null);
    }
  };

  // State
  const [requests, setRequests] = useState<PaymentRequest[]>(() =>
    buildInitialRequests(db.feePayments || [], db.students || [])
  );
  const [isLoading, setIsLoading] = useState(false);
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
  // Fetch payment requests (merged across payment_requests and fee_payments)
  const fetchRequests = async () => {
    setIsLoading(true);
    let allCombined: PaymentRequest[] = [];
    const seenRefs = new Set<string>();
    const seenIds = new Set<string>();
    const seenSignatures = new Set<string>();

    const registerEntry = (req: PaymentRequest) => {
      if (req.id) seenIds.add(req.id);
      if (req.referenceCode) {
        seenRefs.add(req.referenceCode.trim().toUpperCase());
      }
      if (req.studentId && req.utr) {
        const sig = `${req.studentId}_${req.utr.trim().toUpperCase()}`;
        seenSignatures.add(sig);
      }
    };

    const isDuplicate = (
      id?: string | null,
      ref?: string | null,
      studentId?: string | null,
      utr?: string | null
    ): boolean => {
      if (id && seenIds.has(id)) return true;
      if (ref && seenRefs.has(ref.trim().toUpperCase())) return true;
      if (studentId && utr) {
        const sig = `${studentId}_${utr.trim().toUpperCase()}`;
        if (seenSignatures.has(sig)) return true;
      }
      return false;
    };

    try {
      const sb = getSupabase();

      // Parallel batch fetching for instantaneous response
      const [{ data: prData, error: prError }, { data: fpData, error: fpError }] = await Promise.all([
        sb.from('payment_requests').select('*').order('created_at', { ascending: false }),
        sb.from('fee_payments').select('*').order('date', { ascending: false }),
      ]);

      // Gather student profiles to augment names
      const studentIds = new Set<string>();
      (prData || []).forEach((r: any) => r.student_id && studentIds.add(r.student_id));
      (fpData || []).forEach((r: any) => r.student_id && studentIds.add(r.student_id));

      let profileMap: Record<string, any> = {};
      if (studentIds.size > 0) {
        const { data: profiles } = await sb
          .from('profiles')
          .select('id, name, student_code, phone, email')
          .in('id', Array.from(studentIds));
        (profiles || []).forEach((p: any) => {
          profileMap[p.id] = p;
        });
      }

      // Map payment_requests
      if (!prError && prData) {
        prData.forEach((r: any) => {
          if (!isDuplicate(r.id, r.reference_code, r.student_id, r.utr)) {
            const prof = profileMap[r.student_id];
            const item: PaymentRequest = {
              id: r.id,
              studentId: r.student_id,
              studentName: prof?.name || 'Student',
              studentCode: prof?.student_code || r.student_id?.slice(0, 8),
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
            registerEntry(item);
            allCombined.push(item);
          }
        });
      }

      // Map fee_payments (merge any that aren't already represented)
      if (!fpError && fpData) {
        fpData.forEach((p: any) => {
          if (!isDuplicate(p.id, p.receipt_no, p.student_id, p.utr)) {
            const prof = profileMap[p.student_id];
            const item: PaymentRequest = {
              id: p.id,
              studentId: p.student_id,
              studentName: prof?.name || 'Student',
              studentCode: prof?.student_code || p.student_id?.slice(0, 8),
              studentPhone: prof?.phone || '',
              studentEmail: prof?.email || '',
              itemType: (p.item_type || (p.course_id?.startsWith('series-') ? 'mock_series' : 'course')) as any,
              itemId: p.item_id || p.course_id,
              paymentType: p.payment_type === 'Instalment 1' ? 'instalment_1' : p.payment_type === 'Instalment 2' ? 'instalment_2' : 'full',
              expectedAmount: Number(p.amount),
              amountReceived: p.status === 'Verified' ? Number(p.amount) : null,
              referenceCode: p.receipt_no,
              paymentChannel: p.payment_mode === 'Net Banking' ? 'bank_transfer' : 'upi',
              paymentMethod: (p.payment_method || 'upi_manual') as any,
              utr: p.utr,
              screenshotPath: p.screenshot_url,
              status: p.status === 'Verified' ? 'approved' : p.status === 'Rejected' ? 'rejected' : 'pending_review',
              reviewedBy: p.reviewed_by,
              reviewedAt: p.reviewed_at,
              rejectReason: p.rejection_reason,
              expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
              createdAt: p.date ? new Date(p.date).toISOString() : new Date().toISOString(),
            };
            registerEntry(item);
            allCombined.push(item);
          }
        });
      }
    } catch (e) {
      console.warn('[AdminPayments] Error fetching from Supabase:', e);
    }

    // Merge with localStorage and db.feePayments without duplicates
    try {
      const localStored = localStorage.getItem('cga_payment_requests');
      const localList: PaymentRequest[] = localStored ? JSON.parse(localStored) : [];
      localList.forEach((r) => {
        if (!isDuplicate(r.id, r.referenceCode, r.studentId, r.utr)) {
          registerEntry(r);
          allCombined.push(r);
        }
      });

      (db.feePayments || []).forEach((p) => {
        if (!isDuplicate(p.id, p.receiptNo, p.studentId, p.utr)) {
          const stu = db.students.find((s) => s.id === p.studentId);
          const item: PaymentRequest = {
            id: p.id,
            studentId: p.studentId,
            studentName: p.studentName || stu?.name || 'Student',
            studentCode: stu?.studentCode || p.studentId.slice(0, 8),
            studentPhone: stu?.phone || '',
            studentEmail: stu?.email || '',
            itemType: (p.itemType || (p.courseId?.startsWith('series-') ? 'mock_series' : 'course')) as any,
            itemId: p.itemId || p.courseId,
            paymentType: p.paymentType === 'Instalment 1' ? 'instalment_1' : p.paymentType === 'Instalment 2' ? 'instalment_2' : 'full',
            expectedAmount: p.amount,
            amountReceived: p.status === 'Verified' ? p.amount : null,
            referenceCode: p.receiptNo,
            paymentChannel: p.paymentMode === 'Net Banking' ? 'bank_transfer' : 'upi',
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
          registerEntry(item);
          allCombined.push(item);
        }
      });
    } catch {}

    setRequests(allCombined);
    setIsLoading(false);
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
      const s = db.mockSeries.find((series) => series.id === itemId);
      if (s) return s.name;
      if (itemId === 'series-ttet-paper2-soc') return 'Tripura TET: Paper-II (Social Studies) 2026 Daily Online Mock Tests Series';
      if (itemId === 'series-ttet-paper2-sci') return 'Tripura TET: Paper-II (Science) 2026 Daily Online Mock Tests Series';
      if (itemId === 'series-ttet-paper1') return 'Tripura TET: Paper-I 2026 Daily Online Mock Tests Series';
      return 'T-TET 2026 Mock Test Series';
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

    return { pending, approved, rejected, refundDue, expired };
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
      // 1. Try Supabase RPC approve_payment
      const { createClient } = await import('@/lib/supabase/client');
      const sb = createClient();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(approvingRequest.id);
      if (isUuid) {
        const { error: rpcErr } = await sb.rpc('approve_payment', {
          p_request_id: approvingRequest.id,
          p_amount_received: amountNum,
        });
        if (rpcErr) {
          // Fallback to direct fee payment approval if request_id was a fee_payments id
          await sb.rpc('cga_direct_approve_fee_payment', {
            p_payment_id: approvingRequest.id,
            p_reviewed_by: session?.name || 'Administrator',
          });
        }
      } else {
        await sb.rpc('cga_direct_approve_fee_payment', {
          p_payment_id: approvingRequest.referenceCode || approvingRequest.id,
          p_reviewed_by: session?.name || 'Administrator',
        });
      }
    } catch (e) {
      console.warn('[AdminPayments] RPC approve error:', e);
    }

    try {
      // 2. Call context approvePayment to unlock course/series & sync React state
      await approvePayment(approvingRequest.id);
    } catch {}

    updateLocalRequestStatus(approvingRequest.id, 'approved', amountNum);
    showToast('Payment Approved', `Reference ${approvingRequest.referenceCode} approved & unlocked successfully.`, 'success');
    setIsProcessingApproval(false);
    setApprovingRequest(null);
    fetchRequests();
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
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rejectingRequest.id);
      if (isUuid) {
        await sb.rpc('reject_payment', {
          p_request_id: rejectingRequest.id,
          p_reason: rejectReason.trim(),
        });
      }
    } catch (e) {
      console.warn('[AdminPayments] RPC reject error:', e);
    }

    try {
      await rejectPayment(rejectingRequest.id, rejectReason.trim());
    } catch {}

    updateLocalRequestStatus(rejectingRequest.id, 'rejected', null, rejectReason.trim());
    showToast('Payment Rejected', `Request marked as rejected.`, 'info');
    setIsProcessingReject(false);
    setRejectingRequest(null);
    fetchRequests();
  };

  const updateLocalRequestStatus = (id: string, newStatus: PaymentStatus, amountReceived?: number | null, reason?: string) => {
    try {
      const localStored = localStorage.getItem('cga_payment_requests');
      if (localStored) {
        const list: PaymentRequest[] = JSON.parse(localStored);
        const req = list.find((r) => r.id === id || r.referenceCode === id);
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
            <ShieldCheck className="w-3.5 h-3.5" /> Unified Payments, Fee Ledger &amp; Defaulter Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a0e2a] flex items-center gap-2.5">
            <CreditCard className="w-8 h-8 text-[#0056b3]" /> Payment Verifications, Fees &amp; Defaulters
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Verify student online UPI / Bank transfers, track course fee balances &amp; defaulters, record installment dues, and generate official C.G.A receipts in one combined section.
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowCounterModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Coins className="w-4 h-4 text-emerald-200" /> Collect Cash &amp; Enrol
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
            <Settings className="w-4 h-4 text-slate-500" /> Bank &amp; UPI Settings
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          <span className="text-[11px] font-bold uppercase text-slate-400 block">Fee Defaulters / Dues</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-[#dc2626]">{defaultersCount}</span>
            <span className="text-xs font-extrabold text-slate-500">
              (₹{totalPendingDues.toLocaleString('en-IN')})
            </span>
          </div>
        </div>
      </div>

      {/* Combined Section Switcher Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 flex flex-wrap items-center gap-2 shadow-2xs">
        {[
          { key: 'unified', label: 'All Sections Combined' },
          { key: 'defaulters', label: `Outstanding Dues & Offline Registration (${defaultersCount} Due)` },
          { key: 'verifications', label: `Payment Verifications (${stats.pending} Pending)` },
          { key: 'receipts', label: `Official Fee Receipts (${db.feePayments.length})` },
        ].map((view) => (
          <button
            key={view.key}
            type="button"
            onClick={() => setSectionView(view.key as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              sectionView === view.key
                ? 'bg-[#0a0e2a] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>

      {(sectionView === 'unified' || sectionView === 'verifications') && (
        <div className="space-y-6">
          {/* Export & Reconciliation Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="p-2.5 rounded-xl bg-[#0056b3] text-white shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-[#0a0e2a] uppercase tracking-wider">
              Daily Bank Reconciliation Export (.CSV)
            </h4>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Export all verified admissions, fees, and material purchases with student codes, UTR numbers, and receipt numbers.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto shrink-0">
          <input
            type="date"
            value={exportStartDate}
            onChange={(e) => setExportStartDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-700"
            title="Start Date"
          />
          <span className="text-xs text-slate-400 font-semibold">to</span>
          <input
            type="date"
            value={exportEndDate}
            onChange={(e) => setExportEndDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-700"
            title="End Date"
          />
          <button
            type="button"
            onClick={handleDownloadReconciliation}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-semibold shadow-2xs inline-flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
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
        </div>
      )}

      {/* ==================== OUTSTANDING DUES SECTION & OFFLINE REGISTRATION (ADMIN ONLY) ==================== */}
      {(sectionView === 'unified' || sectionView === 'defaulters') && (
        <div className="space-y-4">
          {/* Outstanding Dues Breakdown Header & KPI Summary */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-2xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-extrabold mb-1.5">
                  <Lock className="w-3 h-3" /> Admin-Only Financial Ledger
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-[#0a0e2a]">
                  Outstanding Dues Breakdown &amp; Offline Student Registration
                </h2>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Track each student&apos;s remaining Registration / Admission Fee balance and unpaid Monthly Fees separately, inspect their latest payment Date, Amount &amp; UTR inline, view all past transactions on demand, or perform offline registration for new &amp; existing students.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCounterModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-xs cursor-pointer transition-all"
                >
                  <Coins className="w-4 h-4 text-emerald-100" />
                  <span>+ Offline Registration &amp; Payment (New / Existing Student)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOnlyDefaulters(!onlyDefaulters)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 border cursor-pointer transition-all ${
                    onlyDefaulters
                      ? 'bg-[#dc2626] text-white border-[#dc2626]'
                      : 'bg-red-50 text-[#dc2626] border-red-200 hover:bg-red-100'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  {onlyDefaulters ? 'Showing Outstanding Dues Only (Show All)' : `Filter Students with Dues (${defaultersCount})`}
                </button>
              </div>
            </div>

            {/* 3-Card Dues Breakdown KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-700 block">
                  Remaining Registration / Admission Dues
                </span>
                <p className="text-xl font-black text-rose-700 mt-1">
                  ₹{totalPendingRegistrationDues.toLocaleString('en-IN')}
                </p>
                <span className="text-[11px] text-rose-600/90">
                  Unpaid balance from course registration / admission fee
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 block">
                  Unpaid Monthly Fees
                </span>
                <p className="text-xl font-black text-amber-800 mt-1">
                  ₹{totalPendingMonthlyDues.toLocaleString('en-IN')}
                </p>
                <span className="text-[11px] text-amber-700/90">
                  Separate monthly tuition fee dues across enrolled students
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 text-white">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300 block">
                  Total Combined Outstanding Dues
                </span>
                <p className="text-xl font-black text-white mt-1">
                  ₹{totalPendingDues.toLocaleString('en-IN')}
                </p>
                <span className="text-[11px] text-slate-300">
                  Across {defaultersCount} active student enrollment(s) with balance due
                </span>
              </div>
            </div>

            {/* Filter & Search Bar for Outstanding Dues */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={duesSearchQuery}
                  onChange={(e) => setDuesSearchQuery(e.target.value)}
                  placeholder="Search student by name, code, mobile, course, or last UTR number..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0056b3]/20 focus:border-[#0056b3]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-3.5 h-3.5 text-[#0056b3]" />
                <select
                  value={selectedCourseFilter}
                  onChange={(e) => setSelectedCourseFilter(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white cursor-pointer"
                >
                  <option value="All">All Courses &amp; Batches</option>
                  {db.courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.batchName})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Outstanding Dues Breakdown Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-extrabold">
                    <th className="py-3.5 px-4">Student Details</th>
                    <th className="py-3.5 px-4">Course &amp; Batch</th>
                    <th className="py-3.5 px-4">Registration Fee Breakdown</th>
                    <th className="py-3.5 px-4">Monthly Fee Breakdown</th>
                    <th className="py-3.5 px-4">Total Outstanding Due</th>
                    <th className="py-3.5 px-4">Last Payment (Date • Amount • UTR)</th>
                    <th className="py-3.5 px-4 text-right">Actions &amp; All Transactions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFeeRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        No student fee or outstanding due records match your current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredFeeRows.map((row) => (
                      <tr key={`${row.studentId}-${row.courseId}`} className="hover:bg-slate-50/90 transition-colors">
                        {/* Student Details */}
                        <td className="py-4 px-4 align-top">
                          <p className="font-extrabold text-slate-900">{row.studentName}</p>
                          <div className="text-[11px] font-mono font-bold text-[#0056b3] mt-0.5">
                            {row.studentCode}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MaskedData
                              value={row.phone}
                              type="phone"
                              subjectId={row.studentCode}
                              className="text-[11px] text-slate-500"
                            />
                          </div>
                          {row.guardianName && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Guardian: {row.guardianName}
                            </div>
                          )}
                        </td>

                        {/* Course & Batch */}
                        <td className="py-4 px-4 align-top max-w-xs">
                          <p className="font-extrabold text-slate-800 line-clamp-2">{row.courseName}</p>
                          <span className="text-[11px] text-[#0056b3] font-semibold block mt-0.5">
                            {row.batchName}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Enrolled: {row.enrolledDate}
                          </span>
                        </td>

                        {/* Registration Fee Breakdown */}
                        <td className="py-4 px-4 align-top whitespace-nowrap">
                          <div className="text-[11px] text-slate-500">
                            Total Reg: <strong className="text-slate-800">₹{row.registrationTotalFee.toLocaleString('en-IN')}</strong>
                          </div>
                          <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
                            Paid: ₹{row.registrationPaidAmount.toLocaleString('en-IN')}
                          </div>
                          <div className="mt-1">
                            {row.registrationDueAmount > 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-extrabold text-[11px]">
                                Rest Reg Due: ₹{row.registrationDueAmount.toLocaleString('en-IN')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                                Reg Cleared
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Monthly Fee Breakdown */}
                        <td className="py-4 px-4 align-top whitespace-nowrap">
                          <div className="text-[11px] text-slate-500">
                            Rate: <strong className="text-slate-800">₹{row.monthlyFeeRate.toLocaleString('en-IN')}/mo</strong>
                          </div>
                          {row.monthlyFeePaidAmount > 0 && (
                            <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
                              Paid: ₹{row.monthlyFeePaidAmount.toLocaleString('en-IN')}
                            </div>
                          )}
                          <div className="mt-1">
                            {row.monthlyFeeDueAmount > 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-300 font-extrabold text-[11px]">
                                Monthly Due: ₹{row.monthlyFeeDueAmount.toLocaleString('en-IN')} ({row.unpaidMonthsCount} mo)
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px]">
                                ₹0 Monthly Due
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Total Outstanding Due */}
                        <td className="py-4 px-4 align-top whitespace-nowrap">
                          {row.dueAmount > 0 ? (
                            <div className="space-y-1">
                              <span className="px-3 py-1 rounded-full bg-red-50 text-[#dc2626] border border-red-200 font-black text-xs inline-block">
                                Total Due: ₹{row.dueAmount.toLocaleString('en-IN')}
                              </span>
                              <div className="text-[10px] text-slate-500 font-semibold">
                                Reg ₹{row.registrationDueAmount.toLocaleString('en-IN')} + Mo ₹{row.monthlyFeeDueAmount.toLocaleString('en-IN')}
                              </div>
                            </div>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold whitespace-nowrap inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> All Dues Cleared
                            </span>
                          )}
                        </td>

                        {/* Last Payment Details Only (Date, Amount, UTR) */}
                        <td className="py-4 px-4 align-top whitespace-nowrap">
                          {row.lastPayment ? (
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-black text-emerald-700">
                                  ₹{row.lastPayment.amount.toLocaleString('en-IN')}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                  {row.lastPayment.date}
                                </span>
                              </div>
                              <div className="text-[11px] font-mono font-bold text-slate-800 flex items-center gap-1">
                                <span>UTR: {row.lastPayment.utr}</span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(row.lastPayment!.utr)}
                                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                                  title="Copy UTR"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Mode: {row.lastPayment.paymentMode}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No transaction recorded</span>
                          )}
                        </td>

                        {/* Actions & View All Transactions */}
                        <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                          <div className="flex flex-col items-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setRecordTarget({
                                  studentId: row.studentId,
                                  studentName: row.studentName,
                                  studentCode: row.studentCode,
                                  courseId: row.courseId,
                                  courseName: row.courseName,
                                  registrationTotalFee: row.registrationTotalFee,
                                  registrationPaidAmount: row.registrationPaidAmount,
                                  registrationDueAmount: row.registrationDueAmount,
                                  monthlyFeeRate: row.monthlyFeeRate,
                                  unpaidMonthsCount: row.unpaidMonthsCount,
                                  monthlyFeeDueAmount: row.monthlyFeeDueAmount,
                                  monthlyFeePaidAmount: row.monthlyFeePaidAmount,
                                  dueAmount: row.dueAmount,
                                });
                                setRecordAdjustUnpaidMonths(row.unpaidMonthsCount);
                                setPayAmount(row.dueAmount > 0 ? row.dueAmount : 0);
                                setRecordPaymentTargetType('both');
                                setRecordUtrNo('');
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white font-bold text-[11px] cursor-pointer whitespace-nowrap shadow-2xs"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>{row.dueAmount > 0 ? 'Record Payment / Edit Dues' : 'Manage Monthly Dues'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setHistoryStudentTarget({
                                  studentId: row.studentId,
                                  studentName: row.studentName,
                                  studentCode: row.studentCode,
                                  phone: row.phone,
                                  courseId: row.courseId,
                                  courseName: row.courseName,
                                })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer transition-colors"
                            >
                              <History className="w-3 h-3 text-[#0056b3]" />
                              <span>View All Transactions ({row.transactionCount})</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== OFFICIAL FEE RECEIPTS REGISTER ==================== */}
      {(sectionView === 'unified' || sectionView === 'receipts') && (
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
                  <th className="py-3 px-3">Course / Series</th>
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
      )}

      {/* ==================== RECORD DUE PAYMENT / MANAGE DUES BREAKDOWN MODAL ==================== */}
      {recordTarget && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/65 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleRecordPayment}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs my-6"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#0a0e2a]">
                  Record Payment &amp; Manage Outstanding Dues Breakdown
                </h3>
                <p className="text-slate-500 mt-0.5">
                  Student: <strong>{recordTarget.studentName}</strong> ({recordTarget.studentCode}) • {recordTarget.courseName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRecordTarget(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Breakdown Summary */}
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="p-2 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Rest Registration Due</span>
                <span className="text-sm font-black text-rose-600">
                  ₹{recordTarget.registrationDueAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Monthly Fee Due</span>
                <span className="text-sm font-black text-amber-700">
                  ₹{(recordAdjustUnpaidMonths * recordTarget.monthlyFeeRate).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-rose-50 border border-rose-200">
                <span className="text-[10px] font-bold text-rose-700 uppercase block">Combined Total Due</span>
                <span className="text-sm font-black text-rose-700">
                  ₹{(recordTarget.registrationDueAmount + recordAdjustUnpaidMonths * recordTarget.monthlyFeeRate).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Adjust Unpaid Monthly Fee Cycles */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Unpaid Monthly Fee Months (@ ₹{recordTarget.monthlyFeeRate.toLocaleString('en-IN')}/month)
              </label>
              <select
                value={recordAdjustUnpaidMonths}
                onChange={(e) => {
                  const nextMo = Number(e.target.value);
                  setRecordAdjustUnpaidMonths(nextMo);
                }}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900"
              >
                <option value={0}>0 Months Pending (₹0 Monthly Due)</option>
                <option value={1}>1 Month Unpaid (₹{(recordTarget.monthlyFeeRate * 1).toLocaleString('en-IN')})</option>
                <option value={2}>2 Months Unpaid (₹{(recordTarget.monthlyFeeRate * 2).toLocaleString('en-IN')})</option>
                <option value={3}>3 Months Unpaid (₹{(recordTarget.monthlyFeeRate * 3).toLocaleString('en-IN')})</option>
                <option value={4}>4 Months Unpaid (₹{(recordTarget.monthlyFeeRate * 4).toLocaleString('en-IN')})</option>
                <option value={6}>6 Months Unpaid (₹{(recordTarget.monthlyFeeRate * 6).toLocaleString('en-IN')})</option>
              </select>
            </div>

            {/* Apply Payment Towards */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Apply Payment Towards</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'both', label: 'Combined Dues' },
                  { key: 'registration', label: 'Registration Due' },
                  { key: 'monthly', label: 'Monthly Fee Due' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setRecordPaymentTargetType(opt.key as any)}
                    className={`py-2 px-2.5 rounded-xl border font-bold text-center cursor-pointer transition-all ${
                      recordPaymentTargetType === opt.key
                        ? 'bg-[#0056b3] text-white border-[#0056b3]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Amount Received Now (₹) (0 to only update dues)
                </label>
                <input
                  type="number"
                  min={0}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-black text-slate-900"
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
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                UTR No. / Transaction Reference (Entered by User / Admin)
              </label>
              <input
                type="text"
                placeholder="Enter 12-digit UTR number or receipt reference"
                value={recordUtrNo}
                onChange={(e) => setRecordUtrNo(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRecordTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white font-bold cursor-pointer"
              >
                {payAmount > 0 ? 'Record Payment & Update Dues' : 'Save Dues Breakdown'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== VIEW ALL PAST TRANSACTIONS MODAL (ADMIN ONLY) ==================== */}
      {historyStudentTarget && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/65 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-[#0a0e2a] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300 block">
                  Admin-Only Full Transaction Ledger
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-white">
                  All Past Transactions — {historyStudentTarget.studentName} ({historyStudentTarget.studentCode})
                </h3>
                {historyStudentTarget.courseName && (
                  <p className="text-xs text-slate-300 mt-0.5">
                    Enrolled Course: {historyStudentTarget.courseName}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setHistoryStudentTarget(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
              {(() => {
                const studentTxs = (db.feePayments || [])
                  .filter((p) => p.studentId === historyStudentTarget.studentId)
                  .sort((a, b) => {
                    const da = a.reviewedAt || a.date || '';
                    const dbDate = b.reviewedAt || b.date || '';
                    return dbDate.localeCompare(da);
                  });

                if (studentTxs.length === 0) {
                  return (
                    <div className="py-10 text-center text-slate-400 space-y-2">
                      <History className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-bold text-slate-600">No Transactions Found</p>
                      <p className="text-xs text-slate-400">
                        No past payment transactions have been recorded for this student yet.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-extrabold">
                          <th className="py-3 px-3.5">Date</th>
                          <th className="py-3 px-3.5">Receipt / Ref</th>
                          <th className="py-3 px-3.5">UTR Number</th>
                          <th className="py-3 px-3.5">Course / Item</th>
                          <th className="py-3 px-3.5">Mode &amp; Type</th>
                          <th className="py-3 px-3.5">Amount</th>
                          <th className="py-3 px-3.5">Status</th>
                          <th className="py-3 px-3.5 text-right">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {studentTxs.map((tx, idx) => (
                          <tr key={tx.id} className={idx === 0 ? 'bg-emerald-50/40' : 'hover:bg-slate-50'}>
                            <td className="py-3 px-3.5 whitespace-nowrap font-bold text-slate-800">
                              {tx.date}
                              {idx === 0 && (
                                <span className="ml-1.5 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase">
                                  Latest
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3.5 font-mono font-bold text-[#0056b3] whitespace-nowrap">
                              {tx.receiptNo}
                            </td>
                            <td className="py-3 px-3.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                              {tx.utr || tx.receiptNo || 'CASH-COUNTER'}
                            </td>
                            <td className="py-3 px-3.5 text-slate-700 font-semibold">
                              {tx.courseName}
                            </td>
                            <td className="py-3 px-3.5 text-slate-500 whitespace-nowrap">
                              {tx.paymentMode} • {tx.paymentType}
                            </td>
                            <td className="py-3 px-3.5 font-black text-emerald-700 whitespace-nowrap">
                              ₹{tx.amount.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                                {tx.status || 'Verified'}
                              </span>
                            </td>
                            <td className="py-3 px-3.5 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setViewingReceipt(tx)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-[#0056b3] font-bold hover:bg-blue-100 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" /> Receipt
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Only the latest payment is shown inline in the Outstanding Dues table; full history is visible here to Admin only.
              </span>
              <button
                type="button"
                onClick={() => setHistoryStudentTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold cursor-pointer"
              >
                Close History
              </button>
            </div>
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
