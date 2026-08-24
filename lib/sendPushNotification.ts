import webpush from "web-push";

import {
  createClient,
} from "@supabase/supabase-js";

// ============================================================
// ENV
// ============================================================

const supabaseUrl =
  process.env
    .NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey =
  process.env
    .SUPABASE_SERVICE_ROLE_KEY;

const vapidPublicKey =
  process.env
    .NEXT_PUBLIC_VAPID_PUBLIC_KEY;

const vapidPrivateKey =
  process.env
    .VAPID_PRIVATE_KEY;

const vapidSubject =
  process.env
    .VAPID_SUBJECT ||
  "mailto:hello@theorganisedtypes.co.uk";

// ============================================================
// TYPES
// ============================================================

export type SendPushOptions = {
  userId:
    string;

  organisationId:
    string;

  title:
    string;

  body:
    string;

  url?:
    string;

  tag?:
    string;

  data?:
    Record<
      string,
      unknown
    >;
};

type PushSubscriptionRow = {
  id:
    string;

  user_id:
    string | null;

  organisation_id:
    string | null;

  endpoint:
    string;

  p256dh:
    string;

  auth:
    string;
};

export type SendPushResult = {
  sent:
    number;

  failed:
    number;
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
// SEND PUSH NOTIFICATION
// ============================================================

export async function sendPushNotification({
  userId,
  organisationId,
  title,
  body,
  url =
    "/dashboard",
  tag,
  data =
    {},
}: SendPushOptions): Promise<SendPushResult> {
  // ==========================================================
  // CLEAN INPUT
  // ==========================================================

  const cleanedUserId =
    cleanString(
      userId
    );

  const cleanedOrganisationId =
    cleanString(
      organisationId
    );

  const cleanedTitle =
    cleanString(
      title
    );

  const cleanedBody =
    cleanString(
      body
    );

  const cleanedUrl =
    cleanString(
      url
    ) ||
    "/dashboard";

  const cleanedTag =
    cleanString(
      tag
    );

  // ==========================================================
  // VALIDATION
  // ==========================================================

  if (
    !cleanedUserId
  ) {
    console.warn(
      "[TOTS PUSH] Push skipped because userId is missing."
    );

    return {
      sent:
        0,

      failed:
        0,
    };
  }

  if (
    !cleanedOrganisationId
  ) {
    console.warn(
      "[TOTS PUSH] Push skipped because organisationId is missing."
    );

    return {
      sent:
        0,

      failed:
        0,
    };
  }

  if (
    !cleanedTitle
  ) {
    console.warn(
      "[TOTS PUSH] Push skipped because title is missing."
    );

    return {
      sent:
        0,

      failed:
        0,
    };
  }

  // ==========================================================
  // ENVIRONMENT
  // ==========================================================

  if (
    !supabaseUrl ||
    !serviceRoleKey ||
    !vapidPublicKey ||
    !vapidPrivateKey
  ) {
    console.warn(
      "[TOTS PUSH] Push environment variables missing.",
      {
        hasSupabaseUrl:
          Boolean(
            supabaseUrl
          ),

        hasServiceRoleKey:
          Boolean(
            serviceRoleKey
          ),

        hasVapidPublicKey:
          Boolean(
            vapidPublicKey
          ),

        hasVapidPrivateKey:
          Boolean(
            vapidPrivateKey
          ),
      }
    );

    return {
      sent:
        0,

      failed:
        0,
    };
  }

  // ==========================================================
  // VAPID
  // ==========================================================

  webpush.setVapidDetails(
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
  );

  // ==========================================================
  // SUPABASE ADMIN
  // ==========================================================

  const supabaseAdmin =
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
  // LOAD PUSH SUBSCRIPTIONS
  //
  // IMPORTANT:
  //
  // We filter by BOTH organisation and user.
  //
  // This means a notification created for one user does not
  // automatically get pushed to every device in the entire
  // organisation.
  //
  // Team-wide notifications can be implemented separately.
  // ==========================================================

  const {
    data:
      subscriptionData,

    error:
      subscriptionError,
  } =
    await supabaseAdmin
      .from(
        "push_subscriptions"
      )
      .select(
        `
          id,
          user_id,
          organisation_id,
          endpoint,
          p256dh,
          auth
        `
      )
      .eq(
        "organisation_id",
        cleanedOrganisationId
      )
      .eq(
        "user_id",
        cleanedUserId
      );

  // ==========================================================
  // LOAD ERROR
  // ==========================================================

  if (
    subscriptionError
  ) {
    console.error(
      "[TOTS PUSH] Could not load subscriptions:",
      subscriptionError
    );

    throw new Error(
      subscriptionError.message ||
      "Push subscriptions could not be loaded."
    );
  }

  // ==========================================================
  // NORMALISE ROWS
  //
  // Explicit typing prevents TypeScript from resolving the
  // Supabase response to `never`.
  // ==========================================================

  const subscriptions:
    PushSubscriptionRow[] =
    Array.isArray(
      subscriptionData
    )
      ? (
          subscriptionData as PushSubscriptionRow[]
        ).filter(
          (
            subscription
          ) =>
            Boolean(
              subscription.id &&
              subscription.endpoint &&
              subscription.p256dh &&
              subscription.auth
            )
        )
      : [];

  // ==========================================================
  // NO DEVICES
  // ==========================================================

  if (
    subscriptions.length ===
    0
  ) {
    console.log(
      "[TOTS PUSH] No subscriptions found.",
      {
        userId:
          cleanedUserId,

        organisationId:
          cleanedOrganisationId,
      }
    );

    return {
      sent:
        0,

      failed:
        0,
    };
  }

  // ==========================================================
  // PAYLOAD
  // ==========================================================

  const payload =
    JSON.stringify({
      title:
        cleanedTitle,

      body:
        cleanedBody ||
        cleanedTitle,

      url:
        cleanedUrl,

      icon:
        "/icon.png",

      badge:
        "/icon.png",

      tag:
        cleanedTag ||
        `tots-${Date.now()}`,

      // ======================================================
      // EXTRA NOTIFICATION DATA
      //
      // Examples:
      //
      // notificationId
      // type
      // category
      // entityType
      // entityId
      //
      // Your service worker can use these later to route users
      // directly to the relevant invoice/project/task/etc.
      // ======================================================

      data: {
        ...data,

        userId:
          cleanedUserId,

        organisationId:
          cleanedOrganisationId,

        url:
          cleanedUrl,
      },
    });

  // ==========================================================
  // COUNTERS
  // ==========================================================

  let sent =
    0;

  let failed =
    0;

  // ==========================================================
  // SEND TO EACH DEVICE
  // ==========================================================

  for (
    const subscription of
    subscriptions
  ) {
    try {
      // ======================================================
      // WEB PUSH
      // ======================================================

      await webpush.sendNotification(
        {
          endpoint:
            subscription.endpoint,

          keys: {
            p256dh:
              subscription.p256dh,

            auth:
              subscription.auth,
          },
        },

        payload
      );

      sent +=
        1;

      console.log(
        "[TOTS PUSH] Delivered:",
        {
          subscriptionId:
            subscription.id,

          userId:
            cleanedUserId,

          organisationId:
            cleanedOrganisationId,

          title:
            cleanedTitle,
        }
      );
    } catch (
      error:
        unknown
    ) {
      failed +=
        1;

      // ======================================================
      // EXTRACT STATUS CODE SAFELY
      // ======================================================

      let statusCode:
        number | null =
        null;

      if (
        error &&
        typeof error ===
          "object" &&
        "statusCode" in
          error
      ) {
        const value =
          (
            error as {
              statusCode?:
                unknown;
            }
          ).statusCode;

        if (
          typeof value ===
          "number"
        ) {
          statusCode =
            value;
        }
      }

      console.error(
        "[TOTS PUSH] Delivery failed:",
        {
          subscriptionId:
            subscription.id,

          userId:
            cleanedUserId,

          organisationId:
            cleanedOrganisationId,

          statusCode,

          error,
        }
      );

      // ======================================================
      // REMOVE EXPIRED / INVALID SUBSCRIPTIONS
      //
      // 404 = subscription endpoint no longer exists
      // 410 = subscription has expired
      // ======================================================

      if (
        statusCode ===
          404 ||
        statusCode ===
          410
      ) {
        try {
          const {
            error:
              deleteError,
          } =
            await supabaseAdmin
              .from(
                "push_subscriptions"
              )
              .delete()
              .eq(
                "id",
                subscription.id
              );

          if (
            deleteError
          ) {
            console.error(
              "[TOTS PUSH] Could not remove expired subscription:",
              deleteError
            );
          } else {
            console.log(
              "[TOTS PUSH] Removed expired subscription:",
              subscription.id
            );
          }
        } catch (
          deleteError
        ) {
          console.error(
            "[TOTS PUSH] Expired subscription cleanup failed:",
            deleteError
          );
        }
      }
    }
  }

  // ==========================================================
  // RESULT
  // ==========================================================

  console.log(
    "[TOTS PUSH] Send complete:",
    {
      userId:
        cleanedUserId,

      organisationId:
        cleanedOrganisationId,

      title:
        cleanedTitle,

      devices:
        subscriptions.length,

      sent,

      failed,
    }
  );

  return {
    sent,

    failed,
  };
}

export default sendPushNotification;