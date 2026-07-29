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

    const { data: profile } = await supabase
      .from("profiles")
      .select("organisation_id")
      .eq("id", user.id)
      .single();

    const organisationId = profile?.organisation_id;

    if (!organisationId) {
      return NextResponse.json(
        { error: "Organisation not found" },
        { status: 400 }
      );
    }

    const [projects, tasks, contacts, notes, events, campaigns] = await Promise.all([
      supabase.from("projects").select("*").eq("organisation_id", organisationId).limit(50),
      supabase.from("tasks").select("*").eq("organisation_id", organisationId).limit(50),
      supabase.from("contacts").select("*").eq("organisation_id", organisationId).limit(50),
      supabase.from("notes").select("*").eq("organisation_id", organisationId).limit(50),
      supabase.from("calendar_events").select("*").eq("organisation_id", organisationId).limit(50),
      supabase.from("campaigns").select("*").eq("organisation_id", organisationId).limit(50),
    ]);

    return NextResponse.json({
      context: {
        user: {
          id: user.id,
          email: user.email,
        },
        organisationId,
        projects: projects.data || [],
        tasks: tasks.data || [],
        contacts: contacts.data || [],
        notes: notes.data || [],
        calendar: events.data || [],
        campaigns: campaigns.data || [],
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Clarity context error:", error);

    return NextResponse.json(
      { error: "Failed to load Clarity context" },
      { status: 500 }
    );
  }
}