'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {supabase} from '@/lib/supabase';
type Lead={id:string;name:string;email:string|null;stage:string;source:string;consent_email:boolean;created_at:string};
type Report={leads:Lead[];summary:{total:number;eligible:number;withoutConsent:number;withoutEmail:number};truncated:boolean};
export default function GrowthEmailMarketing({organisationId}:{organisationId:string}){
 const [report,setReport]=useState<Report|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const [selected,setSelected]=useState(''),[evidence,setEvidence]=useState('');
 const request=useCallback(async(method:'GET'|'PATCH',body?:Record<string,unknown>)=>{
  const {data:{session}}=await supabase.auth.getSession();if(!session)throw Error('Sign in required');
  const url=`/api/growth/marketing${method==='GET'?`?organisationId=${encodeURIComponent(organisationId)}`:''}`;
  const response=await fetch(url,{method,headers:{Authorization:`Bearer ${session.access_token}`,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify({...body,organisationId})}:{})});
  const result=await response.json();if(!response.ok)throw Error(result.error||'Marketing request failed');return result;
 },[organisationId]);
 const load=useCallback(async()=>{try{setError('');setReport(await request('GET'));}catch(e){setError(e instanceof Error?e.message:'Could not load');}},[request]);
 useEffect(()=>{setReport(null);setSelected('');void load();},[load]);
 const eligible=useMemo(()=>report?.leads.filter(l=>l.email&&l.consent_email&&l.stage!=='lost')||[],[report]);
 const exportCsv=()=>{
  if(!report||report.truncated){setError('Export is disabled when more than 1,000 leads exist. Use a paginated export instead.');return;}
  const quote=(s:string)=>'"'+s.replace(/"/g,'""')+'"';
  const rows=[['Name','Email','Source','Stage'],...eligible.map(l=>[l.name,l.email||'',l.source,l.stage])];
  const csv='\uFEFF'+rows.map(row=>row.map(quote).join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='orbi-growth-consented-email-leads.csv';link.click();URL.revokeObjectURL(url);
 };
 const change=async(consentEmail:boolean)=>{
  if(!selected)return;setBusy(true);setError('');setNotice('');
  try{await request('PATCH',{leadId:selected,consentEmail,evidence:consentEmail?evidence:'Manual opt-out'});await load();setEvidence('');setNotice(consentEmail?'Consent evidence saved.':'Lead opted out of Growth email eligibility.');}
  catch(e){setError(e instanceof Error?e.message:'Update failed');}finally{setBusy(false);}
 };
 return <section className="rounded-2xl border bg-white p-6 space-y-4">
  <div><h2 className="text-xl font-semibold">Email Marketing · Part 3</h2><p className="mt-1 text-sm text-[#6B8177]">Review consent, prepare a consent-filtered audience and hand off to ORBI. Email Marketing. No messages are sent from Growth.</p></div>
  {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}{notice&&<p role="status" className="text-sm text-green-800">{notice}</p>}
  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[['Leads',report?.summary.total],['Email eligible',report?.summary.eligible],['No email consent',report?.summary.withoutConsent],['Missing email',report?.summary.withoutEmail]].map(([label,count])=><div key={label} className="rounded-lg bg-[#F2F6F2] p-3"><p className="text-xs text-[#6B8177]">{label}</p><p className="text-2xl font-semibold">{count??'—'}</p></div>)}</div>
  {report?.truncated&&<p className="text-sm text-amber-800">Showing only the newest 1,000 leads. Export is disabled to prevent incomplete lists.</p>}
  <div className="flex flex-wrap gap-2"><button type="button" onClick={exportCsv} disabled={!report||report.truncated} className="rounded-lg border px-4 py-2 disabled:opacity-50">Export eligible audience CSV</button><a className="rounded-lg bg-[#123F34] px-4 py-2 text-white" href="/campaigns">Open Email Marketing ↗</a><button type="button" onClick={()=>void load()} className="rounded-lg border px-4 py-2">Refresh</button></div>
  <p className="text-xs text-[#6B8177]">Import the CSV into an appropriate audience in Email Marketing after checking unsubscribe/suppression records there. Growth consent alone does not override an unsubscribe. No audience is automatically created.</p>
  <div className="rounded-xl border p-4 space-y-3"><h3 className="font-semibold">Record consent or opt-out</h3><select className="w-full rounded-lg border p-2" value={selected} onChange={e=>{setSelected(e.target.value);setEvidence('');}}><option value="">Choose a lead</option>{report?.leads.map(l=><option key={l.id} value={l.id}>{l.name} · {l.email||'no email'} · {l.consent_email?'consented':'not consented'}</option>)}</select><textarea className="w-full rounded-lg border p-2" rows={2} value={evidence} onChange={e=>setEvidence(e.target.value)} placeholder="For opt-in: record when, where and how explicit consent was obtained (e.g. signed form, 17 Nov 2026)."/><div className="flex flex-wrap gap-2"><button disabled={!selected||busy||!report?.leads.find(l=>l.id===selected)?.email} onClick={()=>void change(true)} className="rounded-lg bg-[#123F34] px-4 py-2 text-white disabled:opacity-50">Record verified opt-in</button><button disabled={!selected||busy} onClick={()=>void change(false)} className="rounded-lg border px-4 py-2 disabled:opacity-50">Mark opted out</button></div><p className="text-xs text-[#6B8177]">Only record opt-in when you have verifiable evidence. Changes are recorded in the lead activity history.</p></div>
 </section>;
}
