"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { 
  Search, Download, Folder, ChevronDown, 
  Sparkles, ShieldCheck, Activity, 
  Terminal, HardDrive, Fingerprint, 
  ArrowLeft, FileCode, Radio, Database, 
  Lock, Zap, Cpu, Globe, Trash2, 
  Maximize2, Save, History, Box, 
  ExternalLink, Layers, MoreVertical
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";

// --- DATASET ---
const VAULT_DATA = [
  { 
    id: "CL-001", 
    title: "Client Intake Protocol", 
    category: "Clients & CRM", 
    content: `CLIENT ONBOARDING SYSTEM\n\n📄 Intake Form\nName: [Client Name]\nBusiness: [Business Name]\nService purchased: [Service Name]\nStart date: [YYYY-MM-DD]\n\n⚙️ Workflow\n[ ] New client created\n[ ] Send welcome email\n[ ] Send contract + invoice\n[ ] Create project board\n[ ] Book kickoff call`,
    metadata: { lastUpdated: "2026-05-01", version: "2.1.0", author: "Admin", status: "Verified" }
  },
  { 
    id: "SL-441", 
    title: "Sales Conversion Script", 
    category: "Sales & Marketing", 
    content: `SALES PIPELINE SYSTEM\n\n📞 Call Structure\n- Current situation:\n- Problems / bottlenecks:\n- Impact:\n- Desired outcome:\n- Gap:\n- Offer:`,
    metadata: { lastUpdated: "2026-04-15", version: "1.4.2", author: "Sales Node", status: "Draft" }
  },
  {
    id: "OP-112",
    title: "Operational Efficiency Audit",
    category: "Operations",
    content: `BUSINESS AUDIT TEMPLATE\n\n1. Operations\n- Task tracking status\n- Delay points identified\n\n2. Finance Check\n- Revenue targets vs actuals\n- Profit margin clarity`,
    metadata: { lastUpdated: "2026-05-05", version: "3.0.0", author: "Ops Lead", status: "Verified" }
  },
  {
    id: "LG-990",
    title: "Master Service Agreement",
    category: "Legal & Governance",
    content: `MSA FRAMEWORK\n\nAgreement between [Business] and [Client].\n\n2. Payment Terms\nInvoices are due within 7 days of issue.`,
    metadata: { lastUpdated: "2026-05-12", version: "4.1.0", author: "Legal Node", status: "Locked" }
  },
  {
    id: "FN-130",
    title: "Quarterly P&L Forecaster",
    category: "Finance",
    content: `P&L FORECASTER\n\nMonthly Input:\n- Projected Revenue\n- Fixed Costs\n- Variable Costs\n\nFormula:\nMargin = (Revenue - Total Costs) / Revenue`,
    metadata: { lastUpdated: "2026-05-07", version: "1.2.0", author: "Finance Node", status: "Verified" }
  }
];

