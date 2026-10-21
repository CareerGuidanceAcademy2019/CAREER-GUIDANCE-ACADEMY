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
  BookOpen,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { FacultyMember } from '@/data/initialSeedData';
import { cgaService, type FacultyAccount } from '@/services/cgaService';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatFacultyName, getFacultyAvatarUrl } from '@/lib/names';

const DESIGNATION_PRESETS = [
  'Director & Senior Faculty',
  'Senior Faculty',
  'Principal',
  'Assistant Teacher',
  'Subject Expert & Faculty',
  'Guest Lecturer',
  'Office Manager',
  'Office Assistant',
];

export default function AdminFacultyPage() {
  const { db, saveFaculty, deleteFaculty, showToast, refresh } = useCga();
  const [activeTab, setActiveTab] = useState<'applications' | 'cards'>('applications');

  // Accounts state
  const [accounts, setAccounts] = useState<FacultyAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Pending' | 'Active' | 'Inactive'>('ALL');
  const [busyId, setBusyId] = useState<string | null>(null);

  // Account editor state (Tab 1)
  const [editingAccount, setEditingAccount] = useState<FacultyAccount | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);

  // Cards editor state (Tab 2)
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
    await Promise.all([loadAccounts(), refresh()]);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount || !editingAccount.name.trim()) return;
    setSavingAccount(true);
    const res = await cgaService.updateFacultyAccount({
      profileId: editingAccount.profileId,
      name: editingAccount.name,
      phone: editingAccount.phone,
      designation: editingAccount.designation,
      qualification: editingAccount.qualification,
      experience: editingAccount.experience,
      workAbility: editingAccount.workAbility,
      achievements: editingAccount.achievements,
      subject: editingAccount.subject,
      status: editingAccount.status,
    });
    setSavingAccount(false);

    if (!res.success) {
      showToast('Error', res.error || 'Failed to update faculty details.', 'error');
      return;
    }

    showToast(
      'Faculty Details Saved',
      `Updated ${editingAccount.name} — Designation set to "${editingAccount.designation}".`,
      'success'
    );
    setEditingAccount(null);
    await Promise.all([loadAccounts(), refresh()]);
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
      photo: '',
      bio: '',
      specializationTags: ['TET & STGT', 'Board Wing'],
    });
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.name.trim()) return;
    const finalPhoto =
      !editing.photo || editing.photo.includes('unsplash.com')
        ? getFacultyAvatarUrl(editing.name)
        : editing.photo;
    await saveFaculty({ ...editing, photo: finalPhoto }, isNew);
    setEditing(null);
    showToast('Saved', `Faculty profile card for ${editing.name} saved with designation "${editing.designation}".`, 'success');
    await Promise.all([loadAccounts(), refresh()]);
  };

  const pendingCount = accounts.filter((a) => a.status === 'Pending').length;

  const filteredAccounts = accounts.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.phone.includes(searchQuery) ||
      a.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.subject && a.subject.toLowerCase().includes(searchQuery.toLowerCase()));
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
            Edit faculty designations and qualifications, review new faculty registrations, and manage public website profiles.
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
          <span>Faculty Accounts &amp; Profiles ({accounts.length})</span>
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
                When new faculty members register or are added, their profiles will appear here.
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
                      <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-200/80">
                        <span className="text-[10px] font-bold text-[#0056b3] block uppercase tracking-wide">
                          1. Designation
                        </span>
                        <span className="font-extrabold text-[#0a0e2a] text-xs">
                          {account.designation || 'Faculty Member'}
                        </span>
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

                    {account.subject && (
                      <p className="text-xs text-[#0a0e2a] bg-orange-50/60 p-2.5 rounded-xl border border-orange-200/70 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-[#ea580c] shrink-0" />
                        <span><strong>Specialization:</strong> {account.subject}</span>
                      </p>
                    )}

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
                  <div className="flex sm:flex-col items-center gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-6 min-w-[200px]">
                    <button
                      type="button"
                      onClick={() => setEditingAccount({ ...account })}
                      className="w-full px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0056b3] text-xs font-bold border border-blue-200 cursor-pointer inline-flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Details &amp; Designation
                    </button>

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
                        src={member.photo || getFacultyAvatarUrl(member.name)}
                        alt={member.name}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = getFacultyAvatarUrl(member.name);
                        }}
                        className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-slate-200"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {member.designation && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-extrabold uppercase tracking-wide">
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
                      className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0056b3] border border-blue-200 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Details &amp; Designation
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

      {/* MODAL 1: EDIT FACULTY ACCOUNT DETAILS & DESIGNATION (TAB 1) */}
      {editingAccount && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/65 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveAccount}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 my-8"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-[#0a0e2a] flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-[#0056b3]" /> Edit Faculty Details
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update designation, qualifications, and profile details for {editingAccount.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Designation with Quick Presets */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-800 block">Faculty Designation *</label>
                  <span className="text-[10px] text-slate-500 font-medium">Quick suggestions:</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {DESIGNATION_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEditingAccount({ ...editingAccount, designation: preset })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        editingAccount.designation === preset
                          ? 'bg-[#0056b3] text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Director & Senior Faculty / Principal / Assistant Teacher"
                  value={editingAccount.designation}
                  onChange={(e) => setEditingAccount({ ...editingAccount, designation: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>

              {/* Name & Specialization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editingAccount.name}
                    onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Subject Specialization</label>
                  <input
                    type="text"
                    placeholder="e.g. TET Bengali, Mathematics"
                    value={editingAccount.subject || ''}
                    onChange={(e) => setEditingAccount({ ...editingAccount, subject: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {/* Phone & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Mobile Phone</label>
                  <input
                    type="text"
                    value={editingAccount.phone}
                    onChange={(e) => setEditingAccount({ ...editingAccount, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Account Status</label>
                  <select
                    value={editingAccount.status}
                    onChange={(e) =>
                      setEditingAccount({
                        ...editingAccount,
                        status: e.target.value as 'Active' | 'Pending' | 'Inactive',
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Active">Active (Approved)</option>
                    <option value="Pending">Pending Approval</option>
                    <option value="Inactive">Inactive / Suspended</option>
                  </select>
                </div>
              </div>

              {/* Qualification & Experience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Educational Qualification</label>
                  <input
                    type="text"
                    placeholder="e.g. M.Sc., B.Ed., NET"
                    value={editingAccount.qualification}
                    onChange={(e) => setEditingAccount({ ...editingAccount, qualification: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Teaching Experience</label>
                  <input
                    type="text"
                    placeholder="e.g. 8 Years Experience"
                    value={editingAccount.experience}
                    onChange={(e) => setEditingAccount({ ...editingAccount, experience: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {/* Work Ability */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Work Ability</label>
                <select
                  value={editingAccount.workAbility || 'Online & Offline'}
                  onChange={(e) => setEditingAccount({ ...editingAccount, workAbility: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Online & Offline">Online &amp; Offline (Standard CGA)</option>
                  <option value="Offline Only">Offline Classroom Only</option>
                  <option value="Online Only">Online Only</option>
                </select>
              </div>

              {/* Achievements */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Achievements &amp; Accolades</label>
                <textarea
                  rows={2}
                  placeholder="e.g. State rank mentor, 200+ TET selections"
                  value={editingAccount.achievements}
                  onChange={(e) => setEditingAccount({ ...editingAccount, achievements: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingAccount}
                className="px-5 py-2 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
              >
                {savingAccount && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Faculty Details</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: EDIT / ADD PUBLIC WEBSITE FACULTY CARD (TAB 2) */}
      {editing && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/65 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveCard}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 my-8"
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

            <div className="space-y-3.5 text-xs">
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

              {/* Designation with Quick Suggestions */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 block">Designation</label>
                  <span className="text-[10px] text-slate-500 font-medium">Quick suggestions:</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {DESIGNATION_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEditing({ ...editing, designation: preset })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        editing.designation === preset
                          ? 'bg-[#0056b3] text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={editing.designation || ''}
                  onChange={(e) => setEditing({ ...editing, designation: e.target.value })}
                  placeholder="e.g. Senior Faculty / Principal / Assistant Teacher"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Subject Specialization *</label>
                <input
                  type="text"
                  required
                  value={editing.subject}
                  onChange={(e) => setEditing({ ...editing, subject: e.target.value })}
                  placeholder="e.g. Bengali (TET-I & TET-II), Mathematics"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200"
                />
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
