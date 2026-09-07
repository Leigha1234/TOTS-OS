import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

import Stripe from "stripe";

import {
  Resend,
} from "resend";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

// ============================================================
// ENVIRONMENT
// ============================================================

const rawSupabaseUrl =
  process.env
    .NEXT_PUBLIC_SUPABASE_URL
    ?.trim();

const rawSupabaseServiceRoleKey =
  process.env
    .SUPABASE_SERVICE_ROLE_KEY
    ?.trim();

const rawStripeSecretKey =
  process.env
    .STRIPE_SECRET_KEY
    ?.trim();

const rawStorePriceId =
  process.env
    .STRIPE_STORE_ADDON_PRICE_ID
    ?.trim();

const rawStoreSubscriptionWebhookSecret =
  process.env
    .STRIPE_STORE_SUBSCRIPTION_WEBHOOK_SECRET
    ?.trim();

const rawResendApiKey =
  process.env
    .RESEND_API_KEY
    ?.trim();

const rawSiteUrl =
  process.env
    .NEXT_PUBLIC_SITE_URL
    ?.trim() ||
  process.env
    .SITE_URL
    ?.trim();

// ============================================================
// VALIDATE REQUIRED ENVIRONMENT
// ============================================================

if (
  !rawSupabaseUrl
) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL is missing"
  );
}

if (
  !rawSupabaseServiceRoleKey
) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is missing"
  );
}

if (
  !rawStripeSecretKey
) {
  throw new Error(
    "STRIPE_SECRET_KEY is missing"
  );
}

if (
  !rawStorePriceId
) {
  throw new Error(
    "STRIPE_STORE_ADDON_PRICE_ID is missing"
  );
}

const supabaseUrl:
  string =
  rawSupabaseUrl;

const supabaseServiceRoleKey:
  string =
  rawSupabaseServiceRoleKey;

const stripeSecretKey:
  string =
  rawStripeSecretKey;

const storePriceId:
  string =
  rawStorePriceId;

// ============================================================
// OPTIONAL / ROUTE-HANDLED ENVIRONMENT
// ============================================================

const storeSubscriptionWebhookSecret:
  string | null =
  rawStoreSubscriptionWebhookSecret ||
  null;

const resendApiKey:
  string | null =
  rawResendApiKey ||
  null;

const siteUrl =
  (
    rawSiteUrl ||
    "https://www.tots-os.co.uk"
  ).replace(
    /\/$/,
    ""
  );

// ============================================================
// CLIENTS
// ============================================================

const supabaseAdmin =
  createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken:
          false,

        persistSession:
          false,
      },
    }
  );

const stripe =
  new Stripe(
    stripeSecretKey
  );

const resend =
  resendApiKey
    ? new Resend(
        resendApiKey
      )
    : null;

// ============================================================
// TYPES
// ============================================================

type OrganisationLookupRow = {
  id:
    string;

  name?:
    string | null;

  store_stripe_customer_id?:
    string | null;

  store_stripe_subscription_id?:
    string | null;

  store_subscription_status?:
    string | null;
};

// ============================================================
// HELPERS
// ============================================================

function cleanString(
  value:
    unknown
) {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value.trim();
}

// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(
  value:
    string
) {
  return value
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}

// ============================================================
// TIMESTAMP -> ISO
// ============================================================

function timestampToIso(
  timestamp:
    number |
    null |
    undefined
) {
  if (
    typeof timestamp !==
      "number" ||
    !Number.isFinite(
      timestamp
    ) ||
    timestamp <=
      0
  ) {
    return null;
  }

  return new Date(
    timestamp *
      1000
  ).toISOString();
}

// ============================================================
// CUSTOMER ID
// ============================================================

function getCustomerId(
  value:
    | string
    | Stripe.Customer
    | Stripe.DeletedCustomer
    | null
    | undefined
) {
  if (
    typeof value ===
    "string"
  ) {
    return (
      cleanString(
        value
      ) ||
      null
    );
  }

  if (
    value &&
    typeof value ===
      "object" &&
    "id" in
      value
  ) {
    return (
      cleanString(
        value.id
      ) ||
      null
    );
  }

  return null;
}

// ============================================================
// SUBSCRIPTION ID
// ============================================================

function getSubscriptionId(
  value:
    | string
    | Stripe.Subscription
    | null
    | undefined
) {
  if (
    typeof value ===
    "string"
  ) {
    return (
      cleanString(
        value
      ) ||
      null
    );
  }

  if (
    value &&
    typeof value ===
      "object" &&
    "id" in
      value
  ) {
    return (
      cleanString(
        value.id
      ) ||
      null
    );
  }

  return null;
}

// ============================================================
// SUBSCRIPTION PRICE IDS
// ============================================================

function getSubscriptionPriceIds(
  subscription:
    Stripe.Subscription
) {
  return subscription
    .items
    .data
    .map(
      (
        item
      ) =>
        cleanString(
          item
            .price
            ?.id
        )
    )
    .filter(
      (
        priceId
      ):
        priceId is string =>
          Boolean(
            priceId
          )
    );
}

