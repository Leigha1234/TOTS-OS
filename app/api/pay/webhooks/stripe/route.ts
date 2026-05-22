import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase admin client using the service role key for backend operations
const supabase = createClient(
  process.env.SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;

  try {
    // Verify the webhook event comes from Stripe
    event = stripe.webhooks.constructEvent(
      body, 
      signature, 
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    
    // Extract metadata defined in your checkout session
    const userId = session.metadata?.supabase_user_id;
    const tier = session.metadata?.tier;

    if (!userId || !tier) {
      console.error("Missing metadata in checkout session:", session.id);
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    // Update the profile tier in Supabase
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ 
        subscription_tier: tier.toLowerCase(),
        status: 'active' // Ensure this column matches your DB schema
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Supabase Update Error:", updateError);
      return NextResponse.json({ error: "Database update failed" }, { status: 500 });
    }
    
    console.log(`Successfully upgraded user ${userId} to ${tier}`);
  }

  // Return a 200 to acknowledge receipt of the event
  return NextResponse.json({ received: true });
}