import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabase() {
  if (!client) {
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !key) {
      throw new Error(
        'Missing Supabase credentials: Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)'
      );
    }
    client = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key);
  }
  return client;
}

export const createClient = getSupabase;
