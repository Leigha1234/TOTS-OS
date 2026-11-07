"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useActiveAgencyContext } from "@/lib/use-active-agency-context";

type Kind = "email" | "social";
type Review = {
  id: string; draft_id: string; version: number; summary: Record<string, unknown>;
  status: "pending" | "approved" | "changes_requested" | "superseded";
  feedback: string | null; current_version: boolean; editable: boolean;
};
type Inbox = {
  organisationName: string; owner: boolean; canRequest: boolean; canRelease: boolean;
  userId: string; required: boolean; requiredUsers: string[];
  drafts: { id: string; label: string }[]; reviews: Review[];
};
const card = "rounded-2xl border border-[#E0E8E1] bg-white p-5 shadow-sm sm:p-6";
const primary = "rounded-xl bg-[#103D31] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#185340] disabled:opacity-50";
const secondary = "rounded-xl border border-[#CCDAD0] px-4 py-2.5 text-sm font-semibold text-[#103D31] hover:bg-[#F3F7F3] disabled:opacity-50";
const field = "w-full rounded-xl border border-[#CCDAD0] bg-white p-3 text-sm";
const value = (v: unknown) => typeof v === "string" ? v : "";

async function approvalRequest(organisationId: string, kind: Kind, action?: object, signal?: AbortSignal, previewId?: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Sign in to ORBI. to view client approvals.");
  const query = new URLSearchParams({ organisationId, kind });
  if (previewId) query.set("previewId", previewId);
  const response = await fetch(`/api/agency/approvals?${query}`, {
    method: action ? "POST" : "GET", cache: "no-store", signal,
    headers: { Authorization: `Bearer ${session.access_token}`, ...(action && { "Content-Type": "application/json" }) },
    body: action ? JSON.stringify({ organisationId, kind, ...action }) : undefined,
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result) throw new Error(result?.error || "Could not load client approvals.");
  return result;
}

async function releaseDraft(organisationId: string, kind: Kind, draftId: string, scheduledFor?: string) {
  if (kind === "email" && scheduledFor) return approvalRequest(organisationId, kind, { action: "schedule_email", draftId, scheduledFor });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Sign in to ORBI. to release this draft.");
  const response = await fetch(kind === "email" ? "/api/campaigns/send" : "/api/agency/social/schedule", {
    method: "POST", cache: "no-store",
    headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify(kind === "email" ? { organisationId, campaignId: draftId } :
      { organisationId, draftId, scheduledFor: scheduledFor ?? new Date(Date.now() + 120_000).toISOString() }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || "Could not release this draft.");
  return result;
}

function ReviewPreview({ kind, snapshot }: { kind: Kind; snapshot: Record<string, unknown> }) {
  if (kind === "email") {
    const html = (snapshot.editor_mode === "html" ? value(snapshot.custom_html) : "")
      || value(snapshot.content) || value(snapshot.custom_html);
    // No scripts, forms, external styles or remote images in the review iframe.
    const policy = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'">`;
    return <div className="space-y-2">
      <p><strong>Subject:</strong> {value(snapshot.subject) || "No subject"}</p>
      {value(snapshot.preview_text) && <p><strong>Preview text:</strong> {value(snapshot.preview_text)}</p>}
      {value(snapshot.sender_name) && <p><strong>Sender:</strong> {value(snapshot.sender_name)}</p>}
      {value(snapshot.reply_to) && <p><strong>Reply to:</strong> {value(snapshot.reply_to)}</p>}
      {html && <><iframe title="Email draft preview" className="pointer-events-none h-80 w-full rounded-xl border bg-white" sandbox="" tabIndex={-1} referrerPolicy="no-referrer" srcDoc={policy + html} />
        <p className="text-xs text-[#526B60]">Remote images are hidden in this preview.</p></>}
    </div>;
  }
  const media = [...new Set([
    ...(Array.isArray(snapshot.media_urls) ? snapshot.media_urls : []), snapshot.media_url,
  ].map(value).filter(url => {
    try { return new URL(url).protocol === "https:"; } catch { return false; }
  }))];
  return <div className="space-y-2">
    <p className="capitalize"><strong>Platform:</strong> {value(snapshot.platform)}</p>
    <p className="whitespace-pre-wrap break-words">{value(snapshot.caption)}</p>
    {value(snapshot.hashtags) && <p className="whitespace-pre-wrap break-words">{value(snapshot.hashtags)}</p>}
    {media.length > 0 && <ul className="flex flex-wrap gap-3">
      {media.map((url, i) => <li key={url}><a className="underline" href={url} target="_blank" rel="noopener noreferrer">Open attachment {i + 1}</a></li>)}
    </ul>}
  </div>;
}

function SubmittedDraft({ organisationId, kind, reviewId }: { organisationId: string; kind: Kind; reviewId: string }) {
  const [snapshot, setSnapshot] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    approvalRequest(organisationId, kind, undefined, controller.signal, reviewId)
      .then(result => { if (!controller.signal.aborted) setSnapshot(result.snapshot); })
      .catch(err => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, [organisationId, kind, reviewId]);
  if (error) return <p role="alert">{error}</p>;
  return snapshot ? <ReviewPreview kind={kind} snapshot={snapshot} /> : <p role="status">Loading draft…</p>;
}

function ReviewItem({ review, organisationId, kind, owner, busy, canRelease, decide, release }: {
  review: Review; organisationId: string; kind: Kind; owner: boolean; busy: boolean;
  canRelease: boolean;
  decide: (action: "approved" | "changes_requested", feedback: string) => void;
  release: (scheduledFor?: string) => void;
}) {
  const [feedback, setFeedback] = useState("");
  const [scheduled, setScheduled] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const label = !review.current_version ? "Draft changed · review needed" :
    review.status === "pending" ? "Awaiting client" :
    review.status === "approved" ? "Approved" :
    review.status === "changes_requested" ? "Changes requested" : "Superseded";
  const title = (kind === "email"
    ? value(review.summary.title) || value(review.summary.subject)
    : value(review.summary.caption)) || "Untitled draft";
  return <article className={card}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs text-[#526B60]">Version {review.version}</p><h2 className="mt-1 break-words text-lg font-semibold">{title}</h2></div>
      <span className="rounded-full bg-[#EDF3EE] px-3 py-1 text-xs font-semibold">{label}</span>
    </div>
    {!review.current_version && <p className="mt-3 text-sm">This decision or request applies to the earlier draft. Submit the updated draft for a new review.</p>}
    {review.feedback && <p className="mt-4 whitespace-pre-wrap break-words rounded-xl bg-[#F5F2E9] p-3 text-sm"><strong>Client feedback: </strong>{review.feedback}</p>}
    <details className="mt-4 text-sm" onToggle={event => setPreviewOpen(event.currentTarget.open)}>
      <summary className="cursor-pointer font-semibold">View submitted draft</summary>
      {previewOpen && <div className="mt-3"><SubmittedDraft organisationId={organisationId} kind={kind} reviewId={review.id} /></div>}
    </details>
    {owner && review.status === "pending" && review.current_version && review.editable && <div className="mt-5 space-y-3">
      <label className="block text-sm font-medium">Feedback
        <textarea className={field + " mt-1"} value={feedback} maxLength={2000} onChange={e => setFeedback(e.target.value)} placeholder="Describe what needs changed, or add an optional note to your approval." />
      </label>
      <div className="flex flex-wrap gap-2">
        <button className={primary} disabled={busy} onClick={() => decide("approved", feedback)}>Approve</button>
        <button className={secondary} disabled={busy || !feedback.trim()} onClick={() => decide("changes_requested", feedback)}>Request changes</button>
      </div>
    </div>}
    {canRelease && review.status === "approved" && review.current_version && review.editable && <div className="mt-5 space-y-2">
      <label className="block text-sm font-medium">Schedule time (your local time)
        <input type="datetime-local" className={field + " mt-1"} value={scheduled} onChange={e => setScheduled(e.target.value)} />
      </label>
      <div className="flex flex-wrap gap-2">
        <button className={secondary} disabled={busy || !Number.isFinite(Date.parse(scheduled))}
          onClick={() => release(new Date(scheduled).toISOString())}>Schedule approved draft</button>
        <button className={primary} disabled={busy}
          onClick={() => { if (window.confirm("Queue this approved version for delivery?")) release(); }}>
          {kind === "email" ? "Send approved email" : "Queue approved post"}
        </button>
      </div>
    </div>}
  </article>;
}

function InboxPanel({ organisationId, kind }: { organisationId: string; kind: Kind }) {
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [draftId, setDraftId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    approvalRequest(organisationId, kind, undefined, controller.signal)
      .then(data => { if (!controller.signal.aborted) setInbox(data); })
      .catch(err => { if (!controller.signal.aborted) { setInbox(null); setError(err.message); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [organisationId, kind, revision]);
  async function act(action: object | (() => Promise<unknown>), success: string) {
    setBusy(true); setError(""); setNotice("");
    try {
      await (typeof action === "function" ? action() : approvalRequest(organisationId, kind, action));
      setDraftId("");
      setNotice(success);
      setLoading(true);
      setRevision(n => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the review.");
      setLoading(true);
      setRevision(n => n + 1);
    } finally { setBusy(false); }
  }
  async function copyLink() {
    const link = new URL("/client-approvals", window.location.origin);
    link.search = new URLSearchParams({ organisationId, kind }).toString();
    try { await navigator.clipboard.writeText(link.href); setNotice("Client review link copied."); }
    catch { setError("Could not copy. Open the client review link and copy its address."); }
  }
  const reviewHref = `/client-approvals?${new URLSearchParams({ organisationId, kind })}`;
  return <div className="space-y-4">
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {notice && <p role="status" className="rounded-xl bg-[#EDF3EE] p-3 text-sm">{notice}</p>}
    {loading ? <p role="status">Loading reviews…</p> : !inbox ? <div className="flex flex-wrap gap-3">
      <Link href="/login" target="_blank" rel="noopener noreferrer" className={secondary}>Sign in to ORBI.</Link>
      <button className={secondary} onClick={() => { setError(""); setRevision(n => n + 1); }}>Try again</button>
    </div> : <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">{inbox.organisationName} · {inbox.owner ? "Client view" : "Agency view"}</p>
        <button className={secondary} disabled={busy} onClick={() => { setError(""); setRevision(n => n + 1); }}>Refresh</button>
      </div>
      {inbox.owner ? <section className={card + " space-y-3"}>
        <h2 className="font-semibold">Staff approval rules</h2>
        <p className="text-sm">Applies to email and social for this client. Staff not listed can still request approval and keep their existing permissions.</p>
        <form className="space-y-2" onSubmit={e => {
          e.preventDefault();
          void act({ action: "policy", userId: staffId.trim(), required: true }, "Approval now required for this staff member.");
        }}>
          <label className="block text-sm">Staff ORBI. user ID
            <input required className={field + " mt-1"} value={staffId} onChange={e => setStaffId(e.target.value)} />
          </label>
          <button disabled={busy || !staffId.trim()} className={primary}>Require approval</button>
        </form>
        {inbox.requiredUsers.map(userId => <div key={userId} className="flex flex-wrap items-center gap-2 text-sm">
          <code>{userId}</code>
          <button disabled={busy} className={secondary} onClick={() => {
            if (window.confirm("Make approval optional? Any held releases may become eligible again.")) {
              void act({ action: "policy", userId, required: false }, "Approval is now optional.");
            }
          }}>Make optional</button>
        </div>)}
      </section> : <p className="text-sm">
        {inbox.required ? "Approval required for email and social." : "Approval optional. Your existing permissions still apply."}
        {" "}Your ORBI. user ID: <code>{inbox.userId}</code>
      </p>}
      {inbox.canRequest && <section className={card}>
        <form className="space-y-3" onSubmit={e => { e.preventDefault(); if (draftId) void act({ action: "request", draftId }, "Draft submitted for client review."); }}>
          <label className="block text-sm font-semibold">Submit a saved draft
            <select className={field + " mt-2"} value={draftId} onChange={e => setDraftId(e.target.value)}>
              <option value="">{inbox.drafts.length ? "Choose a draft" : "No saved drafts"}</option>
              {inbox.drafts.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button className={primary} disabled={busy || !draftId}>Send for review</button>
            <button type="button" className={secondary} onClick={() => void copyLink()}>Copy client review link</button>
            <Link href={reviewHref} className="text-sm underline">Open review link</Link>
          </div>
          <p className="text-xs text-[#526B60]">Share the link with the client owner. They’ll sign in to review their drafts.</p>
        </form>
      </section>}
      {inbox.reviews.length === 0 ? <p className={card + " text-sm"}>No drafts have been submitted for review yet.</p> :
        inbox.reviews.map(review => <ReviewItem key={review.id} review={review} organisationId={organisationId} kind={kind} owner={inbox.owner} busy={busy}
          canRelease={inbox.canRelease} release={when => void act(() => releaseDraft(organisationId, kind, review.draft_id, when), when ? "Approved draft scheduled." : "Approved draft queued.")}
          decide={(action, feedback) => void act({ action, reviewId: review.id, feedback }, action === "approved" ? "Draft approved." : "Changes requested.")} />)}
    </>}
  </div>;
}

function Approvals() {
  const search = useSearchParams();
  const context = useActiveAgencyContext();
  const [kind, setKind] = useState<Kind>(search.get("kind") === "social" ? "social" : "email");
  const organisationId = search.get("organisationId") || (!context.loading && context.active?.id);
  return <main className="mx-auto max-w-5xl space-y-6 p-5 text-[#103D31] sm:p-8">
    <header className="rounded-3xl bg-[#103D31] p-6 text-white sm:p-8">
      <Link href="/agency" className="text-sm text-[#D8E8DE] underline">Agency workspace</Link>
      <h1 className="mt-3 font-serif text-4xl">Client approvals.</h1>
      <p className="mt-2 text-sm text-[#D8E8DE]">Review email campaigns and social drafts before they go out.</p>
    </header>
    <div className="flex gap-2" aria-label="Draft type">
      <button className={kind === "email" ? primary : secondary} aria-pressed={kind === "email"} onClick={() => setKind("email")}>Email campaigns</button>
      <button className={kind === "social" ? primary : secondary} aria-pressed={kind === "social"} onClick={() => setKind("social")}>Social drafts</button>
    </div>
    {organisationId ? <InboxPanel key={organisationId + ":" + kind} organisationId={organisationId} kind={kind} /> :
      <p role="status">{context.loading ? "Checking organisation…" : context.error || "Select a client organisation to view approvals."}</p>}
  </main>;
}

export default function ClientApprovalsPage() {
  return <Suspense fallback={<p className="p-6">Loading client approvals…</p>}><Approvals /></Suspense>;
}
