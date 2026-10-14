export interface MockSeries {
  id: string;
  slug: string;
  name: string;
  classRange: string;
  stream: string;
  price: number;
  batchLabel: string;
  description: string;
  highlights: string[];
  status: 'Open' | 'Closed' | 'Archived';
  startsOn: string;
}

export interface MockSubject {
  id: string;
  seriesId: string;
  name: string;
  sortOrder: number;
}

export interface SeriesMockTest {
  id: string;
  seriesId: string;
  subjectId: string | null;
  testType: 'sectional' | 'full';
  title: string;
  testNo: number;
  questionCount: number;
  totalMarks: number;
  marksPerQuestion: number;
  negativeMarking: number;
  durationMinutes: number;
  status: 'draft' | 'ready' | 'launched' | 'closed';
  windowStart?: string | null;
  windowEnd?: string | null;
  windowHours?: number | null;
  showSolutions: 'after_submit' | 'after_window';
  shuffle: boolean;
  questions?: SeriesQuestion[];
}

export interface SeriesQuestion {
  id: string;
  testId: string;
  position: number;
  questionText: string;
  options: [string, string, string, string];
  questionTextBn?: string;
  optionsBn?: [string, string, string, string];
}

export interface SeriesQuestionKey {
  questionId: string;
  correctOption: number;
  explanation: string;
  explanationBn?: string;
}

export interface SeriesEnrollment {
  id: string;
  studentId: string;
  seriesId: string;
  paymentId?: string;
  enrolledAt: string;
}

export interface SeriesAttempt {
  id: string;
  testId: string;
  studentId: string;
  studentName?: string;
  studentCode?: string;
  studentPhone?: string;
  startedAt: string;
  submittedAt?: string | null;
  answers: Record<string, number>;
  score: number;
  correctCount: number;
  wrongCount: number;
  unattemptedCount: number;
  accuracy: number;
  timeTakenSeconds: number;
  rank?: number | null;
}

export interface MockLaunchLog {
  id: string;
  testId: string;
  adminId: string;
  action: string;
  windowStart?: string | null;
  windowEnd?: string | null;
  createdAt: string;
}

const COMMON_HIGHLIGHTS = [
  'Real Exam CBT Interface with Live Countdown Timer',
  'Instant Analysis (Accuracy, Time per Question, Weak-Spot Identification)',
  '100% Strict TRBT Syllabus & Question Standards',
  'Bilingual Support (English and Bengali)',
  'No Negative Marking (Standard 1 Mark per Question)',
  '30 MCQs / 30 Marks / 30 Mins Sectionals + 2 Full-Length 150-Mark Simulations'
];

export const MOCK_SERIES_INITIAL: MockSeries[] = [
  {
    id: 'series-ttet-paper1',
    slug: 't-tet-paper-1',
    name: 'T-TET Paper-I (For Classes I to V – Primary Level)',
    classRange: 'Classes I to V (Primary Level)',
    stream: 'Primary Education',
    price: 499,
    batchLabel: 'NOV 2026',
    description: 'Comprehensive online mock test package for Tripura TET Paper-I with 50 topic-wise sectional tests and 2 full-length simulated exam papers following strict TRBT guidelines.',
    highlights: COMMON_HIGHLIGHTS,
    status: 'Open',
    startsOn: '1st Week of November, 2026',
  },
  {
    id: 'series-ttet-paper2-sci',
    slug: 't-tet-paper-2-science',
    name: 'T-TET Paper-II: Science Stream (For Classes VI to VIII)',
    classRange: 'Classes VI to VIII (Upper Primary)',
    stream: 'Science & Mathematics',
    price: 499,
    batchLabel: 'NOV 2026',
    description: 'Targeted preparation for Tripura TET Paper-II Science Stream featuring 50 sectional tests covering Science, Math & Pedagogy, plus 2 complete full-length TRBT pattern mock tests.',
    highlights: COMMON_HIGHLIGHTS,
    status: 'Open',
    startsOn: '1st Week of November, 2026',
  },
  {
    id: 'series-ttet-paper2-soc',
    slug: 't-tet-paper-2-social-science',
    name: 'T-TET Paper-II: Social Science Stream (For Classes VI to VIII)',
    classRange: 'Classes VI to VIII (Upper Primary)',
    stream: 'Social Science & Studies',
    price: 499,
    batchLabel: 'NOV 2026',
    description: 'Specialized 60-sectional test package for Tripura TET Paper-II Social Studies including in-depth Tripura Geography, History, and Civics, plus 2 full-length 150-mark simulations.',
    highlights: COMMON_HIGHLIGHTS,
    status: 'Open',
    startsOn: '1st Week of November, 2026',
  },
];

