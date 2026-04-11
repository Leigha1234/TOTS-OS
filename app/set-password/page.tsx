"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleUpdatePassword = async () => {
    setError("");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");

    setLoading(true);
    const { error: supabaseError } = await supabase.auth.updateUser({ password });

    if (supabaseError) {
      setError(supabaseError.message);
      setLoading(false);
    } else {
      alert("Account activated! Redirecting to dashboard...");
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-stone-50 p-6">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-stone-100 w-full max-w-md text-center">
        <h1 className="text-3xl font-serif italic mb-2 tracking-tight">Create Password</h1>
        <p className="text-stone-400 text-[10px] uppercase tracking-widest mb-8">Set your TOTS OS credentials</p>
        
        <div className="space-y-4 text-left">
          <div>
            <label className="text-[10px] font-black uppercase text-stone-400 ml-2 mb-1 block">New Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl outline-none text-sm text-black" 
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-stone-400 ml-2 mb-1 block">Confirm Password</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl outline-none text-sm text-black" 
            />
          </div>
          {error && <p className="text-red-500 text-[10px] font-bold uppercase">{error}</p>}
          <button 
            onClick={handleUpdatePassword} 
            disabled={loading} 
            style={{ width: '100%', padding: '18px', backgroundColor: '#000', color: '#fff', borderRadius: '20px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer' }}
          >
            {loading ? "Saving..." : "Complete Setup"}
          </button>
        </div>
      </div>
    </div>
  );
}