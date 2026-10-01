'use client';

import React, { useState, useEffect } from 'react';
import { User, Save, CheckCircle2, GraduationCap, MapPin, Phone, Mail } from 'lucide-react';
import { useCga } from '@/context/CgaContext';

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
        </div>
      </div>
    </div>
  );
}
