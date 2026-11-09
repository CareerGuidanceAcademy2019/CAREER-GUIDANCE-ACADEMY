'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  Trophy,
  Users,
  FileCheck,
  Bell,
  Plus,
  Trash2,
  AlertCircle,
  Calendar,
  Shield,
  X,
  Camera,
  Upload,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { CourseCard } from '@/components/public/CourseCard';
import { useCga } from '@/context/CgaContext';
import { CustomAcademicEmblemSvg, CustomArrowRightSvg } from '@/components/ui/CustomIcons';
import { getFacultyAvatarUrl, formatFacultyName } from '@/lib/names';
import { Announcement, CampusGalleryImage, INITIAL_SEED_DATA } from '@/data/initialSeedData';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { compressCampusPhoto, type CompressionResult } from '@/lib/imageCompressor';

export default function HomePage() {
  const router = useRouter();
  const { db, session, saveAnnouncement, deleteAnnouncement, updateSiteContent, showToast } = useCga();
  const { siteContent, courses, achievements, faculty, announcements = [] } = db;

  // Auto-detect recovery code or token from email redirect and forward immediately to reset-password
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const hash = window.location.hash;
    if (code || hash.includes('type=recovery') || hash.includes('access_token')) {
      router.push(`/reset-password${window.location.search}${window.location.hash}`);
    }
  }, [router]);

  // Front Banner: Academy Highlights vs Classroom Tour state
  const [heroTab, setHeroTab] = useState<'stats' | 'campus'>('stats');
  const [activeCampusIdx, setActiveCampusIdx] = useState(0);
  const [showCampusModal, setShowCampusModal] = useState(false);
  const [campusPhotoTitle, setCampusPhotoTitle] = useState('');
  const [campusPhotoCaption, setCampusPhotoCaption] = useState('');
  const [compressedResult, setCompressedResult] = useState<CompressionResult | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSavingCampus, setIsSavingCampus] = useState(false);
  const campusFileInputRef = React.useRef<HTMLInputElement>(null);

  const campusImages: CampusGalleryImage[] =
    siteContent.campusImages && siteContent.campusImages.length > 0
      ? siteContent.campusImages
      : INITIAL_SEED_DATA.siteContent.campusImages || [];

  const handleCampusPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(true);
    try {
      const result = await compressCampusPhoto(file);
      setCompressedResult(result);
      if (!campusPhotoTitle) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setCampusPhotoTitle(cleanName);
      }
      showToast(
        'Image Compressed',
        `Optimized from ${result.originalSizeKb} KB to ${result.compressedSizeKb} KB (${result.savingsPercent}% savings, lossless clarity).`,
        'success'
      );
    } catch (err: any) {
      showToast('Compression Error', err.message || 'Could not compress image.', 'error');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSaveCampusPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compressedResult) return;
    setIsSavingCampus(true);

    const newPhoto: CampusGalleryImage = {
      id: `campus-${Date.now()}`,
      url: compressedResult.dataUrl,
      title: campusPhotoTitle.trim() || 'Career Guidance Academy Classroom',
      caption: campusPhotoCaption.trim() || undefined,
      uploadedAt: new Date().toISOString().split('T')[0],
    };

    const currentList = siteContent.campusImages || campusImages;
    const updated = [newPhoto, ...currentList];
    await updateSiteContent({ ...siteContent, campusImages: updated });
    setIsSavingCampus(false);
    setShowCampusModal(false);
    setCompressedResult(null);
    setCampusPhotoTitle('');
    setCampusPhotoCaption('');
    setActiveCampusIdx(0);
    setHeroTab('campus');
    showToast('Classroom Photo Published', 'Photo posted to front banner.', 'success');
  };

  // Admin Announcement Quick-Action state
  const [showAdminAnnForm, setShowAdminAnnForm] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annTargetBatch, setAnnTargetBatch] = useState('All Batches');
  const [annPriority, setAnnPriority] = useState<Announcement['priority']>('Important');
  const [isSubmittingAnn, setIsSubmittingAnn] = useState(false);
  const [deleteAnnTarget, setDeleteAnnTarget] = useState<Announcement | null>(null);

  const isAdmin = session?.role === 'ADMIN';

  const handleAdminPostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    setIsSubmittingAnn(true);

    const courseObj = courses.find((c) => c.id === annTargetBatch);
    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title: annTitle.trim(),
      content: annContent.trim(),
      targetBatch: annTargetBatch,
      targetLabel: courseObj ? `${courseObj.batchName} (${courseObj.subCategory})` : 'All Batches',
      priority: annPriority,
      date: new Date().toISOString().split('T')[0],
      author: session?.name || 'Administrator, C.G.A',
    };

    await saveAnnouncement(newAnn, true);
    setIsSubmittingAnn(false);
    setAnnTitle('');
    setAnnContent('');
    setShowAdminAnnForm(false);
    showToast('Announcement Published', 'Notice is now live on the home page bulletin.', 'success');
  };

  const handleConfirmDeleteAnnouncement = async () => {
    if (!deleteAnnTarget) return;
    await deleteAnnouncement(deleteAnnTarget.id);
    setDeleteAnnTarget(null);
    showToast('Announcement Removed', 'Notice has been permanently deleted from database.', 'info');
  };

  const featuredCourses = courses.filter((c) => c.featured).slice(0, 6);
  const topAchievements = achievements.slice(0, 4);
  const topFaculty = faculty.slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicHeader />

      <main className="flex-1">
        {/* ==================== 1. HERO BANNER ==================== */}
        <section className="relative overflow-hidden cga-gradient-hero text-white py-16 lg:py-24">
          {/* Decorative background circles */}
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#ea580c]/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#dc2626]/15 blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Hero Copy */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-xs text-xs sm:text-sm font-semibold text-amber-300">
                  <CustomAcademicEmblemSvg className="w-4 h-4 text-[#ea580c]" />
                  <span>{siteContent.heroBadge}</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15]">
                  {siteContent.heroTitle}
                </h1>

                <p className="text-base sm:text-lg text-blue-100 leading-relaxed max-w-2xl">
                  {siteContent.heroSubtitle}
                </p>

                {/* Primary & Secondary CTAs */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    href="/courses"
                    id="hero-explore-courses-btn"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#ea580c] hover:bg-orange-600 text-white font-bold text-sm sm:text-base shadow-lg shadow-orange-950/30 transition-all"
                  >
                    {siteContent.heroCtaPrimary}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/login"
                    id="hero-portal-login-btn"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-[#0a0e2a] hover:bg-blue-50 font-bold text-sm sm:text-base shadow-md transition-all"
                  >
                    {siteContent.heroCtaSecondary}
                  </Link>
                </div>

                {/* Quick Category Pills */}
                <div className="pt-4 flex flex-wrap items-center gap-2 text-xs text-blue-100">
                  <span className="font-bold text-white mr-1">Popular Wings:</span>
                  {['TET Paper I & II', 'TRBT STGT / STPGT', 'TPSC & JRBT', 'IBPS & SSC', 'TBSE & CBSE (VII–X)'].map(
                    (tag) => (
                      <Link
                        key={tag}
                        href="/courses"
                        className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 transition-colors"
                      >
                        {tag}
                      </Link>
                    )
                  )}
                </div>
              </div>

              {/* Right Column: Emblem Showcase Card */}
              <div className="lg:col-span-5">
                <div className="bg-white/95 text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-white/30 relative">
                  <div className="flex items-center gap-4 pb-6 border-b border-slate-200">
                    <img
                      src="/cga-logo.png"
                      alt="Career Guidance Academy (C.G.A) Seal"
                      className="w-20 h-20 sm:w-24 sm:h-24 object-contain shrink-0 rounded-full shadow-md"
                    />
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded bg-red-50 text-[#dc2626] text-[11px] font-extrabold uppercase tracking-wider mb-1">
                        Gomati District’s #1 Institute
                      </span>
                      <h2 className="text-xl font-extrabold text-[#0a0e2a]">
                        Career Guidance Academy
                      </h2>
                      <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-[#0056b3] shrink-0" />
                        Chanban Youth Club Rd, Udaipur, Tripura
                      </p>
                    </div>
                  </div>

                  {/* Front Banner Tab Selector: Academy Highlights vs Classrooms */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 my-4 text-xs font-bold border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setHeroTab('stats')}
                      className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
                        heroTab === 'stats'
                          ? 'bg-white text-[#0056b3] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Academy Highlights
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeroTab('campus')}
                      className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
                        heroTab === 'campus'
                          ? 'bg-[#ea580c] text-white shadow-xs'
                          : 'text-slate-600 hover:text-[#ea580c]'
                      }`}
                    >
                      Classroom &amp; Campus Tour
                    </button>
                  </div>

                  {heroTab === 'stats' ? (
                    <div className="grid grid-cols-2 gap-3 my-4">
                      {siteContent.stats.map((stat, i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center"
                        >
                          <p className="text-2xl font-extrabold text-[#0056b3]">{stat.value}</p>
                          <p className="text-[11px] font-semibold text-slate-600 mt-0.5 leading-snug">
                            {stat.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3 my-4">
                      <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-slate-100 border border-slate-200 shadow-inner">
                        <img
                          src={campusImages[activeCampusIdx]?.url || '/cga-logo.png'}
                          alt={campusImages[activeCampusIdx]?.title || 'Classroom'}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex flex-col justify-end p-3 text-white">
                          <p className="text-xs font-bold truncate">
                            {campusImages[activeCampusIdx]?.title}
                          </p>
                          {campusImages[activeCampusIdx]?.caption && (
                            <p className="text-[10px] text-slate-200 line-clamp-1">
                              {campusImages[activeCampusIdx]?.caption}
                            </p>
                          )}
                        </div>
                        {campusImages.length > 1 && (
                          <div className="absolute top-2 right-2 flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveCampusIdx((p) => (p === 0 ? campusImages.length - 1 : p - 1))
                              }
                              className="p-1 rounded-full bg-black/60 hover:bg-black/90 text-white cursor-pointer"
                              aria-label="Previous photo"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setActiveCampusIdx((p) => (p === campusImages.length - 1 ? 0 : p + 1))
                              }
                              className="p-1 rounded-full bg-black/60 hover:bg-black/90 text-white cursor-pointer"
                              aria-label="Next photo"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setCompressedResult(null);
                            setCampusPhotoTitle('');
                            setCampusPhotoCaption('');
                            setShowCampusModal(true);
                          }}
                          className="w-full py-2 rounded-xl bg-[#ea580c] hover:bg-orange-600 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Upload Classroom Photo (Auto-compressed)</span>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="bg-blue-50/90 border border-blue-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-[#0a0e2a]">
                        Try Interactive Demo Portals
                      </p>
                      <p className="text-[11px] text-slate-600">
                        One-click login for Student & Admin workflows
                      </p>
                    </div>
                    <Link
                      href="/login"
                      className="px-3.5 py-2 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold shrink-0 inline-flex items-center gap-1 whitespace-nowrap"
                    >
                      Demo Login <CustomArrowRightSvg className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== 2. OFFICIAL ANNOUNCEMENTS & ACADEMIC BULLETIN ==================== */}
        <section className="py-12 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/70 border border-blue-200 text-xs font-bold text-[#0056b3]">
                  <Bell className="w-3.5 h-3.5 text-[#0056b3]" />
                  Official Academy Bulletin
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a0e2a] mt-2">
                  Notices & Examination Announcements
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Live updates for ongoing batches, mock test launches, study materials, and Udaipur campus alerts.
                </p>
              </div>

              {/* Admin Actions Bar (Visible ONLY to Admin) */}
              {isAdmin && (
                <div className="flex flex-wrap items-center gap-2.5 p-2 bg-white rounded-2xl border border-blue-200 shadow-xs">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-extrabold text-amber-800">
                    <Shield className="w-3.5 h-3.5 text-amber-600" />
                    Admin Section
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAdminAnnForm(!showAdminAnnForm)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    {showAdminAnnForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {showAdminAnnForm ? 'Close Notice Form' : 'Add Announcement'}
                  </button>
                  <Link
                    href="/admin/announcements"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                  >
                    Manage All Notices
                  </Link>
                </div>
              )}
            </div>

            {/* Admin-Only Inline Announcement Creation Form */}
            {isAdmin && showAdminAnnForm && (
              <form
                onSubmit={handleAdminPostAnnouncement}
                className="mb-8 p-6 bg-white rounded-3xl border-2 border-[#0056b3]/30 shadow-md space-y-4 text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0056b3] flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-[#0a0e2a]">Publish New Announcement</h3>
                      <p className="text-[11px] text-slate-500">
                        This notice will be immediately published to the Home Page and saved to the database.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAdminAnnForm(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-6">
                    <label className="font-bold text-slate-700 block mb-1">Notice Title *</label>
                    <input
                      type="text"
                      required
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      placeholder="e.g., TET-2026 Morning Batch Mock Exam Schedule Released"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="font-bold text-slate-700 block mb-1">Target Audience</label>
                    <select
                      value={annTargetBatch}
                      onChange={(e) => setAnnTargetBatch(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                    >
                      <option value="All Batches">All Batches (Public Notice)</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.batchName} ({c.subCategory})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="font-bold text-slate-700 block mb-1">Priority</label>
                    <select
                      value={annPriority}
                      onChange={(e) => setAnnPriority(e.target.value as Announcement['priority'])}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                    >
                      <option value="Normal">Normal Notice</option>
                      <option value="Important">Important Alert</option>
                      <option value="Urgent">Urgent / Immediate Action</option>
                    </select>
                  </div>

                  <div className="md:col-span-12">
                    <label className="font-bold text-slate-700 block mb-1">Notice Description / Content *</label>
                    <textarea
                      required
                      rows={3}
                      value={annContent}
                      onChange={(e) => setAnnContent(e.target.value)}
                      placeholder="Provide full details of the notice, schedule, instructions, or campus guidelines..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAdminAnnForm(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs cursor-pointer hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAnn}
                    className="px-5 py-2 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white font-bold text-xs shadow-sm cursor-pointer disabled:opacity-60 inline-flex items-center gap-1.5"
                  >
                    {isSubmittingAnn ? 'Publishing…' : 'Publish Notice to Database'}
                  </button>
                </div>
              </form>
            )}

            {/* Announcements Grid */}
            {announcements.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-xs">
                No announcements posted at this time. Check back soon for examination notices.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {announcements.slice(0, 6).map((ann) => {
                  const isUrgent = ann.priority === 'Urgent';
                  const isImportant = ann.priority === 'Important';
                  return (
                    <div
                      key={ann.id}
                      className={`bg-white rounded-3xl border p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                        isUrgent
                          ? 'border-red-300 ring-1 ring-red-200 bg-gradient-to-b from-red-50/20 to-white'
                          : isImportant
                          ? 'border-amber-200'
                          : 'border-slate-200'
                      }`}
                    >
                      <div>
                        {/* Tags Row */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                              isUrgent
                                ? 'bg-red-100 text-red-700'
                                : isImportant
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-50 text-[#0056b3]'
                            }`}
                          >
                            {isUrgent && <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />}
                            {ann.priority} Notice
                          </span>
                          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {ann.date}
                          </span>
                        </div>

                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold mb-2">
                          {ann.targetLabel || 'All Batches'}
                        </span>

                        <h3 className="text-sm font-extrabold text-[#0a0e2a] line-clamp-2 mb-2 leading-snug">
                          {ann.title}
                        </h3>

                        <p className="text-xs text-slate-600 line-clamp-4 leading-relaxed">
                          {ann.content}
                        </p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="truncate max-w-[170px] italic">By {ann.author}</span>

                        {/* Admin Inline Delete Control */}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => setDeleteAnnTarget(ann)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Announcement from Database"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ==================== 3. INSTITUTE INTRODUCTION & HIGHLIGHTS ==================== */}
        <section className="py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#0056b3] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Academic Excellence in Udaipur
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a0e2a] mt-3">
                {siteContent.introHeading}
              </h2>
              <p className="text-slate-600 mt-3 leading-relaxed text-sm sm:text-base">
                {siteContent.introText}
              </p>
            </div>

            {/* 4 Core Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {siteContent.whyChooseUs.map((item, idx) => {
                const icons = [Users, BookOpen, FileCheck, GraduationCap];
                const IconComp = icons[idx % icons.length];
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/90 cga-card-hover"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#0056b3] text-white flex items-center justify-center mb-4 shadow-sm">
                      <IconComp className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-extrabold text-[#0a0e2a] mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==================== 3. FOUR COURSE CATEGORIES STRIP ==================== */}
        <section className="py-14 bg-slate-50 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#dc2626]">
                  Structured Coaching Wings
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a0e2a] mt-1">
                  Explore Our 4 Academic & Competitive Divisions
                </h2>
              </div>
              <Link
                href="/courses"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0056b3] hover:underline"
              >
                {courses.length > 0
                  ? `View All ${courses.length} Active Courses`
                  : 'View All Courses'}{' '}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  title: 'Teaching & Recruitment Exams',
                  subtitle: 'TET (I & II), STGT, STPGT, TPSC, JRBT',
                  badge: '5 Flagship Batches',
                  color: 'border-t-4 border-t-[#0056b3]',
                  href: '/courses?category=Teaching+and+Recruitment+Exams',
                },
                {
                  title: 'Banking, SSC & Railway',
                  subtitle: 'IBPS PO/Clerk, SBI, SSC CGL/CHSL/MTS, RRB NTPC',
                  badge: '3 Specialized Batches',
                  color: 'border-t-4 border-t-[#ea580c]',
                  href: '/courses?category=Banking,+SSC+and+Railway',
                },
                {
                  title: 'Other Competitive Exams',
                  subtitle: 'Tripura Police SI, TSR, Defence & CUET (UG)',
                  badge: '2 Target Batches',
                  color: 'border-t-4 border-t-[#dc2626]',
                  href: '/courses?category=Other+Competitive+Examinations',
                },
                {
                  title: 'School Coaching (Class VII–X)',
                  subtitle: 'Separate Batches for TBSE & CBSE Boards',
                  badge: '8 Board Batches (VII–X)',
                  color: 'border-t-4 border-t-emerald-600',
                  href: '/courses?category=School+Coaching',
                },
              ].map((cat) => (
                <Link
                  key={cat.title}
                  href={cat.href}
                  className={`bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs cga-card-hover flex flex-col justify-between ${cat.color}`}
                >
                  <div>
                    <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 mb-3">
                      {cat.badge}
                    </span>
                    <h3 className="text-base font-extrabold text-[#0a0e2a]">{cat.title}</h3>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{cat.subtitle}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0056b3]">
                    <span>Browse Batches</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== 4. FEATURED COURSES ==================== */}
        <section className="py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#0056b3]">
                  Admissions Open 2026–27
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a0e2a] mt-1">
                  Featured Courses & Upcoming Batches
                </h2>
              </div>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 text-[#0056b3] hover:bg-blue-100 text-sm font-bold transition-colors"
              >
                Explore Complete Course Catalogue
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCourses.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <p className="text-sm font-semibold text-slate-500">
                    Upcoming batches and courses will be announced shortly.
                  </p>
                </div>
              ) : (
                featuredCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))
              )}
            </div>
          </div>
        </section>

        {/* ==================== 5. TOPPERS & ACHIEVEMENTS PREVIEW ==================== */}
        <section className="py-16 lg:py-20 bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#ea580c]">
                  <Trophy className="w-4 h-4" /> Hall of Fame
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a0e2a] mt-1">
                  Our State Rankers & Board Toppers
                </h2>
              </div>
              <Link
                href="/achievements"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#0056b3] hover:underline"
              >
                View All Toppers & Selections <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {topAchievements.map((topper) => (
                <div
                  key={topper.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs cga-card-hover flex flex-col"
                >
                  <div className="p-5 flex items-center gap-3.5 border-b border-slate-100">
                    <img
                      src={topper.photo}
                      alt={`Photograph of student ${topper.name}, ${topper.rank} in ${topper.exam}`}
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-[#ea580c] shrink-0"
                    />
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded bg-amber-50 text-[#ea580c] border border-amber-200 text-[11px] font-extrabold">
                        {topper.rank}
                      </span>
                      <h3 className="text-base font-extrabold text-[#0a0e2a] mt-1">{topper.name}</h3>
                      <p className="text-xs font-semibold text-[#0056b3]">{topper.exam}</p>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between bg-slate-50/50">
                    <p className="text-xs text-slate-600 italic leading-relaxed">
                      “{topper.quote}”
                    </p>
                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2 text-[11px] font-bold text-slate-400">
                      <span className="whitespace-nowrap">Batch of {topper.year}</span>
                      <span className="text-emerald-600 flex items-center gap-1 whitespace-nowrap shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Verified Ranker
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== 6. FACULTY PREVIEW ==================== */}
        <section className="py-16 lg:py-20 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#0056b3]">
                  Mentors Behind the Ranks
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a0e2a] mt-1">
                  Learn from Tripura’s Most Experienced Educators
                </h2>
              </div>
              <Link
                href="/faculty"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#0056b3] hover:underline"
              >
                {faculty.length > 0
                  ? `Meet All ${faculty.length} Faculty Members`
                  : 'Meet Our Faculty Members'}{' '}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {topFaculty.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <p className="text-sm font-semibold text-slate-500">
                    Faculty mentor profiles will be announced shortly.
                  </p>
                </div>
              ) : (
                topFaculty.map((member) => (
                  <div
                    key={member.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs cga-card-hover flex flex-col"
                  >
                    <div className="flex items-center gap-3.5 mb-4">
                      <img
                        src={member.photo || getFacultyAvatarUrl(member.name)}
                        alt={`Faculty avatar of ${formatFacultyName(member.name)}, ${member.designation || 'Instructor'}`}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = getFacultyAvatarUrl(member.name);
                        }}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-[#0056b3]/20 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {member.designation && (
                            <span className="inline-block px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-extrabold uppercase">
                              {member.designation}
                            </span>
                          )}
                          <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-[#0056b3] text-[11px] font-bold">
                            {member.experience}
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-[#0a0e2a] mt-1">
                          {formatFacultyName(member.name)}
                        </h3>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-[#0056b3] mb-1">{member.subject}</p>
                    <p className="text-xs text-slate-500 font-medium mb-3">{member.qualification}</p>
                    <p className="text-xs text-slate-600 leading-relaxed mt-auto line-clamp-3">
                      {member.bio}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* ==================== 7. ACADEMIC METHODOLOGY & PILLARS ==================== */}
        <section className="py-16 bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#0056b3]">
                Academic Excellence
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a0e2a] mt-1">
                Our Proven Pedagogical Methodology
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2">
                Ground-level coaching built on disciplined mentorship, localized syllabus coverage, and regular performance evaluations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0056b3] flex items-center justify-center font-bold mb-4">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-[#0a0e2a] mb-2">
                    Comprehensive Syllabus Coverage
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Exhaustive module-by-module preparation aligned with latest TRBT, TPSC, JRBT and Board patterns, with dedicated attention to foundational concepts.
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-[#0056b3]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Handcrafted Study Modules</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold mb-4">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-[#0a0e2a] mb-2">
                    Rigorous Mock Tests &amp; Analysis
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Weekly OMR-style and timed assessments replicating exam environments, followed by question-by-question breakdown and doubt clearance.
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-[#0056b3]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Individual Performance Tracking</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold mb-4">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-[#0a0e2a] mb-2">
                    Personalized Mentor Support
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Small, focused classroom batches at our Chanban campus ensure every student receives direct guidance from experienced faculty.
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-[#0056b3]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Offline Campus at Udaipur</span>
                </div>
              </div>
            </div>

            {/* Statutory Compliance Notice Banner */}
            <div className="mt-10 p-4 rounded-xl bg-slate-100 border border-slate-200 text-center text-xs text-slate-500 max-w-3xl mx-auto">
              <span className="font-semibold text-slate-700">Institutional Notice:</span> Career Guidance Academy (C.G.A) operates solely as an educational tutoring institute. We do not display unverified promotional endorsements. Academic outcomes are the result of student effort, dedicated classroom training, and independent selection processes by respective government examination boards.
            </div>
          </div>
        </section>

        {/* ==================== 8. REGISTRATION CALL-TO-ACTION ==================== */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="cga-gradient-hero rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="space-y-3 max-w-2xl text-center lg:text-left">
                <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-amber-300 text-xs font-bold uppercase tracking-wider">
                  Start Your Preparation Today
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold">
                  Ready to Join Career Guidance Academy (C.G.A), Udaipur?
                </h2>
                <p className="text-sm sm:text-base text-blue-100 leading-relaxed">
                  Register on our Student Portal to browse live seat availability, pay fees in full or
                  convenient instalments, unlock watermarked PDF study books, and attempt timed mock
                  tests.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 shrink-0">
                <Link
                  href="/register"
                  className="px-6 py-3.5 rounded-xl bg-[#ea580c] hover:bg-orange-600 text-white font-bold text-sm shadow-lg transition-all"
                >
                  Create Student Account
                </Link>
                <Link
                  href="/contact"
                  className="px-6 py-3.5 rounded-xl bg-white text-[#0a0e2a] hover:bg-blue-50 font-bold text-sm transition-all"
                >
                  Visit Udaipur Office
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />

      <ConfirmDialog
        isOpen={!!deleteAnnTarget}
        title="Delete Announcement?"
        message={`Are you sure you want to permanently delete notice "${deleteAnnTarget?.title}" from the database? This cannot be undone.`}
        onCancel={() => setDeleteAnnTarget(null)}
        onConfirm={handleConfirmDeleteAnnouncement}
      />

      {/* Admin Campus & Classroom Photo Upload Modal */}
      {isAdmin && showCampusModal && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveCampusPhoto}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs text-slate-800"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#ea580c] flex items-center justify-center font-bold">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0a0e2a]">
                    Upload Classroom / Institution Photo
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Photos are automatically compressed to lossless WebP format before posting.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCampusModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* File Selector */}
            <div className="space-y-2">
              <label className="font-bold text-slate-700 block">Select Image File *</label>
              <input
                ref={campusFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleCampusPhotoSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => campusFileInputRef.current?.click()}
                className="w-full py-4 border-2 border-dashed border-blue-300 hover:border-[#0056b3] rounded-2xl bg-blue-50/50 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Upload className="w-6 h-6 text-[#0056b3]" />
                <span className="text-xs font-bold text-[#0056b3]">
                  {isCompressing ? 'Compressing high-res photo…' : 'Click to Select Classroom Photo'}
                </span>
                <span className="text-[10px] text-slate-500">
                  JPG, PNG, or WebP. Auto-compressed without quality loss.
                </span>
              </button>
            </div>

            {/* Live Compression Result Box */}
            {compressedResult && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between text-emerald-950 font-bold text-xs">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Image Compressed Successfully
                  </span>
                  <span className="bg-emerald-200/80 px-2 py-0.5 rounded-full text-[10px] font-black text-emerald-900">
                    {compressedResult.savingsPercent}% Storage Saved
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <img
                    src={compressedResult.dataUrl}
                    alt="Preview"
                    className="w-20 h-14 object-cover rounded-xl border border-emerald-300 shrink-0"
                  />
                  <div className="text-[11px] text-slate-600 space-y-0.5">
                    <p>
                      Original size: <strong>{compressedResult.originalSizeKb} KB</strong>
                    </p>
                    <p>
                      Compressed size: <strong>{compressedResult.compressedSizeKb} KB</strong> (WebP format)
                    </p>
                    <p className="text-emerald-700 font-semibold">
                      Lossless visual clarity ready for front banner.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Title & Caption */}
            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Photo Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Batch Smart Classroom Lecture"
                  value={campusPhotoTitle}
                  onChange={(e) => setCampusPhotoTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Optional Caption / Details</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Daily interactive problem solving and mock discussion with students."
                  value={campusPhotoCaption}
                  onChange={(e) => setCampusPhotoCaption(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCampusModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!compressedResult || isSavingCampus}
                className="px-5 py-2 rounded-xl bg-[#ea580c] hover:bg-orange-600 text-white font-bold text-xs shadow-sm cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isSavingCampus ? 'Publishing…' : 'Publish to Front Banner'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
