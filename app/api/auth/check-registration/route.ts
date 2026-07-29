import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session_id" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const registrationId = session.metadata?.registration_id;

    if (!registrationId) {
      return NextResponse.json(
        { error: "Registration ID missing from Stripe session" },
        { status: 400 }
      );
    }

    const { data: registration, error } = await supabaseAdmin
      .from("pending_registrations")
      .select("completed")
      .eq("id", registrationId)
      .single();

    if (error) {
      console.error("Registration lookup error:", error);
      return NextResponse.json(
        { error: "Could not find registration" },
        { status: 500 }
      );
    }

    if (!registration?.completed) {
      return NextResponse.json(
        { completed: false },
        { status: 202 }
      );
    }

    return NextResponse.json({
      completed: true,
    });
  } catch (error) {
    console.error("Check registration error:", error);

    return NextResponse.json(
      { error: "Failed to check registration status" },
      { status: 500 }
    );
  }
}
