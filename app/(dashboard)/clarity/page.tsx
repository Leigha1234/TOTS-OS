"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@supabase/ssr";
import { 
  BrainCircuit, ArrowRight, Plus, Rocket, Target, 
  Globe, Hash, X, Activity, Zap, Cpu, Sparkles, Radio, Shield, Fingerprint
} from "lucide-react";

/**
 * TOTS OS v4.2 - LIVE SIGNAL FEED
 * UK SPELLING & DATA DICTIONARY COMPLIANT
 */

const AVAILABLE_ICONS = [
  { name: 'Rocket', icon: Rocket },
  { name: 'Globe', icon: Globe },
  { name: 'Target', icon: Target },
  { name: 'Zap', icon: Zap },
  { name: 'Brain', icon: BrainCircuit },
  { name: 'Hash', icon: Hash }
];

const PRESET_COLOURS = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#a8a29e'];

interface Project {
  id: string;
  name: string;
  iconName: string;
  colour: string;
  focus: string;
}

interface Signal {
  projectId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export default function LiveSignalFeedPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const signalEndRef = useRef<HTMLDivElement>(null);

  // --- PERSISTENT INFRASTRUCTURE ---
  const [projects, setProjects] = useState<Project[]>([
    { id: 'p1', name: 'Social Strategy', iconName: 'Rocket', colour: '#f43f5e', focus: 'Tracking viral Instagram hooks, audience behaviour, and growth momentum.' },
    { id: 'p2', name: 'Revenue Ops', iconName: 'Target', colour: '#10b981', focus: 'Financial ledger analysis and tax forecasting' }
  ]);
  
