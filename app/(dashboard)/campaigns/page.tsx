"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, RefreshCw, Search, Plus } from "lucide-react";
import { useActiveAgencyContext } from "@/lib/use-active-agency-context";
import { supabase } from "@/lib/supabase";
import OriginalEmailCampaigns from "./OriginalEmailCampaigns";

type Campaign = { id: string; title: string; subject: string | null; status: string | null; scheduled_for: string | null; sent_at: string | null; created_at: string | null; sent_count: number | null; open_count: number | null; click_count: number | null; list_id?: string | null };
type List = { id: string; name: string };

function ClientCampaigns({ organisationId, name }: { organisationId: string; name: string }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("date_desc");
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
    </div><button type="button" disabled title="Client campaign creation is not connected to the full editor yet" className="flex cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-stone-900 px-6 py-4 text-[9px] font-black uppercase tracking-[0.16em] text-[#a9b897] opacity-50"><Plus size={14}/>Create campaign</button></header>
    <div className="mb-7 flex items-center justify-between border-b border-stone-200"><div className="border-b-2 border-stone-900 pb-4 text-[10px] font-black uppercase tracking-[0.12em]">Campaigns</div><button onClick={() => setRefreshKey(v => v + 1)} disabled={loading} className="mb-3 flex items-center gap-2 text-[8px] font-black uppercase tracking-wider text-stone-400"><RefreshCw size={12} className={loading ? "animate-spin" : ""}/>Refresh</button></div>
    <div className="mb-8 grid gap-4 md:grid-cols-4">{stats.map(([label,value]) => <div key={label} className="rounded-[1.5rem] border border-stone-200 bg-white p-5"><p className="text-[8px] font-black uppercase tracking-[0.14em] text-stone-400">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>)}</div>
    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div className="relative flex-1"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"/><input aria-label="Search campaigns" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search campaigns..." className="w-full rounded-xl border border-stone-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-stone-400"/></div><div className="flex flex-wrap gap-2">{["all","draft","scheduled","sent"].map(s=><button key={s} onClick={()=>setFilter(s)} className={`rounded-xl px-4 py-3 text-[9px] font-black uppercase tracking-wider ${filter===s?"bg-stone-900 text-[#a9b897]":"border border-stone-200 bg-white text-stone-500"}`}>{s}</button>)}</div><select aria-label="Sort campaigns" value={sort} onChange={e=>setSort(e.target.value)} className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-[9px] font-black uppercase text-stone-600"><option value="date_desc">Date · newest first</option><option value="date_asc">Date · oldest first</option><option value="title_asc">Name · A–Z</option><option value="title_desc">Name · Z–A</option></select></div>
    {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-white p-4 text-red-700">{error}</p>}
    <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">{loading ? <p className="p-8 text-sm text-stone-500">Loading campaigns…</p> : displayed.length===0 ? <div className="py-20 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100"><Mail size={22} className="text-stone-400"/></div><h2 className="mt-5 text-xl font-black">{campaigns.length ? "No matching campaigns" : "No campaigns yet"}</h2><p className="mt-2 text-sm text-stone-400">{campaigns.length ? "Try changing your search or campaign filter." : "No campaigns for this organisation."}</p></div> : <><div className="hidden grid-cols-[minmax(0,2fr)_1fr_1fr_1fr] gap-4 border-b border-stone-100 bg-stone-50 px-6 py-4 text-[8px] font-black uppercase tracking-[0.14em] text-stone-400 md:grid"><span>Campaign</span><span>Audience</span><span>Status</span><span>Results</span></div>{displayed.map(c=><div key={c.id} className="grid gap-4 border-b border-stone-100 px-6 py-5 last:border-0 md:grid-cols-[minmax(0,2fr)_1fr_1fr_1fr] md:items-center"><div className="min-w-0"><p className="truncate text-sm font-black">{c.title || "Untitled campaign"}</p><p className="mt-1 truncate text-xs text-stone-400">{c.subject || "No subject"}</p></div><p className="text-xs text-stone-500">{lists.find(l=>l.id===c.list_id)?.name || "—"}</p><span className="w-fit rounded-full bg-stone-100 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-stone-600">{c.status || "draft"}</span><div className="text-xs text-stone-500"><span className="font-black text-stone-800">{c.sent_count || 0}</span> sent · {c.open_count || 0} opens</div></div>)}</>}</section>
    <p className="mt-5 text-xs text-stone-400">Client campaign editing and sending remain disabled until the full editor and delivery pipeline are safely connected.</p>
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
