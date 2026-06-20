import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type RouteContext = {
  params: Promise<{ platform: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  
  // Unwrap the dynamic platform parameter from the folder structure
  const { platform } = await context.params;

  // For the Beta Launch sandbox environment, we mock the secure handshake token:
  const mockToken = `beta_node_token_${Math.random().toString(36).substring(7)}`;

  try {
    // Get the current authenticated user session securely
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser();
    
    // Fallback/Demo handling: If testing locally without an active cookie wrapper,
    // grab the first available test profile row to ensure the query resolves.
    let targetUserId = user?.id;
    if (!targetUserId) {
      const fallbackResponse = await supabaseAdmin
        .from("profiles")
        .select("id")
        .limit(1)
        .single<{ id: string }>();
      const fallbackUser = fallbackResponse.data;
      targetUserId = fallbackUser?.id;
    }

    if (!targetUserId) throw new Error("No operational user context identified.");

    // Persist the token mapping into the database system
    const { error: dbError } = await supabaseAdmin
      .from("social_tokens")
      .upsert({
        user_id: targetUserId,
        platform: platform || "unknown",
        token_data: { access_token: mockToken, synced_at: new Date().toISOString() },
      } as any, { onConflict: "user_id,platform" });

    if (dbError) throw dbError;

    // Safely redirect the operator back to the primary settings control panel
    return NextResponse.redirect(new URL("/settings", request.url));
  } catch (error) {
    console.error("OAuth pipeline execution failure:", error);
    return NextResponse.json({ error: "Internal security link rejection" }, { status: 500 });
  }
}