import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// CRITICAL: Initialize Service Role client to bypass RLS for webhook updates
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Ensure this is in your .env
);

export async function POST(req: Request) {
  const body = await req.text();
  const headerPayload = await headers();
  const sig = headerPayload.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  // ✅ Process verified webhooks from Stripe
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as any;
      
      const userId = session.metadata?.supabase_user_id;
      const tierPaid = session.metadata?.tier_allocated;
      const seatsAllocated = session.metadata?.additional_seats;

      if (userId && tierPaid) {
        // Use the admin client to write to the database
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({ 
            subscription_tier: tierPaid,
            team_seats_allocated: parseInt(seatsAllocated || "0", 10),
            stripe_customer_id: session.customer as string
          })
          .eq("id", userId);
        
        if (error) {
          console.error("❌ Failed to update profile system credentials:", error);
          return NextResponse.json({ error: "Database update failed" }, { status: 500 });
        }
        console.log(`✅ System Escalation Complete: ${userId} provisioned to ${tierPaid.toUpperCase()}`);
      }
      break;
    }

    case "customer.subscription.deleted": {
      // Logic for handling subscription cancellations
      const subscription = event.data.object as any;
      const customerId = subscription.customer as string;

      await supabaseAdmin
        .from("profiles")
        .update({ subscription_tier: "STANDARD" })
        .eq("stripe_customer_id", customerId);
      break;
    }
    
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

export async function GET() {
  return new Response("Webhook endpoint is active. Use POST to send events.", { status: 200 });
}