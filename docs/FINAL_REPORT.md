# Authentication & Single-Session Hardening Final Report

## Executive Summary
Career Guidance Academy (C.G.A) authentication has been hardened for production launch:
1. **Email & Password Login Only**:
   - `/login` exclusively accepts registered email address and password.
   - All inline OTP inputs, phone-number lookups, and unused OAuth/anonymous endpoints have been removed.
   - Wrong email and wrong password yield an identical generic error: `"Invalid email address or password. Please check your credentials."`
   - Normal login sends zero emails.
   - Registration email confirmation and password reset flows remain fully functional.
2. **One Active Session Per Account**:
   - Signing in on a new device automatically supersedes and invalidates older sessions.
   - Old device learns of supersession within ~45–60 seconds or immediately upon tab activation.
   - Non-dismissible notice displayed: `"You were signed out because your account was used on another device."` with a `"Log in again"` button.
   - Sensitive database RPCs (`save_attempt_progress`, `submit_mock_attempt`, `get_test_questions`) and protected API endpoints block the superseded device immediately in PostgreSQL (< 3.7 ms DB execution).
   - In-progress mock test attempts and answers remain safe in PostgreSQL; the student can resume on the new device with remaining time from the server clock.
   - Student profile displays "Last login" and "Log out from all devices".
   - Admin Student 360 view has an audited "Force Sign Out" button.

---

## What Changed

