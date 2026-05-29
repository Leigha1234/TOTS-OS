import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// By passing null, Stripe will use the API version set in your Dashboard
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: null as any, 
});

export async function POST(req: Request) {
  try {
    const { tier, additionalSeats } = await req.json();
    const cookieStore = await cookies();

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

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Your Stripe session creation logic...
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Auth/Stripe Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}