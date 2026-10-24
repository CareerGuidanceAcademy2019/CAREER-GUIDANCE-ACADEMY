import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://craicxwqaygdydtdaxtw.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ Supabase service role key missing');
  process.exit(1);
}

const sb = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  console.log('🧪 Starting Verification: Delete All Questions & Comprehension Sections...\n');
  let passed = 0;
  let failed = 0;

  const testId = `test-comp-verify-${Date.now()}`;

  try {
    // 1. Create a dummy mock test
    console.log('--- TEST 1: Setup test and insert 10 standalone MCQs + 5 comprehension MCQs ---');
    const { error: testErr } = await sb.from('mock_tests').insert({
      id: testId,
      series_id: 'series-ttet-paper1',
      title: 'Comprehension & Clear Verification Test',
      batch_name: 'Test Batch',
      subject: 'Language – I (English) [English Only]',
      duration_minutes: 30,
      total_marks: 15,
      marks_per_question: 1,
      negative_marking: 0,
      status: 'draft',
      question_count: 15,
    });
    if (testErr) throw testErr;

    // 2. Insert Comprehension Passage
    const groupId = `grp-test-${Date.now()}`;
    const { error: grpErr } = await sb.from('mock_question_groups').insert({
      id: groupId,
      test_id: testId,
      position: 1,
      passage_text: 'Read the following poem and answer questions 11 to 15:\n\nThe woods are lovely, dark and deep...',
      image_alt: 'Robert Frost Poem Comprehension',
    });
    if (grpErr) throw grpErr;

    // 3. Insert 10 Standalone MCQs (Q1–Q10) + 5 Comprehension MCQs (Q11–Q15)
    const questionsToInsert = [];
    for (let i = 1; i <= 10; i++) {
      questionsToInsert.push({
        id: `q-std-${testId}-${i}`,
        test_id: testId,
        position: i,
        group_id: null,
        question_text: `Standalone question ${i}: What is the meaning of life?`,
        options: ['Happiness', 'Knowledge', 'Wisdom', 'Peace'],
      });
    }
    for (let i = 11; i <= 15; i++) {
      questionsToInsert.push({
        id: `q-comp-${testId}-${i}`,
        test_id: testId,
        position: i,
        group_id: groupId, // Linked to the comprehension passage
        question_text: `Comprehension question ${i}: What poetic device is used in line ${i - 10}?`,
        options: ['Metaphor', 'Simile', 'Alliteration', 'Hyperbole'],
      });
    }

    const { error: qInsertErr } = await sb.from('mock_questions').insert(questionsToInsert);
    if (qInsertErr) throw qInsertErr;

    // Verify 15 questions exist and 5 are linked to the comprehension group
    const { data: insertedQs, error: fetchErr } = await sb
      .from('mock_questions')
      .select('id, position, group_id')
      .eq('test_id', testId)
      .order('position', { ascending: true });
    if (fetchErr) throw fetchErr;

    const standaloneCount = insertedQs.filter((q) => q.group_id === null).length;
    const compCount = insertedQs.filter((q) => q.group_id === groupId).length;

    if (insertedQs.length === 15 && standaloneCount === 10 && compCount === 5) {
      console.log('✅ PASS: Successfully created 10 standalone MCQs and 5 Comprehension MCQs linked to passage');
      passed++;
    } else {
      console.error('❌ FAIL: Incorrect question counts', { total: insertedQs.length, standaloneCount, compCount });
      failed++;
    }

    // 4. Test "Delete All Loaded Questions" Operation
    console.log('\n--- TEST 2: Execute Delete All Questions operation ---');
    // Execute deletion of questions, groups, and reset question_count
    await sb.from('mock_questions').delete().eq('test_id', testId);
    await sb.from('mock_question_groups').delete().eq('test_id', testId);
    await sb.from('mock_tests').update({ question_count: 0, questions: [] }).eq('id', testId);

    // Verify everything is wiped clean
    const { data: remainingQs } = await sb.from('mock_questions').select('id').eq('test_id', testId);
    const { data: remainingGrps } = await sb.from('mock_question_groups').select('id').eq('test_id', testId);
    const { data: updatedTest } = await sb.from('mock_tests').select('question_count').eq('id', testId).single();

    if (
      remainingQs && remainingQs.length === 0 &&
      remainingGrps && remainingGrps.length === 0 &&
      updatedTest && updatedTest.question_count === 0
    ) {
      console.log('✅ PASS: All questions and comprehension passages cleanly deleted in single operation');
      passed++;
    } else {
      console.error('❌ FAIL: Residual data found after delete all', {
        remainingQs: remainingQs?.length,
        remainingGrps: remainingGrps?.length,
        questionCount: updatedTest?.question_count,
      });
      failed++;
    }

    // Clean up dummy test
    await sb.from('mock_tests').delete().eq('id', testId);
    console.log(`🧹 Cleaned up test record ${testId}`);

  } catch (err) {
    console.error('❌ FAIL:', err.message);
    failed++;
    try {
      await sb.from('mock_tests').delete().eq('id', testId);
    } catch {}
  }

  console.log(`\n========================================`);
  console.log(`Summary: Passed: ${passed}, Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests();
