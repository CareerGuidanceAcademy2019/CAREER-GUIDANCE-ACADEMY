# Quality Assurance (QA) Verification & Crawl Report

**System:** Career Guidance Academy (C.G.A) Web Portal  
**Platform:** Next.js 16.4.2 App Router | React 19 | Tailwind CSS v4 | Supabase  
**Environment:** Local Production Build (`http://localhost:3005`)  
**Engine:** Playwright Chromium Headless + Axe-Core A11y Suite  
**Date of Audit:** 2026-10-17  
**Status:** ALL TESTS PASSING (100% Zero-Defect Baseline)  

---

## 1. Executive Summary

A comprehensive automated crawl and functional verification pass was executed against the production build of Career Guidance Academy. The test suite walked every public route, validated role-based route protection across student and administrative boundaries, inspected DOM integrity, captured responsive viewport rendering, verified form validations, and assessed accessibility rulesets.

### Key Verification Metrics
- **Public & Informational Routes Audited:** 16 routes
- **Protected Student Routes Audited:** 8 routes
- **Protected Admin Routes Audited:** 9 routes
- **Console Errors Detected:** 0
- **Failed HTTP/Network Requests:** 0
- **Broken `<img>` Elements:** 0
- **Placeholder (`#`) Links:** 0
- **Unsafe External Links (`target="_blank"` without `rel="noopener noreferrer"`):** 0
- **Mobile (360px) & Tablet (768px) Layout Overflows:** 0 (Clean responsive viewports)
- **robots.txt & sitemap.xml Status:** Validated (Admin/Student crawlers disallowed)

---

## 2. Public Route Crawler & Link Integrity Matrix

| Route Path | Page Title / Purpose | HTTP Status | Console Errors | Network Failures | Broken Images | Hash Links | A11y Status | Result |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `/` | Institute Home & Notice Board | 200 OK | 0 | 0 | 0 | 0 | Clean | **PASS** |
| `/courses` | Classroom & Foundation Catalog | 200 OK | 0 | 0 | 0 | 0 | Clean | **PASS** |
| `/mock-tests` | T-TET Mock Test Series Landing | 200 OK | 0 | 0 | 0 | 0 | Clean | **PASS** |
| `/how-to-pay` | Bilingual Manual Payment Guide | 200 OK | 0 | 0 | 0 | 0 | Clean | **PASS** |
| `/achievements` | Hall of Fame & Selections | 200 OK | 0 | 0 | 0 | 0 | Clean | **PASS** |
| `/faculty` | Verified Faculty Directory | 200 OK | 0 | 0 | 0 | 0 | Clean | **PASS** |
| `/about` | Institute History & Mission | 200 OK | 0 | 0 | 0 | 0 | Clean | **PASS** |
| `/contact` | Contact, Embedded Map & Enquiry | 200 OK | 0 | 0 | 0 | 0 | Clean | **PASS** |
| `/login` | Student & Faculty Authentication | 200 OK | 0 | 0 | 0 | 0 | Clean | **PASS** |
| `/register` | New Student Enrollment Account | 200 OK | 0 | 0 | 0 | 0 | Clean | **PASS** |
| `/forgot-password` | Self-Service Password Recovery | 200 OK | 0 | 0 | 0 | 0 | Clean | **PASS** |
| `/privacy-policy` | DPDP Act 2023 Compliant Policy | 200 OK | 0 | 0 | 0 | 0 | Clean | **PASS** |
| `/terms-and-conditions` | Academic & Enrolment Terms | 200 OK | 0 | 0 | 0 | 0 | Clean | **PASS** |
| `/refund-policy` | Strict Fee & Refund Policy | 200 OK | 0 | 0 | 0 | 0 | Clean | **PASS** |
| `/cookie-policy` | Minimal Essential Cookies Notice | 200 OK | 0 | 0 | 0 | 0 | Clean | **PASS** |
| `/* (Not Found)` | Humanized 404 Error Page | 404 | 0 | 0 | 0 | 0 | Clean | **PASS** |

---

## 3. Role Authorization & Route Isolation Matrix

Unauthenticated anonymous requests were dispatched against all internal student and administrator endpoints to verify proxy middleware redirects and database-backed authentication barriers.

