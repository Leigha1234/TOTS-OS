import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createServerClient,
} from "@supabase/ssr";

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

type PublishDestination =
  | "facebook"
  | "instagram";

type PublishRequestBody = {
  socialAccountId?:
    string;

  content?:
    string;

  imageUrl?:
    string;

  destinations?:
    PublishDestination[];
};

type SocialAccountRow = {
  id:
    string;

  user_id:
    string;

  organisation_id?:
    string | null;

  platform:
    string;

  access_token?:
    string | null;

  page_id?:
    string | null;

  page_name?:
    string | null;

  page_access_token?:
    string | null;

  instagram_business_account_id?:
    string | null;

  display_name?:
    string | null;
};

type MetaErrorResponse = {
  error?: {
    message?:
      string;

    type?:
      string;

    code?:
      number;

    error_subcode?:
      number;

    fbtrace_id?:
      string;
  };

  id?:
    string;

  post_id?:
    string;
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

function getGraphVersion() {
  const configured =
    process.env
      .META_GRAPH_API_VERSION
      ?.trim();

  if (
    configured
  ) {
    return configured.startsWith(
      "v"
    )
      ? configured
      : `v${configured}`;
  }

  return "v25.0";
}

// ============================================================

async function readMetaResponse(
  response:
    Response
) {
  return (
    await response
      .json()
      .catch(
        () =>
          ({})
      )
  ) as MetaErrorResponse;
}

// ============================================================

function getMetaErrorMessage(
  result:
    MetaErrorResponse,

  fallback:
    string
) {
  return (
    result
      ?.error
      ?.message ||
    fallback
  );
}

// ============================================================
// FACEBOOK
// ============================================================

async function publishToFacebook({
  account,
  content,
  imageUrl,
}: {
  account:
    SocialAccountRow;

  content:
    string;

  imageUrl:
    string;
}) {
  if (
    !account.page_id ||
    !account.page_access_token
  ) {
    throw new Error(
      "Facebook Page connection is incomplete. Reconnect Meta and make sure Page permissions are granted."
    );
  }

  const graphVersion =
    getGraphVersion();

  // ==========================================================
  // IMAGE POST
  // ==========================================================

  if (
    imageUrl
  ) {
    const endpoint =
      `https://graph.facebook.com/${graphVersion}/${account.page_id}/photos`;

    const response =
      await fetch(
        endpoint,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              url:
                imageUrl,

              caption:
                content,

              published:
                true,

              access_token:
                account.page_access_token,
            }),

          cache:
            "no-store",
        }
      );

    const result =
      await readMetaResponse(
        response
      );

    if (
      !response.ok
    ) {
      console.error(
        "[SOCIAL POST] Facebook image publishing failed:",
        result
      );

      throw new Error(
        getMetaErrorMessage(
          result,
          "Facebook image post failed."
        )
      );
    }

    return {
      success:
        true,

      destination:
        "facebook" as const,

      type:
        "image",

      id:
        result.post_id ||
        result.id ||
        null,

      raw:
        result,
    };
  }

  // ==========================================================
  // TEXT POST
  // ==========================================================

  const endpoint =
    `https://graph.facebook.com/${graphVersion}/${account.page_id}/feed`;

  const response =
    await fetch(
      endpoint,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            message:
              content,

            access_token:
              account.page_access_token,
          }),

        cache:
          "no-store",
      }
    );

  const result =
    await readMetaResponse(
      response
    );

  if (
    !response.ok
  ) {
    console.error(
      "[SOCIAL POST] Facebook text publishing failed:",
      result
    );

    throw new Error(
      getMetaErrorMessage(
        result,
        "Facebook post failed."
      )
    );
  }

  return {
    success:
      true,

    destination:
      "facebook" as const,

    type:
      "text",

    id:
      result.id ||
      null,

    raw:
      result,
  };
}

// ============================================================
// INSTAGRAM
// ============================================================

