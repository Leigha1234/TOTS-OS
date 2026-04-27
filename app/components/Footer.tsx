"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Copy, Check, X } from "lucide-react";

export default function Footer() {
  const [open, setOpen] = useState(true);
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // ✅ FIX: Small delay prevents "Lock stolen" errors by letting 
    // principal auth components (like AuthGuard) finish first.
    const timer = setTimeout(() => {
      load();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  async function load() {
    const supabase = await createClient();
    try {
      // ✅ FIX: getSession is less aggressive than getUser and avoids lock collisions
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) return;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Profile fetch error:", error.message);
        return;
      }

      if (profile?.referral_code) {
        setReferralCode(profile.referral_code);
      }
    } catch (err) {
      console.warn("Footer background sync paused.");
    }
  }

  function submit() {
    if (!email) return;
    // Here you would typically integrate with loops.so or convertkit
    console.log("Subscribed:", email);
    setEmail("");
    setOpen(false);
  }

  function copyCode() {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      {/* 📬 NEWSLETTER POPUP */}
      {open && (
        <div className="fixed bottom-6 right-6 w-80 p-5 bg-stone-900 border border-white/10 rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button 
            onClick={() => setOpen(false)}
            className="absolute top-3 right-3 text-stone-500 hover:text-white transition"
          >
            <X size={16} />
          </button>
          
          <p className="text-sm font-semibold mb-1 text-white">
            Join the newsletter
          </p>
          <p className="text-xs text-stone-400 mb-4 leading-relaxed">
            Exclusive insights on systems, growth, and digital clarity.
          </p>
          
          <div className="space-y-2">
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-white/10 p-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition"
            />
            <button 
              className="w-full bg-white text-black hover:bg-stone-200 py-2.5 rounded-xl text-sm transition font-bold" 
              onClick={submit}
            >
              Subscribe
            </button>
          </div>
        </div>
      )}

      {/* 🦶 FOOTER */}
      <footer className="mt-24 border-t border-stone-800/50 pt-12 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            
            <div className="space-y-2">
              <div className="font-bold text-white tracking-tight">
                The Organised Types
              </div>
              <div className="text-stone-500 text-xs">
                Built for calm, clarity & control • © {new Date().getFullYear()}
              </div>
            </div>

            {referralCode && (
              <div className="group flex items-center gap-3 text-sm bg-stone-900/40 border border-white/5 pl-4 pr-2 py-2 rounded-2xl backdrop-blur-sm">
                <span className="text-stone-500 text-xs font-medium uppercase tracking-widest">
                  Referral:
                </span>
                <span className="font-mono font-bold text-blue-400">
                  {referralCode}
                </span>
                <button
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    copied ? "bg-green-500/20 text-green-400" : "bg-white/5 hover:bg-white/10 text-white"
                  }`}
                  onClick={copyCode}
                >
                  {copied ? (
                    <><Check size={12} /> Copied</>
                  ) : (
                    <><Copy size={12} /> Copy</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </footer>
    </>
  );
}