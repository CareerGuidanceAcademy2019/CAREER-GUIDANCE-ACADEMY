import { NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
  retryAfter: number;
}

export interface RateLimitConfig {
  limit: number;
  windowSeconds: number;
}

export const RATE_LIMIT_RULES = {
  LOGIN_ACCOUNT: { limit: 5, windowSeconds: 900 }, // 5 per 15 min per account
  LOGIN_IP: { limit: 20, windowSeconds: 900 },      // 20 per 15 min per IP
  REGISTER_IP: { limit: 5, windowSeconds: 3600 },   // 5 per hour per IP
  FORGOT_PW_EMAIL: { limit: 3, windowSeconds: 3600 }, // 3 per hour per email
  FORGOT_PW_IP: { limit: 10, windowSeconds: 3600 },   // 10 per hour per IP
  ENQUIRY_IP: { limit: 5, windowSeconds: 3600 },    // 5 per hour per IP
  PAYMENT_REQUEST: { limit: 5, windowSeconds: 3600 }, // 5 per hour per student
  PAYMENT_PROOF: { limit: 10, windowSeconds: 3600 },  // 10 per hour
  MOCK_SAVE_ANSWER: { limit: 60, windowSeconds: 60 }, // 60 per minute per student
  MOCK_START: { limit: 10, windowSeconds: 60 },       // 10 per min per student
  MOCK_SUBMIT: { limit: 5, windowSeconds: 60 },       // 5 per min per student
  ADMIN_ACTION: { limit: 60, windowSeconds: 60 },     // 60 per min
  ADMIN_EXPORT: { limit: 10, windowSeconds: 60 },     // 10 per min
  GENERAL_API: { limit: 120, windowSeconds: 60 },     // 120 per min per IP
} as const;

/**
 * Extract client IP from headers safely
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) {
    return cfIp.trim();
  }
  return '127.0.0.1';
}

/**
 * Atomic sliding window rate limiter
 * Backed by Supabase check_rate_limit RPC (or optional Upstash Redis)
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const sanitizedKey = key.trim().toLowerCase();

  // 1. Check if Upstash Redis credentials are provided
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    try {
      const resp = await fetch(`${upstashUrl}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', sanitizedKey],
          ['TTL', sanitizedKey],
        ]),
      });

      if (resp.ok) {
        const results = await resp.json();
        const currentCount = results[0]?.result || 1;
        let ttl = results[1]?.result;

        if (currentCount === 1 || ttl === -1) {
          // Set expiry
          await fetch(`${upstashUrl}/EXPIRE/${sanitizedKey}/${windowSeconds}`, {
            headers: { Authorization: `Bearer ${upstashToken}` },
          });
          ttl = windowSeconds;
        }

        const allowed = currentCount <= limit;
        const remaining = Math.max(0, limit - currentCount);
        const retryAfter = allowed ? 0 : Math.max(1, ttl);

        return {
          allowed,
          limit,
          remaining,
          resetSeconds: Math.max(1, ttl),
          retryAfter,
        };
      }
    } catch {
      // Fallback to database
    }
  }

  // 2. Primary Serverless Engine: Supabase atomic sliding window RPC
  try {
    const sb = createAdminSupabase();
    const { data, error } = await sb.rpc('check_rate_limit', {
      p_key: sanitizedKey,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });

    if (error || !data) {
      // In case of transient db error, fail open for normal requests with warning
      return {
        allowed: true,
        limit,
        remaining: limit - 1,
        resetSeconds: windowSeconds,
        retryAfter: 0,
      };
    }

    return {
      allowed: Boolean(data.allowed),
      limit: Number(data.limit ?? limit),
      remaining: Number(data.remaining ?? 0),
      resetSeconds: Number(data.resetSeconds ?? windowSeconds),
      retryAfter: Number(data.retryAfter ?? 0),
    };
  } catch {
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetSeconds: windowSeconds,
      retryAfter: 0,
    };
  }
}

/**
 * Standard HTTP 429 Too Many Requests response builder
 */
export function createRateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Please wait ${result.retryAfter} seconds before trying again.`,
      retryAfter: result.retryAfter,
      limit: result.limit,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfter),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + result.resetSeconds),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
