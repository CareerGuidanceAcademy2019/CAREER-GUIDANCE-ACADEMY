# Build & Execution Log: T-TET Mock Test Series Module

This file tracks progress across all phases with timestamps and validation results.

---

## [Phase 0: Inspection & Planning]
- Completed deep inspection of existing Next.js App Router codebase, migrations (0001, 0002, 0003), Supabase client/server setup, CBT engine, parser, and admin layout.
- Verified TypeScript compilation cleanly passes with zero errors.
- Documented execution plan in `docs/mock-test-plan.md` and initial design decisions in `docs/ASSUMPTIONS.md`.

---

## [Phase 1: Database Schema, RLS, Storage & Payment Settings Seed]
- Created `supabase/migrations/0006_unified_manual_payments.sql`:
  - `payment_settings` (id=1, single-row, admin-editable, seeded with authentic C.G.A bank details).
  - `sample_utr_blocklist` with dummy values (`123456789012`, `000000000000`, `111111111111`, etc.).
  - `payment_requests` table with item types (`course`, `material`, `mock_series`), payment plans (`full`, `instalment_1`, `instalment_2`, `balance`), status lifecycle, partial unique index for open requests, and normalized UTR uniqueness.
  - `payment_audit_log` with triggers blocking UPDATE and DELETE.
  - `material_access` for standalone notes/book access.
  - `series_enrollments` for T-TET mock test series purchases.
  - Postgres sequence `receipt_no_seq`.
  - Updated candidate purge routines `delete_candidate_by_admin` and `purge_candidate`.
  - RLS policies and `payment-proofs` private storage bucket configuration.
- Configured `.env.example` with empty placeholders; verified `.gitignore` excludes `.env*`.
- Created official institute QR code asset at `public/cga-upi-qr.jpg` extracted from user-provided Google Pay artifact.

## [Phase 2: Server-Side RPCs & Transactional Business Logic]
- Created `supabase/migrations/0007_payment_rpcs.sql`:
  - `cga_create_payment_request`: Server-side amount derivation from DB, 5 req/hour rate limiting, seat/duplicate checks, collision-resistant `CGA-XXXXXX` reference codes.
  - `cga_submit_payment_proof`: Format validation (12-digit UPI / 12-25 char bank transfer), space/dash stripping, sample UTR blocklist rejection, global uniqueness without exposing other users, verification of caller storage path.
  - `cga_approve_payment`: SECURITY DEFINER, admin-only atomic transaction (`FOR UPDATE`), seat check with `refund_due` fallback, enrollment/material/series access creation, sequence-based receipt creation, double-approval idempotency.
  - `cga_reject_payment`: Admin-only, required reason, audit logged.
  - `cga_expire_stale_requests`: Marks past-expiry requests as `expired`.
  - `cga_update_payment_settings_secure`: Admin password re-authentication before modifying sensitive financial columns.
- Created `supabase/tests_payments.sql` for automated DB-level checks.

## [Phase 3: Student Payment Flow]
- Created reusable `<PayManualModal />` in `src/components/payment/PayManualModal.tsx` covering all 3 purchasable item types.
- Wired `<PayManualModal />` into:
  - `/student/courses` (Course enrolment with Full / 2-Part Instalment choice).
  - `/student/materials` (Standalone "Buy Notes" button on locked materials).
  - `/mock-tests` (New dedicated landing page for T-TET mock series with Enrol button and login redirection).
  - `/student/fees` (Balance clearance for course instalments).
- Built `/student/payments/page.tsx` for students to track all requests, view status banners, inspect rejection reasons, resubmit corrected proof, and download official receipts.
- Updated student navigation in `src/app/student/layout.tsx`.

## [Phase 4: How-To-Pay Guide & Proof Form Experience]
- Created `src/content/howToPayContent.ts` with English & Bengali translations:
  - 5-step guide with icons and warnings.
  - "What is a UTR?" guide with per-app instructions (Google Pay, PhonePe, Paytm, Other bank apps) and warning that IDs starting with "T24..." are not UTRs.
  - Visual HTML/CSS mock payment-success screen with "EXAMPLE ONLY - not a real payment" ribbon.
  - Good vs Bad screenshot Do's and Don'ts.
  - FAQ accordion covering pending status, wrong amount, wrong UTR, auto-refunds, and DPDP Act compliance.
