"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@supabase/ssr";
import { 
  BrainCircuit, ArrowRight, Plus, Rocket, Target, 
  Globe, Hash, X, Activity, Zap, Cpu, Sparkles, Radio, Shield, Fingerprint,
  Command, ChevronRight, LayoutGrid
} from "lucide-react";

/**
 * TOTS OS v5.0 - GEMINI PROTOCOL
 * THEMATIC: FLUID INTELLIGENCE & HIGH DENSITY
 */

const AVAILABLE_ICONS = [
  { name: 'Rocket', icon: Rocket },
  { name: 'Globe', icon: Globe },
  { name: 'Target', icon: Target },
  { name: 'Zap', icon: Zap },
  { name: 'Brain', icon: BrainCircuit },
  { name: 'Hash', icon: Hash }
];

const PRESET_COLOURS = ['#A9B897', '#3b82f6', '#10b981', '#8b5cf6', '#a8a29e'];

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
  const signalEndRef = useRef<HTMLDivElement>(null);

  const [projects, setProjects] = useState<Project[]>([
    { id: 'p1', name: 'Social Strategy', iconName: 'Rocket', colour: '#A9B897', focus: 'Tracking viral Instagram hooks, audience behaviour, and growth momentum.' },
    { id: 'p2', name: 'Revenue Ops', iconName: 'Target', colour: '#3b82f6', focus: 'Financial ledger analysis and tax forecasting' }
  ]);
  
  const [activeProjectId, setActiveProjectId] = useState('p1');
  const [query, setQuery] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [newProj, setNewProj] = useState<Project>({
    id: '', name: '', iconName: 'Hash', colour: '#A9B897', focus: ''
  });

  const [allSignals, setAllSignals] = useState<Signal[]>([
    { projectId: 'p1', role: 'assistant', content: "Social systems synced. I am monitoring engagement nodes and viral patterns. How shall we influence the feed today?" },
    { projectId: 'p2', role: 'assistant', content: "Financial cluster online. Ready for ledger analysis and fiscal projections." }
  ]);

  const activeProject = useMemo(() => 
    projects.find(p => p.id === activeProjectId) || projects[0], 
  [activeProjectId, projects]);

  const currentFeed = useMemo(() => 
    allSignals.filter(s => s.projectId === activeProjectId),
  [allSignals, activeProjectId]);

  const getIcon = (name: string) => AVAILABLE_ICONS.find(i => i.name === name)?.icon || Hash;

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userSignal: Signal = { projectId: activeProjectId, role: 'user', content: query };
    setAllSignals(prev => [...prev, userSignal]);
    setQuery("");
    setIsAiTyping(true);

    setTimeout(() => {
      let response = `Analysing "${query}" within the ${activeProject.name} framework. Based on current parameters, I recommend pivoting toward a high-density content model. Data suggests a 15% increase in retention when using this logic.`;
      setAllSignals(prev => [...prev, { projectId: activeProjectId, role: 'assistant', content: response }]);
      setIsAiTyping(false);
    }, 1500);
  };

  useEffect(() => {
    signalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentFeed, isAiTyping]);

  return (
    <div className="h-screen bg-[#FDFDFC] text-stone-900 flex flex-col overflow-hidden selection:bg-[#A9B897]/30 font-sans relative">
      
      {/* GEMINI GRADIENT OVERLAY */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#A9B897]/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
      </div>

      {/* TOP BAR */}
      <nav className="shrink-0 h-20 border-b border-stone-100/60 flex items-center justify-between px-8 bg-white/40 backdrop-blur-xl z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center text-[#A9B897]">
            <Sparkles size={16} fill="currentColor" />
          </div>
          <div className="h-4 w-[1px] bg-stone-200 mx-2" />
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-[50vw]">
            {projects.map((proj) => (
              <button 
                key={proj.id} 
                onClick={() => setActiveProjectId(proj.id)}
                className={`px-4 py-1.5 rounded-full text-[11px] font-bold tracking-tight transition-all whitespace-nowrap ${
                  activeProjectId === proj.id 
                  ? 'bg-stone-900 text-white' 
                  : 'text-stone-400 hover:bg-stone-100'
                }`}
              >
                {proj.name}
              </button>
            ))}
            <button onClick={() => setShowCreator(true)} className="p-1.5 text-stone-300 hover:text-stone-900 transition-colors">
              <Plus size={16}/>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-stone-100 rounded-full border border-stone-200/50">
            <div className="w-1.5 h-1.5 bg-[#A9B897] rounded-full animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-stone-500">Live Pulse</span>
          </div>
          <button className="text-stone-400 hover:text-stone-900"><LayoutGrid size={20}/></button>
        </div>
      </nav>

      {/* CHAT INTERFACE */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative z-10 pt-12 pb-40">
        <div className="max-w-3xl mx-auto px-6 space-y-12">
          
          {/* INTRO LOGIC */}
          {currentFeed.length < 2 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-20 text-center">
              <h2 className="text-4xl font-serif italic text-stone-400 mb-2">Hello, Leigha.</h2>
              <p className="text-stone-400 text-sm">Active Node: <span className="text-stone-900 font-bold uppercase tracking-widest text-[10px]">{activeProject.name}</span></p>
            </motion.div>
          )}

          <AnimatePresence mode="popLayout">
            {currentFeed.map((signal, i) => (
              <motion.div 
                key={`${activeProjectId}-${i}`} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="group"
              >
                <div className={`flex items-start gap-6 ${signal.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                    signal.role === 'user' ? 'bg-stone-100 border-stone-200' : 'bg-stone-900 border-stone-900'
                  }`}>
                    {signal.role === 'user' ? <UserIcon size={14} className="text-stone-400" /> : <Sparkles size={14} className="text-[#A9B897]" />}
                  </div>
                  <div className={`flex-1 pt-1 ${signal.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <p className={`text-[15px] leading-[1.7] ${
                      signal.role === 'assistant' 
                      ? 'font-serif italic text-stone-800 text-lg' 
                      : 'font-bold uppercase tracking-tight text-stone-900'
                    }`}>
                      {signal.content}
                    </p>
                    {signal.role === 'assistant' && (
                      <div className="mt-4 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-[9px] font-black uppercase tracking-widest text-stone-300 hover:text-[#A9B897]">Copy</button>
                        <button className="text-[9px] font-black uppercase tracking-widest text-stone-300 hover:text-[#A9B897]">Regenerate</button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isAiTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-6">
              <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center animate-pulse">
                <Sparkles size={14} className="text-[#A9B897]" />
              </div>
              <div className="flex gap-1.5 pt-3">
                <div className="w-1 h-1 bg-[#A9B897] rounded-full animate-bounce" />
                <div className="w-1 h-1 bg-[#A9B897] rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1 h-1 bg-[#A9B897] rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </motion.div>
          )}
          <div ref={signalEndRef} />
        </div>
      </main>

      {/* INPUT BAR */}
      <div className="shrink-0 pb-10 px-6 z-50">
        <div className="max-w-3xl mx-auto relative group">
          <form onSubmit={handleQuery} className="relative bg-white border border-stone-200/60 shadow-2xl shadow-stone-200/40 rounded-[2.5rem] p-2 transition-all focus-within:border-stone-900/20">
            <div className="flex items-center">
              <div className="pl-6 pr-4 text-stone-300 group-focus-within:text-[#A9B897] transition-colors">
                <Command size={18} />
              </div>
              <input 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask TOTS Anything..."
                className="flex-1 bg-transparent py-5 text-sm outline-none font-medium text-stone-800 placeholder:text-stone-300"
              />
              <div className="flex items-center gap-2 pr-2">
                 <button type="button" className="p-3 text-stone-300 hover:text-stone-900 transition-colors"><Zap size={18}/></button>
                 <button type="submit" className="bg-stone-900 text-[#A9B897] p-3 rounded-full hover:scale-105 active:scale-95 transition-all">
                   <ArrowRight size={20} />
                 </button>
              </div>
            </div>
          </form>
          <p className="mt-4 text-center text-[8px] font-black uppercase tracking-[0.4em] text-stone-300">
            Synchronized with {activeProject.name} — Encrypted Node
          </p>
        </div>
      </div>

      {/* STYLES */}
      <style jsx global>{`
        ::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

function UserIcon({ size, className }: { size: number, className: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}