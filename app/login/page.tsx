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
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (inviteId) setIsRegister(true);

    let mounted = true;

    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      if (data.session?.user) {
        setTimeout(() => {
          router.replace("/dashboard");
        }, 100);
      }
    };

    checkUser();

    return () => {
      mounted = false;
    };
  }, [inviteId, router]);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (isRegister) {
      const passwordRules = [
        password.length >= 8,
        /\d/.test(password),
        /[A-Z]/.test(password),
        /[a-z]/.test(password),
      ];

      if (!passwordRules.every(Boolean)) {
        setPasswordError("Password must be at least 8 characters and include uppercase, lowercase, and a number.");
        return;
      }

      if (password !== confirmPassword) {
        setPasswordError("Passwords do not match.");
        return;
      }

      setPasswordError(null);
    }
    
    setAuthLoading(true);

    try {
      if (isRegister) {
        const res = await fetch("/api/send-signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            fullName,
            companyName,
            jobTitle,
            inviteId,
          }),
        });

        const result = await res.json();

        if (!res.ok || result?.error) {
          throw new Error(result?.error || "Signup failed");
        }

        alert("Registration successful. Please check your email to verify your account and complete setup.");
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

  const handleForgotPassword = async () => {
    if (!email) {
      alert("Please enter your email first");
      return;
    }

    setResetLoading(true);

    try {
      const res = await fetch("/api/send-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });

      const result = await res.json();

      if (!res.ok || result?.error) {
        const fallback = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/set-password`,
        });

        if (fallback.error) {
          throw new Error(result?.error || fallback.error.message || "Failed to send reset email");
        }
      }

      setResetSent(true);
      alert("Password reset link sent to your email");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setResetLoading(false);
    }
  };

  if (isRedirecting) {
    return (
      <div className="flex flex-col items-center gap-4 text-[#a9b897]">
        <Loader2 className="animate-spin" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.4em]">Redirecting to Workspace...</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleAction}
      className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-2xl w-full max-w-lg space-y-8 animate-in fade-in zoom-in duration-500"
    >
      <div className="space-y-3 text-center">
        <h1 className="text-4xl font-serif tracking-tight text-stone-800">
          {isRegister ? "Create Your Account" : "Welcome Back"}
        </h1>
        <p className="text-sm text-stone-500 leading-relaxed">
          {isRegister
            ? "Set up your workspace and access TOTS-OS."
            : "Sign in to access your TOTS-OS workspace."}
        </p>
        <div className="flex items-center justify-center gap-2">
          <ShieldCheck size={12} className="text-[#a9b897]" />
          <p className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-black">
            {inviteId ? "Joining Team Workspace" : "Secure Business Login"}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {isRegister && (
          <>
            <div className="space-y-2">
              <label className="text-[8px] font-black uppercase text-stone-400 tracking-widest ml-1">Full Name</label>
              <input
                type="text"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-5 bg-stone-50/50 rounded-2xl border border-stone-100 focus:border-[#a9b897] outline-none text-xs font-bold transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[8px] font-black uppercase text-stone-400 tracking-widest ml-1">Company Name</label>
              <input
                type="text"
                placeholder="Your business or organisation"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full p-5 bg-stone-50/50 rounded-2xl border border-stone-100 focus:border-[#a9b897] outline-none text-xs font-bold transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[8px] font-black uppercase text-stone-400 tracking-widest ml-1">Job Title (Optional)</label>
              <input
                type="text"
                placeholder="Founder, Manager, Director..."
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full p-5 bg-stone-50/50 rounded-2xl border border-stone-100 focus:border-[#a9b897] outline-none text-xs font-bold transition-all"
              />
            </div>
          </>
        )}

        <div className="space-y-2">
          <label className="text-[8px] font-black uppercase text-stone-400 tracking-widest ml-1">Business Email</label>
          <div className="flex items-center gap-3 p-5 bg-stone-50/50 rounded-2xl border border-stone-100 focus-within:border-[#a9b897] transition-all">
            <Mail size={16} className="text-stone-300" />
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent text-xs outline-none w-full font-bold"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[8px] font-black uppercase text-stone-400 tracking-widest ml-1">Password</label>
          <div className="flex items-center gap-3 p-5 bg-stone-50/50 rounded-2xl border border-stone-100 focus-within:border-[#a9b897] transition-all">
            <Fingerprint size={16} className="text-stone-300" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-transparent text-xs outline-none w-full font-bold"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[9px] font-black uppercase tracking-widest text-stone-400"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {isRegister && (
            <div className="mt-2 space-y-1">
              <p className="text-[9px] uppercase tracking-widest text-stone-400">
                Password must contain:
              </p>
              <p className="text-[9px] text-stone-400">• 8+ characters</p>
              <p className="text-[9px] text-stone-400">• At least 1 uppercase letter</p>
              <p className="text-[9px] text-stone-400">• At least 1 lowercase letter</p>
              <p className="text-[9px] text-stone-400">• At least 1 number</p>
            </div>
          )}

          {passwordError && (
            <p className="text-[9px] uppercase tracking-widest text-red-500 mt-2">
              {passwordError}
            </p>
          )}
        </div>

        {isRegister && (
          <div className="space-y-2">
            <label className="text-[8px] font-black uppercase text-stone-400 tracking-widest ml-1">Confirm Password</label>
            <div className="flex items-center gap-3 p-5 bg-stone-50/50 rounded-2xl border border-stone-100 focus-within:border-[#a9b897] transition-all">
              <Fingerprint size={16} className="text-stone-300" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-transparent text-xs outline-none w-full font-bold"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-[9px] font-black uppercase tracking-widest text-stone-400"
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        )}

        {!isRegister && (
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={resetLoading}
            className="mt-2 text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-800 transition-colors flex items-center gap-2"
          >
            {resetLoading ? "Sending..." : "Forgot password?"}
          </button>
        )}

        {resetSent && (
          <p className="text-[9px] uppercase tracking-widest text-[#a9b897] mt-2">
            Reset link sent — check your email
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={authLoading}
        className="w-full py-6 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] bg-stone-900 hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.98]"
      >
        {authLoading ? (
          <Loader2 className="animate-spin" size={18} />
        ) : isRegister ? (
          <>Continue to Payment</>
        ) : (
          <>Sign In</>
        )}
      </button>

      <button
        type="button"
        onClick={() => setIsRegister(!isRegister)}
        className="w-full text-center text-[9px] font-black uppercase tracking-widest text-stone-300 hover:text-stone-800 transition-colors"
      >
        {isRegister ? "Already have an account? Sign In" : "Create a new account"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fcfaf7] p-6 bg-gradient-to-br from-[#fcfaf7] via-[#f8f5ef] to-[#f2eee7]">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-stone-200" size={48} />
          <p className="text-[9px] font-black uppercase tracking-widest text-stone-300">Loading Workspace...</p>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}