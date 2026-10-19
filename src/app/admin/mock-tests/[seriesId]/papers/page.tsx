'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Upload,
  FileText,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Plus,
  RefreshCw,
  X,
  ExternalLink,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { MOCK_SERIES_INITIAL, MOCK_SUBJECTS_INITIAL } from '@/data/mockSeriesSeedData';

export default function AdminSeriesQuestionPapersPage() {
  const params = useParams();
  const router = useRouter();
  const seriesId = params?.seriesId as string;
  const { showToast } = useCga();

  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Upload Form
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState<string>('all');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'published' | 'scheduled' | 'draft'>('published');
  const [allowDownload, setAllowDownload] = useState(false);
  const [publishAt, setPublishAt] = useState('');
  const [expireAt, setExpireAt] = useState('');
  const [uploading, setUploading] = useState(false);

  const series = MOCK_SERIES_INITIAL.find((s) => s.id === seriesId) || {
    id: seriesId,
    name: 'Tripura TET Mock Test Series',
  };

  const subjects = MOCK_SUBJECTS_INITIAL.filter((s) => s.seriesId === seriesId);

  const fetchPapers = async () => {
    if (!seriesId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/mock-tests/papers?seriesId=${encodeURIComponent(seriesId)}`);
      if (res.ok) {
        const data = await res.json();
        setPapers(data.papers || []);
      }
    } catch {
      showToast('Error', 'Failed to load question papers.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesId]);

  const handleUploadPaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !title.trim()) {
      showToast('Validation Error', 'Please select a PDF file and enter a paper title.', 'error');
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', selectedFile);
      form.append('seriesId', seriesId);
      if (subjectId !== 'all') form.append('subjectId', subjectId);
      form.append('title', title.trim());
      form.append('status', status);
      form.append('allowDownload', String(allowDownload));
      if (publishAt) form.append('publishAt', new Date(publishAt).toISOString());
      if (expireAt) form.append('expireAt', new Date(expireAt).toISOString());

      const res = await fetch('/api/admin/mock-tests/papers', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to upload paper.');
      }

      showToast('Success', 'Question paper PDF uploaded and registered.', 'success');
      setUploadModalOpen(false);
      setTitle('');
      setSelectedFile(null);
      fetchPapers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      showToast('Upload Error', msg, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePaper = async (paperId: string) => {
    if (!confirm('Are you sure you want to delete this question paper?')) return;
    try {
      const res = await fetch(`/api/admin/mock-tests/papers?paperId=${encodeURIComponent(paperId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast('Deleted', 'Question paper removed.', 'success');
        fetchPapers();
      }
    } catch {
      showToast('Error', 'Failed to delete paper.', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => router.push('/admin/tests')}
            className="text-xs font-bold text-slate-500 hover:text-[#0056b3] inline-flex items-center gap-1.5 mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Mock Tests
          </button>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <span>{series.name}</span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#0056b3] border border-blue-200">
              Question Papers
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage soft-copy PDF question booklets. Enrolled students receive automatically watermarked copies stamped with their name and student code.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setUploadModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-[#0056b3] hover:bg-blue-700 text-white text-xs font-extrabold cursor-pointer inline-flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" /> Upload New Question Paper
        </button>
      </div>

      {/* Papers Listing Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#0056b3]" />
          <span>Registered Question Papers ({papers.length})</span>
        </h2>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0056b3]" />
            Loading papers...
          </div>
        ) : papers.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-xs text-slate-500 space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold">No soft-copy question papers uploaded for this series yet.</p>
            <p className="text-slate-400">Click &quot;Upload New Question Paper&quot; above to upload a PDF booklet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-extrabold text-[11px]">
                  <th className="py-3 px-3">Title &amp; Subject</th>
                  <th className="py-3 px-3">Pages / Size</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Download Policy</th>
                  <th className="py-3 px-3">Uploaded</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {papers.map((paper) => {
                  const subjectName =
                    subjects.find((s) => s.id === paper.subject_id)?.name || 'Full-Length / General';

                  return (
                    <tr key={paper.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-3">
                        <span className="font-extrabold text-slate-900 block text-sm">{paper.title}</span>
                        <span className="text-[11px] font-bold text-[#0056b3] bg-blue-50 px-2 py-0.5 rounded">
                          {subjectName}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-600">
                        {paper.page_count} pages • {(paper.file_size_bytes / (1024 * 1024)).toFixed(2)} MB
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                            paper.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800'
                              : paper.status === 'scheduled'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {paper.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        {paper.allow_download ? (
                          <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                            <Download className="w-3.5 h-3.5" /> Download Allowed
                          </span>
                        ) : (
                          <span className="text-slate-500 font-bold inline-flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" /> View Only
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 font-medium">
                        {new Date(paper.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/api/mock-tests/papers/${paper.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-[#0056b3] hover:bg-blue-100 font-bold inline-flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Preview
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeletePaper(paper.id)}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0056b3]" />
                <span>Upload Question Paper PDF</span>
              </h3>
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadPaper} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Paper Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. CDP Sectional Test 1 Question Booklet"
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold bg-white"
                >
                  <option value="all">Full-Length / General (All Subjects)</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select PDF File (Up to 25MB)</label>
                <input
                  type="file"
                  required
                  accept="application/pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full p-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-2 rounded-xl border border-slate-200 font-semibold bg-white"
                  >
                    <option value="published">Publish Immediately</option>
                    <option value="scheduled">Scheduled Window</option>
                    <option value="draft">Draft (Unpublished)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Download Permissions</label>
                  <label className="flex items-center gap-2 mt-2 font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowDownload}
                      onChange={(e) => setAllowDownload(e.target.checked)}
                      className="rounded text-[#0056b3]"
                    />
                    <span>Allow File Download</span>
                  </label>
                </div>
              </div>

              {status === 'scheduled' && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Publish At</label>
                    <input
                      type="datetime-local"
                      value={publishAt}
                      onChange={(e) => setPublishAt(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-200 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Expire At (Optional)</label>
                    <input
                      type="datetime-local"
                      value={expireAt}
                      onChange={(e) => setExpireAt(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-200 font-semibold"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="px-5 py-2 rounded-xl bg-[#0056b3] text-white font-extrabold cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {uploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  Upload and Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
