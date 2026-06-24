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
    const admin = supabaseAdmin as any;
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("organisation_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: "Unable to verify profile" }, { status: 500 });
    }

    if (!profile || profile.organisation_id !== orgId) {
      return NextResponse.json({ error: "Organisation mismatch" }, { status: 403 });
    }

    const noteData: any = {
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
      type: payload.type || (payload.status === "todo" ? "task" : "note"),
    };

    if (payload.assigned_to) {
      noteData.assigned_to = payload.assigned_to;
    }

    const { data, error } = await admin
      .from("notes")
      .insert([noteData])
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

export async function PUT(req: NextRequest) {
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

    if (!orgId || !payload.id) {
      return NextResponse.json(
        { error: "Missing organisation_id or note id" },
        { status: 400 }
      );
    }

    const admin = supabaseAdmin as any;
    // Verify user belongs to organisation (using admin to bypass RLS)
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("organisation_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: "Unable to verify profile" }, { status: 500 });
    }

    if (!profile || profile.organisation_id !== orgId) {
      return NextResponse.json({ error: "Organisation mismatch" }, { status: 403 });
    }

    const updateData: any = {
      status: payload.status,
    };

    if (typeof payload.completed !== "undefined") {
      updateData.completed = payload.completed;
    } else if (payload.status) {
      updateData.completed = payload.status === "done";
    }

    if (payload.content) updateData.content = payload.content;
    if (payload.color) updateData.color = payload.color;
    if (payload.category) updateData.category = payload.category;
    if (payload.project !== undefined) updateData.project = payload.project;
    if (payload.due_date !== undefined) updateData.due_date = payload.due_date;
    if (payload.is_reminder !== undefined) updateData.is_reminder = payload.is_reminder;
    if (payload.is_urgent !== undefined) updateData.is_urgent = payload.is_urgent;
    if (payload.visibility) updateData.visibility = payload.visibility;
    if (payload.assigned_to !== undefined) updateData.assigned_to = payload.assigned_to;

    const { data, error } = await admin
      .from("notes")
      .update(updateData)
      .eq("id", payload.id)
      .eq("organisation_id", orgId)
      .select("*")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to update note" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
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
    const { id, organisation_id: orgId } = payload;

    if (!id || !orgId) {
      return NextResponse.json(
        { error: "Missing id or organisation_id" },
        { status: 400 }
      );
    }

    const admin = supabaseAdmin as any;
    // Verify user belongs to organisation
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("organisation_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: "Unable to verify profile" }, { status: 500 });
    }

    if (!profile || profile.organisation_id !== orgId) {
      return NextResponse.json({ error: "Organisation mismatch" }, { status: 403 });
    }

    // Delete the note
    const { error } = await admin
      .from("notes")
      .delete()
      .eq("id", id)
      .eq("organisation_id", orgId);

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to delete note" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
