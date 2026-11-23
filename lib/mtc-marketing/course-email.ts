/** MTC beginner course conversion sequence. Templates only: no automatic sending. */
export type MtcCourseType = 'beginner_hyrox' | 'beginner_crossfit' | 'mum_fit';
export type CourseEmailStep = 'welcome' | 'mid_course' | 'course_complete';
export const COURSE_EMAIL_STEPS: ReadonlyArray<{ step: CourseEmailStep; daysAfterPurchase: number }> = [
  { step: 'welcome', daysAfterPurchase: 0 },
  { step: 'mid_course', daysAfterPurchase: 14 },
  { step: 'course_complete', daysAfterPurchase: 28 },
];
const labels: Record<MtcCourseType, string> = {
  beginner_hyrox: 'Beginner HYROX', beginner_crossfit: 'Beginner CrossFit', mum_fit: 'Mum-FIT',
};
function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function safeHttpsUrl(value: string, label: string) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error(`${label} must be an HTTPS URL`);
  return url.toString();
}
export function buildCourseEmail(input: {
  course: MtcCourseType; step: CourseEmailStep; firstName?: string;
  membershipUrl: string; unsubscribeUrl: string;
}) {
  const label = labels[input.course];
  if (!label) throw new Error('Unsupported course');
  const membershipUrl = safeHttpsUrl(input.membershipUrl, 'Membership link');
  const unsubscribeUrl = safeHttpsUrl(input.unsubscribeUrl, 'Unsubscribe link');
  const firstName = (input.firstName || 'there').trim().slice(0, 80);
  const greeting = `Hi ${firstName},`;
  const copy: Record<CourseEmailStep, { subject: string; title: string; body: string }> = {
    welcome: {
      subject: `Welcome to ${label} at MTC`, title: `You're in! Welcome to ${label}`,
      body: `We're looking forward to helping you build confidence, learn new skills and enjoy training with us. Keep an eye on your booking confirmation for your course details.`,
    },
    mid_course: {
      subject: `How's ${label} going?`, title: `You're making progress`,
      body: `We hope you're enjoying your sessions. If you're thinking about continuing after your course, you can explore our regular classes and memberships whenever you're ready.`,
    },
    course_complete: {
      subject: `Keep going after ${label}`, title: `Your next chapter at MTC`,
      body: `Well done on taking part in ${label}. If you'd like to keep training with us, have a look at the membership options and find a routine that works for you.`,
    },
  };
  const content = copy[input.step];
  if (!content) throw new Error('Unsupported email step');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f4f4f4;font-family:Arial,sans-serif;color:#181818"><div style="max-width:600px;margin:30px auto;background:white;padding:32px;border-top:8px solid #f5d20a"><p style="font-size:13px;font-weight:bold">MORAY TRAINING CLUB</p><h1 style="font-size:28px">${escapeHtml(content.title)}</h1><p>${escapeHtml(greeting)}</p><p style="line-height:1.7">${escapeHtml(content.body)}</p><p><a href="${escapeHtml(membershipUrl)}" style="display:inline-block;background:#f5d20a;color:#111;padding:14px 20px;text-decoration:none;font-weight:bold">Explore MTC memberships</a></p><hr style="border:0;border-top:1px solid #ddd;margin-top:30px"><p style="font-size:12px;color:#555">You are receiving this because you opted in to MTC marketing. <a href="${escapeHtml(unsubscribeUrl)}">Unsubscribe</a></p></div></body></html>`;
  const text = `${greeting}\n\n${content.title}\n\n${content.body}\n\nExplore memberships: ${membershipUrl}\n\nUnsubscribe: ${unsubscribeUrl}`;
  return { subject: content.subject, html, text };
}
