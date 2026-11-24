'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  BellRing,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { UrgentPopupAnnouncement } from '@/data/initialSeedData';

const DISMISS_STORAGE_KEY = 'cga_urgent_popup_dismissed_sig';

/**
 * Helper to turn raw URLs inside plain announcement text into clickable links.
 */
function renderMessageWithLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, idx) => {
    if (/^https?:\/\/[^\s]+$/i.test(part)) {
      return (
        <a
          key={idx}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#0056b3] font-semibold underline underline-offset-2 break-all hover:text-[#1e3a8a]"
        >
          {part}
        </a>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export function UrgentAnnouncementModal() {
  const pathname = usePathname();
  const { db, isHydrated } = useCga();
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Do not pop up inside the Admin CMS editor while admin is editing it
  const isInsideAdminPortal = Boolean(pathname && pathname.startsWith('/admin'));

  const activeAnnouncements: UrgentPopupAnnouncement[] = useMemo(() => {
    const raw = db.siteContent?.urgentPopupAnnouncements;
    if (!Array.isArray(raw)) return [];
    return raw.filter((item) => item && item.isActive !== false && item.title?.trim());
  }, [db.siteContent?.urgentPopupAnnouncements]);

  // Unique signature of current active urgent announcements so any new or edited notice immediately triggers the popup
  const signature = useMemo(() => {
    if (activeAnnouncements.length === 0) return '';
    return activeAnnouncements
      .map((a) => `${a.id}:${a.updatedAt || a.date}:${a.title}:${a.linkUrl || ''}`)
      .join('|');
  }, [activeAnnouncements]);

  useEffect(() => {
    if (!isHydrated || isInsideAdminPortal || activeAnnouncements.length === 0 || !signature) {
      setIsOpen(false);
      return;
    }

    try {
      const dismissedSig = sessionStorage.getItem(DISMISS_STORAGE_KEY);
      if (dismissedSig !== signature) {
        setActiveIndex(0);
        setIsOpen(true);
      }
    } catch {
      setActiveIndex(0);
      setIsOpen(true);
    }
  }, [isHydrated, isInsideAdminPortal, activeAnnouncements.length, signature]);

  const handleClose = () => {
    setIsOpen(false);
    if (typeof window !== 'undefined' && signature) {
      try {
        sessionStorage.setItem(DISMISS_STORAGE_KEY, signature);
      } catch {}
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowRight' && activeAnnouncements.length > 1) {
        setActiveIndex((prev) => (prev + 1) % activeAnnouncements.length);
      } else if (e.key === 'ArrowLeft' && activeAnnouncements.length > 1) {
        setActiveIndex((prev) => (prev - 1 + activeAnnouncements.length) % activeAnnouncements.length);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, activeAnnouncements.length, signature]);

  if (!isOpen || activeAnnouncements.length === 0) {
    return null;
  }

  const safeIndex = Math.min(activeIndex, activeAnnouncements.length - 1);
  const current = activeAnnouncements[safeIndex];
  const total = activeAnnouncements.length;

  return (
    <div
      id="urgent-announcement-popup-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="urgent-announcement-popup-title"
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Crimson/Navy Institutional Accent Bar */}
        <div className="h-1.5 w-full bg-[#0a0e2a]" />

        {/* Header Bar with Official Emblem & Prominent Top-Right Close (X) Button */}
        <div className="px-5 sm:px-6 py-4 bg-slate-50 border-b border-slate-200/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/cga-logo.webp"
              alt="C.G.A Logo"
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-contain bg-white border border-slate-200 p-0.5 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider">
                  <BellRing className="w-3 h-3" /> {current.tag || 'Urgent Notice'}
                </span>
                {total > 1 && (
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold">
                    Notice {safeIndex + 1} of {total}
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-600 truncate mt-0.5">
                Career Guidance Academy (C.G.A) • Official Bulletin
              </p>
            </div>
          </div>

          {/* Top-Right Close (Cross) Button */}
          <button
            type="button"
            id="urgent-announcement-close-btn"
            onClick={handleClose}
            aria-label="Close urgent announcement"
            title="Close announcement and enter portal"
            className="w-9 h-9 rounded-xl bg-white hover:bg-red-50 text-slate-600 hover:text-[#dc2626] border border-slate-200 hover:border-red-200 flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slide Body Content */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-4 flex-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Calendar className="w-3.5 h-3.5 text-[#0056b3]" />
            <span>Published: {current.date}</span>
          </div>

          <h2
            id="urgent-announcement-popup-title"
            className="text-lg sm:text-xl font-bold text-[#0a0e2a] leading-snug tracking-tight"
          >
            {current.title}
          </h2>

          <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200/80 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {renderMessageWithLinks(current.message)}
          </div>

          {/* Optional Pasted URL / Link Action Button */}
          {current.linkUrl && (
            <div className="pt-1">
              <a
                href={current.linkUrl}
                target={current.linkUrl.startsWith('/') ? '_self' : '_blank'}
                rel="noopener noreferrer"
                id="urgent-announcement-link-btn"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span>{current.linkLabel || 'Open Official Notice / Attached Link'}</span>
              </a>
            </div>
          )}
        </div>

        {/* Footer: Carousel Prev/Next Controls (when multiple) + Continue to Portal */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200/90 flex flex-wrap items-center justify-between gap-3">
          {total > 1 ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveIndex((prev) => (prev - 1 + total) % total)}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 inline-flex items-center gap-1 cursor-pointer transition-colors"
                aria-label="Previous notice"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <div className="flex items-center gap-1.5 px-1">
                {activeAnnouncements.map((item, idx) => (
                  <button
                    key={item.id || idx}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    aria-label={`Go to notice ${idx + 1}`}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === safeIndex ? 'w-5 bg-[#0056b3]' : 'w-2 bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => setActiveIndex((prev) => (prev + 1) % total)}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 inline-flex items-center gap-1 cursor-pointer transition-colors"
                aria-label="Next notice"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <span className="text-[11px] font-medium text-slate-500">
              Use the top-right close button or Continue to enter the portal
            </span>
          )}

          <button
            type="button"
            id="urgent-announcement-continue-btn"
            onClick={handleClose}
            className="ml-auto px-4 py-2 rounded-xl bg-[#0a0e2a] hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <span>Continue to Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
