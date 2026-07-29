import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { completeRegistration } from "@/lib/auth/completeRegistration";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = (await headers()).get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing Stripe signature" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (error) {
      console.error("Stripe signature verification failed:", error);

      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    console.log("Stripe event received:", event.type);

    if (event.type === "checkout.session.completed") {
      // Account creation happens only after Stripe confirms payment.
      // completeRegistration handles retrieving the pending registration,
      // creating the Supabase user, organisation, membership and subscription records.
      const session = event.data.object as Stripe.Checkout.Session;

      const registrationId = session.metadata?.registration_id;

      if (!session.metadata) {
        console.error("Missing Stripe metadata");
        return NextResponse.json(
          { error: "Missing Stripe metadata" },
          { status: 400 }
        );
      }

      if (!session.customer_details?.email) {
        console.error("Missing customer email from Stripe session");
        return NextResponse.json(
          { error: "Missing customer email" },
          { status: 400 }
        );
      }

      if (!registrationId) {
        console.error("Missing registration_id in Stripe metadata");

        return NextResponse.json(
          { error: "Missing registration reference" },
          { status: 400 }
        );
      }

      if (session.payment_status !== "paid") {
        console.log("Checkout completed but payment not confirmed:", session.id);
        return NextResponse.json({ received: true });
      }

      try {
        await completeRegistration(registrationId, {
          stripe_session_id: session.id,
          stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
          stripe_subscription_id:
            typeof session.subscription === "string"
              ? session.subscription
              : null,
          customer_email: session.customer_details.email,
          payment_status: session.payment_status,
        });
      } catch (registrationError) {
        console.error(
          "Failed to complete registration after payment:",
          registrationError
        );

        return NextResponse.json(
          { error: "Failed to complete registration" },
          { status: 500 }
        );
      }

      console.log("Registration completed successfully:", {
        registrationId,
        stripeSessionId: session.id,
        customerEmail: session.customer_details.email,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}