import fs from 'node:fs';

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) {
  console.error('SUPABASE_ACCESS_TOKEN environment variable is required');
  process.exit(1);
}
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'craicxwqaygdydtdaxtw';

async function main() {
  console.log('[START] Loading supabase/COMPLETE_INSTITUTE_SETUP.sql...');
  const sql = fs.readFileSync('supabase/COMPLETE_INSTITUTE_SETUP.sql', 'utf8');
  console.log(`[FILE] SQL file loaded: ${sql.length} characters.`);

  console.log(`[DEPLOY] Sending master initialization script to Supabase project [${PROJECT_REF}]...`);
  
  const startTime = Date.now();
  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const text = await response.text();

  if (!response.ok) {
    console.error(`[FAIL] Execution failed after ${duration}s (HTTP ${response.status}):`);
    console.error(text);
    process.exit(1);
  }

  console.log(`[SUCCESS] Success in ${duration}s! Response:`, text);
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
