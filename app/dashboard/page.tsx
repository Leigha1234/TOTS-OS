"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import AuthGuard from "../components/AuthGuard";
import Card from "../components/Card";
import { 
  Sparkles, Terminal, Send, 
  ChevronRight, Activity, Zap, Loader2, Lock 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const [todayHours, setTodayHours] = useState(0);
  const [activeTasks, setActiveTasks] = useState(0);
  const [currentTier, setCurrentTier] = useState("Standard");
  const [isSyncing, setIsSyncing] = useState(true);
  
  // Clarity Chat States
  const [query, setQuery] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { role: 'clarity', content: 'Systems online. How can I sharpen your focus today?' }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        // Attempting to get user without stealing the lock from Sidebar
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          setIsSyncing(false);
          return;
        }

        const today = new Date().toISOString().split('T')[0];
        
        // Parallel fetching for performance
        const [hoursRes, tasksRes] = await Promise.all([
          supabase.from("timesheets").select("hours").eq("user_id", user.id).eq("date", today),
          supabase.from("tasks").select("*", { count: 'exact', head: true }).eq("user_id", user.id).neq("status", "done")
        ]);

        setTodayHours(hoursRes.data?.reduce((s, h) => s + h.hours, 0) || 0);
        setActiveTasks(tasksRes.count || 0);
        
        // Simulating tier fetch - in production, fetch this from your 'profiles' table
        setCurrentTier("Standard Node"); 
        setIsSyncing(false);
      } catch (err) {
        console.error("Auth lock contention in Dashboard - handled.");
        setIsSyncing(false);
      }
    }
    loadStats();
  }, []);

  const askClarity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userQuery = query;
    setQuery("");
    setChatHistory(prev => [...prev, { role: 'user', content: userQuery }]);
    setIsThinking(true);

    // AI Logic Simulation
    setTimeout(() => {
      setChatHistory(prev => [...prev, { 
        role: 'clarity', 
        content: `Analysis complete. You have ${activeTasks} pending cycles. Based on your ${todayHours} hours logged, velocity is ${todayHours > 5 ? 'optimal' : 'low'}. Focus on deep work.` 
      }]);
      setIsThinking(false);
    }, 1200);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  return (
    <AuthGuard>
      <div className="p-10 max-w-7xl mx-auto space-y-10 bg-[#050505] min-h-screen text-stone-200 font-sans">
        
        {/* HEADER */}
        <header className="flex justify-between items-end border-b border-white/5 pb-8">
          <div>
            <p className="text-[#a9b897] font-black uppercase text-[10px] tracking-[0.4em] mb-2">Operational Overview</p>
            <h1 className="text-5xl font-serif italic text-white tracking-tighter">Command Center</h1>
          </div>
          <div className="flex items-center gap-3 text-stone-500 text-xs font-mono bg-white/5 px-4 py-2 rounded-full border border-white/5">
            <Activity size={14} className={`${isSyncing ? 'text-amber-500' : 'text-green-500'} animate-pulse`} />
            {isSyncing ? "SYNCING_NODE..." : `NODE_ACTIVE: ${new Date().toLocaleDateString()}`}
          </div>
        </header>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-[#0a0a0a] border-white/5 p-8 rounded-[2rem] hover:border-[#a9b897]/30 transition-all group">
            <p className="text-[10px] text-stone-500 uppercase tracking-widest mb-4">Daily Velocity</p>
            <p className="text-5xl font-serif italic text-white group-hover:text-[#a9b897] transition-colors">
              {todayHours}<span className="text-xl text-stone-600 ml-2">hrs</span>
            </p>
          </Card>

          <Card className="bg-[#0a0a0a] border-white/5 p-8 rounded-[2rem] hover:border-blue-500/30 transition-all group">
            <p className="text-[10px] text-stone-500 uppercase tracking-widest mb-4">Active Cycles</p>
            <p className="text-5xl font-serif italic text-white group-hover:text-blue-400 transition-colors">
              {activeTasks}<span className="text-xl text-stone-600 ml-2">tasks</span>
            </p>
          </Card>

          <Card className="bg-[#0a0a0a] border-white/5 p-8 rounded-[2rem] hover:border-purple-500/30 transition-all group relative overflow-hidden">
            <p className="text-[10px] text-stone-500 uppercase tracking-widest mb-4">Distribution Level</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-serif italic text-[#a9b897] uppercase tracking-tighter">
                {currentTier}
              </p>
              {currentTier === "Standard Node" && <Lock size={14} className="text-stone-700" />}
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Zap size={100} />
            </div>
          </Card>
        </div>

        {/* CLARITY INTELLIGENCE CONSOLE */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col h-[500px] shadow-2xl shadow-black/50">
              
              <div className="px-8 py-5 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#a9b897] animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Clarity OS v1.0.4</span>
                </div>
                <Terminal size={14} className="text-stone-600" />
              </div>

              <div className="flex-grow overflow-y-auto p-8 space-y-6 font-mono scrollbar-hide">
                <AnimatePresence mode="popLayout">
                  {chatHistory.map((msg, i) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      key={i} 
                      className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'clarity' && <Sparkles size={16} className="text-[#a9b897] mt-1 shrink-0" />}
                      <div className={`max-w-[85%] p-5 rounded-2xl text-[11px] leading-relaxed tracking-wide ${
                        msg.role === 'user' 
                        ? 'bg-[#a9b897] text-black font-bold rounded-tr-none' 
                        : 'bg-white/[0.03] text-stone-300 border border-white/5 rounded-tl-none'
                      }`}>
                        {msg.content}
                      </div>
                    </motion.div>
                  ))}
                  {isThinking && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 items-center text-stone-500 italic text-[10px]">
                      <Loader2 size={12} className="animate-spin text-[#a9b897]" /> Synthesizing data points...
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={askClarity} className="p-6 bg-white/[0.01] border-t border-white/5">
                <div className="relative flex items-center group">
                  <ChevronRight size={18} className="absolute left-4 text-[#a9b897] group-focus-within:translate-x-1 transition-transform" />
                  <input 
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Inquire with Clarity..."
                    className="w-full bg-stone-900/40 border border-white/5 rounded-xl py-4 pl-12 pr-16 outline-none focus:border-[#a9b897]/50 focus:ring-1 ring-[#a9b897]/10 transition-all text-sm font-mono text-white placeholder:text-stone-600"
                  />
                  <button type="submit" className="absolute right-3 bg-[#a9b897] text-black p-2 rounded-lg hover:bg-white transition-colors">
                    <Send size={16} />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* SIDEBAR INSIGHTS */}
          <div className="lg:col-span-4 space-y-6">
             <div className="bg-[#a9b897]/5 border border-[#a9b897]/10 rounded-[2rem] p-8 group hover:bg-[#a9b897]/10 transition-colors">
                <Zap size={20} className="text-[#a9b897] mb-4 group-hover:scale-110 transition-transform" />
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-4">Command Injection</h4>
                <ul className="text-[10px] text-stone-500 space-y-3 font-mono uppercase tracking-widest">
                  <li className="flex justify-between border-b border-white/5 pb-2 hover:text-[#a9b897] cursor-pointer"><span>Pending Invoices</span> <span>/billing</span></li>
                  <li className="flex justify-between border-b border-white/5 pb-2 hover:text-[#a9b897] cursor-pointer"><span>Cycle Status</span> <span>/status</span></li>
                  <li className="flex justify-between hover:text-[#a9b897] cursor-pointer"><span>Generate Draft</span> <span>/draft</span></li>
                </ul>
             </div>

             <div className="p-8 rounded-[2rem] border border-white/5 bg-[#0a0a0a] text-stone-500 text-xs leading-relaxed font-serif italic text-center">
                "The secret of getting ahead is getting started."
             </div>
          </div>
        </section>
      </div>
    </AuthGuard>
  );
}