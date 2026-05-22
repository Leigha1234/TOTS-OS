"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Clock, Check, 
  Loader2, Zap, AlertTriangle, Plus, Minus, Users, Tag
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";

/**
 * TOTS OS: SUBSCRIPTION & COMMERCIAL TIERS MANAGEMENT PORTAL v1.5
 * Architecture: Database-Coupled Remittance + Live Stripe Checkout Integration
 */

type SubscriptionTier = "standard" | "premium" | "elite";

interface TierFeature {
  text: string;
  included: boolean;
}

// Instantiate public token for client side configuration reads
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ManageSubscription() {
  const router = useRouter();
  
  // -- Commercial Account State --
  const [currentTier, setCurrentTier] = useState<SubscriptionTier | null>(null);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>("premium");
  const [teamMembersCount, setTeamMembersCount] = useState<number>(0);
  const [promoCode, setPromoCode] = useState<string>("");
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);

  const TEAM_MEMBER_PRICE = 10; 

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

  // Fetch verified workspace records from profiles on mount
  useEffect(() => {
    async function loadActiveWorkspaceSubscription() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("subscription_tier, team_seats_allocated")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (data?.subscription_tier) {
          const verifiedTier = data.subscription_tier.toLowerCase() as SubscriptionTier;
          setCurrentTier(verifiedTier);
          setSelectedTier(verifiedTier);
          setTeamMembersCount(data.team_seats_allocated || 0);
        } else {
          // Fallback context default if profile record is new
          setCurrentTier("standard");
          setSelectedTier("standard");
        }
      } catch (err) {
        console.error("Failed parsing system credentials profile mapping:", err);
        toast.error("Could not verify subscription credentials natively.");
      } finally {
        setLoading(false);
      }
    }

    loadActiveWorkspaceSubscription();
  }, [router]);

  // -- Process Live Stripe Checkout Operations --
  const handleTierUpdate = async () => {
    setIsProcessing(true);
    
    const basePrice = tierMatrix[selectedTier].price;
    const addonPrice = teamMembersCount * TEAM_MEMBER_PRICE;
    const totalCost = basePrice + addonPrice;
    
    const updateToast = toast.loading(
      `Deploying plan modification... Total monthly commitment: £${totalCost}/mo`
    );

    try {
      const response = await fetch("/api/pay/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          tier: selectedTier,
          additionalSeats: teamMembersCount,
          couponCode: promoCode.trim() || null 
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Failed to generate checkout portal URL instance.");
      }

      toast.dismiss(updateToast);
      toast.success("Redirecting safely to Stripe secure billing portal...");
      setIsProcessing(false);
      window.location.href = data.url;
    } catch (err: any) {
      toast.dismiss(updateToast);
      console.error("Subscription modification error:", err);
      toast.error(err.message || "Cloud architecture rejected parameter update.");
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    const cancelToast = toast.loading("Processing cancellation parameters with Stripe...");

    try {
      const response = await fetch("/api/pay/stripe/cancel", { method: "POST" });
      if (!response.ok) throw new Error("Server rejected cancellation stream parameters.");
      
      toast.dismiss(cancelToast);
      toast.success("Subscription termination scheduled successfully.");
      setCurrentTier(null);
      setShowCancelConfirmation(false);
    } catch (err: any) {
      toast.dismiss(cancelToast);
      console.error("Cancellation pipeline failure:", err);
      toast.error(err.message || "Failed to transmit cancellation parameters.");
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-[#faf9f6] to-[#f3f1ec] flex flex-col items-center justify-center gap-6">
      <Loader2 className="animate-spin text-[#A3B18A]" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.6em] text-[#A3B18A]">Parsing Commercial Parameters</p>
    </div>
  );

  const activeBasePrice = tierMatrix[selectedTier].price;
  const addonPrice = teamMembersCount * TEAM_MEMBER_PRICE;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#faf9f6] to-[#f3f1ec] text-stone-900 p-4 md:p-8 lg:p-12 space-y-8 md:space-y-12 max-w-[1700px] mx-auto font-sans">
      
      {/* --- HEADER --- */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-stone-200 pb-8 gap-6">
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

        {/* Global Action Trigger Button */}
        <button
          onClick={handleTierUpdate}
          disabled={isProcessing}
          className="w-full md:w-auto px-10 py-5 rounded-full bg-stone-900 hover:bg-stone-800 disabled:bg-stone-100 disabled:text-stone-300 text-white text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-md"
        >
          {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
          {selectedTier === currentTier ? "Update Configuration" : `Switch to ${tierMatrix[selectedTier].name}`} • £{activeBasePrice + addonPrice}/mo
        </button>
      </header>

      {/* --- MATRIX --- */}
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
                className={`bg-white/90 backdrop-blur border rounded-[3rem] p-8 space-y-8 flex flex-col justify-between cursor-pointer transition-all duration-300 relative ${isSelected ? 'border-[#A3B18A] shadow-[0_12px_40px_rgba(0,0,0,0.08)] ring-1 ring-[#A3B18A] -translate-y-1' : 'border-stone-200 shadow-sm hover:border-stone-400 hover:-translate-y-1 hover:shadow-lg'}`}
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
                    {isCurrent && isSelected ? "Active Plan" : isSelected ? "Plan Selected" : "Choose Framework"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* --- ADDONS / PROMOS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          
          <div className="bg-white/90 backdrop-blur border border-stone-200 rounded-[2.5rem] p-8 shadow-[0_10px_35px_rgba(0,0,0,0.04)] flex flex-col justify-between space-y-6 text-center">
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

          <div className="bg-white/90 backdrop-blur border border-stone-200 rounded-[2.5rem] p-8 shadow-[0_10px_35px_rgba(0,0,0,0.04)] flex flex-col justify-between space-y-6 text-center">
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

        {/* --- CANCELLATION BLOCK --- */}
        <div className="flex flex-col items-center justify-center pt-4">
          {!showCancelConfirmation ? (
            <button 
              onClick={() => setShowCancelConfirmation(true)}
              className="text-[9px] font-black uppercase tracking-widest text-stone-300 hover:text-red-500 transition-colors border border-transparent hover:border-red-200/30 hover:bg-red-50/40 px-6 py-3 rounded-xl"
            >
              Cancel Corporate Subscription
            </button>
          ) : (
            <div className="w-full max-w-md bg-white/95 backdrop-blur border border-red-100 rounded-3xl p-6 space-y-4 shadow-[0_10px_35px_rgba(0,0,0,0.05)] text-center">
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