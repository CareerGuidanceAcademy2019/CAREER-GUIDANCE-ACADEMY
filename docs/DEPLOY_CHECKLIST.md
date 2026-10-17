# Pre-Deployment Security, WAF & Production Launch Checklist
**Career Guidance Academy (C.G.A) — Udaipur, Tripura**

---

> [!IMPORTANT]
> **Mandatory Legal Review:** The Privacy Policy, Terms and Conditions, and Refund Policy pages in this codebase have been updated to reflect real-world institute mechanics, DPDP Act 2023 principles, and minor guardian consent requirements. **Review these pages with an Indian legal counsel prior to public launch** rather than assuming absolute statutory compliance.

---

## 1. Hosting-Level Firewall & WAF Recommendations

### A. Cloudflare WAF / CDN Settings
1. **Bot Fight Mode & Turnstile:**
   - Enable **Bot Fight Mode** under `Security -> Bots`.
   - Configure **Cloudflare Turnstile** on the registration and login routes.
2. **WAF Rate Limiting Rules:**
   - **General Traffic Rule:** Threshold 120 requests per 1 minute per IP. Action: Managed Challenge.
   - **Authentication Endpoints (`/api/auth/*`, `/login`, `/register`):** Threshold 20 requests per 15 minutes per IP. Action: Block / Managed Challenge.
   - **Enquiry Form Submission (`/contact`, `/api/enquiries`):** Threshold 5 requests per 1 hour per IP. Action: Block.
3. **Managed Rulesets (OWASP):**
   - Enable **Cloudflare Managed Ruleset** and **OWASP Core Ruleset** with Paranoia Level 2.
   - Set anomaly threshold to block SQL injection, remote code execution, and cross-site scripting strings.
4. **Geo & Traffic Routing:**
   - Prioritize domestic traffic (`Country: IN - India`).
   - Challenge or block known anonymous proxy ASNs, Tor exit nodes, and high-abuse commercial hosting providers.
5. **TLS / HTTPS:**
   - Set SSL/TLS Encryption mode to **Full (Strict)**.
   - Set **Minimum TLS Version** to `TLS 1.2` (Recommended: `TLS 1.3`).
   - Enable **Automatic HTTPS Rewrites** and **HSTS** (max-age 63072000s, includeSubDomains, preload).

---

## 2. Supabase Production Dashboard Settings
1. **Authentication:**
   - Navigate to `Authentication -> Providers -> Email`.
   - Ensure **Confirm Email** is **Enabled**.
   - Enable **Secure Email Change**.
   - Enforce **Minimum Password Length:** 10 characters.
2. **Multi-Factor Authentication (MFA):**
   - Navigate to `Authentication -> MFA`.
   - Set **TOTP** to **Enabled**.
   - Restrict administrative accounts to `AAL2`.
3. **CAPTCHA Protection:**
   - Navigate to `Authentication -> Bot Protection`.
   - Enable **Cloudflare Turnstile** or **hCaptcha** for Supabase Auth sign-ups and password resets.
4. **Database Backups & PITR:**
   - Navigate to `Database -> Backups`.
   - Enable **Point-in-Time Recovery (PITR)**.
   - Perform a recovery drill to a separate test project to verify data integrity.
5. **Security & Performance Advisors:**
   - Run Supabase Security Advisor and verify zero critical RLS warnings remain.
   - Run Performance Advisor and confirm all indexes on foreign keys and search columns are active.

---

## 3. Environment Variable Rotation & Production Hygiene
- [ ] **Rotate Secret Keys:** Generate new Supabase Service Role and DB passwords before public DNS switch.
- [ ] **Verify Client Bundles:** Verify `SUPABASE_SERVICE_ROLE_KEY` and personal access tokens never exist in `NEXT_PUBLIC_` or compiled JS chunks.
- [ ] **DNS & Custom Domain:** Configure apex domain `careerguidanceacademy.in` and `www` pointing to Vercel/Cloudflare with DNSSEC enabled.
- [ ] **Uptime & Error Monitoring:** Set up Sentry or Logflare for uncaught exception alerts without logging sensitive PII.
- [ ] **Independent Security Audit:** Conduct an independent penetration test before processing live UPI payments at scale.
