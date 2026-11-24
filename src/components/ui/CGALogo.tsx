'use client';

import React from 'react';
import Link from 'next/link';

interface CGALogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'dark' | 'light';
  href?: string;
}

export function CGALogo({
  size = 'md',
  showText = true,
  variant = 'dark',
  href = '/',
}: CGALogoProps) {
  const dimensions = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  }[size];

  const content = (
    <div className="inline-flex items-center gap-2.5 sm:gap-3 group select-none min-w-0">
      <div
        className={`${dimensions} relative rounded-full overflow-hidden bg-white shadow-xs ring-1 ring-slate-200/80 group-hover:ring-[#0056b3]/50 transition-all shrink-0 flex items-center justify-center`}
      >
        <img
          src="/cga-logo.webp"
          alt="Career Guidance Academy (C.G.A) Udaipur Official Logo"
          width={96}
          height={96}
          decoding="async"
          className="w-full h-full object-contain p-0.5"
        />
      </div>
      {showText && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-bold tracking-tight leading-snug truncate ${
                size === 'lg' || size === 'xl' ? 'text-lg sm:text-2xl' : 'text-sm sm:text-base'
              } ${variant === 'light' ? 'text-white' : 'text-[#0a0e2a]'}`}
            >
              Career Guidance Academy
            </span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-[#0056b3] text-white shrink-0">
              C.G.A
            </span>
          </div>
          <span
            className={`text-[11px] font-normal tracking-normal truncate ${
              variant === 'light' ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            Chanban, Udaipur • Tripura 799120
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0056b3] rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}
