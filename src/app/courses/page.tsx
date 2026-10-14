'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  BookOpen,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Printer,
  ShieldCheck,
  Award,
  ArrowRight,
  FileCheck,
} from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { CourseCard } from '@/components/public/CourseCard';
import { useCga } from '@/context/CgaContext';
import { CourseCategory, CourseMode } from '@/data/initialSeedData';

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
  const [selectedMode, setSelectedMode] = useState<'All' | CourseMode>('All');
  const [selectedCategory, setSelectedCategory] = useState<'All' | CourseCategory>('All');
  const [selectedBoard, setSelectedBoard] = useState<'All' | 'TBSE' | 'CBSE'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Open for Admission' | 'Batch Closed'>('All');

  const filteredCourses = useMemo(() => {
    return db.courses.filter((course) => {
      const matchesMode = selectedMode === 'All' || course.mode === selectedMode;

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

      return matchesMode && matchesCategory && matchesBoard && matchesStatus && matchesSearch;
    });
  }, [db.courses, selectedMode, selectedCategory, selectedBoard, statusFilter, searchQuery]);

  const standalonePackages = db.siteContent.standalonePackages || [];
  const publishedMockPackages = standalonePackages.filter(
    (p) => p.type === 'mock_test' && p.isPublished
  );
  const publishedMaterialPackages = standalonePackages.filter(
    (p) => p.type === 'study_material' && p.isPublished
  );

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedMode('All');
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
              2026–27 Academic & Competitive Session • Udaipur Center
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Course Catalogue & Live Batch Offerings
            </h1>
            <p className="text-blue-100 mt-2 max-w-3xl text-sm sm:text-base leading-relaxed">
              Explore comprehensive State and Central Government competitive programs offered in both 
              <strong> Offline Classroom</strong> and <strong>Online Interactive</strong> modes. 
              Students can also subscribe exclusively to Mock Test series or Study Material compendiums.
            </p>
          </div>
        </section>

        {/* Notes & Material Policy Banner */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 relative z-20">
          <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-[#1e3a8a] text-white rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/20 shrink-0">
                <Printer className="w-5 h-5 text-amber-200" />
              </div>
              <div className="text-xs sm:text-sm">
                <p className="font-extrabold text-white">
                  Offline Enrollment Benefit & Softcopy Security
                </p>
                <p className="text-amber-100 text-xs mt-0.5">
                  Students enrolling for <strong>Offline Batches</strong> receive complete <strong>physical printed notes & book handouts</strong> at our Udaipur academy. Softcopy PDFs for all batches are delivered in protected <strong>View-Only</strong> mode.
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 text-white text-xs font-bold shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-300" /> View-Only Softcopy Security
            </div>
          </div>
        </section>

        {/* Filter & Search Bar */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 relative z-10">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5 space-y-4">
            {/* Mode Selector Tabs (Offline vs Online) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  Class Delivery Mode:
                </span>
                <div className="inline-flex p-1 rounded-xl bg-slate-100 gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedMode('All')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      selectedMode === 'All'
                        ? 'bg-[#0056b3] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Batches ({db.courses.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMode('Offline')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      selectedMode === 'Offline'
                        ? 'bg-[#0056b3] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🏫 Offline Batches ({db.courses.filter((c) => c.mode === 'Offline').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMode('Online')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      selectedMode === 'Online'
                        ? 'bg-[#0056b3] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    💻 Online Batches ({db.courses.filter((c) => c.mode === 'Online').length})
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                <a href="#mock-test-section" className="text-[#0056b3] hover:underline">
                  Mock Test Series Only ↓
                </a>
                <span className="text-slate-300">•</span>
                <a href="#study-material-section" className="text-[#ea580c] hover:underline">
                  Study Materials Only ↓
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Search input */}
              <div className="md:col-span-6 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="course-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by exam (TCS/TPS, TET, STGT, JRBT, High Court, SSC, Railway, Banking)..."
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
                  <option value="TBSE">TBSE Board Only</option>
                  <option value="CBSE">CBSE Board Only</option>
                </select>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5 text-[#0056b3]" /> Exam Stream:
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
              Showing <strong className="text-[#0a0e2a]">{filteredCourses.length}</strong> batches
              {selectedMode !== 'All' ? ` (${selectedMode} Mode)` : ''}
            </p>
            {(searchQuery ||
              selectedMode !== 'All' ||
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
                Try clearing your search query or switching the delivery mode/exam stream filter.
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

        {/* ==================== STANDALONE MOCK TEST SERIES SECTION ==================== */}
        <section id="mock-test-section" className="bg-white border-y border-slate-200 py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="px-3 py-1 rounded-full bg-blue-50 text-[#0056b3] border border-blue-200 text-xs font-extrabold uppercase tracking-wider inline-block mb-2">
                  Standalone Subscription
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a0e2a]">
                  Mock Test Series Only (Full Session)
                </h2>
                <p className="text-sm text-slate-600 max-w-2xl mt-1">
                  Do not wish to attend classes? Enroll directly in full-session computer-based mock tests with Tripura state-level ranking, instant scorecards, and negative marking analysis.
                </p>
              </div>
            </div>

            {publishedMockPackages.length === 0 ? (
              <div className="bg-slate-50 rounded-3xl border border-slate-200 p-8 text-center max-w-2xl mx-auto">
                <Award className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h3 className="text-base font-extrabold text-slate-800">
                  New Session Test Series Being Finalized
                </h3>
                <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
                  Standalone mock test packages for TCS/TPS, TET, and Central Exams are being updated for the latest syllabus. To reserve early access or enquire, contact our Udaipur center.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0056b3] text-white text-xs font-bold"
                >
                  Enquire at Udaipur Office <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publishedMockPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[11px] font-bold text-[#0056b3] uppercase tracking-wider">
                        {pkg.targetExam}
                      </span>
                      <h3 className="text-lg font-extrabold text-[#0a0e2a] mt-1">{pkg.title}</h3>
                      <p className="text-xs text-slate-600 mt-2">{pkg.description}</p>
                      <ul className="mt-4 space-y-1.5 text-xs text-slate-700">
                        {pkg.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Subscription Fee
                        </span>
                        <span className="text-xl font-black text-[#0a0e2a]">
                          ₹{pkg.price.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <Link
                        href={`/student/tests?pkg=${pkg.id}`}
                        className="px-4 py-2 rounded-xl bg-[#0056b3] text-white text-xs font-bold inline-flex items-center gap-1"
                      >
                        Enroll in Series <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ==================== STANDALONE STUDY MATERIALS SECTION ==================== */}
        <section id="study-material-section" className="py-14 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div>
              <span className="px-3 py-1 rounded-full bg-orange-50 text-[#ea580c] border border-orange-200 text-xs font-extrabold uppercase tracking-wider inline-block mb-2">
                Standalone Notes Package
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a0e2a]">
                Study Material Packages Only (Full Session)
              </h2>
              <p className="text-sm text-slate-600 max-w-2xl mt-1">
                Purchase our complete compiled syllabus study materials and topic notes for the entire examination year without regular class enrollment. Softcopies view-only; physical copy option available at Udaipur center.
              </p>
            </div>

            {publishedMaterialPackages.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center max-w-2xl mx-auto">
                <FileCheck className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h3 className="text-base font-extrabold text-slate-800">
                  Curated Notes Compendiums Preparing for Release
                </h3>
                <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
                  Full session study materials for STGT, TET, and TPSC Combined are currently being bound and scheduled by C.G.A Udaipur faculty. Check back soon or visit our office.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ea580c] text-white text-xs font-bold"
                >
                  Contact Udaipur Office <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publishedMaterialPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[11px] font-bold text-[#ea580c] uppercase tracking-wider">
                        {pkg.targetExam}
                      </span>
                      <h3 className="text-lg font-extrabold text-[#0a0e2a] mt-1">{pkg.title}</h3>
                      <p className="text-xs text-slate-600 mt-2">{pkg.description}</p>
                      <ul className="mt-4 space-y-1.5 text-xs text-slate-700">
                        {pkg.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Notes Compendium Price
                        </span>
                        <span className="text-xl font-black text-[#0a0e2a]">
                          ₹{pkg.price.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <Link
                        href={`/student/materials?pkg=${pkg.id}`}
                        className="px-4 py-2 rounded-xl bg-[#ea580c] text-white text-xs font-bold inline-flex items-center gap-1"
                      >
                        Buy Material <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
