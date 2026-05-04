"use client";

import { useState } from "react";
import { 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  Crown, 
  Plus, 
  ArrowRight,
  UserPlus
} from "lucide-react";

const TIERS = [
  {
    name: "Standard",
    price: "29",
    color: "#a9b897",
    goal: "Get out of chaos + into structure",
    description: "For early-stage / simple businesses",
    stripeLink: "https://buy.stripe.com/test_standard_link", // Replace with your actual Stripe link
    features: [
      "Core system (basic workspace)",
      "Task / workflow management",
      "Basic CRM (customers + notes)",
      "Simple financial tracking",
      "Limited automations",
      "Single user / small team use",
    ],
  },
  {
    name: "Professional",
    price: "59",
    color: "#7e9cb9", // Muted Professional Blue
    goal: "Run the business properly day-to-day",
    description: "For growing businesses needing control",
    stripeLink: "https://buy.stripe.com/test_pro_link", 
    featured: true,
    features: [
      "Everything in Standard +",
      "Advanced CRM (pipelines, statuses)",
      "Deeper workflow automation",
      "Team collaboration features",
      "Advanced integrations (email, etc.)",
      "Enhanced financial visibility",
      "Multi-user setup",
    ],
  },
  {
    name: "Elite",
    price: "149",
    color: "#b97e7e", // Muted Elite Red
    goal: "Business runs as a system, not people-dependent",
    description: "Full system + power users",
    stripeLink: "https://buy.stripe.com/test_elite_link",
    features: [
      "Everything in Professional +",
      "Full business OS build",
      "Advanced 'Hands-off' automations",
      "Custom business workflows",
      "Notifications + activity tracking",
      "Client portal features",
      "Priority system support",
    ],
  },
];

export default function BillingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscription = (link: string, name: string) => {
    setLoading(name);
    window.location.href = link;
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-16">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Header */}
        <div className="border-b border-stone-900 pb-12">
          <p className="text-[#a9b897] text-[10px] font-black uppercase tracking-[0.5em] mb-4">Financial Intelligence</p>
          <h1 className="text-7xl font-serif italic tracking-tighter">System Access</h1>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {TIERS.map((tier) => (
            <div 
              key={tier.name}
              className={`relative flex flex-col p-8 rounded-[3rem] border transition-all duration-500 ${
                tier.featured 
                  ? "bg-stone-900/30 border-stone-700 shadow-[0_0_50px_rgba(169,184,151,0.05)]" 
                  : "bg-black border-stone-900 hover:border-stone-800"
              }`}
            >
              {tier.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#a9b897] text-black text-[9px] font-black uppercase tracking-widest py-2 px-6 rounded-full">
                  Recommended Configuration
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-3xl font-serif italic mb-1">{tier.name}</h3>
                <p className="text-stone-500 text-[10px] uppercase font-black tracking-widest">{tier.description}</p>
              </div>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-mono tracking-tighter">£{tier.price}</span>
                <span className="text-stone-600 text-xs uppercase font-bold">/ month</span>
              </div>

              <div className="space-y-4 mb-10 flex-1">
                {tier.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3 group">
                    <CheckCircle2 size={14} className="mt-0.5" style={{ color: tier.color }} />
                    <span className="text-xs text-stone-400 group-hover:text-stone-200 transition-colors leading-relaxed">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-8 border-t border-stone-900 mt-auto">
                <div className="mb-6">
                  <p className="text-[9px] uppercase font-black text-stone-600 tracking-widest mb-1">Operational Goal</p>
                  <p className="text-xs font-serif italic text-stone-300">"{tier.goal}"</p>
                </div>
                
                <button 
                  onClick={() => handleSubscription(tier.stripeLink, tier.name)}
                  className="w-full group flex items-center justify-between p-6 rounded-2xl border transition-all duration-300"
                  style={{ 
                    borderColor: tier.featured ? tier.color : '#292524',
                    backgroundColor: loading === tier.name ? 'white' : 'transparent'
                  }}
                >
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${loading === tier.name ? 'text-black' : 'text-white'}`}>
                    {loading === tier.name ? "Syncing..." : `Deploy ${tier.name}`}
                  </span>
                  <ArrowRight size={18} className={loading === tier.name ? 'text-black' : ''} style={{ color: loading === tier.name ? '' : tier.color }} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add-on Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-stone-900/20 border border-stone-900 rounded-[3rem] p-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <UserPlus className="text-[#a9b897]" size={24} />
              <h2 className="text-3xl font-serif italic">Expand Intelligence</h2>
            </div>
            <p className="text-stone-500 text-sm max-w-md">
              Need to integrate additional operators into your workspace? Scalable node access allows for unified team collaboration.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-8">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-600 mb-1">Additional Node</p>
              <p className="text-4xl font-mono">£19.95<span className="text-sm text-stone-700">/mo</span></p>
            </div>
            
            <Link 
              href="https://buy.stripe.com/test_addon_link"
              className="bg-white text-black px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-[#a9b897] transition-all active:scale-95"
            >
              Add Operator
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}