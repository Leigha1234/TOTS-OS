"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Card from "../../components/Card";
import { 
  Sparkles, Terminal, Send, 
  ChevronRight, Activity, Zap, Loader2, Lock 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const [todayHours, setTodayHours] = useState(0);
  const [activeTasks, setActiveTasks] = useState(0);
  const [currentTier, setCurrentTier] = useState("Standard Node");
  const [isSyncing, setIsSyncing] = useState(true);
  
  const [query, setQuery] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { role: 'clarity', content: 'Systems online. How can I sharpen your focus today?' }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsSyncing(false);
          return;
        }

        const today = new Date().toISOString().split('T')[0];
        const [hoursRes, tasksRes] = await Promise.all([
          supabase.from("timesheets").select("hours").eq("user_id", user.id).eq("date", today),
          supabase.from("tasks").select("*", { count: 'exact', head: true }).eq("user_id", user.id).neq("status", "done")
        ]);

        setTodayHours(hoursRes.data?.reduce((s, h) => s + h.hours, 0) || 0);
        setActiveTasks(tasksRes.count || 0);
        setIsSyncing(false);
      } catch (err) {
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
    setTimeout(() => {
      setChatHistory(prev => [...prev, { 
        role: 'clarity', 
        content: `Analysis complete. You have ${activeTasks} pending cycles. Based on your current velocity, focus on deep work.` 
      }]);
      setIsThinking(false);
    }, 1200);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  return (
    <div className="p-6 md:p-10 space-y-8 bg-black min-h-screen text-stone-200">
      
      {/* HEADER: Slimmer and more integrated */}
      <header className="flex justify-between items-end pb-4">
        <div className="space-y-1">
          <p className="text-[#a9b897] font-black uppercase text-[9px] tracking-[0.4em] opacity-70">Operational Overview</p>
          <h1 className="text-4xl font-serif italic text-white tracking-tighter">Command Center</h1>
        </div>
        <div className="flex items-center gap-3 text-stone-500 text-[10px] font-mono bg-stone-900/40 px-4 py-2 rounded-full border border-white/5">
          <Activity size={12} className={`${isSyncing ? 'text-amber-500' : 'text-[#a9b897]'} animate-pulse`} />
          {isSyncing ? "SYNCING..." : `NODE_ACTIVE: ${new Date().toLocaleDateString()}`}
        </div>
      </header>

      {/* STATS GRID: Uses subtle gradients and consistent corner rounding */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-stone-900/20 border-white/5 p-8 rounded-[2rem] hover:bg-stone-900/40 transition-all group">
          <p className="text-[10px] text-stone-500 uppercase tracking-[0.2em] mb-4 font-black">Daily Velocity</p>
          <div className="flex items-baseline gap-2">
            <p className="text-6xl font-serif italic text-white group-hover:text-[#a9b897] transition-colors">{todayHours}</p>
            <span className="text-sm text-stone-600 font-mono">HRS</span>
          </div>
        </Card>

        <Card className="bg-stone-900/20 border-white/5 p-8 rounded-[2rem] hover:bg-stone-900/40 transition-all group">
          <p className="text-[10px] text-stone-500 uppercase tracking-[0.2em] mb-4 font-black">Active Cycles</p>
          <div className="flex items-baseline gap-2">
            <p className="text-6xl font-serif italic text-white group-hover:text-blue-400 transition-colors">{activeTasks}</p>
            <span className="text-sm text-stone-600 font-mono">TASKS</span>
          </div>
        </Card>

        <Card className="bg-stone-900/20 border-white/5 p-8 rounded-[2rem] relative overflow-hidden group">
          <p className="text-[10px] text-stone-500 uppercase tracking-[0.2em] mb-4 font-black">Node Status</p>
          <div className="flex items-center gap-3">
            <p className="text-3xl font-serif italic text-[#a9b897] uppercase tracking-tighter leading-none">{currentTier}</p>
            <Lock size={14} className="text-stone-700" />
          </div>
          <Zap size={80} className="absolute -right-4 -bottom-4 text-white/5 group-hover:text-[#a9b897]/10 transition-colors" />
        </Card>
      </div>

      {/* LOWER SECTION: Clarity Console & Insights */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* CONSOLE: Focused on readability and clean lines */}
        <div className="lg:col-span-8">
          <div className="bg-stone-900/20 border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col h-[550px] shadow-2xl">
            <div className="px-8 py-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#a9b897] shadow-[0_0_8px_#a9b897]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Clarity OS v1.0.4</span>
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
                    <div className={`max-w-[80%] p-4 rounded-2xl text-[11px] leading-relaxed ${
                      msg.role === 'user' 
                      ? 'bg-[#a9b897] text-black font-bold rounded-tr-none' 
                      : 'bg-white/[0.03] text-stone-300 border border-white/5 rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                {isThinking && (
                  <div className="flex gap-2 items-center text-stone-600 text-[10px] italic">
                    <Loader2 size={12} className="animate-spin" /> Analyzing vectors...
                  </div>
                )}
              </AnimatePresence>
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={askClarity} className="p-6 border-t border-white/5 bg-black/20">
              <div className="relative flex items-center">
                <ChevronRight size={18} className="absolute left-4 text-[#a9b897]" />
                <input 
                  type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask Clarity..."
                  className="w-full bg-stone-900/50 border border-white/10 rounded-xl py-4 pl-12 pr-16 outline-none focus:border-[#a9b897]/40 transition-all text-[11px] font-mono"
                />
                <button type="submit" className="absolute right-3 bg-stone-800 hover:bg-[#a9b897] hover:text-black text-[#a9b897] p-2 rounded-lg transition-all">
                  <Send size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* SIDEBAR WIDGETS */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#a9b897]/5 border border-[#a9b897]/10 rounded-[2rem] p-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white mb-6">Quick Links</h4>
            <div className="space-y-4 font-mono text-[10px]">
              {['/billing', '/status', '/draft'].map((path) => (
                <div key={path} className="flex justify-between items-center py-2 border-b border-white/5 text-stone-500 hover:text-[#a9b897] cursor-pointer transition-colors">
                  <span className="uppercase tracking-widest">{path.replace('/', '')}</span>
                  <span className="opacity-50">{path}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-8 rounded-[2rem] border border-white/5 bg-stone-900/10 flex items-center justify-center">
            <p className="text-[11px] text-stone-600 font-serif italic text-center">
              "System efficiency is the product of focused intent."
            </p>
          </div>
        </div>

      </section>
    </div>
  );
}