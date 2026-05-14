"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  User, Users, RefreshCcw, Save, 
  Camera, Palette, ShieldCheck, 
  Fingerprint, Key, ChevronRight, 
  Database, ArrowUpRight, 
  Zap, Clock, Loader2,
  CheckSquare, Smartphone, LogOut,
  Globe, Layers, Plus, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

/**
 * TOTS OS: COMMAND CENTER v5.5
 * Aesthetic: Organic Minimalist (Sage & Stone)
 * Architecture: Central Router / Unified Settings
 */

export default function CommandCenter() {
  const router = useRouter();
  const [userName] = useState<string>("LEIGHA DAY-CLARK");
  const [currentTime, setCurrentTime] = useState(new Date());
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
            <button
              onClick={() => setActiveTab("identity")}
              className={`flex items-center gap-3 px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                activeTab === "identity" ? "bg-stone-900 text-white shadow-lg" : "bg-white border border-stone-100 text-stone-300 hover:text-stone-900"
              }`}
            >
              <User size={12} /> Identity
            </button>
            <button
              onClick={() => router.push('/settings/identity')} // Direct link to full page
              className="flex items-center gap-3 px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest bg-white border border-stone-100 text-stone-300 hover:text-[#A3B18A] transition-all"
            >
              <Users size={12} /> Team Hub
            </button>
            <button
              onClick={() => router.push('/settings/import')} // Direct link to full page
              className="flex items-center gap-3 px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest bg-white border border-stone-100 text-stone-300 hover:text-[#A3B18A] transition-all"
            >
              <RefreshCcw size={12} /> Import Hub
            </button>
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
          
          {/* TAB: IDENTITY QUICK VIEW */}
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
                    <h2 className="text-4xl font-serif italic text-stone-900 tracking-tighter leading-tight">Leigha Day-Clark</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#A3B18A]">Root Administrator</p>
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

                <button 
                  onClick={() => router.push('/settings/identity')}
                  className="w-full py-5 bg-[#faf9f6] rounded-2xl border border-stone-100 flex items-center justify-center gap-4 group hover:bg-stone-900 transition-all"
                >
                  <Palette size={16} className="text-[#A3B18A] group-hover:text-white" />
                  <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-white">Configure Brand DNA & Team</span>
                  <ArrowRight size={14} className="text-stone-200 group-hover:text-[#A3B18A]" />
                </button>
              </section>

              {/* Security Sidebars */}
              <div className="lg:col-span-2 space-y-8">
                <section className="bg-stone-900 p-10 rounded-[3rem] text-white space-y-8 relative overflow-hidden">
                  <Fingerprint size={120} className="absolute -right-8 -bottom-8 opacity-10" />
                  <div className="flex items-center gap-3 relative z-10">
                    <ShieldCheck size={18} className="text-[#A3B18A]" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Security Token</h3>
                  </div>
                  <div className="space-y-4 relative z-10">
                    <p className="text-xs font-serif italic text-stone-400 leading-relaxed">
                      Your RSA-4096 encryption key was last rotated 14 hours ago in Elgin, Scotland.
                    </p>
                    <button className="text-[9px] font-black uppercase tracking-widest text-[#A3B18A] hover:text-white transition-colors flex items-center gap-2">
                      Rotate Key <ArrowUpRight size={12} />
                    </button>
                  </div>
                </section>

                <section className="bg-white border border-stone-200 p-10 rounded-[3rem] shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <Layers size={16} className="text-stone-300" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Node Architecture</h3>
                  </div>
                  <p className="text-[10px] font-serif italic text-stone-400 leading-relaxed">
                    System scale is currently set to <span className="text-stone-900 font-bold">Minimalist</span>. Neural processing is active.
                  </p>
                </section>
              </div>
            </motion.div>
          )}

          {/* TAB: MIGRATION PREVIEW */}
          {activeTab === "migration" && (
            <motion.div 
              key="migration"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <section className="bg-white border border-stone-200 p-12 rounded-[3.5rem] shadow-sm space-y-10">
                <div className="flex items-center gap-6">
                  <div className="p-5 bg-stone-900 rounded-[2rem] text-[#A3B18A]">
                    <RefreshCcw size={28} />
                  </div>
                  <div>
                    <h2 className="text-4xl font-serif italic text-stone-900 tracking-tighter leading-none">Import Hub.</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300 mt-2">Data Ingestion Gateway</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-6 bg-[#faf9f6] rounded-[2rem] border border-stone-50">
                    <div className="flex items-center gap-5">
                      <Database size={18} className="text-[#A3B18A]" />
                      <span className="text-xs font-bold text-stone-700">Supabase Profiles</span>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-[#A3B18A]">Synced</span>
                  </div>
                </div>

                <button 
                  onClick={() => router.push('/settings/import')}
                  className="w-full py-6 bg-stone-900 text-white rounded-[2rem] flex items-center justify-center gap-4 hover:brightness-110 transition-all shadow-xl"
                >
                  <Zap size={16} className="text-[#A3B18A]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Open Import Pipeline</span>
                </button>
              </section>

              <section className="bg-[#faf9f6] border border-dashed border-stone-200 p-12 rounded-[3.5rem] flex flex-col justify-center items-center text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-white border border-stone-100 flex items-center justify-center text-stone-200">
                  <Globe size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-serif italic text-stone-400">External Relays</h3>
                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-300 mt-2">No active third-party APIs detected</p>
                </div>
              </section>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* --- UTILITY GRID (BOTTOM) --- */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Access Keys", icon: Key, val: "Secure", path: "#" },
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