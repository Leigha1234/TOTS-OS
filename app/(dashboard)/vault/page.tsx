"use client";

import React, { useState, useRef, useMemo, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { useSettings } from "@/app/context/SettingsContext";
import { 
  Search, Download, Folder, ChevronDown, 
  Sparkles, ShieldCheck, Activity, 
  Trash2, Save, Box, Menu, X, 
  Clock, Upload, File, Paperclip, 
  Settings, Share2, Globe, ArrowUpRight,
  Database, Eye, Lock, Layers, Plus, Hash,
  Zap, Fingerprint, Palette, Sun, Moon,
  LayoutDashboard, Calendar, Users, StickyNote,
  Megaphone, DollarSign, Briefcase, BarChart3,
  Cpu, HardDrive, LogOut, Camera, UserCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";

/**
 * TOTS OS: THE ARCHIVAL CORE
 * This module manages the dual-purpose "Command" & "Vault" architecture.
 * Designed with the "Beige & Sage" visual identity.
 */

// --- CONFIGURATION & CONSTANTS ---
const NAV_OPTIONS = [
  { id: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "/clarity", label: "Clarity AI", icon: Sparkles },
  { id: "/calendar", label: "Calendar", icon: Calendar },
  { id: "/crm", label: "CRM", icon: Users },
  { id: "/notes", label: "Notes", icon: StickyNote },
  { id: "/campaigns", label: "Campaigns", icon: Megaphone },
  { id: "/payments", label: "Finance", icon: DollarSign },
  { id: "/projects", label: "Projects", icon: Briefcase },
  { id: "/reports", label: "Reports", icon: BarChart3 },
  { id: "/social", label: "Social", icon: Globe },
  { id: "/vault", label: "Vault", icon: Lock },
];

const INITIAL_RECORDS = [
  { 
    id: "VAL-001", 
    title: "Operational Philosophy", 
    category: "Archives", 
    content: `THE SYSTEM ETHOS\n\n1. Precision over Speed.\n2. Archival Integrity over Temporary Storage.\n3. Elegance in Implementation.\n\nAll workflows must be audited monthly to ensure they align with the current growth trajectory.`,
    metadata: { lastUpdated: "2026-05-14", status: "Verified", readTime: "4m" },
    files: []
  },
  { 
    id: "VAL-102", 
    title: "Financial Ledger Logic", 
    category: "Finance", 
    content: `PAYOUT PROTOCOLS\n\n- All outgoing transactions require secondary neural verification.\n- Retain 20% of gross revenue for the "Safety Vault" logic.\n- Automate tax allocations at point of sale.`,
    metadata: { lastUpdated: "2026-05-10", status: "Permanent", readTime: "6m" },
    files: []
  }
];

// --- MAIN PAGE COMPONENT ---
export default function UniversalCommandHub() {
  return (
    <Suspense fallback={<LoadingState />}>
      <NeuralEngineContent />
    </Suspense>
  );
}

// --- LOADING COMPONENT ---
function LoadingState() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCFB] gap-6">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="w-16 h-16 rounded-full border-t-2 border-[#A3B18A] border-stone-100"
      />
      <p className="font-serif italic text-stone-400 text-lg animate-pulse">Initializing Neural Protocols...</p>
    </div>
  );
}

