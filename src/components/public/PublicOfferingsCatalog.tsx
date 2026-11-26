'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  BookOpen,
  ClipboardCheck,
  FileText,
  Search,
  Filter,
  RotateCcw,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Lock,
  Layers,
  Globe,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { CourseCard } from '@/components/public/CourseCard';
import { CourseCardSkeleton } from '@/components/ui/PageSkeleton';
import { CourseCategory, CourseMode, MOCK_SERIES_INITIAL } from '@/data/initialSeedData';

export type PublicCatalogTab = 'courses' | 'mock_tests' | 'study_materials';

const ALL_CATEGORIES: ('All' | CourseCategory)[] = [
  'All',
  'Teaching and Recruitment Exams',
  'Banking, SSC and Railway',
  'Other Competitive Examinations',
  'School Coaching',
];

const FLAGSHIP_SERIES_IDS = [
  'series-ttet-paper1',
  'series-ttet-paper2-sci',
  'series-ttet-paper2-soc',
];

const MOCK_CARD_GRADIENTS = [
  'from-blue-900 via-[#0056b3] to-indigo-900',
  'from-indigo-950 via-[#1e3a8a] to-blue-900',
  'from-slate-900 via-blue-950 to-indigo-950',
  'from-[#0c2340] via-[#1338be] to-[#0a1128]',
];

interface PublicOfferingsCatalogProps {
  defaultTab?: PublicCatalogTab;
  showHeaderTitle?: boolean;
}

