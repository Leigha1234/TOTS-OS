"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr"; 
import { 
  ArrowLeft, Check, Loader2, Plus, Minus
} from "lucide-react";
import { toast } from "sonner";

type SubscriptionTier = "standard" | "premium" | "elite";

interface TierFeature {
  text: string;
  included: boolean;
}

export default function ManageSubscription() {
 const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const [currentTier, setCurrentTier] = useState<SubscriptionTier | null>(null);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>("premium");
  const [teamMembersCount, setTeamMembersCount] = useState<number>(0);
  const [promoCode] = useState<string>("");
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  const TEAM_MEMBER_PRICE = 19.95; 
  const formatPounds = (value: number) =>
    (Math.round(value * 100) / 100).toFixed(2);

  const tierMatrix: Record<SubscriptionTier, { name: string; price: number; description: string; features: TierFeature[] }> = {
    standard: {
      name: "Standard", price: 29, description: "FOUNDATIONAL SYSTEM ACCESS",
      features: [{ text: "Core system node", included: true }, { text: "Task management", included: true }, { text: "Basic CRM", included: true }]
    },
    premium: {
      name: "Premium", price: 59, description: "SCALABLE GROWTH ARCHITECTURE",
      features: [{ text: "Everything in Standard +", included: true }, { text: "Advanced CRM matrix", included: true }, { text: "Deeper automation", included: true }]
    },
    elite: {
      name: "Elite", price: 149, description: "ENTERPRISE OS DEPLOYMENT",
      features: [{ text: "Everything in Premium +", included: true }, { text: "Full custom build", included: true }, { text: "Priority support", included: true }]
    }
  };

    // Inside ManageSubscription.tsx
useEffect(() => {
  async function loadSession() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("subscription_tier, team_seats_allocated")
        .eq("id", user.id)
        .single();

      if (profile) {
        // Correctly handle existing profile data
        const t = profile.subscription_tier?.toLowerCase() as SubscriptionTier;
        setCurrentTier(t);
        setSelectedTier(t || "standard");
        setTeamMembersCount(profile.team_seats_allocated || 0);
      } else {
        // New signup (no profile yet) - defaults
        setCurrentTier(null); 
        setSelectedTier("standard");
      }
    } catch (err) {
      console.error("Session load error:", err);
    } finally {
      setLoading(false);
    }
  }
  loadSession();
}, [router]);

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

  const isCurrentTier = selectedTier === currentTier;
  const isButtonDisabled = isProcessing || isCurrentTier;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#A3B18A]" size={40} /></div>
  );

  return (
    <div className="min-h-screen bg-stone-50 p-12 max-w-[1400px] mx-auto">
      <header className="flex justify-between items-center border-b pb-8 mb-12">
        <button onClick={() => router.push("/settings")} className="flex items-center gap-2 text-stone-400 text-[10px] uppercase font-black"><ArrowLeft size={12} /> Back</button>
        <button 
          onClick={handleTierUpdate} 
          disabled={isButtonDisabled}
          className={`px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
            isButtonDisabled ? "bg-stone-200 text-stone-500 cursor-not-allowed" : "bg-stone-900 text-white hover:bg-stone-700"
          }`}
        >
           {isCurrentTier ? "Current Plan" : (isProcessing ? "Processing..." : `Switch to ${tierMatrix[selectedTier].name}`)}
        </button>
      </header>

      <main className="grid grid-cols-3 gap-8">
        {(Object.keys(tierMatrix) as SubscriptionTier[]).map((key) => (
          <div 
            key={key} 
            onClick={() => setSelectedTier(key)} 
            className={`p-8 border rounded-[2rem] cursor-pointer relative transition-all ${
              selectedTier === key ? "border-[#A3B18A] ring-1 ring-[#A3B18A]" : "border-stone-200"
            } ${currentTier === key ? "bg-[#F8F9F5]" : ""}`}
          >
            {currentTier === key && (
              <span className="absolute top-4 right-4 bg-[#A3B18A] text-white text-[9px] px-3 py-1 rounded-full uppercase font-bold">Active</span>
            )}
            <h3 className="text-3xl font-serif italic mb-4">{tierMatrix[key].name}</h3>
            <p className="text-5xl font-serif mb-6">£{tierMatrix[key].price}</p>
            <ul className="space-y-4">
              {tierMatrix[key].features.map((f, i) => (
                <li key={i} className="text-xs text-stone-600 flex gap-2">
                  <Check size={14} className={currentTier === key ? "text-[#A3B18A]" : "text-stone-300"}/> {f.text}
                </li>
              ))}
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
         <p className="text-xs uppercase font-black text-stone-400">
           Team Seats ( £{formatPounds(teamMembersCount * TEAM_MEMBER_PRICE)}/mo )
         </p>
      </div>
    </div>
  );
}