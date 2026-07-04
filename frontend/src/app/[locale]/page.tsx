import Link from "next/link";
import type { Metadata } from "next";
import {
  Watch,
  Cpu,
  Globe,
  Zap,
  Shield,
  TrendingUp,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";

export const metadata: Metadata = {
  title: "WatchSync AI — AI-Powered Luxury Watch Inventory Management",
  description:
    "Lüks saat bayileri için yapay zeka destekli envanter yönetimi. eBay, Chrono24 ve Shopify ile çoklu kanal senkronizasyonu, AI görsel işleme, pazar istihbaratı.",
  alternates: {
    canonical: "https://watchsync.ai",
  },
};

export default function LandingPage() {
  const t = useTranslations("Landing");

  const features = [
    {
      icon: Cpu,
      title: t("f1_title"),
      description: t("f1_desc"),
    },
    {
      icon: Globe,
      title: t("f2_title"),
      description: t("f2_desc"),
    },
    {
      icon: Zap,
      title: t("f3_title"),
      description: t("f3_desc"),
    },
    {
      icon: Shield,
      title: t("f4_title"),
      description: t("f4_desc"),
    },
    {
      icon: TrendingUp,
      title: t("f5_title"),
      description: t("f5_desc"),
    },
    {
      icon: Watch,
      title: t("f6_title"),
      description: t("f6_desc"),
    },
  ];

  const stats = [
    { value: "50K+", label: t("stats_watches") },
    { value: "98.2%", label: t("stats_sync") },
    { value: "<200ms", label: t("stats_api") },
    { value: "3", label: t("stats_platforms") },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "WatchSync AI",
    applicationCategory: "BusinessApplication",
    description:
      "AI-powered B2B SaaS platform for luxury watch dealers. Multi-channel inventory sync, AI image processing, market intelligence.",
    url: "https://watchsync.ai",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "14-day free trial",
    },
  };

  return (
    <div className="min-h-screen bg-midnight text-primary-text overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent-blue/20 flex items-center justify-center">
            <Watch className="w-5 h-5 text-accent-blue" strokeWidth={1.5} />
          </div>
          <span className="text-lg font-bold tracking-tight">
            WatchSync<span className="text-accent-blue"> AI</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="#features"
            className="text-sm text-secondary-text hover:text-primary-text transition-colors duration-150 hidden sm:block"
          >
            {t("nav_features")}
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center h-9 px-4 rounded-lg bg-accent-blue text-white text-sm font-medium
              hover:bg-accent-blue-hover transition-colors duration-150"
          >
            {t("nav_start")}
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 lg:pt-28 lg:pb-36 px-6 lg:px-12 max-w-7xl mx-auto">
        {/* Background gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-accent-blue/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-accent-gold/5 blur-[100px] pointer-events-none" />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-blue/10 border border-accent-blue/20 mb-8">
            <span className="w-2 h-2 rounded-full bg-accent-blue animate-pulse-soft" />
            <span className="text-xs font-medium text-accent-blue">
              {t("hero_badge")}
            </span>
          </div>

          <h1 className="text-display sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
            {t("hero_title_1")}
            <br />
            <span className="text-accent-blue">
              {t("hero_title_2")}
            </span>
          </h1>

          <p className="mt-6 text-lg lg:text-xl text-secondary-text max-w-2xl mx-auto leading-relaxed">
            {t("hero_desc")}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-accent-blue text-white font-semibold
                hover:bg-accent-blue-hover shadow-lg shadow-accent-blue/25 hover:shadow-accent-blue/40
                transition-all duration-150"
            >
              {t("btn_trial")}
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-surface border border-border-subtle
                text-primary-text font-semibold hover:bg-surface-elevated hover:border-border-strong
                transition-all duration-150"
            >
              {t("btn_demo")}
            </Link>
          </div>

          {/* Trust row */}
          <div className="flex items-center justify-center gap-6 mt-12 text-xs text-disabled-text">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-semantic-success" strokeWidth={2} />
              {t("trust_1")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-semantic-success" strokeWidth={2} />
              {t("trust_2")}
            </span>
            <span className="inline-flex items-center gap-1.5 hidden sm:inline-flex">
              <CheckCircle className="w-3.5 h-3.5 text-semantic-success" strokeWidth={2} />
              {t("trust_3")}
            </span>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border-subtle bg-surface/30">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 divide-x divide-border-subtle">
          {stats.map((stat) => (
            <div key={stat.label} className="py-8 px-6 text-center">
              <p className="text-2xl lg:text-3xl font-bold font-mono text-accent-blue">
                {stat.value}
              </p>
              <p className="mt-1 text-xs uppercase tracking-wider text-secondary-text">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">
            {t("features_title")}{" "}
            <span className="text-accent-blue">{t("features_title_highlight")}</span>
          </h2>
          <p className="mt-4 text-secondary-text max-w-2xl mx-auto">
            {t("features_desc")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative glass glass-hover rounded-2xl p-8 overflow-hidden transition-all duration-300"
              >
                {/* Subtle background glow on hover */}
                <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-accent-blue/20 blur-[40px] pointer-events-none transition-opacity duration-500 opacity-0 group-hover:opacity-100" />
                
                <div className="relative z-10 w-11 h-11 rounded-xl bg-accent-blue/10 flex items-center justify-center mb-5
                  group-hover:bg-accent-blue/20 group-hover:scale-110 transition-all duration-300">
                  <Icon
                    className="w-5 h-5 text-accent-blue"
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="relative z-10 text-lg font-semibold text-primary-text mb-2 group-hover:text-white transition-colors">
                  {feature.title}
                </h3>
                <p className="relative z-10 text-sm text-secondary-text leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 lg:px-12">
        <div className="relative max-w-4xl mx-auto rounded-2xl bg-gradient-to-br from-accent-blue/10 via-surface to-accent-gold/5 border border-border-subtle p-12 lg:p-16 text-center overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-accent-blue/10 blur-[80px] pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              {t("cta_title")}
            </h2>
            <p className="text-secondary-text max-w-xl mx-auto mb-8">
              {t("cta_desc")}
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-accent-blue text-white font-semibold
                hover:bg-accent-blue-hover shadow-lg shadow-accent-blue/25
                transition-all duration-150"
            >
              {t("cta_btn")}
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-8 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Watch className="w-4 h-4 text-accent-blue" strokeWidth={1.5} />
            <span className="text-sm font-semibold">
              WatchSync<span className="text-accent-blue"> AI</span>
            </span>
          </div>
          <p className="text-xs text-disabled-text">
            {t("footer_rights")}
          </p>
        </div>
      </footer>
    </div>
  );
}
