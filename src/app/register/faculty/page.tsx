'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Presentation, AlertCircle, CheckCircle2, Clock, UserPlus, Eye, EyeOff } from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { useCga } from '@/context/CgaContext';
import { formatFacultyName, isEmail, normalizePhone } from '@/lib/names';

const inputCls =
  'w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ea580c]';

function Field({
  id,
  label,
  required,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-bold text-slate-700 mb-1.5">
        {label} {required && <span className="text-[#dc2626]">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

export default function FacultyRegisterPage() {
  const router = useRouter();
  const { registerFaculty } = useCga();

  const [form, setForm] = useState({
    name: '',
    designation: '',
    qualification: '',
    experience: '',
    achievements: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
  });
  const [workAbility, setWorkAbility] = useState<'yes' | 'no' | ''>('');
  const [showPw, setShowPw] = useState(false);
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<'pending' | 'confirm-email' | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.name.trim().split(/\s+/).length < 2) return setError('Please enter your full name (first name and surname).');
    if (!form.designation.trim()) return setError('Please enter your designation.');
    if (!form.qualification.trim()) return setError('Please enter your educational qualification.');
    if (!form.experience.trim()) return setError('Please describe your work experience.');
    if (workAbility !== 'yes')
      return setError('C.G.A faculty must be able to teach both Online and Offline. Please select "Yes" to continue.');
    if (!/^[6-9]\d{9}$/.test(normalizePhone(form.phone))) return setError('Please enter a valid 10-digit mobile number.');
    if (!isEmail(form.email)) return setError('Please enter a valid email address.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters long.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (!consentAgreed) return setError('Please review and accept the Faculty Terms & Privacy Policy to submit your profile.');

    setBusy(true);
    const res = await registerFaculty({
      name: form.name,
      designation: form.designation,
      qualification: form.qualification,
      experience: form.experience,
      achievements: form.achievements,
      workAbility: true,
      email: form.email,
      phone: normalizePhone(form.phone),
      password: form.password,
    });
    setBusy(false);

    if (!res.success) return setError(res.error || 'Could not complete registration.');
    if (res.session) {
      router.push('/faculty-portal'); // pre-approved faculty (on the access list)
      return;
    }
    setDone(res.needsEmailConfirmation ? 'confirm-email' : 'pending');
  };

  if (done) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <PublicHeader variant="auth" />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center space-y-4">
            {done === 'pending' ? (
              <Clock className="w-12 h-12 text-[#ea580c] mx-auto" />
            ) : (
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            )}
            <h1 className="text-xl font-extrabold text-[#0a0e2a]">
              {done === 'pending' ? 'Registration Submitted' : 'Confirm your email'}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              {done === 'pending' ? (
                <>
                  Thank you, <strong>{formatFacultyName(form.name)}</strong>. Your faculty profile has been sent to the
                  C.G.A administrator for approval. Once it is approved you can sign in from the{' '}
                  <strong>Faculty</strong> tab with your email or mobile number and password.
                </>
              ) : (
                <>
                  We sent a confirmation link to <strong>{form.email}</strong>. Open it, then wait for admin approval
                  before signing in.
                </>
              )}
            </p>
            <Link
              href="/login?as=faculty"
              className="inline-block w-full py-3 rounded-xl bg-[#0a0e2a] text-white font-bold text-sm"
            >
              Go to Faculty Login
            </Link>
          </div>
        </main>
        <PublicFooter variant="auth" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicHeader variant="auth" />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-br from-[#0a0e2a] via-[#1e2a5a] to-[#ea580c] text-white p-8 flex items-center justify-between gap-4">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded bg-white/15 text-amber-300 text-xs font-bold uppercase tracking-wider">
                Faculty Registration
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">Join the C.G.A Teaching Team</h1>
              <p className="text-xs sm:text-sm text-orange-100 mt-1">
                Your profile is reviewed by the administrator. After approval it appears on our Faculty page
                (your phone and email are never shown publicly).
              </p>
            </div>
            <Presentation className="w-14 h-14 text-amber-300 shrink-0 hidden sm:block" />
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5" noValidate>
            {error && (
              <div role="alert" className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs font-semibold text-[#dc2626]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                id="fac-name"
                label="1. Name"
                required
                hint={form.name.trim() ? `Shown publicly as: ${formatFacultyName(form.name)}` : 'First name and surname'}
              >
                <input id="fac-name" value={form.name} onChange={set('name')} placeholder="e.g., Amit Saha" className={inputCls} />
              </Field>
              <Field id="fac-designation" label="2. Designation" required>
                <input
                  id="fac-designation"
                  value={form.designation}
                  onChange={set('designation')}
                  placeholder="e.g., Senior Faculty – Mathematics"
                  className={inputCls}
                />
              </Field>
            </div>

            <Field id="fac-qualification" label="3. Educational Qualification" required>
              <input
                id="fac-qualification"
                value={form.qualification}
                onChange={set('qualification')}
                placeholder="e.g., M.Sc. (Mathematics), B.Ed."
                className={inputCls}
              />
            </Field>

            <Field id="fac-experience" label="4. Work Experience" required>
              <textarea
                id="fac-experience"
                rows={2}
                value={form.experience}
                onChange={set('experience')}
                placeholder="e.g., 8 years teaching T-TET & TPSC aspirants"
                className={`${inputCls} resize-none`}
              />
            </Field>

            <Field id="fac-achievements" label="5. Special Achievements">
              <textarea
                id="fac-achievements"
                rows={2}
                value={form.achievements}
                onChange={set('achievements')}
                placeholder="Awards, selections of your students, publications…"
                className={`${inputCls} resize-none`}
              />
            </Field>

            <fieldset>
              <legend className="block text-xs font-bold text-slate-700 mb-1.5">
                6. Online &amp; Offline Work Ability <span className="text-[#dc2626]">*</span>
              </legend>
              <div className="grid grid-cols-2 gap-3">
                {(['yes', 'no'] as const).map((v) => (
                  <label
                    key={v}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-bold cursor-pointer transition-all ${
                      workAbility === v
                        ? v === 'yes'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-red-300 bg-red-50 text-red-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <input
                      id={`fac-work-${v}`}
                      type="radio"
                      name="work-ability"
                      value={v}
                      checked={workAbility === v}
                      onChange={() => setWorkAbility(v)}
                      className="sr-only"
                    />
                    {v === 'yes' ? 'Yes – Online & Offline' : 'No'}
                  </label>
                ))}
              </div>
              {workAbility === 'no' && (
                <p className="text-[11px] text-red-600 mt-1.5 font-semibold">
                  Faculty must be able to teach both online and offline to register.
                </p>
              )}
            </fieldset>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <Field id="fac-phone" label="Mobile Number" required hint="Private – used for sign-in only">
                <input id="fac-phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="98XXXXXXXX" className={inputCls} />
              </Field>
              <Field id="fac-email" label="Email Address" required hint="Private – used for sign-in only">
                <input id="fac-email" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" className={inputCls} />
              </Field>
              <Field id="fac-password" label="Create Password" required>
                <div className="relative">
                  <input
                    id="fac-password"
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={set('password')}
                    placeholder="Min. 8 characters"
                    className={`${inputCls} pr-11`}
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
              </Field>
              <Field id="fac-confirm" label="Confirm Password" required>
                <input
                  id="fac-confirm"
                  type={showPw ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={set('confirm')}
                  placeholder="Re-enter password"
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Faculty DPDP & Terms Consent */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-start gap-2.5">
                <input
                  id="fac-consent"
                  type="checkbox"
                  checked={consentAgreed}
                  onChange={(e) => setConsentAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#ea580c] border-slate-300 focus:ring-[#ea580c] focus-visible:ring-2 focus-visible:ring-[#ea580c] cursor-pointer shrink-0"
                  required
                  aria-required="true"
                />
                <label
                  htmlFor="fac-consent"
                  className="text-xs text-slate-700 leading-relaxed cursor-pointer select-none"
                >
                  <span className="font-semibold text-slate-900">Faculty Ethics &amp; DPDP Consent:</span>{' '}
                  I confirm that all educational qualifications and work history provided are truthful. I accept Career Guidance Academy&apos;s{' '}
                  <Link
                    href="/terms-and-conditions"
                    target="_blank"
                    className="text-[#0056b3] underline font-semibold hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-[#0056b3]"
                  >
                    Terms &amp; Conditions
                  </Link>{' '}
                  and{' '}
                  <Link
                    href="/privacy-policy"
                    target="_blank"
                    className="text-[#0056b3] underline font-semibold hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-[#0056b3]"
                  >
                    Privacy Policy
                  </Link>, and agree to protect academy study materials from unauthorized redistribution.
                </label>
              </div>
            </div>

            <button
              id="fac-submit-btn"
              type="submit"
              disabled={busy}
              className="w-full py-3.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] disabled:opacity-60 text-white font-bold text-sm shadow-md inline-flex items-center justify-center gap-2 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ea580c]"
              aria-label="Submit Faculty Profile for Admin Verification"
            >
              <UserPlus className="w-4 h-4" />
              {busy ? 'Submitting…' : 'Submit for Admin Approval'}
            </button>

            <p className="text-center text-xs text-slate-600">
              Already approved?{' '}
              <Link href="/login?as=faculty" className="font-extrabold text-[#0056b3] hover:underline">
                Sign in on the Faculty tab
              </Link>
            </p>
          </form>
        </div>
      </main>

      <PublicFooter variant="auth" />
    </div>
  );
}
