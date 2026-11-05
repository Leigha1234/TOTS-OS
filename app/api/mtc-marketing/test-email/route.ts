import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { Resend } from "resend";
import { buildEmail } from "@/lib/mtc-marketing/trial-email";
import { createCampaignUnsubscribeToken } from "@/lib/campaign-unsubscribe-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEST_EMAIL = "leigha0305@gmail.com";

function secureEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);

  return x.length === y.length && timingSafeEqual(x, y);
}

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "") ?? "";

  if (!secret || !secureEqual(provided, secret)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MTC_RESEND_FROM_EMAIL;
  const bookingUrl = process.env.MTC_BOOKING_URL;
  const organisationId = process.env.TOTS_MTC_ORGANISATION_ID;

  if (!apiKey || !from || !bookingUrl || !organisationId) {
    return NextResponse.json(
      { error: "Missing email configuration" },
      { status: 503 }
    );
  }

  const token = createCampaignUnsubscribeToken({
    campaignId: "mtc-trial-test",
    organisationId,
    listId: "mtc-trial-automation",
    email: TEST_EMAIL,
    source: "manual",
    recipientId: "mtc-test-recipient",
  });

  const unsubscribeUrl =
    `https://www.tots-os.co.uk/api/campaigns/unsubscribe?token=${encodeURIComponent(token)}`;

  const content = buildEmail(
    "day_7",
    unsubscribeUrl,
    bookingUrl
  );

  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from,
    to: TEST_EMAIL,
    subject: `[TEST] ${content.subject}`,
    html: content.html,
  });

  if (error || !data?.id) {
    return NextResponse.json(
      { error: error?.message ?? "Email send failed" },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    recipient: TEST_EMAIL,
    message_id: data.id,
  });
}
