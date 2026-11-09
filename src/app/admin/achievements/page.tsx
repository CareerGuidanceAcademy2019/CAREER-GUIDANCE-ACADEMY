'use client';

import React, { useState } from 'react';
import { Plus, Trophy, Edit3, Trash2, X, Sparkles } from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { Achievement } from '@/data/initialSeedData';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TopperAvatar } from '@/components/ui/TopperAvatar';
import { generateInitialsAvatarSvgDataUrl, getNameInitials } from '@/lib/avatarGenerator';

export default function AdminAchievementsPage() {
  const { db, saveAchievement, deleteAchievement } = useCga();
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Achievement | null>(null);

  const openAdd = () => {
    setIsNew(true);
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.name.trim()) return;
    const finalPhoto = generateInitialsAvatarSvgDataUrl(editing.name);
    saveAchievement({ ...editing, photo: finalPhoto }, isNew);
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a0e2a]">
            Achievements & Toppers Gallery Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Add, edit, or remove toppers and rank-holders. Photos are automatically generated as high-contrast avatars from student first &amp; last names.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" /> Add Topper / Achiever
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {db.achievements.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between space-y-4"
          >
            <div className="text-center space-y-2">
              <TopperAvatar
                name={item.name}
                photo={item.photo}
                sizeClassName="w-20 h-20"
                textClassName="text-2xl font-black"
                className="mx-auto"
              />
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 text-[#ea580c] border border-amber-200 text-[11px] font-extrabold">
                {item.rank} ({item.year})
              </span>
              <h3 className="text-base font-extrabold text-[#0a0e2a]">{item.name}</h3>
              <p className="text-xs font-bold text-[#0056b3]">{item.exam}</p>
              <p className="text-xs text-slate-600 italic">“{item.quote}”</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsNew(false);
                  setEditing({ ...item });
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(item)}
                className="px-3 py-1.5 rounded-xl bg-red-50 text-[#dc2626] text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/65 p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSave}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-[#0a0e2a]">
                {isNew ? 'Add New Topper / Rank-Holder' : 'Edit Topper Details'}
              </h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-1 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Student First &amp; Last Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ananya Das"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                />
              </div>

              {/* Automatic Name-Initials Avatar Preview */}
              <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 flex items-center gap-3">
                <TopperAvatar
                  name={editing.name || 'New Student'}
                  sizeClassName="w-14 h-14"
                  textClassName="text-lg font-black"
                />
                <div>
                  <span className="text-xs font-extrabold text-[#0a0e2a] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#ea580c]" /> Automatic First &amp; Last Name Avatar
                  </span>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {editing.name.trim()
                      ? `Initials: ${getNameInitials(editing.name)} • System generates high-contrast gradient avatar automatically without media storage.`
                      : 'Type the student name above to preview the initials avatar.'}
                  </p>
                </div>
              </div>

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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rank / Percentage *</label>
                  <input
                    type="text"
                    required
                    value={editing.rank}
                    onChange={(e) => setEditing({ ...editing, rank: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
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
                Save Topper
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
