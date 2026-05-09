"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Globe, Mail, Upload, Phone, Share2, 
  Check, Loader2, Type, ListChecks, HeartHandshake, ArrowLeft
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [user, setUser] = useState<any>(null);
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
  const [handles, setHandles] = useState({
    instagram: "",
    twitter: "",
    linkedin: ""
  });
  
  const [fontFamily, setFontFamily] = useState("Inter");
  const [secondaryColor, setSecondaryColor] = useState("#e5e7eb");
  const [emailCampaignNames, setEmailCampaignNames] = useState("");
  const [nextOfKinPhone, setNextOfKinPhone] = useState("");

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return;
    setUser(currentUser);

    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (membership?.team_id) {
      setTeamId(membership.team_id);
      const { data: s } = await supabase
        .from("settings")
        .select("*")
        .eq("team_id", membership.team_id)
        .maybeSingle();

      if (s) {
        setLogo(s.logo || "");
        setBusinessName(s.business_name || "");
        setAddress(s.address || "");
        setPhone(s.phone || "");
        setWebsite(s.website || "");
        setContactEmail(s.contact_email || "");
        setPrimaryColor(s.primary_color || "#a9b897");
        setHandles(s.handles || { instagram: "", twitter: "", linkedin: "" });
        setToneOfVoice(s.tone_of_voice || "Professional, yet empathetic.");
        setFontFamily(s.font_family || "Inter");
        setSecondaryColor(s.secondary_color || "#e5e7eb");
        setEmailCampaignNames(s.email_campaign_names || "");
        setNextOfKinPhone(s.next_of_kin_phone || "");
      }
    }
    setLoading(false);
  }

  const saveSettings = async () => {
    setSaving(true);
    const { error } = await supabase.from("settings").upsert({
      team_id: teamId,
      logo, 
      business_name: businessName, 
      address, 
      phone,
      website, 
      contact_email: contactEmail, 
      primary_color: primaryColor,
      handles, 
      tone_of_voice: toneOfVoice,
      font_family: fontFamily,
      secondary_color: secondaryColor,
      email_campaign_names: emailCampaignNames,
      next_of_kin_phone: nextOfKinPhone
    });

    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-stone-300" size={32} />
          <p className="font-serif italic text-stone-400">Loading System Identity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-stone-950 text-stone-200' : 'bg-[#e9e9e1] text-stone-800'}`}>
      <div className="max-w-7xl mx-auto px-6 py-8 md:p-12 space-y-8 md:space-y-12">
        
        {/* NAVIGATION BACK BUTTON */}
        <div className="flex justify-center md:justify-start">
          <button 
            onClick={() => router.push('/settings')}
            className="group flex items-center gap-3 px-6 py-3 rounded-2xl border border-stone-300 bg-white/50 backdrop-blur-sm hover:bg-stone-900 hover:text-white transition-all shadow-sm w-full md:w-auto justify-center"
          >
            <ArrowLeft size={16} className="text-[#a9b897] group-hover:text-white transition-colors" />
            <span className="text-[10px] font-black uppercase tracking-widest">Back to System</span>
          </button>
        </div>

        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-center md:items-end border-b border-stone-300 pb-8 md:pb-10 gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-5xl md:text-6xl font-serif italic tracking-tighter">Identity</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 mt-2">Core Brand Logic</p>
          </div>
          <button 
            onClick={saveSettings} 
            disabled={saving}
            className={`w-full md:w-auto px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3
              ${saved ? 'bg-green-100 text-green-700' : 'bg-[#1c1c1c] text-[#a9b897] hover:scale-105 active:scale-95'}
            `}
          >
            {saving ? <Loader2 className="animate-spin" size={14} /> : saved ? <Check size={14} /> : null}
            {saved ? "Synced" : "Commit Brand"}
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
          {/* MAIN CONTENT */}
          <section className="lg:col-span-8 space-y-8 bg-white/80 backdrop-blur-sm p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border border-white shadow-sm">
            <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
              <div className="space-y-4 w-full md:w-auto flex flex-col items-center md:items-start">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Master Logo</label>
                <div className="w-40 h-40 md:w-48 md:h-48 rounded-[2rem] bg-stone-50 border-2 border-dashed border-stone-200 flex items-center justify-center overflow-hidden transition-all hover:border-stone-400 relative group">
                  {logo ? <img src={logo} className="w-full h-full object-contain p-6" alt="Brand Logo" /> : <Upload className="text-stone-300" />}
                </div>
                <input 
                  value={logo} 
                  onChange={(e) => setLogo(e.target.value)} 
                  placeholder="Logo URL" 
                  className="w-full p-4 bg-stone-50 rounded-xl text-[10px] font-mono outline-none border border-transparent focus:border-stone-200 transition-all" 
                />
              </div>

              <div className="flex-grow space-y-6 w-full">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Business Legal Name</label>
                  <input 
                    value={businessName} 
                    onChange={(e) => setBusinessName(e.target.value)} 
                    className="w-full p-4 md:p-5 bg-stone-50 rounded-2xl outline-none text-stone-800 font-serif italic text-lg border border-transparent focus:border-stone-200" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Institutional Address</label>
                  <textarea 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)} 
                    className="w-full p-4 md:p-5 bg-stone-50 rounded-2xl outline-none text-sm h-28 resize-none border border-transparent focus:border-stone-200" 
                  />
                </div>
              </div>
            </div>

            {/* CONTACT GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
               {[
                 { icon: Phone, val: phone, set: setPhone, ph: "Phone" },
                 { icon: Mail, val: contactEmail, set: setContactEmail, ph: "Public Email" },
                 { icon: Globe, val: website, set: setWebsite, ph: "Website" }
               ].map((item, i) => (
                 <div key={i} className="p-4 bg-stone-50 rounded-2xl flex items-center gap-4 border border-transparent focus-within:border-stone-200 transition-all">
                   <item.icon size={16} className="text-[#a9b897] shrink-0" />
                   <input 
                    placeholder={item.ph} 
                    value={item.val} 
                    onChange={(e) => item.set(e.target.value)} 
                    className="bg-transparent text-xs font-bold outline-none w-full" 
                   />
                 </div>
               ))}
            </div>

            {/* SOCIAL CONNECTIONS */}
            <div className="pt-8 border-t border-stone-100 space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Social Connections</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                {['instagram', 'twitter', 'linkedin'].map((platform) => (
                  <div key={platform} className="p-4 bg-stone-50 rounded-2xl flex items-center gap-4 border border-transparent focus-within:border-stone-200">
                    <Share2 size={16} className="text-stone-300 shrink-0" />
                    <input 
                      placeholder={`${platform.charAt(0).toUpperCase() + platform.slice(1)} URL`}
                      value={(handles as any)[platform]} 
                      onChange={(e) => setHandles({...handles, [platform]: e.target.value})} 
                      className="bg-transparent text-xs outline-none w-full" 
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ADDITIONAL CAMPAIGNS AND NOK FIELDS */}
            <div className="pt-8 border-t border-stone-100 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
                  <ListChecks size={14} className="text-[#a9b897]" /> Email Campaigns List
                </label>
                <textarea 
                  value={emailCampaignNames}
                  onChange={(e) => setEmailCampaignNames(e.target.value)}
                  className="w-full p-4 bg-stone-50 rounded-2xl text-xs leading-relaxed outline-none h-24 md:h-28 resize-none border border-transparent focus:border-stone-200 transition-all italic text-stone-600"
                  placeholder="E.g., Summer Promotion, Winter Newsletter"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
                  <HeartHandshake size={14} className="text-[#a9b897]" /> Emergency Contacts
                </label>
                <div className="p-4 bg-stone-50 rounded-2xl flex items-center gap-4 border border-transparent focus-within:border-stone-200">
                   <Phone size={16} className="text-[#a9b897] shrink-0" />
                   <input 
                     placeholder="Next of Kin Phone" 
                     value={nextOfKinPhone} 
                     onChange={(e) => setNextOfKinPhone(e.target.value)} 
                     className="bg-transparent text-xs font-bold outline-none w-full" 
                   />
                </div>
                <p className="text-[9px] text-stone-400 italic">Encrypted employee records data node.</p>
              </div>
            </div>
          </section>

          {/* SIDEBAR DNA */}
          <section className="lg:col-span-4 space-y-8 pb-12 md:pb-0">
            <div className="bg-[#1c1c1c] p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute -right-4 -top-4 opacity-10 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
                  <Upload size={120} />
               </div>
               <h3 className="text-xl font-serif italic mb-6 relative z-10">Visual DNA</h3>
               
               <div className="space-y-6 relative z-10">
                 <div>
                   <label className="text-[10px] font-black uppercase text-stone-500 block mb-4 tracking-widest">Primary Accent</label>
                   <div className="flex items-center gap-4">
                     <input 
                       type="color" 
                       value={primaryColor} 
                       onChange={(e) => setPrimaryColor(e.target.value)} 
                       className="w-12 h-12 rounded-full overflow-hidden border-4 border-stone-800 cursor-pointer" 
                     />
                     <div>
                        <p className="font-mono text-sm text-[#a9b897]">{primaryColor.toUpperCase()}</p>
                        <p className="text-[8px] uppercase font-black text-stone-500 tracking-tighter">Action Color</p>
                     </div>
                   </div>
                 </div>
                 
                 <div>
                   <label className="text-[10px] font-black uppercase text-stone-500 block mb-4 tracking-widest">Secondary Accent</label>
                   <div className="flex items-center gap-4">
                     <input 
                       type="color" 
                       value={secondaryColor} 
                       onChange={(e) => setSecondaryColor(e.target.value)} 
                       className="w-12 h-12 rounded-full overflow-hidden border-4 border-stone-800 cursor-pointer" 
                     />
                     <div>
                        <p className="font-mono text-sm text-[#a9b897]">{secondaryColor.toUpperCase()}</p>
                        <p className="text-[8px] uppercase font-black text-stone-500 tracking-tighter">Surface Accent</p>
                     </div>
                   </div>
                 </div>
               </div>
            </div>
            
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-stone-200 shadow-sm space-y-6">
               <h3 className="text-xl font-serif italic text-stone-800">Typography</h3>
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-stone-400 block tracking-widest flex items-center gap-2">
                   <Type size={14} className="text-[#a9b897]" /> Font Engine
                 </label>
                 <select
                   value={fontFamily}
                   onChange={(e) => setFontFamily(e.target.value)}
                   className="w-full p-4 bg-stone-50 rounded-2xl text-xs outline-none border border-transparent focus:border-stone-200 transition-all font-bold text-stone-600 appearance-none"
                 >
                   <option value="Inter">Inter (Sans-Serif)</option>
                   <option value="Merriweather">Merriweather (Serif)</option>
                   <option value="Courier Prime">Courier Prime (Mono)</option>
                   <option value="Playfair Display">Playfair Display (Deco)</option>
                 </select>
               </div>
               
               <div>
                 <label className="text-[10px] font-black uppercase text-stone-400 block mb-2 tracking-widest">Intelligence Voice</label>
                 <textarea 
                   value={toneOfVoice} 
                   onChange={(e) => setToneOfVoice(e.target.value)}
                   className="w-full p-5 bg-stone-50 rounded-2xl text-xs leading-relaxed outline-none min-h-[120px] resize-none border border-transparent focus:border-stone-200 transition-all italic text-stone-600"
                   placeholder="Describe brand persona..."
                 />
               </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}