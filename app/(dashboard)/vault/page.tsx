"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { 
  Search, Download, Folder, ChevronDown, 
  Sparkles, ShieldCheck, Activity, 
  Trash2, Save, X, Clock, File, Paperclip, 
  Settings, Share2, Globe, ArrowUpRight,
  Database, Layers, Plus, Hash, User,
  Lock, CheckCircle2, AlertCircle, History,
  FileText, Copy, ExternalLink, Filter, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";

/**
 * TOTS OS: VAULT ARCHIVE v4.5
 * ARCHITECTURAL CORE & NEURAL EDITOR
 * * DESIGN PRINCIPLES:
 * 1. Visual Reduction: Small text scales (8px - 10px labels).
 * 2. High-Fidelity Motion: Bezier-based transitions.
 * 3. Spatial Focus: Heavy use of white space and document-centric layouts.
 */

// --- TYPES ---
interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
  addedAt: string;
}

interface Revision {
  id: string;
  timestamp: string;
  author: string;
  summary: string;
}

interface Project {
  id: string;
  title: string;
  category: string;
  content: string;
  metadata: {
    lastUpdated: string;
    status: "Verified" | "Draft" | "Archived" | "Permanent";
    readTime: string;
    version: string;
    integrity: string;
  };
  attachments: Attachment[];
  history: Revision[];
}

// --- CONSTANTS & MOCK DATA ---
const INITIAL_RECORDS: Project[] = [
  { 
    id: "VAL-001", 
    title: "The Client Ethos", 
    category: "Philosophy", 
    content: `Precision is the primary directive. \n\nIn every interaction, we aim to eliminate the friction between intent and execution. The Vault acts as the final arbiter of truth for the organization, housing the foundational logic that governs our outreach and operations.\n\n1. Response latency must remain below 4 hours.\n2. All strategic pivots must be logged and audited.\n3. The aesthetic is the brand.`,
    metadata: { 
      lastUpdated: "14 May 2026", 
      status: "Permanent", 
      readTime: "3m",
      version: "2.4.1",
      integrity: "99.98%"
    },
    attachments: [
      { id: "at-1", name: "onboarding_workflow.pdf", size: "2.4MB", type: "PDF", addedAt: "2026-04-12" }
    ],
    history: [
      { id: "rev-1", timestamp: "2026-05-14 10:22", author: "L. Day-Clark", summary: "Refined section 3 regarding brand aesthetics." }
    ]
  },
  { 
    id: "VAL-082", 
    title: "Brand Voice Guidelines", 
    category: "Identity", 
    content: `Our voice is reassured, never aggressive. \n\nWe speak with the authority of an expert but the curiosity of a student. Avoid corporate buzzwords. Use full stops. Lean into the white space. The system should feel like a breathing entity—calm, organized, and inevitable.`,
    metadata: { 
      lastUpdated: "02 May 2026", 
      status: "Draft", 
      readTime: "5m",
      version: "1.0.8",
      integrity: "100%"
    },
    attachments: [],
    history: []
  }
];

