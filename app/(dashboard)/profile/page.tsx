"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentTier, setCurrentTier] = useState("STANDARD");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    async function loadData() {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        setEmail(user.email || "");
        const { data } = await supabase.from("profiles").select("tier").eq("id", user.id).single();
        if (data) setCurrentTier(data.tier.toUpperCase());
      }
    }
    loadData();
  }, []);

  const handleUpdateAuth = async () => {
    setLoading(true);
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      email: email,
      password: password,
    });
    if (error) alert("Update failed: " + error.message);
    else alert("Credentials updated successfully!");
    setLoading(false);
  };

  const handleUpgrade = async (newTier: string) => {
    setLoading(true);
    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ tier: newTier })
      .eq("id", user?.id);
      
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

      {/* Account Security Section */}
      <div className="bg-white p-8 rounded-3xl border border-stone-200 space-y-4">
        <h2 className="text-lg font-bold uppercase tracking-widest">Account Security</h2>
        <input 
          className="w-full p-4 border rounded-xl bg-stone-50" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="New Email"
        />
        <input 
          type="password"
          className="w-full p-4 border rounded-xl bg-stone-50" 
          placeholder="New Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button 
          onClick={handleUpdateAuth}
          disabled={loading}
          className="bg-stone-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-stone-700 transition-colors"
        >
          {loading ? "Saving..." : "Update Credentials"}
        </button>
      </div>
      
      {/* Subscription Tier Section */}
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