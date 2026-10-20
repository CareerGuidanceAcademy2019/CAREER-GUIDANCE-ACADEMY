'use client';

import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Database,
  FileText,
  Image as ImageIcon,
  Clock,
  Download,
  Trash2,
  RefreshCw,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Calendar,
  Lock,
  Eye,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';

export function MockTestStorageMeter() {
  const { showToast } = useCga();
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Purge Modal State
  const [purgeTarget, setPurgeTarget] = useState<any | null>(null);
  const [confirmTitleInput, setConfirmTitleInput] = useState('');
  const [isPurging, setIsPurging] = useState(false);

  // Extend Retention State
  const [extendTarget, setExtendTarget] = useState<any | null>(null);
  const [extendDays, setExtendDays] = useState<number>(30);
  const [isExtending, setIsExtending] = useState(false);

  // Restore State
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/mock-tests/storage-meter');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      } else {
        showToast('Error', 'Failed to load storage statistics', 'error');
      }
    } catch {
      showToast('Error', 'Network error fetching storage stats', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleDownloadArchive = (testId: string) => {
    window.open(`/api/admin/mock-tests/archive?testId=${encodeURIComponent(testId)}`, '_blank');
    showToast('Archive Download Initiated', 'ZIP archive backup downloaded. Valid for 24h purge authorization.', 'success');
    setTimeout(() => {
      fetchStats();
    }, 2000);
  };

  const handleExecutePurge = async () => {
    if (!purgeTarget) return;
    setIsPurging(true);
    try {
      const res = await fetch('/api/admin/mock-tests/purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: purgeTarget.id,
          confirmTitle: confirmTitleInput,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Purge Completed', data.message, 'success');
        setPurgeTarget(null);
        setConfirmTitleInput('');
        fetchStats();
      } else {
        showToast('Purge Blocked', data.error || 'Failed to purge test.', 'error');
      }
    } catch {
      showToast('Error', 'Network error executing purge.', 'error');
    } finally {
      setIsPurging(false);
    }
  };

  const handleExecuteExtend = async () => {
    if (!extendTarget) return;
    setIsExtending(true);
    try {
      const res = await fetch('/api/admin/mock-tests/retention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: extendTarget.id,
          days: extendDays,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Retention Extended', data.message, 'success');
        setExtendTarget(null);
        fetchStats();
      } else {
        showToast('Error', data.error || 'Failed to extend retention.', 'error');
      }
    } catch {
      showToast('Error', 'Network error extending retention.', 'error');
    } finally {
      setIsExtending(false);
    }
  };

  const handleExecuteRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreFile) return;
    setIsRestoring(true);
    try {
      const formData = new FormData();
      formData.append('archiveZip', restoreFile);

      const res = await fetch('/api/admin/mock-tests/restore', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Restore Successful', data.message, 'success');
        setRestoreFile(null);
        fetchStats();
      } else {
        showToast('Restore Failed', data.error || 'Checksum or manifest verification failed.', 'error');
      }
    } catch {
      showToast('Error', 'Network error during archive restoration.', 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-200">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#0056b3]" />
        <p className="font-bold text-sm">Calculating storage metrics &amp; question lifecycle stats...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-[#0a0e2a] flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-[#0056b3]" />
            Mock Test Storage Meter &amp; Auto-Delete Lifecycle
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor diagram storage, soft-copy question papers, scheduled auto-purges, and archive backups.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchStats}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 self-start cursor-pointer transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Diagram Storage */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-purple-600" /> Diagram Images
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px]">WebP / PNG</span>
          </div>
          <div className="text-2xl font-black text-[#0a0e2a]">
            {stats?.images?.mb || '0.00'} <span className="text-sm font-semibold text-slate-400">MB</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {stats?.images?.count || 0} diagram files in private storage bucket
          </p>
        </div>

        {/* Soft-Copy Papers */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#0056b3]" /> Question Papers
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#0056b3] text-[10px]">PDF</span>
          </div>
          <div className="text-2xl font-black text-[#0a0e2a]">
            {stats?.papers?.mb || '0.00'} <span className="text-sm font-semibold text-slate-400">MB</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {stats?.papers?.count || 0} soft-copy booklets uploaded
          </p>
        </div>

        {/* Question Bank */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-600" /> Active Questions
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px]">MCQ Database</span>
          </div>
          <div className="text-2xl font-black text-[#0a0e2a]">
            {stats?.totalQuestions || 0} <span className="text-sm font-semibold text-slate-400">Qs</span>
          </div>
          <p className="text-[11px] text-slate-500">
            In active &amp; draft mock test papers
          </p>
        </div>

        {/* Content Status Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-2">
          <div className="text-xs font-bold text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-600" /> Lifecycle Status
            </span>
            <span className="text-[10px] text-slate-400">{stats?.tests?.total || 0} Total Tests</span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black">
              {stats?.tests?.active || 0} Active
            </span>
            <span className="px-2 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-black">
              {stats?.tests?.expired || 0} Expired
            </span>
            <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-black">
              {stats?.tests?.purged || 0} Purged
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {stats?.tests?.draft || 0} tests in draft preparation
          </p>
        </div>
      </div>

      {/* Upcoming Auto-Purges & Retention Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[#0a0e2a] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#ea580c]" />
              Upcoming Scheduled Purges &amp; Retention Policy
            </h3>
            <p className="text-xs text-slate-500">
              When a test reaches its purge date, questions &amp; diagram files are cleaned to free storage, while student scores, ranks, and question difficulty statistics remain permanently preserved.
            </p>
          </div>
        </div>

        {(!stats?.upcomingPurges || stats.upcomingPurges.length === 0) ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl text-slate-400 text-xs">
            No tests currently scheduled for purge.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider font-extrabold">
                  <th className="py-3 px-3">Test Title</th>
                  <th className="py-3 px-3">Lifecycle Status</th>
                  <th className="py-3 px-3">Purge Date</th>
                  <th className="py-3 px-3">Archive Status</th>
                  <th className="py-3 px-3 text-right">Lifecycle Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.upcomingPurges.map((test: any) => {
                  const isImminent = test.daysLeft <= 3;
                  const isNear = test.daysLeft <= 7;

                  return (
                    <tr key={test.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 max-w-xs truncate">
                        {test.title}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            test.contentStatus === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : test.contentStatus === 'expired'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {test.contentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <span
                            className={`font-black inline-flex items-center gap-1 ${
                              isImminent
                                ? 'text-[#dc2626]'
                                : isNear
                                ? 'text-[#ea580c]'
                                : 'text-slate-700'
                            }`}
                          >
                            {test.daysLeft > 0 ? `In ${test.daysLeft} days` : 'Overdue for purge'}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {new Date(test.purgeAfter).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {test.archiveRecent ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Backup Ready
                          </span>
                        ) : test.archiveDownloadedAt ? (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                            Downloaded &gt;24h ago
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-500" /> No Backup Downloaded
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownloadArchive(test.id)}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0056b3] transition-all cursor-pointer"
                            title="Download ZIP Archive Backup"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setExtendTarget(test)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                            title="Extend Retention (+Days)"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPurgeTarget(test);
                              setConfirmTitleInput('');
                            }}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-[#dc2626] transition-all cursor-pointer"
                            title="Purge Now"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Restore from Archive Panel */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div>
          <h3 className="text-base font-extrabold text-[#0a0e2a] flex items-center gap-2">
            <Upload className="w-4 h-4 text-emerald-600" />
            Restore Question Paper from Archive Backup (ZIP)
          </h3>
          <p className="text-xs text-slate-500">
            Upload a previously exported self-contained ZIP archive. The system validates SHA-256 integrity checksums, restores questions, diagrams, and answer keys, setting the test status to Draft for admin verification.
          </p>
        </div>

        <form onSubmit={handleExecuteRestore} className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="file"
            accept=".zip"
            onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
            className="flex-1 text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-[#0056b3] hover:file:bg-blue-100 cursor-pointer"
          />
          <button
            type="submit"
            disabled={!restoreFile || isRestoring}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-extrabold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
          >
            {isRestoring ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Restoring Archive...
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" /> Validate &amp; Restore Archive
              </>
            )}
          </button>
        </form>
      </div>

      {/* PURGE CONFIRMATION MODAL */}
      {purgeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-red-600 font-extrabold text-base">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Purge Test Questions &amp; Diagrams</span>
              </div>
              <button
                type="button"
                onClick={() => setPurgeTarget(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are about to purge question content and diagrams for <strong>"{purgeTarget.title}"</strong>.
              All question statements, options, faculty explanations, and diagram files will be permanently deleted.
              Student attempt records, scores, batch ranks, and question difficulty statistics will remain preserved.
            </p>

            {purgeTarget.archiveRecent ? (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Archive backup was downloaded in the last 24 hours. Purge is authorized.</span>
              </div>
            ) : (
              <div className="space-y-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>No recent archive backup detected!</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  We strongly recommend downloading a ZIP backup first. If you wish to discard this test's questions without a backup, please type the exact test title below:
                </p>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Type: <span className="text-slate-900 select-all font-mono">{purgeTarget.title}</span>
                  </label>
                  <input
                    type="text"
                    value={confirmTitleInput}
                    onChange={(e) => setConfirmTitleInput(e.target.value)}
                    placeholder="Type exact title to confirm"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleDownloadArchive(purgeTarget.id)}
                className="px-4 py-2 rounded-xl bg-blue-50 text-[#0056b3] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download Backup First
              </button>
              <button
                type="button"
                onClick={() => setPurgeTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPurging || (!purgeTarget.archiveRecent && confirmTitleInput.trim() !== purgeTarget.title.trim())}
                onClick={handleExecutePurge}
                className="px-4 py-2 rounded-xl bg-[#dc2626] hover:bg-red-700 disabled:opacity-40 text-white text-xs font-black inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
              >
                {isPurging ? 'Purging...' : 'Confirm Purge'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXTEND RETENTION MODAL */}
      {extendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
                <Calendar className="w-5 h-5 text-[#0056b3] shrink-0" />
                <span>Extend Retention Duration</span>
              </div>
              <button
                type="button"
                onClick={() => setExtendTarget(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Extend how long questions and diagram images are kept in active storage for <strong>"{extendTarget.title}"</strong> before automated purging.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {[15, 30, 60].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setExtendDays(days)}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    extendDays === days
                      ? 'bg-[#0056b3] text-white border-[#0056b3] shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  +{days} Days
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setExtendTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isExtending}
                onClick={handleExecuteExtend}
                className="px-4 py-2 rounded-xl bg-[#0056b3] hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-all"
              >
                {isExtending ? 'Saving...' : 'Apply Extension'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
