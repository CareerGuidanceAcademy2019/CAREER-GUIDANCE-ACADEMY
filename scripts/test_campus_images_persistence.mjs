import assert from 'node:assert';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://craicxwqaygdydtdaxtw.supabase.co';
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyYWljeHdxYXlnZHlkdGRheHR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTgyMTQxMSwiZXhwIjoyMTA3Mzk3NDExfQ.ZMw5S9G8K5s8rmd2Zp0fu5vIZLM9OZDuftpRc4TnbfA';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_jXl_a3vn0Q7rEa6ADqzuzg_iBxBEX5c';

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);
const publicClient = createClient(SUPABASE_URL, ANON_KEY);

console.log('--- STARTING CAMPUS & CLASSROOM IMAGES PERSISTENCE TEST SUITE ---');

async function runTests() {
  // 1. Verify site_content table exists and has id=1
  console.log('\n[TEST 1] Verifying site_content table structure and singleton row...');
  const { data: initialRow, error: initialErr } = await adminClient
    .from('site_content')
    .select('*')
    .eq('id', 1)
    .single();

  assert.ok(!initialErr, `Failed to fetch site_content: ${initialErr?.message}`);
  assert.equal(initialRow.id, 1, 'Site content id must equal 1');
  console.log('✓ site_content singleton exists and is accessible.');

  // 2. Simulate Admin Uploading a New Classroom Photo
  console.log('\n[TEST 2] Simulating Admin saving a new compressed Classroom Photo...');
  const testPhoto1 = {
    id: `campus-test-${Date.now()}-1`,
    url: 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==',
    title: 'Smart Interactive Classroom - Room 101',
    caption: 'Air-conditioned smart board setup for competitive TET aspirants.',
    uploadedAt: new Date().toISOString().split('T')[0],
  };

  const existingContent = initialRow.content || {};
  const previousImages = Array.isArray(existingContent.campusImages) ? existingContent.campusImages : [];
  const updatedImagesWithNewPhoto = [testPhoto1, ...previousImages];

  const mergedContent = {
    ...existingContent,
    campusImages: updatedImagesWithNewPhoto,
  };

  const { error: saveErr } = await adminClient
    .from('site_content')
    .upsert({ id: 1, content: mergedContent, updated_at: new Date().toISOString() });

  assert.ok(!saveErr, `Failed to save new photo to database: ${saveErr?.message}`);
  console.log('✓ Successfully saved new classroom photo to database.');

  // 3. Verify Database Readback (Admin Perspective)
  console.log('\n[TEST 3] Verifying photo persisted in database (Admin Recheck)...');
  const { data: adminRecheck, error: recheckErr } = await adminClient
    .from('site_content')
    .select('content, updated_at')
    .eq('id', 1)
    .single();

  assert.ok(!recheckErr, `Admin recheck query failed: ${recheckErr?.message}`);
  const persistedImages = adminRecheck.content?.campusImages || [];
  const foundPhoto = persistedImages.find((p) => p.id === testPhoto1.id);
  assert.ok(foundPhoto, 'Uploaded photo was NOT found in persisted campusImages array!');
  assert.equal(foundPhoto.title, testPhoto1.title, 'Photo title must match uploaded title');
  assert.equal(foundPhoto.caption, testPhoto1.caption, 'Photo caption must match uploaded caption');
  assert.equal(foundPhoto.url, testPhoto1.url, 'Photo URL/dataUrl must match uploaded data');
  console.log(`✓ Admin verified: Found uploaded photo "${foundPhoto.title}" at index 0 of ${persistedImages.length} images.`);

  // 4. Verify Public Homepage Access (Unauthenticated Visitor Perspective)
  console.log('\n[TEST 4] Verifying public unauthenticated access to Front Top Banner...');
  const { data: publicData, error: publicErr } = await publicClient
    .from('site_content')
    .select('content')
    .eq('id', 1)
    .single();

  assert.ok(!publicErr, `Public visitor fetch failed: ${publicErr?.message}`);
  const publicImages = publicData.content?.campusImages || [];
  const publicPhoto = publicImages.find((p) => p.id === testPhoto1.id);
  assert.ok(publicPhoto, 'Public visitor cannot see uploaded photo on front banner!');
  assert.equal(publicPhoto.title, testPhoto1.title);
  console.log('✓ Public visitor verified: Classroom photo is live and visible on public banner.');

  // 5. Verify Standalone Packages & CMS Content Was Preserved
  console.log('\n[TEST 5] Verifying no other CMS sections or standalone packages were dropped...');
  assert.ok(publicData.content.heroTitle, 'Hero title must be preserved');
  assert.ok(publicData.content.standalonePackages, 'standalonePackages must be preserved');
  assert.ok(Array.isArray(publicData.content.standalonePackages), 'standalonePackages must be an array');
  console.log(`✓ Preserved all CMS sections (Standalone packages count: ${publicData.content.standalonePackages.length}).`);

  // 6. Test Photo Deletion Persistence
  console.log('\n[TEST 6] Testing Admin photo deletion and verifying persistent removal...');
  const imagesAfterDeletion = persistedImages.filter((p) => p.id !== testPhoto1.id);
  const contentAfterDeletion = {
    ...adminRecheck.content,
    campusImages: imagesAfterDeletion,
  };

  const { error: deleteErr } = await adminClient
    .from('site_content')
    .upsert({ id: 1, content: contentAfterDeletion, updated_at: new Date().toISOString() });

  assert.ok(!deleteErr, `Failed to persist deletion: ${deleteErr?.message}`);

  const { data: afterDeleteCheck } = await publicClient
    .from('site_content')
    .select('content')
    .eq('id', 1)
    .single();

  const finalPublicImages = afterDeleteCheck.content?.campusImages || [];
  const shouldNotExist = finalPublicImages.find((p) => p.id === testPhoto1.id);
  assert.ok(!shouldNotExist, 'Deleted photo is still appearing in public banner!');
  console.log('✓ Photo removal verified: Deleted photo was completely removed from database.');

  console.log('\n======================================================');
  console.log('ALL CAMPUS & CLASSROOM IMAGES PERSISTENCE TESTS PASSED!');
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
