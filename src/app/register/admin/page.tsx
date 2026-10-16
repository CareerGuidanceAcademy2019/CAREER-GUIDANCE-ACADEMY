'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, AlertCircle, CheckCircle2, KeyRound, Eye, EyeOff } from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { useCga } from '@/context/CgaContext';
import { isEmail, normalizePhone } from '@/lib/names';

const inputCls =
  'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0e2a]';

export default function AdminActivatePage() {
  const router = useRouter();
  const { registerAdmin } = useCga();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.name.trim().length < 3) return setError('Please enter your full name.');
    if (!isEmail(form.email)) return setError('Please enter a valid email address.');
    if (!/^[6-9]\d{9}$/.test(normalizePhone(form.phone))) return setError('Please enter a valid 10-digit mobile number.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters long.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (!consentAgreed) return setError('Please review and accept the Administrative Terms & DPDP Data Protection obligations.');

    setBusy(true);
    const res = await registerAdmin({
      name: form.name,
      email: form.email,
      phone: normalizePhone(form.phone),
      password: form.password,
    });
    setBusy(false);
    if (!res.success) return setError(res.error || 'Could not activate admin access.');
    if (res.session?.role === 'ADMIN') return router.push('/admin/dashboard');
    if (res.needsEmailConfirmation) return setConfirmSent(true);
    setError('Account created, but administrator access was not granted. Please contact the institute owner.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicHeader />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-[#0a0e2a] text-white p-7">
            <ShieldCheck className="w-10 h-10 text-amber-400" />
            <h1 className="text-2xl font-extrabold mt-3">Activate Administrator Access</h1>
            <p className="text-xs text-blue-100 mt-1 leading-relaxed">
              Only people whose email or mobile number is on the C.G.A <strong>admin access list</strong> can
              activate an admin account. Use the same email / mobile the institute registered for you.
            </p>
          </div>

          {confirmSent ? (
            <div className="p-8 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <p className="text-sm text-slate-600">
                We sent a confirmation link to <strong>{form.email}</strong>. Open it, then sign in on the Admin tab.
              </p>
              <Link href="/login?as=admin" className="inline-block w-full py-3 rounded-xl bg-[#0a0e2a] text-white font-bold text-sm">
                Go to Admin Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-7 space-y-4" noValidate>
              {error && (
                <div role="alert" className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs font-semibold text-[#dc2626]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
                  <span>{error}</span>
                </div>
              )}
              <div>
                <label htmlFor="adm-name" className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
                <input id="adm-name" value={form.name} onChange={set('name')} className={inputCls} placeholder="Your name" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="adm-email" className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                  <input id="adm-email" type="email" value={form.email} onChange={set('email')} className={inputCls} placeholder="admin@example.com" />
                </div>
                <div>
                  <label htmlFor="adm-phone" className="block text-xs font-bold text-slate-700 mb-1.5">Mobile Number</label>
                  <input id="adm-phone" type="tel" value={form.phone} onChange={set('phone')} className={inputCls} placeholder="98XXXXXXXX" />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 -mt-1">At least one of these must match the access list.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="adm-password" className="block text-xs font-bold text-slate-700 mb-1.5">Create Password</label>
                  <div className="relative">
                    <input
                      id="adm-password"
                      type={showPw ? 'text' : 'password'}
                      value={form.password}
                      onChange={set('password')}
                      className={`${inputCls} pr-11`}
                      placeholder="Min. 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="adm-confirm" className="block text-xs font-bold text-slate-700 mb-1.5">Confirm Password</label>
                  <input
                    id="adm-confirm"
                    type={showPw ? 'text' : 'password'}
                    value={form.confirm}
                    onChange={set('confirm')}
                    className={inputCls}
                    placeholder="Re-enter password"
                  />
                </div>
              </div>
              {/* Admin DPDP & Confidentiality Consent */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-start gap-2.5">
                  <input
                    id="adm-consent"
                    type="checkbox"
                    checked={consentAgreed}
                    onChange={(e) => setConsentAgreed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-[#0a0e2a] border-slate-300 focus:ring-[#0a0e2a] focus-visible:ring-2 focus-visible:ring-[#0a0e2a] cursor-pointer shrink-0"
                    required
                    aria-required="true"
                  />
                  <label
                    htmlFor="adm-consent"
                    className="text-xs text-slate-700 leading-relaxed cursor-pointer select-none"
                  >
                    <span className="font-semibold text-slate-900">Administrative Data Protection &amp; Confidentiality:</span>{' '}
                    As an authorized institute officer, I agree to handle all student data in strict compliance with India&apos;s DPDP Act, 2023, safeguard payment records, and abide by Career Guidance Academy&apos;s{' '}
                    <Link
                      href="/terms-and-conditions"
                      target="_blank"
                      className="text-[#0056b3] underline font-semibold hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-[#0056b3]"
                    >
                      Terms
                    </Link>{' '}
                    and{' '}
                    <Link
                      href="/privacy-policy"
                      target="_blank"
                      className="text-[#0056b3] underline font-semibold hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-[#0056b3]"
                    >
                      Privacy Policy
                    </Link>.
                  </label>
                </div>
              </div>

              <button
                id="adm-submit-btn"
                type="submit"
                disabled={busy}
                className="w-full py-3.5 rounded-xl bg-[#0a0e2a] hover:bg-[#1e2a5a] disabled:opacity-60 text-white font-bold text-sm shadow-md inline-flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a0e2a]"
                aria-label="Create Password and Enter Admin Panel"
              >
                <KeyRound className="w-4 h-4" />
                {busy ? 'Activating…' : 'Create Password & Enter Admin Panel'}
              </button>
              <p className="text-center text-xs text-slate-600">
                Already activated?{' '}
                <Link href="/login?as=admin" className="font-extrabold text-[#0056b3] hover:underline">
                  Sign in on the Admin tab
                </Link>
              </p>
            </form>
          )}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
