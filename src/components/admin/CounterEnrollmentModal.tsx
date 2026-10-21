'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  CreditCard,
  UserPlus,
  Users,
  BookOpen,
  ClipboardCheck,
  FileText,
  CheckCircle2,
  AlertCircle,
  Coins,
  Receipt,
  Printer,
  ShieldCheck,
  Search,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { cgaService } from '@/services/cgaService';
import { Course, StudyMaterial, StudentProfile, FeePayment } from '@/data/initialSeedData';
import { PAYMENT_SETTINGS } from '@/config/paymentSettings';
import { PrintableReceiptModal, PrintableReceiptData } from '@/components/admin/PrintableReceiptModal';

interface CounterEnrollmentModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function CounterEnrollmentModal({ onClose, onSuccess }: CounterEnrollmentModalProps) {
  const { db, saveStudent, session, showToast, refresh } = useCga();

  // Mode: Existing Student vs New Walk-In Candidate
  const [studentMode, setStudentMode] = useState<'existing' | 'new'>('new');

  // Existing Student State
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState('');

  // New Student State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newGuardianName, setNewGuardianName] = useState('');
  const [newAddress, setNewAddress] = useState('Udaipur, Gomati Tripura');
  const [newTargetExam, setNewTargetExam] = useState('Tripura TET (T-TET)');
  const [newQualification, setNewQualification] = useState('B.A / B.Sc / B.Ed');

  // Mode: Structured vs Manual Receipt Entry
  const [entryMode, setEntryMode] = useState<'standard' | 'manual'>('standard');

