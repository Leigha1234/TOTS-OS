"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@supabase/ssr";
import { 
  Sparkles, TrendingUp, Zap, BrainCircuit, ArrowRight, Cpu, 
  Activity, Plus, Rocket, Target, Globe, Hash, Settings, X, 
  Menu, Search, MessageSquare, ShieldCheck
} from "lucide-react";

/**
 * TOTS OS v4.0 - MOBILE-FIRST CLARITY HUB
 * Layout: Horizontal Top Navigation (No Sidebar)
 * Customization: Icon, Color, Name, Focus
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

export default function ClarityHorizontalHub() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- CORE STATE ---
  const [projects, setProjects] = useState<Project[]>([
    { id: 'p1', name: 'Social Strategy', iconName: 'Rocket', color: '#f43f5e', focus: 'Viral Instagram hooks and growth metrics' },
    { id: 'p2', name: 'Revenue Ops', iconName: 'Target', color: '#10b981', focus: 'Financial ledger analysis and tax forecasting' }
  ]);
  
  const [activeProjectId, setActiveProjectId] = useState('p1');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [query, setQuery] = useState("");
  const [showCreator, setShowCreator] = useState(false);

  // --- NEW PROJECT FORM ---
  const [newProj, setNewProj] = useState<Project>({
    id: '', name: '', iconName: 'Hash', color: '#a8a29e', focus: ''
  });

  const [allMessages, setAllMessages] = useState<Message[]>([
    { projectId: 'p1', role: 'assistant', content: "Social context active. Ready to refine your content pipeline." },
    { projectId: 'p2', role: 'assistant', content: "Financial engine ready. I can project your EOY tax based on current revenue." }
  ]);

  const activeProject = useMemo(() => 
    projects.find(p => p.id === activeProjectId) || projects[0], 
  [activeProjectId, projects]);

  const currentChat = useMemo(() => 
    allMessages.filter(m => m.projectId === activeProjectId),
  [allMessages, activeProjectId]);

  // --- AI ENGINE ---
  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setAllMessages(prev => [...prev, { projectId: activeProjectId, role: 'user', content: query }]);
    setQuery("");
    setIsAiTyping(true);

    setTimeout(() => {
      let response = "";
      const lowerQuery = query.toLowerCase();

      // THE RELEVANCE LOGIC: Responses check project focus
      if (activeProject.focus.toLowerCase().includes("social") || activeProject.name.includes("Social")) {
        response = `[Social Context] Analyzing your ${activeProject.focus}: To optimize "${query}", I suggest a 3-part hook strategy aimed at Instagram's current Q2 algorithm patterns.`;
      } else if (activeProject.focus.toLowerCase().includes("financial") || activeProject.name.includes("Revenue")) {
        response = `[Ledger Context] Based on your focus on ${activeProject.focus}: That specific metric is currently at £142,500. Your tax liability stands at £21,660.`;
      } else {
        response = `Processing "${query}" through the lens of ${activeProject.name}. My established focus is: ${activeProject.focus}. How would you like to proceed?`;
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

  const getIcon = (name: string) => AVAILABLE_ICONS.find(i => i.name === name)?.icon || Hash;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat]);

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-stone-900 flex flex-col font-sans">
      
      {/* 1. TOP NAVIGATION BAR (Horizontal Project Switcher) */}
      <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-stone-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-6">
          
          {/* Brand Icon (Left) */}
          <div className="hidden md:flex items-center gap-3 pr-6 border-r border-stone-100">
             <div className="w-10 h-10 bg-stone-900 rounded-2xl flex items-center justify-center text-white"><BrainCircuit size={20} /></div>
             <span className="font-serif italic text-lg tracking-tighter">Clarity</span>
          </div>

          {/* Project List (Scrollable) */}
          <div className="flex-1 flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
             {projects.map((proj) => {
               const Icon = getIcon(proj.iconName);
               const isActive = activeProjectId === proj.id;
               return (
                 <button 
                   key={proj.id} 
                   onClick={() => setActiveProjectId(proj.id)}
                   className={`flex items-center gap-3 px-5 py-3 rounded-2xl whitespace-nowrap transition-all border ${isActive ? 'bg-stone-900 text-white border-stone-900 shadow-lg' : 'bg-white border-stone-100 text-stone-400 hover:border-stone-300'}`}
                 >
                    <Icon size={16} style={{ color: isActive ? '#fff' : proj.color }} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{proj.name}</span>
                 </button>
               );
             })}
             
             <button 
               onClick={() => setShowCreator(true)}
               className="flex items-center justify-center p-3 rounded-2xl border border-dashed border-stone-200 text-stone-400 hover:border-stone-900 transition-all ml-2"
             >
                <Plus size={18} />
             </button>
          </div>
        </div>
      </nav>

      {/* 2. CHAT AREA */}
      <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-6 md:p-12 space-y-12">
        
        {/* Project Header Info */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div className="space-y-2">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-[1px] bg-stone-200" />
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">Context: {activeProject.name}</p>
              </div>
              <h2 className="text-4xl md:text-6xl font-serif italic tracking-tighter">System Pulse</h2>
              <p className="text-xs text-stone-500 font-medium max-w-md">Currently focused on: <span className="text-stone-900 italic">{activeProject.focus}</span></p>
           </div>
           <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100 text-emerald-600 text-[9px] font-black uppercase tracking-widest">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Intelligence Active
           </div>
        </header>

        {/* Message Feed */}
        <div className="flex-1 space-y-8 pb-32">
           {currentChat.map((msg, i) => (
             <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] md:max-w-[75%] p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] text-sm md:text-base leading-relaxed shadow-sm ${
                  msg.role === 'user' ? 'bg-stone-900 text-white rounded-tr-none' : 'bg-white border border-stone-100 text-stone-800 rounded-tl-none'
                }`}>
                   {msg.content}
                </div>
             </motion.div>
           ))}
           {isAiTyping && <div className="p-5 bg-stone-50 rounded-full w-fit text-[10px] font-black uppercase tracking-widest animate-pulse">Processing Cluster Data...</div>}
           <div ref={chatEndRef} />
        </div>

        {/* INPUT (Floating at bottom) */}
        <div className="fixed bottom-0 left-0 right-0 p-6 md:p-10 pointer-events-none">
           <form onSubmit={handleQuery} className="max-w-4xl mx-auto relative pointer-events-auto group">
              <div className="absolute -inset-1 bg-stone-900/5 rounded-[3rem] blur-xl opacity-0 group-focus-within:opacity-100 transition duration-1000" />
              <input 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Ask ${activeProject.name}...`}
                className="w-full bg-white border border-stone-200 rounded-full py-6 md:py-8 px-10 md:px-14 text-sm md:text-base outline-none focus:border-stone-900 shadow-2xl transition-all pr-24"
              />
              <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 p-4 md:p-5 bg-stone-900 text-white rounded-full hover:scale-105 transition-all shadow-lg">
                 <ArrowRight size={20} />
              </button>
           </form>
        </div>
      </main>

      {/* PROJECT CREATOR MODAL */}
      <AnimatePresence>
        {showCreator && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-[200] flex items-center justify-center p-6">
             <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-xl rounded-[3rem] p-10 md:p-16 shadow-2xl relative">
                <button onClick={() => setShowCreator(false)} className="absolute top-8 right-8 text-stone-300 hover:text-stone-900"><X size={24}/></button>
                <h3 className="text-4xl font-serif italic mb-8">New Initiative</h3>
                
                <div className="space-y-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Identity</label>
                      <input placeholder="e.g. Content Hub" value={newProj.name} onChange={e => setNewProj({...newProj, name: e.target.value})} className="w-full border-b border-stone-100 py-3 text-lg outline-none focus:border-stone-900 font-serif italic" />
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">AI Logic / Focus</label>
                      <textarea placeholder="Tell the AI what to prioritize (e.g. financial accuracy, creative viral hooks)..." value={newProj.focus} onChange={e => setNewProj({...newProj, focus: e.target.value})} className="w-full bg-stone-50 rounded-2xl p-4 text-sm outline-none focus:bg-white h-24 resize-none" />
                   </div>

                   <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                         {PRESET_COLORS.map(c => (
                           <button key={c} onClick={() => setNewProj({...newProj, color: c})} className={`w-8 h-8 rounded-full border-2 transition-all ${newProj.color === c ? 'border-stone-900 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                         ))}
                      </div>
                      <div className="flex gap-2">
                         {AVAILABLE_ICONS.map(i => (
                           <button key={i.name} onClick={() => setNewProj({...newProj, iconName: i.name})} className={`p-2 rounded-lg border transition-all ${newProj.iconName === i.name ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-100 text-stone-400 hover:border-stone-300'}`}><i.icon size={16}/></button>
                         ))}
                      </div>
                   </div>

                   <button onClick={commitProject} className="w-full bg-stone-900 text-white py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-xl">Establish Protocol</button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        ::-webkit-scrollbar { width: 0px; display: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
      `}</style>
    </div>
  );
}