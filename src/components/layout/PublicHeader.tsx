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
  RotateCcw,
} from 'lucide-react';
import { CGALogo } from '@/components/ui/CGALogo';
import { useCga } from '@/context/CgaContext';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About Us' },
  { href: '/courses', label: 'Courses' },
  { href: '/achievements', label: 'Achievements' },
  { href: '/faculty', label: 'Faculty' },
  { href: '/contact', label: 'Contact' },
];

export function PublicHeader() {
  const pathname = usePathname();
  const { db, session, logout } = useCga();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      {/* Top Academic Utility Bar */}
      <div className="bg-[#0a0e2a] text-white text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-blue-200">
              <MapPin className="w-3.5 h-3.5 text-[#ea580c] shrink-0" />
              <span className="truncate max-w-xs sm:max-w-none">
                {db.siteContent.contact.address}
              </span>
            </span>
            <a
              href={`tel:${db.siteContent.contact.phonePrimary}`}
              className="hidden md:inline-flex items-center gap-1.5 text-blue-100 hover:text-white font-medium"
            >
              <Phone className="w-3.5 h-3.5 text-[#ea580c]" />
              {db.siteContent.contact.phonePrimary}
            </a>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <span className="hidden lg:inline-block px-2 py-0.5 rounded bg-[#dc2626] text-[11px] font-bold tracking-wide">
              {db.siteContent.heroBadge}
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        <CGALogo size="md" />

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Main Navigation">
          {NAV_LINKS.map((item) => {
            const isActive =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-50 text-[#0056b3] font-bold shadow-2xs'
                    : 'text-slate-700 hover:text-[#0056b3] hover:bg-slate-50'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Auth / Portal Actions */}
        <div className="hidden sm:flex items-center gap-2.5">
          {session ? (
            <>
              <Link
                href={session.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard'}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-[#0056b3] text-white hover:bg-[#1e3a8a] shadow-sm transition-all"
              >
                {session.role === 'ADMIN' ? (
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                ) : (
                  <LayoutDashboard className="w-4 h-4" />
                )}
                {session.role === 'ADMIN' ? 'Admin Portal' : 'Student Portal'}
              </Link>
              <button
                type="button"
                onClick={logout}
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-[#dc2626] hover:bg-red-50 border border-slate-200 transition-colors cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                id="nav-login-btn"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-[#0056b3] bg-blue-50 hover:bg-blue-100 border border-blue-200/80 transition-all"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>
              <Link
                href="/register"
                id="nav-register-btn"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-[#0056b3] hover:bg-[#1e3a8a] shadow-sm transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Trigger */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2.5 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200"
          aria-label="Toggle Menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
                href={session.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard'}
                onClick={() => setMobileOpen(false)}
                className="w-full py-3 rounded-xl text-center text-sm font-bold bg-[#0056b3] text-white"
              >
                Go to {session.role === 'ADMIN' ? 'Admin Portal' : 'Student Portal'}
              </Link>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="py-2.5 rounded-xl text-center text-sm font-bold text-[#0056b3] bg-blue-50 border border-blue-200"
                >
                  Login
                </Link>
                <Link
                  href="/register"
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
