'use client';

import React, { useState, useEffect } from 'react';
import { User, Save, CheckCircle2, GraduationCap, MapPin, Phone, Mail, ShieldAlert, Trash2, X, AlertCircle } from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { cgaService } from '@/services/cgaService';

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
];

export default function StudentProfilePage() {
  const { currentStudent, updateStudentProfile } = useCga();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [address, setAddress] = useState('');
  const [qualification, setQualification] = useState('');
  const [targetExam, setTargetExam] = useState('');
  const [photo, setPhoto] = useState('');

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
      setPhone(currentStudent.phone);
      setGuardianName(currentStudent.guardianName);
      setAddress(currentStudent.address);
      setQualification(currentStudent.qualification);
      setTargetExam(currentStudent.targetExam);
      setPhoto(currentStudent.photo);
    }
  }, [currentStudent]);

  if (!currentStudent) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateStudentProfile(currentStudent.id, {
      name: name.trim(),
      phone: phone.trim(),
      guardianName: guardianName.trim(),
      address: address.trim(),
      qualification: qualification.trim(),
      targetExam: targetExam.trim(),
      photo,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0a0e2a]">My Student Profile</h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          View and update your personal details, profile photo, contact info, and enrolled C.G.A
          batches.
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
            {currentStudent.enrollments.map((enr) => (
              <div
                key={enr.courseId}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1"
              >
                <span className="font-extrabold text-[#0056b3]">{enr.batchName}</span>
                <p className="font-bold text-slate-900">{enr.courseName}</p>
                <p className="text-slate-500">Faculty: {enr.facultyName}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Form: Editable Profile Details */}
        <div className="lg:col-span-8">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-5"
          >
            <h2 className="text-lg font-extrabold text-[#0a0e2a] border-b border-slate-100 pb-3">
              Edit Personal & Academic Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Student Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Registered Email (Read-Only)
                </label>
                <input
                  type="email"
                  value={currentStudent.email}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mobile / WhatsApp Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Father / Mother / Guardian Name
                </label>
                <input
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Educational Qualification / Class
                </label>
                <input
                  type="text"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Target Examination Wing
                </label>
                <input
                  type="text"
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Residential Address (Udaipur / Tripura)
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Profile Changes
              </button>
            </div>
          </form>

          {/* Privacy & Account Deletion Section (DPDP Act 2023) */}
          <div className="mt-8 bg-white rounded-3xl border border-red-100 p-6 shadow-2xs space-y-4">
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

      {/* Account Deletion Request Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 text-red-600">
                <ShieldAlert className="w-6 h-6 shrink-0" />
                <h2 className="text-lg font-extrabold text-[#0a0e2a]">Request Account Deletion</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {deleteSubmitted ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h3 className="font-extrabold text-slate-900 text-sm">Deletion Request Received</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your request has been logged under reference. An administrator will verify the parental consent and process the permanent purge via the secure institute protocol within 7 business days.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteSubmitted(false);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#0056b3] text-white font-bold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setDeleteError('');
                  setIsDeleting(true);
                  const res = await cgaService.requestAccountDeletion(deleteReason, guardianConsent);
                  setIsDeleting(false);
                  if (!res.success) {
                    setDeleteError(res.error || 'Failed to submit request.');
                    return;
                  }
                  setDeleteSubmitted(true);
                }}
                className="space-y-4 text-xs"
              >
                {deleteError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{deleteError}</span>
                  </div>
                )}

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-slate-600">
                  <p className="font-bold text-slate-800">
                    Candidate: {currentStudent.name} ({currentStudent.studentCode})
                  </p>
                  <p>
                    All course admissions, mock test records, score attempts, fee receipts, and login credentials will be permanently erased.
                  </p>
                </div>

                <div>
                  <label htmlFor="del-reason" className="block font-bold text-slate-700 mb-1">
                    Reason for deletion (optional):
                  </label>
                  <textarea
                    id="del-reason"
                    rows={2}
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="E.g., Coaching course completed, shifting location..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Minor Guardian Consent Checkbox */}
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      id="del-consent"
                      type="checkbox"
                      checked={guardianConsent}
                      onChange={(e) => setGuardianConsent(e.target.checked)}
                      className="mt-0.5 accent-amber-600"
                      required
                    />
                    <span className="text-slate-700 leading-relaxed font-semibold">
                      Parent / Guardian Verification: For school students or candidates enrolled under parental care, I certify that my parent or legal guardian has approved this complete data erasure.
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isDeleting || !guardianConsent}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold cursor-pointer"
                  >
                    {isDeleting ? 'Submitting...' : 'Confirm Deletion Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
