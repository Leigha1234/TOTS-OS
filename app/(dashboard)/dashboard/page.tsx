"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import AuthGuard from "../../components/AuthGuard";
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
        content: `Analysis complete. You have ${activeTasks} pending cycles. Based on your ${todayHours} hours logged, focus on deep work.` 
      }]);
      setIsThinking(false);
    }, 1200);
  };

  return (
    <AuthGuard>
      <div className="p-8 md:p-12 space-y-10 bg-[#050505] min-h-screen text-stone-200">
        <header className="flex justify-between items-end border-b border-white/5 pb-8">
          <div>
            <p className="text-[#a9b897] font-black uppercase text-[10px] tracking-[0.4em] mb-2">Operational Overview</p>
            <h1 className="text-5xl font-serif italic text-white tracking-tighter">Command Center</h1>
          </div>
          <div className="flex items-center gap-3 text-stone-500 text-xs font-mono bg-white/5 px-4 py-2 rounded-full border border-white/5">
            <Activity size={14} className={`${isSyncing ? 'text-amber-500' : 'text-green-500'} animate-pulse`} />
            {isSyncing ? "SYNCING..." : `NODE_ACTIVE: ${new Date().toLocaleDateString()}`}
          </div>
        </header>

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
              <p className="text-3xl font-serif italic text-[#a9b897] uppercase tracking-tighter">{currentTier}</p>
              <Lock size={14} className="text-stone-700" />
            </div>
          </Card>
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col h-[500px]">
              <div className="px-8 py-5 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Clarity OS v1.0.4</span>
                <Terminal size={14} className="text-stone-600" />
              </div>
              <div className="flex-grow overflow-y-auto p-8 space-y-6 font-mono">
                <AnimatePresence mode="popLayout">
                  {chatHistory.map((msg, i) => (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-5 rounded-2xl text-[11px] ${msg.role === 'user' ? 'bg-[#a9b897] text-black font-bold' : 'bg-white/[0.03] text-stone-300 border border-white/5'}`}>
                        {msg.content}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <form onSubmit={askClarity} className="p-6 border-t border-white/5">
                <div className="relative flex items-center group">
                  <ChevronRight size={18} className="absolute left-4 text-[#a9b897]" />
                  <input 
                    type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                    placeholder="Inquire with Clarity..."
                    className="w-full bg-stone-900/40 border border-white/5 rounded-xl py-4 pl-12 pr-16 outline-none focus:border-[#a9b897]/50 text-sm font-mono text-white"
                  />
                  <button type="submit" className="absolute right-3 bg-[#a9b897] text-black p-2 rounded-lg"><Send size={16} /></button>
                </div>
              </form>
            </div>
          </div>
          <div className="lg:col-span-4 space-y-6">
             <div className="bg-[#a9b897]/5 border border-[#a9b897]/10 rounded-[2rem] p-8">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-4">Command Injection</h4>
                <ul className="text-[10px] text-stone-500 space-y-3 font-mono uppercase tracking-widest">
                  <li className="flex justify-between border-b border-white/5 pb-2"><span>Pending Invoices</span> <span>/billing</span></li>
                  <li className="flex justify-between border-b border-white/5 pb-2"><span>Cycle Status</span> <span>/status</span></li>
                </ul>
             </div>
          </div>
        </section>
      </div>
    </AuthGuard>
  );
}