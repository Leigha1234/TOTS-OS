"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Cpu, 
  ArrowLeft, 
  Clock, 
  Scale, 
  AlertTriangle, 
  Database, 
  ShieldAlert, 
  Mail, 
  ChevronDown, 
  ChevronUp, 
  BrainCircuit,
  Binary
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * TOTS OS: AI USAGE & DISCLAIMER COMPLIANCE MATRIX
 * Theme: Organic Minimalist (Consistent with System DNA)
 */

export default function AiUsagePolicy() {
  const router = useRouter();
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  const toggleSection = (id: number) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const sections = [
    {
      id: 1,
      title: "1. Introduction",
      icon: Cpu,
      content: (
        <div className="space-y-4">
          <p>TOTS OS includes artificial intelligence (“AI”), complex automation engine architecture, and machine-assisted processing systems.</p>
          <p>This Policy outlines exactly how algorithmic functionality operates within the Platform layers to maintain full processing transparency.</p>
        </div>
      )
    },
    {
      id: 2,
      title: "2. Nature of AI Outputs",
      icon: BrainCircuit,
      content: (
        <div className="space-y-4">
          <p>AI-generated computational outputs across your multi-tenant workspaces may include:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-stone-700 text-xs">
            {["System summaries & data aggregations", "Workflow recommendations & routing suggestions", "Automated operational layouts & triggers", "HR, task, and internal business classifications", "Analytical charts & pattern recognition insights", "Dynamic context-aware generated text blocks"].map((text, i) => (
              <div key={i} className="p-3 bg-[#faf9f6] border border-stone-100 rounded-xl flex items-center gap-2">
                <div className="w-1 h-1 rounded-full accent-bg" />
                <span>{text}</span>
              </div>
            ))}
          </div>
          <div className="p-4 border border-amber-200 bg-amber-50/40 text-amber-900 rounded-2xl text-xs font-medium space-y-1">
            <p className="font-bold flex items-center gap-1.5"><AlertTriangle size={14} /> Algorithmic Notice:</p>
            <p className="text-amber-800">Machine learning models are non-deterministic. Outputs may intermittently contain mathematical or structural inaccuracies, be incomplete for highly complex edge-cases, become rapidly outdated, or produce unexpected platform results.</p>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "3. No Professional Advice Status",
      icon: Scale,
      content: (
        <div className="space-y-4">
          <p>AI-generated content, suggestions, or auto-filled schema tables do <strong>not</strong> constitute:</p>
          <ul className="list-disc pl-6 space-y-1 text-stone-700 font-medium text-xs uppercase tracking-wider grid grid-cols-2 gap-2">
            <li className="accent-text">Legal Advice</li>
            <li className="accent-text">Financial Advice</li>
            <li className="accent-text">HR / Personnel Advice</li>
            <li className="accent-text">Regulatory Compliance</li>
            <li className="accent-text">Medical / Health Data</li>
            <li className="accent-text">Professional Consultancy</li>
          </ul>
          <p className="pt-2 text-stone-600">Users must independently validate, sanity-check, and review any generated data objects before executing downstream operational decisions.</p>
        </div>
      )
    },
    {
      id: 4,
      title: "4. Explicit User Responsibility",
      icon: ShieldAlert,
      content: (
        <div className="space-y-4">
          <p>As the primary account operator, you remain solely and completely responsible for reviewing outputs, workspace decisions, legal and cross-border compliance, employment or dismissal decisions, financial actions, and strict regulatory reporting obligations.</p>
        </div>
      )
    },
    {
      id: 5,
      title: "5. AI Training and System Improvement",
      icon: Database,
      content: (
        <div className="space-y-4">
          <p>TOTS OS may use fully anonymised, scrubbed, or aggregated platform interactions and execution prompts to optimize machine learning systems, enhance automation trees, and monitor structural platform performance.</p>
          <p className="font-bold text-stone-900 bg-stone-50 p-4 border-l-2 accent-border rounded-r-xl">Personally Identifiable Information (PII) is structurally isolated and will never intentionally be used for AI core model training without explicit consent or distinct legal verification loops.</p>
        </div>
      )
    },
    {
      id: 6,
      title: "6. Limitations of Liability",
      icon: ShieldAlert,
      content: (
        <div className="space-y-4">
          <p>To the fullest extent permitted under Scottish Law, TOTS OS accepts zero liability for any direct or indirect business losses, operational disruptions, financial errors, or employment compliance liabilities resulting from decisions made using machine-generated system outputs or automated workflow chains.</p>
        </div>
      )
    },
    {
      id: 7,
      title: "7. Experimental Features & Lifecycle",
      icon: Binary,
      content: (
        <p>Certain workspace features explicitly designated as "Beta", "AI Labs", or "Experimental" operate on cutting-edge transformer loops. These pipelines can change or expand without warning, return highly inconsistent test responses, or be deprecatingly removed to protect platform stability.</p>
      )
    },
    {
      id: 8,
      title: "8. Abuse Tracking Contact",
      icon: Mail,
      content: (
        <div className="p-6 bg-[#faf9f6] border border-stone-100 rounded-3xl text-xs space-y-1">
          <p className="font-black uppercase tracking-widest text-[9px] text-stone-400">Algorithmic Guardrail Operations:</p>
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

      {/* --- REVERSED BACK ROUTE BUTTON --- */}
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors group"
      >
        <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> Return to Workspace Engine
      </button>

      {/* --- POLICY TITLE HEADER --- */}
      <header className="border-b border-stone-200 pb-10 space-y-4">
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-stone-100 shadow-sm w-fit accent-text">
          <Cpu size={12} fill="currentColor" className="opacity-80" />
          <p className="font-black uppercase text-[9px] tracking-[0.4em]">Automated Systems Matrix</p>
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl md:text-7xl font-serif italic tracking-tighter leading-none text-stone-900">
            AI Usage & Disclaimer
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 pt-2">
            <span>TOTS OS Core Intelligence</span>
            <span className="w-1.5 h-1.5 rounded-full bg-stone-200" />
            <span>Ver 0.1</span>
            <span className="w-1.5 h-1.5 rounded-full bg-stone-200" />
            <span className="flex items-center gap-1.5 text-stone-500">
              <Clock size={10} /> Active Framework Block
            </span>
          </div>
        </div>
      </header>

      {/* --- POLICY DOCUMENT BLOCK CONTENT GRID --- */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* ACCORDIONS PANEL */}
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

        {/* SIDEBAR GLANCE DECK */}
        <aside className="lg:col-span-4 space-y-6 sticky top-8">
          <div className="bg-stone-900 p-8 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden">
            <BrainCircuit size={130} className="absolute -right-12 -bottom-12 opacity-5 text-white" />
            <div className="space-y-2 relative z-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] accent-text">Validation Matrix</h4>
              <h3 className="text-2xl font-serif italic tracking-tight">Human-in-the-Loop</h3>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed font-sans">
              All integrated machine-learning components in TOTS OS function to augment and assist business operations rather than definitively replace critical human analysis or programmatic validation mechanisms.
            </p>
            <div className="pt-4 border-t border-stone-800 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-stone-400">
              <span>Node Processing</span>
              <span className="accent-text">AUGMENTED INTEL // 2026</span>
            </div>
          </div>
        </aside>

      </main>

      {/* --- RUNTIME BASE FOOTER --- */}
      <footer className="pt-8 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-stone-400">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full accent-bg animate-pulse" />
          <span className="font-black uppercase tracking-widest text-[8px]">LLM Compliance Endpoint Nominal</span>
        </div>
        <p className="font-serif italic">TOTS Operating System Layouts // AI Engine Compliance</p>
      </footer>

    </div>
  );
}