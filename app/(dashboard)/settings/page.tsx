"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client"; 
import { useSettings } from "@/app/context/SettingsContext";
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <Loader2 className="animate-spin text-[var(--brand-primary)]" size={40} />
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
  
  const [mobileNav, setMobileNav] = useState<string[]>(["/dashboard", "/clarity", "/calendar"]);

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

      if (email !== user.email || password) await supabase.auth.updateUser({ email, password });
      
      if (teamId) {
        await supabase.from("settings").upsert({
          team_id: teamId, 
          brand_color: brandColor, 
          secondary_color: secondaryColor, 
          font_family: selectedFont,
          bank_info: bankInfo, 
          company_details: companyDetails, 
          logo_url: logoUrl, 
          social_links: socialLinks, 
          campaigns: campaignList, 
          next_of_kin_phone: nextOfKinPhone // Fixed naming error here
        });
      }

      await refreshSettings();
      setAuditLogs(prev => [`• Global sync: ${new Date().toLocaleTimeString()}`, ...prev]);
      alert("System Protocol Updated & Synced Globally");

    } catch (err: any) { 
      alert(err.message); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleToggleNav = (id: string) => {
    setMobileNav(prev => {
      if (prev.includes(id)) return prev.filter(item => item !== id);
      if (prev.length >= 3) return prev; 
      return [...prev, id];
    });
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    alert("Invite link copied to clipboard.");
  };

  const addCampaign = () => {
    if (newCampaign && !campaignList.includes(newCampaign)) {
      setCampaignList([...campaignList, newCampaign]);
      setNewCampaign("");
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 bg-[var(--bg)] text-[var(--text-main)]`}>
      
      <style jsx global>{`
        :root { --brand-primary: ${brandColor}; --brand-secondary: ${secondaryColor}; }
        body { font-family: '${selectedFont}', sans-serif !important; }
      `}</style>

      <div className="max-w-[1600px] mx-auto p-4 md:p-12 lg:p-20 space-y-12 pb-32">
        
        {/* HEADER */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 border-b border-[var(--border)] pb-12">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-8xl font-serif italic tracking-tighter leading-none text-[var(--brand-primary)]">Command Center</h1>
            <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
               <span className="flex items-center gap-2"><Smartphone size={12}/> System Active</span>
               <span className="flex items-center gap-2"><ShieldCheck size={12}/> Tier: {currentTier}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:flex items-center gap-3 w-full xl:w-auto">
            <button onClick={() => router.push("/import")} className="flex items-center justify-center gap-2 p-4 md:px-6 md:py-5 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] font-black text-[9px] uppercase tracking-widest shadow-sm hover:bg-[var(--bg-soft)] transition-all">
              <Database size={14} className="text-[var(--brand-primary)]" /> Import Data
            </button>
            <button onClick={() => router.push("/team")} className="flex items-center justify-center gap-2 p-4 md:px-6 md:py-5 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] font-black text-[9px] uppercase tracking-widest shadow-sm hover:bg-[var(--bg-soft)] transition-all">
              <Users size={14} className="text-[var(--brand-primary)]" /> Team Page
            </button>
            <div className="flex gap-2">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-main)]"><Sun size={18} /></button>
              <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-muted)]"><LogOut size={18} /></button>
            </div>
            <button onClick={handleGlobalSave} className="col-span-2 flex items-center justify-center gap-4 px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white bg-[var(--brand-primary)] shadow-xl hover:opacity-90 transition-all">
              {saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16} />} Commit Sync
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          
          <div className="lg:col-span-4 space-y-8">
            {/* PROFILE SECTION */}
            <section className={`p-8 rounded-[3rem] border border-[var(--border)] bg-[var(--card-bg)] shadow-sm space-y-8`}>
              <div className="flex flex-col items-center gap-6">
                <div className="relative group w-32 h-32 rounded-full bg-[var(--bg-soft)] border-2 border-dashed border-[var(--border)] flex items-center justify-center overflow-hidden">
                  {logoUrl ? <img src={logoUrl} className="w-full h-full object-cover" /> : <UserCircle size={48} className="opacity-10 text-[var(--text-main)]" />}
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"><Camera size={18} /><input type="file" className="hidden" /></label>
                </div>
                <input value={profile.full_name || ""} onChange={e => setProfile({...profile, full_name: e.target.value})} className="text-center font-serif italic text-3xl w-full bg-transparent outline-none text-[var(--brand-primary)]" placeholder="Identity" />
              </div>

              <div className="space-y-3 pt-4 border-t border-[var(--border)]">
                <div className="flex items-center gap-4 p-4 bg-[var(--bg-soft)] rounded-2xl border border-[var(--border)]">
                  <Mail size={16} className="text-[var(--text-muted)]" />
                  <input value={email} onChange={e => setEmail(e.target.value)} className="bg-transparent text-xs font-bold outline-none w-full text-[var(--text-main)]" />
                </div>
                <div className="flex items-center gap-4 p-4 bg-[var(--bg-soft)] rounded-2xl border border-[var(--border)]">
                  <Phone size={16} className="text-[var(--text-muted)]" />
                  <input value={profile.phone || ""} onChange={e => setProfile({...profile, phone: e.target.value})} className="bg-transparent text-xs font-bold outline-none w-full text-[var(--text-main)]" placeholder="Phone" />
                </div>
              </div>

              <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-3xl space-y-3">
                 <h3 className="text-[9px] font-black uppercase tracking-widest text-red-500">Emergency Protocol</h3>
                 <input value={nextOfKin} onChange={e => setNextOfKin(e.target.value)} className="w-full bg-[var(--card-bg)] p-3 rounded-xl border border-[var(--border)] text-xs outline-none text-[var(--text-main)]" placeholder="Next of Kin Name" />
                 <input value={nextOfKinPhone} onChange={e => setNextOfKinPhone(e.target.value)} className="w-full bg-[var(--card-bg)] p-3 rounded-xl border border-[var(--border)] text-xs outline-none text-[var(--text-main)]" placeholder="Next of Kin Phone" />
              </div>
            </section>

            {/* AESTHETICS SECTION */}
            <section className={`p-8 rounded-[3rem] border border-[var(--border)] bg-[var(--card-bg)] shadow-sm space-y-6`}>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-muted)] flex items-center gap-2"><Palette size={14}/> Aesthetics</h2>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase text-[var(--text-muted)]">Primary</label>
                    <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-full h-10 rounded-xl cursor-pointer bg-transparent border-none" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase text-[var(--text-muted)]">Secondary</label>
                    <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-full h-10 rounded-xl cursor-pointer bg-transparent border-none" />
                 </div>
              </div>
              <select value={selectedFont} onChange={e => setSelectedFont(e.target.value)} className="w-full p-4 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)] text-xs font-bold outline-none text-[var(--text-main)]">
                 <option value="Inter">Inter (Global)</option>
                 <option value="Merriweather">Merriweather (Serif)</option>
                 <option value="Geist">Geist (Modern)</option>
              </select>
            </section>
          </div>

          <div className="lg:col-span-8 space-y-8">
            {/* DATA BRIDGES / SOCIALS SECTION */}
            <section className={`p-8 lg:p-12 rounded-[4rem] border border-[var(--border)] bg-[var(--card-bg)] shadow-sm`}>
               <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-muted)] flex items-center gap-2 mb-8"><Link2 size={16} className="text-[var(--brand-primary)]" /> Data Bridges</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Social & Web</label>
                     <input value={socialLinks.website} onChange={e => setSocialLinks({...socialLinks, website: e.target.value})} placeholder="Website URL" className="w-full p-4 bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-main)] outline-none" />
                     <input value={socialLinks.instagram} onChange={e => setSocialLinks({...socialLinks, instagram: e.target.value})} placeholder="Instagram Handle" className="w-full p-4 bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-main)] outline-none" />
                  </div>
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Campaign Identifiers</label>
                     <div className="flex gap-2">
                        <input value={newCampaign} onChange={e => setNewCampaign(e.target.value)} placeholder="New Campaign..." className="flex-1 p-4 bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-main)] outline-none" />
                        <button onClick={addCampaign} className="px-6 bg-[var(--brand-primary)] text-white rounded-xl font-bold text-[10px] uppercase">Add</button>
                     </div>
                     <div className="flex flex-wrap gap-2 pt-2">
                        {campaignList.map((c, i) => (
                          <div key={i} className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-soft)] border border-[var(--border)] rounded-lg text-[10px] font-bold text-[var(--text-main)]">
                             {c} <button onClick={() => setCampaignList(campaignList.filter((_, idx) => idx !== i))} className="text-[var(--text-muted)] hover:text-red-500"><Trash2 size={10}/></button>
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