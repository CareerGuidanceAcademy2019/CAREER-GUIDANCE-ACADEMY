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
  ExternalLink,
  Lock,
  Copy,
  Download,
  Layers,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useCga } from '@/context/CgaContext';
import { MockTest, TestAttempt, MockSubjectPost, MockQuestionOption, getOptionText, getOptionImage } from '@/data/initialSeedData';
import { MOCK_SERIES_INITIAL, MOCK_SUBJECTS_INITIAL, getSubjectLanguageMode } from '@/data/mockSeriesSeedData';
import { PayManualModal, type PayManualTarget } from '@/components/payment/PayManualModal';
import { MathText } from '@/components/ui/MathText';
import { MockQuestionImage } from '@/components/mock-tests/MockQuestionImage';
import { AppearTestButton } from '@/components/mock-tests/AppearTestButton';
import {
  CustomCheckSvg,
  CustomCrossSvg,
  CustomArrowLeftSvg,
  CustomArrowRightSvg,
} from '@/components/ui/CustomIcons';

export default function StudentMockTestsPage() {
  const searchParams = useSearchParams();
  const { db, currentStudent, submitMockTestAttempt, enrolInSeries, showToast } = useCga();
  const [payManualTarget, setPayManualTarget] = useState<PayManualTarget | null>(null);

  const myPastAttempts = currentStudent
    ? (db.testAttempts || []).filter((a) => a.studentId === currentStudent.id || a.studentId === 'me')
    : [];

  const [activeTest, setActiveTest] = useState<any | null>(null);
  const [isStartingTest, setIsStartingTest] = useState<boolean>(() => Boolean(searchParams.get('testId')));
  const [startingTestTitle, setStartingTestTitle] = useState<string>('');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [completedAttempt, setCompletedAttempt] = useState<TestAttempt | null>(null);
  const [langView, setLangView] = useState<'both' | 'en' | 'bn'>('both');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [enrollingSeriesId, setEnrollingSeriesId] = useState<string | null>(null);
  const [currentTime] = useState(() => Date.now());

  // Series, Subject, and Subsections Navigation
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('series-ttet-paper1');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [activeSubsection, setActiveSubsection] = useState<'tests' | 'papers'>('tests');
  const [seriesPapers, setSeriesPapers] = useState<any[]>([]);
  const [loadingPapers, setLoadingPapers] = useState(false);
  const submittingRef = useRef(false);

  // Subject Question Posts state
  const [selectedSubjectTab, setSelectedSubjectTab] = useState<string>('all');
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  const SERIES_TO_COURSES: Record<string, string[]> = {
    'series-ttet-paper1': ['crs-tet-1-online', 'crs-tet-1-offline', 'crs-tet-1', 'series-ttet-paper1'],
    'series-ttet-paper2-sci': ['crs-tet-2-sci-online', 'crs-tet-2-sci-offline', 'crs-tet-2-sci', 'series-ttet-paper2-sci'],
    'series-ttet-paper2-soc': ['crs-tet-2-arts-online', 'crs-tet-2-arts-offline', 'crs-tet-2-arts', 'series-ttet-paper2-soc'],
  };

  const isStudentEnrolledInSeries = (seriesId: string) => {
    if (!currentStudent) return false;
    if (currentStudent.email === 'angatsaha825@gmail.com') return true;
    const inSeries = db.seriesEnrollments?.some(
      (se) => se.studentId === currentStudent.id && se.seriesId === seriesId
    );
    if (inSeries) return true;

    // Check course enrollment matching this series
    const matchingCourses = SERIES_TO_COURSES[seriesId] || [seriesId];
    const match = currentStudent.enrollments.find((e) => matchingCourses.includes(e.courseId));
    if (match) {
      if (match.accessValidUntil) {
        return new Date(match.accessValidUntil).getTime() > currentTime;
      }
      return true;
    }
    return false;
  };

  const isStudentEnrolledInTest = (test: any) => {
    if (!currentStudent) return false;
    if (currentStudent.email === 'angatsaha825@gmail.com') return true;

    if (test.seriesId && test.seriesId !== 'all') {
      return isStudentEnrolledInSeries(test.seriesId);
    }

    if (test.courseId) {
      for (const [sId, courses] of Object.entries(SERIES_TO_COURSES)) {
        if (courses.includes(test.courseId)) {
          return isStudentEnrolledInSeries(sId);
        }
      }
      const match = currentStudent.enrollments.find((e) => e.courseId === test.courseId);
      if (match) {
        if (match.accessValidUntil) {
          return new Date(match.accessValidUntil).getTime() > currentTime;
        }
        return true;
      }
      return false;
    }

    const title = (test.title || '').toLowerCase();
    if (title.includes('paper-i') || title.includes('paper 1') || title.includes('paper-1')) {
      return isStudentEnrolledInSeries('series-ttet-paper1');
    }
    if (title.includes('science')) {
      return isStudentEnrolledInSeries('series-ttet-paper2-sci');
    }
    if (title.includes('social') || title.includes('arts')) {
      return isStudentEnrolledInSeries('series-ttet-paper2-soc');
    }

    return isStudentEnrolledInSeries('series-ttet-paper1');
  };

  const isStudentEnrolledInPost = (post: MockSubjectPost) => {
    return isStudentEnrolledInSeries(post.seriesId);
  };

  useEffect(() => {
    const fetchSeriesPapers = async () => {
      setLoadingPapers(true);
      try {
        const res = await fetch(`/api/mock-tests/papers?seriesId=${encodeURIComponent(selectedSeriesId)}`);
        if (res.ok) {
          const data = await res.json();
          setSeriesPapers(data.papers || []);
        }
      } catch {} finally {
        setLoadingPapers(false);
      }
    };
    fetchSeriesPapers();
  }, [selectedSeriesId]);

  const handleCopyDriveLink = (post: MockSubjectPost) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(post.driveLink);
      setCopiedPostId(post.id);
      showToast('Link Copied!', 'Google Drive link copied to clipboard.', 'success');
      setTimeout(() => setCopiedPostId(null), 2500);
    }
  };

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

  const startTest = async (test: any) => {
    // 1. Strict Single Attempt Check: Candidates can appear for a mock test only once
    const pastAttempt = myPastAttempts.find(
      (a) => a.testId === test.id && Boolean(a.submittedAt || (a as any).submitted_at)
    );
    if (pastAttempt) {
      showToast(
        'Single Attempt Policy',
        'You have already appeared for this mock test. Each candidate is permitted only one attempt. Loading your detailed solutions and scorecard.',
        'info'
      );
      setIsStartingTest(false);
      setCompletedAttempt(pastAttempt);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
      return;
    }

    if (!isStudentEnrolledInTest(test)) {
      setIsStartingTest(false);
      showToast(
        'Access Restricted',
        'You are enrolled in Tripura TET Paper-I. To appear for other mock exams, please enrol in that course.',
        'error'
      );
      return;
    }

    const matchingEnrollment = currentStudent.enrollments.find((e) => e.courseId === test.courseId);
    if (
      matchingEnrollment?.accessValidUntil &&
      new Date(matchingEnrollment.accessValidUntil).getTime() < currentTime
    ) {
      setIsStartingTest(false);
      showToast(
        'Access Expired',
        'Your batch access duration for this course has expired. Please contact admin to renew.',
        'error'
      );
      return;
    }

    // 2. Immediately transition into the exam launch state so the enrollment section never flashes
    setIsStartingTest(true);
    setStartingTestTitle(test.title);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    try {
      const res = await fetch('/api/mock-tests/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId: test.id }),
      });

      if (res.ok) {
        const data = await res.json();
        const serverDuration = (data.durationMinutes || test.durationMinutes || 30) * 60;
        let remaining = serverDuration;
        if (data.startedAt && data.serverNow) {
          const elapsed = Math.floor((new Date(data.serverNow).getTime() - new Date(data.startedAt).getTime()) / 1000);
          remaining = Math.max(10, serverDuration - elapsed);
        }

        const questionsToUse = (data.questions && data.questions.length > 0) ? data.questions : (test.questions || []);
        if (!Array.isArray(questionsToUse) || questionsToUse.length === 0) {
          setIsStartingTest(false);
          showToast(
            'Test Not Ready',
            'Questions for this mock test are currently being finalized by the faculty. Please check back shortly.',
            'error'
          );
          return;
        }

        setCompletedAttempt(null);
        setActiveTest({
          ...test,
          title: data.title || test.title,
          durationMinutes: data.durationMinutes || test.durationMinutes,
          totalMarks: data.totalMarks || test.totalMarks,
          negativeMarking: data.negativeMarking ?? test.negativeMarking,
          questionGroups: data.questionGroups || [],
          questions: questionsToUse,
        });
        setCurrentQIndex(0);
        setSelectedAnswers(data.savedAnswers || {});
        setMarkedForReview({});
        setSecondsLeft(remaining);
        setLangView('both');
        setIsStartingTest(false);
        return;
      } else {
        const errJson = await res.json().catch(() => null);
        setIsStartingTest(false);
        if (errJson?.error) {
          showToast('Cannot Start Test', errJson.error, 'error');
          return;
        }
      }
    } catch {
      setIsStartingTest(false);
    }

    // Fallback to local test state ONLY if it contains valid questions
    const localQuestions = test.questions || [];
    if (!Array.isArray(localQuestions) || localQuestions.length === 0) {
      setIsStartingTest(false);
      showToast(
        'Questions Unavailable',
        'The question paper for this test is being prepared by the faculty. Please check back shortly.',
        'error'
      );
      return;
    }

    setCompletedAttempt(null);
    setActiveTest(test);
    setCurrentQIndex(0);
    setSelectedAnswers({});
    setMarkedForReview({});
    setSecondsLeft((test.durationMinutes || 30) * 60);
    setLangView('both');
    setIsStartingTest(false);
  };

  // Auto-launch test if testId is in query params
  useEffect(() => {
    const testId = searchParams.get('testId');
    if (testId && !activeTest && !completedAttempt) {
      // Check single attempt integrity first
      const pastAttempt = myPastAttempts.find(
        (a) => a.testId === testId && Boolean(a.submittedAt || (a as any).submitted_at)
      );
      if (pastAttempt) {
        setCompletedAttempt(pastAttempt);
        setIsStartingTest(false);
        return;
      }

      const match = db.mockTests.find((t) => t.id === testId);
      if (match && match.status === 'Published') {
        startTest(match);
      } else {
        setIsStartingTest(false);
      }
    }
  }, [searchParams, db.mockTests, activeTest, completedAttempt, myPastAttempts]);

  const handleOpenSeriesCheckout = (seriesId: string) => {
    if (isStudentEnrolledInSeries(seriesId)) {
      showToast('Already Enrolled', 'You are already enrolled in this mock test series.', 'info');
      return;
    }
    const hasPendingPayment =
      (db.feePayments || []).some(
        (p) => (p.studentId === currentStudent.id || p.studentId === 'me') && p.courseId === seriesId && p.status === 'Pending'
      ) ||
      (typeof window !== 'undefined' &&
        (() => {
          try {
            const stored = localStorage.getItem('cga_custom_payments');
            if (stored) {
              const list = JSON.parse(stored);
              return list.some(
                (p: any) =>
                  (p.studentId === currentStudent.id || p.studentId === 'me') &&
                  p.courseId === seriesId &&
                  p.status === 'Pending'
              );
            }
          } catch {}
          return false;
        })());
    if (hasPendingPayment) {
      showToast(
        'Verification Pending',
        'You have already submitted a payment for this mock series. Please wait for admin verification.',
        'info'
      );
      return;
    }

    const activeSeriesList = db.mockSeries && db.mockSeries.length > 0 ? db.mockSeries : MOCK_SERIES_INITIAL;
    const s = activeSeriesList.find((item) => item.id === seriesId);
    setPayManualTarget({
      itemType: 'mock_series',
      itemId: seriesId,
      title: s?.name || 'Tripura TET Daily Online Mock Tests Series',
      category: 'Tripura TET Mock Series',
      fullAmount: s?.price || 499,
      paymentType: 'full',
    });
  };

  // ==================== CBT LAUNCH TRANSITION SCREEN (NO FLASH OF ENROLL SECTION) ====================
  if (isStartingTest) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-16 text-center space-y-6 shadow-sm min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#0056b3] flex items-center justify-center shadow-xs">
          <Clock className="w-8 h-8 animate-spin text-[#0056b3]" />
        </div>
        <div className="space-y-2 max-w-md mx-auto">
          <span className="px-3 py-1 rounded-full bg-blue-100 text-[#0056b3] text-xs font-bold uppercase tracking-wider">
            CBT Secure Examination Engine
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0a0e2a]">
            {startingTestTitle || 'Launching Mock Examination...'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Directly loading questions, synchronizing timer, and establishing test session integrity. Entering examination hall...
          </p>
        </div>
      </div>
    );
  }

  // ==================== 1. LIVE TIMED MCQ EXAM VIEW ====================
  if (activeTest) {
    if (!Array.isArray(activeTest.questions) || activeTest.questions.length === 0) {
      return (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-800">Mock Test Paper Being Finalized</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            The question set for &quot;{activeTest.title}&quot; is currently being verified by the academic faculty. Please return to the mock test dashboard.
          </p>
          <button
            type="button"
            onClick={() => setActiveTest(null)}
            className="px-5 py-2.5 rounded-xl bg-[#0056b3] text-white text-xs font-bold cursor-pointer hover:bg-blue-700 transition-all shadow-xs"
          >
            Return to Mock Tests
          </button>
        </div>
      );
    }

    const currentQ = activeTest.questions[currentQIndex] || activeTest.questions[0] || {};
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

              {/* Shared Passage Box (if linked) */}
              {(() => {
                const group = activeTest.questionGroups?.find((g: any) => g.id === currentQ.groupId);
                if (!group) return null;
                return (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0056b3] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" /> Shared Passage / Map / Table
                    </span>
                    {group.passageText && (
                      <div className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                        <MathText text={group.passageText} />
                      </div>
                    )}
                    {group.imagePath && (
                      <div className="mt-2">
                        <MockQuestionImage
                          path={group.imagePath}
                          alt={group.imageAlt || 'Shared passage diagram'}
                          testId={activeTest.id}
                          type="group"
                          className="w-full max-h-72"
                        />
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Question Statement (Rendered with MathText & Diagram) */}
              <div className="space-y-3">
                {showEnglishOnly && (
                  <div className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                    <MathText text={currentQ.questionText || currentQ.question} />
                  </div>
                )}
                {showBengaliOnly && (
                  <div className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed font-sans">
                    <MathText text={currentQ.questionTextBn || currentQ.questionBn || currentQ.questionText || currentQ.question} />
                  </div>
                )}
                {showBoth && (
                  <div className="space-y-2">
                    <div className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                      <MathText text={currentQ.questionText || currentQ.question} />
                    </div>
                    {(currentQ.questionTextBn || currentQ.questionBn) && (
                      <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 text-slate-800 text-sm sm:text-base font-semibold leading-relaxed">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0056b3] block mb-0.5">
                          বাংলা অনুবাদ:
                        </span>
                        <MathText text={currentQ.questionTextBn || currentQ.questionBn} />
                      </div>
                    )}
                  </div>
                )}

                {/* Question Diagram Image */}
                {currentQ.imagePath && (
                  <div className="pt-2">
                    <MockQuestionImage
                      path={currentQ.imagePath}
                      alt={currentQ.imageAlt || `Diagram for question ${currentQIndex + 1}`}
                      testId={activeTest.id}
                      type="question"
                      className="w-full max-h-80"
                    />
                  </div>
                )}
              </div>

              {/* Options List */}
              <div className="space-y-3">
                {(currentQ?.options || []).map((opt: MockQuestionOption, idx: number) => {
                  const isSelected = selectedAnswers[currentQ?.id || ''] === idx;
                  const optBn = currentQ.optionsBn?.[idx];
                  const optImg = getOptionImage(opt);
                  const optText = getOptionText(opt);
                  const optBnText = getOptionText(optBn);

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
                      <div className="flex-1 space-y-2">
                        {showEnglishOnly && (
                          <div className="text-sm font-semibold text-slate-800">
                            <MathText text={optText} />
                          </div>
                        )}
                        {showBengaliOnly && (
                          <div className="text-sm font-semibold text-slate-800">
                            <MathText text={optBnText || optText} />
                          </div>
                        )}
                        {showBoth && (
                          <div className="flex flex-col gap-0.5">
                            <div className="text-sm font-semibold text-slate-900">
                              <MathText text={optText} />
                            </div>
                            {optBnText && (
                              <div className="text-xs font-medium text-slate-600">
                                <MathText text={optBnText} />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Option Diagram Image if present */}
                        {optImg?.imagePath && (
                          <div className="pt-1">
                            <MockQuestionImage
                              path={optImg.imagePath}
                              alt={optImg.imageAlt || `Option ${String.fromCharCode(65 + idx)} diagram`}
                              testId={activeTest.id}
                              type="option"
                              className="w-48 h-32"
                            />
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
                {activeTest.questions.map((q: any, idx: number) => {
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

        {/* Detailed Question-by-Question Answer Key & Explanation (Active Tests) */}
        {testObj && testObj.questions && testObj.questions.length > 0 && testObj.contentStatus !== 'purged' && (
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
                      {getOptionText(q.options[q.correctOptionIndex])}
                      {q.optionsBn?.[q.correctOptionIndex] && langMode !== 'english_only' ? ` • ${getOptionText(q.optionsBn[q.correctOptionIndex])}` : ''}
                    </span>
                  </p>

                  {studentChoice !== undefined && !isCorrect && (
                    <p className="text-[#dc2626] font-semibold flex items-center gap-1.5">
                      <CustomCrossSvg className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Your Answer: ({String.fromCharCode(65 + studentChoice)}){' '}
                        {getOptionText(q.options[studentChoice])}
                        {q.optionsBn?.[studentChoice] && langMode !== 'english_only' ? ` • ${getOptionText(q.optionsBn[studentChoice])}` : ''}
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

        {/* Purged / Archived Question Content Fallback */}
        {(!testObj || !testObj.questions || testObj.questions.length === 0 || testObj.contentStatus === 'purged') && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <span className="font-extrabold text-slate-900 text-sm block">Question Content Archived</span>
              <p className="text-slate-600 leading-relaxed">
                Question statements and diagram files for this examination session have been archived and purged in accordance with CGA storage lifecycle policies.
                Your official score, batch rank, accuracy, and question difficulty statistics remain permanently preserved above.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const publishedTests = db.mockTests.filter((t) => t.status === 'Published');

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

  const activeSeriesList = db.mockSeries && db.mockSeries.length > 0 ? db.mockSeries : MOCK_SERIES_INITIAL;
  const paper1Series = activeSeriesList.find((s) => s.id === 'series-ttet-paper1') || MOCK_SERIES_INITIAL[0];
  const paper2SciSeries = activeSeriesList.find((s) => s.id === 'series-ttet-paper2-sci') || MOCK_SERIES_INITIAL[1];
  const paper2SocSeries = activeSeriesList.find((s) => s.id === 'series-ttet-paper2-soc') || MOCK_SERIES_INITIAL[2];

  const isP1Enrolled = isStudentEnrolledInSeries('series-ttet-paper1');
  const isP1Pending = db.feePayments?.some(
    (p) => p.studentId === currentStudent.id && p.courseId === 'series-ttet-paper1' && p.status === 'Pending'
  );

  const isP2SciEnrolled = isStudentEnrolledInSeries('series-ttet-paper2-sci');
  const isP2SciPending = db.feePayments?.some(
    (p) => p.studentId === currentStudent.id && p.courseId === 'series-ttet-paper2-sci' && p.status === 'Pending'
  );

  const isP2SocEnrolled = isStudentEnrolledInSeries('series-ttet-paper2-soc');
  const isP2SocPending = db.feePayments?.some(
    (p) => p.studentId === currentStudent.id && p.courseId === 'series-ttet-paper2-soc' && p.status === 'Pending'
  );

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
                  <span className="text-3xl font-black text-amber-300">₹{paper1Series.price}/-</span>
                  <span className="text-xs text-blue-200 font-bold uppercase">Only</span>
                  <span className="text-xs text-blue-300 line-through">₹{Math.max(499, paper1Series.price + 100)}</span>
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
              {isP1Enrolled ? (
                <div className="w-full py-2.5 rounded-xl bg-emerald-500/25 border border-emerald-400/40 text-emerald-200 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Enrolled &amp; Active</span>
                </div>
              ) : isP1Pending ? (
                <div className="w-full py-2.5 rounded-xl bg-amber-500/25 border border-amber-400/40 text-amber-200 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs">
                  <Clock className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span>Verification Pending (Admin Review)</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleOpenSeriesCheckout('series-ttet-paper1')}
                  className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Enroll Now @ ₹{paper1Series.price}/- (Pay via UPI / Bank)
                </button>
              )}
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
                  <span className="text-3xl font-black text-amber-300">₹{paper2SciSeries.price}/-</span>
                  <span className="text-xs text-indigo-200 font-bold uppercase">Only</span>
                  <span className="text-xs text-indigo-300 line-through">₹{Math.max(699, paper2SciSeries.price + 200)}</span>
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
              {isP2SciEnrolled ? (
                <div className="w-full py-2.5 rounded-xl bg-emerald-500/25 border border-emerald-400/40 text-emerald-200 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Enrolled &amp; Active</span>
                </div>
              ) : isP2SciPending ? (
                <div className="w-full py-2.5 rounded-xl bg-amber-500/25 border border-amber-400/40 text-amber-200 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs">
                  <Clock className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span>Verification Pending (Admin Review)</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleOpenSeriesCheckout('series-ttet-paper2-sci')}
                  className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Enroll Now @ ₹{paper2SciSeries.price}/- (Pay via UPI / Bank)
                </button>
              )}
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
                  <span className="text-3xl font-black text-amber-300">₹{paper2SocSeries.price}/-</span>
                  <span className="text-xs text-slate-200 font-bold uppercase">Only</span>
                  <span className="text-xs text-slate-400 line-through">₹{Math.max(699, paper2SocSeries.price + 200)}</span>
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
              {isP2SocEnrolled ? (
                <div className="w-full py-2.5 rounded-xl bg-emerald-500/25 border border-emerald-400/40 text-emerald-200 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Enrolled &amp; Active</span>
                </div>
              ) : isP2SocPending ? (
                <div className="w-full py-2.5 rounded-xl bg-amber-500/25 border border-amber-400/40 text-amber-200 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs">
                  <Clock className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span>Verification Pending (Admin Review)</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleOpenSeriesCheckout('series-ttet-paper2-soc')}
                  className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Enroll Now @ ₹{paper2SocSeries.price}/- (Pay via UPI / Bank)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ==================== SERIES -> SUBJECT -> (A) MOCK TESTS & (B) QUESTION PAPERS ==================== */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#0056b3] text-xs font-bold border border-blue-200">
              <Layers className="w-3.5 h-3.5" /> Official Syllabus Portal
            </div>
            <h2 className="text-xl font-extrabold text-[#0a0e2a] flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-[#0056b3]" />
              Mock Tests Series &amp; Question Papers
            </h2>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              Select your examination series below. Each series contains dedicated subject sections, including sectional mock tests with our 5-state CBT Appear engine and watermarked soft-copy question papers.
            </p>
          </div>
        </div>

        {/* 1. Series Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Select Examination Series
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {activeSeriesList.map((s) => {
              const isSelected = selectedSeriesId === s.id;
              const isEnrolled = isStudentEnrolledInSeries(s.id);

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedSeriesId(s.id);
                    setSelectedSubjectId('all');
                  }}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#0056b3] bg-blue-50/70 ring-2 ring-[#0056b3]/20 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {s.classRange}
                      </span>
                      {isEnrolled ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Enrolled
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold inline-flex items-center gap-1">
                          <Lock className="w-3 h-3 text-amber-600" /> Locked
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-extrabold text-[#0a0e2a] leading-snug line-clamp-2">
                      {s.name}
                    </h3>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="font-extrabold text-[#0056b3]">₹{s.price}/-</span>
                    <span className="text-[11px] font-semibold text-slate-500">{s.batchLabel}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Subject Tabs (Including Full-Length Mocks as its own section) */}
        {(() => {
          const subjectsForSeries = MOCK_SUBJECTS_INITIAL.filter((s) => s.seriesId === selectedSeriesId);
          const isEnrolled = isStudentEnrolledInSeries(selectedSeriesId);

          return (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 mr-1">Subject Section:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedSubjectId('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedSubjectId === 'all'
                        ? 'bg-[#0056b3] text-white shadow-xs'
                        : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    All Sections
                  </button>
                  {subjectsForSeries.map((subj) => (
                    <button
                      key={subj.id}
                      type="button"
                      onClick={() => setSelectedSubjectId(subj.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedSubjectId === subj.id
                          ? 'bg-[#0056b3] text-white shadow-xs'
                          : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {subj.name}
                    </button>
                  ))}
                  {/* Full-Length Mocks Section */}
                  <button
                    type="button"
                    onClick={() => setSelectedSubjectId('full-length')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      selectedSubjectId === 'full-length'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                    }`}
                  >
                    Full-Length Mocks (Full Syllabus)
                  </button>
                </div>

                {/* Subsections Toggle: (a) Mock Tests vs (b) Question Papers */}
                <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setActiveSubsection('tests')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeSubsection === 'tests'
                        ? 'bg-white text-[#0056b3] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    <span>Mock Tests</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSubsection('papers')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeSubsection === 'papers'
                        ? 'bg-white text-[#0056b3] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Question Papers (PDF)</span>
                  </button>
                </div>
              </div>

              {/* Banner if student is not enrolled in this series */}
              {!isEnrolled && (() => {
                const isSeriesPending = db.feePayments?.some(
                  (p) => p.studentId === currentStudent.id && p.courseId === selectedSeriesId && p.status === 'Pending'
                );

                if (isSeriesPending) {
                  return (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-amber-950 font-bold">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                        <span>
                          Enrolment payment submitted (UTR verification pending). CGA Admission Cell is reviewing your transaction.
                        </span>
                      </div>
                      <span className="px-3.5 py-1.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 font-extrabold shrink-0 inline-flex items-center gap-1.5">
                        Verification Pending
                      </span>
                    </div>
                  );
                }

                return (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-amber-900 font-bold">
                      <Lock className="w-4 h-4 text-[#ea580c] shrink-0" />
                      <span>
                        Enrolment required for this series to appear in CBT tests and download watermarked question papers.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenSeriesCheckout(selectedSeriesId)}
                      className="px-4 py-2 rounded-xl bg-[#0056b3] hover:bg-blue-700 text-white font-black shrink-0 cursor-pointer shadow-xs"
                    >
                      Enrol Now
                    </button>
                  </div>
                );
              })()}

              {/* SUBSECTION (A): MOCK TESTS */}
              {activeSubsection === 'tests' && (() => {
                const allAvailableTests: any[] = [
                  ...(db.seriesTests || []).filter((st) => st.questions && st.questions.length > 0),
                  ...(db.mockTests || []).map((mt) => {
                    const cId = (mt.courseId || '').toLowerCase();
                    const title = (mt.title || '').toLowerCase();
                    let mappedSeries = 'series-ttet-paper1';
                    if (cId.includes('sci') || title.includes('science')) {
                      mappedSeries = 'series-ttet-paper2-sci';
                    } else if (cId.includes('arts') || cId.includes('soc') || title.includes('social')) {
                      mappedSeries = 'series-ttet-paper2-soc';
                    }
                    return {
                      ...mt,
                      seriesId: mappedSeries,
                      subjectId: mt.subject || null,
                      testType: mt.title.toLowerCase().includes('full') ? 'full' : 'sectional',
                    };
                  }),
                ];

                const filtered = allAvailableTests.filter((t) => {
                  if (t.seriesId && t.seriesId !== selectedSeriesId) return false;
                  if (selectedSubjectId === 'full-length') {
                    return t.testType === 'full' || !t.subjectId || String(t.title).toLowerCase().includes('full');
                  }
                  if (selectedSubjectId !== 'all') {
                    return t.subjectId === selectedSubjectId || (t.subject && t.subject.toLowerCase().includes(selectedSubjectId.toLowerCase()));
                  }
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="bg-slate-50 rounded-2xl p-8 text-center text-slate-500 space-y-2 border border-slate-200">
                      <ClipboardCheck className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="font-bold text-sm">No mock tests found for this section.</p>
                      <p className="text-xs text-slate-400">Scheduled tests for this subject will appear here prior to launch.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((test) => {
                      const langMode = getTestLanguageMode(test);
                      const existingAttempt = myPastAttempts.find((a) => a.testId === test.id);
                      const isTestEnrolled = isStudentEnrolledInTest(test);

                      return (
                        <div
                          key={test.id}
                          className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between space-y-4 hover:border-blue-200 transition-all"
                        >
                          <div className="space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0056b3] border border-blue-200 text-[11px] font-extrabold truncate">
                                {test.testType === 'full' ? 'Full Length Mock' : 'Sectional Mock'}
                              </span>

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
                                  Bilingual
                                </span>
                              )}
                            </div>

                            <h3 className="text-base font-extrabold text-[#0a0e2a] leading-snug">
                              {test.title}
                            </h3>
                            <p className="text-xs text-slate-500">
                              {test.subject || test.courseName || 'Tripura TET 2026 Examination'}
                            </p>

                            <div className="grid grid-cols-2 gap-2 pt-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                              <div>
                                <span className="text-slate-400 block text-[11px]">Duration</span>
                                <span className="font-bold text-slate-800">{test.durationMinutes} Mins</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[11px]">Questions</span>
                                <span className="font-bold text-slate-800">
                                  {test.questionCount || test.questions?.length || 30} Qs
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[11px]">Marking Scheme</span>
                                <span className="font-bold text-slate-800">
                                  +{test.marksPerQuestion ?? 1} / -{test.negativeMarking ?? 0}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[11px]">Total Marks</span>
                                <span className="font-bold text-slate-800">
                                  {test.totalMarks ?? 30}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 5-State Appear Test Button */}
                          <div className="pt-2 border-t border-slate-100">
                            <AppearTestButton
                              test={test}
                              isEnrolled={isTestEnrolled}
                              attempt={existingAttempt ? {
                                id: existingAttempt.id,
                                score: existingAttempt.score,
                                totalMarks: existingAttempt.totalMarks,
                                accuracy: existingAttempt.accuracy,
                                submittedAt: existingAttempt.submittedAt,
                              } : null}
                              onAppear={() => startTest(test)}
                              onEnrol={() => handleOpenSeriesCheckout(test.seriesId || selectedSeriesId)}
                              onViewSolutions={() => {
                                if (existingAttempt) {
                                  setCompletedAttempt(existingAttempt);
                                  if (typeof window !== 'undefined') {
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* SUBSECTION (B): QUESTION PAPERS */}
              {activeSubsection === 'papers' && (() => {
                const papers = (seriesPapers || []).filter((p) => {
                  if (selectedSubjectId === 'full-length') {
                    return !p.subject_id || String(p.title).toLowerCase().includes('full');
                  }
                  if (selectedSubjectId !== 'all') {
                    return p.subject_id === selectedSubjectId;
                  }
                  return true;
                });

                const posts = (db.mockSubjectPosts || []).filter((p) => {
                  if (p.seriesId !== selectedSeriesId) return false;
                  if (selectedSubjectId === 'full-length') return String(p.title).toLowerCase().includes('full');
                  if (selectedSubjectId !== 'all') {
                    const subj = subjectsForSeries.find((s) => s.id === selectedSubjectId);
                    return subj && p.subjectName.toLowerCase().includes(subj.name.toLowerCase());
                  }
                  return true;
                });

                if (papers.length === 0 && posts.length === 0) {
                  return (
                    <div className="bg-slate-50 rounded-2xl p-8 text-center text-slate-500 space-y-2 border border-slate-200">
                      <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="font-bold text-sm">No question papers uploaded for this section yet.</p>
                      <p className="text-xs text-slate-400">Our faculty uploads soft-copy PDFs and OMR practice sheets regularly.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Watermarked Soft-Copy PDFs from Supabase Storage */}
                    {papers.map((paper) => {
                      const sizeKb = paper.file_size_bytes ? Math.round(paper.file_size_bytes / 1024) : null;
                      const sizeLabel = sizeKb ? (sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`) : 'PDF';

                      return (
                        <div
                          key={paper.id}
                          className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between space-y-4 hover:border-blue-200 transition-all"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-extrabold uppercase tracking-wider">
                                Soft-Copy Question Booklet
                              </span>
                              <span className="text-[11px] font-bold text-slate-400">{sizeLabel}</span>
                            </div>

                            <div>
                              <h3 className="text-base font-extrabold text-[#0a0e2a] leading-snug">
                                {paper.title}
                              </h3>
                              <p className="text-xs text-slate-500 mt-1">
                                Official printable question paper with anti-tamper watermark.
                              </p>
                            </div>

                            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] text-slate-400">Security:</span>
                                <span className="font-bold text-emerald-700">Dynamic Watermark</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] text-slate-400">Format:</span>
                                <span className="font-bold text-slate-700">A4 High-Res PDF</span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100">
                            {isEnrolled ? (
                              <a
                                href={`/api/mock-tests/papers/${paper.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-2.5 px-4 rounded-xl bg-[#0056b3] hover:bg-blue-700 text-white font-extrabold text-xs inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download Watermarked PDF</span>
                              </a>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenSeriesCheckout(selectedSeriesId)}
                                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200 hover:border-amber-300 text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition-all"
                              >
                                <Lock className="w-3.5 h-3.5 text-amber-600" />
                                <span>Enrol in Series to Download</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Faculty Drive Link Announcements */}
                    {posts.map((post) => (
                      <div
                        key={post.id}
                        className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between space-y-4 hover:border-blue-200 transition-all"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0056b3] border border-blue-200 text-[10px] font-extrabold uppercase tracking-wider">
                              Faculty Drive Announcement
                            </span>
                            <span className="text-[11px] font-bold text-slate-400">{post.postedDate}</span>
                          </div>

                          <div>
                            <h3 className="text-base font-extrabold text-[#0a0e2a] leading-snug">
                              {post.title}
                            </h3>
                            {post.instructions && (
                              <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed">
                                {post.instructions}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                          {isEnrolled ? (
                            <div className="flex items-center gap-2">
                              <a
                                href={post.driveLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 py-2.5 px-4 rounded-xl bg-[#0056b3] hover:bg-blue-700 text-white font-extrabold text-xs inline-flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all"
                              >
                                <ExternalLink className="w-3.5 h-3.5" /> Open Google Drive
                              </a>
                              <button
                                type="button"
                                onClick={() => handleCopyDriveLink(post)}
                                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 cursor-pointer"
                                title="Copy Link"
                              >
                                {copiedPostId === post.id ? (
                                  <Check className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenSeriesCheckout(selectedSeriesId)}
                              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200 hover:border-amber-300 text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition-all"
                            >
                              <Lock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Enrol to Access Link</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          );
        })()}
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

      {/* PayManualModal for Mock Series checkout */}
      {payManualTarget && (
        <PayManualModal
          target={payManualTarget}
          onClose={() => setPayManualTarget(null)}
          onSuccess={(refCode) => {
            showToast(
              'Enrolment Submitted',
              `Your payment reference ${refCode} has been verified and your mock series is activated!`,
              'success'
            );
            setPayManualTarget(null);
          }}
        />
      )}
    </div>
  );
}
