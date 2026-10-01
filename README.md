# Career Guidance Academy (C.G.A) — Web Platform Prototype (Phase 1)

**Official Coaching Institute Location:**
Chanban Youth Club Rd, behind Youth Club, Udaipur, Tripura 799114

---

## 1. Overview
This repository contains the **Phase 1 Interactive Frontend Prototype** for **Career Guidance Academy (C.G.A)**, Udaipur, Tripura. It delivers a responsive, academic-grade user interface across three integrated environments:
1. **Public Website** (No login required)
2. **Student Portal** (Role-protected Student environment)
3. **Admin Portal** (Role-protected Institute Administration & CMS console)

All interactive workflows—including course enrolment, simulated fee payment & receipt generation, batch opening/closing, student management, CSV export, watermarked PDF reading, timed MCQ mock test evaluation, and public website CMS editing—persist across the browser session via an isolated service/data layer backed by `localStorage`.

---

## 2. Demo Login Credentials

You can use the **One-Click Demo Login** buttons directly on `/login`, or enter the credentials below manually:

| Role | Email Address | Password | Default User Name |
| :--- | :--- | :--- | :--- |
| **Student** | `student@cgaudaipur.in` | `password123` | Arijit Debnath (`CGA-2026-001`) |
| **Administrator** | `admin@cgaudaipur.in` | `admin123` | Dr. Subrata Majumder (Director, C.G.A) |

- **Simulated Password Reset OTP:** `240826` (on `/forgot-password`)
- **Reset Demo Data:** Click the **"Reset Demo Data"** button in the top bar at any time to restore the initial seed dataset.

---

## 3. Setup & Running Instructions

### Prerequisites
- **Node.js** v18.18+ or v20+
- **npm**

### Steps to Run Locally
```bash
# 1. Install dependencies
npm install

# 2. Start the local development server
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 4. Feature List

### A. Branding & Design System
- **Primary Palette**: Crisp White (`#FFFFFF`) background with Royal Academic Blue (`#0056B3` / `#1E3A8A`) primary accents.
- **Secondary Palette (Extracted from Uploaded C.G.A Logo)**: Crimson Red (`#DC2626`), Vibrant Torch Orange (`#EA580C`), and Deep Academic Navy (`#0A0E2A`).
- **C.G.A Official Seal**: Displayed in the Public Header, Footer, Hero showcase, Login/Register screens, Official Fee Receipts, and Browser Favicon.

### B. Public Website (No Login Required)
- **Home (`/`)**: Dynamic hero banner, institute introduction, highlights, 4 coaching divisions, featured courses, toppers preview, faculty preview, student testimonials, and registration CTA.
- **About Us (`/about`)**: Mission, vision, C.G.A Udaipur heritage, and campus details.
- **Course Catalogue (`/courses`)**: Search bar, category tabs across all 4 pre-loaded course categories, **TBSE vs. CBSE** board filters for Class VII–X, and live admission status filter (`Open for Admission` / `Batch Closed`).
  - *Pre-loaded Categories*:
    1. **Teaching & Recruitment Exams**: TET, STGT, STPGT, TPSC, JRBT
    2. **Banking, SSC & Railway**: IBPS PO/Clerk & SBI, SSC CGL/CHSL/MTS, RRB NTPC & Group-D
    3. **Other Competitive Examinations**: Tripura Police SI/Defence, CUET (UG)
    4. **School Coaching**: Separate listings per class and board for **Class VII, VIII, IX, and X under TBSE** and **Class VII, VIII, IX, and X under CBSE**
- **Achievements (`/achievements`)**: Filterable gallery of state rank-holders and board toppers.
- **Faculty (`/faculty`)**: Subject experts with qualifications, experience, and specialization tags.
- **Contact (`/contact`)**: Official Chanban Youth Club Rd, Udaipur address, phone numbers, email, embedded Google Map of Udaipur, and validated admission enquiry form.

