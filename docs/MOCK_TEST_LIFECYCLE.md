# Mock Test & Diagram System Lifecycle Guide

Career Guidance Academy (C.G.A) — Production Engineering Specification

---

## 1. Executive Summary & Architecture

The Career Guidance Academy Mock Test & Diagram System provides a comprehensive, high-security Computer-Based Test (CBT) platform, soft-copy question paper distribution system, and visual diagram authoring suite tailored for state and national competitive examinations (TPSC, Combined Competitive Exam, Banking, SSC, Railways, and Defense).

### Core Pillars
1. **Access Isolation**: Strict hierarchical organization (Series -> Subjects -> Mock Tests & Question Papers) with cryptographic and transactional enrollment boundaries.
2. **Visual & Mathematical Fidelity**: High-resolution diagrams, maps, tables, circuits, and KaTeX mathematical typesetting across questions, options, shared reading passages, and explanations.
3. **Hardened Asset Processing**: Sharp-based server image ingestion with decompression bomb defense, magic-byte inspection, and dual-mode lossy/lossless WebP optimization.
4. **Zero-Pollution Preview**: Complete administrative simulation of candidate testing conditions with zero database writes.
5. **Dynamic Candidate Watermarking**: Anti-leak PDF watermarking on soft-copy question papers with student identity and audit timestamps.
6. **Storage Quota Governance**: Lifecycle auto-purge with question statistics preservation, self-contained archive ZIP export with SHA-256 checksums, and one-click restoration.

---

## 2. Access Structure & Security Invariants

### 2.1 Navigation Hierarchy
Candidate access is structured in a strict three-level tree:
```
Mock Test Portal (/student/tests)
 ├── Series Header (e.g., "TPSC Combined Competitive 2026")
 │    ├── Full-Length Mocks Section
 │    │    └── Full Mock Tests (Exam-simulation papers across all subjects)
 │    └── Subject Sections (e.g., "General Studies", "English Comprehension", "Tripura History & Culture")
 │         ├── Subsection (a): "Mock Tests"
 │         │    └── Individual Topic & Subject Tests -> [Appear Test Button]
 │         └── Subsection (b): "Question Papers"
 │              └── Soft-Copy Downloadable PDFs -> [Download Watermarked Paper]
```

### 2.2 Strict Enrolment Isolation
- **Rule**: Enrolment in Series A **never** unlocks Series B.
- **Verification Gate**:
  - `series_enrollments` records link `student_id` to `series_id` with `status = 'active'`.
  - Alternatively, course enrollments link `student_id` to `course_id` where `courses.id = series.course_id`.
  - Storage bucket direct downloads are strictly disabled via Supabase Row-Level Security (RLS). Every file access must route through `/api/mock-tests/images/[imagePath]` or `/api/mock-tests/papers/[paperId]` which validates the student's active enrollment before returning content.
  - Attempting to access an un-enrolled test or question paper returns `HTTP 403 Forbidden` and logs a security event.

### 2.3 Time Window Security
- Exam availability is governed by server clock (`now()` in PostgreSQL and `new Date()` validated against DB timestamps on API routes).
- Client-side system clock manipulation has zero effect on test access, timer duration, or submission validity.

---

## 3. Database Schema & Migration Reference

The system extends the database schema across three migrations (`0015`, `0016`, and `0017`):

### 3.1 Migration 0015: Diagram & Passage Support
- **`mock_question_groups`**:
  - `id` (UUID, PK)
  - `test_id` (UUID, FK -> `mock_tests.id` ON DELETE CASCADE)
  - `position` (INT, ordering)
  - `passage_text` (TEXT, reading comprehension passage, case study, or problem description)
  - `image_path` (TEXT, shared map, chart, or diagram)
  - `image_alt` (TEXT, accessibility description)
  - `created_at` (TIMESTAMPTZ)
- **`mock_questions` additions**:
  - `group_id` (UUID, FK -> `mock_question_groups.id` ON DELETE SET NULL)
  - `image_path` (TEXT, question statement diagram)
  - `image_alt` (TEXT, description)
  - `image_width` (INT)
  - `image_height` (INT)
  - `options` (JSONB): Upgraded to support rich objects `[{ "key": "A", "text": "...", "imagePath": "...", "imageAlt": "..." }]` while maintaining backward compatibility with legacy `string[]` arrays via helper functions.
- **`mock_question_keys` additions**:
  - `explanation_image_path` (TEXT, solution diagram)
  - `explanation_image_alt` (TEXT)
- **Private Storage Bucket**:
  - Bucket name: `mock-question-images`
  - Access: Private (RLS blocks public read; access requires signed URL or proxy verification).

