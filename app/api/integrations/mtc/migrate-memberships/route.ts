import {
  timingSafeEqual,
} from "crypto";

import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

// ============================================================
// ENVIRONMENT
// ============================================================

function requireEnv(
  name: string
): string {
  const value =
    process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `${name} is missing`
    );
  }

  return value;
}

const supabaseUrl =
  requireEnv(
    "NEXT_PUBLIC_SUPABASE_URL"
  );

const supabaseServiceRoleKey =
  requireEnv(
    "SUPABASE_SERVICE_ROLE_KEY"
  );

const integrationSecret =
  requireEnv(
    "TOTS_MTC_INTEGRATION_SECRET"
  );

const mtcOrganisationId =
  requireEnv(
    "TOTS_MTC_ORGANISATION_ID"
  );

// ============================================================
// CLIENT
// ============================================================

const supabaseAdmin =
  createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

// ============================================================
// TYPES
// ============================================================

type MigrationMembershipInput = {
  /**
   * Permanent MTC user UUID.
   * Stored in metadata only.
   */
  mtcUserId?: string | null;

  /**
   * MTC membership_subscriptions UUID.
   * Stored in metadata and used as an additional duplicate guard.
   */
  mtcMembershipSubscriptionId?:
    | string
    | null;

  customerName: string;
  customerEmail: string;

  /**
   * Must correspond to store_products.external_plan_code.
   */
  planCode: string;

  /**
   * Original TeamUp membership name.
   */
  legacyMembershipName: string;

  /**
   * stripe | gocardless
   */
  billingProvider: string;

  /**
   * Existing processor customer ID from TeamUp.
   */
  externalCustomerId?:
    | string
    | null;

  /**
   * Existing recurring subscription ID if one genuinely exists.
   *
   * For the current TeamUp migration this should normally be null.
   */
  externalSubscriptionId?:
    | string
    | null;

  /**
   * Existing GoCardless mandate if known.
   */
  externalMandateId?:
    | string
    | null;

  /**
   * Exact legacy amount actually paid by this member.
   */
  unitAmountPence: number;

  currency?: string | null;

  billingInterval?: string | null;
};

type MigrationRequestBody = {
  memberships?:
    MigrationMembershipInput[];

  /**
   * Allows sending one membership directly as well.
   */
  membership?:
    MigrationMembershipInput;
};

type ProductRow = {
  id: string;
  organisation_id: string;
  name: string;
  purchase_type: string | null;
  external_system: string | null;
  external_plan_code: string | null;
};

type ExistingSubscriptionRow = {
  id: string;
  organisation_id: string;
  product_id: string | null;
  customer_email: string | null;
  billing_provider: string | null;
  external_customer_id: string | null;
  external_subscription_id: string | null;
  external_mandate_id: string | null;
  legacy_billing: boolean | null;
  legacy_membership_name: string | null;
  unit_amount_pence: number | null;
  status: string | null;
  metadata: unknown;
};

type MigrationResult = {
  customerEmail: string;
  customerName: string;
  planCode: string;
  success: boolean;
  action:
    | "created"
    | "updated"
    | "failed";
  totsSubscriptionId:
    | string
    | null;
  message: string;
};

// ============================================================
// HELPERS
// ============================================================

