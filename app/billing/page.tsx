"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight, UserPlus, ShieldCheck, Zap, Globe } from "lucide-react";
import { motion } from "framer-motion";
// FIX: Import the singleton correctly
import { getBrowserClient } from "@/lib/supabase";

const TIERS = [
  {
    name: "Standard",
    price: "29",
    color: "var(--brand-primary)",
    goal: "Get out of chaos + into structure",
    description: "Foundational System Access",
    stripeLink: "https://buy.stripe.com/test_standard_link",
    features: ["Core system node", "Task management", "Basic CRM", "Financial tracking", "Standard automations", "Single operator"],
  },
  {
    name: "Professional",
    price: "59",
    color: "#7e9cb9", 
    goal: "Run the business properly day-to-day",
    description: "Scalable Growth Architecture",
    stripeLink: "https://buy.stripe.com/test_pro_link", 
    featured: true,
    features: ["Everything in Standard +", "Advanced CRM", "Deeper automation", "Team features", "Email integrations", "Multi-user setup"],
  },
  {
    name: "Elite",
    price: "149",
    color: "#b97e7e", 
    goal: "Business runs as a system",
    description: "Enterprise OS Deployment",
    stripeLink: "https://buy.stripe.com/test_elite_link",
    features: ["Everything in Professional +", "Full business OS build", "Hands-off automations", "Custom workflows", "Priority protocol support"],
  },
];

export default function BillingPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      // FIX: Use the singleton instance
      const supabase = getBrowserClient();
      if (!supabase) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email ?? null);
    };
    getUser();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] selection:bg-[var(--brand-primary)] selection:text-white transition-colors duration-500">
      <div className="max-w-[1400px] mx-auto px-6 py-12 md:p-20 space-y-16 pb-32">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[var(--border)] pb-12 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[var(--brand-primary)]">
              <ShieldCheck size={14} />
              <p className="font-black uppercase text-[10px] tracking-[0.4em]">Subscription Protocols</p>
            </div>
            <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter leading-none">System Access</h1>
          </div>
          
          {userEmail && (
            <div className="bg-[var(--bg-soft)] border border-[var(--border)] px-6 py-4 rounded-2xl shadow-sm">
              <p className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest mb-1">Authenticated Node</p>
              <p className="text-xs font-mono text-[var(--text-main)] opacity-70">{userEmail}</p>
            </div>
          )}
        </header>

        {/* PRICING GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {TIERS.map((tier) => (
            <motion.div 
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative p-10 md:p-12 rounded-[3rem] border transition-all duration-500 flex flex-col justify-between overflow-hidden group ${
                tier.featured 
                ? 'bg-[var(--card-bg)] border-[var(--brand-primary)] shadow-2xl scale-105 z-10' 
                : 'bg-[var(--bg-soft)] border-[var(--border)] hover:bg-[var(--card-bg)]'
              }`}
            >
              {tier.featured && (
                <div className="absolute top-8 right-8 bg-[var(--brand-primary)] text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                  Recommended
                </div>
              )}

              <div>
                <div className="space-y-1 mb-8">
                  <h3 className="text-3xl font-serif italic text-[var(--brand-primary)]">{tier.name}</h3>
                  <p className="text-[var(--text-muted)] text-[10px] uppercase font-black tracking-widest">{tier.description}</p>
                </div>
                
                <div className="flex items-baseline gap-1 mb-10">
                  <span className="text-6xl font-serif italic tracking-tighter">£{tier.price}</span>
                  <span className="text-[var(--text-muted)] text-[11px] uppercase font-black">/mo</span>
                </div>

                <div className="space-y-5 mb-12">
                  {tier.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <CheckCircle2 size={14} className="mt-0.5" style={{ color: tier.color }} />
                      <span className="text-[13px] text-[var(--text-main)] opacity-80 leading-tight font-medium">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8 border-t border-[var(--border)] mt-auto">
                <button 
                  onClick={() => { setLoading(tier.name); window.location.href = tier.stripeLink; }}
                  className={`w-full flex items-center justify-between p-6 rounded-2xl transition-all uppercase text-[10px] font-black tracking-[0.2em] ${
                    tier.featured
                    ? 'bg-[var(--brand-primary)] text-white shadow-lg hover:opacity-90'
                    : 'bg-[var(--text-main)] text-[var(--bg)] hover:bg-[var(--brand-primary)] hover:text-white'
                  }`}
                >
                  {loading === tier.name ? "Initialising..." : `Deploy ${tier.name}`}
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