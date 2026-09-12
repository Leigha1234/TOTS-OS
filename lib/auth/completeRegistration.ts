import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// ============================================================
// ENVIRONMENT
// ============================================================

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const rawEncryptionKey =
  process.env.REGISTRATION_ENCRYPTION_KEY?.trim();

if (!rawEncryptionKey) {
  throw new Error(
    "REGISTRATION_ENCRYPTION_KEY is missing",
  );
}

const encryptionKey: string =
  rawEncryptionKey;

const resendApiKey =
  process.env.RESEND_API_KEY;

const signupNotificationEmail =
  process.env.SIGNUP_NOTIFICATION_EMAIL ||
  "theorganisedtypes@gmail.com";

const resendFromEmail =
  process.env.RESEND_FROM_EMAIL;

// ============================================================
// VALIDATE ENVIRONMENT
// ============================================================

if (!supabaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL is missing",
  );
}

if (!supabaseServiceRoleKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is missing",
  );
}

// ============================================================
// SUPABASE
// ============================================================

const supabase =
  createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

// ============================================================
// TYPES
// ============================================================

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

type StripeRegistrationSession = {
  stripe_session_id?: string;

  stripe_customer_id?:
    string | null;

  stripe_subscription_id?:
    string | null;

  customer_email?: string;

  payment_status?: string;

  billing_model?: string | null;

  billing_package?: string | null;

  modules?: string | null;

  requested_ai_tier?:
    string | null;

  effective_ai_tier?:
    string | null;

  monthly_total_pence?:
    string | number | null;

  billing_version?:
    string | null;
};

type SignupNotificationInput = {
  registrationId: string;

  userId: string;

  organisationId: string;

  fullName:
    string | null;

  email: string;

  companyName:
    string | null;

  jobTitle:
    string | null;

  subscriptionTier:
    string;

  billingModel:
    BillingModel;

  billingPackage:
    BillingPackage;

  modules:
    ModuleKey[];

  aiTier:
    AiTierKey;

  monthlyTotalPence:
    number | null;

  stripeCustomerId:
    string | null;

  stripeSubscriptionId:
    string | null;

  stripeSessionId:
    string | null;

  paymentStatus:
    string | null;
};

// ============================================================
// CONSTANTS
// ============================================================

const MAIN_MODULE_KEYS: ModuleKey[] = [
  "core",
  "clientsProjects",
  "finance",
  "social",
  "email",
  "store",
];

// ============================================================
// HELPERS
// ============================================================

