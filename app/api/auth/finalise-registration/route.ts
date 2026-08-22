import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { completeRegistration } from "@/lib/auth/completeRegistration";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ======================================================
// TYPES
// ======================================================

type PendingRegistration = {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  job_title: string | null;
  subscription_tier: string | null;
  completed: boolean;
  user_id: string | null;
  organisation_id: string | null;
  signup_notification_claimed_at: string | null;
  signup_notification_sent_at: string | null;
};

// ======================================================
// HTML SAFETY
// ======================================================

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ======================================================
// DISPLAY HELPERS
// ======================================================

function formatPlan(value: string | null) {
  if (!value) return "Not recorded";

  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(value);
}

// ======================================================
// SEND SIGNUP EMAIL
// ======================================================

async function sendSignupNotification(
  registration: PendingRegistration
) {
  const resendApiKey = process.env.RESEND_API_KEY;

  // Hardcoded so every successful signup notification
  // is sent to the TOTS-OS inbox.
  const notificationEmail = "hello@tots-os.co.uk";

  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is missing");
  }

  if (!fromEmail) {
    throw new Error("RESEND_FROM_EMAIL is missing");
  }

  const signupDate = new Date();

  const trialEndDate = new Date(signupDate);
  trialEndDate.setDate(trialEndDate.getDate() + 14);

  const companyName =
    registration.company_name?.trim() || "Company name not recorded";

  const fullName =
    registration.full_name?.trim() || "Name not recorded";

  const jobTitle =
    registration.job_title?.trim() || "Not provided";

  const plan = formatPlan(registration.subscription_tier);

  console.log(
    `Sending signup notification for ${registration.email} to ${notificationEmail}`
  );

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",

    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      from: fromEmail,

      to: [notificationEmail],

      subject: `🎉 New TOTS-OS signup — ${companyName}`,

      html: `
        <div
          style="
            background:#f7f5f2;
            padding:32px;
            font-family:Arial,Helvetica,sans-serif;
            color:#292524;
          "
        >
          <div
            style="
              max-width:620px;
              margin:0 auto;
              background:#ffffff;
              border:1px solid #e7e5e4;
              border-radius:24px;
              padding:32px;
            "
          >
            <div
              style="
                display:inline-block;
                background:#edf1e8;
                color:#748361;
                border-radius:999px;
                padding:8px 14px;
                font-size:11px;
                font-weight:700;
                letter-spacing:1.5px;
                text-transform:uppercase;
              "
            >
              New TOTS-OS signup
            </div>

            <h1
              style="
                margin:24px 0 8px;
                font-size:30px;
                line-height:1.2;
                color:#1c1917;
              "
            >
              A new business has joined! 🎉
            </h1>

            <p
              style="
                margin:0 0 28px;
                color:#78716c;
                font-size:15px;
                line-height:1.6;
              "
            >
              A new TOTS-OS account and 14-day trial have been
              successfully created.
            </p>

            <table
              role="presentation"
              style="
                width:100%;
                border-collapse:collapse;
                font-size:14px;
              "
            >
              <tr>
                <td style="padding:12px 0;color:#a8a29e;">
                  Name
                </td>

                <td
                  style="
                    padding:12px 0;
                    text-align:right;
                    font-weight:700;
                  "
                >
                  ${escapeHtml(fullName)}
                </td>
              </tr>

              <tr>
                <td
                  style="
                    padding:12px 0;
                    color:#a8a29e;
                    border-top:1px solid #f5f5f4;
                  "
                >
                  Business
                </td>

                <td
                  style="
                    padding:12px 0;
                    text-align:right;
                    font-weight:700;
                    border-top:1px solid #f5f5f4;
                  "
                >
                  ${escapeHtml(companyName)}
                </td>
              </tr>

              <tr>
                <td
                  style="
                    padding:12px 0;
                    color:#a8a29e;
                    border-top:1px solid #f5f5f4;
                  "
                >
                  Email
                </td>

                <td
                  style="
                    padding:12px 0;
                    text-align:right;
                    font-weight:700;
                    border-top:1px solid #f5f5f4;
                  "
                >
                  ${escapeHtml(registration.email)}
                </td>
              </tr>

              <tr>
                <td
                  style="
                    padding:12px 0;
                    color:#a8a29e;
                    border-top:1px solid #f5f5f4;
                  "
                >
                  Job title
                </td>

                <td
                  style="
                    padding:12px 0;
                    text-align:right;
                    font-weight:700;
                    border-top:1px solid #f5f5f4;
                  "
                >
                  ${escapeHtml(jobTitle)}
                </td>
              </tr>

              <tr>
                <td
                  style="
                    padding:12px 0;
                    color:#a8a29e;
                    border-top:1px solid #f5f5f4;
                  "
                >
                  Selected plan
                </td>

                <td
                  style="
                    padding:12px 0;
                    text-align:right;
                    font-weight:700;
                    border-top:1px solid #f5f5f4;
                  "
                >
                  ${escapeHtml(plan)}
                </td>
              </tr>

              <tr>
                <td
                  style="
                    padding:12px 0;
                    color:#a8a29e;
                    border-top:1px solid #f5f5f4;
                  "
                >
                  Trial started
                </td>

                <td
                  style="
                    padding:12px 0;
                    text-align:right;
                    font-weight:700;
                    border-top:1px solid #f5f5f4;
                  "
                >
                  ${escapeHtml(formatDate(signupDate))}
                </td>
              </tr>

              <tr>
                <td
                  style="
                    padding:12px 0;
                    color:#a8a29e;
                    border-top:1px solid #f5f5f4;
                  "
                >
                  Trial ends
                </td>

                <td
                  style="
                    padding:12px 0;
                    text-align:right;
                    font-weight:700;
                    border-top:1px solid #f5f5f4;
                  "
                >
                  ${escapeHtml(formatDate(trialEndDate))}
                </td>
              </tr>
            </table>

            <div
              style="
                margin-top:28px;
                background:#edf1e8;
                border-radius:16px;
                padding:16px;
                color:#59654c;
                font-size:13px;
                line-height:1.5;
              "
            >
              Their account, organisation and free trial were created
              successfully.
            </div>
          </div>
        </div>
      `,
    }),
  });

  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("Resend notification error:", responseData);

    throw new Error(
      responseData?.message ||
        responseData?.error ||
        "Signup notification could not be sent"
    );
  }

  console.log(
    "Signup notification accepted by Resend:",
    responseData
  );

  return responseData;
}

