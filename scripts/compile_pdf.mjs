import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const htmlPath = path.join(rootDir, 'scripts', 'overview.html');
const outPdf1 = path.join(rootDir, 'Career_Guidance_Academy_Detailed_Project_Overview.pdf');
const outPdf2 = path.join(rootDir, 'documentattion', 'Career_Guidance_Academy_Detailed_Project_Overview.pdf');

const candidates = [
  'C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe',
  'C:\\\\Program Files (x86)\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe',
  'C:\\\\Program Files\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe'
];

const browser = candidates.find((p) => fs.existsSync(p));
if (!browser) {
  console.error('No compatible browser found for PDF rendering.');
  process.exit(1);
}

console.log('Using browser:', browser);
const cmd = `"${browser}" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${outPdf1}" "${htmlPath}"`;
console.log('Running:', cmd);

execSync(cmd, { stdio: 'inherit' });

if (fs.existsSync(outPdf1)) {
  const stat = fs.statSync(outPdf1);
  console.log(`Successfully generated primary PDF (${stat.size} bytes) at: ${outPdf1}`);

  fs.copyFileSync(outPdf1, outPdf2);
  console.log(`Copied to documentation folder at: ${outPdf2}`);
} else {
  console.error('Failed: output PDF was not found.');
  process.exit(1);
}