  // Manual Receipt State
  const [manualStudentName, setManualStudentName] = useState('');
  const [manualStudentCode, setManualStudentCode] = useState(
    `CGA-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [manualPhone, setManualPhone] = useState('');
  const [manualGuardian, setManualGuardian] = useState('');
  const [manualAddress, setManualAddress] = useState('Udaipur, Gomati Tripura');
  const [manualItemTitle, setManualItemTitle] = useState(
    db.mockSeries[0]?.name ? `${db.mockSeries[0].name} Package` : 'Tripura TET Mock Test Series'
  );
  const [manualBatch, setManualBatch] = useState('Counter Batch 2026');
  const [manualTotalFee, setManualTotalFee] = useState<string>('499');
  const [manualPaidAmount, setManualPaidAmount] = useState<string>('499');
  const [manualPaymentMode, setManualPaymentMode] = useState<string>('Cash at Counter');
  const [manualRefUtr, setManualRefUtr] = useState<string>('');
  const [manualRemarks, setManualRemarks] = useState<string>(
    'Physical counter receipt issued at Udaipur center.'
  );

  // Section / Item Type Selection
  const [sectionType, setSectionType] = useState<'course' | 'mock_series' | 'material'>('course');

  // Item selections
  const [selectedCourseId, setSelectedCourseId] = useState<string>(db.courses[0]?.id || '');
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>(
    db.mockSeries[0]?.id || 'series-ttet-paper1'
  );
  const [coursePlan, setCoursePlan] = useState<'Full Payment' | 'Instalment 1'>('Full Payment');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(db.studyMaterials[0]?.id || '');

  // Payment Details
  const [customAmount, setCustomAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<string>('Cash at Counter');
  const [adminRemarks, setAdminRemarks] = useState('Physical admission at Udaipur center. Printed notes issued.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generated Receipt for Printing
  const [generatedReceipt, setGeneratedReceipt] = useState<PrintableReceiptData | null>(null);

  // Active Course Details
  const activeCourse = useMemo(() => {
    return db.courses.find((c) => c.id === selectedCourseId) || db.courses[0];
  }, [db.courses, selectedCourseId]);

  // Active Mock Series Details
  const activeSeries = useMemo(() => {
    return db.mockSeries.find((s) => s.id === selectedSeriesId) || db.mockSeries[0];
  }, [db.mockSeries, selectedSeriesId]);

  // Active Material Details
  const activeMaterial = useMemo(() => {
    return db.studyMaterials.find((m) => m.id === selectedMaterialId) || db.studyMaterials[0];
  }, [db.studyMaterials, selectedMaterialId]);

  // Selected Existing Student
  const existingStudent = useMemo(() => {
    return db.students.find((s) => s.id === selectedStudentId);
  }, [db.students, selectedStudentId]);

  // Filter existing students by search query
  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return db.students.slice(0, 10);
    return db.students
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.studentCode.toLowerCase().includes(q) ||
          s.phone.includes(q)
      )
      .slice(0, 15);
  }, [db.students, studentSearch]);

  // Compute Standard Fee based on selection
  const standardFee = useMemo(() => {
    if (sectionType === 'course') {
      if (!activeCourse) return 0;
      return coursePlan === 'Full Payment' ? activeCourse.price : activeCourse.firstInstalment;
    }
    if (sectionType === 'mock_series') {
      return activeSeries?.price || 499;
    }
    if (sectionType === 'material') {
      return (activeMaterial as any)?.price || 199;
    }
    return 0;
  }, [sectionType, activeCourse, coursePlan, activeSeries, activeMaterial]);

  // Total Item Fee
  const totalItemFee = useMemo(() => {
    if (sectionType === 'course') return activeCourse?.price || 0;
    if (sectionType === 'mock_series') return activeSeries?.price || 499;
    if (sectionType === 'material') return (activeMaterial as any)?.price || 199;
    return 0;
  }, [sectionType, activeCourse, activeSeries, activeMaterial]);

  // Payable Amount (custom or standard)
  const payableAmount = customAmount !== '' ? parseFloat(customAmount) || 0 : standardFee;

  // Due Amount
  const dueAmount = Math.max(0, totalItemFee - payableAmount);

  // Auto-fill suggested email based on phone if empty
  const handlePhoneChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    setNewPhone(clean);
    if (!newEmail || newEmail.includes('@cga-student.in')) {
      if (clean.length >= 10) {
        setNewEmail(`student-${clean.slice(-10)}@cga-student.in`);
      }
    }
  };

  // Handle Submission
  const handleSubmitEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (payableAmount < 0) {
      showToast('Invalid Amount', 'Payment amount cannot be negative.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      let candidateId = selectedStudentId;
      let candidateName = existingStudent?.name || '';
      let candidateCode = existingStudent?.studentCode || '';
      let candidatePhone = existingStudent?.phone || '';
      let candidateGuardian = existingStudent?.guardianName || '';
      let candidateAddress = existingStudent?.address || '';

      // 1. If New Student: Register student profile first
      if (studentMode === 'new') {
        if (!newName.trim() || !newPhone.trim() || !newGuardianName.trim()) {
          showToast('Missing Fields', 'Please fill candidate name, phone and guardian name.', 'error');
          setIsSubmitting(false);
          return;
        }

        const generatedStudentCode = `CGA-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const studentPayload: StudentProfile = {
          id: `stu-${Date.now()}`,
          name: newName.trim(),
          studentCode: generatedStudentCode,
          phone: newPhone.trim(),
          email: newEmail.trim() || `student-${newPhone.slice(-10)}@cga-student.in`,
          password: newPhone.slice(-6) || 'cga123',
          guardianName: newGuardianName.trim(),
          address: newAddress.trim(),
          permanentAddress: newAddress.trim(),
          qualification: newQualification.trim(),
          targetExam: newTargetExam.trim(),
          joinedDate: new Date().toISOString().split('T')[0],
          photo: '/avatars/default.png',
          status: 'Active',
          enrollments: [],
        };

        const res = await saveStudent(studentPayload, true);
        candidateId = studentPayload.id;
        candidateName = studentPayload.name;
        candidateCode = studentPayload.studentCode;
        candidatePhone = studentPayload.phone;
        candidateGuardian = studentPayload.guardianName;
        candidateAddress = studentPayload.address;
      } else {
        if (!candidateId) {
          showToast('Select Student', 'Please search and select an existing student.', 'error');
          setIsSubmitting(false);
          return;
        }
      }

