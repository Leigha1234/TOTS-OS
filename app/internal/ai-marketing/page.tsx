"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const tabs = ["Overview", "AI Campaign Creator", "Creative Studio", "Email Marketing", "Social Media", "Meta Ads", "Leads & Analytics", "Draft Library", "Campaign Calendar", "Review Queue"];
type CloudCampaign = { id: string; business: string; channel: string; goal: string; content: string; status: "draft" | "in_review" | "approved"; scheduled_for: string | null; created_at: string; updated_at: string };
type StoredDraft = { id: string; business: string; channel: string; goal: string; content: string; createdAt: string };
const DRAFTS_KEY = "orbi-ai-marketing-drafts-v3";
const initial = { business: "Moray Training Club", channel: "Email", tone: "Friendly", goal: "" };

export default function AIMarketingEngine() {
  const [tab, setTab] = useState("Overview");
  const [form, setForm] = useState(initial);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [session, setSession] = useState<"checking" | "signed-in" | "signed-out">("checking");
  const [token, setToken] = useState("");
  const [saved, setSaved] = useState<StoredDraft[]>([]);
  const [contexts, setContexts] = useState<{id: string; name: string}[]>([]);
  const [notice, setNotice] = useState("");
  const [cloud, setCloud] = useState<CloudCampaign[]>([]);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [cloudError, setCloudError] = useState("");
  const [schedule, setSchedule] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [cloudLoaded, setCloudLoaded] = useState(false);


  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFTS_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) setSaved(parsed.filter((v): v is StoredDraft =>
          typeof v === "object" && v !== null && typeof v.id === "string" && typeof v.content === "string"
        ).slice(0, 100));
      }
    } catch { setNotice("Saved drafts could not be loaded from this browser."); }
  }, []);

  function persistDrafts(next: StoredDraft[]) {
    setSaved(next);
    try { localStorage.setItem(DRAFTS_KEY, JSON.stringify(next)); }
    catch { setNotice("Browser storage is full or unavailable. Export your drafts to keep them."); }
  }

  function saveDraft() {
    if (!draft.trim()) return;
    const item: StoredDraft = { id: crypto.randomUUID(), business: form.business,
      channel: form.channel, goal: form.goal, content: draft, createdAt: new Date().toISOString() };
    persistDrafts([item, ...saved].slice(0, 100));
    setNotice("Draft saved to this browser. Export a backup if needed.");
  }

  function exportDrafts() {
    const blob = new Blob([JSON.stringify(saved, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "orbi-marketing-drafts.json"; link.click();
    URL.revokeObjectURL(url);
  }


  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) { setSession("signed-out"); return; }
    const supabase = createBrowserClient(url, anon);
    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token || "");
      setSession(data.session ? "signed-in" : "signed-out");
    });
    supabase.auth.getSession().then(async ({ data }) => {
      const accessToken = data.session?.access_token;
      if (!accessToken) return;
      try {
        const response = await fetch("/api/agency/contexts", { headers: { Authorization: `Bearer ${accessToken}` } });
        if (response.ok) {
          const json = await response.json();
          setContexts(Array.isArray(json.contexts) ? json.contexts.map((c: {id: string; name: string}) => ({ id: c.id, name: c.name })) : []);
        }
      } catch { /* Business list is optional; drafts remain available. */ }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, value) => {
      setToken(value?.access_token || "");
      setSession(value ? "signed-in" : "signed-out");
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function cloudRequest(method: string, payload?: object) {
    const response = await fetch("/api/internal/ai-marketing/campaigns", {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      ...(payload ? { body: JSON.stringify(payload) } : {}),
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Campaign request failed");
    return result;
  }

  async function loadCloud() {
    if (!token) return;
    setCloudBusy(true); setCloudError("");
    try { const result = await cloudRequest("GET"); setCloud(result.campaigns || []); setCloudLoaded(true); }
    catch (e) { setCloudError(e instanceof Error ? e.message : "Could not load campaigns"); }
    finally { setCloudBusy(false); }
  }

  useEffect(() => { if (token) void loadCloud(); else { setCloud([]); setCloudLoaded(false); } }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveCloud() {
    if (!draft.trim() || !form.business.trim()) return;
    setCloudBusy(true); setCloudError("");
    try {
      await cloudRequest(editingId ? "PATCH" : "POST", {
        ...(editingId ? { id: editingId } : {}), business: form.business, channel: form.channel,
        goal: form.goal, content: draft, scheduled_for: schedule ? new Date(schedule).toISOString() : null,
      });
      setEditingId(null); setNotice("Campaign saved to Supabase. No messages were sent.");
      await loadCloud();
    } catch (e) { setCloudError(e instanceof Error ? e.message : "Could not save campaign"); }
    finally { setCloudBusy(false); }
  }

  async function changeStatus(id: string, status: CloudCampaign["status"]) {
    setCloudBusy(true); setCloudError("");
    try { await cloudRequest("PATCH", { id, status }); await loadCloud(); }
    catch (e) { setCloudError(e instanceof Error ? e.message : "Status update failed"); }
    finally { setCloudBusy(false); }
  }

  async function deleteCloud(id: string) {
    if (!window.confirm("Permanently delete this saved campaign?")) return;
    setCloudBusy(true); setCloudError("");
    try { await cloudRequest("DELETE", { id }); await loadCloud(); }
    catch (e) { setCloudError(e instanceof Error ? e.message : "Delete failed"); }
    finally { setCloudBusy(false); }
  }

  function editCloud(item: CloudCampaign) {
    setForm({ business: item.business, channel: item.channel, goal: item.goal, tone: "Friendly" });
    setDraft(item.content); setEditingId(item.id);
    setSchedule(item.scheduled_for ? new Date(item.scheduled_for).toISOString().slice(0, 16) : "");
    setTab("AI Campaign Creator");
  }

  async function generate() {
    setBusy(true); setError(""); setDraft(""); setEditingId(null);
    try {
      const response = await fetch("/api/internal/ai-marketing/generate", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to generate draft");
      setDraft(data.draft);
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); }
    finally { setBusy(false); }
  }

  const field = "w-full rounded-xl border border-[#E5E7E4] bg-white px-4 py-3 text-[#1E2A27] outline-none focus:border-[#0F3D32]";
  const card = "rounded-2xl border border-[#E5E7E4] bg-white p-6 shadow-sm";
  return (
    <main className="min-h-screen bg-[#FAFAF8] px-5 py-10 text-[#1E2A27] md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div><p className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-[#0F3D32]">ORBI / Internal workspace</p>
            <h1 className="text-3xl font-bold md:text-4xl">AI Marketing Engine</h1>
            <p className="mt-2 text-[#66716D]">Plan, create and review campaigns in one place.</p></div>
          <span className="rounded-full bg-[#E6F0EC] px-4 py-2 text-xs font-semibold text-[#0F3D32]">Draft-first workspace</span>
        </div>
        <nav aria-label="Marketing engine sections" className="mb-6 flex flex-wrap gap-2">
          {tabs.map(item => <button key={item} onClick={() => setTab(item)} className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${tab === item ? "bg-[#0F3D32] text-white" : "border border-[#E5E7E4] bg-white text-[#1E2A27] hover:bg-[#E6F0EC]"}`}>{item}</button>)}
        </nav>
        {session === "checking" ? <div className={card}>Checking your ORBI session…</div> : session === "signed-out" ? <div className={card}>Sign in to ORBI first, then return to this page.</div> : <>
          {cloudError && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{cloudError}</p>}
          {tab === "Overview" && <div className="grid gap-5 md:grid-cols-3">
            <section className={card}><p className="text-sm text-[#66716D]">AI drafts saved this visit</p><p className="mt-3 text-4xl font-bold text-[#0F3D32]">{saved.length}</p><p className="mt-3 text-xs text-[#66716D]">Stored in this browser; export backups for safekeeping</p></section>
            <section className={card}><p className="text-sm text-[#66716D]">Live advertising spend</p><p className="mt-3 text-xl font-semibold">Not connected</p><p className="mt-3 text-xs text-[#66716D]">Meta Ads integration required</p></section>
            <section className={card}><p className="text-sm text-[#66716D]">Campaign delivery</p><p className="mt-3 text-xl font-semibold">Existing ORBI system</p><p className="mt-3 text-xs text-[#66716D]">No automatic sends from this workspace</p></section>
            <section className={card}><p className="text-sm text-[#66716D]">Supabase campaigns</p><p className="mt-3 text-4xl font-bold text-[#0F3D32]">{cloud.length}</p><p className="mt-3 text-xs text-[#66716D]">{cloudLoaded ? "Saved across devices" : "Not loaded"}</p></section>
            <section className={`${card} md:col-span-3`}><h2 className="text-xl font-bold">Start creating</h2><p className="mt-2 text-[#66716D]">Generate a campaign draft for MTC, Rooted or another client, then review it before using it in ORBI.</p><button className="mt-5 rounded-xl bg-[#0F3D32] px-5 py-3 font-semibold text-white" onClick={() => setTab("AI Campaign Creator")}>Create campaign →</button></section>
          </div>}
          {(tab === "AI Campaign Creator" || tab === "Creative Studio") && <div className="grid gap-6 lg:grid-cols-2">
            <section className={card}><h2 className="mb-5 text-xl font-bold">Campaign brief</h2><div className="space-y-4">
              <label className="block text-sm font-semibold">Business<input list="orbi-businesses" className={`${field} mt-2`} value={form.business} onChange={e => setForm({ ...form, business: e.target.value })} maxLength={100}/><datalist id="orbi-businesses">{contexts.map(c => <option key={c.id} value={c.name} />)}</datalist></label>
              <label className="block text-sm font-semibold">Channel<select className={`${field} mt-2`} value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })}>{["Email", "Social", "Meta Ads"].map(v => <option key={v}>{v}</option>)}</select></label>
              <label className="block text-sm font-semibold">Tone<select className={`${field} mt-2`} value={form.tone} onChange={e => setForm({ ...form, tone: e.target.value })}>{["Friendly", "Professional", "Bold", "Energetic", "Warm"].map(v => <option key={v}>{v}</option>)}</select></label>
              <label className="block text-sm font-semibold">Goal and details<textarea className={`${field} mt-2 min-h-36`} placeholder="Describe your audience, offer, dates, key message and desired action…" value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })} maxLength={1200}/></label>
              <button disabled={busy || !form.goal.trim()} onClick={generate} className="w-full rounded-xl bg-[#0F3D32] px-5 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Generating…" : "Generate AI campaign draft"}</button>
              {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            </div></section>
            <section className={card}><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">Your draft</h2>{draft && <div className="flex gap-2"><button className="rounded-lg border px-3 py-2 text-sm" onClick={() => navigator.clipboard.writeText(draft)}>Copy</button><button className="rounded-lg bg-[#E6F0EC] px-3 py-2 text-sm text-[#0F3D32]" onClick={saveDraft}>Save draft</button></div>}</div>
              {draft && <div className="mt-4 flex flex-wrap items-end gap-3"><label className="text-sm font-semibold">Planning date (optional)<input type="datetime-local" className={`${field} mt-2`} value={schedule} onChange={e => setSchedule(e.target.value)} /></label><button disabled={cloudBusy} onClick={saveCloud} className="rounded-xl bg-[#0F3D32] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{editingId ? "Update Supabase campaign" : "Save to Supabase"}</button>{editingId && <button onClick={() => setEditingId(null)} className="rounded-xl border px-4 py-3 text-sm">Save as new instead</button>}</div>}
              {draft ? <textarea aria-label="Editable campaign draft" className={`${field} mt-5 min-h-[420px] font-sans text-sm leading-7`} value={draft} onChange={e => setDraft(e.target.value)} /> : <p className="mt-5 text-[#66716D]">Your AI-generated campaign will appear here. Nothing is sent or published automatically.</p>}
            </section></div>}
          {tab === "Draft Library" && <section className={card}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-xl font-bold">Draft Library</h2><p className="mt-1 text-sm text-[#66716D]">Private to this browser and device. Not synced to ORBI or Supabase.</p></div>
              <button disabled={!saved.length} onClick={exportDrafts} className="rounded-xl bg-[#0F3D32] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Export JSON backup</button>
            </div>
            {!saved.length ? <p className="mt-6 text-[#66716D]">No saved drafts yet. Generate a campaign and select Save draft.</p> :
              <div className="mt-5 space-y-3">{saved.map(item => <article key={item.id} className="rounded-xl border border-[#E5E7E4] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{item.business} · {item.channel}</p><p className="text-xs text-[#66716D]">{new Date(item.createdAt).toLocaleString()} · {item.goal.slice(0, 90)}</p></div>
                  <div className="flex gap-2"><button className="rounded-lg bg-[#E6F0EC] px-3 py-2 text-sm" onClick={() => { setDraft(item.content); setForm({ business: item.business, channel: item.channel, goal: item.goal, tone: "Friendly" }); setTab("AI Campaign Creator"); }}>Open / edit</button>
                  <button className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700" onClick={() => { if (window.confirm("Delete this saved draft?")) persistDrafts(saved.filter(d => d.id !== item.id)); }}>Delete</button></div></div>
              </article>)}</div>}
          </section>}
          {tab === "Campaign Calendar" && <section className={card}>
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Campaign Calendar</h2><p className="mt-1 text-sm text-[#66716D]">Planning dates only. These do not schedule publishing or emails.</p></div><div className="flex gap-2"><input aria-label="Calendar month" type="month" value={month} onChange={e => setMonth(e.target.value)} className={field}/><button onClick={loadCloud} className="rounded-xl border px-4 py-2 text-sm">Refresh</button></div></div>
            <div className="mt-5 space-y-3">{cloud.filter(c => c.scheduled_for?.slice(0, 7) === month).sort((a,b) => (a.scheduled_for || "").localeCompare(b.scheduled_for || "")).map(c => <article key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"><div><p className="text-sm font-semibold text-[#0F3D32]">{new Date(c.scheduled_for!).toLocaleString()}</p><p className="font-semibold">{c.business} · {c.channel}</p><p className="text-sm text-[#66716D]">{c.goal.slice(0, 110)} · {c.status.replace("_", " ")}</p></div><button onClick={() => editCloud(c)} className="rounded-lg border px-3 py-2 text-sm">Open</button></article>)}{!cloud.some(c => c.scheduled_for?.slice(0, 7) === month) && <p className="text-[#66716D]">No campaigns planned for this month.</p>}</div>
          </section>}
          {tab === "Review Queue" && <section className={card}>
            <h2 className="text-xl font-bold">Review Queue</h2><p className="mt-1 text-sm text-[#66716D]">Personal draft review statuses. Approval here does not authorise live publishing or replace ORBI's existing approval gate.</p>
            <div className="mt-5 space-y-3">{cloud.map(c => <article key={c.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{c.business} · {c.channel}</p><p className="text-sm text-[#66716D]">{c.goal.slice(0, 110)}</p><p className="mt-1 text-xs uppercase tracking-wide text-[#0F3D32]">{c.status.replace("_", " ")}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => editCloud(c)} className="rounded-lg border px-3 py-2 text-sm">Edit</button>{c.status === "draft" && <button disabled={cloudBusy} onClick={() => changeStatus(c.id, "in_review")} className="rounded-lg bg-[#E6F0EC] px-3 py-2 text-sm">Request review</button>}{c.status === "in_review" && <button disabled={cloudBusy} onClick={() => changeStatus(c.id, "approved")} className="rounded-lg bg-[#0F3D32] px-3 py-2 text-sm text-white">Mark reviewed</button>}{c.status !== "draft" && <button disabled={cloudBusy} onClick={() => changeStatus(c.id, "draft")} className="rounded-lg border px-3 py-2 text-sm">Return to draft</button>}<button disabled={cloudBusy} onClick={() => deleteCloud(c.id)} className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700">Delete</button></div></div></article>)}{!cloud.length && <p className="text-[#66716D]">No Supabase campaigns yet. Save one from the campaign creator.</p>}</div>
          </section>}
          {!["Overview", "AI Campaign Creator", "Creative Studio", "Draft Library"].includes(tab) && <section className={card}><h2 className="text-xl font-bold">{tab}</h2><p className="mt-3 text-[#66716D]">This integration is not connected to the internal engine yet. Use the existing ORBI module for live operations. This page does not send emails, publish posts or spend advertising budget.</p><button onClick={() => { setForm({ ...form, channel: tab === "Meta Ads" ? "Meta Ads" : tab === "Email Marketing" ? "Email" : "Social" }); setTab("AI Campaign Creator"); }} className="mt-5 rounded-xl bg-[#0F3D32] px-5 py-3 font-semibold text-white">Create a draft for this channel →</button></section>}
        </>}
        {notice && <p role="status" className="mt-5 rounded-xl bg-[#E6F0EC] p-3 text-sm text-[#0F3D32]">{notice}</p>}
        <p className="mt-8 text-xs text-[#66716D]">ORBI AI Marketing Engine · Unlisted route · Live publishing disabled</p>
      </div>
    </main>
  );
}
