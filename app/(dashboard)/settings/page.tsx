"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { 
  Save, Moon, Sun, Loader2, Landmark, 
  Users, Trash2, Check, Download,
  Eye, EyeOff, UserPlus, AlertTriangle,
  Camera, Mail, Phone, HeartPulse, Palette,
  UserCircle, Fingerprint, Globe, History, Zap, ShieldCheck,
  Upload, Link2, FolderGit, Type, HeartHandshake, ListChecks,
  Database, User, LogOut, Copy, Share2, ShieldAlert,
  ChevronRight, ArrowUpRight, Command, Github, Twitter
} from "lucide-react";

/**
 * TOTS-OS COMMAND CENTER | FULL ARCHITECTURE
 * VERSION: 3.0.0 - ULTRA DENSE
 */

const APP_PAGES = [
  { id: "dashboard", label: "Main Dashboard", description: "Node analytics & system health" },
  { id: "invoices", label: "Invoice Manager", description: "Treasury inflow & outflow" },
  { id: "crm", label: "Client CRM", description: "Entity relationship mapping" },
  { id: "banking", label: "Banking & Ledger", description: "Direct liquidity controls" },
  { id: "projects", label: "Project Boards", description: "Task & sprint orchestration" },
  { id: "settings", label: "System Settings", description: "Kernel & identity configuration" },
  { id: "ai_strategist", label: "AI Strategist", description: "Neural network interface" },
  { id: "archive", label: "Data Archive", description: "Cold storage & history" }
];

const FONTS = [
  { name: "Inter", type: "Sans Serif" },
  { name: "Merriweather", type: "Executive Serif" },
  { name: "Geist", type: "Modern Mono" },
  { name: "Orbitron", type: "Brutalist" },
  { name: "Montserrat", type: "Classic Geometric" }
];

