/**
 * Generates initial letters from student's first and last name.
 * e.g. "Ananya Das" -> "AD"
 *      "Subham Ghosh" -> "SG"
 *      "Pooja Sharma" -> "PS"
 *      "Rahul" -> "RA"
 */
export function getNameInitials(name: string): string {
  if (!name) return 'CG';
  const clean = name.trim().replace(/^(mr\.|ms\.|mrs\.|dr\.)\s+/i, '');
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CG';
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const first = parts[0][0];
  const last = parts[parts.length - 1][0];
  return (first + last).toUpperCase();
}

/**
 * High-contrast, elegant gradients for student avatars.
 */
const GRADIENT_PALETTES: [string, string][] = [
  ['#0056b3', '#1e3a8a'], // Royal Navy
  ['#ea580c', '#c2410c'], // Vibrant Amber-Orange
  ['#059669', '#065f46'], // Emerald Forest
  ['#7c3aed', '#5b21b6'], // Rich Violet
  ['#db2777', '#9d174d'], // Crimson Rose
  ['#0891b2', '#0e7490'], // Cyan Ocean
  ['#d97706', '#b45309'], // Golden Sand
  ['#4f46e5', '#3730a3'], // Deep Indigo
  ['#be123c', '#881337'], // Deep Crimson
  ['#0d9488', '#115e59'], // Teal
];

export function getAvatarGradient(name: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % GRADIENT_PALETTES.length;
  return GRADIENT_PALETTES[index];
}

/**
 * Generates an SVG data URL for a student avatar with initials.
 */
export function generateInitialsAvatarSvgDataUrl(name: string, size = 160): string {
  const initials = getNameInitials(name);
  const [col1, col2] = getAvatarGradient(name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${col1}" />
      <stop offset="100%" stop-color="${col2}" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size / 2}" fill="url(#g)" />
  <text x="50%" y="54%" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.round(size * 0.42)}" font-weight="800" fill="#ffffff" text-anchor="middle" dominant-baseline="middle" letter-spacing="1">
    ${initials}
  </text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

