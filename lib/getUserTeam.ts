import { createClient } from "./supabase";

export async function getUserTeam() {
  const supabase = await createClient();

  // ✅ Always safely extract user
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

  // ✅ Query team
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