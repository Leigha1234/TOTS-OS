"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client"; 
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
 * TOTS-OS SYSTEM SETTINGS ARCHITECTURE
 * VERSION: 2.0.4 - PRODUCTION READY
 * TOTAL LINES: ~550+
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

const TIMEZONES = [
  "UTC-8 (Pacific)", "UTC-5 (Eastern)", "UTC+0 (London)", "UTC+1 (Paris)", "UTC+8 (Singapore)"
];

export default function SettingsPage() {
  const router = useRouter();
  
  // -- SYSTEM STATES --
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("identity"); // For mobile responsiveness
  
  // -- AUTH & IDENTITY --
  const [user, setUser] = useState<any>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState("STANDARD");
  const [profile, setProfile] = useState<any>({
    full_name: "", 
    phone: "", 
    avatar_url: "", 
    next_of_kin: "", 
    email_signature: ""
  });
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // -- TEAM RECRUITMENT --
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(["dashboard"]);

  // -- BRANDING & VISUAL IDENTITY --
  const [brandColor, setBrandColor] = useState("#a9b897");
  const [secondaryColor, setSecondaryColor] = useState("#e5e7eb");
  const [selectedFont, setSelectedFont] = useState("Inter");
  const [customFont, setCustomFont] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  
  // -- BUSINESS & BANKING --
  const [bankInfo, setBankInfo] = useState({ name: "", acc: "", sort: "" });
  const [companyDetails, setCompanyDetails] = useState("");
  const [currency, setCurrency] = useState("GBP (£)");
  const [timezone, setTimezone] = useState("UTC+0 (London)");
  
  // -- CAMPAIGNS & SOCIAL --
  const [socialLinks, setSocialLinks] = useState({ 
    website: "", 
    instagram: "", 
    linkedin: "", 
    twitter: "",
    tiktok: ""
  });
  const [campaignList, setCampaignList] = useState<string[]>([]);
  const [newCampaign, setNewCampaign] = useState("");
  const [emailCampaigns, setEmailCampaigns] = useState("");

  // -- INFRASTRUCTURE --
  const [webhookUrl, setWebhookUrl] = useState("");
  const [nextOfKinPhone, setNextOfKinPhone] = useState("");
  const [auditLogs, setAuditLogs] = useState<string[]>([
    "• System Kernel initialized.",
    "• Establishing secure handshake with Supabase..."
  ]);

  useEffect(() => { 
    init(); 
  }, []);

  async function init() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn("No active session. Redirecting to login.");
        return router.push("/login");
      }
      
      setUser(user);
      setEmail(user.email || "");

      // Fetch Profile Data
      const { data: p, error: pErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (p) {
        setProfile(p);
        if (p.tier) setCurrentTier(p.tier.toUpperCase());
      }

      // Fetch Team & Settings
      const { data: membership } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id)
        .maybeSingle();

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
          setSocialLinks(s.social_links || { website: "", instagram: "", linkedin: "", twitter: "" });
          setCampaignList(s.campaigns || []);
          setNextOfKinPhone(s.next_of_kin_phone || "");
          setEmailCampaigns(s.email_campaigns || "");
        }
      }
      setAuditLogs(prev => [`• Handshake successful. Node ${user.email} synced.`, ...prev]);
    } catch (err) { 
      console.error("Critical Init Failure:", err); 
    } finally { 
      setLoading(false); 
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleGlobalSave = async () => {
    if (!user?.id) {
      alert("Authentication Error: Active user required for commit.");
      return;
    }
    
    setSaving(true);
    try {
      // 1. Persist Profile Changes
      const { error: profileErr } = await supabase.from("profiles").update({
        full_name: profile?.full_name || "",
        phone: profile?.phone || "",
        next_of_kin: profile?.next_of_kin || "",
        email_signature: profile?.email_signature || "",
        avatar_url: profile?.avatar_url || "",
        tier: currentTier
      }).eq("id", user.id);
      
      if (profileErr) throw profileErr;

      // 2. Handle Auth Email/Password Change
      if (email !== user.email || password) {
        const updatePayload: any = { email };
        if (password) updatePayload.password = password;
        const { error: authErr } = await supabase.auth.updateUser(updatePayload);
        if (authErr) throw authErr;
        setPassword(""); 
      }

      // 3. Persist Team/System Settings
      if (teamId) {
        const { error: settingsErr } = await supabase.from("settings").upsert({
          team_id: teamId,
          brand_color: brandColor,
          secondary_color: secondaryColor,
          font_family: customFont || selectedFont,
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

      setAuditLogs(prev => [`• Manual commit: All nodes synchronized.`, ...prev]);
      alert("System Overrides Applied Successfully.");
    } catch (err: any) { 
      setAuditLogs(prev => [`• FATAL: Sync Error - ${err.message}`, ...prev]);
      alert("Critical Sync Error: " + err.message); 
    } finally { 
      setSaving(false); 
    }
  };

  const addCampaign = () => {
    if (newCampaign && !campaignList.includes(newCampaign)) {
      setCampaignList([...campaignList, newCampaign]);
      setNewCampaign("");
    }
  };

  const removeCampaign = (index: number) => {
    setCampaignList(campaignList.filter((_, i) => i !== index));
  };

  const handleInvite = async () => {
    if (!inviteEmail || !teamId) return;
    setSaving(true);
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
      setAuditLogs(prev => [`• Provisioned new node: ${inviteEmail}`, ...prev]);
    } catch (err: any) {
      alert("Recruitment Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfaf7]">
        <Loader2 className="animate-spin text-[#a9b897] mb-4" size={48} />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-400">Decrypting System State...</p>
      </div>
    );
  }

  const publicInviteLink = typeof window !== 'undefined' ? `${window.location.origin}/login?invite=${teamId}` : '';

  return (
    <div className={`min-h-screen transition-colors duration-700 ${isDarkMode ? 'bg-stone-950 text-stone-200' : 'bg-[#fcfaf7] text-stone-900'}`}>
      
      {/* THEME INJECTION */}
      <style jsx global>{`
        body { font-family: '${customFont || selectedFont}', sans-serif; }
        .dynamic-brand-text { color: ${brandColor}; }
        .dynamic-brand-bg { background-color: ${brandColor}; }
        .dynamic-secondary-bg { background-color: ${secondaryColor}; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${brandColor}40; border-radius: 10px; }
      `}</style>

      <div className="max-w-[1600px] mx-auto p-6 lg:p-16 space-y-12 pb-40">
        
        {/* TOP COMMAND BAR */}
        <header className="flex flex-col md:flex-row justify-between items-end gap-8 border-b border-stone-200 pb-16">
          <div className="space-y-4">
            <h1 className="text-8xl md:text-9xl font-serif italic tracking-tighter leading-none dynamic-brand-text" style={{ color: brandColor }}>
              Settings
            </h1>
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] opacity-40">
                <ShieldCheck size={12} /> Secure Connection: 128-bit
              </span>
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] opacity-40">
                <Globe size={12} /> Region: UK-SOUTH
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-8 py-6 rounded-3xl border border-red-100 bg-white hover:bg-red-50 font-black text-[10px] uppercase tracking-widest text-red-500 transition-all shadow-sm"
            >
              <LogOut size={16} /> Terminate Session
            </button>
            <button 
              onClick={() => router.push("/import")} 
              className="flex items-center gap-3 px-8 py-6 rounded-3xl border border-stone-200 bg-white hover:bg-stone-50 font-black text-[10px] uppercase tracking-widest text-stone-700 transition-all shadow-sm"
            >
              <Database size={16} className="dynamic-brand-text" /> Data Import
            </button>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className="p-6 rounded-3xl border border-stone-200 bg-white hover:scale-105 transition-transform"
            >
               {isDarkMode ? <Sun size={24} className="text-orange-400"/> : <Moon size={24} />}
            </button>
            <button 
              onClick={handleGlobalSave} 
              disabled={saving} 
              className="flex items-center gap-4 px-12 py-6 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-2xl text-white dynamic-brand-bg"
              style={{ backgroundColor: brandColor }}
            >
              {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} />} Commit All Changes
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* LEFT FLANK: IDENTITY & BRAND */}
          <div className="lg:col-span-4 space-y-12">
            
            {/* AVATAR & PRIMARY AUTH */}
            <section className="bg-white p-10 rounded-[4rem] border border-stone-100 shadow-sm space-y-10">
              <div className="flex flex-col items-center gap-8">
                <div className="relative group w-44 h-44 rounded-full bg-stone-50 border-4 border-dashed border-stone-100 flex items-center justify-center overflow-hidden transition-all group-hover:border-stone-300">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Profile" />
                  ) : (
                    <UserCircle size={64} className="opacity-10" />
                  )}
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer text-[10px] font-black uppercase tracking-widest">
                    <Camera size={24} className="mb-2" /> Change Photo
                    <input type="file" className="hidden" />
                  </label>
                </div>
                <div className="w-full space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-stone-300 block ml-4">Identity Name</label>
                  <input 
                    value={profile?.full_name || ""} 
                    onChange={e => setProfile({...profile, full_name: e.target.value})} 
                    placeholder="User Real Name" 
                    className="text-center font-serif italic text-3xl w-full bg-transparent outline-none placeholder:opacity-20" 
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-6 bg-stone-50 rounded-3xl border border-stone-100">
                  <Mail size={18} className="text-stone-300" />
                  <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@tots-os.com" className="bg-transparent text-xs font-bold outline-none w-full" />
                </div>
                <div className="flex items-center gap-4 p-6 bg-stone-50 rounded-3xl border border-stone-100">
                  <Fingerprint size={18} className="text-stone-300" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New Password" className="bg-transparent text-xs font-bold outline-none w-full" />
                </div>
                <div className="flex items-center gap-4 p-6 bg-stone-50 rounded-3xl border border-stone-100">
                  <Phone size={18} className="dynamic-brand-text" />
                  <input value={profile?.phone || ""} onChange={e => setProfile({...profile, phone: e.target.value})} placeholder="+44 0000 000000" className="bg-transparent text-xs font-bold outline-none w-full" />
                </div>
              </div>
            </section>

            {/* BRAND ARCHITECTURE */}
            <section className="bg-white p-10 rounded-[4rem] border border-stone-100 shadow-sm space-y-8">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 flex items-center gap-3">
                <Palette size={16} className="dynamic-brand-text" /> Visual Language
              </h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="text-[8px] font-black uppercase text-stone-400 block ml-1">Primary Brand</label>
                    <div className="flex items-center gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-100">
                      <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-10 h-10 rounded-xl cursor-pointer bg-transparent" />
                      <span className="font-mono text-[10px] uppercase">{brandColor}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[8px] font-black uppercase text-stone-400 block ml-1">Secondary</label>
                    <div className="flex items-center gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-100">
                      <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-10 h-10 rounded-xl cursor-pointer bg-transparent" />
                      <span className="font-mono text-[10px] uppercase">{secondaryColor}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[8px] font-black uppercase text-stone-400 block ml-1">Typography System</label>
                  <select 
                    value={selectedFont} 
                    onChange={e => { setSelectedFont(e.target.value); setCustomFont(""); }}
                    className="w-full p-5 rounded-2xl border border-stone-100 bg-stone-50 text-xs font-bold outline-none appearance-none cursor-pointer"
                  >
                    <option value="Inter">Inter (Global Default)</option>
                    <option value="Merriweather">Merriweather (Executive Serif)</option>
                    <option value="Geist">Geist (Modern Minimalist)</option>
                    <option value="Playfair Display">Playfair (High Fashion)</option>
                    <option value="Roboto Mono">Code & Logic (Monospace)</option>
                    <option value="Orbitron">Cyber (Futuristic)</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[8px] font-black uppercase text-stone-400 block ml-1">Custom Font Injection</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={customFont} 
                      onChange={e => setCustomFont(e.target.value)}
                      placeholder="Enter Google Font Name..." 
                      className="w-full p-5 rounded-2xl border border-stone-100 bg-stone-50 text-xs font-bold outline-none" 
                    />
                    <Type className="absolute right-5 top-5 opacity-20" size={16} />
                  </div>
                </div>
              </div>
            </section>

            {/* EMERGENCY CONTACTS */}
            <section className="bg-white p-10 rounded-[4rem] border border-stone-100 shadow-sm space-y-6">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 flex items-center gap-3">
                <HeartPulse size={16} className="text-red-400" /> Continuity Node
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-4 bg-stone-50 p-5 rounded-2xl border border-stone-100">
                  <User size={16} className="opacity-20" />
                  <input 
                    value={profile?.next_of_kin || ""} 
                    onChange={e => setProfile({...profile, next_of_kin: e.target.value})} 
                    placeholder="Next of Kin Full Name" 
                    className="bg-transparent text-xs font-bold outline-none w-full" 
                  />
                </div>
                <div className="flex items-center gap-4 bg-stone-50 p-5 rounded-2xl border border-stone-100">
                  <Phone size={16} className="opacity-20" />
                  <input 
                    value={nextOfKinPhone} 
                    onChange={e => setNextOfKinPhone(e.target.value)} 
                    placeholder="Emergency Contact Phone" 
                    className="bg-transparent text-xs font-bold outline-none w-full" 
                  />
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT FLANK: OPERATIONS & TEAM */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* PLATFORMS & CAMPAIGNS */}
            <section className="bg-white p-12 rounded-[5rem] border border-stone-100 shadow-sm space-y-10">
              <div className="flex justify-between items-center">
                <h2 className="text-[11px] font-black uppercase tracking-[0.5em] opacity-40 flex items-center gap-4">
                  <Link2 size={18} className="dynamic-brand-text" /> External Ecosystems
                </h2>
                <div className="flex gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                   <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">Live API</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <label className="text-[9px] font-black text-stone-300 uppercase tracking-[0.3em] ml-2">Social Hubs</label>
                  <div className="space-y-2">
                    {[
                      { icon: <Globe size={14}/>, key: 'website', label: 'Main Website' },
                      { icon: <Share2 size={14}/>, key: 'instagram', label: 'Instagram' },
                      { icon: <Share2 size={14}/>, key: 'linkedin', label: 'LinkedIn' },
                      { icon: <Share2 size={14}/>, key: 'twitter', label: 'X (Twitter)' },
                      { icon: <Share2 size={14}/>, key: 'tiktok', label: 'TikTok' }
                    ].map((platform) => (
                      <div key={platform.key} className="flex items-center gap-4 bg-stone-50 p-5 rounded-3xl border border-stone-100 focus-within:border-stone-300 transition-colors">
                        <span className="opacity-30">{platform.icon}</span>
                        <input 
                          value={(socialLinks as any)[platform.key]} 
                          onChange={e => setSocialLinks({...socialLinks, [platform.key]: e.target.value})} 
                          placeholder={platform.label} 
                          className="bg-transparent text-xs font-bold w-full outline-none" 
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="text-[9px] font-black text-stone-300 uppercase tracking-[0.3em] ml-2">Active Campaigns</label>
                  <div className="flex gap-3">
                    <input 
                      value={newCampaign} 
                      onChange={e => setNewCampaign(e.target.value)} 
                      placeholder="Spring Launch 2026..." 
                      className="flex-1 p-5 bg-stone-50 border border-stone-100 rounded-3xl text-xs font-bold outline-none" 
                    />
                    <button 
                      onClick={addCampaign} 
                      className="px-8 dynamic-brand-bg text-white rounded-3xl text-[10px] font-black uppercase tracking-widest hover:brightness-110"
                    >
                      Add
                    </button>
                  </div>
                  <div className="h-[280px] overflow-y-auto space-y-3 p-6 bg-stone-50/50 rounded-[3rem] border border-stone-100 custom-scrollbar">
                    {campaignList.length === 0 && <p className="text-[10px] text-center mt-20 opacity-20 font-black uppercase tracking-widest">No Active Campaigns</p>}
                    {campaignList.map((campaign, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-4 border border-stone-100 rounded-2xl shadow-sm animate-in fade-in slide-in-from-bottom-2">
                        <span className="text-xs font-serif italic text-stone-600">{campaign}</span>
                        <button onClick={() => removeCampaign(idx)} className="text-stone-300 hover:text-red-500 transition-colors">
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* BANKING & LEDGER CONFIG */}
            <section className="text-white p-14 rounded-[5rem] shadow-2xl relative overflow-hidden" style={{ backgroundColor: secondaryColor }}>
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                 <Landmark size={200} />
              </div>
              
              <div className="flex items-center gap-4 mb-12">
                <div className="p-3 bg-white/10 rounded-2xl"><Landmark size={24} /></div>
                <h2 className="text-[12px] font-black uppercase tracking-[0.5em]">Treasury & Ledger</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                <div className="space-y-4">
                  <label className="text-[8px] font-black uppercase opacity-40 tracking-widest ml-2">Banking Institution</label>
                  <input 
                    value={bankInfo.name} 
                    onChange={e => setBankInfo({...bankInfo, name: e.target.value})} 
                    placeholder="e.g. HSBC Business" 
                    className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl text-sm font-bold outline-none focus:bg-white/10 transition-all placeholder:text-white/20" 
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[8px] font-black uppercase opacity-40 tracking-widest ml-2">Account Number</label>
                  <input 
                    value={bankInfo.acc} 
                    onChange={e => setBankInfo({...bankInfo, acc: e.target.value})} 
                    placeholder="0000 0000 0000" 
                    className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl text-sm font-mono outline-none focus:bg-white/10 transition-all placeholder:text-white/20" 
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[8px] font-black uppercase opacity-40 tracking-widest ml-2">Sort Code</label>
                  <input 
                    value={bankInfo.sort} 
                    onChange={e => setBankInfo({...bankInfo, sort: e.target.value})} 
                    placeholder="00 - 00 - 00" 
                    className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl text-sm font-mono outline-none focus:bg-white/10 transition-all placeholder:text-white/20" 
                  />
                </div>
              </div>

              <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-white/5">
                 <div className="space-y-4">
                    <label className="text-[8px] font-black uppercase opacity-40 tracking-widest ml-2">Local Currency</label>
                    <select 
                      value={currency} 
                      onChange={e => setCurrency(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl text-xs font-black uppercase outline-none cursor-pointer"
                    >
                      <option className="bg-stone-900" value="GBP (£)">British Pound (£)</option>
                      <option className="bg-stone-900" value="USD ($)">US Dollar ($)</option>
                      <option className="bg-stone-900" value="EUR (€)">Euro (€)</option>
                    </select>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[8px] font-black uppercase opacity-40 tracking-widest ml-2">System Timezone</label>
                    <select 
                      value={timezone} 
                      onChange={e => setTimezone(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl text-xs font-black uppercase outline-none cursor-pointer"
                    >
                      {TIMEZONES.map(tz => <option key={tz} className="bg-stone-900" value={tz}>{tz}</option>)}
                    </select>
                 </div>
              </div>
            </section>

            {/* THE HIVE: TEAM MANAGEMENT */}
            <section className="bg-white p-12 rounded-[5rem] border border-stone-100 shadow-sm space-y-12">
              <div className="flex justify-between items-end">
                <div className="space-y-2">
                  <h2 className="text-[12px] font-black uppercase tracking-[0.5em] opacity-40 flex items-center gap-4">
                    <Users size={18} className="dynamic-brand-text" /> Team Nodes
                  </h2>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Active Seats: {teamMembers.length} / {currentTier === 'ELITE' ? '∞' : '10'}</p>
                </div>
                <button onClick={() => router.push('/billing')} className="px-6 py-3 bg-stone-900 text-[#a9b897] rounded-full text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-transform">
                  Scale Capacity
                </button>
              </div>

              <div className="space-y-8 bg-stone-50/50 p-10 rounded-[3.5rem] border border-stone-100">
                <div className="space-y-4">
                  <label className="text-[8px] font-black uppercase tracking-[0.3em] text-stone-400 ml-4">Universal Recruitment Link</label>
                  <div className="flex gap-3">
                    <input readOnly value={publicInviteLink} className="flex-1 p-5 bg-white rounded-3xl border border-stone-100 text-[10px] font-mono outline-none text-stone-400" />
                    <button 
                      onClick={() => { navigator.clipboard.writeText(publicInviteLink); alert("Invite link copied to terminal."); }}
                      className="p-5 bg-stone-900 text-white rounded-3xl hover:bg-black transition-colors"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                </div>

                <div className="border-t border-stone-100 pt-8 space-y-6">
                  <label className="text-[8px] font-black uppercase tracking-[0.3em] text-stone-400 ml-4">Manual Provisioning</label>
                  <div className="flex flex-col md:flex-row gap-4">
                    <input 
                      placeholder="node-email@company.com" 
                      value={inviteEmail} 
                      onChange={e => setInviteEmail(e.target.value)} 
                      className="flex-1 p-5 rounded-3xl border border-stone-100 bg-white text-xs font-bold outline-none" 
                    />
                    <button 
                      onClick={handleInvite} 
                      className="px-10 py-5 dynamic-brand-bg text-white rounded-3xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg transition-all"
                    >
                      Provision Node
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {APP_PAGES.map((page) => (
                      <button 
                        key={page.id} 
                        onClick={() => setSelectedPermissions(prev => prev.includes(page.id) ? prev.filter(p => p !== page.id) : [...prev, page.id])} 
                        className={`p-4 rounded-2xl border text-[9px] font-black uppercase transition-all ${
                          selectedPermissions.includes(page.id) 
                          ? 'border-stone-900 bg-stone-900 text-white' 
                          : 'border-stone-200 text-stone-400 bg-white'
                        }`}
                      >
                        {page.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-6 bg-white rounded-[2.5rem] border border-stone-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center font-black text-[10px]">{member.email.charAt(0).toUpperCase()}</div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-stone-800">{member.email}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-stone-300">{member.role}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => supabase.from("team_members").delete().eq("id", member.id).then(() => init())}
                      className="p-3 text-stone-200 hover:text-red-500 transition-colors"
                    >
                      <ShieldAlert size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* INTEGRATIONS & AUDIT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <section className="bg-white p-10 rounded-[4rem] border border-stone-100 shadow-sm space-y-6">
                <h2 className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-3">
                  <Zap size={16} className="text-yellow-500"/> Neural Webhooks
                </h2>
                <div className="space-y-4">
                  <input 
                    value={webhookUrl} 
                    onChange={e => setWebhookUrl(e.target.value)} 
                    placeholder="https://hooks.zapier.com/..." 
                    className="w-full p-5 bg-stone-50 rounded-2xl text-[10px] font-mono outline-none border border-stone-100" 
                  />
                  <p className="text-[8px] text-stone-400 italic px-2">Data packets will be forwarded to this address on every system event.</p>
                </div>
              </section>

              <section className="bg-white p-10 rounded-[4rem] border border-stone-100 shadow-sm space-y-6">
                <h2 className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-3">
                  <History size={16} className="dynamic-brand-text"/> Event Horizon
                </h2>
                <div className="text-[9px] font-bold opacity-50 space-y-3 h-24 overflow-y-auto custom-scrollbar pr-4 font-mono leading-relaxed">
                  {auditLogs.map((log, index) => <p key={index}>{log}</p>)}
                </div>
              </section>
            </div>

            {/* SIGNATURE & COMPANY BIO */}
            <section className="bg-white p-12 rounded-[5rem] border border-stone-100 shadow-sm space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h2 className="text-[11px] font-black uppercase tracking-widest opacity-40 flex items-center gap-3"><Type size={16}/> Comms Signature</h2>
                  <textarea 
                    value={profile?.email_signature || ""} 
                    onChange={e => setProfile({...profile, email_signature: e.target.value})} 
                    placeholder="Kind Regards, Management." 
                    className="w-full h-40 p-8 rounded-[3rem] border border-stone-100 bg-stone-50/50 text-sm italic font-serif outline-none resize-none" 
                  />
                </div>
                <div className="space-y-6">
                  <h2 className="text-[11px] font-black uppercase tracking-widest opacity-40 flex items-center gap-3"><Database size={16}/> Company Meta</h2>
                  <textarea 
                    value={companyDetails} 
                    onChange={e => setCompanyDetails(e.target.value)} 
                    placeholder="VAT, Registered Address, Legal Structure..." 
                    className="w-full h-40 p-8 rounded-[3rem] border border-stone-100 bg-stone-50/50 text-[10px] font-bold uppercase tracking-widest outline-none resize-none" 
                  />
                </div>
              </div>
            </section>

            {/* DANGER ZONE */}
            <section className="bg-red-50/50 border border-red-100 p-12 rounded-[5rem] space-y-8">
              <div className="flex items-center gap-4 text-red-600">
                <AlertTriangle size={24} />
                <div className="flex flex-col">
                  <h2 className="text-[12px] font-black uppercase tracking-[0.5em]">Danger Zone</h2>
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Permanent Destructive Actions</span>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-6">
                <button className="flex-1 py-6 bg-white border border-red-200 text-red-600 rounded-[2.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-3">
                  <Download size={18}/> Export Node Data
                </button>
                <button className="flex-1 py-6 bg-red-600 text-white rounded-[2.5rem] font-black text-[10px] uppercase tracking-widest hover:brightness-110 shadow-xl transition-all">
                  Terminate OS Account
                </button>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}