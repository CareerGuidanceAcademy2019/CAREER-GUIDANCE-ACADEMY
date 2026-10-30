import type { SupabaseClient } from '@supabase/supabase-js';
import {
  CgaDatabase,
  INITIAL_SEED_DATA,
  Course,
  FacultyMember,
  Achievement,
  StudyMaterial,
  MockTest,
  MCQQuestion,
  TestAttempt,
  FeePayment,
  StudentProfile,
  StudentEnrollment,
  Announcement,
  SiteContent,
  EnquiryItem,
  MockSeries,
  MockSubject,
  SeriesMockTest,
  SeriesQuestion,
  SeriesAttempt,
  MockSubjectPost,
} from '@/data/initialSeedData';
import { getSupabase } from '@/lib/supabase/client';
import { parseIdentifier, getFacultyAvatarUrl, normalizePhone, isEmail } from '@/lib/names';
import { PAYMENT_SETTINGS } from '@/config/paymentSettings';

export type PortalRole = 'STUDENT' | 'FACULTY' | 'ADMIN';

export interface AuthSession {
  role: PortalRole;
  userId: string;
  name: string;
  email: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  guardianName: string;
  address: string;
  permanentAddress?: string;
  qualification: string;
  targetExam: string;
}

export interface FacultyRegisterPayload {
  name: string;
  designation: string;
  qualification: string;
  experience: string;
  achievements: string;
  workAbility: boolean;
  email: string;
  phone: string;
  password: string;
}

export interface AdminRegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface AllowlistEntry {
  id: string;
  identifier: string;
  role: 'admin' | 'faculty';
  note: string;
  createdAt: string;
}

export interface PendingAdminApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
}

export interface FacultyAccount {
  profileId: string;
  facultyId: string | null;
  name: string;
  email: string;
  phone: string;
  designation: string;
  qualification: string;
  experience: string;
  achievements: string;
  workAbility: string;
  subject?: string;
  status: 'Active' | 'Inactive' | 'Pending';
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

const ROLE_MAP: Record<string, PortalRole> = { admin: 'ADMIN', faculty: 'FACULTY', student: 'STUDENT' };
export const PORTAL_HOME: Record<PortalRole, string> = {
  ADMIN: '/admin/dashboard',
  FACULTY: '/faculty-portal',
  STUDENT: '/student/dashboard',
};

export type ServiceResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
} & (T extends unknown[] ? { items?: T } : Partial<T>);

export interface EnrolSeriesData {
  receiptNo: string;
  amount: number;
  enrollmentId: string;
}

export interface QuestionsData {
  testId: string;
  title: string;
  durationMinutes: number;
  totalMarks: number;
  negativeMarking: number;
  windowEnd?: string;
  serverNow: string;
  startedAt: string;
  savedAnswers: Record<string, number>;
  questions: SeriesQuestion[];
}

/** Database shown before data finishes loading (no demo records). */
export const EMPTY_DATABASE: CgaDatabase = {
  siteContent: INITIAL_SEED_DATA.siteContent,
  courses: [],
  faculty: [],
  achievements: [],
  studyMaterials: [],
  mockTests: [],
  testAttempts: [],
  students: [],
  feePayments: [],
  announcements: [],
  enquiries: [],
  mockSeries: [],
  mockSubjects: [],
  seriesTests: [],
  seriesEnrollments: [],
  seriesAttempts: [],
  mockSubjectPosts: [],
};

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

const formatStamp = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

const msg = (e: { message?: string } | null | undefined, fallback: string) => {
  const m = e?.message || fallback;
  // Postgres "raise exception" text is already user-friendly.
  return m;
};

// ---------------------------------------------------------------- mappers
const toFaculty = (r: Row): FacultyMember => ({
  id: r.id,
  name: r.name,
  designation: r.designation || undefined,
  subject: r.subject,
  qualification: r.qualification ?? '',
  experience: r.experience ?? '',
  photo: r.photo || getFacultyAvatarUrl(r.name),
  bio: r.bio ?? '',
  specializationTags: r.specialization_tags ?? [],
  achievements: r.achievements ?? '',
  workAbility: r.work_ability ?? '',
});

const toCourse = (r: Row, facultyName: string, materialIds: string[]): Course => ({
  id: r.id,
  name: r.name,
  mode: (r.mode as Course['mode']) ?? 'Offline',
  category: r.category,
  subCategory: r.sub_category,
  board: r.board ?? undefined,
  classLevel: r.class_level ?? undefined,
  description: r.description,
  syllabusHighlights: r.syllabus_highlights ?? [],
  price: Number(r.price),
  monthlyFee: r.monthly_fee != null ? Number(r.monthly_fee) : undefined,
  instalmentAvailable: r.instalment_available,
  firstInstalment: Number(r.first_instalment),
  facultyId: r.faculty_id ?? '',
  facultyName,
  batchName: r.batch_name,
  batchSize: r.batch_size,
  seatsAvailable: r.seats_available,
  waitingListCount: r.waiting_list_count,
  duration: r.duration,
  startDate: r.start_date,
  schedule: r.schedule,
  status: r.status,
  featured: r.featured,
  linkedMaterialIds: materialIds,
  materialDelivery: r.material_delivery ?? (r.mode === 'Online' ? 'View-Only Softcopy' : 'Printed Physical Copies + View-Only Softcopy'),
});

const fromCourse = (c: Course): Row => ({
  id: c.id,
  name: c.name,
  mode: c.mode ?? 'Offline',
  category: c.category,
  sub_category: c.subCategory,
  board: c.board ?? null,
  class_level: c.classLevel ?? null,
  description: c.description,
  syllabus_highlights: c.syllabusHighlights,
  price: c.price,
  monthly_fee: c.monthlyFee ?? null,
  instalment_available: c.instalmentAvailable,
  first_instalment: c.firstInstalment,
  faculty_id: c.facultyId || null,
  batch_name: c.batchName,
  batch_size: c.batchSize,
  seats_available: c.seatsAvailable,
  waiting_list_count: c.waitingListCount,
  duration: c.duration,
  start_date: c.startDate,
  schedule: c.schedule,
  status: c.status,
  featured: !!c.featured,
  material_delivery: c.materialDelivery ?? null,
});

const toMaterial = (r: Row, courseName: string): StudyMaterial => ({
  id: r.id,
  title: r.title,
  courseId: r.course_id,
  courseName,
  type: r.type,
  author: r.author,
  pages: r.pages,
  fileSize: r.file_size,
  uploadedDate: r.uploaded_date,
  description: r.description,
  previewSections: r.preview_sections ?? [],
});

const toTest = (r: Row, courseName: string, isStudent = false, hasSubmitted = false): MockTest => {
  const allQs: MCQQuestion[] = r.questions ?? [];
  const questions: MCQQuestion[] =
    isStudent && !hasSubmitted
      ? allQs.map((q) => ({
          id: q.id,
          question: q.question,
          options: q.options,
          correctOptionIndex: -1, // Hidden prior to test submission
          explanation: '', // Hidden prior to test submission
        }))
      : allQs;

  const rawStatus = (r.status || '').toString().toLowerCase();
  const normalizedStatus: 'Draft' | 'Published' =
    rawStatus === 'published' || rawStatus === 'ready' || rawStatus === 'launched' || rawStatus === 'live'
      ? 'Published'
      : 'Draft';

  return {
    id: r.id,
    title: r.title,
    seriesId: r.series_id ?? undefined,
    subjectId: r.subject_id ?? undefined,
    languageMode: r.language_mode ?? undefined,
    windowStart: r.window_start ?? undefined,
    windowEnd: r.window_end ?? undefined,
    courseId: r.course_id || '',
    courseName: courseName || r.course_name || (r.series_id ? 'Tripura TET Mock Test Series' : ''),
    batchName: r.batch_name || (r.series_id ? 'CGA Mock Test Series' : 'TET Target Batch'),
    durationMinutes: r.duration_minutes || 30,
    totalMarks: Number(r.total_marks || (questions.length ? questions.length * Number(r.marks_per_question || 1) : 30)),
    marksPerQuestion: Number(r.marks_per_question || 1),
    negativeMarking: Number(r.negative_marking || 0),
    scheduledDate: r.scheduled_date || (r.window_start ? new Date(r.window_start).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
    status: normalizedStatus,
    subject: r.subject || r.subject_id || undefined,
    driveLink: r.drive_link ?? undefined,
    contentStatus: r.content_status ?? 'draft',
    purgeAfter: r.purge_after ?? undefined,
    retentionDays: r.retention_days ?? 7,
    archiveDownloadedAt: r.archive_downloaded_at ?? undefined,
    questions,
  };
};

const toPayment = (r: Row, studentName: string, courseName: string): FeePayment => ({
  id: r.id,
  receiptNo: r.receipt_no,
  studentId: r.student_id,
  studentName,
  courseId: r.course_id || r.item_id || '',
  courseName: courseName || (r.item_type === 'mock_series' ? 'Tripura TET Mock Test Series' : 'Course'),
  amount: Number(r.amount),
  paymentMode: r.payment_mode,
  paymentType: r.payment_type,
  date: r.date,
  remarks: r.remarks ?? undefined,
  status: r.status ?? 'Verified',
  utr: r.utr ?? undefined,
  screenshot: r.screenshot_url ?? undefined,
  reviewedBy: r.reviewed_by ?? undefined,
  reviewedAt: r.reviewed_at ?? undefined,
  rejectionReason: r.rejection_reason ?? undefined,
  itemType: r.item_type ?? (r.course_id?.startsWith('series-') ? 'mock_series' : 'course'),
  itemId: r.item_id ?? r.course_id ?? undefined,
});

const toAttempt = (r: Row, testTitle: string, courseId: string, studentName: string): TestAttempt => ({
  id: r.id,
  testId: r.test_id,
  testTitle,
  courseId,
  studentId: r.student_id,
  studentName,
  score: Number(r.score),
  totalMarks: Number(r.total_marks),
  correctCount: r.correct_count,
  wrongCount: r.wrong_count,
  unattemptedCount: r.unattempted_count,
  accuracy: Number(r.accuracy),
  timeTakenMinutes: r.time_taken_minutes,
  submittedAt: formatStamp(r.submitted_at),
  answers: r.answers ?? {},
});

const toMockSeries = (r: Row): MockSeries => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  classRange: r.class_range,
  stream: r.stream ?? '',
  price: Number(r.price),
  batchLabel: r.batch_label,
  description: r.description ?? '',
  highlights: r.highlights ?? [],
  status: r.status,
  startsOn: r.starts_on,
});

const toMockSubject = (r: Row): MockSubject => ({
  id: r.id,
  seriesId: r.series_id,
  name: r.name,
  sortOrder: r.sort_order,
});

const toSeriesMockTest = (r: Row): SeriesMockTest => ({
  id: r.id,
  seriesId: r.series_id,
  subjectId: r.subject_id ?? null,
  testType: r.test_type ?? 'sectional',
  title: r.title,
  testNo: r.test_no ?? 1,
  questionCount: r.question_count ?? 30,
  totalMarks: Number(r.total_marks ?? 30),
  marksPerQuestion: Number(r.marks_per_question ?? 1),
  negativeMarking: Number(r.negative_marking ?? 0),
  durationMinutes: r.duration_minutes ?? 30,
  status: r.status,
  windowStart: r.window_start ?? null,
  windowEnd: r.window_end ?? null,
  windowHours: r.window_hours ? Number(r.window_hours) : null,
  showSolutions: r.show_solutions ?? 'after_window',
  shuffle: !!r.shuffle,
  driveLink: r.drive_link ?? undefined,
  contentStatus: r.content_status ?? 'draft',
  purgeAfter: r.purge_after ?? null,
  retentionDays: r.retention_days ? Number(r.retention_days) : 7,
  archiveDownloadedAt: r.archive_downloaded_at ?? null,
  purgeRequiresArchive: r.purge_requires_archive ?? true,
  questions: r.questions ?? [],
});

const toSeriesAttempt = (r: Row, studentName: string, studentCode: string, studentPhone: string): SeriesAttempt => ({
  id: r.id,
  testId: r.test_id,
  studentId: r.student_id,
  studentName,
  studentCode,
  studentPhone,
  startedAt: r.started_at,
  submittedAt: r.submitted_at ? formatStamp(r.submitted_at) : null,
  answers: r.answers ?? {},
  score: Number(r.score),
  correctCount: r.correct_count ?? 0,
  wrongCount: r.wrong_count ?? 0,
  unattemptedCount: r.unattempted_count ?? 0,
  accuracy: Number(r.accuracy ?? 0),
  timeTakenSeconds: r.time_taken_seconds ?? 0,
  rank: r.rank ?? null,
});

// High-Speed Multi-Tier Cache (In-Memory + SessionStorage) with 5-minute TTL
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let dbCache: { data: CgaDatabase; timestamp: number; sessionKey: string } | null = null;
let pendingLoadPromise: Promise<CgaDatabase> | null = null;

export function invalidateDbCache(): void {
  dbCache = null;
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem('cga_db_cache');
    } catch {}
  }
}

