"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  User, Users, RefreshCcw, Save, 
  Camera, Palette, ShieldCheck, 
  Fingerprint, Key, ChevronRight, 
  Database, Link, ArrowUpRight, 
  Zap, Clock, Loader2, X, 
  CheckSquare, Smartphone, LogOut,
  Mail, Lock, Globe, Layers, Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

/**
 * TOTS OS: COMMAND CENTER v5.0
 * Aesthetic: Organic Minimalist (Sage & Stone)
 * Architecture: Top-Nav Centric / Full-Page Scroll
 */

export default function SettingsArchitecture() {
  const [userName, setUserName] = useState<string>("LEIGHA DAY-CLARK");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"identity" | "team" | "migration">("identity");
  const [isSaving, setIsSaving] = useState(false);

  // -- Lifecycle --
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // -- Handlers --
  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsSaving(false);
    toast.success("System Logic Synchronized");
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-4 md:p-8 lg:p-12 space-y-8 md:space-y-12 max-w-[1600px] mx-auto font-sans">
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&family=Inter:wght@300;400;700;900&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* --- HEADER & NAVIGATION HUB --- */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-8 md:pb-12 gap-6 md:gap-8">
        <div className="space-y-4 w-full md:w-auto">
          <div className="flex flex-wrap items-center gap-6 text-[#A3B18A]">
            <div className="flex items-center gap-2">
              <ShieldCheck size={12} fill="currentColor" />
              <p className="font-black uppercase text-[9px] tracking-[0.4em]">Auth: {userName}</p>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={12} />
              <p className="font-black uppercase text-[9px] tracking-[0.4em]">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif italic tracking-tighter leading-none text-stone-900">Command Center</h1>
          
          {/* TOP BUTTON NAVIGATION */}
          <nav className="flex items-center gap-4 pt-4">
            {[
              { id: "identity", label: "Identity", icon: User },
              { id: "team", label: "Team Node", icon: Users },
              { id: "migration", label: "Import Hub", icon: RefreshCcw },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
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
          className="w-full md:w-auto flex items-center justify-center gap-4 bg-[#A3B18A] px-8 py-5 rounded-[2rem] shadow-sm hover:shadow-xl transition-all cursor-pointer"
        >
          {isSaving ? <Loader2 className="animate-spin text-white" size={18} /> : <Save className="text-white" size={18} />}
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
            {isSaving ? "Syncing Logic..." : "Commit Changes"}
          </span>
        </motion.button>
      </header>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
        <AnimatePresence mode="wait">
          
          {/* TAB: IDENTITY CORE */}
          {activeTab === "identity" && (
            <motion.div 
              key="identity"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-5 gap-8"
            >
              {/* Profile Card */}
              <section className="bg-white border border-stone-200 p-12 rounded-[3.5rem] shadow-sm lg:col-span-3 space-y-12">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="w-32 h-32 rounded-[2.5rem] bg-[#faf9f6] border border-stone-100 flex items-center justify-center relative group overflow-hidden">
                    <span className="text-4xl font-serif italic text-stone-200">LD</span>
                    <div className="absolute inset-0 bg-stone-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera size={24} className="text-stone-900" />
                    </div>
                  </div>
                  <div className="text-center md:text-left space-y-2">
                    <h2 className="text-4xl font-serif italic text-stone-900 tracking-tighter">Leigha Day-Clark</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#A3B18A]">Administrator Node</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-2">Public Identity</label>
                    <input className="w-full bg-[#faf9f6] border border-stone-100 p-5 rounded-2xl text-xs font-bold text-stone-700 outline-none focus:border-[#A3B18A] transition-all" defaultValue="Leigha Day-Clark" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-2">Secure Email</label>
                    <input className="w-full bg-[#faf9f6] border border-stone-100 p-5 rounded-2xl text-xs font-bold text-stone-700 outline-none" defaultValue="leigha@theapprenticestore.co.uk" />
                  </div>
                </div>
              </section>

              {/* Aesthetic & Security Sidebars */}
              <div className="lg:col-span-2 space-y-8">
                <section className="bg-[#A3B18A] p-10 rounded-[3rem] text-white space-y-8">
                  <div className="flex items-center gap-3">
                    <Palette size={18} className="text-white" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Brand DNA</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-5 bg-white/10 rounded-2xl border border-white/10">
                      <span className="text-xs font-bold font-serif italic">Sage Accent</span>
                      <div className="w-6 h-6 rounded-full bg-white border-2 border-white/20 shadow-sm" />
                    </div>
                    <div className="flex items-center justify-between p-5 bg-white/10 rounded-2xl border border-white/10">
                      <span className="text-xs font-bold font-serif italic">Interface Scale</span>
                      <span className="text-[9px] font-black uppercase tracking-widest">Minimal</span>
                    </div>
                  </div>
                </section>

                <section className="bg-white border border-stone-200 p-10 rounded-[3rem] shadow-sm flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-stone-400">
                      <Fingerprint size={18} />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Security Token</h3>
                    </div>
                    <p className="text-[9px] font-serif italic text-stone-400 leading-relaxed">
                      Your RSA-4096 encryption key was last rotated 14 hours ago.
                    </p>
                  </div>
                  <button className="mt-8 text-[9px] font-black uppercase tracking-widest text-[#A3B18A] hover:text-stone-900 transition-colors flex items-center gap-2">
                    Rotate Key <ArrowUpRight size={12} />
                  </button>
                </section>
              </div>
            </motion.div>
          )}

          {/* TAB: TEAM HUB */}
          {activeTab === "team" && (
            <motion.div 
              key="team"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="lg:col-span-12 space-y-12"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { name: "David", role: "Manager", initials: "D" },
                  { name: "Ryan", role: "Developer", initials: "R" },
                  { name: "System Node", role: "Automation", initials: "S" }
                ].map((member, i) => (
                  <div key={i} className="bg-white border border-stone-200 p-10 rounded-[3.5rem] shadow-sm group hover:border-[#A3B18A] transition-all duration-500">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-[#faf9f6] flex items-center justify-center text-xl font-serif italic text-stone-300 group-hover:bg-[#A3B18A] group-hover:text-white transition-all mb-8">
                      {member.initials}
                    </div>
                    <h3 className="text-2xl font-serif italic text-stone-900 tracking-tight">{member.name}</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-300 mb-6">{member.role}</p>
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#A3B18A] opacity-0 group-hover:opacity-100 transition-opacity">
                      Manage Access <ChevronRight size={10} />
                    </div>
                  </div>
                ))}
                <button className="bg-[#faf9f6] border border-dashed border-stone-200 p-10 rounded-[3.5rem] flex flex-col items-center justify-center gap-4 text-stone-300 hover:text-[#A3B18A] hover:border-[#A3B18A] transition-all">
                  <div className="w-12 h-12 rounded-full border border-stone-100 flex items-center justify-center">
                    <Plus size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Provision New Node</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* TAB: IMPORT HUB */}
          {activeTab === "migration" && (
            <motion.div 
              key="migration"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <section className="bg-white border border-stone-200 p-12 rounded-[3.5rem] shadow-sm space-y-10">
                <div className="flex items-center gap-6">
                  <div className="p-5 bg-stone-900 rounded-[2rem] text-[#A3B18A]">
                    <RefreshCcw size={28} />
                  </div>
                  <div>
                    <h2 className="text-4xl font-serif italic text-stone-900 tracking-tighter">Migration Hub.</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-200">System Data Ingest</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { label: "External SQL Relay", icon: Database, status: "Connected" },
                    { label: "Public API Bridge", icon: Link, status: "Active" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-6 bg-[#faf9f6] rounded-[2rem] border border-stone-50 group hover:border-[#A3B18A] transition-all">
                      <div className="flex items-center gap-5">
                        <item.icon size={18} className="text-stone-300 group-hover:text-stone-900" />
                        <span className="text-xs font-bold text-stone-700">{item.label}</span>
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-[#A3B18A]">{item.status}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-stone-900 p-12 rounded-[3.5rem] text-white flex flex-col justify-between relative overflow-hidden group">
                <Layers size={200} className="absolute -right-20 -bottom-20 opacity-5" />
                <div className="space-y-6 relative z-10">
                  <h3 className="text-4xl font-serif italic text-[#A3B18A] tracking-tighter">Neural Ingest.</h3>
                  <p className="text-[10px] font-serif italic text-white/50 leading-relaxed">
                    Drop your migration manifest here to synchronize existing client data with the TOTS Neural Engine.
                  </p>
                </div>
                <div className="mt-12 p-12 border border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center gap-4 hover:border-[#A3B18A]/50 transition-all cursor-pointer">
                  <ArrowUpRight size={24} className="text-[#A3B18A]" />
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Upload Manifest (.JSON)</span>
                </div>
              </section>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* --- UTILITY GRID (BOTTOM) --- */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Access Keys", icon: Key, val: "Secure", path: "/vault" },
          { label: "Mobile Sync", icon: Smartphone, val: "Active", path: "#" },
          { label: "Operational Logs", icon: CheckSquare, val: "Nominal", path: "#" },
          { label: "Global Status", icon: Globe, val: "Online", path: "#" }
        ].map((u, i) => (
          <div key={i} className="bg-white border border-stone-200 p-8 rounded-[2.5rem] flex items-center justify-between group hover:shadow-xl transition-all cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-stone-50 rounded-xl text-stone-300 group-hover:bg-[#A3B18A] group-hover:text-white transition-all">
                <u.icon size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">{u.label}</span>
                <span className="text-xs font-bold text-stone-900">{u.val}</span>
              </div>
            </div>
            <ArrowUpRight size={14} className="text-stone-100 group-hover:text-stone-900" />
          </div>
        ))}
      </section>

      {/* --- FOOTER STATUS --- */}
      <footer className="pt-8 border-t border-stone-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-[#A3B18A]" />
            <span className="text-[8px] font-black uppercase tracking-widest text-stone-300">All Nodes Active</span>
          </div>
          <p className="text-[10px] font-serif italic text-stone-300">TOTS Operating System // 2026</p>
        </div>
        <button className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-stone-300 hover:text-red-400 transition-colors">
          <LogOut size={12} /> Terminate Session
        </button>
      </footer>

    </div>
  );
}