function cleanString(
  value: unknown
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function nullableString(
  value: unknown
) {
  const cleaned =
    cleanString(value);

  return cleaned || null;
}

function normaliseEmail(
  value: unknown
) {
  return cleanString(value)
    .toLowerCase();
}

function getErrorMessage(
  error: unknown
) {
  if (
    error instanceof Error
  ) {
    return error.message;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error
  ) {
    const message =
      (
        error as {
          message?: unknown;
        }
      ).message;

    if (
      typeof message ===
      "string"
    ) {
      return message;
    }
  }

  return "Unknown error.";
}

function normaliseProvider(
  value: unknown
) {
  const provider =
    cleanString(value)
      .toLowerCase();

  if (
    provider === "stripe"
  ) {
    return "stripe";
  }

  if (
    provider ===
      "gocardless" ||
    provider ===
      "go cardless"
  ) {
    return "gocardless";
  }

  return null;
}

function isUuid(
  value: unknown
) {
  const cleaned =
    cleanString(value);

  if (!cleaned) {
    return false;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    cleaned
  );
}

// ============================================================
// CONSTANT-TIME SECRET CHECK
// ============================================================

function secretsMatch(
  supplied: string,
  expected: string
) {
  const suppliedBuffer =
    Buffer.from(supplied);

  const expectedBuffer =
    Buffer.from(expected);

  if (
    suppliedBuffer.length !==
    expectedBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    suppliedBuffer,
    expectedBuffer
  );
}

// ============================================================
// AUTH
// ============================================================

function isAuthorised(
  req: Request
) {
  const authorization =
    req.headers.get(
      "authorization"
    );

  if (!authorization) {
    return false;
  }

  const match =
    authorization.match(
      /^Bearer\s+(.+)$/i
    );

  if (!match) {
    return false;
  }

  const suppliedSecret =
    cleanString(match[1]);

  if (!suppliedSecret) {
    return false;
  }

  return secretsMatch(
    suppliedSecret,
    integrationSecret
  );
}

// ============================================================
// VALIDATION
// ============================================================

function validateMembership(
  membership:
    MigrationMembershipInput
) {
  const errors: string[] = [];

  const email =
    normaliseEmail(
      membership.customerEmail
    );

  const customerName =
    cleanString(
      membership.customerName
    );

  const planCode =
    cleanString(
      membership.planCode
    ).toUpperCase();

  const legacyMembershipName =
    cleanString(
      membership.legacyMembershipName
    );

  const provider =
    normaliseProvider(
      membership.billingProvider
    );

  if (!email) {
    errors.push(
      "customerEmail is required."
    );
  }

  if (
    !email.includes("@")
  ) {
    errors.push(
      "customerEmail is invalid."
    );
  }

  if (!customerName) {
    errors.push(
      "customerName is required."
    );
  }

  if (!planCode) {
    errors.push(
      "planCode is required."
    );
  }

  if (!legacyMembershipName) {
    errors.push(
      "legacyMembershipName is required."
    );
  }

  if (!provider) {
    errors.push(
      "billingProvider must be stripe or gocardless."
    );
  }

  if (
    !Number.isInteger(
      membership.unitAmountPence
    ) ||
    membership.unitAmountPence <=
      0
  ) {
    errors.push(
      "unitAmountPence must be a positive integer."
    );
  }

  if (
    provider &&
    !nullableString(
      membership.externalCustomerId
    )
  ) {
    errors.push(
      `${provider} migration requires externalCustomerId.`
    );
  }

  if (
    membership.mtcUserId &&
    !isUuid(
      membership.mtcUserId
    )
  ) {
    errors.push(
      "mtcUserId must be a valid UUID when supplied."
    );
  }

  if (
    membership
      .mtcMembershipSubscriptionId &&
    !isUuid(
      membership
        .mtcMembershipSubscriptionId
    )
  ) {
    errors.push(
      "mtcMembershipSubscriptionId must be a valid UUID when supplied."
    );
  }

  return {
    errors,
    email,
    customerName,
    planCode,
    legacyMembershipName,
    provider,
  };
}

// ============================================================
// LOAD MTC PRODUCTS
// ============================================================

async function loadMtcProducts() {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from("store_products")
      .select(`
        id,
        organisation_id,
        name,
        purchase_type,
        external_system,
        external_plan_code
      `)
      .eq(
        "organisation_id",
        mtcOrganisationId
      )
      .eq(
        "external_system",
        "mtc"
      );

  if (error) {
    throw new Error(
      `Could not load MTC products: ${error.message}`
    );
  }

  const products =
    (data || []) as ProductRow[];

  return new Map<
    string,
    ProductRow
  >(
    products
      .filter(
        product =>
          cleanString(
            product.external_plan_code
          )
      )
      .map(
        product => [
          cleanString(
            product.external_plan_code
          ).toUpperCase(),
          product,
        ]
      )
  );
}

// ============================================================
// READ METADATA
// ============================================================

function getMetadataObject(
  value: unknown
): Record<string, unknown> {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return {
      ...(
        value as Record<
          string,
          unknown
        >
      ),
    };
  }

  return {};
}

// ============================================================
// FIND EXISTING SUBSCRIPTION
// ============================================================
//
// Duplicate protection is deliberately conservative.
//
// Match order:
//
// 1. MTC membership subscription UUID in metadata.
// 2. Same organisation + product + email + active/trialing +
//    legacy billing.
// 3. Same product + external processor customer ID.
//
// We do NOT use external_subscription_id as the primary identity
// because TeamUp members may not have provider-native recurring
// subscription IDs.
// ============================================================

