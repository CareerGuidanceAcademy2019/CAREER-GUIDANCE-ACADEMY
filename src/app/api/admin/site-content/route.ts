import { NextResponse } from 'next/server';
import { requireAdmin, createAdminSupabase } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';
import { MAX_CAMPUS_IMAGES } from '@/lib/imageCompressor';

export async function GET() {
  try {
    const adminSupabase = createAdminSupabase();
    const { data, error } = await adminSupabase
      .from('site_content')
      .select('content')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, content: data?.content ?? null });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve site content';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const adminId = await requireAdmin(request);
  if (!adminId) {
    return NextResponse.json(
      { error: 'Unauthorized. Administrator access required.' },
      { status: 403 }
    );
  }

  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `admin_site_content_${adminId}_${ip}`,
    RATE_LIMIT_RULES.ADMIN_ACTION.limit,
    RATE_LIMIT_RULES.ADMIN_ACTION.windowSeconds
  );
  if (!rateRes.allowed) {
    return createRateLimitResponse(rateRes);
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body.' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminSupabase();

    // 1. Fetch current content to ensure atomic, safe merge without losing unedited sections
    const { data: existingRow, error: fetchErr } = await adminSupabase
      .from('site_content')
      .select('content')
      .eq('id', 1)
      .maybeSingle();

    if (fetchErr) {
      console.warn('[api/admin/site-content] fetch existing error:', fetchErr.message);
    }

    const existingContent = (existingRow?.content as Record<string, any>) || {};
    const existingImages: any[] = Array.isArray(existingContent.campusImages)
      ? existingContent.campusImages
      : [];

    // Support atomic single-image operations so uploading photo #11..#20 never has to re-send all 20 base64 images
    if (body.action === 'add_campus_image' && body.image) {
      if (existingImages.length >= MAX_CAMPUS_IMAGES) {
        return NextResponse.json(
          { error: `Maximum limit of ${MAX_CAMPUS_IMAGES} front-page images reached. Please delete or replace an existing image.` },
          { status: 400 }
        );
      }
      const nextImages = [body.image, ...existingImages].slice(0, MAX_CAMPUS_IMAGES);
      const mergedContent = { ...existingContent, campusImages: nextImages };
      const { error: upsertErr } = await adminSupabase.from('site_content').upsert(
        { id: 1, content: mergedContent, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      );
      if (upsertErr) {
        return NextResponse.json({ error: upsertErr.message }, { status: 500 });
      }
      return NextResponse.json({
        success: true,
        message: `Classroom photo added (${nextImages.length}/${MAX_CAMPUS_IMAGES}).`,
        content: mergedContent,
      });
    }

    if (body.action === 'update_campus_image' && body.image) {
      const nextImages = existingImages.map((img: any) =>
        img.id === body.image.id ? { ...img, ...body.image } : img
      );
      const mergedContent = { ...existingContent, campusImages: nextImages };
      const { error: upsertErr } = await adminSupabase.from('site_content').upsert(
        { id: 1, content: mergedContent, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      );
      if (upsertErr) {
        return NextResponse.json({ error: upsertErr.message }, { status: 500 });
      }
      return NextResponse.json({
        success: true,
        message: 'Classroom photo updated.',
        content: mergedContent,
      });
    }

    if (body.action === 'delete_campus_image' && body.imageId) {
      const nextImages = existingImages.filter((img: any) => img.id !== body.imageId);
      const mergedContent = { ...existingContent, campusImages: nextImages };
      const { error: upsertErr } = await adminSupabase.from('site_content').upsert(
        { id: 1, content: mergedContent, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      );
      if (upsertErr) {
        return NextResponse.json({ error: upsertErr.message }, { status: 500 });
      }
      return NextResponse.json({
        success: true,
        message: 'Classroom photo removed.',
        content: mergedContent,
      });
    }

    if (!body.content) {
      return NextResponse.json(
        { error: 'Invalid request body. "content" object is required.' },
        { status: 400 }
      );
    }

    const newContent = body.content;

    // 2. Perform deep merge of top-level content fields
    const mergedContent = {
      ...existingContent,
      ...newContent,
    };

    // Ensure campusImages is strictly preserved as passed and capped at MAX_CAMPUS_IMAGES (20)
    if (Array.isArray(newContent.campusImages)) {
      if (newContent.campusImages.length > MAX_CAMPUS_IMAGES) {
        return NextResponse.json(
          { error: `Maximum ${MAX_CAMPUS_IMAGES} images are allowed on the front page banner.` },
          { status: 400 }
        );
      }
      mergedContent.campusImages = newContent.campusImages;
    }

    // 3. Upsert into site_content singleton
    const { error: upsertErr } = await adminSupabase.from('site_content').upsert(
      {
        id: 1,
        content: mergedContent,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (upsertErr) {
      console.error('[api/admin/site-content] upsert error:', upsertErr);
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Site content and campus images saved successfully.',
      content: mergedContent,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save site content';
    console.error('[api/admin/site-content] exception:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
