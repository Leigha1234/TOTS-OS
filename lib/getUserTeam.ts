// lib/getUserTeam.ts
import { getBrowserClient } from "./supabase"; // Point to the unified file

export async function getUserTeam() {
  const supabase = createServerSupabaseClient();
  if (!supabase) return { data: null, error: "Not initialized" };
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  return { user, authError };
}