"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@supabase/ssr";
import { 
  BrainCircuit, ArrowRight, Plus, Rocket, Target, 
  Globe, Hash, X, Activity, Zap, Cpu, Sparkles 
} from "lucide-react";

/**
 * TOTS OS v4.2 - UNIFIED CLARITY HUB
 * * FEATURES:
 * 1. Horizontal Project Nav (Mobile Responsive)
 * 2. Project Provisioning (Name, Icon, Color, Focus)
 * 3. Contextual AI Relevance Engine
 * 4. Flex-Restricted Viewport (Zero clipping)
 */

const AVAILABLE_ICONS = [
  { name: 'Rocket', icon: Rocket },
  { name: 'Globe', icon: Globe },
  { name: 'Target', icon: Target },
  { name: 'Zap', icon: Zap },
  { name: 'Brain', icon: BrainCircuit },
  { name: 'Hash', icon: Hash }
];

const PRESET_COLORS = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#a8a29e'];

interface Project {
  id: string;
  name: string;
  iconName: string;
  color: string;
  focus: string;
}

interface Message {
  projectId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export default function ClarityFullPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- PERSISTENT STATE ---
  const [projects, setProjects] = useState<Project[]>([
    { id: 'p1', name: 'Social Strategy', iconName: 'Rocket', color: '#f43f5e', focus: 'Viral Instagram hooks and growth metrics' },
    { id: 'p2', name: 'Revenue Ops', iconName: 'Target', color: '#10b981', focus: 'Financial ledger analysis and tax forecasting' }
  ]);
  
