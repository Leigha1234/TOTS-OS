import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";


export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    // 1. Verify the session with Stripe to ensure it is authentic
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    const email = session.customer_details?.email;
    const fullName = session.metadata?.fullName;

    if (!email || !fullName) {
      return NextResponse.json({ error: "Missing customer email or name" }, { status: 400 });
    }

    // 2. Check if user already exists in Supabase Auth
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      throw listError;
    }

    const isUserRegistered = listData?.users.find((u) => u.email === email);

    let userId: string;

    if (isUserRegistered) {
      // If they exist, use their existing ID
      userId = isUserRegistered.id;
      
      // Update their tier
      await (supabaseAdmin.from("profiles") as any)
        .update({ subscription_tier: "unpaid" })
        .eq("id", userId);
    } else {
      // 3. Create the user in Supabase Auth if they don't exist
      const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email!,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

      if (createError) throw createError;
      userId = userData.user.id;

      // 4. Update the profile with the paid tier
      const { error: updateError } = await (supabaseAdmin.from("profiles") as any)
        .update({ subscription_tier: "unpaid" })
        .eq("id", userId);

      if (updateError) throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Finalisation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}