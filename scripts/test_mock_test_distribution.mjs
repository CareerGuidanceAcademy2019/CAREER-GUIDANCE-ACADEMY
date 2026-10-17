import assert from 'node:assert';

// 1. Test MCQ Parser logic
const sampleDocument = `
CAREER GUIDANCE ACADEMY (C.G.A)
MOCK TEST PAPER - TRIPURA TET (T-TET) 2026

1. Who is considered the father of Educational Psychology?
(A) E.L. Thorndike
(B) Jean Piaget
(C) John Dewey
(D) Sigmund Freud
Ans: A
Explanation: Edward Lee Thorndike is widely recognized as the father of modern Educational Psychology.

2. Which river flows through Udaipur in Gomati District of Tripura?
(A) Manu
(B) Gomati
(C) Howrah
(D) Khowai
Answer: Option B
Explanation: The holy Gomati river flows through Udaipur in Gomati district.

3. In right-angled triangle ABC with hypotenuse 10 and base 6, find the height:
[A] 6
[B] 7
[C] 8
[D] 9
Correct Option: C
Explanation: By Pythagorean theorem: sqrt(10^2 - 6^2) = sqrt(100 - 36) = 8.
`;

function parseSampleMCQs(rawText) {
  const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const questionPattern = /(?:^|\n+)(?:Q(?:uestion)?\.?\s*(\d+)[\.\:\)\-]?|(?:\()?(\d+)(?:\))?[\.\:\-]?\s+)/gi;
  const indices = [];
  let m;
  while ((m = questionPattern.exec(text)) !== null) {
    const num = parseInt(m[1] || m[2], 10) || indices.length + 1;
    indices.push({ start: m.index, qNum: num });
  }

  const rawChunks = [];
  for (let i = 0; i < indices.length; i++) {
    const cur = indices[i];
    const nextStart = i < indices.length - 1 ? indices[i + 1].start : text.length;
    const chunkText = text.slice(cur.start, nextStart).trim();
    if (chunkText.length > 5) rawChunks.push({ text: chunkText, qNum: cur.qNum });
  }

  const parsed = [];
  for (let i = 0; i < rawChunks.length; i++) {
    const { text: chunk } = rawChunks[i];
    let correctIdx = 0;
    const ansMatch = chunk.match(
      /(?:Ans(?:wer)?|Correct(?:\s*Option)?|Key)[\s\:\-\.]+(?:Option\s*)?([A-D]|[a-d]|[1-4]|\([A-D]\)|\([a-d]\)|\([1-4]\)|\[[A-D]\]|\[[a-d]\]|\[[1-4]\])/i
    );
    if (ansMatch) {
      const char = ansMatch[1].replace(/[\(\)\[\]]/g, '').trim().toUpperCase();
      if (char === 'A' || char === '1') correctIdx = 0;
      else if (char === 'B' || char === '2') correctIdx = 1;
      else if (char === 'C' || char === '3') correctIdx = 2;
      else if (char === 'D' || char === '4') correctIdx = 3;
    }

    let explanation = '';
    const expMatch = chunk.match(/(?:Explanation|Exp|Solution|Reason)[\s\:\-]+([^\n]+(?:\n[^\n]+)*)/i);
    if (expMatch) explanation = expMatch[1].trim();

    let body = chunk;
    if (ansMatch) body = body.replace(ansMatch[0], '');
    if (expMatch) body = body.replace(expMatch[0], '');
    body = body.replace(/^(?:Q(?:uestion)?\.?\s*\d+[\.\:\)\-]?|\(?\d+\)[\.\:\-]?\s+)/i, '').trim();

    const optionRegex = /(?:^|\n|\s+)(?:\(?\[?([A-D]|[a-d]|[1-4])(?:\)|\]|[\.\:\-\)])\s*)/g;
    const optionMatches = Array.from(body.matchAll(optionRegex));
    if (optionMatches.length >= 2) {
      const firstOptIndex = optionMatches[0].index ?? 0;
      const questionStem = body.slice(0, firstOptIndex).trim();
      const extractedOptions = [];
      for (let j = 0; j < optionMatches.length; j++) {
        const start = (optionMatches[j].index ?? 0) + optionMatches[j][0].length;
        const end = j < optionMatches.length - 1 ? (optionMatches[j + 1].index ?? body.length) : body.length;
        extractedOptions.push(body.slice(start, end).trim().replace(/\n+/g, ' '));
      }
      parsed.push({
        id: `q-${i + 1}`,
        question: questionStem.replace(/\n+/g, ' '),
        options: [
          extractedOptions[0] || 'Option A',
          extractedOptions[1] || 'Option B',
          extractedOptions[2] || 'Option C',
          extractedOptions[3] || 'Option D',
        ],
        correctOptionIndex: correctIdx,
        explanation,
      });
    }
  }
  return parsed;
}

