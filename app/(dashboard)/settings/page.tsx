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
  Upload, Link2, FolderGit, Type, HeartHandshake, ListChecks
} from "lucide-react";

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
  
  // Auth Updates
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(["dashboard"]);

  const [brandColor, setBrandColor] = useState("#a9b897");
  const [secondaryColor, setSecondaryColor] = useState("#e5e7eb");
  const [selectedFont, setSelectedFont] = useState("Inter");
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
  const [nextOfKin, setNextOfKin] = useState("");
  const [nextOfKinPhone, setNextOfKinPhone] = useState("");

  // Expanded fields
  const [emailCampaigns, setEmailCampaigns] = useState("");
  const [auditLogs, setAuditLogs] = useState<string[]>([
    "• Node initialized successfully.",
    "• System Architecture linked to dynamic state."
  ]);

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
      }

      setAuditLogs(prev => [`• Settings updated at ${new Date().toLocaleTimeString()}`, ...prev]);
      alert("Settings synchronized globally.");
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#fcfaf7]"><Loader2 className="animate-spin text-[#a9b897]" size={40} /></div>;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-stone-950 text-stone-200' : 'bg-[#fcfaf7] text-stone-900'}`}>
      
      {/* Dynamic CSS Custom Overrides */}
      <style jsx global>{`
        body {
          font-family: '${selectedFont}', sans-serif;
        }
        .custom-brand-text {
          color: ${brandColor};
        }
        .custom-brand-bg {
          background-color: ${brandColor};
        }
      `}</style>

      <div className="max-w-7xl mx-auto p-6 lg:p-16 space-y-12 pb-40">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-stone-200 pb-12">
          <div className="space-y-2">
            <h1 className="text-7xl font-serif italic tracking-tighter leading-none custom-brand-text" style={{ color: brandColor }}>Command Center</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">System Node: {user?.email}</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-4 rounded-2xl border border-stone-200 bg-white">
               {isDarkMode ? <Sun size={20} className="text-black"/> : <Moon size={20} />}
            </button>
            <button 
              onClick={handleGlobalSave} 
              disabled={saving} 
              className="flex items-center gap-4 px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl text-white"
              style={{ backgroundColor: brandColor }}
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
                <Palette size={14} className="text-[#a9b897]" /> Brand & Assets
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
                    onChange={e => setSelectedFont(e.target.value)}
                    className="w-full p-4 rounded-xl border border-stone-100 bg-stone-50/50 text-xs outline-none"
                  >
                    <option value="Inter">Inter (Sans-Serif)</option>
                    <option value="Merriweather">Merriweather (Serif)</option>
                    <option value="Geist">Geist (Modern Mono)</option>
                  </select>
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
                    placeholder="Enter company address, reg. numbers, or corporate statements..." 
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
                <div className="flex items-center gap-4 p-5 bg-stone-50 rounded-2xl"><Phone size={18} className="text-[#a9b897]" /><input value={profile?.phone || ""} onChange={e => setProfile({...profile, phone: e.target.value})} placeholder="Phone" className="bg-transparent text-xs font-bold outline-none w-full" /></div>
                <div className="flex items-center gap-4 p-5 bg-stone-50 rounded-2xl"><HeartPulse size={18} className="text-red-400" /><input value={nextOfKin} onChange={e => setNextOfKin(e.target.value)} placeholder="Next of Kin Phone Number" className="bg-transparent text-xs font-bold outline-none w-full" /></div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* EXTERNAL LINKS SECTION */}
            <section className="bg-white p-10 rounded-[4rem] border border-stone-100 shadow-sm space-y-6">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 flex items-center gap-2">
                <Link2 size={14} className="text-[#a9b897]" /> Platforms & Campaigns
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Web / Social Media Links</label>
                  <input value={socialLinks.website} onChange={e => setSocialLinks({...socialLinks, website: e.target.value})} placeholder="Website URL" className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs outline-none" />
                  <input value={socialLinks.instagram} onChange={e => setSocialLinks({...socialLinks, instagram: e.target.value})} placeholder="Instagram Profile URL" className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs outline-none" />
                  <input value={socialLinks.linkedin} onChange={e => setSocialLinks({...socialLinks, linkedin: e.target.value})} placeholder="LinkedIn Profile URL" className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs outline-none" />
                  <input value={socialLinks.twitter} onChange={e => setSocialLinks({...socialLinks, twitter: e.target.value})} placeholder="X (Twitter) Profile URL" className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs outline-none" />
                </div>
                
                <div className="space-y-4">
                  <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
                    <FolderGit size={14} /> Campaign List Management
                  </label>
                  <div className="flex gap-2">
                    <input value={newCampaign} onChange={e => setNewCampaign(e.target.value)} placeholder="Enter Campaign Name" className="flex-1 p-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs outline-none" />
                    <button onClick={addCampaign} className="px-5 bg-stone-900 text-white rounded-2xl text-[10px] uppercase font-bold">Add</button>
                  </div>
                  <div className="h-44 overflow-y-auto space-y-2 border border-stone-100 rounded-3xl p-6 bg-stone-50/20">
                    {campaignList.map((campaign, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-3 border border-stone-100 rounded-xl">
                        <span className="text-xs font-serif italic">{campaign}</span>
                        <button onClick={() => removeCampaign(idx)} className="text-stone-300 hover:text-red-500"><Trash2 size={14}/></button>
                      </div>
                    ))}
                    {campaignList.length === 0 && <span className="text-[10px] text-stone-300 italic">No campaigns listed.</span>}
                  </div>
                </div>
              </div>
            </section>

            {/* ADDITIONAL CAMPAIGNS AND NOK FIELDS */}
            <section className="bg-white p-10 rounded-[4rem] border border-stone-100 shadow-sm space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
                        <ListChecks size={14} className="text-[#a9b897]" /> Email Campaigns List
                     </label>
                     <textarea 
                        value={emailCampaigns}
                        onChange={(e) => setEmailCampaigns(e.target.value)}
                        className="w-full p-4 bg-stone-50/50 rounded-2xl text-xs leading-relaxed outline-none h-36 resize-none border border-stone-100 focus:border-[#a9b897]/50 transition-colors text-stone-600"
                        placeholder="E.g., Summer Promotion, Winter Newsletter, VIP Launch"
                     />
                  </div>

                  <div className="space-y-3">
                     <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
                        <HeartHandshake size={14} className="text-[#a9b897]" /> Emergency Contacts
                     </label>
                     <div className="p-4 bg-stone-50/50 rounded-2xl flex items-center gap-4 border border-stone-100 focus-within:border-stone-200 transition-all">
                        <Phone size={16} className="text-[#a9b897]" />
                        <input 
                           placeholder="Next of Kin Phone Number" 
                           value={nextOfKinPhone} 
                           onChange={(e) => setNextOfKinPhone(e.target.value)} 
                           className="bg-transparent text-xs font-bold outline-none w-full" 
                        />
                     </div>
                     <p className="text-[9px] text-stone-400 italic">This number will be stored in your encrypted employee records.</p>
                  </div>
               </div>
            </section>

            <section className="bg-white p-10 rounded-[4rem] border border-stone-100 shadow-sm">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-[12px] font-black uppercase tracking-[0.5em] opacity-40">The Hive</h2>
                <button onClick={() => router.push('/billing')} className="text-[9px] font-black bg-stone-900 text-[#a9b897] px-4 py-2 rounded-full uppercase tracking-widest">Add Seat £19.95</button>
              </div>
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
                    <button 
                      onClick={handleInvite} 
                      className="w-full py-6 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest"
                      style={{ backgroundColor: brandColor }}
                    >
                      Provision Seat
                    </button>
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
              <textarea value={profile?.email_signature || ""} onChange={e => setProfile({...profile, email_signature: e.target.value})} placeholder="Regards, Management" className="w-full h-32 p-6 rounded-3xl border border-stone-100 bg-stone-50/50 text-sm outline-none resize-none" />
            </section>

            {/* BANKING SECTION */}
            <section className="text-white p-12 rounded-[4rem] shadow-2xl custom-secondary-bg" style={{ backgroundColor: secondaryColor }}>
              <div className="flex items-center gap-3 mb-8 opacity-50">
                <Landmark size={18} />
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em]">Banking Distribution</h2>
              </div>
              <div className="flex flex-wrap gap-6">
                <div className="flex-1 min-w-[240px] space-y-3">
                  <label className="text-[8px] font-black uppercase opacity-30 tracking-widest ml-2">Bank Entity</label>
                  <input value={bankInfo.name} onChange={e => setBankInfo({...bankInfo, name: e.target.value})} placeholder="e.g. Barclays" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-xs outline-none focus:border-[#a9b897]/50 transition-colors" />
                </div>
                <div className="flex-1 min-w-[240px] space-y-3">
                  <label className="text-[8px] font-black uppercase opacity-30 tracking-widest ml-2">Account Reference</label>
                  <input value={bankInfo.acc} onChange={e => setBankInfo({...bankInfo, acc: e.target.value})} placeholder="00000000" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-xs outline-none focus:border-[#a9b897]/50 transition-colors" />
                </div>
                <div className="flex-1 min-w-[240px] space-y-3">
                  <label className="text-[8px] font-black uppercase opacity-30 tracking-widest ml-2">Sort / Routing</label>
                  <input value={bankInfo.sort} onChange={e => setBankInfo({...bankInfo, sort: e.target.value})} placeholder="00-00-00" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-xs outline-none focus:border-[#a9b897]/50 transition-colors" />
                </div>
              </div>
            </section>

            <section className="bg-red-50/50 border border-red-100 p-10 rounded-[3.5rem] space-y-6">
              <div className="flex items-center gap-3 text-red-600">
                <AlertTriangle size={20} />
                <h2 className="text-[11px] font-black uppercase tracking-widest">Danger Zone</h2>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <button className="flex-1 py-4 bg-white border border-red-200 text-red-600 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2"><Download size={14}/> Export Node Data</button>
                <button className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:brightness-110 transition-all">Terminate Account</button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}