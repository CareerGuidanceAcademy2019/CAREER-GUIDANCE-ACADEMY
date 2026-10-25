import { NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase, requireActiveSession } from '@/lib/supabase/server';
import { checkRateLimit, createRateLimitResponse, getClientIp, RATE_LIMIT_RULES } from '@/lib/rateLimit';
import { INITIAL_SEED_DATA, MockQuestionOption, getOptionText } from '@/data/initialSeedData';

// Normalized course and series mappings for strict access isolation
const TET_P1_KEYS = new Set([
  'series-ttet-paper1',
  'crs-tet-1-online',
  'crs-tet-1-offline',
  'crs-tet-1',
]);

const TET_P2_SCI_KEYS = new Set([
  'series-ttet-paper2-sci',
  'crs-tet-2-sci-online',
  'crs-tet-2-sci-offline',
  'crs-tet-2-sci',
]);

const TET_P2_SOC_KEYS = new Set([
  'series-ttet-paper2-soc',
  'crs-tet-2-sst-online',
  'crs-tet-2-sst-offline',
  'crs-tet-2-sst',
  'crs-tet-2-soc',
  'crs-tet-2-arts-online',
  'crs-tet-2-arts-offline',
  'crs-tet-2-arts',
]);

const STGT_SOC_KEYS = new Set([
  'series-stgt-soc',
  'crs-stgt-sst-online',
  'crs-stgt-sst-offline',
  'crs-stgt-sst',
]);

const STGT_PURE_SCI_KEYS = new Set([
  'series-stgt-pure-sci',
  'crs-stgt-pure-sci-online',
  'crs-stgt-pure-sci-offline',
  'crs-stgt-pure-sci',
]);

const STGT_BIO_SCI_KEYS = new Set([
  'series-stgt-bio-sci',
  'crs-stgt-bio-sci-online',
  'crs-stgt-bio-sci-offline',
  'crs-stgt-bio-sci',
]);

const TPSC_COMBINED_KEYS = new Set([
  'series-tpsc-combined',
  'crs-tpsc-combined-online',
  'crs-tpsc-combined-offline',
  'crs-tpsc-combined',
  'crs-jrbt-online',
  'crs-jrbt-offline',
  'crs-jrbt',
]);

const TCS_TPS_KEYS = new Set([
  'series-tcs-tps',
  'crs-tcs-tps-online',
  'crs-tcs-tps-offline',
  'crs-tcs-tps',
]);

const BANKING_SSC_KEYS = new Set([
  'series-banking-ssc',
  'crs-banking-online',
  'crs-banking-offline',
  'crs-banking',
]);

const SCHOOL_FOUNDATION_KEYS = new Set([
  'series-school-foundation',
  'crs-school-7',
  'crs-school-8',
  'crs-school-9',
  'crs-school-10',
]);