console.log('--- 1. Testing MCQ PDF / Text Parser ---');
const parsed = parseSampleMCQs(sampleDocument);
assert.strictEqual(parsed.length, 3, 'Expected 3 questions parsed');
assert.strictEqual(parsed[0].correctOptionIndex, 0, 'Q1 should have correct option A (0)');
assert.strictEqual(parsed[1].correctOptionIndex, 1, 'Q2 should have correct option B (1)');
assert.strictEqual(parsed[2].correctOptionIndex, 2, 'Q3 should have correct option C (2)');
assert.ok(parsed[0].explanation.includes('Thorndike'), 'Q1 explanation should mention Thorndike');
assert.ok(parsed[1].explanation.includes('Gomati'), 'Q2 explanation should mention Gomati');
console.log('[PASS] MCQ Parser successfully extracted 3 questions, options A-D, answers, and explanations');

console.log('\n--- 2. Testing Question Distribution Separation ---');
// When distributed to students who have NOT submitted:
function distributeToStudent(questions, hasSubmitted) {
  if (!hasSubmitted) {
    return questions.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correctOptionIndex: -1,
      explanation: '',
    }));
  }
  return questions;
}

const forExamTaking = distributeToStudent(parsed, false);
for (const q of forExamTaking) {
  assert.strictEqual(q.correctOptionIndex, -1, 'Answer key MUST be masked prior to submission');
  assert.strictEqual(q.explanation, '', 'Explanation MUST be masked prior to submission');
  assert.strictEqual(q.options.length, 4, 'Options must be present for student to choose');
}
console.log('[PASS] Distribution before submission: ONLY questions and options are exposed (keys/explanations stripped)');

console.log('\n--- 3. Testing Test Submission & Authoritative Scoring ---');
// Student answers: Q1 -> A (correct), Q2 -> A (wrong), Q3 -> C (correct)
const studentAnswers = {
  'q-1': 0, // Correct (+4)
  'q-2': 0, // Wrong (-1)
  'q-3': 2, // Correct (+4)
};
const marksPerQ = 4;
const negativeMark = 1;

let correct = 0;
let wrong = 0;
let unattempted = 0;

for (const q of parsed) {
  const chosen = studentAnswers[q.id];
  if (chosen === undefined) unattempted++;
  else if (chosen === q.correctOptionIndex) correct++;
  else wrong++;
}

const totalMarks = parsed.length * marksPerQ;
const score = Math.max(0, correct * marksPerQ - wrong * negativeMark);
const accuracy = Math.round((correct / (correct + wrong)) * 100);

assert.strictEqual(correct, 2, 'Should be 2 correct answers');
assert.strictEqual(wrong, 1, 'Should be 1 wrong answer');
assert.strictEqual(unattempted, 0, 'Should be 0 unattempted');
assert.strictEqual(score, 7, 'Score should be 2*4 - 1*1 = 7');
assert.strictEqual(accuracy, 67, 'Accuracy should be 2/3 = 67%');
console.log(`[PASS] Test evaluated: Score ${score}/${totalMarks}, Accuracy ${accuracy}%, Correct: ${correct}, Wrong: ${wrong}`);

console.log('\n--- 4. Testing Solutions Unlock After Submission ---');
const afterSubmission = distributeToStudent(parsed, true);
assert.strictEqual(afterSubmission[0].correctOptionIndex, 0);
assert.strictEqual(afterSubmission[1].correctOptionIndex, 1);
assert.strictEqual(afterSubmission[2].correctOptionIndex, 2);
assert.ok(afterSubmission[0].explanation.length > 0);
console.log('[PASS] Solutions & Result view unlocked: Official answer keys and explanations available only after submission');

console.log('\n=========================================');
console.log('ALL MOCK TEST DISTRIBUTION TESTS PASSED!');
console.log('=========================================');
