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
  Database, User, LogOut, Copy, Share2, ShieldAlert
} from "lucide-react";

/**
 * TOTS-OS COMMAND CENTER - FULL VERSION 2.8.5
 * Includes: Identity, Hive Recruitment, Treasury Ledger, Brand Arch, Comms & Danger Zone.
 */

const APP_PAGES = [
  { id: "dashboard", label: "Main Dashboard" },
  { id: "invoices", label: "Invoice Manager" },
  { id: "crm", label: "Client CRM" },
  { id: "banking", label: "Banking & Ledger" },
  { id: "projects", label: "Project Boards" },
  { id: "settings", label: "System Settings" },
  { id: "ai_strategist", label: "AI Strategist" },
  { id: "archive", label: "Data Archive" }
];

const FONTS = ["Inter", "Merriweather", "Geist", "Orbitron", "Montserrat"];

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
  
  // -- IDENTITY & AUTH --
  const [user, setUser] = useState<any>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState("STANDARD");
  const [profile, setProfile] = useState<any>({
    full_name: "", phone: "", avatar_url: "", next_of_kin: "", email_signature: ""
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // -- THE HIVE (TEAM OPERATIONS) --
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(["dashboard"]);

  // -- BRAND ARCHITECTURE --
  const [brandColor, setBrandColor] = useState("#a9b897");
  const [secondaryColor, setSecondaryColor] = useState("#e5e7eb");
  const [selectedFont, setSelectedFont] = useState("Inter");
  
  // -- TREASURY & BUSINESS --
  const [bankInfo, setBankInfo] = useState({ name: "", acc: "", sort: "" });
  const [companyDetails, setCompanyDetails] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [nextOfKinPhone, setNextOfKinPhone] = useState("");
  const [currency, setCurrency] = useState("GBP (£)");

  // -- ECOSYSTEM & CAMPAIGNS --
  const [socialLinks, setSocialLinks] = useState({ 
    website: "", instagram: "", linkedin: "", twitter: "", tiktok: "" 
  });
  const [campaignList, setCampaignList] = useState<string[]>([]);
  const [newCampaign, setNewCampaign] = useState("");

  // -- SYSTEM LOGS --
  const [auditLogs, setAuditLogs] = useState<string[]>(["• Kernel Cold Boot Sequence..."]);

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
      if (p) {
        setProfile({
          full_name: p.full_name || "",
          phone: p.phone || "",
          avatar_url: p.avatar_url || "",
          next_of_kin: p.next_of_kin || "",
          email_signature: p.email_signature || ""
        });
        if (p.tier) setCurrentTier(p.tier.toUpperCase());
      }

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
      addLog(`Secure Sync Established: ${authUser.email}`);
    } catch (err) { 
      console.error("Init Failure", err);
      addLog("Sync Deviation Detected.");
    } finally { 
      setLoading(false); 
    }
  }

  const handleGlobalSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    addLog("Commencing Global Commit...");
    
    try {
      // 1. Identity Profile Sync
      const { error: profileErr } = await supabase.from("profiles").update({
        full_name: profile.full_name,
        phone: profile.phone,
        next_of_kin: profile.next_of_kin,
        email_signature: profile.email_signature,
      }).eq("id", user.id);
      if (profileErr) throw profileErr;

      // 2. Auth Node Sync
      if (password) {
        const { error: authErr } = await supabase.auth.updateUser({ password });
        if (authErr) throw authErr;
        setPassword("");
        addLog("Auth security keys rotated.");
      }

      // 3. System Global Settings Sync
      if (teamId) {
        const { error: settingsErr } = await supabase.from("settings").upsert({
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
        if (settingsErr) throw settingsErr;
      }

      addLog("System Matrix Update: SUCCESS.");
      alert("Changes Committed to Node.");
    } catch (err: any) { 
      addLog(`COMMIT ERROR: ${err.message}`);
      alert("Critical Sync Error: " + err.message); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail || !teamId) return;
    try {
      const { error } = await supabase.from("team_members").insert({
        team_id: teamId,
        email: inviteEmail.toLowerCase().trim(),
        role: "member",
        permissions: selectedPermissions 
      });
      if (error) throw error;
      addLog(`Invited Node: ${inviteEmail}`);
      setInviteEmail("");
      init();
    } catch (err: any) { 
      addLog(`Provision Error: ${err.message}`);
    }
  };

  const togglePermission = (id: string) => {
    setSelectedPermissions(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfaf7]">
      <Loader2 className="animate-spin text-[#a9b897]" size={56} />
      <p className="mt-6 text-[10px] font-black uppercase tracking-[0.6em] text-stone-300">Decrypting System Node...</p>
    </div>
  );

  const publicInviteLink = typeof window !== 'undefined' ? `${window.location.origin}/login?invite=${teamId}` : '';

  return (
    <div className={`min-h-screen transition-colors duration-700 ${isDarkMode ? 'bg-stone-950 text-stone-200' : 'bg-[#fcfaf7] text-stone-900'}`}>
      <style jsx global>{`
        body { font-family: '${selectedFont}', sans-serif; transition: background 0.5s; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${brandColor}40; border-radius: 10px; }
        .command-card { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .command-card:hover { transform: translateY(-4px); box-shadow: 0 30px 60px -12px rgba(0,0,0,0.05); }
      `}</style>

      <div className="max-w-[1650px] mx-auto p-6 lg:p-20 space-y-20 pb-40">
        
        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row justify-between items-end gap-10 border-b border-stone-200/60 pb-20">
          <div className="space-y-6">
            <h1 className="text-9xl md:text-[12rem] font-serif italic tracking-tighter leading-none" style={{ color: brandColor }}>Command</h1>
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.5em] opacity-40">
                <ShieldCheck size={14} /> Active Node: {user?.email}
              </span>
              <span className="px-5 py-1.5 bg-stone-100 rounded-full text-[8px] font-black uppercase tracking-widest">{currentTier} TIER</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-5">
            <button onClick={() => supabase.auth.signOut().then(() => router.push("/login"))} className="flex items-center gap-3 px-10 py-7 rounded-[2.5rem] border border-red-100 bg-white font-black text-[10px] uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all shadow-sm">
               <LogOut size={16} /> Exit
            </button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-7 rounded-[2.5rem] border border-stone-200 bg-white hover:bg-stone-50 transition-all shadow-sm">
               {isDarkMode ? <Sun size={28} className="text-orange-400"/> : <Moon size={28} />}
            </button>
            <button onClick={handleGlobalSave} disabled={saving} className="flex items-center gap-5 px-16 py-7 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-2xl text-white" style={{ backgroundColor: brandColor }}>
              {saving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20} />} Commit Changes
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
          
          {/* --- LEFT COLUMN: IDENTITY & VISUALS --- */}
          <div className="lg:col-span-4 space-y-16">
            
            {/* PROFILE MODULE */}
            <section className="command-card bg-white p-12 rounded-[5rem] border border-stone-100 shadow-sm space-y-12">
              <div className="relative group w-56 h-56 mx-auto rounded-full bg-stone-50 border-8 border-dashed border-stone-100 flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <UserCircle size={80} className="opacity-10" />}
                <label className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer">
                  <Camera size={28} />
                  <span className="text-[8px] font-black uppercase mt-2">Upload Profile</span>
                  <input type="file" className="hidden" />
                </label>
              </div>
              <input value={profile?.full_name} onChange={e => setProfile({...profile, full_name: e.target.value})} placeholder="Identity Name" className="text-center font-serif italic text-4xl w-full bg-transparent outline-none border-b border-transparent focus:border-stone-100 pb-4" />
              
              <div className="space-y-5">
                <div className="flex items-center gap-5 p-7 bg-stone-50 rounded-[2.5rem] border border-stone-100">
                  <Mail size={20} className="text-stone-300" /><input value={email} onChange={e => setEmail(e.target.value)} className="bg-transparent text-xs font-bold outline-none w-full" />
                </div>
                <div className="flex items-center gap-5 p-7 bg-stone-50 rounded-[2.5rem] border border-stone-100">
                  <Fingerprint size={20} className="text-stone-300" /><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Update Passkey" className="bg-transparent text-xs font-bold outline-none w-full" />
                </div>
                <div className="flex items-center gap-5 p-7 bg-stone-50 rounded-[2.5rem] border border-stone-100">
                  <Phone size={20} className="text-stone-300" /><input value={profile?.phone} onChange={e => setProfile({...profile, phone: e.target.value})} placeholder="System Contact" className="bg-transparent text-xs font-bold outline-none w-full" />
                </div>
              </div>
            </section>

            {/* BRAND ARCHITECTURE */}
            <section className="command-card bg-white p-12 rounded-[5rem] border border-stone-100 shadow-sm space-y-10">
              <h2 className="text-[11px] font-black uppercase tracking-[0.5em] opacity-40 flex items-center gap-4"><Palette size={18} /> Architecture</h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-1">Primary Color</label>
                  <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-full h-16 rounded-3xl cursor-pointer bg-stone-50 border border-stone-100" />
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-1">Secondary</label>
                  <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-full h-16 rounded-3xl cursor-pointer bg-stone-50 border border-stone-100" />
                </div>
              </div>
              <div className="space-y-4 pt-4">
                <label className="text-[9px] font-black uppercase text-stone-400 ml-1">System Typography</label>
                <div className="grid grid-cols-1 gap-2">
                  {FONTS.map(f => (
                    <button key={f} onClick={() => setSelectedFont(f)} className={`p-5 rounded-2xl border text-left text-xs font-bold transition-all ${selectedFont === f ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-100 bg-stone-50 text-stone-400'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </section>
            
            {/* SYSTEM AUDIT */}
            <section className="command-card bg-white p-12 rounded-[5rem] border border-stone-100 shadow-sm space-y-8">
              <h2 className="text-[11px] font-black uppercase tracking-widest opacity-40 flex items-center gap-4"><History size={18}/> Audit Trail</h2>
              <div className="text-[10px] font-bold opacity-30 space-y-4 h-48 overflow-y-auto custom-scrollbar font-mono leading-relaxed pr-4">
                {auditLogs.map((log, index) => <p key={index}>{log}</p>)}
              </div>
            </section>
          </div>

          {/* --- RIGHT COLUMN: OPERATIONS & LOGISTICS --- */}
          <div className="lg:col-span-8 space-y-16">
            
            {/* THE HIVE (RECRUITMENT) */}
            <section className="command-card bg-white p-16 rounded-[6rem] border border-stone-100 shadow-sm space-y-16">
              <div className="flex justify-between items-end">
                <div className="space-y-2">
                   <h2 className="text-[14px] font-black uppercase tracking-[0.6em] opacity-40 flex items-center gap-5"><Users size={22} /> The Hive</h2>
                   <p className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">Team Permission Management</p>
                </div>
                <span className="text-[10px] font-black uppercase bg-stone-100 px-6 py-3 rounded-full">{teamMembers.length} ACTIVE NODES</span>
              </div>

              {/* INVITE NODE */}
              <div className="space-y-8 bg-stone-50 p-12 rounded-[4rem] border border-stone-100">
                <div className="flex flex-col md:flex-row gap-5">
                  <input placeholder="Provision email identity..." value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="flex-1 p-6 rounded-[2rem] border border-stone-200 bg-white text-sm font-bold outline-none" />
                  <button onClick={handleInvite} className="px-12 py-6 bg-stone-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl">Recruit Node</button>
                </div>
                <div className="space-y-4">
                  <p className="text-[9px] font-black uppercase opacity-30 ml-2 tracking-widest">Initial Access Toggles</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {APP_PAGES.map(p => (
                      <button key={p.id} onClick={() => togglePermission(p.id)} className={`p-5 rounded-2xl border text-[10px] font-black uppercase transition-all ${selectedPermissions.includes(p.id) ? 'border-stone-900 bg-stone-900 text-white shadow-lg' : 'border-stone-200 text-stone-400 bg-white hover:border-stone-300'}`}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* PUBLIC LINK */}
              <div className="p-10 bg-stone-50 rounded-[4rem] border border-stone-100 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">External Handshake URL</p>
                  <p className="text-[12px] font-mono opacity-50 truncate max-w-md">{publicInviteLink}</p>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(publicInviteLink); alert("Handshake Link Copied."); }} className="flex items-center gap-4 px-10 py-5 bg-white border border-stone-200 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-stone-900 hover:text-white transition-all shadow-sm">
                  <Copy size={16} /> Copy
                </button>
              </div>

              {/* NODE LIST */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {teamMembers.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-8 bg-white rounded-[3rem] border border-stone-100 shadow-sm group hover:border-stone-400 transition-all">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center font-black text-[14px] group-hover:scale-110 transition-transform">
                        {m?.email?.charAt(0).toUpperCase()}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-black">{m?.email}</p>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30">{m.role}</p>
                      </div>
                    </div>
                    <button className="p-5 text-stone-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><ShieldAlert size={24}/></button>
                  </div>
                ))}
              </div>
            </section>

            {/* TREASURY LEDGER */}
            <section className="text-white p-16 rounded-[6rem] shadow-2xl relative overflow-hidden command-card" style={{ backgroundColor: secondaryColor }}>
              <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none"><Landmark size={200} /></div>
              <div className="flex items-center gap-5 mb-16 opacity-60"><Landmark size={28} /><h2 className="text-[14px] font-black uppercase tracking-[0.6em]">Treasury Ledger</h2></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
                <div className="space-y-3">
                   <label className="text-[9px] font-black uppercase opacity-40 ml-3 tracking-widest">Bank Identity</label>
                   <input value={bankInfo.name} onChange={e => setBankInfo({...bankInfo, name: e.target.value})} placeholder="INSTITUTION NAME" className="w-full bg-white/10 border border-white/10 p-7 rounded-[2rem] text-sm font-bold outline-none placeholder:text-white/20 focus:bg-white/20 transition-all" />
                </div>
                <div className="space-y-3">
                   <label className="text-[9px] font-black uppercase opacity-40 ml-3 tracking-widest">Account Node</label>
                   <input value={bankInfo.acc} onChange={e => setBankInfo({...bankInfo, acc: e.target.value})} placeholder="00000000" className="w-full bg-white/10 border border-white/10 p-7 rounded-[2rem] text-sm font-mono outline-none focus:bg-white/20 transition-all" />
                </div>
                <div className="space-y-3">
                   <label className="text-[9px] font-black uppercase opacity-40 ml-3 tracking-widest">Routing/Sort</label>
                   <input value={bankInfo.sort} onChange={e => setBankInfo({...bankInfo, sort: e.target.value})} placeholder="00-00-00" className="w-full bg-white/10 border border-white/10 p-7 rounded-[2rem] text-sm font-mono outline-none focus:bg-white/20 transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-10">
                 <div className="space-y-3">
                   <label className="text-[9px] font-black uppercase opacity-40 ml-3 tracking-widest">Currency Locale</label>
                   <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full bg-white/10 border border-white/10 p-7 rounded-[2rem] text-sm font-bold outline-none appearance-none cursor-pointer focus:bg-white/20 transition-all">
                     <option value="GBP (£)">British Pound (£)</option>
                     <option value="USD ($)">US Dollar ($)</option>
                     <option value="EUR (€)">Euro (€)</option>
                   </select>
                 </div>
                 <div className="space-y-3">
                   <label className="text-[9px] font-black uppercase opacity-40 ml-3 tracking-widest">Sync Webhook</label>
                   <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://api.tots-os.com/endpoint" className="w-full bg-white/10 border border-white/10 p-7 rounded-[2rem] text-sm font-mono outline-none focus:bg-white/20 transition-all" />
                 </div>
              </div>
            </section>

            {/* ECOSYSTEM & CAMPAIGNS */}
            <section className="command-card bg-white p-16 rounded-[6rem] border border-stone-100 shadow-sm space-y-16">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                <div className="space-y-10">
                  <h2 className="text-[12px] font-black uppercase tracking-[0.5em] opacity-40 flex items-center gap-5"><Link2 size={22} /> Ecosystem</h2>
                  <div className="space-y-4">
                    {Object.keys(socialLinks).map((key) => (
                      <div key={key} className="flex items-center gap-5 p-6 bg-stone-50 border border-stone-100 rounded-[2rem] group hover:border-stone-400 transition-all">
                        <Globe size={18} className="opacity-20 group-hover:opacity-100 transition-opacity" />
                        <input value={(socialLinks as any)[key]} onChange={e => setSocialLinks({...socialLinks, [key]: e.target.value})} placeholder={key.toUpperCase()} className="w-full bg-transparent text-xs font-bold outline-none" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-10">
                   <h2 className="text-[12px] font-black uppercase tracking-[0.5em] opacity-40 flex items-center gap-5"><Zap size={22} /> Campaign Hub</h2>
                   <div className="flex gap-4">
                     <input value={newCampaign} onChange={e => setNewCampaign(e.target.value)} placeholder="Add identifier..." className="flex-1 p-6 bg-stone-50 border border-stone-200 rounded-[2rem] text-xs font-bold outline-none" />
                     <button onClick={() => { if(newCampaign){ setCampaignList([...campaignList, newCampaign]); setNewCampaign(""); }}} className="px-10 bg-stone-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Inject</button>
                   </div>
                   <div className="h-72 overflow-y-auto custom-scrollbar space-y-3 pr-4">
                     {campaignList.map((c, i) => (
                       <div key={i} className="flex justify-between items-center bg-stone-50 p-6 border border-stone-100 rounded-[2rem] group hover:bg-white transition-all">
                         <span className="text-xs font-bold opacity-60 tracking-wider uppercase">{c}</span>
                         <button onClick={() => setCampaignList(campaignList.filter((_, idx) => idx !== i))} className="text-stone-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                       </div>
                     ))}
                     {campaignList.length === 0 && <p className="text-[10px] opacity-20 italic p-16 text-center tracking-widest">NO ACTIVE CAMPAIGN NODES.</p>}
                   </div>
                </div>
              </div>
            </section>

            {/* COMMS & REGISTRY */}
            <section className="command-card bg-white p-16 rounded-[6rem] border border-stone-100 shadow-sm space-y-16">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                 <div className="space-y-6">
                   <h2 className="text-[12px] font-black uppercase tracking-[0.5em] opacity-40 flex items-center gap-5"><Type size={22}/> Identity Signature</h2>
                   <textarea value={profile.email_signature} onChange={e => setProfile({...profile, email_signature: e.target.value})} placeholder="Professional closure node..." className="w-full h-64 p-12 rounded-[4rem] border border-stone-100 bg-stone-50/50 text-sm italic font-serif outline-none resize-none leading-relaxed focus:bg-white transition-all" />
                 </div>
                 <div className="space-y-6">
                   <h2 className="text-[12px] font-black uppercase tracking-[0.5em] opacity-40 flex items-center gap-5"><Database size={22}/> System Metadata</h2>
                   <textarea value={companyDetails} onChange={e => setCompanyDetails(e.target.value)} placeholder="Registration Number, VAT, HQ Coordinates..." className="w-full h-64 p-12 rounded-[4rem] border border-stone-100 bg-stone-50/50 text-[10px] font-black uppercase tracking-[0.4em] outline-none resize-none leading-loose focus:bg-white transition-all" />
                 </div>
               </div>
            </section>

            {/* DANGER ZONE */}
            <section className="bg-red-50/40 border border-red-100 p-16 rounded-[6rem] flex flex-col md:flex-row gap-10 items-center justify-between">
              <div className="flex items-center gap-6 text-red-600">
                <AlertTriangle size={40} />
                <div className="space-y-2">
                  <h2 className="text-[14px] font-black uppercase tracking-[0.6em]">System Termination</h2>
                  <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">De-provision node & wipe linked data caches.</p>
                </div>
              </div>
              <div className="flex gap-5 w-full md:w-auto">
                <button className="flex-1 px-12 py-7 bg-white border border-red-200 text-red-600 rounded-[2.5rem] font-black text-[11px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm">
                   <Download size={20} className="inline mr-2"/> Export Data
                </button>
                <button className="flex-1 px-12 py-7 bg-red-600 text-white rounded-[2.5rem] font-black text-[11px] uppercase tracking-widest hover:shadow-2xl transition-all">Execute Wipe</button>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfaf7]">
        <Loader2 className="animate-spin text-stone-200" size={64} />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}