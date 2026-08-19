import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  cookies,
} from "next/headers";

import {
  createServerClient,
  type CookieOptions,
} from "@supabase/ssr";

import {
  createClient,
} from "@supabase/supabase-js";

// ============================================================
// TYPES
// ============================================================

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

type InvitationRequestBody = {
  email?: string;

  organisationId?: string;
  organisation_id?: string;

  projectId?: string;
  project_id?: string;

  type?:
    | "organisation"
    | "tots-os"
    | "invite_to_organisation"
    | "invite_to_tots";
};

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  organisation_id: string | null;
  role: string | null;
};

type TeamMemberRow = {
  id: string;
  user_id: string | null;
  organisation_id: string | null;
  role: string | null;
};

type ProjectRow = {
  id: string;
  name: string | null;
  organisation_id: string | null;
  user_id: string | null;
};

type OrganisationRow = {
  id: string;
  name: string | null;
};

// ============================================================
// HELPERS
// ============================================================

const normaliseEmail = (
  value: unknown
) =>
  typeof value ===
  "string"
    ? value
        .trim()
        .toLowerCase()
    : "";

const normaliseRole = (
  value: unknown
) =>
  typeof value ===
  "string"
    ? value
        .trim()
        .toLowerCase()
    : "";

const isOwnerOrAdmin = (
  role: unknown
) => {
  const normalised =
    normaliseRole(
      role
    );

  return (
    normalised ===
      "owner" ||
    normalised ===
      "admin" ||
    normalised ===
      "administrator"
  );
};

const escapeHtml = (
  value: string
) =>
  value
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

const getBaseUrl = (
  request: NextRequest
) => {
  const configuredUrl =
    process.env
      .NEXT_PUBLIC_APP_URL ||
    process.env
      .NEXT_PUBLIC_SITE_URL ||
    process.env
      .SITE_URL;

  if (
    configuredUrl
  ) {
    return configuredUrl.replace(
      /\/+$/,
      ""
    );
  }

  const forwardedProto =
    request.headers.get(
      "x-forwarded-proto"
    );

  const forwardedHost =
    request.headers.get(
      "x-forwarded-host"
    );

  const host =
    forwardedHost ||
    request.headers.get(
      "host"
    );

  if (
    host
  ) {
    return `${
      forwardedProto ||
      "http"
    }://${host}`.replace(
      /\/+$/,
      ""
    );
  }

  return "http://localhost:3000";
};

const resolveRequestedType = (
  value:
    | InvitationRequestBody["type"]
    | undefined
) => {
  if (
    value ===
      "organisation" ||
    value ===
      "invite_to_organisation"
  ) {
    return "organisation" as const;
  }

  if (
    value ===
      "tots-os" ||
    value ===
      "invite_to_tots"
  ) {
    return "tots-os" as const;
  }

  return null;
};

// ============================================================
// POST
// ============================================================

