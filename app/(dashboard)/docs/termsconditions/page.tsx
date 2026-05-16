"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Scale, 
  ArrowLeft, 
  Clock, 
  ShieldAlert, 
  UserCheck, 
  Briefcase, 
  Cpu, 
  CreditCard, 
  Lock, 
  Mail, 
  ChevronDown, 
  ChevronUp, 
  FileSignature,
  Gavel,
  Zap,
  HardDrive
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * TOTS OS: TERMS AND CONDITIONS COMPONENT
 * Theme: Organic Minimalist (Consistent with Dashboard DNA)
 * Jurisdiction: Scotland
 */

export default function TermsAndConditions() {
  const router = useRouter();
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  const toggleSection = (id: number) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const sections = [
    {
      id: 1,
      title: "1. Introduction",
      icon: Scale,
      content: (
        <div className="space-y-4">
          <p>Welcome to TOTS OS (“Platform”, “Service”, “TOTS OS”, “we”, “our”, “us”).</p>
          <p>TOTS OS is an operational intelligence and business management platform providing workflow management, operational systems, finance tools, HR functionality, document storage, AI-assisted services, and related digital services.</p>
          <p className="font-bold text-stone-900 italic">By creating an account, accessing, or using the Platform, you agree to be legally bound by these Terms. If you do not agree, you must not use the Platform.</p>
        </div>
      )
    },
    {
      id: 2,
      title: "2. Eligibility",
      icon: UserCheck,
      content: (
        <div className="space-y-4">
          <p>TOTS OS is intended solely for businesses, organisations, consultants, agencies, and professionals acting in a business capacity.</p>
          <ul className="list-disc pl-6 space-y-1 text-stone-700">
            <li>You must be at least 18 years old.</li>
            <li>You must have authority to enter into legally binding agreements.</li>
            <li>You may not use the Platform for personal consumer purposes unrelated to business activity.</li>
          </ul>
        </div>
      )
    },
    {
      id: 3,
      title: "3. About TOTS OS",
      icon: Zap,
      content: (
        <div className="space-y-4">
          <p>We provide access to operational management tools including workflow systems, HR administration, and AI-assisted automation. Features may change, expand, or be removed at any time.</p>
          <p>We reserve the right to modify, suspend, or discontinue any part of the Platform without liability.</p>
        </div>
      )
    },
    {
      id: 4,
      title: "4. User Accounts",
      icon: Lock,
      content: (
        <div className="space-y-4">
          <p>You are responsible for maintaining the confidentiality of your credentials and for all activity conducted under your account. You must notify us immediately of any unauthorised access or security breaches.</p>
          <p>We may suspend accounts if security is compromised or if these Terms are breached.</p>
        </div>
      )
    },
    {
      id: 5,
      title: "5. User Content and Data",
      icon: HardDrive,
      content: (
        <div className="space-y-4">
          <p>You retain ownership of all files, documents, and data you upload (“User Content”). You grant TOTS OS a non-exclusive licence to host, process, and analyse such content solely for operating the Platform and improving functionality through anonymised data.</p>
          <p>You confirm that you own or have permission to use all uploaded content and that it does not infringe third-party rights.</p>
        </div>
      )
    },
    {
      id: 6,
      title: "6. AI-Generated Outputs",
      icon: Cpu,
      content: (
        <div className="space-y-4">
          <p>TOTS OS provides AI-generated responses and automations. These may contain inaccuracies and should <strong>not</strong> be relied upon as professional, legal, or financial advice.</p>
          <div className="p-4 border border-stone-200 bg-stone-50 rounded-2xl text-xs flex gap-3 items-start">
            <ShieldAlert size={16} className="accent-text shrink-0" />
            <p>You remain fully responsible for reviewing all AI outputs and validating accuracy before making operational decisions.</p>
          </div>
        </div>
      )
    },
    {
      id: 7,
      title: "7. Acceptable Use",
      icon: ShieldAlert,
      content: (
        <p>You agree not to use the Platform unlawfully, upload malicious code, reverse engineer the software, or interfere with system security. We reserve the right to investigate misuse and terminate accounts without notice.</p>
      )
    },
    {
      id: 8,
      title: "8. Subscription and Payments",
      icon: CreditCard,
      content: (
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-[#faf9f6] border border-stone-100 rounded-xl">
            <ul className="list-disc pl-4 space-y-2">
              <li>Subscriptions renew automatically unless cancelled.</li>
              <li>Payments are non-refundable and final once processed.</li>
              <li>Failure to pay may result in immediate suspension or restricted access.</li>
              <li>Pricing tiers may be modified with reasonable notice.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 11,
      title: "11. Intellectual Property",
      icon: FileSignature,
      content: (
        <p>All software, branding, workflows, and AI systems remain the property of TOTS OS. You may not reproduce, resell, or duplicate the Platform without explicit written permission.</p>
      )
    },
    {
      id: 13,
      title: "13. Limitation of Liability",
      icon: Scale,
      content: (
        <div className="space-y-4">
          <p>TOTS OS shall not be liable for indirect losses, loss of profits, or data loss. Our total liability shall not exceed the amount paid by you during the previous 3 months.</p>
          <p className="text-[10px] uppercase font-black tracking-widest text-stone-400">Nothing in these terms excludes liability where prohibited under Scottish Law.</p>
        </div>
      )
    },
    {
      id: 18,
      title: "18. Governing Law",
      icon: Gavel,
      content: (
        <div className="space-y-4">
          <div className="p-6 bg-stone-900 text-white rounded-[2rem] space-y-3">
            <h5 className="accent-text font-black text-[10px] uppercase tracking-[0.3em]">Jurisdictional Clause</h5>
            <p className="font-serif italic text-xl">These Terms are governed by the laws of Scotland.</p>
            <p className="text-stone-400 text-xs">Any disputes arising shall be subject to the exclusive jurisdiction of the Scottish courts.</p>
          </div>
        </div>
      )
    },
    {
      id: 19,
      title: "19. Contact Information",
      icon: Mail,
      content: (
        <div className="p-6 bg-[#faf9f6] border border-stone-100 rounded-3xl space-y-1 text-xs">
          <p className="font-bold text-stone-800">TOTS OS</p>
          <p>Samantha Hill</p>
          <p>24 Hebenton Road</p>
          <p>Elgin, IV30 4EP</p>
          <p className="pt-2 font-bold underline text-stone-900">theorgeanisedtypes@gmail.com</p>
          <p className="text-stone-400">www.theorganisedtypes.co.uk</p>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-4 md:p-8 lg:p-12 space-y-8 md:space-y-12 max-w-[1200px] mx-auto font-sans">
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&family=Inter:wght@300;400;700;900&display=swap');
        :root {
          --accent: #A3B18A;
        }
        .font-serif { font-family: 'Instrument Serif', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        .accent-text { color: var(--accent); }
        .accent-bg { background-color: var(--accent); }
        .accent-border { border-color: var(--accent); }
      `}</style>

      {/* --- BACK NAV --- */}
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors group"
      >
        <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> Exit to Dashboard
      </button>

      {/* --- HEADER --- */}
      <header className="border-b border-stone-200 pb-10 space-y-4">
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-stone-100 shadow-sm w-fit accent-text">
          <Scale size={12} fill="currentColor" />
          <p className="font-black uppercase text-[9px] tracking-[0.4em]">System Governance & Terms</p>
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl md:text-7xl font-serif italic tracking-tighter leading-none text-stone-900">
            Terms & Conditions
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 pt-2">
            <span>Primary Node: Scotland</span>
            <span className="w-1.5 h-1.5 rounded-full bg-stone-200" />
            <span>Ver 0.1</span>
            <span className="w-1.5 h-1.5 rounded-full bg-stone-200" />
            <span className="flex items-center gap-1.5 text-stone-500">
              <Clock size={10} /> Effective: 16/05/26
            </span>
          </div>
        </div>
      </header>

      {/* --- CONTENT GRID --- */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        <div className="lg:col-span-8 space-y-4">
          {sections.map((section) => {
            const isExpanded = expandedSection === section.id;
            const Icon = section.icon;

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
                      <Icon size={16} />
                    </div>
                    <h3 className="font-serif italic text-xl md:text-2xl text-stone-900 tracking-tight">
                      {section.title.includes('. ') ? section.title.split('. ')[1] : section.title}
                    </h3>
                  </div>
                  {isExpanded ? <ChevronUp size={16} className="text-stone-400" /> : <ChevronDown size={16} className="text-stone-300 group-hover:text-stone-900" />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
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

        {/* --- ASIDE --- */}
        <aside className="lg:col-span-4 space-y-6 sticky top-8">
          <div className="bg-stone-900 p-8 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden">
            <Gavel size={120} className="absolute -right-8 -bottom-8 opacity-5" />
            <div className="space-y-2 relative z-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] accent-text">Legal Territory</h4>
              <h3 className="text-2xl font-serif italic tracking-tight">Scottish Governance</h3>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed font-sans">
              This document establishes the binding agreement for the use of TOTS OS under the legal frameworks of Scotland.
            </p>
            <div className="pt-4 border-t border-stone-800 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-stone-400">
              <span>Elgin Primary Node</span>
              <span className="accent-text">SCOTLAND</span>
            </div>
          </div>

          <div className="bg-[#A3B18A] p-8 rounded-[2.5rem] text-white">
             <h4 className="text-[10px] font-black uppercase tracking-widest mb-2">Notice</h4>
             <p className="text-xs font-serif italic">This version 0.1 is currently active for all TOTS OS beta tenants.</p>
          </div>
        </aside>

      </main>

      {/* --- FOOTER --- */}
      <footer className="pt-8 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-stone-400">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full accent-bg animate-pulse" />
          <span className="font-black uppercase tracking-widest text-[8px]">Legal Node Operational</span>
        </div>
        <p className="font-serif italic">TOTS Operating System // Scotland // 2026</p>
      </footer>

    </div>
  );
}