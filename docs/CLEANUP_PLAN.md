# Pre-Launch System Cleanup & Production Sanitation Plan

**Target Application:** Career Guidance Academy (C.G.A) Udaipur Digital Campus  
**Release Engineer:** Antigravity Release Engineering Agent  
**Date:** October 19, 2026  
**Status:** **DRY-RUN COMPLETE — AWAITING EXPLICIT USER APPROVAL ("APPROVED")**  

---

## 1. Connected Environment & Backup Verification

### 1.1 Environment Details
- **Connected Project Ref:** `craicxwqaygdydtdaxtw`
- **Connected Host:** `craicxwqaygdydtdaxtw.supabase.co`
- **Target Specified:** `production` (Live Supabase Postgres Cloud database connected to `https://careerguidanceacademy.vercel.app`)
- **Safety Status:** Database confirmed live. No destructive action has been or will be taken without explicit approval.

### 1.2 Pre-Deletion Backup Inventory
Hard Safety Rule 3 executed. Backups were generated and verified non-empty before any modification:

| Backup File Name | Size (Bytes) | Verification Status | Contents Description |
| :--- | :--- | :--- | :--- |
| `backups/cga_db_dump_2026-10-19T12-34-29-892Z.json` | 677,273 bytes | Verified Non-Empty | Complete JSON dump of all 29 public database tables. |
| `backups/cga_auth_dump_2026-10-19T12-34-29-892Z.json` | 2,623 bytes | Verified Non-Empty | Complete inventory and metadata of all Supabase Auth accounts. |
| `backups/storage_inventory_2026-10-19T12-34-29-892Z.json` | 152 bytes | Verified Non-Empty | Storage bucket file inventory (`payment-proofs`). |
| `.gitignore` | Configured | Verified | `backups/` entry added to `.gitignore` to prevent secret/PII commit. |

---

## 2. Area-by-Area Findings & Classification

Items are classified into:
- **`KEEP`**: Real data required by institute administration (`REAL_DATA_TO_KEEP`), real admin accounts, or security structures.
- **`DELETE`**: Confirmed demo/test artifacts, temporary accounts, test rate limits, and placeholder banners.
- **`DECIDE`**: Items requiring institute administrative confirmation before modification.

### 2.1 Database Tables & Accounts