// ============================================================
// PRICE CHECK
//
// SECURITY CRITICAL:
//
// The Store is only enabled when Stripe confirms the live
// subscription contains STRIPE_STORE_ADDON_PRICE_ID.
// ============================================================

function subscriptionHasStorePrice(
  subscription:
    Stripe.Subscription
) {
  return getSubscriptionPriceIds(
    subscription
  ).includes(
    storePriceId
  );
}

// ============================================================
// ACTUAL STORE PRICE
// ============================================================

function getStorePriceId(
  subscription:
    Stripe.Subscription
) {
  const item =
    subscription
      .items
      .data
      .find(
        (
          subscriptionItem
        ) =>
          cleanString(
            subscriptionItem
              .price
              ?.id
          ) ===
          storePriceId
      );

  return (
    cleanString(
      item
        ?.price
        ?.id
    ) ||
    null
  );
}

// ============================================================
// STORE ACCESS
//
// ONLY:
//
// active + correct Store price
//
// OR:
//
// trialing + correct Store price
//
// unlocks Store.
// ============================================================

function subscriptionAllowsStoreAccess(
  subscription:
    Stripe.Subscription
) {
  const validStatus =
    [
      "active",
      "trialing",
    ].includes(
      subscription.status
    );

  return (
    validStatus &&
    subscriptionHasStorePrice(
      subscription
    )
  );
}

// ============================================================
// STORE TRIAL
// ============================================================

function isStoreTrial(
  subscription:
    Stripe.Subscription
) {
  const subscriptionType =
    cleanString(
      subscription
        .metadata
        ?.subscription_type
    );

  const trialType =
    cleanString(
      subscription
        .metadata
        ?.trial_type
    );

  return (
    subscriptionType ===
      "store_addon" &&
    (
      trialType ===
        "store_7_day_trial" ||
      Boolean(
        subscription
          .trial_end
      )
    )
  );
}

// ============================================================
// TRIAL END
// ============================================================

function getTrialEnd(
  subscription:
    Stripe.Subscription
) {
  return timestampToIso(
    subscription
      .trial_end
  );
}

// ============================================================
// CURRENT PERIOD END
// ============================================================

function getCurrentPeriodEnd(
  subscription:
    Stripe.Subscription
) {
  const subscriptionWithPeriod =
    subscription as
      Stripe.Subscription & {
        current_period_end?:
          number |
          null;
      };

  return timestampToIso(
    subscriptionWithPeriod
      .current_period_end
  );
}

// ============================================================
// ORGANISATION FROM METADATA
// ============================================================

function getOrganisationIdFromMetadata(
  metadata:
    Stripe.Metadata |
    null |
    undefined
) {
  return (
    cleanString(
      metadata
        ?.organisation_id
    ) ||
    null
  );
}

// ============================================================
// FIND ORGANISATION BY CUSTOMER
// ============================================================

async function findOrganisationByCustomerId(
  customerId:
    string
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "organisations"
      )
      .select(
        `
          id,
          name,
          store_stripe_customer_id,
          store_stripe_subscription_id,
          store_subscription_status
        `
      )
      .eq(
        "store_stripe_customer_id",
        customerId
      )
      .limit(
        1
      )
      .maybeSingle();

  if (
    error
  ) {
    throw error;
  }

  return data as
    | OrganisationLookupRow
    | null;
}

// ============================================================
// FIND ORGANISATION BY SUBSCRIPTION
// ============================================================

async function findOrganisationBySubscriptionId(
  subscriptionId:
    string
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "organisations"
      )
      .select(
        `
          id,
          name,
          store_stripe_customer_id,
          store_stripe_subscription_id,
          store_subscription_status
        `
      )
      .eq(
        "store_stripe_subscription_id",
        subscriptionId
      )
      .limit(
        1
      )
      .maybeSingle();

  if (
    error
  ) {
    throw error;
  }

  return data as
    | OrganisationLookupRow
    | null;
}

// ============================================================
// RESOLVE ORGANISATION
//
// Priority:
//
// 1. Stripe metadata
// 2. Known subscription ID
// 3. Known Stripe customer ID
// ============================================================

async function resolveOrganisationId({
  metadataOrganisationId,
  customerId,
  subscriptionId,
}: {
  metadataOrganisationId?:
    string |
    null;

  customerId?:
    string |
    null;

  subscriptionId?:
    string |
    null;
}) {
  if (
    metadataOrganisationId
  ) {
    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "organisations"
        )
        .select(
          "id"
        )
        .eq(
          "id",
          metadataOrganisationId
        )
        .maybeSingle();

    if (
      error
    ) {
      throw error;
    }

    if (
      data?.id
    ) {
      return String(
        data.id
      );
    }
  }

  if (
    subscriptionId
  ) {
    const organisation =
      await findOrganisationBySubscriptionId(
        subscriptionId
      );

    if (
      organisation?.id
    ) {
      return String(
        organisation.id
      );
    }
  }

  if (
    customerId
  ) {
    const organisation =
      await findOrganisationByCustomerId(
        customerId
      );

    if (
      organisation?.id
    ) {
      return String(
        organisation.id
      );
    }
  }

  return null;
}

