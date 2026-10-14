'use client';

import React, { useEffect, useState } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  X,
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Phone,
  GraduationCap,
  Award,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { FacultyMember } from '@/data/initialSeedData';
import { cgaService, type FacultyAccount } from '@/services/cgaService';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatFacultyName } from '@/lib/names';

export default function AdminFacultyPage() {
  const { db, saveFaculty, deleteFaculty, showToast } = useCga();
  const [activeTab, setActiveTab] = useState<'applications' | 'cards'>('applications');

  // Accounts state
  const [accounts, setAccounts] = useState<FacultyAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Pending' | 'Active' | 'Inactive'>('ALL');
  const [busyId, setBusyId] = useState<string | null>(null);

  // Cards editor state
  const [editing, setEditing] = useState<FacultyMember | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FacultyMember | null>(null);

  const loadAccounts = async () => {
    setLoadingAccounts(true);
    const data = await cgaService.listFacultyAccounts();
    setAccounts(data);
    setLoadingAccounts(false);
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleApproval = async (profileId: string, approve: boolean) => {
    setBusyId(profileId);
    const res = await cgaService.setFacultyApproval(profileId, approve);
    setBusyId(null);
    if (!res.success) {
      showToast('Error', res.error || 'Failed to update faculty status.', 'error');
      return;
    }
    showToast(
      approve ? 'Faculty Approved' : 'Faculty Application Rejected',
      approve
        ? 'Account activated and public profile approved.'
        : 'Account deactivated.',
      approve ? 'success' : 'info'
    );
    loadAccounts();
  };

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
    showToast('Saved', `Faculty profile for ${editing.name} saved.`, 'success');
  };

  const pendingCount = accounts.filter((a) => a.status === 'Pending').length;

  const filteredAccounts = accounts.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.phone.includes(searchQuery) ||
      a.designation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a0e2a] flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-[#0056b3]" /> Faculty Management &amp; Approvals
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Review new faculty registrations, verify credentials, and manage public website profiles.
          </p>
        </div>

        {activeTab === 'cards' && (
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold cursor-pointer self-start"
          >
            <Plus className="w-4 h-4" /> Add Faculty Card
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('applications')}
          className={`pb-3 px-4 text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all border-b-2 -mb-px ${
            activeTab === 'applications'
              ? 'border-[#0056b3] text-[#0056b3]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Faculty Applications &amp; Accounts</span>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#ea580c] text-white animate-pulse">
              {pendingCount} Pending
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('cards')}
          className={`pb-3 px-4 text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all border-b-2 -mb-px ${
            activeTab === 'cards'
              ? 'border-[#0056b3] text-[#0056b3]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Public Website Cards ({db.faculty.length})</span>
        </button>
      </div>

      {/* TAB 1: APPLICATIONS & ACCOUNTS */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, email, phone or designation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
                {(['ALL', 'Pending', 'Active', 'Inactive'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-all ${
                      statusFilter === st
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st === 'ALL' ? 'All Accounts' : st}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={loadAccounts}
                disabled={loadingAccounts}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer"
                title="Refresh accounts"
              >
                <RefreshCw className={`w-4 h-4 ${loadingAccounts ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Accounts List */}
          {filteredAccounts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8">
              <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No Faculty Accounts Found</h3>
              <p className="text-xs text-slate-500 mt-1">
                When new faculty members register on the site, their submissions will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredAccounts.map((account) => (
                <div
                  key={account.profileId}
                  className={`bg-white rounded-3xl border p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all ${
                    account.status === 'Pending'
                      ? 'border-orange-300 ring-2 ring-orange-200/50 bg-orange-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-extrabold text-[#0a0e2a]">
                        {account.name}
                      </h3>
                      <span className="text-xs font-semibold text-slate-500">
                        (Display: <strong className="text-slate-700">{formatFacultyName(account.name)}</strong>)
                      </span>
                      {account.status === 'Pending' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-100 text-[#ea580c] font-extrabold text-[11px]">
                          <Clock className="w-3 h-3" /> Pending Admin Approval
                        </span>
                      ) : account.status === 'Active' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[11px]">
                          <CheckCircle2 className="w-3 h-3" /> Approved &amp; Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-extrabold text-[11px]">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs text-slate-700">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">1. Designation</span>
                        <span className="font-semibold">{account.designation || '—'}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">2. Qualification</span>
                        <span className="font-semibold">{account.qualification || '—'}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">3. Work Ability</span>
                        <span className="font-bold text-emerald-700">{account.workAbility || 'Online & Offline'}</span>
                      </div>
                    </div>

                    {account.experience && (
                      <p className="text-xs text-slate-600">
                        <strong className="text-slate-800">Experience:</strong> {account.experience}
                      </p>
                    )}

                    {account.achievements && (
                      <p className="text-xs text-amber-900 bg-amber-50/70 p-2.5 rounded-xl border border-amber-100 flex items-start gap-1.5">
                        <Award className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span><strong>Achievements:</strong> {account.achievements}</span>
                      </p>
                    )}

                    {/* Admin-only contact info */}
                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 pt-1">
                      <span className="inline-flex items-center gap-1.5 text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                        <Mail className="w-3.5 h-3.5 text-[#0056b3]" /> {account.email}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <Phone className="w-3.5 h-3.5 text-slate-500" /> {account.phone || 'No phone'}
                      </span>
                      <span className="text-slate-400 text-[11px]">Applied on: {account.createdAt}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col items-center gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-6">
                    {account.status === 'Pending' ? (
                      <>
                        <button
                          type="button"
                          disabled={busyId === account.profileId}
                          onClick={() => handleApproval(account.profileId, true)}
                          className="w-full px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center justify-center gap-1.5 transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve Faculty
                        </button>
                        <button
                          type="button"
                          disabled={busyId === account.profileId}
                          onClick={() => handleApproval(account.profileId, false)}
                          className="w-full px-4 py-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 text-xs font-bold border border-slate-200 cursor-pointer inline-flex items-center justify-center gap-1.5 transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    ) : account.status === 'Active' ? (
                      <button
                        type="button"
                        disabled={busyId === account.profileId}
                        onClick={() => handleApproval(account.profileId, false)}
                        className="w-full px-4 py-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 text-xs font-bold border border-slate-200 cursor-pointer inline-flex items-center justify-center gap-1.5 transition-all"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Deactivate
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busyId === account.profileId}
                        onClick={() => handleApproval(account.profileId, true)}
                        className="w-full px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center justify-center gap-1.5 transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Reactivate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PUBLIC WEBSITE CARDS */}
      {activeTab === 'cards' && (
        <div className="space-y-4">
          {db.faculty.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-700">No Faculty Cards Configured</h3>
              <p className="text-sm text-slate-500 mt-1">
                Click &quot;Add Faculty Card&quot; above to create a profile card.
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
                        src={member.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
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
                        <span className="text-[11px] text-slate-500 block">
                          Public Display: <strong className="text-slate-800">{formatFacultyName(member.name)}</strong>
                        </span>
                        {member.subject && (
                          <p className="text-xs font-bold text-[#ea580c]">{member.subject}</p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-xl">
                      {member.qualification}
                    </p>
                    {member.bio && (
                      <p className="text-xs text-slate-600 leading-relaxed">{member.bio}</p>
                    )}
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
        </div>
      )}

      {/* Faculty Card Modal */}
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
                {isNew ? 'Add Faculty Profile Card' : 'Edit Faculty Profile Card'}
              </h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
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
                <p className="text-[11px] text-slate-400 mt-1">
                  Will be displayed on website as: {formatFacultyName(editing.name)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Designation</label>
                  <input
                    type="text"
                    value={editing.designation || ''}
                    onChange={(e) => setEditing({ ...editing, designation: e.target.value })}
                    placeholder="e.g. Senior Faculty"
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
                Save Faculty Card
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
