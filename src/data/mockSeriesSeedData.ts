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
  scheduledDate?: string;
  languageMode?: 'english_only' | 'bengali_only' | 'bilingual';
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

/**
 * Determine question language rule for a subject:
 * - English subject -> English questions only
 * - Bengali subject -> Bengali questions only
 * - All other subjects -> Bilingual (English + Bengali)
 */
export function getSubjectLanguageMode(subjectName: string): 'english_only' | 'bengali_only' | 'bilingual' {
  const norm = subjectName.toLowerCase();
  if (norm.includes('bengali') || norm.includes('বাংলা') || norm.includes('lang2') || norm.includes('language – ii') || norm.includes('language - ii')) {
    return 'bengali_only';
  }
  if (norm.includes('english') || norm.includes('lang1') || /\blanguage\s*[-–]\s*i\b/i.test(norm)) {
    return 'english_only';
  }
  return 'bilingual';
}

export const MOCK_SERIES_INITIAL: MockSeries[] = [
  {
    id: 'series-ttet-paper1',
    slug: 't-tet-paper-1',
    name: 'Tripura TET: Paper-I 2026 Daily Online Mock Tests Series',
    classRange: 'Classes I to V (Primary Level)',
    stream: 'Primary Education (CDP, English, Bengali, Math & EVS)',
    price: 399,
    batchLabel: '2026 Batch',
    description: 'Daily Online Mock Tests Series for Tripura TET: Paper-I 2026. Weekly 5 Days (Monday to Friday). Features 30+ Sectional Mock Tests (CDP, English, Bengali, Math & EVS) and 02 Full Length Mock Tests with 1200+ MCQs, OMR Sheet for practice, self performance analysis, expert guidance, and doubt clearance through discussion.',
    highlights: [
      'Weekly 5 Days (Monday to Friday) Online Practice',
      '30+ Sectional Mock Tests (CDP, English, Bengali, Math & EVS)',
      '02 Full Length Mock Tests (Covering Full Syllabus)',
      '1200+ MCQs with OMR Sheet for Practice',
      'Self Performance Analysis & Merit Ranking',
      'Expert\'s Guidance & Doubt Clearance through Discussion',
      'Bilingual Questions in English & Bengali (except English & Bengali language papers)',
      'Flexible Admin Scheduled Launch Dates'
    ],
    status: 'Open',
    startsOn: 'Flexible / Admin Scheduled (Launch on Demand)',
  },
  {
    id: 'series-ttet-paper2-sci',
    slug: 't-tet-paper-2-science',
    name: 'Tripura TET: Paper-II (Science) 2026 Daily Online Mock Tests Series',
    classRange: 'Classes VI to VIII (Upper Primary)',
    stream: 'Science & Mathematics (CDP, English, Bengali, Maths & Science)',
    price: 499,
    batchLabel: '2026 Batch',
    description: 'Daily Online Mock Tests Series for Tripura TET: Paper-II (Science) 2026. Weekly 5 Days (Monday to Friday). Features 40+ Sectional Mock Tests (CDP, English, Bengali, Maths & Science) and 02 Full Length Mock Tests with 1500+ MCQs, OMR Sheet for practice, self performance analysis, expert guidance, and doubt clearance through discussion.',
    highlights: [
      'Weekly 5 Days (Monday to Friday) Online Practice',
      '40+ Sectional Mock Tests (CDP, English, Bengali, Maths & Science)',
      '02 Full Length Mock Tests (Covering Full Syllabus)',
      '1500+ MCQs with OMR Sheet for Practice',
      'Self Performance Analysis & Merit Ranking',
      'Expert\'s Guidance & Doubt Clearance through Discussion',
      'Bilingual Questions in English & Bengali (except English & Bengali language papers)',
      'Flexible Admin Scheduled Launch Dates'
    ],
    status: 'Open',
    startsOn: 'Flexible / Admin Scheduled (Launch on Demand)',
  },
  {
    id: 'series-ttet-paper2-soc',
    slug: 't-tet-paper-2-social-science',
    name: 'Tripura TET: Paper-II (Social Studies) 2026 Daily Online Mock Tests Series',
    classRange: 'Classes VI to VIII (Upper Primary)',
    stream: 'Social Studies (CDP, English, Bengali, History, Geography & Political Science)',
    price: 499,
    batchLabel: '2026 Batch',
    description: 'Daily Online Mock Tests Series for Tripura TET: Paper-II (Social Studies) 2026. Weekly 5 Days (Monday to Friday). Features 40+ Sectional Mock Tests (CDP, English, Bengali, History, Geography & Political Science) and 02 Full Length Mock Tests with 1500+ MCQs, OMR Sheet for practice, self performance analysis, expert guidance, and doubt clearance.',
    highlights: [
      'Weekly 5 Days (Monday to Friday) Online Practice',
      '40+ Sectional Mock Tests (CDP, English, Bengali, History, Geography & Political Science)',
      '02 Full Length Mock Tests (Covering Full Syllabus)',
      '1500+ MCQs with OMR Sheet for Practice',
      'Self Performance Analysis & Merit Ranking',
      'Expert\'s Guidance & Doubt Clearance through Discussion',
      'Bilingual Questions in English & Bengali (except English & Bengali language papers)',
      'Flexible Admin Scheduled Launch Dates'
    ],
    status: 'Open',
    startsOn: 'Flexible / Admin Scheduled (Launch on Demand)',
  },
];

