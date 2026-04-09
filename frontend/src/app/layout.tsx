import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import ToastContainer from "@/components/ui/ToastContainer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://watchsync.ai"),
  title: {
    default: "WatchSync AI — Luxury Watch Inventory Management",
    template: "%s | WatchSync AI",
  },
  description:
    "AI-powered B2B SaaS platform for luxury watch dealers. Multi-channel inventory sync, AI image processing, market intelligence.",
  keywords: [
    "luxury watches",
    "inventory management",
    "AI",
    "eBay",
    "Chrono24",
    "Shopify",
  ],
  openGraph: {
    title: "WatchSync AI — Luxury Watch Inventory Management",
    description:
      "AI-powered B2B SaaS platform for luxury watch dealers. Multi-channel inventory sync, AI image processing, market intelligence.",
    url: "https://watchsync.ai",
    siteName: "WatchSync AI",
    type: "website",
    locale: "tr_TR",
  },
  twitter: {
    card: "summary_large_image",
    title: "WatchSync AI",
    description:
      "AI-powered B2B SaaS for luxury watch dealers.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${inter.variable} ${jetbrainsMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-midnight text-primary-text font-sans">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
