import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { from, to, subject, body } = await req.json();

  // 1. find thread
  let { data: thread } = await supabase
    .from("email_threads")
    .select("*")
    .eq("profile_id", to.profile_id)
    .maybeSingle();

  // 2. create if missing
  if (!thread) {
    const res = await supabase.from("email_threads").insert([{
      profile_id: to.profile_id,
      organisation_id: to.organisation_id,
      subject
    }]).select().single();

    thread = res.data;
  }

  // 3. insert message
  await supabase.from("email_messages").insert([{
    thread_id: thread.id,
    profile_id: thread.profile_id,
    organisation_id: thread.organisation_id,
    direction: "inbound",
    from_email: from,
    to_email: to.email,
    subject,
    body
  }]);

  return NextResponse.json({ success: true });
}