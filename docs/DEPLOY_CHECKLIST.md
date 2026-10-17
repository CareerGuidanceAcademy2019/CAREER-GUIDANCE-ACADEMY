# Production Deployment Checklist & Operator Runbook

**System:** Career Guidance Academy (C.G.A) Web Application  
**Target Domain:** `https://careerguidanceacademy.in`  
**Hosting Target:** Vercel / Cloudflare Pages + Supabase Managed PostgreSQL  
**Document Revision:** Pre-Deployment Hardening Final  

---

> [!IMPORTANT]
> **Mandatory Legal Review:** The Privacy Policy (`/privacy-policy`), Terms and Conditions (`/terms-and-conditions`), and Refund Policy (`/refund-policy`) pages in this codebase have been updated to reflect real-world institute mechanics, DPDP Act 2023 principles, and minor guardian consent requirements. **Review these pages with an Indian legal counsel prior to public launch** rather than assuming statutory compliance.

> [!WARNING]
> **Independent Security Review:** Prior to accepting live monetary transactions or large-scale student enrollments, engage an independent certified cybersecurity firm (CERT-In empanelled or equivalent) to conduct an external penetration test.

---

## 1. Hosting Dashboard Environment Variables (Vercel / Cloudflare)

Configure the following environment variables in your hosting provider's project settings (**Settings -> Environment Variables**). Set scope strictly to **Production**:

