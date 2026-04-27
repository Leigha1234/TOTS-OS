import { createClient } from "@/lib/supabase";

export async function getBranding(teamId: string) {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from("settings")
    .select("*")
    .eq("team_id", teamId)
    .maybeSingle();

  return {
    logo: data?.logo || "",
    primaryColor: data?.primary_color || "#a9b897",
    font: data?.font || "Poppins",
  };
}