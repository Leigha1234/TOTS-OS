"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client"; 
import { useSettings } from "@/app/context/SettingsContext";
import { 
  Globe, Mail, Upload, ArrowLeft, 
  Check, Loader2, Type, HeartHandshake,
  ShieldCheck, Palette, Fingerprint, Database, 
  Users, Plus, ChevronRight, Camera, Shield, Clock,
  Instagram, Linkedin, Trash2, Edit3, 
  Zap, HardDrive, Filter, Search,
  Key, Smartphone, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

/**
 * TOTS OS: INTEGRATED TEAM & BRAND ARCHITECTURE v7.0
 * Features: Node Management, Brand DNA Propagation, Security Protocols
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

  // -- Brand & Identity State (Linked to Global Settings) --
  const [teamId, setTeamId] = useState<string | null>(null);
  const [logo, setLogo] = useState("");
  const [businessName, setBusinessName] = useState("The Apprentice Store");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#A3B18A");
  const [toneOfVoice, setToneOfVoice] = useState("Professional, yet empathetic.");
  const [handles, setHandles] = useState({ instagram: "", linkedin: "" });
  const [nextOfKinPhone, setNextOfKinPhone] = useState("");

  // -- Team Node State --
  const [teamMembers] = useState([
    { id: "1", name: "David", role: "Manager", status: "Active", clearance: "Level 4", lastSeen: "2h ago" },
    { id: "2", name: "Leigha Day-Clark", role: "Root Admin", status: "Active", clearance: "Level 5", lastSeen: "Now" },
    { id: "3", name: "Ryan McKenna", role: "Developer", status: "Idle", clearance: "Level 3", lastSeen: "5h ago" },
    { id: "4", name: "System Node", role: "Automation", status: "Active", clearance: "Level 5", lastSeen: "Continuous" }
  ]);

  // -- Lifecycle: Sync Clock & Init --
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
          setBusinessName(s.business_name || "The Apprentice Store");
          setAddress(s.address || "");
          setWebsite(s.social_links?.website || "");
          setContactEmail(s.contact_email || "");
          setPrimaryColor(s.brand_color || "#A3B18A");
          setHandles(s.social_links || { instagram: "", linkedin: "" });
          setToneOfVoice(s.tone_of_voice || "Professional, yet empathetic.");
          setNextOfKinPhone(s.next_of_kin_phone || "");
        }
      }
    } catch (err) {
      console.error("Load Failure:", err);
      toast.error("Architecture Synced with Errors");
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("settings").upsert({
        team_id: teamId,
        logo_url: logo, 
        business_name: businessName, 
        address, 
        contact_email: contactEmail, 
        brand_color: primaryColor,
        social_links: { ...handles, website }, 
        tone_of_voice: toneOfVoice,
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

  if (loading) return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center gap-6">
      <Loader2 className="animate-spin text-[#A3B18A]" size={48} />
      <p className="font-black uppercase tracking-[0.6em] text-[#A3B18A] text-[10px]">Provisioning Hub</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-4 md:p-8 lg:p-12 space-y-8 md:space-y-12 max-w-[1800px] mx-auto font-sans">
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&family=Inter:wght@300;400;700;900&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* --- INTEGRATED HEADER --- */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end border-b border-stone-200 pb-10 gap-8">
        <div className="space-y-6 w-full xl:w-auto">
          <div className="flex flex-wrap items-center gap-6 text-[#A3B18A]">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-stone-100 shadow-sm">
              <Shield size={12} fill="currentColor" />
              <p className="font-black uppercase text-[9px] tracking-[0.4em]">Node: {businessName}</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 text-stone-300">
              <Clock size={12} />
              <p className="font-black uppercase text-[9px] tracking-[0.4em]">
                {currentTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || "--:--"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter leading-none text-stone-900">
              Team Hub
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-300 ml-2">Identity & Node Management</p>
          </div>
          
          <nav className="flex flex-wrap items-center gap-3 pt-6">
            <button onClick={() => setActiveTab("team")} className={`flex items-center gap-4 px-8 py-4 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === "team" ? "bg-stone-900 text-white shadow-2xl" : "bg-white border border-stone-100 text-stone-300"}`}>
              <Users size={14} /> Nodes
            </button>
            <button onClick={() => setActiveTab("brand")} className={`flex items-center gap-4 px-8 py-4 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === "brand" ? "bg-stone-900 text-white shadow-2xl" : "bg-white border border-stone-100 text-stone-300"}`}>
              <Palette size={14} /> Brand DNA
            </button>
            <button onClick={() => setActiveTab("security")} className={`flex items-center gap-4 px-8 py-4 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === "security" ? "bg-stone-900 text-white shadow-2xl" : "bg-white border border-stone-100 text-stone-300"}`}>
              <ShieldCheck size={14} /> Security
            </button>
          </nav>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
          <button onClick={() => router.push('/settings')} className="group w-full sm:w-auto px-10 py-5 rounded-[2rem] border border-stone-100 bg-white text-stone-400 hover:text-stone-900 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3">
            <ArrowLeft size={14} /> General Settings
          </button>
          <motion.button whileHover={{ scale: 1.02 }} onClick={handleSave} disabled={saving} className="w-full sm:w-auto flex items-center justify-center gap-4 bg-[#A3B18A] px-12 py-5 rounded-[2rem] shadow-xl hover:brightness-110 transition-all disabled:opacity-50">
            {saving ? <Loader2 className="animate-spin text-white" size={18} /> : <Database className="text-white" size={18} />}
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Commit Changes</span>
          </motion.button>
        </div>
      </header>

      {/* --- MAIN INTERFACE --- */}
      <main className="min-h-[600px]">
        <AnimatePresence mode="wait">
          
          {/* TAB: NODES */}
          {activeTab === "team" && (
            <motion.div key="team" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-[2.5rem] border border-stone-100">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={16} />
                  <input type="text" placeholder="Filter nodes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-[#faf9f6] border border-stone-50 rounded-2xl text-xs font-bold outline-none" />
                </div>
                <button className="flex items-center gap-3 px-8 py-4 bg-stone-900 text-[#A3B18A] rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl">
                  <Plus size={14} /> Provision New Node
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                {teamMembers.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase())).map((member, i) => (
                  <motion.div key={member.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="bg-white border border-stone-200 p-10 rounded-[3.5rem] shadow-sm group hover:border-[#A3B18A] transition-all duration-500">
                    <div className="flex justify-between items-start mb-12">
                       <div className="w-16 h-16 rounded-[2rem] bg-[#faf9f6] flex items-center justify-center text-2xl font-serif italic text-stone-200 group-hover:bg-stone-900 group-hover:text-[#A3B18A] transition-all">
                         {member.name.charAt(0)}
                       </div>
                       <div className="text-right">
                          <div className={`px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest border ${member.status === 'Active' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                             {member.status}
                          </div>
                       </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-2xl font-serif italic text-stone-900">{member.name}</h3>
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#A3B18A] mt-1">{member.role}</p>
                      </div>
                      <div className="pt-6 border-t border-stone-50 flex items-center justify-between text-stone-300">
                        <span className="text-[8px] font-black uppercase tracking-widest">{member.clearance}</span>
                        <ChevronRight size={14} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB: BRAND DNA */}
          {activeTab === "brand" && (
            <motion.div key="brand" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-7 space-y-12">
                <section className="bg-white border border-stone-200 p-12 rounded-[4rem] shadow-sm space-y-12">
                  <div className="flex flex-col md:flex-row gap-12">
                    <div className="space-y-4 shrink-0">
                      <label className="text-[9px] font-black uppercase tracking-widest text-stone-300 ml-4">Brand Asset</label>
                      <div className="w-48 h-48 rounded-[3.5rem] bg-[#faf9f6] border-2 border-dashed border-stone-100 flex items-center justify-center overflow-hidden group relative transition-all hover:border-[#A3B18A]">
                        <Camera className="text-stone-100" size={32} />
                        <label className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                          <Upload size={20} className="text-[#A3B18A]" />
                          <input type="file" className="hidden" ref={fileInputRef} accept="image/*" />
                        </label>
                      </div>
                    </div>
                    <div className="flex-grow space-y-8">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-stone-300 ml-4">Business Title</label>
                        <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="w-full p-6 bg-[#faf9f6] border border-stone-50 rounded-2xl font-serif italic text-4xl outline-none" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-stone-300 ml-4">HQ Website</label>
                          <input value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full p-4 bg-[#faf9f6] border border-stone-50 rounded-xl text-xs font-bold" placeholder="website.com" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-stone-300 ml-4">Root Email</label>
                          <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full p-4 bg-[#faf9f6] border border-stone-50 rounded-xl text-xs font-bold" placeholder="hello@entity.com" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-stone-300 ml-4">Physical Address</label>
                    <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-6 bg-[#faf9f6] border border-stone-50 rounded-3xl min-h-[100px] outline-none font-serif italic text-xl resize-none" />
                  </div>
                </section>
              </div>

              <aside className="lg:col-span-5 space-y-8">
                <div className="bg-stone-900 p-12 rounded-[4rem] text-white space-y-10 relative overflow-hidden group">
                   <div className="flex items-center gap-4 relative z-10">
                      <Palette size={20} className="text-[#A3B18A]" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">Visual Logic</h3>
                   </div>
                   <div className="space-y-8 relative z-10">
                      <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between">
                         <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Accent Hue</span>
                         <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-12 h-12 rounded-full border-none bg-transparent cursor-pointer" />
                      </div>
                      <div className="space-y-4">
                        <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Tone of Voice</span>
                        <textarea value={toneOfVoice} onChange={(e) => setToneOfVoice(e.target.value)} className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl text-sm font-serif italic text-white/60 min-h-[120px] resize-none focus:border-[#A3B18A] outline-none" />
                      </div>
                   </div>
                </div>
                <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] space-y-6">
                  <div className="flex items-center gap-4">
                    <HeartHandshake size={20} className="text-red-400" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">Safety Protocol</h3>
                  </div>
                  <input type="tel" value={nextOfKinPhone} onChange={(e) => setNextOfKinPhone(e.target.value)} placeholder="Emergency Contact" className="w-full p-4 bg-[#faf9f6] border border-stone-50 rounded-xl text-xs font-bold" />
                </div>
              </aside>
            </motion.div>
          )}

          {/* TAB: SECURITY */}
          {activeTab === "security" && (
            <motion.div key="security" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 bg-white border border-stone-200 p-12 rounded-[4rem] shadow-sm">
                <div className="flex items-center justify-between mb-12">
                  <div className="space-y-2">
                    <h3 className="text-3xl font-serif italic text-stone-900 tracking-tight">System Logs.</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300">Access History</p>
                  </div>
                  <HardDrive size={24} className="text-stone-100" />
                </div>
                <div className="space-y-4">
                  {[
                    { event: "Node Rotation", time: "2h ago", status: "Success" },
                    { event: "RSA Refresh", time: "14h ago", status: "Success" },
                    { event: "Cloud Sync", time: "1d ago", status: "Nominal" }
                  ].map((log, i) => (
                    <div key={i} className="flex items-center justify-between p-6 rounded-2xl hover:bg-[#faf9f6] transition-colors border border-transparent hover:border-stone-100">
                      <div className="flex items-center gap-4">
                         <div className="w-2 h-2 rounded-full bg-[#A3B18A]" />
                         <span className="text-xs font-bold text-stone-700">{log.event}</span>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-stone-300 italic">{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-8">
                 <div className="bg-stone-900 p-10 rounded-[3rem] text-white flex flex-col justify-between group">
                    <Fingerprint size={48} className="text-[#A3B18A] mb-8" />
                    <div>
                      <h4 className="text-2xl font-serif italic text-white mb-2">Auth Relay</h4>
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-8">Biometric verification enabled</p>
                      <button className="px-6 py-3 bg-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">Configure</button>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* --- FOOTER --- */}
      <footer className="pt-8 flex justify-between items-center border-t border-stone-200">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#A3B18A] animate-pulse" />
          <span className="text-[8px] font-black uppercase tracking-widest text-stone-300">Core Node Elgin Operational</span>
        </div>
        <p className="text-[10px] font-serif italic text-stone-300">TOTS Operating System // 2026</p>
      </footer>

    </div>
  );
}