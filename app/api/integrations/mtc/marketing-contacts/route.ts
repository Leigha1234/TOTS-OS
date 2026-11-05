import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

const validEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const validUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );

function authorised(req: NextRequest, secret: string): boolean {
  const token =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";

  const a = Buffer.from(token);
  const b = Buffer.from(secret);

  return a.length === b.length && timingSafeEqual(a, b);
}

type ContactInput = {
  mtc_user_id?: unknown;
  email?: unknown;
  name?: unknown;
  marketing_opt_in?: unknown;
  trial_claimed_at?: unknown;
};

export async function POST(req: NextRequest) {
  const secret = process.env.TOTS_MTC_INTEGRATION_SECRET;
  const org = process.env.TOTS_MTC_ORGANISATION_ID;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret || !org || !url || !key) {
    return json({ error: "Integration not configured" }, 503);
  }

  if (!authorised(req, secret)) {
    return json({ error: "Unauthorized" }, 401);
  }

  let payload: ContactInput;

  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const userId =
    typeof payload.mtc_user_id === "string"
      ? payload.mtc_user_id.trim()
      : "";

  const email =
    typeof payload.email === "string"
      ? payload.email.trim().toLowerCase()
      : "";

  const name =
    typeof payload.name === "string"
      ? payload.name.trim().slice(0, 200)
      : "";

  if (!validUuid(userId) || !validEmail(email) || email.length > 254) {
    return json({ error: "Invalid user ID or email" }, 400);
  }

  const trialClaimedAt =
    typeof payload.trial_claimed_at === "string" &&
    Number.isFinite(Date.parse(payload.trial_claimed_at))
      ? new Date(payload.trial_claimed_at).toISOString()
      : null;

  if (!trialClaimedAt) {
    return json({ error: "Missing valid trial_claimed_at" }, 400);
  }

  const db = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  // A withdrawal must also suppress an already-synced contact. Simply
  // skipping this payload would leave an old ORBI marketing record active.
  if (payload.marketing_opt_in !== true) {
    try {
      const { data: linked, error: linkError } = await db
        .from("mtc_marketing_contact_links")
        .select("contact_id")
        .eq("organisation_id", org)
        .eq("mtc_user_id", userId)
        .maybeSingle();
      if (linkError) throw linkError;

      if (!linked?.contact_id) {
        return json({ synced: false, skipped: "no_marketing_permission" });
      }

      const { data: contact, error: contactError } = await db
        .from("contacts")
        .select("email")
        .eq("id", linked.contact_id)
        .eq("organisation_id", org)
        .maybeSingle();
      if (contactError) throw contactError;

      const emails = new Set<string>();
      if (contact?.email && validEmail(contact.email.trim())) {
        emails.add(contact.email.trim().toLowerCase());
      }
      if (email) emails.add(email);

      // Fail closed: if suppression cannot be recorded, do not report success.
      for (const suppressedEmail of emails) {
        const { error: suppressionError } = await db
          .from("campaign_unsubscribes")
          .upsert(
            {
              organisation_id: org,
              email: suppressedEmail,
              source: "mtc_marketing_permission_withdrawn",
              unsubscribed_at: new Date().toISOString(),
            },
            { onConflict: "organisation_id,email" }
          );
        if (suppressionError) throw suppressionError;
      }

      const { error: disableError } = await db
        .from("mtc_trial_marketing_lifecycle")
        .update({ sending_enabled: false, updated_at: new Date().toISOString() })
        .eq("organisation_id", org)
        .eq("mtc_user_id", userId);
      if (disableError) throw disableError;

      return json({ synced: true, action: "marketing_permission_withdrawn" });
    } catch (error) {
      console.error("MTC permission withdrawal sync failed:", error);
      return json({ error: "Marketing suppression failed" }, 500);
    }
  }

  async function processTrial(contactId: string) {
    // Existing records must never be reactivated by a contact sync.
    const { data: existingLifecycle, error: lifecycleLookupError } =
      await db
        .from("mtc_trial_marketing_lifecycle")
        .select("id")
        .eq("organisation_id", org)
        .eq("mtc_user_id", userId)
        .maybeSingle();

    if (lifecycleLookupError) {
      throw new Error("Trial lifecycle lookup failed");
    }

    if (existingLifecycle) {
      return "existing_preserved";
    }

    const { data: settings, error: settingsError } = await db
      .from("mtc_marketing_automation_settings")
      .select("trial_enrolment_starts_at,trial_enrolment_enabled")
      .eq("organisation_id", org)
      .maybeSingle();

    if (settingsError) {
      throw new Error("Automation settings lookup failed");
    }

    const started = Date.parse(trialClaimedAt!);
    const cutoff = settings
      ? Date.parse(settings.trial_enrolment_starts_at)
      : NaN;

    const eligibleByDate =
      settings?.trial_enrolment_enabled === true &&
      Number.isFinite(cutoff) &&
      started >= cutoff &&
      started <= Date.now() &&
      started >= Date.now() - 24 * 60 * 60 * 1000;

    let canEnrol = false;

    if (eligibleByDate) {
      const { data: unsubscribed, error: unsubscribeError } =
        await db
          .from("campaign_unsubscribes")
          .select("email")
          .eq("organisation_id", org)
          .ilike("email", email)
          .limit(1);

      if (unsubscribeError) {
        throw new Error("Unsubscribe lookup failed");
      }

      if (!unsubscribed?.length) {
        const eligibilityUrl =
          process.env.MTC_MARKETING_ELIGIBILITY_URL;

        if (eligibilityUrl && secret) {
          try {
            const result = await fetch(eligibilityUrl, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${secret}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ mtc_user_id: userId }),
              cache: "no-store",
              signal: AbortSignal.timeout(8000),
            });

            if (result.ok) {
              const eligibility = await result.json();
              canEnrol = eligibility?.eligible === true;
            }
          } catch {
            canEnrol = false;
          }
        }
      }
    }

    if (canEnrol) {
      const { data: enrolled, error: enrolmentError } =
        await db.rpc("enrol_new_mtc_trial", {
          p_organisation_id: org,
          p_mtc_user_id: userId,
          p_contact_id: contactId,
          p_trial_started_at: trialClaimedAt,
        });

      if (enrolmentError) {
        throw new Error("Trial enrolment failed");
      }

      if (enrolled === true) {
        return "new_trial_enrolled";
      }
    }

    // Preserve a disabled record for historical or ineligible trials.
    // Ignore duplicates so concurrent syncs cannot overwrite a record.
    const { error: insertError } = await db
      .from("mtc_trial_marketing_lifecycle")
      .upsert(
        {
          organisation_id: org,
          mtc_user_id: userId,
          contact_id: contactId,
          trial_started_at: trialClaimedAt,
          sending_enabled: false,
          status: "staged",
        },
        {
          onConflict: "organisation_id,mtc_user_id",
          ignoreDuplicates: true,
        }
      );

    if (insertError) {
      throw new Error("Trial lifecycle save failed");
    }

    return "trial_staged";
  }

  try {
    const { data: mapped, error: mappingError } = await db
      .from("mtc_marketing_contact_links")
      .select("contact_id")
      .eq("organisation_id", org)
      .eq("mtc_user_id", userId)
      .maybeSingle();

    if (mappingError) {
      return json({ error: "Mapping lookup failed" }, 500);
    }

    if (mapped?.contact_id) {
      const { error: updateError } = await db
        .from("contacts")
        .update({ name: name || null, email })
        .eq("id", mapped.contact_id)
        .eq("organisation_id", org);

      if (updateError) {
        return json({ error: "Contact update failed" }, 500);
      }

      const trialAction = await processTrial(mapped.contact_id);

      return json({
        synced: true,
        action: "updated",
        trial_action: trialAction,
      });
    }

    const { data: existing, error: findError } = await db
      .from("contacts")
      .select("id")
      .eq("organisation_id", org)
      .ilike("email", email)
      .limit(2);

    if (findError) {
      return json({ error: "Contact lookup failed" }, 500);
    }

    if ((existing ?? []).length > 1) {
      return json(
        { error: "Ambiguous existing contacts; manual reconciliation required" },
        409
      );
    }

    let contactId: string;

    if (existing?.length === 1) {
      contactId = existing[0].id;
    } else {
      const { data: created, error: createError } = await db
        .from("contacts")
        .insert({
          organisation_id: org,
          name: name || null,
          email,
        })
        .select("id")
        .single();

      if (createError || !created) {
        return json({ error: "Contact creation failed" }, 500);
      }

      contactId = created.id;
    }

    const { error: linkError } = await db
      .from("mtc_marketing_contact_links")
      .upsert(
        {
          organisation_id: org,
          mtc_user_id: userId,
          contact_id: contactId,
          last_synced_at: new Date().toISOString(),
        },
        {
          onConflict: "organisation_id,mtc_user_id",
        }
      );

    if (linkError) {
      return json({ error: "Contact linking failed" }, 500);
    }

    const trialAction = await processTrial(contactId);

    return json({
      synced: true,
      action: existing?.length ? "linked_existing" : "created",
      trial_action: trialAction,
    });
  } catch (error) {
    console.error("MTC marketing contact sync failed:", error);

    return json({ error: "Marketing contact sync failed" }, 500);
  }
}
