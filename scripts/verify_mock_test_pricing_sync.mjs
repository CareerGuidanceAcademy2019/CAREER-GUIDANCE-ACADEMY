// scripts/verify_mock_test_pricing_sync.mjs
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://craicxwqaygdydtdaxtw.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyYWljeHdxYXlnZHlkdGRheHR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTgyMTQxMSwiZXhwIjoyMTA3Mzk3NDExfQ.ZMw5S9G8K5s8rmd2Zp0fu5vIZLM9OZDuftpRc4TnbfA';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_jXl_a3vn0Q7rEa6ADqzuzg_iBxBEX5c';

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);
const anonClient = createClient(SUPABASE_URL, ANON_KEY);

async function run() {
  console.log('[TEST] Verifying Mock Test Pricing Database Sync & Lifecycle...');
  let passed = 0;
  let failed = 0;

  function assert(condition, desc) {
    if (condition) {
      console.log(`  PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  FAIL: ${desc}`);
      failed++;
    }
  }

  try {
    // 1. Fetch current price from database
    console.log('\n1. Fetching current series pricing from Supabase...');
    const { data: initialSeries, error: fetchErr } = await adminClient
      .from('mock_series')
      .select('id, name, price')
      .eq('id', 'series-ttet-paper1')
      .single();

    assert(!fetchErr && initialSeries, `Found series-ttet-paper1 in database (current price: ₹${initialSeries?.price})`);
    const originalPrice = initialSeries.price;

    // 2. Admin edits price to 449
    console.log('\n2. Updating price of series-ttet-paper1 to ₹449 in Supabase...');
    const { data: updatedSeries, error: updateErr } = await adminClient
      .from('mock_series')
      .update({ price: 449 })
      .eq('id', 'series-ttet-paper1')
      .select()
      .single();

    assert(!updateErr && updatedSeries?.price === '449' || updatedSeries?.price === 449, `Database updated series-ttet-paper1 price to ₹449`);

    // 3. Verify public/student read access retrieves the updated price ₹449
    console.log('\n3. Verifying student/public select retrieves updated price ₹449...');
    const { data: publicRead, error: readErr } = await anonClient
      .from('mock_series')
      .select('id, name, price')
      .eq('id', 'series-ttet-paper1')
      .single();

    assert(!readErr && (publicRead?.price === '449' || publicRead?.price === 449), `Student/public query receives updated price ₹449 (got ₹${publicRead?.price})`);

    // 4. Test RLS protection: Unauthenticated user cannot update price directly via client
    console.log('\n4. Testing RLS protection against unauthorized price mutation...');
    const { error: anonUpdateErr } = await anonClient
      .from('mock_series')
      .update({ price: 1 })
      .eq('id', 'series-ttet-paper1');

    // In Supabase, if RLS update fails or policy returns 0 rows updated
    const { data: verifyNotTampered } = await adminClient
      .from('mock_series')
      .select('price')
      .eq('id', 'series-ttet-paper1')
      .single();

    assert(verifyNotTampered?.price !== '1' && verifyNotTampered?.price !== 1, `Anonymous user could not tamper with series price (still ₹${verifyNotTampered?.price})`);

    // 5. Restore original price
    console.log(`\n5. Restoring original price (₹${originalPrice}) in database...`);
    const { error: restoreErr } = await adminClient
      .from('mock_series')
      .update({ price: originalPrice })
      .eq('id', 'series-ttet-paper1');

    assert(!restoreErr, `Restored series-ttet-paper1 price back to ₹${originalPrice}`);

    console.log(`\n========================================`);
    console.log(`VERIFICATION SUMMARY: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

run();
