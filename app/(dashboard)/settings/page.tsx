"use client";

import { useEffect, useState, Suspense } from "react";
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
 * TOTS-OS MASTER SETTINGS ENGINE
 * VERSION: 2.1.0 - PRODUCTION SECURE
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

const TIERS = ["STANDARD", "PREMIUM", "ELITE", "ENTERPRISE"];

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
  const [logoUrl, setLogoUrl] = useState("");
  
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
  const [emailCampaigns, setEmailCampaigns] = useState("");

  // -- SYSTEM LOGS --
  const [auditLogs, setAuditLogs] = useState<string[]>([
    "• System Kernel initialized.",
    "• Establishing secure handshake..."
  ]);

  useEffect(() => { init(); }, []);

  async function init() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return router.push("/login");
      
      setUser(authUser);
      setEmail(authUser.email || "");

      const { data: p } = await supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle();
      if (p) {
        setProfile(p);
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
          setLogoUrl(s.logo_url || "");
          setSocialLinks(s.social_links || { website: "", instagram: "", linkedin: "", twitter: "", tiktok: "" });
          setCampaignList(s.campaigns || []);
          setNextOfKinPhone(s.next_of_kin_phone || "");
          setEmailCampaigns(s.email_campaigns || "");
        }
      }
      setAuditLogs(prev => [`• Handshake confirmed: ${authUser.email}`, ...prev]);
    } catch (err) { console.error("Init Failure", err); }
    finally { setLoading(false); }
  }

  const handleGlobalSave = async () => {
    if (!user?.id) return alert("System Deviation: No active user node.");
    setSaving(true);
    try {
      // 1. Profile Core
      const { error: profileErr } = await supabase.from("profiles").update({
        full_name: profile?.full_name || "",
        phone: profile?.phone || "",
        next_of_kin: profile?.next_of_kin || "",
        email_signature: profile?.email_signature || "",
        avatar_url: profile?.avatar_url || "",
        tier: currentTier
      }).eq("id", user.id);
      if (profileErr) throw profileErr;

      // 2. Auth Node
      if (email !== user.email || password) {
        const up: any = { email };
        if (password) up.password = password;
        const { error: authErr } = await supabase.auth.updateUser(up);
        if (authErr) throw authErr;
        setPassword(""); 
      }

      // 3. System Global
      if (teamId) {
        const { error: settingsErr } = await supabase.from("settings").upsert({
          team_id: teamId,
          brand_color: brandColor,
          secondary_color: secondaryColor,
          font_family: selectedFont,
          bank_info: bankInfo,
          webhook_url: webhookUrl,
          company_details: companyDetails,
          logo_url: logoUrl,
          social_links: socialLinks,
          campaigns: campaignList,
          next_of_kin_phone: nextOfKinPhone,
          email_campaigns: emailCampaigns
        });
        if (settingsErr) throw settingsErr;
      }

      setAuditLogs(prev => [`• Commit successful at ${new Date().toLocaleTimeString()}`, ...prev]);
      alert("System State Synchronized.");
    } catch (err: any) { alert("Critical Sync Error: " + err.message); }
    finally { setSaving(false); }
  };

  const addCampaign = () => {
    if (newCampaign && !campaignList.includes(newCampaign)) {
      setCampaignList([...campaignList, newCampaign]);
      setNewCampaign("");
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
      setInviteEmail("");
      init();
    } catch (err: any) { alert("Provisioning Error: " + err.message); }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfaf7]">
      <Loader2 className="animate-spin text-[#a9b897]" size={48} />
      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.5em] text-stone-300">Decrypting Node State...</p>
    </div>
  );

  const publicInviteLink = typeof window !== 'undefined' ? `${window.location.origin}/login?invite=${teamId}` : '';

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-stone-950 text-stone-200' : 'bg-[#fcfaf7] text-stone-900'}`}>
      <style jsx global>{`
        body { font-family: '${selectedFont}', sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${brandColor}40; border-radius: 10px; }
      `}</style>

      <div className="max-w-[1600px] mx-auto p-6 lg:p-16 space-y-12 pb-40">
        
        {/* HEADER SECTION */}
        <header className="flex flex-col md:flex-row justify-between items-end gap-8 border-b border-stone-200 pb-16">
          <div className="space-y-4">
            <h1 className="text-8xl md:text-9xl font-serif italic tracking-tighter leading-none" style={{ color: brandColor }}>Command</h1>
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] opacity-40">
                <ShieldCheck size={12} /> Active Node: {user?.email}
              </span>
              <span className="px-4 py-1 bg-stone-100 rounded-full text-[8px] font-black uppercase tracking-widest">{currentTier} Tier</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button onClick={() => supabase.auth.signOut().then(() => router.push("/login"))} className="flex items-center gap-3 px-8 py-6 rounded-3xl border border-red-100 bg-white font-black text-[10px] uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all shadow-sm">
              <LogOut size={16} /> Logout
            </button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-6 rounded-3xl border border-stone-200 bg-white">
               {isDarkMode ? <Sun size={24} className="text-orange-400"/> : <Moon size={24} />}
            </button>
            <button onClick={handleGlobalSave} disabled={saving} className="flex items-center gap-4 px-12 py-6 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-2xl text-white" style={{ backgroundColor: brandColor }}>
              {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} />} Commit Changes
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* SIDEBAR COL */}
          <div className="lg:col-span-4 space-y-12">
            
            {/* IDENTITY MODULE */}
            <section className="bg-white p-10 rounded-[4rem] border border-stone-100 shadow-sm space-y-10">
              <div className="relative group w-44 h-44 mx-auto rounded-full bg-stone-50 border-4 border-dashed border-stone-100 flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <UserCircle size={64} className="opacity-10" />}
                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer">
                  <Camera size={24} />
                  <input type="file" className="hidden" />
                </label>
              </div>
              <input value={profile?.full_name || ""} onChange={e => setProfile({...profile, full_name: e.target.value})} placeholder="Identity Name" className="text-center font-serif italic text-3xl w-full bg-transparent outline-none" />
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-6 bg-stone-50 rounded-3xl border border-stone-100">
                  <Mail size={18} className="text-stone-300" /><input value={email} onChange={e => setEmail(e.target.value)} className="bg-transparent text-xs font-bold outline-none w-full" />
                </div>
                <div className="flex items-center gap-4 p-6 bg-stone-50 rounded-3xl border border-stone-100">
                  <Fingerprint size={18} className="text-stone-300" /><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New Password" className="bg-transparent text-xs font-bold outline-none w-full" />
                </div>
                <div className="flex items-center gap-4 p-6 bg-stone-50 rounded-3xl border border-stone-100">
                  <Phone size={18} className="text-stone-300" /><input value={profile?.phone || ""} onChange={e => setProfile({...profile, phone: e.target.value})} placeholder="Contact Node" className="bg-transparent text-xs font-bold outline-none w-full" />
                </div>
              </div>
            </section>

            {/* VISUAL ARCHITECTURE */}
            <section className="bg-white p-10 rounded-[4rem] border border-stone-100 shadow-sm space-y-8">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 flex items-center gap-3"><Palette size={16} /> Brand Design</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[8px] font-black uppercase text-stone-400">Primary</label>
                  <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-full h-14 rounded-2xl cursor-pointer bg-transparent" />
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-black uppercase text-stone-400">Secondary</label>
                  <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-full h-14 rounded-2xl cursor-pointer bg-transparent" />
                </div>
              </div>
              <div className="space-y-3 pt-4">
                <label className="text-[8px] font-black uppercase text-stone-400">Typography Suite</label>
                <select value={selectedFont} onChange={e => setSelectedFont(e.target.value)} className="w-full p-5 rounded-2xl border border-stone-100 bg-stone-50 text-xs font-bold outline-none appearance-none">
                  <option value="Inter">Inter (Universal Sans)</option>
                  <option value="Merriweather">Merriweather (Executive Serif)</option>
                  <option value="Geist">Geist (Modern Mono)</option>
                  <option value="Orbitron">Cyber (Futuristic)</option>
                </select>
              </div>
            </section>
            
            {/* AUDIT MODULE */}
            <section className="bg-white p-10 rounded-[4rem] border border-stone-100 shadow-sm space-y-6">
              <h2 className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-3"><History size={16}/> Event Logs</h2>
              <div className="text-[9px] font-bold opacity-30 space-y-3 h-32 overflow-y-auto custom-scrollbar font-mono leading-relaxed">
                {auditLogs.map((log, index) => <p key={index}>{log}</p>)}
              </div>
            </section>
          </div>

          {/* MAIN OPERATIONS COL */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* THE HIVE (TEAM RECRUITMENT) */}
            <section className="bg-white p-12 rounded-[5rem] border border-stone-100 shadow-sm space-y-12">
              <div className="flex justify-between items-end">
                <h2 className="text-[12px] font-black uppercase tracking-[0.5em] opacity-40 flex items-center gap-4"><Users size={18} /> The Hive</h2>
                <button onClick={() => router.push('/billing')} className="px-6 py-3 bg-stone-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest">Upgrade Seats</button>
              </div>

              {/* INVITE NODE */}
              <div className="space-y-6 bg-stone-50/50 p-10 rounded-[3.5rem] border border-stone-100">
                <div className="flex gap-4">
                  <input placeholder="Provision email..." value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="flex-1 p-5 rounded-3xl border border-stone-100 bg-white text-xs font-bold outline-none" />
                  <button onClick={handleInvite} className="px-10 py-5 bg-stone-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest">Recruit</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {APP_PAGES.map(p => (
                    <button key={p.id} onClick={() => setSelectedPermissions(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])} className={`p-4 rounded-2xl border text-[9px] font-black uppercase transition-all ${selectedPermissions.includes(p.id) ? 'border-stone-900 bg-stone-900 text-white shadow-lg' : 'border-stone-200 text-stone-400 bg-white'}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* PUBLIC INVITE LINK */}
              <div className="p-8 bg-stone-50 rounded-[3rem] border border-stone-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest">Public Node Link</p>
                  <p className="text-[11px] font-mono opacity-40 truncate max-w-xs">{publicInviteLink}</p>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(publicInviteLink); alert("Link Synchronized."); }} className="flex items-center gap-3 px-8 py-4 bg-white border border-stone-200 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-stone-900 hover:text-white transition-all">
                  <Copy size={14} /> Copy Handshake
                </button>
              </div>

              {/* MEMBER NODES */}
              <div className="space-y-3">
                {teamMembers.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-6 bg-white rounded-[2.5rem] border border-stone-100 shadow-sm group hover:border-stone-300 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center font-black text-[12px] group-hover:scale-110 transition-transform">
                        {m?.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-black">{m?.email}</p>
                        <p className="text-[8px] font-black uppercase tracking-widest opacity-30">{m.role}</p>
                      </div>
                    </div>
                    <button className="p-4 text-stone-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><ShieldAlert size={20}/></button>
                  </div>
                ))}
              </div>
            </section>

            {/* TREASURY LEDGER (BANKING) */}
            <section className="text-white p-14 rounded-[5rem] shadow-2xl relative overflow-hidden" style={{ backgroundColor: secondaryColor }}>
              <div className="absolute top-0 right-0 p-12 opacity-5"><Landmark size={120} /></div>
              <div className="flex items-center gap-4 mb-12 opacity-50"><Landmark size={24} /><h2 className="text-[12px] font-black uppercase tracking-[0.5em]">Treasury Ledger</h2></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                <div className="space-y-2">
                   <label className="text-[8px] font-black uppercase opacity-40 ml-2">Bank Identity</label>
                   <input value={bankInfo.name} onChange={e => setBankInfo({...bankInfo, name: e.target.value})} placeholder="e.g. MONZO" className="w-full bg-white/10 border border-white/10 p-6 rounded-3xl text-sm font-bold outline-none placeholder:text-white/20" />
                </div>
                <div className="space-y-2">
                   <label className="text-[8px] font-black uppercase opacity-40 ml-2">Account No.</label>
                   <input value={bankInfo.acc} onChange={e => setBankInfo({...bankInfo, acc: e.target.value})} placeholder="00000000" className="w-full bg-white/10 border border-white/10 p-6 rounded-3xl text-sm font-mono outline-none placeholder:text-white/20" />
                </div>
                <div className="space-y-2">
                   <label className="text-[8px] font-black uppercase opacity-40 ml-2">Sort Code</label>
                   <input value={bankInfo.sort} onChange={e => setBankInfo({...bankInfo, sort: e.target.value})} placeholder="00-00-00" className="w-full bg-white/10 border border-white/10 p-6 rounded-3xl text-sm font-mono outline-none placeholder:text-white/20" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                 <div className="space-y-2">
                   <label className="text-[8px] font-black uppercase opacity-40 ml-2">Currency Module</label>
                   <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full bg-white/10 border border-white/10 p-6 rounded-3xl text-sm font-bold outline-none appearance-none">
                     <option value="GBP (£)">GBP (£)</option>
                     <option value="USD ($)">USD ($)</option>
                     <option value="EUR (€)">EUR (€)</option>
                   </select>
                 </div>
                 <div className="space-y-2">
                   <label className="text-[8px] font-black uppercase opacity-40 ml-2">Internal Webhook URL</label>
                   <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://api.tots-os.com/..." className="w-full bg-white/10 border border-white/10 p-6 rounded-3xl text-sm font-mono outline-none placeholder:text-white/20" />
                 </div>
              </div>
            </section>

            {/* EXTERNAL ECOSYSTEM (SOCIALS & CAMPAIGNS) */}
            <section className="bg-white p-12 rounded-[5rem] border border-stone-100 shadow-sm space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <div className="space-y-8">
                  <h2 className="text-[11px] font-black uppercase tracking-[0.5em] opacity-40 flex items-center gap-4"><Link2 size={18} /> Social Handshakes</h2>
                  <div className="space-y-3">
                    {Object.keys(socialLinks).map((key) => (
                      <div key={key} className="flex items-center gap-4 p-5 bg-stone-50 border border-stone-100 rounded-3xl">
                        <Globe size={16} className="opacity-20" />
                        <input value={(socialLinks as any)[key]} onChange={e => setSocialLinks({...socialLinks, [key]: e.target.value})} placeholder={key.toUpperCase()} className="w-full bg-transparent text-xs font-bold outline-none" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-8">
                   <h2 className="text-[11px] font-black uppercase tracking-[0.5em] opacity-40 flex items-center gap-4"><Zap size={18} /> Campaign Infrastructure</h2>
                   <div className="flex gap-3">
                     <input value={newCampaign} onChange={e => setNewCampaign(e.target.value)} placeholder="Campaign Ref..." className="flex-1 p-5 bg-stone-50 border border-stone-100 rounded-3xl text-xs font-bold outline-none" />
                     <button onClick={addCampaign} className="px-8 bg-stone-900 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-lg">Inject</button>
                   </div>
                   <div className="h-64 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                     {campaignList.map((c, i) => (
                       <div key={i} className="flex justify-between items-center bg-stone-50 p-5 border border-stone-100 rounded-3xl">
                         <span className="text-xs font-bold opacity-60 italic">REF: {c}</span>
                         <button onClick={() => setCampaignList(campaignList.filter((_, idx) => idx !== i))} className="text-stone-300 hover:text-red-500"><Trash2 size={16}/></button>
                       </div>
                     ))}
                     {campaignList.length === 0 && <p className="text-[10px] opacity-20 italic p-10 text-center">No active campaign nodes.</p>}
                   </div>
                </div>
              </div>
            </section>

            {/* COMMS SIGNATURE & META */}
            <section className="bg-white p-12 rounded-[5rem] border border-stone-100 shadow-sm space-y-12">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <div className="space-y-4">
                   <h2 className="text-[11px] font-black uppercase tracking-widest opacity-40 flex items-center gap-3"><Type size={16}/> Comms Signature</h2>
                   <textarea value={profile?.email_signature || ""} onChange={e => setProfile({...profile, email_signature: e.target.value})} placeholder="Professional identity closure..." className="w-full h-48 p-10 rounded-[3.5rem] border border-stone-100 bg-stone-50/50 text-sm italic font-serif outline-none resize-none leading-relaxed" />
                 </div>
                 <div className="space-y-4">
                   <h2 className="text-[11px] font-black uppercase tracking-widest opacity-40 flex items-center gap-3"><Database size={16}/> Company Registry</h2>
                   <textarea value={companyDetails} onChange={e => setCompanyDetails(e.target.value)} placeholder="VAT No., Registered Address, HQ Node..." className="w-full h-48 p-10 rounded-[3.5rem] border border-stone-100 bg-stone-50/50 text-[10px] font-black uppercase tracking-[0.3em] outline-none resize-none leading-loose" />
                 </div>
               </div>
            </section>

            {/* EMERGENCY PROTOCOLS */}
            <section className="bg-red-50/30 border border-red-100 p-12 rounded-[5rem] flex flex-col md:flex-row gap-8 items-center justify-between">
              <div className="flex items-center gap-4 text-red-600">
                <AlertTriangle size={32} />
                <div className="space-y-1">
                  <h2 className="text-[12px] font-black uppercase tracking-[0.5em]">Emergency Shutdown</h2>
                  <p className="text-[9px] font-black opacity-40 uppercase tracking-widest">Permanent Node Deletion & Data Wipe</p>
                </div>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <button className="flex-1 px-10 py-6 bg-white border border-red-200 text-red-600 rounded-[2.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"><Download size={18} className="inline mr-2"/> Data Export</button>
                <button className="flex-1 px-10 py-6 bg-red-600 text-white rounded-[2.5rem] font-black text-[10px] uppercase tracking-widest hover:shadow-2xl transition-all">Execute Wipe</button>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}

// ROOT COMPONENT WITH SUSPENSE BOUNDARY
export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfaf7] gap-4">
        <Loader2 className="animate-spin text-stone-200" size={64} />
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-stone-300">Initializing Command...</p>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}