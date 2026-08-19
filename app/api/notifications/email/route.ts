import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// ============================================================
// TYPES
// ============================================================

type NotificationType =
  | "project_member_added"
  | "task_assigned"
  | "task_created";

type NotificationPayload = {
  type?: NotificationType;
  projectId?: string;
  taskId?: string;
  content?: string;
  userId?: string;
  email?: string;
};

type RecipientProfile = {
  id: string;
  email?: string | null;
  full_name?: string | null;
};

type ProjectRow = {
  id: string;
  name?: string | null;
  organisation_id?: string | null;
  user_id?: string | null;
};

type TaskRow = {
  id: string;
  title?: string | null;
  description?: string | null;
  assigned_to?: string | null;
  user_id?: string | null;
  project_id?: string | null;
  organisation_id?: string | null;
};

// ============================================================
// CONFIG
// ============================================================

const APP_NAME = "TOTS-OS";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:3000";

const RESEND_API_KEY =
  process.env.RESEND_API_KEY || "";

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ||
  "TOTS-OS <notifications@yourdomain.com>";

// ============================================================
// HELPERS
// ============================================================

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getFirstName(
  value?: string | null
) {
  const cleaned =
    String(value || "")
      .trim();

  if (!cleaned) {
    return "there";
  }

  return (
    cleaned.split(/\s+/)[0] ||
    "there"
  );
}

