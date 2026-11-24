'use client';

import React, { useState, useRef } from 'react';
import {
  Plus,
  Trophy,
  Edit3,
  Trash2,
  X,
  Upload,
  Camera,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { Achievement } from '@/data/initialSeedData';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  compressTopperPhoto,
  getDataUrlSizeKb,
  TOPPER_DP_MIN_KB,
  TOPPER_DP_MAX_KB,
  type CompressionResult,
} from '@/lib/imageCompressor';
import { generateInitialsAvatarSvgDataUrl } from '@/lib/avatarGenerator';

const ACHIEVEMENT_CATEGORIES = [
  'Teaching and Recruitment Exams',
  'Banking, SSC and Railway',
  'School Coaching',
];

export default function AdminAchievementsPage() {
  const { db, session, saveAchievement, deleteAchievement, showToast } = useCga();
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Achievement | null>(null);
  const [dpCompression, setDpCompression] = useState<CompressionResult | null>(null);
  const [isCompressingDp, setIsCompressingDp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const dpInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = session?.role === 'ADMIN';

  const openAdd = () => {
    setIsNew(true);
    setDpCompression(null);
    setEditing({
      id: `ach-${Date.now()}`,
      name: '',
      exam: 'Tripura TET / STGT / TPSC',
      rank: 'State Rank 01',
      year: '2026',
      photo: '',
      quote: 'C.G.A Udaipur’s regular mock tests and notes helped me achieve this rank.',
      category: 'Teaching and Recruitment Exams',
    });
  };

  const openEdit = (item: Achievement) => {
    setIsNew(false);
    setDpCompression(null);
    setEditing({ ...item });
  };

  const handleSelectCandidateDp = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    e.target.value = '';

    if (!isAdmin) {
      showToast('Admin Only', 'Only administrators are permitted to upload or change topper photos.', 'error');
      return;
    }

    setIsCompressingDp(true);
    try {
      const res = await compressTopperPhoto(file);
      if (res.compressedSizeKb < TOPPER_DP_MIN_KB || res.compressedSizeKb > TOPPER_DP_MAX_KB) {
        showToast(
          'DP Size Restricted (20 KB – 50 KB)',
          `Processed image is ${res.compressedSizeKb} KB. Please select a clear portrait photograph that fits within ${TOPPER_DP_MIN_KB} KB – ${TOPPER_DP_MAX_KB} KB.`,
          'error'
        );
        return;
      }
      setDpCompression(res);
      setEditing((prev) => (prev ? { ...prev, photo: res.dataUrl } : prev));
      showToast(
        'Candidate DP Ready',
        `High-clarity portrait prepared at ${res.compressedSizeKb} KB (within ${TOPPER_DP_MIN_KB} KB – ${TOPPER_DP_MAX_KB} KB limit).`,
        'success'
      );
    } catch (err: any) {
      showToast('Photo Upload Error', err?.message || 'Could not process candidate DP.', 'error');
    } finally {
      setIsCompressingDp(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.name.trim()) return;
    if (!isAdmin) {
      showToast('Admin Required', 'Only administrators can add or edit toppers.', 'error');
      return;
    }
    if (!editing.photo || !editing.photo.trim()) {
      showToast(
        'Candidate DP Required',
        `Please upload the candidate's DP (${TOPPER_DP_MIN_KB} KB to ${TOPPER_DP_MAX_KB} KB) before saving.`,
        'error'
      );
      return;
    }

    if (editing.photo.startsWith('data:image/') && !editing.photo.startsWith('data:image/svg+xml')) {
      const kb = getDataUrlSizeKb(editing.photo);
      if (kb < TOPPER_DP_MIN_KB || kb > TOPPER_DP_MAX_KB) {
        showToast(
          'DP Size Limit (20 KB – 50 KB)',
          `Candidate DP is ${kb} KB. It must be between ${TOPPER_DP_MIN_KB} KB and ${TOPPER_DP_MAX_KB} KB.`,
          'error'
        );
        return;
      }
    }

    setIsSaving(true);
    await saveAchievement(
      {
        ...editing,
        name: editing.name.trim(),
        exam: editing.exam.trim(),
        rank: editing.rank.trim(),
        year: editing.year.trim(),
        quote: editing.quote.trim(),
        category: editing.category || 'Teaching and Recruitment Exams',
      },
      isNew
    );
    setIsSaving(false);
    setDpCompression(null);
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a0e2a]">
            Achievements &amp; Toppers Gallery Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Add, edit, or remove toppers and rank-holders. Upload or re-upload the candidate&apos;s actual DP (strictly {TOPPER_DP_MIN_KB} KB to {TOPPER_DP_MAX_KB} KB with high-clarity preservation).
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold cursor-pointer self-start shadow-xs"
          >
            <Plus className="w-4 h-4" /> Add Topper / Achiever
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {db.achievements.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between space-y-4"
          >
            <div className="text-center space-y-2">
              <div className="relative inline-block">
                <img
                  src={item.photo || generateInitialsAvatarSvgDataUrl(item.name)}
                  alt={item.name}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = generateInitialsAvatarSvgDataUrl(item.name);
                  }}
                  className="w-20 h-20 rounded-full object-cover mx-auto ring-2 ring-[#ea580c] shadow-xs"
                />
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#0056b3] hover:bg-[#1e3a8a] text-white shadow-md cursor-pointer"
                    title="Change / Re-upload Candidate DP"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 text-[#ea580c] border border-amber-200 text-[11px] font-extrabold">
                  {item.rank} ({item.year})
                </span>
              </div>
              <h3 className="text-base font-extrabold text-[#0a0e2a]">{item.name}</h3>
              <p className="text-xs font-bold text-[#0056b3]">{item.exam}</p>
              <p className="text-xs text-slate-600 italic">“{item.quote}”</p>
            </div>

            {isAdmin && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0056b3] text-xs font-bold inline-flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit / Change DP
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(item)}
                  className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-[#dc2626] text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {isAdmin && editing && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/65 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSave}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs my-8"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#ea580c] block">
                  Admin Toppers Hall of Fame
                </span>
                <h3 className="text-base font-extrabold text-[#0a0e2a]">
                  {isNew ? 'Add New Topper / Rank-Holder' : 'Edit Topper & Change Candidate DP'}
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
              {/* Candidate DP Upload & Re-upload Box (Strictly 20 KB to 50 KB) */}
              <div className="p-4 rounded-2xl bg-slate-50 border-2 border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-[#0a0e2a] text-xs flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-[#0056b3]" />
                    <span>Candidate DP / Photograph ({TOPPER_DP_MIN_KB} KB – {TOPPER_DP_MAX_KB} KB) *</span>
                  </label>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#0056b3] text-[10px] font-extrabold">
                    Admin Only
                  </span>
                </div>

                <input
                  ref={dpInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleSelectCandidateDp}
                  className="hidden"
                />

                <div className="flex items-center gap-3.5">
                  {editing.photo ? (
                    <img
                      src={editing.photo}
                      alt={editing.name || 'Candidate DP Preview'}
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-[#ea580c] shrink-0 bg-white shadow-xs"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-100 border-2 border-dashed border-blue-300 flex items-center justify-center text-[#0056b3] shrink-0">
                      <Camera className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <button
                      type="button"
                      disabled={isCompressingDp}
                      onClick={() => dpInputRef.current?.click()}
                      className="w-full py-2 px-3 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                    >
                      {isCompressingDp ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Optimizing DP (20–50 KB)…</span>
                        </>
                      ) : editing.photo ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Change / Re-upload Candidate DP</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Candidate DP</span>
                        </>
                      )}
                    </button>

                    {dpCompression ? (
                      <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          DP Size: {dpCompression.compressedSizeKb} KB (within {TOPPER_DP_MIN_KB}–{TOPPER_DP_MAX_KB} KB limit, high clarity)
                        </span>
                      </p>
                    ) : editing.photo ? (
                      <p className="text-[11px] text-slate-600 font-medium">
                        Current DP active ({getDataUrlSizeKb(editing.photo)} KB). Click above to replace or re-upload anytime.
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>Upload JPG/PNG/WebP. Auto-optimized to {TOPPER_DP_MIN_KB} KB – {TOPPER_DP_MAX_KB} KB without quality loss.</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Candidate Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ananya Das"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Examination Name *</label>
                  <input
                    type="text"
                    required
                    value={editing.exam}
                    onChange={(e) => setEditing({ ...editing, exam: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Exam Category *</label>
                  <select
                    value={editing.category || ACHIEVEMENT_CATEGORIES[0]}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                  >
                    {ACHIEVEMENT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rank / Score *</label>
                  <input
                    type="text"
                    required
                    value={editing.rank}
                    onChange={(e) => setEditing({ ...editing, rank: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-bold text-[#ea580c]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Year *</label>
                  <input
                    type="text"
                    required
                    value={editing.year}
                    onChange={(e) => setEditing({ ...editing, year: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Student Testimonial Quote</label>
                <textarea
                  rows={2}
                  value={editing.quote}
                  onChange={(e) => setEditing({ ...editing, quote: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                />
              </div>
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
                disabled={isSaving || isCompressingDp}
                className="px-5 py-2 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white font-bold cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Saving…' : isNew ? 'Publish Topper' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Remove Topper Entry?"
        message={`Are you sure you want to remove ${deleteTarget?.name} from the Achievements gallery?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteAchievement(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
