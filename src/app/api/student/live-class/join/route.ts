import { NextResponse } from 'next/server';
import { createAdminSupabase, requireActiveSession } from '@/lib/supabase/server';

/**
 * Strict Server-Verified Live Class Join Endpoint (/api/student/live-class/join?courseId=...)
 *
 * Security guarantees:
 * 1. Only authenticated users with an active session may call this endpoint.
 * 2. Course MUST exist and have mode === 'Online'.
 * 3. Only Admins/Faculty OR students with an active, non-expired enrollment in this specific
 *    online course (via `enrollments` or verified `fee_payments`) can join.
 * 4. Raw Google Meet / Zoom URLs are never exposed in public/student APIs or the student DOM;
 *    this endpoint issues a direct 302 redirect only after passing all server-side checks.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const courseId = (url.searchParams.get('courseId') || '').trim();

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required.' }, { status: 400 });
    }

    const active = await requireActiveSession(request);
    if (!active) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to your student account.' },
        { status: 401 }
      );
    }

    const { user, role } = active;
    const admin = createAdminSupabase();

    const isAdminOrFaculty =
      role === 'admin' ||
      role === 'ADMIN' ||
      role === 'faculty' ||
      role === 'FACULTY' ||
      user.email === 'angatsaha825@gmail.com' ||
      user.email === 'careerguidanceacademy2019@gmail.com';

    // 1. Verify course exists and is an Online course
    const { data: course, error: courseErr } = await admin
      .from('courses')
      .select('id, name, mode, online_class_link')
      .eq('id', courseId)
      .maybeSingle();

    if (courseErr || !course) {
      return NextResponse.json({ error: 'Online course not found.' }, { status: 404 });
    }

    if (course.mode !== 'Online') {
      return NextResponse.json(
        { error: 'Live online class links are only available for Online courses.' },
        { status: 403 }
      );
    }

    // 2. Strict enrollment check for non-admin students
    if (!isAdminOrFaculty) {
      const now = Date.now();
      const [{ data: enrollment }, { data: verifiedPayment }] = await Promise.all([
        admin
          .from('enrollments')
          .select('id, access_valid_until')
          .eq('student_id', user.id)
          .eq('course_id', courseId)
          .maybeSingle(),
        admin
          .from('fee_payments')
          .select('id, status')
          .eq('student_id', user.id)
          .or(`course_id.eq.${courseId},item_id.eq.${courseId}`)
          .in('status', ['Verified', 'Paid', 'Approved'])
          .limit(1)
          .maybeSingle(),
      ]);

      const hasActiveEnrollment = Boolean(
        enrollment &&
          (!enrollment.access_valid_until ||
            new Date(enrollment.access_valid_until).getTime() >= now)
      );

      const isExplicitlyExpired = Boolean(
        enrollment &&
          enrollment.access_valid_until &&
          new Date(enrollment.access_valid_until).getTime() < now
      );

      const hasVerifiedCoursePayment = !isExplicitlyExpired && Boolean(verifiedPayment);

      if (!hasActiveEnrollment && !hasVerifiedCoursePayment) {
        return NextResponse.json(
          {
            error: isExplicitlyExpired
              ? 'Your enrollment access for this online course has expired. Please contact C.G.A administration to renew.'
              : 'Access Denied: Only students actively enrolled in this online course can join the live class.',
          },
          { status: 403 }
        );
      }
    }

    // 3. Resolve live class meeting link from site_content.onlineClassUpdates or courses.online_class_link
    const { data: siteRow } = await admin
      .from('site_content')
      .select('content')
      .eq('id', 1)
      .maybeSingle();

    const siteUpdate = (siteRow?.content as any)?.onlineClassUpdates?.[courseId];
    const rawLink = String(siteUpdate?.link || course.online_class_link || '').trim();

    if (!rawLink) {
      return NextResponse.json(
        { error: 'No live class link has been posted by the administrator yet.' },
        { status: 404 }
      );
    }

    // Validate safe http/https URL before redirecting
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawLink);
      if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
        throw new Error('Invalid protocol');
      }
    } catch {
      return NextResponse.json(
        { error: 'The posted live class link is not a valid meeting URL.' },
        { status: 400 }
      );
    }

    return NextResponse.redirect(parsedUrl.toString(), {
      status: 302,
      headers: {
        'Cache-Control': 'private, no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to join live class';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
