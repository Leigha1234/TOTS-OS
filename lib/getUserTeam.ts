import { supabase } from "./supabase-client"; 

/**
 * Helper to fetch the current user's team_id.
 * It checks the 'team_members' table for a record matching the logged-in user.
 */
export async function getUserTeam() {
  // 1. Get the authenticated user session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("AUTH ERROR:", authError.message);
    return null;
  }

  if (!user) {
    console.warn("No authenticated user found");
    return null;
  }

  // 2. Query the team_members table
  // Make sure your table in Supabase is actually named "team_members"
  const { data, error } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("GET TEAM ERROR:", error.message);
    return null;
  }

  return data?.team_id ?? null;
}