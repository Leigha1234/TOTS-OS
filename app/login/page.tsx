"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Mail, Fingerprint, Loader2, UserPlus, LogIn } from "lucide-react";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Initialize the Supabase Client safely inside the component
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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
        alert("Registration link sent! Please check your email to confirm your account.");
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
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f6] p-6">
      <form
        onSubmit={handleAction}
        className="bg-white p-12 rounded-[3.5rem] border border-stone-100 shadow-xl w-full max-w-md space-y-8"
      >
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-serif italic tracking-tighter">
            {isRegister ? "Onboarding" : "Sign In"}
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">
            {isRegister ? "Create your TOTS OS profile" : "Secure Node Access"}
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-stone-400 tracking-wider ml-1">
              Work Email
            </label>
            <div className="flex items-center gap-3 p-4 bg-stone-50/50 rounded-2xl border border-stone-100 focus-within:border-[#a9b897] transition-all">
              <Mail size={16} className="text-stone-400" />
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent text-xs outline-none w-full font-bold"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-stone-400 tracking-wider ml-1">
              Passcode Node
            </label>
            <div className="flex items-center gap-3 p-4 bg-stone-50/50 rounded-2xl border border-stone-100 focus-within:border-[#a9b897] transition-all">
              <Fingerprint size={16} className="text-stone-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent text-xs outline-none w-full font-bold"
                required
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest bg-stone-900 hover:bg-stone-800 transition-all flex items-center justify-center gap-3 shadow-lg"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={16} />
          ) : isRegister ? (
            <>
              <UserPlus size={16} /> Register Node
            </>
          ) : (
            <>
              <LogIn size={16} /> Sync Session
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setIsRegister(!isRegister)}
          className="w-full text-center text-[9px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-800 transition-colors"
        >
          {isRegister
            ? "Already have an account? Sign in"
            : "Need an account? Register"}
        </button>
      </form>
    </div>
  );
}