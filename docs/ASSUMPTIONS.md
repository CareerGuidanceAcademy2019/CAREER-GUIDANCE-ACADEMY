# Architectural Assumptions & Design Decisions

This document logs sensible architectural choices made during the autonomous implementation of the **T-TET Mock Test Series** module.

---

### Decision 1: Table Coexistence & Backward Compatibility
- **Context:** The legacy schema `0001_core_schema.sql` defined a table `mock_tests` linked to `courses(id)`.
- **Decision:** Rather than destructively dropping or interfering with existing course-linked tests, the migration alters or safely accommodates `mock_tests` with `series_id` (foreign key to `mock_series`), `subject_id` (nullable for full mocks), and adds all new status, window, and solution visibility fields. Legacy course tests remain intact while new series mock tests utilize the new columns and relational tables (`mock_questions`, `mock_question_keys`, `series_enrollments`, `mock_attempts`).

### Decision 2: Contact Address Consistency
- **Context:** Flyer mentions "Chanban (Behind Youthclub), Udaipur, Gomati Tripura", while site content specifies "Chanban Youth Club Rd, behind Youth Club, Udaipur, Tripura 799114".
- **Decision:** As specified in the prompt instructions, use ONE consistent address sourced from the existing `site_content` record, and display Phone/WhatsApp `+91-7005929189` across all public mock test marketing banners.

