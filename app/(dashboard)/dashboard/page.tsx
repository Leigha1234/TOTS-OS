"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Terminal, Send, ChevronRight, Activity, Zap, Loader2, Lock 
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setIsSyncing(false);

      const today = new Date().toISOString().split('T')[0];
      
      const [hoursRes, tasksRes, profileRes] = await Promise.all([
        supabase.from("timesheets").select("hours").eq("user_id", user.id).eq("date", today),
        supabase.from("tasks").select("*", { count: 'exact', head: true }).eq("user_id", user.id).neq("status", "done"),
        supabase.from("profiles").select("tier").eq("id", user.id).single()
      ]);

      setTodayHours(hoursRes.data?.reduce((s, h) => s + h.hours, 0) || 0);
      setActiveTasks(tasksRes.count || 0);
      if (profileRes.data?.tier) {
        setCurrentTier(profileRes.data.tier.charAt(0).toUpperCase() + profileRes.data.tier.slice(1) + " Node");
      }
      setIsSyncing(false);
    }

    loadStats();

    // REAL-TIME SUBSCRIPTION FIX: Listen for tier changes in the database
    const profileSubscription = supabase
      .channel('profile_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, payload => {
        if (payload.new.tier) {
          setCurrentTier(payload.new.tier.charAt(0).toUpperCase() + payload.new.tier.slice(1) + " Node");
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(profileSubscription); };
  }, []);

  const askClarity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setChatHistory(prev => [...prev, { role: 'user', content: query }]);
    setQuery("");
    setIsThinking(true);
    
    // Simulate AI parsing
    setTimeout(() => {
      setChatHistory(prev => [...prev, { 
        role: 'clarity', 
        content: `Analysis complete. You have ${activeTasks} pending cycles. Optimization recommended for ${currentTier}.` 
      }]);
      setIsThinking(false);
    }, 1200);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  return (
    <div className="p-6 md:p-10 space-y-10 bg-[var(--bg)] min-h-screen text-[var(--text-main)] transition-all duration-500">
      
      {/* HEADER */}
      <header className="flex justify-between items-end pb-2">
        <div className="space-y-1">
          <p className="text-[var(--accent)] font-black uppercase text-[10px] tracking-[0.5em] opacity-80">Operational Overview</p>
          <h1 className="text-5xl font-serif italic tracking-tighter text-[var(--text-main)] uppercase">Command Center</h1>
        </div>
        <div className="hidden md:flex items-center gap-3 text-[var(--text-muted)] text-[10px] font-mono bg-[var(--card-bg)] px-5 py-2.5 rounded-full border border-[var(--border)] backdrop-blur-md shadow-sm">
          <Activity size={12} className={`${isSyncing ? 'text-amber-500' : 'text-[var(--accent)]'} animate-pulse`} />
          {isSyncing ? "SYNCING..." : `NODE_ACTIVE: ${new Date().toLocaleDateString()}`}
        </div>
      </header>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="card-fancy p-10 group transition-all cursor-default">
          <p className="text-[10px] text-[var(--text-muted)] group-hover:text-white/70 uppercase tracking-[0.3em] mb-4 font-black">Daily Velocity</p>
          <div className="flex items-baseline gap-2">
            <p className="text-7xl font-serif italic tracking-tighter text-[var(--text-main)] group-hover:text-white transition-colors">{todayHours}</p>
            <span className="text-sm font-mono text-[var(--text-muted)] group-hover:text-white/50 transition-colors uppercase">HRS</span>
          </div>
        </div>

        <div className="card-fancy p-10 group transition-all cursor-default">
          <p className="text-[10px] text-[var(--text-muted)] group-hover:text-white/70 uppercase tracking-[0.3em] mb-4 font-black">Active Cycles</p>
          <div className="flex items-baseline gap-2">
            <p className="text-7xl font-serif italic tracking-tighter text-[var(--text-main)] group-hover:text-white transition-colors">{activeTasks}</p>
            <span className="text-sm font-mono text-[var(--text-muted)] group-hover:text-white/50 transition-colors uppercase">TASKS</span>
          </div>
        </div>

        <div className="card-fancy p-10 relative overflow-hidden group transition-all cursor-default">
          <p className="text-[10px] text-[var(--text-muted)] group-hover:text-white/70 uppercase tracking-[0.3em] mb-4 font-black">Node Status</p>
          <div className="flex items-center gap-3">
            <p className="text-3xl font-serif italic text-[var(--accent)] group-hover:text-white uppercase tracking-tighter transition-colors leading-none">{currentTier}</p>
            <Lock size={14} className="text-[var(--text-muted)] group-hover:text-white opacity-40 transition-colors" />
          </div>
          <Zap size={100} className="absolute -right-6 -bottom-6 text-[var(--accent)] opacity-5 group-hover:text-white group-hover:opacity-20 transition-all duration-500" />
        </div>
      </div>

      {/* CLARITY CONSOLE */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <div className="glass-panel h-[550px] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-8 py-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-panel)]">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent)] animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Clarity OS v1.0.4</span>
              </div>
              <Terminal size={14} className="text-[var(--text-muted)] opacity-50" />
            </div>

            <div className="flex-grow overflow-y-auto p-10 space-y-8 font-mono scrollbar-hide">
              <AnimatePresence mode="popLayout">
                {chatHistory.map((msg, i) => (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-5 rounded-2xl text-[11px] leading-relaxed shadow-sm ${
                      msg.role === 'user' ? 'bg-[var(--accent)] text-white font-bold rounded-tr-none' : 'bg-[var(--card-bg)] text-[var(--text-main)] border border-[var(--border)] rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={askClarity} className="p-8 border-t border-[var(--border)] bg-[var(--bg-panel)]">
              <div className="relative flex items-center">
                <ChevronRight size={18} className="absolute left-5 text-[var(--accent)]" />
                <input 
                  type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-2xl py-5 pl-14 pr-16 outline-none focus:border-[var(--accent)] transition-all text-[11px] font-mono text-[var(--text-main)]"
                  placeholder="Ask Clarity..."
                />
                <button type="submit" className="absolute right-4 bg-[var(--accent)] text-white p-3 rounded-xl shadow-lg hover:opacity-90">
                  <Send size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* SIDEBAR WIDGETS */}
        <div className="lg:col-span-4 space-y-8">
          <div className="glass-panel p-10 shadow-xl">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-main)] mb-8">Quick Navigation</h4>
            <div className="space-y-5 font-mono text-[10px]">
              {['/billing', '/status', '/logs'].map((path) => (
                <div key={path} className="flex justify-between items-center py-3 border-b border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)] cursor-pointer transition-all hover:pl-2">
                  <span className="uppercase tracking-[0.2em] font-bold">{path.replace('/', '')}</span>
                  <span className="opacity-40">{path}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}