// app/shop/[slug]/success/page.tsx

"use client";

import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Loader2,
  Mail,
  PackageCheck,
  ReceiptText,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
  useSearchParams,
} from "next/navigation";

// ============================================================
// TYPES
// ============================================================

type OrderItem = {
  id?: string;

  product_id?:
    | string
    | null;

  product_name?:
    | string
    | null;

  sku?:
    | string
    | null;

  quantity?:
    | number
    | null;

  unit_price?:
    | number
    | string
    | null;

  total?:
    | number
    | string
    | null;
};

type ConfirmedOrder = {
  id?: string;

  customerId?:
    | string
    | null;

  orderNumber?:
    | string
    | null;

  customerName?:
    | string
    | null;

  customerEmail?:
    | string
    | null;

  customerPhone?:
    | string
    | null;

  subtotal?:
    | number
    | null;

  discountAmount?:
    | number
    | null;

  shippingAmount?:
    | number
    | null;

  total?:
    | number
    | null;

  paymentStatus?:
    | string
    | null;

  storedPaymentStatus?:
    | string
    | null;

  fulfilmentStatus?:
    | string
    | null;

  items?:
    OrderItem[];
};

type OrderConfirmation = {
  success?: boolean;

  processingComplete?:
    boolean;

  session?: {
    id?: string;

    paymentStatus?:
      string | null;

    status?:
      string | null;

    customerEmail?:
      string | null;

    storeSlug?:
      string | null;

    amountSubtotal?:
      number | null;

    amountDiscount?:
      number | null;

    amountShipping?:
      number | null;

    amountTotal?:
      number | null;
  };

  order?:
    ConfirmedOrder;

  error?: string;
};

// ============================================================
// CONSTANTS
// ============================================================

const MAX_PROCESSING_RETRIES =
  8;

const PROCESSING_RETRY_DELAY_MS =
  1500;

// ============================================================
// HELPERS
// ============================================================

function formatCurrency(
  value:
    | number
    | string
    | null
    | undefined
) {
  return new Intl.NumberFormat(
    "en-GB",
    {
      style:
        "currency",

      currency:
        "GBP",

      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2,
    }
  ).format(
    Number(
      value ||
        0
    )
  );
}