async function publishToInstagram({
  account,
  content,
  imageUrl,
}: {
  account:
    SocialAccountRow;

  content:
    string;

  imageUrl:
    string;
}) {
  if (
    !account
      .instagram_business_account_id
  ) {
    throw new Error(
      "No Instagram Business or Creator account is linked to this Facebook Page."
    );
  }

  if (
    !account.page_access_token
  ) {
    throw new Error(
      "Instagram connection is missing its Meta Page access token. Reconnect Meta."
    );
  }

  if (
    !imageUrl
  ) {
    throw new Error(
      "Instagram requires an image URL for this type of post."
    );
  }

  const graphVersion =
    getGraphVersion();

  // ==========================================================
  // 1. CREATE MEDIA CONTAINER
  // ==========================================================

  const createUrl =
    `https://graph.facebook.com/${graphVersion}/${account.instagram_business_account_id}/media`;

  const createResponse =
    await fetch(
      createUrl,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            image_url:
              imageUrl,

            caption:
              content,

            access_token:
              account.page_access_token,
          }),

        cache:
          "no-store",
      }
    );

  const createResult =
    await readMetaResponse(
      createResponse
    );

  if (
    !createResponse.ok ||
    !createResult.id
  ) {
    console.error(
      "[SOCIAL POST] Instagram media creation failed:",
      createResult
    );

    throw new Error(
      getMetaErrorMessage(
        createResult,
        "Instagram media creation failed."
      )
    );
  }

  const creationId =
    createResult.id;

  // ==========================================================
  // 2. PUBLISH MEDIA CONTAINER
  // ==========================================================

  const publishUrl =
    `https://graph.facebook.com/${graphVersion}/${account.instagram_business_account_id}/media_publish`;

  const publishResponse =
    await fetch(
      publishUrl,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            creation_id:
              creationId,

            access_token:
              account.page_access_token,
          }),

        cache:
          "no-store",
      }
    );

  const publishResult =
    await readMetaResponse(
      publishResponse
    );

  if (
    !publishResponse.ok ||
    !publishResult.id
  ) {
    console.error(
      "[SOCIAL POST] Instagram publish failed:",
      publishResult
    );

    throw new Error(
      getMetaErrorMessage(
        publishResult,
        "Instagram publishing failed."
      )
    );
  }

  return {
    success:
      true,

    destination:
      "instagram" as const,

    type:
      "image",

    creationId,

    id:
      publishResult.id,

    raw:
      publishResult,
  };
}

// ============================================================
// POST
// ============================================================

