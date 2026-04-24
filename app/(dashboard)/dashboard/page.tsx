"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import AuthGuard from "@/app/components/AuthGuard";
import { 
  Terminal, Send, ChevronRight, Activity, Zap, Lock, Loader2, Sparkles 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const supabase = createClient();
  const [todayHours, setTodayHours] = useState(0);
  const [activeTasks, setActiveTasks] = useState(0);
  const [currentTier, setCurrentTier] = useState("STANDARD NODE");
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setIsSyncing(false);

      const today = new Date().toISOString().split('T')[0];
      
      // Parallel data fetching
      const [hoursRes, tasksRes, profileRes] = await Promise.all([
        supabase.from("timesheets").select("hours").eq("user_id", user.id).eq("date", today),
        supabase.from("tasks").select("*", { count: 'exact', head: true }).eq("user_id", user.id).neq("status", "done"),
        supabase.from("profiles").select("tier").eq("id", user.id).maybeSingle()
      ]);

      setTodayHours(hoursRes.data?.reduce((s, h) => s + h.hours, 0) || 0);
      setActiveTasks(tasksRes.count || 0);
      if (profileRes.data?.tier) {
        setCurrentTier(`${profileRes.data.tier.toUpperCase()} NODE`);
      }
      setIsSyncing(false);
    }

    loadStats();

    // Listen for real-time tier upgrades
    const profileSubscription = supabase
      .channel('profile_changes')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles' 
      }, payload => {
        if (payload.new.tier) {
          setCurrentTier(`${payload.new.tier.toUpperCase()} NODE`);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(profileSubscription); };
  }, []);

  const askClarity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userQuery = query;
    setChatHistory(prev => [...prev, { role: 'user', content: userQuery }]);
    setQuery("");
    setIsThinking(true);
    
    // AI Synthesis Simulation
    setTimeout(() => {
      setChatHistory(prev => [...prev, { 
        role: 'clarity', 
        content: `Analysis of "${userQuery}" complete. Velocity: ${todayHours}h. Cycles: ${activeTasks}. Optimization recommended.` 
      }]);
      setIsThinking(false);
    }, 1000);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  return (
    <AuthGuard>
      <div className="p-8 md:p-12 space-y-12 max-w-[1600px] mx-auto bg-[#050505] min-h-screen text-stone-200">
        
        {/* HEADER */}
        <header className="flex justify-between items-end border-b border-white/5 pb-8">
          <div className="space-y-2">
            <p className="text-[#a9b897] font-black uppercase text-[10px] tracking-[0.6em]">Operational Overview</p>
            <h1 className="text-6xl font-serif italic tracking-tighter text-white">Command Center</h1>
          </div>
          <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-full border border-white/5 backdrop-blur-xl">
            <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-500 animate-pulse' : 'bg-[#a9b897] shadow-[0_0_10px_#a9b897]'}`} />
            <span className="text-[10px] font-mono font-bold tracking-widest text-stone-500 uppercase">
              {isSyncing ? "Syncing..." : `Node Active // ${new Date().toLocaleDateString()}`}
            </span>
          </div>
        </header>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <StatCard label="Daily Velocity" value={todayHours} unit="HRS" color="text-[#a9b897]" />
          <StatCard label="Active Cycles" value={activeTasks} unit="TASKS" color="text-blue-400" />
          
          <div className="bg-[#0a0a0a] border border-white/5 p-10 rounded-[2.5rem] relative overflow-hidden group transition-all hover:border-[#a9b897]/30">
            <p className="text-[10px] text-stone-500 uppercase tracking-[0.4em] mb-6 font-black">Distribution Level</p>
            <div className="flex items-center gap-3">
              <h2 className="text-4xl font-serif italic text-[#a9b897] uppercase tracking-tighter">{currentTier}</h2>
              <Lock size={16} className="text-stone-700" />
            </div>
            <Zap size={120} className="absolute -right-8 -bottom-8 text-[#a9b897] opacity-5 group-hover:opacity-15 transition-all duration-700 rotate-12" />
          </div>
        </div>

        {/* CONSOLE & NAVIGATION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 bg-[#0a0a0a] border border-white/5 rounded-[3rem] h-[550px] flex flex-col relative overflow-hidden shadow-2xl">
            <div className="px-8 py-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">Clarity OS v1.0.4</span>
              <Terminal size={14} className="opacity-30" />
            </div>
            
            <div className="flex-grow p-10 space-y-6 overflow-y-auto scrollbar-hide">
              <AnimatePresence mode="popLayout">
                {chatHistory.map((msg, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    key={i} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] p-5 rounded-2xl font-mono text-[11px] leading-relaxed ${
                      msg.role === 'user' 
                      ? 'bg-[#a9b897] text-black font-bold' 
                      : 'bg-white/[0.03] border border-white/5 text-stone-300'
                    }`}>
                      {msg.role === 'clarity' && <Sparkles size={14} className="inline mr-2 text-[#a9b897]" />}
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                {isThinking && (
                  <div className="flex items-center gap-3 text-stone-600 text-[10px] font-mono animate-pulse">
                    <Loader2 size={12} className="animate-spin" /> SYNTHESIZING_VECTORS...
                  </div>
                )}
              </AnimatePresence>
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={askClarity} className="p-8 bg-white/[0.01] border-t border-white/5">
              <div className="relative flex items-center">
                <ChevronRight size={18} className="absolute left-5 text-[#a9b897]" />
                <input 
                  value={query} onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-[#050505] border border-white/10 rounded-2xl py-5 pl-14 pr-16 outline-none focus:border-[#a9b897]/50 transition-all font-mono text-[11px] text-white" 
                  placeholder="Enter command..." 
                />
                <button className="absolute right-4 bg-[#a9b897] text-black p-3 rounded-xl hover:bg-white transition-colors">
                  <Send size={18}/>
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-4 space-y-8">
             <div className="bg-[#0a0a0a] border border-white/5 p-10 rounded-[3rem] shadow-xl">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 text-stone-500">Quick Links</h3>
                <div className="space-y-4 font-mono text-[11px]">
                  {['/billing', '/status', '/logs', '/settings'].map(link => (
                    <div key={link} className="flex justify-between py-3 border-b border-white/5 hover:text-[#a9b897] hover:pl-2 cursor-pointer transition-all text-stone-400">
                      <span className="font-bold">{link.replace('/', '').toUpperCase()}</span>
                      <span className="opacity-30">{link}</span>
                    </div>
                  ))}
                </div>
             </div>
             <div className="p-10 rounded-[2.5rem] border border-white/5 italic text-stone-600 text-center text-sm font-serif leading-relaxed">
               "System efficiency is the product of focused intent."
             </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

function StatCard({ label, value, unit, color }: { label: string, value: number, unit: string, color: string }) {
  return (
    <div className="bg-[#0a0a0a] border border-white/5 p-10 rounded-[2.5rem] group transition-all hover:border-white/10">
      <p className="text-[10px] text-stone-500 uppercase tracking-[0.4em] mb-6 font-black">{label}</p>
      <div className="flex items-baseline gap-3">
        <span className={`text-7xl font-serif italic tracking-tighter ${color}`}>{value}</span>
        <span className="text-xs font-mono text-stone-600 uppercase">{unit}</span>
      </div>
    </div>
  );
}