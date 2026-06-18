"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  ArrowLeft, 
  Clock, 
  KeyRound, 
  Server, 
  UserX, 
  AlertTriangle, 
  Mail, 
  ChevronDown, 
  ChevronUp, 
  Database,
  Terminal
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * TOTS OS: SECURITY STANDARDS & PROTOCOLS INFRASTRUCTURE
 * Theme: Organic Minimalist (Consistent with System DNA)
 */

export default function SecurityPolicy() {
  const router = useRouter();
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  const toggleSection = (id: number) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const sections = [
    {
      id: 1,
      title: "1. Commitment to Security",
      icon: ShieldCheck,
      content: (
        <div className="space-y-4">
          <p>TOTS OS is committed to implementing reasonable technical and organizational measures designed to protect the integrity, confidentiality, and availability of our multi-tenant environments.</p>
          <p className="text-xs font-bold uppercase tracking-wider text-stone-800">Protected Core Asset Classes:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-stone-700 text-xs">
            {["User Accounts", "Operational Data", "Uploaded Files", "Financial Records", "HR Information", "Platform Infrastructure"].map((asset, idx) => (
              <div key={idx} className="p-3 bg-stone-50 border border-stone-100 rounded-xl font-medium">
                {asset}
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "2. Technical Security Measures",
      icon: Server,
      content: (
        <div className="space-y-4">
          <p>Our platform defense layers utilize programmatic and infrastructure controls to isolate client datasets and secure background transactions. Active security provisions include:</p>
          <div className="space-y-3 text-xs">
            {[
              { label: "Encrypted Communications", desc: "Forced SSL/TLS encryption for all data in transit across our routing gateways." },
              { label: "Secure Authentication Systems", desc: "Hashed credential storage and secure session tokens to prevent brute-force exploits." },
              { label: "Granular Access Controls", desc: "Role-based verification logic to prevent cross-tenant data leaks or unauthorized file access." },
              { label: "Continuous Monitoring Systems", desc: "Automated application logging and anomaly detection protocols to trace malicious payloads." },
              { label: "Infrastructure Protections", desc: "Hardened cloud containers, active firewalls, and isolated database architectures." },
              { label: "Restricted Administrative Access", desc: "Strict internal access reviews, limiting production workspace access to verified engineering nodes." },
              { label: "System Backup Procedures", desc: "Encrypted, point-in-time snapshot routines to ensure disaster recovery resilience." }
            ].map((measure, i) => (
              <div key={i} className="p-4 bg-[#faf9f6] border border-stone-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-2">
                <span className="font-bold text-stone-900 uppercase tracking-wider text-[10px] accent-text shrink-0 md:w-48">{measure.label}</span>
                <p className="text-stone-600 text-xs leading-relaxed">{measure.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "3. User Responsibilities",
      icon: KeyRound,
      content: (
        <div className="space-y-4">
          <p>Security is a shared protocol. Account operators and tenant administrators are held strictly responsible for maintaining local security compliance:</p>
          <ul className="list-disc pl-6 space-y-2 text-stone-700 text-xs leading-relaxed">
            <li><strong>Password Protection:</strong> Utilizing complex unique credentials and preventing shared or logged password leaks.</li>
            <li><strong>Secure Client Devices:</strong> Accessing the TOTS OS workspace exclusively via secure, non-compromised devices with active local protection mechanisms.</li>
            <li><strong>Internal Access Control:</strong> Properly provisioning internal staff roles and instantly auditing or terminating credentials for offboarded employees.</li>
            <li><strong>Authorized User Monitoring:</strong> Routinely auditing user logs and session history within your private business sub-accounts.</li>
            <li><strong>Redundant Backup Exporting:</strong> Maintaining local data exports of business-critical information where strict operational compliance rules demand redundancy.</li>
          </ul>
        </div>
      )
    },
    {
      id: 4,
      title: "4. Security Incident Management",
      icon: Terminal,
      content: (
        <div className="space-y-4">
          <p>In the event of an identified security breach, unauthorized infrastructure access, or systemic data compromise, TOTS OS will activate emergency handling runbooks. Action items may include:</p>
          <ul className="list-disc pl-6 space-y-1 text-stone-600">
            <li>Conducting a comprehensive forensic analysis of the core issue nodes</li>
            <li>Temporarily suspending affected tenant or system-wide access parameters to preserve data blocks</li>
            <li>Deploying localized emergency hotfixes and network firewall protections</li>
            <li>Notifying affected client data controllers directly where strictly mandated by UK GDPR / Scottish data laws</li>
          </ul>
        </div>
      )
    },
    {
      id: 5,
      title: "5. No Absolute Security Guarantee",
      icon: AlertTriangle,
      content: (
        <div className="space-y-4">
          <p>While we implement professional-grade defensive standards, no internet-based service or cloud storage paradigm can be guaranteed as completely impenetrable.</p>
          <p className="p-4 bg-stone-900 text-stone-400 rounded-2xl text-xs font-sans leading-relaxed">
            <strong className="text-white block font-serif italic text-sm mb-1">Risk Acknowledgment:</strong> Users explicitly acknowledge and accept the systemic technical vulnerabilities inherent to public internet communications, cloud hosting layers, third-party API configurations, and non-deterministic artificial intelligence technologies.
          </p>
        </div>
      )
    },
    {
      id: 6,
      title: "6. Security Inquiries",
      icon: Mail,
      content: (
        <div className="p-6 bg-[#faf9f6] border border-stone-100 rounded-3xl text-xs space-y-1">
          <p className="font-black uppercase tracking-widest text-[9px] text-stone-400">SecOps Reporting Endpoint:</p>
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

      {/* --- BACK NAV ROUTE --- */}
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors group"
      >
        <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> Return to Security Hub
      </button>

      {/* --- HEADER --- */}
      <header className="border-b border-stone-200 pb-10 space-y-4">
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-stone-100 shadow-sm w-fit accent-text">
          <ShieldCheck size={12} fill="currentColor" className="opacity-80" />
          <p className="font-black uppercase text-[9px] tracking-[0.4em]">Infrastructure Protection Matrix</p>
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl md:text-7xl font-serif italic tracking-tighter leading-none text-stone-900">
            Security Policy
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 pt-2">
            <span>TOTS OS Hardening</span>
            <span className="w-1.5 h-1.5 rounded-full bg-stone-200" />
            <span>Ver 0.1</span>
            <span className="w-1.5 h-1.5 rounded-full bg-stone-200" />
            <span className="flex items-center gap-1.5 text-stone-500">
              <Clock size={10} /> Active Framework Block
            </span>
          </div>
        </div>
      </header>

      {/* --- WORKSPACE CORE GRID --- */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* ACCORDIONS CONTAINER */}
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

        {/* SIDEBAR ASSURANCE PANEL */}
        <aside className="lg:col-span-4 space-y-6 sticky top-8">
          <div className="bg-stone-900 p-8 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden">
            <Database size={130} className="absolute -right-12 -bottom-12 opacity-5 text-white" />
            <div className="space-y-2 relative z-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] accent-text">Data Sovereignty</h4>
              <h3 className="text-2xl font-serif italic tracking-tight">Workspace Isolation</h3>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed font-sans">
              TOTS OS targets isolated tenant structures. The workspace architecture explicitly partitions logical transactional scopes to maximize stability and block parameter interception vectors.
            </p>
            <div className="pt-4 border-t border-stone-800 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-stone-400">
              <span>Environment</span>
              <span className="accent-text">ENCRYPTED NODE // 2026</span>
            </div>
          </div>
        </aside>

      </main>

      {/* --- RUNTIME BASE FOOTER --- */}
      <footer className="pt-8 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-stone-400">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full accent-bg animate-pulse" />
          <span className="font-black uppercase tracking-widest text-[8px]">Secops Layer Verification Active</span>
        </div>
        <p className="font-serif italic">TOTS Operating System Layouts // Security Operations Matrix</p>
      </footer>

    </div>
  );
}