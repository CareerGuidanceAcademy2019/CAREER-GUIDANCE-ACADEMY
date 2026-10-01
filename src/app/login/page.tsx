'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LogIn,
  ShieldCheck,
  GraduationCap,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  KeyRound,
} from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { useCga } from '@/context/CgaContext';
import { DEMO_CREDENTIALS } from '@/data/initialSeedData';
import { CustomAcademicEmblemSvg, CustomArrowRightSvg } from '@/components/ui/CustomIcons';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useCga();

  const [email, setEmail] = useState(DEMO_CREDENTIALS.student.email);
  const [password, setPassword] = useState(DEMO_CREDENTIALS.student.password);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'STUDENT' | 'ADMIN'>('STUDENT');

  const handleTabSwitch = (role: 'STUDENT' | 'ADMIN') => {
    setActiveTab(role);
    setError('');
    if (role === 'STUDENT') {
      setEmail(DEMO_CREDENTIALS.student.email);
      setPassword(DEMO_CREDENTIALS.student.password);
    } else {
      setEmail(DEMO_CREDENTIALS.admin.email);
      setPassword(DEMO_CREDENTIALS.admin.password);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid registered email address.');
      return;
    }
    if (!password || password.length < 4) {
      setError('Please enter your password.');
      return;
    }

    const res = login(email, password);
    if (!res.success || !res.session) {
      setError(res.error || 'Authentication failed.');
      return;
    }

    if (res.session.role === 'ADMIN') {
      router.push('/admin/dashboard');
    } else {
      router.push('/student/dashboard');
    }
  };

  const handleInstantDemoLogin = (role: 'STUDENT' | 'ADMIN') => {
    const creds = role === 'ADMIN' ? DEMO_CREDENTIALS.admin : DEMO_CREDENTIALS.student;
    const res = login(creds.email, creds.password);
    if (res.success && res.session) {
      router.push(res.session.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicHeader />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Left Branding Panel */}
          <div className="lg:col-span-5 cga-gradient-hero text-white p-8 flex flex-col justify-between">
            <div>
              <div className="bg-white w-20 h-20 rounded-full p-1.5 shadow-lg mb-5">
                <img
                  src="/cga-logo.png"
                  alt="Career Guidance Academy (C.G.A) Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="inline-block px-2.5 py-0.5 rounded bg-white/15 text-amber-300 text-[11px] font-bold uppercase tracking-wider">
                Udaipur Digital Campus
              </span>
              <h1 className="text-2xl font-extrabold mt-2 leading-snug">
                Career Guidance Academy (C.G.A) Portal
              </h1>
              <p className="text-xs text-blue-100 mt-2 leading-relaxed">
                Sign in to access your enrolled courses, watermarked PDF books, timed mock tests,
                fee receipts, or the institute Administration Panel.
              </p>
            </div>

            {/* One-Click Demo Credentials Box */}
            <div className="mt-8 bg-white/10 backdrop-blur-xs border border-white/20 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-300 uppercase tracking-wider">
                <CustomAcademicEmblemSvg className="w-4 h-4" /> Instant Client Demo Login
              </div>

              <div className="space-y-2 text-xs">
                <button
                  type="button"
                  id="demo-student-login-btn"
                  onClick={() => handleInstantDemoLogin('STUDENT')}
                  className="w-full py-2.5 px-3 rounded-xl bg-white text-[#0a0e2a] hover:bg-blue-50 font-bold flex items-center justify-between shadow-sm transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#0056b3]" />
                    One-Click Student Portal
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#0056b3]" />
                </button>

                <button
                  type="button"
                  id="demo-admin-login-btn"
                  onClick={() => handleInstantDemoLogin('ADMIN')}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#ea580c] text-white hover:bg-orange-600 font-bold flex items-center justify-between shadow-sm transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    One-Click Admin Portal
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="pt-2 border-t border-white/15 text-[11px] text-blue-100 space-y-1">
                <p>
                  <strong>Student:</strong> {DEMO_CREDENTIALS.student.email} /{' '}
                  <code>{DEMO_CREDENTIALS.student.password}</code>
                </p>
                <p>
                  <strong>Admin:</strong> {DEMO_CREDENTIALS.admin.email} /{' '}
                  <code>{DEMO_CREDENTIALS.admin.password}</code>
                </p>
              </div>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
            {/* Role Selector Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => handleTabSwitch('STUDENT')}
                className={`py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'STUDENT'
                    ? 'bg-[#0056b3] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Student Login
              </button>
              <button
                type="button"
                onClick={() => handleTabSwitch('ADMIN')}
                className={`py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'ADMIN'
                    ? 'bg-[#0a0e2a] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Administrator Login
              </button>
            </div>

            <h2 className="text-2xl font-extrabold text-[#0a0e2a]">
              {activeTab === 'STUDENT' ? 'Sign In to Student Portal' : 'Sign In to Admin Control Panel'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-6">
              {activeTab === 'STUDENT'
                ? 'Demo credentials are pre-filled below for immediate evaluation.'
                : 'Restricted to authorized Career Guidance Academy (C.G.A) administrators.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs font-semibold text-[#dc2626]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">Password</label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-bold text-[#0056b3] hover:underline inline-flex items-center gap-1"
                  >
                    <KeyRound className="w-3 h-3" /> Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                  />
                </div>
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white font-bold text-sm shadow-md inline-flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
              >
                <LogIn className="w-4 h-4" />
                Sign In as {activeTab === 'ADMIN' ? 'Administrator' : 'Student'}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-600">
              New student aspiring to join C.G.A Udaipur?{' '}
              <Link
                href="/register"
                className="font-extrabold text-[#0056b3] hover:underline inline-flex items-center gap-1"
              >
                Register New Student Account <CustomArrowRightSvg className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
