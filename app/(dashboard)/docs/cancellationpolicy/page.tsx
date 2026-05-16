"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  CreditCard, 
  ArrowLeft, 
  Clock, 
  XCircle, 
  RefreshCw, 
  AlertTriangle, 
  Mail, 
  ChevronDown, 
  ChevronUp, 
  CalendarDays,
  FileX
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * TOTS OS: REFUND & CANCELLATION COMPLIANCE MODULE
 * Theme: Organic Minimalist (Consistent with System DNA)
 */

export default function CancellationPolicy() {
  const router = useRouter();
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  const toggleSection = (id: number) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const sections = [
    {
      id: 1,
      title: "1. Subscription Services",
      icon: CalendarDays,
      content: (
        <div className="space-y-4">
          <p>TOTS OS operates on a recurring monthly subscription framework structure unless an alternative institutional agreement is explicitly signed in writing.</p>
          <p>Enrolling in a plan initializes an ongoing system commitment, granting continuous deployment access to your workspaces, automations, and data partitions.</p>
        </div>
      )
    },
    {
      id: 2,
      title: "2. Automated Billing Engine",
      icon: CreditCard,
      content: (
        <div className="space-y-4">
          <p>Subscription tiers are billed automatically at the start of each cyclical period using the payment method securely vaulted and provided by the user.</p>
          <p>Account administrators retain total responsibility for maintaining accurate, unexpired billing details within the workspace settings to prevent unexpected background service interruptions.</p>
        </div>
      )
    },
    {
      id: 3,
      title: "3. No Refund Policy Stricture",
      icon: XCircle,
      content: (
        <div className="space-y-4">
          <div className="p-5 border border-stone-950 bg-stone-900 text-stone-100 rounded-3xl text-xs space-y-2">
            <p className="font-black uppercase tracking-widest text-[10px] accent-text flex items-center gap-2">
              <AlertTriangle size={12} /> Definitive Financial Term:
            </p>
            <p className="font-serif italic text-lg leading-tight text-white">All processed system payments are completely non-refundable.</p>
          </div>
          
          <p className="text-xs font-bold uppercase tracking-wider text-stone-800 pt-2">This stricture explicitly applies to:</p>
          <ul className="list-disc pl-6 space-y-1 text-stone-600 text-xs">
            <li>Standard recurring monthly subscription tier fees</li>
            <li>Initial infrastructure setup and baseline configuration fees</li>
            <li>Custom workspace onboarding and professional assistance services</li>
            <li>Partial billing periods, mid-cycle updates, or completely unused access terms</li>
          </ul>

          <p className="text-xs font-bold uppercase tracking-wider text-stone-800 pt-2">No transactional refunds or balance adjustments will be issued for:</p>
          <ul className="list-disc pl-6 space-y-1 text-stone-600 text-xs">
            <li>Platform non-use or general account inactivity</li>
            <li>Voluntary cancellation requested mid-way through an active billing cycle</li>
            <li>Subjective dissatisfaction with platform features, templates, or AI layout performance</li>
            <li>Enforced account suspension or termination resulting from direct breaches of our Acceptable Use Policy</li>
          </ul>
        </div>
      )
    },
    {
      id: 4,
      title: "4. Cancellation Mechanics",
      icon: FileX,
      content: (
        <div className="space-y-4">
          <p>Users may flag their subscription for cancellation at any point via the billing dashboard panel.</p>
          <p>Executing a cancellation flags the system database to prevent future automated renewals but does <strong>not</strong> generate situational refunds for the current active period.</p>
          <p className="p-4 bg-[#faf9f6] border border-stone-100 rounded-xl text-xs text-stone-700">
            <strong>Access Continuity:</strong> Following a successful cancellation request, your workspace access, data engines, and connected social media channels will remain fully active until the natural expiration date of your current pre-paid billing cycle.
          </p>
        </div>
      )
    },
    {
      id: 5,
      title: "5. Failed & Overdue Payments",
      icon: AlertTriangle,
      content: (
        <div className="space-y-4">
          <p>If an automated charge routing fails, the system billing architecture will re-attempt processing. Continued overdue balances or payment transaction failures will automatically trigger system guardrails:</p>
          <ul className="list-disc pl-6 space-y-1 text-stone-700">
            <li>Restricted write-access across workspaces and dashboards</li>
            <li>Immediate suspension of automated social media postings and AI prompt routing</li>
            <li>Permanent account and database partition termination if left un-remedied for an extended window</li>
          </ul>
        </div>
      )
    },
    {
      id: 6,
      title: "6. Pricing and Plan Modifications",
      icon: RefreshCw,
      content: (
        <p>TOTS OS reserves the definitive right to adjust subscription pricing tiers, modify feature bundles, or introduce new modular structures. Reasonable advance notice of any pricing shifts will be provided to active billing contacts before renewal charges execute.</p>
      )
    },
    {
      id: 7,
      title: "7. Billing Inquiries Gateway",
      icon: Mail,
      content: (
        <div className="p-6 bg-[#faf9f6] border border-stone-100 rounded-3xl text-xs space-y-1">
          <p className="font-black uppercase tracking-widest text-[9px] text-stone-400">Primary Billing Support Node:</p>
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

      {/* --- BACK TRACK ROUTE --- */}
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors group"
      >
        <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> Exit to Workspace settings
      </button>

      {/* --- HEADER BLOCK --- */}
      <header className="border-b border-stone-200 pb-10 space-y-4">
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-stone-100 shadow-sm w-fit accent-text">
          <CreditCard size={12} fill="currentColor" className="opacity-80" />
          <p className="font-black uppercase text-[9px] tracking-[0.4em]">Financial Framework Node</p>
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl md:text-7xl font-serif italic tracking-tighter leading-none text-stone-900">
            Refund & Cancellation
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 pt-2">
            <span>Billing Structure</span>
            <span className="w-1.5 h-1.5 rounded-full bg-stone-200" />
            <span>Ver 0.1</span>
            <span className="w-1.5 h-1.5 rounded-full bg-stone-200" />
            <span className="flex items-center gap-1.5 text-stone-500">
              <Clock size={10} /> Active Framework Block
            </span>
          </div>
        </div>
      </header>

      {/* --- CONTENT WORKSPACE GRID --- */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* LEFT COMPLIANCE ACCORDIONS CONTAINER */}
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

        {/* RIGHT QUICK ASSURANCES PANEL */}
        <aside className="lg:col-span-4 space-y-6 sticky top-8">
          <div className="bg-stone-900 p-8 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden">
            <XCircle size={130} className="absolute -right-12 -bottom-12 opacity-5 text-white" />
            <div className="space-y-2 relative z-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] accent-text">Subscription Notice</h4>
              <h3 className="text-2xl font-serif italic tracking-tight">On-Demand Control</h3>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed font-sans">
              Subscriptions run month-to-month and can be flagged for cancellation at any hour. This ensures total workflow flexibility with no lock-in terms or mandatory long-term horizons.
            </p>
            <div className="pt-4 border-t border-stone-800 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-stone-400">
              <span>Tenant Status Control</span>
              <span className="accent-text">M2M TERM // 2026</span>
            </div>
          </div>
        </aside>

      </main>

      {/* --- RUNTIME BASE FOOTER --- */}
      <footer className="pt-8 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-stone-400">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full accent-bg animate-pulse" />
          <span className="font-black uppercase tracking-widest text-[8px]">Billing Matrix Node Active</span>
        </div>
        <p className="font-serif italic">TOTS Operating System Layouts // Billing Compliance</p>
      </footer>

    </div>
  );
}