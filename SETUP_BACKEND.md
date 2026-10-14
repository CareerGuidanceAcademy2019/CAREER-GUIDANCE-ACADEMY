# Backend setup (Supabase + Vercel)

The app uses **Supabase Auth + Postgres (RLS)** with backend server validation and admin capabilities.

## 1. Database Migrations (Run in order in Supabase Dashboard → SQL Editor)
1. `supabase/migrations/0001_core_schema.sql` (Tables, sequences, indexes, auto-registration triggers)
2. `supabase/migrations/0002_rls_and_rpc.sql` (Row Level Security policies, server-side scoring & enrolment RPCs)
3. `supabase/migrations/0003_candidate_deletion_cascade.sql` (Administrator atomic candidate & data purge RPC)

## 2. Auth Configuration (Dashboard → Authentication)
- Providers → Email: keep **Confirm email** ON for production.
- URL Configuration: set *Site URL* to your Vercel URL and add `<url>/reset-password` and
  `<url>/login` to *Redirect URLs* (and `http://localhost:3000/**` for dev).
- Set minimum password length to 8.

## 3. Environment Variables (`.env.local` locally, Vercel → Settings → Environment Variables)
| Name | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | all | public Supabase URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | all | public, guarded by Row Level Security |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | **secret**; used for admin-level candidate provisioning & complete database erasure |

## 4. First Administrator Account
1. Register normally at `/register` (confirm the email link).
2. In Supabase SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@institute.in';
   ```
3. Sign in on the **Administrator** tab at `/login`. Only database administrators can grant the admin role.

## 5. Candidate Deletion & Scrubbing
- Administrators can remove any candidate from the **Admin Students** management table or the **Student 360° Drawer**.
- The deletion permanently purges all linked candidate records across:
  - `test_attempts`
  - `fee_payments`
  - `enrollments`
  - `waiting_list`
  - `profiles`
  - `auth.users` (removes credentials so they can no longer sign in)

## 6. Automated Mock Test Bulk Upload (PDF & Text)
- In **Admin Mock Tests**, administrators can:
  - **Upload a PDF question paper** or text document (`.pdf`, `.txt`, `.csv`).
  - Or **paste raw question text** directly from Word / Google Docs / Notes.
  - The ingestion engine auto-extracts questions, splits options (A, B, C, D), detects correct answer keys (`Ans: B`), and parses explanations.
  - Administrators can review separated questions, adjust any answer key with one click, and save the test.
- **Student Exam Flow**:
  - While taking the test, results and faculty solutions are locked.
  - **Only after submitting the exam** can students view their score, merit rank, and detailed question-by-question explanations.

## 7. Payments
- Payment gateway integration is currently on hold as requested. Fee recording and enrolment workflows remain functional within the institute administrative ledger.
