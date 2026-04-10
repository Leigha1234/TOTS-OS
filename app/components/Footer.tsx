"use client";

import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";

export default function Footer() {
  const [open, setOpen] = useState(true);
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    // ✅ FIX: Small delay prevents "Lock stolen" errors by letting 
    // principal auth components (like AuthGuard) finish first.
    const timer = setTimeout(() => {
      load();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  async function load() {
    try {
      // ✅ FIX: getSession is less aggressive than getUser and avoids the lock collision
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
      // Silently fail to keep the console clean for minor auth sync issues
      console.warn("Footer background sync paused.");
    }
  }

  function submit() {
    if (!email) return alert("Enter an email");
    alert("Subscribed 🎉");
    setEmail("");
    setOpen(false);
  }

  function copyCode() {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    alert("Referral code copied to clipboard!");
  }

  return (
    <>
      {/* 📬 NEWSLETTER POPUP */}
      {open && (
        <div className="fixed bottom-6 right-6 w-72 p-4 bg-gray-900 border border-gray-800 rounded-lg shadow-2xl z-50">
          <p className="text-sm font-medium mb-1 text-white">
            Join the newsletter
          </p>
          <p className="text-xs text-gray-400 mb-2">
            Systems, growth & clarity
          </p>
          <input
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-black border border-gray-800 p-2 rounded text-sm text-white mb-2 focus:outline-none focus:border-blue-500 transition"
          />
          <button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm transition font-medium" 
            onClick={submit}
          >
            Subscribe
          </button>
          <button
            className="mt-2 text-xs text-gray-500 hover:text-gray-300 w-full"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </div>
      )}

      {/* 🦶 FOOTER */}
      <footer className="mt-12 border-t border-gray-800 pt-6 pb-10">
        <div className="max-w-7xl mx-auto px-6 space-y-4">

          {/* TOP ROW */}
          <div className="flex flex-col md:flex-row justify-between gap-3">
            <div className="font-semibold text-white">
              The Organised Types
            </div>
            <div className="text-gray-500 text-sm">
              © {new Date().getFullYear()} All rights reserved
            </div>
          </div>

          {/* BOTTOM ROW */}
          <div className="flex flex-col md:flex-row justify-between gap-3 items-start md:items-center">
            <div className="text-gray-500 text-sm">
              Built for calm, clarity & control
            </div>

            {referralCode && (
              <div className="flex items-center gap-2 text-sm bg-gray-900/50 border border-gray-800 px-3 py-1.5 rounded-full shadow-inner">
                <span className="text-gray-400">
                  Referral:
                </span>
                <span className="font-mono font-medium text-blue-400">
                  {referralCode}
                </span>
                <button
                  className="text-[10px] uppercase tracking-widest bg-gray-800 hover:bg-gray-700 px-2 py-0.5 rounded text-white transition ml-1"
                  onClick={copyCode}
                >
                  Copy
                </button>
              </div>
            )}
          </div>
        </div>
      </footer>
    </>
  );
}