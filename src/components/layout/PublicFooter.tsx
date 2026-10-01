'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, ArrowUpRight, Shield, GraduationCap } from 'lucide-react';
import { CGALogo } from '@/components/ui/CGALogo';
import { useCga } from '@/context/CgaContext';

export function PublicFooter() {
  const { db } = useCga();
  const { contact } = db.siteContent;

  return (
    <footer className="bg-[#0a0e2a] text-slate-300 border-t-4 border-[#0056b3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1: Brand & Logo */}
          <div className="space-y-4">
            <CGALogo size="md" variant="light" />
            <p className="text-sm text-slate-400 leading-relaxed">
              {db.siteContent.tagline}. Empowering students across Gomati District and Tripura in
              Teaching Recruitment, Civil Services, Banking, SSC, Railways & Board Examinations.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="px-2.5 py-1 rounded-md bg-white/10 text-xs font-semibold text-white">
                TET / STGT / STPGT
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/10 text-xs font-semibold text-white">
                TPSC & JRBT
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/10 text-xs font-semibold text-white">
                TBSE & CBSE
              </span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ea580c]" />
              Quick Navigation
            </h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: '/about', label: 'About C.G.A Udaipur' },
                { href: '/courses', label: 'All Courses & Batch Status' },
                { href: '/achievements', label: 'Toppers & Rank-Holders' },
                { href: '/faculty', label: 'Our Expert Faculty' },
                { href: '/contact', label: 'Contact & Location Map' },
                { href: '/login', label: 'Student / Admin Portal Login' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-white inline-flex items-center gap-1 transition-colors"
                  >
                    {link.label}
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Course Wings */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#dc2626]" />
              Academic & Exam Wings
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link href="/courses?category=Teaching+and+Recruitment+Exams" className="hover:text-white">
                  • Teaching Exams (TET, STGT, STPGT)
                </Link>
              </li>
              <li>
                <Link href="/courses?category=Teaching+and+Recruitment+Exams" className="hover:text-white">
                  • State Civil & Recruitment (TPSC, JRBT)
                </Link>
              </li>
              <li>
                <Link href="/courses?category=Banking,+SSC+and+Railway" className="hover:text-white">
                  • Banking (IBPS/SBI), SSC & Railway
                </Link>
              </li>
              <li>
                <Link href="/courses?category=Other+Competitive+Examinations" className="hover:text-white">
                  • Police, Defence & CUET Entrance
                </Link>
              </li>
              <li>
                <Link href="/courses?category=School+Coaching" className="hover:text-white">
                  • Class VII to X — TBSE Board Batches
                </Link>
              </li>
              <li>
                <Link href="/courses?category=School+Coaching" className="hover:text-white">
                  • Class VII to X — CBSE Board Batches
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Official Contact Details */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0056b3]" />
              Udaipur Campus Address
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#ea580c] shrink-0 mt-1" />
                <span>{contact.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#ea580c] shrink-0" />
                <span>
                  {contact.phonePrimary} / {contact.phoneSecondary}
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#ea580c] shrink-0" />
                <span>{contact.email}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#ea580c] shrink-0" />
                <span>{contact.officeHours}</span>
              </li>
            </ul>

            <div className="mt-5 pt-4 border-t border-slate-800 flex items-center gap-2">
              <Link
                href="/login?role=student"
                className="flex-1 py-2 px-3 rounded-lg bg-[#0056b3] hover:bg-blue-600 text-white text-xs font-bold text-center inline-flex items-center justify-center gap-1.5"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Student Portal
              </Link>
              <Link
                href="/login?role=admin"
                className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold text-center inline-flex items-center justify-center gap-1.5 border border-slate-700"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                Admin Login
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} {db.siteContent.instituteName}, Udaipur, Tripura 799114. All
            Rights Reserved.
          </p>
          <p>Phase 1 Interactive Client Prototype • Powered by C.G.A Digital Campus</p>
        </div>
      </div>
    </footer>
  );
}
