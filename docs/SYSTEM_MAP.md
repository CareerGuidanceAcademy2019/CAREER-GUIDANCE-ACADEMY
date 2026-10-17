# Career Guidance Academy (C.G.A) — System Architecture Map

**Last Updated:** Phase 1 Pre-Deployment Hardening  
**Target Environment:** Next.js 16 App Router (React 19, TypeScript Strict, Tailwind CSS v4) + Supabase (Postgres, Auth, RLS, Storage) + Vercel Serverless

---

## 1. Page Routes (43 Routes)

### Public & Marketing Routes (14 Pages)
| Route | Access | Purpose / Content |
| :--- | :---: | :--- |
| `/` | Public | Homepage: Hero, Institute Statistics, Faculty Highlights, Quick Admission |
| `/about` | Public | About Us, Academy History, Mission, Vision, Why Choose C.G.A |
| `/courses` | Public | Classroom & Online Course Catalog, Filter by Stream / Exam |
| `/faculty` | Public | Official Faculty Directory (Avatars, Qualifications, Subjects) |
| `/achievements` | Public | Merit Rankers, Verified Examination Achievements |
| `/mock-tests` | Public | T-TET 2026 Test Series Overview, Sectional & Full Mocks, Enrollment CTA |
| `/how-to-pay` | Public | Step-by-Step Payment Instructions, UTR Guide (English & Bengali) |
| `/contact` | Public | Center Location, Phone, Email, Admission Enquiry Submission Form |
| `/privacy-policy` | Public | Data Protection & Privacy Notice (DPDP Act 2023 alignment) |
| `/terms-and-conditions` | Public | Student Enrollment & Portal Terms of Service |
| `/cookie-policy` | Public | Cookie Usage, LocalStorage disclosure, Consent Controls |
| `/refund-policy` | Public | Fee Refund, Admission Cancellation & Payment Dispute Policy |
| `/login` | Public | Unified Portal Sign-in (Student, Faculty, Administrator tabs) |
| `/register` | Public | Student Admission Registration Form |
| `/register/faculty` | Public | Faculty Account Application Form (Pending Approval) |
| `/register/admin` | Public / Allowlist | Administrator Provisioning (Guarded by Allowlist & DB Trigger) |
| `/forgot-password` | Public | Password Reset Request Form (Supabase Auth link) |
| `/reset-password` | Public | Password Update Form (Authenticated via Recovery Token) |

### Student Portal Routes (10 Pages)
*Gated by `src/proxy.ts` and `src/app/student/layout.tsx` (Student session required)*
| Route | Role | Purpose |
| :--- | :---: | :--- |
| `/student/dashboard` | Student | Enrolled Courses Overview, Recent Mock Scores, Fee Balances |
| `/student/courses` | Student | Course Catalog with Admission & 2-Part Instalment Payment |
| `/student/my-courses` | Student | Active Enrolled Batches, Syllabus Tracking, Study Materials |
| `/student/tests` | Student | CBT Mock Test Engine: Sectional & Full Mocks, Timed Window, Solutions |
| `/student/materials` | Student | Digital Notes & Book PDF Reader (Paid Notes & Enrolled Access) |
| `/student/payments` | Student | Payment History, UTR Submission, Receipt Download (`CGA-RCP-`) |
| `/student/fees` | Student | Fee Installment Ledger & Balance Clearance |
| `/student/profile` | Student | Student Profile, Guardian Info, Target Exam, Academic Qualification |
| `/student/faculty` | Student | Student View of Course Instructors |
| `/student/achievements`| Student | Student View of Top Rankers & Mentors |

### Faculty Portal Routes (2 Pages)
*Gated by `src/proxy.ts` and `src/app/faculty-portal/layout.tsx` (Faculty session required)*
| Route | Role | Purpose |
| :--- | :---: | :--- |
| `/faculty-portal` | Faculty | Faculty Dashboard: Assigned Batches, Test Performance, Profile Details |

