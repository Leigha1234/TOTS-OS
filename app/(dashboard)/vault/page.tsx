"use client";

import React, { useState, useRef, useMemo } from "react";
import { 
  Search, Download, Folder, ChevronDown, 
  Sparkles, ShieldCheck, Activity, 
  Trash2, Save, Box, Menu, X, 
  Edit3, Clock, Upload, File, Paperclip, 
  Settings, Share2, Globe
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
    metadata: { lastUpdated: "2026-05-01", status: "Verified" },
    files: []
  },
  { 
    id: "PRJ-441", 
    title: "Sales Conversion Script", 
    category: "Sales & Marketing", 
    content: `SALES PIPELINE SYSTEM\n\n📞 Call Structure\n- Current situation:\n- Problems / bottlenecks:\n- Impact:\n- Desired outcome:\n- Gap:\n- Offer:`,
    metadata: { lastUpdated: "2026-04-15", status: "Draft" },
    files: []
  },
  {
    id: "PRJ-112", 
    title: "Operational Efficiency Audit", 
    category: "Operations", 
    content: `BUSINESS AUDIT TEMPLATE\n\n1. Operations\n- Task tracking status\n- Delay points identified\n\n2. Finance Check\n- Revenue targets vs actuals\n- Profit margin clarity`,
    metadata: { lastUpdated: "2026-05-05", status: "Verified" },
    files: []
  }
];

