# Performance & Load Testing Report

**System:** Career Guidance Academy (C.G.A) Web Application  
**Platform:** Next.js 16.4.2 App Router | React 19 | Turbopack | Supabase Postgres  
**Testing Tools:** Autocannon v8.0.0, Playwright CDP Performance Observer, Lighthouse Metrics  
**Execution Date:** 2026-10-17  
**Environment:** Local Production Build (`http://localhost:3005`) against Live Supabase Project  

---

## 1. Executive Summary

A comprehensive performance and high-concurrency load testing suite was conducted across 5 realistic stress scenarios. The testing verified system throughput, p50/p95/p99 latency distributions, memory usage, transaction isolation, and database index efficiency.

### Core Web Vitals & Lighthouse Scores

| Page Audited | First Contentful Paint (FCP) | DOM Content Loaded | Performance Score | Accessibility | Best Practices | SEO |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `/` (Homepage) | 128 ms | 51 ms | **98 / 100** | **95 / 100** | **96 / 100** | **100 / 100** |
| `/courses` | 160 ms | 31 ms | **98 / 100** | **95 / 100** | **96 / 100** | **100 / 100** |
| `/mock-tests` | 104 ms | 31 ms | **98 / 100** | **95 / 100** | **96 / 100** | **100 / 100** |
| `/how-to-pay` | 152 ms | 36 ms | **98 / 100** | **95 / 100** | **96 / 100** | **100 / 100** |

All core public pages exceed the target threshold of 90+ across Performance, Accessibility, Best Practices, and SEO.

---

## 2. Load Testing Scenarios & Concurrency Results

### Scenario (a): 300 Concurrent Visitors on Public Pages
Simulated 300 simultaneous users browsing the institute website across Home, Course Directory, CBT Mock Tests, and How-to-Pay guides.

- **Throughput:** 962 to 1,151 requests / second
- **Latency Distribution:**
  - **p50:** 258 ms – 301 ms
  - **p99:** 431 ms – 524 ms (on cache hits)
- **Bottleneck Identified & Remediated:**  
  *Initial state:* `src/proxy.ts` executed a remote HTTPS call to `supabase.auth.getUser()` on *every single request*, including anonymous public visits. At 300 concurrent connections, this exhausted the Supabase connection pool.  
  *Resolution:* Refactored proxy middleware to inspect incoming cookies first (`hasAuthCookie`). Anonymous public page requests now bypass remote auth calls entirely, eliminating 1,000+ unnecessary remote requests/second and cutting latency by ~60%.

### Scenario (b): 200 Students Logging In Under Load
Simulated 200 students attempting simultaneous access to `/login` during peak announcement windows.

- **Throughput:** 1,506 requests / second
- **Latency Distribution:**
  - **p50:** 126 ms
  - **p99:** 411 ms
- **Error Rate:** 0.00% (Zero dropped connections)

### Scenario (c): Mock Test Platform Load & CBT Engine
Simulated 200 candidates starting tests simultaneously and browsing questions.

- **Throughput:** 1,135 requests / second
- **Latency Distribution:**
  - **p50:** 168 ms
  - **p99:** 276 ms
- **Error Rate:** 0.00%

### Scenario (d): 50 Concurrent Payment Flow Requests
Simulated 50 simultaneous candidates fetching payment guides, UPI QR details, and bank account numbers.

- **Throughput:** 1,024 requests / second
- **Latency Distribution:**
  - **p50:** 46 ms
  - **p99:** 83 ms
- **Error Rate:** 0.00%

### Scenario (e): 20 Concurrent Admin Exports & Handlers
Simulated 20 administrative requests running CSV financial exports and student data queries.

- **Throughput:** 39.9 req/sec (bounded by 5,000-row capped streaming and requireAdmin session verification)
- **Latency Distribution:**
  - **p50:** 343 ms
  - **p99:** 1,717 ms
- **Memory Footprint:** Node.js memory stabilized under 140MB; no server crashes or unbounded memory growth.

---

## 3. Concurrency Invariants & Race Condition Verification

### 1. Last-Seat Enrolment Race Condition
- **Test:** 20 simultaneous approval requests dispatched against a batch with exactly 3 remaining open seats.
- **Result:** **PASSED.**  
  Exactly 3 candidates were enrolled into the batch. The remaining 17 transactions were automatically flagged as `refund_due` by the database lock mechanism (`FOR UPDATE`). Zero batch over-subscription occurred.

### 2. One-Attempt-Per-Test Invariant
- **Test:** 10 simultaneous attempt-start actions dispatched for the exact same candidate on the same mock test.
- **Result:** **PASSED.**  
  Exactly 1 active attempt record was inserted into `public.mock_attempts`. The 9 concurrent duplicate requests were rejected by unique constraint enforcement.

---

## 4. Database Optimizations & Applied Indexes

Applied migration `supabase/migrations/0012_performance_indexes.sql`:
1. `idx_payment_requests_student_status` on `payment_requests(student_id, status)`
2. `idx_payment_requests_status_created` on `payment_requests(status, created_at desc)`
3. `idx_payment_requests_utr_norm` on `payment_requests(utr_normalized)`
4. `idx_payment_requests_ref_code` on `payment_requests(reference_code)`
5. `idx_mock_attempts_test_student` on `mock_attempts(test_id, student_id)`
6. `idx_mock_attempts_student_submitted` on `mock_attempts(student_id, submitted_at)`
7. `idx_mock_questions_test_pos` on `mock_questions(test_id, position)`
8. `idx_series_enrollments_student_series` on `series_enrollments(student_id, series_id)`
9. `idx_enrollments_course_date` on `enrollments(course_id, enrolled_date desc)`
10. `idx_enrollments_student_course` on `enrollments(student_id, course_id)`
11. `idx_security_audit_created` on `security_audit_log(created_at desc)`
12. `idx_rate_limit_key_reset` on `rate_limit_entries(key, reset_at)`

---

## 5. Free-Tier Supabase Limits & Production Deployment Guidance

Deploying on the Supabase Free Plan imposes physical constraints that must be monitored:

| Supabase Metric | Free Tier Quota | Expected Usage (C.G.A) | Risk / Recommendation |
| :--- | :--- | :--- | :--- |
| **Direct Connections** | 15 direct connections | 20–50 concurrent users | **High Risk:** Do NOT connect directly to port 5432. Always use Supabase Connection Pooler (Transaction Mode, port 6543) via PgBouncer. |
| **Auth Emails** | 30 emails / hour | Exam announcement surges | **Critical Risk:** 30 emails/hr will be exhausted immediately on registration surges. Configure custom SMTP (Resend, Postmark, or SendGrid) in Supabase Auth settings before launch. |
| **Storage Quota** | 1 GB total storage | ~200 payment proofs / month (~200MB) | **Low-Medium:** Enforce client-side image compression (JPG/WebP, max 5MB, 1200px max width) before upload. |
| **Database Size** | 500 MB | ~20 MB (first year) | **Low:** Run periodic purge of expired rate-limit rows (`prune_expired_rate_limits()`) and candidate purges. |
| **Egress Bandwidth** | 2 GB / month | Public asset downloads | **Medium:** Cache static images and fonts behind Cloudflare CDN or Vercel Edge Cache to keep Supabase egress minimal. |
