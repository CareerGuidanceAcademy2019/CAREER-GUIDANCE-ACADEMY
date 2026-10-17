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
      p.prosecdef as is_security_definer,
      p.proconfig as settings,
      case when p.prosecdef and (p.proconfig is null or not ('search_path=' = any(p.proconfig) or 'search_path=""' = any(p.proconfig)))
           then 'MISSING FIXED SEARCH_PATH'
           else 'SECURE'
      end as search_path_status
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
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
    console.error('Failed to query pg_proc:', await res.text());
    process.exit(1);
  }

  const rows = await res.json();
  console.log('--- AUDIT OF SECURITY DEFINER FUNCTIONS IN PUBLIC ---');
  let issues = 0;
  for (const r of rows) {
    if (r.is_security_definer) {
      console.log(`- ${r.function_name}(${r.args}): ${r.search_path_status} (config: ${JSON.stringify(r.settings)})`);
      if (r.search_path_status !== 'SECURE') {
        issues++;
      }
    }
  }
  console.log(`\nTotal Security Definer functions checked: ${rows.filter(r => r.is_security_definer).length}. Issues: ${issues}`);
}

main().catch(console.error);
