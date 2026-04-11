"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SetPasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdate = async () => {
    if (password.length < 6) return alert("Password too short");
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      alert("Account activated!");
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-stone-50">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-stone-100 w-full max-w-md">
        <h1 className="text-2xl font-serif italic mb-6 text-center">Create Your Password</h1>
        <input 
          type="password" 
          placeholder="New Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          className="w-full p-4 bg-stone-50 border rounded-2xl mb-4 outline-none" 
        />
        <button onClick={handleUpdate} disabled={loading} className="w-full p-4 bg-black text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest">
          {loading ? "Saving..." : "Complete Setup"}
        </button>
      </div>
    </div>
  );
}