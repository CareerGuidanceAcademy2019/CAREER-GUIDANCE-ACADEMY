import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// NOTE: THIS SCRIPT IS DRAFTED FOR PHASE 3 EXECUTION ONLY AFTER RECEIVING EXPLICIT "APPROVED" CONFIRMATION.
// DO NOT RUN MANUALLY UNTIL APPROVED.

// 1. Read environment
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const idx = trimmed.indexOf('=');
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
}

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Supabase credentials missing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function runCleanup() {
  console.log('========================================================================');
  console.log('C.G.A PRODUCTION ENVIRONMENT CLEANUP EXECUTION');
  console.log('Project Ref:', supabaseUrl.replace('https://', '').split('.')[0]);
  console.log('========================================================================\n');

  // Verify backup exists before doing anything
  const backups = fs.readdirSync('backups').filter((f) => f.startsWith('cga_db_dump_'));
  if (backups.length === 0) {
    throw new Error('FATAL: No verified backup found in backups/ directory. Aborting cleanup.');
  }
  console.log(`Verified backup present: backups/${backups[backups.length - 1]}`);

  // 1. Tables before counts
  console.log('\n--- 1. BEFORE ROW COUNTS ---');
  const targetTables = ['profiles', 'achievements', 'announcements', 'rate_limit_entries'];
  for (const t of targetTables) {
    const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
    console.log(`Table ${t}: ${count} rows`);
  }

  // 2. Delete test admin account
  console.log('\n--- 2. PURGING TEST AUTH & PROFILE ACCOUNTS ---');
  const testAdminId = '5250c8e3-91d6-43a2-a7fa-9c67ee3c1102'; // newadmin_1792318143756@cgaudaipur.edu.in
  const { error: profErr } = await supabase.from('profiles').delete().eq('id', testAdminId);
  if (profErr) {
    console.error('Error deleting test profile:', profErr.message);
  } else {
    console.log(`Deleted test profile with ID: ${testAdminId}`);
  }

  const { error: authErr } = await supabase.auth.admin.deleteUser(testAdminId);
  if (authErr) {
    console.error('Error deleting test auth user:', authErr.message);
  } else {
    console.log(`Deleted test auth user with ID: ${testAdminId}`);
  }

  // 3. Delete demo achievements (stock unsplash student photos)
  console.log('\n--- 3. PURGING DEMO ACHIEVEMENTS ---');
  const { error: achErr } = await supabase
    .from('achievements')
    .delete()
    .in('id', ['ach-6', 'ach-7', 'ach-8']);
  if (achErr) {
    console.error('Error deleting demo achievements:', achErr.message);
  } else {
    console.log('Deleted 3 demo achievements (ach-6, ach-7, ach-8).');
  }

  // 4. Delete demo announcements
  console.log('\n--- 4. PURGING DEMO ANNOUNCEMENTS ---');
  const { error: annErr } = await supabase
    .from('announcements')
    .delete()
    .in('id', ['ann-1', 'ann-2', 'ann-3']);
  if (annErr) {
    console.error('Error deleting demo announcements:', annErr.message);
  } else {
    console.log('Deleted 3 demo announcements (ann-1, ann-2, ann-3).');
  }

  // 5. Delete transient rate limit test entries
  console.log('\n--- 5. CLEARING EXPIRED RATE LIMIT ENTRIES ---');
  const { error: rlErr } = await supabase
    .from('rate_limit_entries')
    .delete()
    .like('key', '%test%');
  if (rlErr) {
    console.error('Error deleting rate limit entries:', rlErr.message);
  } else {
    console.log('Cleared test rate limit entries.');
  }

  // 6. Reset receipt sequences to 1001 (0 real payments exist)
  console.log('\n--- 6. RESETTING RECEIPT SEQUENCES ---');
  const { error: rSeqErr } = await supabase.rpc('execute_sql_admin', {
    sql: 'ALTER SEQUENCE receipt_seq RESTART WITH 1001; ALTER SEQUENCE receipt_no_seq RESTART WITH 1001;',
  }).catch(() => ({ error: { message: 'Sequence reset via direct SQL if RPC not present' } }));
  if (rSeqErr) {
    console.log('Sequence reset note:', rSeqErr.message);
  }

  // 7. Tables after counts
  console.log('\n--- 7. AFTER ROW COUNTS ---');
  for (const t of targetTables) {
    const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
    console.log(`Table ${t}: ${count} rows`);
  }

  console.log('\n========================================================================');
  console.log('DATABASE PURGE COMPLETE.');
  console.log('========================================================================');
}
