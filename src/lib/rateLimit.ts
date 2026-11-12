import { NextResponse } from 'next/server';

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
  LOGIN_ACCOUNT: { limit: 15, windowSeconds: 900 },    // 15 per 15 min per account
  LOGIN_IP: { limit: 500, windowSeconds: 900 },        // 500 per 15 min per IP (supports 100+ users on shared Wi-Fi/CGNAT)
  REGISTER_IP: { limit: 100, windowSeconds: 3600 },    // 100 per hour per IP
  FORGOT_PW_EMAIL: { limit: 10, windowSeconds: 3600 }, // 10 per hour per email
  FORGOT_PW_IP: { limit: 100, windowSeconds: 3600 },   // 100 per hour per IP
  ENQUIRY_IP: { limit: 30, windowSeconds: 3600 },      // 30 per hour per IP
  PAYMENT_REQUEST: { limit: 30, windowSeconds: 3600 }, // 30 per hour per student
  PAYMENT_PROOF: { limit: 30, windowSeconds: 3600 },   // 30 per hour
  MOCK_SAVE_ANSWER: { limit: 180, windowSeconds: 60 }, // 180 per minute per student
  MOCK_START: { limit: 60, windowSeconds: 60 },        // 60 per min per student
  MOCK_SUBMIT: { limit: 30, windowSeconds: 60 },       // 30 per min per student
  ADMIN_ACTION: { limit: 180, windowSeconds: 60 },     // 180 per min
  ADMIN_EXPORT: { limit: 30, windowSeconds: 60 },      // 30 per min
  GENERAL_API: { limit: 1500, windowSeconds: 60 },     // 1500 per min per IP
} as const;

// Fast 0ms in-memory rate limit bucket store (avoids extra DB roundtrips during rush hour)
const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

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
 * Uses fast 0ms in-memory buckets (or optional Upstash Redis) with zero DB write amplification.
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
      // Fallback to in-memory limiter
    }
  }

  // 2. High-concurrency 0ms in-memory limiter
  const now = Date.now();
  if (memoryBuckets.size > 5000) {
    for (const [k, v] of memoryBuckets.entries()) {
      if (now > v.resetAt) memoryBuckets.delete(k);
    }
  }

  const windowMs = windowSeconds * 1000;
  const existing = memoryBuckets.get(sanitizedKey);
  if (!existing || now > existing.resetAt) {
    memoryBuckets.set(sanitizedKey, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - 1),
      resetSeconds: windowSeconds,
      retryAfter: 0,
    };
  }

  existing.count += 1;
  const allowed = existing.count <= limit;
  const resetSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return {
    allowed,
    limit,
    remaining: Math.max(0, limit - existing.count),
    resetSeconds,
    retryAfter: allowed ? 0 : resetSeconds,
  };
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
