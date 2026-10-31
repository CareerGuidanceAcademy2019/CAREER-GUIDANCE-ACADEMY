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

import type { MockQuestionOption, MockQuestionGroup } from '@/data/initialSeedData';

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
  attemptsAllowed?: number;
  scheduledDate?: string;
  languageMode?: 'english_only' | 'bengali_only' | 'bilingual';
  windowStart?: string | null;
  windowEnd?: string | null;
  windowHours?: number | null;
  showSolutions: 'after_submit' | 'after_window';
  shuffle: boolean;
  driveLink?: string;
  questions?: SeriesQuestion[];
  questionGroups?: MockQuestionGroup[];
  contentStatus?: 'draft' | 'active' | 'expired' | 'purged';
  purgeAfter?: string | null;
  retentionDays?: number;
  archiveDownloadedAt?: string | null;
  purgeRequiresArchive?: boolean;
}

export interface MockQuestionPaper {
  id: string;
  seriesId: string;
  subjectId: string | null;
  testId?: string | null;
  title: string;
  filePath: string;
  fileSizeBytes: number;
  status: 'draft' | 'published' | 'unpublished';
  publishAt?: string | null;
  publishedAt?: string | null;
  expireAt?: string | null;
  allowDownload: boolean;
  watermark: boolean;
  createdBy?: string | null;
  createdAt: string;
}

export interface MockTestQuestionStat {
  testId: string;
  position: number;
  subjectTag: string;
  attemptedCount: number;
  correctCount: number;
  wrongCount: number;
  averageTimeSeconds: number;
}

export interface SeriesQuestion {
  id: string;
  testId: string;
  position: number;
  questionText: string;
  options: [MockQuestionOption, MockQuestionOption, MockQuestionOption, MockQuestionOption] | MockQuestionOption[];
  questionTextBn?: string;
  optionsBn?: [MockQuestionOption, MockQuestionOption, MockQuestionOption, MockQuestionOption] | MockQuestionOption[];
  groupId?: string | null;
  imagePath?: string | null;
  imageAlt?: string | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
}

export interface SeriesQuestionKey {
  questionId: string;
  correctOption: number;
  explanation: string;
  explanationBn?: string;
  explanationImagePath?: string | null;
  explanationImageAlt?: string | null;
}

