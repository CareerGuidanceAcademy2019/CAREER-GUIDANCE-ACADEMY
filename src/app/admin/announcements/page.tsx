'use client';

import React, { useState } from 'react';
import { Bell, Plus, Trash2 } from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { Announcement } from '@/data/initialSeedData';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function AdminAnnouncementsPage() {
  const { db, saveAnnouncement, deleteAnnouncement } = useCga();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetBatch, setTargetBatch] = useState('All Batches');
  const [priority, setPriority] = useState<Announcement['priority']>('Important');
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    const courseObj = db.courses.find((c) => c.id === targetBatch);
    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      targetBatch,
      targetLabel: courseObj ? `${courseObj.batchName} (${courseObj.subCategory})` : 'All Batches',
      priority,
      date: new Date().toISOString().split('T')[0],
      author: 'Director, C.G.A',
    };
    saveAnnouncement(newAnn, true);
    setTitle('');
    setContent('');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0a0e2a]">
          Institute & Batch Announcements Bulletin
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Post official notices visible to all students or targeted to specific batches on their
          Student Portal dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Post Form */}
        <form
          onSubmit={handlePost}
          className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4 self-start text-xs"
        >
          <h2 className="text-base font-extrabold text-[#0a0e2a] flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#0056b3]" /> Publish New Notice
          </h2>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Announcement Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Extra Doubt-Clearing Class This Sunday"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Target Audience</label>
              <select
                value={targetBatch}
                onChange={(e) => setTargetBatch(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
              >
                <option value="All Batches">All Batches (Global Notice)</option>
                {db.courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.batchName} ({c.subCategory})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Priority Tag</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Announcement['priority'])}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
              >
                <option value="Normal">Normal</option>
                <option value="Important">Important</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Notice Message *</label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write complete notice details..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white font-bold cursor-pointer"
          >
            Publish Announcement to Student Portal
          </button>
        </form>

        {/* Active Announcements Feed */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-base font-extrabold text-[#0a0e2a] flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#dc2626]" /> Published Notices ({db.announcements.length})
          </h2>

          {db.announcements.map((ann) => (
            <div
              key={ann.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex items-start justify-between gap-4"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase whitespace-nowrap shrink-0 ${
                        ann.priority === 'Urgent'
                          ? 'bg-red-100 text-[#dc2626]'
                          : ann.priority === 'Important'
                          ? 'bg-amber-100 text-[#ea580c]'
                          : 'bg-blue-100 text-[#0056b3]'
                      }`}
                    >
                      {ann.priority}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold uppercase truncate">
                      {ann.targetLabel}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold whitespace-nowrap shrink-0 ml-auto">
                    {ann.date}
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">{ann.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(ann)}
                className="p-2 rounded-xl bg-red-50 text-[#dc2626] hover:bg-red-100 shrink-0 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Notice?"
        message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteAnnouncement(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