- Built `<HowToPayGuide />` in `src/components/payment/HowToPayGuide.tsx` supporting full-page and collapsible modal modes.
- Created `/how-to-pay` standalone page and linked it in `PublicFooter.tsx`.
- Proof form enhancements: numeric keypad, 12-digit live counter, client-side canvas compression, blur detection, and confirmation checkbox.

## [Phase 5: Admin Payments Queue & Gateway Controls]
- Built `/admin/payments/page.tsx` with:
  - Status tabs: Pending Review, Approved, Rejected, Refund Due, Expired, All.
  - Search by UTR, reference code, student name, and student code.
  - Duplicate-UTR and amount-mismatch red highlighting.
  - Signed screenshot URL modal viewer from private `payment-proofs` bucket.
  - Two-factor approve dialog requiring admin to re-enter exact amount received and tick "I verified this UTR in my bank/UPI statement".
  - Reject dialog requiring reason.
  - Read-only audit log viewer.
  - Pending-count badge in admin nav.
- Built `/admin/payment-settings/page.tsx` with high-risk financial field protection and admin password re-authentication modal.
- Created `/api/admin/payments/export/route.ts` generating server-side CSV reconciliation exports.
- Updated `ADMIN_NAV` in `src/app/admin/layout.tsx`.

## [Phase 6: Verification, Automated Testing & Documentation]
- Created automated test suite `tests/payments_suite.mjs` verifying:
  - Amount tamper prevention (server-derived amounts).
  - UTR normalization and format validation (11 vs 12 vs 13 digits, alphanumeric).
  - Sample UTR blocklist (`123456789012`, `000000000000`, `111111111111`).
  - Global UTR uniqueness privacy protection.
  - Idempotent double approval handling.
  - Last-seat race condition (`refund_due` & waiting list).
  - Upload file type & size constraints (JPG/PNG/WEBP, max 5MB).
  - Authentic C.G.A institute credentials in payment settings.
  - Bilingual How-to-pay guide content.
---

## [Pre-Deployment Pass — Phase 1: Reconnaissance & Baseline]
- **Date & Time:** 2026-10-17T12:55:00+05:30
- **System Mapping:**
  - Complete architecture map published to `docs/SYSTEM_MAP.md`.
  - Mapped 43 Page Routes (14 Public, 10 Student, 2 Faculty, 17 Admin), 3 API Route Handlers, 1 Next.js 16 Proxy Middleware, 26 PostgreSQL relational tables, 18 stored procedures / RPCs, and 1 private Supabase Storage bucket (`payment-proofs`).
- **Dependency Audit (`npm audit`):**
  - Identified vulnerabilities in Next.js 16.3.7 and nested packages (`braces`, `source-map-js`). Pinned for resolution.
- **Secret & Static Vulnerability Scan (`scripts/recon_baseline_scan.mjs`):**
  - Scanned repository for dangerous patterns (`dangerouslySetInnerHTML`, `eval`, `new Function`, string-built SQL, open redirects). Verified zero dangerous patterns in production application components.
  - Sanitized CLI scripts (`execute_master_setup.mjs`, `verify_live_database.mjs`) to strictly require `process.env.SUPABASE_ACCESS_TOKEN`, preventing secret retention in git.
  - Flagged mock passwords (`password123`) in seed files for elimination in Phase 2/3.
- **Verification:**
  - TypeScript strict compilation: 0 errors (`npx tsc --noEmit`).
  - Unit tests: 21/21 passing.

---

## [Pre-Deployment Pass — Phase 2: Security Hardening & IDOR Verification]
- **Date & Time:** 2026-10-17T13:30:00+05:30
- **Dependency & Vulnerability Hardening:**
  - Upgraded Next.js to `16.4.2` and `eslint-config-next` to `16.4.2`, resolving all 6 high-severity Next.js runtime vulnerabilities (SSG/ISR cache poisoning, SSRF, dynamicParams disclosure).
  - Pinned `overrides: { "braces": "^3.0.3" }` in `package.json`.
  - Installed `zod` for strict runtime schema validation.
