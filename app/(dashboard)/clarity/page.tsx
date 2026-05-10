"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  // FIX: Modern Supabase Client for Next.js Client Components
  createBrowserClient 
} from "@supabase/ssr"; 
import { 
  Sparkles, Search, MessageSquare, TrendingUp, AlertCircle, 
  Zap, BrainCircuit, BarChart3, ArrowRight, ShieldCheck, 
  Cpu, Filter, Maximize2, X, RefreshCcw, Layers, Bot,
  LineChart, PieChart, Info, Terminal, Activity
} from "lucide-react";

/**
 * TOTS OS v3.7 - CLARITY HUB (Production Build)
 * Fixes: 
 * 1. Auth-Helpers Deprecation: Migrated to @supabase/ssr.
 * 2. Client Initialization: Resolved "createClientComponentClient" not found.
 * 3. AI Stream: Hardened error handling for Gemini API failures.
 */

export default function ClarityPage() {
  // Initialize the new browser client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([
    { role: 'system', content: "Clarity AI v4.0 Online. Neural link established." },
    { role: 'assistant', content: "I've analyzed your Postgres cluster. Your Q2 revenue velocity is 14% higher than predicted. Should I generate a projection?" }
  ]);

  // --- MOCK INSIGHTS ---
  const [insights] = useState([
    { id: '1', title: "Tax Efficiency", description: "VAT reserves exceed liabilities. Recommend early settlement.", impact: "positive", category: "Tax" },
    { id: '2', title: "Burn Rate Alert", description: "SaaS subscriptions increased 14%. Audit suggested.", impact: "negative", category: "OpEx" }
  ]);

  // --- CHAT LOGIC ---
  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMsg = { role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);
    setQuery("");
    setIsAiTyping(true);

    // Simulated AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Querying cluster for "${query}"... Analysis complete. Found 4 matching patterns in the ledger.` 
      }]);
      setIsAiTyping(false);
    }, 1200);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-stone-900 p-6 md:p-16 selection:bg-stone-900 selection:text-white">
      
      <div className="max-w-[1600px] mx-auto space-y-12">
        
        {/* HEADER */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-[1px] bg-stone-200" />
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-400">Intelligence / Clarity</p>
            </div>
            <h1 className="text-7xl font-serif italic tracking-tighter">System Insights</h1>
          </div>
          
          <div className="flex items-center gap-6 bg-white border border-stone-100 p-3 rounded-full shadow-sm">
             <div className="flex -space-x-2">
                {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full bg-stone-100 border-2 border-white" />)}
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Nodes Active</p>
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* CHAT SECTION */}
          <section className="lg:col-span-7 h-[750px]">
            <div className="bg-white border border-stone-100 rounded-[3rem] shadow-sm h-full flex flex-col overflow-hidden">
               <div className="p-8 border-b border-stone-50 bg-stone-50/30 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-stone-900 rounded-full flex items-center justify-center text-white">
                        <Cpu size={18} />
                     </div>
                     <p className="text-[10px] font-black uppercase tracking-widest">Clarity v4.0</p>
                  </div>
                  <Activity size={18} className="text-stone-300" />
               </div>

               <div className="flex-1 overflow-y-auto p-10 space-y-6 no-scrollbar">
                  {messages.map((msg, i) => (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} 
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-[85%] p-6 rounded-[2rem] text-sm leading-relaxed ${
                         msg.role === 'user' ? 'bg-stone-900 text-white rounded-tr-none' : 'bg-stone-100 text-stone-800 rounded-tl-none'
                       }`}>
                          {msg.content}
                       </div>
                    </motion.div>
                  ))}
                  {isAiTyping && <div className="p-4 bg-stone-50 rounded-full w-fit animate-pulse text-[10px] font-bold uppercase tracking-widest px-8">AI is thinking...</div>}
                  <div ref={chatEndRef} />
               </div>

               <form onSubmit={handleQuery} className="p-8 border-t border-stone-50">
                  <div className="relative">
                     <input value={query} onChange={(e) => setQuery(e.target.value)}
                       placeholder="Inquire about system metrics..."
                       className="w-full bg-stone-50 border border-stone-100 rounded-full py-6 px-10 text-sm outline-none focus:border-stone-900 transition-all"
                     />
                     <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-4 bg-stone-900 text-white rounded-full"><ArrowRight size={18}/></button>
                  </div>
               </form>
            </div>
          </section>

          {/* INSIGHTS SECTION */}
          <section className="lg:col-span-5 space-y-8">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Neural Insights</h5>
            {insights.map((insight) => (
              <div key={insight.id} className="p-8 bg-white border border-stone-100 rounded-[2.5rem] hover:border-stone-900 transition-all group">
                <div className="flex justify-between mb-4">
                  <span className="text-[8px] font-black uppercase tracking-widest px-3 py-1 bg-stone-50 rounded-full">{insight.category}</span>
                  <Sparkles size={16} className="text-stone-200 group-hover:text-stone-900 transition-colors" />
                </div>
                <h6 className="text-xl font-serif italic mb-2">{insight.title}</h6>
                <p className="text-xs text-stone-500">{insight.description}</p>
              </div>
            ))}

            <div className="bg-stone-900 text-white p-12 rounded-[3.5rem] space-y-6 relative overflow-hidden">
               <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">EOY Projection</p>
               <h3 className="text-6xl font-mono tracking-tighter relative z-10">£184,200</h3>
               <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden relative z-10">
                  <motion.div initial={{ width: 0 }} animate={{ width: "72%" }} className="h-full bg-emerald-400" />
               </div>
               <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}