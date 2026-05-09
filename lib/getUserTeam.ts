import { supabase } from "./supabase-client";

export async function getUserTeam() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("User not authenticated");
    return null;
  }

  // Strategy A: Check explicit team_members table
  const { data: membership, error: memberError } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membership?.team_id) return membership.team_id;

  // Strategy B: Fallback - check if they own a team (based on your screenshot)
  const { data: ownedTeam, error: ownerError } = await supabase
    .from("teams")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (ownedTeam?.id) return ownedTeam.id;

  console.error("No team association found for user:", user.id);
  return null;
}