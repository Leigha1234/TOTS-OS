"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Instagram, Linkedin, Twitter, Globe, Zap, Mail, Lock, Download, 
  Sun, Moon, MessageSquareQuote, MapPin, Phone, Building2, Upload
} from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // BRANDING STATE
  const [logo, setLogo] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#a9b897");
  const [toneOfVoice, setToneOfVoice] = useState("Professional, yet empathetic.");
  const [handles, setHandles] = useState<any>({ instagram: "", linkedin: "", twitter: "" });

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return;
    setUser(currentUser);

    const { data: p } = await supabase.from("profiles").select("*").eq("id", currentUser.id).maybeSingle();
    setProfile(p);

    const { data: membership } = await supabase.from("team_members").select("team_id").eq("user_id", currentUser.id).maybeSingle();
    if (membership?.team_id) {
      setTeamId(membership.team_id);
      const { data: s } = await supabase.from("settings").select("*").eq("team_id", membership.team_id).maybeSingle();
      if (s) {
        setLogo(s.logo || "");
        setBusinessName(s.business_name || "");
        setAddress(s.address || "");
        setPhone(s.phone || "");
        setWebsite(s.website || "");
        setContactEmail(s.contact_email || "");
        setPrimaryColor(s.primary_color || "#a9b897");
        setHandles(s.handles || handles);
      }
    }
    setLoading(false);
  }

  const saveSettings = async () => {
    const { error } = await supabase.from("settings").upsert({
      team_id: teamId,
      logo, business_name: businessName, address, phone,
      website, contact_email: contactEmail, primary_color: primaryColor,
      handles, tone_of_voice: toneOfVoice
    });
    if (!error) alert("Brand Identity Synced.");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-serif italic">Loading System...</div>;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-stone-950 text-stone-200' : 'bg-stone-50 text-stone-800'}`}>
      <div className="max-w-7xl mx-auto p-12 space-y-12">
        
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-6xl font-serif italic">Identity</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Core Brand Logic</p>
          </div>
          <button onClick={saveSettings} className="px-10 py-4 bg-[#a9b897] text-stone-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Commit Brand</button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* LOGO & PRIMARY INFO */}
          <section className="lg:col-span-8 space-y-8 bg-white dark:bg-stone-900 p-12 rounded-[3.5rem] border border-stone-100 dark:border-stone-800">
            <div className="flex flex-col md:flex-row gap-12 items-start">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-stone-400">Master Logo URL</label>
                <div className="w-48 h-48 rounded-[2rem] bg-stone-50 dark:bg-stone-800 border-2 border-dashed border-stone-200 flex items-center justify-center overflow-hidden">
                  {logo ? <img src={logo} className="object-contain p-4" alt="Brand Logo" /> : <Upload className="text-stone-300" />}
                </div>
                <input value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://..." className="w-full p-4 bg-stone-50 dark:bg-stone-800 rounded-xl text-xs outline-none" />
              </div>

              <div className="flex-grow space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-stone-400">Business Legal Name</label>
                    <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="w-full p-5 bg-stone-50 dark:bg-stone-800 rounded-2xl outline-none border-none text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-stone-400">Institutional Address</label>
                    <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-5 bg-stone-50 dark:bg-stone-800 rounded-2xl outline-none border-none text-sm h-24 resize-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl flex items-center gap-4">
                 <Phone size={16} className="text-[#a9b897]" />
                 <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-transparent text-xs font-bold outline-none w-full" />
               </div>
               <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl flex items-center gap-4">
                 <Mail size={16} className="text-[#a9b897]" />
                 <input placeholder="Public Email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="bg-transparent text-xs font-bold outline-none w-full" />
               </div>
               <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl flex items-center gap-4">
                 <Globe size={16} className="text-[#a9b897]" />
                 <input placeholder="Website" value={website} onChange={(e) => setWebsite(e.target.value)} className="bg-transparent text-xs font-bold outline-none w-full" />
               </div>
            </div>
          </section>

          {/* COLOR & TONE */}
          <section className="lg:col-span-4 space-y-8">
            <div className="bg-stone-900 p-10 rounded-[3rem] text-white">
               <h3 className="text-xl font-serif italic mb-6">Visual DNA</h3>
               <label className="text-[10px] font-black uppercase text-stone-500 block mb-2">Primary Action Color</label>
               <div className="flex items-center gap-4">
                 <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-12 h-12 rounded-full overflow-hidden border-none" />
                 <p className="font-mono text-sm">{primaryColor}</p>
               </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}