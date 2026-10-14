'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { useCga } from '@/context/CgaContext';
import { isEmail, normalizePhone } from '@/lib/names';

export default function RegisterPage() {
  const router = useRouter();
  const { registerStudent } = useCga();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [qualification, setQualification] = useState('');
  const [targetExam, setTargetExam] = useState('Tripura TET / STGT / STPGT');
  const [address, setAddress] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [sameAddress, setSameAddress] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmEmailSent, setConfirmEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const permanent = sameAddress ? address : permanentAddress;

    if (!name.trim() || name.trim().length < 3) {
      setError('Please enter your full name (minimum 3 characters).');
      return;
    }
    if (!isEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(normalizePhone(phone))) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (guardianName.trim().length < 3) {
      setError("Please enter your parent's / guardian's name.");
      return;
    }
    if (address.trim().length < 5) {
      setError('Please enter your present address.');
      return;
    }
    if (permanent.trim().length < 5) {
      setError('Please enter your permanent address.');
      return;
    }
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    const res = await registerStudent({
      name,
      email,
      phone: normalizePhone(phone),
      password,
      guardianName,
      address,
      permanentAddress: permanent,
      qualification,
      targetExam,
    });
    setBusy(false);

    if (!res.success) {
      setError(res.error || 'Could not register account.');
      return;
    }

    if (res.needsEmailConfirmation) {
      setConfirmEmailSent(true);
      return;
    }
    router.push('/student/dashboard');
  };

  if (confirmEmailSent) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <PublicHeader />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h1 className="text-xl font-extrabold text-[#0a0e2a]">Confirm your email</h1>
            <p className="text-sm text-slate-600">
              We sent a confirmation link to <strong>{email}</strong>. Open it to activate your
              account, then sign in.
            </p>
            <Link
              href="/login"
              className="inline-block w-full py-3 rounded-xl bg-[#0056b3] text-white font-bold text-sm"
            >
              Go to Login
            </Link>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicHeader />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="cga-gradient-hero text-white p-8 flex items-center justify-between gap-4">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded bg-white/15 text-amber-300 text-xs font-bold uppercase tracking-wider">
                Student Registration 2026–27
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
                Create Your C.G.A Student Account
              </h1>
              <p className="text-xs sm:text-sm text-blue-100 mt-1">
                Register to enrol in batches, download study books, and attempt timed mock tests.
              </p>
            </div>
            <img
              src="/cga-logo.png"
              alt="C.G.A Logo"
              className="w-16 h-16 rounded-full bg-white p-1 object-contain shrink-0 hidden sm:block"
            />
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5" noValidate>
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs font-semibold text-[#dc2626]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Student Full Name <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  id="reg-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Subhamoy Debnath"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mobile Number (WhatsApp) <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  id="reg-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9436X XXXXX"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Parent&apos;s / Guardian&apos;s Name <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  id="reg-guardian"
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="Father / Mother / Guardian Name"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Current Qualification / Class <span className="text-slate-400 font-medium">(optional)</span>
                </label>
                <input
                  id="reg-qualification"
                  type="text"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="e.g., B.A. B.Ed. or Class X (TBSE)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Target Exam / Course Wing
                </label>
                <select
                  id="reg-target-exam"
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                >
                  <option value="Tripura TET / STGT / STPGT">Tripura TET / STGT / STPGT</option>
                  <option value="TPSC Combined / JRBT">TPSC Combined / JRBT</option>
                  <option value="Banking (IBPS/SBI), SSC & Railway">Banking (IBPS/SBI), SSC & Railway</option>
                  <option value="School Coaching (Class VII–X TBSE)">School Coaching (Class VII–X TBSE)</option>
                  <option value="School Coaching (Class VII–X CBSE)">School Coaching (Class VII–X CBSE)</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="reg-address" className="block text-xs font-bold text-slate-700 mb-1.5">
                Present Address <span className="text-[#dc2626]">*</span>
              </label>
              <textarea
                id="reg-address"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House / Village, Post Office, District, PIN"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3] resize-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 gap-3">
                <label htmlFor="reg-permanent-address" className="block text-xs font-bold text-slate-700">
                  Permanent Address <span className="text-[#dc2626]">*</span>
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0056b3] cursor-pointer">
                  <input
                    id="reg-same-address"
                    type="checkbox"
                    checked={sameAddress}
                    onChange={(e) => setSameAddress(e.target.checked)}
                    className="accent-[#0056b3]"
                  />
                  Same as present address
                </label>
              </div>
              <textarea
                id="reg-permanent-address"
                rows={2}
                value={sameAddress ? address : permanentAddress}
                disabled={sameAddress}
                onChange={(e) => setPermanentAddress(e.target.value)}
                placeholder="House / Village, Post Office, District, PIN"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3] resize-none disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Create Password <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Confirm Password <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  id="reg-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>
            </div>

            <button
              id="reg-submit-btn"
              type="submit"
              disabled={busy}
              className="w-full py-3.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] disabled:opacity-60 text-white font-bold text-sm shadow-md inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              {busy ? 'Creating your account…' : 'Complete Registration & Enter Student Portal'}
            </button>

            <p className="text-center text-xs text-slate-600 pt-2">
              Already have a C.G.A account?{' '}
              <Link href="/login" className="font-extrabold text-[#0056b3] hover:underline">
                Sign In Here
              </Link>
            </p>
          </form>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