- **HTTP Response Security Headers (`next.config.ts`):**
  - Configured strict `Content-Security-Policy` with restricted script, font, image, and frame origins; `object-src 'none'`; `frame-ancestors 'none'`.
  - Added `Strict-Transport-Security` (63072000s, includeSubDomains, preload).
  - Added `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.
  - Set `poweredByHeader: false` to eliminate `X-Powered-By: Next.js`.
- **Proxy & CSRF Hardening (`src/proxy.ts`):**
  - Enforced Origin header validation on all state-changing HTTP methods (`POST`, `PUT`, `DELETE`, `PATCH`).
  - Sanitized open redirects on `next` query parameter across `/login` and `/register`, whitelisting only internal relative paths (`/`).
- **Database Migrations & IDOR Protection (Supabase):**
  - Created and applied `supabase/migrations/0008_security_hardening.sql`:
    - Added trigger `trg_prevent_self_role_escalation` on `public.profiles` blocking non-administrators from elevating their role, status, or student code.
    - Restricted `public.profiles` update RLS policy to enforce that non-admins can never update the `role` column.
    - Converted `payment_settings` to authenticated-only read; anonymous users are strictly barred.
    - Revoked EXECUTE privileges on `purge_candidate`, `delete_candidate_by_admin`, and `rls_auto_enable` from `anon` and `public`.
  - Created and applied `supabase/migrations/0009_security_audit_log.sql`:
    - Created append-only immutable `security_audit_log` table with RLS restricting read to active admins.
    - Added `log_security_event` RPC with email masking (`a***t@gmail.com`) for privacy preservation.
- **Input Validation & Resource Bounds (API Handlers):**
  - Hardened `src/app/api/admin/students/route.ts` with strict Zod schema validation rejecting untrusted fields.
  - Hardened `src/app/api/admin/payments/export/route.ts` with date regex validation (`YYYY-MM-DD`) and capped exports to max 5000 rows.
  - Hardened `src/app/api/admin/parse-test/route.ts` with 10MB payload size limit and allowed file type enforcement (`.pdf`, `.txt`, `.csv`).
- **Custom Error & Status Pages:**
  - Built `src/app/not-found.tsx` (human 404 page, zero AI emojis, Lucide icons, helpful navigation).
  - Built `src/app/error.tsx` (production 500 error boundary; suppresses stack traces and raw SQL, displays reference digest).
  - Built `src/app/forbidden.tsx` (human 403 Forbidden page for unprivileged access attempts).
- **Credential Hygiene:**
  - Eliminated `DEMO_CREDENTIALS` and all plaintext `password123` instances from `src/data/initialSeedData.ts`.
  - Removed client-controlled `user_metadata.account_type` role fallback in `cgaService.ts`.
- **Automated Verification:**
  - `tests/admin_route_authorization.test.mjs`: PASSED 100% across all admin API endpoints.
  - `tests/security_idor_suite.mjs`: PASSED 18/18 live tests (Anonymous restrictions, IDOR reads/writes, privilege escalation attempt, RPC abuse prevention).
  - `npx tsc --noEmit`: PASSED with 0 errors.
  - `npm run lint`: PASSED with 0 errors.

---

## [Pre-Deployment Pass — Phase 3: Authentication and Data Protection]
- **Date & Time:** 2026-10-17T14:35:00+05:30
- **Password Policy & Entropy:**
  - Implemented `src/lib/passwordPolicy.ts` enforcing minimum 10 characters, rejection of common passwords (top 200 list), and entropy scoring.
  - Built `src/components/ui/PasswordStrengthMeter.tsx` with dynamic visual feedback.
  - Integrated into `/register` and `/reset-password` pages.
- **Bot Protection & Honeypot Fields:**
  - Implemented invisible honeypot anti-bot traps (`reg-hp`, `login-hp`, `enquiry-hp`) in student registration, login, and campus enquiry forms.
  - Neutralizes automated spam and credential-stuffing bots silently without disrupting legitimate users.
- **Non-Enumerating Authentication:**
  - Standardized forgot-password and login responses to uniform messages to prevent account and email enumeration.
  - Removed demo hardcoded phone numbers from login resolution in `cgaService.ts`.
- **Admin Session Security & Idle Inactivity Timeout:**
  - Added 15-minute idle inactivity timeout in `src/app/admin/layout.tsx` across mouse, keyboard, and touch events.
  - Documented complete MFA TOTP setup in `docs/MFA_SETUP.md`.
- **Data Minimization & PII Masking:**
  - Created `src/components/ui/MaskedData.tsx` masking phone numbers (`+91 94•••••89`) and emails (`a••••t@gmail.com`).
  - Integrated into `/admin/students`, `/admin/payments`, and `/admin/fees` tables.
  - Interactive click-to-reveal automatically records `pii_revealed_by_admin` audit events to `public.security_audit_log`.
- **DPDP Act 2023 Account Deletion Flow:**
  - Created and applied `supabase/migrations/0010_account_deletion_flow.sql` with table `account_deletion_requests` and RPCs `request_account_deletion` and `process_account_deletion`.
  - Tied deletion flow to `public.purge_candidate()` for permanent cascade erasure of student records.
  - Added minor guardian consent certification for school coaching candidates.
  - Built working Deletion Request UI modal in `/student/profile`.
- **Backup & Disaster Recovery:**
  - Documented physical and logical backup and restore procedures in `docs/BACKUP_PROCEDURE.md`.

---

## [Pre-Deployment Pass — Phase 4: Abuse Protection and Rate Limiting]
- **Date & Time:** 2026-10-17T14:55:00+05:30
- **Database-Backed Atomic Sliding Window Engine:**
  - Applied `supabase/migrations/0011_rate_limiting.sql` creating `rate_limit_entries` and `check_rate_limit` RPC with row-level locks (`FOR UPDATE`).
  - Added periodic automatic prune routine `prune_expired_rate_limits()`.
  - Built-in audit trail writing `rate_limit_exceeded` events directly to `security_audit_log`.
- **Unified TypeScript Provider (`src/lib/rateLimit.ts`):**
  - Flexible provider interface supporting Supabase database engine with optional Upstash Redis pipeline if configured.
  - Generates RFC 6585 compliant HTTP 429 responses with `Retry-After`, `X-RateLimit-Limit`, and reset timestamps.
- **Enforced Rate Limit Rules:**
  - **General API:** 120 req/min per IP enforced globally via `src/proxy.ts`.
  - **Admin Actions:** 60 req/min per admin/IP on `/api/admin/students` and `/api/admin/parse-test`.
  - **Admin Reconciliation Exports:** 10 req/min on `/api/admin/payments/export`.
  - **Admissions Enquiries:** 5 per hour per phone/IP in `cgaService.submitEnquiry`.
  - **Mock Test Operations:** 10 starts/min, 60 saves/min (debounced), 5 submits/min in `cgaService`.
- **WAF & Firewall Deployment Recommendations:**
  - Documented Cloudflare WAF, OWASP Core Rulesets, Turnstile bot protection, and TLS 1.3 settings in `docs/DEPLOY_CHECKLIST.md`.
- **Automated Verification:**
  - `tests/rate_limit_suite.mjs`: PASSED 5/5 tests (normal decrement, 5-attempt threshold lockout, login lockout, enquiry throttling, mock submit rate limiting).
  - `npx tsc --noEmit`: PASSED with 0 errors.
  - `npm run lint`: PASSED with 0 errors.

---

## [Pre-Deployment Pass — Phase 5: Content Cleanup & Tone Standardization]
- **Date & Time:** 2026-10-17T15:25:00+05:30
- **Emoji Elimination (100% Zero-Emoji Compliance):**
  - Scanned all 180+ codebase files across `src/`, `scripts/`, `docs/`, and seed data using regex unicode character ranges `[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]`.
  - Removed all 31 emoji instances from UI components, page titles, payment guides, student dashboards, receipt modals, and script outputs.
  - Replaced all visual cues with clean, accessible SVG Lucide icons (`CheckCircle2`, `Printer`, `BookOpen`, `AlertCircle`, `MapPin`, `Phone`, `Mail`, `FileText`, `Sparkles`).
  - Confirmed 0 emojis remaining across the entire repository.
- **Copy Humanization & Anti-Hype Tone:**
  - Audited all user-facing copy against promotional buzzwords ("revolutionary", "cutting-edge", "seamless", "unlock your potential", "empower", "elevate", "journey", "transform", "lorem ipsum"). Confirmed 0 promotional hype terms.
  - Standardized institute identity to authentic Tripura institution facts:
    - Address: "Chanban (Behind Youthclub), Udaipur, Gomati Tripura. (PIN: 799114)"
    - Primary Helpline: `+91-7005929189`
    - Institute Email: `careerguidanceacademy2019@gmail.com`
  - Created `docs/CONTENT_TO_CONFIRM.md` logging:
    - Audited institutional facts (UPI ID, bank account, address, phones).
    - Unverified promotional claims flagged for administrator review (historical TET selections count, student population size, board distinction percentages).
    - Student testimonials flagged for DPDP Act 2023 parental consent confirmation.
    - Native Bengali language strings flagged for native speaker sign-off.
- **Verification:**
  - `npx tsc --noEmit`: PASSED with 0 errors.
  - `npm run lint`: PASSED with 0 errors.

---

## [Pre-Deployment Pass — Phase 6: Full Functional & Link Verification]
- **Date & Time:** 2026-10-17T17:10:00+05:30
- **Automated Headless Crawler & Page Audit:**
  - Built and executed `scripts/run_qa_verification.mjs` using Playwright Chromium and Axe-Core across all 16 public and utility routes.
  - Resolved Google Maps iframe CSP restriction in `next.config.ts` by adding `https://www.google.com` and `https://maps.google.com` to `frame-src`.
  - Added explicit `name="enquiry-hp"` to honeypot field in `src/app/contact/page.tsx`.
  - Confirmed 0 console errors, 0 failed network requests, 0 broken images, and 0 placeholder `#` links.
