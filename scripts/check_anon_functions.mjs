import fs from 'node:fs';

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) {
  console.error('SUPABASE_ACCESS_TOKEN environment variable is required');
  process.exit(1);
}
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'craicxwqaygdydtdaxtw';

async function main() {
  const sql = `
    select
      p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as args,
      p.prosecdef as is_security_definer
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and has_function_privilege('anon', p.oid, 'EXECUTE')
    order by p.proname;
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
    console.error('Failed to query anon functions:', await res.text());
    process.exit(1);
  }

  const rows = await res.json();
  console.log('--- ALL FUNCTIONS EXECUTABLE BY ANON ---');
  console.table(rows);
}

main().catch(console.error);
