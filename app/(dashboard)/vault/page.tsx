"use client";

import { useState, useRef, useEffect } from "react";
import { 
  ShieldCheck, FileText, Lock, Users, ArrowUpRight, 
  Search, ShoppingBag, AlertCircle, CheckCircle2,
  ExternalLink, Globe, Heart, Zap, Clock, ChevronRight, X, Download, Edit3, Info, Lightbulb, MessageSquare, Send, MapPin, Folder, ChevronDown
} from "lucide-react";
import Page from "../components/Page";
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

// --- THE MASTER ARCHIVE: 43 FULLY DRAFTED INSTRUMENTS ---
const DOCUMENTS = [
  // LEGAL
  { id: 1, category: "Legal", title: "Global Terms & Conditions", clarity: "The primary liability shield.", content: "GLOBAL TERMS & CONDITIONS\n\n1. BINDING EFFECT. By accessing this service, the User ('Node') agrees to be bound by these Terms.\n2. INTELLECTUAL PROPERTY. All software, logic, and 'Digital DNA' are the sole property of the Company. No reverse engineering is permitted.\n3. LIMITATION OF LIABILITY. To the maximum extent permitted by law, the Company is not liable for indirect or consequential damages.\n4. TERMINATION. We reserve the right to suspend any Node for breach of logic.\n5. GOVERNING LAW. This agreement is governed by the laws of [Jurisdiction]." },
  { id: 2, category: "Legal", title: "Mutual NDA", clarity: "Protects sensitive logic during meetings.", content: "MUTUAL NON-DISCLOSURE AGREEMENT\n\n1. DEFINITION. 'Confidential Information' includes all logic, data, and prototypes shared.\n2. OBLIGATIONS. Both parties agree to protect information with reasonable care and not disclose it to third parties for [3] years.\n3. EXCLUSIONS. This does not apply to information already in the public domain.\n4. RETURN OF DATA. Upon request, all nodes must purge shared data from their systems." },
  { id: 3, category: "Legal", title: "Shareholder Agreement", clarity: "Equity and exit logic for founders.", content: "SHAREHOLDER AGREEMENT\n\n1. VESTING. All founder shares are subject to a [4] year vesting schedule with a [12] month cliff.\n2. DRAG-ALONG. If [75]% of shareholders vote to sell, all others must comply.\n3. PRE-EMPTIVE RIGHTS. Current holders have the first right of refusal on new equity issuance.\n4. DISPUTE RESOLUTION. Any deadlock will be resolved via [Binding Arbitration]." },
  { id: 4, category: "Legal", title: "IP Assignment Deed", clarity: "Ensures the institution owns all work output.", content: "INTELLECTUAL PROPERTY ASSIGNMENT\n\n1. TRANSFER. The Assignor hereby transfers all rights, title, and interest in [Project Name] to the Company.\n2. MORAL RIGHTS. The Assignor irrevocably waives all moral rights globally.\n3. CONSIDERATION. This assignment is made for the consideration of [Employment/Consultancy Fees]." },
  { id: 5, category: "Legal", title: "API License Agreement", clarity: "Rules for 3rd party technical connections.", content: "API LICENSE AGREEMENT\n\n1. GRANT. A non-exclusive, non-transferable license to access the API.\n2. LIMITS. Restricted to [X] requests per hour.\n3. PROHIBITIONS. No caching of data beyond [24] hours. No scraping of core node logic." },
  { id: 6, category: "Legal", title: "Software License Agreement", clarity: "Terms for renting/using software.", content: "SOFTWARE LICENSE AGREEMENT\n\n1. LICENSE. The Company grants a limited license to use [Software] for [X] users.\n2. RESTRICTIONS. No sub-licensing or redistribution of source code.\n3. UPDATES. The Company may push mandatory logic updates at its discretion." },
  { id: 7, category: "Legal", title: "Software Escrow", clarity: "Safety net for code access.", content: "SOFTWARE ESCROW DEED\n\n1. DEPOSIT. Source code is held by [Escrow Agent].\n2. RELEASE. Code is released to the Beneficiary only upon [Company Insolvency/Failure to Maintain].\n3. AUDIT. The agent shall verify the code integrity annually." },
  { id: 8, category: "Legal", title: "Letter of Intent (LOI)", clarity: "The 'handshake' before a deal.", content: "LETTER OF INTENT\n\n1. PURPOSE. To outline the acquisition of [Target] for $[Amount].\n2. EXCLUSIVITY. The Seller shall not negotiate with other parties for [30] days.\n3. NON-BINDING. This letter is non-binding except for confidentiality and exclusivity clauses." },
  { id: 9, category: "Legal", title: "Joint Venture Framework", clarity: "Shared logic for a specific goal.", content: "JOINT VENTURE AGREEMENT\n\n1. FORMATION. Partners [A] and [B] form a JV for the purpose of [Goal].\n2. CONTRIBUTIONS. [A] provides [Tech/Capital]; [B] provides [Operations/Sales].\n3. PROFIT SPLIT. Distributions made [50/50] after expenses." },
  { id: 10, category: "Legal", title: "Conflict of Interest Register", clarity: "Ensures institutional impartiality.", content: "CONFLICT OF INTEREST DISCLOSURE\n\n1. DISCLOSURE. I, [Name], declare a potential conflict regarding [Client/Project].\n2. NATURE. [Details of Conflict].\n3. MITIGATION. The Node shall be recused from all voting logic regarding this matter." },

  // OPERATIONS
  { id: 11, category: "Operations", title: "Master Service Agreement", clarity: "The primary service contract.", content: "MASTER SERVICE AGREEMENT\n\n1. SERVICES. Provider shall perform tasks defined in SOWs.\n2. PAYMENT. Net [30] days via [Bank Transfer].\n3. WARRANTY. Services performed with professional skill.\n4. INDEMNITY. Each party is responsible for their own negligence." },
  { id: 12, category: "Operations", title: "Statement of Work (SOW)", clarity: "Project specific deliverables.", content: "STATEMENT OF WORK\n\nPROJECT: [Name]\nDELIVERABLES: [List deliverables]\nTIMELINE: [Start] to [End]\nFEES: $[Amount] total." },
  { id: 13, category: "Operations", title: "Service Level Agreement (SLA)", clarity: "Uptime guarantees.", content: "SERVICE LEVEL AGREEMENT\n\n1. AVAILABILITY. [99.9]% uptime target.\n2. SUPPORT hours: [9am-5pm].\n3. CREDITS. [5]% fee reduction per [X] hours of unplanned downtime." },
  { id: 14, category: "Operations", title: "Disaster Recovery Plan", clarity: "What happens when things break.", content: "DISASTER RECOVERY PLAN\n\n1. BACKUPS. Full system snapshots every [24] hours.\n2. FAILOVER. Switch to [AWS Region B] if [Region A] fails.\n3. RECOVERY. Target RTO is [4] hours." },
  { id: 15, category: "Operations", title: "Vendor Onboarding Policy", clarity: "Vetting external nodes.", content: "VENDOR ONBOARDING POLICY\n\n1. SECURITY. All vendors must provide SOC2 or ISO certificates.\n2. DATA. Must sign a Data Processing Addendum (DPA).\n3. INSURANCE. Minimum liability of $[1,000,000] required." },
  { id: 16, category: "Operations", title: "Health & Safety Policy", clarity: "Safe environment logic.", content: "HEALTH & SAFETY POLICY\n\n1. RESPONSIBILITY. Every Node is responsible for maintaining a hazard-free zone.\n2. INCIDENTS. Report all injuries within [24] hours.\n3. FIRE. Annual drills are mandatory." },

  // COMPLIANCE
  { id: 17, category: "Compliance", title: "Privacy & Data Policy", clarity: "Handling digital DNA.", content: "PRIVACY & DATA POLICY\n\n1. DATA COLLECTED. [Email, IP, Name].\n2. STORAGE. Encrypted via AES-256.\n3. THIRD PARTIES. Data never sold; only shared with [AWS/Stripe] for ops.\n4. YOUR RIGHTS. Request deletion via [Email Address]." },
  { id: 18, category: "Compliance", title: "Anti-Money Laundering (AML)", clarity: "Vetting capital sources.", content: "AML & KYC POLICY\n\n1. VERIFICATION. Proof of identity and address required for all transactions over $[X].\n2. SANCTIONS. All nodes checked against OFAC/HMT lists.\n3. REPORTING. Suspicious activity reported to [Regulator]." },
  { id: 19, category: "Compliance", title: "Whistleblower Policy", clarity: "Protection for internal reports.", content: "WHISTLEBLOWER POLICY\n\n1. NON-RETALIATION. No Node will be punished for reporting unethical logic.\n2. ANONYMITY. Reports can be made via [Encrypted Portal].\n3. INVESTIGATION. Conducted by [Compliance Officer]." },
  { id: 20, category: "Compliance", title: "Risk Register", clarity: "Tracking threats.", content: "RISK REGISTER\n\n1. RISK: [Cyber Attack]. IMPACT: High. OWNER: CTO.\n2. RISK: [Regulatory Change]. IMPACT: Medium. OWNER: CEO.\n3. RISK: [Supply Chain]. IMPACT: Low. OWNER: COO." },
  { id: 21, category: "Compliance", title: "Accessibility Statement", clarity: "Digital inclusivity.", content: "ACCESSIBILITY STATEMENT\n\n1. STANDARD. We aim for WCAG 2.1 Level AA compliance.\n2. FEEDBACK. Contact [Name] if you encounter digital barriers.\n3. TIMELINE. Continuous auditing and updates." },

  // FINANCE
  { id: 22, category: "Finance", title: "Professional Invoice", clarity: "Capital transfer request.", content: "INVOICE # [001]\n\nDATE: [Current Date]\nFOR: [Service Name]\nTOTAL DUE: $[Amount]\nPAYMENT: [Bank Details]." },
  { id: 23, category: "Finance", title: "Equity Option Grant", clarity: "Employee incentives.", content: "STOCK OPTION GRANT\n\n1. UNITS. [Number] options granted.\n2. STRIKE PRICE. $[Price] per share.\n3. VESTING. [1] year cliff, then monthly over [36] months." },
  { id: 24, category: "Finance", title: "Investor Update Template", clarity: "Transparency for capital nodes.", content: "INVESTOR UPDATE - [Month/Year]\n\n1. TRACTION. [X]% growth.\n2. REVENUE. $[Amount].\n3. BURN. $[Amount].\n4. RUNWAY. [X] months left.\n5. ASKS. [Specific help needed]." },
  { id: 25, category: "Finance", title: "Budget Forecast", clarity: "12-month fiscal plan.", content: "FISCAL BUDGET\n\nQ1: $[Amount] Dev / $[Amount] Ops.\nQ2: $[Amount] Sales / $[Amount] Marketing.\nREVENUE TARGET: $[Amount] ARR." },
  { id: 26, category: "Finance", title: "Cap Table Framework", clarity: "Ownership ledger.", content: "CAPITALIZATION TABLE\n\nFounder A: [X] shares ([Y]%)\nInvestor 1: [X] shares ([Y]%)\nESOP Pool: [X] shares ([Y]%)" },

  // HR
  { id: 27, category: "HR", title: "Employment Offer Letter", clarity: "Onboarding talent.", content: "OFFER OF EMPLOYMENT\n\nPOSITION: [Title]\nSALARY: $[Amount]\nPROBATION: [6] Months\nBENEFITS: [Health, Pension, PTO]\nSTART: [Date]" },
  { id: 28, category: "HR", title: "Consultancy Agreement", clarity: "External node contract.", content: "CONSULTANCY AGREEMENT\n\n1. STATUS. Independent contractor; not an employee.\n2. FEE. $[Amount] per hour/day.\n3. TERMINATION. [14] days notice by either party." },
  { id: 29, category: "HR", title: "Remote Work Policy", clarity: "Security for remote nodes.", content: "REMOTE WORK POLICY\n\n1. SECURITY. Mandatory VPN and multi-factor authentication.\n2. EQUIPMENT. Provided for work purposes only.\n3. COMMUNICATION. Nodes must be available during [Core Hours]." },
  { id: 30, category: "HR", title: "Code of Ethics", clarity: "Institutional conduct.", content: "CODE OF ETHICS\n\n1. INTEGRITY. Honest communication always.\n2. RESPECT. Zero tolerance for harassment.\n3. COMPLIANCE. Follow all local logic and laws." },

  // SALES & MARKETING
  { id: 31, category: "Sales", title: "Partnership Proposal", clarity: "Growth alliance pitch.", content: "STRATEGIC PARTNERSHIP PROPOSAL\n\n1. OBJECTIVE. Expand [A] into Market [B].\n2. REVENUE SHARE. [20]% commission on leads.\n3. DURATION. [12] month pilot." },
  { id: 32, category: "Marketing", title: "Brand Guidelines", clarity: "Visual logic.", content: "BRAND LOGIC\n\n1. LOGO. Maintain [50px] clear space.\n2. PALETTE. Primary: [#1A1A1A]. Secondary: [#A9B897].\n3. TONE. Institutional, Precise, Minimalist." },
  { id: 33, category: "Marketing", title: "Referral Terms", clarity: "Ecosystem rewards.", content: "REFERRAL PROGRAM TERMS\n\n1. REWARD. $[Amount] per successful signup.\n2. PAYOUT. Paid [30] days after node verification.\n3. FRAUD. Any gaming of logic results in ban." },
  { id: 34, category: "Marketing", title: "Media Release", clarity: "Formal announcements.", content: "FOR IMMEDIATE RELEASE\n\n[HEADLINE: Institution Launches New Node]\n[CITY] — [BODY TEXT: Details of the news].\nCONTACT: [Name/Email]" },

  // ADDITIONAL LOGIC
  { id: 35, category: "Legal", title: "Board Meeting Minutes", clarity: "Recording statutory votes.", content: "MINUTES OF BOARD MEETING\n\nDATE: [Date]\nPRESENT: [Directors Names]\nQUORUM: Confirmed.\nRESOLUTIONS: [1. Approval of Budget, 2. New Hire]." },
  { id: 36, category: "Operations", title: "SOP: Onboarding", clarity: "Standard workflow.", content: "SOP: NODE ONBOARDING\n\n1. ACCOUNT. Create email.\n2. SECURITY. Issue VPN keys.\n3. HANDBOOK. Send logic guide.\n4. MEET. Intro with Lead Node." },
  { id: 37, category: "Finance", title: "Expense Reimbursement", clarity: "Out-of-pocket recovery.", content: "EXPENSE CLAIM FORM\n\nITEM: [Travel/Software]\nCOST: $[Amount]\nPROJECT: [Name]\nRECEIPT: [Attached Status]" },
  { id: 38, category: "Compliance", title: "Due Diligence Checklist", clarity: "Audit gate.", content: "DUE DILIGENCE CHECKLIST\n\n[ ] Corporate Documents\n[ ] Intellectual Property Deeds\n[ ] Financial Audits\n[ ] HR Compliance" },
  { id: 39, category: "Legal", title: "Software Escrow", clarity: "Code safety.", content: "ESCROW DEED\nSource code is held by [Agent] and released only if [Conditions]." },
  { id: 40, category: "Finance", title: "Purchase Order (PO)", clarity: "Spend authorization.", content: "PURCHASE ORDER # [001]\nVENDOR: [Name]\nITEMS: [List]\nTOTAL: $[Amount]" },
  { id: 41, category: "Compliance", title: "Open Source Disclosure", clarity: "3rd party logic list.", content: "OSS DISCLOSURE\n[Package A] - MIT License\n[Package B] - Apache 2.0" },
  { id: 42, category: "HR", title: "Performance Review", clarity: "Appraisal logic.", content: "NODE PERFORMANCE REVIEW\nACHIEVEMENTS: [List]\nAREAS FOR GROWTH: [List]\nTARGETS: [Next 6 Months]" },
  { id: 43, category: "Operations", title: "Incident Report", clarity: "Error logging.", content: "INCIDENT REPORT\nDATE: [Date]\nERROR: [Description]\nRESOLUTION: [Action Taken]" }
];

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
    setTimeout(() => {
      let updated = editableContent;
      if (aiPrompt.toLowerCase().includes("payment")) updated = updated.replace(/\[30\]/g, "[60]");
      if (aiPrompt.toLowerCase().includes("ai")) updated += "\n\n[CLAUSE] Nodes must not feed this logic into LLMs.";
      setEditableContent(updated + `\n\n[AI LOG: ${aiPrompt}]`);
      setAiPrompt("");
      setIsAiLoading(false);
    }, 600);
  };

  const downloadPDF = async () => {
    const element = printRef.current;
    if (!element) return;
    const canvas = await html2canvas(element, { scale: 2 });
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, (canvas.height * 210) / canvas.width);
    pdf.save(`${selectedDoc.title}.pdf`);
  };

  const categories = Array.from(new Set(DOCUMENTS.map(d => d.category)));

  return (
    <Page title="">
      <div className="min-h-screen bg-[#ecebe6] p-6 md:p-16">
        
        {/* DISCLAIMER BANNER */}
        <div className="max-w-[1300px] mx-auto mb-10 bg-white border border-stone-200 p-8 rounded-[2.5rem] flex items-center gap-6 shadow-sm">
           <AlertCircle size={24} className="text-red-500" />
           <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
             <span className="text-stone-900 block mb-1 underline">Institutional Disclaimer</span>
             Templates are for reference logic only. Not legal advice. Use at your own risk.
           </p>
        </div>

        <div className="max-w-[1300px] mx-auto space-y-16 pb-32">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="space-y-6">
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-red-400 flex items-center gap-3">
                <Lock size={14} strokeWidth={3} /> Institutional Vault
              </p>
              <h1 className="text-8xl font-serif italic text-stone-900 tracking-tighter leading-[0.85]">Archive <br /> Logic</h1>
            </div>

            <div className="mt-8 bg-white border border-stone-100 p-8 rounded-[3.5rem] shadow-xl flex flex-col gap-4 min-w-[340px]">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3"><MapPin size={20} className="text-[#a9b897]" /><p className="text-[10px] font-black uppercase tracking-widest text-stone-300">Jurisdiction</p></div>
                  <div className="flex gap-2">
                    {["UK", "US"].map((k) => (
                      <button key={k} onClick={() => setRegion(k)} className={`px-4 py-1.5 text-[10px] font-black rounded-full transition-all ${region === k ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-400'}`}>{k}</button>
                    ))}
                  </div>
               </div>
               <p className="text-2xl font-serif italic text-stone-800">{GEO_SIGNPOSTS[region].label} Portal</p>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* FOLDER EXPLORER */}
            <div className="lg:col-span-8 space-y-4">
              <div className="relative mb-8">
                <Search size={20} className="absolute left-8 top-1/2 -translate-y-1/2 text-stone-300" />
                <input placeholder="Search 43 Frameworks..." className="w-full pl-20 pr-10 py-8 bg-white border border-stone-100 rounded-[3rem] text-lg font-serif italic shadow-sm focus:shadow-xl outline-none" onChange={(e) => setSearchTerm(e.target.value)} />
              </div>

              {categories.map((cat) => {
                const docs = DOCUMENTS.filter(d => d.category === cat && d.title.toLowerCase().includes(searchTerm.toLowerCase()));
                if (docs.length === 0) return null;
                return (
                  <div key={cat} className="bg-white rounded-[2.5rem] border border-stone-50 shadow-sm overflow-hidden">
                    <button onClick={() => toggleFolder(cat)} className="w-full flex items-center justify-between p-10 hover:bg-stone-50 transition-colors">
                      <div className="flex items-center gap-6">
                        <div className="p-4 bg-stone-100 rounded-2xl text-stone-400"><Folder size={24} fill="currentColor" /></div>
                        <h3 className="text-2xl font-serif italic text-stone-900">{cat}</h3>
                      </div>
                      <ChevronDown size={24} className={`text-stone-300 transition-transform ${expandedFolders.includes(cat) ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedFolders.includes(cat) && (
                      <div className="px-10 pb-10 space-y-2">
                        {docs.map((doc) => (
                          <div key={doc.id} onClick={() => setSelectedDoc(doc)} className="group flex items-center justify-between p-6 rounded-3xl hover:bg-stone-50 cursor-pointer transition-all">
                            <p className="text-lg font-medium text-stone-600 group-hover:text-stone-900">{doc.title}</p>
                            <ArrowUpRight size={20} className="text-stone-300 group-hover:text-[#a9b897] transition-all" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* SIGNPOSTS */}
            <div className="lg:col-span-4 space-y-6">
              {GEO_SIGNPOSTS[region].links.map((link, i) => (
                <a key={i} href={link.url} target="_blank" className="block bg-white p-10 rounded-[3rem] border border-stone-100 hover:shadow-2xl transition-all group">
                  <ExternalLink size={20} className="mb-6 text-stone-300 group-hover:text-[#a9b897]" />
                  <h4 className="text-xl font-serif italic text-stone-900 mb-2">{link.name}</h4>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{link.desc}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL EDITOR */}
      {selectedDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/90 backdrop-blur-xl" onClick={() => setSelectedDoc(null)} />
          <div className="relative bg-white w-full max-w-7xl h-[94vh] rounded-[4rem] shadow-2xl overflow-hidden flex flex-col md:flex-row">
            <div className="w-full md:w-[380px] border-r border-stone-100 bg-stone-50 p-12 flex flex-col gap-10">
              <div className="p-8 bg-white border border-stone-200 rounded-[2.5rem] shadow-sm">
                <div className="flex items-center gap-3 text-[#a9b897] mb-4"><Lightbulb size={24} /> <h4 className="text-[11px] font-black uppercase">Clarity Gate</h4></div>
                <p className="text-sm font-serif italic text-stone-600 leading-relaxed">{selectedDoc.clarity}</p>
              </div>
              <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="e.g. 'Add AI Clause'" className="w-full bg-white border border-stone-200 p-6 rounded-3xl text-xs min-h-[160px] outline-none shadow-inner" />
              <button onClick={handleAiCommand} className="w-full py-6 bg-stone-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#a9b897] transition-all">
                {isAiLoading ? "Processing..." : <><Zap size={16} fill="currentColor" /> Update Logic</>}
              </button>
            </div>
            <div className="flex-1 flex flex-col bg-white">
               <div className="p-10 border-b border-stone-50 flex justify-between items-center">
                  <h2 className="text-4xl font-serif italic text-stone-800">{selectedDoc.title}</h2>
                  <div className="flex gap-4">
                    <button onClick={downloadPDF} className="p-5 bg-stone-900 text-white rounded-3xl"><Download size={24} /></button>
                    <button onClick={() => setSelectedDoc(null)} className="p-5 bg-stone-100 text-stone-400 rounded-3xl hover:text-red-500"><X size={24} /></button>
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto p-12 bg-stone-100/20 scrollbar-hide">
                  <div ref={printRef} className="bg-white p-20 shadow-2xl min-h-[1000px] font-serif text-stone-900 leading-[1.8] max-w-[210mm] mx-auto">
                    <textarea value={editableContent} onChange={(e) => setEditableContent(e.target.value)} className="w-full h-full min-h-[800px] bg-transparent outline-none resize-none text-xl italic" spellCheck="false" />
                    <div className="mt-20 pt-16 border-t border-stone-100 flex justify-between italic text-stone-300">
                      <span>Signature: ____________________</span>
                      <span>Date: ____________________</span>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}