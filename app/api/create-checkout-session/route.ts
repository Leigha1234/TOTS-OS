import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const registrationEncryptionKey: string = process.env.REGISTRATION_ENCRYPTION_KEY || "";

if (!registrationEncryptionKey) {
  throw new Error("REGISTRATION_ENCRYPTION_KEY is missing");
}

function encryptPassword(password: string) {
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash("sha256").update(registrationEncryptionKey).digest();
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(password, "utf8"),
    cipher.final(),
  ]);

  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      email,
      password,
      fullName,
      companyName,
      jobTitle,
      // inviteId removed because pending_registrations does not contain an invite_id column
    } = body;

    if (!email || !password || !fullName || !companyName) {
      return NextResponse.json(
        { error: "Missing required registration details." },
        { status: 400 }
      );
    }

    const { data: existingPending } = await supabase
      .from("pending_registrations")
      .select("id")
      .eq("email", email)
      .eq("completed", false)
      .maybeSingle();

    if (existingPending) {
      await supabase
        .from("pending_registrations")
        .delete()
        .eq("id", existingPending.id);
    }

    const encryptedPassword = encryptPassword(password);

    const { data: pendingRegistration, error: registrationError } =
      await supabase
        .from("pending_registrations")
        .insert({
          email,
          encrypted_password: encryptedPassword,
          full_name: fullName,
          company_name: companyName,
          job_title: jobTitle ?? null,
          completed: false,
        })
        .select("id")
        .single();

    if (registrationError || !pendingRegistration) {
      console.error("Pending registration error:", registrationError);
      return NextResponse.json(
        { error: "Unable to save registration details." },
        { status: 500 }
      );
    }

    if (!process.env.STRIPE_PRICE_ELITE) {
      throw new Error("STRIPE_PRICE_ELITE is missing");
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      allow_promotion_codes: true,
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ELITE!,
          quantity: 1,
        },
      ],
      customer_email: email,
      billing_address_collection: "required",
      customer_creation: "always",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?cancelled=true`,
      metadata: {
        registration_id: pendingRegistration.id,
      },
    });

    const { error: sessionUpdateError } = await supabase
      .from("pending_registrations")
      .update({
        stripe_session_id: session.id,
      })
      .eq("id", pendingRegistration.id);

    if (sessionUpdateError) {
      console.error("Failed to save Stripe session:", sessionUpdateError);
      return NextResponse.json(
        { error: "Unable to link payment session." },
        { status: 500 }
      );
    }

    await supabase
      .from("pending_registrations")
      .update({
        completed: false,
      })
      .eq("id", pendingRegistration.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout session error:", error);

    return NextResponse.json(
      { error: "Unable to create checkout session." },
      { status: 500 }
    );
  }
}