"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, RefreshCw, Search, Plus } from "lucide-react";
import { useActiveAgencyContext } from "@/lib/use-active-agency-context";
import { supabase } from "@/lib/supabase";
import OriginalEmailCampaigns from "./OriginalEmailCampaigns";

type Campaign = { content?: string | null; id: string; title: string; subject: string | null; status: string | null; scheduled_for: string | null; sent_at: string | null; created_at: string | null; sent_count: number | null; open_count: number | null; click_count: number | null; list_id?: string | null };
type List = { id: string; name: string };

function ClientCampaigns({ organisationId, name }: { organisationId: string; name: string }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [tab, setTab] = useState<"campaigns" | "audiences">("campaigns");
  const [selectedListId, setSelectedListId] = useState("");
  const [subscribers, setSubscribers] = useState<{ id: string; email: string; name: string | null; status: string | null; unsubscribed: boolean }[]>([]);
  const [audienceName, setAudienceName] = useState("");
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [subscriberName, setSubscriberName] = useState("");
  const [hasConsent, setHasConsent] = useState(false);
  const [audienceBusy, setAudienceBusy] = useState(false);
  const [audienceError, setAudienceError] = useState("");
  const [audienceNotice, setAudienceNotice] = useState("");
  const request = async (url: string, init?: RequestInit) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Please sign in");
    const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}`, ...init?.headers }, cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Request failed");
    return result;
  };
  useEffect(() => {
    if (!selectedListId || !lists.some(l => l.id === selectedListId)) { setSubscribers([]); return; }
    let cancelled = false;
    setAudienceError("");
    request(`/api/agency/email/subscribers?organisationId=${encodeURIComponent(organisationId)}&listId=${encodeURIComponent(selectedListId)}`)
      .then(result => { if (!cancelled) setSubscribers(result.subscribers || []); })
      .catch(e => { if (!cancelled) setAudienceError(e instanceof Error ? e.message : "Unable to load subscribers"); });
    return () => { cancelled = true; };
  }, [organisationId, selectedListId, lists]);
  const createAudience = async () => {
    if (!audienceName.trim()) return;
    setAudienceBusy(true); setAudienceError(""); setAudienceNotice("");
    try {
      const result = await request("/api/agency/email/lists", { method: "POST", body: JSON.stringify({ organisationId, name: audienceName.trim() }) });
      setAudienceName(""); setSelectedListId(result.list.id); setRefreshKey(v => v + 1); setAudienceNotice("Audience created.");
    } catch (e) { setAudienceError(e instanceof Error ? e.message : "Unable to create audience"); }
    finally { setAudienceBusy(false); }
  };
  const addSubscriber = async () => {
    if (!selectedListId || !hasConsent) return;
    setAudienceBusy(true); setAudienceError(""); setAudienceNotice("");
    try {
      await request("/api/agency/email/subscribers", { method: "POST", body: JSON.stringify({ organisationId, listId: selectedListId, email: subscriberEmail, name: subscriberName, consent: hasConsent }) });
      const result = await request(`/api/agency/email/subscribers?organisationId=${encodeURIComponent(organisationId)}&listId=${encodeURIComponent(selectedListId)}`);
      setSubscribers(result.subscribers || []); setSubscriberEmail(""); setSubscriberName(""); setHasConsent(false); setAudienceNotice("Subscriber added.");
    } catch (e) { setAudienceError(e instanceof Error ? e.message : "Unable to add subscriber"); }
    finally { setAudienceBusy(false); }
  };
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("date_desc");
  const [editing, setEditing] = useState<Campaign | "new" | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [listId, setListId] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const openEditor = (campaign: Campaign | "new") => {
    setEditing(campaign); setTitle(campaign === "new" ? "" : campaign.title);
    setSubject(campaign === "new" ? "" : campaign.subject || "");
    setContent(campaign === "new" ? "" : campaign.content || "");
    setListId(campaign === "new" ? "" : campaign.list_id || ""); setNotice("");
  };
  const saveDraft = async () => {
    setSaving(true); setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please sign in");
      const isNew = editing === "new";
      const response = await fetch("/api/agency/email/campaigns", {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ organisationId, ...(isNew ? {} : { id: (editing as Campaign).id }), title, subject, content, listId: listId || null }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save campaign");
      setEditing(null); setRefreshKey(v => v + 1); setNotice("Draft saved successfully.");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save campaign"); }
    finally { setSaving(false); }
  };
  useEffect(() => {
    let cancelled = false;
    setCampaigns([]); setLists([]); setError(""); setLoading(true);
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Please sign in");
        const response = await fetch(`/api/agency/email/overview?organisationId=${encodeURIComponent(organisationId)}`, { headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to load campaigns");
        if (!cancelled) { setCampaigns(result.campaigns || []); setLists(result.lists || []); }
      } catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : "Unable to load campaigns"); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [organisationId, refreshKey]);
  const displayed = useMemo(() => campaigns.filter(c => {
    const matchesText = `${c.title || ""} ${c.subject || ""}`.toLowerCase().includes(search.toLowerCase());
    return matchesText && (filter === "all" || (c.status || "draft").toLowerCase() === filter);
  }).sort((a, b) => {
    if (sort === "title_asc") return (a.title || "").localeCompare(b.title || "");
    if (sort === "title_desc") return (b.title || "").localeCompare(a.title || "");
    const diff = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    return sort === "date_asc" ? diff : -diff;
  }), [campaigns, search, filter, sort]);
  const sent = campaigns.filter(c => c.status?.toLowerCase() === "sent");
  const stats = [["Campaigns", campaigns.length], ["Sent", sent.length], ["Scheduled", campaigns.filter(c => c.status?.toLowerCase() === "scheduled").length], ["Audiences", lists.length]] as const;
  return <div className="min-h-screen bg-[#f8f8f7] p-4 text-stone-900 md:p-10"><div className="mx-auto max-w-7xl">
    <header className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between"><div>
      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#82916f]">Marketing · {name}</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Email Campaigns</h1>
      <p className="mt-3 max-w-xl text-sm leading-7 text-stone-500">Create, schedule and track email campaigns from one place.</p>
    </div><button type="button" onClick={() => openEditor("new")} className="flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-6 py-4 text-[9px] font-black uppercase tracking-[0.16em] text-[#a9b897]"><Plus size={14}/>Create campaign</button></header>
    <div className="mb-7 flex items-center justify-between border-b border-stone-200"><div className="flex gap-6">{(["campaigns", "audiences"] as const).map(item => <button key={item} type="button" onClick={() => setTab(item)} className={`pb-4 text-[10px] font-black uppercase tracking-[0.12em] ${tab === item ? "border-b-2 border-stone-900 text-stone-900" : "text-stone-400"}`}>{item}</button>)}</div><button onClick={() => setRefreshKey(v => v + 1)} disabled={loading} className="mb-3 flex items-center gap-2 text-[8px] font-black uppercase tracking-wider text-stone-400"><RefreshCw size={12} className={loading ? "animate-spin" : ""}/>Refresh</button></div>
    <div className="mb-8 grid gap-4 md:grid-cols-4">{stats.map(([label,value]) => <div key={label} className="rounded-[1.5rem] border border-stone-200 bg-white p-5"><p className="text-[8px] font-black uppercase tracking-[0.14em] text-stone-400">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>)}</div>
    {tab === "audiences" && <section className="mb-8 space-y-6 rounded-[2rem] border border-stone-200 bg-white p-6 md:p-8">
      <div><h2 className="text-2xl font-black">Audience lists</h2><p className="mt-1 text-sm text-stone-500">Manage this organisation’s subscriber lists and add contacts with documented marketing consent.</p></div>
      {audienceError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{audienceError}</p>}
      {audienceNotice && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{audienceNotice}</p>}
      <form onSubmit={e => { e.preventDefault(); void createAudience(); }} className="flex flex-col gap-3 md:flex-row"><input aria-label="New audience name" placeholder="New audience name" value={audienceName} onChange={e => setAudienceName(e.target.value)} maxLength={150} className="min-w-0 flex-1 rounded-xl border border-stone-200 p-3 text-sm"/><button disabled={audienceBusy || !audienceName.trim()} className="rounded-xl bg-stone-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-40">Create audience</button></form>
      <div className="grid gap-6 lg:grid-cols-[minmax(200px,1fr)_2fr]"><div className="space-y-2">{lists.length === 0 ? <p className="text-sm text-stone-500">No audience lists yet.</p> : lists.map(list => <button type="button" key={list.id} onClick={() => setSelectedListId(list.id)} className={`block w-full rounded-xl border p-4 text-left text-sm font-semibold ${selectedListId === list.id ? "border-[#A9B897] bg-[#FAF8F5]" : "border-stone-200"}`}>{list.name}</button>)}</div>
      <div>{selectedListId && lists.some(l => l.id === selectedListId) ? <div className="space-y-5"><h3 className="text-lg font-black">{lists.find(l => l.id === selectedListId)?.name}</h3>
        <form onSubmit={e => { e.preventDefault(); void addSubscriber(); }} className="grid gap-3 rounded-xl bg-stone-50 p-4"><p className="text-sm font-bold">Add subscriber</p><input type="email" required placeholder="Email address" aria-label="Subscriber email" value={subscriberEmail} onChange={e => setSubscriberEmail(e.target.value)} className="rounded-lg border p-3 text-sm"/><input placeholder="Name (optional)" aria-label="Subscriber name" value={subscriberName} onChange={e => setSubscriberName(e.target.value)} className="rounded-lg border p-3 text-sm"/><label className="flex items-start gap-2 text-xs text-stone-600"><input type="checkbox" checked={hasConsent} onChange={e => setHasConsent(e.target.checked)} className="mt-0.5"/>I confirm this person has given documented consent to receive marketing emails.</label><button disabled={audienceBusy || !hasConsent || !subscriberEmail.trim()} className="w-fit rounded-lg bg-stone-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-40">Add subscriber</button></form>
        <p className="text-xs text-stone-500">Showing up to 500 subscribers in this audience.</p><div className="divide-y divide-stone-100 rounded-xl border border-stone-200">{subscribers.length === 0 ? <p className="p-4 text-sm text-stone-500">No subscribers in this list.</p> : subscribers.map(person => <div key={person.id} className="flex items-center justify-between gap-4 p-3 text-sm"><div className="min-w-0"><p className="truncate font-semibold">{person.email}</p><p className="text-xs text-stone-500">{person.name || "No name"}</p></div><span className="text-xs text-stone-500">{person.unsubscribed ? "Unsubscribed" : person.status || "Active"}</span></div>)}</div></div> : <p className="text-sm text-stone-500">Select an audience to see its subscribers.</p>}</div></div>
      <p className="text-xs text-amber-800">These lists use the agency subscriber API. The legacy campaign sender’s audience mapping still needs reconciliation before live sending can be enabled.</p>
    </section>}
    {tab === "campaigns" && <>
    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div className="relative flex-1"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"/><input aria-label="Search campaigns" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search campaigns..." className="w-full rounded-xl border border-stone-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-stone-400"/></div><div className="flex flex-wrap gap-2">{["all","draft","scheduled","sent"].map(s=><button key={s} onClick={()=>setFilter(s)} className={`rounded-xl px-4 py-3 text-[9px] font-black uppercase tracking-wider ${filter===s?"bg-stone-900 text-[#a9b897]":"border border-stone-200 bg-white text-stone-500"}`}>{s}</button>)}</div><select aria-label="Sort campaigns" value={sort} onChange={e=>setSort(e.target.value)} className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-[9px] font-black uppercase text-stone-600"><option value="date_desc">Date · newest first</option><option value="date_asc">Date · oldest first</option><option value="title_asc">Name · A–Z</option><option value="title_desc">Name · Z–A</option></select></div>
    {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-white p-4 text-red-700">{error}</p>}
    <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">{loading ? <p className="p-8 text-sm text-stone-500">Loading campaigns…</p> : displayed.length===0 ? <div className="py-20 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100"><Mail size={22} className="text-stone-400"/></div><h2 className="mt-5 text-xl font-black">{campaigns.length ? "No matching campaigns" : "No campaigns yet"}</h2><p className="mt-2 text-sm text-stone-400">{campaigns.length ? "Try changing your search or campaign filter." : "No campaigns for this organisation."}</p></div> : <><div className="hidden grid-cols-[minmax(0,2fr)_1fr_1fr_1fr] gap-4 border-b border-stone-100 bg-stone-50 px-6 py-4 text-[8px] font-black uppercase tracking-[0.14em] text-stone-400 md:grid"><span>Campaign</span><span>Audience</span><span>Status</span><span>Results</span></div>{displayed.map(c=><div key={c.id} className="grid gap-4 border-b border-stone-100 px-6 py-5 last:border-0 md:grid-cols-[minmax(0,2fr)_1fr_1fr_1fr] md:items-center"><div className="min-w-0"><button type="button" disabled={c.status !== "draft"} onClick={() => openEditor(c)} className="truncate text-left text-sm font-black enabled:hover:underline disabled:cursor-default">{c.title || "Untitled campaign"}</button><p className="mt-1 truncate text-xs text-stone-400">{c.subject || "No subject"}</p></div><p className="text-xs text-stone-500">{lists.find(l=>l.id===c.list_id)?.name || "—"}</p><span className="w-fit rounded-full bg-stone-100 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-stone-600">{c.status || "draft"}</span><div className="text-xs text-stone-500"><span className="font-black text-stone-800">{c.sent_count || 0}</span> sent · {c.open_count || 0} opens</div></div>)}</>}</section>
    </>}
    {notice && <p role="status" className="mt-5 text-sm text-green-700">{notice}</p>}
    {editing && <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 p-4 md:p-12" role="dialog" aria-modal="true" aria-label="Campaign draft editor"><div className="mx-auto max-w-4xl rounded-3xl bg-white p-6 shadow-xl md:p-10">
      <div className="mb-6 flex items-center justify-between"><h2 className="text-2xl font-black">{editing === "new" ? "Create campaign" : "Edit draft"}</h2><button type="button" onClick={() => setEditing(null)} aria-label="Close editor">✕</button></div>
      <div className="grid gap-5"><label className="grid gap-2 text-sm font-semibold">Campaign name<input className="rounded-xl border p-3" value={title} onChange={e => setTitle(e.target.value)} maxLength={200}/></label>
      <label className="grid gap-2 text-sm font-semibold">Email subject<input className="rounded-xl border p-3" value={subject} onChange={e => setSubject(e.target.value)} maxLength={300}/></label>
      <label className="grid gap-2 text-sm font-semibold">Audience<select className="rounded-xl border p-3" value={listId} onChange={e => setListId(e.target.value)}><option value="">Choose later</option>{lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
      <label className="grid gap-2 text-sm font-semibold">Email HTML<textarea className="min-h-80 rounded-xl border p-3 font-mono text-xs" value={content} onChange={e => setContent(e.target.value)}/></label>
      <p className="rounded-xl bg-amber-50 p-4 text-xs text-amber-900">Draft creation and editing are enabled. Sending and scheduling remain unavailable until the delivery worker and audience mapping are verified.</p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-3"><button onClick={() => setEditing(null)} className="rounded-xl border px-5 py-3">Cancel</button><button disabled={saving || !title.trim() || !subject.trim()} onClick={() => void saveDraft()} className="rounded-xl bg-stone-900 px-6 py-3 font-bold text-white disabled:opacity-40">{saving ? "Saving…" : "Save draft"}</button></div></div></div></div>}
    <p className="mt-5 text-xs text-stone-400">Draft editing is available for authorised agency users. Live sending and scheduling remain restricted pending end-to-end verification.</p>
  </div></div>;
}

export default function EmailCampaignsPage() {
  const context = useActiveAgencyContext();
  if (context.loading) return <p className="p-6">Checking organisation access…</p>;
  if (context.error || !context.active) return <p role="alert" className="p-6">{context.error || "Organisation not available"}</p>;
  if (context.delegated) {
    if (context.active.permissions?.email?.view !== true) return <p role="alert" className="p-6">Email Marketing access has not been granted.</p>;
    return <ClientCampaigns key={context.active.id} organisationId={context.active.id} name={context.active.name}/>;
  }
  return <OriginalEmailCampaigns key={context.active.id}/>;
}