### 3.2 Migration 0016: Question Paper Storage & Lifecycle
- **`mock_question_papers`**:
  - `id` (UUID, PK)
  - `series_id` (UUID, FK -> `mock_series.id` ON DELETE CASCADE)
  - `subject_id` (UUID, FK -> `mock_subjects.id` ON DELETE SET NULL)
  - `title` (TEXT)
  - `paper_type` (TEXT: `'prelims'`, `'mains'`, `'previous_year'`, `'practice'`)
  - `year` (INT)
  - `storage_path` (TEXT, in bucket `mock-question-papers`)
  - `file_size_bytes` (BIGINT)
  - `total_pages` (INT)
  - `download_count` (INT, default 0)
  - `created_at` (TIMESTAMPTZ)
- **`mock_tests` additions**:
  - `content_status` (TEXT: `'draft'`, `'active'`, `'expired'`, `'purged'`)
  - `retention_days` (INT, default 90)
  - `purge_after` (TIMESTAMPTZ)
  - `archive_downloaded_at` (TIMESTAMPTZ)
- **Private Storage Bucket**:
  - Bucket name: `mock-question-papers` (Max 25MB, PDF only).

### 3.3 Migration 0017: Long-Term Question Analytics
- **`mock_test_question_stats`**:
  - `id` (UUID, PK)
  - `test_id` (UUID, FK -> `mock_tests.id` ON DELETE CASCADE)
  - `question_position` (INT)
  - `topic` (TEXT)
  - `difficulty` (TEXT)
  - `total_attempts` (INT)
  - `correct_count` (INT)
  - `accuracy_percentage` (NUMERIC(5, 2))
  - `discrimination_index` (NUMERIC(4, 3))
  - `archived_at` (TIMESTAMPTZ)

---

## 4. Ingestion & Image Processing Pipeline

### 4.1 Input Ingestion Channels
Administrators can ingest questions through five dedicated channels:
1. **Plain Text Paste**: Multi-question text parser supporting standard question numbering, Bengali numerals (`১, ২, ৩...`), and option keys (`A, B, C, D` or `ক, খ, গ, ঘ`).
2. **Separate Answer Key Parser**: Automatically correlates detached answer keys (e.g., `1-A, 2-C, 3-D` or grid tables) with previously parsed question statements.
3. **Structured CSV Template**: Batch CSV upload with columns for question text, options A-D, answer key, marks, negative marks, topic, and diagram marker tags.
4. **ZIP Archive Extractor (`src/lib/zipImporter.ts`)**:
   - Ingests question metadata along with local image files.
   - Hardened with **Zip-Slip path traversal defense** (validates canonical paths stay inside destination).
   - Protected with **Zip-Bomb decompression limit** (rejects archives uncompressing beyond 100MB or exceeding 500 files).
5. **Word Document Ingestion (`src/lib/docxImporter.ts`)**:
   - Extracts formatted question text and tables using Mammoth.
   - Extracts inline diagrams directly from `.docx` media packages and converts them to standard WebP attachments.
6. **HTML5 Canvas PDF Crop Tool (`src/components/admin/PdfDiagramCropTool.tsx`)**:
   - Allows administrators to upload an existing question paper PDF, render pages to an interactive canvas, drag bounding boxes over diagrams/circuits, and crop them directly into the question editor.

### 4.2 Sharp Image Processing Engine (`src/lib/imageProcessor.ts`)
All uploaded diagrams pass through a strict security and optimization pipeline:
- **Maximum Upload Ceiling**: 8 MB per image.
- **Decompression Bomb Protection**: Inspects metadata dimensions before rasterization; rejects images exceeding 40 megapixels ($width \times height > 40,000,000$).
- **Magic-Byte MIME Verification**: Reads the file buffer header to ensure genuine PNG, JPEG, or WebP bytes. Explicitly blocks masqueraded SVG, HTML, and executable binary formats.
- **EXIF Stripping & Auto-Orientation**: Strips camera metadata, GPS coordinates, and user identifiers, auto-orienting images based on orientation tags.
- **Dual-Mode WebP Compression**:
  - Generates WebP at 85% lossy quality.
  - Generates WebP lossless.
  - Compares output byte size and selects whichever is smaller.
- **Dimension Clamping**:
  - Question statement & passage diagrams: clamped to maximum width 1200px.
  - Option choice diagrams: clamped to maximum width 900px.

---

## 5. Admin Preview Engine & Validation Checklist