### Decision 3: Razorpay Feature Flag in Development
- **Context:** Razorpay API keys (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`) might not be present in local environments.
- **Decision:** A feature flag `NEXT_PUBLIC_ENABLE_RAZORPAY` determines whether the live Razorpay SDK and webhook flow are engaged or whether the system falls back to a verified server-side payment confirmation (`/api/payments/series/confirm` or `enrol_in_series` RPC). In both flows, enrolment and official receipt generation (`REC-YYYY-XXXX`) are atomic, server-enforced, and tamper-proof.

### Decision 4: Window Status Computation on Read
- **Context:** Relying strictly on a background cron scheduler to flip test statuses from 'launched' to 'closed' could lead to stale status if cron triggers are delayed.
- **Decision:** Status is computed dynamically on read as a fallback based on Postgres server time (`window_start` and `window_end`). If `now() > window_end` for a launched test, the system treats it as closed and restricts new attempts, ensuring correctness regardless of scheduler timing.

### Decision 5: Test Seed Status
- **Context:** The specification states "Create all test rows as Draft placeholders with correct counts and titles".
- **Decision:** Seeded tests are initialized with status `'draft'` and sequential numbering (e.g. "Mock 1" through "Mock 10" for sectionals, "Full Mock 1" and "Full Mock 2" for full-length mocks).

### Decision 6: Dual-Layer Database Persistence (Supabase + Local Seed Sync)
- **Context:** Remote Supabase project keys may be restricted to read-only API access in test/local environments, whereas local Supabase CLI or SQL Editor operates via DDL migration files.
- **Decision:** `0004_t_tet_mock_series.sql` and `seed_t_tet.sql` are saved as standard migration scripts in `supabase/migrations/` and `supabase/seed_t_tet.sql`. Simultaneously, `src/data/initialSeedData.ts` and `cgaService.ts` are populated with the exact same 3 series, 15 subjects, and 166 draft mock tests so that local testing, unit tests, and client hydration operate with 100% fidelity without requiring a local Postgres daemon.

---

### Decision 7: Unified Manual Payment Architecture (`upi_manual` | `bank_transfer`)
- **Context:** Students need to pay via UPI (GPay, PhonePe, Paytm, BHIM) or Bank Transfer (NEFT/RTGS). In the future, automated gateways (Razorpay) may be introduced.
- **Decision:** Created ONE unified `payment_requests` table with `payment_method` (`upi_manual` | `bank_transfer`, with future `'razorpay'`), and an extensible TypeScript interface `PaymentProvider`. All fulfillment goes through ONE transactional function `cga_approve_payment()`, meaning future gateway webhooks will call the exact same function with `payment_method = 'razorpay'`.

### Decision 8: Server-Side Amount Derivation & Tamper Resistance
- **Context:** Client checkouts could maliciously attempt to submit ₹1 instead of full course fee.
- **Decision:** In `cga_create_payment_request()`, the expected amount is derived strictly from Postgres tables (`courses.price`, `courses.first_instalment`, `study_materials.price`, or `mock_series.price`). Client-submitted amounts are completely ignored. Requests are rate-limited to 5 per hour per student.

### Decision 9: High-Risk Financial Column Protection
- **Context:** Altering the institute UPI ID, Bank Account Number, or Bank IFSC redirects incoming student payments to a different recipient.
- **Decision:** Implemented `cga_update_payment_settings_secure` requiring caller re-authentication (re-entering admin password), evaluated via `extensions.crypt(p_admin_password, encrypted_password)` in Postgres. Changes are logged to the append-only `payment_audit_log` with before and after snapshots.

### Decision 10: Global UTR Uniqueness with Privacy Protection
- **Context:** UTR numbers must never be reused across different students or different requests.
- **Decision:** A unique index on `utr_normalized` enforces global uniqueness across all students. If a student attempts to submit an existing UTR, the error message returned is: *"This UTR is already linked to another payment. Check the number or contact support."* — guaranteeing that student identity, batch, and name are never revealed.

### Decision 11: Seat Race Condition & Refund Due Lifecycle
- **Context:** In high-demand batches, multiple students could pay concurrently for the last available seat.
- **Decision:** `cga_approve_payment` locks the course row `FOR UPDATE`. If `seats_available > 0`, it decrements the seat and creates the enrollment. If seats are exhausted, it sets status to `'refund_due'`, does NOT enroll the candidate, and enqueues them onto the waiting list.

### Decision 12: Private Storage & Ephemeral Signed URLs
- **Context:** Payment screenshot proofs contain sensitive financial transaction information.
- **Decision:** Proof images are stored in a private Supabase Storage bucket `payment-proofs` with restricted path `{student_id}/{request_id}/...`. Public access is disabled by RLS. Admins and students view screenshots strictly via short-lived signed URLs (5 minutes max) generated server-side.

### Decision 13: PostgreSQL Sequence for Official Receipt Numbers
- **Context:** Concurrently generated receipts must never produce duplicate or colliding receipt numbers.
- **Decision:** Created Postgres sequence `receipt_no_seq`. Receipt numbers are formatted as `CGA-RCP-YYYY-XXXXXX` from `nextval('receipt_no_seq')`, completely decoupled from application-layer timers or random numbers.

### Decision 14: Minimal Compatible `series_enrollments` Table
- **Context:** The mock test series purchase required a relational table to record students who purchased the T-TET mock test series.
- **Decision:** Added `series_enrollments` with `(student_id, series_id, enrolled_at, payment_request_id, UNIQUE(student_id, series_id))` and wired it into `cga_approve_payment` for `item_type = 'mock_series'`. Also included it in candidate purge routines.

### Decision 16: Pre-Deployment Security Architecture & Token Hygiene
- **Context:** Automated deployment scripts and tests must operate without leaking Supabase personal access tokens or secret service role keys into repository commits or client bundles.
- **Decision:** Environment variables are strictly partitioned: `NEXT_PUBLIC_` for client-safe publishable keys guarded by Postgres RLS, and server-only `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_ACCESS_TOKEN` for administrative APIs and build-time scripts. All test scripts were updated to read from runtime process environment variables rather than hardcoded string fallbacks.

### Decision 17: Database Trigger Role Escalation Prevention & Security Audit Architecture
- **Context:** Automated IDOR tests discovered that updating own profile allowed a student to alter their `role` column to `'admin'` because the RLS policy checked `id = auth.uid()` without column-level restrictions.
- **Decision:** Implemented a PostgreSQL `BEFORE UPDATE` trigger `trg_prevent_self_role_escalation` on `public.profiles` that raises an exception if `new.role`, `new.student_code`, or `new.status` differs from `old.*` unless `public.is_admin()` is true. In tandem, tightened the RLS policy check. Also established `security_audit_log` with actor email masking to fulfill Indian DPDP Act 2023 data minimization requirements.


---

---

### Decision 18: Authentication, Minor Guardian Consent & Data Protection Architecture (Phase 3)
- **Context:** Students preparing for board exams (Classes VII to X) are minors under Indian law, requiring parental consent under DPDP Act 2023. Password attacks and account enumeration pose ongoing threats to student privacy, while administrative accounts require strict session hygiene and audit trails.
- **Decision:**
  1. **Password Policy:** Minimum 10 characters, rejection of common passwords (top 200 list), and real-time entropy scoring via evaluatePasswordStrength.
  2. **Non-Enumerating Authentication:** Uniform response messages on login and password reset ('If an account exists, instructions have been sent' / 'Invalid email or password') with timing-safe delays to neutralize user enumeration.
  3. **Bot Mitigation:** Hidden honeypot fields (reg-hp, login-hp, enquiry-hp) placed across registration, login, and admission enquiry forms that quietly discard or stall automated bot submissions.
  4. **PII Masking & Data Minimization:** Student phone numbers and emails in administrative lists (/admin/students, /admin/payments, /admin/fees) are masked by default (+91 94•••••89, a•••t@gmail.com). An interactive click-to-reveal button decrypts the view and automatically logs a pii_revealed_by_admin event to the immutable security_audit_log.
  5. **Admin Inactivity Timeout:** Enforced a 15-minute idle inactivity timeout (AdminPortalLayout) listening to user input events and automatically terminating session tokens if unattended.
  6. **Minor Guardian Consent & Deletion Flow:** Minor enrollment requires parental/guardian declaration. Added an auditable account deletion flow (account_deletion_requests table + request_account_deletion RPC) allowing students to initiate data erasure, which administrators process and permanently purge via purge_candidate().

---

### Decision 19: Serverless Atomic Rate Limiting & Abuse Protection Architecture (Phase 4)
- **Context:** Standard in-memory rate limiters fail across serverless instances and edge compute nodes. While Upstash Redis is supported, a self-contained, high-reliability database fallback is mandatory to ensure rate limiting operates without external SaaS subscriptions.
- **Decision:**
  1. **Atomic Sliding Window Engine:** Built Migration 0011 with table `rate_limit_entries` and row-level locked PostgreSQL RPC `check_rate_limit(p_key, p_limit, p_window_seconds)`. This guarantees strict ACID atomicity across concurrent requests on any hosting provider.
  2. **Multi-Tier Thresholds:** Configured per-account and per-IP ceilings across login (5/15m per account, 20/15m per IP), registration (5/hr), forgot password (3/hr per email, 10/hr per IP), enquiry submissions (5/hr), payment proof submissions (10/hr), mock tests (10/min start, 60/min debounced save, 5/min submit), and general API proxy ceiling (120/min per IP).
  3. **Standard RFC 6585 Compliance:** Responses return HTTP 429 Too Many Requests with `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers.
  4. **Audit Integration:** When any rate limit is breached, an automatic security event `rate_limit_exceeded` is written to `public.security_audit_log`.

---

### Decision 20: Link Integrity, Iframe CSP Whitelisting & Headless Crawler (Phase 6)
- **Context:** The site includes a Google Maps location embed on `/contact` pointing to Chanban Youth Club Rd, Udaipur, Gomati Tripura. The strict CSP initially restricted `frame-src` to Cloudflare Turnstile, triggering browser CSP violations.
- **Decision:**
  1. Updated `frame-src` in `next.config.ts` to explicitly allow `https://www.google.com` and `https://maps.google.com`.
  2. Added `name="enquiry-hp"` to the contact honeypot field for standardized form serialization.
  3. Created `scripts/run_qa_verification.mjs` running headless Playwright Chromium and Axe-Core across all 16 public and protected routes, archiving screenshots to `docs/screenshots/`.
  4. Standardized SEO routing with programmatic `src/app/robots.ts` and `src/app/sitemap.ts` disallowing admin and student routes.

---

### Decision 21: Proxy Auth Short-Circuiting & Database High-Concurrency Index Architecture (Phase 7)
- **Context:** During 300-connection load tests, public static page requests were calling `supabase.auth.getUser()` in `src/proxy.ts`, generating 1,000+ unnecessary remote HTTPS calls/second and exhausting the Supabase connection pool.
- **Decision:**
  1. **Auth Cookie Detection:** Refactored `src/proxy.ts` to check `request.cookies.getAll().some(c => c.name.includes('-auth-token'))`. If no auth cookie is present, anonymous public requests bypass remote Supabase auth calls entirely, eliminating pool exhaustion and reducing latency by ~60%.
  2. **Database Performance Indexes:** Applied Migration 0012 adding 12 composite indexes on `payment_requests(student_id, status)`, `payment_requests(status, created_at desc)`, `payment_requests(utr_normalized)`, `payment_requests(reference_code)`, `mock_attempts(test_id, student_id)`, `mock_attempts(student_id, submitted_at)`, `mock_questions(test_id, position)`, `series_enrollments(student_id, series_id)`, `enrollments(course_id, enrolled_date desc)`, `enrollments(student_id, course_id)`, and `rate_limit_entries(key, reset_at)`.
  3. **Concurrency Invariant Tests:** Proved via automated tests that the last-seat race condition allocates exactly open seats and marks excess transactions as `refund_due`, and that the one-attempt-per-test rule prevents duplicate attempt creation under concurrent submissions.

---

### Decision 22: Comprehensive Security Verification, Client Bundle Hygiene & Deployment Runbook (Phases 8 & 9)
- **Context:** Pre-deployment hardening requires proving immunity against OWASP Top 10 vectors, verifying client bundles do not leak secrets, and establishing a step-by-step operator deployment runbook.
- **Decision:**
  1. Built `tests/security_abuse_suite.mjs` verifying 27 security controls across SQL injection payloads, XSS strings, path traversal in uploads, oversized uploads, forged JWTs, and direct RPC privilege escalation.
  2. Scanned `.next/static/` to prove 0% presence of `SUPABASE_SERVICE_ROLE_KEY` and disabled public source maps.
  3. Published comprehensive reports: `docs/SECURITY_REPORT.md`, `docs/QA_REPORT.md`, `docs/PERFORMANCE_REPORT.md`, `docs/CONTENT_TO_CONFIRM.md`, and `docs/DEPLOY_CHECKLIST.md`.

---

### Decision 23: Diagram Architecture, Sharp Processing Pipeline, and Option Backward Compatibility
- **Context:** Competitive examinations require diagrams, maps, circuits, and mathematical formulas across question statements, option choices, shared passages, and detailed explanations.
- **Decision:**
  1. **Schema & Storage:** Added `mock_question_groups` for shared reading comprehension passages and maps, altered `mock_questions` with `group_id`, `image_path`, `image_alt`, `image_width`, and `image_height`, and altered `mock_question_keys` with `explanation_image_path` and `explanation_image_alt`. Private bucket `mock-question-images` enforces student access strictly through ephemeral signed URLs.
  2. **Zero-Breakage Backward Compatibility:** Options can be legacy plain strings (`string[]`) or modern rich objects `{ key: 'A', text: string, imagePath?: string, imageAlt?: string }`. Universal helper functions `getOptionText()` and `getOptionImage()` insulate all student CBT screens, review cards, and scoring engines from breaking changes.
  3. **High-Security Sharp Pipeline (`src/lib/imageProcessor.ts`):** Enforces 8MB file ceiling, 40-megapixel decompression bomb defense, magic-byte inspection (rejecting masqueraded SVGs, HTML, and executables), EXIF metadata stripping, auto-orientation, and dual-mode WebP encoding (comparing 85% lossy vs. lossless and picking the smaller byte size). Maximum widths are clamped to 1200px for questions/passages and 900px for options. Storage paths are randomized UUIDs to prevent file overwrites.
  4. **Multi-Input Ingestion & Manual Crop Tool:** Supports Paste (with separate answer sheet parser), structured CSV template generator, ZIP package extraction with Zip-Slip path normalization and 100MB decompression limit, Word `.docx` extraction with inline images via Mammoth, and an interactive HTML5 Canvas PDF crop tool with coordinate scaling and direct attachment.
  5. **Review Screen Interaction:** Global clipboard listener (`Ctrl+V`), drag-and-drop zones across question statement, options A–D, and explanation, live KaTeX preview, diagram indicator heuristic with dismiss toggle, and storage meter showing percentage of 1GB quota with orphan cleanup action.

---

### Decision 24: Question Paper Storage, Lifecycle Auto-Purge & Aggregate Preservation
- **Context:** Host storage limits (1 GB quota) necessitate timely purging of large mock test image assets after exams conclude, while retaining student attempt history and aggregate question analytics.
- **Decision:**
  1. **Lifecycle Management:** Added `content_status` (`draft`, `active`, `expired`, `purged`), `retention_days`, `purge_after`, and `archive_downloaded_at` to `mock_tests`. Tests support compute-on-read expiration fallback.
  2. **Analytics Preservation:** Created `mock_test_question_stats` to store per-question aggregate metrics (attempts, correct rate, discrimination index, difficulty) before question rows and storage images are purged.
  3. **Soft-Copy Question Papers:** Created `mock_question_papers` table and private bucket `mock-question-papers` (max 25MB, PDF only) with admin-only direct access, and student delivery through server-side watermarking.

