"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { 
  User, Users, RefreshCcw, Save, 
  Camera, Palette, ShieldCheck, 
  Fingerprint, Key, ChevronRight, 
  Database, ArrowUpRight, 
  Zap, Clock, Loader2,
  CheckSquare, Smartphone, LogOut,
  Globe, Layers, Plus, ArrowRight,
  Shield, Activity, Settings as SettingsIcon,
  Search, Filter, Trash2, Edit3,
  Mail, Phone, MapPin, AlertTriangle,
  FileJson, Server, HardDrive, Cpu
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

/**
 * TOTS OS: SETTINGS ARCHITECTURE v6.5
 * Complexity: High (400+ LOC)
 * Aesthetic: Organic Minimalist (Sage & Stone)
 * Modules: Identity, Team Logic, Data Ingestion, Security
 */

export default function Settings() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // -- Global State --
  const [userName] = useState<string>("LEIGHA DAY-CLARK");
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<"account" | "security" | "import">("account");
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // -- Account & Personalization State --
  const [displayName, setDisplayName] = useState("Leigha Day-Clark");
  const [email, setEmail] = useState("leigha@theapprenticestore.co.uk");
  const [bio, setBio] = useState("Root Administrator for TOTS OS. Managing cloud architectures and team nodes.");
  const [themeColor, setThemeColor] = useState("#A3B18A");

  // -- Security State --
  const [twoFactor, setTwoFactor] = useState(true);
  const [sessionLogs] = useState([
    { id: 1, device: "MacBook Pro M3", location: "Elgin, UK", time: "Now", status: "Active" },
    { id: 2, device: "iPhone 15 Pro", location: "Elgin, UK", time: "2h ago", status: "Idle" },
    { id: 3, device: "Linux Node 04", location: "London, UK", time: "1d ago", status: "Verified" }
  ]);

  // -- Import Hub State --
  const [importStatus, setImportStatus] = useState<"idle" | "mapping" | "syncing">("idle");
  const [sources] = useState([
    { name: "Supabase Auth", type: "Database", lastSync: "14m ago", health: "100%" },
    { name: "Google Cloud", type: "Storage", lastSync: "1h ago", health: "98%" },
    { name: "PostgreSQL", type: "Relational", lastSync: "Active", health: "100%" }
  ]);

  // -- Lifecycle: Sync Clock & Init --
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Simulate initial system check
    const init = setTimeout(() => setLoading(false), 800);
    
    return () => {
      clearInterval(timer);
      clearTimeout(init);
    };
  }, []);

  // -- Handlers --
  const handleSave = async () => {
    setIsSaving(true);
    // Simulating system ingestion
    await new Promise(r => setTimeout(r, 1500));
    setIsSaving(false);
    toast.success("Settings Synchronized Successfully");
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Logout Sequence Aborted");
    } else {
      toast.info("Session Terminated Safely");
      router.push("/login");
    }
  };

  const triggerImport = () => {
    setImportStatus("mapping");
    toast.loading("Mapping Data Schema...");
    setTimeout(() => {
      setImportStatus("syncing");
      toast.dismiss();
      toast.success("Schema Validated. Starting Sync.");
      setTimeout(() => setImportStatus("idle"), 3000);
    }, 2000);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center gap-6">
      <Loader2 className="animate-spin text-[#A3B18A]" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.6em] text-[#A3B18A]">Syncing Hub Logic</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-4 md:p-8 lg:p-12 space-y-8 md:space-y-12 max-w-[1700px] mx-auto font-sans">
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&family=Inter:wght@300;400;700;900&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* --- HEADER --- */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end border-b border-stone-200 pb-10 gap-8">
        <div className="space-y-6 w-full xl:w-auto">
          <div className="flex flex-wrap items-center gap-6 text-[#A3B18A]">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-stone-100 shadow-sm">
              <ShieldCheck size={12} fill="currentColor" />
              <p className="font-black uppercase text-[9px] tracking-[0.4em]">Node: {userName}</p>
            </div>
            <div className="flex items-center gap-2 px-2">
              <Clock size={12} />
              <p className="font-black uppercase text-[9px] tracking-[0.4em]">
                {currentTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) || "--:--:--"}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-2 opacity-40">
              <Activity size={12} />
              <p className="font-black uppercase text-[9px] tracking-[0.4em]">Logic Stable</p>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter leading-none text-stone-900">
              Settings
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-300 ml-2">Operational Preferences & Security</p>
          </div>
          
          <nav className="flex flex-wrap items-center gap-3 pt-4">
            {[
              { id: "account", label: "Account", icon: User },
              { id: "security", label: "Security", icon: Shield },
              { id: "import", label: "Import Hub", icon: RefreshCcw }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-4 px-8 py-4 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-500 ${
                  activeTab === tab.id 
                  ? "bg-stone-900 text-white shadow-2xl scale-105" 
                  : "bg-white border border-stone-100 text-stone-300 hover:text-stone-900"
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
            onClick={handleLogout}
            className="group w-full sm:w-auto px-10 py-5 rounded-[2rem] border border-stone-100 bg-white text-stone-400 hover:text-red-500 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3"
          >
            <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" />
            Logout
          </button>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto flex items-center justify-center gap-4 bg-[#A3B18A] px-12 py-5 rounded-[2rem] shadow-xl hover:brightness-110 transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin text-white" size={18} /> : <Save className="text-white" size={18} />}
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
              {isSaving ? "Saving..." : "Save Settings"}
            </span>
          </motion.button>
        </div>
      </header>

      {/* --- MAIN INTERFACE --- */}
      <main className="min-h-[600px]">
        <AnimatePresence mode="wait">
          
          {/* TAB: ACCOUNT IDENTITY */}
          {activeTab === "account" && (
            <motion.div 
              key="account"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-12"
            >
              <div className="lg:col-span-8 space-y-12">
                <section className="bg-white border border-stone-200 p-10 md:p-16 rounded-[4rem] shadow-sm space-y-16">
                  <div className="flex flex-col md:flex-row gap-16 items-start">
                    <div className="space-y-6 shrink-0 w-full md:w-auto">
                      <label className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300 ml-4">Avatar Node</label>
                      <div className="w-48 h-48 rounded-[3.5rem] bg-[#faf9f6] border border-stone-100 flex items-center justify-center overflow-hidden group relative transition-all hover:border-[#A3B18A]">
                        <span className="text-5xl font-serif italic text-stone-200 group-hover:opacity-20 transition-opacity">LD</span>
                        <label className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all duration-500 backdrop-blur-sm">
                          <Camera size={24} className="text-[#A3B18A] mb-2" />
                          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white">Update</span>
                          <input type="file" className="hidden" ref={fileInputRef} accept="image/*" />
                        </label>
                      </div>
                    </div>

                    <div className="flex-grow space-y-10 w-full">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300 ml-4">Public Identity</label>
                          <input 
                            value={displayName} 
                            onChange={(e) => setDisplayName(e.target.value)} 
                            className="w-full p-6 bg-[#faf9f6] border border-stone-100 rounded-2xl outline-none font-bold text-sm focus:border-[#A3B18A] transition-all" 
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300 ml-4">Secure Correspondence</label>
                          <input 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            className="w-full p-6 bg-[#faf9f6] border border-stone-100 rounded-2xl outline-none font-bold text-sm focus:border-[#A3B18A] transition-all" 
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300 ml-4">Neural Bio</label>
                        <textarea 
                          value={bio} 
                          onChange={(e) => setBio(e.target.value)} 
                          className="w-full p-8 bg-[#faf9f6] border border-stone-100 rounded-3xl outline-none font-serif italic text-2xl min-h-[160px] resize-none focus:border-[#A3B18A] transition-all" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-10 border-t border-stone-50">
                    <button 
                      onClick={() => router.push('/settings/team')}
                      className="w-full py-6 bg-stone-900 text-white rounded-[2rem] flex items-center justify-between px-10 group hover:shadow-2xl transition-all duration-500"
                    >
                      <div className="flex items-center gap-6">
                        <Users size={20} className="text-[#A3B18A]" />
                        <div className="text-left">
                          <p className="text-[11px] font-black uppercase tracking-widest">Team Management Hub</p>
                          <p className="text-[9px] font-serif italic text-stone-400">Configure nodes, brand DNA, and clearances</p>
                        </div>
                      </div>
                      <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                    </button>
                  </div>
                </section>
              </div>

              <aside className="lg:col-span-4 space-y-8">
                <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] shadow-sm space-y-10">
                   <div className="flex items-center gap-4">
                      <Palette size={20} className="text-stone-300" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-900">Visual System</h3>
                   </div>
                   
                   <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-[#faf9f6] rounded-2xl border border-stone-50">
                         <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Primary Hue</span>
                         <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="w-8 h-8 rounded-full border-none bg-transparent cursor-pointer" />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-[#faf9f6] rounded-2xl border border-stone-50">
                         <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Typography</span>
                         <span className="text-[10px] font-bold">Inter / Instrument</span>
                      </div>
                   </div>
                </div>

                <div className="bg-stone-900 p-10 rounded-[3.5rem] text-white flex flex-col justify-between min-h-[300px] relative overflow-hidden group">
                  <Fingerprint size={160} className="absolute -right-10 -bottom-10 opacity-5 group-hover:scale-110 transition-transform duration-1000" />
                  <div className="space-y-4 relative z-10">
                    <ShieldCheck size={32} className="text-[#A3B18A]" />
                    <h4 className="text-3xl font-serif italic">RSA Validated</h4>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 leading-relaxed">
                      All administrative changes are hashed and stored on the Elgin primary cluster.
                    </p>
                  </div>
                  <button className="relative z-10 w-full py-4 border border-white/10 rounded-2xl text-[8px] font-black uppercase tracking-widest hover:bg-white hover:text-stone-900 transition-all">
                    View Audit Logs
                  </button>
                </div>
              </aside>
            </motion.div>
          )}

          {/* TAB: SECURITY PROTOCOLS */}
          {activeTab === "security" && (
            <motion.div 
              key="security"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-12"
            >
              <div className="lg:col-span-2 space-y-12">
                 <section className="bg-white border border-stone-200 p-12 rounded-[4rem] shadow-sm">
                    <div className="flex items-center justify-between mb-12">
                      <div className="space-y-2">
                        <h3 className="text-3xl font-serif italic text-stone-900 tracking-tight">Active Sessions.</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300">Device Auth Matrix</p>
                      </div>
                      <Smartphone size={24} className="text-stone-100" />
                    </div>

                    <div className="space-y-4">
                      {sessionLogs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between p-8 rounded-3xl hover:bg-[#faf9f6] transition-all border border-transparent hover:border-stone-100 group">
                          <div className="flex items-center gap-6">
                             <div className={`w-3 h-3 rounded-full ${log.status === 'Active' ? 'bg-[#A3B18A]' : 'bg-stone-200'}`} />
                             <div>
                               <p className="text-sm font-bold text-stone-800">{log.device}</p>
                               <p className="text-[9px] font-black uppercase tracking-widest text-stone-300">{log.location}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-8">
                            <span className="text-[9px] font-black uppercase tracking-widest text-stone-300 italic">{log.time}</span>
                            <button className="opacity-0 group-hover:opacity-100 p-3 bg-red-50 text-red-400 rounded-xl transition-all hover:bg-red-500 hover:text-white">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                 </section>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white border border-stone-200 p-10 rounded-[3rem] shadow-sm flex flex-col justify-between group">
                      <Key size={48} className="text-stone-100 mb-8 group-hover:text-stone-900 transition-colors" />
                      <div>
                        <h4 className="text-2xl font-serif italic text-stone-900 mb-2">Two-Factor Auth</h4>
                        <p className="text-[9px] font-black uppercase tracking-widest text-stone-300 mb-8">Hardware keys and TOTP active</p>
                        <button className="px-8 py-4 bg-stone-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl">Configure 2FA</button>
                      </div>
                    </div>
                    <div className="bg-[#A3B18A] p-10 rounded-[3rem] text-white flex flex-col justify-between group">
                      <Zap size={48} className="text-white mb-8 group-hover:scale-110 transition-transform" />
                      <div>
                        <h4 className="text-2xl font-serif italic text-white mb-2">Fast Access</h4>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/60 mb-8">Biometric relay for desktop apps</p>
                        <button className="px-8 py-4 bg-white text-stone-900 rounded-2xl text-[9px] font-black uppercase tracking-widest">Setup FaceID</button>
                      </div>
                    </div>
                 </div>
              </div>

              <aside className="space-y-8">
                <div className="bg-red-50 border border-red-100 p-10 rounded-[3.5rem] space-y-8">
                   <div className="flex items-center gap-4 text-red-500">
                      <AlertTriangle size={24} />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">Danger Zone</h3>
                   </div>
                   <p className="text-[11px] font-serif italic text-red-400 leading-relaxed">
                     Actions here are irreversible. Deleting nodes or terminating your root identity will result in total data loss.
                   </p>
                   <button className="w-full py-5 border border-red-200 text-red-500 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                     Delete Account
                   </button>
                </div>

                <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] shadow-sm flex flex-col items-center text-center space-y-6">
                  <Cpu size={48} className="text-stone-100" />
                  <h4 className="text-xl font-serif italic">Operational Core</h4>
                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-300 leading-relaxed">
                    Last logic rotation: May 14, 2026. Next rotation scheduled in 72 hours.
                  </p>
                </div>
              </aside>
            </motion.div>
          )}

          {/* TAB: IMPORT HUB */}
          {activeTab === "import" && (
            <motion.div 
              key="import"
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-12"
            >
              <section className="bg-white border border-stone-200 p-12 rounded-[4rem] shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
                  <div className="flex items-center gap-8">
                    <div className="p-6 bg-stone-900 rounded-[2.5rem] text-[#A3B18A]">
                      <RefreshCcw size={32} className={importStatus !== 'idle' ? 'animate-spin' : ''} />
                    </div>
                    <div>
                      <h2 className="text-5xl font-serif italic text-stone-900 tracking-tighter leading-none">Import Hub.</h2>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300 mt-2">External Data Ingestion Pipeline</p>
                    </div>
                  </div>
                  <button 
                    onClick={triggerImport}
                    disabled={importStatus !== 'idle'}
                    className="px-12 py-6 bg-stone-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    {importStatus === 'idle' ? 'Trigger New Ingestion' : 'Ingestion in Progress...'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {sources.map((source, i) => (
                    <div key={i} className="p-10 rounded-[3rem] bg-[#faf9f6] border border-stone-50 group hover:border-[#A3B18A] transition-all duration-500">
                       <div className="flex justify-between items-start mb-10">
                          <div className="p-4 bg-white rounded-2xl shadow-sm">
                             {source.type === 'Database' ? <Database size={20} className="text-[#A3B18A]" /> : <HardDrive size={20} className="text-[#A3B18A]" />}
                          </div>
                          <span className="text-[8px] font-black uppercase tracking-widest text-[#A3B18A] bg-[#A3B18A]/10 px-3 py-1 rounded-full">Healthy</span>
                       </div>
                       <h4 className="text-2xl font-serif italic text-stone-900 mb-2">{source.name}</h4>
                       <p className="text-[10px] font-black uppercase tracking-widest text-stone-300 mb-8">{source.type}</p>
                       <div className="pt-6 border-t border-stone-100 flex justify-between items-center">
                          <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Sync: {source.lastSync}</span>
                          <Edit3 size={14} className="text-stone-200 group-hover:text-stone-900 cursor-pointer" />
                       </div>
                    </div>
                  ))}
                  <button className="border-2 border-dashed border-stone-100 rounded-[3rem] flex flex-col items-center justify-center gap-4 text-stone-200 hover:border-[#A3B18A] hover:text-[#A3B18A] transition-all group p-10">
                    <Plus size={32} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Provision New Source</span>
                  </button>
                </div>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="bg-stone-900 p-12 rounded-[4rem] text-white space-y-8">
                    <FileJson size={32} className="text-[#A3B18A]" />
                    <h3 className="text-3xl font-serif italic">Schema Mapping</h3>
                    <p className="text-xs font-serif italic text-stone-400 leading-relaxed max-w-md">
                      TOTS OS automatically normalizes incoming JSON and SQL structures to fit the local architecture. You can manually override relationships here.
                    </p>
                    <button className="px-8 py-4 bg-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">
                      Open Schema Editor
                    </button>
                 </div>
                 <div className="bg-[#A3B18A] p-12 rounded-[4rem] text-white flex flex-col justify-between">
                    <Server size={32} />
                    <div className="space-y-4">
                      <h3 className="text-3xl font-serif italic text-stone-900">Relay Stability</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-stone-900/60">Cross-node latency: 12ms</p>
                    </div>
                    <div className="w-full bg-stone-900/10 h-1.5 rounded-full overflow-hidden mt-8">
                      <div className="bg-stone-900 h-full w-[94%]" />
                    </div>
                 </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* --- UTILITY GRID --- */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-12 border-t border-stone-200">
        {[
          { label: "Credentials", icon: Key, val: "Verified" },
          { label: "Mobile Sync", icon: Smartphone, val: "Active" },
          { label: "Data Integrity", icon: CheckSquare, val: "Nominal" },
          { label: "System Relay", icon: Globe, val: "Online" }
        ].map((u, i) => (
          <div key={i} className="bg-white border border-stone-200 p-8 rounded-[2.5rem] flex items-center justify-between group hover:border-[#A3B18A] transition-all cursor-pointer">
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
      <footer className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#A3B18A] animate-pulse shadow-[0_0_8px_rgba(163,177,138,0.5)]" />
            <span className="text-[8px] font-black uppercase tracking-widest text-stone-300">Architecture Nominal</span>
          </div>
          <p className="text-[10px] font-serif italic text-stone-300">TOTS Operating System // Core Hub // 2026</p>
        </div>
        <div className="flex items-center gap-6">
           <button className="text-[8px] font-black uppercase tracking-widest text-stone-300 hover:text-stone-900 transition-colors">Privacy Protocol</button>
           <button className="text-[8px] font-black uppercase tracking-widest text-stone-300 hover:text-stone-900 transition-colors">System Terms</button>
           <button 
            onClick={handleLogout}
            className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-stone-300 hover:text-red-500 transition-colors group"
           >
            <LogOut size={12} className="group-hover:-translate-x-1 transition-transform" /> Terminate
           </button>
        </div>
      </footer>

    </div>
  );
}