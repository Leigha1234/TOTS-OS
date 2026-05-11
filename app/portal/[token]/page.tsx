"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/auth";
// Refactored import to use the new Neural Engine while keeping the old variable name
import { runClarity as generateInsights } from "@/lib/clarity";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  ArrowUpRight, 
  CreditCard, 
  Calendar, 
  ShieldCheck,
  Clock,
  Zap
} from "lucide-react";

export default function ClientDashboard() {
  const supabase = useMemo(() => createClient(), []);

  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<string[]>([]);
  const [headline, setHeadline] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);

  const init = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("customer_id", user.id)
      .order("due_date", { ascending: true });

    if (error) {
      console.error("Fetch Error:", error);
      setLoading(false);
      return;
    }

    const invoices = data || [];
    setDocs(invoices);

    // FIX: Changed to await because the new Clarity AI is an async Neural Engine
    try {
      const result = await generateInsights({ 
        invoices, 
        tasks: [], 
        context: "portal" 
      });
      
      setInsights(result.insights || []);
      setHeadline(result.headline || "Portal Status");
    } catch (err) {
      console.error("Clarity sync failed:", err);
      setHeadline("System Online");
    }
    
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    init();
  }, [init]);

  // Insights Rotation Logic
  useEffect(() => {
    if (insights.length <= 1) return;
    const i = setInterval(() => {
      setActiveSlide((p) => (p + 1) % insights.length);
    }, 5000); // Slightly slower rotation for better readability
    return () => clearInterval(i);
  }, [insights]);

  async function pay(inv: any) {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        body: JSON.stringify({
          amount: inv.amount,
          invoiceId: inv.id,
        }),
      });

      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error("Payment initiation failed:", err);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf9f6] gap-4">
        <Zap className="text-[#a9b897] animate-pulse" size={32} />
        <p className="font-serif italic text-stone-400">Synchronizing with Neural Vault...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] p-6 md:p-12 lg:p-20">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* HEADER */}
        <header className="space-y-4">
          <div className="flex items-center gap-3 text-stone-400">
            <ShieldCheck size={14} className="text-[#a9b897]" />
            <span className="text-[9px] font-black uppercase tracking-[0.4em]">Secure Client Access Protocol</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-serif italic text-stone-900 tracking-tighter">
            Your Ledger
          </h1>
        </header>

        {/* CLARITY INSIGHTS ENGINE */}
        {insights.length > 0 && (
          <section className="bg-stone-900 rounded-[3.5rem] p-10 md:p-14 text-white overflow-hidden relative shadow-2xl border border-white/5">
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-3 text-[#a9b897]">
                <Sparkles size={18} />
                <span className="text-[9px] font-black uppercase tracking-[0.5em]">Neural Insights</span>
              </div>
              
              <div className="min-h-[140px] flex flex-col justify-center">
                <h2 className="text-3xl md:text-4xl font-serif italic mb-6 text-stone-100 leading-tight">{headline}</h2>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={activeSlide}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-lg text-stone-400 leading-relaxed max-w-2xl font-medium"
                  >
                    {insights[activeSlide]}
                  </motion.p>
                </AnimatePresence>
              </div>

              <div className="flex gap-3">
                {insights.map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    className={`h-1 transition-all duration-700 rounded-full ${idx === activeSlide ? 'w-12 bg-[#a9b897]' : 'w-3 bg-stone-800'}`} 
                  />
                ))}
              </div>
            </div>
            {/* Aesthetic Glow */}
            <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-[#a9b897] blur-[150px] opacity-[0.15] pointer-events-none" />
          </section>
        )}

        {/* LEDGER / INVOICES */}
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 whitespace-nowrap">
              Outstanding Transmissions
            </h3>
            <div className="h-px w-full bg-stone-200" />
          </div>
          
          <div className="space-y-4">
            {docs.map((d) => (
              <motion.div 
                key={d.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-stone-200 rounded-[2.5rem] p-8 md:p-10 flex flex-col md:flex-row justify-between items-center gap-8 hover:shadow-2xl hover:border-[#a9b897]/40 transition-all group"
              >
                <div className="flex items-center gap-10 w-full md:w-auto">
                  <div className={`p-6 rounded-3xl transition-all duration-500 ${d.status === 'paid' ? 'bg-stone-50 text-stone-300' : 'bg-stone-50 text-stone-900 group-hover:bg-stone-900 group-hover:text-white'}`}>
                    <CreditCard size={28} strokeWidth={1.5} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <p className="text-4xl font-mono font-black tracking-tighter text-stone-900">
                        £{Number(d.amount).toLocaleString()}
                      </p>
                      <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full tracking-widest ${
                        d.status === 'paid' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-stone-100 text-stone-500'
                      }`}>
                        {d.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-stone-400 text-[9px] font-black uppercase tracking-[0.2em]">
                      <span className="flex items-center gap-2"><Calendar size={12} className="text-[#a9b897]" /> Due {d.due_date || "Upon Receipt"}</span>
                      {d.status !== 'paid' && (
                         <span className="flex items-center gap-2 text-red-400 animate-pulse"><Clock size={12} /> Priority</span>
                      )}
                    </div>
                  </div>
                </div>

                {d.status !== "paid" ? (
                  <button 
                    onClick={() => pay(d)} 
                    className="w-full md:w-auto px-12 py-6 bg-stone-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-[#a9b897] transition-all flex items-center justify-center gap-4 shadow-xl active:scale-95 group/btn"
                  >
                    Authorize Payment <ArrowUpRight size={18} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                  </button>
                ) : (
                  <div className="px-12 py-6 bg-stone-50 border border-stone-100 text-stone-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-3">
                    Verified & Settled
                  </div>
                )}
              </motion.div>
            ))}

            {docs.length === 0 && (
              <div className="py-24 text-center border-2 border-dashed border-stone-200 rounded-[4rem] bg-stone-50/30">
                <p className="font-serif italic text-stone-400 text-xl">Your archival record is clear of all obligations.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}