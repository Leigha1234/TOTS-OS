"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { 
  Search, Download, Folder, ChevronDown, 
  Sparkles, ShieldCheck, Activity, 
  Trash2, Save, Box, Menu, X, 
  Edit3, Clock, Upload, File, Paperclip, 
  Settings, Share2, Globe, ArrowUpRight,
  Database, Eye, Lock, Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";

// --- TYPES & INTERFACES ---
interface ProjectFile {
  name: string;
  size: string;
  type: string;
  date: string;
}

interface Project {
  id: string;
  title: string;
  category: string;
  content: string;
  metadata: {
    lastUpdated: string;
    status: string;
    readTime: string;
  };
  files: ProjectFile[];
}

// --- INITIAL DATASET ---
const INITIAL_VAULT_DATA: Project[] = [
  { 
    id: "PRJ-001", 
    title: "Client Intake Protocol", 
    category: "Clients & CRM", 
    content: `CLIENT ONBOARDING SYSTEM\n\n📄 Intake Form\nName: [Client Name]\nBusiness: [Business Name]\nService purchased: [Service Name]\nStart date: [YYYY-MM-DD]\n\n⚙️ Workflow\n[ ] New client created\n[ ] Send welcome email\n[ ] Send contract + invoice\n[ ] Create project board\n[ ] Book kickoff call`,
    metadata: { lastUpdated: "2026-05-01", status: "Verified", readTime: "4m" },
    files: []
  },
  { 
    id: "PRJ-441", 
    title: "Sales Conversion Script", 
    category: "Sales & Marketing", 
    content: `SALES PIPELINE SYSTEM\n\n📞 Call Structure\n- Current situation:\n- Problems / bottlenecks:\n- Impact:\n- Desired outcome:\n- Gap:\n- Offer:`,
    metadata: { lastUpdated: "2026-04-15", status: "Draft", readTime: "2m" },
    files: []
  },
  {
    id: "PRJ-112", 
    title: "Operational Efficiency Audit", 
    category: "Operations", 
    content: `BUSINESS AUDIT TEMPLATE\n\n1. Operations\n- Task tracking status\n- Delay points identified\n\n2. Finance Check\n- Revenue targets vs actuals\n- Profit margin clarity`,
    metadata: { lastUpdated: "2026-05-05", status: "Verified", readTime: "8m" },
    files: []
  }
];

