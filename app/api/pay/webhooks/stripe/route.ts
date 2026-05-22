import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase"; // Ensure this matches your service-role / admin client path

export async function POST(req: Request) {
  const body = await req.text();
  const supabase = await createClient(); // Use your admin/service client to bypass RLS write restrictions
  
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
      
      // Matched exactly to the metadata keys in your checkout file:
      const userId = session.metadata?.supabase_user_id;
      const tierPaid = session.metadata?.tier_allocated;
      const seatsAllocated = session.metadata?.additional_seats;

      if (userId && tierPaid) {
        // Core database write updating the tester's workspace clearance
        const { error } = await supabase
          .from("profiles")
          .update({ 
            subscription_tier: tierPaid,
            team_seats_allocated: parseInt(seatsAllocated || "0", 10),
            stripe_customer_id: session.customer as string
          })
          .eq("id", userId);
        
        if (error) {
          console.error("❌ Failed to update profile system credentials in Supabase:", error);
        } else {
          console.log(`✅ System Escalation Complete: ${userId} provisioned to ${tierPaid.toUpperCase()}`);
        }
      }
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