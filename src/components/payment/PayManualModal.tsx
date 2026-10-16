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
  buildUpiDeepLink,
  getUpiQrCodeUrl,
  getOfficialQrCodeAsset,
} from '@/config/paymentSettings';
import { HowToPayGuide } from '@/components/payment/HowToPayGuide';
import { PaymentItemType, PaymentPlanType, PaymentChannelType } from '@/types/payments';
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
  const { currentStudent, showToast } = useCga();
  const settings: PaymentSettingsRecord = PAYMENT_SETTINGS;

  // Flow State
  const [step, setStep] = useState<'summary' | 'pay' | 'proof' | 'success'>('summary');
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlanType>(() => {
    if (target?.paymentType) return target.paymentType;
    if (target?.dueAmount && target.dueAmount > 0) return 'balance';
    return 'full';
  });
  const [channel, setChannel] = useState<PaymentChannelType>('upi');
  const [referenceCode, setReferenceCode] = useState<string>('');
  const [requestId, setRequestId] = useState<string>('');
  const [qrType, setQrType] = useState<'official' | 'dynamic'>('official');

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
  const currentAmount =
    selectedPlan === 'instalment_1' && target.instalmentAmount
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

    if (channel === 'upi') {
      if (clean.length > 0 && !/^\d+$/.test(clean)) {
        setUtrError('UPI UTR must contain numbers only (12 digits). Letter IDs like T24... are not the UTR.');
      } else if (clean.length > 12) {
        setUtrError('UPI UTR cannot exceed 12 digits.');
      }
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
      setUtrError('Please enter your 12-digit UPI UTR or Bank Transaction reference.');
      return;
    }

    if (channel === 'upi' && utr.length !== 12) {
      setUtrError(`UPI UTR must be exactly 12 digits (you entered ${utr.length} digits).`);
      return;
    }

    if (channel === 'bank_transfer' && (utr.length < 12 || utr.length > 25)) {
      setUtrError(`Bank reference must be between 12 and 25 alphanumeric characters.`);
      return;
    }

    if (utr === '123456789012' || utr === '000000000000') {
      setUtrError('Sample dummy UTRs cannot be submitted. Please provide the real reference from your bank receipt.');
      return;
    }

    if (!confirmAccuracy) {
      setUtrError('Please confirm the checkbox verifying that details and amount are accurate.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate/Trigger RPC call
      const storedRequests = JSON.parse(localStorage.getItem('cga_payment_requests') || '[]');
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
        paymentChannel: channel,
        paymentMethod: channel === 'upi' ? 'upi_manual' : 'bank_transfer',
        utr: utr,
        utrNormalized: utr,
        screenshotPath: screenshotPreview ? `${currentStudent?.id || 'demo'}/${requestId}.jpg` : null,
        status: 'pending_review',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      };

      storedRequests.unshift(newRequest);
      localStorage.setItem('cga_payment_requests', JSON.stringify(storedRequests));

      setIsSubmitting(false);
      setStep('success');
      if (onSuccess) onSuccess(referenceCode);
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : 'Could not submit payment proof. Please try again.';
      setUtrError(msg);
    }
  };

  const upiIntentUrl = buildUpiDeepLink({
    amount: currentAmount,
    note: `${target.title.slice(0, 30)} - ${referenceCode}`,
    transactionRef: referenceCode,
  });

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
              {step === 'pay' && '2. Pay via UPI or Bank Transfer'}
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
          {/* ================= STEP 1: SUMMARY & PLAN ================= */}
          {step === 'summary' && (
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
          {step === 'pay' && (
            <div className="space-y-6">
              {/* Channel Selector */}
              <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setChannel('upi')}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    channel === 'upi'
                      ? 'bg-white text-[#0056b3] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>UPI Payment (Instant QR / App)</span>
                </button>

                {settings.bankTransferEnabled && (
                  <button
                    type="button"
                    onClick={() => setChannel('bank_transfer')}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      channel === 'bank_transfer'
                        ? 'bg-white text-[#0056b3] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Bank Transfer (NEFT / IMPS)</span>
                  </button>
                )}
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

              {/* UPI Tab */}
              {channel === 'upi' && (
                <div className="space-y-4">
                  {/* QR Code Card with Toggle */}
                  <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col items-center text-center space-y-3">
                    <div className="flex items-center justify-between w-full max-w-xs">
                      <span className="text-xs font-bold text-slate-700">Scan QR Code:</span>
                      <div className="flex items-center gap-1 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setQrType('official')}
                          className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                            qrType === 'official' ? 'bg-[#0056b3] text-white' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          Google Pay QR
                        </button>
                        <button
                          type="button"
                          onClick={() => setQrType('dynamic')}
                          className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                            qrType === 'dynamic' ? 'bg-[#0056b3] text-white' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          Dynamic Amount
                        </button>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-white border-2 border-slate-200 shadow-sm inline-block">
                      <img
                        src={qrType === 'official' ? getOfficialQrCodeAsset() : getUpiQrCodeUrl(upiIntentUrl, 260)}
                        alt="CGA Official UPI QR Code"
                        className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-lg mx-auto"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Compatible with Google Pay, PhonePe, Paytm, BHIM, Cred, and all bank UPI apps.
                    </span>

                    {/* Mobile Deep Link Intent Button */}
                    <a
                      href={upiIntentUrl}
                      className="w-full max-w-sm py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Pay with UPI App on Mobile</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* UPI Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 font-semibold block">Official Payee Name:</span>
                        <strong className="text-slate-900 font-bold">{settings.payeeName}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(settings.payeeName, 'payee')}
                        className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Copy Payee Name"
                      >
                        {copiedKey === 'payee' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 font-semibold block">UPI ID / VPA:</span>
                        <strong className="text-[#0056b3] font-mono font-bold">{settings.upiId}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(settings.upiId, 'upi')}
                        className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Copy UPI ID"
                      >
                        {copiedKey === 'upi' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Bank Transfer Tab */}
              {channel === 'bank_transfer' && (
                <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#0056b3]" />
                    State Bank of India (SBI) Account Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 font-semibold block">Account Holder:</span>
                      <strong className="text-slate-900 font-bold">{settings.bankAccountHolder}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 font-semibold block">Bank &amp; Branch:</span>
                      <strong className="text-slate-900 font-bold">{settings.bankName}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 font-semibold block">Account Number:</span>
                        <strong className="text-slate-900 font-mono font-bold">{settings.bankAccountNumber}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(settings.bankAccountNumber, 'acc')}
                        className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Copy Account Number"
                      >
                        {copiedKey === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 font-semibold block">IFSC Code:</span>
                        <strong className="text-slate-900 font-mono font-bold">{settings.bankIfsc}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(settings.bankIfsc, 'ifsc')}
                        className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Copy IFSC"
                      >
                        {copiedKey === 'ifsc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
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
          {step === 'proof' && (
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
                    {channel === 'upi' ? `${utr.length}/12 digits` : `${utr.length} chars`}
                  </span>
                </div>
                <div className="relative">
                  <input
                    id="payment-utr-input"
                    type="text"
                    inputMode={channel === 'upi' ? 'numeric' : 'text'}
                    pattern={channel === 'upi' ? '[0-9]*' : undefined}
                    maxLength={channel === 'upi' ? 12 : 25}
                    value={utr}
                    onChange={handleUtrChange}
                    placeholder={channel === 'upi' ? 'e.g. 429182736451 (12 numbers)' : 'e.g. SBIN429182736451'}
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-mono tracking-wider focus:outline-none focus:ring-2 ${
                      utr.length === 12
                        ? 'border-emerald-500 bg-emerald-50/20 focus:ring-emerald-500'
                        : 'border-slate-300 focus:ring-[#0056b3]'
                    }`}
                    required
                  />
                  {channel === 'upi' && utr.length === 12 && (
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

              {/* Screenshot Upload with Drag & Drop */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Payment Screenshot Proof (Optional but Recommended)
                </label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-400 p-5 rounded-2xl bg-slate-50 text-center cursor-pointer transition-colors space-y-2"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-[#0056b3] mx-auto flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Click to select from phone gallery or drag &amp; drop screenshot here
                  </p>
                  <p className="text-[11px] text-slate-500">JPG, PNG, or WEBP up to 5 MB</p>
                </div>

                {screenshotError && (
                  <p className="text-xs text-red-600 mt-1 font-semibold">{screenshotError}</p>
                )}

                {isBlurryOrSmall && (
                  <p className="text-xs text-amber-700 mt-1 font-medium bg-amber-50 p-2 rounded-lg border border-amber-200">
                    ⚠️ The uploaded image seems very small or low-resolution. Please ensure the 12-digit UTR is clearly readable.
                  </p>
                )}

                {screenshotPreview && (
                  <div className="mt-3 p-3 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={screenshotPreview}
                        alt="Payment Screenshot Preview"
                        className="w-12 h-12 object-cover rounded-xl border border-slate-300"
                      />
                      <div className="text-xs">
                        <strong className="text-slate-900 block truncate max-w-xs">
                          {screenshotFile?.name || 'payment_screenshot.jpg'}
                        </strong>
                        <span className="text-[11px] text-slate-500">
                          {screenshotFile ? `${(screenshotFile.size / 1024).toFixed(0)} KB` : 'Attached'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setScreenshotFile(null);
                        setScreenshotPreview(null);
                      }}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
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
                  href="/student/payments"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0056b3] hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors"
                >
                  Track in My Payments
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
