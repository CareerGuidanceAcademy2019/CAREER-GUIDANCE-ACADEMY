'use client';

import React, { useState } from 'react';
import { Plus, Edit3, Trash2, X, Briefcase } from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { FacultyMember } from '@/data/initialSeedData';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function AdminFacultyPage() {
  const { db, saveFaculty, deleteFaculty } = useCga();
  const [editing, setEditing] = useState<FacultyMember | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FacultyMember | null>(null);

  const openAdd = () => {
    setIsNew(true);
    setEditing({
      id: `fac-${Date.now()}`,
      name: '',
      designation: 'Assistant Teacher',
      subject: '',
      qualification: 'M.A. / M.Sc., B.Ed., NET',
      experience: '8 Years Experience',
      photo:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      bio: '',
      specializationTags: ['TET & STGT', 'Board Wing'],
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.name.trim()) return;
    saveFaculty(editing, isNew);
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a0e2a]">Faculty Directory Management</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Add, edit, or remove faculty members. Updates immediately appear on the Public Website
            and Student Portal.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" /> Add Faculty Member
        </button>
      </div>

      {db.faculty.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">No Faculty Members Added</h3>
          <p className="text-sm text-slate-500 mt-1">
            Click &quot;Add Faculty Member&quot; above to create a profile.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {db.faculty.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-4">
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-slate-200"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {member.designation && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-extrabold uppercase">
                          {member.designation}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-[#0056b3] text-[11px] font-bold">
                        <Briefcase className="w-3 h-3" /> {member.experience}
                      </span>
                    </div>
                    <h2 className="text-base font-extrabold text-[#0a0e2a] mt-1">{member.name}</h2>
                    <p className="text-xs font-bold text-[#ea580c]">{member.subject}</p>
                  </div>
                </div>
                <p className="text-xs font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-xl">
                  {member.qualification}
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">{member.bio}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsNew(false);
                    setEditing({ ...member });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(member)}
                  className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-[#dc2626] text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/65 p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSave}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-[#0a0e2a]">
                {isNew ? 'Add Faculty Profile' : 'Edit Faculty Profile'}
              </h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-1 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Faculty Name *</label>
                <input
                  type="text"
                  required
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Designation</label>
                  <input
                    type="text"
                    value={editing.designation || ''}
                    onChange={(e) => setEditing({ ...editing, designation: e.target.value })}
                    placeholder="e.g. Principal, Assistant Teacher"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Subject Specialization *</label>
                  <input
                    type="text"
                    required
                    value={editing.subject}
                    onChange={(e) => setEditing({ ...editing, subject: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Qualification</label>
                  <input
                    type="text"
                    value={editing.qualification}
                    onChange={(e) => setEditing({ ...editing, qualification: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Experience</label>
                  <input
                    type="text"
                    value={editing.experience}
                    onChange={(e) => setEditing({ ...editing, experience: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Profile Photo URL</label>
                <input
                  type="text"
                  value={editing.photo}
                  onChange={(e) => setEditing({ ...editing, photo: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Short Academic Bio</label>
                <textarea
                  rows={3}
                  value={editing.bio}
                  onChange={(e) => setEditing({ ...editing, bio: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#0056b3] text-white text-xs font-bold cursor-pointer"
              >
                Save Faculty
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Remove Faculty Profile?"
        message={`Are you sure you want to remove ${deleteTarget?.name} from the C.G.A faculty directory?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteFaculty(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
