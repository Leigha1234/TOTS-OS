import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { timingSafeEqual } from "node:crypto";
import { createCampaignUnsubscribeToken } from "@/lib/campaign-unsubscribe-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY = 86_400_000;

function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

function response(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const replacements: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return replacements[char];
  });
}

const emailContent: Record<
  string,
  { subject: string; heading: string; message: string; button: string }
> = {
  welcome: {
    subject: "Welcome to Moray Training Club! 💛",
    heading: "YOUR FIRST WEEK STARTS HERE.",
    message:
      "Welcome to the MTC community! Your seven-day trial is your chance to explore our classes, meet the coaches and discover what makes our gym different. Book your first session and come say hello!",
    button: "BOOK YOUR FIRST CLASS",
  },
  day_5: {
    subject: "How's your first week at MTC going?",
    heading: "FIND YOUR STRONG.",
    message:
      "You've nearly completed your first week at MTC! Whether you've tried CrossFit, HYROX or something completely different, we'd love to help you keep building momentum. Need help choosing a membership? Just ask our team.",
    button: "EXPLORE MEMBERSHIPS",
  },
  day_7: {
    subject: "Your MTC trial is ending — here's £10 off 💛",
    heading: "THIS IS JUST THE BEGINNING.",
    message:
      "Your free trial is coming to an end. We'd love you to stay! Use code WELCOME10 to get £10 off your monthly membership, subject to the offer's terms and eligibility.",
    button: "BECOME A MEMBER",
  },
  day_10: {
    subject: "We'd love to see you back at MTC!",
    heading: "YOUR PLACE IS WAITING.",
    message:
      "Your trial has finished, but your journey doesn't have to. Join the MTC community and use WELCOME10 for £10 off your monthly membership, subject to the offer's terms and eligibility.",
    button: "JOIN THE CLUB",
  },
};

