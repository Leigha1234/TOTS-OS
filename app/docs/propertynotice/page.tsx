"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Copyright, 
  ArrowLeft, 
  Clock, 
  Scale, 
  Ban, 
  CloudUpload, 
  Lightbulb, 
  ShieldCheck, 
  Layers, 
  Mail, 
  ChevronDown, 
  ChevronUp, 
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * TOTS OS: INTELLECTUAL PROPERTY NOTICE MODULE
 * Theme: Organic Minimalist (Consistent with System DNA)
 */

export default function IntellectualPropertyNotice() {
  const router = useRouter();
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  const toggleSection = (id: number) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const sections = [
    {
      id: 1,
      title: "1. Ownership Architecture",
      icon: Copyright,
      content: (
        <div className="space-y-4">
          <p>All intellectual property rights, structural parameters, and digital asset layers within TOTS OS remain the exclusive proprietary property of The Organised Types unless an alternative institutional deed is explicitly signed in writing.</p>
          <p className="text-xs font-bold uppercase tracking-wider text-stone-800">This exclusive mandate protects:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-stone-700 text-xs font-mono">
            {[
              "Core Software & Engines",
              "System Architectures",
              "Brand Assets & Logos",
              "Interface UI/UX Designs",
              "Automation Workflows",
              "Relational Databases",
              "Platform Documentation",
              "Generated Core Content",
              "Visual Graphic Profiles",
              "AI Structures & Logic"
            ].map((asset, i) => (
              <div key={i} className="p-2.5 bg-stone-50 border border-stone-100 rounded-xl flex items-center gap-2">
                <div className="w-1 h-1 rounded-full accent-bg" />
                <span>{asset}</span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "2. Limited Operational Licence",
      icon: FileText,
      content: (
        <div className="space-y-4">
          <p>Active workspace subscribers are granted a limited, non-exclusive, non-transferable, completely revocable platform license to access and run TOTS OS modules strictly for legitimate internal business processing operations.</p>
          <p className="font-bold text-stone-900 bg-[#faf9f6] p-4 border-l-2 accent-border rounded-r-xl">
            Important Legal Distinction: This runtime operational permission grants a temporary right to utilize the environment; it transfers zero structural ownership or underlying patent title to the tenant.
          </p>
        </div>
      )
    },
    {
      id: 3,
      title: "3. Strict System Restrictions",
      icon: Ban,
      content: (
        <div className="space-y-4">
          <p>Account profiles, administrators, and connected developers are strictly forbidden from executing the following systemic violations:</p>
          <ul className="list-disc pl-6 space-y-2 text-stone-700 text-xs leading-relaxed">
            <li><strong>Copying or Reproducing:</strong> Replicating underlying core codebase components, stylesheets, or visual assets outside explicit business workspace data exporting bounds.</li>
            <li><strong>Redistribution:</strong> Reselling, sub-licensing, renting, or leasing private instance access parameters to unauthorized external third parties.</li>
            <li><strong>Decompilation & Reverse Engineering:</strong> Reviewing compiled bundles or tracking network streams in an explicit attempt to deconstruct or extract system source code files.</li>
            <li><strong>Structural Replication:</strong> Rebuilding identical interface workflow models, business tracking pipelines, or operational schemas substantially imitating TOTS OS proprietary DNA.</li>
            <li><strong>Notice Stripping:</strong> Erasing embedded trademark metadata, copyright strings, or platform branding watermarks from user-facing screens or generated reports.</li>
          </ul>
        </div>
      )
    },
    {
      id: 4,
      title: "4. User Content Boundaries",
      icon: CloudUpload,
      content: (
        <div className="space-y-4">
          <p>Customers maintain absolute intellectual ownership, compliance control, and property rights over all raw operational data files, media, and text parameters they explicitly upload into their private space partitions.</p>
          <p>To run the system, the Customer grants TOTS OS a limited, operational license to safely store, isolate, parse, display, and transmit those records solely to fuel your activated platform automation chains and support routes.</p>
          <p className="text-xs italic text-stone-500">The account operator warrants and confirms they hold complete authorized legal rights and data collection consents before introducing any dataset to the application.</p>
        </div>
      )
    },
    {
      id: 5,
      title: "5. Unrestricted Feedback Lifecycle",
      icon: Lightbulb,
      content: (
        <p>Any system reviews, UI recommendations, configuration ideations, or architectural optimization suggestions submitted to our engineering team may be hardcoded or integrated into the platform baseline without restriction, financial credit, or situational compensation loops being owed to the submitting entity.</p>
      )
    },
    {
      id: 6,
      title: "6. Trademark & Brand Protection",
      icon: ShieldCheck,
      content: (
        <p>The TOTS nomenclature, visual identity, branded components, specialized operational vocabulary, and marketing materials are strictly protected. These unique brand identifiers may not be adapted, cross-shared, or woven into commercial assets without obtaining explicit prior written validation from our brand management desk.</p>
      )
    },
    {
      id: 7,
      title: "7. Integrated Third-Party Rights",
      icon: Layers,
      content: (
        <p>Certain API hooks, developer libraries, mapping tools, or connection relays running across TOTS OS workspaces operate via external vendor software licenses. Account operators remain fully responsible for reviewing and adhering to any third-party software protection policies connected to their custom business extensions.</p>
      )
    },
    {
      id: 8,
      title: "8. Enforcement Runbook",
      icon: Scale,
      content: (
        <p>We actively monitor instance parameters and server access logs. TOTS OS retains the definitive right to launch comprehensive technical investigations, suspend offending multi-tenant spaces, and pursue formal legal remedies under Scottish law to counter corporate espionage, trademark infringement, or unauthorized database extraction attempts.</p>
      )
    },
    {
      id: 9,
      title: "9. IP Compliance Gateway",
      icon: Mail,
      content: (
        <div className="p-6 bg-[#faf9f6] border border-stone-100 rounded-3xl text-xs space-y-1">
          <p className="font-black uppercase tracking-widest text-[9px] text-stone-400">Legal Counsel & Brand Registry:</p>
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
        .accent-border { border-color: var(--accent); }
      `}</style>

      {/* BACK NAV BUTTON */}
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors group"
      >
        <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> Exit to Compliance Matrix
      </button>

      {/* TITLE HEADER */}
      <header className="border-b border-stone-200 pb-10 space-y-4">
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-stone-100 shadow-sm w-fit accent-text">
          <Copyright size={12} fill="currentColor" className="opacity-80" />
          <p className="font-black uppercase text-[9px] tracking-[0.4em]">Proprietary Safeguard Protocol</p>
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl md:text-7xl font-serif italic tracking-tighter leading-none text-stone-900">
            Intellectual Property Notice
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 pt-2">
            <span>Asset Protection Framework</span>
            <span className="w-1.5 h-1.5 rounded-full bg-stone-200" />
            <span>Ver 0.1</span>
            <span className="w-1.5 h-1.5 rounded-full bg-stone-200" />
            <span className="flex items-center gap-1.5 text-stone-500">
              <Clock size={10} /> Active Framework Block
            </span>
          </div>
        </div>
      </header>

      {/* CORE GRID CONTENT */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* COMPLIANCE ACCORDIONS CONTAINER */}
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

        {/* SIDEBAR ASIDE CARD */}
        <aside className="lg:col-span-4 space-y-6 sticky top-8">
          <div className="bg-stone-900 p-8 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden">
            <Copyright size={130} className="absolute -right-12 -bottom-12 opacity-5 text-white" />
            <div className="space-y-2 relative z-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] accent-text">Platform Title</h4>
              <h3 className="text-2xl font-serif italic tracking-tight">Original Architecture</h3>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed font-sans">
              Every system asset, structural workflow, and backend processing matrix is conceptualized, designed, and coded to establish a clean, calm, and uniquely efficient multi-tenant operations hub.
            </p>
            <div className="pt-4 border-t border-stone-800 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-stone-400">
              <span>Legal Enforcers Registry</span>
              <span className="accent-text">TOTS TRADEMARK // 2026</span>
            </div>
          </div>
        </aside>

      </main>

      {/* RUNTIME FOOTER */}
      <footer className="pt-8 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-stone-400">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full accent-bg animate-pulse" />
          <span className="font-black uppercase tracking-widest text-[8px]">Proprietary Content Vault Locked</span>
        </div>
        <p className="font-serif italic">TOTS Operating System Layouts // Legal IP Framework</p>
      </footer>

    </div>
  );
}