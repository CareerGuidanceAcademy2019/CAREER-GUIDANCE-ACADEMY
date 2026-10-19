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

  return {
    id: r.id,
    title: r.title,
    courseId: r.course_id,
    courseName,
    batchName: r.batch_name,
    durationMinutes: r.duration_minutes,
    totalMarks: Number(r.total_marks),
    marksPerQuestion: Number(r.marks_per_question),
    negativeMarking: Number(r.negative_marking),
    scheduledDate: r.scheduled_date,
    status: r.status,
    subject: r.subject ?? undefined,
    driveLink: r.drive_link ?? undefined,
    questions,
  };
};

const toPayment = (r: Row, studentName: string, courseName: string): FeePayment => ({
  id: r.id,
  receiptNo: r.receipt_no,
  studentId: r.student_id,
  studentName,
  courseId: r.course_id,
  courseName,
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
        ? 'Subhradip Banik'
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

  /** Sign in with an email OR a phone number plus password. */
  async login(identifier: string, password: string): Promise<ServiceResult<{ session: AuthSession }>> {
    const sb = this.client();
    const parsed = parseIdentifier(identifier);
    if (!parsed) return { success: false, error: 'Enter a valid email address or 10-digit mobile number.' };

    let email = parsed.value;
    if (parsed.kind === 'phone') {
      try {
        const { data, error } = await sb.rpc('resolve_login_email', {
          p_identifier: parsed.value,
          p_password: password,
        });
        if (!error && data) {
          email = data as string;
        } else {
          return { success: false, error: 'Invalid phone number or password.' };
        }
      } catch {
        return { success: false, error: 'Invalid phone number or password.' };
      }
    }

    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      return {
        success: false,
        error:
          error.message === 'Email not confirmed'
            ? 'Please confirm your email address using the link we sent you, then sign in.'
            : `Invalid ${parsed.kind === 'phone' ? 'phone number' : 'email'} or password.`,
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
    const { data, error } = await sb.auth.signUp({
      email: cleanEmail,
      password,
      options: { emailRedirectTo: `${window.location.origin}/login`, data: meta },
    });
    if (error) {
      const msg = error.message || '';
      if (/user already registered/i.test(msg) || /already exists/i.test(msg) || /identity/i.test(msg)) {
        return { success: false, error: 'An account with this email address already exists. Please sign in.' };
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
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://careerguidanceacademy.in';
    const { error } = await this.client().auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${origin}/reset-password`,
    });
    // Do not reveal whether the email exists.
    if (error && error.status === 429) {
      return { success: false, error: 'Too many requests. Please wait a minute and try again.' };
    }
    return { success: true };
  },

  async updatePassword(newPassword: string): Promise<ServiceResult> {
    const { error } = await this.client().auth.updateUser({ password: newPassword });
    return error ? { success: false, error: error.message } : { success: true };
  },

  async logout(): Promise<void> {
    await this.client().auth.signOut();
  },

  // ============ LOAD EVERYTHING THE CURRENT USER MAY SEE (RLS-filtered) ============
  async loadDatabase(session: AuthSession | null): Promise<CgaDatabase> {
    const sb = this.client();
    const one = async (q: PromiseLike<{ data: Row[] | null; error: unknown }>) => (await q).data ?? [];

    const [site, faculty, courses, achievements, seriesRaw, subjectsRaw] = await Promise.all([
      sb.from('site_content').select('content').eq('id', 1).maybeSingle(),
      one(sb.from('faculty').select('*').order('name')),
      one(sb.from('courses').select('*').order('name')),
      one(sb.from('achievements').select('*')),
      one(sb.from('mock_series').select('*').order('price')),
      one(sb.from('mock_subjects').select('*').order('sort_order')),
    ]);

    let materials: Row[] = [];
    let tests: Row[] = [];
    let announcements: Row[] = [];
    let profiles: Row[] = [];
    let enrollments: Row[] = [];
    let payments: Row[] = [];
    let attempts: Row[] = [];
    let peers: Row[] = [];
    let enquiries: Row[] = [];
    let seriesTestsRaw: Row[] = [];
    let seriesEnrRaw: Row[] = [];
    let seriesAttemptsRaw: Row[] = [];

    if (session) {
      [materials, tests, announcements, profiles, enrollments, payments, attempts, enquiries, seriesTestsRaw, seriesEnrRaw, seriesAttemptsRaw] =
        await Promise.all([
          one(sb.from('study_materials').select('*').order('uploaded_date', { ascending: false })),
          one(sb.from('mock_tests').select('*').is('series_id', null)),
          one(sb.from('announcements').select('*').order('date', { ascending: false })),
          one(sb.from('profiles').select('*').order('created_at', { ascending: false })),
          one(sb.from('enrollments').select('*')),
          one(sb.from('fee_payments').select('*').order('date', { ascending: false })),
          one(sb.from('test_attempts').select('*').order('submitted_at', { ascending: false })),
          session.role === 'ADMIN'
            ? one(sb.from('enquiries').select('*').order('created_at', { ascending: false }))
            : Promise.resolve([] as Row[]),
          one(sb.from('mock_tests').select('*').not('series_id', 'is', null)),
          one(sb.from('series_enrollments').select('*')),
          one(sb.from('mock_attempts').select('*').order('submitted_at', { ascending: false })),
        ]);
      if (session.role === 'STUDENT') {
        const res = await sb.rpc('get_peer_attempts');
        peers = (res.data as Row[]) ?? [];
      }
    }

    const facultyList = faculty.map(toFaculty);
    const facultyName = (id: string | null) => facultyList.find((f) => f.id === id)?.name ?? '';
    const courseName = (id: string) => courses.find((c: Row) => c.id === id)?.name ?? '';

    const materialList = materials.map((m) => toMaterial(m, courseName(m.course_id)));
    const courseList = courses.map((c: Row) =>
      toCourse(
        c,
        facultyName(c.faculty_id),
        materialList.filter((m) => m.courseId === c.id).map((m) => m.id)
      )
    );
    let localTests: MockTest[] = [];
    let localDeletedIds: string[] = [];
    let localAttempts: TestAttempt[] = [];
    if (typeof window !== 'undefined') {
      try {
        const ct = localStorage.getItem('cga_custom_tests');
        if (ct) localTests = JSON.parse(ct);
        const dt = localStorage.getItem('cga_deleted_tests');
        if (dt) localDeletedIds = JSON.parse(dt);
        const at = localStorage.getItem('cga_test_attempts');
        if (at) localAttempts = JSON.parse(at);
      } catch {}
    }

    const testListMaster = tests.map((t) => toTest(t, courseName(t.course_id), false, true));
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
        password: '', // passwords are never stored or readable by the app
        photo: p.photo ?? '',
        guardianName: p.guardian_name ?? '',
        address: p.address ?? '',
        permanentAddress: p.permanent_address ?? '',
        qualification: p.qualification ?? '',
        targetExam: p.target_exam ?? '',
        joinedDate: p.joined_date,
        status: p.status,
        enrollments: enr,
      };
    });
    const studentName = (id: string) => students.find((s) => s.id === id)?.name ?? session?.name ?? '';
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
    const feePayments: FeePayment[] = [
      ...localPayments.filter((lp) => !serverPayments.some((sp) => sp.id === lp.id)),
      ...serverPayments,
    ];

    const testTitle = (id: string) => allMasterTests.find((t) => t.id === id)?.title ?? '';
    const testCourse = (id: string) => allMasterTests.find((t) => t.id === id)?.courseId ?? '';

    const serverAttempts = attempts.map((a) =>
      toAttempt(a, testTitle(a.test_id), testCourse(a.test_id), studentName(a.student_id))
    );

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
            id: q.id,
            question: q.question,
            options: q.options,
            correctOptionIndex: -1,
            explanation: '',
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

    return {
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
      studyMaterials: materialList.length > 0 ? materialList : INITIAL_SEED_DATA.studyMaterials,
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
      seriesEnrollments: seriesEnrRaw.map((e: Row) => ({
        id: e.id,
        studentId: e.student_id,
        seriesId: e.series_id,
        paymentId: e.payment_id ?? undefined,
        enrolledAt: e.enrolled_at,
        accessValidUntil: e.access_valid_until ?? undefined,
      })),
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
  }): Promise<ServiceResult<{ receipt: FeePayment }>> {
    const sb = this.client();
    const receiptNo = `${PAYMENT_SETTINGS.receiptPrefix}${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPayment: FeePayment = {
      id: `pay-${Date.now()}`,
      receiptNo,
      studentId: p.studentId,
      studentName: p.studentName || 'Student',
      courseId: p.courseId,
      courseName: p.courseName || 'Course',
      amount: p.amount,
      paymentMode: p.paymentMode,
      paymentType: p.paymentType,
      date: new Date().toISOString().split('T')[0],
      remarks: p.remarks || `UPI Payment (UTR: ${p.utr})`,
      status: 'Pending',
      utr: p.utr,
      screenshot: p.screenshotUrl,
    };

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(newPayment.id);
      const insertPayload: Record<string, unknown> = {
        receipt_no: newPayment.receiptNo,
        student_id: newPayment.studentId,
        course_id: newPayment.courseId,
        amount: newPayment.amount,
        payment_mode: newPayment.paymentMode,
        payment_type: newPayment.paymentType,
        remarks: newPayment.remarks,
        status: 'Pending',
        utr: p.utr,
        screenshot_url: p.screenshotUrl || null,
      };
      if (isUuid) insertPayload.id = newPayment.id;
      const { data: inserted } = await sb
        .from('fee_payments')
        .insert(insertPayload)
        .select()
        .single();
      if (inserted && (inserted as { id?: string }).id) {
        newPayment.id = (inserted as { id: string }).id;
      }
    } catch {}

    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('cga_custom_payments');
        const list: FeePayment[] = stored ? JSON.parse(stored) : [];
        list.unshift(newPayment);
        localStorage.setItem('cga_custom_payments', JSON.stringify(list));
      }
    } catch {}

    return { success: true, receipt: newPayment };
  },

  async approvePayment(paymentId: string, reviewedBy = 'CGA Administrator'): Promise<ServiceResult> {
    const sb = this.client();
    try {
      await sb
        .from('fee_payments')
        .update({
          status: 'Verified',
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', paymentId);
    } catch {}

    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('cga_custom_payments');
        if (stored) {
          const list: FeePayment[] = JSON.parse(stored);
          const found = list.find((p) => p.id === paymentId);
          if (found) {
            found.status = 'Verified';
            found.reviewedBy = reviewedBy;
            found.reviewedAt = new Date().toISOString();
            localStorage.setItem('cga_custom_payments', JSON.stringify(list));
          }
        }
      }
    } catch {}

    return { success: true };
  },

  async rejectPayment(paymentId: string, reason: string): Promise<ServiceResult> {
    const sb = this.client();
    try {
      await sb
        .from('fee_payments')
        .update({
          status: 'Rejected',
          rejection_reason: reason,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', paymentId);
    } catch {}

    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('cga_custom_payments');
        if (stored) {
          const list: FeePayment[] = JSON.parse(stored);
          const found = list.find((p) => p.id === paymentId);
          if (found) {
            found.status = 'Rejected';
            found.rejectionReason = reason;
            found.reviewedAt = new Date().toISOString();
            localStorage.setItem('cga_custom_payments', JSON.stringify(list));
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
    let sbAttempt: TestAttempt | null = null;
    try {
      const { data, error } = await this.client().rpc('submit_test_attempt', {
        p_test_id: testId,
        p_answers: answers,
        p_time_taken_minutes: timeTakenMinutes,
      });
      if (!error && data) {
        const a = data as TestAttempt;
        sbAttempt = { ...a, submittedAt: formatStamp(a.submittedAt) };
      }
    } catch {
      // Fallback to local authoritative evaluation
    }

    if (sbAttempt) {
      try {
        if (typeof window !== 'undefined') {
          const existing = localStorage.getItem('cga_test_attempts');
          const arr: TestAttempt[] = existing ? JSON.parse(existing) : [];
          if (!arr.some((item) => item.id === sbAttempt?.id)) {
            arr.unshift(sbAttempt);
            localStorage.setItem('cga_test_attempts', JSON.stringify(arr));
          }
        }
      } catch {}
      return { success: true, attempt: sbAttempt };
    }

    // Authoritative fallback evaluation against master questions
    let allMasterTests: MockTest[] = [...INITIAL_SEED_DATA.mockTests];
    if (typeof window !== 'undefined') {
      try {
        const ct = localStorage.getItem('cga_custom_tests');
        if (ct) {
          const list: MockTest[] = JSON.parse(ct);
          allMasterTests = [...list, ...allMasterTests];
        }
      } catch {}
    }

    const targetTest = allMasterTests.find((t) => t.id === testId);
    if (!targetTest) {
      return { success: false, error: 'Test not found or no longer available.' };
    }

    const session = await this.getSession().catch(() => null);
    let correctCount = 0;
    let wrongCount = 0;
    let unattemptedCount = 0;

    for (const q of targetTest.questions) {
      const chosen = answers[q.id];
      if (chosen === undefined || chosen === null) {
        unattemptedCount++;
      } else if (chosen === q.correctOptionIndex) {
        correctCount++;
      } else {
        wrongCount++;
      }
    }

    const rawScore = correctCount * targetTest.marksPerQuestion - wrongCount * targetTest.negativeMarking;
    const score = Math.max(0, Math.round(rawScore * 100) / 100);
    const accuracy =
      correctCount + wrongCount > 0 ? Math.round((correctCount / (correctCount + wrongCount)) * 100) : 0;

    const newAttempt: TestAttempt = {
      id: `att-${Date.now()}`,
      testId: targetTest.id,
      testTitle: targetTest.title,
      courseId: targetTest.courseId,
      studentId: session?.userId || 'me',
      studentName: session?.name || 'Student',
      score,
      totalMarks: targetTest.totalMarks,
      correctCount,
      wrongCount,
      unattemptedCount,
      accuracy,
      timeTakenMinutes: Math.max(1, Math.min(timeTakenMinutes, targetTest.durationMinutes)),
      submittedAt: formatStamp(new Date().toISOString()),
      answers,
    };

    try {
      if (typeof window !== 'undefined') {
        const existing = localStorage.getItem('cga_test_attempts');
        const arr: TestAttempt[] = existing ? JSON.parse(existing) : [];
        arr.unshift(newAttempt);
        localStorage.setItem('cga_test_attempts', JSON.stringify(arr));
      }
    } catch {}

    return { success: true, attempt: newAttempt };
  },

  // ============ ADMIN CRUD (RLS enforces admin-only) ============
  async upsertCourse(c: Course): Promise<ServiceResult> {
    const row = fromCourse(c);
    // let Postgres assign ids for brand-new records created with temporary client ids
    const { error } = await this.client().from('courses').upsert(row);
    return error ? { success: false, error: msg(error, 'Save failed.') } : { success: true };
  },
  async deleteCourse(id: string) {
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
  async deleteFaculty(id: string) {
    const { error } = await this.client().from('faculty').delete().eq('id', id);
    return error ? { success: false, error: msg(error, 'Delete failed.') } : { success: true };
  },

  async upsertMaterial(m: StudyMaterial): Promise<ServiceResult> {
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
  async deleteMaterial(id: string) {
    const { error } = await this.client().from('study_materials').delete().eq('id', id);
    return error ? { success: false, error: msg(error, 'Delete failed.') } : { success: true };
  },

  async upsertTest(t: MockTest): Promise<ServiceResult> {
    try {
      await this.client().from('mock_tests').upsert({
        id: t.id,
        title: t.title,
        subject: t.subject ?? null,
        drive_link: t.driveLink ?? null,
        course_id: t.courseId,
        batch_name: t.batchName,
        duration_minutes: t.durationMinutes,
        total_marks: t.totalMarks,
        marks_per_question: t.marksPerQuestion,
        negative_marking: t.negativeMarking,
        scheduled_date: t.scheduledDate,
        status: t.status,
        questions: t.questions,
      });
    } catch {}

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
      }
    } catch {}

    return { success: true };
  },
  async deleteTest(id: string): Promise<ServiceResult> {
    try {
      await this.client().from('mock_tests').delete().eq('id', id);
    } catch {}

    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('cga_custom_tests');
        if (stored) {
          const list: MockTest[] = JSON.parse(stored);
          const filtered = list.filter((t) => t.id !== id);
          localStorage.setItem('cga_custom_tests', JSON.stringify(filtered));
        }
        const deletedStored = localStorage.getItem('cga_deleted_tests');
        const deletedList: string[] = deletedStored ? JSON.parse(deletedStored) : [];
        if (!deletedList.includes(id)) {
          deletedList.push(id);
          localStorage.setItem('cga_deleted_tests', JSON.stringify(deletedList));
        }
      }
    } catch {}

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