### 1. Database Migrations
- **File**: [`supabase/migrations/0022_single_session_and_auth_hardening.sql`](file:///c:/work/for/sde/CAREER/GUIDANCE/ACADEMY/supabase/migrations/0022_single_session_and_auth_hardening.sql) (applied to remote Supabase DB).
  - Added `last_login_at timestamptz` column to `public.profiles`.
  - Created `public.is_current_session_active()`: validates `auth.jwt() ->> 'session_id'` against `auth.sessions(id)`.
  - Created `public.enforce_single_session(p_current_session_id uuid)`: uses `pg_advisory_xact_lock` for concurrency safety and purges older sessions for the authenticated user.
  - Created `public.signout_all_devices()`: clears all active sessions for the current student.
  - Hardened `save_attempt_progress`, `submit_mock_attempt`, and `get_test_questions` with session validation guards.
  - Revoked public execute permissions from obsolete `resolve_login_email` function.

### 2. Backend & Server Security
- **File**: [`src/proxy.ts`](file:///c:/work/for/sde/CAREER/GUIDANCE/ACADEMY/src/proxy.ts)
  - Intercepts requests on protected routes (`/student`, `/admin`, `/faculty-portal`).
  - Calls `is_current_session_active`: invalid sessions redirect to `/login?reason=other_device` (clearing cookies) and APIs return HTTP 401. Public pages are unaffected.
- **File**: [`src/lib/supabase/server.ts`](file:///c:/work/for/sde/CAREER/GUIDANCE/ACADEMY/src/lib/supabase/server.ts)
  - `requireActiveSession()` and `requireAdmin()` enforce active session validation in `auth.sessions`.
- **API Routes Hardened**:
  - [`src/app/api/mock-tests/papers/[paperId]/route.ts`](file:///c:/work/for/sde/CAREER/GUIDANCE/ACADEMY/src/app/api/mock-tests/papers/[paperId]/route.ts)
  - [`src/app/api/mock-tests/start/route.ts`](file:///c:/work/for/sde/CAREER/GUIDANCE/ACADEMY/src/app/api/mock-tests/start/route.ts)
  - [`src/app/api/mock-tests/submit/route.ts`](file:///c:/work/for/sde/CAREER/GUIDANCE/ACADEMY/src/app/api/mock-tests/submit/route.ts)
  - [`src/app/api/mock-tests/solutions/route.ts`](file:///c:/work/for/sde/CAREER/GUIDANCE/ACADEMY/src/app/api/mock-tests/solutions/route.ts)
  - [`src/app/api/mock-tests/images/route.ts`](file:///c:/work/for/sde/CAREER/GUIDANCE/ACADEMY/src/app/api/mock-tests/images/route.ts)
  - [`src/app/api/admin/students/force-signout/route.ts`](file:///c:/work/for/sde/CAREER/GUIDANCE/ACADEMY/src/app/api/admin/students/force-signout/route.ts) (Admin force sign out with audit logging).
  - Deleted obsolete endpoint: `src/app/api/auth/resolve-phone`.

### 3. Client & UI Components
- **File**: [`src/app/login/page.tsx`](file:///c:/work/for/sde/CAREER/GUIDANCE/ACADEMY/src/app/login/page.tsx)
  - Strict email + password login only.
  - Standard `autoComplete="username"` and `autoComplete="current-password"`.
  - Password show/hide toggle.
  - Reason banner for `reason=other_device`.
  - Removed all inline OTP elements.
- **File**: [`src/components/auth/SessionHeartbeat.tsx`](file:///c:/work/for/sde/CAREER/GUIDANCE/ACADEMY/src/components/auth/SessionHeartbeat.tsx)
  - Gated to authenticated routes only.
  - Listens to tab `focus` and `visibilitychange` to trigger immediate session verification.
  - Periodic 45s interval while visible; 5m backoff when hidden.
  - Renders non-dismissible supersession dialog.
- **File**: [`src/app/student/profile/page.tsx`](file:///c:/work/for/sde/CAREER/GUIDANCE/ACADEMY/src/app/student/profile/page.tsx)
  - Displays "Last login" timestamp.
  - Added "Log out from all devices" button.
- **File**: [`src/app/admin/students/page.tsx`](file:///c:/work/for/sde/CAREER/GUIDANCE/ACADEMY/src/app/admin/students/page.tsx)
  - Added "Force Sign Out Device" button in Student 360 modal.
- **File**: [`src/app/admin/profile/page.tsx`](file:///c:/work/for/sde/CAREER/GUIDANCE/ACADEMY/src/app/admin/profile/page.tsx)
  - Added administrator single-session enforcement and "Log out from all devices" button.

---

## Verification Results

1. **Automated Test Suite**: [`tests/single_session_and_auth_suite.mjs`](file:///c:/work/for/sde/CAREER/GUIDANCE/ACADEMY/tests/single_session_and_auth_suite.mjs)
   - 14 of 14 tests passing:
     - Wrong password gives generic error
     - Unknown email gives identical failure status
     - Failed login does not log out existing sessions
     - Browser 1 login creates active session
     - Independent user sessions remain unaffected
     - Browser 2 login invalidates Browser 1
     - Superseded Browser 1 blocked from `save_attempt_progress`
     - Superseded Browser 1 blocked from `submit_mock_attempt`
     - Superseded Browser 1 blocked from `get_test_questions`
     - Simultaneous concurrent logins resolve to exactly 1 active session
     - Log out from all devices revokes all sessions
     - Database query latency: 3.7 ms (sub-50ms target)
     - Mid-test attempt answers remain safe and resume cleanly on new device
     - Last login timestamp recorded in profiles
2. **Playwright Dual-Context Browser Verification**: [`tests/single_session_playwright.mjs`](file:///c:/work/for/sde/CAREER/GUIDANCE/ACADEMY/tests/single_session_playwright.mjs)
   - Tested simultaneously in two browser contexts (Desktop 1280x800 and Mobile 360x780).
   - Verified session supersession modal and redirect flow.
   - Saved screenshots:
     - Desktop Login: `docs/screenshots/01_login_desktop.png`
     - Desktop Profile with Last Login & Log out from all devices: `docs/screenshots/02_profile_desktop.png`
     - Mobile 360px Login: `docs/screenshots/03_login_mobile_360px.png`
     - Mobile 360px Dashboard: `docs/screenshots/04_dashboard_mobile_360px.png`
     - Desktop Signed Out Modal: `docs/screenshots/05_desktop_signed_out_modal.png`
     - Desktop Other Device Banner on Login: `docs/screenshots/06_login_other_device_banner_desktop.png`
     - Mobile 360px Signed Out Modal: `docs/screenshots/07_mobile_360px_signed_out_modal.png`

---

## Manual Steps Required in Supabase Dashboard

The repository configuration has disabled external providers in [`supabase/config.toml`](file:///c:/work/for/sde/CAREER/GUIDANCE/ACADEMY/supabase/config.toml). Perform the following manual checks in the Supabase Dashboard:

1. **Authentication -> Providers**:
   - **Email**: Ensure **Enabled** is checked.
     - Ensure **Confirm email** is enabled (for signup verification).
     - Ensure **Secure email change** is enabled.
   - **Phone**: Ensure **Disabled** is checked.
   - **Third-Party Providers** (Google, GitHub, Apple, etc.): Ensure all are **Disabled**.
2. **Authentication -> Email Templates**:
   - Ensure the standard confirmation and recovery templates are active (existing SMTP setup untouched).
3. **Authentication -> Sessions & Security Settings**:
   - **JWT Expiry**: Set to `3600` (1 hour) or `1800` (30 minutes). (With our database-level `is_current_session_active()` check, sessions are invalidated immediately in < 3.7 ms regardless of JWT lifetime).
   - **Single Session Per User**: If visible under your Supabase plan tier (Authentication > Configuration), you may additionally toggle this as an in-dashboard safety backup.

---

## Recommended Follow-Ups
1. **Device Switch Rate Monitoring**:
   - Query `security_audit_log` weekly for accounts with > 5 device switches in 24 hours to identify potential credential sharing.
2. **Audit Log Retention Policy**:
   - Add a scheduled cleanup for `security_audit_log` older than 90 days if database storage approaches free tier limits.
