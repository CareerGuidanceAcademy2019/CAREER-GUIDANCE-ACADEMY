import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const idx = trimmed.indexOf('=');
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
}

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('1. Updating user angatsaha825@gmail.com with password CGA@angat12...');
  
  // Find user
  const { data: list, error: listErr } = await sb.auth.admin.listUsers();
  if (listErr) throw listErr;
  
  let angat = list.users.find(u => u.email === 'angatsaha825@gmail.com');
  if (!angat) {
    console.log('User not found, creating user...');
    const { data: created, error: createErr } = await sb.auth.admin.createUser({
      email: 'angatsaha825@gmail.com',
      password: 'CGA@angat12',
      email_confirm: true,
      user_metadata: { name: 'Angat Saha', phone: '7629882835' },
    });
    if (createErr) throw createErr;
    angat = created.user;
  } else {
    const { data: updated, error: updateErr } = await sb.auth.admin.updateUserById(angat.id, {
      password: 'CGA@angat12',
      email_confirm: true,
      user_metadata: { name: 'Angat Saha', phone: '7629882835' },
    });
    if (updateErr) throw updateErr;
    console.log('Password updated successfully for auth user:', angat.id);
  }

  // Update profile
  await sb.from('profiles').upsert({
    id: angat.id,
    role: 'admin',
    name: 'Angat Saha',
    email: 'angatsaha825@gmail.com',
    phone: '7629882835',
    student_code: 'CGA-2026-001',
    guardian_name: 'Institute Administration',
    address: 'Chanban Youth Club Rd, Udaipur, Tripura 799120',
    permanent_address: 'Chanban Youth Club Rd, Udaipur, Tripura 799120',
    qualification: 'Post Graduate (M.Sc, B.Ed)',
    target_exam: 'Director & Faculty Administration',
    status: 'Active',
  });

  // Update access_allowlist for both email and phone
  await sb.from('access_allowlist').upsert([
    { identifier: 'angatsaha825@gmail.com', role: 'admin', note: 'Angat Saha - Institute Director & Super Administrator' },
    { identifier: '7629882835', role: 'admin', note: 'Angat Saha - Primary Mobile Access' },
  ], { onConflict: 'identifier' });

  // Update faculty row
  await sb.from('faculty').upsert({
    name: 'Angat Saha',
    designation: 'Director & Senior Faculty',
    subject: 'Career Guidance & General Studies',
    qualification: 'Post Graduate (M.Sc, B.Ed)',
    experience: '8+ Years of Academic Mentorship',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    bio: 'Leading Career Guidance Academy (C.G.A), mentoring students across Udaipur and Tripura for competitive examinations.',
    profile_id: angat.id,
    achievements: 'Mentored top rankers across STGT, T-TET, and competitive state exams.',
    work_ability: 'Online & Offline',
    approval_status: 'Approved',
  }, { onConflict: 'profile_id' });

  console.log('✓ Profile, allowlist, and faculty records synced.');

  // Test sign in with password
  const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  const { data: signin, error: signinErr } = await anon.auth.signInWithPassword({
    email: 'angatsaha825@gmail.com',
    password: 'CGA@angat12',
  });
  if (signinErr) {
    console.error('Sign in test failed:', signinErr);
  } else {
    console.log('✓ Successfully authenticated with password CGA@angat12! Session user ID:', signin.user.id);
  }
}

main().catch(console.error);
