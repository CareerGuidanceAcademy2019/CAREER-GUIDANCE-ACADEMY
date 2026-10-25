'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AlertTriangle, LogIn } from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { cgaService } from '@/services/cgaService';

/**
 * SessionHeartbeat
 *
 * Lightweight single-session sentinel:
 * - Runs ONLY on authenticated routes (/student, /admin, /faculty-portal).
 * - Zero execution / overhead on public pages.
 * - Checks session validity on tab focus/visibilitychange, and at a 45s interval.
 * - Backs off to 5m when the tab is hidden.
 * - Displays a non-dismissible modal if older session is invalidated:
 *   "You were signed out because your account was used on another device."
 */
export function SessionHeartbeat() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout } = useCga();
  const [isTerminated, setIsTerminated] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const lastCheckRef = useRef<number>(0);
  const isCheckingRef = useRef<boolean>(false);

  // Strictly gate to authenticated routes only
  const isProtectedRoute = Boolean(
    session &&
      pathname &&
      (pathname.startsWith('/student') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/faculty-portal'))
  );

  const checkSession = useCallback(async (force = false) => {
    if (!isProtectedRoute || isCheckingRef.current || isTerminated) return;
    const now = Date.now();
    // Throttle routine checks, but immediately execute on forced trigger (tab activation)
    if (!force && now - lastCheckRef.current < 3000) return;

    isCheckingRef.current = true;
    lastCheckRef.current = now;

    try {
      const active = await cgaService.isSessionActive();
      if (!active) {
        setIsTerminated(true);
      }
    } catch {
      // Fail-open on transient network hiccup
    } finally {
      isCheckingRef.current = false;
    }
  }, [isProtectedRoute, isTerminated]);

  useEffect(() => {
    if (!isProtectedRoute || isTerminated) return;

    // Initial check after page settles (1.5s)
    const initialTimer = setTimeout(() => {
      checkSession();
    }, 1500);

    // Heartbeat timers: 45s active tab, 5m hidden tab
    let intervalId: NodeJS.Timeout | null = null;

    const setupInterval = () => {
      if (intervalId) clearInterval(intervalId);
      const delay = document.hidden ? 300000 : 45000;
      intervalId = setInterval(() => checkSession(false), delay);
    };

    const handleVisibility = () => {
      if (!document.hidden) {
        // Tab became active again: immediately re-verify session
        checkSession(true);
      }
      setupInterval();
    };

    const handleFocus = () => {
      checkSession(true);
    };

    setupInterval();
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearTimeout(initialTimer);
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isProtectedRoute, isTerminated, checkSession]);

  const handleLoginAgain = async () => {
    setIsBusy(true);
    try {
      await logout();
    } catch {}
    router.push('/login?reason=other_device');
  };

  if (!isProtectedRoute || !isTerminated) {
    return null;
  }

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="other-device-title"
      aria-describedby="other-device-desc"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 id="other-device-title" className="text-xl font-extrabold text-[#0a0e2a]">
            Signed Out on This Device
          </h2>
          <p id="other-device-desc" className="text-sm text-slate-600 leading-relaxed">
            You were signed out because your account was used on another device.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            id="other-device-login-btn"
            disabled={isBusy}
            onClick={handleLoginAgain}
            className="w-full py-3 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <LogIn className="w-4 h-4" />
            <span>{isBusy ? 'Redirecting…' : 'Log in again'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