function SettingsContent() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // -- SYSTEM STATES --
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // -- IDENTITY --
  const [user, setUser] = useState<any>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState("STANDARD");
  const [profile, setProfile] = useState<any>({
    full_name: "", phone: "", avatar_url: "", next_of_kin: "", email_signature: ""
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // -- THE HIVE --
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(["dashboard"]);

  // -- BRANDING --
  const [brandColor, setBrandColor] = useState("#a9b897");
  const [secondaryColor, setSecondaryColor] = useState("#e5e7eb");
  const [selectedFont, setSelectedFont] = useState("Inter");
  
  // -- BUSINESS & TREASURY --
  const [bankInfo, setBankInfo] = useState({ name: "", acc: "", sort: "" });
  const [companyDetails, setCompanyDetails] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [nextOfKinPhone, setNextOfKinPhone] = useState("");
  const [currency, setCurrency] = useState("GBP (£)");

  // -- SOCIAL & CAMPAIGNS --
  const [socialLinks, setSocialLinks] = useState({ 
    website: "", instagram: "", linkedin: "", twitter: "", tiktok: "" 
  });
  const [campaignList, setCampaignList] = useState<string[]>([]);
  const [newCampaign, setNewCampaign] = useState("");

  // -- AUDIT --
  const [auditLogs, setAuditLogs] = useState<string[]>(["• System initialization..."]);

  const addLog = useCallback((msg: string) => {
    setAuditLogs(prev => [`• ${msg} [${new Date().toLocaleTimeString()}]`, ...prev]);
  }, []);

  useEffect(() => { init(); }, []);

  async function init() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return router.push("/login");
      
      setUser(authUser);
      setEmail(authUser.email || "");

      const { data: p } = await supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle();
      if (p) setProfile(p);

      const { data: membership } = await supabase.from("team_members").select("team_id").eq("user_id", authUser.id).maybeSingle();
      
      if (membership?.team_id) {
        setTeamId(membership.team_id);
        const [membersRes, settingsRes] = await Promise.all([
          supabase.from("team_members").select("*").eq("team_id", membership.team_id),
          supabase.from("settings").select("*").eq("team_id", membership.team_id).maybeSingle()
        ]);

        if (membersRes.data) setTeamMembers(membersRes.data);
        if (settingsRes.data) {
          const s = settingsRes.data;
          setBrandColor(s.brand_color || "#a9b897");
          setSecondaryColor(s.secondary_color || "#e5e7eb");
          setSelectedFont(s.font_family || "Inter");
          setBankInfo(s.bank_info || { name: "", acc: "", sort: "" });
          setWebhookUrl(s.webhook_url || "");
          setCompanyDetails(s.company_details || "");
          setSocialLinks(s.social_links || { website: "", instagram: "", linkedin: "", twitter: "", tiktok: "" });
          setCampaignList(s.campaigns || []);
          setNextOfKinPhone(s.next_of_kin_phone || "");
        }
      }
      addLog("Node heartbeat detected.");
    } catch (err) { 
      addLog("Sync failure in kernel.");
    } finally { 
      setLoading(false); 
    }
  }

  const handleGlobalSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    addLog("Commencing state commit...");
    try {
      await supabase.from("profiles").update({
        full_name: profile.full_name,
        phone: profile.phone,
        next_of_kin: profile.next_of_kin,
        email_signature: profile.email_signature,
      }).eq("id", user.id);

      if (teamId) {
        await supabase.from("settings").upsert({
          team_id: teamId,
          brand_color: brandColor,
          secondary_color: secondaryColor,
          font_family: selectedFont,
          bank_info: bankInfo,
          webhook_url: webhookUrl,
          company_details: companyDetails,
          social_links: socialLinks,
          campaigns: campaignList,
          next_of_kin_phone: nextOfKinPhone
        });
      }
      addLog("System state synchronized.");
      alert("Committed.");
    } catch (err: any) { 
      addLog(`Error: ${err.message}`);
    } finally { 
      setSaving(false); 
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfaf7]">
      <Loader2 className="animate-spin text-stone-300" size={60} />
      <span className="mt-8 text-[9px] font-black uppercase tracking-[0.8em] opacity-20">Syncing Node...</span>
    </div>
  );

  const inviteLink = `https://www.tots-os.co.uk/login?invite=${teamId}`;

  return (
    <div className={`min-h-screen transition-all duration-1000 ${isDarkMode ? 'bg-stone-950 text-stone-200' : 'bg-[#fcfaf7] text-stone-900'}`}>
      <style jsx global>{`
        body { font-family: '${selectedFont}', sans-serif; overflow-x: hidden; }
        .ultra-card { transition: all 0.6s cubic-bezier(0.2, 1, 0.2, 1); }
        .ultra-card:hover { transform: translateY(-8px); box-shadow: 0 40px 80px -20px rgba(0,0,0,0.1); }
        .hide-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="max-w-[1700px] mx-auto p-6 md:p-12 lg:p-24 space-y-32">
        
        {/* --- HEADER BLOCK --- */}
        <header className="flex flex-col md:flex-row justify-between items-end gap-12 border-b-2 border-stone-100 pb-24">
          <div className="space-y-8">
            <div className="flex items-center gap-4 opacity-30">
               <Command size={20} />
               <span className="text-[10px] font-black uppercase tracking-[0.6em]">System Control Panel</span>
            </div>
            <h1 className="text-[10rem] md:text-[14rem] font-serif italic tracking-tighter leading-[0.85] select-none" style={{ color: brandColor }}>
              Command
            </h1>
            <div className="flex items-center gap-8 pl-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Uplink Active: {user?.email}</span>
              </div>
              <div className="h-4 w-px bg-stone-200" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Node: 0x932-A</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 items-center">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="group relative w-20 h-20 rounded-full border-2 border-stone-100 bg-white flex items-center justify-center hover:bg-stone-900 transition-all">
               {isDarkMode ? <Sun size={24} className="group-hover:text-white" /> : <Moon size={24} />}
            </button>
            <button onClick={handleGlobalSave} disabled={saving} className="group flex items-center gap-6 px-16 py-10 rounded-full font-black text-[12px] uppercase tracking-[0.3em] text-white shadow-2xl hover:scale-105 active:scale-95 transition-all" style={{ backgroundColor: brandColor }}>
              {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />} 
              Commit Changes
            </button>
            <button onClick={() => supabase.auth.signOut().then(() => router.push("/login"))} className="w-20 h-20 rounded-full border-2 border-red-50 bg-white flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm">
               <LogOut size={24} />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-24">
          
          {/* --- LEFT: CORE CONFIG --- */}
          <div className="lg:col-span-4 space-y-24">
            
            {/* BRANDING ENGINE */}
            <section className="ultra-card bg-white p-16 rounded-[6rem] border border-stone-100 space-y-12 shadow-sm">
              <div className="space-y-2">
                <h2 className="text-[12px] font-black uppercase tracking-[0.5em] opacity-40 flex items-center gap-4"><Palette size={20} /> Identity Aesthetics</h2>
                <p className="text-[10px] font-bold text-stone-300 uppercase">Visual interface global overrides</p>
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center"><label className="text-[9px] font-black uppercase opacity-40">Primary</label><span className="text-[9px] font-mono opacity-20">{brandColor}</span></div>
                  <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-full h-24 rounded-[2rem] cursor-crosshair bg-transparent border-0" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center"><label className="text-[9px] font-black uppercase opacity-40">Secondary</label><span className="text-[9px] font-mono opacity-20">{secondaryColor}</span></div>
                  <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-full h-24 rounded-[2rem] cursor-crosshair bg-transparent border-0" />
                </div>
              </div>

              <div className="space-y-6 pt-6">
                <label className="text-[9px] font-black uppercase opacity-40 tracking-widest ml-1">Typography Suite</label>
                <div className="grid grid-cols-1 gap-3">
                  {FONTS.map(f => (
                    <button key={f.name} onClick={() => setSelectedFont(f.name)} className={`flex justify-between items-center px-8 py-6 rounded-[2rem] border-2 transition-all ${selectedFont === f.name ? 'border-stone-900 bg-stone-900 text-white shadow-xl' : 'border-stone-50 bg-stone-50 text-stone-400 hover:border-stone-200'}`}>
                      <span className="text-sm font-black" style={{ fontFamily: f.name }}>{f.name}</span>
                      <span className="text-[8px] font-black uppercase opacity-40">{f.type}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* IDENTITY NODE */}
            <section className="ultra-card bg-white p-16 rounded-[6rem] border border-stone-100 space-y-12 shadow-sm text-center">
              <div className="relative mx-auto w-64 h-64 rounded-full border-[10px] border-stone-50 overflow-hidden group shadow-inner">
                {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-stone-50 flex items-center justify-center opacity-10"><User size={80} /></div>}
                <label className="absolute inset-0 bg-stone-900/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-all duration-500">
                  <Camera size={32} />
                  <span className="text-[9px] font-black uppercase tracking-widest mt-3">Rotate Image</span>
                  <input type="file" className="hidden" />
                </label>
              </div>
              
              <div className="space-y-6 pt-4">
                <input value={profile.full_name} onChange={e => setProfile({...profile, full_name: e.target.value})} placeholder="Full Identity Name" className="text-center font-serif italic text-4xl w-full bg-transparent outline-none border-b-2 border-stone-50 focus:border-stone-900 pb-4 transition-all" />
                <div className="grid gap-4">
                  <div className="flex items-center gap-6 p-7 bg-stone-50 rounded-[2.5rem] border border-stone-100">
                    <Mail size={18} className="opacity-20" /><input value={email} disabled className="bg-transparent text-[11px] font-black w-full outline-none opacity-40 uppercase tracking-widest" />
                  </div>
                  <div className="flex items-center gap-6 p-7 bg-stone-50 rounded-[2.5rem] border border-stone-100">
                    <Fingerprint size={18} className="opacity-20" /><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New Cipher Passkey" className="bg-transparent text-[11px] font-black w-full outline-none uppercase tracking-widest" />
                  </div>
                </div>
              </div>
            </section>

            {/* LOGS */}
            <section className="bg-stone-900 p-12 rounded-[5rem] space-y-8 shadow-2xl">
              <div className="flex items-center justify-between opacity-50 text-white">
                 <h2 className="text-[9px] font-black uppercase tracking-[0.4em]">Audit Trail</h2>
                 <History size={14} />
              </div>
              <div className="h-48 overflow-y-auto hide-scroll space-y-4 font-mono text-[9px] leading-relaxed text-stone-400">
                {auditLogs.map((log, i) => <p key={i} className={i === 0 ? "text-green-400" : ""}>{log}</p>)}
              </div>
            </section>

          </div>

          {/* --- RIGHT: OPERATIONS --- */}
          <div className="lg:col-span-8 space-y-24">
            
            {/* THE HIVE (RECRUITMENT) */}
            <section className="ultra-card bg-white p-16 md:p-24 rounded-[7rem] border border-stone-100 shadow-sm space-y-20">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                <div className="space-y-4">
                  <h2 className="text-[16px] font-black uppercase tracking-[0.8em] opacity-40 flex items-center gap-6"><Users size={24} /> The Hive</h2>
                  <p className="text-[11px] font-bold text-stone-300 uppercase tracking-widest">Team Node Orchestration & Permissions</p>
                </div>
                <div className="px-10 py-4 bg-stone-50 rounded-full border border-stone-100">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{teamMembers.length} Active Nodes</span>
                </div>
              </div>

              <div className="space-y-12 bg-[#fcfaf7] p-12 md:p-20 rounded-[5rem] border border-stone-100">
                <div className="flex flex-col md:flex-row gap-6">
                  <input placeholder="Search node or email..." value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="flex-1 p-8 rounded-[2.5rem] border border-stone-200 bg-white text-sm font-bold outline-none focus:border-stone-900 transition-all" />
                  <button onClick={() => {}} className="px-16 py-8 bg-stone-900 text-white rounded-[2.5rem] font-black text-[12px] uppercase tracking-widest hover:bg-stone-800 shadow-xl transition-all">Provision</button>
                </div>
                
                <div className="space-y-8">
                  <div className="flex items-center gap-4 opacity-30"><ShieldAlert size={14}/><span className="text-[9px] font-black uppercase tracking-widest">Global Page Permissions</span></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {APP_PAGES.map(p => (
                      <button key={p.id} onClick={() => setSelectedPermissions(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])} className={`group text-left p-6 rounded-[2rem] border-2 transition-all ${selectedPermissions.includes(p.id) ? 'border-stone-900 bg-stone-900 text-white shadow-xl' : 'border-stone-200 bg-white hover:border-stone-400'}`}>
                        <p className="text-[10px] font-black uppercase tracking-widest">{p.label}</p>
                        <p className={`text-[8px] mt-1 font-bold ${selectedPermissions.includes(p.id) ? 'text-white/40' : 'text-stone-300'}`}>{p.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* HANDSHAKE URL */}
              <div className="p-12 bg-stone-50 rounded-[4rem] border border-stone-100 flex flex-col xl:flex-row items-center justify-between gap-12 group">
                <div className="space-y-3 w-full xl:w-auto">
                   <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-300">Public Handshake Node</p>
                   <p className="text-xs font-mono opacity-50 truncate max-w-lg italic">{inviteLink}</p>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(inviteLink); alert("Handshake copied."); }} className="flex items-center gap-6 px-12 py-7 bg-white border border-stone-200 rounded-[2.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-stone-900 hover:text-white transition-all shadow-sm">
                  <Copy size={18} /> Sync Link
                </button>
              </div>

              {/* MEMBERS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {teamMembers.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-10 bg-white rounded-[3.5rem] border border-stone-100 shadow-sm hover:border-stone-400 transition-all group">
                    <div className="flex items-center gap-8">
                      <div className="w-16 h-16 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center font-serif italic text-xl text-stone-300 group-hover:scale-110 group-hover:text-stone-900 transition-all">
                        {m?.email?.charAt(0).toUpperCase()}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-black">{m?.email}</p>
                        <div className="flex gap-2">
                           <span className="text-[8px] font-black uppercase bg-stone-50 px-3 py-1 rounded-full border border-stone-100">{m.role}</span>
                           <span className="text-[8px] font-black uppercase text-stone-300 px-3 py-1">{m.permissions?.length || 0} Pages</span>
                        </div>
                      </div>
                    </div>
                    <button className="p-4 text-stone-100 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={20}/></button>
                  </div>
                ))}
              </div>
            </section>

            {/* TREASURY LEDGER */}
            <section className="ultra-card text-white p-16 md:p-24 rounded-[7rem] shadow-2xl relative overflow-hidden" style={{ backgroundColor: secondaryColor }}>
              <div className="absolute top-0 right-0 p-24 opacity-5 pointer-events-none select-none">
                 <Landmark size={300} />
              </div>
              <div className="relative z-10 space-y-20">
                <div className="flex items-center gap-6 opacity-60">
                   <Landmark size={32} />
                   <h2 className="text-[16px] font-black uppercase tracking-[0.8em]">Treasury Ledger</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-3">Entity Identity</label>
                      <input value={bankInfo.name} onChange={e => setBankInfo({...bankInfo, name: e.target.value})} placeholder="e.g. MONZO BUSINESS" className="w-full bg-white/5 border border-white/10 p-8 rounded-[2.5rem] text-sm font-bold outline-none focus:bg-white/15 transition-all placeholder:text-white/10 uppercase" />
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-3">Account Reference</label>
                      <input value={bankInfo.acc} onChange={e => setBankInfo({...bankInfo, acc: e.target.value})} placeholder="00000000" className="w-full bg-white/5 border border-white/10 p-8 rounded-[2.5rem] text-sm font-mono outline-none focus:bg-white/15 transition-all placeholder:text-white/10 tracking-tighter" />
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-3">Routing Node</label>
                      <input value={bankInfo.sort} onChange={e => setBankInfo({...bankInfo, sort: e.target.value})} placeholder="00-00-00" className="w-full bg-white/5 border border-white/10 p-8 rounded-[2.5rem] text-sm font-mono outline-none focus:bg-white/15 transition-all placeholder:text-white/10 tracking-tighter" />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-3">Global Currency</label>
                      <div className="relative">
                        <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full bg-white/5 border border-white/10 p-8 rounded-[2.5rem] text-sm font-black outline-none appearance-none cursor-pointer focus:bg-white/15 transition-all">
                          <option className="text-black" value="GBP (£)">GBP - British Pound Sterling</option>
                          <option className="text-black" value="USD ($)">USD - United States Dollar</option>
                          <option className="text-black" value="EUR (€)">EUR - Euro Zone</option>
                        </select>
                        <ChevronRight className="absolute right-8 top-1/2 -translate-y-1/2 opacity-20 rotate-90" size={20} />
                      </div>
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-3">Internal Webhook Relay</label>
                      <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://relay.tots-os.co.uk/..." className="w-full bg-white/5 border border-white/10 p-8 rounded-[2.5rem] text-[10px] font-mono outline-none focus:bg-white/15 transition-all placeholder:text-white/10" />
                   </div>
                </div>
              </div>
            </section>

            {/* PLATFORMS & CAMPAIGNS */}
            <section className="ultra-card bg-white p-16 md:p-24 rounded-[7rem] border border-stone-100 shadow-sm space-y-24">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-24">
                
                <div className="space-y-12">
                   <h2 className="text-[12px] font-black uppercase tracking-[0.6em] opacity-40 flex items-center gap-6"><Globe size={22} /> Global Handshakes</h2>
                   <div className="space-y-5">
                      {Object.keys(socialLinks).map((key) => (
                        <div key={key} className="flex items-center gap-6 p-7 bg-stone-50 border border-stone-100 rounded-[2.5rem] group hover:border-stone-900 transition-all">
                          <div className="w-10 h-10 flex items-center justify-center opacity-20 group-hover:opacity-100 transition-all">
                            {key === 'twitter' ? <Twitter size={18}/> : key === 'website' ? <Globe size={18}/> : <Share2 size={18}/>}
                          </div>
                          <input value={(socialLinks as any)[key]} onChange={e => setSocialLinks({...socialLinks, [key]: e.target.value})} placeholder={key.toUpperCase() + ' NODE'} className="w-full bg-transparent text-[11px] font-black uppercase tracking-widest outline-none" />
                        </div>
                      ))}
                   </div>
                </div>

                <div className="space-y-12">
                   <h2 className="text-[12px] font-black uppercase tracking-[0.6em] opacity-40 flex items-center gap-6"><Zap size={22} /> Campaign Registry</h2>
                   <div className="flex gap-4">
                     <input value={newCampaign} onChange={e => setNewCampaign(e.target.value)} placeholder="New Campaign ID..." className="flex-1 p-8 bg-stone-50 border border-stone-200 rounded-[2.5rem] text-xs font-bold outline-none focus:border-stone-900" />
                     <button onClick={() => { if(newCampaign){ setCampaignList([...campaignList, newCampaign]); setNewCampaign(""); }}} className="w-20 h-20 bg-stone-900 text-white rounded-full flex items-center justify-center hover:scale-105 shadow-xl transition-all"><Check size={24}/></button>
                   </div>
                   <div className="h-80 overflow-y-auto hide-scroll space-y-3">
                     {campaignList.map((c, i) => (
                       <div key={i} className="flex justify-between items-center bg-stone-50 p-8 border border-stone-100 rounded-[3rem] group hover:bg-white hover:border-stone-900 transition-all">
                         <div className="space-y-1">
                           <p className="text-[10px] font-black uppercase tracking-widest">{c}</p>
                           <p className="text-[8px] font-bold text-stone-300">ACTIVE CAMPAIGN NODE</p>
                         </div>
                         <button onClick={() => setCampaignList(campaignList.filter((_, idx) => idx !== i))} className="text-stone-200 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                       </div>
                     ))}
                     {campaignList.length === 0 && <div className="h-full flex items-center justify-center opacity-10 font-black text-[9px] uppercase tracking-[1em]">No Active Nodes</div>}
                   </div>
                </div>

              </div>
            </section>

            {/* COMMS & METADATA */}
            <section className="ultra-card bg-white p-16 md:p-24 rounded-[7rem] border border-stone-100 shadow-sm space-y-16">
               <div className="grid grid-cols-1 xl:grid-cols-2 gap-16">
                 <div className="space-y-6">
                   <h2 className="text-[12px] font-black uppercase tracking-[0.6em] opacity-40 flex items-center gap-5"><Type size={22}/> Comms Signature</h2>
                   <textarea value={profile.email_signature} onChange={e => setProfile({...profile, email_signature: e.target.value})} placeholder="Professional automated closure..." className="w-full h-80 p-12 rounded-[4rem] border border-stone-100 bg-stone-50/50 text-sm italic font-serif outline-none resize-none leading-relaxed focus:bg-white focus:border-stone-900 transition-all" />
                 </div>
                 <div className="space-y-6">
                   <h2 className="text-[12px] font-black uppercase tracking-[0.6em] opacity-40 flex items-center gap-5"><Database size={22}/> Corporate Registry</h2>
                   <textarea value={companyDetails} onChange={e => setCompanyDetails(e.target.value)} placeholder="VAT No., Reg. Office, HQ Address, Operations Node..." className="w-full h-80 p-12 rounded-[4rem] border border-stone-100 bg-stone-50/50 text-[10px] font-black uppercase tracking-[0.5em] outline-none resize-none leading-[2.5] focus:bg-white focus:border-stone-900 transition-all" />
                 </div>
               </div>
            </section>

            {/* DANGER ZONE */}
            <section className="bg-red-50/30 border-2 border-red-100 p-16 md:p-24 rounded-[7rem] flex flex-col xl:flex-row gap-12 items-center justify-between">
              <div className="flex items-center gap-10 text-red-600">
                <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle size={40} />
                </div>
                <div className="space-y-2 text-center xl:text-left">
                  <h2 className="text-[18px] font-black uppercase tracking-[0.8em]">Emergency Protocol</h2>
                  <p className="text-[10px] font-black opacity-50 uppercase tracking-[0.2em]">De-provision node & permanent system wipe.</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-6 w-full xl:w-auto">
                <button className="flex-1 px-16 py-8 bg-white border-2 border-red-100 text-red-500 rounded-full font-black text-[12px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm">
                   <Download size={20} className="inline mr-4"/> Data Export
                </button>
                <button className="flex-1 px-16 py-8 bg-red-600 text-white rounded-full font-black text-[12px] uppercase tracking-widest hover:shadow-2xl hover:scale-105 active:scale-95 transition-all">
                  Execute Wipe
                </button>
              </div>
            </section>

          </div>
        </div>

        {/* --- FOOTER BRUTALISM --- */}
        <footer className="border-t-2 border-stone-100 pt-24 pb-12 flex flex-col md:flex-row justify-between items-center gap-12 opacity-20">
           <div className="flex items-center gap-10">
              <span className="text-[10px] font-black uppercase tracking-[1em]">TOTS-OS</span>
              <div className="w-2 h-2 rounded-full bg-stone-900" />
              <span className="text-[10px] font-black uppercase tracking-[1em]">2026</span>
           </div>
           <div className="flex gap-12">
              <Github size={20} />
              <Twitter size={20} />
           </div>
        </footer>

      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fcfaf7] flex items-center justify-center"><Loader2 className="animate-spin text-stone-200" size={40} /></div>}>
      <SettingsContent />
    </Suspense>
  );
}