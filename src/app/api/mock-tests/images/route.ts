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
    .select('id, series_id, course_id, status, window_start, window_end, show_solutions')
    .eq('id', testId)
    .single();

  if (testErr || !test) {
    return NextResponse.json({ error: 'Mock test not found.' }, { status: 404 });
  }

  // Gate 2: Enrolled in series or course
  let isEnrolled = false;
  if (test.series_id) {
    const { data: enr } = await supabaseAdmin
      .from('series_enrollments')
      .select('id')
      .eq('student_id', studentUser.id)
      .eq('series_id', test.series_id)
      .maybeSingle();
    if (enr) isEnrolled = true;
  }
  if (!isEnrolled && test.course_id) {
    const { data: enrCourse } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('student_id', studentUser.id)
      .eq('course_id', test.course_id)
      .maybeSingle();
    if (enrCourse) isEnrolled = true;
  }

  if (!isEnrolled) {
    return NextResponse.json({ error: 'Access forbidden. You are not enrolled in this mock test package.' }, { status: 403 });
  }

  // Gate 3: Test window check (Postgres server time)
  const now = new Date();
  const windowStart = test.window_start ? new Date(test.window_start) : null;
  const windowEnd = test.window_end ? new Date(test.window_end) : null;

  // Gate 4: Student attempt state
  const { data: attempt } = await supabaseAdmin
    .from('mock_attempts')
    .select('id, started_at, submitted_at')
    .eq('test_id', testId)
    .eq('student_id', studentUser.id)
    .maybeSingle();

  if (type === 'explanation') {
    // Explanation images: served ONLY when solutions are allowed
    if (!attempt || !attempt.submitted_at) {
      return NextResponse.json({ error: 'Access denied: You must submit the exam before viewing explanations.' }, { status: 403 });
    }

    if (test.show_solutions === 'after_window') {
      if (!windowEnd || now < windowEnd) {
        return NextResponse.json({ error: 'Access denied: Solutions are locked until the test window ends.' }, { status: 403 });
      }
    }
    // If show_solutions === 'after_submit' and test is submitted, it is allowed!
  } else {
    // Regular question / group / option images:
    // Window must be active
    if (test.status !== 'launched' || !windowStart || !windowEnd || now < windowStart || now > windowEnd) {
      return NextResponse.json({ error: 'Access denied: Test window is not currently open.' }, { status: 403 });
    }

    // Must have an active (unsubmitted) attempt
    if (!attempt || attempt.submitted_at !== null) {
      return NextResponse.json({ error: 'Access denied: No active in-progress attempt found for this test.' }, { status: 403 });
    }
  }

  // Gate 5: Confirm image actually belongs to this test
  // Check mock_question_groups
  const { data: groupMatch } = await supabaseAdmin
    .from('mock_question_groups')
    .select('id')
    .eq('test_id', testId)
    .eq('image_path', path)
    .maybeSingle();

  let belongsToTest = Boolean(groupMatch);

  if (!belongsToTest) {
    // Check mock_questions (image_path)
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
      // Ensure the question belongs to this test
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
