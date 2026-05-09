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
  Database, User, Copy, ArrowUpRight
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
  const searchParams = useSearchParams();
  const isOnboarding = searchParams.get("onboarding") === "true";

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
  
  // Auth Updates
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(["dashboard"]);

  const [brandColor, setBrandColor] = useState("#a9b897");
  const [secondaryColor, setSecondaryColor] = useState("#e5e7eb");
  const [selectedFont, setSelectedFont] = useState("Inter");
  const [customFont, setCustomFont] = useState("");
  const [bankInfo, setBankInfo] = useState({ name: "", acc: "", sort: "" });
  const [timezone, setTimezone] = useState("UTC+0 (London)");
  const [currency, setCurrency] = useState("GBP (£)");
  const [webhookUrl, setWebhookUrl] = useState("");

  // Extension Features States
  const [companyDetails, setCompanyDetails] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [socialLinks, setSocialLinks] = useState({ website: "", instagram: "", linkedin: "", twitter: "" });
  const [campaignList, setCampaignList] = useState<string[]>([]);
  const [newCampaign, setNewCampaign] = useState("");
  
  // Next of Kin states
  const [nextOfKin, setNextOfKin] = useState("");
  const [nextOfKinPhone, setNextOfKinPhone] = useState("");

  // Expanded fields
  const [emailCampaigns, setEmailCampaigns] = useState("");
  const [auditLogs, setAuditLogs] = useState<string[]>([
    "• Node initialized successfully.",
    "• System Architecture linked to dynamic state."
  ]);

  // Invite Link Helper
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
      
      if (isOnboarding) {
        router.push("/import");
      } else {
        alert("Settings synchronized globally.");
      }
    } catch (err: any) { alert("Sync Error: " + err.message); } finally { setSaving(false); }
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
      
      {/* ONBOARDING OVERLAY */}
      <AnimatePresence>
        {isOnboarding && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ y: 20, scale: 0.95 }} animate={{ y: 0, scale: 1 }}
              className="bg-white rounded-[3.5rem] p-12 max-w-xl text-center space-y-8 shadow-2xl border border-white relative"
            >
              <div className="w-24 h-24 bg-[#a9b897]/20 rounded-[2.5rem] flex items-center justify-center mx-auto text-[#a9b897]">
                <Palette size={48} />
              </div>
              <div className="space-y-3">
                <h2 className="text-5xl font-serif italic tracking-tight text-stone-900">Initialize Identity</h2>
                <p className="text-stone-500 text-sm leading-relaxed font-medium px-6">
                  Before the TOTS OS can activate its intelligence engines, it requires your brand DNA. 
                  Please configure your core identity to proceed.
                </p>
              </div>
              <button 
                onClick={() => router.replace("/settings")}
                className="w-full py-5 bg-[#1c1c1c] text-[#a9b897] rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all"
              >
                Begin Calibration
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global CSS Injector */}
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

      <div className="max-w-7xl mx-auto p-6 lg:p-16 space-y-12 pb-40">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-stone-200 pb-12">
          <div className="space-y-2">
            <h1 className="text-7xl font-serif italic tracking-tighter leading-none custom-brand-text">Command Center</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">System Node: {user?.email}</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => router.push("/import")} 
              className="flex items-center gap-3 px-8 py-5 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 font-black text-[10px] uppercase tracking-widest text-stone-700 transition-all shadow-sm"
            >
              <Database size={14} className="custom-brand-text" /> Import Data
            </button>

            <button 
              onClick={() => router.push("/team")} 
              className="flex items-center gap-3 px-8 py-5 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 font-black text-[10px] uppercase tracking-widest text-stone-700 transition-all shadow-sm"
            >
              <Users size={14} className="custom-brand-text" /> Team Node
            </button>

            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-4 rounded-2xl border border-stone-200 bg-white">
               {isDarkMode ? <Sun size={20} className="text-black"/> : <Moon size={20} />}
            </button>
            <button 
              onClick={handleGlobalSave} 
              disabled={saving} 
              className="flex items-center gap-4 px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl text-white custom-brand-bg"
            >
              {saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16} />} Commit All Changes
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-4 space-y-12">
            
            {/* BRAND ARCHITECTURE */}
            <section className="bg-white p-8 rounded-[3.5rem] border border-stone-100 shadow-sm space-y-6">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 flex items-center gap-2">
                <Palette size={14} className="custom-brand-text" /> Brand & Assets
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-stone-400">Accent Architecture Color</label>
                  <div className="flex items-center gap-4">
                    <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer" />
                    <span className="font-mono text-[10px] uppercase text-stone-400">{brandColor}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-stone-50">
                  <label className="text-[9px] font-black uppercase text-stone-400">Secondary Accent Color</label>
                  <div className="flex items-center gap-4">
                    <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer" />
                    <span className="font-mono text-[10px] uppercase text-stone-400">{secondaryColor}</span>
                  </div>
                </div>
                
                <div className="space-y-2 pt-4 border-t border-stone-50">
                  <label className="text-[9px] font-black uppercase text-stone-400 flex items-center gap-2">
                    <Type size={12} /> Typography Preset
                  </label>
                  <select 
                    value={selectedFont} 
                    onChange={e => {
                      setSelectedFont(e.target.value);
                      setCustomFont(""); 
                    }}
                    className="w-full p-4 rounded-xl border border-stone-100 bg-stone-50/50 text-xs outline-none"
                  >
                    <option value="Inter">Inter (Sans-Serif)</option>
                    <option value="Merriweather">Merriweather (Serif)</option>
                    <option value="Geist">Geist (Modern Mono)</option>
                    <option value="Playfair Display">Playfair Display (Elegant Serif)</option>
                    <option value="Roboto Mono">Roboto Mono (Developer)</option>
                    <option value="Orbitron">Orbitron (Futuristic Display)</option>
                  </select>
                </div>

                <div className="space-y-2 pt-4 border-t border-stone-50">
                  <label className="text-[9px] font-black uppercase text-stone-400 flex items-center gap-2">
                    <Upload size={12} /> Import Custom Font (Name)
                  </label>
                  <input 
                    type="text" 
                    value={customFont} 
                    onChange={e => setCustomFont(e.target.value)}
                    placeholder="e.g. 'Courier New'..." 
                    className="w-full p-4 rounded-xl border border-stone-100 bg-stone-50/50 text-xs outline-none" 
                  />
                </div>

                <div className="space-y-2 pt-4 border-t border-stone-50">
                  <label className="text-[9px] font-black uppercase text-stone-400">Company Logo Upload</label>
                  <input 
                    type="text" 
                    value={logoUrl} 
                    onChange={e => setLogoUrl(e.target.value)}
                    placeholder="Insert URL for logo file..." 
                    className="w-full p-4 rounded-xl border border-stone-100 bg-stone-50/50 text-xs outline-none" 
                  />
                </div>

                <div className="space-y-2 pt-4 border-t border-stone-50">
                  <label className="text-[9px] font-black uppercase text-stone-400">Company Details / Footer Info</label>
                  <textarea 
                    rows={6}
                    value={companyDetails} 
                    onChange={e => setCompanyDetails(e.target.value)}
                    placeholder="Enter company address..." 
                    className="w-full p-4 rounded-xl border border-stone-100 bg-stone-50/50 text-xs outline-none resize-none" 
                  />
                </div>
              </div>
            </section>

            {/* TIER SELECTION */}
            <section className="bg-white p-8 rounded-[3.5rem] border border-stone-100 shadow-sm space-y-6">
               <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 flex items-center gap-2"><ShieldCheck size={14}/> Subscription Tier</h2>
               <div className="grid grid-cols-1 gap-2">
                  {TIERS.map((t) => (
                    <button 
                      key={t} 
                      onClick={() => handleTierSelection(t)} 
                      className="p-4 rounded-2xl border text-[9px] font-black uppercase transition-all flex justify-between items-center"
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

            <section className="bg-white p-8 rounded-[3.5rem] border border-stone-100 shadow-sm space-y-8">
              <div className="flex flex-col items-center gap-6">
                <div className="relative group w-32 h-32 rounded-full bg-stone-50 border-2 border-dashed border-stone-200 flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <UserCircle size={40} className="opacity-10" />}
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"><Camera size={20} /><input type="file" className="hidden" /></label>
                </div>
                <input value={profile?.full_name || ""} onChange={e => setProfile({...profile, full_name: e.target.value})} placeholder="Full Name" className="text-center font-serif italic text-2xl w-full bg-transparent outline-none" />
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-5 bg-stone-50 rounded-2xl"><Mail size={18} className="text-stone-400" /><input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="bg-transparent text-xs font-bold outline-none w-full" /></div>
                <div className="flex items-center gap-4 p-5 bg-stone-50 rounded-2xl"><Fingerprint size={18} className="text-stone-400" /><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New Password" className="bg-transparent text-xs font-bold outline-none w-full" /></div>
                <div className="flex items-center gap-4 p-5 bg-stone-50 rounded-2xl"><Phone size={18} className="custom-brand-text" /><input value={profile?.phone || ""} onChange={e => setProfile({...profile, phone: e.target.value})} placeholder="Phone" className="bg-transparent text-xs font-bold outline-none w-full" /></div>
                
                <div className="space-y-3 p-5 bg-stone-50 rounded-2xl">
                  <label className="text-[9px] font-black uppercase text-stone-400 flex items-center gap-2">
                    <HeartPulse size={14} className="text-red-400" /> Emergency Contacts
                  </label>
                  <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-stone-100">
                    <User size={16} className="text-stone-400" />
                    <input 
                      value={nextOfKin} 
                      onChange={e => setNextOfKin(e.target.value)} 
                      placeholder="Next of Kin Name" 
                      className="bg-transparent text-xs font-bold outline-none w-full" 
                    />
                  </div>
                  <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-stone-100">
                    <Phone size={16} className="text-stone-400" />
                    <input 
                      placeholder="Next of Kin Phone Number" 
                      value={nextOfKinPhone} 
                      onChange={(e) => setNextOfKinPhone(e.target.value)} 
                      className="bg-transparent text-xs font-bold outline-none w-full" 
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-8 space-y-12">
            
            <section className="bg-white p-10 rounded-[4rem] border border-stone-100 shadow-sm space-y-6">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 flex items-center gap-2">
                <Link2 size={14} className="custom-brand-text" /> Platforms & Campaigns
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Web / Social Media Links</label>
                  <input value={socialLinks.website} onChange={e => setSocialLinks({...socialLinks, website: e.target.value})} placeholder="Website URL" className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs outline-none" />
                  <input value={socialLinks.instagram} onChange={e => setSocialLinks({...socialLinks, instagram: e.target.value})} placeholder="Instagram URL" className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs outline-none" />
                  <input value={socialLinks.linkedin} onChange={e => setSocialLinks({...socialLinks, linkedin: e.target.value})} placeholder="LinkedIn URL" className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs outline-none" />
                  <input value={socialLinks.twitter} onChange={e => setSocialLinks({...socialLinks, twitter: e.target.value})} placeholder="Twitter URL" className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs outline-none" />
                </div>
                
                <div className="space-y-4">
                  <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
                    <FolderGit size={14} /> Campaign List Management
                  </label>
                  <div className="flex gap-2">
                    <input value={newCampaign} onChange={e => setNewCampaign(e.target.value)} placeholder="Campaign Name" className="flex-1 p-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs outline-none" />
                    <button onClick={addCampaign} className="px-5 bg-stone-900 text-white rounded-2xl text-[10px] uppercase font-bold">Add</button>
                  </div>
                  <div className="h-44 overflow-y-auto space-y-2 border border-stone-100 rounded-3xl p-6 bg-stone-50/20">
                    {campaignList.map((campaign, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-3 border border-stone-100 rounded-xl">
                        <span className="text-xs font-serif italic">{campaign}</span>
                        <button onClick={() => removeCampaign(idx)} className="text-stone-300 hover:text-red-500"><Trash2 size={14}/></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white p-10 rounded-[4rem] border border-stone-100 shadow-sm space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
                        <ListChecks size={14} className="custom-brand-text" /> Email Campaigns List
                     </label>
                     <textarea 
                        value={emailCampaigns}
                        onChange={(e) => setEmailCampaigns(e.target.value)}
                        className="w-full p-4 bg-stone-50/50 rounded-2xl text-xs leading-relaxed outline-none h-36 resize-none border border-stone-100 focus:border-[#a9b897]/50 transition-colors text-stone-600"
                        placeholder="E.g., Summer Promotion..."
                     />
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-[9px] text-stone-400 italic">Manage and assign email marketing campaigns.</p>
                  </div>
               </div>
            </section>

            <section className="bg-white p-10 rounded-[4rem] border border-stone-100 shadow-sm">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-[12px] font-black uppercase tracking-[0.5em] opacity-40">The Hive</h2>
                <button onClick={() => router.push('/billing')} className="text-[9px] font-black bg-stone-900 text-[#a9b897] px-4 py-2 rounded-full uppercase tracking-widest">Add Seat £19.95</button>
              </div>

              {teamId && (
                <div className="mb-8 p-6 bg-stone-50 rounded-3xl border border-stone-100 flex items-center justify-between gap-4 group">
                  <div className="space-y-1 overflow-hidden">
                    <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Public Invitation Link</p>
                    <p className="text-[10px] font-mono text-stone-500 truncate">{inviteLink}</p>
                  </div>
                  <button onClick={copyInviteLink} className="p-4 bg-white border border-stone-200 rounded-2xl hover:bg-stone-900 hover:text-white transition-all shadow-sm">
                    <Copy size={16} />
                  </button>
                </div>
              )}

              <div className="space-y-8">
                <input placeholder="Invite email..." value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="w-full p-6 rounded-3xl border border-stone-100 bg-stone-50/50 text-base outline-none" />
                {inviteEmail.length > 0 && (
                  <div className="space-y-6 pt-6 border-t border-stone-50">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {APP_PAGES.map((page) => (
                        <button 
                          key={page.id} 
                          onClick={() => setSelectedPermissions(prev => prev.includes(page.id) ? prev.filter(p => p !== page.id) : [...prev, page.id])} 
                          className="p-4 rounded-2xl border text-[9px] font-black uppercase transition-all"
                          style={{
                            borderColor: selectedPermissions.includes(page.id) ? brandColor : "#f0f0f0",
                            backgroundColor: selectedPermissions.includes(page.id) ? `${brandColor}10` : "transparent",
                          }}
                        >
                          {page.label}
                        </button>
                      ))}
                    </div>
                    <button onClick={handleInvite} className="w-full py-6 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest custom-brand-bg">Provision Seat</button>
                  </div>
                )}
              </div>
              <div className="mt-12 space-y-4">
                {teamMembers.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-6 bg-stone-50/50 rounded-[2rem] border border-stone-100">
                    <span className="text-sm font-bold">{member.email}</span>
                    <button onClick={() => supabase.from("team_members").delete().eq("id", member.id).then(() => init())} className="text-stone-300 hover:text-red-500"><Trash2 size={18}/></button>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="bg-white p-8 rounded-[3.5rem] border border-stone-100 shadow-sm space-y-4">
                <h2 className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2"><Zap size={14}/> Integrations</h2>
                <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="Webhook URL" className="w-full p-4 bg-stone-50 rounded-2xl text-[10px] font-mono outline-none border border-stone-100" />
              </section>
              <section className="bg-white p-8 rounded-[3.5rem] border border-stone-100 shadow-sm space-y-4">
                <h2 className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2"><History size={14}/> Audit Log</h2>
                <div className="text-[9px] font-bold opacity-50 space-y-2 h-16 overflow-y-auto">
                  {auditLogs.map((log, index) => (
                    <p key={index}>{log}</p>
                  ))}
                </div>
              </section>
            </div>

            <section className="bg-white p-10 rounded-[3.5rem] border border-stone-100 shadow-sm space-y-6">
              <h2 className="text-[11px] font-black uppercase tracking-widest opacity-40">Signature</h2>
              <textarea value={profile?.email_signature || ""} onChange={e => setProfile({...profile, email_signature: e.target.value})} placeholder="Regards..." className="w-full h-32 p-6 rounded-3xl border border-stone-100 bg-stone-50/50 text-sm outline-none resize-none" />
            </section>

            <section className="text-white p-12 rounded-[4rem] shadow-2xl custom-secondary-bg">
              <div className="flex items-center gap-3 mb-8 opacity-50">
                <Landmark size={18} />
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em]">Banking Distribution</h2>
              </div>
              <div className="flex flex-wrap gap-6">
                <div className="flex-1 min-w-[240px] space-y-3">
                  <label className="text-[8px] font-black uppercase opacity-30 tracking-widest ml-2">Bank Entity</label>
                  <input value={bankInfo.name} onChange={e => setBankInfo({...bankInfo, name: e.target.value})} placeholder="Barclays" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-xs outline-none" />
                </div>
                <div className="flex-1 min-w-[240px] space-y-3">
                  <label className="text-[8px] font-black uppercase opacity-30 tracking-widest ml-2">Account Reference</label>
                  <input value={bankInfo.acc} onChange={e => setBankInfo({...bankInfo, acc: e.target.value})} placeholder="00000000" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-xs outline-none" />
                </div>
                <div className="flex-1 min-w-[240px] space-y-3">
                  <label className="text-[8px] font-black uppercase opacity-30 tracking-widest ml-2">Sort / Routing</label>
                  <input value={bankInfo.sort} onChange={e => setBankInfo({...bankInfo, sort: e.target.value})} placeholder="00-00-00" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-xs outline-none" />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}