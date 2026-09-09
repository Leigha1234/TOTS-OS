import {
  createClient,
} from "@supabase/supabase-js";

import crypto from "crypto";

// ============================================================
// ENVIRONMENT
// ============================================================

const supabaseUrl =
  process.env
    .NEXT_PUBLIC_SUPABASE_URL;

const supabaseServiceRoleKey =
  process.env
    .SUPABASE_SERVICE_ROLE_KEY;

const rawEncryptionKey =
  process.env
    .REGISTRATION_ENCRYPTION_KEY
    ?.trim();

if (
  !rawEncryptionKey
) {
  throw new Error(
    "REGISTRATION_ENCRYPTION_KEY is missing"
  );
}

const encryptionKey:
  string =
  rawEncryptionKey;

const resendApiKey =
  process.env
    .RESEND_API_KEY;

const signupNotificationEmail =
  process.env
    .SIGNUP_NOTIFICATION_EMAIL ||
  "theorganisedtypes@gmail.com";

const resendFromEmail =
  process.env
    .RESEND_FROM_EMAIL;

// ============================================================
// VALIDATE CRITICAL ENVIRONMENT
// ============================================================

if (
  !supabaseUrl
) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL is missing"
  );
}

if (
  !supabaseServiceRoleKey
) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is missing"
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
        autoRefreshToken:
          false,

        persistSession:
          false,
      },
    }
  );

// ============================================================
// TYPES
// ============================================================

type StripeRegistrationSession = {
  stripe_session_id?:
    string;

  stripe_customer_id?:
    string | null;

  stripe_subscription_id?:
    string | null;

  customer_email?:
    string;

  payment_status?:
    string;
};

type SignupNotificationInput = {
  registrationId:
    string;

  userId:
    string;

  organisationId:
    string;

  fullName:
    string | null;

  email:
    string;

  companyName:
    string | null;

  jobTitle:
    string | null;

  subscriptionTier:
    string;

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
// HTML ESCAPE
// ============================================================

function escapeHtml(
  value:
    unknown
) {
  return String(
    value ??
      ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}

// ============================================================
// FORMAT PLAN
// ============================================================

function formatTier(
  tier:
    string
) {
  const value =
    cleanString(
      tier
    );

  if (
    !value
  ) {
    return "Unknown";
  }

  return (
    value.charAt(
      0
    ).toUpperCase() +
    value
      .slice(
        1
      )
      .toLowerCase()
  );
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
      }
    )
    .format(
      new Date()
    );
}

// ============================================================
// DECRYPT PASSWORD
// ============================================================

function decryptPassword(
  value:
    string
) {
  const [
    ivHex,
    encryptedHex,
  ] =
    value.split(
      ":"
    );

  if (
    !ivHex ||
    !encryptedHex
  ) {
    throw new Error(
      "Encrypted password is malformed."
    );
  }

  const key =
    crypto
      .createHash(
        "sha256"
      )
      .update(
        encryptionKey
      )
      .digest();

  const decipher =
    crypto
      .createDecipheriv(
        "aes-256-cbc",
        key,
        Buffer.from(
          ivHex,
          "hex"
        )
      );

  const decrypted =
    Buffer.concat([
      decipher.update(
        Buffer.from(
          encryptedHex,
          "hex"
        )
      ),

      decipher.final(),
    ]);

  return decrypted
    .toString(
      "utf8"
    );
}

// ============================================================
// NORMALISE SUBSCRIPTION TIER
// ============================================================

