import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// Stripe initialization using the API version from your Dashboard
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: null as any, 
});

// Map your tier names to your actual Stripe Price IDs
const PRICE_IDS: Record<string, string> = {
  standard: "price_1TUBhO1TJBSxkUljcv6LM0jQ",
  professional: "price_1TUBl11TJBSxkUljRa3WhG0j",
  elite: "price_1TUBlW1TJBSxkUljPUqrxMq7",
};

export async function POST(req: Request) {
  try {
    const { tier } = await req.json();
    const cookieStore = await cookies();

    // Initialize Supabase Client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Verify Authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate tier
    const priceId = PRICE_IDS[tier?.toLowerCase()];
    if (!priceId) {
      return NextResponse.json({ error: "Invalid tier selected" }, { status: 400 });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { 
        supabase_user_id: user.id 
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?status=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    });

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}