import type { SupabaseClient } from "@supabase/supabase-js";

async function allRows(query: any): Promise<any[]> {
  const rows: any[] = [];
  for (let offset = 0; ; offset += 500) {
    const result = await query.range(offset, offset + 499);
    if (result.error) throw new Error(result.error.message);
    rows.push(...(result.data || []));
    if ((result.data || []).length < 500) return rows;
    if (rows.length >= 50_000) throw new Error("Campaign audience exceeds the dispatch limit");
  }
}

export async function loadCampaignAudience(db: SupabaseClient, campaign: any): Promise<{ id: string; email: string; source: "profile" | "manual" }[]> {
  const [links, manual, suppressions] = await Promise.all([
    allRows(db.from("profile_subscriber_lists").select("profile_id,profiles(id,email,is_subscribed)").eq("organisation_id", campaign.organisation_id).eq("list_id", campaign.list_id).order("profile_id")),
    allRows(db.from("campaign_list_emails").select("id,email").eq("organisation_id", campaign.organisation_id).eq("list_id", campaign.list_id).order("id")),
    allRows(db.from("campaign_unsubscribes").select("email").eq("organisation_id", campaign.organisation_id).order("email")),
  ]);
  const suppressed = new Set(suppressions.map(row => String(row.email).trim().toLowerCase()));
  const recipients = new Map<string, { id: string; source: string }>();
  const add = (row: any, source: string) => {
    const email = String(row.email || "").trim().toLowerCase();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !suppressed.has(email) && !recipients.has(email)) recipients.set(email, { id: row.id, source });
  };
  for (const link of links) {
    const profile = Array.isArray(link.profiles) ? link.profiles[0] : link.profiles;
    if (profile && profile.is_subscribed !== false) add(profile, "profile");
  }
  for (const row of manual) add(row, "manual");
  return [...recipients].map(([email, recipient]) => ({ email, id: recipient.id, source: recipient.source as "profile" | "manual" }));
}

/** Prepare due schedules before the existing delivery worker runs.
 * Existing sent/failed delivery rows are preserved; retries remain explicit.
 * A campaign becomes processable only after all its queue rows are written.
 */
export async function dispatchDueCampaigns(db: SupabaseClient) {
  const due = await db.from("campaigns").select("id,organisation_id,list_id,scheduled_for")
    .eq("status", "queued").lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for").limit(5);
  if (due.error) throw new Error("Could not load due campaign schedules");
  for (const campaign of due.data || []) {
    try {
      const list = await db.from("subscriber_lists").select("id").eq("id", campaign.list_id).eq("organisation_id", campaign.organisation_id).maybeSingle();
      if (list.error || !list.data) throw new Error("Scheduled audience does not belong to this organisation");
      const audience = await loadCampaignAudience(db, campaign);
      const recipients = new Map(audience.map(row => [row.email, { id: row.id, source: row.source }]));
      if (!recipients.size) {
        const result = await db.from("campaigns").update({ status: "failed" }).eq("id", campaign.id).eq("organisation_id", campaign.organisation_id).eq("status", "queued");
        if (result.error) throw new Error(result.error.message);
        continue;
      }
      const rows = [...recipients].map(([email, recipient]) => ({
        campaign_id: campaign.id, organisation_id: campaign.organisation_id,
        recipient_id: recipient.id, recipient_source: recipient.source, email,
        status: "pending", attempts: 0, updated_at: new Date().toISOString(),
      }));
      for (let offset = 0; offset < rows.length; offset += 500) {
        const result = await db.from("campaign_deliveries").upsert(rows.slice(offset, offset + 500), { onConflict: "campaign_id,email", ignoreDuplicates: true });
        if (result.error) throw new Error(result.error.message);
      }
      const result = await db.from("campaigns").update({ status: "processing" }).eq("id", campaign.id)
        .eq("organisation_id", campaign.organisation_id).eq("status", "queued").eq("scheduled_for", campaign.scheduled_for);
      if (result.error) throw new Error(result.error.message);
    } catch (error) {
      // Fail closed: a failed queue preparation must not start delivery.
      console.error("Scheduled campaign preparation failed", campaign.id, error instanceof Error ? error.message : "Unknown error");
    }
  }
}

/** Recheck consent at delivery time, including after a schedule was queued. */
export async function canDeliverCampaignEmail(db: SupabaseClient, campaign: any, delivery: any): Promise<boolean> {
  if (delivery.organisation_id !== campaign.organisation_id || delivery.campaign_id !== campaign.id) return false;
  const address = String(delivery.email || "").trim().toLowerCase();
  const suppression = await db.from("campaign_unsubscribes").select("email").eq("organisation_id", campaign.organisation_id).eq("email", address).limit(1);
  if (suppression.error) throw new Error("Unable to verify unsubscribe status");
  if (suppression.data?.length) return false;
  if (delivery.recipient_source === "profile") {
    const [membership, profile] = await Promise.all([
      db.from("profile_subscriber_lists").select("profile_id").eq("organisation_id", campaign.organisation_id).eq("list_id", campaign.list_id).eq("profile_id", delivery.recipient_id).limit(1),
      db.from("profiles").select("email,is_subscribed").eq("id", delivery.recipient_id).eq("organisation_id", campaign.organisation_id).maybeSingle(),
    ]);
    if (membership.error || profile.error) throw new Error("Unable to verify recipient consent");
    return Boolean(membership.data?.length && profile.data && profile.data.is_subscribed !== false && String(profile.data.email).trim().toLowerCase() === address);
  }
  if (delivery.recipient_source === "manual") {
    const result = await db.from("campaign_list_emails").select("email").eq("organisation_id", campaign.organisation_id).eq("list_id", campaign.list_id).eq("id", delivery.recipient_id).maybeSingle();
    if (result.error) throw new Error("Unable to verify recipient membership");
    return Boolean(result.data && String(result.data.email).trim().toLowerCase() === address);
  }
  return false;
}
