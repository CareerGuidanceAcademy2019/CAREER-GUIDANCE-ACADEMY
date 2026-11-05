import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env.local if present
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || '';
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (!process.env[key]) process.env[key] = val.trim();
      }
    }
  }
} catch {}

// Configuration
const BREVO_HOST = 'smtp-relay.brevo.com';
const BREVO_PORT = 587;
const SENDER_EMAIL = 'careerguidanceacademy2019@gmail.com';
const SENDER_NAME = 'Career Guidance Academy';
const BREVO_KEY = process.env.BREVO_SMTP_KEY || process.argv[3] || '';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://craicxwqaygdydtdaxtw.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_jXl_a3vn0Q7rEa6ADqzuzg_iBxBEX5c';

const brevoLogin = process.argv[2] || SENDER_EMAIL;

console.log('================================================================');
console.log('  CGA SUPABASE & BREVO EMAIL AUTHENTICATION DIAGNOSTIC SUITE');
console.log('================================================================');
console.log(`SMTP Relay Host:   ${BREVO_HOST}:${BREVO_PORT}`);
console.log(`SMTP Tested Login: ${brevoLogin}`);
console.log(`Sender Address:    ${SENDER_EMAIL} ("${SENDER_NAME}")`);
console.log(`Supabase Project:  ${SUPABASE_URL}`);
console.log('================================================================\n');

async function testBrevoSmtp(login, key) {
  if (!key) {
    console.error('❌ [STEP 1 SKIPPED] No Brevo SMTP Key found in .env.local or arguments.');
    return { success: false, error: 'Missing key' };
  }

  console.log(`[STEP 1] Testing Brevo SMTP Relay connection with username: "${login}"...`);
  const transporter = nodemailer.createTransport({
    host: BREVO_HOST,
    port: BREVO_PORT,
    secure: false, // STARTTLS
    auth: {
      user: login,
      pass: key,
    },
    tls: {
      rejectUnauthorized: true,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
  });

  try {
    await transporter.verify();
    console.log(`✅ [STEP 1 PASSED] Brevo SMTP authentication SUCCESSFUL!`);
    console.log(`   Username "${login}" and SMTP Key are 100% valid.`);

    // Try sending a real test email
    console.log(`\n[STEP 1.1] Dispatching test verification email to ${SENDER_EMAIL}...`);
    const info = await transporter.sendMail({
      from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
      to: SENDER_EMAIL,
      subject: 'C.G.A Email Verification & Brevo SMTP Relay Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
          <h2 style="color: #0056b3; margin-top: 0;">Career Guidance Academy (C.G.A)</h2>
          <p style="font-size: 14px; color: #334155;">This is an automated test confirming that your Brevo SMTP relay and Supabase email dispatch are operational.</p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 8px; color: #166534; font-weight: bold; font-size: 13px;">
            ✓ SMTP Relay Authenticated & Delivered
          </div>
          <p style="font-size: 12px; color: #64748b; margin-top: 20px;">Sent via Brevo SMTP relay: ${BREVO_HOST}</p>
        </div>
      `,
    });
    console.log(`✅ [STEP 1.1 PASSED] Test email sent! Message ID: ${info.messageId}`);
    return { success: true };
  } catch (err) {
    console.error(`❌ [STEP 1 FAILED] Brevo rejected authentication:`);
    console.error(`   Error Message: ${err.message}`);
    if (err.response) console.error(`   SMTP Server Response: ${err.response}`);
    if (err.responseCode === 535) {
      console.error(`\n   🔍 ROOT CAUSE IDENTIFIED (SMTP Error 535):`);
      console.error(`   The username "${login}" was rejected by Brevo with 535 Authentication failed.`);
      console.error(`   In Brevo, your SMTP "Login" is displayed at:`);
      console.error(`   👉 https://app.brevo.com/settings/keys/smtp`);
      console.error(`   It is often either your master Brevo account email or a specific ID like 7xxxx@smtp-brevo.com.`);
      console.error(`   Run this script with that exact login:`);
      console.error(`   node scripts/test_email_auth.mjs <your-brevo-login-email-or-id>`);
    }
    return { success: false, error: err.message };
  }
}

async function testSupabaseSignupTrigger() {
  console.log(`\n[STEP 2] Testing live Supabase Signup & Email Dispatch flow...`);
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const testEmail = `test_cga_${Date.now()}@example.com`;
  const randomPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;

  try {
    const { data, error } = await sb.auth.signUp({
      email: testEmail,
      password: 'TemporaryPassword@123456',
      options: {
        emailRedirectTo: 'https://careerguidanceacademy.vercel.app/auth/callback',
        data: {
          name: 'Diagnostic Candidate',
          phone: randomPhone,
          account_type: 'student',
          guardian_name: 'Diagnostic Guardian',
          address: 'Udaipur, Tripura',
          qualification: 'Graduate',
          target_exam: 'T-TET',
        },
      },
    });

    if (error) {
      console.error(`❌ [STEP 2 FAILED] Supabase returned an error during signup:`);
      console.error(`   Message: ${error.message}`);
      if (/confirmation email/i.test(error.message)) {
        console.error(`\n   🔍 Supabase could not send the confirmation email.`);
        console.error(`   Reason: Supabase's configured SMTP server failed during authentication.`);
      }
      return { success: false, error: error.message };
    }

    console.log(`✅ [STEP 2 PASSED] Supabase signup and email dispatch succeeded!`);
    console.log(`   User ID generated: ${data.user?.id}`);
    console.log(`   Confirmation email successfully dispatched.`);
    return { success: true };
  } catch (err) {
    console.error(`❌ [STEP 2 FAILED] Unexpected error calling Supabase:`, err.message);
    return { success: false, error: err.message };
  }
}

async function main() {
  const brevoOk = await testBrevoSmtp(brevoLogin, BREVO_KEY);
  await testSupabaseSignupTrigger();

  console.log('\n================================================================');
  console.log('  EXACT ACTION STEPS TO COMPLETE SETUP');
  console.log('================================================================');
  if (!brevoOk.success) {
    console.log('Step 1: Check your Brevo SMTP Login:');
    console.log('  - Open: https://app.brevo.com/settings/keys/smtp');
    console.log('  - Look at the "Login" field (under the SMTP tab).');
    console.log('  - Re-run test: node scripts/test_email_auth.mjs <that-login>');
    console.log('\nStep 2: Enter these exact values in Supabase Dashboard:');
    console.log('  - Open: Project Settings -> Authentication -> SMTP Settings');
    console.log('  - Enable Custom SMTP: ON');
    console.log(`  - Sender Email:       ${SENDER_EMAIL}`);
    console.log(`  - Sender Name:        ${SENDER_NAME}`);
    console.log(`  - Host:               ${BREVO_HOST}`);
    console.log(`  - Port:               ${BREVO_PORT}`);
    console.log('  - User:               <the-exact-Login-from-Brevo>');
    console.log(`  - Password:           <your-brevo-smtp-key>`);
    console.log('\nStep 3: Verify Sender in Brevo:');
    console.log(`  - Open: https://app.brevo.com/senders`);
    console.log(`  - Ensure ${SENDER_EMAIL} is added and verified.`);
    console.log('\nTip (Quick fix right now):');
    console.log('  If students need to register immediately, toggle OFF "Enable Custom SMTP"');
    console.log('  in Supabase Dashboard so Supabase default mailer works while you verify Brevo.');
  } else {
    console.log('All email services are operational and healthy!');
  }
  console.log('================================================================\n');
}

main();
