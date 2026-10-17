export * from './mockSeriesSeedData';
import { getFacultyAvatarUrl } from '@/lib/names';
import {
  MOCK_SERIES_INITIAL,
  MOCK_SUBJECTS_INITIAL,
  MOCK_SERIES_TESTS_INITIAL,
  MockSeries,
  MockSubject,
  SeriesMockTest,
  SeriesEnrollment,
  SeriesAttempt,
} from './mockSeriesSeedData';

export type CourseCategory =
  | 'State Government Examinations'
  | 'Central Government Examinations'
  | 'Teaching and Recruitment Exams'
  | 'Banking, SSC and Railway'
  | 'Other Competitive Examinations'
  | 'School Coaching';

export type CourseMode = 'Offline' | 'Online';

export interface StandalonePackage {
  id: string;
  type: 'mock_test' | 'study_material';
  title: string;
  targetExam: string;
  description: string;
  price: number;
  duration: string;
  deliveryType?: string;
  features: string[];
  isPublished: boolean;
}

export interface Course {
  id: string;
  name: string;
  mode?: CourseMode;
  category: string;
  subCategory: string; // e.g. 'TCS / TPS', 'Tripura TET', 'SSC-CGL'
  board?: string;
  classLevel?: string;
  description: string;
  syllabusHighlights: string[];
  price: number; // Admission Fee
  monthlyFee?: number; // Monthly Fee
  instalmentAvailable: boolean;
  firstInstalment: number;
  facultyId: string;
  facultyName: string;
  batchName: string;
  batchSize: number;
  seatsAvailable: number;
  waitingListCount: number;
  duration: string;
  startDate: string;
  schedule: string;
  status: 'Open for Admission' | 'Batch Closed';
  featured?: boolean;
  linkedMaterialIds: string[];
  materialDelivery?: string; // e.g. 'Printed Physical Copies + View-Only Softcopy' | 'View-Only Softcopy'
}

export interface FacultyMember {
  id: string;
  name: string;
  designation?: string;
  subject: string;
  qualification: string;
  experience: string;
  photo: string;
  bio: string;
  specializationTags: string[];
  achievements?: string;
  workAbility?: string;
}

export interface Achievement {
  id: string;
  name: string;
  exam: string;
  rank: string;
  year: string;
  photo: string;
  quote: string;
  category: string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  type: 'Book PDF' | 'Paid Notes';
  author: string;
  pages: number;
  fileSize: string;
  uploadedDate: string;
  description: string;
  previewSections: {
    heading: string;
    body: string;
  }[];
}

export interface MCQQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctOptionIndex: number;
  explanation: string;
  questionBn?: string;
  optionsBn?: [string, string, string, string];
  explanationBn?: string;
  subject?: string;
}

export interface MockTest {
  id: string;
  title: string;
  subject?: string;
  languageMode?: 'english_only' | 'bengali_only' | 'bilingual';
  courseId: string;
  courseName: string;
  batchName: string;
  durationMinutes: number;
  totalMarks: number;
  marksPerQuestion: number;
  negativeMarking: number;
  scheduledDate: string;
  status: 'Published' | 'Draft';
  questions: MCQQuestion[];
}

export interface TestAttempt {
  id: string;
  testId: string;
  testTitle: string;
  courseId: string;
  studentId: string;
  studentName: string;
  score: number;
  totalMarks: number;
  correctCount: number;
  wrongCount: number;
  unattemptedCount: number;
  accuracy: number;
  timeTakenMinutes: number;
  submittedAt: string;
  answers: Record<string, number>;
}