export const MOCK_SUBJECTS_INITIAL: MockSubject[] = [
  // Paper-I Subjects (Banner 1: CDP, ENGLISH, BENGALI, MATH, EVS)
  { id: 'subj-p1-cdp', seriesId: 'series-ttet-paper1', name: 'Child Development & Pedagogy', sortOrder: 1 },
  { id: 'subj-p1-lang1', seriesId: 'series-ttet-paper1', name: 'Language – I (English)', sortOrder: 2 },
  { id: 'subj-p1-lang2', seriesId: 'series-ttet-paper1', name: 'Language – II (Bengali)', sortOrder: 3 },
  { id: 'subj-p1-math', seriesId: 'series-ttet-paper1', name: 'Mathematics (Content & Pedagogy)', sortOrder: 4 },
  { id: 'subj-p1-evs', seriesId: 'series-ttet-paper1', name: 'Environmental Studies (EVS)', sortOrder: 5 },

  // Paper-II Science Subjects (Banner 2: CDP, ENGLISH, BENGALI, MATHS & SCIENCE)
  { id: 'subj-p2s-cdp', seriesId: 'series-ttet-paper2-sci', name: 'Child Development & Pedagogy', sortOrder: 1 },
  { id: 'subj-p2s-lang1', seriesId: 'series-ttet-paper2-sci', name: 'Language – I (English)', sortOrder: 2 },
  { id: 'subj-p2s-lang2', seriesId: 'series-ttet-paper2-sci', name: 'Language – II (Bengali)', sortOrder: 3 },
  { id: 'subj-p2s-math', seriesId: 'series-ttet-paper2-sci', name: 'Mathematics (Content & Pedagogy)', sortOrder: 4 },
  { id: 'subj-p2s-sci', seriesId: 'series-ttet-paper2-sci', name: 'Science (Physics, Chemistry & Biology)', sortOrder: 5 },

  // Paper-II Social Studies Subjects (Banner 3: CDP, ENGLISH, BENGALI, HISTORY, GEOGRAPHY & POLITICAL SCIENCE)
  { id: 'subj-p2ss-cdp', seriesId: 'series-ttet-paper2-soc', name: 'Child Development & Pedagogy', sortOrder: 1 },
  { id: 'subj-p2ss-lang1', seriesId: 'series-ttet-paper2-soc', name: 'Language – I (English)', sortOrder: 2 },
  { id: 'subj-p2ss-lang2', seriesId: 'series-ttet-paper2-soc', name: 'Language – II (Bengali)', sortOrder: 3 },
  { id: 'subj-p2ss-hist', seriesId: 'series-ttet-paper2-soc', name: 'History & Pedagogical Issues', sortOrder: 4 },
  { id: 'subj-p2ss-geog', seriesId: 'series-ttet-paper2-soc', name: 'Geography & Environment', sortOrder: 5 },
  { id: 'subj-p2ss-pol', seriesId: 'series-ttet-paper2-soc', name: 'Political Science & Civics', sortOrder: 6 },
];

