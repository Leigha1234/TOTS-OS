"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    if (!email) {
      alert("Please enter your email");
      return;
    }

    setLoading(true);

    // Determine the redirect URL based on where the user is currently browsing
    // This ensures it works on both localhost and tots-os.co.uk
    const redirectUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/dashboard` 
      : "https://tots-os.co.uk/dashboard";

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    setLoading(false);

    if (error) {
      console.error(error);
      alert("Error sending magic link: " + error.message);
    } else {
      alert("Check your email for the login link!");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div style={{ padding: 40, border: '1px solid #eee', borderRadius: 20, textAlign: 'center' }}>
        <h1 style={{ marginBottom: 20, fontWeight: 'bold', letterSpacing: '2px' }}>TOTS OS</h1>
        <p style={{ color: '#666', marginBottom: 20 }}>Enter your email for a magic link</p>

        <input
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ 
            padding: '12px', 
            marginRight: 10, 
            border: '1px solid #ccc', 
            borderRadius: '8px',
            width: '250px' 
          }}
        />

        <button
          onClick={signIn}
          disabled={loading}
          style={{
            padding: '12px 24px',
            background: loading ? "#666" : "black",
            color: "white",
            cursor: loading ? "not-allowed" : "pointer",
            borderRadius: '8px',
            border: 'none',
            fontWeight: 'bold'
          }}
        >
          {loading ? "Sending..." : "Login"}
        </button>
      </div>
    </div>
  );
}