export interface FeePayment {
  id: string;
  receiptNo: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  amount: number;
  paymentMode: 'UPI' | 'Debit/Credit Card' | 'Net Banking' | 'Cash at Counter';
  paymentType: 'Full Payment' | 'Instalment 1' | 'Instalment 2' | 'Balance Clearance';
  date: string;
  remarks?: string;
  status?: 'Pending' | 'Verified' | 'Rejected';
  utr?: string;
  screenshot?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface StudentEnrollment {
  id?: string;
  courseId: string;
  courseName: string;
  batchName: string;
  facultyName: string;
  enrolledDate: string;
  progress: number;
  totalFee: number;
  paidAmount: number;
  dueAmount: number;
  nextDueDate?: string;
  accessValidUntil?: string;
}

export interface StudentProfile {
  id: string;
  studentCode: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  photo: string;
  guardianName: string;
  address: string;
  permanentAddress?: string;
  qualification: string;
  targetExam: string;
  joinedDate: string;
  status: 'Active' | 'Inactive';
  enrollments: StudentEnrollment[];
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetBatch: string; // 'All Batches' or courseId
  targetLabel: string;
  priority: 'Normal' | 'Important' | 'Urgent';
  date: string;
  author: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
}

export interface EnquiryItem {
  id: string;
  name: string;
  phone: string;
  email: string;
  courseInterest: string;
  message: string;
  createdAt: string;
}

export interface SiteContent {
  instituteName: string;
  shortName: string;
  tagline: string;
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  introHeading: string;
  introText: string;
  mission: string;
  vision: string;
  aboutHistory: string;
  whyChooseUs: {
    title: string;
    description: string;
  }[];
  stats: {
    label: string;
    value: string;
  }[];
  contact: {
    address: string;
    landmark: string;
    city: string;
    state: string;
    pincode: string;
    phonePrimary: string;
    phoneSecondary: string;
    email: string;
    officeHours: string;
    mapEmbedUrl: string;
  };
  testimonials: Testimonial[];
  standalonePackages?: StandalonePackage[];
}

export interface CgaDatabase {
  siteContent: SiteContent;
  courses: Course[];
  faculty: FacultyMember[];
  achievements: Achievement[];
  studyMaterials: StudyMaterial[];
  mockTests: MockTest[];
  testAttempts: TestAttempt[];
  students: StudentProfile[];
  feePayments: FeePayment[];
  announcements: Announcement[];
  enquiries: EnquiryItem[];
  mockSeries: MockSeries[];
  mockSubjects: MockSubject[];
  seriesTests: SeriesMockTest[];
  seriesEnrollments: SeriesEnrollment[];
  seriesAttempts: SeriesAttempt[];
}

export const INITIAL_SEED_DATA: CgaDatabase = {
  siteContent: {
    instituteName: 'Career Guidance Academy (C.G.A)',
    shortName: 'C.G.A Udaipur',
    tagline: 'Shaping Meritorious Careers Across Tripura Since 2016',
    heroBadge: 'Admissions Open for 2026–27 Academic & Competitive Batches',
    heroTitle: 'Premier Coaching for TET, STGT, TPSC, Banking & Board Exams in Udaipur',
    heroSubtitle:
      'Located at Chanban Youth Club Rd, Udaipur, Tripura — Career Guidance Academy empowers aspirants with structured study materials, OMR & computer-based mock tests, and personal mentorship from state-topper faculty.',
    heroCtaPrimary: 'Explore Courses & Batches',
    heroCtaSecondary: 'Student Portal Login',
    introHeading: 'Welcome to Career Guidance Academy (C.G.A), Udaipur',
    introText:
      'Career Guidance Academy (C.G.A) is Gomati District’s most trusted academic & competitive examination coaching institute. Whether you are preparing for Tripura TET, STGT, STPGT, TPSC, JRBT, Banking, SSC, Railways, or building a rock-solid foundation in Class VII to X (TBSE & CBSE), our small batch sizes and rigorous evaluation system ensure measurable success.',
    mission:
      'To democratize top-tier competitive and school-level coaching for students across Udaipur and Tripura by combining expert classroom pedagogy, bilingual printed & digital notes, and continuous mock assessment at an affordable fee structure.',
    vision:
      'To become North-East India’s benchmark institution for government recruitment preparation and secondary board excellence, nurturing disciplined, ethical, and high-achieving professionals.',
    aboutHistory:
      'Founded in the heart of Udaipur at Chanban Youth Club Road behind Youth Club, Career Guidance Academy (C.G.A) began with a single batch of 25 TET aspirants. Over the years, C.G.A has produced 650+ government selections across TRBT (TET/STGT/STPGT), TPSC, JRBT, IBPS, SSC, and over 400+ distinction holders in TBSE and CBSE Board Examinations.',
    whyChooseUs: [
      {
        title: 'Small & Focused Batches',
        description:
          'Strict seat limits (25–40 students per batch) ensure personal doubt-clearing and one-on-one mentorship with faculty.',
      },
      {
        title: 'Updated Exam-Aligned Library',
        description:
          'Exclusive soft-copy PDF books and paid handwritten/typed notes unlocked automatically for enrolled students.',
      },
      {
        title: 'Weekly Timed Mock Tests & Ranks',
        description:
          'Simulate real TRBT, TPSC, IBPS & Board exam conditions with negative marking, instant scorecards, and batch ranking.',
      },
      {
        title: 'Separate TBSE & CBSE School Wings',
        description:
          'Dedicated board-specific batches for Classes VII, VIII, IX & X following the exact latest NCERT, TBSE, and CBSE curricula.',
      },
    ],
    stats: [
      { label: 'Selections in TET / STGT / JRBT / TPSC', value: '680+' },
      { label: 'Active Students in Udaipur Campus', value: '1,250+' },
      { label: 'Expert Subject Faculty Members', value: '18+' },
      { label: 'Board Distinction Success Rate', value: '96.4%' },
    ],
    contact: {
      address: 'Chanban (Behind Youthclub), Udaipur, Gomati Tripura.',
      landmark: 'Behind Chanban Youth Club, Near Jagannath Bari Road',
      city: 'Udaipur (Gomati District)',
      state: 'Tripura',
      pincode: '799114',
      phonePrimary: '+91-7005929189',
      phoneSecondary: '+91 76298 82835',
      email: 'careerguidanceacademy2019@gmail.com',
      officeHours: 'Mon – Sun: 7:30 AM to 8:00 PM',
      mapEmbedUrl:
        'https://www.google.com/maps?q=Chanban+Youth+Club+Rd+Udaipur+Tripura+799114&output=embed',
    },
        standalonePackages: [
      {
        id: 'pkg-ttet-paper1-2026',
        type: 'mock_test',
        title: 'Tripura TET: Paper-I 2026 Daily Online Mock Tests Series',
        targetExam: 'Tripura TET: Paper-I (Classes I to V)',
        description: 'Comprehensive Daily Online Mock Tests Series for Tripura TET Paper-I 2026. Includes 30+ Sectional Mock Tests (CDP, English, Bengali, Math & EVS) and 02 Full Length Mock Tests with 1200+ MCQs, OMR Sheet for practice, and performance analysis.',
        price: 399,
        duration: '2026 Session (Weekly 5 Days Mon–Fri)',
        features: [
          'Weekly 5 Days (Monday to Friday)',
          '30+ Sectional Mock Tests (CDP, English, Bengali, Math & EVS)',
          '02 Full Length Mock Tests (Covering Full Syllabus)',
          '1200+ MCQs & OMR Sheet For Practice',
          'Self Performance Analysis & State Merit Ranking',
          'Expert\'s Guidance & Doubt Clearance through Discussion',
          'Bilingual Questions in English & Bengali (except English & Bengali papers)',
        ],
        isPublished: true,
      },
      {
        id: 'pkg-ttet-paper2-sci-2026',
        type: 'mock_test',
        title: 'Tripura TET: Paper-II (Science) 2026 Daily Online Mock Tests Series',
        targetExam: 'Tripura TET: Paper-II Science & Mathematics',
        description: 'Targeted Daily Online Mock Tests Series for Tripura TET Paper-II Science 2026. Features 40+ Sectional Mock Tests (CDP, English, Bengali, Maths & Science) and 02 Full Length Mock Tests with 1500+ MCQs, OMR Sheet, and discussion.',
        price: 499,
        duration: '2026 Session (Weekly 5 Days Mon–Fri)',
        features: [
          'Weekly 5 Days (Monday to Friday)',
          '40+ Sectional Mock Tests (CDP, English, Bengali, Maths & Science)',
          '02 Full Length Mock Tests (Covering Full Syllabus)',
          '1500+ MCQs & OMR Sheet For Practice',
          'Self Performance Analysis & State Merit Ranking',
          'Expert\'s Guidance & Doubt Clearance through Discussion',
          'Bilingual Questions in English & Bengali (except English & Bengali papers)',
        ],
        isPublished: true,
      },
      {
        id: 'pkg-ttet-paper2-soc-2026',
        type: 'mock_test',
        title: 'Tripura TET: Paper-II (Social Studies) 2026 Daily Online Mock Tests Series',
        targetExam: 'Tripura TET: Paper-II Social Studies',
        description: 'Specialized Daily Online Mock Tests Series for Tripura TET Paper-II Social Studies 2026. Features 40+ Sectional Mock Tests (CDP, English, Bengali, History, Geography & Political Science) and 02 Full Length Mock Tests with 1500+ MCQs and discussion.',
        price: 499,
        duration: '2026 Session (Weekly 5 Days Mon–Fri)',
        features: [
          'Weekly 5 Days (Monday to Friday)',
          '40+ Sectional Mock Tests (CDP, English, Bengali, History, Geography & Political Science)',
          '02 Full Length Mock Tests (Covering Full Syllabus)',
          '1500+ MCQs & OMR Sheet For Practice',
          'Self Performance Analysis & State Merit Ranking',
          'Expert\'s Guidance & Doubt Clearance through Discussion',
          'Bilingual Questions in English & Bengali (except English & Bengali papers)',
        ],
        isPublished: true,
      },
    ],
    testimonials: [
      {
        id: 'test-1',
        name: 'Srabani Chakraborty',
        role: 'State Rank 4 — Tripura TET Paper-II (2025)',
        content:
          'C.G.A’s Child Development & Pedagogy notes and weekly mock test series were the turning point in my preparation. Every faculty member at the Chanban campus personally tracked my mock scores.',
        rating: 5,
      },
      {
        id: 'test-2',
        name: 'Dipankar Das',
        role: 'Selected in TPSC Combined & JRBT Group-C',
        content:
          'The Tripura GK, North-East Current Affairs, and English Descriptive modules at Career Guidance Academy are unmatched in Gomati district. The digital study library saved me hundreds of hours.',
        rating: 5,
      },
      {
        id: 'test-3',
        name: 'Ananya Saha',
        role: '97.2% in TBSE Madhyamik (Class X Topper)',
        content:
          'Joining the Class X TBSE batch at C.G.A helped me master Mathematics and Physical Science. The chapter-wise test papers and doubt classes gave me complete confidence before the board exams.',
        rating: 5,
      },
    ],
  },

  faculty: [
    {
      id: 'fac-popi-ghosh',
      name: 'Mrs. Popi Ghosh',
      designation: 'Principal',
      subject: 'English, General Knowledge & Current Affairs',
      qualification: 'B.A. & M.A. in English',
      experience: '5 Years Experience',
      photo: getFacultyAvatarUrl('Mrs. Popi Ghosh'),
      bio: 'Principal at Career Guidance Academy (C.G.A). Mentors aspirants for TCS, TPSC Combined, SSC, RRB, and English language comprehension with online and offline teaching capability.',
      specializationTags: ['Principal', 'TCS / TPSC Combined', 'SSC & RRB', 'Descriptive English', 'Online & Offline'],
      achievements: 'Guiding top rankers across competitive exams in Tripura',
      workAbility: 'Online & Offline',
    },
    {
      id: 'fac-g-shil',
      name: 'Mr. G. Shil',
      designation: 'Assistant Teacher',
      subject: 'Bengali (TET-I & TET-II)',
      qualification: 'M.A. in Bengali with B.Ed.',
      experience: '10 Years Experience',
      photo: getFacultyAvatarUrl('Mr. G. Shil'),
      bio: 'Specialist faculty for Bengali language and pedagogy for TRBT TET Paper-I & Paper-II. Special achievements: TET-I, TET-II & STGT qualified under TRBT. Available for online and offline classes.',
      specializationTags: ['Assistant Teacher', 'TET-I & TET-II', 'Bengali', 'TRBT Qualified', 'Online & Offline'],
      achievements: 'TET-I, TET-II & STGT qualified under TRBT',
      workAbility: 'Online & Offline',
    },
    {
      id: 'fac-s-banik',
      name: 'Mr. S. Banik',
      designation: 'Assistant Teacher',
      subject: 'English, General Knowledge & Current Affairs',
      qualification: 'B.A. English (Honours), M.A. in English, B.Ed.',
      experience: '10 Years Experience',
      photo: getFacultyAvatarUrl('Mr. S. Banik'),
      bio: 'Prepares candidates for TET-I, TET-II, STGT, TPSC, and TCS/TPS examinations. Special achievements: TET-I, TET-II & STGT qualified under TRBT. Conducts both online and offline interactive lectures.',
      specializationTags: ['Assistant Teacher', 'TET & STGT', 'TPSC / TCS / TPS', 'English', 'GK & CA', 'Online & Offline'],
      achievements: 'TET-I, TET-II & STGT qualified under TRBT',
      workAbility: 'Online & Offline',
    },
    {
      id: 'fac-p-ghosh',
      name: 'Mr. P. Ghosh',
      designation: 'Assistant Teacher',
      subject: 'General Studies, Maths & Reasoning, GK, CA',
      qualification: 'B.Tech (80% Marks), Masters in Manufacturing',
      experience: '10 Years Experience',
      photo: getFacultyAvatarUrl('Mr. P. Ghosh'),
      bio: 'Senior mentor for TCS, TPSC Combined, SSC & RRB. Special achievements: Selected as Election Inspector, Panchayat Executive Officer, LDC (JRBT), and TBSE Class 10 Board Rank Holder.',
      specializationTags: ['Assistant Teacher', 'TCS & TPSC Combined', 'SSC & RRB', 'Maths & Reasoning', 'General Studies', 'Online & Offline'],
      achievements: 'Selected as Election Inspector, Panchayat Executive Officer, LDC (JRBT)',
      workAbility: 'Online & Offline',
    },
    {
      id: 'fac-p-bhattacharjee',
      name: 'Mr. P. Bhattacharjee',
      designation: 'Assistant Teacher',
      subject: 'Maths, Reasoning & General Science',
      qualification: 'M.Tech Biotechnology (NIT Durgapur)',
      experience: '5 Years Experience',
      photo: getFacultyAvatarUrl('Mr. P. Bhattacharjee'),
      bio: 'Guides TCS/TPS, TPSC, SSC, and RRB aspirants with high-speed calculation techniques and scientific reasoning. Special achievements: GATE Qualified (2014 & 2016), Qualified TPSC Tripura Secretariat Service 2023 (Rank 9th).',
      specializationTags: ['Assistant Teacher', 'TPSC Rank 9th', 'NIT Durgapur', 'GATE Qualified', 'Maths & Reasoning', 'General Science'],
      achievements: 'GATE Qualified (2014 & 2016), TPSC Tripura Secretariat Service 2023 (Rank 9th)',
      workAbility: 'Online & Offline',
    },
    {
      id: 'fac-r-paul',
      name: 'Mrs. R. Paul',
      designation: 'Assistant Teacher',
      subject: 'Child Development and Pedagogy (CDP)',
      qualification: 'B.A. with Education (Honours), D.El.Ed.',
      experience: '10 Years Experience',
      photo: getFacultyAvatarUrl('Mrs. R. Paul'),
      bio: 'Specialist educator for Child Development and Pedagogy (CDP) for Tripura TET-I and TET-II. Special achievements: TET-I & TET-II qualified under TRBT. Mentors students with deep conceptual clarity in online and offline modes.',
      specializationTags: ['Assistant Teacher', 'Child Development & Pedagogy', 'TET-I & TET-II', 'TRBT Qualified', 'Education Honours'],
      achievements: 'TET-I & TET-II qualified under TRBT',
      workAbility: 'Online & Offline',
    },
    {
      id: 'fac-s-ghosh',
      name: 'Mr. S. Ghosh',
      designation: 'Assistant Teacher',
      subject: 'History & Political Science',
      qualification: 'B.A. in Political Science, M.A. in Political Science, B.Ed.',
      experience: '10 Years Experience',
      photo: getFacultyAvatarUrl('Mr. S. Ghosh'),
      bio: 'Leads Social Studies, Indian Polity, and History preparation for TET-II & STGT under TRBT. Special achievements: TET-II & STPGT qualified under TRBT. Conducts both online and offline classes.',
      specializationTags: ['Assistant Teacher', 'TET-II & STGT', 'STPGT Qualified', 'Political Science', 'History', 'Online & Offline'],
      achievements: 'TET-II & STPGT qualified under TRBT',
      workAbility: 'Online & Offline',
    },
    {
      id: 'fac-j-paul',
      name: 'Mr. J. Paul',
      designation: 'Assistant Teacher',
      subject: 'Mathematics, Science & EVS',
      qualification: 'B.Sc. (B.Ed.), M.A.',
      experience: '6 Years Experience',
      photo: getFacultyAvatarUrl('Mr. J. Paul'),
      bio: 'Mentors TET-I and TET-II aspirants in Mathematics, General Science, and Environmental Studies. Special achievements: TET-II & C-TET (Science & Maths) Qualified. Delivers interactive online and offline lessons.',
      specializationTags: ['Assistant Teacher', 'TET-I & TET-II', 'Mathematics & Science', 'EVS', 'C-TET Qualified', 'Online & Offline'],
      achievements: 'TET-II & C-TET (Science & Maths) Qualified',
      workAbility: 'Online & Offline',
    },
    {
      id: 'fac-r-debnath',
      name: 'Mr. R. Debnath',
      designation: 'Assistant Teacher',
      subject: 'Math, Science & EVS',
      qualification: 'B. Sc. with Chemistry (Honours), M. Sc. & B. Ed.',
      experience: '7 Years Experience',
      photo: getFacultyAvatarUrl('Mr. R. Debnath'),
      bio: 'Appointed for TET-I & TET-II batches teaching Mathematics, Science, and Environmental Studies (EVS). Special achievements: TET-I & TET-II (Science) Qualified under TRBT. Available for online and offline teaching.',
      specializationTags: ['Assistant Teacher', 'TET-I & TET-II', 'Math & Science', 'EVS', 'TRBT Qualified', 'Online & Offline'],
      achievements: 'TET-I & TET-II (Science) Qualified under TRBT',
      workAbility: 'Online & Offline',
    },
    {
      id: 'fac-s-majumder',
      name: 'Miss. S. Majumder',
      designation: 'Assistant Teacher',
      subject: 'General Knowledge, General Science & Current Affairs',
      qualification: 'B.F.Sc., M.F.Sc. (Master of Fisheries Science)',
      experience: '5 Years Experience',
      photo: getFacultyAvatarUrl('Miss. S. Majumder'),
      bio: 'Faculty for TCS/TPS, TPSC Combined, and JRBT examinations. Special achievements: TPSC COMBINED-2 Qualified. Available for online and offline classroom coaching and mock analysis.',
      specializationTags: ['Assistant Teacher', 'TPSC Combined Qualified', 'TCS / TPS / JRBT', 'General Science', 'Current Affairs & GK'],
      achievements: 'TPSC COMBINED-2 Qualified',
      workAbility: 'Online & Offline',
    },
    {
      id: 'fac-b-das',
      name: 'Mr. B. Das',
      designation: 'Office Assistant',
      subject: 'ICT Instruction & Office Administration',
      qualification: 'B.A. Pass & DCA',
      experience: '5 Years Experience as ICT Instructor',
      photo: getFacultyAvatarUrl('Mr. B. Das'),
      bio: 'Office Assistant coordinating digital operations and student support with 5 years experience as ICT Instructor. Special achievements: MTS under JRBT. Available for online and offline work.',
      specializationTags: ['Office Assistant', 'ICT Instructor', 'B.A. & DCA', 'MTS under JRBT', 'Online & Offline'],
      achievements: 'MTS under JRBT',
      workAbility: 'Online & Offline',
    },
    {
      id: 'fac-tridip-sarkar',
      name: 'Mr. Tridip Sarkar',
      designation: 'Office Manager',
      subject: 'Administration, Operations & Student Support',
      qualification: 'Master’s Degree in Political Science (IGNOU), DCA',
      experience: '5 Years Experience',
      photo: getFacultyAvatarUrl('Mr. Tridip Sarkar'),
      bio: 'Office Manager coordinating campus administration, online & offline batch scheduling, and student support. Special achievements: Diploma in Computer Applications (DCA). Available for online and offline coordination.',
      specializationTags: ['Office Manager', 'Campus Administration', 'Operations', 'DCA Certified', 'Online & Offline Support'],
      achievements: 'Diploma in Computer Applications (DCA)',
      workAbility: 'Online & Offline',
    },
  ],

  courses: [
  {
    "id": "crs-tcs-tps-offline",
    "name": "TCS/TPS Complete Preparation (Classroom Offline)",
    "mode": "Offline",
    "category": "State Government Examinations",
    "subCategory": "TCS / TPS",
    "board": "Competitive",
    "description": "Comprehensive preparation for Tripura Civil Service & Tripura Police Service exams with complete syllabus coverage, daily practice, current affairs & mentorship. Enrolled offline candidates receive physical printed copies of all classroom study notes and modules.",
    "syllabusHighlights": [
      "Complete TCS/TPS Prelims & Mains Syllabus Coverage",
      "Daily Practice & Standard OMR/Written Mock Tests",
      "Current Affairs, Tripura GK & Interview Preparation",
      "Physical Printed Study Materials & Notes Included",
      "Personal Mentorship & In-Person Doubt Clearing"
    ],
    "price": 6000,
    "monthlyFee": 1000,
    "instalmentAvailable": true,
    "firstInstalment": 6000,
    "facultyId": "fac-p-ghosh",
    "facultyName": "Mr. P. Ghosh",
    "batchName": "TCS/TPS-2026 Offline Officers Batch",
    "batchSize": 50,
    "seatsAvailable": 50,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-11-01",
    "schedule": "Tue, Thu, Sat — 10:00 AM to 1:00 PM",
    "status": "Open for Admission",
    "featured": true,
    "linkedMaterialIds": [],
    "materialDelivery": "Printed Physical Copies + View-Only Softcopy"
  },
  {
    "id": "crs-tcs-tps-online",
    "name": "TCS/TPS Complete Preparation (Interactive Online)",
    "mode": "Online",
    "category": "State Government Examinations",
    "subCategory": "TCS / TPS",
    "board": "Competitive",
    "description": "Interactive online preparation for Tripura Civil Service & Tripura Police Service exams with complete syllabus coverage, daily live sessions, CBT mock tests, and mentor support. Digital study materials provided in protected view-only softcopy mode.",
    "syllabusHighlights": [
      "Complete TCS/TPS Syllabus Coverage by Expert Faculty",
      "Daily Live Interactive Classes & Recorded Archives",
      "Online CBT Mock Tests & Current Affairs Drills",
      "Secure View-Only Digital Study Materials in Browser",
      "Doubt Clearing & Interview Prep Sessions"
    ],
    "price": 5000,
    "monthlyFee": 800,
    "instalmentAvailable": true,
    "firstInstalment": 5000,
    "facultyId": "fac-popi-ghosh",
    "facultyName": "Mrs. Popi Ghosh",
    "batchName": "TCS/TPS-2026 Online Live Batch",
    "batchSize": 50,
    "seatsAvailable": 50,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-11-01",
    "schedule": "Mon, Wed, Fri — 6:00 PM to 8:30 PM",
    "status": "Open for Admission",
    "featured": true,
    "linkedMaterialIds": [],
    "materialDelivery": "View-Only Softcopy"
  },
  {
    "id": "crs-tpsc-combined-offline",
    "name": "TPSC COMBINED SERVICES Complete Preparation (Classroom Offline)",
    "mode": "Offline",
    "category": "State Government Examinations",
    "subCategory": "TPSC Combined Services",
    "board": "Competitive",
    "description": "Preparation for administrative roles under TPSC Combined Services examinations with exam-oriented strategies. Enrolled offline candidates receive physical printed copies of all classroom study notes.",
    "syllabusHighlights": [
      "Complete TPSC Combined Prelims & Mains Syllabus",
      "Expert Faculty Mentorship & Exam Strategy Drills",
      "Daily Practice & Simulated Mock Tests",
      "Physical Printed Study Materials Included",
      "Current Affairs & Interview Guidance"
    ],
    "price": 5000,
    "monthlyFee": 1000,
    "instalmentAvailable": true,
    "firstInstalment": 5000,
    "facultyId": "fac-p-ghosh",
    "facultyName": "Mr. P. Ghosh",
    "batchName": "TPSC-Combined Offline Batch A",
    "batchSize": 50,
    "seatsAvailable": 50,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-11-05",
    "schedule": "Mon, Wed, Fri — 10:30 AM to 1:00 PM",
    "status": "Open for Admission",
    "featured": true,
    "linkedMaterialIds": [],
    "materialDelivery": "Printed Physical Copies + View-Only Softcopy"
  },
  {
    "id": "crs-tpsc-combined-online",
    "name": "TPSC COMBINED SERVICES Complete Preparation (Interactive Online)",
    "mode": "Online",
    "category": "State Government Examinations",
    "subCategory": "TPSC Combined Services",
    "board": "Competitive",
    "description": "Comprehensive online coaching for TPSC Combined Services examination with structured syllabus coverage, live interactive classes, and mock tests. Digital materials provided in protected view-only mode.",
    "syllabusHighlights": [
      "Complete TPSC Combined Syllabus by Subject Experts",
      "Daily Practice & Online Mock Test Series",
      "Current Affairs & Interview Guidance Sessions",
      "Protected View-Only Digital Study Material",
      "Regular Doubt Resolution & Mentorship"
    ],
    "price": 4000,
    "monthlyFee": 800,
    "instalmentAvailable": true,
    "firstInstalment": 4000,
    "facultyId": "fac-s-majumder",
    "facultyName": "Miss. S. Majumder",
    "batchName": "TPSC-Combined Online Evening Batch",
    "batchSize": 50,
    "seatsAvailable": 50,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-11-05",
    "schedule": "Tue, Thu, Sat — 6:30 PM to 8:30 PM",
    "status": "Open for Admission",
    "featured": false,
    "linkedMaterialIds": [],
    "materialDelivery": "View-Only Softcopy"
  },
  {
    "id": "crs-tet-1-offline",
    "name": "TET-I (Tripura Teachers' Eligibility Test Paper I) — Offline",
    "mode": "Offline",
    "category": "State Government Examinations",
    "subCategory": "Tripura TET (Paper I)",
    "board": "Competitive",
    "description": "Preparation for primary teacher eligibility test focusing on Child Development & Pedagogy, Bengali, English, Math, and Environmental Studies. Offline classroom students receive printed study materials & notes.",
    "syllabusHighlights": [
      "Child Development & Pedagogy (CDP) 30-Mark Mastery",
      "Languages (Bengali & English) Grammar + Pedagogy",
      "Mathematics & Environmental Studies (EVS) Concepts",
      "Physical Printed Study Materials & OMR Mock Papers",
      "Weekly Unit Tests & Pedagogical Doubt Clearing"
    ],
    "price": 4000,
    "monthlyFee": 1000,
    "instalmentAvailable": true,
    "firstInstalment": 4000,
    "facultyId": "fac-r-paul",
    "facultyName": "Mrs. R. Paul",
    "batchName": "TET-I Primary Offline Batch",
    "batchSize": 60,
    "seatsAvailable": 60,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-11-10",
    "schedule": "Mon, Wed, Fri — 8:00 AM to 10:30 AM",
    "status": "Open for Admission",
    "featured": true,
    "linkedMaterialIds": [],
    "materialDelivery": "Printed Physical Copies + View-Only Softcopy"
  },
  {
    "id": "crs-tet-1-online",
    "name": "TET-I (Tripura Teachers' Eligibility Test Paper I) — Online",
    "mode": "Online",
    "category": "State Government Examinations",
    "subCategory": "Tripura TET (Paper I)",
    "board": "Competitive",
    "description": "Online master batch for Tripura TET Paper-I with structured live lessons in CDP, Bengali, English, Mathematics, and EVS. Includes protected view-only digital notes and online mock tests.",
    "syllabusHighlights": [
      "Complete Child Development & Pedagogy Syllabus",
      "Languages & Mathematics Step-by-Step Training",
      "EVS & Pedagogical Problem Solving",
      "Online Timed Mock Tests & Performance Analytics",
      "Protected View-Only Digital Study Notes in Portal"
    ],
    "price": 3000,
    "monthlyFee": 800,
    "instalmentAvailable": true,
    "firstInstalment": 3000,
    "facultyId": "fac-g-shil",
    "facultyName": "Mr. G. Shil",
    "batchName": "TET-I Primary Online Batch",
    "batchSize": 60,
    "seatsAvailable": 60,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-11-10",
    "schedule": "Tue, Thu, Sat — 5:00 PM to 7:00 PM",
    "status": "Open for Admission",
    "featured": false,
    "linkedMaterialIds": [],
    "materialDelivery": "View-Only Softcopy"
  },
  {
    "id": "crs-tet-2-sci-offline",
    "name": "TET-II (SCIENCE) Upper Primary Preparation — Offline",
    "mode": "Offline",
    "category": "State Government Examinations",
    "subCategory": "Tripura TET (Paper II - Science)",
    "board": "Competitive",
    "description": "Specialized preparation for Upper Primary Science Teachers focusing on Science, Mathematics, CDP, Bengali, and English. Offline students receive comprehensive printed copies of class notes.",
    "syllabusHighlights": [
      "Rigorous Concept Clarity in Science & Mathematics",
      "CDP & Regional Languages (Bengali, English) Pedagogy",
      "Daily Problem Solving & Numerical Shortcuts",
      "Physical Printed Study Materials & OMR Mock Tests",
      "Personal Mentorship by Subject Specialists"
    ],
    "price": 4000,
    "monthlyFee": 1000,
    "instalmentAvailable": true,
    "firstInstalment": 4000,
    "facultyId": "fac-j-paul",
    "facultyName": "Mr. J. Paul",
    "batchName": "TET-II Science Offline Batch",
    "batchSize": 60,
    "seatsAvailable": 60,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-11-12",
    "schedule": "Tue, Thu, Sat — 8:00 AM to 10:30 AM",
    "status": "Open for Admission",
    "featured": true,
    "linkedMaterialIds": [],
    "materialDelivery": "Printed Physical Copies + View-Only Softcopy"
  },
  {
    "id": "crs-tet-2-sci-online",
    "name": "TET-II (SCIENCE) Upper Primary Preparation — Online",
    "mode": "Online",
    "category": "State Government Examinations",
    "subCategory": "Tripura TET (Paper II - Science)",
    "board": "Competitive",
    "description": "Online interactive batch for TET-II (Science & Maths) with deep conceptual coverage of Science, Mathematics, CDP, and Languages. Materials provided in view-only softcopy mode.",
    "syllabusHighlights": [
      "Rigorous Concept Clarity in Science & Math",
      "CDP & Languages Pedagogy Drills",
      "Daily Practice & Computer-Based Mock Tests",
      "Secure View-Only Digital Study Materials",
      "Online Doubt-Clearing Class Every Weekend"
    ],
    "price": 3000,
    "monthlyFee": 800,
    "instalmentAvailable": true,
    "firstInstalment": 3000,
    "facultyId": "fac-p-bhattacharjee",
    "facultyName": "Mr. P. Bhattacharjee",
    "batchName": "TET-II Science Online Batch",
    "batchSize": 60,
    "seatsAvailable": 60,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-11-12",
    "schedule": "Mon, Wed, Fri — 6:00 PM to 8:00 PM",
    "status": "Open for Admission",
    "featured": false,
    "linkedMaterialIds": [],
    "materialDelivery": "View-Only Softcopy"
  },
  {
    "id": "crs-tet-2-sst-offline",
    "name": "TET-II (SOCIAL STUDIES) Upper Primary Preparation — Offline",
    "mode": "Offline",
    "category": "State Government Examinations",
    "subCategory": "Tripura TET (Paper II - Social Studies)",
    "board": "Competitive",
    "description": "Targeted course for Upper Primary Social Studies Teachers recruitment covering CDP, Bengali, English, History, Geography, Political Science, and Subjective Pedagogy. Offline students receive printed physical notes.",
    "syllabusHighlights": [
      "In-depth Social Science Concept Reviews (History, Polity, Geography)",
      "Child Development & Pedagogy Mastery",
      "Daily Practice & OMR Mock Evaluation",
      "Physical Printed Study Materials & Map Work Notes",
      "Personalized Mentorship with Exam Strategies"
    ],
    "price": 4000,
    "monthlyFee": 1000,
    "instalmentAvailable": true,
    "firstInstalment": 4000,
    "facultyId": "fac-s-ghosh",
    "facultyName": "Mr. S. Ghosh",
    "batchName": "TET-II Social Studies Offline Batch",
    "batchSize": 60,
    "seatsAvailable": 60,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-11-15",
    "schedule": "Tue, Thu, Sat — 10:30 AM to 1:00 PM",
    "status": "Open for Admission",
    "featured": false,
    "linkedMaterialIds": [],
    "materialDelivery": "Printed Physical Copies + View-Only Softcopy"
  },
  {
    "id": "crs-tet-2-sst-online",
    "name": "TET-II (SOCIAL STUDIES) Upper Primary Preparation — Online",
    "mode": "Online",
    "category": "State Government Examinations",
    "subCategory": "Tripura TET (Paper II - Social Studies)",
    "board": "Competitive",
    "description": "Online batch for TET-II Social Studies teachers covering CDP, Bengali, English, and full Social Science syllabus. Includes digital view-only study notes and weekly mock tests.",
    "syllabusHighlights": [
      "In-depth Social Science Concept Reviews",
      "Subjective & Child Pedagogy Training",
      "Daily Practice & Online Mock Tests",
      "Secure View-Only Digital Study Materials",
      "Personalized Online Mentorship"
    ],
    "price": 3000,
    "monthlyFee": 800,
    "instalmentAvailable": true,
    "firstInstalment": 3000,
    "facultyId": "fac-s-banik",
    "facultyName": "Mr. S. Banik",
    "batchName": "TET-II Social Studies Online Batch",
    "batchSize": 60,
    "seatsAvailable": 60,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-11-15",
    "schedule": "Mon, Wed, Fri — 7:00 PM to 9:00 PM",
    "status": "Open for Admission",
    "featured": false,
    "linkedMaterialIds": [],
    "materialDelivery": "View-Only Softcopy"
  },
  {
    "id": "crs-stgt-sst-offline",
    "name": "STGT (Social Science) Complete Preparation — Offline",
    "mode": "Offline",
    "category": "State Government Examinations",
    "subCategory": "TRBT STGT (Social Science)",
    "board": "Competitive",
    "description": "Master the STGT (Social Science) examination with deep conceptual clarity in History, Political Science, Geography & Economics. Offline classroom students receive printed physical modules & notes.",
    "syllabusHighlights": [
      "Complete STGT Social Science Syllabus Coverage",
      "History, Political Science, Geography & Economics in Depth",
      "Map Work & Analytical Answer Structuring",
      "Physical Printed Study Materials & Model Test Papers",
      "State-Level Mock Tests & Individual Score Reviews"
    ],
    "price": 4000,
    "monthlyFee": 1000,
    "instalmentAvailable": true,
    "firstInstalment": 4000,
    "facultyId": "fac-s-ghosh",
    "facultyName": "Mr. S. Ghosh",
    "batchName": "STGT-SST Offline Batch",
    "batchSize": 60,
    "seatsAvailable": 60,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-11-18",
    "schedule": "Mon, Wed, Fri — 2:00 PM to 4:30 PM",
    "status": "Open for Admission",
    "featured": true,
    "linkedMaterialIds": [],
    "materialDelivery": "Printed Physical Copies + View-Only Softcopy"
  },
  {
    "id": "crs-stgt-sst-online",
    "name": "STGT (Social Science) Complete Preparation — Online",
    "mode": "Online",
    "category": "State Government Examinations",
    "subCategory": "TRBT STGT (Social Science)",
    "board": "Competitive",
    "description": "Live online coaching for TRBT STGT Social Science with interactive lectures, analytical discussions, and view-only digital notes library.",
    "syllabusHighlights": [
      "Complete STGT Social Science Syllabus",
      "Map Work & Analytical Study Drills",
      "Weekly Online Mock Tests & Rank Analysis",
      "Protected View-Only Digital Study Materials",
      "Direct Faculty Doubt-Clearing Forums"
    ],
    "price": 3000,
    "monthlyFee": 800,
    "instalmentAvailable": true,
    "firstInstalment": 3000,
    "facultyId": "fac-s-banik",
    "facultyName": "Mr. S. Banik",
    "batchName": "STGT-SST Online Batch",
    "batchSize": 60,
    "seatsAvailable": 60,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-11-18",
    "schedule": "Tue, Thu, Sat — 7:00 PM to 9:00 PM",
    "status": "Open for Admission",
    "featured": false,
    "linkedMaterialIds": [],
    "materialDelivery": "View-Only Softcopy"
  },
  {
    "id": "crs-stgt-pure-sci-offline",
    "name": "STGT (Pure Science) Complete Preparation — Offline",
    "mode": "Offline",
    "category": "State Government Examinations",
    "subCategory": "TRBT STGT (Pure Science)",
    "board": "Competitive",
    "description": "Rigorous preparation program focused on Physics, Chemistry and Mathematics for Graduate Science Teachers with problem-solving shortcuts. Offline students get physical printed notes.",
    "syllabusHighlights": [
      "Physics, Chemistry & Mathematics Graduate Level Coverage",
      "Numerical Shortcut Techniques & Derivation Clarity",
      "Foundational Theorem Mastery & Practice Worksheets",
      "Physical Printed Study Materials & OMR Mock Papers",
      "Personal Mentorship by Engineering & Science Faculty"
    ],
    "price": 4000,
    "monthlyFee": 1000,
    "instalmentAvailable": true,
    "firstInstalment": 4000,
    "facultyId": "fac-p-bhattacharjee",
    "facultyName": "Mr. P. Bhattacharjee",
    "batchName": "STGT-Pure Science Offline Batch",
    "batchSize": 60,
    "seatsAvailable": 60,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-11-20",
    "schedule": "Tue, Thu, Sat — 2:00 PM to 4:30 PM",
    "status": "Open for Admission",
    "featured": false,
    "linkedMaterialIds": [],
    "materialDelivery": "Printed Physical Copies + View-Only Softcopy"
  },
  {
    "id": "crs-stgt-pure-sci-online",
    "name": "STGT (Pure Science) Complete Preparation — Online",
    "mode": "Online",
    "category": "State Government Examinations",
    "subCategory": "TRBT STGT (Pure Science)",
    "board": "Competitive",
    "description": "Comprehensive online batch for STGT Pure Science (Physics, Chemistry, Maths) with live problem-solving sessions and secure view-only digital study notes.",
    "syllabusHighlights": [
      "Physics, Chemistry & Mathematics High-Yield Concepts",
      "Numerical Shortcut Techniques & Formula Mastery",
      "Foundational Theorem Clarity & Practice Drills",
      "Protected View-Only Digital Study Materials",
      "Regular Online Assessments & Error Diagnosis"
    ],
    "price": 3000,
    "monthlyFee": 800,
    "instalmentAvailable": true,
    "firstInstalment": 3000,
    "facultyId": "fac-j-paul",
    "facultyName": "Mr. J. Paul",
    "batchName": "STGT-Pure Science Online Batch",
    "batchSize": 60,
    "seatsAvailable": 60,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-11-20",
    "schedule": "Mon, Wed, Fri — 5:00 PM to 7:00 PM",
    "status": "Open for Admission",
    "featured": false,
    "linkedMaterialIds": [],
    "materialDelivery": "View-Only Softcopy"
  },
  {
    "id": "crs-stgt-bio-sci-offline",
    "name": "STGT (Biological Science) Complete Preparation — Offline",
    "mode": "Offline",
    "category": "State Government Examinations",
    "subCategory": "TRBT STGT (Biological Science)",
    "board": "Competitive",
    "description": "Specialized STGT course offering in-depth understanding of Botany, Zoology, Physiology and allied life sciences through structured lessons. Offline students receive printed physical modules & diagrams.",
    "syllabusHighlights": [
      "In-Depth Botany, Zoology & Human Physiology",
      "Diagram-Oriented Learning & Classification Systems",
      "Regular Classroom Practice Tests & Question Drills",
      "Physical Printed Study Materials & Revision Booklets",
      "Experienced Faculty Guidance for State Rank Aspirants"
    ],
    "price": 4000,
    "monthlyFee": 1000,
    "instalmentAvailable": true,
    "firstInstalment": 4000,
    "facultyId": "fac-s-majumder",
    "facultyName": "Miss. S. Majumder",
    "batchName": "STGT-Bio Science Offline Batch",
    "batchSize": 60,
    "seatsAvailable": 60,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-11-22",
    "schedule": "Mon, Wed, Fri — 11:00 AM to 1:30 PM",
    "status": "Open for Admission",
    "featured": false,
    "linkedMaterialIds": [],
    "materialDelivery": "Printed Physical Copies + View-Only Softcopy"
  },
  {
    "id": "crs-stgt-bio-sci-online",
    "name": "STGT (Biological Science) Complete Preparation — Online",
    "mode": "Online",
    "category": "State Government Examinations",
    "subCategory": "TRBT STGT (Biological Science)",
    "board": "Competitive",
    "description": "Online specialized batch for TRBT STGT Biological Science with live visual diagrams, comprehensive botany and zoology modules, and view-only digital reading materials.",
    "syllabusHighlights": [
      "Botany, Zoology & Physiology Syllabus Mastery",
      "Diagram-Oriented Visual Lessons & High-Yield MCQs",
      "Regular Practice Tests with Detailed Solutions",
      "Protected View-Only Digital Study Materials",
      "Interactive Doubt Sessions & Concept Revisions"
    ],
    "price": 3000,
    "monthlyFee": 800,
    "instalmentAvailable": true,
    "firstInstalment": 3000,
    "facultyId": "fac-p-bhattacharjee",
    "facultyName": "Mr. P. Bhattacharjee",
    "batchName": "STGT-Bio Science Online Batch",
    "batchSize": 60,
    "seatsAvailable": 60,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-11-22",
    "schedule": "Tue, Thu, Sat — 5:30 PM to 7:30 PM",
    "status": "Open for Admission",
    "featured": false,
    "linkedMaterialIds": [],
    "materialDelivery": "View-Only Softcopy"
  },
  {
    "id": "crs-jrbt-offline",
    "name": "JRBT GROUP-C & GROUP-D Complete Preparation — Offline",
    "mode": "Offline",
    "category": "State Government Examinations",
    "subCategory": "JRBT (Group C & D)",
    "board": "Competitive",
    "description": "Preparation for Joint Recruitment Board Tripura exams covering General Awareness, English, Quantitative Aptitude, and Interview guidance. Includes printed physical notes for offline students.",
    "syllabusHighlights": [
      "High-Yield Tripura GK, North-East Affairs & Current Events",
      "General English, Grammar & Comprehension",
      "Basic Numerical Ability & Everyday Reasoning",
      "Physical Printed Study Materials & OMR Practice Papers",
      "Personality Test & Mock Interview Guidance"
    ],
    "price": 3000,
    "monthlyFee": 800,
    "instalmentAvailable": true,
    "firstInstalment": 3000,
    "facultyId": "fac-p-ghosh",
    "facultyName": "Mr. P. Ghosh",
    "batchName": "JRBT Offline Target Batch",
    "batchSize": 60,
    "seatsAvailable": 60,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-11-25",
    "schedule": "Mon, Wed, Fri — 8:00 AM to 10:00 AM",
    "status": "Open for Admission",
    "featured": true,
    "linkedMaterialIds": [],
    "materialDelivery": "Printed Physical Copies + View-Only Softcopy"
  },
  {
    "id": "crs-jrbt-online",
    "name": "JRBT GROUP-C & GROUP-D Complete Preparation — Online",
    "mode": "Online",
    "category": "State Government Examinations",
    "subCategory": "JRBT (Group C & D)",
    "board": "Competitive",
    "description": "Live online preparation for JRBT Group-C and Group-D with exam-focused GK, English, and Aptitude drills. Protected view-only digital notes included in portal.",
    "syllabusHighlights": [
      "GK & Current Affairs Focus with Daily Quizzes",
      "General English & Aptitude Shortcut Techniques",
      "Online Mock Tests & Speed Improvement Drills",
      "Protected View-Only Digital Study Notes",
      "Personality Test & Interview Guidance Sessions"
    ],
    "price": 2000,
    "monthlyFee": 600,
    "instalmentAvailable": true,
    "firstInstalment": 2000,
    "facultyId": "fac-s-majumder",
    "facultyName": "Miss. S. Majumder",
    "batchName": "JRBT Online Evening Batch",
    "batchSize": 60,
    "seatsAvailable": 60,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-11-25",
    "schedule": "Tue, Thu, Sat — 6:00 PM to 8:00 PM",
    "status": "Open for Admission",
    "featured": false,
    "linkedMaterialIds": [],
    "materialDelivery": "View-Only Softcopy"
  },
  {
    "id": "crs-high-court-offline",
    "name": "HIGH COURT EXAMS Complete Preparation — Offline",
    "mode": "Offline",
    "category": "State Government Examinations",
    "subCategory": "High Court Recruitment",
    "board": "Competitive",
    "description": "Focused training for High Court recruitment with emphasis on Legal Aptitude, General English, and structured mock evaluations. Offline students receive printed physical modules & mock papers.",
    "syllabusHighlights": [
      "Legal Aptitude & Constitutional Overview",
      "Advanced General English, Precis & Comprehension",
      "General Knowledge, Computer Knowledge & Aptitude",
      "Physical Printed Study Materials & Case Notes",
      "Structured Mock Evaluations & Expert Mentorship"
    ],
    "price": 3000,
    "monthlyFee": 800,
    "instalmentAvailable": true,
    "firstInstalment": 3000,
    "facultyId": "fac-popi-ghosh",
    "facultyName": "Mrs. Popi Ghosh",
    "batchName": "High Court Offline Law Batch",
    "batchSize": 50,
    "seatsAvailable": 50,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-11-28",
    "schedule": "Tue, Thu, Sat — 11:00 AM to 1:00 PM",
    "status": "Open for Admission",
    "featured": false,
    "linkedMaterialIds": [],
    "materialDelivery": "Printed Physical Copies + View-Only Softcopy"
  },
  {
    "id": "crs-high-court-online",
    "name": "HIGH COURT EXAMS Complete Preparation — Online",
    "mode": "Online",
    "category": "State Government Examinations",
    "subCategory": "High Court Recruitment",
    "board": "Competitive",
    "description": "Online coaching for High Court exams focusing on legal reasoning, English drafting, and general awareness. Includes protected view-only digital notes and mock tests.",
    "syllabusHighlights": [
      "Legal Aptitude & General English Focus",
      "Concept Clarity & Legal Terminology Drills",
      "Online Mock Evaluations & Feedback",
      "Protected View-Only Digital Study Materials",
      "Expert Mentorship & Doubt Sessions"
    ],
    "price": 2000,
    "monthlyFee": 800,
    "instalmentAvailable": true,
    "firstInstalment": 2000,
    "facultyId": "fac-s-banik",
    "facultyName": "Mr. S. Banik",
    "batchName": "High Court Online Live Batch",
    "batchSize": 50,
    "seatsAvailable": 50,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-11-28",
    "schedule": "Mon, Wed, Fri — 6:30 PM to 8:30 PM",
    "status": "Open for Admission",
    "featured": false,
    "linkedMaterialIds": [],
    "materialDelivery": "View-Only Softcopy"
  },
  {
    "id": "crs-forester-offline",
    "name": "FORESTER AND FOREST GUARD Complete Preparation — Offline",
    "mode": "Offline",
    "category": "State Government Examinations",
    "subCategory": "Tripura Forest Department",
    "board": "Competitive",
    "description": "Structured preparation for Forester & Forest Guard exams including General Intelligence, Elementary Math, Environmental Science, and PST guidance. Printed physical notes included for offline students.",
    "syllabusHighlights": [
      "General Knowledge, North-East Flora/Fauna & Environment",
      "Elementary Mathematics & General Intelligence",
      "General Science & Forestry Fundamentals",
      "Physical Standard Test (PST) Strategy & Tips",
      "Physical Printed Study Materials & OMR Mock Tests"
    ],
    "price": 3000,
    "monthlyFee": 800,
    "instalmentAvailable": true,
    "firstInstalment": 3000,
    "facultyId": "fac-p-bhattacharjee",
    "facultyName": "Mr. P. Bhattacharjee",
    "batchName": "Forest Guard Offline Target Batch",
    "batchSize": 50,
    "seatsAvailable": 50,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-12-01",
    "schedule": "Mon, Wed, Fri — 2:30 PM to 4:30 PM",
    "status": "Open for Admission",
    "featured": false,
    "linkedMaterialIds": [],
    "materialDelivery": "Printed Physical Copies + View-Only Softcopy"
  },
  {
    "id": "crs-forester-online",
    "name": "FORESTER AND FOREST GUARD Complete Preparation — Online",
    "mode": "Online",
    "category": "State Government Examinations",
    "subCategory": "Tripura Forest Department",
    "board": "Competitive",
    "description": "Live online course for Forester and Forest Guard competitive recruitment with daily science, math, and GK sessions. Includes protected view-only digital notes and online mock tests.",
    "syllabusHighlights": [
      "GK, Science & Environmental Studies Focus",
      "Elementary Arithmetic & Reasoning Drills",
      "Physical Standard Test (PST) Strategy Guidance",
      "Protected View-Only Digital Study Materials",
      "Online Mock Tests with Instant Result Breakdown"
    ],
    "price": 2000,
    "monthlyFee": 600,
    "instalmentAvailable": true,
    "firstInstalment": 2000,
    "facultyId": "fac-s-majumder",
    "facultyName": "Miss. S. Majumder",
    "batchName": "Forest Guard Online Evening Batch",
    "batchSize": 50,
    "seatsAvailable": 50,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-12-01",
    "schedule": "Tue, Thu, Sat — 5:00 PM to 7:00 PM",
    "status": "Open for Admission",
    "featured": false,
    "linkedMaterialIds": [],
    "materialDelivery": "View-Only Softcopy"
  },
  {
    "id": "crs-ssc-cgl-offline",
    "name": "SSC-CGL (Combined Graduate Level) — Offline",
    "mode": "Offline",
    "category": "Central Government Examinations",
    "subCategory": "SSC (Staff Selection Commission)",
    "board": "Competitive",
    "description": "All-inclusive Tier-I & Tier-II training covering Quantitative Aptitude, English, Reasoning, and General Awareness. Enrolled offline candidates receive physical printed copies of notes & formula compendiums.",
    "syllabusHighlights": [
      "Comprehensive Tier-I & Tier-II Syllabus Coverage",
      "Shortcut Methods for Quantitative Aptitude & DI",
      "High-Speed Reasoning & English Comprehension",
      "Physical Printed Study Materials & Formula Sheets",
      "Computer-Based Mock Tests in Campus Lab"
    ],
    "price": 5000,
    "monthlyFee": 1000,
    "instalmentAvailable": true,
    "firstInstalment": 5000,
    "facultyId": "fac-p-ghosh",
    "facultyName": "Mr. P. Ghosh",
    "batchName": "SSC-CGL Offline Target Batch",
    "batchSize": 50,
    "seatsAvailable": 50,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-11-05",
    "schedule": "Tue, Thu, Sat — 10:00 AM to 12:30 PM",
    "status": "Open for Admission",
    "featured": true,
    "linkedMaterialIds": [],
    "materialDelivery": "Printed Physical Copies + View-Only Softcopy"
  },
  {
    "id": "crs-ssc-cgl-online",
    "name": "SSC-CGL (Combined Graduate Level) — Online",
    "mode": "Online",
    "category": "Central Government Examinations",
    "subCategory": "SSC (Staff Selection Commission)",
    "board": "Competitive",
    "description": "Interactive online batch for SSC CGL Tier-I and Tier-II with top shortcut techniques, regular mock drills, and secure view-only digital study materials.",
    "syllabusHighlights": [
      "Complete Tier-I & Tier-II Coverage by Expert Mentors",
      "Shortcut Methods for Quant, Algebra & Trigonometry",
      "Computer-Based Mock Tests with All-India Percentile",
      "Protected View-Only Digital Study Materials",
      "Daily Doubt Solving & Live Problem Breakdown"
    ],
    "price": 4000,
    "monthlyFee": 800,
    "instalmentAvailable": true,
    "firstInstalment": 4000,
    "facultyId": "fac-p-bhattacharjee",
    "facultyName": "Mr. P. Bhattacharjee",
    "batchName": "SSC-CGL Online Live Batch",
    "batchSize": 50,
    "seatsAvailable": 50,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-11-05",
    "schedule": "Mon, Wed, Fri — 6:00 PM to 8:30 PM",
    "status": "Open for Admission",
    "featured": true,
    "linkedMaterialIds": [],
    "materialDelivery": "View-Only Softcopy"
  },
  {
    "id": "crs-ssc-chsl-offline",
    "name": "SSC-CHSL (Combined Higher Secondary Level) — Offline",
    "mode": "Offline",
    "category": "Central Government Examinations",
    "subCategory": "SSC (Staff Selection Commission)",
    "board": "Competitive",
    "description": "Targeted 10+2 level exam training covering General Science, Quantitative Techniques, Reasoning, and English language skills. Printed physical notes provided for offline students.",
    "syllabusHighlights": [
      "Speed & Accuracy Drills for Quant & Reasoning",
      "Comprehensive Syllabus Coverage for 10+2 Level",
      "English Vocabulary, Grammar & Error Spotting",
      "Physical Printed Study Materials & Revision Worksheets",
      "Daily In-Class Mock Tests & Doubt Clearing"
    ],
    "price": 5000,
    "monthlyFee": 1000,
    "instalmentAvailable": true,
    "firstInstalment": 5000,
    "facultyId": "fac-p-ghosh",
    "facultyName": "Mr. P. Ghosh",
    "batchName": "SSC-CHSL Offline Batch",
    "batchSize": 50,
    "seatsAvailable": 50,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-11-10",
    "schedule": "Mon, Wed, Fri — 10:30 AM to 1:00 PM",
    "status": "Open for Admission",
    "featured": false,
    "linkedMaterialIds": [],
    "materialDelivery": "Printed Physical Copies + View-Only Softcopy"
  },
  {
    "id": "crs-ssc-chsl-online",
    "name": "SSC-CHSL (Combined Higher Secondary Level) — Online",
    "mode": "Online",
    "category": "Central Government Examinations",
    "subCategory": "SSC (Staff Selection Commission)",
    "board": "Competitive",
    "description": "Live online coaching for SSC CHSL with speed calculation shortcuts, English comprehension, and view-only digital materials in portal.",
    "syllabusHighlights": [
      "Speed & Accuracy Drills for 10+2 Aspirants",
      "Comprehensive Tier-I & Tier-II Syllabus Coverage",
      "Daily Online Mock Tests & Rank Diagnosis",
      "Protected View-Only Digital Study Notes",
      "Live Interactive Doubt Clearing Sessions"
    ],
    "price": 4000,
    "monthlyFee": 800,
    "instalmentAvailable": true,
    "firstInstalment": 4000,
    "facultyId": "fac-popi-ghosh",
    "facultyName": "Mrs. Popi Ghosh",
    "batchName": "SSC-CHSL Online Batch",
    "batchSize": 50,
    "seatsAvailable": 50,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-11-10",
    "schedule": "Tue, Thu, Sat — 6:30 PM to 8:30 PM",
    "status": "Open for Admission",
    "featured": false,
    "linkedMaterialIds": [],
    "materialDelivery": "View-Only Softcopy"
  },
  {
    "id": "crs-ssc-gd-offline",
    "name": "SSC-GD (General Duty Constable) — Offline",
    "mode": "Offline",
    "category": "Central Government Examinations",
    "subCategory": "SSC (Staff Selection Commission)",
    "board": "Competitive",
    "description": "High-intensity course covering Basic Mathematics, Reasoning, English, General Awareness, and Physical Efficiency Test (PET) guidance. Printed physical notes included for offline students.",
    "syllabusHighlights": [
      "Complete Written Exam Syllabus Coverage",
      "Basic Mathematics, Reasoning & General Awareness",
      "Physical Efficiency Test (PET) Strategy & Guidance",
      "Physical Printed Study Materials & OMR Practice",
      "Daily Practice Tests with Faculty Support"
    ],
    "price": 4000,
    "monthlyFee": 800,
    "instalmentAvailable": true,
    "firstInstalment": 4000,
    "facultyId": "fac-p-ghosh",
    "facultyName": "Mr. P. Ghosh",
    "batchName": "SSC-GD Offline Warriors Batch",
    "batchSize": 60,
    "seatsAvailable": 60,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-11-15",
    "schedule": "Tue, Thu, Sat — 8:00 AM to 10:00 AM",
    "status": "Open for Admission",
    "featured": false,
    "linkedMaterialIds": [],
    "materialDelivery": "Printed Physical Copies + View-Only Softcopy"
  },
  {
    "id": "crs-ssc-gd-online",
    "name": "SSC-GD (General Duty Constable) — Online",
    "mode": "Online",
    "category": "Central Government Examinations",
    "subCategory": "SSC (Staff Selection Commission)",
    "board": "Competitive",
    "description": "Online coaching for SSC GD Constable covering fundamental math, reasoning, Hindi/English, and general awareness with view-only digital notes and CBT mock exams.",
    "syllabusHighlights": [
      "Comprehensive Syllabus Coverage for Constable Aspirants",
      "PET Strategy, Physical Standard Tips & Medical Guidance",
      "Daily Practice Tests & Sectional Quizzes",
      "Protected View-Only Digital Study Materials",
      "Expert Mentorship & Regular Motivation Sessions"
    ],
    "price": 3000,
    "monthlyFee": 600,
    "instalmentAvailable": true,
    "firstInstalment": 3000,
    "facultyId": "fac-p-bhattacharjee",
    "facultyName": "Mr. P. Bhattacharjee",
    "batchName": "SSC-GD Online Evening Batch",
    "batchSize": 60,
    "seatsAvailable": 60,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-11-15",
    "schedule": "Mon, Wed, Fri — 5:00 PM to 7:00 PM",
    "status": "Open for Admission",
    "featured": false,
    "linkedMaterialIds": [],
    "materialDelivery": "View-Only Softcopy"
  },
  {
    "id": "crs-ssc-mts-offline",
    "name": "SSC-MTS (Multi-Tasking Staff) — Offline",
    "mode": "Offline",
    "category": "Central Government Examinations",
    "subCategory": "SSC (Staff Selection Commission)",
    "board": "Competitive",
    "description": "Structured preparation focused on Numerical Ability, Reasoning, English, and General Awareness tailored to the latest pattern. Includes printed physical notes for offline students.",
    "syllabusHighlights": [
      "Basic Concept Simplification for Maximum Scoring",
      "Intensive Mock Tests on Latest Exam Interface",
      "English Language & General Awareness Shortcuts",
      "Physical Printed Study Materials Included",
      "Focused Practice Drills & Weekly Doubt Clearing"
    ],
    "price": 4000,
    "monthlyFee": 800,
    "instalmentAvailable": true,
    "firstInstalment": 4000,
    "facultyId": "fac-p-ghosh",
    "facultyName": "Mr. P. Ghosh",
    "batchName": "SSC-MTS Offline Batch",
    "batchSize": 60,
    "seatsAvailable": 60,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-11-18",
    "schedule": "Mon, Wed, Fri — 2:00 PM to 4:00 PM",
    "status": "Open for Admission",
    "featured": false,
    "linkedMaterialIds": [],
    "materialDelivery": "Printed Physical Copies + View-Only Softcopy"
  },
  {
    "id": "crs-ssc-mts-online",
    "name": "SSC-MTS (Multi-Tasking Staff) — Online",
    "mode": "Online",
    "category": "Central Government Examinations",
    "subCategory": "SSC (Staff Selection Commission)",
    "board": "Competitive",
    "description": "Live online course for SSC MTS with simplified mathematical concepts, reasoning drills, and secure view-only digital notes in portal.",
    "syllabusHighlights": [
      "Basic Concept Simplification & High-Yield Formulas",
      "Intensive Mock Tests with Instant Result Breakdown",
      "Focused Practice in General English & Awareness",
      "Protected View-Only Digital Study Notes",
      "Regular Performance Feedback from Mentors"
    ],
    "price": 3000,
    "monthlyFee": 600,
    "instalmentAvailable": true,
    "firstInstalment": 3000,
    "facultyId": "fac-popi-ghosh",
    "facultyName": "Mrs. Popi Ghosh",
    "batchName": "SSC-MTS Online Batch",
    "batchSize": 60,
    "seatsAvailable": 60,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-11-18",
    "schedule": "Tue, Thu, Sat — 5:00 PM to 7:00 PM",
    "status": "Open for Admission",
    "featured": false,
    "linkedMaterialIds": [],
    "materialDelivery": "View-Only Softcopy"
  },
  {
    "id": "crs-rrb-group-c-d-offline",
    "name": "RRB GROUP-C & GROUP-D Complete Preparation — Offline",
    "mode": "Offline",
    "category": "Central Government Examinations",
    "subCategory": "Railway Recruitment (RRB)",
    "board": "Competitive",
    "description": "Dedicated Railway recruitment preparation covering Mathematics, General Intelligence & Reasoning, General Science, and Current Affairs. Includes printed physical notes for offline students.",
    "syllabusHighlights": [
      "Comprehensive General Science & Physics/Chemistry/Bio",
      "Technical & Non-Technical Aptitude Mastery",
      "Fast Calculation Shortcuts for Railway Exams",
      "Physical Printed Study Materials Included",
      "Computer-Based Mock Tests in Campus Testing Lab"
    ],
    "price": 5000,
    "monthlyFee": 1000,
    "instalmentAvailable": true,
    "firstInstalment": 5000,
    "facultyId": "fac-p-bhattacharjee",
    "facultyName": "Mr. P. Bhattacharjee",
    "batchName": "RRB Group-C & D Offline Batch",
    "batchSize": 50,
    "seatsAvailable": 50,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-11-20",
    "schedule": "Tue, Thu, Sat — 10:30 AM to 1:00 PM",
    "status": "Open for Admission",
    "featured": true,
    "linkedMaterialIds": [],
    "materialDelivery": "Printed Physical Copies + View-Only Softcopy"
  },
  {
    "id": "crs-rrb-group-c-d-online",
    "name": "RRB GROUP-C & GROUP-D Complete Preparation — Online",
    "mode": "Online",
    "category": "Central Government Examinations",
    "subCategory": "Railway Recruitment (RRB)",
    "board": "Competitive",
    "description": "Live online course for Railway RRB Group-C & Group-D with emphasis on general science, calculations, and CBT testing. View-only softcopy notes included.",
    "syllabusHighlights": [
      "General Science & Technical Aptitude Focus",
      "Computer-Based Mock Tests (CBT Pattern)",
      "Practice Drills & Speed Mathematics",
      "Protected View-Only Digital Study Materials",
      "Dedicated Mentor Guidance for Railway Aspirants"
    ],
    "price": 4000,
    "monthlyFee": 800,
    "instalmentAvailable": true,
    "firstInstalment": 4000,
    "facultyId": "fac-p-ghosh",
    "facultyName": "Mr. P. Ghosh",
    "batchName": "RRB Group-C & D Online Batch",
    "batchSize": 50,
    "seatsAvailable": 50,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-11-20",
    "schedule": "Mon, Wed, Fri — 6:30 PM to 8:30 PM",
    "status": "Open for Admission",
    "featured": false,
    "linkedMaterialIds": [],
    "materialDelivery": "View-Only Softcopy"
  },
  {
    "id": "crs-rrb-ntpc-offline",
    "name": "RRB-NTPC (Non-Technical Popular Categories) — Offline",
    "mode": "Offline",
    "category": "Central Government Examinations",
    "subCategory": "Railway Recruitment (RRB)",
    "board": "Competitive",
    "description": "Meticulous coaching for CBT-1 and CBT-2 exams covering Quantitative Techniques, Reasoning shortcuts, and General Awareness. Printed physical notes included for offline students.",
    "syllabusHighlights": [
      "CBT-1 & CBT-2 Complete Syllabus Coverage",
      "Quantitative & Reasoning Shortcuts and Time Management",
      "General Awareness, Static GK & Indian Railways Facts",
      "Physical Printed Study Materials & OMR Workbooks",
      "Daily Practice Tests & Computer Lab CBT Practice"
    ],
    "price": 4000,
    "monthlyFee": 800,
    "instalmentAvailable": true,
    "firstInstalment": 4000,
    "facultyId": "fac-p-bhattacharjee",
    "facultyName": "Mr. P. Bhattacharjee",
    "batchName": "RRB-NTPC Offline Batch",
    "batchSize": 50,
    "seatsAvailable": 50,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-11-25",
    "schedule": "Mon, Wed, Fri — 10:30 AM to 1:00 PM",
    "status": "Open for Admission",
    "featured": false,
    "linkedMaterialIds": [],
    "materialDelivery": "Printed Physical Copies + View-Only Softcopy"
  },
  {
    "id": "crs-rrb-ntpc-online",
    "name": "RRB-NTPC (Non-Technical Popular Categories) — Online",
    "mode": "Online",
    "category": "Central Government Examinations",
    "subCategory": "Railway Recruitment (RRB)",
    "board": "Competitive",
    "description": "Online coaching for RRB NTPC CBT-1 & CBT-2 with live video sessions, speed arithmetic, and protected view-only digital notes.",
    "syllabusHighlights": [
      "CBT-1 & CBT-2 Complete Syllabus Coverage",
      "Quantitative & Reasoning Shortcuts",
      "Daily Practice Tests & Negative Marking Diagnosis",
      "Protected View-Only Digital Study Notes",
      "Weekly Live Mentor Doubt Classes"
    ],
    "price": 3000,
    "monthlyFee": 600,
    "instalmentAvailable": true,
    "firstInstalment": 3000,
    "facultyId": "fac-p-ghosh",
    "facultyName": "Mr. P. Ghosh",
    "batchName": "RRB-NTPC Online Batch",
    "batchSize": 50,
    "seatsAvailable": 50,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-11-25",
    "schedule": "Tue, Thu, Sat — 6:00 PM to 8:00 PM",
    "status": "Open for Admission",
    "featured": false,
    "linkedMaterialIds": [],
    "materialDelivery": "View-Only Softcopy"
  },
  {
    "id": "crs-banking-offline",
    "name": "BANKING (IBPS/SBI/RBI - PO & Clerk) — Offline",
    "mode": "Offline",
    "category": "Central Government Examinations",
    "subCategory": "Banking Examinations",
    "board": "Competitive",
    "description": "Rigorous Prelims and Mains preparation covering Quant, Reasoning, English, Banking/Economic Awareness, and Computer Aptitude. Printed physical study materials & notes included for offline students.",
    "syllabusHighlights": [
      "Comprehensive Prelims & Mains Focus for PO & Clerk",
      "High-Speed Vedic Math & Data Interpretation (DI)",
      "Complex Logical Puzzles, Seating & Syllogisms",
      "Physical Printed Study Materials & Daily Speed Drills",
      "Banking & Financial Awareness, Group Discussion & Interview Prep"
    ],
    "price": 5000,
    "monthlyFee": 1000,
    "instalmentAvailable": true,
    "firstInstalment": 5000,
    "facultyId": "fac-p-bhattacharjee",
    "facultyName": "Mr. P. Bhattacharjee",
    "batchName": "Banker-2026 Elite Offline Batch",
    "batchSize": 50,
    "seatsAvailable": 50,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-11-28",
    "schedule": "Tue, Thu, Sat — 10:00 AM to 1:00 PM",
    "status": "Open for Admission",
    "featured": true,
    "linkedMaterialIds": [],
    "materialDelivery": "Printed Physical Copies + View-Only Softcopy"
  },
  {
    "id": "crs-banking-online",
    "name": "BANKING (IBPS/SBI/RBI - PO & Clerk) — Online",
    "mode": "Online",
    "category": "Central Government Examinations",
    "subCategory": "Banking Examinations",
    "board": "Competitive",
    "description": "Online master coaching for IBPS, SBI & RBI PO/Clerk exams with daily speed mock tests, sectional time management, and view-only digital notes library.",
    "syllabusHighlights": [
      "Prelims & Mains Complete Focus & Strategy",
      "Speed-Test Mock Sessions with Sectional Timers",
      "Banking & Financial Awareness Drills",
      "Protected View-Only Digital Study Materials",
      "Group Discussion & Interview Preparation Webinars"
    ],
    "price": 4000,
    "monthlyFee": 800,
    "instalmentAvailable": true,
    "firstInstalment": 4000,
    "facultyId": "fac-popi-ghosh",
    "facultyName": "Mrs. Popi Ghosh",
    "batchName": "Banker-2026 Online Live Batch",
    "batchSize": 50,
    "seatsAvailable": 50,
    "waitingListCount": 0,
    "duration": "1 Year",
    "startDate": "2026-11-28",
    "schedule": "Mon, Wed, Fri — 6:00 PM to 8:30 PM",
    "status": "Open for Admission",
    "featured": true,
    "linkedMaterialIds": [],
    "materialDelivery": "View-Only Softcopy"
  }
],

  achievements: [
    {
      id: 'ach-1',
      name: 'Srabani Chakraborty',
      exam: 'Tripura TET Paper-II (TRBT)',
      rank: 'State Rank 04 (Score: 134/150)',
      year: '2025',
      photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
      quote: 'C.G.A’s Child Development & Pedagogy modules and weekly OMR mocks made all the difference.',
      category: 'Teaching and Recruitment Exams',
    },
    {
      id: 'ach-2',
      name: 'Subhajit Banik',
      exam: 'TRBT STGT (Social Studies)',
      rank: 'State Rank 07',
      year: '2025',
      photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
      quote: 'The paid notes and personal mentorship at Udaipur campus helped me clear STGT in my very first attempt.',
      category: 'Teaching and Recruitment Exams',
    },
    {
      id: 'ach-3',
      name: 'Dipankar Das',
      exam: 'TPSC Combined Competitive Exam',
      rank: 'State Rank 11',
      year: '2025',
      photo: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=400&auto=format&fit=crop&q=80',
      quote: 'Bikramjit Sir’s Tripura GK & Polity classes are gold standard for any serious TPSC aspirant.',
      category: 'Teaching and Recruitment Exams',
    },
    {
      id: 'ach-4',
      name: 'Moumita Paul',
      exam: 'JRBT Group-C (LDC Examination)',
      rank: 'District Topper (Rank 02)',
      year: '2024',
      photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
      quote: 'Regular mock tests and interview guidance at C.G.A gave me huge confidence.',
      category: 'Teaching and Recruitment Exams',
    },
    {
      id: 'ach-5',
      name: 'Prasenjit Sarkar',
      exam: 'IBPS PO & Tripura Gramin Bank',
      rank: 'Selected — Probationary Officer',
      year: '2025',
      photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80',
      quote: 'Speed maths and puzzle-solving sessions at C.G.A helped me clear both IBPS PO and RRB Officer Scale-I.',
      category: 'Banking, SSC and Railway',
    },
    {
      id: 'ach-6',
      name: 'Ananya Saha',
      exam: 'TBSE Madhyamik (Class X Board)',
      rank: '97.2% — State Merit List (Rank 06)',
      year: '2025',
      photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
      quote: 'Scored 100/100 in Mathematics and 98 in Physical Science thanks to C.G.A’s TBSE Madhyamik batch.',
      category: 'School Coaching',
    },
    {
      id: 'ach-7',
      name: 'Rohan Debnath',
      exam: 'CBSE Class X All-India Secondary Exam',
      rank: '98.0% — Gomati District CBSE Topper',
      year: '2025',
      photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
      quote: 'C.G.A’s competency-based NCERT worksheets and Pre-Board test series prepared me for every tricky question.',
      category: 'School Coaching',
    },
    {
      id: 'ach-8',
      name: 'Tanmoy Ghosh',
      exam: 'SSC CGL (Tier I & II) & RRB NTPC',
      rank: 'AIR 418 (Preventive Officer)',
      year: '2025',
      photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
      quote: 'You don’t need to travel outside Tripura when Career Guidance Academy in Udaipur provides national-level coaching.',
      category: 'Banking, SSC and Railway',
    },
  ],

  studyMaterials: [
    {
      id: 'mat-1',
      title: 'Child Development & Pedagogy (CDP) Master Compendium — TRBT TET & STGT',
      courseId: 'crs-tet-1',
      courseName: 'Tripura TET (Paper I & II) Integrated Target Batch',
      type: 'Book PDF',
      author: 'Dr. Subrata Majumder (C.G.A Publication)',
      pages: 214,
      fileSize: '6.8 MB',
      uploadedDate: '2026-09-10',
      description:
        'Complete syllabus textbook covering Piaget, Vygotsky, Kohlberg, Inclusive Education, RTE Act 2009, NEP 2020, and 800+ TRBT Previous Year & Model MCQs.',
      previewSections: [
        {
          heading: 'Unit 1: Concept of Development and Its Relationship with Learning',
          body: 'Development refers to qualitative and quantitative changes in an individual from conception to maturity. Key principles evaluated in Tripura TET Paper-I & II include:\n• Principle of Continuity & Sequentiality (Cephalocaudal and Proximodistal sequences)\n• Interaction of Heredity and Environment (Nature vs. Nurture)\n• Jean Piaget’s Four Stages of Cognitive Development: Sensorimotor (0–2 yrs), Pre-operational (2–7 yrs), Concrete Operational (7–11 yrs), and Formal Operational (11+ yrs).',
        },
        {
          heading: 'Unit 2: Lev Vygotsky’s Socio-Cultural Theory & ZPD',
          body: 'Vygotsky emphasized that social interaction precedes cognitive development. Key concepts for TRBT examination:\n1. Zone of Proximal Development (ZPD): The gap between what a learner can do independently and what they can achieve with guidance.\n2. Scaffolding: Temporary support provided by a More Knowledgeable Other (MKO).\n3. Private Speech: Self-directed speech used by children for self-regulation (contrasted with Piaget’s egocentric speech).',
        },
        {
          heading: 'Unit 3: High-Yield TRBT Practice Questions (Solved)',
          body: 'Q1. According to Kohlberg, a teacher can instill moral values in children by:\n(A) Giving strict instructions on how to behave\n(B) Involving them in discussions on moral dilemmas [Correct Answer]\n\nQ2. Dysgraphia is primarily associated with difficulty in:\n(A) Reading comprehension\n(B) Performing mathematical calculations\n(C) Writing and fine-motor coordination [Correct Answer]',
        },
      ],
    },
    {
      id: 'mat-2',
      title: 'TET Mathematics & Environmental Studies Paid Classroom Notes',
      courseId: 'crs-tet-1',
      courseName: 'Tripura TET (Paper I & II) Integrated Target Batch',
      type: 'Paid Notes',
      author: 'Prof. Rajat Kanti Bhowmik & Dr. Nilanjan Roy',
      pages: 128,
      fileSize: '4.2 MB',
      uploadedDate: '2026-09-14',
      description:
        'Handcrafted formula sheets, pedagogical issues in Mathematics, and Tripura-specific Biodiversity & EVS notes exclusively for enrolled TET students.',
      previewSections: [
        {
          heading: 'Chapter 1: Nature of Mathematics & Van Hiele Model of Geometric Thought',
          body: 'The Van Hiele model describes how students learn geometry across 5 sequential levels:\n• Level 0 (Visualization): Recognizes shapes by holistic appearance.\n• Level 1 (Analysis): Identifies properties of figures.\n• Level 2 (Informal Deduction / Abstraction): Understands relationships between properties.\n• Level 3 (Formal Deduction): Constructs geometric proofs using axioms and theorems.\n• Level 4 (Rigor): Compares different axiomatic systems.',
        },
        {
          heading: 'Chapter 2: Environmental Studies — Wildlife Sanctuaries of Tripura',
          body: '1. Sepahijala Wildlife Sanctuary (Sipahijala District) — Clouded Leopard National Park & Phayre’s Langur (State Animal).\n2. Gumti Wildlife Sanctuary — Largest wildlife sanctuary in Tripura (South Tripura / Gomati).\n3. Trishna Wildlife Sanctuary — Famous for Indian Gaur (Bison) and Hoolock Gibbon.\n4. Rowa Wildlife Sanctuary (North Tripura) — Compact biodiversity hotspot.',
        },
      ],
    },
    {
      id: 'mat-3',
      title: 'STGT & STPGT English Literature, Phonetics & Grammar Paid Notes',
      courseId: 'crs-stgt-1',
      courseName: 'TRBT STGT (Selection Test for Graduate Teachers) — Arts & Humanities',
      type: 'Paid Notes',
      author: 'Smt. Poulami Sen Gupta',
      pages: 165,
      fileSize: '5.1 MB',
      uploadedDate: '2026-09-18',
      description:
        'Detailed critical notes on Romantic & Victorian Poets, Literary Devices, IPA Phonetic Transcription, Clause Analysis, and Transformation of Sentences.',
      previewSections: [
        {
          heading: 'Module 1: Literary Terms, Figures of Speech & Prosody',
          body: '• Oxymoron vs. Paradox: An oxymoron juxtaposes two contradictory words side by side ("deafening silence"), whereas a paradox is a statement that appears self-contradictory but reveals a deeper truth ("The child is father of the man" — Wordsworth).\n• Synecdoche vs. Metonymy: Synecdoche uses a part to represent the whole ("all hands on deck"), while Metonymy substitutes an closely associated attribute ("The Crown" for monarchy).',
        },
        {
          heading: 'Module 2: English Phonetics — RP Vowels & Diphthongs',
          body: 'Received Pronunciation (RP) consists of 44 phonemes:\n• 20 Vowel Sounds: 12 Monophthongs (7 short vowels, 5 long vowels) and 8 Diphthongs (gliding vowels).\n• 24 Consonant Sounds: Plosives (6), Affricates (2), Fricatives (9), Nasals (3), Lateral (1), Approximants (3).',
        },
      ],
    },
    {
      id: 'mat-4',
      title: 'Complete Panorama of Tripura GK, TTAADC & North-East Affairs (2026 Ed.)',
      courseId: 'crs-tpsc-1',
      courseName: 'TPSC Combined Competitive Exam (Prelims + Mains) Foundation',
      type: 'Book PDF',
      author: 'Sri Bikramjit Debbarma',
      pages: 290,
      fileSize: '8.4 MB',
      uploadedDate: '2026-09-20',
      description:
        'Essential textbook for TPSC Combined, JRBT, and Tripura Police exams covering Manikya Dynasty, Merger Agreement (1949), Sixth Schedule (TTAADC), River Systems, and Budget 2026–27.',
      previewSections: [
        {
          heading: 'Section A: Constitutional & Administrative Milestones of Tripura',
          body: '• Merger with Indian Union: 15th October 1949 (Regent Maharani Kanchan Prava Devi signed the Merger Agreement on 9th September 1949).\n• Part-C State Status: 26th January 1950.\n• Union Territory with Territorial Council: 1st November 1956 (Legislative Assembly formed on 1st July 1963).\n• Attainment of Full Statehood: 21st January 1972 under the North-Eastern Areas (Reorganisation) Act, 1971.',
        },
        {
          heading: 'Section B: Physiography — Mountain Ranges & Rivers of Tripura',
          body: 'Major Anticlinal Hill Ranges (West to East):\n1. Baramura-Deotamura Range\n2. Atharamura Range\n3. Longtharai Range\n4. Shakhan Range\n5. Jampui Hills (Highest Peak: Betlingchhip / Thaidawr — 939 meters).\nLongest River: Manu (167 km); Largest River by Discharge: Gomati (formed by confluence of Raima and Sarma at Dumbur).',
        },
      ],
    },
    {
      id: 'mat-5',
      title: 'High-Speed Quantitative Aptitude & Reasoning Puzzle Book (IBPS / SSC / RRB)',
      courseId: 'crs-bank-1',
      courseName: 'Banking Pro: IBPS PO / Clerk, SBI & Tripura Gramin Bank (RRB)',
      type: 'Book PDF',
      author: 'Prof. Rajat Kanti Bhowmik & Sri Sourav Bhattacharjee',
      pages: 245,
      fileSize: '7.3 MB',
      uploadedDate: '2026-09-22',
      description:
        '500+ solved Data Interpretation sets, Arithmetic shortcuts, Floor-Flat Puzzles, Syllogisms (Only a Few), and Banking Awareness capsules.',
      previewSections: [
        {
          heading: 'Chapter 1: Percentage-to-Fraction Conversion Table & Successive Change',
          body: 'Key Fractional Equivalents for Rapid Calculation:\n• 1/6 = 16.66% | 1/7 = 14.28% | 1/8 = 12.5% | 1/9 = 11.11% | 1/11 = 9.09% | 1/12 = 8.33% | 3/8 = 37.5% | 5/8 = 62.5%\nNet Effective Percentage Change Formula:\nIf a value changes successively by x% and y%, Net Change = [x + y + (xy / 100)]%.',
        },
        {
          heading: 'Chapter 2: Modern Syllogism — "Only" and "Only a Few" Rules',
          body: '1. Statement: "Only A are B" — Converts to "All B are A" AND B cannot overlap with any other element except A.\n2. Statement: "Only a few A are B" — Means BOTH "Some A are B" AND "Some A are NOT B" are simultaneously definite true conclusions.',
        },
      ],
    },
    {
      id: 'mat-6',
      title: 'TBSE Madhyamik (Class X) Mathematics & Physical Science Paid Ranker Notes',
      courseId: 'crs-tbse-10',
      courseName: 'Class X (Madhyamik) — TBSE Board Topper Target Batch',
      type: 'Paid Notes',
      author: 'Prof. Rajat Kanti Bhowmik & Dr. Nilanjan Roy',
      pages: 180,
      fileSize: '5.5 MB',
      uploadedDate: '2026-09-25',
      description:
        'Complete theorem proofs, Trigonometry identities, Mensuration formulas, Ray Optics diagrams, Ohm’s Law numericals, and Organic Chemistry tables for TBSE Class X.',
      previewSections: [
        {
          heading: 'Part I: TBSE Class X Mathematics — Quadratic Equations & Theorems',
          body: 'For the general quadratic equation ax² + bx + c = 0 (a ≠ 0):\n• Discriminant (D) = b² - 4ac\n• If D > 0: Real and unequal roots.\n• If D = 0: Real and equal roots (-b / 2a).\n• If D < 0: No real roots.\nSum of roots (α + β) = -b/a | Product of roots (αβ) = c/a.',
        },
        {
          heading: 'Part II: Physical Science — Current Electricity & Lens Formula',
          body: '• Ohm’s Law: V = I × R (at constant temperature).\n• Joule’s Law of Heating: H = I²Rt Joules.\n• Lens Formula: (1/v) - (1/u) = (1/f) | Linear Magnification (m) = v/u.\n• Power of a Lens: P = 1 / f (in meters), measured in Dioptres (D).',
        },
      ],
    },
    {
      id: 'mat-7',
      title: 'CBSE Class X NCERT Exemplar + Competency Question Bank (Maths & Science)',
      courseId: 'crs-cbse-10',
      courseName: 'Class X — CBSE All-India Board 95%+ Target Batch',
      type: 'Book PDF',
      author: 'C.G.A Academic Research Wing',
      pages: 210,
      fileSize: '6.1 MB',
      uploadedDate: '2026-09-26',
      description:
        'Case-study questions, Assertion-Reasoning banks, Chemical Equations master chart, and CBSE Marking Scheme step-wise solutions.',
      previewSections: [
        {
          heading: 'Module 1: Competency-Based Assertion & Reason Strategy',
          body: 'Directions: Choose (A) if both Assertion and Reason are true and Reason is the correct explanation; (B) if both are true but Reason is not the correct explanation; (C) if A is true but R is false; (D) if A is false but R is true.\n\nExample: Assertion (A): Decomposition of vegetable matter into compost is an exothermic reaction.\nReason (R): Microorganisms break down organic matter releasing heat energy.\nAnswer: Option (A).',
        },
      ],
    },
  ],

  mockTests: [
    {
      id: 'mock-ttet-p1-cdp-1',
      title: 'Tripura TET Paper-I: Child Development & Pedagogy (CDP) Mock #01',
      subject: 'Child Development & Pedagogy',
      languageMode: 'bilingual',
      courseId: 'crs-tet-1',
      courseName: 'Tripura TET (Paper I & II) Integrated Target Batch',
      batchName: 'TET-2026 Morning Batch A',
      durationMinutes: 30,
      totalMarks: 30,
      marksPerQuestion: 1,
      negativeMarking: 0,
      scheduledDate: new Date().toISOString().split('T')[0],
      status: 'Published',
      questions: [
        {
          id: 'q-cdp-p1-1',
          question: 'According to Jean Piaget, during which stage does a child begin to think logically about concrete events and master the concept of conservation?',
          options: [
            'Sensorimotor Stage (0–2 years)',
            'Preoperational Stage (2–7 years)',
            'Concrete Operational Stage (7–11 years)',
            'Formal Operational Stage (11+ years)',
          ],
          questionBn: 'জ্যাঁ পিয়াজের প্রজ্ঞামূলক বিকাশ তত্ত্ব অনুসারে, কোন স্তরে শিশু মূর্ত ঘটনার ওপর যৌক্তিকভাবে চিন্তা করতে পারে এবং সংরক্ষণ (Conservation)-এর ধারণা আয়ত্ত করে?',
          optionsBn: [
            'সংবেদন-চালক স্তর (০–২ বছর)',
            'প্রাক-সক্রিয়তার স্তর (২–৭ বছর)',
            'মূর্ত সক্রিয়তার স্তর (৭–১১ বছর)',
            'যৌক্তিক সক্রিয়তার স্তর (১১+ বছর)',
          ],
          correctOptionIndex: 2,
          explanation: 'In the Concrete Operational Stage (7–11 years), children gain reversibility and the ability to think logically about concrete situations.',
          explanationBn: 'মূর্ত সক্রিয়তার স্তরে (৭–১১ বছর) শিশুরা বিপরীতমুখী চিন্তন (Reversibility) ও সংরক্ষণ ধারণার যৌক্তিক প্রয়োগে সক্ষম হয়।',
        },
        {
          id: 'q-cdp-p1-2',
          question: 'The concept of "Zone of Proximal Development (ZPD)" and "Scaffolding" is associated with which psychologist?',
          options: ['Lev Vygotsky', 'Jean Piaget', 'B.F. Skinner', 'Erik Erikson'],
          questionBn: '"নিকটবর্তী বিকাশের সীমানা (Zone of Proximal Development বা ZPD)" এবং "ভারা প্রদান (Scaffolding)" ধারণা দুটি কোন মনোবিজ্ঞানীর সাথে যুক্ত?',
          optionsBn: ['লেভ ভাইগটস্কি', 'জ্যাঁ পিয়াজে', 'বি. এফ. স্কিনার', 'এরিক এরিকসন'],
          correctOptionIndex: 0,
          explanation: 'Lev Vygotsky proposed ZPD as the difference between independent performance and guided potential.',
          explanationBn: 'লেভ ভাইগটস্কি তাঁর আর্থ-সামাজিক-সাংস্কৃতিক শিখন তত্ত্বে ZPD ও ভারা প্রদান (Scaffolding)-এর ধারণা উপস্থাপন করেন।',
        },
        {
          id: 'q-cdp-p1-3',
          question: 'Which of the following is NOT one of Thorndike\'s three primary laws of learning?',
          options: ['Law of Readiness', 'Law of Exercise', 'Law of Effect', 'Law of Association'],
          questionBn: 'নিচের কোনটি থর্নডাইক কর্তৃক বর্ণিত শিখনের তিনটি মুখ্য নিয়মের অন্তর্ভুক্ত নয়?',
          optionsBn: ['প্রস্তুতির নিয়ম', 'অনুশীলনের নিয়ম', 'ফলাফলের নিয়ম', 'অনুষঙ্গের নিয়ম'],
          correctOptionIndex: 3,
          explanation: 'Thorndike\'s three primary laws are: Readiness, Exercise, and Effect. Association is a secondary law.',
          explanationBn: 'থর্নডাইকের তিনটি মুখ্য নিয়ম হলো: প্রস্তুতি, অনুশীলন ও ফলাফল। অনুষঙ্গের নিয়মটি গৌণ নিয়মের অংশ।',
        },
      ],
    },
    {
      id: 'mock-ttet-p1-eng-1',
      title: 'Tripura TET: Language – I (English) Sectional Mock #01',
      subject: 'English',
      languageMode: 'english_only',
      courseId: 'crs-tet-1',
      courseName: 'Tripura TET (Paper I & II) Integrated Target Batch',
      batchName: 'TET-2026 Morning Batch A',
      durationMinutes: 30,
      totalMarks: 30,
      marksPerQuestion: 1,
      negativeMarking: 0,
      scheduledDate: new Date().toISOString().split('T')[0],
      status: 'Published',
      questions: [
        {
          id: 'q-eng-p1-1',
          question: 'Identify the sentence in the correct passive voice: "The academy will publish the merit rank list on Friday."',
          options: [
            'The merit rank list will be published by the academy on Friday.',
            'The merit rank list was published by the academy on Friday.',
            'The merit rank list would be published by the academy on Friday.',
            'The merit rank list is being published by the academy on Friday.',
          ],
          correctOptionIndex: 0,
          explanation: 'Simple future active ("will publish") transforms to "will be + past participle" ("will be published").',
        },
        {
          id: 'q-eng-p1-2',
          question: 'Choose the appropriate preposition to complete the sentence: "The candidate was disqualified ______ failing to submit the mandatory OMR verification."',
          options: ['for', 'from', 'with', 'about'],
          correctOptionIndex: 0,
          explanation: '"Disqualified for" is used when specifying the causal action or reason for disqualification.',
        },
        {
          id: 'q-eng-p1-3',
          question: 'Select the word that is an ANTONYM of "METICULOUS":',
          options: ['Careless', 'Thorough', 'Precise', 'Painstaking'],
          correctOptionIndex: 0,
          explanation: '"Meticulous" means showing great attention to detail. Its opposite is "Careless".',
        },
      ],
    },
    {
      id: 'mock-ttet-p1-ben-1',
      title: 'Tripura TET: Language – II (Bengali) Sectional Mock #01',
      subject: 'Bengali',
      languageMode: 'bengali_only',
      courseId: 'crs-tet-1',
      courseName: 'Tripura TET (Paper I & II) Integrated Target Batch',
      batchName: 'TET-2026 Morning Batch A',
      durationMinutes: 30,
      totalMarks: 30,
      marksPerQuestion: 1,
      negativeMarking: 0,
      scheduledDate: new Date().toISOString().split('T')[0],
      status: 'Published',
      questions: [
        {
          id: 'q-ben-p1-1',
          question: 'নিচের কোন বানানটি বাংলা বানানবিধি অনুসারে সম্পূর্ণ শুদ্ধ?',
          options: ['মুমূর্ষু', 'মুমুর্ষু', 'মুমুর্ষূ', 'মুমূর্ষূ'],
          correctOptionIndex: 0,
          explanation: "শুদ্ধ বানানটি হলো 'মুমূর্ষু' (হ্রস্ব উ-কার, দীর্ঘ ঊ-কার, হ্রস্ব উ-কার)।",
        },
        {
          id: 'q-ben-p1-2',
          question: "'উপকূল' শব্দটির সঠিক ব্যাসবাক্য ও সমাস নির্ণয় করো:",
          options: [
            'কূলের সমীপে — অব্যয়ীভাব সমাস',
            'কূলের পশ্চাৎ — তৎপুরুষ সমাস',
            'কূলকে অতিক্রম — কর্মধারয় সমাস',
            'কূল ও উপকূল — দ্বন্দ্ব সমাস',
          ],
          correctOptionIndex: 0,
          explanation: "'কূলের সমীপে' = উপকূল। এটি সামীপ্য অর্থে অব্যয়ীভাব সমাস।",
        },
        {
          id: 'q-ben-p1-3',
          question: "'গায়ক' শব্দটির সঠিক সন্ধিবিচ্ছেদ কোনটি?",
          options: ['গৈ + অক', 'গা + অক', 'গে + অক', 'গো + অক'],
          correctOptionIndex: 0,
          explanation: "'গৈ + অক' মিলে হয় 'গায়ক'। নিয়ম: ঐ-কারের পর অন্য স্বরবর্ণ থাকলে ঐ স্থানে আয়্ হয়।",
        },
      ],
    },
    {
      id: 'mock-ttet-p1-math-1',
      title: 'Tripura TET: Mathematics (Content & Pedagogy) Mock #01',
      subject: 'Mathematics',
      languageMode: 'bilingual',
      courseId: 'crs-tet-1',
      courseName: 'Tripura TET (Paper I & II) Integrated Target Batch',
      batchName: 'TET-2026 Morning Batch A',
      durationMinutes: 30,
      totalMarks: 30,
      marksPerQuestion: 1,
      negativeMarking: 0,
      scheduledDate: new Date().toISOString().split('T')[0],
      status: 'Published',
      questions: [
        {
          id: 'q-math-p1-1',
          question: 'In the Van Hiele model of geometric thought, at which level does a child begin to classify geometric figures by their properties rather than merely recognizing them visually?',
          options: [
            'Level 0: Visualization',
            'Level 1: Analysis (Descriptive)',
            'Level 2: Informal Deduction',
            'Level 3: Deduction',
          ],
          questionBn: 'ভ্যান হিলের জ্যামিতিক চিন্তন মডেলে, কোন স্তরে একটি শিশু কেবল চাক্ষুষ চেহারার ওপর নির্ভর না করে নির্দিষ্ট বৈশিষ্ট্যের ভিত্তিতে জ্যামিতিক চিত্রসমূহকে শ্রেণীবদ্ধ করতে শুরু করে?',
          optionsBn: [
            'স্তর ০: দৃষ্টিকরণ (Visualization)',
            'স্তর ১: বিশ্লেষণধর্মী (Analysis)',
            'স্তর ২: অনানুষ্ঠানিক অবরোহী (Informal Deduction)',
            'স্তর ৩: অবরোহী যুক্তি (Deduction)',
          ],
          correctOptionIndex: 1,
          explanation: 'At Level 1 (Analysis), students analyze shapes based on properties such as equal sides, parallel lines, and right angles.',
          explanationBn: 'স্তর ১ (বিশ্লেষণ)-এ শিক্ষার্থীরা বাহু, কোণ ও প্রতিসাম্যের মতো জ্যামিতিক বৈশিষ্ট্যের নিরিখে বস্তুর রূপ বিচার করে।',
        },
        {
          id: 'q-math-p1-2',
          question: 'If 12 men can complete a school classroom renovation in 15 days, in how many days can 20 men complete the same work at the same rate?',
          options: ['9 days', '10 days', '8 days', '12 days'],
          questionBn: 'যদি ১২ জন কর্মী ১৫ দিনে একটি বিদ্যালয়ের শ্রেণীকক্ষ সংস্কার করতে পারেন, তবে একই হারে কাজ করলে ২০ জন কর্মী কত দিনে কাজটি সম্পন্ন করবেন?',
          optionsBn: ['৯ দিনে', '১০ দিনে', '৮ দিনে', '১২ দিনে'],
          correctOptionIndex: 0,
          explanation: 'Total man-days = 12 × 15 = 180. Days for 20 men = 180 / 20 = 9 days.',
          explanationBn: 'মোট শ্রম-দিন = ১২ × ১৫ = ১৮০। ২০ জনের ক্ষেত্রে দিন সংখ্যা = ১৮০ / ২০ = ৯ দিন।',
        },
      ],
    },
    {
      id: 'mock-ttet-p1-evs-1',
      title: 'Tripura TET: Environmental Studies (EVS) Mock #01',
      subject: 'Environmental Studies',
      languageMode: 'bilingual',
      courseId: 'crs-tet-1',
      courseName: 'Tripura TET (Paper I & II) Integrated Target Batch',
      batchName: 'TET-2026 Morning Batch A',
      durationMinutes: 30,
      totalMarks: 30,
      marksPerQuestion: 1,
      negativeMarking: 0,
      scheduledDate: new Date().toISOString().split('T')[0],
      status: 'Published',
      questions: [
        {
          id: 'q-evs-p1-1',
          question: 'Which wildlife sanctuary in Tripura is famous for the Clouded Leopard National Park and Phayre\'s Leaf Monkey (Chasma Banor)?',
          options: [
            'Rowa Wildlife Sanctuary',
            'Trishna Wildlife Sanctuary',
            'Sepahijala Wildlife Sanctuary',
            'Gumti Wildlife Sanctuary',
          ],
          questionBn: 'ত্রিপুরার কোন বন্যপ্রাণী অভয়ারণ্যটি ক্লাউডেড লেপার্ড জাতীয় উদ্যান এবং চশমা-বানর (Phayre’s Leaf Monkey) সংরক্ষণের জন্য বিখ্যাত?',
          optionsBn: [
            'রোয়া বন্যপ্রাণী অভয়ারণ্য',
            'তৃষ্ণা বন্যপ্রাণী অভয়ারণ্য',
            'সিপাহীজলা বন্যপ্রাণী অভয়ারণ্য',
            'গোমতী বন্যপ্রাণী অভয়ারণ্য',
          ],
          correctOptionIndex: 2,
          explanation: 'Sepahijala Wildlife Sanctuary houses the Clouded Leopard National Park and the Spectacled Monkey breeding center.',
          explanationBn: 'সিপাহীজলা অভয়ারণ্যে ক্লাউডেড লেপার্ড ন্যাশনাল পার্ক ও চশমা-বানরের বিশেষ প্রজনন কেন্দ্র অবস্থিত।',
        },
        {
          id: 'q-evs-p1-2',
          question: 'Which of the following is a primary consumer in a forest terrestrial ecosystem?',
          options: ['Deer', 'Tiger', 'Hawk', 'Fungus'],
          questionBn: 'একটি বনভূমি বাস্তুতন্ত্রে নিচের কোনটি প্রাথমিক খাদক (Primary Consumer)?',
          optionsBn: ['হরিণ', 'বাঘ', 'বাজপাখি', 'ছত্রাক'],
          correctOptionIndex: 0,
          explanation: 'Herbivores that feed directly on producers (green plants) are primary consumers, e.g. deer.',
          explanationBn: 'তৃণভোজী প্রাণী যারা সরাসরি উৎপাদক (উদ্ভিদ) ভক্ষণ করে তারা প্রাথমিক খাদক, যেমন হরিণ।',
        },
      ],
    },
    {
      id: 'mock-ttet-p2-sci-1',
      title: 'Tripura TET Paper-II (Science): Physical & Life Science Mock #01',
      subject: 'Science',
      languageMode: 'bilingual',
      courseId: 'crs-tet-1',
      courseName: 'Tripura TET (Paper I & II) Integrated Target Batch',
      batchName: 'TET-2026 Morning Batch A',
      durationMinutes: 30,
      totalMarks: 30,
      marksPerQuestion: 1,
      negativeMarking: 0,
      scheduledDate: new Date().toISOString().split('T')[0],
      status: 'Published',
      questions: [
        {
          id: 'q-sci-p2-1',
          question: 'According to Ohm\'s Law, under constant physical conditions, the potential difference across a conductor is directly proportional to:',
          options: ['Current (I)', 'Resistance (R)', 'Power (P)', 'Capacitance (C)'],
          questionBn: 'ওহমের সূত্র অনুসারে, অপরিবর্তিত ভৌত অবস্থায় পরিবাহীর দুই প্রান্তের বিভবপ্রভেদ কিসের সমানুপাতিক?',
          optionsBn: ['তড়িৎপ্রবাহমাত্রা (I)', 'রোধ (R)', 'বৈদ্যুতিক ক্ষমতা (P)', 'ধারকত্ব (C)'],
          correctOptionIndex: 0,
          explanation: 'V ∝ I at constant temperature and physical conditions (V = IR).',
          explanationBn: 'উষ্ণতা ও অন্যান্য ভৌত অবস্থা অপরিবর্তিত থাকলে V ∝ I (অর্থাৎ V = IR)।',
        },
        {
          id: 'q-sci-p2-2',
          question: 'Which cell organelle is known as the "Powerhouse of the Cell"?',
          options: ['Mitochondria', 'Ribosome', 'Golgi Apparatus', 'Lysosome'],
          questionBn: 'কোষের কোন অঙ্গাণুকে "কোষের শক্তিঘর" বলা হয়?',
          optionsBn: ['মাইটোকন্ড্রিয়া', 'রাইবোজোম', 'গলগি বডি', 'লাইসোজোম'],
          correctOptionIndex: 0,
          explanation: 'Mitochondria generate adenosine triphosphate (ATP), the chemical energy currency of the cell.',
          explanationBn: 'মাইটোকন্ড্রিয়া শ্বসন প্রক্রিয়ার মাধ্যমে কোষে ATP শক্তি উৎপন্ন করে বলে একে কোষের শক্তিঘর বলা হয়।',
        },
      ],
    },
    {
      id: 'mock-ttet-p2-soc-1',
      title: 'Tripura TET Paper-II (Social Studies): History & Civics Mock #01',
      subject: 'Social Studies',
      languageMode: 'bilingual',
      courseId: 'crs-tet-1',
      courseName: 'Tripura TET (Paper I & II) Integrated Target Batch',
      batchName: 'TET-2026 Morning Batch A',
      durationMinutes: 30,
      totalMarks: 30,
      marksPerQuestion: 1,
      negativeMarking: 0,
      scheduledDate: new Date().toISOString().split('T')[0],
      status: 'Published',
      questions: [
        {
          id: 'q-soc-p2-1',
          question: 'The historical chronicle "Rajmala" narrates the royal history and genealogy of which ruling dynasty of Tripura?',
          options: ['Manikya Dynasty', 'Varman Dynasty', 'Pala Dynasty', 'Ahom Dynasty'],
          questionBn: 'ত্রিপুরার ঐতিহাসিক রাজবৃত্তান্ত "রাজমালা"-য় কোন রাজবংশের গৌরবময় ইতিহাস ও বংশাবলি বর্ণিত রয়েছে?',
          optionsBn: ['মাণিক্য রাজবংশ', 'বর্মন রাজবংশ', 'পাল রাজবংশ', 'আহোম রাজবংশ'],
          correctOptionIndex: 0,
          explanation: 'Rajmala is the court chronicle of the kings of Tripura belonging to the Manikya dynasty.',
          explanationBn: 'রাজমালা ত্রিপুরার প্রাচীন মাণিক্য রাজাদের ইতিহাস সংবলিত অনন্য রাজবৃত্তান্ত।',
        },
        {
          id: 'q-soc-p2-2',
          question: 'The famous Tripura Sundari Temple at Matabari, Udaipur was founded in 1501 AD by which visionary Maharaja?',
          options: [
            'Maharaja Dhanya Manikya',
            'Maharaja Bir Bikram Kishore Manikya',
            'Maharaja Radha Kishore Manikya',
            'Maharaja Govinda Manikya',
          ],
          questionBn: 'উদয়পুরের মাতাবাড়িতে অবস্থিত ঐতিহাসিক ত্রিপুরেশ্বরী (ত্রিপুরাসুন্দরী) মন্দিরটি ১৫০১ খ্রিস্টাব্দে কোন মহারাজা প্রতিষ্ঠা করেছিলেন?',
          optionsBn: [
            'মহারাজা ধন্য মাণিক্য',
            'মহারাজা বীর বিক্রম কিশোর মাণিক্য',
            'মহারাজা রাধাকিশোর মাণিক্য',
            'মহারাজা গোবিন্দ মাণিক্য',
          ],
          correctOptionIndex: 0,
          explanation: 'Maharaja Dhanya Manikya constructed the Tripura Sundari Temple (Matabari) in Udaipur in 1501 AD.',
          explanationBn: '১৫০১ খ্রিস্টাব্দে মহারাজা ধন্য মাণিক্য উদয়পুরের মাতাবাড়িতে পীঠস্থান ত্রিপুরাসুন্দরী মন্দির স্থাপন করেন।',
        },
      ],
    },
    {
      id: 'mock-1',
      title: 'Tripura TET Full-Length Mock Test #01 (Full Syllabus Simulation)',
      subject: 'Full Length',
      languageMode: 'bilingual',
      courseId: 'crs-tet-1',
      courseName: 'Tripura TET (Paper I & II) Integrated Target Batch',
      batchName: 'TET-2026 Morning Batch A',
      durationMinutes: 15,
      totalMarks: 20,
      marksPerQuestion: 4,
      negativeMarking: 1,
      scheduledDate: new Date().toISOString().split('T')[0],
      status: 'Published',
      questions: [
        {
          id: 'q-1',
          question:
            'Which psychologist introduced the concept of "Zone of Proximal Development (ZPD)" in cognitive learning?',
          questionBn:
            'জ্ঞানীয় শিখন তত্ত্বে "Zone of Proximal Development (ZPD)" ধারণাটি কোন মনোবিজ্ঞানী প্রবর্তন করেন?',
          options: ['Jean Piaget', 'Lev Vygotsky', 'B.F. Skinner', 'Lawrence Kohlberg'],
          optionsBn: ['জ্যাঁ পিয়াজে', 'লেভ ভাইগটস্কি', 'বি. এফ. স্কিনার', 'লরেন্স কোলবার্গ'],
          correctOptionIndex: 1,
          explanation:
            'Lev Vygotsky proposed the Zone of Proximal Development (ZPD) as part of his Socio-Cultural Theory of Development.',
          explanationBn:
            'লেভ ভাইগটস্কি তাঁর আর্থ-সামাজিক-সাংস্কৃতিক বিকাশ তত্ত্বে ZPD ধারণাটি উপস্থাপন করেন।',
        },
        {
          id: 'q-2',
          question:
            'In the Van Hiele model of geometric thought, at which level does a child begin to identify shapes by their specific properties rather than just visual appearance?',
          questionBn:
            'ভ্যান হিলের জ্যামিতিক চিন্তন মডেলে কোন স্তরে শিশু নিছক চাক্ষুষ চেহারার পরিবর্তে নির্দিষ্ট বৈশিষ্ট্যের ভিত্তিতে জ্যামিতিক চিত্র শনাক্ত করে?',
          options: [
            'Level 0 — Visualization',
            'Level 1 — Analysis',
            'Level 2 — Informal Deduction',
            'Level 4 — Rigor',
          ],
          optionsBn: [
            'স্তর ০ — দৃষ্টিকরণ',
            'স্তর ১ — বিশ্লেষণধর্মী',
            'স্তর ২ — অনানুষ্ঠানিক অবরোহী',
            'স্তর ৪ — কঠোরতা',
          ],
          correctOptionIndex: 1,
          explanation:
            'At Level 1 (Analysis), learners classify and analyze figures based on their geometric properties.',
          explanationBn:
            'স্তর ১ (বিশ্লেষণ)-এ শিক্ষার্থীরা জ্যামিতিক বৈশিষ্ট্যের ভিত্তিতে আকার শ্রেণীবদ্ধ করে।',
        },
        {
          id: 'q-3',
          question:
            'Which wildlife sanctuary in Tripura is famous for the Clouded Leopard National Park and Phayre’s Leaf Monkey?',
          questionBn:
            'ত্রিপুরার কোন বন্যপ্রাণী অভয়ারণ্যটি ক্লাউডেড লেপার্ড জাতীয় উদ্যান এবং চশমা-বানর (Phayre’s Leaf Monkey)-এর জন্য বিখ্যাত?',
          options: [
            'Rowa Wildlife Sanctuary',
            'Trishna Wildlife Sanctuary',
            'Sepahijala Wildlife Sanctuary',
            'Gumti Wildlife Sanctuary',
          ],
          optionsBn: [
            'রোয়া বন্যপ্রাণী অভয়ারণ্য',
            'তৃষ্ণা বন্যপ্রাণী অভয়ারণ্য',
            'সিপাহীজলা বন্যপ্রাণী অভয়ারণ্য',
            'গোমতী বন্যপ্রাণী অভয়ারণ্য',
          ],
          correctOptionIndex: 2,
          explanation:
            'Sepahijala Wildlife Sanctuary houses the Clouded Leopard National Park and is renowned for Phayre’s Langur (Spectacled Monkey).',
          explanationBn:
            'সিপাহীজলা বন্যপ্রাণী অভয়ারণ্যে ক্লাউডেড লেপার্ড ন্যাশনাল পার্ক অবস্থিত এবং এটি চশমা-বানরের জন্য বিশেষভাবে খ্যাত।',
        },
        {
          id: 'q-4',
          question:
            'Choose the correct passive voice of: "The faculty of C.G.A will evaluate the mock test papers tomorrow."',
          options: [
            'The mock test papers will evaluated by the faculty of C.G.A tomorrow.',
            'The mock test papers will be evaluated by the faculty of C.G.A tomorrow.',
            'The mock test papers would be evaluated by the faculty of C.G.A tomorrow.',
            'The mock test papers are being evaluated by the faculty of C.G.A tomorrow.',
          ],
          correctOptionIndex: 1,
          explanation:
            'Future Indefinite active ("will + V1") transforms into "will be + V3" in passive voice.',
        },
        {
          id: 'q-5',
          question:
            'If the ratio of the ages of two students is 4:5 and the sum of their ages is 36 years, what will be the ratio of their ages after 4 years?',
          questionBn:
            'দুইজন শিক্ষার্থীর বয়সের অনুপাত ৪:৫ এবং তাদের বয়সের সমষ্টি ৩৬ বছর হলে, ৪ বছর পর তাদের বয়সের অনুপাত কত হবে?',
          options: ['5:6', '6:7', '7:8', '8:9'],
          optionsBn: ['৫:৬', '৬:৭', '৭:৮', '৮:৯'],
          correctOptionIndex: 0,
          explanation:
            '4x + 5x = 36 => 9x = 36 => x = 4. Present ages are 16 and 20. After 4 years, ages will be 20 and 24, so ratio = 20:24 = 5:6.',
          explanationBn:
            '৪x + ৫x = ৩৬ => ৯x = ৩৬ => x = ৪। বর্তমান বয়স ১৬ ও ২০ বছর। ৪ বছর পর বয়স হবে ২০ ও ২৪ বছর, সুতরাং অনুপাত = ২০:২৪ = ৫:৬।',
        },
      ],
    },
    {
      id: 'mock-2',
      title: 'TPSC Combined & JRBT Tripura GK + Polity Sectional Test #01',
      courseId: 'crs-tpsc-1',
      courseName: 'TPSC Combined Competitive Exam (Prelims + Mains) Foundation',
      batchName: 'TPSC-2026 Officers Batch',
      durationMinutes: 15,
      totalMarks: 20,
      marksPerQuestion: 4,
      negativeMarking: 1,
      scheduledDate: '2026-10-08',
      status: 'Published',
      questions: [
        {
          id: 'q-201',
          question: 'On which date did Tripura attain full statehood under the North-Eastern Areas (Reorganisation) Act, 1971?',
          options: ['15th October 1949', '1st November 1956', '21st January 1972', '26th January 1950'],
          correctOptionIndex: 2,
          explanation: 'Tripura became a full-fledged state of the Indian Union on 21st January 1972.',
        },
        {
          id: 'q-202',
          question: 'What is the highest peak of Tripura located in the Jampui Hill range?',
          options: ['Shakhan Tlang', 'Betlingchhip (Thaidawr)', 'Longtharai Peak', 'Atharamura Peak'],
          correctOptionIndex: 1,
          explanation: 'Betlingchhip (also called Thaidawr) in the Jampui Hills is the highest peak in Tripura at 939m.',
        },
        {
          id: 'q-203',
          question: 'Which Schedule of the Indian Constitution governs the Tripura Tribal Areas Autonomous District Council (TTAADC)?',
          options: ['Fifth Schedule', 'Sixth Schedule', 'Seventh Schedule', 'Ninth Schedule'],
          correctOptionIndex: 1,
          explanation: 'The Sixth Schedule of the Constitution applies to the administration of tribal areas in Assam, Meghalaya, Tripura, and Mizoram.',
        },
        {
          id: 'q-204',
          question: 'The famous Tripura Sundari Temple at Matabari, Udaipur was built in 1501 AD during the reign of which Maharaja?',
          options: [
            'Maharaja Bir Bikram Kishore Manikya',
            'Maharaja Dhanya Manikya',
            'Maharaja Radha Kishore Manikya',
            'Maharaja Govinda Manikya',
          ],
          correctOptionIndex: 1,
          explanation: 'Maharaja Dhanya Manikya constructed the Tripura Sundari Temple in Udaipur in 1501 AD.',
        },
        {
          id: 'q-205',
          question: 'Which Article of the Indian Constitution empowers the High Court to issue writs for the enforcement of Fundamental Rights?',
          options: ['Article 32', 'Article 136', 'Article 226', 'Article 311'],
          correctOptionIndex: 2,
          explanation: 'Article 226 empowers High Courts to issue writs, whereas Article 32 empowers the Supreme Court.',
        },
      ],
    },
    {
      id: 'mock-3',
      title: 'TBSE Class X (Madhyamik) Mathematics & Physical Science Unit Test',
      courseId: 'crs-tbse-10',
      courseName: 'Class X (Madhyamik) — TBSE Board Topper Target Batch',
      batchName: 'TBSE-X Madhyamik Rankers',
      durationMinutes: 12,
      totalMarks: 16,
      marksPerQuestion: 4,
      negativeMarking: 0,
      scheduledDate: '2026-10-12',
      status: 'Published',
      questions: [
        {
          id: 'q-301',
          question: 'If the roots of the quadratic equation 2x² - kx + 8 = 0 are real and equal, then the positive value of k is:',
          options: ['4', '8', '16', '2'],
          correctOptionIndex: 1,
          explanation: 'For equal roots, b² - 4ac = 0 => (-k)² - 4(2)(8) = 0 => k² = 64 => k = 8.',
        },
        {
          id: 'q-302',
          question: 'What is the commercial unit of electrical energy?',
          options: ['Watt', 'Joule-second', 'Kilowatt-hour (kWh)', 'Volt-ampere'],
          correctOptionIndex: 2,
          explanation: '1 Kilowatt-hour (1 BOT unit) = 3.6 × 10⁶ Joules is the commercial unit of electrical energy.',
        },
        {
          id: 'q-303',
          question: 'The value of (sin² 30° + cos² 30°) is equal to:',
          options: ['0', '1/2', '1', '√3/2'],
          correctOptionIndex: 2,
          explanation: 'By fundamental trigonometric identity, sin²θ + cos²θ = 1 for all θ.',
        },
        {
          id: 'q-304',
          question: 'Which mirror is used by dentists to examine a magnified erect image of teeth?',
          options: ['Convex Mirror', 'Concave Mirror', 'Plane Mirror', 'Cylindrical Lens'],
          correctOptionIndex: 1,
          explanation: 'A concave mirror forms a virtual, erect, and magnified image when the object is placed within its focal length.',
        },
      ],
    },
  ],

  students: [],

  testAttempts: [],

  feePayments: [],

  announcements: [
    {
      id: 'ann-1',
      title: 'Grand Offline + Online OMR Mock Test for Tripura TET Aspirants',
      content:
        'All students enrolled in TET-2026 Morning Batch A are informed that the Full-Length OMR & Portal Mock Test #01 is now live. Attempt online via the Student Portal or collect your OMR sheet from the Chanban campus office.',
      targetBatch: 'crs-tet-1',
      targetLabel: 'Tripura TET Integrated Batch',
      priority: 'Important',
      date: '2026-09-29',
      author: 'Dr. Subrata Majumder (Director)',
    },
    {
      id: 'ann-2',
      title: 'Distribution of Updated Tripura GK & Budget 2026–27 Printed Compendium',
      content:
        'The soft-copy PDF of "Complete Panorama of Tripura GK (2026 Ed.)" has been uploaded to the Study Materials Library for TPSC and JRBT batches. Hard copies can be collected from Counter #2.',
      targetBatch: 'crs-tpsc-1',
      targetLabel: 'TPSC & JRBT Batches',
      priority: 'Normal',
      date: '2026-09-27',
      author: 'Sri Bikramjit Debbarma',
    },
    {
      id: 'ann-3',
      title: 'TBSE & CBSE Class VII–X Parent-Teacher Academic Review Meet',
      content:
        'A scheduled interaction with guardians of Class VII to X (both TBSE and CBSE wings) will be held this Sunday from 10:30 AM to 1:00 PM at Career Guidance Academy, Chanban Youth Club Rd, Udaipur.',
      targetBatch: 'All Batches',
      targetLabel: 'All Batches (Institute Notice)',
      priority: 'Urgent',
      date: '2026-09-26',
      author: 'Academic Coordinator, C.G.A',
    },
  ],

  enquiries: [],

  mockSeries: MOCK_SERIES_INITIAL,
  mockSubjects: MOCK_SUBJECTS_INITIAL,
  seriesTests: MOCK_SERIES_TESTS_INITIAL,
  seriesEnrollments: [],
  seriesAttempts: [],
};