export default function VaultPage() {
  const [selectedDoc, setSelectedDoc] = useState<any>(VAULT_DATA[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<string[]>(["Clients & CRM"]);
  const [systemUptime, setSystemUptime] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setSystemUptime(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredDocs = useMemo(() => {
    return VAULT_DATA.filter(doc => 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      doc.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const categories = useMemo(() => Array.from(new Set(VAULT_DATA.map(d => d.category))), []);

  const exportPDF = async () => {
    if (!printRef.current || !selectedDoc) return;
    const canvas = await html2canvas(printRef.current);
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297);
    pdf.save(`VAULT_${selectedDoc.id}.pdf`);
    toast.success("Document Exported");
  };

  return (
    <div className="h-screen bg-[#FDFDFB] text-[#1C1917] flex flex-col overflow-hidden">
      
      {/* TOP NAVIGATION BAR */}
      <nav className="h-14 border-b border-stone-200 bg-white flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Box size={18} className="text-stone-900" />
            <span className="text-[11px] font-black uppercase tracking-widest">TOTs Vault</span>
          </div>
          <div className="h-4 w-[1px] bg-stone-200" />
          <div className="flex items-center gap-4 text-stone-400 text-[10px] font-medium">
            <span className="hover:text-stone-900 cursor-pointer transition-colors">Infrastructure</span>
            <span className="text-stone-200">/</span>
            <span className="hover:text-stone-900 cursor-pointer transition-colors">Nodes</span>
            <span className="text-stone-200">/</span>
            <span className="text-stone-900">{selectedDoc?.id || "N/A"}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-4 bg-stone-50 px-3 py-1 rounded-full border border-stone-100">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-mono text-stone-400 uppercase tracking-tighter">System Live: {Math.floor(systemUptime / 60)}m</span>
          </div>
          <button onClick={() => toast.info("System handshaking...")} className="p-2 hover:bg-stone-50 rounded-lg transition-colors text-stone-400 hover:text-stone-900"><History size={16}/></button>
          <button className="p-2 hover:bg-stone-50 rounded-lg transition-colors text-stone-400 hover:text-stone-900"><Settings size={16}/></button>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* SIDEBAR - FILE BROWSER */}
        <aside className="w-72 border-r border-stone-200 flex flex-col bg-stone-50/30 shrink-0">
          <div className="p-4 border-b border-stone-200 bg-white/50">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" />
              <input 
                className="w-full bg-white border border-stone-200 rounded-lg py-2 pl-9 pr-3 text-[11px] outline-none focus:ring-2 ring-stone-900/5 transition-all"
                placeholder="Find node..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
            {categories.map((cat) => (
              <div key={cat} className="mb-2">
                <button 
                  onClick={() => setExpandedFolders(prev => prev.includes(cat) ? prev.filter(f => f !== cat) : [...prev, cat])}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-wider hover:text-stone-900 group"
                >
                  <div className="flex items-center gap-2">
                    <Folder size={12} className={expandedFolders.includes(cat) ? "text-stone-900" : "text-stone-200"} />
                    {cat}
                  </div>
                  <ChevronDown size={12} className={`transition-transform duration-300 ${expandedFolders.includes(cat) ? "rotate-0" : "-rotate-90"}`} />
                </button>
                
                <AnimatePresence initial={false}>
                  {expandedFolders.includes(cat) && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-1 ml-1 border-l border-stone-100">
                      {filteredDocs.filter(d => d.category === cat).map(doc => (
                        <button 
                          key={doc.id}
                          onClick={() => setSelectedDoc(doc)}
                          className={`w-full text-left px-4 py-2 rounded-md text-[11px] transition-all flex items-center gap-3 ${
                            selectedDoc?.id === doc.id 
                            ? "bg-white text-stone-900 shadow-sm border border-stone-100 font-semibold" 
                            : "text-stone-500 hover:bg-stone-100/50 hover:text-stone-800"
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${selectedDoc?.id === doc.id ? "bg-stone-900" : "bg-stone-200"}`} />
                          <span className="truncate">{doc.title}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-stone-200 bg-white">
            <div className="bg-stone-900 rounded-xl p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Health</span>
                <Activity size={12} className="text-emerald-400" />
              </div>
              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 w-3/4" />
              </div>
              <p className="text-[9px] text-white/60 font-mono tracking-tighter italic">Infra integrity: 98%</p>
            </div>
          </div>
        </aside>

        {/* EDITOR AREA */}
        <main className="flex-1 flex flex-col min-w-0 bg-white">
          <header className="h-14 border-b border-stone-200 flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-serif italic text-stone-900 font-semibold">
                {selectedDoc?.title || "No Selection"}
              </h2>
              <span className="px-2 py-0.5 bg-stone-100 rounded text-[9px] font-bold text-stone-400 uppercase tracking-widest">
                v.{selectedDoc?.metadata.version}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={exportPDF} className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold border border-stone-200 rounded-md hover:bg-stone-50 transition-all">
                <Download size={14} /> PDF
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold bg-stone-900 text-white rounded-md hover:bg-stone-800 transition-all shadow-md">
                <Save size={14} /> Commit Changes
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-hidden flex flex-col">
            {/* AI ASSIST BAR */}
            <div className="px-8 py-3 bg-stone-50 border-b border-stone-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-amber-500" />
                <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Neural Assistant</span>
              </div>
              <div className="flex gap-2">
                <button className="px-2 py-1 text-[9px] font-bold bg-white border border-stone-200 rounded hover:border-stone-900 transition-all">Summarize</button>
                <button className="px-2 py-1 text-[9px] font-bold bg-white border border-stone-200 rounded hover:border-stone-900 transition-all">Check Compliance</button>
              </div>
            </div>

            {/* MAIN TEXT AREA */}
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar" ref={printRef}>
              <textarea 
                className="w-full h-full text-xs font-mono leading-relaxed text-stone-700 outline-none resize-none bg-transparent"
                defaultValue={selectedDoc?.content}
                placeholder="Drafting workspace..."
                spellCheck={false}
              />
            </div>
          </div>
        </main>

        {/* METADATA INSPECTOR (RIGHT SIDEBAR) */}
        <aside className="w-64 border-l border-stone-200 flex flex-col shrink-0 bg-stone-50/10">
          <div className="p-6 space-y-8">
            <section className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-stone-300 tracking-[0.2em]">Properties</h4>
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-[9px] text-stone-400">Node Identity</p>
                  <p className="text-[10px] font-mono font-bold text-stone-800">{selectedDoc?.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] text-stone-400">Last Modified</p>
                  <p className="text-[10px] font-bold text-stone-800">{selectedDoc?.metadata.lastUpdated}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] text-stone-400">Authored By</p>
                  <p className="text-[10px] font-bold text-stone-800 italic">{selectedDoc?.metadata.author}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] text-stone-400">Security Status</p>
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={12} className="text-emerald-500" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase">{selectedDoc?.metadata.status}</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-stone-300 tracking-[0.2em]">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                <button className="p-3 bg-white border border-stone-100 rounded-xl hover:shadow-sm transition-all flex flex-col items-center gap-2 group">
                  <Share2 size={14} className="text-stone-300 group-hover:text-stone-900" />
                  <span className="text-[8px] font-bold">Share</span>
                </button>
                <button className="p-3 bg-white border border-stone-100 rounded-xl hover:shadow-sm transition-all flex flex-col items-center gap-2 group">
                  <Layers size={14} className="text-stone-300 group-hover:text-stone-900" />
                  <span className="text-[8px] font-bold">Relate</span>
                </button>
                <button className="p-3 bg-white border border-stone-100 rounded-xl hover:shadow-sm transition-all flex flex-col items-center gap-2 group">
                  <Globe size={14} className="text-stone-300 group-hover:text-stone-900" />
                  <span className="text-[8px] font-bold">Publish</span>
                </button>
                <button className="p-3 bg-white border border-stone-100 rounded-xl hover:shadow-sm transition-all flex flex-col items-center gap-2 group">
                  <MoreVertical size={14} className="text-stone-300 group-hover:text-stone-900" />
                  <span className="text-[8px] font-bold">More</span>
                </button>
              </div>
            </section>
          </div>

          {/* SYSTEM LOG FOOTER */}
          <div className="mt-auto border-t border-stone-100 bg-[#0F0F0F] p-4 text-white">
            <div className="flex items-center gap-2 mb-3 opacity-40">
              <Terminal size={12} />
              <span className="text-[8px] font-black uppercase tracking-widest">Logs</span>
            </div>
            <div className="font-mono text-[8px] space-y-1.5 h-20 overflow-y-auto opacity-70">
              <p><span className="text-emerald-500">[{selectedDoc?.id}]</span> Session opened</p>
              <p><span className="text-emerald-500">[AUTH]</span> Node verified</p>
              <p><span className="text-stone-500">[SYNC]</span> Cloud handshake OK</p>
            </div>
          </div>
        </aside>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E7E5E4; border-radius: 10px; }
        textarea::selection { background: #1C1917; color: #FDFDFB; }
      `}</style>
    </div>
  );
}

// Sub-components for cleaner structure
function Settings(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function Share2(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-share2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
}