| Variable Name | Required Scope | Sensitivity | Description |
| :--- | :---: | :---: | :--- |
| `NEXT_PUBLIC_APP_URL` | Production | Public | `https://careerguidanceacademy.in` |
| `NEXT_PUBLIC_SUPABASE_URL` | Production | Public | Your Supabase project URL (`https://<project-ref>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production | Public | Supabase public publishable/anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production | **CRITICAL SECRET** | Server-side only service role key. **NEVER prefix with NEXT_PUBLIC_**. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Production | Public | Cloudflare Turnstile site key for anti-bot protection |
| `TURNSTILE_SECRET_KEY` | Production | **SECRET** | Cloudflare Turnstile secret key for server-side verification |

---

## 2. Mandatory Secret Key Rotation

Before switching DNS to production:
1. **Rotate Supabase Service Role Key:**
   - In Supabase Dashboard: Navigate to **Project Settings -> API**.
   - Under **JWT Secret**, click **Generate new secret / Rotate key**.
   - Immediately update `SUPABASE_SERVICE_ROLE_KEY` in your hosting dashboard.
2. **Rotate Database Password:**
   - In Supabase Dashboard: Navigate to **Project Settings -> Database -> Database password**.
   - Click **Reset database password** to a high-entropy string (24+ characters).
3. **Revoke Old Access Tokens:**
   - In Supabase Account: Navigate to **Access Tokens**.
   - Delete any temporary CLI or personal access tokens generated during development.

---

## 3. Supabase Dashboard Configuration (Step-by-Step)

### A. Authentication & User Management
- [ ] **Email Confirmations:**  
  Navigate to **Authentication -> Providers -> Email**.  
  Ensure **Confirm Email** is **ENABLED**.
- [ ] **Custom SMTP Configuration (CRITICAL):**  
  *Supabase Free tier limits default auth emails to 30 per hour.*  
  Configure a transactional SMTP provider (Resend, Postmark, AWS SES, or SendGrid) under **Authentication -> SMTP Settings**.
- [ ] **Password Protection:**  
  Under **Authentication -> Password**:  
  - Enforce minimum password length: **10 characters**.  
  - Enable **Check for leaked passwords** (HaveIBeenPwned integration).
- [ ] **Multi-Factor Authentication (MFA):**  
  Under **Authentication -> MFA**:  
  - Enable **TOTP (Time-based One-Time Password)**.  
  - Document setup for institute admins using Google Authenticator / Microsoft Authenticator (see `docs/MFA_SETUP.md`).
- [ ] **Session & Token Timeouts:**  
  - Access Token Expiry: **3600 seconds (1 hour)**.  
  - Refresh Token Expiry: **2592000 seconds (30 days)**.  
  - Enable **Detect and revoke reuse of refresh tokens**.

### B. Database Security & Networking
- [ ] **Enforce SSL on Postgres Connections:**  
  Navigate to **Project Settings -> Database -> SSL Enforcement**.  
  Ensure **Enforce SSL** is toggled **ON**.
- [ ] **Network Restrictions / IP Allowlisting:**  
  If utilizing direct database connections, navigate to **Project Settings -> Network Restrictions** and restrict direct access to your hosting IP ranges or VPN.
- [ ] **Connection Pooling (PgBouncer):**  
  Always connect serverless route handlers to **Port 6543** (Transaction Mode) rather than Port 5432 to avoid connection starvation.
- [ ] **Backups & Point-in-Time Recovery (PITR):**  
  Navigate to **Database -> Backups**.  
  Verify scheduled physical backups are enabled. If on Supabase Pro, enable **Point-in-Time Recovery (PITR)** with 7-day retention.
- [ ] **Run Security & Performance Advisors:**  
  - Run **Security Advisor** under **Database**: verify zero open RLS warnings exist.  
  - Run **Performance Advisor**: verify all foreign keys and search queries have active indexes (Migration 0012 applied).

---

## 4. Two-Factor Authentication (2FA) Across All Accounts

Enforce hardware or app-based 2FA across all administrative accounts controlling the platform:
- [ ] **Hosting Account (Vercel / Cloudflare):** Require TOTP 2FA for all team members.
- [ ] **Supabase Organization Account:** Enforce 2FA on the owner account.
- [ ] **Domain Registrar Account:** Enforce 2FA on GoDaddy / Cloudflare / Namecheap.
- [ ] **Institute Google Workspace / Gmail Accounts:** Enforce 2FA on `careerguidanceacademy2019@gmail.com`.

---

## 5. DNS, HTTPS & WAF Settings

- [ ] **Custom Domain Setup:**  
  Configure apex domain `careerguidanceacademy.in` and `www` CNAME records pointing to your hosting provider.
- [ ] **Enable DNSSEC:**  
  In your domain registrar DNS settings, enable DNSSEC to prevent DNS spoofing.
- [ ] **Cloudflare WAF / CDN (Recommended):**  
  - Set SSL/TLS to **Full (Strict)**.  
  - Enable **Bot Fight Mode** under **Security -> Bots**.  
  - Enable **Cloudflare Managed Ruleset** and **OWASP Core Ruleset** (Paranoia Level 2).  
  - Create WAF Rate Limit: Max 120 req/min per IP on general routes, 20 req/15min on `/login` and `/register`.

---

## 6. Uptime Monitoring & Error Tracking

- [ ] **Uptime Monitor:**  
  Configure an external heartbeat monitor (e.g., Better Stack or UptimeRobot) pinging `https://careerguidanceacademy.in/robots.txt` every 60 seconds with SMS/WhatsApp alerts for downtime.
- [ ] **Error Tracking:**  
  Connect Sentry or Logflare for production exception monitoring. Verify that client PII (passwords, UTRs, student phone numbers) is sanitized by Sentry scrubbers before logging.

---

## 7. Post-Deployment Smoke Test (15-Minute Runbook)

Immediately upon DNS cutover, execute this live verification sequence:
1. [ ] **Homepage & Public Pages:** Load `/`, `/courses`, `/mock-tests`, `/how-to-pay`, `/achievements`, `/faculty`, `/about`, `/contact`. Verify HTTP 200 and zero broken assets.
2. [ ] **Google Map Embed:** Load `/contact`. Verify Chanban Youth Club Rd map loads cleanly without CSP violation.
3. [ ] **Student Registration:** Register a test student account. Verify password strength meter enforces 10+ characters and confirmation email is delivered.
4. [ ] **Login & Idle Timeout:** Log in as test student. Verify redirect to `/student/dashboard`. Verify 15-minute idle timeout triggers correctly.
5. [ ] **Bilingual Toggle:** Load `/how-to-pay`. Click `বাংলা` toggle. Verify authentic Bengali instructions and UTR explanation screens display.
6. [ ] **Test Manual Payment Request:** From student dashboard, initiate a payment request for a mock test. Verify authentic C.G.A bank account and UPI details display (`popighosh40@okicici`).
7. [ ] **Admin Protected Access:** Attempt to access `/admin/dashboard` as anonymous visitor. Verify immediate block/redirect to `/login`.
8. [ ] **Security Headers:** Inspect response headers in browser DevTools. Confirm `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, and absence of `X-Powered-By`.

---

## 8. Rollback & Disaster Recovery Plan

In the event of an unrecoverable bug, data corruption, or service outage post-launch:

### A. Application Rollback (Immediate — < 2 minutes)
1. In hosting dashboard (Vercel): Navigate to **Deployments**.
2. Select the previous stable production deployment commit.
3. Click **Instant Rollback / Promote to Production**.
4. Traffic will immediately switch back to the prior build with zero downtime.

### B. Database Rollback & Point-in-Time Recovery
1. In Supabase Dashboard: Navigate to **Database -> Backups**.
2. If Point-in-Time Recovery (PITR) is enabled: Choose the exact timestamp prior to the incident and click **Restore to timestamp**.
3. If restoring from logical dump: Run `pg_restore` against a fresh recovery database using the instructions in `docs/BACKUP_PROCEDURE.md`.
