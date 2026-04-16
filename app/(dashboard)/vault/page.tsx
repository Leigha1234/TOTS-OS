"use client";

import { useState, useRef, useEffect } from "react";
import { 
  ShieldCheck, FileText, Lock, Users, ArrowUpRight, 
  Search, ShoppingBag, AlertCircle, CheckCircle2,
  ExternalLink, Globe, Heart, Zap, Clock, ChevronRight, X, Download, Edit3, Info, Lightbulb, MessageSquare, Send, MapPin, Folder, ChevronDown
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// --- GEOGRAPHIC SIGNPOST DATA ---
const GEO_SIGNPOSTS: Record<string, { label: string; links: { name: string; url: string; desc: string }[] }> = {
  UK: {
    label: "United Kingdom",
    links: [
      { name: "Companies House", url: "https://www.gov.uk/government/organisations/companies-house", desc: "UK company filings." },
      { name: "ICO", url: "https://ico.org.uk/", desc: "Data protection & GDPR." },
      { name: "HMRC", url: "https://www.gov.uk/government/organisations/hm-revenue-customs", desc: "Tax logic." }
    ]
  },
  US: {
    label: "United States",
    links: [
      { name: "SBA", url: "https://www.sba.gov/", desc: "Startup capital logic." },
      { name: "SEC", url: "https://www.sec.gov/edgar", desc: "Regulatory oversight." },
      { name: "IRS", url: "https://www.irs.gov/businesses", desc: "Federal tax." }
    ]
  }
};

// ... [DOCUMENTS Array remains consistent with your input]

export default function VaultPage() {
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editableContent, setEditableContent] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [region, setRegion] = useState("UK");
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
    // Simulation of AI logic processing
    setTimeout(() => {
      let updated = editableContent;
      if (aiPrompt.toLowerCase().includes("payment")) updated = updated.replace(/\[30\]/g, "[60]");
      if (aiPrompt.toLowerCase().includes("ai")) updated += "\n\n[CLAUSE] Nodes must not feed this logic into LLMs.";
      setEditableContent(updated + `\n\n[PROCESSED BY AI: ${aiPrompt}]`);
      setAiPrompt("");
      setIsAiLoading(false);
    }, 800);
  };

  const downloadPDF = async () => {
    const element = printRef.current;
    if (!element) return;
    const canvas = await html2canvas(element, { scale: 2 });
    const pdf = new jsPDF("p", "mm", "a4");
    const imgData = canvas.toDataURL("image/png");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Chronos_Vault_${selectedDoc.title.replace(/\s/g, '_')}.pdf`);
  };

  const categories = Array.from(new Set(DOCUMENTS.map(d => d.category)));

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-8 md:p-12 lg:p-24 font-sans">
      
      {/* DISCLAIMER BANNER */}
      <div className="max-w-[1400px] mx-auto mb-16 bg-[#1a1a1a] text-white p-10 rounded-[3rem] flex flex-col md:flex-row items-center gap-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          <ShieldCheck size={120} />
        </div>
        <div className="p-4 bg-red-500/20 rounded-2xl">
          <AlertCircle size={32} className="text-red-400" />
        </div>
        <div className="relative z-10">
          <p className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-500 mb-2">Protocol Warning</p>
          <p className="text-sm font-serif italic text-stone-300 leading-relaxed max-w-2xl">
            Documents stored within this vault are raw structural logic. They are not legal advice. 
            All modifications must be validated by a jurisdictional human node before execution.
          </p>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto space-y-20">
        
        {/* HEADER */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12">
          <div className="space-y-6">
            <p className="text-[12px] font-black uppercase tracking-[0.6em] text-[#a9b897] flex items-center gap-4">
              <Lock size={16} strokeWidth={3} /> Institutional Archive
            </p>
            <h1 className="text-8xl md:text-9xl font-serif italic text-stone-900 tracking-tighter leading-[0.8]">
              Archive <br /> <span className="text-stone-300">Logic</span>
            </h1>
          </div>

          <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] shadow-sm flex flex-col gap-6 min-w-[360px]">
            <div className="flex items-center justify-between border-b border-stone-100 pb-6">
              <div className="flex items-center gap-4">
                <MapPin size={22} className="text-[#a9b897]" />
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Regional Gateway</p>
              </div>
              <div className="flex gap-2">
                {["UK", "US"].map((k) => (
                  <button 
                    key={k} 
                    onClick={() => setRegion(k)} 
                    className={`px-5 py-2 text-[10px] font-black rounded-full transition-all ${region === k ? 'bg-stone-950 text-white' : 'bg-stone-100 text-stone-400 hover:bg-stone-200'}`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-3xl font-serif italic text-stone-800">{GEO_SIGNPOSTS[region].label} Framework</p>
          </div>
        </header>

        {/* SEARCH & NAVIGATION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8 space-y-8">
            <div className="relative group">
              <Search size={24} className="absolute left-10 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-[#a9b897] transition-colors" />
              <input 
                placeholder="Search through 43 structural frameworks..." 
                className="w-full pl-24 pr-10 py-10 bg-white border border-stone-100 rounded-[3rem] text-2xl font-serif italic shadow-sm focus:shadow-2xl focus:border-[#a9b897]/30 outline-none transition-all" 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>

            <div className="space-y-4">
              {categories.map((cat) => {
                const docs = DOCUMENTS.filter(d => d.category === cat && d.title.toLowerCase().includes(searchTerm.toLowerCase()));
                if (docs.length === 0) return null;
                return (
                  <div key={cat} className="bg-white rounded-[3rem] border border-stone-100 overflow-hidden transition-all hover:shadow-lg">
                    <button 
                      onClick={() => toggleFolder(cat)} 
                      className="w-full flex items-center justify-between p-10 hover:bg-stone-50 transition-colors"
                    >
                      <div className="flex items-center gap-8">
                        <div className="p-5 bg-stone-100 rounded-3xl text-[#a9b897]">
                          <Folder size={28} fill="currentColor" opacity={0.3} />
                        </div>
                        <h3 className="text-3xl font-serif italic text-stone-900">{cat}</h3>
                      </div>
                      <ChevronDown size={28} className={`text-stone-300 transition-transform duration-500 ${expandedFolders.includes(cat) ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {expandedFolders.includes(cat) && (
                      <div className="px-10 pb-10 space-y-3">
                        {docs.map((doc) => (
                          <div 
                            key={doc.id} 
                            onClick={() => setSelectedDoc(doc)} 
                            className="group flex items-center justify-between p-8 rounded-[2rem] border border-transparent hover:border-stone-100 hover:bg-stone-50 cursor-pointer transition-all"
                          >
                            <div className="space-y-1">
                              <p className="text-xl font-medium text-stone-600 group-hover:text-stone-950 transition-colors">{doc.title}</p>
                              <p className="text-[10px] font-black uppercase tracking-widest text-stone-300">Instrument #{doc.id.toString().padStart(3, '0')}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full border border-stone-100 flex items-center justify-center group-hover:bg-[#a9b897] group-hover:border-transparent transition-all">
                              <ArrowUpRight size={20} className="text-stone-300 group-hover:text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SIDEBAR SIGNPOSTS */}
          <div className="lg:col-span-4 space-y-6">
            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-400 mb-8 px-4">External Verification</h4>
            {GEO_SIGNPOSTS[region].links.map((link, i) => (
              <a 
                key={i} 
                href={link.url} 
                target="_blank" 
                className="block bg-white p-12 rounded-[3.5rem] border border-stone-100 hover:shadow-2xl hover:-translate-y-1 transition-all group"
              >
                <div className="flex justify-between items-start mb-8">
                  <div className="p-4 bg-stone-50 rounded-2xl group-hover:bg-[#a9b897]/10 group-hover:text-[#a9b897] transition-colors">
                    <Globe size={24} />
                  </div>
                  <ExternalLink size={20} className="text-stone-200 group-hover:text-stone-900" />
                </div>
                <h4 className="text-2xl font-serif italic text-stone-900 mb-3">{link.name}</h4>
                <p className="text-[11px] text-stone-400 font-bold uppercase tracking-widest leading-relaxed">{link.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL EDITOR: Full Screen Institutional View */}
      {selectedDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
          <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-2xl" onClick={() => setSelectedDoc(null)} />
          
          <div className="relative bg-[#faf9f6] w-full max-w-screen-2xl h-full rounded-[4rem] shadow-2xl overflow-hidden flex flex-col md:flex-row">
            
            {/* SIDEBAR: Clarity Gate */}
            <div className="w-full md:w-[450px] border-r border-stone-200 bg-stone-50/50 p-16 flex flex-col justify-between">
              <div className="space-y-12">
                <div className="p-10 bg-white border border-stone-200 rounded-[3rem] shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Lightbulb size={60} />
                  </div>
                  <div className="flex items-center gap-4 text-[#a9b897] mb-6">
                    <Zap size={24} fill="currentColor" /> 
                    <h4 className="text-[12px] font-black uppercase tracking-[0.2em]">Clarity Objective</h4>
                  </div>
                  <p className="text-lg font-serif italic text-stone-600 leading-[1.6]">{selectedDoc.clarity}</p>
                </div>

                <div className="space-y-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 px-4">Neural Override (AI Commands)</p>
                  <textarea 
                    value={aiPrompt} 
                    onChange={(e) => setAiPrompt(e.target.value)} 
                    placeholder="e.g. 'Strengthen the arbitration clause' or 'Change jurisdiction to Delaware'" 
                    className="w-full bg-white border border-stone-200 p-8 rounded-[2rem] text-sm italic min-h-[220px] outline-none shadow-inner focus:ring-2 ring-[#a9b897]/20 transition-all resize-none" 
                  />
                  <button 
                    onClick={handleAiCommand} 
                    disabled={isAiLoading || !aiPrompt}
                    className="w-full py-8 bg-stone-950 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-[#a9b897] transition-all disabled:opacity-30"
                  >
                    {isAiLoading ? <Clock className="animate-spin" size={18} /> : <Zap size={18} fill="currentColor" />}
                    {isAiLoading ? "Processing Logic..." : "Update Structural Logic"}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 text-stone-400 italic text-sm">
                <Info size={16} />
                <span>Edits are local and transient until exported.</span>
              </div>
            </div>

            {/* EDITOR AREA */}
            <div className="flex-1 flex flex-col bg-white">
               <div className="p-12 border-b border-stone-100 flex justify-between items-center bg-[#faf9f6]">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a9b897] mb-1">Active Instrument</p>
                    <h2 className="text-5xl font-serif italic text-stone-900 tracking-tighter">{selectedDoc.title}</h2>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={downloadPDF} 
                      className="group flex items-center gap-4 px-10 py-5 bg-stone-950 text-white rounded-[2rem] transition-all hover:scale-105"
                    >
                      <Download size={20} />
                      <span className="text-[11px] font-black uppercase tracking-widest">Generate PDF</span>
                    </button>
                    <button 
                      onClick={() => setSelectedDoc(null)} 
                      className="p-6 bg-stone-100 text-stone-400 rounded-full hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                      <X size={24} />
                    </button>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-16 bg-stone-100/30 scrollbar-hide">
                  <div 
                    ref={printRef} 
                    className="bg-white p-24 md:p-32 shadow-2xl min-h-[1100px] w-full max-w-[900px] mx-auto border border-stone-100"
                  >
                    <textarea 
                      value={editableContent} 
                      onChange={(e) => setEditableContent(e.target.value)} 
                      className="w-full h-full min-h-[850px] bg-transparent outline-none resize-none text-2xl font-serif leading-[1.8] text-stone-800" 
                      spellCheck="false" 
                    />
                    
                    <div className="mt-32 pt-20 border-t-2 border-stone-900 grid grid-cols-2 gap-20">
                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Authorized Signature</p>
                        <div className="h-20 border-b border-stone-200 italic text-stone-300 flex items-end pb-2">X</div>
                      </div>
                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Execution Date</p>
                        <div className="h-20 border-b border-stone-200 italic text-stone-300 flex items-end pb-2">/ / 2026</div>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}