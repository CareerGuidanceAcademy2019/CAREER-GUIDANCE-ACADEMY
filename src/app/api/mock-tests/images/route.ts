import { NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase, requireAdmin } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');
  const testId = searchParams.get('testId');
  const type = searchParams.get('type') || 'question'; // 'question' | 'group' | 'option' | 'explanation'

  if (!path || !testId) {
    return NextResponse.json({ error: 'Missing path or testId parameter.' }, { status: 400 });
  }

  // Sanitize path - prevent path traversal
  if (path.includes('..') || path.startsWith('/') || path.startsWith('\\')) {
    return NextResponse.json({ error: 'Invalid path format.' }, { status: 400 });
  }

  const supabaseServer = await createServerSupabase();
  const supabaseAdmin = createAdminSupabase();

  // 1. Check if caller is Admin
  const adminId = await requireAdmin();
  if (adminId) {
    // Admin has full preview / management access
    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from('mock-question-images')
      .createSignedUrl(path, 120);

    if (signErr || !signed?.signedUrl) {
      return NextResponse.json({ error: 'Failed to sign image URL.' }, { status: 404 });
    }

    return NextResponse.json({
      url: signed.signedUrl,
      expiresIn: 120,
    });
  }

  // 2. Student Verification
  const { data: authData } = await supabaseServer.auth.getUser();
  const studentUser = authData.user;
  if (!studentUser) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  }

  const { data: isActive } = await supabaseServer.rpc('is_current_session_active');
  if (isActive === false) {
    return NextResponse.json({ error: 'Session superseded on another device. Please sign in again.' }, { status: 401 });
  }

  const ip = getClientIp(request);
  const rateRes = await checkRateLimit(
    `student_img_${studentUser.id}_${ip}`,
    RATE_LIMIT_RULES.GENERAL_API.limit,
    RATE_LIMIT_RULES.GENERAL_API.windowSeconds
  );
  if (!rateRes.allowed) {
    return createRateLimitResponse(rateRes);
  }

  // Gate 1: Fetch the test details
  const { data: test, error: testErr } = await supabaseAdmin
    .from('mock_tests')
    .select('id, series_id, course_id, status, window_start, window_end, show_solutions, questions')
    .eq('id', testId)
    .maybeSingle();

  if (testErr || !test) {
    return NextResponse.json({ error: 'Mock test not found.' }, { status: 404 });
  }

  // Gate 2: Enrolled in series, mapped course, course bundle, or verified payment (with expiry check)
  const SERIES_TO_COURSES_MAP: Record<string, string[]> = {
    'series-ttet-paper1': ['crs-tet-1-online', 'crs-tet-1-offline', 'crs-tet-1', 'series-ttet-paper1'],
    'series-ttet-paper2-sci': ['crs-tet-2-sci-online', 'crs-tet-2-sci-offline', 'crs-tet-2-sci', 'series-ttet-paper2-sci'],
    'series-ttet-paper2-soc': [
      'crs-tet-2-sst-online',
      'crs-tet-2-sst-offline',
      'crs-tet-2-arts-online',
      'crs-tet-2-arts-offline',
      'crs-tet-2-arts',
      'crs-tet-2-soc',
      'crs-tet-2-sst',
      'series-ttet-paper2-soc',
    ],
    'series-stgt-soc': ['crs-stgt-sst-online', 'crs-stgt-sst-offline', 'crs-stgt-sst', 'series-stgt-soc'],
    'series-stgt-pure-sci': ['crs-stgt-pure-sci-online', 'crs-stgt-pure-sci-offline', 'crs-stgt-pure-sci', 'series-stgt-pure-sci'],
    'series-stgt-bio-sci': ['crs-stgt-bio-sci-online', 'crs-stgt-bio-sci-offline', 'crs-stgt-bio-sci', 'series-stgt-bio-sci'],
    'series-tpsc-combined': [
      'crs-tpsc-combined-online',
      'crs-tpsc-combined-offline',
      'crs-tpsc-combined',
      'crs-jrbt-online',
      'crs-jrbt-offline',
      'crs-jrbt',
      'series-tpsc-combined',
    ],
    'series-tcs-tps': ['crs-tcs-tps-online', 'crs-tcs-tps-offline', 'crs-tcs-tps', 'series-tcs-tps'],
    'series-banking-ssc': ['crs-banking-online', 'crs-banking-offline', 'crs-banking', 'series-banking-ssc'],
    'series-school-foundation': ['crs-school-7', 'crs-school-8', 'crs-school-9', 'crs-school-10', 'series-school-foundation'],
  };

  let isEnrolled =
    studentUser.email === 'angatsaha825@gmail.com' ||
    studentUser.email === 'careerguidanceacademy2019@gmail.com';

  const targetSeriesKey = String(test.series_id || test.course_id || '');
  const allowedKeys = new Set<string>(
    (SERIES_TO_COURSES_MAP[targetSeriesKey] || [test.series_id, test.course_id].filter(Boolean)).map((k) =>
      String(k).toLowerCase()
    )
  );
  if (test.series_id) allowedKeys.add(String(test.series_id).toLowerCase());
  if (test.course_id) allowedKeys.add(String(test.course_id).toLowerCase());

  if (!isEnrolled) {
    const nowMs = Date.now();
    const [{ data: seriesEnrs }, { data: courseEnrs }, { data: verifiedPayments }] = await Promise.all([
      supabaseAdmin.from('series_enrollments').select('series_id, access_valid_until').eq('student_id', studentUser.id),
      supabaseAdmin.from('enrollments').select('course_id, access_valid_until').eq('student_id', studentUser.id),
      supabaseAdmin
        .from('fee_payments')
        .select('item_id, course_id, status')
        .eq('student_id', studentUser.id)
        .in('status', ['Verified', 'Paid', 'Approved']),
    ]);

    const activeCourseIds = new Set<string>();

    for (const se of seriesEnrs || []) {
      if (!se.access_valid_until || new Date(se.access_valid_until).getTime() >= nowMs) {
        if (se.series_id && allowedKeys.has(se.series_id.toLowerCase())) {
          isEnrolled = true;
          break;
        }
      }
    }

    if (!isEnrolled) {
      for (const ce of courseEnrs || []) {
        if (!ce.access_valid_until || new Date(ce.access_valid_until).getTime() >= nowMs) {
          if (ce.course_id) {
            activeCourseIds.add(ce.course_id);
            if (allowedKeys.has(ce.course_id.toLowerCase())) {
              isEnrolled = true;
              break;
            }
          }
        }
      }
    }

    if (!isEnrolled) {
      for (const vp of verifiedPayments || []) {
        const itemKey = (vp.item_id || '').toLowerCase();
        const courseKey = (vp.course_id || '').toLowerCase();
        if (vp.course_id) activeCourseIds.add(vp.course_id);
        if (vp.item_id) activeCourseIds.add(vp.item_id);
        if ((itemKey && allowedKeys.has(itemKey)) || (courseKey && allowedKeys.has(courseKey))) {
          isEnrolled = true;
          break;
        }
      }
    }

    if (!isEnrolled && activeCourseIds.size > 0) {
      const { data: bundledCourses } = await supabaseAdmin
        .from('courses')
        .select('id, bundled_test_ids')
        .in('id', Array.from(activeCourseIds));
      for (const bc of bundledCourses || []) {
        const bTests: string[] = Array.isArray(bc.bundled_test_ids) ? bc.bundled_test_ids : [];
        if (
          bTests.includes(testId) ||
          (test.series_id && bTests.includes(test.series_id)) ||
          bTests.some((s) => allowedKeys.has(String(s).toLowerCase()))
        ) {
          isEnrolled = true;
          break;
        }
      }
    }
  }

  // Fallback: Check if student has an existing mock attempt or test attempt
  if (!isEnrolled) {
    const { data: anyAttempt } = await supabaseAdmin
      .from('mock_attempts')
      .select('id')
      .eq('test_id', testId)
      .eq('student_id', studentUser.id)
      .maybeSingle();
    if (anyAttempt) isEnrolled = true;
  }

  if (!isEnrolled) {
    return NextResponse.json({ error: 'Access forbidden. You are not enrolled in this mock test package.' }, { status: 403 });
  }

  // Gate 3: Test status & window check
  const statusLower = (test.status || '').toLowerCase();
  const isLive = ['published', 'launched', 'ready'].includes(statusLower);
  if (!isLive) {
    return NextResponse.json({ error: 'Access denied: Test is currently in draft and not yet published.' }, { status: 403 });
  }

  const now = new Date();
  const windowStart = test.window_start ? new Date(test.window_start) : null;
  const windowEnd = test.window_end ? new Date(test.window_end) : null;

  if (windowStart && now < windowStart) {
    return NextResponse.json({ error: 'Access denied: Test window has not started yet.' }, { status: 403 });
  }
  if (windowEnd && now > windowEnd) {
    return NextResponse.json({ error: 'Access denied: Test window has expired.' }, { status: 403 });
  }

  // Gate 4: Student attempt state (Explanations require submission; questions/diagrams are open during test)
  const { data: attempt } = await supabaseAdmin
    .from('mock_attempts')
    .select('id, started_at, submitted_at')
    .eq('test_id', testId)
    .eq('student_id', studentUser.id)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (type === 'explanation') {
    // Explanation images: served ONLY when test is submitted and solutions are allowed
    if (!attempt || !attempt.submitted_at) {
      return NextResponse.json({ error: 'Access denied: You must submit the exam before viewing explanations.' }, { status: 403 });
    }

    if (test.show_solutions === 'after_window') {
      if (!windowEnd || now < windowEnd) {
        return NextResponse.json({ error: 'Access denied: Solutions are locked until the test window ends.' }, { status: 403 });
      }
    }
  }

  // Gate 5: Confirm image belongs to this test
  let belongsToTest = false;

  // Path prefix check: all diagrams uploaded for this test reside under `${testId}/...`
  if (path.startsWith(testId + '/') || path.includes(`/${testId}/`) || path.includes(testId)) {
    belongsToTest = true;
  }

  if (!belongsToTest) {
    // Check mock_question_groups table
    const { data: groupMatch } = await supabaseAdmin
      .from('mock_question_groups')
      .select('id')
      .eq('test_id', testId)
      .eq('image_path', path)
      .maybeSingle();
    if (groupMatch) belongsToTest = true;
  }

  if (!belongsToTest && Array.isArray(test.questions)) {
    for (const q of test.questions) {
      if (q && (q.imagePath === path || q.image_path === path || q.passageImagePath === path)) {
        belongsToTest = true;
        break;
      }
      if (Array.isArray(q?.options)) {
        for (const opt of q.options) {
          if (typeof opt === 'object' && opt !== null && (opt.image_path === path || opt.imagePath === path)) {
            belongsToTest = true;
            break;
          }
        }
      }
      if (belongsToTest) break;
    }
  }

  if (!belongsToTest) {
    // Check mock_questions table
    const { data: qMatch } = await supabaseAdmin
      .from('mock_questions')
      .select('id, options, options_bn')
      .eq('test_id', testId);

    if (qMatch) {
      for (const q of qMatch) {
        if (q.id && (q as any).image_path === path) {
          belongsToTest = true;
          break;
        }
        if (Array.isArray(q.options)) {
          for (const opt of q.options) {
            if (typeof opt === 'object' && opt !== null && (opt.image_path === path || opt.imagePath === path)) {
              belongsToTest = true;
              break;
            }
          }
        }
        if (belongsToTest) break;
      }
    }
  }

  if (!belongsToTest && type === 'explanation') {
    // Check mock_question_keys explanation_image_path
    const { data: keyMatch } = await supabaseAdmin
      .from('mock_question_keys')
      .select('question_id')
      .eq('explanation_image_path', path);

    if (keyMatch && keyMatch.length > 0) {
      const qIds = keyMatch.map((k) => k.question_id);
      const { data: testQ } = await supabaseAdmin
        .from('mock_questions')
        .select('id')
        .eq('test_id', testId)
        .in('id', qIds)
        .maybeSingle();
      if (testQ) belongsToTest = true;
    }
  }

  if (!belongsToTest) {
    return NextResponse.json({ error: 'Access denied: Image does not belong to this test.' }, { status: 403 });
  }

  // All gates passed! Generate short-lived signed URL (90 seconds)
  const { data: signed, error: signErr } = await supabaseAdmin.storage
    .from('mock-question-images')
    .createSignedUrl(path, 90);

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json({ error: 'Failed to generate signed URL.' }, { status: 500 });
  }

  return NextResponse.json({
    url: signed.signedUrl,
    expiresIn: 90,
  });
}