// ============================================================
// LOAD ORGANISATION NAME
// ============================================================

async function getOrganisationName(
  organisationId:
    string
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "organisations"
      )
      .select(
        "name"
      )
      .eq(
        "id",
        organisationId
      )
      .maybeSingle();

  if (
    error
  ) {
    console.warn(
      "[STORE EMAIL] Could not load organisation name:",
      error
    );

    return "your business";
  }

  return (
    cleanString(
      data?.name
    ) ||
    "your business"
  );
}

// ============================================================
// CUSTOMER EMAIL
//
// Priority:
//
// 1. subscription metadata
// 2. Stripe customer email
// ============================================================

async function getSubscriptionEmail(
  subscription:
    Stripe.Subscription
) {
  const metadataEmail =
    cleanString(
      subscription
        .metadata
        ?.customer_email
    ).toLowerCase();

  if (
    metadataEmail
  ) {
    return metadataEmail;
  }

  const customerId =
    getCustomerId(
      subscription.customer
    );

  if (
    !customerId
  ) {
    return null;
  }

  try {
    const customer =
      await stripe
        .customers
        .retrieve(
          customerId
        );

    if (
      "deleted" in
        customer &&
      customer.deleted
    ) {
      return null;
    }

    const email =
      cleanString(
        customer.email
      ).toLowerCase();

    return (
      email ||
      null
    );
  } catch (
    error
  ) {
    console.warn(
      "[STORE EMAIL] Could not retrieve Stripe customer:",
      error
    );

    return null;
  }
}

// ============================================================
// TRIAL EMAIL SENT?
//
// We store the marker in live Stripe subscription metadata.
//
// This means webhook retries will normally see that the email
// has already been sent and will not intentionally resend it.
// ============================================================

function hasTrialEndEmailBeenSent(
  subscription:
    Stripe.Subscription
) {
  return (
    cleanString(
      subscription
        .metadata
        ?.trial_end_email_sent
    ) ===
    "true"
  );
}

// ============================================================
// MARK TRIAL EMAIL SENT
// ============================================================

async function markTrialEndEmailSent(
  subscriptionId:
    string
) {
  await stripe
    .subscriptions
    .update(
      subscriptionId,
      {
        metadata: {
          trial_end_email_sent:
            "true",

          trial_end_email_sent_at:
            new Date()
              .toISOString(),
        },
      }
    );
}

// ============================================================
// CONTINUE URL
// ============================================================

function getContinueStoreUrl() {
  return `${siteUrl}/store`;
}

// ============================================================
// EMAIL HTML - ACTIVE AFTER TRIAL
// ============================================================

