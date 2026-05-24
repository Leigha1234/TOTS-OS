import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const { inviteId, email } = await req.json();

    if (!inviteId || !email) {
      return NextResponse.json(
        { error: "Missing required parameters: inviteId or email" }, 
        { status: 400 }
      );
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          // Ensure your .env has this variable or use the string directly
          price: process.env.STRIPE_SEAT_PRICE_ID || 'price_1TUBo01TJBSxkUljglZFqIAG', 
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: email, // Pre-fills the email in Stripe
      success_url: `${process.env.NEXT_PUBLIC_URL}/settings/team?success=true&inviteId=${inviteId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/settings/team`,
      metadata: { 
        inviteId: inviteId, // Critical for the webhook to update your DB
      },
    });

    // Returning both url and id to allow the client to store the session reference
    return NextResponse.json({ url: session.url, sessionId: session.id });
    
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}