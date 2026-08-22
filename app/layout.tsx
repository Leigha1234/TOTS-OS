import "./globals.css";

import {
  SettingsProvider,
} from "@/app/context/SettingsContext";

import ServiceWorkerRegister from "@/app/components/ServiceWorkerRegister";

import {
  Toaster,
} from "react-hot-toast";

import {
  Inter,
} from "next/font/google";

import type {
  Metadata,
  Viewport,
} from "next";

// ============================================================
// FONT
// ============================================================

const inter =
  Inter({
    subsets: [
      "latin",
    ],

    variable:
      "--font-inter",
  });

// ============================================================
// VIEWPORT
// ============================================================

export const viewport: Viewport =
  {
    width:
      "device-width",

    initialScale:
      1,

    maximumScale:
      1,

    viewportFit:
      "cover",

    themeColor:
      "#a9b897",
  };

// ============================================================
// METADATA
// ============================================================

export const metadata: Metadata =
  {
    title: {
      default:
        "TOTS-OS",

      template:
        "%s | TOTS-OS",
    },

    description:
      "All in one productivity suite for the modern business.",

    applicationName:
      "TOTS-OS",

    manifest:
      "/manifest.webmanifest",

    // ========================================================
    // APPLE / IOS PWA
    // ========================================================

    appleWebApp: {
      capable:
        true,

      title:
        "TOTS-OS",

      statusBarStyle:
        "default",
    },

    // ========================================================
    // ICONS
    // ========================================================

    icons: {
      icon: [
        {
          url:
            "/icon.png?v=4",

          type:
            "image/png",

          sizes:
            "1024x1024",
        },

        {
          url:
            "/icons/icon-192.png",

          type:
            "image/png",

          sizes:
            "192x192",
        },

        {
          url:
            "/icons/icon-512.png",

          type:
            "image/png",

          sizes:
            "512x512",
        },
      ],

      shortcut:
        "/icon.png?v=4",

      apple: [
        {
          url:
            "/icons/icon-192.png",

          sizes:
            "192x192",

          type:
            "image/png",
        },
      ],
    },

    // ========================================================
    // EXTRA APP METADATA
    // ========================================================

    other: {
      "mobile-web-app-capable":
        "yes",

      "apple-mobile-web-app-capable":
        "yes",

      "apple-mobile-web-app-status-bar-style":
        "default",

      "apple-mobile-web-app-title":
        "TOTS-OS",
    },
  };

// ============================================================
// ROOT LAYOUT
// ============================================================

export default function RootLayout({
  children,
}: Readonly<{
  children:
    React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <head>
        {/* ==================================================
            FAVICON
        ================================================== */}

        <link
          rel="icon"
          type="image/png"
          href="/icon.png?v=4"
        />

        <link
          rel="shortcut icon"
          type="image/png"
          href="/icon.png?v=4"
        />

        {/* ==================================================
            PWA / APP
        ================================================== */}

        <link
          rel="manifest"
          href="/manifest.webmanifest"
        />

        <link
          rel="apple-touch-icon"
          href="/icons/icon-192.png"
        />

        <meta
          name="mobile-web-app-capable"
          content="yes"
        />

        <meta
          name="apple-mobile-web-app-capable"
          content="yes"
        />

        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="default"
        />

        <meta
          name="apple-mobile-web-app-title"
          content="TOTS-OS"
        />

        <meta
          name="theme-color"
          content="#a9b897"
        />

        {/* ==================================================
            TIKTOK PIXEL
        ================================================== */}

        <script
          id="tiktok-pixel"
          dangerouslySetInnerHTML={{
            __html: `
              !function (w, d, t) {
                w.TiktokAnalyticsObject = t;

                var ttq = w[t] = w[t] || [];

                ttq.methods = [
                  "page",
                  "track",
                  "identify",
                  "instances",
                  "debug",
                  "on",
                  "off",
                  "once",
                  "ready",
                  "alias",
                  "group",
                  "enableCookie",
                  "disableCookie",
                  "holdConsent",
                  "revokeConsent",
                  "grantConsent"
                ];

                ttq.setAndDefer = function (target, method) {
                  target[method] = function () {
                    target.push(
                      [method].concat(
                        Array.prototype.slice.call(
                          arguments,
                          0
                        )
                      )
                    );
                  };
                };

                for (
                  var i = 0;
                  i < ttq.methods.length;
                  i++
                ) {
                  ttq.setAndDefer(
                    ttq,
                    ttq.methods[i]
                  );
                }

                ttq.instance = function (pixelId) {
                  var instance =
                    ttq._i[pixelId] || [];

                  for (
                    var i = 0;
                    i < ttq.methods.length;
                    i++
                  ) {
                    ttq.setAndDefer(
                      instance,
                      ttq.methods[i]
                    );
                  }

                  return instance;
                };

                ttq.load = function (pixelId, options) {
                  var url =
                    "https://analytics.tiktok.com/i18n/pixel/events.js";

                  ttq._i =
                    ttq._i || {};

                  ttq._i[pixelId] =
                    [];

                  ttq._i[pixelId]._u =
                    url;

                  ttq._t =
                    ttq._t || {};

                  ttq._t[pixelId] =
                    +new Date();

                  ttq._o =
                    ttq._o || {};

                  ttq._o[pixelId] =
                    options || {};

                  var script =
                    document.createElement(
                      "script"
                    );

                  script.type =
                    "text/javascript";

                  script.async =
                    true;

                  script.src =
                    url +
                    "?sdkid=" +
                    pixelId +
                    "&lib=" +
                    t;

                  var firstScript =
                    document.getElementsByTagName(
                      "script"
                    )[0];

                  firstScript.parentNode.insertBefore(
                    script,
                    firstScript
                  );
                };

                ttq.load(
                  "DA46CLRC77U4BICJ0VF0"
                );

                ttq.page();
              }(
                window,
                document,
                "ttq"
              );
            `,
          }}
        />
      </head>

      <body
        className={`${inter.variable} antialiased selection:bg-[#a9b897]/30`}
      >
        {/* ==================================================
            SERVICE WORKER
        ================================================== */}

        <ServiceWorkerRegister />

        {/* ==================================================
            APP
        ================================================== */}

        <SettingsProvider>
          {children}
        </SettingsProvider>

        {/* ==================================================
            TOASTS
        ================================================== */}

        <Toaster />
      </body>
    </html>
  );
}