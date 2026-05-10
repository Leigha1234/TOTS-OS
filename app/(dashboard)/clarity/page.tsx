"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@supabase/ssr";
import { 
  Sparkles, Search, MessageSquare, TrendingUp, Zap, 
  BrainCircuit, ArrowRight, Cpu, Terminal, Activity,
  Plus, FolderOpen, Rocket, Target, Globe, Hash,
  ChevronLeft, MoreVertical, LayoutGrid, Palette
} from "lucide-react";

/**
 * TOTS OS v3.8 - CLARITY MULTI-PROJECT ENGINE
 * Features: 
 * 1. Project-Specific Chat: Isolated message history per ID.
 * 2. Dynamic Icons: Assignable Lucide glyphs per project.
 * 3. Contextual AI: Responds based on project metadata.
 */

interface Project {
  id: string;
  name: string;
  icon: any;
  color: string;
  context: string;
}

interface Message {
  projectId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export default function ClarityMultiProject() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- PROJECT STATE ---
  const [projects, setProjects] = useState<Project[]>([
    { id: 'p1', name: 'Social Strategy', icon: Rocket, color: '#f43f5e', context: 'Instagram growth and content ideas' },
    { id: 'p2', name: 'Market Expansion', icon: Globe, color: '#3b82f6', context: 'New territory feasibility and logistics' },
    { id: 'p3', name: 'Revenue Optimization', icon: Target, color: '#10b981', context: 'Postgres ledger analysis and tax efficiency' }
  ]);
  
  const [activeProjectId, setActiveProjectId] = useState('p1');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [query, setQuery] = useState("");

  // --- MESSAGE STATE (In Prod: Fetch from Supabase 'messages' table) ---
  const [allMessages, setAllMessages] = useState<Message[]>([
    { projectId: 'p1', role: 'system', content: "Social Strategy Protocol Engaged." },
    { projectId: 'p1', role: 'assistant', content: "I'm ready to help with your Instagram ideas. I've noted a 14% uptick in Q2 engagement patterns." },
    { projectId: 'p2', role: 'system', content: "Expansion Analysis Active." },
    { projectId: 'p3', role: 'assistant', content: "Your current EOY projection is £184,200. Should we analyze the tax efficiency?" }
  ]);

  // --- DERIVED STATE ---
  const activeProject = useMemo(() => 
    projects.find(p => p.id === activeProjectId) || projects[0], 
  [activeProjectId, projects]);

  const currentChat = useMemo(() => 
    allMessages.filter(m => m.projectId === activeProjectId),
  [allMessages, activeProjectId]);

  // --- LOGIC: CHAT & AI ---
  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMsg: Message = { projectId: activeProjectId, role: 'user', content: query };
    setAllMessages(prev => [...prev, userMsg]);
    setQuery("");
    setIsAiTyping(true);

