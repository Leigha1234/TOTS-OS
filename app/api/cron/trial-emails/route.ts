import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  Resend,
} from "resend";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

// ============================================================
// ENVIRONMENT
// ============================================================

const supabaseUrl =
  process.env
    .NEXT_PUBLIC_SUPABASE_URL;

const supabaseServiceRoleKey =
  process.env
    .SUPABASE_SERVICE_ROLE_KEY;

const resendApiKey =
  process.env
    .RESEND_API_KEY;

const cronSecret =
  process.env
    .CRON_SECRET;

const siteUrl =
  (
    process.env
      .NEXT_PUBLIC_SITE_URL ||
    process.env
      .SITE_URL ||
    "https://www.tots-os.co.uk"
  ).replace(
    /\/$/,
    ""
  );

const fromEmail =
  process.env
    .RESEND_FROM_EMAIL ||
  "TOTS-OS <hello@tots-os.co.uk>";

// ============================================================
// VALIDATE ENVIRONMENT
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

if (
  !resendApiKey
) {
  throw new Error(
    "RESEND_API_KEY is missing"
  );
}

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

const resend =
  new Resend(
    resendApiKey
  );

// ============================================================
// TYPES
// ============================================================

type TrialOrganisation = {
  id: string;

  name:
    | string
    | null;

  subscription_tier:
    | string
    | null;

  subscription_status:
    | string
    | null;

  access_status:
    | string
    | null;

  retention_trial_ends_at:
    | string
    | null;

  trial_ending_email_sent_at:
    | string
    | null;

  trial_end_email_sent_at:
    | string
    | null;
};

type TrialEmailType =
  | "ending"
  | "ended";

// ============================================================
// HELPERS
// ============================================================

