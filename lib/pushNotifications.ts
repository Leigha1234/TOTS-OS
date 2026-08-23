import {
  supabase,
} from "@/lib/supabase";

// ============================================================
// BASE64 → UINT8ARRAY
// ============================================================

function urlBase64ToUint8Array(
  base64String:
    string
) {
  const padding =
    "=".repeat(
      (
        4 -
        (
          base64String.length %
          4
        )
      ) %
        4
    );

  const base64 =
    (
      base64String +
      padding
    )
      .replace(
        /-/g,
        "+"
      )
      .replace(
        /_/g,
        "/"
      );

  const rawData =
    window.atob(
      base64
    );

  return Uint8Array.from(
    [...rawData].map(
      (
        character
      ) =>
        character.charCodeAt(
          0
        )
    )
  );
}

// ============================================================
// ENABLE PUSH NOTIFICATIONS
// ============================================================

export async function enablePushNotifications() {
  if (
    typeof window ===
    "undefined"
  ) {
    throw new Error(
      "Push notifications must be enabled in a browser."
    );
  }

  if (
    !(
      "serviceWorker" in
      navigator
    )
  ) {
    throw new Error(
      "Service workers are not supported on this device."
    );
  }

  if (
    !(
      "PushManager" in
      window
    )
  ) {
    throw new Error(
      "Push notifications are not supported on this device."
    );
  }

  if (
    !(
      "Notification" in
      window
    )
  ) {
    throw new Error(
      "Notifications are not supported on this device."
    );
  }

  // ==========================================================
  // ASK PERMISSION
  // ==========================================================

  const permission =
    await Notification.requestPermission();

  if (
    permission !==
    "granted"
  ) {
    throw new Error(
      "Notification permission was not granted."
    );
  }

  // ==========================================================
  // REGISTER SERVICE WORKER
  // ==========================================================

  const registration =
    await navigator
      .serviceWorker
      .register(
        "/sw.js",
        {
          scope:
            "/",
        }
      );

  await navigator
    .serviceWorker
    .ready;

  // ==========================================================
  // EXISTING SUBSCRIPTION
  // ==========================================================

  let subscription =
    await registration
      .pushManager
      .getSubscription();

  // ==========================================================
  // CREATE SUBSCRIPTION
  // ==========================================================

  if (
    !subscription
  ) {
    const publicKey =
      process.env
        .NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (
      !publicKey
    ) {
      throw new Error(
        "TOTS-OS push notifications are not configured."
      );
    }

    subscription =
      await registration
        .pushManager
        .subscribe({
          userVisibleOnly:
            true,

          applicationServerKey:
            urlBase64ToUint8Array(
              publicKey
            ),
        });
  }

  // ==========================================================
  // SESSION
  // ==========================================================

  const {
    data:
      sessionData,
  } =
    await supabase
      .auth
      .getSession();

  const accessToken =
    sessionData
      ?.session
      ?.access_token;

  if (
    !accessToken
  ) {
    throw new Error(
      "You must be signed in to enable push notifications."
    );
  }

  // ==========================================================
  // SAVE TO SERVER
  // ==========================================================

  const response =
    await fetch(
      "/api/push/subscribe",
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${accessToken}`,
        },

        body:
          JSON.stringify({
            subscription:
              subscription.toJSON(),
          }),
      }
    );

  const result =
    await response.json();

  if (
    !response.ok
  ) {
    throw new Error(
      result.error ||
      "Push subscription could not be saved."
    );
  }

  return {
    registration,
    subscription,
    result,
  };
}