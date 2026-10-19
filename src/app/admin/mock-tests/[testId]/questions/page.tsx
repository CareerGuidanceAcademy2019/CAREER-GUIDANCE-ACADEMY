'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  Trash2,
  Plus,
  ArrowRight,
  ArrowLeft,
  Eye,
  RefreshCw,
  Sparkles,
  HelpCircle,
  FileSpreadsheet,
  Download,
  Filter,
  Check,
  X,
  Layers,
  Crop,
  HardDrive,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { ParsedMCQ, generateMCQTemplateCsv, validateParsedQuestions } from '@/lib/mcqParser';
import { MathText } from '@/components/ui/MathText';
import { MockQuestionImage } from '@/components/mock-tests/MockQuestionImage';
import { MockQuestionGroup } from '@/data/initialSeedData';

export default function AdminMockTestQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params?.testId as string;
  const { showToast } = useCga();

  const [activeTab, setActiveTab] = useState<'review' | 'paste' | 'pdf' | 'csv' | 'docx' | 'passages'>('review');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testDetails, setTestDetails] = useState<any>(null);

  // Review screen questions and groups
  const [questions, setQuestions] = useState<ParsedMCQ[]>([]);
  const [questionGroups, setQuestionGroups] = useState<MockQuestionGroup[]>([]);
  const [activeQIndex, setActiveQIndex] = useState(0);

  // Filter: 'all' | 'needs-diagram' | 'warnings'
  const [filterMode, setFilterMode] = useState<'all' | 'needs-diagram' | 'warnings'>('all');

  // Paste import state
  const [pastedText, setPastedText] = useState('');
  const [pastedAnswerKey, setPastedAnswerKey] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  // File import state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedZip, setSelectedZip] = useState<File | null>(null);

  // Image Upload / Alt text prompt modal state
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageTarget, setImageTarget] = useState<{
    qIndex: number;
    targetType: 'question' | 'option' | 'explanation' | 'passage';
    optionIdx?: number;
    passageId?: string;
  } | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingAltText, setPendingAltText] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Storage usage
  const [storageUsage, setStorageUsage] = useState<any>(null);
  const [cleaningOrphans, setCleaningOrphans] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  // Load existing questions for this test
  const fetchQuestions = async () => {
    if (!testId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/mock-tests/questions?testId=${encodeURIComponent(testId)}`);
      if (res.ok) {
        const data = await res.json();
        setTestDetails(data.test || null);
        setQuestionGroups(data.questionGroups || []);

        const mapped: ParsedMCQ[] = (data.questions || []).map((q: any, idx: number) => ({
          id: q.id || `q-${idx}`,
          position: q.position || idx + 1,
          question: q.questionText || q.question || '',
          options: Array.isArray(q.options)
            ? q.options.map((o: any) => (typeof o === 'object' && o !== null ? o.text : String(o)))
            : ['Option A', 'Option B', 'Option C', 'Option D'],
          correctOptionIndex: typeof q.correctOption === 'number' ? q.correctOption : 0,
          explanation: q.explanation || '',
          groupId: q.groupId || null,
          imagePath: q.imagePath || null,
          imageAlt: q.imageAlt || null,
          needsDiagram: Boolean(q.imagePath) || false,
          confidence: 'high',
          warnings: [],
        }));

        setQuestions(mapped);
      }
    } catch {
      showToast('Error', 'Failed to fetch test questions.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStorageUsage = async () => {
    try {
      const form = new FormData();
      form.append('action', 'storage-usage');
      const res = await fetch('/api/mock-tests/upload-image', {
        method: 'POST',
        body: form,
      });
      if (res.ok) {
        const data = await res.json();
        setStorageUsage(data);
      }
    } catch {}
  };

  const handleCleanOrphans = async () => {
    setCleaningOrphans(true);
    try {
      const form = new FormData();
      form.append('action', 'clean-orphans');
      const res = await fetch('/api/mock-tests/upload-image', {
        method: 'POST',
        body: form,
      });
      if (res.ok) {
        const data = await res.json();
        showToast('Storage Cleaned', `Scanned ${data.totalFilesScanned} files. Removed ${data.deletedCount} unused orphan files.`, 'success');
        fetchStorageUsage();
      }
    } catch {
      showToast('Cleanup Error', 'Failed to clean orphan images.', 'error');
    } finally {
      setCleaningOrphans(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
    fetchStorageUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  // Filtered questions
  const filteredQuestions = questions.filter((q) => {
    if (filterMode === 'needs-diagram') return q.needsDiagram && !q.imagePath;
    if (filterMode === 'warnings') return q.warnings && q.warnings.length > 0;
    return true;
  });

  const currentQ = questions[activeQIndex] || questions[0];

  const needsDiagramTotal = questions.filter((q) => q.needsDiagram).length;
  const needsDiagramPending = questions.filter((q) => q.needsDiagram && !q.imagePath).length;

  // Jump to next question needing a diagram
  const jumpToNextNeedsDiagram = () => {
    const nextIdx = questions.findIndex((q, i) => i > activeQIndex && q.needsDiagram && !q.imagePath);
    if (nextIdx >= 0) {
      setActiveQIndex(nextIdx);
    } else {
      const anyIdx = questions.findIndex((q) => q.needsDiagram && !q.imagePath);
      if (anyIdx >= 0) setActiveQIndex(anyIdx);
    }
  };

  // Image Upload Handler
  const handleUploadImage = async () => {
    if (!pendingImageFile || !imageTarget) return;
    setUploadingImage(true);

    try {
      const form = new FormData();
      form.append('file', pendingImageFile);
      form.append('testId', testId);
      form.append('maxDimension', imageTarget.targetType);
      form.append('altText', pendingAltText || `Diagram for question ${questions[imageTarget.qIndex]?.position || ''}`);

      const res = await fetch('/api/mock-tests/upload-image', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Upload failed.');
      }

      const data = await res.json();

      if (imageTarget.targetType === 'question') {
        setQuestions((prev) => {
          const next = [...prev];
          next[imageTarget.qIndex] = {
            ...next[imageTarget.qIndex],
            imagePath: data.storagePath,
            imageAlt: pendingAltText || `Diagram for question ${next[imageTarget.qIndex].position}`,
          };
          return next;
        });
        showToast('Diagram Attached', `Optimized WebP created (${(data.processedSize / 1024).toFixed(1)} KB, saved ${data.compressionRatio}%).`, 'success');
        // Jump to next question needing diagram
        setTimeout(jumpToNextNeedsDiagram, 300);
      } else if (imageTarget.targetType === 'passage' && imageTarget.passageId) {
        setQuestionGroups((prev) =>
          prev.map((g) =>
            g.id === imageTarget.passageId
              ? { ...g, imagePath: data.storagePath, imageAlt: pendingAltText || 'Shared passage diagram' }
              : g
          )
        );
        showToast('Passage Diagram Attached', 'Shared passage diagram saved.', 'success');
      }

      setImageModalOpen(false);
      setPendingImageFile(null);
      setPendingAltText('');
      fetchStorageUsage();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to attach image';
      showToast('Image Error', msg, 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  // Parse Text Action
  const handleParseText = async () => {
    if (!pastedText.trim()) return;
    setIsParsing(true);
    try {
      const form = new FormData();
      form.append('text', pastedText);
      if (pastedAnswerKey.trim()) {
        form.append('answerKey', pastedAnswerKey);
      }
      form.append('testId', testId);

      const res = await fetch('/api/admin/parse-test', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Parsing failed.');
      }

      const data = await res.json();
      setQuestions(data.questions || []);
      setActiveTab('review');
      setActiveQIndex(0);
      showToast('Questions Parsed', `Extracted ${data.questions?.length || 0} questions into the review screen.`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to parse text';
      showToast('Parsing Failed', msg, 'error');
    } finally {
      setIsParsing(false);
    }
  };

  // Parse File Action (PDF, CSV+ZIP, DOCX)
  const handleParseFile = async () => {
    if (!selectedFile) return;
    setIsParsing(true);
    try {
      const form = new FormData();
      form.append('file', selectedFile);
      if (selectedZip) {
        form.append('zipFile', selectedZip);
      }
      form.append('testId', testId);

      const res = await fetch('/api/admin/parse-test', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'File parsing failed.');
      }

      const data = await res.json();
      setQuestions(data.questions || []);
      setActiveTab('review');
      setActiveQIndex(0);
      showToast('File Imported', `Extracted ${data.questions?.length || 0} questions into review.`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to parse file';
      showToast('Import Error', msg, 'error');
    } finally {
      setIsParsing(false);
    }
  };

  // Approve and Save Questions
  const handleApproveAndSave = async () => {
    if (questions.length === 0) {
      showToast('Empty Test', 'No questions to save.', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/mock-tests/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId,
          questionGroups,
          questions: questions.map((q, idx) => ({
            position: idx + 1,
            questionText: q.question,
            options: q.options,
            correctOption: q.correctOptionIndex,
            explanation: q.explanation,
            groupId: q.groupId || null,
            imagePath: q.imagePath || null,
            imageAlt: q.imageAlt || null,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Save failed.');
      }

      showToast('Approved & Saved', `Saved ${questions.length} questions and diagrams to database.`, 'success');
      router.push(`/admin/tests`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save error';
      showToast('Error', msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const validation = validateParsedQuestions(questions, testDetails?.questionCount);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <button
            type="button"
            onClick={() => router.push('/admin/tests')}
            className="text-xs font-bold text-slate-500 hover:text-[#0056b3] inline-flex items-center gap-1.5 mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Mock Tests
          </button>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <span>{testDetails?.title || 'Mock Test Questions & Diagrams'}</span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#0056b3] border border-blue-200">
              {questions.length} Questions
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Mandatory Review Screen: Attach diagrams, format formulas, link passages, and verify answers before publishing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(`/admin/tests`)}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={saving || questions.length === 0}
            onClick={handleApproveAndSave}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold cursor-pointer inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Approve and Save Questions
          </button>
        </div>
      </div>

      {/* Storage usage warning bar if >= 80% */}
      {storageUsage && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <HardDrive className={`w-4 h-4 ${storageUsage.isWarning ? 'text-amber-600' : 'text-slate-500'}`} />
            <div>
              <span className="font-bold text-slate-800">Storage Usage: </span>
              <span className="font-semibold text-slate-600">
                {storageUsage.formattedUsed} / {storageUsage.formattedLimit} ({storageUsage.percentageUsed}%)
              </span>
              {storageUsage.isWarning && (
                <span className="ml-2 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Warning: Above 80% limit
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            disabled={cleaningOrphans}
            onClick={handleCleanOrphans}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {cleaningOrphans ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Clean Unused Files
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('review')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
            activeTab === 'review'
              ? 'bg-[#0056b3] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Review Screen ({questions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('paste')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
            activeTab === 'paste'
              ? 'bg-[#0056b3] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Paste Questions
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pdf')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
            activeTab === 'pdf'
              ? 'bg-[#0056b3] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          PDF Import & Crop
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('csv')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
            activeTab === 'csv'
              ? 'bg-[#0056b3] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          CSV / XLSX + ZIP Import
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('docx')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
            activeTab === 'docx'
              ? 'bg-[#0056b3] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          DOCX Import
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('passages')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
            activeTab === 'passages'
              ? 'bg-[#0056b3] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Shared Passages ({questionGroups.length})
        </button>
      </div>

      {/* 1. REVIEW SCREEN */}
      {activeTab === 'review' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Question List Sidebar */}
          <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Question Navigator
              </span>

              {/* Filters */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-2 py-0.5 rounded-lg cursor-pointer ${filterMode === 'all' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'}`}
                >
                  All ({questions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('needs-diagram')}
                  className={`px-2 py-0.5 rounded-lg cursor-pointer ${filterMode === 'needs-diagram' ? 'bg-amber-100 text-amber-900' : 'text-slate-500'}`}
                >
                  Diagrams ({needsDiagramPending})
                </button>
              </div>
            </div>

            {/* Checklist summary alert if warnings */}
            {validation.hasErrors && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Validation Errors:
                </span>
                {validation.warnings.map((w, idx) => (
                  <p key={idx} className="text-[11px]">• {w}</p>
                ))}
              </div>
            )}

            {/* Questions Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-[500px] overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isActive = idx === activeQIndex;
                const needsDiag = q.needsDiagram && !q.imagePath;

                let color = 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50';
                if (isActive) {
                  color = 'bg-[#0056b3] text-white border-[#0056b3] font-black shadow-xs';
                } else if (needsDiag) {
                  color = 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
                } else if (q.imagePath) {
                  color = 'bg-blue-50 text-[#0056b3] border-blue-200 font-bold';
                }

                return (
                  <button
                    key={q.id || idx}
                    type="button"
                    onClick={() => setActiveQIndex(idx)}
                    className={`h-9 rounded-xl border text-xs flex items-center justify-center relative cursor-pointer transition-all ${color}`}
                  >
                    <span>{idx + 1}</span>
                    {q.imagePath && !isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0056b3] absolute top-1 right-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Question Editor */}
          <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            {currentQ ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <span className="text-sm font-extrabold text-[#0056b3]">
                    Editing Question {activeQIndex + 1} of {questions.length}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={activeQIndex === 0}
                      onClick={() => setActiveQIndex((i) => Math.max(0, i - 1))}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold disabled:opacity-40 cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={activeQIndex >= questions.length - 1}
                      onClick={() => setActiveQIndex((i) => Math.min(questions.length - 1, i + 1))}
                      className="px-3 py-1.5 rounded-lg bg-[#0056b3] text-white hover:bg-blue-700 text-xs font-bold disabled:opacity-40 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>

                {/* Question Statement */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                    Question Text (LaTeX formulas $...$ and Markdown tables supported)
                  </label>
                  <textarea
                    rows={4}
                    value={currentQ.question}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQuestions((prev) => {
                        const copy = [...prev];
                        copy[activeQIndex] = { ...copy[activeQIndex], question: val };
                        return copy;
                      });
                    }}
                    className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-[#0056b3] font-mono text-sm leading-relaxed"
                  />
                  {/* Live Render Preview */}
                  <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Rendered Statement:
                    </span>
                    <MathText text={currentQ.question} />
                  </div>
                </div>

                {/* Attached Diagram Section */}
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#0056b3] flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4" /> Attached Question Diagram
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setImageTarget({ qIndex: activeQIndex, targetType: 'question' });
                          setImageModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#0056b3] hover:bg-blue-700 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1"
                      >
                        <Upload className="w-3.5 h-3.5" /> Attach / Replace Diagram
                      </button>

                      {currentQ.imagePath && (
                        <button
                          type="button"
                          onClick={() => {
                            setQuestions((prev) => {
                              const copy = [...prev];
                              copy[activeQIndex] = { ...copy[activeQIndex], imagePath: null, imageAlt: null };
                              return copy;
                            });
                          }}
                          className="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-[#dc2626] text-xs font-bold cursor-pointer inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {currentQ.imagePath ? (
                    <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200">
                      <MockQuestionImage
                        path={currentQ.imagePath}
                        alt={currentQ.imageAlt}
                        testId={testId}
                        type="question"
                        className="w-48 h-32"
                      />
                      <div className="text-xs text-slate-600 space-y-1">
                        <p><strong className="text-slate-800">Storage Path:</strong> {currentQ.imagePath}</p>
                        <p><strong className="text-slate-800">Alt Text:</strong> {currentQ.imageAlt || 'Diagram for question'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                      {currentQ.needsDiagram ? (
                        <span className="text-amber-700 font-bold">
                          Warning: This question references a diagram or table. Please attach an image.
                        </span>
                      ) : (
                        <span>No diagram attached. Clipboard paste (Ctrl+V) works anywhere on this card.</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Options 4 Editor */}
                <div className="space-y-3">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                    Option Choices (Select the radio to set the correct answer)
                  </label>
                  {currentQ.options.map((opt, optIdx) => {
                    const isCorrect = currentQ.correctOptionIndex === optIdx;
                    return (
                      <div
                        key={optIdx}
                        className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                          isCorrect ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setQuestions((prev) => {
                              const copy = [...prev];
                              copy[activeQIndex] = { ...copy[activeQIndex], correctOptionIndex: optIdx };
                              return copy;
                            });
                          }}
                          className={`w-7 h-7 rounded-full text-xs font-extrabold flex items-center justify-center shrink-0 cursor-pointer ${
                            isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </button>

                        <input
                          type="text"
                          value={typeof opt === 'string' ? opt : (opt as any)?.text || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQuestions((prev) => {
                              const copy = [...prev];
                              const opts = [...copy[activeQIndex].options];
                              opts[optIdx] = val;
                              copy[activeQIndex] = { ...copy[activeQIndex], options: opts };
                              return copy;
                            });
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                          className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold"
                        />

                        {isCorrect && (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg shrink-0">
                            Correct Answer
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                    Detailed Solution & Explanation
                  </label>
                  <textarea
                    rows={3}
                    value={currentQ.explanation}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQuestions((prev) => {
                        const copy = [...prev];
                        copy[activeQIndex] = { ...copy[activeQIndex], explanation: val };
                        return copy;
                      });
                    }}
                    className="w-full p-3 rounded-2xl border border-slate-200 font-mono text-xs sm:text-sm leading-relaxed"
                  />
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No questions available. Please use the Paste or Import tabs above.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. PASTE TAB */}
      {activeTab === 'paste' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Paste Multiple-Choice Questions</h2>
            <p className="text-xs text-slate-500">
              Paste questions, options, and answers. Handles English & Bengali numbering, single-line options, and separate answer key sheets.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                Question Text & Options
              </label>
              <textarea
                rows={16}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={`1. What is the SI unit of power?
(A) Joule (B) Watt (C) Newton (D) Pascal
Ans: B
Explanation: Power is the rate of doing work.

2. নিচের কোনটি মৌলিক অধিকার?
(A) সম্পত্তির অধিকার (B) সাম্যের অধিকার (C) ধর্মীয় কর (D) কোনটিই নয়
Ans: B`}
                className="w-full p-4 rounded-2xl border border-slate-200 font-mono text-xs leading-relaxed"
              />
            </div>

            <div className="lg:col-span-4 space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Optional Separate Answer Key Sheet
                </label>
                <textarea
                  rows={8}
                  value={pastedAnswerKey}
                  onChange={(e) => setPastedAnswerKey(e.target.value)}
                  placeholder={`1-B, 2-D, 3-A, 4-C
or
1. B  2. D  3. A`}
                  className="w-full p-3 rounded-2xl border border-slate-200 font-mono text-xs leading-relaxed"
                />
              </div>

              <button
                type="button"
                disabled={isParsing || !pastedText.trim()}
                onClick={handleParseText}
                className="w-full py-3.5 rounded-xl bg-[#0056b3] hover:bg-blue-700 text-white text-xs font-extrabold cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isParsing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Parse and Send to Review Screen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. CSV + ZIP TAB */}
      {activeTab === 'csv' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Import CSV Spreadsheet + Image ZIP</h2>
              <p className="text-xs text-slate-500">
                Upload a structured CSV spreadsheet together with a ZIP file containing question diagrams.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const csvData = generateMCQTemplateCsv();
                const blob = new Blob([csvData], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'cga_mock_test_template.csv';
                a.click();
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download CSV Template
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 text-center space-y-3">
              <FileSpreadsheet className="w-8 h-8 text-[#0056b3] mx-auto" />
              <p className="text-xs font-bold text-slate-700">Select CSV Spreadsheet File</p>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="text-xs text-slate-600 block mx-auto"
              />
            </div>

            <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 text-center space-y-3">
              <Layers className="w-8 h-8 text-amber-600 mx-auto" />
              <p className="text-xs font-bold text-slate-700">Optional: ZIP of Diagram Images</p>
              <input
                type="file"
                accept=".zip"
                onChange={(e) => setSelectedZip(e.target.files?.[0] || null)}
                className="text-xs text-slate-600 block mx-auto"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={isParsing || !selectedFile}
            onClick={handleParseFile}
            className="w-full py-3.5 rounded-xl bg-[#0056b3] hover:bg-blue-700 text-white text-xs font-extrabold cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isParsing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Parse Spreadsheet & Import
          </button>
        </div>
      )}

      {/* 4. DOCX TAB */}
      {activeTab === 'docx' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Word Document (.docx) Import</h2>
            <p className="text-xs text-slate-500">
              Extracts questions and automatically pairs embedded diagram images with their corresponding questions using Mammoth.
            </p>
          </div>

          <div className="p-8 rounded-2xl border-2 border-dashed border-slate-300 text-center space-y-3">
            <FileText className="w-8 h-8 text-[#0056b3] mx-auto" />
            <p className="text-xs font-bold text-slate-700">Select Microsoft Word (.docx) File</p>
            <input
              type="file"
              accept=".docx"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="text-xs text-slate-600 block mx-auto"
            />
          </div>

          <button
            type="button"
            disabled={isParsing || !selectedFile}
            onClick={handleParseFile}
            className="w-full py-3.5 rounded-xl bg-[#0056b3] hover:bg-blue-700 text-white text-xs font-extrabold cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isParsing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Extract Questions and Images from DOCX
          </button>
        </div>
      )}

      {/* Alt Text / Image Upload Prompt Modal */}
      {imageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#0056b3]" />
                <span>Attach Question Diagram</span>
              </h3>
              <button
                type="button"
                onClick={() => setImageModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Image File (PNG, JPG, WebP up to 8MB)</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => setPendingImageFile(e.target.files?.[0] || null)}
                  className="w-full p-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Required Alt Text (Brief diagram description for accessibility)
                </label>
                <input
                  type="text"
                  value={pendingAltText}
                  onChange={(e) => setPendingAltText(e.target.value)}
                  placeholder="e.g. Parallel circuit with two 20-ohm resistors"
                  className="w-full p-3 rounded-xl border border-slate-200 font-semibold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setImageModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={uploadingImage || !pendingImageFile}
                onClick={handleUploadImage}
                className="px-5 py-2 rounded-xl bg-[#0056b3] text-white font-extrabold text-xs cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {uploadingImage ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                Process and Attach
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
