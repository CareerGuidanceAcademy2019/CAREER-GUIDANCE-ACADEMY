'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  LogOut,
  Menu,
  X,
  ChevronRight,
  Globe,
  Lock,
  RotateCcw,
} from 'lucide-react';
import { CGALogo } from '@/components/ui/CGALogo';
import { CustomAcademicEmblemSvg, CustomArrowRightSvg } from '@/components/ui/CustomIcons';
import { useCga } from '@/context/CgaContext';

const STUDENT_NAV = [
  { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/student/my-learning', label: 'My Learning', icon: GraduationCap },
  { href: '/student/profile', label: 'My Profile', icon: User },
  { href: '/student/courses', label: 'Course Catalogue & Enrol', icon: BookOpen },
  { href: '/student/my-courses', label: 'My Enrolled Courses', icon: BookOpen },
  { href: '/student/materials', label: 'Study Materials (PDFs)', icon: FileText },
  { href: '/student/tests', label: 'Mock Tests & Rank', icon: ClipboardCheck },
  { href: '/student/fees', label: 'Fees & Ledger', icon: CreditCard },
  { href: '/student/payments', label: 'My Payments & Proofs', icon: FileText },
  { href: '/student/achievements', label: 'Institute Toppers', icon: Trophy },
  { href: '/student/faculty', label: 'Our Faculty', icon: Users },
];

export default function StudentPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isHydrated, session, currentStudent, logout } = useCga();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentPageLabel =
    STUDENT_NAV.find((item) => pathname.startsWith(item.href))?.label || 'Student Portal';

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-full border-4 border-[#0056b3] border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">Loading C.G.A Student Portal...</p>
        </div>
      </div>
    );
  }

  // Role-based access check: STUDENT and ADMIN roles can access Student Portal
  if (!session || (session.role !== 'STUDENT' && session.role !== 'ADMIN')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center space-y-5">
          <img
            src="/cga-logo.png"
            alt="C.G.A Logo"
            className="w-20 h-20 rounded-full mx-auto object-contain border border-slate-200 p-1"
          />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#0056b3] text-xs font-bold">
            <Lock className="w-3.5 h-3.5" /> Student Portal Access Required
          </div>
          <h1 className="text-xl font-extrabold text-[#0a0e2a]">
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
    <div className="min-h-screen flex bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 bg-[#0a0e2a] text-white shrink-0 border-r border-slate-800">
        <div className="p-5 border-b border-slate-800/80">
          <CGALogo size="sm" variant="light" href="/student/dashboard" />
        </div>

        {/* Logged-in Student Summary */}
        {currentStudent && (
          <div className="p-4 mx-4 mt-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <img
              src={currentStudent.photo}
              alt={currentStudent.name}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-[#ea580c] shrink-0"
            />
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 block">
                {currentStudent.studentCode}
              </span>
              <p className="text-sm font-extrabold text-white truncate">{currentStudent.name}</p>
              <p className="text-[11px] text-blue-200 truncate">{currentStudent.targetExam}</p>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto" aria-label="Student Portal Sidebar">
          {STUDENT_NAV.map((item) => {
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
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            href="/"
            className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-blue-100 flex items-center justify-center gap-2 transition-colors"
          >
            <Globe className="w-3.5 h-3.5" /> Public Website
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="w-full py-2 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar with Breadcrumbs */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-16 px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-700"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumbs */}
            <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Link href="/student/dashboard" className="hover:text-[#0056b3]">
                Student Portal
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-extrabold text-[#0a0e2a]">{currentPageLabel}</span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {currentStudent && (
              <span className="text-xs font-bold text-slate-600">{currentStudent.name}</span>
            )}
          </div>
        </header>

        {/* Mobile Sidebar Drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/60"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative w-72 max-w-full bg-[#0a0e2a] text-white h-full flex flex-col z-10">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <CGALogo size="sm" variant="light" href="/student/dashboard" />
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {STUDENT_NAV.map((item) => {
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
                      <span>{item.label}</span>
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
