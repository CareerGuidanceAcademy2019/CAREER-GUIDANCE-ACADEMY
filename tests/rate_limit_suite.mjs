import assert from 'node:assert';
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const k = trimmed.slice(0, idx).trim();
      const v = trimmed.slice(idx + 1).trim();
      process.env[k] = v;
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://craicxwqaygdydtdaxtw.supabase.co';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!ANON_KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required in environment.');
  process.exit(1);
}

const client = createClient(SUPABASE_URL, ANON_KEY);

async function runRateLimitTests() {
  console.log('========================================================');
  console.log('CAREER GUIDANCE ACADEMY (C.G.A) — RATE LIMIT TEST SUITE');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  FAIL: ${name} -> ${err.message}`);
      failed++;
    }
  }

  const nonce = Date.now();

  // Test 1: Normal use allowed within limits
  await test('Normal requests are allowed and decrement remaining count', async () => {
    const key = `test_norm_${nonce}`;
    const { data: r1, error: e1 } = await client.rpc('check_rate_limit', {
      p_key: key,
      p_limit: 5,
      p_window_seconds: 60,
    });
    assert(!e1, `RPC failed: ${e1?.message}`);
    assert.strictEqual(r1.allowed, true);
    assert.strictEqual(r1.remaining, 4);

    const { data: r2 } = await client.rpc('check_rate_limit', {
      p_key: key,
      p_limit: 5,
      p_window_seconds: 60,
    });
    assert.strictEqual(r2.allowed, true);
    assert.strictEqual(r2.remaining, 3);
  });

  // Test 2: Triggering the limit blocks with allowed: false & retryAfter
  await test('Rate limit triggers exactly on threshold (5 attempts per window)', async () => {
    const key = `test_threshold_${nonce}`;
    // 5 attempts allowed
    for (let i = 0; i < 5; i++) {
      const { data } = await client.rpc('check_rate_limit', {
        p_key: key,
        p_limit: 5,
        p_window_seconds: 60,
      });
      assert.strictEqual(data.allowed, true, `Attempt ${i + 1} should be allowed`);
    }

    // 6th attempt must be blocked
    const { data: blocked } = await client.rpc('check_rate_limit', {
      p_key: key,
      p_limit: 5,
      p_window_seconds: 60,
    });
    assert.strictEqual(blocked.allowed, false, '6th attempt must be blocked');
    assert.strictEqual(blocked.remaining, 0, 'Remaining count must be 0');
    assert(blocked.retryAfter > 0, 'retryAfter must be greater than 0');
  });

  // Test 3: Login account limit (5 attempts / 15 mins)
  await test('Login account limit (5 attempts) triggers lockout', async () => {
    const key = `login_account_aspirant_${nonce}@example.com`;
    for (let i = 0; i < 5; i++) {
      await client.rpc('check_rate_limit', {
        p_key: key,
        p_limit: 5,
        p_window_seconds: 900,
      });
    }

    const { data } = await client.rpc('check_rate_limit', {
      p_key: key,
      p_limit: 5,
      p_window_seconds: 900,
    });
    assert.strictEqual(data.allowed, false);
    assert(data.retryAfter > 800, 'Retry-After should reflect ~15 minutes window');
  });

  // Test 4: Enquiry submission limit (5 per hour)
  await test('Enquiry submission limit triggers after 5 enquiries per phone', async () => {
    const key = `enquiry_9436000000_${nonce}`;
    for (let i = 0; i < 5; i++) {
      await client.rpc('check_rate_limit', {
        p_key: key,
        p_limit: 5,
        p_window_seconds: 3600,
      });
    }

    const { data } = await client.rpc('check_rate_limit', {
      p_key: key,
      p_limit: 5,
      p_window_seconds: 3600,
    });
    assert.strictEqual(data.allowed, false);
    assert.strictEqual(data.remaining, 0);
  });

  // Test 5: Mock test submit limit (5 per min)
  await test('Mock attempt submit rate limit triggers after 5 rapid submits', async () => {
    const key = `mock_submit_stu_${nonce}`;
    for (let i = 0; i < 5; i++) {
      await client.rpc('check_rate_limit', {
        p_key: key,
        p_limit: 5,
        p_window_seconds: 60,
      });
    }

    const { data } = await client.rpc('check_rate_limit', {
      p_key: key,
      p_limit: 5,
      p_window_seconds: 60,
    });
    assert.strictEqual(data.allowed, false);
  });

  console.log('\n========================================================');
  console.log(`SUMMARY: Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runRateLimitTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
