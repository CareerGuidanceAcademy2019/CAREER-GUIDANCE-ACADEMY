# Multi-Factor Authentication (MFA) Setup Guide
**Career Guidance Academy (C.G.A) — Administrator Accounts**

---

## 1. Overview
Under Phase 3 of the pre-deployment security baseline, all administrative accounts with access to student records, counter-cash collections, and fee ledger approvals must enforce Multi-Factor Authentication (MFA) via Time-based One-Time Passwords (TOTP, RFC 6238).

Supabase Auth provides built-in TOTP support compatible with Google Authenticator, Microsoft Authenticator, Apple Keychain, and 1Password.

---

## 2. Enabling MFA in the Supabase Dashboard
1. Navigate to your Supabase Project Dashboard: `https://supabase.com/dashboard/project/craicxwqaygdydtdaxtw/auth/mfa`
2. Under **Authentication** -> **MFA Settings**:
   - Set **TOTP (Time-based One-time Password)** to **Enabled**.
   - Set **Maximum Number of Factors per User** to `2` (Primary TOTP + Backup Device).
3. Under **Security Restrictions**:
   - Enforce MFA for Administrative roles (`role = 'admin'`).

---

## 3. Administrator Enrollment Flow
When an administrator logs into the portal or prepares their credentials:
1. Call Supabase MFA Enrollment API:
   ```typescript
   const { data, error } = await supabase.auth.mfa.enroll({
     factorType: 'totp',
     issuer: 'Career Guidance Academy (C.G.A)',
     friendlyName: 'Admin Primary Authenticator',
   });
   ```
2. Display the QR code (data.totp.qr_code) or Secret Key (data.totp.secret) to the administrator in an authenticated, encrypted setup session.
3. Administrator scans the QR code using Google Authenticator or Microsoft Authenticator.
4. Administrator enters the 6-digit TOTP code to verify and activate:
   ```typescript
   const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
     factorId: data.id,
   });
   const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
     factorId: data.id,
     challengeId: challengeData.id,
     code: enteredCode,
   });
   ```

---

## 4. Enforcing Authenticator Level in Admin Layout / Middlewares
All admin API routes and server actions verify that the current session token has `aal: 'aal2'` (Authenticator Assurance Level 2).
If `aal === 'aal1'` on an administrative user, access is routed to `/admin/mfa-challenge` before administrative permissions are unblocked.

---

## 5. Security & Recovery Recommendations
- **Emergency Recovery Keys:** Store one-time recovery codes securely offline in the institute safe (Youth Club Rd, Chanban, Udaipur).
- **Session Revocation:** Resetting an admin password immediately terminates all active AAL1 and AAL2 sessions.
- **Audit Logging:** Every MFA challenge success and failure is logged into `public.security_audit_log` with event type `mfa_challenge`.
