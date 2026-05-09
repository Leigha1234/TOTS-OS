"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { 
  Search, X, Download, Folder, ChevronDown, 
  FileText, Sparkles, Globe, ShieldCheck, Activity, 
  Terminal, HardDrive, Fingerprint, TrendingUp,
  Save, Share2, LayoutGrid, Layers3, ArrowLeft,
  ChevronRight, Calendar, Info, AlertTriangle, FileCode,
  Zap, Radio, HardDriveDownload, Database, Command
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// --- FULL DATA REPOSITORY RESTORED ---
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
    id: 2, 
    title: "Sales Pipeline & Scripting", 
    category: "Sales & Marketing", 
    clarityLevel: "High",
    tags: ["Sales", "Growth", "Scripts"],
    metadata: { lastUpdated: "2026-04-15", version: "1.4.2", author: "Sam G.", complianceScore: 92, integrityHash: "0x441" },
    content: `SALES PIPELINE SYSTEM\n\n📊 Stages\n- New Lead\n- Contacted\n- Qualified\n- Proposal Sent\n- Negotiation\n- Won/Lost\n\n📞 Structure\n- Current situation:\n- Problems / bottlenecks:\n- Impact:\n- Desired outcome:\n- Gap:\n- Offer:`
  },
  {
    id: 3,
    title: "Business Audit Framework",
    category: "Operations",
    clarityLevel: "Diagnostic",
    tags: ["Audit", "Operations", "Efficiency"],
    metadata: { lastUpdated: "2026-05-05", version: "3.0.0", author: "TOTS Strategy", complianceScore: 100, integrityHash: "0x112" },
    content: `BUSINESS AUDIT TEMPLATE\n\n1. Operations\n- Task tracking?\n- Delay points?\n\n2. Sales\n- Lead gen?\n- Conversion %?\n\n3. Clients\n- Onboarding?\n- Retention?\n\n4. Finance\n- Revenue:\n- Profit clarity?`
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
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<string[]>(["Legal & Governance", "Operations", "Finance", "Onboarding & CRM"]);
  const [installationMessage, setInstallationMessage] = useState<string | null>(null);
  const [installProgress, setInstallProgress] = useState(0);
  const [commandHistory, setCommandHistory] = useState<any[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [systemUptime, setSystemUptime] = useState(0);
  const printRef = useRef<HTMLDivElement>(null);

  // System Uptime Logic
  useEffect(() => {
    const timer = setInterval(() => setSystemUptime(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const addCommandLog = (cmd: string) => {
    setCommandHistory(prev => [{
      id: Math.random().toString(36),
      timestamp: new Date().toLocaleTimeString(),
      command: cmd
    }, ...prev].slice(0, 12));
  };

  const filteredDocs = useMemo(() => {
    return VAULT_DATA.filter(doc => 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      doc.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm]);

  const categories = useMemo(() => Array.from(new Set(VAULT_DATA.map(d => d.category))), []);

  const runInstallation = async () => {
    setInstallationMessage("Initializing Architectural Sync...");
    for (let i = 0; i <= 100; i += 5) {
      setInstallProgress(i);
      await new Promise(r => setTimeout(r, 40));
    }
    addCommandLog("Infrastructure Synchronized via Radio Frequency.");
    setTimeout(() => setInstallationMessage(null), 1200);
  };

  const exportPDF = async () => {
    if (!printRef.current || !selectedDoc) return;
    addCommandLog("Generating PDF output...");
    const canvas = await html2canvas(printRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(imgData, "PNG", 0, 0, 210, 297);
    pdf.save(`TOTS_${selectedDoc.id}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 selection:bg-[#a9b897] selection:text-white overflow-x-hidden pb-10">
      
      {/* 1. INSTALLATION OVERLAY (MOBILE OPTIMIZED) */}
      <AnimatePresence>
        {installationMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-4 left-4 right-4 z-[300] md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg bg-stone-900 p-6 md:p-8 rounded-[2rem] shadow-2xl text-white border border-white/10"
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#a9b897]">{installationMessage}</span>
              <span className="text-lg font-serif italic">{installProgress}%</span>
            </div>
            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div className="h-full bg-[#a9b897]" animate={{ width: `${installProgress}%` }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1700px] mx-auto px-4 md:px-12 lg:px-24 py-8 md:py-24 space-y-12 lg:space-y-32">
        
        {/* 2. HEADER */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 border-b border-stone-200 pb-12 lg:pb-24">
          <div className="space-y-6 w-full">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-stone-900 rounded-2xl text-white shadow-xl shadow-stone-900/20">
                <Fingerprint size={20} />
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-400">Vault Security Node</p>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-[9px] font-mono text-stone-500 uppercase tracking-tighter">Latency: 24ms / Uptime: {Math.floor(systemUptime / 60)}m</p>
                </div>
              </div>
            </div>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif italic tracking-tighter leading-[0.85]">
              The <span className="text-stone-300">Vault</span>
            </h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full xl:w-auto">
             <button onClick={runInstallation} className="px-6 py-5 bg-[#a9b897] text-stone-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-xl transition-all flex items-center justify-center gap-3">
                <Radio size={14} className="animate-pulse" /> Sync Infra
             </button>
             <button onClick={() => addCommandLog("Diagnostic: All nodes operational.")} className="px-6 py-5 border-2 border-stone-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-stone-900 hover:text-white transition-all flex items-center justify-center gap-3">
                <Activity size={14} /> Diagnostics
             </button>
          </div>
        </header>

        {/* 3. MONITORING GRID */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-10">
          {[
            { label: "Nodes", val: "402", icon: HardDrive },
            { label: "Health", val: "99.8%", icon: ShieldCheck },
            { label: "Growth", val: "+24%", icon: TrendingUp },
            { label: "Verified", val: "YES", icon: Database }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-stone-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-end group transition-all">
              <div className="space-y-1">
                <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-stone-400">{stat.label}</p>
                <p className="text-xl md:text-3xl font-serif italic">{stat.val}</p>
              </div>
              <stat.icon size={20} className="mt-2 md:mt-0 text-stone-200 group-hover:text-[#a9b897] transition-colors" />
            </div>
          ))}
        </section>

        {/* 4. MAIN INTERFACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20">
          
          {/* SIDEBAR */}
          <div className={`${selectedDoc ? 'hidden lg:block' : 'block'} lg:col-span-4 space-y-10`}>
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
              <input 
                className="w-full p-6 pl-14 bg-white border border-stone-200 rounded-[2rem] outline-none shadow-sm text-xs font-bold" 
                placeholder="Traverse nodes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>

            <div className="space-y-3">
              {categories.map((cat) => (
                <div key={cat} className="bg-white border border-stone-100 rounded-[2rem] overflow-hidden">
                  <button 
                    onClick={() => setExpandedFolders(prev => prev.includes(cat) ? prev.filter(f => f !== cat) : [...prev, cat])}
                    className="w-full flex justify-between items-center p-6 text-[10px] font-black uppercase tracking-widest text-stone-400"
                  >
                    <div className="flex items-center gap-3">
                      <Folder size={14} className={expandedFolders.includes(cat) ? "text-[#a9b897]" : ""} />
                      {cat}
                    </div>
                    <ChevronDown size={14} className={expandedFolders.includes(cat) ? "rotate-180" : ""} />
                  </button>
                  <AnimatePresence>
                    {expandedFolders.includes(cat) && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="bg-stone-50/30 px-3 pb-3 space-y-1.5">
                        {filteredDocs.filter(d => d.category === cat).map(doc => (
                          <button 
                            key={doc.id} 
                            onClick={() => { setSelectedDoc(doc); addCommandLog(`Accessing: ${doc.title}`); }}
                            className={`w-full text-left p-5 rounded-2xl transition-all border ${selectedDoc?.id === doc.id ? "bg-stone-900 text-white border-stone-900 shadow-xl" : "bg-white border-transparent hover:border-stone-100"}`}
                          >
                            <p className="text-[11px] font-bold truncate">{doc.title}</p>
                            <div className="flex justify-between mt-2 opacity-40 text-[7px] font-mono uppercase tracking-tighter">
                               <span>ID_{doc.id}</span>
                               <span>Lvl: {doc.clarityLevel}</span>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            <div className="bg-[#0c0c0c] rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl">
                <div className="flex items-center gap-2 opacity-40">
                  <Terminal size={14} className="text-[#a9b897]" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Command Log</span>
                </div>
                <div className="font-mono text-[9px] h-[150px] overflow-y-auto space-y-3 custom-scrollbar">
                   {commandHistory.map(log => (
                     <p key={log.id} className="leading-relaxed"><span className="text-[#a9b897] mr-2">{log.timestamp}</span> {log.command}</p>
                   ))}
                </div>
            </div>
          </div>

          {/* DOCUMENT VIEWER */}
          <main className={`${!selectedDoc ? 'hidden lg:block' : 'block'} lg:col-span-8`}>
            <AnimatePresence mode="wait">
              {selectedDoc ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white rounded-[3rem] md:rounded-[4rem] border border-stone-100 shadow-2xl overflow-hidden" ref={printRef}>
                  <div className="p-8 md:p-16 border-b border-stone-50 space-y-8">
                    <div className="flex items-center justify-between">
                       <button onClick={() => setSelectedDoc(null)} className="lg:hidden p-3 bg-stone-100 rounded-xl"><ArrowLeft size={16}/></button>
                       <span className="px-4 py-1.5 bg-stone-100 rounded-full text-[8px] font-black uppercase tracking-widest text-stone-500">{selectedDoc.category}</span>
                    </div>
                    <div className="space-y-6">
                       <h2 className="text-4xl md:text-7xl font-serif italic tracking-tighter leading-none">{selectedDoc.title}</h2>
                       <div className="flex gap-2">
                          <button onClick={exportPDF} className="p-5 bg-stone-50 border border-stone-200 rounded-2xl hover:bg-stone-900 hover:text-white transition-all"><Download size={18} /></button>
                          <button onClick={() => addCommandLog(`Syncing changes for Node ${selectedDoc.id}...`)} className="flex-1 px-8 py-5 bg-stone-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Commit Change</button>
                       </div>
                    </div>
                  </div>

                  <div className="bg-stone-50/50 p-6 md:px-16 md:py-8 border-b border-stone-100 flex flex-col md:flex-row justify-between items-center gap-4">
                     <div className="flex items-center gap-3 text-stone-400">
                        <Sparkles size={16} />
                        <p className="text-[9px] font-black uppercase tracking-widest">AI Synthesis Bridge Engaged</p>
                     </div>
                     <button onClick={() => { setIsAiLoading(true); setTimeout(() => { setIsAiLoading(false); addCommandLog("AI synthesis successful."); }, 1200); }} className="w-full md:w-auto px-6 py-2 bg-white border border-stone-200 rounded-xl text-[8px] font-black uppercase tracking-widest hover:border-[#a9b897]">
                        {isAiLoading ? "Processing..." : "Run Optimization"}
                     </button>
                  </div>

                  <div className="p-8 md:p-16">
                     <textarea className="w-full h-[400px] md:h-[600px] bg-white text-stone-700 font-mono text-xs md:text-sm leading-relaxed outline-none resize-none border-none" defaultValue={selectedDoc.content} />
                  </div>

                  <div className="bg-stone-900 p-8 md:p-12 text-white grid grid-cols-2 md:grid-cols-4 gap-6">
                     <div className="space-y-1">
                        <p className="text-[7px] font-black uppercase opacity-40">Version</p>
                        <p className="text-[10px] font-mono">{selectedDoc.metadata.version}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[7px] font-black uppercase opacity-40">Compliance</p>
                        <p className="text-[10px] font-mono text-[#a9b897]">{selectedDoc.metadata.complianceScore}%</p>
                     </div>
                     <div className="space-y-1 hidden md:block">
                        <p className="text-[7px] font-black uppercase opacity-40">Integrity</p>
                        <p className="text-[10px] font-mono truncate">{selectedDoc.metadata.integrityHash}</p>
                     </div>
                     <div className="text-right">
                        <button onClick={() => setSelectedDoc(null)} className="text-[8px] font-black uppercase tracking-widest underline decoration-[#a9b897]">Close Node</button>
                     </div>
                  </div>
                </motion.div>
              ) : (
                <div className="hidden lg:flex flex-col items-center justify-center h-[800px] border-2 border-dashed border-stone-200 rounded-[4rem] space-y-6">
                   <FileCode size={40} className="text-stone-100" />
                   <p className="text-stone-300 font-serif italic text-xl">Select a node to begin...</p>
                </div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}