### C. Student Portal (`/student/*`)
- **Role-Based Guard**: Prevents Admin sessions or unauthenticated visitors from accessing student-only views without signing in as a student.
- **Dashboard (`/student/dashboard`)**: Welcome banner, enrolled courses progress, upcoming mock tests, batch announcements, and fee dues summary.
- **My Profile (`/student/profile`)**: Editable personal details, profile photo selector, contact info, and enrolled batches.
- **Course Catalogue & Enrolment (`/student/courses`)**: Browse courses, choose **Full Payment** or **2-Part Instalment Plan**, complete simulated payment (`UPI`, `Card`, `Net Banking`), auto-decrement available seats, and download an official C.G.A fee receipt.
- **My Courses (`/student/my-courses`)**: Purchased courses with batch timing, faculty, syllabus progress bar, and quick links to materials & mock tests.
- **Study Materials Library (`/student/materials`)**: Soft-copy PDFs of books and paid notes unlocked automatically only for courses the student has purchased. Locked items display **"Enrol to unlock"**. Includes an **In-Browser PDF Reader with dynamic Student Name & ID Watermark** and download button.
- **Mock Tests Arena (`/student/tests`)**: Scheduled mock tests, live **Timed MCQ Exam Screen** (countdown clock, question palette, mark-for-review, negative marking), instant scorecard with explanations and **Batch Rank**, plus past attempt history.
- **Fees & Receipts (`/student/fees`)**: Total fee, paid amount, pending dues, balance payment flow, payment history, and printable/downloadable receipts.
- **Portal Achievements & Faculty (`/student/achievements`, `/student/faculty`)**.

### D. Admin Portal (`/admin/*`)
- **Role-Based Guard**: Strictly blocks Student accounts from opening any `/admin/*` route.
- **Dashboard (`/admin/dashboard`)**: KPI cards (total students, active courses, revenue collected, pending dues), visual division seat-occupancy chart, and recent fee receipts.
- **Student Management (`/admin/students`)**: Search, filter, add, edit, activate/deactivate, delete with confirmation dialog, **360° Student Detail Modal** (courses, fees, mock test scores), and **CSV/Excel Export**.
- **Course Management & Batch Control (`/admin/courses`)**: Full CRUD for courses + **Batch Control Modal** (Open/Close batch, Reopen for new admissions, adjust seat limits and waiting list count—updating the public website live).
- **Faculty Management (`/admin/faculty`)**: Add, edit, and remove faculty profiles.
- **Fee Management (`/admin/fees`)**: Record payments, generate official receipts, and **filter fee defaulters by course or batch**.
- **Study Material Management (`/admin/materials`)**: Upload/create PDF study materials and map them to courses.
- **Mock Test Management (`/admin/tests`)**: Create MCQ tests (question bank builder, marks, negative marking, duration, schedule), publish/launch for batches, and inspect student merit rank lists.
- **Achievements Management (`/admin/achievements`)**: Add, edit, and delete toppers.
- **Announcements (`/admin/announcements`)**: Post notices to all students or targeted batches.
- **Public Site CMS (`/admin/site-content`)**: Edit homepage banners, mission, vision, introduction, and contact details live.

---

## 5. What Is Simulated in Phase 1 vs. Phase 2 Production Roadmap

| Capability | Phase 1 Prototype (Current) | Phase 2 Production Enhancement |
| :--- | :--- | :--- |
| **Data Persistence** | Isolated in `/src/services/cgaService.ts` using browser `localStorage` & seed data in `/src/data/initialSeedData.ts` | Replace service methods with PostgreSQL / Supabase / Node.js REST or GraphQL APIs without changing UI components |
| **Authentication** | Simulated session with demo credentials & role guards | JWT / NextAuth with bcrypt password hashing & HTTP-only cookies |
| **Fee Payments** | Simulated checkout modal (Full / Instalment) & instant receipt generator | Live Razorpay / PayU payment gateway webhook integration |
| **Study Material PDFs** | In-browser watermarked reader & downloadable watermarked document | Cloud object storage (AWS S3 / Supabase Storage) with server-side PDF watermarking |
| **Notifications** | In-app toast notifications & portal announcement bulletin | Automated SMS / WhatsApp & Email alerts for fee dues, batch timings, and test results |
| **Future Add-ons** | — | Live interactive classes (Zoom/WebRTC integration) & dedicated Android/iOS mobile app |
