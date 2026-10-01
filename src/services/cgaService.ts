import {
  CgaDatabase,
  INITIAL_SEED_DATA,
  DEMO_CREDENTIALS,
  Course,
  FacultyMember,
  Achievement,
  StudyMaterial,
  MockTest,
  TestAttempt,
  FeePayment,
  StudentProfile,
  Announcement,
  SiteContent,
  EnquiryItem,
} from '@/data/initialSeedData';

const DB_STORAGE_KEY = 'cga_udaipur_phase1_db_v1';
const AUTH_STORAGE_KEY = 'cga_udaipur_phase1_auth_v1';

export interface AuthSession {
  role: 'STUDENT' | 'ADMIN';
  userId: string;
  name: string;
  email: string;
}

export const cgaService = {
  // ==================== DATABASE INITIALIZATION & PERSISTENCE ====================
  getDatabase(): CgaDatabase {
    if (typeof window === 'undefined') {
      return INITIAL_SEED_DATA;
    }
    try {
      const raw = window.localStorage.getItem(DB_STORAGE_KEY);
      if (!raw) {
        window.localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(INITIAL_SEED_DATA));
        return INITIAL_SEED_DATA;
      }
      return JSON.parse(raw) as CgaDatabase;
    } catch {
      return INITIAL_SEED_DATA;
    }
  },

  saveDatabase(db: CgaDatabase): CgaDatabase {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
    }
    return db;
  },

  resetDatabase(): CgaDatabase {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(INITIAL_SEED_DATA));
    }
    return INITIAL_SEED_DATA;
  },

  // ==================== AUTHENTICATION SERVICE ====================
  getSession(): AuthSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthSession) : null;
    } catch {
      return null;
    }
  },

  login(email: string, password: string): { success: boolean; session?: AuthSession; error?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const db = this.getDatabase();

    // Check Admin Credentials
    if (
      cleanEmail === DEMO_CREDENTIALS.admin.email.toLowerCase() &&
      password === DEMO_CREDENTIALS.admin.password
    ) {
      const session: AuthSession = {
        role: 'ADMIN',
        userId: 'admin-1',
        name: DEMO_CREDENTIALS.admin.name,
        email: DEMO_CREDENTIALS.admin.email,
      };
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      }
      return { success: true, session };
    }

    // Check Student Credentials from DB
    const student = db.students.find(
      (s) => s.email.toLowerCase() === cleanEmail && s.password === password
    );

    if (student) {
      if (student.status === 'Inactive') {
        return {
          success: false,
          error: 'Your student account has been deactivated by the Administrator. Please contact the C.G.A office.',
        };
      }
      const session: AuthSession = {
        role: 'STUDENT',
        userId: student.id,
        name: student.name,
        email: student.email,
      };
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      }
      return { success: true, session };
    }

    return {
      success: false,
      error: 'Invalid email or password. Please check your credentials or use the Demo Login buttons below.',
    };
  },

  registerStudent(payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
    guardianName: string;
    address: string;
    qualification: string;
    targetExam: string;
  }): { success: boolean; session?: AuthSession; db?: CgaDatabase; error?: string } {
    const db = this.getDatabase();
    const exists = db.students.some((s) => s.email.toLowerCase() === payload.email.trim().toLowerCase());
    if (exists) {
      return { success: false, error: 'An account with this email address already exists.' };
    }

    const nextNum = db.students.length + 1;
    const newStudent: StudentProfile = {
      id: `stu-${Date.now()}`,
      studentCode: `CGA-2026-00${nextNum}`,
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone.trim(),
      password: payload.password,
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      guardianName: payload.guardianName.trim() || 'Guardian',
      address: payload.address.trim() || 'Udaipur, Gomati Tripura 799114',
      qualification: payload.qualification.trim() || 'Graduate / Board Student',
      targetExam: payload.targetExam.trim() || 'TET / Competitive Exams',
      joinedDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      enrollments: [],
    };

    const updatedDb: CgaDatabase = {
      ...db,
      students: [newStudent, ...db.students],
    };
    this.saveDatabase(updatedDb);

    const session: AuthSession = {
      role: 'STUDENT',
      userId: newStudent.id,
      name: newStudent.name,
      email: newStudent.email,
    };
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    }

    return { success: true, session, db: updatedDb };
  },

  resetPassword(email: string, newPassword: string): { success: boolean; error?: string } {
    const db = this.getDatabase();
    const idx = db.students.findIndex((s) => s.email.toLowerCase() === email.trim().toLowerCase());
    if (idx === -1 && email.trim().toLowerCase() !== DEMO_CREDENTIALS.admin.email.toLowerCase()) {
      return { success: false, error: 'No registered student found with that email address.' };
    }
    if (idx !== -1) {
      db.students[idx].password = newPassword;
      this.saveDatabase(db);
    }
    return { success: true };
  },

  logout(): void {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  },
};