async function findExistingSubscription(
  membership:
    MigrationMembershipInput,
  product: ProductRow,
  email: string,
  provider: string
) {
  // ----------------------------------------------------------
  // 1. MTC subscription UUID
  // ----------------------------------------------------------

  const mtcSubscriptionId =
    nullableString(
      membership
        .mtcMembershipSubscriptionId
    );

  if (mtcSubscriptionId) {
    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "store_subscriptions"
        )
        .select(`
          id,
          organisation_id,
          product_id,
          customer_email,
          billing_provider,
          external_customer_id,
          external_subscription_id,
          external_mandate_id,
          legacy_billing,
          legacy_membership_name,
          unit_amount_pence,
          status,
          metadata
        `)
        .eq(
          "organisation_id",
          mtcOrganisationId
        )
        .contains(
          "metadata",
          {
            mtc_membership_subscription_id:
              mtcSubscriptionId,
          }
        )
        .limit(2);

    if (error) {
      throw new Error(
        `TOTS duplicate lookup failed: ${error.message}`
      );
    }

    if (
      (data || []).length > 1
    ) {
      throw new Error(
        "Multiple TOTS subscriptions reference the same MTC membership subscription."
      );
    }

    if (
      data &&
      data.length === 1
    ) {
      return data[0] as
        ExistingSubscriptionRow;
    }
  }

  // ----------------------------------------------------------
  // 2. EMAIL + PRODUCT
  // ----------------------------------------------------------

  const {
    data: emailMatches,
    error: emailError,
  } =
    await supabaseAdmin
      .from(
        "store_subscriptions"
      )
      .select(`
        id,
        organisation_id,
        product_id,
        customer_email,
        billing_provider,
        external_customer_id,
        external_subscription_id,
        external_mandate_id,
        legacy_billing,
        legacy_membership_name,
        unit_amount_pence,
        status,
        metadata
      `)
      .eq(
        "organisation_id",
        mtcOrganisationId
      )
      .eq(
        "product_id",
        product.id
      )
      .ilike(
        "customer_email",
        email
      )
      .eq(
        "legacy_billing",
        true
      )
      .in(
        "status",
        [
          "active",
          "trialing",
        ]
      )
      .limit(3);

  if (emailError) {
    throw new Error(
      `TOTS email duplicate lookup failed: ${emailError.message}`
    );
  }

  if (
    (emailMatches || [])
      .length > 1
  ) {
    throw new Error(
      "Multiple active legacy TOTS subscriptions already exist for this email and product."
    );
  }

  if (
    emailMatches &&
    emailMatches.length === 1
  ) {
    return emailMatches[0] as
      ExistingSubscriptionRow;
  }

  // ----------------------------------------------------------
  // 3. PROCESSOR CUSTOMER + PRODUCT
  // ----------------------------------------------------------

  const externalCustomerId =
    nullableString(
      membership.externalCustomerId
    );

  if (externalCustomerId) {
    const {
      data: customerMatches,
      error: customerError,
    } =
      await supabaseAdmin
        .from(
          "store_subscriptions"
        )
        .select(`
          id,
          organisation_id,
          product_id,
          customer_email,
          billing_provider,
          external_customer_id,
          external_subscription_id,
          external_mandate_id,
          legacy_billing,
          legacy_membership_name,
          unit_amount_pence,
          status,
          metadata
        `)
        .eq(
          "organisation_id",
          mtcOrganisationId
        )
        .eq(
          "product_id",
          product.id
        )
        .eq(
          "external_customer_id",
          externalCustomerId
        )
        .eq(
          "billing_provider",
          provider
        )
        .limit(3);

    if (customerError) {
      throw new Error(
        `TOTS processor duplicate lookup failed: ${customerError.message}`
      );
    }

    if (
      (customerMatches || [])
        .length > 1
    ) {
      throw new Error(
        "Multiple TOTS subscriptions already use this processor customer ID for the same product."
      );
    }

    if (
      customerMatches &&
      customerMatches.length ===
        1
    ) {
      return customerMatches[0] as
        ExistingSubscriptionRow;
    }
  }

  return null;
}

// ============================================================
// MIGRATE ONE MEMBERSHIP
// ============================================================

