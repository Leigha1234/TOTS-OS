"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInviteMode, setIsInviteMode] = useState(false);

  const handleSendSetupLink = async () => {
    if (!email) return alert("Please enter your email");
    setLoading(true);

    try {
      // We call your custom API Route instead of Supabase directly
      // This is the "bridge" that lets us use Resend
      const response = await fetch("/api/send-activation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send link");
      }

      alert("Check your email! An activation link has been sent via Resend.");
    } catch (error: any) {
      console.error("Link Error:", error.message);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-stone-50 p-6">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-stone-100 w-full max-w-md text-center">
        <h1 className="text-3xl font-serif italic mb-2 tracking-tight">TOTS OS</h1>
        <p className="text-stone-400 text-xs uppercase tracking-[0.2em] mb-8">
          {isInviteMode ? "Account Activation" : "Authorized Access"}
        </p>
        <div className="space-y-4 text-left">
          <label className="text-[10px] font-black uppercase text-stone-400 ml-2 mb-1 block">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl outline-none text-sm"
            placeholder="name@company.com"
          />
          <button
            onClick={handleSendSetupLink}
            disabled={loading}
            style={{
              width: "100%",
              padding: "18px",
              backgroundColor: "#000",
              color: "#fff",
              borderRadius: "20px",
              fontWeight: "900",
              textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Sending..." : "Send Activation Link"}
          </button>
        </div>
      </div>
    </div>
  );
}