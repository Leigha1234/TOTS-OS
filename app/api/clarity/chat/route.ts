import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { runClarityChat, ClarityChatHistoryItem } from "../../../../lib/clarity";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query: string = body?.query;
    const projectName: string = body?.projectName || "General";
    const projectFocus: string = body?.projectFocus || "";
    const history: ClarityChatHistoryItem[] = Array.isArray(body?.history) ? body.history : [];

    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json({ error: "A query is required." }, { status: 400 });
    }

    // Session-scoped client — respects RLS, tied to the logged-in user.
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // Ignored when called from environments where cookies cannot be directly mutated.
            }
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: mem, error: memError } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (memError || !mem?.team_id) {
      return NextResponse.json({ error: "No team found for this account." }, { status: 404 });
    }

    const teamId = mem.team_id;

    const [invoicesRes, tasksRes, timesheetsRes, postsRes, emailsRes, membersRes] =
      await Promise.all([
        supabase.from("invoices").select("*").eq("team_id", teamId).limit(200),
        supabase.from("tasks").select("*").eq("team_id", teamId).limit(200),
        supabase.from("timesheets").select("*").eq("team_id", teamId).limit(200),
        supabase.from("posts").select("*").eq("team_id", teamId).limit(100),
        supabase.from("email_campaigns").select("*").eq("team_id", teamId).limit(100),
        supabase.from("team_members").select("*").eq("team_id", teamId),
      ]);

    for (const r of [invoicesRes, tasksRes, timesheetsRes, postsRes, emailsRes, membersRes]) {
      if (r.error) throw r.error;
    }

    const { answer } = await runClarityChat({
      query,
      history,
      context: `${projectName}${projectFocus ? ` — ${projectFocus}` : ""}`,
      data: {
        invoices: invoicesRes.data ?? [],
        tasks: tasksRes.data ?? [],
        timesheets: timesheetsRes.data ?? [],
        posts: postsRes.data ?? [],
        emails: emailsRes.data ?? [],
        members: membersRes.data ?? [],
      },
    });

    return NextResponse.json({ answer });
  } catch (err) {
    console.error("CLARITY_CHAT_FAILURE:", err);
    return NextResponse.json({ error: "Failed to process request." }, { status: 500 });
  }
}