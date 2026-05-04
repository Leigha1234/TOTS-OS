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
    content: `BUSINESS LEGAL FOUNDATIONS - T&Cs (SERVICE-BASED)

⚠️ MASTER DISCLAIMER
These templates are provided as general business frameworks and do not constitute legal advice. We recommend reviewing with a qualified legal professional to ensure suitability for your specific business.

1. Introduction
This agreement is between:
[Your Business Name] ("the Company")
and
[Client Name] ("the Client").

By engaging services, the Client agrees to the terms outlined below.

2. Scope of Work
The Company agrees to deliver:
[Insert description of services]

Any additional work outside this scope may incur additional charges.

3. Payment Terms
Total fee: £[amount]
Payment structure: [e.g. upfront / instalments / monthly]
Payment due within: [X] days

Late payments may result in:
- Work being paused
- Late fees of [X% or £X]

4. Cancellations & Refunds
- Deposits are non-refundable.
- Ongoing services require [X days] notice.
- No refunds for work already completed.

5. Client Responsibilities
The Client agrees to:
- Provide required information on time.
- Communicate clearly.
- Approve deliverables within a reasonable timeframe.
(Delays from the Client may affect timelines).

6. Liability
The Company is not liable for:
- Loss of revenue
- Indirect or consequential damages
(Total liability is limited to the amount paid for services).

7. Intellectual Property
- Work remains property of the Company until paid in full.
- Upon full payment, ownership transfers to the Client unless agreed otherwise.

8. Confidentiality
Both parties agree not to share confidential information.

9. Termination
Either party may terminate with written notice. Outstanding payments remain due.

10. Governing Law
This agreement is governed by the laws of [Country].`
  },
  {
    id: 10, 
    title: "GDPR-Friendly Privacy Policy",
    category: "Legal & Governance",
    clarity: "Data compliance builder",
    content: `BUSINESS LEGAL FOUNDATIONS - PRIVACY POLICY

⚠️ MASTER DISCLAIMER
These templates are provided as general business frameworks and do not constitute legal advice. We recommend reviewing with a qualified legal professional to ensure suitability for your specific business.

1. Overview
We respect your privacy and are committed to protecting your data.

2. Data We Collect
- Name
- Email
- Business details
- Payment information

3. How We Use Data
- Deliver services
- Process payments
- Improve systems
- Communicate updates

4. Data Storage
Your data is securely stored and only accessible to authorised personnel.

5. Third Parties
We may use trusted third-party tools (e.g. payment processors, email systems).

6. Your Rights
You can:
- Request access to your data
- Request deletion
- Withdraw consent
Contact: [Your Email]

7. Cookies
Our website may use cookies for analytics and performance.`
  },
  {
    id: 11, 
    title: "Client Contract & Retainer Agreement",
    category: "Legal & Governance",
    clarity: "Legal and project contract",
    content: `BUSINESS LEGAL FOUNDATIONS - CLIENT AGREEMENT

⚠️ MASTER DISCLAIMER
These templates are provided as general business frameworks and do not constitute legal advice. We recommend reviewing with a qualified legal professional to ensure suitability for your specific business.

Project Details
Service: [Insert]
Start Date: [Insert]
Duration: [Insert]

Deliverables
1. [Deliverable 1]
2. [Deliverable 2]

Revisions
Includes: [X] revisions. Additional revisions may be charged.

Communication
Primary contact: [email / platform]

Payment
As per agreed terms.

Termination
Either party may terminate with notice. Work completed must be paid for.`
  },
  {
    id: 12, 
    title: "Payment & Disclaimer Module",
    category: "Legal & Governance",
    clarity: "Policy and disclaimer modules",
    content: `BUSINESS LEGAL FOUNDATIONS - POLICIES & DISCLAIMERS

⚠️ MASTER DISCLAIMER
These templates are provided as general business frameworks and do not constitute legal advice. We recommend reviewing with a qualified legal professional to ensure suitability for your specific business.

Part 1: Payment Terms Policy
- Invoices must be paid within [X] days.
- Late payments incur [fee].
- Work may pause if unpaid.
- No delivery of final work until paid in full.

Part 2: Disclaimer Template
The Company provides business and operational guidance.
We do not guarantee:
- Specific financial results
- Business outcomes
All decisions made by the Client are their responsibility.

Part 3: Data Consent / Opt-In
Checkbox Wording:
"I agree to have my data stored and used in accordance with the Privacy Policy."

Email Consent:
"I agree to receive communications, updates, and relevant offers."`
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
            <p className="text-stone-400 mt-4 italic">Systematised business foundations and the Business Legal Foundation Pack.</p>
          </div>
          <button 
            onClick={() => {
              alert("Installing Legal Foundation Pack. Attaching T&Cs to onboarding forms, linking contracts to clients, and payment terms to invoices.");
            }} 
            className="px-8 py-4 bg-[#a9b897] text-stone-900 rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-[#99a888] transition-all shadow-xl flex items-center gap-4 cursor-pointer"
          >
            <Sparkles size={16} /> Install Legal System
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
          <div className="col-span-12 lg:col-span-8 flex flex-col items-center justify-center border-2 border-dashed border-stone-200 rounded-[3rem] p-12 bg-white text-stone-600 min-h-[400px] text-center">
            <Lightbulb className="text-[#a9b897] mb-6" size={42} />
            <h3 className="font-serif text-2xl mb-2">Welcome to your operational core</h3>
            <p className="text-sm text-stone-400 max-w-lg mb-8 leading-relaxed">
              Use your archive to generate, modify, or download essential business frameworks. 
              Click any sidebar component to view its contents and edit it with your business parameters.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full text-left mt-4 border-t border-stone-100 pt-8">
              <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200">
                <span className="text-[10px] uppercase tracking-widest font-black text-[#a9b897] block mb-2">1. Select</span>
                <span className="text-xs text-stone-800">Browse categories to locate your needed documents and templates.</span>
              </div>
              <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200">
                <span className="text-[10px] uppercase tracking-widest font-black text-[#a9b897] block mb-2">2. Modify</span>
                <span className="text-xs text-stone-800">Use the text interface or AI to fill in custom business logic.</span>
              </div>
              <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200">
                <span className="text-[10px] uppercase tracking-widest font-black text-[#a9b897] block mb-2">3. Deploy</span>
                <span className="text-xs text-stone-800">Download directly or install to your current active systems.</span>
              </div>
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