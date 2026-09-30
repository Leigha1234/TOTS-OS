import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!supabaseUrl || !serviceRoleKey || !stripeSecretKey) {
  throw new Error("Missing Supabase/Stripe environment variables.");
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const stripe = new Stripe(stripeSecretKey);

// ============================================================
// TYPES
// ============================================================

type Action =
  | "setup"
  | "verify"
  | "teamup_stopped"
  | "activate";

type SubscriptionRow = {
  id: string;
  organisation_id: string;
  product_id: string | null;

  customer_name: string | null;
  customer_email: string | null;

  currency: string | null;
  unit_amount_pence: number | null;
  billing_interval: "week" | "month" | "year" | null;

  legacy_membership_name: string | null;

  collection_enabled: boolean;
  teamup_billing_active: boolean;

  cutover_status: string;

  metadata: Record<string, unknown> | null;

  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

// ============================================================
// HELPERS
// ============================================================

function text(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function nowIso() {
  return new Date().toISOString();
}

// ============================================================
// AUTH
// ============================================================

async function requireUser(req: Request) {
  const header =
    req.headers.get("authorization") || "";

  const token = header.startsWith("Bearer ")
    ? header.slice(7).trim()
    : "";

  if (!token) {
    throw new Error("UNAUTHENTICATED");
  }

  const { data, error } =
    await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    throw new Error("UNAUTHENTICATED");
  }

  return data.user;
}

// ============================================================
// CONNECTED STRIPE ACCOUNT
// ============================================================

async function getStripeAccount(
  organisationId: string,
) {
  const { data, error } = await supabaseAdmin
    .from("store_stripe_accounts")
    .select(
      `
        stripe_account_id,
        charges_enabled,
        onboarding_complete
      `,
    )
    .eq("organisation_id", organisationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const accountId =
    text(data?.stripe_account_id);

  if (!accountId) {
    throw new Error(
      "MTC has no connected TOTS Stripe account.",
    );
  }

  const account =
    await stripe.accounts.retrieve(accountId);

  if (
    "deleted" in account &&
    account.deleted
  ) {
    throw new Error(
      "Connected Stripe account no longer exists.",
    );
  }

  if (!account.charges_enabled) {
    throw new Error(
      "Connected Stripe account cannot accept charges yet.",
    );
  }

  return accountId;
}

// ============================================================
// LOAD SUBSCRIPTION
// ============================================================

async function loadSubscription(
  subscriptionId: string,
) {
  const { data, error } = await supabaseAdmin
    .from("store_subscriptions")
    .select(
      `
        id,
        organisation_id,
        product_id,
        customer_name,
        customer_email,
        currency,
        unit_amount_pence,
        billing_interval,
        legacy_membership_name,
        collection_enabled,
        teamup_billing_active,
        cutover_status,
        metadata,
        stripe_customer_id,
        stripe_subscription_id
      `,
    )
    .eq("id", subscriptionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "Membership record not found.",
    );
  }

  return data as SubscriptionRow;
}

// ============================================================
// SAVE METADATA
// ============================================================

async function saveMetadata(
  row: SubscriptionRow,
  patch: Record<string, unknown>,
  extra: Record<string, unknown> = {},
) {
  const metadata = {
    ...(row.metadata || {}),
    ...patch,
  };

  const { error } = await supabaseAdmin
    .from("store_subscriptions")
    .update({
      metadata,
      ...extra,
      updated_at: nowIso(),
    })
    .eq("id", row.id);

  if (error) {
    throw error;
  }
}

// ============================================================
// FIND EXISTING MIGRATION CUSTOMER
// ============================================================

async function findExistingMigrationCustomer(
  row: SubscriptionRow,
  accountId: string,
) {
  /*
   * Recovery protection.
   *
   * If Stripe successfully created the customer during a
   * previous attempt but the Supabase update then failed,
   * we do not want to create another Stripe customer.
   */

  try {
    const result =
      await stripe.customers.search(
        {
          query:
            `metadata["tots_store_subscription_id"]:"${row.id}"`,
          limit: 10,
        },
        {
          stripeAccount: accountId,
        },
      );

    const customer =
      result.data.find(
        (item) =>
          !(
            "deleted" in item &&
            item.deleted
          ),
      );

    return customer?.id || null;
  } catch (error) {
    /*
     * Customer Search may not be available in every
     * Stripe configuration.
     *
     * Failure here is non-fatal.
     */

    console.warn(
      "[TOTS BILLING MIGRATION] Could not search existing Stripe customers:",
      error,
    );

    return null;
  }
}

// ============================================================
// ENSURE STRIPE CUSTOMER
// ============================================================

async function ensureCustomer(
  row: SubscriptionRow,
  accountId: string,
) {
  const meta = row.metadata || {};

  const savedCustomerId =
    text(meta.tots_migration_customer_id) ||
    text(row.stripe_customer_id);

  // ----------------------------------------------------------
  // First try customer already stored in TOTS
  // ----------------------------------------------------------

  if (savedCustomerId) {
    try {
      const customer =
        await stripe.customers.retrieve(
          savedCustomerId,
          {
            stripeAccount: accountId,
          },
        );

      if (
        !(
          "deleted" in customer &&
          customer.deleted
        )
      ) {
        return customer.id;
      }
    } catch {
      /*
       * Continue to recovery search.
       */
    }
  }

  // ----------------------------------------------------------
  // Recover customer from a previous partially failed request
  // ----------------------------------------------------------

  const recoveredCustomerId =
    await findExistingMigrationCustomer(
      row,
      accountId,
    );

  if (recoveredCustomerId) {
    return recoveredCustomerId;
  }

  // ----------------------------------------------------------
  // Create customer
  // ----------------------------------------------------------

  const email =
    text(row.customer_email);

  if (!email) {
    throw new Error(
      "This member has no email address for payment setup.",
    );
  }

  const customer =
    await stripe.customers.create(
      {
        email,
        name:
          text(row.customer_name) ||
          undefined,

        metadata: {
          tots_store_subscription_id:
            row.id,

          migration_source:
            "teamup",
        },
      },
      {
        stripeAccount:
          accountId,

        /*
         * Prevent duplicate customer creation if the
         * request is retried.
         */
        idempotencyKey:
          `mtc-migration-customer-${row.id}`,
      },
    );

  return customer.id;
}

// ============================================================
// ENSURE RECURRING PRICE
// ============================================================

async function ensureRecurringPrice(
  row: SubscriptionRow,
  accountId: string,
) {
  const meta =
    row.metadata || {};

  const existingPriceId =
    text(meta.tots_migration_price_id);

  // ----------------------------------------------------------
  // Reuse existing Stripe price
  // ----------------------------------------------------------

  if (existingPriceId) {
    try {
      const price =
        await stripe.prices.retrieve(
          existingPriceId,
          {
            stripeAccount:
              accountId,
          },
        );

      if (price.active) {
        return price.id;
      }
    } catch {
      /*
       * Recreate below if the saved Stripe object
       * genuinely no longer exists.
       */
    }
  }

  // ----------------------------------------------------------
  // Validate recurring amount
  // ----------------------------------------------------------

  const amount =
    Number(
      row.unit_amount_pence || 0,
    );

  if (
    !Number.isInteger(amount) ||
    amount <= 0
  ) {
    throw new Error(
      "A valid recurring amount is required before TOTS billing can be activated.",
    );
  }

  // ----------------------------------------------------------
  // Validate billing interval
  // ----------------------------------------------------------

  const interval =
    row.billing_interval;

  if (
    !interval ||
    ![
      "week",
      "month",
      "year",
    ].includes(interval)
  ) {
    throw new Error(
      "A valid billing interval is required.",
    );
  }

  // ----------------------------------------------------------
  // Create Stripe product
  // ----------------------------------------------------------

  const product =
    await stripe.products.create(
      {
        name:
          row.legacy_membership_name ||
          `MTC membership - ${
            row.customer_name ||
            "member"
          }`,

        metadata: {
          tots_store_subscription_id:
            row.id,

          migration_source:
            "teamup",
        },
      },
      {
        stripeAccount:
          accountId,

        idempotencyKey:
          `mtc-migration-product-${row.id}`,
      },
    );

  // ----------------------------------------------------------
  // Create Stripe recurring price
  // ----------------------------------------------------------

  const price =
    await stripe.prices.create(
      {
        product:
          product.id,

        currency:
          (
            row.currency ||
            "gbp"
          ).toLowerCase(),

        unit_amount:
          amount,

        recurring: {
          interval,
        },

        metadata: {
          tots_store_subscription_id:
            row.id,

          migration_source:
            "teamup",
        },
      },
      {
        stripeAccount:
          accountId,

        idempotencyKey:
          `mtc-migration-price-${row.id}`,
      },
    );

  // ----------------------------------------------------------
  // Save Stripe objects
  // ----------------------------------------------------------

  await saveMetadata(
    row,
    {
      tots_migration_product_id:
        product.id,

      tots_migration_price_id:
        price.id,
    },
  );

  return price.id;
}

// ============================================================
// POST
// ============================================================

export async function POST(
  req: Request,
) {
  try {
    // --------------------------------------------------------
    // Authentication
    // --------------------------------------------------------

    await requireUser(req);

    // --------------------------------------------------------
    // Request
    // --------------------------------------------------------

    const body =
      await req.json();

    const subscriptionId =
      text(body.subscriptionId);

    const action =
      text(body.action) as Action;

    if (
      !subscriptionId ||
      ![
        "setup",
        "verify",
        "teamup_stopped",
        "activate",
      ].includes(action)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid billing migration request.",
        },
        {
          status: 400,
        },
      );
    }

    // --------------------------------------------------------
    // Membership
    // --------------------------------------------------------

    const row =
      await loadSubscription(
        subscriptionId,
      );

    // --------------------------------------------------------
    // MTC Stripe account
    // --------------------------------------------------------

    const accountId =
      await getStripeAccount(
        row.organisation_id,
      );

    // ========================================================
    // ACTION: SETUP
    //
    // Creates:
    //
    // Stripe Customer
    // Stripe Checkout Session (setup mode)
    //
    // DOES NOT:
    //
    // create a Stripe subscription
    // charge the member
    // stop TeamUp
    // enable TOTS collection
    // ========================================================

    if (action === "setup") {
      if (
        row.collection_enabled
      ) {
        return NextResponse.json(
          {
            error:
              "TOTS billing is already active for this member.",
          },
          {
            status: 400,
          },
        );
      }

      if (
        !row.billing_interval ||
        !row.unit_amount_pence ||
        row.unit_amount_pence <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "This record does not have a valid recurring amount/interval.",
          },
          {
            status: 400,
          },
        );
      }

      // ------------------------------------------------------
      // Customer
      // ------------------------------------------------------

      const customerId =
        await ensureCustomer(
          row,
          accountId,
        );

      // ------------------------------------------------------
      // Resolve application origin
      // ------------------------------------------------------

      const configuredOrigin =
        text(
          process.env
            .NEXT_PUBLIC_APP_URL,
        ) ||
        text(
          process.env.APP_URL,
        );

      const forwardedProto =
        text(
          req.headers.get(
            "x-forwarded-proto",
          ),
        ) ||
        "https";

      const forwardedHost =
        text(
          req.headers.get(
            "x-forwarded-host",
          ),
        ) ||
        text(
          req.headers.get(
            "host",
          ),
        );

      const origin =
        configuredOrigin
          ? configuredOrigin.replace(
              /\/$/,
              "",
            )
          : forwardedHost
            ? `${forwardedProto}://${forwardedHost}`
            : "https://tots-os.co.uk";

      // ------------------------------------------------------
      // Success URL
      // ------------------------------------------------------

      const successUrl =
        new URL(
          "/store",
          origin,
        );

      successUrl.searchParams.set(
        "billing_setup",
        "success",
      );

      successUrl.searchParams.set(
        "subscription",
        row.id,
      );

      /*
       * Stripe replaces this literal placeholder
       * after Checkout completes.
       */

      successUrl.searchParams.set(
        "session_id",
        "{CHECKOUT_SESSION_ID}",
      );

      // ------------------------------------------------------
      // Cancel URL
      // ------------------------------------------------------

      const cancelUrl =
        new URL(
          "/store",
          origin,
        );

      cancelUrl.searchParams.set(
        "billing_setup",
        "cancelled",
      );

      cancelUrl.searchParams.set(
        "subscription",
        row.id,
      );

      // ------------------------------------------------------
      // Create Setup Checkout
      // ------------------------------------------------------

      const session =
        await stripe.checkout.sessions.create(
          {
            mode:
              "setup",

            customer:
              customerId,

            success_url:
              successUrl.toString(),

            cancel_url:
              cancelUrl.toString(),

            metadata: {
              tots_store_subscription_id:
                row.id,

              organisation_id:
                row.organisation_id,

              migration_source:
                "teamup",
            },

            payment_method_types: [
              "card",
            ],
          },
          {
            stripeAccount:
              accountId,

            idempotencyKey:
              `mtc-migration-setup-${row.id}`,
          },
        );

      // ------------------------------------------------------
      // SAVE SETUP STATE
      //
      // Valid database cutover status:
      //
      // awaiting_processor
      //
      // TeamUp remains ON.
      // TOTS collection remains OFF.
      // ------------------------------------------------------

      await saveMetadata(
        row,
        {
          tots_migration_customer_id:
            customerId,

          tots_migration_setup_session_id:
            session.id,

          tots_migration_setup_created_at:
            nowIso(),
        },
        {
          stripe_account_id:
            accountId,

          stripe_customer_id:
            customerId,

          cutover_status:
            "awaiting_processor",

          collection_enabled:
            false,

          teamup_billing_active:
            true,
        },
      );

      return NextResponse.json({
        success: true,

        url:
          session.url,

        cutoverStatus:
          "awaiting_processor",

        safety: {
          stripeSubscriptionCreated:
            false,

          paymentCollected:
            false,

          collectionEnabled:
            false,

          teamupBillingActive:
            true,
        },
      });
    }

    // ========================================================
    // ACTION: VERIFY
    //
    // Confirms:
    //
    // Checkout completed
    // SetupIntent succeeded
    // reusable payment method exists
    //
    // DOES NOT create recurring billing.
    // ========================================================

    if (action === "verify") {
      const sessionId =
        text(
          (
            row.metadata ||
            {}
          )
            .tots_migration_setup_session_id,
        );

      if (!sessionId) {
        return NextResponse.json(
          {
            error:
              "No payment setup session has been created for this member yet.",
          },
          {
            status: 400,
          },
        );
      }

      // ------------------------------------------------------
      // Retrieve Checkout
      // ------------------------------------------------------

      const session =
        await stripe.checkout.sessions.retrieve(
          sessionId,
          {
            expand: [
              "setup_intent",
            ],
          },
          {
            stripeAccount:
              accountId,
          },
        );

      if (
        session.status !==
          "complete" ||
        !session.setup_intent
      ) {
        return NextResponse.json(
          {
            error:
              "Payment setup has not been completed yet.",
          },
          {
            status: 409,
          },
        );
      }

      // ------------------------------------------------------
      // SetupIntent
      // ------------------------------------------------------

      const setupIntent =
        typeof session.setup_intent ===
        "string"
          ? await stripe.setupIntents.retrieve(
              session.setup_intent,
              {},
              {
                stripeAccount:
                  accountId,
              },
            )
          : session.setup_intent;

      // ------------------------------------------------------
      // Payment method
      // ------------------------------------------------------

      const paymentMethodId =
        typeof setupIntent.payment_method ===
        "string"
          ? setupIntent.payment_method
          : setupIntent
              .payment_method
              ?.id;

      if (
        !paymentMethodId ||
        setupIntent.status !==
          "succeeded"
      ) {
        return NextResponse.json(
          {
            error:
              "Stripe has not confirmed a reusable payment method yet.",
          },
          {
            status: 409,
          },
        );
      }

      // ------------------------------------------------------
      // Customer
      // ------------------------------------------------------

      const customerId =
        text(
          session.customer,
        ) ||
        text(
          (
            row.metadata ||
            {}
          )
            .tots_migration_customer_id,
        );

      if (!customerId) {
        throw new Error(
          "Stripe customer could not be resolved.",
        );
      }

      // ------------------------------------------------------
      // Set default payment method
      // ------------------------------------------------------

      await stripe.customers.update(
        customerId,
        {
          invoice_settings: {
            default_payment_method:
              paymentMethodId,
          },
        },
        {
          stripeAccount:
            accountId,
        },
      );

      // ------------------------------------------------------
      // SAVE VERIFIED STATE
      //
      // Valid database cutover status:
      //
      // verified
      //
      // TeamUp remains ON.
      // TOTS remains OFF.
      // ------------------------------------------------------

      await saveMetadata(
        row,
        {
          tots_migration_customer_id:
            customerId,

          tots_migration_payment_method_id:
            paymentMethodId,

          tots_migration_setup_verified_at:
            nowIso(),
        },
        {
          stripe_account_id:
            accountId,

          stripe_customer_id:
            customerId,

          cutover_status:
            "verified",

          processor_verification_status:
            "verified",

          processor_verified_at:
            nowIso(),

          collection_enabled:
            false,

          teamup_billing_active:
            true,
        },
      );

      return NextResponse.json({
        success: true,

        cutoverStatus:
          "verified",

        safety: {
          stripeSubscriptionCreated:
            false,

          paymentCollected:
            false,

          collectionEnabled:
            false,

          teamupBillingActive:
            true,
        },
      });
    }

    // ========================================================
    // ACTION: TEAMUP STOPPED
    //
    // IMPORTANT:
    //
    // This DOES NOT contact TeamUp.
    //
    // It records that an administrator has already stopped
    // TeamUp billing externally/manually.
    //
    // TOTS collection still remains OFF.
    // ========================================================

    if (
      action ===
      "teamup_stopped"
    ) {
      if (
        ![
          "verified",
          "ready",
        ].includes(
          row.cutover_status,
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Verify the TOTS payment method before marking TeamUp billing as stopped.",
          },
          {
            status: 400,
          },
        );
      }

      const stoppedAt =
        nowIso();

      const { error } =
        await supabaseAdmin
          .from(
            "store_subscriptions",
          )
          .update({
            teamup_billing_active:
              false,

            teamup_billing_disabled_at:
              stoppedAt,

            /*
             * Valid DB status.
             *
             * ready =
             * payment method verified +
             * TeamUp stopped +
             * TOTS not activated yet.
             */
            cutover_status:
              "ready",

            collection_enabled:
              false,

            migration_notes:
              "TeamUp billing marked stopped by TOTS admin after external/manual cancellation. TOTS collection remains OFF until activation.",

            updated_at:
              stoppedAt,
          })
          .eq(
            "id",
            row.id,
          );

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,

        cutoverStatus:
          "ready",

        safety: {
          stripeSubscriptionCreated:
            false,

          collectionEnabled:
            false,

          teamupBillingActive:
            false,
        },
      });
    }

    // ========================================================
    // ACTION: ACTIVATE
    //
    // THIS IS THE ONLY ACTION THAT CREATES THE NEW
    // RECURRING STRIPE SUBSCRIPTION.
    //
    // Requirements:
    //
    // 1. payment method verified
    // 2. TeamUp manually stopped
    // 3. cutover_status = ready
    // 4. TeamUp DB flag = false
    // ========================================================

    if (
      row.collection_enabled
    ) {
      return NextResponse.json({
        success: true,
        alreadyActive: true,
      });
    }

    // --------------------------------------------------------
    // Must be READY
    // --------------------------------------------------------

    if (
      row.cutover_status !==
      "ready"
    ) {
      return NextResponse.json(
        {
          error:
            "The member must have a verified payment method and TeamUp billing must be marked stopped before TOTS activation.",
        },
        {
          status: 400,
        },
      );
    }

    // --------------------------------------------------------
    // TeamUp must be OFF
    // --------------------------------------------------------

    if (
      row.teamup_billing_active !==
      false
    ) {
      return NextResponse.json(
        {
          error:
            "TeamUp billing is still marked active. Stop TeamUp billing first, then mark it stopped before activating TOTS.",
        },
        {
          status: 409,
        },
      );
    }

    // --------------------------------------------------------
    // Verified customer
    // --------------------------------------------------------

    const customerId =
      text(
        (
          row.metadata ||
          {}
        )
          .tots_migration_customer_id,
      ) ||
      text(
        row.stripe_customer_id,
      );

    // --------------------------------------------------------
    // Verified payment method
    // --------------------------------------------------------

    const paymentMethodId =
      text(
        (
          row.metadata ||
          {}
        )
          .tots_migration_payment_method_id,
      );

    if (
      !customerId ||
      !paymentMethodId
    ) {
      throw new Error(
        "Verified TOTS customer/payment method is missing.",
      );
    }

    // --------------------------------------------------------
    // Product + Price
    // --------------------------------------------------------

    const priceId =
      await ensureRecurringPrice(
        row,
        accountId,
      );

    // --------------------------------------------------------
    // CREATE NEW STRIPE SUBSCRIPTION
    //
    // This is the actual cutover.
    // --------------------------------------------------------

    const subscription =
      await stripe.subscriptions.create(
        {
          customer:
            customerId,

          items: [
            {
              price:
                priceId,
            },
          ],

          default_payment_method:
            paymentMethodId,

          metadata: {
            tots_store_subscription_id:
              row.id,

            organisation_id:
              row.organisation_id,

            migration_source:
              "teamup",
          },
        },
        {
          stripeAccount:
            accountId,

          /*
           * Critical protection against duplicate
           * recurring subscriptions.
           */
          idempotencyKey:
            `mtc-cutover-${row.id}`,
        },
      );

    // --------------------------------------------------------
    // SAVE LIVE STATE
    // --------------------------------------------------------

    const activatedAt =
      nowIso();

    const { error: updateError } =
      await supabaseAdmin
        .from(
          "store_subscriptions",
        )
        .update({
          stripe_account_id:
            accountId,

          stripe_customer_id:
            customerId,

          stripe_subscription_id:
            subscription.id,

          external_subscription_id:
            subscription.id,

          billing_provider:
            "stripe",

          payment_provider:
            "stripe",

          status:
            subscription.status,

          collection_enabled:
            true,

          collection_enabled_at:
            activatedAt,

          /*
           * Valid database cutover status.
           */
          cutover_status:
            "live",

          processor_verification_status:
            "verified",

          processor_verified_at:
            activatedAt,

          legacy_billing:
            false,

          /*
           * This should already be false.
           * Explicitly preserve the safe state.
           */
          teamup_billing_active:
            false,

          metadata: {
            ...(row.metadata || {}),

            tots_migration_activated_at:
              activatedAt,

            tots_migration_subscription_id:
              subscription.id,
          },

          updated_at:
            activatedAt,
        })
        .eq(
          "id",
          row.id,
        );

    if (updateError) {
      throw updateError;
    }

    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    return NextResponse.json({
      success: true,

      stripeSubscriptionId:
        subscription.id,

      status:
        subscription.status,

      cutoverStatus:
        "live",

      safety: {
        collectionEnabled:
          true,

        teamupBillingActive:
          false,
      },
    });
  } catch (error) {
    // ========================================================
    // ERROR
    // ========================================================

    console.error(
      "[TOTS BILLING MIGRATION]",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Billing migration failed.";

    return NextResponse.json(
      {
        error:
          message ===
          "UNAUTHENTICATED"
            ? "You are not signed in."
            : message,
      },
      {
        status:
          message ===
          "UNAUTHENTICATED"
            ? 401
            : 500,
      },
    );
  }
}