"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Instagram, Linkedin, Twitter, Globe, Cpu, Zap, ShieldAlert, UserPlus, 
  Mail, Lock, Download, Scale, Languages, Moon, Sun, CreditCard, 
  Trash2, MessageSquareQuote, Eye, Palette
} from "lucide-react";

// 🛠 1. CONFIGURATION & TYPES
interface SocialHandles {
  instagram: string;
  linkedin: string;
  twitter: string;
  tiktok: string;
  facebook: string;
  youtube: string;
  [key: string]: string;
}

const PLATFORM_ICONS: Record<string, any> = {
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
  tiktok: Globe,
  facebook: Globe,
  youtube: Globe,
};

const AUTHORIZED_ROLES = ["owner", "admin", "manager"];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [team, setTeam] = useState<any[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 🎨 BRANDING & CLARITY AI
  const [logo, setLogo] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#a9b897");
  const [toneOfVoice, setToneOfVoice] = useState("Professional, yet empathetic.");
  
  // 🌐 SETTINGS
  const [language, setLanguage] = useState("English (UK)");
  const [timezone, setTimezone] = useState("GMT (London)");
  const [handles, setHandles] = useState<SocialHandles>({
    instagram: "", linkedin: "", twitter: "", tiktok: "", facebook: "", youtube: ""
  });

  // 📧 IDENTITY
  const [contactEmail, setContactEmail] = useState("");
  const [website, setWebsite] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");

  useEffect(() => {
    init();
  }, []);

  async function init() {
    try {
      setLoading(true);
      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData?.user;
      if (!currentUser) return;
      setUser(currentUser);

      let { data: p } = await supabase.from("profiles").select("*").eq("id", currentUser.id).maybeSingle();
      if (!p) {
        const { data: newProfile } = await supabase.from("profiles").insert({ id: currentUser.id, role: "owner" }).select().single();
        p = newProfile;
      }
      setProfile(p);

      const { data: membership } = await supabase.from("team_members").select("team_id").eq("user_id", currentUser.id).maybeSingle();
      if (membership?.team_id) {
        setTeamId(membership.team_id);
        const { data: settings } = await supabase.from("settings").select("*").eq("team_id", membership.team_id).maybeSingle();
        if (settings) {
          setLogo(settings.logo || "");
          setPrimaryColor(settings.primary_color || "#a9b897");
          setHandles(settings.handles || handles);
          setToneOfVoice(settings.tone_of_voice || "");
          setWebsite(settings.website || "");
        }
        const { data: members } = await supabase.from("team_members").select("*").eq("team_id", membership.team_id);
        setTeam(members || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const saveSettings = async () => {
    const { error } = await supabase.from("settings").upsert({
      team_id: teamId,
      logo, primary_color: primaryColor, handles, 
      tone_of_voice: toneOfVoice, website
    });
    if (error) alert(error.message);
    else alert("System Synced Successfully");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-serif italic text-stone-400">Loading OS...</div>;

  const isDeveloper = user?.email === "hill.samantha@hotmail.co.uk";
  const isAuthorized = isDeveloper || (profile && AUTHORIZED_ROLES.includes(profile.role));

  if (!isAuthorized) return <div className="min-h-screen flex items-center justify-center p-12 text-center font-serif">Access Level Denied.</div>;

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-stone-950 text-stone-200' : 'bg-stone-50 text-stone-800'}`}>
      <div className="max-w-7xl mx-auto p-6 space-y-10 pb-40">
        
        {/* HEADER & GLOBAL TOGGLES */}
        <div className={`flex flex-col md:flex-row justify-between items-center p-10 rounded-[3rem] border shadow-sm gap-6 ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
          <div>
            <h1 className="text-5xl font-serif italic">Global Settings</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-2 opacity-50">Operational Role: {profile?.role}</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-4 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:scale-105 transition-transform">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={saveSettings} className="px-8 py-4 bg-[#a9b897] text-stone-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">
              Commit Changes
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LEFT COLUMN: CORE CONFIG */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* CLARITY AI: TONE OF VOICE */}
            <section className={`p-10 rounded-[2.5rem] border space-y-6 ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
              <div className="flex items-center gap-3">
                <MessageSquareQuote className="text-[#a9b897]" size={20} />
                <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-400">Clarity AI: Tone of Voice</h2>
              </div>
              <textarea 
                value={toneOfVoice}
                onChange={(e) => setToneOfVoice(e.target.value)}
                placeholder="Describe your brand voice... (e.g. Minimalist, direct, high-end)"
                className="w-full h-32 p-6 bg-stone-50 dark:bg-stone-800/50 border-none rounded-3xl text-sm outline-none resize-none"
              />
            </section>

            {/* IDENTITY & SOCIAL */}
            <section className={`p-10 rounded-[2.5rem] border space-y-8 ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-400">Network Presence</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input placeholder="Public Email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="p-5 bg-stone-50 dark:bg-stone-800 rounded-2xl border-none outline-none text-sm" />
                <input placeholder="Website URL" value={website} onChange={(e) => setWebsite(e.target.value)} className="p-5 bg-stone-50 dark:bg-stone-800 rounded-2xl border-none outline-none text-sm" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.keys(handles).map((key) => (
                  <div key={key} className="p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl flex items-center gap-3">
                    <Globe size={14} className="text-stone-300" />
                    <input 
                      value={handles[key]} 
                      onChange={(e) => setHandles({...handles, [key]: e.target.value})}
                      className="bg-transparent w-full text-[10px] font-bold outline-none"
                      placeholder={key}
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* SECURITY & DATA */}
            <section className={`p-10 rounded-[2.5rem] border space-y-8 ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-400">Privacy & Security</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button className="flex items-center justify-between p-6 bg-stone-50 dark:bg-stone-800 rounded-3xl hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors">
                  <div className="text-left">
                    <p className="text-xs font-black uppercase">Change Password</p>
                    <p className="text-[10px] opacity-50">Update your access key</p>
                  </div>
                  <Lock size={18} />
                </button>
                <button className="flex items-center justify-between p-6 bg-stone-50 dark:bg-stone-800 rounded-3xl hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors">
                  <div className="text-left">
                    <p className="text-xs font-black uppercase">Download Vault</p>
                    <p className="text-[10px] opacity-50">Export all system data (.json)</p>
                  </div>
                  <Download size={18} />
                </button>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: BILLING & REGION */}
          <div className="lg:col-span-4 space-y-10">
            
            {/* SUBSCRIPTION TIER */}
            <section className="bg-stone-900 p-10 rounded-[3rem] text-white space-y-6 shadow-2xl">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a9b897]">Current Plan</p>
                <Zap size={20} className="text-[#a9b897]" fill="currentColor" />
              </div>
              <h3 className="text-4xl font-serif italic">Enterprise</h3>
              <p className="text-xs text-stone-400">Next billing date: Jan 12, 2026</p>
              <div className="pt-4 space-y-3">
                <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Manage Billing</button>
                <button className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Cancel Subscription</button>
              </div>
            </section>

            {/* LOCALIZATION */}
            <section className={`p-10 rounded-[3rem] border space-y-6 ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-400">Localization</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase opacity-30">Language</label>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full p-4 bg-stone-50 dark:bg-stone-800 rounded-xl text-xs font-bold outline-none">
                    <option>English (UK)</option>
                    <option>English (US)</option>
                    <option>French</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase opacity-30">Timezone</label>
                  <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full p-4 bg-stone-50 dark:bg-stone-800 rounded-xl text-xs font-bold outline-none">
                    <option>GMT (London)</option>
                    <option>EST (New York)</option>
                    <option>PST (Los Angeles)</option>
                  </select>
                </div>
              </div>
            </section>

            {/* LEGAL HUB */}
            <section className={`p-10 rounded-[3rem] border space-y-6 ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-400">Legal Hub</h2>
              <div className="space-y-2">
                {["Privacy Policy", "Terms of Service", "Cookie Protocol", "Accessibility Statement"].map((item) => (
                  <button key={item} className="w-full text-left p-4 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-2xl text-[10px] font-black uppercase tracking-tighter opacity-60 hover:opacity-100 transition-all">
                    {item}
                  </button>
                ))}
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}