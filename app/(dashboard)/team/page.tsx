"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client"; 
import { useSettings } from "@/app/context/SettingsContext";
import { 
  Globe, Mail, Upload, Phone, Share2, 
  Check, Loader2, Type, ListChecks, HeartHandshake, ArrowLeft,
  ShieldCheck, Palette, Fingerprint, Database, 
  Users, UserPlus, Zap, Clock, Shield, 
  Camera, Lock, ArrowUpRight, Plus, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

/**
 * TOTS OS: IDENTITY & TEAM HUB v5.2
 * Aesthetic: Organic Minimalist / Dashboard Parity
 * Navigation: Top-Nav Centric
 */

export default function IdentityTeamHub() {
  const router = useRouter();
  const { refreshSettings } = useSettings();
  
  // -- View State --
  const [activeTab, setActiveTab] = useState<"identity" | "team">("identity");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // -- Data State --
  const [teamId, setTeamId] = useState<string | null>(null);
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

  const [teamMembers, setTeamMembers] = useState([
    { id: "1", name: "David", role: "Strategy / Manager", status: "Active" },
    { id: "2", name: "Sarah Jenkins", role: "Creative Lead", status: "Active" },
    { id: "3", name: "Leigha Day-Clark", role: "Root Node", status: "Active" }
  ]);

  // -- Initialization --
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    init();
    return () => clearInterval(timer);
  }, []);

  async function init() {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return router.push("/login");

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

  const handleSave = async () => {
    setSaving(true);
    try {
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
      toast.success("Identity Synchronized Successfully");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-[#A3B18A]" size={32} />
      <p className="font-black uppercase tracking-[0.5em] text-[#A3B18A] text-[10px]">Loading Identity Core</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-4 md:p-8 lg:p-12 space-y-8 md:space-y-12 max-w-[1600px] mx-auto font-sans selection:bg-[#A3B18A] selection:text-white">
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&family=Inter:wght@300;400;700;900&display=swap');
        :root { --brand-primary: ${primaryColor}; }
        .font-serif { font-family: 'Instrument Serif', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* --- HEADER --- */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-8 md:pb-12 gap-6 md:gap-8">
        <div className="space-y-4 w-full md:w-auto">
          <div className="flex flex-wrap items-center gap-6 text-[#A3B18A]">
            <div className="flex items-center gap-2">
              <Shield size={12} fill="currentColor" />
              <p className="font-black uppercase text-[9px] tracking-[0.4em]">Node: {businessName || "UNNAMED ENTITY"}</p>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={12} />
              <p className="font-black uppercase text-[9px] tracking-[0.4em]">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif italic tracking-tighter leading-none text-stone-900">Architecture</h1>
          
          {/* NAVIGATION BUTTONS */}
          <nav className="flex items-center gap-4 pt-4">
            {[
              { id: "identity", label: "Brand DNA", icon: Fingerprint },
              { id: "team", label: "Team Nodes", icon: Users },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-8 py-3.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id 
                  ? "bg-stone-900 text-white shadow-lg" 
                  : "bg-white border border-stone-100 text-stone-300 hover:text-stone-900"
                }`}
              >
                <tab.icon size={12} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          onClick={handleSave}
          disabled={saving}
          className="w-full md:w-auto flex items-center justify-center gap-4 bg-[#A3B18A] px-10 py-5 rounded-[2rem] shadow-sm hover:shadow-xl transition-all cursor-pointer"
        >
          {saving ? <Loader2 className="animate-spin text-white" size={18} /> : <Database className="text-white" size={18} />}
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
            {saving ? "Syncing Logic..." : "Commit Changes"}
          </span>
        </motion.button>
      </header>

      {/* --- MAIN CONTENT CANVAS --- */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
        <AnimatePresence mode="wait">
          
          {/* VIEW: IDENTITY & BRAND DNA */}
          {activeTab === "identity" && (
            <motion.div 
              key="identity"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-5 gap-8 md:gap-12"
            >
              {/* Primary Form */}
              <section className="bg-white border border-stone-200 p-8 md:p-14 rounded-[3.5rem] shadow-sm lg:col-span-3 space-y-12">
                <div className="flex flex-col md:flex-row gap-12 items-start">
                  <div className="space-y-4 shrink-0">
                    <label className="text-[9px] font-black uppercase tracking-widest text-stone-300 ml-2">Brand Mark</label>
                    <div className="w-48 h-48 rounded-[3rem] bg-[#faf9f6] border border-stone-100 flex items-center justify-center overflow-hidden group relative">
                      {logo ? (
                        <img src={logo} alt="Logo" className="w-full h-full object-contain p-8" />
                      ) : (
                        <Camera className="text-stone-100" size={32} />
                      )}
                      <label className="absolute inset-0 bg-stone-900/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                        <Upload size={20} className="text-stone-900" />
                        <input type="file" className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div className="flex-grow space-y-8 w-full">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-stone-300 ml-2">Legal Entity</label>
                      <input 
                        value={businessName} 
                        onChange={(e) => setBusinessName(e.target.value)} 
                        className="w-full p-6 bg-[#faf9f6] border border-stone-100 rounded-2xl outline-none text-stone-900 font-serif italic text-3xl focus:border-[#A3B18A] transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-stone-300 ml-2">Operational Base</label>
                      <textarea 
                        value={address} 
                        onChange={(e) => setAddress(e.target.value)} 
                        className="w-full p-6 bg-[#faf9f6] border border-stone-100 rounded-2xl outline-none text-xs font-bold text-stone-700 h-32 resize-none" 
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Sub-Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-stone-100">
                   {[
                     { icon: Phone, val: phone, set: setPhone, label: "Secure Line" },
                     { icon: Mail, val: contactEmail, set: setContactEmail, label: "Admin Node" },
                     { icon: Globe, val: website, set: setWebsite, label: "Global Web" }
                   ].map((item, i) => (
                     <div key={i} className="p-6 bg-[#faf9f6] rounded-[2rem] border border-stone-50 flex flex-col gap-4 group hover:border-[#A3B18A] transition-all">
                        <item.icon size={16} className="text-stone-300 group-hover:text-[#A3B18A] transition-colors" />
                        <div className="space-y-1">
                          <label className="text-[7px] font-black uppercase tracking-widest text-stone-300">{item.label}</label>
                          <input value={item.val} onChange={(e) => item.set(e.target.value)} className="bg-transparent text-[10px] font-bold outline-none w-full text-stone-700" />
                        </div>
                     </div>
                   ))}
                </div>
              </section>

              {/* DNA Sidebar (Colors & Type) */}
              <div className="lg:col-span-2 space-y-8">
                <section className="bg-stone-900 p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
                   <Palette size={180} className="absolute -right-16 -top-16 opacity-5 group-hover:rotate-12 transition-transform duration-1000" />
                   <h3 className="text-3xl font-serif italic text-[#A3B18A] mb-10 relative z-10">Visual Logic.</h3>
                   
                   <div className="space-y-10 relative z-10">
                     <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[8px] font-black uppercase text-white/40 tracking-[0.3em]">Primary Accent</p>
                          <p className="font-mono text-[10px] mt-1 text-[#A3B18A]">{primaryColor.toUpperCase()}</p>
                        </div>
                        <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-14 h-14 rounded-full border-4 border-white/5 cursor-pointer bg-transparent" />
                     </div>
                     <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[8px] font-black uppercase text-white/40 tracking-[0.3em]">Base Deep</p>
                          <p className="font-mono text-[10px] mt-1 text-white/60">{secondaryColor.toUpperCase()}</p>
                        </div>
                        <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-14 h-14 rounded-full border-4 border-white/5 cursor-pointer bg-transparent" />
                     </div>
                     
                     <div className="pt-8 border-t border-white/5">
                        <label className="text-[8px] font-black uppercase text-white/40 mb-4 block tracking-widest">Font Engine</label>
                        <select
                          value={fontFamily}
                          onChange={(e) => setFontFamily(e.target.value)}
                          className="w-full p-5 bg-white/5 rounded-2xl text-[10px] font-black uppercase text-white outline-none border border-white/10 appearance-none cursor-pointer hover:bg-white/10 transition-all"
                        >
                          <option value="Inter">Inter (Global)</option>
                          <option value="Merriweather">Merriweather (Serif)</option>
                          <option value="Geist">Geist (Technical)</option>
                        </select>
                     </div>
                   </div>
                </section>

                <section className="bg-white border border-stone-200 p-10 rounded-[3rem] shadow-sm">
                   <div className="flex items-center gap-3 mb-6">
                      <ListChecks size={16} className="text-[#A3B18A]" />
                      <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-400">Neural Tone</h3>
                   </div>
                   <textarea 
                     value={toneOfVoice} 
                     onChange={(e) => setToneOfVoice(e.target.value)}
                     className="w-full p-6 bg-[#faf9f6] border border-stone-50 rounded-[2rem] text-[11px] font-serif italic leading-relaxed outline-none min-h-[160px] resize-none focus:border-[#A3B18A] transition-all"
                   />
                </section>
              </div>
            </motion.div>
          )}

          {/* VIEW: TEAM NODES */}
          {activeTab === "team" && (
            <motion.div 
              key="team"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="lg:col-span-12 space-y-12"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {teamMembers.map((member, i) => (
                  <div key={i} className="bg-white border border-stone-200 p-10 rounded-[3.5rem] shadow-sm group hover:shadow-xl transition-all duration-500 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-10">
                       <div className="w-16 h-16 rounded-[2rem] bg-[#faf9f6] border border-stone-100 flex items-center justify-center text-xl font-serif italic text-stone-300 group-hover:bg-stone-900 group-hover:text-[#A3B18A] transition-all">
                         {member.name.charAt(0)}
                       </div>
                       <div className="px-3 py-1 bg-[#faf9f6] rounded-full flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-[#A3B18A] animate-pulse" />
                          <span className="text-[7px] font-black uppercase tracking-widest text-stone-400">{member.status}</span>
                       </div>
                    </div>
                    <h3 className="text-2xl font-serif italic text-stone-900 tracking-tight leading-none">{member.name}</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300 mt-2 mb-8">{member.role}</p>
                    
                    <button className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-stone-200 hover:text-stone-900 transition-colors">
                      Configure Node <ChevronRight size={10} />
                    </button>
                  </div>
                ))}

                {/* Provision Card */}
                <button className="bg-[#faf9f6] border border-dashed border-stone-200 p-10 rounded-[3.5rem] flex flex-col items-center justify-center gap-6 group hover:border-[#A3B18A] transition-all">
                  <div className="w-14 h-14 rounded-full border border-stone-100 flex items-center justify-center text-stone-200 group-hover:bg-[#A3B18A] group-hover:text-white transition-all">
                    <Plus size={20} />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-300 group-hover:text-stone-900">Provision New Node</p>
                    <p className="text-[8px] font-serif italic text-stone-200 mt-1">Grant authorized workspace access</p>
                  </div>
                </button>
              </div>

              {/* Team Permissions Info */}
              <section className="bg-white border border-stone-200 p-10 rounded-[3rem] shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-[1.5rem] bg-stone-900 flex items-center justify-center text-[#A3B18A]">
                    <Lock size={18} />
                  </div>
                  <div>
                    <h4 className="text-xl font-serif italic text-stone-900">Encryption & Access.</h4>
                    <p className="text-[9px] font-black uppercase tracking-widest text-stone-300">All team communication is end-to-end encrypted across Elgin nodes.</p>
                  </div>
                </div>
                <button className="px-8 py-3 rounded-full border border-stone-100 text-[9px] font-black uppercase tracking-widest text-stone-300 hover:text-stone-900 transition-all">
                  Security Audit
                </button>
              </section>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* --- FOOTER UTILITIES --- */}
      <footer className="pt-12 border-t border-stone-200 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-wrap items-center gap-8">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-[#A3B18A]" />
             <span className="text-[9px] font-black uppercase tracking-widest text-stone-300">System Nominal</span>
          </div>
          <div className="flex items-center gap-4">
             <div className="p-4 bg-white border border-stone-100 rounded-2xl flex items-center gap-3">
                <HeartHandshake size={14} className="text-red-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-stone-300">Kin Node: {nextOfKinPhone || "Unset"}</span>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <p className="text-[10px] font-serif italic text-stone-300">TOTS Operational Data Hub // 2026</p>
          <button 
            onClick={() => router.push('/settings')}
            className="flex items-center gap-3 px-6 py-3 rounded-full border border-stone-100 text-[9px] font-black uppercase tracking-widest text-stone-300 hover:text-stone-900 transition-all"
          >
            <ArrowLeft size={12} /> Dashboard
          </button>
        </div>
      </footer>

    </div>
  );
}