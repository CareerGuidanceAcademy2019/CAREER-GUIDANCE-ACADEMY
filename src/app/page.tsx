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
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { CourseCard } from '@/components/public/CourseCard';
import { useCga } from '@/context/CgaContext';
import { CustomAcademicEmblemSvg, CustomArrowRightSvg } from '@/components/ui/CustomIcons';
import { getFacultyAvatarUrl, formatFacultyName } from '@/lib/names';
import { Announcement, CampusGalleryImage } from '@/data/initialSeedData';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TopperAvatar } from '@/components/ui/TopperAvatar';
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

  // Campus & Classroom Gallery state
  const campusImages: CampusGalleryImage[] =
    siteContent.campusImages && siteContent.campusImages.length > 0
      ? siteContent.campusImages
      : [
          {
            id: 'campus-1',
            url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&auto=format&fit=crop&q=80',
            title: 'Interactive Smart Classroom Sessions',
            caption: 'Regular disciplined lectures with state-topper faculty at Chanban campus, Udaipur.',
            uploadedAt: '2026-10-01',
          },
          {
            id: 'campus-2',
            url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&auto=format&fit=crop&q=80',
            title: 'Academy Library & Digital Study Center',
            caption: 'Curated competitive reference books, current affairs digests, and peaceful self-study space.',
            uploadedAt: '2026-10-05',
          },
          {
            id: 'campus-3',
            url: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1200&auto=format&fit=crop&q=80',
            title: 'OMR & Online Mock Examination Hall',
            caption: 'Simulating official TRBT, TPSC, and Board examination environments.',
            uploadedAt: '2026-10-12',
          },
        ];

  const [activeGalleryIdx, setActiveGalleryIdx] = useState(0);
  const [showCampusUploadModal, setShowCampusUploadModal] = useState(false);
  const [campusPhotoTitle, setCampusPhotoTitle] = useState('');
  const [campusPhotoCaption, setCampusPhotoCaption] = useState('');
  const [compressedResult, setCompressedResult] = useState<CompressionResult | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSavingCampusPhoto, setIsSavingCampusPhoto] = useState(false);
  const [deleteCampusTarget, setDeleteCampusTarget] = useState<CampusGalleryImage | null>(null);
  const campusFileInputRef = React.useRef<HTMLInputElement>(null);

  // Admin Announcement Quick-Action state
  const [showAdminAnnForm, setShowAdminAnnForm] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annTargetBatch, setAnnTargetBatch] = useState('All Batches');
  const [annPriority, setAnnPriority] = useState<Announcement['priority']>('Important');
  const [isSubmittingAnn, setIsSubmittingAnn] = useState(false);
  const [deleteAnnTarget, setDeleteAnnTarget] = useState<Announcement | null>(null);

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
        `Compressed from ${result.originalSizeKb} KB to ${result.compressedSizeKb} KB (${result.savingsPercent}% savings, lossless visual quality).`,
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
    await updateSiteContent({ ...siteContent, campusImages: updated });
    setIsSavingCampusPhoto(false);
    setShowCampusUploadModal(false);
    setCompressedResult(null);
    setCampusPhotoTitle('');
    setCampusPhotoCaption('');
    setActiveGalleryIdx(0);
    showToast('Classroom Photo Published', 'Photo is now live on the front top banner.', 'success');
  };

  const handleConfirmDeleteCampusPhoto = async () => {
    if (!deleteCampusTarget) return;
    const currentList = siteContent.campusImages || campusImages;
    const updated = currentList.filter((img) => img.id !== deleteCampusTarget.id);
    await updateSiteContent({ ...siteContent, campusImages: updated });
    setDeleteCampusTarget(null);
    if (activeGalleryIdx >= updated.length) {
      setActiveGalleryIdx(Math.max(0, updated.length - 1));
    }
    showToast('Photo Removed', 'Image removed from front banner.', 'info');
  };

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

        {/* ==================== 2. CAMPUS & CLASSROOM EXPERIENCE BANNER ==================== */}
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
                  Step inside Career Guidance Academy at Chanban, Udaipur. Explore our multimedia smart classrooms, fully equipped OMR testing center, and dedicated faculty study desks.
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
                <div className="relative rounded-3xl overflow-hidden border-2 border-white/10 bg-slate-950 aspect-[16/9] sm:aspect-[21/9] max-h-[500px] shadow-2xl">
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
                  <Trophy className="w-4 h-4" /> Hall of Fame &amp; Achievements
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a0e2a] mt-1">
                  Our State Rankers &amp; Board Toppers
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Consistent high performers produced through C.G.A Udaipur’s disciplined pedagogy and rigorous testing.
                </p>
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
                    <TopperAvatar
                      name={topper.name}
                      photo={topper.photo}
                      sizeClassName="w-16 h-16"
                      textClassName="text-lg font-black"
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

        {/* ==================== 5. FACULTY PREVIEW ==================== */}
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

      {/* Delete Campus Photo Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteCampusTarget}
        title="Remove Classroom Photo?"
        message={`Are you sure you want to remove photo "${deleteCampusTarget?.title}" from the public front banner?`}
        onCancel={() => setDeleteCampusTarget(null)}
        onConfirm={handleConfirmDeleteCampusPhoto}
      />
    </div>
  );
}
