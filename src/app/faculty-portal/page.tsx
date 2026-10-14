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
} from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { useCga } from '@/context/CgaContext';
import { cgaService } from '@/services/cgaService';
import { formatFacultyName } from '@/lib/names';

export default function FacultyPortalPage() {
  const router = useRouter();
  const { session, isHydrated, logout } = useCga();
  const [profileData, setProfileData] = useState<{
    profile: Record<string, any> | null;
    faculty: Record<string, any> | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicHeader />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-[#0a0e2a] via-[#1e2a5a] to-[#ea580c] text-white rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Presentation className="w-4 h-4" /> C.G.A Faculty Member
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {displayName}
            </h1>
            <p className="text-xs sm:text-sm text-orange-100 max-w-xl">
              Career Guidance Academy (C.G.A) Udaipur Digital Campus • Academic Mentorship Wing
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
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
            {/* Account Credentials Summary */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-[#0a0e2a] uppercase tracking-wider">
                Private Account Info
              </h3>
              <p className="text-xs text-slate-500">
                Used for account authentication and internal institute communications only.
              </p>

              <div className="space-y-3 pt-2 text-xs">
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Email</span>
                    <span className="font-semibold text-slate-800 truncate">{p?.email || session?.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Phone (WhatsApp)</span>
                    <span className="font-semibold text-slate-800">{p?.phone || 'Not specified'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Work Ability</span>
                    <span className="font-bold text-emerald-700">{f?.work_ability || 'Online & Offline'}</span>
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

      <PublicFooter />
    </div>
  );
}
