import fs from 'node:fs';

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) {
  console.error('SUPABASE_ACCESS_TOKEN environment variable is required');
  process.exit(1);
}
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'craicxwqaygdydtdaxtw';

async function main() {
  const sql = fs.readFileSync('supabase/migrations/0010_account_deletion_flow.sql', 'utf8');
  console.log(`[DEPLOY] Applying Migration 0010 to Supabase [${PROJECT_REF}]...`);

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

  console.log('[SUCCESS] Migration 0010 applied successfully! Response:', text);
}

main().catch(console.error);
