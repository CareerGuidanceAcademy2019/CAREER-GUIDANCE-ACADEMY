'use client';

import React, { useState, useRef } from 'react';
import {
  Plus,
  ClipboardCheck,
  Trophy,
  Trash2,
  X,
  Send,
  Upload,
  FileText,
  FileUp,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Edit2,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { MockTest, MCQQuestion } from '@/data/initialSeedData';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CustomCheckSvg, CustomCrossSvg } from '@/components/ui/CustomIcons';
import { parseRawQuestionsText } from '@/lib/mcqParser';

export default function AdminMockTestsPage() {
  const { db, saveMockTest, deleteMockTest, showToast } = useCga();
  const [editingTest, setEditingTest] = useState<MockTest | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MockTest | null>(null);
  const [selectedTestForRanks, setSelectedTestForRanks] = useState<string>(
    db.mockTests[0]?.id || ''
  );

  // Bulk Import Tab state inside the modal
  const [importMode, setImportMode] = useState<'upload' | 'paste' | 'manual'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Question builder state inside modal (optional fallback)
  const [newQText, setNewQText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctIdx, setCorrectIdx] = useState(0);
  const [explanation, setExplanation] = useState('');

  const openCreateModal = () => {
    const firstCourse = db.courses[0];
    setIsNew(true);
    setPastedText('');
    setParseError('');
    setImportMode('upload');
    setEditingTest({
      id: `mock-${Date.now()}`,
      title: '',
      courseId: firstCourse?.id || '',
      courseName: firstCourse?.name || '',
      batchName: firstCourse?.batchName || '',
      durationMinutes: 30,
      totalMarks: 20,
      marksPerQuestion: 2,
      negativeMarking: 0.5,
      scheduledDate: new Date().toISOString().split('T')[0],
      status: 'Published',
      questions: [],
    });
  };

  // 1. Bulk PDF or Document File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingTest) return;

    setIsParsing(true);
    setParseError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/parse-test', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract questions from file.');
      }

      const extracted: MCQQuestion[] = data.questions;
      const combined = [...editingTest.questions, ...extracted];
      const newTotal = combined.length * editingTest.marksPerQuestion;

      setEditingTest({
        ...editingTest,
        questions: combined,
        totalMarks: newTotal,
      });

      showToast(
        'Questions Extracted Successfully!',
        `Extracted ${extracted.length} questions from ${file.name}. Review them below.`,
        'success'
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setParseError(message);
      showToast('Document Parsing Error', message, 'error');
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 2. Bulk Text Parse Handler (Instant client-side extraction)
  const handleParsePastedText = () => {
    if (!pastedText.trim() || !editingTest) return;
    setParseError('');

    try {
      const extracted = parseRawQuestionsText(pastedText);
      if (extracted.length === 0) {
        setParseError(
          'Could not detect multiple-choice questions. Ensure questions start with 1. or Q1. and have options (A, B, C, D).'
        );
        return;
      }

      const combined = [...editingTest.questions, ...extracted];
      const newTotal = combined.length * editingTest.marksPerQuestion;

      setEditingTest({
        ...editingTest,
        questions: combined,
        totalMarks: newTotal,
      });

      setPastedText('');
      showToast(
        'Parsed Successfully!',
        `Added ${extracted.length} separated questions to this test.`,
        'success'
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Parsing error';
      setParseError(message);
    }
  };

  // Sample template insertion helper for admin convenience
  const handleInsertSampleTemplate = () => {
    const sample = `1. Who is considered the father of Educational Psychology?
(A) E.L. Thorndike
(B) Jean Piaget
(C) John Dewey
(D) Sigmund Freud
Ans: A
Explanation: Edward Lee Thorndike is widely recognized as the father of modern Educational Psychology.

2. Which river flows through Udaipur in Gomati District of Tripura?
(A) Manu
(B) Gomati
(C) Howrah
(D) Khowai
Ans: B
Explanation: The holy Gomati river flows through Udaipur in Gomati district.

3. In right-angled triangle ABC with hypotenuse 10 and base 6, find the height:
(A) 6
(B) 7
(C) 8
(D) 9
Ans: C
Explanation: By Pythagorean theorem: sqrt(10^2 - 6^2) = sqrt(100 - 36) = 8.`;
    setPastedText(sample);
  };

  // 3. Manual Single Question Add (Fallback)
  const handleAddSingleQuestion = () => {
    if (!editingTest || !newQText.trim() || !optA.trim() || !optB.trim()) return;
    const q: MCQQuestion = {
      id: `q-${Date.now()}`,
      question: newQText.trim(),
      options: [optA.trim(), optB.trim(), optC.trim() || 'Option C', optD.trim() || 'Option D'],
      correctOptionIndex: correctIdx,
      explanation: explanation.trim() || 'Refer to C.G.A classroom notes.',
    };
    const nextQs = [...editingTest.questions, q];
    setEditingTest({
      ...editingTest,
      questions: nextQs,
      totalMarks: nextQs.length * editingTest.marksPerQuestion,
    });
    setNewQText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setExplanation('');
  };

  const handleRemoveQuestion = (qId: string) => {
    if (!editingTest) return;
    const filtered = editingTest.questions.filter((q) => q.id !== qId);
    setEditingTest({
      ...editingTest,
      questions: filtered,
      totalMarks: filtered.length * editingTest.marksPerQuestion,
    });
  };

  const handleUpdateQuestionCorrectOpt = (qId: string, optIndex: number) => {
    if (!editingTest) return;
    const updated = editingTest.questions.map((q) =>
      q.id === qId ? { ...q, correctOptionIndex: optIndex } : q
    );
    setEditingTest({ ...editingTest, questions: updated });
  };

  const handleSaveTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTest || !editingTest.title.trim()) {
      showToast('Validation Error', 'Please specify a mock test title.', 'error');
      return;
    }
    if (editingTest.questions.length === 0) {
      showToast('No Questions Added', 'Please upload a PDF/text or paste questions before saving.', 'error');
      return;
    }

    const computedMarks = editingTest.questions.length * editingTest.marksPerQuestion;
    saveMockTest({ ...editingTest, totalMarks: computedMarks }, isNew);
    setEditingTest(null);
  };

  const togglePublish = (test: MockTest) => {
    saveMockTest(
      {
        ...test,
        status: test.status === 'Published' ? 'Draft' : 'Published',
      },
      false
    );
  };

  const rankListAttempts = db.testAttempts
    .filter((a) => a.testId === selectedTestForRanks)
    .sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a0e2a]">
            Mock Test Builder, Batch Launch & Rank Lists
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Upload questions directly as PDF or text, auto-extract MCQs into structured tests, launch for
            batches, and inspect merit rank lists.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-bold cursor-pointer self-start shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Create & Upload Mock Test
        </button>
      </div>

      {/* Mock Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {db.mockTests.map((test) => (
          <div
            key={test.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0056b3] text-[11px] font-extrabold truncate">
                  {test.batchName}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold whitespace-nowrap shrink-0 ${
                    test.status === 'Published'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-[#ea580c] border border-amber-200'
                  }`}
                >
                  {test.status}
                </span>
              </div>

              <h2 className="text-base font-extrabold text-[#0a0e2a]">{test.title}</h2>
              <p className="text-xs text-slate-500">
                {test.questions.length} Questions • {test.totalMarks} Marks • {test.durationMinutes}{' '}
                Mins • -{test.negativeMarking} Negative
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsNew(false);
                    setEditingTest({ ...test });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 text-[#0056b3] hover:bg-blue-100 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit / Add Qs
                </button>
                <button
                  type="button"
                  onClick={() => togglePublish(test)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  {test.status === 'Published' ? 'Unpublish' : 'Launch'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(test)}
                className="p-2 rounded-xl bg-red-50 text-[#dc2626] hover:bg-red-100 cursor-pointer"
                title="Delete Test"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Batch Rank List & Results Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-[#0a0e2a] flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#ea580c]" /> Batch Results & Merit Rank List
          </h2>
          <select
            value={selectedTestForRanks}
            onChange={(e) => setSelectedTestForRanks(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
          >
            {db.mockTests.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.batchName})
              </option>
            ))}
          </select>
        </div>

        {rankListAttempts.length === 0 ? (
          <p className="text-xs text-slate-500 py-4">No student attempts recorded for this test yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase">
                  <th className="py-3 px-3">Batch Rank</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Score</th>
                  <th className="py-3 px-3">Correct / Wrong</th>
                  <th className="py-3 px-3">Accuracy</th>
                  <th className="py-3 px-3">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rankListAttempts.map((att, idx) => (
                  <tr key={att.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 text-[#ea580c] border border-amber-200 font-extrabold whitespace-nowrap">
                        Rank #{idx + 1}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-extrabold text-slate-900">
                      {att.studentName}
                    </td>
                    <td className="py-3.5 px-3 font-extrabold text-[#0056b3] whitespace-nowrap">
                      {att.score} / {att.totalMarks}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                        {att.correctCount} <CustomCheckSvg className="w-3.5 h-3.5" />
                      </span>{' '}
                      /{' '}
                      <span className="text-[#dc2626] font-bold inline-flex items-center gap-1">
                        {att.wrongCount} <CustomCrossSvg className="w-3.5 h-3.5" />
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-bold whitespace-nowrap">{att.accuracy}%</td>
                    <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                      {att.submittedAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================== BULK UPLOAD & MCQ BUILDER MODAL ==================== */}
      {editingTest && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/65 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveTest}
            className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 text-xs my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0056b3] text-[10px] font-bold uppercase tracking-wider">
                  Automated MCQ Ingestion
                </span>
                <h3 className="text-lg font-extrabold text-[#0a0e2a] mt-1">
                  {isNew ? 'Create & Launch Mock Test' : `Edit ${editingTest.title}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTest(null)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Test Metadata Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Mock Test Title *</label>
                <input
                  type="text"
                  required
                  value={editingTest.title}
                  onChange={(e) => setEditingTest({ ...editingTest, title: e.target.value })}
                  placeholder="e.g. TRBT TET Paper II Child Development & Pedagogy Mock #01"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Course & Batch</label>
                <select
                  value={editingTest.courseId}
                  onChange={(e) => {
                    const crs = db.courses.find((c) => c.id === e.target.value);
                    setEditingTest({
                      ...editingTest,
                      courseId: e.target.value,
                      courseName: crs?.name || editingTest.courseName,
                      batchName: crs?.batchName || editingTest.batchName,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                >
                  {db.courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.batchName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Duration (Min)</label>
                  <input
                    type="number"
                    min={1}
                    value={editingTest.durationMinutes}
                    onChange={(e) =>
                      setEditingTest({ ...editingTest, durationMinutes: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Marks / Q</label>
                  <input
                    type="number"
                    step="0.5"
                    min={0.5}
                    value={editingTest.marksPerQuestion}
                    onChange={(e) => {
                      const mpq = Number(e.target.value);
                      setEditingTest({
                        ...editingTest,
                        marksPerQuestion: mpq,
                        totalMarks: editingTest.questions.length * mpq,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Negative</label>
                  <input
                    type="number"
                    step="0.25"
                    min={0}
                    value={editingTest.negativeMarking}
                    onChange={(e) =>
                      setEditingTest({ ...editingTest, negativeMarking: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* ==================== BULK QUESTION UPLOADER & PARSER ==================== */}
            <div className="border border-blue-200 rounded-3xl p-5 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-blue-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#0056b3]" />
                  <span className="font-extrabold text-sm text-[#0a0e2a]">
                    Bulk MCQ Ingestion (No Need to Add Questions Individually)
                  </span>
                </div>

                {/* Import Mode Tabs */}
                <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setImportMode('upload')}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                      importMode === 'upload' ? 'bg-[#0056b3] text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Upload PDF / File
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode('paste')}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                      importMode === 'paste' ? 'bg-[#0056b3] text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Paste Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode('manual')}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                      importMode === 'manual' ? 'bg-[#0056b3] text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Single MCQ
                  </button>
                </div>
              </div>

              {parseError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-[#dc2626] font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* 1. PDF / Document Upload */}
              {importMode === 'upload' && (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-blue-300 rounded-2xl p-6 text-center bg-white/70 hover:bg-white transition-all space-y-3">
                    <FileUp className="w-10 h-10 text-[#0056b3] mx-auto" />
                    <div>
                      <p className="font-extrabold text-slate-800 text-sm">
                        Upload Question Paper PDF or Text Document
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Supports <code>.pdf</code>, <code>.txt</code>, <code>.csv</code>. The engine extracts questions, options (A/B/C/D), answers & explanations automatically!
                      </p>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.txt,.csv,.text"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="bulk-mcq-file"
                    />

                    <label
                      htmlFor="bulk-mcq-file"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white font-bold text-xs cursor-pointer shadow-sm transition-all"
                    >
                      {isParsing ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Extracting Questions from PDF...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" /> Choose PDF / Document File
                        </>
                      )}
                    </label>
                  </div>
                </div>
              )}

              {/* 2. Paste Text Mode */}
              {importMode === 'paste' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-600 font-medium">
                      Paste question text from Word, PDF, or question banks:
                    </span>
                    <button
                      type="button"
                      onClick={handleInsertSampleTemplate}
                      className="text-[11px] text-[#0056b3] font-bold hover:underline cursor-pointer"
                    >
                      Insert Sample Format
                    </button>
                  </div>

                  <textarea
                    rows={6}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={`1. Question text here\n(A) Option A\n(B) Option B\n(C) Option C\n(D) Option D\nAns: A\nExplanation: Because...`}
                    className="w-full p-3 rounded-2xl border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleParsePastedText}
                      disabled={!pastedText.trim()}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Parse & Add Questions
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Manual Fallback */}
              {importMode === 'manual' && (
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                  <input
                    type="text"
                    value={newQText}
                    onChange={(e) => setNewQText(e.target.value)}
                    placeholder="Enter MCQ question stem..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={optA}
                      onChange={(e) => setOptA(e.target.value)}
                      placeholder="Option A"
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                    />
                    <input
                      type="text"
                      value={optB}
                      onChange={(e) => setOptB(e.target.value)}
                      placeholder="Option B"
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                    />
                    <input
                      type="text"
                      value={optC}
                      onChange={(e) => setOptC(e.target.value)}
                      placeholder="Option C"
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                    />
                    <input
                      type="text"
                      value={optD}
                      onChange={(e) => setOptD(e.target.value)}
                      placeholder="Option D"
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={correctIdx}
                      onChange={(e) => setCorrectIdx(Number(e.target.value))}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold text-xs bg-white"
                    >
                      <option value={0}>Correct: Option A</option>
                      <option value={1}>Correct: Option B</option>
                      <option value={2}>Correct: Option C</option>
                      <option value={3}>Correct: Option D</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddSingleQuestion}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                    >
                      + Add Question
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ==================== EXTRACTED QUESTIONS INVENTORY ==================== */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-[#0056b3]" />
                  <span className="font-extrabold text-sm text-[#0a0e2a]">
                    Test Question Bank ({editingTest.questions.length} Questions Separated)
                  </span>
                </div>
                <div className="text-xs font-bold text-[#0056b3] bg-blue-50 px-2.5 py-1 rounded-lg">
                  Total Marks: {editingTest.questions.length * editingTest.marksPerQuestion}
                </div>
              </div>

              {editingTest.questions.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-500">
                  <p className="font-bold text-xs">No questions loaded yet.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Upload a PDF or paste question text above to populate this mock test.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {editingTest.questions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2 hover:border-blue-300 transition-all shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-extrabold text-slate-900 text-xs flex-1">
                          <span className="text-[#0056b3] font-bold mr-1.5">Q{idx + 1}.</span>
                          {q.question}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(q.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-[#dc2626] hover:bg-red-50 cursor-pointer"
                          title="Remove Question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Options Grid with Clickable Correct Answer Selector */}
                      <div className="grid grid-cols-2 gap-1.5">
                        {q.options.map((opt, oIdx) => {
                          const isCorrect = q.correctOptionIndex === oIdx;
                          return (
                            <button
                              key={oIdx}
                              type="button"
                              onClick={() => handleUpdateQuestionCorrectOpt(q.id, oIdx)}
                              className={`p-2 rounded-xl text-left flex items-center justify-between text-[11px] font-semibold border transition-all cursor-pointer ${
                                isCorrect
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <span className="truncate">
                                <strong>{String.fromCharCode(65 + oIdx)}.</strong> {opt}
                              </span>
                              {isCorrect && (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white text-[9px] font-extrabold shrink-0">
                                  Correct
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <p className="text-[10px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
                          <strong className="text-slate-600">Explanation:</strong> {q.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-semibold">
                {editingTest.questions.length} Questions • {editingTest.durationMinutes} Minutes
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTest(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editingTest.questions.length === 0}
                  className="px-5 py-2 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] disabled:opacity-50 text-white font-bold cursor-pointer shadow-sm transition-all"
                >
                  Save & Launch Mock Test
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Mock Test?"
        message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMockTest(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
