import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { amount, invoiceId } = await req.json();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "gbp",
          product_data: {
            name: `Invoice ${invoiceId}`,
          },
          unit_amount: amount * 100,
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_URL}/payments?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/payments?cancel=true`,
    metadata: {
      invoiceId,
    },
  });

  return NextResponse.json({ url: session.url });
}