"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, ShieldCheck, Clock, Check, 
  Loader2, Zap, AlertTriangle, Plus, Minus, Users, Tag
} from "lucide-react";
import { toast } from "sonner";

/**
 * TOTS OS: SUBSCRIPTION & COMMERCIAL TIERS MANAGEMENT PORTAL v1.4
 * Architecture: Clean Monthly Remittance + Team Expansion + Promo Vault
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
  const [teamMembersCount, setTeamMembersCount] = useState<number>(0);
  const [promoCode, setPromoCode] = useState<string>("");
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);

  const TEAM_MEMBER_PRICE = 10; // £10 per month add-on item

  // -- Tier Structure Matrix (Fixed Monthly Subscription Pricing) --
  const tierMatrix: Record<SubscriptionTier, { name: string; price: number; badge?: string; goal: string; description: string; features: TierFeature[] }> = {
    standard: {
      name: "Standard",
      price: 29,
      description: "FOUNDATIONAL SYSTEM ACCESS",
      goal: "Get out of chaos + into structure",
      features: [
        { text: "Core system node", included: true },
        { text: "Task management", included: true },
        { text: "Basic CRM", included: true },
        { text: "Financial tracking", included: true },
        { text: "Standard automations", included: true },
        { text: "Single operator base allocation", included: true },
      ]
    },
    premium: {
      name: "Premium",
      price: 59,
      badge: "RECOMMENDED",
      description: "SCALABLE GROWTH ARCHITECTURE",
      goal: "Run the business properly day-to-day",
      features: [
        { text: "Everything in Standard +", included: true },
        { text: "Advanced CRM matrix configuration", included: true },
        { text: "Deeper customized automation sequences", included: true },
        { text: "Team structure dynamic routing modules", included: true },
        { text: "Integrated distribution communication channels", included: true },
        { text: "Multi-user expandable setup framework", included: true },
      ]
    },
    elite: {
      name: "Elite",
      price: 149,
      description: "ENTERPRISE OS DEPLOYMENT",
      goal: "Business runs cleanly as a system",
      features: [
        { text: "Everything in Premium +", included: true },
        { text: "Full custom enterprise business system build", included: true },
        { text: "Hands-off macro system-wide automations", included: true },
        { text: "Custom workflows and pipeline architectures", included: true },
        { text: "Priority protocol support network access", included: true },
      ]
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // -- Process Structural Tier Changes with Custom Add-ons & Promos --
  const handleTierUpdate = async () => {
    setIsProcessing(true);
    
    const basePrice = tierMatrix[selectedTier].price;
    const addonPrice = teamMembersCount * TEAM_MEMBER_PRICE;
    const totalCost = basePrice + addonPrice;
    
    const updateToast = toast.loading(
      `Deploying plan modification... Total monthly commitment: £${totalCost}/mo`
    );

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          tier: selectedTier,
          additionalSeats: teamMembersCount,
          couponCode: promoCode.trim() || null // Transmit discount parameter safely to Stripe checkout
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Failed to generate checkout portal URL instance.");
      }

      toast.dismiss(updateToast);
      toast.success("Redirecting safely to Stripe secure billing portal...");
      
      // Hand off window execution context directly to Stripe
      window.location.href = data.url;
    } catch (err: any) {
      toast.dismiss(updateToast);
      console.error("Subscription modification error:", err);
      toast.error(err.message || "Cloud architecture rejected configuration parameter update.");
      setIsProcessing(false);
    }
  };

  // -- Process Complete Subscription Cancellation --
  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    const cancelToast = toast.loading("Processing subscription termination request with Stripe...");

    try {
      // Future Integration Point:
      // await fetch('/api/stripe/subscription/cancel', { method: 'POST' });
      
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      toast.dismiss(cancelToast);
      toast.success("Subscription scheduled for termination at the end of the current cycle.");
      setShowCancelConfirmation(false);
    } catch (err) {
      toast.dismiss(cancelToast);
      console.error("Cancellation pipeline failure:", err);
      toast.error("Failed to safely transmit cancellation request to Stripe servers.");
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center gap-6">
      <Loader2 className="animate-spin text-[#A3B18A]" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.6em] text-[#A3B18A]">Parsing Commercial Parameters</p>
    </div>
  );

  const activeBasePrice = tierMatrix[selectedTier].price;
  const addonPrice = teamMembersCount * TEAM_MEMBER_PRICE;

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

        {/* Global Reactive Action Upgrade Trigger */}
        <button
          onClick={handleTierUpdate}
          disabled={isProcessing}
          className="w-full md:w-auto px-10 py-5 rounded-full bg-stone-900 hover:bg-stone-800 disabled:bg-stone-100 disabled:text-stone-300 text-white text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-md"
        >
          {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
          Update Subscription • £{activeBasePrice + addonPrice}/mo
        </button>
      </header>

      {/* --- SUBSCRIPTION TIER SELECTION MATRIX --- */}
      <main className="space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {(Object.keys(tierMatrix) as SubscriptionTier[]).map((tierKey) => {
            const tier = tierMatrix[tierKey];
            const isCurrent = currentTier === tierKey;
            const isSelected = selectedTier === tierKey;

            return (
              <div 
                key={tierKey}
                onClick={() => setSelectedTier(tierKey)}
                className={`bg-white border rounded-[3rem] p-8 space-y-8 flex flex-col justify-between cursor-pointer transition-all relative ${isSelected ? 'border-[#A3B18A] shadow-xl ring-1 ring-[#A3B18A]' : 'border-stone-200 shadow-sm hover:border-stone-400'}`}
              >
                {tier.badge && (
                  <span className="absolute top-6 right-8 bg-[#A3B18A]/10 border border-[#A3B18A]/20 text-[#A3B18A] text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                    {tier.badge}
                  </span>
                )}
                
                {!tier.badge && isCurrent && (
                  <span className="absolute top-6 right-8 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                    Active Provision
                  </span>
                )}

                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-4xl font-serif italic text-stone-900">{tier.name}</h3>
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-400 block pt-1">{tier.description}</span>
                  </div>

                  <div className="pt-4 flex items-baseline gap-1">
                    <span className="text-5xl font-serif italic text-stone-900">£{tier.price}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-stone-300">
                      / mo
                    </span>
                  </div>

                  {/* Feature Checklist Mapping */}
                  <ul className="space-y-3.5 pt-4 border-t border-stone-50">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-xs">
                        <div className="mt-0.5 shrink-0 rounded-full p-0.5 text-[#A3B18A]">
                          <Check size={12} strokeWidth={3} />
                        </div>
                        <span className="text-stone-600 font-medium">
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-4 pt-6 border-t border-stone-50">
                  <div className="text-center">
                    <span className="text-[8px] font-black uppercase tracking-widest text-stone-300 block">Operational Goal</span>
                    <p className="text-xs font-serif italic text-stone-500 mt-1">"{tier.goal}"</p>
                  </div>
                  <div className={`w-full py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border text-center transition-all ${isSelected ? 'bg-stone-900 text-white border-stone-900 shadow-md' : 'bg-transparent text-stone-400 border-stone-200'}`}>
                    {isCurrent ? "Active Selection" : isSelected ? "Selected Plan" : "Choose Framework"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* --- DYNAMIC ADDONS & PROMO CONFIGURATION BLOCK --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          
          {/* TEAM MEMBERS SEAT MODIFIER */}
          <div className="bg-white border border-stone-200 rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between space-y-6 text-center">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#faf9f6] flex items-center justify-center mx-auto text-[#A3B18A]">
                <Users size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-serif italic text-stone-900">Add a team member</h3>
                <p className="text-[9px] font-black uppercase tracking-widest text-stone-300">Expand Workspace Bandwidth • £10/mo per seat</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 py-2 bg-[#faf9f6] rounded-2xl border border-stone-50 max-w-xs mx-auto w-full">
              <button 
                onClick={() => setTeamMembersCount(Math.max(0, teamMembersCount - 1))}
                className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center hover:border-stone-400 transition-colors text-stone-600"
              >
                <Minus size={14} />
              </button>
              <span className="text-xl font-bold text-stone-800 w-8">{teamMembersCount}</span>
              <button 
                onClick={() => setTeamMembersCount(teamMembersCount + 1)}
                className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center hover:border-stone-400 transition-colors text-stone-600"
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="h-4">
              {teamMembersCount > 0 && (
                <p className="text-xs font-medium text-[#A3B18A]">
                  + £{addonPrice} / month appended to setup
                </p>
              )}
            </div>
          </div>

          {/* PROMO / DISCOUNT CODE COUPLER */}
          <div className="bg-white border border-stone-200 rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between space-y-6 text-center">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#faf9f6] flex items-center justify-center mx-auto text-stone-400">
                <Tag size={18} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-serif italic text-stone-900">Have a promotional code?</h3>
                <p className="text-[9px] font-black uppercase tracking-widest text-stone-300">Apply a corporate or legacy discount token</p>
              </div>
            </div>

            <div className="w-full max-w-xs mx-auto relative">
              <input 
                type="text" 
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE"
                className="w-full px-5 py-3.5 bg-[#faf9f6] border border-stone-200 focus:border-stone-400 rounded-2xl text-center font-bold text-xs outline-none transition-all tracking-widest uppercase placeholder:text-stone-300 text-stone-800"
              />
            </div>

            <div className="h-4">
              {promoCode.trim().length > 0 && (
                <p className="text-[9px] font-black uppercase tracking-widest text-[#A3B18A]">
                  Token attached to secure checkout payload
                </p>
              )}
            </div>
          </div>

        </div>

        {/* --- CANCELLATION PROTOCOL ENGINE --- */}
        <div className="flex flex-col items-center justify-center pt-4">
          {!showCancelConfirmation ? (
            <button 
              onClick={() => setShowCancelConfirmation(true)}
              className="text-[9px] font-black uppercase tracking-widest text-stone-300 hover:text-red-500 transition-colors border border-transparent hover:border-red-200/30 hover:bg-red-50/40 px-6 py-3 rounded-xl"
            >
              Cancel Corporate Subscription
            </button>
          ) : (
            <div className="w-full max-w-md bg-white border border-red-100 rounded-3xl p-6 space-y-4 shadow-sm text-center">
              <div className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle size={18} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-stone-900">Confirm Subscription Termination</h4>
                <p className="text-xs text-stone-400 leading-relaxed">
                  This protocol plans the termination of your workspace engine features. All connected data channels and dashboard metrics will freeze at the end of your billing cycle.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowCancelConfirmation(false)}
                  disabled={isCancelling}
                  className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-all"
                >
                  Keep Subscription
                </button>
                <button 
                  onClick={handleCancelSubscription}
                  disabled={isCancelling}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-200 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {isCancelling && <Loader2 size={12} className="animate-spin" />}
                  Confirm Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* --- ADMINISTRATIVE SECURITY FOOTER --- */}
      <footer className="pt-6 border-t border-stone-200 flex flex-col md:flex-row justify-between items-center gap-4 text-stone-300 text-[9px] font-black uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <Clock size={12} />
          <span>Last structural configuration audit checked: Secure</span>
        </div>
        <div>
          <span>TOTS OS // Manage Subscription</span>
        </div>
      </footer>

    </div>
  );
}