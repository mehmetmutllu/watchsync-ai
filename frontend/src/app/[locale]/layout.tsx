import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import ToastContainer from "@/components/ui/ToastContainer";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {NextIntlClientProvider} from 'next-intl';
import {getMessages, getTranslations} from 'next-intl/server';
import {routing} from '@/i18n/routing';
import {notFound} from 'next/navigation';
import "../globals.css";
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
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}>) {
  const {locale} = await params;
  
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();
  const t = await getTranslations("Common");

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${jetbrainsMono.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-midnight text-primary-text font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-accent-blue focus:text-white focus:text-sm"
        >
          {t("skip_to_content")}
        </a>
        <NextIntlClientProvider messages={messages}>
          {children}
          <ToastContainer />
          <ConfirmDialog />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