| Table / Entity | Current Count | Classification | Detail & Rationale |
| :--- | :--- | :--- | :--- |
| **Auth Users (`auth.users`)** | 3 accounts | **MIXED** | - `angatsaha825@gmail.com` (`edc1b701-...`): **KEEP** (Explicit Real Admin)<br>- `careerguidanceacademy2019@gmail.com` (`4eacbd2f-...`): **DECIDE** (Official Institute Founder Account, recommend **KEEP**)<br>- `newadmin_1792318143756@cgaudaipur.edu.in` (`5250c8e3-...`): **DELETE** (Automated Test Account) |
| **User Profiles (`profiles`)** | 3 rows | **MIXED** | - `angatsaha825@gmail.com` (`CGA-2026-001`): **KEEP**<br>- `careerguidanceacademy2019@gmail.com` (`CGA-2026-002`): **DECIDE** (Recommend **KEEP**)<br>- `newadmin_1792318143756@cgaudaipur.edu.in`: **DELETE** |
| **Admin Allowlist (`access_allowlist`)** | 4 rows | **MIXED** | - `angatsaha825@gmail.com` & `7629882835`: **KEEP**<br>- `careerguidanceacademy2019@gmail.com` & `7005929189`: **DECIDE** (Subhradip Banik allowlist, recommend **KEEP**) |
| **Courses (`courses`)** | 36 rows | **KEEP** | Real course catalogue (T-TET Paper I & II, TPSC, School Foundations) specified under `REAL_DATA_TO_KEEP`. |
| **Faculty (`faculty`)** | 14 rows | **KEEP** | 14 authentic faculty members (Mrs. Popi Ghosh, Subhradip Banik, Angat Saha, etc.) specified under `REAL_DATA_TO_KEEP`. |
| **Mock Tests (`mock_tests`)** | 118 rows | **KEEP** | Authentic question papers, keys, and test packages specified under `REAL_DATA_TO_KEEP`. |
| **Mock Series (`mock_series`)** | 3 rows | **KEEP** | Tripura TET Paper-I, Paper-II Science, Paper-II Social Studies packages. |
| **Mock Subjects (`mock_subjects`)** | 16 rows | **KEEP** | Real syllabus subjects (CDP, Bengali, English, EVS, Mathematics, Science, Social Studies). |
| **Site Content (`site_content`)** | 1 row | **KEEP** | Real institute contact address (Chanban, Udaipur), phone numbers, and operational info. |
| **Payment Settings (`payment_settings`)** | 1 row | **KEEP** | Verified SBI bank account (`37660443471`, `SBIN0000216`) and UPI ID (`popighosh40@okicici`). |
| **Sample UTR Blocklist (`sample_utr_blocklist`)** | 13 rows | **KEEP** | Security fraud prevention table blocking obvious fake UTR patterns (`000000000000`, `123456789012`). |
| **Student Enrollments (`enrollments`)** | 0 rows | **KEEP** | Clean (0 test rows). Ready for real admissions. |
| **Fee Payments (`fee_payments`)** | 0 rows | **KEEP** | Clean (0 test rows). |
| **Payment Requests (`payment_requests`)** | 0 rows | **KEEP** | Clean (0 test rows). |
| **Payment Audit Log (`payment_audit_log`)** | 0 rows | **KEEP** | Clean (0 test rows). |
| **Test Attempts (`test_attempts`, `mock_attempts`)** | 0 rows | **KEEP** | Clean (0 test rows). |
| **Enquiries (`enquiries`)** | 0 rows | **KEEP** | Clean (0 test rows). |
| **Study Materials (`study_materials`)** | 0 rows | **KEEP** | Clean (0 test rows). |
| **Material Access (`material_access`)** | 0 rows | **KEEP** | Clean (0 test rows). |
| **Waiting List (`waiting_list`)** | 0 rows | **KEEP** | Clean (0 test rows). |
| **Achievements (`achievements`)** | 3 rows | **DELETE** | `ach-6`, `ach-7`, `ach-8` contain sample student toppers with stock Unsplash avatars. User will add real student toppers fresh. |
| **Announcements (`announcements`)** | 3 rows | **DELETE** | `ann-1`, `ann-2`, `ann-3` contain sample course/meeting notices. User will post fresh announcements. |
| **Rate Limit Entries (`rate_limit_entries`)** | 26 rows | **DELETE** | Expired test rate limit keys from security load testing (`test_norm_...`). |
| **Security Audit Log (`security_audit_log`)** | 1,000+ rows | **DECIDE** | Contains automated test request logs. Recommend **KEEP** as immutable audit trail or **TRUNCATE** if fresh log desired. |

---

### 2.2 Storage Buckets

| Bucket Name | File Count | Classification | Detail & Rationale |
| :--- | :--- | :--- | :--- |
| `payment-proofs` | 0 files | **KEEP** | Bucket exists and is already clean. Zero test payment screenshots present. |

---

### 2.3 Code, Seed Fallbacks & UI Cleanup

