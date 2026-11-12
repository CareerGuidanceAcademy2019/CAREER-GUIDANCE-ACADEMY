import { NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';

// Short 10s in-memory cache so 100+ concurrent students polling status hit the DB only once per 10s
const statusCache = new Map<string, { payload: any; expiresAt: number }>();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const testId = searchParams.get('id');

  if (!testId) {
    return NextResponse.json({ error: 'Missing testId parameter.' }, { status: 400 });
  }

  const nowMs = Date.now();
  const cached = statusCache.get(testId);
  if (cached && nowMs < cached.expiresAt) {
    return NextResponse.json(cached.payload);
  }

  try {
    const admin = createAdminSupabase();
    const { data: test, error } = await admin
      .from('mock_tests')
      .select('id, status, window_start, window_end, attempts_allowed')
      .eq('id', testId)
      .maybeSingle();

    if (error) {
      // Fail-open on transient DB error so active test takers are never kicked out mid-exam
      return NextResponse.json({
        testId,
        isLive: true,
        explicitlyClosed: false,
        transientError: true,
      });
    }

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found', isLive: false, explicitlyClosed: true, status: 'Draft' },
        { status: 404 }
      );
    }

    const statusLower = (test.status || '').toLowerCase();
    const isLive = ['published', 'launched', 'ready'].includes(statusLower);

    const now = new Date();
    const windowStart = test.window_start ? new Date(test.window_start) : null;
    const windowEnd = test.window_end ? new Date(test.window_end) : null;

    let windowOpen = true;
    if (windowStart && now < windowStart) windowOpen = false;
    if (windowEnd && now > windowEnd) windowOpen = false;

    const currentlyLive = isLive && windowOpen;
    const payload = {
      testId: test.id,
      status: test.status,
      isLive: currentlyLive,
      explicitlyClosed: !currentlyLive,
      isPublished: isLive,
      attemptsAllowed: test.attempts_allowed || 1,
    };

    statusCache.set(testId, { payload, expiresAt: nowMs + 10000 });
    return NextResponse.json(payload);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Status check failed';
    // Fail-open on unexpected exception so active test takers are never kicked out mid-exam
    return NextResponse.json({
      error: message,
      isLive: true,
      explicitlyClosed: false,
      transientError: true,
    });
  }
}

