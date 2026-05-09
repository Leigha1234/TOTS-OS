"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Save, Moon, Sun, Loader2, Landmark, 
  Users, Trash2, Check, Download,
  Camera, Mail, Phone, HeartPulse, Palette,
  UserCircle, Fingerprint, ShieldCheck,
  Link2, Database, Copy, LogOut, Type, Image as ImageIcon
} from "lucide-react";

// --- CONSTANTS ---
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
  
  // --- SYSTEM STATES ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // --- USER & TEAM STATES ---
  const [user, setUser] = useState<any>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState("STANDARD");
  const [profile, setProfile] = useState<any>({ full_name: "", phone: "", avatar_url: "" });
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  
  // --- BRANDING STATES (THE DATA YOU WANT TO PERSIST) ---
  const [brandColor, setBrandColor] = useState("#a9b897"); // Accent Sage
  const [bgColor, setBgColor] = useState("#fcfaf7");      // System Background
  const [secondaryColor, setSecondaryColor] = useState("#e5e7eb");
  const [selectedFont, setSelectedFont] = useState("Inter");
  const [logoUrl, setLogoUrl] = useState("");
  
  // --- OTHER SETTINGS ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bankInfo, setBankInfo] = useState({ name: "", acc: "", sort: "" });
  const [companyDetails, setCompanyDetails] = useState("");
  const [nextOfKin, setNextOfKin] = useState("");
  const [nextOfKinPhone, setNextOfKinPhone] = useState("");

  useEffect(() => { 
    init(); 
  }, []);

  async function init() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      setUser(user);
      setEmail(user.email || "");

      // Fetch Profile
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (p) {
        setProfile(p);
        setNextOfKin(p.next_of_kin || "");
        if (p.tier) setCurrentTier(p.tier.toUpperCase());
      }

      // Fetch Team & Branding Settings
      const { data: membership } = await supabase.from("team_members").select("team_id").eq("user_id", user.id).maybeSingle();
      if (membership?.team_id) {
        setTeamId(membership.team_id);
        const { data: settings } = await supabase.from("settings").select("*").eq("team_id", membership.team_id).maybeSingle();
        
        if (settings) {
          setBrandColor(settings.brand_color || "#a9b897");
          setBgColor(settings.bg_color || "#fcfaf7"); // Load custom BG
          setSecondaryColor(settings.secondary_color || "#e5e7eb");
          setSelectedFont(settings.font_family || "Inter");
          setLogoUrl(settings.logo_url || "");
          setBankInfo(settings.bank_info || { name: "", acc: "", sort: "" });
          setCompanyDetails(settings.company_details || "");
        }
      }
    } catch (err) {
      console.error("Initialization Error:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleGlobalSave = async () => {
    setSaving(true);
    try {
      // 1. Update Profile
      await supabase.from("profiles").update({
        full_name: profile?.full_name,
        phone: profile?.phone,
        next_of_kin: nextOfKin,
        tier: currentTier
      }).eq("id", user?.id);
      
      // 2. Update Branding & Settings
      if (teamId) {
        await supabase.from("settings").upsert({
          team_id: teamId,
          brand_color: brandColor,
          bg_color: bgColor,
          secondary_color: secondaryColor,
          font_family: selectedFont,
          logo_url: logoUrl,
          bank_info: bankInfo,
          company_details: companyDetails,
          next_of_kin_phone: nextOfKinPhone
        });
      }

      alert("System branding synchronized.");
    } catch (err: any) {
      alert("Error saving settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className={`min-h-screen transition-colors duration-500`}>
      
      {/* DYNAMIC CSS INJECTOR 
          This is what makes the "Background" and "Font" actually change 
          across the entire document immediately.
      */}
      <style jsx global>{`
        :root {
          --brand-primary: ${brandColor};
          --brand-secondary: ${secondaryColor};
          --system-bg: ${isDarkMode ? "#0c0a09" : bgColor};
          --font-main: '${selectedFont}', sans-serif;
        }
        body {
          background-color: var(--system-bg) !important;
          font-family: var(--font-main) !important;
          transition: background-color 0.3s ease;
        }
        .custom-brand-text { color: var(--brand-primary); }
        .custom-brand-bg { background-color: var(--brand-primary); }
        .custom-secondary-bg { background-color: var(--brand-secondary); }
      `}</style>

      {/* PERSISTENT TOP LOGO BAR (Preview of how it looks on every page) */}
      <nav className="w-full py-6 px-8 flex justify-between items-center border-b border-stone-200/50 bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="h-12 flex items-center">
          {logoUrl ? (
            <img src={logoUrl} alt="Company Logo" className="h-full w-auto object-contain" />
          ) : (
            <div className="flex items-center gap-2 opacity-20">
              <ImageIcon size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">No Logo Uploaded</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">System Active</span>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 md:p-16 space-y-12 pb-40">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-stone-200 pb-12">
          <div className="space-y-2">
            <h1 className="text-5xl md:text-7xl font-serif italic tracking-tighter leading-none custom-brand-text">Command Center</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Configure Architectural Identity</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-5 rounded-2xl border border-stone-200 bg-white">
               {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              onClick={handleGlobalSave} 
              disabled={saving} 
              className="flex items-center gap-4 px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white custom-brand-bg shadow-xl hover:scale-105 transition-transform"
            >
              {saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16} />} Commit Branding
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* BRANDING CONTROL PANEL */}
          <div className="lg:col-span-5 space-y-8">
            <section className="bg-white p-8 md:p-10 rounded-[3.5rem] border border-stone-100 shadow-xl space-y-10">
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-black uppercase tracking-[0.4em] opacity-40 flex items-center gap-3">
                  <Palette size={16} className="custom-brand-text" /> Visual Identity
                </h2>
              </div>

              {/* Color Pickers */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-stone-400 block">System Background</label>
                  <div className="flex items-center gap-4 p-3 bg-stone-50 rounded-2xl border border-stone-100">
                    <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent" />
                    <span className="text-[10px] font-mono text-stone-500 uppercase">{bgColor}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-stone-400 block">Accent Color</label>
                  <div className="flex items-center gap-4 p-3 bg-stone-50 rounded-2xl border border-stone-100">
                    <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent" />
                    <span className="text-[10px] font-mono text-stone-500 uppercase">{brandColor}</span>
                  </div>
                </div>
              </div>

              {/* Typography */}
              <div className="space-y-4 pt-6 border-t border-stone-50">
                <label className="text-[9px] font-black uppercase text-stone-400 block flex items-center gap-2">
                    <Type size={14}/> System Typography
                </label>
                <select 
                  value={selectedFont} 
                  onChange={e => setSelectedFont(e.target.value)}
                  className="w-full p-5 rounded-2xl border border-stone-100 bg-stone-50/50 text-[12px] font-bold outline-none appearance-none"
                >
                  <option value="Inter">Inter (Clean Modern)</option>
                  <option value="Merriweather">Merriweather (Classic Serif)</option>
                  <option value="Montserrat">Montserrat (Geometric)</option>
                  <option value="Playfair Display">Playfair (Elegant Serif)</option>
                  <option value="Space Mono">Space Mono (Tech)</option>
                </select>
              </div>

              {/* Logo Upload URL */}
              <div className="space-y-4 pt-6 border-t border-stone-50">
                <label className="text-[9px] font-black uppercase text-stone-400 block">Logo Asset (Direct URL)</label>
                <div className="relative">
                    <Link2 size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300" />
                    <input 
                    type="text" 
                    value={logoUrl} 
                    onChange={e => setLogoUrl(e.target.value)}
                    placeholder="https://your-domain.com/logo.png" 
                    className="w-full p-5 pl-14 rounded-2xl border border-stone-100 bg-stone-50/50 text-[11px] outline-none focus:ring-2 ring-stone-900/5 transition-all" 
                    />
                </div>
                <p className="text-[9px] italic text-stone-400 px-2">Pro tip: Host your logo on Imgur or your website and paste the direct image link here.</p>
              </div>
            </section>

            {/* QUICK PROFILE PREVIEW */}
            <section className="bg-stone-900 p-10 rounded-[3.5rem] text-white space-y-6 overflow-hidden relative group">
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                        {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover"/> : <UserCircle size={40} className="text-white/20"/>}
                    </div>
                    <div>
                        <h3 className="font-serif italic text-2xl">{profile?.full_name || "New User"}</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#a9b897]">{currentTier} Member</p>
                    </div>
                </div>
                <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-1000">
                    <ShieldCheck size={180} />
                </div>
            </section>
          </div>

          {/* SECONDARY SETTINGS */}
          <div className="lg:col-span-7 space-y-8">
            <section className="bg-white p-10 rounded-[4rem] border border-stone-100 shadow-sm space-y-8">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Contact & Security</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl">
                        <Mail size={18} className="text-stone-300" />
                        <input value={email} onChange={e => setEmail(e.target.value)} className="bg-transparent text-[12px] font-bold outline-none w-full" placeholder="Email Address"/>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl">
                        <Fingerprint size={18} className="text-stone-300" />
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Reset Password" className="bg-transparent text-[12px] font-bold outline-none w-full" />
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl">
                        <Phone size={18} className="custom-brand-text" />
                        <input value={profile?.phone || ""} onChange={e => setProfile({...profile, phone: e.target.value})} placeholder="Primary Phone" className="bg-transparent text-[12px] font-bold outline-none w-full" />
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl">
                        <HeartPulse size={18} className="text-red-400" />
                        <input value={nextOfKin} onChange={e => setNextOfKin(e.target.value)} placeholder="Emergency Contact Name" className="bg-transparent text-[12px] font-bold outline-none w-full" />
                    </div>
                </div>
              </div>

              <div className="pt-8 border-t border-stone-100">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mb-6">Banking Distribution</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input placeholder="Bank Name" value={bankInfo.name} onChange={e => setBankInfo({...bankInfo, name: e.target.value})} className="p-4 bg-stone-50 rounded-xl border border-stone-100 text-[11px] font-bold outline-none" />
                  <input placeholder="Account No" value={bankInfo.acc} onChange={e => setBankInfo({...bankInfo, acc: e.target.value})} className="p-4 bg-stone-50 rounded-xl border border-stone-100 text-[11px] font-bold outline-none" />
                  <input placeholder="Sort Code" value={bankInfo.sort} onChange={e => setBankInfo({...bankInfo, sort: e.target.value})} className="p-4 bg-stone-50 rounded-xl border border-stone-100 text-[11px] font-bold outline-none" />
                </div>
              </div>
            </section>

            {/* TEAM PROVISIONING */}
            <section className="bg-white p-10 rounded-[4rem] border border-stone-100 shadow-sm space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">System Access (The Hive)</h2>
                <div className="px-4 py-2 bg-stone-900 text-[#a9b897] rounded-full text-[9px] font-black uppercase">Elite Tier Active</div>
              </div>
              
              <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="w-full">
                    <p className="text-[8px] font-black uppercase text-stone-400 mb-1">Company Invite Link</p>
                    <p className="text-[11px] font-mono opacity-60 truncate">https://tots-os.co.uk/invite/{teamId || 'loading'}</p>
                </div>
                <button className="p-4 bg-white border border-stone-200 rounded-2xl hover:bg-stone-900 hover:text-white transition-all shadow-sm">
                    <Copy size={16} />
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}