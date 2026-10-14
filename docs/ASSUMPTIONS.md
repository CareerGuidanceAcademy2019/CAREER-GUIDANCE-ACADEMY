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
