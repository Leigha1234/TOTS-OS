import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isUuid, requireAgencyEmailAccess } from "@/lib/agency-email-access";
import { requireAgencySocialAccess } from "@/lib/agency-social-access";

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
      (req.method === "POST" && !["request", "approved", "changes_requested"].includes(action))) {
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
    return reply({ ...data, organisationName: org.name, owner, canRequest });
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