export interface SeriesEnrollment {
  id: string;
  studentId: string;
  seriesId: string;
  paymentId?: string;
  enrolledAt: string;
  accessValidUntil?: string;
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

export interface MockSubjectPost {
  id: string;
  seriesId: string;
  seriesName?: string;
  subjectId: string;
  subjectName: string;
  testId?: string | null;
  testTitle?: string | null;
  title: string;
  driveLink: string;
  instructions: string;
  postedDate: string;
  author: string;
  isEnrolledOnly: boolean;
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
  {
    id: 'series-stgt-soc',
    slug: 'trbt-stgt-social-science',
    name: 'TRBT STGT (Social Science) Daily Online Mock Tests Series',
    classRange: 'Graduate Teachers (Secondary Level)',
    stream: 'Social Science (History, Geography, Polity & Economics)',
    price: 499,
    batchLabel: '2026 Batch',
    description: 'Comprehensive Daily Online Mock Tests Series for TRBT STGT Social Science. Features full-length and sectional simulated exams with merit ranking and detailed pedagogical answers.',
    highlights: [
      'Weekly Scheduled Online Practice Tests',
      'Full Syllabus Coverage (History, Geography, Polity, Economics)',
      'Simulated State-Level Performance Analysis & Merit Ranks',
      'OMR Sheet & CBT Timed Interface',
      'Bilingual Questions in English & Bengali'
    ],
    status: 'Open',
    startsOn: 'Flexible / Admin Scheduled (Launch on Demand)',
  },
  {
    id: 'series-stgt-pure-sci',
    slug: 'trbt-stgt-pure-science',
    name: 'TRBT STGT (Pure Science) Daily Online Mock Tests Series',
    classRange: 'Graduate Teachers (Secondary Level)',
    stream: 'Pure Science (Physics, Chemistry & Mathematics)',
    price: 499,
    batchLabel: '2026 Batch',
    description: 'Specialized Mock Tests Series for TRBT STGT Pure Science candidates focusing on problem-solving speed, numerical precision, and conceptual accuracy.',
    highlights: [
      'Regular Sectional Mock Tests (Physics, Chemistry, Maths)',
      '02 Full Length Simulated Papers with Step-by-Step Solutions',
      'Formula Sheets & Shortcut Techniques Discussion',
      'Bilingual Questions in English & Bengali'
    ],
    status: 'Open',
    startsOn: 'Flexible / Admin Scheduled (Launch on Demand)',
  },
  {
    id: 'series-stgt-bio-sci',
    slug: 'trbt-stgt-biological-science',
    name: 'TRBT STGT (Biological Science) Daily Online Mock Tests Series',
    classRange: 'Graduate Teachers (Secondary Level)',
    stream: 'Biological Science (Botany, Zoology & Physiology)',
    price: 499,
    batchLabel: '2026 Batch',
    description: 'High-yield mock series for TRBT STGT Biological Science with diagram-oriented MCQs and taxonomy classification drills.',
    highlights: [
      'Botany, Zoology & Human Physiology Mock Tests',
      'High-Yield Diagram-Based Practice Questions',
      'Detailed Explanations & Model Solutions',
      'Bilingual Questions in English & Bengali'
    ],
    status: 'Open',
    startsOn: 'Flexible / Admin Scheduled (Launch on Demand)',
  },
  {
    id: 'series-tpsc-combined',
    slug: 'tpsc-combined-jrbt',
    name: 'TPSC Combined Services & JRBT Mock Tests Series',
    classRange: 'Graduates & 10+2 Aspirants',
    stream: 'General Studies, Tripura GK, Aptitude & English',
    price: 499,
    batchLabel: '2026 Batch',
    description: 'Complete mock test series for TPSC Combined Competitive Examinations and JRBT Group-C / Group-D posts.',
    highlights: [
      'Tripura GK & Current Affairs Speed Drills',
      'Quantitative Aptitude & Logical Reasoning Tests',
      'General English Grammar & Comprehension',
      'Bilingual Questions (English subjects in English)'
    ],
    status: 'Open',
    startsOn: 'Flexible / Admin Scheduled (Launch on Demand)',
  },
  {
    id: 'series-tcs-tps',
    slug: 'tcs-tps-officers',
    name: 'TCS / TPS Civil & Police Services Mock Tests Series',
    classRange: 'Graduate Aspirants',
    stream: 'State Civil Services & Police Services',
    price: 599,
    batchLabel: '2026 Batch',
    description: 'Premier mock exam series simulating the exact pattern, negative marking, and depth of Tripura Civil Service & Police Service preliminary examinations.',
    highlights: [
      'Comprehensive General Studies Paper Simulations',
      'State-Level Merit Percentile & Accuracy Analysis',
      'Tripura Heritage, Geography & Administrative Drills',
      'Curated by Senior Officers & Faculty Mentors'
    ],
    status: 'Open',
    startsOn: 'Flexible / Admin Scheduled (Launch on Demand)',
  },
  {
    id: 'series-banking-ssc',
    slug: 'banking-ibps-ssc-railway',
    name: 'Central Competitive (Banking IBPS/SBI, SSC & Railway) Mock Series',
    classRange: 'Graduates & 10+2 Aspirants',
    stream: 'Banking, SSC & Railway Competitive Exams',
    price: 399,
    batchLabel: '2026 Batch',
    description: 'High-speed CBT test series for IBPS PO/Clerk, SBI, SSC CGL/CHSL, and Railway RRB recruitment exams.',
    highlights: [
      'Timed Sectional Speed Quizzes with Negative Marking',
      'Data Interpretation & High-Level Reasoning Drills',
      'All-India Standard Question Bank with Explanations',
      'Bilingual Interface (English Language in English)'
    ],
    status: 'Open',
    startsOn: 'Flexible / Admin Scheduled (Launch on Demand)',
  },
  {
    id: 'series-school-foundation',
    slug: 'school-board-foundation',
    name: 'TBSE & CBSE School Board Mock Tests Series (Classes VII - X)',
    classRange: 'Classes VII, VIII, IX & X',
    stream: 'School Board Foundation (TBSE & CBSE)',
    price: 299,
    batchLabel: '2026 Batch',
    description: 'Board-pattern chapter-wise and term-end simulated examinations for Classes VII, VIII, IX & X adhering to TBSE and CBSE curricula.',
    highlights: [
      'Chapter-Wise Diagnostic Tests for Mathematics & Science',
      'Mid-Term & Pre-Board Simulated Question Papers',
      'Step-by-Step Marking and Feedback',
      'Bilingual Support for TBSE Bengali & English Medium'
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

export const INITIAL_MOCK_SUBJECT_POSTS: MockSubjectPost[] = [
  {
    id: 'post-cdp-p1-01',
    seriesId: 'series-ttet-paper1',
    seriesName: 'Tripura TET: Paper-I 2026',
    subjectId: 'subj-p1-cdp',
    subjectName: 'Child Development & Pedagogy',
    testId: 'test-subj-p1-cdp-1',
    testTitle: 'Child Development & Pedagogy - Mock 1',
    title: 'Tripura TET Paper-I: CDP Mock Test 1 Question Booklet PDF',
    driveLink: 'https://drive.google.com/file/d/1CGA_TET_CDP_Mock01_Question_Booklet_2026/view?usp=sharing',
    instructions: 'Exclusive for Enrolled Candidates: Download and print the 30-MCQ bilingual question booklet. Attempt under a strict 30-minute timer using the C.G.A practice OMR sheet. Detailed answer key analysis will be discussed in class.',
    postedDate: '2026-10-18',
    author: 'Academic Director (C.G.A)',
    isEnrolledOnly: true,
  },
  {
    id: 'post-lang1-p1-01',
    seriesId: 'series-ttet-paper1',
    seriesName: 'Tripura TET: Paper-I 2026',
    subjectId: 'subj-p1-lang1',
    subjectName: 'Language – I (English)',
    testId: 'test-subj-p1-lang1-1',
    testTitle: 'Language – I (English) - Mock 1',
    title: 'English Language Sectional Mock 1: Question Paper & Grammar Worksheets',
    driveLink: 'https://drive.google.com/file/d/1CGA_TET_ENG_Mock01_Worksheet_2026/view?usp=sharing',
    instructions: 'English Subject Question Paper (English Only). Contains Reading Comprehension, Error Spotting, and Pedagogy of Language Development. Exclusively for enrolled Paper-I students.',
    postedDate: '2026-10-17',
    author: 'English Faculty Head',
    isEnrolledOnly: true,
  },
  {
    id: 'post-lang2-p1-01',
    seriesId: 'series-ttet-paper1',
    seriesName: 'Tripura TET: Paper-I 2026',
    subjectId: 'subj-p1-lang2',
    subjectName: 'Language – II (Bengali)',
    testId: 'test-subj-p1-lang2-1',
    testTitle: 'Language – II (Bengali) - Mock 1',
    title: 'বাংলা ভাষা ও সাহিত্য মক টেস্ট ১: প্রশ্নপত্র ও ব্যাকরণ অনুশীলন ড্রাইভ লিংক',
    driveLink: 'https://drive.google.com/file/d/1CGA_TET_BEN_Mock01_Question_Paper_2026/view?usp=sharing',
    instructions: 'শুধুমাত্র নথিভুক্ত শিক্ষার্থীদের জন্য: বাংলা ব্যাকরণ (সন্ধি, সমাস, প্রত্যয়) এবং সাহিত্য বোধপরীক্ষণের পূর্ণাঙ্গ প্রশ্নপত্র ড্রাইভ থেকে ডাউনলোড করে পরীক্ষা দিন।',
    postedDate: '2026-10-16',
    author: 'Bengali Faculty Department',
    isEnrolledOnly: true,
  },
  {
    id: 'post-math-p1-01',
    seriesId: 'series-ttet-paper1',
    seriesName: 'Tripura TET: Paper-I 2026',
    subjectId: 'subj-p1-math',
    subjectName: 'Mathematics (Content & Pedagogy)',
    testId: 'test-subj-p1-math-1',
    testTitle: 'Mathematics (Content & Pedagogy) - Mock 1',
    title: 'Mathematics Sectional Mock 1: Formula Sheet & Question Booklet',
    driveLink: 'https://drive.google.com/file/d/1CGA_TET_MATH_Mock01_Questions_2026/view?usp=sharing',
    instructions: 'Bilingual Mathematics question booklet (30 Marks). Solve geometry, arithmetic, and mathematical pedagogical issues step-by-step. Access restricted to enrolled students.',
    postedDate: '2026-10-15',
    author: 'Mathematics & Science Faculty',
    isEnrolledOnly: true,
  },
  {
    id: 'post-evs-p1-01',
    seriesId: 'series-ttet-paper1',
    seriesName: 'Tripura TET: Paper-I 2026',
    subjectId: 'subj-p1-evs',
    subjectName: 'Environmental Studies (EVS)',
    testId: 'test-subj-p1-evs-1',
    testTitle: 'Environmental Studies (EVS) - Mock 1',
    title: 'EVS Sectional Mock 1: Tripura Ecology & Biodiversity Question Paper',
    driveLink: 'https://drive.google.com/file/d/1CGA_TET_EVS_Mock01_Booklet_2026/view?usp=sharing',
    instructions: 'Special focus on North-East Flora, Fauna, Tripura Forest Resources, and EVS Pedagogy. Enrolled students only.',
    postedDate: '2026-10-14',
    author: 'EVS Specialist (C.G.A)',
    isEnrolledOnly: true,
  },
  {
    id: 'post-sci-p2-01',
    seriesId: 'series-ttet-paper2-sci',
    seriesName: 'Tripura TET: Paper-II (Science) 2026',
    subjectId: 'subj-p2s-sci',
    subjectName: 'Science (Physics, Chemistry & Biology)',
    testId: null,
    testTitle: null,
    title: 'Paper-II Science (PCB) Combined Question Bank & Mock Test Papers',
    driveLink: 'https://drive.google.com/file/d/1CGA_TET_P2_SCI_QuestionBank_2026/view?usp=sharing',
    instructions: 'Comprehensive NCERT & SCERT Tripura aligned question collection covering Mechanics, Chemical Reactions, Cell Biology, and Science Teaching Methods. Enrolled students exclusive.',
    postedDate: '2026-10-13',
    author: 'Senior Science Faculty',
    isEnrolledOnly: true,
  },
  {
    id: 'post-soc-p2-01',
    seriesId: 'series-ttet-paper2-soc',
    seriesName: 'Tripura TET: Paper-II (Social Studies) 2026',
    subjectId: 'subj-p2ss-hist',
    subjectName: 'History & Pedagogical Issues',
    testId: null,
    testTitle: null,
    title: 'Paper-II Social Studies: Tripura History & Indian Freedom Struggle Mock Papers',
    driveLink: 'https://drive.google.com/file/d/1CGA_TET_P2_SOC_Hist_Mock_2026/view?usp=sharing',
    instructions: 'Deep dive into Ancient, Medieval, Modern Indian History, Manikya Dynasty of Tripura, and Social Sciences pedagogy. Access unlocked for enrolled candidates.',
    postedDate: '2026-10-12',
    author: 'Social Studies Faculty',
    isEnrolledOnly: true,
  },
];
