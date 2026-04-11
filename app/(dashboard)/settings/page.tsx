"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface SocialHandles {
  instagram: string;
  linkedin: string;
  twitter: string;
  tiktok: string;
  facebook: string;
  youtube: string;
  [key: string]: string;
}

const AUTHORIZED_ROLES = ["owner", "admin", "manager"];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
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
      website
    });
    if (error) alert(error.message);
    else alert("System Synced Successfully");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-serif italic text-stone-400">Loading OS...</div>;

  const isAuthorized = user?.email === "hill.samantha@hotmail.co.uk" || (profile && AUTHORIZED_ROLES.includes(profile.role));
  if (!isAuthorized) return <div className="min-h-screen flex items-center justify-center p-12 text-center font-serif">Access Level Denied.</div>;

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-stone-950 text-stone-200' : 'bg-stone-50 text-stone-800'}`}>
      <div className="max-w-7xl mx-auto p-6 space-y-10 pb-40">
        
        <div className={`flex flex-col md:flex-row justify-between items-center p-10 rounded-[3rem] border shadow-sm gap-6 ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
          <div>
            <h1 className="text-5xl font-serif italic text-[#a9b897]">Global Settings</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-2 opacity-50">Role: {profile?.role}</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="px-6 py-4 rounded-2xl bg-stone-100 dark:bg-stone-800 text-[9px] font-black uppercase tracking-widest">
              {isDarkMode ? 'Light' : 'Dark'}
            </button>
            <button onClick={saveSettings} className="px-8 py-4 bg-[#a9b897] text-stone-900 rounded-2xl font-black text-[10px] uppercase tracking-widest">
              Commit Changes
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
            <section className={`p-10 rounded-[2.5rem] border ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-400 mb-6">Clarity AI: Tone</h2>
              <textarea 
                value={toneOfVoice}
                onChange={(e) => setToneOfVoice(e.target.value)}
                className="w-full h-32 p-6 bg-stone-50 dark:bg-stone-800/50 border-none rounded-3xl text-sm outline-none resize-none"
              />
            </section>

            <section className={`p-10 rounded-[2.5rem] border ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-400 mb-8">Social Handles</h2>
              <div className="grid grid-cols-2 gap-4">
                {Object.keys(handles).map((key) => (
                  <div key={key} className="p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl flex flex-col gap-1">
                    <label className="text-[8px] font-black uppercase opacity-40">{key}</label>
                    <input 
                      value={handles[key]} 
                      onChange={(e) => setHandles({...handles, [key]: e.target.value})}
                      className="bg-transparent w-full text-[11px] font-bold outline-none"
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