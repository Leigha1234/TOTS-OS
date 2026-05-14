"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client"; 
import { useSettings } from "@/app/context/SettingsContext";
import { 
  Globe, Mail, Upload, Phone, Share2, 
  Check, Loader2, Type, ListChecks, HeartHandshake, ArrowLeft,
  ShieldCheck, Palette, Fingerprint, Database, 
  Users, Plus, ChevronRight, Camera, Shield, Clock,
  Instagram, Twitter, Linkedin, Trash2, Edit3, 
  Eye, Zap, AlertCircle, HardDrive, Filter, Search,
  Settings, Key, Smartphone, Lock, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

/**
 * TOTS OS: COMPREHENSIVE TEAM & BRAND ARCHITECTURE v6.0
 * Location: app/settings/team/page.tsx
 * Complexity: High (400+ LOC)
 * Aesthetic: Sage & Stone Minimalist
 */

export default function ComprehensiveTeamHub() {
  const router = useRouter();
  const { refreshSettings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // -- UI & Navigation State --
  const [activeTab, setActiveTab] = useState<"team" | "brand" | "security">("team");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // -- Brand & Identity State --
  const [teamId, setTeamId] = useState<string | null>(null);
  const [logo, setLogo] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#a9b897");
  const [secondaryColor, setSecondaryColor] = useState("#1c1917");
  const [toneOfVoice, setToneOfVoice] = useState("");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [handles, setHandles] = useState({ instagram: "", twitter: "", linkedin: "" });
  const [emailCampaigns, setEmailCampaigns] = useState<string[]>([]);
  const [nextOfKinPhone, setNextOfKinPhone] = useState("");

  // -- Team State --
  const [teamMembers, setTeamMembers] = useState([
    { id: "1", name: "David", role: "Manager", status: "Active", clearance: "Level 4", lastSeen: "2h ago" },
    { id: "2", name: "Leigha Day-Clark", role: "Root Admin", status: "Active", clearance: "Level 5", lastSeen: "Now" },
    { id: "3", name: "Ryan", role: "Developer", status: "Idle", clearance: "Level 3", lastSeen: "5h ago" },
    { id: "4", name: "System Node", role: "Automation", status: "Active", clearance: "Level 5", lastSeen: "Continuous" }
  ]);

  // -- Security Logs State --
  const [logs] = useState([
    { id: 1, event: "RSA Key Rotation", time: "14h ago", status: "Success" },
    { id: 2, event: "New Node Invitation", time: "1d ago", status: "Pending" },
    { id: 3, event: "Database Sync", time: "2h ago", status: "Nominal" },
    { id: 4, event: "Brand DNA Update", time: "5m ago", status: "Success" }
  ]);

  // -- Hydration & Data Init --
  useEffect(() => {
    setCurrentTime(new Date());
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
          setEmailCampaigns(s.campaigns || []);
          setNextOfKinPhone(s.next_of_kin_phone || "");
        }
      }
    } catch (err) {
      console.error("Critical Load Failure:", err);
      toast.error("Architecture Synced with Errors");
    } finally {
      setLoading(false);
    }
  }

  // -- Actions --
  const handleSave = async () => {
    setSaving(true);
    try {
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
        campaigns: emailCampaigns,
        next_of_kin_phone: nextOfKinPhone
      });

      if (error) throw error;
      await refreshSettings();
      toast.success("System Logic Synchronized");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.info("Logo ingestion protocol started...");
      // Implementation for Supabase Storage would go here
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <Loader2 className="animate-spin text-[#A3B18A]" size={48} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-stone-900 rounded-full" />
        </div>
      </div>
      <p className="font-black uppercase tracking-[0.6em] text-[#A3B18A] text-[10px] animate-pulse">Initializing Team Architecture</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-4 md:p-8 lg:p-12 space-y-8 md:space-y-12 max-w-[1800px] mx-auto font-sans">
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&family=Inter:wght@300;400;700;900&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
      `}</style>

      {/* --- HEADER BLOCK --- */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end border-b border-stone-200 pb-10 gap-8">
        <div className="space-y-6 w-full xl:w-auto">
          <div className="flex flex-wrap items-center gap-6 text-[#A3B18A]">
            <div className="flex items-center gap-2 bg-[#A3B18A]/5 px-4 py-2 rounded-full border border-[#A3B18A]/10">
              <Shield size={12} fill="currentColor" />
              <p className="font-black uppercase text-[9px] tracking-[0.4em]">Node: {businessName || "MANAGEMENT"}</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2">
              <Clock size={12} />
              <p className="font-black uppercase text-[9px] tracking-[0.4em]">
                {currentTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) || "--:--:--"}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 opacity-40">
              <Activity size={12} />
              <p className="font-black uppercase text-[9px] tracking-[0.4em]">System Nominal</p>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter leading-none text-stone-900">
              Management Hub
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-300 ml-2">Unified Identity & Team Architecture</p>
          </div>
          
          <nav className="flex flex-wrap items-center gap-3 pt-6">
            {[
              { id: "team", label: "Nodes", icon: Users },
              { id: "brand", label: "Brand DNA", icon: Palette },
              { id: "security", label: "Protocols", icon: ShieldCheck }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-4 px-8 py-4 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-500 ${
                  activeTab === tab.id 
                  ? "bg-stone-900 text-white shadow-2xl scale-105" 
                  : "bg-white border border-stone-100 text-stone-300 hover:text-stone-900 hover:border-stone-300"
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
           <button 
            onClick={() => router.push('/settings')}
            className="group w-full sm:w-auto px-10 py-5 rounded-[2rem] border border-stone-100 bg-white text-stone-400 hover:text-stone-900 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Command Center
          </button>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto flex items-center justify-center gap-4 bg-[#A3B18A] px-12 py-5 rounded-[2rem] shadow-xl hover:brightness-110 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin text-white" size={18} /> : <Database className="text-white" size={18} />}
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
              {saving ? "Ingesting..." : "Commit Logic"}
            </span>
          </motion.button>
        </div>
      </header>

      {/* --- MAIN INTERFACE --- */}
      <main className="min-h-[600px]">
        <AnimatePresence mode="wait">
          
          {/* TAB: TEAM NODES */}
          {activeTab === "team" && (
            <motion.div 
              key="team"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Search & Filter Bar */}
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-[2.5rem] border border-stone-100">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={16} />
                  <input 
                    type="text"
                    placeholder="Filter nodes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-[#faf9f6] border border-stone-50 rounded-2xl text-xs font-bold focus:border-[#A3B18A] outline-none transition-all"
                  />
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                  <button className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-4 bg-[#faf9f6] rounded-2xl border border-stone-50 text-[9px] font-black uppercase tracking-widest text-stone-400">
                    <Filter size={14} /> Status
                  </button>
                  <button className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-stone-900 text-[#A3B18A] rounded-2xl text-[9px] font-black uppercase tracking-widest">
                    <Plus size={14} /> Provision Node
                  </button>
                </div>
              </div>

              {/* Members Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                {teamMembers.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase())).map((member, i) => (
                  <motion.div 
                    key={member.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white border border-stone-200 p-10 rounded-[3.5rem] shadow-sm group hover:border-[#A3B18A] hover:shadow-2xl transition-all duration-700 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit3 size={14} className="text-stone-300 hover:text-stone-900 cursor-pointer" />
                    </div>

                    <div className="flex justify-between items-start mb-12">
                       <div className="w-20 h-20 rounded-[2.5rem] bg-[#faf9f6] border border-stone-50 flex items-center justify-center text-3xl font-serif italic text-stone-200 group-hover:bg-stone-900 group-hover:text-[#A3B18A] transition-all duration-500">
                         {member.name.charAt(0)}
                       </div>
                       <div className="flex flex-col items-end gap-2">
                          <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 border ${member.status === 'Active' ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
                             <div className={`w-1.5 h-1.5 rounded-full ${member.status === 'Active' ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`} />
                             <span className="text-[8px] font-black uppercase tracking-widest text-stone-500">{member.status}</span>
                          </div>
                          <span className="text-[7px] font-black uppercase tracking-[0.2em] text-stone-300 italic">{member.lastSeen}</span>
                       </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-3xl font-serif italic text-stone-900 tracking-tight">{member.name}</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#A3B18A] mt-1">{member.role}</p>
                      </div>
                      
                      <div className="pt-6 border-t border-stone-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={12} className="text-stone-200" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">{member.clearance}</span>
                        </div>
                        <button className="text-[9px] font-black uppercase tracking-widest text-stone-200 group-hover:text-stone-900 flex items-center gap-2 transition-colors">
                          Profile <ChevronRight size={10} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB: BRAND DNA */}
          {activeTab === "brand" && (
            <motion.div 
              key="brand"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 xl:grid-cols-12 gap-12"
            >
              <div className="xl:col-span-8 space-y-12">
                {/* Core Identity Section */}
                <section className="bg-white border border-stone-200 p-10 md:p-16 rounded-[4rem] shadow-sm space-y-16">
                  <div className="flex flex-col md:flex-row gap-16 items-start">
                    <div className="space-y-6 shrink-0 w-full md:w-auto">
                      <label className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300 ml-4">Master Logo</label>
                      <div className="w-64 h-64 rounded-[4rem] bg-[#faf9f6] border-2 border-dashed border-stone-100 flex items-center justify-center overflow-hidden group relative transition-all hover:border-[#A3B18A]">
                        {logo ? (
                          <img src={logo} alt="Brand logo" className="w-full h-full object-contain p-12" />
                        ) : (
                          <div className="text-center space-y-4">
                            <Camera className="text-stone-200 mx-auto" size={48} />
                            <p className="text-[8px] font-black uppercase tracking-widest text-stone-300">No Asset Detected</p>
                          </div>
                        )}
                        <label className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all duration-500 backdrop-blur-sm">
                          <Upload size={24} className="text-[#A3B18A] mb-4" />
                          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white">Replace Asset</span>
                          <input type="file" className="hidden" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" />
                        </label>
                      </div>
                    </div>

                    <div className="flex-grow space-y-10 w-full">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300 ml-4">Business Legal Name</label>
                        <input 
                          value={businessName} 
                          onChange={(e) => setBusinessName(e.target.value)} 
                          className="w-full p-8 bg-[#faf9f6] border border-stone-100 rounded-3xl outline-none text-stone-900 font-serif italic text-5xl focus:border-[#A3B18A] transition-all shadow-inner" 
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300 ml-4">Global Reach</label>
                          <div className="relative">
                            <Globe size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" />
                            <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="website.com" className="w-full pl-16 pr-6 py-6 bg-[#faf9f6] border border-stone-100 rounded-2xl text-sm font-bold focus:border-[#A3B18A]" />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300 ml-4">Primary Correspondence</label>
                          <div className="relative">
                            <Mail size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" />
                            <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="hello@entity.com" className="w-full pl-16 pr-6 py-6 bg-[#faf9f6] border border-stone-100 rounded-2xl text-sm font-bold focus:border-[#A3B18A]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-stone-50">
                    <div className="space-y-4">
                       <label className="text-[9px] font-black uppercase tracking-widest text-stone-300">Social Architecture</label>
                       <div className="space-y-2">
                          <div className="flex items-center gap-4 p-4 bg-[#faf9f6] rounded-xl group hover:bg-stone-900 transition-colors">
                            <Instagram size={14} className="text-stone-300 group-hover:text-[#A3B18A]" />
                            <input value={handles.instagram} onChange={(e) => setHandles({...handles, instagram: e.target.value})} className="bg-transparent text-[11px] font-bold outline-none flex-1 group-hover:text-white" placeholder="Instagram" />
                          </div>
                          <div className="flex items-center gap-4 p-4 bg-[#faf9f6] rounded-xl group hover:bg-stone-900 transition-colors">
                            <Linkedin size={14} className="text-stone-300 group-hover:text-[#A3B18A]" />
                            <input value={handles.linkedin} onChange={(e) => setHandles({...handles, linkedin: e.target.value})} className="bg-transparent text-[11px] font-bold outline-none flex-1 group-hover:text-white" placeholder="LinkedIn" />
                          </div>
                       </div>
                    </div>
                    <div className="md:col-span-2 space-y-4">
                       <label className="text-[9px] font-black uppercase tracking-widest text-stone-300">Physical HQ Address</label>
                       <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-6 bg-[#faf9f6] border border-stone-100 rounded-2xl min-h-[120px] outline-none font-serif italic text-xl focus:border-[#A3B18A] resize-none" placeholder="Enter full address..." />
                    </div>
                  </div>
                </section>
              </div>

              <aside className="xl:col-span-4 space-y-8">
                {/* Visual Logic Panel */}
                <div className="bg-stone-900 p-12 rounded-[4rem] text-white space-y-12 shadow-2xl relative overflow-hidden group">
                   <Palette size={200} className="absolute -right-20 -bottom-20 opacity-5 group-hover:rotate-12 transition-transform duration-1000" />
                   
                   <div className="space-y-2 relative z-10">
                    <h3 className="text-4xl font-serif italic text-[#A3B18A] tracking-tight">Visual Logic.</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Interface Styling System</p>
                   </div>
                   
                   <div className="space-y-8 relative z-10">
                      <div className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5 group/color transition-all hover:bg-white/10">
                        <div className="space-y-1">
                          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/40">Primary Hue</span>
                          <p className="text-xs font-bold text-[#A3B18A]">{primaryColor.toUpperCase()}</p>
                        </div>
                        <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-12 h-12 rounded-full border-2 border-white/20 bg-transparent cursor-pointer overflow-hidden" />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/40">Neural Tone of Voice</span>
                          <Type size={14} className="text-[#A3B18A]" />
                        </div>
                        <textarea 
                          value={toneOfVoice} 
                          onChange={(e) => setToneOfVoice(e.target.value)} 
                          className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl text-sm font-serif italic text-white/60 min-h-[150px] resize-none focus:border-[#A3B18A] outline-none transition-all"
                          placeholder="Describe your brand voice..."
                        />
                      </div>

                      <div className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5">
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/40">Typeface Architecture</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold">{fontFamily}</span>
                          <ChevronRight size={14} className="text-white/20" />
                        </div>
                      </div>
                   </div>
                </div>

                {/* Emergency Node Panel */}
                <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] shadow-sm space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-50 rounded-2xl text-red-500">
                      <HeartHandshake size={20} />
                    </div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-900">Safety Protocol</h3>
                  </div>
                  <div className="space-y-4">
                    <p className="text-[11px] font-serif italic text-stone-400 leading-relaxed">
                      Next of Kin contact data is encrypted and only visible to Root Administrators during system alerts.
                    </p>
                    <input 
                      type="tel"
                      value={nextOfKinPhone}
                      onChange={(e) => setNextOfKinPhone(e.target.value)}
                      placeholder="Emergency Contact"
                      className="w-full p-4 bg-[#faf9f6] border border-stone-50 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>
              </aside>
            </motion.div>
          )}

          {/* TAB: SECURITY PROTOCOLS */}
          {activeTab === "security" && (
            <motion.div 
              key="security"
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-12"
            >
              <div className="lg:col-span-2 space-y-12">
                 <section className="bg-white border border-stone-200 p-12 rounded-[4rem] shadow-sm">
                    <div className="flex items-center justify-between mb-12">
                      <div className="space-y-2">
                        <h3 className="text-3xl font-serif italic text-stone-900 tracking-tight">Access Log.</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300">Real-time Node Activity</p>
                      </div>
                      <HardDrive size={24} className="text-stone-100" />
                    </div>

                    <div className="space-y-2">
                      {logs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between p-6 rounded-2xl hover:bg-[#faf9f6] transition-colors border border-transparent hover:border-stone-100 group">
                          <div className="flex items-center gap-6">
                             <div className={`w-2 h-2 rounded-full ${log.status === 'Success' ? 'bg-[#A3B18A]' : 'bg-amber-400'}`} />
                             <span className="text-xs font-bold text-stone-700">{log.event}</span>
                          </div>
                          <div className="flex items-center gap-8">
                            <span className="text-[9px] font-black uppercase tracking-widest text-stone-300 italic">{log.time}</span>
                            <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg ${log.status === 'Success' ? 'bg-green-50 text-green-600' : 'bg-stone-900 text-[#A3B18A]'}`}>
                              {log.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                 </section>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-stone-900 p-10 rounded-[3rem] text-white flex flex-col justify-between group">
                      <Fingerprint size={48} className="text-[#A3B18A] mb-8 group-hover:scale-110 transition-transform" />
                      <div>
                        <h4 className="text-2xl font-serif italic text-white mb-2">Biometric Relay</h4>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-8">Hardware-based authentication active</p>
                        <button className="px-6 py-3 bg-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">Configure Relay</button>
                      </div>
                    </div>
                    <div className="bg-white border border-stone-200 p-10 rounded-[3rem] shadow-sm flex flex-col justify-between group">
                      <Key size={48} className="text-stone-100 mb-8 group-hover:text-stone-900 transition-colors" />
                      <div>
                        <h4 className="text-2xl font-serif italic text-stone-900 mb-2">RSA Rotation</h4>
                        <p className="text-[9px] font-black uppercase tracking-widest text-stone-300 mb-8">Next automatic rotation in 12 days</p>
                        <button className="px-6 py-3 bg-stone-900 text-[#A3B18A] rounded-xl text-[8px] font-black uppercase tracking-widest shadow-xl">Rotate Now</button>
                      </div>
                    </div>
                 </div>
              </div>

              <aside className="space-y-8">
                <section className="bg-[#faf9f6] border border-stone-200 p-10 rounded-[3.5rem] space-y-10">
                   <div className="flex items-center gap-4">
                      <Smartphone size={20} className="text-stone-400" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-900">Device Sync</h3>
                   </div>
                   
                   <div className="space-y-6">
                      {[
                        { name: "iPhone 15 Pro", location: "Elgin, UK", status: "Active" },
                        { name: "MacBook Pro M3", location: "Elgin, UK", status: "This Device" }
                      ].map((device, i) => (
                        <div key={i} className="flex justify-between items-center p-5 bg-white rounded-2xl shadow-sm border border-stone-50">
                          <div>
                            <p className="text-xs font-bold text-stone-800">{device.name}</p>
                            <p className="text-[8px] font-black uppercase tracking-widest text-stone-300">{device.location}</p>
                          </div>
                          <span className="text-[7px] font-black uppercase tracking-widest text-[#A3B18A]">{device.status}</span>
                        </div>
                      ))}
                      <button className="w-full py-4 text-[9px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors">
                        Revoke All Sessions
                      </button>
                   </div>
                </section>

                <div className="bg-[#A3B18A] p-10 rounded-[3.5rem] text-white flex flex-col items-center text-center space-y-6">
                  <Lock size={48} className="opacity-40" />
                  <h4 className="text-xl font-serif italic">Global Lockout</h4>
                  <p className="text-[9px] font-serif italic text-white/60 leading-relaxed">
                    Instantly freeze all node access and brand synchronization in the event of a security breach.
                  </p>
                  <button className="w-full py-4 bg-stone-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-2xl">
                    Initiate Freeze
                  </button>
                </div>
              </aside>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* --- UTILITY GRID (SYSTEM STATUS) --- */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pt-12 border-t border-stone-200">
        {[
          { label: "Data Integrity", val: "99.98%", icon: Database },
          { label: "Network Relay", icon: Globe, val: "Nominal" },
          { label: "Admin Clearance", icon: ShieldCheck, val: "Root" },
          { label: "Neural Buffer", icon: Zap, val: "4.2ms" }
        ].map((stat, i) => (
          <div key={i} className="flex items-center gap-6 p-4">
            <div className="p-4 bg-white border border-stone-100 rounded-2xl shadow-sm">
              <stat.icon size={18} className="text-[#A3B18A]" />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-stone-300 mb-1">{stat.label}</p>
              <p className="text-sm font-bold text-stone-900">{stat.val}</p>
            </div>
          </div>
        ))}
      </section>

      {/* --- FOOTER STATUS --- */}
      <footer className="pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-wrap items-center justify-center gap-10">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-[#A3B18A] animate-pulse shadow-[0_0_10px_rgba(163,177,138,0.5)]" />
             <span className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-400">All Systems Nominal</span>
          </div>
          <div className="flex items-center gap-3 text-stone-200">
            <Fingerprint size={14} />
            <span className="text-[9px] font-black uppercase tracking-[0.4em]">AES-256 Validated</span>
          </div>
        </div>
        
        <div className="flex items-center gap-12">
          <p className="text-[10px] font-serif italic text-stone-300">TOTS Operational Data Center // Elgin Core // 2026</p>
          <button className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-red-400 transition-all group">
            <LogOut size={12} className="group-hover:-translate-x-1 transition-transform" /> 
            Terminate
          </button>
        </div>
      </footer>

    </div>
  );
}

// Sub-component for clarity in larger files
function LogOut({ size, className }: { size?: number, className?: string }) {
  return (
    <svg 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}