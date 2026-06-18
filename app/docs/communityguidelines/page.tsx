"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, 
  ArrowLeft, 
  Clock, 
  HeartHandshake, 
  ShieldAlert, 
  Network, 
  Cpu, 
  EyeOff, 
  Flag, 
  Scale, 
  Mail, 
  ChevronDown, 
  ChevronUp, 
  Compass
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * TOTS OS: COMMUNITY & COLLABORATION GUIDELINES COMPONENT
 * Theme: Organic Minimalist (Consistent with System DNA)
 */

export default function CommunityGuidelines() {
  const router = useRouter();
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  const toggleSection = (id: number) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const sections = [
    {
      id: 1,
      title: "1. Core Purpose & Mission",
      icon: Compass,
      content: (
        <div className="space-y-4">
          <p>TOTS OS is explicitly engineered to support cross-functional collaboration, clean operational clarity, sustainable business growth, and professional community engagement layers.</p>
          <p>To preserve this focus, all active multi-tenant space operators, teams, and collaborative contributors are expected to cultivate an ecosystem rooted in structural accountability and mutual respect.</p>
        </div>
      )
    },
    {
      id: 2,
      title: "2. Professional Conduct Benchmarks",
      icon: HeartHandshake,
      content: (
        <div className="space-y-4">
          <p>When interacting across shared environments, project portals, or organizational streams, users must strictly adhere to our core conversational framework baseline:</p>
          <ul className="list-disc pl-6 space-y-1.5 text-stone-700 text-xs font-medium uppercase tracking-wider grid grid-cols-1 md:grid-cols-2 gap-2">
            <li className="accent-text">Communicate with clear respect</li>
            <li className="accent-text">Maintain professional poise</li>
            <li className="accent-text">Engage honestly and constructively</li>
            <li className="accent-text">Value distinct professional viewpoints</li>
            <li className="accent-text">Block disruptive or harmful interactions</li>
          </ul>
        </div>
      )
    },
    {
      id: 3,
      title: "3. Strictly Prohibited Behaviors",
      icon: ShieldAlert,
      content: (
        <div className="space-y-4">
          <p>To shield the integrity of our platform workspaces, the following behaviors are classified as zero-tolerance infractions and will trigger immediate internal compliance reviews:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-700 text-xs font-mono">
            {[
              "Targeted harassment, bullying, or intimidation",
              "Discriminatory speech or hate-based text strings",
              "Threatening, abusive, or hostile communication",
              "Unsolicited B2B promos, link spam, or advertisement fills",
              "Deceptive execution routes or fraudulent account setups",
              "Spreading deliberate disinformation or false analytics",
              "Malicious script execution using interface parameters",
              "Uploading unlawful, exploit-laden, or destructive files",
              "Attempts to break environment firewalls or network probes"
            ].map((prohibited, idx) => (
              <div key={idx} className="p-3 bg-stone-50 border border-stone-100 rounded-xl flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <span>{prohibited}</span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "4. Cross-Tenant Collaboration Standards",
      icon: Network,
      content: (
        <div className="space-y-4">
          <p>When utilizing multi-tenant invitation protocols or sharing project kanbans through external links, collaborators are bound by professional-grade ethical requirements:</p>
          <ul className="list-disc pl-6 space-y-2 text-stone-700 text-xs leading-relaxed">
            <li><strong>Responsible Distribution:</strong> Confirming recipient authorization loops before broadcasting deep database views.</li>
            <li><strong>Confidentiality Alignment:</strong> Honoring internal team boundaries and preventing cross-client parameter leakage.</li>
            <li><strong>Attribution Integrity:</strong> Accurately crediting structural framework contributors, workflow designers, and original authors.</li>
            <li><strong>Ethical Resource Allocation:</strong> Operating cloud automation queues and data parsing engines without triggering unmanaged rate-limit stress spikes.</li>
          </ul>
        </div>
      )
    },
    {
      id: 5,
      title: "5. Algorithmic & Automation Constraints",
      icon: Cpu,
      content: (
        <div className="space-y-4">
          <p>Integrated transformer networks, AI layers, and automated bulk-scheduling modules within TOTS OS must never be leveraged to execute high-velocity deceptive actions. Users are strictly barred from using core tools to:</p>
          <ul className="list-disc pl-6 space-y-1 text-stone-600 list-inside text-xs">
            <li>Generate or route unlawful content blocks</li>
            <li>Obfuscate real identity to intentionally mislead or spoof endpoints</li>
            <li>Automate coordinated messaging harassment patterns or spam campaigns</li>
            <li>Process parameters that infringe on registered third-party copyrights</li>
            <li>Forge deceptive text outputs designed to mask financial or legal compliance realities</li>
          </ul>
          <p className="p-4 bg-[#faf9f6] border border-stone-100 rounded-xl text-xs text-stone-700 font-bold">
            Reminder: Human account owners retain full, un-delegated legal and compliance liability for all data elements generated by AI-assisted models.
          </p>
        </div>
      )
    },
    {
      id: 6,
      title: "6. Handling Confidential Shared Information",
      icon: EyeOff,
      content: (
        <p>Workspace contributors must not broadcast, paste, or cache any sensitive identity details, proprietary trade files, or guarded enterprise metadata without acquiring clear, written clearance from the data controller. TOTS OS acts strictly as a neutral transmission pipe and disclaims all liability regarding the exposure of records voluntarily dumped into shared collaborative chats or public project boards.</p>
      )
    },
    {
      id: 7,
      title: "7. Reporting and Escalation Portals",
      icon: Flag,
      content: (
        <p>If you encounter breaking behavioral patterns, exploit vectors, active profile harassment, or direct guideline circumvention across a workspace, you are strongly encouraged to document and report the incident log to our trust and safety group. All submissions undergo confidential, forensic verification reviews by our compliance leads.</p>
      )
    },
    {
      id: 8,
      title: "8. Enforcement Metrics & Sanctions",
      icon: Scale,
      content: (
        <div className="space-y-4">
          <p>Verified breaches of this behavioral charter will result in graduated infrastructure sanctions tailored to protect platform health. Enforcement runbooks include:</p>
          <div className="space-y-2 text-xs">
            {[
              { level: "Level I: Content Removal", desc: "Targeted purging of violating text inputs, media attachments, or malformed fields." },
              { level: "Level II: Formal Warning", desc: "Written behavioral tracking alert transmitted to the primary tenant workspace profile." },
              { level: "Level III: Operational Restriction", desc: "Temporary write-access block, disabling messaging engines, AI prompting, and scheduling pipelines." },
              { level: "Level IV: Permanent Termination", desc: "Irrevocable closure of the account, wiping active sub-tenants and database partitions without a refund." }
            ].map((sanction, index) => (
              <div key={index} className="p-3.5 bg-[#faf9f6] border border-stone-100 rounded-2xl flex justify-between items-start gap-4">
                <span className="font-bold text-stone-900 tracking-wider text-[10px] uppercase shrink-0 w-44">{sanction.level}</span>
                <p className="text-stone-600 leading-relaxed">{sanction.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-stone-500 italic pt-1">Severe or flagrant instances of corporate espionage or digital system exploitation will trigger immediate referral to law enforcement and Scottish civil courts.</p>
        </div>
      )
    },
    {
      id: 9,
      title: "9. Policy Revisions & Continuity",
      icon: Compass,
      content: (
        <p>These code-of-conduct benchmarks mutate to stay ahead of changing cloud compliance guidelines, network vulnerabilities, and regional legal structures. Continuous usage of the platform following any updated behavioral framework release acts as a binding acceptance of the refreshed operational terms.</p>
      )
    },
    {
      id: 10,
      title: "10. Trust & Safety Contact",
      icon: Mail,
      content: (
        <div className="p-6 bg-[#faf9f6] border border-stone-100 rounded-3xl text-xs space-y-1">
          <p className="font-black uppercase tracking-widest text-[9px] text-stone-400">Trust & Safety Desk Intake Node:</p>
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

      {/* BACK TRACK NAVIGATION */}
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors group"
      >
        <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> Exit to Governance Base
      </button>

      {/* HEADER SECTION */}
      <header className="border-b border-stone-200 pb-10 space-y-4">
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-stone-100 shadow-sm w-fit accent-text">
          <Users size={12} fill="currentColor" className="opacity-80" />
          <p className="font-black uppercase text-[9px] tracking-[0.4em]">Behavioral Integrity Charter</p>
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl md:text-7xl font-serif italic tracking-tighter leading-none text-stone-900">
            Community & Collaboration Guidelines
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 pt-2">
            <span>TOTS OS Code of Conduct</span>
            <span className="w-1.5 h-1.5 rounded-full bg-stone-200" />
            <span>Ver 0.1</span>
            <span className="w-1.5 h-1.5 rounded-full bg-stone-200" />
            <span className="flex items-center gap-1.5 text-stone-500">
              <Clock size={10} /> Guidelines Active
            </span>
          </div>
        </div>
      </header>

      {/* ACCORDION ACCORDION INTERFACES AND PANEL ASIDE GRID */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* LEFT COMPLIANCE CONTENT COMPONENT */}
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

        {/* RIGHT SIDEBAR PANEL GLANCE CARD */}
        <aside className="lg:col-span-4 space-y-6 sticky top-8">
          <div className="bg-stone-900 p-8 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden">
            <Users size={130} className="absolute -right-12 -bottom-12 opacity-5 text-white" />
            <div className="space-y-2 relative z-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] accent-text">Culture Shield</h4>
              <h3 className="text-2xl font-serif italic tracking-tight">Safe Interaction</h3>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed font-sans">
              This charter safeguards multi-tenant workflows and text prompts from toxic vectors, keeping our shared workspaces clean, reliable, and executing with calm, professional efficiency.
            </p>
            <div className="pt-4 border-t border-stone-800 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-stone-400">
              <span>Environment Security</span>
              <span className="accent-text">TOTS CHARTER // 2026</span>
            </div>
          </div>
        </aside>

      </main>

      {/* DATA FOOTER */}
      <footer className="pt-8 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-stone-400">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full accent-bg animate-pulse" />
          <span className="font-black uppercase tracking-widest text-[8px]">Behavioral Evaluation Scanners Active</span>
        </div>
        <p className="font-serif italic">TOTS Operating System Layouts // Behavioral Matrix</p>
      </footer>

    </div>
  );
}