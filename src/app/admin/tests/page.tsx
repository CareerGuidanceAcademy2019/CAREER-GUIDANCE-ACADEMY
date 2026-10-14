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
  Sparkles,
  AlertCircle,
  Edit2,
  Calendar,
  Languages,
  Save,
  Flame,
  Phone,
  Check,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { MockTest, MCQQuestion } from '@/data/initialSeedData';
import { MockSeries, getSubjectLanguageMode } from '@/data/mockSeriesSeedData';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CustomCheckSvg, CustomCrossSvg } from '@/components/ui/CustomIcons';
import { parseRawQuestionsText } from '@/lib/mcqParser';

export default function AdminMockTestsPage() {
  const { db, saveMockTest, deleteMockTest, updateMockSeries, showToast } = useCga();

  const [activeAdminTab, setActiveAdminTab] = useState<'tests' | 'series'>('tests');
  const [editingTest, setEditingTest] = useState<MockTest | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MockTest | null>(null);
  const [selectedTestForRanks, setSelectedTestForRanks] = useState<string>(
    db.mockTests[0]?.id || ''
  );

  // Series Packages editing state
  const [editingSeries, setEditingSeries] = useState<MockSeries | null>(null);

  // Bulk Import Tab state inside the modal
  const [importMode, setImportMode] = useState<'upload' | 'paste' | 'manual'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Question builder state inside modal
  const [newQText, setNewQText] = useState('');
  const [newQTextBn, setNewQTextBn] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [optABn, setOptABn] = useState('');
  const [optBBn, setOptBBn] = useState('');
  const [optCBn, setOptCBn] = useState('');
  const [optDBn, setOptDBn] = useState('');
  const [correctIdx, setCorrectIdx] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [explanationBn, setExplanationBn] = useState('');

  const openCreateModal = () => {
    const firstCourse = db.courses[0];
    setIsNew(true);
    setPastedText('');
    setParseError('');
    setImportMode('upload');
    setEditingTest({
      id: `mock-${Date.now()}`,
      title: '',
      subject: 'Child Development & Pedagogy',
      languageMode: 'bilingual',
      courseId: firstCourse?.id || '',
      courseName: firstCourse?.name || '',
      batchName: firstCourse?.batchName || '',
      durationMinutes: 30,
      totalMarks: 30,
      marksPerQuestion: 1,
      negativeMarking: 0,
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
        headers: {
          'x-portal-role': 'ADMIN',
        },
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
    const isEng = editingTest?.languageMode === 'english_only';
    const isBen = editingTest?.languageMode === 'bengali_only';

    let sample = '';
    if (isEng) {
      sample = `1. Choose the sentence with the correct passive voice:
(A) The syllabus will be completed by the faculty on time.
(B) The syllabus was completed by the faculty on time.
(C) The syllabus is completing by the faculty on time.
(D) The syllabus will completed by the faculty on time.
Ans: A
Explanation: Active future simple 'will complete' transforms to 'will be completed'.

2. Identify the synonym of 'PRAGMATIC':
(A) Practical
(B) Idealistic
(C) Theoretical
(D) Speculative
Ans: A
Explanation: Pragmatic means dealing with things sensibly and realistically.`;
    } else if (isBen) {
      sample = `1. নিচের কোন বানানটি শুদ্ধ?
(A) মুমূর্ষু
(B) মুমুর্ষু
(C) মুমুর্ষূ
(D) মুমূর্ষূ
Ans: A
Explanation: শুদ্ধ বানানটি হলো 'মুমূর্ষু' (হ্রস্ব উ-কার, দীর্ঘ ঊ-কার, হ্রস্ব উ-কার)।

2. 'উপকূল' শব্দটির সঠিক ব্যাসবাক্য ও সমাস কোনটি?
(A) কূলের সমীপে — অব্যয়ীভাব সমাস
(B) কূলের পশ্চাৎ — তৎপুরুষ সমাস
(C) কূলকে অতিক্রম — কর্মধারয় সমাস
(D) কূল ও উপকূল — দ্বন্দ্ব সমাস
Ans: A
Explanation: 'কূলের সমীপে' = উপকূল। এটি সামীপ্য অর্থে অব্যয়ীভাব সমাসের উদাহরণ।`;
    } else {
      sample = `1. According to Jean Piaget, during which stage does a child begin to think logically about concrete events?
(A) Sensorimotor Stage
(B) Preoperational Stage
(C) Concrete Operational Stage
(D) Formal Operational Stage
Ans: C
Explanation: Concrete operational stage (7-11 years) develops logical thought regarding concrete events.

2. Which wildlife sanctuary in Tripura is famous for the Clouded Leopard National Park?
(A) Rowa Wildlife Sanctuary
(B) Trishna Wildlife Sanctuary
(C) Sepahijala Wildlife Sanctuary
(D) Gumti Wildlife Sanctuary
Ans: C
Explanation: Sepahijala Sanctuary houses Clouded Leopard National Park and Phayre's Leaf Monkey.`;
    }
    setPastedText(sample);
  };

  // 3. Manual Single Question Add
  const handleAddSingleQuestion = () => {
    if (!editingTest || !newQText.trim() || !optA.trim() || !optB.trim()) return;
    const isEngOnly = editingTest.languageMode === 'english_only';

    const q: MCQQuestion = {
      id: `q-${Date.now()}`,
      question: newQText.trim(),
      questionBn: isEngOnly ? undefined : (newQTextBn.trim() || undefined),
      options: [
        optA.trim(),
        optB.trim(),
        optC.trim() || 'Option C',
        optD.trim() || 'Option D',
      ],
      optionsBn: isEngOnly
        ? undefined
        : optABn.trim() || optBBn.trim()
        ? [
            optABn.trim() || optA.trim(),
            optBBn.trim() || optB.trim(),
            optCBn.trim() || optC.trim(),
            optDBn.trim() || optD.trim(),
          ]
        : undefined,
      correctOptionIndex: correctIdx,
      explanation: explanation.trim() || 'Refer to C.G.A classroom notes and model solutions.',
      explanationBn: isEngOnly ? undefined : (explanationBn.trim() || undefined),
      subject: editingTest.subject,
    };
    const nextQs = [...editingTest.questions, q];
    setEditingTest({
      ...editingTest,
      questions: nextQs,
      totalMarks: nextQs.length * editingTest.marksPerQuestion,
    });
    setNewQText('');
    setNewQTextBn('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setOptABn('');
    setOptBBn('');
    setOptCBn('');
    setOptDBn('');
    setExplanation('');
    setExplanationBn('');
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
    const nextStatus = test.status === 'Published' ? 'Draft' : 'Published';
    saveMockTest(
      {
        ...test,
        status: nextStatus,
      },
      false
    );
    showToast(
      nextStatus === 'Published' ? 'Test Launched Live!' : 'Test Set to Draft',
      `"${test.title}" is now ${nextStatus.toLowerCase()}.`,
      nextStatus === 'Published' ? 'success' : 'info'
    );
  };

  const handleQuickDateChange = (test: MockTest, newDate: string) => {
    saveMockTest({ ...test, scheduledDate: newDate }, false);
    showToast('Launch Date Scheduled', `Launch date for "${test.title}" updated to ${newDate}.`, 'success');
  };

  const handleSubjectChange = (subj: string) => {
    if (!editingTest) return;
    const mode = getSubjectLanguageMode(subj);
    setEditingTest({
      ...editingTest,
      subject: subj,
      languageMode: mode,
    });
  };

  const rankListAttempts = db.testAttempts
    .filter((a) => a.testId === selectedTestForRanks)
    .sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-8">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a0e2a]">
            Mock Test Builder, Batch Launch & Series Pricing
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Manage scheduled launch dates and immediate launch status. Questions for English subjects are English-only,
            Bengali subjects are Bengali-only, and all other subjects have bilingual questions in English and Bengali.
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

      {/* Admin Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveAdminTab('tests')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeAdminTab === 'tests'
              ? 'bg-[#0056b3] text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" /> Batch & Sectional Tests ({db.mockTests.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveAdminTab('series')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeAdminTab === 'series'
              ? 'bg-[#0056b3] text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Flame className="w-4 h-4 text-amber-300" /> T-TET Daily Series Packages ({db.mockSeries.length})
        </button>
      </div>

      {/* ==================== TAB 1: BATCH MOCK TESTS ==================== */}
      {activeAdminTab === 'tests' && (
        <div className="space-y-8">
          {/* Mock Tests Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {db.mockTests.map((test) => {
              const langMode = test.languageMode || (test.subject ? getSubjectLanguageMode(test.subject) : getSubjectLanguageMode(test.title));

              return (
                <div
                  key={test.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
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
                        {test.status === 'Published' ? '🚀 Launched' : '⏳ Draft / Scheduled'}
                      </span>
                    </div>

                    <h2 className="text-base font-extrabold text-[#0a0e2a]">{test.title}</h2>
                    <p className="text-xs text-slate-500">
                      {test.questions.length} Questions • {test.totalMarks} Marks • {test.durationMinutes}{' '}
                      Mins • -{test.negativeMarking} Negative
                    </p>

                    {/* Language Mode Badge */}
                    <div className="flex items-center gap-1.5 pt-1">
                      {langMode === 'english_only' && (
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                          🇬🇧 English Only
                        </span>
                      )}
                      {langMode === 'bengali_only' && (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 font-sans">
                          🇧🇩 Bengali Only (বাংলা)
                        </span>
                      )}
                      {langMode === 'bilingual' && (
                        <span className="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                          🌐 Bilingual (Eng + বাংলা)
                        </span>
                      )}
                    </div>

                    {/* Admin Launch Date Manager (Inline) */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span className="font-bold flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#0056b3]" /> Launch Date
                        </span>
                        <span className="text-[10px] text-slate-400">Admin Managed</span>
                      </div>
                      <input
                        type="date"
                        value={test.scheduledDate || ''}
                        onChange={(e) => handleQuickDateChange(test, e.target.value)}
                        className="w-full bg-white px-2 py-1 rounded-lg border border-slate-200 font-semibold text-xs text-slate-800 cursor-pointer focus:ring-1 focus:ring-[#0056b3]"
                        title="Click to change the scheduled launch date"
                      />
                    </div>
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
                        <Edit2 className="w-3.5 h-3.5" /> Edit / Qs
                      </button>
                      <button
                        type="button"
                        onClick={() => togglePublish(test)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                          test.status === 'Published'
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                        }`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        {test.status === 'Published' ? 'Unpublish' : 'Launch Now'}
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
              );
            })}
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
        </div>
      )}

      {/* ==================== TAB 2: TRIPURA TET DAILY MOCK SERIES PACKAGES ==================== */}
      {activeAdminTab === 'series' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-sm text-[#0a0e2a] flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[#ea580c]" /> Tripura TET Daily Online Mock Tests Series Packages
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Manage the festival offer prices (Paper-I: ₹399/-, Paper-II: ₹499/-) and launch schedules on demand.
              </p>
            </div>
            <div className="text-xs text-slate-600 font-bold flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#0056b3]" /> 7005929189
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {db.mockSeries.map((series) => {
              const isEditing = editingSeries?.id === series.id;

              return (
                <div
                  key={series.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-[#dc2626] text-[10px] font-black uppercase tracking-wider">
                        Festival Offer
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">
                        {series.classRange}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-[#0a0e2a] leading-snug">
                      {series.name}
                    </h3>
                    <p className="text-xs text-slate-600">{series.description}</p>

                    {/* Price & Schedule Management */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-bold">Package Price:</span>
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-black text-slate-800">₹</span>
                            <input
                              type="number"
                              value={editingSeries.price}
                              onChange={(e) =>
                                setEditingSeries({ ...editingSeries, price: Number(e.target.value) })
                              }
                              className="w-20 px-2 py-0.5 rounded border border-blue-400 text-xs font-bold text-[#0056b3]"
                            />
                          </div>
                        ) : (
                          <span className="text-xl font-black text-[#0056b3]">
                            ₹{series.price}/-
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Launch Date:</span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingSeries.startsOn}
                            onChange={(e) =>
                              setEditingSeries({ ...editingSeries, startsOn: e.target.value })
                            }
                            className="px-2 py-0.5 rounded border border-slate-300 text-xs font-semibold"
                            placeholder="e.g. Admin Scheduled"
                          />
                        ) : (
                          <span className="font-bold text-slate-700">{series.startsOn}</span>
                        )}
                      </div>
                    </div>

                    {/* Highlights */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                        Features from Banner:
                      </span>
                      <ul className="text-xs text-slate-600 space-y-1">
                        {series.highlights.slice(0, 5).map((h, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    {isEditing ? (
                      <div className="flex items-center gap-2 w-full">
                        <button
                          type="button"
                          onClick={async () => {
                            if (editingSeries) {
                              await updateMockSeries(editingSeries);
                              setEditingSeries(null);
                            }
                          }}
                          className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1"
                        >
                          <Save className="w-3.5 h-3.5" /> Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingSeries(null)}
                          className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingSeries({ ...series })}
                        className="w-full py-2 rounded-xl bg-blue-50 text-[#0056b3] hover:bg-blue-100 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit Price & Details
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== CREATE / EDIT MOCK TEST MODAL ==================== */}
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
                  Mock Test Builder & Ingestion
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

            {/* Test Metadata & Scheduling Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Mock Test Title *</label>
                <input
                  type="text"
                  required
                  value={editingTest.title}
                  onChange={(e) => setEditingTest({ ...editingTest, title: e.target.value })}
                  placeholder="e.g. Tripura TET Paper-I: Child Development & Pedagogy Mock #01"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                />
              </div>

              {/* Subject Selection with automatic language rule */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Subject & Category *
                </label>
                <select
                  value={editingTest.subject || 'Child Development & Pedagogy'}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                >
                  <option value="Child Development & Pedagogy">Child Development & Pedagogy (CDP) [Bilingual]</option>
                  <option value="Mathematics">Mathematics (Content & Pedagogy) [Bilingual]</option>
                  <option value="Environmental Studies">Environmental Studies (EVS) [Bilingual]</option>
                  <option value="Science">Science (Physics, Chemistry & Biology) [Bilingual]</option>
                  <option value="History">History & Pedagogical Issues [Bilingual]</option>
                  <option value="Geography">Geography & Environment [Bilingual]</option>
                  <option value="Political Science">Political Science & Civics [Bilingual]</option>
                  <option value="English">Language – I (English) [English Only]</option>
                  <option value="Bengali">Language – II (Bengali) [Bengali Only]</option>
                  <option value="Full Length">Full-Length Simulated Paper [Bilingual]</option>
                </select>
              </div>

              {/* Scheduled Launch Date */}
              <div>
                <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                  <span>Scheduled Launch Date *</span>
                  <span className="text-[10px] text-blue-600 font-semibold">Admin Managed</span>
                </label>
                <input
                  type="date"
                  required
                  value={editingTest.scheduledDate || ''}
                  onChange={(e) => setEditingTest({ ...editingTest, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                />
              </div>

              {/* Language Rule Banner Indicator */}
              <div className="sm:col-span-2">
                {editingTest.languageMode === 'english_only' && (
                  <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 flex items-center gap-2">
                    <Languages className="w-4 h-4 shrink-0 text-indigo-600" />
                    <div>
                      <strong className="block">English Subject Exam:</strong>
                      <span>Questions and options are strictly in English. No Bengali translation needed.</span>
                    </div>
                  </div>
                )}
                {editingTest.languageMode === 'bengali_only' && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2 font-sans">
                    <Languages className="w-4 h-4 shrink-0 text-emerald-600" />
                    <div>
                      <strong className="block">বাংলা পত্র (Bengali Subject):</strong>
                      <span>প্রশ্ন ও উত্তর শুধুমাত্র বাংলা ভাষায় তৈরি হবে।</span>
                    </div>
                  </div>
                )}
                {editingTest.languageMode === 'bilingual' && (
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 flex items-center gap-2">
                    <Languages className="w-4 h-4 shrink-0 text-purple-600" />
                    <div>
                      <strong className="block">Bilingual Subject Standard:</strong>
                      <span>Questions and options are provided in both English and Bengali (students can toggle language view in CBT).</span>
                    </div>
                  </div>
                )}
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
                    Add Questions (PDF Upload, Text Paste, or Manual)
                  </span>
                </div>

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

              {/* Mode 1: PDF Upload */}
              {importMode === 'upload' && (
                <div className="space-y-3">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-blue-300 hover:border-[#0056b3] bg-white/80 rounded-2xl p-6 text-center cursor-pointer transition-all hover:bg-white"
                  >
                    <Upload className="w-8 h-8 text-[#0056b3] mx-auto mb-2" />
                    <p className="font-extrabold text-xs text-slate-800">
                      {isParsing ? 'Extracting Questions from File...' : 'Click to Upload Question Paper (PDF, TXT)'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Our system extracts questions, options (A, B, C, D), answer keys, and explanations automatically.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                  {parseError && (
                    <div className="p-3 rounded-xl bg-red-50 text-[#dc2626] border border-red-200 flex items-center gap-2 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{parseError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Mode 2: Paste Raw Text */}
              {importMode === 'paste' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-semibold">
                      Paste question paper text with answers:
                    </span>
                    <button
                      type="button"
                      onClick={handleInsertSampleTemplate}
                      className="text-xs text-[#0056b3] hover:underline font-bold"
                    >
                      Load Sample Questions
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="1. Question stem...&#10;(A) Option A&#10;(B) Option B&#10;(C) Option C&#10;(D) Option D&#10;Ans: A"
                    className="w-full p-3 rounded-2xl border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0056b3]"
                  />
                  {parseError && (
                    <div className="p-2.5 rounded-xl bg-red-50 text-[#dc2626] border border-red-200 text-xs">
                      {parseError}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleParsePastedText}
                    className="px-4 py-2 rounded-xl bg-[#0056b3] text-white font-bold text-xs cursor-pointer hover:bg-[#1e3a8a]"
                  >
                    Extract & Add Questions
                  </button>
                </div>
              )}

              {/* Mode 3: Manual Single Question */}
              {importMode === 'manual' && (
                <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {editingTest.languageMode === 'bengali_only' ? 'প্রশ্ন (বাংলায়) *' : 'Question Statement (English) *'}
                    </label>
                    <input
                      type="text"
                      value={newQText}
                      onChange={(e) => setNewQText(e.target.value)}
                      placeholder="e.g. According to Piaget, during which stage..."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>

                  {editingTest.languageMode === 'bilingual' && (
                    <div>
                      <label className="font-bold text-blue-900 block mb-1">
                        প্রশ্ন অনুবাদ (বাংলায় - Optional/Bilingual)
                      </label>
                      <input
                        type="text"
                        value={newQTextBn}
                        onChange={(e) => setNewQTextBn(e.target.value)}
                        placeholder="পিয়াজের মতে, কোন স্তরে শিশু..."
                        className="w-full px-3 py-1.5 rounded-xl border border-blue-200 text-xs bg-blue-50/30"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={optA}
                      onChange={(e) => setOptA(e.target.value)}
                      placeholder="Option A (English)"
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                    />
                    <input
                      type="text"
                      value={optB}
                      onChange={(e) => setOptB(e.target.value)}
                      placeholder="Option B (English)"
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                    />
                    <input
                      type="text"
                      value={optC}
                      onChange={(e) => setOptC(e.target.value)}
                      placeholder="Option C (English)"
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                    />
                    <input
                      type="text"
                      value={optD}
                      onChange={(e) => setOptD(e.target.value)}
                      placeholder="Option D (English)"
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>

                  {editingTest.languageMode === 'bilingual' && (
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                      <input
                        type="text"
                        value={optABn}
                        onChange={(e) => setOptABn(e.target.value)}
                        placeholder="অপশন A (বাংলায়)"
                        className="px-3 py-1.5 rounded-xl border border-blue-200 text-xs bg-blue-50/20"
                      />
                      <input
                        type="text"
                        value={optBBn}
                        onChange={(e) => setOptBBn(e.target.value)}
                        placeholder="অপশন B (বাংলায়)"
                        className="px-3 py-1.5 rounded-xl border border-blue-200 text-xs bg-blue-50/20"
                      />
                      <input
                        type="text"
                        value={optCBn}
                        onChange={(e) => setOptCBn(e.target.value)}
                        placeholder="অপশন C (বাংলায়)"
                        className="px-3 py-1.5 rounded-xl border border-blue-200 text-xs bg-blue-50/20"
                      />
                      <input
                        type="text"
                        value={optDBn}
                        onChange={(e) => setOptDBn(e.target.value)}
                        placeholder="অপশন D (বাংলায়)"
                        className="px-3 py-1.5 rounded-xl border border-blue-200 text-xs bg-blue-50/20"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-1">
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
                        <div className="flex-1 space-y-0.5">
                          <p className="font-extrabold text-slate-900 text-xs">
                            <span className="text-[#0056b3] font-bold mr-1.5">Q{idx + 1}.</span>
                            {q.question}
                          </p>
                          {q.questionBn && (
                            <p className="text-[11px] font-semibold text-blue-900">
                              {q.questionBn}
                            </p>
                          )}
                        </div>
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
                          const optBn = q.optionsBn?.[oIdx];
                          return (
                            <button
                              key={oIdx}
                              type="button"
                              onClick={() => handleUpdateQuestionCorrectOpt(q.id, oIdx)}
                              className={`p-2 rounded-xl text-left border flex items-center gap-2 cursor-pointer transition-all ${
                                isCorrect
                                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-full text-[10px] font-extrabold flex items-center justify-center shrink-0 ${
                                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <div className="truncate flex-1">
                                <span className="truncate block text-xs">{opt}</span>
                                {optBn && (
                                  <span className="truncate block text-[10px] text-slate-500">
                                    {optBn}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-600">Launch Status:</label>
                <select
                  value={editingTest.status}
                  onChange={(e) =>
                    setEditingTest({
                      ...editingTest,
                      status: e.target.value as 'Published' | 'Draft',
                    })
                  }
                  className="px-2.5 py-1 rounded-lg border border-slate-300 font-bold text-xs bg-white"
                >
                  <option value="Published">Published (Live for Students)</option>
                  <option value="Draft">Draft (Scheduled / Private)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTest(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white font-extrabold cursor-pointer shadow-sm"
                >
                  Save & Launch Mock Test
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Mock Test?"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? All associated attempt records will be removed.`}
        confirmLabel="Yes, Delete Test"
        onConfirm={() => {
          if (deleteTarget) {
            deleteMockTest(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
