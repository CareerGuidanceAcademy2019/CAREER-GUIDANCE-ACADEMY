'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { PAYMENT_SETTINGS, buildUpiDeepLink, getUpiQrCodeUrl } from '@/config/paymentSettings';

export interface PaymentTarget {
  courseId: string;
  courseName: string;
  amount: number;
  paymentType: 'Full Payment' | 'Instalment 1' | 'Instalment 2' | 'Balance Clearance';
  description?: string;
  studentId?: string;
  studentName?: string;
  studentCode?: string;
}

interface UpiPaymentModalProps {
  target: PaymentTarget | null;
  onClose: () => void;
  onSubmitVerification: (data: {
    target: PaymentTarget;
    utr: string;
    paymentMode: 'UPI' | 'Net Banking';
    paymentApp: string;
    screenshotUrl?: string;
    remarks?: string;
  }) => Promise<{ success: boolean; receiptNo?: string; error?: string }>;
}

export function UpiPaymentModal({
  target,
  onClose,
  onSubmitVerification,
}: UpiPaymentModalProps) {
  const [tab, setTab] = useState<'upi' | 'bank'>('upi');
  const [step, setStep] = useState<'pay' | 'proof' | 'success'>('pay');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Verification form state
  const [utr, setUtr] = useState('');
  const [paymentApp, setPaymentApp] = useState('Google Pay');
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedReceiptNo, setConfirmedReceiptNo] = useState<string>('');

  if (!target) return null;

  const upiDeepLink = buildUpiDeepLink({
    amount: target.amount,
    note: `${target.courseName.slice(0, 30)} - ${target.studentCode || 'CGA Student'}`,
  });

  const qrCodeUrl = getUpiQrCodeUrl(upiDeepLink, 320);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload an image file (PNG, JPG, or WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Screenshot file size must be less than 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setScreenshotDataUrl(event.target?.result as string);
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = utr.trim().replace(/\s+/g, '');
    if (cleanUtr.length < 6) {
      setErrorMsg('Please enter a valid 12-digit UPI Reference No. / Bank UTR.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await onSubmitVerification({
        target,
        utr: cleanUtr,
        paymentMode: tab === 'bank' ? 'Net Banking' : 'UPI',
        paymentApp,
        screenshotUrl: screenshotDataUrl || undefined,
        remarks: remarks.trim() || undefined,
      });

      if (res.success) {
        setConfirmedReceiptNo(res.receiptNo || `${PAYMENT_SETTINGS.receiptPrefix}${Date.now().toString().slice(-6)}`);
        setStep('success');
      } else {
        setErrorMsg(res.error || 'Could not submit payment request. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error occurred while submitting payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col">
        {/* Header */}
        <div className="cga-gradient-hero text-white p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-1.5 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/15 border border-white/20 text-[10px] font-extrabold uppercase tracking-wider text-amber-200">
                <ShieldCheck className="w-3.5 h-3.5" /> Official Fee Gateway
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold mt-0.5">
                {PAYMENT_SETTINGS.instituteName}
              </h2>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-semibold text-blue-100 block">Course / Fee Item:</span>
              <p className="text-xs sm:text-sm font-bold text-white line-clamp-1">{target.courseName}</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-blue-100 block">Payable Amount:</span>
              <p className="text-xl sm:text-2xl font-black text-amber-300">
                ₹{target.amount.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* STEP 1: PAYMENT SCREEN */}
          {step === 'pay' && (
            <div className="space-y-5">
              {/* Tabs for Payment Mode */}
              <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setTab('upi')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    tab === 'upi'
                      ? 'bg-white text-[#0056b3] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <QrCode className="w-4 h-4" /> UPI App &amp; Dynamic QR
                </button>
                <button
                  type="button"
                  onClick={() => setTab('bank')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    tab === 'bank'
                      ? 'bg-white text-[#0056b3] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-4 h-4" /> Bank Account (NEFT / IMPS)
                </button>
              </div>

              {tab === 'upi' ? (
                <div className="space-y-4">
                  {/* Direct Mobile UPI Redirect Button */}
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-center space-y-3">
                    <p className="text-xs font-bold text-slate-700">
                      On Mobile? Tap below to open your installed UPI app with the exact amount pre-filled:
                    </p>
                    <a
                      href={upiDeepLink}
                      className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-5 rounded-2xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-sm font-extrabold shadow-md shadow-blue-900/20 transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" /> Pay ₹{target.amount.toLocaleString('en-IN')} via UPI App
                    </a>
                    <p className="text-[11px] font-semibold text-slate-500">
                      Supports Google Pay, PhonePe, Paytm, BHIM, Cred, YONO &amp; other UPI apps
                    </p>
                  </div>

                  {/* QR Code Section */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col items-center text-center space-y-3">
                    <span className="text-xs font-extrabold text-slate-800">
                      Or Scan Dynamic QR Code with Any Phone UPI App:
                    </span>
                    <div className="p-3 rounded-2xl bg-white border-2 border-[#0056b3]/25 shadow-sm inline-block">
                      <img
                        src={qrCodeUrl}
                        alt="CGA Official UPI QR Code"
                        className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg"
                      />
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs">
                      <span className="text-slate-500 font-semibold">Payee UPI ID:</span>
                      <strong className="text-[#0a0e2a] font-mono">{PAYMENT_SETTINGS.upiId}</strong>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(PAYMENT_SETTINGS.upiId, 'upi')}
                        className="text-[#0056b3] hover:underline flex items-center gap-0.5 font-bold cursor-pointer ml-1"
                      >
                        {copiedField === 'upi' ? (
                          <span className="text-emerald-600 flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Copied
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5">
                            <Copy className="w-3 h-3" /> Copy
                          </span>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Verified Payee: <strong>{PAYMENT_SETTINGS.payeeName}</strong>
                    </p>
                  </div>
                </div>
              ) : (
                /* Bank Transfer Details */
                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                    <span className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wide block">
                      State Bank of India (SBI) Direct Transfer
                    </span>
                    <p className="text-slate-700 leading-relaxed">
                      Transfer fees directly using NetBanking, IMPS, NEFT, or RTGS to the official academy account:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">Bank &amp; Branch</span>
                      <strong className="text-slate-900 text-xs sm:text-sm block mt-0.5">
                        {PAYMENT_SETTINGS.bankName}
                      </strong>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">Account Holder Name</span>
                      <strong className="text-slate-900 text-xs sm:text-sm block mt-0.5">
                        {PAYMENT_SETTINGS.bankAccountHolder}
                      </strong>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-slate-500 block">Account Number</span>
                        <strong className="text-slate-900 font-mono text-sm block mt-0.5">
                          {PAYMENT_SETTINGS.bankAccountNumber}
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(PAYMENT_SETTINGS.bankAccountNumber, 'acc')}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-[11px] font-bold text-[#0056b3] hover:bg-slate-100 cursor-pointer"
                      >
                        {copiedField === 'acc' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-slate-500 block">IFSC Code</span>
                        <strong className="text-slate-900 font-mono text-sm block mt-0.5">
                          {PAYMENT_SETTINGS.bankIfsc}
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(PAYMENT_SETTINGS.bankIfsc, 'ifsc')}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-[11px] font-bold text-[#0056b3] hover:bg-slate-100 cursor-pointer"
                      >
                        {copiedField === 'ifsc' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Crucial Instruction Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 text-slate-600">
                <div className="flex items-center gap-1.5 text-slate-800 font-extrabold">
                  <Clock className="w-4 h-4 text-[#0056b3]" /> Payment Verification Protocol:
                </div>
                <p>
                  1. Complete the payment in your UPI app or Bank portal.
                </p>
                <p>
                  2. Note down the <strong>12-digit UTR / UPI Reference Number</strong> from your payment app.
                </p>
                <p>
                  3. Click the button below to submit your 12-digit UTR for immediate verification.
                </p>
              </div>

              {/* Proceed to Step 2 Button */}
              <button
                type="button"
                onClick={() => setStep('proof')}
                className="w-full py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20 cursor-pointer transition-all"
              >
                I Have Completed the Payment → Submit 12-Digit UTR <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: PROOF & UTR SUBMISSION SCREEN */}
          {step === 'proof' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[11px] text-emerald-800 font-semibold block">Payable Amount Paid:</span>
                  <strong className="text-emerald-900 text-sm">₹{target.amount.toLocaleString('en-IN')}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('pay')}
                  className="text-xs font-bold text-[#0056b3] hover:underline cursor-pointer"
                >
                  ← Back to QR &amp; Bank Details
                </button>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-[#dc2626] font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
                </div>
              )}

              {/* 12-digit UTR Input */}
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  12-Digit UTR / UPI Transaction Reference Number <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 429182749102 or UPI Ref / IMPS No"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:ring-2 focus:ring-[#0056b3]/20 focus:border-[#0056b3] outline-hidden bg-slate-50 focus:bg-white"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Check your Google Pay / PhonePe / Bank app receipt for the 12-digit Ref / UTR number.
                </span>
              </div>

              {/* Payment Mode / App Used */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    Payment App / Channel Used
                  </label>
                  <select
                    value={paymentApp}
                    onChange={(e) => setPaymentApp(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white outline-hidden"
                  >
                    <option value="Google Pay">Google Pay (GPay)</option>
                    <option value="PhonePe">PhonePe</option>
                    <option value="Paytm">Paytm</option>
                    <option value="BHIM UPI">BHIM UPI</option>
                    <option value="SBI YONO / NetBanking">SBI YONO / NetBanking</option>
                    <option value="Direct Bank NEFT / IMPS">Direct Bank NEFT / IMPS</option>
                    <option value="Other UPI App">Other UPI App</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    Student Roll / Code
                  </label>
                  <input
                    type="text"
                    disabled
                    value={target.studentCode || 'CGA Student'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-100 text-slate-600 outline-hidden"
                  />
                </div>
              </div>

              {/* Contact Admission Cell for Support Box */}
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#0056b3]">
                  <Phone className="w-4 h-4 text-[#0056b3]" />
                  <span>Contact Admission Cell for Support</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Only your 12-digit bank UTR is needed to verify your payment. For instant activation assistance or queries, please reach our admission desk:
                </p>
                <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
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
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Additional Remarks / Payer Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid from account of S Banik"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs outline-hidden"
                />
              </div>

              {/* Policy & SLA Notice */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  {PAYMENT_SETTINGS.paymentInstructionsExtra}
                </p>
                <p className="text-amber-800/90">
                  {PAYMENT_SETTINGS.refundPolicyText}
                </p>
                <p className="text-amber-800/90">
                  For immediate assistance or WhatsApp verification: <strong>{PAYMENT_SETTINGS.supportPhoneWhatsapp}</strong>
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('pay')}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-extrabold shadow-md cursor-pointer disabled:opacity-60 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    'Submitting Proof...'
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" /> Submit for Admin Verification
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: SUCCESS CONFIRMATION SCREEN */}
          {step === 'success' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-extrabold uppercase">
                  Under Admin Verification
                </span>
                <h3 className="text-xl font-extrabold text-[#0a0e2a] mt-2">
                  Payment Submitted Successfully!
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                  Your payment details and UTR have been received by the C.G.A administrative office.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs max-w-md mx-auto space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tracking Reference:</span>
                  <strong className="font-mono text-[#0056b3]">{confirmedReceiptNo}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">UTR / Reference No:</span>
                  <strong className="font-mono text-slate-900">{utr}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount Paid:</span>
                  <strong className="text-emerald-700">₹{target.amount.toLocaleString('en-IN')}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Verification Window:</span>
                  <strong className="text-slate-800">Up to 6 hours (9 AM – 9 PM)</strong>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Once approved, your course, PDF notes, and test series will be automatically unlocked in your Student Portal.
              </p>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-[#0056b3] text-white text-xs font-extrabold hover:bg-[#1e3a8a] cursor-pointer"
              >
                Done • View Status in Fee Ledger
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