- **Role Isolation & Unauthorized Access Verification:**
  - Verified 8 protected student routes (`/student/dashboard`, `/student/courses`, `/student/materials`, `/student/tests`, `/student/payments`, etc.) redirect unauthenticated anonymous requests to `/login`.
  - Verified 9 protected administrator routes (`/admin/dashboard`, `/admin/students`, `/admin/payments`, `/admin/payment-settings`, `/admin/access`, etc.) block unauthenticated requests.
- **Responsive Viewport Testing:**
  - Verified mobile layout at 360x640px and tablet layout at 768x1024px with zero horizontal scroll overflow (`scrollWidth == clientWidth`).
- **Interactive Modules & SEO:**
  - Verified bilingual toggle on `/how-to-pay` renders authentic Bengali instructions.
  - Verified `robots.txt` blocks `/admin/`, `/student/`, `/faculty-portal/`, and `/api/` while declaring the sitemap URL.
  - Verified `sitemap.xml` provides valid XML indexing 14 public canonical URLs.
  - Generated full QA report at `docs/QA_REPORT.md` and captured 18 screenshots in `docs/screenshots/`.
- **Verification:**
  - `npx tsc --noEmit`: PASSED with 0 errors.
  - `npm run lint`: PASSED with 0 errors.
  - Playwright QA suite: PASSED 100%.

