'use client';

import React from 'react';
import { getNameInitials, getAvatarGradient } from '@/lib/avatarGenerator';

interface TopperAvatarProps {
  name: string;
  photo?: string;
  sizeClassName?: string;
  textClassName?: string;
  className?: string;
}

export function TopperAvatar({
  name,
  photo,
  sizeClassName = 'w-16 h-16',
  textClassName = 'text-base font-extrabold',
  className = '',
}: TopperAvatarProps) {
  // If a valid image photo is supplied (and not an old placeholder), we can show it or fallback to initials
  const isCustomPhoto =
    Boolean(photo) &&
    typeof photo === 'string' &&
    photo.length > 10 &&
    !photo.includes('placeholder') &&
    !photo.startsWith('data:image/svg+xml');

  if (isCustomPhoto) {
    return (
      <img
        src={photo}
        alt={`Topper ${name}`}
        onError={(e) => {
          // If external photo fails, fallback to SVG initials
          const [c1, c2] = getAvatarGradient(name);
          const parent = e.currentTarget.parentElement;
          if (parent) {
            e.currentTarget.style.display = 'none';
          }
        }}
        className={`${sizeClassName} rounded-full object-cover shrink-0 ring-2 ring-[#ea580c] shadow-xs ${className}`}
      />
    );
  }

  const initials = getNameInitials(name);
  const [c1, c2] = getAvatarGradient(name);

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
      }}
      aria-label={`Avatar for ${name}`}
      className={`${sizeClassName} rounded-full flex items-center justify-center text-white shrink-0 shadow-xs ring-2 ring-white/80 select-none ${className}`}
    >
      <span className={`${textClassName} tracking-wider`}>{initials}</span>
    </div>
  );
}