// Helper to generate the tests dynamically based on banners
function generateInitialTests(): SeriesMockTest[] {
  const tests: SeriesMockTest[] = [];

  // 1. Paper-I (5 subjects x 6 sectionals = 30 Sectional Mock Tests + 2 Full Length)
  const p1Subjs = MOCK_SUBJECTS_INITIAL.filter((s) => s.seriesId === 'series-ttet-paper1');
  for (const subj of p1Subjs) {
    const langMode = getSubjectLanguageMode(subj.name);
    for (let i = 1; i <= 6; i++) {
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
        status: i === 1 ? 'ready' : 'draft',
        languageMode: langMode,
        scheduledDate: new Date().toISOString().split('T')[0],
        showSolutions: 'after_submit',
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
      title: `Tripura TET Paper-I Full-Length Mock ${f}`,
      testNo: f,
      questionCount: 150,
      totalMarks: 150,
      marksPerQuestion: 1,
      negativeMarking: 0,
      durationMinutes: 150,
      status: 'ready',
      languageMode: 'bilingual',
      scheduledDate: new Date().toISOString().split('T')[0],
      showSolutions: 'after_submit',
      shuffle: false,
    });
  }

  // 2. Paper-II Science (5 subjects x 8 sectionals = 40 Sectional Mock Tests + 2 Full Length)
  const p2sSubjs = MOCK_SUBJECTS_INITIAL.filter((s) => s.seriesId === 'series-ttet-paper2-sci');
  for (const subj of p2sSubjs) {
    const langMode = getSubjectLanguageMode(subj.name);
    for (let i = 1; i <= 8; i++) {
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
        status: i === 1 ? 'ready' : 'draft',
        languageMode: langMode,
        scheduledDate: new Date().toISOString().split('T')[0],
        showSolutions: 'after_submit',
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
      title: `Tripura TET Paper-II (Science) Full-Length Mock ${f}`,
      testNo: f,
      questionCount: 150,
      totalMarks: 150,
      marksPerQuestion: 1,
      negativeMarking: 0,
      durationMinutes: 150,
      status: 'ready',
      languageMode: 'bilingual',
      scheduledDate: new Date().toISOString().split('T')[0],
      showSolutions: 'after_submit',
      shuffle: false,
    });
  }

  // 3. Paper-II Social Studies (6 subjects x 7 sectionals = 42 Sectional Mock Tests + 2 Full Length)
  const p2ssSubjs = MOCK_SUBJECTS_INITIAL.filter((s) => s.seriesId === 'series-ttet-paper2-soc');
  for (const subj of p2ssSubjs) {
    const langMode = getSubjectLanguageMode(subj.name);
    for (let i = 1; i <= 7; i++) {
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
        status: i === 1 ? 'ready' : 'draft',
        languageMode: langMode,
        scheduledDate: new Date().toISOString().split('T')[0],
        showSolutions: 'after_submit',
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
      title: `Tripura TET Paper-II (Social Studies) Full-Length Mock ${f}`,
      testNo: f,
      questionCount: 150,
      totalMarks: 150,
      marksPerQuestion: 1,
      negativeMarking: 0,
      durationMinutes: 150,
      status: 'ready',
      languageMode: 'bilingual',
      scheduledDate: new Date().toISOString().split('T')[0],
      showSolutions: 'after_submit',
      shuffle: false,
    });
  }

  return tests;
}

export const MOCK_SERIES_TESTS_INITIAL: SeriesMockTest[] = generateInitialTests();

// Sample seeded demo questions for test-subj-p1-cdp-1 (Bilingual: English + Bengali)
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

