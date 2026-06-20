"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PasswordSection() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (!password || !confirmPassword) return;
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        console.error(error);
        toast.error(error.message);
        return;
      }

      toast.success("Password updated successfully");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-4 max-w-md">
      <h2 className="text-xl font-bold">Password</h2>
      <p className="text-sm text-gray-500">
        Update your account password securely.
      </p>

      <input
        type="password"
        placeholder="New password"
        minLength={6}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-3 border rounded-lg"
      />

      <input
        type="password"
        placeholder="Confirm password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="w-full p-3 border rounded-lg"
      />

      <button
        onClick={handleUpdatePassword}
        disabled={loading || !password || !confirmPassword}
        className="w-full px-4 py-3 bg-[#A3B18A] text-white rounded-lg disabled:opacity-50"
      >
        {loading ? "Updating..." : "Update Password"}
      </button>
    </section>
  );
}