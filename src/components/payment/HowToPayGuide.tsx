'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  QrCode,
  ShieldCheck,
  Lock,
  FileCheck,
  AlertTriangle,
  HelpCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Languages,
  Smartphone,
  Info,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { PAYMENT_SETTINGS, PaymentSettingsRecord } from '@/config/paymentSettings';
import { getHowToPayContent } from '@/content/howToPayContent';

interface HowToPayGuideProps {
  settings?: PaymentSettingsRecord;
  compact?: boolean;
  defaultOpen?: boolean;
}

export function HowToPayGuide({
  settings = PAYMENT_SETTINGS,
  compact = false,
  defaultOpen = false,
}: HowToPayGuideProps) {
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [selectedApp, setSelectedApp] = useState<number>(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(defaultOpen || !compact);
  const [copiedUtr, setCopiedUtr] = useState(false);

  const content = getHowToPayContent(settings)[lang];

  const handleCopySample = () => {
    navigator.clipboard.writeText('123456789012');
    setCopiedUtr(true);
    setTimeout(() => setCopiedUtr(false), 2000);
  };

  const getStepIcon = (iconName: string) => {
    switch (iconName) {
      case 'CheckCircle2':
        return <CheckCircle2 className="w-5 h-5 text-blue-600" />;
      case 'QrCode':
        return <QrCode className="w-5 h-5 text-purple-600" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
      case 'Lock':
        return <Lock className="w-5 h-5 text-amber-600" />;
      case 'FileCheck':
      default:
        return <FileCheck className="w-5 h-5 text-indigo-600" />;
    }
  };

  const bodyContent = (
    <div className="space-y-8 text-slate-800">
      {/* Language Toggle Bar */}
      <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Languages className="w-4 h-4 text-[#0056b3]" />
          <span>{content.langToggleLabel}</span>
        </div>
        <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              lang === 'en'
                ? 'bg-[#0056b3] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLang('bn')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              lang === 'bn'
                ? 'bg-[#0056b3] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            বাংলা
          </button>
        </div>
      </div>

      {/* 1. Pay in 5 Steps */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0056b3] text-white text-xs font-black">
              1
            </span>
            {content.stepsHeading}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{content.stepsSubheading}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {content.steps.map((st) => (
            <div
              key={st.number}
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between space-y-2 hover:border-blue-300 transition-colors"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#0056b3] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                    Step {st.number}
                  </span>
                  <div className="p-1.5 rounded-lg bg-slate-50">{getStepIcon(st.icon)}</div>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{st.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{st.description}</p>
              </div>

              {st.warning && (
                <div className="pt-2 border-t border-slate-100 text-[11px] font-medium text-amber-800 bg-amber-50/80 p-2 rounded-lg flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{st.warning}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 2. What is a UTR? Panel */}
      <section className="p-5 sm:p-6 rounded-3xl bg-blue-50/70 border border-blue-200 space-y-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#0056b3]" />
            {content.utrHeading}
          </h2>
          <p className="text-xs text-slate-700 mt-1 leading-relaxed">{content.utrDescription}</p>
        </div>

        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>{content.utrWarning}</span>
        </div>

        {/* Tabbed App Guide */}
        <div className="space-y-3 pt-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Select Your Payment App to See Exactly Where UTR is Found:
          </span>
          <div className="flex flex-wrap gap-2">
            {content.utrApps.map((app, idx) => (
              <button
                key={app.name}
                type="button"
                onClick={() => setSelectedApp(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedApp === idx
                    ? 'bg-[#0056b3] text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {app.name}
              </button>
            ))}
          </div>

          <div className="bg-white p-4 rounded-2xl border border-blue-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#0056b3]">
                {content.utrApps[selectedApp].name}
              </span>
              <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                Label: &quot;{content.utrApps[selectedApp].labelOnScreen}&quot;
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {content.utrApps[selectedApp].location}
            </p>
            <p className="text-[11px] text-slate-500 italic">
              💡 {content.utrApps[selectedApp].notes}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Visual Example (Mock Screen + Form with Ribbon) */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">{content.exampleTitle}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{content.exampleExplanation}</p>
        </div>

        <div className="relative rounded-3xl border-2 border-dashed border-amber-300 bg-amber-50/40 p-5 sm:p-7 overflow-hidden">
          {/* Example Only Ribbon */}
          <div className="absolute -right-12 top-6 rotate-45 bg-amber-500 text-white font-extrabold text-[10px] tracking-wider py-1 px-14 shadow-sm uppercase">
            {content.exampleRibbon}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Left: Mock Payment App Screen (CSS/SVG only) */}
            <div className="bg-white rounded-3xl p-5 shadow-md border border-slate-200 max-w-sm mx-auto w-full space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-400">Mobile Bank App</span>
                <span className="text-[11px] font-semibold text-slate-500">
                  {content.mockScreen.date}
                </span>
              </div>

              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center font-bold">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h4 className="text-sm font-extrabold text-slate-900">
                  {content.mockScreen.title}
                </h4>
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  {content.mockScreen.amount}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  Paid to {content.mockScreen.recipient}
                </p>
              </div>

              {/* Highlighted UTR Line with Arrow */}
              <div className="p-3 rounded-2xl bg-amber-100/70 border-2 border-amber-400 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-900 uppercase block">
                      {content.mockScreen.utrLabel}
                    </span>
                    <strong className="text-sm font-mono font-black text-slate-900 tracking-wider">
                      {content.mockScreen.utrValue}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopySample}
                    className="p-1.5 rounded-lg bg-white border border-amber-300 text-xs font-bold text-slate-700 hover:bg-amber-50 flex items-center gap-1 cursor-pointer"
                    title="Copy sample"
                  >
                    {copiedUtr ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </button>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-amber-800">
                  <span>←</span> {content.mockScreen.arrowText}
                </div>
              </div>

              <div className="text-[11px] text-center text-slate-400">
                {content.mockScreen.status}
              </div>
            </div>

            {/* Right: Matching Filled Form */}
            <div className="bg-white rounded-3xl p-5 shadow-md border border-slate-200 max-w-sm mx-auto w-full space-y-3.5">
              <span className="text-xs font-extrabold text-[#0056b3] uppercase tracking-wider block">
                {content.mockForm.heading}
              </span>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {content.mockForm.utrFieldLabel}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value="123456789012"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-emerald-500 bg-emerald-50/40 text-sm font-mono font-bold text-slate-900"
                  />
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
                <span className="text-[10px] font-medium text-emerald-700 mt-1 block">
                  ✓ Exactly 12 digits matched
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {content.mockForm.proofFieldLabel}
                </label>
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-600 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-[#0056b3]" />
                  <span>screenshot_payment_499.jpg (Uploaded)</span>
                </div>
              </div>

              <button
                type="button"
                disabled
                className="w-full py-2.5 rounded-xl bg-[#0056b3] text-white text-xs font-bold shadow-xs cursor-default"
              >
                {content.mockForm.submitButton}
              </button>
              <p className="text-[11px] text-center text-slate-500 italic">
                {content.mockForm.helperText}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Good Screenshot vs Bad Screenshot */}
      <section className="space-y-4">
        <h2 className="text-base font-extrabold text-slate-900">{content.screenshotsHeading}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* DO */}
          <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2.5">
            <h4 className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {content.doListTitle}
            </h4>
            <ul className="space-y-1.5 text-xs text-emerald-950">
              {content.dos.map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* DON'T */}
          <div className="p-5 rounded-2xl bg-red-50/80 border border-red-200 space-y-2.5">
            <h4 className="text-xs font-extrabold text-red-900 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              {content.dontListTitle}
            </h4>
            <ul className="space-y-1.5 text-xs text-red-950">
              {content.donts.map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-red-600 font-bold">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 5. FAQ Accordion */}
      <section className="space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[#0056b3]" />
          {content.faqHeading}
        </h2>
        <div className="space-y-2">
          {content.faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 hover:bg-slate-50 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#0056b3] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );

  if (compact) {
    return (
      <div className="rounded-2xl border border-blue-200 bg-blue-50/40 overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="w-full p-3.5 text-left flex items-center justify-between gap-3 text-xs font-bold text-[#0056b3] hover:bg-blue-100/50 cursor-pointer transition-colors"
        >
          <span className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#0056b3]" />
            <span>How to pay &amp; find your 12-digit UTR? (পেমেন্ট গাইড)</span>
          </span>
          <span className="text-[11px] underline flex items-center gap-1 font-semibold">
            {isPanelOpen ? 'Hide Guide' : 'Show Step-by-Step Guide'}
            {isPanelOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        </button>

        {isPanelOpen && <div className="p-4 sm:p-6 bg-white border-t border-blue-100">{bodyContent}</div>}
      </div>
    );
  }

  return bodyContent;
}
