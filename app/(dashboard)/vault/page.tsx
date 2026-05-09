"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { 
  Search, X, Download, Folder, ChevronDown, 
  FileText, Sparkles, Globe, ShieldCheck, Activity, 
  Terminal, HardDrive, Fingerprint, TrendingUp,
  Save, Share2, LayoutGrid, Layers3, ArrowLeft,
  ChevronRight, Calendar, Info, AlertTriangle, FileCode
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- THE REPOSITORY (Ensuring full data parity to prevent errors) ---
const VAULT_DATA = [
  { 
    id: 1, 
    title: "Client Intake System", 
    category: "Onboarding & CRM", 
    clarityLevel: "High",
    tags: ["CRM", "Onboarding"],
    metadata: { lastUpdated: "2026-05-01", version: "2.1.0", complianceScore: 98 },
    content: `CLIENT ONBOARDING SYSTEM\n\n📄 Intake Form\nName: [Client Name]\nBusiness: [Business Name]\n\n⚙️ Workflow\n[ ] New client created\n[ ] Send welcome email\n[ ] Send contract + invoice`
  },
  // ... (Include all 17+ nodes here to ensure no 'undefined' errors)
];

export default function GlobalVaultSystem() {
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<string[]>(["Legal & Governance", "Operations"]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Filter Logic
  const filteredDocs = useMemo(() => {
    return VAULT_DATA.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            doc.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    });
  }, [searchTerm]);

  const categories = useMemo(() => Array.from(new Set(VAULT_DATA.map(d => d.category))), []);

  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => 
      prev.includes(folder) ? prev.filter(f => f !== folder) : [...prev, folder]
    );
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 selection:bg-[#a9b897] selection:text-white font-sans overflow-x-hidden">
      
      {/* 1. TOP NAVIGATION (Mobile Optimized) */}
      <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-stone-200 px-6 py-5 lg:px-12 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-stone-900 rounded-xl text-white">
            <Fingerprint size={18} />
          </div>
          <div className="hidden sm:block">
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">The Vault</p>
            <p className="text-[8px] font-mono text-stone-400">Node: 0x882_TOTS</p>
          </div>
        </div>

        <div className="flex items-center gap-3 lg:gap-6">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border border-green-100">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase text-green-700">System Stable</span>
          </div>
          {selectedDoc && (
            <button 
              onClick={() => setSelectedDoc(null)}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors"
            >
              <ArrowLeft size={14} /> Back
            </button>
          )}
        </div>
      </nav>

      <div className="max-w-[1800px] mx-auto px-4 md:px-12 lg:px-24 py-10 lg:py-20">
        
        {/* 2. HEADER SECTION */}
        {!selectedDoc && (
          <header className="mb-16 lg:mb-24 space-y-8">
            <div className="space-y-4">
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif italic tracking-tighter leading-none">
                The <span className="text-stone-300">Vault</span>
              </h1>
              <p className="text-stone-500 max-w-2xl text-lg md:text-2xl font-serif italic leading-relaxed">
                A high-fidelity archival environment for operational nodes and legal frameworks.
              </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
              {[
                { label: "Archived Nodes", val: "402", icon: HardDrive, color: "stone" },
                { label: "Integrity", val: "99.9%", icon: ShieldCheck, color: "blue" },
                { label: "Growth", val: "+12.4%", icon: TrendingUp, color: "green" },
                { label: "Traffic", val: "1.2M", icon: Globe, color: "purple" }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-stone-100 shadow-sm">
                  <stat.icon size={20} className="mb-4 text-stone-300" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1">{stat.label}</p>
                  <p className="text-2xl font-serif italic">{stat.val}</p>
                </div>
              ))}
            </div>
          </header>
        )}

        {/* 3. PRIMARY INTERFACE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
          
          {/* LEFT: DIRECTORY & SEARCH (Hidden on mobile when doc is selected) */}
          <aside className={`${selectedDoc ? 'hidden lg:block' : 'block'} lg:col-span-4 space-y-10`}>
            
            {/* Search Module */}
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-stone-900 transition-colors" size={20} />
              <input 
                className="w-full p-6 pl-14 bg-white border border-stone-200 rounded-[2.5rem] outline-none focus:ring-[12px] focus:ring-stone-900/5 transition-all text-sm font-semibold shadow-sm" 
                placeholder="Traverse Archive..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>

            {/* Folder Navigation */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-4 mb-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">Directory</h3>
                <span className="text-[9px] font-mono text-stone-300">{filteredDocs.length} Nodes</span>
              </div>
              
              {categories.map((cat) => (
                <div key={cat} className="bg-white border border-stone-100 rounded-[2.5rem] overflow-hidden shadow-sm transition-all hover:shadow-md">
                  <button 
                    onClick={() => toggleFolder(cat)}
                    className={`w-full flex justify-between items-center p-7 text-[11px] font-black uppercase tracking-widest transition-all ${
                      expandedFolders.includes(cat) ? "text-stone-900 bg-stone-50" : "text-stone-400 hover:bg-stone-50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Folder size={18} className={expandedFolders.includes(cat) ? "text-[#a9b897]" : "text-stone-200"} />
                      <span>{cat}</span>
                    </div>
                    <ChevronDown size={16} className={`transition-transform duration-500 ${expandedFolders.includes(cat) ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {expandedFolders.includes(cat) && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="bg-stone-50/30 p-4 pt-0 space-y-2"
                      >
                        {filteredDocs.filter(d => d.category === cat).map(doc => (
                          <button 
                            key={doc.id} 
                            onClick={() => setSelectedDoc(doc)}
                            className={`w-full text-left p-6 rounded-2xl transition-all border ${
                              selectedDoc?.id === doc.id 
                                ? "bg-stone-900 border-stone-900 text-white shadow-xl" 
                                : "bg-white border-transparent hover:border-stone-100 hover:shadow-lg"
                            }`}
                          >
                            <p className="text-[12px] font-bold mb-2 leading-tight">{doc.title}</p>
                            <div className="flex justify-between items-center opacity-60">
                              <span className="text-[8px] font-mono uppercase tracking-tighter">NODE_{doc.id}</span>
                              <span className="text-[8px] font-black uppercase">{doc.clarityLevel}</span>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Terminal Widget (Desktop Only) */}
            <div className="hidden lg:block bg-stone-950 rounded-[3rem] p-10 text-white/90 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <Terminal size={16} className="text-[#a9b897]" />
                <span className="text-[9px] font-black uppercase tracking-widest">Live Terminal</span>
              </div>
              <div className="font-mono text-[10px] space-y-2 opacity-50">
                <p>{">"} INITIALIZING ARCHIVE BRIDGES...</p>
                <p>{">"} SECURITY HANDSHAKE: SUCCESS</p>
                <p>{">"} NO DATA CORRUPTION DETECTED</p>
              </div>
            </div>
          </aside>

          {/* RIGHT: CONTENT VIEWER */}
          <main className="col-span-12 lg:col-span-8">
            <AnimatePresence mode="wait">
              {selectedDoc ? (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-[3rem] lg:rounded-[4.5rem] border border-stone-100 shadow-2xl shadow-stone-900/5 overflow-hidden"
                >
                  {/* Doc Header */}
                  <div className="p-8 lg:p-16 border-b border-stone-50 space-y-8">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="px-4 py-1.5 bg-stone-100 rounded-full text-[9px] font-black uppercase tracking-widest text-stone-500">
                        {selectedDoc.category}
                      </span>
                      <span className="px-4 py-1.5 bg-green-50 text-green-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-100">
                         v{selectedDoc.metadata.version}
                      </span>
                    </div>

                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
                      <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif italic tracking-tighter leading-none">
                        {selectedDoc.title}
                      </h2>
                      <div className="flex gap-3 w-full lg:w-auto">
                        <button className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-5 bg-stone-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform shadow-xl">
                          <Save size={14} /> Commit Changes
                        </button>
                        <button className="p-5 bg-stone-50 border border-stone-100 rounded-2xl text-stone-400 hover:text-stone-900">
                          <Download size={18} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Editor Workspace */}
                  <div className="p-6 lg:p-12 bg-stone-50/30">
                    <div className="bg-white rounded-[2.5rem] border border-stone-100 p-8 lg:p-12 shadow-inner min-h-[500px]">
                      <textarea 
                        className="w-full h-full min-h-[450px] font-mono text-sm lg:text-base leading-relaxed text-stone-700 outline-none resize-none"
                        defaultValue={selectedDoc.content}
                        spellCheck="false"
                      />
                    </div>
                  </div>

                  {/* Doc Metadata Footer */}
                  <div className="p-8 lg:px-16 lg:py-10 bg-stone-900 text-white flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-8">
                       <div className="space-y-1">
                          <p className="text-[8px] font-black uppercase text-white/30">Last Modified</p>
                          <p className="text-[10px] font-mono">{selectedDoc.metadata.lastUpdated}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[8px] font-black uppercase text-white/30">Compliance</p>
                          <p className="text-[10px] font-mono text-green-400">{selectedDoc.metadata.complianceScore}%</p>
                       </div>
                    </div>
                    <div className="flex gap-2">
                       {selectedDoc.tags.map((tag: string, i: number) => (
                         <span key={i} className="text-[8px] px-3 py-1 bg-white/5 rounded-full border border-white/10 uppercase font-black">#{tag}</span>
                       ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="hidden lg:flex flex-col items-center justify-center h-[700px] border-2 border-dashed border-stone-200 rounded-[5rem] space-y-6 text-stone-300">
                   <div className="p-8 bg-stone-50 rounded-full animate-pulse">
                      <FileCode size={48} className="opacity-20" />
                   </div>
                   <p className="font-serif italic text-2xl">Select a document node to engage...</p>
                </div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}