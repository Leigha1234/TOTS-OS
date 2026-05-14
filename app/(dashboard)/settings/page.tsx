"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { 
  Zap, ShieldCheck, Activity, Save, 
  Plus, Hash, User, Camera, Palette, 
  Sun, Moon, LayoutDashboard, Calendar, 
  Users, StickyNote, Megaphone, DollarSign, 
  Briefcase, BarChart3, Globe, ArrowUpRight,
  Database, Lock, HardDrive, Cpu, 
  CheckCircle2, Bell, Smartphone, Key, 
  Layers, LogOut, ChevronRight, Mail,
  RefreshCcw, Link, Fingerprint, Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

/**
 * TOTS OS: SETTINGS ARCHITECTURE v4.8
 * Focus: Visual Serenity, Navigation Parity, and Reduced Cognitive Load.
 */

interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: "online" | "offline";
  initials: string;
}

export default function SettingsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "team" | "import">("general");

  // -- Mock Data --
  const team: TeamMember[] = [
    { id: "1", name: "David", role: "Manager", status: "online", initials: "D" },
    { id: "2", name: "Ryan", role: "Developer", status: "online", initials: "R" },
    { id: "3", name: "Leigha", role: "Lead", status: "online", initials: "L" },
  ];

  useEffect(() => { setIsMounted(true); }, []);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1200));
    setIsSaving(false);
    toast.success("System Configuration Updated");
  };

  if (!isMounted) return null;

  return (
    <div className="h-screen bg-[#FDFCFB] text-[#2C2C2C] flex overflow-hidden selection:bg-[#A3B18A] selection:text-white font-sans">
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&family=Inter:wght@300;400;600;900&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* --- SIDE NAVIGATION (THE ANCHOR) --- */}
      <aside className="w-72 flex flex-col p-8 bg-[#FDFCFB] border-r border-stone-100/50">
        <div className="flex items-center gap-3 mb-16 px-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#A3B18A] shadow-[0_0_8px_#A3B18A]" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300">TOTS.System</span>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: "general", label: "Core Identity", icon: User },
            { id: "team", label: "Team Node", icon: Users },
            { id: "import", label: "Import Hub", icon: RefreshCcw },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-500 group ${
                activeTab === item.id 
                ? "bg-white shadow-[0_10px_25px_-10px_rgba(0,0,0,0.04)] border border-stone-50 text-stone-900" 
                : "text-stone-300 hover:text-stone-500"
              }`}
            >
              <item.icon size={14} strokeWidth={activeTab === item.id ? 2.5 : 1.5} />
              <span className={`text-[10px] font-black uppercase tracking-widest ${activeTab === item.id ? "opacity-100" : "opacity-60 group-hover:opacity-100"}`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <div className="pt-8 border-t border-stone-50">
           <div className="p-6 bg-[#F9F8F6] rounded-3xl space-y-3">
              <ShieldCheck size={16} className="text-[#A3B18A]" />
              <p className="text-[10px] font-serif italic text-stone-400 leading-relaxed">
                Security protocols are active. Your connection is routed through Elgin Node 8.
              </p>
           </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT CANVAS --- */}
      <main className="flex-1 flex flex-col relative bg-[#F9F8F6] overflow-hidden">
        
        {/* HEADER TOOLBAR */}
        <header className="h-24 flex items-center justify-between px-16 shrink-0 z-10 border-b border-stone-100/30">
          <div className="flex flex-col">
            <span className="text-[8px] font-black tracking-[0.4em] text-[#A3B18A] uppercase mb-1">Configuration</span>
            <h1 className="text-xl font-serif italic text-stone-900 capitalize">{activeTab} Layout</h1>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleSave}
              className="px-10 py-3.5 bg-stone-900 text-white rounded-full text-[9px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-[#A3B18A] transition-all active:scale-95 flex items-center gap-3 group"
            >
              {isSaving ? <Activity size={12} className="animate-spin" /> : <Save size={12} className="group-hover:scale-110 transition-transform" />}
              {isSaving ? "Syncing..." : "Save Configuration"}
            </button>
          </div>
        </header>

        {/* SCROLLABLE VIEWPORT */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-16">
          <AnimatePresence mode="wait">
            
            {/* TAB: GENERAL IDENTITY */}
            {activeTab === "general" && (
              <motion.div 
                key="general"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl space-y-12"
              >
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-12 rounded-[3.5rem] border border-stone-100 shadow-sm space-y-10">
                    <div className="flex flex-col items-center text-center space-y-6">
                      <div className="w-24 h-24 rounded-[2rem] bg-stone-50 border border-stone-100 flex items-center justify-center relative group cursor-pointer">
                        <span className="text-2xl font-serif italic text-stone-200">LD</span>
                        <div className="absolute inset-0 bg-stone-900/40 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera size={16} className="text-white" />
                        </div>
                      </div>
                      <div>
                        <h2 className="text-3xl font-serif italic text-stone-900 tracking-tighter leading-none">Identity Core.</h2>
                        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-stone-200 mt-2">Personal Node Credentials</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-[8px] font-black uppercase tracking-widest text-stone-200 ml-1">Legal Name</label>
                          <input className="w-full bg-[#FDFCFB] border border-stone-50 p-4 rounded-2xl text-[10px] font-bold text-stone-600 outline-none focus:border-[#A3B18A] transition-all" defaultValue="Leigha Day-Clark" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[8px] font-black uppercase tracking-widest text-stone-200 ml-1">Relay Address</label>
                          <input className="w-full bg-[#FDFCFB] border border-stone-50 p-4 rounded-2xl text-[10px] font-bold text-stone-600 outline-none" defaultValue="leigha@theapprenticestore.co.uk" />
                       </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm space-y-6">
                       <div className="flex items-center gap-3">
                          <Palette size={14} className="text-[#A3B18A]" />
                          <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-900">Visual DNA</h3>
                       </div>
                       <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl">
                          <span className="text-[10px] font-bold text-stone-900">System Accents</span>
                          <div className="flex gap-2">
                            {["#A3B18A", "#2C2C2C", "#E5E1DB"].map(c => (
                              <div key={c} className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ background: c }} />
                            ))}
                          </div>
                       </div>
                    </div>

                    <div className="bg-stone-900 p-10 rounded-[3rem] text-white relative overflow-hidden group">
                       <Fingerprint size={120} className="absolute -right-8 -bottom-8 opacity-5" />
                       <h4 className="text-2xl font-serif italic text-[#A3B18A] tracking-tighter mb-2">Auth Key.</h4>
                       <p className="text-[10px] font-serif italic opacity-50 mb-6">Last rotation: 14 May 2026</p>
                       <button className="w-full py-4 bg-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-[#A3B18A] transition-all">Rotate Node Key</button>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {/* TAB: TEAM NODE */}
            {activeTab === "team" && (
              <motion.div 
                key="team"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="max-w-5xl space-y-10"
              >
                <div className="flex justify-between items-end mb-8">
                  <div className="space-y-2">
                    <h2 className="text-4xl font-serif italic text-stone-900 tracking-tighter leading-none">The Team Node.</h2>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-200">Authorized Workspace Collaborators</p>
                  </div>
                  <button className="px-8 py-3 rounded-full border border-stone-100 text-[9px] font-black uppercase tracking-widest text-stone-300 hover:text-stone-900 transition-all flex items-center gap-3">
                    <Plus size={12} /> Add Member
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {team.map(member => (
                    <div key={member.id} className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm space-y-6 group hover:shadow-xl hover:shadow-stone-200/40 transition-all duration-500">
                       <div className="flex justify-between items-start">
                          <div className="w-12 h-12 rounded-2xl bg-[#F9F8F6] flex items-center justify-center text-sm font-serif italic text-stone-400 group-hover:bg-[#A3B18A] group-hover:text-white transition-colors duration-500">
                            {member.initials}
                          </div>
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-stone-50 rounded-full">
                             <div className="w-1 h-1 rounded-full bg-[#A3B18A]" />
                             <span className="text-[7px] font-black uppercase text-stone-400 tracking-widest">{member.status}</span>
                          </div>
                       </div>
                       <div>
                          <h3 className="text-lg font-bold text-stone-900 tracking-tight">{member.name}</h3>
                          <p className="text-[9px] font-black uppercase tracking-widest text-stone-200">{member.role}</p>
                       </div>
                       <button className="w-full flex items-center justify-between p-3 border border-stone-50 rounded-xl text-stone-200 hover:text-stone-900 transition-colors">
                          <span className="text-[8px] font-black uppercase tracking-widest">Manage Access</span>
                          <ChevronRight size={12} />
                       </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* TAB: IMPORT HUB */}
            {activeTab === "import" && (
              <motion.div 
                key="import"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl space-y-12"
              >
                <div className="bg-white p-12 rounded-[4rem] border border-stone-100 shadow-sm space-y-12">
                   <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-[2rem] bg-stone-900 flex items-center justify-center text-[#A3B18A]">
                        <RefreshCcw size={24} />
                      </div>
                      <div>
                        <h2 className="text-4xl font-serif italic text-stone-900 tracking-tighter leading-none">Import Hub.</h2>
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-200 mt-1">Data Migration & System Feeds</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="p-8 bg-[#FDFCFB] rounded-[2.5rem] border border-stone-50 space-y-6 hover:border-[#A3B18A]/20 transition-all cursor-pointer group">
                        <div className="flex items-center justify-between">
                           <Database size={20} className="text-stone-200 group-hover:text-stone-900 transition-colors" />
                           <ArrowUpRight size={14} className="text-stone-100 group-hover:text-[#A3B18A]" />
                        </div>
                        <div>
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-900">Database Sync</h4>
                           <p className="text-[9px] font-serif italic text-stone-400 mt-1">Pull records from existing external storage nodes.</p>
                        </div>
                      </div>

                      <div className="p-8 bg-[#FDFCFB] rounded-[2.5rem] border border-stone-50 space-y-6 hover:border-[#A3B18A]/20 transition-all cursor-pointer group">
                        <div className="flex items-center justify-between">
                           <Link size={20} className="text-stone-200 group-hover:text-stone-900 transition-colors" />
                           <ArrowUpRight size={14} className="text-stone-100 group-hover:text-[#A3B18A]" />
                        </div>
                        <div>
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-900">API Bridge</h4>
                           <p className="text-[9px] font-serif italic text-stone-400 mt-1">Configure third-party service webhooks and relays.</p>
                        </div>
                      </div>
                   </div>

                   <div className="p-10 bg-stone-50/50 rounded-[3rem] border border-dashed border-stone-100 text-center space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300">Drop Migration Manifest Here</p>
                      <p className="text-[9px] font-serif italic text-stone-200">Supports .JSON, .CSV, and .LOG formats</p>
                   </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* SYSTEM ANALYTICS FOOTER (MINIMAL) */}
        <footer className="h-16 bg-white/40 backdrop-blur-md border-t border-stone-100/50 px-16 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
               <div className="w-1 h-1 rounded-full bg-[#A3B18A] animate-pulse" />
               <span className="text-[8px] font-black uppercase tracking-[0.3em] text-stone-300">Logic Core Synced</span>
            </div>
            <div className="flex items-center gap-3">
               <Activity size={10} className="text-stone-200" />
               <span className="text-[8px] font-black uppercase tracking-[0.3em] text-stone-300">Latency: 0.002ms</span>
            </div>
          </div>
          <span className="text-[9px] font-serif italic text-stone-300">TOTS Operating System // Elgin Node // 2026</span>
        </footer>
      </main>

      {/* --- QUICK ACTION BAR (PEEK) --- */}
      <aside className="w-16 hover:w-64 flex flex-col bg-white border-l border-stone-50 transition-all duration-700 group/peek overflow-hidden">
        <div className="p-6 flex flex-col h-full">
           <div className="mb-12 self-center group-hover/peek:self-start">
             <Layers size={14} className="text-stone-200 group-hover/peek:text-stone-900 transition-colors" />
           </div>

           <div className="flex-1 space-y-12 opacity-0 group-hover/peek:opacity-100 transition-opacity duration-500 delay-100">
              <section className="space-y-4">
                 <h4 className="text-[8px] font-black uppercase tracking-widest text-stone-200">Shortcuts</h4>
                 <div className="space-y-2">
                    {["Audit Logs", "System Health", "Neural Trace"].map(s => (
                      <button key={s} className="w-full text-left p-3 rounded-xl hover:bg-stone-50 text-[9px] font-bold text-stone-400 hover:text-stone-900 transition-all">
                        {s}
                      </button>
                    ))}
                 </div>
              </section>

              <section className="p-6 bg-stone-900 rounded-[2rem] text-white space-y-4">
                 <Shield size={14} className="text-[#A3B18A]" />
                 <p className="text-[10px] font-serif italic opacity-50">Encryption Level: RSA-4096. No unauthorized leaks detected.</p>
              </section>
           </div>

           <div className="mt-auto flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-white text-[10px] font-serif italic">L</div>
              <div className="hidden group-hover/peek:block">
                 <p className="text-[9px] font-black text-stone-900 uppercase">Leigha D.</p>
                 <p className="text-[7px] font-black text-stone-200 uppercase tracking-widest">Root Access</p>
              </div>
           </div>
        </div>
      </aside>

    </div>
  );
}