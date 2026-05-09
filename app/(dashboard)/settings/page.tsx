"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client"; 
import { useSettings } from "@/app/context/SettingsContext"; // Ensure this path matches your project
import { 
  Save, Moon, Sun, Loader2, Landmark, 
  Users, Trash2, Check, Camera, Mail, 
  Phone, HeartPulse, Palette, UserCircle, 
  Fingerprint, History, ShieldCheck, Link2, 
  Database, Copy, LogOut, ExternalLink,
  Smartphone, CreditCard, Share2, Sparkles,
  LayoutDashboard, Calendar, Megaphone, DollarSign,
  Briefcase, BarChart3, Globe, Lock, StickyNote
} from "lucide-react";

// List of all possible pages that can be pinned
const NAV_OPTIONS = [
  { id: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "/clarity", label: "Clarity AI", icon: Sparkles },
  { id: "/calendar", label: "Calendar", icon: Calendar },
  { id: "/crm", label: "CRM", icon: Users },
  { id: "/notes", label: "Notes", icon: StickyNote },
  { id: "/campaigns", label: "Campaigns", icon: Megaphone },
  { id: "/payments", label: "Finance", icon: DollarSign },
  { id: "/projects", label: "Projects", icon: Briefcase },
  { id: "/reports", label: "Reports", icon: BarChart3 },
  { id: "/social", label: "Social", icon: Globe },
  { id: "/vault", label: "Vault", icon: Lock },
];

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#fcfaf7]"><Loader2 className="animate-spin text-[#a9b897]" size={40} /></div>}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const router = useRouter();
  const { refreshSettings } = useSettings(); // Hook into the global context brain
  
  // --- UI STATE ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // --- DATA STATE ---
  const [user, setUser] = useState<any>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState("STANDARD");
  const [profile, setProfile] = useState<any>({ full_name: "", phone: "", avatar_url: "" });
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  
  // --- MOBILE NAV CONFIG ---
  const [mobileNav, setMobileNav] = useState<string[]>(["/dashboard", "/clarity", "/calendar"]);

  // --- CONFIG STATE ---
  const [brandColor, setBrandColor] = useState("#a9b897");
  const [secondaryColor, setSecondaryColor] = useState("#1c1917");
  const [selectedFont, setSelectedFont] = useState("Inter");
  const [bankInfo, setBankInfo] = useState({ name: "", acc: "", sort: "" });
  const [companyDetails, setCompanyDetails] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [socialLinks, setSocialLinks] = useState({ website: "", instagram: "", linkedin: "" });
  const [campaignList, setCampaignList] = useState<string[]>([]);
  const [newCampaign, setNewCampaign] = useState("");
  const [nextOfKin, setNextOfKin] = useState("");
  const [nextOfKinPhone, setNextOfKinPhone] = useState("");
  const [auditLogs, setAuditLogs] = useState<string[]>(["• System Bridge Online"]);

  const inviteLink = useMemo(() => teamId ? `https://www.tots-os.co.uk/login?invite=${teamId}` : "", [teamId]);

  useEffect(() => { init(); }, []);

  async function init() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      setUser(user);
      setEmail(user.email || "");

      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (p) {
        setProfile(p);
        setNextOfKin(p.next_of_kin || "");
        if (p.tier) setCurrentTier(p.tier.toUpperCase());
        if (p.mobile_nav_config) setMobileNav(p.mobile_nav_config);
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
          setSecondaryColor(settingsRes.data.secondary_color || "#1c1917");
          setSelectedFont(settingsRes.data.font_family || "Inter");
          setBankInfo(settingsRes.data.bank_info || { name: "", acc: "", sort: "" });
          setCompanyDetails(settingsRes.data.company_details || "");
          setLogoUrl(settingsRes.data.logo_url || "");
          setSocialLinks(settingsRes.data.social_links || { website: "", instagram: "", linkedin: "" });
          setCampaignList(settingsRes.data.campaigns || []);
          setNextOfKinPhone(settingsRes.data.next_of_kin_phone || "");
        }
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  const handleToggleNav = (id: string) => {
    setMobileNav(prev => {
      if (prev.includes(id)) return prev.filter(item => item !== id);
      if (prev.length >= 3) return prev; // Lock at 3
      return [...prev, id];
    });
  };

  const handleGlobalSave = async () => {
    setSaving(true);
    try {
      // 1. Update Profile & Mobile Nav Architecture
      const { error: profileError } = await supabase.from("profiles").update({ 
        full_name: profile.full_name, 
        phone: profile.phone, 
        next_of_kin: nextOfKin, 
        tier: currentTier,
        brand_color: brandColor, // Syncing brand colors to profile for global context
        secondary_color: secondaryColor,
        font_family: selectedFont,
        mobile_nav_config: mobileNav 
      }).eq("id", user.id);

      if (profileError) throw profileError;

      // 2. Auth Updates
      if (email !== user.email || password) await supabase.auth.updateUser({ email, password });
      
      // 3. Team Settings Update
      if (teamId) {
        await supabase.from("settings").upsert({
          team_id: teamId, brand_color: brandColor, secondary_color: secondaryColor, font_family: selectedFont,
          bank_info: bankInfo, company_details: companyDetails, logo_url: logoUrl, social_links: socialLinks, 
          campaigns: campaignList, next_of_kin_phone: nextOfKinPhone
        });
      }

      // 4. THE HANDSHAKE: Tell the global context to refresh styles and nav across the whole app
      await refreshSettings();
      
      setAuditLogs(prev => [`• Global sync: ${new Date().toLocaleTimeString()}`, ...prev]);
      alert("System Protocol Updated & Synced Globally");

    } catch (err: any) { 
      alert(err.message); 
    } finally { 
      setSaving(false); 
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    alert("Invite link copied to clipboard.");
    setAuditLogs(prev => [`• Invite link generated & copied`, ...prev]);
  };

  const addCampaign = () => {
    if (newCampaign && !campaignList.includes(newCampaign)) {
      setCampaignList([...campaignList, newCampaign]);
      setNewCampaign("");
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-stone-950 text-stone-200' : 'bg-[#fcfaf7] text-stone-900'}`}>
      
      <style jsx global>{`
        :root { --brand-primary: ${brandColor}; --brand-secondary: ${secondaryColor}; }
        body { font-family: '${selectedFont}', sans-serif !important; }
        .custom-brand-text { color: var(--brand-primary); }
        .custom-brand-bg { background-color: var(--brand-primary); }
        .custom-secondary-bg { background-color: var(--brand-secondary); }
      `}</style>

      <div className="max-w-[1600px] mx-auto p-4 md:p-12 lg:p-20 space-y-12 pb-32">
        
        {/* TOP BAR */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 border-b border-stone-200 pb-12">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-8xl font-serif italic tracking-tighter leading-none custom-brand-text">Command Center</h1>
            <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest opacity-40">
               <span className="flex items-center gap-2"><Smartphone size={12}/> System Active</span>
               <span className="flex items-center gap-2"><ShieldCheck size={12}/> Tier: {currentTier}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:flex items-center gap-3 w-full xl:w-auto">
            <button onClick={() => router.push("/import")} className="flex items-center justify-center gap-2 p-4 md:px-6 md:py-5 rounded-2xl border border-stone-200 bg-white font-black text-[9px] uppercase tracking-widest shadow-sm hover:bg-stone-50 transition-all">
              <Database size={14} className="custom-brand-text" /> Import Data
            </button>
            <button onClick={() => router.push("/team")} className="flex items-center justify-center gap-2 p-4 md:px-6 md:py-5 rounded-2xl border border-stone-200 bg-white font-black text-[9px] uppercase tracking-widest shadow-sm hover:bg-stone-50 transition-all">
              <Users size={14} className="custom-brand-text" /> Team Page
            </button>
            <div className="flex gap-2">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-5 rounded-2xl border border-stone-200 bg-white"><Sun size={18} /></button>
              <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="p-5 rounded-2xl border border-stone-200 bg-white text-stone-400"><LogOut size={18} /></button>
            </div>
            <button onClick={handleGlobalSave} className="col-span-2 flex items-center justify-center gap-4 px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white custom-brand-bg shadow-xl hover:opacity-90 transition-all">
              {saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16} />} Commit Sync
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-4 space-y-8">
            {/* Identity Card */}
            <section className={`p-8 rounded-[3rem] border shadow-sm space-y-8 ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
              <div className="flex flex-col items-center gap-6">
                <div className="relative group w-32 h-32 rounded-full bg-stone-50 border-2 border-dashed border-stone-200 flex items-center justify-center overflow-hidden">
                  {logoUrl ? <img src={logoUrl} className="w-full h-full object-cover" /> : <UserCircle size={48} className="opacity-10" />}
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"><Camera size={18} /><input type="file" className="hidden" /></label>
                </div>
                <input value={profile.full_name || ""} onChange={e => setProfile({...profile, full_name: e.target.value})} className="text-center font-serif italic text-3xl w-full bg-transparent outline-none custom-brand-text" placeholder="Identity" />
              </div>

              <div className="space-y-3 pt-4 border-t border-stone-50">
                <div className="flex items-center gap-4 p-4 bg-stone-50/50 rounded-2xl border border-stone-100">
                  <Mail size={16} className="text-stone-300" />
                  <input value={email} onChange={e => setEmail(e.target.value)} className="bg-transparent text-xs font-bold outline-none w-full" />
                </div>
                <div className="flex items-center gap-4 p-4 bg-stone-50/50 rounded-2xl border border-stone-100">
                  <Phone size={16} className="text-stone-300" />
                  <input value={profile.phone || ""} onChange={e => setProfile({...profile, phone: e.target.value})} className="bg-transparent text-xs font-bold outline-none w-full" placeholder="Phone" />
                </div>
              </div>

              <div className="p-6 bg-red-50/30 border border-red-100 rounded-3xl space-y-3">
                 <h3 className="text-[9px] font-black uppercase tracking-widest text-red-500">Emergency Protocol</h3>
                 <input value={nextOfKin} onChange={e => setNextOfKin(e.target.value)} className="w-full bg-white p-3 rounded-xl border border-red-50 text-xs outline-none" placeholder="Next of Kin Name" />
                 <input value={nextOfKinPhone} onChange={e => setNextOfKinPhone(e.target.value)} className="w-full bg-white p-3 rounded-xl border border-red-50 text-xs outline-none" placeholder="Next of Kin Phone" />
              </div>
            </section>

            {/* Aesthetics */}
            <section className={`p-8 rounded-[3rem] border ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100 shadow-sm'} space-y-6`}>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 flex items-center gap-2"><Palette size={14}/> Aesthetics</h2>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase opacity-40">Primary</label>
                    <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-full h-10 rounded-xl cursor-pointer bg-transparent" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase opacity-40">Secondary</label>
                    <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-full h-10 rounded-xl cursor-pointer bg-transparent" />
                 </div>
              </div>
              <select value={selectedFont} onChange={e => setSelectedFont(e.target.value)} className="w-full p-4 rounded-2xl bg-stone-50 border border-stone-100 text-xs font-bold outline-none">
                 <option value="Inter">Inter (Global)</option>
                 <option value="Merriweather">Merriweather (Serif)</option>
                 <option value="Geist">Geist (Modern)</option>
              </select>
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* MOBILE NAV ARCHITECTURE */}
            <section className={`p-8 lg:p-12 rounded-[4rem] border shadow-sm ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
               <div className="space-y-1 mb-8">
                  <h2 className="text-4xl font-serif italic custom-brand-text">Mobile Architecture</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Choose your Top 3 Pinned Pages</p>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {NAV_OPTIONS.map((option) => {
                    const isSelected = mobileNav.includes(option.id);
                    const isDisabled = !isSelected && mobileNav.length >= 3;
                    
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleToggleNav(option.id)}
                        disabled={isDisabled}
                        className={`
                          relative flex flex-col items-start gap-4 p-6 rounded-[2rem] border transition-all text-left
                          ${isSelected 
                            ? 'custom-brand-bg text-white border-transparent shadow-xl scale-[1.02]' 
                            : 'bg-stone-50 border-stone-100 text-stone-400 hover:border-stone-200'}
                          ${isDisabled ? 'opacity-20 grayscale cursor-not-allowed' : 'opacity-100'}
                        `}
                      >
                        <option.icon size={20} className={isSelected ? 'text-white' : 'text-stone-300'} />
                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase tracking-widest block">{option.label}</span>
                          {isSelected && <span className="text-[7px] font-bold opacity-60 uppercase tracking-tighter">Pinned No. {mobileNav.indexOf(option.id) + 1}</span>}
                        </div>
                        {isSelected && <div className="absolute top-4 right-4"><Check size={12}/></div>}
                      </button>
                    );
                  })}
               </div>
               
               <div className="mt-8 p-6 bg-stone-50 rounded-3xl border border-stone-100 flex items-center justify-between">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Selection Status</p>
                  <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`w-8 h-1.5 rounded-full ${mobileNav.length >= i ? 'custom-brand-bg' : 'bg-stone-200'}`} />
                    ))}
                  </div>
               </div>
            </section>

            {/* TEAM & INVITE */}
            <section className={`p-8 lg:p-12 rounded-[4rem] border shadow-sm ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
               <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
                 <div className="space-y-1">
                   <h2 className="text-4xl font-serif italic custom-brand-text">The Hive</h2>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Security & Seats</p>
                 </div>
                 <div className="flex gap-2 w-full md:w-auto">
                    <div className="flex-1 md:flex-none bg-stone-50 border border-stone-100 px-4 py-3 rounded-xl text-[10px] font-mono truncate max-w-[200px]">{inviteLink}</div>
                    <button onClick={copyInviteLink} className="p-4 bg-stone-900 text-white rounded-xl hover:bg-[#a9b897] transition-all"><Copy size={16} /></button>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-300">Provision Seat</h3>
                    <input placeholder="Colleague Email..." value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="w-full p-5 rounded-2xl bg-stone-50 border border-stone-100 text-xs font-bold outline-none" />
                    <button className="w-full py-5 custom-brand-bg text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">Send Protocol</button>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-300">Active Nodes ({teamMembers.length})</h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                       {teamMembers.map(m => (
                         <div key={m.id} className="flex justify-between items-center p-4 bg-stone-50 rounded-2xl border border-stone-100">
                           <span className="text-xs font-bold truncate pr-4">{m.email}</span>
                           <button className="text-stone-300 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                         </div>
                       ))}
                    </div>
                  </div>
               </div>
            </section>

            {/* LEDGER DISTRIBUTION */}
            <section className="custom-secondary-bg p-8 lg:p-16 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
               <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
                  <div className="space-y-2">
                    <h2 className="text-4xl font-serif italic text-[#a9b897]">Ledger Distribution</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Payout Infrastructure</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                     <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase opacity-40 tracking-widest">Institution</label>
                        <input value={bankInfo.name} onChange={e => setBankInfo({...bankInfo, name: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-sm font-bold outline-none focus:border-[#a9b897]" placeholder="Bank Name" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase opacity-40 tracking-widest">Account No.</label>
                        <input value={bankInfo.acc} onChange={e => setBankInfo({...bankInfo, acc: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-sm font-bold outline-none focus:border-[#a9b897]" placeholder="8 Digits" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase opacity-40 tracking-widest">Sort Code</label>
                        <input value={bankInfo.sort} onChange={e => setBankInfo({...bankInfo, sort: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-sm font-bold outline-none focus:border-[#a9b897]" placeholder="00-00-00" />
                     </div>
                  </div>
               </div>
               <div className="absolute top-0 right-0 w-96 h-96 bg-[#a9b897]/5 blur-[120px] rounded-full" />
            </section>

            {/* DATA BRIDGES */}
            <section className={`p-8 lg:p-12 rounded-[4rem] border shadow-sm ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
               <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 flex items-center gap-2 mb-8"><Link2 size={16} className="custom-brand-text" /> Data Bridges</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-stone-300">Social & Web</label>
                     <input value={socialLinks.website} onChange={e => setSocialLinks({...socialLinks, website: e.target.value})} placeholder="Website URL" className="w-full p-4 bg-stone-50 border border-stone-100 rounded-xl text-xs outline-none" />
                     <input value={socialLinks.instagram} onChange={e => setSocialLinks({...socialLinks, instagram: e.target.value})} placeholder="Instagram Handle" className="w-full p-4 bg-stone-50 border border-stone-100 rounded-xl text-xs outline-none" />
                  </div>
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-stone-300">Campaign Identifiers</label>
                     <div className="flex gap-2">
                        <input value={newCampaign} onChange={e => setNewCampaign(e.target.value)} placeholder="New Campaign..." className="flex-1 p-4 bg-stone-50 border border-stone-100 rounded-xl text-xs outline-none" />
                        <button onClick={addCampaign} className="px-6 custom-brand-bg text-white rounded-xl font-bold text-[10px] uppercase">Add</button>
                     </div>
                     <div className="flex flex-wrap gap-2 pt-2">
                        {campaignList.map((c, i) => (
                          <div key={i} className="flex items-center gap-2 px-3 py-2 bg-stone-50 border border-stone-100 rounded-lg text-[10px] font-bold">
                             {c} <button onClick={() => setCampaignList(campaignList.filter((_, idx) => idx !== i))} className="text-stone-300 hover:text-red-500"><Trash2 size={10}/></button>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}