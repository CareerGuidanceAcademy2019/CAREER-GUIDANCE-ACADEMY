import { NextResponse } from 'next/server';
import { createAdminSupabase, requireAdmin } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';
import { getDataUrlSizeKb, TOPPER_DP_MIN_KB, TOPPER_DP_MAX_KB } from '@/lib/imageCompressor';

export async function POST(request: Request) {
  const adminId = await requireAdmin(request);
  if (!adminId) {
    return NextResponse.json({ error: 'Forbidden. Administrator access required.' }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `admin_upsert_ach_${adminId}_${ip}`,
    RATE_LIMIT_RULES.ADMIN_ACTION.limit,
    RATE_LIMIT_RULES.ADMIN_ACTION.windowSeconds
  );
  if (!rateRes.allowed) return createRateLimitResponse(rateRes);

  try {
    const body = await request.json().catch(() => null);
    if (!body || !String(body.name || '').trim()) {
      return NextResponse.json({ error: 'Candidate name is required.' }, { status: 400 });
    }
    if (!String(body.exam || '').trim() || !String(body.rank || '').trim()) {
      return NextResponse.json({ error: 'Examination name and Rank are required.' }, { status: 400 });
    }

    const photo = String(body.photo || '').trim();
    if (!photo) {
      return NextResponse.json({ error: 'Candidate DP / Photograph is required.' }, { status: 400 });
    }

    // Enforce 20 KB to 50 KB restriction for uploaded data:image candidate DPs
    if (photo.startsWith('data:image/') && !photo.startsWith('data:image/svg+xml')) {
      const sizeKb = getDataUrlSizeKb(photo);
      if (sizeKb < TOPPER_DP_MIN_KB || sizeKb > TOPPER_DP_MAX_KB) {
        return NextResponse.json(
          {
            error: `Candidate DP size (${sizeKb} KB) must be between ${TOPPER_DP_MIN_KB} KB and ${TOPPER_DP_MAX_KB} KB.`,
          },
          { status: 400 }
        );
      }
    }

    const id = String(body.id || `ach-${Date.now()}`).trim();
    const admin = createAdminSupabase();

    const { data, error } = await admin
      .from('achievements')
      .upsert({
        id,
        name: String(body.name).trim(),
        exam: String(body.exam).trim(),
        rank: String(body.rank).trim(),
        year: String(body.year || '2026').trim(),
        photo,
        quote: String(body.quote || '').trim(),
        category: String(body.category || 'Teaching and Recruitment Exams').trim(),
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, achievement: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to save topper achievement.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const adminId = await requireAdmin(request);
  if (!adminId) {
    return NextResponse.json({ error: 'Forbidden. Administrator access required.' }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `admin_del_ach_${adminId}_${ip}`,
    RATE_LIMIT_RULES.ADMIN_ACTION.limit,
    RATE_LIMIT_RULES.ADMIN_ACTION.windowSeconds
  );
  if (!rateRes.allowed) return createRateLimitResponse(rateRes);

  const id = new URL(request.url).searchParams.get('id')?.trim() ?? '';
  if (!id) {
    return NextResponse.json({ error: 'Achievement ID is required.' }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const { error } = await admin.from('achievements').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, id });
}
