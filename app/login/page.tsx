"use client";

import { useState, useEffect, Suspense } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Mail, Fingerprint, Loader2, ShieldCheck } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteId = searchParams.get("invite");
  
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (inviteId) setIsRegister(true);
    
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) router.push("/dashboard");
    };
    checkUser();
  }, [inviteId, router, supabase.auth]);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setAuthLoading(true);

    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: fullName || email.split('@')[0],
              // Logic for Multi-tenancy: if no invite, create new org
              is_new_org: !inviteId,
              org_name: fullName ? `${fullName}'s Workspace` : 'New Workspace',
              invite_team_id: inviteId, 
            },
          },
        });

        if (error) throw error;
        alert("Registration link sent! Confirm your email to initialize your node.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        if (data.session) {
          setIsRedirecting(true);
          window.location.href = "/dashboard";
        }
      }
    } catch (err: any) {
      alert("Auth Error: " + err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  if (isRedirecting) {
    return (
      <div className="flex flex-col items-center gap-4 text-[#a9b897]">
        <Loader2 className="animate-spin" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.4em]">Redirecting to Grid...</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleAction}
      className="bg-white p-12 rounded-[3.5rem] border border-stone-100 shadow-2xl w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500"
    >
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-serif italic tracking-tighter text-stone-800">
          {isRegister ? "Onboarding" : "Sign In"}
        </h1>
        <div className="flex items-center justify-center gap-2">
           <ShieldCheck size={12} className="text-[#a9b897]" />
           <p className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-black">
             {inviteId ? "Joining Authorized Team" : "Secure Node Protocol"}
           </p>
        </div>
      </div>

      <div className="space-y-4">
        {isRegister && (
          <div className="space-y-2">
            <label className="text-[8px] font-black uppercase text-stone-400 tracking-widest ml-1">Identity Name</label>
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-5 bg-stone-50/50 rounded-2xl border border-stone-100 focus:border-[#a9b897] outline-none text-xs font-bold transition-all"
              required
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[8px] font-black uppercase text-stone-400 tracking-widest ml-1">Email Address</label>
          <div className="flex items-center gap-3 p-5 bg-stone-50/50 rounded-2xl border border-stone-100 focus-within:border-[#a9b897] transition-all">
            <Mail size={16} className="text-stone-300" />
            <input
              type="email"
              placeholder="name@tots-os.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent text-xs outline-none w-full font-bold"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[8px] font-black uppercase text-stone-400 tracking-widest ml-1">Passcode</label>
          <div className="flex items-center gap-3 p-5 bg-stone-50/50 rounded-2xl border border-stone-100 focus-within:border-[#a9b897] transition-all">
            <Fingerprint size={16} className="text-stone-300" />
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
        disabled={authLoading}
        className="w-full py-6 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] bg-stone-900 hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.98]"
      >
        {authLoading ? (
          <Loader2 className="animate-spin" size={18} />
        ) : isRegister ? (
          <>Initialize Node</>
        ) : (
          <>Sync Session</>
        )}
      </button>

      <button
        type="button"
        onClick={() => setIsRegister(!isRegister)}
        className="w-full text-center text-[9px] font-black uppercase tracking-widest text-stone-300 hover:text-stone-800 transition-colors"
      >
        {isRegister ? "Switch to Secure Login" : "Initialize New Node"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fcfaf7] p-6">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-stone-200" size={48} />
          <p className="text-[9px] font-black uppercase tracking-widest text-stone-300">Loading Auth Module...</p>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}