### 5.1 Zero Database Writes
- The Admin Preview engine (`/admin/mock-tests/[testId]/preview`) mounts the real student CBT engine in preview mode (`isPreview={true}`).
- Question navigation, timer countdown, option selections, review flagging, and clear response buttons operate purely in React memory.
- **Security Invariant**: Zero rows are written to `mock_attempts`, `mock_answers`, or `security_audit_log` during preview, ensuring test analytics and student leaderboards remain 100% pristine.

### 5.2 Multi-Viewport & Network Simulation
- **Viewport Switcher**:
  - Desktop View: 100% fluid responsive container.
  - Tablet View: 768px bounded container with iPad frame styling.
  - Mobile View: 375px bounded container with smartphone frame styling.
- **Slow Connection Toggle**: Introduces an artificial 1.5-second network delay to verify image loading skeletons, button states, and layout shift stability under 3G field conditions.

### 5.3 Automated Pre-Launch Validation Checklist
Before publishing a test from `draft` to `active`, the engine executes an automated inspection:
- **Blocking Red Errors** (Publish disabled):
  - Any question missing an answer key.
  - Duplicate options within a single question.
  - Option text identical to question statement text.
  - Broken or inaccessible diagram storage path.
- **Advisory Amber Warnings** (Publish allowed with acknowledgment):
  - Question containing diagram keywords (e.g., "diagram", "figure", "given below", "image") but lacking an attached image.
  - Missing explanation text or diagram.
  - Missing Bengali translation in a bilingual-designated paper.

### 5.4 Offline Print Stylesheet
The preview page includes a `@media print` print-friendly stylesheet. Administrators can print or save to PDF to generate physical examination booklets with formatted columns, question numbers, and high-contrast diagrams.

---

## 6. Soft-Copy Question Papers & Dynamic Watermarking

### 6.1 Server-Side PDF Watermarking (`src/lib/pdfWatermark.ts`)
To protect proprietary academy materials from unauthorized redistribution, all soft-copy PDFs are watermarked dynamically on the server before delivery to students:
- **Streaming Endpoint**: `/api/mock-tests/papers/[paperId]`
- **Authentication**: Requires active student session and verified enrollment in the parent series.
- **Watermark Specification**:
  - **Diagonal Center Stamp**: Rendered across every page at a 45-degree angle in semi-transparent light red (`rgba(220, 38, 38, 0.14)`).
  - **Stamped Content**: Candidate Full Name, Unique Student Code, and Generation Timestamp (UTC + IST).
  - **Security Audit Footer**: Rendered at the bottom margin of every page:
    `"CONFIDENTIAL — LICENSED TO [STUDENT_NAME] ([STUDENT_CODE]) | IP: [MASKED_IP] | C.G.A SECURE EXAM PORTAL"`

---

## 7. Student CBT Engine & 5-State Appear Test Machine

### 7.1 Five Server-Clock States
The "Appear Test" button (`src/components/mock-tests/AppearTestButton.tsx`) evaluates test status against the authoritative server timestamp and candidate attempt record:

| State | Condition | Visual Appearance | Action |
|---|---|---|---|
| **1. Locked** | Student not enrolled OR test in `draft` status | Grey button with padlock icon | Clicking opens series checkout / admission enquiry modal |
| **2. Upcoming** | Enrolled, but `server_clock < window_start` | Amber badge with live countdown timer ("Starts in: 2d 4h 12m") | Disabled; displays scheduled window start |
| **3. Live** | Enrolled, `window_start <= server_clock <= window_end`, no prior submission | Prominent Green/Blue CTA: "Appear Test" (or animated "Resume Test" if in progress) | Navigates to `/student/tests/[testId]` to launch or resume CBT session |
| **4. Attempted** | Candidate has submitted test (`mock_attempts.status = 'completed'`) | Emerald badge displaying "Score: X / Y" | Clicking opens student scorecard, performance analysis, and faculty solutions |
| **5. Closed / Missed** | Window elapsed (`server_clock > window_end`) without candidate submission | Amber/Slate badge: "Closed / Missed" | Re-attempts blocked; allows viewing solutions if marked public by faculty |

### 7.2 Student CBT Interface Features
- **Header & Timer**: Live countdown synchronizing with server deadline, candidate identity, and auto-submit on expiry.
- **Question Palette**: Grid showing Answered (Green), Flagged for Review (Purple), Unanswered (Slate), and Unvisited (Grey).
- **Shared Passages**: Left-hand pane for reading comprehension passages, maps, or data interpretation tables; right-hand pane for corresponding questions.
- **Diagram Pan & Zoom**: High-resolution diagrams can be clicked to open in an expanded modal view.
- **Local Storage Resilience**: Ongoing answers are mirrored in `localStorage` to guard against momentary internet disconnections.

