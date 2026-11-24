import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let passed = 0;
let failed = 0;

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error('   Reason:', err?.message || err);
    failed++;
  }
}

console.log('================================================================================');
console.log('🧪 VERIFYING 3-BARS HOVER/CLICK NAV, URGENT POPUP CMS & CAROUSEL MODAL');
console.log('================================================================================\n');

const adminLayoutCode = fs.readFileSync(path.resolve('src/app/admin/layout.tsx'), 'utf8');
const studentLayoutCode = fs.readFileSync(path.resolve('src/app/student/layout.tsx'), 'utf8');
const cmsPageCode = fs.readFileSync(path.resolve('src/app/admin/site-content/page.tsx'), 'utf8');
const cmsApiCode = fs.readFileSync(path.resolve('src/app/api/admin/site-content/route.ts'), 'utf8');
const modalCode = fs.readFileSync(path.resolve('src/components/layout/UrgentAnnouncementModal.tsx'), 'utf8');
const rootLayoutCode = fs.readFileSync(path.resolve('src/app/layout.tsx'), 'utf8');

await runTest('TC-01: Admin & Student sidebars are hidden by default with overflow-hidden & invisible when closed, and open on 3-bars hover or click', async () => {
  assert(
    adminLayoutCode.includes('id="admin-sidebar-trigger-btn"') &&
      adminLayoutCode.includes('onMouseEnter={openSidebar}') &&
      adminLayoutCode.includes('overflow-hidden') &&
      adminLayoutCode.includes("'-translate-x-full invisible opacity-0 pointer-events-none'"),
    'Admin layout must hide sidebar completely when closed (overflow-hidden + invisible + opacity-0) and open on mouse hover or click'
  );
  assert(
    studentLayoutCode.includes('id="student-sidebar-trigger-btn"') &&
      studentLayoutCode.includes('onMouseEnter={openSidebar}') &&
      studentLayoutCode.includes('overflow-hidden') &&
      studentLayoutCode.includes("'-translate-x-full invisible opacity-0 pointer-events-none'"),
    'Student layout must hide sidebar completely when closed (overflow-hidden + invisible + opacity-0) and open on mouse hover or click'
  );
});

await runTest('TC-01C: Zoomed-out root scale, full-square geometry (0px radius), and contact email overflow prevention are active', async () => {
  const globalsCss = fs.readFileSync(path.resolve('src/app/globals.css'), 'utf8');
  const contactPage = fs.readFileSync(path.resolve('src/app/contact/page.tsx'), 'utf8');
  assert(
    globalsCss.includes('--radius-xl: 0px') &&
      globalsCss.includes('--radius-2xl: 0px') &&
      globalsCss.includes('--radius-3xl: 0px') &&
      globalsCss.includes('border-radius: 0px !important'),
    'globals.css must enforce 0px full-square geometry on all boxes, cards, buttons, and inputs'
  );
  assert(
    globalsCss.includes('font-size: 13.5px') && globalsCss.includes('font-size: 14px'),
    'globals.css must apply the zoomed-out root font scale across phone, tablet, and desktop'
  );
  assert(
    contactPage.includes('break-all') && contactPage.includes('min-w-0 flex-1'),
    'contact/page.tsx must prevent long email address overflow across all screen sizes'
  );
});

await runTest('TC-01B: Zero emojis exist anywhere in portal UI source files (src/)', async () => {
  function walk(dir, out = []) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p, out);
      else if (/\.(ts|tsx|css)$/.test(ent.name)) out.push(p);
    }
    return out;
  }
  const emojiRx = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;
  const files = walk(path.resolve('src'));
  const offenders = [];
  for (const f of files) {
    const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
    lines.forEach((line, idx) => {
      // Skip regex character class definitions used to strip bullets/checkmarks from user input
      if (line.includes('.replace(/^[\\s')) return;
      const matches = line.match(emojiRx);
      if (matches) {
        offenders.push(`${path.relative(process.cwd(), f)}:${idx + 1} (${matches.join(' ')})`);
      }
    });
  }
  assert.equal(offenders.length, 0, `Found unexpected emoji(s) in src/: ${offenders.join(', ')}`);
});

