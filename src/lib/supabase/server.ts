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

/** Verifies that caller has an active single session and returns user id, role, user, and supabase client */
export async function requireActiveSession(): Promise<{
  userId: string;
  role: string;
  user: any;
  supabase: any;
} | null> {
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;

  // Single-session check: verify caller session ID is still active in auth.sessions
  const { data: isActive, error: rpcErr } = await supabase.rpc('is_current_session_active');
  if (!rpcErr && isActive === false) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role,status')
    .eq('id', data.user.id)
    .single();

  if (!profile || profile.status !== 'Active') return null;
  return { userId: data.user.id, role: profile.role, user: data.user, supabase };
}

/** Returns the caller's user id if they are an active admin with an active session, otherwise null. */
export async function requireAdmin(): Promise<string | null> {
  const session = await requireActiveSession();
  if (!session || session.role !== 'admin') return null;
  return session.userId;
}

