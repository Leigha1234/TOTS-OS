"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
// Removed direct supabase client import to avoid build-time module resolution errors.
// We'll fetch the authenticated user from an auth endpoint at runtime instead.
import { toast } from "sonner";

const TIERS = [
  {
    name: "Standard",
    price: "29",
    color: "#a9b897",
    description: "ESSENTIAL WORKSPACE ACCESS",
    features: ["Core system dashboard", "Task management", "Basic CRM tools", "Financial overview"],
  },
  {
    name: "Professional",
    price: "59",
    color: "#7e9cb9",
    description: "SCALABLE GROWTH ARCHITECTURE",
    featured: true,
    features: ["Everything in Standard +", "Advanced CRM matrix", "Deeper automation tools", "Team management features", "Email integrations"],
  },
  {
    name: "Elite",
    price: "149",
    color: "#b97e7e",
    description: "ENTERPRISE OS DEPLOYMENT",
    features: ["Everything in Professional +", "Full business OS build", "Hands-off automations", "Custom workflows", "Priority support"],
  },
];

export default function BillingPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const formatPounds = (value: number | string) =>
    (Math.round(Number(value) * 100) / 100).toFixed(2);

  useEffect(() => {
    // Try to retrieve the authenticated user's email from a runtime endpoint.
    // This avoids importing a supabase client at build time in this client component.
    const getUser = async () => {
      try {
        const res = await fetch('/api/auth/user');
        if (!res.ok) return;
        const data = await res.json();
        const email = data?.user?.email ?? null;
        if (email) setUserEmail(email);
      } catch (e) {
        // ignore
      }
    };
    getUser();
  }, []);

  const handleCheckout = async (tier: string) => {
    setLoading(tier);
    try {
      const response = await fetch("/api/pay/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      
      const { url, error } = await response.json();
      if (error) throw new Error(error);
      if (url) window.location.href = url;
      
    } catch (err: any) {
      toast.error("Unable to proceed to billing: " + err.message);
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfaf7] text-stone-900 p-6 md:p-20">
      <div className="max-w-[1400px] mx-auto space-y-16">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start border-b border-stone-200 pb-12 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#a9b897]">
              <ShieldCheck size={14} />
              <p className="font-black uppercase text-[10px] tracking-[0.4em]">Subscription Selection</p>
            </div>
            <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter leading-none">System Access</h1>
          </div>
          
          {userEmail && (
            <div className="bg-white border border-stone-100 px-6 py-4 rounded-2xl shadow-sm">
              <p className="text-[9px] font-black uppercase text-stone-400 tracking-widest mb-1">Authenticated Account</p>
              <p className="text-xs font-mono text-stone-600">{userEmail}</p>
            </div>
          )}
        </header>

        {/* PRICING GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {TIERS.map((tier) => (
            <motion.div 
              key={tier.name}
              className={`relative p-10 rounded-[3rem] border transition-all flex flex-col justify-between ${
                tier.featured 
                ? 'bg-white border-[#a9b897] shadow-2xl scale-105 z-10' 
                : 'bg-stone-50 border-stone-200'
              }`}
            >
              <div>
                <div className="space-y-1 mb-8">
                  <h3 className="text-3xl font-serif italic" style={{ color: tier.color }}>{tier.name}</h3>
                  <p className="text-stone-400 text-[10px] uppercase font-black tracking-widest">{tier.description}</p>
                </div>
                
                <div className="flex items-baseline gap-1 mb-10">
                  <span className="text-6xl font-serif italic tracking-tighter">
                    £{formatPounds(tier.price)}
                  </span>
                  <span className="text-stone-400 text-[11px] uppercase font-black">/mo</span>
                </div>

                <div className="space-y-5 mb-12">
                  {tier.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <CheckCircle2 size={14} className="mt-0.5" style={{ color: tier.color }} />
                      <span className="text-[13px] text-stone-600 leading-tight font-medium">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8 border-t border-stone-200 mt-auto">
                <button 
                  onClick={() => handleCheckout(tier.name)}
                  disabled={!!loading}
                  className={`w-full flex items-center justify-between p-6 rounded-2xl transition-all uppercase text-[10px] font-black tracking-[0.2em] ${
                    tier.featured
                    ? 'bg-stone-900 text-white hover:bg-black'
                    : 'bg-white text-stone-900 border border-stone-200 hover:border-stone-900'
                  }`}
                >
                  {loading === tier.name ? <Loader2 className="animate-spin" /> : <>Select {tier.name} Plan</>}
                  <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}