export const MOCK_SUBJECTS_INITIAL: MockSubject[] = [
  // Paper-I Subjects
  { id: 'subj-p1-cdp', seriesId: 'series-ttet-paper1', name: 'Child Development & Pedagogy', sortOrder: 1 },
  { id: 'subj-p1-lang1', seriesId: 'series-ttet-paper1', name: 'Language – I (English)', sortOrder: 2 },
  { id: 'subj-p1-lang2', seriesId: 'series-ttet-paper1', name: 'Language – II (Bengali / Kokborok)', sortOrder: 3 },
  { id: 'subj-p1-math', seriesId: 'series-ttet-paper1', name: 'Mathematics (Content & Pedagogy)', sortOrder: 4 },
  { id: 'subj-p1-evs', seriesId: 'series-ttet-paper1', name: 'Environmental Studies (EVS)', sortOrder: 5 },

  // Paper-II Science Subjects
  { id: 'subj-p2s-cdp', seriesId: 'series-ttet-paper2-sci', name: 'Child Development & Pedagogy', sortOrder: 1 },
  { id: 'subj-p2s-lang1', seriesId: 'series-ttet-paper2-sci', name: 'Language – I (English)', sortOrder: 2 },
  { id: 'subj-p2s-lang2', seriesId: 'series-ttet-paper2-sci', name: 'Language – II (Bengali / Kokborok)', sortOrder: 3 },
  { id: 'subj-p2s-math', seriesId: 'series-ttet-paper2-sci', name: 'Mathematics (Content & Pedagogy)', sortOrder: 4 },
  { id: 'subj-p2s-sci', seriesId: 'series-ttet-paper2-sci', name: 'Science (Physics, Chemistry, Bio & Pedagogy)', sortOrder: 5 },

  // Paper-II Social Science Subjects
  { id: 'subj-p2ss-cdp', seriesId: 'series-ttet-paper2-soc', name: 'Child Development & Pedagogy', sortOrder: 1 },
  { id: 'subj-p2ss-lang1', seriesId: 'series-ttet-paper2-soc', name: 'Language – I (English)', sortOrder: 2 },
  { id: 'subj-p2ss-lang2', seriesId: 'series-ttet-paper2-soc', name: 'Language – II (Bengali / Kokborok)', sortOrder: 3 },
  { id: 'subj-p2ss-hist', seriesId: 'series-ttet-paper2-soc', name: 'History, Political Science & Pedagogical Issues', sortOrder: 4 },
  { id: 'subj-p2ss-geog', seriesId: 'series-ttet-paper2-soc', name: 'Geography & Environment (incl. Tripura Geography)', sortOrder: 5 },
];

