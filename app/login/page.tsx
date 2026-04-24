// app/login/page.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.auth.signInWithPassword({ email, password });
  };

  return (
    <div className="flex h-screen items-center justify-center bg-stone-50">
      <form onSubmit={handleLogin} className="p-8 bg-white shadow-xl rounded-2xl w-96">
        <h1 className="text-2xl font-black mb-6">LOGIN</h1>
        <input 
          className="w-full p-3 mb-4 border rounded"
          placeholder="Email" 
          onChange={(e) => setEmail(e.target.value)} 
        />
        <input 
          type="password"
          className="w-full p-3 mb-6 border rounded"
          placeholder="Password" 
          onChange={(e) => setPassword(e.target.value)} 
        />
        <button className="w-full p-3 bg-stone-900 text-white rounded">Sign In</button>
      </form>
    </div>
  );
}