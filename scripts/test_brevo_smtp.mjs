import nodemailer from 'nodemailer';
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

const key = process.env.BREVO_SMTP_KEY || process.argv[3] || '';
const candidateLogins = process.argv[2]
  ? [process.argv[2]]
  : [
      'careerguidanceacademy2019@gmail.com',
      'er.angadtech@gmail.com',
      'angatsaha825@gmail.com',
    ];

async function testLogin(user) {
  console.log(`\n========================================`);
  console.log(`Testing SMTP with user: ${user}`);
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // TLS
    auth: {
      user: user,
      pass: key,
    },
    tls: {
      rejectUnauthorized: true,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  try {
    await transporter.verify();
    console.log(`>>> SUCCESS! Username "${user}" authenticated successfully with Brevo!`);
    return { user, success: true };
  } catch (err) {
    console.log(`>>> FAILED for "${user}":`, err.message);
    if (err.response) console.log(`    SMTP Response: ${err.response}`);
    if (err.responseCode) console.log(`    Response Code: ${err.responseCode}`);
    return { user, success: false, error: err.message, response: err.response };
  }
}

async function run() {
  for (const user of candidateLogins) {
    await testLogin(user);
  }
}

run();
