"use client";

import { useState, useRef, useEffect } from "react";
import { 
  ShieldCheck, Lock, ArrowUpRight, Search, 
  AlertCircle, ExternalLink, Globe, Clock, X, 
  Download, MapPin, Folder, ChevronDown, Lightbulb, Zap, Info, FileText, Send, Sparkles, Plus, FileCode, Check 
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
  // 1. Onboarding & Systems
  { 
    id: 1, 
    title: "Client Intake System", 
    category: "Onboarding & CRM", 
    clarity: "Onboarding & Workflow Engine",
    content: `CLIENT ONBOARDING SYSTEM

📄 Intake Form
Name: [Client Name]
Business: [Business Name]
Email: [Email Address]
Service purchased: [Service Name]
Start date: [YYYY-MM-DD]
Goals (top 3):
1. 
2. 
3.
Biggest current bottleneck: [Bottleneck]

⚙️ Workflow (inside TOTS)
[ ] New client created
[ ] Send welcome email
[ ] Send contract + invoice
[ ] Create project board
[ ] Book kickoff call
[ ] Assign internal tasks

✉️ Welcome Email Template
Subject: You’re in — here’s what happens next

Hi [Name],

Great to have you onboard.

Here’s how this works:
1. Complete your onboarding form
2. Book your kickoff call here: [link]
3. We begin system mapping immediately after

We’ll be building the structure your business runs on.

— TOTS`
  },

  // 2. Sales System
  { 
    id: 2, 
    title: "Sales Pipeline & Scripting", 
    category: "Sales & Marketing", 
    clarity: "Pipeline & Follow-ups",
    content: `SALES PIPELINE SYSTEM

📊 Pipeline Stages
- New Lead
- Contacted
- Qualified
- Proposal Sent
- Negotiation
- Won
- Lost

📞 Sales Call Structure
- Current situation:
- Problems / bottlenecks:
- Impact (time, money, stress):
- Desired outcome:
- Gap:
- Offer:

✉️ Follow-Up Template
Hey [Name],

Based on what you said about [problem], this is exactly where we step in.

We build the system that removes that bottleneck.

Let me know if you want me to send over the next steps.

— Sam`
  },

  // 3. Business Audit
  {
    id: 3, 
    title: "Business Audit Framework",
    category: "Operations",
    clarity: "Diagnostic Blueprint",
    content: `BUSINESS AUDIT TEMPLATE (£250 Product)

Sections:
1. Operations
- How do tasks get tracked?
- Where do things get delayed?

2. Sales
- How are leads generated?
- Conversion rate?

3. Clients
- How do you onboard?
- Retention process?

4. Finance
- Monthly revenue:
- Profit clarity? Y/N

Output (what YOU deliver)
- 3 bottlenecks
- 3 missed opportunities
- 1 system recommendation`
  },

  // 4. Content System & Hooks
  {
    id: 4, 
    title: "Content Marketing System",
    category: "Sales & Marketing",
    clarity: "Systemised Content Planning",
    content: `CONTENT SYSTEM

Weekly Plan
- 2x authority posts
- 2x problem posts
- 1x offer post

Viral Hook Templates
- "If your business still relies on you, read this"
- "You don't need more clients, you need this"
- "This is why your business feels chaotic"`
  },

  // 5. SOP Template
  {
    id: 5, 
    title: "Process / SOP Builder",
    category: "Operations",
    clarity: "Standardisation template",
    content: `SOP TEMPLATE

TITLE: [Process Name]

PURPOSE:
What this process achieves

STEPS:
1. 
2. 
3.

TOOLS USED:
• TOTS OS
• Email
• etc

EXPECTED OUTCOME:
What "done" looks like`
  },

  // 6. Administrative Operations
  {
    id: 6, 
    title: "Weekly Executive Dashboard",
    category: "Operations",
    clarity: "Administrative tracker",
    content: `WEEKLY CEO DASHBOARD

Track:
- Revenue this week
- Deals in pipeline
- Tasks overdue
- Clients at risk
- Time spent on admin`
  },

  // 7. Offer Creation
  {
    id: 7, 
    title: "Offer Creation Blueprint",
    category: "Sales & Marketing",
    clarity: "Value-focused positioning",
    content: `OFFER CREATION TEMPLATE

Problem: 
Current solution (why it fails):
Your solution:
Outcome:
Price:
Delivery method:`
  },

  // 8. Service Business Pack
  {
    id: 8, 
    title: "Service Business OS Starter",
    category: "Products & Packs",
    clarity: "High Value Product Suite",
    content: `SERVICE BUSINESS PACK

Bundle:
- Onboarding system
- Sales pipeline
- SOP pack
- Dashboard
- Finance tracker

👉 Sell this as: "Service Business OS Starter" (£99–£299)
Provide editable, business-ready and simplified versions that people can actually use without a solicitor.`
  },

  // Legal Templates
  {
    id: 9, 
    title: "Terms & Conditions Builder (Service)",
    category: "Legal & Governance",
    clarity: "T&Cs Builder System",
    content: `TERMS & CONDITIONS BUILDER

[INSERT BUSINESS NAME]

1. 🧩 Scope of Work
The Provider agrees to provide [INSERT SERVICE TYPE] as specified in the service agreement.

2. 🧩 Payment Terms
Payment shall be made as follows: [INSERT PAYMENT TERMS]. A late fee of 5% is added after 7 days.

3. Cancellation Policy
Either party may terminate this agreement with 14 days written notice.

4. Liability Limits
The Provider's liability is limited to the total amount paid by the Client.

---
Guidance Note: If you take deposits, include "A non-refundable 50% deposit is required before work commences."

⚠️ Disclaimer: This template is a general framework and should be reviewed by a professional for your specific business requirements.`
  },
  {
    id: 10, 
    title: "GDPR-Friendly Privacy Policy",
    category: "Legal & Governance",
    clarity: "Data compliance builder",
    content: `PRIVACY POLICY (GDPR-FRIENDLY)

1. Data Collection
We collect Name, Business Name, Email Address, and Project Details.

2. Storage and Security
Data is stored securely inside the TOTS OS platform and protected infrastructure.

3. Usage
Data is used to provide service deliverables and system automation updates.

4. Cookies and Web Data
Minimal cookies are used for authorization. 

5. Third-Party Tools
- TOTS OS (Cloud environment)
- Communication channels (Email/Slack)

👉 Bonus Checkbox Text:
"I consent to having my personal details stored and used in accordance with the Privacy Policy for onboarding and processing purposes."

⚠️ Disclaimer: This template is a general framework and should be reviewed by a professional for your specific business requirements.`
  },
  {
    id: 11, 
    title: "Service Agreement Contract",
    category: "Legal & Governance",
    clarity: "Legal and project contract",
    content: `CLIENT CONTRACT & AGREEMENT

[INSERT BUSINESS NAME]

1. Deliverables
2. Timelines & Milestones
3. Revision Thresholds
4. Payment Schedule
5. Ownership and IP

Version Option: 
- One-Off Project: Fully paid upon completion of deliverable.
- Monthly Retainer: Billed on the 1st of every month.

⚠️ Disclaimer: This template is a general framework and should be reviewed by a professional for your specific business requirements.`
  },
  {
    id: 12, 
    title: "Data Consent Templates",
    category: "Legal & Governance",
    clarity: "Opt-in documentation",
    content: `DATA CONSENT & OPT-IN TEMPLATE

1. Email Marketing Consent
2. GDPR Form Checkboxes
3. Data Protection / Retention text

⚠️ Disclaimer: This template is a general framework and should be reviewed by a professional for your specific business requirements.`
  }
];

