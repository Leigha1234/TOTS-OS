import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function InternalMarketingLayout({ children }: { children: React.ReactNode }) {
  const allowed = (process.env.ORBI_AI_MARKETING_ALLOWED_EMAILS ?? "")
    .split(",").map(email => email.trim().toLowerCase()).filter(Boolean);
  if (!allowed.length) notFound();
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.email_confirmed_at || !allowed.includes((user.email ?? "").toLowerCase())) notFound();
  return children;
}