| File / Component | Item | Classification | Action Plan |
| :--- | :--- | :--- | :--- |
| `src/components/layout/PublicHeader.tsx` | Admission Announcement Ticker on Login | **DELETE** | Remove/suppress the `heroBadge` ("Admissions Open for 2026–27 Academic & Competitive Batches") when viewing `/login`. |
| `src/app/login/page.tsx` | Login Left Panel & Forms | **KEEP** | Retain clean portal authentication for Student, Faculty, and Admin. |
| `src/data/initialSeedData.ts` | Seed `achievements` array | **DELETE** | Reset array to `[]` so demo toppers do not display as memory fallback. |
| `src/data/initialSeedData.ts` | Seed `announcements` array | **DELETE** | Reset array to `[]` so demo announcements do not display as memory fallback. |
| `src/data/initialSeedData.ts` | Seed `studyMaterials` array | **DELETE** | Reset array to `[]` so demo compendiums do not display as memory fallback. |
| `scripts/seed.mjs` | Demo Seed Script | **DELETE** | Remove or replace with clean `seed_master.mjs` that only upserts required system defaults. |
| `scripts/execute_cleanup.mjs` | Execution Cleanup Script | **KEEP** | Prepared script ready for Phase 3 execution upon approval. |

---

## 3. Sequences & Counters Review

1. **Student Code Sequence (`student_code_seq`)**:
   - Current value: `3`
   - Active users using previous numbers: `CGA-2026-001` (Angat Saha), `CGA-2026-002` (Subhradip Banik).
   - **Decision:** **DO NOT RESET**. The sequence must remain at `3` so the next newly registered student receives `CGA-2026-003`.
2. **Money Receipt Sequences (`receipt_seq`, `receipt_no_seq`)**:
   - Current values: `1003` / `1001`
   - Since `fee_payments` has **0 real rows**, these sequences will be reset to `1001` so real official counter receipts start cleanly from `CGA-RCP-2026-1001`.
3. **Course Seats & Waiting Lists**:
   - All 36 courses currently have 0 enrollments. Available seats reflect full batch capacity (e.g., 60 seats) and 0 waiting list candidates.

---

## 4. Exact Execution Order & Script

The exact deletion and sanitization logic has been written to:
[`scripts/execute_cleanup.mjs`](file:///c:/work%20for%20sde/CAREER%20GUIDANCE%20ACADEMY/scripts/execute_cleanup.mjs)

**Execution steps when approved:**
1. Connect via `@supabase/supabase-js` using service role key in a protected session.
2. Delete test account `newadmin_1792318143756@cgaudaipur.edu.in` from `public.profiles` and `auth.users`.
3. Delete demo `achievements` rows (`ach-6`, `ach-7`, `ach-8`).
4. Delete demo `announcements` rows (`ann-1`, `ann-2`, `ann-3`).
5. Delete expired test entries from `public.rate_limit_entries`.
6. Reset `receipt_seq` to `1001`.
7. Update `PublicHeader.tsx` to remove admission announcements from `/login`.
8. Update `src/data/initialSeedData.ts` to set empty fallback arrays for achievements, announcements, and materials.
9. Log before and after counts for all affected tables.

---

## 5. The "DECIDE" List (Action Needed From User)

Please review the following items and confirm or modify the recommended actions:

1. **Founder / Institute Official Admin Account (`careerguidanceacademy2019@gmail.com`):**
   - *Status:* Active Super Admin in database and allowlist with phone `7005929189` (Subhradip Banik).
   - *Recommendation:* **KEEP**. This is the primary institutional Google account and recovery contact for Career Guidance Academy.
2. **Security Audit Log (`security_audit_log`):**
   - *Status:* Contains 1,000+ entries generated during automated security penetration tests.
   - *Recommendation:* **KEEP** for regulatory audit compliance, or **TRUNCATE** if you prefer a 100% clean log table before going live.
3. **Receipt Number Starting Index:**
   - *Status:* Resets to `1001` (`CGA-RCP-2026-1001`).
   - *Recommendation:* **RESET TO 1001**.
4. **Login Page Announcement Removal:**
   - *Status:* Hiding `heroBadge` on the `/login` route.
   - *Recommendation:* **EXECUTE**.

---

## 6. Safe Stop Condition

> [!IMPORTANT]
> **As required by Hard Safety Rule 1: We have stopped all modifications.**  
> **No database deletions, auth user deletions, or code modifications have been performed.**  
> **Please reply with "APPROVED" to execute Phase 3, or specify any adjustments you would like made to the plan.**
