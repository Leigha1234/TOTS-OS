import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { buildCourseEmail, type MtcCourseType, type CourseEmailStep } from '@/lib/mtc-marketing/course-email';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/** Authenticated template preview. Does not query contacts or send mail. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const a = Buffer.from(token), b = Buffer.from(secret);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const course = req.nextUrl.searchParams.get('course') ?? 'beginner_hyrox';
  const step = req.nextUrl.searchParams.get('step') ?? 'welcome';
  if (!['beginner_hyrox', 'beginner_crossfit', 'mum_fit'].includes(course) || !['welcome', 'mid_course', 'course_complete'].includes(step)) {
    return NextResponse.json({ error: 'Invalid course or step' }, { status: 400 });
  }
  try {
    const result = buildCourseEmail({
      course: course as MtcCourseType, step: step as CourseEmailStep,
      firstName: 'Alex',
      membershipUrl: process.env.MTC_MEMBERSHIP_URL || '',
      unsubscribeUrl: 'https://www.orbi-os.co.uk/api/campaigns/unsubscribe?token=PREVIEW_ONLY',
    });
    return NextResponse.json({ ...result, preview_only: true, sends_email: false }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Set a valid HTTPS MTC_MEMBERSHIP_URL' }, { status: 503 });
  }
}
