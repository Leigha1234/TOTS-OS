import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { getUserTeam } from "@/lib/getUserTeam";

export function useNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    let channel: any;

    const init = async () => {
      const teamId = await getUserTeam();
      if (!teamId) return;

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false });

      setNotifications(data || []);

      channel = supabase
        .channel("notifications")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `team_id=eq.${teamId}`,
          },
          (payload) => {
            setNotifications((prev) => [payload.new, ...prev]);
          }
        )
        .subscribe();
    };

    init();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return notifications;
}