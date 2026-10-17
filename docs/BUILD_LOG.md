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


