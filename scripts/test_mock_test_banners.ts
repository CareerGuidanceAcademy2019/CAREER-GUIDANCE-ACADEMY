import assert from 'assert';
import {
  MOCK_SERIES_INITIAL,
  getSubjectLanguageMode,
} from '../src/data/mockSeriesSeedData';
import { INITIAL_SEED_DATA } from '../src/data/initialSeedData';

console.log('--- 1. Testing Banner Pricing & Details ---');
const p1 = MOCK_SERIES_INITIAL.find((s) => s.id === 'series-ttet-paper1');
const p2sci = MOCK_SERIES_INITIAL.find((s) => s.id === 'series-ttet-paper2-sci');
const p2soc = MOCK_SERIES_INITIAL.find((s) => s.id === 'series-ttet-paper2-soc');

assert(p1 && p1.price === 399, `Paper-I price must be 399, got ${p1?.price}`);
assert(p2sci && p2sci.price === 499, `Paper-II Science price must be 499, got ${p2sci?.price}`);
assert(p2soc && p2soc.price === 499, `Paper-II Social Studies price must be 499, got ${p2soc?.price}`);
console.log('✓ Mock Series prices match banners: Paper-I @ ₹399/-, Paper-II Science @ ₹499/-, Paper-II Social Studies @ ₹499/-');

console.log('--- 2. Testing Flexible Admin Launch Dates ---');
assert(!p1.startsOn.includes('26th October'), 'Paper-I launch date must be flexible and managed by admin');
assert(!p2sci.startsOn.includes('26th October'), 'Paper-II Science launch date must be flexible');
assert(!p2soc.startsOn.includes('26th October'), 'Paper-II Social Studies launch date must be flexible');
console.log('✓ Fixed launch dates skipped in favor of flexible admin-managed schedules');

console.log('--- 3. Testing Language Rules per Subject ---');
assert.strictEqual(getSubjectLanguageMode('Language – I (English)'), 'english_only');
assert.strictEqual(getSubjectLanguageMode('Language – II (Bengali)'), 'bengali_only');
assert.strictEqual(getSubjectLanguageMode('বাংলা সাহিত্য'), 'bengali_only');
assert.strictEqual(getSubjectLanguageMode('Child Development & Pedagogy'), 'bilingual');
assert.strictEqual(getSubjectLanguageMode('Mathematics (Content & Pedagogy)'), 'bilingual');
assert.strictEqual(getSubjectLanguageMode('Environmental Studies (EVS)'), 'bilingual');
assert.strictEqual(getSubjectLanguageMode('Science (Physics, Chemistry & Biology)'), 'bilingual');
assert.strictEqual(getSubjectLanguageMode('History & Pedagogical Issues'), 'bilingual');
assert.strictEqual(getSubjectLanguageMode('Geography & Environment'), 'bilingual');
assert.strictEqual(getSubjectLanguageMode('Political Science & Civics'), 'bilingual');
console.log('✓ English subject -> English questions only');
console.log('✓ Bengali subject -> Bengali questions only');
console.log('✓ All other subjects -> Bilingual questions in English and Bengali');

console.log('--- 4. Testing Seeded Mock Tests Language Compliance ---');
const cdpTest = INITIAL_SEED_DATA.mockTests.find((t) => t.id === 'mock-ttet-p1-cdp-1');
const engTest = INITIAL_SEED_DATA.mockTests.find((t) => t.id === 'mock-ttet-p1-eng-1');
const benTest = INITIAL_SEED_DATA.mockTests.find((t) => t.id === 'mock-ttet-p1-ben-1');

assert(cdpTest && cdpTest.languageMode === 'bilingual');
assert(cdpTest.questions.every((q) => q.question && q.questionBn && q.options && q.optionsBn));
console.log('✓ CDP test questions have both English and Bengali question and options');

assert(engTest && engTest.languageMode === 'english_only');
assert(engTest.questions.every((q) => q.question && !q.questionBn));
console.log('✓ English test questions are English-only (no Bengali fields)');

assert(benTest && benTest.languageMode === 'bengali_only');
assert(benTest.questions.every((q) => q.question && q.question.match(/[\u0980-\u09FF]/)));
console.log('✓ Bengali test questions are Bengali-only in Bengali script');

console.log('\n=========================================');
console.log('ALL BANNER & LANGUAGE VERIFICATION TESTS PASSED!');
console.log('=========================================');
