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
// TYPES
// ============================================================

type PaidTier =
  | "standard"
  | "professional"
  | "elite";

// ============================================================
// HELPERS
// ============================================================

function isPaidTier(
  value: unknown
): value is PaidTier {
  const tier =
    String(
      value ?? ""
    )
      .trim()
      .toLowerCase();

  return (
    tier ===
      "standard" ||
    tier ===
      "professional" ||
    tier ===
      "elite"
  );
}

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

    // ========================================================
    // GET LOGGED-IN USER
    // ========================================================

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
    // RESOLVE ORGANISATION ID
    // ========================================================

    let organisationId:
      string | null =
      null;

    // ========================================================
    // PRIMARY:
    // profiles.organisation_id
    // ========================================================

    const {
      data:
        profile,
      error:
        profileError,
    } =
      await admin
        .from(
          "profiles"
        )
        .select(
          `
            organisation_id,
            subscription_tier,
            is_subscribed
          `
        )
        .eq(
          "id",
          user.id
        )
        .maybeSingle();

    if (
      profileError
    ) {
      console.error(
        "Access profile lookup failed:",
        profileError
      );
    }

    if (
      profile
        ?.organisation_id
    ) {
      organisationId =
        profile
          .organisation_id;
    }

    // ========================================================
    // FALLBACK 1:
    // organisation_members
    // ========================================================

    if (
      !organisationId
    ) {
      const {
        data:
          membership,
        error:
          membershipError,
      } =
        await admin
          .from(
            "organisation_members"
          )
          .select(
            "organisation_id"
          )
          .eq(
            "user_id",
            user.id
          )
          .limit(
            1
          )
          .maybeSingle();

      if (
        membershipError
      ) {
        console.error(
          "Access organisation_members lookup failed:",
          membershipError
        );
      }

      if (
        membership
          ?.organisation_id
      ) {
        organisationId =
          membership
            .organisation_id;
      }
    }

    // ========================================================
    // FALLBACK 2:
    // user_organisations
    // ========================================================

    if (
      !organisationId
    ) {
      const {
        data:
          userOrganisation,
        error:
          userOrganisationError,
      } =
        await admin
          .from(
            "user_organisations"
          )
          .select(
            "organisation_id"
          )
          .eq(
            "user_id",
            user.id
          )
          .limit(
            1
          )
          .maybeSingle();

      if (
        userOrganisationError
      ) {
        console.error(
          "Access user_organisations lookup failed:",
          userOrganisationError
        );
      }

      if (
        userOrganisation
          ?.organisation_id
      ) {
        organisationId =
          userOrganisation
            .organisation_id;
      }
    }

    // ========================================================
    // FALLBACK 3:
    // LEGACY organisations.created_by
    // ========================================================

    if (
      !organisationId
    ) {
      const {
        data:
          createdOrganisation,
        error:
          createdOrganisationError,
      } =
        await admin
          .from(
            "organisations"
          )
          .select(
            "id"
          )
          .eq(
            "created_by",
            user.id
          )
          .limit(
            1
          )
          .maybeSingle();

      if (
        createdOrganisationError
      ) {
        console.error(
          "Access legacy organisation lookup failed:",
          createdOrganisationError
        );
      }

      if (
        createdOrganisation
          ?.id
      ) {
        organisationId =
          createdOrganisation
            .id;
      }
    }

    // ========================================================
    // NO ORGANISATION
    // ========================================================

    if (
      !organisationId
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
    // LOAD ORGANISATION
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
            subscription_tier,
            subscription_status,
            access_status,
            beta_grace_ends_at,
            retention_trial_ends_at
          `
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
    // ORGANISATION RECORD DOESN'T EXIST
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

    // --------------------------------------------------------
    // PAID SUBSCRIPTION
    // --------------------------------------------------------

    const paidActive =
      isPaidTier(
        organisation
          .subscription_tier
      ) &&
      organisation
        .subscription_status ===
        "active";

    // --------------------------------------------------------
    // BETA GRACE PERIOD
    // --------------------------------------------------------

    const betaGraceActive =
      organisation
        .subscription_status ===
        "beta" &&
      Boolean(
        organisation
          .beta_grace_ends_at
      ) &&
      new Date(
        organisation
          .beta_grace_ends_at
      ).getTime() >
        now;

    // --------------------------------------------------------
    // RETENTION TRIAL
    // --------------------------------------------------------

    const retentionTrialActive =
      organisation
        .subscription_status ===
        "trial" &&
      Boolean(
        organisation
          .retention_trial_ends_at
      ) &&
      new Date(
        organisation
          .retention_trial_ends_at
      ).getTime() >
        now;

    // --------------------------------------------------------
    // PROFILE FALLBACK
    //
    // If Stripe verification has already synced the profile,
    // do not lock a genuinely paid customer out simply because
    // an organisation field is temporarily out of sync.
    // --------------------------------------------------------

    const profilePaidActive =
      profile
        ?.is_subscribed ===
        true &&
      isPaidTier(
        profile
          ?.subscription_tier
      );

    // ========================================================
    // FINAL ACCESS DECISION
    // ========================================================

    const allowed =
      Boolean(
        paidActive ||
          profilePaidActive ||
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
    // DEBUG LOG
    // ========================================================

    console.log(
      "[ACCOUNT ACCESS]",
      {
        userId:
          user.id,

        organisationId:
          organisation.id,

        organisationTier:
          organisation
            .subscription_tier,

        organisationStatus:
          organisation
            .subscription_status,

        profileTier:
          profile
            ?.subscription_tier,

        profileSubscribed:
          profile
            ?.is_subscribed,

        paidActive,

        profilePaidActive,

        betaGraceActive,

        retentionTrialActive,

        allowed,
      }
    );

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        allowed,

        reason:
          allowed
            ? "access_granted"
            : "access_expired",

        organisationId:
          organisation.id,

        organisationName:
          organisation.name,

        subscriptionTier:
          organisation
            .subscription_tier,

        subscriptionStatus:
          organisation
            .subscription_status,

        accessStatus:
          desiredAccessStatus,

        profileSubscriptionTier:
          profile
            ?.subscription_tier ??
          null,

        profileSubscribed:
          profile
            ?.is_subscribed ??
          false,

        paidActive,

        betaGraceActive,

        retentionTrialActive,

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