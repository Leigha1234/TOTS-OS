"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, Download, Folder, ChevronDown, 
  Sparkles, ShieldCheck, Activity, 
  Terminal, HardDrive, Fingerprint, TrendingUp,
  ArrowLeft, FileCode, Radio, Database, Settings2,
  Users, UploadCloud, X, Palette, Type, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * TOTS OS v4.2 - THE VAULT (CENTRAL REPOSITORY)
 * INTEGRATED SITE CUSTOMISATION & WORKSPACE BRIDGING
 */

const VAULT_DATA = [
  { 
    id: 1, 
    title: "Client Intake System", 
    category: "Onboarding & CRM", 
    clarityLevel: "High",
    tags: ["CRM", "Onboarding", "Workflow"],
    metadata: { lastUpdated: "2026-05-01", version: "2.1.0", author: "TOTS Core", complianceScore: 98, integrityHash: "0x882" },
    content: `CLIENT ONBOARDING SYSTEM\n\n📄 Intake Form\nName: [Client Name]\nBusiness: [Business Name]\nService purchased: [Service Name]\nStart date: [YYYY-MM-DD]\n\n⚙️ Workflow\n[ ] New client created\n[ ] Send welcome email\n[ ] Send contract + invoice\n[ ] Create project board\n[ ] Book kickoff call\n\n✉️ Template\nHi [Name],\nGreat to have you onboard.\nFollow this link to book your call: [link]`
  },
  { 
    id: 9, 
    title: "Terms & Conditions Builder", 
    category: "Legal & Governance", 
    clarityLevel: "High",
    tags: ["Legal", "Contract", "Compliance"],
    metadata: { lastUpdated: "2026-05-09", version: "3.2.0", author: "Legal Node", complianceScore: 100, integrityHash: "0xLegal" },
    content: `BUSINESS LEGAL FOUNDATIONS - T&Cs\n\n⚠️ MASTER DISCLAIMER\nFramework only. Consult a solicitor.\n\n1. Introduction\nAgreement between [Business] and [Client].\n\n2. Scope: delivery of: [Work]`
  },
  {
    id: 13,
    title: "Profit & Loss Forecaster",
    category: "Finance",
    clarityLevel: "High",
    tags: ["Finance", "Forecasting", "Profit"],
    metadata: { lastUpdated: "2026-05-07", version: "1.2.0", author: "Finance Node", complianceScore: 94, integrityHash: "0xFinance" },
    content: `P&L FORECASTER\n\nMonthly Input:\n- Projected Revenue\n- Fixed Costs\n- Variable Costs\n\nFormula:\nMargin = (Revenue - Total Costs) / Revenue`
  }
];

