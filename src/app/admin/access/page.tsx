'use client';

import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Mail,
  Phone,
  RefreshCw,
  Clock,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { cgaService, type AllowlistEntry, type PendingAdminApplication } from '@/services/cgaService';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { parseIdentifier, isEmail } from '@/lib/names';

export default function AdminAccessPage() {
  const { showToast } = useCga();
  const [entries, setEntries] = useState<AllowlistEntry[]>([]);
  const [pendingAdmins, setPendingAdmins] = useState<PendingAdminApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AllowlistEntry | null>(null);

  // New entry form
  const [identifier, setIdentifier] = useState('');
  const [role, setRole] = useState<'admin' | 'faculty'>('admin');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    const [allowlistData, pendingData] = await Promise.all([
      cgaService.listAllowlist(),
      cgaService.listPendingAdmins(),
    ]);
    setEntries(allowlistData);
    setPendingAdmins(pendingData);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleApproveAdmin = async (app: PendingAdminApplication) => {
    setBusy(true);
    const res = await cgaService.setAdminApproval(app.id, true);
    setBusy(false);
    if (!res.success) {
      showToast('Approval Error', res.error || 'Failed to approve administrator', 'error');
      return;
    }
    showToast('Administrator Verified', `${app.name} (${app.email}) has been verified and granted administrator access.`, 'success');
    load();
  };

  const handleRejectAdmin = async (app: PendingAdminApplication) => {
    setBusy(true);
    const res = await cgaService.setAdminApproval(app.id, false);
    setBusy(false);
    if (!res.success) {
      showToast('Rejection Error', res.error || 'Failed to reject administrator', 'error');
      return;
    }
    showToast('Application Rejected', `Administrator application for ${app.name} has been rejected.`, 'info');
    load();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsed = parseIdentifier(identifier);
    if (!parsed) {
      setError('Enter a valid email address or 10-digit mobile number.');
      return;
    }

    setBusy(true);
    const res = await cgaService.addAllowlist(parsed.value, role, note);
    setBusy(false);

    if (!res.success) {
      setError(res.error || 'Failed to add entry.');
      return;
    }

    showToast(
      'Access Granted',
      `${parsed.value} added as ${role === 'admin' ? 'Administrator' : 'Faculty'}.`,
      'success'
    );
    setIdentifier('');
    setNote('');
    load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    const res = await cgaService.removeAllowlist(deleteTarget.id);
    setBusy(false);
    setDeleteTarget(null);

    if (!res.success) {
      showToast('Error', res.error || 'Could not remove entry', 'error');
      return;
    }

    showToast('Removed', 'Access entry removed successfully.', 'info');
    load();
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a0e2a] flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-[#0056b3]" /> Administrator &amp; Faculty Access Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Pre-approve emails and mobile numbers for Administrator or Faculty accounts without sharing passwords.
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* How it works info card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl p-6 text-xs text-slate-700 space-y-2">
        <div className="flex items-center gap-2 font-extrabold text-[#0056b3] text-sm">
          <HelpCircle className="w-4 h-4" /> How to grant access to a new Admin or Faculty
        </div>
        <p className="leading-relaxed">
          <strong>1. Add their email or phone below.</strong> You do not need to create or know their password.
        </p>
        <p className="leading-relaxed">
          <strong>2. Ask them to visit the Login page.</strong> They open the <strong>Admin</strong> or <strong>Faculty</strong> tab and click <em>&quot;Create Password&quot;</em>.
        </p>
        <p className="leading-relaxed">
          <strong>3. Automatic Verification:</strong> The database instantly checks this list. If matched, their account is granted the role immediately.
        </p>
      </div>

      {/* Pending Administrator Verification Section */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-extrabold text-[#0a0e2a] flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" /> Pending Administrator Verification Queue
            </h2>
            {pendingAdmins.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-xs">
                {pendingAdmins.length} Awaiting Approval
              </span>
            )}
          </div>
        </div>

        {pendingAdmins.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-bold text-slate-700">No pending administrator applications.</p>
            <p className="text-slate-400 mt-0.5">When new candidates register for administrator access, their requests will appear here for verification.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-6">Applicant Name</th>
                  <th className="py-3 px-6">Email Address</th>
                  <th className="py-3 px-6">Mobile Number</th>
                  <th className="py-3 px-6">Registered On</th>
                  <th className="py-3 px-6 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {pendingAdmins.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">{app.name}</td>
                    <td className="py-4 px-6 font-medium text-slate-800">
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {app.email}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-800">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {app.phone || '—'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500">{app.createdAt}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleApproveAdmin(app)}
                          disabled={busy}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Verify &amp; Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectAdmin(app)}
                          disabled={busy}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs cursor-pointer disabled:opacity-50"
                        >
                          <UserX className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add New Entry Form */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-extrabold text-[#0a0e2a] flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-[#ea580c]" /> Add New Admin or Faculty to Access List
        </h2>

        <form onSubmit={handleAdd} className="space-y-4" noValidate>
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs font-semibold text-[#dc2626]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-5">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Address or 10-digit Mobile Number <span className="text-[#dc2626]">*</span>
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g., admin@gmail.com or 98XXXXXXXX"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Role to Grant</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'faculty')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
              >
                <option value="admin">Administrator (Full Access)</option>
                <option value="faculty">Faculty (Pre-Approved)</option>
              </select>
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Internal Note <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., Director / Head of Math"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="px-5 py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-60"
          >
            {busy ? 'Adding…' : 'Add to Access List'}
          </button>
        </form>
      </div>

      {/* Existing Entries Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#0a0e2a]">
            Current Authorised Access List ({entries.length})
          </h2>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-16 p-8 text-slate-500 text-sm">
            No entries on the access list yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-6">Identifier (Email / Phone)</th>
                  <th className="py-3 px-6">Granted Role</th>
                  <th className="py-3 px-6">Note</th>
                  <th className="py-3 px-6">Added On</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900 flex items-center gap-2">
                      {isEmail(entry.identifier) ? (
                        <Mail className="w-4 h-4 text-slate-400" />
                      ) : (
                        <Phone className="w-4 h-4 text-slate-400" />
                      )}
                      <span>{entry.identifier}</span>
                    </td>
                    <td className="py-4 px-6">
                      {entry.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0a0e2a] text-amber-300 font-bold text-[11px]">
                          <ShieldCheck className="w-3 h-3" /> Administrator
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-50 text-[#ea580c] border border-orange-200 font-bold text-[11px]">
                          Faculty (Pre-Approved)
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-500">{entry.note || '—'}</td>
                    <td className="py-4 px-6 text-slate-400">{entry.createdAt}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(entry)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove Access"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Revoke Authorised Access"
        message={`Are you sure you want to remove ${deleteTarget?.identifier} from the access list? If this is an administrator account, they will lose administrator privileges.`}
        confirmLabel="Remove Access"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
