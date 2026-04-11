"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInviteMode, setIsInviteMode] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) return alert("Please enter both email and password");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  const handleSendSetupLink = async () => {
    if (!email) return alert("Please enter your email");
    setLoading(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/set-password`,
    });

    setLoading(false);
    if (error) {
      alert(error.message);
    } else {
      alert("Success! Check your email for the activation link.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-stone-50 p-6">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-stone-100 w-full max-w-md text-center">
        <h1 className="text-3xl font-serif italic mb-2 tracking-tight">TOTS OS</h1>
        <p className="text-stone-400 text-xs uppercase tracking-[0.2em] mb-8">
          {isInviteMode ? "Account Activation" : "Authorized Access"}
        </p>

        <div className="space-y-4">
          <div className="text-left">
            <label className="text-[10px] font-black uppercase text-stone-400 ml-2 mb-1 block">Email Address</label>
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-stone-300 transition-all text-sm text-black"
            />
          </div>

          {!isInviteMode && (
            <div className="text-left">
              <label className="text-[10px] font-black uppercase text-stone-400 ml-2 mb-1 block">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-stone-300 transition-all text-sm text-black"
              />
            </div>
          )}

          <button
            onClick={isInviteMode ? handleSendSetupLink : handleLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '18px',
              backgroundColor: '#000000',
              color: '#ffffff',
              borderRadius: '20px',
              fontWeight: '900',
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '10px'
            }}
          >
            {loading ? "Processing..." : isInviteMode ? "Send Setup Link" : "Sign In"}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-stone-50">
          <button 
            onClick={() => setIsInviteMode(!isInviteMode)}
            className="text-stone-400 text-[10px] uppercase tracking-widest font-bold hover:text-black transition-colors bg-transparent border-none cursor-pointer"
          >
            {isInviteMode ? "Back to Login" : "First time? Set your password"}
          </button>
        </div>
      </div>
    </div>
  );
}