function buildTrialConvertedEmail({
  organisationName,
}: {
  organisationName:
    string;
}) {
  const safeOrganisationName =
    escapeHtml(
      organisationName
    );

  const continueUrl =
    getContinueStoreUrl();

  return `
<!doctype html>
<html>
  <body
    style="
      margin:0;
      padding:0;
      background:#f7f5f2;
      font-family:Arial,Helvetica,sans-serif;
      color:#272522;
    "
  >
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
      style="
        background:#f7f5f2;
        padding:40px 20px;
      "
    >
      <tr>
        <td align="center">
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="
              max-width:620px;
              background:#ffffff;
              border-radius:18px;
              overflow:hidden;
            "
          >
            <tr>
              <td
                style="
                  background:#242321;
                  padding:42px 42px 38px;
                  text-align:center;
                  color:#ffffff;
                "
              >
                <div
                  style="
                    font-size:13px;
                    letter-spacing:2px;
                    text-transform:uppercase;
                    opacity:.75;
                    margin-bottom:12px;
                  "
                >
                  TOTS-OS STORE
                </div>

                <h1
                  style="
                    margin:0;
                    font-size:34px;
                    line-height:1.15;
                  "
                >
                  Your Store trial has ended 🤍
                </h1>
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding:42px;
                "
              >
                <p
                  style="
                    margin:0 0 20px;
                    font-size:17px;
                    line-height:1.7;
                  "
                >
                  Hi ${safeOrganisationName},
                </p>

                <p
                  style="
                    margin:0 0 20px;
                    font-size:17px;
                    line-height:1.7;
                  "
                >
                  Your 7-day TOTS-OS Store trial has now finished.
                </p>

                <p
                  style="
                    margin:0 0 20px;
                    font-size:17px;
                    line-height:1.7;
                  "
                >
                  Your Store subscription is now active at
                  <strong>£39/month</strong>, so you can carry on
                  managing your products, orders and customers
                  directly from TOTS-OS.
                </p>

                <div
                  style="
                    margin:30px 0;
                    padding:22px;
                    background:#eef1ea;
                    border-radius:14px;
                  "
                >
                  <strong>
                    Nothing you need to do.
                  </strong>

                  <div
                    style="
                      margin-top:8px;
                      line-height:1.6;
                    "
                  >
                    Your Store remains live and connected to
                    your TOTS-OS account.
                  </div>
                </div>

                <table
                  role="presentation"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  style="
                    margin:30px 0;
                  "
                >
                  <tr>
                    <td
                      style="
                        background:#242321;
                        border-radius:10px;
                      "
                    >
                      <a
                        href="${continueUrl}"
                        style="
                          display:inline-block;
                          padding:15px 24px;
                          color:#ffffff;
                          text-decoration:none;
                          font-weight:bold;
                          font-size:15px;
                        "
                      >
                        GO TO YOUR STORE →
                      </a>
                    </td>
                  </tr>
                </table>

                <p
                  style="
                    margin:35px 0 0;
                    font-size:15px;
                    line-height:1.7;
                    color:#68635e;
                  "
                >
                  Sam &amp; Leigha 🤍
                  <br>
                  TOTS-OS
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
}

// ============================================================
// EMAIL HTML - TRIAL ENDED / NOT ACTIVE
// ============================================================

function buildTrialEndedEmail({
  organisationName,
}: {
  organisationName:
    string;
}) {
  const safeOrganisationName =
    escapeHtml(
      organisationName
    );

  const continueUrl =
    getContinueStoreUrl();

  return `
<!doctype html>
<html>
  <body
    style="
      margin:0;
      padding:0;
      background:#f7f5f2;
      font-family:Arial,Helvetica,sans-serif;
      color:#272522;
    "
  >
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
      style="
        background:#f7f5f2;
        padding:40px 20px;
      "
    >
      <tr>
        <td align="center">
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="
              max-width:620px;
              background:#ffffff;
              border-radius:18px;
              overflow:hidden;
            "
          >
            <tr>
              <td
                style="
                  background:#242321;
                  padding:42px 42px 38px;
                  text-align:center;
                  color:#ffffff;
                "
              >
                <div
                  style="
                    font-size:13px;
                    letter-spacing:2px;
                    text-transform:uppercase;
                    opacity:.75;
                    margin-bottom:12px;
                  "
                >
                  TOTS-OS STORE
                </div>

                <h1
                  style="
                    margin:0;
                    font-size:34px;
                    line-height:1.15;
                  "
                >
                  Your Store trial has ended 🤍
                </h1>
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding:42px;
                "
              >
                <p
                  style="
                    margin:0 0 20px;
                    font-size:17px;
                    line-height:1.7;
                  "
                >
                  Hi ${safeOrganisationName},
                </p>

                <p
                  style="
                    margin:0 0 20px;
                    font-size:17px;
                    line-height:1.7;
                  "
                >
                  Your 7-day TOTS-OS Store trial has now finished.
                </p>

                <p
                  style="
                    margin:0 0 20px;
                    font-size:17px;
                    line-height:1.7;
                  "
                >
                  We hope you've had a chance to see what it's
                  like having your products, orders and customers
                  connected directly to your business OS.
                </p>

                <p
                  style="
                    margin:0 0 26px;
                    font-size:17px;
                    line-height:1.7;
                  "
                >
                  Want to keep using it? Continue with
                  TOTS-OS Store for
                  <strong>£39/month</strong>.
                </p>

                <table
                  role="presentation"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  style="
                    margin:30px 0;
                  "
                >
                  <tr>
                    <td
                      style="
                        background:#242321;
                        border-radius:10px;
                      "
                    >
                      <a
                        href="${continueUrl}"
                        style="
                          display:inline-block;
                          padding:15px 24px;
                          color:#ffffff;
                          text-decoration:none;
                          font-weight:bold;
                          font-size:15px;
                        "
                      >
                        CONTINUE WITH TOTS-OS STORE →
                      </a>
                    </td>
                  </tr>
                </table>

                <p
                  style="
                    margin:25px 0 0;
                    font-size:15px;
                    line-height:1.7;
                    color:#68635e;
                  "
                >
                  If you don't want to continue, there's nothing
                  else you need to do.
                </p>

                <p
                  style="
                    margin:35px 0 0;
                    font-size:15px;
                    line-height:1.7;
                    color:#68635e;
                  "
                >
                  Sam &amp; Leigha 🤍
                  <br>
                  TOTS-OS
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
}

// ============================================================
// SEND TRIAL END EMAIL
// ============================================================

