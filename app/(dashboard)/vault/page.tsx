"use client";

import { useState, useRef, useEffect } from "react";
import { 
  ShieldCheck, Lock, ArrowUpRight, Search, 
  AlertCircle, ExternalLink, Globe, Clock, X, 
  Download, MapPin, Folder, ChevronDown, Lightbulb, Zap, Info
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// --- TYPES ---
interface Doc {
  id: number;
  title: string;
  category: string;
  content: string;
  clarity: string;
}

// --- DATA ---
const DOCUMENTS: Doc[] = [
  { id: 1, title: "Operational Guidelines", category: "Operations", content: "Standard operating procedures for Q3...", clarity: "Streamline reporting" },
  { id: 2, title: "Legal Framework", category: "Legal", content: "Regulatory compliance text...", clarity: "Ensure adherence to standards" }
];

export default function VaultPage() {
  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editableContent, setEditableContent] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<string[]>(["Legal", "Operations"]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedDoc) setEditableContent(selectedDoc.content || "");
  }, [selectedDoc]);

  const toggleFolder = (cat: string) => {
    setExpandedFolders(prev => prev.includes(cat) ? prev.filter(f => f !== cat) : [...prev, cat]);
  };

  const handleAiCommand = () => {
    if (!aiPrompt) return;
    setIsAiLoading(true);
    // Simulated AI Processing
    setTimeout(() => {
      setEditableContent(prev => prev + `\n\n--- AI UPDATE: ${aiPrompt} ---`);
      setAiPrompt("");
      setIsAiLoading(false);
    }, 800);
  };

  const downloadPDF = async () => {
    if (!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Vault_${selectedDoc?.title || 'Document'}.pdf`);
    } catch (err) {
      console.error("PDF Export failed", err);
    }
  };

  const filteredDocs = DOCUMENTS.filter(d => d.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const categories = Array.from(new Set(DOCUMENTS.map(d => d.category)));

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-8 md:p-12 lg:p-24 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-12">
        <header className="border-b border-stone-200 pb-12">
          <h1 className="text-7xl font-serif italic tracking-tighter">Archive Logic</h1>
          <p className="text-stone-400 mt-4 italic">Secure repository management and synthesis engine.</p>
        </header>

        <div className="grid grid-cols-12 gap-16">
          {/* SIDEBAR NAVIGATION */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
              <input 
                className="w-full p-4 pl-12 bg-white border border-stone-200 rounded-2xl outline-none focus:ring-2 ring-stone-900 transition-all" 
                placeholder="Search archive..."
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
            
            <div className="space-y-4">
              {categories.map((cat) => (
                <div key={cat} className="border border-stone-200 rounded-2xl overflow-hidden bg-white">
                  <button 
                    onClick={() => toggleFolder(cat)}
                    className="w-full flex justify-between items-center p-6 font-black uppercase text-[10px] tracking-widest text-stone-500 hover:bg-stone-50"
                  >
                    {cat} <ChevronDown size={14} className={expandedFolders.includes(cat) ? "rotate-180" : ""} />
                  </button>
                  {expandedFolders.includes(cat) && (
                    <div className="bg-stone-50 p-2 space-y-1">
                      {filteredDocs.filter(d => d.category === cat).map(doc => (
                        <button 
                          key={doc.id} 
                          onClick={() => setSelectedDoc(doc)}
                          className="w-full text-left px-4 py-3 text-sm font-medium text-stone-600 hover:text-stone-900 rounded-lg transition-colors"
                        >
                          {doc.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* MAIN PREVIEW AREA */}
          <div className="col-span-12 lg:col-span-8 flex items-center justify-center border-2 border-dashed border-stone-200 rounded-[3rem] p-20 text-stone-400">
            <div className="text-center space-y-4">
              <Folder size={48} className="mx-auto opacity-20" />
              <p className="font-serif italic text-lg">Select a document from the archive to begin modification.</p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL OVERLAY */}
      {selectedDoc && (
        <div className="fixed inset-0 z-[100] bg-stone-950/60 backdrop-blur-sm p-12 overflow-y-auto">
          <div className="bg-white max-w-4xl mx-auto rounded-[3rem] p-16 shadow-2xl relative">
            <button 
              onClick={() => setSelectedDoc(null)}
              className="absolute top-12 right-12 p-3 bg-stone-100 rounded-full hover:bg-stone-200"
            >
              <X size={20} />
            </button>
            
            <div ref={printRef} className="space-y-8">
              <h2 className="text-4xl font-serif italic">{selectedDoc.title}</h2>
              <textarea 
                value={editableContent} 
                onChange={(e) => setEditableContent(e.target.value)} 
                className="w-full h-96 p-8 bg-stone-50 rounded-2xl outline-none font-mono text-sm"
              />
            </div>

            <div className="mt-12 flex gap-4">
              <button 
                onClick={downloadPDF}
                className="flex items-center gap-2 px-8 py-4 bg-stone-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-stone-700"
              >
                <Download size={16} /> Export PDF
              </button>
              <div className="flex-1 flex gap-2">
                <input 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="flex-1 px-6 border border-stone-200 rounded-2xl outline-none focus:ring-2 ring-stone-900"
                  placeholder="Ask AI to adjust content..."
                />
                <button 
                  onClick={handleAiCommand}
                  disabled={isAiLoading}
                  className="px-6 bg-purple-100 text-purple-700 rounded-2xl font-bold text-xs"
                >
                  {isAiLoading ? "Synthesizing..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}