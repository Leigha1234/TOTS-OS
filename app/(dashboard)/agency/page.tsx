'use client';

import AgencyContextPicker from '@/app/components/AgencyContextPicker';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Building2, ShieldCheck, Users, RefreshCw, Check, LockKeyhole, ArrowUpRight, Clock3, SlidersHorizontal, Plus, X, AlertCircle, Layers3, UserRound, ChevronRight, Sparkles } from 'lucide-react';

type Org = { id: string; name: string; owner: boolean };
type Grant = { id: string; client_organisation_id: string; client_name: string; grantee_type: 'individual' | 'organisation'; grantee_email: string | null; grantee_organisation_id: string | null; agency_name: string | null; status: string; permissions: Record<string, Record<string, boolean>> };
const MODULES = [['core','Dashboard'],['social','Social media'],['email','Email marketing'],['store','Store'],['customers','Customers'],['clientsProjects','Projects'],['finance','Finance'],['insights','Insights'],['calendar','Calendar']] as const;
const ACTIONS = ['view','create','edit','delete','publish','send','manage_orders'] as const;
const PRESETS = [
  { id:'all', label:'Full access', description:'All available modules and standard actions', icon:Layers3 },
  { id:'marketing', label:'Marketing', description:'Social media and email campaigns', icon:Sparkles },
  { id:'store', label:'Store', description:'Products, orders and store management', icon:Building2 },
  { id:'marketing_store', label:'Marketing + Store', description:'Social, email and ecommerce tools', icon:Layers3 },
  { id:'operations', label:'Operations', description:'Clients, projects, calendar and dashboard', icon:Users },
  { id:'view', label:'View only', description:'Read-only visibility across modules', icon:ShieldCheck },
  { id:'custom', label:'Custom', description:'Set permissions module by module', icon:SlidersHorizontal },
] as const;
type PresetId = (typeof PRESETS)[number]['id'];
type Permissions = Record<string, Record<string, boolean>>;
const initial = (): Permissions => Object.fromEntries(MODULES.map(([key]) => [key, Object.fromEntries(ACTIONS.map(action => [action,false]))]));
const presetPermissions = (id: PresetId): Permissions => {
  const selected: string[] = id === 'all' || id === 'view' ? MODULES.map(([key]) => key) : id === 'marketing' ? ['social','email'] : id === 'store' ? ['store'] : id === 'marketing_store' ? ['social','email','store'] : id === 'operations' ? ['core','customers','clientsProjects','calendar'] : [];
  return Object.fromEntries(MODULES.map(([key]) => [key, Object.fromEntries(ACTIONS.map(action => [action, selected.includes(key) && (action === 'view' || (id !== 'view' && (action === 'create' || action === 'edit' || (action === 'delete' && key !== 'finance' && key !== 'insights') || (action === 'publish' && key === 'social') || (action === 'send' && key === 'email') || (action === 'manage_orders' && key === 'store'))))]))]));
};
const card = 'rounded-[22px] border border-[#E5E9E4] bg-white shadow-[0_5px_24px_rgba(16,53,43,0.035)]';
const input = 'mt-2 w-full rounded-xl border border-[#DCE4DC] bg-[#FCFDFC] px-3.5 py-3 text-sm text-[#203A32] outline-none transition focus:border-[#246C54] focus:ring-2 focus:ring-[#DCEBE2]';
const button = 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#103D31] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#185340] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#103D31] disabled:cursor-not-allowed disabled:opacity-50';
const formatModules = (grant: Grant) => Object.entries(grant.permissions || {}).filter(([, p]) => p?.view).map(([key]) => MODULES.find(([k]) => k === key)?.[1] || key);

