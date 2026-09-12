import {
  NextRequest,
  NextResponse,
} from "next/server";

import Stripe from "stripe";

import {
  createServerClient,
} from "@supabase/ssr";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  cookies,
} from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripeSecretKey =
  process.env.STRIPE_SECRET_KEY;

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!stripeSecretKey) {
  throw new Error(
    "STRIPE_SECRET_KEY is missing.",
  );
}

if (!supabaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL is missing.",
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.",
  );
}

if (!supabaseServiceRoleKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is missing.",
  );
}

const stripe = new Stripe(
  stripeSecretKey,
  {
    apiVersion:
      "2025-02-24.acacia",
  },
);

type LegacySubscriptionTier =
  | "standard"
  | "professional"
  | "elite";

type ModuleKey =
  | "core"
  | "clientsProjects"
  | "finance"
  | "social"
  | "email"
  | "store";

type AiTierKey =
  | "none"
  | "starter"
  | "plus"
  | "pro";

type BillingModel =
  | "legacy_tier"
  | "modular";

type BillingPackage =
  | "legacy"
  | "modular"
  | "complete";

const MAIN_MODULE_KEYS: ModuleKey[] = [
  "core",
  "clientsProjects",
  "finance",
  "social",
  "email",
  "store",
];

function cleanString(
  value: unknown,
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normaliseLegacyTier(
  value: unknown,
):
  | LegacySubscriptionTier
  | null {
  const tier =
    cleanString(
      value,
    ).toLowerCase();

  if (tier === "standard") {
    return "standard";
  }

  if (
    tier === "professional" ||
    tier === "premium"
  ) {
    return "professional";
  }

  if (tier === "elite") {
    return "elite";
  }

  return null;
}

function normaliseBillingModel(
  value: unknown,
  legacyTier:
    | LegacySubscriptionTier
    | null,
): BillingModel {
  const raw =
    cleanString(
      value,
    ).toLowerCase();

  if (raw === "modular") {
    return "modular";
  }

  if (
    raw === "legacy_tier"
  ) {
    return "legacy_tier";
  }

  return legacyTier
    ? "legacy_tier"
    : "modular";
}

function normaliseBillingPackage(
  value: unknown,
  billingModel:
    BillingModel,
): BillingPackage {
  if (
    billingModel ===
    "legacy_tier"
  ) {
    return "legacy";
  }

  return cleanString(
    value,
  ).toLowerCase() ===
    "complete"
    ? "complete"
    : "modular";
}

function normaliseAiTier(
  value: unknown,
): AiTierKey {
  const tier =
    cleanString(
      value,
    ).toLowerCase();

  if (
    tier === "starter" ||
    tier === "plus" ||
    tier === "pro"
  ) {
    return tier;
  }

  return "none";
}

function normaliseModules(
  value: unknown,
): ModuleKey[] {
  let raw: unknown[] = [];

  if (Array.isArray(value)) {
    raw = value;
  } else if (
    typeof value === "string"
  ) {
    raw =
      value
        .split(",")
        .map((item) =>
          item.trim(),
        );
  }

  return MAIN_MODULE_KEYS.filter(
    (moduleKey) =>
      raw.some(
        (item) =>
          cleanString(item) ===
          moduleKey,
      ),
  );
}

function getStripeCustomerId(
  subscription:
    Stripe.Subscription,
) {
  return typeof subscription.customer ===
    "string"
    ? subscription.customer
    : subscription.customer?.id ||
        null;
}

export async function POST(
  request: NextRequest,
) {
  try {
    const cookieStore =
      await cookies();

    const supabase =
      createServerClient(
        supabaseUrl!,
        supabaseAnonKey!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(
              cookiesToSet: {
                name: string;
                value: string;
                options?: Parameters<
                  typeof cookieStore.set
                >[2];
              }[],
            ) {
              try {
                cookiesToSet.forEach(
                  ({
                    name,
                    value,
                    options,
                  }) => {
                    cookieStore.set(
                      name,
                      value,
                      options,
                    );
                  },
                );
              } catch {
                // Safe to ignore.
              }
            },
          },
        },
      );

    const {
      data: { user },
      error: userError,
    } =
      await supabase.auth.getUser();

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          error:
            "You must be logged in.",
        },
        {
          status: 401,
        },
      );
    }

    const body =
      (await request.json()) as Record<
        string,
        unknown
      >;

    const sessionId =
      cleanString(
        body.sessionId,
      );

    if (!sessionId) {
      return NextResponse.json(
        {
          error:
            "Stripe session ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const session =
      await stripe.checkout.sessions.retrieve(
        sessionId,
      );

    if (
      cleanString(
        session.metadata
          ?.checkout_type,
      ) !==
      "existing_account"
    ) {
      return NextResponse.json(
        {
          error:
            "This is not an existing-account checkout.",
        },
        {
          status: 400,
        },
      );
    }

    const metadataUserId =
      cleanString(
        session.metadata?.user_id,
      );

    if (
      !metadataUserId ||
      metadataUserId !==
        user.id
    ) {
      return NextResponse.json(
        {
          error:
            "This checkout does not belong to the logged-in account.",
        },
        {
          status: 403,
        },
      );
    }

    const organisationId =
      cleanString(
        session.metadata
          ?.organisation_id,
      );

    if (!organisationId) {
      return NextResponse.json(
        {
          error:
            "Organisation metadata is missing.",
        },
        {
          status: 400,
        },
      );
    }

    const subscriptionId =
      typeof session.subscription ===
      "string"
        ? session.subscription
        : session.subscription?.id ||
          null;

    if (!subscriptionId) {
      return NextResponse.json(
        {
          error:
            "Stripe subscription was not found.",
        },
        {
          status: 400,
        },
      );
    }

    const subscription =
      await stripe.subscriptions.retrieve(
        subscriptionId,
      );

    if (
      subscription.status !==
        "active" &&
      subscription.status !==
        "trialing"
    ) {
      return NextResponse.json(
        {
          error:
            `Stripe subscription is ${subscription.status}.`,
        },
        {
          status: 400,
        },
      );
    }

    const subscriptionMetadata =
      subscription.metadata;
    const sessionMetadata =
      session.metadata;

    const legacyTier =
      normaliseLegacyTier(
        cleanString(
          subscriptionMetadata
            ?.subscription_tier,
        ) ||
          cleanString(
            sessionMetadata
              ?.subscription_tier,
          ),
      );

    const billingModel =
      normaliseBillingModel(
        cleanString(
          subscriptionMetadata
            ?.billing_model,
        ) ||
          cleanString(
            sessionMetadata
              ?.billing_model,
          ),
        legacyTier,
      );

    const billingPackage =
      normaliseBillingPackage(
        cleanString(
          subscriptionMetadata
            ?.billing_package,
        ) ||
          cleanString(
            sessionMetadata
              ?.billing_package,
          ),
        billingModel,
      );

    let modules =
      normaliseModules(
        cleanString(
          subscriptionMetadata
            ?.modules,
        ) ||
          cleanString(
            sessionMetadata
              ?.modules,
          ),
      );

    const requestedAiTier =
      normaliseAiTier(
        cleanString(
          subscriptionMetadata
            ?.requested_ai_tier,
        ) ||
          cleanString(
            sessionMetadata
              ?.requested_ai_tier,
          ),
      );

    let effectiveAiTier =
      normaliseAiTier(
        cleanString(
          subscriptionMetadata
            ?.effective_ai_tier,
        ) ||
          cleanString(
            sessionMetadata
              ?.effective_ai_tier,
          ),
      );

    const billingVersion =
      cleanString(
        subscriptionMetadata
          ?.billing_version,
      ) ||
      cleanString(
        sessionMetadata
          ?.billing_version,
      ) ||
      (billingModel ===
      "modular"
        ? "v2"
        : "legacy");

    const monthlyTotalPence =
      Math.max(
        0,
        Number(
          cleanString(
            subscriptionMetadata
              ?.monthly_total_pence,
          ) ||
            cleanString(
              sessionMetadata
                ?.monthly_total_pence,
            ) ||
            0,
        ) || 0,
      );

    if (
      billingModel ===
        "modular" &&
      billingPackage ===
        "complete"
    ) {
      modules =
        [...MAIN_MODULE_KEYS];
      effectiveAiTier =
        "starter";
    }

    if (
      billingModel ===
        "modular" &&
      modules.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "No TOTS-OS modules were found in the Stripe subscription.",
        },
        {
          status: 400,
        },
      );
    }

    const admin =
      createClient(
        supabaseUrl!,
        supabaseServiceRoleKey!,
        {
          auth: {
            persistSession:
              false,
            autoRefreshToken:
              false,
          },
        },
      );

    const {
      data: organisation,
      error:
        organisationLookupError,
    } =
      await admin
        .from("organisations")
        .select(
          "id,name,created_by",
        )
        .eq("id", organisationId)
        .maybeSingle();

    if (
      organisationLookupError
    ) {
      throw organisationLookupError;
    }

    if (!organisation) {
      return NextResponse.json(
        {
          error:
            "Organisation could not be found.",
        },
        {
          status: 404,
        },
      );
    }

    let organisationVerified =
      organisation.created_by ===
      user.id;

    if (!organisationVerified) {
      const {
        data: profile,
      } =
        await admin
          .from("profiles")
          .select(
            "organisation_id",
          )
          .eq("id", user.id)
          .maybeSingle();

      organisationVerified =
        profile?.organisation_id ===
        organisationId;
    }

    if (!organisationVerified) {
      const {
        data: membership,
      } =
        await admin
          .from(
            "organisation_members",
          )
          .select(
            "organisation_id",
          )
          .eq(
            "user_id",
            user.id,
          )
          .eq(
            "organisation_id",
            organisationId,
          )
          .limit(1)
          .maybeSingle();

      organisationVerified =
        membership
          ?.organisation_id ===
        organisationId;
    }

    if (!organisationVerified) {
      const {
        data: userOrganisation,
      } =
        await admin
          .from(
            "user_organisations",
          )
          .select(
            "organisation_id",
          )
          .eq(
            "user_id",
            user.id,
          )
          .eq(
            "organisation_id",
            organisationId,
          )
          .limit(1)
          .maybeSingle();

      organisationVerified =
        userOrganisation
          ?.organisation_id ===
        organisationId;
    }

    if (!organisationVerified) {
      return NextResponse.json(
        {
          error:
            "Organisation could not be verified.",
        },
        {
          status: 403,
        },
      );
    }

    const organisationPayload: Record<
      string,
      unknown
    > = {
      subscription_status:
        "active",
      access_status:
        "active",
      beta_ended_at:
        null,
      beta_grace_ends_at:
        null,
      retention_trial_ends_at:
        null,
    };

    if (
      billingModel ===
      "legacy_tier"
    ) {
      if (!legacyTier) {
        return NextResponse.json(
          {
            error:
              "Legacy subscription tier is invalid.",
          },
          {
            status: 400,
          },
        );
      }

      organisationPayload.subscription_tier =
        legacyTier;
      organisationPayload.billing_model =
        "legacy_tier";
      organisationPayload.billing_package =
        "legacy";
      organisationPayload.billing_version =
        "legacy";
    } else {
      organisationPayload.billing_model =
        "modular";
      organisationPayload.billing_package =
        billingPackage;
      organisationPayload.clarity_ai_tier =
        effectiveAiTier;
      organisationPayload.billing_version =
        billingVersion;
      organisationPayload.store_enabled =
        modules.includes("store");
    }

    const {
      error:
        organisationUpdateError,
    } =
      await admin
        .from("organisations")
        .update(
          organisationPayload,
        )
        .eq(
          "id",
          organisationId,
        );

    if (
      organisationUpdateError
    ) {
      throw organisationUpdateError;
    }

    if (
      billingModel ===
      "modular"
    ) {
      const now =
        new Date().toISOString();

      const {
        data: currentRows,
        error: lookupError,
      } =
        await admin
          .from(
            "organisation_modules",
          )
          .select(
            "id,module_key",
          )
          .eq(
            "organisation_id",
            organisationId,
          );

      if (lookupError) {
        throw lookupError;
      }

      const idsToCancel =
        (currentRows || [])
          .filter(
            (row) =>
              !modules.includes(
                row.module_key as
                  ModuleKey,
              ),
          )
          .map((row) => row.id);

      if (
        idsToCancel.length > 0
      ) {
        const {
          error: cancelError,
        } =
          await admin
            .from(
              "organisation_modules",
            )
            .update({
              status:
                "cancelled",
              cancelled_at:
                now,
              updated_at:
                now,
            })
            .in(
              "id",
              idsToCancel,
            );

        if (cancelError) {
          throw cancelError;
        }
      }

      const {
        error: upsertError,
      } =
        await admin
          .from(
            "organisation_modules",
          )
          .upsert(
            modules.map(
              (moduleKey) => ({
                organisation_id:
                  organisationId,
                module_key:
                  moduleKey,
                status:
                  "active",
                cancelled_at:
                  null,
                updated_at:
                  now,
              }),
            ),
            {
              onConflict:
                "organisation_id,module_key",
            },
          );

      if (upsertError) {
        throw upsertError;
      }
    }

    const profilePayload: Record<
      string,
      unknown
    > = {
      is_subscribed: true,
    };

    if (
      billingModel ===
        "legacy_tier" &&
      legacyTier
    ) {
      profilePayload.subscription_tier =
        legacyTier;
    }

    await admin
      .from("profiles")
      .update(profilePayload)
      .eq("id", user.id);

    const stripeCustomerId =
      getStripeCustomerId(
        subscription,
      );

    const {
      data:
        subscriptionRows,
    } =
      await admin
        .from("subscriptions")
        .select("id")
        .eq(
          "stripe_subscription_id",
          subscriptionId,
        )
        .limit(1);

    const existingRow =
      subscriptionRows?.[0];

    if (existingRow?.id) {
      await admin
        .from("subscriptions")
        .update({
          organisation_id:
            organisationId,
          stripe_customer_id:
            stripeCustomerId,
          active: true,
          status:
            subscription.status,
        })
        .eq(
          "id",
          existingRow.id,
        );
    } else {
      const {
        error: insertError,
      } =
        await admin
          .from("subscriptions")
          .insert({
            organisation_id:
              organisationId,
            stripe_subscription_id:
              subscriptionId,
            stripe_customer_id:
              stripeCustomerId,
            active: true,
            status:
              subscription.status,
          });

      if (insertError) {
        console.error(
          "Subscription record insert failed:",
          insertError,
        );
      }
    }

    return NextResponse.json({
      success: true,
      organisationId:
        organisation.id,
      organisationName:
        organisation.name,
      subscriptionId,
      subscriptionStatus:
        subscription.status,
      billingModel,
      package:
        billingPackage,
      modules,
      aiTier:
        effectiveAiTier,
      requestedAiTier,
      monthlyTotalPence,
      billingVersion,
      tier:
        legacyTier,
    });
  } catch (error: unknown) {
    console.error(
      "[STRIPE VERIFY] Failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to verify your subscription.",
      },
      {
        status: 500,
      },
    );
  }
}
