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
    
    if (password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    setLoading(true);
    // This updates the user's password in the Supabase Auth table
    const { error: supabaseError } = await supabase.auth.updateUser({ password });

    if (supabaseError) {
      setError(supabaseError.message);
      setLoading(false);
    } else {
      alert("Account activated successfully!");
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-stone-50 p-6">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-stone-100 w-full max-w-md text-center">
        <h1 className="text-3xl font-serif italic mb-2 tracking-tight">Set Your Password</h1>
        <p className="text-stone-400 text-[10px] uppercase tracking-widest mb-8">Finalize your TOTS OS access</p>
        
        <div className="space-y-4">
          <div className="text-left">
            <label className="text-[10px] font-black uppercase text-stone-400 ml-2 mb-1 block">New Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-stone-300 transition-all text-sm text-black" 
            />
          </div>

          <div className="text-left">
            <label className="text-[10px] font-black uppercase text-stone-400 ml-2 mb-1 block">Confirm Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-stone-300 transition-all text-sm text-black" 
            />
          </div>

          {error && <p className="text-red-500 text-[10px] font-bold uppercase tracking-tighter">{error}</p>}

          <button 
            onClick={handleUpdatePassword} 
            disabled={loading} 
            style={{ width: '100%', padding: '18px', backgroundColor: '#000000', color: '#ffffff', borderRadius: '20px', fontWeight: '900', fontSize: '13px', textTransform: 'uppercase', border: 'none', cursor: 'pointer', marginTop: '10px' }}
          >
            {loading ? "Activating..." : "Complete Setup"}
          </button>
        </div>
      </div>
    </div>
  );
}