// ============================================================
// PAGE
// ============================================================

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
    ) ||
    "";

  // ==========================================================
  // STATE
  // ==========================================================

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(
      false
    );

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    order,
    setOrder,
  ] =
    useState<
      ConfirmedOrder | null
    >(
      null
    );

  const [
    processingComplete,
    setProcessingComplete,
  ] =
    useState(
      false
    );

  const [
    retryCount,
    setRetryCount,
  ] =
    useState(
      0
    );

  // ==========================================================
  // LOAD CONFIRMATION
  // ==========================================================

  const loadOrder =
    useCallback(
      async ({
        quiet = false,
      }: {
        quiet?: boolean;
      } = {}) => {
        if (
          !sessionId
        ) {
          setError(
            "No checkout session was provided."
          );

          setLoading(
            false
          );

          return null;
        }

        if (
          quiet
        ) {
          setRefreshing(
            true
          );
        } else {
          setLoading(
            true
          );
        }

        try {
          const response =
            await fetch(
              `/api/store-checkout/confirm?session_id=${encodeURIComponent(
                sessionId
              )}&t=${Date.now()}`,
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

          setProcessingComplete(
            data.processingComplete ===
              true
          );

          setError(
            null
          );

          return data;
        } catch (
          confirmationError:
            unknown
        ) {
          console.error(
            "[TOTS STORE SUCCESS] Order confirmation failed:",
            confirmationError
          );

          if (
            !quiet
          ) {
            setError(
              confirmationError instanceof
                Error
                ? confirmationError.message
                : "Your order could not be confirmed."
            );
          }

          return null;
        } finally {
          setLoading(
            false
          );

          setRefreshing(
            false
          );
        }
      },
      [
        sessionId,
      ]
    );

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(
    () => {
      void loadOrder();
    },
    [
      loadOrder,
    ]
  );

  // ==========================================================
  // WAIT FOR WEBHOOK
  //
  // Stripe can redirect the customer before our webhook has
  // finished updating store_orders.
  //
  // If Stripe says payment is successful but Supabase still
  // says pending, briefly poll the confirmation endpoint.
  // ==========================================================

  useEffect(
    () => {
      if (
        loading ||
        error ||
        processingComplete ||
        !order ||
        retryCount >=
          MAX_PROCESSING_RETRIES
      ) {
        return;
      }

      const paymentStatus =
        String(
          order.paymentStatus ||
            ""
        )
          .trim()
          .toLowerCase();

      if (
        paymentStatus !==
        "paid"
      ) {
        return;
      }

      const timeout =
        window.setTimeout(
          async () => {
            const result =
              await loadOrder({
                quiet:
                  true,
              });

            setRetryCount(
              (
                current
              ) =>
                current +
                1
            );

            if (
              result?.processingComplete
            ) {
              setProcessingComplete(
                true
              );
            }
          },
          PROCESSING_RETRY_DELAY_MS
        );

      return () => {
        window.clearTimeout(
          timeout
        );
      };
    },
    [
      loading,
      error,
      processingComplete,
      order,
      retryCount,
      loadOrder,
    ]
  );

  // ==========================================================
  // DERIVED STATE
  // ==========================================================

  const paymentSuccessful =
    useMemo(
      () => {
        const paymentStatus =
          String(
            order
              ?.paymentStatus ||
              ""
          )
            .trim()
            .toLowerCase();

        return (
          paymentStatus ===
          "paid"
        );
      },
      [
        order
          ?.paymentStatus,
      ]
    );

  const orderItems =
    order?.items ||
    [];

  const itemCount =
    useMemo(
      () =>
        orderItems.reduce(
          (
            total,
            item
          ) =>
            total +
            Math.max(
              0,
              Number(
                item.quantity ||
                  0
              )
            ),
          0
        ),
      [
        orderItems,
      ]
    );

  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    loading
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f2] px-5">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-stone-200 bg-white shadow-sm">
            <Loader2
              size={25}
              className="animate-spin text-[#829473]"
            />
          </div>

          <p className="mt-5 text-[9px] font-black uppercase tracking-[0.22em] text-[#829473]">
            Confirming your order
          </p>

          <p className="mt-2 text-xs text-stone-400">
            We&apos;re checking your payment details.
          </p>
        </div>

        <SuccessPageStyles />
      </main>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (
    error
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f2] px-5 py-12">
        <div className="w-full max-w-lg rounded-[2.25rem] border border-stone-200 bg-white p-8 text-center shadow-[0_20px_60px_rgba(28,25,23,0.06)] sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
            <ShoppingBag
              size={25}
            />
          </div>

          <p className="mt-6 text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">
            Checkout complete
          </p>

          <h1 className="mt-2 font-serif text-5xl italic leading-none text-stone-900">
            We&apos;re checking your order.
          </h1>

          <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-stone-500">
            We couldn&apos;t load your full order details just yet. If Stripe showed your payment as successful, your order may still be processing safely in the background.
          </p>

          <div className="mt-7 rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <p className="text-xs leading-5 text-stone-500">
              {error}
            </p>
          </div>

          <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() =>
                void loadOrder()
              }
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#829473] px-6 py-3.5 text-[9px] font-black uppercase tracking-[0.15em] text-white"
            >
              Try again

              <ArrowRight
                size={13}
              />
            </button>

            <a
              href={`/shop/${slug}`}
              className="inline-flex items-center justify-center rounded-full border border-stone-200 bg-white px-6 py-3.5 text-[9px] font-black uppercase tracking-[0.15em] text-stone-600 no-underline"
            >
              Back to store
            </a>
          </div>
        </div>

        <SuccessPageStyles />
      </main>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <main className="min-h-screen bg-[#f7f5f2] px-4 py-8 text-stone-900 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">

        {/* ====================================================
            SUCCESS HERO
        ==================================================== */}

        <section className="overflow-hidden rounded-[2.4rem] border border-stone-200 bg-white shadow-[0_24px_70px_rgba(28,25,23,0.06)]">
          <div className="px-6 pb-7 pt-8 text-center sm:px-10 sm:pb-9 sm:pt-10">

            <div
              className={`mx-auto flex h-18 w-18 items-center justify-center rounded-[1.4rem] ${
                paymentSuccessful
                  ? "bg-[#edf1e8] text-[#829473]"
                  : "bg-amber-50 text-amber-500"
              }`}
            >
              {paymentSuccessful ? (
                <CheckCircle2
                  size={31}
                />
              ) : (
                <Clock3
                  size={28}
                />
              )}
            </div>

            <p className="mt-6 text-[9px] font-black uppercase tracking-[0.22em] text-[#829473]">
              {paymentSuccessful
                ? "Payment successful"
                : "Payment processing"}
            </p>

            <h1 className="mx-auto mt-2 max-w-2xl font-serif text-5xl italic leading-[0.95] tracking-tight text-stone-900 sm:text-6xl">
              {paymentSuccessful
                ? "Thank you for your order."
                : "We’re finishing things up."}
            </h1>

            <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-stone-500">
              {processingComplete
                ? "Your order has been received and processed successfully."
                : paymentSuccessful
                  ? "Your payment was successful. TOTS-OS is just finishing the final order processing."
                  : "Your checkout has been received and we’re waiting for the payment confirmation to finish."}
            </p>

            {/* PROCESSING STATUS */}

            {paymentSuccessful &&
              !processingComplete && (
                <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-2 rounded-full bg-[#f4f6f1] px-4 py-3 text-[10px] font-semibold text-[#6f8063]">
                  <Loader2
                    size={13}
                    className="animate-spin"
                  />

                  Finishing your order...

                  {refreshing && (
                    <span className="sr-only">
                      Refreshing
                    </span>
                  )}
                </div>
              )}

            {processingComplete && (
              <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-2 rounded-full bg-[#edf1e8] px-4 py-3 text-[10px] font-semibold text-[#6f8063]">
                <Check
                  size={13}
                />

                Order processing complete
              </div>
            )}
          </div>

          {/* ==================================================
              ORDER DETAILS
          ================================================== */}

          {order && (
            <div className="border-t border-stone-100 bg-[#fbfaf8] px-5 py-6 sm:px-8 sm:py-8">

              <div className="grid gap-3 sm:grid-cols-2">

                {order.orderNumber && (
                  <InfoCard
                    icon={
                      <ReceiptText
                        size={15}
                      />
                    }
                    label="Order number"
                    value={
                      order.orderNumber
                    }
                  />
                )}

                {order.customerEmail && (
                  <InfoCard
                    icon={
                      <Mail
                        size={15}
                      />
                    }
                    label="Confirmation email"
                    value={
                      order.customerEmail
                    }
                  />
                )}

              </div>

              {/* ==============================================
                  ITEMS
              ============================================== */}

              {orderItems.length >
                0 && (
                <div className="mt-5 rounded-[1.6rem] border border-stone-200 bg-white p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.18em] text-stone-400">
                        Your order
                      </p>

                      <h2 className="mt-1 font-serif text-2xl italic text-stone-800">
                        {itemCount}{" "}
                        {itemCount ===
                        1
                          ? "item"
                          : "items"}
                      </h2>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-50 text-stone-400">
                      <PackageCheck
                        size={17}
                      />
                    </div>
                  </div>

                  <div className="mt-5 divide-y divide-stone-100">
                    {orderItems.map(
                      (
                        item,
                        index
                      ) => {
                        const quantity =
                          Math.max(
                            1,
                            Number(
                              item.quantity ||
                                1
                            )
                          );

                        const lineTotal =
                          Number(
                            item.total ??
                              (
                                Number(
                                  item.unit_price ||
                                    0
                                ) *
                                quantity
                              )
                          );

                        return (
                          <div
                            key={
                              item.id ||
                              `${item.product_id || "item"}-${index}`
                            }
                            className="flex items-start justify-between gap-5 py-4 first:pt-0 last:pb-0"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-stone-700">
                                {item.product_name ||
                                  "Order item"}
                              </p>

                              <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-stone-400">
                                <span>
                                  Qty{" "}
                                  {
                                    quantity
                                  }
                                </span>

                                {item.sku && (
                                  <>
                                    <span>
                                      ·
                                    </span>

                                    <span>
                                      {
                                        item.sku
                                      }
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            <p className="shrink-0 text-sm font-semibold text-stone-700">
                              {formatCurrency(
                                lineTotal
                              )}
                            </p>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              {/* ==============================================
                  TOTALS
              ============================================== */}

              <div className="mt-5 rounded-[1.6rem] border border-stone-200 bg-white p-5 sm:p-6">

                <div className="space-y-3">

                  {typeof order.subtotal ===
                    "number" && (
                    <OrderMoneyRow
                      label="Subtotal"
                      value={formatCurrency(
                        order.subtotal
                      )}
                    />
                  )}

                  {typeof order.discountAmount ===
                    "number" &&
                    order.discountAmount >
                      0 && (
                    <OrderMoneyRow
                      label="Discount"
                      value={`-${formatCurrency(
                        order.discountAmount
                      )}`}
                      accent
                    />
                  )}

                  {typeof order.shippingAmount ===
                    "number" &&
                    order.shippingAmount >
                      0 && (
                    <OrderMoneyRow
                      label="Shipping"
                      value={formatCurrency(
                        order.shippingAmount
                      )}
                    />
                  )}

                </div>

                {typeof order.total ===
                  "number" && (
                  <div className="mt-5 flex items-end justify-between gap-4 border-t border-stone-200 pt-5">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-stone-400">
                        Total paid
                      </p>

                      <p className="mt-1 text-xs text-stone-400">
                        Secure Stripe checkout
                      </p>
                    </div>

                    <strong className="font-serif text-3xl italic leading-none text-stone-900">
                      {formatCurrency(
                        order.total
                      )}
                    </strong>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ====================================================
            WHAT HAPPENS NEXT
        ==================================================== */}

        <section className="mt-5 rounded-[2rem] border border-[#dce4d2] bg-[#f1f5ec] p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#829473] shadow-sm">
              <Sparkles
                size={16}
              />
            </div>

            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[#829473]">
                What happens next?
              </p>

              <h2 className="mt-1 font-serif text-2xl italic text-stone-800">
                You&apos;re all set.
              </h2>

              <p className="mt-2 text-xs leading-6 text-stone-600">
                The business now has your order in TOTS-OS and will be able to follow up with you directly. Keep your order number handy in case you need to get in touch.
              </p>
            </div>
          </div>
        </section>

        {/* ====================================================
            ACTIONS
        ==================================================== */}

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">

          <a
            href={`/shop/${slug}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-7 py-4 text-[9px] font-black uppercase tracking-[0.16em] text-white no-underline transition hover:bg-stone-800 sm:w-auto"
          >
            Continue shopping

            <ArrowRight
              size={13}
            />
          </a>

          {!processingComplete &&
            paymentSuccessful && (
              <button
                type="button"
                disabled={
                  refreshing
                }
                onClick={() =>
                  void loadOrder({
                    quiet:
                      true,
                  })
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-7 py-4 text-[9px] font-black uppercase tracking-[0.16em] text-stone-600 transition hover:bg-stone-50 disabled:opacity-50 sm:w-auto"
              >
                {refreshing ? (
                  <Loader2
                    size={13}
                    className="animate-spin"
                  />
                ) : (
                  <ShoppingBag
                    size={13}
                  />
                )}

                Check order status
              </button>
            )}
        </div>

        <p className="mt-7 text-center text-[8px] uppercase tracking-[0.16em] text-stone-300">
          Secure checkout powered by TOTS-OS and Stripe
        </p>
      </div>

      <SuccessPageStyles />
    </main>
  );
}

// ============================================================
// SMALL COMPONENTS
// ============================================================

function InfoCard({
  icon,
  label,
  value,
}: {
  icon:
    React.ReactNode;

  label:
    string;

  value:
    string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-stone-200 bg-white p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-50 text-[#829473]">
        {
          icon
        }
      </div>

      <div className="min-w-0">
        <p className="text-[8px] font-black uppercase tracking-[0.14em] text-stone-400">
          {
            label
          }
        </p>

        <p className="mt-1 break-words text-xs font-semibold text-stone-700">
          {
            value
          }
        </p>
      </div>
    </div>
  );
}

// ============================================================

function OrderMoneyRow({
  label,
  value,
  accent = false,
}: {
  label:
    string;

  value:
    string;

  accent?:
    boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-stone-400">
        {
          label
        }
      </span>

      <strong
        className={`text-xs ${
          accent
            ? "text-[#829473]"
            : "text-stone-700"
        }`}
      >
        {
          value
        }
      </strong>
    </div>
  );
}

// ============================================================
// GLOBAL STYLES
// ============================================================

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

      @keyframes success-enter {
        from {
          opacity: 0;
          transform: translateY(8px);
        }

        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      main > div {
        animation:
          success-enter
          0.45s
          ease-out
          both;
      }
    `}</style>
  );
}