import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe"; // Your stripe instance
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;
  
  const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const userId = session.metadata.supabase_user_id;

    // Update their tier in your database automatically
    await supabase
      .from("profiles")
      .update({ subscription_tier: session.metadata.tier })
      .eq("id", userId);
  }

  return NextResponse.json({ received: true });
}