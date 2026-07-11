import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import WatchScrollytelling from "@/components/landing/WatchScrollytelling";
import Reveal from "@/components/landing/Reveal";
import "./landing.css";

export const metadata: Metadata = {
  title: "WatchSync AI — AI-Powered Luxury Watch Inventory Management",
  description:
    "Lüks saat bayileri için yapay zeka destekli envanter yönetimi. eBay, Chrono24 ve Shopify ile çoklu kanal senkronizasyonu, AI görsel işleme, pazar istihbaratı.",
  alternates: { canonical: "https://watchsync.ai" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "WatchSync AI",
  applicationCategory: "BusinessApplication",
  description:
    "AI-powered B2B SaaS platform for luxury watch dealers. Multi-channel inventory sync, AI image processing, market intelligence.",
  url: "https://watchsync.ai",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "14-day free trial" },
};

export default async function LandingPage() {
  const t = await getTranslations("Landing");

  const steps = [
    { k: "01", title: t("step1_t"), desc: t("step1_d") },
    { k: "02", title: t("step2_t"), desc: t("step2_d") },
    { k: "03", title: t("step3_t"), desc: t("step3_d") },
  ];

  const caps = [
    { k: "01", part: t("part_dial"), title: t("f1_title"), desc: t("f1_desc"), meta: "SAM 2 · Studio-grade", img: "/media/scrolly/exploded.jpg" },
    { k: "02", part: t("part_movement"), title: t("f4_title"), desc: t("f4_desc"), meta: "Redis mutex · Per-SKU", img: "/media/scrolly/back.jpg" },
    { k: "03", part: t("part_crown"), title: t("f5_title"), desc: t("f5_desc"), meta: "Chrono24 · Watchfinder", img: "/media/scrolly/angle.jpg" },
  ];

  const platforms = ["eBay", "Chrono24", "Shopify"];

  const metrics = [
    { value: "50K+", label: t("stats_watches") },
    { value: "98.2", unit: "%", label: t("stats_sync") },
    { value: "<200", unit: "ms", label: t("stats_api") },
    { value: "3", label: t("stats_platforms") },
  ];

  const trust = [
    { k: "01", title: t("trust_point1_t"), desc: t("trust_point1_d") },
    { k: "02", title: t("trust_point2_t"), desc: t("trust_point2_d") },
    { k: "03", title: t("trust_point3_t"), desc: t("trust_point3_d") },
  ];

  return (
    <div className="ws-landing min-h-screen">
      <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('ws-js')" }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ============ Nav ============ */}
      <nav className="fixed inset-x-0 top-0 z-30 mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-12">
        <div className="flex items-center gap-3">
          <WatchMark />
          <span className="ws-display text-base tracking-tight">WatchSync</span>
          <span className="ws-mono text-[10px] tracking-[0.25em]" style={{ color: "var(--ws-text-faint)" }}>
            AI
          </span>
        </div>
        <div className="flex items-center gap-5">
          <Link
            href="#how"
            className="ws-mono hidden text-xs tracking-[0.15em] uppercase sm:block"
            style={{ color: "var(--ws-text-dim)" }}
          >
            {t("nav_features")}
          </Link>
          <Link
            href="#pricing"
            className="ws-mono hidden text-xs tracking-[0.15em] uppercase sm:block"
            style={{ color: "var(--ws-text-dim)" }}
          >
            {t("nav_pricing")}
          </Link>
          <Link href="/login" className="ws-btn ws-btn-ghost !h-9 !px-4 text-sm">
            {t("nav_start")}
          </Link>
        </div>
      </nav>

      {/* ============ Scroll-scrubbed keyframe hero ============ */}
      <WatchScrollytelling />

      {/* ============ Manifesto ============ */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-28 lg:px-12 lg:py-40">
        <Reveal>
          <p className="ws-display text-3xl leading-[1.15] sm:text-4xl lg:text-5xl">
            {t("manifesto_1")}{" "}
            <span style={{ color: "var(--ws-text-faint)" }}>{t("manifesto_2")}</span>
          </p>
        </Reveal>
      </section>

      {/* ============ How it works ============ */}
      <section id="how" className="relative z-10 border-t border-[var(--ws-line)]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-12">
          <Reveal className="max-w-2xl">
            <span className="ws-eyebrow">{t("how_kicker")}</span>
            <h2 className="ws-display mt-5 text-3xl lg:text-5xl">{t("how_title")}</h2>
          </Reveal>

          <div className="mt-16 grid gap-px bg-[var(--ws-line)] md:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal
                key={s.k}
                delay={(Math.min(i + 1, 3) as 1 | 2 | 3)}
                className="bg-[var(--ws-bg)] p-8 lg:p-10"
              >
                <div className="flex items-baseline justify-between">
                  <span className="ws-step-index">{s.k}</span>
                  {i < steps.length - 1 && (
                    <ArrowRight className="h-4 w-4" style={{ color: "var(--ws-line-strong)" }} strokeWidth={1.5} />
                  )}
                </div>
                <h3 className="ws-display mt-6 text-2xl">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--ws-text-dim)" }}>
                  {s.desc}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Product tour — real screenshots in browser chrome ============ */}
      <section className="relative z-10 border-t border-[var(--ws-line)]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-12">
          <Reveal className="max-w-2xl">
            <span className="ws-eyebrow">{t("prod_kicker")}</span>
            <h2 className="ws-display mt-5 text-3xl lg:text-5xl">{t("prod_title")}</h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed" style={{ color: "var(--ws-text-dim)" }}>
              {t("prod_desc")}
            </p>
          </Reveal>

          <div className="mt-16 grid gap-12 lg:grid-cols-12 lg:gap-10">
            <Reveal className="lg:col-span-7">
              <BrowserShot url="app.watchsync.ai/dashboard" src="/media/product/shot-dashboard.webp" alt={t("prod_shot1_t")} />
              <ShotCaption k="01" title={t("prod_shot1_t")} desc={t("prod_shot1_d")} />
            </Reveal>
            <Reveal delay={2} className="lg:col-span-5 lg:mt-28">
              <BrowserShot url="app.watchsync.ai/inventory" src="/media/product/shot-inventory.webp" alt={t("prod_shot2_t")} />
              <ShotCaption k="02" title={t("prod_shot2_t")} desc={t("prod_shot2_d")} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ Capabilities — alternating rows ============ */}
      <section className="relative z-10 border-t border-[var(--ws-line)]">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:px-12">
          <Reveal className="max-w-2xl">
            <span className="ws-eyebrow">{t("cap_kicker")}</span>
            <h2 className="ws-display mt-5 text-3xl lg:text-5xl">{t("cap_title")}</h2>
          </Reveal>

          <div className="mt-16 flex flex-col gap-16 lg:gap-24">
            {caps.map((c, i) => (
              <Reveal key={c.k} className="grid items-center gap-8 lg:grid-cols-2">
                <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                  <span className="ws-cap-index">{c.k}</span>
                  <p className="ws-mono mt-2 text-[11px] tracking-[0.2em] uppercase" style={{ color: "var(--ws-amber-dim)" }}>
                    {c.part}
                  </p>
                  <h3 className="ws-display mt-3 text-2xl lg:text-3xl">{c.title}</h3>
                  <p className="mt-4 max-w-md text-base leading-relaxed" style={{ color: "var(--ws-text-dim)" }}>
                    {c.desc}
                  </p>
                  <p className="ws-mono mt-5 text-[11px] tracking-[0.15em]" style={{ color: "var(--ws-text-faint)" }}>
                    {c.meta}
                  </p>
                </div>
                <div className={`ws-frame aspect-[4/3] overflow-hidden ${i % 2 === 1 ? "lg:order-1" : ""}`}>
                  <img
                    className="h-full w-full object-cover opacity-70"
                    src={c.img}
                    alt=""
                    loading="lazy"
                    aria-hidden
                  />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Platform sync — node diagram ============ */}
      <section className="relative z-10 border-t border-[var(--ws-line)]">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:px-12">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="ws-eyebrow">{t("sync_kicker")}</span>
            <h2 className="ws-display mt-5 text-3xl lg:text-4xl">{t("sync_title")}</h2>
            <p className="mt-5 text-base leading-relaxed" style={{ color: "var(--ws-text-dim)" }}>
              {t("sync_desc")}
            </p>
          </Reveal>

          <Reveal delay={1} className="mt-16">
            <div className="flex flex-col items-center gap-8 lg:flex-row lg:justify-between lg:gap-6">
              <div className="grid w-full max-w-md gap-3 lg:flex-1">
                {platforms.map((p) => (
                  <div key={p} className="ws-node flex items-center justify-between rounded-sm px-5 py-4">
                    <span className="ws-display text-lg">{p}</span>
                    <span className="ws-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: "var(--ws-amber-dim)" }}>
                      {t("sync_channel")}
                    </span>
                  </div>
                ))}
              </div>
              <div className="hidden flex-1 items-center justify-center lg:flex" aria-hidden>
                <svg viewBox="0 0 200 160" className="w-full max-w-[220px]" fill="none">
                  <path d="M0 30 C90 30 90 80 190 80" stroke="var(--ws-line-strong)" strokeWidth="1" />
                  <path d="M0 80 H190" stroke="var(--ws-amber)" strokeWidth="1.25" strokeDasharray="3 4" />
                  <path d="M0 130 C90 130 90 80 190 80" stroke="var(--ws-line-strong)" strokeWidth="1" />
                </svg>
              </div>
              <div className="ws-frame flex w-full max-w-md items-center gap-4 p-5 lg:flex-1">
                <div className="w-full">
                  <p className="ws-display text-lg">{t("sync_hub")}</p>
                  <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--ws-text-dim)" }}>
                    {t("sync_hub_desc")}
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ Metrics ============ */}
      <section className="relative z-10 border-y border-[var(--ws-line)]">
        <Reveal>
          <div className="mx-auto grid max-w-6xl grid-cols-2 lg:grid-cols-4">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="border-b border-[var(--ws-line)] px-6 py-9 lg:border-b-0 lg:border-r lg:last:border-r-0"
              >
                <p className="ws-gauge-value">
                  {m.value}
                  {m.unit ? <em>{m.unit}</em> : null}
                </p>
                <p className="ws-mono mt-2 text-[11px] tracking-[0.18em] uppercase" style={{ color: "var(--ws-text-faint)" }}>
                  {m.label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ============ Trust ============ */}
      <section className="relative z-10">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:px-12">
          <Reveal className="max-w-2xl">
            <span className="ws-eyebrow">{t("trust_kicker")}</span>
            <h2 className="ws-display mt-5 text-3xl lg:text-4xl">{t("trust_title")}</h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed" style={{ color: "var(--ws-text-dim)" }}>
              {t("trust_desc")}
            </p>
          </Reveal>

          <div className="mt-14 grid gap-px bg-[var(--ws-line)] lg:grid-cols-3">
            {trust.map((item, i) => (
              <Reveal key={item.k} delay={(Math.min(i + 1, 3) as 1 | 2 | 3)} className="bg-[var(--ws-bg)] p-8">
                <span className="ws-mono text-xs tracking-[0.2em]" style={{ color: "var(--ws-amber)" }}>
                  {item.k}
                </span>
                <h3 className="ws-display mt-4 text-xl">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--ws-text-dim)" }}>
                  {item.desc}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Pricing ============ */}
      <section id="pricing" className="relative z-10 border-t border-[var(--ws-line)]">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:px-12">
          <Reveal className="max-w-2xl">
            <span className="ws-eyebrow">{t("pricing_kicker")}</span>
            <h2 className="ws-display mt-5 text-3xl lg:text-5xl">{t("pricing_title")}</h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed" style={{ color: "var(--ws-text-dim)" }}>
              {t("pricing_desc")}
            </p>
          </Reveal>

          <div className="mt-14 grid gap-px bg-[var(--ws-line)] lg:grid-cols-2">
            <Reveal className="bg-[var(--ws-bg)] p-8 lg:p-12">
              <p className="ws-mono text-[11px] tracking-[0.2em] uppercase" style={{ color: "var(--ws-amber-dim)" }}>
                {t("plan1_name")}
              </p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="ws-display text-5xl">{t("plan1_price")}</span>
                <span className="text-sm" style={{ color: "var(--ws-text-dim)" }}>{t("plan1_period")}</span>
              </div>
              <p className="mt-2 text-sm" style={{ color: "var(--ws-text-faint)" }}>{t("plan1_note")}</p>
              <ul className="mt-8 flex flex-col gap-3">
                {["plan1_f1", "plan1_f2", "plan1_f3", "plan1_f4", "plan1_f5"].map((k) => (
                  <li key={k} className="flex items-baseline gap-3 text-sm" style={{ color: "var(--ws-text-dim)" }}>
                    <span className="ws-mono text-[10px]" style={{ color: "var(--ws-amber)" }}>—</span>
                    {t(k)}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="ws-btn ws-btn-primary mt-10">
                {t("plan1_cta")}
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </Reveal>

            <Reveal delay={2} className="bg-[var(--ws-bg)] p-8 lg:p-12">
              <p className="ws-mono text-[11px] tracking-[0.2em] uppercase" style={{ color: "var(--ws-text-faint)" }}>
                {t("plan2_name")}
              </p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="ws-display text-5xl">{t("plan2_price")}</span>
              </div>
              <p className="mt-2 text-sm" style={{ color: "var(--ws-text-faint)" }}>{t("plan2_note")}</p>
              <ul className="mt-8 flex flex-col gap-3">
                {["plan2_f1", "plan2_f2", "plan2_f3"].map((k) => (
                  <li key={k} className="flex items-baseline gap-3 text-sm" style={{ color: "var(--ws-text-dim)" }}>
                    <span className="ws-mono text-[10px]" style={{ color: "var(--ws-line-strong)" }}>—</span>
                    {t(k)}
                  </li>
                ))}
              </ul>
              <a href="mailto:hello@watchsync.ai" className="ws-btn ws-btn-ghost mt-10">
                {t("plan2_cta")}
              </a>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="relative z-10 border-t border-[var(--ws-line)]">
        <div className="mx-auto max-w-4xl px-6 py-24 lg:px-12">
          <Reveal>
            <span className="ws-eyebrow">{t("faq_kicker")}</span>
            <h2 className="ws-display mt-5 text-3xl lg:text-4xl">{t("faq_title")}</h2>
          </Reveal>
          <Reveal delay={1} className="mt-12">
            {[1, 2, 3, 4, 5].map((n) => (
              <details key={n} className="ws-faq">
                <summary>
                  <span>{t(`faq${n}_q`)}</span>
                  <span className="ws-faq-mark ws-mono" aria-hidden>+</span>
                </summary>
                <p>{t(`faq${n}_a`)}</p>
              </details>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ============ CTA with ambient video ============ */}
      <section className="relative z-10 px-6 py-24 lg:px-12">
        <Reveal className="mx-auto max-w-5xl">
          <div className="ws-frame relative overflow-hidden px-8 py-20 text-center lg:px-16 lg:py-28">
            <img className="ws-ambient" src="/media/scrolly/back.jpg" alt="" loading="lazy" aria-hidden />
            <div className="relative z-10">
              <h2 className="ws-display mx-auto max-w-2xl text-3xl lg:text-5xl">{t("cta_title")}</h2>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed" style={{ color: "var(--ws-text-dim)" }}>
                {t("cta_desc")}
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/register" className="ws-btn ws-btn-primary">
                  {t("cta_btn")}
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </Link>
                <Link href="/login" className="ws-btn ws-btn-ghost">
                  {t("nav_start")}
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ============ Footer ============ */}
      <footer className="relative z-10 border-t border-[var(--ws-line)] px-6 py-10 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <WatchMark />
            <span className="ws-display text-sm">WatchSync AI</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/impressum" className="ws-mono text-[11px] tracking-[0.1em]" style={{ color: "var(--ws-text-dim)" }}>
              {t("footer_imprint")}
            </Link>
            <Link href="/datenschutz" className="ws-mono text-[11px] tracking-[0.1em]" style={{ color: "var(--ws-text-dim)" }}>
              {t("footer_privacy")}
            </Link>
            <p className="ws-mono text-[11px]" style={{ color: "var(--ws-text-faint)" }}>
              {t("footer_rights")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function BrowserShot({ url, src, alt }: { url: string; src: string; alt: string }) {
  return (
    <div className="ws-shot">
      <div className="ws-shot-bar">
        <span className="ws-shot-dot" data-amber />
        <span className="ws-shot-dot" />
        <span className="ws-shot-dot" />
        <span className="ws-shot-url ws-mono">{url}</span>
      </div>
      <img src={src} alt={alt} loading="lazy" />
    </div>
  );
}

function ShotCaption({ k, title, desc }: { k: string; title: string; desc: string }) {
  return (
    <div className="mt-5 flex items-baseline gap-4">
      <span className="ws-mono text-[11px] tracking-[0.2em]" style={{ color: "var(--ws-amber-dim)" }}>
        {k}
      </span>
      <div>
        <p className="ws-display text-lg">{title}</p>
        <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--ws-text-dim)" }}>
          {desc}
        </p>
      </div>
    </div>
  );
}

function WatchMark() {
  return (
    <span
      className="flex h-8 w-8 items-center justify-center rounded-sm"
      style={{ border: "1px solid var(--ws-line-strong)" }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
        <circle cx="12" cy="12" r="7" stroke="var(--ws-steel)" strokeWidth="1.4" />
        <path d="M12 12 V8" stroke="var(--ws-amber)" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M12 12 L15 13.5" stroke="var(--ws-text)" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="12" cy="12" r="1" fill="var(--ws-amber)" />
      </svg>
    </span>
  );
}
