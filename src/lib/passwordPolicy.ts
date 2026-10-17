/**
 * Password Policy & Strength Evaluator
 * Career Guidance Academy (C.G.A)
 * Requirements: Minimum 10 characters, common-password checks, entropy evaluation.
 */

const COMMON_PASSWORDS = new Set([
  'password', 'password123', 'admin123', '12345678', '123456789', '1234567890',
  'qwertyuiop', 'asdfghjkl', 'zxcvbnm', 'iloveyou', 'welcome123', 'cgaudaipur',
  'careerguidance', 'student123', 'teacher123', 'faculty123', 'tripura123',
  'udaipur123', 'pass1234', 'secret123', 'letmein123', 'dragon123', 'master123',
  'football', 'baseball', 'princess', 'sunshine', 'trustno1', 'superman',
  'computer', 'internet', 'charlie', 'michael', 'jessica', 'hannah', 'shadow',
]);

export interface PasswordStrength {
  score: number; // 0 to 4
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
  feedback: string[];
  isValid: boolean;
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const p = password || '';
  const feedback: string[] = [];

  if (p.length < 10) {
    feedback.push('Must be at least 10 characters in length.');
  }

  const lower = p.toLowerCase();
  if (COMMON_PASSWORDS.has(lower) || lower.includes('password') || lower.includes('cgaudaipur')) {
    feedback.push('This password is too common or easily guessed.');
    return {
      score: 0,
      label: 'Weak',
      color: 'bg-rose-500',
      feedback,
      isValid: false,
    };
  }

  let score = 0;
  if (p.length >= 10) score += 1;
  if (p.length >= 14) score += 1;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score += 1;
  if (/[0-9]/.test(p)) score += 0.5;
  if (/[^A-Za-z0-9]/.test(p)) score += 0.5;

  const finalScore = Math.min(4, Math.floor(score));

  if (!/[A-Z]/.test(p)) {
    feedback.push('Add at least one uppercase letter (A-Z).');
  }
  if (!/[a-z]/.test(p)) {
    feedback.push('Add at least one lowercase letter (a-z).');
  }
  if (!/[0-9]/.test(p)) {
    feedback.push('Add at least one number (0-9).');
  }
  if (!/[^A-Za-z0-9]/.test(p)) {
    feedback.push('Add at least one symbol (e.g., !@#$%^&*).');
  }

  const isValid = p.length >= 10 && finalScore >= 2 && !COMMON_PASSWORDS.has(lower);

  let label: PasswordStrength['label'] = 'Weak';
  let color = 'bg-rose-500';

  if (finalScore >= 4) {
    label = 'Strong';
    color = 'bg-emerald-600';
  } else if (finalScore === 3) {
    label = 'Good';
    color = 'bg-teal-600';
  } else if (finalScore === 2) {
    label = 'Fair';
    color = 'bg-amber-500';
  }

  return {
    score: finalScore,
    label,
    color,
    feedback: isValid ? [] : feedback,
    isValid,
  };
}
