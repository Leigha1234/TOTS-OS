"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Terminal, Send, ChevronRight, Activity, Zap, Lock 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const [todayHours, setTodayHours] = useState(0);
  const [activeTasks, setActiveTasks] = useState(0);
  const [currentTier, setCurrentTier] = useState("Standard Node");
  const [isSyncing, setIsSyncing] = useState(true);
  
  const [query, setQuery] = useState("");
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
        setCurrentTier(profileRes.data.tier.toUpperCase() + " NODE");
      }
      setIsSyncing(false);
    }

    loadStats();

    const profileSubscription = supabase
      .channel('profile_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, payload => {
        if (payload.new.tier) {
          setCurrentTier(payload.new.tier.toUpperCase() + " NODE");
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(profileSubscription); };
  }, []);

  const askClarity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setChatHistory(prev => [...prev, { role: 'user', content: query }]);
    const currentQuery = query;
    setQuery("");
    
    setTimeout(() => {
      setChatHistory(prev => [...prev, { 
        role: 'clarity', 
        content: `Analysis of "${currentQuery}" complete. System optimization recommended for ${currentTier}.` 
      }]);
    }, 800);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  return (
    <div className="p-8 md:p-12 space-y-12 max-w-[1600px] mx-auto bg-[var(--bg)] min-h-screen transition-colors duration-500">
      
      {/* HEADER */}
      <header className="flex justify-between items-end border-b border-[var(--border)] pb-8">
        <div className="space-y-2">
          <p className="text-[var(--accent)] font-black uppercase text-[10px] tracking-[0.6em]">Operational Overview</p>
          <h1 className="text-6xl font-serif italic tracking-tighter text-[var(--text-main)]">Command Center</h1>
        </div>
        <div className="flex items-center gap-4 bg-[var(--card-bg)] px-6 py-3 rounded-full border border-[var(--border)] backdrop-blur-xl shadow-sm">
          <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-500 animate-pulse' : 'bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]'}`} />
          <span className="text-[10px] font-mono font-bold tracking-widest text-[var(--text-muted)] uppercase">
            {isSyncing ? "Syncing..." : `Node Active // ${new Date().toLocaleDateString()}`}
          </span>
        </div>
      </header>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <StatCard label="Daily Velocity" value={todayHours} unit="HRS" />
        <StatCard label="Active Cycles" value={activeTasks} unit="TASKS" />
        <div className="card-fancy p-10 relative overflow-hidden group transition-all">
          <p className="text-[10px] text-[var(--text-muted)] group-hover:text-white/70 uppercase tracking-[0.4em] mb-6 font-black">Distribution Level</p>
          <div className="flex items-center gap-3">
            <h2 className="text-4xl font-serif italic text-[var(--accent)] uppercase tracking-tighter group-hover:text-white transition-colors">{currentTier}</h2>
            <Lock size={16} className="text-[var(--text-muted)] group-hover:text-white opacity-40 transition-colors" />
          </div>
          <Zap size={120} className="absolute -right-8 -bottom-8 text-[var(--accent)] opacity-5 group-hover:opacity-20 transition-all duration-700 rotate-12" />
        </div>
      </div>

      {/* CONSOLE & NAVIGATION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 glass-panel h-[500px] flex flex-col relative overflow-hidden shadow-2xl">
          <div className="px-8 py-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-panel)]">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Clarity OS v1.0.4</span>
            <Terminal size={14} className="opacity-30" />
          </div>
          
          <div className="flex-grow p-10 space-y-6 overflow-y-auto scrollbar-hide">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl font-mono text-[11px] ${
                  msg.role === 'user' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg)] border border-[var(--border)] text-[var(--text-main)]'
                }`}>
                  {msg.role === 'clarity' && <span className="text-[var(--accent)] mr-2">&gt;</span>}
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={askClarity} className="p-8 bg-[var(--bg-panel)] border-t border-[var(--border)]">
            <div className="relative flex items-center">
              <ChevronRight size={18} className="absolute left-5 text-[var(--accent)]" />
              <input 
                value={query} onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-2xl py-5 pl-14 pr-16 outline-none focus:border-[var(--accent)] transition-all font-mono text-[11px]" 
                placeholder="Enter command..." 
              />
              <button className="absolute right-4 bg-[var(--accent)] text-white p-3 rounded-xl hover:scale-105 transition-transform"><Send size={18}/></button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="glass-panel p-10 shadow-xl">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8">Quick Links</h3>
              <div className="space-y-4 font-mono text-[11px]">
                {['/billing', '/status', '/logs'].map(link => (
                  <div key={link} className="flex justify-between py-3 border-b border-[var(--border)] hover:text-[var(--accent)] hover:pl-2 cursor-pointer transition-all">
                    <span className="font-bold">{link.replace('/', '').toUpperCase()}</span>
                    <span className="opacity-30">{link}</span>
                  </div>
                ))}
              </div>
           </div>
           <div className="p-10 rounded-[2.5rem] border border-[var(--border)] italic text-[var(--text-muted)] text-center text-sm font-serif leading-relaxed opacity-60">
             "System efficiency is the product of focused intent."
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit }: { label: string, value: number, unit: string }) {
  return (
    <div className="card-fancy p-10 group transition-all">
      <p className="text-[10px] text-[var(--text-muted)] group-hover:text-white/70 uppercase tracking-[0.4em] mb-6 font-black">{label}</p>
      <div className="flex items-baseline gap-3">
        <span className="text-7xl font-serif italic tracking-tighter group-hover:text-white transition-colors">{value}</span>
        <span className="text-xs font-mono text-[var(--text-muted)] group-hover:text-white/50 uppercase">{unit}</span>
      </div>
    </div>
  );
}