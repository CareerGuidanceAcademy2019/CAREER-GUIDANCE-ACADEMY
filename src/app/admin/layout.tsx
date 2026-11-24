'use client';

import React, { useState, useEffect } from 'react';
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
  Coins,
  KeyRound,
  UserCheck,
} from 'lucide-react';
import { CGALogo } from '@/components/ui/CGALogo';
import { PortalContentSkeleton } from '@/components/ui/PageSkeleton';
import { CustomAcademicEmblemSvg, CustomArrowRightSvg } from '@/components/ui/CustomIcons';
import { useCga } from '@/context/CgaContext';

const ADMIN_NAV = [
  { href: '/admin/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
  { href: '/admin/profile', label: 'My Profile & Security', icon: KeyRound },
  { href: '/admin/counter-enrollment', label: 'Counter Cash & Enrol', icon: Coins },
  { href: '/admin/payments', label: 'Payments, Fees & Defaulters', icon: CreditCard, hasBadge: true },
  { href: '/admin/payment-settings', label: 'Bank & UPI Settings', icon: Landmark },
  { href: '/admin/access', label: 'Admin & Faculty Access', icon: ShieldCheck },
  { href: '/admin/students', label: 'Student Management', icon: Users },
  { href: '/admin/enrollments', label: 'Course & Mock Enrollments', icon: UserCheck },
  { href: '/admin/courses', label: 'Courses & Batch Control', icon: BookOpen },
  { href: '/admin/faculty', label: 'Faculty Management', icon: GraduationCap },
  { href: '/admin/materials', label: 'Study Materials & Current Affairs', icon: FileText },
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
  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const openSidebar = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setSidebarOpen(true);
  };

  const scheduleCloseSidebar = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setSidebarOpen(false);
    }, 240);
  };

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  // Security Hardening: 15-minute idle inactivity timeout for Admin sessions
  useEffect(() => {
    if (!session || session.role !== 'ADMIN') return;
    const TIMEOUT_MS = 15 * 60 * 1000;
    let timer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
          await logout();
        } finally {
          router.push('/login?as=admin&reason=idle_timeout');
        }
      }, TIMEOUT_MS);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [session, logout, router]);

  const pendingPaymentsCount = db?.feePayments?.filter((p) => p.status === 'Pending').length || 0;

  const currentPageLabel =
    ADMIN_NAV.find((item) => pathname.startsWith(item.href))?.label ||
    (pathname.startsWith('/admin/mock-tests')
      ? 'Mock Test Studio & Preview'
      : pathname.startsWith('/admin/fees')
      ? 'Fees & Defaulters'
      : 'Overview');

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8fafc]">
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-16 px-4 sm:px-8 flex items-center gap-3">
          <div className="p-2 rounded-xl border border-slate-200 text-slate-700">
            <Menu className="w-5 h-5" />
          </div>
          <CGALogo size="sm" href="/admin/dashboard" />
        </header>
        <div className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <PortalContentSkeleton />
        </div>
      </div>
    );
  }

  // Strict Role-Based Access Control: Students cannot open Admin routes
  if (!session || session.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-xl bg-red-50 border border-red-200 text-[#dc2626] flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <span className="inline-block px-3 py-1 rounded-md bg-red-50 text-[#dc2626] text-xs font-bold uppercase tracking-wide">
            Role-Based Access Restricted
          </span>
          <h1 className="text-xl font-bold text-[#0a0e2a]">
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
    <div className="min-h-screen flex bg-[#f8fafc] relative">
      {/* Subtle Desktop Left-Edge Hover Zone so moving mouse to the left edge also reveals the drawer */}
      <div
        onMouseEnter={openSidebar}
        aria-hidden="true"
        className="hidden lg:block fixed top-16 left-0 bottom-0 w-2.5 z-30"
      />

      {/* Backdrop Overlay when Side Drawer is open */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[1px] transition-opacity duration-200"
        />
      )}

      {/* Collapsible Hover / Click Side Navigation Drawer (Hidden by default on all screens) */}
      <aside
        id="admin-collapsible-sidebar"
        onMouseEnter={openSidebar}
        onMouseLeave={scheduleCloseSidebar}
        aria-label="Admin Portal Navigation"
        aria-hidden={!sidebarOpen}
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 sm:w-76 max-w-[85vw] overflow-hidden bg-[#0b1120] text-white border-r border-slate-800/90 shadow-2xl flex flex-col transition-all duration-200 ease-out ${
          sidebarOpen ? 'translate-x-0 visible opacity-100' : '-translate-x-full invisible opacity-0 pointer-events-none'
        }`}
      >
        <div className="p-4 border-b border-slate-800/90 flex items-center justify-between gap-2 overflow-hidden">
          <div className="min-w-0 flex-1 overflow-hidden">
            <CGALogo size="sm" variant="light" href="/admin/dashboard" />
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation menu"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <Link
          href="/admin/profile"
          onClick={() => setSidebarOpen(false)}
          className="block px-3.5 py-3 mx-3.5 mt-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all group"
          title="Manage Admin Profile & Security"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
              Administrator Console
            </span>
            <span className="text-[11px] text-sky-300 group-hover:text-white flex items-center gap-1 font-medium">
              Security &rarr;
            </span>
          </div>
          <p className="text-xs font-semibold text-white truncate mt-1">{session.name}</p>
          <p className="text-[11px] text-slate-400 truncate">{session.email}</p>
        </Link>

        <nav className="flex-1 px-3 py-3.5 space-y-0.5 overflow-y-auto" aria-label="Admin Sidebar">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'bg-[#0056b3] text-white font-semibold shadow-2xs'
                    : 'text-slate-300 hover:bg-white/[0.07] hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
                {item.hasBadge && pendingPaymentsCount > 0 && (
                  <span className="ml-auto px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-bold">
                    {pendingPaymentsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3.5 border-t border-slate-800/90 space-y-1.5">
          <Link
            href="/"
            onClick={() => setSidebarOpen(false)}
            className="w-full py-2 px-3 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-xs font-medium text-slate-200 flex items-center justify-center gap-2 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" /> View Live Public Site
          </Link>
          <button
            type="button"
            onClick={() => {
              setSidebarOpen(false);
              logout();
              router.push('/login');
            }}
            className="w-full py-2 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 h-16 px-4 sm:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Three Bars Trigger Button: Opens Side Options on Mouse Hover OR Click/Tap */}
            <button
              type="button"
              id="admin-sidebar-trigger-btn"
              onMouseEnter={openSidebar}
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-[#0056b3] text-slate-700 hover:text-[#0056b3] transition-all cursor-pointer shadow-2xs shrink-0 flex items-center gap-2"
              aria-label="Open navigation options"
              aria-expanded={sidebarOpen}
              title="Hover or click to open portal menu"
            >
              <Menu className="w-5 h-5" />
              <span className="hidden sm:inline text-xs font-semibold">Menu</span>
            </button>

            <nav className="flex items-center gap-1.5 text-xs font-medium text-slate-500 min-w-0 truncate">
              <Link href="/admin/dashboard" className="hover:text-[#0056b3] shrink-0">
                Admin Portal
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold text-[#0a0e2a] truncate">{currentPageLabel}</span>
            </nav>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/admin/profile"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-[#0056b3] hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
              title="Manage Profile & Security"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#0056b3]" />
              <span className="max-w-[140px] sm:max-w-none truncate">{session.name}</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-8 lg:px-10 py-6 sm:py-9 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
