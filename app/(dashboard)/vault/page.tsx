"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { 
  Search, X, Download, Folder, ChevronDown, 
  Lightbulb, Zap, FileText, Sparkles, Rss, Mail, 
  DollarSign, Users, ShieldCheck, Activity, Globe,
  Cpu, Database, CloudLightning, Filter,
  Minimize2, Share2, MessageSquare, Heart, Bookmark,
  Info, AlertTriangle, Eye, EyeOff, Terminal, Command,
  Hash, ArrowUpRight, Target, Workflow, Briefcase,
  Layers, ChevronRight, MoreVertical, Edit2, Trash2,
  RefreshCw, Lock, HardDrive, Settings, Calendar, 
  PieChart, BarChart3, TrendingUp, Layers3, Fingerprint,
  Radio, HardDriveDownload, Box, LayoutGrid
} from "lucide-react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * SECTION 1: ARCHITECTURAL TYPE DEFINITIONS
 * Building the type safety layer for the Vault Ecosystem.
 */

type SystemCategory = 
  | "Legal & Governance" 
  | "Operations" 
  | "Sales & Marketing" 
  | "Onboarding & CRM" 
  | "Products & Packs" 
  | "Finance"
  | "Archived Nodes";

type ClarityLevel = "High" | "Medium" | "Low" | "Diagnostic";

interface DocMetadata {
  lastUpdated: string;
  version: string;
  author: string;
  complianceScore: number;
  integrityHash: string;
}

interface VaultDocument {
  id: number;
  title: string;
  category: SystemCategory;
  content: string;
  clarity: string;
  clarityLevel: ClarityLevel;
  tags: string[];
  metadata: DocMetadata;
}

interface SystemStat {
  id: string;
  label: string;
  val: string;
  trend: string;
  icon: any;
  color: string;
}

interface CommandLog {
  id: string;
  timestamp: string;
  command: string;
  status: "success" | "processing" | "error";
}

/**
 * SECTION 2: THE REPOSITORY (EXPANDED TO 20+ DOCUMENT NODES)
 */

