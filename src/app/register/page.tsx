'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, AlertCircle, CheckCircle2, KeyRound, RefreshCw, Sparkles, Mail } from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { useCga } from '@/context/CgaContext';
import { cgaService } from '@/services/cgaService';
import { isEmail, normalizePhone } from '@/lib/names';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';
import { evaluatePasswordStrength } from '@/lib/passwordPolicy';

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
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmEmailSent, setConfirmEmailSent] = useState(false);
  const [confirmOtp, setConfirmOtp] = useState('');
  const [confirmOtpBusy, setConfirmOtpBusy] = useState(false);
  const [confirmOtpError, setConfirmOtpError] = useState('');
  const [confirmOtpSuccess, setConfirmOtpSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendNotice, setResendNotice] = useState('');

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !email) return;
    setConfirmOtpError('');
    setResendNotice('');
    try {
      const res = await cgaService.resendSignupOtp(email.trim().toLowerCase());
      if (res.success) {
        setResendCooldown(60);
        setResendNotice('A new verification code has been dispatched to your email.');
      } else {
        setConfirmOtpError(res.error || 'Could not resend verification code.');
      }
    } catch {
      setConfirmOtpError('Error requesting new code. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const permanent = sameAddress ? address : permanentAddress;

    // Honeypot bot protection
    if (honeypot) {
      setBusy(false);
      setConfirmEmailSent(true);
      return;
    }

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
    if (!qualification.trim() || qualification.trim().length < 2) {
      setError('Please enter your educational qualification or current standard.');
      return;
    }
    if (!targetExam.trim() || targetExam.trim().length < 2) {
      setError('Please select or specify your target competitive examination.');
      return;
    }
    const pwCheck = evaluatePasswordStrength(password);
    if (!pwCheck.isValid) {
      setError(pwCheck.feedback[0] || 'Password must be at least 10 characters and not easily guessable.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!consentAgreed) {
      setError('You must accept the Terms & Conditions and Privacy Policy (DPDP Act 2023) to register.');
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

  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmOtpError('');

    const cleanOtp = confirmOtp.replace(/\D/g, '').trim();
    if (cleanOtp.length < 6) {
      setConfirmOtpError('Please enter the full 6-digit confirmation code sent to your email.');
      return;
    }

    setConfirmOtpBusy(true);
    try {
      const res = await cgaService.verifySignupOtp(email.trim().toLowerCase(), cleanOtp);
      if (!res.success) {
        setConfirmOtpError(res.error || 'Invalid or expired confirmation code. Please check your email.');
        setConfirmOtpBusy(false);
        return;
      }
      setConfirmOtpSuccess(true);
    } catch {
      setConfirmOtpError('Network error verifying confirmation code. Please try again.');
    } finally {
      setConfirmOtpBusy(false);
    }
  };

  if (confirmEmailSent) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <PublicHeader />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 space-y-5">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-blue-100 text-[#0056b3] flex items-center justify-center mx-auto">
                <Mail className="w-7 h-7" />
              </div>
              <h1 className="text-xl font-extrabold text-[#0a0e2a]">Confirm Your Email</h1>
              <p className="text-xs text-slate-600 leading-relaxed">
                We sent a 6-digit confirmation code and activation link to{' '}
                <strong className="text-slate-900">{email}</strong>.
              </p>
            </div>

            {confirmOtpSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-emerald-900">Email Verified Successfully!</h3>
                  <p className="text-xs text-emerald-700 mt-1">
                    Your student account is now fully active. You can now sign in using your registered email address or your 10-digit mobile number ({phone}) with your password.
                  </p>
                </div>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center w-full py-3 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                >
                  Sign In to Student Portal
                </Link>
              </div>
            ) : (
              <form onSubmit={handleVerifySignupOtp} className="space-y-4" noValidate>
                {confirmOtpError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs font-semibold text-[#dc2626]">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{confirmOtpError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Enter 6-Digit Email OTP Code
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={8}
                      value={confirmOtp}
                      onChange={(e) => setConfirmOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 123456"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                      autoComplete="one-time-code"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={confirmOtpBusy}
                  className="w-full py-3 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] disabled:opacity-60 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {confirmOtpBusy ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Code…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Verify Email &amp; Activate Account</span>
                    </>
                  )}
                </button>

                {resendNotice && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 text-center">
                    {resendNotice}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-500">Didn&apos;t receive code?</span>
                  <button
                    type="button"
                    disabled={resendCooldown > 0}
                    onClick={handleResendOtp}
                    className="font-bold text-[#0056b3] hover:underline disabled:text-slate-400 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
                  >
                    {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </div>

                <div className="pt-2 text-center space-y-2 border-t border-slate-100">
                  <p className="text-[11px] text-slate-500">
                    Already clicked the verification link in your email app?
                  </p>
                  <Link
                    href="/login"
                    className="inline-block text-xs font-bold text-[#0056b3] hover:underline"
                  >
                    Proceed Directly to Login →
                  </Link>
                </div>
              </form>
            )}
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
            {/* Bot Honeypot */}
            <div className="hidden" aria-hidden="true">
              <input
                id="reg-hp"
                name="reg-hp"
                type="text"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

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

            {/* Anti-bot honeypot field */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="reg-hp">Website Security Field</label>
              <input
                id="reg-hp"
                type="text"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-password" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Create Password <span className="text-[#dc2626]">*</span>
                  </label>
                  <input
                    id="reg-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 10 characters"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3] focus-visible:ring-2 focus-visible:ring-[#0056b3]"
                    required
                    aria-required="true"
                  />
                </div>

                <div>
                  <label htmlFor="reg-confirm-password" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Confirm Password <span className="text-[#dc2626]">*</span>
                  </label>
                  <input
                    id="reg-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3] focus-visible:ring-2 focus-visible:ring-[#0056b3]"
                    required
                    aria-required="true"
                  />
                </div>
              </div>
              <PasswordStrengthMeter password={password} />
            </div>

            {/* Mandatory DPDP Act & Terms Consent Checkbox */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-start gap-2.5">
                <input
                  id="reg-consent"
                  type="checkbox"
                  checked={consentAgreed}
                  onChange={(e) => setConsentAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#0056b3] border-slate-300 focus:ring-[#0056b3] focus-visible:ring-2 focus-visible:ring-[#0056b3] cursor-pointer shrink-0"
                  required
                  aria-required="true"
                />
                <label
                  htmlFor="reg-consent"
                  className="text-xs text-slate-700 leading-relaxed cursor-pointer select-none"
                >
                  <span className="font-semibold text-slate-900">Mandatory Terms &amp; Privacy Consent:</span>{' '}
                  I certify that all details submitted are accurate. I accept and agree to Career Guidance Academy&apos;s{' '}
                  <Link
                    href="/terms-and-conditions"
                    target="_blank"
                    className="text-[#0056b3] underline font-semibold hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-[#0056b3]"
                  >
                    Terms &amp; Conditions
                  </Link>,{' '}
                  <Link
                    href="/privacy-policy"
                    target="_blank"
                    className="text-[#0056b3] underline font-semibold hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-[#0056b3]"
                  >
                    Privacy Policy (DPDP Act, 2023)
                  </Link>, and{' '}
                  <Link
                    href="/refund-policy"
                    target="_blank"
                    className="text-[#0056b3] underline font-semibold hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-[#0056b3]"
                  >
                    Refund Policy
                  </Link>. For minor students (Class VII to X), this registration is made under verifiable parental / guardian supervision.
                </label>
              </div>
            </div>

            <button
              id="reg-submit-btn"
              type="submit"
              disabled={busy}
              className="w-full py-3.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] disabled:opacity-60 text-white font-bold text-sm shadow-md inline-flex items-center justify-center gap-2 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0056b3]"
              aria-label="Complete Student Registration and Enter Portal"
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
