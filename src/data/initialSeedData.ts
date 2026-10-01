export type CourseCategory =
  | 'Teaching and Recruitment Exams'
  | 'Banking, SSC and Railway'
  | 'Other Competitive Examinations'
  | 'School Coaching';

export interface Course {
  id: string;
  name: string;
  category: CourseCategory;
  subCategory: string; // e.g. 'TET', 'STGT', 'Class X - TBSE', 'Class X - CBSE'
  board?: 'TBSE' | 'CBSE' | 'Competitive';
  classLevel?: 'Class VII' | 'Class VIII' | 'Class IX' | 'Class X';
  description: string;
  syllabusHighlights: string[];
  price: number;
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
}

export interface FacultyMember {
  id: string;
  name: string;
  subject: string;
  qualification: string;
  experience: string;
  photo: string;
  bio: string;
  specializationTags: string[];
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
}

export interface MockTest {
  id: string;
  title: string;
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
}

export interface StudentEnrollment {
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
}

export interface StudentProfile {
  id: string;
  studentCode: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  photo: string;
  guardianName: string;
  address: string;
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
}

export const DEMO_CREDENTIALS = {
  student: {
    email: 'student@cgaudaipur.in',
    password: 'password123',
    name: 'Arijit Debnath',
    studentId: 'stu-1',
  },
  admin: {
    email: 'admin@cgaudaipur.in',
    password: 'admin123',
    name: 'Dr. Subrata Majumder (Director, C.G.A)',
  },
};

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
      address: 'Chanban Youth Club Rd, behind Youth Club, Udaipur, Tripura 799114',
      landmark: 'Behind Chanban Youth Club, Near Jagannath Bari Road',
      city: 'Udaipur (Gomati District)',
      state: 'Tripura',
      pincode: '799114',
      phonePrimary: '+91 94361 82490',
      phoneSecondary: '+91 87875 41120',
      email: 'admissions@cgaudaipur.in',
      officeHours: 'Mon – Sun: 7:30 AM to 8:00 PM',
      mapEmbedUrl:
        'https://www.google.com/maps?q=Chanban+Youth+Club+Rd+Udaipur+Tripura+799114&output=embed',
    },
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
      id: 'fac-1',
      name: 'Dr. Subrata Majumder',
      subject: 'Child Development, Pedagogy & Education Psychology',
      qualification: 'M.A. (Education), M.Ed., Ph.D. (Tripura University), NET Qualified',
      experience: '14 Years Experience',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      bio: 'Founder & Academic Director at C.G.A Udaipur. Mentored 450+ TET, STGT, and STPGT qualifiers across Tripura.',
      specializationTags: ['TET Paper I & II', 'STGT Pedagogy', 'Academic Strategy'],
    },
    {
      id: 'fac-2',
      name: 'Prof. Rajat Kanti Bhowmik',
      subject: 'Quantitative Aptitude & Secondary Mathematics',
      qualification: 'M.Sc. (Mathematics, Gold Medalist), B.Ed.',
      experience: '11 Years Experience',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      bio: 'Renowned for shortcut arithmetic techniques for IBPS/SSC/JRBT and deep conceptual clarity for Class IX–X TBSE & CBSE Mathematics.',
      specializationTags: ['Banking & SSC Maths', 'TET Mathematics', 'Class IX-X Maths'],
    },
    {
      id: 'fac-3',
      name: 'Smt. Poulami Sen Gupta',
      subject: 'English Literature, Grammar & Descriptive Writing',
      qualification: 'M.A. in English (Jadavpur University), B.Ed., SET Qualified',
      experience: '9 Years Experience',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      bio: 'Leads STGT/STPGT English and TPSC/JRBT Descriptive English preparation with structured vocabulary & comprehension drills.',
      specializationTags: ['STGT/STPGT English', 'TPSC Precis & Essay', 'CBSE English'],
    },
    {
      id: 'fac-4',
      name: 'Sri Bikramjit Debbarma',
      subject: 'General Studies, Indian Polity, History & Tripura GK',
      qualification: 'M.A. (Political Science), Ex-TPSC Interview Panelist & Researcher',
      experience: '10 Years Experience',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      bio: 'Author of C.G.A’s bestselling “Complete Panorama of Tripura & NE State Affairs” used by TPSC and JRBT rank-holders.',
      specializationTags: ['TPSC Combined', 'JRBT GK', 'History & Polity'],
    },
    {
      id: 'fac-5',
      name: 'Dr. Nilanjan Roy',
      subject: 'Physical Science, Chemistry & Biology (STGT / Board Wing)',
      qualification: 'M.Sc. (Physics), Ph.D., B.Ed.',
      experience: '8 Years Experience',
      photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
      bio: 'Heads the Science Wing for STGT (Science), STPGT, and Class VII to X TBSE/CBSE Foundation batches.',
      specializationTags: ['STGT Science', 'TBSE/CBSE Science', 'Environmental Studies'],
    },
    {
      id: 'fac-6',
      name: 'Sri Sourav Bhattacharjee',
      subject: 'Reasoning Ability, Computer Awareness & Railway/Banking CBT',
      qualification: 'B.Tech (CSE), Cleared IBPS PO & RRB NTPC Twice',
      experience: '7 Years Experience',
      photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
      bio: 'Specializes in high-speed logical puzzles, seating arrangements, and CBT test-taking strategy for Banking, SSC, and Railways.',
      specializationTags: ['Logical Reasoning', 'IBPS & SBI PO', 'RRB & SSC CGL'],
    },
  ],

  courses: [
    // ==================== CATEGORY A: TEACHING & RECRUITMENT EXAMS ====================
    {
      id: 'crs-tet-1',
      name: 'Tripura TET (Paper I & II) Integrated Target Batch',
      category: 'Teaching and Recruitment Exams',
      subCategory: 'TET',
      board: 'Competitive',
      description:
        'Comprehensive TRBT syllabus coverage for Paper-I (Class I–V) and Paper-II (Class VI–VIII) including Child Development & Pedagogy, Bengali, English, Mathematics, Science & Social Studies.',
      syllabusHighlights: [
        'Complete Child Development & Pedagogy (CDP) 30-Mark Mastery',
        'Language I (Bengali) & Language II (English) Grammar + Pedagogy',
        '20 Full-Length OMR & Online Mock Tests with TRBT Standard',
      ],
      price: 8500,
      instalmentAvailable: true,
      firstInstalment: 4500,
      facultyId: 'fac-1',
      facultyName: 'Dr. Subrata Majumder',
      batchName: 'TET-2026 Morning Batch A',
      batchSize: 40,
      seatsAvailable: 7,
      waitingListCount: 0,
      duration: '6 Months',
      startDate: '2026-10-15',
      schedule: 'Tue, Thu, Sat, Sun — 8:00 AM to 10:30 AM',
      status: 'Open for Admission',
      featured: true,
      linkedMaterialIds: ['mat-1', 'mat-2'],
    },
    {
      id: 'crs-stgt-1',
      name: 'TRBT STGT (Selection Test for Graduate Teachers) — Arts & Humanities',
      category: 'Teaching and Recruitment Exams',
      subCategory: 'STGT',
      board: 'Competitive',
      description:
        'Rigorous subject-wise coaching for STGT Social Studies & Languages (History, Geography, Political Science, English & Bengali) aligned with the latest TRBT notification.',
      syllabusHighlights: [
        'In-depth History, Indian Constitution & Geography Modules',
        'English & Bengali Literature + Grammar Intensive Practice',
        'Topic-wise Printed + Watermarked PDF Study Notes',
      ],
      price: 9500,
      instalmentAvailable: true,
      firstInstalment: 5000,
      facultyId: 'fac-3',
      facultyName: 'Smt. Poulami Sen Gupta',
      batchName: 'STGT-Arts Batch B',
      batchSize: 35,
      seatsAvailable: 5,
      waitingListCount: 0,
      duration: '6 Months',
      startDate: '2026-10-20',
      schedule: 'Mon, Wed, Fri, Sun — 11:00 AM to 1:30 PM',
      status: 'Open for Admission',
      featured: true,
      linkedMaterialIds: ['mat-1', 'mat-3'],
    },
    {
      id: 'crs-stpgt-1',
      name: 'TRBT STPGT (Post Graduate Teacher) Master Batch',
      category: 'Teaching and Recruitment Exams',
      subCategory: 'STPGT',
      board: 'Competitive',
      description:
        'Advanced postgraduate-level coaching for STPGT aspirants covering core paper concepts, unit-wise MCQ banks, and previous years’ TRBT analytical solutions.',
      syllabusHighlights: [
        'Post-Graduate Level Core Subject Modules',
        '15 Unit Tests + 10 Full-Length STPGT Mock Exams',
        'Personal Mentorship & Score Improvement Clinics',
      ],
      price: 11000,
      instalmentAvailable: true,
      firstInstalment: 6000,
      facultyId: 'fac-1',
      facultyName: 'Dr. Subrata Majumder',
      batchName: 'STPGT Weekend Honors Batch',
      batchSize: 30,
      seatsAvailable: 0,
      waitingListCount: 6,
      duration: '7 Months',
      startDate: '2026-10-05',
      schedule: 'Sat & Sun — 2:00 PM to 6:00 PM',
      status: 'Batch Closed',
      featured: false,
      linkedMaterialIds: ['mat-3'],
    },
    {
      id: 'crs-tpsc-1',
      name: 'TPSC Combined Competitive Exam (Prelims + Mains) Foundation',
      category: 'Teaching and Recruitment Exams',
      subCategory: 'TPSC',
      board: 'Competitive',
      description:
        'Complete preparation for Tripura Public Service Commission (TCS/TPS & Combined Misc. Posts) covering Tripura GK, North-East Affairs, Indian Polity, Economy, Quantitative Aptitude, and Mains Answer Writing.',
      syllabusHighlights: [
        'Tripura History, Geography, Economy & Tribal Administration',
        'Descriptive English & Mains GS Paper I–IV Answer Evaluation',
        'Monthly Current Affairs Compendium & Mock Interview Prep',
      ],
      price: 12500,
      instalmentAvailable: true,
      firstInstalment: 6500,
      facultyId: 'fac-4',
      facultyName: 'Sri Bikramjit Debbarma',
      batchName: 'TPSC-2026 Officers Batch',
      batchSize: 35,
      seatsAvailable: 9,
      waitingListCount: 0,
      duration: '8 Months',
      startDate: '2026-10-18',
      schedule: 'Mon to Fri — 5:30 PM to 7:30 PM',
      status: 'Open for Admission',
      featured: true,
      linkedMaterialIds: ['mat-4'],
    },
    {
      id: 'crs-jrbt-1',
      name: 'JRBT Group-C (LDC / Agri Assistant) & Group-D Fast-Track Batch',
      category: 'Teaching and Recruitment Exams',
      subCategory: 'JRBT',
      board: 'Competitive',
      description:
        'Focused coaching for Joint Recruitment Board Tripura examinations covering English, General Knowledge, Tripura Current Affairs, Simple Arithmetic, and Interview Readiness.',
      syllabusHighlights: [
        'High-Scoring Tripura GK & Current Affairs Capsules',
        'English Grammar, Precis & Official Drafting Practice',
        'Weekly Full-Length JRBT Pattern Tests',
      ],
      price: 6000,
      instalmentAvailable: true,
      firstInstalment: 3500,
      facultyId: 'fac-4',
      facultyName: 'Sri Bikramjit Debbarma',
      batchName: 'JRBT-Selection Batch 04',
      batchSize: 45,
      seatsAvailable: 12,
      waitingListCount: 0,
      duration: '4 Months',
      startDate: '2026-10-25',
      schedule: 'Tue, Thu, Sat — 3:00 PM to 5:00 PM',
      status: 'Open for Admission',
      featured: false,
      linkedMaterialIds: ['mat-4'],
    },

    // ==================== CATEGORY B: BANKING, SSC AND RAILWAY ====================
    {
      id: 'crs-bank-1',
      name: 'Banking Pro: IBPS PO / Clerk, SBI & Tripura Gramin Bank (RRB)',
      category: 'Banking, SSC and Railway',
      subCategory: 'Banking (IBPS / SBI / RRB)',
      board: 'Competitive',
      description:
        'Master Quantitative Aptitude, High-Level Reasoning Puzzles, Banking & Financial Awareness, and English Language for Prelims, Mains, and Interview stages.',
      syllabusHighlights: [
        'Speed Maths, Data Interpretation & Seating Arrangement Mastery',
        'Banking Awareness, RBI Policies & Static GK Handbook',
        '30+ Computer-Based Timed Sectional & Full Mock Tests',
      ],
      price: 9000,
      instalmentAvailable: true,
      firstInstalment: 5000,
      facultyId: 'fac-6',
      facultyName: 'Sri Sourav Bhattacharjee',
      batchName: 'Bankers Target Batch 2026',
      batchSize: 35,
      seatsAvailable: 8,
      waitingListCount: 0,
      duration: '6 Months',
      startDate: '2026-10-12',
      schedule: 'Mon, Wed, Fri — 8:30 AM to 11:00 AM',
      status: 'Open for Admission',
      featured: true,
      linkedMaterialIds: ['mat-5'],
    },
    {
      id: 'crs-ssc-1',
      name: 'SSC Combined (CGL, CHSL, MTS & GD Constable) Intensive Batch',
      category: 'Banking, SSC and Railway',
      subCategory: 'SSC (CGL / CHSL / MTS)',
      board: 'Competitive',
      description:
        'Tier-I and Tier-II preparation for Staff Selection Commission exams with special focus on Advanced Maths (Geometry, Trigonometry, Algebra), English Comprehension, and General Awareness.',
      syllabusHighlights: [
        'Arithmetic + Advance Maths Short-Tricks Workbook',
        'TCS-Pattern Previous 5 Years Question Bank Practice',
        'Computer Knowledge & Typing Speed Guidance',
      ],
      price: 8000,
      instalmentAvailable: true,
      firstInstalment: 4000,
      facultyId: 'fac-2',
      facultyName: 'Prof. Rajat Kanti Bhowmik',
      batchName: 'SSC Conquerors Batch',
      batchSize: 40,
      seatsAvailable: 11,
      waitingListCount: 0,
      duration: '6 Months',
      startDate: '2026-10-22',
      schedule: 'Tue, Thu, Sat — 11:00 AM to 1:30 PM',
      status: 'Open for Admission',
      featured: false,
      linkedMaterialIds: ['mat-5'],
    },
    {
      id: 'crs-rail-1',
      name: 'Railway Recruitment Board (RRB NTPC, ALP & Group-D) Special Batch',
      category: 'Banking, SSC and Railway',
      subCategory: 'Railway (RRB NTPC / Group-D)',
      board: 'Competitive',
      description:
        'Complete CBT-1 & CBT-2 syllabus coverage with intensive General Science (Physics, Chemistry, Life Science), Mathematics, and General Intelligence & Reasoning.',
      syllabusHighlights: [
        'NCERT-Based General Science One-Liners & Numericals',
        '100-Question / 90-Minute Timed Speed Drills',
        'Bilingual Study Materials (Bengali & English)',
      ],
      price: 6800,
      instalmentAvailable: true,
      firstInstalment: 3800,
      facultyId: 'fac-6',
      facultyName: 'Sri Sourav Bhattacharjee',
      batchName: 'RRB Express Batch 02',
      batchSize: 40,
      seatsAvailable: 0,
      waitingListCount: 4,
      duration: '5 Months',
      startDate: '2026-10-08',
      schedule: 'Mon, Wed, Fri — 3:00 PM to 5:00 PM',
      status: 'Batch Closed',
      featured: false,
      linkedMaterialIds: ['mat-5'],
    },

    // ==================== CATEGORY C: OTHER COMPETITIVE EXAMINATIONS ====================
    {
      id: 'crs-comp-1',
      name: 'Tripura Police Sub-Inspector, TSR & Defence Entrance Batch',
      category: 'Other Competitive Examinations',
      subCategory: 'Police & Defence Exams',
      board: 'Competitive',
      description:
        'Written exam and aptitude preparation for Tripura Police SI, Constable, TSR, Assam Rifles, and CAPF examinations with regular mock tests.',
      syllabusHighlights: [
        'Elementary Mathematics, Reasoning & General Knowledge',
        'Legal & Civic Awareness + Tripura State GK',
        'Bi-Weekly OMR Practice Tests',
      ],
      price: 5500,
      instalmentAvailable: true,
      firstInstalment: 3000,
      facultyId: 'fac-4',
      facultyName: 'Sri Bikramjit Debbarma',
      batchName: 'Defence & Uniformed Services Batch',
      batchSize: 40,
      seatsAvailable: 14,
      waitingListCount: 0,
      duration: '4 Months',
      startDate: '2026-11-01',
      schedule: 'Tue, Thu, Sat — 5:00 PM to 7:00 PM',
      status: 'Open for Admission',
      featured: false,
      linkedMaterialIds: ['mat-4'],
    },
    {
      id: 'crs-comp-2',
      name: 'CUET (UG) & Combined Entrance Aptitude Foundation',
      category: 'Other Competitive Examinations',
      subCategory: 'CUET & University Entrance',
      board: 'Competitive',
      description:
        'General Test, English Language, and Domain Subject preparation for Central University Entrance Test (CUET) and state professional entrance exams.',
      syllabusHighlights: [
        'General Test: Quantitative, Logical & Current Affairs',
        'Reading Comprehension & Verbal Ability Mastery',
        '12 Full-Length NTA-Pattern Mock Tests',
      ],
      price: 6200,
      instalmentAvailable: false,
      firstInstalment: 6200,
      facultyId: 'fac-3',
      facultyName: 'Smt. Poulami Sen Gupta',
      batchName: 'CUET Target 2027',
      batchSize: 30,
      seatsAvailable: 10,
      waitingListCount: 0,
      duration: '4 Months',
      startDate: '2026-11-05',
      schedule: 'Sat & Sun — 10:00 AM to 1:00 PM',
      status: 'Open for Admission',
      featured: false,
      linkedMaterialIds: ['mat-5'],
    },

    // ==================== CATEGORY D: SCHOOL COACHING (CLASS VII TO X — TBSE & CBSE SEPARATE) ====================
    // --- TBSE BOARD (Class VII, VIII, IX, X) ---
    {
      id: 'crs-tbse-7',
      name: 'Class VII — TBSE All-Subjects Foundation Batch',
      category: 'School Coaching',
      subCategory: 'Class VII (TBSE Board)',
      board: 'TBSE',
      classLevel: 'Class VII',
      description:
        'Dedicated Tripura Board (TBSE) coaching for Class VII covering Mathematics, Science, English, and Social Studies with concept building and monthly unit tests.',
      syllabusHighlights: [
        'TBSE Prescribed SCERT Curriculum Full Coverage',
        'Mathematics & Science Concept Lab Worksheets',
        'Monthly Parent-Teacher Progress Report',
      ],
      price: 4200,
      instalmentAvailable: true,
      firstInstalment: 2200,
      facultyId: 'fac-5',
      facultyName: 'Dr. Nilanjan Roy',
      batchName: 'TBSE-VII Morning Wing',
      batchSize: 25,
      seatsAvailable: 8,
      waitingListCount: 0,
      duration: '10 Months (Academic Session)',
      startDate: '2026-10-10',
      schedule: 'Mon, Wed, Fri — 7:30 AM to 9:00 AM',
      status: 'Open for Admission',
      featured: false,
      linkedMaterialIds: ['mat-6'],
    },
    {
      id: 'crs-tbse-8',
      name: 'Class VIII — TBSE Comprehensive Academic Batch',
      category: 'School Coaching',
      subCategory: 'Class VIII (TBSE Board)',
      board: 'TBSE',
      classLevel: 'Class VIII',
      description:
        'Structured Class VIII TBSE coaching focusing on Algebra, Geometry, Physical & Life Science, English Grammar & Writing, and History/Geography.',
      syllabusHighlights: [
        'Chapter-wise Printed Study Notes & Exercise Solutions',
        'Fortnightly Written Tests on TBSE Question Pattern',
        'Special Scholarship & Olympiad Preparation Support',
      ],
      price: 4500,
      instalmentAvailable: true,
      firstInstalment: 2500,
      facultyId: 'fac-5',
      facultyName: 'Dr. Nilanjan Roy',
      batchName: 'TBSE-VIII Morning Wing',
      batchSize: 25,
      seatsAvailable: 6,
      waitingListCount: 0,
      duration: '10 Months (Academic Session)',
      startDate: '2026-10-10',
      schedule: 'Tue, Thu, Sat — 7:30 AM to 9:00 AM',
      status: 'Open for Admission',
      featured: false,
      linkedMaterialIds: ['mat-6'],
    },
    {
      id: 'crs-tbse-9',
      name: 'Class IX — TBSE Pre-Madhyamik Excellence Batch',
      category: 'School Coaching',
      subCategory: 'Class IX (TBSE Board)',
      board: 'TBSE',
      classLevel: 'Class IX',
      description:
        'Intensive Class IX coaching under Tripura Board of Secondary Education (TBSE) building a strong base in Mathematics, Physical Science, Life Science, and English.',
      syllabusHighlights: [
        'In-depth Numerical Problem Solving in Physical Science & Maths',
        'Half-Yearly & Annual Model Question Paper Series',
        'Dedicated Doubt-Clearing Sessions Every Sunday',
      ],
      price: 5200,
      instalmentAvailable: true,
      firstInstalment: 2800,
      facultyId: 'fac-2',
      facultyName: 'Prof. Rajat Kanti Bhowmik',
      batchName: 'TBSE-IX Scholars Batch',
      batchSize: 30,
      seatsAvailable: 7,
      waitingListCount: 0,
      duration: '10 Months (Academic Session)',
      startDate: '2026-10-12',
      schedule: 'Mon, Wed, Fri — 4:00 PM to 6:00 PM',
      status: 'Open for Admission',
      featured: false,
      linkedMaterialIds: ['mat-6'],
    },
    {
      id: 'crs-tbse-10',
      name: 'Class X (Madhyamik) — TBSE Board Topper Target Batch',
      category: 'School Coaching',
      subCategory: 'Class X (TBSE Board)',
      board: 'TBSE',
      classLevel: 'Class X',
      description:
        'Flagship TBSE Madhyamik (Class X) batch featuring complete syllabus mastery, TBSE Question Bank solving, 15 Pre-Board Mock Exams, and answer-script presentation workshops.',
      syllabusHighlights: [
        'Complete TBSE Madhyamik Suggestion & Paid Notes Package',
        '15 Full-Length Board Pattern Mock Tests with Evaluation',
        'Proven Track Record of 95%+ Scorers in Gomati District',
      ],
      price: 6000,
      instalmentAvailable: true,
      firstInstalment: 3200,
      facultyId: 'fac-2',
      facultyName: 'Prof. Rajat Kanti Bhowmik',
      batchName: 'TBSE-X Madhyamik Rankers',
      batchSize: 30,
      seatsAvailable: 4,
      waitingListCount: 0,
      duration: '10 Months (Academic Session)',
      startDate: '2026-10-12',
      schedule: 'Tue, Thu, Sat — 4:00 PM to 6:30 PM',
      status: 'Open for Admission',
      featured: true,
      linkedMaterialIds: ['mat-6'],
    },

    // --- CBSE BOARD (Class VII, VIII, IX, X) ---
    {
      id: 'crs-cbse-7',
      name: 'Class VII — CBSE NCERT Concept & Olympiad Batch',
      category: 'School Coaching',
      subCategory: 'Class VII (CBSE Board)',
      board: 'CBSE',
      classLevel: 'Class VII',
      description:
        'Exclusive CBSE Class VII batch following the latest NCERT & NEP-2020 competency-based framework for Mathematics, Science, English, and Social Science.',
      syllabusHighlights: [
        '100% NCERT + Exemplar Problem Solving',
        'Assertion-Reasoning & Case-Study Question Practice',
        'Interactive Science & Maths Activity Worksheets',
      ],
      price: 4500,
      instalmentAvailable: true,
      firstInstalment: 2500,
      facultyId: 'fac-5',
      facultyName: 'Dr. Nilanjan Roy',
      batchName: 'CBSE-VII Evening Wing',
      batchSize: 25,
      seatsAvailable: 9,
      waitingListCount: 0,
      duration: '10 Months (Academic Session)',
      startDate: '2026-10-14',
      schedule: 'Mon, Wed, Fri — 5:00 PM to 6:30 PM',
      status: 'Open for Admission',
      featured: false,
      linkedMaterialIds: ['mat-7'],
    },
    {
      id: 'crs-cbse-8',
      name: 'Class VIII — CBSE NCERT Mastery & Foundation Batch',
      category: 'School Coaching',
      subCategory: 'Class VIII (CBSE Board)',
      board: 'CBSE',
      classLevel: 'Class VIII',
      description:
        'High-impact CBSE Class VIII coaching covering NCERT Mathematics, Physics/Chemistry/Biology modules, and English communicative & analytical writing.',
      syllabusHighlights: [
        'NCERT Exemplar & HOTS (Higher Order Thinking Skills) Drills',
        'Periodic Test (PT-1, PT-2, Half-Yearly & Annual) Mock Series',
        'Individual Performance Analytics on Student Portal',
      ],
      price: 4800,
      instalmentAvailable: true,
      firstInstalment: 2600,
      facultyId: 'fac-5',
      facultyName: 'Dr. Nilanjan Roy',
      batchName: 'CBSE-VIII Evening Wing',
      batchSize: 25,
      seatsAvailable: 5,
      waitingListCount: 0,
      duration: '10 Months (Academic Session)',
      startDate: '2026-10-14',
      schedule: 'Tue, Thu, Sat — 5:00 PM to 6:30 PM',
      status: 'Open for Admission',
      featured: false,
      linkedMaterialIds: ['mat-7'],
    },
    {
      id: 'crs-cbse-9',
      name: 'Class IX — CBSE NCERT + Competency-Based Board Prep',
      category: 'School Coaching',
      subCategory: 'Class IX (CBSE Board)',
      board: 'CBSE',
      classLevel: 'Class IX',
      description:
        'Rigorous CBSE Class IX batch covering Mathematics (RD Sharma + NCERT), Science (Physics, Chemistry, Biology), Social Science, and English Language & Literature.',
      syllabusHighlights: [
        'Competency-Based MCQs, Case Studies & Numerical Mastery',
        'Chapter-wise Digital & Printed Formula + Revision Sheets',
        'Bi-Weekly CBSE Pattern Unit Assessments',
      ],
      price: 5500,
      instalmentAvailable: true,
      firstInstalment: 3000,
      facultyId: 'fac-2',
      facultyName: 'Prof. Rajat Kanti Bhowmik',
      batchName: 'CBSE-IX Achievers Batch',
      batchSize: 30,
      seatsAvailable: 0,
      waitingListCount: 3,
      duration: '10 Months (Academic Session)',
      startDate: '2026-10-06',
      schedule: 'Mon, Wed, Fri — 6:00 PM to 8:00 PM',
      status: 'Batch Closed',
      featured: false,
      linkedMaterialIds: ['mat-7'],
    },
    {
      id: 'crs-cbse-10',
      name: 'Class X — CBSE All-India Board 95%+ Target Batch',
      category: 'School Coaching',
      subCategory: 'Class X (CBSE Board)',
      board: 'CBSE',
      classLevel: 'Class X',
      description:
        'Comprehensive CBSE Class X coaching for Standard/Basic Mathematics, Science, English, and Social Science with CBSE Sample Paper solving and 15 full-length Pre-Board tests.',
      syllabusHighlights: [
        'Complete NCERT + Exemplar + Previous 10 Years CBSE PYQs',
        '50% Competency-Focused Questions & Case-Based Practice',
        'Exclusive C.G.A CBSE Class X Paid Revision Notes',
      ],
      price: 6500,
      instalmentAvailable: true,
      firstInstalment: 3500,
      facultyId: 'fac-2',
      facultyName: 'Prof. Rajat Kanti Bhowmik',
      batchName: 'CBSE-X Board Toppers Batch',
      batchSize: 30,
      seatsAvailable: 6,
      waitingListCount: 0,
      duration: '10 Months (Academic Session)',
      startDate: '2026-10-16',
      schedule: 'Tue, Thu, Sat — 6:00 PM to 8:00 PM',
      status: 'Open for Admission',
      featured: true,
      linkedMaterialIds: ['mat-7'],
    },
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
      id: 'mock-1',
      title: 'Tripura TET Full-Length Mock Test #01 (CDP, English, Maths & EVS)',
      courseId: 'crs-tet-1',
      courseName: 'Tripura TET (Paper I & II) Integrated Target Batch',
      batchName: 'TET-2026 Morning Batch A',
      durationMinutes: 15,
      totalMarks: 20,
      marksPerQuestion: 4,
      negativeMarking: 1,
      scheduledDate: '2026-10-05',
      status: 'Published',
      questions: [
        {
          id: 'q-1',
          question:
            'Which psychologist introduced the concept of "Zone of Proximal Development (ZPD)" in cognitive learning?',
          options: ['Jean Piaget', 'Lev Vygotsky', 'B.F. Skinner', 'Lawrence Kohlberg'],
          correctOptionIndex: 1,
          explanation:
            'Lev Vygotsky proposed the Zone of Proximal Development (ZPD) as part of his Socio-Cultural Theory of Development.',
        },
        {
          id: 'q-2',
          question:
            'In the Van Hiele model of geometric thought, at which level does a child begin to identify shapes by their specific properties rather than just visual appearance?',
          options: [
            'Level 0 — Visualization',
            'Level 1 — Analysis',
            'Level 2 — Informal Deduction',
            'Level 4 — Rigor',
          ],
          correctOptionIndex: 1,
          explanation:
            'At Level 1 (Analysis), learners classify and analyze figures based on their geometric properties.',
        },
        {
          id: 'q-3',
          question:
            'Which wildlife sanctuary in Tripura is famous for the Clouded Leopard National Park and Phayre’s Leaf Monkey?',
          options: [
            'Rowa Wildlife Sanctuary',
            'Trishna Wildlife Sanctuary',
            'Sepahijala Wildlife Sanctuary',
            'Gumti Wildlife Sanctuary',
          ],
          correctOptionIndex: 2,
          explanation:
            'Sepahijala Wildlife Sanctuary houses the Clouded Leopard National Park and is renowned for Phayre’s Langur (Spectacled Monkey).',
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
          options: ['5:6', '6:7', '7:8', '8:9'],
          correctOptionIndex: 0,
          explanation:
            '4x + 5x = 36 => 9x = 36 => x = 4. Present ages are 16 and 20. After 4 years, ages will be 20 and 24, so ratio = 20:24 = 5:6.',
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

  students: [
    {
      id: 'stu-1',
      studentCode: 'CGA-2026-001',
      name: 'Arijit Debnath',
      email: 'student@cgaudaipur.in',
      phone: '+91 94369 11204',
      password: 'password123',
      photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
      guardianName: 'Sri Dulal Debnath',
      address: 'Rajarbag, Near Gomati District Hospital, Udaipur, Tripura 799114',
      qualification: 'B.A. (Hons), B.Ed.',
      targetExam: 'Tripura TET & TPSC Combined',
      joinedDate: '2026-08-12',
      status: 'Active',
      enrollments: [
        {
          courseId: 'crs-tet-1',
          courseName: 'Tripura TET (Paper I & II) Integrated Target Batch',
          batchName: 'TET-2026 Morning Batch A',
          facultyName: 'Dr. Subrata Majumder',
          enrolledDate: '2026-08-12',
          progress: 68,
          totalFee: 8500,
          paidAmount: 8500,
          dueAmount: 0,
        },
        {
          courseId: 'crs-tpsc-1',
          courseName: 'TPSC Combined Competitive Exam (Prelims + Mains) Foundation',
          batchName: 'TPSC-2026 Officers Batch',
          facultyName: 'Sri Bikramjit Debbarma',
          enrolledDate: '2026-09-01',
          progress: 42,
          totalFee: 12500,
          paidAmount: 6500,
          dueAmount: 6000,
          nextDueDate: '2026-10-20',
        },
      ],
    },
    {
      id: 'stu-2',
      studentCode: 'CGA-2026-002',
      name: 'Priyanka Majumder',
      email: 'priyanka.m@cgaudaipur.in',
      phone: '+91 87874 22319',
      password: 'password123',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
      guardianName: 'Sri Tapas Majumder',
      address: 'Chanban, Behind Youth Club, Udaipur, Tripura 799114',
      qualification: 'M.A. (English), B.Ed.',
      targetExam: 'TRBT STGT & TET Paper-II',
      joinedDate: '2026-08-15',
      status: 'Active',
      enrollments: [
        {
          courseId: 'crs-tet-1',
          courseName: 'Tripura TET (Paper I & II) Integrated Target Batch',
          batchName: 'TET-2026 Morning Batch A',
          facultyName: 'Dr. Subrata Majumder',
          enrolledDate: '2026-08-15',
          progress: 75,
          totalFee: 8500,
          paidAmount: 8500,
          dueAmount: 0,
        },
        {
          courseId: 'crs-stgt-1',
          courseName: 'TRBT STGT (Selection Test for Graduate Teachers) — Arts & Humanities',
          batchName: 'STGT-Arts Batch B',
          facultyName: 'Smt. Poulami Sen Gupta',
          enrolledDate: '2026-08-20',
          progress: 55,
          totalFee: 9500,
          paidAmount: 5000,
          dueAmount: 4500,
          nextDueDate: '2026-10-15',
        },
      ],
    },
    {
      id: 'stu-3',
      studentCode: 'CGA-2026-003',
      name: 'Sourav Kanti Das',
      email: 'sourav.das@cgaudaipur.in',
      phone: '+91 96123 88410',
      password: 'password123',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      guardianName: 'Sri Haripada Das',
      address: 'Matabari Road, Udaipur, Tripura 799114',
      qualification: 'B.Sc. (Mathematics)',
      targetExam: 'IBPS PO & SSC CGL',
      joinedDate: '2026-08-22',
      status: 'Active',
      enrollments: [
        {
          courseId: 'crs-bank-1',
          courseName: 'Banking Pro: IBPS PO / Clerk, SBI & Tripura Gramin Bank (RRB)',
          batchName: 'Bankers Target Batch 2026',
          facultyName: 'Sri Sourav Bhattacharjee',
          enrolledDate: '2026-08-22',
          progress: 60,
          totalFee: 9000,
          paidAmount: 5000,
          dueAmount: 4000,
          nextDueDate: '2026-10-10',
        },
      ],
    },
    {
      id: 'stu-4',
      studentCode: 'CGA-2026-004',
      name: 'Riya Karmakar',
      email: 'riya.k@cgaudaipur.in',
      phone: '+91 98621 55012',
      password: 'password123',
      photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop&q=80',
      guardianName: 'Sri Bimal Karmakar',
      address: 'Dhajanagar, Udaipur, Gomati Tripura 799114',
      qualification: 'Class X Student (TBSE)',
      targetExam: 'TBSE Madhyamik Board 2027',
      joinedDate: '2026-08-28',
      status: 'Active',
      enrollments: [
        {
          courseId: 'crs-tbse-10',
          courseName: 'Class X (Madhyamik) — TBSE Board Topper Target Batch',
          batchName: 'TBSE-X Madhyamik Rankers',
          facultyName: 'Prof. Rajat Kanti Bhowmik',
          enrolledDate: '2026-08-28',
          progress: 82,
          totalFee: 6000,
          paidAmount: 6000,
          dueAmount: 0,
        },
      ],
    },
    {
      id: 'stu-5',
      studentCode: 'CGA-2026-005',
      name: 'Abhishek Debbarma',
      email: 'abhishek.db@cgaudaipur.in',
      phone: '+91 70051 99231',
      password: 'password123',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      guardianName: 'Sri Ratan Debbarma',
      address: 'Kakraban Road, Udaipur, Tripura 799114',
      qualification: 'Class X Student (CBSE)',
      targetExam: 'CBSE Class X Board 2027',
      joinedDate: '2026-09-02',
      status: 'Active',
      enrollments: [
        {
          courseId: 'crs-cbse-10',
          courseName: 'Class X — CBSE All-India Board 95%+ Target Batch',
          batchName: 'CBSE-X Board Toppers Batch',
          facultyName: 'Prof. Rajat Kanti Bhowmik',
          enrolledDate: '2026-09-02',
          progress: 50,
          totalFee: 6500,
          paidAmount: 3500,
          dueAmount: 3000,
          nextDueDate: '2026-10-18',
        },
      ],
    },
  ],

  testAttempts: [
    {
      id: 'att-1',
      testId: 'mock-1',
      testTitle: 'Tripura TET Full-Length Mock Test #01 (CDP, English, Maths & EVS)',
      courseId: 'crs-tet-1',
      studentId: 'stu-2',
      studentName: 'Priyanka Majumder',
      score: 20,
      totalMarks: 20,
      correctCount: 5,
      wrongCount: 0,
      unattemptedCount: 0,
      accuracy: 100,
      timeTakenMinutes: 9,
      submittedAt: '2026-09-28 10:15 AM',
      answers: { 'q-1': 1, 'q-2': 1, 'q-3': 2, 'q-4': 1, 'q-5': 0 },
    },
    {
      id: 'att-2',
      testId: 'mock-1',
      testTitle: 'Tripura TET Full-Length Mock Test #01 (CDP, English, Maths & EVS)',
      courseId: 'crs-tet-1',
      studentId: 'stu-1',
      studentName: 'Arijit Debnath',
      score: 15,
      totalMarks: 20,
      correctCount: 4,
      wrongCount: 1,
      unattemptedCount: 0,
      accuracy: 80,
      timeTakenMinutes: 11,
      submittedAt: '2026-09-28 11:30 AM',
      answers: { 'q-1': 1, 'q-2': 0, 'q-3': 2, 'q-4': 1, 'q-5': 0 },
    },
    {
      id: 'att-3',
      testId: 'mock-3',
      testTitle: 'TBSE Class X (Madhyamik) Mathematics & Physical Science Unit Test',
      courseId: 'crs-tbse-10',
      studentId: 'stu-4',
      studentName: 'Riya Karmakar',
      score: 16,
      totalMarks: 16,
      correctCount: 4,
      wrongCount: 0,
      unattemptedCount: 0,
      accuracy: 100,
      timeTakenMinutes: 8,
      submittedAt: '2026-09-29 04:20 PM',
      answers: { 'q-301': 1, 'q-302': 2, 'q-303': 2, 'q-304': 1 },
    },
  ],

  feePayments: [
    {
      id: 'pay-1',
      receiptNo: 'CGA/2026/RCP-1041',
      studentId: 'stu-1',
      studentName: 'Arijit Debnath',
      courseId: 'crs-tet-1',
      courseName: 'Tripura TET (Paper I & II) Integrated Target Batch',
      amount: 8500,
      paymentMode: 'UPI',
      paymentType: 'Full Payment',
      date: '2026-08-12',
      remarks: 'Full course fee settled via UPI (GPay).',
    },
    {
      id: 'pay-2',
      receiptNo: 'CGA/2026/RCP-1068',
      studentId: 'stu-1',
      studentName: 'Arijit Debnath',
      courseId: 'crs-tpsc-1',
      courseName: 'TPSC Combined Competitive Exam (Prelims + Mains) Foundation',
      amount: 6500,
      paymentMode: 'Debit/Credit Card',
      paymentType: 'Instalment 1',
      date: '2026-09-01',
      remarks: 'First instalment received; balance Rs. 6,000 due by Oct 20.',
    },
    {
      id: 'pay-3',
      receiptNo: 'CGA/2026/RCP-1049',
      studentId: 'stu-2',
      studentName: 'Priyanka Majumder',
      courseId: 'crs-tet-1',
      courseName: 'Tripura TET (Paper I & II) Integrated Target Batch',
      amount: 8500,
      paymentMode: 'UPI',
      paymentType: 'Full Payment',
      date: '2026-08-15',
      remarks: 'Full payment cleared.',
    },
    {
      id: 'pay-4',
      receiptNo: 'CGA/2026/RCP-1055',
      studentId: 'stu-2',
      studentName: 'Priyanka Majumder',
      courseId: 'crs-stgt-1',
      courseName: 'TRBT STGT (Selection Test for Graduate Teachers) — Arts & Humanities',
      amount: 5000,
      paymentMode: 'Cash at Counter',
      paymentType: 'Instalment 1',
      date: '2026-08-20',
      remarks: 'Admission instalment paid at Udaipur office counter.',
    },
    {
      id: 'pay-5',
      receiptNo: 'CGA/2026/RCP-1072',
      studentId: 'stu-3',
      studentName: 'Sourav Kanti Das',
      courseId: 'crs-bank-1',
      courseName: 'Banking Pro: IBPS PO / Clerk, SBI & Tripura Gramin Bank (RRB)',
      amount: 5000,
      paymentMode: 'UPI',
      paymentType: 'Instalment 1',
      date: '2026-08-22',
      remarks: '1st instalment received.',
    },
    {
      id: 'pay-6',
      receiptNo: 'CGA/2026/RCP-1080',
      studentId: 'stu-4',
      studentName: 'Riya Karmakar',
      courseId: 'crs-tbse-10',
      courseName: 'Class X (Madhyamik) — TBSE Board Topper Target Batch',
      amount: 6000,
      paymentMode: 'Cash at Counter',
      paymentType: 'Full Payment',
      date: '2026-08-28',
      remarks: 'Full session fee paid.',
    },
    {
      id: 'pay-7',
      receiptNo: 'CGA/2026/RCP-1089',
      studentId: 'stu-5',
      studentName: 'Abhishek Debbarma',
      courseId: 'crs-cbse-10',
      courseName: 'Class X — CBSE All-India Board 95%+ Target Batch',
      amount: 3500,
      paymentMode: 'Net Banking',
      paymentType: 'Instalment 1',
      date: '2026-09-02',
      remarks: '1st instalment paid.',
    },
  ],

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

  enquiries: [
    {
      id: 'enq-1',
      name: 'Tanusree Roy',
      phone: '+91 94364 77812',
      email: 'tanusree.roy99@gmail.com',
      courseInterest: 'TRBT STGT (Selection Test for Graduate Teachers)',
      message: 'I want to know if weekend doubt-clearing classes are available for working private school teachers.',
      createdAt: '2026-09-29 05:12 PM',
    },
  ],
};
