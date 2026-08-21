import "./globals.css";

import { SettingsProvider } from "@/app/context/SettingsContext";
import { Toaster } from "react-hot-toast";
import { Inter } from "next/font/google";
import type { Metadata } from "next";

// ============================================================
// FONT
// ============================================================

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// ============================================================
// METADATA
// ============================================================

export const metadata: Metadata = {
  title: "TOTS-OS",

  description:
    "All in one productivity suite for the modern business.",

  icons: {
    icon: [
      {
        url: "/icon.png?v=4",
        type: "image/png",
        sizes: "1024x1024",
      },
    ],

    shortcut: "/icon.png?v=4",

    apple: [
      {
        url: "/icon.png?v=4",
        sizes: "1024x1024",
        type: "image/png",
      },
    ],
  },
};

// ============================================================
// ROOT LAYOUT
// ============================================================

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <head>
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

        <link
          rel="apple-touch-icon"
          href="/icon.png?v=4"
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

                  ttq._i = ttq._i || {};
                  ttq._i[pixelId] = [];
                  ttq._i[pixelId]._u = url;

                  ttq._t = ttq._t || {};
                  ttq._t[pixelId] = +new Date();

                  ttq._o = ttq._o || {};
                  ttq._o[pixelId] =
                    options || {};

                  var script =
                    document.createElement(
                      "script"
                    );

                  script.type =
                    "text/javascript";

                  script.async = true;

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
        <SettingsProvider>
          {children}
        </SettingsProvider>

        <Toaster />
      </body>
    </html>
  );
}