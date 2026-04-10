import { supabase } from "./supabase";

export async function getUserPlan() {
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) return "free";

  const { data } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", auth.user.id)
    .single();

  if (!data) return "free";

  const { data: team } = await supabase
    .from("teams")
    .select("plan")
    .eq("id", data.team_id)
    .single();

  return team?.plan || "free";
}