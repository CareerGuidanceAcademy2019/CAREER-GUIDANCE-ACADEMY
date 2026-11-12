import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/** Cookie-bound client acting as the signed-in user (RLS applies). */
export async function createServerSupabase() {
  const cookieStore = await cookies();
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !key) {
    throw new Error(
      'Missing Supabase credentials: Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)'
    );
  }
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    key,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            /* called from a Server Component; proxy refreshes the session */
          }
        },
      },
    }
  );
}

/** Service-role client. NEVER import from client code. Bypasses RLS. */
export function createAdminSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Verifies that caller has an active session and returns user id, role, user, and supabase client */
export async function requireActiveSession(req?: Request): Promise<{
  userId: string;
  role: string;
  user: any;
  supabase: any;
} | null> {
  const supabase = await createServerSupabase();
  let user: any = null;

  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch {}

  // Optional fallback to Authorization Bearer header if cookies were not attached
  if (!user && req) {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      const token = authHeader.slice(7).trim();
      if (token) {
        try {
          const admin = createAdminSupabase();
          const { data: uData } = await admin.auth.getUser(token);
          user = uData?.user ?? null;
        } catch {}
      }
    }
  }

  if (!user) return null;

  let role = 'student';
  try {
    const admin = createAdminSupabase();
    const { data: profile } = await admin
      .from('profiles')
      .select('role,status')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      if (profile.status && profile.status !== 'Active') return null;
      role = profile.role || 'student';
    } else if (
      user.email === 'angatsaha825@gmail.com' ||
      user.email === 'careerguidanceacademy2019@gmail.com'
    ) {
      role = 'admin';
    }
  } catch {
    if (
      user.email === 'angatsaha825@gmail.com' ||
      user.email === 'careerguidanceacademy2019@gmail.com'
    ) {
      role = 'admin';
    }
  }

  return { userId: user.id, role, user, supabase };
}

/** Returns the caller's user id if they are an active admin with an active session, otherwise null. */
export async function requireAdmin(req?: Request): Promise<string | null> {
  // 1. If Request is provided, check Authorization: Bearer <token> header
  if (req) {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      const token = authHeader.slice(7).trim();
      if (token) {
        try {
          const adminSupabase = createAdminSupabase();
          const { data: userData, error: userErr } = await adminSupabase.auth.getUser(token);
          if (!userErr && userData?.user) {
            const { data: profile } = await adminSupabase
              .from('profiles')
              .select('role,status')
              .eq('id', userData.user.id)
              .maybeSingle();
            if (
              profile &&
              (profile.role === 'admin' || profile.role === 'ADMIN') &&
              profile.status === 'Active'
            ) {
              return userData.user.id;
            }
            if (
              userData.user.email === 'angatsaha825@gmail.com' ||
              userData.user.email === 'careerguidanceacademy2019@gmail.com'
            ) {
              return userData.user.id;
            }
          }
        } catch {}
      }
    }
  }

  // 2. Fallback to cookie-bound session check
  try {
    const session = await requireActiveSession();
    if (session && (session.role === 'admin' || session.role === 'ADMIN')) return session.userId;
    if (
      session?.user?.email === 'angatsaha825@gmail.com' ||
      session?.user?.email === 'careerguidanceacademy2019@gmail.com'
    ) {
      return session.userId;
    }
  } catch {}

  return null;
}