async function sendTrialEndEmail(
  subscription:
    Stripe.Subscription
) {
  // ==========================================================
  // ONLY STORE TRIALS
  // ==========================================================

  if (
    !isStoreTrial(
      subscription
    )
  ) {
    return;
  }

  // ==========================================================
  // RESEND CONFIG
  // ==========================================================

  if (
    !resend
  ) {
    throw new Error(
      "RESEND_API_KEY is missing. Store trial email could not be sent."
    );
  }

  // ==========================================================
  // GET LIVE SUBSCRIPTION
  //
  // This is important because the Stripe event itself is an
  // immutable snapshot. The live subscription may already have
  // our email-sent metadata from a previous webhook attempt.
  // ==========================================================

  const liveSubscription =
    await stripe
      .subscriptions
      .retrieve(
        subscription.id
      );

  // ==========================================================
  // DUPLICATE PROTECTION
  // ==========================================================

  if (
    hasTrialEndEmailBeenSent(
      liveSubscription
    )
  ) {
    console.log(
      "[STORE EMAIL] Trial-end email already sent:",
      {
        subscriptionId:
          subscription.id,
      }
    );

    return;
  }

  // ==========================================================
  // EMAIL ADDRESS
  // ==========================================================

  const email =
    await getSubscriptionEmail(
      liveSubscription
    );

  if (
    !email
  ) {
    console.warn(
      "[STORE EMAIL] Trial ended but no customer email could be found:",
      {
        subscriptionId:
          liveSubscription.id,
      }
    );

    return;
  }

  // ==========================================================
  // ORGANISATION
  // ==========================================================

  const customerId =
    getCustomerId(
      liveSubscription.customer
    );

  const organisationId =
    await resolveOrganisationId({
      metadataOrganisationId:
        getOrganisationIdFromMetadata(
          liveSubscription.metadata
        ),

      customerId,

      subscriptionId:
        liveSubscription.id,
    });

  if (
    !organisationId
  ) {
    throw new Error(
      `Could not resolve organisation for Store trial email ${liveSubscription.id}.`
    );
  }

  const organisationName =
    await getOrganisationName(
      organisationId
    );

  // ==========================================================
  // ACTIVE AFTER TRIAL?
  // ==========================================================

  const continued =
    liveSubscription.status ===
      "active" &&
    subscriptionHasStorePrice(
      liveSubscription
    );

  const subject =
    continued
      ? "Your TOTS-OS Store trial has ended 🤍"
      : "Your TOTS-OS Store trial has ended";

  const html =
    continued
      ? buildTrialConvertedEmail({
          organisationName,
        })
      : buildTrialEndedEmail({
          organisationName,
        });

  const text =
    continued
      ? `
Your TOTS-OS Store trial has ended.

Your 7-day Store trial has now finished and your Store subscription is active at £39/month.

Your Store remains live and connected to your TOTS-OS account.

Go to your Store:
${getContinueStoreUrl()}

Sam & Leigha
TOTS-OS
      `.trim()
      : `
Your TOTS-OS Store trial has ended.

Your 7-day Store trial has now finished.

Want to keep using your Store? Continue with TOTS-OS Store for £39/month.

Continue here:
${getContinueStoreUrl()}

Sam & Leigha
TOTS-OS
      `.trim();

  // ==========================================================
  // SEND
  // ==========================================================

  const {
    data,
    error,
  } =
    await resend
      .emails
      .send({
        from:
          "TOTS-OS <hello@tots-os.co.uk>",

        to: [
          email,
        ],

        subject,

        html,

        text,
      });

  if (
    error
  ) {
    console.error(
      "[STORE EMAIL] Resend rejected trial-end email:",
      {
        email,
        subscriptionId:
          liveSubscription.id,
        error,
      }
    );

    throw new Error(
      error.message ||
      "Resend rejected Store trial-end email."
    );
  }

  if (
    !data?.id
  ) {
    throw new Error(
      "Resend did not return an email ID for Store trial-end email."
    );
  }

  console.log(
    "[STORE EMAIL] Trial-end email accepted by Resend:",
    {
      emailId:
        data.id,

      email,

      organisationId,

      subscriptionId:
        liveSubscription.id,

      continued,
    }
  );

  // ==========================================================
  // MARK AS SENT
  // ==========================================================

  await markTrialEndEmailSent(
    liveSubscription.id
  );
}

// ============================================================
// UPDATE STORE ACCESS
// ============================================================

async function updateStoreAccess({
  organisationId,
  enabled,
  status,
  customerId,
  subscriptionId,
  priceId,
  currentPeriodEnd,
  cancelAtPeriodEnd,
}: {
  organisationId:
    string;

  enabled:
    boolean;

  status:
    string |
    null;

  customerId:
    string |
    null;

  subscriptionId:
    string |
    null;

  priceId:
    string |
    null;

  currentPeriodEnd:
    string |
    null;

  cancelAtPeriodEnd:
    boolean;
}) {
  const now =
    new Date()
      .toISOString();

  const payload:
    Record<
      string,
      unknown
    > =
    {
      store_enabled:
        enabled,

      store_subscription_status:
        status,

      store_stripe_customer_id:
        customerId,

      store_stripe_subscription_id:
        subscriptionId,

      store_price_id:
        priceId,

      store_current_period_end:
        currentPeriodEnd,

      store_cancel_at_period_end:
        cancelAtPeriodEnd,
    };

  if (
    enabled
  ) {
    payload.store_enabled_at =
      now;
  }

  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "organisations"
      )
      .update(
        payload
      )
      .eq(
        "id",
        organisationId
      );

  if (
    error
  ) {
    console.error(
      "[STORE SUBSCRIPTION WEBHOOK] Organisation update failed:",
      {
        organisationId,
        error,
      }
    );

    throw error;
  }

  console.log(
    "[STORE SUBSCRIPTION WEBHOOK] Access updated:",
    {
      organisationId,
      enabled,
      status,
      customerId,
      subscriptionId,
      priceId,
      currentPeriodEnd,
      cancelAtPeriodEnd,
    }
  );
}

