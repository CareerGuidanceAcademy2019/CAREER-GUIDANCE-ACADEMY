'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, BookOpen, CheckCircle2, RotateCcw } from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { CourseCard } from '@/components/public/CourseCard';
import { useCga } from '@/context/CgaContext';
import { CourseCategory } from '@/data/initialSeedData';

const ALL_CATEGORIES: ('All' | CourseCategory)[] = [
  'All',
  'Teaching and Recruitment Exams',
  'Banking, SSC and Railway',
  'Other Competitive Examinations',
  'School Coaching',
];

export default function CoursesCataloguePage() {
  const { db } = useCga();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | CourseCategory>('All');
  const [selectedBoard, setSelectedBoard] = useState<'All' | 'TBSE' | 'CBSE'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Open for Admission' | 'Batch Closed'>('All');

  const filteredCourses = useMemo(() => {
    return db.courses.filter((course) => {
      const matchesCategory =
        selectedCategory === 'All' || course.category === selectedCategory;

      const matchesBoard =
        selectedBoard === 'All' || course.board === selectedBoard;

      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Open for Admission'
          ? course.status === 'Open for Admission' && course.seatsAvailable > 0
          : course.status === 'Batch Closed' || course.seatsAvailable === 0);

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        course.name.toLowerCase().includes(q) ||
        course.subCategory.toLowerCase().includes(q) ||
        course.facultyName.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q);

      return matchesCategory && matchesBoard && matchesStatus && matchesSearch;
    });
  }, [db.courses, selectedCategory, selectedBoard, statusFilter, searchQuery]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedBoard('All');
    setStatusFilter('All');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicHeader />

      <main className="flex-1">
        {/* Page Banner */}
        <section className="cga-gradient-hero text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
              2026–27 Academic & Competitive Session
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Course Catalogue & Live Batch Availability
            </h1>
            <p className="text-blue-100 mt-2 max-w-3xl text-sm sm:text-base">
              Browse all coaching programmes at Career Guidance Academy (C.G.A), Udaipur — including
              TET, STGT, STPGT, TPSC, JRBT, Banking, SSC, Railway, and separate TBSE & CBSE batches
              for Classes VII to X.
            </p>
          </div>
        </section>

        {/* Filter & Search Bar */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Search input */}
              <div className="md:col-span-6 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="course-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by exam (e.g., TET, STGT, TPSC, JRBT, IBPS, Class X, TBSE, CBSE)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>

              {/* Status Filter */}
              <div className="md:col-span-3">
                <select
                  id="course-status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                >
                  <option value="All">All Batch Statuses</option>
                  <option value="Open for Admission">Open for Admission Only</option>
                  <option value="Batch Closed">Batch Closed / Full</option>
                </select>
              </div>

              {/* School Board Sub-filter */}
              <div className="md:col-span-3">
                <select
                  id="course-board-filter"
                  value={selectedBoard}
                  onChange={(e) => {
                    const val = e.target.value as 'All' | 'TBSE' | 'CBSE';
                    setSelectedBoard(val);
                    if (val !== 'All') {
                      setSelectedCategory('School Coaching');
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                >
                  <option value="All">All Boards (Competitive + TBSE/CBSE)</option>
                  <option value="TBSE">TBSE Board Only (Class VII–X)</option>
                  <option value="CBSE">CBSE Board Only (Class VII–X)</option>
                </select>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5 text-[#0056b3]" /> Category:
              </span>
              {ALL_CATEGORIES.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      if (cat !== 'School Coaching') {
                        setSelectedBoard('All');
                      }
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-[#0056b3] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Course Listing Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm font-semibold text-slate-600">
              Showing <strong className="text-[#0a0e2a]">{filteredCourses.length}</strong> of{' '}
              {db.courses.length} courses
            </p>
            {(searchQuery ||
              selectedCategory !== 'All' ||
              selectedBoard !== 'All' ||
              statusFilter !== 'All') && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#dc2626] hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear All Filters
              </button>
            )}
          </div>

          {filteredCourses.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0056b3] flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-[#0a0e2a]">
                No matching courses found
              </h3>
              <p className="text-sm text-slate-600 mt-1 mb-5">
                Try clearing your search query or switching the category/board filter.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="px-5 py-2.5 rounded-xl bg-[#0056b3] text-white text-xs font-bold"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
