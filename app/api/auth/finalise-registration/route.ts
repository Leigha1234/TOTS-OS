import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { completeRegistration } from "@/lib/auth/completeRegistration";

export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing Stripe session ID" },
        { status: 400 }
      );
    }

    const { data: registration, error } = await supabaseAdmin
      .from("pending_registrations")
      .select("*")
      .eq("stripe_session_id", sessionId)
      .single();

    if (error || !registration) {
      console.error("Registration lookup failed:", error);
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    if (registration.completed) {
      return NextResponse.json(
        {
          success: true,
          message: "Account already created. You can sign in.",
          userId: registration.user_id,
          organisationId: registration.organisation_id,
          email: registration.email,
          recoveryLink: null,
        },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const result = await completeRegistration(registration.id, {
      stripe_session_id: sessionId,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      customer_email: registration.email,
      payment_status: "paid",
    });

    if (!result?.userId) {
      throw new Error("User account was not created");
    }

    return NextResponse.json(
      {
        success: true,
        userId: result.userId,
        organisationId: result.organisationId,
        email: registration.email,
        recoveryLink: null,
        message: "Account created successfully. You can now sign in.",
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: any) {
    console.error("Finalise registration error:", error);

    return NextResponse.json(
      { error: error.message || "Failed to complete registration" },
      { status: 500 }
    );
  }
}