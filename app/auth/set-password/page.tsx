"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SetPasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSavePassword = async () => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      alert("Password set! You can now login.");
      router.push("/login"); // Send them to the login page
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-stone-50">
      <div className="bg-white p-10 rounded-[2rem] shadow-xl border border-stone-100 w-full max-w-md">
        <h1 className="text-2xl font-serif italic mb-2">Set Your Password</h1>
        <p className="text-stone-500 text-sm mb-6">Create a secure password for your TOTS OS account.</p>
        
        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl mb-4 outline-none focus:border-black"
        />

        <button
          onClick={handleSavePassword}
          disabled={loading}
          className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-stone-800 transition-colors"
        >
          {loading ? "Saving..." : "Save Password & Continue"}
        </button>
      </div>
    </div>
  );
}