---

## [Pre-Deployment Pass — Phase 7: Performance and Load Testing]
- **Date & Time:** 2026-10-17T17:28:00+05:30
- **Lighthouse & Core Web Vitals Benchmark:**
  - Audited key pages (`/`, `/courses`, `/mock-tests`, `/how-to-pay`).
  - Results: Performance 98/100, Accessibility 95/100, Best Practices 96/100, SEO 100/100.
  - FCP recorded at 104ms – 160ms; DOM Content Loaded within 31ms – 51ms.
- **High-Concurrency Load Testing (Autocannon):**
  - Executed 5 realistic stress scenarios against local production build (`http://localhost:3005`):
    - **Scenario (a):** 300 concurrent visitors on public pages. Throughput reached 962–1,151 req/sec.
    - **Scenario (b):** 200 concurrent students accessing `/login`. Throughput reached 1,506 req/sec (p50: 126ms, p99: 411ms, 0 errors).
    - **Scenario (c):** 200 concurrent mock test CBT attempts. Throughput reached 1,135 req/sec (p50: 168ms, p99: 276ms, 0 errors).
    - **Scenario (d):** 50 concurrent payment flow visits. Throughput reached 1,024 req/sec (p50: 46ms, p99: 83ms, 0 errors).
    - **Scenario (e):** 20 concurrent admin exports. Memory remained stable under 140MB with bounded row streaming.
