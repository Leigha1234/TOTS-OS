"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client"; 
import { useSettings } from "@/app/context/SettingsContext";
import { 
  Save, Sun, Loader2, Users, Trash2, Check, Camera, Mail, 
  Phone, Palette, UserCircle, Fingerprint, ShieldCheck, Link2, 
  Database, Copy, LogOut, Smartphone, Zap, Sparkles,
  LayoutDashboard, Calendar, Megaphone, DollarSign,
  Briefcase, BarChart3, Globe, Lock, StickyNote, ArrowUpRight,
  UploadCloud, FileSpreadsheet, ShieldAlert
} from "lucide-react";

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
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfaf7] gap-4">
        <Loader2 className="animate-spin text-stone-300" size={40} />
        <p className="font-serif italic text-stone-400">Loading System Protocols...</p>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const router = useRouter();
  const { refreshSettings } = useSettings(); 
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [user, setUser] = useState<any>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState("STANDARD");
  const [profile, setProfile] = useState<any>({ full_name: "", phone: "", avatar_url: "" });
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  
  const [mobileNav, setMobileNav] = useState<string[]>([]);

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

  const inviteLink = useMemo(() => teamId ? `https://tots-os.co.uk/invite/${teamId}` : "", [teamId]);

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
        setCurrentTier(p.tier?.toUpperCase() || "STANDARD");
        setMobileNav(p.mobile_nav_config || ["/dashboard", "/clarity", "/calendar"]);
        if (p.brand_color) setBrandColor(p.brand_color);
        if (p.secondary_color) setSecondaryColor(p.secondary_color);
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
          if (settingsRes.data.brand_color) setBrandColor(settingsRes.data.brand_color);
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
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const handleGlobalSave = async () => {
    setSaving(true);
    try {
      const { error: profileError } = await supabase.from("profiles").update({ 
        full_name: profile.full_name, 
        phone: profile.phone, 
        next_of_kin: nextOfKin, 
        tier: currentTier,
        brand_color: brandColor,
        secondary_color: secondaryColor,
        font_family: selectedFont,
        mobile_nav_config: mobileNav 
      }).eq("id", user.id);

      if (profileError) throw profileError;

      if (teamId) {
        await supabase.from("settings").upsert({
          team_id: teamId, brand_color: brandColor, secondary_color: secondaryColor, font_family: selectedFont,
          bank_info: bankInfo, company_details: companyDetails, logo_url: logoUrl, social_links: socialLinks, 
          campaigns: campaignList, next_of_kin_phone: nextOfKinPhone
        });
      }

      await refreshSettings();
      alert("Neural Configuration Synced Successfully.");
    } catch (err: any) { 
      alert(err.message); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return null;

  return (
    <div className={`min-h-screen transition-colors duration-700 ${isDarkMode ? 'bg-stone-950 text-stone-200' : 'bg-[#fcfaf7] text-stone-900'}`}>
      
      <style jsx global>{`
        :root { 
          --brand-primary: ${brandColor}; 
          --brand-secondary: ${secondaryColor}; 
        }
        body { font-family: '${selectedFont}', sans-serif; }
        .bg-brand { background-color: var(--brand-primary) !important; }
        .text-brand { color: var(--brand-primary) !important; }
        .border-brand { border-color: var(--brand-primary) !important; }
        .bg-secondary { background-color: var(--brand-secondary) !important; }
      `}</style>

      <div className="max-w-7xl mx-auto p-6 md:p-12 lg:p-20 space-y-16">
        
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 border-b border-stone-200 pb-16">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Zap size={14} className="text-brand animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40">System Configuration</span>
            </div>
            <h1 className="text-7xl md:text-8xl font-serif italic tracking-tighter leading-[0.8] text-brand">Command</h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-5 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 transition-colors">
              <Sun size={20} className={isDarkMode ? "text-stone-400" : "text-brand"} />
            </button>
            <button onClick={handleGlobalSave} className="flex-1 md:flex-none flex items-center justify-center gap-4 px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] text-white bg-brand shadow-2xl hover:brightness-110 transition-all">
              {saving ? <Loader2 className="animate-spin" size={16}/> : <Fingerprint size={16} />} Commit Changes
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          
          <div className="lg:col-span-4 space-y-10">
            {/* PROFILE CARD */}
            <section className={`p-10 rounded-[3.5rem] border shadow-sm space-y-10 ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
              <div className="flex flex-col items-center gap-8">
                <div className="relative group w-40 h-40 rounded-full bg-stone-50 border-2 border-dashed border-stone-200 flex items-center justify-center overflow-hidden transition-all hover:border-brand">
                  {logoUrl ? <img src={logoUrl} className="w-full h-full object-cover" alt="Profile" /> : <UserCircle size={64} className="opacity-5" />}
                  <label className="absolute inset-0 bg-stone-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer text-[9px] font-black uppercase tracking-widest gap-2">
                    <Camera size={20} /> Update
                    <input type="file" className="hidden" />
                  </label>
                </div>
                <input 
                  value={profile.full_name || ""} 
                  onChange={e => setProfile({...profile, full_name: e.target.value})} 
                  className="text-center font-serif italic text-4xl w-full bg-transparent outline-none text-brand" 
                  placeholder="Identity Name" 
                />
              </div>

              <div className="space-y-4 pt-6 border-t border-stone-100">
                <div className="group space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest opacity-30 ml-4">Communication</label>
                  <div className="flex items-center gap-4 p-5 bg-stone-50 rounded-3xl border border-stone-100 focus-within:border-brand transition-colors">
                    <Mail size={16} className="text-stone-300" />
                    <input value={email} onChange={e => setEmail(e.target.value)} className="bg-transparent text-xs font-bold outline-none w-full text-stone-600" />
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 p-5 rounded-3xl border border-red-100 text-red-500 hover:bg-red-50 transition-all font-black text-[9px] uppercase tracking-widest"
                >
                  <LogOut size={14} /> Terminate Session
                </button>
              </div>
            </section>

            {/* AESTHETICS */}
            <section className={`p-10 rounded-[3.5rem] border ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100 shadow-sm'} space-y-8`}>
              <div className="flex items-center justify-between">
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 flex items-center gap-3"><Palette size={16}/> Aesthetic Engine</h2>
              </div>
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase opacity-40 ml-2">Primary</label>
                    <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-full h-14 rounded-2xl cursor-pointer bg-transparent border-none" />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase opacity-40 ml-2">Secondary</label>
                    <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-full h-14 rounded-2xl cursor-pointer bg-transparent border-none" />
                 </div>
              </div>
            </section>
          </div>

          <div className="lg:col-span-8 space-y-12">
            
            {/* IMPORT HUB (NEW/RESTORED) */}
            <section className={`p-10 lg:p-14 rounded-[4rem] border shadow-sm ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
               <div className="flex justify-between items-start mb-12">
                  <div className="space-y-2">
                    <h2 className="text-4xl font-serif italic text-brand">Import Hub</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Data Migration Protocols</p>
                  </div>
                  <Database size={24} className="text-stone-200" />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button className="flex items-center gap-6 p-8 rounded-[2.5rem] bg-stone-50 border border-stone-100 hover:border-brand transition-all group text-left">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-stone-400 group-hover:text-brand transition-colors">
                      <UploadCloud size={24} />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-stone-900">Import CRM</h4>
                      <p className="text-[9px] font-bold text-stone-400 mt-1 uppercase">CSV / VCF Format</p>
                    </div>
                  </button>
                  <button className="flex items-center gap-6 p-8 rounded-[2.5rem] bg-stone-50 border border-stone-100 hover:border-brand transition-all group text-left">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-stone-400 group-hover:text-brand transition-colors">
                      <FileSpreadsheet size={24} />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-stone-900">Import Ledger</h4>
                      <p className="text-[9px] font-bold text-stone-400 mt-1 uppercase">XLS / Statement</p>
                    </div>
                  </button>
               </div>
            </section>

            {/* MOBILE NAV CONFIG */}
            <section className={`p-10 lg:p-14 rounded-[4rem] border shadow-sm ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
               <div className="flex justify-between items-start mb-12">
                  <div className="space-y-2">
                    <h2 className="text-4xl font-serif italic text-brand">Architecture</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Select 3 Core Neural Hubs</p>
                  </div>
                  <div className="px-5 py-2 rounded-full bg-stone-50 border border-stone-100 text-[10px] font-black text-brand uppercase tracking-widest">
                    {mobileNav.length} / 3 Active
                  </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {NAV_OPTIONS.map((option) => {
                    const isSelected = mobileNav.includes(option.id);
                    const isDisabled = !isSelected && mobileNav.length >= 3;
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleToggleNav(option.id)}
                        disabled={isDisabled}
                        className={`relative flex flex-col items-center gap-4 p-8 rounded-[2.5rem] border transition-all ${isSelected ? 'bg-brand text-white border-transparent shadow-xl scale-[1.05]' : 'bg-stone-50 border-stone-100 text-stone-400 hover:border-stone-300 hover:text-stone-600'} ${isDisabled ? 'opacity-20 grayscale cursor-not-allowed' : 'opacity-100'}`}
                      >
                        <option.icon size={24} strokeWidth={1.5} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-center leading-tight">{option.label}</span>
                        {isSelected && <div className="absolute top-3 right-3"><Check size={12}/></div>}
                      </button>
                    );
                  })}
               </div>
            </section>

            {/* TEAM & LEGACY (RESTORED BUTTONS) */}
            <section className={`p-10 lg:p-14 rounded-[4rem] border shadow-sm ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
               <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
                 <div className="space-y-2 text-center md:text-left">
                   <h2 className="text-4xl font-serif italic text-brand">Legacy Management</h2>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">Team Provisioning</p>
                 </div>
                 <div className="flex gap-3">
                   <button onClick={() => {navigator.clipboard.writeText(inviteLink); alert("Link Copied");}} className="group flex items-center gap-4 bg-stone-900 text-white pl-6 pr-4 py-3 rounded-full hover:bg-brand transition-all shadow-xl">
                      <span className="text-[10px] font-black uppercase tracking-widest">Invite Link</span>
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20">
                        <Copy size={14} />
                      </div>
                   </button>
                   {/* Team Page Access Button */}
                   <button onClick={() => router.push('/team')} className="flex items-center gap-3 bg-white border border-stone-200 px-6 py-3 rounded-full hover:bg-stone-50 transition-all shadow-sm">
                      <span className="text-[10px] font-black uppercase tracking-widest text-stone-600">Full Team Page</span>
                      <ArrowUpRight size={14} className="text-stone-300" />
                   </button>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-300 ml-2">Invite Collaborator</label>
                    <div className="flex gap-2">
                      <input placeholder="Email Address..." value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="flex-1 p-5 rounded-3xl bg-stone-50 border border-stone-100 text-xs font-bold outline-none focus:border-brand transition-all" />
                      <button className="px-8 bg-stone-900 text-white rounded-3xl font-black text-[9px] uppercase tracking-widest hover:bg-brand transition-colors">Dispatch</button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-300 ml-2">Active Nodes ({teamMembers.length})</label>
                    <div className="space-y-3">
                       {teamMembers.map(m => (
                         <div key={m.id} className="flex justify-between items-center p-5 bg-stone-50 rounded-3xl border border-stone-100 hover:border-brand/20 transition-colors group">
                           <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-brand" />
                              <span className="text-xs font-bold text-stone-600">{m.email}</span>
                           </div>
                           <button className="text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                         </div>
                       ))}
                    </div>
                  </div>
               </div>
            </section>

            {/* FINANCE INFRASTRUCTURE */}
            <section className="bg-secondary p-12 lg:p-20 rounded-[4.5rem] text-white shadow-2xl relative overflow-hidden group">
               <div className="relative z-10 space-y-12">
                  <div className="flex justify-between items-center">
                    <div className="space-y-2">
                      <h2 className="text-4xl font-serif italic text-brand">Ledger Protocol</h2>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Secure Payout Data</p>
                    </div>
                    <Lock size={32} className="text-brand opacity-20 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     <div className="space-y-3">
                        <label className="text-[9px] font-black uppercase opacity-40 tracking-widest ml-2">Bank Institution</label>
                        <input value={bankInfo.name} onChange={e => setBankInfo({...bankInfo, name: e.target.value})} className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl text-sm font-bold outline-none focus:border-brand focus:bg-white/10 transition-all" placeholder="Name" />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[9px] font-black uppercase opacity-40 tracking-widest ml-2">Account No.</label>
                        <input value={bankInfo.acc} onChange={e => setBankInfo({...bankInfo, acc: e.target.value})} className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl text-sm font-bold outline-none focus:border-brand focus:bg-white/10 transition-all" placeholder="8 Digits" />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[9px] font-black uppercase opacity-40 tracking-widest ml-2">Sort Code</label>
                        <input value={bankInfo.sort} onChange={e => setBankInfo({...bankInfo, sort: e.target.value})} className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl text-sm font-bold outline-none focus:border-brand focus:bg-white/10 transition-all" placeholder="00-00-00" />
                     </div>
                  </div>
               </div>
               <div className="absolute top-0 right-0 w-full h-full bg-brand/5 blur-[150px] pointer-events-none" />
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}