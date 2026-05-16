"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, CreditCard, ShieldCheck, 
  Clock, Check, AlertTriangle, 
  Loader2, ArrowUpRight, HelpCircle,
  TrendingUp, Zap, Award
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

/**
 * TOTS OS: SUBSCRIPTION & COMMERCIAL TIERS MANAGEMENT PORTAL v1.0
 * Architecture: Isolated Account Sub-Resource
 */

type SubscriptionTier = "standard" | "premium" | "elite";

interface TierFeature {
  text: string;
  included: boolean;
}

export default function ManageSubscription() {
  const router = useRouter();
  
  // -- Commercial Account State --
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>("premium");
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>("premium");
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"annual" | "monthly">("annual");

  // -- Tier Structure Matrix --
  const tierMatrix: Record<SubscriptionTier, { name: string; priceAnnual: number; priceMonthly: number; description: string; features: TierFeature[] }> = {
    standard: {
      name: "Standard Corporate",
      priceAnnual: 49,
      priceMonthly: 59,
      description: "Essential structural features for single workspace operational management.",
      features: [
        { text: "Core Workspace Directory Access", included: true },
        { text: "2 Active Client Data Platform Channels", included: true },
        { text: "Standard Import Matrix Integration", included: true },
        { text: "Advanced Component Access Controls", included: false },
        { text: "24/7 Priority Architecture Support", included: false },
      ]
    },
    premium: {
      name: "Premium Corporate",
      priceAnnual: 99,
      priceMonthly: 119,
      description: "Complete administration capabilities with advanced automated workflows.",
      features: [
        { text: "Core Workspace Directory Access", included: true },
        { text: "All 4 Client Data Platform Channels", included: true },
        { text: "High-Throughput Import Matrix Sync", included: true },
        { text: "Advanced Component Access Controls", included: true },
        { text: "24/7 Priority Architecture Support", included: false },
      ]
    },
    elite: {
      name: "Elite Enterprise",
      priceAnnual: 199,
      priceMonthly: 239,
      description: "Maximum bandwidth architecture for multi-platform corporate dominance.",
      features: [
        { text: "Core Workspace Directory Access", included: true },
        { text: "All 4 Client Data Platform Channels + Custom APIs", included: true },
        { text: "Real-time Cascading Import Infrastructure", included: true },
        { text: "Advanced Component Access Controls", included: true },
        { text: "24/7 Dedicated Architecture Support", included: true },
      ]
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // -- Process Structural Tier Changes --
  const handleTierUpdate = async () => {
    if (selectedTier === currentTier) {
      toast.info("Selected tier matches current active structural configuration.");
      return;
    }

    setIsProcessing(true);
    const updateToast = toast.loading(`Initiating structural migration to ${tierMatrix[selectedTier].name}...`);

    try {
      // Future Integration Point: 
      // await fetch('/api/stripe/subscription/update', { method: 'POST', body: JSON.stringify({ tier: selectedTier, cycle: billingCycle }) });
      
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      setCurrentTier(selectedTier);
      toast.dismiss(updateToast);
      toast.success(`Account allocation safely migrated to ${tierMatrix[selectedTier].name}.`);
    } catch (err) {
      toast.dismiss(updateToast);
      console.error("Subscription modification error:", err);
      toast.error("Cloud architecture rejected commercial parameter change.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center gap-6">
      <Loader2 className="animate-spin text-[#A3B18A]" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.6em] text-[#A3B18A]">Parsing Commercial Parameters</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-4 md:p-8 lg:p-12 space-y-8 md:space-y-12 max-w-[1700px] mx-auto font-sans">
      
      {/* --- SUB-RESOURCE NAVIGATION HEADER --- */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-stone-200 pb-8 gap-4">
        <div className="space-y-3">
          <button 
            onClick={() => router.push("/settings")} 
            className="flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors text-[9px] font-black uppercase tracking-widest"
          >
            <ArrowLeft size={12} /> Return to Global Settings
          </button>
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-serif italic tracking-tight text-stone-900">
              Manage Subscription
            </h1>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-300">Commercial Operations & Tier Structuring</p>
          </div>
        </div>

        <div className="flex items-center bg-white p-1.5 rounded-xl border border-stone-100 shadow-sm">
          <button 
            onClick={() => setBillingCycle("annual")} 
            className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${billingCycle === "annual" ? "bg-stone-900 text-white shadow-sm" : "text-stone-400"}`}
          >
            Annual Remittance (-20%)
          </button>
          <button 
            onClick={() => setBillingCycle("monthly")} 
            className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${billingCycle === "monthly" ? "bg-stone-900 text-white shadow-sm" : "text-stone-400"}`}
          >
            Monthly Periodicity
          </button>
        </div>
      </header>

      {/* --- SUBSCRIPTION TIER SELECTION MATRIX --- */}
      <main className="space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {(Object.keys(tierMatrix) as SubscriptionTier[]).map((tierKey) => {
            const tier = tierMatrix[tierKey];
            const isCurrent = currentTier === tierKey;
            const isSelected = selectedTier === tierKey;
            const price = billingCycle === "annual" ? tier.priceAnnual : tier.priceMonthly;

            return (
              <div 
                key={tierKey}
                onClick={() => setSelectedTier(tierKey)}
                className={`bg-white border rounded-[3rem] p-8 space-y-8 flex flex-col justify-between cursor-pointer transition-all relative ${isSelected ? 'border-stone-900 shadow-xl ring-1 ring-stone-900' : 'border-stone-200 shadow-sm hover:border-stone-400'}`}
              >
                {isCurrent && (
                  <span className="absolute top-6 right-8 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                    Active Provision
                  </span>
                )}

                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-stone-400 block">Tier Framework</span>
                    <h3 className="text-2xl font-serif italic text-stone-900">{tier.name}</h3>
                    <p className="text-xs text-stone-400 leading-relaxed min-h-[40px]">{tier.description}</p>
                  </div>

                  <div className="pt-4 border-t border-stone-50 flex items-baseline gap-1">
                    <span className="text-4xl font-serif italic text-stone-900">£{price}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-stone-300">
                      / {billingCycle === "annual" ? "mo billed annually" : "month"}
                    </span>
                  </div>

                  {/* Feature Checklist Mapping */}
                  <ul className="space-y-3.5 pt-4">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-xs">
                        <div className={`mt-0.5 shrink-0 rounded-full p-0.5 ${feature.included ? 'text-stone-900' : 'text-stone-200'}`}>
                          <Check size={12} strokeWidth={3} />
                        </div>
                        <span className={feature.included ? 'text-stone-700 font-medium' : 'text-stone-300 line-through'}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6">
                  <div className={`w-full py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border text-center transition-all ${isSelected ? 'bg-stone-900 text-white border-stone-900 shadow-md' : 'bg-transparent text-stone-400 border-stone-200'}`}>
                    {isCurrent ? "Active Selection" : isSelected ? "Confirm Parameter Setup" : "Select Infrastructure"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* --- COMMIT CHANGES & RECONCILIATION SUMMARY --- */}
        <section className="bg-white border border-stone-200 rounded-[3.5rem] p-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8 shadow-sm">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2.5 text-stone-800">
              <ShieldCheck size={18} className="text-[#A3B18A]" />
              <h4 className="text-xl font-serif italic tracking-tight">System Infrastructure Synchronization</h4>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Modifying commercial parameters dynamically triggers automated data pipeline re-allocation. 
              Any incremental cost balancing is processed instantly via the secure Stripe financial framework. 
              Account downgrades take physical execution at the expiration of the current verified billing cycle.
            </p>
          </div>

          <div className="flex sm:items-center gap-4 w-full xl:w-auto shrink-0 flex-col sm:flex-row">
            <div className="text-left sm:text-right px-2">
              <span className="text-[8px] font-black uppercase tracking-widest text-stone-300 block">Target Structural Setup</span>
              <span className="text-base font-bold text-stone-800 block mt-0.5">{tierMatrix[selectedTier].name}</span>
            </div>
            <button
              onClick={handleTierUpdate}
              disabled={isProcessing || selectedTier === currentTier}
              className="px-10 py-5 rounded-[2rem] bg-stone-900 hover:bg-stone-800 disabled:bg-stone-100 disabled:text-stone-300 text-white text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg disabled:shadow-none"
            >
              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              Execute Deployment Plan
            </button>
          </div>
        </section>
      </main>

      {/* --- ADMINISTRATIVE SECURITY RISK MATRIX --- */}
      <footer className="pt-6 border-t border-stone-200 flex flex-col md:flex-row justify-between items-center gap-4 text-stone-300 text-[9px] font-black uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <Clock size={12} />
          <span>Last structural configuration audit checked: Secure</span>
        </div>
        <div>
          <span>TOTS OS // Protected Account Sub-Resource Instance</span>
        </div>
      </footer>

    </div>
  );
}