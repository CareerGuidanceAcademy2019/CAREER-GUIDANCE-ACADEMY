'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cgaService } from '@/services/cgaService';

interface MaskedDataProps {
  value: string;
  type: 'phone' | 'email';
  subjectId?: string;
  className?: string;
}

export function maskPhone(phone: string): string {
  if (!phone) return '—';
  const clean = phone.trim();
  if (clean.length <= 4) return '••••';
  const start = clean.slice(0, 3);
  const end = clean.slice(-2);
  return `${start}•••••${end}`;
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '••••@••••';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  const maskedLocal = local[0] + '•'.repeat(Math.min(local.length - 2, 5)) + local.slice(-1);
  return `${maskedLocal}@${domain}`;
}

export function MaskedData({ value, type, subjectId, className = '' }: MaskedDataProps) {
  const [revealed, setRevealed] = useState(false);

  const handleToggle = () => {
    if (!revealed) {
      // Audit log the reveal event
      try {
        cgaService.logSecurityEvent('pii_revealed_by_admin', {
          dataType: type,
          subjectId: subjectId || 'unspecified',
          timestamp: new Date().toISOString(),
        });
      } catch {
        // non-blocking
      }
      setRevealed(true);
    } else {
      setRevealed(false);
    }
  };

  const masked = type === 'phone' ? maskPhone(value) : maskEmail(value);

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono ${className}`}>
      <span>{revealed ? value : masked}</span>
      <button
        type="button"
        onClick={handleToggle}
        aria-label={revealed ? `Hide ${type}` : `Reveal ${type} (Audit Logged)`}
        title={revealed ? 'Click to mask' : 'Click to reveal (Audit Logged)'}
        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
      >
        {revealed ? <EyeOff className="w-3 h-3 text-amber-600" /> : <Eye className="w-3 h-3" />}
      </button>
    </span>
  );
}
