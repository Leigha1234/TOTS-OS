import { NextResponse } from "next/server";
// @ts-ignore
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as any, 
});

const PRICE_IDS: Record<string, string> = {
  standard: process.env.NEXT_PUBLIC_STRIPE_PRICE_STANDARD!,
  premium: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM!,
  elite: process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE!,
};

// If you have a separate unmetered Stripe Price ID for team seats, add it here.
// Otherwise, we pass the total seat configuration metrics through the metadata.
const TEAM_SEAT_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM_SEAT;

export async function POST(req: Request) {
  try {
    const { tier, additionalSeats } = await req.json();
    const priceId = PRICE_IDS[tier];

    if (!priceId) {
      return NextResponse.json({ error: "Invalid tier specified." }, { status: 400 });
    }

    // 1. Authenticate user session via Supabase
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized access profile." }, { status: 401 });
    }

    // 2. Locate or provision a Stripe Customer profile ID mapping
    let stripeCustomerId = user.user_metadata?.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      stripeCustomerId = customer.id;

      // Update metadata on user so we don't duplicate customer identities
      await supabase.auth.updateUser({
        data: { stripe_customer_id: stripeCustomerId }
      });
    }

    // 3. Build Production Dynamic Line Items Matrix
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price: priceId, quantity: 1 }
    ];

    // If using a separate Stripe Price product for seats add-on:
    if (TEAM_SEAT_PRICE_ID && additionalSeats && additionalSeats > 0) {
      lineItems.push({
        price: TEAM_SEAT_PRICE_ID,
        quantity: additionalSeats,
      });
    }

    // 4. Resolve Production Environment URL Origins safely
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";

    // 5. Fire up a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "subscription",
      success_url: `${baseUrl}/settings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/settings/manage-subscription`,
      metadata: {
        supabase_user_id: user.id,
        tier_allocated: tier,
        additional_seats: additionalSeats || 0,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}