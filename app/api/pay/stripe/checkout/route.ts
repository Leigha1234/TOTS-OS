import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        price: "YOUR_PRICE_ID",
        quantity: 1,
      },
    ],
    success_url: "http://localhost:3000/dashboard",
    cancel_url: "http://localhost:3000",
  });

  return NextResponse.json({ url: session.url });
}