// Helper to generate the 166 tests dynamically
function generateInitialTests(): SeriesMockTest[] {
  const tests: SeriesMockTest[] = [];

  // 1. Paper-I (5 subjects x 10 sectionals = 50 + 2 Full)
  const p1Subjs = MOCK_SUBJECTS_INITIAL.filter(s => s.seriesId === 'series-ttet-paper1');
  for (const subj of p1Subjs) {
    for (let i = 1; i <= 10; i++) {
      tests.push({
        id: `test-${subj.id}-${i}`,
        seriesId: 'series-ttet-paper1',
        subjectId: subj.id,
        testType: 'sectional',
        title: `${subj.name} - Mock ${i}`,
        testNo: i,
        questionCount: 30,
        totalMarks: 30,
        marksPerQuestion: 1,
        negativeMarking: 0,
        durationMinutes: 30,
        status: 'draft',
        showSolutions: 'after_window',
        shuffle: false,
      });
    }
  }
  for (let f = 1; f <= 2; f++) {
    tests.push({
      id: `test-series-ttet-paper1-full-${f}`,
      seriesId: 'series-ttet-paper1',
      subjectId: null,
      testType: 'full',
      title: `T-TET Paper-I Full-Length Mock ${f}`,
      testNo: f,
      questionCount: 150,
      totalMarks: 150,
      marksPerQuestion: 1,
      negativeMarking: 0,
      durationMinutes: 150,
      status: 'draft',
      showSolutions: 'after_window',
      shuffle: false,
    });
  }

  // 2. Paper-II Science (5 subjects x 10 sectionals = 50 + 2 Full)
  const p2sSubjs = MOCK_SUBJECTS_INITIAL.filter(s => s.seriesId === 'series-ttet-paper2-sci');
  for (const subj of p2sSubjs) {
    for (let i = 1; i <= 10; i++) {
      tests.push({
        id: `test-${subj.id}-${i}`,
        seriesId: 'series-ttet-paper2-sci',
        subjectId: subj.id,
        testType: 'sectional',
        title: `${subj.name} - Mock ${i}`,
        testNo: i,
        questionCount: 30,
        totalMarks: 30,
        marksPerQuestion: 1,
        negativeMarking: 0,
        durationMinutes: 30,
        status: 'draft',
        showSolutions: 'after_window',
        shuffle: false,
      });
    }
  }
  for (let f = 1; f <= 2; f++) {
    tests.push({
      id: `test-series-ttet-paper2-sci-full-${f}`,
      seriesId: 'series-ttet-paper2-sci',
      subjectId: null,
      testType: 'full',
      title: `T-TET Paper-II Science Full-Length Mock ${f}`,
      testNo: f,
      questionCount: 150,
      totalMarks: 150,
      marksPerQuestion: 1,
      negativeMarking: 0,
      durationMinutes: 150,
      status: 'draft',
      showSolutions: 'after_window',
      shuffle: false,
    });
  }

  // 3. Paper-II Social Science (CDP 10, Lang1 10, Lang2 10, Hist 20, Geog 10 = 60 + 2 Full)
  const p2ssSubjs = MOCK_SUBJECTS_INITIAL.filter(s => s.seriesId === 'series-ttet-paper2-soc');
  for (const subj of p2ssSubjs) {
    const count = subj.id === 'subj-p2ss-hist' ? 20 : 10;
    for (let i = 1; i <= count; i++) {
      tests.push({
        id: `test-${subj.id}-${i}`,
        seriesId: 'series-ttet-paper2-soc',
        subjectId: subj.id,
        testType: 'sectional',
        title: `${subj.name} - Mock ${i}`,
        testNo: i,
        questionCount: 30,
        totalMarks: 30,
        marksPerQuestion: 1,
        negativeMarking: 0,
        durationMinutes: 30,
        status: 'draft',
        showSolutions: 'after_window',
        shuffle: false,
      });
    }
  }
  for (let f = 1; f <= 2; f++) {
    tests.push({
      id: `test-series-ttet-paper2-soc-full-${f}`,
      seriesId: 'series-ttet-paper2-soc',
      subjectId: null,
      testType: 'full',
      title: `T-TET Paper-II Social Science Full-Length Mock ${f}`,
      testNo: f,
      questionCount: 150,
      totalMarks: 150,
      marksPerQuestion: 1,
      negativeMarking: 0,
      durationMinutes: 150,
      status: 'draft',
      showSolutions: 'after_window',
      shuffle: false,
    });
  }

  return tests;
}

export const MOCK_SERIES_TESTS_INITIAL: SeriesMockTest[] = generateInitialTests();