function buildEmail(
  step: string,
  unsubscribeUrl: string,
  bookingUrl: string
) {
  const content = emailContent[step];

  if (!content) throw new Error("Unknown email step");

  const safeUrl = escapeHtml(bookingUrl);
  const safeUnsubscribe = escapeHtml(unsubscribeUrl);

  return {
    subject: content.subject,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </head>
      <body style="margin:0;padding:30px 12px;background:#101010;font-family:Arial,sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr><td align="center">
            <table role="presentation" width="100%" style="max-width:560px;background:#191919;">
              <tr>
                <td style="padding:35px;text-align:center;background:#f5d900;">
                  <h1 style="margin:0;color:#111;font-size:27px;letter-spacing:2px;">
                    MORAY TRAINING CLUB
                  </h1>
                </td>
              </tr>
              <tr>
                <td style="padding:42px 30px;text-align:center;">
                  <h2 style="color:#f5d900;font-size:29px;line-height:1.2;">
                    ${escapeHtml(content.heading)}
                  </h2>
                  <p style="color:#eee;font-size:16px;line-height:1.8;">
                    ${escapeHtml(content.message)}
                  </p>
                  <a href="${safeUrl}"
                     style="display:inline-block;margin-top:20px;padding:16px 26px;background:#f5d900;color:#111;text-decoration:none;font-weight:bold;">
                    ${escapeHtml(content.button)}
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding:24px;text-align:center;background:#111;color:#aaa;font-size:12px;">
                  Moray Training Club<br /><br />
                  <a href="${safeUnsubscribe}" style="color:#f5d900;">
                    Unsubscribe from marketing emails
                  </a>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  };
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const org = process.env.TOTS_MTC_ORGANISATION_ID;
  const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const dbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const integrationSecret = process.env.TOTS_MTC_INTEGRATION_SECRET;
  const eligibilityUrl = process.env.MTC_MARKETING_ELIGIBILITY_URL;

  if (
    !secret ||
    !org ||
    !dbUrl ||
    !dbKey ||
    !integrationSecret ||
    !eligibilityUrl
  ) {
    return response({ error: "Missing configuration" }, 503);
  }

  const bearer =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";

  if (!same(bearer, secret)) {
    return response({ error: "Unauthorized" }, 401);
  }

  const db = createClient(dbUrl, dbKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Production sending is disabled until explicitly enabled.
  const enabled = process.env.MTC_TRIAL_EMAIL_SENDING_ENABLED === "true";

  // Even when enabled, only this address can receive emails initially.
  const testEmail = "leigha0305@gmail.com";

  const counts = {
    inspected: 0,
    disabled: 0,
    not_due: 0,
    blocked: 0,
    suppressed: 0,
    eligible: 0,
    sent: 0,
    failed: 0,
  };

  const { data: deliveries, error: deliveryError } = await db
    .from("mtc_trial_email_deliveries")
    .select("id,organisation_id,mtc_user_id,email_step,status,scheduled_at")
    .eq("organisation_id", org)
    .eq("status", "pending")
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(50);

  if (deliveryError) {
    return response({ error: "Delivery query failed" }, 500);
  }

  for (const delivery of deliveries ?? []) {
    counts.inspected++;

    const { data: lifecycle, error: lifecycleError } = await db
      .from("mtc_trial_marketing_lifecycle")
      .select(
        "contact_id,trial_started_at,sending_enabled,status,paid_membership_confirmed"
      )
      .eq("organisation_id", org)
      .eq("mtc_user_id", delivery.mtc_user_id)
      .maybeSingle();

    if (lifecycleError || !lifecycle) {
      counts.blocked++;
      continue;
    }

    if (
      !lifecycle.sending_enabled ||
      lifecycle.status !== "staged" ||
      lifecycle.paid_membership_confirmed
    ) {
      counts.disabled++;
      continue;
    }

    const started = Date.parse(lifecycle.trial_started_at);

    // Never send this sequence to historical trials.
    if (!Number.isFinite(started) || started < Date.now() - 14 * DAY) {
      counts.blocked++;
      continue;
    }

    const { data: contact, error: contactError } = await db
      .from("contacts")
      .select("email")
      .eq("id", lifecycle.contact_id)
      .eq("organisation_id", org)
      .maybeSingle();

    if (contactError || !contact?.email) {
      counts.blocked++;
      continue;
    }

    const email = contact.email.trim().toLowerCase();

    // Test allowlist: no other recipient can be emailed.
    if (email !== testEmail) {
      counts.blocked++;
      continue;
    }

    const { data: unsubscribes, error: unsubscribeError } = await db
      .from("campaign_unsubscribes")
      .select("email")
      .eq("organisation_id", org)
      .ilike("email", email)
      .limit(1);

    if (unsubscribeError) {
      counts.blocked++;
      continue;
    }

    if (unsubscribes?.length) {
      counts.suppressed++;
      continue;
    }

    let eligible = false;

    try {
      const result = await fetch(eligibilityUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${integrationSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mtc_user_id: delivery.mtc_user_id }),
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });

      if (result.ok) {
        const payload = await result.json();
        eligible = payload?.eligible === true;
      }
    } catch {
      eligible = false;
    }

    if (!eligible) {
      counts.blocked++;
      continue;
    }

    counts.eligible++;

    if (!enabled) continue;

    const { data: claimed, error: claimError } = await db.rpc(
      "claim_mtc_trial_email",
      {
        p_delivery_id: delivery.id,
        p_organisation_id: org,
      }
    );

    if (claimError || claimed !== true) continue;

    try {
      const resendKey = process.env.RESEND_API_KEY;
      const fromEmail = process.env.MTC_RESEND_FROM_EMAIL;
      const bookingUrl = process.env.MTC_BOOKING_URL;

      if (!resendKey || !fromEmail || !bookingUrl) {
        throw new Error("MTC email configuration missing");
      }

      const resend = new Resend(resendKey);

      // Use the existing signed unsubscribe token format.
      // This is organisation-scoped, not dependent on an actual campaign row.
      const token = createCampaignUnsubscribeToken({
        campaignId: `mtc-trial-${delivery.email_step}`,
        organisationId: org,
        listId: "mtc-trial-automation",
        email,
        source: "manual",
        recipientId: delivery.mtc_user_id,
      });

      const unsubscribeUrl =
        `https://www.tots-os.co.uk/api/campaigns/unsubscribe?token=${encodeURIComponent(token)}`;

      const content = buildEmail(
        delivery.email_step,
        unsubscribeUrl,
        bookingUrl
      );

      const { data, error } = await resend.emails.send(
        {
          from: fromEmail,
          to: email,
          subject: content.subject,
          html: content.html,
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
          },
        },
        {
          idempotencyKey: `mtc-trial/${delivery.id}`,
        }
      );

      if (error || !data?.id) {
        throw new Error(error?.message || "Resend did not return a message ID");
      }

      const { error: updateError } = await db
        .from("mtc_trial_email_deliveries")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          resend_message_id: data.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", delivery.id)
        .eq("status", "sending");

      if (updateError) throw updateError;

      counts.sent++;
    } catch (error) {
      console.error("MTC trial email delivery failed:", error);

      // Leave the claimed delivery in 'sending' for manual investigation.
      // Automatically resetting it could cause a duplicate email.
      counts.failed++;
    }
  }

  return response({
    dry_run: !enabled,
    recipient_scope: "single_test_email",
    emails_sent: counts.sent,
    ...counts,
  });
}