function buildEmailTemplate({
  title,
  preview,
  recipientName,
  body,
  buttonText,
  buttonUrl,
}: {
  title: string;
  preview: string;
  recipientName?: string | null;
  body: string;
  buttonText?: string;
  buttonUrl?: string;
}) {
  const safeTitle =
    escapeHtml(title);

  const safePreview =
    escapeHtml(preview);

  const safeName =
    escapeHtml(
      getFirstName(
        recipientName
      )
    );

  const safeBody =
    escapeHtml(body).replace(
      /\n/g,
      "<br />"
    );

  const actionButton =
    buttonText &&
    buttonUrl
      ? `
        <tr>
          <td style="padding-top:28px;">
            <a
              href="${escapeHtml(
                buttonUrl
              )}"
              style="
                display:inline-block;
                background:#1c1917;
                color:#ffffff;
                text-decoration:none;
                padding:14px 22px;
                border-radius:12px;
                font-family:Arial,Helvetica,sans-serif;
                font-size:12px;
                font-weight:700;
                letter-spacing:0.04em;
              "
            >
              ${escapeHtml(
                buttonText
              )}
            </a>
          </td>
        </tr>
      `
      : "";

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f8f7f4;
  "
>
  <div
    style="
      display:none;
      max-height:0;
      overflow:hidden;
      opacity:0;
    "
  >
    ${safePreview}
  </div>

  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
      background:#f8f7f4;
      padding:40px 16px;
    "
  >
    <tr>
      <td align="center">
        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            max-width:600px;
            background:#ffffff;
            border:1px solid #e7e5e4;
            border-radius:24px;
            overflow:hidden;
          "
        >
          <tr>
            <td
              style="
                padding:34px 36px 20px;
                font-family:Arial,Helvetica,sans-serif;
              "
            >
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
              >
                <tr>
                  <td>
                    <div
                      style="
                        font-size:13px;
                        font-weight:800;
                        letter-spacing:0.08em;
                        color:#1c1917;
                      "
                    >
                      TOTS-OS
                    </div>

                    <div
                      style="
                        margin-top:4px;
                        font-size:10px;
                        text-transform:uppercase;
                        letter-spacing:0.14em;
                        color:#a8a29e;
                      "
                    >
                      Business Operating System
                    </div>
                  </td>

                  <td align="right">
                    <div
                      style="
                        display:inline-block;
                        width:38px;
                        height:38px;
                        line-height:38px;
                        text-align:center;
                        border-radius:12px;
                        background:#eef1e9;
                        color:#829473;
                        font-size:16px;
                      "
                    >
                      ✓
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td
              style="
                padding:18px 36px 36px;
                font-family:Arial,Helvetica,sans-serif;
                color:#44403c;
              "
            >
              <p
                style="
                  margin:0 0 10px;
                  font-size:12px;
                  font-weight:800;
                  text-transform:uppercase;
                  letter-spacing:0.14em;
                  color:#829473;
                "
              >
                TOTS notification
              </p>

              <h1
                style="
                  margin:0;
                  font-family:Georgia,'Times New Roman',serif;
                  font-size:34px;
                  font-weight:400;
                  font-style:italic;
                  line-height:1.15;
                  color:#292524;
                "
              >
                ${safeTitle}
              </h1>

              <p
                style="
                  margin:24px 0 0;
                  font-size:14px;
                  line-height:1.7;
                  color:#57534e;
                "
              >
                Hi ${safeName},
              </p>

              <p
                style="
                  margin:12px 0 0;
                  font-size:14px;
                  line-height:1.7;
                  color:#57534e;
                "
              >
                ${safeBody}
              </p>

              <table
                cellpadding="0"
                cellspacing="0"
                border="0"
              >
                ${actionButton}
              </table>

              <p
                style="
                  margin:30px 0 0;
                  font-size:11px;
                  line-height:1.6;
                  color:#a8a29e;
                "
              >
                This is an automated notification from TOTS-OS.
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
// RESEND
// ============================================================

async function sendWithResend({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!RESEND_API_KEY) {
    console.warn(
      "RESEND_API_KEY is missing. Email notification skipped."
    );

    return {
      skipped: true,
      reason:
        "RESEND_API_KEY missing",
    };
  }

  const response =
    await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${RESEND_API_KEY}`,

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          from:
            FROM_EMAIL,

          to: [
            to,
          ],

          subject,

          html,
        }),
      }
    );

  const responseBody =
    await response
      .json()
      .catch(
        () => null
      );

  if (!response.ok) {
    console.error(
      "Resend email error:",
      responseBody
    );

    throw new Error(
      responseBody?.message ||
        `Resend returned ${response.status}`
    );
  }

  return responseBody;
}

// ============================================================
// POST
// ============================================================

export async function POST(
  request: NextRequest
) {
  try {
    // ========================================================
    // SUPABASE SERVER CLIENT
    // ========================================================

    const cookieStore =
      await cookies();

    const supabase =
      createServerClient(
        process.env
          .NEXT_PUBLIC_SUPABASE_URL!,
        process.env
          .NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },

            setAll(
              cookiesToSet: Array<{
                name: string;
                value: string;
                options?: Record<string, unknown>;
              }>
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
                      options as any
                    );
                  }
                );
              } catch {
                // Safe to ignore when
                // cookie writes are unavailable.
              }
            },
          },
        }
      );

    // ========================================================
    // AUTH
    // ========================================================

    const {
      data: {
        user,
      },
      error:
        authError,
    } =
      await supabase.auth.getUser();

    if (
      authError ||
      !user?.id
    ) {
      return NextResponse.json(
        {
          error:
            "Unauthorised",
        },
        {
          status: 401,
        }
      );
    }

    // ========================================================
    // BODY
    // ========================================================

    let payload:
      NotificationPayload;

    try {
      payload =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid JSON body",
        },
        {
          status: 400,
        }
      );
    }

    const {
      type,
      projectId,
      taskId,
      content,
      userId,
      email,
    } = payload;

    if (!type) {
      return NextResponse.json(
        {
          error:
            "Notification type is required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      ![
        "project_member_added",
        "task_assigned",
        "task_created",
      ].includes(type)
    ) {
      return NextResponse.json(
        {
          error:
            `Unsupported notification type: ${type}`,
        },
        {
          status: 400,
        }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        {
          error:
            "projectId is required",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // GET CURRENT USER'S ORGANISATION
    // ========================================================

    const {
      data:
        currentMembership,
      error:
        membershipError,
    } =
      await supabase
        .from(
          "team_members"
        )
        .select(
          "organisation_id"
        )
        .eq(
          "user_id",
          user.id
        )
        .limit(1)
        .maybeSingle();

    if (
      membershipError
    ) {
      console.error(
        "Notification membership lookup error:",
        membershipError
      );

      return NextResponse.json(
        {
          error:
            "Unable to verify organisation",
        },
        {
          status: 500,
        }
      );
    }

    let organisationId =
      currentMembership
        ?.organisation_id ||
      null;

    // Fallback for accounts that
    // still use profiles.organisation_id.
    if (!organisationId) {
      const {
        data:
          currentProfile,
      } =
        await supabase
          .from(
            "profiles"
          )
          .select(
            "organisation_id"
          )
          .eq(
            "id",
            user.id
          )
          .maybeSingle();

      organisationId =
        currentProfile
          ?.organisation_id ||
        null;
    }

    if (!organisationId) {
      return NextResponse.json(
        {
          error:
            "No organisation is linked to this account",
        },
        {
          status: 403,
        }
      );
    }

    // ========================================================
    // VERIFY PROJECT
    // ========================================================

    const {
      data:
        projectData,
      error:
        projectError,
    } =
      await supabase
        .from(
          "projects"
        )
        .select(
          "id, name, organisation_id, user_id"
        )
        .eq(
          "id",
          projectId
        )
        .eq(
          "organisation_id",
          organisationId
        )
        .maybeSingle();

    if (
      projectError
    ) {
      console.error(
        "Notification project lookup error:",
        projectError
      );

      return NextResponse.json(
        {
          error:
            "Unable to verify project",
        },
        {
          status: 500,
        }
      );
    }

    if (!projectData) {
      return NextResponse.json(
        {
          error:
            "Project not found or inaccessible",
        },
        {
          status: 404,
        }
      );
    }

    const project =
      projectData as
        ProjectRow;

    // ========================================================
    // LOAD TASK WHEN REQUIRED
    // ========================================================

    let task:
      TaskRow | null =
      null;

    if (
      taskId &&
      (
        type ===
          "task_assigned" ||
        type ===
          "task_created"
      )
    ) {
      const {
        data:
          taskData,
        error:
          taskError,
      } =
        await supabase
          .from(
            "tasks"
          )
          .select(
            `
              id,
              title,
              description,
              assigned_to,
              user_id,
              project_id,
              organisation_id
            `
          )
          .eq(
            "id",
            taskId
          )
          .eq(
            "project_id",
            projectId
          )
          .eq(
            "organisation_id",
            organisationId
          )
          .maybeSingle();

      if (
        taskError
      ) {
        console.error(
          "Notification task lookup error:",
          taskError
        );

        return NextResponse.json(
          {
            error:
              "Unable to verify task",
          },
          {
            status: 500,
          }
        );
      }

      task =
        taskData as
          TaskRow | null;
    }

    // ========================================================
    // DETERMINE RECIPIENT
    // ========================================================

    let recipientUserId:
      string | null =
      userId || null;

    let recipientEmail =
      String(
        email || ""
      )
        .trim()
        .toLowerCase();

    // task_assigned should go to
    // assigned_to automatically.
    if (
      type ===
        "task_assigned" &&
      task?.assigned_to
    ) {
      recipientUserId =
        task.assigned_to;
    }

    // task_created:
    // if no recipient provided,
    // email the creator.
    if (
      type ===
        "task_created" &&
      !recipientUserId
    ) {
      recipientUserId =
        task?.user_id ||
        user.id;
    }

    let recipientProfile:
      RecipientProfile | null =
      null;

    // ========================================================
    // LOAD PROFILE BY USER ID
    // ========================================================

    if (
      recipientUserId
    ) {
      const {
        data:
          recipientData,
        error:
          recipientError,
      } =
        await supabase
          .from(
            "profiles"
          )
          .select(
            "id, email, full_name"
          )
          .eq(
            "id",
            recipientUserId
          )
          .maybeSingle();

      if (
        recipientError
      ) {
        console.error(
          "Recipient profile lookup error:",
          recipientError
        );
      }

      if (recipientData) {
  recipientProfile =
    recipientData as RecipientProfile;

  recipientEmail =
    String(
      recipientData.email || ""
    )
      .trim()
      .toLowerCase();
}
    }

    // ========================================================
    // FALLBACK PROFILE BY EMAIL
    // ========================================================

    if (
      !recipientProfile &&
      recipientEmail
    ) {
      const {
        data:
          recipientData,
      } =
        await supabase
          .from(
            "profiles"
          )
          .select(
            "id, email, full_name"
          )
          .ilike(
            "email",
            recipientEmail
          )
          .maybeSingle();

      if (
        recipientData
      ) {
        recipientProfile =
          recipientData as
            RecipientProfile;

        recipientUserId =
          recipientData.id;
      }
    }

    if (
      !recipientEmail
    ) {
      return NextResponse.json(
        {
          error:
            "No recipient email could be found",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // VERIFY RECIPIENT IS IN SAME ORGANISATION
    // ========================================================

    if (
      recipientUserId
    ) {
      const {
        data:
          recipientMembership,
        error:
          recipientMembershipError,
      } =
        await supabase
          .from(
            "team_members"
          )
          .select(
            "id"
          )
          .eq(
            "user_id",
            recipientUserId
          )
          .eq(
            "organisation_id",
            organisationId
          )
          .maybeSingle();

      if (
        recipientMembershipError
      ) {
        console.error(
          "Recipient membership lookup error:",
          recipientMembershipError
        );

        return NextResponse.json(
          {
            error:
              "Unable to verify recipient",
          },
          {
            status: 500,
          }
        );
      }

      if (
        !recipientMembership
      ) {
        return NextResponse.json(
          {
            error:
              "Recipient is not part of this organisation",
          },
          {
            status: 403,
          }
        );
      }
    }

    // ========================================================
    // BUILD NOTIFICATION
    // ========================================================

    const projectName =
      project.name ||
      "your project";

    let subject = "";
    let title = "";
    let preview = "";
    let body = "";
    let buttonText = "";
    let buttonUrl = "";

    // --------------------------------------------------------
    // PROJECT MEMBER ADDED
    // --------------------------------------------------------

    if (
      type ===
      "project_member_added"
    ) {
      subject =
        `You've been added to ${projectName}`;

      title =
        "You’ve been added to a project";

      preview =
        `You now have access to ${projectName} in TOTS-OS.`;

      body =
        content ||
        `You have been added to ${projectName}. You can now view the project, follow its progress and work with the rest of the team.`;

      buttonText =
        "Open project";

      buttonUrl =
        `${APP_URL}/projects/${projectId}`;
    }

    // --------------------------------------------------------
    // TASK ASSIGNED
    // --------------------------------------------------------

    if (
      type ===
      "task_assigned"
    ) {
      const taskTitle =
        task?.title ||
        content ||
        "New task";

      subject =
        `Task assigned: ${taskTitle}`;

      title =
        "A task has been assigned to you";

      preview =
        `${taskTitle} in ${projectName}`;

      body =
        `You’ve been assigned the task "${taskTitle}" in ${projectName}.`;

      if (
        task?.description
      ) {
        body +=
          `\n\n${task.description}`;
      }

      buttonText =
        "View project";

      buttonUrl =
        `${APP_URL}/projects/${projectId}`;
    }

    // --------------------------------------------------------
    // TASK CREATED
    // --------------------------------------------------------

    if (
      type ===
      "task_created"
    ) {
      const taskTitle =
        task?.title ||
        content ||
        "New task";

      subject =
        `New task: ${taskTitle}`;

      title =
        "A new task was created";

      preview =
        `${taskTitle} was added to ${projectName}.`;

      body =
        `A new task called "${taskTitle}" has been added to ${projectName}.`;

      buttonText =
        "Open project";

      buttonUrl =
        `${APP_URL}/projects/${projectId}`;
    }

    // ========================================================
    // GENERATE EMAIL
    // ========================================================

    const html =
      buildEmailTemplate({
        title,
        preview,

        recipientName:
          recipientProfile
            ?.full_name,

        body,

        buttonText,
        buttonUrl,
      });

    // ========================================================
    // SEND
    // ========================================================

    const result =
      await sendWithResend({
        to:
          recipientEmail,

        subject,

        html,
      });

    // ========================================================
    // SUCCESS
    // ========================================================

    return NextResponse.json(
      {
        success: true,

        type,

        recipient:
          recipientEmail,

        skipped:
          Boolean(
            (
              result as any
            )?.skipped
          ),

        emailId:
          (
            result as any
          )?.id ||
          null,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Notification API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Unable to send notification",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// OPTIONAL GET — USEFUL FOR TESTING THE ROUTE EXISTS
// ============================================================

export async function GET() {
  return NextResponse.json({
    ok: true,
    route:
      "/api/notifications/email",
    service:
      APP_NAME,
  });
}