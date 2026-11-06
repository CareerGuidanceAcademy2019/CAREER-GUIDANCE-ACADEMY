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
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { StudyMaterial } from '@/data/initialSeedData';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

type ActiveSubsection = 'course_materials' | 'current_affairs';
type CaCategoryFilter = 'All' | 'Domestic' | 'International';

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

  // Separate Course Materials vs Current Affairs
  const courseMaterials = useMemo(
    () =>
      (db.studyMaterials || []).filter(
        (m) => m.type !== 'Current Affairs' && !m.caCategory
      ),
    [db.studyMaterials]
  );

  const currentAffairsList = useMemo(
    () =>
      (db.studyMaterials || []).filter(
        (m) => m.type === 'Current Affairs' || Boolean(m.caCategory)
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
Pages: ${mat.pages}
Author: ${mat.author}
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
    setEditingCa({
      id: `ca-${Date.now()}`,
      title: '',
      courseId: firstCourse?.id || 'crs-tet-1-online',
      courseName: 'Current Affairs',
      type: 'Current Affairs',
      caCategory: defaultCat,
      driveLink: '',
      accessScope: 'enrolled',
      author: 'C.G.A Current Affairs Desk, Udaipur',
      pages: 15,
      fileSize: 'PDF (Google Drive)',
      uploadedDate: new Date().toISOString().split('T')[0],
      description: '',
      previewSections: [],
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.title.trim()) return;
    const finalMat: StudyMaterial = {
      ...editing,
      previewSections:
        editing.previewSections.length > 0
          ? editing.previewSections
          : [{ heading: sectionHeading || 'Chapter 1', body: sectionBody || editing.description }],
    };
    saveMaterial(finalMat, isNew);
    setEditing(null);
  };

  const handleSaveCurrentAffairs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCa || !editingCa.title.trim()) {
      showToast('Title Required', 'Please enter a title for the Current Affairs announcement.', 'error');
      return;
    }
    if (!editingCa.driveLink || !editingCa.driveLink.trim()) {
      showToast('Drive Link Required', 'Please provide the Google Drive PDF link for students.', 'error');
      return;
    }
    const finalCa: StudyMaterial = {
      ...editingCa,
      title: editingCa.title.trim(),
      type: 'Current Affairs',
      caCategory: editingCa.caCategory || 'Domestic',
      driveLink: editingCa.driveLink.trim(),
      accessScope: editingCa.accessScope || 'enrolled',
      description:
        editingCa.description.trim() ||
        `${editingCa.caCategory || 'Domestic'} Current Affairs PDF announced by C.G.A Academic Wing.`,
      previewSections: [
        {
          heading: `${editingCa.caCategory || 'Domestic'} Current Affairs`,
          body: editingCa.description.trim() || 'Click the Google Drive link to open the full PDF.',
        },
      ],
    };
    saveMaterial(finalCa, isNewCa);
    setEditingCa(null);
    setActiveSubsection('current_affairs');
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
            Upload course PDFs (Books &amp; Paid Notes) or announce Domestic &amp; International Current
            Affairs with Google Drive PDF links for enrolled or all logged-in students.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start">
          <button
            type="button"
            onClick={openUploadModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold cursor-pointer shadow-xs transition-all"
          >
            <Upload className="w-4 h-4" /> Upload Course Material PDF
          </button>

          <button
            type="button"
            onClick={() => openCurrentAffairsModal('Domestic')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#ea580c] hover:bg-orange-700 text-white text-xs font-bold cursor-pointer shadow-xs transition-all"
          >
            <Bell className="w-4 h-4" /> Announce / Upload Current Affairs
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
          onClick={() => setActiveSubsection('current_affairs')}
          className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeSubsection === 'current_affairs'
              ? 'bg-[#ea580c] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Current Affairs (Domestic &amp; International)</span>
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
                Click &quot;Upload Course Material PDF&quot; above to add books or paid chapter notes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courseMaterials.map((mat) => (
                <div
                  key={mat.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0056b3] text-[11px] font-extrabold whitespace-nowrap shrink-0">
                        {mat.type}
                      </span>
                      <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                        {mat.pages} Pages • {mat.fileSize} • {mat.uploadedDate}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-[#ea580c] uppercase line-clamp-1">
                      Mapped to: {mat.courseName}
                    </p>
                    <h2 className="text-base font-extrabold text-[#0a0e2a]">{mat.title}</h2>
                    <p className="text-xs text-slate-600 line-clamp-2">{mat.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 truncate max-w-[150px]">{mat.author}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAdminDownload(mat)}
                        className="p-2 rounded-xl bg-blue-50 text-[#0056b3] hover:bg-blue-100 cursor-pointer"
                        title="Download Master Copy (Admin Only)"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsNew(false);
                          setEditing({ ...mat });
                        }}
                        className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                        title="Edit Material"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
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
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== SUBSECTION 2: CURRENT AFFAIRS ==================== */}
      {activeSubsection === 'current_affairs' && (
        <div className="space-y-6">
          {/* Current Affairs Banner & Category Filter */}
          <div className="bg-gradient-to-r from-[#0a0e2a] via-[#1e3a8a] to-[#0056b3] rounded-3xl p-6 text-white shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider">
                <Bell className="w-3.5 h-3.5" /> Current Affairs Announcement &amp; PDF Desk
              </div>
              <h2 className="text-xl font-extrabold">
                Domestic &amp; International Current Affairs
              </h2>
              <p className="text-xs text-blue-100 max-w-2xl">
                Publish Current Affairs announcements with Google Drive PDF links. Choose whether each
                release is exclusive to <strong>Enrolled Students</strong> or open to{' '}
                <strong>All Logged-in Students</strong>.
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
              Showing {filteredCurrentAffairs.length} announcement(s)
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
                  No Current Affairs Announced Yet
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Use the buttons above to announce Domestic or International Current Affairs and share
                  the Google Drive PDF link with your students.
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
                return (
                  <div
                    key={ca.id}
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <div
                        className={`h-1.5 w-full ${
                          category === 'Domestic' ? 'bg-emerald-600' : 'bg-indigo-600'
                        }`}
                      />
                      <div className="p-6 space-y-3">
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

                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              isAllLogin
                                ? 'bg-blue-50 text-[#0056b3] border border-blue-200'
                                : 'bg-amber-50 text-[#ea580c] border border-amber-200'
                            }`}
                          >
                            {isAllLogin ? (
                              <>
                                <Users className="w-3 h-3" /> All Login Students
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-3 h-3" /> Enrolled Students Only
                              </>
                            )}
                          </span>
                        </div>

                        <h3 className="text-base font-extrabold text-[#0a0e2a] leading-snug">
                          {ca.title}
                        </h3>

                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                          {ca.description}
                        </p>

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
                        Announced: {ca.uploadedDate}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewCa(false);
                            setEditingCa({ ...ca });
                          }}
                          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                          title="Edit Current Affairs"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
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

      {/* ==================== MODAL 1: COURSE MATERIAL PDF UPLOAD ==================== */}
      {editing && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/65 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSave}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs my-8"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-[#0a0e2a]">
                {isNew ? 'Upload & Map Study Material PDF' : 'Edit Study Material'}
              </h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-1 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Material Title *</label>
                <input
                  type="text"
                  required
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  placeholder="e.g., STGT History & Civics Complete Paid Notes"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Map to Course (Auto-Unlocks for Enrolled Students)
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
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  {db.courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Material Type</label>
                  <select
                    value={editing.type}
                    onChange={(e) =>
                      setEditing({ ...editing, type: e.target.value as StudyMaterial['type'] })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Book PDF">Book PDF</option>
                    <option value="Paid Notes">Paid Notes</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Pages</label>
                  <input
                    type="number"
                    value={editing.pages}
                    onChange={(e) => setEditing({ ...editing, pages: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">File Size</label>
                  <input
                    type="text"
                    value={editing.fileSize}
                    onChange={(e) => setEditing({ ...editing, fileSize: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                />
              </div>

              {isNew && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    In-Browser Reader Sample Content
                  </label>
                  <textarea
                    rows={3}
                    value={sectionBody}
                    onChange={(e) => setSectionBody(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#0056b3] text-white font-bold cursor-pointer"
              >
                Save &amp; Map Material
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== MODAL 2: UPLOAD / ANNOUNCE CURRENT AFFAIRS ==================== */}
      {editingCa && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/65 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveCurrentAffairs}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs my-8"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#ea580c] block">
                  Current Affairs Section
                </span>
                <h3 className="text-base font-extrabold text-[#0a0e2a]">
                  {isNewCa ? 'Announce & Upload Current Affairs PDF' : 'Edit Current Affairs Announcement'}
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
                  1. Select Current Affairs Type *
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

              {/* 2. Target Audience: For Enrolled Students vs For All Login Students */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  2. Who Can Access This Announcement? *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      <div className="font-extrabold text-xs">For Enrolled Students</div>
                      <div className="text-[10px] text-slate-500">
                        Only students enrolled in a course/series
                      </div>
                    </div>
                  </button>

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
                      <div className="font-extrabold text-xs">For All Login Students</div>
                      <div className="text-[10px] text-slate-500">
                        Open to every registered logged-in student
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 3. Announcement Title */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  3. Current Affairs Announcement Title *
                </label>
                <input
                  type="text"
                  required
                  value={editingCa.title}
                  onChange={(e) => setEditingCa({ ...editingCa, title: e.target.value })}
                  placeholder="e.g., November 2026 Domestic Current Affairs & GK Digest"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold"
                />
              </div>

              {/* 4. Google Drive PDF Link */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  4. Google Drive PDF Link *
                </label>
                <input
                  type="url"
                  required
                  value={editingCa.driveLink || ''}
                  onChange={(e) => setEditingCa({ ...editingCa, driveLink: e.target.value })}
                  placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Paste the shareable Google Drive PDF link so eligible students can open or download it.
                </p>
              </div>

              {/* 5. Announcement Details / Description & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Announcement Date</label>
                  <input
                    type="date"
                    value={editingCa.uploadedDate}
                    onChange={(e) => setEditingCa({ ...editingCa, uploadedDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Compiled By / Author</label>
                  <input
                    type="text"
                    value={editingCa.author}
                    onChange={(e) => setEditingCa({ ...editingCa, author: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Announcement Message / Topics Covered
                </label>
                <textarea
                  rows={3}
                  value={editingCa.description}
                  onChange={(e) => setEditingCa({ ...editingCa, description: e.target.value })}
                  placeholder="Describe the key topics, exam relevance (TET, STGT, TPSC, Banking, SSC), or instructions for students..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
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
                className="px-5 py-2.5 rounded-xl bg-[#ea580c] hover:bg-orange-700 text-white font-extrabold cursor-pointer shadow-xs"
              >
                {isNewCa ? 'Announce & Publish Current Affairs' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={
          deleteTarget?.type === 'Current Affairs' || deleteTarget?.caCategory
            ? 'Delete Current Affairs Announcement?'
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
