"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Cookie, 
  ArrowLeft, 
  Clock, 
  ShieldCheck, 
  Eye, 
  Sliders, 
  RefreshCw, 
  Mail, 
  ChevronDown, 
  ChevronUp, 
  Settings2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * TOTS OS: COOKIE COMPLIANCE ENGINE
 * Theme: Organic Minimalist (Consistent with System DNA)
 */

export default function CookiePolicy() {
  const router = useRouter();
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  const toggleSection = (id: number) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const sections = [
    {
      id: 1,
      title: "1. Introduction",
      icon: Cookie,
      content: (
        <div className="space-y-4">
          <p>This Cookie Policy explains how TOTS OS (“we”, Our”, “us”) uses cookies and similar technologies when you use the TOTS OS platform, website, applications, and related services.</p>
          <p className="italic text-stone-500">By continuing to use TOTS OS, you consent to the use of cookies in accordance with this Policy unless disabled through browser or device settings.</p>
        </div>
      )
    },
    {
      id: 2,
      title: "2. What Are Cookies?",
      icon: Eye,
      content: (
        <div className="space-y-4">
          <p>Cookies are small text files stored on your device when you visit a website or use an online platform.</p>
          <p>Cookies help platforms function correctly, improve user experience, remember user preferences, maintain secure sessions, and analyse platform performance variables.</p>
        </div>
      )
    },
    {
      id: 3,
      title: "3. Types of Cookies We Use",
      icon: Settings2,
      content: (
        <div className="space-y-6">
          {[
            { title: "Essential Cookies", desc: "Required for account login, authentication, security, session management, and core platform functionality. These cookies cannot usually be disabled.", badge: "Required" },
            { title: "Performance and Analytics Cookies", desc: "Used to understand anonymous usage patterns, improve dashboard features, monitor performance parameters, and identify intermittent technical issues.", badge: "Optional" },
            { title: "Functional Cookies", desc: "Used to remember localized workspace settings, store user interface preferences, improve usability, and customise overall user experiences.", badge: "Optional" },
            { title: "Security Cookies", desc: "Used to prevent cross-site fraud, detect suspicious login activity, maintain platform integrity, and securely protect user accounts.", badge: "Required" }
          ].map((cookie, i) => (
            <div key={i} className="p-4 bg-[#faf9f6] border border-stone-100 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-900 uppercase tracking-wider text-[10px] accent-text">{cookie.title}</span>
                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${cookie.badge === 'Required' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-400 border-stone-200'}`}>{cookie.badge}</span>
              </div>
              <p className="text-stone-600 text-xs leading-relaxed">{cookie.desc}</p>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 4,
      title: "4. Third-Party Cookies",
      icon: ShieldCheck,
      content: (
        <div className="space-y-4">
          <p>Some third-party services integrated into TOTS OS may place cookies or tracking technologies inside your browser context. These may include analytics providers, payment processors, cloud infrastructure nodes, and external authentication engines (such as Meta or LinkedIn API gateways).</p>
          <p>We do not control third-party cookies directly. Users should review relevant third-party privacy policies separately.</p>
        </div>
      )
    },
    {
      id: 5,
      title: "5. Managing Cookies",
      icon: Sliders,
      content: (
        <div className="space-y-4">
          <p>Users can completely disable cookies through individual browser configuration panels, delete existing stored cookies, or block automated tracking technologies entirely.</p>
          <p className="p-4 border border-amber-200 bg-amber-50/40 text-amber-900 rounded-2xl text-xs font-medium">
            Please note: Disabling certain essential or operational cookies may directly break platform functionality or disconnect active API synchronization layers.
          </p>
        </div>
      )
    },
    {
      id: 6,
      title: "6. Updates",
      icon: RefreshCw,
      content: (
        <p>We may update this Cookie Policy periodically to match architectural changes or regulatory compliance updates. Continued use of TOTS OS constitutes acceptance of updated versions.</p>
      )
    },
    {
      id: 7,
      title: "7. Contact Node",
      icon: Mail,
      content: (
        <div className="p-6 bg-[#faf9f6] border border-stone-100 rounded-3xl text-xs space-y-1">
          <p className="font-bold text-stone-800">TOTS OS Infrastructure Registry</p>
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

      <button onClick={() => router.back()} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors group">
        <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> Back to System Configuration
      </button>

      <header className="border-b border-stone-200 pb-10 space-y-4">
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-stone-100 shadow-sm w-fit accent-text">
          <Cookie size={12} fill="currentColor" />
          <p className="font-black uppercase text-[9px] tracking-[0.4em]">Tracking & Session Architecture</p>
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl md:text-7xl font-serif italic tracking-tighter leading-none text-stone-900">Cookie Policy</h1>
          <div className="flex flex-wrap items-center gap-6 text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 pt-2">
            <span>TOTS OS Storage</span>
            <span className="w-1.5 h-1.5 rounded-full bg-stone-200" />
            <span>Ver 0.1</span>
            <span className="w-1.5 h-1.5 rounded-full bg-stone-200" />
            <span className="flex items-center gap-1.5 text-stone-500"><Clock size={10} /> Active Framework</span>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-8 space-y-4">
          {sections.map((section) => {
            const isExpanded = expandedSection === section.id;
            const Icon = section.icon;

            return (
              <div key={section.id} className={`bg-white border rounded-[2rem] transition-all duration-300 overflow-hidden ${isExpanded ? 'border-stone-900 shadow-xl' : 'border-stone-200 shadow-sm'}`}>
                <button onClick={() => toggleSection(section.id)} className="w-full p-6 md:p-8 flex items-center justify-between text-left group">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-colors ${isExpanded ? 'accent-bg text-white' : 'bg-stone-50 text-stone-400 group-hover:text-stone-900'}`}>
                      <Icon size={16} />
                    </div>
                    <h3 className="font-serif italic text-xl md:text-2xl text-stone-900 tracking-tight">{section.title.split('. ')[1]}</h3>
                  </div>
                  {isExpanded ? <ChevronUp size={16} className="text-stone-400" /> : <ChevronDown size={16} className="text-stone-300 group-hover:text-stone-900" />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <div className="px-6 md:px-8 pb-8 text-sm text-stone-600 font-sans leading-relaxed border-t border-stone-50 pt-6">{section.content}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <aside className="lg:col-span-4 space-y-6 sticky top-8">
          <div className="bg-stone-900 p-8 rounded-[2.5rem] text-white space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] accent-text">Data Minimisation</h4>
            <p className="text-xs text-stone-400 leading-relaxed">We strictly design our data persistence layer to store only what is functional and required for workspace performance tracking.</p>
          </div>
        </aside>
      </main>
    </div>
  );
}