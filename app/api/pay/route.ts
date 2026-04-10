import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const amount = body.amount;

    console.log("AMOUNT RECEIVED:", amount);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: "Test Payment",
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      success_url: "http://localhost:3000/crm",
      cancel_url: "http://localhost:3000/crm",
    });

    console.log("STRIPE SESSION:", session.url);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("STRIPE ERROR:", err);
    return NextResponse.json({ error: "fail" });
  }
}