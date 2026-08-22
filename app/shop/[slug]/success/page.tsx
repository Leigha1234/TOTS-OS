// app/shop/[slug]/success/page.tsx

"use client";

import {
  CheckCircle2,
  Loader2,
  ShoppingBag,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useSearchParams,
} from "next/navigation";

type OrderConfirmation = {
  success?: boolean;

  order?: {
    id?: string;
    orderNumber?: string;
    customerName?: string | null;
    customerEmail?: string | null;
    subtotal?: number;
    discountAmount?: number;
    shippingAmount?: number;
    total?: number;
    paymentStatus?: string;
  };

  error?: string;
};

export default function StoreSuccessPage() {
  const params =
    useParams();

  const searchParams =
    useSearchParams();

  const slug =
    typeof params?.slug ===
    "string"
      ? params.slug
      : Array.isArray(
            params?.slug
          )
        ? params.slug[0]
        : "";

  const sessionId =
    searchParams.get(
      "session_id"
    ) || "";

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const [
    order,
    setOrder,
  ] =
    useState<
      OrderConfirmation["order"] | null
    >(null);

  useEffect(
    () => {
      async function loadOrder() {
        if (
          !sessionId
        ) {
          setError(
            "No checkout session was provided."
          );

          setLoading(
            false
          );

          return;
        }

        try {
          const response =
            await fetch(
              `/api/store-checkout/confirm?session_id=${encodeURIComponent(
                sessionId
              )}`,
              {
                method:
                  "GET",

                cache:
                  "no-store",

                headers: {
                  Accept:
                    "application/json",
                },
              }
            );

          const data =
            (await response.json()) as OrderConfirmation;

          if (
            !response.ok
          ) {
            throw new Error(
              data?.error ||
                "Your order could not be confirmed."
            );
          }

          setOrder(
            data.order ||
              null
          );
        } catch (
          confirmationError:
            unknown
        ) {
          console.error(
            "Order confirmation failed:",
            confirmationError
          );

          setError(
            confirmationError instanceof
              Error
              ? confirmationError.message
              : "Your order could not be confirmed."
          );
        } finally {
          setLoading(
            false
          );
        }
      }

      void loadOrder();
    },
    [
      sessionId,
    ]
  );

  if (
    loading
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f2] px-5">
        <div className="text-center">
          <Loader2
            size={28}
            className="mx-auto animate-spin text-[#829473]"
          />

          <p className="mt-4 text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">
            Confirming your order
          </p>
        </div>
      </main>
    );
  }

  if (
    error
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f2] px-5">
        <div className="w-full max-w-lg rounded-[2rem] border border-stone-200 bg-white p-9 text-center shadow-sm">
          <ShoppingBag
            size={24}
            className="mx-auto text-stone-300"
          />

          <h1 className="mt-5 font-serif text-4xl italic">
            Payment received
          </h1>

          <p className="mt-3 text-sm leading-6 text-stone-500">
            We couldn&apos;t load the order details, but if Stripe showed your payment as successful, your order should still be processing.
          </p>

          <a
            href={`/shop/${slug}`}
            className="mt-7 inline-flex rounded-full bg-stone-900 px-5 py-3 text-[9px] font-black uppercase tracking-[0.15em] text-white no-underline"
          >
            Back to store
          </a>
        </div>

        <SuccessPageStyles />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f5f2] px-5 py-12">
      <div className="w-full max-w-xl rounded-[2.2rem] border border-stone-200 bg-white p-8 text-center shadow-sm sm:p-10">

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#edf1e8] text-[#829473]">
          <CheckCircle2
            size={28}
          />
        </div>

        <p className="mt-6 text-[9px] font-black uppercase tracking-[0.2em] text-[#829473]">
          Order confirmed
        </p>

        <h1 className="mt-2 font-serif text-5xl italic leading-none text-stone-900">
          Thank you for your order.
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-stone-500">
          Your payment was successful and your order has been received.
        </p>

        {order && (
          <div className="mt-8 rounded-2xl bg-stone-50 p-5 text-left">

            {order.orderNumber && (
              <div className="flex items-center justify-between gap-4 border-b border-stone-200 pb-4">

                <span className="text-xs text-stone-400">
                  Order number
                </span>

                <strong className="text-xs text-stone-700">
                  {
                    order.orderNumber
                  }
                </strong>

              </div>
            )}

            {typeof order.subtotal ===
              "number" && (
              <div className="mt-4 flex items-center justify-between gap-4">

                <span className="text-xs text-stone-400">
                  Subtotal
                </span>

                <strong className="text-xs text-stone-700">
                  £
                  {order.subtotal.toFixed(
                    2
                  )}
                </strong>

              </div>
            )}

            {typeof order.discountAmount ===
              "number" &&
              order.discountAmount >
                0 && (
                <div className="mt-3 flex items-center justify-between gap-4">

                  <span className="text-xs text-stone-400">
                    Discount
                  </span>

                  <strong className="text-xs text-[#829473]">
                    -£
                    {order.discountAmount.toFixed(
                      2
                    )}
                  </strong>

                </div>
              )}

            {typeof order.shippingAmount ===
              "number" &&
              order.shippingAmount >
                0 && (
                <div className="mt-3 flex items-center justify-between gap-4">

                  <span className="text-xs text-stone-400">
                    Shipping
                  </span>

                  <strong className="text-xs text-stone-700">
                    £
                    {order.shippingAmount.toFixed(
                      2
                    )}
                  </strong>

                </div>
              )}

            {typeof order.total ===
              "number" && (
              <div className="mt-5 flex items-center justify-between gap-4 border-t border-stone-200 pt-4">

                <span className="text-xs font-semibold text-stone-500">
                  Total paid
                </span>

                <strong className="font-serif text-2xl italic text-stone-900">
                  £
                  {order.total.toFixed(
                    2
                  )}
                </strong>

              </div>
            )}

          </div>
        )}

        <div className="mt-7 rounded-2xl border border-[#dce4d2] bg-[#f1f5ec] px-5 py-4">
          <p className="text-xs leading-6 text-stone-600">
            You should receive confirmation from the business shortly.
          </p>
        </div>

        <a
          href={`/shop/${slug}`}
          className="mt-7 inline-flex items-center justify-center rounded-full bg-stone-900 px-6 py-3.5 text-[9px] font-black uppercase tracking-[0.16em] text-white no-underline"
        >
          Continue shopping
        </a>

      </div>

      <SuccessPageStyles />
    </main>
  );
}

function SuccessPageStyles() {
  return (
    <style jsx global>{`
      @import url("https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&display=swap");

      .font-serif {
        font-family:
          "Instrument Serif",
          Georgia,
          serif;
      }
    `}</style>
  );
}