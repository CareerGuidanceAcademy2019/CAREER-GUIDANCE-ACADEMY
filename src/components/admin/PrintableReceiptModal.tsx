'use client';

import React, { useRef } from 'react';
import {
  Printer,
  Download,
  X,
  CheckCircle2,
  ShieldCheck,
  Building,
  Phone,
  Mail,
  Receipt,
  User,
  Calendar,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { PAYMENT_SETTINGS } from '@/config/paymentSettings';
import { numberToIndianWords } from '@/lib/amountInWords';

export interface PrintableReceiptData {
  receiptNo: string;
  date: string;
  time?: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  studentPhone: string;
  studentEmail?: string;
  guardianName?: string;
  address?: string;
  itemType: 'course' | 'mock_series' | 'material';
  itemTitle: string;
  batchName?: string;
  paymentPlan: string;
  totalFee: number;
  amountReceived: number;
  dueAmount: number;
  nextDueDate?: string;
  paymentMode: string;
  cashierName: string;
  remarks?: string;
}

interface PrintableReceiptModalProps {
  receipt: PrintableReceiptData | null;
  onClose: () => void;
  onNewEnrollment?: () => void;
}

export function PrintableReceiptModal({
  receipt,
  onClose,
  onNewEnrollment,
}: PrintableReceiptModalProps) {
  const receiptPrintRef = useRef<HTMLDivElement>(null);

  if (!receipt) return null;

  const amountInWords = numberToIndianWords(receipt.amountReceived);
  const currentTime = receipt.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadTxt = () => {
    const textContent = `================================================================================
                    CAREER GUIDANCE ACADEMY (C.G.A)
        Chanban (Behind Youthclub), Udaipur, Gomati Tripura - 799114
    Phone / WhatsApp: ${PAYMENT_SETTINGS.supportPhoneWhatsapp} | Email: ${PAYMENT_SETTINGS.supportEmail}
================================================================================
                     OFFICIAL COUNTER MONEY RECEIPT
================================================================================
Receipt Number      : ${receipt.receiptNo}
Date of Issue       : ${receipt.date} ${currentTime}
Payment Mode        : ${receipt.paymentMode}
Issuing Cashier     : ${receipt.cashierName}
--------------------------------------------------------------------------------
CANDIDATE DETAILS:
Student Name        : ${receipt.studentName}
Student Reg Code    : ${receipt.studentCode}
Contact Phone       : ${receipt.studentPhone}
Guardian Name       : ${receipt.guardianName || 'N/A'}
Address             : ${receipt.address || 'Udaipur, Gomati Tripura'}
--------------------------------------------------------------------------------
ENROLMENT & FEE PARTICULARS:
Item / Particulars  : ${receipt.itemTitle}
Enrolment Category  : ${receipt.itemType.toUpperCase().replace('_', ' ')}
Payment Plan        : ${receipt.paymentPlan}
Total Applicable Fee: INR ${receipt.totalFee.toLocaleString('en-IN')}.00
--------------------------------------------------------------------------------
AMOUNT RECEIVED     : INR ${receipt.amountReceived.toLocaleString('en-IN')}.00
AMOUNT IN WORDS     : ${amountInWords}
BALANCE DUE AMOUNT  : INR ${receipt.dueAmount.toLocaleString('en-IN')}.00
${receipt.nextDueDate ? `NEXT DUE DATE       : ${receipt.nextDueDate}` : ''}
Remarks             : ${receipt.remarks || 'Physical Counter Cash Admission at Udaipur Center.'}
================================================================================
STATUS              : PAID & VERIFIED (OFFICIAL COUNTER ACKNOWLEDGEMENT)
This is an authentic receipt issued by Career Guidance Academy (C.G.A).
Admissions are subject to institutional terms and conditions.
================================================================================
`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${receipt.receiptNo.replace(/\//g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Top Action Bar (Hidden on print) */}
        <div className="bg-[#0a0e2a] text-white p-4 sm:p-5 flex items-center justify-between no-print border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Payment Recorded Successfully</h3>
              <p className="text-xs text-slate-300">Official receipt ready for physical counter printing</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-extrabold shadow-sm cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" /> Print Receipt
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div id="cga-printable-receipt" ref={receiptPrintRef} className="p-6 sm:p-8 bg-white text-slate-900 space-y-6">
          {/* Official Letterhead Header */}
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img
                  src="/cga-logo.png"
                  alt="C.G.A Logo"
                  className="w-16 h-16 rounded-full border border-slate-300 object-contain p-1 shrink-0"
                />
                <div>
                  <span className="text-[10px] font-black tracking-widest text-[#0056b3] uppercase block">
                    Premier Competitive Coaching & Career Institute
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0a0e2a]">
                    CAREER GUIDANCE ACADEMY (C.G.A)
                  </h1>
                  <p className="text-[11px] text-slate-600 font-medium leading-tight">
                    {PAYMENT_SETTINGS.instituteAddress}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Phone/WhatsApp: {PAYMENT_SETTINGS.supportPhoneWhatsapp} • Email: {PAYMENT_SETTINGS.supportEmail}
                  </p>
                </div>
              </div>

              {/* Receipt Tag */}
              <div className="text-right shrink-0 border-l border-slate-200 pl-4">
                <div className="inline-block px-3 py-1 rounded-md bg-slate-900 text-white font-black text-xs uppercase tracking-wider">
                  Money Receipt
                </div>
                <div className="text-[11px] font-bold text-slate-500 mt-1">COUNTER COPY</div>
              </div>
            </div>
          </div>

          {/* Receipt Meta Details Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs font-medium">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Receipt No</span>
              <span className="font-extrabold font-mono text-[#0056b3] text-sm block">
                {receipt.receiptNo}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Date & Time</span>
              <span className="font-bold text-slate-800 text-xs block">
                {receipt.date} • {currentTime}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Payment Mode</span>
              <span className="font-extrabold text-emerald-700 text-xs block">
                {receipt.paymentMode}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Counter Official</span>
              <span className="font-bold text-slate-800 text-xs truncate block">
                {receipt.cashierName}
              </span>
            </div>
          </div>

          {/* Candidate Profile Details */}
          <div className="border border-slate-200 rounded-xl p-4 text-xs space-y-2">
            <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
              Candidate Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              <div>
                <span className="text-slate-400 block text-[10px]">Student Full Name:</span>
                <span className="font-extrabold text-slate-900 text-sm">{receipt.studentName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Student Registration Code:</span>
                <span className="font-mono font-extrabold text-[#0056b3] text-sm">{receipt.studentCode}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Guardian / Father's Name:</span>
                <span className="font-semibold text-slate-800">{receipt.guardianName || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Mobile / WhatsApp:</span>
                <span className="font-mono font-bold text-slate-800">{receipt.studentPhone}</span>
              </div>
              {receipt.address && (
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block text-[10px]">Residential Address:</span>
                  <span className="text-slate-700 font-medium">{receipt.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Fee & Enrolment Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[10px]">
                  <th className="py-2.5 px-3">SL</th>
                  <th className="py-2.5 px-3">Description of Enrolment / Material</th>
                  <th className="py-2.5 px-3">Plan</th>
                  <th className="py-2.5 px-3 text-right">Applicable Fee</th>
                  <th className="py-2.5 px-3 text-right">Paid Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-3 font-bold text-slate-400">01</td>
                  <td className="py-3 px-3">
                    <span className="font-extrabold text-slate-900 block">{receipt.itemTitle}</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                      {receipt.itemType === 'course' ? 'Classroom / Online Course' : receipt.itemType === 'material' ? 'Study Materials & Notes' : 'T-TET 2026 Test Series'}
                      {receipt.batchName ? ` • Batch: ${receipt.batchName}` : ''}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-700">{receipt.paymentPlan}</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">
                    ₹{receipt.totalFee.toLocaleString('en-IN')}.00
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900">
                    ₹{receipt.amountReceived.toLocaleString('en-IN')}.00
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals & Dues Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                Amount Received in Words:
              </span>
              <p className="font-extrabold text-slate-900 italic leading-snug">
                "{amountInWords}"
              </p>
              {receipt.remarks && (
                <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                  Note: {receipt.remarks}
                </p>
              )}
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Total Course/Item Fee:</span>
                <span className="font-bold text-slate-800">₹{receipt.totalFee.toLocaleString('en-IN')}.00</span>
              </div>
              <div className="flex justify-between items-center text-sm font-black text-emerald-800 border-t border-slate-200 pt-1.5">
                <span>Amount Received:</span>
                <span>₹{receipt.amountReceived.toLocaleString('en-IN')}.00</span>
              </div>
              {receipt.dueAmount > 0 ? (
                <div className="flex justify-between items-center text-rose-700 font-extrabold border-t border-dashed border-rose-200 pt-1.5">
                  <span>Balance Due Amount:</span>
                  <span>₹{receipt.dueAmount.toLocaleString('en-IN')}.00</span>
                </div>
              ) : (
                <div className="flex justify-between items-center text-emerald-600 font-bold border-t border-slate-200 pt-1">
                  <span>Outstanding Balance:</span>
                  <span className="uppercase text-[11px]">NIL (Fully Cleared)</span>
                </div>
              )}
              {receipt.nextDueDate && receipt.dueAmount > 0 && (
                <div className="text-[10px] text-slate-500 text-right">
                  Next Due Date: <strong>{receipt.nextDueDate}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Signatures & Seal Section */}
          <div className="pt-8 grid grid-cols-2 gap-8 border-t border-slate-200 text-xs">
            <div className="text-center pt-8 border-t border-dashed border-slate-300">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Candidate / Parent Signature
              </span>
              <span className="text-[10px] text-slate-400">Accepted rules & study material copy</span>
            </div>

            <div className="text-center pt-8 border-t border-dashed border-slate-300 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-white text-[9px] font-mono font-bold text-slate-400 border border-slate-200 rounded">
                OFFICIAL SEAL
              </div>
              <span className="font-extrabold text-slate-900 block">
                For Career Guidance Academy (C.G.A)
              </span>
              <span className="text-[10px] text-slate-500">Authorized Cashier / Accountant</span>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Official Computer-Generated Money Receipt • C.G.A Udaipur Center</span>
            <span>Ref: {receipt.receiptNo}</span>
          </div>
        </div>

        {/* Modal Actions Footer (Hidden on print) */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="text-xs text-slate-500">
            Printed receipts serve as valid physical proof of enrolment and class admission.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" /> Download Text
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-extrabold shadow-sm cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" /> Print Receipt
            </button>
            {onNewEnrollment && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNewEnrollment();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm cursor-pointer transition-all"
              >
                <Sparkles className="w-4 h-4" /> Next Enrolment
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
