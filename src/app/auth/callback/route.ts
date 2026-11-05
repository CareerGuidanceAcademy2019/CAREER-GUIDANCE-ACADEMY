import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const nextParam = searchParams.get('next');
  const errorParam = searchParams.get('error_description') || searchParams.get('error');

  // If Supabase returned an explicit error in query string
  if (errorParam) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorParam)}`);
  }

  // Determine intelligent target redirection
  const targetNext =
    nextParam ||
    (type === 'recovery' ? '/reset-password' : '/login?confirmed=true');

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  // Flow 1: PKCE authorization code exchange
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.session?.user) {
      // Activate profile if it was pending confirmation
      try {
        await supabase
          .from('profiles')
          .update({ status: 'Active' })
          .eq('id', data.session.user.id);
      } catch {}

      return NextResponse.redirect(`${origin}${targetNext}`);
    }
  }

  // Flow 2: Token hash verification (Supabase email link / OTP hash)
  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });
    if (!error && data.user) {
      try {
        await supabase
          .from('profiles')
          .update({ status: 'Active' })
          .eq('id', data.user.id);
      } catch {}

      return NextResponse.redirect(`${origin}${targetNext}`);
    }
  }

  // Fallback redirection based on intent
  if (type === 'recovery') {
    return NextResponse.redirect(`${origin}/reset-password`);
  }
  return NextResponse.redirect(`${origin}/login?confirmed=true`);
}
