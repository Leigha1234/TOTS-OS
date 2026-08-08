import "./globals.css"; // The design system foundation
import { SettingsProvider } from "@/app/context/SettingsContext";
import { Toaster } from "react-hot-toast";
import { Inter, Poppins } from "next/font/google";

// Pre-loading fonts to prevent layout shift
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "TOTS-OS",
  description: "Infrastructure for clarity and growth",
  icons: {
    icon: [
      {
        url: "/images/tots-os%20favicon.png",
        type: "image/png",
      },
    ],
    shortcut: "/images/tots-os%20favicon.png",
    apple: "/images/tots-os%20favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased selection:bg-[#a9b897]/30`}>
        {/* Wrapping everything in SettingsProvider here ensures that 
            user preferences (colors, fonts, nav) are loaded once 
            and persist during navigation across ALL pages.
        */}
        <SettingsProvider>
          {children}
        </SettingsProvider>

        <Toaster />
      </body>
    </html>
  );
}