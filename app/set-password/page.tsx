"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;

    if (hash) {
      const params = new URLSearchParams(hash.replace("#", ""));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (access_token && refresh_token) {
        supabase.auth.setSession({
          access_token,
          refresh_token,
        });
      }
    }
  }, []);

  const handleUpdatePassword = async () => {
    if (password.length < 6) {
      return alert("Password must be at least 6 characters.");
    }

    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      setLoading(false);
      return alert("Session expired. Please request a new reset link.");
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      alert("Password set successfully!");
      router.push("/login");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-stone-50 p-6">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-stone-100 w-full max-w-md text-center">
        <h1 className="text-3xl font-serif italic mb-2 tracking-tight">TOTS OS</h1>
        <p className="text-stone-400 text-[10px] uppercase tracking-[0.2em] mb-8">
          Secure Your Account
        </p>

        <div className="space-y-4 text-left">
          <div>
            <label className="text-[10px] font-black uppercase text-stone-400 ml-2 mb-1 block">
              New Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl outline-none text-sm focus:border-stone-300 transition-colors"
            />
          </div>

          <button
            onClick={handleUpdatePassword}
            disabled={loading}
            style={{
              width: "100%",
              padding: "18px",
              backgroundColor: "#000",
              color: "#fff",
              borderRadius: "20px",
              fontWeight: "900",
              textTransform: "uppercase",
              fontSize: "10px",
              letterSpacing: "0.1em",
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: "10px"
            }}
          >
            {loading ? "Saving..." : "Complete Setup"}
          </button>
        </div>
      </div>
    </div>
  );
}