// ============================================================
// SYNC SUBSCRIPTION
// ============================================================

async function syncSubscription(
  subscription:
    Stripe.Subscription
) {
  const subscriptionId =
    subscription.id;

  const customerId =
    getCustomerId(
      subscription.customer
    );

  const metadataOrganisationId =
    getOrganisationIdFromMetadata(
      subscription.metadata
    );

  const organisationId =
    await resolveOrganisationId({
      metadataOrganisationId,

      customerId,

      subscriptionId,
    });

  if (
    !organisationId
  ) {
    throw new Error(
      `Could not find TOTS organisation for Store subscription ${subscription.id}.`
    );
  }

  const hasCorrectPrice =
    subscriptionHasStorePrice(
      subscription
    );

  const actualPriceIds =
    getSubscriptionPriceIds(
      subscription
    );

  if (
    !hasCorrectPrice
  ) {
    console.warn(
      "[STORE SUBSCRIPTION WEBHOOK] Subscription does not contain Store price:",
      {
        organisationId,

        subscriptionId:
          subscription.id,

        expectedPriceId:
          storePriceId,

        actualPriceIds,
      }
    );
  }

  const enabled =
    subscriptionAllowsStoreAccess(
      subscription
    );

  const actualPriceId =
    getStorePriceId(
      subscription
    );

  await updateStoreAccess({
    organisationId,

    enabled,

    status:
      subscription.status,

    customerId,

    subscriptionId,

    priceId:
      hasCorrectPrice
        ? actualPriceId
        : null,

    currentPeriodEnd:
      getCurrentPeriodEnd(
        subscription
      ),

    cancelAtPeriodEnd:
      subscription
        .cancel_at_period_end ===
      true,
  });

  return {
    organisationId,

    enabled,

    correctProduct:
      hasCorrectPrice,
  };
}

// ============================================================
// CHECKOUT COMPLETED
// ============================================================

async function handleCheckoutCompleted(
  session:
    Stripe.Checkout.Session
) {
  const subscriptionType =
    cleanString(
      session.metadata
        ?.subscription_type
    );

  if (
    subscriptionType !==
    "store_addon"
  ) {
    console.log(
      "[STORE SUBSCRIPTION WEBHOOK] Checkout ignored because it is not Store add-on:",
      session.id
    );

    return;
  }

  const metadataPriceId =
    cleanString(
      session.metadata
        ?.store_price_id
    );

  if (
    metadataPriceId &&
    metadataPriceId !==
      storePriceId
  ) {
    throw new Error(
      `Store checkout price mismatch for session ${session.id}.`
    );
  }

  const subscriptionId =
    getSubscriptionId(
      session.subscription
    );

  if (
    !subscriptionId
  ) {
    throw new Error(
      `Checkout ${session.id} did not contain a subscription ID.`
    );
  }

  const subscription =
    await stripe
      .subscriptions
      .retrieve(
        subscriptionId
      );

  if (
    !subscriptionHasStorePrice(
      subscription
    )
  ) {
    throw new Error(
      `Subscription ${subscription.id} does not contain the configured Store price.`
    );
  }

  const checkoutOrganisationId =
    getOrganisationIdFromMetadata(
      session.metadata
    );

  const subscriptionOrganisationId =
    getOrganisationIdFromMetadata(
      subscription.metadata
    );

  if (
    checkoutOrganisationId &&
    subscriptionOrganisationId &&
    checkoutOrganisationId !==
      subscriptionOrganisationId
  ) {
    throw new Error(
      `Organisation metadata mismatch for Store checkout ${session.id}.`
    );
  }

  if (
    subscription.status ===
    "trialing"
  ) {
    console.log(
      "[STORE SUBSCRIPTION WEBHOOK] 7-day Store trial started:",
      {
        checkoutSessionId:
          session.id,

        subscriptionId:
          subscription.id,

        organisationId:
          checkoutOrganisationId ||
          subscriptionOrganisationId,

        trialEnd:
          getTrialEnd(
            subscription
          ),
      }
    );
  }

  await syncSubscription(
    subscription
  );
}

// ============================================================
// INVOICE SUBSCRIPTION ID
// ============================================================

function getInvoiceSubscriptionId(
  invoice:
    Stripe.Invoice
) {
  const invoiceWithSubscription =
    invoice as
      Stripe.Invoice & {
        subscription?:
          | string
          | Stripe.Subscription
          | null;
      };

  return getSubscriptionId(
    invoiceWithSubscription
      .subscription
  );
}

// ============================================================
// INVOICE PAYMENT FAILED
// ============================================================

