"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Settings, Sparkles, Globe, ShieldCheck, 
  Save, Moon, Sun, Fingerprint, Activity,
  Lock, ArrowRight, Loader2, Landmark, ImageIcon, Receipt
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SocialHandles {
  instagram: string; linkedin: string; twitter: string; 
  tiktok: string; facebook: string; youtube: string;
  [key: string]: string;
}

const AUTHORIZED_ROLES = ["owner", "admin", "manager", "elite"];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // -- CONTENT STATES --
  const [toneOfVoice, setToneOfVoice] = useState("");
  const [handles, setHandles] = useState<SocialHandles>({
    instagram: "", linkedin: "", twitter: "", tiktok: "", facebook: "", youtube: ""
  });
  const [website, setWebsite] = useState("");

  // -- NEW FINANCE STATES (The "Rollback" components) --
  const [bankInfo, setBankInfo] = useState({ name: "", acc: "", sort: "" });
  const [vatRate, setVatRate] = useState(20);
  const [defaultLogo, setDefaultLogo] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { init(); }, []);

  async function init() {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
         setLoading(false);
         return;
      }
      setUser(authData.user);

      // Fetch Profile
      let { data: p } = await supabase.from("profiles").select("*").eq("id", authData.user.id).maybeSingle();
      
      // Auto-create profile if missing (helps fix Access Denied for new users)
      if (!p) {
        const { data: newProfile } = await supabase.from("profiles")
          .insert({ id: authData.user.id, role: "owner" })
          .select().single();
        p = newProfile;
      }
      setProfile(p);

      // Fetch Team & Settings
      const { data: membership } = await supabase.from("team_members").select("team_id").eq("user_id", authData.user.id).maybeSingle();
      if (membership?.team_id) {
        setTeamId(membership.team_id);
        const { data: settings } = await supabase.from("settings").select("*").eq("team_id", membership.team_id).maybeSingle();
        if (settings) {
          setHandles(settings.handles || handles);
          setToneOfVoice(settings.tone_of_voice || "");
          setWebsite(settings.website || "");
          // Finance mapping
          setBankInfo(settings.bank_info || { name: "", acc: "", sort: "" });
          setVatRate(settings.vat_rate || 20);
          setDefaultLogo(settings.default_logo || null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const saveSettings = async () => {
    if (!teamId) return alert("No Team ID found. Check database permissions.");
    setSaving(true);
    const { error } = await supabase.from("settings").upsert({
      team_id: teamId,
      handles, 
      tone_of_voice: toneOfVoice, 
      website,
      bank_info: bankInfo,
      vat_rate: vatRate,
      default_logo: defaultLogo,
      updated_at: new Date().toISOString()
    });
    setSaving(false);
    if (error) alert(error.message);
    else alert("System Synced Successfully");
  };

  // Improved Authorization Check
  const isAuthorized = loading || 
    user?.email === "hill.samantha@hotmail.co.uk" || 
    (profile && AUTHORIZED_ROLES.includes(profile.role));

  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-[#a9b897]" size={32} />
      <p className="font-serif italic text-stone-400 animate-pulse">Initializing Global Node...</p>
    </div>
  );

  if (!isAuthorized) return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-12 text-center">
      <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-8 border border-red-500/20">
        <Lock className="text-red-500" size={32} />
      </div>
      <h2 className="text-4xl font-serif italic text-stone-200">Access Level Denied</h2>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-500 mt-4 max-w-xs leading-relaxed">
        Insufficient clearance for Global System Settings. Contact Sam or a System Administrator.
      </p>
    </div>
  );

  return (
    <div className={`min-h-screen transition-all duration-700 ${isDarkMode ? 'bg-stone-950 text-stone-200' : 'bg-[#fcfaf7] text-stone-800'}`}>
      <div className="max-w-7xl mx-auto p-8 md:p-16 space-y-12 pb-40">
        
        {/* HEADER BAR */}
        <header className={`flex flex-col md:flex-row justify-between items-center p-12 rounded-[3.5rem] border shadow-2xl gap-8 relative overflow-hidden transition-colors ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
          <div className="relative z-10 text-center md:text-left">
            <h1 className="text-6xl font-serif italic tracking-tighter">System Defaults</h1>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] mt-3 inline-block px-3 py-1 bg-[#a9b897]/10 text-[#a9b897] rounded-full border border-[#a9b897]/20">
              Role: {profile?.role}
            </p>
          </div>

          <div className="flex gap-4 relative z-10">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-stone-800 border-stone-700' : 'bg-stone-50 border-stone-200'}`}>
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={saveSettings} disabled={saving} className="flex items-center gap-4 bg-[#1c1c1c] text-[#a9b897] px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Commit Sync
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-12">
            
            {/* 1. FINANCE DEFAULTS (THE ROLLBACK) */}
            <section className={`p-12 rounded-[3.5rem] border ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100 shadow-sm'}`}>
              <div className="flex items-center gap-3 mb-8">
                <Receipt size={18} className="text-[#a9b897]" />
                <h2 className="text-[11px] font-black uppercase tracking-[0.5em] opacity-40">Finance Blueprint</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Logo Default */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase text-stone-400">Default Brand Logo</p>
                  <div onClick={() => logoInputRef.current?.click()} className="w-full h-40 border-2 border-dashed border-stone-100 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:bg-stone-50 transition-all overflow-hidden bg-stone-50/50">
                    {defaultLogo ? <img src={defaultLogo} className="h-full w-full object-contain" /> : <ImageIcon className="text-stone-300" />}
                    <input type="file" ref={logoInputRef} hidden onChange={(e) => {
                      if(e.target.files?.[0]) setDefaultLogo(URL.createObjectURL(e.target.files[0]))
                    }} />
                  </div>
                </div>

                {/* Bank Details */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase text-stone-400 flex items-center gap-2"><Landmark size={14}/> Default Settlement</p>
                  <div className="space-y-3">
                    <input placeholder="Bank Name" className="w-full p-4 rounded-xl border text-sm" value={bankInfo.name} onChange={e => setBankInfo({...bankInfo, name: e.target.value})} />
                    <input placeholder="Account Number" className="w-full p-4 rounded-xl border text-sm" value={bankInfo.acc} onChange={e => setBankInfo({...bankInfo, acc: e.target.value})} />
                    <input placeholder="Sort Code" className="w-full p-4 rounded-xl border text-sm" value={bankInfo.sort} onChange={e => setBankInfo({...bankInfo, sort: e.target.value})} />
                  </div>
                </div>
              </div>
            </section>

            {/* 2. TONE OF VOICE */}
            <section className={`p-12 rounded-[3.5rem] border ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
              <div className="flex items-center gap-3 mb-8">
                <Sparkles size={18} className="text-[#a9b897]" />
                <h2 className="text-[11px] font-black uppercase tracking-[0.5em] opacity-40">Clarity AI: Vocal DNA</h2>
              </div>
              <textarea 
                value={toneOfVoice}
                onChange={(e) => setToneOfVoice(e.target.value)}
                className="w-full h-32 p-6 rounded-[2rem] text-lg font-serif italic outline-none border bg-stone-50/30"
                placeholder="Describe your brand soul..."
              />
            </section>
          </div>

          {/* SIDEBAR NODE INFO */}
          <aside className="lg:col-span-4 space-y-6">
            <div className={`p-10 rounded-[3rem] border sticky top-12 ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100 shadow-xl'}`}>
              <div className="flex items-center gap-4 mb-8">
                <Fingerprint className="text-[#a9b897]" size={24} />
                <h3 className="text-xl font-serif italic">Node Profile</h3>
              </div>
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                  <p className="opacity-40 uppercase font-black text-[8px] mb-1">Auth Email</p>
                  <p className="font-mono truncate">{user?.email}</p>
                </div>
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                  <p className="opacity-40 uppercase font-black text-[8px] mb-1">Clearance</p>
                  <p className="text-[#a9b897] font-black italic">Level: {profile?.role}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}