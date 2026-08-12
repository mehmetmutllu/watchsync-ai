import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Archivo, Noto_Sans_Arabic } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import ToastContainer from "@/components/ui/ToastContainer";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { routing } from "@/i18n/routing";
import { locales, getDirection, getBcp47 } from "@/i18n/config";
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

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

// Arapça glifleri Inter'de yok — ayrı bir yüz yüklenir ve yalnızca dir="rtl"
// sayfalarda gövde fontu olarak devreye girer.
const notoArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });

  const languages = Object.fromEntries(
    locales.map((l) => [getBcp47(l), `/${l}`])
  );

  return {
    metadataBase: new URL("https://watchsync.ai"),
    title: {
      default: t("title_default"),
      template: t("title_template"),
    },
    description: t("description"),
    keywords: t("keywords").split("|").map((k) => k.trim()),
    alternates: {
      canonical: `/${locale}`,
      languages: { ...languages, "x-default": `/${routing.defaultLocale}` },
    },
    openGraph: {
      title: t("title_default"),
      description: t("description"),
      url: `https://watchsync.ai/${locale}`,
      siteName: "WatchSync AI",
      type: "website",
      locale: getBcp47(locale).replace("-", "_"),
      alternateLocale: locales
        .filter((l) => l !== locale)
        .map((l) => getBcp47(l).replace("-", "_")),
    },
    twitter: {
      card: "summary_large_image",
      title: "WatchSync AI",
      description: t("description_short"),
    },
    robots: { index: true, follow: true },
    icons: { icon: "/icon.svg", apple: "/icon.svg" },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Statik render için isteğin dilini sabitle (next-intl v4).
  setRequestLocale(locale);

  const dir = getDirection(locale);
  const t = await getTranslations("Common");

  return (
    <html
      lang={locale}
      dir={dir}
      data-locale={locale}
      className={`${inter.variable} ${jetbrainsMono.variable} ${archivo.variable} ${notoArabic.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-midnight text-primary-text font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:start-4 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-accent-blue focus:text-white focus:text-sm"
        >
          {t("skip_to_content")}
        </a>
        <NextIntlClientProvider>
          {children}
          <ToastContainer />
          <ConfirmDialog />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
