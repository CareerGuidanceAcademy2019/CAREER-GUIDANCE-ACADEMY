'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  LogIn,
  ShieldCheck,
  GraduationCap,
  Presentation,
  Lock,
  UserRound,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  UserPlus,
} from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { useCga } from '@/context/CgaContext';
import { cgaService, PORTAL_HOME, type PortalRole } from '@/services/cgaService';
import { parseIdentifier } from '@/lib/names';

type Tab = PortalRole;

const TABS: {
  id: Tab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: string;
  title: string;
  subtitle: string;
  createHref: string;
  createLabel: string;
  createPrompt: string;
}[] = [
  {
    id: 'STUDENT',
    label: 'Student',
    icon: GraduationCap,
    active: 'bg-[#0056b3] text-white shadow-md',
    title: 'Sign In to Student Portal',
    subtitle: 'Use the email address or mobile number you registered with.',
    createHref: '/register',
    createLabel: 'Register as a New Student',
    createPrompt: 'New to C.G.A?',
  },
  {
    id: 'FACULTY',
    label: 'Faculty',
    icon: Presentation,
    active: 'bg-[#ea580c] text-white shadow-md',
    title: 'Sign In to Faculty Portal',
    subtitle: 'Faculty accounts can sign in once approved by the C.G.A administrator.',
    createHref: '/register/faculty',
    createLabel: 'Register as Faculty',
    createPrompt: 'Joining the C.G.A teaching team?',
  },
  {
    id: 'ADMIN',
    label: 'Admin',
    icon: ShieldCheck,
    active: 'bg-[#0a0e2a] text-white shadow-md',
    title: 'Sign In to Admin Control Panel',
    subtitle: 'Restricted to authorised Career Guidance Academy administrators.',
    createHref: '/register/admin',
    createLabel: 'Create Admin Password',
    createPrompt: 'On the admin access list but no password yet?',
  },
];

const PORTAL_PREFIX: Record<PortalRole, string> = {
  ADMIN: '/admin',
  FACULTY: '/faculty-portal',
  STUDENT: '/student',
};

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useCga();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('STUDENT');

  useEffect(() => {
    const t = params.get('as')?.toUpperCase();
    if (t === 'FACULTY' || t === 'ADMIN' || t === 'STUDENT') setActiveTab(t);
  }, [params]);

  const tab = TABS.find((t) => t.id === activeTab)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (honeypot) {
      // Bot trapped: artificial delay, generic error
      setBusy(true);
      await new Promise((r) => setTimeout(r, 600));
      setBusy(false);
      setError('Invalid email or password.');
      return;
    }

    if (!parseIdentifier(identifier)) {
      setError('Enter a valid email address or 10-digit mobile number.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setBusy(true);
    const res = await login(identifier, password);
    if (!res.success || !res.session) {
      setBusy(false);
      setError(res.error || 'Authentication failed.');
      return;
    }

    // Keep the selected tab honest, but allow ADMIN superuser to sign in from any tab
    if (res.session.role !== activeTab && res.session.role !== 'ADMIN') {
      await cgaService.logout();
      setBusy(false);
      const actual = TABS.find((t) => t.id === res.session!.role)?.label ?? 'another';
      setError(`This is a ${actual} account. Please use the ${actual} tab to sign in.`);
      return;
    }

    const next = params.get('next');
    // If admin signs in on a specific portal tab, direct them to that portal
    const targetRole = res.session.role === 'ADMIN' ? activeTab : res.session.role;
    router.push(next && next.startsWith(PORTAL_PREFIX[targetRole]) ? next : PORTAL_HOME[targetRole]);
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/cga-logo.png" alt="Career Guidance Academy (C.G.A) Logo" className="w-full h-full object-contain" />
              </div>
              <span className="inline-block px-2.5 py-0.5 rounded bg-white/15 text-amber-300 text-[11px] font-bold uppercase tracking-wider">
                Udaipur Digital Campus
              </span>
              <h1 className="text-2xl font-extrabold mt-2 leading-snug">Career Guidance Academy (C.G.A) Portal</h1>
              <p className="text-xs text-blue-100 mt-2 leading-relaxed">
                One sign-in for students, faculty and administrators. Use your email address or your
                registered mobile number with your password.
              </p>
            </div>

            <ul className="mt-8 space-y-2.5 text-[11px] text-blue-100">
              {TABS.map((t) => (
                <li key={t.id} className="flex items-start gap-2.5 bg-white/10 border border-white/15 rounded-xl p-3">
                  <t.icon className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">{t.label}:</strong> {t.subtitle}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Form Panel */}
          <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
            <div role="tablist" aria-label="Choose portal" className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl mb-6">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  id={`login-tab-${t.id.toLowerCase()}`}
                  role="tab"
                  aria-selected={activeTab === t.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(t.id);
                    setError('');
                  }}
                  className={`py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === t.id ? t.active : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                </button>
              ))}
            </div>

            <h2 className="text-2xl font-extrabold text-[#0a0e2a]">{tab.title}</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-6">{tab.subtitle}</p>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Anti-bot honeypot field */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="login-hp">Security Verification Field</label>
                <input
                  id="login-hp"
                  type="text"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {error && (
                <div role="alert" className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs font-semibold text-[#dc2626]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="login-identifier" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address or Mobile Number
                </label>
                <div className="relative">
                  <UserRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-identifier"
                    type="text"
                    inputMode="email"
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="you@example.com or 98XXXXXXXX"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="login-password" className="block text-xs font-bold text-slate-700">
                    Password
                  </label>
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
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                  />
                  <button
                    type="button"
                    id="login-toggle-password"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                disabled={busy}
                className="w-full py-3.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] disabled:opacity-60 text-white font-bold text-sm shadow-md inline-flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
              >
                <LogIn className="w-4 h-4" />
                {busy ? 'Signing in…' : `Sign In as ${tab.label}`}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-600">
              {tab.createPrompt}{' '}
              <Link
                id={`login-create-${tab.id.toLowerCase()}`}
                href={tab.createHref}
                className="font-extrabold text-[#0056b3] hover:underline inline-flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" /> {tab.createLabel}
              </Link>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
