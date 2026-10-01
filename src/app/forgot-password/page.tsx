'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { KeyRound, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { cgaService } from '@/services/cgaService';
import { DEMO_CREDENTIALS } from '@/data/initialSeedData';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'EMAIL' | 'OTP' | 'SUCCESS'>('EMAIL');
  const [email, setEmail] = useState(DEMO_CREDENTIALS.student.email);
  const [otp, setOtp] = useState('240826');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid registered email address.');
      return;
    }
    setStep('OTP');
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otp.trim() !== '240826') {
      setError('Invalid verification code. Use demo OTP: 240826');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    const res = cgaService.resetPassword(email, newPassword);
    if (!res.success) {
      setError(res.error || 'Could not reset password.');
      return;
    }
    setStep('SUCCESS');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicHeader />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-6">
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

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs font-semibold text-[#dc2626]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'EMAIL' && (
            <form onSubmit={handleRequestOtp} className="space-y-4" noValidate>
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your registered student email address to receive a simulated 6-digit
                verification OTP.
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white font-bold text-sm cursor-pointer"
              >
                Send Verification OTP
              </button>
            </form>
          )}

          {step === 'OTP' && (
            <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-[#0056b3]">
                <strong>Simulated Demo OTP Sent:</strong> Use verification code{' '}
                <code className="font-extrabold underline">240826</code> for{' '}
                <strong>{email}</strong>.
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 chars)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white font-bold text-sm cursor-pointer"
              >
                Update Password
              </button>
            </form>
          )}

          {step === 'SUCCESS' && (
            <div className="text-center space-y-4 py-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h2 className="text-lg font-extrabold text-slate-900">Password Reset Successful!</h2>
              <p className="text-xs text-slate-600">
                Your password has been updated in this browser session. You can now sign in.
              </p>
              <Link
                href="/login"
                className="inline-block w-full py-3 rounded-xl bg-[#0056b3] text-white font-bold text-sm"
              >
                Return to Login
              </Link>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0056b3]"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
