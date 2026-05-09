"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Save, Moon, Sun, Loader2, Landmark, 
  Users, Trash2, Check, Download,
  Eye, EyeOff, UserPlus, AlertTriangle,
  Camera, Mail, Phone, HeartPulse, Palette,
  UserCircle, Fingerprint, Globe, History, Zap, ShieldCheck,
  Upload, Link2, FolderGit, Type, HeartHandshake, ListChecks,
  Database, User, Copy, ArrowUpRight, LogOut
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const APP_PAGES = [
  { id: "dashboard", label: "Main Dashboard" },
  { id: "invoices", label: "Invoice Manager" },
  { id: "crm", label: "Client CRM" },
  { id: "banking", label: "Banking & Ledger" },
  { id: "projects", label: "Project Boards" },
  { id: "settings", label: "System Settings" },
];

const TIERS = ["STANDARD", "PREMIUM", "ELITE"];

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#fcfaf7]"><Loader2 className="animate-spin text-[#a9b897]" size={40} /></div>}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [user, setUser] = useState<any>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState("STANDARD");
  const [profile, setProfile] = useState<any>({
    full_name: "", phone: "", avatar_url: "", next_of_kin: "", email_signature: ""
  });
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(["dashboard"]);

  const [brandColor, setBrandColor] = useState("#a9b897");
  const [secondaryColor, setSecondaryColor] = useState("#e5e7eb");
  const [selectedFont, setSelectedFont] = useState("Inter");
  const [customFont, setCustomFont] = useState("");
  const [bankInfo, setBankInfo] = useState({ name: "", acc: "", sort: "" });
  const [webhookUrl, setWebhookUrl] = useState("");

  const [companyDetails, setCompanyDetails] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [socialLinks, setSocialLinks] = useState({ website: "", instagram: "", linkedin: "", twitter: "" });
  const [campaignList, setCampaignList] = useState<string[]>([]);
  const [newCampaign, setNewCampaign] = useState("");
  
  const [nextOfKin, setNextOfKin] = useState("");
  const [nextOfKinPhone, setNextOfKinPhone] = useState("");

  const [emailCampaigns, setEmailCampaigns] = useState("");
  const [auditLogs, setAuditLogs] = useState<string[]>([
    "• Node initialized successfully.",
    "• System Architecture linked to dynamic state."
  ]);

  const inviteLink = teamId ? `https://www.tots-os.co.uk/login?invite=${teamId}` : "";

  useEffect(() => { 
    init(); 
  }, []);

  async function init() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      setUser(user);
      setEmail(user.email || "");

      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (p) {
        setProfile((prev: any) => ({ ...prev, ...p }));
        setNextOfKin(p.next_of_kin || "");
        if (p.tier) setCurrentTier(p.tier.toUpperCase());
      }

      const { data: membership } = await supabase.from("team_members").select("team_id").eq("user_id", user.id).maybeSingle();
      if (membership?.team_id) {
        setTeamId(membership.team_id);
        const [membersRes, settingsRes] = await Promise.all([
          supabase.from("team_members").select("*").eq("team_id", membership.team_id),
          supabase.from("settings").select("*").eq("team_id", membership.team_id).maybeSingle()
        ]);
        if (membersRes.data) setTeamMembers(membersRes.data);
        if (settingsRes.data) {
          setBrandColor(settingsRes.data.brand_color || "#a9b897");
          setSecondaryColor(settingsRes.data.secondary_color || "#e5e7eb");
          setSelectedFont(settingsRes.data.font_family || "Inter");
          setBankInfo(settingsRes.data.bank_info || { name: "", acc: "", sort: "" });
          setWebhookUrl(settingsRes.data.webhook_url || "");
          setCompanyDetails(settingsRes.data.company_details || "");
          setLogoUrl(settingsRes.data.logo_url || "");
          setSocialLinks(settingsRes.data.social_links || { website: "", instagram: "", linkedin: "", twitter: "" });
          setCampaignList(settingsRes.data.campaigns || []);
          setNextOfKinPhone(settingsRes.data.next_of_kin_phone || "");
          if (settingsRes.data.email_campaigns) setEmailCampaigns(settingsRes.data.email_campaigns);
        }
      }
    } catch (err) { console.error("Init Error:", err); } finally { setLoading(false); }
  }

  const handleGlobalSave = async () => {
    setSaving(true);
    try {
      await supabase.from("profiles").update({
        full_name: profile?.full_name || "",
        phone: profile?.phone || "",
        next_of_kin: nextOfKin,
        email_signature: profile?.email_signature || "",
        avatar_url: profile?.avatar_url || "",
        tier: currentTier
      }).eq("id", user?.id);
      
      if (email !== user.email || password) {
        const updateData: any = { email };
        if (password) updateData.password = password;
        const { error } = await supabase.auth.updateUser(updateData);
        if (error) throw error;
        setPassword("");
      }

      if (teamId) {
        await supabase.from("settings").upsert({
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
      }

      setAuditLogs(prev => [`• Settings updated at ${new Date().toLocaleTimeString()}`, ...prev]);
      alert("Settings synchronized globally.");
      
    } catch (err: any) { alert("Sync Error: " + err.message); } finally { setSaving(false); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
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

  const handleTierSelection = (tierName: string) => {
    setCurrentTier(tierName);
    router.push("/billing");
  };

  const handleInvite = async () => {
    if (!inviteEmail || !teamId) return;
    setSaving(true);
    const { error } = await supabase.from("team_members").insert({
      team_id: teamId,
      email: inviteEmail.toLowerCase().trim(),
      role: "member",
      permissions: selectedPermissions 
    });
    if (!error) { 
      setInviteEmail(""); 
      init(); 
      setAuditLogs(prev => [`• Provisioned new seat for ${inviteEmail}`, ...prev]);
    }
    setSaving(false);
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    alert("Invite link copied to clipboard.");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#fcfaf7]"><Loader2 className="animate-spin text-[#a9b897]" size={40} /></div>;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-stone-950 text-stone-200' : 'bg-[#fcfaf7] text-stone-900'}`}>
      
      <style jsx global>{`
        :root {
          --brand-primary: ${brandColor};
          --brand-secondary: ${secondaryColor};
          --font-main: '${customFont || selectedFont}', sans-serif;
        }
        body {
          font-family: var(--font-main) !important;
        }
        .custom-brand-text { color: var(--brand-primary); }
        .custom-brand-bg { background-color: var(--brand-primary); }
        .custom-secondary-bg { background-color: var(--brand-secondary); }
        input:focus, textarea:focus { border-color: var(--brand-primary) !important; }
      `}</style>

      {/* Adjusted padding for mobile/desktop */}
      <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-16 space-y-8 md:space-y-12 pb-40">
        
        {/* HEADER: Flex-col on mobile, flex-row on md+ */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-stone-200 pb-8 md:pb-12">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif italic tracking-tighter leading-none custom-brand-text">Command Center</h1>
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] opacity-40">System Node: {user?.email}</p>
          </div>
          
          {/* Action Buttons: Wrap on smaller screens */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => router.push("/import")} 
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-4 md:px-6 md:py-5 rounded-2xl border border-stone-200 bg-white font-black text-[9px] uppercase tracking-widest text-stone-700 shadow-sm"
            >
              <Database size={14} className="custom-brand-text" /> Import
            </button>

            <button 
              onClick={() => router.push("/team")} 
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-4 md:px-6 md:py-5 rounded-2xl border border-stone-200 bg-white font-black text-[9px] uppercase tracking-widest text-stone-700 shadow-sm"
            >
              <Users size={14} className="custom-brand-text" /> Team
            </button>

            <div className="flex gap-3">
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-4 md:p-5 rounded-2xl border border-stone-200 bg-white">
                {isDarkMode ? <Sun size={18} className="text-black"/> : <Moon size={18} />}
                </button>

                <button onClick={handleLogout} className="p-4 md:p-5 rounded-2xl border border-stone-200 bg-white text-stone-500">
                <LogOut size={18} />
                </button>
            </div>

            <button 
              onClick={handleGlobalSave} 
              disabled={saving} 
              className="w-full md:w-auto flex items-center justify-center gap-4 px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white custom-brand-bg shadow-xl"
            >
              {saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16} />} Commit Changes
            </button>
          </div>
        </header>

        {/* Layout Grid: 1 col on mobile, 12 on lg */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-4 space-y-8 md:space-y-12">
            
            {/* BRAND ARCHITECTURE */}
            <section className="bg-white p-6 md:p-8 rounded-[2.5rem] md:rounded-[3.5rem] border border-stone-100 shadow-sm space-y-6">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 flex items-center gap-2">
                <Palette size={14} className="custom-brand-text" /> Brand & Assets
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase text-stone-400">Accent</label>
                    <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase text-stone-400">Secondary</label>
                    <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer" />
                  </div>
                </div>
                
                <div className="space-y-4 pt-4 border-t border-stone-50">
                  <select 
                    value={selectedFont} 
                    onChange={e => { setSelectedFont(e.target.value); setCustomFont(""); }}
                    className="w-full p-4 rounded-xl border border-stone-100 bg-stone-50/50 text-[11px] outline-none"
                  >
                    <option value="Inter">Inter (Sans)</option>
                    <option value="Merriweather">Merriweather (Serif)</option>
                    <option value="Geist">Geist (Modern Mono)</option>
                  </select>
                  <input 
                    type="text" 
                    value={logoUrl} 
                    onChange={e => setLogoUrl(e.target.value)}
                    placeholder="Logo URL..." 
                    className="w-full p-4 rounded-xl border border-stone-100 bg-stone-50/50 text-[11px] outline-none" 
                  />
                  <textarea 
                    rows={4}
                    value={companyDetails} 
                    onChange={e => setCompanyDetails(e.target.value)}
                    placeholder="Footer Info..." 
                    className="w-full p-4 rounded-xl border border-stone-100 bg-stone-50/50 text-[11px] outline-none resize-none" 
                  />
                </div>
              </div>
            </section>

            {/* TIER SELECTION */}
            <section className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-stone-100 shadow-sm space-y-4">
               <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 flex items-center gap-2"><ShieldCheck size={14}/> Tier</h2>
               <div className="grid grid-cols-1 gap-2">
                  {TIERS.map((t) => (
                    <button 
                      key={t} 
                      onClick={() => handleTierSelection(t)} 
                      className="p-4 rounded-xl border text-[9px] font-black uppercase transition-all flex justify-between items-center"
                      style={{
                        borderColor: currentTier === t ? brandColor : "#f0f0f0",
                        backgroundColor: currentTier === t ? brandColor : "transparent",
                        color: currentTier === t ? "#ffffff" : "#a3a3a3"
                      }}
                    >
                      {t} {currentTier === t && <Check size={12} />}
                    </button>
                  ))}
               </div>
            </section>

            {/* PROFILE SECTION */}
            <section className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-stone-100 shadow-sm space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative group w-24 h-24 md:w-32 md:h-32 rounded-full bg-stone-50 border-2 border-dashed border-stone-200 flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <UserCircle size={40} className="opacity-10" />}
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"><Camera size={16} /><input type="file" className="hidden" /></label>
                </div>
                <input value={profile?.full_name || ""} onChange={e => setProfile({...profile, full_name: e.target.value})} placeholder="Full Name" className="text-center font-serif italic text-xl w-full bg-transparent outline-none" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl"><Mail size={16} className="text-stone-400" /><input value={email} onChange={e => setEmail(e.target.value)} className="bg-transparent text-[11px] font-bold outline-none w-full" /></div>
                <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl"><Fingerprint size={16} className="text-stone-400" /><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New Password" className="bg-transparent text-[11px] font-bold outline-none w-full" /></div>
                <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl"><Phone size={16} className="custom-brand-text" /><input value={profile?.phone || ""} onChange={e => setProfile({...profile, phone: e.target.value})} placeholder="Phone" className="bg-transparent text-[11px] font-bold outline-none w-full" /></div>
                
                <div className="space-y-2 p-4 bg-stone-50 rounded-xl">
                  <label className="text-[8px] font-black uppercase text-stone-400 flex items-center gap-2"><HeartPulse size={12} className="text-red-400" /> Emergency</label>
                  <input value={nextOfKin} onChange={e => setNextOfKin(e.target.value)} placeholder="Name" className="bg-white p-3 rounded-lg border border-stone-100 text-[11px] font-bold outline-none w-full mb-2" />
                  <input placeholder="Phone" value={nextOfKinPhone} onChange={(e) => setNextOfKinPhone(e.target.value)} className="bg-white p-3 rounded-lg border border-stone-100 text-[11px] font-bold outline-none w-full" />
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-8 space-y-8 md:space-y-12">
            
            <section className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[4rem] border border-stone-100 shadow-sm space-y-6">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 flex items-center gap-2"><Link2 size={14} className="custom-brand-text" /> Platforms</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <input value={socialLinks.website} onChange={e => setSocialLinks({...socialLinks, website: e.target.value})} placeholder="Website URL" className="w-full p-4 bg-stone-50 border border-stone-100 rounded-xl text-[11px] outline-none" />
                  <input value={socialLinks.instagram} onChange={e => setSocialLinks({...socialLinks, instagram: e.target.value})} placeholder="Instagram" className="w-full p-4 bg-stone-50 border border-stone-100 rounded-xl text-[11px] outline-none" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input value={newCampaign} onChange={e => setNewCampaign(e.target.value)} placeholder="New Campaign" className="flex-1 p-4 bg-stone-50 border border-stone-100 rounded-xl text-[11px] outline-none" />
                    <button onClick={addCampaign} className="px-4 bg-stone-900 text-white rounded-xl text-[9px] uppercase font-bold">Add</button>
                  </div>
                  <div className="h-32 overflow-y-auto space-y-2 border border-stone-100 rounded-xl p-4 bg-stone-50/20">
                    {campaignList.map((campaign, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-2 border border-stone-100 rounded-lg">
                        <span className="text-[10px] font-serif italic">{campaign}</span>
                        <button onClick={() => removeCampaign(idx)} className="text-stone-300 hover:text-red-500"><Trash2 size={12}/></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[4rem] border border-stone-100 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <h2 className="text-[11px] font-black uppercase tracking-[0.5em] opacity-40">The Hive</h2>
                <button onClick={() => router.push('/billing')} className="text-[9px] font-black bg-stone-900 text-[#a9b897] px-4 py-2 rounded-full uppercase">Add Seat £19.95</button>
              </div>

              {teamId && (
                <div className="mb-6 p-4 bg-stone-50 rounded-2xl border border-stone-100 flex flex-col md:flex-row items-center justify-between gap-3">
                  <div className="w-full overflow-hidden">
                    <p className="text-[8px] font-black uppercase text-stone-400">Public Invite</p>
                    <p className="text-[10px] font-mono truncate">{inviteLink}</p>
                  </div>
                  <button onClick={copyInviteLink} className="w-full md:w-auto p-3 bg-white border border-stone-200 rounded-xl hover:bg-stone-900 hover:text-white transition-all">
                    <Copy size={14} />
                  </button>
                </div>
              )}

              <div className="space-y-6">
                <input placeholder="Invite email..." value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="w-full p-4 rounded-xl border border-stone-100 bg-stone-50/50 text-sm outline-none" />
                {inviteEmail.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-stone-50">
                    <div className="grid grid-cols-2 gap-2">
                      {APP_PAGES.map((page) => (
                        <button 
                          key={page.id} 
                          onClick={() => setSelectedPermissions(prev => prev.includes(page.id) ? prev.filter(p => p !== page.id) : [...prev, page.id])} 
                          className="p-3 rounded-lg border text-[8px] font-black uppercase transition-all"
                          style={{
                            borderColor: selectedPermissions.includes(page.id) ? brandColor : "#f0f0f0",
                            backgroundColor: selectedPermissions.includes(page.id) ? `${brandColor}10` : "transparent",
                          }}
                        >
                          {page.label}
                        </button>
                      ))}
                    </div>
                    <button onClick={handleInvite} className="w-full py-4 text-white rounded-xl font-black text-[9px] uppercase tracking-widest custom-brand-bg">Provision Seat</button>
                  </div>
                )}
              </div>
              <div className="mt-8 space-y-2">
                {teamMembers.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-stone-50/50 rounded-xl border border-stone-100">
                    <span className="text-xs font-bold truncate pr-4">{member.email}</span>
                    <button onClick={() => supabase.from("team_members").delete().eq("id", member.id).then(() => init())} className="text-stone-300 hover:text-red-500 shrink-0"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            </section>

            <section className="text-white p-6 md:p-12 rounded-[2.5rem] md:rounded-[4rem] shadow-2xl custom-secondary-bg">
              <div className="flex items-center gap-3 mb-6 opacity-50">
                <Landmark size={16} />
                <h2 className="text-[9px] font-black uppercase tracking-[0.3em]">Banking Distribution</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase opacity-40">Bank</label>
                  <input value={bankInfo.name} onChange={e => setBankInfo({...bankInfo, name: e.target.value})} className="w-full bg-black/20 border border-white/10 p-4 rounded-xl text-[11px] font-bold outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase opacity-40">Account</label>
                  <input value={bankInfo.acc} onChange={e => setBankInfo({...bankInfo, acc: e.target.value})} className="w-full bg-black/20 border border-white/10 p-4 rounded-xl text-[11px] font-bold outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase opacity-40">Sort</label>
                  <input value={bankInfo.sort} onChange={e => setBankInfo({...bankInfo, sort: e.target.value})} className="w-full bg-black/20 border border-white/10 p-4 rounded-xl text-[11px] font-bold outline-none" />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}