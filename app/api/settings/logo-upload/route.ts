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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const rawFile = form.get("file");

    if (!(rawFile instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const file = rawFile;

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image uploads are allowed" }, { status: 400 });
    }

    const maxSizeBytes = 8 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json({ error: "File too large (max 8MB)" }, { status: 413 });
    }

    const ext = (file.name.split(".").pop() || "png").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    const safeExt = ext || "png";
    const filePath = `logos/${user.id}-${Date.now()}.${safeExt}`;

    const admin = supabaseAdmin as any;
    const { error: uploadError } = await admin.storage
      .from("branding-assets")
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      return NextResponse.json(
        {
          error: uploadError.message || "Storage upload failed",
          code: uploadError.code || null,
          details: uploadError.details || null,
          hint: uploadError.hint || null,
        },
        { status: 500 }
      );
    }

    const { data: publicData } = admin.storage.from("branding-assets").getPublicUrl(filePath);

    if (!publicData?.publicUrl) {
      return NextResponse.json({ error: "Failed to resolve logo URL" }, { status: 500 });
    }

    return NextResponse.json({ publicUrl: publicData.publicUrl, filePath });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
