import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ⚠️ Use SERVICE ROLE KEY on server only
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      email,
      password,
      fullName,
      companyName,
      jobTitle,
      inviteId,
    } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // 1. Create auth user
    const { data: userData, error: userError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          job_title: jobTitle,
        },
      });

    if (userError || !userData?.user) {
      return NextResponse.json(
        { error: userError?.message || "Failed to create user" },
        { status: 400 }
      );
    }

    const userId = userData.user.id;

    // 2. Create organisation (ELITE tier default)
    const { data: org, error: orgError } = await supabase
      .from("organisations")
      .insert({
        name: companyName || "New Organisation",
        subscription_tier: "elite",
        created_by: userId,
      })
      .select()
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: orgError?.message || "Failed to create organisation" },
        { status: 400 }
      );
    }

    // 3. Link user → organisation (adjust table name if different)
    const { error: memberError } = await supabase.from("organisation_members").insert({
      user_id: userId,
      organisation_id: org.id,
      role: "owner",
    });

    if (memberError) {
      return NextResponse.json(
        { error: memberError.message || "Failed to link user to organisation" },
        { status: 400 }
      );
    }

    // 4. Optional activity log
    await supabase.from("activity").insert({
      organisation_id: org.id,
      user_id: userId,
      type: "signup",
      message: "User signed up and organisation created",
    });

    return NextResponse.json({
      success: true,
      userId,
      organisationId: org.id,
      subscription_tier: "elite",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}