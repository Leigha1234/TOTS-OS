

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Loader2 } from "lucide-react";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        setError("This password setup link has expired. Please request a new one.");
      }

      setChecking(false);
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Password updated successfully. Redirecting...");

    setTimeout(() => {
      router.push("/dashboard");
    }, 1500);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfaf7]">
        <Loader2 className="animate-spin text-stone-400" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fcfaf7] px-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-stone-200 p-8">
        <h1 className="text-2xl font-black text-stone-900 mb-2">
          Set your password
        </h1>

        <p className="text-sm text-stone-500 mb-8">
          Create your password to finish setting up your TOTS-OS account.
        </p>

        {error && (
          <div className="mb-5 rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-xl bg-green-50 border border-green-100 p-3 text-sm text-green-600">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:ring-2 focus:ring-[#a9b897]"
          />

          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:ring-2 focus:ring-[#a9b897]"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#a9b897] py-3 text-sm font-black uppercase tracking-widest text-white disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              "Save Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}