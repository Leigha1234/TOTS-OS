"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { 
  Settings, Sparkles, Globe, ShieldCheck, 
  Save, Moon, Sun, Fingerprint, Activity,
  Lock, ArrowRight, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SocialHandles {
  instagram: string;
  linkedin: string;
  twitter: string;
  tiktok: string;
  facebook: string;
  youtube: string;
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
  
  const [toneOfVoice, setToneOfVoice] = useState("Professional, yet empathetic.");
  const [handles, setHandles] = useState<SocialHandles>({
    instagram: "", linkedin: "", twitter: "", tiktok: "", facebook: "", youtube: ""
  });
  const [website, setWebsite] = useState("");

  useEffect(() => { init(); }, []);

  async function init() {
    const supabase = createClient();
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;
      setUser(authData.user);

      let { data: p } = await supabase.from("profiles").select("*").eq("id", authData.user.id).maybeSingle();
      if (!p) {
        const { data: newProfile } = await supabase.from("profiles").insert({ id: authData.user.id, role: "owner" }).select().single();
        p = newProfile;
      }
      setProfile(p);

      const { data: membership } = await supabase.from("team_members").select("team_id").eq("user_id", authData.user.id).maybeSingle();
      if (membership?.team_id) {
        setTeamId(membership.team_id);
        const { data: settings } = await supabase.from("settings").select("*").eq("team_id", membership.team_id).maybeSingle();
        if (settings) {
          setHandles(settings.handles || handles);
          setToneOfVoice(settings.tone_of_voice || "");
          setWebsite(settings.website || "");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const saveSettings = async () => {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("settings").upsert({
      team_id: teamId,
      handles, 
      tone_of_voice: toneOfVoice, 
      website,
      updated_at: new Date().toISOString()
    });
    setSaving(false);
    if (error) alert(error.message);
    else alert("System Synced Successfully");
  };

  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-[#a9b897]" size={32} />
      <p className="font-serif italic text-stone-400 animate-pulse">Initializing Global Node...</p>
    </div>
  );

  const isAuthorized = user?.email === "hill.samantha@hotmail.co.uk" || (profile && AUTHORIZED_ROLES.includes(profile.role));

  if (!isAuthorized) return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-12 text-center">
      <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-8 border border-red-500/20">
        <Lock className="text-red-500" size={32} />
      </div>
      <h2 className="text-4xl font-serif italic text-stone-200">Access Level Denied</h2>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-500 mt-4 max-w-xs leading-relaxed">
        Insufficient clearance for Global System Settings. ContactSam or a System Administrator.
      </p>
    </div>
  );

  return (
    <div className={`min-h-screen transition-all duration-700 ${isDarkMode ? 'bg-stone-950 text-stone-200' : 'bg-[#fcfaf7] text-stone-800'}`}>
      <div className="max-w-7xl mx-auto p-8 md:p-16 space-y-12 pb-40">
        
        {/* TOP BAR / NAVIGATION STYLE */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex flex-col md:flex-row justify-between items-center p-12 rounded-[3.5rem] border shadow-2xl gap-8 relative overflow-hidden transition-colors ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}
        >
          <div className="relative z-10 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <Activity size={14} className="text-[#a9b897]" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Operational Status: Active</span>
            </div>
            <h1 className="text-6xl font-serif italic tracking-tighter">Global Settings</h1>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] mt-3 inline-block px-3 py-1 bg-[#a9b897]/10 text-[#a9b897] rounded-full border border-[#a9b897]/20">
              Identity Node: {profile?.role}
            </p>
          </div>

          <div className="flex gap-4 relative z-10">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className={`p-5 rounded-2xl transition-all border ${isDarkMode ? 'bg-stone-800 border-stone-700 hover:bg-stone-700' : 'bg-stone-50 border-stone-200 hover:bg-stone-100'}`}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              onClick={saveSettings} 
              disabled={saving}
              className="flex items-center gap-4 bg-[#1c1c1c] text-[#a9b897] px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Commit Sync
            </button>
          </div>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* MAIN CONFIGURATION */}
          <div className="lg:col-span-8 space-y-12">
            
            <motion.section 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className={`p-12 rounded-[3.5rem] border transition-colors ${isDarkMode ? 'bg-stone-900 border-stone-800 shadow-none' : 'bg-white border-stone-100 shadow-sm'}`}
            >
              <div className="flex items-center gap-3 mb-8">
                <Sparkles size={18} className="text-[#a9b897]" />
                <h2 className="text-[11px] font-black uppercase tracking-[0.5em] opacity-40">Clarity AI: Vocal DNA</h2>
              </div>
              <textarea 
                value={toneOfVoice}
                onChange={(e) => setToneOfVoice(e.target.value)}
                className={`w-full h-48 p-8 rounded-[2rem] text-xl font-serif italic outline-none transition-all resize-none border ${isDarkMode ? 'bg-stone-800 border-stone-700 focus:border-[#a9b897]' : 'bg-stone-50 border-stone-100 focus:border-[#a9b897]'}`}
                placeholder="Describe the soul of your communication..."
              />
            </motion.section>

            <motion.section 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={`p-12 rounded-[3.5rem] border transition-colors ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100 shadow-sm'}`}
            >
              <div className="flex items-center gap-3 mb-10">
                <Globe size={18} className="text-[#a9b897]" />
                <h2 className="text-[11px] font-black uppercase tracking-[0.5em] opacity-40">Social Architecture</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.keys(handles).map((key, i) => (
                  <div key={key} className={`group p-6 rounded-3xl border transition-all ${isDarkMode ? 'bg-stone-800/50 border-stone-700 focus-within:border-[#a9b897]' : 'bg-stone-50 border-stone-100 focus-within:border-[#a9b897]'}`}>
                    <label className="text-[8px] font-black uppercase tracking-widest opacity-40 group-focus-within:opacity-100 transition-opacity mb-2 block">{key}</label>
                    <div className="flex items-center gap-3">
                      <span className="text-[#a9b897] text-xs opacity-50 font-mono">@</span>
                      <input 
                        value={handles[key]} 
                        onChange={(e) => setHandles({...handles, [key]: e.target.value})}
                        className="bg-transparent w-full text-sm font-bold outline-none placeholder:opacity-20"
                        placeholder="..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          </div>

          {/* SIDEBAR / NODE INFO */}
          <motion.aside 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-4"
          >
            <div className={`p-10 rounded-[3rem] border sticky top-12 transition-colors ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100 shadow-xl shadow-stone-200/50'}`}>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-[#a9b897]/10 flex items-center justify-center">
                  <Fingerprint className="text-[#a9b897]" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-serif italic leading-none">Node Profile</h3>
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mt-1">System Auth Verified</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-stone-800/30 border-stone-700' : 'bg-stone-50/50 border-stone-100'}`}>
                  <p className="text-[8px] font-black uppercase opacity-40 mb-2">Auth Point</p>
                  <p className="text-xs font-mono truncate">{user?.email}</p>
                </div>

                <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-stone-800/30 border-stone-700' : 'bg-stone-50/50 border-stone-100'}`}>
                  <p className="text-[8px] font-black uppercase opacity-40 mb-2">Clearance Level</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black text-[#a9b897] uppercase tracking-tighter italic">Alpha Node</p>
                    <ShieldCheck size={14} className="text-[#a9b897]" />
                  </div>
                </div>

                <div className={`p-8 rounded-2xl bg-[#1c1c1c] text-stone-400 mt-8`}>
                   <p className="text-[9px] font-serif italic leading-relaxed">
                     Changes made to the Tone of Voice will immediately recalibrate the 
                     <span className="text-[#a9b897] mx-1">Clarity Engine</span> 
                     outputs for all users in this team node.
                   </p>
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}