export default function VaultPage() {
  const router = useRouter();
  
  // --- UI STATE ---
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<string[]>(["Operations", "Finance"]);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [commandHistory, setCommandHistory] = useState<any[]>([]);
  const [showDesignProtocol, setShowDesignProtocol] = useState(false);
  const [systemUptime, setSystemUptime] = useState(0);
  const printRef = useRef<HTMLDivElement>(null);

  // --- DESIGN PROTOCOL STATE (Global Theme) ---
  const [theme, setTheme] = useState({
    primary: "#a9b897", // TOTS Sage
    font: "font-serif",
    accent: "#0a0a0a"
  });

  useEffect(() => {
    const timer = setInterval(() => setSystemUptime(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Update Global Variables for real-time CSS change
  useEffect(() => {
    document.documentElement.style.setProperty('--brand-primary', theme.primary);
  }, [theme.primary]);

  const logCommand = (cmd: string) => {
    setCommandHistory(prev => [{
      id: Math.random().toString(36),
      timestamp: new Date().toLocaleTimeString(),
      command: cmd
    }, ...prev].slice(0, 8));
  };

  const filteredDocs = useMemo(() => {
    return VAULT_DATA.filter(doc => 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      doc.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm]);

  const categories = useMemo(() => Array.from(new Set(VAULT_DATA.map(d => d.category))), []);

  const exportPDF = async () => {
    if (!printRef.current || !selectedDoc) return;
    logCommand(`Exporting node_${selectedDoc.id} to PDF format...`);
    const canvas = await html2canvas(printRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(imgData, "PNG", 0, 0, 210, 297);
    pdf.save(`VAULT_NODE_${selectedDoc.id}.pdf`);
  };

  return (
    <div className={`min-h-screen bg-[#fcfbf9] text-stone-900 transition-colors duration-500 overflow-x-hidden ${theme.font}`}>
      
      {/* DESIGN PROTOCOL SLIDE-OUT (Site customisation) */}
      <AnimatePresence>
        {showDesignProtocol && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDesignProtocol(false)} className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-[200]" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[201] p-12 flex flex-col">
              <div className="flex justify-between items-center mb-12">
                <div>
                  <h3 className="text-3xl font-serif italic">Design Protocol</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Global Workspace Customisation</p>
                </div>
                <button onClick={() => setShowDesignProtocol(false)} className="p-4 bg-stone-50 rounded-2xl"><X size={20}/></button>
              </div>

              <div className="space-y-12">
                {/* Colour Selection */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-stone-400">
                    <Palette size={14} />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Primary Colour Profile</span>
                  </div>
                  <div className="flex gap-4">
                    {['#a9b897', '#f43f5e', '#3b82f6', '#10b981', '#0a0a0a'].map(c => (
                      <button 
                        key={c} 
                        onClick={() => { setTheme({...theme, primary: c}); logCommand(`Global colour updated: ${c}`); }}
                        className={`w-10 h-10 rounded-full border-4 transition-all ${theme.primary === c ? 'border-stone-900 scale-110' : 'border-transparent'}`} 
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Font Selection */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-stone-400">
                    <Type size={14} />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Site-wide Typography</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: 'font-serif', name: 'Signature Serif' },
                      { id: 'font-sans', name: 'Operational Sans' },
                      { id: 'font-mono', name: 'Infrastructure Mono' }
                    ].map(f => (
                      <button 
                        key={f.id} 
                        onClick={() => setTheme({...theme, font: f.id})}
                        className={`flex justify-between items-center p-5 rounded-2xl border transition-all ${theme.font === f.id ? 'border-stone-900 bg-stone-900 text-white shadow-lg' : 'border-stone-100 hover:border-stone-300'}`}
                      >
                        <span className={`text-sm ${f.id}`}>{f.name}</span>
                        {theme.font === f.id && <Check size={16} />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button onClick={() => setShowDesignProtocol(false)} className="mt-auto w-full py-6 bg-stone-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] shadow-xl">Commit Visual Protocols</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="max-w-[1600px] mx-auto px-6 py-12 md:p-16 lg:p-20 space-y-12">
        
        {/* HEADER & GLOBAL BRIDGES */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 border-b border-stone-100 pb-16">
          <div className="space-y-6 w-full">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-stone-900 text-white rounded-2xl shadow-xl">
                <Fingerprint size={24} style={{ color: theme.primary }} />
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-400">Security Protocol: High Clarity</p>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.primary }} />
                  <p className="text-[9px] font-mono text-stone-400 uppercase">System Uptime: {Math.floor(systemUptime / 60)}m</p>
                </div>
              </div>
            </div>
            <h1 className="text-7xl md:text-9xl font-serif italic tracking-tighter leading-none" style={{ color: theme.primary }}>
              The Vault
            </h1>
          </div>

          {/* GLOBAL NAVIGATION BUTTONS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full xl:w-auto">
             <button onClick={() => router.push('/import')} className="px-6 py-5 bg-white border border-stone-100 text-stone-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-stone-900 transition-all flex flex-col items-center justify-center gap-2 group">
                <UploadCloud size={16} className="group-hover:-translate-y-1 transition-transform" /> Import Page
             </button>
             <button onClick={() => router.push('/team')} className="px-6 py-5 bg-white border border-stone-100 text-stone-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-stone-900 transition-all flex flex-col items-center justify-center gap-2 group">
                <Users size={16} className="group-hover:scale-110 transition-transform" /> Team Hub
             </button>
             <button onClick={() => setShowDesignProtocol(true)} className="px-6 py-5 bg-stone-50 border border-stone-100 text-stone-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-stone-900 transition-all flex flex-col items-center justify-center gap-2 group">
                <Settings2 size={16} className="animate-spin-slow" /> Customise
             </button>
             <button onClick={() => logCommand("Running full node diagnostic...")} className="px-6 py-5 bg-stone-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all flex flex-col items-center justify-center gap-2 group shadow-xl">
                <Activity size={16} className="animate-pulse" /> Diagnostic
             </button>
          </div>
        </header>

        {/* VAULT INTERFACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          
          {/* SIDEBAR: REPOSITORY DIRECTORY */}
          <div className={`${selectedDoc ? 'hidden lg:block' : 'block'} lg:col-span-4 space-y-8`}>
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
              <input 
                className="w-full p-7 pl-14 bg-white border border-stone-100 rounded-3xl outline-none shadow-sm text-xs font-bold focus:border-stone-900" 
                placeholder="Traverse network directory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>

            <div className="space-y-4">
              {categories.map((cat) => (
                <div key={cat} className="bg-white border border-stone-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                  <button 
                    onClick={() => setExpandedFolders(prev => prev.includes(cat) ? prev.filter(f => f !== cat) : [...prev, cat])}
                    className="w-full flex justify-between items-center p-7 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900"
                  >
                    <div className="flex items-center gap-3">
                      <Folder size={14} style={{ color: expandedFolders.includes(cat) ? theme.primary : undefined }} />
                      {cat}
                    </div>
                    <ChevronDown size={14} className={`transition-transform ${expandedFolders.includes(cat) ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {expandedFolders.includes(cat) && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="bg-stone-50/50 px-4 pb-4 space-y-2 overflow-hidden">
                        {filteredDocs.filter(d => d.category === cat).map(doc => (
                          <button 
                            key={doc.id} 
                            onClick={() => { setSelectedDoc(doc); logCommand(`Accessing node: ${doc.title}`); }}
                            className={`w-full text-left p-6 rounded-3xl transition-all border ${selectedDoc?.id === doc.id ? "bg-stone-900 text-white border-transparent shadow-2xl" : "bg-white border-transparent hover:border-stone-200"}`}
                          >
                            <p className="text-[12px] font-bold">{doc.title}</p>
                            <div className="flex justify-between mt-3 opacity-40 text-[7px] font-mono uppercase tracking-tighter">
                               <span>NODE_{doc.id}</span>
                               <span>VER: {doc.metadata.version}</span>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* COMMAND TERMINAL */}
            <div className="bg-[#0a0a0a] rounded-[3rem] p-10 text-white space-y-8 shadow-2xl">
                <div className="flex items-center gap-3 opacity-40">
                  <Terminal size={14} style={{ color: theme.primary }} />
                  <span className="text-[9px] font-black uppercase tracking-[0.4em]">Core Signal Feed</span>
                </div>
                <div className="font-mono text-[10px] h-36 overflow-y-auto space-y-4 scrollbar-hide">
                   {commandHistory.map(log => (
                     <p key={log.id} className="leading-relaxed"><span style={{ color: theme.primary }} className="mr-3">[{log.timestamp}]</span> {log.command}</p>
                   ))}
                   {commandHistory.length === 0 && <p className="opacity-20 italic">Awaiting operational signals...</p>}
                </div>
            </div>
          </div>

          {/* MAIN: INDEPENDENT NODE VIEWER */}
          <main className={`${!selectedDoc ? 'hidden lg:block' : 'block'} lg:col-span-8`}>
            <AnimatePresence mode="wait">
              {selectedDoc ? (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} 
                  className="bg-white rounded-[4rem] border border-stone-100 shadow-2xl overflow-hidden" 
                  ref={printRef}
                >
                  <div className="p-10 md:p-20 border-b border-stone-50 space-y-10">
                    <div className="flex items-center justify-between">
                       <button onClick={() => setSelectedDoc(null)} className="lg:hidden p-5 bg-stone-50 rounded-2xl"><ArrowLeft size={18}/></button>
                       <div className="flex items-center gap-3 px-6 py-2.5 bg-stone-50 rounded-full border border-stone-100">
                          <Database size={12} style={{ color: theme.primary }} />
                          <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">{selectedDoc.category}</span>
                       </div>
                    </div>
                    <div className="space-y-10">
                       <h2 className="text-5xl md:text-8xl font-serif italic tracking-tighter leading-none" style={{ color: theme.primary }}>{selectedDoc.title}</h2>
                       <div className="flex gap-4">
                          <button onClick={exportPDF} className="p-8 bg-stone-50 border border-stone-100 rounded-[2rem] hover:bg-stone-900 hover:text-white transition-all shadow-sm">
                            <Download size={24} />
                          </button>
                          <button onClick={() => logCommand(`Committing delta to independent node ${selectedDoc.id}...`)} className="flex-1 px-10 py-8 bg-stone-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] hover:opacity-90 shadow-xl transition-all">
                            Commit Signal Changes
                          </button>
                       </div>
                    </div>
                  </div>

                  {/* NEURAL SYNTHESIS ENGINE */}
                  <div className="bg-stone-50/50 px-10 md:px-20 py-8 border-b border-stone-100 flex flex-col md:flex-row justify-between items-center gap-6">
                     <div className="flex items-center gap-3">
                        <Sparkles size={18} style={{ color: theme.primary }} className="animate-pulse" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">Neural Synthesis Engine Active</p>
                     </div>
                     <button className="w-full md:w-auto px-8 py-4 bg-white border border-stone-200 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:border-stone-900 transition-all">Run Logic Audit</button>
                  </div>

                  {/* CONTENT INTERFACE */}
                  <div className="p-10 md:p-20">
                     <textarea 
                        className="w-full h-[500px] md:h-[800px] bg-transparent text-stone-800 font-mono text-base leading-loose outline-none resize-none border-none scrollbar-hide italic" 
                        defaultValue={selectedDoc.content} 
                     />
                  </div>

                  {/* NODE FOOTER */}
                  <div className="bg-stone-900 p-16 text-white grid grid-cols-2 md:grid-cols-4 gap-12">
                     <div className="space-y-2">
                        <p className="text-[8px] font-black uppercase opacity-30 tracking-[0.2em]">Operational Version</p>
                        <p className="text-xs font-mono">{selectedDoc.metadata.version}</p>
                     </div>
                     <div className="space-y-2">
                        <p className="text-[8px] font-black uppercase opacity-30 tracking-[0.2em]">Integrity Status</p>
                        <p className="text-xs font-mono" style={{ color: theme.primary }}>{selectedDoc.metadata.complianceScore}% Verified</p>
                     </div>
                     <div className="space-y-2 hidden md:block">
                        <p className="text-[8px] font-black uppercase opacity-30 tracking-[0.2em]">Encryption Hash</p>
                        <p className="text-xs font-mono truncate">{selectedDoc.metadata.integrityHash}</p>
                     </div>
                     <div className="text-right flex items-end justify-end">
                        <button onClick={() => setSelectedDoc(null)} className="text-[9px] font-black uppercase tracking-[0.4em] hover:text-stone-400 transition-colors">Close Workspace</button>
                     </div>
                  </div>
                </motion.div>
              ) : (
                <div className="hidden lg:flex flex-col items-center justify-center h-full min-h-[900px] border-2 border-dashed border-stone-100 rounded-[5rem] space-y-8 p-20 text-center">
                   <div className="w-24 h-24 bg-stone-50 rounded-full flex items-center justify-center text-stone-200">
                    <FileCode size={40} />
                   </div>
                   <div className="space-y-4">
                    <p className="text-stone-300 font-serif italic text-4xl">Awaiting Node Selection...</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-300">Traverse the network directory to bridge an independent node.</p>
                   </div>
                </div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>

      <style jsx global>{`
        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        :root { --brand-primary: #a9b897; }
      `}</style>
    </div>
  );
}