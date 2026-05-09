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
    }, ...prev].slice(0, 8));
  };

  const filteredDocs = useMemo(() => {
    return VAULT_DATA.filter(doc => 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      doc.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm]);

  const categories = useMemo(() => Array.from(new Set(VAULT_DATA.map(d => d.category))), []);

  // --- FUNCTIONALITY HANDLERS ---
  const runInstallation = async () => {
    setInstallationMessage("Initializing Architectural Sync...");
    for (let i = 0; i <= 100; i += 5) {
      setInstallProgress(i);
      await new Promise(r => setTimeout(r, 50));
    }
    addCommandLog("Infrastructure Synchronized.");
    setTimeout(() => setInstallationMessage(null), 1000);
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
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 selection:bg-[#a9b897] selection:text-white overflow-x-hidden">
      
      {/* 1. INSTALLATION OVERLAY */}
      <AnimatePresence>
        {installationMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-lg bg-stone-900 p-8 rounded-[2.5rem] shadow-2xl text-white border border-white/10"
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#a9b897]">{installationMessage}</span>
              <span className="text-xl font-serif italic">{installProgress}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div className="h-full bg-[#a9b897]" animate={{ width: `${installProgress}%` }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1700px] mx-auto px-4 md:px-12 lg:px-24 py-12 lg:py-24 space-y-16 lg:space-y-32">
        
        {/* 2. HEADER: Integrated Functionality */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-12 border-b border-stone-200 pb-16 lg:pb-24">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-stone-900 rounded-2xl text-white shadow-xl shadow-stone-900/20">
                <Fingerprint size={24} />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">Archival Tier: RESTRICTED</p>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-[9px] font-mono text-stone-500 uppercase">Uptime: {Math.floor(systemUptime / 60)}m</p>
                </div>
              </div>
            </div>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif italic tracking-tighter leading-none">
              The <span className="text-stone-300">Vault</span>
            </h1>
          </div>

          {/* Action Buttons: Moved from bottom right to Header */}
          <div className="flex flex-wrap gap-4 w-full xl:w-auto">
             <button onClick={runInstallation} className="flex-1 lg:flex-none px-8 py-5 bg-[#a9b897] text-stone-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-xl transition-all flex items-center justify-center gap-3">
                <Radio size={16} className="animate-pulse" /> Sync Infrastructure
             </button>
             <button onClick={() => addCommandLog("Integrity Audit Initiated...")} className="flex-1 lg:flex-none px-8 py-5 border-2 border-stone-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-stone-900 hover:text-white transition-all flex items-center justify-center gap-3">
                <Activity size={16} /> Run Diagnostics
             </button>
          </div>
        </header>

        {/* 3. MONITORING GRID */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
          {[
            { label: "Global Nodes", val: "402", icon: HardDrive, color: "stone" },
            { label: "System Health", val: "99.8%", icon: ShieldCheck, color: "blue" },
            { label: "Archival Growth", val: "+24%", icon: TrendingUp, color: "green" },
            { label: "Data Integrity", val: "Verified", icon: Database, color: "purple" }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-8 rounded-[3rem] border border-stone-100 shadow-sm flex justify-between items-end group hover:shadow-xl transition-all">
              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 group-hover:text-[#a9b897]">{stat.label}</p>
                <p className="text-3xl font-serif italic">{stat.val}</p>
              </div>
              <stat.icon size={24} className="text-stone-200 group-hover:rotate-12 transition-transform" />
            </div>
          ))}
        </section>

        {/* 4. MAIN INTERFACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20">
          
          {/* SIDEBAR: Directory + Terminal */}
          <div className={`${selectedDoc ? 'hidden lg:block' : 'block'} lg:col-span-4 space-y-12`}>
            
            {/* Search */}
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={20} />
              <input 
                className="w-full p-6 pl-14 bg-white border border-stone-200 rounded-[2.5rem] outline-none shadow-sm focus:ring-[12px] focus:ring-stone-900/5 transition-all text-sm font-bold" 
                placeholder="Traverse nodes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>

            {/* Folder Navigation */}
            <div className="space-y-4">
              {categories.map((cat) => (
                <div key={cat} className="bg-white border border-stone-100 rounded-[2.5rem] overflow-hidden shadow-sm">
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
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="bg-stone-50/50 p-4 pt-0 space-y-2">
                        {filteredDocs.filter(d => d.category === cat).map(doc => (
                          <button 
                            key={doc.id} 
                            onClick={() => { setSelectedDoc(doc); addCommandLog(`Engaged: ${doc.title}`); }}
                            className={`w-full text-left p-6 rounded-3xl transition-all border ${selectedDoc?.id === doc.id ? "bg-stone-900 text-white border-stone-900 shadow-xl" : "bg-white border-transparent hover:border-stone-100"}`}
                          >
                            <p className="text-[12px] font-bold mb-1">{doc.title}</p>
                            <div className="flex justify-between items-center opacity-40 text-[8px] font-mono uppercase">
                               <span>ID_{doc.id}</span>
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

            {/* FULL TERMINAL */}
            <div className="bg-[#0c0c0c] rounded-[3.5rem] p-10 text-white space-y-8 relative overflow-hidden shadow-2xl shadow-stone-900/40">
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                    <Terminal size={18} className="text-[#a9b897]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Command Log</span>
                  </div>
                  <div className="font-mono text-[10px] h-[200px] overflow-y-auto space-y-3 custom-scrollbar pr-2">
                     {commandHistory.map(log => (
                       <div key={log.id} className="border-l-2 border-[#a9b897]/20 pl-4 py-1">
                          <p className="text-[#a9b897] font-bold opacity-60 mb-1">{log.timestamp}</p>
                          <p className="opacity-80 leading-relaxed">{log.command}</p>
                       </div>
                     ))}
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#a9b897]/5 blur-[50px] rounded-full" />
            </div>
          </div>

          {/* RIGHT: DOCUMENT VIEWER */}
          <main className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {selectedDoc ? (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-[4rem] border border-stone-100 shadow-2xl overflow-hidden"
                  ref={printRef}
                >
                  {/* Doc Header */}
                  <div className="p-8 lg:p-16 border-b border-stone-50 space-y-10">
                    <div className="flex flex-wrap gap-3">
                       <span className="px-4 py-1.5 bg-stone-100 rounded-full text-[9px] font-black uppercase tracking-widest text-stone-500">{selectedDoc.category}</span>
                       <span className="px-4 py-1.5 bg-green-50 text-green-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-100">Verification: OK</span>
                    </div>
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
                       <h2 className="text-4xl md:text-6xl font-serif italic tracking-tighter leading-none max-w-xl">{selectedDoc.title}</h2>
                       <div className="flex gap-3 w-full lg:w-auto">
                          <button onClick={exportPDF} className="flex-1 lg:flex-none p-5 bg-stone-50 border border-stone-200 rounded-2xl hover:bg-stone-900 hover:text-white transition-all shadow-sm">
                             <Download size={18} />
                          </button>
                          <button className="flex-1 lg:flex-none px-10 py-5 bg-stone-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">
                             Commit Change
                          </button>
                       </div>
                    </div>
                  </div>

                  {/* AI Synthesis Tooltip / Action */}
                  <div className="bg-stone-50/50 p-8 lg:px-16 lg:py-10 border-b border-stone-100 flex flex-col md:flex-row justify-between items-center gap-6">
                     <div className="flex items-center gap-4 text-stone-400">
                        <Sparkles size={18} />
                        <p className="text-[10px] font-black uppercase tracking-widest">Neural Optimization Bridge Active</p>
                     </div>
                     <button onClick={() => { setIsAiLoading(true); setTimeout(() => { setIsAiLoading(false); addCommandLog("AI Synthesis applied to node."); }, 1500); }} className="w-full md:w-auto px-6 py-3 bg-white border border-stone-200 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:border-[#a9b897] transition-all">
                        {isAiLoading ? "Processing..." : "Run AI Synthesis"}
                     </button>
                  </div>

                  {/* Editor */}
                  <div className="p-8 lg:p-16">
                     <textarea 
                        className="w-full h-[500px] lg:h-[700px] bg-white text-stone-700 font-mono text-sm lg:text-base leading-relaxed outline-none resize-none border-none"
                        defaultValue={selectedDoc.content}
                     />
                  </div>

                  {/* Metadata Footer */}
                  <div className="bg-stone-900 p-8 lg:p-16 text-white grid grid-cols-2 lg:grid-cols-4 gap-8">
                     <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase opacity-40 tracking-widest">Version</p>
                        <p className="text-xs font-mono">{selectedDoc.metadata.version}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase opacity-40 tracking-widest">Integrity Hash</p>
                        <p className="text-xs font-mono">{selectedDoc.metadata.integrityHash}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase opacity-40 tracking-widest">Compliance</p>
                        <p className="text-xs font-mono text-[#a9b897]">{selectedDoc.metadata.complianceScore}%</p>
                     </div>
                     <div className="space-y-1 text-right">
                        <button onClick={() => setSelectedDoc(null)} className="text-[9px] font-black uppercase tracking-widest underline decoration-[#a9b897]">Close Node</button>
                     </div>
                  </div>
                </motion.div>
              ) : (
                <div className="hidden lg:flex flex-col items-center justify-center h-[900px] border-2 border-dashed border-stone-200 rounded-[5rem] space-y-6">
                   <div className="p-10 bg-white rounded-full shadow-inner animate-pulse">
                      <FileCode size={48} className="text-stone-100" />
                   </div>
                   <p className="text-stone-300 font-serif italic text-2xl">Select an operational node to engage interface...</p>
                </div>
              )}
            </AnimatePresence>
          </main>

        </div>
      </div>
    </div>
  );
}