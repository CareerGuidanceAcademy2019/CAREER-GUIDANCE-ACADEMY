'use client';

import { useMemo } from 'react';
import { evaluatePasswordStrength } from '@/lib/passwordPolicy';
import { Check, ShieldAlert } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const result = useMemo(() => evaluatePasswordStrength(password), [password]);

  if (!password) {
    return (
      <p className="text-xs text-slate-500 mt-1">
        Password must be at least 10 characters with mixed letters and numbers.
      </p>
    );
  }

  return (
    <div className="space-y-2 mt-2">
      {/* 4 segment bars */}
      <div className="flex gap-1.5 h-1.5 w-full">
        {[1, 2, 3, 4].map((step) => {
          const isFilled = result.score >= step;
          return (
            <div
              key={step}
              className={`flex-1 rounded-full transition-colors duration-200 ${
                isFilled ? result.color : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-600 dark:text-slate-400 font-medium">
          Strength: <span className="font-semibold text-slate-900 dark:text-slate-200">{result.label}</span>
        </span>
        {result.isValid ? (
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
            <Check className="w-3.5 h-3.5" /> Meets security requirements
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs">
            <ShieldAlert className="w-3.5 h-3.5" /> Minimum 10 characters required
          </span>
        )}
      </div>

      {result.feedback.length > 0 && (
        <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5 list-disc pl-4 pt-1">
          {result.feedback.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
