import fs from 'node:fs';

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) {
  console.error('SUPABASE_ACCESS_TOKEN environment variable is required');
  process.exit(1);
}
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'craicxwqaygdydtdaxtw';

async function main() {
  const sql = `
    select id, name, public, file_size_limit, allowed_mime_types
    from storage.buckets;
  `;

  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    console.error('Failed to query storage.buckets:', await res.text());
    process.exit(1);
  }

  const buckets = await res.json();
  console.log('--- STORAGE BUCKETS ---');
  console.table(buckets);

  const polSql = `
    select policyname, cmd, qual, with_check
    from pg_policies
    where schemaname = 'storage' and tablename = 'objects';
  `;

  const polRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: polSql }),
  });

  const policies = await polRes.json();
  console.log('\n--- STORAGE OBJECT POLICIES ---');
  console.table(policies);
}

main().catch(console.error);
