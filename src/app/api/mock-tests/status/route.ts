import { NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const testId = searchParams.get('id');

  if (!testId) {
    return NextResponse.json({ error: 'Missing testId parameter.' }, { status: 400 });
  }

  try {
    const admin = createAdminSupabase();
    const { data: test, error } = await admin
      .from('mock_tests')
      .select('id, status, window_start, window_end, attempts_allowed')
      .eq('id', testId)
      .maybeSingle();

    if (error || !test) {
      return NextResponse.json({ error: 'Test not found', isLive: false, status: 'Draft' }, { status: 404 });
    }

    const statusLower = (test.status || '').toLowerCase();
    const isLive = ['published', 'launched', 'ready'].includes(statusLower);

    const now = new Date();
    const windowStart = test.window_start ? new Date(test.window_start) : null;
    const windowEnd = test.window_end ? new Date(test.window_end) : null;

    let windowOpen = true;
    if (windowStart && now < windowStart) windowOpen = false;
    if (windowEnd && now > windowEnd) windowOpen = false;

    return NextResponse.json({
      testId: test.id,
      status: test.status,
      isLive: isLive && windowOpen,
      isPublished: isLive,
      attemptsAllowed: test.attempts_allowed || 1,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Status check failed';
    return NextResponse.json({ error: message, isLive: false }, { status: 500 });
  }
}

