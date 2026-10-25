'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Phone,
  Mail,
  KeyRound,
  Lock,
  Smartphone,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  X,
  ExternalLink,
  GraduationCap,
  Users,
  Sparkles,
  LayoutDashboard,
  LogOut,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { cgaService } from '@/services/cgaService';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';
import { evaluatePasswordStrength } from '@/lib/passwordPolicy';

export default function AdminProfilePage() {
  const { session, changePassword, changeEmail, changePhone, showToast } = useCga();

  const [currentPhone, setCurrentPhone] = useState('7629882835');

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
  const [logoutAllBusy, setLogoutAllBusy] = useState(false);

  if (!session) return null;

  const isAngat = session.email === 'angatsaha825@gmail.com';

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

    setCurrentPhone(newPhone.trim());
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
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0a0e2a] via-[#1e2a5a] to-[#ea580c] text-white rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-400/30">
              <ShieldCheck className="w-3.5 h-3.5" /> Security &amp; Credentials Center
            </span>
            {isAngat && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-400/30">
                <Sparkles className="w-3.5 h-3.5" /> Multi-Role Master
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Administrator Profile &amp; Login Security
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
            Manage your personal administrative contact details, two-step credential verifications, and multi-portal access settings.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-xs space-y-1">
          <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">Security Policy</span>
          <p className="text-white font-medium">Password re-verification required for phone, email, and password changes.</p>
        </div>
      </div>

      {/* Multi-Role Quick Links if Angat Saha */}
      {isAngat && (
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-[#0056b3] text-white rounded-3xl p-6 sm:p-8 border border-indigo-500/30 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" /> Multi-Role Access Granted Exclusively
              </span>
              <h2 className="text-lg font-black text-white mt-1">
                Admin, Student &amp; Faculty Master Access
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Your account (<code className="text-amber-200 bg-white/10 px-1.5 py-0.5 rounded">angatsaha825@gmail.com</code>) has full simultaneous credentials to manage operations as <strong>Admin</strong>, attend classes and mock tests as a <strong>Student</strong>, and teach or mentor as <strong>Faculty</strong>.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/student/dashboard"
                className="px-4 py-2.5 rounded-xl bg-white text-[#0a0e2a] hover:bg-slate-100 font-extrabold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all"
              >
                <GraduationCap className="w-4 h-4 text-[#0056b3]" /> Open Student Portal
              </Link>
              <Link
                href="/faculty-portal"
                className="px-4 py-2.5 rounded-xl bg-[#ea580c] hover:bg-orange-600 text-white font-extrabold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Users className="w-4 h-4" /> Open Faculty Portal
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Verified Contact & Login Credentials Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#ea580c] block">
            Mandatory Verification Required
          </span>
          <h2 className="text-xl font-extrabold text-[#0a0e2a] mt-0.5">
            Verified Contact &amp; Login Credentials
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Updating your phone number, registered email, or password requires authentication with your current password to prevent unauthorized account modifications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Phone Card */}
          <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0056b3] border border-blue-100 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Registered Mobile / WhatsApp
                </span>
                <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                  +91 {currentPhone}
                </p>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Used for urgent administrative OTPs, fee verifications, and system alerts.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setNewPhone(currentPhone);
                setPhonePassword('');
                setPhoneError('');
                setShowPhoneModal(true);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-white border border-slate-200 hover:border-[#0056b3] text-[#0056b3] hover:bg-blue-50/50 font-bold text-xs transition-colors cursor-pointer text-center"
            >
              Change Phone Number
            </button>
          </div>

          {/* Email Card */}
          <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#ea580c] border border-orange-100 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Registered Email Address
                </span>
                <p className="text-sm font-extrabold text-slate-900 mt-0.5 truncate" title={session.email}>
                  {session.email}
                </p>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Primary identifier for administrative access and audit logging.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setNewEmail(session.email);
                setEmailPassword('');
                setEmailError('');
                setShowEmailModal(true);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-white border border-slate-200 hover:border-[#ea580c] text-[#ea580c] hover:bg-orange-50/50 font-bold text-xs transition-colors cursor-pointer text-center"
            >
              Change Email Address
            </button>
          </div>

          {/* Password Card */}
          <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Password &amp; Security
                </span>
                <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                  ••••••••••••
                </p>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Protected with bcrypt hashing. Last updated and verified active.
              </p>
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
              className="w-full py-2.5 px-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-600 text-emerald-700 hover:bg-emerald-50/50 font-bold text-xs transition-colors cursor-pointer text-center"
            >
              Change Password
            </button>
          </div>
        </div>

        {/* Active Sessions Sentinel */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="font-semibold">Session Policy:</span>
            <span className="font-bold text-slate-700">Single active administrator session enforced</span>
          </div>
          <button
            type="button"
            id="admin-logout-all-devices-btn"
            disabled={logoutAllBusy}
            onClick={async () => {
              if (confirm('Are you sure you want to log out from all devices? All other active administrator sessions will be revoked immediately.')) {
                setLogoutAllBusy(true);
                await cgaService.signoutAllDevices();
                window.location.href = '/login?as=admin';
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-xs cursor-pointer inline-flex items-center justify-center gap-1.5 transition-all disabled:opacity-60"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{logoutAllBusy ? 'Signing out…' : 'Log out from all devices'}</span>
          </button>
        </div>
      </div>

      {/* System Authorization & Role Metadata */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-lg font-extrabold text-[#0a0e2a] flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#0056b3]" /> System Authorization &amp; Access Status
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Portal Role</span>
            <p className="text-sm font-extrabold text-[#0a0e2a] mt-1">Super Administrator</p>
            <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold">
              Level 1 Clearance
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Verification Status</span>
            <p className="text-sm font-extrabold text-emerald-600 mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Verified &amp; Approved
            </p>
            <span className="inline-block mt-1 text-[10px] text-slate-500">Live Active Session</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Security Protocol</span>
            <p className="text-sm font-extrabold text-[#0a0e2a] mt-1">TLS 1.3 / HTTP Strict</p>
            <span className="inline-block mt-1 text-[10px] text-slate-500">Encrypted Transport</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Session Timeout</span>
            <p className="text-sm font-extrabold text-[#0a0e2a] mt-1">15-Minute Inactivity</p>
            <span className="inline-block mt-1 text-[10px] text-slate-500">Automatic Hard Guard</span>
          </div>
        </div>
      </div>

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
              <div role="alert" className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
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
                  placeholder="admin.new@cgaudaipur.ac.in"
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
    </div>
  );
}
