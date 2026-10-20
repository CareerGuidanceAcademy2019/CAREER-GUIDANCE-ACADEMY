import { NextResponse } from 'next/server';
import { requireAdmin, createAdminSupabase } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `admin_retention_${adminId}_${ip}`,
    RATE_LIMIT_RULES.ADMIN_ACTION.limit,
    RATE_LIMIT_RULES.ADMIN_ACTION.windowSeconds
  );
  if (!rateRes.allowed) {
    return createRateLimitResponse(rateRes);
  }

  try {
    const body = await request.json();
    const { testId, days = 30 } = body;

    if (!testId) {
      return NextResponse.json({ error: 'Missing testId.' }, { status: 400 });
    }

    const extendDays = Number(days);
    if (![15, 30, 60].includes(extendDays)) {
      return NextResponse.json({ error: 'Extension days must be 15, 30, or 60.' }, { status: 400 });
    }

    const supabaseAdmin = createAdminSupabase();

    const { data: test, error: fetchErr } = await supabaseAdmin
      .from('mock_tests')
      .select('id, purge_after, retention_days')
      .eq('id', testId)
      .single();

    if (fetchErr || !test) {
      return NextResponse.json({ error: 'Test not found.' }, { status: 404 });
    }

    const baseTime = test.purge_after && new Date(test.purge_after).getTime() > Date.now()
      ? new Date(test.purge_after).getTime()
      : Date.now();

    const newPurgeAfter = new Date(baseTime + extendDays * 24 * 60 * 60 * 1000).toISOString();
    const newRetentionDays = (test.retention_days || 7) + extendDays;

    const { error: updateErr } = await supabaseAdmin
      .from('mock_tests')
      .update({
        purge_after: newPurgeAfter,
        retention_days: newRetentionDays,
      })
      .eq('id', testId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Retention extended by ${extendDays} days. New purge date: ${new Date(newPurgeAfter).toLocaleDateString('en-IN')}`,
      purgeAfter: newPurgeAfter,
      retentionDays: newRetentionDays,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to extend retention';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
