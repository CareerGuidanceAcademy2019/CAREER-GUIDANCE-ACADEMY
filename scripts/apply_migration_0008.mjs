import fs from 'node:fs';

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) {
  console.error('SUPABASE_ACCESS_TOKEN environment variable is required');
  process.exit(1);
}

async function main() {
  const sql = fs.readFileSync('supabase/migrations/0008_security_hardening.sql', 'utf8');
  console.log(`📡 Applying Migration 0008 to Supabase [${PROJECT_REF}]...`);

  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  const text = await response.text();
  if (!response.ok) {
    console.error('Migration failed:', text);
    process.exit(1);
  }

  console.log('✅ Migration 0008 applied successfully! Response:', text);
}

main().catch(console.error);