// --- PRIMARY CONTENT ENGINE ---
function NeuralEngineContent() {
  const router = useRouter();
  const { refreshSettings } = useSettings();
  
  // -- State: UI Controls --
  const [activeTab, setActiveTab] = useState<"COMMAND" | "VAULT">("VAULT");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // -- State: Auth & Profile --
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>({ full_name: "", phone: "", avatar_url: "" });
  const [email, setEmail] = useState("");
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // -- State: Preferences --
  const [brandColor, setBrandColor] = useState("#A3B18A");
  const [secondaryColor, setSecondaryColor] = useState("#2C2C2C");
  const [mobileNav, setMobileNav] = useState<string[]>(["/dashboard", "/clarity", "/calendar"]);
  const [bankInfo, setBankInfo] = useState({ name: "", acc: "", sort: "" });

  // -- State: Vault Data --
  const [vaultData, setVaultData] = useState(INITIAL_RECORDS);
  const [selectedRecordId, setSelectedRecordId] = useState(INITIAL_RECORDS[0].id);
  const [searchTerm, setSearchTerm] = useState("");

  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -- Computed Values --
  const currentRecord = useMemo(() => 
    vaultData.find(r => r.id === selectedRecordId) || vaultData[0]
  , [selectedRecordId, vaultData]);

  const categories = useMemo(() => 
    Array.from(new Set(vaultData.map(r => r.category)))
  , [vaultData]);

  // -- Lifecycle: Initialization --
  useEffect(() => {
    setIsMounted(true);
    const initSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      setUser(user);
      setEmail(user.email || "");

      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (p) {
        setProfile(p);
        if (p.brand_color) setBrandColor(p.brand_color);
        if (p.mobile_nav_config) setMobileNav(p.mobile_nav_config);
      }

      const { data: team } = await supabase.from("team_members").select("team_id").eq("user_id", user.id).maybeSingle();
      if (team?.team_id) {
        setTeamId(team.team_id);
        const { data: members } = await supabase.from("team_members").select("*").eq("team_id", team.team_id);
        if (members) setTeamMembers(members);
      }
    };
    initSession();
  }, [router]);

  // -- Handlers: Configuration --
  const toggleMobileNavItem = (id: string) => {
    setMobileNav(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const handleGlobalSync = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        full_name: profile.full_name,
        brand_color: brandColor,
        mobile_nav_config: mobileNav
      }).eq("id", user.id);
      
      if (error) throw error;
      await refreshSettings();
      toast.success("Neural Configuration Synchronized");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current);
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297);
    pdf.save(`ARCHIVE_${currentRecord.id}.pdf`);
  };

  if (!isMounted) return null;

  return (
    <div className={`min-h-screen flex transition-colors duration-1000 selection:bg-[#A3B18A] selection:text-white ${isDarkMode ? 'bg-[#121212] text-stone-200' : 'bg-[#FDFCFB] text-[#2C2C2C]'}`}>
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        :root { --brand-primary: ${brandColor}; }
      `}</style>

      {/* 1. PRIMARY NAVIGATION SIDEBAR */}
      <aside className={`h-screen bg-white/40 backdrop-blur-3xl border-r border-stone-50 transition-all duration-700 flex flex-col p-8 z-[100] ${sidebarCollapsed ? 'w-24' : 'w-80'}`}>
        <div className="flex items-center gap-4 mb-16 px-2">
          <div className="w-2 h-2 rounded-full bg-[#A3B18A] animate-pulse shadow-[0_0_10px_rgba(163,177,138,0.5)]" />
          {!sidebarCollapsed && <span className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-300">Tots OS Hub</span>}
        </div>

        <nav className="flex-1 space-y-12 overflow-y-auto no-scrollbar">
          {/* TAB SWITCHER */}
          <div className="space-y-4">
             {!sidebarCollapsed && <p className="text-[9px] font-black text-stone-200 uppercase tracking-widest ml-2">Operation Mode</p>}
             <div className={`flex flex-col gap-2`}>
                {[
                  { id: "VAULT", icon: Lock, label: "Archive Vault" },
                  { id: "COMMAND", icon: Zap, label: "System Command" }
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-500 ${activeTab === tab.id ? 'bg-stone-900 text-white shadow-xl' : 'text-stone-300 hover:text-stone-900'}`}
                  >
                    <tab.icon size={18} />
                    {!sidebarCollapsed && <span className="text-[11px] font-bold uppercase tracking-wider">{tab.label}</span>}
                  </button>
                ))}
             </div>
          </div>

          {/* DYNAMIC CONTENT: VAULT INDEX */}
          {activeTab === "VAULT" && !sidebarCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pt-10 border-t border-stone-50">
              {categories.map(cat => (
                <div key={cat} className="space-y-4">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-[#A3B18A]">{cat}</h3>
                  <div className="space-y-1">
                    {vaultData.filter(r => r.category === cat).map(r => (
                      <button 
                        key={r.id}
                        onClick={() => setSelectedRecordId(r.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl text-[11px] transition-all ${selectedRecordId === r.id ? 'bg-white shadow-sm text-stone-900 font-bold' : 'text-stone-400 hover:text-stone-600'}`}
                      >
                        {r.title}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button className="flex items-center gap-3 text-stone-300 hover:text-[#A3B18A] transition-colors text-[10px] font-black uppercase tracking-widest pl-2">
                <Plus size={14} /> New Record
              </button>
            </motion.div>
          )}
        </nav>

        {/* PROFILE MINI-CARD */}
        <div className="pt-8 border-t border-stone-50 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#A3B18A]/10 flex items-center justify-center italic font-serif text-stone-400 border border-[#A3B18A]/5">
            {profile.full_name?.charAt(0) || "L"}
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-stone-900">{profile.full_name || "Authorized User"}</span>
              <button onClick={() => setSidebarCollapsed(true)} className="text-[8px] font-black text-stone-200 uppercase tracking-widest hover:text-[#A3B18A]">Minimize</button>
            </div>
          )}
          {sidebarCollapsed && <button onClick={() => setSidebarCollapsed(false)} className="p-2"><ArrowUpRight size={14} className="text-stone-200" /></button>}
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* GLOBAL HEADER (GHOST) */}
        <header className="h-24 px-16 flex items-center justify-between shrink-0 relative z-50">
          <div className="flex items-center gap-6">
             <div className="hidden sm:flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-[#A3B18A]/30" />
               <span className="text-[9px] font-black text-stone-300 uppercase tracking-[0.4em]">Latency: 14ms</span>
             </div>
          </div>
          
          <div className="flex items-center gap-6">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-4 text-stone-300 hover:text-[#A3B18A] transition-all">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              onClick={activeTab === "VAULT" ? handleExportPDF : handleGlobalSync}
              className="px-10 py-4 bg-stone-900 text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-stone-200/50 hover:bg-[#A3B18A] transition-all active:scale-95 flex items-center gap-3"
            >
              {isSaving ? <Clock className="animate-spin" size={14} /> : <Fingerprint size={14} />}
              {activeTab === "VAULT" ? "Export Record" : "Sync Changes"}
            </button>
          </div>
        </header>

        {/* DYNAMIC WORKSPACE */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative px-10 sm:px-20 pb-32">
          
          <AnimatePresence mode="wait">
            {activeTab === "VAULT" ? (
              <motion.div 
                key="vault-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.6 }}
                className="max-w-5xl mx-auto"
              >
                {/* VAULT EDITOR UI */}
                <div ref={printRef} className="mt-8 bg-white rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.02)] p-16 sm:p-24 min-h-[110vh] flex flex-col relative">
                  <div className="mb-20">
                    <span className="text-[10px] font-black text-[#A3B18A] uppercase tracking-[0.6em] block mb-4">Neural Archive // {currentRecord.id}</span>
                    <h1 className="text-6xl sm:text-8xl font-serif italic text-stone-900 tracking-tighter leading-tight">
                      {currentRecord.title}
                    </h1>
                  </div>

                  <textarea 
                    className="flex-1 w-full text-xl sm:text-2xl font-serif italic leading-[1.8] text-stone-600 outline-none resize-none bg-transparent placeholder-stone-200"
                    value={currentRecord.content}
                    onChange={(e) => setVaultData(prev => prev.map(r => r.id === selectedRecordId ? {...r, content: e.target.value} : r))}
                    spellCheck={false}
                  />

                  <div className="mt-20 pt-10 border-t border-stone-50 flex justify-between items-end">
                     <div className="space-y-4">
                        <p className="text-[9px] font-black uppercase text-stone-200 tracking-widest">Metadata</p>
                        <div className="flex gap-8">
                           <div className="flex flex-col">
                              <span className="text-[8px] font-black text-stone-300 uppercase">Integrity</span>
                              <span className="text-[11px] font-bold text-stone-500 italic">verified_v2</span>
                           </div>
                           <div className="flex flex-col">
                              <span className="text-[8px] font-black text-stone-300 uppercase">Read Time</span>
                              <span className="text-[11px] font-bold text-stone-500 italic">{currentRecord.metadata.readTime}</span>
                           </div>
                        </div>
                     </div>
                     <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 text-[#A3B18A] hover:text-stone-900 transition-colors">
                        <Paperclip size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Link Media Node</span>
                     </button>
                     <input type="file" ref={fileInputRef} className="hidden" />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="command-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.6 }}
                className="max-w-6xl mx-auto space-y-24 pt-12"
              >
                {/* COMMAND CENTER UI */}
                <div className="space-y-8">
                  <h2 className="text-8xl font-serif italic text-stone-900 tracking-tighter">Command.</h2>
                  <p className="text-[11px] font-black text-stone-300 uppercase tracking-[0.6em]">System Logical Configuration</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
                  
                  {/* LEFT: IDENTITY & AESTHETIC */}
                  <div className="lg:col-span-4 space-y-16">
                    <section className="bg-white p-12 rounded-[4rem] shadow-sm border border-stone-50 space-y-10">
                      <div className="flex flex-col items-center gap-8">
                        <div className="relative group w-40 h-40 rounded-[3rem] bg-[#F9F8F6] flex items-center justify-center overflow-hidden border border-stone-100 transition-all hover:rotate-2">
                           <UserCircle size={48} className="text-stone-200" />
                           <label className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-black uppercase tracking-widest cursor-pointer">
                             <Camera size={20} className="mb-2" /> Change Image
                             <input type="file" className="hidden" />
                           </label>
                        </div>
                        <input 
                          value={profile.full_name} 
                          onChange={e => setProfile({...profile, full_name: e.target.value})}
                          className="text-center font-serif italic text-4xl w-full bg-transparent outline-none text-stone-900" 
                          placeholder="Subject Identity"
                        />
                      </div>
                      <button className="w-full py-5 rounded-2xl border border-stone-100 text-[10px] font-black uppercase tracking-widest text-stone-300 hover:text-red-400 hover:bg-red-50 transition-all">
                        Terminate Session
                      </button>
                    </section>

                    <section className="bg-white p-12 rounded-[4rem] shadow-sm border border-stone-50 space-y-8">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-900 flex items-center gap-3">
                        <Palette size={16} className="text-[#A3B18A]"/> Aesthetic DNA
                      </h3>
                      <div className="flex items-center justify-between p-4 bg-[#F9F8F6] rounded-3xl">
                        <span className="text-[11px] font-bold text-stone-500 uppercase">Primary Tone</span>
                        <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-10 h-10 rounded-xl cursor-pointer border-none bg-transparent" />
                      </div>
                    </section>
                  </div>

                  {/* RIGHT: ARCHITECTURE & NETWORK */}
                  <div className="lg:col-span-8 space-y-20">
                    
                    {/* HUB ARCHITECTURE */}
                    <section className="space-y-10">
                      <div className="flex justify-between items-end">
                        <div className="space-y-2">
                          <h4 className="text-4xl font-serif italic text-stone-900 tracking-tighter leading-none">Architecture.</h4>
                          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-stone-200">Neural Hub Config</p>
                        </div>
                        <span className="text-[10px] font-black text-[#A3B18A] uppercase tracking-widest">{mobileNav.length} / 3 Active</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {NAV_OPTIONS.map(opt => {
                          const isSelected = mobileNav.includes(opt.id);
                          return (
                            <button 
                              key={opt.id}
                              onClick={() => toggleMobileNavItem(opt.id)}
                              className={`flex flex-col items-center gap-4 p-8 rounded-[2.5rem] transition-all duration-500 border ${isSelected ? 'bg-stone-900 text-white border-transparent shadow-2xl scale-[1.02]' : 'bg-white border-stone-100 text-stone-300 hover:text-stone-600'}`}
                            >
                              <opt.icon size={24} strokeWidth={1.2} />
                              <span className="text-[9px] font-black uppercase tracking-widest text-center">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    {/* TEAM NETWORK */}
                    <section className="space-y-10">
                      <div className="flex justify-between items-end">
                        <h4 className="text-4xl font-serif italic text-stone-900 tracking-tighter">The Network.</h4>
                        <button onClick={() => router.push('/team')} className="text-[10px] font-black uppercase tracking-widest text-[#A3B18A] flex items-center gap-2">
                          Manage Nodes <ArrowUpRight size={14} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="bg-white p-10 rounded-[3.5rem] border border-stone-50 space-y-6">
                          <p className="text-[9px] font-black uppercase tracking-widest text-stone-200">Authorized Nodes</p>
                          <div className="space-y-3">
                            {teamMembers.slice(0, 3).map(m => (
                              <div key={m.id} className="flex justify-between items-center p-5 bg-[#FDFCFB] rounded-[2rem] border border-stone-50">
                                <span className="text-[11px] font-bold text-stone-600 italic">{m.email}</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-[#A3B18A]/40" />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-stone-900 p-10 rounded-[3.5rem] text-white flex flex-col justify-between relative overflow-hidden group">
                           <Activity size={100} className="absolute -right-8 -bottom-8 opacity-5 group-hover:rotate-12 transition-transform duration-1000" />
                           <h5 className="text-2xl font-serif italic text-[#A3B18A]">Relay Invite.</h5>
                           <div className="space-y-4 relative z-10">
                             <input className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl text-[11px] outline-none focus:border-[#A3B18A]" placeholder="Subject Email..." />
                             <button className="w-full py-4 bg-[#A3B18A] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-stone-900 transition-all">Dispatch</button>
                           </div>
                        </div>
                      </div>
                    </section>

                    {/* SECURE LEDGER */}
                    <section className="bg-white p-16 rounded-[4.5rem] shadow-2xl border border-stone-50 space-y-12">
                       <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <h4 className="text-5xl font-serif italic text-stone-900 tracking-tighter">Ledger Protocol.</h4>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300">Secure Vault Payout Data</p>
                          </div>
                          <Lock size={32} className="text-[#A3B18A]/20" />
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {[
                            { label: "Bank Institution", icon: <Globe size={14}/>, val: bankInfo.name, key: "name" },
                            { label: "Account ID", icon: <HardDrive size={14}/>, val: bankInfo.acc, key: "acc" },
                            { label: "Routing Key", icon: <Zap size={14}/>, val: bankInfo.sort, key: "sort" }
                          ].map(field => (
                            <div key={field.key} className="space-y-3">
                              <label className="text-[9px] font-black uppercase tracking-widest text-stone-200 ml-2 flex items-center gap-2">
                                {field.icon} {field.label}
                              </label>
                              <input 
                                value={field.val}
                                onChange={e => setBankInfo({...bankInfo, [field.key]: e.target.value})}
                                className="w-full p-6 bg-[#F9F8F6] border border-transparent rounded-[2rem] text-[12px] font-mono outline-none focus:border-[#A3B18A] transition-all"
                                placeholder="#### ####"
                              />
                            </div>
                          ))}
                       </div>
                    </section>

                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* 3. CONTEXTUAL RIGHT SIDEBAR (MINIMAL) */}
        <aside className="fixed right-0 top-0 h-full w-16 hover:w-80 bg-white/60 backdrop-blur-2xl border-l border-stone-50 transition-all duration-700 group/ctx z-[150] overflow-hidden">
           <div className="p-8 flex flex-col h-full items-center group-hover/ctx:items-start">
              <div className="mb-16">
                 <ShieldCheck size={20} className="text-stone-200 group-hover/ctx:text-[#A3B18A] transition-colors" />
              </div>

              <div className="flex-1 opacity-0 group-hover/ctx:opacity-100 transition-all duration-700 delay-100 space-y-16">
                 <section className="space-y-8">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300">Live Telemetry</h5>
                    <div className="space-y-6">
                       <div className="flex justify-between items-end">
                          <span className="text-[11px] font-serif italic text-stone-400">Sync Status</span>
                          <span className="text-[10px] font-black text-[#A3B18A] uppercase">Active</span>
                       </div>
                       <div className="w-full h-[2px] bg-stone-50 relative overflow-hidden">
                          <motion.div 
                            animate={{ x: [-100, 300] }} 
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 w-20 bg-[#A3B18A]" 
                          />
                       </div>
                       <div className="flex justify-between items-end">
                          <span className="text-[11px] font-serif italic text-stone-400">Node Stability</span>
                          <span className="text-[10px] font-black text-stone-500 uppercase">99.2%</span>
                       </div>
                    </div>
                 </section>

                 <section className="p-8 bg-[#A3B18A]/5 rounded-[3rem] border border-[#A3B18A]/10 space-y-4">
                    <Database size={20} className="text-[#A3B18A]" />
                    <h6 className="text-2xl font-serif italic text-stone-800 tracking-tighter leading-none">Archive Logic.</h6>
                    <p className="text-[11px] text-stone-400 font-serif italic leading-relaxed">
                       Records within this vault are protected by decentralized encryption protocols. Modification is logged in the permanent ledger.
                    </p>
                    <button className="text-[9px] font-black uppercase tracking-widest text-[#A3B18A] pt-4 flex items-center gap-2 hover:translate-x-1 transition-transform">
                       Audit History <ArrowUpRight size={12} />
                    </button>
                 </section>
              </div>

              <div className="mt-auto flex flex-col items-center group-hover/ctx:items-start gap-4">
                 <div className="w-10 h-10 rounded-full bg-stone-900 flex items-center justify-center text-white italic font-serif text-sm">L</div>
                 {!sidebarCollapsed && <span className="hidden group-hover/ctx:block text-[9px] font-black uppercase tracking-widest text-stone-200">Terminal Access</span>}
              </div>
           </div>
        </aside>

      </main>

      {/* FOOTER: SYSTEM STATUS LINE */}
      <footer className="fixed bottom-0 left-0 w-full h-12 bg-white/40 backdrop-blur-xl border-t border-stone-50 px-10 flex items-center justify-between z-[200]">
         <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
               <div className="w-1 h-1 rounded-full bg-[#A3B18A] shadow-[0_0_5px_#A3B18A]" />
               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-300">System Nominal</span>
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-200">v4.1.0-Archival</span>
         </div>
         <div className="flex items-center gap-6">
            <span className="text-[10px] font-serif italic text-stone-400">Archival Date: {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
         </div>
      </footer>
    </div>
  );
}