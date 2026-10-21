import { NextResponse } from 'next/server';
import { createAdminSupabase, requireAdmin } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

export async function DELETE(request: Request) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `admin_test_${adminId}_${ip}`,
    RATE_LIMIT_RULES.ADMIN_ACTION.limit,
    RATE_LIMIT_RULES.ADMIN_ACTION.windowSeconds
  );
  if (!rateRes.allowed) return createRateLimitResponse(rateRes);

  const id = new URL(request.url).searchParams.get('id') ?? '';
  if (!id) return NextResponse.json({ error: 'Mock Test ID is required' }, { status: 400 });

  const admin = createAdminSupabase();

  // Find test
  const { data: test } = await admin
    .from('mock_tests')
    .select('id, title')
    .eq('id', id)
    .maybeSingle();

  if (!test) {
    return NextResponse.json({ error: 'Mock test not found' }, { status: 404 });
  }

  // 1. Find and delete diagram images from storage bucket
  const { data: questions } = await admin
    .from('mock_questions')
    .select('image_path, options')
    .eq('test_id', id);

  const imagesToDelete: string[] = [];
  if (questions) {
    for (const q of questions) {
      if (q.image_path) imagesToDelete.push(q.image_path);
      if (Array.isArray(q.options)) {
        for (const opt of q.options) {
          if (typeof opt === 'object' && opt !== null && (opt as any).imagePath) {
            imagesToDelete.push((opt as any).imagePath);
          }
        }
      }
    }
  }

  const { data: groups } = await admin
    .from('mock_question_groups')
    .select('image_path')
    .eq('test_id', id);

  if (groups) {
    for (const g of groups) {
      if (g.image_path) imagesToDelete.push(g.image_path);
    }
  }

  if (imagesToDelete.length > 0) {
    await admin.storage.from('mock-question-images').remove(imagesToDelete).catch(() => null);
  }

  // 2. Cascade delete database tables
  await admin.from('mock_attempts').delete().eq('test_id', id);
  await admin.from('test_attempts').delete().eq('test_id', id);
  await admin.from('mock_questions').delete().eq('test_id', id);
  await admin.from('mock_question_groups').delete().eq('test_id', id);
  await admin.from('mock_launch_log').delete().eq('test_id', id);
  await admin.from('mock_test_question_stats').delete().eq('test_id', id);

  // 3. Delete mock test record
  const { error: delErr } = await admin.from('mock_tests').delete().eq('id', id);
  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    message: `Mock test "${test.title}" and all questions, attempts, and diagram assets permanently deleted from database.`,
  });
}