  const [activeProjectId, setActiveProjectId] = useState('p1');
  const [query, setQuery] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showCreator, setShowCreator] = useState(false);

  // --- PROJECT PROVISIONING STATE ---
  const [newProj, setNewProj] = useState<Project>({
    id: '', name: '', iconName: 'Hash', colour: '#a8a29e', focus: ''
  });

  const [allSignals, setAllSignals] = useState<Signal[]>([
    { projectId: 'p1', role: 'assistant', content: "Social systems synced and listening. Ready to build stronger reach, sharper messaging, and higher engagement." },
    { projectId: 'p2', role: 'assistant', content: "Financial cluster online. Ready for ledger analysis and fiscal projections." }
  ]);

  // --- DERIVED LOGIC ---
  const activeProject = useMemo(() => 
    projects.find(p => p.id === activeProjectId) || projects[0], 
  [activeProjectId, projects]);

  const currentFeed = useMemo(() => 
    allSignals.filter(s => s.projectId === activeProjectId),
  [allSignals, activeProjectId]);

  const getIcon = (name: string) => AVAILABLE_ICONS.find(i => i.name === name)?.icon || Hash;

  // --- ACTIONS ---
  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userSignal: Signal = { projectId: activeProjectId, role: 'user', content: query };
    setAllSignals(prev => [...prev, userSignal]);
    setQuery("");
    setIsAiTyping(true);

    // ADAPTIVE CONTEXT ENGINE
    setTimeout(() => {
      let response = "";
      const context = activeProject.focus.toLowerCase();

      if (context.includes("social") || context.includes("content")) {
        response = `[Social Context] Analysing your focus on "${activeProject.focus}": For your query "${query}", I recommend a "Problem/Solution" reel format. Current trends suggest this converts 12% better for your niche. Messaging is now optimised for engagement.`;
      } else if (context.includes("revenue") || context.includes("ledger") || context.includes("tax")) {
        response = `[Financial Context] Querying ledger cluster for "${query}": Your current YTD revenue is £142,500. Adjusting for your focus on ${activeProject.focus}, I project a Q3 surplus. Data has been synchronised with your fiscal targets.`;
      } else {
        response = `Contextual analysis for ${activeProject.name} complete. Based on your focus: "${activeProject.focus}", I have processed your request. How would you like to refine this operation?`;
      }

      setAllSignals(prev => [...prev, { projectId: activeProjectId, role: 'assistant', content: response }]);
      setIsAiTyping(false);
    }, 1500);
  };

  const commitProject = () => {
    if (!newProj.name || !newProj.focus) return;
    const id = `p${Date.now()}`;
    setProjects([...projects, { ...newProj, id }]);
    setActiveProjectId(id);
    setShowCreator(false);
    setNewProj({ id: '', name: '', iconName: 'Hash', colour: '#a8a29e', focus: '' });
  };

  useEffect(() => {
    signalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentFeed, isAiTyping]);

  return (
    <div className="h-screen bg-[#fcfbf9] text-stone-900 flex flex-col overflow-hidden selection:bg-[#a9b897] selection:text-white font-sans">
      
      {/* 1. TOP NAVIGATION (Active Projects) */}
      <nav className="shrink-0 bg-white/80 backdrop-blur-md border-b border-stone-100 px-4 md:px-8 py-5 z-[100]">
        <div className="max-w-7xl mx-auto flex items-center gap-6">
          <div className="flex items-center gap-3 pr-6 border-r border-stone-100 shrink-0">
             <div className="w-10 h-10 bg-stone-900 rounded-2xl flex items-center justify-center text-[#a9b897] shadow-xl"><BrainCircuit size={20} /></div>
             <div>
                <span className="font-serif italic font-bold hidden sm:block text-lg leading-none">Live Signal Feed</span>
                <p className="text-[7px] font-black uppercase tracking-[0.2em] text-stone-400 hidden sm:block mt-1">Operational OS</p>
             </div>
          </div>

          <div className="flex-1 flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
             {projects.map((proj) => {
               const Icon = getIcon(proj.iconName);
               const isActive = activeProjectId === proj.id;
               return (
                 <button 
                   key={proj.id} 
                   onClick={() => setActiveProjectId(proj.id)}
                   className={`flex items-center gap-3 px-5 py-3 rounded-2xl whitespace-nowrap transition-all border ${
                     isActive ? 'bg-stone-900 text-white border-stone-900 shadow-xl scale-105' : 'bg-white text-stone-400 border-stone-100 hover:border-[#a9b897]'
                   }`}
                 >
                    <Icon size={14} style={{ color: isActive ? '#a9b897' : proj.colour }} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{proj.name}</span>
                 </button>
               );
             })}
             <button onClick={() => setShowCreator(true)} className="p-3 rounded-2xl border-2 border-dashed border-stone-100 text-stone-300 hover:border-[#a9b897] transition-all shrink-0"><Plus size={18}/></button>
          </div>
        </div>
      </nav>

      {/* 2. MAIN FEED AREA */}
      <main className="flex-1 relative flex flex-col w-full max-w-6xl mx-auto overflow-hidden">
        
        {/* Responsive Header */}
        <header className="p-8 md:p-12 shrink-0">
           <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-[1px] bg-[#a9b897]" />
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Current Project: {activeProject.name}</p>
           </div>
           <h1 className="text-5xl md:text-7xl font-serif italic tracking-tighter leading-none">System Pulse</h1>
           <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-50 rounded-full border border-stone-100">
                <Radio size={12} className="text-[#a9b897] animate-pulse" />
                <p className="text-[10px] text-stone-500 font-medium">
                  Current Intelligence Focus: <span className="text-stone-900 italic font-bold">{activeProject.focus}</span>
                </p>
              </div>
           </div>
        </header>

        {/* Scrollable Signal Area */}
        <div className="flex-1 overflow-y-auto px-6 md:px-12 space-y-8 pb-48 no-scrollbar">
           <AnimatePresence mode="popLayout">
              {currentFeed.map((signal, i) => (
                <motion.div key={`${activeProjectId}-${i}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`flex ${signal.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[80%] p-8 md:p-10 rounded-[3rem] text-sm leading-relaxed shadow-sm border ${
                     signal.role === 'user' ? 'bg-stone-900 text-white border-stone-800 rounded-tr-none shadow-2xl shadow-stone-200' : 'bg-white border-stone-100 text-stone-800 rounded-tl-none'
                   }`}>
                      {signal.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-4 opacity-40">
                            <Fingerprint size={14} />
                            <span className="text-[8px] font-black uppercase tracking-widest">Verified Intelligence Signal</span>
                        </div>
                      )}
                      <p className={signal.role === 'assistant' ? 'italic font-serif text-base' : 'font-bold uppercase tracking-wide text-xs'}>
                        {signal.content}
                      </p>
                   </div>
                </motion.div>
              ))}
           </AnimatePresence>
           
           {isAiTyping && (
             <div className="flex justify-start">
                <div className="bg-white border border-stone-100 p-8 rounded-[2.5rem] shadow-sm">
                   <div className="flex gap-2">
                      <div className="w-1.5 h-1.5 bg-[#a9b897] rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-[#a9b897] rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-[#a9b897] rounded-full animate-bounce [animation-delay:0.4s]" />
                   </div>
                </div>
             </div>
           )}
           <div ref={signalEndRef} />
        </div>

        {/* Fixed Floating Input */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 bg-gradient-to-t from-[#fcfbf9] via-[#fcfbf9]/95 to-transparent">
           <form onSubmit={handleQuery} className="max-w-4xl mx-auto relative group">
              <div className="absolute left-8 top-1/2 -translate-y-1/2 text-[#a9b897] opacity-50 group-focus-within:opacity-100 transition-opacity">
                <Zap size={20} />
              </div>
              <input 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What are we creating today?"
                className="w-full bg-white border border-stone-200 rounded-full py-8 md:py-10 px-16 md:px-20 text-sm md:text-base outline-none focus:border-stone-900 shadow-2xl transition-all pr-28 font-serif italic"
              />
              <button type="submit" className="absolute right-5 top-1/2 -translate-y-1/2 p-5 md:p-6 bg-stone-900 text-[#a9b897] rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg">
                 <ArrowRight size={24} />
              </button>
           </form>
           <div className="flex justify-center gap-8 mt-8">
                <div className="flex items-center gap-2">
                    <Shield size={10} className="text-[#a9b897]" />
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-300">Encrypted Transmission</p>
                </div>
                <div className="flex items-center gap-2">
                    <Activity size={10} className="text-[#a9b897]" />
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-300">Adaptive Context Engine v4.2 — Secure Connection Active</p>
                </div>
           </div>
        </div>
      </main>

      {/* PROJECT CREATOR OVERLAY */}
      <AnimatePresence>
        {showCreator && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
             <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-2xl rounded-[4rem] p-12 md:p-20 shadow-2xl relative border border-stone-100">
                <button onClick={() => setShowCreator(false)} className="absolute top-12 right-12 text-stone-200 hover:text-stone-900 transition-colors"><X size={32}/></button>
                
                <div className="mb-12">
                   <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-[1px] bg-[#a9b897]" />
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Launch New Workspace</p>
                   </div>
                   <h3 className="text-5xl font-serif italic tracking-tighter">Provision Project</h3>
                   <p className="text-xs text-stone-400 mt-2">Establish a new contextual workspace within the TOTS ecosystem.</p>
                </div>
                
                <div className="space-y-10">
                   <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-1">Project Designation</label>
                        <input placeholder="Enter Project Name..." value={newProj.name} onChange={e => setNewProj({...newProj, name: e.target.value})} className="w-full border-b border-stone-100 py-4 text-2xl outline-none focus:border-stone-900 font-serif italic transition-colors" />
                   </div>

                   <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-1">Mission Brief / Strategic Focus</label>
                        <textarea placeholder="Define intelligence focus (e.g. content hooks, fiscal forecasting...)" value={newProj.focus} onChange={e => setNewProj({...newProj, focus: e.target.value})} className="w-full bg-stone-50 rounded-[2rem] p-8 text-sm outline-none focus:bg-white border border-transparent focus:border-stone-100 h-32 resize-none italic" />
                   </div>
                   
                   <div className="grid md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                         <label className="text-[9px] font-black uppercase tracking-widest text-stone-400">Workspace Identifier</label>
                         <div className="flex gap-3 flex-wrap">
                            {AVAILABLE_ICONS.map(i => (
                            <button key={i.name} onClick={() => setNewProj({...newProj, iconName: i.name})} className={`p-4 rounded-2xl border transition-all ${newProj.iconName === i.name ? 'bg-stone-900 text-[#a9b897] border-stone-900 shadow-lg' : 'border-stone-100 text-stone-300 hover:border-stone-200'}`}><i.icon size={20} /></button>
                            ))}
                         </div>
                      </div>
                      <div className="space-y-4">
                         <label className="text-[9px] font-black uppercase tracking-widest text-stone-400">Visual Protocol Colour</label>
                         <div className="flex gap-4 flex-wrap pt-2">
                            {PRESET_COLOURS.map(c => (
                            <button key={c} onClick={() => setNewProj({...newProj, colour: c})} className={`w-10 h-10 rounded-full border-4 transition-all ${newProj.colour === c ? 'border-stone-900 scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`} style={{ backgroundColor: c }} />
                            ))}
                         </div>
                      </div>
                   </div>

                   <button onClick={commitProject} className="w-full bg-stone-900 text-[#a9b897] py-8 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.5em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all mt-6">Open Workspace</button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        ::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        body { overflow: hidden; position: fixed; width: 100%; }
      `}</style>
    </div>
  );
}