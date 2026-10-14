'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ClipboardCheck,
  Clock,
  Trophy,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Flag,
  RotateCcw,
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
  const { db, currentStudent, submitMockTestAttempt } = useCga();

  const [activeTest, setActiveTest] = useState<MockTest | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [completedAttempt, setCompletedAttempt] = useState<TestAttempt | null>(null);
  const submittingRef = useRef(false);

  // Countdown timer effect when a test is active
  useEffect(() => {
    if (!activeTest) return;
    if (secondsLeft <= 0) {
      handleFinishTest();
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTest, secondsLeft]);

  if (!currentStudent) return null;

  const startTest = (test: MockTest) => {
    setCompletedAttempt(null);
    setActiveTest(test);
    setCurrentQIndex(0);
    setSelectedAnswers({});
    setMarkedForReview({});
    setSecondsLeft(test.durationMinutes * 60);
  };

  const handleFinishTest = async () => {
    if (!activeTest || submittingRef.current) return;
    submittingRef.current = true;
    const elapsedMins = Math.max(
      1,
      Math.round((activeTest.durationMinutes * 60 - secondsLeft) / 60)
    );

    // Scoring happens on the server; the client only sends the chosen options.
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
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // ==================== 1. LIVE TIMED MCQ EXAM VIEW ====================
  if (activeTest) {
    const currentQ = activeTest.questions[currentQIndex];
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
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
                <span className="font-extrabold text-[#0056b3]">
                  Question {currentQIndex + 1} of {activeTest.questions.length}
                </span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                    +{activeTest.marksPerQuestion} Marks
                  </span>
                  <span className="px-2 py-0.5 rounded bg-red-50 text-[#dc2626] font-bold">
                    -{activeTest.negativeMarking} Negative
                  </span>
                </div>
              </div>

              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                {currentQ.question}
              </h2>

              <div className="space-y-3">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = selectedAnswers[currentQ.id] === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setSelectedAnswers((prev) => ({ ...prev, [currentQ.id]: idx }))
                      }
                      className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#0056b3] bg-blue-50/90 ring-2 ring-[#0056b3]/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-full text-xs font-extrabold flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-[#0056b3] text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-sm font-semibold text-slate-800">{opt}</span>
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
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">
                Question Navigation Palette
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {activeTest.questions.map((q, idx) => {
                  const answered = selectedAnswers[q.id] !== undefined;
                  const review = markedForReview[q.id];
                  const isCurrent = currentQIndex === idx;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentQIndex(idx)}
                      className={`h-10 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        isCurrent ? 'ring-2 ring-[#0a0e2a] scale-105 ' : ''
                      }${
                        review
                          ? 'bg-[#ea580c] text-white'
                          : answered
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-600 inline-block" />
                <span>Answered ({Object.keys(selectedAnswers).length})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-[#ea580c] inline-block" />
                <span>Marked for Review ({Object.values(markedForReview).filter(Boolean).length})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-white border border-slate-300 inline-block" />
                <span>
                  Not Answered (
                  {activeTest.questions.length - Object.keys(selectedAnswers).length})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate Batch Rank for completedAttempt if present
  const renderResultView = () => {
    if (!completedAttempt) return null;
    const testObj = db.mockTests.find((t) => t.id === completedAttempt.testId);
    const allAttemptsForTest = db.testAttempts
      .filter((a) => a.testId === completedAttempt.testId)
      .sort((a, b) => b.score - a.score);

    const rankIndex = allAttemptsForTest.findIndex((a) => a.id === completedAttempt.id);
    const batchRank = rankIndex !== -1 ? rankIndex + 1 : 1;

    return (
      <div className="bg-white rounded-3xl border-2 border-[#0056b3] p-6 sm:p-8 shadow-lg space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <span className="inline-block px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold">
              ✓ Test Submitted Successfully • Official Evaluation
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
              Correct Answers & Faculty Explanations
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
                    <p className="font-bold text-slate-900 text-sm">
                      Q{idx + 1}. {q.question}
                    </p>
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
                    </span>
                  </p>
                  {studentChoice !== undefined && !isCorrect && (
                    <p className="text-[#dc2626] font-semibold flex items-center gap-1.5">
                      <CustomCrossSvg className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Your Answer: ({String.fromCharCode(65 + studentChoice)}){' '}
                        {q.options[studentChoice]}
                      </span>
                    </p>
                  )}
                  <p className="text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/80">
                    <strong>Explanation:</strong> {q.explanation}
                  </p>
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0a0e2a]">
          Online Mock Test Arena & Batch Leaderboard
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Attempt timed MCQ mock tests with real exam negative marking, view instant solutions, and
          compare your rank within your C.G.A batch.
        </p>
      </div>

      {/* Instant Scorecard if just completed */}
      {renderResultView()}

      {/* Scheduled Mock Tests */}
      <div className="space-y-4">
        <h2 className="text-lg font-extrabold text-[#0a0e2a] flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-[#0056b3]" /> Available Scheduled Mock Tests
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publishedTests.map((test) => (
            <div
              key={test.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between space-y-4 cga-card-hover"
            >
              <div className="space-y-2.5">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0056b3] border border-blue-200 text-[11px] font-extrabold">
                  {test.batchName}
                </span>
                <h3 className="text-base font-extrabold text-[#0a0e2a]">{test.title}</h3>
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
                    <span className="text-slate-400 block text-[11px]">Negative Marking</span>
                    <span className="font-bold text-[#dc2626]">
                      -{test.negativeMarking} per wrong
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Scheduled Date</span>
                    <span className="font-bold text-slate-800 whitespace-nowrap block">
                      {test.scheduledDate}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => startTest(test)}
                className="w-full py-3 rounded-xl bg-[#0056b3] hover:bg-[#1e3a8a] text-white text-xs font-extrabold inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Launch Timed Mock Test
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Past Attempts History */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h2 className="text-lg font-extrabold text-[#0a0e2a] flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#ea580c]" /> My Past Test Attempts & Batch Ranks
        </h2>

        {myPastAttempts.length === 0 ? (
          <p className="text-xs text-slate-500 py-4">
            You haven’t attempted any mock tests yet. Click "Launch Timed Mock Test" above!
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
                          onClick={() => setCompletedAttempt(att)}
                          className="text-[#0056b3] font-bold hover:underline cursor-pointer"
                        >
                          View Solutions
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
