import React from 'react';

interface SvgProps {
  className?: string;
}

/** Custom hand-crafted check badge SVG (replaces raw ✓ emoji) */
export function CustomCheckSvg({ className = 'w-3.5 h-3.5' }: SvgProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="7" fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5 8.2L7.1 10.3L11.2 5.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Custom hand-crafted cross mark SVG (replaces raw ✗ emoji) */
export function CustomCrossSvg({ className = 'w-3.5 h-3.5' }: SvgProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="7" fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5.6 5.6L10.4 10.4M10.4 5.6L5.6 10.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Custom hand-crafted directional arrow right SVG (replaces raw → character) */
export function CustomArrowRightSvg({ className = 'w-3.5 h-3.5' }: SvgProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path
        d="M3 8H12.5M12.5 8L8.8 4.3M12.5 8L8.8 11.7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Custom hand-crafted directional arrow left SVG (replaces raw ← character) */
export function CustomArrowLeftSvg({ className = 'w-3.5 h-3.5' }: SvgProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path
        d="M13 8H3.5M3.5 8L7.2 4.3M3.5 8L7.2 11.7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Custom hand-crafted Academic Torch / Crest Emblem SVG (replaces AI Sparkles icon) */
export function CustomAcademicEmblemSvg({ className = 'w-4 h-4' }: SvgProps) {
  return (
    <svg
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path
        d="M9 2L15 5V9.5C15 13.1 12.4 15.6 9 16.5C5.6 15.6 3 13.1 3 9.5V5L9 2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 9.2L8.3 11L11.8 7.3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Custom hand-crafted Waitlist Queue Emblem SVG */
export function CustomWaitlistSvg({ className = 'w-3.5 h-3.5' }: SvgProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      aria-hidden="true"
    >
      <rect x="2.5" y="3" width="11" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 6.5H10.5M5.5 9.5H8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
