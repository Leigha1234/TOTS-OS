import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, fullName, password } = await req.json();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      customer_email: email,
      // Pass the sensitive data as metadata to the session
      metadata: { 
        email, 
        fullName,
        // WARNING: Do NOT pass the plain-text password here. 
        // Instead, create a temporary "pending_registration" table 
        // in Supabase using the email as the key.
      },
      success_url: `${process.env.NEXT_PUBLIC_URL}/onboarding/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/login`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}