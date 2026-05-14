"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { 
  Search, Download, Activity, 
  Plus, File, Database, Layers,
  ShieldCheck, History, X, Clock,
  Lock, Fingerprint, Zap, ChevronRight,
  Monitor, LayoutGrid, Server
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";

/**
 * TOTS OS: VAULT ARCHIVE v4.5 - "SAGE & STONE" EDITION
 * Neural Editor & Strategic Archive
 */

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
  const [vaultData, setVaultData] = useState<Project[]>(INITIAL_RECORDS);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_RECORDS[0].id);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleContentUpdate = (newContent: string) => {
    setVaultData(prev => prev.map(p => 
      p.id === selectedId ? { ...p, content: newContent } : p
    ));
  };

  const syncArchive = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1200));
    setIsSaving(false);
    toast.success("Archive Integrity Verified");
  };

  const exportPDF = async () => {
    if (!printRef.current) return;
    toast.info("Generating Neural Export...");
    const canvas = await html2canvas(printRef.current, { scale: 2 });
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297);
    pdf.save(`${currentProject.id}_RECORD.pdf`);
  };

  return (
    <div className="h-screen bg-[#faf9f6] text-stone-900 flex overflow-hidden font-sans">
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&family=Inter:wght@300;400;700;900&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* --- LEFT: ARCHIVAL NAVIGATOR --- */}
      <aside className="w-80 flex flex-col p-8 bg-white border-r border-stone-100 relative z-[100]">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-[#A3B18A] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300">Vault Core</span>
          </div>
          <h2 className="text-4xl font-serif italic tracking-tighter">Archives</h2>
        </header>

        <div className="space-y-6 mb-10">
          <div className="relative group">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-200" />
            <input 
              className="w-full bg-[#faf9f6] rounded-2xl py-4 pl-12 pr-4 text-[10px] font-bold outline-none border border-transparent focus:border-[#A3B18A] transition-all"
              placeholder="Search logic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${!activeCategory ? 'bg-stone-900 text-[#A3B18A]' : 'bg-[#faf9f6] text-stone-300'}`}
            >
              All
            </button>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-stone-900 text-[#A3B18A]' : 'bg-[#faf9f6] text-stone-300'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
          {filteredData.map(p => (
            <button 
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`w-full text-left p-6 rounded-[2rem] transition-all duration-500 group relative ${
                selectedId === p.id 
                  ? "bg-[#faf9f6] border border-stone-100 shadow-sm" 
                  : "hover:bg-stone-50/50"
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`text-[10px] font-black uppercase tracking-widest ${selectedId === p.id ? "text-stone-900" : "text-stone-300"}`}>
                  {p.title}
                </span>
                {selectedId === p.id && <div className="w-1 h-1 rounded-full bg-[#A3B18A]" />}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-bold text-[#A3B18A] tracking-widest">{p.id}</span>
                <span className="text-[8px] font-serif italic text-stone-300">{p.metadata.status}</span>
              </div>
            </button>
          ))}
        </nav>

        <div className="pt-8 border-t border-stone-100 space-y-4">
           <button className="w-full py-5 bg-stone-900 text-white rounded-[2rem] flex items-center justify-center gap-3 hover:bg-[#A3B18A] transition-all group active:scale-95 shadow-xl">
              <Plus size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">New Entry</span>
           </button>
        </div>
      </aside>

      {/* --- CENTER: THE NEURAL DESK --- */}
      <main className="flex-1 flex flex-col relative bg-[#faf9f6] overflow-hidden">
        
        <header className="h-24 flex items-center justify-between px-12 border-b border-stone-100 bg-white/50 backdrop-blur-md relative z-10">
          <div className="flex items-center gap-10">
            <div>
               <p className="text-[8px] font-black tracking-[0.4em] text-[#A3B18A] uppercase">Index Node</p>
               <p className="text-[10px] font-bold">{currentProject.id}</p>
            </div>
            <div className="h-6 w-[1px] bg-stone-100" />
            <div>
               <p className="text-[8px] font-black tracking-[0.4em] text-stone-300 uppercase">Version</p>
               <p className="text-[10px] font-bold text-stone-400 italic">v.{currentProject.metadata.version}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className={`p-3 rounded-xl transition-all ${showHistory ? 'bg-stone-900 text-[#A3B18A]' : 'bg-white text-stone-300 border border-stone-100 shadow-sm'}`}
            >
              <History size={16} />
            </button>
            <button onClick={exportPDF} className="p-3 bg-white text-stone-300 border border-stone-100 rounded-xl shadow-sm hover:text-stone-900">
              <Download size={16} />
            </button>
            <button 
              onClick={syncArchive} 
              disabled={isSaving}
              className="px-10 py-4 bg-stone-900 text-[#A3B18A] rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl disabled:opacity-50 flex items-center gap-3"
            >
              {isSaving ? <Clock size={14} className="animate-spin" /> : <Fingerprint size={14} />}
              {isSaving ? "Syncing" : "Sync Archive"}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-32 pt-12 px-12">
          <div className="max-w-4xl mx-auto flex gap-12 items-start">
            
            <motion.div 
              key={selectedId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 bg-white min-h-[1000px] shadow-2xl shadow-stone-200/50 rounded-[4rem] p-20 sm:p-28 flex flex-col border border-stone-100 relative"
              ref={printRef}
            >
              <div className="absolute top-10 right-10 opacity-[0.03] pointer-events-none">
                <Database size={180} />
              </div>

              <header className="mb-20 space-y-4">
                <div className="flex items-center gap-4">
                   <div className="px-3 py-1 bg-[#A3B18A]/10 text-[#A3B18A] rounded-full text-[8px] font-black uppercase tracking-widest">
                      {currentProject.metadata.status}
                   </div>
                   <span className="text-[8px] font-black tracking-widest text-stone-200 uppercase">Integrity: {currentProject.metadata.integrity}</span>
                </div>
                <h1 className="text-6xl font-serif italic text-stone-900 tracking-tighter leading-tight">
                  {currentProject.title}
                </h1>
              </header>

              <textarea 
                className="flex-1 w-full text-2xl font-serif italic leading-relaxed text-stone-600 outline-none resize-none bg-transparent"
                value={currentProject.content}
                onChange={(e) => handleContentUpdate(e.target.value)}
                spellCheck={false}
              />

              <footer className="mt-20 pt-10 border-t border-stone-50 grid grid-cols-2 gap-10">
                <div className="space-y-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-300">Manifest</p>
                  <div className="space-y-2">
                    {currentProject.attachments.map(at => (
                      <div key={at.id} className="flex items-center justify-between p-4 bg-[#faf9f6] rounded-2xl border border-stone-50">
                        <div className="flex items-center gap-3">
                          <File size={12} className="text-[#A3B18A]" />
                          <span className="text-[9px] font-bold text-stone-600">{at.name}</span>
                        </div>
                        <span className="text-[8px] font-black text-stone-200 uppercase">{at.size}</span>
                      </div>
                    ))}
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 p-4 text-stone-300 hover:text-stone-900 transition-colors">
                      <Plus size={14} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Attach Resource</span>
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" />
                  </div>
                </div>
                <div className="text-right flex flex-col justify-end gap-1">
                   <p className="text-[8px] font-black text-stone-200 uppercase tracking-widest">Last Audit</p>
                   <p className="text-[10px] font-bold text-stone-400 mb-4">{currentProject.metadata.lastUpdated}</p>
                   <div className="flex items-center justify-end gap-2 text-[#A3B18A]">
                      <ShieldCheck size={14} />
                      <span className="text-[8px] font-black uppercase tracking-widest">Encrypted Entry</span>
                   </div>
                </div>
              </footer>
            </motion.div>

            <AnimatePresence>
              {showHistory && (
                <motion.aside initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="w-80 space-y-6">
                  <section className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-xl space-y-8">
                     <div className="flex justify-between items-center">
                       <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-900">Neural Log</h3>
                       <button onClick={() => setShowHistory(false)}><X size={14} className="text-stone-300" /></button>
                     </div>
                     <div className="space-y-8">
                        {currentProject.history.map(rev => (
                          <div key={rev.id} className="space-y-2 pl-4 border-l-2 border-[#A3B18A]/20">
                             <p className="text-[10px] font-bold">{rev.author}</p>
                             <p className="text-[8px] font-black text-stone-300 uppercase">{rev.timestamp}</p>
                             <p className="text-[10px] font-serif italic text-stone-400">{rev.summary}</p>
                          </div>
                        ))}
                     </div>
                  </section>
                  <section className="bg-stone-900 p-10 rounded-[3rem] text-white relative overflow-hidden group">
                     <Zap size={80} className="absolute -right-6 -bottom-6 opacity-10 group-hover:rotate-12 transition-transform" />
                     <h5 className="text-xl font-serif italic text-[#A3B18A] mb-2">Neural Scan</h5>
                     <p className="text-[10px] font-serif italic opacity-50 mb-6">94% Brand Alignment detected in this logic block.</p>
                     <button className="w-full py-3 bg-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-white/20">Refine Clarity</button>
                  </section>
                </motion.aside>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* --- RIGHT: SYSTEM NAV --- */}
      <aside className="w-20 hover:w-64 bg-white border-l border-stone-100 transition-all duration-500 group overflow-hidden z-[150]">
        <div className="flex flex-col h-full p-6">
           <div className="mb-16 flex justify-center group-hover:justify-start">
             <Layers size={20} className="text-[#A3B18A]" />
           </div>

           <div className="flex-1 space-y-12 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="space-y-6">
                <p className="text-[9px] font-black uppercase tracking-widest text-stone-300">Quick Actions</p>
                <div className="grid grid-cols-2 gap-3">
                  <button className="aspect-square bg-[#faf9f6] rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-[#A3B18A] hover:text-white transition-all group/btn">
                    <Monitor size={16} />
                    <span className="text-[7px] font-black uppercase tracking-widest">Dash</span>
                  </button>
                  <button className="aspect-square bg-[#faf9f6] rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-[#A3B18A] hover:text-white transition-all group/btn">
                    <LayoutGrid size={16} />
                    <span className="text-[7px] font-black uppercase tracking-widest">Apps</span>
                  </button>
                  <button className="aspect-square bg-[#faf9f6] rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-[#A3B18A] hover:text-white transition-all group/btn">
                    <Server size={16} />
                    <span className="text-[7px] font-black uppercase tracking-widest">Status</span>
                  </button>
                </div>
              </div>
           </div>

           <div className="mt-auto flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-stone-900 flex items-center justify-center text-white text-[10px] font-serif italic shrink-0">L</div>
              <div className="hidden group-hover:block whitespace-nowrap">
                 <p className="text-[10px] font-bold">Leigha D.</p>
                 <p className="text-[8px] font-black text-[#A3B18A] uppercase">Root Admin</p>
              </div>
           </div>
        </div>
      </aside>

    </div>
  );
}