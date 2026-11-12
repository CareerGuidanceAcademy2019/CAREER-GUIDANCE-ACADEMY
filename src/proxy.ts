import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// In-memory sliding window rate limiter for general edge API abuse protection (0ms latency, zero database calls)
const edgeRateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkEdgeRateLimit(
  ip: string,
  limit = 1500,
  windowMs = 60000
): { allowed: boolean; retryAfter: number; limit: number } {
  const now = Date.now();
  // Opportunistic cleanup
  if (edgeRateLimitMap.size > 2000) {
    for (const [k, v] of edgeRateLimitMap.entries()) {
      if (now > v.resetAt) edgeRateLimitMap.delete(k);
    }
  }
  const entry = edgeRateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    edgeRateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0, limit };
  }
  entry.count += 1;
  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter, limit };
  }
  return { allowed: true, retryAfter: 0, limit };
}

// In-memory session verification cache (short TTL of 45 seconds to avoid RPC spamming on rapid route/API transitions)
const sessionActiveCache = new Map<string, { active: boolean; expiresAt: number }>();

async function verifySessionActiveWithCache(
  supabase: any,
  userId: string
): Promise<boolean> {
  const now = Date.now();
  // Periodic cleanup
  if (sessionActiveCache.size > 1000) {
    for (const [k, v] of sessionActiveCache.entries()) {
      if (now > v.expiresAt) sessionActiveCache.delete(k);
    }
  }

  const cached = sessionActiveCache.get(userId);
  if (cached && now < cached.expiresAt) {
    return cached.active;
  }

  try {
    const { data: isActive } = await supabase.rpc('is_current_session_active');
    const active = isActive !== false;
    sessionActiveCache.set(userId, {
      active,
      expiresAt: now + 45000, // Cache for 45s
    });
    return active;
  } catch {
    return true; // Fail-open on transient network/RPC drops
  }
}

/**
 * Refreshes the Supabase session cookie and gates the portals.
 * Fine-grained role checks happen in the layouts AND, authoritatively, in Postgres RLS.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !key) {
    return response;
  }

  // 1. CSRF / Origin verification on state-changing requests
  const method = request.method.toUpperCase();
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== host && !originUrl.host.endsWith('.trycloudflare.com')) {
          return new NextResponse('Forbidden: Cross-site request rejected.', { status: 403 });
        }
      } catch {
        return new NextResponse('Bad Request: Invalid Origin header.', { status: 400 });
      }
    }
  }

  const path = request.nextUrl.pathname;
  const isProtected =
    path.startsWith('/admin') || path.startsWith('/student') || path.startsWith('/faculty-portal');
  const isApi = path.startsWith('/api/');
  const hasAuthCookie = request.cookies.getAll().some((c) => c.name.includes('-auth-token'));

  // 2. Abuse Protection: General API Rate Limit ceiling (1500 req/min per IP via fast in-memory token bucket; supports 100+ students on shared CGNAT/campus Wi-Fi)
  if (isApi) {
    const forwarded = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const clientIp = forwarded.split(',')[0].trim();
    const rl = checkEdgeRateLimit(clientIp, 1500, 60000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Please wait ${rl.retryAfter} seconds before trying again.`,
          retryAfter: rl.retryAfter,
          limit: rl.limit,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rl.retryAfter),
            'X-RateLimit-Limit': String(rl.limit),
            'X-RateLimit-Remaining': '0',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }
  }

  let user = null;

  // Only initialize Supabase client and verify user in middleware for protected page navigations.
  // Protected API routes perform their own authentication directly, avoiding double GoTrue roundtrips during rush hour.
  if (isProtected) {
    if (hasAuthCookie) {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        key,
        {
          cookies: {
            getAll: () => request.cookies.getAll(),
            setAll: (list) => {
              list.forEach(({ name, value }) => request.cookies.set(name, value));
              response = NextResponse.next({ request });
              list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
            },
          },
        }
      );
      try {
        const { data, error } = await supabase.auth.getUser();
        if (data?.user) {
          user = data.user;
        } else if (error && (error.status === 0 || error.status === 500 || error.status === 502 || error.status === 503 || error.status === 504)) {
          // Fail-open on transient network/GoTrue timeout during rush hour so active students are not kicked out
          user = { id: 'transient-pass' } as any;
        }
      } catch {
        // Fail-open on transient network timeout when cookie is present
        user = { id: 'transient-pass' } as any;
      }
    }
  }

  // Open-redirect safe destination
  const safeNext = (target: string) => {
    if (target.startsWith('/') && !target.startsWith('//') && !target.startsWith('/\\') && !target.includes(':')) {
      return target;
    }
    return '/';
  };

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', safeNext(path));
    return NextResponse.redirect(url);
  }

  // Validate next param on login/register to prevent open redirect
  if ((path === '/login' || path === '/register') && request.nextUrl.searchParams.has('next')) {
    const rawNext = request.nextUrl.searchParams.get('next') || '';
    const cleanNext = safeNext(rawNext);
    if (rawNext !== cleanNext) {
      const url = request.nextUrl.clone();
      url.searchParams.set('next', cleanNext);
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
