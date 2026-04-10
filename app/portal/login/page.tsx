"use client";

import { useState } from "react";
import { createClient } from "@/lib/auth";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");

  async function login() {
    await supabase.auth.signInWithOtp({ email });
    alert("Check your email ✉️");
  }

  return (
    <div className="p-6 max-w-sm mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Client Login</h1>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 w-full"
      />

      <button
        onClick={login}
        className="bg-black text-white px-4 py-2 rounded"
      >
        Send magic link
      </button>
    </div>
  );
}