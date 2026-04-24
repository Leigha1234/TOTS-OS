"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-client";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message);
      else alert("Check your email for confirmation!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-stone-50">
      <form onSubmit={handleSubmit} className="p-10 bg-white shadow-2xl rounded-[2rem] w-96 border border-stone-100">
        <h1 className="text-xl font-black mb-8 tracking-widest uppercase">
          {isRegister ? "Create Account" : "Sign In"}
        </h1>
        
        <input 
          className="w-full p-4 mb-4 bg-stone-50 rounded-xl outline-none border border-stone-200"
          placeholder="Email" 
          onChange={(e) => setEmail(e.target.value)} 
        />
        <input 
          type="password"
          className="w-full p-4 mb-6 bg-stone-50 rounded-xl outline-none border border-stone-200"
          placeholder="Password" 
          onChange={(e) => setPassword(e.target.value)} 
        />
        
        <button className="w-full p-4 bg-stone-900 text-white rounded-xl font-bold mb-4">
          {isRegister ? "Register" : "Sign In"}
        </button>

        <button 
          type="button"
          onClick={() => setIsRegister(!isRegister)}
          className="w-full text-[10px] uppercase tracking-widest text-stone-400"
        >
          {isRegister ? "Already have an account? Sign In" : "Need an account? Register"}
        </button>
      </form>
    </div>
  );
}