export default function VaultPage() {
  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editableContent, setEditableContent] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<string[]>(["Legal & Governance", "Operations", "Sales & Marketing", "Onboarding & CRM"]);
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
      setEditableContent(prev => prev + `\n\n--- ⚡ TOTS AI SYNTHESIS ---\n${aiPrompt}`);
      setAiPrompt("");
      setIsAiLoading(false);
    }, 1200);
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
      pdf.save(`TOTS_Vault_${selectedDoc?.title || 'Document'}.pdf`);
    } catch (err) {
      console.error("PDF Export failed", err);
    }
  };

  const filteredDocs = DOCUMENTS.filter(d => 
    d.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = Array.from(new Set(DOCUMENTS.map(d => d.category)));

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-8 md:p-12 lg:p-24 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-12">
        <header className="border-b border-stone-200 pb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-7xl font-serif italic tracking-tighter">The Vault</h1>
            <p className="text-stone-400 mt-4 italic">Systematised business foundations and the Legal OS framework.</p>
          </div>
          <button 
            onClick={() => {
              // Command for installing legal foundation set
              alert("Installing Legal Foundation modules, connecting CRM workflow hooks, and embedding documents...");
            }} 
            className="px-8 py-4 bg-[#a9b897] text-stone-900 rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-[#99a888] transition-all shadow-xl flex items-center gap-4 cursor-pointer"
          >
            <Sparkles size={16} /> Install Legal Foundation
          </button>
        </header>

        <div className="grid grid-cols-12 gap-16">
          {/* SIDEBAR NAVIGATION */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
              <input 
                className="w-full p-4 pl-12 bg-white border border-stone-200 rounded-2xl outline-none focus:ring-4 ring-stone-900/5 transition-all text-xs font-semibold" 
                placeholder="Search archive and system packs..."
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
                    <span>{cat}</span>
                    <ChevronDown size={14} className={`transition-transform ${expandedFolders.includes(cat) ? "rotate-180" : ""}`} />
                  </button>
                  {expandedFolders.includes(cat) && (
                    <div className="bg-stone-50/50 p-2 space-y-1 border-t border-stone-100">
                      {filteredDocs.filter(d => d.category === cat).map(doc => (
                        <button 
                          key={doc.id} 
                          onClick={() => setSelectedDoc(doc)}
                          className={`w-full text-left px-6 py-4 rounded-xl transition-all flex flex-col gap-1 hover:bg-white border ${
                            selectedDoc?.id === doc.id ? "bg-white border-stone-300 shadow-sm" : "border-transparent"
                          }`}
                        >
                          <span className="text-xs font-bold text-stone-800 flex items-center gap-2">
                            <FileText size={14} className="text-[#a9b897]" />
                            {doc.title}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono tracking-wide">{doc.clarity}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* MAIN PREVIEW AREA */}
          <div className="col-span-12 lg:col-span-8 flex items-center justify-center border-2 border-dashed border-stone-200 rounded-[3rem] p-20 bg-white text-stone-400 min-h-[400px]">
            <div className="text-center space-y-4 max-w-md">
              <Folder size={48} className="mx-auto opacity-20 text-[#a9b897]" />
              <p className="font-serif italic text-lg text-stone-700 font-medium">Select a module from the archive to modify, build, or deploy.</p>
              <p className="text-xs text-stone-400 leading-relaxed">
                All templates include built-in editable clauses, guidance notes, and TOTS-style workflows.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL OVERLAY */}
      {selectedDoc && (
        <div className="fixed inset-0 z-[100] bg-stone-950/60 backdrop-blur-sm p-8 md:p-12 overflow-y-auto">
          <div className="bg-white max-w-4xl mx-auto rounded-[3.5rem] p-16 shadow-2xl relative border border-stone-100">
            <button 
              onClick={() => setSelectedDoc(null)}
              className="absolute top-12 right-12 p-4 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div ref={printRef} className="space-y-8">
              <div className="space-y-2">
                <span className="text-[9px] uppercase font-black tracking-[0.2em] text-[#a9b897]">{selectedDoc.category}</span>
                <h2 className="text-4xl font-serif text-stone-800">{selectedDoc.title}</h2>
              </div>
              
              <textarea 
                value={editableContent} 
                onChange={(e) => setEditableContent(e.target.value)} 
                className="w-full h-[450px] p-10 bg-stone-50/50 border border-stone-200 rounded-3xl outline-none font-mono text-xs text-stone-800 leading-relaxed focus:ring-4 ring-[#a9b897]/5 transition-all"
              />
            </div>

            <div className="mt-12 flex flex-col md:flex-row gap-4 items-center justify-between border-t border-stone-100 pt-8">
              <button 
                onClick={downloadPDF}
                className="flex items-center gap-3 px-8 py-4 bg-stone-100 text-stone-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-stone-200 transition-all cursor-pointer"
              >
                <Download size={14} /> Export Document (PDF)
              </button>

              <div className="flex-1 w-full flex flex-col sm:flex-row gap-3 mt-4 md:mt-0 md:ml-8">
                <input 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="flex-1 px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:ring-4 ring-stone-900/5 text-xs"
                  placeholder="e.g., Update template to include monthly retainer pricing..."
                />
                <button 
                  onClick={handleAiCommand}
                  disabled={isAiLoading}
                  className="px-8 py-4 bg-stone-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-stone-700 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Zap size={14} /> {isAiLoading ? "Synthesizing..." : "Submit AI Command"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}