"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, Download, Folder, ChevronDown, 
  Sparkles, ShieldCheck, Activity, 
  Terminal, HardDrive, Fingerprint, TrendingUp,
  ArrowLeft, FileCode, Radio, Database, Timer,
  Lock, Zap, Cpu, Globe, Share2, Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";

// --- EXPANDED DATA REPOSITORY ---
const VAULT_DATA = [
  { 
    id: "CL-001", 
    title: "Client Intake Protocol", 
    category: "Clients & CRM", 
    content: `CLIENT ONBOARDING SYSTEM\n\n📄 Intake Form\nName: [Client Name]\nBusiness: [Business Name]\nService purchased: [Service Name]\nStart date: [YYYY-MM-DD]\n\n⚙️ Workflow\n[ ] New client created\n[ ] Send welcome email\n[ ] Send contract + invoice\n[ ] Create project board\n[ ] Book kickoff call`,
    metadata: { lastUpdated: "2026-05-01", version: "2.1.0", author: "Admin", integrityHash: "0x882" }
  },
  { 
    id: "SL-441", 
    title: "Sales Conversion Script", 
    category: "Sales & Marketing", 
    content: `SALES PIPELINE SYSTEM\n\n📞 Call Structure\n- Current situation:\n- Problems / bottlenecks:\n- Impact:\n- Desired outcome:\n- Gap:\n- Offer:`,
    metadata: { lastUpdated: "2026-04-15", version: "1.4.2", author: "Sales Node", integrityHash: "0x441" }
  },
  {
    id: "OP-112",
    title: "Operational Efficiency Audit",
    category: "Operations",
    content: `BUSINESS AUDIT TEMPLATE\n\n1. Operations\n- Task tracking status\n- Delay points identified\n\n2. Finance Check\n- Revenue targets vs actuals\n- Profit margin clarity`,
    metadata: { lastUpdated: "2026-05-05", version: "3.0.0", author: "Ops Lead", integrityHash: "0x112" }
  },
  {
    id: "LG-990",
    title: "Master Service Agreement",
    category: "Legal & Governance",
    content: `MSA FRAMEWORK\n\n1. Introduction\nAgreement between [Business] and [Client].\n\n2. Payment Terms\nInvoices are due within 7 days of issue.`,
    metadata: { lastUpdated: "2026-05-12", version: "4.1.0", author: "Legal Node", integrityHash: "0xLG9" }
  },
  {
    id: "FN-130",
    title: "Quarterly P&L Forecaster",
    category: "Finance",
    content: `P&L FORECASTER\n\nMonthly Input:\n- Projected Revenue\n- Fixed Costs\n- Variable Costs\n\nFormula:\nMargin = (Revenue - Total Costs) / Revenue`,
    metadata: { lastUpdated: "2026-05-07", version: "1.2.0", author: "Finance Node", integrityHash: "0xFN1" }
  }
];