    // AI Logic tailored to Project Context
    setTimeout(() => {
      const responseContent = activeProject.id === 'p1' 
        ? `Analysis complete for "${query}". Matching 4 patterns in your Instagram history. I suggest a carousel post focusing on the recent 14% growth velocity.`
        : `Based on the ${activeProject.name} context, I've queried the cluster. Found high correlation with your Q2 revenue targets.`;

      setAllMessages(prev => [...prev, { 
        projectId: activeProjectId, 
        role: 'assistant', 
        content: responseContent 
      }]);
      setIsAiTyping(false);
    }, 1200);
  };

  const createNewProject = () => {
    const newId = `p${projects.length + 1}`;
    const newProj: Project = {
      id: newId,
      name: 'New Initiative',
      icon: Hash,
      color: '#78716c',
      context: 'General inquiry'
    };
    setProjects([...projects, newProj]);
    setActiveProjectId(newId);
    setAllMessages(prev => [...prev, { projectId: newId, role: 'system', content: "New Project Link Established." }]);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat]);

  return (
    <div className="flex h-screen bg-[#fcfbf9] text-stone-900 overflow-hidden selection:bg-stone-900 selection:text-white font-sans">
      
      {/* 1. PROJECT SIDEBAR */}
      <aside className="w-80 border-r border-stone-100 bg-white p-8 flex flex-col gap-10">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-stone-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
              <BrainCircuit size={20} />
           </div>
           <h2 className="text-xl font-serif italic tracking-tighter">Clarity Hub</h2>
        </div>

        <div className="flex-1 space-y-2">
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300 mb-6 ml-2">Active Initiatives</p>
           {projects.map((proj) => (
             <button
               key={proj.id}
               onClick={() => setActiveProjectId(proj.id)}
               className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${activeProjectId === proj.id ? 'bg-stone-50 border border-stone-100 shadow-sm' : 'hover:bg-stone-50/50'}`}
             >
                <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${proj.color}15`, color: proj.color }}>
                   <proj.icon size={18} />
                </div>
                <span className={`text-xs font-bold transition-colors ${activeProjectId === proj.id ? 'text-stone-900' : 'text-stone-400 group-hover:text-stone-600'}`}>
                   {proj.name}
                </span>
             </button>
           ))}
           
           <button 
             onClick={createNewProject}
             className="w-full flex items-center gap-4 p-4 rounded-2xl border border-dashed border-stone-200 text-stone-400 hover:border-stone-900 hover:text-stone-900 transition-all mt-4"
           >
              <Plus size={18} />
              <span className="text-xs font-black uppercase tracking-widest">New Project</span>
           </button>
        </div>

        <div className="p-6 bg-stone-50 rounded-3xl space-y-4">
           <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-stone-400">
              <span>Token Usage</span>
              <span>82%</span>
           </div>
           <div className="h-1 bg-stone-200 rounded-full overflow-hidden">
              <div className="h-full bg-stone-900 w-[82%]" />
           </div>
        </div>
      </aside>

      {/* 2. MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col bg-[#fcfbf9] relative">
        
        {/* Chat Header */}
        <header className="p-8 border-b border-stone-50 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10">
           <div className="flex items-center gap-6">
              <div className="p-4 rounded-2xl shadow-sm" style={{ backgroundColor: `${activeProject.color}15`, color: activeProject.color }}>
                 <activeProject.icon size={24} />
              </div>
              <div>
                 <h1 className="text-4xl font-serif italic tracking-tighter">{activeProject.name}</h1>
                 <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">{activeProject.context}</p>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Context Engaged</span>
              </div>
              <button className="p-3 bg-white border border-stone-100 rounded-full text-stone-300 hover:text-stone-900 hover:shadow-md transition-all">
                    <MoreVertical size={18} />
              </button>
           </div>   
        </header>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-12 space-y-8 no-scrollbar max-w-5xl mx-auto w-full">
           <AnimatePresence mode="popLayout">
              {currentChat.map((msg, i) => (
                <motion.div 
                  key={`${activeProjectId}-${i}`}
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                   <div className={`max-w-[80%] p-8 rounded-[2.5rem] text-sm leading-relaxed shadow-sm border ${
                     msg.role === 'user' 
                     ? 'bg-stone-900 text-white border-stone-800 rounded-tr-none' 
                     : msg.role === 'system'
                     ? 'bg-stone-50/50 text-stone-400 text-[9px] font-black uppercase tracking-[0.3em] text-center w-full border-none shadow-none py-4'
                     : 'bg-white text-stone-800 border-stone-100 rounded-tl-none'
                   }`}>
                      {msg.content}
                   </div>
                </motion.div>
              ))}
           </AnimatePresence>
           
           {isAiTyping && (
             <div className="flex justify-start">
                <div className="bg-white border border-stone-100 p-6 rounded-[2rem] flex gap-2 shadow-sm">
                   <div className="w-1.5 h-1.5 bg-stone-200 rounded-full animate-bounce" />
                   <div className="w-1.5 h-1.5 bg-stone-200 rounded-full animate-bounce [animation-delay:0.2s]" />
                   <div className="w-1.5 h-1.5 bg-stone-200 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
             </div>
           )}
           <div ref={chatEndRef} className="h-20" />
        </div>

        {/* Bottom Input Area */}
        <div className="p-10 bg-gradient-to-t from-[#fcfbf9] via-[#fcfbf9] to-transparent">
           <form 
             onSubmit={handleQuery}
             className="max-w-4xl mx-auto relative group"
           >
              <div className="absolute -inset-1 bg-gradient-to-r from-stone-200 to-stone-100 rounded-[3rem] blur opacity-25 group-focus-within:opacity-100 transition duration-1000 group-focus-within:duration-200" />
              <div className="relative flex items-center">
                 <input 
                   value={query}
                   onChange={(e) => setQuery(e.target.value)}
                   placeholder={`Message ${activeProject.name}...`}
                   className="w-full bg-white border border-stone-100 rounded-[3rem] py-8 px-12 text-sm outline-none focus:border-stone-900 transition-all pr-24 shadow-xl"
                 />
                 <button 
                   type="submit" 
                   className="absolute right-4 p-5 bg-stone-900 text-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg"
                 >
                    <ArrowRight size={20} />
                 </button>
              </div>
           </form>
           <p className="text-center text-[9px] font-black uppercase tracking-[0.4em] text-stone-300 mt-6">
              Clarity Protocol Enabled — Contextual to {activeProject.name}
           </p>
        </div>
      </main>

      <style jsx global>{`
        ::-webkit-scrollbar { width: 0px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .font-serif { font-family: 'Playfair Display', serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
      `}</style>
    </div>
  );
}