      // Generate Official Receipt Sequence Number
      const receiptNo = `${PAYMENT_SETTINGS.receiptPrefix}${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      const issueDate = new Date().toISOString().split('T')[0];

      let itemTitle = '';
      let batchName = '';
      let nextDueDate: string | undefined = undefined;

      if (sectionType === 'course' && activeCourse) {
        itemTitle = activeCourse.name;
        batchName = activeCourse.batchName;
        if (dueAmount > 0) {
          const due = new Date();
          due.setDate(due.getDate() + 30);
          nextDueDate = due.toISOString().split('T')[0];
        }
      } else if (sectionType === 'mock_series') {
        itemTitle = activeSeries?.name || 'Tripura TET Mock Test Series';
        batchName = activeSeries?.batchLabel || 'Online Mock Series';
      } else if (sectionType === 'material' && activeMaterial) {
        itemTitle = `${activeMaterial.title} (${activeMaterial.courseName || 'Notes PDF'})`;
      }

      // 2. Record in fee_payments
      const targetCourseId =
        sectionType === 'course'
          ? selectedCourseId
          : sectionType === 'mock_series'
          ? (activeSeries?.id || selectedSeriesId)
          : selectedMaterialId;

      const newFeePayment: FeePayment = {
        id: `pay-${Date.now()}`,
        receiptNo,
        studentId: candidateId,
        studentName: candidateName,
        courseId: targetCourseId,
        courseName: itemTitle,
        amount: payableAmount,
        paymentMode: paymentMode as any,
        paymentType: sectionType === 'course' ? (coursePlan as any) : 'Full Payment',
        date: issueDate,
        remarks: adminRemarks || 'Physical Counter Cash Admission at Udaipur Office.',
        status: 'Verified',
        reviewedBy: session?.name || 'Administrator (Admissions Desk)',
        reviewedAt: new Date().toISOString(),
      };

      try {
        await cgaService.submitPaymentVerification({
          studentId: candidateId,
          studentName: candidateName,
          courseId: targetCourseId,
          courseName: itemTitle,
          amount: payableAmount,
          paymentMode: paymentMode.includes('UPI')
            ? 'UPI'
            : paymentMode.includes('Cash')
            ? 'Cash at Counter'
            : 'Debit/Credit Card',
          paymentType: sectionType === 'course' ? (coursePlan === 'Full Payment' ? 'Full Payment' : 'Instalment 1') : 'Full Payment',
          utr: receiptNo,
          remarks: newFeePayment.remarks,
        });
      } catch {}

      try {
        const storedFee = localStorage.getItem('cga_custom_payments');
        const feeList: FeePayment[] = storedFee ? JSON.parse(storedFee) : [];
        feeList.unshift(newFeePayment);
        localStorage.setItem('cga_custom_payments', JSON.stringify(feeList));
      } catch {}

      // 3. Record in payment_requests (approved state)
      try {
        const storedReqs = localStorage.getItem('cga_payment_requests');
        const reqList = storedReqs ? JSON.parse(storedReqs) : [];
        reqList.unshift({
          id: `req-${Date.now()}`,
          studentId: candidateId,
          studentName: candidateName,
          studentCode: candidateCode,
          studentPhone: candidatePhone,
          itemType: sectionType,
          itemId: sectionType === 'course' ? selectedCourseId : sectionType === 'mock_series' ? 'ttet-2026' : selectedMaterialId,
          paymentType: sectionType === 'course' ? (coursePlan === 'Full Payment' ? 'full' : 'instalment_1') : 'full',
          expectedAmount: totalItemFee,
          amountReceived: payableAmount,
          referenceCode: receiptNo,
          paymentChannel: 'bank_transfer',
          paymentMethod: 'cash_counter',
          utr: 'CASH-COUNTER',
          status: 'approved',
          reviewedBy: session?.name || 'Administrator',
          reviewedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        });
        localStorage.setItem('cga_payment_requests', JSON.stringify(reqList));
      } catch {}

      // Set Receipt for Printing Modal
      const printableData: PrintableReceiptData = {
        receiptNo,
        date: issueDate,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        studentId: candidateId,
        studentName: candidateName,
        studentCode: candidateCode,
        studentPhone: candidatePhone,
        guardianName: candidateGuardian,
        address: candidateAddress,
        itemType: sectionType,
        itemTitle,
        batchName,
        paymentPlan: sectionType === 'course' ? coursePlan : 'Full Purchase',
        totalFee: totalItemFee,
        amountReceived: payableAmount,
        dueAmount,
        nextDueDate,
        paymentMode,
        cashierName: session?.name || 'Administrator (Admissions Desk, Udaipur)',
        remarks: adminRemarks,
      };

      setGeneratedReceipt(printableData);
      showToast('Enrolment & Receipt Generated', `Recorded ${receiptNo} for ${candidateName}. Ready to print.`, 'success');
      await refresh();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showToast('Enrolment Failed', err.message || 'Could not record admission.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateManualReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStudentName.trim() || manualStudentName.trim().length < 3) {
      showToast('Name Required', 'Please enter candidate full name (minimum 3 characters).', 'error');
      return;
    }
    const receiptNo = `${PAYMENT_SETTINGS.receiptPrefix}${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const total = parseFloat(manualTotalFee) || 0;
    const received = parseFloat(manualPaidAmount) || 0;
    const due = Math.max(0, total - received);

    const issueDate = new Date().toISOString().split('T')[0];
    const printableData: PrintableReceiptData = {
      receiptNo,
      date: issueDate,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      studentId: `manual-${Date.now()}`,
      studentName: manualStudentName.trim(),
      studentCode: manualStudentCode.trim(),
      studentPhone: manualPhone.trim() || 'N/A',
      guardianName: manualGuardian.trim() || 'Parent / Guardian',
      address: manualAddress.trim() || 'Udaipur, Gomati Tripura',
      itemType: 'course',
      itemTitle: manualItemTitle.trim(),
      batchName: manualBatch.trim() || 'Counter Admission',
      paymentPlan: due > 0 ? 'Part Payment / Instalment' : 'Full Payment',
      totalFee: total,
      amountReceived: received,
      dueAmount: due,
      nextDueDate: due > 0 ? new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0] : undefined,
      paymentMode: manualPaymentMode,
      cashierName: session?.name || 'Administrator (Counter Terminal, Udaipur)',
      remarks: manualRemarks || (manualRefUtr ? `Ref: ${manualRefUtr}` : 'Physical receipt issued at counter.'),
    };