export async function POST(
  req:
    NextRequest
) {
  try {
    // ========================================================
    // SUPABASE
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
              cookiesToSet
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
                /*
                 * Cookie writes can be unavailable
                 * in some route contexts.
                 */
              }
            },
          },
        }
      );

    // ========================================================
    // AUTHENTICATED USER
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
      !user
    ) {
      console.error(
        "[SOCIAL POST] Authentication failed:",
        authError
      );

      return NextResponse.json(
        {
          success:
            false,

          error:
            "You must be signed in to publish social posts.",
        },
        {
          status:
            401,
        }
      );
    }

    // ========================================================
    // BODY
    // ========================================================

    const body =
      (
        await req.json()
      ) as PublishRequestBody;

    const socialAccountId =
      cleanString(
        body.socialAccountId
      );

    const content =
      cleanString(
        body.content
      );

    const imageUrl =
      cleanString(
        body.imageUrl
      );

    let destinations =
      Array.isArray(
        body.destinations
      )
        ? body.destinations.filter(
            (
              destination
            ):
              destination is PublishDestination =>
              destination ===
                "facebook" ||
              destination ===
                "instagram"
          )
        : [];

    // ========================================================
    // VALIDATE
    // ========================================================

    if (
      !socialAccountId
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "Select a social account first.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      !content
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "Add some post content first.",
        },
        {
          status:
            400,
        }
      );
    }

    // ========================================================
    // LOAD ACCOUNT
    //
    // IMPORTANT:
    // Restrict it to the authenticated user.
    // ========================================================

    const {
      data:
        rawAccount,

      error:
        accountError,
    } =
      await supabase
        .from(
          "social_accounts"
        )
        .select(
          `
            id,
            user_id,
            organisation_id,
            platform,
            platform_user_id,
            access_token,
            page_id,
            page_name,
            page_access_token,
            instagram_business_account_id,
            display_name
          `
        )
        .eq(
          "id",
          socialAccountId
        )
        .eq(
          "user_id",
          user.id
        )
        .maybeSingle();

    if (
      accountError
    ) {
      console.error(
        "[SOCIAL POST] Social account lookup failed:",
        accountError
      );

      return NextResponse.json(
        {
          success:
            false,

          error:
            "The connected social account could not be loaded.",

          details:
            accountError.message,
        },
        {
          status:
            500,
        }
      );
    }

    if (
      !rawAccount
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "Social account not found.",
        },
        {
          status:
            404,
        }
      );
    }

    const account =
      rawAccount as unknown as
        SocialAccountRow;

    const platform =
      cleanString(
        account.platform
      ).toLowerCase();

    // ========================================================
    // META
    // ========================================================

    if (
      platform ===
        "meta" ||
      platform ===
        "facebook" ||
      platform ===
        "instagram"
    ) {
      /*
       * Backwards compatibility:
       *
       * Your OLD composer does not send destinations.
       *
       * Until we replace that composer, default Meta posts to:
       *
       * Facebook always
       * Instagram too when image + Instagram account exist
       */

      if (
        destinations.length ===
        0
      ) {
        destinations =
          [
            "facebook",
          ];

        if (
          imageUrl &&
          account
            .instagram_business_account_id
        ) {
          destinations.push(
            "instagram"
          );
        }
      }

      const results:
        Array<
          Record<
            string,
            unknown
          >
        > =
        [];

      const errors:
        Array<{
          destination:
            PublishDestination;

          error:
            string;
        }> =
        [];

      // ======================================================
      // FACEBOOK
      // ======================================================

      if (
        destinations.includes(
          "facebook"
        )
      ) {
        try {
          const result =
            await publishToFacebook({
              account,

              content,

              imageUrl,
            });

          results.push(
            result
          );
        } catch (
          error:
            unknown
        ) {
          const message =
            error instanceof
              Error
              ? error.message
              : "Facebook publishing failed.";

          errors.push({
            destination:
              "facebook",

            error:
              message,
          });
        }
      }

      // ======================================================
      // INSTAGRAM
      // ======================================================

      if (
        destinations.includes(
          "instagram"
        )
      ) {
        try {
          const result =
            await publishToInstagram({
              account,

              content,

              imageUrl,
            });

          results.push(
            result
          );
        } catch (
          error:
            unknown
        ) {
          const message =
            error instanceof
              Error
              ? error.message
              : "Instagram publishing failed.";

          errors.push({
            destination:
              "instagram",

            error:
              message,
          });
        }
      }

      // ======================================================
      // EVERYTHING FAILED
      // ======================================================

      if (
        results.length ===
          0 &&
        errors.length >
          0
      ) {
        console.error(
          "[SOCIAL POST] Meta publishing failed:",
          errors
        );

        return NextResponse.json(
          {
            success:
              false,

            error:
              errors
                .map(
                  (
                    item
                  ) =>
                    `${
                      item.destination ===
                      "facebook"
                        ? "Facebook"
                        : "Instagram"
                    }: ${item.error}`
                )
                .join(
                  " "
                ),

            errors,
          },
          {
            status:
              500,
          }
        );
      }

      // ======================================================
      // PARTIAL / COMPLETE SUCCESS
      // ======================================================

      console.log(
        "[SOCIAL POST] Meta publishing completed:",
        {
          userId:
            user.id,

          socialAccountId:
            account.id,

          pageId:
            account.page_id,

          instagramBusinessAccountId:
            account
              .instagram_business_account_id,

          destinations,

          results,

          errors,
        }
      );

      return NextResponse.json(
        {
          success:
            true,

          partialSuccess:
            errors.length >
            0,

          message:
            errors.length >
            0
              ? "Your post was published to some selected platforms."
              : destinations.length >
                  1
                ? "Your post was published successfully to Facebook and Instagram."
                : destinations[0] ===
                    "instagram"
                  ? "Your post was published successfully to Instagram."
                  : "Your post was published successfully to Facebook.",

          results,

          errors,
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
    }

    // ========================================================
    // LINKEDIN
    // ========================================================

    if (
      platform ===
      "linkedin"
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "LinkedIn publishing integration is not finished yet.",
        },
        {
          status:
            501,
        }
      );
    }

    // ========================================================
    // TIKTOK
    // ========================================================

    if (
      platform ===
      "tiktok"
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "TikTok publishing integration is not finished yet.",
        },
        {
          status:
            501,
        }
      );
    }

    // ========================================================
    // UNSUPPORTED
    // ========================================================

    return NextResponse.json(
      {
        success:
          false,

        error:
          `Unsupported social platform: ${platform || "unknown"}.`,
      },
      {
        status:
          400,
      }
    );
  } catch (
    error:
      unknown
  ) {
    console.error(
      "[SOCIAL POST] Unexpected error:",
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
            : "Unable to publish social post.",
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