export async function POST(
  request: NextRequest
) {
  try {
    // ==========================================================
    // ENVIRONMENT
    // ==========================================================

    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    const supabaseAnonKey =
      process.env
        .NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const serviceRoleKey =
      process.env
        .SUPABASE_SERVICE_ROLE_KEY;

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      !serviceRoleKey
    ) {
      console.error(
        "Invitation API missing Supabase environment configuration."
      );

      return NextResponse.json(
        {
          success:
            false,

          error:
            "Server configuration is incomplete.",
        },
        {
          status:
            500,
        }
      );
    }

    // ==========================================================
    // AUTH CLIENT
    // ==========================================================

    const cookieStore =
      await cookies();

    const supabase =
      createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },

            setAll(
              cookiesToSet: CookieToSet[]
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
                      options
                    );
                  }
                );
              } catch {
                // Safe to ignore.
              }
            },
          },
        }
      );

    // ==========================================================
    // ADMIN CLIENT
    // ==========================================================

    const admin =
      createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            autoRefreshToken:
              false,

            persistSession:
              false,
          },
        }
      );

    // ==========================================================
    // CURRENT USER
    // ==========================================================

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
          success:
            false,

          error:
            "Unauthorised.",
        },
        {
          status:
            401,
        }
      );
    }

    // ==========================================================
    // BODY
    // ==========================================================

    let body:
      InvitationRequestBody;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "Invalid request body.",
        },
        {
          status:
            400,
        }
      );
    }

    const email =
      normaliseEmail(
        body.email
      );

    const requestedOrganisationId =
      body.organisationId ||
      body.organisation_id ||
      null;

    const projectId =
      body.projectId ||
      body.project_id ||
      null;

    const requestedType =
      resolveRequestedType(
        body.type
      );

    if (
      !email
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "An email address is required.",
        },
        {
          status:
            400,
        }
      );
    }

    // ==========================================================
    // CURRENT PROFILE
    // ==========================================================

    const {
      data:
        currentProfileData,
      error:
        currentProfileError,
    } =
      await admin
        .from(
          "profiles"
        )
        .select(
          "id, email, full_name, organisation_id, role"
        )
        .eq(
          "id",
          user.id
        )
        .maybeSingle();

    if (
      currentProfileError
    ) {
      console.error(
        "Invitation current profile error:",
        currentProfileError
      );

      return NextResponse.json(
        {
          success:
            false,

          error:
            "Unable to verify your account.",
        },
        {
          status:
            500,
        }
      );
    }

    const currentProfile =
      currentProfileData as
        | ProfileRow
        | null;

    // ==========================================================
    // PROJECT
    // ==========================================================

    let project:
      | ProjectRow
      | null =
      null;

    if (
      projectId
    ) {
      const {
        data:
          projectData,
        error:
          projectError,
      } =
        await admin
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
          .maybeSingle();

      if (
        projectError
      ) {
        console.error(
          "Invitation project lookup error:",
          projectError
        );

        return NextResponse.json(
          {
            success:
              false,

            error:
              "Unable to verify the project.",
          },
          {
            status:
              500,
          }
        );
      }

      if (
        !projectData
      ) {
        return NextResponse.json(
          {
            success:
              false,

            error:
              "Project could not be found.",
          },
          {
            status:
              404,
          }
        );
      }

      project =
        projectData as
          ProjectRow;
    }

    // ==========================================================
    // ORGANISATION
    // ==========================================================

    const organisationId =
      requestedOrganisationId ||
      project
        ?.organisation_id ||
      currentProfile
        ?.organisation_id ||
      null;

    if (
      !organisationId
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "No organisation could be resolved.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      project
        ?.organisation_id &&
      project.organisation_id !==
        organisationId
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "The project does not belong to this organisation.",
        },
        {
          status:
            403,
        }
      );
    }

    // ==========================================================
    // CALLER MEMBERSHIP
    // ==========================================================

    const {
      data:
        currentMembershipData,
      error:
        currentMembershipError,
    } =
      await admin
        .from(
          "team_members"
        )
        .select(
          "id, user_id, organisation_id, role"
        )
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "organisation_id",
          organisationId
        )
        .maybeSingle();

    if (
      currentMembershipError
    ) {
      console.warn(
        "Invitation membership lookup error:",
        currentMembershipError
      );
    }

    const currentMembership =
      currentMembershipData as
        | TeamMemberRow
        | null;

    // ==========================================================
    // PERMISSIONS
    // ==========================================================

    const canInviteFromMembership =
      isOwnerOrAdmin(
        currentMembership?.role
      );

    const canInviteFromProfile =
      currentProfile
        ?.organisation_id ===
        organisationId &&
      isOwnerOrAdmin(
        currentProfile?.role
      );

    const ownsProject =
      Boolean(
        project &&
          project.user_id ===
            user.id &&
          project.organisation_id ===
            organisationId
      );

    if (
      !canInviteFromMembership &&
      !canInviteFromProfile &&
      !ownsProject
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "You do not have permission to add organisation members.",
        },
        {
          status:
            403,
        }
      );
    }

    // ==========================================================
    // ORGANISATION DETAILS
    // ==========================================================

    const {
      data:
        organisationData,
      error:
        organisationError,
    } =
      await admin
        .from(
          "organisations"
        )
        .select(
          "id, name"
        )
        .eq(
          "id",
          organisationId
        )
        .maybeSingle();

    if (
      organisationError
    ) {
      console.warn(
        "Organisation lookup error:",
        organisationError
      );
    }

    const organisation =
      organisationData as
        | OrganisationRow
        | null;

    const organisationName =
      organisation?.name ||
      "your organisation";

    // ==========================================================
    // FIND INVITED PROFILE
    // ==========================================================

    const {
      data:
        invitedProfileData,
      error:
        invitedProfileError,
    } =
      await admin
        .from(
          "profiles"
        )
        .select(
          "id, email, full_name, organisation_id, role"
        )
        .ilike(
          "email",
          email
        )
        .maybeSingle();

    if (
      invitedProfileError
    ) {
      console.error(
        "Invitee profile lookup error:",
        invitedProfileError
      );

      return NextResponse.json(
        {
          success:
            false,

          error:
            "Unable to check this TOTS-OS account.",
        },
        {
          status:
            500,
        }
      );
    }

    const invitedProfile =
      invitedProfileData as
        | ProfileRow
        | null;

    const hasTotsAccount =
      Boolean(
        invitedProfile?.id
      );

    // ==========================================================
    // EXISTING TOTS-OS USER
    // ==========================================================

    if (
      invitedProfile?.id
    ) {
      // --------------------------------------------------------
      // EXISTING MEMBERSHIP?
      // --------------------------------------------------------

      const {
        data:
          existingMembershipData,
        error:
          existingMembershipError,
      } =
        await admin
          .from(
            "team_members"
          )
          .select(
            "id, user_id, organisation_id, role"
          )
          .eq(
            "user_id",
            invitedProfile.id
          )
          .eq(
            "organisation_id",
            organisationId
          )
          .maybeSingle();

      if (
        existingMembershipError
      ) {
        console.error(
          "Existing membership lookup error:",
          existingMembershipError
        );

        return NextResponse.json(
          {
            success:
              false,

            error:
              "Unable to check organisation membership.",
          },
          {
            status:
              500,
          }
        );
      }

      const existingMembership =
        existingMembershipData as
          | TeamMemberRow
          | null;

      // --------------------------------------------------------
      // ALREADY IN ORGANISATION
      // --------------------------------------------------------

      if (
        existingMembership
      ) {
        return NextResponse.json(
          {
            success:
              true,

            already_member:
              true,

            alreadyMember:
              true,

            hasTotsAccount:
              true,

            user_id:
              invitedProfile.id,

            userId:
              invitedProfile.id,

            email:
              invitedProfile.email ||
              email,

            full_name:
              invitedProfile.full_name,

            fullName:
              invitedProfile.full_name,

            organisationId,

            projectId,

            message:
              "This user is already a member of the organisation.",
          },
          {
            status:
              200,
          }
        );
      }

      // --------------------------------------------------------
      // ADD EXISTING USER TO ORGANISATION NOW
      // --------------------------------------------------------

      const {
        data:
          insertedMembership,
        error:
          insertMembershipError,
      } =
        await admin
          .from(
            "team_members"
          )
          .insert({
            user_id:
              invitedProfile.id,

            organisation_id:
              organisationId,

            /**
             * Default member role.
             *
             * Do NOT automatically grant admin/owner.
             */
            role:
              "member",
          })
          .select(
            "id, user_id, organisation_id, role"
          )
          .single();

      if (
        insertMembershipError
      ) {
        console.error(
          "Add organisation membership error:",
          insertMembershipError
        );

        return NextResponse.json(
          {
            success:
              false,

            error:
              insertMembershipError.message ||
              "Unable to add this user to the organisation.",
          },
          {
            status:
              500,
          }
        );
      }

      // --------------------------------------------------------
      // KEEP PROFILE ORG IN SYNC
      // --------------------------------------------------------

      /**
       * Your app still reads profiles.organisation_id in several
       * places, including the project page.
       *
       * Keep this in sync for now.
       *
       * If users later support multiple organisations, this should
       * eventually be replaced with an active organisation model.
       */
      if (
        !invitedProfile.organisation_id
      ) {
        const {
          error:
            profileOrgUpdateError,
        } =
          await admin
            .from(
              "profiles"
            )
            .update({
              organisation_id:
                organisationId,
            })
            .eq(
              "id",
              invitedProfile.id
            );

        if (
          profileOrgUpdateError
        ) {
          console.warn(
            "Profile organisation sync warning:",
            profileOrgUpdateError
          );
        }
      }

      // --------------------------------------------------------
      // OPTIONALLY SEND A COURTESY EMAIL
      // --------------------------------------------------------

      const baseUrl =
        getBaseUrl(
          request
        );

      const inviterName =
        currentProfile
          ?.full_name ||
        user.email ||
        "A TOTS-OS user";

      const projectName =
        project?.name ||
        null;

      const safeOrganisationName =
        escapeHtml(
          organisationName
        );

      const safeInviterName =
        escapeHtml(
          inviterName
        );

      const safeProjectName =
        projectName
          ? escapeHtml(
              projectName
            )
          : null;

      const subject =
        `You've been added to ${organisationName} on TOTS-OS`;

      const bodyCopy =
        `${safeInviterName} has added you to ${safeOrganisationName} on TOTS-OS.${
          safeProjectName
            ? ` You can now collaborate on ${safeProjectName}.`
            : ""
        }`;

      const dashboardUrl =
        `${baseUrl}/dashboard`;

      const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0"
    />
    <title>${escapeHtml(subject)}</title>
  </head>

  <body
    style="
      margin:0;
      padding:0;
      background:#f7f5f2;
      font-family:Arial,Helvetica,sans-serif;
      color:#4f4a46;
    "
  >
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
      style="
        width:100%;
        background:#f7f5f2;
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
              border-radius:24px;
              overflow:hidden;
              border:1px solid #ebe7e2;
            "
          >
            <tr>
              <td
                style="
                  padding:42px;
                "
              >
                <div
                  style="
                    font-size:12px;
                    font-weight:700;
                    letter-spacing:2px;
                    text-transform:uppercase;
                    color:#a9b897;
                    margin-bottom:26px;
                  "
                >
                  TOTS-OS
                </div>

                <h1
                  style="
                    margin:0 0 18px;
                    font-size:30px;
                    line-height:1.15;
                    color:#4f4a46;
                  "
                >
                  You're now part of
                  ${safeOrganisationName}
                </h1>

                <p
                  style="
                    margin:0 0 28px;
                    font-size:15px;
                    line-height:1.7;
                    color:#77716c;
                  "
                >
                  ${bodyCopy}
                </p>

                <a
                  href="${escapeHtml(
                    dashboardUrl
                  )}"
                  style="
                    display:inline-block;
                    background:#4f4a46;
                    color:#ffffff;
                    text-decoration:none;
                    font-size:13px;
                    font-weight:700;
                    padding:15px 24px;
                    border-radius:12px;
                  "
                >
                  Open TOTS-OS
                </a>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </body>
