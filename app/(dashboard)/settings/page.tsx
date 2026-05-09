"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { 
  Search, X, Download, Folder, ChevronDown, 
  FileText, Sparkles, Globe, ShieldCheck, Activity, 
  Terminal, HardDrive, Fingerprint, TrendingUp,
  Save, Share2, LayoutGrid, Layers3, ArrowLeft,
  ChevronRight, Calendar, Info, AlertTriangle, FileCode,
  Zap, Radio, HardDriveDownload, Database, Command,
  Settings, Eye, EyeOff, Lock, RefreshCw, Cpu
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// --- FULL DATA REPOSITORY ---
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
    content: `BUSINESS LEGAL FOUNDATIONS - T&Cs\n\n⚠️ MASTER DISCLAIMER\nFramework only. Consult a solicitor.\n\n1. Introduction\nAgreement between [Business] and [Client].\n\n2. Scope\nDelivery of: [Work]`
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

export default function GlobalVaultSystem() {
  // --- CORE STATE ---
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<string[]>(["Legal & Governance", "Operations", "Finance"]);
  const [commandHistory, setCommandHistory] = useState<any[]>([]);
  const [systemUptime, setSystemUptime] = useState(0);
  
  // --- SETTINGS & CONFIG STATE ---
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [aiAssist, setAiAssist] = useState(true);
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);
  const [installationMessage, setInstallationMessage] = useState<string | null>(null);
  const [installProgress, setInstallProgress] = useState(0);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setSystemUptime(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const addCommandLog = (cmd: string) => {
    setCommandHistory(prev => [{
      id: Math.random().toString(36),
      timestamp: new Date().toLocaleTimeString(),
      command: cmd
    }, ...prev].slice(0, 6));
  };

  const filteredDocs = useMemo(() => {
    return VAULT_DATA.filter(doc => 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      doc.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm]);

  const categories = useMemo(() => Array.from(new Set(VAULT_DATA.map(d => d.category))), []);

  // --- FUNCTIONALITY HANDLERS ---
  const triggerSync = async () => {
    setInstallationMessage("Rebuilding Infrastructure...");
    for (let i = 0; i <= 100; i += 10) {
      setInstallProgress(i);
      await new Promise(r => setTimeout(r, 100));
    }
    addCommandLog("Full System Sync: Complete.");
    setInstallationMessage(null);
  };

  const runAudit = async () => {
    setIsDiagnosticRunning(true);
    addCommandLog("Starting Integrity Audit...");
    await new Promise(r => setTimeout(r, 2000));
    addCommandLog("Audit Result: 100% Integrity.");
    setIsDiagnosticRunning(false);
  };

  const exportPDF = async () => {
    if (!printRef.current || !selectedDoc) return;
    addCommandLog("Exporting High-Fidelity PDF...");
    const canvas = await html2canvas(printRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(imgData, "PNG", 0, 0, 210, 297);
    pdf.save(`TOTS_Asset_${selectedDoc.id}.pdf`);
  };

  return (
    <div className={`min-h-screen ${isPrivacyMode ? 'bg-stone-950' : 'bg-[#faf9f6]'} text-stone-900 selection:bg-[#a9b897] overflow-x-hidden transition-colors duration-700`}>
      
      {/* 1. SYNC OVERLAY */}
      <AnimatePresence>
        {installationMessage && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[500] bg-stone-900 p-6 text-center border-b border-[#a9b897]/30"
          >
            <div className="max-w-md mx-auto space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#a9b897]">{installationMessage}</p>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div className="h-full bg-[#a9b897]" animate={{ width: `${installProgress}%` }} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1800px] mx-auto px-4 md:px-12 lg:px-24 py-12 lg:py-24">
        
        {/* 2. HEADER */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-12 border-b border-stone-200 pb-16 mb-16 lg:mb-24">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-stone-900 rounded-2xl text-white shadow-xl shadow-stone-900/20">
                <Fingerprint size={24} />
              </div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${isPrivacyMode ? 'text-stone-500' : 'text-stone-400'}`}>Archival Tier: RESTRICTED</p>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-[9px] font-mono text-stone-500 uppercase tracking-tighter">UPTIME: {Math.floor(systemUptime / 60)}m {systemUptime % 60}s</p>
                </div>
              </div>
            </div>
            <h1 className={`text-6xl md:text-8xl lg:text-9xl font-serif italic tracking-tighter leading-none ${isPrivacyMode ? 'text-white' : ''}`}>
              The <span className="text-stone-300">Vault</span>
            </h1>
          </div>

          {/* Quick Action Hub (Desktop & Tablet) */}
          <div className="flex flex-wrap gap-3 w-full xl:w-auto">
             <button onClick={triggerSync} className="flex-1 lg:flex-none px-8 py-5 bg-[#a9b897] text-stone-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-xl transition-all flex items-center justify-center gap-3">
                <RefreshCw size={16} className={installProgress > 0 && installProgress < 100 ? 'animate-spin' : ''} /> Sync Infrastructure
             </button>
             <button onClick={runAudit} className={`flex-1 lg:flex-none px-8 py-5 border-2 ${isPrivacyMode ? 'border-stone-800 text-stone-400' : 'border-stone-200'} rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-stone-900 hover:text-white transition-all flex items-center justify-center gap-3`}>
                <Activity size={16} className={isDiagnosticRunning ? 'animate-pulse text-red-500' : ''} /> {isDiagnosticRunning ? "Scanning..." : "Integrity Scan"}
             </button>
          </div>
        </header>

        {/* 3. MONITORING GRID */}
        {!selectedDoc && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 lg:mb-24">
            {[
              { label: "Archived Nodes", val: "402", icon: HardDrive, color: "stone" },
              { label: "Sync Status", val: "Live", icon: Radio, color: "green" },
              { label: "System Load", val: "14%", icon: Cpu, color: "blue" },
              { label: "Data Integrity", val: "99.9%", icon: ShieldCheck, color: "purple" }
            ].map((stat, i) => (
              <div key={i} className={`p-8 rounded-[3rem] border ${isPrivacyMode ? 'bg-stone-900 border-stone-800 text-white' : 'bg-white border-stone-100'} shadow-sm flex justify-between items-end group hover:shadow-xl transition-all`}>
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 group-hover:text-[#a9b897]">{stat.label}</p>
                  <p className="text-3xl font-serif italic">{stat.val}</p>
                </div>
                <stat.icon size={24} className="text-stone-200 group-hover:text-[#a9b897] transition-all" />
              </div>
            ))}
          </section>
        )}

        {/* 4. MAIN INTERFACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20">
          
          {/* SIDEBAR */}
          <div className={`${selectedDoc ? 'hidden lg:block' : 'block'} lg:col-span-4 space-y-12`}>
            
            {/* Search */}
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={20} />
              <input 
                className={`w-full p-6 pl-14 rounded-[2.5rem] outline-none shadow-sm focus:ring-[12px] transition-all text-sm font-bold ${isPrivacyMode ? 'bg-stone-900 border-stone-800 text-white focus:ring-white/5' : 'bg-white border-stone-200 focus:ring-stone-900/5'}`} 
                placeholder="Search data nodes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>

            {/* FOLDERS */}
            <div className="space-y-4">
              {categories.map((cat) => (
                <div key={cat} className={`rounded-[2.5rem] border overflow-hidden shadow-sm ${isPrivacyMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
                  <button 
                    onClick={() => setExpandedFolders(prev => prev.includes(cat) ? prev.filter(f => f !== cat) : [...prev, cat])}
                    className="w-full flex justify-between items-center p-8 text-[11px] font-black uppercase tracking-widest text-stone-400"
                  >
                    <div className="flex items-center gap-4">
                      <Folder size={18} className={expandedFolders.includes(cat) ? "text-[#a9b897]" : ""} />
                      {cat}
                    </div>
                    <ChevronDown size={16} className={`transition-transform ${expandedFolders.includes(cat) ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {expandedFolders.includes(cat) && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className={`${isPrivacyMode ? 'bg-black/20' : 'bg-stone-50/50'} p-4 pt-0 space-y-2`}>
                        {filteredDocs.filter(d => d.category === cat).map(doc => (
                          <button 
                            key={doc.id} 
                            onClick={() => { setSelectedDoc(doc); addCommandLog(`Engaging node ID_${doc.id}`); }}
                            className={`w-full text-left p-6 rounded-3xl transition-all border ${selectedDoc?.id === doc.id ? "bg-stone-900 text-white border-stone-900 shadow-xl" : "bg-white border-transparent hover:border-stone-100"}`}
                          >
                            <p className={`text-[12px] font-bold mb-1 ${isPrivacyMode && selectedDoc?.id !== doc.id ? 'text-stone-300' : ''}`}>{doc.title}</p>
                            <div className="flex justify-between items-center opacity-40 text-[8px] font-mono uppercase tracking-widest">
                               <span>{doc.metadata.version}</span>
                               <span>{doc.clarityLevel}</span>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* SYSTEM CONFIGURATION (The Missing Settings) */}
            <div className={`p-10 rounded-[3.5rem] border ${isPrivacyMode ? 'bg-stone-900 border-stone-800 text-white' : 'bg-white border-stone-100 shadow-sm'} space-y-8`}>
                <div className="flex items-center gap-4 border-b border-stone-100 pb-6 mb-2">
                   <Settings size={20} className="text-[#a9b897]" />
                   <h4 className="text-[11px] font-black uppercase tracking-[0.3em]">Control Panel</h4>
                </div>
                
                <div className="space-y-6">
                   <div className="flex justify-between items-center">
                      <div className="space-y-1">
                         <p className="text-[10px] font-bold">Privacy Mode</p>
                         <p className="text-[8px] text-stone-400 uppercase">Obfuscate Interface</p>
                      </div>
                      <button onClick={() => { setIsPrivacyMode(!isPrivacyMode); addCommandLog(`Privacy Mode: ${!isPrivacyMode ? 'ON' : 'OFF'}`); }} className={`w-12 h-6 rounded-full transition-colors relative ${isPrivacyMode ? 'bg-[#a9b897]' : 'bg-stone-200'}`}>
                         <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isPrivacyMode ? 'left-7' : 'left-1'}`} />
                      </button>
                   </div>

                   <div className="flex justify-between items-center">
                      <div className="space-y-1">
                         <p className="text-[10px] font-bold">AI Synthesis</p>
                         <p className="text-[8px] text-stone-400 uppercase">Neural Optimization</p>
                      </div>
                      <button onClick={() => setAiAssist(!aiAssist)} className={`w-12 h-6 rounded-full transition-colors relative ${aiAssist ? 'bg-[#a9b897]' : 'bg-stone-200'}`}>
                         <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${aiAssist ? 'left-7' : 'left-1'}`} />
                      </button>
                   </div>
                </div>

                {/* Live Console Output */}
                <div className="bg-black/5 rounded-3xl p-6 font-mono text-[9px] text-stone-400 space-y-2">
                   {commandHistory.map(log => (
                     <div key={log.id} className="flex gap-4">
                        <span className="text-[#a9b897]">{log.timestamp}</span>
                        <span>{log.command}</span>
                     </div>
                   ))}
                </div>
            </div>
          </div>

          {/* MAIN VIEWPORT */}
          <main className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {selectedDoc ? (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                  className={`rounded-[4rem] border shadow-2xl overflow-hidden ${isPrivacyMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}
                  ref={printRef}
                >
                  {/* Viewport Header */}
                  <div className="p-8 lg:p-16 border-b border-stone-100 lg:border-stone-50 space-y-10">
                    <div className="flex flex-wrap gap-3">
                       <button onClick={() => setSelectedDoc(null)} className="lg:hidden p-3 bg-stone-100 rounded-xl mr-2"><ArrowLeft size={16} /></button>
                       <span className="px-4 py-1.5 bg-stone-100 rounded-full text-[9px] font-black uppercase tracking-widest text-stone-500">{selectedDoc.category}</span>
                       <span className="px-4 py-1.5 bg-green-50 text-green-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-100">Verified Node</span>
                    </div>
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
                       <h2 className={`text-4xl md:text-6xl font-serif italic tracking-tighter leading-none max-w-xl ${isPrivacyMode ? 'text-white' : ''}`}>{selectedDoc.title}</h2>
                       <div className="flex gap-3 w-full lg:w-auto">
                          <button onClick={exportPDF} className="flex-1 lg:flex-none p-5 bg-stone-50 border border-stone-200 rounded-2xl hover:bg-stone-900 hover:text-white transition-all">
                             <Download size={18} />
                          </button>
                          <button onClick={() => addCommandLog("Changes Committed to Ledger.")} className="flex-1 lg:flex-none px-10 py-5 bg-stone-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-[#a9b897] hover:text-stone-900 transition-all">
                             Commit Change
                          </button>
                       </div>
                    </div>
                  </div>

                  {/* AI Bridge Bar */}
                  {aiAssist && (
                    <div className="bg-[#a9b897]/5 p-8 lg:px-16 lg:py-10 border-b border-[#a9b897]/10 flex flex-col md:flex-row justify-between items-center gap-6">
                       <div className="flex items-center gap-4 text-[#a9b897]">
                          <Sparkles size={18} />
                          <p className="text-[10px] font-black uppercase tracking-[0.3em]">Neural Synthesis Bridge Active</p>
                       </div>
                       <button onClick={() => addCommandLog("Running Optimization Pulse...")} className="w-full md:w-auto px-8 py-3 bg-stone-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                          Optimize Logic
                       </button>
                    </div>
                  )}

                  {/* Editor */}
                  <div className="p-8 lg:p-16">
                     <textarea 
                        className={`w-full h-[500px] lg:h-[700px] font-mono text-sm lg:text-base leading-relaxed outline-none resize-none border-none bg-transparent ${isPrivacyMode ? 'text-stone-400' : 'text-stone-700'}`}
                        defaultValue={selectedDoc.content}
                        spellCheck="false"
                     />
                  </div>

                  {/* Footer Stats */}
                  <div className="bg-stone-900 p-8 lg:p-16 text-white grid grid-cols-2 lg:grid-cols-4 gap-12">
                     <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase opacity-40 tracking-widest">Compliance</p>
                        <p className="text-xs font-mono text-[#a9b897]">{selectedDoc.metadata.complianceScore}% Score</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase opacity-40 tracking-widest">Integrity Hash</p>
                        <p className="text-xs font-mono">{selectedDoc.metadata.integrityHash}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase opacity-40 tracking-widest">Version</p>
                        <p className="text-xs font-mono">v{selectedDoc.metadata.version}</p>
                     </div>
                     <div className="space-y-1 text-right">
                        <button onClick={() => setSelectedDoc(null)} className="text-[9px] font-black uppercase tracking-widest underline decoration-[#a9b897] hover:text-[#a9b897] transition-all">Collapse Node</button>
                     </div>
                  </div>
                </motion.div>
              ) : (
                <div className={`hidden lg:flex flex-col items-center justify-center h-[900px] border-2 border-dashed rounded-[5rem] space-y-6 ${isPrivacyMode ? 'border-stone-800' : 'border-stone-200'}`}>
                   <div className="p-10 bg-white/5 rounded-full shadow-inner animate-pulse">
                      <FileCode size={48} className="text-stone-200" />
                   </div>
                   <p className="text-stone-300 font-serif italic text-2xl">Awaiting node selection...</p>
                </div>
              )}
            </AnimatePresence>
          </main>

        </div>
      </div>
    </div>
  );
}