export default function VaultPage() {
  const [vaultData, setVaultData] = useState<Project[]>(INITIAL_VAULT_DATA);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_VAULT_DATA[0].id);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<string[]>(["Clients & CRM"]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Derive current project
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

    setVaultData((prevVault) => {
      return prevVault.map((project) => {
        if (project.id === selectedId) {
          return {
            ...project,
            files: [...project.files, ...newFileEntries]
          };
        }
        return project;
      });
    });

    toast.success(`Attached ${newFileEntries.length} resource(s)`);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (fileName: string) => {
    setVaultData(prev => prev.map(p => 
      p.id === selectedId 
        ? { ...p, files: p.files.filter((f: ProjectFile) => f.name !== fileName) } 
        : p
    ));
  };

  const saveProject = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setVaultData(prev => prev.map(p => 
      p.id === selectedId ? { ...p, metadata: { ...p.metadata, lastUpdated: new Date().toISOString().split('T')[0] } } : p
    ));
    setIsSaving(false);
    toast.success("Vault Synchronized");
  };

  const exportPDF = async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current);
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297);
    pdf.save(`TOTs_${currentProject.id}.pdf`);
  };

  return (
    <div className="h-screen bg-[#FDFDFB] text-[#1C1917] flex flex-col overflow-hidden font-sans text-[11px]">
      
      {/* HEADER */}
      <nav className="h-12 border-b border-stone-200 bg-white flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-1"><Menu size={18}/></button>
          <div className="flex items-center gap-2">
            <Box size={16} className="text-stone-900" />
            <span className="font-black uppercase tracking-widest text-[9px]">TOTs OS</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 bg-stone-50 px-2 py-0.5 rounded-full border border-stone-100 mr-2">
            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] font-mono text-stone-400 uppercase">Secure</span>
          </div>
          <button onClick={() => setIsInspectorOpen(!isInspectorOpen)} className="p-1 text-stone-400 lg:hidden"><Activity size={18}/></button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* NAV SIDEBAR */}
        <aside className={`
          fixed inset-y-0 left-0 z-[110] w-64 bg-white border-r border-stone-200 transform transition-transform duration-300 lg:relative lg:translate-x-0
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        `}>
          <div className="p-4 border-b border-stone-200 flex justify-between items-center lg:hidden">
            <span className="font-black uppercase text-[9px] tracking-widest">Navigator</span>
            <button onClick={() => setIsMobileMenuOpen(false)}><X size={18}/></button>
          </div>
          <div className="p-3">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-300" />
              <input 
                className="w-full bg-stone-50 border border-stone-200 rounded-md py-1.5 pl-8 pr-3 text-[10px] outline-none focus:ring-1 ring-stone-200"
                placeholder="Find project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {categories.map((cat) => (
              <div key={cat} className="mb-1">
                <button 
                  onClick={() => setExpandedFolders(prev => prev.includes(cat) ? prev.filter(f => f !== cat) : [...prev, cat])}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-[9px] font-bold text-stone-400 uppercase tracking-wider"
                >
                  <div className="flex items-center gap-2">
                    <Folder size={10} className={expandedFolders.includes(cat) ? "text-stone-900" : "text-stone-200"} />
                    {cat}
                  </div>
                  <ChevronDown size={10} className={`transition-transform ${expandedFolders.includes(cat) ? "" : "-rotate-90"}`} />
                </button>
                <AnimatePresence>
                  {expandedFolders.includes(cat) && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden ml-1 border-l border-stone-100">
                      {filteredProjects.filter(p => p.category === cat).map(p => (
                        <button 
                          key={p.id}
                          onClick={() => { setSelectedId(p.id); setIsMobileMenuOpen(false); }}
                          className={`w-full text-left px-3 py-1.5 text-[10px] rounded-r-md ${selectedId === p.id ? "text-stone-900 font-bold bg-stone-50 border-l-2 border-stone-900" : "text-stone-500 hover:text-stone-800"}`}
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
        </aside>

        {/* WORKSPACE */}
        <main className="flex-1 flex flex-col min-w-0 bg-white">
          <header className="h-12 border-b border-stone-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
            <h2 className="text-[11px] font-serif italic text-stone-900 font-bold truncate">
              {currentProject.title}
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={exportPDF} className="p-1.5 border border-stone-200 rounded hover:bg-stone-50"><Download size={14} /></button>
              <button 
                onClick={saveProject} 
                disabled={isSaving}
                className="px-3 py-1.5 bg-stone-900 text-white rounded text-[10px] font-bold flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Clock size={12} className="animate-spin" /> : <Save size={12} />}
                <span className="hidden sm:inline uppercase tracking-tighter">{isSaving ? "Syncing" : "Save"}</span>
              </button>
            </div>
          </header>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-2 bg-stone-50/50 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 size={12} className="text-stone-300" />
                <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest">Workspace</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => fileInputRef.current?.click()} className="text-stone-400 hover:text-stone-900 flex items-center gap-1.5 transition-colors">
                  <Upload size={12} /> <span className="text-[9px] font-bold uppercase tracking-tighter">Attach</span>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />
              </div>
            </div>

            {/* EDITOR */}
            <div className="flex-1 p-6 lg:p-12 overflow-y-auto custom-scrollbar" ref={printRef}>
              <textarea 
                className="w-full h-full text-[12px] font-mono leading-relaxed text-stone-700 outline-none resize-none bg-transparent"
                value={currentProject.content}
                onChange={(e) => handleContentChange(e.target.value)}
                spellCheck={false}
              />
            </div>

            {/* ATTACHMENT TRAY */}
            {currentProject.files.length > 0 && (
              <div className="border-t border-stone-100 p-3 bg-stone-50/30">
                <div className="flex flex-wrap gap-2 px-1">
                  {currentProject.files.map((file, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white border border-stone-200 px-2 py-1 rounded text-[9px] group transition-all hover:border-stone-400">
                      <File size={10} className="text-stone-400" />
                      <span className="font-medium truncate max-w-[120px]">{file.name}</span>
                      <button onClick={() => removeFile(file.name)} className="text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={10}/></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* INSPECTOR SIDEBAR */}
        <aside className={`
          fixed inset-y-0 right-0 z-[110] w-64 bg-stone-50 border-l border-stone-200 transform transition-transform duration-300 lg:relative lg:translate-x-0
          ${isInspectorOpen ? "translate-x-0" : "translate-x-full"}
        `}>
          <div className="h-12 border-b border-stone-200 flex items-center justify-between px-4 bg-white lg:hidden">
            <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Metadata</span>
            <button onClick={() => setIsInspectorOpen(false)}><X size={18}/></button>
          </div>

          <div className="p-6 space-y-8">
            <section className="space-y-4">
              <h4 className="text-[9px] font-black uppercase text-stone-300 tracking-[0.2em] border-b border-stone-200 pb-2">Properties</h4>
              <div className="space-y-4">
                <div>
                  <p className="text-[8px] text-stone-400 uppercase mb-1">Project ID</p>
                  <p className="text-[10px] font-mono font-bold text-stone-800">{currentProject.id}</p>
                </div>
                <div>
                  <p className="text-[8px] text-stone-400 uppercase mb-1">Status</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">{currentProject.metadata.status}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[8px] text-stone-400 uppercase mb-1">Last Sync</p>
                  <p className="text-[10px] font-bold text-stone-800">{currentProject.metadata.lastUpdated}</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h4 className="text-[9px] font-black uppercase text-stone-300 tracking-[0.2em] border-b border-stone-200 pb-2">Asset Drop</h4>
              <div 
                className="border-2 border-dashed border-stone-200 rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:border-stone-900 bg-white/50 cursor-pointer group transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip size={18} className="text-stone-300 group-hover:text-stone-900" />
                <p className="text-[8px] font-bold text-stone-400 text-center uppercase tracking-tighter leading-relaxed">
                  Drop project assets here or browse
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h4 className="text-[9px] font-black uppercase text-stone-300 tracking-[0.2em] border-b border-stone-200 pb-2">Tools</h4>
              <div className="grid grid-cols-2 gap-2">
                <button className="p-3 bg-white border border-stone-100 rounded-xl hover:shadow-sm flex flex-col items-center gap-2 group transition-all">
                  <Sparkles size={14} className="text-stone-300 group-hover:text-amber-500" />
                  <span className="text-[8px] font-bold uppercase tracking-tighter">AI Ops</span>
                </button>
                <button className="p-3 bg-white border border-stone-100 rounded-xl hover:shadow-sm flex flex-col items-center gap-2 group transition-all">
                  <ShieldCheck size={14} className="text-stone-300 group-hover:text-blue-500" />
                  <span className="text-[8px] font-bold uppercase tracking-tighter">Audit</span>
                </button>
                <button className="p-3 bg-white border border-stone-100 rounded-xl hover:shadow-sm flex flex-col items-center gap-2 group transition-all">
                  <Globe size={14} className="text-stone-300 group-hover:text-emerald-500" />
                  <span className="text-[8px] font-bold uppercase tracking-tighter">Host</span>
                </button>
                <button className="p-3 bg-white border border-stone-100 rounded-xl hover:shadow-sm flex flex-col items-center gap-2 group transition-all">
                  <Share2 size={14} className="text-stone-300 group-hover:text-stone-900" />
                  <span className="text-[8px] font-bold uppercase tracking-tighter">Share</span>
                </button>
              </div>
            </section>
          </div>
        </aside>

        {/* OVERLAYS */}
        {(isMobileMenuOpen || isInspectorOpen) && (
          <div 
            className="fixed inset-0 bg-stone-900/10 backdrop-blur-[2px] z-[105] lg:hidden" 
            onClick={() => { setIsMobileMenuOpen(false); setIsInspectorOpen(false); }} 
          />
        )}
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E7E5E4; border-radius: 10px; }
        textarea::selection { background: #1C1917; color: #FDFDFB; }
      `}</style>
    </div>
  );
}