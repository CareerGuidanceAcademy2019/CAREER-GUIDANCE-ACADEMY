import test from 'node:test';
import assert from 'node:assert/strict';

// Test implementation directly
const HONORIFICS = /^(dr|prof|mr|mrs|ms|miss|sri|shri|smt|kumari)\.?$/i;

function formatFacultyName(fullName) {
  const raw = (fullName ?? '').replace(/\s+/g, ' ').trim();
  if (!raw) return '';

  const tokens = raw.replace(/\.(?=\S)/g, '. ').split(' ').filter(Boolean);

  const prefix = [];
  while (tokens.length > 1 && HONORIFICS.test(tokens[0])) {
    const t = tokens.shift().replace(/\.$/, '');
    prefix.push(t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() + '.');
  }

  if (tokens.length === 1) return [...prefix, tokens[0]].join(' ');

  const first = tokens[0].replace(/\./g, '');
  const last = tokens[tokens.length - 1].replace(/\./g, '');
  const initial = first.charAt(0).toUpperCase();
  const surname = last.charAt(0).toUpperCase() + last.slice(1);
  return [...prefix, `${initial}.${surname}`].join(' ');
}

function normalizePhone(v) {
  const digits = (v ?? '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : '';
}

function isEmail(v) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim());
}

function parseIdentifier(v) {
  const s = (v ?? '').trim();
  if (isEmail(s)) return { kind: 'email', value: s.toLowerCase() };
  const p = normalizePhone(s);
  if (p && /^[6-9]\d{9}$/.test(p)) return { kind: 'phone', value: p };
  return null;
}

test('Faculty name formatting', () => {
  assert.equal(formatFacultyName('Amit Saha'), 'A.Saha');
  assert.equal(formatFacultyName('Amit Kumar Saha'), 'A.Saha');
  assert.equal(formatFacultyName('Dr. Subrata Majumder'), 'Dr. S.Majumder');
  assert.equal(formatFacultyName('Prof. Rajat Kanti Bhowmik'), 'Prof. R.Bhowmik');
  assert.equal(formatFacultyName('Smt. Poulami Sen Gupta'), 'Smt. P.Gupta');
  assert.equal(formatFacultyName('A.Saha'), 'A.Saha');
  assert.equal(formatFacultyName('A. Saha'), 'A.Saha');
  assert.equal(formatFacultyName('Madhu'), 'Madhu');
});

test('Phone normalization and parsing', () => {
  assert.equal(normalizePhone('+91 70059 29189'), '7005929189');
  assert.equal(normalizePhone('07005929189'), '7005929189');
  assert.equal(normalizePhone('7005929189'), '7005929189');
  assert.equal(normalizePhone('123'), '');

  assert.deepEqual(parseIdentifier('admin@cga.in'), { kind: 'email', value: 'admin@cga.in' });
  assert.deepEqual(parseIdentifier('  ADMIN@CGA.IN  '), { kind: 'email', value: 'admin@cga.in' });
  assert.deepEqual(parseIdentifier('+91 70059 29189'), { kind: 'phone', value: '7005929189' });
  assert.deepEqual(parseIdentifier('9876543210'), { kind: 'phone', value: '9876543210' });
  assert.equal(parseIdentifier('invalid-phone'), null);
});