export default function VaultPage() {
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<string[]>(["Clients & CRM", "Operations", "Legal & Governance"]);
  const [commandHistory, setCommandHistory] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [systemUptime, setSystemUptime] = useState(0);
  const [aiStatus, setAiStatus] = useState("Idle");
  
  const printRef = useRef<HTMLDivElement>(null);

  // --- SYSTEM LOGIC ---
  useEffect(() => {
    const timer = setInterval(() => setSystemUptime(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

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
      doc.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const categories = useMemo(() => Array.from(new Set(VAULT_DATA.map(d => d.category))), []);

  const handleSync = async () => {
    setIsSyncing(true);
    logCommand("Initializing database handshake...");
    await new Promise(r => setTimeout(r, 1500));
    setIsSyncing(false);
    logCommand("Node architecture synchronized.");
    toast.success("System Sync Complete");
  };

  const exportPDF = async () => {
    if (!printRef.current || !selectedDoc) return;
    logCommand(`Compiling node ${selectedDoc.id} to PDF...`);
    const canvas = await html2canvas(printRef.current);
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297);
    pdf.save(`VAULT_${selectedDoc.id}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-[#1C1917] transition-all duration-700">
      
      <div className="max-w-[1700px] mx-auto px-8 py-12 md:p-16 lg:p-20 space-y-16 lg:space-y-24">
        
        {/* HEADER AREA */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-12 border-b border-stone-200 pb-16">
          <div className="space-y-8">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-stone-900 text-white rounded-[1.2rem] flex items-center justify-center shadow-2xl">
                <Lock size={24} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Environment Secure</p>
                </div>
                <p className="text-[10px] font-mono text-stone-300 uppercase">Uptime: {Math.floor(systemUptime / 60)}m {systemUptime % 60}s</p>
              </div>
            </div>
            <h1 className="text-8xl md:text-9xl font-serif italic tracking-tighter leading-none text-stone-900">
              The Vault
            </h1>
          </div>

          <div className="flex flex-wrap gap-4 w-full xl:w-auto">
             <button 
                onClick={handleSync} 
                disabled={isSyncing}
                className="px-10 py-6 bg-stone-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-stone-800 transition-all flex items-center gap-4 shadow-xl disabled:opacity-50"
             >
                <Radio size={16} className={isSyncing ? "animate-spin" : "animate-pulse"} /> 
                {isSyncing ? "Syncing..." : "Sync Infrastructure"}
             </button>
             <button className="px-10 py-6 border border-stone-200 bg-white text-stone-400 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:border-stone-900 hover:text-stone-900 transition-all flex items-center gap-4">
                <Activity size={16} /> Diagnostic
             </button>
          </div>
        </header>

        {/* METRICS GRID */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: "Active Nodes", val: "542", icon: HardDrive, color: "text-blue-500" },
            { label: "Integrity Factor", val: "99.9%", icon: ShieldCheck, color: "text-emerald-500" },
            { label: "Neural Load", val: "12%", icon: Cpu, color: "text-amber-500" },
            { label: "Global Sync", val: "Active", icon: Globe, color: "text-stone-900" }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-10 rounded-[3.5rem] border border-stone-100 shadow-sm group hover:shadow-xl transition-all">
              <div className="flex justify-between items-start mb-6">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-300">{stat.label}</p>
                <stat.icon size={18} className={`${stat.color} opacity-40 group-hover:opacity-100 transition-opacity`} />
              </div>
              <p className="text-5xl font-serif italic text-stone-900">{stat.val}</p>
            </div>
          ))}
        </section>

        {/* MAIN WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 xl:gap-24">
          
          {/* SIDEBAR: NAVIGATION & TERMINAL */}
          <div className="lg:col-span-4 space-y-12">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={20} />
              <input 
                className="w-full p-7 pl-16 bg-white border border-stone-100 rounded-[2.5rem] outline-none shadow-sm text-xs font-bold focus:border-stone-900 focus:ring-4 ring-stone-900/5 transition-all" 
                placeholder="Traverse system nodes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>

            <div className="space-y-6">
              {categories.map((cat) => (
                <div key={cat} className="bg-white border border-stone-100 rounded-[3rem] overflow-hidden shadow-sm">
                  <button 
                    onClick={() => setExpandedFolders(prev => prev.includes(cat) ? prev.filter(f => f !== cat) : [...prev, cat])}
                    className="w-full flex justify-between items-center p-8 text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 hover:text-stone-900 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Folder size={16} className={expandedFolders.includes(cat) ? "text-stone-900" : "text-stone-200"} />
                      {cat}
                    </div>
                    <ChevronDown size={16} className={`transition-transform duration-500 ${expandedFolders.includes(cat) ? "rotate-180 text-stone-900" : ""}`} />
                  </button>
                  
                  <AnimatePresence>
                    {expandedFolders.includes(cat) && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="bg-stone-50/50 px-4 pb-4 space-y-2 overflow-hidden">
                        {filteredDocs.filter(d => d.category === cat).map(doc => (
                          <button 
                            key={doc.id} 
                            onClick={() => { setSelectedDoc(doc); logCommand(`Accessing node: ${doc.title}`); }}
                            className={`w-full text-left p-6 rounded-[2rem] transition-all border ${selectedDoc?.id === doc.id ? "bg-stone-900 text-white border-transparent shadow-2xl scale-[1.02]" : "bg-white border-transparent hover:border-stone-200"}`}
                          >
                            <p className="text-[11px] font-bold truncate mb-2">{doc.title}</p>
                            <div className="flex justify-between items-center opacity-40 text-[7px] font-mono uppercase">
                               <span>ID: {doc.id}</span>
                               <span>V.{doc.metadata.version}</span>
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
            <div className="bg-stone-900 rounded-[3.5rem] p-10 text-white space-y-8 shadow-2xl relative overflow-hidden group">
                <div className="flex items-center justify-between opacity-50 relative z-10">
                  <div className="flex items-center gap-3">
                    <Terminal size={16} className="text-amber-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Core Stream</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                </div>
                <div className="font-mono text-[10px] h-40 overflow-y-auto space-y-4 scrollbar-hide relative z-10">
                   {commandHistory.map(log => (
                     <p key={log.id} className="leading-relaxed border-l border-white/10 pl-4">
                       <span className="text-stone-500 mr-3">{log.timestamp}</span> 
                       <span className="text-stone-200">{log.command}</span>
                     </p>
                   ))}
                   {commandHistory.length === 0 && <p className="text-stone-600 italic">Awaiting node selection...</p>}
                </div>
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all" />
            </div>
          </div>

          {/* MAIN DOCUMENT VIEWER */}
          <main className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {selectedDoc ? (
                <motion.div 
                  key={selectedDoc.id}
                  initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} 
                  className="bg-white rounded-[5rem] border border-stone-100 shadow-2xl overflow-hidden min-h-[900px] flex flex-col" 
                  ref={printRef}
                >
                  <div className="p-12 md:p-20 border-b border-stone-100 space-y-12">
                    <div className="flex items-center justify-between">
                       <button onClick={() => setSelectedDoc(null)} className="p-5 bg-stone-50 rounded-[1.5rem] hover:bg-stone-100 transition-all"><ArrowLeft size={20}/></button>
                       <div className="flex gap-4">
                          <span className="px-6 py-2.5 bg-stone-50 rounded-full text-[10px] font-black uppercase tracking-widest text-stone-400 border border-stone-100">
                            {selectedDoc.category}
                          </span>
                       </div>
                    </div>
                    
                    <div className="space-y-12">
                       <h2 className="text-6xl md:text-8xl font-serif italic tracking-tighter leading-none text-stone-900">{selectedDoc.title}</h2>
                       <div className="flex flex-wrap gap-6">
                          <button onClick={exportPDF} className="p-7 bg-stone-50 border border-stone-100 rounded-[2rem] hover:bg-stone-900 hover:text-white transition-all group">
                            <Download size={24} className="group-hover:bounce" />
                          </button>
                          <button onClick={() => logCommand(`Committing delta to Node ${selectedDoc.id}...`)} className="flex-1 px-12 py-7 bg-stone-900 text-white rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.3em] hover:bg-stone-800 transition-all shadow-xl active:scale-95">
                            Commit Session Changes
                          </button>
                          <button className="p-7 border border-stone-100 rounded-[2rem] text-stone-300 hover:text-red-500 hover:border-red-100 transition-all">
                             <Trash2 size={24} />
                          </button>
                       </div>
                    </div>
                  </div>

                  {/* NEURAL CONTEXT BAR */}
                  <div className="bg-stone-50/50 px-12 md:px-20 py-8 border-b border-stone-100 flex flex-col md:flex-row justify-between items-center gap-6">
                     <div className="flex items-center gap-4 text-stone-900">
                        <Sparkles size={20} className="text-amber-500 animate-pulse" />
                        <div className="space-y-0.5">
                           <p className="text-[10px] font-black uppercase tracking-[0.2em]">Neural Synthesis Engine</p>
                           <p className="text-[9px] font-mono text-stone-400 italic">Status: {aiStatus}</p>
                        </div>
                     </div>
                     <button 
                        onClick={() => { 
                           setAiStatus("Processing...");
                           setTimeout(() => { setAiStatus("Idle"); logCommand("Draft optimization applied."); toast.success("AI Synthesis Complete"); }, 1500); 
                        }} 
                        className="w-full md:w-auto px-8 py-4 bg-white border border-stone-200 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:border-stone-900 transition-all flex items-center gap-3"
                     >
                        <Zap size={14} className="text-amber-500" /> Optimize Content
                     </button>
                  </div>

                  {/* TEXT CONTENT AREA */}
                  <div className="flex-1 p-12 md:p-20 relative">
                     <textarea 
                        className="w-full h-full min-h-[600px] bg-transparent text-stone-800 font-mono text-base leading-relaxed outline-none resize-none border-none custom-scrollbar" 
                        defaultValue={selectedDoc.content} 
                        spellCheck={false}
                     />
                     <div className="absolute top-10 right-10 flex gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-stone-100" />
                         <div className="w-1.5 h-1.5 rounded-full bg-stone-100" />
                         <div className="w-1.5 h-1.5 rounded-full bg-stone-100" />
                     </div>
                  </div>

                  {/* DATA FOOTER */}
                  <div className="bg-stone-900 p-12 md:p-16 text-white grid grid-cols-2 md:grid-cols-4 gap-12 relative overflow-hidden">
                     <div className="space-y-2 relative z-10">
                        <p className="text-[9px] font-black uppercase opacity-40 tracking-widest">Protocol Version</p>
                        <p className="text-sm font-mono text-amber-400">{selectedDoc.metadata.version}</p>
                     </div>
                     <div className="space-y-2 relative z-10">
                        <p className="text-[9px] font-black uppercase opacity-40 tracking-widest">Author Node</p>
                        <p className="text-sm font-serif italic">{selectedDoc.metadata.author}</p>
                     </div>
                     <div className="space-y-2 relative z-10 hidden md:block">
                        <p className="text-[9px] font-black uppercase opacity-40 tracking-widest">Security Hash</p>
                        <p className="text-sm font-mono truncate text-stone-500">{selectedDoc.metadata.integrityHash}</p>
                     </div>
                     <div className="text-right flex flex-col justify-end items-end relative z-10">
                        <button onClick={() => setSelectedDoc(null)} className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-500 hover:text-white transition-colors">Terminate Node Session</button>
                     </div>
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-stone-700 to-transparent opacity-20" />
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[900px] border-4 border-dashed border-stone-100 rounded-[5rem] space-y-10 group bg-white/50">
                   <div className="p-12 bg-white rounded-full shadow-inner border border-stone-50 group-hover:scale-110 transition-transform duration-700">
                      <FileCode size={80} className="text-stone-200" />
                   </div>
                   <div className="text-center space-y-4">
                      <p className="text-stone-300 font-serif italic text-4xl">Select a node from the vault ledger</p>
                      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-200">Awaiting user authorization</p>
                   </div>
                </div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E7E5E4; border-radius: 20px; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        textarea::selection { background: #1C1917; color: #F9F9F7; }
      `}</style>
    </div>
  );
}