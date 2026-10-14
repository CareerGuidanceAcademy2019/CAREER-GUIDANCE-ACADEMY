/**
 * Display helpers for faculty names and login identifiers.
 * Full names are always stored in the database; these only change how they are shown.
 */

const HONORIFICS = /^(dr|prof|mr|mrs|ms|miss|sri|shri|smt|kumari)\.?$/i;

/**
 * "Amit Kumar Saha" -> "A.Saha", "Dr. Ritu Das" -> "Dr. R.Das", "Madhu" -> "Madhu".
 * Already-short names such as "A.Saha" or "A. Saha" are normalised to "A.Saha".
 */
export function formatFacultyName(fullName: string | null | undefined): string {
  const raw = (fullName ?? '').replace(/\s+/g, ' ').trim();
  if (!raw) return '';

  // Split "A.Saha" style names so they normalise consistently.
  const tokens = raw.replace(/\.(?=\S)/g, '. ').split(' ').filter(Boolean);

  const prefix: string[] = [];
  while (tokens.length > 1 && HONORIFICS.test(tokens[0])) {
    const t = tokens.shift()!.replace(/\.$/, '');
    prefix.push(t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() + '.');
  }

  if (tokens.length === 1) return [...prefix, tokens[0]].join(' ');

  const first = tokens[0].replace(/\./g, '');
  const last = tokens[tokens.length - 1].replace(/\./g, '');
  const initial = first.charAt(0).toUpperCase();
  const surname = last.charAt(0).toUpperCase() + last.slice(1);
  return [...prefix, `${initial}.${surname}`].join(' ');
}

/** True if the string looks like an email address. */
export const isEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim());

/** Last 10 digits of a phone number, or '' if it isn't one. */
export function normalizePhone(v: string): string {
  const digits = (v ?? '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : '';
}

/** Accepts an email or a 10-digit (optionally +91) Indian mobile number. */
export function parseIdentifier(v: string): { kind: 'email' | 'phone'; value: string } | null {
  const s = (v ?? '').trim();
  if (isEmail(s)) return { kind: 'email', value: s.toLowerCase() };
  const p = normalizePhone(s);
  if (p && /^[6-9]\d{9}$/.test(p)) return { kind: 'phone', value: p };
  return null;
}
