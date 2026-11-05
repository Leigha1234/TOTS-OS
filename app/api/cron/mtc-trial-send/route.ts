import { buildEmail } from "@/lib/mtc-marketing/trial-email";
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

  // Fail closed: delivery requires an explicit global switch, an organisation
  // enrolment switch, and an explicitly configured test recipient allowlist.
  // This stage deliberately does NOT permit unrestricted production sending.
  const enabled = process.env.MTC_TRIAL_EMAIL_SENDING_ENABLED === "true";
  const testEmails = new Set(
    (process.env.MTC_TRIAL_TEST_RECIPIENTS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  );

  const { data: settings, error: settingsError } = await db
    .from("mtc_marketing_automation_settings")
    .select("trial_enrolment_enabled,trial_enrolment_starts_at")
    .eq("organisation_id", org)
    .maybeSingle();

  if (settingsError) {
    return response({ error: "Automation settings query failed" }, 500);
  }

  const enrolmentStart = settings?.trial_enrolment_starts_at
    ? Date.parse(settings.trial_enrolment_starts_at)
    : NaN;
  const orgEnabled = settings?.trial_enrolment_enabled === true
    && Number.isFinite(enrolmentStart)
    && enrolmentStart <= Date.now();

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
    .gte("scheduled_at", new Date(Date.now() - DAY).toISOString())
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(50);

  if (deliveryError) {
    return response({ error: "Delivery query failed" }, 500);
  }

  for (const delivery of deliveries ?? []) {
    counts.inspected++;

    // Do not send emails more than 24 hours after their scheduled time.
    const scheduledTime = Date.parse(delivery.scheduled_at);

    if (
      !Number.isFinite(scheduledTime) ||
      scheduledTime < Date.now() - DAY
    ) {
      counts.not_due++;
      continue;
    }

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
    if (!Number.isFinite(started) || started < Date.now() - 14 * DAY || started < enrolmentStart) {
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
    if (!testEmails.has(email)) {
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
    recipient_scope: "configured_test_allowlist_only",
    organisation_enrolment_enabled: orgEnabled,
    allowlist_configured: testEmails.size > 0,
    emails_sent: counts.sent,
    ...counts,
  });
}
