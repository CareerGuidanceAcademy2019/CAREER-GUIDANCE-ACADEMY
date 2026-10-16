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

### Decision 15: Dual-Layer Expiry Mechanism
- **Context:** Awaiting payment requests must expire after 48 hours.
- **Decision:** Created a cron-compatible function `cga_expire_stale_requests()`. In addition, status computation on read treats any `awaiting_payment` record where `now() > expires_at` as expired, preventing stale requests from accepting late proofs even if the scheduled sweeper is delayed.