async function handleInvoicePaymentFailed(
  invoice:
    Stripe.Invoice
) {
  const customerId =
    getCustomerId(
      invoice.customer
    );

  const subscriptionId =
    getInvoiceSubscriptionId(
      invoice
    );

  if (
    subscriptionId
  ) {
    try {
      const subscription =
        await stripe
          .subscriptions
          .retrieve(
            subscriptionId
          );

      if (
        subscriptionHasStorePrice(
          subscription
        )
      ) {
        await syncSubscription(
          subscription
        );

        return;
      }
    } catch (
      error
    ) {
      console.warn(
        "[STORE SUBSCRIPTION WEBHOOK] Could not retrieve failed invoice subscription:",
        error
      );
    }
  }

  if (
    !customerId
  ) {
    return;
  }

  const organisation =
    await findOrganisationByCustomerId(
      customerId
    );

  if (
    !organisation?.id
  ) {
    return;
  }

  await updateStoreAccess({
    organisationId:
      String(
        organisation.id
      ),

    enabled:
      false,

    status:
      "past_due",

    customerId,

    subscriptionId:
      cleanString(
        organisation
          .store_stripe_subscription_id
      ) ||
      null,

    priceId:
      storePriceId,

    currentPeriodEnd:
      null,

    cancelAtPeriodEnd:
      false,
  });
}

// ============================================================
// INVOICE PAID
// ============================================================

async function handleInvoicePaid(
  invoice:
    Stripe.Invoice
) {
  const subscriptionId =
    getInvoiceSubscriptionId(
      invoice
    );

  if (
    !subscriptionId
  ) {
    return;
  }

  const subscription =
    await stripe
      .subscriptions
      .retrieve(
        subscriptionId
      );

  if (
    !subscriptionHasStorePrice(
      subscription
    )
  ) {
    return;
  }

  await syncSubscription(
    subscription
  );
}

// ============================================================
// TRIAL WILL END
//
// This is intentionally NOT the "trial ended" email.
//
// Stripe sends this before the trial ends.
//
// We only sync access here.
// ============================================================

async function handleTrialWillEnd(
  subscription:
    Stripe.Subscription
) {
  if (
    !subscriptionHasStorePrice(
      subscription
    )
  ) {
    return;
  }

  console.log(
    "[STORE SUBSCRIPTION WEBHOOK] Store trial will end:",
    {
      subscriptionId:
        subscription.id,

      trialEnd:
        getTrialEnd(
          subscription
        ),
    }
  );

  await syncSubscription(
    subscription
  );
}

// ============================================================
// TRIAL TRANSITION
//
// Detect:
//
// trialing -> anything else
//
// We use Stripe event.previous_attributes rather than only
// looking at the organisation DB.
//
// This makes the transition detection much more reliable.
// ============================================================

function didTrialJustEnd(
  event:
    Stripe.Event,

  subscription:
    Stripe.Subscription
) {
  const data =
    event.data as
      typeof event.data & {
        previous_attributes?: {
          status?:
            Stripe.Subscription.Status;
        };
      };

  const previousStatus =
    data
      .previous_attributes
      ?.status;

  return (
    previousStatus ===
      "trialing" &&
    subscription.status !==
      "trialing"
  );
}

// ============================================================
// POST
// ============================================================

