"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase"; 
import { CheckCircle2, ArrowRight, UserPlus } from "lucide-react";

const TIERS = [
  {
    name: "Standard",
    price: "29",
    color: "#a9b897",
    goal: "Get out of chaos + into structure",
    description: "For early-stage / simple businesses",
    stripeLink: "https://buy.stripe.com/test_standard_link",
    features: ["Core system", "Task management", "Basic CRM", "Financial tracking", "Limited automations", "Single user"],
  },
  {
    name: "Professional",
    price: "59",
    color: "#7e9cb9", 
    goal: "Run the business properly day-to-day",
    description: "For growing businesses",
    stripeLink: "https://buy.stripe.com/test_pro_link", 
    featured: true,
    features: ["Everything in Standard +", "Advanced CRM", "Deeper automation", "Team features", "Email integrations", "Multi-user setup"],
  },
  {
    name: "Elite",
    price: "149",
    color: "#b97e7e", 
    goal: "Business runs as a system",
    description: "Full system + power users",
    stripeLink: "https://buy.stripe.com/test_elite_link",
    features: ["Everything in Professional +", "Full business OS build", "Hands-off automations", "Custom workflows", "Priority support"],
  },
];

export default function BillingPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email ?? null);
    };
    getUser();
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-stone-900 p-8 md:p-16">
      <div className="max-w-7xl mx-auto space-y-12">
        
        <div className="flex justify-between items-end border-b border-stone-200 pb-8">
          <div>
            <p className="text-[#a9b897] text-[10px] font-black uppercase tracking-[0.5em] mb-2">Financial Intelligence</p>
            <h1 className="text-6xl font-serif italic tracking-tighter">System Access</h1>
          </div>
          {userEmail && <p className="text-stone-400 text-xs font-mono mb-2">{userEmail}</p>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {TIERS.map((tier) => (
            <div key={tier.name} className={`p-10 rounded-[2.5rem] border bg-white transition-all ${tier.featured ? 'border-[#a9b897] shadow-xl' : 'border-stone-200'}`}>
              <h3 className="text-2xl font-serif italic mb-1">{tier.name}</h3>
              <p className="text-stone-400 text-[9px] uppercase font-bold tracking-widest mb-6">{tier.description}</p>
              
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-serif italic">£{tier.price}</span>
                <span className="text-stone-400 text-[10px] uppercase font-bold">/mo</span>
              </div>

              <div className="space-y-4 mb-10">
                {tier.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 size="{14}" style="{{" color: tier.color }}/>
                    <span className="text-xs text-stone-600">{f}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => { setLoading(tier.name); window.location.href = tier.stripeLink; }}
                className="w-full flex items-center justify-between p-5 rounded-2xl border border-stone-200 hover:bg-stone-50 transition-all uppercase text-[10px] font-bold tracking-widest"
              >
                {loading === tier.name ? "Connecting..." : `Deploy ${tier.name}`}
                <ArrowRight size="{16}"/>
              </button>
            </div>
          ))}
        </div>

        <div className="bg-stone-100 rounded-[2.5rem] p-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
            <UserPlus className="text-[#a9b897]"/>
            <div>
              <h4 className="text-xl font-serif italic">Add Operator</h4>
              <p className="text-xs text-stone-500">Scalable node access for your team.</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <p className="text-2xl font-serif italic">£19.95<span className="text-[10px] uppercase font-bold text-stone-400">/mo</span></p>
            <Link href="https://buy.stripe.com/test_addon_link" className="bg-stone-900 text-white px-8 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest">Add Node</Link>
          </div>
        </div>

      </div>
    </div>
  );
}