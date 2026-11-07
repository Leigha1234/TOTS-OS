import type { SupabaseClient } from "@supabase/supabase-js";

export type WorkerCampaign = Record<string, unknown> & {
  id: string;
  organisation_id: string | null;
  list_id: string | null;
  title: string | null;
  subject: string | null;
  sender_name: string | null;
  reply_to: string | null;
};

export const approvalRequired = "Client approval is required. Save a draft and open Client approvals.";
export const approvalError = (error: { code?: string } | null) => error?.code === "P0421";

export async function needsApproval(db: SupabaseClient, org: string, actor: string) {
  const { data, error } = await db.rpc("orbi_approval_needed", { p_org: org, p_actor: actor });
  if (error || typeof data !== "boolean") throw new Error("Could not verify client approval policy.");
  return data;
}

export async function releaseAllowed(db: SupabaseClient, kind: "email" | "social", row: object, actor: string) {
  const { data, error } = await db.rpc("orbi_release_allowed", { p_kind: kind, p_row: row, p_actor: actor });
  if (error || typeof data !== "boolean") throw new Error("Could not verify client approval.");
  return data;
}

export async function workerMayRelease(db: SupabaseClient, kind: "email" | "social", row: object, status: string) {
  const { data, error } = await db.rpc("orbi_check_worker", { p_kind: kind, p_row: row, p_status: status });
  if (error || typeof data !== "boolean") throw new Error("Could not verify worker approval.");
  return data;
}
