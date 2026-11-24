'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Phone,
  MapPin,
  Menu,
  X,
  LogIn,
  UserPlus,
  LayoutDashboard,
  ShieldCheck,
  Presentation,
} from 'lucide-react';
import { CGALogo } from '@/components/ui/CGALogo';
import { useCga } from '@/context/CgaContext';
import { PORTAL_HOME } from '@/services/cgaService';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About Us' },
  { href: '/courses', label: 'Courses' },
  { href: '/achievements', label: 'Achievements' },
  { href: '/faculty', label: 'Faculty' },
  { href: '/contact', label: 'Contact' },
];

interface PublicHeaderProps {
  variant?: 'default' | 'auth';
}

export function PublicHeader({ variant = 'default' }: PublicHeaderProps) {
  const pathname = usePathname();
  const { db, session, logout } = useCga();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuth = variant === 'auth' || pathname === '/login';

  if (isAuth) {
    return (
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 sm:h-16 flex items-center justify-between gap-4">
          <CGALogo size="sm" />

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0056b3]" />
              Secure Portal Authentication
            </span>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-[#0056b3] hover:bg-slate-50 border border-slate-200 transition-all"
            >
              Main Website
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
      {/* Top Academic Utility Bar */}
      <div className="bg-[#0b1120] text-slate-200 text-xs py-2 px-4 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-4 min-w-0">
            <span className="inline-flex items-center gap-1.5 text-slate-300 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate max-w-[260px] sm:max-w-none">
                {db.siteContent.contact.address} (PIN: {db.siteContent.contact.pincode || '799120'})
              </span>
            </span>
            <a
              href={`tel:${db.siteContent.contact.phonePrimary}`}
              className="hidden md:inline-flex items-center gap-1.5 text-slate-200 hover:text-white font-medium shrink-0"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              {db.siteContent.contact.phonePrimary}
            </a>
          </div>

          <div className="flex items-center gap-3 ml-auto shrink-0">
            <span className="hidden lg:inline-block px-2.5 py-0.5 rounded bg-white/10 border border-white/15 text-[11px] font-medium text-amber-200 tracking-wide">
              {db.siteContent.heroBadge}
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 sm:h-16 flex items-center justify-between gap-3">
        <div className="min-w-0 shrink">
          <CGALogo size="sm" />
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1 shrink-0" aria-label="Main Navigation">
          {NAV_LINKS.map((item) => {
            const isActive =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-slate-100 text-[#0056b3] font-semibold'
                    : 'text-slate-700 hover:text-[#0056b3] hover:bg-slate-50'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Auth / Portal Actions */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {session ? (
            <>
              <Link
                href={PORTAL_HOME[session.role] ?? '/student/dashboard'}
                prefetch={true}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#0056b3] text-white hover:bg-[#1e3a8a] shadow-2xs transition-all whitespace-nowrap"
              >
                {session.role === 'ADMIN' ? (
                  <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0" />
                ) : session.role === 'FACULTY' ? (
                  <Presentation className="w-4 h-4 text-amber-300 shrink-0" />
                ) : (
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                )}
                {session.role === 'ADMIN'
                  ? 'Admin Portal'
                  : session.role === 'FACULTY'
                  ? 'Faculty Portal'
                  : 'Student Portal'}
              </Link>
              <button
                type="button"
                onClick={logout}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-[#dc2626] hover:bg-red-50 border border-slate-200 transition-colors cursor-pointer whitespace-nowrap"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                id="nav-login-btn"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-[#0056b3] bg-white hover:bg-slate-50 border border-slate-200 transition-all whitespace-nowrap"
              >
                <LogIn className="w-4 h-4 text-[#0056b3]" />
                Login
              </Link>
              <Link
                href="/register"
                id="nav-register-btn"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#0056b3] hover:bg-[#1e3a8a] shadow-2xs transition-all whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4" />
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile / Tablet Menu Trigger */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2.5 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 shrink-0 cursor-pointer"
          aria-label="Toggle Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-slate-200 px-4 pt-3 pb-6 space-y-3 shadow-xl">
          <div className="grid grid-cols-2 gap-1.5">
            {NAV_LINKS.map((item) => {
              const isActive =
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                    isActive
                      ? 'bg-blue-50 text-[#0056b3] font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {session ? (
              <Link
                href={PORTAL_HOME[session.role] ?? '/student/dashboard'}
                prefetch={true}
                onClick={() => setMobileOpen(false)}
                className="w-full py-3 rounded-xl text-center text-sm font-bold bg-[#0056b3] text-white"
              >
                Go to{' '}
                {session.role === 'ADMIN'
                  ? 'Admin Portal'
                  : session.role === 'FACULTY'
                  ? 'Faculty Portal'
                  : 'Student Portal'}
              </Link>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  href="/login"
                  prefetch={true}
                  onClick={() => setMobileOpen(false)}
                  className="py-2.5 rounded-xl text-center text-sm font-bold text-[#0056b3] bg-blue-50 border border-blue-200"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  prefetch={true}
                  onClick={() => setMobileOpen(false)}
                  className="py-2.5 rounded-xl text-center text-sm font-bold text-white bg-[#0056b3]"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