// ---------------------------------------------------------------- service
export const cgaService = {
  client(): SupabaseClient {
    return getSupabase();
  },

  // ============ AUTH ============
  async getSession(): Promise<AuthSession | null> {
    const sb = this.client();
    const { data } = await sb.auth.getUser();
    if (!data.user) return null;

    let p: Row | null = null;
    try {
      const res = await sb
        .from('profiles')
        .select('id,role,name,email,status')
        .eq('id', data.user.id)
        .maybeSingle();
      p = res.data;
    } catch {
      p = null;
    }

    if (p) {
      if (p.status !== 'Active') {
        await sb.auth.signOut();
        return null;
      }
      return {
        role: ROLE_MAP[p.role] ?? 'STUDENT',
        userId: p.id,
        name: p.name,
        email: p.email,
      };
    }

    // Fallback if profile row is temporarily unavailable:
    // Only verified institute director and administrator emails can assume administrative role
    const isKnownAdmin =
      data.user.email === 'angatsaha825@gmail.com' ||
      data.user.email === 'careerguidanceacademy2019@gmail.com';
    const role: PortalRole = isKnownAdmin ? 'ADMIN' : 'STUDENT';
    const meta = data.user.user_metadata || {};
    const name =
      meta.name ||
      (data.user.email === 'careerguidanceacademy2019@gmail.com'
        ? 'S Banik'
        : data.user.email === 'angatsaha825@gmail.com'
        ? 'Angat Saha'
        : data.user.email?.split('@')[0] || 'User');
    const email = data.user.email || '';

    return {
      role,
      userId: data.user.id,
      name,
      email,
    };
  },

  /** Sign in with registered email address and password strictly. */
  async login(identifier: string, password: string): Promise<ServiceResult<{ session: AuthSession; isUnconfirmed?: boolean; email?: string }>> {
    const sb = this.client();
    const cleanEmail = identifier.trim().toLowerCase();
    if (!isEmail(cleanEmail) || !password) {
      return { success: false, error: 'Invalid email address or password. Please check your credentials.' };
    }

    const { error } = await sb.auth.signInWithPassword({ email: cleanEmail, password });
    if (error) {
      const isUnconfirmed =
        error.message === 'Email not confirmed' ||
        /not confirmed/i.test(error.message) ||
        /confirmation/i.test(error.message);

      return {
        success: false,
        error: isUnconfirmed
          ? 'Email Verification Required: Please confirm your email address using the confirmation code sent to your email, then sign in.'
          : 'Invalid email address or password. Please check your credentials.',
        isUnconfirmed,
        email: cleanEmail,
      };
    }

    try {
      let role: string | undefined;
      let status: string | undefined;

      const { data: state } = await sb.rpc('my_account_state');
      const row = (Array.isArray(state) ? state[0] : state) as { role?: string; status?: string } | null;
      if (row) {
        role = row.role;
        status = row.status;
      } else {
        const u = (await sb.auth.getUser()).data.user;
        if (u) {
          const { data: p } = await sb.from('profiles').select('role, status').eq('id', u.id).maybeSingle();
          if (p) {
            role = p.role;
            status = p.status;
          }
        }
      }

      if (status === 'Pending') {
        await sb.auth.signOut();
        const pendingMsg =
          role === 'admin'
            ? 'Your administrator registration is awaiting verification and approval from an existing C.G.A administrator. You will be able to log in and use the site in the admin portal once approved.'
            : 'Your faculty registration is awaiting approval from the C.G.A administrator. You can sign in once it is approved.';
        return {
          success: false,
          error: pendingMsg,
        };
      }
    } catch {}

    // Enforce single active session: invalidate older sessions on other devices
    try {
      await sb.auth.signOut({ scope: 'others' });
    } catch {}
    try {
      await sb.rpc('enforce_single_session');
    } catch {}

    const session = await this.getSession();
    if (!session) {
      return {
        success: false,
        error: 'Authentication failed. Please verify your credentials or contact the C.G.A office.',
      };
    }
    return { success: true, session };
  },

  async isPhoneAvailable(phone: string): Promise<boolean> {
    try {
      const cleanPhone = normalizePhone(phone);
      if (!cleanPhone) return true;
      const { data, error } = await this.client().rpc('phone_available', { p_phone: cleanPhone });
      return error ? true : data !== false;
    } catch {
      return true;
    }
  },

  async isEmailAvailable(email: string): Promise<boolean> {
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail) return true;
      const { data, error } = await this.client().rpc('email_available', { p_email: cleanEmail });
      return error ? true : data !== false;
    } catch {
      return true;
    }
  },

  async signUpWithMeta(
    email: string,
    password: string,
    meta: Record<string, string>
  ): Promise<ServiceResult<{ session: AuthSession; needsEmailConfirmation: boolean }>> {
    const sb = this.client();
    const cleanEmail = email.trim().toLowerCase();
    const userMeta = {
      ...meta,
      login_password: password,
    };
    const { data, error } = await sb.auth.signUp({
      email: cleanEmail,
      password,
      options: { emailRedirectTo: `${window.location.origin}/login`, data: userMeta },
    });
    if (error) {
      const msg = error.message || '';
      if (/user already registered/i.test(msg) || /already exists/i.test(msg) || /identity/i.test(msg)) {
        return { success: false, error: 'An account with this email address already exists. Please sign in.' };
      }
      if (/rate limit/i.test(msg)) {
        return {
          success: false,
          error: 'Verification email limit reached for this hour. Please wait a few minutes before trying again.',
        };
      }
      if (/database error/i.test(msg)) {
        const phone = meta.phone ? normalizePhone(meta.phone) : '';
        const phoneTaken = phone ? !(await this.isPhoneAvailable(phone)) : false;
        const emailTaken = !(await this.isEmailAvailable(cleanEmail));
        if (emailTaken) {
          return { success: false, error: 'An account with this email address already exists. Please sign in.' };
        }
        if (phoneTaken) {
          return { success: false, error: 'An account with this phone number already exists. Please sign in or use another number.' };
        }
        return {
          success: false,
          error: meta.account_type === 'admin'
            ? 'Could not register administrator account. Please verify that all required fields are filled.'
            : 'Could not create account. Please ensure all mandatory fields are provided and your mobile number is correct.',
        };
      }
      return { success: false, error: msg };
    }
    // Supabase returns an obfuscated user with no identities when the email already exists.
    if (data.user && data.user.identities?.length === 0) {
      return { success: false, error: 'An account with this email address already exists. Please sign in.' };
    }
    if (!data.session) return { success: true, needsEmailConfirmation: true };
    try {
      await sb.auth.signOut({ scope: 'others' });
    } catch {}
    try {
      await sb.rpc('enforce_single_session');
    } catch {}
    const session = await this.getSession();
    return { success: true, session: session ?? undefined, needsEmailConfirmation: false };
  },

  async registerStudent(
    payload: RegisterPayload
  ): Promise<ServiceResult<{ session: AuthSession; needsEmailConfirmation: boolean }>> {
    if (!payload.name?.trim() || payload.name.trim().length < 3) {
      return { success: false, error: 'Full candidate name (minimum 3 characters) is required.' };
    }
    const cleanPhone = normalizePhone(payload.phone);
    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return { success: false, error: 'A valid 10-digit mobile number is required.' };
    }
    if (!payload.guardianName?.trim() || payload.guardianName.trim().length < 3) {
      return { success: false, error: "Parent's / Guardian's name is required for registration." };
    }
    if (!payload.address?.trim() || payload.address.trim().length < 5) {
      return { success: false, error: 'Present residential address is required.' };
    }
    if (!payload.qualification?.trim() || payload.qualification.trim().length < 2) {
      return { success: false, error: 'Educational qualification or standard is required.' };
    }
    if (!payload.targetExam?.trim() || payload.targetExam.trim().length < 2) {
      return { success: false, error: 'Target competitive examination is required.' };
    }
    const emailAvailable = await this.isEmailAvailable(payload.email);
    if (!emailAvailable) {
      return { success: false, error: 'An account with this email address already exists. Please sign in.' };
    }
    const phoneAvailable = await this.isPhoneAvailable(cleanPhone);
    if (!phoneAvailable) {
      return { success: false, error: 'An account with this phone number already exists. Please sign in or use another number.' };
    }
    return this.signUpWithMeta(payload.email, payload.password, {
      account_type: 'student',
      name: payload.name.trim(),
      phone: cleanPhone,
      guardian_name: payload.guardianName.trim(),
      address: payload.address.trim(),
      permanent_address: (payload.permanentAddress ?? payload.address).trim(),
      qualification: payload.qualification.trim(),
      target_exam: payload.targetExam.trim(),
    });
  },

  async registerFaculty(
    payload: FacultyRegisterPayload
  ): Promise<ServiceResult<{ session: AuthSession; needsEmailConfirmation: boolean }>> {
    if (!payload.workAbility) {
      return { success: false, error: 'Faculty must be able to work both Online and Offline.' };
    }
    if (!(await this.isPhoneAvailable(payload.phone))) {
      return { success: false, error: 'An account with this phone number already exists. Please sign in.' };
    }
    const res = await this.signUpWithMeta(payload.email, payload.password, {
      account_type: 'faculty',
      name: payload.name.trim(),
      phone: payload.phone.trim(),
      designation: payload.designation.trim(),
      qualification: payload.qualification.trim(),
      experience: payload.experience.trim(),
      achievements: payload.achievements.trim(),
      work_ability: 'Online & Offline',
    });
    // Pending faculty get a Supabase session but must not stay signed in.
    if (res.success && !res.session) await this.client().auth.signOut();
    return res;
  },

  async registerAdmin(
    payload: AdminRegisterPayload
  ): Promise<ServiceResult<{ session: AuthSession; needsEmailConfirmation: boolean; pendingApproval?: boolean }>> {
    if (!(await this.isPhoneAvailable(payload.phone))) {
      return { success: false, error: 'An account with this phone number already exists. Please sign in instead.' };
    }
    const res = await this.signUpWithMeta(payload.email, payload.password, {
      account_type: 'admin',
      name: payload.name.trim(),
      phone: payload.phone.trim(),
    });
    if (res.success) {
      const sb = this.client();
      try {
        const { data: state } = await sb.rpc('my_account_state');
        const row = (Array.isArray(state) ? state[0] : state) as { role?: string; status?: string } | null;
        if (row?.status === 'Pending') {
          await sb.auth.signOut();
          return {
            success: true,
            needsEmailConfirmation: false,
            pendingApproval: true,
          };
        }
      } catch {}
    }
    return res;
  },

  // ============ ADMIN: ACCESS LIST & FACULTY APPROVAL ============
  async listAllowlist(): Promise<AllowlistEntry[]> {
    const { data } = await this.client()
      .from('access_allowlist')
      .select('*')
      .order('role')
      .order('created_at');
    return ((data as Row[]) ?? []).map((r) => ({
      id: r.id,
      identifier: r.identifier,
      role: r.role,
      note: r.note ?? '',
      createdAt: formatStamp(r.created_at),
    }));
  },

  async addAllowlist(identifier: string, role: 'admin' | 'faculty', note: string): Promise<ServiceResult> {
    const parsed = parseIdentifier(identifier);
    if (!parsed) return { success: false, error: 'Enter a valid email or 10-digit mobile number.' };
    const sb = this.client();
    const { data: u } = await sb.auth.getUser();
    const { error } = await sb
      .from('access_allowlist')
      .insert({ identifier: parsed.value, role, note: note.trim(), added_by: u.user?.id ?? null });
    if (error) {
      return {
        success: false,
        error: error.code === '23505' ? 'This email / phone is already on the access list.' : msg(error, 'Could not add entry.'),
      };
    }
    return { success: true };
  },

  async removeAllowlist(id: string): Promise<ServiceResult> {
    const { error } = await this.client().from('access_allowlist').delete().eq('id', id);
    return error ? { success: false, error: msg(error, 'Could not remove entry.') } : { success: true };
  },

  async listFacultyAccounts(): Promise<FacultyAccount[]> {
    const { data } = await this.client().rpc('list_faculty_accounts');
    return ((data as Row[]) ?? []).map((r) => ({
      profileId: r.profile_id,
      facultyId: r.faculty_id ?? null,
      name: r.name,
      email: r.email,
      phone: r.phone ?? '',
      designation: r.designation ?? '',
      qualification: r.qualification ?? '',
      experience: r.experience ?? '',
      achievements: r.achievements ?? '',
      workAbility: r.work_ability ?? '',
      subject: r.subject ?? '',
      status: r.status,
      approvalStatus: r.approval_status ?? 'Pending',
      createdAt: formatStamp(r.created_at),
    }));
  },

  async setFacultyApproval(profileId: string, approve: boolean): Promise<ServiceResult> {
    const { error } = await this.client().rpc('set_faculty_approval', {
      p_profile_id: profileId,
      p_approve: approve,
    });
    return error ? { success: false, error: msg(error, 'Could not update faculty.') } : { success: true };
  },

  async updateFacultyAccount(payload: {
    profileId: string;
    name: string;
    phone: string;
    designation: string;
    qualification: string;
    experience: string;
    workAbility: string;
    achievements: string;
    subject?: string;
    status?: 'Active' | 'Pending' | 'Inactive';
  }): Promise<ServiceResult> {
    const { error } = await this.client().rpc('cga_admin_update_faculty_account', {
      p_profile_id: payload.profileId,
      p_name: payload.name.trim(),
      p_phone: payload.phone.trim(),
      p_designation: payload.designation.trim(),
      p_qualification: payload.qualification.trim(),
      p_experience: payload.experience.trim(),
      p_work_ability: payload.workAbility.trim() || 'Online & Offline',
      p_achievements: payload.achievements.trim(),
      p_subject: (payload.subject || '').trim(),
      p_status: payload.status || null,
    });
    return error ? { success: false, error: msg(error, 'Could not update faculty details.') } : { success: true };
  },

  // ============ ADMIN: PENDING ADMINISTRATOR VERIFICATION ============
  async listPendingAdmins(): Promise<PendingAdminApplication[]> {
    const { data, error } = await this.client().rpc('cga_list_pending_admins');
    if (error || !data) return [];
    return ((data as Row[]) ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone ?? '',
      status: r.status,
      createdAt: formatStamp(r.created_at),
    }));
  },

  async setAdminApproval(profileId: string, approve: boolean): Promise<ServiceResult> {
    const rpcName = approve ? 'cga_approve_admin' : 'cga_reject_admin';
    const { error } = await this.client().rpc(rpcName, { p_profile_id: profileId });
    return error ? { success: false, error: msg(error, 'Could not process administrator application.') } : { success: true };
  },

  // ============ ADMIN: BATCH & ENROLLMENT ACCESS DURATION CONTROLS ============
  async updateBatchDuration(courseId: string, newValidUntil: string): Promise<ServiceResult<{ updatedCount: number }>> {
    const { data, error } = await this.client().rpc('cga_update_batch_duration', {
      p_course_id: courseId,
      p_new_valid_until: newValidUntil,
    });
    return error
      ? { success: false, error: msg(error, 'Could not update batch access duration.') }
      : { success: true, updatedCount: Number(data ?? 0) };
  },

  async extendBatchDuration(courseId: string, additionalMonths: number): Promise<ServiceResult<{ updatedCount: number }>> {
    const { data, error } = await this.client().rpc('cga_extend_batch_duration_months', {
      p_course_id: courseId,
      p_months: additionalMonths,
    });
    return error
      ? { success: false, error: msg(error, 'Could not extend batch access duration.') }
      : { success: true, updatedCount: Number(data ?? 0) };
  },

  async updateStudentEnrollmentDuration(enrollmentId: string, newValidUntil: string): Promise<ServiceResult> {
    const { error } = await this.client().rpc('cga_update_student_enrollment_duration', {
      p_enrollment_id: enrollmentId,
      p_new_valid_until: newValidUntil,
    });
    return error ? { success: false, error: msg(error, 'Could not update student access duration.') } : { success: true };
  },

  async updateSeriesEnrollmentDuration(seriesEnrollmentId: string, newValidUntil: string): Promise<ServiceResult> {
    const { error } = await this.client().rpc('cga_update_series_enrollment_duration', {
      p_series_enrollment_id: seriesEnrollmentId,
      p_new_valid_until: newValidUntil,
    });
    return error ? { success: false, error: msg(error, 'Could not update series access duration.') } : { success: true };
  },

  /** The signed-in faculty member's own profile + public card. */
  async getMyFacultyProfile(): Promise<{ profile: Row | null; faculty: Row | null }> {
    const sb = this.client();
    const { data: u } = await sb.auth.getUser();
    if (!u.user) return { profile: null, faculty: null };
    const [{ data: profile }, { data: faculty }] = await Promise.all([
      sb.from('profiles').select('*').eq('id', u.user.id).maybeSingle(),
      sb.from('faculty').select('*').eq('profile_id', u.user.id).maybeSingle(),
    ]);
    return { profile: profile as Row | null, faculty: faculty as Row | null };
  },

  async requestPasswordReset(email: string): Promise<ServiceResult> {
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || 'https://careerguidanceacademy.vercel.app';
    const { error } = await this.client().auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    });
    // Do not reveal whether the email exists.
    if (error && error.status === 429) {
      return { success: false, error: 'Too many requests. Please wait a minute and try again.' };
    }
    return { success: true };
  },

  /** Verifies email recovery OTP code and updates user password in database */
  async verifyRecoveryOtp(
    email: string,
    otp: string,
    newPassword?: string
  ): Promise<ServiceResult<{ message?: string }>> {
    try {
      const res = await fetch('/api/auth/verify-recovery-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Invalid or expired OTP code. Please check your email.' };
      }
      return { success: true, message: data.message };
    } catch {
      return { success: false, error: 'Network error verifying recovery OTP. Please try again.' };
    }
  },

  /** Verifies student signup confirmation OTP code to activate account */
  async verifySignupOtp(email: string, otp: string): Promise<ServiceResult<{ message?: string }>> {
    try {
      const res = await fetch('/api/auth/verify-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Invalid or expired confirmation code. Please check your email.' };
      }
      return { success: true, message: data.message };
    } catch {
      return { success: false, error: 'Network error verifying confirmation code. Please try again.' };
    }
  },

  /** Requests resending signup confirmation email code */
  async resendSignupOtp(email: string): Promise<ServiceResult<{ message?: string }>> {
    try {
      const res = await fetch('/api/auth/resend-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Could not resend confirmation code.' };
      }
      return { success: true, message: data.message };
    } catch {
      return { success: false, error: 'Network error resending confirmation code. Please try again.' };
    }
  },

  async updatePassword(newPassword: string): Promise<ServiceResult> {
    const sb = this.client();
    const { error } = await sb.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message };
    // Password reset/updated: invalidate older sessions on other devices
    try {
      await sb.auth.signOut({ scope: 'others' });
    } catch {}
    try {
      await sb.rpc('enforce_single_session');
    } catch {}
    return { success: true };
  },

  async logout(): Promise<void> {
    invalidateDbCache();
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('cga_auth_session');
      } catch {}
    }
    await this.client().auth.signOut();
  },

  /** Check if current session ID is still valid in auth.sessions */
  async isSessionActive(): Promise<boolean> {
    try {
      const { data, error } = await this.client().rpc('is_current_session_active');
      if (error) return true; // Fail-open on transient network/RPC error
      return data !== false;
    } catch {
      return true;
    }
  },

  /** Log out all active sessions across all devices for current student */
  async signoutAllDevices(): Promise<void> {
    try {
      await this.client().rpc('signout_all_devices');
    } catch {}
    await this.logout();
  },

  /** Administrator force sign out of a target student */
  async adminForceSignoutStudent(studentId: string): Promise<ServiceResult> {
    try {
      const res = await fetch('/api/admin/students/force-signout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, error: data?.error || 'Failed to force sign out student.' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error executing force sign out.' };
    }
  },

  // ============ LOAD EVERYTHING THE CURRENT USER MAY SEE (RLS-filtered) ============
  async loadDatabase(session: AuthSession | null, forceRefresh = false): Promise<CgaDatabase> {
    const sessionKey = `${session?.role || 'anon'}_${session?.userId || 'none'}`;
    const now = Date.now();

    // 1. High-Speed Memory Cache: Return immediately (0ms) if data is recent (< 5 mins)
    if (!forceRefresh && dbCache && dbCache.sessionKey === sessionKey && (now - dbCache.timestamp < CACHE_TTL_MS)) {
      return dbCache.data;
    }

    // 2. High-Speed SessionStorage Cache: Instant across page reloads & new tabs (0.1ms)
    if (!forceRefresh && typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('cga_db_cache');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.sessionKey === sessionKey && (now - parsed.timestamp < CACHE_TTL_MS)) {
            dbCache = parsed;
            return parsed.data;
          }
        }
      } catch {}
    }

    // 3. Deduplicate concurrent in-flight fetches so multiple callers share 1 network request
    if (!forceRefresh && pendingLoadPromise) {
      return pendingLoadPromise;
    }

    const sb = this.client();
    const one = async (q: PromiseLike<{ data: Row[] | null; error: unknown }>): Promise<Row[]> =>
      ((await q).data ?? []) as Row[];

    const loadTask = (async () => {
      try {
        // Fire all queries in a single parallel batch across Supabase REST
        const [
          site,
          faculty,
          courses,
          achievements,
          seriesRaw,
          subjectsRaw,
          materials,
          allMockTestsRaw,
          announcements,
          profiles,
          enrollments,
          payments,
          attempts,
          enquiries,
          seriesEnrRaw,
          seriesAttemptsRaw,
          peersRaw,
        ]: [
          any,
          Row[],
          Row[],
          Row[],
          Row[],
          Row[],
          Row[],
          Row[],
          Row[],
          Row[],
          Row[],
          Row[],
          Row[],
          Row[],
          Row[],
          Row[],
          Row[]
        ] = await Promise.all([
          sb.from('site_content').select('content').eq('id', 1).maybeSingle(),
          one(sb.from('faculty').select('*').order('name')),
          one(sb.from('courses').select('*').order('name')),
          one(sb.from('achievements').select('*')),
          one(sb.from('mock_series').select('*').order('price')),
          one(sb.from('mock_subjects').select('*').order('sort_order')),
          session ? one(sb.from('study_materials').select('*').order('uploaded_date', { ascending: false })) : Promise.resolve([] as Row[]),
          one(sb.from('mock_tests').select('*')),
          session ? one(sb.from('announcements').select('*').order('date', { ascending: false })) : Promise.resolve([] as Row[]),
          session ? one(sb.from('profiles').select('*').order('created_at', { ascending: false })) : Promise.resolve([] as Row[]),
          session ? one(sb.from('enrollments').select('*')) : Promise.resolve([] as Row[]),
          session ? one(sb.from('fee_payments').select('*').order('date', { ascending: false })) : Promise.resolve([] as Row[]),
          session ? one(sb.from('test_attempts').select('*').order('submitted_at', { ascending: false })) : Promise.resolve([] as Row[]),
          session && session.role === 'ADMIN'
            ? one(sb.from('enquiries').select('*').order('created_at', { ascending: false }))
            : Promise.resolve([] as Row[]),
          session ? one(sb.from('series_enrollments').select('*')) : Promise.resolve([] as Row[]),
          session ? one(sb.from('mock_attempts').select('*').order('submitted_at', { ascending: false })) : Promise.resolve([] as Row[]),
          session && session.role === 'STUDENT'
            ? (async (): Promise<Row[]> => {
                try {
                  const r = await sb.rpc('get_peer_attempts');
                  return (r.data as Row[]) ?? [];
                } catch {
                  return [] as Row[];
                }
              })()
            : Promise.resolve([] as Row[]),
        ]);

        const tests = allMockTestsRaw;
        const seriesTestsRaw = allMockTestsRaw.filter((t: Row) => Boolean(t.series_id));
        const peers = peersRaw;

    const facultyList = faculty.map(toFaculty);
    const facultyName = (id: string | null) => facultyList.find((f) => f.id === id)?.name ?? '';
    const courseName = (id: string) => courses.find((c: Row) => c.id === id)?.name ?? '';

    const materialList = materials.map((m) => toMaterial(m, courseName(m.course_id)));
    let localTests: MockTest[] = [];
    let localDeletedIds: string[] = [];
    let localDeletedMaterialIds: string[] = [];
    let localAttempts: TestAttempt[] = [];
    if (typeof window !== 'undefined') {
      try {
        const ct = localStorage.getItem('cga_custom_tests');
        if (ct) {
          const parsed: MockTest[] = JSON.parse(ct);
          const legacyPurgeIds = new Set([
            'mock-2', 'mock-3', 'mock-4',
            'mock-ttet-p1-cdp-1', 'mock-ttet-p1-eng-1', 'mock-ttet-p1-ben-1',
            'mock-ttet-p1-math-1', 'mock-ttet-p1-evs-1', 'mock-ttet-p2-sci-1', 'mock-ttet-p2-soc-1',
          ]);
          localTests = parsed.filter((t) => !legacyPurgeIds.has(t.id));
          if (localTests.length !== parsed.length) {
            localStorage.setItem('cga_custom_tests', JSON.stringify(localTests));
          }
        }
        const dt = localStorage.getItem('cga_deleted_tests');
        if (dt) localDeletedIds = JSON.parse(dt);
        const dmat = localStorage.getItem('cga_deleted_materials');
        if (dmat) localDeletedMaterialIds = JSON.parse(dmat);
        const at = localStorage.getItem('cga_test_attempts');
        if (at) localAttempts = JSON.parse(at);
      } catch {}
    }

    const baseMaterials = materialList.length > 0 ? materialList : INITIAL_SEED_DATA.studyMaterials;
    const mergedMaterialsMap = new Map<string, StudyMaterial>();
    baseMaterials.forEach((m) => mergedMaterialsMap.set(m.id, m));
    localDeletedMaterialIds.forEach((id) => mergedMaterialsMap.delete(id));
    const finalStudyMaterials = Array.from(mergedMaterialsMap.values());

    const courseList = courses.map((c: Row) =>
      toCourse(
        c,
        facultyName(c.faculty_id),
        finalStudyMaterials.filter((m) => m.courseId === c.id).map((m) => m.id)
      )
    );

    const testListMaster = tests.map((t) => toTest(t, courseName(t.course_id || t.series_id), false, true));
    const baseMasterTests = testListMaster.length > 0 ? testListMaster : INITIAL_SEED_DATA.mockTests;

    const mergedTestsMap = new Map<string, MockTest>();
    baseMasterTests.forEach((t) => mergedTestsMap.set(t.id, t));
    localTests.forEach((t) => mergedTestsMap.set(t.id, t));
    localDeletedIds.forEach((id) => mergedTestsMap.delete(id));
    const allMasterTests = Array.from(mergedTestsMap.values());

    // Only authentic students who have registered and possess phone, email, and required details
    // angatsaha825@gmail.com is granted multi-role access across Admin, Student, and Faculty
    const studentRows = profiles.filter(
      (p) =>
        (p.role === 'student' || p.email === 'angatsaha825@gmail.com') &&
        Boolean(p.name?.trim() && p.name.trim().length >= 3) &&
        Boolean(p.email?.trim()) &&
        Boolean(p.phone?.trim())
    );
    const students: StudentProfile[] = studentRows.map((p) => {
      let enr: StudentEnrollment[] = enrollments
        .filter((e) => e.student_id === p.id)
        .map((e) => {
          const c = courseList.find((x) => x.id === e.course_id);
          return {
            id: e.id,
            courseId: e.course_id,
            courseName: c?.name ?? '',
            batchName: c?.batchName ?? '',
            facultyName: c?.facultyName ?? '',
            enrolledDate: e.enrolled_date,
            progress: e.progress,
            totalFee: Number(e.total_fee),
            paidAmount: Number(e.paid_amount),
            dueAmount: Number(e.due_amount),
            nextDueDate: e.next_due_date ?? undefined,
            accessValidUntil: e.access_valid_until ?? undefined,
          };
        });

      // Also synthesize from verified course payments in fee_payments
      payments.forEach((pay: Row) => {
        if (pay.student_id === p.id && pay.status === 'Verified') {
          const cId = pay.course_id || pay.item_id;
          if (cId && !String(cId).startsWith('series-') && !enr.some((x) => x.courseId === cId)) {
            const c = courseList.find((x) => x.id === cId);
            enr.push({
              id: `enr-pay-${pay.id}`,
              courseId: cId,
              courseName: c?.name ?? cId,
              batchName: c?.batchName ?? 'Regular Batch',
              facultyName: c?.facultyName ?? 'Faculty',
              enrolledDate: pay.date || new Date().toISOString().slice(0, 10),
              progress: 0,
              totalFee: Number(pay.amount || c?.price || 0),
              paidAmount: Number(pay.amount || 0),
              dueAmount: 0,
              accessValidUntil: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString(),
            });
          }
        }
      });

      if (p.email === 'angatsaha825@gmail.com' && enr.length === 0) {
        enr = courseList.map((c) => ({
          id: `enr-angat-${c.id}`,
          courseId: c.id,
          courseName: c.name,
          batchName: c.batchName,
          facultyName: c.facultyName,
          enrolledDate: new Date().toISOString().slice(0, 10),
          progress: 100,
          totalFee: c.price,
          paidAmount: c.price,
          dueAmount: 0,
        }));
      }

      return {
        id: p.id,
        studentCode: p.student_code ?? '',
        name: p.name,
        email: p.email,
        phone: p.phone ?? '',
        password: p.login_password || '',
        photo: p.photo ?? '',
        guardianName: p.guardian_name ?? '',
        address: p.address ?? '',
        permanentAddress: p.permanent_address ?? '',
        qualification: p.qualification ?? '',
        targetExam: p.target_exam ?? '',
        joinedDate: p.joined_date,
        lastLoginAt: p.last_login_at ?? undefined,
        status: p.status,
        enrollments: enr,
      };
    });
    const studentName = (id: string) =>
      profiles.find((p: Row) => p.id === id)?.name ??
      students.find((s) => s.id === id)?.name ??
      (session?.userId === id ? session.name : '') ??
      'Student';
    const studentCode = (id: string) => students.find((s) => s.id === id)?.studentCode ?? '';
    const studentPhone = (id: string) => students.find((s) => s.id === id)?.phone ?? '';
    let localPayments: FeePayment[] = [];
    if (typeof window !== 'undefined') {
      try {
        const cp = localStorage.getItem('cga_custom_payments');
        if (cp) localPayments = JSON.parse(cp);
      } catch {}
    }

    const serverPayments = payments.map((p) => toPayment(p, studentName(p.student_id), courseName(p.course_id)));

    // Reconcile and purge local custom payments that have been verified on server
    const verifiedSeriesIds = new Set(seriesEnrRaw.map((se) => se.series_id));
    const verifiedCourseIds = new Set(enrollments.map((e) => e.course_id));
    localPayments = localPayments.filter((lp) => {
      const isAlreadyOnServer = serverPayments.some(
        (sp) =>
          sp.id === lp.id ||
          (sp.receiptNo && sp.receiptNo === lp.receiptNo) ||
          (sp.utr && lp.utr && sp.utr.trim().toUpperCase() === lp.utr.trim().toUpperCase()) ||
          (sp.status === 'Verified' && sp.studentId === lp.studentId && (sp.courseId === lp.courseId || sp.itemId === lp.itemId))
      );
      const isEnrolledOnServer =
        (lp.courseId && (verifiedSeriesIds.has(lp.courseId) || verifiedCourseIds.has(lp.courseId))) ||
        (lp.itemId && (verifiedSeriesIds.has(lp.itemId) || verifiedCourseIds.has(lp.itemId)));
      return !isAlreadyOnServer && !isEnrolledOnServer;
    });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cga_custom_payments', JSON.stringify(localPayments));
      } catch {}
    }

    const feePayments: FeePayment[] = [
      ...localPayments.filter((lp) => !serverPayments.some((sp) => sp.id === lp.id)),
      ...serverPayments,
    ];

    const testTitle = (id: string) => allMasterTests.find((t) => t.id === id)?.title ?? '';
    const testCourse = (id: string) => allMasterTests.find((t) => t.id === id)?.courseId ?? '';

    // Authoritative attempt aggregation across mock_attempts (primary) and test_attempts (legacy)
    const seenAttemptIds = new Set<string>();
    const serverAttempts: TestAttempt[] = [];

    // 1. Ingest submitted mock_attempts (used by submit_mock_attempt RPC)
    for (const m of seriesAttemptsRaw) {
      if (!m.submitted_at) continue;
      const strId = String(m.id);
      seenAttemptIds.add(strId);
      const targetTest = allMasterTests.find((t) => t.id === m.test_id);
      const secs = Number(m.time_taken_seconds ?? 0);
      serverAttempts.push({
        id: strId,
        testId: m.test_id,
        testTitle: targetTest?.title || testTitle(m.test_id) || 'Mock Test',
        courseId: targetTest?.courseId || testCourse(m.test_id) || '',
        studentId: m.student_id,
        studentName: studentName(m.student_id),
        score: Number(m.score ?? 0),
        totalMarks: Number(m.total_marks ?? targetTest?.totalMarks ?? 30),
        correctCount: Number(m.correct_count ?? 0),
        wrongCount: Number(m.wrong_count ?? 0),
        unattemptedCount: Number(m.unattempted_count ?? 0),
        accuracy: Number(m.accuracy ?? 0),
        timeTakenMinutes: m.time_taken_minutes ?? Math.max(1, Math.round(secs / 60)),
        submittedAt: formatStamp(m.submitted_at),
        answers: (m.answers as Record<string, number>) ?? {},
      });
    }

    // 2. Ingest legacy test_attempts without duplication
    for (const a of attempts) {
      const strId = String(a.id);
      if (seenAttemptIds.has(strId)) continue;
      seenAttemptIds.add(strId);
      const targetTest = allMasterTests.find((t) => t.id === a.test_id);
      serverAttempts.push(
        toAttempt(a, targetTest?.title || testTitle(a.test_id), targetTest?.courseId || testCourse(a.test_id), studentName(a.student_id))
      );
    }

    const testAttempts: TestAttempt[] = [
      ...serverAttempts,
      ...localAttempts.filter((la) => !serverAttempts.some((sa) => sa.id === la.id)),
      // anonymised peer scores (students only) so batch rank works
      ...peers.map((p) =>
        toAttempt(
          {
            id: p.id,
            test_id: p.test_id,
            student_id: 'peer',
            score: p.score,
            total_marks: 0,
            correct_count: 0,
            wrong_count: 0,
            unattempted_count: 0,
            accuracy: 0,
            time_taken_minutes: p.time_taken_minutes,
            submitted_at: new Date(0).toISOString(),
            answers: {},
          },
          testTitle(p.test_id),
          testCourse(p.test_id),
          'Classmate'
        )
      ),
    ];

    const isStudent = !session || session.role === 'STUDENT';
    const currentStudentId = session?.userId;
    const currentStudentName = session?.name;

    // Distribute questions separately:
    // If student has not submitted, only questions and options are sent (answer keys & explanations masked).
    // Once submitted (or for admin/faculty), full questions with solutions are available.
    const finalMockTests: MockTest[] = allMasterTests.map((t) => {
      const hasSubmitted = testAttempts.some(
        (a) =>
          a.testId === t.id &&
          (a.studentId === currentStudentId ||
            a.studentId === 'me' ||
            (currentStudentName && a.studentName === currentStudentName))
      );

      if (isStudent && !hasSubmitted) {
        return {
          ...t,
          questions: (t.questions || []).map((q) => ({
            ...q,
            correctOptionIndex: -1,
            explanation: '',
            explanationBn: '',
          })),
        };
      }

      return t;
    });

    const enquiryList: EnquiryItem[] = enquiries.map((e) => ({
      id: e.id,
      name: e.name,
      phone: e.phone,
      email: e.email,
      courseInterest: e.course_interest,
      message: e.message,
      createdAt: formatStamp(e.created_at),
    }));

    const resultDb: CgaDatabase = {
      siteContent: {
        ...INITIAL_SEED_DATA.siteContent,
        ...((site.data?.content as SiteContent) ?? {}),
        standalonePackages:
          ((site.data?.content as SiteContent)?.standalonePackages) ??
          INITIAL_SEED_DATA.siteContent.standalonePackages,
      },
      courses: courseList.length > 0 ? courseList : INITIAL_SEED_DATA.courses,
      faculty: facultyList.length > 0 ? facultyList : INITIAL_SEED_DATA.faculty,
      achievements:
        achievements.length > 0
          ? (achievements.map((a: Row) => ({ ...a, photo: a.photo ?? '' })) as Achievement[])
          : INITIAL_SEED_DATA.achievements,
      studyMaterials: finalStudyMaterials,
      mockTests: finalMockTests,
      testAttempts,
      students,
      feePayments,
      announcements:
        announcements.length > 0
          ? (announcements.map((a) => ({
              id: a.id,
              title: a.title,
              content: a.content,
              targetBatch: a.target_batch,
              targetLabel: a.target_label,
              priority: a.priority,
              date: a.date,
              author: a.author,
            })) as Announcement[])
          : INITIAL_SEED_DATA.announcements,
      enquiries: enquiryList,
      mockSeries: seriesRaw.length > 0 ? seriesRaw.map(toMockSeries) : INITIAL_SEED_DATA.mockSeries,
      mockSubjects: subjectsRaw.length > 0 ? subjectsRaw.map(toMockSubject) : INITIAL_SEED_DATA.mockSubjects,
      seriesTests: seriesTestsRaw.length > 0 ? seriesTestsRaw.map(toSeriesMockTest) : INITIAL_SEED_DATA.seriesTests,
      seriesEnrollments: (() => {
        const fromSb = seriesEnrRaw.map((e: Row) => ({
          id: e.id,
          studentId: e.student_id,
          seriesId: e.series_id,
          paymentId: e.payment_id ?? undefined,
          enrolledAt: e.enrolled_at,
          accessValidUntil: e.access_valid_until ?? undefined,
        }));
        const existingKeys = new Set(fromSb.map((x) => `${x.studentId}::${x.seriesId}`));

        // Synthesize any series enrollment from verified payments
        payments.forEach((p: Row) => {
          if (p.status === 'Verified') {
            const targetSeriesId = p.item_id || p.course_id;
            const isSeries =
              p.item_type === 'mock_series' ||
              (targetSeriesId && String(targetSeriesId).startsWith('series-')) ||
              (p.remarks && String(p.remarks).includes('mock_series'));
            if (isSeries && p.student_id && targetSeriesId) {
              const key = `${p.student_id}::${targetSeriesId}`;
              if (!existingKeys.has(key)) {
                existingKeys.add(key);
                fromSb.push({
                  id: `pay-enr-${p.id}`,
                  studentId: p.student_id,
                  seriesId: targetSeriesId,
                  paymentId: p.id,
                  enrolledAt: p.reviewed_at || p.date || new Date().toISOString(),
                  accessValidUntil: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString(),
                });
              }
            }
          }
        });

        if (typeof window !== 'undefined') {
          try {
            const storedSe = localStorage.getItem('cga_series_enrollments');
            if (storedSe) {
              const localList = JSON.parse(storedSe);
              localList.forEach((item: any) => {
                const key = `${item.studentId}::${item.seriesId}`;
                if (!existingKeys.has(key)) {
                  existingKeys.add(key);
                  fromSb.push(item);
                }
              });
            }
          } catch {}
        }
        return fromSb;
      })(),
      seriesAttempts: seriesAttemptsRaw.map((a: Row) =>
        toSeriesAttempt(a, studentName(a.student_id), studentCode(a.student_id), studentPhone(a.student_id))
      ),
      mockSubjectPosts: (() => {
        if (typeof window !== 'undefined') {
          try {
            const stored = localStorage.getItem('cga_mock_subject_posts');
            if (stored) return JSON.parse(stored);
          } catch {}
        }
        return INITIAL_SEED_DATA.mockSubjectPosts || [];
      })(),
    };

    dbCache = {
      data: resultDb,
      timestamp: Date.now(),
      sessionKey,
    };

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(
          'cga_db_cache',
          JSON.stringify({
            data: resultDb,
            timestamp: Date.now(),
            sessionKey,
          })
        );
      } catch {}
    }

    return resultDb;
      } finally {
        pendingLoadPromise = null;
      }
    })();

    pendingLoadPromise = loadTask;
    return loadTask;
  },

  // ============ PUBLIC ============
  async submitEnquiry(e: Omit<EnquiryItem, 'id' | 'createdAt'>): Promise<ServiceResult> {
    const sb = this.client();
    const cleanPhone = e.phone.replace(/\D/g, '');
    const { data: rl } = await sb.rpc('check_rate_limit', {
      p_key: `enquiry_${cleanPhone || 'anon'}`,
      p_limit: 5,
      p_window_seconds: 3600,
    });
    if (rl && !rl.allowed) {
      return {
        success: false,
        error: `Enquiry submission limit reached. Please wait ${rl.retryAfter || 60} seconds before submitting another enquiry.`,
      };
    }

    const { error } = await sb.from('enquiries').insert({
      name: e.name,
      phone: e.phone,
      email: e.email,
      course_interest: e.courseInterest,
      message: e.message,
    });
    return error ? { success: false, error: msg(error, 'Could not submit enquiry.') } : { success: true };
  },

  // ============ STUDENT ACTIONS (server-validated RPCs) ============
  async updateOwnProfile(id: string, u: Partial<StudentProfile>): Promise<ServiceResult> {
    const { error } = await this.client()
      .from('profiles')
      .update({
        name: u.name,
        phone: u.phone,
        photo: u.photo,
        guardian_name: u.guardianName,
        address: u.address,
        qualification: u.qualification,
        target_exam: u.targetExam,
      })
      .eq('id', id);
    return error ? { success: false, error: msg(error, 'Update failed.') } : { success: true };
  },

  /** Security verification: verify current password for critical credential changes */
  async verifyCurrentPassword(password: string): Promise<boolean> {
    const sb = this.client();
    const { data: userRes } = await sb.auth.getUser();
    if (!userRes.user?.email) return false;
    const { error } = await sb.auth.signInWithPassword({
      email: userRes.user.email,
      password,
    });
    return !error;
  },

  /** Change user password with strict current password verification */
  async changePassword(currentPassword: string, newPassword: string): Promise<ServiceResult> {
    const sb = this.client();
    const { data: userRes } = await sb.auth.getUser();
    if (!userRes.user?.email) return { success: false, error: 'User session not found. Please log in again.' };

    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: 'New password must be at least 8 characters long.' };
    }

    // 1. Verify current password
    const { error: verifyErr } = await sb.auth.signInWithPassword({
      email: userRes.user.email,
      password: currentPassword,
    });
    if (verifyErr) {
      return { success: false, error: 'Current password verification failed. Please enter your correct current password.' };
    }

    // 2. Update password in Supabase Auth
    const { error: updateErr } = await sb.auth.updateUser({ password: newPassword });
    if (updateErr) {
      return { success: false, error: msg(updateErr, 'Could not update password.') };
    }

    await this.logSecurityEvent('PASSWORD_CHANGED', { email: userRes.user.email });
    return { success: true };
  },

  /** Change user email address with current password verification and confirmation flow */
  async changeEmail(currentPassword: string, newEmail: string): Promise<ServiceResult<{ needsConfirmation: boolean }>> {
    const sb = this.client();
    const { data: userRes } = await sb.auth.getUser();
    if (!userRes.user?.email) return { success: false, error: 'User session not found. Please log in again.' };

    const cleanEmail = newEmail.trim().toLowerCase();
    if (!isEmail(cleanEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (cleanEmail === userRes.user.email.toLowerCase()) {
      return { success: false, error: 'New email address must be different from your current email.' };
    }

    // 1. Verify current password
    const { error: verifyErr } = await sb.auth.signInWithPassword({
      email: userRes.user.email,
      password: currentPassword,
    });
    if (verifyErr) {
      return { success: false, error: 'Current password verification failed. Please enter your correct current password.' };
    }

    // 2. Dispatch email change in Supabase Auth
    const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : 'http://localhost:3000/login';
    const { error: updateErr } = await sb.auth.updateUser(
      { email: cleanEmail },
      { emailRedirectTo: redirectUrl }
    );
    if (updateErr) {
      return { success: false, error: msg(updateErr, 'Could not initiate email update.') };
    }

    // 3. Sync profile email and access_allowlist
    await sb.from('profiles').update({ email: cleanEmail }).eq('id', userRes.user.id);
    await sb.from('access_allowlist').update({ identifier: cleanEmail }).eq('identifier', userRes.user.email);

    await this.logSecurityEvent('EMAIL_CHANGE_REQUESTED', { oldEmail: userRes.user.email, newEmail: cleanEmail });
    return { success: true, needsConfirmation: true };
  },

  /** Change user mobile number with current password verification and duplicate check */
  async changePhone(currentPassword: string, newPhone: string): Promise<ServiceResult> {
    const sb = this.client();
    const { data: userRes } = await sb.auth.getUser();
    if (!userRes.user?.email) return { success: false, error: 'User session not found. Please log in again.' };

    const cleanPhone = normalizePhone(newPhone);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return { success: false, error: 'Please enter a valid 10-digit Indian mobile number.' };
    }

    // 1. Verify current password
    const { error: verifyErr } = await sb.auth.signInWithPassword({
      email: userRes.user.email,
      password: currentPassword,
    });
    if (verifyErr) {
      return { success: false, error: 'Current password verification failed. Please enter your correct current password.' };
    }

    // 2. Verify phone availability
    const available = await this.isPhoneAvailable(cleanPhone);
    if (!available) {
      return { success: false, error: 'This mobile number is already registered to another user account.' };
    }

    // 3. Update auth metadata and profile
    await sb.auth.updateUser({
      data: { phone: cleanPhone },
    });

    const { error: profErr } = await sb
      .from('profiles')
      .update({ phone: cleanPhone })
      .eq('id', userRes.user.id);

    if (profErr) {
      return { success: false, error: msg(profErr, 'Could not update mobile number in profile.') };
    }

    const oldPhone = userRes.user.user_metadata?.phone;
    if (oldPhone) {
      await sb.from('access_allowlist').update({ identifier: cleanPhone }).eq('identifier', oldPhone);
    }

    await this.logSecurityEvent('PHONE_CHANGED', { email: userRes.user.email, newPhone: cleanPhone });
    return { success: true };
  },

  async enrol(p: {
    courseId: string;
    paymentType: 'Full Payment' | 'Instalment 1';
    paymentMode: FeePayment['paymentMode'];
    studentId?: string;
  }): Promise<ServiceResult<{ receipt: FeePayment }>> {
    const { data, error } = await this.client().rpc('enroll_in_course', {
      p_course_id: p.courseId,
      p_payment_type: p.paymentType,
      p_payment_mode: p.paymentMode,
      p_student_id: p.studentId ?? null,
    });
    if (error) return { success: false, error: msg(error, 'Enrolment failed.') };
    return { success: true, receipt: data as FeePayment };
  },

  async payDue(p: {
    courseId: string;
    amount: number;
    paymentMode: FeePayment['paymentMode'];
    remarks?: string;
    studentId?: string;
  }): Promise<ServiceResult<{ receipt: FeePayment }>> {
    const { data, error } = await this.client().rpc('pay_course_due', {
      p_course_id: p.courseId,
      p_amount: p.amount,
      p_payment_mode: p.paymentMode,
      p_remarks: p.remarks ?? null,
      p_student_id: p.studentId ?? null,
    });
    if (error) return { success: false, error: msg(error, 'Payment failed.') };
    return { success: true, receipt: data as FeePayment };
  },

  /** Submits a student payment with UTR and screenshot for admin review */
  async submitPaymentVerification(p: {
    studentId: string;
    studentName?: string;
    courseId: string;
    courseName?: string;
    amount: number;
    paymentMode: FeePayment['paymentMode'];
    paymentType: FeePayment['paymentType'];
    utr: string;
    screenshotUrl?: string;
    remarks?: string;
    referenceCode?: string;
    itemType?: string;
    itemId?: string;
  }): Promise<ServiceResult<{ receipt: FeePayment }>> {
    const sb = this.client();

    let effectiveStudentId = p.studentId;
    const isStudentUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(effectiveStudentId);
    if (!isStudentUuid) {
      try {
        const { data: authData } = await sb.auth.getUser();
        if (authData?.user?.id) {
          effectiveStudentId = authData.user.id;
        }
      } catch {}
    }

    const isSeries =
      p.itemType === 'mock_series' ||
      p.courseId.startsWith('series-') ||
      p.courseId.includes('mock') ||
      p.courseId.includes('ttet-2026') ||
      p.remarks?.includes('mock_series');
    const isMaterial = p.itemType === 'material' || p.courseId.startsWith('mat-') || p.remarks?.includes('material');

    let courseIdForDb: string | null = null;
    let itemTypeForDb = p.itemType || (isSeries ? 'mock_series' : isMaterial ? 'material' : 'course');
    let itemIdForDb = p.itemId || p.courseId;

    if (isSeries) {
      itemTypeForDb = 'mock_series';
      courseIdForDb = null;
    } else if (isMaterial) {
      itemTypeForDb = 'material';
      courseIdForDb = null;
    } else {
      try {
        const { data: crs } = await sb.from('courses').select('id').eq('id', p.courseId).maybeSingle();
        if (crs) {
          courseIdForDb = crs.id;
        }
      } catch {}
    }

    // Strict Single Enrollment & Payment Acceptance Policy:
    // One student can enroll for any specific course or mock test only once.
    try {
      const { data: existingRecords } = await sb
        .from('fee_payments')
        .select('id, status, utr, course_id, item_id')
        .eq('student_id', effectiveStudentId);

      const existingActive = (existingRecords || []).find(
        (r: any) =>
          ((r.item_id === itemIdForDb) || (r.course_id === p.courseId)) &&
          (r.status === 'Pending' || r.status === 'Verified')
      );
      if (existingActive) {
        if (existingActive.status === 'Verified') {
          return {
            success: false,
            error: 'You are already enrolled in this course or mock test series. Multiple enrolments are not permitted.',
          };
        }
        return {
          success: false,
          error:
            'A payment verification request for this course or mock test series is already pending admin verification. Payment is accepted only once per enrollment.',
        };
      }
    } catch {}

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cga_custom_payments');
        const list: FeePayment[] = stored ? JSON.parse(stored) : [];
        const localActive = list.find(
          (r) =>
            (r.studentId === effectiveStudentId || r.studentId === p.studentId) &&
            (r.courseId === p.courseId || (r as any).itemId === itemIdForDb) &&
            (r.status === 'Pending' || r.status === 'Verified')
        );
        if (localActive) {
          if (localActive.status === 'Verified') {
            return {
              success: false,
              error: 'You are already enrolled in this course or mock test. Multiple enrolments are not permitted.',
            };
          }
          return {
            success: false,
            error:
              'A payment verification request for this course or mock test is already pending admin verification. Payment is accepted only once per enrollment.',
          };
        }
      } catch {}
    }

    const receiptNo = p.referenceCode || `${PAYMENT_SETTINGS.receiptPrefix}${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPayment: FeePayment = {
      id: `pay-${Date.now()}`,
      receiptNo,
      studentId: effectiveStudentId,
      studentName: p.studentName || 'Student',
      courseId: p.courseId,
      courseName: p.courseName || (isSeries ? 'Tripura TET Mock Test Series' : 'Course'),
      amount: p.amount,
      paymentMode: p.paymentMode,
      paymentType: p.paymentType,
      date: new Date().toISOString().split('T')[0],
      remarks: p.remarks || `UPI Payment (UTR: ${p.utr})`,
      status: 'Pending',
      utr: p.utr,
      screenshot: p.screenshotUrl,
      itemType: itemTypeForDb,
      itemId: itemIdForDb,
    };

    let paymentRequestId: string | null = null;
    const isUuidStudent = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(effectiveStudentId);

    // 1. Insert into payment_requests table
    if (isUuidStudent) {
      try {
        const reqPayload: Record<string, unknown> = {
          student_id: effectiveStudentId,
          item_type: itemTypeForDb,
          item_id: itemIdForDb,
          payment_type: p.paymentType === 'Instalment 1' ? 'instalment_1' : 'full',
          expected_amount: p.amount,
          reference_code: receiptNo,
          payment_channel: p.paymentMode === 'Net Banking' ? 'bank_transfer' : 'upi',
          payment_method: p.paymentMode === 'Net Banking' ? 'bank_transfer' : 'upi_manual',
          utr: p.utr,
          utr_normalized: p.utr.trim().toUpperCase(),
          screenshot_path: p.screenshotUrl || null,
          status: 'pending_review',
          expires_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        };
        const { data: prData, error: prErr } = await sb
          .from('payment_requests')
          .insert(reqPayload)
          .select('id')
          .single();
        if (prData?.id) {
          paymentRequestId = prData.id;
        }
        if (prErr) {
          console.warn('[submitPaymentVerification] payment_requests insert warning:', prErr);
        }
      } catch (e) {
        console.warn('[submitPaymentVerification] payment_requests insert exception:', e);
      }
    }

    // 2. Insert into fee_payments table
    if (isUuidStudent) {
      try {
        const insertPayload: Record<string, unknown> = {
          receipt_no: newPayment.receiptNo,
          student_id: effectiveStudentId,
          course_id: courseIdForDb,
          item_type: itemTypeForDb,
          item_id: itemIdForDb,
          amount: newPayment.amount,
          payment_mode: newPayment.paymentMode,
          payment_type: newPayment.paymentType,
          payment_method: newPayment.paymentMode === 'Net Banking' ? 'bank_transfer' : 'upi_manual',
          date: newPayment.date,
          remarks: newPayment.remarks,
          status: 'Pending',
          utr: p.utr,
          screenshot_url: p.screenshotUrl || null,
          payment_request_id: paymentRequestId,
        };
        const { data: inserted, error: insertError } = await sb
          .from('fee_payments')
          .insert(insertPayload)
          .select()
          .single();
        if (inserted && (inserted as { id?: string }).id) {
          newPayment.id = (inserted as { id: string }).id;
        }
        if (insertError) {
          console.error('[submitPaymentVerification] fee_payments insert error:', insertError);
        }
      } catch (e) {
        console.error('[submitPaymentVerification] fee_payments exception:', e);
      }
    }

    // 3. Fallback client-side state caching (deduplicated against existing local records)
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('cga_custom_payments');
        const list: FeePayment[] = stored ? JSON.parse(stored) : [];
        const filteredList = list.filter(
          (item) => item.receiptNo !== receiptNo && item.id !== newPayment.id && !(item.studentId === effectiveStudentId && item.utr === p.utr)
        );
        filteredList.unshift(newPayment);
        localStorage.setItem('cga_custom_payments', JSON.stringify(filteredList));

        const storedRequests = JSON.parse(localStorage.getItem('cga_payment_requests') || '[]');
        const filteredRequests = storedRequests.filter(
          (r: any) => r.referenceCode !== receiptNo && r.reference_code !== receiptNo && !(r.studentId === effectiveStudentId && r.utr === p.utr)
        );
        filteredRequests.unshift({
          id: paymentRequestId || newPayment.id,
          studentId: effectiveStudentId,
          studentName: p.studentName || 'Student',
          itemType: itemTypeForDb,
          itemId: itemIdForDb,
          itemTitle: p.courseName || newPayment.courseName,
          paymentType: p.paymentType === 'Instalment 1' ? 'instalment_1' : 'full',
          expectedAmount: p.amount,
          referenceCode: receiptNo,
          paymentChannel: p.paymentMode === 'Net Banking' ? 'bank_transfer' : 'upi',
          paymentMethod: p.paymentMode === 'Net Banking' ? 'bank_transfer' : 'upi_manual',
          utr: p.utr,
          utrNormalized: p.utr.trim().toUpperCase(),
          screenshotPath: p.screenshotUrl || null,
          status: 'pending_review',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        });
        localStorage.setItem('cga_payment_requests', JSON.stringify(filteredRequests));
      }
    } catch {}

    return { success: true, receipt: newPayment };
  },

  async approvePayment(paymentId: string, reviewedBy = 'CGA Administrator'): Promise<ServiceResult> {
    invalidateDbCache();
    const sb = this.client();
    let approvedPayment: FeePayment | null = null;

    // 1. Try atomic database approval RPC
    try {
      await sb.rpc('cga_direct_approve_fee_payment', {
        p_payment_id: paymentId,
        p_reviewed_by: reviewedBy,
      });
    } catch (e) {
      console.warn('[approvePayment] cga_direct_approve_fee_payment notice:', e);
    }

    try {
      const { data } = await sb
        .from('fee_payments')
        .update({
          status: 'Verified',
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString(),
        })
        .or(`id.eq.${paymentId},receipt_no.eq.${paymentId},payment_request_id.eq.${paymentId}`)
        .select()
        .maybeSingle();
      if (data) approvedPayment = data as any;
    } catch {}

    // Update payment_requests if present
    try {
      const { data: prData } = await sb
        .from('payment_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .or(`id.eq.${paymentId},reference_code.eq.${paymentId}`)
        .select()
        .maybeSingle();

      if (!approvedPayment && prData) {
        approvedPayment = {
          id: prData.id,
          receiptNo: prData.reference_code,
          studentId: prData.student_id,
          studentName: 'Student',
          courseId: prData.item_id,
          courseName: prData.item_id,
          amount: Number(prData.amount_received || prData.expected_amount || 0),
          paymentMode: prData.payment_channel === 'bank_transfer' ? 'Net Banking' : 'UPI',
          paymentType: 'Full Payment',
          date: new Date().toISOString().slice(0, 10),
          status: 'Verified',
          reviewedBy,
          reviewedAt: new Date().toISOString(),
          remarks: `Admin approved. Ref: ${prData.reference_code}`,
          itemType: prData.item_type,
          itemId: prData.item_id,
        };
      }
    } catch {}

    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('cga_custom_payments');
        if (stored) {
          const list: FeePayment[] = JSON.parse(stored);
          const found = list.find((p) => p.id === paymentId || p.receiptNo === paymentId);
          if (found) {
            found.status = 'Verified';
            found.reviewedBy = reviewedBy;
            found.reviewedAt = new Date().toISOString();
            localStorage.setItem('cga_custom_payments', JSON.stringify(list));
            approvedPayment = found;
          }
        }
      }
    } catch {}

    // Fallback: check cga_payment_requests if not found in fee_payments
    if (!approvedPayment && typeof window !== 'undefined') {
      try {
        const storedReqs = localStorage.getItem('cga_payment_requests');
        if (storedReqs) {
          const rList = JSON.parse(storedReqs);
          const req = rList.find((r: any) => r.id === paymentId || r.referenceCode === paymentId);
          if (req) {
            req.status = 'approved';
            localStorage.setItem('cga_payment_requests', JSON.stringify(rList));
            approvedPayment = {
              id: req.id,
              receiptNo: req.referenceCode,
              studentId: req.studentId,
              studentName: req.studentName || 'Student',
              courseId: req.itemId,
              courseName: req.itemId,
              amount: req.amountReceived || req.expectedAmount,
              paymentMode: req.paymentChannel === 'bank_transfer' ? 'Net Banking' : 'UPI',
              paymentType: req.paymentType === 'instalment_1' ? 'Instalment 1' : req.paymentType === 'instalment_2' ? 'Instalment 2' : 'Full Payment',
              date: new Date().toISOString().slice(0, 10),
              status: 'Verified',
              reviewedBy,
              reviewedAt: new Date().toISOString(),
              remarks: `Admin approved. Ref: ${req.referenceCode}`,
              itemType: req.itemType,
              itemId: req.itemId,
            };
          }
        }
      } catch {}
    }

    // Unlock mock series or course in permanent state upon admin verification
    if (approvedPayment) {
      const raw = approvedPayment as any;
      const targetSeriesId = raw.item_id || raw.itemId || raw.course_id || raw.courseId;
      const targetStudentId = raw.student_id || raw.studentId;
      const targetItemType = raw.item_type || raw.itemType;
      const isSeries =
        targetItemType === 'mock_series' ||
        targetSeriesId?.startsWith('series-') ||
        raw.remarks?.includes('mock_series');

      if (isSeries && targetStudentId && targetSeriesId) {
        try {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw.id);
          await sb.from('series_enrollments').upsert(
            {
              student_id: targetStudentId,
              series_id: targetSeriesId,
              payment_id: isUuid ? raw.id : null,
              enrolled_at: new Date().toISOString(),
              access_valid_until: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString(),
            },
            { onConflict: 'student_id, series_id' }
          );
        } catch (e) {
          console.error('[approvePayment] series_enrollments upsert error:', e);
        }

        try {
          if (typeof window !== 'undefined') {
            const storedSe = localStorage.getItem('cga_series_enrollments');
            const seList = storedSe ? JSON.parse(storedSe) : [];
            if (!seList.some((e: any) => e.studentId === targetStudentId && e.seriesId === targetSeriesId)) {
              seList.push({
                id: `ser-enr-${Date.now()}`,
                studentId: targetStudentId,
                seriesId: targetSeriesId,
                paymentId: raw.id,
                enrolledAt: new Date().toISOString(),
                accessValidUntil: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString(),
              });
              localStorage.setItem('cga_series_enrollments', JSON.stringify(seList));
            }
          }
        } catch {}
      } else if (targetStudentId && targetSeriesId) {
        // Course enrolment unlocking
        try {
          await sb.from('enrollments').upsert(
            {
              student_id: targetStudentId,
              course_id: targetSeriesId,
              enrolled_date: new Date().toISOString().slice(0, 10),
              paid_amount: Number(raw.amount || 0),
              total_fee: Number(raw.amount || 0),
              due_amount: 0,
              progress: 0,
              access_valid_until: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString(),
            },
            { onConflict: 'student_id, course_id' }
          );
        } catch (e) {
          console.error('[approvePayment] enrollments upsert error:', e);
        }
      }
    }

    return { success: true };
  },

  async rejectPayment(paymentId: string, reason: string): Promise<ServiceResult> {
    invalidateDbCache();
    const sb = this.client();
    try {
      await sb
        .from('fee_payments')
        .update({
          status: 'Rejected',
          rejection_reason: reason,
          reviewed_at: new Date().toISOString(),
        })
        .or(`id.eq.${paymentId},receipt_no.eq.${paymentId}`);
    } catch {}

    try {
      await sb
        .from('payment_requests')
        .update({
          status: 'rejected',
          reject_reason: reason,
          reviewed_at: new Date().toISOString(),
        })
        .or(`id.eq.${paymentId},reference_code.eq.${paymentId}`);
    } catch {}

    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('cga_custom_payments');
        if (stored) {
          const list: FeePayment[] = JSON.parse(stored);
          const found = list.find((p) => p.id === paymentId || p.receiptNo === paymentId);
          if (found) {
            found.status = 'Rejected';
            found.rejectionReason = reason;
            found.reviewedAt = new Date().toISOString();
            localStorage.setItem('cga_custom_payments', JSON.stringify(list));
          }
        }

        const storedReqs = localStorage.getItem('cga_payment_requests');
        if (storedReqs) {
          const rList = JSON.parse(storedReqs);
          const foundR = rList.find((r: any) => r.id === paymentId || r.referenceCode === paymentId);
          if (foundR) {
            foundR.status = 'rejected';
            foundR.rejectReason = reason;
            localStorage.setItem('cga_payment_requests', JSON.stringify(rList));
          }
        }
      }
    } catch {}

    return { success: true };
  },

  async joinWaitingList(courseId: string): Promise<ServiceResult> {
    const { error } = await this.client().rpc('join_waiting_list', { p_course_id: courseId });
    return error ? { success: false, error: msg(error, 'Could not join waiting list.') } : { success: true };
  },

  async submitAttempt(
    testId: string,
    answers: Record<string, number>,
    timeTakenMinutes: number
  ): Promise<ServiceResult<{ attempt: TestAttempt }>> {
    const session = await this.getSession().catch(() => null);
    const stuId = session?.userId || 'me';

    // Strict Single Attempt Check: Any candidate can attempt a mock test only once
    if (typeof window !== 'undefined') {
      try {
        const existing = localStorage.getItem('cga_test_attempts');
        const arr: TestAttempt[] = existing ? JSON.parse(existing) : [];
        const alreadySubmitted = arr.some(
          (item) => item.testId === testId && (item.studentId === stuId || item.studentId === 'me') && Boolean(item.submittedAt)
        );
        if (alreadySubmitted) {
          return {
            success: false,
            error: 'Single Attempt Policy: You have already completed this mock test. Each candidate is permitted only one attempt.',
          };
        }
      } catch {}
    }

    // Authoritative server-side scoring via the deployed `submit_mock_attempt` RPC.
    let rpcData: Record<string, unknown> | null = null;
    try {
      const sb = this.client();
      const { data, error } = await sb.rpc('submit_mock_attempt', {
        p_test_id: testId,
        p_answers: answers,
        p_time_taken_seconds: Math.max(1, Math.round(timeTakenMinutes * 60)),
      });
      if (error) {
        const raw = error.message || '';
        if (/already been submitted/i.test(raw)) {
          return {
            success: false,
            error: 'Single Attempt Policy: You have already completed this mock test. Each candidate is permitted only one attempt.',
          };
        }
        if (/SESSION_REVOKED/i.test(raw)) {
          return { success: false, error: 'Your account has been signed in on another device. Please log in again.' };
        }
        if (/Attempt not initiated/i.test(raw)) {
          return { success: false, error: 'This attempt was not started properly. Please re-open the test and start it again.' };
        }
        return { success: false, error: msg(error, 'Test submission failed. Please try again.') };
      }
      rpcData = (data ?? null) as Record<string, unknown> | null;
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Test submission failed. Please try again.' };
    }
    if (!rpcData) {
      return { success: false, error: 'Test submission failed. Please try again.' };
    }

    let courseId = '';
    let testTitle = String(rpcData.testTitle ?? '');
    let totalMarks = Number(rpcData.totalMarks ?? 0);
    try {
      const { data: t } = await this.client()
        .from('mock_tests')
        .select('course_id, series_id, title, total_marks')
        .eq('id', testId)
        .maybeSingle();
      courseId = (t?.course_id as string) || (t?.series_id as string) || '';
      if (!testTitle && t?.title) testTitle = t.title;
      if (!totalMarks && t?.total_marks) totalMarks = Number(t.total_marks);
    } catch {}

    const secs = Number(rpcData.timeTakenSeconds ?? timeTakenMinutes * 60);
    const attempt: TestAttempt = {
      id: String(rpcData.attemptId ?? `att-${Date.now()}`),
      testId,
      testTitle: testTitle || 'Mock Test',
      courseId,
      studentId: stuId,
      studentName: session?.name || 'Student',
      score: Number(rpcData.score ?? 0),
      totalMarks: totalMarks || Number(rpcData.totalMarks ?? 30),
      correctCount: Number(rpcData.correctCount ?? 0),
      wrongCount: Number(rpcData.wrongCount ?? 0),
      unattemptedCount: Number(rpcData.unattemptedCount ?? 0),
      accuracy: Number(rpcData.accuracy ?? 0),
      timeTakenMinutes: Math.max(1, Math.round(secs / 60)),
      submittedAt: formatStamp(String(rpcData.submittedAt ?? new Date().toISOString())),
      answers,
    };

    invalidateDbCache();

    try {
      if (typeof window !== 'undefined') {
        const existing = localStorage.getItem('cga_test_attempts');
        const arr: TestAttempt[] = existing ? JSON.parse(existing) : [];
        if (!arr.some((item) => item.id === attempt.id)) {
          arr.unshift(attempt);
          localStorage.setItem('cga_test_attempts', JSON.stringify(arr));
        }
      }
    } catch {}

    return { success: true, attempt };
  },

  // ============ ADMIN CRUD (RLS enforces admin-only) ============
  async upsertCourse(c: Course): Promise<ServiceResult> {
    invalidateDbCache();
    const row = fromCourse(c);
    // let Postgres assign ids for brand-new records created with temporary client ids
    const { error } = await this.client().from('courses').upsert(row);
    return error ? { success: false, error: msg(error, 'Save failed.') } : { success: true };
  },
  async deleteCourse(id: string) {
    invalidateDbCache();
    const { error } = await this.client().from('courses').delete().eq('id', id);
    return error ? { success: false, error: msg(error, 'Delete failed.') } : { success: true };
  },
  async updateBatch(
    id: string,
    u: { status: string; batchSize: number; seatsAvailable: number; waitingListCount: number }
  ): Promise<ServiceResult> {
    const { error } = await this.client()
      .from('courses')
      .update({
        status: u.status,
        batch_size: u.batchSize,
        seats_available: u.seatsAvailable,
        waiting_list_count: u.waitingListCount,
      })
      .eq('id', id);
    return error ? { success: false, error: msg(error, 'Update failed.') } : { success: true };
  },

  async upsertFaculty(f: FacultyMember): Promise<ServiceResult> {
    const { error } = await this.client().from('faculty').upsert({
      id: f.id,
      name: f.name,
      designation: f.designation || null,
      subject: f.subject,
      qualification: f.qualification,
      experience: f.experience,
      photo: f.photo,
      bio: f.bio,
      specialization_tags: f.specializationTags || [],
      achievements: f.achievements || '',
      work_ability: f.workAbility || 'Online & Offline',
    });
    if (error) return { success: false, error: msg(error, 'Save failed.') };

    try {
      const { data: current } = await this.client().from('faculty').select('profile_id').eq('id', f.id).maybeSingle();
      if (current?.profile_id) {
        await this.client().from('profiles').update({
          name: f.name,
          qualification: f.qualification,
        }).eq('id', current.profile_id);
      }
    } catch {}

    return { success: true };
  },
  async deleteFaculty(id: string): Promise<ServiceResult> {
    try {
      const res = await fetch(`/api/admin/faculty?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) return { success: true };
    } catch {}

    const { error } = await this.client().from('faculty').delete().eq('id', id);
    return error ? { success: false, error: msg(error, 'Delete failed.') } : { success: true };
  },

  async upsertMaterial(m: StudyMaterial): Promise<ServiceResult> {
    invalidateDbCache();
    if (typeof window !== 'undefined') {
      try {
        const dmat = localStorage.getItem('cga_deleted_materials');
        if (dmat) {
          const list: string[] = JSON.parse(dmat);
          const next = list.filter((x) => x !== m.id);
          localStorage.setItem('cga_deleted_materials', JSON.stringify(next));
        }
      } catch {}
    }

    try {
      let token: string | undefined;
      try {
        const s = (await this.client().auth.getSession()).data?.session;
        token = s?.access_token;
      } catch {}
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/admin/materials', {
        method: 'POST',
        headers,
        body: JSON.stringify(m),
      });
      if (res.ok) {
        invalidateDbCache();
        return { success: true };
      }
    } catch {}

    const { error } = await this.client().from('study_materials').upsert({
      id: m.id,
      title: m.title,
      course_id: m.courseId,
      type: m.type,
      author: m.author,
      pages: m.pages,
      file_size: m.fileSize,
      uploaded_date: m.uploadedDate,
      description: m.description,
      preview_sections: m.previewSections,
    });
    return error ? { success: false, error: msg(error, 'Save failed.') } : { success: true };
  },
  async deleteMaterial(id: string): Promise<ServiceResult> {
    invalidateDbCache();
    // 1. Immediately track as deleted locally so it never resurrects
    if (typeof window !== 'undefined') {
      try {
        const dmat = localStorage.getItem('cga_deleted_materials');
        const list: string[] = dmat ? JSON.parse(dmat) : [];
        if (!list.includes(id)) {
          list.push(id);
          localStorage.setItem('cga_deleted_materials', JSON.stringify(list));
        }
      } catch {}
    }

    // 2. Cascade delete on the server via dedicated admin route
    try {
      let token: string | undefined;
      try {
        const s = (await this.client().auth.getSession()).data?.session;
        token = s?.access_token;
      } catch {}
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/admin/materials?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        invalidateDbCache();
        return { success: true };
      }
    } catch {}

    // 3. Fallback direct database delete
    const { error } = await this.client().from('study_materials').delete().eq('id', id);
    return error ? { success: false, error: msg(error, 'Delete failed.') } : { success: true };
  },

  async upsertTest(t: MockTest): Promise<ServiceResult> {
    invalidateDbCache();
    const validCourseId: string | null = t.courseId?.trim() || null;

    // Fast-path: persist immediately to local storage state
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cga_custom_tests');
        const list: MockTest[] = stored ? JSON.parse(stored) : [];
        const idx = list.findIndex((item) => item.id === t.id);
        if (idx >= 0) {
          list[idx] = t;
        } else {
          list.push(t);
        }
        localStorage.setItem('cga_custom_tests', JSON.stringify(list));

        const delStored = localStorage.getItem('cga_deleted_tests');
        if (delStored) {
          const delList: string[] = JSON.parse(delStored);
          const nextDelList = delList.filter((id) => id !== t.id);
          localStorage.setItem('cga_deleted_tests', JSON.stringify(nextDelList));
        }
      } catch {}
    }

    let finalSeriesId: string = (t as any).seriesId ?? '';
    if (!finalSeriesId) {
      const normTitle = (t.title || '').toLowerCase();
      const normSubj = (t.subject || '').toLowerCase();
      const cId = (validCourseId || t.courseId || '').toLowerCase();

      if (normTitle.includes('bio') && (normTitle.includes('stgt') || normSubj.includes('botany') || normSubj.includes('zoology') || cId.includes('bio'))) {
        finalSeriesId = 'series-stgt-bio-sci';
      } else if (normTitle.includes('pure') && (normTitle.includes('stgt') || normSubj.includes('physics') || normSubj.includes('chemistry') || cId.includes('pure'))) {
        finalSeriesId = 'series-stgt-pure-sci';
      } else if (normTitle.includes('stgt') || cId.includes('stgt')) {
        finalSeriesId = 'series-stgt-soc';
      } else if (normTitle.includes('tcs') || normTitle.includes('tps') || cId.includes('tcs') || cId.includes('tps')) {
        finalSeriesId = 'series-tcs-tps';
      } else if (normTitle.includes('tpsc') || normTitle.includes('jrbt') || cId.includes('tpsc') || cId.includes('jrbt')) {
        finalSeriesId = 'series-tpsc-combined';
      } else if (normTitle.includes('banking') || normTitle.includes('ibps') || normTitle.includes('sbi') || cId.includes('banking')) {
        finalSeriesId = 'series-banking-ssc';
      } else if (normTitle.includes('tbse') || normTitle.includes('cbse') || normTitle.includes('school') || cId.includes('school')) {
        finalSeriesId = 'series-school-foundation';
      } else {
        const isP2 = normTitle.includes('paper-ii') || normTitle.includes('paper 2') || normTitle.includes('paper-2') || normTitle.includes('paper ii') || cId.includes('tet-2');
        const isSocial = normTitle.includes('social') || normTitle.includes('sst') || normTitle.includes('arts') || normTitle.includes('history') || normTitle.includes('geography') || normTitle.includes('civics') || normTitle.includes('political') || normSubj.includes('social') || normSubj.includes('history') || normSubj.includes('geography') || normSubj.includes('political') || cId.includes('sst') || cId.includes('arts');
        const isScience = normTitle.includes('science') || normTitle.includes('physics') || normTitle.includes('chemistry') || normTitle.includes('biology') || normSubj.includes('science') || cId.includes('sci');

        if (isP2 && isSocial) {
          finalSeriesId = 'series-ttet-paper2-soc';
        } else if (isP2 && isScience) {
          finalSeriesId = 'series-ttet-paper2-sci';
        } else if (isSocial) {
          finalSeriesId = 'series-ttet-paper2-soc';
        } else if (isScience) {
          finalSeriesId = 'series-ttet-paper2-sci';
        } else {
          finalSeriesId = 'series-ttet-paper1';
        }
      }
    }

    // 1. Authoritative server-side persistence via admin route
    try {
      let token: string | undefined;
      try {
        const s = (await this.client().auth.getSession()).data?.session;
        token = s?.access_token;
      } catch {}

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/admin/mock-tests', {
        method: 'POST',
        headers,
        body: JSON.stringify(t),
      });
      if (res.ok) {
        invalidateDbCache();
        if (typeof window !== 'undefined') {
          try {
            const stored = localStorage.getItem('cga_custom_tests');
            const list: MockTest[] = stored ? JSON.parse(stored) : [];
            const idx = list.findIndex((item) => item.id === t.id);
            if (idx >= 0) {
              list[idx] = t;
            } else {
              list.push(t);
            }
            localStorage.setItem('cga_custom_tests', JSON.stringify(list));

            const delStored = localStorage.getItem('cga_deleted_tests');
            if (delStored) {
              const delList: string[] = JSON.parse(delStored);
              const nextDelList = delList.filter((id) => id !== t.id);
              localStorage.setItem('cga_deleted_tests', JSON.stringify(nextDelList));
            }
          } catch {}
        }
        return { success: true };
      }
    } catch {}

    // Verify valid subject_id to avoid Postgres FK violation on direct fallback
    let validSubjId: string | null = (t as any).subjectId ?? null;
    if (validSubjId && !validSubjId.startsWith('subj-')) {
      validSubjId = null;
    }

    const { error } = await this.client().from('mock_tests').upsert({
      id: t.id,
      title: t.title,
      subject: t.subject ?? null,
      drive_link: t.driveLink ?? null,
      course_id: validCourseId,
      series_id: finalSeriesId,
      subject_id: validSubjId,
      test_type: (t as any).testType ?? 'sectional',
      test_no: (t as any).testNo ?? 1,
      question_count: t.questions?.length || 0,
      batch_name: t.batchName || '',
      duration_minutes: t.durationMinutes || 60,
      total_marks: t.totalMarks || (t.questions?.length ? t.questions.length * (t.marksPerQuestion || 1) : 30),
      marks_per_question: t.marksPerQuestion || 1,
      negative_marking: t.negativeMarking || 0,
      scheduled_date: t.scheduledDate || '',
      status: t.status || 'Draft',
      questions: t.questions || [],
      window_start: (t as any).windowStart ?? null,
      window_end: (t as any).windowEnd ?? null,
    });

    if (error) {
      return { success: false, error: msg(error, 'Could not save mock test to database.') };
    }

    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('cga_custom_tests');
        const list: MockTest[] = stored ? JSON.parse(stored) : [];
        const idx = list.findIndex((item) => item.id === t.id);
        if (idx >= 0) {
          list[idx] = t;
        } else {
          list.push(t);
        }
        localStorage.setItem('cga_custom_tests', JSON.stringify(list));

        // If it was previously marked deleted, un-delete it
        const delStored = localStorage.getItem('cga_deleted_tests');
        if (delStored) {
          const delList: string[] = JSON.parse(delStored);
          const nextDelList = delList.filter((id) => id !== t.id);
          localStorage.setItem('cga_deleted_tests', JSON.stringify(nextDelList));
        }
      }
    } catch {}

    return { success: true };
  },
  async deleteTest(id: string): Promise<ServiceResult> {
    invalidateDbCache();
    // 1. Instantly remove from local storage state so it disappears from UI immediately
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cga_custom_tests');
        if (stored) {
          const list: MockTest[] = JSON.parse(stored);
          const filtered = list.filter((t) => t.id !== id);
          localStorage.setItem('cga_custom_tests', JSON.stringify(filtered));
        }
        const delStored = localStorage.getItem('cga_deleted_tests');
        const delList: string[] = delStored ? JSON.parse(delStored) : [];
        if (!delList.includes(id)) {
          delList.push(id);
          localStorage.setItem('cga_deleted_tests', JSON.stringify(delList));
        }
      } catch {}
    }

    // 2. Cascade delete on the server via dedicated admin route
    try {
      const res = await fetch(`/api/admin/mock-tests?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) {
        return { success: true };
      }
    } catch {}

    // 3. Fallback direct database delete
    const { error } = await this.client().from('mock_tests').delete().eq('id', id);
    if (error && error.code !== 'PGRST116') {
      return { success: false, error: msg(error, 'Delete failed.') };
    }

    return { success: true };
  },

  async upsertAchievement(a: Achievement): Promise<ServiceResult> {
    const { error } = await this.client().from('achievements').upsert({
      id: a.id,
      name: a.name,
      exam: a.exam,
      rank: a.rank,
      year: a.year,
      photo: a.photo,
      quote: a.quote,
      category: a.category,
    });
    return error ? { success: false, error: msg(error, 'Save failed.') } : { success: true };
  },
  async deleteAchievement(id: string) {
    const { error } = await this.client().from('achievements').delete().eq('id', id);
    return error ? { success: false, error: msg(error, 'Delete failed.') } : { success: true };
  },

  async upsertAnnouncement(a: Announcement): Promise<ServiceResult> {
    const { error } = await this.client().from('announcements').upsert({
      id: a.id,
      title: a.title,
      content: a.content,
      target_batch: a.targetBatch,
      target_label: a.targetLabel,
      priority: a.priority,
      date: a.date,
      author: a.author,
    });
    return error ? { success: false, error: msg(error, 'Save failed.') } : { success: true };
  },
  async deleteAnnouncement(id: string) {
    const { error } = await this.client().from('announcements').delete().eq('id', id);
    return error ? { success: false, error: msg(error, 'Delete failed.') } : { success: true };
  },

  async upsertMockSubjectPost(post: MockSubjectPost): Promise<ServiceResult> {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('cga_mock_subject_posts');
        const list: MockSubjectPost[] = stored ? JSON.parse(stored) : [...(INITIAL_SEED_DATA.mockSubjectPosts || [])];
        const idx = list.findIndex((p) => p.id === post.id);
        if (idx >= 0) {
          list[idx] = post;
        } else {
          list.unshift(post);
        }
        localStorage.setItem('cga_mock_subject_posts', JSON.stringify(list));
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Could not save mock subject question post' };
    }
    return { success: true };
  },

  async deleteMockSubjectPost(id: string): Promise<ServiceResult> {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('cga_mock_subject_posts');
        const list: MockSubjectPost[] = stored ? JSON.parse(stored) : [...(INITIAL_SEED_DATA.mockSubjectPosts || [])];
        const filtered = list.filter((p) => p.id !== id);
        localStorage.setItem('cga_mock_subject_posts', JSON.stringify(filtered));
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Could not delete mock subject question post' };
    }
    return { success: true };
  },

  async updateMockSeries(series: MockSeries): Promise<ServiceResult<{ series?: MockSeries }>> {
    try {
      const res = await fetch('/api/admin/mock-tests/series', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: series.id,
          price: series.price,
          startsOn: series.startsOn,
          status: series.status,
          name: series.name,
          description: series.description,
          batchLabel: series.batchLabel,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Fallback to direct supabase client update if authenticated as admin in browser
        const sb = this.client();
        const { error: sbErr } = await sb
          .from('mock_series')
          .update({
            price: Number(series.price),
            starts_on: series.startsOn,
            status: series.status,
            name: series.name,
            description: series.description,
            batch_label: series.batchLabel,
          })
          .eq('id', series.id);
        if (sbErr) {
          return { success: false, error: data.error || sbErr.message };
        }
      }
      return { success: true };
    } catch (err: any) {
      try {
        const sb = this.client();
        const { error: sbErr } = await sb
          .from('mock_series')
          .update({
            price: Number(series.price),
            starts_on: series.startsOn,
            status: series.status,
            name: series.name,
            description: series.description,
            batch_label: series.batchLabel,
          })
          .eq('id', series.id);
        if (sbErr) return { success: false, error: sbErr.message };
        return { success: true };
      } catch (fallbackErr: any) {
        return { success: false, error: fallbackErr?.message || 'Failed to update mock test series' };
      }
    }
  },

  async saveSiteContent(content: SiteContent): Promise<ServiceResult> {
    const { error } = await this.client()
      .from('site_content')
      .upsert({ id: 1, content, updated_at: new Date().toISOString() });
    return error ? { success: false, error: msg(error, 'Save failed.') } : { success: true };
  },

  // ---- student management (admin) ----
  async updateStudentAsAdmin(s: StudentProfile): Promise<ServiceResult> {
    const { error } = await this.client()
      .from('profiles')
      .update({
        name: s.name,
        phone: s.phone,
        photo: s.photo,
        guardian_name: s.guardianName,
        address: s.address,
        permanent_address: s.permanentAddress || s.address,
        qualification: s.qualification,
        target_exam: s.targetExam,
        status: s.status,
      })
      .eq('id', s.id);
    return error ? { success: false, error: msg(error, 'Save failed.') } : { success: true };
  },
  async setStudentStatus(id: string, status: 'Active' | 'Inactive'): Promise<ServiceResult> {
    const { error } = await this.client().from('profiles').update({ status }).eq('id', id);
    return error ? { success: false, error: msg(error, 'Update failed.') } : { success: true };
  },
  /** Creates a real auth account (server route, service role). Returns a temporary password. */
  async createStudentAsAdmin(s: StudentProfile): Promise<ServiceResult<{ tempPassword: string }>> {
    const res = await fetch('/api/admin/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: s.name,
        email: s.email,
        phone: s.phone,
        guardianName: s.guardianName,
        address: s.address,
        permanentAddress: s.permanentAddress || s.address,
        qualification: s.qualification,
        targetExam: s.targetExam,
      }),
    });
    const json = await res.json().catch(() => ({}));
    return res.ok
      ? { success: true, tempPassword: json.tempPassword }
      : { success: false, error: json.error || 'Could not create student.' };
  },
  async deleteStudentAsAdmin(id: string): Promise<ServiceResult> {
    const res = await fetch(`/api/admin/students?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    const json = await res.json().catch(() => ({}));
    return res.ok ? { success: true } : { success: false, error: json.error || 'Could not delete student.' };
  },

  async adminSetStudentPassword(studentId: string, password: string): Promise<ServiceResult> {
    try {
      const res = await fetch('/api/admin/students/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to update student password.' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error updating password.' };
    }
  },
  async deleteEnquiry(id: string) {
    const { error } = await this.client().from('enquiries').delete().eq('id', id);
    return error ? { success: false, error: msg(error, 'Delete failed.') } : { success: true };
  },

  // ============ T-TET MOCK TEST SERIES ============
  async enrolInSeries(params: {
    seriesId: string;
    paymentMode?: FeePayment['paymentMode'];
    paymentRef?: string;
    studentId?: string;
  }): Promise<ServiceResult<EnrolSeriesData>> {
    const sb = this.client();
    const { data, error } = await sb.rpc('enrol_in_series', {
      p_series_id: params.seriesId,
      p_payment_mode: params.paymentMode ?? 'UPI',
      p_payment_ref: params.paymentRef ?? null,
      p_student_id: params.studentId ?? null,
    });
    if (error) return { success: false, error: msg(error, 'Enrolment failed.') };
    const resData = data as EnrolSeriesData;
    return {
      success: true,
      receiptNo: resData.receiptNo,
      amount: resData.amount,
      enrollmentId: resData.enrollmentId,
    };
  },

  async getSeriesTestQuestions(testId: string): Promise<ServiceResult<QuestionsData>> {
    const sb = this.client();
    const user = (await sb.auth.getUser()).data.user;
    if (user?.id) {
      const { data: rl } = await sb.rpc('check_rate_limit', {
        p_key: `mock_start_${user.id}`,
        p_limit: 10,
        p_window_seconds: 60,
      });
      if (rl && !rl.allowed) {
        return { success: false, error: 'Too many test launch attempts. Please wait a minute before launching another test.' };
      }
    }
    const { data, error } = await sb.rpc('get_test_questions', { p_test_id: testId });
    if (error) return { success: false, error: msg(error, 'Failed to fetch test questions.') };
    return { success: true, ...(data as QuestionsData) };
  },

  async saveAttemptProgress(testId: string, answers: Record<string, number>): Promise<void> {
    const sb = this.client();
    const user = (await sb.auth.getUser()).data.user;
    if (user?.id) {
      const { data: rl } = await sb.rpc('check_rate_limit', {
        p_key: `mock_save_${user.id}`,
        p_limit: 60,
        p_window_seconds: 60,
      });
      if (rl && !rl.allowed) {
        // Capped / throttled silently to avoid spamming the database
        return;
      }
    }
    await sb.rpc('save_attempt_progress', {
      p_test_id: testId,
      p_answers: answers,
    });
  },

  async submitMockAttempt(params: {
    testId: string;
    answers: Record<string, number>;
    timeTakenSeconds?: number;
  }): Promise<ServiceResult<SeriesAttempt & { totalMarks?: number }>> {
    const sb = this.client();
    const user = (await sb.auth.getUser()).data.user;
    if (user?.id) {
      const { data: rl } = await sb.rpc('check_rate_limit', {
        p_key: `mock_submit_${user.id}`,
        p_limit: 5,
        p_window_seconds: 60,
      });
      if (rl && !rl.allowed) {
        return { success: false, error: 'Submission rate limit reached. Please wait before retrying.' };
      }
    }
    const { data, error } = await sb.rpc('submit_mock_attempt', {
      p_test_id: params.testId,
      p_answers: params.answers,
      p_time_taken_seconds: params.timeTakenSeconds ?? 0,
    });
    if (error) return { success: false, error: msg(error, 'Test submission failed.') };
    return { success: true, ...data };
  },

  async getTestSolutions(testId: string): Promise<ServiceResult<SeriesQuestion[]>> {
    const sb = this.client();
    const { data, error } = await sb.rpc('get_test_solutions', { p_test_id: testId });
    if (error) return { success: false, error: msg(error, 'Failed to fetch solutions.') };
    return { success: true, data };
  },

  async saveSeriesTest(test: SeriesMockTest, isNew?: boolean): Promise<ServiceResult> {
    void isNew;
    invalidateDbCache();
    const sb = this.client();
    const payload = {
      id: test.id,
      series_id: test.seriesId,
      subject_id: test.subjectId || null,
      test_type: test.testType,
      title: test.title,
      test_no: test.testNo,
      question_count: test.questionCount,
      total_marks: test.totalMarks,
      marks_per_question: test.marksPerQuestion,
      negative_marking: test.negativeMarking,
      duration_minutes: test.durationMinutes,
      status: test.status,
      window_start: test.windowStart || null,
      window_end: test.windowEnd || null,
      window_hours: test.windowHours || null,
      show_solutions: test.showSolutions,
      shuffle: test.shuffle,
      content_status: test.contentStatus || 'draft',
      purge_after: test.purgeAfter || null,
      retention_days: test.retentionDays || 7,
      archive_downloaded_at: test.archiveDownloadedAt || null,
      purge_requires_archive: test.purgeRequiresArchive ?? true,
    };
    const { error } = await sb.from('mock_tests').upsert(payload);
    return error ? { success: false, error: msg(error, 'Failed to save test.') } : { success: true };
  },

  async deleteSeriesTest(testId: string): Promise<ServiceResult> {
    invalidateDbCache();
    const sb = this.client();
    const { error } = await sb.from('mock_tests').delete().eq('id', testId);
    return error ? { success: false, error: msg(error, 'Failed to delete test.') } : { success: true };
  },

  async launchSeriesTest(params: {
    testId: string;
    windowHours: number;
    windowStart?: string;
  }): Promise<ServiceResult> {
    const sb = this.client();
    const startIso = params.windowStart || new Date().toISOString();
    const endDate = new Date(new Date(startIso).getTime() + params.windowHours * 3600 * 1000);
    const endIso = endDate.toISOString();

    const { error } = await sb
      .from('mock_tests')
      .update({
        status: 'launched',
        window_start: startIso,
        window_end: endIso,
        window_hours: params.windowHours,
      })
      .eq('id', params.testId);

    if (!error) {
      const user = (await sb.auth.getUser()).data.user;
      await sb.from('mock_launch_log').insert({
        test_id: params.testId,
        admin_id: user?.id || null,
        action: 'LAUNCH',
        window_start: startIso,
        window_end: endIso,
      });
    }

    return error ? { success: false, error: msg(error, 'Launch failed.') } : { success: true };
  },

  async closeSeriesTest(testId: string): Promise<ServiceResult> {
    const sb = this.client();
    const { error } = await sb
      .from('mock_tests')
      .update({
        status: 'closed',
        window_end: new Date().toISOString(),
      })
      .eq('id', testId);

    if (!error) {
      const user = (await sb.auth.getUser()).data.user;
      await sb.from('mock_launch_log').insert({
        test_id: testId,
        admin_id: user?.id || null,
        action: 'CLOSE',
        window_end: new Date().toISOString(),
      });
    }

    return error ? { success: false, error: msg(error, 'Failed to close test.') } : { success: true };
  },

  async logSecurityEvent(
    eventType: string,
    details: Record<string, unknown> = {}
  ): Promise<{ success: boolean }> {
    try {
      const sb = this.client();
      const user = (await sb.auth.getUser()).data?.user;
      await sb.rpc('log_security_event', {
        p_event_type: eventType,
        p_details: details,
        p_actor_email: user?.email || null,
      });
      return { success: true };
    } catch {
      return { success: false };
    }
  },

  async requestAccountDeletion(
    reason?: string,
    guardianConsent = false
  ): Promise<ServiceResult<{ requestId: string }>> {
    try {
      const sb = this.client();
      const { data, error } = await sb.rpc('request_account_deletion', {
        p_reason: reason || null,
        p_guardian_consent: guardianConsent,
      });

      if (error) {
        return { success: false, error: msg(error, 'Could not submit account deletion request.') };
      }

      return { success: true, requestId: data as string };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error processing deletion request.' };
    }
  },
};

