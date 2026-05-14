"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { 
  Search, Download, Activity, 
  Plus, File, Database, Layers,
  ShieldCheck, History, X, Clock,
  Lock, Fingerprint, Zap, ChevronRight,
  Monitor, LayoutGrid, Server, BarChart3, Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

/**
 * TOTS OS: VAULT ARCHIVE v7.1.0 - "SAGE & STONE"
 * REVISION: SCALE ALIGNMENT | NAV SYNC | NEURAL ENGINE
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
      { id: "rev-1", timestamp: "2026-05-14 10:22", author: "Leigha D.", summary: "Refined section 3 regarding brand aesthetics." }
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
  const router = useRouter();
  
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
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* --- ARCHIVAL NAVIGATOR --- */}
      <aside className="w-80 flex flex-col p-8 bg-white border-r border-stone-100 relative z-[100] text-left">
        <header className="mb-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-stone-900 text-[#a9b897] rounded-xl"><Database size={18} /></div>
            <div className="space-y-0.5">
              <p className="font-black uppercase text-[8px] tracking-[0.4em] text-stone-300">VAULT_CORE_7.1</p>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-[#a9b897] rounded-full animate-pulse" />
                <p className="text-[7px] font-mono tracking-widest text-[#a9b897] uppercase">Integrity Locked</p>
              </div>
            </div>
          </div>
          <h2 className="text-4xl font-serif italic tracking-tighter">Archives</h2>
        </header>

        <div className="space-y-4 mb-8">
          <div className="relative">
            <Search size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" />
            <input 
              className="w-full bg-[#faf9f6] rounded-xl py-3.5 pl-10 pr-4 text-[9px] font-bold outline-none border border-transparent focus:border-[#a9b897] transition-all"
              placeholder="Search logic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveCategory(null)} className={`px-4 py-2 rounded-full text-[7px] font-black uppercase tracking-widest transition-all ${!activeCategory ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-300'}`}>All</button>
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-full text-[7px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-300'}`}>{cat}</button>
            ))}
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
          {filteredData.map(p => (
            <button key={p.id} onClick={() => setSelectedId(p.id)}
              className={`w-full text-left p-5 rounded-[1.5rem] transition-all duration-300 border ${selectedId === p.id ? "bg-stone-50 border-stone-100 shadow-sm" : "border-transparent hover:bg-stone-50/50"}`}>
              <div className="flex justify-between items-center mb-1">
                <span className={`text-[9px] font-black uppercase tracking-widest ${selectedId === p.id ? "text-stone-900" : "text-stone-300"}`}>{p.title}</span>
                {selectedId === p.id && <div className="w-1 h-1 rounded-full bg-[#a9b897]" />}
              </div>
              <div className="flex items-center gap-2 font-mono text-[7px] font-bold tracking-widest text-[#a9b897]">{p.id}</div>
            </button>
          ))}
        </nav>

        <button className="mt-6 w-full py-4 bg-stone-900 text-white rounded-xl flex items-center justify-center gap-3 hover:bg-[#a9b897] transition-all active:scale-95 shadow-lg">
          <Plus size={14} />
          <span className="text-[8px] font-black uppercase tracking-widest">Add Record</span>
        </button>
      </aside>

      {/* --- NEURAL DESK --- */}
      <main className="flex-1 flex flex-col relative bg-[#faf9f6] overflow-hidden">
        
        <header className="h-20 flex items-center justify-between px-10 border-b border-stone-100 bg-white/50 backdrop-blur-md relative z-10">
          <nav className="flex items-center bg-white p-1 rounded-full shadow-sm border border-stone-100">
            <button onClick={() => router.push('/payments')} className="px-4 py-2 text-stone-300 hover:text-stone-900 rounded-full text-[7px] font-black uppercase tracking-widest transition-all">Payments</button>
            <button onClick={() => router.push('/finance-reports')} className="px-4 py-2 text-stone-300 hover:text-stone-900 rounded-full text-[7px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
              <BarChart3 size={10}/> Finance
            </button>
            <button onClick={() => router.push('/hr')} className="px-4 py-2 text-stone-300 hover:text-stone-900 rounded-full text-[7px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
              <Users size={10}/> HR
            </button>
            <button onClick={() => router.push('/timesheets')} className="px-4 py-2 text-stone-300 hover:text-stone-900 rounded-full text-[7px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
              <Clock size={10}/> Timesheets
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button onClick={() => setShowHistory(!showHistory)} className={`p-2.5 rounded-xl transition-all ${showHistory ? 'bg-stone-900 text-[#a9b897]' : 'bg-white text-stone-300 border border-stone-100 shadow-sm'}`}><History size={14} /></button>
            <button onClick={exportPDF} className="p-2.5 bg-white text-stone-300 border border-stone-100 rounded-xl shadow-sm hover:text-stone-900"><Download size={14} /></button>
            <button onClick={syncArchive} disabled={isSaving} className="px-6 py-2.5 bg-[#a9b897] text-stone-900 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg flex items-center gap-3 active:scale-95">
              {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Fingerprint size={12} />}
              {isSaving ? "Syncing" : "Sync Archive"}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-20 pt-10 px-10">
          <div className="max-w-3xl mx-auto flex gap-10 items-start">
            
            <motion.div key={selectedId} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              className="flex-1 bg-white min-h-[850px] shadow-2xl shadow-stone-200/40 rounded-[3rem] p-16 flex flex-col border border-stone-100 relative text-left" ref={printRef}>
              
              <div className="absolute top-8 right-8 opacity-[0.02] pointer-events-none text-stone-900"><Layers size={140} /></div>

              <header className="mb-12 space-y-3">
                <div className="flex items-center gap-3">
                   <div className="px-3 py-1 bg-[#a9b897]/10 text-[#a9b897] rounded-full text-[7px] font-black uppercase tracking-widest">{currentProject.metadata.status}</div>
                   <span className="text-[7px] font-black tracking-widest text-stone-200 uppercase">Integrity: {currentProject.metadata.integrity}</span>
                </div>
                <h1 className="text-5xl font-serif italic text-stone-900 tracking-tighter leading-tight">{currentProject.title}</h1>
              </header>

              <textarea className="flex-1 w-full text-xl font-serif italic leading-relaxed text-stone-600 outline-none resize-none bg-transparent" value={currentProject.content} onChange={(e) => handleContentUpdate(e.target.value)} spellCheck={false} />

              <footer className="mt-16 pt-8 border-t border-stone-50 grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <p className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-300">MANIFEST_ATTACHMENTS</p>
                  <div className="space-y-2">
                    {currentProject.attachments.map(at => (
                      <div key={at.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100">
                        <div className="flex items-center gap-2">
                          <File size={10} className="text-[#a9b897]" />
                          <span className="text-[8px] font-bold text-stone-600">{at.name}</span>
                        </div>
                        <span className="text-[7px] font-black text-stone-200 uppercase">{at.size}</span>
                      </div>
                    ))}
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 p-2 text-stone-300 hover:text-stone-900 transition-colors">
                      <Plus size={12} />
                      <span className="text-[8px] font-black uppercase tracking-widest">Attach Resource</span>
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" />
                  </div>
                </div>
                <div className="text-right flex flex-col justify-end gap-1">
                   <p className="text-[7px] font-black text-stone-200 uppercase tracking-widest">Last Audit</p>
                   <p className="text-[9px] font-bold text-stone-400 mb-3">{currentProject.metadata.lastUpdated}</p>
                   <div className="flex items-center justify-end gap-2 text-[#a9b897]">
                      <ShieldCheck size={12} />
                      <span className="text-[7px] font-black uppercase tracking-widest">AES-256 Encrypted</span>
                   </div>
                </div>
              </footer>
            </motion.div>

            <AnimatePresence>
              {showHistory && (
                <motion.aside initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} className="w-72 space-y-4">
                  <section className="bg-white p-8 rounded-[2rem] border border-stone-100 shadow-xl space-y-6 text-left">
                     <div className="flex justify-between items-center">
                       <h3 className="text-[9px] font-black uppercase tracking-widest text-stone-900">Neural Log</h3>
                       <button onClick={() => setShowHistory(false)}><X size={12} className="text-stone-300" /></button>
                     </div>
                     <div className="space-y-6">
                        {currentProject.history.map(rev => (
                          <div key={rev.id} className="space-y-1.5 pl-3 border-l-2 border-[#a9b897]/20">
                             <p className="text-[9px] font-bold">{rev.author}</p>
                             <p className="text-[7px] font-black text-stone-300 uppercase tracking-widest">{rev.timestamp}</p>
                             <p className="text-[9px] font-serif italic text-stone-400 leading-snug">{rev.summary}</p>
                          </div>
                        ))}
                     </div>
                  </section>
                  <section className="bg-stone-900 p-8 rounded-[2rem] text-white relative overflow-hidden group text-left">
                     <Zap size={60} className="absolute -right-4 -bottom-4 opacity-10 group-hover:rotate-12 transition-transform" />
                     <h5 className="text-lg font-serif italic text-[#a9b897] mb-1">Neural Scan</h5>
                     <p className="text-[9px] font-serif italic opacity-40 mb-5 leading-relaxed">94% Brand Alignment detected in logic block.</p>
                     <button className="w-full py-2.5 bg-white/10 rounded-xl text-[7px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">Refine Clarity</button>
                  </section>
                </motion.aside>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* --- SYSTEM QUICK NAV --- */}
      <aside className="w-16 hover:w-56 bg-white border-l border-stone-100 transition-all duration-500 group overflow-hidden z-[150] text-left">
        <div className="flex flex-col h-full p-4">
           <div className="mb-12 flex justify-center group-hover:justify-start">
             <Layers size={18} className="text-[#a9b897]" />
           </div>

           <div className="flex-1 space-y-10 opacity-0 group-hover:opacity-100 transition-opacity pl-2">
              <div className="space-y-5">
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-300">SYSTEM_NODES</p>
                <div className="grid grid-cols-2 gap-2 pr-4">
                  <button onClick={() => router.push('/')} className="aspect-square bg-stone-50 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-[#a9b897] hover:text-white transition-all">
                    <Monitor size={14} /><span className="text-[6px] font-black uppercase tracking-widest">Dash</span>
                  </button>
                  <button className="aspect-square bg-stone-50 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-[#a9b897] hover:text-white transition-all">
                    <LayoutGrid size={14} /><span className="text-[6px] font-black uppercase tracking-widest">Apps</span>
                  </button>
                  <button className="aspect-square bg-stone-50 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-[#a9b897] hover:text-white transition-all col-span-2 aspect-auto h-12">
                    <Server size={14} /><span className="text-[6px] font-black uppercase tracking-widest">Server Status</span>
                  </button>
                </div>
              </div>
           </div>

           <div className="mt-auto flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-white text-[9px] font-serif italic shrink-0">L</div>
              <div className="hidden group-hover:block whitespace-nowrap">
                 <p className="text-[9px] font-bold">Leigha D.</p>
                 <p className="text-[7px] font-black text-[#a9b897] uppercase">ROOT ADMIN</p>
              </div>
           </div>
        </div>
      </aside>

    </div>
  );
}

const Loader2 = ({ size, className }: { size: number, className: string }) => (
  <Activity size={size} className={className} />
);