import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { runClarityChat, type ClarityChatHistoryItem } from "@/lib/clarity/chat";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("CLARITY REQUEST BODY:", body);

    const query = body?.query ?? body?.message;
    const history: ClarityChatHistoryItem[] = Array.isArray(body?.history)
      ? body.history
      : [];

    if (!query || typeof query !== "string" || !query.trim()) {
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

    const compactHistory = history.slice(-8);

    // TODO: Replace runClarityChat with a streaming implementation using the Responses API.
    // The frontend popup is already prepared for incremental rendering.
    const result = await runClarityChat({
      query,
      history: compactHistory,
      context: `You are Clarity, the AI operating system for TOTS-OS. Be concise, use markdown where appropriate, answer using the organisation's live data, proactively highlight trends, overdue work, risks and opportunities, and end with suggested next actions when useful.`,
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

    console.log("CLARITY TOKENS COMPLETE");
    console.log("ANSWER LENGTH:", result.answer.length);

    return NextResponse.json({
      answer: result.answer,
      suggestions: [
        "Show my sales pipeline",
        "What needs my attention today?",
        "Summarise this week's activity",
        "Which projects are overdue?"
      ],
      generatedAt: new Date().toISOString(),
      conversationSummary: query.slice(0, 60),
      metadata: {
        model: "clarity",
        streamed: false,
      },
    });
  } catch (error) {
    console.error("CLARITY CHAT ERROR:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Something went wrong processing your request.",
        suggestions: [
          "Try asking about your projects",
          "Show today's activity",
          "View my sales performance"
        ]
      },
      { status: 500 }
    );
  }
}