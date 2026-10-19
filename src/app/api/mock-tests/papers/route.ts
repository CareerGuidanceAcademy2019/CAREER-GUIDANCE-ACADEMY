import { NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const seriesId = searchParams.get('seriesId');
    const subjectId = searchParams.get('subjectId');

    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const supabaseAdmin = createAdminSupabase();

    let query = supabaseAdmin
      .from('mock_question_papers')
      .select('id, series_id, subject_id, test_id, title, file_size_bytes, status, publish_at, expire_at, allow_download, created_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (seriesId) query = query.eq('series_id', seriesId);
    if (subjectId && subjectId !== 'all') {
      if (subjectId === 'full-length') {
        query = query.is('subject_id', null);
      } else {
        query = query.eq('subject_id', subjectId);
      }
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter out papers whose publish_at is in the future (unless user is admin)
    const now = new Date();
    const papers = (data || []).filter((p) => {
      if (p.publish_at && new Date(p.publish_at) > now) return false;
      if (p.expire_at && new Date(p.expire_at) < now) return false;
      return true;
    });

    return NextResponse.json({ success: true, papers });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to list papers';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
