# Career Guidance Academy (C.G.A) — Manual Payment System Final Report

## Executive Summary

The unified manual payment system (UPI first, optional bank transfer) has been successfully designed, implemented, and verified for Career Guidance Academy (C.G.A), Udaipur, Gomati Tripura. The system complies with all architectural constraints, security invariants, DPDP Act privacy rules, and institutional administrative parameters.

---

## Completed Deliverables Summary

### Phase 1: Database Schema, RLS, Storage & Payment Settings Seed
- **Migration `0006_unified_manual_payments.sql`:**
  - `payment_settings` seeded with authentic C.G.A institute values (`popighosh40@okicici`, SBI Account `37660443471`, IFSC `SBIN0000216`, etc.).
  - `payment_requests` with lifecycle states (`awaiting_payment`, `pending_review`, `approved`, `rejected`, `expired`, `refund_due`).
  - `sample_utr_blocklist` protecting against dummy values like `123456789012`.
  - Append-only `payment_audit_log` with database triggers preventing modification and deletion.
  - Relational `material_access` and `series_enrollments` tables.
  - PostgreSQL sequence `receipt_no_seq` ensuring sequential, non-colliding receipts.
  - Private Supabase Storage bucket `payment-proofs` with user folder separation.
  - Official Google Pay QR code asset placed at `public/cga-upi-qr.jpg`.

### Phase 2: Transactional Business Logic & Server RPCs
- **Migration `0007_payment_rpcs.sql`:**
  - `cga_create_payment_request`: Server-side amount derivation, rate limiting (5 req/hr), collision-resistant reference generation.
  - `cga_submit_payment_proof`: Format checking, dash/space stripping, dummy blocklist rejection, privacy-preserving uniqueness check.
  - `cga_approve_payment`: Admin-only SECURITY DEFINER function with `FOR UPDATE` row locking, exact amount verification, last-seat race handling (`refund_due` + waiting list), and sequence receipt creation.
  - `cga_reject_payment`: Reason requirement and student resubmission support.
  - `cga_expire_stale_requests`: Automatic 48-hour expiration.
  - `cga_update_payment_settings_secure`: Re-authenticates admin password using `extensions.crypt` before updating sensitive financial columns.

### Phase 3: Student Flow & Portal Pages
- **`<PayManualModal />` Component:** Unified 4-step modal covering:
  - Course Enrolment (Full & 2-Part Instalment).
  - Study Material Purchase (Standalone Notes/PDFs at ₹199).
  - Mock Test Series Purchase (T-TET Series at ₹499).
  - Balance Clearance (Instalment 2 dues).
- **`/student/payments` Page:** Full transaction history with status badges, rejection explanation alerts, seat-full warnings, receipt downloading, and one-click proof resubmission.
- **`/mock-tests` Landing Page:** Dedicated public overview of the T-TET 2026 15-Mock Series with Enrolment trigger and auth protection.

### Phase 4: How-to-Pay Guide & Proof Form Experience
- **`src/content/howToPayContent.ts`:** Bilingual content in simple English and Bengali.
- **`<HowToPayGuide />` Component:**
  - 5-step visual guide with security notices.
  - App-specific UTR guide (GPay, PhonePe, Paytm, Other bank apps) with warning that IDs beginning with "T24..." are not UTRs.
  - Visual HTML/CSS mockup screen with "EXAMPLE ONLY - not a real payment" ribbon.
  - Screenshot Do's & Don'ts.
  - Detailed FAQ accordion.
- **`/how-to-pay` Standalone Page:** Linked in the public footer, modal, and payment history.
- **Form Enhancements:** Numeric keypad, live 12-digit counter, canvas client-side compression, blur/small image warning, and confirmation checkbox.

### Phase 5: Admin Verifications & Management
- **`/admin/payments` Page:**
  - Status tabs with real-time pending badge count.
  - Search by UTR, reference code, student name, and code.
  - Duplicate-UTR and amount-mismatch red alert highlights.
  - Short-lived signed URL modal for screenshot proofs.
  - Approval confirm dialog with exact amount typing and bank cross-check confirmation.
  - Rejection dialog requiring explanation.
  - Read-only audit log viewer.
- **`/admin/payment-settings` Page:**
  - High-risk security modal requiring administrator password re-authentication when altering sensitive bank details.
- **`/api/admin/payments/export/route.ts`:**
  - Server-side daily CSV reconciliation export.

---

## Verification & Test Results

1. **TypeScript Typecheck (`npx tsc --noEmit`):**
   - **Result:** Code 0, Zero errors across all App Router routes, components, and services.
2. **Automated Unit Test Suite (`tests/payments_suite.mjs`):**
   - **Result:** 12/12 test specifications passing (0 failed).
   - Verified amount tampering prevention, 11/12/13-digit and letter UTR validations, dummy blocklist rejection, privacy-preserving uniqueness message, double-approval idempotency, last-seat race conditions, file size and format filters, and bilingual guide translations.
3. **Local Dev Server:**
   - Next.js Turbopack running actively on `localhost:3000`.

---

## Assumptions & Design Choices

1. **Standalone Note Pricing:** Study materials without an explicit database price default to ₹199 (defined in migration `0007_payment_rpcs.sql`).
2. **T-TET Mock Series:** Seeded at ₹499 as specified. The table `series_enrollments` bridges student accounts with mock test access.
3. **Instalment Schedule:** Enrolment supports Full Payment or Instalment 1 now, with Instalment 2 payable under `/student/fees` through the balance clearance manual payment flow.
4. **Offline / Local Fallback:** While all database operations are wired to call remote Supabase RPCs, client-side fallback storage (`localStorage`) allows local offline demonstration without requiring a remote database connection.

---

## Manual Verification Checklist for Administrator

When deploying to production Supabase:
- [ ] Run migrations `0006_unified_manual_payments.sql` and `0007_payment_rpcs.sql` in the Supabase SQL Editor.
- [ ] Ensure the storage bucket `payment-proofs` is created as a **Private** bucket.
- [ ] Verify that `pg_cron` is enabled if you wish to run the automated 48-hour expiration schedule.
- [ ] Verify `.env.local` contains valid production Supabase keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- [ ] Test one end-to-end payment submission using a test account, check the signed screenshot preview in `/admin/payments`, and confirm receipt generation upon approval.
