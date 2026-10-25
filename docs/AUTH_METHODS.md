# Audit of Authentication Methods and Session Settings

Date: October 26, 2026
Repository: Career Guidance Academy (C.G.A)
Target: Authentication Audit (Phase 1)

---

## 1. Inventory of All Sign-In Methods in Codebase

| Method / Call | Location | Status & Intended Use | Action for Phase 2 |
| :--- | :--- | :--- | :--- |
| `sb.auth.signInWithPassword` | `src/services/cgaService.ts:515` (`login`) | **Primary Active Login**: Authenticates students, faculty, and admins using email + password. | **KEEP**: This is the sole intended login method. |
| `sb.auth.signInWithPassword` | `src/services/cgaService.ts:1440` (`verifyCurrentPassword`) | **Re-authentication guard**: Confirms current password before sensitive credential changes. | **KEEP**: Essential security defense against unauthorized account modification. |
| `sb.auth.signInWithPassword` | `src/services/cgaService.ts:1458` (`changePassword`) | **Re-authentication guard**: Verifies current password before writing new password. | **KEEP**: Security re-auth guard. |
| `sb.auth.signInWithPassword` | `src/services/cgaService.ts:1491` (`changeEmail`) | **Re-authentication guard**: Verifies current password before requesting email change. | **KEEP**: Security re-auth guard. |
| `sb.auth.signInWithPassword` | `src/services/cgaService.ts:1529` (`changePhone`) | **Re-authentication guard**: Verifies current password before changing contact phone. | **KEEP**: Security re-auth guard. |
| `sb.auth.signInWithOtp` | *None* | Zero occurrences across entire codebase. | None required (already absent). |
| `signInWithOAuth` / Social Login | *None* | Zero occurrences across entire codebase. | None required (already absent). |
| `signInAnonymously` | *None* | Zero occurrences across entire codebase. | None required (already absent). |
| Magic Links (`signInWithOtp({ email })`) | *None* | Not used for sign-in. `resetPasswordForEmail` is used strictly for password reset OTP dispatch. | None required (login is password-only). |
| Phone Login Resolution (`parsed.kind === 'phone'`) | `src/services/cgaService.ts:478-513` | Legacy code path checking if identifier is 10 digits and calling `/api/auth/resolve-phone` or `resolve_login_email` RPC. | **REMOVE**: Delete phone branch from `cgaService.login()`. |
| Phone Lookup Route | `src/app/api/auth/resolve-phone/route.ts` | Server route looking up email by phone for login. | **REMOVE**: Endpoint is no longer needed. |
| Phone Lookup RPC | `supabase/migrations/0005_roles_faculty_access.sql:184` (`resolve_login_email`) | Database RPC for phone resolution. | **DEPRECATE/REVOKE**: Revoke public execution in a new migration. |
| Inline Signup OTP on `/login` | `src/app/login/page.tsx:106-126, 279-314` | Inline form on login page allowing students to verify confirmation OTP. | **REMOVE**: Keep `/login` strictly email + password. Signup verification is handled at `/register`. |
| Password Recovery OTP | `src/app/api/auth/verify-recovery-otp/route.ts` & `/forgot-password` | Verifies OTP code sent to user email to allow password reset. | **KEEP**: Required for legitimate account recovery. |
| Signup Email OTP | `src/app/api/auth/verify-signup-otp/route.ts` & `/register` | Verifies 6-digit confirmation code on student registration. | **KEEP**: Required for email verification at registration. |

---

## 2. Session Settings & JWT Lifetime

### Local / Repository Config
- No `supabase/config.toml` was previously checked into version control. Local Supabase CLI runs against standard default GoTrue defaults.
- Environment variables in `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

### Remote Supabase Dashboard Settings (`craicxwqaygdydtdaxtw`)
The following configuration exists in the Supabase hosted project:

1. **Authentication > Sessions**:
   - **JWT Expiry Limit**: Default is `3600` seconds (1 hour).
   - **Refresh Token Validity**: Default is `2592000` seconds (30 days).
   - **Refresh Token Reuse Interval**: `10` seconds.
   - **Single Session per User**: Available under Supabase Auth configuration (toggle: "Enforce single session per user"). *Note: This built-in setting terminates older refresh tokens upon token refresh, but does NOT instantly revoke the existing JWT until it expires without database/middleware checks.*

2. **Authentication > Providers**:
   - **Email Provider**: **Enabled**.
     - Confirm email: **Enabled** (requires verification before initial access).
     - Secure password reset: **Enabled**.
     - Secure email change: **Enabled**.
   - **Phone Provider**: Should be **Disabled** (no SMS auth used).
   - **Third-Party OAuth Providers** (Google, GitHub, Apple, etc.): **Disabled**.

---

## 3. Checklist of Supabase Dashboard Changes to Verify by Hand
Under **Authentication > Providers**:
- [ ] Confirm **Phone** provider is **Disabled**.
- [ ] Confirm **Email** provider is **Enabled**, with "Allow password sign-in" turned ON, and "Allow Magic Links" turned OFF (if available).
- [ ] Confirm third-party providers (Apple, Azure, Bitbucket, Discord, Facebook, Figma, GitHub, GitLab, Google, Kakao, Keycloak, LinkedIn, Notion, Slack, Spotify, Twitch, Twitter, WorkOS, Zoom) are all **Disabled**.

Under **Authentication > Sessions**:
- [ ] Review JWT expiry (default 3600 seconds / 1 hr is standard).
