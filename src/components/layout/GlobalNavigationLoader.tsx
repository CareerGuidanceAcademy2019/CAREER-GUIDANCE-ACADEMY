'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { CgaLoadingScreen } from '@/components/ui/CgaLoadingScreen';

function NavigationLoaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isSlowNavigating, setIsSlowNavigating] = useState(false);
  const [isTopBarLoading, setIsTopBarLoading] = useState(false);

  // Clear loading states whenever the route path or query changes
  useEffect(() => {
    setIsSlowNavigating(false);
    setIsTopBarLoading(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    let topBarTimer: NodeJS.Timeout | null = null;
    let slowTimer: NodeJS.Timeout | null = null;
    let safetyTimer: NodeJS.Timeout | null = null;

    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      const targetAttr = target.getAttribute('target');
      const downloadAttr = target.getAttribute('download');

      if (
        !href ||
        targetAttr === '_blank' ||
        downloadAttr !== null ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('javascript:')
      ) {
        return;
      }

      if (href.startsWith('#')) return;

      const isInternal = href.startsWith('/') || href.startsWith(window.location.origin);
      if (!isInternal) return;

      try {
        const targetUrl = new URL(href, window.location.origin);
        const currentUrl = new URL(window.location.href);

        if (
          targetUrl.pathname === currentUrl.pathname &&
          targetUrl.search === currentUrl.search
        ) {
          return;
        }

        // Tier 1: Fast top glowing line after 80ms for instant tactile feedback
        if (topBarTimer) clearTimeout(topBarTimer);
        topBarTimer = setTimeout(() => {
          setIsTopBarLoading(true);
        }, 80);

        // Tier 2: Official CGA Logo loading screen only if navigation genuinely takes > 1200ms
        if (slowTimer) clearTimeout(slowTimer);
        slowTimer = setTimeout(() => {
          setIsSlowNavigating(true);
        }, 1200);

        // Safety timeout to reset if navigation was cancelled
        if (safetyTimer) clearTimeout(safetyTimer);
        safetyTimer = setTimeout(() => {
          setIsSlowNavigating(false);
          setIsTopBarLoading(false);
        }, 8000);
      } catch {}
    };

    document.addEventListener('click', handleAnchorClick, { capture: true });

    return () => {
      document.removeEventListener('click', handleAnchorClick, { capture: true });
      if (topBarTimer) clearTimeout(topBarTimer);
      if (slowTimer) clearTimeout(slowTimer);
      if (safetyTimer) clearTimeout(safetyTimer);
    };
  }, []);

  return (
    <>
      {/* Sleek top progress bar */}
      {isTopBarLoading && !isSlowNavigating && (
        <div
          role="progressbar"
          aria-label="Loading page"
          className="fixed top-0 left-0 right-0 h-[3px] z-[9999] overflow-hidden bg-transparent pointer-events-none"
        >
          <div className="h-full w-full bg-gradient-to-r from-[#0056b3] via-cyan-400 to-[#ea580c] animate-pulse" />
        </div>
      )}

      {/* Official CGA Loading Screen when navigation genuinely takes longer than 1.2s */}
      {isSlowNavigating && <CgaLoadingScreen fullScreen />}
    </>
  );
}

export function GlobalNavigationLoader() {
  return (
    <Suspense fallback={null}>
      <NavigationLoaderInner />
    </Suspense>
  );
}

export default GlobalNavigationLoader;