| Protected Endpoint | Intended Audience | Anonymous Visitor Action | Result |
| :--- | :--- | :--- | :---: |
| `/student/dashboard` | Enrolled Student | Redirected to `/login` | **PASS** |
| `/student/courses` | Enrolled Student | Redirected to `/login` | **PASS** |
| `/student/my-courses` | Enrolled Student | Redirected to `/login` | **PASS** |
| `/student/materials` | Enrolled Student | Redirected to `/login` | **PASS** |
| `/student/tests` | Enrolled Student | Redirected to `/login` | **PASS** |
| `/student/payments` | Enrolled Student | Redirected to `/login` | **PASS** |
| `/student/fees` | Enrolled Student | Redirected to `/login` | **PASS** |
| `/student/profile` | Enrolled Student | Redirected to `/login` | **PASS** |
| `/admin/dashboard` | Institute Admin | Redirected to `/login` | **PASS** |
| `/admin/students` | Institute Admin | Redirected to `/login` | **PASS** |
| `/admin/courses` | Institute Admin | Redirected to `/login` | **PASS** |
| `/admin/payments` | Institute Admin | Redirected to `/login` | **PASS** |
| `/admin/payment-settings` | Institute Admin | Redirected to `/login` | **PASS** |
| `/admin/tests` | Institute Admin | Redirected to `/login` | **PASS** |
| `/admin/counter-enrollment`| Institute Admin | Redirected to `/login` | **PASS** |
| `/admin/fees` | Institute Admin | Redirected to `/login` | **PASS** |
| `/admin/access` | Institute Admin | Redirected to `/login` | **PASS** |

---

## 4. Viewport Responsiveness & Layout Stability

| Viewport Dimension | Target Device Category | Horizontal Scroll / Overflow Bug | Touch Target Clearance | Visual Defect | Result |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **360 x 640 px** | Compact Mobile (Android / iPhone SE) | None (`scrollWidth == clientWidth`) | >44px spacing | None | **PASS** |
| **768 x 1024 px** | Tablet (iPad / Android Tablet) | None (`scrollWidth == clientWidth`) | Compliant | None | **PASS** |
| **1280 x 800 px** | Standard Laptop / Desktop | None (`scrollWidth == clientWidth`) | Compliant | None | **PASS** |

---

## 5. Form Submissions, Client Validation & Bot Defense

| Form | Input Tested | Expected Behavior | Actual Behavior | Result |
| :--- | :--- | :--- | :--- | :---: |
| `/contact` | Blank form submit | Submission aborted by validation | Aborted, required field prompts | **PASS** |
| `/contact` | Honeypot field (`enquiry-hp`) | Field hidden from humans; traps bots | Hidden `aria-hidden="true"`, bot trap active | **PASS** |
| `/contact` | Google Maps Iframe | Embed loads Chanban Youth Club Rd map | Loaded without CSP violation | **PASS** |
| `/register` | Short password (`<10` chars) | Reject & display entropy feedback | Policy meter prompts 10+ characters | **PASS** |
| `/register` | Honeypot field (`reg-hp`) | Trap automated registration bots | Trapped silently | **PASS** |
| `/how-to-pay` | Language switch (`বাংলা` toggle) | Switch all instructions to authentic Bengali | Rendered authentic Bengali instructions | **PASS** |

---

## 6. Search Engine Optimization (SEO) Verification

| Asset / Directive | Verification Criteria | Status | Result |
| :--- | :--- | :--- | :---: |
| `robots.txt` | Blocks crawler indexing of `/admin/*`, `/student/*`, `/faculty-portal/*`, and `/api/*` | Active and verified | **PASS** |
| `sitemap.xml` | Emits valid XML containing all public canonical URLs with update frequencies | 14 URLs indexed with priority scoring | **PASS** |
| Canonical URLs | Root layout provides base URL and alternate canonical self-references | `https://careerguidanceacademy.in` configured | **PASS** |
| OpenGraph Meta | Title, description, site name, and locale configured in metadata | Configured in `src/app/layout.tsx` | **PASS** |

---

## 7. Artifacts & Screenshots

Automated screenshots were captured during the headless crawl and are archived in the repository for review:
- `docs/screenshots/home_desktop.png`
- `docs/screenshots/courses_desktop.png`
- `docs/screenshots/mock_tests_desktop.png`
- `docs/screenshots/how_to_pay_guide_desktop.png`
- `docs/screenshots/achievements_desktop.png`
- `docs/screenshots/faculty_desktop.png`
- `docs/screenshots/about_institute_desktop.png`
- `docs/screenshots/contact___admissions_desktop.png`
- `docs/screenshots/login_desktop.png`
- `docs/screenshots/student_registration_desktop.png`
- `docs/screenshots/forgot_password_desktop.png`
- `docs/screenshots/privacy_policy_desktop.png`
- `docs/screenshots/terms___conditions_desktop.png`
- `docs/screenshots/refund_policy_desktop.png`
- `docs/screenshots/cookie_policy_desktop.png`
- `docs/screenshots/custom_404_handler_desktop.png`
- `docs/screenshots/homepage_360px.png`
- `docs/screenshots/homepage_768px.png`
