import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";

function createSupabaseClientWithToken() {
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

    const supabase = createSupabaseClientWithToken();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();
    const noteId = payload.note_id;

    if (!noteId) {
      return NextResponse.json({ error: "Missing note_id" }, { status: 400 });
    }

    const admin = supabaseAdmin as any;

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("organisation_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: "Unable to verify profile" }, { status: 500 });
    }

    const { data: note, error: noteError } = await admin
      .from("notes")
      .select("id, organisation_id")
      .eq("id", noteId)
      .maybeSingle();

    if (noteError) {
      return NextResponse.json({ error: "Unable to verify note" }, { status: 500 });
    }

    if (!profile || !note || note.organisation_id !== profile.organisation_id) {
      return NextResponse.json({ error: "Organisation mismatch" }, { status: 403 });
    }

    const { data, error } = await admin
      .from("note_attachments")
      .insert({
        note_id: noteId,
        file_name: payload.file_name ?? null,
        file_path: payload.file_path,
        file_type: payload.file_type ?? null,
        file_size: payload.file_size ?? null,
        user_id: payload.user_id ?? user.id,
      })
      .select("*")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message || "Failed to save attachment" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unexpected server error" }, { status: 500 });
  }
}
