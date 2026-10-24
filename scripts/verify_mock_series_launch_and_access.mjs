import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://craicxwqaygdydtdaxtw.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ Supabase service role key missing');
  process.exit(1);
}

const sb = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  console.log('🧪 Starting Mock Series Launch & Access Enforcement Verification...\n');
  let passed = 0;
  let failed = 0;

  // Test 1: Verify all 10 mock series are present in public.mock_series
  console.log('--- TEST 1: Verify all 10 mock series exist in public.mock_series ---');
  try {
    const { data: seriesList, error } = await sb
      .from('mock_series')
      .select('id, name, price')
      .order('price', { ascending: true });

    if (error) throw error;
    console.log(`Found ${seriesList.length} series in public.mock_series:`);
    seriesList.forEach((s) => console.log(`  - [${s.id}] ${s.name} @ ₹${s.price}`));

    const expectedIds = [
      'series-ttet-paper1',
      'series-ttet-paper2-sci',
      'series-ttet-paper2-soc',
      'series-stgt-soc',
      'series-stgt-pure-sci',
      'series-stgt-bio-sci',
      'series-tpsc-combined',
      'series-tcs-tps',
      'series-banking-ssc',
      'series-school-foundation',
    ];

    const missing = expectedIds.filter((id) => !seriesList.some((s) => s.id === id));
    if (missing.length === 0) {
      console.log('✅ PASS: All 10 expected mock test series are present in public.mock_series');
      passed++;
    } else {
      console.error('❌ FAIL: Missing series:', missing);
      failed++;
    }
  } catch (err) {
    console.error('❌ FAIL:', err.message);
    failed++;
  }

  // Test 2: Verify get_series_course_ids function
  console.log('\n--- TEST 2: Verify Postgres mapping function get_series_course_ids ---');
  try {
    const { data: p2SciCourses, error: err1 } = await sb.rpc('get_series_course_ids', {
      p_series_id: 'series-ttet-paper2-sci',
    });
    if (err1) throw err1;

    const { data: p2SocCourses, error: err2 } = await sb.rpc('get_series_course_ids', {
      p_series_id: 'series-ttet-paper2-soc',
    });
    if (err2) throw err2;

    const hasSci = Array.isArray(p2SciCourses) && p2SciCourses.includes('crs-tet-2-sci-online');
    const hasSoc = Array.isArray(p2SocCourses) && p2SocCourses.includes('crs-tet-2-arts-online');

    if (hasSci && hasSoc) {
      console.log('✅ PASS: Postgres get_series_course_ids correctly maps series to courses');
      passed++;
    } else {
      console.error('❌ FAIL: Incorrect course mapping', { p2SciCourses, p2SocCourses });
      failed++;
    }
  } catch (err) {
    console.error('❌ FAIL:', err.message);
    failed++;
  }

  // Test 3: Verify get_course_series_id reverse mapping
  console.log('\n--- TEST 3: Verify Postgres reverse mapping function get_course_series_id ---');
  try {
    const { data: mappedSeries1, error: err1 } = await sb.rpc('get_course_series_id', {
      p_course_id: 'crs-tet-2-sci-offline',
    });
    if (err1) throw err1;

    const { data: mappedSeries2, error: err2 } = await sb.rpc('get_course_series_id', {
      p_course_id: 'crs-tet-2-arts-online',
    });
    if (err2) throw err2;

    if (mappedSeries1 === 'series-ttet-paper2-sci' && mappedSeries2 === 'series-ttet-paper2-soc') {
      console.log('✅ PASS: Postgres get_course_series_id accurately maps course batches back to mock series');
      passed++;
    } else {
      console.error('❌ FAIL: Reverse mapping mismatch', { mappedSeries1, mappedSeries2 });
      failed++;
    }
  } catch (err) {
    console.error('❌ FAIL:', err.message);
    failed++;
  }

  // Test 4: Verify test creation with standalone mock series target vs course target
  console.log('\n--- TEST 4: Create a mock test with standalone mock series target ---');
  const tempTestId = `test-verify-${Date.now()}`;
  try {
    const { error: insertErr } = await sb.from('mock_tests').insert({
      id: tempTestId,
      series_id: 'series-ttet-paper2-soc',
      course_id: null,
      title: 'TET Paper-II (Social Studies) Verification Test',
      batch_name: 'Tripura TET: Paper-II (Social Studies) 2026 - Enrolled Students Only',
      subject: 'History & Pedagogical Issues [Bilingual]',
      duration_minutes: 30,
      total_marks: 30,
      marks_per_question: 1,
      negative_marking: 0,
      status: 'launched',
    });

    if (insertErr) throw insertErr;
    console.log(`Successfully created standalone test: ${tempTestId}`);

    // Verify row was inserted
    const { data: savedTest } = await sb.from('mock_tests').select('*').eq('id', tempTestId).single();
    if (savedTest && savedTest.series_id === 'series-ttet-paper2-soc' && savedTest.course_id === null) {
      console.log('✅ PASS: Standalone mock test created with proper foreign key to public.mock_series');
      passed++;
    } else {
      console.error('❌ FAIL: Standalone mock test record did not match expected structure');
      failed++;
    }

    // Clean up temp test
    await sb.from('mock_tests').delete().eq('id', tempTestId);
    console.log(`Cleaned up temp test ${tempTestId}`);
  } catch (err) {
    console.error('❌ FAIL:', err.message);
    failed++;
    try {
      await sb.from('mock_tests').delete().eq('id', tempTestId);
    } catch {}
  }

  console.log(`\n========================================`);
  console.log(`Verification Summary: Passed: ${passed}, Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
