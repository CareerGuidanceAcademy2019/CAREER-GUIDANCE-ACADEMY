import { NextResponse } from 'next/server';
import { requireAdmin, createAdminSupabase } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

export async function PATCH(request: Request) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized. Administrator access required.' }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `admin_series_${adminId}_${ip}`,
    RATE_LIMIT_RULES.ADMIN_ACTION.limit,
    RATE_LIMIT_RULES.ADMIN_ACTION.windowSeconds
  );
  if (!rateRes.allowed) {
    return createRateLimitResponse(rateRes);
  }

  try {
    const body = await request.json();
    const { id, price, startsOn, status, name, description, batchLabel } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing series id.' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (price !== undefined) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) {
        return NextResponse.json({ error: 'Invalid price value.' }, { status: 400 });
      }
      updateData.price = numPrice;
    }
    if (startsOn !== undefined) updateData.starts_on = startsOn;
    if (status !== undefined) updateData.status = status;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (batchLabel !== undefined) updateData.batch_label = batchLabel;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields provided for update.' }, { status: 400 });
    }

    const supabaseAdmin = createAdminSupabase();
    const { data, error } = await supabaseAdmin
      .from('mock_series')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, series: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update mock test series';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