export function PublicOfferingsCatalog({
  defaultTab = 'courses',
  showHeaderTitle = true,
}: PublicOfferingsCatalogProps) {
  const searchParams = useSearchParams();
  const { db, isDbLoading, session } = useCga();

  const [activeTab, setActiveTab] = useState<PublicCatalogTab>(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState<'All' | CourseMode>('All');
  const [selectedCategory, setSelectedCategory] = useState<'All' | CourseCategory>('All');
  const [selectedBoard, setSelectedBoard] = useState<'All' | 'TBSE' | 'CBSE'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Open for Admission' | 'Batch Closed'>('All');
  const [materialFilter, setMaterialFilter] = useState<'All' | 'Course Notes' | 'Current Affairs' | 'Mock Test PDF'>('All');

  // Sync active tab with URL ?tab= query parameter if provided
  useEffect(() => {
    const tabParam = (searchParams.get('tab') || '').toLowerCase();
    if (tabParam === 'mock_tests' || tabParam === 'mock-tests' || tabParam === 'tests') {
      setActiveTab('mock_tests');
    } else if (tabParam === 'study_materials' || tabParam === 'study-materials' || tabParam === 'materials') {
      setActiveTab('study_materials');
    } else if (tabParam === 'courses') {
      setActiveTab('courses');
    }
  }, [searchParams]);

  // 1. All Courses (existing + newly launched by Admin)
  const filteredCourses = useMemo(() => {
    return (db.courses || []).filter((course) => {
      const matchesMode = selectedMode === 'All' || course.mode === selectedMode;
      const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
      const matchesBoard = selectedBoard === 'All' || course.board === selectedBoard;
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

  // 2. All Active Mock Test Series (Flagship + All Competitive Series + Admin-launched new series)
  const activeMockSeriesList = useMemo(() => {
    const raw = db.mockSeries && db.mockSeries.length > 0 ? db.mockSeries : MOCK_SERIES_INITIAL;
    return raw.filter((s) => s.status !== 'Archived' && s.id !== 'series-current-affairs');
  }, [db.mockSeries]);

  const filteredMockSeries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return activeMockSeriesList.filter((s) => {
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.classRange || '').toLowerCase().includes(q) ||
        (s.stream || '').toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q)
      );
    });
  }, [activeMockSeriesList, searchQuery]);

  // Count how many tests belong to each series for the compact overview card
  const getSeriesTestCount = (seriesId: string): number => {
    const fromSeriesTests = (db.seriesTests || []).filter((t) => t.seriesId === seriesId).length;
    const fromMockTests = (db.mockTests || []).filter((t) => t.seriesId === seriesId).length;
    const total = Math.max(fromSeriesTests, fromMockTests);
    if (total > 0) return total;
    if (seriesId === 'series-ttet-paper1') return 32;
    if (seriesId.includes('paper2')) return 42;
    return 25;
  };

  // 3. All Study Materials & Notes (View-Only public overview cards)
  const allPublicMaterials = useMemo(() => {
    const mats = [...(db.studyMaterials || [])];
    // Ensure Current Affairs Series subscription card is also represented if not in studyMaterials
    const hasCaSeriesCard = mats.some((m) => m.id === 'series-current-affairs');
    if (!hasCaSeriesCard) {
      mats.unshift({
        id: 'series-current-affairs',
        title: 'Daily & Monthly Current Affairs Digest (Domestic & International)',
        courseId: 'series-current-affairs',
        courseName: 'All Tripura & Central Competitive Exams',
        type: 'Current Affairs',
        caCategory: 'Domestic',
        subject: 'Tripura GK, National & International Current Affairs',
        price: 49,
        author: 'C.G.A Editorial Board, Udaipur',
        pages: 120,
        fileSize: 'View-Only Digital PDF',
        uploadedDate: '2026-11-01',
        description:
          'Complete Domestic & International Current Affairs, Monthly GK Digest & Exam Capsules for Tripura TET, STGT, TPSC, Banking & SSC.',
        previewSections: [],
      });
    }
    return mats;
  }, [db.studyMaterials]);

  const filteredMaterials = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allPublicMaterials.filter((mat) => {
      if (materialFilter === 'Course Notes' && (mat.type === 'Current Affairs' || mat.type === 'Mock Test PDF')) {
        return false;
      }
      if (materialFilter === 'Current Affairs' && mat.type !== 'Current Affairs') {
        return false;
      }
      if (materialFilter === 'Mock Test PDF' && mat.type !== 'Mock Test PDF') {
        return false;
      }
      if (!q) return true;
      return (
        mat.title.toLowerCase().includes(q) ||
        (mat.courseName || '').toLowerCase().includes(q) ||
        (mat.subject || '').toLowerCase().includes(q) ||
        (mat.description || '').toLowerCase().includes(q)
      );
    });
  }, [allPublicMaterials, materialFilter, searchQuery]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedMode('All');
    setSelectedCategory('All');
    setSelectedBoard('All');
    setStatusFilter('All');
    setMaterialFilter('All');
  };

  return (
    <div className="space-y-6">
      {showHeaderTitle && (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#0056b3]">
              <Sparkles className="w-3.5 h-3.5 text-[#ea580c]" /> Official Portal Catalogue
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a0e2a] mt-1">
              Courses, Mock Test Series &amp; Study Materials
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Switch tabs below to browse Courses, Online Mock Tests, and Study Notes. Click <strong>Buy / Enrol</strong> to sign in and enroll.
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-[#0056b3] text-xs font-bold self-start md:self-auto shrink-0">
            <ShieldCheck className="w-4 h-4 text-[#0056b3]" />
            <span>Public View-Only Preview • Login to Buy</span>
          </div>
        </div>
      )}

      {/* ==================== SEPARATE CATEGORY SWITCHER TABS ==================== */}
      <div className="bg-white border-2 border-slate-200 p-2 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <button
          type="button"
          id="public-tab-courses"
          onClick={() => setActiveTab('courses')}
          className={`flex-1 py-3 px-4 text-xs sm:text-sm font-black flex items-center justify-center gap-2 cursor-pointer transition-all ${
            activeTab === 'courses'
              ? 'bg-[#064e3b] text-white shadow-md'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span>Courses &amp; Batches</span>
          <span
            className={`px-2 py-0.5 text-[11px] font-black ${
              activeTab === 'courses' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {db.courses.length}
          </span>
        </button>

        <button
          type="button"
          id="public-tab-mock-tests"
          onClick={() => setActiveTab('mock_tests')}
          className={`flex-1 py-3 px-4 text-xs sm:text-sm font-black flex items-center justify-center gap-2 cursor-pointer transition-all ${
            activeTab === 'mock_tests'
              ? 'bg-[#0056b3] text-white shadow-md'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <ClipboardCheck className="w-4 h-4 shrink-0" />
          <span>Mock Test Series</span>
          <span
            className={`px-2 py-0.5 text-[11px] font-black ${
              activeTab === 'mock_tests' ? 'bg-amber-400 text-slate-950' : 'bg-blue-100 text-[#0056b3]'
            }`}
          >
            {activeMockSeriesList.length}
          </span>
        </button>

        <button
          type="button"
          id="public-tab-study-materials"
          onClick={() => setActiveTab('study_materials')}
          className={`flex-1 py-3 px-4 text-xs sm:text-sm font-black flex items-center justify-center gap-2 cursor-pointer transition-all ${
            activeTab === 'study_materials'
              ? 'bg-[#ea580c] text-white shadow-md'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span>Study Materials &amp; Notes</span>
          <span
            className={`px-2 py-0.5 text-[11px] font-black ${
              activeTab === 'study_materials' ? 'bg-white text-[#ea580c]' : 'bg-orange-100 text-[#ea580c]'
            }`}
          >
            {allPublicMaterials.length}
          </span>
        </button>
      </div>

      {/* ==================== SEARCH & CONTEXTUAL FILTER BAR ==================== */}
      <div className="bg-white shadow-xs border border-slate-200 p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Contextual Sub-Filters based on activeTab */}
          {activeTab === 'courses' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                Delivery Mode:
              </span>
              <div className="inline-flex p-1 bg-slate-100 gap-1">
                {(['All', 'Offline', 'Online'] as const).map((m) => {
                  const count =
                    m === 'All'
                      ? db.courses.length
                      : db.courses.filter((c) => c.mode === m).length;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedMode(m)}
                      className={`px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                        selectedMode === m
                          ? 'bg-[#064e3b] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {m === 'All' ? `All Batches (${count})` : `${m} (${count})`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'mock_tests' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 bg-blue-50 text-[#0056b3] border border-blue-200 text-xs font-extrabold">
                TRBT &amp; TPSC CBT Exam Pattern • Bilingual (English + বাংলা)
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                Showing {filteredMockSeries.length} Live Mock Test Series Packages
              </span>
            </div>
          )}

          {activeTab === 'study_materials' && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mr-1">
                Material Type:
              </span>
              {(['All', 'Course Notes', 'Current Affairs', 'Mock Test PDF'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMaterialFilter(type)}
                  className={`px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                    materialFilter === type
                      ? 'bg-[#ea580c] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}

          {/* Universal Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'courses'
                  ? 'Search courses (TET, STGT, TCS/TPS, SSC...)'
                  : activeTab === 'mock_tests'
                  ? 'Search mock test series...'
                  : 'Search study materials & notes...'
              }
              className="w-full pl-9 pr-4 py-2 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
            />
          </div>
        </div>

        {/* Extra Course Category & Board Filters when on Courses Tab */}
        {activeTab === 'courses' && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5 text-[#064e3b]" /> Stream:
              </span>
              {ALL_CATEGORIES.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      if (cat !== 'School Coaching') setSelectedBoard('All');
                    }}
                    className={`px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-[#064e3b] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {(searchQuery ||
              selectedMode !== 'All' ||
              selectedCategory !== 'All' ||
              selectedBoard !== 'All' ||
              statusFilter !== 'All') && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#dc2626] hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ==================== TAB 1: ALL COURSES & BATCHES (COMPACT COURSE CARDS) ==================== */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          {isDbLoading && db.courses.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <CourseCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="bg-white border border-slate-200 p-10 text-center max-w-lg mx-auto">
              <BookOpen className="w-8 h-8 text-[#064e3b] mx-auto mb-3" />
              <h3 className="text-base font-extrabold text-[#0a0e2a]">No matching courses found</h3>
              <p className="text-xs text-slate-600 mt-1 mb-4">
                Try clearing your search query or switching the delivery mode filter.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 bg-[#064e3b] text-white text-xs font-bold cursor-pointer"
              >
                Reset Course Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course, idx) => (
                <CourseCard key={course.id} course={course} compact={true} index={idx} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 2: MOCK TEST SERIES (COMPACT OVERVIEW CARDS WITH PRICE & BUY BUTTON) ==================== */}
      {activeTab === 'mock_tests' && (
        <div className="space-y-5">
          {filteredMockSeries.length === 0 ? (
            <div className="bg-white border border-slate-200 p-10 text-center max-w-lg mx-auto">
              <ClipboardCheck className="w-8 h-8 text-[#0056b3] mx-auto mb-3" />
              <h3 className="text-base font-extrabold text-[#0a0e2a]">No matching mock test series found</h3>
              <p className="text-xs text-slate-600 mt-1 mb-4">
                Try clearing your search keyword to view all live mock test series.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 bg-[#0056b3] text-white text-xs font-bold cursor-pointer"
              >
                Show All Mock Tests
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMockSeries.map((series, idx) => {
                const isNewLaunch = !FLAGSHIP_SERIES_IDS.includes(series.id);
                const gradient = MOCK_CARD_GRADIENTS[idx % MOCK_CARD_GRADIENTS.length];
                const testCount = getSeriesTestCount(series.id);
                const mrpPrice = Math.max(series.price + 200, Math.round(series.price * 1.6));
                const saveAmount = mrpPrice - series.price;
                const discountPercent = Math.round((saveAmount / mrpPrice) * 100);
                const perTestCost = Math.max(4, Math.round(series.price / Math.max(10, testCount)));

                const targetTestBuyPath = `/student/tests?seriesId=${encodeURIComponent(series.id)}&buySeries=${encodeURIComponent(series.id)}`;
                const buyHref = session
                  ? targetTestBuyPath
                  : `/login?next=${encodeURIComponent(targetTestBuyPath)}`;

                const isClosed = series.status === 'Closed';

                return (
                  <div
                    key={series.id}
                    className={`bg-gradient-to-br ${gradient} p-5 text-white shadow-xl border border-white/15 cga-card-hover flex flex-col justify-between relative overflow-hidden`}
                  >
                    <div className="absolute top-0 right-0 w-28 h-28 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="space-y-3 relative z-10">
                      {/* Top Badges (Without Festival Offer tag) */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-0.5 bg-white/15 border border-white/25 text-white text-[10px] font-bold">
                            English + বাংলা
                          </span>
                          {isNewLaunch && (
                            <span className="px-2.5 py-0.5 font-black text-[10px] uppercase tracking-wider bg-emerald-400 text-slate-950">
                              {series.batchLabel || '2026 Batch'}
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] font-bold text-blue-200 truncate max-w-[160px]">
                          {series.classRange}
                        </span>
                      </div>

                      {/* Series Title (Increased Font Size) */}
                      <h3 className="text-lg sm:text-xl font-black leading-snug text-white line-clamp-2">
                        {series.name}
                      </h3>

                      {/* Single-Line Overview ONLY (as requested) */}
                      <p
                        className="text-xs text-blue-100 line-clamp-1 leading-relaxed"
                        title={series.description}
                      >
                        {series.description ||
                          'Daily Online Mock Tests Series with Sectional & Full-Length CBT Exams'}
                      </p>

                      {/* Compact Schedule / Test Count Line (Image 3 reference) */}
                      <div className="flex items-center justify-between gap-2 text-[11px] text-emerald-300 font-bold pt-0.5">
                        <span className="inline-flex items-center gap-1 truncate">
                          <Clock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                          <span className="truncate">{series.startsOn || 'Flexible / Online CBT'}</span>
                        </span>
                        <span className="px-2 py-0.5 bg-white/10 text-amber-200 font-extrabold shrink-0">
                          {testCount}+ Mock Tests
                        </span>
                      </div>

                      {/* Price & Discount Box (Image 1 + Image 3 hybrid) */}
                      <div className="p-3 bg-white/[0.08] border border-white/15 flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-amber-300">
                              ₹{series.price}/-
                            </span>
                            <span className="text-[10px] text-blue-200 font-bold uppercase">Only</span>
                            <span className="text-xs text-blue-300/75 line-through">
                              ₹{mrpPrice}
                            </span>
                          </div>
                          <p className="text-[11px] text-blue-100 font-semibold mt-0.5">
                            Only <strong className="text-emerald-300">₹{perTestCost}</strong> per test • {testCount} tests
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-block px-2 py-0.5 bg-[#ea580c] text-white text-[10px] font-black uppercase">
                            {discountPercent}% OFF
                          </span>
                          <span className="block text-[10px] font-bold text-amber-200 mt-0.5">
                            Save ₹{saveAmount}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Buy / Enrol Button */}
                    <div className="pt-4 mt-4 border-t border-white/15 relative z-10">
                      {isClosed ? (
                        <div className="w-full py-2.5 px-4 bg-white/10 border border-white/20 text-slate-300 font-extrabold text-xs flex items-center justify-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Enrollment Closed</span>
                        </div>
                      ) : (
                        <Link
                          href={buyHref}
                          className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                          <span>Buy / Enrol Mock Series @ ₹{series.price}/-</span>
                          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 3: STUDY MATERIALS & NOTES (COMPACT VIEW-ONLY CARDS WITH PRICE & BUY BUTTON) ==================== */}
      {activeTab === 'study_materials' && (
        <div className="space-y-5">
          {filteredMaterials.length === 0 ? (
            <div className="bg-white border border-slate-200 p-10 text-center max-w-lg mx-auto">
              <FileText className="w-8 h-8 text-[#ea580c] mx-auto mb-3" />
              <h3 className="text-base font-extrabold text-[#0a0e2a]">No matching study materials found</h3>
              <p className="text-xs text-slate-600 mt-1 mb-4">
                Try clearing your search or switching the material type filter.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 bg-[#ea580c] text-white text-xs font-bold cursor-pointer"
              >
                Show All Study Materials
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMaterials.map((mat) => {
                const isCa = mat.type === 'Current Affairs';
                const isMockPdf = mat.type === 'Mock Test PDF';
                const priceVal = mat.price !== undefined && mat.price !== null ? Number(mat.price) : 199;
                const displayPrice = isMockPdf ? 399 : priceVal === 0 ? 0 : priceVal;
                const mrpPrice = displayPrice === 0 ? 199 : Math.max(displayPrice + 150, Math.round(displayPrice * 1.5));
                const saveAmount = Math.max(50, mrpPrice - displayPrice);

                const targetMatBuyPath = isMockPdf && mat.seriesId
                  ? `/student/tests?seriesId=${encodeURIComponent(mat.seriesId)}&buySeries=${encodeURIComponent(mat.seriesId)}`
                  : `/student/materials?buy=${encodeURIComponent(mat.id)}`;
                const buyHref = session
                  ? targetMatBuyPath
                  : `/login?next=${encodeURIComponent(targetMatBuyPath)}`;

                return (
                  <div
                    key={mat.id}
                    className="bg-gradient-to-br from-[#1e1b4b] via-[#31102f] to-[#0f172a] p-5 text-white shadow-xl border border-white/15 cga-card-hover flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#ea580c] via-amber-400 to-pink-500" />

                    <div className="space-y-3 relative z-10">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
                        <span
                          className={`px-2.5 py-0.5 font-black text-[10px] uppercase tracking-wider ${
                            isCa
                              ? 'bg-amber-400 text-slate-950'
                              : isMockPdf
                              ? 'bg-cyan-400 text-slate-950'
                              : 'bg-orange-500 text-white'
                          }`}
                        >
                          {mat.type}
                        </span>

                        <span className="px-2 py-0.5 bg-white/10 border border-white/20 text-amber-200 text-[10px] font-bold">
                          {mat.pages || 45} Pages • View-Only PDF
                        </span>
                      </div>

                      {/* Subject & Title */}
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-orange-300 truncate">
                          {mat.subject || mat.courseName || 'All Competitive Exams'}
                        </p>
                        <h3 className="text-lg sm:text-xl font-black text-white leading-snug line-clamp-2 mt-0.5">
                          {mat.title}
                        </h3>
                      </div>

                      {/* Single-Line Overview ONLY */}
                      <p
                        className="text-xs text-white/80 line-clamp-1 leading-relaxed"
                        title={mat.description}
                      >
                        {mat.description || `Compiled by ${mat.author} for ${mat.courseName}.`}
                      </p>

                      {/* Price & Author Panel */}
                      <div className="p-3 bg-white/[0.08] border border-white/15 flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-amber-300">
                              {displayPrice === 0 ? 'FREE' : `₹${displayPrice}/-`}
                            </span>
                            {displayPrice > 0 && (
                              <>
                                <span className="text-[10px] text-white/75 font-bold uppercase">Only</span>
                                <span className="text-xs text-white/45 line-through">₹{mrpPrice}</span>
                              </>
                            )}
                          </div>
                          <p className="text-[11px] text-white/75 font-medium truncate max-w-[190px]">
                            By {mat.author || 'C.G.A Faculty'}
                          </p>
                        </div>

                        {displayPrice > 0 && (
                          <div className="text-right shrink-0">
                            <span className="inline-block px-2 py-0.5 bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-[10px] font-black uppercase">
                              Save ₹{saveAmount}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Buy Button */}
                    <div className="pt-4 mt-4 border-t border-white/15 relative z-10">
                      <Link
                        href={buyHref}
                        className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {displayPrice === 0
                            ? 'Login to Access Free PDF'
                            : isCa
                            ? `Buy Current Affairs @ ₹${displayPrice}/-`
                            : `Buy Study Material @ ₹${displayPrice}/-`}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
