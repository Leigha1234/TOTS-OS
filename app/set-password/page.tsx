"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SetPasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdatePassword = async () => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      alert("Password set successfully!");
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-stone-50 p-6">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-stone-100 w-full max-w-md text-center">
        <h1 className="text-3xl font-serif italic mb-2 tracking-tight">Initialize Account</h1>
        <p className="text-stone-400 text-[10px] uppercase tracking-widest mb-8">Set your secure password</p>
        <input type="password" placeholder="New Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl mb-4 outline-none text-sm text-black" />
        <button onClick={handleUpdatePassword} disabled={loading} style={{ width: '100%', padding: '18px', backgroundColor: '#000000', color: '#ffffff', borderRadius: '20px', fontWeight: '900', fontSize: '13px', textTransform: 'uppercase', border: 'none', cursor: 'pointer' }}>
          {loading ? "Updating..." : "Complete Setup"}
        </button>
      </div>
    </div>
  );
}