export async function POST(
  req:
    NextRequest
) {
  // ==========================================================
  // WEBHOOK SECRET
  // ==========================================================

  if (
    !storeSubscriptionWebhookSecret
  ) {
    console.error(
      "[STORE SUBSCRIPTION WEBHOOK] STRIPE_STORE_SUBSCRIPTION_WEBHOOK_SECRET is missing"
    );

    return NextResponse.json(
      {
        error:
          "Store subscription webhook secret is not configured.",
      },
      {
        status:
          500,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }

  // ==========================================================
  // SIGNATURE
  // ==========================================================

  const signature =
    req.headers.get(
      "stripe-signature"
    );

  if (
    !signature
  ) {
    return NextResponse.json(
      {
        error:
          "Missing Stripe signature.",
      },
      {
        status:
          400,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }

  // ==========================================================
  // RAW BODY
  // ==========================================================

  let rawBody:
    string;

  try {
    rawBody =
      await req.text();
  } catch (
    error
  ) {
    console.error(
      "[STORE SUBSCRIPTION WEBHOOK] Could not read request body:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not read webhook body.",
      },
      {
        status:
          400,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }

  // ==========================================================
  // VERIFY STRIPE SIGNATURE
  // ==========================================================

  let event:
    Stripe.Event;

  try {
    event =
      stripe
        .webhooks
        .constructEvent(
          rawBody,
          signature,
          storeSubscriptionWebhookSecret
        );
  } catch (
    error:
      unknown
  ) {
    console.error(
      "[STORE SUBSCRIPTION WEBHOOK] Signature verification failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof
            Error
            ? `Invalid webhook signature: ${error.message}`
            : "Invalid webhook signature.",
      },
      {
        status:
          400,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }

  console.log(
    "[STORE SUBSCRIPTION WEBHOOK] Event received:",
    {
      id:
        event.id,

      type:
        event.type,
    }
  );

  // ==========================================================
  // HANDLE EVENT
  // ==========================================================

  try {
    switch (
      event.type
    ) {
      // ======================================================
      // CHECKOUT COMPLETED
      // ======================================================

      case "checkout.session.completed": {
        const session =
          event.data.object as
            Stripe.Checkout.Session;

        await handleCheckoutCompleted(
          session
        );

        break;
      }

      // ======================================================
      // SUBSCRIPTION CREATED
      //
      // A new Store trial normally arrives as "trialing".
      // ======================================================

      case "customer.subscription.created": {
        const subscription =
          event.data.object as
            Stripe.Subscription;

        if (
          subscriptionHasStorePrice(
            subscription
          )
        ) {
          await syncSubscription(
            subscription
          );
        } else {
          console.log(
            `[STORE SUBSCRIPTION WEBHOOK] Ignoring non-Store subscription ${subscription.id}.`
          );
        }

        break;
      }

      // ======================================================
      // TRIAL WILL END
      // ======================================================

      case "customer.subscription.trial_will_end": {
        const subscription =
          event.data.object as
            Stripe.Subscription;

        await handleTrialWillEnd(
          subscription
        );

        break;
      }

      // ======================================================
      // SUBSCRIPTION UPDATED
      //
      // This is where we detect:
      //
      // trialing -> active
      // trialing -> past_due
      // trialing -> canceled
      // etc.
      // ======================================================

      case "customer.subscription.updated": {
        const subscription =
          event.data.object as
            Stripe.Subscription;

        const organisation =
          await findOrganisationBySubscriptionId(
            subscription.id
          );

        if (
          organisation ||
          subscriptionHasStorePrice(
            subscription
          )
        ) {
          const trialEnded =
            didTrialJustEnd(
              event,
              subscription
            );

          // ==================================================
          // SYNC STORE ACCESS FIRST
          // ==================================================

          await syncSubscription(
            subscription
          );

          // ==================================================
          // THEN SEND TRIAL-END EMAIL
          // ==================================================

          if (
            trialEnded &&
            isStoreTrial(
              subscription
            )
          ) {
            console.log(
              "[STORE SUBSCRIPTION WEBHOOK] Store trial ended:",
              {
                subscriptionId:
                  subscription.id,

                newStatus:
                  subscription.status,

                trialEnd:
                  getTrialEnd(
                    subscription
                  ),
              }
            );

            await sendTrialEndEmail(
              subscription
            );
          }
        }

        break;
      }

      // ======================================================
      // SUBSCRIPTION DELETED
      // ======================================================

      case "customer.subscription.deleted": {
        const subscription =
          event.data.object as
            Stripe.Subscription;

        const organisation =
          await findOrganisationBySubscriptionId(
            subscription.id
          );

        if (
          organisation ||
          subscriptionHasStorePrice(
            subscription
          )
        ) {
          const previousStatus =
            cleanString(
              organisation
                ?.store_subscription_status
            );

          await syncSubscription(
            subscription
          );

          // ==================================================
          // IF IT WAS DELETED DIRECTLY FROM TRIALING
          //
          // Some cancellation paths may result in deleted
          // without us first seeing a useful updated event.
          // ==================================================

          if (
            previousStatus ===
              "trialing" &&
            isStoreTrial(
              subscription
            )
          ) {
            await sendTrialEndEmail(
              subscription
            );
          }
        }

        break;
      }

      // ======================================================
      // INVOICE PAYMENT FAILED
      // ======================================================

      case "invoice.payment_failed": {
        const invoice =
          event.data.object as
            Stripe.Invoice;

        await handleInvoicePaymentFailed(
          invoice
        );

        break;
      }

      // ======================================================
      // INVOICE PAID
      //
      // Keeps Store access synced after successful renewal.
      // ======================================================

      case "invoice.paid": {
        const invoice =
          event.data.object as
            Stripe.Invoice;

        await handleInvoicePaid(
          invoice
        );

        break;
      }

      // ======================================================
      // OTHER EVENTS
      // ======================================================

      default: {
        console.log(
          `[STORE SUBSCRIPTION WEBHOOK] Ignoring ${event.type}`
        );

        break;
      }
    }

    // ========================================================
    // SUCCESS
    // ========================================================

    return NextResponse.json(
      {
        received:
          true,

        eventId:
          event.id,

        type:
          event.type,
      },
      {
        status:
          200,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (
    error:
      unknown
  ) {
    console.error(
      "[STORE SUBSCRIPTION WEBHOOK] Processing failed:",
      {
        eventId:
          event.id,

        type:
          event.type,

        error,
      }
    );

    // ========================================================
    // RETURN 500 SO STRIPE RETRIES
    // ========================================================

    return NextResponse.json(
      {
        error:
          error instanceof
            Error
            ? error.message
            : "Store subscription webhook failed.",

        eventId:
          event.id,

        type:
          event.type,
      },
      {
        status:
          500,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
}