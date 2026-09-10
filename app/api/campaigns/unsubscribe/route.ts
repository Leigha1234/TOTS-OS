import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  verifyCampaignUnsubscribeToken,
} from "@/lib/campaign-unsubscribe-token";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

const supabaseUrl =
  process.env
    .NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey =
  process.env
    .SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL"
  );
}

if (!serviceRoleKey) {
  throw new Error(
    "Missing SUPABASE_SERVICE_ROLE_KEY"
  );
}

const supabaseAdmin =
  createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession:
          false,

        autoRefreshToken:
          false,
      },
    }
  );

// ==================================================
// HELPERS
// ==================================================

function escapeHtml(
  value: string
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

function cleanEmail(
  value: unknown
) {
  return typeof value ===
    "string"
    ? value
        .trim()
        .toLowerCase()
    : "";
}

function pageHtml({
  title,
  message,
  token,
  completed = false,
}: {
  title: string;
  message: string;
  token?: string;
  completed?: boolean;
}) {
  const safeTitle =
    escapeHtml(
      title
    );

  const safeMessage =
    escapeHtml(
      message
    );

  const safeToken =
    token
      ? escapeHtml(
          token
        )
      : "";

  const actionHtml =
    completed
      ? `
        <a
          href="https://tots-os.co.uk"
          style="
            display:inline-block;
            margin-top:24px;
            color:#78716c;
            font-size:13px;
            font-weight:600;
            text-decoration:underline;
            text-underline-offset:3px;
          "
        >
          Return to TOTS-OS
        </a>
      `
      : `
        <form
          method="POST"
          style="
            margin-top:28px;
          "
        >
          <input
            type="hidden"
            name="token"
            value="${safeToken}"
          />

          <button
            type="submit"
            style="
              width:100%;
              border:0;
              border-radius:14px;
              padding:14px 18px;
              background:#4f4a46;
              color:#ffffff;
              font-family:Arial,sans-serif;
              font-size:14px;
              font-weight:700;
              cursor:pointer;
            "
          >
            Unsubscribe
          </button>
        </form>

        <p
          style="
            margin:14px 0 0;
            font-size:11px;
            line-height:1.5;
            color:#a8a29e;
          "
        >
          Nothing will change unless you press the button above.
        </p>
      `;

  return `
    <!doctype html>

    <html>
      <head>
        <meta
          charset="utf-8"
        />

        <meta
          name="viewport"
          content="width=device-width,initial-scale=1"
        />

        <title>
          ${safeTitle}
        </title>
      </head>

      <body
        style="
          margin:0;
          padding:24px;
          min-height:100vh;
          box-sizing:border-box;
          display:flex;
          align-items:center;
          justify-content:center;
          background:#faf8f5;
          color:#1c1917;
          font-family:Arial,sans-serif;
        "
      >

        <div
          style="
            width:100%;
            max-width:560px;
            padding:36px;
            box-sizing:border-box;
            border:1px solid #e7e5e4;
            border-radius:24px;
            background:#ffffff;
            text-align:center;
            box-shadow:
              0 12px 40px
              rgba(28,25,23,0.06);
          "
        >

          <div
            style="
              display:inline-block;
              margin-bottom:22px;
              padding:8px 12px;
              border-radius:999px;
              background:#eef1eb;
              color:#68785e;
              font-size:10px;
              font-weight:700;
              text-transform:uppercase;
              letter-spacing:0.16em;
            "
          >
            TOTS-OS
          </div>

          <h1
            style="
              margin:0 0 12px;
              font-size:26px;
              line-height:1.2;
              color:#292524;
            "
          >
            ${safeTitle}
          </h1>

          <p
            style="
              margin:0;
              color:#78716c;
              font-size:14px;
              line-height:1.65;
            "
          >
            ${safeMessage}
          </p>

          ${actionHtml}

        </div>

      </body>
    </html>
  `;
}

function htmlResponse(
  content: string,
  status = 200
) {
  return new NextResponse(
    content,
    {
      status,

      headers: {
        "Content-Type":
          "text/html; charset=utf-8",

        "Cache-Control":
          "no-store, max-age=0",
      },
    }
  );
}

// ==================================================
// GET
// ==================================================
//
// IMPORTANT:
// GET does not unsubscribe.
// It only verifies the token and displays a
// confirmation page.
//
// This helps protect against email-security scanners
// automatically opening links.
//

export async function GET(
  request: Request
) {
  try {
    const url =
      new URL(
        request.url
      );

    const token =
      url.searchParams.get(
        "token"
      );

    if (!token) {
      return htmlResponse(
        pageHtml({
          title:
            "Invalid unsubscribe link",

          message:
            "This unsubscribe link is missing the required token.",

          completed:
            true,
        }),
        400
      );
    }

    const payload =
      verifyCampaignUnsubscribeToken(
        token
      );

    if (!payload) {
      return htmlResponse(
        pageHtml({
          title:
            "This link is no longer valid",

          message:
            "The unsubscribe link is invalid or has expired.",

          completed:
            true,
        }),
        400
      );
    }

    return htmlResponse(
      pageHtml({
        title:
          "Unsubscribe from emails?",

        message:
          "You will no longer receive marketing emails from this organisation.",

        token,
      })
    );
  } catch (
    error
  ) {
    console.error(
      "UNSUBSCRIBE GET ERROR:",
      error
    );

    return htmlResponse(
      pageHtml({
        title:
          "Something went wrong",

        message:
          "We could not open this unsubscribe request. Please try again.",

        completed:
          true,
      }),
      500
    );
  }
}

// ==================================================
// POST
// ==================================================

export async function POST(
  request: Request
) {
  try {
    // ==================================================
    // READ TOKEN
    // ==================================================

    const contentType =
      request.headers.get(
        "content-type"
      ) || "";

    let token =
      "";

    if (
      contentType.includes(
        "application/json"
      )
    ) {
      const body =
        await request.json();

      token =
        typeof body?.token ===
        "string"
          ? body.token
          : "";
    } else {
      const formData =
        await request.formData();

      const formToken =
        formData.get(
          "token"
        );

      token =
        typeof formToken ===
        "string"
          ? formToken
          : "";
    }

    if (!token) {
      return htmlResponse(
        pageHtml({
          title:
            "Invalid unsubscribe request",

          message:
            "The unsubscribe token is missing.",

          completed:
            true,
        }),
        400
      );
    }

    // ==================================================
    // VERIFY TOKEN
    // ==================================================

    const payload =
      verifyCampaignUnsubscribeToken(
        token
      );

    if (!payload) {
      return htmlResponse(
        pageHtml({
          title:
            "This link is no longer valid",

          message:
            "The unsubscribe link is invalid or has expired.",

          completed:
            true,
        }),
        400
      );
    }

    const email =
      cleanEmail(
        payload.email
      );

    if (!email) {
      return htmlResponse(
        pageHtml({
          title:
            "Invalid unsubscribe request",

          message:
            "The email address attached to this unsubscribe link is invalid.",

          completed:
            true,
        }),
        400
      );
    }

    // ==================================================
    // GLOBAL ORGANISATION SUPPRESSION
    // ==================================================
    //
    // This prevents the same email from being manually
    // re-added to another list and accidentally mailed
    // again later.
    //

    const {
      error:
        suppressionError,
    } = await supabaseAdmin
      .from(
        "campaign_unsubscribes"
      )
      .upsert(
        {
          organisation_id:
            payload.organisationId,

          email,

          source:
            payload.source,

          unsubscribed_at:
            new Date()
              .toISOString(),
        },
        {
          onConflict:
            "organisation_id,email",
        }
      );

    if (
      suppressionError
    ) {
      console.error(
        "FAILED TO SAVE UNSUBSCRIBE SUPPRESSION:",
        suppressionError
      );

      throw new Error(
        suppressionError.message
      );
    }

    // ==================================================
    // PROFILE RECIPIENT
    // ==================================================

    if (
      payload.source ===
      "profile"
    ) {
      const {
        error:
          profileUpdateError,
      } = await supabaseAdmin
        .from(
          "profiles"
        )
        .update({
          is_subscribed:
            false,
        })
        .eq(
          "id",
          payload.recipientId
        )
        .eq(
          "email",
          email
        );

      if (
        profileUpdateError
      ) {
        console.error(
          "FAILED TO UPDATE PROFILE SUBSCRIPTION:",
          profileUpdateError
        );

        throw new Error(
          profileUpdateError.message
        );
      }

      const {
        error:
          profileListError,
      } = await supabaseAdmin
        .from(
          "profile_subscriber_lists"
        )
        .delete()
        .eq(
          "profile_id",
          payload.recipientId
        )
        .eq(
          "list_id",
          payload.listId
        );

      if (
        profileListError
      ) {
        console.warn(
          "Could not remove profile from subscriber list:",
          profileListError.message
        );
      }
    }

    // ==================================================
    // MANUAL RECIPIENT
    // ==================================================

    if (
      payload.source ===
      "manual"
    ) {
      const {
        error:
          manualDeleteError,
      } = await supabaseAdmin
        .from(
          "campaign_list_emails"
        )
        .delete()
        .eq(
          "list_id",
          payload.listId
        )
        .eq(
          "email",
          email
        )
        .eq(
          "organisation_id",
          payload.organisationId
        );

      if (
        manualDeleteError
      ) {
        console.warn(
          "Could not remove manual subscriber from list:",
          manualDeleteError.message
        );
      }
    }

    // ==================================================
    // SUCCESS
    // ==================================================

    console.log(
      "CAMPAIGN RECIPIENT UNSUBSCRIBED:",
      {
        organisationId:
          payload.organisationId,

        listId:
          payload.listId,

        recipientId:
          payload.recipientId,

        source:
          payload.source,

        email,
      }
    );

    return htmlResponse(
      pageHtml({
        title:
          "You have been unsubscribed",

        message:
          "You will no longer receive marketing emails from this organisation.",

        completed:
          true,
      })
    );
  } catch (
    error
  ) {
    console.error(
      "UNSUBSCRIBE POST ERROR:",
      error
    );

    return htmlResponse(
      pageHtml({
        title:
          "Something went wrong",

        message:
          "We could not complete your unsubscribe request. Please try again.",

        completed:
          true,
      }),
      500
    );
  }
}
