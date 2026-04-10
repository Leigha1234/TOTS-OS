

"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Page() {
  const [email, setEmail] = useState("");

  const signIn = async () => {
    if (!email) {
      alert("Enter email");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "http://localhost:3001/crm",
      },
    });

    if (error) {
      console.log(error);
      alert("Error sending email");
    } else {
      alert("Check your email");
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>TOTs OS</h1>

      <input
        type="email"
        placeholder="Enter email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ padding: 10, marginRight: 10 }}
      />

      <button
        onClick={signIn}
        style={{
          padding: 10,
          background: "black",
          color: "white",
          cursor: "pointer",
        }}
      >
        Login
      </button>
    </div>
  );
}