const VAULT_DATA: VaultDocument[] = [
  { 
    id: 1, 
    title: "Client Intake System", 
    category: "Onboarding & CRM", 
    clarity: "Onboarding & Workflow Engine",
    clarityLevel: "High",
    tags: ["CRM", "Onboarding", "Workflow"],
    metadata: { lastUpdated: "2026-05-01", version: "2.1.0", author: "TOTS Core", complianceScore: 98, integrityHash: "0x882" },
    content: `CLIENT ONBOARDING SYSTEM\n\n📄 Intake Form\nName: [Client Name]\nBusiness: [Business Name]\nService purchased: [Service Name]\nStart date: [YYYY-MM-DD]\n\n⚙️ Workflow\n[ ] New client created\n[ ] Send welcome email\n[ ] Send contract + invoice\n[ ] Create project board\n[ ] Book kickoff call\n\n✉️ Template\nHi [Name],\nGreat to have you onboard.\nFollow this link to book your call: [link]`
  },
  { 
    id: 2, 
    title: "Sales Pipeline & Scripting", 
    category: "Sales & Marketing", 
    clarity: "Pipeline & Follow-ups",
    clarityLevel: "High",
    tags: ["Sales", "Growth", "Scripts"],
    metadata: { lastUpdated: "2026-04-15", version: "1.4.2", author: "Sam G.", complianceScore: 92, integrityHash: "0x441" },
    content: `SALES PIPELINE SYSTEM\n\n📊 Stages\n- New Lead\n- Contacted\n- Qualified\n- Proposal Sent\n- Negotiation\n- Won/Lost\n\n📞 Structure\n- Current situation:\n- Problems / bottlenecks:\n- Impact:\n- Desired outcome:\n- Gap:\n- Offer:`
  },
  {
    id: 3,
    title: "Business Audit Framework",
    category: "Operations",
    clarity: "Diagnostic Blueprint",
    clarityLevel: "Diagnostic",
    tags: ["Audit", "Operations", "Efficiency"],
    metadata: { lastUpdated: "2026-05-05", version: "3.0.0", author: "TOTS Strategy", complianceScore: 100, integrityHash: "0x112" },
    content: `BUSINESS AUDIT TEMPLATE\n\n1. Operations\n- Task tracking?\n- Delay points?\n\n2. Sales\n- Lead gen?\n- Conversion %?\n\n3. Clients\n- Onboarding?\n- Retention?\n\n4. Finance\n- Revenue:\n- Profit clarity?`
  },
  {
    id: 4,
    title: "Content Marketing System",
    category: "Sales & Marketing",
    clarity: "Systemised Content Planning",
    clarityLevel: "Medium",
    tags: ["Marketing", "Social", "Plan"],
    metadata: { lastUpdated: "2026-03-20", version: "1.1.0", author: "Content Node", complianceScore: 85, integrityHash: "0x992" },
    content: `CONTENT SYSTEM\n\nPlan\n- 2x authority posts\n- 2x problem posts\n- 1x offer post\n\nHooks\n- "If your business relies on you, read this"\n- "You don't need more clients, you need this"`
  },
  {
    id: 5,
    title: "Process / SOP Builder",
    category: "Operations",
    clarity: "Standardisation template",
    clarityLevel: "High",
    tags: ["SOP", "Efficiency", "Standardization"],
    metadata: { lastUpdated: "2026-01-10", version: "2.0.1", author: "Ops Lead", complianceScore: 99, integrityHash: "0x554" },
    content: `SOP TEMPLATE\n\nTITLE: [Process Name]\n\nPURPOSE:\nWhat this achieves\n\nSTEPS:\n1. \n2. \n3.\n\nTOOLS:\n• TOTS OS\n• Email`
  },
  {
    id: 6,
    title: "Weekly Executive Dashboard",
    category: "Operations",
    clarity: "Administrative tracker",
    clarityLevel: "High",
    tags: ["CEO", "Reporting", "Metrics"],
    metadata: { lastUpdated: "2026-05-08", version: "4.0.0", author: "Admin Node", complianceScore: 95, integrityHash: "0x223" },
    content: `WEEKLY CEO DASHBOARD\n\nTrack:\n- Revenue this week\n- Deals in pipeline\n- Tasks overdue\n- Clients at risk\n- Time spent on admin`
  },
  {
    id: 7,
    title: "Offer Creation Blueprint",
    category: "Sales & Marketing",
    clarity: "Value-focused positioning",
    clarityLevel: "Medium",
    tags: ["Product", "Sales", "Strategy"],
    metadata: { lastUpdated: "2026-04-02", version: "1.0.5", author: "Strategy Hub", complianceScore: 88, integrityHash: "0x771" },
    content: `OFFER CREATION TEMPLATE\n\nProblem: \nCurrent solution:\nYour solution:\nOutcome:\nPrice:\nDelivery:`
  },
  {
    id: 8,
    title: "Service Business OS Starter",
    category: "Products & Packs",
    clarity: "High Value Product Suite",
    clarityLevel: "High",
    tags: ["Productization", "Systems", "Starter"],
    metadata: { lastUpdated: "2026-05-01", version: "5.1.0", author: "TOTS Lab", complianceScore: 97, integrityHash: "0x889" },
    content: `SERVICE BUSINESS PACK\n\nBundle:\n- Onboarding\n- Sales pipeline\n- SOP pack\n- Dashboard\n- Finance tracker`
  },
  {
    id: 9,
    title: "Terms & Conditions Builder",
    category: "Legal & Governance",
    clarity: "T&Cs Builder System",
    clarityLevel: "High",
    tags: ["Legal", "Contract", "Compliance"],
    metadata: { lastUpdated: "2026-05-09", version: "3.2.0", author: "Legal Node", complianceScore: 100, integrityHash: "0xLegal" },
    content: `BUSINESS LEGAL FOUNDATIONS - T&Cs\n\n⚠️ MASTER DISCLAIMER\nFramework only. Consult a solicitor.\n\n1. Introduction\nAgreement between [Business] and [Client].\n\n2. Scope\nDelivery of: [Work]`
  },
  {
    id: 10,
    title: "GDPR-Friendly Privacy Policy",
    category: "Legal & Governance",
    clarity: "Data compliance builder",
    clarityLevel: "High",
    tags: ["Legal", "GDPR", "Data"],
    metadata: { lastUpdated: "2026-05-09", version: "2.1.0", author: "Legal Node", complianceScore: 100, integrityHash: "0xPrivacy" },
    content: `PRIVACY POLICY\n\n1. Overview\nData protection commitment.\n\n2. Data Collected\n- Name\n- Email\n- Payments`
  },
  {
    id: 11,
    title: "Client Contract Agreement",
    category: "Legal & Governance",
    clarity: "Legal and project contract",
    clarityLevel: "High",
    tags: ["Legal", "Retainer", "Agreement"],
    metadata: { lastUpdated: "2026-05-09", version: "2.5.0", author: "Legal Node", complianceScore: 100, integrityHash: "0xContract" },
    content: `CLIENT AGREEMENT\n\nProject Details\nService: [Insert]\nStart Date: [Insert]\n\nDeliverables\n1. [X]\n2. [Y]`
  },
  {
    id: 12,
    title: "Payment & Disclaimer Module",
    category: "Legal & Governance",
    clarity: "Policy and modules",
    clarityLevel: "Medium",
    tags: ["Legal", "Finance", "Policy"],
    metadata: { lastUpdated: "2026-05-09", version: "1.0.0", author: "Legal Node", complianceScore: 100, integrityHash: "0xPolicy" },
    content: `POLICIES & DISCLAIMERS\n\n1. Payment Terms\n- 7 day terms.\n- Late fees apply.\n\n2. Disclaimer\nBusiness guidance only.`
  },
  {
    id: 13,
    title: "Profit & Loss Forecaster",
    category: "Finance",
    clarity: "Financial projection node",
    clarityLevel: "High",
    tags: ["Finance", "Forecasting", "Profit"],
    metadata: { lastUpdated: "2026-05-07", version: "1.2.0", author: "Finance Node", complianceScore: 94, integrityHash: "0xFinance" },
    content: `P&L FORECASTER\n\nMonthly Input:\n- Projected Revenue\n- Fixed Costs\n- Variable Costs\n\nFormula:\nMargin = (Revenue - Total Costs) / Revenue`
  },
  {
    id: 14,
    title: "Expense Optimization Tool",
    category: "Finance",
    clarity: "Cost reduction framework",
    clarityLevel: "Medium",
    tags: ["Finance", "Expenses", "Optimization"],
    metadata: { lastUpdated: "2026-05-02", version: "1.0.1", author: "Finance Node", complianceScore: 91, integrityHash: "0xExpOpt" },
    content: `EXPENSE OPTIMIZER\n\n1. Identify Fixed Costs\n2. Identify Variable Costs\n3. ROI Calculation per Tool`
  },
  {
    id: 15,
    title: "Employee Onboarding SOP",
    category: "Onboarding & CRM",
    clarity: "Team scaling node",
    clarityLevel: "High",
    tags: ["Team", "Onboarding", "HR"],
    metadata: { lastUpdated: "2026-04-30", version: "2.2.0", author: "HR Node", complianceScore: 99, integrityHash: "0xHR001" },
    content: `TEAM ONBOARDING\n\nDay 1: System access setup\nDay 2: Protocol walkthrough\nDay 3: Role-specific training`
  },
  {
    id: 16,
    title: "High-Ticket Sales Script",
    category: "Sales & Marketing",
    clarity: "Conversion focused script",
    clarityLevel: "High",
    tags: ["Sales", "Scripts", "Strategy"],
    metadata: { lastUpdated: "2026-05-09", version: "3.5.0", author: "Sales Lead", complianceScore: 96, integrityHash: "0xScriptX" },
    content: `HIGHTICKET SCRIPT\n\nIntake Questions:\n1. Why now?\n2. What happens if you don't solve this?`
  },
  {
    id: 17,
    title: "Legacy Project Archive",
    category: "Archived Nodes",
    clarity: "Historical data storage",
    clarityLevel: "Low",
    tags: ["Archive", "History", "Legacy"],
    metadata: { lastUpdated: "2024-12-31", version: "0.0.1", author: "System", complianceScore: 70, integrityHash: "0xOldData" },
    content: `ARCHIVED DATA NODE\n\nHistorical records from FY2024.\nReadOnly mode enabled.`
  }
];