### Administrator Portal Routes (14 Pages)
*Gated by `src/proxy.ts`, `src/app/admin/layout.tsx`, and Server verification (`requireAdmin`)*
| Route | Role | Purpose |
| :--- | :---: | :--- |
| `/admin/dashboard` | Admin | Realtime Operations KPI, Revenue Totals, Pending Verification Count |
| `/admin/payments` | Admin | Online Bank/UPI Payment Queue, UTR Check, Proof Preview, Atomic Approval |
| `/admin/counter-enrollment` | Admin | Physical Walk-in Admission Terminal, Cash Collection, Printable Receipt |
| `/admin/fees` | Admin | Fee Defaulter Tracker, Balance Dues, Installment Ledger |
| `/admin/payment-settings` | Admin | Institute UPI ID & Bank Credentials (Password-Reauthenticated) |
| `/admin/students` | Admin | Student 360° Management, Enrollment Drawer, Atomic Candidate Purge |
| `/admin/courses` | Admin | Course Batch Creation, Fee Configuration, Seat Limits, Schedules |
| `/admin/tests` | Admin | Mock Test Creator, Question Paper Ingestion (PDF / Text), Window Scheduler |
| `/admin/materials` | Admin | Study Material Management, PDF Uploads, Pricing |
| `/admin/faculty` | Admin | Faculty Approval Queue & Faculty Directory Editor |
| `/admin/access` | Admin | Administrative & Faculty Allowlist Manager (`access_allowlist`) |
| `/admin/announcements` | Admin | Academy Notice Board Broadcast Publisher |
| `/admin/achievements` | Admin | Merit Ranker & Achievement Showcase Editor |
| `/admin/site-content` | Admin | CMS Editor for Homepage Banners, Hero Text, Contact Info |

---

## 2. API Route Handlers (3 Routes)

| Endpoint | Method | Role | Implementation / Validation |
| :--- | :---: | :---: | :--- |
| `/api/admin/payments/export` | GET | Admin | Generates server-verified CSV reconciliation report of approved payments. Requires active admin session (`requireAdmin`). |
| `/api/admin/students` | DELETE | Admin | Atomic candidate purge endpoint (`delete_candidate_by_admin`). Requires admin authentication. |
| `/api/admin/parse-test` | POST | Admin | Ingests `.pdf`, `.txt`, `.csv` question papers via `pdf-parse` and extracts questions, options, and answers. |

---

## 3. Database Schema: PostgreSQL Tables (26 Tables)

All tables reside in the `public` schema on Supabase project `craicxwqaygdydtdaxtw` with Row Level Security (RLS) enabled:

1. **`profiles`**: User profiles with columns `id`, `role` (`student`, `faculty`, `admin`), `student_code`, `name`, `email`, `phone`, `status`.
2. **`faculty`**: Faculty member profiles (`id`, `name`, `designation`, `subject`, `qualification`, `experience`, `photo`, `bio`, `specialization_tags`, `approval_status`, `profile_id`).
3. **`courses`**: Course catalog (`id`, `name`, `category`, `sub_category`, `price`, `first_instalment`, `batch_size`, `seats_available`, `schedule`, `status`).
4. **`study_materials`**: Digital notes & book PDFs (`id`, `title`, `course_id`, `type`, `price`, `file_size`, `preview_sections`).
5. **`mock_tests`**: Sectional & full-length mock tests (`id`, `title`, `series_id`, `course_id`, `duration_minutes`, `total_marks`, `status`, `window_start`, `window_end`).
6. **`mock_questions`**: Questions and choices for mock tests in English and Bengali.
7. **`mock_question_keys`**: Correct answers and solutions (Strictly isolated from student queries).
8. **`mock_series`**: T-TET 2026 test series packages (`id`, `slug`, `name`, `price`, `class_range`, `status`).
9. **`mock_subjects`**: Subject breakdown for T-TET test series (`id`, `series_id`, `name`, `sort_order`).
10. **`mock_attempts`**: Student attempts on series tests with server-computed scores and ranks.
11. **`mock_launch_log`**: Audit trail of test window scheduling by administrators.
12. **`enrollments`**: Student course enrollments (`student_id`, `course_id`, `total_fee`, `paid_amount`, `due_amount`).
13. **`fee_payments`**: Official ledger of fee payments and receipts (`receipt_no`, `amount`, `payment_mode`, `payment_type`, `utr`).
14. **`payment_settings`**: Single-row configuration (`id = 1`) for institute UPI, SBI bank accounts, address, and refund terms.
15. **`payment_requests`**: Unified manual payment requests lifecycle (`awaiting_payment` -> `pending_review` -> `approved` | `rejected` | `expired` | `refund_due`).
16. **`payment_audit_log`**: Immutable, append-only security log with trigger blocking `UPDATE` and `DELETE`.
17. **`sample_utr_blocklist`**: Anti-fraud table blocking recognized sample/dummy UTR patterns.
18. **`material_access`**: Entitlement table granting access to standalone paid study materials.
19. **`series_enrollments`**: Entitlement table granting student access to T-TET mock test series.
20. **`test_attempts`**: Student attempts on course mock tests with answer maps and scores.
21. **`access_allowlist`**: Pre-authorized email and phone identifiers for faculty and admin account creation.
22. **`announcements`**: Broadcast announcements with priority and target batch tags.
23. **`achievements`**: Merit ranks and academic student achievements.
24. **`enquiries`**: Public admission enquiry contact submissions.
25. **`waiting_list`**: Overflow waiting list for fully booked course batches.
26. **`site_content`**: Dynamic CMS content record (`id = 1`) for homepage text and hero statistics.