function getMatchingAllowedKeys(targetKey: string, title?: string): { keys: Set<string>; sectionLabel: string } {
  const normKey = targetKey?.toLowerCase() || '';
  const normTitle = title?.toLowerCase() || '';

  // 1. Direct ID / Key matching
  if (TET_P2_SOC_KEYS.has(normKey)) {
    return { keys: TET_P2_SOC_KEYS, sectionLabel: 'Tripura TET Paper-II (Social Studies)' };
  }
  if (TET_P2_SCI_KEYS.has(normKey)) {
    return { keys: TET_P2_SCI_KEYS, sectionLabel: 'Tripura TET Paper-II (Science & Mathematics)' };
  }
  if (TET_P1_KEYS.has(normKey)) {
    return { keys: TET_P1_KEYS, sectionLabel: 'Tripura TET Paper-I' };
  }
  if (STGT_SOC_KEYS.has(normKey)) {
    return { keys: STGT_SOC_KEYS, sectionLabel: 'TRBT STGT (Social Science)' };
  }
  if (STGT_PURE_SCI_KEYS.has(normKey)) {
    return { keys: STGT_PURE_SCI_KEYS, sectionLabel: 'TRBT STGT (Pure Science)' };
  }
  if (STGT_BIO_SCI_KEYS.has(normKey)) {
    return { keys: STGT_BIO_SCI_KEYS, sectionLabel: 'TRBT STGT (Biological Science)' };
  }
  if (TPSC_COMBINED_KEYS.has(normKey)) {
    return { keys: TPSC_COMBINED_KEYS, sectionLabel: 'TPSC Combined Services & JRBT' };
  }
  if (TCS_TPS_KEYS.has(normKey)) {
    return { keys: TCS_TPS_KEYS, sectionLabel: 'TCS / TPS Civil & Police Services' };
  }
  if (BANKING_SSC_KEYS.has(normKey)) {
    return { keys: BANKING_SSC_KEYS, sectionLabel: 'Banking IBPS/SBI, SSC & Railway' };
  }
  if (SCHOOL_FOUNDATION_KEYS.has(normKey)) {
    return { keys: SCHOOL_FOUNDATION_KEYS, sectionLabel: 'School Foundation Wings (Classes VII-X)' };
  }

  // 2. Strict Title / Subject Fallback
  if (normTitle.includes('bio') && (normTitle.includes('stgt') || normTitle.includes('botany') || normTitle.includes('zoology'))) {
    return { keys: STGT_BIO_SCI_KEYS, sectionLabel: 'TRBT STGT (Biological Science)' };
  }
  if (normTitle.includes('pure') && (normTitle.includes('stgt') || normTitle.includes('physics') || normTitle.includes('chemistry'))) {
    return { keys: STGT_PURE_SCI_KEYS, sectionLabel: 'TRBT STGT (Pure Science)' };
  }
  if (normTitle.includes('stgt')) {
    return { keys: STGT_SOC_KEYS, sectionLabel: 'TRBT STGT (Social Science)' };
  }
  if (normTitle.includes('tcs') || normTitle.includes('tps') || normTitle.includes('police service')) {
    return { keys: TCS_TPS_KEYS, sectionLabel: 'TCS / TPS Civil & Police Services' };
  }
  if (normTitle.includes('tpsc') || normTitle.includes('jrbt')) {
    return { keys: TPSC_COMBINED_KEYS, sectionLabel: 'TPSC Combined Services & JRBT' };
  }
  if (normTitle.includes('banking') || normTitle.includes('ibps') || normTitle.includes('sbi') || normTitle.includes('railway') || normTitle.includes('cgl')) {
    return { keys: BANKING_SSC_KEYS, sectionLabel: 'Banking IBPS/SBI, SSC & Railway' };
  }
  if (normTitle.includes('tbse') || normTitle.includes('cbse') || normTitle.includes('class x') || normTitle.includes('class 10') || normTitle.includes('class ix') || normTitle.includes('class 9')) {
    return { keys: SCHOOL_FOUNDATION_KEYS, sectionLabel: 'School Foundation Wings (Classes VII-X)' };
  }

  if (
    normTitle.includes('social') ||
    normTitle.includes('arts') ||
    normTitle.includes('sst') ||
    normTitle.includes('history') ||
    normTitle.includes('geography') ||
    normTitle.includes('polity')
  ) {
    return { keys: TET_P2_SOC_KEYS, sectionLabel: 'Tripura TET Paper-II (Social Studies)' };
  }

  if (
    normTitle.includes('science') ||
    normTitle.includes('math')
  ) {
    return { keys: TET_P2_SCI_KEYS, sectionLabel: 'Tripura TET Paper-II (Science & Mathematics)' };
  }

  // Ensure "paper-ii" does not accidentally match "paper-i"
  const isExplicitP2 = /\b(paper[\s\-_]?(?:2|ii)|tet[\s\-_]?2)\b/i.test(normTitle);
  if (
    !isExplicitP2 &&
    (/\b(paper[\s\-_]?(?:1|i)|tet[\s\-_]?1)\b/i.test(normTitle) ||
      normTitle.includes('evs'))
  ) {
    return { keys: TET_P1_KEYS, sectionLabel: 'Tripura TET Paper-I' };
  }

  return { keys: new Set([normKey].filter(Boolean)), sectionLabel: 'Enrolled Course / Series' };
}

