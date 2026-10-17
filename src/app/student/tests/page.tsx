'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ClipboardCheck,
  Clock,
  Trophy,
  CheckCircle2,
  Play,
  Flag,
  RotateCcw,
  Sparkles,
  Languages,
  Check,
  BookOpen,
  Phone,
  MapPin,
  Flame,
} from 'lucide-react';
import { useCga } from '@/context/CgaContext';
import { MockTest, TestAttempt } from '@/data/initialSeedData';
import {
  CustomCheckSvg,
  CustomCrossSvg,
  CustomArrowLeftSvg,
  CustomArrowRightSvg,
} from '@/components/ui/CustomIcons';

export default function StudentMockTestsPage() {
  const { db, currentStudent, submitMockTestAttempt, enrolInSeries, showToast } = useCga();

  const [activeTest, setActiveTest] = useState<MockTest | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [completedAttempt, setCompletedAttempt] = useState<TestAttempt | null>(null);
  const [langView, setLangView] = useState<'both' | 'en' | 'bn'>('both');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [enrollingSeriesId, setEnrollingSeriesId] = useState<string | null>(null);
  const [currentTime] = useState(() => Date.now());
  const submittingRef = useRef(false);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getTestLanguageMode = (test: MockTest): 'english_only' | 'bengali_only' | 'bilingual' => {
    if (test.languageMode) return test.languageMode;
    const target = `${test.subject || ''} ${test.title}`.toLowerCase();
    if (target.includes('english') || target.includes('lang1') || target.includes('language – i')) {
      return 'english_only';
    }
    if (target.includes('bengali') || target.includes('বাংলা') || target.includes('lang2')) {
      return 'bengali_only';
    }
    return 'bilingual';
  };

  const handleFinishTest = async () => {
    if (!activeTest || submittingRef.current) return;
    submittingRef.current = true;
    const elapsedMins = Math.max(
      1,
      Math.round((activeTest.durationMinutes * 60 - secondsLeft) / 60)
    );

    // Scoring happens authoritatively; the client only sends the chosen options.
    const saved = await submitMockTestAttempt({
      testId: activeTest.id,
      answers: selectedAnswers,
      timeTakenMinutes: elapsedMins,
    });
    submittingRef.current = false;
    if (!saved) {
      setSecondsLeft(0);
      setActiveTest(null);
      return;
    }

    setActiveTest(null);
    setCompletedAttempt(saved);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Countdown timer effect when a test is active
  useEffect(() => {
    if (!activeTest) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(() => {
            void handleFinishTest();
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTest]);

  if (!currentStudent) return null;

  const startTest = (test: MockTest) => {
    const matchingEnrollment = currentStudent.enrollments.find((e) => e.courseId === test.courseId);
    if (
      matchingEnrollment?.accessValidUntil &&
      new Date(matchingEnrollment.accessValidUntil).getTime() < currentTime
    ) {
      showToast(
        'Access Expired',
        'Your batch access duration for this course has expired. Please contact admin to renew.',
        'error'
      );
      return;
    }
    setCompletedAttempt(null);
    setActiveTest(test);
    setCurrentQIndex(0);
    setSelectedAnswers({});
    setMarkedForReview({});
    setSecondsLeft(test.durationMinutes * 60);
    setLangView('both');
  };

  const handleQuickSeriesEnroll = async (seriesId: string) => {
    setEnrollingSeriesId(seriesId);
    try {
      await enrolInSeries({
        seriesId,
        paymentMode: 'UPI',
        paymentRef: `UPI-FESTIVAL-${Date.now().toString().slice(-6)}`,
      });
    } catch {
      showToast('Enrolment Notice', 'Could not complete enrolment. Please contact academy office.', 'error');
    } finally {
      setEnrollingSeriesId(null);
    }
  };

  // ==================== 1. LIVE TIMED MCQ EXAM VIEW ====================
  if (activeTest) {
    const currentQ = activeTest.questions[currentQIndex];
    const langMode = getTestLanguageMode(activeTest);
    const showBoth = langMode === 'bilingual' && langView === 'both';
    const showEnglishOnly = langMode === 'english_only' || (langMode === 'bilingual' && langView === 'en');
    const showBengaliOnly = langMode === 'bengali_only' || (langMode === 'bilingual' && langView === 'bn');

    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Exam Topbar */}
        <div className="bg-[#0a0e2a] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>Live Timed CBT Exam • {activeTest.batchName}</span>
              <span className="bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded text-[10px] normal-case">
                Results locked until submit
              </span>
            </span>
            <h1 className="text-base sm:text-lg font-extrabold">{activeTest.title}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div
              className={`px-4 py-2 rounded-xl font-mono text-sm font-extrabold flex items-center gap-2 ${
                secondsLeft < 120 ? 'bg-[#dc2626] text-white animate-pulse' : 'bg-white/15 text-white'
              }`}
            >
              <Clock className="w-4 h-4 text-amber-300" />
              {formatTime(secondsLeft)}
            </div>

            <button
              type="button"
              onClick={handleFinishTest}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold cursor-pointer"
            >
              Submit Test Now
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Question Area */}
          <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200">
            <div className="space-y-6">
              {/* Question Header & Language View Toggles */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-[#0056b3]">
                    Question {currentQIndex + 1} of {activeTest.questions.length}
                  </span>

                  {/* Language Mode Indicator / View Toggle */}
                  {langMode === 'english_only' && (
                    <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#0056b3] border border-blue-200 font-extrabold text-[11px] inline-flex items-center gap-1">
                      <Languages className="w-3.5 h-3.5" /> English Subject (English Questions Only)
                    </span>
                  )}
                  {langMode === 'bengali_only' && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-[11px] inline-flex items-center gap-1 font-sans">
                      <Languages className="w-3.5 h-3.5" /> বাংলা পত্র (শুধুমাত্র বাংলায় প্রশ্ন ও উত্তর)
                    </span>
                  )}
                  {langMode === 'bilingual' && (
                    <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setLangView('both')}
                        className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                          langView === 'both'
                            ? 'bg-[#0056b3] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Bilingual (English and Bengali)
                      </button>
                      <button
                        type="button"
                        onClick={() => setLangView('en')}
                        className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                          langView === 'en'
                            ? 'bg-[#0056b3] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        English
                      </button>
                      <button
                        type="button"
                        onClick={() => setLangView('bn')}
                        className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                          langView === 'bn'
                            ? 'bg-[#0056b3] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        বাংলা
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                    +{activeTest.marksPerQuestion} Marks
                  </span>
                  <span className="px-2 py-0.5 rounded bg-red-50 text-[#dc2626] font-bold">
                    -{activeTest.negativeMarking} Negative
                  </span>
                </div>
              </div>

              {/* Question Statement (Rendered per Language Rule) */}
              <div className="space-y-3">
                {showEnglishOnly && (
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                    {currentQ.question}
                  </h2>
                )}
                {showBengaliOnly && (
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed font-sans">
                    {currentQ.questionBn || currentQ.question}
                  </h2>
                )}
                {showBoth && (
                  <div className="space-y-2">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                      {currentQ.question}
                    </h2>
                    {currentQ.questionBn && (
                      <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 text-slate-800 text-sm sm:text-base font-semibold leading-relaxed">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0056b3] block mb-0.5">
                          বাংলা অনুবাদ:
                        </span>
                        {currentQ.questionBn}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Options List */}
              <div className="space-y-3">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = selectedAnswers[currentQ.id] === idx;
                  const optBn = currentQ.optionsBn?.[idx];
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setSelectedAnswers((prev) => ({ ...prev, [currentQ.id]: idx }))
                      }
                      className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#0056b3] bg-blue-50/90 ring-2 ring-[#0056b3]/20 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-full text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-[#0056b3] text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <div className="flex-1">
                        {showEnglishOnly && (
                          <span className="text-sm font-semibold text-slate-800">{opt}</span>
                        )}
                        {showBengaliOnly && (
                          <span className="text-sm font-semibold text-slate-800">
                            {optBn || opt}
                          </span>
                        )}
                        {showBoth && (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-semibold text-slate-900">{opt}</span>
                            {optBn && (
                              <span className="text-xs font-medium text-slate-600">{optBn}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="pt-8 mt-8 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setMarkedForReview((prev) => ({
                      ...prev,
                      [currentQ.id]: !prev[currentQ.id],
                    }))
                  }
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border cursor-pointer ${
                    markedForReview[currentQ.id]
                      ? 'bg-amber-100 text-[#ea580c] border-amber-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  {markedForReview[currentQ.id] ? 'Marked for Review' : 'Mark for Review'}
                </button>

                {selectedAnswers[currentQ.id] !== undefined && (
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
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex((i) => Math.max(0, i - 1))}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold disabled:opacity-40 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <CustomArrowLeftSvg className="w-3.5 h-3.5" /> Previous
                </button>
                {currentQIndex < activeTest.questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentQIndex((i) => Math.min(activeTest.questions.length - 1, i + 1))
                    }
                    className="px-5 py-2 rounded-xl bg-[#0056b3] text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
                  >
                    Save & Next <CustomArrowRightSvg className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinishTest}
                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Finish & Submit Exam
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Question Palette Sidebar */}
          <div className="lg:col-span-4 p-6 bg-slate-50 space-y-6">
            <div>
              <h3 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider mb-2">
                Question Palette
              </h3>
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                {activeTest.questions.map((q, idx) => {
                  const isCurrent = idx === currentQIndex;
                  const isAnswered = selectedAnswers[q.id] !== undefined;
                  const isMarked = markedForReview[q.id];

                  let colorClass = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100';
                  if (isCurrent) {
                    colorClass = 'ring-2 ring-[#0056b3] bg-blue-50 font-black text-[#0056b3]';
                  } else if (isMarked) {
                    colorClass = 'bg-amber-100 border-amber-300 text-[#ea580c] font-bold';
                  } else if (isAnswered) {
                    colorClass = 'bg-emerald-600 text-white font-bold border-emerald-600';
                  }

                  return (
                    <button
                      key={q.id || idx}
                      type="button"
                      onClick={() => setCurrentQIndex(idx)}
                      className={`h-9 rounded-xl text-xs flex items-center justify-center border transition-all cursor-pointer ${colorClass}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2 pt-4 border-t border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-emerald-600" />
                <span className="text-slate-600">Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-amber-100 border border-amber-300" />
                <span className="text-slate-600">Marked for Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-white border border-slate-200" />
                <span className="text-slate-600">Not Attempted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== 2. RESULT & SOLUTIONS VIEW ====================
  const renderResultView = () => {
    if (!completedAttempt) return null;

    let testObj = db.mockTests.find((t) => t.id === completedAttempt.testId);

    // If questions in state are still masked (correctOptionIndex === -1), load master copy
    if (!testObj || testObj.questions.some((q) => q.correctOptionIndex === -1)) {
      if (typeof window !== 'undefined') {
        try {
          const ct = localStorage.getItem('cga_custom_tests');
          if (ct) {
            const list: MockTest[] = JSON.parse(ct);
            const found = list.find((t) => t.id === completedAttempt.testId);
            if (found && !found.questions.some((q) => q.correctOptionIndex === -1)) {
              testObj = found;
            }
          }
        } catch {}
      }
    }

    const allAttemptsForTest = db.testAttempts
      .filter((a) => a.testId === completedAttempt.testId)
      .sort((a, b) => b.score - a.score);

    const rankIndex = allAttemptsForTest.findIndex((a) => a.id === completedAttempt.id);
    const batchRank = rankIndex !== -1 ? rankIndex + 1 : 1;
    const langMode = testObj ? getTestLanguageMode(testObj) : 'bilingual';

    return (
      <div className="bg-white rounded-3xl border-2 border-[#0056b3] p-6 sm:p-8 shadow-lg space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <span className="inline-block px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold">
              Test Submitted Successfully • Official Evaluation
            </span>
            <h2 className="text-xl font-extrabold text-[#0a0e2a] mt-1">
              {completedAttempt.testTitle}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Your results and complete answer key are now unlocked below.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCompletedAttempt(null)}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
          >
            Close Scorecard
          </button>
        </div>

        {/* Score & Batch Rank Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-center">
            <span className="text-xs font-bold text-[#0056b3] block">Your Score</span>
            <p className="text-2xl font-extrabold text-[#0a0e2a] mt-1">
              {completedAttempt.score} / {completedAttempt.totalMarks}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
            <span className="text-xs font-bold text-[#ea580c] block">Batch Rank</span>
            <p className="text-2xl font-extrabold text-[#ea580c] mt-1">
              Rank #{batchRank}{' '}
              <span className="text-xs font-semibold text-slate-500">
                of {allAttemptsForTest.length}
              </span>
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
            <span className="text-xs font-bold text-emerald-700 block">Correct / Wrong</span>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1 inline-flex items-center justify-center gap-1.5">
              <span className="inline-flex items-center gap-1">
                {completedAttempt.correctCount} <CustomCheckSvg className="w-5 h-5" />
              </span>
              <span className="text-slate-400">/</span>
              <span className="text-[#dc2626] inline-flex items-center gap-1">
                {completedAttempt.wrongCount} <CustomCrossSvg className="w-5 h-5" />
              </span>
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-xs font-bold text-slate-500 block">Accuracy</span>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">
              {completedAttempt.accuracy}%
            </p>
          </div>
        </div>

        {/* Detailed Question-by-Question Answer Key & Explanation */}
        {testObj && (
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500">
              Correct Answers & Faculty Explanations ({langMode === 'english_only' ? 'English Only' : langMode === 'bengali_only' ? 'বাংলা পত্র' : 'Bilingual Analysis'})
            </h3>
            {testObj.questions.map((q, idx) => {
              const studentChoice = completedAttempt.answers[q.id];
              const isCorrect = studentChoice === q.correctOptionIndex;
              return (
                <div
                  key={q.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900 text-sm">
                        Q{idx + 1}. {q.question}
                      </p>
                      {q.questionBn && langMode !== 'english_only' && (
                        <p className="font-semibold text-blue-900 text-xs">
                          {q.questionBn}
                        </p>
                      )}
                    </div>
                    {studentChoice === undefined ? (
                      <span className="px-2.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold shrink-0">
                        Skipped
                      </span>
                    ) : isCorrect ? (
                      <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold shrink-0">
                        +{testObj.marksPerQuestion} Correct
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded bg-red-100 text-[#dc2626] font-bold shrink-0">
                        -{testObj.negativeMarking} Wrong
                      </span>
                    )}
                  </div>

                  <p className="text-emerald-700 font-bold flex items-center gap-1.5">
                    <CustomCheckSvg className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Correct Answer: ({String.fromCharCode(65 + q.correctOptionIndex)}){' '}
                      {q.options[q.correctOptionIndex]}
                      {q.optionsBn?.[q.correctOptionIndex] && langMode !== 'english_only' ? ` • ${q.optionsBn[q.correctOptionIndex]}` : ''}
                    </span>
                  </p>

                  {studentChoice !== undefined && !isCorrect && (
                    <p className="text-[#dc2626] font-semibold flex items-center gap-1.5">
                      <CustomCrossSvg className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Your Answer: ({String.fromCharCode(65 + studentChoice)}){' '}
                        {q.options[studentChoice]}
                        {q.optionsBn?.[studentChoice] && langMode !== 'english_only' ? ` • ${q.optionsBn[studentChoice]}` : ''}
                      </span>
                    </p>
                  )}

                  <div className="text-slate-600 bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                    <p>
                      <strong className="text-slate-900">Explanation:</strong> {q.explanation}
                    </p>
                    {q.explanationBn && langMode !== 'english_only' && (
                      <p className="text-blue-900 font-medium">
                        <strong className="text-blue-950">ব্যাখ্যা:</strong> {q.explanationBn}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const publishedTests = db.mockTests.filter((t) => t.status === 'Published');
  const myPastAttempts = db.testAttempts.filter((a) => a.studentId === currentStudent.id);

  // Filter published tests according to category
  const filteredTests = publishedTests.filter((t) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'p1') return t.title.toLowerCase().includes('paper-i') || t.title.toLowerCase().includes('paper i');
    if (filterCategory === 'p2sci') return t.title.toLowerCase().includes('science');
    if (filterCategory === 'p2soc') return t.title.toLowerCase().includes('social');
    if (filterCategory === 'bilingual') return getTestLanguageMode(t) === 'bilingual';
    if (filterCategory === 'english') return getTestLanguageMode(t) === 'english_only';
    if (filterCategory === 'bengali') return getTestLanguageMode(t) === 'bengali_only';
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#0a0e2a]">
          Daily Online Mock Tests Arena & CBT Portal
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          TRBT & TPSC standard computer-based test simulator. English subjects have English questions only,
          Bengali subjects have Bengali questions only, and all other subjects have questions in both English and Bengali.
        </p>
      </div>

      {/* Instant Scorecard if just completed */}
      {renderResultView()}

      {/* ==================== 3 FESTIVAL OFFER BANNERS / PACKAGES SHOWCASE ==================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-[#dc2626] font-black text-[11px] uppercase tracking-wider inline-flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-current" /> Festival Offer Live
            </span>
            <h2 className="text-xl font-black text-[#0a0e2a] mt-1">
              Tripura TET 2026 Daily Online Mock Tests Series Packages
            </h2>
          </div>
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-[#0056b3]" />
            <span className="font-bold">Helpline: 7005929189</span>
            <span className="text-slate-300">•</span>
            <MapPin className="w-3.5 h-3.5 text-[#ea580c]" />
            <span>Chanban, Udaipur</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Banner 1: Paper-I 2026 */}
          <div className="bg-gradient-to-br from-blue-900 via-[#0056b3] to-indigo-900 rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                  Festival Offer!
                </span>
                <span className="text-xs font-bold text-blue-200">Classes I to V</span>
              </div>
              <h3 className="text-lg font-black leading-snug">
                Tripura TET: Paper-I 2026
              </h3>
              <p className="text-xs text-blue-100">
                Daily Online Mock Tests Series (Weekly 5 Days Mon–Fri)
              </p>

              {/* Price Tag */}
              <div className="pt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-amber-300">₹399/-</span>
                  <span className="text-xs text-blue-200 font-bold uppercase">Only</span>
                  <span className="text-xs text-blue-300 line-through">₹499</span>
                </div>
              </div>

              {/* Feature Highlights from Banner */}
              <ul className="space-y-1.5 text-xs text-blue-50 pt-3 border-t border-white/15">
                <li className="flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>30+ Sectional Mock Tests (CDP, English, Bengali, Math & EVS)</span>
                </li>
                <li className="flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>02 Full Length Mock Tests (Full Syllabus)</span>
                </li>
                <li className="flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>1200+ MCQs & OMR Sheet For Practice</span>
                </li>
                <li className="flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>Bilingual Questions (English & Bengali)</span>
                </li>
                <li className="flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>Self Performance Analysis & Doubt Discussion</span>
                </li>
              </ul>
            </div>

            <div className="pt-5 mt-5 border-t border-white/15 relative z-10">
              <button
                type="button"
                onClick={() => handleQuickSeriesEnroll('series-ttet-paper1')}
                disabled={enrollingSeriesId === 'series-ttet-paper1'}
                className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {enrollingSeriesId === 'series-ttet-paper1' ? 'Enrolling...' : 'Enroll Now @ ₹399/-'}
              </button>
            </div>
          </div>

          {/* Banner 2: Paper-II (Science) 2026 */}
          <div className="bg-gradient-to-br from-indigo-950 via-[#1e3a8a] to-blue-900 rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                  Festival Offer!
                </span>
                <span className="text-xs font-bold text-indigo-200">Classes VI to VIII</span>
              </div>
              <h3 className="text-lg font-black leading-snug">
                Tripura TET: Paper-II (Science) 2026
              </h3>
              <p className="text-xs text-indigo-100">
                Daily Online Mock Tests Series (Weekly 5 Days Mon–Fri)
              </p>

              {/* Price Tag */}
              <div className="pt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-amber-300">₹499/-</span>
                  <span className="text-xs text-indigo-200 font-bold uppercase">Only</span>
                  <span className="text-xs text-indigo-300 line-through">₹699</span>
                </div>
              </div>

              {/* Feature Highlights from Banner */}
              <ul className="space-y-1.5 text-xs text-indigo-50 pt-3 border-t border-white/15">
                <li className="flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>40+ Sectional Mock Tests (CDP, English, Bengali, Maths & Science)</span>
                </li>
                <li className="flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>02 Full Length Mock Tests (Full Syllabus)</span>
                </li>
                <li className="flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>1500+ MCQs & OMR Sheet For Practice</span>
                </li>
                <li className="flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>Bilingual Questions (English & Bengali)</span>
                </li>
                <li className="flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>Self Performance Analysis & Doubt Discussion</span>
                </li>
              </ul>
            </div>

            <div className="pt-5 mt-5 border-t border-white/15 relative z-10">
              <button
                type="button"
                onClick={() => handleQuickSeriesEnroll('series-ttet-paper2-sci')}
                disabled={enrollingSeriesId === 'series-ttet-paper2-sci'}
                className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {enrollingSeriesId === 'series-ttet-paper2-sci' ? 'Enrolling...' : 'Enroll Now @ ₹499/-'}
              </button>
            </div>
          </div>

          {/* Banner 3: Paper-II (Social Studies) 2026 */}
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                  Festival Offer!
                </span>
                <span className="text-xs font-bold text-slate-300">Classes VI to VIII</span>
              </div>
              <h3 className="text-lg font-black leading-snug">
                Tripura TET: Paper-II (Social Studies) 2026
              </h3>
              <p className="text-xs text-slate-200">
                Daily Online Mock Tests Series (Weekly 5 Days Mon–Fri)
              </p>

              {/* Price Tag */}
              <div className="pt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-amber-300">₹499/-</span>
                  <span className="text-xs text-slate-200 font-bold uppercase">Only</span>
                  <span className="text-xs text-slate-400 line-through">₹699</span>
                </div>
              </div>

              {/* Feature Highlights from Banner */}
              <ul className="space-y-1.5 text-xs text-slate-100 pt-3 border-t border-white/15">
                <li className="flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>40+ Sectional Mock Tests (CDP, English, Bengali, History, Geog, Pol Sci)</span>
                </li>
                <li className="flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>02 Full Length Mock Tests (Full Syllabus)</span>
                </li>
                <li className="flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>1500+ MCQs & OMR Sheet For Practice</span>
                </li>
                <li className="flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>Bilingual Questions (English & Bengali)</span>
                </li>
                <li className="flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>Self Performance Analysis & Doubt Discussion</span>
                </li>
              </ul>
            </div>

            <div className="pt-5 mt-5 border-t border-white/15 relative z-10">
              <button
                type="button"
                onClick={() => handleQuickSeriesEnroll('series-ttet-paper2-soc')}
                disabled={enrollingSeriesId === 'series-ttet-paper2-soc'}
                className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {enrollingSeriesId === 'series-ttet-paper2-soc' ? 'Enrolling...' : 'Enroll Now @ ₹499/-'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== SCHEDULED & SUBJECT-WISE MOCK TESTS ==================== */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-[#0a0e2a] flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-[#0056b3]" /> Live Scheduled & Subject-Wise Mock Tests
          </h2>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                filterCategory === 'all'
                  ? 'bg-[#0056b3] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Tests ({publishedTests.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('p1')}
              className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                filterCategory === 'p1'
                  ? 'bg-[#0056b3] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Paper-I (₹399)
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('p2sci')}
              className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                filterCategory === 'p2sci'
                  ? 'bg-[#0056b3] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Paper-II Science (₹499)
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('p2soc')}
              className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                filterCategory === 'p2soc'
                  ? 'bg-[#0056b3] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Paper-II Social Studies (₹499)
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('bilingual')}
              className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                filterCategory === 'bilingual'
                  ? 'bg-[#0056b3] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Bilingual
            </button>
          </div>
        </div>

        {filteredTests.length === 0 ? (
          <div className="bg-slate-50 rounded-3xl border border-slate-200 p-8 text-center text-slate-500">
            <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-bold text-sm">No tests found in this category.</p>
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              className="mt-3 px-4 py-2 rounded-xl bg-[#0056b3] text-white text-xs font-bold"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTests.map((test) => {
              const langMode = getTestLanguageMode(test);
              const existingAttempt = myPastAttempts.find((a) => a.testId === test.id);
              const matchingEnrollment = currentStudent.enrollments.find((e) => e.courseId === test.courseId);
              const isExpired = Boolean(
                matchingEnrollment?.accessValidUntil &&
                  new Date(matchingEnrollment.accessValidUntil).getTime() < currentTime
              );

              return (
                <div
                  key={test.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between space-y-4 cga-card-hover"
                >
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0056b3] border border-blue-200 text-[11px] font-extrabold truncate">
                        {test.batchName}
                      </span>

                      {/* Language Mode Badge */}
                      {langMode === 'english_only' && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                          English Only
                        </span>
                      )}
                      {langMode === 'bengali_only' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold font-sans">
                          বাংলা পত্র (Bengali Only)
                        </span>
                      )}
                      {langMode === 'bilingual' && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                          Bilingual (English and Bengali)
                        </span>
                      )}
                      {isExpired && (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold">
                          Access Expired
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-[#0a0e2a] leading-snug">
                      {test.title}
                    </h3>
                    <p className="text-xs text-slate-500">{test.courseName}</p>

                    <div className="grid grid-cols-2 gap-2 pt-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Duration</span>
                        <span className="font-bold text-slate-800">{test.durationMinutes} Mins</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Total Marks</span>
                        <span className="font-bold text-slate-800">
                          {test.totalMarks} ({test.questions.length} Qs)
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Marking Scheme</span>
                        <span className="font-bold text-slate-800">
                          +{test.marksPerQuestion} / -{test.negativeMarking}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Access Status</span>
                        {isExpired ? (
                          <span className="font-bold text-red-600 block text-[11px]">
                            Expired ({new Date(matchingEnrollment!.accessValidUntil!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})
                          </span>
                        ) : matchingEnrollment?.accessValidUntil ? (
                          <span className="font-bold text-emerald-600 block text-[11px]">
                            Valid ({new Date(matchingEnrollment.accessValidUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})
                          </span>
                        ) : (
                          <span className="font-bold text-[#0056b3] block text-[11px]">
                            {test.scheduledDate || 'Active'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpired ? (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-center text-xs text-red-700 font-semibold">
                        Batch duration ended on {new Date(matchingEnrollment!.accessValidUntil!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <a
                        href="tel:7005929189"
                        className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
                      >
                        Contact Admin to Renew
                      </a>
                    </div>
                  ) : existingAttempt ? (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                        <span className="font-extrabold text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Submitted</span>
                        </span>
                        <span className="font-extrabold text-[#0056b3]">
                          Score: {existingAttempt.score} / {existingAttempt.totalMarks}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCompletedAttempt(existingAttempt);
                            if (typeof window !== 'undefined') {
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Trophy className="w-3.5 h-3.5 text-amber-300" /> View Result & Solutions
                        </button>
                        <button
                          type="button"
                          onClick={() => startTest(test)}
                          className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center justify-center cursor-pointer"
                          title="Retake Practice Test"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startTest(test)}
                      className="w-full py-3 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-extrabold inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Start Timed Mock Test
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Attempts History Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h2 className="text-lg font-extrabold text-[#0a0e2a] flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#ea580c]" /> My Past Test Attempts & Batch Ranks
        </h2>

        {myPastAttempts.length === 0 ? (
          <p className="text-xs text-slate-500 py-4">
            You haven’t attempted any mock tests yet. Click &quot;Start Timed Mock Test&quot; above!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase">
                  <th className="py-3 px-3">Mock Test Title</th>
                  <th className="py-3 px-3">Submitted On</th>
                  <th className="py-3 px-3">Score</th>
                  <th className="py-3 px-3">Correct / Wrong</th>
                  <th className="py-3 px-3">Accuracy</th>
                  <th className="py-3 px-3">Batch Rank</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myPastAttempts.map((att) => {
                  const testPeers = db.testAttempts
                    .filter((a) => a.testId === att.testId)
                    .sort((a, b) => b.score - a.score);
                  const rank = testPeers.findIndex((a) => a.id === att.id) + 1;
                  return (
                    <tr key={att.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-3 font-extrabold text-slate-900">{att.testTitle}</td>
                      <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                        {att.submittedAt}
                      </td>
                      <td className="py-3.5 px-3 font-extrabold text-[#0056b3] whitespace-nowrap">
                        {att.score} / {att.totalMarks}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="text-emerald-600 font-bold inline-flex items-center gap-1">
                          {att.correctCount} <CustomCheckSvg className="w-3.5 h-3.5" />
                        </span>{' '}
                        /{' '}
                        <span className="text-[#dc2626] font-bold inline-flex items-center gap-1">
                          {att.wrongCount} <CustomCrossSvg className="w-3.5 h-3.5" />
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-bold whitespace-nowrap">{att.accuracy}%</td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full bg-amber-50 text-[#ea580c] border border-amber-200 font-extrabold whitespace-nowrap">
                          Rank #{rank} of {testPeers.length}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setCompletedAttempt(att);
                            if (typeof window !== 'undefined') {
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }}
                          className="text-[#0056b3] font-bold hover:underline cursor-pointer"
                        >
                          View Result & Solutions
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
