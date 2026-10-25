# Single Active Session Enforcement Architecture

## 1. Overview & Objective
Career Guidance Academy (C.G.A) enforces a **strict single active session per account** policy. When an account logs in from a new device, computer, or browser window, any older active session is automatically superseded and invalidated within ~45–60 seconds, or instantly upon tab reactivation.

The superseded device is completely blocked from performing any sensitive database actions, including:
- Saving mock test answers (`save_attempt_progress`)
- Submitting mock test attempts (`submit_mock_attempt`)
- Starting new tests or loading question sets (`get_test_questions`)
- Generating signed URLs for exam question papers and study materials
- Processing or approving fee payments

---

## 2. Why Option B (Session Existence via `auth.sessions` & Invalidation) Won
We evaluated four potential architectural designs against the **Optimal Solution First** standard:

| Evaluation Criteria | Option A: Supabase Built-in User Setting | **Option B: Active Session Check against `auth.sessions` (Selected)** | Option C: Custom `active_sessions` Table | Option D: Short JWT Lifetime Only |
| :--- | :--- | :--- | :--- | :--- |
| **Files & Tables Touched** | 0 files (Dashboard toggle only) | 0 new tables. 1 migration (`0022`), 1 RPC (`is_current_session_active`), 1 sentinel component (`SessionHeartbeat`) | 1 new table, cron cleanup jobs, multiple sync endpoints, custom triggers | 0 new tables, low code touch |
| **Supabase Plan Feasibility** | Enterprise/Pro add-on setting dependent; doesn't revoke existing JWTs until expiry | **Fully supported on standard Supabase / Postgres. Zero added plan cost.** | Fully supported, but higher operational maintenance | Fully supported |
| **Immediate Invalidation Time** | Delayed until token refresh (up to 1 hour) | **Immediate in Postgres (< 3.7 ms); frontend notices on tab focus or within 45s** | Immediate, but requires custom DB sync logic | Delayed until token expiry (5–15 min) |
| **Database-Level Protection** | Weak (JWT valid until exp) | **Strongest: RPCs check `is_current_session_active()` inside the DB engine** | Medium to High (requires joins on custom table) | None until token expires |
| **Overhead on Public Pages** | Zero | **Zero (gated to `/student`, `/admin`, `/faculty-portal` only)** | Medium (database joins on all lookups) | Zero |
| **Complexity & Risk** | Low, but ineffective for instant kickoff | **Minimal: leverages native GoTrue `auth.sessions` and atomic single-session RPC** | High risk of state desynchronization | Low, but poor UX (frequent token refreshes) |

**Winning Justification**:
Option B achieves instant, database-enforced security without creating extra tables or introducing background cron jobs. Every Supabase Auth JWT includes a `session_id` claim mapping 1:1 with `auth.sessions(id)`. When an older session is purged via `enforce_single_session()`, its session ID is immediately orphaned in PostgreSQL. Any database RPC checking `is_current_session_active()` fails immediately without waiting for access token expiry.

---

## 3. How It Works

### A. Atomic Login Supersession
When a candidate logs in via `/login`:
1. Client calls `sb.auth.signInWithPassword({ email, password })`.
2. Upon success, client calls:
   - `sb.auth.signOut({ scope: 'others' })` — notifies Supabase GoTrue to invalidate other tokens.
   - `sb.rpc('enforce_single_session')` — atomic PostgreSQL function running with `SECURITY DEFINER`.
3. In PostgreSQL:
   - Acquires `pg_advisory_xact_lock(hashtext(v_user_id::text))` to serialize concurrent logins cleanly.
   - Deletes all rows in `auth.sessions` for `auth.uid()` except the current session ID.
   - Sets `profiles.last_login_at = now()`.
   - If two logins happen simultaneously, the advisory transaction lock serializes them: the final surviving transaction retains exactly one valid session.

### B. Database-Level Enforcement (Never Trusts Client)
Sensitive stored procedures guard every operation:
```sql
if not public.is_current_session_active() then
  raise exception 'SESSION_REVOKED: Your account has been signed in on another device.'
    using errcode = '42501';
end if;
```
Protected operations:
- `save_attempt_progress(p_test_id, p_answers)`
- `submit_mock_attempt(p_test_id, p_answers, p_time_taken_seconds)`
- `get_test_questions(p_test_id)`
- Next.js server proxy (`src/proxy.ts`): returns HTTP 401 for protected API requests and redirects navigation requests to `/login?reason=other_device`.

### C. Client Sentinel (`SessionHeartbeat.tsx`)
- Active **only on protected routes** (`/student/*`, `/admin/*`, `/faculty-portal/*`).
- **Zero execution on public pages** (`/`, `/about`, `/courses`, etc.).
- **Tab Focus/Visibility Activation**: Immediately verifies session whenever the candidate switches back to the tab.
- **Heartbeat Interval**: Checks session validity every 45 seconds when the tab is visible; backs off to 5 minutes when the tab is hidden.
- **Notice Display**: When `is_current_session_active` returns `false`, renders a non-dismissible modal:
  > **Signed Out on This Device**
  > *You were signed out because your account was used on another device.*
  > `[ Log in again ]`
- Clicking "Log in again" clears client state and navigates to `/login?reason=other_device`.

---

## 4. Mid-Test & Mock Exam Safety
- **Attempt Preservation**: An in-progress mock attempt is stored in `public.mock_attempts`. The candidate's answers and start timestamp are committed to PostgreSQL.
- **Old Device Blocked**: The superseded device cannot save or submit answers (rejected with `SESSION_REVOKED`).
- **Seamless Resumption**: When the candidate logs in on their new device:
  1. The new session opens `/student/tests?attempt=[testId]`.
  2. The server clock calculates the remaining time: `duration - (now - started_at)`.
  3. Pre-filled answers `{ q1, q2, ... }` are loaded directly from the database.
  4. Exactly one attempt record exists throughout the exam lifecycle.

---

## 5. Known Limits & Edge Cases
1. **Shared Passwords Used in Turns**:
   - If two students share an email and password, they cannot be logged in simultaneously. However, they could theoretically take turns signing in.
   - *Mitigation*: The "Last login" timestamp is prominently displayed on the profile, and excessive device switching can be monitored in `security_audit_log`.
2. **Multiple Tabs on the Same Browser**:
   - Multiple tabs in the same browser share the same cookie/session ID, which represents one device session. They do not invalidate each other.
3. **Private Browsing / Incognito Windows**:
   - Opening an Incognito window creates a distinct cookie jar with a new `session_id`. Signing in inside Incognito will supersede the normal window.
