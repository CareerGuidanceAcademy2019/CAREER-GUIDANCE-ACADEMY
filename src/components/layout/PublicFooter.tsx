'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, Phone, Mail, Clock, ArrowUpRight, Shield, GraduationCap } from 'lucide-react';
import { CGALogo } from '@/components/ui/CGALogo';
import { useCga } from '@/context/CgaContext';

interface PublicFooterProps {
  variant?: 'default' | 'auth';
}

export function PublicFooter({ variant = 'default' }: PublicFooterProps) {
  const pathname = usePathname();
  const isAuth = variant === 'auth' || pathname === '/login';
  const { db } = useCga();
  const { contact } = db.siteContent;

  if (isAuth) {
    return (
      <footer className="bg-[#0a0e2a] text-slate-300 border-t-2 border-[#0056b3] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <CGALogo size="sm" variant="light" />
            <div>
              <p className="font-semibold text-slate-200">Career Guidance Academy (C.G.A) Portal</p>
              <p className="text-[11px] text-slate-400">
                Offline Campus: Chanban (Behind Youthclub), Udaipur, Gomati Tripura — PIN: {contact.pincode || '799120'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms-and-conditions" className="hover:text-white transition-colors">
              Terms & Conditions
            </Link>
            <span>•</span>
            <span>© {new Date().getFullYear()} C.G.A Udaipur. All rights reserved.</span>
          </div>
        </div>
      </footer>
    );
  }

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
                { href: '/how-to-pay', label: 'How to Pay & Find UTR' },
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
                <span>{contact.address} (PIN: {contact.pincode || '799120'})</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#ea580c] shrink-0" />
                <span>
                  {contact.phoneSecondary && contact.phoneSecondary.trim() && contact.phoneSecondary !== contact.phonePrimary
                    ? `${contact.phonePrimary} / ${contact.phoneSecondary}`
                    : contact.phonePrimary}
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

        {/* Legal & Regulatory Compliance Row */}
        <div className="mt-10 pt-8 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs text-slate-400">
          <div>
            <span className="font-bold text-white uppercase tracking-wider block mb-2">Legal & Compliance</span>
            <ul className="space-y-1.5">
              <li>
                <Link href="/privacy-policy" className="hover:text-amber-400 transition-colors inline-block focus-visible:outline-2 focus-visible:outline-amber-400">
                  Privacy Policy (DPDP 2023)
                </Link>
              </li>
              <li>
                <Link href="/terms-and-conditions" className="hover:text-amber-400 transition-colors inline-block focus-visible:outline-2 focus-visible:outline-amber-400">
                  Terms and Conditions
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="hover:text-amber-400 transition-colors inline-block focus-visible:outline-2 focus-visible:outline-amber-400">
                  Cookie &amp; Tracking Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-amber-400 transition-colors inline-block focus-visible:outline-2 focus-visible:outline-amber-400">
                  Refund Policy (Connect with Admin)
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <span className="font-bold text-white uppercase tracking-wider block mb-2">Data Protection Officer</span>
            <p className="text-slate-400 leading-relaxed">
              Designated Grievance &amp; DPDP Officer: <strong>Subhradip Banik</strong><br />
              Email:{' '}
              <a href="mailto:careerguidanceacademy2019@gmail.com" className="hover:text-amber-400 underline">
                careerguidanceacademy2019@gmail.com
              </a><br />
              Phone: +91 70059 29189
            </p>
          </div>

          <div>
            <span className="font-bold text-white uppercase tracking-wider block mb-2">Registered Entity Details</span>
            <p className="text-slate-400 leading-relaxed">
              <strong>Career Guidance Academy (C.G.A)</strong><br />
              Chanban (Behind Youthclub), Udaipur, Gomati Tripura, India.<br />
              Legal Jurisdiction: Courts of Udaipur, Gomati District.
            </p>
          </div>

          <div>
            <span className="font-bold text-white uppercase tracking-wider block mb-2">Statutory Notice</span>
            <p className="text-slate-400 leading-relaxed">
              C.G.A is an autonomous coaching and tutoring institute. We are not affiliated with, endorsed by, or representing TRBT, JRBT, TBSE, or any government body.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} {db.siteContent.instituteName}, Udaipur, Gomati Tripura. All Rights Reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="hover:text-slate-300">Privacy</Link>
            <span>•</span>
            <Link href="/terms-and-conditions" className="hover:text-slate-300">Terms</Link>
            <span>•</span>
            <Link href="/cookie-policy" className="hover:text-slate-300">Cookies</Link>
            <span>•</span>
            <Link href="/refund-policy" className="hover:text-slate-300">Refunds</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
