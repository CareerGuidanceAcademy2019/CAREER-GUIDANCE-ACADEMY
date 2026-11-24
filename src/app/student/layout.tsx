'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  User,
  BookOpen,
  GraduationCap,
  FileText,
  ClipboardCheck,
  CreditCard,
  Trophy,
  Users,
  Menu,
  X,
  ChevronRight,
  Globe,
  Lock,
} from 'lucide-react';
import { CGALogo } from '@/components/ui/CGALogo';
import { PortalContentSkeleton } from '@/components/ui/PageSkeleton';
import { useCga } from '@/context/CgaContext';

const STUDENT_NAV = [
  { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/student/my-learning', label: 'My Learning', icon: GraduationCap },
  { href: '/student/profile', label: 'My Profile', icon: User },
  { href: '/student/courses', label: 'Course Catalogue & Enrol', icon: BookOpen },
  { href: '/student/materials', label: 'Study Materials & Current Affairs', icon: FileText },
  { href: '/student/tests', label: 'Mock Tests & Rank', icon: ClipboardCheck },
  { href: '/student/fees', label: 'Fees & Ledger', icon: CreditCard },
  { href: '/student/payments', label: 'My Payments & Proofs', icon: FileText },
  { href: '/student/achievements', label: 'Institute Toppers', icon: Trophy },
  { href: '/student/faculty', label: 'Our Faculty', icon: Users },
];

export default function StudentPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isHydrated, session, currentStudent } = useCga();
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

  React.useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const currentPageLabel =
    STUDENT_NAV.find((item) => pathname.startsWith(item.href))?.label ||
    (pathname.startsWith('/student/my-courses') ? 'My Courses' : 'Dashboard');

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8fafc]">
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-16 px-4 sm:px-8 flex items-center gap-3">
          <div className="p-2 rounded-xl border border-slate-200 text-slate-700">
            <Menu className="w-5 h-5" />
          </div>
          <CGALogo size="sm" href="/student/dashboard" />
        </header>
        <div className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <PortalContentSkeleton />
        </div>
      </div>
    );
  }

  // Role-based access check: STUDENT and ADMIN roles can access Student Portal
  if (!session || (session.role !== 'STUDENT' && session.role !== 'ADMIN')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center space-y-5">
          <img
            src="/cga-logo.webp"
            alt="C.G.A Logo"
            width={80}
            height={80}
            decoding="async"
            className="w-20 h-20 rounded-full mx-auto object-contain border border-slate-200 p-1"
          />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 text-[#0056b3] text-xs font-bold">
            <Lock className="w-3.5 h-3.5" /> Student Portal Access Required
          </div>
          <h1 className="text-xl font-bold text-[#0a0e2a]">
            {session?.role === 'ADMIN'
              ? 'You are currently logged in as Administrator'
              : 'Please Sign In as a Student'}
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            This area is reserved for enrolled students of Career Guidance Academy (C.G.A), Udaipur.
            Please sign in with your student account.
          </p>
          <div className="flex flex-col gap-2.5 pt-2">
            {session?.role === 'ADMIN' && (
              <Link
                href="/admin/dashboard"
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Return to Admin Portal
              </Link>
            )}
            <Link
              href="/login"
              className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs"
            >
              Go to Full Login Screen
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f8fafc] relative">
      {/* Subtle Desktop Left-Edge Hover Zone */}
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
        id="student-collapsible-sidebar"
        onMouseEnter={openSidebar}
        onMouseLeave={scheduleCloseSidebar}
        aria-label="Student Portal Sidebar"
        aria-hidden={!sidebarOpen}
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 sm:w-76 max-w-[85vw] overflow-hidden bg-[#0b1120] text-white border-r border-slate-800/90 shadow-2xl flex flex-col transition-all duration-200 ease-out ${
          sidebarOpen ? 'translate-x-0 visible opacity-100' : '-translate-x-full invisible opacity-0 pointer-events-none'
        }`}
      >
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between gap-2 overflow-hidden">
          <div className="min-w-0 flex-1 overflow-hidden">
            <CGALogo size="sm" variant="light" href="/student/dashboard" />
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

        {/* Logged-in Student Summary */}
        {currentStudent && (
          <div className="p-3.5 mx-3.5 mt-3.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-3">
            <img
              src={currentStudent.photo}
              alt={currentStudent.name}
              className="w-10 h-10 rounded-full object-cover ring-1 ring-white/20 shrink-0"
            />
            <div className="min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-300 block">
                {currentStudent.studentCode}
              </span>
              <p className="text-xs font-semibold text-white truncate">{currentStudent.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{currentStudent.targetExam}</p>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" aria-label="Student Portal Sidebar">
          {STUDENT_NAV.map((item) => {
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
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3.5 border-t border-slate-800/90 space-y-1.5">
          <Link
            href="/"
            onClick={() => setSidebarOpen(false)}
            className="w-full py-2 px-3 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-xs font-medium text-slate-200 flex items-center justify-center gap-2 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" /> Public Website
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar with Three-Bars Hover/Click Trigger & Breadcrumbs */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 h-16 px-4 sm:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              id="student-sidebar-trigger-btn"
              onMouseEnter={openSidebar}
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-[#0056b3] text-slate-700 hover:text-[#0056b3] transition-all cursor-pointer shadow-2xs shrink-0 flex items-center gap-2"
              aria-label="Open menu"
              aria-expanded={sidebarOpen}
              title="Hover or click to open portal menu"
            >
              <Menu className="w-5 h-5" />
              <span className="hidden sm:inline text-xs font-semibold">Menu</span>
            </button>

            {/* Breadcrumbs */}
            <nav className="flex items-center gap-1.5 text-xs font-medium text-slate-500 min-w-0 truncate">
              <Link href="/student/dashboard" className="hover:text-[#0056b3] shrink-0">
                Student Portal
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold text-[#0a0e2a] truncate">{currentPageLabel}</span>
            </nav>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {currentStudent && (
              <span className="text-xs font-semibold text-slate-700 max-w-[140px] sm:max-w-none truncate">
                {currentStudent.name}
              </span>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-8 lg:px-10 py-6 sm:py-9 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
