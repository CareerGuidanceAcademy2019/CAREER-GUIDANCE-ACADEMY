'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useCga } from '@/context/CgaContext';

export function ToastContainer() {
  const { toasts, dismissToast } = useCga();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-md w-full px-4 sm:px-0 pointer-events-none"
    >
      {toasts.map((t) => {
        const isError = t.type === 'error';
        const borderStyles = isError
          ? 'border-l-4 border-l-red-600 border-red-200 bg-white ring-1 ring-red-500/20'
          : 'border-l-4 border-l-emerald-600 border-emerald-200 bg-white ring-1 ring-emerald-500/20';

        return (
          <div
            key={t.id}
            className={`${borderStyles} pointer-events-auto rounded-xl shadow-xl border p-4 flex items-start gap-3 transition-all duration-200`}
          >
            {isError ? (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            ) : t.type === 'info' ? (
              <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${isError ? 'text-red-950' : 'text-slate-900'}`}>{t.title}</p>
              {t.message && <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{t.message}</p>}
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