- **Bottleneck Remediation:**
  - Identified redundant remote Supabase auth network calls on static public pages in `src/proxy.ts`.
  - Refactored proxy middleware to bypass remote auth checks for anonymous public requests without auth cookies, increasing throughput and eliminating pool exhaustion.
- **Database Index Optimization:**
  - Created and applied `supabase/migrations/0012_performance_indexes.sql` creating 12 performance indexes across `payment_requests`, `mock_attempts`, `mock_questions`, `series_enrollments`, `enrollments`, and `rate_limit_entries`.
- **Concurrency Invariant Verifications:**
  - Verified last-seat enrolment race condition: exactly 3 seats allocated, 17 marked `refund_due`, 0 over-subscription.
  - Verified one-attempt-per-test invariant: exactly 1 attempt recorded, 9 concurrent duplicate requests blocked.
- **Published Report:**
  - Published comprehensive results and Supabase free-plan operational advice in `docs/PERFORMANCE_REPORT.md`.
- **Verification:**
  - `npx tsc --noEmit`: PASSED with 0 errors.
  - `npm run lint`: PASSED with 0 errors.
  - Load test suite: PASSED 100%.

---

## [Pre-Deployment Pass — Phase 8: Security Testing & Re-Verification]
- **Date & Time:** 2026-10-17T17:32:00+05:30
- **Automated Security Abuse Suite (`tests/security_abuse_suite.mjs`):**
  - Executed 27 automated security controls across:
    - HTTP response headers (strict CSP, HSTS 63072000s, nosniff, DENY, strict-origin, permissions-policy, no X-Powered-By).
    - Client bundle audit: verified `SUPABASE_SERVICE_ROLE_KEY` is 0% present in `.next/static/` and public source maps are disabled.
    - SQL injection attack strings: verified parameterized database immunity and safe error boundaries.
    - Path traversal strings (`../../etc/passwd`): verified 100% blocked with HTTP 403 on upload endpoints.
    - Malicious MIME types & oversized payloads: blocked executables (.exe) and files >10MB.
    - Forged JWTs and tampered cookies: blocked and redirected (HTTP 307).
    - Direct RPC privilege escalation: verified anonymous calls to `purge_candidate`, `cga_approve_payment`, and financial update functions are rejected by PostgreSQL permissions.
    - Account enumeration immunity: verified uniform responses on password recovery.
    - Static code audit: verified zero instances of `eval()` or `dangerouslySetInnerHTML` in `src/`.
- **Dependency Audit:**
  - Pinned `uuid: "^11.1.1"` in `overrides` resolving moderate vulnerability. Verified `braces@3.0.3` is installed.
- **Verification:**
  - `tests/security_abuse_suite.mjs`: PASSED 27/27 (100%).
  - `npx tsc --noEmit`: PASSED with 0 errors.
  - `npm run lint`: PASSED with 0 errors.

---