// ======================================================
// CLAIM AND SEND NOTIFICATION
// ======================================================

async function notifyAboutSignup(
  registration: PendingRegistration
) {
  /*
   * Atomically claim the notification.
   *
   * This prevents refreshes or duplicate calls from
   * sending the same signup notification repeatedly.
   */

  const { data: claimedRegistration, error: claimError } =
    await supabaseAdmin
      .from("pending_registrations")
      .update({
        signup_notification_claimed_at: new Date().toISOString(),
      })
      .eq("id", registration.id)
      .is("signup_notification_sent_at", null)
      .is("signup_notification_claimed_at", null)
      .select("*")
      .maybeSingle();

  if (claimError) {
    console.error("Could not claim signup notification:", claimError);
    return;
  }

  if (!claimedRegistration) {
    /*
     * The notification was already sent or another
     * request is currently sending it.
     */

    console.log(
      `Signup notification skipped for ${registration.email}: already sent or currently claimed.`
    );

    return;
  }

  try {
    await sendSignupNotification(
      claimedRegistration as PendingRegistration
    );

    const { error: updateError } = await supabaseAdmin
      .from("pending_registrations")
      .update({
        signup_notification_sent_at: new Date().toISOString(),
      })
      .eq("id", registration.id);

    if (updateError) {
      console.error(
        "Notification sent but status update failed:",
        updateError
      );
    } else {
      console.log(
        `Signup notification recorded as sent for ${registration.email}`
      );
    }
  } catch (notificationError) {
    console.error(
      "Signup notification failed:",
      notificationError
    );

    /*
     * Release the claim so another request or page
     * refresh can retry the notification.
     */

    const { error: releaseError } = await supabaseAdmin
      .from("pending_registrations")
      .update({
        signup_notification_claimed_at: null,
      })
      .eq("id", registration.id)
      .is("signup_notification_sent_at", null);

    if (releaseError) {
      console.error(
        "Could not release notification claim:",
        releaseError
      );
    }
  }
}

// ======================================================
// POST
// ======================================================

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        {
          error: "Missing Stripe session ID",
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // FIND PENDING REGISTRATION
    // ==================================================

    const { data: registration, error } = await supabaseAdmin
      .from("pending_registrations")
      .select("*")
      .eq("stripe_session_id", sessionId)
      .single();

    if (error || !registration) {
      console.error("Registration lookup failed:", error);

      return NextResponse.json(
        {
          error: "Registration not found",
        },
        {
          status: 404,
        }
      );
    }

    // ==================================================
    // ACCOUNT ALREADY CREATED
    // ==================================================

    if (registration.completed) {
      /*
       * Attempt the notification again if account creation
       * previously succeeded but email delivery failed.
       */

      await notifyAboutSignup(
        registration as PendingRegistration
      );

      return NextResponse.json(
        {
          success: true,
          message: "Account already created. You can sign in.",
          userId: registration.user_id,
          organisationId: registration.organisation_id,
          email: registration.email,
          recoveryLink: null,
        },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // ==================================================
    // COMPLETE REGISTRATION
    // ==================================================

    const result = await completeRegistration(registration.id, {
      stripe_session_id: sessionId,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      customer_email: registration.email,
      payment_status: "paid",
    });

    if (!result?.userId) {
      throw new Error("User account was not created");
    }

    // ==================================================
    // FETCH COMPLETED REGISTRATION
    // ==================================================

    const {
      data: completedRegistration,
      error: completedRegistrationError,
    } = await supabaseAdmin
      .from("pending_registrations")
      .select("*")
      .eq("id", registration.id)
      .single();

    if (completedRegistrationError || !completedRegistration) {
      console.error(
        "Completed registration lookup failed:",
        completedRegistrationError
      );
    } else {
      /*
       * Notification failure must not prevent the customer
       * from accessing the account they successfully created.
       */

      await notifyAboutSignup(
        completedRegistration as PendingRegistration
      );
    }

    // ==================================================
    // RESPONSE
    // ==================================================

    return NextResponse.json(
      {
        success: true,
        userId: result.userId,
        organisationId: result.organisationId,
        email: registration.email,
        recoveryLink: null,
        message: "Account created successfully. You can now sign in.",
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: unknown) {
    console.error("Finalise registration error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to complete registration",
      },
      {
        status: 500,
      }
    );
  }
}