import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Parse .env.local
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

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function makeBackup() {
  const backupDir = path.resolve('backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  const tables = [
    'access_allowlist',
    'account_deletion_requests',
    'achievements',
    'announcements',
    'courses',
    'enquiries',
    'enrollments',
    'faculty',
    'fee_payments',
    'material_access',
    'mock_attempts',
    'mock_launch_log',
    'mock_question_keys',
    'mock_questions',
    'mock_series',
    'mock_subjects',
    'mock_tests',
    'payment_audit_log',
    'payment_requests',
    'payment_settings',
    'profiles',
    'rate_limit_entries',
    'sample_utr_blocklist',
    'security_audit_log',
    'series_enrollments',
    'site_content',
    'study_materials',
    'test_attempts',
    'waiting_list'
  ];

  console.log('Dumping database tables...');
  const dbDump = {
    projectRef: supabaseUrl.replace('https://', '').split('.')[0],
    host: supabaseUrl.replace('https://', '').split('/')[0],
    timestamp: new Date().toISOString(),
    tables: {}
  };

  for (const t of tables) {
    try {
      const { data, error } = await supabase.from(t).select('*');
      if (error) {
        dbDump.tables[t] = { error: error.message };
      } else {
        dbDump.tables[t] = { count: data.length, rows: data };
      }
    } catch (err) {
      dbDump.tables[t] = { exception: err.message };
    }
  }

  const dbDumpPath = path.join(backupDir, `cga_db_dump_${timestamp}.json`);
  fs.writeFileSync(dbDumpPath, JSON.stringify(dbDump, null, 2), 'utf8');

  console.log('Dumping auth users...');
  const { data: authData, error: authErr } = await supabase.auth.admin.listUsers();
  const authDump = {
    timestamp: new Date().toISOString(),
    count: authData?.users?.length || 0,
    error: authErr?.message || null,
    users: authData?.users || []
  };
  const authDumpPath = path.join(backupDir, `cga_auth_dump_${timestamp}.json`);
  fs.writeFileSync(authDumpPath, JSON.stringify(authDump, null, 2), 'utf8');

  console.log('Inventorying storage buckets...');
  const { data: buckets } = await supabase.storage.listBuckets();
  const storageInventory = {
    timestamp: new Date().toISOString(),
    buckets: {}
  };

  if (buckets) {
    for (const b of buckets) {
      const { data: files, error: fErr } = await supabase.storage.from(b.name).list('', { limit: 1000 });
      storageInventory.buckets[b.name] = {
        error: fErr?.message || null,
        count: files?.length || 0,
        files: files || []
      };
    }
  }
  const storageDumpPath = path.join(backupDir, `storage_inventory_${timestamp}.json`);
  fs.writeFileSync(storageDumpPath, JSON.stringify(storageInventory, null, 2), 'utf8');

  // Verify files exist and are not empty
  const dbStat = fs.statSync(dbDumpPath);
  const authStat = fs.statSync(authDumpPath);
  const storageStat = fs.statSync(storageDumpPath);

  console.log('--- BACKUP VERIFICATION ---');
  console.log('DB dump path:', dbDumpPath, 'Size:', dbStat.size, 'bytes');
  console.log('Auth dump path:', authDumpPath, 'Size:', authStat.size, 'bytes');
  console.log('Storage inventory path:', storageDumpPath, 'Size:', storageStat.size, 'bytes');

  if (dbStat.size > 0 && authStat.size > 0 && storageStat.size > 0) {
    console.log('✅ ALL BACKUP FILES VERIFIED AND NON-EMPTY.');
  } else {
    console.error('❌ BACKUP VERIFICATION FAILED: one or more files empty.');
    process.exit(1);
  }
}

makeBackup().catch((err) => {
  console.error('Backup error:', err);
  process.exit(1);
});
