'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Clock, Sparkles, Play, CheckCircle2, AlertCircle, Eye, ArrowRight } from 'lucide-react';

export interface AppearTestButtonProps {
  test: {
    id: string;
    title: string;
    status: string;
    windowStart?: string | null;
    windowEnd?: string | null;
    window_start?: string | null;
    window_end?: string | null;
    scheduledDate?: string | null;
    showSolutions?: 'after_submit' | 'after_window';
    show_solutions?: 'after_submit' | 'after_window';
    totalMarks?: number;
    total_marks?: number;
  };
  isEnrolled: boolean;
  attempt?: {
    id: string;
    score: number;
    totalMarks?: number;
    total_marks?: number;
    accuracy?: number;
    submittedAt?: string | null;
    submitted_at?: string | null;
  } | null;
  onAppear: () => void;
  onEnrol: () => void;
  onViewSolutions?: () => void;
  className?: string;
}

export function AppearTestButton({
  test,
  isEnrolled,
  attempt,
  onAppear,
  onEnrol,
  onViewSolutions,
  className = '',
}: AppearTestButtonProps) {
  const [now, setNow] = useState<number>(Date.now());

  // Update clock every 10 seconds for active countdowns
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const winStartStr = test.windowStart || test.window_start;
  const winEndStr = test.windowEnd || test.window_end;
  const winStart = winStartStr ? new Date(winStartStr).getTime() : null;
  const winEnd = winEndStr ? new Date(winEndStr).getTime() : null;

  const isSubmitted = Boolean(attempt?.submittedAt || attempt?.submitted_at);
  const isInProgress = Boolean(attempt && !isSubmitted);

  // 1. STATE: LOCKED
  if (!isEnrolled) {
    return (
      <div className={`space-y-1.5 ${className}`}>
        <button
          type="button"
          onClick={onEnrol}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200 hover:border-amber-300 text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs"
        >
          <Lock className="w-3.5 h-3.5 text-amber-600" />
          <span>Locked - Enrol to Access</span>
        </button>
      </div>
    );
  }

  // 2. STATE: ATTEMPTED
  if (isSubmitted) {
    const score = attempt?.score ?? 0;
    const total = attempt?.totalMarks || attempt?.total_marks || test.totalMarks || test.total_marks || 30;
    const acc = attempt?.accuracy !== undefined ? `${attempt.accuracy}%` : '';

    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between text-xs px-1">
          <span className="font-extrabold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Score: {score} / {total} {acc ? `(${acc})` : ''}</span>
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attempted</span>
        </div>

        <button
          type="button"
          onClick={onViewSolutions || onAppear}
          className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs"
        >
          <Eye className="w-3.5 h-3.5 text-emerald-700" />
          <span>View Results &amp; Solutions</span>
        </button>
      </div>
    );
  }

  // 3. STATE: UPCOMING
  const isLaunchedStatus = test.status === 'launched';
  const isBeforeStart = winStart ? now < winStart : !isLaunchedStatus;

  if (isBeforeStart) {
    let countdownLabel = 'Upcoming';
    if (winStart) {
      const diffMs = winStart - now;
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      if (days > 0) {
        countdownLabel = `Starts in ${days}d ${hours}h`;
      } else if (hours > 0) {
        countdownLabel = `Starts in ${hours}h ${mins}m`;
      } else {
        countdownLabel = `Starts in ${Math.max(1, mins)}m`;
      }
    } else if (test.scheduledDate) {
      countdownLabel = `Scheduled: ${test.scheduledDate}`;
    } else {
      countdownLabel = 'Scheduled soon';
    }

    return (
      <div className={`space-y-1.5 ${className}`}>
        <button
          type="button"
          disabled
          className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 text-xs font-bold inline-flex items-center justify-center gap-2 cursor-not-allowed"
        >
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Upcoming - {countdownLabel}</span>
        </button>
      </div>
    );
  }

  // 4. STATE: CLOSED / MISSED
  const isAfterEnd = winEnd ? now > winEnd : test.status === 'closed';

  if (isAfterEnd) {
    return (
      <div className={`space-y-1.5 ${className}`}>
        {onViewSolutions ? (
          <button
            type="button"
            onClick={onViewSolutions}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs"
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Closed / Missed — View Solutions</span>
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 text-xs font-bold inline-flex items-center justify-center gap-2 cursor-not-allowed"
          >
            <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Closed / Missed</span>
          </button>
        )}
      </div>
    );
  }

  // 5. STATE: LIVE (APPEAR OR RESUME)
  return (
    <div className={`space-y-1.5 ${className}`}>
      <button
        type="button"
        onClick={onAppear}
        className={`w-full py-2.5 px-4 rounded-xl text-white text-xs font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all ${
          isInProgress
            ? 'bg-emerald-600 hover:bg-emerald-700 animate-pulse'
            : 'bg-[#0056b3] hover:bg-blue-700'
        }`}
      >
        {isInProgress ? <Play className="w-3.5 h-3.5 fill-current" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
        <span>{isInProgress ? 'Resume Test' : 'Appear Test'}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
