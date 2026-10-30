'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Printer,
  Wifi,
  WifiOff,
  Languages,
  RefreshCw,
  Layers,
  Flag,
  Check,
  HelpCircle,
  FileText,
  Image as ImageIcon,
  BookOpen,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { cgaService } from '@/services/cgaService';
import { MathText } from '@/components/ui/MathText';
import { MockQuestionImage } from '@/components/mock-tests/MockQuestionImage';
import { MockQuestionOption, getOptionText, getOptionImage } from '@/data/initialSeedData';

export default function AdminMockTestPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params?.testId as string;
  const { db, showToast } = useCga();

  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionGroups, setQuestionGroups] = useState<any[]>([]);

  // Preview Modes
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [viewMode, setViewMode] = useState<'admin' | 'student'>('admin');
  const [slowConnection, setSlowConnection] = useState(false);
  const [isSwitchingQ, setIsSwitchingQ] = useState(false);

  // Student CBT Simulator State (pure component state; zero DB attempt created)
  const [activeQIndex, setActiveQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: string]: number }>({});
  const [markedForReview, setMarkedForReview] = useState<{ [qId: string]: boolean }>({});
  const [langView, setLangView] = useState<'both' | 'en' | 'bn'>('both');
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Validation & Ready gate
  const [acknowledgedWarnings, setAcknowledgedWarnings] = useState(false);
  const [markingReady, setMarkingReady] = useState(false);

  // Fetch test details, questions, keys, and passages
  const fetchPreviewData = async () => {
    if (!testId) return;
    setLoading(true);
    try {
      let token: string | undefined;
      try {
        const s = (await cgaService.client().auth.getSession()).data?.session;
        token = s?.access_token;
      } catch {}

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/admin/mock-tests/preview?testId=${encodeURIComponent(testId)}`, { headers });
      if (!res.ok) {
        throw new Error('Failed to load test preview data from server.');
      }
      const data = await res.json();
      setTest(data.test || null);
      setQuestions(data.questions || []);
      const mappedGroups = (data.questionGroups || []).map((g: any) => ({
        ...g,
        passageText: g.passageText || g.passage_text || '',
        passage_text: g.passageText || g.passage_text || '',
        imagePath: g.imagePath || g.image_path || null,
        image_path: g.imagePath || g.image_path || null,
        imageAlt: g.imageAlt || g.image_alt || null,
        image_alt: g.imageAlt || g.image_alt || null,
      }));
      setQuestionGroups(mappedGroups);
      setTimeRemaining((data.test?.durationMinutes || data.test?.duration_minutes || 60) * 60);
    } catch (err: unknown) {
      // Fallback to local / context test so preview ALWAYS works
      const fallbackTest = db.mockTests.find((t) => t.id === testId);
      if (fallbackTest) {
        setTest(fallbackTest);
        const mapped = (fallbackTest.questions || []).map((q: any, i: number) => ({
          id: q.id || `q-${i}`,
          position: i + 1,
          questionText: q.question || q.questionText || '',
          options: q.options || [],
          correctOption: q.correctOptionIndex ?? q.correctOption ?? 0,
          explanation: q.explanation || '',
          imagePath: q.imagePath || null,
          imageAlt: q.imageAlt || null,
          groupId: q.groupId || null,
        }));
        setQuestions(mapped);
        const fallbackGroups = ((fallbackTest as any).questionGroups || []).map((g: any) => ({
          ...g,
          passageText: g.passageText || g.passage_text || '',
          passage_text: g.passageText || g.passage_text || '',
          imagePath: g.imagePath || g.image_path || null,
          image_path: g.imagePath || g.image_path || null,
          imageAlt: g.imageAlt || g.image_alt || null,
          image_alt: g.imageAlt || g.image_alt || null,
        }));
        setQuestionGroups(fallbackGroups);
        setTimeRemaining((fallbackTest.durationMinutes || 60) * 60);
      } else {
        const msg = err instanceof Error ? err.message : 'Error fetching preview';
        showToast('Notice', msg, 'info');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreviewData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  // Handle switching question with simulated slow network
  const handleSelectQuestion = (idx: number) => {
    if (slowConnection) {
      setIsSwitchingQ(true);
      setTimeout(() => {
        setActiveQIndex(idx);
        setIsSwitchingQ(false);
      }, 1200);
    } else {
      setActiveQIndex(idx);
    }
  };

  // Run automated validation checklist
  const runValidationChecklist = () => {
    const redErrors: string[] = [];
    const amberWarnings: string[] = [];

    if (!questions || questions.length === 0) {
      redErrors.push('The test contains no questions. Questions must be added before launch.');
      return { redErrors, amberWarnings, isReady: false };
    }

    const expectedCount = test?.questionCount || test?.question_count;
    if (expectedCount && questions.length !== expectedCount) {
      amberWarnings.push(`Question count (${questions.length}) does not match expected total (${expectedCount}).`);
    }

    const seenQuestions = new Set<string>();

    questions.forEach((q, idx) => {
      const qNum = idx + 1;
      const text = q.questionText || q.question || '';
      if (!text.trim()) {
        redErrors.push(`Question ${qNum} statement is completely empty.`);
      }

      // Check options
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        redErrors.push(`Question ${qNum} must have exactly 4 options (found ${q.options?.length || 0}).`);
      } else {
        q.options.forEach((opt: MockQuestionOption, optIdx: number) => {
          const optTxt = getOptionText(opt);
          if (!optTxt.trim()) {
            redErrors.push(`Question ${qNum} Option ${String.fromCharCode(65 + optIdx)} is blank.`);
          }
        });
      }

      // Check answer key
      if (typeof q.correctOption !== 'number' || q.correctOption < 0 || q.correctOption > 3) {
        redErrors.push(`Question ${qNum} does not have a valid correct answer assigned (Option A–D).`);
      }

      // Check image alt text
      if (q.imagePath && (!q.imageAlt || !q.imageAlt.trim())) {
        amberWarnings.push(`Question ${qNum} diagram is missing descriptive alt text for screen readers.`);
      }

      // Check duplicate statement
      const cleanStem = text.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanStem.length > 20) {
        if (seenQuestions.has(cleanStem)) {
          amberWarnings.push(`Question ${qNum} appears to be a duplicate of an earlier question.`);
        } else {
          seenQuestions.add(cleanStem);
        }
      }

      // Check shared passage group link
      if (q.groupId && !questionGroups.some((g) => g.id === q.groupId)) {
        redErrors.push(`Question ${qNum} is linked to a missing or deleted shared passage group.`);
      }
    });

    const isReady = redErrors.length === 0 && (amberWarnings.length === 0 || acknowledgedWarnings);
    return { redErrors, amberWarnings, isReady };
  };

  const validation = runValidationChecklist();

  // Mark as Ready action
  const handleMarkAsReady = async () => {
    if (!validation.isReady) return;
    setMarkingReady(true);
    try {
      const res = await fetch('/api/admin/mock-tests/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId,
          status: 'ready',
          overrideWarnings: acknowledgedWarnings,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to set status to Ready.');
      }

      setTest((prev: any) => ({ ...prev, status: 'ready' }));
      showToast('Test Ready', 'This mock test has passed validation and is marked as Ready for launch.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update test';
      showToast('Validation Gate Blocked', msg, 'error');
    } finally {
      setMarkingReady(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-[#0056b3] animate-spin" />
        <span className="text-xs font-bold text-slate-500">Loading test preview...</span>
      </div>
    );
  }

  const currentQ = questions[activeQIndex];
  let linkedGroup = currentQ?.groupId
    ? questionGroups.find((g) => g.id === currentQ.groupId || String(g.id) === String(currentQ.groupId))
    : null;

  // Smart fallback: If this test has comprehension passage groups, link properly
  if (!linkedGroup && questionGroups.length === 1) {
    linkedGroup = questionGroups[0];
  } else if (!linkedGroup && questionGroups.length > 0 && currentQ) {
    const matchByPos = questionGroups.find((g) => (g.position || 1) === (currentQ.groupId || 1));
    linkedGroup = matchByPos || questionGroups[0];
  }

  const langMode = test?.languageMode || test?.language_mode || 'english_only';
  const showBoth = langMode === 'bilingual' && langView === 'both';
  const showEnglishOnly = langMode === 'english_only' || (langMode === 'bilingual' && langView === 'en');
  const showBengaliOnly = langMode === 'bengali_only' || (langMode === 'bilingual' && langView === 'bn');

  // Viewport Container Widths
  const viewportWidthClass =
    viewportMode === 'mobile'
      ? 'max-w-[390px] border-4 border-slate-700 rounded-[36px] shadow-2xl p-2 bg-slate-900'
      : viewportMode === 'tablet'
      ? 'max-w-[768px] border-4 border-slate-600 rounded-[28px] shadow-2xl p-3 bg-slate-800'
      : 'max-w-7xl';

  return (
    <div className="space-y-6 pb-24">
      {/* 1. Header Toolbar (Hidden in Print) */}
      <div className="print:hidden bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => router.push(`/admin/mock-tests/${testId}/questions`)}
            className="text-xs font-bold text-slate-500 hover:text-[#0056b3] inline-flex items-center gap-1.5 mb-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Review Screen
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900">{test?.title || 'Mock Test Preview'}</h1>
            <span
              className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                test?.status === 'ready'
                  ? 'bg-emerald-100 text-emerald-800'
                  : test?.status === 'launched'
                  ? 'bg-blue-100 text-[#0056b3]'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {test?.status || 'Draft'}
            </span>
          </div>
        </div>

        {/* Viewport Switcher & Mode Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Viewport Mode Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setViewportMode('desktop')}
              className={`px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-all ${
                viewportMode === 'desktop' ? 'bg-white shadow-xs text-slate-900' : 'hover:text-slate-900'
              }`}
            >
              <Monitor className="w-4 h-4" /> Desktop
            </button>
            <button
              type="button"
              onClick={() => setViewportMode('tablet')}
              className={`px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-all ${
                viewportMode === 'tablet' ? 'bg-white shadow-xs text-slate-900' : 'hover:text-slate-900'
              }`}
            >
              <Tablet className="w-4 h-4" /> Tablet
            </button>
            <button
              type="button"
              onClick={() => setViewportMode('mobile')}
              className={`px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-all ${
                viewportMode === 'mobile' ? 'bg-white shadow-xs text-slate-900' : 'hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-4 h-4" /> Mobile (390px)
            </button>
          </div>

          {/* Admin vs Student View Mode */}
          <div className="flex items-center bg-blue-50 p-1 rounded-xl text-xs font-bold border border-blue-200">
            <button
              type="button"
              onClick={() => setViewMode('admin')}
              className={`px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-all ${
                viewMode === 'admin' ? 'bg-[#0056b3] text-white shadow-xs' : 'text-[#0056b3] hover:bg-blue-100'
              }`}
            >
              <Eye className="w-4 h-4" /> Admin View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('student')}
              className={`px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-all ${
                viewMode === 'student' ? 'bg-[#0056b3] text-white shadow-xs' : 'text-[#0056b3] hover:bg-blue-100'
              }`}
            >
              <Clock className="w-4 h-4" /> Student CBT View
            </button>
          </div>

          {/* Slow Connection Simulator */}
          <button
            type="button"
            onClick={() => setSlowConnection(!slowConnection)}
            className={`px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer border transition-all ${
              slowConnection
                ? 'bg-amber-100 border-amber-300 text-amber-900'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {slowConnection ? <WifiOff className="w-4 h-4 text-amber-700" /> : <Wifi className="w-4 h-4" />}
            {slowConnection ? 'Slow 2G/3G Simulation Active' : 'Simulate Slow Connection'}
          </button>

          {/* Print/PDF Export Button */}
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer border border-slate-200"
          >
            <Printer className="w-4 h-4" /> Print / PDF Export
          </button>
        </div>
      </div>

      {/* 2. Automated Validation Checklist Panel (Hidden in Print) */}
      <div className="print:hidden bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Pre-Launch Validation Checklist</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated audit for complete answer keys, diagram attachments, 4 options, and passage bindings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {test?.status !== 'ready' && (
              <button
                type="button"
                disabled={!validation.isReady || markingReady}
                onClick={handleMarkAsReady}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold cursor-pointer inline-flex items-center gap-2 disabled:opacity-40 shadow-sm"
              >
                {markingReady ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Mark as Ready for Launch
              </button>
            )}
          </div>
        </div>

        {/* Blocking Red Errors */}
        {validation.redErrors.length > 0 && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-2">
            <div className="font-extrabold flex items-center gap-2 text-red-700">
              <XCircle className="w-4 h-4" /> Blocking Errors ({validation.redErrors.length}) — Must be fixed before setting Ready:
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] font-semibold text-red-800">
              {validation.redErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Amber Warnings */}
        {validation.amberWarnings.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
            <div className="font-extrabold flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-4 h-4" /> Non-Blocking Warnings ({validation.amberWarnings.length}):
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] font-semibold text-amber-800">
              {validation.amberWarnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>

            {validation.redErrors.length === 0 && test?.status !== 'ready' && (
              <label className="flex items-center gap-2 pt-2 border-t border-amber-200 font-bold text-amber-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acknowledgedWarnings}
                  onChange={(e) => setAcknowledgedWarnings(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>I have reviewed these warnings and approve marking this test as Ready.</span>
              </label>
            )}
          </div>
        )}

        {/* All Checks Passed */}
        {validation.redErrors.length === 0 && validation.amberWarnings.length === 0 && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>All automated checks passed. 100% of questions and options are validated.</span>
          </div>
        )}
      </div>

      {/* 3. The Interactive Preview Area */}
      <div className={`mx-auto transition-all duration-300 ${viewportWidthClass}`}>
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Exam Topbar */}
          <div className="bg-[#0a0e2a] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>
                  {viewMode === 'admin' ? 'Admin Preview Mode (With Solutions & Hints)' : 'Student Live CBT View'}
                </span>
                <span className="bg-white/20 text-white px-2 py-0.5 rounded text-[10px] font-medium tracking-normal">
                  Simulation Mode
                </span>
              </span>
              <h2 className="text-base sm:text-lg font-extrabold">{test?.title}</h2>
            </div>

            <div className="flex items-center gap-4">
              <div className="px-4 py-2 rounded-xl bg-white/15 font-mono text-sm font-extrabold flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-300" />
                <span>
                  {Math.floor(timeRemaining / 60)}:
                  {String(timeRemaining % 60).padStart(2, '0')}
                </span>
              </div>

              {viewMode === 'student' && (
                <button
                  type="button"
                  onClick={() => {
                    const answeredCount = Object.keys(selectedAnswers).length;
                    showToast(
                      'Exam Submission Preview',
                      `Student would submit ${answeredCount} of ${questions.length} answered questions.`,
                      'info'
                    );
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold cursor-pointer"
                >
                  Submit Test Now
                </button>
              )}
            </div>
          </div>

          {/* Exam Body Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
            {/* Main Question & Solution Panel */}
            <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200">
              {isSwitchingQ ? (
                <div className="space-y-6 animate-pulse p-4">
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                  <div className="h-20 bg-slate-200 rounded" />
                  <div className="space-y-3">
                    <div className="h-12 bg-slate-200 rounded-xl" />
                    <div className="h-12 bg-slate-200 rounded-xl" />
                    <div className="h-12 bg-slate-200 rounded-xl" />
                    <div className="h-12 bg-slate-200 rounded-xl" />
                  </div>
                </div>
              ) : currentQ ? (
                <div className="space-y-6">
                  {/* Top Bar for Question Number & Language Switcher */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-[#0056b3]">
                        Question {activeQIndex + 1} of {questions.length}
                      </span>

                      {/* Bilingual View Toggle */}
                      {langMode === 'bilingual' && (
                        <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setLangView('both')}
                            className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                              langView === 'both' ? 'bg-[#0056b3] text-white shadow-xs' : 'text-slate-600'
                            }`}
                          >
                            Bilingual
                          </button>
                          <button
                            type="button"
                            onClick={() => setLangView('en')}
                            className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                              langView === 'en' ? 'bg-[#0056b3] text-white shadow-xs' : 'text-slate-600'
                            }`}
                          >
                            English
                          </button>
                          <button
                            type="button"
                            onClick={() => setLangView('bn')}
                            className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                              langView === 'bn' ? 'bg-[#0056b3] text-white shadow-xs' : 'text-slate-600'
                            }`}
                          >
                            বাংলা
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                        +{test?.marksPerQuestion || test?.marks_per_question || 1} Marks
                      </span>
                      <span className="px-2 py-0.5 rounded bg-red-50 text-[#dc2626] font-bold">
                        -{test?.negativeMarking || test?.negative_marking || 0} Negative
                      </span>
                    </div>
                  </div>

                  {/* Reading Comprehension Passage Section */}
                  {linkedGroup && (
                    <div className="p-5 sm:p-6 rounded-3xl bg-purple-50/70 border-2 border-purple-300 space-y-3.5 shadow-xs">
                      <div className="flex items-center justify-between gap-2 border-b border-purple-200 pb-2.5">
                        <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-purple-950 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-purple-700" />
                          <span>Reading Comprehension Passage</span>
                        </span>
                        <span className="px-3 py-1 rounded-full bg-purple-200/80 text-purple-950 text-[11px] font-extrabold border border-purple-300">
                          {linkedGroup.imageAlt || linkedGroup.image_alt || `Passage Section`}
                        </span>
                      </div>
                      {(linkedGroup.passageText || linkedGroup.passage_text) && (
                        <div className="text-xs sm:text-sm text-slate-800 leading-relaxed max-h-80 overflow-y-auto pr-2 scrollbar-thin font-serif sm:font-sans whitespace-pre-line bg-white p-4 sm:p-5 rounded-2xl border border-purple-200 shadow-2xs">
                          <MathText text={linkedGroup.passageText || linkedGroup.passage_text} />
                        </div>
                      )}
                      {(linkedGroup.imagePath || linkedGroup.image_path) && (
                        <div className="mt-2 bg-white p-2 rounded-2xl border border-purple-200">
                          <MockQuestionImage
                            path={linkedGroup.imagePath || linkedGroup.image_path}
                            alt={linkedGroup.imageAlt || linkedGroup.image_alt || 'Passage diagram'}
                            testId={testId}
                            type="group"
                            className="w-full max-h-72 object-contain"
                          />
                        </div>
                      )}
                      <p className="text-xs text-purple-800 font-bold flex items-center gap-1.5 pt-1">
                        <BookOpen className="w-3.5 h-3.5 text-purple-700 shrink-0" /> <span>Read the passage above carefully before answering the question below:</span>
                      </p>
                    </div>
                  )}

                  {/* Question Statement */}
                  <div className="space-y-3">
                    {showEnglishOnly && (
                      <div className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                        <MathText text={currentQ.questionText || currentQ.question} />
                      </div>
                    )}
                    {showBengaliOnly && (
                      <div className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed font-sans">
                        <MathText text={currentQ.questionTextBn || currentQ.questionBn || currentQ.questionText} />
                      </div>
                    )}
                    {showBoth && (
                      <div className="space-y-2">
                        <div className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                          <MathText text={currentQ.questionText || currentQ.question} />
                        </div>
                        {currentQ.questionTextBn && (
                          <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 text-slate-800 text-sm font-semibold leading-relaxed">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0056b3] block mb-0.5">
                              বাংলা অনুবাদ:
                            </span>
                            <MathText text={currentQ.questionTextBn} />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Question Diagram Image */}
                    {currentQ.imagePath && (
                      <div className="pt-2">
                        <MockQuestionImage
                          path={currentQ.imagePath}
                          alt={currentQ.imageAlt || `Diagram for question ${currentQ.position}`}
                          testId={testId}
                          type="question"
                          className="w-full max-h-80"
                        />
                      </div>
                    )}
                  </div>

                  {/* Options List */}
                  <div className="space-y-3">
                    {currentQ.options.map((opt: MockQuestionOption, idx: number) => {
                      const isSelected = selectedAnswers[currentQ.id] === idx;
                      const isCorrectAnswer = currentQ.correctOption === idx;
                      const optText = getOptionText(opt);
                      const optImg = getOptionImage(opt);

                      let containerStyle = 'border-slate-200 hover:bg-slate-50 bg-white';
                      if (viewMode === 'admin') {
                        if (isCorrectAnswer) {
                          containerStyle = 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20';
                        }
                      } else {
                        if (isSelected) {
                          containerStyle = 'border-[#0056b3] bg-blue-50/90 ring-2 ring-[#0056b3]/20';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (viewMode === 'student') {
                              setSelectedAnswers((prev) => ({ ...prev, [currentQ.id]: idx }));
                            }
                          }}
                          className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${containerStyle}`}
                        >
                          <span
                            className={`w-7 h-7 rounded-full text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5 ${
                              viewMode === 'admin' && isCorrectAnswer
                                ? 'bg-emerald-600 text-white'
                                : isSelected
                                ? 'bg-[#0056b3] text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {String.fromCharCode(65 + idx)}
                          </span>

                          <div className="flex-1 space-y-2">
                            <div className="text-sm font-semibold text-slate-900 leading-relaxed">
                              <MathText text={optText} />
                            </div>

                            {/* Option Diagram Image if present */}
                            {optImg?.imagePath && (
                              <div className="pt-1">
                                <MockQuestionImage
                                  path={optImg.imagePath}
                                  alt={optImg.imageAlt || `Option ${String.fromCharCode(65 + idx)} diagram`}
                                  testId={testId}
                                  type="option"
                                  className="w-48 h-32"
                                />
                              </div>
                            )}
                          </div>

                          {viewMode === 'admin' && isCorrectAnswer && (
                            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg shrink-0">
                              Correct Key
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Admin View: Detailed Solution & Explanation Box */}
                  {viewMode === 'admin' && (
                    <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Official Solution &amp; Explanation (Admin View Only)</span>
                      </span>

                      {currentQ.explanation ? (
                        <div className="text-xs sm:text-sm text-emerald-950 font-mono leading-relaxed">
                          <MathText text={currentQ.explanation} />
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-700 italic">No explanation text provided.</span>
                      )}

                      {currentQ.explanationImagePath && (
                        <div className="pt-2">
                          <MockQuestionImage
                            path={currentQ.explanationImagePath}
                            alt={currentQ.explanationImageAlt || 'Explanation diagram'}
                            testId={testId}
                            type="explanation"
                            className="w-full max-h-72"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}

              {/* Bottom Controls */}
              <div className="pt-8 mt-8 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setMarkedForReview((prev) => ({
                        ...prev,
                        [currentQ?.id]: !prev[currentQ?.id],
                      }))
                    }
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border cursor-pointer ${
                      markedForReview[currentQ?.id]
                        ? 'bg-amber-100 text-[#ea580c] border-amber-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5" />
                    {markedForReview[currentQ?.id] ? 'Marked for Review' : 'Mark for Review'}
                  </button>

                  {selectedAnswers[currentQ?.id] !== undefined && (
                    <button
                      type="button"
                      onClick={() => {
                        const copy = { ...selectedAnswers };
                        delete copy[currentQ.id];
                        setSelectedAnswers(copy);
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-[#dc2626] cursor-pointer"
                    >
                      Clear Response
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={activeQIndex === 0}
                    onClick={() => handleSelectQuestion(Math.max(0, activeQIndex - 1))}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold disabled:opacity-40 cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Previous
                  </button>

                  <button
                    type="button"
                    disabled={activeQIndex >= questions.length - 1}
                    onClick={() => handleSelectQuestion(Math.min(questions.length - 1, activeQIndex + 1))}
                    className="px-5 py-2 rounded-xl bg-[#0056b3] text-white text-xs font-bold disabled:opacity-40 cursor-pointer inline-flex items-center gap-1.5"
                  >
                    Save &amp; Next
                  </button>
                </div>
              </div>
            </div>

            {/* Question Palette Sidebar */}
            <div className="lg:col-span-4 p-6 bg-slate-50 space-y-6">
              <div>
                <h3 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider mb-2">
                  Question Palette
                </h3>
                <p className="text-[11px] text-slate-500">
                  {Object.keys(selectedAnswers).length} of {questions.length} Answered
                </p>
              </div>

              {/* Status Legend */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-md bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-md bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                    <Flag className="w-2.5 h-2.5" />
                  </span>
                  <span>Marked Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-md bg-white border border-slate-300 text-slate-700 text-[10px] flex items-center justify-center font-bold">
                    •
                  </span>
                  <span>Not Visited</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-md bg-blue-100 text-[#0056b3] text-[10px] flex items-center justify-center font-bold">
                    <ImageIcon className="w-2.5 h-2.5" />
                  </span>
                  <span>Has Diagram</span>
                </div>
              </div>

              {/* Questions Grid */}
              <div className="grid grid-cols-5 gap-2 max-h-[420px] overflow-y-auto pr-1">
                {questions.map((q, idx) => {
                  const isCurrent = idx === activeQIndex;
                  const isAnswered = selectedAnswers[q.id] !== undefined;
                  const isMarked = markedForReview[q.id];
                  const hasImage = Boolean(q.imagePath);

                  let bgClass = 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100';
                  if (isCurrent) {
                    bgClass = 'bg-[#0056b3] text-white border-[#0056b3] font-black shadow-xs ring-2 ring-blue-300';
                  } else if (isMarked) {
                    bgClass = 'bg-amber-500 text-white border-amber-500 font-bold';
                  } else if (isAnswered) {
                    bgClass = 'bg-emerald-600 text-white border-emerald-600 font-bold';
                  }

                  return (
                    <button
                      key={q.id || idx}
                      type="button"
                      onClick={() => handleSelectQuestion(idx)}
                      className={`h-9 rounded-xl border text-xs flex items-center justify-center relative cursor-pointer transition-all ${bgClass}`}
                    >
                      <span>{idx + 1}</span>
                      {hasImage && !isCurrent && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0056b3] absolute top-1 right-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Complete Test Layout for Print / Offline PDF Export (Hidden on Screen, Shown on Print) */}
      <div className="hidden print:block p-8 space-y-8 bg-white text-black font-serif">
        <div className="text-center pb-6 border-b-2 border-black">
          <h1 className="text-2xl font-black uppercase tracking-wider">Career Guidance Academy (C.G.A)</h1>
          <h2 className="text-xl font-bold mt-1">{test?.title}</h2>
          <p className="text-sm mt-1">
            Total Questions: {questions.length} | Duration: {test?.durationMinutes || 60} mins | Total Marks: {test?.totalMarks || questions.length}
          </p>
          <p className="text-xs italic mt-0.5">Admin Offline Proofreading Copy — Includes Complete Keys &amp; Derivations</p>
        </div>

        <div className="space-y-6">
          {questions.map((q, qIdx) => (
            <div key={q.id || qIdx} className="space-y-3 pb-6 border-b border-gray-300 break-inside-avoid">
              <div className="font-bold text-base flex items-start gap-2">
                <span>{qIdx + 1}.</span>
                <div className="flex-1">
                  <MathText text={q.questionText || q.question} />
                  {q.questionTextBn && (
                    <div className="text-sm italic text-gray-700 mt-1">
                      <MathText text={q.questionTextBn} />
                    </div>
                  )}
                </div>
              </div>

              {q.imagePath && (
                <div className="my-2">
                  <MockQuestionImage
                    path={q.imagePath}
                    alt={q.imageAlt || `Question ${qIdx + 1}`}
                    testId={testId}
                    type="question"
                    className="max-h-60"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-sm pl-4">
                {q.options.map((opt: MockQuestionOption, oIdx: number) => {
                  const isCorrect = q.correctOption === oIdx;
                  return (
                    <div
                      key={oIdx}
                      className={`p-1.5 rounded ${isCorrect ? 'font-black bg-gray-100 underline' : ''}`}
                    >
                      ({String.fromCharCode(65 + oIdx)}) {getOptionText(opt)}
                      {isCorrect && ' [CORRECT]'}
                    </div>
                  );
                })}
              </div>

              <div className="p-2 bg-gray-50 border border-gray-200 text-xs mt-2 pl-4">
                <strong>Correct Answer:</strong> ({String.fromCharCode(65 + (q.correctOption || 0))})
                {q.explanation && (
                  <div className="mt-1">
                    <strong>Explanation:</strong> <MathText text={q.explanation} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
