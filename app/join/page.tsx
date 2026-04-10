"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";

export default function Join() {
  const params = useSearchParams();

  useEffect(() => {
    join();
  }, []);

  async function join() {
    const token = params.get("token");

    const { data: userData } = await supabase.auth.getUser();

    if (!token || !userData.user) return;

    const { data: invite } = await supabase
      .from("invites")
      .select("*")
      .eq("token", token)
      .single();

    if (!invite) return;

    await supabase.from("team_members").insert({
      user_id: userData.user.id,
      team_id: invite.team_id,
      role: "member",
    });

    window.location.href = "/dashboard";
  }

  return <p className="p-6">Joining team...</p>;
}