function cleanString(
  value: unknown
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
// CRON AUTH
// ============================================================

function isAuthorised(
  req: Request
) {
  /*
   * If CRON_SECRET exists, require:
   *
   * Authorization: Bearer <CRON_SECRET>
   *
   * Vercel Cron can send this automatically when CRON_SECRET
   * is configured for the project.
   */
  if (
    cronSecret
  ) {
    const authHeader =
      req.headers.get(
        "authorization"
      );

    return (
      authHeader ===
      `Bearer ${cronSecret}`
    );
  }

  /*
   * In production, CRON_SECRET should always be configured.
   * This fallback is kept only so local development is not
   * blocked when the variable is absent.
   */
  return (
    process.env
      .NODE_ENV !==
    "production"
  );
}

// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml(
  value: string
) {
  return value
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
// FIND A USER FOR AN ORGANISATION
// ============================================================

async function resolveOrganisationUserId(
  organisationId: string
): Promise<string | null> {
  // =========================================================
  // 1. PRIMARY: profiles.organisation_id
  // =========================================================

  const {
    data:
      profileRows,

    error:
      profileError,
  } =
    await supabaseAdmin
      .from(
        "profiles"
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
      );

  if (
    profileError
  ) {
    console.error(
      "[TRIAL EMAILS] Profile lookup failed:",
      {
        organisationId,
        error:
          profileError,
      }
    );
  }

  const profileId =
    cleanString(
      profileRows?.[0]
        ?.id
    );

  if (
    profileId
  ) {
    return profileId;
  }

  // =========================================================
  // 2. FALLBACK: organisation_members
  // =========================================================

  const {
    data:
      membershipRows,

    error:
      membershipError,
  } =
    await supabaseAdmin
      .from(
        "organisation_members"
      )
      .select(
        "user_id"
      )
      .eq(
        "organisation_id",
        organisationId
      )
      .limit(
        1
      );

  if (
    membershipError
  ) {
    console.error(
      "[TRIAL EMAILS] organisation_members lookup failed:",
      {
        organisationId,
        error:
          membershipError,
      }
    );
  }

  const membershipUserId =
    cleanString(
      membershipRows?.[0]
        ?.user_id
    );

  if (
    membershipUserId
  ) {
    return membershipUserId;
  }

  // =========================================================
  // 3. FALLBACK: user_organisations
  // =========================================================

  const {
    data:
      userOrganisationRows,

    error:
      userOrganisationError,
  } =
    await supabaseAdmin
      .from(
        "user_organisations"
      )
      .select(
        "user_id"
      )
      .eq(
        "organisation_id",
        organisationId
      )
      .limit(
        1
      );

  if (
    userOrganisationError
  ) {
    console.error(
      "[TRIAL EMAILS] user_organisations lookup failed:",
      {
        organisationId,
        error:
          userOrganisationError,
      }
    );
  }

  const userOrganisationUserId =
    cleanString(
      userOrganisationRows?.[0]
        ?.user_id
    );

  if (
    userOrganisationUserId
  ) {
    return userOrganisationUserId;
  }

  // =========================================================
  // 4. LEGACY: organisations.created_by
  // =========================================================

  const {
    data:
      organisation,

    error:
      organisationError,
  } =
    await supabaseAdmin
      .from(
        "organisations"
      )
      .select(
        "created_by"
      )
      .eq(
        "id",
        organisationId
      )
      .maybeSingle();

  if (
    organisationError
  ) {
    console.error(
      "[TRIAL EMAILS] created_by lookup failed:",
      {
        organisationId,
        error:
          organisationError,
      }
    );
  }

  const createdBy =
    cleanString(
      organisation
        ?.created_by
    );

  return (
    createdBy ||
    null
  );
}

// ============================================================
// RESOLVE EMAIL FROM SUPABASE AUTH
// ============================================================

async function resolveOrganisationEmail(
  organisationId: string
): Promise<string | null> {
  const userId =
    await resolveOrganisationUserId(
      organisationId
    );

  if (
    !userId
  ) {
    return null;
  }

  const {
    data,
    error,
  } =
    await supabaseAdmin
      .auth
      .admin
      .getUserById(
        userId
      );

  if (
    error
  ) {
    console.error(
      "[TRIAL EMAILS] Auth user lookup failed:",
      {
        organisationId,
        userId,
        error,
      }
    );

    return null;
  }

  const email =
    cleanString(
      data.user
        ?.email
    ).toLowerCase();

  return (
    email ||
    null
  );
}

// ============================================================
// EMAIL CONTENT
// ============================================================

function buildEmail({
  type,
  organisationName,
}: {
  type: TrialEmailType;
  organisationName:
    | string
    | null;
}) {
  const safeOrganisationName =
    escapeHtml(
      cleanString(
        organisationName
      )
    );

  const greeting =
    safeOrganisationName
      ? `Hi ${safeOrganisationName},`
      : "Hi,";

  const billingUrl =
    `${siteUrl}/billing?existing=true`;

  if (
    type ===
    "ending"
  ) {
    const subject =
      "Your TOTS-OS trial ends tomorrow 👀";

    const preview =
      "You have one day left on your 14-day TOTS-OS free trial.";

    const html =
      `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f7f5f2;font-family:Arial,Helvetica,sans-serif;color:#2f2c2a;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      ${preview}
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f5f2;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:42px 38px;">
                <div style="font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:#7e8873;font-weight:700;margin-bottom:18px;">
                  TOTS-OS
                </div>

                <h1 style="margin:0 0 18px;font-size:32px;line-height:1.15;color:#2f2c2a;">
                  Your free trial ends tomorrow 👀
                </h1>

                <p style="font-size:16px;line-height:1.7;margin:0 0 18px;">
                  ${greeting}
                </p>

                <p style="font-size:16px;line-height:1.7;margin:0 0 18px;">
                  You have one day left on your 14-day TOTS-OS free trial.
                </p>

                <p style="font-size:16px;line-height:1.7;margin:0 0 18px;">
                  Everything you've set up will stay exactly where it is — your clients, projects, tasks, notes, finances and workspace aren't going anywhere.
                </p>

                <p style="font-size:16px;line-height:1.7;margin:0 0 28px;">
                  If you'd like to keep using TOTS-OS after your trial, you can choose the plan that suits your business and carry on without starting again.
                </p>

                <table role="presentation" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="background:#2f2c2a;border-radius:10px;">
                      <a
                        href="${billingUrl}"
                        style="display:inline-block;padding:14px 22px;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;"
                      >
                        Choose your plan
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="font-size:15px;line-height:1.7;margin:30px 0 0;color:#66615e;">
                  Sam &amp; Leigha 🤍<br />
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
      `.trim();

    const text =
      `${greeting}

Your TOTS-OS free trial ends tomorrow.

You have one day left on your 14-day TOTS-OS free trial.

Everything you've set up will stay exactly where it is — your clients, projects, tasks, notes, finances and workspace aren't going anywhere.

If you'd like to keep using TOTS-OS after your trial, choose the plan that suits your business and carry on without starting again.

Choose your plan:
${billingUrl}

Sam & Leigha 🤍
TOTS-OS`;

    return {
      subject,
      html,
      text,
    };
  }

  const subject =
    "Your TOTS-OS free trial has ended 🤍";

  const preview =
    "Your 14 days are up — everything you've set up is still waiting for you.";

  const html =
    `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f7f5f2;font-family:Arial,Helvetica,sans-serif;color:#2f2c2a;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      ${preview}
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f5f2;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:42px 38px;">
                <div style="font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:#7e8873;font-weight:700;margin-bottom:18px;">
                  TOTS-OS
                </div>

                <h1 style="margin:0 0 18px;font-size:32px;line-height:1.15;color:#2f2c2a;">
                  Your TOTS-OS free trial has ended 🤍
                </h1>

                <p style="font-size:16px;line-height:1.7;margin:0 0 18px;">
                  ${greeting}
                </p>

                <p style="font-size:16px;line-height:1.7;margin:0 0 18px;">
                  Your 14-day TOTS-OS free trial has now come to an end.
                </p>

                <p style="font-size:16px;line-height:1.7;margin:0 0 18px;">
                  We hope the last two weeks have given you a chance to see what running your business from one place can actually feel like.
                </p>

                <p style="font-size:16px;line-height:1.7;margin:0 0 22px;">
                  Everything you've set up is still there — your clients, projects, tasks, notes, finances and workspace haven't disappeared.
                </p>

                <div style="background:#f7f5f2;border-radius:12px;padding:18px 20px;margin:0 0 26px;">
                  <div style="font-size:15px;line-height:1.8;">
                    <strong>Standard</strong> — £29/month<br />
                    <strong>Professional</strong> — £59/month<br />
                    <strong>Elite</strong> — £99/month
                  </div>
                </div>

                <p style="font-size:16px;line-height:1.7;margin:0 0 28px;">
                  Choose the plan that suits your business and carry on exactly where you left off.
                </p>

                <table role="presentation" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="background:#2f2c2a;border-radius:10px;">
                      <a
                        href="${billingUrl}"
                        style="display:inline-block;padding:14px 22px;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;"
                      >
                        Continue with TOTS-OS
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="font-size:15px;line-height:1.7;margin:30px 0 0;color:#66615e;">
                  Sam &amp; Leigha 🤍<br />
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
    `.trim();

  const text =
    `${greeting}

Your 14-day TOTS-OS free trial has now come to an end.

We hope the last two weeks have given you a chance to see what running your business from one place can actually feel like.

Everything you've set up is still there — your clients, projects, tasks, notes, finances and workspace haven't disappeared.

Standard — £29/month
Professional — £59/month
Elite — £99/month

Choose the plan that suits your business and carry on exactly where you left off.

Continue with TOTS-OS:
${billingUrl}

Sam & Leigha 🤍
TOTS-OS`;

  return {
    subject,
    html,
    text,
  };
}

// ============================================================
// SEND EMAIL
// ============================================================

async function sendTrialEmail({
  organisation,
  type,
}: {
  organisation:
    TrialOrganisation;

  type:
    TrialEmailType;
}) {
  const to =
    await resolveOrganisationEmail(
      organisation.id
    );

  if (
    !to
  ) {
    throw new Error(
      `No email could be resolved for organisation ${organisation.id}.`
    );
  }

  const email =
    buildEmail({
      type,

      organisationName:
        organisation.name,
    });

  const idempotencyKey =
    type ===
    "ending"
      ? `tots-trial-ending/${organisation.id}/${organisation.retention_trial_ends_at || "unknown"}`
      : `tots-trial-ended/${organisation.id}/${organisation.retention_trial_ends_at || "unknown"}`;

  const result =
    await resend.emails.send(
      {
        from:
          fromEmail,

        to: [
          to,
        ],

        subject:
          email.subject,

        html:
          email.html,

        text:
          email.text,
      },
      {
        idempotencyKey,
      }
    );

  if (
    result.error
  ) {
    throw new Error(
      result.error.message ||
      "Resend could not send the trial email."
    );
  }

  return {
    to,

    resendId:
      result.data?.id ||
      null,
  };
}

// ============================================================
// PROCESS ENDING-SOON EMAILS
// ============================================================

async function processEndingSoonTrials(
  now: Date
) {
  const tomorrow =
    new Date(
      now.getTime() +
        24 *
          60 *
          60 *
          1000
    );

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
          subscription_tier,
          subscription_status,
          access_status,
          retention_trial_ends_at,
          trial_ending_email_sent_at,
          trial_end_email_sent_at
        `
      )
      .eq(
        "subscription_status",
        "trial"
      )
      .not(
        "retention_trial_ends_at",
        "is",
        null
      )
      .gt(
        "retention_trial_ends_at",
        now.toISOString()
      )
      .lte(
        "retention_trial_ends_at",
        tomorrow.toISOString()
      )
      .is(
        "trial_ending_email_sent_at",
        null
      )
      .order(
        "retention_trial_ends_at",
        {
          ascending:
            true,
        }
      )
      .limit(
        100
      );

  if (
    error
  ) {
    throw new Error(
      `Ending-soon trial lookup failed: ${error.message}`
    );
  }

  const organisations =
    (
      data ||
      []
    ) as TrialOrganisation[];

  const results: {
    organisationId:
      string;
    sent:
      boolean;
    email?:
      string;
    error?:
      string;
  }[] = [];

  for (
    const organisation of
    organisations
  ) {
    try {
      const sent =
        await sendTrialEmail({
          organisation,

          type:
            "ending",
        });

      const sentAt =
        new Date()
          .toISOString();

      const {
        error:
          updateError,
      } =
        await supabaseAdmin
          .from(
            "organisations"
          )
          .update({
            trial_ending_email_sent_at:
              sentAt,
          })
          .eq(
            "id",
            organisation.id
          )
          .is(
            "trial_ending_email_sent_at",
            null
          );

      if (
        updateError
      ) {
        throw new Error(
          `Email sent, but trial_ending_email_sent_at could not be saved: ${updateError.message}`
        );
      }

      results.push({
        organisationId:
          organisation.id,

        sent:
          true,

        email:
          sent.to,
      });
    } catch (
      error
    ) {
      console.error(
        "[TRIAL EMAILS] Ending-soon email failed:",
        {
          organisationId:
            organisation.id,

          error,
        }
      );

      results.push({
        organisationId:
          organisation.id,

        sent:
          false,

        error:
          error instanceof
            Error
            ? error.message
            : "Unknown error",
      });
    }
  }

  return results;
}

// ============================================================
// PROCESS ENDED TRIALS
// ============================================================

async function processEndedTrials(
  now: Date
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
          subscription_tier,
          subscription_status,
          access_status,
          retention_trial_ends_at,
          trial_ending_email_sent_at,
          trial_end_email_sent_at
        `
      )
      .eq(
        "subscription_status",
        "trial"
      )
      .not(
        "retention_trial_ends_at",
        "is",
        null
      )
      .lte(
        "retention_trial_ends_at",
        now.toISOString()
      )
      .is(
        "trial_end_email_sent_at",
        null
      )
      .order(
        "retention_trial_ends_at",
        {
          ascending:
            true,
        }
      )
      .limit(
        100
      );

  if (
    error
  ) {
    throw new Error(
      `Expired trial lookup failed: ${error.message}`
    );
  }

  const organisations =
    (
      data ||
      []
    ) as TrialOrganisation[];

  const results: {
    organisationId:
      string;
    sent:
      boolean;
    email?:
      string;
    error?:
      string;
  }[] = [];

  for (
    const organisation of
    organisations
  ) {
    try {
      /*
       * Restrict access first. The access route also calculates
       * this dynamically, but doing it here keeps the stored
       * access_status in sync as soon as the cron runs.
       */
      if (
        organisation
          .access_status !==
        "restricted"
      ) {
        const {
          error:
            accessError,
        } =
          await supabaseAdmin
            .from(
              "organisations"
            )
            .update({
              access_status:
                "restricted",
            })
            .eq(
              "id",
              organisation.id
            )
            .eq(
              "subscription_status",
              "trial"
            );

        if (
          accessError
        ) {
          console.error(
            "[TRIAL EMAILS] Could not restrict expired trial:",
            {
              organisationId:
                organisation.id,

              error:
                accessError,
            }
          );
        }
      }

      const sent =
        await sendTrialEmail({
          organisation,

          type:
            "ended",
        });

      const sentAt =
        new Date()
          .toISOString();

      const {
        error:
          updateError,
      } =
        await supabaseAdmin
          .from(
            "organisations"
          )
          .update({
            trial_end_email_sent_at:
              sentAt,

            access_status:
              "restricted",
          })
          .eq(
            "id",
            organisation.id
          )
          .eq(
            "subscription_status",
            "trial"
          )
          .is(
            "trial_end_email_sent_at",
            null
          );

      if (
        updateError
      ) {
        throw new Error(
          `Email sent, but trial_end_email_sent_at could not be saved: ${updateError.message}`
        );
      }

      results.push({
        organisationId:
          organisation.id,

        sent:
          true,

        email:
          sent.to,
      });
    } catch (
      error
    ) {
      console.error(
        "[TRIAL EMAILS] Trial-ended email failed:",
        {
          organisationId:
            organisation.id,

          error,
        }
      );

      results.push({
        organisationId:
          organisation.id,

        sent:
          false,

        error:
          error instanceof
            Error
            ? error.message
            : "Unknown error",
      });
    }
  }

  return results;
}

