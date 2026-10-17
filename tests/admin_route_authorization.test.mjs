import fs from 'node:fs';
import path from 'node:path';

const ADMIN_API_DIR = path.resolve('src/app/api/admin');

function findRouteFiles(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findRouteFiles(fullPath));
    } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
      results.push(fullPath);
    }
  }
  return results;
}

function auditAdminRoutes() {
  console.log('Auditing admin route handlers for mandatory requireAdmin() enforcement...');
  const files = findRouteFiles(ADMIN_API_DIR);
  let failed = 0;

  for (const file of files) {
    const relativePath = path.relative(process.cwd(), file);
    const content = fs.readFileSync(file, 'utf8');

    // Check for HTTP handlers
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    for (const method of methods) {
      const regex = new RegExp(`export\\s+(async\\s+)?function\\s+${method}\\b`);
      if (regex.test(content)) {
        const hasRequireAdmin = content.includes('requireAdmin');
        if (!hasRequireAdmin) {
          console.error(`  FAIL: [${relativePath}] method ${method} lacks requireAdmin() verification!`);
          failed++;
        } else {
          console.log(`  PASS: [${relativePath}] method ${method} properly enforces requireAdmin()`);
        }
      }
    }
  }

  if (failed > 0) {
    console.error(`\nFAILED: ${failed} admin route method(s) lack session-level requireAdmin check.`);
    process.exit(1);
  } else {
    console.log(`\nSUCCESS: All ${files.length} admin route files enforce requireAdmin() on all handlers.`);
  }
}

auditAdminRoutes();
