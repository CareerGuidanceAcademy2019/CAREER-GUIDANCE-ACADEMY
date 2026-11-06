// End-to-end auth check: signup -> unconfirmed login -> resend -> OTP verify -> login -> cleanup.
// Usage: node scripts/e2e_auth_check.mjs [base-url]   (needs `next start` running; reads .env.local)
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
}
const BASE = process.argv[2] || 'http://localhost:3111';
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = createClient(URL_, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
const admin = createClient(URL_, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const email = `careerguidanceacademy2019+e2e${Date.now()}@gmail.com`;
const password = 'E2eTest@123456';
const phone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
const results = [];
const check = (name, ok, info = '') => { results.push(ok); console.log(`${ok ? '✅' : '❌'} ${name} ${info}`); };
const post = async (p, body) => {
  const r = await fetch(BASE + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  return { status: r.status, json: await r.json().catch(() => ({})) };
};

let userId;
try {
  const su = await anon.auth.signUp({
    email, password,
    options: {
      emailRedirectTo: 'https://careerguidanceacademy.vercel.app/auth/callback',
      data: { name: 'E2E Test Candidate', phone, account_type: 'student', guardian_name: 'E2E Guardian', address: 'Udaipur, Tripura', qualification: 'Graduate', target_exam: 'T-TET' }
    },
  });
  userId = su.data?.user?.id;
  check('1. Signup + confirmation email dispatched', !su.error && !!userId, su.error?.message || '');
  check('1b. No session before confirmation', !su.data?.session);

  const li = await anon.auth.signInWithPassword({ email, password });
  check('2. Login blocked while unconfirmed', !!li.error && /not confirmed/i.test(li.error.message), li.error?.message);

  await new Promise((r) => setTimeout(r, 62000)); // Supabase resend cooldown is 60s
  const rs = await post('/api/auth/resend-signup-otp', { email });
  check('3. Resend OTP API', rs.status === 200 && rs.json.success, JSON.stringify(rs.json));

  const bad = await post('/api/auth/verify-signup-otp', { email, otp: '000000' });
  check('4. Wrong OTP rejected', bad.status === 400, bad.json.error);

  const gl = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  const otp = gl.data?.properties?.email_otp;
  check('5. Obtained valid OTP (admin generateLink)', !!otp);

  const ok = await post('/api/auth/verify-signup-otp', { email, otp });
  check('6. Correct OTP verifies account', ok.status === 200 && ok.json.success, JSON.stringify(ok.json));

  const li2 = await anon.auth.signInWithPassword({ email, password });
  check('7. Login succeeds after verification', !li2.error && !!li2.data.session, li2.error?.message);

  const { data: prof } = await admin.from('profiles').select('role,status,email').eq('id', userId).maybeSingle();
  check('8. Profile created & Active', prof?.status === 'Active' && prof?.role === 'student', JSON.stringify(prof));

  const pages = {};
  for (const p of ['/login', '/register', '/forgot-password']) pages[p] = (await fetch(BASE + p)).status;
  check('9. Auth pages load', Object.values(pages).every((s) => s === 200), JSON.stringify(pages));
} catch (e) {
  check('Unexpected error', false, e.message);
} finally {
  if (userId) {
    await admin.from('profiles').delete().eq('id', userId);
    const d = await admin.auth.admin.deleteUser(userId);
    console.log(d.error ? `cleanup failed: ${d.error.message}` : 'cleanup: test user deleted');
  }
  console.log(results.every(Boolean) ? '\nALL CHECKS PASSED' : '\nSOME CHECKS FAILED');
}
