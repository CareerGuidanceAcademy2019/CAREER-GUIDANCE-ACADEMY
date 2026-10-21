'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Presentation,
  Award,
  BookOpen,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Lock,
  LogOut,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  ExternalLink,
  KeyRound,
  Eye,
  EyeOff,
  X,
  Smartphone,
  Sparkles,
  LayoutDashboard,
} from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { useCga } from '@/context/CgaContext';
import { cgaService } from '@/services/cgaService';
import { formatFacultyName } from '@/lib/names';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';
import { evaluatePasswordStrength } from '@/lib/passwordPolicy';

export default function FacultyPortalPage() {
  const router = useRouter();
  const { session, isHydrated, logout, changePassword, changeEmail, changePhone } = useCga();
  const [profileData, setProfileData] = useState<{
    profile: Record<string, any> | null;
    faculty: Record<string, any> | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Verified Phone Change Modal State
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [phonePassword, setPhonePassword] = useState('');
  const [showPhonePw, setShowPhonePw] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [phoneBusy, setPhoneBusy] = useState(false);

  // Verified Email Change Modal State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [showEmailPw, setShowEmailPw] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);

  // Verified Password Change Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    if (!session) {
      router.push('/login?as=faculty');
      return;
    }
    if (session.role !== 'FACULTY' && session.role !== 'ADMIN') {
      router.push('/student/dashboard');
      return;
    }

    cgaService.getMyFacultyProfile().then((data) => {
      setProfileData(data);
      setLoading(false);
    });
  }, [session, isHydrated, router]);

  if (!isHydrated || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <PublicHeader />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#ea580c]" />
        </main>
        <PublicFooter />
      </div>
    );
  }

  const p = profileData?.profile;
  const f = profileData?.faculty;
  const displayName = formatFacultyName(f?.name || p?.name || session?.name);
  const isAngat = session?.email === 'angatsaha825@gmail.com';

  const handleUpdatePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');
    if (!/^[6-9]\d{9}$/.test(newPhone.trim())) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!phonePassword) {
      setPhoneError('Please enter your current password for security verification.');
      return;
    }

    setPhoneBusy(true);
    const res = await changePhone(phonePassword, newPhone.trim());
    setPhoneBusy(false);

    if (!res.success) {
      setPhoneError(res.error || 'Failed to update phone number.');
      return;
    }

    if (p) p.phone = newPhone.trim();
    setShowPhoneModal(false);
    setNewPhone('');
    setPhonePassword('');
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    if (!emailPassword) {
      setEmailError('Please enter your current password for security verification.');
      return;
    }

    setEmailBusy(true);
    const res = await changeEmail(emailPassword, newEmail.trim());
    setEmailBusy(false);

    if (!res.success) {
      setEmailError(res.error || 'Failed to update email address.');
      return;
    }

    if (p) p.email = newEmail.trim();
    setShowEmailModal(false);
    setNewEmail('');
    setEmailPassword('');
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    const evalRes = evaluatePasswordStrength(newPassword);
    if (!evalRes.isValid && newPassword.length < 10) {
      setPasswordError(evalRes.feedback[0] || 'Please create a stronger password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setPasswordBusy(true);
    const res = await changePassword(currentPassword, newPassword);
    setPasswordBusy(false);

    if (!res.success) {
      setPasswordError(res.error || 'Failed to update password.');
      return;
    }

    setShowPasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicHeader />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-[#0a0e2a] via-[#1e2a5a] to-[#ea580c] text-white rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <Presentation className="w-4 h-4" /> C.G.A Faculty Member
              </span>
              {isAngat && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-400/30">
                  <Sparkles className="w-3.5 h-3.5" /> Multi-Role Master
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {displayName}
            </h1>
            <p className="text-xs sm:text-sm text-orange-100 max-w-xl">
              Career Guidance Academy (C.G.A) Udaipur Digital Campus • Academic Mentorship Wing
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAngat && (
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600/80 hover:bg-blue-600 border border-blue-400/40 text-white text-xs font-bold transition-all shadow-sm"
              >
                <LayoutDashboard className="w-3.5 h-3.5" /> Open Admin Portal
              </Link>
            )}
            <Link
              href="/faculty"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" /> View Public Profile
            </Link>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600/80 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>

        {/* Multi-role info banner if Angat */}
        {isAngat && (
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-4 sm:p-5 border border-blue-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                Cross-Portal Master User
              </span>
              <p className="text-xs font-medium text-blue-100 mt-0.5">
                You are currently viewing C.G.A as <strong>Faculty</strong>. You also hold complete active access to the <strong>Admin Control Panel</strong> and the <strong>Student Portal</strong>.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/student/dashboard"
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all flex items-center gap-1.5"
              >
                <GraduationCap className="w-3.5 h-3.5" /> Student Portal
              </Link>
              <Link
                href="/admin/dashboard"
                className="px-3.5 py-1.5 rounded-xl bg-[#ea580c] hover:bg-orange-600 text-xs font-bold text-white transition-all flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Admin Console
              </Link>
            </div>
          </div>
        )}

        {/* Privacy Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-900">
          <Lock className="w-4 h-4 text-[#0056b3] shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold text-[#0056b3]">Privacy Guarantee:</strong> In accordance
            with C.G.A security policy, your personal contact details (phone number &amp; email
            address) are strictly confidential and are <strong>never</strong> displayed on the public
            faculty directory or accessible by students.
          </div>
        </div>

        {/* Faculty Details Card Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-lg font-extrabold text-[#0a0e2a] flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#ea580c]" /> Academic &amp; Professional Profile
                </h2>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {f?.approval_status || 'Approved'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Public Display Name
                  </span>
                  <p className="text-base font-extrabold text-[#0a0e2a] mt-1">{displayName}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Full name: {f?.name || p?.name}</p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Designation &amp; Subject
                  </span>
                  <p className="text-base font-extrabold text-[#0a0e2a] mt-1">
                    {f?.designation || 'Faculty Member'}
                  </p>
                  {f?.subject && (
                    <p className="text-xs font-bold text-[#ea580c] mt-0.5">{f.subject}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="border border-slate-100 rounded-2xl p-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Educational Qualification
                  </span>
                  <p className="text-sm font-semibold text-slate-800">
                    {f?.qualification || p?.qualification || 'Not specified'}
                  </p>
                </div>

                <div className="border border-slate-100 rounded-2xl p-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Work Experience
                  </span>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {f?.experience || 'Not specified'}
                  </p>
                </div>

                {f?.achievements && (
                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5 mb-1">
                      <Award className="w-4 h-4 text-amber-600" /> Special Achievements
                    </span>
                    <p className="text-sm text-slate-700 leading-relaxed">{f.achievements}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Credentials Summary & Verified Actions */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#0a0e2a] uppercase tracking-wider">
                  Verified Contact &amp; Security
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-blue-50 text-[#0056b3] rounded-md">
                  Password Protected
                </span>
              </div>
              <p className="text-xs text-slate-500">
                You can securely update your phone number, email address, or account password below with current password verification.
              </p>

              <div className="space-y-3 pt-2 text-xs">
                {/* Email Item */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Email Address</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNewEmail(p?.email || session?.email || '');
                        setEmailPassword('');
                        setEmailError('');
                        setShowEmailModal(true);
                      }}
                      className="text-[11px] text-[#0056b3] hover:underline font-bold cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                  <p className="font-semibold text-slate-800 truncate">{p?.email || session?.email}</p>
                </div>

                {/* Phone Item */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Phone Number</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNewPhone(p?.phone || '7629882835');
                        setPhonePassword('');
                        setPhoneError('');
                        setShowPhoneModal(true);
                      }}
                      className="text-[11px] text-[#0056b3] hover:underline font-bold cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                  <p className="font-semibold text-slate-800">{p?.phone || '7629882835'}</p>
                </div>

                {/* Password Item */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Password</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setPasswordError('');
                        setShowPasswordModal(true);
                      }}
                      className="text-[11px] text-emerald-600 hover:underline font-bold cursor-pointer"
                    >
                      Update
                    </button>
                  </div>
                  <p className="font-semibold text-slate-800">••••••••••••</p>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-emerald-600 block uppercase font-bold">Work Ability</span>
                    <span className="font-bold text-emerald-800">{f?.work_ability || 'Online & Offline'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Institute Guidelines */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" /> Academic Guidance
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                For course updates, student doubt resolution sessions, or to upload question banks,
                please coordinate directly with the administrative desk at Udaipur Campus.
              </p>
              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                Campus: Chanban (Behind Youthclub), Udaipur, Gomati Tripura
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL: VERIFIED PHONE CHANGE */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowPhoneModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0056b3] border border-blue-100 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#0a0e2a]">Change Phone Number</h3>
                <p className="text-xs text-slate-500">Security verification required</p>
              </div>
            </div>

            {phoneError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{phoneError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePhone} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  New 10-Digit Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#0056b3]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Current Password Verification <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPhonePw ? 'text' : 'password'}
                    required
                    value={phonePassword}
                    onChange={(e) => setPhonePassword(e.target.value)}
                    placeholder="Enter current password to verify"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#0056b3]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPhonePw(!showPhonePw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPhonePw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPhoneModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={phoneBusy}
                  className="px-5 py-2.5 rounded-xl bg-[#0056b3] hover:bg-blue-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {phoneBusy ? 'Verifying...' : 'Verify & Update Phone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VERIFIED EMAIL CHANGE */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowEmailModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#ea580c] border border-orange-100 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#0a0e2a]">Change Email Address</h3>
                <p className="text-xs text-slate-500">Security verification required</p>
              </div>
            </div>

            {emailError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{emailError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateEmail} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  New Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="faculty.new@cgaudaipur.ac.in"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#ea580c]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Current Password Verification <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showEmailPw ? 'text' : 'password'}
                    required
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    placeholder="Enter current password to verify"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#ea580c]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmailPw(!showEmailPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showEmailPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={emailBusy}
                  className="px-5 py-2.5 rounded-xl bg-[#ea580c] hover:bg-orange-600 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {emailBusy ? 'Verifying...' : 'Verify & Update Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VERIFIED PASSWORD CHANGE */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#0a0e2a]">Change Account Password</h3>
                <p className="text-xs text-slate-500">Security verification &amp; policy check</p>
              </div>
            </div>

            {passwordError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Current Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters with mix of cases & digits"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {newPassword && (
                  <div className="mt-2">
                    <PasswordStrengthMeter password={newPassword} />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordBusy}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {passwordBusy ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <PublicFooter />
    </div>
  );
}
