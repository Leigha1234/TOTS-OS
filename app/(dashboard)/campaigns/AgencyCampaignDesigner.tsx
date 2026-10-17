"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Code2, Eye, Save, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Audience = { id: string; name: string };
type Draft = { id: string; title: string; subject: string | null; content?: string | null; list_id?: string | null };
type Props = {
  organisationId: string;
  audiences: Audience[];
  campaign: Draft | null;
  onClose: () => void;
  onSaved: () => void;
};
const steps = ["Details", "Audience", "Design", "Review"] as const;
export default function AgencyCampaignDesigner({ organisationId, audiences, campaign, onClose, onSaved }: Props) {
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState(campaign?.title || "");
  const [subject, setSubject] = useState(campaign?.subject || "");
  const [listId, setListId] = useState(campaign?.list_id || "");
  const [html, setHtml] = useState(campaign?.content || "");
  const [mode, setMode] = useState<"code" | "preview">("code");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const chosen = useMemo(() => audiences.find(a => a.id === listId), [audiences, listId]);
  const canContinue = step !== 0 || Boolean(title.trim() && subject.trim());
  const save = async () => {
    setSaving(true); setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please sign in again.");
      const response = await fetch("/api/agency/email/campaigns", {
        method: campaign ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ organisationId, ...(campaign ? { id: campaign.id } : {}), title, subject, content: html, listId: listId || null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save campaign");
      onSaved();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save campaign"); }
    finally { setSaving(false); }
  };
  return <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#f8f8f7] text-[#282824]" role="dialog" aria-modal="true" aria-label="Campaign designer">
    <header className="sticky top-0 z-10 border-b border-stone-200 bg-white px-6 py-5 md:px-12">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <button type="button" onClick={onClose} className="flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-3 text-xs font-bold"><ArrowLeft size={15}/> Campaigns</button>
        <div className="min-w-0 text-center"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#82916f]">{campaign ? "Edit draft" : "New campaign"}</p><h1 className="truncate text-xl font-semibold">{title || "Untitled campaign"}</h1></div>
        <button type="button" aria-label="Close" onClick={onClose} className="rounded-xl p-3 hover:bg-stone-100"><X size={20}/></button>
      </div>
      <div className="mx-auto mt-6 grid max-w-4xl grid-cols-4 gap-2">{steps.map((s,i)=><button type="button" key={s} onClick={()=>{if(i<=step || (title.trim() && subject.trim())) setStep(i);}} className={`rounded-xl px-2 py-3 text-[10px] font-bold uppercase tracking-wide ${i===step?"bg-[#a9b897] text-stone-900":i<step?"bg-stone-200":"bg-stone-100 text-stone-400"}`}>{i<step?<Check className="mr-1 inline" size={13}/>:i+1} · {s}</button>)}</div>
    </header>
    <main className="mx-auto max-w-3xl px-5 py-12"><p className="text-center text-[10px] font-bold uppercase tracking-[.3em] text-[#82916f]">Step {step+1}</p><h2 className="mt-2 mb-8 text-center text-3xl font-semibold">{["Campaign details","Choose your audience","Design your email","Review your draft"][step]}</h2>
      <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm md:p-9">
        {step===0 && <div className="space-y-6"><label className="block text-xs font-bold uppercase tracking-wider">Campaign name<input maxLength={200} value={title} onChange={e=>setTitle(e.target.value)} placeholder="October newsletter" className="mt-3 w-full rounded-xl border border-stone-200 p-4 text-base font-normal normal-case tracking-normal"/></label><label className="block text-xs font-bold uppercase tracking-wider">Subject line<input maxLength={300} value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Something exciting is here…" className="mt-3 w-full rounded-xl border border-stone-200 p-4 text-base font-normal normal-case tracking-normal"/></label></div>}
        {step===1 && <div className="space-y-3">{audiences.length===0?<p className="text-sm text-stone-500">No audiences available. Create an audience from the campaign dashboard first.</p>:audiences.map(a=><button type="button" key={a.id} onClick={()=>setListId(a.id)} className={`flex w-full items-center justify-between rounded-xl border p-5 text-left font-semibold ${listId===a.id?"border-[#82916f] bg-[#f2f6ee]":"border-stone-200"}`}>{a.name}{listId===a.id&&<Check size={18}/>}</button>)}<button type="button" onClick={()=>setListId("")} className="text-xs text-stone-500 underline">Choose audience later</button></div>}
        {step===2 && <div><div className="mb-4 flex gap-2"><button type="button" onClick={()=>setMode("code")} className={`rounded-lg px-4 py-2 text-xs font-bold ${mode==="code"?"bg-stone-900 text-white":"bg-stone-100"}`}><Code2 size={14} className="mr-2 inline"/>HTML</button><button type="button" onClick={()=>setMode("preview")} className={`rounded-lg px-4 py-2 text-xs font-bold ${mode==="preview"?"bg-stone-900 text-white":"bg-stone-100"}`}><Eye size={14} className="mr-2 inline"/>Preview</button></div>{mode==="code"?<textarea aria-label="Email HTML" value={html} onChange={e=>setHtml(e.target.value)} className="min-h-[430px] w-full rounded-xl border border-stone-200 p-4 font-mono text-sm" placeholder="<html>...</html>"/>:<iframe title="Email preview" sandbox="" srcDoc={html} className="h-[430px] w-full rounded-xl border border-stone-200 bg-white"/>}<p className="mt-3 text-xs text-stone-500">HTML draft editing and preview. The original block editor and live sending are not yet connected for agency accounts.</p></div>}
        {step===3 && <div className="space-y-5 text-sm"><div><p className="text-xs font-bold uppercase text-stone-400">Campaign</p><p className="mt-1 font-semibold">{title}</p></div><div><p className="text-xs font-bold uppercase text-stone-400">Subject</p><p className="mt-1">{subject}</p></div><div><p className="text-xs font-bold uppercase text-stone-400">Audience</p><p className="mt-1">{chosen?.name || "Not selected"}</p></div><div><p className="text-xs font-bold uppercase text-stone-400">Email content</p><p className="mt-1">{html.trim()?"HTML draft ready":"No content added"}</p></div><p className="rounded-xl bg-amber-50 p-4 text-xs text-amber-900">Saving creates or updates a draft only. Sending and scheduling are intentionally unavailable until the delivery pipeline is safely scoped to this organisation.</p></div>}
        {error&&<p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}
        <div className="mt-8 flex items-center justify-between border-t border-stone-100 pt-6"><button type="button" onClick={()=>step===0?onClose():setStep(step-1)} className="rounded-xl border border-stone-200 px-5 py-3 text-xs font-bold"><ArrowLeft size={14} className="mr-2 inline"/>{step===0?"Cancel":"Back"}</button><div className="flex gap-2"><button type="button" disabled={saving||!title.trim()||!subject.trim()} onClick={()=>void save()} className="rounded-xl border border-stone-300 px-5 py-3 text-xs font-bold disabled:opacity-40"><Save size={14} className="mr-2 inline"/>{saving?"Saving…":"Save draft"}</button>{step<3&&<button type="button" disabled={!canContinue} onClick={()=>setStep(step+1)} className="rounded-xl bg-stone-900 px-5 py-3 text-xs font-bold text-white disabled:opacity-40">Continue <ArrowRight size={14} className="ml-2 inline"/></button>}</div></div>
      </section>
    </main>
  </div>;
}
