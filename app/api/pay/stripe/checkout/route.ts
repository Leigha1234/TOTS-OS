import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as any, 
});

export async function POST(req: Request) {
  try {
    const { tier, additionalSeats } = await req.json();
    
    // Hardcode your IDs here to test
    const PRICE_IDS: Record<string, string> = {
      standard: "price_1TUBhO1TJBSxkUljcv6LM0jQ",
      premium: "price_1TUBl11TJBSxkUljRa3WhG0j",
      elite: "price_1TUBlW1TJBSxkUljPUqrxMq7",
    };

    const TEAM_SEAT_PRICE_ID = "price_1TUBo01TJBSxkUljglZFqIAG";
    const priceId = PRICE_IDS[tier];

    if (!priceId) {
      return NextResponse.json({ error: `Invalid tier` }, { status: 400 });
    }

    // Direct Stripe session creation without Supabase auth sync
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        { price: priceId, quantity: 1 },
        ...(additionalSeats > 0 ? [{ price: TEAM_SEAT_PRICE_ID, quantity: additionalSeats }] : [])
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/manage-subscription`,
    });

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}