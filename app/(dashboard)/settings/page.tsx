"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Settings, Sparkles, Globe, ShieldCheck, 
  Save, Moon, Sun, Instagram, Linkedin, 
  Twitter, Facebook, Youtube 
} from "lucide-react";
import { motion } from "framer-motion";

interface SocialHandles {
  instagram: string;
  linkedin: string;
  twitter: string;
  tiktok: string;
  facebook: string;
  youtube: string;
  [key: string]: string;
}

// Updated roles to be more inclusive for your OS
const AUTHORIZED_ROLES = ["owner", "admin", "manager", "elite"];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [toneOfVoice, setToneOfVoice] = useState("Professional, yet empathetic.");
  const [handles, setHandles] = useState<SocialHandles>({
    instagram: "", linkedin: "", twitter: "", tiktok: "", facebook: "", youtube: ""
  });
  const [website, setWebsite] = useState("");

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

      // Fetch Profile
      let { data: p } = await supabase.from("profiles").select("*").eq("id", currentUser.id).maybeSingle();
      
      // If no profile exists, create a default owner profile
      if (!p) {
        const { data: newProfile } = await supabase.from("profiles").insert({ id: currentUser.id, role: "owner", tier: "standard" }).select().single();
        p = newProfile;
      }
      setProfile(p);

      // Fetch Team & Settings
      const { data: membership } = await supabase.from("team_members").select("team_id").eq("user_id", currentUser.id).maybeSingle();
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
    const { error } = await supabase.from("settings").upsert({
      team_id: teamId,
      handles, 
      tone_of_voice: toneOfVoice, 
      website,
      updated_at: new Date().toISOString()
    });
    if (error) alert(error.message);
    else alert("System Synced Successfully");
  };

  if (loading) return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
       <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  // AUTH CHECK: Allows access if email matches OR if role is in authorized list OR if it's Sam's Hotmail
  const isAuthorized = 
    user?.email === "hill.samantha@hotmail.co.uk" || 
    (profile && AUTHORIZED_ROLES.includes(profile.role)) ||
    profile?.tier === "elite";

  if (!isAuthorized) return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center p-12 text-center">
      <ShieldCheck size={48} className="text-red-500 mb-6" />
      <h2 className="text-4xl font-serif italic text-[var(--text-main)]">Access Level Denied</h2>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-muted)] mt-4">
        Insufficient clearance for Global System Settings
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] p-8 md:p-16 transition-colors duration-500">
      <div className="max-w-6xl mx-auto space-y-12 pb-24">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[var(--border)] pb-10 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[var(--accent)]">
              <Settings size={14} />
              <p className="font-black uppercase text-[9px] tracking-[0.5em]">System Core</p>
            </div>
            <h1 className="text-6xl font-serif italic tracking-tighter uppercase">Settings</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)] opacity-70"> Clearance: {profile?.role} node </p>
          </div>

          <button 
            onClick={saveSettings} 
            className="flex items-center gap-3 bg-[var(--text-main)] text-[var(--bg)] px-8 py-4 rounded-2xl shadow-xl hover:scale-105 transition-all group"
          >
            <Save size={18} className="group-hover:rotate-12 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Commit Changes</span>
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* LEFT COLUMN: AI & CONTENT */}
          <div className="lg:col-span-7 space-y-10">
            <section className="card-fancy p-10 space-y-6">
              <div className="flex items-center gap-3">
                <Sparkles size={18} className="text-[var(--accent)]" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-muted)]">Clarity AI: Tone of Voice</h2>
              </div>
              <textarea 
                value={toneOfVoice}
                onChange={(e) => setToneOfVoice(e.target.value)}
                className="w-full h-40 p-6 bg-[var(--bg)] border border-[var(--border)] rounded-3xl text-sm outline-none resize-none focus:border-[var(--accent)] transition-all font-serif italic text-lg"
                placeholder="Describe how the AI should communicate..."
              />
            </section>

            <section className="card-fancy p-10 space-y-8">
              <div className="flex items-center gap-3">
                <Globe size={18} className="text-[var(--accent)]" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-muted)]">Social Architecture</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.keys(handles).map((key) => (
                  <div key={key} className="group space-y-2">
                    <label className="text-[9px] font-black uppercase text-[var(--text-muted)] ml-2 tracking-widest group-focus-within:text-[var(--accent)] transition-colors">
                      {key}
                    </label>
                    <input 
                      value={handles[key]} 
                      onChange={(e) => setHandles({...handles, [key]: e.target.value})}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-4 text-sm focus:border-[var(--accent)] outline-none transition-all"
                      placeholder={`@yourusername`}
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: SYSTEM INFO */}
          <aside className="lg:col-span-5">
            <div className="glass-panel p-10 sticky top-32 space-y-8">
              <div className="space-y-1">
                <h3 className="text-2xl font-serif italic">Node Identity</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)]">System Profile</p>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-[var(--bg-soft)] rounded-2xl border border-[var(--border)]">
                  <p className="text-[8px] font-black uppercase opacity-40 mb-1">Authenticated Email</p>
                  <p className="text-sm font-medium">{user?.email}</p>
                </div>

                <div className="p-4 bg-[var(--bg-soft)] rounded-2xl border border-[var(--border)]">
                  <p className="text-[8px] font-black uppercase opacity-40 mb-1">Current Tier</p>
                  <p className="text-sm font-black uppercase tracking-widest text-[var(--accent)]">{profile?.tier || 'Standard'}</p>
                </div>
              </div>

              <div className="pt-8 border-t border-[var(--border)] opacity-50">
                <p className="text-[9px] font-serif italic leading-relaxed">
                  Modifying global settings will propagate changes across all Clarity AI modules and automated report generation.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}