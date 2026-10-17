import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

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
  const hasAuthCookie = request.cookies.getAll().some((c) => c.name.includes('-auth-token'));

  let user = null;
  let supabase = null;

  if (hasAuthCookie || path.startsWith('/api/')) {
    supabase = createServerClient(
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
    if (hasAuthCookie) {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    }
  }

  // 2. Abuse Protection: General API Rate Limit ceiling (120 req/min per IP)
  if (path.startsWith('/api/') && supabase) {
    const forwarded = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const clientIp = forwarded.split(',')[0].trim();
    try {
      const { data: rl } = await supabase.rpc('check_rate_limit', {
        p_key: `api_gen_${clientIp}`,
        p_limit: 120,
        p_window_seconds: 60,
      });
      if (rl && !rl.allowed) {
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
    } catch {
      // Fail-open for transient network/DB errors on general API check
    }
  }

  const isProtected =
    path.startsWith('/admin') || path.startsWith('/student') || path.startsWith('/faculty-portal');

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