/**
 * SECTION 3: REUSABLE SYSTEM COMPONENTS
 */

const StatCard = ({ stat }: { stat: SystemStat }) => (
  <motion.div 
    whileHover={{ y: -10, scale: 1.03 }}
    whileTap={{ scale: 0.98 }}
    className="bg-white p-6 md:p-10 rounded-[3rem] border border-stone-100 shadow-sm flex items-center justify-between group transition-all duration-500 hover:shadow-2xl hover:border-[#a9b897]/20"
  >
    <div className="space-y-3">
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 block group-hover:text-[#a9b897] transition-colors">
        {stat.label}
      </span>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl md:text-5xl font-serif italic text-stone-900 leading-none">{stat.val}</span>
        {stat.trend && (
          <span className="text-[10px] text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full border border-green-100">{stat.trend}</span>
        )}
      </div>
    </div>
    <div className={`p-5 bg-${stat.color}-50 text-${stat.color}-600 rounded-[2rem] group-hover:rotate-[15deg] transition-transform duration-500 shadow-inner`}>
      <stat.icon size={28} />
    </div>
  </motion.div>
);

const Badge = ({ children, color = "stone" }: { children: React.ReactNode; color?: string }) => (
  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-${color}-50 text-${color}-600 border border-${color}-100 shadow-sm whitespace-nowrap`}>
    {children}
  </span>
);

/**
 * SECTION 4: GLOBAL VAULT ENGINE
 */

export default function GlobalVaultSystem() {
  // --- STATE PERSISTENCE ---
  const [selectedDoc, setSelectedDoc] = useState<VaultDocument | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [editableContent, setEditableContent] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [installationMessage, setInstallationMessage] = useState<string | null>(null);
  const [installProgress, setInstallProgress] = useState(0);
  const [expandedFolders, setExpandedFolders] = useState<string[]>(["Legal & Governance", "Operations", "Finance", "Onboarding & CRM"]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [commandHistory, setCommandHistory] = useState<CommandLog[]>([]);
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [systemUptime, setSystemUptime] = useState(0);

  // --- REFS & ANIMATION ---
  const printRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  // --- SYSTEM UPTIME TICKER ---
  useEffect(() => {
    const timer = setInterval(() => setSystemUptime(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- LIFECYCLE ---
  useEffect(() => {
    if (selectedDoc) {
      setEditableContent(selectedDoc.content);
      addCommandLog(`Loaded node: ${selectedDoc.title}`);
    }
  }, [selectedDoc]);

  // --- UTILITY LOGIC ---
  const addCommandLog = (cmd: string) => {
    const newLog: CommandLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      command: cmd,
      status: "success"
    };
    setCommandHistory(prev => [newLog, ...prev].slice(0, 10));
  };

  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => 
      prev.includes(folder) ? prev.filter(f => f !== folder) : [...prev, folder]
    );
  };

  const filteredDocs = useMemo(() => {
    return VAULT_DATA.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            doc.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCat = activeCategory ? doc.category === activeCategory : true;
      return matchesSearch && matchesCat;
    });
  }, [searchTerm, activeCategory]);

  const categories = useMemo(() => Array.from(new Set(VAULT_DATA.map(d => d.category))), []);

  // --- HANDLERS: SYSTEM OPERATIONS ---
  const runInstallation = async () => {
    setInstallationMessage("Initializing Architectural Sync...");
    for (let i = 0; i <= 100; i += 4) {
      setInstallProgress(i);
      await new Promise(r => setTimeout(r, 80));
      if (i === 32) setInstallationMessage("Updating Governance Ledger...");
      if (i === 64) setInstallationMessage("Rebuilding Component Bridges...");
      if (i === 92) setInstallationMessage("Finalizing Neural Handshake...");
    }
    addCommandLog("Global System Synchronization: OK");
    setTimeout(() => {
      setInstallationMessage(null);
      setInstallProgress(0);
    }, 1500);
  };

  const runDiagnostics = async () => {
    setIsDiagnosticRunning(true);
    addCommandLog("Starting Integrity Audit...");
    await new Promise(r => setTimeout(r, 2500));
    addCommandLog("Audit Complete: No corruption detected.");
    setIsDiagnosticRunning(false);
  };

  const handleAiSynthesis = async () => {
    if (!aiPrompt) return;
    setIsAiLoading(true);
    addCommandLog(`Neural Synthesis: ${aiPrompt.substring(0, 30)}...`);
    await new Promise(r => setTimeout(r, 2000));
    setEditableContent(prev => prev + `\n\n--- ⚡ TOTS AI SYNTHESIS [v4.1.0] ---\nProtocol: ${aiPrompt}\nOutcome: Optimized logic applied to current node structure.`);
    setAiPrompt("");
    setIsAiLoading(false);
    addCommandLog("Node optimization successfully committed.");
  };

  const exportPDF = async () => {
    if (!printRef.current || !selectedDoc) return;
    addCommandLog("Generating high-fidelity PDF output...");
    const canvas = await html2canvas(printRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`TOTS_Asset_${selectedDoc.id}.pdf`);
    addCommandLog(`Document Exported: ${selectedDoc.title}`);
  };

  /**
   * SECTION 5: RENDER ARCHITECTURE
   */

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 selection:bg-[#a9b897] selection:text-white font-sans overflow-x-hidden">
      
      {/* 5.1: OVERLAYS & GLOBAL HUD */}
      <motion.div className="fixed top-0 left-0 right-0 h-1.5 bg-[#a9b897] z-[1000] origin-left" style={{ scaleX }} />

      <AnimatePresence>
        {installationMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -150, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -150, scale: 0.9 }}
            className="fixed top-12 left-1/2 -translate-x-1/2 z-[1100] w-[95%] max-w-xl"
          >
            <div className="bg-stone-900 text-white p-10 rounded-[3rem] shadow-[0_60px_100px_rgba(0,0,0,0.4)] border border-stone-800 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-[#a9b897] rounded-full flex items-center justify-center text-stone-900 shadow-xl shadow-[#a9b897]/10">
                    <Sparkles size={28} className="animate-pulse" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/40 mb-1">System Pipeline v4.0</p>
                    <p className="text-lg font-serif italic text-stone-200">{installationMessage}</p>
                  </div>
                </div>
                <span className="text-4xl font-serif italic text-[#a9b897]">{installProgress}%</span>
              </div>
              <div className="h-2 w-full bg-stone-800 rounded-full overflow-hidden border border-white/5">
                <motion.div initial={{ width: 0 }} animate={{ width: `${installProgress}%` }} className="h-full bg-[#a9b897] shadow-[0_0_20px_#a9b897]" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1800px] mx-auto px-6 md:px-16 lg:px-32 py-16 lg:py-28 space-y-24">
        
        {/* 5.2: PRIMARY HEADER SECTION */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-16 border-b border-stone-200 pb-24">
          <motion.div initial={{ opacity: 0, x: -80 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-stone-900 rounded-[1.5rem] text-white shadow-2xl shadow-stone-900/30">
                <Fingerprint size={32} />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-black uppercase tracking-[0.5em] text-stone-400">Restricted Access // Tier 1</p>
                <div className="flex items-center gap-3">
                   <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_green]" />
                   <p className="text-[10px] font-mono uppercase text-stone-500 tracking-tighter">System Uptime: {Math.floor(systemUptime / 60)}m {systemUptime % 60}s</p>
                </div>
              </div>
            </div>
            <h1 className="text-7xl md:text-[10rem] font-serif italic tracking-tighter leading-none">
              The <span className="text-stone-300">Vault</span>
            </h1>
            <p className="text-stone-400 max-w-2xl italic leading-relaxed text-xl md:text-2xl font-serif">
              A private archival environment for high-fidelity business systems, legal frameworks, and neural operational nodes.
            </p>
          </motion.div>

          <div className="flex flex-wrap gap-5 w-full xl:w-auto">
            <motion.button 
              whileHover={{ scale: 1.05, backgroundColor: "#000", color: "#fff" }}
              whileTap={{ scale: 0.95 }}
              onClick={runDiagnostics}
              disabled={isDiagnosticRunning}
              className="px-10 py-6 border-2 border-stone-200 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 disabled:opacity-50"
            >
              <Activity size={18} className={isDiagnosticRunning ? "animate-spin" : ""} /> {isDiagnosticRunning ? "Performing Audit..." : "Integrity Scan"}
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05, y: -8 }}
              whileTap={{ scale: 0.95 }}
              onClick={runInstallation}
              className="px-12 py-6 bg-[#a9b897] text-stone-900 rounded-[2rem] font-black text-[11px] tracking-[0.2em] uppercase hover:shadow-[0_30px_60px_rgba(169,184,151,0.4)] transition-all flex items-center justify-center gap-5"
            >
              <Radio size={20} className="animate-bounce" /> Sync Infrastructure
            </motion.button>
          </div>
        </header>

        {/* 5.3: SYSTEM MONITORING GRID */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <StatCard stat={{ id: "s1", label: "Global Reach", val: "1.24M", trend: "+12.4%", icon: Globe, color: "purple" }} />
          <StatCard stat={{ id: "s2", label: "System Health", val: "99.8%", trend: "Stable", icon: ShieldCheck, color: "blue" }} />
          <StatCard stat={{ id: "s3", label: "Monthly Profit", val: "£84.2K", trend: "+24%", icon: TrendingUp, color: "green" }} />
          <StatCard stat={{ id: "s4", label: "Archived Nodes", val: "402", trend: "", icon: HardDriveDownload, color: "stone" }} />
        </section>

        {/* 5.4: PRIMARY INTERFACE HUB */}
        <div className="grid grid-cols-12 gap-12 lg:gap-24 items-start">
          
          {/* 5.4.1: NAVIGATION COLUMN (THE ARCHIVE SIDEBAR) */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.aside 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="col-span-12 lg:col-span-4 space-y-16"
              >
                {/* Advanced Search Component */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-[#a9b897]/5 rounded-[3rem] blur-3xl group-focus-within:bg-[#a9b897]/10 transition-all" />
                  <div className="relative">
                    <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-stone-900 transition-colors" size={24} />
                    <input 
                      className="w-full p-10 pl-20 bg-white border border-stone-200 rounded-[3rem] outline-none focus:ring-[24px] focus:ring-stone-900/5 transition-all text-base font-semibold placeholder:text-stone-300 shadow-sm" 
                      placeholder="Traverse the archive..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                  </div>
                </div>

                {/* Directory Navigation Engine */}
                <div className="space-y-10">
                  <div className="flex justify-between items-center px-8">
                    <div className="space-y-1">
                      <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-stone-400">Master Directory</h3>
                      <p className="text-[9px] font-mono text-stone-300">{filteredDocs.length} Nodes Found</p>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-stone-900 text-white' : 'text-stone-300'}`}><LayoutGrid size={16}/></button>
                      <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-stone-900 text-white' : 'text-stone-300'}`}><Layers3 size={16}/></button>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {categories.map((cat) => (
                      <div key={cat} className="bg-white border border-stone-100 rounded-[3.5rem] overflow-hidden shadow-sm transition-all duration-500 hover:shadow-2xl">
                        <button 
                          onClick={() => toggleFolder(cat)}
                          className={`w-full flex justify-between items-center p-10 text-[12px] font-black uppercase tracking-widest transition-all ${
                            expandedFolders.includes(cat) ? "text-stone-900 bg-stone-50" : "text-stone-400 hover:bg-stone-50"
                          }`}
                        >
                          <div className="flex items-center gap-6">
                            <Folder size={20} className={expandedFolders.includes(cat) ? "text-[#a9b897]" : "text-stone-200"} />
                            <span>{cat}</span>
                          </div>
                          <ChevronDown size={18} className={`transition-transform duration-700 ${expandedFolders.includes(cat) ? "rotate-180" : ""}`} />
                        </button>

                        <AnimatePresence>
                          {expandedFolders.includes(cat) && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="bg-stone-50/30 p-8 space-y-4 border-t border-stone-50"
                            >
                              {filteredDocs.filter(d => d.category === cat).map(doc => (
                                <button 
                                  key={doc.id} 
                                  onClick={() => setSelectedDoc(doc)}
                                  className={`w-full text-left p-8 rounded-[2.5rem] transition-all group border-2 ${
                                    selectedDoc?.id === doc.id 
                                      ? "bg-stone-900 border-stone-900 text-white shadow-2xl translate-x-4" 
                                      : "bg-white border-transparent hover:border-stone-100 hover:shadow-lg"
                                  }`}
                                >
                                  <div className="flex items-center gap-5 mb-3">
                                    <FileText size={18} className={selectedDoc?.id === doc.id ? "text-[#a9b897]" : "text-stone-200 group-hover:text-stone-900"} />
                                    <span className="text-sm font-bold tracking-tight">{doc.title}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <p className={`text-[10px] font-mono tracking-wide ${selectedDoc?.id === doc.id ? "text-stone-400" : "text-stone-300"}`}>
                                      ID: NODE_{doc.id.toString().padStart(3, '0')}
                                    </p>
                                    <Badge color={selectedDoc?.id === doc.id ? "green" : "stone"}>{doc.clarityLevel}</Badge>
                                  </div>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>

                {/* THE TERMINAL / SYSTEM LOG */}
                <div className="bg-[#0f0f0f] rounded-[4rem] p-12 text-white space-y-10 relative overflow-hidden group shadow-[0_40px_80px_rgba(0,0,0,0.2)]">
                   <div className="relative z-10 space-y-8">
                      <div className="flex justify-between items-center border-b border-white/10 pb-6">
                        <div className="flex items-center gap-4">
                           <Terminal size={20} className="text-[#a9b897]" />
                           <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/40">Vault Terminal</p>
                        </div>
                        <div className="flex gap-2">
                           <span className="w-2 h-2 rounded-full bg-red-500/50" />
                           <span className="w-2 h-2 rounded-full bg-yellow-500/50" />
                           <span className="w-2 h-2 rounded-full bg-green-500/50" />
                        </div>
                      </div>

                      <div className="space-y-5 font-mono h-[300px] overflow-y-auto custom-scrollbar pr-4">
                         {commandHistory.map((log) => (
                           <div key={log.id} className="space-y-2 border-l-2 border-white/5 pl-6 group/item hover:border-[#a9b897]/40 transition-colors">
                              <div className="flex justify-between items-center">
                                 <span className="text-[9px] text-[#a9b897] font-bold tracking-widest">{log.timestamp}</span>
                                 <span className="text-[8px] bg-white/5 px-2 py-0.5 rounded text-white/30 uppercase">OK</span>
                              </div>
                              <p className="text-[11px] text-white/70 leading-relaxed group-hover/item:text-white transition-colors">{log.command}</p>
                           </div>
                         ))}
                      </div>

                      <div className="pt-6 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-white/30">
                         <p>NODE_STATUS: ACTIVE</p>
                         <p>CORE_USAGE: 14%</p>
                      </div>
                   </div>
                   <div className="absolute top-0 right-0 w-64 h-64 bg-[#a9b897]/5 blur-[100px] rounded-full -mr-32 -mt-32" />
                </div>

                {/* STORAGE ARCHITECTURE WIDGET */}
                <div className="bg-white border-2 border-stone-100 rounded-[4rem] p-12 space-y-10 shadow-sm relative group overflow-hidden">
                   <div className="flex justify-between items-end">
                      <div className="space-y-2">
                         <p className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-400">Local Archive</p>
                         <h4 className="text-4xl font-serif italic text-stone-900">842 GB</h4>
                      </div>
                      <HardDrive size={40} className="text-stone-100 group-hover:text-stone-900 transition-colors duration-700" />
                   </div>
                   <div className="space-y-4">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-stone-500">
                         <span>Allocation</span>
                         <span>92% Full</span>
                      </div>
                      <div className="h-3 w-full bg-stone-50 rounded-full p-1 border border-stone-100">
                         <motion.div 
                           initial={{ width: 0 }} 
                           animate={{ width: "92%" }} 
                           className="h-full bg-stone-900 rounded-full"
                         />
                      </div>
                   </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* 5.4.2: EDITOR & SYSTEM PREVIEW (THE CORE) */}
          <main className={`${isSidebarOpen ? 'col-span-12 lg:col-span-8' : 'col-span-12'} transition-all duration-700`}>
            <AnimatePresence mode="wait">
              {!selectedDoc ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="bg-white border-2 border-dashed border-stone-200 rounded-[5rem] p-20 md:p-40 flex flex-col items-center text-center space-y-16"
                >
                  <div className="p-16 bg-stone-50 rounded-full text-[#a9b897] relative group shadow-inner">
                    <Box size={100} className="group-hover:rotate-12 group-hover:scale-110 transition-transform duration-1000" />
                    <motion.div 
                      animate={{ opacity: [0.1, 0.4, 0.1], scale: [1, 1.4, 1] }} 
                      transition={{ repeat: Infinity, duration: 5 }}
                      className="absolute inset-0 bg-[#a9b897]/20 rounded-full blur-[80px]" 
                    />
                  </div>
                  <div className="max-w-2xl space-y-8">
                    <h3 className="font-serif text-5xl md:text-8xl italic text-stone-900 tracking-tighter leading-none">
                      Initialize <span className="text-stone-300">Node</span>
                    </h3>
                    <p className="text-xl md:text-2xl text-stone-400 leading-relaxed font-serif italic">
                      Traverse the Master Directory and select a categorical system node to engage the high-fidelity editor.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full pt-16">
                    {[
                      { label: "Traversal", desc: "Browse assets.", icon: Radio, color: "stone" },
                      { label: "Synthesis", desc: "Modify logic.", icon: Cpu, color: "green" },
                      { label: "Governance", desc: "Commit node.", icon: ShieldCheck, color: "blue" }
                    ].map((step, i) => (
                      <motion.div 
                        key={i} 
                        whileHover={{ y: -15 }}
                        className="p-12 bg-stone-50 rounded-[4rem] border border-stone-100 flex flex-col items-center space-y-8 group hover:bg-white hover:shadow-2xl transition-all border-b-4 hover:border-b-[#a9b897]"
                      >
                        <div className="p-6 bg-white rounded-[2rem] shadow-sm text-stone-200 group-hover:text-stone-900 transition-colors">
                          <step.icon size={36} />
                        </div>
                        <div className="space-y-3">
                          <p className="text-[12px] font-black uppercase tracking-[0.4em]">{step.label}</p>
                          <p className="text-sm text-stone-400 font-serif italic">{step.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key={selectedDoc.id}
                  layoutId={`doc-${selectedDoc.id}`}
                  className="bg-white rounded-[6rem] p-12 md:p-32 shadow-[0_80px_160px_rgba(0,0,0,0.03)] border border-stone-100 space-y-24"
                >
                  {/* ASSET HEADER ARCHITECTURE */}
                  <div className="flex flex-col xl:flex-row justify-between items-start gap-16">
                    <div className="space-y-10 flex-1">
                      <div className="flex flex-wrap gap-4">
                         <Badge color="stone">{selectedDoc.category}</Badge>
                         <Badge color="green">Branch: v{selectedDoc.metadata.version}</Badge>
                         <Badge color="blue">Handshake: {selectedDoc.metadata.integrityHash}</Badge>
                         <Badge color="purple">Compliance: {selectedDoc.metadata.complianceScore}%</Badge>
                      </div>
                      <h2 className="text-6xl md:text-[10rem] font-serif italic tracking-tighter text-stone-900 leading-[0.85]">
                        {selectedDoc.title}
                      </h2>
                      <div className="flex flex-wrap gap-12 text-[12px] font-mono text-stone-400 uppercase tracking-[0.2em] items-center">
                         <div className="flex items-center gap-4"><Users size={16} className="text-[#a9b897]"/> {selectedDoc.metadata.author}</div>
                         <div className="flex items-center gap-4"><Calendar size={16} className="text-[#a9b897]"/> {selectedDoc.metadata.lastUpdated}</div>
                         <div className="flex items-center gap-4"><Fingerprint size={16} className="text-[#a9b897]"/> SH_256_VERIFIED</div>
                      </div>
                    </div>
                    <div className="flex gap-6">
                      <motion.button whileHover={{ scale: 1.1, y: -5 }} className="p-7 bg-stone-50 rounded-[2.5rem] text-stone-300 hover:text-stone-900 transition-all shadow-sm border border-stone-100"><Bookmark size={28}/></motion.button>
                      <motion.button whileHover={{ scale: 1.1, y: -5 }} className="p-7 bg-stone-50 rounded-[2.5rem] text-stone-300 hover:text-stone-900 transition-all shadow-sm border border-stone-100"><Share2 size={28}/></motion.button>
                      <motion.button whileHover={{ scale: 1.1, rotate: 90 }} onClick={() => setSelectedDoc(null)} className="p-7 bg-stone-900 rounded-[2.5rem] text-white shadow-2xl"><X size={28}/></motion.button>
                    </div>
                  </div>

                  {/* DYNAMIC CONTENT EDITOR NODE */}
                  <div className="relative group">
                    <div className="absolute -top-10 -left-10 w-48 h-48 border-t-4 border-l-4 border-[#a9b897]/10 rounded-tl-[6rem] pointer-events-none transition-all group-hover:scale-110" />
                    <div className="absolute -bottom-10 -right-10 w-48 h-48 border-b-4 border-r-4 border-[#a9b897]/10 rounded-br-[6rem] pointer-events-none transition-all group-hover:scale-110" />
                    
                    <div ref={printRef} className="w-full relative shadow-inner rounded-[5rem] overflow-hidden">
                      <textarea 
                        value={editableContent} 
                        onChange={(e) => setEditableContent(e.target.value)} 
                        className="w-full h-[800px] p-16 md:p-24 bg-stone-50/50 border border-stone-200 rounded-[5rem] outline-none font-mono text-xs md:text-base text-stone-800 leading-relaxed focus:bg-white focus:ring-[64px] focus:ring-stone-900/[0.03] transition-all resize-none overflow-y-auto custom-scrollbar"
                        spellCheck={false}
                      />
                      {/* Editor HUD Overlay */}
                      <div className="absolute bottom-10 right-10 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="px-6 py-3 bg-stone-900/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase text-stone-500 tracking-widest border border-stone-900/5">
                            Line Count: {editableContent.split('\n').length}
                         </div>
                      </div>
                    </div>
                  </div>

                  {/* NEURAL COMMAND MODULE */}
                  <div className="flex flex-col xl:flex-row gap-12 justify-between items-center bg-[#0d0d0d] p-12 md:p-20 rounded-[5rem] shadow-[0_50px_100px_rgba(0,0,0,0.4)] relative overflow-hidden group">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                       <div className="grid grid-cols-12 h-full w-full">
                          {Array.from({ length: 144 }).map((_, i) => <div key={i} className="border border-white" />)}
                       </div>
                    </div>
                    
                    <div className="flex flex-wrap justify-center gap-6 relative z-10">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        onClick={exportPDF}
                        className="flex items-center gap-5 px-12 py-7 bg-white text-stone-900 rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.2em] hover:shadow-[0_20px_50px_rgba(255,255,255,0.3)] transition-all"
                      >
                        <Download size={20} /> Deploy as PDF
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-5 px-12 py-7 bg-stone-800 text-white rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.2em] hover:bg-stone-700 transition-all border border-white/5"
                      >
                        <RefreshCw size={20} /> Sync Branch
                      </motion.button>
                    </div>

                    <div className="flex-1 w-full flex flex-col md:flex-row gap-8 relative z-10 xl:ml-16">
                      <div className="flex-1 relative">
                        <Zap size={24} className="absolute left-10 top-1/2 -translate-y-1/2 text-[#a9b897]" />
                        <input 
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          className="w-full pl-20 pr-10 py-7 bg-white/5 border border-white/10 rounded-[2.5rem] outline-none text-white text-sm font-semibold focus:ring-[16px] ring-[#a9b897]/5 transition-all placeholder:text-white/20 font-serif italic"
                          placeholder="Execute neural synthesis protocol..."
                        />
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAiSynthesis}
                        disabled={isAiLoading || !aiPrompt}
                        className="px-14 py-7 bg-[#a9b897] text-stone-900 rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.2em] hover:bg-white transition-all disabled:opacity-10 flex items-center justify-center gap-5"
                      >
                        {isAiLoading ? (
                           <div className="animate-spin"><RefreshCw size={22}/></div>
                        ) : <><Sparkles size={22} /> Synthesize</>}
                      </motion.button>
                    </div>
                  </div>

                  {/* ANALYTICS & GOVERNANCE DATA GRID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                     <div className="bg-stone-50 p-16 rounded-[5rem] border border-stone-100 space-y-10 group hover:shadow-2xl transition-all duration-700">
                        <header className="flex justify-between items-center">
                           <h6 className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-400">Node Integrity</h6>
                           <ShieldCheck size={20} className="text-[#a9b897]" />
                        </header>
                        <div className="space-y-8">
                           {[
                             { label: "Ledger Synchronization", val: "100%", color: "text-green-600" },
                             { label: "Governance Alignment", val: "Elite", color: "text-stone-900" },
                             { label: "Branch Stability", val: "High", color: "text-[#a9b897]" }
                           ].map((m, i) => (
                             <div key={i} className="flex justify-between items-center border-b border-stone-200 pb-6 last:border-0 group-hover:border-[#a9b897]/20 transition-colors">
                                <span className="text-[12px] font-bold text-stone-400">{m.label}</span>
                                <span className={`text-xl font-serif italic font-bold ${m.color}`}>{m.val}</span>
                             </div>
                           ))}
                        </div>
                     </div>

                     <div className="bg-white p-16 rounded-[5rem] border-2 border-stone-100 space-y-10 shadow-sm relative overflow-hidden group">
                        <header className="flex justify-between items-center relative z-10">
                           <h6 className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-400">Projected Impact</h6>
                           <PieChart size={20} className="text-stone-300" />
                        </header>
                        <div className="space-y-4 relative z-10">
                           <p className="text-4xl font-serif italic text-stone-900 group-hover:scale-105 transition-transform duration-700">+18% Efficiency</p>
                           <p className="text-sm text-stone-400 font-serif leading-relaxed">This node architecture facilitates rapid scaling by decoupling administrative logic from core production cycles.</p>
                        </div>
                        <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity">
                           <BarChart3 size={150} />
                        </div>
                     </div>

                     <div className="bg-stone-900 p-16 rounded-[5rem] flex flex-col justify-between space-y-10 shadow-2xl relative overflow-hidden group">
                        <div className="space-y-6 relative z-10">
                           <div className="flex items-center gap-5 text-[#a9b897]">
                              <Lock size={32} className="group-hover:rotate-[-10deg] transition-transform" />
                              <p className="text-[11px] font-black uppercase tracking-[0.5em]">Governance Protocol</p>
                           </div>
                           <p className="text-base font-serif italic text-white/50 leading-relaxed">
                             Strict adherence to the TOTS Enterprise Governance framework is required for all production-level commits.
                           </p>
                        </div>
                        <motion.button 
                          whileHover={{ x: 10 }}
                          className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-[#a9b897] relative z-10 group/btn"
                        >
                          View Compliance Docs <ChevronRight size={14} className="group-hover/btn:translate-x-2 transition-transform" />
                        </motion.button>
                        <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                     </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>

        {/* 5.5: GLOBAL FOOTER ARCHITECTURE */}
        <footer className="pt-40 border-t border-stone-200 flex flex-col xl:flex-row justify-between items-center gap-20 text-stone-400 pb-32">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex items-center gap-8">
              <div className="w-24 h-24 bg-white border border-stone-100 rounded-[3rem] flex items-center justify-center shadow-xl group hover:border-[#a9b897] transition-all duration-700">
                <ShieldCheck size={36} className="text-stone-200 group-hover:text-[#a9b897] transition-all" />
              </div>
              <div className="space-y-2">
                <p className="text-[13px] font-black uppercase tracking-[0.4em] text-stone-900">Vault Infrastructure</p>
                <div className="flex gap-4">
                  <Badge color="stone">SSL_SECURE</Badge>
                  <Badge color="stone">P2P_ENCRYPTED</Badge>
                </div>
              </div>
            </div>
            <div className="hidden md:block w-px h-20 bg-stone-200" />
            <div className="text-[11px] font-mono space-y-2 text-center md:text-left opacity-60">
              <p>Node Location: <span className="text-stone-900 font-bold uppercase tracking-widest">Global Archive</span></p>
              <p>Synthesis Latency: 12ms</p>
              <p>Handshake ID: {Math.random().toString(16).substring(2, 12).toUpperCase()}</p>
            </div>
          </div>
          
          <nav className="flex flex-wrap justify-center gap-16">
            {['Architecture', 'Governance', 'Neural Security', 'Branch Policy', 'Privacy Ledger'].map(link => (
              <a key={link} href="#" className="text-[11px] font-black uppercase tracking-[0.5em] hover:text-[#a9b897] transition-all relative group">
                {link}
                <span className="absolute -bottom-3 left-0 w-0 h-0.5 bg-[#a9b897] group-hover:w-full transition-all duration-700 shadow-[0_0_10px_#a9b897]" />
              </a>
            ))}
          </nav>

          <div className="text-[12px] font-mono text-right hidden xl:block space-y-2">
            <p className="text-stone-900 font-black tracking-widest uppercase">London Core // Archive Node</p>
            <p className="opacity-40 uppercase tracking-widest text-[10px]">© 2026 THE ORGANISED TYPES // ALL RIGHTS RESERVED</p>
          </div>
        </footer>

      </div>

      {/* 5.6: FIXED INTERACTION HUD */}
      <div className="fixed bottom-12 right-12 z-[500] flex flex-col gap-6">
         <motion.button 
           whileHover={{ scale: 1.1, rotate: 10, y: -5 }} 
           whileTap={{ scale: 0.9 }}
           className="w-20 h-20 bg-stone-900 text-white rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.4)] flex items-center justify-center hover:bg-[#a9b897] hover:text-stone-900 transition-all border border-white/5"
         >
           <MessageSquare size={28} />
         </motion.button>
         <motion.button 
           whileHover={{ scale: 1.1, rotate: -10, y: -5 }} 
           whileTap={{ scale: 0.9 }}
           className="w-20 h-20 bg-white text-stone-900 border-2 border-stone-100 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.05)] flex items-center justify-center hover:bg-stone-50 transition-all"
         >
           <Settings size={28} />
         </motion.button>
      </div>

      {/* STYLES FOR SCROLLBAR */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e5e5;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a9b897;
        }
      `}</style>
    </div>
  );
}