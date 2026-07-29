import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(
            cookiesToSet: {
              name: string;
              value: string;
              options?: Parameters<typeof cookieStore.set>[2];
            }[]
          ) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorised" },
        { status: 401 }
      );
    }

    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    const [
      tasks,
      events,
      projects,
      contacts,
      notes,
      campaigns,
    ] = await Promise.all([
      supabase
        .from("tasks")
        .select("*")
        .eq("completed", false)
        .order("created_at", { ascending: false })
        .limit(10),

      supabase
        .from("calendar_events")
        .select("*")
        .gte("start_at", todayStart)
        .lte("start_at", todayEnd)
        .order("start_at", { ascending: true })
        .limit(10),

      supabase
        .from("projects")
        .select("*")
        .limit(10),

      supabase
        .from("contacts")
        .select("*")
        .limit(10),

      supabase
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const brief = {
      date: new Date().toISOString(),
      priorities: [
        `${tasks.data?.length || 0} outstanding tasks need attention`,
        `${events.data?.length || 0} events scheduled today`,
        `${projects.data?.length || 0} active projects being tracked`,
      ],
      tasks: tasks.data || [],
      meetings: events.data || [],
      projects: projects.data || [],
      customers: contacts.data || [],
      notes: notes.data || [],
      campaigns: campaigns.data || [],
      summary: "Your daily Clarity business overview is ready.",
    };

    return NextResponse.json({
      brief,
    });
  } catch (error) {
    console.error("Clarity brief error:", error);

    return NextResponse.json(
      { error: "Failed to generate Clarity brief" },
      { status: 500 }
    );
  }
}