## [Pre-Deployment Pass — Phase 9: Reports & Deployment Checklist]
- **Date & Time:** 2026-10-17T17:35:00+05:30
- **Published Artifacts & Reports:**
  1. `docs/SECURITY_REPORT.md`: Comprehensive breakdown of all findings by severity, remediation steps, abuse testing results, and client bundle scans.
  2. `docs/QA_REPORT.md`: Full Playwright crawler and verification matrix across 16 public routes, 17 protected routes, responsive viewports, and form validations.
  3. `docs/PERFORMANCE_REPORT.md`: Autocannon load testing benchmarks across 5 scenarios, before/after latency gains, database indexes, and Supabase free-plan operational advice.
  4. `docs/CONTENT_TO_CONFIRM.md`: Audited institute identity facts, unverified marketing claims flagged for admin review, student testimonials, and Bengali translation confirmations.
  5. `docs/DEPLOY_CHECKLIST.md`: Step-by-step production runbook covering hosting dashboard env vars, key rotation, Supabase dashboard settings (custom SMTP, email confirmation, CAPTCHA, MFA, backups), 2FA enforcement, DNS/HTTPS, post-deploy smoke test, and rollback procedures.
- **Final Definition of Done Verification:**
  - `npx tsc --noEmit`: PASSED with 0 errors.
  - `npm run lint`: PASSED with 0 errors.
  - All automated test suites (Payments, Counter Enrollments, Admin Authorization, Rate Limiting, Security IDOR, Security Abuse): PASSED 100%.
  - Zero emojis in codebase and UI.
  - All 5 required report files created and updated.

---

## [Phase 10: Authenticated Student Hardening, Enrollment Duration Control & Admin Verification Workflow]
- **Date & Time:** 2026-10-17T18:30:00+05:30
- **1. Demo Student & Payment Purge:**
  - Removed all mock demo students (`stu-1` to `stu-5`) and demo payments (`pay-1` to `pay-7`) from `src/data/initialSeedData.ts`.
  - Updated `cgaService.getData()` and student directory loaders to exclusively display real authenticated student records from PostgreSQL.
  - Retained candidate filtering strictly enforcing presence of verified email, 10-digit mobile, and complete mandatory registration profiles.
- **2. Mandatory Candidate Registration Information Enforcement:**
  - Updated database trigger `handle_new_user()` in `supabase/migrations/0013_enrollment_duration_and_admin_approval.sql` to require `name` (>=3 chars), `phone` (10-digit), `guardian_name` (>=3 chars), `address` (>=5 chars), `qualification`, and `target_exam`.
  - Hardened registration forms in `src/app/register/page.tsx` and admin student directory forms in `src/app/admin/students/page.tsx` with HTML5 `required` constraints, regex phone checks, and custom error toasts.
- **3. Course & Mock Test Access Duration Control:**
  - Added `access_valid_until timestamptz not null default (now() + interval '6 months')` to `public.enrollments` and `public.series_enrollments`.
  - Hardened Postgres RLS functions `is_enrolled(p_course_id)` and `is_series_enrolled(p_series_id)` to check `access_valid_until > now()`.
  - Created admin management RPCs: `cga_update_batch_duration`, `cga_extend_batch_duration_months`, `cga_update_student_enrollment_duration`, and `cga_update_series_enrollment_duration`.
  - Added Batch Access Duration controls in `src/app/admin/courses/page.tsx` with +1M, +3M, +6M, +1Y extensions and custom date picker.
  - Added Individual Student Validity controls in `src/app/admin/students/page.tsx`.
  - Enforced portal-side access gating:
    - `/student/my-courses`: Shows active/expired badge; locks class materials and mock tests with expired renewal notice when batch validity ends.
    - `/student/materials`: Locks study PDFs for expired batch enrollments with admin contact CTA.
    - `/student/tests`: Disables "Start Timed Mock Test" and marks tests locked for students whose batch validity has expired.
- **4. New Admin Registration & Approval Queue:**
  - Added self-service administrator application at `/register/admin`. Accounts are created with `role = 'admin'` and `status = 'Pending'`.
  - Pending administrators are blocked from sign-in (`public.is_admin()` requires `status = 'Active'`).
  - Built Pending Administrator Verification Queue in `src/app/admin/access/page.tsx` with real-time approval/rejection RPCs (`cga_approve_admin`, `cga_reject_admin`).
- **Verification:**
  - `npx tsc --noEmit`: PASSED with 0 errors.
  - `npm run lint`: PASSED with 0 errors on modified files.
  - Automated security abuse suite: PASSED 27/27 (100%).
  - Automated payments test suite: PASSED 12/12 (100%).





