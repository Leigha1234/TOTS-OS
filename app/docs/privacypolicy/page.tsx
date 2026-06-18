"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Shield, 
  ArrowLeft, 
  Clock, 
  Building2, 
  UserCheck, 
  Database, 
  Cpu, 
  Globe, 
  Lock, 
  Mail, 
  ChevronDown, 
  ChevronUp, 
  FileText 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * TOTS OS: PRIVACY INFRASTRUCTURE DOCUMENTATION
 * Theme: Organic Minimalist (Consistent with System DNA)
 * Target Path: /settings/privacy or /privacy
 */

export default function PrivacyPolicy() {
  const router = useRouter();
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  const toggleSection = (id: number) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const sections = [
    {
      id: 1,
      title: "1. Introduction",
      icon: Shield,
      content: (
        <div className="space-y-4">
          <p>This Privacy Policy explains how TOTS OS (“TOTS OS”, “we”, Our”, “us”) collects, uses, stores, protects, and processes personal data when you use the TOTS OS platform, website, applications, services, and related systems (“Platform”).</p>
          <p>We are committed to protecting privacy and handling data responsibly in accordance with applicable UK data protection laws, including the UK General Data Protection Regulation (“UK GDPR”) and the Data Protection Act 2018.</p>
          <p className="italic text-stone-500">By accessing or using TOTS OS, you acknowledge that you have read and understood this Privacy Policy.</p>
        </div>
      )
    },
    {
      id: 2,
      title: "2. Who We Are",
      icon: Building2,
      content: (
        <div className="space-y-4">
          <p>TOTS OS is operated as a sole trader business based in the United Kingdom.</p>
          <div className="p-6 bg-[#faf9f6] border border-stone-100 rounded-2xl space-y-1 text-xs font-medium text-stone-700">
            <p className="font-bold text-stone-900 uppercase tracking-wider text-[10px] accent-text mb-1">Data Controller Registry:</p>
            <p>TOTS OS</p>
            <p>Samantha Hill</p>
            <p>24 Hebenton Road</p>
            <p>Elgin</p>
            <p>IV30 4EP</p>
            <p className="underline mt-2 block">theorganisedtypes@gmail.com</p>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "3. Scope of This Policy",
      icon: UserCheck,
      content: (
        <div className="space-y-4">
          <p>This Privacy Policy applies to:</p>
          <ul className="list-disc pl-6 space-y-1 text-stone-700">
            <li>Website visitors</li>
            <li>Registered users</li>
            <li>Clients</li>
            <li>Organisations</li>
            <li>Contractors</li>
            <li>Individuals interacting with TOTS OS services</li>
          </ul>
          <p>This Policy covers data collected through:</p>
          <ul className="list-disc pl-6 space-y-1 text-stone-700">
            <li>The TOTS OS platform, websites, and communications</li>
            <li>Integrations, support services, and AI-assisted systems</li>
          </ul>
        </div>
      )
    },
    {
      id: 4,
      title: "4. Information We Collect",
      icon: Database,
      content: (
        <div className="space-y-6">
          {[
            { title: "Account Information", items: ["Name, email address, telephone number", "Company details and billing information", "Account authorization credentials"] },
            { title: "Operational and Business Data", items: ["Workflows and operational records", "Task information and HR records", "Financial information and organisational structures", "Uploaded files, documents, and internal notes"] },
            { title: "Technical Information", items: ["IP address and browser type", "Device information and operating system", "Access logs, usage analytics, and session information"] },
            { title: "AI and Platform Usage Data", items: ["Prompts submitted to AI systems", "Generated outputs and automation interactions", "Search activity and platform usage behavior"] },
            { title: "Communications", items: ["Emails, support requests, feedback, and platform messages"] }
          ].map((cat, i) => (
            <div key={i} className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-stone-800">{cat.title}</h5>
              <ul className="list-disc pl-6 space-y-1 text-stone-600 text-xs">
                {cat.items.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 5,
      title: "5. How We Use Information",
      icon: FileText,
      content: (
        <div className="space-y-4">
          <p>We use personal data to:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-stone-700">
            {[
              "Provide, operate, and maintain the Platform",
              "Manage accounts and process subscriptions",
              "Provide support services and security infrastructure",
              "Improve features and system functionality",
              "Develop and train AI systems using anonymised data",
              "Monitor performance, analytics, and platform stability",
              "Detect and prevent fraud, abuse, or unlawful activity",
              "Comply with legal obligations and communicate system notices"
            ].map((text, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-[#faf9f6] border border-stone-50 rounded-xl text-xs">
                <div className="w-1.5 h-1.5 rounded-full accent-bg mt-1.5 shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
          <p className="font-bold text-stone-900 mt-4 bg-stone-50 p-4 border-l-2 accent-border rounded-r-xl">We do not sell personal data to third parties.</p>
        </div>
      )
    },
    {
      id: 6,
      title: "6. Legal Bases for Processing",
      icon: Lock,
      content: (
        <div className="space-y-4 text-xs">
          {[
            { title: "Contractual Necessity", desc: "Processing required to provide services under our structural agreement with users." },
            { title: "Legitimate Interests", desc: "Processing necessary for improving services, platform administration, fraud prevention, operational analytics, security monitoring, and core business development." },
            { title: "Legal Obligations", desc: "Processing required to comply with applicable UK laws and compliance regulations." },
            { title: "Consent", desc: "Where legally required, we will request explicit consent before initiating specific processing activities." }
          ].map((basis, i) => (
            <div key={i} className="p-4 bg-[#faf9f6] border border-stone-100 rounded-xl space-y-1">
              <span className="font-bold text-stone-900 uppercase tracking-wider text-[10px] accent-text">{basis.title}</span>
              <p className="text-stone-600">{basis.desc}</p>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 7,
      title: "7. AI Processing and Automated Systems",
      icon: Cpu,
      content: (
        <div className="space-y-4">
          <p>TOTS OS uses artificial intelligence, automation, and machine learning systems to generate operational outputs, assist workflows, analyse structured data, improve user experiences, and automate repeatable processes.</p>
          <p>AI systems may process uploaded content, text prompts, operational logs, and system usage patterns. Where possible, data used for platform learning and feature development will be completely anonymised or aggregated.</p>
          <div className="p-4 border border-amber-200 bg-amber-50/40 text-amber-900 rounded-2xl text-xs flex gap-3 items-start">
            <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
            <p><strong>Operational Responsibility:</strong> Users remain responsible for reviewing and validating any AI-generated outputs before external business use.</p>
          </div>
        </div>
      )
    },
    {
      id: 8,
      title: "8. Data Sharing",
      icon: Globe,
      content: (
        <div className="space-y-4">
          <p>We may share information with cloud hosting providers, payment processors, analytics tools, infrastructure providers, professional advisers, and legal or regulatory authorities where required by law.</p>
          <p>Third parties are only provided access where necessary for infrastructure operational nodes. We strictly require service providers to implement appropriate technical security and confidentiality measures. <strong>We do not sell user data.</strong></p>
        </div>
      )
    },
    {
      id: 9,
      title: "9. International Data Transfers",
      icon: Globe,
      content: (
        <div className="space-y-4">
          <p>Some service providers or infrastructure providers may process data outside the United Kingdom.</p>
          <p>Where international data transfers occur, we take all reasonable steps to ensure appropriate safeguards are strictly in place in accordance with UK GDPR requirements and validation frameworks.</p>
        </div>
      )
    },
    {
      id: 10,
      title: "10. Data Retention",
      icon: Clock,
      content: (
        <div className="space-y-4">
          <p>We retain information only for as long as reasonably necessary to provide services, fulfil contractual obligations, comply with legal requirements, resolve system disputes, enforce agreements, and maintain business archives.</p>
          <p>Retention periods vary based on account status, legal obligations, and security configurations. Deleted accounts and associated data blocks may remain in encrypted backup partitions for a limited administrative window.</p>
        </div>
      )
    },
    {
      id: 11,
      title: "11. Security Measures",
      icon: Lock,
      content: (
        <div className="space-y-4">
          <p>We implement technical and organisational security measures designed to protect data against unauthorised access, alteration, disclosure, misuse, or destruction.</p>
          <p>However, no internet-based service or electronic storage system can be guaranteed completely secure. Users are responsible for protecting login credentials, managing internal permissions, and maintaining secure local client devices.</p>
        </div>
      )
    },
    {
      id: 12,
      title: "12. User Rights",
      icon: UserCheck,
      content: (
        <div className="space-y-4">
          <p>Under UK data protection law, you have rights including: access to personal data, correction of inaccurate information, deletion of data, restriction of processing, objection to certain processing, data portability, and withdrawal of consent.</p>
          <p>Requests may be submitted directly using our listed core contact information. We may require identity verification procedures before executing or responding to data requests.</p>
        </div>
      )
    },
    {
      id: 13,
      title: "13. Cookies and Analytics",
      icon: Database,
      content: (
        <div className="space-y-4">
          <p>TOTS OS uses cookies, analytics technologies, session tracking, and performance monitoring tools to maintain platform functionality, improve UI/UX tracking, analyse usage paths, and monitor infrastructure security parameters.</p>
          <p>Users may manage cookie settings through standard browser configuration controls. A separate Cookie Policy may also apply to the system.</p>
        </div>
      )
    },
    {
      id: 14,
      title: "14. Third-Party Services and Integrations",
      icon: Globe,
      content: (
        <div className="space-y-4">
          <p>The Platform integrates with third-party networks or external OAuth applications (including Meta Business API, TikTok Studio, Pinterest, and LinkedIn Nodes).</p>
          <p>We are not responsible for third-party privacy practices, external layouts, or connected services outside our direct infrastructure control. Users should review applicable third-party privacy policies separately.</p>
        </div>
      )
    },
    {
      id: 15,
      title: "15. Children’s Privacy",
      icon: Shield,
      content: (
        <div className="space-y-4">
          <p>TOTS OS is intended solely for users aged 18 years or older operating in a professional business capacity. We do not knowingly collect personal information from children.</p>
        </div>
      )
    },
    {
      id: 16,
      title: "16. Changes to This Privacy Policy",
      icon: Clock,
      content: (
        <div className="space-y-4">
          <p>We may update this Privacy Policy periodically to reflect changing legal, platform, or operational parameters. Updated versions become effective immediately upon publication.</p>
          <p>Continued use of the Platform constitutes acceptance of the current revised Policy parameters.</p>
        </div>
      )
    },
    {
      id: 17,
      title: "17. Contact Information",
      icon: Mail,
      content: (
        <div className="p-6 bg-[#faf9f6] border border-stone-100 rounded-3xl space-y-1 text-xs">
          <p className="font-bold text-stone-900 uppercase tracking-widest text-[10px] accent-text mb-2">Primary Privacy Gateway Contact:</p>
          <p className="font-bold text-stone-800">TOTS OS</p>
          <p>Samantha Hill</p>
          <p>24 Hebenton Road</p>
          <p>Elgin, IV30 4EP</p>
          <p className="pt-2 font-bold underline text-stone-900">theorganisedtypes@gmail.com</p>
        </div>
      )
    },
    {
      id: 18,
      title: "18. Complaints",
      icon: Shield,
      content: (
        <div className="space-y-4">
          <p>If you believe your data has been handled improperly, you have the absolute legal right to lodge a formal complaint with the UK Information Commissioner’s Office (“ICO”).</p>
          <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 inline-block">
            Official Regulator: Information Commissioner's Office (UK ICO)
          </div>
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

      {/* --- BACK ROUTING --- */}
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors group"
      >
        <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> Back to Workspace
      </button>

      {/* --- HEADER BLOCK --- */}
      <header className="border-b border-stone-200 pb-10 space-y-4">
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-stone-100 shadow-sm w-fit accent-text">
          <Shield size={12} fill="currentColor" />
          <p className="font-black uppercase text-[9px] tracking-[0.4em]">System Compliance Architecture</p>
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl md:text-7xl font-serif italic tracking-tighter leading-none text-stone-900">
            Privacy Policy
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 pt-2">
            <span>TOTS OS Matrix</span>
            <span className="w-1.5 h-1.5 rounded-full bg-stone-200" />
            <span>Version 0.1</span>
            <span className="w-1.5 h-1.5 rounded-full bg-stone-200" />
            <span className="flex items-center gap-1.5 text-stone-500">
              <Clock size={10} /> Effective: 16/05/26
            </span>
          </div>
        </div>
      </header>

      {/* --- CORE CONTENT GRID --- */}
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
                      {section.title.split('. ')[1]}
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
                      transition={{ duration: 0.25, ease: "easeInOut" }}
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

        {/* RIGHT QUICK ANCHOR / MEMO VIEW */}
        <aside className="lg:col-span-4 space-y-6 sticky top-8">
          <div className="bg-stone-900 p-8 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden">
            <Shield size={120} className="absolute -right-8 -bottom-8 opacity-5" />
            <div className="space-y-2 relative z-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] accent-text">Platform Assurance</h4>
              <h3 className="text-2xl font-serif italic tracking-tight">Legal Safeguard Matrix</h3>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed font-sans">
              This layout structures data sovereignty parameters for TOTS OS, cloud nodes, and integrated API layers in full alignment with UK data protocols.
            </p>
            <div className="pt-4 border-t border-stone-800 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-stone-400">
              <span>Jurisdiction: United Kingdom</span>
              <span className="accent-text">UK GDPR // ICO</span>
            </div>
          </div>

          <div className="bg-white border border-stone-200 p-6 rounded-[2rem] text-center space-y-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Enquiries Node</p>
            <p className="text-xs font-bold text-stone-900 underline">theorganisedtypes@gmail.com</p>
          </div>
        </aside>

      </main>

      {/* --- REVERSED SYSTEM FOOTER --- */}
      <footer className="pt-8 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-stone-400">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full accent-bg animate-pulse" />
          <span className="font-black uppercase tracking-widest text-[8px]">Data Matrix Nominal</span>
        </div>
        <p className="font-serif italic">TOTS Operating System Layouts // 2026</p>
      </footer>

    </div>
  );
}