// Sample seeded demo questions for test-subj-p1-lang1-1 (English ONLY - no Bengali translations)
export const SAMPLE_QUESTIONS_P1_LANG1_1: { questions: SeriesQuestion[]; keys: SeriesQuestionKey[] } = {
  questions: [
    {
      id: 'q-eng-1',
      testId: 'test-subj-p1-lang1-1',
      position: 1,
      questionText: 'Choose the sentence that correctly transforms into the passive voice: "The academy will conduct the Tripura TET mock test tomorrow."',
      options: [
        'The Tripura TET mock test will be conducted by the academy tomorrow.',
        'The Tripura TET mock test was conducted by the academy tomorrow.',
        'The Tripura TET mock test would be conducted by the academy tomorrow.',
        'The Tripura TET mock test is being conducted by the academy tomorrow.'
      ]
    },
    {
      id: 'q-eng-2',
      testId: 'test-subj-p1-lang1-1',
      position: 2,
      questionText: 'Select the correct preposition: "The student was confident ______ achieving a high merit rank in the examination."',
      options: [
        'of',
        'in',
        'about',
        'at'
      ]
    },
    {
      id: 'q-eng-3',
      testId: 'test-subj-p1-lang1-1',
      position: 3,
      questionText: 'Select the antonym for the word "DILIGENT":',
      options: [
        'Lethargic',
        'Industrious',
        'Persistent',
        'Meticulous'
      ]
    }
  ],
  keys: [
    {
      questionId: 'q-eng-1',
      correctOption: 0,
      explanation: 'Future simple active voice ("will conduct") transforms to "will be + past participle" ("will be conducted").'
    },
    {
      questionId: 'q-eng-2',
      correctOption: 0,
      explanation: 'The adjective "confident" takes the preposition "of" when referring to belief in an outcome.'
    },
    {
      questionId: 'q-eng-3',
      correctOption: 0,
      explanation: '"Diligent" means hardworking and persevering. "Lethargic" (sluggish, inactive) is its direct antonym.'
    }
  ]
};

// Sample seeded demo questions for test-subj-p1-lang2-1 (Bengali ONLY - in Bengali script)
export const SAMPLE_QUESTIONS_P1_LANG2_1: { questions: SeriesQuestion[]; keys: SeriesQuestionKey[] } = {
  questions: [
    {
      id: 'q-ben-1',
      testId: 'test-subj-p1-lang2-1',
      position: 1,
      questionText: 'নিচের কোন বানানটি ব্যাকরণগতভাবে শুদ্ধ?',
      options: [
        'মুমূর্ষু',
        'মুমুর্ষু',
        'মুমুর্ষূ',
        'মুমূর্ষূ'
      ]
    },
    {
      id: 'q-ben-2',
      testId: 'test-subj-p1-lang2-1',
      position: 2,
      questionText: "'উপকূল' শব্দটির সঠিক ব্যাসবাক্য ও সমাস কোনটি?",
      options: [
        'কূলের সমীপে — অব্যয়ীভাব সমাস',
        'কূলের পশ্চাত — তৎপুরুষ সমাস',
        'কূলকে অতিক্রম — কর্মধারয় সমাস',
        'কূল ও উপকূল — দ্বন্দ্ব সমাস'
      ]
    },
    {
      id: 'q-ben-3',
      testId: 'test-subj-p1-lang2-1',
      position: 3,
      questionText: "'গায়ক' শব্দটির সঠিক সন্ধিবিচ্ছেদ কোনটি?",
      options: [
        'গৈ + অক',
        'গা + অক',
        'গে + অক',
        'গো + অক'
      ]
    }
  ],
  keys: [
    {
      questionId: 'q-ben-1',
      correctOption: 0,
      explanation: "শুদ্ধ বানানটি হলো 'মুমূর্ষু' (হ্রস্ব উ-কার, দীর্ঘ ঊ-কার, হ্রস্ব উ-কার)।"
    },
    {
      questionId: 'q-ben-2',
      correctOption: 0,
      explanation: "'কূলের সমীপে' = উপকূল। এটি সামীপ্য অর্থে অব্যয়ীভাব সমাসের উৎকৃষ্ট উদাহরণ।"
    },
    {
      questionId: 'q-ben-3',
      correctOption: 0,
      explanation: "'গৈ + অক' মিলে হয় 'গায়ক'। সূত্র: ঐ-কারের পর অন্য স্বরবর্ণ থাকলে ঐ স্থানে আয়্ হয়।"
    }
  ]
};
