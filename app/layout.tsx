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