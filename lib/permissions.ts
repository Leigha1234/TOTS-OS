import { createClient } from "./supabase";

export async function getUserTeam() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return null;
  return data?.team_id || null;
}

export async function getUserRole() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("team_members")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return null;
  // Default to member if record exists but role is null
  return data?.role?.toLowerCase() || "member";
}

export function canCreate(role: string | null) {
  if (!role) return false;
  const r = role.toLowerCase();
  // Allowing all standard roles to create
  return r === "admin" || r === "member" || r === "owner";
}

export function canDelete(role: string | null) {
  if (!role) return false;
  const r = role.toLowerCase();
  return r === "admin" || r === "owner";
}