export default function VaultArchivalPage() {
  const [vaultData, setVaultData] = useState<Project[]>(INITIAL_VAULT_DATA);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_VAULT_DATA[0].id);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<string[]>(["Clients & CRM"]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setIsMounted(true); }, []);

  const currentProject = useMemo(() => 
    vaultData.find(p => p.id === selectedId) || vaultData[0],
  [selectedId, vaultData]);

  const categories = useMemo(() => Array.from(new Set(vaultData.map(d => d.category))), [vaultData]);

  const filteredProjects = useMemo(() => {
    return vaultData.filter(p => 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, vaultData]);

  // --- HANDLERS ---
  const handleContentChange = (newContent: string) => {
    setVaultData(prev => prev.map(p => 
      p.id === selectedId ? { ...p, content: newContent } : p
    ));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    const newFileEntries: ProjectFile[] = Array.from(uploadedFiles).map(file => ({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + " KB",
      type: file.type,
      date: new Date().toLocaleDateString()
    }));

    setVaultData(prev => prev.map(p => p.id === selectedId ? { ...p, files: [...p.files, ...newFileEntries] } : p));
    toast.success(`Resources added to ${currentProject.id}`);
  };

  const saveProject = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setVaultData(prev => prev.map(p => 
      p.id === selectedId ? { ...p, metadata: { ...p.metadata, lastUpdated: new Date().toISOString().split('T')[0] } } : p
    ));
    setIsSaving(false);
    toast.success("Archive Synchronized");
  };

  const exportPDF = async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current);
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297);
    pdf.save(`VAULT_${currentProject.id}.pdf`);
  };

  if (!isMounted) return null;

  return (
    <div className="h-screen bg-[#F9F8F6] text-[#2C2C2C] flex flex-col overflow-hidden selection:bg-[#A3B18A] selection:text-white">
      
      {/* MINIMAL TOP NAV */}
      <nav className="h-16 bg-white/40 backdrop-blur-xl border-b border-stone-100 flex items-center justify-between px-8 shrink-0 z-[120]">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 text-stone-400 hover:text-stone-900"><Menu size={20}/></button>
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-[#A3B18A]/10 flex items-center justify-center text-[#A3B18A]">
              <Database size={14} />
            </div>
            <span className="font-black uppercase tracking-[0.3em] text-[10px] text-stone-400">Vault Archive</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-3">
             <div className="flex -space-x-2">
                {[1, 2].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-stone-100 flex items-center justify-center text-[8px] font-bold text-stone-400 italic">
                    {i === 1 ? 'L' : 'D'}
                  </div>
                ))}
             </div>
             <span className="text-[9px] font-black uppercase tracking-widest text-stone-300">Active Session</span>
          </div>
          <button onClick={() => setIsInspectorOpen(!isInspectorOpen)} className="p-2 text-stone-400 hover:text-[#A3B18A] transition-colors">
            <Layers size={18}/>
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* NAV SIDEBAR: ARCHIVE INDEX */}
        <aside className={`
          fixed inset-y-0 left-0 z-[130] w-72 bg-white/80 backdrop-blur-2xl border-r border-stone-100 transform transition-transform duration-500 lg:relative lg:translate-x-0
          ${isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
        `}>
          <div className="p-8 space-y-8 h-full flex flex-col">
            <div className="flex justify-between items-center lg:hidden">
              <span className="font-black uppercase text-[10px] tracking-widest">Index</span>
              <button onClick={() => setIsMobileMenuOpen(false)}><X size={20}/></button>
            </div>

            <div className="relative group">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-[#A3B18A] transition-colors" />
              <input 
                className="w-full bg-stone-50/50 border border-stone-100 rounded-2xl py-3 pl-11 pr-4 text-[11px] outline-none transition-all focus:bg-white focus:ring-1 ring-[#A3B18A]/20"
                placeholder="Search archive..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {categories.map((cat) => (
                <div key={cat} className="mb-6">
                  <button 
                    onClick={() => setExpandedFolders(prev => prev.includes(cat) ? prev.filter(f => f !== cat) : [...prev, cat])}
                    className="w-full flex items-center justify-between py-2 text-[10px] font-black text-stone-300 uppercase tracking-[0.2em] hover:text-stone-500 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Folder size={12} className={expandedFolders.includes(cat) ? "text-[#A3B18A]" : "text-stone-200"} />
                      {cat}
                    </div>
                    <ChevronDown size={12} className={`transition-transform duration-300 ${expandedFolders.includes(cat) ? "" : "-rotate-90"}`} />
                  </button>
                  <AnimatePresence>
                    {expandedFolders.includes(cat) && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-1 mt-2 border-l border-stone-50 ml-1.5">
                        {filteredProjects.filter(p => p.category === cat).map(p => (
                          <button 
                            key={p.id}
                            onClick={() => { setSelectedId(p.id); setIsMobileMenuOpen(false); }}
                            className={`w-full text-left pl-6 pr-4 py-2.5 text-[11px] rounded-r-xl transition-all ${
                              selectedId === p.id 
                                ? "text-stone-900 font-bold bg-stone-50 border-l-2 border-[#A3B18A]" 
                                : "text-stone-400 hover:text-stone-800 hover:pl-7"
                            }`}
                          >
                            <span className="truncate block">{p.title}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
            
            <div className="pt-6 border-t border-stone-50">
               <button className="w-full py-4 rounded-2xl bg-stone-900 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#A3B18A] transition-all">
                  <Plus size={14} /> New Record
               </button>
            </div>
          </div>
        </aside>

        {/* MAIN WORKSPACE */}
        <main className="flex-1 flex flex-col min-w-0 bg-white shadow-inner">
          <header className="h-20 flex items-center justify-between px-10 lg:px-16 shrink-0 border-b border-stone-50">
            <div className="flex flex-col">
              <h2 className="text-4xl font-serif italic text-stone-900 tracking-tighter">
                {currentProject.title}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                 <span className="text-[9px] font-black uppercase tracking-widest text-[#A3B18A]">{currentProject.id}</span>
                 <span className="text-stone-200">•</span>
                 <span className="text-[9px] font-black uppercase tracking-widest text-stone-300">{currentProject.category}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={exportPDF} className="p-3 bg-stone-50 text-stone-400 rounded-2xl hover:bg-stone-900 hover:text-white transition-all"><Download size={18} /></button>
              <button 
                onClick={saveProject} 
                disabled={isSaving}
                className="px-8 py-4 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-stone-200 disabled:opacity-50 transition-all active:scale-95"
              >
                {isSaving ? <Clock size={14} className="animate-spin" /> : <Save size={14} />}
                {isSaving ? "Archiving" : "Sync Archive"}
              </button>
            </div>
          </header>

          <div className="flex-1 flex flex-col overflow-hidden relative">
            <div className="px-10 lg:px-16 py-4 flex items-center justify-between">
               <div className="flex gap-8">
                  <div className="flex flex-col">
                     <span className="text-[8px] font-black uppercase text-stone-300 tracking-widest mb-1">Status</span>
                     <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#A3B18A]" />
                        <span className="text-[10px] font-bold text-stone-600">{currentProject.metadata.status}</span>
                     </div>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[8px] font-black uppercase text-stone-300 tracking-widest mb-1">Read Time</span>
                     <span className="text-[10px] font-bold text-stone-600 italic">{currentProject.metadata.readTime}</span>
                  </div>
               </div>
               <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors">
                  <Paperclip size={12} /> Attach Resource
               </button>
               <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />
            </div>

            {/* EDITOR CANVAS */}
            <div className="flex-1 px-10 lg:px-16 pb-12 overflow-y-auto custom-scrollbar" ref={printRef}>
              <div className="max-w-4xl mx-auto h-full">
                <textarea 
                  className="w-full h-full text-lg font-serif italic leading-[1.8] text-stone-700 outline-none resize-none bg-transparent placeholder-stone-200"
                  value={currentProject.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  spellCheck={false}
                  placeholder="Begin drafting your archival record..."
                />
              </div>
            </div>

            {/* ATTACHMENT GALLERY (Minimal) */}
            <AnimatePresence>
              {currentProject.files.length > 0 && (
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="border-t border-stone-50 p-6 bg-white/60 backdrop-blur px-10 lg:px-16">
                  <div className="flex flex-wrap gap-4">
                    {currentProject.files.map((file, i) => (
                      <div key={i} className="flex items-center gap-3 bg-stone-50 border border-stone-100 pl-4 pr-2 py-2 rounded-2xl group transition-all hover:bg-white hover:shadow-sm">
                        <File size={14} className="text-stone-300 group-hover:text-[#A3B18A]" />
                        <div className="flex flex-col min-w-0 pr-4">
                           <span className="text-[10px] font-bold text-stone-600 truncate max-w-[120px]">{file.name}</span>
                           <span className="text-[8px] font-black text-stone-300 uppercase">{file.size}</span>
                        </div>
                        <button onClick={() => setVaultData(prev => prev.map(p => p.id === selectedId ? { ...p, files: p.files.filter(f => f.name !== file.name) } : p))} className="p-2 text-stone-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 size={12}/>
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* INSPECTOR: METADATA & ACTIONS */}
        <aside className={`
          fixed inset-y-0 right-0 z-[130] w-80 bg-stone-50/80 backdrop-blur-2xl border-l border-stone-100 transform transition-transform duration-500 lg:relative lg:translate-x-0
          ${isInspectorOpen ? "translate-x-0 shadow-2xl" : "translate-x-full"}
        `}>
          <div className="p-10 space-y-12 h-full overflow-y-auto custom-scrollbar">
            <header className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300">Analysis</span>
              <button onClick={() => setIsInspectorOpen(false)} className="lg:hidden p-2"><X size={20}/></button>
            </header>

            <section className="space-y-6">
              <h4 className="text-[11px] font-black uppercase text-stone-900 tracking-widest border-b border-stone-100 pb-3 flex items-center justify-between">
                Manifest
                <ArrowUpRight size={14} className="text-stone-300" />
              </h4>
              <div className="grid grid-cols-1 gap-6">
                {[
                  { label: "Archival Status", val: currentProject.metadata.status, color: "text-[#A3B18A]" },
                  { label: "Sync Latency", val: "14ms", color: "text-stone-500" },
                  { label: "Integrity", val: "99.9%", color: "text-stone-500" },
                  { label: "Modified", val: currentProject.metadata.lastUpdated, color: "text-stone-800" }
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-[8px] font-black text-stone-300 uppercase tracking-widest">{item.label}</p>
                    <p className={`text-[11px] font-bold ${item.color}`}>{item.val}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <h4 className="text-[11px] font-black uppercase text-stone-900 tracking-widest border-b border-stone-100 pb-3 flex items-center justify-between">
                 Utility
                 <Settings size={14} className="text-stone-300" />
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <Sparkles size={16}/>, label: "AI Synth", color: "hover:text-amber-500" },
                  { icon: <ShieldCheck size={16}/>, label: "Audit", color: "hover:text-blue-500" },
                  { icon: <Globe size={16}/>, label: "Publish", color: "hover:text-[#A3B18A]" },
                  { icon: <Share2 size={16}/>, label: "Relay", color: "hover:text-stone-900" }
                ].map((item, i) => (
                  <button key={i} className={`p-5 bg-white border border-stone-100 rounded-3xl flex flex-col items-center gap-3 group transition-all hover:shadow-xl hover:shadow-stone-200/50 ${item.color}`}>
                    <div className="text-stone-300 transition-colors group-hover:text-inherit">{item.icon}</div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-stone-400 group-hover:text-stone-900 transition-colors">{item.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <div className="bg-stone-900 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl relative overflow-hidden">
               <Activity size={120} className="absolute -right-10 -bottom-10 opacity-10" />
               <h5 className="text-xl font-serif italic tracking-tighter leading-none relative z-10">Archive Insights.</h5>
               <p className="text-[10px] font-serif italic opacity-60 leading-relaxed relative z-10">This record is part of your core Operations hub. Last audited by Manager 14 days ago.</p>
               <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all relative z-10 border border-white/5">Request Review</button>
            </div>
          </div>
        </aside>

        {/* OVERLAY */}
        {(isMobileMenuOpen || isInspectorOpen) && (
          <div 
            className="fixed inset-0 bg-stone-900/10 backdrop-blur-[4px] z-[125] lg:hidden" 
            onClick={() => { setIsMobileMenuOpen(false); setIsInspectorOpen(false); }} 
          />
        )}
      </div>

      {/* FOOTER: SYSTEM STATUS */}
      <footer className="h-12 border-t border-stone-100 bg-white/60 backdrop-blur-xl px-10 flex items-center justify-between shrink-0 z-[120]">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-[#A3B18A]" />
               <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Vault Nodes Online</span>
            </div>
            <span className="text-stone-200">|</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-stone-300">Encryption: AES-256</span>
         </div>
         <p className="text-[10px] font-serif italic text-stone-400">Archival Date: May 2026</p>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E7E5E4; border-radius: 20px; }
        textarea::selection { background: #A3B18A; color: #FFFFFF; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

const Plus = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);