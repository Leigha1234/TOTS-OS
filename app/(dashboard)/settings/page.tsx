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
  Layers, LogOut, ChevronRight, Mail
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase-client";
import { useSettings } from "@/app/context/SettingsContext";
import { toast } from "sonner";

/**
 * TOTS OS: COMMAND CENTER v4.6
 * High-density settings architecture for full-page control.
 */

const NAV_PROTOCOLS = [
  { id: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "/clarity", label: "Clarity AI", icon: Zap },
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

export default function SettingsCommandHub() {
  const { refreshSettings } = useSettings();
  
  // -- Local State --
  const [isMounted, setIsMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activePanel, setActivePanel] = useState<"IDENTITY" | "NETWORK" | "SECURITY">("IDENTITY");

  // -- User & Profile State --
  const [profile, setProfile] = useState({
    full_name: "Leigha Day-Clark",
    email: "leigha@theapprenticestore.co.uk",
    role: "Lead Developer",
    brand_color: "#A3B18A",
    mobile_nav: ["/dashboard", "/clarity", "/vault"]
  });

  const [bankData, setBankData] = useState({
    institution: "Monzo Business",
    accountNum: "•••• 8821",
    sortCode: "00-00-00",
    lastVerified: "14 May 2026"
  });

  const [teamNodes, setTeamNodes] = useState([
    { id: "1", name: "David (Manager)", status: "Active", access: "Root" },
    { id: "2", name: "Ryan", status: "Active", access: "Dev" },
    { id: "3", name: "System Node", status: "Active", access: "Read-Only" }
  ]);

  // -- Refs --
  const avatarRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setIsMounted(true); }, []);

  // -- Handlers --
  const toggleNavConfig = (id: string) => {
    setProfile(prev => {
      const exists = prev.mobile_nav.includes(id);
      if (exists) return { ...prev, mobile_nav: prev.mobile_nav.filter(i => i !== id) };
      if (prev.mobile_nav.length >= 3) return prev;
      return { ...prev, mobile_nav: [...prev.mobile_nav, id] };
    });
  };

  const handleGlobalCommit = async () => {
    setIsSaving(true);
    // Simulation of neural sync
    await new Promise(r => setTimeout(r, 1800));
    setIsSaving(false);
    toast.success("System Logic Updated Successfully");
    await refreshSettings();
  };

  if (!isMounted) return null;

  return (
    <div className={`h-screen flex flex-col overflow-hidden transition-colors duration-700 selection:bg-[#A3B18A] selection:text-white ${isDarkMode ? 'bg-[#121212] text-stone-200' : 'bg-[#FDFCFB] text-[#2C2C2C]'}`}>
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        input::placeholder { color: #E5E1DB; }
      `}</style>

      {/* --- TOP HUD --- */}
      <header className="h-20 shrink-0 border-b border-stone-100/50 px-10 flex items-center justify-between subtle-blur bg-white/20 z-50">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-[#A3B18A] shadow-[0_0_8px_#A3B18A]" />
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">Settings.Command</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
             {["IDENTITY", "NETWORK", "SECURITY"].map(panel => (
               <button 
                 key={panel}
                 onClick={() => setActivePanel(panel as any)}
                 className={`text-[9px] font-black uppercase tracking-widest transition-all ${activePanel === panel ? 'text-stone-900 border-b-2 border-[#A3B18A] pb-1' : 'text-stone-200 hover:text-stone-400'}`}
               >
                 {panel}
               </button>
             ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
           <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 text-stone-200 hover:text-stone-900 transition-colors">
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
           </button>
           <button 
              onClick={handleGlobalCommit}
              disabled={isSaving}
              className="px-10 py-3.5 bg-stone-900 text-white rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-[#A3B18A] transition-all active:scale-95 flex items-center gap-3"
           >
              {isSaving ? <Activity size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
              {isSaving ? "Processing" : "Commit Changes"}
           </button>
        </div>
      </header>

      {/* --- MAIN SCROLL AREA --- */}
      <main className="flex-1 overflow-y-auto no-scrollbar p-10 sm:p-16">
        <div className="max-w-7xl mx-auto grid grid-cols-12 gap-10">
          
          {/* LEFT COLUMN: IDENTITY DNA */}
          <div className="col-span-12 lg:col-span-4 space-y-10">
            
            {/* PROFILE CARD */}
            <section className="bg-white rounded-[3rem] p-10 shadow-sm border border-stone-50/50 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                 <User size={120} />
               </div>
               
               <div className="flex flex-col items-center text-center gap-6 relative z-10">
                  <div 
                    onClick={() => avatarRef.current?.click()}
                    className="w-32 h-32 rounded-[2.5rem] bg-[#F9F8F6] flex items-center justify-center border border-stone-100 cursor-pointer hover:rotate-2 transition-transform group/avatar"
                  >
                    <span className="text-4xl font-serif italic text-stone-200 group-hover/avatar:scale-110 transition-transform">LD</span>
                    <input type="file" ref={avatarRef} className="hidden" />
                  </div>
                  <div>
                    <input 
                      value={profile.full_name}
                      onChange={e => setProfile({...profile, full_name: e.target.value})}
                      className="text-3xl font-serif italic text-stone-900 text-center bg-transparent outline-none w-full"
                    />
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#A3B18A] mt-2">{profile.role}</p>
                  </div>
               </div>

               <div className="mt-12 pt-8 border-t border-stone-50 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-stone-200 ml-2">Contact Protocol</label>
                    <div className="flex items-center gap-3 p-4 bg-[#FDFCFB] rounded-2xl border border-stone-50">
                      <Mail size={12} className="text-stone-300" />
                      <span className="text-[10px] font-bold text-stone-500">{profile.email}</span>
                    </div>
                  </div>
               </div>
            </section>

            {/* AESTHETIC DNA */}
            <section className="bg-white rounded-[3rem] p-10 shadow-sm border border-stone-50/50 space-y-8">
               <div className="flex items-center gap-3">
                  <Palette size={14} className="text-[#A3B18A]" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-900">Aesthetic DNA</h3>
               </div>
               
               <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-stone-50/50 rounded-2xl">
                    <div className="flex flex-col">
                       <span className="text-[9px] font-bold text-stone-900">Brand Primary</span>
                       <span className="text-[8px] font-black text-stone-300 uppercase tracking-tighter">{profile.brand_color}</span>
                    </div>
                    <input 
                      type="color" 
                      value={profile.brand_color} 
                      onChange={e => setProfile({...profile, brand_color: e.target.value})}
                      className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-none"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-stone-50 rounded-2xl opacity-50">
                    <span className="text-[9px] font-bold text-stone-900">Motion Scale</span>
                    <span className="text-[8px] font-black uppercase text-stone-300">v.0.8 Bezier</span>
                  </div>
               </div>
            </section>

            {/* QUICK ACTIONS */}
            <section className="grid grid-cols-2 gap-4">
               <button className="flex flex-col items-center justify-center p-8 bg-stone-900 rounded-[2.5rem] gap-4 group transition-all hover:bg-[#A3B18A]">
                  <Smartphone size={18} className="text-white group-hover:scale-110 transition-transform" />
                  <span className="text-[8px] font-black uppercase text-white tracking-widest">Mobile Sync</span>
               </button>
               <button className="flex flex-col items-center justify-center p-8 bg-white border border-stone-100 rounded-[2.5rem] gap-4 group transition-all hover:border-[#A3B18A]">
                  <LogOut size={18} className="text-stone-300 group-hover:text-red-400 transition-colors" />
                  <span className="text-[8px] font-black uppercase text-stone-300 tracking-widest">Terminate</span>
               </button>
            </section>
          </div>

          {/* RIGHT COLUMN: CORE ARCHITECTURE */}
          <div className="col-span-12 lg:col-span-8 space-y-10">
            
            {/* ARCHITECTURE: NAVIGATION CONFIG */}
            <section className="bg-white rounded-[4rem] p-12 shadow-sm border border-stone-50/50 space-y-10">
               <div className="flex justify-between items-end">
                  <div className="space-y-2">
                    <h2 className="text-4xl font-serif italic text-stone-900 tracking-tighter">Architecture.</h2>
                    <p className="text-[9px] font-black uppercase tracking-[0.5em] text-stone-200">Global Hub Layout</p>
                  </div>
                  <span className="text-[9px] font-black text-[#A3B18A] uppercase tracking-widest">{profile.mobile_nav.length} / 3 Selected</span>
               </div>

               <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                  {NAV_PROTOCOLS.map(proto => {
                    const isActive = profile.mobile_nav.includes(proto.id);
                    return (
                      <button 
                        key={proto.id}
                        onClick={() => toggleNavConfig(proto.id)}
                        className={`flex flex-col items-center gap-4 p-6 rounded-[2rem] border transition-all duration-500 ${isActive ? 'bg-stone-900 border-transparent shadow-xl text-white scale-[1.05]' : 'bg-[#FDFCFB] border-stone-50 text-stone-300 hover:text-stone-600'}`}
                      >
                        <proto.icon size={18} strokeWidth={isActive ? 2 : 1.2} />
                        <span className="text-[8px] font-black uppercase tracking-widest text-center leading-none">{proto.label}</span>
                      </button>
                    );
                  })}
               </div>
            </section>

            {/* THE NETWORK: TEAM NODES */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="bg-white rounded-[3.5rem] p-10 border border-stone-50 space-y-8 flex flex-col justify-between min-h-[350px]">
                  <div className="space-y-2">
                    <h3 className="text-3xl font-serif italic text-stone-900 tracking-tighter">The Network.</h3>
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-200">Authorized Nodes</p>
                  </div>

                  <div className="space-y-3">
                     {teamNodes.map(node => (
                       <div key={node.id} className="flex items-center justify-between p-5 bg-stone-50/50 rounded-2xl group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-stone-50">
                          <div className="flex items-center gap-4">
                             <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[9px] font-black text-stone-200 border border-stone-50">
                                {node.name.charAt(0)}
                             </div>
                             <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-stone-900">{node.name}</span>
                                <span className="text-[8px] font-black text-stone-200 uppercase tracking-widest">{node.access}</span>
                             </div>
                          </div>
                          <div className="w-1.5 h-1.5 rounded-full bg-[#A3B18A] animate-pulse" />
                       </div>
                     ))}
                  </div>

                  <button className="w-full py-4 border border-dashed border-stone-100 rounded-2xl text-[9px] font-black uppercase tracking-widest text-stone-200 hover:text-[#A3B18A] hover:border-[#A3B18A]/30 transition-all flex items-center justify-center gap-3">
                     <Plus size={14} /> New Authorized Node
                  </button>
               </div>

               {/* SECURE LEDGER */}
               <div className="bg-stone-900 rounded-[3.5rem] p-10 text-white flex flex-col relative overflow-hidden group">
                  <Database size={200} className="absolute -right-20 -bottom-20 opacity-5 group-hover:-rotate-12 transition-transform duration-1000" />
                  
                  <div className="space-y-8 relative z-10">
                    <div className="flex justify-between items-start">
                       <div className="space-y-2">
                          <h3 className="text-3xl font-serif italic text-[#A3B18A] tracking-tighter leading-none">Ledger Protocol.</h3>
                          <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40">Financial Vault Data</p>
                       </div>
                       <Lock size={20} className="text-[#A3B18A]" />
                    </div>

                    <div className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-[8px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">Primary Institution</label>
                          <div className="p-5 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                             <span className="text-[11px] font-bold text-white/80">{bankData.institution}</span>
                             <CheckCircle2 size={12} className="text-[#A3B18A]" />
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[8px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">ID Node</label>
                            <input readOnly value={bankData.accountNum} className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl text-[10px] text-white/80 outline-none" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[8px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">Relay Node</label>
                            <input readOnly value={bankData.sortCode} className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl text-[10px] text-white/80 outline-none" />
                          </div>
                       </div>
                    </div>
                    
                    <div className="pt-8 flex justify-between items-center">
                       <p className="text-[8px] font-black uppercase tracking-widest opacity-20 italic">Verified: {bankData.lastVerified}</p>
                       <button className="text-[9px] font-black uppercase tracking-widest text-[#A3B18A] hover:text-white transition-colors flex items-center gap-2">
                          Update Ledger <ArrowUpRight size={12} />
                       </button>
                    </div>
                  </div>
               </div>
            </section>

            {/* SYSTEM SECURITY & KEYS */}
            <section className="bg-white rounded-[4rem] p-12 border border-stone-50 space-y-12">
               <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1.5rem] bg-stone-900 flex items-center justify-center text-[#A3B18A]">
                      <Key size={20} />
                    </div>
                    <div>
                      <h4 className="text-2xl font-serif italic text-stone-900 tracking-tighter">Access Keys.</h4>
                      <p className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-200">API & Encryption Nodes</p>
                    </div>
                  </div>
                  <button className="px-6 py-3 rounded-full border border-stone-100 text-[9px] font-black uppercase tracking-widest text-stone-300 hover:text-stone-900 transition-all">
                    Rotate All Keys
                  </button>
               </div>

               <div className="space-y-4">
                  {[
                    { label: "Neural Engine Key", key: "sk_live_••••••••••4210", node: "Node-Alpha" },
                    { label: "Database Relay", key: "db_prod_••••••••••9928", node: "Node-Omega" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-6 bg-[#FDFCFB] rounded-[2rem] border border-stone-50 group hover:shadow-lg hover:shadow-stone-100 transition-all">
                       <div className="flex items-center gap-8">
                          <div className="flex flex-col gap-1">
                             <span className="text-[9px] font-bold text-stone-900">{item.label}</span>
                             <span className="text-[8px] font-black text-stone-200 uppercase tracking-widest">{item.node}</span>
                          </div>
                          <code className="text-[10px] font-mono text-stone-300 group-hover:text-stone-600 transition-colors">{item.key}</code>
                       </div>
                       <button className="p-3 text-stone-200 hover:text-[#A3B18A] transition-colors"><ChevronRight size={14} /></button>
                    </div>
                  ))}
               </div>
            </section>
          </div>
        </div>
      </main>

      {/* --- SYSTEM TELEMETRY FOOTER --- */}
      <footer className="h-12 bg-white/40 backdrop-blur-md border-t border-stone-50 px-10 flex items-center justify-between shrink-0 z-[60]">
         <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
               <div className="w-1 h-1 rounded-full bg-[#A3B18A]" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-300">Auth Status: Verified</span>
            </div>
            <div className="flex items-center gap-2">
               <HardDrive size={10} className="text-stone-200" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-300">Logic Core Nominal</span>
            </div>
         </div>
         
         <div className="flex items-center gap-6">
            <span className="text-[9px] font-serif italic text-stone-200">Terminal Access Port: 8080-OS</span>
            <div className="h-4 w-[1px] bg-stone-50" />
            <span className="text-[8px] font-black uppercase tracking-[0.5em] text-stone-300">© 2026 TOTS</span>
         </div>
      </footer>

      {/* --- GLOBAL NOTIFICATION LAYER (GHOST) --- */}
      <div className="fixed bottom-20 right-10 flex flex-col gap-3 pointer-events-none">
         <AnimatePresence>
            {isSaving && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-stone-900 p-6 rounded-[2rem] shadow-2xl flex items-center gap-4 border border-white/5"
              >
                <div className="w-8 h-8 rounded-full border-2 border-[#A3B18A] border-t-transparent animate-spin" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-white uppercase tracking-widest">Committing Logic</span>
                  <span className="text-[8px] font-serif italic text-stone-400 leading-none">Updating neural nodes...</span>
                </div>
              </motion.div>
            )}
         </AnimatePresence>
      </div>

    </div>
  );
}