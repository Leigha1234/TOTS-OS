"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BrainCircuit, ArrowRight, Plus, Rocket, Target, 
  Globe, Hash, X, Activity, Zap, Sparkles, Command, 
  Users, Share2, MessageSquare, Cloud, Briefcase, Instagram, Send
} from "lucide-react";

/**
 * TOTS OS v5.2 - CLARITY PROTOCOL
 * FULL FUNCTIONAL WORKSPACE: CHATS, TEAM, & MULTI-INTENT
 */

interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: string;
}

interface Project {
  id: string;
  name: string;
  iconName: string;
  colour: string;
  focus: string;
}

interface Signal {
  projectId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ClarityPage() {
  const signalEndRef = useRef<HTMLDivElement>(null);

  // --- STATE ---
  const [projects, setProjects] = useState<Project[]>([
    { id: 'p1', name: 'General Clarity', iconName: 'Zap', colour: '#A9B897', focus: 'Omni-intent workspace for general queries.' },
    { id: 'p2', name: 'Instagram Growth', iconName: 'Rocket', colour: '#3b82f6', focus: 'Social momentum and viral hooks.' }
  ]);
  
  const [activeProjectId, setActiveProjectId] = useState('p1');
  const [query, setQuery] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  
  const [teamMembers] = useState<TeamMember[]>([
    { id: '1', name: 'Leigha Day-Clark', initials: 'LD', role: 'Operator' },
    { id: '2', name: 'David Miller', initials: 'DM', role: 'Strategy' }
  ]);

  const [allSignals, setAllSignals] = useState<Signal[]>([
    { projectId: 'p1', role: 'assistant', content: "Clarity initialized. I'm ready for anything—from local weather to complex business scaling. How can I help today?", timestamp: new Date() }
  ]);

  const [newProj, setNewProj] = useState({ name: '', focus: '' });

  // --- DERIVED ---
  const activeProject = useMemo(() => 
    projects.find(p => p.id === activeProjectId) || projects[0], 
  [activeProjectId, projects]);

  const currentFeed = useMemo(() => 
    allSignals.filter(s => s.projectId === activeProjectId),
  [allSignals, activeProjectId]);

  // --- LOGIC: OMNI-INTENT ENGINE ---
  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userSignal: Signal = { projectId: activeProjectId, role: 'user', content: query, timestamp: new Date() };
    setAllSignals(prev => [...prev, userSignal]);
    setQuery("");
    setIsAiTyping(true);

    // Mock Intelligence Logic
    setTimeout(() => {
      const input = query.toLowerCase();
      let response = "";

      if (input.includes("weather")) {
        response = "The current weather in Elgin is a brisk 12°C with overcast skies. Typical Scottish spring—perfect for a focused run later.";
      } else if (input.includes("business plan")) {
        response = "For your business plan, we should focus on the 'Clarity-as-a-Service' model. I've drafted a 3-stage roadmap: 1. Core Integration, 2. Team Scaling, 3. Revenue Automation. Shall I expand on stage one?";
      } else if (input.includes("instagram") || input.includes("post")) {
        response = "Instagram Strategy: Based on the TOTS aesthetic, I recommend a 'Behind the Scenes' carousel. Use high-grain photography of your Laravel setup. Hook: 'Building the OS that runs the day.' Caption logic ready for export.";
      } else {
        response = `Processing request within the ${activeProject.name} framework. I have analyzed "${query}" and found 3 key optimization paths. Would you like the summarized version or the full deep-dive?`;
      }

      setAllSignals(prev => [...prev, { projectId: activeProjectId, role: 'assistant', content: response, timestamp: new Date() }]);
      setIsAiTyping(false);
    }, 1200);
  };

  const createChat = () => {
    if (!newProj.name) return;
    const id = `p${Date.now()}`;
    setProjects([...projects, { id, name: newProj.name, iconName: 'MessageSquare', colour: '#A9B897', focus: newProj.focus }]);
    setActiveProjectId(id);
    setShowCreator(false);
    setNewProj({ name: '', focus: '' });
  };

