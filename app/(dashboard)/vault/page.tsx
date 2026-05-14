"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CloudUpload, File, FileText, Image as ImageIcon, 
  MoreVertical, Search, Trash2, Download, 
  Database, Filter, HardDrive, ShieldCheck, 
  Clock, Zap, LayoutGrid, List, Plus
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * TOTS OS: VAULT STORAGE v7.1.0
 * REVISION: FILE UPLOAD & RESOURCE MANAGEMENT 
 */

interface VaultFile {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  category: string;
  status: "Secure" | "Pending" | "Public";
}

const INITIAL_FILES: VaultFile[] = [
  { id: "FL-001", name: "Brand_Ethos_v2.pdf", type: "pdf", size: "2.4 MB", uploadedAt: "2026-05-12", category: "Guidelines", status: "Secure" },
  { id: "FL-002", name: "Asset_Pack_Alpha.zip", type: "zip", size: "45.8 MB", uploadedAt: "2026-05-10", category: "Assets", status: "Secure" },
  { id: "FL-003", name: "Client_Feedback_MAY.docx", type: "doc", size: "1.1 MB", uploadedAt: "2026-05-14", category: "Reports", status: "Pending" },
];

export default function VaultUploadPage() {
  const [files, setFiles] = useState<VaultFile[]>(INITIAL_FILES);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    setIsDragging(false);
    toast.success("Neural Sync Initiated: Uploading File...");
    // Logic for Supabase storage or API would go here
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans selection:bg-[#a9b897] selection:text-white">
      
      <div className="max-w-[1400px] mx-auto px-8 py-10 space-y-10">
        
        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-100 pb-10 text-left">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-stone-900 text-[#a9b897] rounded-xl shadow-lg"><Database size={20} /></div>
              <div className="space-y-0.5">
                <p className="font-black uppercase text-[8px] tracking-[0.4em] text-stone-300">Vault_Archive_7.1</p>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-[#a9b897] rounded-full animate-pulse" />
                  <p className="text-[7px] font-mono tracking-widest text-[#a9b897] uppercase">Encryption Active</p>
                </div>
              </div>
            </div>
            <h1 className="text-6xl font-serif italic tracking-tighter leading-none">Vault Storage</h1>
          </div>

          <div className="flex items-center gap-3">
             <div className="bg-white border border-stone-100 p-1 rounded-full flex gap-1 shadow-sm">
                <button onClick={() => setViewMode("grid")} className={`p-2 rounded-full transition-all ${viewMode === "grid" ? "bg-stone-900 text-[#a9b897]" : "text-stone-300 hover:text-stone-500"}`}><LayoutGrid size={14}/></button>
                <button onClick={() => setViewMode("list")} className={`p-2 rounded-full transition-all ${viewMode === "list" ? "bg-stone-900 text-[#a9b897]" : "text-stone-300 hover:text-stone-500"}`}><List size={14}/></button>
             </div>
             <button onClick={() => fileInputRef.current?.click()} className="bg-stone-900 text-white px-8 py-3 rounded-full flex items-center gap-3 hover:bg-[#a9b897] hover:text-stone-900 transition-all shadow-xl active:scale-95">
                <Plus size={16} />
                <span className="text-[9px] font-black uppercase tracking-widest">New Upload</span>
             </button>
             <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" multiple />
          </div>
        </header>

        {/* --- STATS & SEARCH --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-[#a9b897] transition-colors" />
              <input 
                placeholder="Search archive logic..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-stone-100 rounded-2xl py-4 pl-14 pr-4 text-[10px] font-bold outline-none focus:border-[#a9b897] transition-all shadow-sm"
              />
            </div>
            <button className="px-6 bg-white border border-stone-100 rounded-2xl flex items-center justify-center gap-3 text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-all">
              <Filter size={14} /> Filter
            </button>
          </div>
          <div className="lg:col-span-4 bg-stone-900 rounded-2xl p-4 flex items-center justify-between text-white shadow-xl">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-[#a9b897]"><HardDrive size={18}/></div>
                <div className="text-left">
                   <p className="text-[7px] font-black uppercase tracking-[0.3em] text-stone-400">Archive Load</p>
                   <p className="text-xs font-mono font-bold tracking-tighter text-[#a9b897]">1.2 GB / 10 GB</p>
                </div>
             </div>
             <div className="text-right">
                <p className="text-[7px] font-black uppercase tracking-[0.3em] text-stone-400">Integrity</p>
                <p className="text-xs font-mono font-bold tracking-tighter text-[#a9b897]">99.9%</p>
             </div>
          </div>
        </div>

        {/* --- UPLOAD ZONE --- */}
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleUpload}
          className={`relative border-2 border-dashed rounded-[3rem] p-16 transition-all duration-500 group flex flex-col items-center justify-center gap-6 ${
            isDragging ? "bg-[#a9b897]/5 border-[#a9b897] scale-[0.99]" : "bg-white border-stone-100 hover:border-[#a9b897]/30"
          }`}
        >
          <div className={`p-6 rounded-full transition-all duration-500 ${isDragging ? "bg-stone-900 text-[#a9b897] scale-110" : "bg-stone-50 text-stone-200"}`}>
            <CloudUpload size={40} className={isDragging ? "animate-bounce" : ""} />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-serif italic text-stone-800 tracking-tighter">Neural Dropzone</h3>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-300 italic">Drag resources to establish nodes</p>
          </div>
        </div>

        {/* --- FILE GRID/LIST --- */}
        <section>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <AnimatePresence>
                {filteredFiles.map((file) => (
                  <motion.div 
                    layout key={file.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-stone-100 p-6 rounded-[2rem] hover:border-stone-900 transition-all group shadow-sm text-left relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-8 relative z-10">
                      <div className="w-12 h-12 bg-stone-50 rounded-xl flex items-center justify-center text-stone-300 group-hover:bg-stone-900 group-hover:text-[#a9b897] transition-all">
                        {file.type === 'pdf' ? <FileText size={20}/> : <File size={20}/>}
                      </div>
                      <button className="p-1.5 text-stone-200 hover:text-stone-900"><MoreVertical size={16}/></button>
                    </div>
                    <div className="space-y-1 relative z-10">
                      <p className="text-[8px] font-black uppercase tracking-[0.3em] text-[#a9b897] italic">{file.category}</p>
                      <h4 className="text-lg font-serif italic text-stone-800 tracking-tighter truncate leading-tight group-hover:text-stone-900">{file.name}</h4>
                      <p className="text-[8px] font-mono font-bold text-stone-300 uppercase tracking-widest">{file.size} • {file.uploadedAt}</p>
                    </div>
                    <div className="mt-6 flex items-center justify-between pt-4 border-t border-stone-50 relative z-10">
                       <div className="flex items-center gap-2">
                          <ShieldCheck size={10} className="text-[#a9b897]" />
                          <span className="text-[7px] font-black text-stone-300 uppercase tracking-widest">{file.status}</span>
                       </div>
                       <button className="text-stone-200 hover:text-stone-900 transition-colors"><Download size={14}/></button>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-[0.02] text-stone-900 pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                      <File size={80} />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-3">
               {filteredFiles.map((file) => (
                  <div key={file.id} className="bg-white border border-stone-100 p-4 px-8 rounded-2xl flex items-center justify-between group hover:border-stone-900 transition-all text-left">
                     <div className="flex items-center gap-6 flex-1">
                        <FileText size={16} className="text-stone-200 group-hover:text-[#a9b897]" />
                        <span className="text-[10px] font-bold text-stone-800 min-w-[200px]">{file.name}</span>
                        <span className="text-[8px] font-black text-stone-300 uppercase tracking-widest">{file.category}</span>
                     </div>
                     <div className="flex items-center gap-10">
                        <span className="text-[8px] font-mono font-bold text-stone-300 uppercase">{file.size}</span>
                        <span className="text-[8px] font-mono font-bold text-stone-300 uppercase">{file.uploadedAt}</span>
                        <div className="flex items-center gap-3">
                           <button className="p-2 text-stone-200 hover:text-stone-900"><Download size={14}/></button>
                           <button className="p-2 text-stone-200 hover:text-red-500"><Trash2 size={14}/></button>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
          )}
        </section>

        {/* --- FOOTER ACTIONS --- */}
        <div className="flex justify-center gap-6 pt-10">
            <button onClick={() => toast.info("Manifest Sync Initiated")} className="flex items-center gap-4 px-8 py-3 bg-white border border-stone-200 rounded-full text-[9px] font-black uppercase tracking-widest hover:border-stone-900 transition-all shadow-sm">
                <Clock size={14} className="text-[#a9b897]" />
                <span>Recent Manifest</span> 
            </button>
            <button className="flex items-center gap-4 px-8 py-3 bg-stone-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg">
                <Zap size={14} className="text-[#a9b897]" /> 
                <span>Optimize Storage</span>
            </button>
        </div>

        <footer className="pt-12 border-t border-stone-100 flex justify-between items-center text-stone-300 text-[8px] font-black uppercase tracking-[0.4em]">
          <p>TOTS OS v7.1.0 • ARCHIVE_NODE</p>
          <div className="flex gap-8">
            <button className="hover:text-stone-900">Protocols</button>
            <button className="hover:text-stone-900">Root_Audit</button>
          </div>
        </footer>
      </div>

    </div>
  );
}