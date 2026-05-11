"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client"; 
import { useSettings } from "@/app/context/SettingsContext";
import { 
  Globe, Mail, Upload, Phone, Share2, 
  Check, Loader2, Type, ListChecks, HeartHandshake, ArrowLeft,
  ShieldCheck, Palette, Fingerprint, Database
} from "lucide-react";

export default function IdentitySettingsPage() {
  const router = useRouter();
  const { refreshSettings } = useSettings();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [user, setUser] = useState<any>(null);
  const [teamId, setTeamId] = useState<string | null>(null);

  // BRANDING & IDENTITY STATE
  const [logo, setLogo] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#a9b897");
  const [secondaryColor, setSecondaryColor] = useState("#1c1917");
  const [toneOfVoice, setToneOfVoice] = useState("Professional, yet empathetic.");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [handles, setHandles] = useState({ instagram: "", twitter: "", linkedin: "" });
  const [emailCampaignNames, setEmailCampaignNames] = useState("");
  const [nextOfKinPhone, setNextOfKinPhone] = useState("");

  useEffect(() => { init(); }, []);

  async function init() {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return router.push("/login");
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
          setLogo(s.logo_url || "");
          setBusinessName(s.business_name || "");
          setAddress(s.address || "");
          setPhone(s.phone || "");
          setWebsite(s.social_links?.website || "");
          setContactEmail(s.contact_email || "");
          setPrimaryColor(s.brand_color || "#a9b897");
          setSecondaryColor(s.secondary_color || "#1c1917");
          setHandles(s.social_links || { instagram: "", twitter: "", linkedin: "" });
          setToneOfVoice(s.tone_of_voice || "Professional, yet empathetic.");
          setFontFamily(s.font_family || "Inter");
          setEmailCampaignNames(s.campaigns?.join(", ") || "");
          setNextOfKinPhone(s.next_of_kin_phone || "");
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
    try {
      // Map comma-separated string back to array for the DB
      const campaignArray = emailCampaignNames.split(",").map(s => s.trim()).filter(Boolean);

      const { error } = await supabase.from("settings").upsert({
        team_id: teamId,
        logo_url: logo, 
        business_name: businessName, 
        address, 
        phone,
        contact_email: contactEmail, 
        brand_color: primaryColor,
        secondary_color: secondaryColor,
        font_family: fontFamily,
        social_links: { ...handles, website }, 
        tone_of_voice: toneOfVoice,
        campaigns: campaignArray,
        next_of_kin_phone: nextOfKinPhone
      });

      if (error) throw error;
      
      await refreshSettings();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <Loader2 className="animate-spin text-[var(--brand-primary)]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] transition-colors duration-500">
      
      <style jsx global>{`
        :root { --brand-primary: ${primaryColor}; --brand-secondary: ${secondaryColor}; }
        body { font-family: '${fontFamily}', sans-serif !important; }
      `}</style>

      <div className="max-w-[1400px] mx-auto px-6 py-12 md:p-16 lg:p-20 space-y-12">
        
        {/* TOP BAR */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <button 
            onClick={() => router.push('/settings')}
            className="group flex items-center gap-3 px-6 py-4 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] hover:bg-[var(--bg-soft)] transition-all shadow-sm w-full md:w-auto"
          >
            <ArrowLeft size={16} className="text-[var(--brand-primary)]" />
            <span className="text-[10px] font-black uppercase tracking-widest">Return to Dashboard</span>
          </button>

          <button 
            onClick={saveSettings} 
            disabled={saving}
            className={`w-full md:w-auto px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-4
              ${saved ? 'bg-green-500 text-white' : 'bg-[var(--brand-primary)] text-white hover:opacity-90'}
            `}
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : saved ? <Check size={16} /> : <Database size={16} />}
            {saved ? "Sync Complete" : "Commit Changes"}
          </button>
        </div>

        {/* HEADER */}
        <header className="border-b border-[var(--border)] pb-12">
          <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter leading-none text-[var(--brand-primary)]">Identity</h1>
          <div className="flex items-center gap-4 mt-6">
            <Badge icon={Fingerprint} label="Neural Brand Profile" />
            <Badge icon={ShieldCheck} label="Encrypted Sync" />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          
          {/* MAIN FORM */}
          <section className="lg:col-span-8 space-y-12">
            
            {/* BRAND ASSETS */}
            <div className="bg-[var(--card-bg)] p-8 md:p-12 rounded-[3.5rem] border border-[var(--border)] shadow-sm space-y-10">
              <div className="flex flex-col md:flex-row gap-12 items-start">
                <div className="space-y-4 shrink-0">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Brand Mark</label>
                  <div className="w-48 h-48 rounded-[2.5rem] bg-[var(--bg-soft)] border-2 border-dashed border-[var(--border)] flex items-center justify-center overflow-hidden group relative">
                    {logo ? <img src={logo} className="w-full h-full object-contain p-8" /> : <Upload className="text-[var(--text-muted)] opacity-20" />}
                    <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                      <Upload size={20} className="text-white" />
                      <input type="file" className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="flex-grow space-y-6 w-full">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Business Entity</label>
                    <input 
                      value={businessName} 
                      onChange={(e) => setBusinessName(e.target.value)} 
                      placeholder="Legal Name"
                      className="w-full p-6 bg-[var(--bg-soft)] rounded-2xl outline-none text-[var(--text-main)] font-serif italic text-2xl border border-transparent focus:border-[var(--brand-primary)]" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Operational Base</label>
                    <textarea 
                      value={address} 
                      onChange={(e) => setAddress(e.target.value)} 
                      placeholder="Institutional Address"
                      className="w-full p-6 bg-[var(--bg-soft)] rounded-2xl outline-none text-sm h-32 resize-none border border-transparent focus:border-[var(--brand-primary)]" 
                    />
                  </div>
                </div>
              </div>

              {/* CONTACT NODES */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {[
                   { icon: Phone, val: phone, set: setPhone, ph: "Secure Line" },
                   { icon: Mail, val: contactEmail, set: setContactEmail, ph: "Admin Email" },
                   { icon: Globe, val: website, set: setWebsite, ph: "Global Web" }
                 ].map((item, i) => (
                   <div key={i} className="p-5 bg-[var(--bg-soft)] rounded-2xl flex items-center gap-4 border border-transparent focus-within:border-[var(--brand-primary)] transition-all">
                     <item.icon size={16} className="text-[var(--brand-primary)]" />
                     <input placeholder={item.ph} value={item.val} onChange={(e) => item.set(e.target.value)} className="bg-transparent text-xs font-bold outline-none w-full" />
                   </div>
                 ))}
              </div>
            </div>

            {/* SYNDICATION */}
            <div className="bg-[var(--card-bg)] p-8 md:p-12 rounded-[3.5rem] border border-[var(--border)] shadow-sm space-y-8">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-muted)]">Data Syndication</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['instagram', 'twitter', 'linkedin'].map((platform) => (
                  <div key={platform} className="p-5 bg-[var(--bg-soft)] rounded-2xl flex items-center gap-4">
                    <Share2 size={16} className="text-[var(--text-muted)] opacity-30" />
                    <input 
                      placeholder={`${platform} ID`}
                      value={(handles as any)[platform]} 
                      onChange={(e) => setHandles({...handles, [platform]: e.target.value})} 
                      className="bg-transparent text-xs font-mono outline-none w-full" 
                    />
                  </div>
                ))}
              </div>

              <div className="pt-8 border-t border-[var(--border)] grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                    <ListChecks size={14} /> Active Campaigns
                  </label>
                  <textarea 
                    value={emailCampaignNames}
                    onChange={(e) => setEmailCampaignNames(e.target.value)}
                    placeholder="Comma separated campaigns..."
                    className="w-full p-5 bg-[var(--bg-soft)] rounded-2xl text-xs outline-none h-32 resize-none border border-transparent focus:border-[var(--brand-primary)] italic"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                    <HeartHandshake size={14} /> Emergency Protocol
                  </label>
                  <div className="p-5 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center gap-4">
                     <Phone size={16} className="text-red-500" />
                     <input 
                       placeholder="Next of Kin Contact" 
                       value={nextOfKinPhone} 
                       onChange={(e) => setNextOfKinPhone(e.target.value)} 
                       className="bg-transparent text-xs font-bold outline-none w-full text-red-900" 
                     />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SIDEBAR */}
          <aside className="lg:col-span-4 space-y-10">
            {/* COLOR DNA */}
            <div className="bg-[var(--brand-secondary)] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
               <Palette size={160} className="absolute -right-10 -top-10 opacity-5 group-hover:rotate-12 transition-transform duration-700" />
               <h3 className="text-2xl font-serif italic mb-8 relative z-10">Visual DNA</h3>
               
               <div className="space-y-8 relative z-10">
                 <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Primary Accent</p>
                      <p className="font-mono text-xs mt-1">{primaryColor.toUpperCase()}</p>
                    </div>
                    <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-14 h-14 rounded-full border-4 border-white/10 cursor-pointer bg-transparent" />
                 </div>
                 <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Base Deep</p>
                      <p className="font-mono text-xs mt-1">{secondaryColor.toUpperCase()}</p>
                    </div>
                    <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-14 h-14 rounded-full border-4 border-white/10 cursor-pointer bg-transparent" />
                 </div>
               </div>
            </div>

            {/* TYPOGRAPHY */}
            <div className="bg-[var(--card-bg)] p-10 rounded-[3rem] border border-[var(--border)] shadow-sm space-y-8">
               <h3 className="text-2xl font-serif italic">Typography</h3>
               <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase text-[var(--text-muted)] flex items-center gap-2 tracking-widest">
                   <Type size={14} /> Font Engine
                 </label>
                 <select
                   value={fontFamily}
                   onChange={(e) => setFontFamily(e.target.value)}
                   className="w-full p-5 bg-[var(--bg-soft)] rounded-2xl text-xs font-bold text-[var(--text-main)] outline-none appearance-none cursor-pointer"
                 >
                   <option value="Inter">Inter (Sans-Serif)</option>
                   <option value="Merriweather">Merriweather (Serif)</option>
                   <option value="Geist">Geist (Modern Mono)</option>
                   <option value="Playfair Display">Playfair Display (Deco)</option>
                 </select>
               </div>
               
               <div className="pt-6 border-t border-[var(--border)]">
                 <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-4 block tracking-widest">Neural Tone</label>
                 <textarea 
                   value={toneOfVoice} 
                   onChange={(e) => setToneOfVoice(e.target.value)}
                   className="w-full p-6 bg-[var(--bg-soft)] rounded-2xl text-xs italic leading-relaxed outline-none min-h-[150px] resize-none border border-transparent focus:border-[var(--brand-primary)]"
                 />
               </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Badge({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-soft)] border border-[var(--border)] rounded-full">
      <Icon size={12} className="text-[var(--brand-primary)]" />
      <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{label}</span>
    </div>
  );
}