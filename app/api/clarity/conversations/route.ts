import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
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
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Cookies cannot be modified during some server rendering contexts.
          }
        },
      },
    }
  );
}

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organisation_id")
      .eq("id", userData.user.id)
      .single();

    const organisationId = profile?.organisation_id;

    if (!organisationId) {
      return NextResponse.json(
        { error: "Organisation not found" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("clarity_conversations")
      .select(`
        id,
        title,
        created_at,
        updated_at,
        clarity_messages (
          id,
          role,
          content,
          created_at
        )
      `)
      .eq("organisation_id", organisationId)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      conversations: (data || []).map((conversation) => ({
        ...conversation,
        messages: conversation.clarity_messages || [],
      })),
    });
  } catch (error: any) {
    console.error("Clarity GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load conversations" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organisation_id")
      .eq("id", userData.user.id)
      .single();

    const organisationId = profile?.organisation_id;

    if (!organisationId) {
      return NextResponse.json(
        { error: "Organisation not found" },
        { status: 400 }
      );
    }

    const { conversationId, messages } = body;

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 }
      );
    }

    let id = conversationId;

    if (!id) {
      const { data: conversation, error } = await supabase
        .from("clarity_conversations")
        .insert({
          user_id: userData.user.id,
          organisation_id: organisationId,
          title:
            messages.find((message: any) => message.role === "user")?.content?.slice(0, 60) ||
            "New conversation",
        })
        .select("id")
        .single();

      if (error) throw error;

      id = conversation.id;
    }

    const { data: existingMessages } = await supabase
      .from("clarity_messages")
      .select("role, content")
      .eq("conversation_id", id);

    const newMessages = messages.filter((message: any) => {
      return !existingMessages?.some(
        (existing: any) =>
          existing.role === message.role &&
          existing.content === message.content
      );
    });

    const { error: insertError } = await supabase
      .from("clarity_messages")
      .insert(
        newMessages.map((message: any) => ({
          conversation_id: id,
          role: message.role,
          content: message.content,
        }))
      );

    if (insertError) throw insertError;

    await supabase
      .from("clarity_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", id);

    return NextResponse.json({ id });
  } catch (error: any) {
    console.error("Clarity POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save conversation" },
      { status: 500 }
    );
  }
}