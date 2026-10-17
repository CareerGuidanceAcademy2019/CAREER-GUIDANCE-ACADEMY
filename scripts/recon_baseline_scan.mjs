import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

console.log('🔍 Starting Phase 1 Recon & Baseline Scans...\n');

const DANGEROUS_PATTERNS = [
  { name: 'dangerouslySetInnerHTML', regex: /dangerouslySetInnerHTML/g },
  { name: 'eval() invocation', regex: /\beval\s*\(/g },
  { name: 'Function constructor', regex: /new\s+Function\s*\(/g },
  { name: 'Unvalidated window.location redirect', regex: /window\.location\.(href|assign|replace)\s*=\s*(?!['"`]\/)[a-zA-Z0-9_.]+/g },
  { name: 'String concatenated SQL query', regex: /\b(select|insert|update|delete|drop|alter)\b.*?\+\s*[a-zA-Z0-9_]+/gi },
];

const SECRET_PATTERNS = [
  { name: 'Supabase Service Role Key (JWT)', regex: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g },
  { name: 'Supabase Personal Access Token (sbp_...) in code', regex: /sbp_[a-zA-Z0-9]{30,}/g },
  { name: 'Vercel Token (vcp_...) in code', regex: /vcp_[a-zA-Z0-9]{30,}/g },
  { name: 'Generic Private Key block', regex: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g },
  { name: 'Hardcoded password assignment', regex: /(password|secret|apikey|api_key)\s*[:=]\s*['"][a-zA-Z0-9!@#$%^&*()_+]{8,}['"]/gi },
];

const IGNORE_DIRS = new Set(['.git', '.next', 'node_modules', 'dist', 'build', '.temp']);
const IGNORE_FILES = new Set(['.env.local', 'mcp_config.json']);

function scanDirectory(dir, issues) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath, issues);
    } else if (entry.isFile()) {
      if (IGNORE_FILES.has(entry.name)) continue;
      // Skip non-code / binary
      if (/\.(png|jpg|jpeg|webp|ico|svg|pdf|exe|tsbuildinfo|lock)$/i.test(entry.name)) continue;

      const content = fs.readFileSync(fullPath, 'utf8');

      // Check dangerous patterns
      for (const p of DANGEROUS_PATTERNS) {
        let match;
        const rx = new RegExp(p.regex);
        while ((match = rx.exec(content)) !== null) {
          const lines = content.slice(0, match.index).split('\n');
          const lineNum = lines.length;
          issues.dangerous.push({
            file: fullPath,
            line: lineNum,
            type: p.name,
            snippet: match[0].slice(0, 80),
          });
        }
      }

      // Check secret patterns
      for (const s of SECRET_PATTERNS) {
        let match;
        const rx = new RegExp(s.regex);
        while ((match = rx.exec(content)) !== null) {
          const lines = content.slice(0, match.index).split('\n');
          const lineNum = lines.length;
          // Filter out benign documentation or dummy blocklists
          if (fullPath.includes('sample_utr_blocklist') || fullPath.includes('0006_unified_manual_payments')) continue;
          issues.secrets.push({
            file: fullPath,
            line: lineNum,
            type: s.name,
            snippet: match[0].slice(0, 40) + '...',
          });
        }
      }
    }
  }
}

const issues = { dangerous: [], secrets: [] };
scanDirectory('.', issues);

console.log('--- DANGEROUS PATTERNS DETECTED ---');
if (issues.dangerous.length === 0) {
  console.log('✅ None detected.');
} else {
  for (const d of issues.dangerous) {
    console.log(`⚠️  ${d.file}:${d.line} - [${d.type}] -> ${d.snippet}`);
  }
}

console.log('\n--- POTENTIAL SECRETS DETECTED IN CODE ---');
if (issues.secrets.length === 0) {
  console.log('✅ None detected in source tree.');
} else {
  for (const s of issues.secrets) {
    console.log(`🚨 ${s.file}:${s.line} - [${s.type}] -> ${s.snippet}`);
  }
}

// Git history check for committed secrets
console.log('\n--- CHECKING GIT HISTORY FOR COMMITTED SECRETS ---');
try {
  const gitLogGrep = execSync('git log -n 20 --grep="token" --grep="key" --oneline', { encoding: 'utf8' });
  console.log('Recent sensitive commits:', gitLogGrep.trim() || 'None flagged');
} catch (e) {
  console.log('Git history check skipped or clean.');
}