// ============================================================
// RUN
// ============================================================

async function runTrialEmailCron(
  req: Request
) {
  if (
    !isAuthorised(
      req
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Unauthorized",
      },
      {
        status:
          401,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }

  try {
    const now =
      new Date();

    /*
     * Process expired trials first so a trial that has just
     * expired can never receive the "ends tomorrow" email.
     */
    const ended =
      await processEndedTrials(
        now
      );

    const endingSoon =
      await processEndingSoonTrials(
        now
      );

    const endedSent =
      ended.filter(
        (
          item
        ) =>
          item.sent
      ).length;

    const endingSoonSent =
      endingSoon.filter(
        (
          item
        ) =>
          item.sent
      ).length;

    console.log(
      "[TRIAL EMAILS] Cron complete:",
      {
        ranAt:
          now.toISOString(),

        endedChecked:
          ended.length,

        endedSent,

        endingSoonChecked:
          endingSoon.length,

        endingSoonSent,
      }
    );

    return NextResponse.json(
      {
        success:
          true,

        ranAt:
          now.toISOString(),

        ended: {
          checked:
            ended.length,

          sent:
            endedSent,

          failed:
            ended.length -
            endedSent,

          results:
            ended,
        },

        endingSoon: {
          checked:
            endingSoon.length,

          sent:
            endingSoonSent,

          failed:
            endingSoon.length -
            endingSoonSent,

          results:
            endingSoon,
        },
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
    error
  ) {
    console.error(
      "[TRIAL EMAILS] Cron failed:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        error:
          error instanceof
            Error
            ? error.message
            : "Trial email cron failed.",
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

// ============================================================
// GET
// ============================================================

export async function GET(
  req: Request
) {
  return runTrialEmailCron(
    req
  );
}

// ============================================================
// POST
//
// Handy for manually triggering/testing the route while using
// the same Bearer CRON_SECRET protection.
// ============================================================

export async function POST(
  req: Request
) {
  return runTrialEmailCron(
    req
  );
}
