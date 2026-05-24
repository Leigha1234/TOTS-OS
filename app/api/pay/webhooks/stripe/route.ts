import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase admin client for secure DB updates
const supabase = createClient(
  process.env.SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;
  
  let event;

  // 1. Verify the event came from Stripe
  try {
    event = stripe.webhooks.constructEvent(
      body, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  // 2. Handle successful checkout sessions
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const metadata = session.metadata;

    try {
      // SCENARIO 1: Existing User Subscription Upgrade
      if (metadata.supabase_user_id) {
        const { error } = await supabase
          .from("profiles")
          .update({ subscription_tier: metadata.tier })
          .eq("id", metadata.supabase_user_id);
          
        if (error) throw error;
      }

      // SCENARIO 2: New Team Member Seat Payment
      if (metadata.inviteId) {
        const { error } = await supabase
          .from("invites")
          .update({ status: "paid" })
          .eq("id", metadata.inviteId);
          
        if (error) throw error;
        console.log(`Successfully unlocked invite: ${metadata.inviteId}`);
      }
    } catch (err: any) {
      console.error("Database update failed during webhook:", err.message);
      // Return 500 so Stripe retries the webhook
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}