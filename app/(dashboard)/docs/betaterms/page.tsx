"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Beaker, 
  ArrowLeft, 
  Clock, 
  Bug, 
  AlertTriangle, 
  MessageSquarePlus, 
  ShieldAlert, 
  Mail, 
  ChevronDown, 
  ChevronUp, 
  Terminal
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * TOTS OS: BETA & EARLY ACCESS GOVERNANCE FRAMEWORK
 * Theme: Organic Minimalist (Consistent with System DNA)
 */

export default function BetaTerms() {
  const router = useRouter();
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  const toggleSection = (id: number) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const sections = [
    {
      id: 1,
      title: "1. Beta Services Definition",
      icon: Beaker,
      content: (
        <div className="space-y-4">
          <p>Certain pre-release architectural modules, experimental tools, preview layouts, and early access processing nodes inside TOTS OS are intentionally deployed to collect workspace performance variables.</p>
          <p>These features are distinguished from standard multi-tenant production pathways by distinct operational system markers or interface descriptions.</p>
        </div>
      )
    },
    {
      id: 2,
      title: "2. Nature of Beta Features",
      icon: Bug,
      content: (
        <div className="space-y-4">
          <p>Because these environment pipelines are deployed in an evaluation phase, users explicitly acknowledge that Beta features may:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-stone-700 text-xs">
            {[
              "Contain underlying database bugs, rendering quirks, or memory leaks",
              "Operate inconsistently across different web browsers or processing networks",
              "Change structurally, visually, or programmatically on a daily basis",
              "Be modified or optimized without giving advance notice to system tenants",
              "Be entirely discontinued at any moment to preserve core cluster performance"
            ].map((risk, index) => (
              <div key={index} className="p-3 bg-stone-50 border border-stone-100 rounded-xl flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span>{risk}</span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "3. Limited Reliability Framework",
      icon: AlertTriangle,
      content: (
        <div className="space-y-4">
          <p>Users explicitly acknowledge and agree that Beta systems do not meet standard multi-tenant production reliability thresholds, security parameters, or system-uptime guarantees.</p>
          <div className="p-4 border border-stone-900 bg-stone-950 text-stone-100 rounded-2xl text-xs font-mono flex gap-3 items-start">
            <Terminal size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white uppercase tracking-wider text-[10px]">EXECUTION_RISK_WARNING</p>
              <p className="text-stone-400 mt-1">The use of any early access tools is completed entirely at your own discretion and individual business operational risk.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "4. Feedback and Intellectual Rights",
      icon: MessageSquarePlus,
      content: (
        <div className="space-y-4">
          <p>Users may voluntarily submit structural feedback, error logs, configuration suggestions, or improvement telemetry regarding Beta functionalities.</p>
          <p>By submitting metadata, you grant TOTS OS an unrestrictive, worldwide, royalty-free, perpetual right to utilize, implement, distribute, and hardcode such insights directly into the platform architecture without further compensation.</p>
        </div>
      )
    },
    {
      id: 5,
      title: "5. Comprehensive Liability Limitation",
      icon: ShieldAlert,
      content: (
        <div className="space-y-4">
          <p>To the maximum limit permitted under applicable regional laws, TOTS OS accepts absolute zero operational or legal liability for any system downtime, catastrophic database failures, data loss, interrupted automated processes, or unexpected AI outputs stemming from your interaction with Beta branches.</p>
        </div>
      )
    },
    {
      id: 6,
      title: "6. Operational Support Route",
      icon: Mail,
      content: (
        <div className="p-6 bg-[#faf9f6] border border-stone-100 rounded-3xl text-xs space-y-1">
          <p className="font-black uppercase tracking-widest text-[9px] text-stone-400">Beta Feedback & Telemetry Intake:</p>
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
        <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> Back to Workspace
      </button>

      {/* --- HEADER BLOCK --- */}
      <header className="border-b border-stone-200 pb-10 space-y-4">
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-stone-100 shadow-sm w-fit text-amber-600">
          <Beaker size={12} fill="currentColor" className="opacity-20" />
          <p className="font-black uppercase text-[9px] tracking-[0.4em]">Experimental Laboratory Nodes</p>
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl md:text-7xl font-serif italic tracking-tighter leading-none text-stone-900">
            Beta & Early Access
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 pt-2">
            <span>Labs Deployment</span>
            <span className="w-1.5 h-1.5 rounded-full bg-stone-200" />
            <span>Ver 0.1</span>
            <span className="w-1.5 h-1.5 rounded-full bg-stone-200" />
            <span className="flex items-center gap-1.5 text-stone-500">
              <Clock size={10} /> Active Testing Period
            </span>
          </div>
        </div>
      </header>

      {/* --- INTERACTIVE GRID CORE --- */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* LEFT COMPLIANCE ACCORDIONS MATRIX */}
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

        {/* RIGHT LABS ASIDE CALLOUT */}
        <aside className="lg:col-span-4 space-y-6 sticky top-8">
          <div className="bg-stone-900 p-8 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden">
            <Beaker size={130} className="absolute -right-12 -bottom-12 opacity-5 text-white" />
            <div className="space-y-2 relative z-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] accent-text">Beta Engine Status</h4>
              <h3 className="text-2xl font-serif italic tracking-tight">Rapid Iteration Cycle</h3>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed font-sans">
              Features deployed under this early access tag offer immediate functional utility but exist within our development sandboxes to polish stability flaws before being mixed into the permanent platform baseline.
            </p>
            <div className="pt-4 border-t border-stone-800 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-stone-400">
              <span>Environment Deployment</span>
              <span className="accent-text">LABS INTERFACES // 2026</span>
            </div>
          </div>
        </aside>

      </main>

      {/* --- BASE SYSTEM FOOTER --- */}
      <footer className="pt-8 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-stone-400">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full accent-bg animate-pulse" />
          <span className="font-black uppercase tracking-widest text-[8px]">Experimental Evaluation Pipeline Online</span>
        </div>
        <p className="font-serif italic">TOTS Operating System Layouts // Labs Compliance</p>
      </footer>

    </div>
  );
}