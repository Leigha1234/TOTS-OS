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
};

// ============================================================
// SEND
// ============================================================

export async function sendPushNotification({
  organisationId,
  title,
  body,
  url =
    "/dashboard",
  tag,
}: SendPushOptions) {
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
  // SUBSCRIPTIONS
  // ==========================================================

  const {
    data:
      subscriptions,

    error,
  } =
    await supabaseAdmin
      .from(
        "push_subscriptions"
      )
      .select(
        `
          id,
          endpoint,
          p256dh,
          auth
        `
      )
      .eq(
        "organisation_id",
        organisationId
      );

  if (error) {
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
      `[TOTS PUSH] No subscriptions for organisation ${organisationId}.`
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
      title,

      body,

      url,

      icon:
        "/icon.png",

      badge:
        "/icon.png",

      tag:
        tag ||
        `tots-${Date.now()}`,
    });

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
        error
      );

      // ======================================================
      // REMOVE EXPIRED SUBSCRIPTIONS
      // ======================================================

      if (
        error
          ?.statusCode ===
          404 ||
        error
          ?.statusCode ===
          410
      ) {
        await supabaseAdmin
          .from(
            "push_subscriptions"
          )
          .delete()
          .eq(
            "id",
            subscription.id
          );

        console.log(
          `[TOTS PUSH] Removed expired subscription ${subscription.id}.`
        );
      }
    }
  }

  console.log(
    `[TOTS PUSH] Sent ${sent}, failed ${failed}.`
  );

  return {
    sent,
    failed,
  };
}