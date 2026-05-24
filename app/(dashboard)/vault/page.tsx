"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CloudUpload, File, FileText, MoreVertical, Search, 
  Trash2, Download, Database, Filter, HardDrive, 
  ShieldCheck, Clock, LayoutGrid, List, Plus, X, 
  Eye, Edit3, Check, Calendar, HardDriveDownload
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * TOTS OS: VAULT STORAGE v8.0.0
 * REVISION: CLEANED DESK FOOTER, EXPANDED PREVIEW MODALS, IN-PLACE EDITING & PDF DOWNLOAD ROUTINES
 */

interface VaultFile {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  category: string;
  status: "Secure" | "Pending" | "Public";
  metadata?: string;
}

const INITIAL_FILES: VaultFile[] = [
  { id: "FL-001", name: "Brand_Ethos_v2.pdf", type: "pdf", size: "2.4 MB", uploadedAt: "2026-05-12", category: "Guidelines", status: "Secure", metadata: "System corporate alignment documentation covering brand assets and application rules." },
  { id: "FL-002", name: "Asset_Pack_Alpha.zip", type: "zip", size: "45.8 MB", uploadedAt: "2026-05-10", category: "Assets", status: "Secure", metadata: "Compressed build structures containing UI wireframes, hex maps, and style guides." },
  { id: "FL-003", name: "Client_Feedback_MAY.docx", type: "doc", size: "1.1 MB", uploadedAt: "2026-05-14", category: "Reports", status: "Pending", metadata: "External client processing matrices detailing feature feedback on active platform nodes." },
];

