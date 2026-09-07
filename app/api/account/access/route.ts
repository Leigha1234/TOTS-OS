import {
  NextResponse,
} from "next/server";

import {
  createServerClient,
} from "@supabase/ssr";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  cookies,
} from "next/headers";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

// ============================================================
// GET
// ============================================================

export async function GET() {
  try {
    const cookieStore =
      await cookies();

    // ========================================================
    // AUTH CLIENT
    // ========================================================

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
              cookiesToSet: {
                name: string;
                value: string;
                options?: Parameters<
                  typeof cookieStore.set
                >[2];
              }[]
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
                // Cookies cannot always be mutated here.
              }
            },
          },
        }
      );

    const {
      data: {
        user,
      },
      error:
        userError,
    } =
      await supabase.auth.getUser();

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          allowed:
            false,

          reason:
            "unauthenticated",
        },
        {
          status:
            401,
        }
      );
    }

    // ========================================================
    // ADMIN CLIENT
    // ========================================================

    const admin =
      createClient(
        process.env
          .NEXT_PUBLIC_SUPABASE_URL!,
        process.env
          .SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            persistSession:
              false,

            autoRefreshToken:
              false,
          },
        }
      );

    // ========================================================
    // FIND ORGANISATION
    // ========================================================

    const {
      data:
        organisation,
      error:
        organisationError,
    } =
      await admin
        .from(
          "organisations"
        )
        .select(
          `
            id,
            name,
            subscription_status,
            access_status,
            beta_grace_ends_at,
            retention_trial_ends_at
          `
        )
        .eq(
          "created_by",
          user.id
        )
        .maybeSingle();

    if (
      organisationError
    ) {
      console.error(
        "Access organisation lookup failed:",
        organisationError
      );

      return NextResponse.json(
        {
          allowed:
            false,

          reason:
            "lookup_failed",
        },
        {
          status:
            500,
        }
      );
    }

    // ========================================================
    // NO ORGANISATION
    // ========================================================

    if (
      !organisation
    ) {
      return NextResponse.json(
        {
          allowed:
            false,

          reason:
            "organisation_not_found",
        },
        {
          status:
            403,
        }
      );
    }

    // ========================================================
    // CALCULATE ACCESS
    // ========================================================

    const now =
      Date.now();

    const paidActive =
      organisation
        .subscription_status ===
      "active";

    const betaGraceActive =
      organisation
        .subscription_status ===
        "beta" &&
      organisation
        .beta_grace_ends_at &&
      new Date(
        organisation
          .beta_grace_ends_at
      ).getTime() >
        now;

    const retentionTrialActive =
      organisation
        .subscription_status ===
        "trial" &&
      organisation
        .retention_trial_ends_at &&
      new Date(
        organisation
          .retention_trial_ends_at
      ).getTime() >
        now;

    const allowed =
      Boolean(
        paidActive ||
          betaGraceActive ||
          retentionTrialActive
      );

    // ========================================================
    // KEEP ACCESS_STATUS IN SYNC
    // ========================================================

    const desiredAccessStatus =
      allowed
        ? "active"
        : "restricted";

    if (
      organisation
        .access_status !==
      desiredAccessStatus
    ) {
      const {
        error:
          updateError,
      } =
        await admin
          .from(
            "organisations"
          )
          .update({
            access_status:
              desiredAccessStatus,
          })
          .eq(
            "id",
            organisation.id
          );

      if (
        updateError
      ) {
        console.error(
          "Unable to sync organisation access status:",
          updateError
        );
      }
    }

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        allowed,

        organisationId:
          organisation.id,

        organisationName:
          organisation.name,

        subscriptionStatus:
          organisation
            .subscription_status,

        accessStatus:
          desiredAccessStatus,

        betaGraceEndsAt:
          organisation
            .beta_grace_ends_at,

        retentionTrialEndsAt:
          organisation
            .retention_trial_ends_at,
      },
      {
        status:
          allowed
            ? 200
            : 403,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "Account access check failed:",
      error
    );

    return NextResponse.json(
      {
        allowed:
          false,

        reason:
          "server_error",
      },
      {
        status:
          500,
      }
    );
  }
}