import React from 'react';

export function CourseCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="h-5 w-24 rounded-full cga-skeleton" />
        <div className="h-5 w-20 rounded-full cga-skeleton" />
      </div>
      <div className="space-y-2">
        <div className="h-6 w-4/5 rounded-lg cga-skeleton" />
        <div className="h-4 w-3/5 rounded-lg cga-skeleton" />
      </div>
      <div className="space-y-1.5 pt-2">
        <div className="h-3.5 w-full rounded cga-skeleton" />
        <div className="h-3.5 w-11/12 rounded cga-skeleton" />
        <div className="h-3.5 w-2/3 rounded cga-skeleton" />
      </div>
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-3 w-16 rounded cga-skeleton" />
          <div className="h-6 w-24 rounded-lg cga-skeleton" />
        </div>
        <div className="h-10 w-28 rounded-xl cga-skeleton" />
      </div>
    </div>
  );
}

export function TopperCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs flex flex-col">
      <div className="p-5 flex items-center gap-3.5 border-b border-slate-100">
        <div className="w-16 h-16 rounded-full shrink-0 cga-skeleton" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-20 rounded cga-skeleton" />
          <div className="h-5 w-32 rounded cga-skeleton" />
          <div className="h-3.5 w-24 rounded cga-skeleton" />
        </div>
      </div>
      <div className="p-5 space-y-2 bg-slate-50/50">
        <div className="h-3 w-full rounded cga-skeleton" />
        <div className="h-3 w-4/5 rounded cga-skeleton" />
        <div className="pt-2 flex justify-between">
          <div className="h-3 w-16 rounded cga-skeleton" />
          <div className="h-3 w-20 rounded cga-skeleton" />
        </div>
      </div>
    </div>
  );
}

export function FacultyCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-2xs flex flex-col items-center space-y-3">
      <div className="w-24 h-24 rounded-full cga-skeleton" />
      <div className="h-5 w-36 rounded-lg cga-skeleton" />
      <div className="h-3.5 w-24 rounded cga-skeleton" />
      <div className="h-5 w-28 rounded-full cga-skeleton" />
      <div className="w-full space-y-1.5 pt-2">
        <div className="h-3 w-full rounded cga-skeleton" />
        <div className="h-3 w-5/6 mx-auto rounded cga-skeleton" />
      </div>
    </div>
  );
}

export function PortalContentSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-150" aria-busy="true" aria-label="Loading portal content">
      <div className="rounded-3xl p-6 sm:p-8 bg-slate-900/90 text-white space-y-3">
        <div className="h-5 w-40 rounded-full bg-white/15 animate-pulse" />
        <div className="h-8 w-72 sm:w-96 rounded-xl bg-white/20 animate-pulse" />
        <div className="h-4 w-64 sm:w-80 rounded-lg bg-white/10 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl shrink-0 cga-skeleton" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-24 rounded cga-skeleton" />
              <div className="h-7 w-16 rounded-lg cga-skeleton" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <div className="h-6 w-48 rounded-lg cga-skeleton" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="p-4 rounded-2xl border border-slate-100 space-y-2">
              <div className="h-4 w-1/3 rounded cga-skeleton" />
              <div className="h-5 w-2/3 rounded cga-skeleton" />
              <div className="h-3 w-1/2 rounded cga-skeleton" />
            </div>
          ))}
        </div>
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <div className="h-6 w-44 rounded-lg cga-skeleton" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="p-3.5 rounded-2xl border border-slate-100 space-y-2">
              <div className="h-4 w-3/4 rounded cga-skeleton" />
              <div className="h-3 w-1/2 rounded cga-skeleton" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PublicPageSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50" aria-busy="true" aria-label="Loading page">
      {/* Header skeleton */}
      <div className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full cga-skeleton" />
          <div className="space-y-1.5">
            <div className="h-4 w-44 rounded cga-skeleton" />
            <div className="h-2.5 w-32 rounded cga-skeleton" />
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <div className="h-4 w-16 rounded cga-skeleton" />
          <div className="h-4 w-20 rounded cga-skeleton" />
          <div className="h-4 w-20 rounded cga-skeleton" />
          <div className="h-9 w-28 rounded-xl cga-skeleton" />
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="cga-gradient-hero py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="h-6 w-52 rounded-full bg-white/15 animate-pulse" />
          <div className="h-10 w-full max-w-2xl rounded-xl bg-white/20 animate-pulse" />
          <div className="h-5 w-full max-w-xl rounded-lg bg-white/10 animate-pulse" />
        </div>
      </div>

      {/* Cards grid skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CourseCardSkeleton />
          <CourseCardSkeleton />
          <CourseCardSkeleton />
        </div>
      </div>
    </div>
  );
}
