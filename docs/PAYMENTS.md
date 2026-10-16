# Career Guidance Academy (C.G.A) — Manual Payment System Documentation

## 1. Overview & Architectural Philosophy

Career Guidance Academy (C.G.A), Udaipur, Gomati Tripura utilizes **ONE unified, secure manual payment system** (UPI first, optional direct bank transfer) covering three purchasable item categories:
1. **Course Enrolment:** Full admission fee or existing 2-part instalment plan, with subsequent balance clearance.
2. **Study Materials:** Standalone purchase of digital notes and book PDFs (₹199 each).
3. **Mock Test Series:** T-TET 2026 Comprehensive 15-Mock Series (Flat ₹499).

The architecture decouples the payment collection mechanism (`payment_method`: `'upi_manual'` | `'bank_transfer'` | future `'razorpay'`) from the transactional fulfilment logic. All payment approvals and access grants flow through **ONE atomic PostgreSQL transactional function** (`cga_approve_payment`), ensuring that future payment gateways can be integrated with zero alterations to enrolment, seat-locking, or receipt generation logic.

---

## 2. Authentic Institute Payment Credentials

All public payment settings are stored in the database table `payment_settings` (single row, `id = 1`) and seeded automatically. They are never hardcoded into client JSX components:

| Parameter | Configuration Value |
| :--- | :--- |
| **Institute Name** | Career Guidance Academy (C.G.A) |
| **Payee Legal Name** | CAREER GUIDANCE ACADEMY |
| **Primary UPI ID** | `popighosh40@okicici` |
| **Bank Transfer Enabled** | `true` (Yes) |
| **Bank Account Holder** | POPI GHOSH |
| **Bank & Branch** | SBI, UDAIPUR. |
| **Bank Account Number** | `37660443471` |
| **Bank IFSC Code** | `SBIN0000216` |
| **Support Phone & WhatsApp** | `+91-7005929189` |
| **Support Email** | `careerguidanceacademy2019@gmail.com` |
| **Institute Address** | Chanban (Behind Youthclub), Udaipur, Gomati Tripura. |
| **GSTIN** | *Unset / Not Applicable* |
| **Official Receipt Prefix** | `CGA-RCP-` |
| **Request Expiry Window** | 48 Hours |
| **Refund Policy Text** | *contract to office with evidance and reason for refund related queries* |
| **Verification SLA** | *Approval will be verify within 24 hrs* |

---

## 3. Database Schema & Migration Setup

The payment system is introduced via two clean, backward-compatible migration files:

### Migration 1: `supabase/migrations/0006_unified_manual_payments.sql`
- **`payment_settings`**: Stores single-row settings with display RLS for students and admin-only write permissions.
- **`sample_utr_blocklist`**: Rejects known dummy test values (`123456789012`, `000000000000`, `111111111111`, etc.).
- **`payment_requests`**: Stores student payment attempts with lifecycle statuses:
  - `awaiting_payment`
  - `pending_review`
  - `approved`
  - `rejected`
  - `expired`
  - `refund_due`
- **Partial Unique Index**: Prevents multiple open requests for the same student, item, and instalment plan.
- **Normalized UTR Unique Index**: Enforces global UTR uniqueness across all students.
- **`payment_audit_log`**: Append-only audit trail protected with database triggers blocking `UPDATE` and `DELETE`.
- **`material_access`**: Relational table granting digital access to notes/books.
- **`series_enrollments`**: Relational table for mock test series access.
- **`receipt_no_seq`**: PostgreSQL sequence providing monotonic, collision-free receipt numbers (`CGA-RCP-YYYY-XXXXXX`).
- **Private Storage Bucket `payment-proofs`**: RLS policies allowing students to upload only into `{student_id}/` and restricting read access to authenticated admins and the owner.

### Migration 2: `supabase/migrations/0007_payment_rpcs.sql`
- **`cga_create_payment_request`**: Derives payable amount on the server from `courses`, `study_materials`, or `mock_series`. Rejects closed items, duplicate open requests, and enforces rate-limiting (5 requests/hour per student).
- **`cga_submit_payment_proof`**: Normalizes UTR, strips spaces/dashes, validates 12 digits for UPI or 12–25 characters for bank transfer, verifies proof path, and transitions status to `pending_review`.
- **`cga_approve_payment`**: High-integrity atomic fulfilment function:
  - Row-locks request and course rows `FOR UPDATE`.
  - Verifies amount received matches expected amount exactly.
  - Verifies seat availability (`seats_available > 0`). If seats are exhausted, sets status to `refund_due` and appends student to `waiting_list`.
  - Inserts into `enrollments`, `material_access`, or `series_enrollments`.
  - Generates receipt with sequence number into `fee_payments`.
  - Writes audit log and sets status to `approved`.
  - Idempotent: double approval returns success without duplicating seats or receipts.
- **`cga_reject_payment`**: Admin-only rejection requiring a reason, visible to the student for proof resubmission.
- **`cga_expire_stale_requests`**: Batch marks past-expiry requests as `expired`.
- **`cga_update_payment_settings_secure`**: Re-authenticates admin password using `extensions.crypt` before updating sensitive financial columns (`upi_id`, `bank_account_number`, `bank_ifsc`).

---

## 4. Environment Variables & Storage

### Environment Variables
Store local secrets in `.env.local` (excluded by `.gitignore`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
Placeholder references are maintained in `.env.example`.

### Storage Buckets
1. **`payment-proofs` (Private)**:
   - Stores student transaction screenshots.
   - Max size: 5 MB.
   - Supported formats: JPEG, PNG, WEBP.
   - Viewing: Ephemeral signed URLs (5 minutes duration) generated server-side.

---

## 5. Expiry Automation (pg_cron & Read Fallback)

To expire unsubmitted payment requests after 48 hours:
```sql
-- In Supabase SQL Editor / pg_cron:
select cron.schedule(
  'cga-expire-stale-payments',
  '0 * * * *', -- hourly
  $$select cga_expire_stale_requests();$$
);
```
**Fallback:** Even if the cron job is paused or delayed, status computation on read automatically treats requests past `expires_at` as expired, preventing late submissions.

---

## 6. Administrator Daily Operational Routine

1. **Check Pending Badge:** In the Admin sidebar, the **Payment Verifications** tab displays a real-time badge count of pending payments.
2. **Access Queue (`/admin/payments`):**
   - Click "View Proof" to inspect the student's payment screenshot via signed URL.
   - Copy the student's 12-digit UTR.
   - Open the official SBI YONO / bank passbook and verify the UTR credit and amount.
3. **Approve:** Click "Approve". Enter the exact amount received (must match expected amount) and check the confirmation box. Content/enrolment unlocks immediately.
4. **Reject:** If not found or invalid, click "Reject" and supply a clear reason. The student is notified in `/student/payments` and can resubmit with corrected proof.
5. **Daily Reconciliation:** In `/admin/payments`, select the date range and click "Download Report" to download a server-verified CSV reconciliation report.
6. **Financial Settings (`/admin/payment-settings`):** To change UPI ID or bank account details, supply your administrator password in the high-risk re-authentication modal.
