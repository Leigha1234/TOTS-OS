"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  LifeBuoy, 
  ArrowLeft, 
  Clock, 
  CalendarDays, 
  Zap, 
  Wrench, 
  CloudLightning, 
  ShieldAlert, 
  Sparkles, 
  Mail, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * TOTS OS: SERVICE & SUPPORT POLICY COMPONENT
 * Theme: Organic Minimalist (Consistent with System DNA)
 */

export default function ServiceSupportPolicy() {
  const router = useRouter();
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  const toggleSection = (id: number) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const sections = [
    {
      id: 1,
      title: "1. Overview",
      icon: LifeBuoy,
      content: (
        <div className="space-y-4">
          <p>This Service & Support Policy outlines exactly how engineering, account, and operational support is delivered for TOTS OS and related services operated by The Organised Types (“TOTS”, “we”, “our”, or “us”).</p>
          <p className="italic text-stone-500">By utilizing TOTS OS, you explicitly agree to this policy alongside our core Terms and Conditions, Privacy Framework, and system-wide policies.</p>
        </div>
      )
    },
    {
      id: 2,
      title: "2. Support Availability & Operations",
      icon: CalendarDays,
      content: (
        <div className="space-y-4">
          <p>We aim to maintain an active, reliable, and responsive helpdesk ecosystem for all active workspace subscribers. Primary communication routes include:</p>
          <ul className="list-disc pl-6 space-y-1 text-stone-700 text-xs">
            <li>Direct transactional email support pipelines</li>
            <li>In-app workspace platform messaging modules (where activated on your tier)</li>
            <li>Self-service documentation repositories and knowledge resources</li>
            <li>Scheduled technical onboarding slots or screen-share support calls (where included in your custom contract)</li>
          </ul>
          <div className="p-4 bg-stone-50 border border-stone-100 rounded-2xl text-xs space-y-1">
            <p className="font-bold text-stone-900 uppercase tracking-wider text-[10px]">Core Operational Window:</p>
            <p className="text-stone-600">Monday to Friday, 9:00am – 5:00pm (UK Time), excluding recognized UK and Scottish public holidays.</p>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "3. Service Level Response Targets",
      icon: Zap,
      content: (
        <div className="space-y-4">
          <p>While response targets function as internal operational benchmarks and do not constitute an absolute legal guarantee, our helpdesk aims to triage tickets within the following horizons:</p>
          <div className="space-y-2.5 pt-1">
            {[
              { type: "Critical Platform Issues", time: "Within 1 Business Day", desc: "System-wide outages, catastrophic core database drops, or complete workspace lockouts." },
              { type: "General Support Enquiries", time: "Within 2 Business Days", desc: "Account configurations, interface usage questions, or minor functional layout bugs." },
              { type: "Feature Requests & Non-Urgent Queries", time: "Within 5 Business Days", desc: "Aesthetic suggestions, custom layout templates, or non-breaking tool enhancements." }
            ].map((sla, idx) => (
              <div key={idx} className="p-4 bg-[#faf9f6] border border-stone-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="font-bold text-stone-900 uppercase tracking-wider text-[10px] accent-text block">{sla.type}</span>
                  <p className="text-stone-500 text-xs">{sla.desc}</p>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-stone-900 text-white rounded-full shrink-0 text-center sm:w-44">
                  {sla.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "4. Explicit Scope of Support",
      icon: HelpCircle,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 border border-stone-100 rounded-2xl space-y-2 bg-stone-50/50">
            <span className="font-bold uppercase tracking-widest text-[9px] text-emerald-600 block">✓ Included Scope</span>
            <ul className="space-y-1 text-stone-600 list-inside list-disc">
              <li>Assistance navigating or accessing the platform</li>
              <li>Bug reporting, triage, and background investigation</li>
              <li>Guidance regarding native platform settings</li>
              <li>General platform usage assistance</li>
              <li>Subscription queries & internal workspace billing</li>
            </ul>
          </div>
          <div className="p-4 border border-stone-100 rounded-2xl space-y-2 bg-stone-50/50">
            <span className="font-bold uppercase tracking-widest text-[9px] text-red-500 block">✕ Excluded Scope</span>
            <ul className="space-y-1 text-stone-600 list-inside list-disc">
              <li>Bespoke platform code modifications</li>
              <li>Custom APIs outside standard webhooks</li>
              <li>Debugging unmanaged third-party software</li>
              <li>External business strategy consultancy</li>
              <li>Recovery of manually purged user datasets</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: "5. Platform Maintenance Schedules",
      icon: Wrench,
      content: (
        <p>To keep system containers lightning-fast, we reserve the right to perform routine maintenance, structural updates, security patches, or cloud infrastructure improvements. Where practical, planned service interventions affecting write-access windows will be broadcast to workspace banners in advance. Critical emergency hotfixes may execute at any hour without notice to neutralize ongoing exploits.</p>
      )
    },
    {
      id: 6,
      title: "6. Service Availability Limitations",
      icon: CloudLightning,
      content: (
        <p>We target high infrastructure availability benchmarks but do not warrant uninterrupted, completely lag-free, or error-free operation. Intermittent system disconnects can occasionally stem from upstream routing node drops, third-party social media API changes, network carrier outages, or force majeure events far outside our operational control perimeter.</p>
      )
    },
    {
      id: 7,
      title: "7. Mandatory User Responsibilities",
      icon: ShieldAlert,
      content: (
        <p>System stability remains a shared duty. Users must securely manage internal session tokens, access the system through modern, compliant devices, feed accurate metadata into system structures, and instantly relay any suspicious credential activity or sub-account profile leaks to our infrastructure security team.</p>
      )
    },
    {
      id: 8,
      title: "8. Platform Evolution & Feature Lifecycle",
      icon: Sparkles,
      content: (
        <p>TOTS OS is a continuous delivery software solution. Tools, dashboard layouts, data visualization modules, and automated workflow pathways mutate over time. We retain absolute structural authority to modify platform UI patterns, push experimental components, prune underutilized modules, or tweak recurring plan features to match architectural progress.</p>
      )
    },
    {
      id: 9,
      title: "9. Suspension of Support Services",
      icon: ShieldAlert,
      content: (
        <p>Helpdesk interaction is an elite workspace privilege. We reserve the immediate right to limit, disconnect, or lock support ticket channels for any profiles with past-due billing blocks, verified system-misuse paths, or instances where a user demonstrates hostile, aggressive, or abusive messaging patterns toward our staff.</p>
      )
    },
    {
      id: 10,
      title: "10. Support Contact Registry",
      icon: Mail,
      content: (
        <div className="p-6 bg-[#faf9f6] border border-stone-100 rounded-3xl text-xs space-y-1">
          <p className="font-black uppercase tracking-widest text-[9px] text-stone-400">Primary Helpdesk Intake Matrix:</p>
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

      {/* BACK NAVIGATION */}
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors group"
      >
        <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> Exit to Workspace Hub
      </button>

      {/* HEADER BLOCK */}
      <header className="border-b border-stone-200 pb-10 space-y-4">
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-stone-100 shadow-sm w-fit accent-text">
          <LifeBuoy size={12} fill="currentColor" className="opacity-80" />
          <p className="font-black uppercase text-[9px] tracking-[0.4em]">Helpdesk Operations Matrix</p>
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl md:text-7xl font-serif italic tracking-tighter leading-none text-stone-900">
            Service & Support Policy
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 pt-2">
            <span>TOTS OS Assistance Schedulers</span>
            <span className="w-1.5 h-1.5 rounded-full bg-stone-200" />
            <span>Ver 0.1</span>
            <span className="w-1.5 h-1.5 rounded-full bg-stone-200" />
            <span className="flex items-center gap-1.5 text-stone-500">
              <Clock size={10} /> Live Helpdesk Active
            </span>
          </div>
        </div>
      </header>

      {/* ACCORDIONS AND SIDEBAR GRID */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* COMPLIANCE ACCORDIONS ACCORDION LAYER */}
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

        {/* SIDEBAR CALM COMPLIANCE DECK */}
        <aside className="lg:col-span-4 space-y-6 sticky top-8">
          <div className="bg-stone-900 p-8 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden">
            <Zap size={130} className="absolute -right-12 -bottom-12 opacity-5 text-white" />
            <div className="space-y-2 relative z-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] accent-text">Operational Triage</h4>
              <h3 className="text-2xl font-serif italic tracking-tight">Systematic Resolution</h3>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed font-sans">
              All client telemetry and helpdesk inquiries are logged directly inside our tracking nodes. This setup streamlines data retrieval, isolates workspace bugs quickly, and keeps our systems flowing with calm, professional efficiency.
            </p>
            <div className="pt-4 border-t border-stone-800 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-stone-400">
              <span>SLA Resolution Scope</span>
              <span className="accent-text">TAS SYSTEMS // 2026</span>
            </div>
          </div>
        </aside>

      </main>

      {/* SYSTEM STATUS FOOTER */}
      <footer className="pt-8 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-stone-400">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full accent-bg animate-pulse" />
          <span className="font-black uppercase tracking-widest text-[8px]">Helpdesk Ingestion Routers Nominal</span>
        </div>
        <p className="font-serif italic">TOTS Operating System Layouts // User Assistance Matrix</p>
      </footer>

    </div>
  );
}