async function migrateOne(
  membership:
    MigrationMembershipInput,
  productByPlanCode: Map<
    string,
    ProductRow
  >
): Promise<MigrationResult> {
  const validation =
    validateMembership(
      membership
    );

  const {
    email,
    customerName,
    planCode,
    legacyMembershipName,
    provider,
  } = validation;

  if (
    validation.errors.length >
    0
  ) {
    return {
      customerEmail:
        email ||
        cleanString(
          membership.customerEmail
        ),

      customerName:
        customerName ||
        cleanString(
          membership.customerName
        ),

      planCode:
        planCode ||
        cleanString(
          membership.planCode
        ),

      success: false,

      action: "failed",

      totsSubscriptionId:
        null,

      message:
        validation.errors.join(
          " "
        ),
    };
  }

  if (!provider) {
    return {
      customerEmail: email,
      customerName,
      planCode,
      success: false,
      action: "failed",
      totsSubscriptionId:
        null,
      message:
        "Unsupported billing provider.",
    };
  }

  const product =
    productByPlanCode.get(
      planCode
    );

  if (!product) {
    return {
      customerEmail: email,
      customerName,
      planCode,
      success: false,
      action: "failed",
      totsSubscriptionId:
        null,
      message:
        `No TOTS MTC product exists for plan code ${planCode}. This member was not written to TOTS.`,
    };
  }

  if (
    product.purchase_type !==
    "subscription"
  ) {
    return {
      customerEmail: email,
      customerName,
      planCode,
      success: false,
      action: "failed",
      totsSubscriptionId:
        null,
      message:
        `TOTS product "${product.name}" is not configured as a subscription.`,
    };
  }

  try {
    const existing =
      await findExistingSubscription(
        membership,
        product,
        email,
        provider
      );

    const now =
      new Date().toISOString();

    const existingMetadata =
      getMetadataObject(
        existing?.metadata
      );

    const metadata = {
      ...existingMetadata,

      source:
        "teamup_migration",

      mtc_user_id:
        nullableString(
          membership.mtcUserId
        ),

      mtc_membership_subscription_id:
        nullableString(
          membership
            .mtcMembershipSubscriptionId
        ),

      mtc_plan_code:
        planCode,
    };

    // ========================================================
    // SAFE LEGACY REPRESENTATION
    // ========================================================
    //
    // IMPORTANT:
    //
    // This does NOT create a Stripe subscription.
    // This does NOT create a GoCardless subscription.
    // This does NOT collect money.
    // This does NOT disable TeamUp billing.
    //
    // ========================================================

    const values = {
      organisation_id:
        mtcOrganisationId,

      product_id:
        product.id,

      customer_name:
        customerName,

      customer_email:
        email,

      billing_provider:
        provider,

      payment_provider:
        provider,

      external_customer_id:
        nullableString(
          membership.externalCustomerId
        ),

      external_subscription_id:
        nullableString(
          membership
            .externalSubscriptionId
        ),

      external_mandate_id:
        provider ===
        "gocardless"
          ? nullableString(
              membership
                .externalMandateId
            )
          : null,

      // ------------------------------------------------------
      // LEGACY STRIPE COMPATIBILITY FIELDS
      // ------------------------------------------------------

      stripe_customer_id:
        provider === "stripe"
          ? nullableString(
              membership
                .externalCustomerId
            )
          : null,

      stripe_subscription_id:
        provider === "stripe"
          ? nullableString(
              membership
                .externalSubscriptionId
            )
          : null,

      // ------------------------------------------------------
      // STATUS / PRICE
      // ------------------------------------------------------

      status:
        "active",

      quantity:
        1,

      currency:
        cleanString(
          membership.currency
        ).toLowerCase() ||
        "gbp",

      unit_amount_pence:
        membership
          .unitAmountPence,

      billing_interval:
        cleanString(
          membership.billingInterval
        ).toLowerCase() ||
        "month",

      // ------------------------------------------------------
      // LEGACY MIGRATION
      // ------------------------------------------------------

      legacy_billing:
        true,

      legacy_membership_name:
        legacyMembershipName,

      legacy_price:
        true,

      migrated_from:
        "teamup",

      migrated_at:
        existing
          ? undefined
          : now,

      // ------------------------------------------------------
      // PROCESSOR VERIFICATION
      // ------------------------------------------------------

      processor_verification_status:
        "unverified",

      processor_verified_at:
        null,

      // ------------------------------------------------------
      // CUTOVER SAFETY
      // ------------------------------------------------------

      cutover_status:
        "awaiting_processor",

      collection_enabled:
        false,

      collection_enabled_at:
        null,

      teamup_billing_active:
        true,

      teamup_billing_disabled_at:
        null,

      migration_notes:
        "Imported from TeamUp via the MTC migration integration. TeamUp remains responsible for billing. TOTS collection is disabled until processor verification and controlled cutover.",

      metadata,

      updated_at:
        now,
    };

    // ========================================================
    // UPDATE EXISTING
    // ========================================================

    if (existing) {
      /*
       * Do not reset migrated_at on every retry.
       */
      const {
        migrated_at:
          _ignoredMigratedAt,
        ...updateValues
      } = values;

      const {
        data,
        error,
      } =
        await supabaseAdmin
          .from(
            "store_subscriptions"
          )
          .update(
            updateValues
          )
          .eq(
            "id",
            existing.id
          )
          .eq(
            "organisation_id",
            mtcOrganisationId
          )
          .select("id")
          .single();

      if (error) {
        throw new Error(
          `TOTS subscription update failed: ${error.message}`
        );
      }

      return {
        customerEmail: email,
        customerName,
        planCode,

        success: true,

        action:
          "updated",

        totsSubscriptionId:
          data.id as string,

        message:
          `Existing TOTS legacy subscription updated for ${product.name}. TeamUp billing remains active and TOTS collection remains disabled.`,
      };
    }

    // ========================================================
    // INSERT
    // ========================================================

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "store_subscriptions"
        )
        .insert({
          ...values,

          migrated_at:
            now,

          created_at:
            now,
        })
        .select("id")
        .single();

    if (error) {
      throw new Error(
        `TOTS subscription creation failed: ${error.message}`
      );
    }

    return {
      customerEmail: email,
      customerName,
      planCode,

      success: true,

      action:
        "created",

      totsSubscriptionId:
        data.id as string,

      message:
        `TOTS legacy subscription created for ${product.name}. TeamUp billing remains active and TOTS collection remains disabled.`,
    };
  } catch (error) {
    console.error(
      `[TOTS MTC MIGRATION] ${email}:`,
      error
    );

    return {
      customerEmail: email,
      customerName,
      planCode,

      success: false,

      action:
        "failed",

      totsSubscriptionId:
        null,

      message:
        getErrorMessage(
          error
        ),
    };
  }
}

