'use client';

import React, { useState, useMemo } from 'react';
import {
  Upload,
  FileText,
  Trash2,
  Edit3,
  X,
  Download,
  Globe,
  Landmark,
  ExternalLink,
  Copy,
  Check,
  Users,
  ShieldCheck,
  Bell,
  BookOpen,
  Tag,
  Sparkles,
  CheckCircle2,
  ClipboardCheck,
  Lock,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { StudyMaterial } from '@/data/initialSeedData';
import { MOCK_SERIES_INITIAL } from '@/data/mockSeriesSeedData';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

type ActiveSubsection = 'course_materials' | 'mock_test_pdf' | 'current_affairs';
type CaCategoryFilter = 'All' | 'Domestic' | 'International';

const PRESET_SUBJECTS = [
  'All Competitive Exams',
  'Tripura TET (Paper-I)',
  'Tripura TET (Paper-II Science)',
  'Tripura TET (Paper-II Social Studies)',
  'TRBT STGT (Pure Science)',
  'TRBT STGT (Biological Science)',
  'TRBT STGT (Social Science)',
  'TPSC Combined Services & JRBT',
  'Banking (IBPS/SBI), SSC & Railways',
  'TCS / TPS Civil & Police Services',
  'Tripura Forester & Forest Guard',
  'General Studies & Static GK',
];

export default function AdminStudyMaterialsPage() {
  const { db, saveMaterial, deleteMaterial, showToast } = useCga();

  // Subsection navigation: Course Study Materials vs Current Affairs
  const [activeSubsection, setActiveSubsection] = useState<ActiveSubsection>('course_materials');
  const [caCategoryFilter, setCaCategoryFilter] = useState<CaCategoryFilter>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Course Material Modal State
  const [editing, setEditing] = useState<StudyMaterial | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StudyMaterial | null>(null);
  const [sectionHeading, setSectionHeading] = useState('');
  const [sectionBody, setSectionBody] = useState('');

  // Current Affairs Upload / Announcement Modal State
  const [editingCa, setEditingCa] = useState<StudyMaterial | null>(null);
  const [isNewCa, setIsNewCa] = useState(false);
  const [isCustomSubjectCa, setIsCustomSubjectCa] = useState(false);
  const [isCustomSubjectMat, setIsCustomSubjectMat] = useState(false);

  // Mock Test PDF Upload / Edit Modal State
  const [editingMockPdf, setEditingMockPdf] = useState<StudyMaterial | null>(null);
  const [isNewMockPdf, setIsNewMockPdf] = useState(false);
  const [mockPdfSeriesFilter, setMockPdfSeriesFilter] = useState<string>('all');

  // All ongoing Mock Test Series (dynamically includes every existing & newly launched series)
  const ongoingMockSeriesList = useMemo(() => {
    const raw = db.mockSeries && db.mockSeries.length > 0 ? db.mockSeries : MOCK_SERIES_INITIAL;
    return raw.filter((s) => s.id !== 'series-current-affairs' && s.status !== 'Archived');
  }, [db.mockSeries]);

  // Separate Course Materials vs Mock Test PDFs vs Current Affairs
  const courseMaterials = useMemo(
    () =>
      (db.studyMaterials || []).filter(
        (m) =>
          m.type !== 'Current Affairs' &&
          !m.caCategory &&
          m.type !== 'Mock Test PDF' &&
          !m.seriesId
      ),
    [db.studyMaterials]
  );

  const mockTestPdfsList = useMemo(
    () =>
      (db.studyMaterials || []).filter(
        (m) => m.type === 'Mock Test PDF' || Boolean(m.seriesId)
      ),
    [db.studyMaterials]
  );

  const filteredMockTestPdfs = useMemo(() => {
    if (mockPdfSeriesFilter === 'all') return mockTestPdfsList;
    return mockTestPdfsList.filter(
      (m) => (m.seriesId || m.courseId) === mockPdfSeriesFilter
    );
  }, [mockTestPdfsList, mockPdfSeriesFilter]);

  const currentAffairsList = useMemo(
    () =>
      (db.studyMaterials || []).filter(
        (m) => (m.type === 'Current Affairs' || Boolean(m.caCategory)) && m.type !== 'Mock Test PDF' && !m.seriesId
      ),
    [db.studyMaterials]
  );

  const filteredCurrentAffairs = useMemo(() => {
    if (caCategoryFilter === 'All') return currentAffairsList;
    return currentAffairsList.filter((m) => (m.caCategory || 'Domestic') === caCategoryFilter);
  }, [currentAffairsList, caCategoryFilter]);

  const handleAdminDownload = (mat: StudyMaterial) => {
    const content = `MASTER ARCHIVE — CAREER GUIDANCE ACADEMY (C.G.A), UDAIPUR
Downloaded by: Administrator
Document: ${mat.title}
Course: ${mat.courseName}
Subject: ${mat.subject || 'All Competitive Exams'}
Pages: ${mat.pages}
Author: ${mat.author}
Drive Link: ${mat.driveLink || 'None provided'}
======================================================================
${mat.previewSections.map((s) => `\n--- ${s.heading} ---\n${s.body}\n`).join('\n')}
======================================================================
Confidential Master Copy. Distribution restricted.`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mat.title.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}_Master.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Master File Downloaded', `Downloaded "${mat.title}" for administrator use.`, 'success');
  };

  const openUploadModal = () => {
    const firstCourse = db.courses[0];
    setIsNew(true);
    setIsCustomSubjectMat(false);
    setSectionHeading('Unit 1: Key Examination Concepts & Notes');
    setSectionBody(
      'Exclusive Career Guidance Academy (C.G.A) Udaipur classroom study material prepared for enrolled batch students.'
    );
    setEditing({
      id: `mat-${Date.now()}`,
      title: '',
      courseId: firstCourse?.id || '',
      courseName: firstCourse?.name || '',
      type: 'Paid Notes',
      subject: 'All Competitive Exams',
      price: 199,
      driveLink: '',
      author: 'C.G.A Academic Wing, Udaipur',
      pages: 95,
      fileSize: '3.8 MB',
      uploadedDate: new Date().toISOString().split('T')[0],
      description: '',
      previewSections: [],
    });
  };

  const openCurrentAffairsModal = (defaultCat: 'Domestic' | 'International' = 'Domestic') => {
    const firstCourse = db.courses[0];
    setIsNewCa(true);
    setIsCustomSubjectCa(false);
    setEditingCa({
      id: `ca-${Date.now()}`,
      title: '',
      courseId: firstCourse?.id || 'crs-tet-1-online',
      courseName: 'Current Affairs',
      type: 'Current Affairs',
      caCategory: defaultCat,
      subject: 'All Competitive Exams',
      price: 0, // default to Free; admin can toggle Paid and enter custom price
      driveLink: '',
      accessScope: 'all_logged_in',
      author: 'C.G.A Current Affairs Desk, Udaipur',
      pages: 15,
      fileSize: 'PDF (Google Drive)',
      uploadedDate: new Date().toISOString().split('T')[0],
      description: '',
      previewSections: [],
    });
  };

  const openMockTestPdfModal = (defaultSeriesId?: string) => {
    const firstCourse = db.courses[0];
    const targetSer =
      ongoingMockSeriesList.find((s) => s.id === defaultSeriesId) ||
      ongoingMockSeriesList[0];
    setIsNewMockPdf(true);
    setEditingMockPdf({
      id: `mpdf-${Date.now()}`,
      title: '',
      courseId: firstCourse?.id || 'crs-tet-1-online',
      courseName: targetSer?.name || 'Mock Test Series',
      seriesId: targetSer?.id || 'series-ttet-paper1',
      seriesName: targetSer?.name || 'Tripura TET: Paper-I 2026',
      type: 'Mock Test PDF',
      subject: targetSer?.name || 'Mock Test Series PDF',
      price: 0,
      driveLink: '',
      accessScope: 'enrolled',
      author: 'C.G.A Examination Wing, Udaipur',
      pages: 15,
      fileSize: 'PDF (Google Drive)',
      uploadedDate: new Date().toISOString().split('T')[0],
      description: '',
      previewSections: [],
    });
  };

  const savingRef = React.useRef(false);

  const handleSaveMockTestPdf = (e: React.FormEvent) => {
    e.preventDefault();
    if (savingRef.current) return;
    if (!editingMockPdf || !editingMockPdf.title.trim()) {
      showToast('Title Required', 'Please enter a title for the Mock Test PDF.', 'error');
      return;
    }
    if (!editingMockPdf.seriesId) {
      showToast('Mock Test Series Required', 'Please select the target Mock Test Series.', 'error');
      return;
    }
    if (!editingMockPdf.driveLink || !editingMockPdf.driveLink.trim()) {
      showToast('Drive Link Required', 'Please provide the Google Drive PDF link.', 'error');
      return;
    }
    const selectedSer = ongoingMockSeriesList.find((s) => s.id === editingMockPdf.seriesId);
    const seriesTitle = selectedSer?.name || editingMockPdf.seriesName || editingMockPdf.courseName || 'Mock Test Series';
    const finalMockPdf: StudyMaterial = {
      ...editingMockPdf,
      title: editingMockPdf.title.trim(),
      courseId: db.courses[0]?.id || 'crs-tet-1-online',
      courseName: seriesTitle,
      seriesId: editingMockPdf.seriesId,
      seriesName: seriesTitle,
      type: 'Mock Test PDF',
      subject: (editingMockPdf.subject || seriesTitle).trim(),
      price: 0,
      driveLink: editingMockPdf.driveLink.trim(),
      accessScope: 'enrolled',
      description:
        editingMockPdf.description.trim() ||
        `Exclusive Mock Test PDF & Question Paper Set for students enrolled in ${seriesTitle}.`,
      previewSections: [
        {
          heading: `${seriesTitle} — Mock Test PDF`,
          body:
            editingMockPdf.description.trim() ||
            `Exclusive PDF document for enrolled candidates of ${seriesTitle}. Open the Google Drive PDF link to view or download.`,
        },
      ],
    };
    savingRef.current = true;
    setEditingMockPdf(null);
    setActiveSubsection('mock_test_pdf');
    void saveMaterial(finalMockPdf, isNewMockPdf).finally(() => {
      savingRef.current = false;
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (savingRef.current) return;
    if (!editing || !editing.title.trim()) {
      showToast('Title Required', 'Please enter a title for the study material.', 'error');
      return;
    }
    const finalMat: StudyMaterial = {
      ...editing,
      title: editing.title.trim(),
      courseId: editing.courseId || db.courses[0]?.id || 'crs-tet-1-online',
      courseName: editing.courseName || db.courses.find((c) => c.id === editing.courseId)?.name || 'Course Batch',
      subject: (editing.subject || 'All Competitive Exams').trim(),
      price: editing.price !== undefined && editing.price !== null ? Number(editing.price) : 0,
      driveLink: editing.driveLink ? editing.driveLink.trim() : undefined,
      previewSections:
        editing.previewSections.length > 0
          ? editing.previewSections
          : [{ heading: sectionHeading || 'Chapter 1', body: sectionBody || editing.description }],
    };
    savingRef.current = true;
    setEditing(null);
    void saveMaterial(finalMat, isNew).finally(() => { savingRef.current = false; });
  };

  const handleSaveCurrentAffairs = (e: React.FormEvent) => {
    e.preventDefault();
    if (savingRef.current) return;
    if (!editingCa || !editingCa.title.trim()) {
      showToast('Title Required', 'Please enter a title for the Current Affairs series.', 'error');
      return;
    }
    if (!editingCa.driveLink || !editingCa.driveLink.trim()) {
      showToast('Drive Link Required', 'Please provide the Google Drive PDF link for students.', 'error');
      return;
    }
    const priceNum = editingCa.price !== undefined && editingCa.price !== null ? Math.max(0, Number(editingCa.price)) : 0;
    const finalCa: StudyMaterial = {
      ...editingCa,
      title: editingCa.title.trim(),
      type: 'Current Affairs',
      caCategory: editingCa.caCategory || 'Domestic',
      subject: (editingCa.subject || 'All Competitive Exams').trim(),
      price: priceNum,
      driveLink: editingCa.driveLink.trim(),
      accessScope: editingCa.accessScope || (priceNum > 0 ? 'enrolled' : 'all_logged_in'),
      description:
        editingCa.description.trim() ||
        `${editingCa.caCategory || 'Domestic'} Current Affairs series compiled by C.G.A Academic Wing.`,
      previewSections: [
        {
          heading: `${editingCa.caCategory || 'Domestic'} Current Affairs`,
          body: editingCa.description.trim() || 'Click the Google Drive link to open the full PDF document.',
        },
      ],
    };
    savingRef.current = true;
    setEditingCa(null);
    setActiveSubsection('current_affairs');
    void saveMaterial(finalCa, isNewCa).finally(() => { savingRef.current = false; });
  };

  const handleCopyDriveLink = (id: string, link?: string) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    showToast('Drive Link Copied', 'Google Drive PDF link copied to clipboard.', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a0e2a]">
            Study Materials &amp; Current Affairs Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Manage course study materials and announce Domestic &amp; International Current Affairs with flexible pricing (Free or Paid in ₹), subject selection, and Google Drive PDF links.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start">
          <button
            type="button"
            onClick={openUploadModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold cursor-pointer shadow-xs transition-all"
          >
            <Upload className="w-4 h-4" /> Upload Study Material PDF
          </button>

          <button
            type="button"
            onClick={() => openMockTestPdfModal(mockPdfSeriesFilter !== 'all' ? mockPdfSeriesFilter : undefined)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer shadow-xs transition-all"
          >
            <ClipboardCheck className="w-4 h-4" /> Upload Mock Test PDF
          </button>

          <button
            type="button"
            onClick={() => openCurrentAffairsModal('Domestic')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold cursor-pointer shadow-xs transition-all"
          >
            <Bell className="w-4 h-4" /> Announce / Create Current Affairs
          </button>
        </div>
      </div>

      {/* Subsection Switcher Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 flex flex-wrap items-center gap-2 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveSubsection('course_materials')}
          className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeSubsection === 'course_materials'
              ? 'bg-[#0056b3] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Course Study Materials (PDFs)</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
              activeSubsection === 'course_materials'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {courseMaterials.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubsection('mock_test_pdf')}
          className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeSubsection === 'mock_test_pdf'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Mock Test PDF</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
              activeSubsection === 'mock_test_pdf'
                ? 'bg-white/20 text-white'
                : 'bg-indigo-50 text-indigo-700'
            }`}
          >
            {mockTestPdfsList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubsection('current_affairs')}
          className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeSubsection === 'current_affairs'
              ? 'bg-[#ea580c] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Current Affairs Series (Domestic &amp; International)</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
              activeSubsection === 'current_affairs'
                ? 'bg-white/20 text-white'
                : 'bg-orange-50 text-[#ea580c]'
            }`}
          >
            {currentAffairsList.length}
          </span>
        </button>
      </div>

      {/* ==================== SUBSECTION 1: COURSE STUDY MATERIALS ==================== */}
      {activeSubsection === 'course_materials' && (
        <div className="space-y-4">
          {courseMaterials.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-extrabold text-[#0a0e2a]">No Course Study Materials</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Click &quot;Upload Study Material PDF&quot; above to add books or notes with Google Drive links.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courseMaterials.map((mat) => {
                const isFree = mat.price === 0;
                return (
                  <div
                    key={mat.id}
                    className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between space-y-4 hover:border-blue-300 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0056b3] text-[11px] font-extrabold whitespace-nowrap shrink-0">
                          {mat.type}
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold shrink-0 ${
                            isFree
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isFree ? 'FREE' : `₹${mat.price || 199}/-`}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100 line-clamp-1">
                          {mat.subject || 'All Competitive Exams'}
                        </span>
                        <span className="text-slate-400">
                          {mat.pages} Pages • {mat.fileSize}
                        </span>
                      </div>

                      <p className="text-[11px] font-bold text-[#ea580c] uppercase line-clamp-1">
                        Mapped to: {mat.courseName}
                      </p>

                      <h2 className="text-base font-extrabold text-[#0a0e2a] leading-snug">
                        {mat.title}
                      </h2>

                      <p className="text-xs text-slate-600 line-clamp-2">
                        {mat.description || 'No description provided.'}
                      </p>

                      {/* Google Drive PDF Link Box */}
                      {mat.driveLink && (
                        <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-1.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0056b3] block">
                            Shared Google Drive PDF Link
                          </span>
                          <div className="flex items-center gap-2">
                            <a
                              href={mat.driveLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Open Drive PDF
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopyDriveLink(mat.id, mat.driveLink)}
                              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                              title="Copy Drive Link"
                            >
                              {copiedId === mat.id ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400 truncate max-w-[130px]">{mat.author}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAdminDownload(mat)}
                          className="p-2 rounded-xl bg-blue-50 text-[#0056b3] hover:bg-blue-100 cursor-pointer"
                          title="Download Master Archive (Admin Only)"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsNew(false);
                            setIsCustomSubjectMat(!PRESET_SUBJECTS.includes(mat.subject || 'All Competitive Exams'));
                            setEditing({ ...mat });
                          }}
                          className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer inline-flex items-center gap-1 font-bold text-xs"
                          title="Edit Details & Drive Link"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#0056b3]" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(mat)}
                          className="p-2 rounded-xl bg-red-50 text-[#dc2626] hover:bg-red-100 cursor-pointer"
                          title="Delete Material"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== SUBSECTION 2: MOCK TEST PDF (FOR ENROLLED MOCK SERIES STUDENTS ONLY) ==================== */}
      {activeSubsection === 'mock_test_pdf' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-[#0056b3] rounded-3xl p-6 text-white shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider">
                <ClipboardCheck className="w-3.5 h-3.5" /> Exclusive Mock Test Series PDFs
              </div>
              <h2 className="text-xl font-extrabold">
                Mock Test PDF Hub (Targeted to Ongoing Mock Test Series)
              </h2>
              <p className="text-xs text-blue-100 max-w-2xl">
                Upload Google Drive PDF links targeted to any ongoing Mock Test Series (including any newly launched Mock Test Series). Only students enrolled in the selected Mock Test Series can view and open the PDF; all other students see a locked view.
              </p>
            </div>

            <button
              type="button"
              onClick={() => openMockTestPdfModal(mockPdfSeriesFilter !== 'all' ? mockPdfSeriesFilter : undefined)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-md cursor-pointer shrink-0 transition-all"
            >
              <Upload className="w-4 h-4" /> + Upload Mock Test PDF
            </button>
          </div>

          {/* Series Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
              <label className="text-xs font-extrabold text-slate-700 shrink-0">
                Filter by Mock Test Series ({ongoingMockSeriesList.length} Ongoing Series):
              </label>
              <select
                value={mockPdfSeriesFilter}
                onChange={(e) => setMockPdfSeriesFilter(e.target.value)}
                className="w-full sm:max-w-md px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-900"
              >
                <option value="all">All Ongoing Mock Test Series ({mockTestPdfsList.length} PDFs)</option>
                {ongoingMockSeriesList.map((ser) => {
                  const cnt = mockTestPdfsList.filter((m) => (m.seriesId || m.courseId) === ser.id).length;
                  return (
                    <option key={ser.id} value={ser.id}>
                      {ser.name} (₹{ser.price}/- • {cnt} PDF{cnt === 1 ? '' : 's'})
                    </option>
                  );
                })}
              </select>
            </div>

            <span className="text-xs font-bold text-slate-500">
              Showing {filteredMockTestPdfs.length} Mock Test PDF(s)
            </span>
          </div>

          {filteredMockTestPdfs.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <ClipboardCheck className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-[#0a0e2a]">
                  No Mock Test PDFs Uploaded Yet
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Click &quot;+ Upload Mock Test PDF&quot; to attach a Google Drive PDF link to any ongoing Mock Test Series. Only students enrolled in that series will be able to unlock and view it.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openMockTestPdfModal(mockPdfSeriesFilter !== 'all' ? mockPdfSeriesFilter : undefined)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold cursor-pointer inline-flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" /> + Upload Mock Test PDF
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMockTestPdfs.map((mpdf) => {
                const targetSer = ongoingMockSeriesList.find(
                  (s) => s.id === (mpdf.seriesId || mpdf.courseId)
                );
                const seriesLabel =
                  targetSer?.name || mpdf.seriesName || mpdf.courseName || 'Mock Test Series';

                return (
                  <div
                    key={mpdf.id}
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs flex flex-col justify-between hover:border-indigo-300 transition-all"
                  >
                    <div>
                      <div className="h-1.5 w-full bg-indigo-600" />
                      <div className="p-6 space-y-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-extrabold">
                            <ClipboardCheck className="w-3 h-3" /> Mock Test PDF
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-[#ea580c] border border-amber-200 text-[10px] font-extrabold">
                            <Lock className="w-3 h-3" /> Series Enrolled Only
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-500 block">
                            Targeted Ongoing Mock Test Series:
                          </span>
                          <p className="text-xs font-extrabold text-indigo-950 mt-0.5 line-clamp-2">
                            {seriesLabel}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-slate-500">
                          <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                            {mpdf.subject || 'Mock Test Paper'}
                          </span>
                          <span>
                            {mpdf.pages} Pages • {mpdf.fileSize}
                          </span>
                        </div>

                        <h3 className="text-base font-extrabold text-[#0a0e2a] leading-snug">
                          {mpdf.title}
                        </h3>

                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                          {mpdf.description || 'Exclusive Mock Test PDF for enrolled series students.'}
                        </p>

                        {mpdf.driveLink && (
                          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 block">
                              Shared Google Drive PDF Link
                            </span>
                            <div className="flex items-center gap-2">
                              <a
                                href={mpdf.driveLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" /> Open Drive PDF
                              </a>
                              <button
                                type="button"
                                onClick={() => handleCopyDriveLink(mpdf.id, mpdf.driveLink)}
                                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                                title="Copy Drive Link"
                              >
                                {copiedId === mpdf.id ? (
                                  <Check className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] font-semibold text-slate-500">
                        Uploaded: {mpdf.uploadedDate}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewMockPdf(false);
                            setEditingMockPdf({
                              ...mpdf,
                              seriesId: mpdf.seriesId || mpdf.courseId || ongoingMockSeriesList[0]?.id,
                            });
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-indigo-700 hover:bg-indigo-50 font-extrabold text-xs inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(mpdf)}
                          className="p-2 rounded-xl bg-red-50 text-[#dc2626] hover:bg-red-100 cursor-pointer"
                          title="Delete Mock Test PDF"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== SUBSECTION 3: CURRENT AFFAIRS ==================== */}
      {activeSubsection === 'current_affairs' && (
        <div className="space-y-6">
          {/* Current Affairs Banner & Category Filter */}
          <div className="bg-gradient-to-r from-[#0a0e2a] via-[#1e3a8a] to-[#0056b3] rounded-3xl p-6 text-white shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider">
                <Bell className="w-3.5 h-3.5" /> Current Affairs Series Management
              </div>
              <h2 className="text-xl font-extrabold">
                Domestic &amp; International Current Affairs Series
              </h2>
              <p className="text-xs text-blue-100 max-w-2xl">
                Create and edit Current Affairs series packages just like mock tests and courses. Manage pricing (Free or Custom ₹), select target exam subjects, and attach Google Drive PDF links.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => openCurrentAffairsModal('Domestic')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold shadow-sm cursor-pointer transition-all"
              >
                <Landmark className="w-4 h-4" /> + Domestic Current Affairs
              </button>
              <button
                type="button"
                onClick={() => openCurrentAffairsModal('International')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#ea580c] hover:bg-orange-600 text-white text-xs font-extrabold shadow-sm cursor-pointer transition-all"
              >
                <Globe className="w-4 h-4" /> + International Current Affairs
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {(['All', 'Domestic', 'International'] as const).map((cat) => {
                const count =
                  cat === 'All'
                    ? currentAffairsList.length
                    : currentAffairsList.filter((m) => (m.caCategory || 'Domestic') === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCaCategoryFilter(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                      caCategoryFilter === cat
                        ? 'bg-[#0a0e2a] text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'Domestic' && <Landmark className="w-3.5 h-3.5 text-emerald-400" />}
                    {cat === 'International' && <Globe className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{cat === 'All' ? 'All Current Affairs' : `${cat} Current Affairs`}</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-white/15 text-[10px]">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <span className="text-xs font-bold text-slate-500">
              Showing {filteredCurrentAffairs.length} series package(s)
            </span>
          </div>

          {/* Current Affairs Cards Grid */}
          {filteredCurrentAffairs.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[#ea580c] flex items-center justify-center mx-auto">
                <Globe className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-[#0a0e2a]">
                  No Current Affairs Series Announced Yet
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Click the buttons above to create a Domestic or International Current Affairs series with custom pricing, subject selection, and Google Drive PDF links.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => openCurrentAffairsModal('Domestic')}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold cursor-pointer"
                >
                  + Announce Domestic Current Affairs
                </button>
                <button
                  type="button"
                  onClick={() => openCurrentAffairsModal('International')}
                  className="px-4 py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-extrabold cursor-pointer"
                >
                  + Announce International Current Affairs
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCurrentAffairs.map((ca) => {
                const category = ca.caCategory || 'Domestic';
                const isAllLogin = ca.accessScope === 'all_logged_in';
                const isFree = ca.price === 0;

                return (
                  <div
                    key={ca.id}
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs flex flex-col justify-between hover:border-orange-300 transition-all"
                  >
                    <div>
                      <div
                        className={`h-1.5 w-full ${
                          category === 'Domestic' ? 'bg-emerald-600' : 'bg-indigo-600'
                        }`}
                      />
                      <div className="p-6 space-y-3.5">
                        {/* Badges: Category, Subject & Pricing */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                              category === 'Domestic'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}
                          >
                            {category === 'Domestic' ? (
                              <Landmark className="w-3 h-3" />
                            ) : (
                              <Globe className="w-3 h-3" />
                            )}
                            {category}
                          </span>

                          {/* Price Tag Badge */}
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black shadow-2xs ${
                              isFree
                                ? 'bg-emerald-500 text-white'
                                : 'bg-gradient-to-r from-[#ea580c] to-amber-600 text-white'
                            }`}
                          >
                            {isFree ? (
                              <>
                                <Sparkles className="w-3 h-3" /> FREE
                              </>
                            ) : (
                              <>
                                <Tag className="w-3 h-3" /> ₹{ca.price}/-
                              </>
                            )}
                          </span>
                        </div>

                        {/* Subject Tag & Access Scope */}
                        <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                          <span className="font-extrabold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100">
                            {ca.subject || 'All Competitive Exams'}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              isAllLogin
                                ? 'bg-blue-50 text-[#0056b3]'
                                : 'bg-amber-50 text-[#ea580c]'
                            }`}
                          >
                            {isAllLogin ? (
                              <>
                                <Users className="w-3 h-3" /> All Login Students
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-3 h-3" /> Enrolled Students
                              </>
                            )}
                          </span>
                        </div>

                        <h3 className="text-base font-extrabold text-[#0a0e2a] leading-snug">
                          {ca.title}
                        </h3>

                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                          {ca.description || 'Current Affairs capsule release.'}
                        </p>

                        {/* Drive PDF Link Box */}
                        {ca.driveLink && (
                          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                              Shared Google Drive PDF Link
                            </span>
                            <div className="flex items-center gap-2">
                              <a
                                href={ca.driveLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" /> Open Drive PDF
                              </a>
                              <button
                                type="button"
                                onClick={() => handleCopyDriveLink(ca.id, ca.driveLink)}
                                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                                title="Copy Drive Link"
                              >
                                {copiedId === ca.id ? (
                                  <Check className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] font-semibold text-slate-500">
                        Date: {ca.uploadedDate}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewCa(false);
                            setIsCustomSubjectCa(!PRESET_SUBJECTS.includes(ca.subject || 'All Competitive Exams'));
                            setEditingCa({ ...ca });
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[#0056b3] hover:bg-blue-50 font-extrabold text-xs inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          title="Full Edit Current Affairs Series"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Series</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(ca)}
                          className="p-2 rounded-xl bg-red-50 text-[#dc2626] hover:bg-red-100 cursor-pointer"
                          title="Delete Current Affairs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== MODAL 1: COURSE MATERIAL PDF UPLOAD & EDIT ==================== */}
      {editing && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/65 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSave}
            className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs my-8"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0056b3] block">
                  Course Study Materials
                </span>
                <h3 className="text-base font-extrabold text-[#0a0e2a]">
                  {isNew ? 'Upload & Map Study Material PDF' : 'Edit Study Material Details'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Material Title */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Material Title *</label>
                <input
                  type="text"
                  required
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  placeholder="e.g., TRIPURA FORESTER & FOREST GUARD EXAMS STUDY MATERIALS"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold text-xs"
                />
              </div>

              {/* Map to Course Batch */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Map to Course (Auto-Unlocks for Enrolled Students) *
                </label>
                <select
                  value={editing.courseId}
                  onChange={(e) => {
                    const crs = db.courses.find((c) => c.id === e.target.value);
                    setEditing({
                      ...editing,
                      courseId: e.target.value,
                      courseName: crs?.name || editing.courseName,
                    });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-xs"
                >
                  {db.courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.batchName || 'Regular Batch'} • {c.mode || 'Classroom'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject / Target Examination */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Subject / Target Exam</label>
                <select
                  value={isCustomSubjectMat ? 'CUSTOM' : (editing.subject || 'All Competitive Exams')}
                  onChange={(e) => {
                    if (e.target.value === 'CUSTOM') {
                      setIsCustomSubjectMat(true);
                      setEditing({ ...editing, subject: '' });
                    } else {
                      setIsCustomSubjectMat(false);
                      setEditing({ ...editing, subject: e.target.value });
                    }
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white mb-1.5 text-xs font-semibold"
                >
                  {PRESET_SUBJECTS.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                  <option value="CUSTOM">-- Custom / Other Subject --</option>
                </select>
                {isCustomSubjectMat && (
                  <input
                    type="text"
                    value={editing.subject || ''}
                    onChange={(e) => setEditing({ ...editing, subject: e.target.value })}
                    placeholder="Type custom subject or exam name..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                )}
              </div>

              {/* Material Type, Price, Pages, File Size */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Type</label>
                  <select
                    value={editing.type}
                    onChange={(e) =>
                      setEditing({ ...editing, type: e.target.value as StudyMaterial['type'] })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                  >
                    <option value="Paid Notes">Paid Notes</option>
                    <option value="Book PDF">Book PDF</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={editing.price ?? 199}
                    onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                    placeholder="0 = Free"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pages</label>
                  <input
                    type="number"
                    min={1}
                    value={editing.pages}
                    onChange={(e) => setEditing({ ...editing, pages: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">File Size</label>
                  <input
                    type="text"
                    value={editing.fileSize}
                    onChange={(e) => setEditing({ ...editing, fileSize: e.target.value })}
                    placeholder="3.8 MB"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Description &amp; Chapters</label>
                <textarea
                  rows={2}
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  placeholder="Outline topics, chapters, and key highlights covered in this material..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              {/* GOOGLE DRIVE LINK OF THE PDF / STUDY MATERIAL */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border-2 border-blue-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-[#0056b3] text-xs flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Google Drive PDF / Study Material Link</span>
                  </label>
                  {editing.driveLink && (
                    <a
                      href={editing.driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-[#0056b3] hover:underline inline-flex items-center gap-1"
                    >
                      Test Link ↗
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  value={editing.driveLink || ''}
                  onChange={(e) => setEditing({ ...editing, driveLink: e.target.value })}
                  placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 bg-white font-mono text-xs focus:ring-2 focus:ring-[#0056b3] focus:outline-none"
                />
                <p className="text-[10px] text-slate-500">
                  Paste the shareable Google Drive link of the study material PDF. Enrolled batch students and admins will be able to open the document directly.
                </p>
              </div>

              {/* Sample Content */}
              {isNew && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    In-Browser Reader Sample Content (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={sectionBody}
                    onChange={(e) => setSectionBody(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white font-bold cursor-pointer shadow-xs"
              >
                Save &amp; Post Study Material
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== MODAL 2: CURRENT AFFAIRS SERIES UPLOAD & FULL EDIT ==================== */}
      {editingCa && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/65 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveCurrentAffairs}
            className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs my-8"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#ea580c] block">
                  Current Affairs Series Editor
                </span>
                <h3 className="text-base font-extrabold text-[#0a0e2a]">
                  {isNewCa ? 'Announce & Create Current Affairs Series' : 'Edit Current Affairs Series'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCa(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 1. Category Selection: Domestic vs International */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  1. Current Affairs Scope / Category *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingCa({ ...editingCa, caCategory: 'Domestic' })}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      editingCa.caCategory === 'Domestic'
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl ${
                        editingCa.caCategory === 'Domestic'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs">Domestic</div>
                      <div className="text-[10px] opacity-80">National &amp; State Affairs</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingCa({ ...editingCa, caCategory: 'International' })}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      editingCa.caCategory === 'International'
                        ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl ${
                        editingCa.caCategory === 'International'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs">International</div>
                      <div className="text-[10px] opacity-80">Global &amp; World Affairs</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. Subject / Target Examination Selection */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  2. Select Subject / Target Examination *
                </label>
                <select
                  value={isCustomSubjectCa ? 'CUSTOM' : (editingCa.subject || 'All Competitive Exams')}
                  onChange={(e) => {
                    if (e.target.value === 'CUSTOM') {
                      setIsCustomSubjectCa(true);
                      setEditingCa({ ...editingCa, subject: '' });
                    } else {
                      setIsCustomSubjectCa(false);
                      setEditingCa({ ...editingCa, subject: e.target.value });
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-xs mb-1.5"
                >
                  {PRESET_SUBJECTS.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                  <option value="CUSTOM">-- Custom / Other Examination --</option>
                </select>
                {isCustomSubjectCa && (
                  <input
                    type="text"
                    value={editingCa.subject || ''}
                    onChange={(e) => setEditingCa({ ...editingCa, subject: e.target.value })}
                    placeholder="Enter custom examination or subject name..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                )}
              </div>

              {/* 3. Pricing Management (Free vs Paid) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <label className="font-bold text-slate-800 block">
                  3. Pricing &amp; Access Fee Control *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingCa({ ...editingCa, price: 0 })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      editingCa.price === 0
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        editingCa.price === 0 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs">Free Series (₹0)</div>
                      <div className="text-[10px] opacity-80">Free for all students</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingCa({
                        ...editingCa,
                        price: editingCa.price && editingCa.price > 0 ? editingCa.price : 199,
                      })
                    }
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      editingCa.price && editingCa.price > 0
                        ? 'bg-orange-50 border-[#ea580c] ring-2 ring-[#ea580c]/20 text-slate-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        editingCa.price && editingCa.price > 0
                          ? 'bg-[#ea580c] text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      <Tag className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs">Paid Series (₹)</div>
                      <div className="text-[10px] opacity-80">Manage custom pricing</div>
                    </div>
                  </button>
                </div>

                {editingCa.price !== undefined && editingCa.price > 0 && (
                  <div className="pt-2 border-t border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700">Enter Price (₹) *</span>
                      <div className="flex items-center gap-1">
                        {[49, 99, 199, 299, 499].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setEditingCa({ ...editingCa, price: amt })}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                              editingCa.price === amt
                                ? 'bg-[#ea580c] text-white'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            ₹{amt}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500">
                        ₹
                      </span>
                      <input
                        type="number"
                        min={1}
                        required
                        value={editingCa.price}
                        onChange={(e) => setEditingCa({ ...editingCa, price: Number(e.target.value) })}
                        placeholder="e.g. 199"
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white font-extrabold text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Target Audience Scope */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  4. Student Access Scope *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingCa({ ...editingCa, accessScope: 'all_logged_in' })}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      editingCa.accessScope === 'all_logged_in'
                        ? 'bg-blue-50 border-[#0056b3] ring-2 ring-[#0056b3]/20 text-slate-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl ${
                        editingCa.accessScope === 'all_logged_in'
                          ? 'bg-[#0056b3] text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs">All Login Students</div>
                      <div className="text-[10px] text-slate-500">
                        Available to any registered candidate
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingCa({ ...editingCa, accessScope: 'enrolled' })}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      editingCa.accessScope === 'enrolled'
                        ? 'bg-amber-50 border-[#ea580c] ring-2 ring-[#ea580c]/20 text-slate-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl ${
                        editingCa.accessScope === 'enrolled'
                          ? 'bg-[#ea580c] text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs">Enrolled / Paid Students</div>
                      <div className="text-[10px] text-slate-500">
                        Requires course enrollment or purchase
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 5. Announcement Title */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  5. Current Affairs Series Title *
                </label>
                <input
                  type="text"
                  required
                  value={editingCa.title}
                  onChange={(e) => setEditingCa({ ...editingCa, title: e.target.value })}
                  placeholder="e.g., National & International Current Affairs July, 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold text-xs"
                />
              </div>

              {/* 6. Google Drive PDF Link */}
              <div className="p-3.5 rounded-2xl bg-orange-50/70 border-2 border-orange-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-[#ea580c] text-xs flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>6. Google Drive PDF Link *</span>
                  </label>
                  {editingCa.driveLink && (
                    <a
                      href={editingCa.driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-[#ea580c] hover:underline inline-flex items-center gap-1"
                    >
                      Test Drive Link ↗
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  required
                  value={editingCa.driveLink || ''}
                  onChange={(e) => setEditingCa({ ...editingCa, driveLink: e.target.value })}
                  placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-orange-200 bg-white font-mono text-xs focus:ring-2 focus:ring-[#ea580c] focus:outline-none"
                />
                <p className="text-[10px] text-slate-500">
                  Paste the shareable Google Drive PDF link so students can view, open, or study the capsule document.
                </p>
              </div>

              {/* 7. Date & Author */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Announcement Date</label>
                  <input
                    type="date"
                    value={editingCa.uploadedDate}
                    onChange={(e) => setEditingCa({ ...editingCa, uploadedDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Compiled By / Desk</label>
                  <input
                    type="text"
                    value={editingCa.author}
                    onChange={(e) => setEditingCa({ ...editingCa, author: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              {/* 8. Description */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Topics Covered / Summary Description
                </label>
                <textarea
                  rows={2}
                  value={editingCa.description}
                  onChange={(e) => setEditingCa({ ...editingCa, description: e.target.value })}
                  placeholder="Describe the key headlines, awards, summits, sports, or exam focus..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingCa(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#ea580c] hover:bg-orange-700 text-white font-extrabold cursor-pointer shadow-xs inline-flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isNewCa ? 'Announce & Publish Series' : 'Save Changes & Update'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== MODAL 3: MOCK TEST PDF UPLOAD & EDIT ==================== */}
      {editingMockPdf && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/65 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveMockTestPdf}
            className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs my-8"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 block">
                  Mock Test PDF Section (Enrolled Series Students Only)
                </span>
                <h3 className="text-base font-extrabold text-[#0a0e2a]">
                  {isNewMockPdf ? 'Upload Mock Test PDF (Google Drive Link)' : 'Edit Mock Test PDF Details'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingMockPdf(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 1. Target Ongoing Mock Test Series Selection */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border-2 border-indigo-200 space-y-1.5">
                <label className="font-extrabold text-indigo-950 block text-xs">
                  1. Select Targeted Ongoing Mock Test Series *
                </label>
                <select
                  required
                  value={editingMockPdf.seriesId || ''}
                  onChange={(e) => {
                    const ser = ongoingMockSeriesList.find((s) => s.id === e.target.value);
                    setEditingMockPdf({
                      ...editingMockPdf,
                      seriesId: e.target.value,
                      seriesName: ser?.name || editingMockPdf.seriesName,
                      courseName: ser?.name || editingMockPdf.courseName,
                      subject: ser?.name || editingMockPdf.subject,
                    });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-300 bg-white font-bold text-xs text-slate-900"
                >
                  {ongoingMockSeriesList.map((ser) => (
                    <option key={ser.id} value={ser.id}>
                      {ser.name} (₹{ser.price}/- • {ser.batchLabel || 'Active Batch'} • {ser.status})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-indigo-800 font-medium">
                  All ongoing &amp; newly launched Mock Test Series appear here automatically. Only students enrolled in the selected Mock Test Series will be able to open this PDF; other students will see a Locked view.
                </p>
              </div>

              {/* 2. Mock Test PDF Title */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  2. Mock Test PDF Title *
                </label>
                <input
                  type="text"
                  required
                  value={editingMockPdf.title}
                  onChange={(e) => setEditingMockPdf({ ...editingMockPdf, title: e.target.value })}
                  placeholder="e.g., Forester & Forest Guard Mock Test #01 Question Paper & Answer Key PDF"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold text-xs"
                />
              </div>

              {/* 3. Google Drive PDF Link */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border-2 border-blue-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-[#0056b3] text-xs flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>3. Google Drive PDF Link *</span>
                  </label>
                  {editingMockPdf.driveLink && (
                    <a
                      href={editingMockPdf.driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-[#0056b3] hover:underline inline-flex items-center gap-1"
                    >
                      Test Drive Link ↗
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  required
                  value={editingMockPdf.driveLink || ''}
                  onChange={(e) => setEditingMockPdf({ ...editingMockPdf, driveLink: e.target.value })}
                  placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 bg-white font-mono text-xs focus:ring-2 focus:ring-[#0056b3] focus:outline-none"
                />
                <p className="text-[10px] text-slate-500">
                  Paste the Google Drive share link for the Mock Test PDF. This link is strictly hidden from non-enrolled students.
                </p>
              </div>

              {/* 4. Subject / Section Tag, Pages, File Size */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Subject / Paper Tag</label>
                  <input
                    type="text"
                    value={editingMockPdf.subject || ''}
                    onChange={(e) => setEditingMockPdf({ ...editingMockPdf, subject: e.target.value })}
                    placeholder="e.g. Full Paper / GK & English"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pages</label>
                  <input
                    type="number"
                    min={1}
                    value={editingMockPdf.pages}
                    onChange={(e) => setEditingMockPdf({ ...editingMockPdf, pages: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">File Format / Size</label>
                  <input
                    type="text"
                    value={editingMockPdf.fileSize}
                    onChange={(e) => setEditingMockPdf({ ...editingMockPdf, fileSize: e.target.value })}
                    placeholder="PDF (Google Drive)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              {/* 5. Description */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Description / Exam Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={editingMockPdf.description}
                  onChange={(e) => setEditingMockPdf({ ...editingMockPdf, description: e.target.value })}
                  placeholder="Describe the mock test paper syllabus, OMR practice instructions, or answer key notes..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingMockPdf(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold cursor-pointer shadow-xs inline-flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isNewMockPdf ? 'Upload & Publish Mock Test PDF' : 'Save Mock Test PDF Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={
          deleteTarget?.type === 'Mock Test PDF' || deleteTarget?.seriesId
            ? 'Delete Mock Test PDF?'
            : deleteTarget?.type === 'Current Affairs' || deleteTarget?.caCategory
              ? 'Delete Current Affairs Series?'
              : 'Delete Study Material?'
        }
        message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMaterial(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
