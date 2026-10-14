import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const logoPath = path.join(rootDir, 'public', 'cga-logo.png');
let logoBase64 = '';
if (fs.existsSync(logoPath)) {
  const logoBuffer = fs.readFileSync(logoPath);
  logoBase64 = 'data:image/png;base64,' + logoBuffer.toString('base64');
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Career Guidance Academy - Detailed Project Overview</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 14mm 12mm 14mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e293b;
      line-height: 1.45;
      font-size: 9.5pt;
      margin: 0;
      padding: 0;
      background: #ffffff;
    }
    h1, h2, h3, h4 {
      color: #0a0e2a;
      margin-top: 0;
      font-weight: 700;
    }
    h1 {
      font-size: 16pt;
      margin-bottom: 2px;
      letter-spacing: -0.02em;
    }
    h2 {
      font-size: 12pt;
      border-bottom: 2px solid #0056b3;
      padding-bottom: 3px;
      margin-top: 14px;
      margin-bottom: 8px;
    }
    h3 {
      font-size: 10.5pt;
      color: #0056b3;
      margin-top: 10px;
      margin-bottom: 4px;
    }
    p {
      margin-top: 0;
      margin-bottom: 6px;
    }
    .header-banner {
      border: 1.5px solid #0056b3;
      border-radius: 8px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(135deg, #f8faff 0%, #eef4ff 100%);
      margin-bottom: 12px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header-logo {
      width: 56px;
      height: 56px;
      object-fit: contain;
      border-radius: 6px;
      background: #ffffff;
      padding: 2px;
      border: 1px solid #cbd5e1;
    }
    .header-titles h1 {
      color: #0a0e2a;
      font-size: 15pt;
      margin: 0;
    }
    .header-titles .subtitle {
      color: #0056b3;
      font-weight: 600;
      font-size: 9.5pt;
      margin-top: 2px;
    }
    .header-titles .loc {
      color: #475569;
      font-size: 8pt;
      margin-top: 1px;
    }
    .header-badge {
      text-align: right;
      font-size: 8pt;
      color: #475569;
      line-height: 1.35;
    }
    .badge-pill {
      display: inline-block;
      background: #0056b3;
      color: #ffffff;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 3px;
    }

    .callout {
      background: #f1f5f9;
      border-left: 4px solid #0056b3;
      padding: 8px 12px;
      border-radius: 0 6px 6px 0;
      font-size: 9pt;
      margin-bottom: 10px;
    }
    .callout-title {
      font-weight: 700;
      color: #0a0e2a;
      margin-bottom: 2px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      font-size: 8.5pt;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 5px 7px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background-color: #0a0e2a;
      color: #ffffff;
      font-weight: 600;
      font-size: 8pt;
    }
    tr:nth-child(even) td {
      background-color: #f8fafc;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
    }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 10px;
      background: #ffffff;
      page-break-inside: avoid;
    }
    .card-title {
      font-weight: 700;
      color: #0056b3;
      font-size: 9pt;
      margin-bottom: 4px;
    }

    .badge-sm {
      display: inline-block;
      padding: 1px 5px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: 700;
    }
    .badge-blue { background: #dbeafe; color: #1e40af; }
    .badge-orange { background: #ffedd5; color: #9a3412; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-purple { background: #f3e8ff; color: #6b21a8; }

    ul, ol {
      margin-top: 0;
      margin-bottom: 6px;
      padding-left: 16px;
    }
    li {
      margin-bottom: 2px;
    }

    .page-break {
      page-break-before: always;
    }

    .footer {
      border-top: 1px solid #cbd5e1;
      margin-top: 12px;
      padding-top: 6px;
      display: flex;
      justify-content: space-between;
      color: #64748b;
      font-size: 7.5pt;
    }

    .tag-container {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 4px;
    }
  </style>
</head>
<body>

  <!-- PAGE 1: HEADER & EXECUTIVE SUMMARY -->
  <div class="header-banner">
    <div class="header-left">
      ` + (logoBase64 ? `<img src="${logoBase64}" class="header-logo" alt="CGA Logo" />` : '') + `
      <div class="header-titles">
        <h1>CAREER GUIDANCE ACADEMY (C.G.A)</h1>
        <div class="subtitle">Comprehensive System Architecture & Detailed Project Overview</div>
        <div class="loc">&#128205; Chanban Youth Club Rd, behind Youth Club, Udaipur, Tripura 799114</div>
      </div>
    </div>
    <div class="header-badge">
      <span class="badge-pill">Academic Platform v2.0</span><br>
      <strong>Stack:</strong> Next.js 16 + Supabase<br>
      <strong>Date:</strong> October 2026
    </div>
  </div>

  <div class="callout">
    <div class="callout-title">Executive Summary</div>
    <strong>Career Guidance Academy (C.G.A)</strong> is an enterprise-grade coaching institute web platform and Learning Management System (LMS) specifically tailored for competitive examination aspirants and school students in Tripura. The platform seamlessly integrates a public discovery portal, an authenticated student learning environment, and a robust institute management and CMS console.
  </div>

  <h2>1. Project Scope & Coaching Divisions</h2>
  <p>The academy caters to four major academic categories, each with tailored curricula, mock test series, and learning materials:</p>

  <div class="grid-2">
    <div class="card">
      <div class="card-title">1. Teaching & State Recruitment Exams</div>
      <p style="font-size: 8pt; color: #475569; margin-bottom: 4px;">Comprehensive preparation for Tripura education and recruitment boards:</p>
      <div class="tag-container">
        <span class="badge-sm badge-blue">Tripura TET Paper I & II</span>
        <span class="badge-sm badge-blue">STGT (Secondary Teachers)</span>
        <span class="badge-sm badge-blue">STPGT (Post Graduate)</span>
        <span class="badge-sm badge-blue">TPSC (Combined / Departmental)</span>
        <span class="badge-sm badge-blue">JRBT Group C & D</span>
      </div>
    </div>

    <div class="card">
      <div class="card-title">2. Banking, SSC & Railway Exams</div>
      <p style="font-size: 8pt; color: #475569; margin-bottom: 4px;">National level competitive examinations training:</p>
      <div class="tag-container">
        <span class="badge-sm badge-orange">IBPS PO & Clerk</span>
        <span class="badge-sm badge-orange">SBI PO & Junior Associates</span>
        <span class="badge-sm badge-orange">SSC CGL / CHSL / MTS</span>
        <span class="badge-sm badge-orange">RRB NTPC & Group D</span>
      </div>
    </div>

    <div class="card">
      <div class="card-title">3. Other Competitive Examinations</div>
      <p style="font-size: 8pt; color: #475569; margin-bottom: 4px;">Specialized defense and higher education entrance programs:</p>
      <div class="tag-container">
        <span class="badge-sm badge-purple">Tripura Police SI & Constable</span>
        <span class="badge-sm badge-purple">Defence Forces Recruitment</span>
        <span class="badge-sm badge-purple">CUET (UG Entrance)</span>
      </div>
    </div>

    <div class="card">
      <div class="card-title">4. School Foundation Coaching (Class VII to X)</div>
      <p style="font-size: 8pt; color: #475569; margin-bottom: 4px;">Board-specific academic foundation coaching:</p>
      <div class="tag-container">
        <span class="badge-sm badge-green">TBSE Class VII, VIII, IX, X</span>
        <span class="badge-sm badge-green">CBSE Class VII, VIII, IX, X</span>
        <span class="badge-sm badge-green">Dedicated Board Batches</span>
      </div>
    </div>
  </div>

  <h2>2. Technical Architecture & Stack</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Layer</th>
        <th style="width: 35%;">Technology</th>
        <th style="width: 40%;">Role in Application</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Frontend Framework</strong></td>
        <td>Next.js 16 (App Router), React 19, TypeScript 5</td>
        <td>Server-side rendering, nested layouts, rapid initial loads, and edge optimization.</td>
      </tr>
      <tr>
        <td><strong>Styling & Design System</strong></td>
        <td>Tailwind CSS v4, Lucide Icons</td>
        <td>Custom academic palette (Navy #0A0E2A, Royal Blue #0056B3, Torch Orange #EA580C), responsive grids, and clean cards.</td>
      </tr>
      <tr>
        <td><strong>Database & RLS</strong></td>
        <td>Supabase PostgreSQL with Row Level Security</td>
        <td>Multi-tenant data isolation, strict authorization policies, sequences, triggers, and automated cascade scripts.</td>
      </tr>
      <tr>
        <td><strong>Authentication</strong></td>
        <td>Supabase Auth (@supabase/ssr)</td>
        <td>Session cookies, role metadata (student vs admin), email verification, and password recovery.</td>
      </tr>
      <tr>
        <td><strong>Document Engine</strong></td>
        <td>pdf-parse & Custom RegEx Ingestion</td>
        <td>Automated extraction of questions, options (A to D), answer keys, and explanations from uploaded PDF question papers.</td>
      </tr>
      <tr>
        <td><strong>State & Cache Layer</strong></td>
        <td>React Context (CgaContext) & Service Layer</td>
        <td>Optimistic UI updates, in-app toast notices, reactive student session synchronization, and hybrid seed fallbacks.</td>
      </tr>
    </tbody>
  </table>

  <!-- PAGE BREAK FOR CLEAN SECTIONING -->
  <div class="page-break"></div>

  <!-- PAGE 2: THREE CORE PORTALS -->
  <h2>3. Core Environments & Features</h2>

  <h3>A. Public Web Portal (Open Access)</h3>
  <ul>
    <li><strong>Homepage (<code>/</code>):</strong> Hero banner with institute mission, 4-division coaching directory, featured courses, faculty highlights, student testimonials, and direct enquiry modal.</li>
    <li><strong>Course Catalogue (<code>/courses</code>):</strong> Advanced search and multi-facet filtering (Category, Mode: Online/Offline, Status: Open for Admission / Batch Closed, and Board: TBSE vs CBSE).</li>
    <li><strong>Achievements (<code>/achievements</code>):</strong> Board toppers and state rank-holders gallery filterable by exam category with scores and testimonial quotes.</li>
    <li><strong>Faculty Directory (<code>/faculty</code>):</strong> Subject mentor profiles with designations, academic credentials, teaching experience, and specializations.</li>
    <li><strong>About Us & Contact (<code>/about</code>, <code>/contact</code>):</strong> Campus history, director's address, embedded Udaipur Google Maps, phone, email, and validated admission inquiry form that records into the database.</li>
    <li><strong>Authentication Flows (<code>/login</code>, <code>/register</code>, <code>/forgot-password</code>):</strong> Tabbed sign-in, self-registration generating sequential ID <code>CGA-YYYY-XXX</code>, and secure password recovery.</li>
  </ul>

  <h3>B. Student Learning Portal (<code>/student/*</code>)</h3>
  <ul>
    <li><strong>Student Dashboard (<code>/student/dashboard</code>):</strong> Welcome banner, active enrolled course cards with syllabus progress meters, scheduled upcoming tests, and fee dues status.</li>
    <li><strong>Course Self-Enrolment (<code>/student/courses</code>):</strong> Choose between <strong>Full Payment</strong> or <strong>2-Part Instalment Plan</strong>, complete simulated checkout, auto-decrement available batch seats, download instant official fee receipt, or join waiting list when full.</li>
    <li><strong>My Courses (<code>/student/my-courses</code>):</strong> Batch timings, assigned faculty mentor, syllabus completion tracker, and shortcuts to associated materials and tests.</li>
    <li><strong>Study Materials Library (<code>/student/materials</code>):</strong> Gated soft-copy PDFs and paid notes unlocked only for enrolled batches. Includes an <strong>In-Browser Anti-Piracy Watermarked Reader</strong> that overlays the student's name, ID, and timestamp across pages.</li>
    <li><strong>Mock Tests Arena (<code>/student/tests</code>):</strong> Timed Computer-Based Test (CBT) engine featuring:
      <ul>
        <li>Real-time countdown timer, question palette (Answered, Unanswered, Marked for Review).</li>
        <li>Formula-based negative marking calculation.</li>
        <li><strong>Exam Integrity:</strong> Faculty solutions and answer keys remain strictly locked while taking the test.</li>
        <li>Instant scorecard with batch merit rank, accuracy percentage, and full question explanations unlocked upon submission.</li>
      </ul>
    </li>
    <li><strong>Fee Ledger & Receipts (<code>/student/fees</code>):</strong> Comprehensive breakdown of total course fee, paid amount, pending balance, instalment clearance flow, and printable official receipts.</li>
  </ul>

  <h3>C. Institute Administrator & CMS Console (<code>/admin/*</code>)</h3>
  <ul>
    <li><strong>Executive KPI Dashboard (<code>/admin/dashboard</code>):</strong> Total student enrollment, active courses, total institute revenue, outstanding fee dues, and visual division seat-occupancy charts.</li>
    <li><strong>Student Management (<code>/admin/students</code>):</strong> Search and filter student directory, 360° student modal (enrolled courses, fee transactions, test attempts), export roster to CSV/Excel, and generate temporary sign-in credentials.</li>
    <li><strong>Atomic Candidate Purge (Cascade Deletion):</strong> Admin ability to permanently scrub any candidate across <code>test_attempts</code>, <code>fee_payments</code>, <code>enrollments</code>, <code>waiting_list</code>, <code>profiles</code>, and <code>auth.users</code> in a single safe atomic operation.</li>
    <li><strong>Course & Batch Control (<code>/admin/courses</code>):</strong> Create and edit courses, adjust fee schedules, and open/close admissions in real-time.</li>
    <li><strong>Automated PDF Test Ingestion (<code>/admin/tests</code>):</strong> Upload PDF/text question papers; intelligent parser extracts 50–100 questions, choices (A–D), answer keys, and explanations with one-click key modifications before publishing.</li>
    <li><strong>Fee Management & Defaulter Tracking (<code>/admin/fees</code>):</strong> Record counter cash/UPI payments, issue receipts, and filter fee defaulters by batch.</li>
    <li><strong>Content Management System:</strong> Dedicated management interfaces for Study Materials (<code>/admin/materials</code>), Faculty (<code>/admin/faculty</code>), Achievements (<code>/admin/achievements</code>), Announcements (<code>/admin/announcements</code>), and Live Site Content (<code>/admin/site-content</code>).</li>
  </ul>

  <!-- PAGE BREAK FOR DATABASE & ARCHITECTURE -->
  <div class="page-break"></div>

  <!-- PAGE 3: DATA SCHEMA & SECURITY -->
  <h2>4. Database Schema & Relational Design</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 20%;">Table Name</th>
        <th style="width: 25%;">Keys & Relationships</th>
        <th style="width: 55%;">Core Attributes & Responsibilities</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>profiles</code></td>
        <td><code>id</code> (UUID PK &rarr; auth.users)</td>
        <td>role ('student'|'admin'), student_code (Unique 'CGA-2026-XXX'), name, email, phone, guardian_name, qualification, target_exam, status ('Active'|'Inactive').</td>
      </tr>
      <tr>
        <td><code>courses</code></td>
        <td><code>id</code> (Text PK), faculty_id (FK)</td>
        <td>name, category, mode ('Online'|'Offline'), board (TBSE/CBSE), class_level, price, first_instalment, batch_name, batch_size, seats_available, waiting_list_count, status ('Open for Admission'|'Batch Closed').</td>
      </tr>
      <tr>
        <td><code>faculty</code></td>
        <td><code>id</code> (Text PK)</td>
        <td>name, designation, subject, qualification, experience, photo, bio, specialization_tags.</td>
      </tr>
      <tr>
        <td><code>enrollments</code></td>
        <td><code>id</code> (UUID PK), student_id, course_id</td>
        <td>enrolled_date, progress (0–100%), total_fee, paid_amount, due_amount, next_due_date. Unique constraint on (student_id, course_id).</td>
      </tr>
      <tr>
        <td><code>fee_payments</code></td>
        <td><code>id</code> (UUID PK), receipt_no (UK)</td>
        <td>student_id, course_id, amount, payment_mode (UPI, Card, Net Banking, Cash), payment_type (Full Payment, Instalment 1/2, Balance Clearance), date, remarks.</td>
      </tr>
      <tr>
        <td><code>mock_tests</code></td>
        <td><code>id</code> (Text PK), course_id (FK)</td>
        <td>title, batch_name, duration_minutes, total_marks, marks_per_question, negative_marking, status ('Published'|'Draft'), questions (JSONB array with answer keys & explanations).</td>
      </tr>
      <tr>
        <td><code>test_attempts</code></td>
        <td><code>id</code> (UUID PK), test_id, student_id</td>
        <td>score, total_marks, correct_count, wrong_count, unattempted_count, accuracy, time_taken_minutes, submitted_at, answers (JSONB submitted choices).</td>
      </tr>
      <tr>
        <td><code>study_materials</code></td>
        <td><code>id</code> (Text PK), course_id (FK)</td>
        <td>title, type ('Book PDF'|'Paid Notes'), author, pages, file_size, preview_sections (JSONB), uploaded_date.</td>
      </tr>
      <tr>
        <td><code>announcements</code></td>
        <td><code>id</code> (Text PK)</td>
        <td>title, content, target_batch ('All Batches' or specific batch), priority ('Normal'|'Important'|'Urgent'), date, author.</td>
      </tr>
      <tr>
        <td><code>enquiries</code></td>
        <td><code>id</code> (UUID PK)</td>
        <td>name, phone, email, course_interest, message, created_at.</td>
      </tr>
      <tr>
        <td><code>waiting_list</code></td>
        <td>(student_id, course_id) Composite PK</td>
        <td>Auto-queued students when course seats are exhausted.</td>
      </tr>
      <tr>
        <td><code>site_content</code></td>
        <td><code>id</code> (Int PK = 1)</td>
        <td>CMS-managed JSONB storing hero banners, institute mission/vision, and contact phone/address.</td>
      </tr>
    </tbody>
  </table>

  <h2>5. Security, Row Level Security (RLS) & RPCs</h2>
  <div class="grid-2">
    <div class="card">
      <div class="card-title">Row Level Security (RLS) Policies</div>
      <ul style="font-size: 8pt; color: #334155; margin-bottom: 0;">
        <li><strong>Public:</strong> Read-only access to published courses, faculty, achievements, and CMS site content. Can insert public inquiries.</li>
        <li><strong>Students:</strong> Strictly restricted to their own profiles, their own enrollment records, unlocked course materials, fee ledger, and test scores.</li>
        <li><strong>Admins:</strong> Evaluated through Postgres role checks and authenticated via the Supabase Service Role Key on backend server actions.</li>
      </ul>
    </div>

    <div class="card">
      <div class="card-title">Transactional Stored Procedures (RPCs)</div>
      <ul style="font-size: 8pt; color: #334155; margin-bottom: 0;">
        <li><code>submit_mock_test_attempt()</code>: Server-authoritative calculation of test scores, negative markings, accuracy, and attempt records.</li>
        <li><code>enrol_student()</code>: Atomically records enrollment, creates payment receipt, and decrements batch seats within a single transaction.</li>
        <li><code>purge_candidate()</code>: Admin cascade that purges all student records across five tables plus authentication credentials.</li>
      </ul>
    </div>
  </div>

  <h2>6. Unique Architectural Innovations</h2>
  <div class="grid-2">
    <div class="card">
      <div class="card-title">1. Bulk AI / RegEx Question Ingestion</div>
      <p style="font-size: 8pt; color: #475569;">
        Parses complex question formats: numbered questions (<code>1.</code>, <code>Q1.</code>), option choices (<code>(A)–(D)</code>, <code>A)–D)</code>), inline answer keys (<code>Ans: B</code>), and separate bottom answer tables. Eliminates hours of manual data entry.
      </p>
    </div>
    <div class="card">
      <div class="card-title">2. Dynamic Document Watermarking</div>
      <p style="font-size: 8pt; color: #475569;">
        Watermarks PDF study notes in real-time with the active student's name, roll code, and timestamp, effectively preventing study material piracy.
      </p>
    </div>
  </div>

  <div class="footer">
    <div><strong>Career Guidance Academy (C.G.A)</strong> &bull; Udaipur, Tripura 799114</div>
    <div>System Architecture & Overview Document &bull; Official</div>
    <div>Page 3 of 3</div>
  </div>

</body>
</html>`;

const tempHtmlPath = path.join(rootDir, 'scripts', 'overview.html');
fs.writeFileSync(tempHtmlPath, html, 'utf-8');
console.log('Successfully generated HTML at:', tempHtmlPath);