export default function VaultNeuralEngine() {
  // -- State Management --
  const [vaultData, setVaultData] = useState<Project[]>(INITIAL_RECORDS);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_RECORDS[0].id);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  // -- Refs --
  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -- Lifecycle --
  useEffect(() => { setIsMounted(true); }, []);

  // -- Computed Logic --
  const currentProject = useMemo(() => 
    vaultData.find(p => p.id === selectedId) || vaultData[0],
  [selectedId, vaultData]);

  const filteredData = useMemo(() => {
    return vaultData.filter(item => 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!activeCategory || item.category === activeCategory)
    );
  }, [searchTerm, vaultData, activeCategory]);

  const categories = useMemo(() => Array.from(new Set(vaultData.map(d => d.category))), [vaultData]);

  // -- Actions --
  const handleContentUpdate = (newContent: string) => {
    setVaultData(prev => prev.map(p => 
      p.id === selectedId ? { ...p, content: newContent } : p
    ));
  };

  const syncArchive = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsSaving(false);
    toast.success("Archive Integrity Verified & Synced");
  };

  const exportPDF = async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current);
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297);
    pdf.save(`${currentProject.id}_RECORD.pdf`);
    toast.info("Generating Neural Export...");
  };

  if (!isMounted) return null;

  return (
    <div className="h-screen bg-[#FDFCFB] text-[#2C2C2C] flex overflow-hidden selection:bg-[#A3B18A] selection:text-white font-sans">
      
      {/* --- GLOBAL STYLES --- */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&family=Inter:wght@300;400;700;900&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        textarea::placeholder { color: #E5E1DB; }
        .subtle-blur { backdrop-filter: blur(40px) saturate(120%); }
      `}</style>

      {/* --- LEFT: ARCHIVAL NAVIGATOR --- */}
      <aside className="w-80 flex flex-col p-8 bg-[#FDFCFB] border-r border-stone-100/50 relative z-[100]">
        <header className="mb-14">
          <div className="flex items-center gap-3 mb-2 px-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#A3B18A] shadow-[0_0_12px_rgba(163,177,138,0.8)] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-300">Vault Core</span>
          </div>
          <p className="text-[9px] text-stone-200 font-serif italic ml-1">System Version: 4.5.0-A</p>
        </header>

        {/* SEARCH & FILTERS */}
        <div className="space-y-6 mb-12">
          <div className="relative group">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-200 group-focus-within:text-[#A3B18A] transition-colors" />
            <input 
              className="w-full bg-transparent border-b border-stone-100 py-3 pl-8 text-[10px] outline-none transition-all focus:border-[#A3B18A] placeholder-stone-200"
              placeholder="Query Archives..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            <button 
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${!activeCategory ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-300 hover:text-stone-600'}`}
            >
              All
            </button>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-300 hover:text-stone-600'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* RECORDS LIST */}
        <nav className="flex-1 space-y-12 overflow-y-auto no-scrollbar">
          <div className="space-y-2">
            {filteredData.map(p => (
              <button 
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`w-full text-left px-5 py-4 rounded-3xl transition-all duration-500 flex flex-col gap-1 group relative ${
                  selectedId === p.id 
                    ? "bg-white shadow-[0_15px_40px_-10px_rgba(0,0,0,0.03)] border border-stone-100" 
                    : "hover:bg-stone-50/50"
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className={`text-[10px] tracking-tight uppercase font-black ${selectedId === p.id ? "text-stone-900" : "text-stone-300"}`}>
                    {p.title}
                  </span>
                  {selectedId === p.id && <div className="w-1 h-1 rounded-full bg-[#A3B18A]" />}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-bold text-stone-200 uppercase tracking-widest">{p.id}</span>
                  <span className="text-stone-100">•</span>
                  <span className="text-[8px] font-serif italic text-stone-300">{p.metadata.status}</span>
                </div>
              </button>
            ))}
          </div>
        </nav>

        {/* BOTTOM UTILITY */}
        <div className="pt-8 border-t border-stone-50 space-y-4">
           <button className="w-full flex items-center justify-between group">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-300 group-hover:text-[#A3B18A] transition-colors">Storage: 2.4 GB</span>
              <Activity size={12} className="text-stone-200 group-hover:text-[#A3B18A]" />
           </button>
           <button className="w-full py-4 bg-stone-900 text-white rounded-3xl flex items-center justify-center gap-3 hover:bg-[#A3B18A] transition-all group active:scale-95 shadow-xl shadow-stone-200/40">
              <Plus size={14} className="group-hover:rotate-90 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Generate Entry</span>
           </button>
        </div>
      </aside>

      {/* --- CENTER: THE NEURAL DESK --- */}
      <main className="flex-1 flex flex-col relative bg-[#F9F8F6] overflow-hidden">
        
        {/* TOP TOOLBAR */}
        <header className="h-24 flex items-center justify-between px-16 shrink-0 relative z-10 border-b border-stone-100/40 subtle-blur bg-white/30">
          <div className="flex items-center gap-12">
            <div className="flex flex-col">
               <span className="text-[8px] font-black tracking-[0.4em] text-[#A3B18A] uppercase mb-1">Index Node</span>
               <span className="text-[10px] font-bold text-stone-900">{currentProject.id}</span>
            </div>
            <div className="h-8 w-[1px] bg-stone-100" />
            <div className="flex flex-col">
               <span className="text-[8px] font-black tracking-[0.4em] text-stone-300 uppercase mb-1">Revision Level</span>
               <span className="text-[10px] font-bold text-stone-500 italic">v.{currentProject.metadata.version}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className={`p-3 rounded-full transition-all ${showHistory ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-300 hover:text-stone-900 bg-white/50'}`}
            >
              <History size={14} strokeWidth={2} />
            </button>
            <button onClick={exportPDF} className="p-3 text-stone-300 hover:text-stone-900 bg-white/50 rounded-full transition-all">
              <Download size={14} strokeWidth={2} />
            </button>
            <button 
              onClick={syncArchive} 
              disabled={isSaving}
              className="px-12 py-4 bg-stone-900 text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-stone-300/40 hover:bg-[#A3B18A] transition-all active:scale-95 flex items-center gap-4 group disabled:opacity-50"
            >
              {isSaving ? <Clock size={14} className="animate-spin" /> : <Fingerprint size={14} className="group-hover:scale-110 transition-transform" />}
              {isSaving ? "Synchronizing" : "Sync Archive"}
            </button>
          </div>
        </header>

        {/* PRIMARY CANVAS AREA */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-32 pt-16 px-16">
          <div className="max-w-4xl mx-auto flex gap-12">
            
            {/* THE DOCUMENT SCROLL */}
            <motion.div 
              key={selectedId}
              initial={{ opacity: 0, scale: 0.99, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 bg-white min-h-[120vh] shadow-[0_50px_100px_-30px_rgba(0,0,0,0.04)] rounded-[4rem] p-24 sm:p-32 flex flex-col border border-stone-100/30 relative"
              ref={printRef}
            >
              {/* WATERMARK LOGIC */}
              <div className="absolute top-12 right-12 opacity-[0.03] select-none pointer-events-none">
                <Database size={200} />
              </div>

              {/* HEADER CONTENT */}
              <header className="mb-24 space-y-6">
                <div className="flex items-center gap-4">
                   <div className={`px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-[0.2em] ${currentProject.metadata.status === 'Permanent' ? 'bg-[#A3B18A]/10 text-[#A3B18A]' : 'bg-stone-100 text-stone-400'}`}>
                      {currentProject.metadata.status}
                   </div>
                   <span className="text-[8px] font-black tracking-[0.3em] text-stone-200 uppercase">Integrity: {currentProject.metadata.integrity}</span>
                </div>
                <h1 className="text-6xl sm:text-7xl font-serif italic text-stone-900 tracking-tighter leading-none">
                  {currentProject.title}
                </h1>
              </header>

              {/* EDITOR */}
              <textarea 
                className="flex-1 w-full text-xl sm:text-2xl font-serif italic leading-[1.9] text-stone-600 outline-none resize-none bg-transparent placeholder-stone-100"
                value={currentProject.content}
                onChange={(e) => handleContentUpdate(e.target.value)}
                spellCheck={false}
                placeholder="Transcribe the logic here..."
              />

              {/* DYNAMIC FOOTER SECTION */}
              <footer className="mt-24 pt-12 border-t border-stone-50/80 grid grid-cols-2 gap-12">
                <div className="space-y-6">
                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-200">Attachment Manifest</p>
                  <div className="space-y-2">
                    {currentProject.attachments.length > 0 ? (
                      currentProject.attachments.map(at => (
                        <div key={at.id} className="flex items-center justify-between p-3 bg-stone-50/50 rounded-2xl border border-stone-100 group transition-all hover:bg-white hover:shadow-sm">
                          <div className="flex items-center gap-3">
                            <File size={12} className="text-stone-300" />
                            <span className="text-[9px] font-bold text-stone-600">{at.name}</span>
                          </div>
                          <span className="text-[8px] font-black text-stone-200 uppercase">{at.size}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] font-serif italic text-stone-300">No resources linked.</p>
                    )}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-4 flex items-center gap-3 text-stone-300 hover:text-[#A3B18A] transition-all group"
                    >
                      <div className="w-8 h-8 rounded-full border border-dashed border-stone-200 flex items-center justify-center group-hover:border-[#A3B18A] group-hover:border-solid transition-all">
                        <Plus size={12} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Link Resource</span>
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" />
                  </div>
                </div>
                
                <div className="text-right flex flex-col justify-end gap-2">
                   <div className="flex justify-end gap-4 mb-4">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-stone-200 uppercase">Audit Date</span>
                        <span className="text-[10px] font-bold text-stone-400">{currentProject.metadata.lastUpdated}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-stone-200 uppercase">Read Time</span>
                        <span className="text-[10px] font-bold text-stone-400 italic">{currentProject.metadata.readTime}</span>
                      </div>
                   </div>
                   <div className="flex items-center justify-end gap-2 text-stone-200">
                      <ShieldCheck size={14} />
                      <span className="text-[9px] font-black uppercase tracking-[0.3em]">Encrypted Node</span>
                   </div>
                </div>
              </footer>
            </motion.div>

            {/* SIDEBAR OVERLAY: REVISION HISTORY */}
            <AnimatePresence>
              {showHistory && (
                <motion.aside 
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  className="w-80 flex flex-col gap-8 shrink-0"
                >
                  <section className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-xl shadow-stone-200/20 space-y-8">
                     <div className="flex justify-between items-center">
                       <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-900">Neural History</h3>
                       <button onClick={() => setShowHistory(false)}><X size={14} className="text-stone-300" /></button>
                     </div>
                     
                     <div className="space-y-8">
                        {currentProject.history.length > 0 ? (
                          currentProject.history.map(rev => (
                            <div key={rev.id} className="space-y-3 relative pl-6 border-l border-stone-100">
                               <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-white border border-stone-200" />
                               <div className="flex flex-col">
                                  <span className="text-[9px] font-bold text-stone-900">{rev.author}</span>
                                  <span className="text-[8px] font-black text-stone-200 uppercase">{rev.timestamp}</span>
                               </div>
                               <p className="text-[10px] font-serif italic text-stone-400 leading-relaxed">{rev.summary}</p>
                            </div>
                          ))
                        ) : (
                          <div className="py-12 text-center space-y-4">
                            <Clock size={24} className="mx-auto text-stone-100" />
                            <p className="text-[10px] font-serif italic text-stone-300">Initial version. No revisions found.</p>
                          </div>
                        )}
                     </div>
                  </section>

                  <section className="bg-stone-900 p-10 rounded-[3rem] text-white space-y-6 relative overflow-hidden group">
                     <Zap size={100} className="absolute -right-8 -bottom-8 opacity-5 group-hover:rotate-12 transition-transform duration-700" />
                     <h5 className="text-2xl font-serif italic text-[#A3B18A] tracking-tighter">AI Synth Analysis.</h5>
                     <p className="text-[10px] font-serif italic opacity-50 leading-relaxed">
                        This document aligns with 94% of your core organizational philosophy. Suggesting 2 structural improvements for clarity.
                     </p>
                     <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Review Suggestions</button>
                  </section>
                </motion.aside>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* --- RIGHT: GLOBAL SYSTEM NAVIGATION (QUICK) --- */}
      <aside className="w-20 hover:w-80 flex flex-col bg-white border-l border-stone-50 transition-all duration-700 group/nav overflow-hidden relative z-[150]">
        <div className="p-8 flex flex-col h-full">
           <div className="mb-20 self-center group-hover/nav:self-start">
             <Layers size={18} className="text-stone-200 group-hover/nav:text-[#A3B18A] transition-colors" />
           </div>

           <div className="flex-1 space-y-16 opacity-0 group-hover/nav:opacity-100 transition-all duration-700 delay-100">
              <section className="space-y-8">
                 <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-300">Operational Nodes</h4>
                 <div className="grid grid-cols-2 gap-4">
                   {[
                     { icon: <Sparkles size={16}/>, label: "Clarity", color: "hover:bg-amber-50" },
                     { icon: <ShieldCheck size={16}/>, label: "Shield", color: "hover:bg-blue-50" },
                     { icon: <Settings size={16}/>, label: "Control", color: "hover:bg-stone-50" },
                     { icon: <Globe size={16}/>, label: "Public", color: "hover:bg-stone-50" }
                   ].map((item, i) => (
                     <button key={i} className="aspect-square rounded-[2rem] border border-stone-50 flex flex-col items-center justify-center gap-3 transition-all hover:shadow-xl hover:shadow-stone-200/50 group/btn">
                        <div className="text-stone-200 group-hover/btn:text-stone-900 transition-colors">{item.icon}</div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-stone-300 group-hover/btn:text-stone-900">{item.label}</span>
                     </button>
                   ))}
                 </div>
              </section>

              <section className="space-y-6">
                 <div className="flex items-center justify-between">
                    <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-300">Live Status</h4>
                    <span className="text-[8px] font-bold text-[#A3B18A] animate-pulse">Synced</span>
                 </div>
                 <div className="space-y-4">
                    <div className="flex justify-between items-end">
                       <span className="text-[10px] font-serif italic text-stone-400">Node Latency</span>
                       <span className="text-[9px] font-black text-stone-900 uppercase">12ms</span>
                    </div>
                    <div className="w-full h-1 bg-stone-50 rounded-full overflow-hidden">
                       <motion.div 
                          animate={{ x: [-100, 300] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          className="w-1/3 h-full bg-[#A3B18A] blur-[2px]"
                       />
                    </div>
                 </div>
              </section>
           </div>
           
           <div className="mt-auto flex flex-col items-center group-hover/nav:items-start gap-4 transition-all duration-500">
              <div className="w-10 h-10 rounded-full bg-stone-900 flex items-center justify-center text-white text-[10px] font-serif italic border-4 border-stone-50 group-hover/nav:border-[#A3B18A]/20 transition-all shadow-xl">L</div>
              <div className="hidden group-hover/nav:block">
                 <p className="text-[10px] font-bold text-stone-900 tracking-tight">Leigha Day-Clark</p>
                 <p className="text-[8px] font-black text-stone-200 uppercase tracking-widest">Admin Access</p>
              </div>
           </div>
        </div>
      </aside>

      {/* --- GLOBAL STATUS FOOTER --- */}
      <footer className="fixed bottom-0 left-0 w-full h-12 bg-white/30 backdrop-blur-xl border-t border-stone-100/30 px-10 flex items-center justify-between z-[200]">
         <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
               <div className="w-1 h-1 rounded-full bg-[#A3B18A]" />
               <span className="text-[8px] font-black uppercase tracking-[0.3em] text-stone-300">All Systems Nominal</span>
            </div>
            <div className="flex items-center gap-3">
               <Lock size={10} className="text-stone-200" />
               <span className="text-[8px] font-black uppercase tracking-[0.3em] text-stone-200">End-to-End Encryption Enabled</span>
            </div>
         </div>
         <div className="flex items-center gap-6">
            <span className="text-[9px] font-serif italic text-stone-300 tracking-tighter">Powered by TOTS Neural Engine v4.5</span>
            <div className="h-4 w-[1px] bg-stone-100" />
            <span className="text-[8px] font-black uppercase tracking-[0.5em] text-stone-300">2026</span>
         </div>
      </footer>

    </div>
  );
}

// --- HELPER ICONS ---
const Fingerprint = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10" />
    <path d="M5 12c0-3.866 3.134-7 7-7s7 3.134 7 7" />
    <path d="M8 12c0-2.209 1.791-4 4-4s4 1.791 4 4" />
    <path d="M12 12h.01" />
    <path d="M11 12c0-1.657 1.343-3 3-3" />
    <path d="M12 22v-3" />
    <path d="M12 15v-1" />
  </svg>
);

const UserCircle = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="10" r="3" />
    <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
  </svg>
);