// Sample seeded demo questions for test-subj-p1-cdp-1 to allow immediate interactive testing
export const SAMPLE_QUESTIONS_P1_CDP_1: { questions: SeriesQuestion[]; keys: SeriesQuestionKey[] } = {
  questions: [
    {
      id: 'q-cdp-1',
      testId: 'test-subj-p1-cdp-1',
      position: 1,
      questionText: 'According to Jean Piaget, during which stage does a child begin to think logically about concrete events?',
      options: [
        'Sensorimotor Stage',
        'Preoperational Stage',
        'Concrete Operational Stage',
        'Formal Operational Stage'
      ],
      questionTextBn: 'জ্যা পিয়াজের মতে, কোন স্তরে শিশু মূর্ত ঘটনার ওপর যৌক্তিকভাবে চিন্তা করতে শুরু করে?',
      optionsBn: [
        'সংবেদন-চালক স্তর',
        'প্রাক-সক্রিয়তার স্তর',
        'মূর্ত সক্রিয়তার স্তর',
        'যৌক্তিক সক্রিয়তার স্তর'
      ]
    },
    {
      id: 'q-cdp-2',
      testId: 'test-subj-p1-cdp-1',
      position: 2,
      questionText: 'The concept of Zone of Proximal Development (ZPD) was proposed by:',
      options: [
        'B.F. Skinner',
        'Lev Vygotsky',
        'Jerome Bruner',
        'Howard Gardner'
      ],
      questionTextBn: 'Zone of Proximal Development (ZPD)-এর ধারণাটি কে প্রস্তাব করেছিলেন?',
      optionsBn: [
        'বি. এফ. স্কিনার',
        'লেভ ভাইগটস্কি',
        'জেরোম ব্রুনার',
        'হাওয়ার্ড গার্ডনার'
      ]
    },
    {
      id: 'q-cdp-3',
      testId: 'test-subj-p1-cdp-1',
      position: 3,
      questionText: 'Which of the following is NOT a primary law of learning propounded by Thorndike?',
      options: [
        'Law of Readiness',
        'Law of Exercise',
        'Law of Effect',
        'Law of Insight'
      ],
      questionTextBn: 'নিচের কোনটি থর্নডাইক কর্তৃক প্রস্তাবিত শিখনের মুখ্য নিয়ম নয়?',
      optionsBn: [
        'প্রস্তুতির নিয়ম',
        'অনুশীলনের নিয়ম',
        'ফলাফলের নিয়ম',
        'অন্তর্দৃষ্টির নিয়ম'
      ]
    }
  ],
  keys: [
    {
      questionId: 'q-cdp-1',
      correctOption: 2,
      explanation: 'In the Concrete Operational Stage (approx. 7–11 years), children gain the abilities to think logically about concrete events, understand conservation, and reversibility.',
      explanationBn: 'মূর্ত সক্রিয়তার স্তরে (প্রায় ৭–১১ বছর) শিশুরা বাস্তব ঘটনার যৌক্তিক বিচার ও সংরক্ষণের ধারণা অর্জন করে।'
    },
    {
      questionId: 'q-cdp-2',
      correctOption: 1,
      explanation: 'Lev Vygotsky introduced ZPD, defining the difference between what a learner can do without help and what they can achieve with guidance.',
      explanationBn: 'লেভ ভাইগটস্কি ZPD বা নিকটবর্তী বিকাশের সীমানা ধারণাটি প্রদান করেন।'
    },
    {
      questionId: 'q-cdp-3',
      correctOption: 3,
      explanation: 'Thorndike formulated three primary laws: Readiness, Exercise, and Effect. The Law of Insight was formulated by Gestalt psychologists (Köhler, Wertheimer).',
      explanationBn: 'থর্নডাইকের তিনটি প্রাথমিক নিয়ম হলো প্রস্তুতি, অনুশীলন এবং ফলাফল। অন্তর্দৃষ্টির তত্ত্ব গেস্টাল্টবাদীদের।'
    }
  ]
};
