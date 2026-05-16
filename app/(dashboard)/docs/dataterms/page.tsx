"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  FileSpreadsheet, 
  ArrowLeft, 
  Clock, 
  GitCommit, 
  Layers, 
  ShieldCheck, 
  Users, 
  HelpCircle, 
  AlertTriangle, 
  Trash2, 
  Mail, 
  ChevronDown, 
  ChevronUp, 
  Database
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * TOTS OS: DATA PROCESSING AGREEMENT (DPA) COMPONENT
 * Theme: Organic Minimalist (Consistent with System DNA)
 */

export default function DataProcessingAgreement() {
  const router = useRouter();
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  const toggleSection = (id: number) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const sections = [
    {
      id: 1,
      title: "1. Purpose and Scope",
      icon: FileSpreadsheet,
      content: (
        <div className="space-y-4">
          <p>This Data Processing Agreement (“DPA”) forms a binding structural part of the core master agreement between TOTS OS and the Customer regarding the systematic processing of personal data.</p>
          <p>This document ensures all platform activities align seamlessly with statutory data protection regulations, specifically governing multi-tenant business workspaces.</p>
        </div>
      )
    },
    {
      id: 2,
      title: "2. Governance Roles",
      icon: GitCommit,
      content: (
        <div className="space-y-4">
          <p>For the execution of platform services, the structural data roles are designated as follows:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-5 bg-stone-50 border border-stone-100 rounded-2xl space-y-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-stone-400 block">System Role Alpha</span>
              <h4 className="font-serif italic text-lg text-stone-900">The Customer // Data Controller</h4>
              <p className="text-stone-600 text-xs leading-relaxed">Retains absolute ownership, defines the legal processing parameters, and holds primary responsibility for the lawful collection of all tenant datasets.</p>
            </div>
            <div className="p-5 bg-white border border-stone-900 rounded-2xl space-y-2 shadow-sm">
              <span className="text-[9px] font-black uppercase tracking-widest accent-text block">System Role Beta</span>
              <h4 className="font-serif italic text-lg text-stone-900">TOTS OS // Data Processor</h4>
              <p className="text-stone-600 text-xs leading-relaxed">Acts solely on behalf of and under the explicit technical instructions of the Customer to execute background platform processes, hosting, and AI utilities.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "3. Scope of Processing Activities",
      icon: Layers,
      content: (
        <div className="space-y-4">
          <p>TOTS OS is authorized to ingest, transmit, parse, and store personal data types specifically to deliver the following application features:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-stone-700 text-xs font-medium pt-1">
            {["Cloud Hosting", "File Storage", "Workflow Pipelines", "HR Systems", "Operational CRM", "AI Functionality", "Support Services", "Tenant Analytics"].map((item, index) => (
              <div key={index} className="p-3 bg-[#faf9f6] border border-stone-100 rounded-xl text-center">
                {item}
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "4. Technical Security Controls",
      icon: ShieldCheck,
      content: (
        <p>TOTS OS will implement and maintain reasonable technical and organizational security measures appropriate to the nature of the data processed. These are designed to safeguard tenant database partitions against unauthorized access, accidental alteration, or catastrophic metadata disclosure leaks.</p>
      )
    },
    {
      id: 5,
      title: "5. Personnel Confidentiality",
      icon: Users,
      content: (
        <p>We ensure that any platform personnel, internal engineers, or administrators granted clearance to access or maintain systems interacting with Customer data fields are bound by strict contractual or statutory confidentiality obligations.</p>
      )
    },
    {
      id: 6,
      title: "6. Subprocessors Protocol",
      icon: Database,
      content: (
        <div className="space-y-4">
          <p>The Customer grants generic authorization for TOTS OS to engage downstream subprocessors to maintain underlying application runtimes. These third-party dependencies include:</p>
          <ul className="list-disc pl-6 space-y-1 text-stone-700 text-xs">
            <li>Core cloud hosting and data center node providers</li>
            <li>Database infrastructure and transactional email relays</li>
            <li>Workspace telemetry and analytical indexing systems</li>
            <li>Secure, vaulted billing and payment processor gateways</li>
          </ul>
          <p className="text-stone-600 text-xs italic pt-1">We take reasonable procedural steps to verify that all sub-processors implement matching data protection standards to protect your tenant privacy borders.</p>
        </div>
      )
    },
    {
      id: 7,
      title: "7. Data Subject Rights Assistance",
      icon: HelpCircle,
      content: (
        <p>TOTS OS will provide reasonable technical cooperation and assistance hooks within the admin dashboard to help Customers fulfill their statutory duties when responding to valid data subject access requests (SARs), deletions, or modification demands.</p>
      )
    },
    {
      id: 8,
      title: "8. Verified Data Breaches",
      icon: AlertTriangle,
      content: (
        <div className="space-y-3">
          <p>Where legally mandated by applicable regional data protective statutes, TOTS OS will notify the designated Customer security contact of any confirmed, verified data breaches involving personal data files.</p>
          <p className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs font-medium">
            <strong>Incident Response Timeline:</strong> Notification routines will be executed without undue delay following confirmation of the incident vector to allow the Controller to manage external regulatory compliance steps.
          </p>
        </div>
      )
    },
    {
      id: 9,
      title: "9. Deletion and Return of Datasets",
      icon: Trash2,
      content: (
        <p>Upon formal termination of your platform subscription account, Customer data sets stored across the production partitions will be completely deleted or scrubbed following our standard data retention archival cycles, unless specific local legislation commands an extended structural hold.</p>
      )
    },
    {
      id: 10,
      title: "10. Inquiries Registry",
      icon: Mail,
      content: (
        <div className="p-6 bg-[#faf9f6] border border-stone-100 rounded-3xl text-xs space-y-1">
          <p className="font-black uppercase tracking-widest text-[9px] text-stone-400">Data Protection Officer Endpoint:</p>
          <p className="font-bold underline text-stone-900">theorganisedtypes@gmail.com</p>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-4 md:p-8 lg:p-12 space-y-8 md:space-y-12 max-w-[1200px] mx-auto font-sans">
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&family=Inter:wght@300;400;700;900&display=swap');
        :root { --accent: #A3B18A; }
        .font-serif { font-family: 'Instrument Serif', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        .accent-text { color: var(--accent); }
        .accent-bg { background-color: var(--accent); }
      `}</style>

      {/* --- REVERSED EXIT NAV --- */}
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors group"
      >
        <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> Exit to Compliance Desk
      </button>

      {/* --- HEADER BLOCK --- */}
      <header className="border-b border-stone-200 pb-10 space-y-4">
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-stone-100 shadow-sm w-fit accent-text">
          <FileSpreadsheet size={12} fill="currentColor" className="opacity-80" />
          <p className="font-black uppercase text-[9px] tracking-[0.4em]">GDPR / Statutory Addendum</p>
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl md:text-7xl font-serif italic tracking-tighter leading-none text-stone-900">
            Data Processing Agreement
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 pt-2">
            <span>B2B Multi-Tenant Addendum</span>
            <span className="w-1.5 h-1.5 rounded-full bg-stone-200" />
            <span>Ver 0.1</span>
            <span className="w-1.5 h-1.5 rounded-full bg-stone-200" />
            <span className="flex items-center gap-1.5 text-stone-500">
              <Clock size={10} /> Framework Schedule
            </span>
          </div>
        </div>
      </header>

      {/* --- CORE ACCORDION GRID WORKSPACE --- */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* LEFT WORKSPACE ACCORDIONS COLUMN */}
        <div className="lg:col-span-8 space-y-4">
          {sections.map((section) => {
            const isExpanded = expandedSection === section.id;
            const IconComponent = section.icon;

            return (
              <div 
                key={section.id} 
                className={`bg-white border rounded-[2rem] transition-all duration-300 overflow-hidden ${isExpanded ? 'border-stone-900 shadow-xl' : 'border-stone-200 shadow-sm'}`}
              >
                <button 
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-6 md:p-8 flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-colors ${isExpanded ? 'accent-bg text-white' : 'bg-stone-50 text-stone-400 group-hover:text-stone-900'}`}>
                      <IconComponent size={16} />
                    </div>
                    <h3 className="font-serif italic text-xl md:text-2xl text-stone-900 tracking-tight">
                      {section.title.includes(' ') ? section.title.split(' ').slice(1).join(' ') : section.title}
                    </h3>
                  </div>
                  {isExpanded ? <ChevronUp size={16} className="text-stone-400" /> : <ChevronDown size={16} className="text-stone-300 group-hover:text-stone-900" />}
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                    >
                      <div className="px-6 md:px-8 pb-8 text-sm text-stone-600 font-sans leading-relaxed border-t border-stone-50 pt-6">
                        {section.content}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* RIGHT INFO BLOCK PANEL */}
        <aside className="lg:col-span-4 space-y-6 sticky top-8">
          <div className="bg-stone-900 p-8 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden">
            <Layers size={130} className="absolute -right-12 -bottom-12 opacity-5 text-white" />
            <div className="space-y-2 relative z-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] accent-text">Data Architecture</h4>
              <h3 className="text-2xl font-serif italic tracking-tight">Compliant Ingestion</h3>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed font-sans">
              This DPA maps the exact structural guardrails dictating how customer-controlled text parameters, HR fields, and uploaded files are safely treated within the cloud environment pipelines.
            </p>
            <div className="pt-4 border-t border-stone-800 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-stone-400">
              <span>Sovereignty Matrix</span>
              <span className="accent-text">B2B SCHEDULE // 2026</span>
            </div>
          </div>
        </aside>

      </main>

      {/* --- PROCESSOR FOOTER TRACK --- */}
      <footer className="pt-8 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-stone-400">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full accent-bg animate-pulse" />
          <span className="font-black uppercase tracking-widest text-[8px]">Processor Ingestion Rules Validated</span>
        </div>
        <p className="font-serif italic">TOTS Operating System Layouts // Legal DPA Matrix</p>
      </footer>

    </div>
  );
}