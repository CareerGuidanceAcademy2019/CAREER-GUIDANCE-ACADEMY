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
      has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
      has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_can_execute
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'purge_candidate',
        'delete_candidate_by_admin',
        'approve_payment',
        'reject_payment',
        'enrol_in_series',
        'submit_mock_attempt',
        'update_payment_settings_secure'
      )
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
    console.error('Failed to query privileges:', await res.text());
    process.exit(1);
  }

  const rows = await res.json();
  console.log('--- FUNCTION EXECUTE PRIVILEGES ---');
  console.table(rows);
}

main().catch(console.error);
