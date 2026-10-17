"use client";

import { useEffect, useState } from "react";
import { useActiveAgencyContext } from "@/lib/use-active-agency-context";
import { supabase } from "@/lib/supabase";
import OriginalEmailCampaigns from "./OriginalEmailCampaigns";

type Campaign = { id: string; title: string; subject: string | null; status: string | null; scheduled_for: string | null; sent_at: string | null; created_at: string | null; sent_count: number | null; open_count: number | null; click_count: number | null };
type List = { id: string; name: string };

function ClientEmailOverview({ organisationId, name }: { organisationId: string; name: string }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setCampaigns([]); setLists([]); setError(""); setLoading(true);
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Please sign in");
        const response = await fetch(`/api/agency/email/overview?organisationId=${encodeURIComponent(organisationId)}`, {
          headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to load campaigns");
        if (!cancelled) { setCampaigns(result.campaigns || []); setLists(result.lists || []); }
      } catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : "Unable to load campaigns"); }
      finally { if (!cancelled) setLoading(false); }
    };
    void load();
    return () => { cancelled = true; };
  }, [organisationId]);
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 text-[#4f4a46]">
      <div><p className="text-xs font-semibold uppercase tracking-widest text-[#839474]">Marketing · {name}</p><h1 className="mt-2 text-3xl font-semibold">Email Campaigns</h1><p className="mt-2 text-sm text-stone-600">Client campaigns and audiences. Sending and editing will be enabled once the email routes enforce client permissions.</p></div>
      {loading ? <p role="status">Loading client campaigns…</p> : error ? <p role="alert" className="rounded-lg border border-red-200 p-4 text-red-700">{error}</p> : <>
        <div className="grid gap-4 sm:grid-cols-3">{[["Campaigns", campaigns.length], ["Sent", campaigns.filter(c => c.status === "sent").length], ["Audiences", lists.length]].map(([label, count]) => <div key={label} className="rounded-2xl border border-stone-200 bg-white p-5"><div className="text-sm text-stone-500">{label}</div><div className="mt-2 text-3xl font-semibold">{count}</div></div>)}</div>
        <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white"><h2 className="border-b p-5 text-lg font-semibold">Campaigns</h2>{campaigns.length ? <div className="divide-y">{campaigns.map(c => <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-5"><div><div className="font-semibold">{c.title || "Untitled campaign"}</div><div className="text-sm text-stone-500">{c.subject || "No subject"}</div></div><span className="rounded-full bg-[#FAF8F5] px-3 py-1 text-xs font-semibold uppercase">{c.status || "draft"}</span></div>)}</div> : <p className="p-5 text-sm text-stone-500">No campaigns for this organisation.</p>}</section>
        <section className="rounded-2xl border border-stone-200 bg-white p-5"><h2 className="text-lg font-semibold">Audiences</h2><div className="mt-3 text-sm text-stone-600">{lists.length ? lists.map(l => l.name).join(" · ") : "No audiences found."}</div></section>
      </>}
    </div>
  );
}

export default function EmailCampaignsPage() {
  const context = useActiveAgencyContext();
  if (context.loading) return <p className="p-6">Checking organisation access…</p>;
  if (context.error || !context.active) return <p role="alert" className="p-6">{context.error || "Organisation not available"}</p>;
  if (context.delegated) {
    if (context.active.permissions?.email?.view !== true) return <p role="alert" className="p-6">Email Marketing access has not been granted.</p>;
    return <ClientEmailOverview key={context.active.id} organisationId={context.active.id} name={context.active.name} />;
  }
  return <OriginalEmailCampaigns key={context.active.id} />;
}
