"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInviteMode, setIsInviteMode] = useState(false);

  const handleSendSetupLink = async () => {
    if (!email) return alert("Please enter your email");
    setLoading(true);

    try {
      // 1. Sign up the user in Supabase
      // This creates the record so they can set a password later
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password: Math.random().toString(36).slice(-12),
        options: {
          emailRedirectTo: `${window.location.origin}/set-password`,
        },
      });

      if (signupError) throw signupError;

      // 2. Call our Resend trigger (we'll make this next)
      const res = await fetch("/api/send-resend", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error("Resend failed to dispatch");

      alert("Check your email! A link has been sent via Resend.");
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-stone-50 p-6">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-stone-100 w-full max-w-md text-center">
        <h1 className="text-3xl font-serif italic mb-2 tracking-tight">TOTS OS</h1>
        <p className="text-stone-400 text-xs uppercase tracking-[0.2em] mb-8">
          {isInviteMode ? "Account Activation" : "Authorized Access"}
        </p>
        <div className="space-y-4 text-left">
          <label className="text-[10px] font-black uppercase text-stone-400 ml-2 mb-1 block">Email Address</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl outline-none text-sm" 
            placeholder="name@company.com"
          />
          <button 
            onClick={handleSendSetupLink} 
            disabled={loading}
            style={{ width: '100%', padding: '18px', backgroundColor: '#000', color: '#fff', borderRadius: '20px', fontWeight: '900', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? "Sending..." : "Send Activation Link"}
          </button>
        </div>
      </div>
    </div>
  );
}