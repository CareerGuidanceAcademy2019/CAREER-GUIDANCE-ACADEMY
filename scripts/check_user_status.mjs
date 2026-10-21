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
  const { data: users, error } = await sb.auth.admin.listUsers();
  if (error) {
    console.error('Error listing users:', error);
    return;
  }
  const angat = users.users.find((u) => u.email === 'angatsaha825@gmail.com');
  console.log('Angat auth user in Supabase:', angat ? { id: angat.id, email: angat.email, phone: angat.phone } : 'NOT FOUND');

  const { data: profile } = await sb.from('profiles').select('*').eq('email', 'angatsaha825@gmail.com');
  console.log('Angat profile in DB:', profile);

  const { data: allowlist } = await sb.from('access_allowlist').select('*').in('identifier', ['angatsaha825@gmail.com', '7629882835']);
  console.log('Angat allowlist entries:', allowlist);

  const { data: faculty } = await sb.from('faculty').select('*').eq('name', 'Angat Saha');
  console.log('Angat faculty entry:', faculty);
}

main();