// ============================================================
// POST
// ============================================================

export async function POST(
  req: Request
) {
  try {
    // ========================================================
    // AUTHORISE
    // ========================================================

    if (!isAuthorised(req)) {
      return NextResponse.json(
        {
          error:
            "Unauthorised.",
        },
        {
          status: 401,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    // ========================================================
    // BODY
    // ========================================================

    let body:
      MigrationRequestBody;

    try {
      body =
        (await req.json()) as
          MigrationRequestBody;
    } catch {
      return NextResponse.json(
        {
          error:
            "Request body must be valid JSON.",
        },
        {
          status: 400,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    const memberships:
      MigrationMembershipInput[] =
      [];

    if (
      Array.isArray(
        body.memberships
      )
    ) {
      memberships.push(
        ...body.memberships
      );
    }

    if (body.membership) {
      memberships.push(
        body.membership
      );
    }

    if (
      memberships.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "At least one membership is required.",
        },
        {
          status: 400,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    /*
     * Protect the endpoint from accidentally receiving an
     * enormous request.
     *
     * Your current MTC migration is well below this.
     */
    if (
      memberships.length > 500
    ) {
      return NextResponse.json(
        {
          error:
            "A maximum of 500 memberships can be migrated in one request.",
        },
        {
          status: 400,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    // ========================================================
    // PRODUCTS
    // ========================================================

    const productByPlanCode =
      await loadMtcProducts();

    // ========================================================
    // PROCESS
    // ========================================================
    //
    // Intentionally sequential.
    //
    // Migration is a one-off administrative operation and
    // sequential writes reduce duplicate/race risk.
    //
    // One failed member does NOT stop the remaining members.
    // ========================================================

    const results:
      MigrationResult[] =
      [];

    for (
      const membership of
      memberships
    ) {
      const result =
        await migrateOne(
          membership,
          productByPlanCode
        );

      results.push(result);
    }

    // ========================================================
    // COUNTS
    // ========================================================

    const created =
      results.filter(
        result =>
          result.action ===
          "created"
      ).length;

    const updated =
      results.filter(
        result =>
          result.action ===
          "updated"
      ).length;

    const failed =
      results.filter(
        result =>
          result.action ===
          "failed"
      ).length;

    const succeeded =
      created + updated;

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        success:
          failed === 0,

        organisationId:
          mtcOrganisationId,

        generatedAt:
          new Date().toISOString(),

        safety: {
          paymentsChanged: 0,

          stripeSubscriptionsCreated:
            0,

          gocardlessSubscriptionsCreated:
            0,

          collectionEnabled:
            0,

          teamupBillingDisabled:
            0,
        },

        summary: {
          requested:
            memberships.length,

          succeeded,

          created,

          updated,

          failed,
        },

        results,
      },
      {
        status:
          failed === 0
            ? 200
            : 207,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "[TOTS MTC MIGRATION] Fatal error:",
      error
    );

    return NextResponse.json(
      {
        error:
          getErrorMessage(
            error
          ),
      },
      {
        status: 500,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
}