function normaliseTier(
  value:
    string |
    null |
    undefined
) {
  const tier =
    String(
      value ||
        ""
    )
      .trim()
      .toLowerCase();

  if (
    tier ===
    "standard"
  ) {
    return "standard";
  }

  if (
    tier ===
    "professional"
  ) {
    return "professional";
  }

  if (
    tier ===
    "elite"
  ) {
    return "elite";
  }

  throw new Error(
    `Invalid subscription tier: ${
      value ||
      "missing"
    }`
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
  stripeCustomerId,
  stripeSubscriptionId,
  stripeSessionId,
  paymentStatus,
}: SignupNotificationInput) {
  // ==========================================================
  // RESEND CONFIGURATION
  // ==========================================================

  if (
    !resendApiKey
  ) {
    console.warn(
      "[SIGNUP NOTIFICATION] RESEND_API_KEY is missing. Admin signup email was not sent."
    );

    return;
  }

  if (
    !resendFromEmail
  ) {
    console.warn(
      "[SIGNUP NOTIFICATION] RESEND_FROM_EMAIL is missing. Admin signup email was not sent."
    );

    return;
  }

  // ==========================================================
  // DISPLAY VALUES
  // ==========================================================

  const displayName =
    cleanString(
      fullName
    ) ||
    "Not provided";

  const displayBusiness =
    cleanString(
      companyName
    ) ||
    "Not provided";

  const displayJobTitle =
    cleanString(
      jobTitle
    ) ||
    "Not provided";

  const displayTier =
    formatTier(
      subscriptionTier
    );

  const signupDate =
    formatSignupDate();

  // ==========================================================
  // SUBJECT
  // ==========================================================

  const subject =
    `🎉 New TOTS-OS signup — ${displayBusiness}`;

  // ==========================================================
  // TEXT VERSION
  // ==========================================================

  const text =
    [
      "New TOTS-OS signup",
      "",
      `Name: ${displayName}`,
      `Email: ${email}`,
      `Business: ${displayBusiness}`,
      `Job title: ${displayJobTitle}`,
      `Plan: ${displayTier}`,
      `Joined: ${signupDate}`,
      "",
      "Payment",
      `Payment status: ${paymentStatus || "Not supplied"}`,
      `Stripe customer: ${stripeCustomerId || "Not supplied"}`,
      `Stripe subscription: ${stripeSubscriptionId || "Not supplied"}`,
      `Stripe checkout session: ${stripeSessionId || "Not supplied"}`,
      "",
      "TOTS-OS",
      `User ID: ${userId}`,
      `Organisation ID: ${organisationId}`,
      `Registration ID: ${registrationId}`,
    ].join(
      "\n"
    );

  // ==========================================================
  // HTML VERSION
  // ==========================================================

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
            margin: 0;
            padding: 0;
            background: #f5f5f4;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
            color: #292524;
          "
        >
          <div
            style="
              width: 100%;
              padding: 32px 16px;
              box-sizing: border-box;
            "
          >
            <div
              style="
                max-width: 620px;
                margin: 0 auto;
                background: #ffffff;
                border: 1px solid #e7e5e4;
                border-radius: 24px;
                overflow: hidden;
              "
            >
              <div
                style="
                  padding: 32px;
                  background: #1c1917;
                  color: #ffffff;
                "
              >
                <div
                  style="
                    margin-bottom: 12px;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    color: #a9b897;
                  "
                >
                  TOTS-OS
                </div>

                <h1
                  style="
                    margin: 0;
                    font-size: 30px;
                    line-height: 1.2;
                  "
                >
                  🎉 New signup
                </h1>

                <p
                  style="
                    margin: 12px 0 0;
                    color: #d6d3d1;
                    line-height: 1.6;
                  "
                >
                  A new business has joined TOTS-OS.
                </p>
              </div>

              <div
                style="
                  padding: 32px;
                "
              >
                <div
                  style="
                    padding: 22px;
                    background: #f7f8f5;
                    border: 1px solid #e3e8df;
                    border-radius: 18px;
                    margin-bottom: 24px;
                  "
                >
                  <div
                    style="
                      margin-bottom: 8px;
                      font-size: 11px;
                      font-weight: 700;
                      letter-spacing: 1.5px;
                      text-transform: uppercase;
                      color: #829473;
                    "
                  >
                    New customer
                  </div>

                  <div
                    style="
                      font-size: 24px;
                      font-weight: 700;
                      color: #292524;
                    "
                  >
                    ${escapeHtml(
                      displayBusiness
                    )}
                  </div>

                  <div
                    style="
                      margin-top: 6px;
                      font-size: 14px;
                      color: #78716c;
                    "
                  >
                    ${escapeHtml(
                      displayTier
                    )} plan
                  </div>
                </div>

                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  style="
                    border-collapse: collapse;
                  "
                >
                  <tr>
                    <td
                      style="
                        padding: 10px 0;
                        color: #78716c;
                        font-size: 13px;
                      "
                    >
                      Name
                    </td>

                    <td
                      align="right"
                      style="
                        padding: 10px 0;
                        font-size: 13px;
                        font-weight: 600;
                      "
                    >
                      ${escapeHtml(
                        displayName
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding: 10px 0;
                        color: #78716c;
                        font-size: 13px;
                      "
                    >
                      Email
                    </td>

                    <td
                      align="right"
                      style="
                        padding: 10px 0;
                        font-size: 13px;
                        font-weight: 600;
                      "
                    >
                      ${escapeHtml(
                        email
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding: 10px 0;
                        color: #78716c;
                        font-size: 13px;
                      "
                    >
                      Job title
                    </td>

                    <td
                      align="right"
                      style="
                        padding: 10px 0;
                        font-size: 13px;
                        font-weight: 600;
                      "
                    >
                      ${escapeHtml(
                        displayJobTitle
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding: 10px 0;
                        color: #78716c;
                        font-size: 13px;
                      "
                    >
                      Plan
                    </td>

                    <td
                      align="right"
                      style="
                        padding: 10px 0;
                        font-size: 13px;
                        font-weight: 600;
                        color: #829473;
                      "
                    >
                      ${escapeHtml(
                        displayTier
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding: 10px 0;
                        color: #78716c;
                        font-size: 13px;
                      "
                    >
                      Joined
                    </td>

                    <td
                      align="right"
                      style="
                        padding: 10px 0;
                        font-size: 13px;
                        font-weight: 600;
                      "
                    >
                      ${escapeHtml(
                        signupDate
                      )}
                    </td>
                  </tr>
                </table>

                <div
                  style="
                    height: 1px;
                    background: #e7e5e4;
                    margin: 24px 0;
                  "
                ></div>

                <div
                  style="
                    margin-bottom: 12px;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                    color: #a8a29e;
                  "
                >
                  Stripe
                </div>

                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  style="
                    border-collapse: collapse;
                  "
                >
                  <tr>
                    <td
                      style="
                        padding: 7px 0;
                        color: #78716c;
                        font-size: 12px;
                      "
                    >
                      Payment status
                    </td>

                    <td
                      align="right"
                      style="
                        padding: 7px 0;
                        font-size: 12px;
                      "
                    >
                      ${escapeHtml(
                        paymentStatus ||
                        "Not supplied"
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding: 7px 0;
                        color: #78716c;
                        font-size: 12px;
                      "
                    >
                      Customer ID
                    </td>

                    <td
                      align="right"
                      style="
                        padding: 7px 0;
                        font-size: 11px;
                        font-family: monospace;
                      "
                    >
                      ${escapeHtml(
                        stripeCustomerId ||
                        "—"
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding: 7px 0;
                        color: #78716c;
                        font-size: 12px;
                      "
                    >
                      Subscription ID
                    </td>

                    <td
                      align="right"
                      style="
                        padding: 7px 0;
                        font-size: 11px;
                        font-family: monospace;
                      "
                    >
                      ${escapeHtml(
                        stripeSubscriptionId ||
                        "—"
                      )}
                    </td>
                  </tr>
                </table>

                <div
                  style="
                    height: 1px;
                    background: #e7e5e4;
                    margin: 24px 0;
                  "
                ></div>

                <div
                  style="
                    margin-bottom: 12px;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                    color: #a8a29e;
                  "
                >
                  Internal references
                </div>

                <div
                  style="
                    color: #78716c;
                    font-family: monospace;
                    font-size: 11px;
                    line-height: 1.8;
                    word-break: break-all;
                  "
                >
                  User:
                  ${escapeHtml(
                    userId
                  )}
                  <br />

                  Organisation:
                  ${escapeHtml(
                    organisationId
                  )}
                  <br />

                  Registration:
                  ${escapeHtml(
                    registrationId
                  )}
                </div>
              </div>

              <div
                style="
                  padding: 20px 32px;
                  border-top: 1px solid #e7e5e4;
                  color: #a8a29e;
                  font-size: 11px;
                "
              >
                Automatic notification from TOTS-OS
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

  // ==========================================================
  // SEND USING RESEND
  // ==========================================================

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
        }
      );

    if (
      !response.ok
    ) {
      const responseText =
        await response
          .text()
          .catch(
            () =>
              ""
          );

      console.error(
        "[SIGNUP NOTIFICATION] Resend returned an error:",
        {
          status:
            response.status,

          body:
            responseText,
        }
      );

      return;
    }

    const responseData =
      await response
        .json()
        .catch(
          () =>
            null
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
      }
    );
  } catch (
    error
  ) {
    console.error(
      "[SIGNUP NOTIFICATION] Failed to send new signup notification:",
      error
    );
  }
}

// ============================================================
// COMPLETE REGISTRATION
// ============================================================

export async function completeRegistration(
  registrationId:
    string,

  session?:
    StripeRegistrationSession
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
        "pending_registrations"
      )
      .select(
        "*"
      )
      .eq(
        "id",
        registrationId
      )
      .single();

  if (
    registrationError ||
    !registration
  ) {
    throw new Error(
      registrationError
        ?.message ||
      "Pending registration not found."
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
      }
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
  // SUBSCRIPTION TIER
  // ==========================================================

  const subscriptionTier =
    normaliseTier(
      registration
        .subscription_tier
    );

  // ==========================================================
  // EXISTING PARTIAL STATE
  //
  // This is critical for webhook recovery.
  //
  // If a previous webhook got as far as creating the user or
  // organisation and then failed, we reuse those records.
  //
  // We NEVER blindly create a second account.
  // ==========================================================

  let userId =
    cleanString(
      registration
        .user_id
    );

  let organisationId =
    cleanString(
      registration
        .organisation_id
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
          userId
        );

    if (
      existingAuthError ||
      !existingAuthUser
        ?.user
    ) {
      throw new Error(
        existingAuthError
          ?.message ||
        "Pending registration references an Auth user that no longer exists."
      );
    }

    console.log(
      "[REGISTRATION] Reusing existing Auth user:",
      {
        registrationId,
        userId,
      }
    );
  } else {
    // ========================================================
    // PASSWORD REQUIRED ONLY FOR BRAND NEW AUTH USER
    // ========================================================

    if (
      !registration
        .encrypted_password
    ) {
      throw new Error(
        "Encrypted password missing from registration."
      );
    }

    const password =
      decryptPassword(
        registration
          .encrypted_password
      );

    // ========================================================
    // CREATE AUTH USER
    // ========================================================

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
          },
        });

    if (
      authError ||
      !authData.user
    ) {
      throw new Error(
        authError
          ?.message ||
        "Failed to create Auth user."
      );
    }

    userId =
      authData
        .user
        .id;

    // ========================================================
    // IMMEDIATELY LINK USER
    //
    // Makes retries recoverable even if the next step fails.
    // ========================================================

    const {
      error:
        userLinkError,
    } =
      await supabase
        .from(
          "pending_registrations"
        )
        .update({
          user_id:
            userId,
        })
        .eq(
          "id",
          registrationId
        );

    if (
      userLinkError
    ) {
      throw new Error(
        `Auth user was created but pending registration could not be linked: ${userLinkError.message}`
      );
    }

    console.log(
      "[REGISTRATION] Auth user created:",
      {
        registrationId,
        userId,
      }
    );
  }

  // ==========================================================
  // ORGANISATION
  // ==========================================================

  if (
    organisationId
  ) {
    // ========================================================
    // RECOVER EXISTING ORGANISATION
    // ========================================================

    const {
      data:
        existingOrganisation,

      error:
        existingOrganisationError,
    } =
      await supabase
        .from(
          "organisations"
        )
        .select(
          "id"
        )
        .eq(
          "id",
          organisationId
        )
        .maybeSingle();

    if (
      existingOrganisationError
    ) {
      throw new Error(
        existingOrganisationError
          .message
      );
    }

    if (
      !existingOrganisation
    ) {
      throw new Error(
        "Pending registration references an organisation that no longer exists."
      );
    }

    // ========================================================
    // IMPORTANT:
    //
    // Stripe has confirmed payment before this function runs.
    // Therefore a paid organisation must be ACTIVE.
    //
    // This also repairs Cristian-style partial registrations
    // that were incorrectly left restricted/beta.
    // ========================================================

    const {
      error:
        organisationRepairError,
    } =
      await supabase
        .from(
          "organisations"
        )
        .update({
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

          subscription_tier:
            subscriptionTier,

          subscription_status:
            "active",

          access_status:
            "active",
        })
        .eq(
          "id",
          organisationId
        );

    if (
      organisationRepairError
    ) {
      throw new Error(
        organisationRepairError
          .message
      );
    }

    console.log(
      "[REGISTRATION] Existing organisation repaired:",
      {
        registrationId,
        organisationId,
        subscriptionTier,
      }
    );
  } else {
    // ========================================================
    // CREATE NEW PAID ORGANISATION
    // ========================================================

    const {
      data:
        organisation,

      error:
        organisationError,
    } =
      await supabase
        .from(
          "organisations"
        )
        .insert({
          name:
            registration
              .company_name ||
            "New Organisation",

          created_by:
            userId,

          available_seats:
            1,

          status:
            "active",

          email:
            registration
              .email,

          // ==================================================
          // MAIN TOTS-OS PLAN
          //
          // Payment has already been confirmed by Stripe.
          // ==================================================

          subscription_tier:
            subscriptionTier,

          subscription_status:
            "active",

          access_status:
            "active",

          // ==================================================
          // STORE IS A SEPARATE ADD-ON
          // ==================================================

          store_enabled:
            false,

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
        })
        .select(
          "id"
        )
        .single();

    if (
      organisationError ||
      !organisation
    ) {
      throw new Error(
        organisationError
          ?.message ||
        "Failed to create organisation."
      );
    }

    organisationId =
      organisation.id;

    // ========================================================
    // IMMEDIATELY LINK ORGANISATION
    // ========================================================

    const {
      error:
        organisationLinkError,
    } =
      await supabase
        .from(
          "pending_registrations"
        )
        .update({
          organisation_id:
            organisationId,
        })
        .eq(
          "id",
          registrationId
        );

    if (
      organisationLinkError
    ) {
      throw new Error(
        `Organisation was created but pending registration could not be linked: ${organisationLinkError.message}`
      );
    }

    console.log(
      "[REGISTRATION] Organisation created:",
      {
        registrationId,
        organisationId,
        subscriptionTier,
      }
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
        "pending_registrations"
      )
      .update({
        user_id:
          userId,

        organisation_id:
          organisationId,
      })
      .eq(
        "id",
        registrationId
      );

  if (
    finalLinkError
  ) {
    throw new Error(
      finalLinkError
        .message
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
        "organisation_members"
      )
      .select(
        "id, role"
      )
      .eq(
        "organisation_id",
        organisationId
      )
      .eq(
        "user_id",
        userId
      )
      .maybeSingle();

  if (
    membershipLookupError
  ) {
    throw new Error(
      membershipLookupError
        .message
    );
  }

  if (
    existingMembership
  ) {
    // ========================================================
    // ENSURE EXISTING MEMBERSHIP IS OWNER
    // ========================================================

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
            "organisation_members"
          )
          .update({
            role:
              "owner",
          })
          .eq(
            "id",
            existingMembership
              .id
          );

      if (
        membershipUpdateError
      ) {
        throw new Error(
          membershipUpdateError
            .message
        );
      }
    }
  } else {
    // ========================================================
    // CREATE OWNER MEMBERSHIP
    // ========================================================

    const {
      error:
        membershipCreateError,
    } =
      await supabase
        .from(
          "organisation_members"
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
          .message
      );
    }
  }

  // ==========================================================
  // PROFILE
  // ==========================================================

  const {
    error:
      profileError,
  } =
    await supabase
      .from(
        "profiles"
      )
      .update({
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

        subscription_tier:
          subscriptionTier,
      })
      .eq(
        "id",
        userId
      );

  if (
    profileError
  ) {
    throw new Error(
      profileError
        .message
    );
  }

  // ==========================================================
  // RE-ASSERT PAID ORGANISATION ACCESS
  //
  // This deliberately happens again near the end.
  //
  // If an earlier piece of application logic changed the
  // organisation while registration was being completed,
  // successful Stripe registration wins.
  // ==========================================================

  const {
    error:
      paidAccessError,
  } =
    await supabase
      .from(
        "organisations"
      )
      .update({
        subscription_tier:
          subscriptionTier,

        subscription_status:
          "active",

        access_status:
          "active",

        status:
          "active",
      })
      .eq(
        "id",
        organisationId
      );

  if (
    paidAccessError
  ) {
    throw new Error(
      paidAccessError
        .message
    );
  }

  // ==========================================================
  // MAIN TOTS-OS SUBSCRIPTION
  //
  // This is separate from Store.
  //
  // IMPORTANT:
  // Older/partial registrations may already have a row.
  // Therefore UPDATE if one exists, otherwise INSERT.
  // ==========================================================

  const {
    data:
      existingSubscription,

    error:
      subscriptionLookupError,
  } =
    await supabase
      .from(
        "subscriptions"
      )
      .select(
        "id"
      )
      .eq(
        "organisation_id",
        organisationId
      )
      .limit(
        1
      )
      .maybeSingle();

  if (
    subscriptionLookupError
  ) {
    throw new Error(
      subscriptionLookupError
        .message
    );
  }

  const stripeCustomerId =
    cleanString(
      session
        ?.stripe_customer_id
    ) ||
    null;

  const stripeSubscriptionId =
    cleanString(
      session
        ?.stripe_subscription_id
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

    // ========================================================
    // DON'T DESTROY GOOD STRIPE REFERENCES WITH NULL
    // ========================================================

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
          "subscriptions"
        )
        .update(
          subscriptionPayload
        )
        .eq(
          "id",
          existingSubscription
            .id
        );

    if (
      subscriptionUpdateError
    ) {
      throw new Error(
        subscriptionUpdateError
          .message
      );
    }
  } else {
    const {
      error:
        subscriptionCreateError,
    } =
      await supabase
        .from(
          "subscriptions"
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
          .message
      );
    }
  }

  // ==========================================================
  // MARK REGISTRATION COMPLETE
  //
  // This is intentionally the final critical database step.
  //
  // Once true, webhook retries become no-ops.
  // ==========================================================

  const {
    error:
      completeError,
  } =
    await supabase
      .from(
        "pending_registrations"
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
      })
      .eq(
        "id",
        registrationId
      );

  if (
    completeError
  ) {
    throw new Error(
      completeError
        .message
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

      email:
        registration
          .email,

      company:
        registration
          .company_name,

      stripeCustomerId,

      stripeSubscriptionId,
    }
  );

  // ==========================================================
  // ADMIN SIGNUP NOTIFICATION
  //
  // Notification failure NEVER rolls back customer access.
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

    stripeCustomerId,

    stripeSubscriptionId,

    stripeSessionId:
      cleanString(
        session
          ?.stripe_session_id
      ) ||
      null,

    paymentStatus:
      cleanString(
        session
          ?.payment_status
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