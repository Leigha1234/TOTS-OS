

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { runClarityChat, type ClarityChatHistoryItem } from "@/lib/clarity/chat";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const query = body?.query;
    const history: ClarityChatHistoryItem[] = Array.isArray(body?.history)
      ? body.history
      : [];

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "A message is required." },
        { status: 400 }
      );
    }

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
        { error: "You must be signed in to use Clarity." },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organisation_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("PROFILE ERROR:", profileError);
      return NextResponse.json(
        { error: "Unable to load your organisation." },
        { status: 500 }
      );
    }

    if (!profile?.organisation_id) {
      return NextResponse.json(
        { error: "No organisation linked to this account." },
        { status: 404 }
      );
    }

    const organisationId = profile.organisation_id;

    const [
      organisation,
      accounts,
      campaigns,
      activities,
      projects,
      tasks,
      contacts,
      events,
    ] = await Promise.all([
      supabase.from("organisations").select("*").eq("id", organisationId).maybeSingle(),
      supabase.from("accounts").select("*").eq("organisation_id", organisationId).limit(100),
      supabase.from("campaigns").select("*").eq("organisation_id", organisationId).limit(100),
      supabase.from("activity").select("*").eq("organisation_id", organisationId).limit(100),
      supabase.from("projects").select("*").eq("organisation_id", organisationId).limit(100),
      supabase.from("tasks").select("*").eq("organisation_id", organisationId).limit(100),
      supabase.from("profiles").select("*").eq("organisation_id", organisationId).limit(100),
      supabase.from("events").select("*").eq("organisation_id", organisationId).limit(100),
    ]);

    const result = await runClarityChat({
      query,
      history,
      context: "TOTS-OS business assistant",
      data: {
        organisation: organisation.data,
        accounts: accounts.data ?? [],
        campaigns: campaigns.data ?? [],
        activities: activities.data ?? [],
        projects: projects.data ?? [],
        tasks: tasks.data ?? [],
        contacts: contacts.data ?? [],
        calendar: events.data ?? [],
      },
    });

    if (!result?.answer) {
      return NextResponse.json(
        { error: "Clarity did not return a response." },
        { status: 500 }
      );
    }

    return NextResponse.json({ answer: result.answer });
  } catch (error) {
    console.error("CLARITY CHAT ERROR:", error);

    return NextResponse.json(
      { error: "Something went wrong processing your request." },
      { status: 500 }
    );
  }
}