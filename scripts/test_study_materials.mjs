import assert from 'node:assert';
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://craicxwqaygdydtdaxtw.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error('Set SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
const sb = createClient(URL_, KEY);

let passed = 0;
const ok = (name) => { passed++; console.log('✓', name); };
const id = `mat-test-${Date.now()}`;

const { data: course } = await sb.from('courses').select('id').limit(1).maybeSingle();
assert.ok(course, 'at least one course must exist');

const row = {
  id, title: 'ZZ TEST MATERIAL', course_id: course.id, type: 'Paid Notes', ca_category: null,
  drive_link: 'https://drive.google.com/x', access_scope: 'enrolled', subject: 'Test', author: 'T',
  pages: 1, file_size: '1 MB', uploaded_date: '2026-11-11', description: '', preview_sections: [], price: 0,
};

try {
  // T1: submitting the same material 3x (double-click / retry) must yield exactly ONE row
  for (let i = 0; i < 3; i++) {
    const { error } = await sb.from('study_materials').upsert(row);
    assert.ifError(error);
  }
  let { data } = await sb.from('study_materials').select('id').eq('id', id);
  assert.equal(data.length, 1, 'upsert must be idempotent');
  ok('T1 repeated upsert of one material creates exactly 1 row');

  // T2: concurrent upserts still produce 1 row
  await Promise.all([1, 2, 3].map(() => sb.from('study_materials').upsert(row)));
  ({ data } = await sb.from('study_materials').select('id').eq('id', id));
  assert.equal(data.length, 1);
  ok('T2 concurrent upserts produce 1 row');

  // T3: no title duplicates created for this title
  const { data: byTitle } = await sb.from('study_materials').select('id').eq('title', row.title);
  assert.equal(byTitle.length, 1);
  ok('T3 no duplicate rows by title');

  // T4: delete is fast and removes the row
  const t0 = Date.now();
  await sb.from('material_access').delete().eq('material_id', id);
  const { error: dErr } = await sb.from('study_materials').delete().eq('id', id);
  assert.ifError(dErr);
  const ms = Date.now() - t0;
  ({ data } = await sb.from('study_materials').select('id').eq('id', id));
  assert.equal(data.length, 0);
  ok(`T4 delete removes row (${ms}ms DB time)`);
} finally {
  await sb.from('study_materials').delete().eq('id', id);
}

// Static regression checks on the fixed code paths
const ctx = fs.readFileSync('src/context/CgaContext.tsx', 'utf8');
const page = fs.readFileSync('src/app/admin/materials/page.tsx', 'utf8');
const svc = fs.readFileSync('src/services/cgaService.ts', 'utf8');
const saveBlock = ctx.slice(ctx.indexOf('const saveMaterial'), ctx.indexOf('const deleteMaterial'));
assert.ok(!/run\(cgaService\.upsertMaterial/.test(saveBlock), 'saveMaterial must not trigger full reload via run()');
ok('T5 saveMaterial does not trigger a full database reload');
assert.equal((saveBlock.match(/showToast\(\s*isCa/g) || []).length, 1, 'exactly one success toast');
assert.ok(!/showToast\(isNew \? 'Study Material Posted'/.test(page) && !/Current Affairs Published/.test(page), 'page must not add a 2nd toast');
ok('T6 exactly one success toast per upload');
assert.ok(/savingRef\.current/.test(page), 'double-submit guard');
ok('T7 double-submit guard present');
assert.ok(/forgetLocalDeletedMaterial\(id\)/.test(svc), 'tombstone cleanup');
ok('T8 local delete tombstone cleaned (no ghost/hidden rows)');
assert.ok(/prev\.studyMaterials \|\| \[\]\)\.filter\(\(x, i, arr\)/.test(ctx), 'optimistic dedupe by id');
ok('T9 optimistic list is de-duplicated by id');
assert.equal(JSON.parse(fs.readFileSync('vercel.json', 'utf8')).regions[0], 'sin1');
ok('T10 serverless functions pinned to sin1 (same region as Supabase ap-southeast-1)');

console.log(`\nALL ${passed} TESTS PASSED`);