await runTest('TC-02: Admin Public Site CMS includes Urgent Entry Popup Announcements manager with URL/Link pasting', async () => {
  assert(
    cmsPageCode.includes('Urgent Entry Popup Announcements') &&
      cmsPageCode.includes('id="urgent-popup-title-input"') &&
      cmsPageCode.includes('id="urgent-popup-message-input"') &&
      cmsPageCode.includes('id="urgent-popup-url-input"'),
    'Public Site CMS must provide Urgent Entry Popup Announcement inputs including optional URL/Link input'
  );
  assert(
    cmsApiCode.includes('mergedContent.urgentPopupAnnouncements = newContent.urgentPopupAnnouncements'),
    '/api/admin/site-content must persist urgentPopupAnnouncements in site_content'
  );
});

await runTest('TC-03: UrgentAnnouncementModal supports multiple announcements carousel, top-right X close button, and URL link action', async () => {
  assert(
    modalCode.includes('id="urgent-announcement-close-btn"') &&
      modalCode.includes('aria-label="Close urgent announcement"'),
    'UrgentAnnouncementModal must have a top-right X close button'
  );
  assert(
    modalCode.includes('id="urgent-announcement-link-btn"') &&
      modalCode.includes('renderMessageWithLinks'),
    'UrgentAnnouncementModal must render clickable URL links and link action button'
  );
  assert(
    modalCode.includes('aria-label="Previous notice"') &&
      modalCode.includes('aria-label="Next notice"'),
    'UrgentAnnouncementModal must support Prev/Next carousel navigation when multiple urgent notices are posted'
  );
  assert(
    rootLayoutCode.includes('<UrgentAnnouncementModal />'),
    'RootLayout must mount <UrgentAnnouncementModal />'
  );
});

await runTest('TC-04: Live Supabase E2E round-trip: Admin posts 2 Urgent Popup Announcements with URLs -> Verify persistence & clean rollback', async () => {
  const { data: initialRow, error: initErr } = await admin
    .from('site_content')
    .select('content')
    .eq('id', 1)
    .single();
  assert(!initErr && initialRow, `Failed to read site_content: ${initErr?.message}`);

  const originalContent = initialRow.content || {};
  const previousPopups = originalContent.urgentPopupAnnouncements;

  const samplePopups = [
    {
      id: `urgent-e2e-${Date.now()}-1`,
      title: 'Tripura TET 2026 Special Mock Test Schedule Released',
      message: 'All enrolled candidates are requested to check the updated CBT schedule.',
      tag: 'Urgent Notice',
      linkUrl: 'https://careerguidanceacademy.vercel.app/mock-tests',
      linkLabel: 'View Mock Test Schedule',
      date: '2026-11-24',
      isActive: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: `urgent-e2e-${Date.now()}-2`,
      title: 'New Offline Batch Admissions Open at Udaipur Center',
      message: 'Download the official prospectus PDF from the link below.',
      tag: 'Admission Alert',
      linkUrl: 'https://drive.google.com/file/d/sample-prospectus/view',
      linkLabel: 'Download Prospectus PDF',
      date: '2026-11-24',
      isActive: true,
      updatedAt: new Date().toISOString(),
    },
  ];

  try {
    const { error: saveErr } = await admin
      .from('site_content')
      .upsert(
        {
          id: 1,
          content: { ...originalContent, urgentPopupAnnouncements: samplePopups },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    assert(!saveErr, `Failed to save urgentPopupAnnouncements: ${saveErr?.message}`);

    const { data: verifyRow, error: verErr } = await admin
      .from('site_content')
      .select('content')
      .eq('id', 1)
      .single();
    assert(!verErr && verifyRow, 'Failed to read back site_content');
    const savedPopups = verifyRow.content?.urgentPopupAnnouncements || [];
    assert.equal(savedPopups.length, 2, 'Expected 2 urgent popup announcements persisted in DB');
    assert.equal(savedPopups[0].linkUrl, 'https://careerguidanceacademy.vercel.app/mock-tests');
    assert.equal(savedPopups[1].linkUrl, 'https://drive.google.com/file/d/sample-prospectus/view');
    console.log('   ↳ Live Supabase E2E verified: 2 urgent popup notices with URLs persisted & verified!');
  } finally {
    const restoredContent = { ...originalContent };
    if (previousPopups === undefined) {
      delete restoredContent.urgentPopupAnnouncements;
    } else {
      restoredContent.urgentPopupAnnouncements = previousPopups;
    }
    await admin
      .from('site_content')
      .upsert({ id: 1, content: restoredContent, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  }
});

console.log('\n================================================================================');
console.log(`📊 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('================================================================================');
if (failed > 0) process.exit(1);
