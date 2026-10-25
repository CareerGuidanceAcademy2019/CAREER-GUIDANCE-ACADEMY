'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Save,
  CheckCircle2,
  GraduationCap,
  Phone,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  X,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  Smartphone,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { cgaService } from '@/services/cgaService';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';
import { evaluatePasswordStrength } from '@/lib/passwordPolicy';

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
];

export default function StudentProfilePage() {
  const { currentStudent, updateStudentProfile, changePassword, changeEmail, changePhone, showToast } = useCga();

  const [name, setName] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [address, setAddress] = useState('');
  const [qualification, setQualification] = useState('');
  const [targetExam, setTargetExam] = useState('');
  const [photo, setPhoto] = useState('');

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

  // Account Deletion States (DPDP Act 2023)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [guardianConsent, setGuardianConsent] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSubmitted, setDeleteSubmitted] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (currentStudent) {
      setName(currentStudent.name);
      setGuardianName(currentStudent.guardianName);
      setAddress(currentStudent.address);
      setQualification(currentStudent.qualification);
      setTargetExam(currentStudent.targetExam);
      setPhoto(currentStudent.photo);
    }
  }, [currentStudent]);

  if (!currentStudent) return null;

  const handleSavePersonal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateStudentProfile(currentStudent.id, {
      name: name.trim(),
      guardianName: guardianName.trim(),
      address: address.trim(),
      qualification: qualification.trim(),
      targetExam: targetExam.trim(),
      photo,
    });
  };

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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0a0e2a]">My Student Profile &amp; Security</h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Manage your personal information, enrolled batches, and verified security credentials (phone, email &amp; password).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Card: Photo & Enrolled Batches */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 text-center shadow-2xs">
            <img
              src={photo || currentStudent.photo}
              alt={currentStudent.name}
              className="w-28 h-28 rounded-full object-cover mx-auto ring-4 ring-[#0056b3]/20 shadow-md"
            />
            <span className="inline-block mt-4 px-3 py-0.5 rounded-full bg-blue-50 text-[#0056b3] text-xs font-extrabold">
              {currentStudent.studentCode}
            </span>
            <h2 className="text-xl font-extrabold text-[#0a0e2a] mt-1">{currentStudent.name}</h2>
            <p className="text-xs font-semibold text-slate-500">{currentStudent.email}</p>

            {/* Quick Avatar Switcher */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase block mb-2">
                Select Profile Photo
              </span>
              <div className="flex items-center justify-center gap-2">
                {AVATAR_OPTIONS.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setPhoto(url)}
                    className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                      photo === url ? 'border-[#0056b3] scale-110' : 'border-transparent opacity-70'
                    }`}
                  >
                    <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Enrolled Batches Summary */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h3 className="text-base font-extrabold text-[#0a0e2a] flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#0056b3]" /> Enrolled Batches
            </h3>
            {currentStudent.enrollments.length === 0 ? (
              <p className="text-xs text-slate-500">No batch enrollments recorded yet.</p>
            ) : (
              currentStudent.enrollments.map((enr) => (
                <div
                  key={enr.courseId}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1"
                >
                  <span className="font-extrabold text-[#0056b3]">{enr.batchName}</span>
                  <p className="font-bold text-slate-900">{enr.courseName}</p>
                  <p className="text-slate-500">Faculty: {enr.facultyName}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Form: Personal Details & Security Credentials */}
        <div className="lg:col-span-8 space-y-8">
          {/* Section 1: Security & Verified Credentials */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-[#0056b3] block">
                  Security &amp; Account Protection
                </span>
                <h2 className="text-lg font-extrabold text-[#0a0e2a] mt-0.5">
                  Verified Contact &amp; Login Credentials
                </h2>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Identity Protected
              </span>
            </div>

            <p className="text-xs text-slate-500">
              To prevent unauthorized changes, any update to your registered phone, email, or password requires identity verification with your current password.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Phone Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-[#0056b3]" /> Mobile Number
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Verified
                    </span>
                  </div>
                  <p className="text-sm font-extrabold text-[#0a0e2a] tracking-wide pt-1">
                    {currentStudent.phone || 'Not Set'}
                  </p>
                </div>
                <button
                  type="button"
                  id="student-change-phone-btn"
                  onClick={() => {
                    setPhoneError('');
                    setNewPhone(currentStudent.phone || '');
                    setPhonePassword('');
                    setShowPhoneModal(true);
                  }}
                  className="w-full py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-[#0056b3] font-bold text-xs cursor-pointer shadow-2xs transition-all"
                >
                  Verify &amp; Change Phone
                </button>
              </div>

              {/* Email Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#0056b3]" /> Email Address
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Verified
                    </span>
                  </div>
                  <p className="text-sm font-extrabold text-[#0a0e2a] truncate pt-1" title={currentStudent.email}>
                    {currentStudent.email}
                  </p>
                </div>
                <button
                  type="button"
                  id="student-change-email-btn"
                  onClick={() => {
                    setEmailError('');
                    setNewEmail(currentStudent.email);
                    setEmailPassword('');
                    setShowEmailModal(true);
                  }}
                  className="w-full py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-[#0056b3] font-bold text-xs cursor-pointer shadow-2xs transition-all"
                >
                  Verify &amp; Change Email
                </button>
              </div>

              {/* Password Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-[#ea580c]" /> Account Password
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                      Protected
                    </span>
                  </div>
                  <p className="text-sm font-extrabold text-[#0a0e2a] pt-1">
                    ••••••••••••
                  </p>
                </div>
                <button
                  type="button"
                  id="student-change-password-btn"
                  onClick={() => {
                    setPasswordError('');
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setShowPasswordModal(true);
                  }}
                  className="w-full py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-[#ea580c] font-bold text-xs cursor-pointer shadow-2xs transition-all"
                >
                  Change Password
                </button>
              </div>
            </div>

            {/* Active Sessions & Last Login */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <span className="font-semibold">Last login:</span>
                <span className="font-bold text-slate-700">
                  {currentStudent.lastLoginAt
                    ? new Date(currentStudent.lastLoginAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : 'Current active session'}
                </span>
              </div>
              <button
                type="button"
                id="student-logout-all-devices-btn"
                disabled={logoutAllBusy}
                onClick={async () => {
                  if (confirm('Are you sure you want to log out from all devices? All other phones and browsers will be signed out immediately.')) {
                    setLogoutAllBusy(true);
                    await cgaService.signoutAllDevices();
                    window.location.href = '/login';
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-xs cursor-pointer inline-flex items-center justify-center gap-1.5 transition-all disabled:opacity-60"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{logoutAllBusy ? 'Signing out…' : 'Log out from all devices'}</span>
              </button>
            </div>
          </div>

          {/* Section 2: Personal & Academic Details Form */}
          <form
            onSubmit={handleSavePersonal}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-5"
          >
            <h2 className="text-lg font-extrabold text-[#0a0e2a] border-b border-slate-100 pb-3">
              Personal &amp; Academic Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="prof-name" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Student Full Name
                </label>
                <input
                  id="prof-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>

              <div>
                <label htmlFor="prof-guardian" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Parent / Guardian Name
                </label>
                <input
                  id="prof-guardian"
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>

              <div>
                <label htmlFor="prof-qual" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Educational Qualification / Class
                </label>
                <input
                  id="prof-qual"
                  type="text"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>

              <div>
                <label htmlFor="prof-exam" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Target Competitive Examination
                </label>
                <input
                  id="prof-exam"
                  type="text"
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="prof-address" className="block text-xs font-bold text-slate-700 mb-1.5">
                Residential Address (Udaipur / Tripura)
              </label>
              <textarea
                id="prof-address"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                id="prof-save-personal-btn"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Personal Details
              </button>
            </div>
          </form>

          {/* Privacy & Account Deletion Section (DPDP Act 2023) */}
          <div className="bg-white rounded-3xl border border-red-100 p-6 shadow-2xs space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider block">
                  Data Privacy &amp; Erasure (DPDP Act 2023)
                </span>
                <h3 className="text-base font-extrabold text-[#0a0e2a]">
                  Request Permanent Account Deletion
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Under India&apos;s Digital Personal Data Protection Act, 2023, you have the right to request erasure of your student profile and enrolled records. For minor students, verified parent or guardian consent is required.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs shrink-0 cursor-pointer inline-flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Request Deletion
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== MODAL: CHANGE MOBILE NUMBER (VERIFIED) ==================== */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#0056b3]" />
                <h3 className="font-extrabold text-base text-[#0a0e2a]">Change Mobile Number</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPhoneModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed">
              <span className="font-bold block mb-0.5">Verification Required:</span>
              Enter your new 10-digit mobile number and confirm with your current account password to verify your identity.
            </div>

            {phoneError && (
              <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-[#dc2626] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{phoneError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePhone} className="space-y-4">
              <div>
                <label htmlFor="verify-new-phone" className="block text-xs font-bold text-slate-700 mb-1">
                  New 10-Digit Mobile Number
                </label>
                <input
                  id="verify-new-phone"
                  type="tel"
                  maxLength={10}
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="e.g. 98XXXXXXXX"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold text-sm focus:ring-2 focus:ring-[#0056b3]"
                  required
                />
              </div>

              <div>
                <label htmlFor="verify-phone-password" className="block text-xs font-bold text-slate-700 mb-1">
                  Current Account Password (Verification)
                </label>
                <div className="relative">
                  <input
                    id="verify-phone-password"
                    type={showPhonePw ? 'text' : 'password'}
                    value={phonePassword}
                    onChange={(e) => setPhonePassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0056b3]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPhonePw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPhonePw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPhoneModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="submit-phone-update-btn"
                  type="submit"
                  disabled={phoneBusy}
                  className="px-5 py-2 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] disabled:opacity-60 text-white font-extrabold text-xs shadow-md cursor-pointer inline-flex items-center gap-1.5"
                >
                  {phoneBusy ? 'Verifying…' : 'Verify & Update Mobile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CHANGE EMAIL ADDRESS (VERIFIED) ==================== */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#0056b3]" />
                <h3 className="font-extrabold text-base text-[#0a0e2a]">Change Registered Email</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <span className="font-bold block mb-0.5">Verification Protocol:</span>
              Enter your new email address and verify with your current password. A confirmation link will be dispatched to the new email to finalize the update.
            </div>

            {emailError && (
              <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-[#dc2626] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{emailError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateEmail} className="space-y-4">
              <div>
                <label htmlFor="verify-new-email" className="block text-xs font-bold text-slate-700 mb-1">
                  New Email Address
                </label>
                <input
                  id="verify-new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0056b3]"
                  required
                />
              </div>

              <div>
                <label htmlFor="verify-email-password" className="block text-xs font-bold text-slate-700 mb-1">
                  Current Account Password (Verification)
                </label>
                <div className="relative">
                  <input
                    id="verify-email-password"
                    type={showEmailPw ? 'text' : 'password'}
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0056b3]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmailPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showEmailPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="submit-email-update-btn"
                  type="submit"
                  disabled={emailBusy}
                  className="px-5 py-2 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] disabled:opacity-60 text-white font-extrabold text-xs shadow-md cursor-pointer inline-flex items-center gap-1.5"
                >
                  {emailBusy ? 'Verifying…' : 'Verify & Update Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CHANGE PASSWORD (VERIFIED) ==================== */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#ea580c]" />
                <h3 className="font-extrabold text-base text-[#0a0e2a]">Change Account Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordError && (
              <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-[#dc2626] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label htmlFor="verify-current-password" className="block text-xs font-bold text-slate-700 mb-1">
                  Current Password (Verification)
                </label>
                <div className="relative">
                  <input
                    id="verify-current-password"
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#ea580c]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="verify-new-password" className="block text-xs font-bold text-slate-700 mb-1">
                  New Password (Minimum 8 Characters)
                </label>
                <div className="relative">
                  <input
                    id="verify-new-password"
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#ea580c]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrengthMeter password={newPassword} />
              </div>

              <div>
                <label htmlFor="verify-confirm-password" className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  id="verify-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#ea580c]"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="submit-password-update-btn"
                  type="submit"
                  disabled={passwordBusy}
                  className="px-5 py-2 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] disabled:opacity-60 text-white font-extrabold text-xs shadow-md cursor-pointer inline-flex items-center gap-1.5"
                >
                  {passwordBusy ? 'Verifying…' : 'Verify & Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: DPDP ACCOUNT DELETION REQUEST ==================== */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-red-200 max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-red-600">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="font-extrabold text-base text-slate-900">Right to Erasure Request</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {deleteSubmitted ? (
              <div className="text-center py-4 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-extrabold text-base text-slate-900">Erasure Request Logged</h4>
                <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                  Your request has been logged pursuant to the Digital Personal Data Protection Act, 2023. Our Data Protection Officer will process erasure of your records within 30 working days.
                </p>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="mt-3 px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Please specify the reason for requesting account erasure. This will permanently remove your student profile, enrolled batches, and mock attempt history.
                </p>

                {deleteError && (
                  <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-[#dc2626]">
                    {deleteError}
                  </div>
                )}

                <div>
                  <label htmlFor="del-reason" className="block text-xs font-bold text-slate-700 mb-1">
                    Reason for Deletion (Optional)
                  </label>
                  <textarea
                    id="del-reason"
                    rows={2}
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="e.g. Competitive preparation completed, course ended..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={guardianConsent}
                    onChange={(e) => setGuardianConsent(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-red-600"
                  />
                  <span>
                    <strong>Statutory Guardian Consent:</strong> I confirm that parent/guardian consent is provided if this candidate is under 18 years of age.
                  </span>
                </label>

                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={async () => {
                      setIsDeleting(true);
                      setDeleteError('');
                      const res = await cgaService.requestAccountDeletion(deleteReason, guardianConsent);
                      setIsDeleting(false);
                      if (!res.success) {
                        setDeleteError(res.error || 'Failed to submit request.');
                        return;
                      }
                      setDeleteSubmitted(true);
                    }}
                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md cursor-pointer"
                  >
                    {isDeleting ? 'Submitting…' : 'Submit Deletion Request'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
