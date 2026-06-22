import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";

function createSupabaseClientWithToken(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseClientWithToken(token);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();
    const orgId = payload.organisation_id;

    if (!orgId) {
      return NextResponse.json({ error: "Missing organisation_id" }, { status: 400 });
    }

    // Use the admin client for profile lookup to avoid RLS blocking the verification query
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("organisation_id")
      .eq("id", user.id)
      .maybeSingle() as {
        data: { organisation_id: string | null } | null;
        error: any;
      };

    if (profileError) {
      return NextResponse.json({ error: "Unable to verify profile" }, { status: 500 });
    }

    if (!profile || profile.organisation_id !== orgId) {
      return NextResponse.json({ error: "Organisation mismatch" }, { status: 403 });
    }

    const noteData: Record<string, any> = {
      content: payload.content,
      user_id: user.id,
      organisation_id: orgId,
      color: payload.color,
      category: payload.category,
      project: payload.project || null,
      due_date: payload.due_date || null,
      is_reminder: payload.is_reminder || false,
      status: payload.status,
      is_urgent: payload.is_urgent || false,
      visibility: payload.visibility || "private",
      type: payload.type,
    };

    if (payload.assigned_to) {
      noteData.assigned_to = payload.assigned_to;
    }

    const { data, error } = await supabaseAdmin
      .from("notes")
      .insert([noteData] as any)
      .select("*")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message || "Failed to create note" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unexpected server error" }, { status: 500 });
  }
}
