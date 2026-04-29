"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentTier, setCurrentTier] = useState("STANDARD");

  useEffect(() => {
    async function loadData() {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // Fetch current tier from database
      if (user) {
        const { data } = await supabase.from("profiles").select("tier").eq("id", user.id).single();
        if (data) setCurrentTier(data.tier);
      }
    }
    loadData();
  }, []);

  const handleUpgrade = async (newTier: string) => {
    setLoading(true);
    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ tier: newTier })
      .eq("id", user.id);
      
    if (error) alert("Upgrade failed: " + error.message);
    else {
      setCurrentTier(newTier);
      alert(`Subscription updated to ${newTier}!`);
    }
    setLoading(false);
  };

  const tiers = ["STANDARD", "PREMIUM", "ELITE"];

  return (
    <div className="p-12 max-w-4xl mx-auto space-y-12">
      <h1 className="text-6xl font-serif italic">User Profile</h1>
      
      <div className="bg-white p-8 rounded-3xl border border-stone-200">
        <h2 className="text-lg font-bold uppercase tracking-widest mb-6">Subscription Tier</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map((tier) => (
            <button
              key={tier}
              onClick={() => handleUpgrade(tier)}
              disabled={loading || currentTier === tier}
              className={`p-6 rounded-2xl border-2 transition-all ${
                currentTier === tier 
                  ? "border-stone-900 bg-stone-900 text-white" 
                  : "border-stone-200 hover:border-stone-900"
              }`}
            >
              <div className="text-xs font-bold uppercase tracking-widest">{tier}</div>
              <div className="text-[10px] mt-2 opacity-70">
                {currentTier === tier ? "Active" : "Switch Plan"}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}