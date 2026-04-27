"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/auth";
import { generateInsights } from "@/lib/clarity";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  ArrowUpRight, 
  CreditCard, 
  Calendar, 
  ShieldCheck,
  Clock
} from "lucide-react";

export default function ClientDashboard() {
  // Memoize client to prevent unnecessary re-instantiation
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

    const result = generateInsights(invoices, []);
    setInsights(result.insights || []);
    setHeadline(result.headline || "Portal Status");
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
    }, 4000);
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
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
        <p className="font-serif italic text-stone-400 animate-pulse">Establishing secure connection...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] p-6 md:p-12 lg:p-20">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* HEADER */}
        <header className="space-y-4">
          <div className="flex items-center gap-3 text-stone-400">
            <ShieldCheck size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Client Secure Portal</span>
          </div>
          <h1 className="text-6xl font-serif italic text-stone-900 tracking-tighter">
            Dashboard
          </h1>
        </header>

        {/* CLARITY INSIGHTS ENGINE */}
        {insights.length > 0 && (
          <section className="bg-stone-900 rounded-[3rem] p-10 md:p-14 text-white overflow-hidden relative shadow-2xl">
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-3 text-[#a9b897]">
                <Sparkles size={20} />
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Clarity AI</span>
              </div>
              
              <div className="min-h-[120px]">
                <h2 className="text-3xl font-serif italic mb-4 text-stone-200">{headline}</h2>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={activeSlide}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-lg text-stone-400 leading-relaxed max-w-2xl"
                  >
                    {insights[activeSlide]}
                  </motion.p>
                </AnimatePresence>
              </div>

              <div className="flex gap-2">
                {insights.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-1 rounded-full transition-all duration-500 ${idx === activeSlide ? 'w-8 bg-[#a9b897]' : 'w-2 bg-stone-700'}`} 
                  />
                ))}
              </div>
            </div>
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#a9b897] blur-[120px] opacity-20 pointer-events-none" />
          </section>
        )}

        {/* LEDGER / INVOICES */}
        <div className="space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-4">
            Outstanding Obligations
          </h3>
          
          <div className="space-y-4">
            {docs.map((d) => (
              <motion.div 
                key={d.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-stone-200 rounded-[2.5rem] p-8 flex flex-col md:flex-row justify-between items-center gap-8 hover:shadow-xl hover:border-[#a9b897] transition-all group"
              >
                <div className="flex items-center gap-8 w-full md:w-auto">
                  <div className={`p-5 rounded-2xl ${d.status === 'paid' ? 'bg-stone-50 text-stone-300' : 'bg-stone-50 text-stone-900 group-hover:bg-stone-900 group-hover:text-white transition-colors'}`}>
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-4">
                      <p className="text-3xl font-mono font-bold tracking-tighter text-stone-900">
                        £{Number(d.amount).toLocaleString()}
                      </p>
                      <span className={`text-[8px] font-black uppercase px-2 py-1 rounded tracking-widest ${
                        d.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-400'
                      }`}>
                        {d.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-stone-400 text-[10px] font-black uppercase tracking-widest">
                      <span className="flex items-center gap-2"><Calendar size={12} /> {d.due_date || "Open"}</span>
                      {d.status !== 'paid' && (
                         <span className="flex items-center gap-2 text-red-400"><Clock size={12} /> Action Required</span>
                      )}
                    </div>
                  </div>
                </div>

                {d.status !== "paid" ? (
                  <button 
                    onClick={() => pay(d)} 
                    className="w-full md:w-auto px-10 py-5 bg-stone-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#a9b897] transition-all flex items-center justify-center gap-3 group/btn"
                  >
                    Pay Transaction <ArrowUpRight size={16} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                  </button>
                ) : (
                  <div className="px-10 py-5 bg-stone-50 text-stone-400 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3">
                    Settled
                  </div>
                )}
              </motion.div>
            ))}

            {docs.length === 0 && (
              <div className="py-20 text-center border-2 border-dashed border-stone-200 rounded-[3rem]">
                <p className="font-serif italic text-stone-400 text-lg">Your account is currently clear of obligations.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}