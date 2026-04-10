import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// ✅ Stripe (server-side only)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16" as any, // Recommended to lock version
});

// ✅ Supabase (service role for server writes)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

// ✅ Handle GET requests to prevent "Method Not Allowed" errors
export async function GET() {
  return new Response("Webhook is active. Send a POST request.", { status: 200 });
}

export async function POST(req: Request) {
  const body = await req.text();
  
  // ✅ FIX: Await headers for Next.js 15 compatibility
  const headerList = await headers();
  const sig = headerList.get("stripe-signature");

  if (!sig) {
    console.error("❌ Missing stripe-signature");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error("❌ Webhook signature failed:", err.message);
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  // ✅ HANDLE PAYMENT SUCCESS
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const invoiceId = session.metadata?.invoiceId;

    if (!invoiceId) {
      console.error("❌ Missing invoiceId in metadata");
      // Still return 200 to Stripe to stop retries, but log the error
      return NextResponse.json({ received: true, warning: "Missing invoiceId" });
    }

    const { error } = await supabase
      .from("invoices")
      .update({ status: "paid" })
      .eq("id", invoiceId);

    if (error) {
      console.error("❌ Supabase update failed:", error);
      return NextResponse.json({ error: "Database update failed" }, { status: 500 });
    } else {
      console.log("✅ Invoice marked as PAID:", invoiceId);
    }
  }

  return NextResponse.json({ received: true });
}