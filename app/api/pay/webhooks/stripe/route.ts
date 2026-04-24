import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const body = await req.text();
  const supabase = createClient();
  
  // 1. Await headers (Required in newer Next.js versions)
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

  // ✅ Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as any;
      const invoiceId = session.metadata?.invoiceId;

      if (invoiceId) {
        const { error } = await supabase
          .from("invoices")
          .update({ status: "paid" })
          .eq("id", invoiceId);
        
        if (error) console.error("Supabase Update Error:", error);
      }
      break;
    
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

// 2. Explicitly handle GET requests to prevent "Method Not Allowed" errors 
// or 404s when testing the URL in a browser.
export async function GET() {
  return new Response("Webhook endpoint is active. Use POST to send events.", { status: 200 });
}