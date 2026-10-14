'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { cgaService } from '@/services/cgaService';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid registered email address.');
      return;
    }
    setBusy(true);
    const res = await cgaService.requestPasswordReset(email);
    setBusy(false);
    if (!res.success) {
      setError(res.error || 'Could not send reset email.');
      return;
    }
    setSent(true);
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

          {!sent ? (
            <form onSubmit={handleRequest} className="space-y-4" noValidate>
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your registered email address. We will email you a secure link to set a new
                password.
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Registered Email Address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] disabled:opacity-60 text-white font-bold text-sm cursor-pointer"
              >
                {busy ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h2 className="text-lg font-extrabold text-slate-900">Check your inbox</h2>
              <p className="text-xs text-slate-600">
                If an account exists for <strong>{email}</strong>, a password reset link has been
                sent. The link expires shortly, so please use it soon.
              </p>
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
