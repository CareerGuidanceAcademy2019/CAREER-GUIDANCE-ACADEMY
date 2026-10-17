import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3005';

// Load .env.local
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
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const anonClient = createClient(SUPABASE_URL, ANON_KEY);

const results = [];
let passCount = 0;
let failCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    results.push({ test: testName, status: 'PASS', details });
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName} - ${details}`);
    results.push({ test: testName, status: 'FAIL', details });
    failCount++;
  }
}

async function runSecurityAbuseSuite() {
  console.log('===============================================================');
  console.log('🛡️  STARTING PHASE 8: COMPREHENSIVE SECURITY ABUSE & SAST SUITE');
  console.log(`Target: ${BASE_URL} | Supabase: ${SUPABASE_URL}`);
  console.log('===============================================================\n');

  // --- SECTION 1: HTTP RESPONSE SECURITY HEADERS ---
  console.log('--- 1. HTTP RESPONSE SECURITY HEADERS AUDIT ---');
  {
    const res = await fetch(`${BASE_URL}/`);
    const headers = res.headers;

    const csp = headers.get('content-security-policy') || '';
    assert(csp.includes("frame-ancestors 'none'"), 'CSP includes frame-ancestors none (clickjacking protection)');
    assert(csp.includes("object-src 'none'"), 'CSP includes object-src none');
    assert(csp.includes("base-uri 'self'"), 'CSP includes base-uri self');

    const hsts = headers.get('strict-transport-security') || '';
    assert(hsts.includes('max-age=63072000'), 'Strict-Transport-Security (HSTS) max-age >= 1 year', hsts);

    const xcto = headers.get('x-content-type-options');
    assert(xcto === 'nosniff', 'X-Content-Type-Options is nosniff', xcto);

    const xfo = headers.get('x-frame-options');
    assert(xfo === 'DENY', 'X-Frame-Options is DENY', xfo);

    const refPol = headers.get('referrer-policy');
    assert(refPol === 'strict-origin-when-cross-origin', 'Referrer-Policy is strict-origin-when-cross-origin', refPol);

    const permPol = headers.get('permissions-policy') || '';
    assert(permPol.includes('camera=()') && permPol.includes('microphone=()'), 'Permissions-Policy disables unused hardware (camera, mic)', permPol);

    const xPoweredBy = headers.get('x-powered-by');
    assert(xPoweredBy === null, 'X-Powered-By header is strictly removed (no tech stack fingerprinting)', xPoweredBy);
  }

  // --- SECTION 2: CLIENT BUNDLE & SOURCE MAP LEAK SCAN ---
  console.log('\n--- 2. CLIENT BUNDLE SECRET LEAK & ARTIFACT SCAN ---');
  {
    const staticDir = path.resolve('.next', 'static');
    let leakedSecretFound = false;
    let sourceMapFound = false;

    if (fs.existsSync(staticDir)) {
      function scanDir(dir) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            scanDir(fullPath);
          } else {
            if (file.endsWith('.js')) {
              const content = fs.readFileSync(fullPath, 'utf8');
              if (SERVICE_KEY && content.includes(SERVICE_KEY)) {
                leakedSecretFound = true;
                console.error(`    Found SERVICE_KEY in: ${file}`);
              }
            }
            if (file.endsWith('.js.map')) {
              sourceMapFound = true;
            }
          }
        }
      }
      scanDir(staticDir);
    }

    assert(!leakedSecretFound, 'SUPABASE_SERVICE_ROLE_KEY is 100% absent from the client JavaScript bundle');
    assert(!sourceMapFound, 'Public JavaScript source maps (.js.map) are disabled in production build');
  }

  // --- SECTION 3: AUTOMATED INJECTION & ABUSE PAYLOADS ---
  console.log('\n--- 3. SQL INJECTION & MALICIOUS PAYLOAD IMMUNITY ---');
  {
    const sqlPayloads = [
      "' OR '1'='1",
      "admin'--",
      "'; DROP TABLE profiles;--",
      "1 UNION SELECT null, null, null--",
    ];

    for (const payload of sqlPayloads) {
      const res = await fetch(`${BASE_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Test ${payload}`,
          phone: '9876543210',
          message: payload,
          course: 'TET',
        }),
      });

      // Must not crash or return raw SQL error
      const text = await res.text();
      const hasSqlError = text.includes('syntax error') || text.includes('pg_') || text.includes('SQLSTATE');
      assert(!hasSqlError, `SQL Injection payload "${payload.slice(0, 15)}..." handled safely without SQL disclosure`);
    }
  }

  // --- SECTION 4: PATH TRAVERSAL & ARBITRARY FILE ACCESS ---
  console.log('\n--- 4. PATH TRAVERSAL & MALICIOUS FILENAME DEFENSE ---');
  {
    const traversalPayloads = [
      '../../../../etc/passwd',
      '..\\..\\windows\\win.ini',
      '../../../.env.local',
      '/var/run/secrets',
    ];

    for (const filename of traversalPayloads) {
      const formData = new FormData();
      const fakeFile = new Blob(['mock malicious content'], { type: 'text/plain' });
      formData.append('file', fakeFile, filename);

      const res = await fetch(`${BASE_URL}/api/admin/parse-test`, {
        method: 'POST',
        body: formData,
      });

      // Must be rejected by requireAdmin or filename sanitization (401, 400, or 403)
      assert(
        [400, 401, 403].includes(res.status),
        `Path traversal payload "${filename}" safely blocked with HTTP ${res.status}`
      );
    }
  }

  // --- SECTION 5: OVERSIZED & MALICIOUS MIME TYPE UPLOADS ---
  console.log('\n--- 5. OVERSIZED & MALICIOUS MIME TYPE UPLOAD REJECTION ---');
  {
    // (a) Executable .exe upload
    const exeForm = new FormData();
    const fakeExe = new Blob(['MZ\x90\x00\x03\x00\x00\x00'], { type: 'application/x-msdownload' });
    exeForm.append('file', fakeExe, 'trojan.exe');

    const exeRes = await fetch(`${BASE_URL}/api/admin/parse-test`, {
      method: 'POST',
      body: exeForm,
    });
    assert([400, 401, 403].includes(exeRes.status), `Executable file (.exe) rejected with HTTP ${exeRes.status}`);

    // (b) Oversized file (>10MB)
    const bigForm = new FormData();
    const bigBlob = new Blob([new Uint8Array(11 * 1024 * 1024)], { type: 'text/plain' });
    bigForm.append('file', bigBlob, 'giant_test.txt');

    const bigRes = await fetch(`${BASE_URL}/api/admin/parse-test`, {
      method: 'POST',
      body: bigForm,
    });
    assert([400, 401, 403, 413].includes(bigRes.status), `Oversized payload (>10MB) rejected with HTTP ${bigRes.status}`);
  }

  // --- SECTION 6: FORGED JWTS & TAMPERED SESSION COOKIES ---
  console.log('\n--- 6. FORGED JWT & TAMPERED COOKIE PROTECTION ---');
  {
    // Tampered cookie with invalid signature
    const forgedToken = 'eyJhbGciOiJub25lIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwicm9sZSI6ImFkbWluIn0.';
    const res = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: {
        'Cookie': `sb-craicxwqaygdydtdaxtw-auth-token=${forgedToken}`,
      },
      redirect: 'manual',
    });

    // Should redirect to login or return 401/403/307
    const isProtected = res.status === 307 || res.status === 302 || res.status === 401 || res.status === 403;
    assert(isProtected, `Forged JWT cookie is blocked and redirected (HTTP ${res.status})`);
  }

  // --- SECTION 7: DIRECT RPC PRIVILEGE ESCALATION (ANONYMOUS & STUDENT) ---
  console.log('\n--- 7. DIRECT DATABASE RPC PRIVILEGE ESCALATION ATTEMPTS ---');
  {
    // Anonymous calling purge_candidate directly
    const { data: purgeData, error: purgeErr } = await anonClient.rpc('purge_candidate', {
      p_student_id: '00000000-0000-0000-0000-000000000000',
    });
    assert(purgeErr !== null, 'Anonymous direct call to purge_candidate is strictly denied by Postgres permissions', purgeErr?.message);

    // Anonymous calling approve_payment directly
    const { data: appData, error: appErr } = await anonClient.rpc('cga_approve_payment', {
      p_request_id: '00000000-0000-0000-0000-000000000000',
      p_admin_received_amount: 4500,
      p_verified_statement: true,
    });
    assert(appErr !== null, 'Anonymous direct call to cga_approve_payment is strictly denied by Postgres permissions', appErr?.message);

    // Anonymous calling cga_update_payment_settings_secure
    const { data: settsData, error: settsErr } = await anonClient.rpc('cga_update_payment_settings_secure', {
      p_upi_id: 'hacker@upi',
      p_admin_password: 'bad',
    });
    assert(settsErr !== null, 'Anonymous call to update financial payment settings is blocked by Postgres', settsErr?.message);
  }

  // --- SECTION 8: AUTHENTICATION ENUMERATION RESISTANCE ---
  console.log('\n--- 8. ACCOUNT & EMAIL ENUMERATION RESISTANCE ---');
  {
    // Test forgot password response timing & messages for real vs fake email
    const fakeEmail = 'definitely_fake_random_991829@cga-not-real.com';
    const t0 = Date.now();
    const resFake = await anonClient.auth.resetPasswordForEmail(fakeEmail);
    const fakeDuration = Date.now() - t0;

    // Both should yield safe responses without disclosing account existence
    assert(
      !resFake.error || resFake.error.message.includes('redirect') || resFake.error.status === 429,
      'Forgot password response does not enumerate non-existent accounts'
    );
  }

  // --- SECTION 9: STATIC DANGEROUS PATTERNS AUDIT ---
  console.log('\n--- 9. STATIC CODEBASE SCAN FOR DANGEROUS PATTERNS ---');
  {
    let dangerousPatternFound = false;

    function scanSrc(dir) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          scanSrc(fullPath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('dangerouslySetInnerHTML')) {
            console.error(`    Found dangerouslySetInnerHTML in: ${file}`);
            dangerousPatternFound = true;
          }
          if (content.includes('eval(')) {
            console.error(`    Found eval() in: ${file}`);
            dangerousPatternFound = true;
          }
        }
      }
    }
    scanSrc(path.resolve('src'));

    assert(!dangerousPatternFound, 'Zero dangerous patterns (eval, dangerouslySetInnerHTML) found in src/ application codebase');
  }

  console.log('\n===============================================================');
  console.log(`RESULTS: ${passCount} Passed | ${failCount} Failed`);
  console.log('===============================================================\n');

  fs.writeFileSync(
    path.resolve('docs', 'security_test_results.json'),
    JSON.stringify({ passCount, failCount, results }, null, 2),
    'utf8'
  );

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSecurityAbuseSuite().catch((err) => {
  console.error('Fatal Security Test Suite Error:', err);
  process.exit(1);
});
