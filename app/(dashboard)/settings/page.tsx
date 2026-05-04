"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Sparkles, Save, Moon, Sun, Loader2, 
  Landmark, ImageIcon, Receipt, User, Globe,
  Instagram, Linkedin, Twitter, Youtube, Facebook
} from "lucide-react";

interface SocialHandles {
  instagram: string; linkedin: string; twitter: string; 
  tiktok: string; facebook: string; youtube: string;
  [key: string]: string;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // -- CONTENT STATES --
  const [toneOfVoice, setToneOfVoice] = useState("");
  const [website, setWebsite] = useState("");
  const [handles, setHandles] = useState<SocialHandles>({
    instagram: "", linkedin: "", twitter: "", tiktok: "", facebook: "", youtube: ""
  });

  // -- FINANCE DEFAULTS --
  const [bankInfo, setBankInfo] = useState({ name: "", acc: "", sort: "" });
  const [vatRate, setVatRate] = useState(20);
  const [defaultLogo, setDefaultLogo] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        setLoading(false);
        return;
      }
      setUser(authData.user);

      // 1. Get the Team/Settings data
      // We assume every user belongs to at least one team record in 'team_members'
      const { data: membership } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", authData.user.id)
        .maybeSingle();
      
      if (membership?.team_id) {
        setTeamId(membership.team_id);
        const { data: settings } = await supabase
          .from("settings")
          .select("*")
          .eq("team_id", membership.team_id)
          .maybeSingle();

        if (settings) {
          setHandles(settings.handles || handles);
          setToneOfVoice(settings.tone_of_voice || "");
          setWebsite(settings.website || "");
          setBankInfo(settings.bank_info || { name: "", acc: "", sort: "" });
          setVatRate(settings.vat_rate || 20);
          setDefaultLogo(settings.default_logo || null);
        }
      }
    } catch (err) {
      console.error("Init error:", err);
    } finally {
      setLoading(false);
    }
  }

  const saveSettings = async () => {
    if (!teamId) {
      alert("System Error: No Team ID linked to your account.");
      return;
    }
    
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
    if (error) alert("Error syncing to cloud: " + error.message);
    else alert("System Synced Successfully");
  };

  // If we are still loading the session, show a clean loader
  if (loading) return (
    <div className="min-h-screen bg-[#fcfaf7] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-[#a9b897]" size={32} />
      <p className="font-serif italic text-stone-400">Loading Node Configuration...</p>
    </div>
  );

  return (
    <div className={`min-h-screen transition-all duration-700 ${isDarkMode ? 'bg-stone-950 text-stone-200' : 'bg-[#fcfaf7] text-stone-800'}`}>
      <div className="max-w-7xl mx-auto p-6 md:p-16 space-y-12 pb-40">
        
        {/* HEADER */}
        <header className={`flex flex-col md:flex-row justify-between items-center p-10 rounded-[3rem] border shadow-xl gap-8 transition-colors ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
          <div>
            <h1 className="text-5xl font-serif italic tracking-tighter">Settings</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-2 opacity-50">Active Session: {user?.email}</p>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className={`p-4 rounded-2xl border transition-all ${isDarkMode ? 'bg-stone-800 border-stone-700' : 'bg-stone-50 border-stone-200'}`}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              onClick={saveSettings} 
              disabled={saving} 
              className="flex items-center gap-3 bg-[#1c1c1c] text-[#a9b897] px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:brightness-125 transition-all"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
              Commit Changes
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* COLUMN 1: BRAND & AI */}
          <div className="space-y-8">
            <section className={`p-8 rounded-[2.5rem] border ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
              <div className="flex items-center gap-2 mb-6 text-[#a9b897]">
                <Sparkles size={16} />
                <h2 className="text-[10px] font-black uppercase tracking-widest">AI Persona</h2>
              </div>
              <p className="text-[10px] text-stone-400 uppercase mb-2">Tone of Voice</p>
              <textarea 
                value={toneOfVoice}
                onChange={(e) => setToneOfVoice(e.target.value)}
                className="w-full h-32 p-4 rounded-2xl border bg-transparent text-sm resize-none focus:ring-1 ring-[#a9b897] outline-none"
                placeholder="How should the AI write for you?"
              />
            </section>

            <section className={`p-8 rounded-[2.5rem] border ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
              <div className="flex items-center gap-2 mb-6 text-[#a9b897]">
                <Globe size={16} />
                <h2 className="text-[10px] font-black uppercase tracking-widest">Web Presence</h2>
              </div>
              <input 
                placeholder="Website URL"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full p-4 rounded-xl border bg-transparent text-sm mb-4"
              />
            </section>
          </div>

          {/* COLUMN 2: FINANCE */}
          <div className="space-y-8">
            <section className={`p-8 rounded-[2.5rem] border ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
              <div className="flex items-center gap-2 mb-6 text-[#a9b897]">
                <Receipt size={16} />
                <h2 className="text-[10px] font-black uppercase tracking-widest">Finance</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] font-bold uppercase opacity-40 mb-2">Default Logo</p>
                  <div 
                    onClick={() => logoInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-stone-200 rounded-2xl flex items-center justify-center cursor-pointer bg-stone-50/50 hover:bg-stone-100 transition-all overflow-hidden"
                  >
                    {defaultLogo ? <img src={defaultLogo} className="h-full object-contain p-2" /> : <ImageIcon className="text-stone-300" />}
                    <input type="file" ref={logoInputRef} hidden onChange={(e) => {
                      if(e.target.files?.[0]) setDefaultLogo(URL.createObjectURL(e.target.files[0]))
                    }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[9px] font-bold uppercase opacity-40">Bank Details</p>
                  <input placeholder="Bank Name" className="w-full p-3 rounded-xl border bg-transparent text-xs" value={bankInfo.name} onChange={e => setBankInfo({...bankInfo, name: e.target.value})} />
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Acc #" className="w-full p-3 rounded-xl border bg-transparent text-xs" value={bankInfo.acc} onChange={e => setBankInfo({...bankInfo, acc: e.target.value})} />
                    <input placeholder="Sort Code" className="w-full p-3 rounded-xl border bg-transparent text-xs" value={bankInfo.sort} onChange={e => setBankInfo({...bankInfo, sort: e.target.value})} />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* COLUMN 3: SOCIALS */}
          <div className="space-y-8">
            <section className={`p-8 rounded-[2.5rem] border ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
              <div className="flex items-center gap-2 mb-6 text-[#a9b897]">
                <User size={16} />
                <h2 className="text-[10px] font-black uppercase tracking-widest">Social Links</h2>
              </div>
              <div className="space-y-3">
                {Object.keys(handles).map((key) => (
                  <div key={key} className="flex items-center gap-3 bg-stone-50/50 p-1 rounded-xl border border-stone-100">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border shadow-sm">
                      {key === 'instagram' && <Instagram size={14} />}
                      {key === 'linkedin' && <Linkedin size={14} />}
                      {key === 'twitter' && <Twitter size={14} />}
                      {key === 'youtube' && <Youtube size={14} />}
                      {key === 'facebook' && <Facebook size={14} />}
                    </div>
                    <input 
                      placeholder={`@${key}`}
                      className="bg-transparent text-xs w-full outline-none p-2"
                      value={handles[key]}
                      onChange={(e) => setHandles({...handles, [key]: e.target.value})}
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}