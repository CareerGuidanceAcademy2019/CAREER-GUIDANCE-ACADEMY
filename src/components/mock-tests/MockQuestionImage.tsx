'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, ZoomIn, X, AlertTriangle } from 'lucide-react';

interface MockQuestionImageProps {
  path?: string | null;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
  testId: string;
  type?: 'question' | 'group' | 'option' | 'explanation';
  className?: string;
  simulateSlowConnection?: boolean;
  onLoadSuccess?: () => void;
  onLoadError?: () => void;
}

export function MockQuestionImage({
  path,
  alt = 'Question diagram',
  width,
  height,
  testId,
  type = 'question',
  className = '',
  simulateSlowConnection = false,
  onLoadSuccess,
  onLoadError,
}: MockQuestionImageProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [watermarkNotice, setWatermarkNotice] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchSignedUrl = async () => {
    if (!path) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Cancel prior inflight fetch if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      if (simulateSlowConnection) {
        // Admin slow connection simulation: artificial 2000ms delay
        await new Promise((res) => setTimeout(res, 2000));
      }

      const res = await fetch(
        `/api/mock-tests/images?path=${encodeURIComponent(path)}&testId=${encodeURIComponent(testId)}&type=${type}`,
        { signal: controller.signal }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to fetch image (${res.status})`);
      }

      const data = await res.json();
      if (data.url) {
        setSignedUrl(data.url);
        onLoadSuccess?.();
      } else {
        throw new Error('No URL returned by server.');
      }
    } catch (err: unknown) {
      if ((err as any)?.name === 'AbortError') return;
      const message = err instanceof Error ? err.message : 'Failed to load diagram';
      setError(message);
      onLoadError?.();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignedUrl();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, testId, type, simulateSlowConnection]);

  if (!path) return null;

  // Aspect ratio styling to eliminate Cumulative Layout Shift (CLS)
  const aspectRatioStyle: React.CSSProperties =
    width && height && width > 0 && height > 0
      ? { aspectRatio: `${width} / ${height}` }
      : { minHeight: type === 'option' ? '90px' : '180px' };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setWatermarkNotice(true);
    setTimeout(() => setWatermarkNotice(false), 3000);
  };

  return (
    <div className={`relative my-2 select-none ${className}`}>
      {/* Notice deterrence banner if right-clicked or dragged */}
      {watermarkNotice && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-[#0a0e2a]/95 text-amber-300 text-[11px] font-semibold px-3 py-1.5 rounded-lg shadow-lg border border-amber-400/30 flex items-center gap-1.5 animate-in fade-in">
          <span>Official exam material: Copying or downloading is prohibited.</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div
          style={aspectRatioStyle}
          className="w-full max-w-full rounded-2xl bg-slate-100 border border-slate-200 animate-pulse flex flex-col items-center justify-center p-4 text-slate-400 text-xs gap-2"
        >
          <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-[#0056b3] animate-spin" />
          <span>Loading diagram...</span>
        </div>
      )}

      {/* Error state with retry */}
      {error && !loading && (
        <div
          style={aspectRatioStyle}
          className="w-full max-w-full rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col items-center justify-center p-4 text-center text-xs text-amber-800 gap-2"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchSignedUrl}
            className="mt-1 px-3 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Diagram
          </button>
        </div>
      )}

      {/* Loaded image */}
      {signedUrl && !loading && !error && (
        <div className="relative group inline-block max-w-full">
          <img
            src={signedUrl}
            alt={alt || 'Question diagram'}
            width={width || undefined}
            height={height || undefined}
            loading="lazy"
            draggable={false}
            onContextMenu={handleContextMenu}
            onDragStart={(e) => e.preventDefault()}
            onClick={() => setIsZoomed(true)}
            className={`rounded-2xl border border-slate-200 max-w-full object-contain cursor-zoom-in transition-transform duration-200 group-hover:scale-[1.005] ${
              type === 'option' ? 'max-h-40' : 'max-h-[480px]'
            }`}
          />

          {/* Quick Zoom Button */}
          <button
            type="button"
            title="Click or tap to view full size"
            onClick={() => setIsZoomed(true)}
            className="absolute bottom-2.5 right-2.5 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white opacity-80 group-hover:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Full Size Zoom Modal */}
      {isZoomed && signedUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 animate-in fade-in cursor-zoom-out backdrop-blur-xs"
          onClick={() => setIsZoomed(false)}
        >
          <div
            className="relative max-w-5xl max-h-[92vh] overflow-auto flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsZoomed(false)}
              className="absolute -top-11 right-0 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <img
              src={signedUrl}
              alt={alt || 'Question diagram full size'}
              draggable={false}
              onContextMenu={handleContextMenu}
              onDragStart={(e) => e.preventDefault()}
              className="rounded-xl max-w-full max-h-[85vh] object-contain shadow-2xl border border-white/20 select-none"
            />
            {alt && (
              <p className="mt-3 text-xs sm:text-sm text-slate-300 text-center font-medium bg-black/50 px-4 py-1.5 rounded-full border border-white/10">
                {alt}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MockQuestionImage;
