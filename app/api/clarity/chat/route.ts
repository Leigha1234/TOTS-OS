import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { runClarityChat, type ClarityChatHistoryItem } from "@/lib/clarity/chat";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("CLARITY REQUEST BODY:", body);

    const query = body?.query ?? body?.message;
    const clientContext = body?.context ?? null;
    const conversationId = body?.conversationId ?? null;
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
          setAll(
            cookiesToSet: {
              name: string;
              value: string;
              options?: CookieOptions;
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
      memories,
    ] = await Promise.all([
      supabase.from("organisations").select("*").eq("id", organisationId).maybeSingle(),
      supabase.from("accounts").select("*").eq("organisation_id", organisationId).limit(100),
      supabase.from("campaigns").select("*").eq("organisation_id", organisationId).limit(100),
      supabase.from("activity").select("*").eq("organisation_id", organisationId).limit(100),
      supabase.from("projects").select("*").eq("organisation_id", organisationId).limit(100),
      supabase.from("tasks").select("*").eq("organisation_id", organisationId).limit(100),
      supabase.from("contacts").select("*").eq("organisation_id", organisationId).limit(100),
      supabase.from("calendar_events").select("*").eq("organisation_id", organisationId).limit(100),
      supabase.from("clarity_memory").select("*").eq("organisation_id", organisationId).eq("is_active", true).order("importance", { ascending: false }).limit(50),
    ]);

    const compactHistory = history.slice(-8);

    const memoryContext = (memories.data ?? [])
      .map((memory) => `${memory.memory_key}: ${memory.memory_value}`)
      .join("\n");

    // Streaming will be added after the conversation persistence layer is connected.
    // The frontend currently provides a smooth incremental rendering experience.
    const result = await runClarityChat({
      query,
      history: compactHistory,
      context: `You are Clarity, the AI operating system for TOTS-OS.

You have access to live business information. Answer as a business assistant, not a generic chatbot.

Prioritise:
- actionable insights
- overdue items
- risks
- opportunities
- sales performance
- project progress
- tasks requiring attention

Use markdown where helpful and keep responses concise.

Known Clarity memory:
${memoryContext || "No stored memories available."}

Additional client context:
${clientContext ? JSON.stringify(clientContext) : "No additional context supplied."}`,
      data: {
        organisation: organisation.data,
        accounts: accounts.data ?? [],
        campaigns: campaigns.data ?? [],
        activities: activities.data ?? [],
        projects: projects.data ?? [],
        tasks: tasks.data ?? [],
        contacts: contacts.data ?? [],
        calendar: events.data ?? [],
        memories: memories.data ?? [],
        clientContext,
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

    let activeConversationId = conversationId;

    if (!activeConversationId) {
      const { data: newConversation, error: conversationError } = await supabase
        .from("clarity_chats")
        .insert({
          organisation_id: organisationId,
          user_id: user.id,
          title: query.length > 40 ? `${query.slice(0, 40)}...` : query,
        })
        .select("id")
        .single();

      if (!conversationError && newConversation) {
        activeConversationId = newConversation.id;
      }
    }

    if (activeConversationId) {
      const { error: messageError } = await supabase
        .from("clarity_messages")
        .insert([
          {
            chat_id: activeConversationId,
            role: "user",
            content: query,
          },
          {
            chat_id: activeConversationId,
            role: "assistant",
            content: result.answer,
          },
        ]);

      if (messageError) {
        console.error("CLARITY MESSAGE SAVE ERROR:", messageError);
      }
    }

    await supabase
      .from("clarity_chats")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", activeConversationId);

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
        conversationId: activeConversationId,
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