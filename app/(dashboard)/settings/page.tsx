"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Save, Moon, Sun, Loader2, Landmark, 
  Users, Trash2, Check, Download,
  Eye, EyeOff, UserPlus, AlertTriangle,
  Camera, Mail, Phone, HeartPulse, Palette,
  UserCircle, Fingerprint, Globe, History, Zap, ShieldCheck,
  Upload, Link2, FolderGit, Type, HeartHandshake, ListChecks,
  Database, User, Copy, ArrowUpRight, LogOut, ChevronRight
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
  
  // --- UI & SYSTEM STATE ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [teamId, setTeamId] = useState<string | null>(null);

  // --- FORM STATE ---
  const [currentTier, setCurrentTier] = useState("STANDARD");
  const [profile, setProfile] = useState<any>({
    full_name: "", phone: "", avatar_url: "", next_of_kin: "", email_signature: ""
  });
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(["dashboard"]);

  // --- BRAND & INFRASTRUCTURE ---
  const [brandColor, setBrandColor] = useState("#a9b897");
  const [secondaryColor, setSecondaryColor] = useState("#1c1917");
  const [selectedFont, setSelectedFont] = useState("Inter");
  const [bankInfo, setBankInfo] = useState({ name: "", acc: "", sort: "" });
  const [companyDetails, setCompanyDetails] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [socialLinks, setSocialLinks] = useState({ website: "", instagram: "", linkedin: "", twitter: "" });
  const [campaignList, setCampaignList] = useState<string[]>([]);
  const [newCampaign, setNewCampaign] = useState("");
  const [nextOfKin, setNextOfKin] = useState("");
  const [nextOfKinPhone, setNextOfKinPhone] = useState("");
  const [auditLogs, setAuditLogs] = useState<string[]>(["• System Link Established."]);

  // Derived Values
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
          setSocialLinks(settingsRes.data.social_links || { website: "", instagram: "", linkedin: "", twitter: "" });
          setCampaignList(settingsRes.data.campaigns || []);
          setNextOfKinPhone(settingsRes.data.next_of_kin_phone || "");
        }
      }
    } catch (err) { console.error("Init Error", err); } finally { setLoading(false); }
  }

  // --- ACTION HANDLERS ---
  const handleGlobalSave = async () => {
    setSaving(true);
    try {
      await supabase.from("profiles").update({
        full_name: profile.full_name,
        phone: profile.phone,
        next_of_kin: nextOfKin,
        tier: currentTier
      }).eq("id", user.id);
      
      if (email !== user.email || password) {
        await supabase.auth.updateUser({ email, password });
      }

      if (teamId) {
        await supabase.from("settings").upsert({
          team_id: teamId,
          brand_color: brandColor,
          secondary_color: secondaryColor,
          font_family: selectedFont,
          bank_info: bankInfo,
          company_details: companyDetails,
          social_links: socialLinks,
          campaigns: campaignList,
          next_of_kin_phone: nextOfKinPhone
        });
      }
      setAuditLogs(prev => [`• System Synchronized: ${new Date().toLocaleTimeString()}`, ...prev]);
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  };

  const copyInviteLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setAuditLogs(prev => [`• Invite link copied to clipboard`, ...prev]);
      alert("Link copied.");
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#fcfaf7]"><Loader2 className="animate-spin text-[#a9b897]" size={40} /></div>;

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-stone-950 text-stone-200' : 'bg-[#fcfaf7] text-stone-900'}`}>
      
      <style jsx global>{`
        :root { --brand-primary: ${brandColor}; --brand-secondary: ${secondaryColor}; --font-main: '${selectedFont}', sans-serif; }
        body { font-family: var(--font-main) !important; }
        .custom-brand-text { color: var(--brand-primary); }
        .custom-brand-bg { background-color: var(--brand-primary); }
        .custom-secondary-bg { background-color: var(--brand-secondary); }
      `}</style>

      {/* MOBILE CTA */}
      <div className="lg:hidden fixed bottom-6 left-4 right-4 z-[100]">
        <button onClick={handleGlobalSave} className="w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white custom-brand-bg shadow-2xl">
          {saving ? <Loader2 className="animate-spin mx-auto" size={16}/> : "Commit Changes"}
        </button>
      </div>

      <div className="max-w-[1600px] mx-auto p-4 md:p-12 lg:p-20 space-y-12 pb-32 lg:pb-20">
        
        {/* HEADER */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 border-b border-stone-200 pb-12">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-8xl font-serif italic tracking-tighter leading-none custom-brand-text">Command Center</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">System Node: {user?.email}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <button onClick={() => router.push("/team")} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-5 rounded-2xl border border-stone-200 bg-white font-black text-[9px] uppercase tracking-widest">
              <Users size={14} className="custom-brand-text" /> Team
            </button>
            <div className="flex gap-2">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-5 rounded-2xl border border-stone-200 bg-white">
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button onClick={handleLogout} className="p-5 rounded-2xl border border-stone-200 bg-white text-stone-400">
                <LogOut size={18} />
              </button>
            </div>
            <button onClick={handleGlobalSave} className="hidden lg:flex items-center justify-center gap-4 px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white custom-brand-bg shadow-xl">
              {saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16} />} Commit Changes
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          
          {/* LEFT: Identity */}
          <div className="lg:col-span-4 space-y-8">
            <section className={`p-8 rounded-[3rem] border shadow-sm space-y-8 ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
              <div className="flex flex-col items-center gap-6">
                <div className="relative group w-32 h-32 rounded-full bg-stone-50 border-2 border-dashed border-stone-200 flex items-center justify-center overflow-hidden">
                  {logoUrl ? <img src={logoUrl} className="w-full h-full object-cover" /> : <UserCircle size={48} className="opacity-10" />}
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"><Camera size={18} /><input type="file" className="hidden" /></label>
                </div>
                <input value={profile.full_name || ""} onChange={e => setProfile({...profile, full_name: e.target.value})} className="text-center font-serif italic text-3xl w-full bg-transparent outline-none custom-brand-text" placeholder="Identity Name" />
              </div>

              <div className="space-y-3 pt-4 border-t border-stone-50">
                <div className="flex items-center gap-4 p-4 bg-stone-50/50 rounded-2xl border border-stone-100">
                  <Mail size={16} className="text-stone-300" />
                  <input value={email} onChange={e => setEmail(e.target.value)} className="bg-transparent text-xs font-bold outline-none w-full" />
                </div>
                <div className="flex items-center gap-4 p-4 bg-stone-50/50 rounded-2xl border border-stone-100">
                  <Fingerprint size={16} className="text-stone-300" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="bg-transparent text-xs font-bold outline-none w-full" placeholder="Update Password" />
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT: Config */}
          <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <section className={`p-8 rounded-[3rem] border ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100 shadow-sm'} space-y-6`}>
                 <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Aesthetics</h2>
                 <div className="flex justify-between items-center bg-stone-50 p-4 rounded-2xl border border-stone-100">
                   <span className="text-[10px] font-black uppercase">Brand Accent</span>
                   <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent" />
                 </div>
                 <select value={selectedFont} onChange={e => setSelectedFont(e.target.value)} className="w-full p-4 rounded-2xl bg-stone-50 border border-stone-100 text-xs font-bold">
                   <option value="Inter">Inter (Global)</option>
                   <option value="Merriweather">Merriweather (Serif)</option>
                   <option value="Geist">Geist (Mono)</option>
                 </select>
               </section>

               <section className={`p-8 rounded-[3rem] border ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100 shadow-sm'} space-y-4`}>
                 <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">System Tier</h2>
                 {TIERS.map(t => (
                   <button key={t} onClick={() => setCurrentTier(t)} className={`w-full p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest ${currentTier === t ? 'custom-brand-bg text-white' : 'bg-stone-50 text-stone-400'}`}>
                     {t} {currentTier === t && <Check size={14} className="inline ml-2" />}
                   </button>
                 ))}
               </section>
            </div>

            {/* TEAM */}
            <section className={`p-8 lg:p-12 rounded-[4rem] border shadow-sm ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
               <div className="flex flex-col md:flex-row justify-between gap-6 mb-10">
                 <h2 className="text-3xl font-serif italic custom-brand-text">The Hive</h2>
                 <button onClick={copyInviteLink} className="flex items-center gap-3 px-6 py-3 bg-stone-50 rounded-full border border-stone-100 text-[10px] font-black uppercase tracking-widest">
                   <Copy size={14} /> Copy Invite
                 </button>
               </div>
               <div className="space-y-4">
                 <input placeholder="New seat email..." value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="w-full p-5 rounded-2xl bg-stone-50 border border-stone-100 text-xs font-bold outline-none" />
                 <div className="flex flex-wrap gap-2">
                   {APP_PAGES.map(page => (
                     <button key={page.id} onClick={() => setSelectedPermissions(prev => prev.includes(page.id) ? prev.filter(p => p !== page.id) : [...prev, page.id])} className={`px-4 py-2 rounded-full border text-[8px] font-black uppercase ${selectedPermissions.includes(page.id) ? 'custom-brand-bg text-white' : 'border-stone-100'}`}>{page.label}</button>
                   ))}
                 </div>
               </div>
            </section>

            {/* BANKING */}
            <section className="custom-secondary-bg p-8 lg:p-16 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
               <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                  <h2 className="text-3xl font-serif italic text-[#a9b897]">Ledger Distribution</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                     <input value={bankInfo.name} onChange={e => setBankInfo({...bankInfo, name: e.target.value})} className="bg-white/5 border border-white/10 p-5 rounded-2xl text-sm font-bold outline-none" placeholder="Bank" />
                     <input value={bankInfo.acc} onChange={e => setBankInfo({...bankInfo, acc: e.target.value})} className="bg-white/5 border border-white/10 p-5 rounded-2xl text-sm font-bold outline-none" placeholder="Account" />
                     <input value={bankInfo.sort} onChange={e => setBankInfo({...bankInfo, sort: e.target.value})} className="bg-white/5 border border-white/10 p-5 rounded-2xl text-sm font-bold outline-none" placeholder="Sort" />
                  </div>
               </div>
               <div className="absolute top-0 right-0 w-64 h-64 bg-[#a9b897]/5 blur-[100px] rounded-full" />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}