function cleanString(
  value: unknown,
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
// HTML ESCAPE
// ============================================================

function escapeHtml(
  value: unknown,
) {
  return String(
    value ?? "",
  )
    .replace(
      /&/g,
      "&amp;",
    )
    .replace(
      /</g,
      "&lt;",
    )
    .replace(
      />/g,
      "&gt;",
    )
    .replace(
      /"/g,
      "&quot;",
    )
    .replace(
      /'/g,
      "&#039;",
    );
}

// ============================================================
// FORMAT LEGACY PLAN
// ============================================================

function formatTier(
  tier: string,
) {
  const value =
    cleanString(
      tier,
    );

  if (!value) {
    return "Unknown";
  }

  if (
    value ===
    "modular"
  ) {
    return "Modular";
  }

  if (
    value ===
    "complete"
  ) {
    return "Complete";
  }

  return (
    value.charAt(0).toUpperCase() +
    value
      .slice(1)
      .toLowerCase()
  );
}

// ============================================================
// FORMAT MODULE
// ============================================================

function formatModule(
  moduleKey: ModuleKey,
) {
  const names: Record<
    ModuleKey,
    string
  > = {
    core:
      "Core",

    clientsProjects:
      "Clients & Projects",

    finance:
      "Finance",

    social:
      "Social Studio",

    email:
      "Email Marketing",

    store:
      "Store",
  };

  return names[
    moduleKey
  ];
}

// ============================================================
// FORMAT AI
// ============================================================

function formatAiTier(
  tier: AiTierKey,
) {
  if (
    tier ===
    "none"
  ) {
    return "None";
  }

  return (
    `Clarity AI ${
      tier
        .charAt(0)
        .toUpperCase() +
      tier.slice(1)
    }`
  );
}

// ============================================================
// FORMAT PRICE
// ============================================================

function formatPence(
  amount:
    number | null,
) {
  if (
    amount == null
  ) {
    return "Not supplied";
  }

  return `£${(
    amount / 100
  ).toFixed(2)}/month`;
}

// ============================================================
// FORMAT DATE
// ============================================================

function formatSignupDate() {
  return new Intl
    .DateTimeFormat(
      "en-GB",
      {
        dateStyle:
          "full",

        timeStyle:
          "short",

        timeZone:
          "Europe/London",
      },
    )
    .format(
      new Date(),
    );
}

// ============================================================
// DECRYPT PASSWORD
// ============================================================

function decryptPassword(
  value: string,
) {
  const [
    ivHex,
    encryptedHex,
  ] =
    value.split(
      ":",
    );

  if (
    !ivHex ||
    !encryptedHex
  ) {
    throw new Error(
      "Encrypted password is malformed.",
    );
  }

  const key =
    crypto
      .createHash(
        "sha256",
      )
      .update(
        encryptionKey,
      )
      .digest();

  const decipher =
    crypto
      .createDecipheriv(
        "aes-256-cbc",
        key,
        Buffer.from(
          ivHex,
          "hex",
        ),
      );

  const decrypted =
    Buffer.concat([
      decipher.update(
        Buffer.from(
          encryptedHex,
          "hex",
        ),
      ),

      decipher.final(),
    ]);

  return decrypted
    .toString(
      "utf8",
    );
}

// ============================================================
// LEGACY TIER
// ============================================================

function normaliseLegacyTier(
  value:
    string |
    null |
    undefined,
): LegacySubscriptionTier | null {
  const tier =
    String(
      value || "",
    )
      .trim()
      .toLowerCase();

  if (
    tier ===
    "standard" ||
    tier ===
    "professional" ||
    tier ===
    "elite"
  ) {
    return tier;
  }

  return null;
}

// ============================================================
// BILLING MODEL
// ============================================================

function normaliseBillingModel(
  value: unknown,
  legacyTier:
    LegacySubscriptionTier | null,
): BillingModel {
  const model =
    cleanString(
      value,
    ).toLowerCase();

  if (
    model ===
    "modular"
  ) {
    return "modular";
  }

  if (
    model ===
    "legacy_tier"
  ) {
    return "legacy_tier";
  }

  if (
    legacyTier
  ) {
    return "legacy_tier";
  }

  return "modular";
}

// ============================================================
// BILLING PACKAGE
// ============================================================

function normaliseBillingPackage(
  value: unknown,
  billingModel:
    BillingModel,
):
  BillingPackage {
  if (
    billingModel ===
    "legacy_tier"
  ) {
    return "legacy";
  }

  const packageValue =
    cleanString(
      value,
    ).toLowerCase();

  if (
    packageValue ===
    "complete"
  ) {
    return "complete";
  }

  return "modular";
}

// ============================================================
// MODULES
// ============================================================

function normaliseModules(
  value: unknown,
): ModuleKey[] {
  let values:
    unknown[] = [];

  if (
    Array.isArray(
      value,
    )
  ) {
    values =
      value;
  } else if (
    typeof value ===
    "string"
  ) {
    values =
      value
        .split(",")
        .map(
          (item) =>
            item.trim(),
        );
  }

  const modules =
    values
      .map(
        (item) =>
          String(
            item || "",
          ).trim(),
      )
      .filter(
        (
          item,
        ): item is ModuleKey =>
          MAIN_MODULE_KEYS.includes(
            item as ModuleKey,
          ),
      );

  return Array.from(
    new Set(
      modules,
    ),
  );
}

// ============================================================
// AI TIER
// ============================================================

function normaliseAiTier(
  value: unknown,
): AiTierKey {
  const tier =
    cleanString(
      value,
    ).toLowerCase();

  if (
    tier ===
      "starter" ||
    tier ===
      "plus" ||
    tier ===
      "pro"
  ) {
    return tier;
  }

  return "none";
}

// ============================================================
// MONTHLY TOTAL
// ============================================================

function normaliseMonthlyTotal(
  value: unknown,
) {
  if (
    typeof value ===
    "number" &&
    Number.isFinite(
      value,
    )
  ) {
    return Math.max(
      0,
      Math.round(
        value,
      ),
    );
  }

  const parsed =
    Number(
      cleanString(
        value,
      ),
    );

  if (
    !Number.isFinite(
      parsed,
    )
  ) {
    return null;
  }

  return Math.max(
    0,
    Math.round(
      parsed,
    ),
  );
}

// ============================================================
// SEND NEW SIGNUP NOTIFICATION
// ============================================================

async function sendNewSignupNotification({
  registrationId,
  userId,
  organisationId,
  fullName,
  email,
  companyName,
  jobTitle,
  subscriptionTier,
  billingModel,
  billingPackage,
  modules,
  aiTier,
  monthlyTotalPence,
  stripeCustomerId,
  stripeSubscriptionId,
  stripeSessionId,
  paymentStatus,
}: SignupNotificationInput) {
  if (
    !resendApiKey
  ) {
    console.warn(
      "[SIGNUP NOTIFICATION] RESEND_API_KEY is missing. Admin signup email was not sent.",
    );

    return;
  }

  if (
    !resendFromEmail
  ) {
    console.warn(
      "[SIGNUP NOTIFICATION] RESEND_FROM_EMAIL is missing. Admin signup email was not sent.",
    );

    return;
  }

  const displayName =
    cleanString(
      fullName,
    ) ||
    "Not provided";

  const displayBusiness =
    cleanString(
      companyName,
    ) ||
    "Not provided";

  const displayJobTitle =
    cleanString(
      jobTitle,
    ) ||
    "Not provided";

  const displayTier =
    billingPackage ===
    "complete"
      ? "TOTS-OS Complete"
      : billingModel ===
        "modular"
        ? "Custom modular setup"
        : `${formatTier(
            subscriptionTier,
          )} plan`;

  const displayModules =
    modules.length
      ? modules
          .map(
            formatModule,
          )
          .join(", ")
      : "Legacy plan";

  const displayAi =
    formatAiTier(
      aiTier,
    );

  const displayPrice =
    formatPence(
      monthlyTotalPence,
    );

  const signupDate =
    formatSignupDate();

  const subject =
    `🎉 New TOTS-OS signup — ${displayBusiness}`;

  const text =
    [
      "New TOTS-OS signup",
      "",
      `Name: ${displayName}`,
      `Email: ${email}`,
      `Business: ${displayBusiness}`,
      `Job title: ${displayJobTitle}`,
      `Setup: ${displayTier}`,
      `Modules: ${displayModules}`,
      `Clarity AI: ${displayAi}`,
      `Monthly price: ${displayPrice}`,
      `Joined: ${signupDate}`,
      "",
      "Payment",
      `Payment status: ${
        paymentStatus ||
        "Not supplied"
      }`,
      `Stripe customer: ${
        stripeCustomerId ||
        "Not supplied"
      }`,
      `Stripe subscription: ${
        stripeSubscriptionId ||
        "Not supplied"
      }`,
      `Stripe checkout session: ${
        stripeSessionId ||
        "Not supplied"
      }`,
      "",
      "TOTS-OS",
      `User ID: ${userId}`,
      `Organisation ID: ${organisationId}`,
      `Registration ID: ${registrationId}`,
    ].join(
      "\n",
    );

  const html =
    `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1"
          />
        </head>

        <body
          style="
            margin:0;
            padding:0;
            background:#f5f5f4;
            font-family:Arial,Helvetica,sans-serif;
            color:#292524;
          "
        >
          <div
            style="
              width:100%;
              padding:32px 16px;
              box-sizing:border-box;
            "
          >
            <div
              style="
                max-width:620px;
                margin:0 auto;
                background:#ffffff;
                border:1px solid #e7e5e4;
                border-radius:24px;
                overflow:hidden;
              "
            >
              <div
                style="
                  padding:32px;
                  background:#1c1917;
                  color:#ffffff;
                "
              >
                <div
                  style="
                    margin-bottom:12px;
                    font-size:11px;
                    font-weight:700;
                    letter-spacing:2px;
                    text-transform:uppercase;
                    color:#a9b897;
                  "
                >
                  TOTS-OS
                </div>

                <h1
                  style="
                    margin:0;
                    font-size:30px;
                    line-height:1.2;
                  "
                >
                  🎉 New signup
                </h1>

                <p
                  style="
                    margin:12px 0 0;
                    color:#d6d3d1;
                    line-height:1.6;
                  "
                >
                  A new business has joined TOTS-OS.
                </p>
              </div>

              <div
                style="
                  padding:32px;
                "
              >
                <div
                  style="
                    padding:22px;
                    background:#f7f8f5;
                    border:1px solid #e3e8df;
                    border-radius:18px;
                    margin-bottom:24px;
                  "
                >
                  <div
                    style="
                      margin-bottom:8px;
                      font-size:11px;
                      font-weight:700;
                      letter-spacing:1.5px;
                      text-transform:uppercase;
                      color:#829473;
                    "
                  >
                    New customer
                  </div>

                  <div
                    style="
                      font-size:24px;
                      font-weight:700;
                      color:#292524;
                    "
                  >
                    ${escapeHtml(
                      displayBusiness,
                    )}
                  </div>

                  <div
                    style="
                      margin-top:6px;
                      font-size:14px;
                      color:#78716c;
                    "
                  >
                    ${escapeHtml(
                      displayTier,
                    )}
                  </div>
                </div>

                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  style="border-collapse:collapse;"
                >
                  <tr>
                    <td
                      style="
                        padding:10px 0;
                        color:#78716c;
                        font-size:13px;
                      "
                    >
                      Name
                    </td>

                    <td
                      align="right"
                      style="
                        padding:10px 0;
                        font-size:13px;
                        font-weight:600;
                      "
                    >
                      ${escapeHtml(
                        displayName,
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding:10px 0;
                        color:#78716c;
                        font-size:13px;
                      "
                    >
                      Email
                    </td>

                    <td
                      align="right"
                      style="
                        padding:10px 0;
                        font-size:13px;
                        font-weight:600;
                      "
                    >
                      ${escapeHtml(
                        email,
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding:10px 0;
                        color:#78716c;
                        font-size:13px;
                      "
                    >
                      Job title
                    </td>

                    <td
                      align="right"
                      style="
                        padding:10px 0;
                        font-size:13px;
                        font-weight:600;
                      "
                    >
                      ${escapeHtml(
                        displayJobTitle,
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding:10px 0;
                        color:#78716c;
                        font-size:13px;
                      "
                    >
                      Setup
                    </td>

                    <td
                      align="right"
                      style="
                        padding:10px 0;
                        font-size:13px;
                        font-weight:600;
                        color:#829473;
                      "
                    >
                      ${escapeHtml(
                        displayTier,
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding:10px 0;
                        color:#78716c;
                        font-size:13px;
                      "
                    >
                      Modules
                    </td>

                    <td
                      align="right"
                      style="
                        padding:10px 0;
                        font-size:13px;
                        font-weight:600;
                      "
                    >
                      ${escapeHtml(
                        displayModules,
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding:10px 0;
                        color:#78716c;
                        font-size:13px;
                      "
                    >
                      Clarity AI
                    </td>

                    <td
                      align="right"
                      style="
                        padding:10px 0;
                        font-size:13px;
                        font-weight:600;
                      "
                    >
                      ${escapeHtml(
                        displayAi,
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding:10px 0;
                        color:#78716c;
                        font-size:13px;
                      "
                    >
                      Monthly price
                    </td>

                    <td
                      align="right"
                      style="
                        padding:10px 0;
                        font-size:13px;
                        font-weight:700;
                      "
                    >
                      ${escapeHtml(
                        displayPrice,
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding:10px 0;
                        color:#78716c;
                        font-size:13px;
                      "
                    >
                      Joined
                    </td>

                    <td
                      align="right"
                      style="
                        padding:10px 0;
                        font-size:13px;
                        font-weight:600;
                      "
                    >
                      ${escapeHtml(
                        signupDate,
                      )}
                    </td>
                  </tr>
                </table>

                <div
                  style="
                    height:1px;
                    background:#e7e5e4;
                    margin:24px 0;
                  "
                ></div>

                <div
                  style="
                    margin-bottom:12px;
                    font-size:11px;
                    font-weight:700;
                    letter-spacing:1.5px;
                    text-transform:uppercase;
                    color:#a8a29e;
                  "
                >
                  Stripe
                </div>

                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  style="border-collapse:collapse;"
                >
                  <tr>
                    <td
                      style="
                        padding:7px 0;
                        color:#78716c;
                        font-size:12px;
                      "
                    >
                      Payment status
                    </td>

                    <td
                      align="right"
                      style="
                        padding:7px 0;
                        font-size:12px;
                      "
                    >
                      ${escapeHtml(
                        paymentStatus ||
                        "Not supplied",
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding:7px 0;
                        color:#78716c;
                        font-size:12px;
                      "
                    >
                      Customer ID
                    </td>

                    <td
                      align="right"
                      style="
                        padding:7px 0;
                        font-size:11px;
                        font-family:monospace;
                      "
                    >
                      ${escapeHtml(
                        stripeCustomerId ||
                        "—",
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding:7px 0;
                        color:#78716c;
                        font-size:12px;
                      "
                    >
                      Subscription ID
                    </td>

                    <td
                      align="right"
                      style="
                        padding:7px 0;
                        font-size:11px;
                        font-family:monospace;
                      "
                    >
                      ${escapeHtml(
                        stripeSubscriptionId ||
                        "—",
                      )}
                    </td>
                  </tr>
                </table>

                <div
                  style="
                    height:1px;
                    background:#e7e5e4;
                    margin:24px 0;
                  "
                ></div>

                <div
                  style="
                    margin-bottom:12px;
                    font-size:11px;
                    font-weight:700;
                    letter-spacing:1.5px;
                    text-transform:uppercase;
                    color:#a8a29e;
                  "
                >
                  Internal references
                </div>

                <div
                  style="
                    color:#78716c;
                    font-family:monospace;
                    font-size:11px;
                    line-height:1.8;
                    word-break:break-all;
                  "
                >
                  User:
                  ${escapeHtml(
                    userId,
                  )}
                  <br />

                  Organisation:
                  ${escapeHtml(
                    organisationId,
                  )}
                  <br />

                  Registration:
                  ${escapeHtml(
                    registrationId,
                  )}
                </div>
              </div>

              <div
                style="
                  padding:20px 32px;
                  border-top:1px solid #e7e5e4;
                  color:#a8a29e;
                  font-size:11px;
                "
              >
                Automatic notification from TOTS-OS
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

  try {
    const response =
      await fetch(
        "https://api.resend.com/emails",
        {
          method:
            "POST",

          headers: {
            Authorization:
              `Bearer ${resendApiKey}`,

            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              from:
                resendFromEmail,

              to: [
                signupNotificationEmail,
              ],

              subject,

              text,

              html,
            }),
        },
      );

    if (
      !response.ok
    ) {
      const responseText =
        await response
          .text()
          .catch(
            () => "",
          );

      console.error(
        "[SIGNUP NOTIFICATION] Resend returned an error:",
        {
          status:
            response.status,

          body:
            responseText,
        },
      );

      return;
    }

    const responseData =
      await response
        .json()
        .catch(
          () => null,
        );

    console.log(
      "[SIGNUP NOTIFICATION] New signup email sent:",
      {
        to:
          signupNotificationEmail,

        registrationId,

        userId,

        organisationId,

        resendEmailId:
          responseData
            ?.id ||
          null,
      },
    );
  } catch (
    error
  ) {
    console.error(
      "[SIGNUP NOTIFICATION] Failed to send new signup notification:",
      error,
    );
  }
}

// ============================================================
// COMPLETE REGISTRATION
// ============================================================

export async function completeRegistration(
  registrationId: string,
  session?:
    StripeRegistrationSession,
) {
  // ==========================================================
  // LOAD PENDING REGISTRATION
  // ==========================================================

  const {
    data:
      registration,

    error:
      registrationError,
  } =
    await supabase
      .from(
        "pending_registrations",
      )
      .select(
        "*",
      )
      .eq(
        "id",
        registrationId,
      )
      .single();

  if (
    registrationError ||
    !registration
  ) {
    throw new Error(
      registrationError
        ?.message ||
      "Pending registration not found.",
    );
  }

  // ==========================================================
  // ALREADY COMPLETE
  // ==========================================================

  if (
    registration.completed
  ) {
    console.log(
      "[REGISTRATION] Registration already completed:",
      {
        registrationId,

        userId:
          registration
            .user_id ??
          null,

        organisationId:
          registration
            .organisation_id ??
          null,
      },
    );

    return {
      userId:
        registration
          .user_id ??
        null,

      organisationId:
        registration
          .organisation_id ??
        null,

      recoveryLink:
        null,
    };
  }

  // ==========================================================
  // RESOLVE BILLING
  // ==========================================================

  const legacyTier =
    normaliseLegacyTier(
      registration
        .subscription_tier,
    );

  const billingModel =
    normaliseBillingModel(
      session
        ?.billing_model ??
        registration
          .billing_model,
      legacyTier,
    );

  const billingPackage =
    normaliseBillingPackage(
      session
        ?.billing_package ??
        registration
          .billing_package,
      billingModel,
    );

  let modules =
    normaliseModules(
      session
        ?.modules ??
        registration
          .selected_modules,
    );

  let effectiveAiTier =
    normaliseAiTier(
      session
        ?.effective_ai_tier ??
        registration
          .effective_ai_tier,
    );

  const requestedAiTier =
    normaliseAiTier(
      session
        ?.requested_ai_tier ??
        registration
          .requested_ai_tier,
    );

  const monthlyTotalPence =
    normaliseMonthlyTotal(
      session
        ?.monthly_total_pence ??
        registration
          .monthly_total_pence,
    );

  const billingVersion =
    cleanString(
      session
        ?.billing_version ??
        registration
          .billing_version,
    ) ||
    (
      billingModel ===
      "modular"
        ? "v2"
        : "legacy"
    );

  // ==========================================================
  // COMPLETE ALWAYS MEANS ALL MODULES + STARTER
  // ==========================================================

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

  // ==========================================================
  // MODULAR MUST HAVE MODULES
  // ==========================================================

  if (
    billingModel ===
      "modular" &&
    modules.length ===
      0
  ) {
    throw new Error(
      "Modular registration does not contain any module entitlements.",
    );
  }

  // ==========================================================
  // DISPLAY / COMPATIBILITY PLAN
  // ==========================================================

  const subscriptionTier =
    legacyTier ??
    (
      billingPackage ===
      "complete"
        ? "complete"
        : "modular"
    );

  // ==========================================================
  // PARTIAL RECOVERY STATE
  // ==========================================================

  let userId =
    cleanString(
      registration
        .user_id,
    );

  let organisationId =
    cleanString(
      registration
        .organisation_id,
    );

  // ==========================================================
  // AUTH USER
  // ==========================================================

  if (
    userId
  ) {
    const {
      data:
        existingAuthUser,

      error:
        existingAuthError,
    } =
      await supabase
        .auth
        .admin
        .getUserById(
          userId,
        );

    if (
      existingAuthError ||
      !existingAuthUser
        ?.user
    ) {
      throw new Error(
        existingAuthError
          ?.message ||
        "Pending registration references an Auth user that no longer exists.",
      );
    }

    console.log(
      "[REGISTRATION] Reusing existing Auth user:",
      {
        registrationId,
        userId,
      },
    );
  } else {
    if (
      !registration
        .encrypted_password
    ) {
      throw new Error(
        "Encrypted password missing from registration.",
      );
    }

    const password =
      decryptPassword(
        registration
          .encrypted_password,
      );

    const {
      data:
        authData,

      error:
        authError,
    } =
      await supabase
        .auth
        .admin
        .createUser({
          email:
            registration
              .email,

          password,

          email_confirm:
            true,

          user_metadata: {
            full_name:
              registration
                .full_name,

            organisation_name:
              registration
                .company_name,

            registration_id:
              registration
                .id,

            subscription_tier:
              subscriptionTier,

            billing_model:
              billingModel,

            billing_package:
              billingPackage,
          },
        });

    if (
      authError ||
      !authData.user
    ) {
      throw new Error(
        authError
          ?.message ||
        "Failed to create Auth user.",
      );
    }

    userId =
      authData
        .user
        .id;

    const {
      error:
        userLinkError,
    } =
      await supabase
        .from(
          "pending_registrations",
        )
        .update({
          user_id:
            userId,
        })
        .eq(
          "id",
          registrationId,
        );

    if (
      userLinkError
    ) {
      throw new Error(
        `Auth user was created but pending registration could not be linked: ${userLinkError.message}`,
      );
    }

    console.log(
      "[REGISTRATION] Auth user created:",
      {
        registrationId,
        userId,
      },
    );
  }

  // ==========================================================
  // BUILD ORGANISATION BILLING PAYLOAD
  // ==========================================================

  const organisationBillingPayload:
    Record<
      string,
      unknown
    > = {
      name:
        registration
          .company_name ||
        "New Organisation",

      created_by:
        userId,

      status:
        "active",

      email:
        registration
          .email,

      subscription_status:
        "active",

      access_status:
        "active",

      billing_model:
        billingModel,

      billing_package:
        billingPackage,

      clarity_ai_tier:
        effectiveAiTier,

      billing_version:
        billingVersion,

      // Existing Store UI still uses this.
      store_enabled:
        billingModel ===
          "modular"
          ? modules.includes(
              "store",
            )
          : false,
    };

  // ==========================================================
  // ONLY WRITE OLD subscription_tier FOR LEGACY CUSTOMERS
  // ==========================================================

  if (
    legacyTier
  ) {
    organisationBillingPayload
      .subscription_tier =
      legacyTier;
  }

  // ==========================================================
  // ORGANISATION
  // ==========================================================

  if (
    organisationId
  ) {
    const {
      data:
        existingOrganisation,

      error:
        existingOrganisationError,
    } =
      await supabase
        .from(
          "organisations",
        )
        .select(
          "id",
        )
        .eq(
          "id",
          organisationId,
        )
        .maybeSingle();

    if (
      existingOrganisationError
    ) {
      throw new Error(
        existingOrganisationError
          .message,
      );
    }

    if (
      !existingOrganisation
    ) {
      throw new Error(
        "Pending registration references an organisation that no longer exists.",
      );
    }

    const {
      error:
        organisationRepairError,
    } =
      await supabase
        .from(
          "organisations",
        )
        .update(
          organisationBillingPayload,
        )
        .eq(
          "id",
          organisationId,
        );

    if (
      organisationRepairError
    ) {
      throw new Error(
        organisationRepairError
          .message,
      );
    }

    console.log(
      "[REGISTRATION] Existing organisation repaired:",
      {
        registrationId,
        organisationId,
        billingModel,
        billingPackage,
        modules,
        effectiveAiTier,
      },
    );
  } else {
    const newOrganisationPayload: Record<
      string,
      unknown
    > = {
      ...organisationBillingPayload,

      available_seats:
        1,

      store_subscription_status:
        null,

      store_stripe_subscription_id:
        null,

      store_stripe_customer_id:
        null,

      store_price_id:
        null,

      store_current_period_end:
        null,

      store_cancel_at_period_end:
        false,
    };

    const {
      data:
        organisation,

      error:
        organisationError,
    } =
      await supabase
        .from(
          "organisations",
        )
        .insert(
          newOrganisationPayload,
        )
        .select(
          "id",
        )
        .single();

    if (
      organisationError ||
      !organisation
    ) {
      throw new Error(
        organisationError
          ?.message ||
        "Failed to create organisation.",
      );
    }

    organisationId =
      organisation.id;

    const {
      error:
        organisationLinkError,
    } =
      await supabase
        .from(
          "pending_registrations",
        )
        .update({
          organisation_id:
            organisationId,
        })
        .eq(
          "id",
          registrationId,
        );

    if (
      organisationLinkError
    ) {
      throw new Error(
        `Organisation was created but pending registration could not be linked: ${organisationLinkError.message}`,
      );
    }

    console.log(
      "[REGISTRATION] Organisation created:",
      {
        registrationId,
        organisationId,
        billingModel,
        billingPackage,
        modules,
        effectiveAiTier,
      },
    );
  }

  // ==========================================================
  // ENSURE BOTH RECOVERY REFERENCES ARE PRESENT
  // ==========================================================

  const {
    error:
      finalLinkError,
  } =
    await supabase
      .from(
        "pending_registrations",
      )
      .update({
        user_id:
          userId,

        organisation_id:
          organisationId,
      })
      .eq(
        "id",
        registrationId,
      );

  if (
    finalLinkError
  ) {
    throw new Error(
      finalLinkError
        .message,
    );
  }

  // ==========================================================
  // OWNER MEMBERSHIP
  // ==========================================================

  const {
    data:
      existingMembership,

    error:
      membershipLookupError,
  } =
    await supabase
      .from(
        "organisation_members",
      )
      .select(
        "id, role",
      )
      .eq(
        "organisation_id",
        organisationId,
      )
      .eq(
        "user_id",
        userId,
      )
      .maybeSingle();

  if (
    membershipLookupError
  ) {
    throw new Error(
      membershipLookupError
        .message,
    );
  }

  if (
    existingMembership
  ) {
    if (
      existingMembership
        .role !==
      "owner"
    ) {
      const {
        error:
          membershipUpdateError,
      } =
        await supabase
          .from(
            "organisation_members",
          )
          .update({
            role:
              "owner",
          })
          .eq(
            "id",
            existingMembership
              .id,
          );

      if (
        membershipUpdateError
      ) {
        throw new Error(
          membershipUpdateError
            .message,
        );
      }
    }
  } else {
    const {
      error:
        membershipCreateError,
    } =
      await supabase
        .from(
          "organisation_members",
        )
        .insert({
          organisation_id:
            organisationId,

          user_id:
            userId,

          role:
            "owner",
        });

    if (
      membershipCreateError
    ) {
      throw new Error(
        membershipCreateError
          .message,
      );
    }
  }

  // ==========================================================
  // MODULE ENTITLEMENTS
  // ==========================================================
  //
  // Legacy plans continue to use their existing entitlement
  // behaviour.
  //
  // New modular plans use organisation_modules.
  //
  // ==========================================================

  if (
    billingModel ===
    "modular"
  ) {
    // ========================================================
    // CANCEL ANY MODULES THAT ARE NOT PART OF THIS SETUP
    //
    // Mostly relevant for webhook recovery / retries.
    // ========================================================

    const {
      data:
        currentModuleRows,

      error:
        currentModulesError,
    } =
      await supabase
        .from(
          "organisation_modules",
        )
        .select(
          "id, module_key, status",
        )
        .eq(
          "organisation_id",
          organisationId,
        );

    if (
      currentModulesError
    ) {
      throw new Error(
        currentModulesError
          .message,
      );
    }

    const modulesToCancel =
      (
        currentModuleRows ||
        []
      )
        .filter(
          (row) =>
            !modules.includes(
              row
                .module_key as ModuleKey,
            ) &&
            row.status !==
              "cancelled",
        )
        .map(
          (row) =>
            row.id,
        );

    if (
      modulesToCancel.length >
      0
    ) {
      const {
        error:
          cancelModulesError,
      } =
        await supabase
          .from(
            "organisation_modules",
          )
          .update({
            status:
              "cancelled",

            cancelled_at:
              new Date()
                .toISOString(),

            updated_at:
              new Date()
                .toISOString(),
          })
          .in(
            "id",
            modulesToCancel,
          );

      if (
        cancelModulesError
      ) {
        throw new Error(
          cancelModulesError
            .message,
        );
      }
    }

    // ========================================================
    // ACTIVATE PURCHASED MODULES
    // ========================================================

    const now =
      new Date()
        .toISOString();

    const moduleRows =
      modules.map(
        (moduleKey) => ({
          organisation_id:
            organisationId,

          module_key:
            moduleKey,

          status:
            "active",

          activated_at:
            now,

          cancelled_at:
            null,

          updated_at:
            now,
        }),
      );

    const {
      error:
        moduleUpsertError,
    } =
      await supabase
        .from(
          "organisation_modules",
        )
        .upsert(
          moduleRows,
          {
            onConflict:
              "organisation_id,module_key",
          },
        );

    if (
      moduleUpsertError
    ) {
      throw new Error(
        moduleUpsertError
          .message,
      );
    }

    console.log(
      "[REGISTRATION] Module entitlements provisioned:",
      {
        organisationId,
        modules,
        effectiveAiTier,
      },
    );
  }

  // ==========================================================
  // PROFILE
  // ==========================================================

  const profilePayload:
    Record<
      string,
      unknown
    > = {
      email:
        registration
          .email,

      full_name:
        registration
          .full_name,

      job_title:
        registration
          .job_title,

      organisation_id:
        organisationId,

      role:
        "owner",
    };

  // Don't put "modular" / "complete" into a legacy constrained
  // profile subscription_tier field.
  if (
    legacyTier
  ) {
    profilePayload
      .subscription_tier =
      legacyTier;
  }

  const {
    error:
      profileError,
  } =
    await supabase
      .from(
        "profiles",
      )
      .update(
        profilePayload,
      )
      .eq(
        "id",
        userId,
      );

  if (
    profileError
  ) {
    throw new Error(
      profileError
        .message,
    );
  }

  // ==========================================================
  // RE-ASSERT ORGANISATION ACCESS
  // ==========================================================

  const finalOrganisationPayload:
    Record<
      string,
      unknown
    > = {
      subscription_status:
        "active",

      access_status:
        "active",

      status:
        "active",

      billing_model:
        billingModel,

      billing_package:
        billingPackage,

      clarity_ai_tier:
        effectiveAiTier,

      billing_version:
        billingVersion,

      store_enabled:
        billingModel ===
          "modular"
          ? modules.includes(
              "store",
            )
          : false,
    };

  if (
    legacyTier
  ) {
    finalOrganisationPayload
      .subscription_tier =
      legacyTier;
  }

  const {
    error:
      paidAccessError,
  } =
    await supabase
      .from(
        "organisations",
      )
      .update(
        finalOrganisationPayload,
      )
      .eq(
        "id",
        organisationId,
      );

  if (
    paidAccessError
  ) {
    throw new Error(
      paidAccessError
        .message,
    );
  }

  // ==========================================================
  // MAIN TOTS-OS SUBSCRIPTION
  // ==========================================================

  const {
    data:
      existingSubscription,

    error:
      subscriptionLookupError,
  } =
    await supabase
      .from(
        "subscriptions",
      )
      .select(
        "id",
      )
      .eq(
        "organisation_id",
        organisationId,
      )
      .limit(
        1,
      )
      .maybeSingle();

  if (
    subscriptionLookupError
  ) {
    throw new Error(
      subscriptionLookupError
        .message,
    );
  }

  const stripeCustomerId =
    cleanString(
      session
        ?.stripe_customer_id,
    ) ||
    null;

  const stripeSubscriptionId =
    cleanString(
      session
        ?.stripe_subscription_id,
    ) ||
    null;

  if (
    existingSubscription
  ) {
    const subscriptionPayload:
      Record<
        string,
        unknown
      > = {
        active:
          true,

        status:
          "active",
      };

    if (
      stripeCustomerId
    ) {
      subscriptionPayload
        .stripe_customer_id =
        stripeCustomerId;
    }

    if (
      stripeSubscriptionId
    ) {
      subscriptionPayload
        .stripe_subscription_id =
        stripeSubscriptionId;
    }

    const {
      error:
        subscriptionUpdateError,
    } =
      await supabase
        .from(
          "subscriptions",
        )
        .update(
          subscriptionPayload,
        )
        .eq(
          "id",
          existingSubscription
            .id,
        );

    if (
      subscriptionUpdateError
    ) {
      throw new Error(
        subscriptionUpdateError
          .message,
      );
    }
  } else {
    const {
      error:
        subscriptionCreateError,
    } =
      await supabase
        .from(
          "subscriptions",
        )
        .insert({
          organisation_id:
            organisationId,

          stripe_customer_id:
            stripeCustomerId,

          stripe_subscription_id:
            stripeSubscriptionId,

          active:
            true,

          status:
            "active",
        });

    if (
      subscriptionCreateError
    ) {
      throw new Error(
        subscriptionCreateError
          .message,
      );
    }
  }

  // ==========================================================
  // MARK REGISTRATION COMPLETE
  // ==========================================================

  const {
    error:
      completeError,
  } =
    await supabase
      .from(
        "pending_registrations",
      )
      .update({
        completed:
          true,

        encrypted_password:
          null,

        user_id:
          userId,

        organisation_id:
          organisationId,

        billing_model:
          billingModel,

        billing_package:
          billingPackage,

        selected_modules:
          billingModel ===
            "modular"
            ? modules
            : null,

        requested_ai_tier:
          requestedAiTier,

        effective_ai_tier:
          effectiveAiTier,

        monthly_total_pence:
          monthlyTotalPence,

        billing_version:
          billingVersion,
      })
      .eq(
        "id",
        registrationId,
      );

  if (
    completeError
  ) {
    throw new Error(
      completeError
        .message,
    );
  }

  // ==========================================================
  // SUCCESS
  // ==========================================================

  console.log(
    "[REGISTRATION] Registration completed:",
    {
      registrationId,

      userId,

      organisationId,

      subscriptionTier,

      billingModel,

      billingPackage,

      modules,

      requestedAiTier,

      effectiveAiTier,

      monthlyTotalPence,

      billingVersion,

      email:
        registration
          .email,

      company:
        registration
          .company_name,

      stripeCustomerId,

      stripeSubscriptionId,
    },
  );

  // ==========================================================
  // ADMIN SIGNUP NOTIFICATION
  // ==========================================================

  await sendNewSignupNotification({
    registrationId,

    userId,

    organisationId,

    fullName:
      registration
        .full_name ||
      null,

    email:
      registration
        .email,

    companyName:
      registration
        .company_name ||
      null,

    jobTitle:
      registration
        .job_title ||
      null,

    subscriptionTier,

    billingModel,

    billingPackage,

    modules,

    aiTier:
      effectiveAiTier,

    monthlyTotalPence,

    stripeCustomerId,

    stripeSubscriptionId,

    stripeSessionId:
      cleanString(
        session
          ?.stripe_session_id,
      ) ||
      null,

    paymentStatus:
      cleanString(
        session
          ?.payment_status,
      ) ||
      null,
  });

  // ==========================================================
  // RETURN
  // ==========================================================

  return {
    userId,

    organisationId,

    recoveryLink:
      null,
  };
}