  const [activeProjectId, setActiveProjectId] = useState('p1');
  const [query, setQuery] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showCreator, setShowCreator] = useState(false);

  // --- NEW PROJECT FORM STATE ---
  const [newProj, setNewProj] = useState<Project>({
    id: '', name: '', iconName: 'Hash', color: '#a8a29e', focus: ''
  });

  const [allMessages, setAllMessages] = useState<Message[]>([
    { projectId: 'p1', role: 'assistant', content: "Social context active. How can I help with your content strategy today?" },
    { projectId: 'p2', role: 'assistant', content: "Financial cluster online. Ready for ledger analysis." }
  ]);

  // --- DERIVED LOGIC ---
  const activeProject = useMemo(() => 
    projects.find(p => p.id === activeProjectId) || projects[0], 
  [activeProjectId, projects]);

  const currentChat = useMemo(() => 
    allMessages.filter(m => m.projectId === activeProjectId),
  [allMessages, activeProjectId]);

  const getIcon = (name: string) => AVAILABLE_ICONS.find(i => i.name === name)?.icon || Hash;

  // --- ACTIONS ---
  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMsg: Message = { projectId: activeProjectId, role: 'user', content: query };
    setAllMessages(prev => [...prev, userMsg]);
    setQuery("");
    setIsAiTyping(true);

    // AI RELEVANCE ENGINE
    setTimeout(() => {
      let response = "";
      const context = activeProject.focus.toLowerCase();

      if (context.includes("social") || context.includes("content")) {
        response = `[Social Context] Analyzing your focus on "${activeProject.focus}": For your query "${query}", I recommend a "Problem/Solution" reel format. Current trends suggest this converts 12% better for your niche.`;
      } else if (context.includes("revenue") || context.includes("ledger") || context.includes("tax")) {
        response = `[Financial Context] Querying ledger cluster for "${query}": Your current YTD revenue is £142,500. Adjusting for your focus on ${activeProject.focus}, I project a Q3 surplus.`;
      } else {
        response = `Contextual analysis for ${activeProject.name} complete. Based on your focus: "${activeProject.focus}", I have processed your request. How would you like to refine this?`;
      }

      setAllMessages(prev => [...prev, { projectId: activeProjectId, role: 'assistant', content: response }]);
      setIsAiTyping(false);
    }, 1500);
  };

  const commitProject = () => {
    if (!newProj.name || !newProj.focus) return;
    const id = `p${Date.now()}`;
    setProjects([...projects, { ...newProj, id }]);
    setActiveProjectId(id);
    setShowCreator(false);
    setNewProj({ id: '', name: '', iconName: 'Hash', color: '#a8a29e', focus: '' });
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat, isAiTyping]);

  return (
    <div className="h-screen bg-[#fcfbf9] text-stone-900 flex flex-col overflow-hidden selection:bg-stone-900 selection:text-white font-sans">
      
      {/* 1. TOP NAVIGATION (Project Switcher) */}
      <nav className="shrink-0 bg-white/80 backdrop-blur-md border-b border-stone-100 px-4 md:px-8 py-4 z-[100]">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="flex items-center gap-2 pr-4 border-r border-stone-100 shrink-0">
             <div className="w-8 h-8 bg-stone-900 rounded-xl flex items-center justify-center text-white shadow-lg"><BrainCircuit size={16} /></div>
             <span className="font-serif italic font-bold hidden sm:inline text-lg">Clarity</span>
          </div>

          <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
             {projects.map((proj) => {
               const Icon = getIcon(proj.iconName);
               const isActive = activeProjectId === proj.id;
               return (
                 <button 
                   key={proj.id} 
                   onClick={() => setActiveProjectId(proj.id)}
                   className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all border ${
                     isActive ? 'bg-stone-900 text-white border-stone-900 shadow-md scale-105' : 'bg-white text-stone-400 border-stone-100 hover:border-stone-300'
                   }`}
                 >
                    <Icon size={14} style={{ color: isActive ? '#fff' : proj.color }} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{proj.name}</span>
                 </button>
               );
             })}
             <button onClick={() => setShowCreator(true)} className="p-2.5 rounded-xl border border-dashed border-stone-200 text-stone-300 hover:border-stone-900 transition-all shrink-0"><Plus size={16}/></button>
          </div>
        </div>
      </nav>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 relative flex flex-col w-full max-w-5xl mx-auto overflow-hidden">
        
        {/* Responsive Header */}
        <header className="p-6 md:p-10 shrink-0">
           <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-[1px] bg-stone-200" />
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Node: {activeProject.name}</p>
           </div>
           <h1 className="text-4xl md:text-6xl font-serif italic tracking-tighter">System Pulse</h1>
           <p className="text-[10px] md:text-xs text-stone-400 mt-2 font-medium max-w-md">
             Active Intelligence Focus: <span className="text-stone-900 italic font-bold">{activeProject.focus}</span>
           </p>
        </header>

        {/* Scrollable Chat Area */}
        <div className="flex-1 overflow-y-auto px-6 md:px-10 space-y-6 pb-40 no-scrollbar">
           <AnimatePresence mode="popLayout">
              {currentChat.map((msg, i) => (
                <motion.div key={`${activeProjectId}-${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[85%] p-6 md:p-8 rounded-[2.5rem] text-sm leading-relaxed shadow-sm border ${
                     msg.role === 'user' ? 'bg-stone-900 text-white border-stone-800 rounded-tr-none shadow-xl' : 'bg-white border-stone-100 text-stone-800 rounded-tl-none'
                   }`}>
                      {msg.content}
                   </div>
                </motion.div>
              ))}
           </AnimatePresence>
           
           {isAiTyping && (
             <div className="flex justify-start">
                <div className="bg-white border border-stone-100 p-6 rounded-[2rem] animate-pulse">
                   <div className="flex gap-2">
                      <div className="w-1.5 h-1.5 bg-stone-200 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-stone-200 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-stone-200 rounded-full animate-bounce [animation-delay:0.4s]" />
                   </div>
                </div>
             </div>
           )}
           <div ref={chatEndRef} />
        </div>

        {/* Fixed Floating Input */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 bg-gradient-to-t from-[#fcfbf9] via-[#fcfbf9]/95 to-transparent">
           <form onSubmit={handleQuery} className="max-w-4xl mx-auto relative group pointer-events-auto">
              <input 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Ask ${activeProject.name}...`}
                className="w-full bg-white border border-stone-200 rounded-full py-6 md:py-8 px-10 md:px-14 text-sm md:text-base outline-none focus:border-stone-900 shadow-2xl transition-all pr-24"
              />
              <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 p-4 md:p-5 bg-stone-900 text-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg">
                 <ArrowRight size={20} />
              </button>
           </form>
           <p className="text-center text-[8px] font-black uppercase tracking-[0.4em] text-stone-300 mt-6 hidden md:block">
              Neural Context Engine v4.2 — Encrypted Connection
           </p>
        </div>
      </main>

      {/* PROJECT CREATOR OVERLAY */}
      <AnimatePresence>
        {showCreator && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-[200] flex items-center justify-center p-6">
             <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-xl rounded-[3rem] p-10 md:p-16 shadow-2xl relative">
                <button onClick={() => setShowCreator(false)} className="absolute top-8 right-8 text-stone-300 hover:text-stone-900"><X size={24}/></button>
                <div className="space-y-2 mb-10">
                   <h3 className="text-4xl font-serif italic tracking-tighter">Provision Node</h3>
                   <p className="text-xs text-stone-400">Establish a new contextual intelligence link.</p>
                </div>
                
                <div className="space-y-8">
                   <input placeholder="Project Name" value={newProj.name} onChange={e => setNewProj({...newProj, name: e.target.value})} className="w-full border-b border-stone-100 py-3 text-xl outline-none focus:border-stone-900 font-serif italic" />
                   <textarea placeholder="AI Focus (e.g. Instagram hooks, Tax advice...)" value={newProj.focus} onChange={e => setNewProj({...newProj, focus: e.target.value})} className="w-full bg-stone-50 rounded-3xl p-6 text-sm outline-none focus:bg-white border border-transparent focus:border-stone-100 h-28 resize-none" />
                   
                   <div className="flex flex-col gap-6">
                      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                         {AVAILABLE_ICONS.map(i => (
                           <button key={i.name} onClick={() => setNewProj({...newProj, iconName: i.name})} className={`p-4 rounded-2xl border transition-all shrink-0 ${newProj.iconName === i.name ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-100 text-stone-300'}`}><i.icon size={18} /></button>
                         ))}
                      </div>
                      <div className="flex gap-3">
                         {PRESET_COLORS.map(c => (
                           <button key={c} onClick={() => setNewProj({...newProj, color: c})} className={`w-8 h-8 rounded-full border-2 transition-all shrink-0 ${newProj.color === c ? 'border-stone-900 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                         ))}
                      </div>
                   </div>

                   <button onClick={commitProject} className="w-full bg-stone-900 text-white py-6 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all">Establish Protocol</button>
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