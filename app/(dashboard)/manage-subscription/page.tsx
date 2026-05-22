"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase"; 
import { 
  ArrowLeft, Clock, Check, 
  Loader2, Zap, AlertTriangle, Plus, Minus, Users, Tag
} from "lucide-react";
import { toast } from "sonner";

/**
 * TOTS OS: SUBSCRIPTION & COMMERCIAL TIERS MANAGEMENT PORTAL v1.5
 * Architecture: Singleton Client + Stripe Checkout Integration
 */

type SubscriptionTier = "standard" | "premium" | "elite";

interface TierFeature {
  text: string;
  included: boolean;
}

export default function ManageSubscription() {
  // Use useMemo to ensure Supabase client is a stable instance
  const supabase = useMemo(() => getBrowserClient(), []);
  const router = useRouter();
  
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
      name: "Standard", price: 29, description: "FOUNDATIONAL SYSTEM ACCESS", goal: "Get out of chaos + into structure",
      features: [{ text: "Core system node", included: true }, { text: "Task management", included: true }, { text: "Basic CRM", included: true }, { text: "Financial tracking", included: true }, { text: "Standard automations", included: true }, { text: "Single operator base allocation", included: true }]
    },
    premium: {
      name: "Premium", price: 59, badge: "RECOMMENDED", description: "SCALABLE GROWTH ARCHITECTURE", goal: "Run the business properly day-to-day",
      features: [{ text: "Everything in Standard +", included: true }, { text: "Advanced CRM matrix configuration", included: true }, { text: "Deeper customized automation sequences", included: true }, { text: "Team structure dynamic routing modules", included: true }, { text: "Integrated distribution communication channels", included: true }, { text: "Multi-user expandable setup framework", included: true }]
    },
    elite: {
      name: "Elite", price: 149, description: "ENTERPRISE OS DEPLOYMENT", goal: "Business runs cleanly as a system",
      features: [{ text: "Everything in Premium +", included: true }, { text: "Full custom enterprise business system build", included: true }, { text: "Hands-off macro system-wide automations", included: true }, { text: "Custom workflows and pipeline architectures", included: true }, { text: "Priority protocol support network access", included: true }]
    }
  };

  useEffect(() => {
    async function loadSession() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }

        const { data, error } = await supabase
          .from("profiles")
          .select("subscription_tier, team_seats_allocated")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        if (data?.subscription_tier) {
          const t = data.subscription_tier.toLowerCase() as SubscriptionTier;
          setCurrentTier(t); setSelectedTier(t);
          setTeamMembersCount(data.team_seats_allocated || 0);
        }
      } catch (err) {
        console.error("Session load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, [router, supabase]);

  const handleTierUpdate = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/pay/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: selectedTier, additionalSeats: teamMembersCount, couponCode: promoCode.trim() || null }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error("Checkout failed");
      window.location.href = data.url;
    } catch (err) {
      toast.error("Checkout failed.");
      setIsProcessing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#A3B18A]" size={40} /></div>
  );

  return (
    <div className="min-h-screen bg-stone-50 p-12 max-w-[1400px] mx-auto">
      <header className="flex justify-between items-center border-b pb-8 mb-12">
        <button onClick={() => router.push("/settings")} className="flex items-center gap-2 text-stone-400 text-[10px] uppercase font-black"><ArrowLeft size={12} /> Back</button>
        <button onClick={handleTierUpdate} className="bg-stone-900 text-white px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-widest">
           {isProcessing ? "Processing..." : `Switch to ${tierMatrix[selectedTier].name}`}
        </button>
      </header>

      <main className="grid grid-cols-3 gap-8">
        {(Object.keys(tierMatrix) as SubscriptionTier[]).map((key) => (
          <div key={key} onClick={() => setSelectedTier(key)} className={`p-8 border rounded-[2rem] cursor-pointer ${selectedTier === key ? "border-[#A3B18A] ring-1 ring-[#A3B18A]" : "border-stone-200"}`}>
            <h3 className="text-3xl font-serif italic mb-4">{tierMatrix[key].name}</h3>
            <p className="text-5xl font-serif mb-6">£{tierMatrix[key].price}</p>
            <ul className="space-y-4">
              {tierMatrix[key].features.map((f, i) => <li key={i} className="text-xs text-stone-600 flex gap-2"><Check size={14} className="text-[#A3B18A]"/> {f.text}</li>)}
            </ul>
          </div>
        ))}
      </main>

      <div className="mt-12 flex items-center gap-8 bg-white p-8 rounded-[2rem] border">
         <div className="flex items-center gap-4 border p-4 rounded-2xl">
            <button onClick={() => setTeamMembersCount(Math.max(0, teamMembersCount - 1))}><Minus size={14}/></button>
            <span className="w-8 text-center font-bold">{teamMembersCount}</span>
            <button onClick={() => setTeamMembersCount(teamMembersCount + 1)}><Plus size={14}/></button>
         </div>
         <p className="text-xs uppercase font-black text-stone-400">Team Seats ( £{teamMembersCount * TEAM_MEMBER_PRICE}/mo )</p>
      </div>
    </div>
  );
}