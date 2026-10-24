'use client';

import React, { useEffect, useState, useTransition, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { CgaLoadingScreen } from '@/components/ui/CgaLoadingScreen';

function NavigationLoaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);

  // Clear loading state whenever the route path or query changes
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    let safetyTimer: NodeJS.Timeout | null = null;

    const handleAnchorClick = (e: MouseEvent) => {
      // Find closest anchor tag
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      const targetAttr = target.getAttribute('target');
      const downloadAttr = target.getAttribute('download');

      // Ignore new tabs, downloads, external protocols, and empty links
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

      // Ignore hash jumps on the same page
      if (href.startsWith('#')) return;

      // Check if it's an internal link
      const isInternal = href.startsWith('/') || href.startsWith(window.location.origin);
      if (!isInternal) return;

      // Extract the target path
      try {
        const targetUrl = new URL(href, window.location.origin);
        const currentUrl = new URL(window.location.href);

        // If navigating to the exact same URL (pathname + search), ignore
        if (
          targetUrl.pathname === currentUrl.pathname &&
          targetUrl.search === currentUrl.search &&
          targetUrl.hash
        ) {
          return;
        }

        // If clicking same path without hash, also ignore
        if (targetUrl.pathname === currentUrl.pathname && targetUrl.search === currentUrl.search) {
          return;
        }

        // If navigation takes more than 400ms (meaning it's genuinely taking time to load),
        // show the official CGA loading screen
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          setIsNavigating(true);
        }, 400);

        // Safety timeout to prevent permanent lock if navigation gets cancelled
        if (safetyTimer) clearTimeout(safetyTimer);
        safetyTimer = setTimeout(() => {
          setIsNavigating(false);
        }, 8000);
      } catch {
        // Fallback: ignore malformed URLs
      }
    };

    document.addEventListener('click', handleAnchorClick, { capture: true });

    return () => {
      document.removeEventListener('click', handleAnchorClick, { capture: true });
      if (timer) clearTimeout(timer);
      if (safetyTimer) clearTimeout(safetyTimer);
    };
  }, []);

  if (!isNavigating) return null;

  return <CgaLoadingScreen fullScreen />;
}

export function GlobalNavigationLoader() {
  return (
    <Suspense fallback={null}>
      <NavigationLoaderInner />
    </Suspense>
  );
}

export default GlobalNavigationLoader;
