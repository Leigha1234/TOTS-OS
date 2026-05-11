"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, Download, Folder, ChevronDown, 
  Sparkles, ShieldCheck, Activity, 
  Terminal, HardDrive, Fingerprint, TrendingUp,
  ArrowLeft, FileCode, Radio, Database, Timer
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
    content: `BUSINESS LEGAL FOUNDATIONS - T&Cs\n\n⚠️ MASTER DISCLAIMER\nFramework only. Consult a solicitor.\n\n1. Introduction\nAgreement between [Business] and [Client].\n\n2. Scope\ delivery of: [Work]`
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
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<string[]>(["Legal & Governance", "Operations", "Finance"]);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState(0);
  const [commandHistory, setCommandHistory] = useState<any[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [systemUptime, setSystemUptime] = useState(0);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setSystemUptime(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const logCommand = (cmd: string) => {
    setCommandHistory(prev => [{
      id: Math.random().toString(36),
      timestamp: new Date().toLocaleTimeString(),
      command: cmd
    }, ...prev].slice(0, 10));
  };

  const filteredDocs = useMemo(() => {
    return VAULT_DATA.filter(doc => 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      doc.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm]);

  const categories = useMemo(() => Array.from(new Set(VAULT_DATA.map(d => d.category))), []);

  const runSync = async () => {
    setSyncStatus("Architectural Syncing...");
    for (let i = 0; i <= 100; i += 10) {
      setSyncProgress(i);
      await new Promise(r => setTimeout(r, 60));
    }
    logCommand("Node architecture synchronized.");
    setTimeout(() => setSyncStatus(null), 1000);
  };

  const exportPDF = async () => {
    if (!printRef.current || !selectedDoc) return;
    logCommand(`Exporting ${selectedDoc.id} to PDF format...`);
    const canvas = await html2canvas(printRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(imgData, "PNG", 0, 0, 210, 297);
    pdf.save(`VAULT_NODE_${selectedDoc.id}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] transition-colors duration-500 overflow-x-hidden">
      
      {/* SYNC OVERLAY */}
      <AnimatePresence>
        {syncStatus && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md bg-[var(--card-bg)] border border-[var(--brand-primary)] p-6 rounded-3xl shadow-2xl"
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-primary)]">{syncStatus}</span>
              <span className="text-xl font-serif italic">{syncProgress}%</span>
            </div>
            <div className="h-1 w-full bg-[var(--bg-soft)] rounded-full overflow-hidden">
              <motion.div className="h-full bg-[var(--brand-primary)]" animate={{ width: `${syncProgress}%` }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1600px] mx-auto px-6 py-12 md:p-16 lg:p-20 space-y-12 lg:space-y-24">
        
        {/* HEADER */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 border-b border-[var(--border)] pb-12 lg:pb-20">
          <div className="space-y-6 w-full">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-[var(--text-main)] text-[var(--bg)] rounded-2xl shadow-xl">
                <Fingerprint size={20} />
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Security Protocol: Active</p>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-[9px] font-mono text-[var(--text-muted)] uppercase">Uptime: {Math.floor(systemUptime / 60)}m</p>
                </div>
              </div>
            </div>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif italic tracking-tighter leading-none text-[var(--brand-primary)]">
              The Vault
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full xl:w-auto">
             <button onClick={runSync} className="px-8 py-5 bg-[var(--brand-primary)] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-3">
                <Radio size={14} className="animate-pulse" /> Sync Infra
             </button>
             <button onClick={() => logCommand("Running full node diagnostic...")} className="px-8 py-5 border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-main)] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[var(--bg-soft)] transition-all flex items-center justify-center gap-3">
                <Activity size={14} /> Diagnostic
             </button>
          </div>
        </header>

        {/* METRICS */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Active Nodes", val: "402", icon: HardDrive },
            { label: "Integrity", val: "99.8%", icon: ShieldCheck },
            { label: "Throughput", val: "+24%", icon: TrendingUp },
            { label: "Uptime", val: "YES", icon: Database }
          ].map((stat, i) => (
            <div key={i} className="bg-[var(--card-bg)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-end group transition-all">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">{stat.label}</p>
                <p className="text-3xl font-serif italic">{stat.val}</p>
              </div>
              <stat.icon size={20} className="mt-4 md:mt-0 text-[var(--text-muted)] opacity-30 group-hover:text-[var(--brand-primary)] group-hover:opacity-100 transition-all" />
            </div>
          ))}
        </section>

        {/* VAULT CORE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          
          {/* SIDEBAR: NAVIGATION */}
          <div className={`${selectedDoc ? 'hidden lg:block' : 'block'} lg:col-span-4 space-y-8`}>
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
              <input 
                className="w-full p-6 pl-14 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl outline-none shadow-sm text-xs font-bold focus:border-[var(--brand-primary)]" 
                placeholder="Traverse file system..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>

            <div className="space-y-4">
              {categories.map((cat) => (
                <div key={cat} className="bg-[var(--card-bg)] border border-[var(--border)] rounded-3xl overflow-hidden">
                  <button 
                    onClick={() => setExpandedFolders(prev => prev.includes(cat) ? prev.filter(f => f !== cat) : [...prev, cat])}
                    className="w-full flex justify-between items-center p-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  >
                    <div className="flex items-center gap-3">
                      <Folder size={14} className={expandedFolders.includes(cat) ? "text-[var(--brand-primary)]" : ""} />
                      {cat}
                    </div>
                    <ChevronDown size={14} className={`transition-transform ${expandedFolders.includes(cat) ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {expandedFolders.includes(cat) && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="bg-[var(--bg-soft)]/30 px-3 pb-3 space-y-2">
                        {filteredDocs.filter(d => d.category === cat).map(doc => (
                          <button 
                            key={doc.id} 
                            onClick={() => { setSelectedDoc(doc); logCommand(`Accessing node: ${doc.title}`); }}
                            className={`w-full text-left p-5 rounded-2xl transition-all border ${selectedDoc?.id === doc.id ? "bg-[var(--text-main)] text-[var(--bg)] border-transparent shadow-xl" : "bg-[var(--card-bg)] border-transparent hover:border-[var(--border)]"}`}
                          >
                            <p className="text-[11px] font-bold truncate">{doc.title}</p>
                            <div className="flex justify-between mt-2 opacity-40 text-[7px] font-mono uppercase tracking-tighter">
                               <span>NODE_{doc.id}</span>
                               <span>V: {doc.metadata.version}</span>
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
            <div className="bg-[#0a0a0a] rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl border border-white/5">
                <div className="flex items-center gap-2 opacity-50">
                  <Terminal size={14} className="text-[var(--brand-primary)]" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Core Command Stream</span>
                </div>
                <div className="font-mono text-[10px] h-32 overflow-y-auto space-y-3 scrollbar-hide">
                   {commandHistory.map(log => (
                     <p key={log.id} className="leading-relaxed"><span className="text-[var(--brand-primary)] mr-2">[{log.timestamp}]</span> {log.command}</p>
                   ))}
                </div>
            </div>
          </div>

          {/* MAIN: DOCUMENT VIEWER */}
          <main className={`${!selectedDoc ? 'hidden lg:block' : 'block'} lg:col-span-8`}>
            <AnimatePresence mode="wait">
              {selectedDoc ? (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} 
                  className="bg-[var(--card-bg)] rounded-[4rem] border border-[var(--border)] shadow-2xl overflow-hidden" 
                  ref={printRef}
                >
                  <div className="p-8 md:p-16 border-b border-[var(--border)] space-y-8">
                    <div className="flex items-center justify-between">
                       <button onClick={() => setSelectedDoc(null)} className="lg:hidden p-4 bg-[var(--bg-soft)] rounded-2xl"><ArrowLeft size={16}/></button>
                       <span className="px-5 py-2 bg-[var(--bg-soft)] rounded-full text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] border border-[var(--border)]">
                        {selectedDoc.category}
                       </span>
                    </div>
                    <div className="space-y-8">
                       <h2 className="text-4xl md:text-7xl font-serif italic tracking-tighter leading-none text-[var(--brand-primary)]">{selectedDoc.title}</h2>
                       <div className="flex gap-4">
                          <button onClick={exportPDF} className="p-6 bg-[var(--bg-soft)] border border-[var(--border)] rounded-2xl hover:bg-[var(--text-main)] hover:text-[var(--bg)] transition-all">
                            <Download size={20} />
                          </button>
                          <button onClick={() => logCommand(`Committing delta to Node ${selectedDoc.id}...`)} className="flex-1 px-10 py-6 bg-[var(--text-main)] text-[var(--bg)] rounded-2xl font-black text-[11px] uppercase tracking-widest hover:opacity-90">
                            Commit Local Changes
                          </button>
                       </div>
                    </div>
                  </div>

                  {/* AI CONTEXT BAR */}
                  <div className="bg-[var(--bg-soft)] px-8 md:px-16 py-6 border-b border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-4">
                     <div className="flex items-center gap-3 text-[var(--brand-primary)]">
                        <Sparkles size={16} />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Neural Synthesis Engine Active</p>
                     </div>
                     <button 
                        onClick={() => { setIsAiLoading(true); setTimeout(() => { setIsAiLoading(false); logCommand("Optimization complete."); }, 1200); }} 
                        className="w-full md:w-auto px-6 py-3 bg-white border border-[var(--border)] rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-[var(--brand-primary)]"
                     >
                        {isAiLoading ? "Processing..." : "Run Optimization"}
                     </button>
                  </div>

                  {/* CONTENT AREA */}
                  <div className="p-8 md:p-16">
                     <textarea 
                        className="w-full h-[500px] md:h-[700px] bg-transparent text-[var(--text-main)] font-mono text-sm leading-relaxed outline-none resize-none border-none scrollbar-hide" 
                        defaultValue={selectedDoc.content} 
                     />
                  </div>

                  {/* FOOTER METADATA */}
                  <div className="bg-[var(--text-main)] p-12 text-[var(--bg)] grid grid-cols-2 md:grid-cols-4 gap-8">
                     <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase opacity-40">System Version</p>
                        <p className="text-[11px] font-mono">{selectedDoc.metadata.version}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase opacity-40">Compliance Node</p>
                        <p className="text-[11px] font-mono text-[var(--brand-primary)]">{selectedDoc.metadata.complianceScore}% Verified</p>
                     </div>
                     <div className="space-y-1 hidden md:block">
                        <p className="text-[8px] font-black uppercase opacity-40">Integrity Hash</p>
                        <p className="text-[11px] font-mono truncate">{selectedDoc.metadata.integrityHash}</p>
                     </div>
                     <div className="text-right flex items-end justify-end">
                        <button onClick={() => setSelectedDoc(null)} className="text-[9px] font-black uppercase tracking-widest hover:text-[var(--brand-primary)] transition-colors">Terminate Node Session</button>
                     </div>
                  </div>
                </motion.div>
              ) : (
                <div className="hidden lg:flex flex-col items-center justify-center h-full min-h-[800px] border-2 border-dashed border-[var(--border)] rounded-[4rem] space-y-6">
                   <FileCode size={64} className="text-[var(--text-muted)] opacity-20" />
                   <p className="text-[var(--text-muted)] font-serif italic text-2xl">Select a node from the vault to begin...</p>
                </div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}