  useEffect(() => {
    signalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentFeed, isAiTyping]);

  return (
    <div className="h-screen bg-[#FDFDFC] text-stone-900 flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* SIDEBAR: NAVIGATION & CHATS */}
      <aside className="w-72 border-r border-stone-100 bg-white/50 backdrop-blur-xl hidden lg:flex flex-col p-6 z-50">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center text-[#A9B897]">
            <BrainCircuit size={18} />
          </div>
          <span className="font-serif italic font-bold text-lg">Clarity OS</span>
        </div>

        <div className="flex-1 space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-4 px-2">Workspaces</p>
          {projects.map((proj) => (
            <button 
              key={proj.id}
              onClick={() => setActiveProjectId(proj.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                activeProjectId === proj.id ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-500 hover:bg-stone-100'
              }`}
            >
              <Hash size={14} className={activeProjectId === proj.id ? 'text-[#A9B897]' : 'text-stone-300'} />
              <span className="text-xs font-bold truncate">{proj.name}</span>
            </button>
          ))}
          <button 
            onClick={() => setShowCreator(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#A9B897] hover:bg-[#A9B897]/10 transition-all mt-2"
          >
            <Plus size={16} />
            <span className="text-xs font-bold">New Chat</span>
          </button>
        </div>

        <div className="pt-6 border-t border-stone-100">
          <div className="flex -space-x-2 mb-4">
            {teamMembers.map(m => (
              <div key={m.id} title={m.name} className="w-8 h-8 rounded-full border-2 border-white bg-stone-100 flex items-center justify-center text-[10px] font-black text-stone-500">
                {m.initials}
              </div>
            ))}
            <button onClick={() => setShowInvite(true)} className="w-8 h-8 rounded-full border-2 border-white bg-stone-900 flex items-center justify-center text-[#A9B897] hover:scale-105 transition-transform">
              <Plus size={12} />
            </button>
          </div>
          <p className="text-[8px] font-black uppercase tracking-widest text-stone-300">Active Team Sync</p>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* GEMINI GLOW */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute top-[-10%] left-[20%] w-[50%] h-[50%] bg-[#A9B897]/10 blur-[150px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] bg-blue-100/20 blur-[150px] rounded-full animate-pulse [animation-delay:2s]" />
        </div>

        {/* TOP NAV (Mobile + Status) */}
        <header className="h-16 border-b border-stone-100/60 flex items-center justify-between px-6 bg-white/40 backdrop-blur-xl z-40">
          <div className="flex items-center gap-3">
             <span className="lg:hidden font-serif italic font-bold">Clarity</span>
             <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-stone-100 rounded-full border border-stone-200/50">
               <div className="w-1.5 h-1.5 bg-[#A9B897] rounded-full animate-pulse" />
               <span className="text-[9px] font-black uppercase tracking-widest text-stone-500">{activeProject.name} ACTIVE</span>
             </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowInvite(true)} className="flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors">
              <Share2 size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Invite</span>
            </button>
          </div>
        </header>

        {/* MESSAGES */}
        <main className="flex-1 overflow-y-auto no-scrollbar z-10 pt-12 pb-40">
          <div className="max-w-3xl mx-auto px-6 space-y-12">
            
            {currentFeed.length === 0 && (
               <div className="pt-20 text-center space-y-4">
                  <h2 className="text-4xl font-serif italic text-stone-300">What shall we solve today?</h2>
                  <div className="flex flex-wrap justify-center gap-3">
                    {['Business Plan', 'Weather Check', 'Insta Strategy'].map(suggestion => (
                      <button key={suggestion} onClick={() => setQuery(`Help me with a ${suggestion}`)} className="px-4 py-2 bg-stone-50 border border-stone-100 rounded-full text-[10px] font-black uppercase tracking-widest text-stone-400 hover:border-[#A9B897] hover:text-[#A9B897] transition-all">
                        {suggestion}
                      </button>
                    ))}
                  </div>
               </div>
            )}

            <AnimatePresence mode="popLayout">
              {currentFeed.map((signal, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-6 ${signal.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${signal.role === 'user' ? 'bg-stone-100 text-stone-400' : 'bg-stone-900 text-[#A9B897]'}`}>
                    {signal.role === 'user' ? <div className="text-[10px] font-black">LD</div> : <Sparkles size={14} />}
                  </div>
                  <div className={`flex-1 pt-1 ${signal.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`text-[15px] leading-[1.7] ${signal.role === 'assistant' ? 'font-serif italic text-lg text-stone-800' : 'font-bold uppercase tracking-tight text-stone-900'}`}>
                      {signal.content}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isAiTyping && (
              <div className="flex items-center gap-6">
                <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center animate-pulse">
                  <Sparkles size={14} className="text-[#A9B897]" />
                </div>
                <div className="flex gap-1.5">
                  <div className="w-1 h-1 bg-[#A9B897] rounded-full animate-bounce" />
                  <div className="w-1 h-1 bg-[#A9B897] rounded-full animate-bounce [animation-delay:0.2s]" />
                </div>
              </div>
            )}
            <div ref={signalEndRef} />
          </div>
        </main>

        {/* INPUT BAR */}
        <div className="absolute bottom-0 left-0 right-0 pb-10 px-6 z-50 bg-gradient-to-t from-[#FDFDFC] via-[#FDFDFC]/90 to-transparent">
          <div className="max-w-3xl mx-auto group">
            <form onSubmit={handleQuery} className="relative bg-white border border-stone-200 shadow-2xl rounded-[2.5rem] p-2 flex items-center">
              <div className="pl-6 pr-4 text-stone-300">
                <Command size={18} />
              </div>
              <input 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask Clarity anything..."
                className="flex-1 bg-transparent py-5 text-sm outline-none font-medium placeholder:text-stone-300"
              />
              <button type="submit" className="bg-stone-900 text-[#A9B897] p-3 rounded-full hover:scale-105 transition-all ml-2">
                 <Send size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* MODAL: CHAT CREATOR */}
      <AnimatePresence>
        {showCreator && (
          <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-md z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl border border-stone-100">
               <h3 className="text-3xl font-serif italic mb-6">New Workspace</h3>
               <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Chat Name</label>
                    <input autoFocus value={newProj.name} onChange={e => setNewProj({...newProj, name: e.target.value})} className="w-full border-b border-stone-100 py-2 outline-none focus:border-stone-900 font-serif italic text-xl transition-all" />
                 </div>
                 <button onClick={createChat} className="w-full bg-stone-900 text-[#A9B897] py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest">Establish Node</button>
                 <button onClick={() => setShowCreator(false)} className="w-full text-stone-400 text-[10px] font-black uppercase tracking-widest">Cancel</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: INVITE TEAM */}
      <AnimatePresence>
        {showInvite && (
          <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-md z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl border border-stone-100 text-center">
               <div className="w-16 h-16 bg-[#A9B897]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="text-[#A9B897]" size={32} />
               </div>
               <h3 className="text-3xl font-serif italic mb-2">Invite Team</h3>
               <p className="text-stone-400 text-sm mb-8 italic">Share this intelligence workspace with your collaborators.</p>
               <div className="space-y-4">
                 <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex items-center justify-between">
                    <span className="text-xs font-mono text-stone-500">tots-os.com/share/clrt-44x</span>
                    <button className="text-[10px] font-black uppercase tracking-widest text-[#A9B897]">Copy</button>
                 </div>
                 <button onClick={() => setShowInvite(false)} className="w-full bg-stone-900 text-[#A9B897] py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest">Close</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        ::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}