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

