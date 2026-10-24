'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Mail,
  ShieldCheck,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { cgaService } from '@/services/cgaService';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';
import { evaluatePasswordStrength } from '@/lib/passwordPolicy';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'request' | 'verify' | 'success'>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Send OTP to email
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (honeypot) {
      setStep('verify');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid registered email address.');
      return;
    }

    setBusy(true);
    try {
      const res = await cgaService.requestPasswordReset(email.trim().toLowerCase());
      if (res && !res.success && res.error) {
        setError(res.error);
        setBusy(false);
        return;
      }
      setResendCooldown(60);
      setStep('verify');
    } catch {
      // Proceed to verify step to avoid leaking account existence
      setStep('verify');
    } finally {
      setBusy(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || busy) return;
    setError('');
    setBusy(true);
    try {
      await cgaService.requestPasswordReset(email.trim().toLowerCase());
      setResendCooldown(60);
    } catch {} finally {
      setBusy(false);
    }
  };

  // Step 2: Verify OTP and set new password
  const handleVerifyOtpAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanOtp = otp.replace(/\D/g, '').trim();
    if (cleanOtp.length < 6) {
      setError('Please enter the full 6-digit OTP code sent to your email.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    const strength = evaluatePasswordStrength(newPassword);
    if (!strength.isValid && newPassword.length < 10) {
      setError(strength.feedback[0] || 'Please create a stronger password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setBusy(true);
    try {
      const res = await cgaService.verifyRecoveryOtp(
        email.trim().toLowerCase(),
        cleanOtp,
        newPassword
      );

      if (!res.success) {
        setError(res.error || 'Invalid or expired OTP code. Please check your email or request a new one.');
        setBusy(false);
        return;
      }

      setStep('success');
    } catch (err: any) {
      setError(err?.message || 'Failed to update password. Please try again.');
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
            <img
              src="/cga-logo.png"
              alt="C.G.A Logo"
              className="w-12 h-12 rounded-full object-contain border border-slate-200 p-0.5"
            />
            <div>
              <h1 className="text-xl font-extrabold text-[#0a0e2a]">Password Recovery</h1>
              <p className="text-xs text-slate-500">Career Guidance Academy (C.G.A)</p>
            </div>
          </div>

          {/* Stepper Indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`flex-1 h-1.5 rounded-full transition-all ${
                step === 'request' ? 'bg-[#0056b3]' : 'bg-emerald-500'
              }`}
            />
            <div
              className={`flex-1 h-1.5 rounded-full transition-all ${
                step === 'verify' ? 'bg-[#0056b3]' : step === 'success' ? 'bg-emerald-500' : 'bg-slate-200'
              }`}
            />
            <div
              className={`flex-1 h-1.5 rounded-full transition-all ${
                step === 'success' ? 'bg-emerald-500' : 'bg-slate-200'
              }`}
            />
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs font-semibold text-[#dc2626]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'request' && (
            <form onSubmit={handleRequestOtp} className="space-y-4" noValidate>
              {/* Bot honeypot trap field */}
              <div style={{ position: 'absolute', left: '-9999px', opacity: 0 }} aria-hidden="true">
                <input
                  type="text"
                  name="user_verification_trap"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <h2 className="text-sm font-bold text-slate-800">Step 1: Request Security OTP</h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter your registered email address. We will send a 6-digit one-time password (OTP) directly to your inbox.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. yourname@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                    autoComplete="email"
                    required
                  />
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
                    <span>Sending Security OTP…</span>
                  </>
                ) : (
                  <>
                    <span>Send Recovery OTP to Email</span>
                  </>
                )}
              </button>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-amber-950">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#ea580c]" /> Prefer Direct Phone Verification?
                </span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  You can also use our{' '}
                  <Link href="/reset-password" className="font-bold underline text-[#0056b3]">
                    Instant Direct Reset
                  </Link>{' '}
                  with your registered mobile number or Student ID.
                </p>
              </div>
            </form>
          )}

          {step === 'verify' && (
            <form onSubmit={handleVerifyOtpAndReset} className="space-y-4" noValidate>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-800">Step 2: Enter OTP &amp; New Password</h2>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('request');
                      setError('');
                    }}
                    className="text-xs text-[#0056b3] font-bold hover:underline"
                  >
                    Change Email
                  </button>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  We sent a 6-digit OTP to <strong>{email}</strong>. Enter the OTP code below to set your new password.
                </p>
              </div>

              {/* 6-digit OTP input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    6-Digit Security OTP Code
                  </label>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || busy}
                    className="text-xs text-[#0056b3] font-bold hover:underline disabled:text-slate-400 disabled:no-underline"
                  >
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="recovery-otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit code"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                    autoComplete="one-time-code"
                    required
                  />
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Create New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrengthMeter password={newPassword} />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                    autoComplete="new-password"
                    required
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
                    <span>Verifying OTP &amp; Updating…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Verify OTP &amp; Create New Password</span>
                  </>
                )}
              </button>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-extrabold text-slate-900">Password Changed Successfully!</h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your new password has been verified and updated in our secure database. You can now log in using your email address or your 10-digit mobile number with your new password.
                </p>
              </div>

              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-1.5 w-full py-3 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-sm font-bold shadow-md transition-all cursor-pointer"
              >
                <span>Proceed to Sign In</span>
              </Link>
            </div>
          )}

          {/* Navigation Links */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 hover:text-[#0056b3]"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
            <Link href="/reset-password" className="text-[#0056b3] hover:underline">
              Direct Reset →
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter variant="auth" />
    </div>
  );
}
