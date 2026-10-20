import { NextResponse } from 'next/server';
import { requireAdmin, createAdminSupabase } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

export async function GET(request: Request) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `admin_storage_meter_${adminId}_${ip}`,
    RATE_LIMIT_RULES.ADMIN_ACTION.limit,
    RATE_LIMIT_RULES.ADMIN_ACTION.windowSeconds
  );
  if (!rateRes.allowed) {
    return createRateLimitResponse(rateRes);
  }

  try {
    const supabaseAdmin = createAdminSupabase();

    // 1. Total questions count
    const { count: totalQuestions } = await supabaseAdmin
      .from('mock_questions')
      .select('*', { count: 'exact', head: true });

    // 2. Mock tests status breakdown
    const { data: allTests } = await supabaseAdmin
      .from('mock_tests')
      .select('id, title, content_status, purge_after, retention_days, archive_downloaded_at, purge_requires_archive, created_at');

    const tests = allTests || [];
    let draftCount = 0;
    let activeCount = 0;
    let expiredCount = 0;
    let purgedCount = 0;

    const now = Date.now();
    const upcomingPurges: any[] = [];

    tests.forEach((t) => {
      const cStatus = t.content_status || 'draft';
      if (cStatus === 'draft') draftCount++;
      else if (cStatus === 'active') activeCount++;
      else if (cStatus === 'expired') expiredCount++;
      else if (cStatus === 'purged') purgedCount++;

      if (cStatus !== 'purged' && t.purge_after) {
        const purgeTime = new Date(t.purge_after).getTime();
        const daysLeft = Math.ceil((purgeTime - now) / (1000 * 60 * 60 * 24));
        const archiveRecent = t.archive_downloaded_at
          ? now - new Date(t.archive_downloaded_at).getTime() < 24 * 60 * 60 * 1000
          : false;

        upcomingPurges.push({
          id: t.id,
          title: t.title,
          contentStatus: cStatus,
          purgeAfter: t.purge_after,
          daysLeft,
          retentionDays: t.retention_days || 7,
          archiveDownloadedAt: t.archive_downloaded_at,
          archiveRecent,
          purgeRequiresArchive: t.purge_requires_archive,
        });
      }
    });

    upcomingPurges.sort((a, b) => new Date(a.purgeAfter).getTime() - new Date(b.purgeAfter).getTime());

    // 3. Storage bucket mock-question-images files & bytes
    let imageCount = 0;
    let imageBytes = 0;
    try {
      const { data: imgObjects } = await supabaseAdmin.storage
        .from('mock-question-images')
        .list('', { limit: 1000 });

      if (imgObjects) {
        imageCount = imgObjects.length;
        imageBytes = imgObjects.reduce((acc, obj) => acc + ((obj.metadata?.size as number) || 0), 0);
      }
    } catch {}

    // 4. Question papers files & bytes
    const { data: papers } = await supabaseAdmin
      .from('mock_question_papers')
      .select('id, file_size_bytes');

    const paperCount = papers?.length || 0;
    const paperBytes = (papers || []).reduce((acc, p) => acc + (Number(p.file_size_bytes) || 0), 0);

    return NextResponse.json({
      success: true,
      stats: {
        totalQuestions: totalQuestions || 0,
        tests: {
          total: tests.length,
          draft: draftCount,
          active: activeCount,
          expired: expiredCount,
          purged: purgedCount,
        },
        images: {
          count: imageCount,
          bytes: imageBytes,
          mb: (imageBytes / (1024 * 1024)).toFixed(2),
        },
        papers: {
          count: paperCount,
          bytes: paperBytes,
          mb: (paperBytes / (1024 * 1024)).toFixed(2),
        },
        upcomingPurges: upcomingPurges.slice(0, 15),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve storage stats';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
