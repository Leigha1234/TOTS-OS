import { supabase } from "./supabase";

export async function getUserTeam() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const { data, error } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .maybeSingle(); // Use maybeSingle to avoid 406 errors if empty

  if (error) {
    console.error("GET TEAM ERROR:", error);
    return null;
  }

  return data?.team_id || null;
}