    try {
      await cgaService.submitPaymentVerification({
        studentId: printableData.studentId,
        studentName: printableData.studentName,
        courseId: 'manual-receipt-entry',
        courseName: printableData.itemTitle,
        amount: received,
        paymentMode: manualPaymentMode.includes('UPI')
          ? 'UPI'
          : manualPaymentMode.includes('Cash')
          ? 'Cash at Counter'
          : 'Debit/Credit Card',
        paymentType: due > 0 ? 'Instalment 1' : 'Full Payment',
        utr: manualRefUtr || receiptNo,
        remarks: printableData.remarks,
      });
    } catch {}

    setGeneratedReceipt(printableData);
    showToast('Receipt Generated', `Official receipt ${receiptNo} generated for ${manualStudentName}. Ready to print.`, 'success');
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="cga-gradient-hero text-white p-5 sm:p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20 text-amber-300">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300 block">
                  Admissions Desk • Physical Counter Terminal
                </span>
                <h2 className="text-xl font-black text-white">
                  Counter Enrolment & Cash Payment Collection
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Top Mode Selector: Standard vs Manual Receipt Entry */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Terminal Mode:
            </span>
            <div className="inline-flex p-1 rounded-xl bg-slate-200/80 gap-1">
              <button
                type="button"
                onClick={() => setEntryMode('standard')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  entryMode === 'standard'
                    ? 'bg-[#0056b3] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Standard Enrolment Flow
              </button>
              <button
                type="button"
                onClick={() => setEntryMode('manual')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  entryMode === 'manual'
                    ? 'bg-[#ea580c] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Manual Receipt Entry (Fill Any Fields)</span>
              </button>
            </div>
          </div>

          {entryMode === 'manual' ? (
            /* ==================== MANUAL RECEIPT FILLING MODE ==================== */
            <form onSubmit={handleGenerateManualReceipt} className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1">
                <span className="font-extrabold text-amber-950 block">Manual Receipt Generator</span>
                <p>
                  Fill any candidate details, item name, and fee amount manually. Clicking generate will create an
                  official C.G.A receipt with receipt number, watermark, and print layout ready for candidate handover.
                </p>
              </div>

              {/* 1. Candidate Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-[#0a0e2a] flex items-center gap-2 pb-2 border-b border-slate-100">
                  <UserPlus className="w-4 h-4 text-[#0056b3]" /> 1. Candidate Details (Manual Entry)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Candidate Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Subham Debnath"
                      value={manualStudentName}
                      onChange={(e) => setManualStudentName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:outline-none focus:border-[#0056b3]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Student Code / ID Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CGA-2026-042"
                      value={manualStudentCode}
                      onChange={(e) => setManualStudentCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0056b3]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Mobile / WhatsApp Number</label>
                    <input
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-900 focus:outline-none focus:border-[#0056b3]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Father / Guardian Name</label>
                    <input
                      type="text"
                      placeholder="Parent or Guardian name"
                      value={manualGuardian}
                      onChange={(e) => setManualGuardian(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0056b3]"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-bold text-slate-700 block">Residential Address</label>
                    <input
                      type="text"
                      placeholder="Residential address"
                      value={manualAddress}
                      onChange={(e) => setManualAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0056b3]"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Course / Mock Test Item Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-[#0a0e2a] flex items-center gap-2 pb-2 border-b border-slate-100">
                  <BookOpen className="w-4 h-4 text-[#0056b3]" /> 2. Item Description & Fee Structure
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-bold text-slate-700 block">Item / Course / Mock Test Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tripura TET Paper-II Daily Mock Series + Printed Study Material"
                      value={manualItemTitle}
                      onChange={(e) => setManualItemTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:outline-none focus:border-[#0056b3]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Batch / Academic Section</label>
                    <input
                      type="text"
                      placeholder="e.g. Regular Batch 2026 / Weekend CBT"
                      value={manualBatch}
                      onChange={(e) => setManualBatch(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0056b3]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Payment Mode *</label>
                    <select
                      value={manualPaymentMode}
                      onChange={(e) => setManualPaymentMode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:border-[#0056b3]"
                    >
                      <option value="Cash at Counter">Cash at Counter</option>
                      <option value="UPI / QR Payment">UPI / QR Payment</option>
                      <option value="Bank Transfer (NEFT/IMPS)">Bank Transfer (NEFT/IMPS)</option>
                      <option value="Cheque / DD">Cheque / Demand Draft</option>
                      <option value="Debit / Credit Card">Debit / Credit Card (POS)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Total Course / Test Fee (₹) *</label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={manualTotalFee}
                      onChange={(e) => setManualTotalFee(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-black text-slate-900 focus:outline-none focus:border-[#0056b3]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Amount Collected Now (₹) *</label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={manualPaidAmount}
                      onChange={(e) => setManualPaidAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50/50 font-black text-emerald-800 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Transaction Reference / UTR / Cheque No.</label>
                    <input
                      type="text"
                      placeholder="Optional reference number"
                      value={manualRefUtr}
                      onChange={(e) => setManualRefUtr(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-900 focus:outline-none focus:border-[#0056b3]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Balance Pending Due (₹)</label>
                    <div className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-black text-slate-700">
                      ₹{Math.max(0, (parseFloat(manualTotalFee) || 0) - (parseFloat(manualPaidAmount) || 0)).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-bold text-slate-700 block">Receipt Remarks / Notes</label>
                    <input
                      type="text"
                      value={manualRemarks}
                      onChange={(e) => setManualRemarks(e.target.value)}
                      placeholder="Printed notes issued at counter, etc."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0056b3]"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-extrabold shadow-md cursor-pointer transition-all"
                >
                  <Printer className="w-4 h-4" /> Generate & Print Official Receipt
                </button>
              </div>
            </form>
          ) : (
          <form onSubmit={handleSubmitEnrollment} className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Step 1: Candidate Selection Mode */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-extrabold text-[#0a0e2a] flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#0056b3]" /> 1. Candidate Details
                </h3>
                <div className="inline-flex p-1 rounded-xl bg-slate-100 gap-1">
                  <button
                    type="button"
                    onClick={() => setStudentMode('new')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      studentMode === 'new'
                        ? 'bg-[#0056b3] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    New Walk-In Candidate
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentMode('existing')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      studentMode === 'existing'
                        ? 'bg-[#0056b3] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Existing Enrolled Student
                  </button>
                </div>
              </div>

              {/* Mode: Existing Student Search */}
              {studentMode === 'existing' ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Type name, student code, or phone number to search..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0056b3]/20 focus:border-[#0056b3]"
                    />
                  </div>

                  <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                    {filteredStudents.length === 0 ? (
                      <p className="p-3 text-xs text-slate-400 text-center">No matching students found.</p>
                    ) : (
                      filteredStudents.map((stu) => (
                        <div
                          key={stu.id}
                          onClick={() => setSelectedStudentId(stu.id)}
                          className={`p-3 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                            selectedStudentId === stu.id ? 'bg-blue-50/80 font-bold' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <span className="font-extrabold text-slate-900 block">{stu.name}</span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {stu.studentCode} • Ph: {stu.phone} • Guardian: {stu.guardianName}
                            </span>
                          </div>
                          {selectedStudentId === stu.id && (
                            <CheckCircle2 className="w-4 h-4 text-[#0056b3]" />
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {existingStudent && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between">
                      <span>Selected: <strong>{existingStudent.name}</strong> ({existingStudent.studentCode})</span>
                      <span className="text-[11px] text-emerald-700 font-medium">Ready for Counter Enrolment</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Mode: New Walk-In Candidate Form */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Candidate Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Subham Debnath"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:outline-none focus:border-[#0056b3]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Mobile / WhatsApp Number *</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={newPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0056b3]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Father / Guardian Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Father / Mother / Guardian"
                      value={newGuardianName}
                      onChange={(e) => setNewGuardianName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0056b3]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Email Address (Optional)</label>
                    <input
                      type="email"
                      placeholder="student@gmail.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-900 focus:outline-none focus:border-[#0056b3]"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-slate-700 block">Physical / Residential Address *</label>
                    <input
                      type="text"
                      required
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:border-[#0056b3]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Target Examination</label>
                    <select
                      value={newTargetExam}
                      onChange={(e) => setNewTargetExam(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-white"
                    >
                      <option value="Tripura TET (T-TET)">Tripura TET (T-TET Paper I & II)</option>
                      <option value="Banking / IBPS / SBI">Banking / IBPS / SBI</option>
                      <option value="SSC CGL / CHSL">Staff Selection Commission (SSC)</option>
                      <option value="Railway NTPC / Group D">Railway NTPC / Group D</option>
                      <option value="TCS / TPS Tripura Civil Service">TCS / TPS Civil Service</option>
                      <option value="School Coaching (Class 9-12)">School Foundation Coaching</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Highest Educational Qualification</label>
                    <input
                      type="text"
                      value={newQualification}
                      onChange={(e) => setNewQualification(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Enrolment Section Selection */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-[#0a0e2a] flex items-center gap-2 pb-2 border-b border-slate-100">
                <BookOpen className="w-4 h-4 text-[#0056b3]" /> 2. Section to Enrol / Items to Issue
              </h3>

              {/* 3 Section Tabs */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setSectionType('course')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    sectionType === 'course'
                      ? 'border-[#0056b3] bg-blue-50/70 ring-2 ring-[#0056b3]/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <BookOpen className={`w-5 h-5 mb-1 ${sectionType === 'course' ? 'text-[#0056b3]' : 'text-slate-400'}`} />
                  <span className="font-extrabold text-xs text-[#0a0e2a] block">Classroom Course</span>
                  <span className="text-[10px] text-slate-500">Batch Enrolment</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSectionType('mock_series')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    sectionType === 'mock_series'
                      ? 'border-[#0056b3] bg-blue-50/70 ring-2 ring-[#0056b3]/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <ClipboardCheck className={`w-5 h-5 mb-1 ${sectionType === 'mock_series' ? 'text-[#0056b3]' : 'text-slate-400'}`} />
                  <span className="font-extrabold text-xs text-[#0a0e2a] block">T-TET Mock Series</span>
                  <span className="text-[10px] text-slate-500">15 Full Mocks (₹499)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSectionType('material')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    sectionType === 'material'
                      ? 'border-[#0056b3] bg-blue-50/70 ring-2 ring-[#0056b3]/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <FileText className={`w-5 h-5 mb-1 ${sectionType === 'material' ? 'text-[#0056b3]' : 'text-slate-400'}`} />
                  <span className="font-extrabold text-xs text-[#0a0e2a] block">Study Materials</span>
                  <span className="text-[10px] text-slate-500">Notes / Booklets</span>
                </button>
              </div>

              {/* Sub-selectors per section */}
              {sectionType === 'course' && (
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Select Course & Batch:</label>
                    <select
                      value={selectedCourseId}
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900"
                    >
                      {db.courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.batchName}) — Fee: ₹{c.price.toLocaleString('en-IN')} (Seats Left: {c.seatsAvailable})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="font-bold text-slate-700 block">Payment Plan:</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setCoursePlan('Full Payment')}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          coursePlan === 'Full Payment'
                            ? 'border-[#0056b3] bg-white text-[#0056b3] font-bold ring-1 ring-[#0056b3]'
                            : 'border-slate-200 bg-white/60 text-slate-700'
                        }`}
                      >
                        <span className="block text-xs">Full Admission Fee</span>
                        <span className="text-sm font-black text-[#0a0e2a]">
                          ₹{activeCourse?.price.toLocaleString('en-IN')}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCoursePlan('Instalment 1')}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          coursePlan === 'Instalment 1'
                            ? 'border-[#0056b3] bg-white text-[#0056b3] font-bold ring-1 ring-[#0056b3]'
                            : 'border-slate-200 bg-white/60 text-slate-700'
                        }`}
                      >
                        <span className="block text-xs">1st Instalment Plan</span>
                        <span className="text-sm font-black text-[#ea580c]">
                          ₹{activeCourse?.firstInstalment.toLocaleString('en-IN')}{' '}
                          <span className="text-[10px] font-normal text-slate-500">now</span>
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {sectionType === 'mock_series' && (
                <div className="space-y-3 p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-amber-950 block">Select Mock Test Package / Series *</label>
                    <select
                      value={selectedSeriesId}
                      onChange={(e) => setSelectedSeriesId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                    >
                      {db.mockSeries.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.classRange}) — Flat Fee: ₹{s.price} (Starts: {s.startsOn})
                        </option>
                      ))}
                      {db.mockTests.filter(t => t.status === 'Published').map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title} ({t.batchName}) — CBT Mock Test
                        </option>
                      ))}
                    </select>
                  </div>

                  {activeSeries && (
                    <div className="space-y-1 text-amber-900 text-xs pt-1">
                      <p className="font-semibold text-amber-950">
                        {activeSeries.name} ({activeSeries.classRange})
                      </p>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        {activeSeries.description ||
                          'Full-syllabus online mock tests, solution keys, state percentile analytics, and offline paper review at Udaipur center.'}
                      </p>
                      <div className="flex items-center gap-2 font-bold text-xs pt-1">
                        <span className="px-2 py-0.5 rounded bg-amber-200/80 text-amber-900">
                          Package Fee: ₹{activeSeries.price}
                        </span>
                        <span className="text-amber-800">Batch: {activeSeries.batchLabel}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {sectionType === 'material' && (
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Select Booklet / Study Notes:</label>
                    <select
                      value={selectedMaterialId}
                      onChange={(e) => setSelectedMaterialId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900"
                    >
                      {db.studyMaterials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title} ({m.courseName}) — Price: ₹{(m as any).price || 199} ({m.pages} Pages)
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Hand over printed spiral booklet at counter. Digital softcopy access unlocks simultaneously on candidate's portal account.
                  </p>
                </div>
              )}
            </div>

            {/* Step 3: Cash & Payment Collection */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-[#0a0e2a] flex items-center gap-2 pb-2 border-b border-slate-100">
                <Receipt className="w-4 h-4 text-emerald-600" /> 3. Payment Collection & Counter Receipt
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">
                    Total Applicable Fee:
                  </label>
                  <div className="px-3 py-2 rounded-xl bg-slate-100 font-black text-sm text-slate-800">
                    ₹{totalItemFee.toLocaleString('en-IN')}.00
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">
                    Amount Collected Now (INR) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder={String(standardFee)}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50/30 text-sm font-black text-emerald-950 focus:outline-none focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-slate-400">
                    Leave blank to collect standard fee of ₹{standardFee.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Payment Mode Collected *</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 bg-white"
                  >
                    <option value="Cash at Counter">Cash at Counter (Physical Currency)</option>
                    <option value="Counter UPI">Counter UPI (Scanned Academy GPay/PhonePe QR)</option>
                    <option value="Card Swipe at Desk">Card Swipe at Desk (Debit/Credit POS)</option>
                    <option value="Cheque / Demand Draft">Cheque / Demand Draft</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Balance Dues Left:</label>
                  <div className={`px-3 py-2 rounded-xl font-black text-sm ${
                    dueAmount > 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {dueAmount > 0 ? `₹${dueAmount.toLocaleString('en-IN')} (Due in 30 days)` : '₹0 (NIL - Fully Cleared)'}
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700 block">Cashier Remarks (Printed on Receipt)</label>
                  <input
                    type="text"
                    value={adminRemarks}
                    onChange={(e) => setAdminRemarks(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 rounded-2xl bg-[#ea580c] hover:bg-[#c2410c] disabled:opacity-50 text-white text-xs font-black shadow-md cursor-pointer transition-all inline-flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Recording Admission...
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4" /> Collect Cash & Generate Print Receipt
                  </>
                )}
              </button>
            </div>
          </form>
          )}
        </div>
      </div>

      {/* Official Printable Receipt Modal */}
      <PrintableReceiptModal
        receipt={generatedReceipt}
        onClose={() => {
          setGeneratedReceipt(null);
          onClose();
        }}
        onNewEnrollment={() => {
          setGeneratedReceipt(null);
          setNewName('');
          setNewPhone('');
          setNewEmail('');
          setCustomAmount('');
        }}
      />
    </>
  );
}
