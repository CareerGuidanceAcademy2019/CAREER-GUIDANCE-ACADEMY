'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  X,
  CreditCard,
  QrCode,
  Building2,
  Copy,
  Check,
  Upload,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Clock,
  Phone,
  FileCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Smartphone,
  Info,
  Trash2,
} from 'lucide-react';
import {
  PAYMENT_SETTINGS,
  PaymentSettingsRecord,
} from '@/config/paymentSettings';
import { HowToPayGuide } from '@/components/payment/HowToPayGuide';
import { PaymentItemType, PaymentPlanType } from '@/types/payments';
import { useCga } from '@/context/CgaContext';

export interface PayManualTarget {
  itemType: PaymentItemType;
  itemId: string;
  title: string;
  category?: string;
  fullAmount: number;
  instalmentAmount?: number;
  dueAmount?: number;
  instalmentAvailable?: boolean;
  paymentType?: PaymentPlanType;
  metadata?: Record<string, unknown>;
}

interface PayManualModalProps {
  target: PayManualTarget | null;
  onClose: () => void;
  onSuccess?: (referenceCode: string) => void;
}

export function PayManualModal({ target, onClose, onSuccess }: PayManualModalProps) {
  const { currentStudent, showToast, submitPaymentVerification, db } = useCga();
  const [settings, setSettings] = useState<PaymentSettingsRecord>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('cga_payment_settings');
        if (cached) return { ...PAYMENT_SETTINGS, ...JSON.parse(cached) };
      } catch {}
    }
    return PAYMENT_SETTINGS;
  });

  useEffect(() => {
    let isMounted = true;
    async function loadPaymentSettings() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const sb = createClient();
        const { data } = await sb.from('payment_settings').select('*').eq('id', 1).maybeSingle();
        if (data && isMounted) {
          const s: PaymentSettingsRecord = {
            ...PAYMENT_SETTINGS,
            payeeName: data.payee_name || PAYMENT_SETTINGS.payeeName,
            upiId: data.upi_id || PAYMENT_SETTINGS.upiId,
            upiIdBackup: data.upi_id_backup || null,
            supportPhoneWhatsapp:
              data.support_phone_whatsapp || data.support_phone || PAYMENT_SETTINGS.supportPhoneWhatsapp,
            supportPhone: data.support_phone || PAYMENT_SETTINGS.supportPhone,
            supportEmail: data.support_email || PAYMENT_SETTINGS.supportEmail,
            paymentInstructionsExtra:
              data.payment_instructions_extra || PAYMENT_SETTINGS.paymentInstructionsExtra,
            refundPolicyText: data.refund_policy_text || PAYMENT_SETTINGS.refundPolicyText,
          };
          setSettings(s);
          localStorage.setItem('cga_payment_settings', JSON.stringify(s));
        }
      } catch {}
    }
    loadPaymentSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  // Check if student already enrolled in this course or mock series
  const isAlreadyEnrolled = Boolean(
    currentStudent &&
      target &&
      ((target.itemType === 'mock_series' &&
        (target.itemId === 'series-current-affairs'
          ? ((db.seriesEnrollments || []).some(
              (se) =>
                (se.studentId === currentStudent.id || se.studentId === 'me') &&
                se.seriesId === 'series-current-affairs' &&
                (!se.accessValidUntil || new Date(se.accessValidUntil).getTime() >= Date.now())
            ) ||
            (currentStudent.enrollments || []).some(
              (e) =>
                e.courseId === 'series-current-affairs' &&
                (!e.accessValidUntil || new Date(e.accessValidUntil).getTime() >= Date.now())
            ))
          : (db.seriesEnrollments?.some((se) => se.studentId === currentStudent.id && se.seriesId === target.itemId) ||
              currentStudent.enrollments.some((e) => e.courseId === target.itemId) ||
              (currentStudent as any).seriesEnrolled))) ||
        (target.itemType === 'course' && currentStudent.enrollments.some((e) => e.courseId === target.itemId)) ||
        (target.itemType === 'material' &&
          (db.feePayments?.some(
            (p) =>
              (p.studentId === currentStudent.id || p.studentId === 'me' || (currentStudent.phone && p.studentId === currentStudent.phone)) &&
              (p.itemId === target.itemId || p.courseId === target.itemId || p.remarks?.includes(target.itemId)) &&
              p.status === 'Verified'
          ) ||
            currentStudent.enrollments.some((e) => {
              const mat = (db.studyMaterials || []).find((m) => m.id === target.itemId);
              return mat && e.courseId === mat.courseId;
            }))))
  );

  // Check if payment verification is already pending for this course, mock series, or study material
  const existingPendingPayment = Boolean(
    currentStudent &&
      target &&
      db.feePayments?.some(
        (p) =>
          (p.studentId === currentStudent.id || p.studentId === 'me' || (currentStudent.phone && p.studentId === currentStudent.phone)) &&
          (p.courseId === target.itemId || (p as any).itemId === target.itemId || p.remarks?.includes(target.itemId)) &&
          p.status === 'Pending'
      )
  );

  // Flow State
  const [step, setStep] = useState<'summary' | 'pay' | 'proof' | 'success'>('summary');
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlanType>(() => {
    if (target?.paymentType) return target.paymentType;
    if (target?.dueAmount && target.dueAmount > 0) return 'balance';
    return 'full';
  });
  const [payOption, setPayOption] = useState<'upi_id' | 'whatsapp_qr'>('upi_id');
  const [referenceCode, setReferenceCode] = useState<string>('');
  const [requestId, setRequestId] = useState<string>('');

  // Current Affairs 1-Month (₹49) vs 1-Year (₹499) plan selection
  const isCaSeries = target?.itemId === 'series-current-affairs';
  const [caPlan, setCaPlan] = useState<'monthly' | 'yearly'>('monthly');

  // Proof form state
  const [utr, setUtr] = useState('');
  const [utrError, setUtrError] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotError, setScreenshotError] = useState('');
  const [isBlurryOrSmall, setIsBlurryOrSmall] = useState(false);
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!target) return null;

  // Calculate current amount based on selected plan
  const currentAmount = isCaSeries
    ? caPlan === 'yearly'
      ? 499
      : 49
    : selectedPlan === 'instalment_1' && target.instalmentAmount
    ? target.instalmentAmount
    : selectedPlan === 'balance' && target.dueAmount
    ? target.dueAmount
    : target.fullAmount;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Generate Reference Code on Moving from Summary to Pay
  const handleProceedToPayment = () => {
    // Generate code e.g. CGA-7K3Q9X
    if (!referenceCode) {
      const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
      let code = 'CGA-';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setReferenceCode(code);
      setRequestId(`req-${Date.now()}`);
    }
    setStep('pay');
  };

  // Handle UTR Input with Stripping and Validation
  const handleUtrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Strip whitespace and dashes immediately
    const clean = raw.replace(/[\s\-]/g, '').toUpperCase();
    setUtr(clean);
    setUtrError('');

    // Sample blocklist check
    if (clean === '123456789012' || clean === '000000000000' || clean === '111111111111') {
      setUtrError('This is a recognized sample/dummy reference. Please enter your real 12-digit UTR from your bank app.');
      return;
    }

    if (clean.length > 0 && !/^\d+$/.test(clean)) {
      setUtrError('UPI UTR must contain numbers only (12 digits). Letter IDs like T24... are not the UTR.');
    } else if (clean.length > 12) {
      setUtrError('UPI UTR cannot exceed 12 digits.');
    }
  };

  // Client-Side Image Compression & Validation
  const processImageFile = (file: File) => {
    setScreenshotError('');
    setIsBlurryOrSmall(false);

    // MIME type check
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setScreenshotError('Invalid file type: Please upload a JPG, PNG, or WEBP image.');
      return;
    }

    // Size check (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setScreenshotError('File is too large: Maximum screenshot size is 5 MB.');
      return;
    }

    if (file.size < 8 * 1024) {
      setIsBlurryOrSmall(true);
    }

    // Canvas Compression
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        if (img.width < 120 || img.height < 120) {
          setIsBlurryOrSmall(true);
        }

        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDimension = 1600;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setScreenshotPreview(compressedDataUrl);
          setScreenshotFile(file);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  // Submit Proof Form
  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    setUtrError('');

    // Strict UTR validation
    if (!utr) {
      setUtrError('Please enter your 12-digit UPI UTR reference number.');
      return;
    }

    if (!/^\d{12}$/.test(utr)) {
      setUtrError(`UPI UTR must be exactly 12 digits (you entered ${utr.length} character(s)).`);
      return;
    }

    if (utr === '123456789012' || utr === '000000000000' || utr === '111111111111') {
      setUtrError('Sample dummy UTRs cannot be submitted. Please provide the real 12-digit UTR from your payment receipt.');
      return;
    }

    if (!confirmAccuracy) {
      setUtrError('Please confirm the checkbox verifying that details and amount are accurate.');
      return;
    }

    if (isAlreadyEnrolled) {
      setUtrError('You are already enrolled in this course or mock test series.');
      return;
    }

    if (existingPendingPayment) {
      setUtrError('An application for this course/mock test is already pending admin verification. Multiple payments are not accepted.');
      return;
    }

    setIsSubmitting(true);

    const paymentChannelNote = payOption === 'whatsapp_qr' ? 'WhatsApp QR Request' : 'Direct UPI ID';

    try {
      if (currentStudent) {
        // Record payment verification in Supabase Postgres and local state
        const res = await submitPaymentVerification({
          courseId: target.itemId,
          courseName: target.title,
          itemType: target.itemType,
          itemId: target.itemId,
          referenceCode: referenceCode,
          amount: currentAmount,
          paymentMode: 'UPI',
          paymentType: selectedPlan === 'instalment_1' ? 'Instalment 1' : 'Full Payment',
          utr: utr,
          screenshotUrl: screenshotPreview || undefined,
          remarks: `Ref: ${referenceCode} | Method: ${paymentChannelNote} | Item: ${target.title} (${target.itemType})`,
        });

        if (res && !res.success) {
          setIsSubmitting(false);
          setUtrError(res.error || 'Could not record payment. Please try again.');
          return;
        }
      }

      // Sync to localStorage cache without creating duplicates
      const storedRequests = JSON.parse(localStorage.getItem('cga_payment_requests') || '[]');
      const filteredRequests = storedRequests.filter(
        (r: any) =>
          r.referenceCode !== referenceCode &&
          r.reference_code !== referenceCode &&
          !(r.studentId === currentStudent?.id && r.utr === utr)
      );
      const newRequest = {
        id: requestId,
        studentId: currentStudent?.id || 'demo-student',
        studentName: currentStudent?.name || 'Aspirant',
        studentEmail: currentStudent?.email || '',
        studentPhone: currentStudent?.phone || '',
        itemType: target.itemType,
        itemId: target.itemId,
        itemTitle: target.title,
        paymentType: selectedPlan,
        expectedAmount: currentAmount,
        referenceCode: referenceCode,
        paymentChannel: 'upi',
        paymentMethod: 'upi_manual',
        utr: utr,
        utrNormalized: utr,
        screenshotPath: screenshotPreview ? `${currentStudent?.id || 'demo'}/${requestId}.jpg` : null,
        status: 'pending_review',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      };

      filteredRequests.unshift(newRequest);
      localStorage.setItem('cga_payment_requests', JSON.stringify(filteredRequests));

      setIsSubmitting(false);
      setStep('success');
      if (onSuccess) onSuccess(referenceCode);
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : 'Could not submit payment proof. Please try again.';
      setUtrError(msg);
    }
  };

  const effectiveUpiId = settings.upiId;
  const rawWhatsappDigits = (settings.supportPhoneWhatsapp || settings.supportPhone || '+917005929189').replace(/\D/g, '');
  const whatsappNumber = rawWhatsappDigits.length === 10 ? `91${rawWhatsappDigits}` : rawWhatsappDigits || '917005929189';
  const whatsappRequestText = [
    `Hello Career Guidance Academy Admin,`,
    `Please send me the official Payment QR Code to complete my enrollment.`,
    ``,
    `• Student: ${currentStudent?.name || 'Student'}${currentStudent?.phone ? ` (${currentStudent.phone})` : ''}`,
    `• Enrolling In: ${target.title}`,
    `• Amount: ₹${currentAmount}`,
    `• Reference Code: ${referenceCode || 'Pending'}`,
  ].join('\n');
  const whatsappRedirectUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappRequestText)}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="cga-gradient-hero text-white p-5 sm:p-6 flex items-center justify-between gap-4 border-b-2 border-white/10 shrink-0">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300 bg-white/15 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Official Institute Fee Desk
            </span>
            <h2 id="payment-modal-title" className="text-xl sm:text-2xl font-black">
              {step === 'summary' && '1. Choose Payment Option'}
              {step === 'pay' && '2. Pay via UPI ID or Request QR on WhatsApp'}
              {step === 'proof' && '3. Submit Payment Reference (UTR)'}
              {step === 'success' && 'Payment Under Verification'}
            </h2>
            <p className="text-xs text-blue-100">{target.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close Payment Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-xs sm:text-sm">
          {/* ================= SINGLE ENROLMENT BLOCKER: ALREADY ENROLLED ================= */}
          {isAlreadyEnrolled && (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-extrabold text-[10px] uppercase tracking-wider">
                  Enrolment Active
                </span>
                <h3 className="text-base font-extrabold text-emerald-950">You Are Already Enrolled</h3>
                <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                  You have already enrolled in <strong>{target.title}</strong>. Under CGA single enrolment policy, each course or mock test series can be enrolled only once.
                </p>
                <p className="text-xs text-slate-600 pt-1">
                  You can access all classes, question papers, and CBT mock tests directly in your student hub.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                <Link
                  href="/student/my-learning"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs inline-flex items-center justify-center gap-1.5"
                >
                  <span>Go to My Learning</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* ================= SINGLE ENROLMENT BLOCKER: PENDING VERIFICATION ================= */}
          {!isAlreadyEnrolled && existingPendingPayment && (
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
                <Clock className="w-6 h-6 animate-pulse text-amber-600" />
              </div>
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-extrabold text-[10px] uppercase tracking-wider">
                  Verification Pending
                </span>
                <h3 className="text-base font-extrabold text-amber-950">Payment Verification Under Review</h3>
                <p className="text-xs text-amber-900 max-w-md mx-auto leading-relaxed">
                  You have already submitted a payment verification request for <strong>{target.title}</strong>. One student cannot apply twice for enrolment.
                </p>
                <p className="text-xs text-amber-800 pt-1">
                  Our Admission Cell is currently verifying your bank transaction. Upon verification, this will be automatically unlocked in your <strong>My Learning</strong> section.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                <Link
                  href="/student/my-learning"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-[#0056b3] hover:bg-blue-700 text-white text-xs font-bold shadow-xs inline-flex items-center justify-center gap-1.5"
                >
                  <span>View My Learning Status</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 1: SUMMARY & PLAN ================= */}
          {!isAlreadyEnrolled && !existingPendingPayment && step === 'summary' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">
                    Enrolling In
                  </span>
                  <h3 className="text-base font-extrabold text-[#0a0e2a] mt-0.5">{target.title}</h3>
                  {target.category && <p className="text-xs text-slate-600">{target.category}</p>}
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-bold block">Total Fee</span>
                  <strong className="text-xl font-black text-[#0056b3]">₹{target.fullAmount}</strong>
                </div>
              </div>

              {/* Current Affairs Subscription Plan Choice */}
              {isCaSeries && (
                <div className="space-y-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Select Current Affairs Plan:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setCaPlan('monthly')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        caPlan === 'monthly'
                          ? 'border-[#0056b3] bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-sm font-extrabold text-slate-900">
                          1-Month Pass
                        </strong>
                        <span className="text-xs font-black text-[#0056b3]">₹49</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        30 days access to all Domestic &amp; International current affairs PDFs.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCaPlan('yearly')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        caPlan === 'yearly'
                          ? 'border-[#0056b3] bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-sm font-extrabold text-slate-900">
                          1-Year Pass (365 Days)
                        </strong>
                        <span className="text-xs font-black text-[#0056b3]">₹499</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Full year coverage of all Tripura &amp; national competitive exam capsules.
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* Course Instalment Choice */}
              {target.itemType === 'course' && target.instalmentAvailable && !target.dueAmount && (
                <div className="space-y-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Select Your Payment Preference:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedPlan('full')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        selectedPlan === 'full'
                          ? 'border-[#0056b3] bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-sm font-extrabold text-slate-900">
                          Full One-Time Payment
                        </strong>
                        <span className="text-xs font-black text-[#0056b3]">₹{target.fullAmount}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Zero recurring dues. Full course access and printed notes included.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPlan('instalment_1')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        selectedPlan === 'instalment_1'
                          ? 'border-[#0056b3] bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-sm font-extrabold text-slate-900">
                          2-Part Instalment (Part 1)
                        </strong>
                        <span className="text-xs font-black text-[#0056b3]">
                          ₹{target.instalmentAmount || Math.round(target.fullAmount / 2)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Pay first instalment today. Remaining balance due in 30 days.
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* Action */}
              <button
                type="button"
                onClick={handleProceedToPayment}
                className="w-full py-3.5 rounded-xl bg-[#0056b3] hover:bg-blue-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>Proceed to Pay ₹{currentAmount}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ================= STEP 2: PAYMENT DESK ================= */}
          {!isAlreadyEnrolled && !existingPendingPayment && step === 'pay' && (
            <div className="space-y-6">
              {/* Two-Option Channel Selector: UPI ID or WhatsApp QR Request */}
              <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPayOption('upi_id')}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    payOption === 'upi_id'
                      ? 'bg-white text-[#0056b3] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Option 1: Pay via UPI ID</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPayOption('whatsapp_qr')}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    payOption === 'whatsapp_qr'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  <span>Option 2: Request QR on WhatsApp</span>
                </button>
              </div>

              {/* Mandatory Reference Notice & Exact Amount */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-950">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
                    Your CGA Payment Reference Code
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <strong className="text-lg font-mono font-black text-amber-950">
                      {referenceCode}
                    </strong>
                    <button
                      type="button"
                      onClick={() => handleCopy(referenceCode, 'ref')}
                      className="p-1 rounded-md bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 cursor-pointer"
                      title="Copy Reference Code"
                    >
                      {copiedKey === 'ref' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
                    Pay Exactly This Amount
                  </span>
                  <strong className="text-xl font-black text-amber-950">₹{currentAmount}</strong>
                </div>
              </div>

              {/* Option 1: Direct UPI ID Payment */}
              {payOption === 'upi_id' && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/50 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0056b3] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-sm text-slate-900">
                          Pay Directly to Official Academy UPI ID
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Copy the UPI ID below, open Google Pay, PhonePe, Paytm, or BHIM, choose <strong>&quot;Pay to UPI ID / VPA&quot;</strong>, enter <strong>₹{currentAmount}</strong>, add reference <strong>{referenceCode}</strong> in remarks, and complete the payment.
                        </p>
                      </div>
                    </div>

                    {/* Primary UPI ID Box */}
                    <div className="p-4 rounded-xl bg-white border-2 border-[#0056b3]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div>
                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                          Official UPI ID / VPA
                        </span>
                        <strong className="text-base sm:text-lg text-[#0056b3] font-mono font-black select-all">
                          {effectiveUpiId}
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(effectiveUpiId, 'upi-direct')}
                        className="px-4 py-2.5 rounded-xl bg-[#0056b3] hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
                      >
                        {copiedKey === 'upi-direct' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedKey === 'upi-direct' ? 'UPI ID Copied!' : 'Copy UPI ID'}</span>
                      </button>
                    </div>

                    {/* Optional Backup UPI ID if configured */}
                    {settings.upiIdBackup && (
                      <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[11px] text-slate-400 font-semibold block">
                            Alternate / Backup UPI ID:
                          </span>
                          <strong className="text-sm text-slate-800 font-mono font-bold">
                            {settings.upiIdBackup}
                          </strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(settings.upiIdBackup || '', 'upi-backup')}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          {copiedKey === 'upi-backup' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedKey === 'upi-backup' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}

                    {/* Payee Name */}
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 font-semibold block">Verify Payee Name Before Paying:</span>
                        <strong className="text-slate-900 font-bold">{settings.payeeName}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(settings.payeeName, 'payee')}
                        className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Copy Payee Name"
                      >
                        {copiedKey === 'payee' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Option 2: Request Official QR via Admin WhatsApp */}
              {payOption === 'whatsapp_qr' && (
                <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/50 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm text-emerald-950">
                        Request Payment QR Code on Admin WhatsApp
                      </h4>
                      <p className="text-xs text-emerald-900 leading-relaxed">
                        Click the WhatsApp button below to message our Admission Desk directly with your enrollment details. The admin will immediately send you the official QR code to pay <strong>₹{currentAmount}</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-emerald-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold">Admin WhatsApp Number:</span>
                      <strong className="font-mono text-emerald-800 font-bold">
                        {settings.supportPhoneWhatsapp || '+91-7005929189'}
                      </strong>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      After paying on the QR sent by Admin, return here and click <strong>&quot;I Have Paid — Enter 12-Digit UTR&quot;</strong> below to submit your UTR for verification.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <a
                      href={whatsappRedirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Message Admin on WhatsApp for QR</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy(whatsappRequestText, 'wa-msg')}
                      className="px-4 py-3 rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      {copiedKey === 'wa-msg' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedKey === 'wa-msg' ? 'Message Copied!' : 'Copy Message'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Integrated Collapsible How-To-Pay & UTR Finder Guide */}
              <HowToPayGuide compact={true} settings={settings} />

              {/* Statutory Note & Refund Policy */}
              <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 space-y-1">
                <p>
                  <strong>Verification SLA:</strong> {settings.paymentInstructionsExtra}
                </p>
                <p>
                  <strong>Refund Policy:</strong> {settings.refundPolicyText}
                </p>
                <p>
                  <strong>Helpline / WhatsApp:</strong>{' '}
                  <a href={`tel:${settings.supportPhoneWhatsapp}`} className="text-[#0056b3] font-bold underline">
                    {settings.supportPhoneWhatsapp}
                  </a>
                </p>
              </div>

              {/* Continue to Proof Submission */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('summary')}
                  className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep('proof')}
                  className="flex-1 py-3.5 rounded-xl bg-[#0056b3] hover:bg-blue-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <span>I Have Paid — Enter 12-Digit UTR</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: PROOF SUBMISSION FORM ================= */}
          {!isAlreadyEnrolled && !existingPendingPayment && step === 'proof' && (
            <form onSubmit={handleSubmitProof} className="space-y-5" noValidate>
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 font-semibold">Reference Code:</span>{' '}
                  <strong className="font-mono text-slate-900">{referenceCode}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Expected Amount:</span>{' '}
                  <strong className="text-[#0056b3] font-bold">₹{currentAmount}</strong>
                </div>
              </div>

              {utrError && (
                <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{utrError}</span>
                </div>
              )}

              {/* UTR Input with numeric keypad and live counter */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="payment-utr-input" className="block text-xs font-bold text-slate-800">
                    12-Digit Transaction Reference (UTR) <span className="text-red-600">*</span>
                  </label>
                  <span className="text-[11px] font-mono text-slate-500">
                    {utr.length}/12 digits
                  </span>
                </div>
                <div className="relative">
                  <input
                    id="payment-utr-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={12}
                    value={utr}
                    onChange={handleUtrChange}
                    placeholder="e.g. 429182736451 (12 numbers)"
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-mono tracking-wider focus:outline-none focus:ring-2 ${
                      utr.length === 12
                        ? 'border-emerald-500 bg-emerald-50/20 focus:ring-emerald-500'
                        : 'border-slate-300 focus:ring-[#0056b3]'
                    }`}
                    required
                  />
                  {utr.length === 12 && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                  <span>Strips all spaces and hyphens automatically.</span>
                  <Link href="/how-to-pay" target="_blank" className="text-[#0056b3] font-bold hover:underline inline-flex items-center gap-0.5">
                    Where do I find this? <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Optional Payment Screenshot Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Payment Screenshot <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  {screenshotPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setScreenshotPreview(null);
                        setScreenshotFile(null);
                        setScreenshotError('');
                      }}
                      className="text-[11px] font-bold text-red-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  )}
                </div>

                {screenshotError && (
                  <p className="text-xs text-red-600 font-semibold">{screenshotError}</p>
                )}

                {screenshotPreview ? (
                  <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-3">
                    <img
                      src={screenshotPreview}
                      alt="Payment screenshot preview"
                      className="w-14 h-14 object-cover rounded-lg border border-slate-200"
                    />
                    <div className="text-xs text-slate-600">
                      <p className="font-bold text-slate-800 truncate max-w-[220px]">
                        {screenshotFile?.name || 'Payment screenshot attached'}
                      </p>
                      {isBlurryOrSmall && (
                        <p className="text-[11px] text-amber-700 flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="w-3 h-3" /> Low resolution image — ensure UTR is legible.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#0056b3] bg-slate-50/70 text-center cursor-pointer transition-colors"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-slate-700">
                      Click or drag &amp; drop payment screenshot (JPG/PNG, max 5 MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Contact Admission Cell for Support Box */}
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#0056b3]">
                  <Phone className="w-4 h-4 text-[#0056b3]" />
                  <span>Contact Admission Cell for Support</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Only your genuine 12-digit UTR is required to verify your transaction against bank records. For instant activation assistance or queries, please reach our admission desk:
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                  <a
                    href="tel:+917005929189"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-blue-200 font-bold text-[#0056b3] hover:bg-blue-100 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" /> +91 70059 29189
                  </a>
                  <a
                    href="tel:+919436128944"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-blue-200 font-bold text-[#0056b3] hover:bg-blue-100 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" /> +91 94361 28944
                  </a>
                  <span className="text-[11px] text-slate-500">
                    Admission Cell • Chanban, Udaipur
                  </span>
                </div>
              </div>

              {/* Confirmation Checkbox */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                <input
                  id="pay-confirm-checkbox"
                  type="checkbox"
                  checked={confirmAccuracy}
                  onChange={(e) => setConfirmAccuracy(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-[#0056b3] rounded border-slate-300 focus:ring-[#0056b3] cursor-pointer"
                  required
                />
                <label htmlFor="pay-confirm-checkbox" className="text-xs text-slate-700 leading-relaxed cursor-pointer select-none">
                  I confirm that all payment details entered above are accurate, that I paid exactly ₹{currentAmount} to {settings.payeeName}, and that this 12-digit UTR is from my genuine bank debit.
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('pay')}
                  className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !confirmAccuracy}
                  className="flex-1 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  {isSubmitting ? 'Submitting for Verification…' : 'Submit for Admin Verification'}
                </button>
              </div>
            </form>
          )}

          {/* ================= STEP 4: SUCCESS TRACKER ================= */}
          {step === 'success' && (
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center font-bold shadow-sm">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-slate-900">
                  Payment Submitted for Verification!
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  Your reference <strong className="font-mono text-[#0056b3]">{referenceCode}</strong> with UTR <strong className="font-mono text-slate-900">{utr}</strong> has been forwarded to the academy accounts desk.
                </p>
              </div>

              {/* Status Tracker */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 max-w-md mx-auto text-left space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Verification Lifecycle
                </span>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Submitted</span>
                  </div>
                  <div className="h-0.5 w-8 bg-blue-300" />
                  <div className="flex items-center gap-1.5 font-bold text-[#0056b3]">
                    <Clock className="w-4 h-4 text-[#0056b3] animate-spin" />
                    <span>Under Review</span>
                  </div>
                  <div className="h-0.5 w-8 bg-slate-200" />
                  <div className="flex items-center gap-1.5 font-semibold text-slate-400">
                    <FileCheck className="w-4 h-4 text-slate-300" />
                    <span>Access Unlocked</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-slate-700 max-w-md mx-auto space-y-1">
                <p>
                  <strong>Expected Turnaround:</strong> {settings.paymentInstructionsExtra}
                </p>
                <p>
                  Need assistance? Call / WhatsApp{' '}
                  <a href={`tel:${settings.supportPhoneWhatsapp}`} className="text-[#0056b3] font-bold underline">
                    {settings.supportPhoneWhatsapp}
                  </a>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  href="/student/my-learning"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <span>Go to My Learning (Status: Pending)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/student/payments"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#0056b3] hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors"
                >
                  Track in My Payments
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