export default function AgencyPage() {
  const [orgs,setOrgs] = useState<Org[]>([]);
  const [incoming,setIncoming] = useState<Grant[]>([]);
  const [outgoing,setOutgoing] = useState<Grant[]>([]);
  const [busy,setBusy] = useState(false);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const [client,setClient] = useState('');
  const [type,setType] = useState<'individual'|'organisation'>('individual');
  const [email,setEmail] = useState('');
  const [agencyId,setAgencyId] = useState('');
  const [permissions,setPermissions] = useState<Permissions>(initial);
  const [preset,setPreset] = useState<PresetId>('marketing_store');
  const [showAdvanced,setShowAdvanced] = useState(false);
  const [showInvite,setShowInvite] = useState(false);
  const [tab,setTab] = useState<'active'|'pending'|'outgoing'>('active');
  const request = useCallback(async (method:'GET'|'POST',body?:unknown) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Please log in to manage agency access.');
    const response = await fetch('/api/agency', { method, headers: { Authorization: `Bearer ${session.access_token}`, ...(body ? { 'Content-Type':'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined, cache:'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
  }, []);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setError('');
      const data = await request('GET');
      setOrgs(data.organisations || []);
      setIncoming(data.incoming || []);
      setOutgoing(data.outgoing || []);
      setClient(current => current || (data.organisations || []).find((org:Org) => org.owner)?.id || '');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load agency workspace'); }
    finally { setLoading(false); }
  }, [request]);
  useEffect(() => { void refresh(); }, [refresh]);
  const owners = useMemo(() => orgs.filter(org => org.owner), [orgs]);
  const active = useMemo(() => incoming.filter(grant => grant.status === 'active'), [incoming]);
  const pending = useMemo(() => incoming.filter(grant => grant.status === 'pending'), [incoming]);
  const revoked = outgoing.filter(grant => grant.status === 'revoked').length;
  const selectedPermissions = preset === 'custom' ? permissions : presetPermissions(preset);
  const visibleModules = MODULES.filter(([key]) => selectedPermissions[key]?.view).length;
  async function act(body: unknown, success = 'Changes saved successfully.') {
    setBusy(true); setError(''); setNotice('');
    try { await request('POST',body); setNotice(success); await refresh(); return true; }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not save changes'); return false; }
    finally { setBusy(false); }
  }
  const handleInvite = async () => {
    if (!client || (type === 'individual' ? !email.trim() : !agencyId.trim())) { setError('Choose an organisation and enter the recipient details.'); return; }
    const ok = await act({ operation:'invite', client_organisation_id:client, grantee_type:type, grantee_email: type === 'individual' ? email.trim() : '', grantee_organisation_id: type === 'organisation' ? agencyId.trim() : '', permissions:selectedPermissions }, 'Invitation created successfully.');
    if (ok) { setShowInvite(false); setEmail(''); setAgencyId(''); setTab('outgoing'); }
  };
  return <main className="min-h-screen bg-[#FAFBF8] px-4 py-6 text-[#1C352C] sm:px-6 lg:px-10 lg:py-9">
    <div className="mx-auto max-w-[1440px] space-y-7">
      <header className="relative overflow-hidden rounded-[28px] bg-[#103D31] px-6 py-7 text-white shadow-[0_16px_40px_rgba(11,49,38,0.12)] sm:px-9 sm:py-9">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-44 h-[410px] w-[410px] rounded-full border border-white/15" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-2 -top-28 h-[310px] w-[310px] rounded-full border border-white/10" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div><div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.23em] text-[#C9DCCF]"><span className="h-1.5 w-1.5 rounded-full bg-[#B6D3BE]"/> ORBI. / Workspace</div><h1 className="font-serif text-4xl tracking-tight sm:text-5xl">Agency workspace<span className="text-[#BBD4C3]">.</span></h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#D8E8DE] sm:text-base">A considered space to manage your organisations, client relationships and access permissions — all from one place.</p></div>
          <div className="flex flex-wrap gap-2"><Link href="/agency/approvals" className="inline-flex items-center gap-2 rounded-xl bg-[#F5F2E9] px-4 py-3 text-sm font-semibold text-[#103D31] hover:bg-white"><Check size={16}/> Client approvals</Link><button type="button" onClick={() => void refresh()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-medium text-white hover:bg-white/20 disabled:opacity-60"><RefreshCw size={16} className={loading?'animate-spin':''}/>Refresh</button>{owners.length>0&&<button type="button" onClick={()=>setShowInvite(true)} className="inline-flex items-center gap-2 rounded-xl bg-[#F5F2E9] px-4 py-3 text-sm font-semibold text-[#103D31] hover:bg-white"><Plus size={17}/> Invite access</button>}</div>
        </div>
      </header>
      <AgencyContextPicker />
      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle size={18} className="shrink-0"/>{error}<button onClick={()=>setError('')} className="ml-auto" aria-label="Dismiss error"><X size={17}/></button></div>}
      {notice && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><Check size={18}/>{notice}<button onClick={()=>setNotice('')} className="ml-auto" aria-label="Dismiss notice"><X size={17}/></button></div>}
      <section aria-label="Workspace overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label:'My organisations', value:orgs.length, icon:Building2, detail:'Connected to your account' },
          { label:'Active client access', value:active.length, icon:ShieldCheck, detail:'Accepted invitations' },
          { label:'Awaiting acceptance', value:pending.length, icon:Clock3, detail:'Invitations received' },
          { label:'Access granted', value:outgoing.length-revoked, icon:Users, detail:'Current outgoing grants' },
        ].map(({label,value,icon:Icon,detail})=><div key={label} className={`${card} p-5 sm:p-6`}><div className="flex items-start justify-between"><span className="text-xs font-semibold uppercase tracking-[0.1em] text-[#66796F]">{label}</span><span className="rounded-xl bg-[#EDF4EE] p-2.5 text-[#245A46]"><Icon size={19}/></span></div><div className="mt-3 font-serif text-4xl text-[#103D31]">{loading?'—':value}</div><p className="mt-1 text-xs text-[#738178]">{detail}</p></div>)}
      </section>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className={`${card} min-w-0 overflow-hidden`}>
          <div className="border-b border-[#E8EDE7] px-5 pt-6 sm:px-7"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6D8978]">Relationships</p><h2 className="mt-1 font-serif text-[27px] text-[#103D31]">Access & invitations</h2><p className="mt-1 text-sm text-[#687B70]">Review permissions and invitations across your workspace.</p></div><span className="rounded-full bg-[#EDF4EE] px-3 py-1.5 text-xs font-semibold text-[#245A46]">{incoming.length+outgoing.length} total records</span></div>
            <div className="mt-6 flex gap-5 overflow-x-auto">{([{key:'active',label:'Active access',count:active.length},{key:'pending',label:'Pending',count:pending.length},{key:'outgoing',label:'Access granted',count:outgoing.length}] as const).map(item=><button type="button" key={item.key} onClick={()=>setTab(item.key)} className={`whitespace-nowrap border-b-[3px] pb-3 text-sm font-semibold transition ${tab===item.key?'border-[#103D31] text-[#103D31]':'border-transparent text-[#84958B] hover:text-[#103D31]'}`}>{item.label}<span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] ${tab===item.key?'bg-[#E5F0E8] text-[#245A46]':'bg-[#F0F2EF] text-[#7B8C80]'}`}>{item.count}</span></button>)}</div></div>
          <div className="space-y-3 p-5 sm:p-7">
            {loading?<div className="py-14 text-center text-sm text-[#7A8B80]">Loading your workspace…</div>:tab==='active' ? (active.length?active.map(grant=><GrantRow key={grant.id} grant={grant} mode="active"/>):<Empty title="No active client access yet" description="Accepted invitations will appear here once access is granted." icon={ShieldCheck}/> ) : tab==='pending' ? (pending.length?pending.map(grant=><GrantRow key={grant.id} grant={grant} mode="pending" busy={busy} onAction={()=>void act({operation:'accept',id:grant.id},'Invitation accepted successfully.')}/>):<Empty title="You're all caught up" description="New invitations will appear here when someone invites you." icon={Clock3}/>) : (outgoing.length?outgoing.map(grant=><GrantRow key={grant.id} grant={grant} mode="outgoing" busy={busy} onAction={()=>{if(window.confirm(`Revoke access for ${grant.grantee_email || grant.agency_name || grant.client_name}?`))void act({operation:'revoke',id:grant.id},'Access revoked successfully.');}}/>):<Empty title="No invitations sent" description="Invite a person or agency to collaborate with your organisation." icon={Users}/>)}
          </div>
        </section>
        <aside className="space-y-5">
          <div className={`${card} p-6`}><div className="flex items-center gap-3"><span className="rounded-xl bg-[#E9F2EA] p-3 text-[#205C46]"><Building2 size={20}/></span><div><p className="text-xs uppercase tracking-widest text-[#7B8E82]">Your workspace</p><h3 className="font-serif text-xl">Organisations</h3></div></div><div className="mt-5 space-y-2">{orgs.length?orgs.map(org=><div key={org.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#E9EEE9] bg-[#FBFCFA] px-3.5 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{org.name}</p><p className="mt-0.5 text-xs text-[#809085]">{org.owner?'Owner':'Member'}</p></div><span className="shrink-0 rounded-full bg-[#EDF4EE] px-2.5 py-1 text-[11px] text-[#326B52]">{org.owner?'Owner':'Access'}</span></div>):<p className="text-sm text-[#738479]">No organisations available.</p>}</div></div>
          <div className="rounded-[22px] bg-[#EAF1E9] p-6"><div className="flex items-center gap-2 text-[#245B46]"><ShieldCheck size={20}/><span className="text-xs font-bold uppercase tracking-widest">Designed for control</span></div><h3 className="mt-4 font-serif text-2xl text-[#103D31]">Your clients. Their data.</h3><p className="mt-3 text-sm leading-6 text-[#536F5D]">Client organisations retain ownership of their data. Access is invitation-based and can be revoked by an organisation owner.</p><p className="mt-4 border-t border-[#D5E3D6] pt-4 text-xs leading-5 text-[#5E7564]">Important: invitations do not yet grant safe cross-organisation access to existing ORBI. modules. Backend authorisation, RLS and entitlement checks must be integrated first.</p></div>
          {owners.length>0&&<button type="button" onClick={()=>setShowInvite(true)} className="flex w-full items-center justify-between rounded-[18px] border border-[#DCE8DE] bg-white p-4 text-left text-sm font-semibold text-[#174A38] transition hover:border-[#8BAF99]"><span className="flex items-center gap-2"><Plus size={18}/>Grant new access</span><ArrowUpRight size={18}/></button>}
        </aside>
      </div>
      {showInvite&&<div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#071B14]/65 p-3 backdrop-blur-[3px] sm:p-5" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setShowInvite(false)}}><section role="dialog" aria-modal="true" aria-labelledby="invite-title" className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-[26px] bg-[#FAFBF8] shadow-2xl"><div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#E1E9E1] bg-[#FAFBF8] px-5 py-5 sm:px-7"><div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#688875]">Access management</p><h2 id="invite-title" className="mt-1 font-serif text-3xl text-[#103D31]">Invite a collaborator</h2><p className="mt-1 text-sm text-[#66796E]">Give a person or agency controlled access to your organisation.</p></div><button type="button" onClick={()=>setShowInvite(false)} disabled={busy} aria-label="Close invitation" className="rounded-xl border border-[#DCE6DC] bg-white p-2 text-[#315846]"><X size={20}/></button></div>
          <div className="space-y-6 px-5 py-6 sm:px-7"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Client organisation<select className={input} value={client} onChange={e=>setClient(e.target.value)}>{owners.map(org=><option key={org.id} value={org.id}>{org.name}</option>)}</select></label><label className="text-sm font-semibold">Invite type<select className={input} value={type} onChange={e=>setType(e.target.value as 'individual'|'organisation')}><option value="individual">Individual person</option><option value="organisation">Agency organisation</option></select></label></div>
            {type==='individual'?<label className="block text-sm font-semibold">Their ORBI. email<input type="email" className={input} placeholder="person@example.com" value={email} onChange={e=>setEmail(e.target.value)}/></label>:<label className="block text-sm font-semibold">Agency organisation name or registered email<input className={input} placeholder="Agency name or email" value={agencyId} onChange={e=>setAgencyId(e.target.value)}/><span className="mt-1.5 block text-xs font-normal text-[#7C8C80]">The receiving organisation owner must accept this invitation.</span></label>}
            <div><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-serif text-2xl text-[#103D31]">Access level</h3><p className="mt-1 text-xs text-[#6D8072]">Choose a preset or customise every module permission.</p></div><button type="button" onClick={()=>{if(preset!=='custom')setPermissions(presetPermissions(preset));setShowAdvanced(true)}} className="inline-flex items-center gap-2 rounded-xl border border-[#C9D9CD] bg-white px-3.5 py-2 text-xs font-semibold text-[#20533E]"><SlidersHorizontal size={15}/> Advanced</button></div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">{PRESETS.map(option=>{const Icon=option.icon;return <button type="button" key={option.id} onClick={()=>{setPreset(option.id);if(option.id==='custom')setShowAdvanced(true);else setPermissions(presetPermissions(option.id));}} className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${preset===option.id?'border-[#34765A] bg-[#EAF3EB] ring-1 ring-[#34765A]':'border-[#E2E9E1] bg-white hover:border-[#A4BEA9]'}`}><span className="rounded-lg bg-white/80 p-2 text-[#28634B]"><Icon size={18}/></span><span className="flex-1"><span className="flex items-center justify-between gap-2 text-sm font-semibold">{option.label}{preset===option.id&&<Check size={16}/>}</span><span className="mt-1 block text-xs leading-5 text-[#6B8070]">{option.description}</span></span></button>})}</div>
              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-[#EDF3EC] px-4 py-3 text-xs text-[#3E6850]"><ShieldCheck size={15}/><strong>{visibleModules} of {MODULES.length} modules</strong> selected for viewing. Access is subject to the client's subscription.</div>
            </div>
          </div><div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-3 border-t border-[#E1E9E1] bg-[#FAFBF8] px-5 py-4 sm:px-7"><button type="button" onClick={()=>setShowInvite(false)} disabled={busy} className="rounded-xl border border-[#D9E5DB] bg-white px-4 py-2.5 text-sm font-semibold text-[#28503D]">Cancel</button><button type="button" disabled={busy||!client||(type==='individual'?!email.trim():!agencyId.trim())} onClick={()=>void handleInvite()} className={button}><Users size={16}/>{busy?'Creating…':'Create invitation'}<ChevronRight size={16}/></button></div>
        </section></div>}
      {showAdvanced&&<div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#071B14]/70 p-3 sm:p-5" onMouseDown={e=>{if(e.target===e.currentTarget)setShowAdvanced(false)}}><section role="dialog" aria-modal="true" aria-labelledby="permissions-title" className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[24px] bg-white p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#71907B]">Fine-grained control</p><h2 id="permissions-title" className="mt-1 font-serif text-3xl text-[#103D31]">Advanced permissions</h2><p className="mt-2 text-sm text-[#6B7D70]">Choose what collaborators can do in each module.</p></div><button type="button" onClick={()=>setShowAdvanced(false)} className="rounded-xl border border-[#DCE6DD] p-2" aria-label="Close advanced permissions"><X size={19}/></button></div><div className="mt-6 overflow-x-auto rounded-xl border border-[#E4EBE4]"><table className="w-full min-w-[780px] text-sm"><thead className="bg-[#EDF4EE]"><tr><th className="px-4 py-3 text-left">Module</th>{ACTIONS.map(action=><th key={action} className="px-2 py-3 text-center text-xs capitalize">{action.replace('_',' ')}</th>)}</tr></thead><tbody>{MODULES.map(([key,label])=><tr key={key} className="border-t border-[#E9EEE9] hover:bg-[#FAFCF9]"><td className="px-4 py-3 font-semibold">{label}</td>{ACTIONS.map(action=><td key={action} className="px-2 py-3 text-center"><input type="checkbox" className="h-4 w-4 accent-[#14543E]" aria-label={`${label}: ${action}`} checked={!!(preset==='custom'?permissions:presetPermissions(preset))[key]?.[action]} onChange={e=>{setPermissions(current=>{const base=preset==='custom'?current:presetPermissions(preset);return {...base,[key]:{...base[key],[action]:e.target.checked}};});setPreset('custom');}}/></td>)}</tr>)}</tbody></table></div><div className="mt-6 flex justify-end"><button type="button" onClick={()=>setShowAdvanced(false)} className={button}><Check size={16}/>Apply permissions</button></div></section></div>}
      <footer className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#E3EBE2] bg-white px-5 py-4 text-xs leading-5 text-[#677B6D]"><ShieldCheck size={16} className="shrink-0 text-[#3D7956]"/> Agency invitation management uses your existing API. Cross-organisation module access still requires backend permission enforcement and RLS integration.</footer>
    </div>
  </main>;
}
function Empty({title,description,icon:Icon}:{title:string;description:string;icon:typeof ShieldCheck}){return <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#DDE8DD] bg-[#FBFDFB] px-5 py-12 text-center"><span className="rounded-2xl bg-[#EDF4EE] p-4 text-[#377153]"><Icon size={25}/></span><h3 className="mt-4 font-serif text-xl text-[#1A4936]">{title}</h3><p className="mt-1 max-w-sm text-sm text-[#738477]">{description}</p></div>}
function GrantRow({grant,mode,busy,onAction}:{grant:Grant;mode:'active'|'pending'|'outgoing';busy?:boolean;onAction?:()=>void}){const modules=formatModules(grant);const name=mode==='outgoing'?(grant.grantee_type==='organisation'?grant.agency_name||'Agency organisation':grant.grantee_email||'Individual'):grant.client_name;const status=mode==='outgoing'?grant.status:mode==='pending'?'pending':'active';return <div className="rounded-2xl border border-[#E3EAE3] bg-[#FDFEFC] p-4 transition hover:border-[#B8CDBB] sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><span className="shrink-0 rounded-xl bg-[#EDF3EE] p-3 text-[#2D684D]">{grant.grantee_type==='organisation'?<Building2 size={19}/>:<UserRound size={19}/>}</span><div className="min-w-0"><h3 className="break-words text-sm font-bold text-[#234536] sm:text-base">{name}</h3><p className="mt-1 text-xs text-[#7C8E80]">{mode==='outgoing'?`Client: ${grant.client_name}`:grant.grantee_type==='organisation'?`Agency: ${grant.agency_name||'Organisation'}`:'Individual access'}</p></div></div><span className={`rounded-full px-3 py-1 text-[11px] font-semibold capitalize ${status==='active'?'bg-[#E5F3E7] text-[#28704A]':status==='pending'?'bg-[#FFF3D9] text-[#89631D]':'bg-[#F1F1F0] text-[#777]'}`}>{status}</span></div>{modules.length>0&&<div className="mt-4 flex flex-wrap gap-1.5">{modules.slice(0,6).map(label=><span key={label} className="rounded-md border border-[#E3EAE3] bg-white px-2.5 py-1 text-[11px] text-[#607A67]">{label}</span>)}{modules.length>6&&<span className="px-2 py-1 text-[11px] text-[#6F8676]">+{modules.length-6} more</span>}</div>}{mode==='pending'&&<button type="button" disabled={busy} onClick={onAction} className={`${button} mt-4`}><Check size={15}/>Accept invitation</button>}{mode==='outgoing'&&grant.status!=='revoked'&&<button type="button" disabled={busy} onClick={onAction} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#EAC8C8] px-3 py-2 text-xs font-semibold text-[#9A3838] hover:bg-red-50 disabled:opacity-50"><LockKeyhole size={14}/>Revoke access</button>}</div>}