---

## 8. Storage Lifecycle, Atomic Purge & Disaster Recovery

### 8.1 Lifecycle State Machine
Every mock test transitions through four lifecycle stages:
```
[Draft] ──(Admin Launch)──> [Active] ──(Window Closes)──> [Expired] ──(Purge Action)──> [Purged]
  │                                                            │
  └──(Validation Gate)                                         └──(Retention Days: 15 / 30 / 60 / 90)
```

1. **`draft`**: Test authoring, diagram upload, and preview. Invisible to students.
2. **`active`**: Scheduled or live for student attempts.
3. **`expired`**: Exam window closed. Students can view scorecards. Retention countdown begins.
4. **`purged`**: Heavy question content and storage images removed to free up host quota. Student attempts, scores, and question statistics remain permanently intact.

### 8.2 Atomic Purge Mechanism (`/api/admin/mock-tests/purge`)
To prevent accidental data destruction, the purge endpoint enforces two strict safeguards:
- **Safeguard 1**: Test must either have a verified backup archive downloaded within the preceding 24 hours (`archive_downloaded_at > now() - interval '24 hours'`), **OR** the administrator must provide explicit confirmation by typing the exact title of the test.
- **Safeguard 2 (Statistical Preservation)**: Before deleting question rows, the purge engine aggregates student attempt performance into `mock_test_question_stats` (total attempts, correct count, accuracy percentage, and discrimination index).
- **Asset Removal**:
  - Deletes all diagram images from `mock-question-images` storage.
  - Deletes all question rows from `mock_questions`.
  - Retains the `mock_tests` row (status updated to `'purged'`).
  - Retains all candidate `mock_attempts` and scores, displaying a dignified "Question Content Archived" banner on student scorecards.

### 8.3 Self-Contained Archive Export (`/api/admin/mock-tests/archive`)
Administrators can export a self-contained `.zip` package at any time:
- **`manifest.json`**: Test metadata, export timestamp, file inventory, and SHA-256 cryptographic hashes for every file in the package.
- **`questions.json`**: Complete structured questions, passage groups, option choices, answer keys, marks, and explanations.
- **`images/`**: High-resolution image files extracted directly from cloud storage.
- **`results_summary.csv`**: Comprehensive student scorecard export with ranks, marks, submission times, and per-question accuracy.

### 8.4 Cryptographic Checksum Restore (`/api/admin/mock-tests/restore`)
A previously purged or backed-up test can be restored from its archive ZIP:
1. Validates that `manifest.json` is present and well-formed.
2. Re-computes SHA-256 hashes for all files in the archive and verifies them against the manifest.
3. Re-uploads diagram images to `mock-question-images` bucket.
4. Restores question groups, questions, and answer keys.
5. Sets test status to `draft` so faculty can review and verify before re-activating.

### 8.5 Automated Purge Cron Endpoint (`/api/cron/purge-tests`)
- Designed for execution via cron job or Vercel Cron.
- Identifies tests where `content_status = 'expired'` and `purge_after < now()`.
- Automatically executes safe question statistical preservation and image asset purging.

---

## 9. Verification & Quality Assurance Suite

The complete system is covered by an automated test suite located at `scripts/verify_phase_1_to_8_mock_test_suite.mjs`.

### 9.1 Verification Commands
To execute full end-to-end verification and type safety checks:

```bash
# 1. Run Automated Mock Test Verification Suite (13 Test Groups)
cmd /c node scripts/verify_phase_1_to_8_mock_test_suite.mjs

# 2. Run TypeScript Strict Compilation Check
cmd /c npx tsc --noEmit -p .
```

### 9.2 Test Coverage Summary
- **Test Group 1**: Sharp Diagram Image Pipeline (WebP conversion, SVG/executable rejection, decompression bomb defense).
- **Test Group 2**: MCQ Parser Engine (Bengali numeral normalization, separate answer key regex detection, diagram marker tags).
- **Test Group 3**: Safe ZIP Extraction (Zip-Slip path traversal defense, Zip-Bomb file size limits).
- **Test Group 4**: Server-Side Dynamic PDF Watermarking (Diagonal candidate identity, security footer).
- **Test Group 5**: Enrolment Isolation Security Gate (Series A isolation vs. Series B).
- **Test Group 6**: Appear Test Button State Machine (Evaluation of Locked, Upcoming, Live, Attempted, Closed/Missed).
- **Test Group 7**: Archive Manifest & SHA-256 Checksum Validation (ZIP generation and hash verification).
- **Test Group 8**: Lifecycle Purge Gate & Question Statistics Preservation (Archive gate and typed confirmation).
