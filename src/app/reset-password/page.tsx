'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { cgaService } from '@/services/cgaService';

import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';
import { evaluatePasswordStrength } from '@/lib/passwordPolicy';

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  // The emailed link signs the user into a short-lived recovery session.
  useEffect(() => {
    const sb = cgaService.client();
    sb.auth.getSession().then(({ data }) => setReady(!!data.session));
    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const strength = evaluatePasswordStrength(password);
    if (!strength.isValid) {
      return setError(strength.feedback[0] || 'Password must be at least 10 characters and cannot be a common phrase.');
    }
    if (password !== confirm) return setError('Passwords do not match.');
    setBusy(true);
    const res = await cgaService.updatePassword(password);
    setBusy(false);
    if (!res.success) return setError(res.error || 'Could not update password.');
    await cgaService.logout();
    setDone(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicHeader />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
          <h1 className="text-xl font-extrabold text-[#0a0e2a] mb-1">Set a New Password</h1>
          <p className="text-xs text-slate-500 mb-6">Career Guidance Academy (C.G.A)</p>

          {done ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <p className="text-sm text-slate-700">Your password has been updated.</p>
              <Link
                href="/login"
                className="inline-block w-full py-3 rounded-xl bg-[#0056b3] text-white font-bold text-sm"
              >
                Return to Login
              </Link>
            </div>
          ) : !ready ? (
            <p className="text-sm text-slate-600">
              This reset link is invalid or has expired.{' '}
              <Link href="/forgot-password" className="font-bold text-[#0056b3] underline">
                Request a new one
              </Link>
              .
            </p>
          ) : (
            <form onSubmit={submit} className="space-y-4" noValidate>
              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs font-semibold text-[#dc2626]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password (minimum 10 characters)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                />
                <PasswordStrengthMeter password={password} />
              </div>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
              />
              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] disabled:opacity-60 text-white font-bold text-sm cursor-pointer"
              >
                {busy ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
