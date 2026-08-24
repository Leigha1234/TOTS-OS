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

type SendPushOptions = {
  userId:
    string;

  organisationId?:
    string | null;

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

export type SendPushResult = {
  sent:
    number;

  failed:
    number;

  removed:
    number;
};

// ============================================================
// ADMIN CLIENT
// ============================================================

let adminClient:
  ReturnType<
    typeof createClient
  > | null =
  null;

function getSupabaseAdmin() {
  if (
    adminClient
  ) {
    return adminClient;
  }

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    return null;
  }

  adminClient =
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

  return adminClient;
}

// ============================================================
// CLEAN STRING
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
// SEND
// ============================================================

export async function sendPushNotification({
  userId,
  organisationId,
  title,
  body,
  url =
    "/dashboard",
  tag,
  data,
}: SendPushOptions): Promise<SendPushResult> {
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

  // ==========================================================
  // VALIDATION
  // ==========================================================

  if (
    !cleanedUserId
  ) {
    console.warn(
      "[TOTS PUSH] Push skipped because user ID is missing."
    );

    return {
      sent:
        0,

      failed:
        0,

      removed:
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

      removed:
        0,
    };
  }

  // ==========================================================
  // ENV
  // ==========================================================

  if (
    !supabaseUrl ||
    !serviceRoleKey ||
    !vapidPublicKey ||
    !vapidPrivateKey
  ) {
    console.warn(
      "[TOTS PUSH] Push environment variables missing."
    );

    return {
      sent:
        0,

      failed:
        0,

      removed:
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
  // SUPABASE
  // ==========================================================

  const supabaseAdmin =
    getSupabaseAdmin();

  if (
    !supabaseAdmin
  ) {
    return {
      sent:
        0,

      failed:
        0,

      removed:
        0,
    };
  }

  // ==========================================================
  // SUBSCRIPTIONS
  //
  // IMPORTANT:
  //
  // user_id is the primary filter.
  //
  // This prevents a notification intended for one team member
  // from being pushed to every device in the organisation.
  // ==========================================================

  let query =
    supabaseAdmin
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
        "user_id",
        cleanedUserId
      );

  if (
    cleanedOrganisationId
  ) {
    query =
      query.eq(
        "organisation_id",
        cleanedOrganisationId
      );
  }

  const {
    data:
      subscriptions,

    error,
  } =
    await query;

  if (
    error
  ) {
    console.error(
      "[TOTS PUSH] Could not load subscriptions:",
      error
    );

    throw error;
  }

  if (
    !subscriptions ||
    subscriptions.length ===
      0
  ) {
    console.log(
      `[TOTS PUSH] No subscriptions found for user ${cleanedUserId}.`
    );

    return {
      sent:
        0,

      failed:
        0,

      removed:
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
        cleanedBody,

      url:
        cleanedUrl,

      icon:
        "/icon.png",

      badge:
        "/icon.png",

      tag:
        tag ||
        `tots-${Date.now()}`,

      data: {
        url:
          cleanedUrl,

        ...(
          data ||
          {}
        ),
      },
    });

  let sent =
    0;

  let failed =
    0;

  let removed =
    0;

  // ==========================================================
  // SEND TO EACH OF THIS USER'S DEVICES
  // ==========================================================

  for (
    const subscription of
    subscriptions
  ) {
    try {
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
    } catch (
      error:
        any
    ) {
      failed +=
        1;

      console.error(
        "[TOTS PUSH] Delivery failed:",
        {
          subscriptionId:
            subscription.id,

          userId:
            cleanedUserId,

          statusCode:
            error?.statusCode,

          message:
            error?.message,
        }
      );

      // ======================================================
      // REMOVE EXPIRED / INVALID SUBSCRIPTIONS
      // ======================================================

      if (
        error?.statusCode ===
          404 ||
        error?.statusCode ===
          410
      ) {
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
          console.warn(
            "[TOTS PUSH] Could not remove expired subscription:",
            deleteError
          );
        } else {
          removed +=
            1;

          console.log(
            `[TOTS PUSH] Removed expired subscription ${subscription.id}.`
          );
        }
      }
    }
  }

  console.log(
    `[TOTS PUSH] User ${cleanedUserId}: sent ${sent}, failed ${failed}, removed ${removed}.`
  );

  return {
    sent,
    failed,
    removed,
  };
}