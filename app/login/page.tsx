"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = await createClient();

    if (isRegister) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        console.error(error);
        alert(error.message);
      } else {
        alert("Check your email to confirm your account.");
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error(error);
        alert(error.message);
      } else if (data.session) {
        window.location.href = "/dashboard";
      }
    }

    setLoading(false);
  };

  return (
    <div className="flex h-screen items-center justify-center bg-stone-50">
      <form
        onSubmit={handleAction}
        className="p-8 bg-white border border-stone-200 rounded-3xl w-96 shadow-lg"
      >
        <h1 className="text-xl font-black mb-6 uppercase">
          {isRegister ? "Register" : "Sign In"}
        </h1>

        <input
          className="w-full p-3 mb-4 border rounded"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="w-full p-3 mb-6 border rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          disabled={loading}
          className="w-full p-3 bg-stone-900 text-white rounded font-bold disabled:opacity-50"
        >
          {loading
            ? "Loading..."
            : isRegister
            ? "Create Account"
            : "Sign In"}
        </button>

        <button
          type="button"
          onClick={() => setIsRegister(!isRegister)}
          className="w-full mt-4 text-[10px] uppercase text-stone-400"
        >
          {isRegister
            ? "Already have an account? Sign in"
            : "Need an account? Register"}
        </button>
      </form>
    </div>
  );
}