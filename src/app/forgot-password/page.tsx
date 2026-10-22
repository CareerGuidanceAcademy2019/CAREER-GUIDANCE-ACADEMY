'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Mail,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { cgaService } from '@/services/cgaService';

export default function ForgotPasswordPage() {
  const [activeTab, setActiveTab] = useState<'email' | 'direct'>('email');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [error, setError] = useState('');

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Bot honeypot trap
    if (honeypot) {
      setSent(true);
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
    } catch {
      // Suppress backend details
    } finally {
      setBusy(false);
      setSent(true);
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

          {/* Recovery Method Tabs */}
          <div className="flex rounded-2xl bg-slate-100 p-1 gap-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('email');
                setError('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'email'
                  ? 'bg-[#0056b3] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email Reset Link</span>
            </button>
            <Link
              href="/reset-password"
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            >
              <Lock className="w-3.5 h-3.5 text-[#ea580c]" />
              <span>Direct Reset</span>
            </Link>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs font-semibold text-[#dc2626]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!sent ? (
            <form onSubmit={handleRequest} className="space-y-4" noValidate>
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

              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your registered email address. We will email you an authenticated recovery link to set a new password.
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
                  placeholder="e.g. yourname@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] disabled:opacity-60 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {busy ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending Reset Link…</span>
                  </>
                ) : (
                  <span>Send Recovery Email</span>
                )}
              </button>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-amber-950">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#ea580c]" /> Need Immediate Access?
                </span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  You can bypass email delivery by using our{' '}
                  <Link href="/reset-password" className="font-bold underline text-[#0056b3]">
                    Instant Direct Reset
                  </Link>{' '}
                  with your registered mobile number or Student ID.
                </p>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-extrabold text-slate-900">Recovery Email Dispatched</h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  If an account exists for <strong>{email}</strong>, a password reset link has been sent. Check your inbox and spam folder.
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <p className="text-[11px] text-slate-500">
                  Didn't receive an email or link expired?
                </p>
                <Link
                  href="/reset-password"
                  className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <span>Reset with Registered Phone / Student ID</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
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
              Direct Reset Page →
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter variant="auth" />
    </div>
  );
}
