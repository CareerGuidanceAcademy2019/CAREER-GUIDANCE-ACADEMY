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

  // Campus & Classroom Experience Banner / Gallery state
  const campusImages: CampusGalleryImage[] =
    siteContent.campusImages && siteContent.campusImages.length > 0
      ? siteContent.campusImages
      : INITIAL_SEED_DATA.siteContent.campusImages || [];

  const [activeGalleryIdx, setActiveGalleryIdx] = useState(0);
  const [showCampusUploadModal, setShowCampusUploadModal] = useState(false);
  const [campusPhotoTitle, setCampusPhotoTitle] = useState('');
  const [campusPhotoCaption, setCampusPhotoCaption] = useState('');
  const [compressedResult, setCompressedResult] = useState<CompressionResult | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSavingCampusPhoto, setIsSavingCampusPhoto] = useState(false);
  const [deleteCampusTarget, setDeleteCampusTarget] = useState<CampusGalleryImage | null>(null);
  const campusFileInputRef = React.useRef<HTMLInputElement>(null);

  const isAdmin = session?.role === 'ADMIN';

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
    setIsSavingCampusPhoto(true);

    const newPhoto: CampusGalleryImage = {
      id: `campus-${Date.now()}`,
      url: compressedResult.dataUrl,
      title: campusPhotoTitle.trim() || 'Career Guidance Academy Classroom',
      caption: campusPhotoCaption.trim() || undefined,
      uploadedAt: new Date().toISOString().split('T')[0],
    };

    const currentList = siteContent.campusImages || campusImages;
    const updated = [newPhoto, ...currentList];
    const ok = await updateSiteContent({ ...siteContent, campusImages: updated });
    setIsSavingCampusPhoto(false);
    if (ok) {
      setShowCampusUploadModal(false);
      setCompressedResult(null);
      setCampusPhotoTitle('');
      setCampusPhotoCaption('');
      setActiveGalleryIdx(0);
      showToast('Classroom Photo Published', 'Photo is now live on the front top banner.', 'success');
    }
  };

  const handleConfirmDeleteCampusPhoto = async () => {
    if (!deleteCampusTarget) return;
    const currentList = siteContent.campusImages || campusImages;
    const updated = currentList.filter((img) => img.id !== deleteCampusTarget.id);
    const ok = await updateSiteContent({ ...siteContent, campusImages: updated });
    if (ok) {
      setDeleteCampusTarget(null);
      if (activeGalleryIdx >= updated.length) {
        setActiveGalleryIdx(Math.max(0, updated.length - 1));
      }
      showToast('Photo Removed', 'Image removed from front banner.', 'info');
    }
  };

  // Admin Announcement Quick-Action state
  const [showAdminAnnForm, setShowAdminAnnForm] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annTargetBatch, setAnnTargetBatch] = useState('All Batches');
  const [annPriority, setAnnPriority] = useState<Announcement['priority']>('Important');
  const [isSubmittingAnn, setIsSubmittingAnn] = useState(false);
  const [deleteAnnTarget, setDeleteAnnTarget] = useState<Announcement | null>(null);

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
                    className="px-6 py-3.5 rounded-xl bg-[#ea580c] hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-950/20 transition-all inline-flex items-center gap-2"
                  >
                    <span>Explore Exam Courses</span>
                    <CustomArrowRightSvg className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/login"
                    className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/25 text-white font-bold text-sm backdrop-blur-xs transition-all inline-flex items-center gap-2"
                  >
                    <span>Student Login</span>
                  </Link>
                </div>

                {/* Key Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/15">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/10 text-amber-300 shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">State Topper Mentorship</p>
                      <p className="text-[11px] text-blue-200">Tripura Rank #01 Faculty</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/10 text-emerald-300 shrink-0">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Gomati Classroom & Online</p>
                      <p className="text-[11px] text-blue-200">Udaipur Center + Live Classes</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/10 text-sky-300 shrink-0">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">100% Focused Curriculum</p>
                      <p className="text-[11px] text-blue-200">TRBT &amp; TPSC Pattern</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Academic Highlights Card */}
              <div className="lg:col-span-5">
                <div className="bg-white rounded-3xl p-6 sm:p-8 text-slate-800 shadow-2xl border border-white/20 relative">
                  <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                    <img
                      src="/cga-logo.png"
                      alt="Career Guidance Academy Logo"
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

                  <div className="grid grid-cols-2 gap-3 my-6">
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

        {/* ==================== 2. CAMPUS & CLASSROOM EXPERIENCE BANNER (TOP & FRONT BANNER) ==================== */}
        <section className="py-12 lg:py-16 bg-slate-900 text-white border-b border-slate-800 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-amber-300">
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>Udaipur Campus &amp; Classrooms</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                  Modern Infrastructure &amp; Dynamic Learning Spaces
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                  Step inside Career Guidance Academy at Chanban, Udaipur. Explore our multimedia smart classrooms,
                  fully equipped OMR testing center, and dedicated faculty study desks.
                </p>
              </div>

              {/* Admin Quick Action Button */}
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCompressedResult(null);
                      setCampusPhotoTitle('');
                      setCampusPhotoCaption('');
                      setShowCampusUploadModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ea580c] hover:bg-orange-600 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Classroom Photo</span>
                  </button>
                </div>
              )}
            </div>

            {/* Featured Front Top Banner / Large Display */}
            {campusImages.length > 0 && (
              <div className="space-y-4">
                <div className="relative rounded-3xl overflow-hidden border-2 border-white/10 bg-slate-950 aspect-[16/9] sm:aspect-[21/9] max-h-[520px] shadow-2xl">
                  <img
                    src={campusImages[activeGalleryIdx]?.url || campusImages[0].url}
                    alt={campusImages[activeGalleryIdx]?.title || 'CGA Classroom'}
                    className="w-full h-full object-cover transition-all duration-500"
                  />
                  {/* Gradient Overlay & Captions */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent flex flex-col justify-end p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full inline-block">
                          Photo {activeGalleryIdx + 1} of {campusImages.length}
                        </span>
                        <h3 className="text-lg sm:text-2xl font-black text-white">
                          {campusImages[activeGalleryIdx]?.title}
                        </h3>
                        {campusImages[activeGalleryIdx]?.caption && (
                          <p className="text-xs sm:text-sm text-slate-200 max-w-2xl line-clamp-2">
                            {campusImages[activeGalleryIdx]?.caption}
                          </p>
                        )}
                      </div>

                      {/* Admin Delete Action for Current Photo */}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setDeleteCampusTarget(campusImages[activeGalleryIdx])}
                          className="self-start sm:self-auto p-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer backdrop-blur-md"
                          title="Delete this classroom photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Photo</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Navigation Arrows */}
                  {campusImages.length > 1 && (
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveGalleryIdx((prev) => (prev === 0 ? campusImages.length - 1 : prev - 1))
                        }
                        className="p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md cursor-pointer transition-colors"
                        aria-label="Previous Photo"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveGalleryIdx((prev) => (prev === campusImages.length - 1 ? 0 : prev + 1))
                        }
                        className="p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md cursor-pointer transition-colors"
                        aria-label="Next Photo"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Thumbnails Row */}
                {campusImages.length > 1 && (
                  <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                    {campusImages.map((img, idx) => (
                      <button
                        key={img.id || idx}
                        type="button"
                        onClick={() => setActiveGalleryIdx(idx)}
                        className={`relative rounded-2xl overflow-hidden shrink-0 w-28 sm:w-36 h-20 border-2 transition-all cursor-pointer ${
                          activeGalleryIdx === idx
                            ? 'border-[#ea580c] ring-2 ring-orange-400 shadow-md scale-102'
                            : 'border-white/20 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20" />
                        <span className="absolute bottom-1 left-1.5 right-1.5 text-[10px] font-bold text-white truncate drop-shadow">
                          {img.title}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ==================== 3. TOPPERS & ACHIEVEMENTS PREVIEW (IMMEDIATELY AFTER BANNER) ==================== */}
        <section className="py-16 lg:py-20 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#ea580c]">
                  <Trophy className="w-4 h-4" /> Hall of Fame
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a0e2a] mt-1">
                  Our State Rankers &amp; Board Toppers
                </h2>
              </div>
              <Link
                href="/achievements"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#0056b3] hover:underline"
              >
                View Complete Hall of Fame <ArrowRight className="w-4 h-4" />
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
                      <span className="inline-block px-2.5 py-0.5 rounded bg-amber-50 text-[#ea580c] border border-amber-200 text-[11px] font-extrabold">
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

        {/* ==================== 4. OFFICIAL ANNOUNCEMENTS & ACADEMIC BULLETIN ==================== */}
        <section className="py-12 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/70 border border-blue-200 text-xs font-bold text-[#0056b3]">
                  <Bell className="w-3.5 h-3.5 text-[#0056b3]" />
                  Official Academy Bulletin
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a0e2a] mt-2">
                  Notices &amp; Examination Announcements
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Stay updated with official batch dates, mock test schedules, and government notifications.
                </p>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAdminAnnForm(!showAdminAnnForm)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{showAdminAnnForm ? 'Cancel Notice' : 'Post Announcement'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Admin Quick Post Form */}
            {isAdmin && showAdminAnnForm && (
              <form
                onSubmit={handleAdminPostAnnouncement}
                className="mb-8 p-6 rounded-2xl bg-white border-2 border-blue-200 shadow-md space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-extrabold text-[#0a0e2a] flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[#0056b3]" />
                    Publish Official Academy Announcement
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Admin Authenticated
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-700">Notice Headline *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tripura TET 2026 Special Sunday Mock Test Timetable Released"
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#0056b3]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Priority Level</label>
                    <select
                      value={annPriority}
                      onChange={(e) => setAnnPriority(e.target.value as Announcement['priority'])}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                    >
                      <option value="Important">Important (Orange)</option>
                      <option value="Urgent">Urgent (Red)</option>
                      <option value="Notice">Notice (Blue)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-700">Notice Body Details *</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Enter the full announcement details, timings, guidelines or room allocations..."
                      value={annContent}
                      onChange={(e) => setAnnContent(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#0056b3]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Target Batch / Exam</label>
                    <select
                      value={annTargetBatch}
                      onChange={(e) => setAnnTargetBatch(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                    >
                      <option value="All Batches">All Batches (Public)</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.batchName})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Choose which batch this announcement is pinned for.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAdminAnnForm(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAnn}
                    className="px-5 py-2 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingAnn ? 'Publishing…' : 'Publish Announcement'}
                  </button>
                </div>
              </form>
            )}

            {/* Announcement Cards Display */}
            {announcements.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
                No active announcements right now. Check back soon for examination schedules and updates.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {announcements.map((ann) => {
                  const priorityColors: Record<string, string> = {
                    Urgent: 'bg-red-50 text-[#dc2626] border-red-200',
                    Important: 'bg-amber-50 text-[#ea580c] border-amber-200',
                    Notice: 'bg-blue-50 text-[#0056b3] border-blue-200',
                  };
                  const badgeClass = priorityColors[ann.priority] || 'bg-slate-50 text-slate-700 border-slate-200';

                  return (
                    <div
                      key={ann.id}
                      className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${badgeClass}`}
                          >
                            {ann.priority}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {ann.date}
                          </span>
                        </div>

                        <h3 className="text-sm font-extrabold text-[#0a0e2a] leading-snug line-clamp-2">
                          {ann.title}
                        </h3>

                        <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-3">
                          {ann.content}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[#0056b3] bg-blue-50 px-2 py-0.5 rounded-md truncate max-w-[180px]">
                          {ann.targetLabel || 'All Batches'}
                        </span>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => setDeleteAnnTarget(ann)}
                            className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Announcement"
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

        {/* ==================== 5. WELCOME & ACADEMIC INTRO ==================== */}
        <section className="py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#0056b3]">
                Welcome to Career Guidance Academy
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0a0e2a] mt-2">
                Gomati District’s Premier Competitive Coaching Destination
              </h2>
              <div className="w-16 h-1 bg-[#ea580c] mx-auto mt-4 rounded-full" />
              <p className="text-sm sm:text-base text-slate-600 mt-4 leading-relaxed">
                Founded in 2019 at Chanban, Udaipur, Career Guidance Academy (C.G.A) delivers
                disciplined, syllabus-focused classroom and online coaching for Teaching Eligibility
                (Tripura TET, STGT), Civil &amp; General Recruitment (TPSC, JRBT, Banking, SSC,
                Railways), and Secondary/Higher Secondary Foundation batches.
              </p>
            </div>
          </div>
        </section>

        {/* ==================== 6. SPECIALIZED ACADEMIC WINGS ==================== */}
        <section className="py-14 bg-slate-50 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#0056b3]">
                  Structured Curriculum
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a0e2a] mt-1">
                  Our Four Specialized Academic Wings
                </h2>
              </div>
              <Link
                href="/courses"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0056b3] hover:underline"
              >
                <span>Browse All Batches</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-[#0056b3] transition-all">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0056b3] flex items-center justify-center font-bold mb-4">
                  1
                </div>
                <h3 className="text-base font-extrabold text-[#0a0e2a]">Teaching Exams Wing</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Rigorous preparation for Tripura TET (Paper I &amp; Paper II). Complete syllabus coverage for CDP, Languages, Science, and Social Studies.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-[#ea580c] transition-all">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#ea580c] flex items-center justify-center font-bold mb-4">
                  2
                </div>
                <h3 className="text-base font-extrabold text-[#0a0e2a]">STGT &amp; High School Wing</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Specialized subject batches for Graduate Teachers (Secondary): Pure Science (PCM), Bio Science (CBZ), and Social Studies.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-emerald-600 transition-all">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold mb-4">
                  3
                </div>
                <h3 className="text-base font-extrabold text-[#0a0e2a]">TPSC &amp; General Exams</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Comprehensive coverage of Tripura GK, Current Affairs, English, Quantitative Aptitude &amp; Reasoning for TPSC Combined &amp; JRBT.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-sky-600 transition-all">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold mb-4">
                  4
                </div>
                <h3 className="text-base font-extrabold text-[#0a0e2a]">Board Foundation Wing</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  TBSE &amp; CBSE Classes VII to X foundation batches building concepts in Mathematics, Science, and English for future competitive exams.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== 7. FEATURED COURSES ==================== */}
        <section className="py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#0056b3]">
                  Admissions Open
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a0e2a] mt-1">
                  Featured Preparation Courses
                </h2>
              </div>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#0056b3] hover:underline"
              >
                View All Batches <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCourses.length === 0 ? (
                <div className="col-span-3 text-center py-12 text-slate-500">
                  No featured courses found at this time.
                </div>
              ) : (
                featuredCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))
              )}
            </div>
          </div>
        </section>

        {/* ==================== 8. FACULTY PREVIEW ==================== */}
        <section className="py-16 lg:py-20 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#0056b3]">
                  Mentorship Council
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a0e2a] mt-1">
                  Learn from State Toppers &amp; Veteran Educators
                </h2>
              </div>
              <Link
                href="/faculty"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#0056b3] hover:underline"
              >
                Meet All Faculty <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {topFaculty.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-2xs cga-card-hover flex flex-col items-center justify-between"
                >
                  <div className="flex flex-col items-center">
                    <img
                      src={getFacultyAvatarUrl(member.name)}
                      alt={`Portrait of ${formatFacultyName(member.name)}, faculty at Career Guidance Academy`}
                      className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-50 shadow-sm"
                    />
                    <h3 className="text-base font-extrabold text-[#0a0e2a] mt-4">
                      {formatFacultyName(member.name)}
                    </h3>
                    <p className="text-xs font-bold text-[#0056b3] mt-0.5">{member.designation}</p>
                    <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
                      {member.subject}
                    </span>
                    <p className="text-xs text-slate-600 mt-3 leading-relaxed line-clamp-3">
                      {member.bio}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500">
                    <Award className="w-3.5 h-3.5 text-[#ea580c]" />
                    <span>{member.experience} Experience</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== 9. METHODOLOGY ==================== */}
        <section className="py-16 bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#0056b3]">
                Proven System
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a0e2a] mt-1">
                Our 6-Step Preparation Methodology
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  num: '01',
                  title: 'Complete Syllabus Mapping',
                  desc: 'Every lecture strictly adheres to official TRBT, TPSC, and TBSE guidelines with updated questions.',
                },
                {
                  num: '02',
                  title: 'Handcrafted Printed Handouts',
                  desc: 'Concise, high-yield chapter notes and conceptual formula booklets distributed to students.',
                },
                {
                  num: '03',
                  title: 'Weekly OMR & Online CBT Mocks',
                  desc: 'Timed exam-simulated tests with negative marking, instant scorecards, and ranking.',
                },
                {
                  num: '04',
                  title: 'One-on-One Doubt Solving',
                  desc: 'Dedicated daily clearing hours with faculty ensuring zero conceptual bottlenecks.',
                },
                {
                  num: '05',
                  title: 'Tripura Current Affairs Digests',
                  desc: 'Domestic & International capsules with special emphasis on Tripura state GK.',
                },
                {
                  num: '06',
                  title: 'Rigorous Past 10-Yr Paper Analysis',
                  desc: 'Dissecting previous years questions to spot recurring themes and patterns.',
                },
              ].map((step, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-[#0056b3] transition-colors"
                >
                  <span className="text-2xl font-black text-[#ea580c] block mb-2">{step.num}</span>
                  <h3 className="text-base font-extrabold text-[#0a0e2a]">{step.title}</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== 10. CALL TO ACTION BANNER ==================== */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="cga-gradient-hero rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="space-y-3 max-w-2xl text-center lg:text-left">
                <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold uppercase tracking-wider">
                  Admissions Open for 2026–27 Session
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                  Ready to Secure Your State Rank in Tripura?
                </h2>
                <p className="text-sm text-blue-100 leading-relaxed">
                  Join hundreds of successful candidates who transformed their preparation at Career
                  Guidance Academy. Enrol online or visit our Udaipur campus today.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0 justify-center">
                <Link
                  href="/register"
                  className="px-6 py-3.5 rounded-xl bg-[#ea580c] hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-950/20 text-center transition-all"
                >
                  Create Student Account
                </Link>
                <Link
                  href="/contact"
                  className="px-6 py-3.5 rounded-xl bg-white text-[#0a0e2a] hover:bg-blue-50 font-bold text-sm transition-all text-center"
                >
                  Visit Udaipur Office
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />

      {/* Delete Announcement Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteAnnTarget}
        title="Delete Announcement?"
        message={`Are you sure you want to permanently delete notice "${deleteAnnTarget?.title}" from the database? This cannot be undone.`}
        onCancel={() => setDeleteAnnTarget(null)}
        onConfirm={handleConfirmDeleteAnnouncement}
      />

      {/* Delete Campus Photo Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteCampusTarget}
        title="Remove Classroom Photo?"
        message={`Are you sure you want to remove photo "${deleteCampusTarget?.title}" from the public front banner?`}
        onCancel={() => setDeleteCampusTarget(null)}
        onConfirm={handleConfirmDeleteCampusPhoto}
      />

      {/* Admin Campus & Classroom Photo Upload Modal */}
      {isAdmin && showCampusUploadModal && (
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
                onClick={() => setShowCampusUploadModal(false)}
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
                onClick={() => setShowCampusUploadModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!compressedResult || isSavingCampusPhoto}
                className="px-5 py-2 rounded-xl bg-[#ea580c] hover:bg-orange-600 text-white font-bold text-xs shadow-sm cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isSavingCampusPhoto ? 'Publishing…' : 'Publish to Front Banner'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
