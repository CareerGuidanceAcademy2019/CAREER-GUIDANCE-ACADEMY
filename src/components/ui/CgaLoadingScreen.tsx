'use client';

import React from 'react';
import Image from 'next/image';

interface CgaLoadingScreenProps {
  fullScreen?: boolean;
  className?: string;
}

/**
 * CGA Official Loading Screen
 * STRICT SPECIFICATION:
 * Only contains the CGA logo and a spinning circular ring around the logo.
 * No text, no distractions.
 */
export function CgaLoadingScreen({ fullScreen = true, className = '' }: CgaLoadingScreenProps) {
  const containerClasses = fullScreen
    ? 'fixed inset-0 z-[999999] flex items-center justify-center bg-white/95 backdrop-blur-md pointer-events-auto select-none transition-opacity duration-200'
    : 'min-h-[60vh] w-full flex items-center justify-center p-8 select-none';

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`${containerClasses} ${className}`}
      id="cga-global-loading-screen"
    >
      <div className="relative flex items-center justify-center">
        {/* Outer Circular Track & Animated Spinning Ring */}
        <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center">
          {/* Subtle circular background track */}
          <div className="absolute inset-0 rounded-full border-4 border-slate-100/90" />
          
          {/* Primary animated spinning circle around the logo */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#0056b3] border-r-[#0056b3] animate-spin" />

          {/* Centered Circular CGA Logo */}
          <div className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white p-1.5 shadow-sm overflow-hidden flex items-center justify-center">
            <Image
              src="/cga-logo.png"
              alt="Career Guidance Academy"
              width={96}
              height={96}
              priority
              className="w-full h-full object-contain rounded-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CgaLoadingScreen;
