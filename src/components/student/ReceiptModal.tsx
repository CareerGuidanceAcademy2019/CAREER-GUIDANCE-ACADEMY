'use client';

import React from 'react';
import { Printer, Download, CheckCircle2, X, ShieldCheck } from 'lucide-react';
import { FeePayment } from '@/data/initialSeedData';
import { useCga } from '@/context/CgaContext';

interface ReceiptModalProps {
  receipt: FeePayment | null;
  onClose: () => void;
}

export function ReceiptModal({ receipt, onClose }: ReceiptModalProps) {
  const { db, showToast } = useCga();
  if (!receipt) return null;

  const handleDownloadTxt = () => {
    const content = `============================================================
           CAREER GUIDANCE ACADEMY (C.G.A)
   ${db.siteContent.contact.address}
   Phone: ${db.siteContent.contact.phonePrimary} | Email: ${db.siteContent.contact.email}
============================================================
                 OFFICIAL FEE RECEIPT
------------------------------------------------------------
Receipt No      : ${receipt.receiptNo}
Payment Date    : ${receipt.date}
Student Name    : ${receipt.studentName}
Student ID      : ${receipt.studentId}
Course Enrolled : ${receipt.courseName}
Payment Plan    : ${receipt.paymentType}
Payment Mode    : ${receipt.paymentMode}
------------------------------------------------------------
AMOUNT RECEIVED : INR ${receipt.amount.toLocaleString('en-IN')}.00
STATUS          : PAID & VERIFIED
Remarks         : ${receipt.remarks || 'Official C.G.A Udaipur Fee Receipt'}
============================================================
This is a computer-generated receipt from C.G.A Digital Portal.
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${receipt.receiptNo.replace(/\//g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Receipt Downloaded', `Saved ${receipt.receiptNo} to your device.`, 'success');
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/65 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Top Header */}
        <div className="cga-gradient-hero text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <img
              src="/cga-logo.png"
              alt="C.G.A Logo"
              className="w-14 h-14 rounded-full bg-white p-1 object-contain"
            />
            <div>
              <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-300/40 text-emerald-200 text-[10px] font-extrabold uppercase tracking-wider">
                Official Fee Receipt
              </span>
              <h3 className="text-lg font-extrabold">Career Guidance Academy (C.G.A)</h3>
              <p className="text-xs text-blue-100">
                Chanban Youth Club Rd, Udaipur, Tripura 799120
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-xl bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-dashed border-slate-200">
            <div>
              <span className="text-[11px] font-bold uppercase text-slate-400 block">
                Receipt Number
              </span>
              <span className="text-base font-extrabold font-mono text-[#0056b3] whitespace-nowrap block">
                {receipt.receiptNo}
              </span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">
                Payment Date
              </span>
              <span className="text-sm font-bold text-slate-800 whitespace-nowrap block">
                {receipt.date}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div>
              <span className="text-slate-400 block">Student Name</span>
              <span className="font-extrabold text-slate-900 text-sm">{receipt.studentName}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Payment Mode</span>
              <span className="font-bold text-slate-800 text-sm">{receipt.paymentMode}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 block">Course / Batch Enrolled</span>
              <span className="font-extrabold text-[#0a0e2a] text-sm">{receipt.courseName}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Payment Type</span>
              <span className="font-bold text-[#0056b3]">{receipt.paymentType}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Verification Status</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified & Paid
              </span>
            </div>
          </div>

          {/* Total Box */}
          <div className="p-5 rounded-2xl bg-blue-50/90 border border-blue-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0056b3] block">
                Total Amount Received
              </span>
              <p className="text-xs text-slate-600 mt-0.5">
                {receipt.remarks || 'Thank you for your payment at C.G.A Udaipur.'}
              </p>
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0a0e2a]">
              ₹{receipt.amount.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-[#0056b3]" /> Authorized by C.G.A Accounts Wing,
              Udaipur
            </span>
            <span>Computer Generated Receipt</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100 no-print">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print Receipt
            </button>
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0056b3] text-white hover:bg-[#1e3a8a] cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
