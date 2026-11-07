import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isUuid, requireAgencyEmailAccess } from "@/lib/agency-email-access";
import { requireAgencySocialAccess } from "@/lib/agency-social-access";
import { approvalError, approvalRequired, needsApproval } from "@/lib/orbi-approval-gate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const reply = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
const fail = (error: string, status: number) => reply({ error }, status);

async function handle(req: NextRequest) {
  const body = req.method === "POST" ? await req.json().catch(() => null) : {
    organisationId: req.nextUrl.searchParams.get("organisationId"),
    kind: req.nextUrl.searchParams.get("kind"),
    previewId: req.nextUrl.searchParams.get("previewId"),
    action: "list",
  };
  const { organisationId, kind, action, draftId, reviewId, feedback, previewId } = body || {};
  if (!isUuid(organisationId) || (kind !== "email" && kind !== "social") ||
      (req.method === "POST" && !["request", "approved", "changes_requested", "policy", "schedule_email"].includes(action))) {
    return fail("Invalid approval request", 400);
  }
  const header = req.headers.get("authorization");
  const token = header?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return fail("Sign in to view approvals", 401);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) return fail("Server configuration missing", 500);
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const { data: { user }, error: authError } = await createClient(url, anon, options).auth.getUser(token);
  if (authError || !user) return fail("Sign in to view approvals", 401);
  const db = createClient(url, service, options);
  const { data: org, error: orgError } = await db.from("organisations")
    .select("name,created_by").eq("id", organisationId).maybeSingle();
  if (orgError) return fail("Could not verify organisation access", 500);
  if (!org) return fail("Organisation access not granted", 403);
  const owner = org.created_by === user.id;
  const access = kind === "email" ? requireAgencyEmailAccess : requireAgencySocialAccess;

  if (action === "policy") {
    if (!owner) return fail("Only the client owner can change approval rules.", 403);
    const { userId, required } = body;
    if (!isUuid(userId) || userId === user.id || typeof required !== "boolean") return fail("Enter a valid staff user ID.", 400);
    const result = required
      ? await db.from("orbi_approval_required").insert({ organisation_id: organisationId, user_id: userId })
      : await db.from("orbi_approval_required").delete().eq("organisation_id", organisationId).eq("user_id", userId);
    if (result.error?.code === "23503") return fail("That ORBI. user ID was not found.", 404);
    if (result.error && result.error.code !== "23505") return fail("Could not save the approval rule.", 500);
    return reply({ success: true });
  }

  if (action === "schedule_email") {
    if (kind !== "email" || !isUuid(draftId)) return fail("Choose a saved email draft.", 400);
    const send = await requireAgencyEmailAccess(header, organisationId, "send");
    if (!send.ok) return fail(send.error, send.status);
    const when = typeof body.scheduledFor === "string" ? Date.parse(body.scheduledFor) : NaN;
    if (!Number.isFinite(when) || when < Date.now() + 60_000) return fail("Choose a future schedule time.", 400);
    const draft = await db.from("campaigns").select("id,list_id,subject,content,custom_html")
      .eq("organisation_id", organisationId).eq("id", draftId).eq("status", "draft").maybeSingle();
    if (draft.error) return fail("Could not load draft.", 500);
    if (!draft.data?.list_id || !draft.data.subject?.trim() || !(draft.data.content?.trim() || draft.data.custom_html?.trim())) {
      return fail("Save a draft with a subject, content and audience first.", 400);
    }
    const audience = await db.from("subscriber_lists").select("id").eq("organisation_id", organisationId).eq("id", draft.data.list_id).maybeSingle();
    if (audience.error) return fail("Could not verify audience.", 500);
    if (!audience.data) return fail("The audience must belong to this client.", 400);
    const queued = await db.from("campaigns").update({
      status: "queued", scheduled_for: new Date(when).toISOString(), orbi_release_actor: user.id,
    }).eq("organisation_id", organisationId).eq("id", draftId).eq("status", "draft")
      .eq("list_id", draft.data.list_id).select("id").maybeSingle();
    if (approvalError(queued.error)) return fail(approvalRequired, 409);
    if (queued.error) return fail("Could not schedule this draft.", 500);
    return queued.data ? reply(queued.data) : fail("Draft changed. Refresh and try again.", 409);
  }

  if (action === "list") {
    let canRequest = false;
    if (!owner) {
      const view = await access(header, organisationId, "view");
      if (!view.ok) return fail(view.error, view.status);
    }
    if (previewId != null) {
      if (!isUuid(previewId)) return fail("Invalid review", 400);
      const { data, error } = await db.from("orbi_client_reviews").select("snapshot")
        .eq("organisation_id", organisationId).eq("kind", kind).eq("id", previewId).maybeSingle();
      if (error) return fail("Could not open the draft preview", 500);
      return data ? reply(data) : fail("Review not found", 404);
    }
    if (!owner) {
      const edit = await access(header, organisationId, "edit");
      if (!edit.ok && edit.status !== 403) return fail(edit.error, edit.status);
      canRequest = edit.ok;
    }
    const { data, error } = await db.rpc("orbi_review_inbox", {
      p_org: organisationId, p_kind: kind, p_include_drafts: canRequest,
    });
    if (error) {
      console.error("[client approvals inbox]", error.code);
      return fail("Could not load client approvals", 500);
    }
    const release = kind === "email"
      ? await requireAgencyEmailAccess(header, organisationId, "send")
      : await requireAgencySocialAccess(header, organisationId, "publish");
    if (!release.ok && release.status !== 403) return fail(release.error, release.status);
    const policies = owner ? await db.from("orbi_approval_required").select("user_id").eq("organisation_id", organisationId) : null;
    if (policies?.error) return fail("Could not load approval rules.", 500);
    return reply({ ...data, organisationName: org.name, owner, canRequest, canRelease: release.ok && !owner,
      userId: user.id, required: await needsApproval(db, organisationId, user.id),
      requiredUsers: (policies?.data ?? []).map(row => row.user_id) });
  }

  if (action === "request") {
    if (owner) return fail("The client owner reviews drafts. Ask your agency to submit one.", 403);
    if (!isUuid(draftId)) return fail("Choose a saved draft", 400);
    for (const permission of ["view", "edit"] as const) {
      const result = await access(header, organisationId, permission);
      if (!result.ok) return fail(result.error, result.status);
    }
  } else {
    if (!owner) return fail("Only the client owner can decide this review", 403);
    if (!isUuid(reviewId)) return fail("Invalid review", 400);
    if (feedback != null && (typeof feedback !== "string" || feedback.length > 2000)) {
      return fail("Feedback must be 2,000 characters or fewer", 400);
    }
    if (action === "changes_requested" && !feedback?.trim()) {
      return fail("Describe the changes you would like", 400);
    }
  }

  const { data, error } = await db.rpc("orbi_review_action", {
    p_org: organisationId, p_kind: kind, p_actor: user.id, p_action: action,
    p_draft: action === "request" ? draftId : null,
    p_review: action === "request" ? null : reviewId,
    p_feedback: action === "request" ? null : feedback?.trim() || null,
  });
  if (error) {
    if (error.code === "P0001") return fail(error.message, 409);
    if (error.code === "42501") return fail("You cannot decide this review", 403);
    if (error.code === "22023") return fail("Invalid review request", 400);
    console.error("[client approvals action]", error.code);
    return fail("Could not save the review", 500);
  }
  return reply({ id: data });
}

async function run(req: NextRequest) {
  try { return await handle(req); }
  catch (error) {
    console.error("[client approvals]", error instanceof Error ? error.message : "Unexpected error");
    return fail("Client approvals are temporarily unavailable", 500);
  }
}

export const GET = run;
export const POST = run;
