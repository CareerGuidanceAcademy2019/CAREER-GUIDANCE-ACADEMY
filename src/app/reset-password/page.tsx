'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { cgaService } from '@/services/cgaService';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';
import { evaluatePasswordStrength } from '@/lib/passwordPolicy';

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [isExchanging, setIsExchanging] = useState(true);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  // Fallback direct verification fields (for users without email link or expired links)
  const [directMethod, setDirectMethod] = useState<'otp' | 'phone'>('otp');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneOrCode, setPhoneOrCode] = useState('');

  // Handle Supabase recovery links (both PKCE ?code= and implicit #access_token=)
  useEffect(() => {
    let isMounted = true;
    const sb = cgaService.client();

    async function initRecovery() {
      if (typeof window === 'undefined') return;

      // 1. Check if PKCE code is present in the URL query string
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        try {
          const { data, error: exchangeErr } = await sb.auth.exchangeCodeForSession(code);
          if (!exchangeErr && data?.session && isMounted) {
            setReady(true);
            setIsExchanging(false);
            return;
          }
        } catch {
          // Fall through to checking session
        }
      }

      // 2. Check existing active session (recovery session)
      try {
        const { data } = await sb.auth.getSession();
        if (data?.session && isMounted) {
          setReady(true);
          setIsExchanging(false);
          return;
        }
      } catch {}

      if (isMounted) {
        setIsExchanging(false);
      }
    }

    initRecovery();

    // 3. Listen for PASSWORD_RECOVERY auth state changes
    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setReady(true);
        setIsExchanging(false);
      }
    });

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Submit password update with active recovery session
  const handleSubmitSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    const strength = evaluatePasswordStrength(password);
    if (!strength.isValid && password.length < 10) {
      setError(strength.feedback[0] || 'Please choose a stronger password.');
      return;
    }

    if (password !== confirm) {
      setError('New password and confirm password do not match.');
      return;
    }

    setBusy(true);
    try {
      const res = await cgaService.updatePassword(password);
      if (!res.success) {
        setError(res.error || 'Could not update password. Please try the verified reset option below.');
        setBusy(false);
        return;
      }

      await cgaService.logout().catch(() => {});
      setDone(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to update password.');
    } finally {
      setBusy(false);
    }
  };

  // Submit direct verified password reset (bypasses broken email links)
  const handleSubmitVerified = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter your registered email address.');
      return;
    }

    if (directMethod === 'otp') {
      const cleanOtp = otp.replace(/\D/g, '').trim();
      if (cleanOtp.length < 6) {
        setError('Please enter the 6-digit OTP code sent to your email.');
        return;
      }
    } else {
      if (!phoneOrCode.trim()) {
        setError('Please enter your registered 10-digit phone number or Student ID code for verification.');
        return;
      }
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    const strength = evaluatePasswordStrength(password);
    if (!strength.isValid && password.length < 10) {
      setError(strength.feedback[0] || 'Please create a stronger password.');
      return;
    }

    if (password !== confirm) {
      setError('New password and confirm password do not match.');
      return;
    }

    setBusy(true);
    try {
      if (directMethod === 'otp') {
        const cleanOtp = otp.replace(/\D/g, '').trim();
        const res = await cgaService.verifyRecoveryOtp(
          email.trim().toLowerCase(),
          cleanOtp,
          password
        );

        if (!res.success) {
          setError(res.error || 'Invalid or expired OTP code. Please check your email.');
          setBusy(false);
          return;
        }
      } else {
        const resp = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            phoneOrCode: phoneOrCode.trim(),
            newPassword: password,
          }),
        });

        const data = await resp.json().catch(() => ({}));

        if (!resp.ok || !data.success) {
          setError(data.error || 'Identity verification failed. Please check your credentials or contact admissions.');
          setBusy(false);
          return;
        }
      }

      setDone(true);
    } catch {
      setError('Network error. Please try again or contact the C.G.A helpline.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicHeader variant="auth" />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#0056b3] text-white flex items-center justify-center shadow-md shrink-0">
              <KeyRound className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#0a0e2a]">Set a New Password</h1>
              <p className="text-xs text-slate-500">Career Guidance Academy (C.G.A)</p>
            </div>
          </div>

          {/* Success Confirmation */}
          {done ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-extrabold text-slate-900">Password Updated Successfully!</h2>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Your account password has been safely updated. You can now log in using your new credentials.
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full py-3 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                Sign In to Your Account
              </Link>
            </div>
          ) : isExchanging ? (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#0056b3] animate-spin mx-auto" />
              <p className="text-xs text-slate-600 font-medium">Verifying secure recovery link…</p>
            </div>
          ) : ready ? (
            /* Mode 1: Active Recovery Session via Email Link */
            <form onSubmit={handleSubmitSession} className="space-y-4" noValidate>
              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 flex items-start gap-2 text-xs text-blue-900">
                <ShieldCheck className="w-4 h-4 text-[#0056b3] shrink-0 mt-0.5" />
                <span>
                  Recovery session authenticated. Create a strong new password to secure your account.
                </span>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs font-semibold text-[#dc2626]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter at least 8 characters"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3] pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrengthMeter password={password} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3] pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] disabled:opacity-60 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {busy ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Updating Password…</span>
                  </>
                ) : (
                  <span>Update Password &amp; Save</span>
                )}
              </button>
            </form>
          ) : (
            /* Mode 2: Direct Verified Reset (Never leaves user stuck if link expired or no email sent) */
            <form onSubmit={handleSubmitVerified} className="space-y-4" noValidate>
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-amber-950">
                  <Lock className="w-3.5 h-3.5 text-[#ea580c]" /> Instant Verified Password Reset
                </span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Reset your password immediately by verifying your registered email and mobile number or student ID.
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs font-semibold text-[#dc2626]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex rounded-2xl bg-slate-100 p-1 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setDirectMethod('otp');
                    setError('');
                  }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    directMethod === 'otp'
                      ? 'bg-[#0056b3] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Email 6-Digit OTP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDirectMethod('phone');
                    setError('');
                  }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    directMethod === 'phone'
                      ? 'bg-[#0056b3] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Phone / Student ID
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Registered Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. yourname@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                  autoComplete="email"
                />
              </div>

              {directMethod === 'otp' ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">6-Digit Security OTP Code</label>
                    <Link href="/forgot-password" className="text-[11px] text-[#0056b3] font-bold hover:underline">
                      Need a code? Request here
                    </Link>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit OTP code"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Registered 10-Digit Mobile No. or Student ID
                  </label>
                  <input
                    type="text"
                    value={phoneOrCode}
                    onChange={(e) => setPhoneOrCode(e.target.value)}
                    placeholder="e.g. 9876543210 or CGA-2026-001"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter at least 8 characters"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3] pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrengthMeter password={password} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3] pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] disabled:opacity-60 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {busy ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying &amp; Updating…</span>
                  </>
                ) : (
                  <span>Verify Credentials &amp; Reset Password</span>
                )}
              </button>
            </form>
          )}

          {/* Navigation Links */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
            <Link href="/login" className="hover:text-[#0056b3] inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
            <Link href="/forgot-password" className="text-[#0056b3] hover:underline">
              Request Email Link
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter variant="auth" />
    </div>
  );
}
