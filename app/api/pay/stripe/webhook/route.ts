import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Initialize Stripe with strict API versioning
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as any,
});

// Initialize privileged admin client to update subscription states without RLS interference
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Ensure this is in your .env file
);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  let event: Stripe.Event;

  try {
    if (!sig || !endpointSecret) {
      return NextResponse.json({ error: "Missing signature or webhook parameter definitions." }, { status: 400 });
    }
    // Securely construct event to verify it actually came from Stripe
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook Signature Verification Failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle verified events smoothly
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const userId = session.metadata?.supabase_user_id;
    const tierAllocated = session.metadata?.tier_allocated;
    const extraSeats = parseInt(session.metadata?.additional_seats || "0", 10);

    if (userId && tierAllocated) {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({
          subscription_tier: tierAllocated,
          subscription_status: "active",
          team_seats_allocated: extraSeats,
        })
        .eq("id", userId);

      if (error) {
        console.error("Database status sync exception:", error);
        return NextResponse.json({ error: "Database update failure" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}