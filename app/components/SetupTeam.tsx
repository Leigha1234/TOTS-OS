"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function SetupTeam() {
  useEffect(() => {
    let isMounted = true;

    async function init() {
      // 1. Use getSession instead of getUser to avoid the navigator lock race condition
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user || !isMounted) return;

      // 2. Check for existing membership
      const { data: memberships } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id)
        .limit(1);

      // If they already belong to a team, stop here
      if (memberships && memberships.length > 0) return;

      // 3. Create the team
      const { data: newTeam, error: teamError } = await supabase
        .from("teams")
        .insert({
          name: "My Team",
          owner_id: user.id,
        })
        .select()
        .single();

      if (teamError || !newTeam) {
        // Only log if it's a real error (not a race condition result)
        if (isMounted) console.error("TEAM ERROR:", teamError);
        return;
      }

      // 4. Add the user as the owner
      await supabase.from("team_members").insert({
        user_id: user.id,
        team_id: newTeam.id,
        role: "owner",
      });
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  return null;
}