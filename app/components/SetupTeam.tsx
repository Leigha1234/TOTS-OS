"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase";

/**
 * SetupTeam is a background component that ensures a user has 
 * a default team provisioned upon their first visit.
 */
export default function SetupTeam() {
  useEffect(() => {
    let isMounted = true;

    async function provisionTeam() {
      // 1. Get session (avoids navigator lock issues)
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user || !isMounted) return;

      try {
        // 2. Check for existing membership
        // Use .maybeSingle() to handle "0 rows" gracefully
        const { data: membership } = await supabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", user.id)
          .maybeSingle();

        // If they already belong to a team, exit immediately
        if (membership) return;

        // 3. Create the team
        // We include owner_id to associate the creator
        const { data: newTeam, error: teamError } = await supabase
          .from("teams")
          .insert({
            name: "My Team",
            owner_id: user.id,
          })
          .select()
          .single();

        if (teamError) throw teamError;

        if (newTeam && isMounted) {
          // 4. Link user to the team as the 'owner'
          const { error: memberError } = await supabase
            .from("team_members")
            .insert({
              user_id: user.id,
              team_id: newTeam.id,
              role: "owner",
            });

          if (memberError) throw memberError;
          
          console.log("Team provisioned successfully for:", user.email);
        }
      } catch (err: any) {
        // We use console.warn for background tasks so they don't 
        // look like "fatal" errors in the dev console.
        console.warn("SetupTeam background check:", err.message);
      }
    }

    provisionTeam();

    return () => {
      isMounted = false;
    };
  }, []);

  // This component handles logic only; it doesn't render anything.
  return null;
}