---

## 4. Stored Procedures & Database RPCs

| RPC Function | Security | Intended Caller | Purpose |
| :--- | :---: | :---: | :--- |
| `create_payment_request` | SECURITY DEFINER | Student | Server-side amount derivation, 5 req/hr rate limit, collision-free reference codes |
| `submit_payment_proof` | SECURITY DEFINER | Student | 12-digit UTR validation, blocklist rejection, global UTR uniqueness check |
| `approve_payment` | SECURITY DEFINER | Admin | Row-locked (`FOR UPDATE`) atomic approval, seat decrement, receipt generation |
| `reject_payment` | SECURITY DEFINER | Admin | Payment rejection with mandatory explanation and student notification |
| `expire_stale_payment_requests` | SECURITY DEFINER | System / Admin | Auto-expires requests past 48 hours |
| `update_payment_settings_secure` | SECURITY DEFINER | Admin | Re-authenticates admin password before allowing changes to UPI or bank details |
| `delete_candidate_by_admin` | SECURITY DEFINER | Admin | Permanently cascades deletion across all 9 linked student tables |
| `purge_candidate` | SECURITY DEFINER | Admin | Alias to `delete_candidate_by_admin` |
| `resolve_login_email` | SECURITY DEFINER | Public / Anon | Allows 10-digit phone login by resolving email internally |
| `phone_available` | SECURITY DEFINER | Public / Anon | Checks phone number availability during registration |
| `is_admin` | SECURITY DEFINER | Auth Users | Verifies active admin role from profiles table |
| `is_faculty` | SECURITY DEFINER | Auth Users | Verifies active faculty role |
| `is_enrolled` | SECURITY DEFINER | Auth Users | Checks student course enrollment status |
| `is_series_enrolled` | SECURITY DEFINER | Auth Users | Checks student series enrollment status |
| `is_active_user` | SECURITY DEFINER | Auth Users | Confirms account is in 'Active' state |
| `get_peer_attempts` | SECURITY DEFINER | Student | Provides anonymized leaderboard ranks |
| `list_faculty_accounts` | SECURITY DEFINER | Admin | Admin view of faculty approval pipeline |
| `set_faculty_approval` | SECURITY DEFINER | Admin | Sets faculty account approval status |

---

## 5. Storage Buckets (Supabase Storage)

| Bucket Name | Access Level | Restrictions | Purpose |
| :--- | :---: | :--- | :--- |
| **`payment-proofs`** | **Private (RLS)** | Max 5 MB, allowed MIME types: `image/jpeg`, `image/png`, `image/webp`. Path pattern: `{student_id}/...`. | Stores uploaded student payment screenshots and bank receipts. Accessible only via short-lived signed URLs. |

---

## 6. Environment Variables

| Variable | Scope | Purpose |
| :--- | :---: | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | Public Supabase project API URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client & Server | Public Supabase anon / publishable key (guarded by RLS) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & Server | Fallback alias for publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Only | **Secret**: Bypasses RLS for administrative purge and maintenance |
| `SUPABASE_ACCESS_TOKEN` | CLI / Scripts | Personal access token for migrations and database deployments |

---

## 7. Third-Party Scripts & External Dependencies

1. **Google Fonts (`next/font/google`)**: Geist and Geist Mono font loaders.
2. **Lucide Icons (`lucide-react`)**: Clean vector UI icons across all components.
3. **PDF Parser (`pdf-parse`)**: Server-side extraction of mock test question papers.
4. **Supabase SSR (`@supabase/ssr`)**: Cookie-based authentication and session refresh.
