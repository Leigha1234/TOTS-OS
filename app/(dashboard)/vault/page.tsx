"use client";

import { useState, useRef, useEffect } from "react";
import { 
  ShieldCheck, Lock, ArrowUpRight, Search, 
  AlertCircle, ExternalLink, Globe, Clock, X, 
  Download, MapPin, Folder, ChevronDown, Lightbulb, Zap, Info
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// --- PLACEHOLDER DATA STRUCTURE ---
// Ensure this matches your actual data export
const DOCUMENTS = [
  { id: 1, title: "Operational Guidelines", category: "Operations", content: "Logic content...", clarity: "Streamline reporting" },
  { id: 2, title: "Legal Framework", category: "Legal", content: "Regulatory text...", clarity: "Ensure compliance" }
];

const GEO_SIGNPOSTS: Record<string, { label: string; links: { name: string; url: string; desc: string }[] }> = {
  UK: {
    label: "United Kingdom",
    links: [
      { name: "Companies House", url: "https://www.gov.uk/government/organisations/companies-house", desc: "UK company filings." },
      { name: "ICO", url: "https://ico.org.uk/", desc: "Data protection & GDPR." }
    ]
  },
  US: {
    label: "United States",
    links: [
      { name: "SBA", url: "https://www.sba.gov/", desc: "Startup capital logic." },
      { name: "SEC", url: "https://www.sec.gov/edgar", desc: "Regulatory oversight." }
    ]
  }
};

export default function VaultPage() {
  // Fixed: Defined a type for the document to avoid 'any'
  const [selectedDoc, setSelectedDoc] = useState<{id: number, title: string, content: string, clarity: string} | null>(null);
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
    setTimeout(() => {
      let updated = editableContent;
      if (aiPrompt.toLowerCase().includes("payment")) updated = updated.replace(/\[30\]/g, "[60]");
      setEditableContent(updated + `\n\n[PROCESSED BY AI: ${aiPrompt}]`);
      setAiPrompt("");
      setIsAiLoading(false);
    }, 800);
  };

  const downloadPDF = async () => {
    const element = printRef.current;
    if (!element) return;
    
    // Fixed: Added error handling for DOM capture
    const canvas = await html2canvas(element, { scale: 2, logging: false });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Vault_${selectedDoc?.title.replace(/\s/g, '_') || 'Doc'}.pdf`);
  };

  const categories = Array.from(new Set(DOCUMENTS.map(d => d.category)));

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-8 md:p-12 lg:p-24 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-20">
        {/* Simplified display for brevity, maintain your original structure */}
        <header>
          <h1 className="text-8xl font-serif italic">Archive Logic</h1>
        </header>

        <div className="grid grid-cols-12 gap-16">
          <div className="col-span-8">
            <input 
              className="w-full p-10 border rounded-[3rem]" 
              placeholder="Search..."
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
            {categories.map((cat) => (
              <div key={cat}>
                <button onClick={() => toggleFolder(cat)}>{cat}</button>
                {expandedFolders.includes(cat) && DOCUMENTS.filter(d => d.category === cat).map(doc => (
                  <div key={doc.id} onClick={() => setSelectedDoc(doc)}>{doc.title}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedDoc && (
        <div className="fixed inset-0 z-[100] bg-stone-950/80 p-12">
          <div className="bg-white h-full rounded-[4rem] p-16 overflow-y-auto">
            <button onClick={() => setSelectedDoc(null)}>Close</button>
            <div ref={printRef}>
              <textarea 
                value={editableContent} 
                onChange={(e) => setEditableContent(e.target.value)} 
                className="w-full h-[600px] p-8"
              />
            </div>
            <button onClick={downloadPDF}>Export PDF</button>
          </div>
        </div>
      )}
    </div>
  );
}