export default function VaultUploadPage() {
  const [files, setFiles] = useState<VaultFile[]>(INITIAL_FILES);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeModal, setActiveModal] = useState<"manifest" | null>(null);
  
  // Extended UI Interaction States
  const [previewFile, setPreviewFile] = useState<VaultFile | null>(null);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close drop down context on stray document clicks
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    toast.success("File(s) uploaded successfully!");
  };

  // PDF Download Engine Simulation
  const downloadAsPDF = (file: VaultFile) => {
    toast.info(`Converting ${file.name} to Document Blueprint...`);
    
    setTimeout(() => {
      const boundaryMarker = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 48 >>\nstream\nBT /F1 24 Tf 50 700 Td (${file.name} Archive Node Document Extract) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000056 00000 n \n0000000111 00000 n \n0000000203 00000 n \ntrailer\n<< /Size 5 >>\nstartxref\n302\n%%EOF";
      const fileBlob = new Blob([boundaryMarker], { type: "application/pdf" });
      const virtualUrl = URL.createObjectURL(fileBlob);
      const nativeAnchor = document.createElement("a");
      nativeAnchor.href = virtualUrl;
      nativeAnchor.download = `${file.name.split('.')[0]}_export.pdf`;
      document.body.appendChild(nativeAnchor);
      nativeAnchor.click();
      document.body.removeChild(nativeAnchor);
      URL.revokeObjectURL(virtualUrl);
      toast.success("PDF Blueprint Dispatched Securely.");
    }, 1200);
  };

  const startEditing = (file: VaultFile) => {
    setEditingFileId(file.id);
    setEditName(file.name);
    setEditCategory(file.category);
    setActiveMenuId(null);
  };

  const saveFileModifications = (id: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, name: editName, category: editCategory } : f));
    setEditingFileId(null);
    toast.success("File metadata updated successfully.");
  };

  const triggerPreviewFlow = (file: VaultFile) => {
    setPreviewFile(file);
    setActiveModal(null);
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans selection:bg-[#a9b897] selection:text-white pb-32">
      
      <div className="max-w-[1400px] mx-auto px-8 py-10 space-y-10">
        
        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-100 pb-10 text-left">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-stone-900 text-[#a9b897] rounded-xl shadow-lg cursor-pointer hover:rotate-12 transition-transform">
                <Database size={20} />
              </div>
              
            </div>
            <h1 className="text-6xl font-serif italic tracking-tighter leading-none">Vault</h1>
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
          <div className="lg:col-span-8 flex flex-col md:flex-row gap-4 text-left">
            <div className="relative flex-1 group">
              <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-[#a9b897] transition-colors" />
              <input placeholder="Search archive logic..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-stone-100 rounded-2xl py-4 pl-14 pr-4 text-[10px] font-bold outline-none focus:border-[#a9b897] transition-all shadow-sm" />
            </div>
            <button className="px-6 bg-white border border-stone-100 rounded-2xl flex items-center justify-center gap-3 text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-all">
              <Filter size={14} /> Filter
            </button>
          </div>
        
        </div>

        {/* --- UPLOAD ZONE --- */}
        <div onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleUpload}
          className={`relative border-2 border-dashed rounded-[3rem] p-16 transition-all duration-500 group flex flex-col items-center justify-center gap-6 ${isDragging ? "bg-[#a9b897]/5 border-[#a9b897] scale-[0.99]" : "bg-white border-stone-100 hover:border-[#a9b897]/30"}`}>
          <div className={`p-6 rounded-full transition-all duration-500 ${isDragging ? "bg-stone-900 text-[#a9b897] scale-110" : "bg-stone-50 text-stone-200"}`}>
            <CloudUpload size={40} className={isDragging ? "animate-bounce" : ""} />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-serif italic text-stone-800 tracking-tighter">Dropzone</h3>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-300 italic">Drag and drop files here</p>
          </div>
        </div>

        {/* --- FILE GRID / LIST VIEW PANELS --- */}
        <section>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredFiles.map((file) => (
                  <motion.div layout key={file.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-stone-100 p-6 rounded-[2rem] hover:border-stone-900 transition-all group shadow-sm text-left relative overflow-hidden flex flex-col justify-between min-h-[260px]">
                    
                    <div>
                      <div className="flex justify-between items-start mb-6 relative z-20">
                        {/* IN-PLACE INLINE PREVIEW ACTION CLICK ON THE BRANDING CARDS */}
                        <button 
                          onClick={() => triggerPreviewFlow(file)}
                          className="w-12 h-12 bg-stone-50 rounded-xl flex items-center justify-center text-stone-300 group-hover:bg-stone-900 group-hover:text-[#a9b897] transition-all cursor-pointer shadow-inner"
                        >
                          {file.type === 'pdf' ? <FileText size={20}/> : <File size={20}/>}
                        </button>
                        
                        {/* THREE DOTS SYSTEM OPTIONS ACTIONS OVERLAY */}
                        <div className="relative">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === file.id ? null : file.id); }} 
                            className="p-1.5 text-stone-300 hover:text-stone-900 transition-colors"
                          >
                            <MoreVertical size={16}/>
                          </button>
                          
                          {activeMenuId === file.id && (
                            <div ref={menuRef} className="absolute right-0 top-8 bg-white border border-stone-200 rounded-xl shadow-xl py-2 w-36 z-50 animate-in fade-in slide-in-from-top-2 duration-100">
                              <button onClick={() => startEditing(file)} className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-wider text-stone-600 hover:bg-stone-50 hover:text-stone-900 flex items-center gap-2">
                                <Edit3 size={12}/> Edit Metadata
                              </button>
                              <button onClick={() => triggerPreviewFlow(file)} className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-wider text-stone-600 hover:bg-stone-50 hover:text-stone-900 flex items-center gap-2">
                                <Eye size={12}/> Open Preview
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {editingFileId === file.id ? (
                        <div className="space-y-2 relative z-30 bg-stone-50 p-3 rounded-xl border border-stone-200">
                          <input className="w-full bg-white text-xs p-2 rounded border border-stone-200 font-mono" value={editName} onChange={(e) => setEditName(e.target.value)} />
                          <input className="w-full bg-white text-[9px] font-black uppercase tracking-wider p-2 rounded border border-stone-200" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} />
                          <button onClick={() => saveFileModifications(file.id)} className="w-full bg-stone-900 text-[#a9b897] text-[8px] font-black uppercase tracking-widest py-1.5 rounded flex items-center justify-center gap-1.5"><Check size={10}/> Save</button>
                        </div>
                      ) : (
                        <div className="space-y-1 cursor-pointer relative z-10" onClick={() => triggerPreviewFlow(file)}>
                          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-[#a9b897] italic">{file.category}</p>
                          <h4 className="text-xl font-serif italic text-stone-800 tracking-tighter truncate leading-tight group-hover:text-stone-950">{file.name}</h4>
                          <p className="text-[8px] font-mono font-bold text-stone-300 uppercase tracking-widest">{file.size} • {file.uploadedAt}</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex items-center justify-between pt-4 border-t border-stone-50 relative z-10">
                       <div className="flex items-center gap-2">
                          <ShieldCheck size={10} className="text-[#a9b897]" />
                          <span className="text-[7px] font-black text-stone-300 uppercase tracking-widest">{file.status}</span>
                       </div>
                       <div className="flex items-center gap-2">
                         <button onClick={() => triggerPreviewFlow(file)} className="p-1.5 text-stone-200 hover:text-stone-800 transition-all rounded-md hover:bg-stone-50" title="Quick View"><Eye size={13}/></button>
                         <button onClick={() => downloadAsPDF(file)} className="p-1.5 text-stone-200 hover:text-[#a9b897] transition-all rounded-md hover:bg-stone-50" title="Download PDF Blueprint"><Download size={13}/></button>
                       </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-3">
               {filteredFiles.map((file) => (
                  <div key={file.id} className="bg-white border border-stone-100 p-4 px-8 rounded-2xl flex items-center justify-between group hover:border-stone-900 transition-all text-left">
                     <div className="flex items-center gap-6 flex-1 cursor-pointer" onClick={() => triggerPreviewFlow(file)}>
                        <FileText size={16} className="text-stone-200 group-hover:text-[#a9b897]" />
                        {editingFileId === file.id ? (
                          <div className="flex gap-2 items-center" onClick={e => e.stopPropagation()}>
                            <input className="bg-stone-50 text-[10px] font-bold text-stone-800 p-1 px-2 rounded border" value={editName} onChange={e => setEditName(e.target.value)} />
                            <button onClick={() => saveFileModifications(file.id)} className="p-1 bg-stone-900 text-white rounded"><Check size={10}/></button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-stone-800 min-w-[200px] hover:text-[#a9b897] transition-colors">{file.name}</span>
                        )}
                        <span className="text-[8px] font-black text-stone-300 uppercase tracking-widest">{file.category}</span>
                     </div>
                     <div className="flex items-center gap-10">
                        <span className="text-[8px] font-mono font-bold text-stone-300 uppercase">{file.size}</span>
                        <div className="flex items-center gap-2">
                           <button onClick={() => startEditing(file)} className="p-2 text-stone-200 hover:text-stone-900 transition-colors" title="Edit Meta"><Edit3 size={14}/></button>
                           <button onClick={() => triggerPreviewFlow(file)} className="p-2 text-stone-200 hover:text-stone-900 transition-colors" title="Preview"><Eye size={14}/></button>
                           <button onClick={() => downloadAsPDF(file)} className="p-2 text-stone-200 hover:text-[#a9b897] transition-colors" title="Download PDF"><Download size={14}/></button>
                           <button onClick={() => toast.error("Purge Denied: Admin Clearance Required")} className="p-2 text-stone-200 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
          )}
        </section>

        {/* --- DYNAMIC OVERLAY SYSTEMS AND LEDGERS --- */}
        <AnimatePresence>
          {/* THE MANIFEST RE-ENGINEERED TO LINK INTO DETAILED POPUP VIEWS */}
          {activeModal === 'manifest' && (
            <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveModal(null)} className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" />
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} 
                className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl relative z-10 border border-stone-100 overflow-hidden text-left">
                
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3 text-stone-900">
                    <Clock size={20} />
                    <h3 className="text-xl font-serif italic tracking-tighter uppercase">Recents</h3>
                  </div>
                  <button onClick={() => setActiveModal(null)} className="p-2 text-stone-300 hover:text-stone-900 transition-colors"><X size={20} /></button>
                </div>

                <div className="space-y-3 max-h-[320px] overflow-y-auto no-scrollbar pr-2">
                   {files.map(f => (
                     <div 
                       key={f.id} 
                       onClick={() => triggerPreviewFlow(f)}
                       className="p-4 bg-stone-50 hover:bg-stone-900/5 border border-transparent hover:border-stone-200 rounded-2xl flex justify-between items-center cursor-pointer transition-all group"
                     >
                        <div className="flex items-center gap-3">
                          <FileText size={14} className="text-stone-400 group-hover:text-[#a9b897]" />
                          <span className="text-[10px] font-bold text-stone-700 group-hover:text-stone-900">{f.name}</span>
                        </div>
                     </div>
                   ))}
                </div>
              </motion.div>
            </div>
          )}

          {/* GRANULAR COMPONENT FILE PREVIEW MODAL */}
          {previewFile && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreviewFile(null)} className="absolute inset-0 bg-stone-900/50 backdrop-blur-md" />
              <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
                className="bg-white rounded-[3.5rem] w-full max-w-xl p-10 shadow-2xl relative z-10 border border-stone-200 text-left space-y-6 overflow-hidden"
              >
                {/* ARCHIVE ACCENT DECORATION */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-[#a9b897]" />

                <div className="flex justify-between items-start pt-2">
                  <div className="space-y-1">
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-[#a9b897] bg-[#a9b897]/10 px-2.5 py-1 rounded-md">{previewFile.category}</span>
                    <h3 className="text-3xl font-serif italic tracking-tighter text-stone-900 pt-2">{previewFile.name}</h3>
                  </div>
                  <button onClick={() => setPreviewFile(null)} className="p-2 bg-stone-50 text-stone-400 hover:text-stone-900 rounded-full transition-colors"><X size={18}/></button>
                </div>

                <div className="bg-stone-50 rounded-2xl p-6 border border-stone-100 space-y-4">
                  <div className="grid grid-cols-2 gap-4 border-b border-stone-200/60 pb-4">
                    <div>
                      <p className="text-[10px] font-mono font-bold text-stone-700 mt-0.5">{previewFile.id}</p>
                    </div>
                    <div>
                      <p className="text-[7px] font-black uppercase tracking-wider text-stone-400 flex items-center gap-1"><Calendar size={10}/> Archival Timestamp</p>
                      <p className="text-[10px] font-mono font-bold text-stone-700 mt-0.5">{previewFile.uploadedAt}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => { setPreviewFile(null); startEditing(previewFile); }}
                    className="flex-1 py-3 bg-stone-100 text-stone-700 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-stone-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Edit3 size={12}/> Edit Structure
                  </button>
                  <button 
                    onClick={() => downloadAsPDF(previewFile)}
                    className="flex-1 py-3 bg-stone-900 text-white hover:bg-[#a9b897] hover:text-stone-900 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    <HardDriveDownload size={12}/>Download PDF
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- PRUNED ARCHIVE DESK FOOTER --- */}
        <div className="flex flex-wrap justify-center gap-4 pt-6">
            <button onClick={() => setActiveModal('manifest')} 
              className="flex items-center gap-4 px-8 py-3.5 bg-white border border-stone-200 hover:border-stone-900 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shadow-sm group">
                <Clock size={14} className="text-[#a9b897] group-hover:rotate-12 transition-transform" />
                <span>Recents</span> 
            </button>
        </div>

      </div>

    </div>
  );
}