</html>
`;

      /**
       * Email is now secondary.
       *
       * The membership has already been created successfully.
       * If the email provider fails, we log it rather than undoing
       * the organisation membership.
       */
      try {
        const sendEmailResponse =
          await fetch(
            `${baseUrl}/api/send-email`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",

                cookie:
                  request.headers.get(
                    "cookie"
                  ) || "",
              },

              body:
                JSON.stringify({
                  to:
                    email,

                  email,

                  subject,

                  body:
                    bodyCopy,

                  html,

                  message:
                    bodyCopy,

                  type:
                    "organisation_member_added",
                }),
            }
          );

        const emailResult =
          await sendEmailResponse
            .json()
            .catch(
              () =>
                null
            );

        if (
          !sendEmailResponse.ok
        ) {
          console.error(
            "Existing member courtesy email failed:",
            {
              status:
                sendEmailResponse.status,

              result:
                emailResult,
            }
          );
        } else {
          console.log(
            "Existing member courtesy email API success:",
            emailResult
          );
        }
      } catch (
        emailError
      ) {
        console.error(
          "Existing member courtesy email exception:",
          emailError
        );
      }

      return NextResponse.json(
        {
          success:
            true,

          already_member:
            false,

          alreadyMember:
            false,

          hasTotsAccount:
            true,

          user_id:
            invitedProfile.id,

          userId:
            invitedProfile.id,

          email:
            invitedProfile.email ||
            email,

          full_name:
            invitedProfile.full_name,

          fullName:
            invitedProfile.full_name,

          membership_id:
            insertedMembership.id,

          organisationId,

          projectId,

          type:
            "organisation",

          message:
            `${invitedProfile.full_name || invitedProfile.email || email} has been added to ${organisationName}.`,
        },
        {
          status:
            200,
        }
      );
    }

    // ==========================================================
    // NEW TOTS-OS USER
    // ==========================================================

    const resolvedInvitationType =
      requestedType ||
      "tots-os";

    const baseUrl =
      getBaseUrl(
        request
      );

    const invitationParams =
      new URLSearchParams();

    invitationParams.set(
      "email",
      email
    );

    invitationParams.set(
      "organisation",
      organisationId
    );

    invitationParams.set(
      "type",
      resolvedInvitationType
    );

    if (
      projectId
    ) {
      invitationParams.set(
        "project",
        projectId
      );
    }

    const inviteUrl =
      `${baseUrl}/join?${invitationParams.toString()}`;

    const inviterName =
      currentProfile
        ?.full_name ||
      user.email ||
      "A TOTS-OS user";

    const projectName =
      project?.name ||
      null;

    const safeOrganisationName =
      escapeHtml(
        organisationName
      );

    const safeInviterName =
      escapeHtml(
        inviterName
      );

    const safeProjectName =
      projectName
        ? escapeHtml(
            projectName
          )
        : null;

    const subject =
      "You've been invited to join TOTS-OS";

    const bodyCopy =
      `${safeInviterName} has invited you to join TOTS-OS and become part of ${safeOrganisationName}.${
        safeProjectName
          ? ` You'll also be able to collaborate on ${safeProjectName}.`
          : ""
      }`;

    const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0"
    />
    <title>${escapeHtml(subject)}</title>
  </head>

  <body
    style="
      margin:0;
      padding:0;
      background:#f7f5f2;
      font-family:Arial,Helvetica,sans-serif;
      color:#4f4a46;
    "
  >
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
      style="
        width:100%;
        background:#f7f5f2;
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
              border-radius:24px;
              overflow:hidden;
              border:1px solid #ebe7e2;
            "
          >
            <tr>
              <td
                style="
                  padding:42px;
                "
              >
                <div
                  style="
                    font-size:12px;
                    font-weight:700;
                    letter-spacing:2px;
                    text-transform:uppercase;
                    color:#a9b897;
                    margin-bottom:26px;
                  "
                >
                  TOTS-OS
                </div>

                <h1
                  style="
                    margin:0 0 18px;
                    font-size:30px;
                    line-height:1.15;
                    color:#4f4a46;
                  "
                >
                  You've been invited to TOTS-OS
                </h1>

                <p
                  style="
                    margin:0 0 28px;
                    font-size:15px;
                    line-height:1.7;
                    color:#77716c;
                  "
                >
                  ${bodyCopy}
                </p>

                <a
                  href="${escapeHtml(
                    inviteUrl
                  )}"
                  style="
                    display:inline-block;
                    background:#4f4a46;
                    color:#ffffff;
                    text-decoration:none;
                    font-size:13px;
                    font-weight:700;
                    padding:15px 24px;
                    border-radius:12px;
                  "
                >
                  Join TOTS-OS
                </a>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </body>
</html>
`;

    // ==========================================================
    // SEND INVITE EMAIL
    // ==========================================================

    const sendEmailResponse =
      await fetch(
        `${baseUrl}/api/send-email`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            cookie:
              request.headers.get(
                "cookie"
              ) || "",
          },

          body:
            JSON.stringify({
              to:
                email,

              email,

              subject,

              body:
                bodyCopy,

              html,

              message:
                bodyCopy,

              type:
                "organisation_invitation",
            }),
        }
      );

    const sendEmailResult =
      await sendEmailResponse
        .json()
        .catch(
          () =>
            null
        );

    console.log(
      "Invitation email API response:",
      {
        status:
          sendEmailResponse.status,

        ok:
          sendEmailResponse.ok,

        result:
          sendEmailResult,

        recipient:
          email,
      }
    );

    if (
      !sendEmailResponse.ok
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            sendEmailResult?.error ||
            sendEmailResult?.message ||
            "The invitation email could not be sent.",
        },
        {
          status:
            500,
        }
      );
    }

    // ==========================================================
    // SUCCESS
    // ==========================================================

    return NextResponse.json(
      {
        success:
          true,

        pending:
          true,

        invitation_pending:
          true,

        hasTotsAccount:
          false,

        email,

        organisationId,

        projectId,

        type:
          "tots-os",

        inviteUrl,

        /**
         * Return email-provider response for local debugging.
         * You can remove this once email delivery is confirmed.
         */
        emailProviderResult:
          sendEmailResult,

        message:
          `TOTS-OS invitation sent to ${email}.`,
      },
      {
        status:
          200,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "Invitation route unexpected error:",
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
            : "An unexpected error occurred.",
      },
      {
        status:
          500,
      }
    );
  }
}