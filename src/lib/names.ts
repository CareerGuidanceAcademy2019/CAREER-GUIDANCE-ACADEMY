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

/**
 * Returns 2-letter uppercase initials for a faculty name, ignoring honorific titles.
 * E.g., "Mr. R. Debnath." -> "RD", "Mr. B. Das" -> "BD", "Mrs. Popi Ghosh" -> "PG".
 */
export function getFacultyInitials(fullName: string | null | undefined): string {
  const raw = (fullName ?? '').replace(/[.,]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!raw) return 'FA';

  const tokens = raw.split(' ').filter(Boolean).filter((t) => !HONORIFICS.test(t));
  if (tokens.length === 0) return 'FA';
  if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();

  const first = tokens[0];
  const last = tokens[tokens.length - 1];
  return (first.charAt(0) + last.charAt(0)).toUpperCase();
}

const AVATAR_PALETTES = [
  ['#003366', '#0056b3'], // CGA Royal Navy
  ['#1e1b4b', '#4338ca'], // Deep Indigo
  ['#064e3b', '#059669'], // Rich Emerald
  ['#78350f', '#d97706'], // Warm Amber
  ['#881337', '#e11d48'], // Crimson Ruby
  ['#4c1d95', '#7c3aed'], // Royal Violet
  ['#134e4a', '#0d9488'], // Deep Teal
  ['#701a75', '#c026d3'], // Plum Magenta
  ['#0f172a', '#2563eb'], // Midnight Ocean
  ['#0e7490', '#0284c7'], // Cyan Blue
];

/**
 * Generates an SVG Data URI avatar displaying the faculty member's initials.
 */
export function getFacultyAvatarUrl(fullName: string | null | undefined): string {
  const name = (fullName ?? '').trim() || 'Faculty';
  const initials = getFacultyInitials(name);

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const [c1, c2] = AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="highlight" cx="30%" cy="25%" r="65%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="200" height="200" rx="36" fill="url(#grad)"/>
  <rect width="200" height="200" rx="36" fill="url(#highlight)"/>
  <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="3" stroke-dasharray="6 6"/>
  <text x="100" y="105" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="76" font-weight="800" fill="#ffffff" letter-spacing="3" text-anchor="middle" dominant-baseline="central">${initials}</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
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
