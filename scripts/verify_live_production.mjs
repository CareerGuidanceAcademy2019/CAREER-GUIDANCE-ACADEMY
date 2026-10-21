// scripts/verify_live_production.mjs
const BASE_URL = 'https://careerguidanceacademy.vercel.app';
const CRON_SECRET = 'fdef4e0d17c50b6b634646bf6ceff16c1d9c85713f56ef9c41467de4851f0709';

async function runVerification() {
  console.log(`[TEST] Verifying Live Production Hosting at: ${BASE_URL}\n`);
  let passed = 0;
  let failed = 0;

  function assert(condition, description) {
    if (condition) {
      console.log(`  PASS: ${description}`);
      passed++;
    } else {
      console.error(`  FAIL: ${description}`);
      failed++;
    }
  }

  try {
    // 1. Root & Headers Verification
    console.log('1. Checking Live HTTP Security Headers...');
    const homeRes = await fetch(`${BASE_URL}/`, { redirect: 'manual' });
    assert(homeRes.status === 200, `Home page responds with 200 OK (got ${homeRes.status})`);
    
    const csp = homeRes.headers.get('content-security-policy');
    assert(csp && csp.includes("default-src 'self'"), `Content-Security-Policy is present and enforces default-src 'self'`);
    assert(csp && csp.includes("frame-ancestors 'none'"), `CSP enforces frame-ancestors 'none'`);

    const xcto = homeRes.headers.get('x-content-type-options');
    assert(xcto === 'nosniff', `X-Content-Type-Options is nosniff (got ${xcto})`);

    const xfo = homeRes.headers.get('x-frame-options');
    assert(xfo === 'DENY', `X-Frame-Options is DENY (got ${xfo})`);

    const hsts = homeRes.headers.get('strict-transport-security');
    assert(hsts && hsts.includes('max-age=63072000'), `HSTS is active with max-age=63072000 (got ${hsts})`);

    const xPoweredBy = homeRes.headers.get('x-powered-by');
    assert(!xPoweredBy, `X-Powered-By is hidden/suppressed (got ${xPoweredBy})`);

    // 2. Content Verification (Contact info & offline campus PIN)
    console.log('\n2. Checking Contact & Campus details on Home Page...');
    const homeText = await homeRes.text();
    assert(homeText.includes('7005929189'), `Contains correct contact number: 7005929189`);
    assert(homeText.includes('799120'), `Contains correct PIN code: 799120`);

    // 3. Login Page Hardening Verification (no contact numbers or announcements on /login)
    console.log('\n3. Checking Clean Hardened Login Page (/login)...');
    const loginRes = await fetch(`${BASE_URL}/login`);
    const loginText = await loginRes.text();
    assert(loginRes.status === 200, `Login page responds with 200 OK`);
    assert(!loginText.includes('7005929189'), `Login page cleanly omits public contact phone number`);
    assert(!loginText.includes('Admission Announcements'), `Login page cleanly omits admission announcements block`);

    // 4. Secure Cron Endpoint Protection (/api/cron/purge-tests)
    console.log('\n4. Checking Secure Cron Route Protection...');
    const unauthCron = await fetch(`${BASE_URL}/api/cron/purge-tests`);
    assert(unauthCron.status === 401, `Unauthenticated request to /api/cron/purge-tests blocked with 401 (got ${unauthCron.status})`);

    const fakeTokenCron = await fetch(`${BASE_URL}/api/cron/purge-tests`, {
      headers: { Authorization: 'Bearer invalid_attacker_token' }
    });
    assert(fakeTokenCron.status === 401, `Request with spoofed token blocked with 401 (got ${fakeTokenCron.status})`);

    const validCron = await fetch(`${BASE_URL}/api/cron/purge-tests`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}` }
    });
    assert(validCron.status === 200, `Authorized request with CRON_SECRET succeeds with 200 (got ${validCron.status})`);

    // 5. Dynamic Mock Tests Paper PDF Download Route Protection (/api/mock-tests/papers/[paperId])
    console.log('\n5. Checking Mock Test Paper PDF Download Protection...');
    const unauthPaperDownload = await fetch(`${BASE_URL}/api/mock-tests/papers/dummy-paper-id`);
    assert(unauthPaperDownload.status === 401, `Unauthenticated download of paper PDF blocked with 401 (got ${unauthPaperDownload.status})`);

    // 6. Public metadata catalog check (/api/mock-tests/papers)
    const publicCatalog = await fetch(`${BASE_URL}/api/mock-tests/papers`);
    assert(publicCatalog.status === 200, `Public paper catalog metadata route accessible for site visitors (got ${publicCatalog.status})`);

    console.log(`\n========================================`);
    console.log(`VERIFICATION SUMMARY: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Verification error:', err);
    process.exit(1);
  }
}

runVerification();