export async function POST(request: Request) {
  try {
    const active = await requireActiveSession();
    if (!active) {
      return NextResponse.json({ error: 'Unauthorized or session revoked on another device.' }, { status: 401 });
    }
    const { user, supabase } = active;

    const ip = getClientIp(request);
    const rateRes = await checkRateLimit(
      `start_test_${user.id}_${ip}`,
      RATE_LIMIT_RULES.MOCK_START.limit,
      RATE_LIMIT_RULES.MOCK_START.windowSeconds
    );
    if (!rateRes.allowed) {
      return createRateLimitResponse(rateRes);
    }

    const body = await request.json();
    const { testId } = body;

    if (!testId) {
      return NextResponse.json({ error: 'Missing testId parameter.' }, { status: 400 });
    }

    // 1. First attempt: call standard DB RPC get_test_questions
    try {
      const { data, error } = await supabase.rpc('get_test_questions', {
        p_test_id: testId,
      });

      if (!error && data && Array.isArray(data.questions) && data.questions.length > 0) {
        return NextResponse.json({
          success: true,
          ...data,
        });
      }
    } catch {
      // Proceed to authoritative admin client check below
    }

    // 2. Authoritative Server-side Verification & Fallback via Admin Client
    const admin = createAdminSupabase();

    // Check if user is an administrator
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const isAdmin = profile?.role === 'admin' || user.email === 'angatsaha825@gmail.com';

    // Retrieve test record
    const { data: dbTest } = await admin
      .from('mock_tests')
      .select('*')
      .eq('id', testId)
      .maybeSingle();

    // Fallback to seed test if not found in db
    const seedTest = INITIAL_SEED_DATA.mockTests.find((t) => t.id === testId);
    const testRecord = dbTest || seedTest;

    if (!testRecord) {
      return NextResponse.json({ error: 'Test not found or no longer available.' }, { status: 404 });
    }

    // Check test live status (Admins can preview any status)
    const status = (testRecord.status || '').toLowerCase();
    const isLive = status === 'published' || status === 'launched' || status === 'ready';
    if (!isAdmin && !isLive) {
      return NextResponse.json({ error: 'This mock test has not yet been launched live by administrators.' }, { status: 403 });
    }

    // 2.5 Strict Single Attempt Enforcement: Each candidate can appear only once
    if (!isAdmin) {
      const { data: pastAttempts } = await admin
        .from('test_attempts')
        .select('id, submitted_at')
        .eq('test_id', testId)
        .eq('student_id', user.id);

      const hasSubmitted = (pastAttempts || []).some((a: any) => a.submitted_at != null);
      if (hasSubmitted) {
        return NextResponse.json(
          {
            error:
              'Single Attempt Policy: You have already appeared for and submitted this mock test. Reattempts are not permitted. You can review your scorecard and solutions.',
            alreadyAttempted: true,
          },
          { status: 403 }
        );
      }
    }

    // 3. Strict Enrollment Verification (Course Isolation)
    if (!isAdmin) {
      const testCourseId = (testRecord.course_id || testRecord.courseId || '').toString();
      const testSeriesId = (testRecord.series_id || testRecord.seriesId || '').toString();
      const testTitle = (testRecord.title || '').toString();

      const { keys: allowedKeys, sectionLabel } = getMatchingAllowedKeys(testSeriesId || testCourseId, testTitle);

      // Check series enrollments
      const { data: seriesEnrs } = await admin
        .from('series_enrollments')
        .select('series_id, access_valid_until')
        .eq('student_id', user.id);

      // Check course enrollments
      const { data: courseEnrs } = await admin
        .from('enrollments')
        .select('course_id, access_valid_until')
        .eq('student_id', user.id);

      const now = Date.now();
      let hasValidEnrollment = false;

      // Verify series enrollment
      if (seriesEnrs && seriesEnrs.length > 0) {
        for (const se of seriesEnrs) {
          if (allowedKeys.has(se.series_id?.toLowerCase())) {
            if (!se.access_valid_until || new Date(se.access_valid_until).getTime() > now) {
              hasValidEnrollment = true;
              break;
            }
          }
        }
      }

      // Verify course enrollment
      if (!hasValidEnrollment && courseEnrs && courseEnrs.length > 0) {
        for (const ce of courseEnrs) {
          if (allowedKeys.has(ce.course_id?.toLowerCase())) {
            if (!ce.access_valid_until || new Date(ce.access_valid_until).getTime() > now) {
              hasValidEnrollment = true;
              break;
            }
          }
        }
      }

      if (!hasValidEnrollment) {
        return NextResponse.json(
          {
            error: `Access Restricted: You are not enrolled in ${sectionLabel}. Enrolling in a specific mock test series or course gives you access only to that specific section's tests.`,
          },
          { status: 403 }
        );
      }
    }

    // 4. Retrieve Questions (From mock_questions table or test.questions JSONB)
    const { data: dbQuestions } = await admin
      .from('mock_questions')
      .select('*')
      .eq('test_id', testId)
      .order('position', { ascending: true });

    let rawQuestions: any[] = [];
    if (dbQuestions && dbQuestions.length > 0) {
      rawQuestions = dbQuestions;
    } else if (Array.isArray(testRecord.questions) && testRecord.questions.length > 0) {
      rawQuestions = testRecord.questions;
    } else if (seedTest && Array.isArray(seedTest.questions)) {
      rawQuestions = seedTest.questions;
    }

    if (rawQuestions.length === 0) {
      return NextResponse.json(
        { error: 'Questions for this mock test are currently being finalized by the faculty. Please check back shortly.' },
        { status: 400 }
      );
    }

    // 5. Sanitize and Strip Answer Keys & Explanations for Student Security
    const sanitizedQuestions = rawQuestions.map((q: any, idx: number) => {
      const qText = q.questionText || q.question_text || q.question || '';
      const qTextBn = q.questionTextBn || q.question_text_bn || q.questionBn || undefined;
      const opts = q.options || [];
      const optsBn = q.optionsBn || q.options_bn || undefined;

      return {
        id: q.id || `q-${idx + 1}`,
        position: q.position ?? idx + 1,
        questionText: qText,
        question: qText,
        questionTextBn: qTextBn,
        questionBn: qTextBn,
        options: opts,
        optionsBn: optsBn,
        groupId: q.groupId || q.group_id || null,
        imagePath: q.imagePath || q.image_path || null,
        imageAlt: q.imageAlt || q.image_alt || null,
        imageWidth: q.imageWidth || q.image_width || null,
        imageHeight: q.imageHeight || q.image_height || null,
        // Answer keys MUST NEVER be leaked to students prior to submission
        correctOptionIndex: -1,
        explanation: '',
        explanationBn: '',
      };
    });

    return NextResponse.json({
      success: true,
      testId: testRecord.id,
      title: testRecord.title,
      durationMinutes: Number(testRecord.duration_minutes || testRecord.durationMinutes || 30),
      totalMarks: Number(testRecord.total_marks || testRecord.totalMarks || 30),
      negativeMarking: Number(testRecord.negative_marking ?? testRecord.negativeMarking ?? 0),
      serverNow: new Date().toISOString(),
      questionGroups: [],
      questions: sanitizedQuestions,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to start test';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
