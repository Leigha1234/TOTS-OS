// ============================================================
// TOTS-OS SERVICE WORKER
// ============================================================

const CACHE_NAME = "tots-os-v1";

// ============================================================
// INSTALL
// ============================================================

self.addEventListener("install", () => {
  console.log("[TOTS SW] Installed");

  self.skipWaiting();
});

// ============================================================
// ACTIVATE
// ============================================================

self.addEventListener("activate", (event) => {
  console.log("[TOTS SW] Activated");

  event.waitUntil(
    self.clients.claim()
  );
});

// ============================================================
// PUSH NOTIFICATION
// ============================================================

self.addEventListener("push", (event) => {
  console.log("[TOTS SW] Push received");

  let data = {};

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (error) {
    console.error(
      "[TOTS SW] Could not parse push:",
      error
    );

    data = {
      title: "TOTS-OS",
      body: event.data
        ? event.data.text()
        : "You have a new notification.",
    };
  }

  const title =
    data.title ||
    "TOTS-OS";

  const options = {
    body:
      data.body ||
      data.message ||
      "You have a new business update.",

    icon:
      data.icon ||
      "/icon.png",

    badge:
      data.badge ||
      "/icon.png",

    tag:
      data.tag ||
      `tots-${Date.now()}`,

    renotify: true,

    data: {
      url:
        data.url ||
        data.link ||
        "/dashboard",

      ...(data.data || {}),
    },
  };

  event.waitUntil(
    self.registration.showNotification(
      title,
      options
    )
  );
});

// ============================================================
// CLICK NOTIFICATION
// ============================================================

self.addEventListener(
  "notificationclick",
  (event) => {
    console.log(
      "[TOTS SW] Notification clicked"
    );

    event.notification.close();

    const targetUrl =
      event.notification.data?.url ||
      "/dashboard";

    event.waitUntil(
      self.clients
        .matchAll({
          type: "window",
          includeUncontrolled: true,
        })
        .then((clients) => {
          for (const client of clients) {
            if (
              "focus" in client
            ) {
              client.navigate(
                targetUrl
              );

              return client.focus();
            }
          }

          if (
            self.clients.openWindow
          ) {
            return self.clients.openWindow(
              targetUrl
            );
          }
        })
    );
  }
);