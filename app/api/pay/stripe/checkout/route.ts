import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as any, 
});

const PRICE_IDS: Record<string, string | undefined> = {
  standard: process.env.STRIPE_PRICE_STANDARD || process.env.NEXT_PUBLIC_STRIPE_PRICE_STANDARD,
  premium: process.env.STRIPE_PRICE_PREMIUM || process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM,
  elite: process.env.STRIPE_PRICE_ELITE || process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE,
};

// Matched to your exact variable name preference
const TEAM_SEAT_PRICE_ID = process.env.STRIPE_PRICE_TEAM_MEMBER || process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM_MEMBER;

export async function POST(req: Request) {
  try {
    const { tier, additionalSeats, couponCode } = await req.json();
    const priceId = PRICE_IDS[tier];
    console.log("Stripe tier requested:", tier);
    console.log("Resolved Stripe price ID:", priceId);
    console.log("Team seat price ID:", TEAM_SEAT_PRICE_ID);

    if (!priceId) {
      console.error("Missing Stripe price mapping for tier:", tier);
      return NextResponse.json({ error: `Missing Stripe price mapping for ${tier}` }, { status: 400 });
    }

    const cookieStore = await cookies();
    
    // Modern stable Next.js 16 server-side client initialization
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Safe to ignore inside an API route handler context
            }
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized access profile." }, { status: 401 });
    }

    let stripeCustomerId = user.user_metadata?.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      stripeCustomerId = customer.id;

      await supabase.auth.updateUser({
        data: { stripe_customer_id: stripeCustomerId }
      });
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price: priceId, quantity: 1 }
    ];

    if (TEAM_SEAT_PRICE_ID && additionalSeats && additionalSeats > 0) {
      lineItems.push({
        price: TEAM_SEAT_PRICE_ID,
        quantity: additionalSeats,
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "subscription",
      success_url: `${baseUrl}/settings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/settings/manage-subscription`,
      allow_promotion_codes: true,
      metadata: {
        supabase_user_id: user.id,
        tier_allocated: tier,
        additional_seats: additionalSeats || 0,
      },
    };

    if (couponCode) {
      sessionParams.discounts = [{ coupon: couponCode }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}