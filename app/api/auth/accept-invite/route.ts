

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { inviteId, token, email, password, fullName } = await req.json();

    if (!inviteId || !token || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data: invite, error: inviteError } = await supabaseAdmin
      .from("invites")
      .select("*")
      .eq("id", inviteId)
      .eq("token", token)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: "Invalid or expired invite" },
        { status: 400 }
      );
    }

    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser.users.some(
      (user) => user.email?.toLowerCase() === email.toLowerCase()
    );

    if (userExists) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName ?? null,
          organisation_id: invite.organisation_id,
          role: invite.role,
        },
      });

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: userError?.message || "Failed to create user" },
        { status: 400 }
      );
    }

    const { error: memberError } = await supabaseAdmin
      .from("organisation_members")
      .insert({
        organisation_id: invite.organisation_id,
        user_id: userData.user.id,
        role: invite.role || "user",
      });

    if (memberError) {
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
      return NextResponse.json(
        { error: memberError.message },
        { status: 400 }
      );
    }

    const { error: inviteUpdateError } = await supabaseAdmin
      .from("invites")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", inviteId);

    if (inviteUpdateError) {
      console.error("Invite update failed:", inviteUpdateError);
    }

    return NextResponse.json({
      success: true,
      userId: userData.user.id,
    });
  } catch (error: any) {
    console.error("Accept invite error:", error);

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}