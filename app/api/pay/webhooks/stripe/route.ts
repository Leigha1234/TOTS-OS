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

  try {
    event = stripe.webhooks.constructEvent(
      body, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const metadata = session.metadata;

    try {
      // SCENARIO 1: New User First-Time Registration & Subscription
      if (metadata.supabase_user_id && metadata.is_new_org === "true") {
        
        // 1. Create the Organisation record
        const { data: org, error: orgError } = await supabase
          .from("organisations")
          .insert({ name: metadata.company_name })
          .select()
          .single();
          
        if (orgError) throw orgError;

        // 2. Link user to the new org and activate subscription
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ 
            organisation_id: org.id,
            subscription_tier: metadata.tier,
            is_subscribed: true 
          })
          .eq("id", metadata.supabase_user_id);
          
        if (profileError) throw profileError;

        // 3. Update JWT Metadata so middleware sees changes instantly
        await supabase.auth.admin.updateUserById(metadata.supabase_user_id, {
          user_metadata: { subscription_tier: metadata.tier, organisation_id: org.id }
        });
      }

      // SCENARIO 2: Existing User Subscription Upgrade
      else if (metadata.supabase_user_id) {
        await supabase
          .from("profiles")
          .update({ subscription_tier: metadata.tier, is_subscribed: true })
          .eq("id", metadata.supabase_user_id);
      }
    } catch (err: any) {
      console.error("Webhook Provisioning Failed:", err.message);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}