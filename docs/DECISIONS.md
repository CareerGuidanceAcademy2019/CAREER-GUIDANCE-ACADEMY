# Architecture Decision Records (ADR)

## Goal 1: Email and Password Login Only

### 1. Problem Statement
The login interface previously contained phone number resolution routines and an inline OTP verification box that created alternative, complex authentication paths.
The system must restrict authentication on `/login` strictly to registered email address and password, while leaving registration verification, password reset, and role access controls unaffected.

**What must stay unchanged:**
- Student registration form (`/register`) and email confirmation OTP flow.
- Password recovery via OTP on `/forgot-password`.
- Bot-protection honeypot on `/login`.
- IP-based rate limiting on login attempts.
- Password show/hide toggle and password manager autofill support (`autoComplete="username"` and `autoComplete="current-password"`).
- Role-based portal redirects and authorization barriers.

### 2. Candidate Solutions
- **Option 1: Direct Supabase Auth Client Hardening (Recommended - Use What Exists)**
  Cleanly prune legacy phone login resolution from `cgaService.login` and remove the inline OTP input from `src/app/login/page.tsx`. Use standard `signInWithPassword({ email, password })` directly with a uniform generic error message on invalid credentials. Delete obsolete `/api/auth/resolve-phone` endpoint and revoke public execution of `resolve_login_email` in SQL.
- **Option 2: Custom Server-Side Login API Proxy**
  Create a new Next.js route `/api/auth/login` to accept credentials, invoke Supabase server-side, and manage custom session cookies.

### 3. Comparison Table

| Metric | Option 1 (Direct Auth Hardening) | Option 2 (Server Login Proxy) |
| :--- | :--- | :--- |
| **Files Touched** | 3 (`login/page.tsx`, `cgaService.ts`, delete `resolve-phone`) | 6+ (new route, middleware, SSR cookie helpers) |
| **New Tables/Services** | 0 | 0 |
| **Security Strength** | High (constant-time generic error, Supabase rate limits, honeypot) | High |
| **Speed & Cost Impact** | 0ms overhead; fast direct client auth | +40–120ms serverless cold-start latency |
| **Risk to Existing Features** | Minimal / zero | Medium (potential cookie hydration desync with `@supabase/ssr`) |
| **Maintenance** | Very low | Medium |

### 4. Decision & Reason
**Chosen: Option 1.** It is the simplest and fastest solution that meets every security requirement, eliminates attack surface (phone enumeration), touches minimal files, and leverages native `@supabase/ssr` session management without added latency.

---

## Goal 2: One Active Session Per Account

### 1. Problem Statement
Users could theoretically remain signed in simultaneously across multiple devices or browsers, allowing credential and subscription sharing.
When a user logs in on a new device, any older active session must be invalidated within approximately one minute, immediately blocking the old device from sensitive operations while preserving mid-test progress and payment integrity.

**What must stay unchanged:**
- In-progress mock test answers and attempt records (must allow student to log in on new device and resume with server-clock remaining time).
- Idempotent payment request processing (no duplicate fee receipts).
- Public static pages, assets, and landing routes (zero added latency).
- RLS policies and role verification on existing tables.

### 2. Candidate Solutions
- **Option A: Supabase Built-in "Single Session Per User" Setting Only**
  Enable `enable_single_session_per_user` in GoTrue config.
  *Evaluation:* While built-in, it only invalidates refresh tokens upon refresh attempt. Active JWT access tokens remain fully valid until expiration (up to 1 hour), completely failing the requirement to lock out within ~1 minute and protect sensitive DB operations.
- **Option B: Native Session Revocation + Database Session Validator (Recommended - Use What Exists)**
  On successful login (and password reset/signup), call `supabase.auth.signOut({ scope: 'others' })` and an atomic Postgres function `enforce_single_session(current_session_id)` that deletes older sessions from `auth.sessions`. Sensitive database functions verify `is_current_session_active()` against `auth.sessions`. A lightweight client heartbeat hook (active tab focus + 45s interval, backed off when hidden) detects invalidation and redirects to `/login?reason=other_device`. No new table.
- **Option C: Custom `active_sessions` Table with Status Endpoint**
  Create a dedicated `public.active_sessions` table with device fingerprints, heartbeat timestamps, and session status flags.
  *Evaluation:* Adds an extra table, migration overhead, and duplicate state management when PostgreSQL already maintains `auth.sessions`.
- **Option D: Short JWT Lifetime Only (e.g. 60 seconds)**
  Reduce JWT lifetime to 60s so expired tokens fail quickly.
  *Evaluation:* Creates extreme auth refresh traffic (thousands of token refreshes per hour), degrades performance, and still does not offer atomic in-database session cancellation for RPCs.

### 3. Comparison Table

| Metric | Option A (Built-in Only) | Option B (Native Session Revocation + DB Guard) | Option C (Custom Table) | Option D (Short JWT Only) |
| :--- | :--- | :--- | :--- | :--- |
| **Files Touched** | 1 (`config.toml`) | 5 (migration, `cgaService.ts`, context/hook, profile, admin) | 8+ (new table, models, migrations, endpoints) | 2 (`config.toml`, refresh handler) |
| **New Tables/Services**| 0 | 0 (uses existing `auth.sessions` + 1 column on `profiles`) | 1 (`active_sessions`) | 0 |
| **Security Strength** | Inadequate (1-hr window) | Very High (immediate in DB, ~45s in UI) | Very High | Medium (token storm risk) |
| **Speed & Cost Impact**| Zero | < 5ms DB check; 0ms on public pages | Additional table writes on every request | High network/auth overhead |
| **Risk to Features** | Low | Low (non-blocking for public pages) | Medium (state desynchronization) | High (refresh rate limits) |
| **Maintenance** | None | Low (standard Postgres SECURITY DEFINER) | High (purge jobs, indexes) | Medium |

### 4. Decision & Reason
**Chosen: Option B.** Option B meets 100% of the single-session requirements without introducing any redundant tables or background cron jobs:
1. Deleting older sessions from `auth.sessions` terminates both the refresh token and the validity of the session ID.
2. `public.is_current_session_active()` extracts the `session_id` claim from `request.jwt.claims` and verifies existence in `auth.sessions` with zero network overhead.
3. Sensitive database functions (`submit_mock_attempt`, `cga_create_payment_request`, `cga_approve_payment`, paper signed URLs) call `is_current_session_active()`, rendering the old device unable to execute any financial or exam transaction.
4. A lightweight client hook alerts the user with "You were signed out because your account was used on another device." and clears client storage.
5. Student profile gains "Log out from all devices" and "Last login" timestamp; Admin 360 view gains "Force sign out" with audit logging.

### 5. Post-Implementation Verification & Cleanup
- Verification confirmed via `tests/single_session_and_auth_suite.mjs` (14/14 tests passing).
- Dual-context visual verification completed via `tests/single_session_playwright.mjs` across desktop (1280px) and mobile (360px).
- Concurrency safety guaranteed via `pg_advisory_xact_lock(hashtext(v_user_id::text))` in `public.enforce_single_session`.
- Database query execution latency measured at 3.7 ms (< 50ms requirement).
- All experimental code, obsolete endpoints (`/api/auth/resolve-phone`), and old OTP widgets cleanly removed.
