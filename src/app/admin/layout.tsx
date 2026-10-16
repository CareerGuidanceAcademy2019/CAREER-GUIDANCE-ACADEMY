'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  CreditCard,
  FileText,
  ClipboardCheck,
  Trophy,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Globe,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Landmark,
} from 'lucide-react';
import { CGALogo } from '@/components/ui/CGALogo';
import { CustomAcademicEmblemSvg, CustomArrowRightSvg } from '@/components/ui/CustomIcons';
import { useCga } from '@/context/CgaContext';

const ADMIN_NAV = [
  { href: '/admin/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
  { href: '/admin/payments', label: 'Payment Verifications', icon: CreditCard, hasBadge: true },
  { href: '/admin/fees', label: 'Fee & Defaulters', icon: CreditCard },
  { href: '/admin/payment-settings', label: 'Bank & UPI Settings', icon: Landmark },
  { href: '/admin/access', label: 'Admin & Faculty Access', icon: ShieldCheck },
  { href: '/admin/students', label: 'Student Management', icon: Users },
  { href: '/admin/courses', label: 'Courses & Batch Control', icon: BookOpen },
  { href: '/admin/faculty', label: 'Faculty Management', icon: GraduationCap },
  { href: '/admin/materials', label: 'Study Materials (PDFs)', icon: FileText },
  { href: '/admin/tests', label: 'Mock Tests & Ranks', icon: ClipboardCheck },
  { href: '/admin/achievements', label: 'Toppers & Achievements', icon: Trophy },
  { href: '/admin/announcements', label: 'Batch Announcements', icon: Bell },
  { href: '/admin/site-content', label: 'Public Site CMS', icon: Settings },
];

export default function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isHydrated, session, logout, db } = useCga();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pendingPaymentsCount = db?.feePayments?.filter((p) => p.status === 'Pending').length || 0;

  const currentPageLabel =
    ADMIN_NAV.find((item) => pathname.startsWith(item.href))?.label || 'Admin Portal';

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-full border-4 border-[#0056b3] border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">Loading C.G.A Admin Control Panel...</p>
        </div>
      </div>
    );
  }

  // Strict Role-Based Access Control: Students cannot open Admin routes
  if (!session || session.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 text-[#dc2626] flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-red-50 text-[#dc2626] text-xs font-extrabold uppercase">
            Role-Based Access Restricted
          </span>
          <h1 className="text-xl font-extrabold text-[#0a0e2a]">
            {session?.role === 'STUDENT'
              ? 'Access Denied: Student Accounts Cannot Open Admin Pages'
              : 'Administrator Sign-In Required'}
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            This management console is restricted to Career Guidance Academy (C.G.A) administrators.
          </p>
          <div className="flex flex-col gap-2.5 pt-2">
            {!session && (
              <Link
                href="/login"
                className="w-full py-3 rounded-xl bg-[#ea580c] hover:bg-orange-600 text-white font-bold text-xs"
              >
                Sign In as Administrator
              </Link>
            )}
            {session?.role === 'STUDENT' && (
              <Link
                href="/student/dashboard"
                className="w-full py-2.5 rounded-xl bg-[#0056b3] text-white font-bold text-xs"
              >
                Return to Student Portal
              </Link>
            )}
            <Link
              href="/"
              className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs"
            >
              Back to Public Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 bg-[#0a0e2a] text-white shrink-0 border-r border-slate-800">
        <div className="p-5 border-b border-slate-800">
          <CGALogo size="sm" variant="light" href="/admin/dashboard" />
        </div>

        <div className="px-4 py-3 mx-4 mt-4 rounded-2xl bg-gradient-to-r from-[#0056b3]/40 to-[#ea580c]/30 border border-white/15">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 block">
            Administrator Console
          </span>
          <p className="text-xs font-extrabold text-white truncate mt-0.5">{session.name}</p>
          <p className="text-[11px] text-blue-200 truncate">{session.email}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Admin Sidebar">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-[#0056b3] text-white shadow-sm'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-amber-300' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
                {item.hasBadge && pendingPaymentsCount > 0 && (
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse">
                    {pendingPaymentsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            href="/"
            className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-blue-100 flex items-center justify-center gap-2"
          >
            <Globe className="w-3.5 h-3.5" /> View Live Public Site
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="w-full py-2 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-16 px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-700"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Link href="/admin/dashboard" className="hover:text-[#0056b3]">
                Admin Portal
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-extrabold text-[#0a0e2a]">{currentPageLabel}</span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-600">{session.name}</span>
          </div>
        </header>

        {/* Mobile Drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div className="fixed inset-0 bg-slate-900/60" onClick={() => setSidebarOpen(false)} />
            <div className="relative w-72 max-w-full bg-[#0a0e2a] text-white h-full flex flex-col z-10">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <CGALogo size="sm" variant="light" href="/admin/dashboard" />
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {ADMIN_NAV.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold ${
                        active ? 'bg-[#0056b3] text-white' : 'text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="truncate">{item.label}</span>
                      {item.hasBadge && pendingPaymentsCount > 0 && (
                        <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
                          {pendingPaymentsCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
