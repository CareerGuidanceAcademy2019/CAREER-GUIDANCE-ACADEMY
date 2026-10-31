'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Clock, Sparkles, Play, CheckCircle2, AlertCircle, Eye, ArrowRight, RotateCcw } from 'lucide-react';

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
    attemptsAllowed?: number;
    attempts_allowed?: number;
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
  attemptCount?: number;
  attemptsAllowed?: number;
  onAppear: () => void;
  onEnrol: () => void;
  onViewSolutions?: () => void;
  className?: string;
}

export function AppearTestButton({
  test,
  isEnrolled,
  attempt,
  attemptCount,
  attemptsAllowed: propAttemptsAllowed,
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

  const isLaunchedStatus = ['published', 'launched', 'ready'].includes((test.status || '').toLowerCase());

  // 1. STATE: UNPUBLISHED / DRAFT
  // Immediately shows "Not Published by Academy" when admin unpublishes
  if (!isLaunchedStatus) {
    return (
      <div className={`space-y-1.5 ${className}`}>
        <button
          type="button"
          disabled
          className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 text-xs font-bold inline-flex items-center justify-center gap-2 cursor-not-allowed"
        >
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>Not Published by Academy</span>
        </button>
      </div>
    );
  }

  // 2. STATE: LOCKED (NOT ENROLLED)
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

  // Calculate attempts completed and max attempts allowed
  const maxAttempts = propAttemptsAllowed || test.attemptsAllowed || test.attempts_allowed || 1;
  const count = attemptCount !== undefined ? attemptCount : (isSubmitted ? 1 : 0);
  const canRetake = count > 0 && count < maxAttempts;

  // 3. STATE: ATTEMPTED
  if (count > 0 || isSubmitted) {
    const score = attempt?.score ?? 0;
    const total = attempt?.totalMarks || attempt?.total_marks || test.totalMarks || test.total_marks || 30;
    const acc = attempt?.accuracy !== undefined ? `${attempt.accuracy}%` : '';

    if (canRetake) {
      return (
        <div className={`space-y-2 ${className}`}>
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-extrabold text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-blue-600" />
              <span>Score: {score} / {total} {acc ? `(${acc})` : ''}</span>
            </span>
            <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              Attempt {count} of {maxAttempts}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onAppear}
              className="w-full py-2.5 px-3 rounded-xl bg-[#0056b3] hover:bg-blue-700 text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake ({count + 1}/{maxAttempts})</span>
            </button>
            <button
              type="button"
              onClick={onViewSolutions}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <Eye className="w-3.5 h-3.5 text-slate-600" />
              <span>Scorecard</span>
            </button>
          </div>
        </div>
      );
    }

    // Exhausted all allowed attempts
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between text-xs px-1">
          <span className="font-extrabold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Score: {score} / {total} {acc ? `(${acc})` : ''}</span>
          </span>
          <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Attempted ({count}/{maxAttempts})
          </span>
        </div>

        <button
          type="button"
          onClick={onViewSolutions}
          className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs"
        >
          <Eye className="w-3.5 h-3.5 text-emerald-700" />
          <span>View Results &amp; Solutions</span>
        </button>
      </div>
    );
  }

  // 4. STATE: UPCOMING (BEFORE START TIME)
  const isBeforeStart = winStart ? now < winStart : false;
  if (isBeforeStart && winStart) {
    const diffMs = winStart - now;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    let countdownLabel = '';
    if (days > 0) {
      countdownLabel = `Starts in ${days}d ${hours}h`;
    } else if (hours > 0) {
      countdownLabel = `Starts in ${hours}h ${mins}m`;
    } else {
      countdownLabel = `Starts in ${Math.max(1, mins)}m`;
    }

    return (
      <div className={`space-y-1.5 ${className}`}>
        <button
          type="button"
          disabled
          className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 text-xs font-bold inline-flex items-center justify-center gap-2 cursor-not-allowed"
        >
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Upcoming — {countdownLabel}</span>
        </button>
      </div>
    );
  }

  // 5. STATE: CLOSED / MISSED
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

  // 6. STATE: LIVE (APPEAR OR RESUME)
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
